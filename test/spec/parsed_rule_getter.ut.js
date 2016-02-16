'use strict';

var proxyquire = require('proxyquire');
var parseCSS = require('../../lib/parser');
var fs = require('fs');

var concat = Array.prototype.concat;

describe('lib/parsed_rule_getter.js: getParsedRules(element, callback)', function() {
    var getParsedRules;
    var stubs;

    beforeEach(function() {
        stubs = {
            '@noCallThru': true
        };

        getParsedRules = proxyquire('../../lib/parsed_rule_getter', stubs);
    });

    it('should exist', function() {
        expect(getParsedRules).toEqual(jasmine.any(Function));
        expect(getParsedRules.name).toBe('getParsedRules');
    });

    describe('when called', function() {
        var element, callback;

        beforeEach(function() {
            element = document.createElement('div');
            callback = jasmine.createSpy('callback()');

            global.__dominoCSSRules__ = [
                parseCSS(fs.readFileSync(require.resolve('../helpers/styles.css')).toString()),
                parseCSS(fs.readFileSync(require.resolve('../helpers/override.css')).toString())
            ];

            getParsedRules(element, callback);
        });

        afterEach(function() {
            delete global.__dominoCSSRules__;
        });

        it('should callback with a rules Object containing every rule in the global __dominoCSSRules__ Array', function() {
            expect(callback).toHaveBeenCalledWith(null, {
                rules: {
                    container: concat.apply([], global.__dominoCSSRules__.map(function(rules) {
                        return rules.rules.container;
                    })),
                    order: concat.apply([], global.__dominoCSSRules__.map(function(rules) {
                        return rules.rules.order;
                    })),
                    elements: concat.apply([], global.__dominoCSSRules__.map(function(rules) {
                        return rules.rules.elements;
                    }))
                },
                mediaQueries: concat.apply([], global.__dominoCSSRules__.map(function(rules) {
                    return rules.mediaQueries;
                }))
            });
        });

        describe('if there is no __dominoCSSRules__ Array', function() {
            beforeEach(function() {
                delete global.__dominoCSSRules__;
                callback.calls.reset();

                getParsedRules(element, callback);
            });

            it('should callback with an empty rules Object', function() {
                expect(callback).toHaveBeenCalledWith(null, {
                    rules: {
                        container: [],
                        order: [],
                        elements: []
                    },
                    mediaQueries: []
                });
            });
        });

        describe('if no callback is specified', function() {
            it('should do nothing', function() {
                expect(function() { getParsedRules(element); }).not.toThrow();
            });
        });
    });
});
