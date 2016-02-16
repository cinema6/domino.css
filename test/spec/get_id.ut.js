'use strict';

var proxyquire = require('proxyquire');

describe('lib/get_id.js: getID()', function() {
    var getID;
    var stubs;

    beforeEach(function() {
        stubs = {
            '@noCallThru': true
        };

        getID = proxyquire('../../lib/get_id', stubs);
    });

    it('should exist', function() {
        expect(getID).toEqual(jasmine.any(Function));
        expect(getID.name).toBe('getID');
    });

    describe('when called', function() {
        var ids;

        beforeEach(function() {
            var length = 500;

            ids = [];

            while (length--) {
                ids.push(getID());
            }
        });

        it('should return a unique ID String', function() {
            ids.forEach(function(id, index) {
                expect(id).toEqual(jasmine.any(String), 'Not a String: ' + id);
                expect(ids.indexOf(id)).toBe(index, 'Not unique: ' + id);
            });
        });
    });
});
