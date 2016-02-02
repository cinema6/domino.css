'use strict';

module.exports = function matchMedia(query/*, window*/) {
    var window = arguments.length > 1 ? arguments[1] : global;

    if (window.matchMedia) {
        return window.matchMedia(query).matches;
    }

    return window.styleMedia.matchMedium(query);
};
