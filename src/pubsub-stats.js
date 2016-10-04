'use strict'

const R = require('ramda')

const { log, PUBLISH_EVENT, RECEIVE_EVENT } = require('./config')
const { StatsError } = require('./errors')

const forEachIndexed = R.addIndex(R.forEach)

 module.exports = class PubsubStats {
  constructor (log) {
    this.log = log
    this.events = generateEventObjects(log.toString())
    this.synopsis = generateSynopsis(this.events)
  }
}

function generateSynopsis (logs) {
  const totalRecipients = R.uniq(R.pluck('source', logs))

  let publications = {}

  forEachIndexed((log, idx) => {
    const msg = log.msg
    const type = log.type
    const topic = log.topic
    const source = log.source
    const timestamp = log.timestamp

    switch (type) {
      case PUBLISH_EVENT:
        // NEW TOPIC IN NETWORK
        if (R.isNil(publications[topic])) {
          publications[topic] = {}
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
          throw new StatsError(`You must be time traveling. Message received before being published`)
        }

        // TODO: HANDLE DUPES BETTER
        // Add the receive event
        publications[topic][msg].receives.push({ source, timestamp })

        // Check if all recipients have been notified
        // and if so, mark an exit time on the message
        publications[topic][msg].recipients.push(source)
        // Ensure unique recipients
        let msgRecipients = publications[topic][msg].recipients = R.uniq(publications[topic][msg].recipients)

        if (R.length(R.difference(totalRecipients, msgRecipients)) === 0) {
          if (R.isNil(publications[topic][msg].exit)) {
            publications[topic][msg].exit = timestamp
          }
        }
        break
    }
  }, logs)

  return publications
}

function generateEventObjects (logString) {
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
