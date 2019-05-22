const assert = require('assert');
const timeToString = require('../../src/functions/time');

describe('timeToString function', function () {

    it('should return 1h16m0s when the value of minutes is 76', function () {
        assert.strictEqual(timeToString(76), "1h16m0s");
    });

    it('should return 0s when the value of minutes is 0', function () {
        assert.strictEqual(timeToString(0), "0s");
    });
});