'use strict';

var proxyquire = require('proxyquire');
var parseCSS = require('../../lib/parser');
var fs = require('fs');

describe('lib/bootstrapper.js: bootstrap(element, getRules)', function() {
    var bootstrap;
    var stubs, applyRules;
    var frame;

    beforeEach(function() {
        applyRules = jasmine.createSpy('applyRules()');

        stubs = {
            './mutator': applyRules,

            '@noCallThru': true
        };

        frame = document.createElement('iframe');
        frame.src = 'about:blank';
        frame.style.width = '800px';
        frame.style.height = '600px';
        document.body.appendChild(frame);

        bootstrap = proxyquire('../../lib/bootstrapper', stubs);
    });

    afterEach(function() {
        document.body.removeChild(frame);
    });

    it('should exist', function() {
        expect(bootstrap).toEqual(jasmine.any(Function));
        expect(bootstrap.name).toBe('bootstrap');
    });

    describe('when called', function() {
        var element, getRules;
        var rules;
        var result;

        beforeEach(function(done) {
            element = frame.contentWindow.document.createElement('div');
            getRules = jasmine.createSpy('getRules()').and.callFake(function(el, callback) {
                expect(el).toBe(element);
                process.nextTick(function() { callback(null, rules); });
            });

            rules = parseCSS(fs.readFileSync(require.resolve('../helpers/styles.css')).toString());

            result = bootstrap(element, getRules);
            setTimeout(done, 1);
        });

        it('should return a Function', function() {
            expect(result).toEqual(jasmine.any(Function));
        });

        it('should apply the rules to the element', function() {
            expect(applyRules).toHaveBeenCalledWith(rules, element);
        });

        describe('and the returned Function is called', function() {
            beforeEach(function() {
                applyRules.calls.reset();

                result();
            });

            it('should re-apply the rules', function() {
                expect(applyRules).toHaveBeenCalledWith(rules, element);
            });

            describe('before the rules are fetched', function() {
                beforeEach(function() {
                    applyRules.calls.reset();

                    bootstrap(element, getRules)();
                });

                afterEach(function(done) {
                    setTimeout(done, 1);
                });

                it('should do nothing', function() {
                    expect(applyRules).not.toHaveBeenCalled();
                });
            });
        });

        describe('if there is an Error when getting the rules', function() {
            var error;
            var thrownError;

            beforeEach(function() {
                applyRules.calls.reset();
                error = new Error('Something went wrong!');
                getRules.and.callFake(function(el, callback) {
                    callback(error);
                });

                try {
                    bootstrap(element, getRules);
                    thrownError = null;
                } catch(e) {
                    thrownError = e;
                }
            });

            it('should not apply any rules', function() {
                expect(applyRules).not.toHaveBeenCalled();
            });

            it('should throw the Error', function() {
                expect(thrownError).toBe(error);
            });
        });

        describe('when the window resizes', function() {
            beforeEach(function(done) {
                applyRules.calls.reset();

                frame.contentWindow.addEventListener('resize', function() {
                    process.nextTick(done);
                }, false);

                process.nextTick(function() {
                    frame.style.width = '850px';
                });
            });

            it('should re-apply the styles', function() {
                expect(applyRules).toHaveBeenCalledWith(rules, element);
            });
        });
    });
});
