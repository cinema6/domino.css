'use strict';

var proxyquire = require('proxyquire');

describe('lib/media_matcher.js: matchMedia(query, window)', function() {
    var matchMedia;
    var stubs;
    var frame;

    beforeEach(function() {
        stubs = {
            '@noCallThru': true
        };

        matchMedia = proxyquire('../../lib/media_matcher', stubs);

        frame = document.createElement('iframe');
        document.body.appendChild(frame);
    });

    afterEach(function() {
        document.body.removeChild(frame);
    });

    it('should exist', function() {
        expect(matchMedia).toEqual(jasmine.any(Function));
        expect(matchMedia.name).toBe('matchMedia');
    });

    describe('when called', function() {
        var query, window;
        var result;

        beforeEach(function() {
            query = 'only screen and (min-width: 480px)';
            window = frame.contentWindow;
        });

        describe('if the matchMedia API is available', function() {
            beforeEach(function() {
                expect(window.matchMedia).toEqual(jasmine.any(Function));
                spyOn(window, 'matchMedia').and.callThrough();
            });

            describe('if the query matches', function() {
                beforeEach(function() {
                    window.matchMedia.and.returnValue({
                        matches: true
                    });

                    result = matchMedia(query, window);
                });

                it('should check the media query', function() {
                    expect(window.matchMedia).toHaveBeenCalledWith(query);
                });

                it('should return true', function() {
                    expect(result).toBe(true);
                });
            });

            describe('if the query does not match', function() {
                beforeEach(function() {
                    window.matchMedia.and.returnValue({
                        matches: false
                    });

                    result = matchMedia(query, window);
                });

                it('should check the media query', function() {
                    expect(window.matchMedia).toHaveBeenCalledWith(query);
                });

                it('should return false', function() {
                    expect(result).toBe(false);
                });
            });
        });

        describe('if the StyleMedia API is available', function() {
            beforeEach(function() {
                window.matchMedia = undefined;

                expect(window.styleMedia.matchMedium).toEqual(jasmine.any(Function));
                spyOn(window.styleMedia, 'matchMedium').and.callThrough();
            });

            describe('if the query matches', function() {
                beforeEach(function() {
                    window.styleMedia.matchMedium.and.returnValue(true);

                    result = matchMedia(query, window);
                });

                it('should check the media query', function() {
                    expect(window.styleMedia.matchMedium).toHaveBeenCalledWith(query);
                });

                it('should return true', function() {
                    expect(result).toBe(true);
                });
            });

            describe('if the query does not match', function() {
                beforeEach(function() {
                    window.styleMedia.matchMedium.and.returnValue(false);

                    result = matchMedia(query, window);
                });

                it('should check the media query', function() {
                    expect(window.styleMedia.matchMedium).toHaveBeenCalledWith(query);
                });

                it('should return false', function() {
                    expect(result).toBe(false);
                });
            });
        });

        describe('if no window is specified', function() {
            beforeEach(function() {
                spyOn(global, 'matchMedia').and.callThrough();

                result = matchMedia(query);
            });

            it('should call the main window.matchMedia()', function() {
                expect(global.matchMedia).toHaveBeenCalledWith(query);
            });

            it('should return the result of window.matchMedia()', function() {
                expect(result).toEqual(global.matchMedia.calls.mostRecent().returnValue.matches);
            });
        });
    });
});
