'use strict';

var parse = require('css/lib/parse');
var CssSelectorParser = require('css-selector-parser').CssSelectorParser;
var selectorParser = new CssSelectorParser();

var COMBINATOR_REGEX = /\s|>|\+|~/;

function createElements(value) {
    var parsed = selectorParser.parse(value);
    var selectors = parsed.selectors || [parsed];
    var length = selectors.length;
    var result = [];
    var index, selector, element;
    var attrLength, attrIndex, attr;

    for (index = 0; index < length; index++) {
        selector = selectors[index];

        element = {
            tagName: selector.rule.tagName || 'div',
            attributes: []
        };

        if (selector.rule.id) {
            element.attributes.push({ name: 'id', value: selector.rule.id });
        }

        if (selector.rule.classNames) {
            element.attributes.push({ name: 'class', value: selector.rule.classNames.join(' ') });
        }

        if (selector.rule.attrs) {
            attrLength = selector.rule.attrs.length;
            for (attrIndex = 0; attrIndex < attrLength; attrIndex++) {
                attr = selector.rule.attrs[attrIndex];

                element.attributes.push({ name: attr.name, value: attr.value });
            }
        }

        result.push(element);
    }

    return result;
}

function processRule(rule, categories, mediaQueries) {
    var container = categories.container;
    var order = categories.order;
    var elements = categories.elements;
    var selectorsLength, selectorIndex, selector;
    var declarationsLength, declarationIndex, declaration;
    var mediaRules, mediaRulesLength, mediaRuleIndex;
    var mediaContainer, mediaOrder, mediaElements;
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
                case '-domino-elements':
                    elements.push({
                        selector: selector,
                        value: createElements(declaration.value)
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
        mediaElements = [];

        mediaRules = rule.rules;
        mediaRulesLength = mediaRules.length;
        for (mediaRuleIndex = 0; mediaRuleIndex < mediaRulesLength; mediaRuleIndex++) {
            if (processRule(mediaRules[mediaRuleIndex], {
                container: mediaContainer,
                order: mediaOrder,
                elements: mediaElements
            })) {
                mediaQueryAdded = true;
            }
        }

        if (mediaQueryAdded) {
            mediaQueries.push({
                directive: rule.media,
                rules: {
                    container: mediaContainer,
                    order: mediaOrder,
                    elements: mediaElements
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
    var elements = [];
    var mediaQueries = [];

    var length = rules.length;
    var index;

    for (index = 0; index < length; index++) {
        processRule(rules[index], {
            container: container,
            order: order,
            elements: elements
        }, mediaQueries);
    }

    return {
        rules: {
            container: container,
            order: order,
            elements: elements
        },
        mediaQueries: mediaQueries
    };
};
