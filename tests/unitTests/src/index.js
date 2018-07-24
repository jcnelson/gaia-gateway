const test = require('tape')

const proxyquire = require('proxyquire')
const FetchMock = require('fetch-mock')

let request = require('supertest')
let bitcoin = require('bitcoinjs-lib')
let fs = require('fs')

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

function testServer() {

  test('handle file request', (t) => {

  })

  test('handle app request', (t) => {

  })
}


