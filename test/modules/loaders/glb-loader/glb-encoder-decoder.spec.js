/* eslint-disable max-len */
import test from 'tape-catch';

import {_GLBEncoder as GLBEncoder, _GLBBufferPacker as GLBBufferPacker} from 'loaders.gl';

import {_GLBDecoder as GLBDecoder, _unpackGLBBuffers as unpackGLBBuffers} from 'loaders.gl';

import TEST_JSON from './test-data.json';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('GLBLoader#encode-and-decode', t => {
  const bufferPacker = new GLBBufferPacker();
  const {arrayBuffer, jsonDescriptors} = bufferPacker.packBuffers(BUFFERS);
  const json = Object.assign({}, TEST_JSON, jsonDescriptors);

  const glbFileBuffer = GLBEncoder.createGlbBuffer(json, arrayBuffer);

  t.equal(glbFileBuffer.byteLength, 1584, 'should be equal');

  const parsedData = GLBDecoder.parseGlbBuffer(glbFileBuffer);

  t.equal(parsedData.binaryByteOffset, 1556);
  t.deepEqual(parsedData.json, json, 'JSON is equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json);

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2));
  t.deepEqual(buffers2, BUFFERS, 'should be deep equal');
  t.end();
});
