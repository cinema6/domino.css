'use strict';

var parseCSS = require('./lib/parser');

module.exports = function compile(css) {
    return (
        '(function(rules){' +
            'rules.push(' + JSON.stringify(parseCSS(css)) + ');' +
        '}(window.__dominoCSSRules__||(window.__dominoCSSRules__=[])));'
    );
};
