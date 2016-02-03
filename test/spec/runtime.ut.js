'use strict';

var proxyquire = require('proxyquire');
var applyRules = require('../../lib/mutator');
var getParsedRules = require('../../lib/parsed_rule_getter');

describe('runtime.js', function() {
    var runtime;
    var stubs, bootstrap;

    beforeEach(function() {
        bootstrap = jasmine.createSpy('bootstrap()').and.callFake(require('../../lib/bootstrapper'));

        stubs = {
            './lib/mutator': applyRules,
            './lib/parsed_rule_getter': getParsedRules,
            './lib/bootstrapper': bootstrap,

            '@noCallThru': true
        };

        runtime = proxyquire('../../runtime', stubs);
    });

    it('should exist', function() {
        expect(runtime).toEqual(jasmine.any(Object));
    });

    it('should have the same interface as the main exports', function() {
        var index = require('../../index');

        expect(Object.keys(runtime)).toEqual(Object.keys(index));
        Object.keys(runtime).forEach(function(key) {
            expect(runtime[key]).toEqual(jasmine.any(index[key].constructor));
        });
    });

    describe('methods:', function() {
        describe('parse(stylesheet)', function() {
            it('should throw an Error', function() {
                expect(function() { runtime.parse(''); }).toThrow(new Error('Parsing is not available at runtime.'));
            });
        });

        describe('applyRules(rules, element)', function() {
            it('should be the mutator Function', function() {
                expect(runtime.applyRules).toBe(applyRules);
            });
        });

        describe('bootstrap(element)', function() {
            var element;
            var result;

            beforeEach(function() {
                element = document.createElement('div');

                result = runtime.bootstrap(element);
            });

            it('should call the bootstrap Function with the element and the parsed rule getter', function() {
                expect(bootstrap).toHaveBeenCalledWith(element, getParsedRules);
            });

            it('should return the result of calling bootstrap()', function() {
                expect(result).toBe(bootstrap.calls.mostRecent().returnValue);
            });
        });
    });
});
