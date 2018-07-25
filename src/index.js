#!/usr/bin/env node
import winston from 'winston'
import { makeHttpServer } from './http.js'
import { getConfig } from './config.js'

const blockstack = require('blockstack')

// workaround bug in blockstack.js
global['window'] = { location: { origin: false } }

// override blockstack's node-fetch with cross-fetch
// (since we need response.body.arrayBuffer() support)
global['fetch'] = require('cross-fetch')
global['Headers'] = global['fetch'].Headers
global['Request'] = global['fetch'].Request
global['Response'] = global['fetch'].Response

const conf = getConfig()
const app = makeHttpServer(conf)

app.listen(
  app.config.port,
  () => winston.warn(`server starting on port ${app.config.port} in ${app.settings.env} mode`))

