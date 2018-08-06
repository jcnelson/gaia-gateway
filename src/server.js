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

const DEFAULT_GAIA_HUB_PREFIX = "https://gaia.blockstack.org/hub"

// Exception class that carries an HTTP status code
export class GaiaGatewayException extends Error {
  statuscode: number

  constructor(message: string, statuscode: number) {
    super(message)
    this.statuscode = statuscode
  }
}

/*
 * Get the apps from a profile object.
 * Verify that they are well-formed.
 * Returns a Promise that resolves to the apps dict
 * Throws a GaiaGatewayException if the profile could not be fetched or is malformed
 */
function getAppsFromProfile(blockstackID: string, profile: Object): Promise<Object> {
  return Promise.resolve().then(() => {
    if (!profile) {
      throw new GaiaGatewayException(`No profile loaded for ${blockstackID}`, 404)
    }

    if (!profile.apps) {
      return {}
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
  .catch((e) => {
    console.log(e)
    throw new GaiaGatewayException(`Failed to load profile for ${blockstackID}`, 404)
  })
}

/*
 * Get a BNS name's profile's apps.
 * Verify that they are well-formed
 */
function getBNSProfileApps(blockstackID: string) : Promise<Object> {
  return blockstack.lookupProfile(blockstackID)
    .catch((e) => { 
      throw new GaiaGatewayException(`Failed to load profile for ${blockstackID}`, 404)
    })
    .then((profile) => getAppsFromProfile(blockstackID, profile))
}

/*
 * Get an ID-address's profile's apps.
 * Verify that they are well-formed
 */
function getIDAddressProfileApps(idAddress: string, gaiaHubReadPrefix?: string): Promise<Object> {
  if (!gaiaHubReadPrefix) {
    // default 
    gaiaHubReadPrefix = DEFAULT_GAIA_HUB_PREFIX
  }
  
  const profileUrl = `${gaiaHubReadPrefix.replace(/\/+$/g, '')}/profile.json`
  const legacyProfileUrl = `${gaiaHubReadPrefix.replace(/\/+$/g, '')}/0/profile.json`

  let tryLegacy = false

  function urlToProfile(url: string) : Promise<Object> {
    return fetch(url)
      .then((resp) => {
        if (resp.status !== 200) {
          throw new Error('Not found')
        }
        return resp.json()
      })
      .then((profileJSON) => {
        return getAppsFromProfile(idAddress, profileJSON)
      })
  }
  
  return urlToProfile(profileUrl)
    .catch((e) => {
      if (e.message === 'Not found') {
        return urlToProfile(legacyProfileUrl)
          .catch((eLegacy) => {
            throw new GaiaGatewayException(`No profile.json file found`, 404)
          })
      }
      else {
        throw new GaiaGatewayException(`No profile.json file found`, 404)
      }
    })
}

export class GaiaGateway {

  constructor(config: Object) {
  }

  handleGetFile(blockstackID: string, originHost: string, filename: string): Promise<*> {
    return getBNSProfileApps(blockstackID)
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
          .then((fileData) => {
            if (fileData === null) {
              throw new GaiaGatewayException('No such file', 404)
            }
            return fileData
          })
      })
  }

  handleGetApps(blockstackID: string): Promise<*> {
    return getBNSProfileApps(blockstackID)
  }
}
