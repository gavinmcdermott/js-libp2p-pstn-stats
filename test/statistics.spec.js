'use strict'

const R = require('ramda')
const fs = require('fs')
const path = require('path')
const util = require('util')
const expect = require('chai').expect

const PubsubStats = require('./../src')
const { log, PUBLISH_EVENT, RECEIVE_EVENT, SUBSCRIBE_EVENT, UNSUBSCRIBE_EVENT } = require('./../src/config')

const testLogPath = path.resolve(__dirname, './logs/test-log.log')
const sampleLog = fs.readFileSync(testLogPath)

describe('PubsubStats:', () => {
  const id1 = 'QmUnUBoTKPBvwwWBG8X3LDnrNNm2M7BNnNzZULNJenFBhc'
  const id2 = 'QmTGB6sUscUxv7DBbKfFMrDaMcwxJUgjDdwHUdS8vkxtJn'

  const date1 = 'Wed, 05 Oct 2016 07:42:24 GMT'
  const date2 = 'Wed, 05 Oct 2016 07:43:29 GMT'

  const topic = 'QQ=='
  const msg = 'a2RqbmFzIGVqcXcgamFza25q'

  let eventLog
  let stats

  describe('Sample events:', () => {
    before(() => {
      stats = new PubsubStats(sampleLog)
      // console.log(util.inspect(stats.eventLog, {depth: 6}))
      // console.log('======================================')
      // console.log(util.inspect(stats.topicLog, {depth: 6}))
      // console.log('======================================')
      // console.log(util.inspect(stats.stats, {depth: 6}))
    })

    describe('.eventLog:', () => {
      it('success', () => {
        const firstEvent = R.head(stats.eventLog)

        expect(firstEvent.type).to.eql(SUBSCRIBE_EVENT)
        expect(firstEvent.source).to.eql(id1)
        expect(firstEvent.topic).to.eql(topic)
        expect(firstEvent.timestamp).to.eql(new Date(date1).getTime())

        const lastEvent = R.last(stats.eventLog)

        expect(lastEvent.type).to.eql(RECEIVE_EVENT)
        expect(lastEvent.source).to.eql(id2)
        expect(lastEvent.topic).to.eql(topic)
        expect(lastEvent.msg).to.eql(msg)
        expect(lastEvent.timestamp).to.eql(new Date(date2).getTime())
      })
    })

    describe('.topicLog:', () => {
      it('success', () => {
        expect(stats.topicLog[topic]).to.exist
        expect(stats.topicLog[topic].subscribers).to.exist
        expect(stats.topicLog[topic].subscribers.length).to.eql(1)

        // 1 published and then unsubscribed
        expect(R.contains(id1, stats.topicLog[topic].subscribers)).to.be.false

        expect(stats.topicLog[topic][msg]).to.exist
        const messageObj = stats.topicLog[topic][msg]

        expect(R.length(messageObj.recipients)).to.eql(1)
        expect(R.contains(id1, messageObj.recipients)).to.be.false
        expect(R.contains(id2, messageObj.recipients)).to.be.true

        expect(R.head(messageObj.publications).timestamp).to.eql(messageObj.enter)

        const lastReceive = R.find((msg) => R.equals(msg.source, id2), messageObj.receives)

        expect(lastReceive.timestamp).to.eql(messageObj.exit)
      })
    })

    describe('.stats:', () => {
      it('success', () => {
        const toSeconds = (n) => n * 1000

        expect(stats.stats).to.exist
        expect(stats.stats[topic]).to.exist
        expect(stats.stats[topic][msg]).to.exist
        expect(stats.stats[topic][msg].traverseTime).to.eql(toSeconds(62))
      })
    })
  })
})
