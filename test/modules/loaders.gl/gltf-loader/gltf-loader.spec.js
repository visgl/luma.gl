/* eslint-disable max-len */
import test from 'tape-catch';

import {GLBParser, GLTFLoader, GLTFParser, toArrayBuffer} from 'loaders.gl';

import path from 'path';

const GLTF_JSON = require('../data/gltf-2.0/2CylinderEngine-Draco.gltf.json');

test('GLTFLoader#imports', t => {
  t.ok(GLTFLoader, 'GLTFLoader was imported');
  t.ok(GLTFParser, 'GLTFParser was imported');

  const gltfParser = new GLTFParser({});
  t.ok(gltfParser, 'GLTFParser was instantiated');

  t.end();
});

test('GLTFParse#parse JSON', t => {
  const fs = module.require && module.require('fs');
  if (!fs) {
    t.comment('binary data tests only available under Node.js');
    t.end();
  }

  const gltf = new GLTFParser(GLTF_JSON).resolve({});
  t.ok(gltf, 'GLTFParser returned parsed data');

  t.end();
});

test('GLTFParse#parse binary', t => {
  const fs = module.require && module.require('fs');
  if (!fs) {
    t.comment('binary data tests only available under Node.js');
    t.end();
  }

  const file = fs.readFileSync(path.resolve(__dirname, '../data/gltf-2.0/2CylinderEngine.glb'));
  const glbArrayBuffer = toArrayBuffer(file);

  const json = new GLBParser(glbArrayBuffer).parseWithMetadata({});
  const gltf = new GLTFParser(json).resolve({});
  t.ok(gltf, 'GLTFParser returned parsed data');

  t.end();
});
