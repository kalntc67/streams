const fs = require('fs');
const jsdom = require('jsdom');
const Spec = require('ecmarkup/lib/Spec');
const Algorithm = require('ecmarkup/lib/Algorithm');

const inputPath = 'index.html';
const outputPath = 'index2.html';

const doc = jsdom.jsdom(fs.readFileSync(inputPath, { encoding: 'utf-8' }));

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
