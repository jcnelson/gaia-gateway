/* @flow */

import winston from 'winston'
import fs from 'fs'
import process from 'process'

const configDefaults = {
  argsTransport: {
    level: 'debug',
    handleExceptions: true,
    timestamp: true,
    stringify: true,
    colorize: true,
    json: true
  },
  regtest: false,
  testnet: false,
  port: 8008
}

export function getConfig() {
  const configPath = process.env.CONFIG_PATH || process.argv[2] || './config.json'
  let config
  try {
    config = Object.assign(
      {}, configDefaults, JSON.parse(fs.readFileSync(configPath).toString()))
  } catch (e) {
    config = Object.assign({}, configDefaults)
  }

  winston.configure({ transports: [
    new winston.transports.Console(config.argsTransport) ] })

  return config
}

