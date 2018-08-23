/* eslint-disable max-len */
import test from 'tape-catch';

import {GLBBuilder} from 'loaders.gl';
import {_unpackGLBBuffers as unpackGLBBuffers} from 'loaders.gl/glb-loader';
import {parseDataUriToArrayBuffer} from 'loaders.gl/common/loader-utils/load-uri';

import {IMAGE_DATA_URL} from './test-image';
// import {Log} from 'probe.gl';
// const log = new Log();

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
  glbBuilder.addBuffer(BUFFERS[0], {size: 1});
  glbBuilder.addImage(parseDataUriToArrayBuffer(IMAGE_DATA_URL));
  glbBuilder.addBuffer(BUFFERS[1], {size: 1});
  glbBuilder.addBuffer(BUFFERS[2], {size: 1});

  const {arrayBuffer, json} = glbBuilder.pack();

  t.equal(json.bufferViews[0].byteOffset, 0, 'should be equal');
  t.equal(json.bufferViews[0].byteLength, 3, 'should be equal');

  t.equal(json.bufferViews[1].byteOffset, 4, 'should be equal');
  t.equal(json.bufferViews[1].byteLength, 1151, 'should be equal');

  t.equal(json.bufferViews[2].byteOffset, 1156, 'should be equal');
  t.equal(json.bufferViews[2].byteLength, 8, 'should be equal');

  t.equal(json.bufferViews[3].byteOffset, 1164, 'should be equal');
  t.equal(json.bufferViews[3].byteLength, 16, 'should be equal');

  t.equal(json.images[0].bufferView, 1, 'should be 0');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json);

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2));
  t.deepEqual(BUFFERS, buffers2, 'should be deep equal');
  t.end();
});
