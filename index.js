'use strict';

var bootstrapper = require('./lib/bootstrapper');
var getUnparsedRules = require('./lib/unparsed_rule_getter');

module.exports.parse = require('./lib/parser');
module.exports.applyRules = require('./lib/mutator');
module.exports.bootstrap = function bootstrap(element) {
    return bootstrapper(element, getUnparsedRules);
};
