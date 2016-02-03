'use strict';

var push = Array.prototype.push;

module.exports = function getParsedRules(element, callback) {
    var sets = global.__dominoCSSRules__ || [];
    var length = sets.length;
    var container = [];
    var order = [];
    var mediaQueries = [];
    var index, rules;

    if (!callback) { return; }

    for (index = 0; index < length; index++) {
        rules = sets[index];

        push.apply(container, rules.rules.container);
        push.apply(order, rules.rules.order);
        push.apply(mediaQueries, rules.mediaQueries);
    }

    callback(null, {
        rules: {
            container: container,
            order: order
        },
        mediaQueries: mediaQueries
    });
};
