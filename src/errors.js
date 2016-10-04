'use strict'

class StatsError extends Error {
  constructor (message, extra) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = `StatsError`
    this.message = `${message}`
    if (extra) this.extra = extra
  }
}

module.exports = { StatsError }
