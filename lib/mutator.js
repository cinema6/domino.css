'use strict';

var matchesMedia = require('./media_matcher');

/*
 * This Function adds a Node to a given context Object (by adding an entry to its children Array.)
 * The child is inserted in the Array such that the children are sorted based on "order"
 * (descending.) If an entry for a child Node already exists, the existing entry is removed.
 */
function addNode(parent, node, order, contexts) {
    var length = contexts.length;
    var index, context;
    var children, childrenLength, child;
    var targetContext, insertionIndex;
    var childFound = false;

    while (length--) {
        context = contexts[length];

        // No need to keep searching contexts for this node if it has already been found.
        if (!childFound) {
            children = context.children;
            childrenLength = children.length;

            while (childrenLength--) {
                child = children[childrenLength];

                // Check to see if this node was previously added to a context.
                if (child.node === node) {
                    children.splice(childrenLength, 1);
                    childFound = true;
                    break;
                }
            }
        }

        if (context.parent === parent) {
            targetContext = context;

            // If we found the context AND the child, there is no need to keep looping.
            if (childFound) { break; }
        }
    }

    // No context for this parent node was found. Create one.
    if (!targetContext) {
        targetContext = {
            parent: parent,
            children: []
        };

        contexts.push(targetContext);
    }

    // Insert the child in the correct spot based on its order.
    children = targetContext.children;
    length = children.length;
    insertionIndex = length; // Insert at the end by default.
    for (index = 0; index < length; index++) {
        child = children[index];

        if (order < child.order) {
            // If my order is less than this child's, take its spot.
            insertionIndex = index;
            break;
        }
    }

    children.splice(insertionIndex, 0, {
        order: order,
        node: node
    });
}

/**
 * Gets the parent Node of a Node. Because a Node could have a new parent (specified by a
 * -domino-container rule,) the contexts are first checked to see if a given Node has a parent
 * specified. If no context for the child is found, its actual parentNode in the DOM is used.
 */
function getParent(node, contexts) {
    var length = contexts.length;
    var context;
    var children, childrenLength;

    while (length--) {
        context = contexts[length];
        children = context.children;
        childrenLength = children.length;

        while (childrenLength--) {
            if (children[childrenLength].node === node) {
                return context.parent;
            }
        }
    }

    return node.parentNode;
}

/**
 * This Function loops through contexts and applies the nesting/ordering logic there to the DOM.
 */
function mutateDOM(contexts) {
    var length = contexts.length;
    var index, context, parentNode;
    var children, childrenLength, child, previousSibling, dirty;

    for (index = 0; index < length; index++) {
        context = contexts[index];
        parentNode = context.parent;
        children = context.children;
        childrenLength = children.length;
        dirty = false;

        while (childrenLength--) {
            child = children[childrenLength];
            previousSibling = children[childrenLength - 1] || null;

            // Check to see if we actually need to do anything.
            if (
                child.node.parentNode !== parentNode ||
                child.node.previousElementSibling !== (previousSibling && previousSibling.node)
            ) {
                dirty = true;
                break;
            }
        }

        if (dirty) {
            childrenLength = children.length;

            while (childrenLength--) {
                parentNode.insertBefore(children[childrenLength].node, parentNode.firstChild);
            }
        }
    }
}


module.exports = function applyRules(rules, element) {
    var window = element.ownerDocument.defaultView;
    var contexts = [];
    var elementCache = {};

    function find(selector) {
        if (elementCache[selector]) {
            return elementCache[selector];
        }

        return (elementCache[selector] = element.querySelectorAll(selector));
    }

    function apply(rules) {
        var container = rules.container;
        var order = rules.order;

        var length, index, rule;
        var nodes, nodesLength, nodeIndex, node, parent;

        // Nesting is applied first (so that ordering contexts are created based on nesting rules.)
        length = container.length;
        for (index = 0; index < length; index++) {
            rule = container[index];
            nodes = find(rule.selector);
            parent = find(rule.value)[0];

            if (!parent) { continue; }

            nodesLength = nodes.length;
            for (nodeIndex = 0; nodeIndex < nodesLength; nodeIndex++) {
                node = nodes[nodeIndex];

                // Add the Node to the contexts Array with its parent as the Node specified by the
                // -domino-conainer rule.
                addNode(parent, node, Infinity, contexts);
            }
        }

        // Then, ordering is applied.
        length = order.length;
        for (index = 0; index < length; index++) {
            rule = order[index];
            nodes = find(rule.selector);

            nodesLength = nodes.length;
            for (nodeIndex = 0; nodeIndex < nodesLength; nodeIndex++) {
                node = nodes[nodeIndex];

                // Add the Node to/update the Node in the contexts Array with its parent as its
                // actual parent OR the parent it will have after nesting rules are applied.
                addNode(getParent(node, contexts), node, rule.value, contexts);
            }
        }
    }

    function applyMediaQueries(mediaQueries) {
        var length = mediaQueries.length;
        var index, mediaQuery;

        for (index = 0; index < length; index++) {
            mediaQuery = mediaQueries[index];

            if (matchesMedia(mediaQuery.directive, window)) {
                apply(mediaQuery.rules);
            }
        }
    }

    // Apply base rules.
    apply(rules.rules);
    // Then, apply relevant media queries.
    applyMediaQueries(rules.mediaQueries);

    // Finally, the actual DOM is updated.
    mutateDOM(contexts);
};
