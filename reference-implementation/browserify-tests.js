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

const dest = fs.createWriteStream('./bundle.js');

dest.write(`
var global = this;

// setTimeout should not be used by our tests (I think I have eradicated it from the whitelisted ones so far)
// However browserify's process.nextTick shim uses it as a fallback.
// https://github.com/substack/node-browserify/issues/1109
function setTimeout(fn) {
  Promise.resolve().then(fn);
}

var console = {
  log: print
};
`,
function (err) {
  if (err) {
    throw err;
  }

  browserify()
    .add(es6ify.runtime)
    .transform(es6ify)
    .add(require.resolve('./test/readable-stream.js'))
    .bundle()
    .pipe(dest);
});
