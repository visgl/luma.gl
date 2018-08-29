/* global console, process */
/* eslint-disable no-console */

const {GLBParser} = require('../src/glb-loader');
const {toArrayBuffer} = require('../src/common/loader-utils');

const fs = require('fs');

const [,, ...args] = process.argv;

if (args.length === 0) {
  console.log('glbdump: no glb files specifed...');
  process.exit(0); // eslint-disable-line
}

for (const filename of args) {
  console.log(`\nGLB dump of ${filename}:`);

  const binary = fs.readFileSync(filename);
  // process.stdout.write(binary.slice(0, 48));
  // console.log('\n');

  const arrayBuffer = toArrayBuffer(binary);

  const data = new GLBParser(arrayBuffer).parseWithMetadata({ignoreMagic: true});

  for (const key in data) {
    const array = data[key];
    if (Array.isArray(array)) {
      logArray(key, array);
    }
  }
}

function logArray(key, array) {
  array.forEach((object, i) =>
    console.log(`${key.toUpperCase()}-${i}: ${JSON.stringify(object).slice(0, 60)}...`)
  );
}
