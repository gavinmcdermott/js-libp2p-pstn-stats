'use strict'

const debug = require('debug')

const PUBLISH_EVENT = 'publish'
const RECEIVE_EVENT = 'receive'
const SUBSCRIBE_EVENT = 'subscribe'
const UNSUBSCRIBE_EVENT = 'unsubscribe'

const log = debug('pstn:stats')
log.err = debug('pstn:stats:error')

module.exports = {
  log,
  PUBLISH_EVENT,
  RECEIVE_EVENT,
  SUBSCRIBE_EVENT,
  UNSUBSCRIBE_EVENT
}