/* eslint-disable max-len */
import test from 'tape-catch';

import {GLBBuilder} from 'loaders.gl';

import packBinaryJson from 'loaders.gl/glb-writer/pack-binary-json';

const inputJSONTypedArraysMixed = {
  slices: [
    {
      primitives: new Int8Array([3, 2, 3])
    },
    {
      primitives: new Uint16Array([6, 2, 4, 5])
    },
    {
      primitives: new Float32Array([8, 2, 4, 5])
    }
  ]
};

const inputJSONTypedArrays = {
  slices: [
    {
      primitives: new Float32Array([3, 2, 3])
    },
    {
      primitives: new Float32Array([6, 2, 4, 5])
    },
    {
      primitives: new Float32Array([8, 2, 4, 5])
    }
  ]
};

const inputJSONClassicArrays = {
  slices: [
    {
      primitives: [3, 2, 3]
    },
    {
      primitives: [[6, 2], [4, 5]]
    },
    {
      primitives: [[8, 2], [4, 5]]
    }
  ]
};

const flattenArraysFalse = {
  slices: [
    {
      primitives1: [3, 2, 3],
      primitives2: [[6, 2], [4, 5]],
      primitives3: [[8, 2], [4, 5]]
    }
  ]
};

test('pack-and-unpack-json', t => {
  let glbBuilder;
  let json;

  glbBuilder = new GLBBuilder();
  json = packBinaryJson(inputJSONTypedArraysMixed, glbBuilder, {flattenArrays: true});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 3, 'Right number of buffers extracted');

  glbBuilder = new GLBBuilder();
  json = packBinaryJson(inputJSONTypedArrays, glbBuilder, {flattenArrays: true});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 3, 'Right number of buffers extracted');

  glbBuilder = new GLBBuilder();
  json = packBinaryJson(inputJSONClassicArrays, glbBuilder, {flattenArrays: true});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 3, 'Right number of buffers extracted');

  t.end();
});

test('pack-and-unpack-json#flattenArrays:false', t => {
  const glbBuilder = new GLBBuilder();
  const json = packBinaryJson(flattenArraysFalse, glbBuilder, {flattenArrays: false});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 0, 'Right number of buffers extracted');
  t.equals(
    JSON.stringify(flattenArraysFalse),
    JSON.stringify(json),
    'Returned JSON structurally equivalent'
  );

  t.end();
});
