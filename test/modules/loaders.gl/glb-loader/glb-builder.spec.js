/* eslint-disable max-len */
import test from 'tape-catch';

import {GLBBuilder} from 'loaders.gl';
import {_unpackGLBBuffers as unpackGLBBuffers} from 'loaders.gl/glb-loader';
import {parseDataUriToArrayBuffer} from '../common/loader-utils/load-uri';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('GLBBuilder#pack-and-unpack-binary-buffers', t => {
  const glbBuilder = new GLBBuilder();

  // Add buffers
  for (const buffer of BUFFERS) {
    glbBuilder.addBuffer(buffer, {size: 1});
  }

  const {arrayBuffer, json} = glbBuilder.pack();

  t.equal(json.bufferViews[0].byteOffset, 0, 'should be equal');
  t.equal(json.bufferViews[0].byteLength, 3, 'should be equal');

  t.equal(json.bufferViews[1].byteOffset, 4, 'should be equal');
  t.equal(json.bufferViews[1].byteLength, 8, 'should be equal');

  t.equal(json.bufferViews[2].byteOffset, 12, 'should be equal');
  t.equal(json.bufferViews[2].byteLength, 16, 'should be equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json);

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2));
  t.deepEqual(BUFFERS, buffers2, 'should be deep equal');
  t.end();
});

test('GLBBuilder#pack-and-unpack-images', t => {
  const glbBuilder = new GLBBuilder();

  // Add buffers
  for (const buffer of BUFFERS) {
    glbBuilder.addImage(buffer, parseDataUriToArrayBuffer);
  }

  const {arrayBuffer, json} = glbBuilder.pack();

  t.equal(json.bufferViews[0].byteOffset, 0, 'should be equal');
  t.equal(json.bufferViews[0].byteLength, 3, 'should be equal');

  t.equal(json.bufferViews[1].byteOffset, 4, 'should be equal');
  t.equal(json.bufferViews[1].byteLength, 8, 'should be equal');

  t.equal(json.bufferViews[2].byteOffset, 12, 'should be equal');
  t.equal(json.bufferViews[2].byteLength, 16, 'should be equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json);

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2));
  t.deepEqual(BUFFERS, buffers2, 'should be deep equal');
  t.end();
});
