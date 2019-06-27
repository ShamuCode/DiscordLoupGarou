const assert = require('assert');
const {Wait} = require('../../src/functions/wait');

describe('wait function', function () {

    it('should return true after 1 second waiting', function (done) {
        Wait.seconds(1).then((status) => {
            assert.strictEqual(status, true);
            done();
        }).catch(err => {
            assert.strictEqual(err, null);
            done();
        });
    });

    it('should return true after 0.5 second waiting', function (done) {
        Wait.seconds(0.5).then((status) => {
            assert.strictEqual(status, true);
            done();
        }).catch(err => {
            assert.strictEqual(err, null);
            done();
        });
    });
});