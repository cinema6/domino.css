'use strict';

var proxyquire = require('proxyquire');
var fs = require('fs');

describe('lib/parser.js: parse(stylesheet)', function() {
    var parse;
    var stubs;

    beforeEach(function() {
        stubs = {
            '@noCallThru': true
        };

        parse = proxyquire('../../lib/parser', stubs);
    });

    it('should exist', function() {
        expect(parse).toEqual(jasmine.any(Function));
        expect(parse.name).toBe('parseCSS');
    });

    describe('when called', function() {
        var stylesheet;
        var result;

        beforeEach(function() {
            stylesheet = fs.readFileSync(require.resolve('../helpers/styles.css')).toString();

            result = parse(stylesheet);
        });

        it('should return an Object representing the domino CSS rules', function() {
            expect(result.rules).toEqual({
                container: [
                    {
                        selector: 'header.wrapper',
                        value: '.header-container'
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
                        value: 'body'
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
                        value: '.wrapper'
                    },
                    {
                        selector: 'nav',
                        value: 'header.wrapper'
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
                        selector: '.footer-container',
                        value: 300
                    }
                ],
                elements: [
                    {
                        selector: 'body',
                        value: [
                            {
                                tagName: 'div',
                                attributes: [
                                    { name: 'id', value: 'header' },
                                    { name: 'class', value: 'header-container container' },
                                    { name: 'style', value: 'color: red;' },
                                    { name: 'data-name', value: 'header' }
                                ]
                            },
                            {
                                tagName: 'div',
                                attributes: [
                                    { name: 'id', value: 'main' },
                                    { name: 'class', value: 'main-container container' },
                                    { name: 'style', value: 'color: blue;' },
                                    { name: 'data-name', value: 'main' }
                                ]
                            },
                            {
                                tagName: 'div',
                                attributes: [
                                    { name: 'id', value: 'footer' },
                                    { name: 'class', value: 'footer-container container' },
                                    { name: 'style', value: 'color: white;' },
                                    { name: 'data-name', value: 'footer' }
                                ]
                            }
                        ]
                    },
                    {
                        selector: '.header-container',
                        value: [
                            {
                                tagName: 'section',
                                attributes: [
                                    { name: 'class', value: 'main wrapper clearfix' }
                                ]
                            }
                        ]
                    },
                    {
                        selector: '.main-container',
                        value: [
                            {
                                tagName: 'span',
                                attributes: [
                                    { name: 'id', value: 'wrap' }
                                ]
                            }
                        ]
                    }
                ]
            });
        });

        it('should return an Object representing the media queries', function() {
            expect(result.mediaQueries).toEqual([
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
                        ],
                        elements: [
                            {
                                selector: 'footer',
                                value: [
                                    {
                                        tagName: 'span',
                                        attributes: [
                                            { name: 'class', value: 'footer-wrap' }
                                        ]
                                    }
                                ]
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
                        ],
                        elements: []
                    }
                }
            ]);
        });
    });
});
