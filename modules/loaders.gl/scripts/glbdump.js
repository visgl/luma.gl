/* global console, process */
/* eslint-disable no-console */

const {GLBParser, GLTFParser, toArrayBuffer} = require('../src');

const fs = require('fs');

function printHelp() {
  console.log('glbdump: no glb files specified...');
  console.log('glbdump --json Pretty prints the JSON chunk...');
  console.log('glbdump --gltf Parses as glTF and pretty prints all scenes...');
  process.exit(0); // eslint-disable-line
}

let options;

function main() {
  const [,, ...args] = process.argv;

  if (args.length === 0) {
    printHelp();
  }

  options = parseOptions(args);

  for (const filename of args) {
    if (filename.indexOf('--') !== 0) {
      dumpFile(filename);
    }
  }
}

main();

function dumpFile(filename) {
  console.log(`\nGLB dump of ${filename}:`);

  const binary = fs.readFileSync(filename);
  // process.stdout.write(binary.slice(0, 48));
  // console.log('\n');

  const arrayBuffer = toArrayBuffer(binary);

  const data = new GLBParser(arrayBuffer).parseWithMetadata({ignoreMagic: true});

  if (options.dumpGLTF) {
    dumpGLTFScenes(data);
  } else {
    dumpGLBSegments(data);
  }

  if (options.dumpJSON) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// GLB SEGMENTS

function dumpGLBSegments(data) {
  for (const key in data) {
    const array = data[key];
    if (Array.isArray(array)) {
      logArray(key, array);
    } else if (array && typeof array === 'object') {
      logObject(key, array);
    }
  }
}

function logArray(key, array) {
  array.forEach((object, i) =>
    console.log(`${key.toUpperCase()}-${i}: ${JSON.stringify(object).slice(0, 60)}...`)
  );
}

function logObject(field, object) {
  Object.keys(object).forEach((key, i) =>
    console.log(`${field.toUpperCase()}-${i}: ${JSON.stringify(object[key]).slice(0, 60)}...`)
  );
}

// GLTF

function dumpGLTFScenes(data) {
  const gltfParser = new GLTFParser(data);
  const gltf = gltfParser.resolve();
  if (gltf.asset) {
    console.log(JSON.stringify(gltf.asset, null, 2));
  }
  const scenes = gltf.scenes || [];
  for (const scene of scenes) {
    console.log(JSON.stringify(scene, null, 2));
  }
}

// OPTIONS

function parseOptions(args) {
  const opts = {
    dumpJSON: false
  };

  for (const arg of args) {
    if (arg.indexOf('--') === 0) {
      switch (arg) {
      case '--json':
        opts.dumpJSON = true;
        break;
      case '--gltf':
        opts.dumpGLTF = true;
        break;
      case '--help':
        printHelp();
        break;
      default:
        console.warn(`Unknown option ${arg}`);
      }
    }
  }
  return opts;
}
