'use strict';

var applyRules = require('./mutator');

module.exports = function bootstrap(element, getRules) {
    var window = element.ownerDocument.defaultView;
    var rules = null;

    function apply() {
        if (!rules) { return; }

        return applyRules(rules, element);
    }

    getRules(element, function handleRules(error/*, rules*/) {
        if (error) { throw error; }

        rules = arguments[1];
        window.addEventListener('resize', apply, false);

        return apply();
    });

    return apply;
};
