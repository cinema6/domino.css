'use strict';

var matchesMedia = require('./media_matcher');

var getID = (function() {
    var counter = 0;

    return function getID(element) {
        if (!element.__dominoCSSId__) {
            return (element.__dominoCSSId__ = (counter++).toString());
        }

        return element.__dominoCSSId__;
    };
}());

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
 * Computes a small amount of moves (Node.prototype.insertBefore()) that are required to mutate
 * collection o (old) into collection n (new). It will compute a small amount of moves if elements
 * are moved up/down as well as swapped.
 *
 * Inspired by [this code](https://github.com/paldepind/flyview/blob/gh-pages/flyview.js#L87-L142).
 */
function diff(o, n) { // o: old list of elements, n: new list of elements.
    var oLength = o.length;
    var nLength = n.length;
    var oIndices = {};
    var nIndices = {};
    var dMissing = {};
    var uMissing = {};
    var dMoves = []; // Moves (insertBefore()) if we assume elements have moved down the list
    var uMoves = []; // Moves (insertBefore()) if we assume elements have moved up the list
    var sMoves = []; // Moves (insertBefore()) if we assume two or more elements have been swapped
    var odIndex, ndIndex, odElement, ndElement; // old/new indices/elements for the "down" algorithm
    var ouIndex, nuIndex, ouElement, nuElement; // old/new indices/elements for the "up" algorithm
    var osIndex, nsIndex, osElement, nsElement; // old/new indices/elements for the "swap" algorith
    var dDone, uDone, sDone;
    var length;

    // Create mappings of unique element IDs to their indices in the old/new lists. This allows
    // the index of a given element in the other list to be looked-up in constant time.
    length = oLength;
    while (length--) {
        oIndices[getID(o[length])] = length;
    }
    length = nLength;
    while (length--) {
        nIndices[getID(n[length])] = length;
    }

    if (oLength === 0 && nLength === 0) {
        return [];
    }

    // Start everything at the beginning of the list.
    odIndex = ndIndex = ouIndex = nuIndex = osIndex = nsIndex = 0;
    // We keep looping until one of the algorithms finishes processing both lists and an Array of
    // moves is returned.
    while (true) {
        /* ===================DOWN ALGORITHM=================== */
        odElement = o[odIndex]; // Old element.
        ndElement = n[ndIndex]; // New element.

        if (odElement && nIndices[getID(odElement)] === undefined) {
            // This element (from the old list) is not in the new list. Skip it. Move to the next
            // item in the old list.
            odIndex++;
        } else if (ndElement && oIndices[getID(ndElement)] === undefined) {
            // This element (from the new list) is not in the old list. It needs to be inserted.
            // Add a move to insert this element at the proper index. Continue to the next item
            // in the new list.
            dMoves.push({
                element: ndElement,
                index: ndIndex
            });
            ndIndex++;
        } else if (odElement === ndElement) {
            // These two elements are the same. There is nothing to do here. Move to the next item
            // in both the old and new lists.
            odIndex++; ndIndex++;
        } else {
            if (!dMissing[getID(ndElement)]) {
                // This element (from the old list) is not in the same place in the new list. We're
                // not sure where it is, so we mark it as missing and continue with the next item in
                // the old list.
                dMissing[getID(odElement)] = true;
                odIndex++;
            } else {
                // This element (from the new list) was previously marked as missing from the old
                // list. We've now found it at its new position further down in the list. Add a move
                // to move this element down the list. Continue to the next item in the new list.
                dMoves.push({
                    element: ndElement,
                    index: ndIndex
                });
                ndIndex++;
            }
        }
        /* ==================================================== */

        /* ====================UP ALGORITHM==================== */
        ouElement = o[ouIndex]; // Old element.
        nuElement = n[nuIndex]; // New element.

        if (ouElement && nIndices[getID(ouElement)] === undefined) {
            // This element (from the old list) is not in the new list. Skip it. Move to the next
            // item in the old list.
            ouIndex++;
        } else if (nuElement && oIndices[getID(nuElement)] === undefined) {
            // This element (from the new list) is not in the old list. It needs to be inserted.
            // Add a move to insert this element at the proper index. Continue to the next item
            // in the new list.
            uMoves.push({
                element: nuElement,
                index: nuIndex
            });
            nuIndex++;
        } else if (ouElement === nuElement) {
            // These two elements are the same. There is nothing to do here. Move to the next item
            // in both the old and new lists.
            ouIndex++; nuIndex++;
        } else {
            if (!uMissing[getID(ouElement)]) {
                // This element (from the new list) is not in the same place in the old list. We're
                // not sure where it is, so we mark it as missing and continue with the next item in
                // the new list.
                uMissing[getID(nuElement)] = true;
                nuIndex++;
            } else {
                // This element (from the old list) was previously marked as missing from the new
                // list. We've now found it at its old position further down in the list. Add a move
                // to move this element up the list. Continue to the next item in the old list.
                uMoves.push({
                    element: ouElement,
                    index: nIndices[getID(ouElement)]
                });
                ouIndex++;
            }
        }
        /* ==================================================== */

        /* ===================SWAP ALGORITHM=================== */
        if (osIndex !== oLength && nsIndex !== nLength) {
            osElement = o[osIndex];
            nsElement = n[nsIndex];

            if (
                // The elements don't match.
                osElement !== nsElement ||
                // The element in the new list does not exist in the old list (needs insertion.)
                (nsElement && oIndices[getID(nsElement)] === undefined)
            ) {
                sMoves.push({
                    element: nsElement,
                    index: nsIndex
                });
            }

            // Move to the next item in both lists.
            osIndex++; nsIndex++;
        }
        /* ==================================================== */

        dDone = (odIndex === oLength && ndIndex === nLength); // Is the "down" algorithm done?
        uDone = (ouIndex === oLength && nuIndex === nLength); // Is the "up" algoritm done?
        sDone = (osIndex === oLength && nsIndex === nLength); // Is the "swap" algoritm done?

        // The swap algorithm will always finish first because it will always move on to the next
        // element in both lists whereas the "down" and "up" algorithms will "pause" on an item in
        // one list until it finds two matching elements again.
        if (dDone && uDone && sDone) {
            // If the "down" and "up" algorithms finish at the same time (meaning they both
            // calculated the same amount of moves,) it is better to go with the "swap" moves.
            return sMoves;
        } else if (dDone) {
            // If the "down" algorithm finished first, it will have the least amount of moves.
            // Return its moves.
            return dMoves;
        } else if (uDone) {
            // If the "up" algoritm finished first, it will have the least amount of moves. Use it.
            return uMoves;
        }
    }
}

/**
 * This Function loops through contexts and applies the nesting/ordering logic there to the DOM.
 */
function mutateDOM(contexts) {
    var length = contexts.length;
    var index, context, parent, childrenLength, oldOrder, newOrder;
    var moves, movesLength, move, beforeElement;
    var moving = {};

    for (index = 0; index < length; index++) {
        context = contexts[index];
        parent = context.parent;
        childrenLength = context.children.length;

        oldOrder = parent.children;
        newOrder = new Array(childrenLength);
        while (childrenLength--) {
            newOrder[childrenLength] = context.children[childrenLength].node;
        }

        moves = diff(oldOrder, newOrder);

        movesLength = moves.length;
        while (movesLength--) {
            moving[getID(moves[movesLength].element)] = moves[movesLength].index;
        }

        movesLength = moves.length;
        while (movesLength--) {
            move = moves[movesLength];
            beforeElement = newOrder[move.index + 1] || null;

            while (true) {
                if (beforeElement && (moving[getID(beforeElement)] !== undefined)) {
                    // The element we're inserting this one before is going to be moved—but has not
                    // been moved yet, take its place.
                    beforeElement = newOrder[moving[getID(beforeElement)] + 1];
                } else {
                    break;
                }
            }

            moving[getID(move.element)] = undefined;
            parent.insertBefore(move.element, beforeElement);
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
