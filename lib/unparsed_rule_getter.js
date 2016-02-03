'use strict';

var superagent = require('superagent');
var parseCSS = require('./parser');

var concat = Array.prototype.concat;

function forEach(collection, iterator) {
    var length = collection.length;
    var index;

    for (index = 0; index < length; index++) {
        iterator(collection[index], index, collection);
    }

    return collection;
}

module.exports = function getUnparsedRules(element, callback) {
    var nodes = element.querySelectorAll('link[rel="stylesheet"],style');
    var totalNodes = nodes.length;
    var container = new Array(totalNodes);
    var order = new Array(totalNodes);
    var mediaQueries = new Array(totalNodes);
    var parsed = 0;

    function complete() {
        callback(null, {
            rules: {
                container: concat.apply([], container),
                order: concat.apply([], order)
            },
            mediaQueries: concat.apply([], mediaQueries)
        });
    }

    function addRules(styles, index) {
        var rules;

        try {
            rules = parseCSS(styles);
        } catch(e) {
            rules = {
                rules: { container: [], order: [] },
                mediaQueries: []
            };
        }

        container[index] = rules.rules.container;
        order[index] = rules.rules.order;
        mediaQueries[index] = rules.mediaQueries;

        if (++parsed === totalNodes) {
            complete();
        }
    }

    if (!callback) { return; }

    forEach(nodes, function getParsedStyles(node, index) {
        switch (node.tagName) {
        case 'LINK':
            return superagent(node.getAttribute('href'), function handleResponse(error, response) {
                if (error) {
                    return addRules('', index);
                }

                return addRules(response.text, index);
            });
        case 'STYLE':
            return addRules(node.innerHTML, index);
        }
    });
};
