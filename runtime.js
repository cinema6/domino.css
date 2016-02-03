'use strict';

var bootstrapper = require('./lib/bootstrapper');
var getParsedRules = require('./lib/parsed_rule_getter');

module.exports.parse = function parse() {
    throw new Error('Parsing is not available at runtime.');
};
module.exports.applyRules = require('./lib/mutator');
module.exports.bootstrap = function bootstrap(element) {
    return bootstrapper(element, getParsedRules);
};
