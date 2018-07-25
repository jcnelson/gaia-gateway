const test = require('tape')

const proxyquire = require('proxyquire')
const FetchMock = require('fetch-mock')

let request = require('supertest')
let bitcoin = require('bitcoinjs-lib')
let fs = require('fs')
let jsontokens = require('jsontokens')

const { GaiaGateway } = require('../../../lib/server.js')

const testWIFs = [
  'L4kMoaVivcd1FMPPwRU9XT2PdKHPob3oo6YmgTBHrnBHMmo7GcCf',
  'L3W7EzxYNdG3kBjtQmhKEq2iiZAwpiKEwMobXdaY9xueSUFPkQeH',
  'KwzzsbVzMekdj9myzxojsgT6DQ6yRQKbWqSXQgo1YKsJcvFJhtRr',
  'KxYYiJg9mJpCDHcyYMMvSfY4SWGwMofqavxG2ZyDNcXuY7ShBknK']
const testPairs = testWIFs.map(x => bitcoin.ECPair.fromWIF(x))
const testAddrs = testPairs.map(x => x.getAddress())

function addMockFetches(prefix, dataMap) {
  dataMap.forEach( item => {
    FetchMock.get(`${prefix}${item.key}`, item.data)
  })
}

const ryan_profile_url = `https://gaia.blockstack.org/hub/${testAddrs[0]}/profile.json`

const ryan_whois = {
  "address": testAddrs[0],
  "blockchain": "bitcoin", 
  "expire_block": 597120, 
  "last_txid": "ed4281a46ef7e52aa127100276de880be6127d0b0838ea5ea843af8230054680", 
  "status": "registered", 
  "zonefile": `$ORIGIN ryan.id\n$TTL 3600\n_http._tcp URI 10 1 \"${ryan_profile_url}\"\n`,
}

const ryan_publik_url = `https://gaia.blockstack.org/hub/${testAddrs[1]}/`
const ryan_graphite_url = `https://gaia.blockstack.org/hub/${testAddrs[2]}/`
const ryan_publik_statuses_url = `${ryan_publik_url}statuses.json`

const ryan_profile_claim = {
  "apps": {
    "http://publik.ykliao.com": ryan_publik_url,
    "https://app.graphitedocs.com": ryan_graphite_url
  }
}

const ryan_profile_jwt = new jsontokens.TokenSigner('ES256K', testPairs[0].d.toHex()).sign({
  jti: 'f6c6dd8e-ebb3-4409-ace2-e218cbf00a52',
  iat: (new Date()/1000),
  exp: (new Date()/1000) * 2,
  subject: {
    publicKey: testPairs[0].getPublicKeyBuffer().toString('hex')
  },
  issuer: {
    publicKey: testPairs[0].getPublicKeyBuffer().toString('hex')
  },
  claim: ryan_profile_claim,
})

const ryan_profile = [{decodedToken: jsontokens.decodeToken(ryan_profile_jwt), token: ryan_profile_jwt}]

const ryan_statuses_json = [{"id":0,"text":"Hello, Blockstack!","created_at":1515786983492}]

const testConfig = {}

global['window'] = { location: { origin: false } }

function testServer() {

  test('handle file request', (t) => {
    FetchMock.get('https://core.blockstack.org/v1/names/ryan.id', ryan_whois)
    FetchMock.get(ryan_profile_url, ryan_profile)
    FetchMock.get(ryan_publik_statuses_url, ryan_statuses_json)

    FetchMock.get('https://core.blockstack.org/v1/names/missing.id', 
      { body: { 'status': 'available' } })
    FetchMock.get(`${ryan_publik_url}missing`, 404)

    const server = new GaiaGateway(testConfig)

    server.handleGetFile('ryan.id', 'publik.ykliao.com', 'statuses.json')
      .then((fileData) => {
        t.equal(fileData, JSON.stringify(ryan_statuses_json), 'File contents should match')
      })
      .then(() => new Promise((resolve, reject) => {
        server.handleGetFile('ryan.id', 'publik.ykliao.com', 'missing')
        .then((missingData) => reject(new Error('Fetched missing data')))
        .catch((e) => {
          t.equal(e.statuscode, 404, 'Missing files 404')
          resolve()
        })
      }))
      .then(() => new Promise((resolve, reject) => {
        server.handleGetFile('ryan.id', 'missing.com', 'statuses.json')
        .then((missingOrigin) => reject(new Error('Fetched data from missing origin')))
        .catch((e) => {
          t.equal(e.statuscode, 404, 'Missing origins 404')
          resolve()
        })
      }))
      .then(() => new Promise((resolve, reject) => {
        server.handleGetFile('missing.id', 'publik.ykliao.com', 'statuses.json')
        .then((missingBlockstackID) => reject(new Error('Fetched data from missing Blockstack ID')))
        .catch((e) => {
          t.equal(e.statuscode, 404, 'Missing Blockstack IDs 404')
          resolve()
        })
      }))
      .then(() => {
        FetchMock.restore()
        t.end()
      })
  })

  test('handle app request', (t) => {
    FetchMock.get('https://core.blockstack.org/v1/names/ryan.id', ryan_whois)
    FetchMock.get(ryan_profile_url, ryan_profile)

    const server = new GaiaGateway(testConfig)

    server.handleGetApps('ryan.id')
      .then((apps) => {
        t.equal(apps['http://publik.ykliao.com'], ryan_publik_url, 'Has Publik app URL')
        t.equal(apps['https://app.graphitedocs.com'], ryan_graphite_url, 'Has Graphite app URL')
        t.equal(Object.keys(apps).length, 2, 'Has only 2 apps')
        t.end()
      })
  })
}

testServer()
