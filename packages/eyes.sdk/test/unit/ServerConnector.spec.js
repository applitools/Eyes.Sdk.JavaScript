const assert = require('assert')
const {_makeParamsOutput} = require('../../src/ServerConnector')

function PromiseFactory() {}

describe('ServerConnector', () => {
  describe('makeParamsOutput', () => {
    it('should return a message when params are provided', () => {
      assert.deepStrictEqual(_makeParamsOutput({blah: 'blah'}), 'with params {"blah":"blah"}')
    })
    it('should return an empty string when params are not provided', () => {
      assert.deepStrictEqual(_makeParamsOutput(), '')
    })
  })
})
