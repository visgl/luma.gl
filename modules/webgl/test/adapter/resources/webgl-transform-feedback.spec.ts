// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device, getTestDevices} from '@luma.gl/test-utils';

import {glsl, TransformFeedback, Buffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

import {WEBGLTransformFeedback, WebGLBuffer} from '@luma.gl/webgl';
import {GL} from '@luma.gl/constants';

const VS = glsl`\
attribute float inValue;
varying float outValue;
void main()
{
  outValue = 2.0 * inValue;
}
`;

const FS = glsl`\
varying float outValue;
void main()
{
  gl_FragColor.x = outValue;
}
`;

test('WebGL#TransformFeedback isSupported', (t) => {
  t.equal(
    TransformFeedback.isSupported(webgl1Device),
    false,
    'isSupported returns correct result for WebGL1'
  );
  if (webgl2Device) {
    t.equal(
      TransformFeedback.isSupported(webgl2Device),
      true,
      'isSupported returns correct result for WebGL2'
    );
  }
  t.end();
});

test('WebGL#TransformFeedback constructor/delete', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  t.throws(
    () => new TransformFeedback(),
    'TransformFeedback throws on missing gl context'
  );

  const tf = webgl2Device.createTransformFeedback();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback construction successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback delete successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback repeated delete successful');

  t.end();
});

test('WebGL#TransformFeedback bindBuffers', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const tf = webgl2Device.createTransformFeedback();
  const buffer1 = new Buffer(webgl2Device);
  const buffer2 = new Buffer(webgl2Device);

  tf.setBuffers({
    0: buffer1,
    1: buffer2
  });
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback bindBuffers successful');

  tf.setBuffers({
    0: buffer1,
    1: buffer2
  });
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback bindBuffers with clear is successful');

  /* TODO - this has been changed to use ProgramConfiguration
  const varyingMap = {
    varying1: 0,
    varying2: 1
  };
  tf.setBuffers({
    varying2: buffer2,
    varying1: buffer1
  }, {clear: true, varyingMap});

  t.ok(tf instanceof TransformFeedback, 'TransformFeedback bindBuffers with clear is successful');
  */

  t.end();
});

function testDataCapture({t, webgl2Device, byteOffset = 0}) {
  const inData = new Float32Array([10, 20, 31, 0, -57]);
  const vertexCount = inData.length;
  const inBuffer = new Buffer(webgl2Device, {data: inData});
  const outBuffer = new Buffer(webgl2Device, 10 * 4); // allocate memory for 10 floats
  const model = new Model(webgl2Device, {
    vs: VS,
    fs: FS,
    attributes: {inValue: inBuffer},
    varyings: ['outValue'],
    drawMode: GL.POINTS,
    vertexCount: 5
  });
  const offset = byteOffset / 4;
  const tf = new TransformFeedback(webgl2Device, {
    buffers: {outValue: {buffer: outBuffer, byteOffset}},
    configuration: model.program.configuration
  });

  model.draw({
    transformFeedback: tf
  });

  const outData = outBuffer.getData().slice(offset, offset + vertexCount);
  t.deepEqual(
    outData,
    inData.map((x) => x * 2),
    `Data should be captured in buffer when offset is ${offset}`
  );
}
test('WebGL#TransformFeedback capture', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  // no offset
  testDataCapture({t, webgl2Device});

  // with offset
  testDataCapture({t, webgl2Device, byteOffset: 2 * 4});

  t.end();
});
