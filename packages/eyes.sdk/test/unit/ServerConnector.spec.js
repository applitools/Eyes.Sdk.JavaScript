const assert = require('assert')
const {_makeParamsOutputString, _makeResponseOutputString, _makeBodyOutputString} = require('../../src/ServerConnector')


function PromiseFactory() {}

describe('ServerConnector', () => {
  describe('makeParamsOutputString', () => {
    it('should return a message when params are provided', () => {
      assert.deepStrictEqual(_makeParamsOutputString({blah: 'blah'}), 'with params {"blah":"blah"}')
    })
    it('should return an empty string when params are not provided', () => {
      assert.deepStrictEqual(_makeParamsOutputString(), '')
    })
  })
  describe('makeResponseOutputString', () => {
    it('should return stringified JSON', () => {
      assert.deepStrictEqual(_makeResponseOutputString({blah: 'blah'}), '{"blah":"blah"}')
    })
    it('should return an interpolated string when JSON stringify throws', () => {
      assert.deepStrictEqual(_makeResponseOutputString(BigInt(9001)), '9001')
    })
  })
  describe('makeBodyOutputString', () => {
    it('should return stringified JSON', () => {
      assert.deepStrictEqual(_makeBodyOutputString('{"blah":"blah"}'), {blah: 'blah'})
    })
    it('should return an interpolated string when JSON parse throws', () => {
      assert.deepStrictEqual(_makeBodyOutputString('<'), '<')
    })
  })
})
