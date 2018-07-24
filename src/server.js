/* @flow */

import express from 'express'
import Ajv from 'ajv'
import Url from 'url'

const blockstack = require('blockstack')
const network = blockstack.config.network

const schemas = {
  appList: {
    type: 'object',
    patternProperties: {
      'http[s]?://.+': {
        type: 'string',
        pattern: 'http[s]?://.+'
      }
    }
  }
}

/*
 * Get a name's profile's apps.
 * Verify that they are well-formed
 */
function getProfileApps(blockstackID: string) : Promise<Object> {
  return blockstack.lookupProfile(blockstackID)
    .then((profile) => {
      if (!profile.apps) {
        throw new GaiaGatewayException(`No apps for ${blockstackID}`, 404)
      }

      if (!(profile.apps instanceof Object)) {
        throw new GaiaGatewayException(`No apps for ${blockstackID}`, 404)
      }
      
      const appOriginUrls = Object.keys(profile.apps)
      if (appOriginUrls.length > 16384) {
        // arbitrary length, but it shouldn't be so big
        throw new GaiaGatewayException(`Too many apps for ${blockstackID}`, 404)
      }

      const a = Ajv()
      const validApps = a.validate(schemas.appList, profile.apps)
      if (!validApps) {
        throw new GaiaGatewayException(`Invalid app data for ${blockstackID}`, 404)
      }

      return profile.apps
    })
}

export class GaiaGatewayException extends Error {
  statuscode: number

  constructor(message: string, statuscode: number) {
    super(message)
    this.statuscode = statuscode
  }
}

export class GaiaGateway {

  constructor(config: Object) {
  }

  handleGetFile(blockstackID: string, originHost: string, filename: string): Promise<*> {
    const nameLookupUrl = `${network.blockstackAPIUrl}/v1/names/`
    return getProfileApps(blockstackID)
      .then((apps) => {
        const possibleAppOrigins = [
          `http://${originHost}`,
          `http://${originHost}/`,
          `https://${originHost}`,
          `https://${originHost}/`
        ]

        let appOrigin

        for (let i = 0; i < possibleAppOrigins.length; i++) {
          if (apps.hasOwnProperty(possibleAppOrigins[i])) {
            appOrigin = possibleAppOrigins[i]
            break
          }
        }

        if (!appOrigin) {
          throw new GaiaGatewayException(`No origin found for ${blockstackID} ${originHost}`, 404)
        }

        return blockstack.getFile(filename, {
            decrypt: false,
            verify: false,
            username: blockstackID,
            app: appOrigin })
      })
  }

  handleGetApps(blockstackID: string): Promise<*> {
    return getProfileApps(blockstackID)
  }
}
