/* eslint-disable max-len */
import test from 'tape-catch';
import {fixture, deepCopy} from 'luma.gl/test/setup';

import {GLBParser, GLTFParser, GLTFInstantiator, toArrayBuffer} from 'loaders.gl';

import path from 'path';

const GLTF_JSON = deepCopy(require('../data/gltf-2.0/2CylinderEngine.gltf.json'));

test('GLTFInstantiator#imports', t => {
  t.ok(GLTFParser, 'GLTFParser was imported');
  t.ok(GLTFInstantiator, 'GLTFInstantiator was imported');
  t.end();
});

test('GLTFInstantiator#instantiate JSON', t => {
  const gltf = new GLTFParser(GLTF_JSON).resolve({});
  t.ok(gltf, 'GLTFParser returned parsed data');

  const scenes = new GLTFInstantiator(fixture.gl).instantiate(gltf);
  t.ok(scenes, 'GLTFInstantiator returned scenegraphs');

  t.end();
});

test('GLTFInstantiator#instantiate binary', t => {
  const fs = module.require && module.require('fs');
  if (!fs) {
    t.comment('binary data tests only available under Node.js');
    t.end();
    return;
  }

  const file = fs.readFileSync(path.resolve(__dirname, '../data/gltf-2.0/2CylinderEngine.glb'));
  const glbArrayBuffer = toArrayBuffer(file);

  const json = new GLBParser(glbArrayBuffer).parseWithMetadata({});
  const gltf = new GLTFParser(json).resolve({});
  t.ok(gltf, 'GLTFParser returned parsed data');

  const scenes = new GLTFInstantiator(fixture.gl).instantiate(gltf);
  t.ok(scenes, 'GLTFInstantiator returned scenegraphs');

  t.end();
});

