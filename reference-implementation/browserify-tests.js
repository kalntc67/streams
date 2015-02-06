'use strict';
const browserify = require('browserify');
const es6ify = require('es6ify');
const fs = require('fs');

es6ify.traceurOverrides = {
  blockBinding: 'parse',
//  classes: 'parse',
//  computedPropertyNames: 'parse',
  forOf: 'parse',
  generators: 'parse',
  numericLiterals: 'parse',
//  propertyMethods: 'parse',
//  propertyNameShorthand: 'parse',
  symbols: false,
  templateLiterals: 'parse'
};

const bundle = browserify()
                .add(es6ify.runtime)
                .transform(es6ify)
                .add(require.resolve('./test/readable-stream.js'))
                .bundle()
                .pipe(fs.createWriteStream('./bundle.js'));

// Also need to prepend `var global = this` at the top.
