/* eslint-disable max-len */
import test from 'tape-catch';

import {_GLBBufferPacker as GLBBufferPacker} from 'loaders.gl';
import {_unpackGLBBuffers as unpackGLBBuffers} from 'loaders.gl';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('pack-and-unpack-buffers', t => {
  const bufferPacker = new GLBBufferPacker();
  const {arrayBuffer, jsonDescriptors} = bufferPacker.packBuffers(BUFFERS);

  t.equal(jsonDescriptors.bufferViews[0].byteOffset, 0, 'should be equal');
  t.equal(jsonDescriptors.bufferViews[0].byteLength, 3, 'should be equal');

  t.equal(jsonDescriptors.bufferViews[1].byteOffset, 4, 'should be equal');
  t.equal(jsonDescriptors.bufferViews[1].byteLength, 8, 'should be equal');

  t.equal(jsonDescriptors.bufferViews[2].byteOffset, 12, 'should be equal');
  t.equal(jsonDescriptors.bufferViews[2].byteLength, 16, 'should be equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, jsonDescriptors);

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2));
  t.deepEqual(BUFFERS, buffers2, 'should be deep equal');
  t.end();
});
