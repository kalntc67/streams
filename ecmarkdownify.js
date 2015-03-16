const fs = require('fs');
const jsdom = require('jsdom');
const Spec = require('ecmarkup/lib/Spec');
const Algorithm = require('ecmarkup/lib/Algorithm');

// Hard code for now because traceur-runner is not happy with command line arguments
const inputPath = 'index.html';
const outputPath = 'index2.html';

const doc = jsdom.jsdom(fs.readFileSync(inputPath, { encoding: 'utf-8' }));

// Work around https://github.com/tabatkins/bikeshed/issues/380 by authoring the .bs file with <pre is="emu-alg">
// (which means the input to this script contains <pre is="emu-alg">) then converting to real <emu-alg> before
// passing to Ecmarkup.
const algs = Array.from(doc.querySelectorAll('pre[is="emu-alg"]'));
for (const preAlg of algs) {
  const realAlg = doc.createElement('emu-alg');
  realAlg.innerHTML = preAlg.innerHTML;
  preAlg.parentNode.replaceChild(realAlg, preAlg);
}

const spec = new Spec(inputPath, fetch, doc);

Promise.all([
  spec.loadES6Biblio(),
  spec.loadBiblios()
])
.then(() => {
  // Allow aoid="" anywhere. Ecmarkup only likes it on <emu-clause> and <emu-alg>, I think.
  const aos = Array.from(doc.querySelectorAll('[aoid]'));
  for (const ao of aos) {
    const aoid = ao.getAttribute('aoid');
    spec.biblio.ops[aoid] = '#' + ao.id;
  }
})
.then(() => spec.buildAlgs())
.then(() => {
  const result = jsdom.serializeDocument(doc);
  fs.writeFileSync(outputPath, result);
})
.catch(e => process.nextTick(() => { throw e; }));


function fetch(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, contents) => {
      if (err) {
        reject(err);
      }
      resolve(contents);
    });
  });
}
