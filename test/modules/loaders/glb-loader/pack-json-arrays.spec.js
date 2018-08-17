/* eslint-disable max-len */
import test from 'tape-catch';

import {
  _packJsonArrays as packJsonArrays,
  _GLBBufferPacker as GLBBufferPacker
} from 'loaders.gl';

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
  let bufferPacker;
  let json;

  bufferPacker = new GLBBufferPacker();
  json = packJsonArrays(inputJSONTypedArraysMixed, bufferPacker);
  t.comment(JSON.stringify(json));
  t.equals(bufferPacker.sourceBuffers.length, 3, 'Right number of buffers extracted');

  bufferPacker = new GLBBufferPacker();
  json = packJsonArrays(inputJSONTypedArrays, bufferPacker);
  t.comment(JSON.stringify(json));
  t.equals(bufferPacker.sourceBuffers.length, 3, 'Right number of buffers extracted');

  bufferPacker = new GLBBufferPacker();
  json = packJsonArrays(inputJSONClassicArrays, bufferPacker);
  t.comment(JSON.stringify(json));
  t.equals(bufferPacker.sourceBuffers.length, 3, 'Right number of buffers extracted');

  t.end();
});

test('pack-and-unpack-json#flattenArrays:false', t => {
  const bufferPacker = new GLBBufferPacker();
  const json = packJsonArrays(flattenArraysFalse, bufferPacker, {flattenArrays: false});
  t.comment(JSON.stringify(json));
  t.equals(bufferPacker.sourceBuffers.length, 0, 'Right number of buffers extracted');
  t.equals(
    JSON.stringify(flattenArraysFalse),
    JSON.stringify(json),
    'Returned JSON structurally equivalent'
  );

  t.end();
});
