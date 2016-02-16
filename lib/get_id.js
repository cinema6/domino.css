'use strict';

var counter = 0;

module.exports = function getID() {
    return (counter++).toString();
};
