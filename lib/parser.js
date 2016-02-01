'use strict';

var parse = require('css/lib/parse');

var COMBINATOR_REGEX = /\s|>|\+|~/;

function processRule(rule, container, order, mediaQueries) {
    var selectorsLength, selectorIndex, selector;
    var declarationsLength, declarationIndex, declaration;
    var mediaRules, mediaRulesLength, mediaRuleIndex;
    var mediaContainer, mediaOrder;
    var mediaQueryAdded;
    var ruleAdded = false;

    if (rule.type === 'rule') {
        selectorsLength = rule.selectors.length;
        declarationsLength = rule.declarations.length;
        for (selectorIndex = 0; selectorIndex < selectorsLength; selectorIndex++) {
            selector = rule.selectors[selectorIndex];

            if (COMBINATOR_REGEX.test(selector)) { continue; }

            for (declarationIndex = 0; declarationIndex < declarationsLength; declarationIndex++) {
                declaration = rule.declarations[declarationIndex];

                switch (declaration.property) {

                case '-domino-container':
                    container.push({
                        selector: selector,
                        value: declaration.value
                    });
                    ruleAdded = true;
                    break;

                case '-domino-order':
                    order.push({
                        selector: selector,
                        value: parseInt(declaration.value, 10)
                    });
                    ruleAdded = true;
                    break;

                }
            }
        }

        return ruleAdded;
    } else if (rule.type === 'media') {
        mediaQueryAdded = false;
        mediaContainer = [];
        mediaOrder = [];

        mediaRules = rule.rules;
        mediaRulesLength = mediaRules.length;
        for (mediaRuleIndex = 0; mediaRuleIndex < mediaRulesLength; mediaRuleIndex++) {
            if (processRule(mediaRules[mediaRuleIndex], mediaContainer, mediaOrder)) {
                mediaQueryAdded = true;
            }
        }

        if (mediaQueryAdded) {
            mediaQueries.push({
                directive: rule.media,
                rules: {
                    container: mediaContainer,
                    order: mediaOrder
                }
            });
        }

        return mediaQueryAdded;
    }
}

module.exports = function parseCSS(stylesheet) {
    var ast = parse(stylesheet);
    var rules = ast.stylesheet.rules;

    var container = [];
    var order = [];
    var mediaQueries = [];

    var length = rules.length;
    var index;

    for (index = 0; index < length; index++) {
        processRule(rules[index], container, order, mediaQueries);
    }

    return {
        rules: {
            container: container,
            order: order
        },
        mediaQueries: mediaQueries
    };
};
