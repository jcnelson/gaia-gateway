#!/usr/bin/env node
import winston from 'winston'
import { makeHttpServer } from './http.js'
import { getConfig } from './config.js'

const blockstack = require('blockstack')

// workaround bug in blockstack.js
global['window'] = { location: { origin: false } }

const conf = getConfig()
const app = makeHttpServer(conf)

app.listen(
  app.config.port,
  () => winston.warn(`server starting on port ${app.config.port} in ${app.settings.env} mode`))

