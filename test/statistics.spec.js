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
// path.resolve(__dirname, './test/events.log')
// Buffer.from('VG9waWMgVHdv', 'base64').toString()


describe('PubsubStats:', () => {
  let eventLog
  let stats

  describe('Sample events:', () => {
    const topic = '__topic__one'
    const msg = '__message_11111'

    before(() => {
      stats = new PubsubStats(sampleLog)
      // console.log(util.inspect(stats.topicLog, {depth: 6}))
      // console.log('======================================')
      // console.log(util.inspect(stats.stats, {depth: 6}))
    })

    describe('.eventLog:', () => {
      it('success', () => {
        const firstEvent = R.head(stats.eventLog)

        expect(firstEvent.type).to.eql(SUBSCRIBE_EVENT)
        expect(firstEvent.source).to.eql('ID_1')
        expect(firstEvent.topic).to.eql(topic)
        expect(firstEvent.msg).to.eql(msg)
        expect(firstEvent.timestamp).to.eql(new Date('Tue, 04 Oct 2016 05:43:40 GMT').getTime())

        const lastEvent = R.last(stats.eventLog)

        expect(lastEvent.type).to.eql(RECEIVE_EVENT)
        expect(lastEvent.source).to.eql('ID_2')
        expect(lastEvent.topic).to.eql(topic)
        expect(lastEvent.msg).to.eql(msg)
        expect(lastEvent.timestamp).to.eql(new Date('Tue, 04 Oct 2016 05:43:55 GMT').getTime())
      })
    })

    describe('.topicLog:', () => {
      it('success', () => {
        expect(stats.topicLog[topic]).to.exist
        expect(stats.topicLog[topic].subscribers).to.exist
        expect(stats.topicLog[topic].subscribers.length).to.eql(2)
        expect(R.contains('ID_3', stats.topicLog[topic].subscribers)).to.be.false

        expect(stats.topicLog[topic][msg]).to.exist
        const messageObj = stats.topicLog[topic][msg]

        expect(R.length(messageObj.recipients)).to.eql(2)
        expect(R.contains('ID_1', messageObj.recipients)).to.be.true
        expect(R.contains('ID_2', messageObj.recipients)).to.be.true

        expect(R.head(messageObj.publications).timestamp).to.eql(messageObj.enter)

        const lastReceive = R.find((msg) => {
          return msg.source === 'ID_2'
        }, messageObj.receives)

        expect(lastReceive.timestamp).to.eql(messageObj.exit)
      })
    })

    describe('.stats:', () => {
      it('success', () => {
        const toSeconds = (n) => n * 1000

        expect(stats.stats).to.exist
        expect(stats.stats[topic]).to.exist
        expect(stats.stats[topic][msg]).to.exist
        expect(stats.stats[topic][msg].traverseTime).to.eql(toSeconds(15))
      })
    })
  })
})

