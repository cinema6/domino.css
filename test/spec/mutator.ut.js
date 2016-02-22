'use strict';

var proxyquire = require('proxyquire');
var fs = require('fs');
var shuffle = require('knuth-shuffle').knuthShuffle;

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
            expect(element.querySelector('.header-container').previousElementSibling).toBe(null, '.header-container');
            expect(element.querySelector('.header-container').nextElementSibling).toBe(element.querySelector('.main-container'), '.header-container');
            expect(element.querySelector('.main-container').nextElementSibling).toBe(element.querySelector('.footer-container'), '.main-container');

            expect(element.querySelector('h1.title').nextElementSibling).toBe(element.querySelector('nav'), 'h1.title');

            expect(element.querySelector('ul.nav-list').previousElementSibling).toBe(element.querySelector('.copyright'), 'ul.nav-list');
        });

        describe('again', function() {
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
                expect(element.querySelector('.main-container').previousElementSibling).toBe(null, '.main-container');
                expect(element.querySelector('.main-container').nextElementSibling).toBe(element.querySelector('.footer-container'), '.main-container');
                expect(element.querySelector('.footer-container').nextElementSibling).toBe(element.querySelector('.header-container'), '.footer-container');
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

        describe('with more complicated structure', function() {
            beforeEach(function() {
                frame.contentWindow.document.write([
                    '<body>',
                    '    <div class="card__group">',
                    '        <div class="sidebar__group">',
                    '            <div class="sponsor__group"></div>',
                    '            <div class="social__group"></div>',
                    '        </div>',
                    '        <div class="description__group"></div>',
                    '        <div class="other__group"></div>',
                    '        <div class="video__group"></div>',
                    '        <div class="title__group">',
                    '            <div class="cta__group"></div>',
                    '        </div>',
                    '    </div>',
                    '</body>'
                ].join('\n'));
                frame.contentWindow.document.close();

                rules = {
                    rules: {
                        container: [
                            { selector: '.cta__group', value: '.card__group' }
                        ],
                        order: [
                            { selector: '.sidebar__group', value: 4 },
                            { selector: '.description__group', value: 6 },
                            { selector: '.video__group', value: 3 },
                            { selector: '.title__group', value: 1 },
                            { selector: '.cta__group', value: 5 },
                            { selector: '.other__group', value: 2 }
                        ]
                    },
                    mediaQueries: []
                };
                element = frame.contentWindow.document.documentElement;

                applyRules(rules, element);
            });

            it('should work', function() {
                expect(Array.prototype.slice.call(element.querySelector('.card__group').children)).toEqual([
                    element.querySelector('.title__group'),
                    element.querySelector('.other__group'),
                    element.querySelector('.video__group'),
                    element.querySelector('.sidebar__group'),
                    element.querySelector('.cta__group'),
                    element.querySelector('.description__group'),
                ], 'WRONG ORDER: \n\n' + element.outerHTML);
            });
        });

        describe('with a list', function() {
            var items, list;

            function assertNoMovesExcept(ids) {
                Object.keys(items).forEach(function(id) {
                    var node = items[id];

                    if (ids.indexOf(id) < 0) {
                        expect(list.insertBefore).not.toHaveBeenCalledWith(node, jasmine.anything());
                    }
                });
            }

            beforeEach(function() {
                frame.contentWindow.document.write([
                    '<ul>',
                    '    <li id="alpha">Alpha</li>',
                    '    <li id="bravo">Bravo</li>',
                    '    <li id="charlie">Charlie</li>',
                    '    <li id="delta">Delta</li>',
                    '    <li id="echo">Echo</li>',
                    '    <li id="foxtrot">Foxtrot</li>',
                    '    <li id="golf">Golf</li>',
                    '    <li id="hotel">Hotel</li>',
                    '    <li id="india">India</li>',
                    '    <li id="juliett">Juliett</li>',
                    '    <li id="kilo">Kilo</li>',
                    '    <li id="lima">Lima</li>',
                    '    <li id="mike">Mike</li>',
                    '    <li id="november">November</li>',
                    '    <li id="oscar">Oscar</li>',
                    '    <li id="papa">Papa</li>',
                    '    <li id="quebec">Quebec</li>',
                    '    <li id="romeo">Romeo</li>',
                    '    <li id="sierra">Sierra</li>',
                    '    <li id="tango">Tango</li>',
                    '    <li id="uniform">Uniform</li>',
                    '    <li id="victor">Victor</li>',
                    '    <li id="whiskey">Whiskey</li>',
                    '    <li id="x-ray">X-ray</li>',
                    '    <li id="yankee">Yankee</li>',
                    '    <li id="zulu">Zulu</li>',
                    '</ul>'
                ].join('\n'));
                frame.contentWindow.document.close();

                rules = {
                    rules: {
                        container: [],
                        order: [
                            { selector: '#alpha', value: 0 },
                            { selector: '#bravo', value: 100 },
                            { selector: '#charlie', value: 200 },
                            { selector: '#delta', value: 300 },
                            { selector: '#echo', value: 400 },
                            { selector: '#foxtrot', value: 500 },
                            { selector: '#golf', value: 600 },
                            { selector: '#hotel', value: 700 },
                            { selector: '#india', value: 800 },
                            { selector: '#juliett', value: 900 },
                            { selector: '#kilo', value: 1000 },
                            { selector: '#lima', value: 1100 },
                            { selector: '#mike', value: 1200 },
                            { selector: '#november', value: 1300 },
                            { selector: '#oscar', value: 1400 },
                            { selector: '#papa', value: 1500 },
                            { selector: '#quebec', value: 1600 },
                            { selector: '#romeo', value: 1700 },
                            { selector: '#sierra', value: 1800 },
                            { selector: '#tango', value: 1900 },
                            { selector: '#uniform', value: 2000 },
                            { selector: '#victor', value: 2100 },
                            { selector: '#whiskey', value: 2200 },
                            { selector: '#x-ray', value: 2300 },
                            { selector: '#yankee', value: 2400 },
                            { selector: '#zulu', value: 2500 }
                        ]
                    },
                    mediaQueries: []
                };
                element = frame.contentWindow.document.documentElement;

                items = rules.rules.order.reduce(function(items, entry) {
                    var node = element.querySelector(entry.selector);

                    items[node.id] = node;

                    return items;
                }, {});
                list = element.querySelector('ul');

                spyOn(list, 'insertBefore').and.callThrough();

                applyRules(rules, element);
            });

            it('should not reorder the list if it doesn\'t need to be reordered', function() {
                expect(list.insertBefore).not.toHaveBeenCalled();
            });

            describe('if an item is moved down', function() {
                beforeEach(function() {
                    // Move #delta to be positioned after #romeo
                    rules.rules.order.push({ selector: '#delta', value: 1750 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['delta']);
                    expect(list.insertBefore).toHaveBeenCalledWith(items.delta, items.sierra);
                });

                describe('to the bottom of the list', function() {
                    beforeEach(function() {
                        list.insertBefore.calls.reset();
                        // Move #bravo to the bottom
                        rules.rules.order.push({ selector: '#bravo', value: 2600 });

                        applyRules(rules, element);
                    });

                    it('should move the minimal number of elements', function() {
                        assertNoMovesExcept(['bravo']);
                        expect(list.insertBefore).toHaveBeenCalledWith(items.bravo, null);
                    });
                });
            });

            describe('if an item is moved up', function() {
                beforeEach(function() {
                    // Move #tango to be positioned after #echo.
                    rules.rules.order.push({ selector: '#tango', value: 450 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['tango']);
                    expect(list.insertBefore).toHaveBeenCalledWith(items.tango, items.foxtrot);
                });

                describe('to the top of the list', function() {
                    beforeEach(function() {
                        list.insertBefore.calls.reset();
                        // Move #charlie to the top
                        rules.rules.order.push({ selector: '#charlie', value: -100 });

                        applyRules(rules, element);
                    });

                    it('should move the minimal number of elements', function() {
                        assertNoMovesExcept(['charlie']);
                        expect(list.insertBefore).toHaveBeenCalledWith(items.charlie, items.alpha);
                    });
                });
            });

            describe('if multiple elements are moved down', function() {
                beforeEach(function() {
                    // Move #golf to be positioned after #x-ray
                    rules.rules.order.push({ selector: '#golf', value: 2350 });
                    // Move #kilo to be positioned after #oscar
                    rules.rules.order.push({ selector: '#kilo', value: 1450 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['golf', 'kilo']);
                    expect(list.insertBefore).toHaveBeenCalledWith(items.golf, items.yankee);
                    expect(list.insertBefore).toHaveBeenCalledWith(items.kilo, items.papa);
                });
            });

            describe('if multiple elements are moved up', function() {
                beforeEach(function() {
                    // Move #victor to be positioned after #charlie
                    rules.rules.order.push({ selector: '#victor', value: 250 });
                    // Move #quebec to be positioned after #mike
                    rules.rules.order.push({ selector: '#quebec', value: 1250 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['victor', 'quebec']);
                    expect(list.insertBefore).toHaveBeenCalledWith(items.victor, items.delta);
                    expect(list.insertBefore).toHaveBeenCalledWith(items.quebec, items.november);
                });
            });

            describe('if multiple siblings are moved down', function() {
                beforeEach(function() {
                    // Move #charlie and #delta to be positioned after #papa
                    rules.rules.order.push({ selector: '#charlie', value: 1525 });
                    rules.rules.order.push({ selector: '#delta', value: 1550 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['charlie', 'delta']);

                    expect(items.charlie.previousElementSibling).toBe(items.papa);
                    expect(items.delta.previousElementSibling).toBe(items.charlie);
                    expect(items.delta.nextElementSibling).toBe(items.quebec);
                });
            });

            describe('if multiple siblings are moved up', function() {
                beforeEach(function() {
                    // Move #tango and #uniform to be positioned after #golf
                    rules.rules.order.push({ selector: '#tango', value: 625 });
                    rules.rules.order.push({ selector: '#uniform', value: 650 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['tango', 'uniform']);

                    expect(items.tango.previousElementSibling).toBe(items.golf);
                    expect(items.uniform.previousElementSibling).toBe(items.tango);
                    expect(items.uniform.nextElementSibling).toBe(items.hotel);
                });
            });

            describe('if two elements are swapped', function() {
                beforeEach(function() {
                    // Swap #charlie and #whiskey
                    rules.rules.order.push({ selector: '#charlie', value: 2200 });
                    rules.rules.order.push({ selector: '#whiskey', value: 200 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['charlie', 'whiskey']);

                    expect(items.charlie.previousElementSibling).toBe(items.victor);
                    expect(items.charlie.nextElementSibling).toBe(items['x-ray']);

                    expect(items.whiskey.previousElementSibling).toBe(items.bravo);
                    expect(items.whiskey.nextElementSibling).toBe(items.delta);
                });
            });

            describe('if multiple elements are swapped', function() {
                beforeEach(function() {
                    // Swap #charlie and #whiskey
                    rules.rules.order.push({ selector: '#charlie', value: 2200 });
                    rules.rules.order.push({ selector: '#whiskey', value: 200 });

                    // Swap #hotel and #tango
                    rules.rules.order.push({ selector: '#hotel', value: 1900 });
                    rules.rules.order.push({ selector: '#tango', value: 700 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['charlie', 'whiskey', 'hotel', 'tango']);

                    expect(items.charlie.previousElementSibling).toBe(items.victor);
                    expect(items.charlie.nextElementSibling).toBe(items['x-ray']);

                    expect(items.whiskey.previousElementSibling).toBe(items.bravo);
                    expect(items.whiskey.nextElementSibling).toBe(items.delta);

                    expect(items.hotel.previousElementSibling).toBe(items.sierra);
                    expect(items.hotel.nextElementSibling).toBe(items.uniform);

                    expect(items.tango.previousElementSibling).toBe(items.golf);
                    expect(items.tango.nextElementSibling).toBe(items.india);
                });
            });

            describe('if siblings are swapped', function() {
                beforeEach(function() {
                    // Swap #foxtrot and #golf with #tango and #uniform
                    rules.rules.order.push({ selector: '#foxtrot', value: 1900 });
                    rules.rules.order.push({ selector: '#golf', value: 2000 });
                    rules.rules.order.push({ selector: '#tango', value: 500 });
                    rules.rules.order.push({ selector: '#uniform', value: 600 });

                    applyRules(rules, element);
                });

                it('should move the minimal number of elements', function() {
                    assertNoMovesExcept(['foxtrot', 'golf', 'tango', 'uniform']);

                    expect(items.foxtrot.previousElementSibling).toBe(items.sierra);
                    expect(items.foxtrot.nextElementSibling).toBe(items.golf);

                    expect(items.golf.previousElementSibling).toBe(items.foxtrot);
                    expect(items.golf.nextElementSibling).toBe(items.victor);

                    expect(items.tango.previousElementSibling).toBe(items.echo);
                    expect(items.tango.nextElementSibling).toBe(items.uniform);

                    expect(items.uniform.previousElementSibling).toBe(items.tango);
                    expect(items.uniform.nextElementSibling).toBe(items.hotel);
                });
            });

            describe('if there is an unaccounted-for element in the list', function() {
                beforeEach(function() {
                    items.foo = frame.contentWindow.document.createElement('li');
                    items.foo.id = 'foo';
                    items.foo.innerHTML = 'Foo';

                    items.bar = items.foo.cloneNode();
                    items.bar.id = 'bar';
                    items.bar.innerHTML = 'Bar';

                    list.insertBefore(items.foo, items.lima);
                    list.insertBefore(items.bar, items.foxtrot);

                    list.insertBefore.calls.reset();

                    applyRules(rules, element);
                });

                it('the list should not be touched', function() {
                    expect(list.insertBefore).not.toHaveBeenCalled();
                });

                describe('and an item is moved down', function() {
                    beforeEach(function() {
                        // Move #delta to be positioned after #romeo
                        rules.rules.order.push({ selector: '#delta', value: 1750 });
                        applyRules(rules, element);
                    });

                    it('should move the item down', function() {
                        assertNoMovesExcept(['delta']);
                        expect(list.insertBefore).toHaveBeenCalledWith(items.delta, items.sierra);
                    });
                });

                describe('and an item is moved up', function() {
                    beforeEach(function() {
                        // Move #delta to the top
                        rules.rules.order.push({ selector: '#delta', value: -100 });
                        applyRules(rules, element);
                    });

                    it('should move the item up', function() {
                        assertNoMovesExcept(['delta']);
                        expect(list.insertBefore).toHaveBeenCalledWith(items.delta, items.alpha);
                    });
                });
            });

            describe('and the list is reversed', function() {
                var expected;

                beforeEach(function() {
                    rules.rules.order = [
                        { selector: '#alpha', value: 2500 },
                        { selector: '#bravo', value: 2400 },
                        { selector: '#charlie', value: 2300 },
                        { selector: '#delta', value: 2200 },
                        { selector: '#echo', value: 2100 },
                        { selector: '#foxtrot', value: 2000 },
                        { selector: '#golf', value: 1900 },
                        { selector: '#hotel', value: 1800 },
                        { selector: '#india', value: 1700 },
                        { selector: '#juliett', value: 1600 },
                        { selector: '#kilo', value: 1500 },
                        { selector: '#lima', value: 1400 },
                        { selector: '#mike', value: 1300 },
                        { selector: '#november', value: 1200 },
                        { selector: '#oscar', value: 1100 },
                        { selector: '#papa', value: 1000 },
                        { selector: '#quebec', value: 900 },
                        { selector: '#romeo', value: 800 },
                        { selector: '#sierra', value: 700 },
                        { selector: '#tango', value: 600 },
                        { selector: '#uniform', value: 500 },
                        { selector: '#victor', value: 400 },
                        { selector: '#whiskey', value: 300 },
                        { selector: '#x-ray', value: 200 },
                        { selector: '#yankee', value: 100 },
                        { selector: '#zulu', value: 0 }
                    ];

                    expected = Array.prototype.slice.call(list.children).reverse();

                    applyRules(rules, element);
                });

                it('should reverese the list', function() {
                    expect(Array.prototype.slice.call(list.children)).toEqual(expected, list.outerHTML);
                });
            });

            describe('if given a random re-ordering', function() {
                var expected;

                beforeEach(function() {
                    expected = shuffle(Array.prototype.slice.call(list.children));
                    rules.rules.order = expected.map(function(element, index) {
                        return { selector: '#' + element.id, value: index * 100 };
                    });

                    applyRules(rules, element);
                });

                it('should reorder the elements', function() {
                    expect(Array.prototype.slice.call(list.children)).toEqual(expected, list.outerHTML);
                });
            });
        });
    });
});
