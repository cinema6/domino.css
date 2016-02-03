'use strict';

var proxyquire = require('proxyquire');
var parseCSS = require('../../lib/parser');
var applyRules = require('../../lib/mutator');
var getUnparsedRules = require('../../lib/unparsed_rule_getter');

describe('index.js', function() {
    var index;
    var stubs, bootstrap;

    beforeEach(function() {
        bootstrap = jasmine.createSpy('bootstrap()').and.callFake(require('../../lib/bootstrapper'));

        stubs = {
            './lib/parser': parseCSS,
            './lib/mutator': applyRules,
            './lib/unparsed_rule_getter': getUnparsedRules,
            './lib/bootstrapper': bootstrap,

            '@noCallThru': true
        };

        index = proxyquire('../../index', stubs);
    });

    it('should exist', function() {
        expect(index).toEqual(jasmine.any(Object));
    });

    describe('methods:', function() {
        describe('parse(stylesheet)', function() {
            it('should be the parser Function', function() {
                expect(index.parse).toBe(parseCSS);
            });
        });

        describe('applyRules(rules, element)', function() {
            it('should be the mutator Function', function() {
                expect(index.applyRules).toBe(applyRules);
            });
        });

        describe('bootstrap(element)', function() {
            var element;
            var result;

            beforeEach(function() {
                element = document.createElement('div');

                result = index.bootstrap(element);
            });

            it('should call the bootstrap Function with the element and the unparsed rule getter', function() {
                expect(bootstrap).toHaveBeenCalledWith(element, getUnparsedRules);
            });

            it('should return the result of calling bootstrap()', function() {
                expect(result).toBe(bootstrap.calls.mostRecent().returnValue);
            });
        });
    });
});
