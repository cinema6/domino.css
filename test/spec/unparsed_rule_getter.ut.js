'use strict';

var proxyquire = require('proxyquire');
var fs = require('fs');
var path = require('path');
var parseCSS = require('../../lib/parser');

describe('lib/unparsed_rule_getter.js: getUnparsedRules(element, callback)', function() {
    var getUnparsedRules;
    var stylesheets;
    var stubs, superagent;
    var fragment, html;

    beforeEach(function() {
        stylesheets = {};
        stylesheets[path.resolve(__dirname, '../helpers/styles.css')] = fs.readFileSync(require.resolve('../helpers/styles.css')).toString();
        stylesheets[path.resolve(__dirname, '../helpers/override.css')] = fs.readFileSync(require.resolve('../helpers/override.css')).toString();

        superagent = jasmine.createSpy('superagent()').and.callFake(function(/*url, callback*/) {
            var url = path.resolve(path.resolve(__dirname, '../helpers'), arguments[0]);
            var callback = arguments[1];

            process.nextTick(function() {
                if (stylesheets[url]) {
                    callback(null, {
                        text: stylesheets[url],
                        body: stylesheets[url],
                        statusText: 'OK',
                        status: 200
                    });
                } else {
                    callback(new Error('THE REQUEST FAILED'));
                }
            });
        });
        stubs = {
            superagent: superagent,

            '@noCallThru': true
        };

        html = fs.readFileSync(require.resolve('../helpers/unparsed.html')).toString().replace(/<\/?html>/g, '');
        fragment = document.createDocumentFragment();
        fragment.appendChild(document.createElement('html'));
        fragment.firstChild.innerHTML = html;

        getUnparsedRules = proxyquire('../../lib/unparsed_rule_getter', stubs);
    });

    it('should exist', function() {
        expect(getUnparsedRules).toEqual(jasmine.any(Function));
        expect(getUnparsedRules.name).toBe('getUnparsedRules');
    });

    describe('when called', function() {
        var element, callback;

        beforeEach(function(done) {
            element = fragment.querySelector('html');
            callback = jasmine.createSpy('callback()').and.callFake(done);

            getUnparsedRules(element, callback);
        });

        it('should make requests for the external stylesheets', function() {
            expect(superagent).toHaveBeenCalledWith('../helpers/styles.css', jasmine.any(Function));
            expect(superagent).toHaveBeenCalledWith('../helpers/override.css', jasmine.any(Function));
            expect(superagent.calls.count()).toBe(2);
        });

        it('should callback with a rules Object for all CSS on the page', function() {
            var firstLinkRules = parseCSS(stylesheets[path.resolve(__dirname, '../helpers/styles.css')]);
            var firstStyleRules = parseCSS(element.querySelectorAll('style')[0].innerHTML);
            var secondLinkRules = parseCSS(stylesheets[path.resolve(__dirname, '../helpers/override.css')]);
            var secondStyleRules = parseCSS(element.querySelectorAll('style')[1].innerHTML);

            expect(callback).toHaveBeenCalledWith(null, {
                rules: {
                    container: [].concat(firstLinkRules.rules.container, firstStyleRules.rules.container, secondLinkRules.rules.container, secondStyleRules.rules.container),
                    order: [].concat(firstLinkRules.rules.order, firstStyleRules.rules.order, secondLinkRules.rules.order, secondStyleRules.rules.order)
                },
                mediaQueries: [].concat(firstLinkRules.mediaQueries, firstStyleRules.mediaQueries, secondLinkRules.mediaQueries, secondStyleRules.mediaQueries)
            });
        });

        describe('without a callback', function() {
            beforeEach(function() {
                getUnparsedRules(element);
            });

            it('should not throw an Error', function(done) {
                setTimeout(done, 1);
            });
        });

        describe('if parsing/requests lead to Errors', function() {
            var expected;
            var badStyle, badLink;

            beforeEach(function(done) {
                expected = JSON.parse(JSON.stringify(callback.calls.mostRecent().args[1]));
                callback.calls.reset();
                callback.and.callFake(done);

                badStyle = document.createElement('style');
                badStyle.innerHTML = 'WHAT?! This is not valid CSS!';

                badLink = document.createElement('link');
                badLink.setAttribute('rel', 'stylesheet');
                badLink.setAttribute('href', '/this/is/not/valid.css');

                fragment.querySelector('head').appendChild(badStyle);
                fragment.querySelector('head').appendChild(badLink);

                getUnparsedRules(element, callback);
            });

            it('should ignore the bad styles', function() {
                expect(callback).toHaveBeenCalledWith(null, expected);
            });
        });
    });
});
