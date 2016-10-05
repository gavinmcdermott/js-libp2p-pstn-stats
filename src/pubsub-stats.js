'use strict'

const R = require('ramda')

const { log, PUBLISH_EVENT, RECEIVE_EVENT, SUBSCRIBE_EVENT, UNSUBSCRIBE_EVENT } = require('./config')
const { StatsError } = require('./errors')

const forEachIndexed = R.addIndex(R.forEach)

 module.exports = class PubsubStats {
  constructor (log) {
    this.log = log
    this.eventLog = generateEvents(log.toString())
    this.topicLog = generateSynopsis(this.eventLog)
    this.stats = generateStats(this.topicLog)
  }
}

function generateStats (topics) {
  let result = {}

  R.mapObjIndexed((messages, topicKey) => {
    result[topicKey] = {}

    R.mapObjIndexed((msgEvent, msgKey) => {
      if (msgKey === 'subscribers') return null

      result[topicKey][msgKey] = {
        traverseTime: msgEvent.exit ? (msgEvent.exit - msgEvent.enter) : null
      }
    }, messages)

  }, topics)

  return result
}

function generateSynopsis (logs) {
  let publications = {}

  forEachIndexed((log, idx) => {
    const msg = log.msg
    const type = log.type
    const topic = log.topic
    const source = log.source
    const timestamp = log.timestamp

    switch (type) {
      case SUBSCRIBE_EVENT:
        // NEW TOPIC IN NETWORK
        if (R.isNil(publications[topic])) {
          publications[topic] = {
            subscribers: []
          }
        }

        publications[topic].subscribers.push(source)
        break

      case UNSUBSCRIBE_EVENT:
        // Handle empty case
        if (R.isNil(publications[topic])) {
          publications[topic] = {
            subscribers: []
          }
        }

        const idx = R.indexOf(source, publications[topic].subscribers)
        if (idx) {
          publications[topic].subscribers.splice(idx, 1)
        }
        break

      case PUBLISH_EVENT:
        // NEW TOPIC IN NETWORK
        if (R.isNil(publications[topic])) {
          publications[topic] = {
            subscribers: [source]
          }
        }

        // NEW MESSAGE IN NETWORK
        if (R.isNil(publications[topic][msg])) {
          publications[topic][msg] = {
            recipients: [],
            publications: [],
            receives: [],
            enter: timestamp,
            exit: null
          }
        }

        // TODO: HANDLE DUPES BETTER
        // Add the publication event
        publications[topic][msg].publications.push({ source, timestamp })
        break

      case RECEIVE_EVENT:
        if (R.isNil(publications[topic]) || R.isNil(publications[topic][msg])) {
          throw new StatsError(`Time Traveling. Message received before publication`)
        }

        // TODO: HANDLE DUPES BETTER
        // Add the receive event
        publications[topic][msg].receives.push({ source, timestamp })

        // Check if all recipients have been notified
        // and if so, mark an exit time on the message
        publications[topic][msg].recipients.push(source)

        // Ensure unique recipients
        const curRecipients = publications[topic][msg].recipients = R.uniq(publications[topic][msg].recipients)
        const curSubscribers = publications[topic].subscribers

        // Check if the message had propagated to all current subscribers in the network
        if (R.length(R.difference(curSubscribers, curRecipients)) === 0) {
          if (R.isNil(publications[topic][msg].exit)) {
            publications[topic][msg].exit = timestamp
          }
        }
        break
    }
  }, logs)

  return publications
}

function generateEvents (logString) {
  const allEventStrs = logString.split('\n')

  const potentialLogObjects = R.map((eventStr) => {
    const logStartIdx = eventStr.indexOf('pstn:logger')

    if (logStartIdx > -1) {
      const logEvents = eventStr.slice(logStartIdx).split(' ')

      const timestamp = new Date(eventStr.slice(0, logStartIdx-1)).getTime()
      const type = logEvents[1]
      const source = logEvents[2]
      const topic = logEvents[3]
      const msg = logEvents[4]

      // TODO: Prevent empty logs by using some deeper source id - talk to @diasdavid
      return { timestamp, type, source, topic, msg }
    }

    return null
  }, allEventStrs)

  return R.filter((log) => log, potentialLogObjects)
}
