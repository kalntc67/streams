const fs = require('fs');
const jsdom = require('jsdom');
const Spec = require('ecmarkup/lib/Spec');
const Algorithm = require('ecmarkup/lib/Algorithm');

const inputPath = process.argv[2];

const doc = jsdom.jsdom(fs.readFileSync(inputPath, { encoding: 'utf-8' }));
const spec = new Spec(inputPath, fetch, doc);

Promise.all([
  spec.loadES6Biblio(),
  spec.loadBiblios()
])
.then(() => spec.buildAlgs())
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
