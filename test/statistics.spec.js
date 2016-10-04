'use strict'

const R = require('ramda')
const fs = require('fs')
const path = require('path')
const util = require('util')
const expect = require('chai').expect

const PubsubStats = require('./../src')
const { log, PUBLISH_EVENT, RECEIVE_EVENT } = require('./../src/config')

const testEventLogPath = path.resolve(__dirname, './logs/test-log.log')
// // path.resolve(__dirname, './test/events.log')
// // Buffer.from('VG9waWMgVHdv', 'base64').toString()

const onePubTwoReceives = `
Tue, 04 Oct 2016 05:43:41 GMT pstn:logger publish ID_1 __topic__one __message_11111
Tue, 04 Oct 2016 05:44:53 GMT pstn:logger receive ID_1 __topic__one __message_11111
Tue, 04 Oct 2016 05:45:26 GMT pstn:logger receive ID_2 __topic__one __message_11111
`

describe('PubsubStats:', () => {
  let eventLog
  let stats

  describe('1 publish > 2 receive:', () => {
    before(() => {
      stats = new PubsubStats(onePubTwoReceives)

      expect(R.length(stats.events)).to.eql(3)
      expect(R.keys(stats.synopsis).length).to.eql(1)
      // eventLog = fs.readFileSync(testEventLogPath) // <Buffer>
      // stats = new PubsubStats(eventLog)
      // // ensure initials are working
      // console.log(util.inspect(stats.synopsis, {depth: 6}))
      // console.log('')
      // console.log('')
    })

    describe('.events:', () => {
      it('success', () => {

        const firstEvent = R.head(stats.events)

        expect(firstEvent.type).to.eql(PUBLISH_EVENT)
        expect(firstEvent.source).to.eql('ID_1')
        expect(firstEvent.topic).to.eql('__topic__one')
        expect(firstEvent.msg).to.eql('__message_11111')
        expect(firstEvent.timestamp).to.eql(new Date('Tue, 04 Oct 2016 05:43:41 GMT').getTime())

        const lastEvent = R.last(stats.events)

        expect(lastEvent.type).to.eql(RECEIVE_EVENT)
        expect(lastEvent.source).to.eql('ID_2')
        expect(lastEvent.topic).to.eql('__topic__one')
        expect(lastEvent.msg).to.eql('__message_11111')
        expect(lastEvent.timestamp).to.eql(new Date('Tue, 04 Oct 2016 05:45:26 GMT').getTime())
      })
    })

    describe('.synopsis:', () => {
      it('success', () => {
        const topic = '__topic__one'
        const msg = '__message_11111'

        expect(stats.synopsis[topic]).to.exist
        expect(stats.synopsis[topic][msg]).to.exist

        const messageObj = stats.synopsis[topic][msg]

        expect(R.length(messageObj.recipients)).to.eql(2)
        expect(R.contains('ID_1', messageObj.recipients)).to.be.true
        expect(R.contains('ID_2', messageObj.recipients)).to.be.true

        expect(R.head(messageObj.publications).timestamp).to.eql(messageObj.enter)

      })
    })
  })

})

