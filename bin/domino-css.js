#!/usr/bin/env node

'use strict';

var program = require('commander');
var compiler = require('../compiler');
var through = require('through2');
var css = '';

program.version(require('../package.json').version)
    .parse(process.argv);

process.stdin.pipe(through(function concat(chunk, encoding, done) {
    css += chunk.toString(); done();
}, function finish(done) {
    this.push(compiler(css)); done();
})).pipe(process.stdout);
