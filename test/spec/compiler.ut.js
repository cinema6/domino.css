'use strict';

var proxyquire = require('proxyquire');
var fs = require('fs');
var parseCSS = require('../../lib/parser');

describe('compiler.js', function() {
    var compiler;
    var stubs;

    beforeEach(function() {
        stubs = {
            '@noCallThru': true
        };

        compiler = proxyquire('../../compiler', stubs);
    });

    it('should exist', function() {
        expect(compiler).toEqual(jasmine.any(Function));
        expect(compiler.name).toBe('compile');
    });

    describe('when called', function() {
        var css;
        var result;

        beforeEach(function() {
            css = fs.readFileSync(require.resolve('../helpers/styles.css')).toString();

            result = compiler(css);
        });

        it('should return a String of JavaScript representing the styles', function() {
            expect(result).toEqual('(function(rules){rules.push(' + JSON.stringify(parseCSS(css)) + ');}(window.__dominoCSSRules__||(window.__dominoCSSRules__=[])));');
        });
    });
});
