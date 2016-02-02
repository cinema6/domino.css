'use strict';

var proxyquire = require('proxyquire');
var fs = require('fs');

function arrayify(collection) {
    return Array.prototype.slice.call(collection);
}

describe('lib/mutator.js: applyRules(rules, element)', function() {
    var applyRules;
    var stubs, matchMedia;

    beforeEach(function() {
        matchMedia = jasmine.createSpy('matchMedia()').and.returnValue(false);

        stubs = {
            './media_matcher': matchMedia,

            '@noCallThru': true
        };

        applyRules = proxyquire('../../lib/mutator', stubs);
    });

    it('should exist', function() {
        expect(applyRules).toEqual(jasmine.any(Function));
        expect(applyRules.name).toBe('applyRules');
    });

    describe('when called', function() {
        var html, frame;
        var rules, element;

        beforeEach(function() {
            html = fs.readFileSync(require.resolve('../helpers/page.html')).toString();
            frame = document.createElement('iframe');

            document.body.appendChild(frame);
            frame.contentWindow.document.write(html);
            frame.contentWindow.document.close();

            element = frame.contentWindow.document.documentElement;
            rules = {
                rules: {
                    container: [
                        {
                            selector: 'header.wrapper',
                            value: '.header-container'
                        },
                        {
                            selector: '.footer',
                            value: 'header'
                        },
                        {
                            selector: '.header-container',
                            value: 'body'
                        },
                        {
                            selector: '.footer-container',
                            value: 'body'
                        },
                        {
                            selector: '.main-container',
                            value: '.fjwehfe' // test something that does not exist
                        },
                        {
                            selector: 'footer.wrapper',
                            value: '.footer-container'
                        },
                        {
                            selector: '.main',
                            value: '.main-container'
                        },
                        {
                            selector: '.title',
                            value: 'header.wrapper'
                        },
                        {
                            selector: 'h3.footer',
                            value: 'footer'
                        },
                        {
                            selector: 'nav',
                            value: 'header.wrapper'
                        },
                        {
                            selector: '.copyright',
                            value: 'nav'
                        }
                    ],
                    order: [
                        {
                            selector: '.header-container',
                            value: 100
                        },
                        {
                            selector: '.main-container',
                            value: 200
                        },
                        {
                            selector: '.copyright',
                            value: 50
                        },
                        {
                            selector: '.footer-container',
                            value: 300
                        },
                        {
                            selector: 'h1.title',
                            value: 10
                        },
                        {
                            selector: 'div.main',
                            value: 0
                        },
                        {
                            selector: 'ul.nav-list',
                            value: 100
                        }
                    ]
                },
                mediaQueries: [
                    {
                        directive: 'only screen and (min-width: 480px)',
                        rules: {
                            container: [
                                {
                                    selector: 'footer',
                                    value: '.main-container'
                                }
                            ],
                            order: [
                                {
                                    selector: 'footer',
                                    value: 50
                                }
                            ]
                        }
                    },
                    {
                        directive: 'only screen and (min-width: 768px)',
                        rules: {
                            container: [],
                            order: [
                                {
                                    selector: '.main-container',
                                    value: 500
                                }
                            ]
                        }
                    }
                ]
            };

            applyRules(rules, element);
        });

        afterEach(function() {
            document.body.removeChild(frame);
        });

        it('should move elements to the proper container', function() {
            arrayify(element.querySelectorAll('header.wrapper')).forEach(function(node) {
                expect(node.parentNode).toBe(element.querySelector('.header-container'), 'header.wrapper');
            });

            arrayify(element.querySelectorAll('.header-container')).forEach(function(node) {
                expect(node.parentNode).toBe(element.querySelector('body'), '.header-container');
            });

            arrayify(element.querySelectorAll('.footer-container')).forEach(function(node) {
                expect(node.parentNode).toBe(element.querySelector('body'), '.footer-container');
            });

            arrayify(element.querySelectorAll('footer.wrapper')).forEach(function(node) {
                expect(node.parentNode).toBe(element.querySelector('.footer-container'), '.footer-container');
            });

            arrayify(element.querySelectorAll('.main')).forEach(function(node) {
                expect(node.parentNode).toBe(element.querySelector('.main-container'), '.main');
            });

            arrayify(element.querySelectorAll('.title')).forEach(function(node) {
                expect(node.parentNode).toBe(element.querySelector('header.wrapper'), '.title');
            });

            arrayify(element.querySelectorAll('nav')).forEach(function(node) {
                expect(node.parentNode).toBe(element.querySelector('header.wrapper'), 'nav');
            });
        });

        it('should move elements into the proper order', function() {
            expect(element.querySelector('.header-container').previousSibling).toBe(null, '.header-container');
            expect(element.querySelector('.header-container').nextSibling).toBe(element.querySelector('.main-container'), '.header-container');
            expect(element.querySelector('.main-container').nextSibling).toBe(element.querySelector('.footer-container'), '.main-container');

            expect(element.querySelector('h1.title').nextSibling).toBe(element.querySelector('nav'), 'h1.title');

            expect(element.querySelector('ul.nav-list').previousSibling).toBe(element.querySelector('.copyright'), 'ul.nav-list');
        });

        describe('if called again', function() {
            var Node;
            var originalHTML, newHTML;

            beforeEach(function() {
                Node = frame.contentWindow.Node;
                spyOn(Node.prototype, 'insertBefore').and.callThrough();

                originalHTML = element.outerHTML;
                applyRules(rules, element);
                newHTML = element.outerHTML;
            });

            it('should not mute the DOM', function() {
                expect(Node.prototype.insertBefore).not.toHaveBeenCalled();
            });

            it('should not change the HTML', function() {
                expect(newHTML).toBe(originalHTML);
            });
        });

        describe('if the order changes', function() {
            beforeEach(function() {
                rules.rules.order.push({
                    selector: '.header-container',
                    value: 500
                });

                applyRules(rules, element);
            });

            it('should update the DOM to reflect the new order', function() {
                expect(element.querySelector('.main-container').previousSibling).toBe(null, '.main-container');
                expect(element.querySelector('.main-container').nextSibling).toBe(element.querySelector('.footer-container'), '.main-container');
                expect(element.querySelector('.footer-container').nextSibling).toBe(element.querySelector('.header-container'), '.footer-container');
            });
        });

        describe('if a media query is active', function() {
            beforeEach(function() {
                matchMedia.and.callFake(function(query, window) {
                    expect(window).toBe(frame.contentWindow);

                    return query === rules.mediaQueries[0].directive;
                });

                applyRules(rules, element);
            });

            it('should activate that media query', function() {
                expect(element.querySelector('footer').parentNode).toBe(element.querySelector('.main-container'), 'footer');
                expect(element.querySelector('footer').previousElementSibling).toBe(element.querySelector('div.main'), 'footer');
            });

            it('should not activate other media queries', function() {
                expect(element.querySelector('.main-container').previousElementSibling).not.toBe(element.querySelector('.footer-container'), '.main-container');
            });
        });

        describe('if all media queries are active', function() {
            beforeEach(function() {
                matchMedia.and.callFake(function(query, window) {
                    expect(window).toBe(frame.contentWindow);

                    return true;
                });

                applyRules(rules, element);
            });

            it('should activate all media queries', function() {
                expect(element.querySelector('footer').parentNode).toBe(element.querySelector('.main-container'), 'footer');
                expect(element.querySelector('footer').previousElementSibling).toBe(element.querySelector('div.main'), 'footer');
                expect(element.querySelector('.main-container').previousElementSibling).toBe(element.querySelector('.footer-container'), '.main-container');
            });
        });
    });
});
