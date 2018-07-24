/* @flow */

import express from 'express'
import expressWinston from 'express-winston'
import logger from 'winston'
import cors from 'cors'

import { 
  GaiaGateway,
  GaiaGatewayException
} from './server'

function writeResponse(res: express.response, data: Object, statusCode: number) {
  res.writeHead(statusCode, {'Content-Type' : 'application/json'})
  res.write(JSON.stringify(data))
  res.end()
}

export function makeHttpServer(config: Object) {
  const app = express()
  const server = new GaiaGateway(config)

  app.config = config

  app.use(expressWinston.logger({
    transports: logger.loggers.default.transports }))

  app.use(cors())

  app.get(/^\/([0-9a-z_+.-]{3,74})\/([a-zA-Z0-9%._-]+)\/(.+)\/?$/, 
    (req: express.request, res: express.response) => {

    const blockstackID = req.params[0]
    const originHost = req.params[1]
    let filename = req.params[2]
    if (filename.endsWith('/')) {
      filename = filename.substring(0, filename.length - 1)
    }

    server.handleGetFile(blockstackID, originHost, filename)
      .then((fileData) => {
        if (fileData === null) {
          // not found 
          writeResponse(res, { error: 'Not found' }, 404)
          return
        }

        let contentType
        if (typeof fileData === 'string') {
          contentType = 'text/plain'
          fileData = Buffer.from(fileData)
        }
        else {
          contentType = 'application/octet-stream'
        }
        
        res.writeHead(200, {'Content-Type': contentType})
        res.write(fileData)
        res.end()
      })
      .catch((e) => {
        if (e.hasOwnProperty('statuscode')) {
          writeResponse(res, { error: e.message }, e.statuscode)
        }
        else {
          logger.error(e)
          writeResponse(res, { error: 'Server Error' }, 500)
        }
      })
  })

  app.get(/^\/([0-9a-z_+.-]{3,74})\/?$/,
    (req: express.request, res: express.response) => {

    const blockstackID = req.params[0]
    server.handleGetApps(blockstackID)
      .then((apps) => writeResponse(res, apps, 200))
      .catch((e) => {
        if (e.hasOwnProperty('statuscode')) {
          writeResponse(res, { error: e.message }, e.statuscode)
        }
        else {
          logger.error(e)
          writeResponse(res, { error: 'Server Error' }, 500)
        }
      })
  })

  app.post(/.+/, (req: express.request, res: express.response) => {
    writeResponse(res, { error: 'No such method' }, 501)
  })

  return app
}

