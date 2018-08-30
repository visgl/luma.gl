/* eslint-disable max-len */
import test from 'tape-catch';

import {GLBBuilder, GLBParser} from 'loaders.gl';
import unpackGLBBuffers from 'loaders.gl/glb-loader/unpack-glb-buffers';

import TEST_JSON from '../data/glb/test-data.json';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('GLB#encode-and-decode', t => {
  const glbBuilder = new GLBBuilder();

  // Add buffers
  for (const buffer of BUFFERS) {
    glbBuilder.addBuffer(buffer, {size: 1});
  }

  const glbFileBuffer = glbBuilder.encode(TEST_JSON);

  t.equal(glbFileBuffer.byteLength, 1604, 'should be equal');

  const {arrayBuffer, json, binaryByteOffset} = new GLBParser(glbFileBuffer)._parseBinary();

  t.equal(binaryByteOffset, 1576);
  t.deepEqual(json.json, TEST_JSON, 'JSON is equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json, binaryByteOffset);

  for (const key in buffers2.accessors) {
    delete buffers2.accessors[key].accessor;
  }

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2.accessors));
  t.deepEqual(buffers2.accessors, BUFFERS, 'buffers should be deep equal');
  t.end();
});
