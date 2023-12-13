// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

import {glsl, Buffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

import {WEBGLTransformFeedback} from '@luma.gl/webgl';

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

test('WebGL#TransformFeedback feature flag', t => {
  t.false(webgl1Device.features.has('transform-feedback-webgl2'), 'webgl1');
  if (webgl2Device) {
    t.true(webgl2Device.features.has('transform-feedback-webgl2'), 'webgl2');
  }
  t.end();
});

test('WebGL#TransformFeedback constructor/destroy', t => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  t.throws(
    () => new (WEBGLTransformFeedback as any)(),
    'TransformFeedback throws on missing gl context'
  );

  const buffer1 = webgl2Device.createBuffer({byteLength: 16});
  const buffer2 = webgl2Device.createBuffer({byteLength: 16});
  const model = createModel(buffer1, 4);

  const tf = webgl2Device.createTransformFeedback({
    layout: model.pipeline.shaderLayout,
    buffers: {outValue: buffer2}
  });

  t.pass('TransformFeedback construction successful');

  tf.destroy();
  t.pass('TransformFeedback destroy successful');

  tf.destroy();
  t.pass('TransformFeedback repeated destroy successful');

  t.end();
});

test('WebGL#TransformFeedback setBuffers', t => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const buffer1 = webgl2Device.createBuffer({byteLength: 100});
  const buffer2 = webgl2Device.createBuffer({byteLength: 200});
  const buffer3 = webgl2Device.createBuffer({byteLength: 300});
  const model = createModel(buffer1, 4);

  const transformFeedback = webgl2Device.createTransformFeedback({
    layout: model.pipeline.shaderLayout,
    buffers: {outValue: buffer2}
  });

  transformFeedback.setBuffers({0: buffer1, 1: buffer2});
  t.deepEqual(
    transformFeedback.buffers,
    {
      0: {buffer: buffer1, byteOffset: 0, byteLength: 100},
      1: {buffer: buffer2, byteOffset: 0, byteLength: 200}
    },
    'set by index, 2 buffers'
  );

  transformFeedback.setBuffers({0: buffer3, 1: buffer2, 2: buffer1});
  t.deepEqual(
    transformFeedback.buffers,
    {
      0: {buffer: buffer3, byteOffset: 0, byteLength: 300},
      1: {buffer: buffer2, byteOffset: 0, byteLength: 200},
      2: {buffer: buffer1, byteOffset: 0, byteLength: 100}
    },
    'set by index, 3 buffers'
  );

  transformFeedback.setBuffers({inValue: buffer1, outValue: buffer2, otherValue: buffer3});
  t.deepEqual(
    transformFeedback.buffers,
    {0: {buffer: buffer2, byteOffset: 0, byteLength: 200}},
    'set by name, 1 buffer'
  );
  t.deepEqual(
    transformFeedback.unusedBuffers,
    {
      inValue: buffer1,
      otherValue: buffer3
    },
    'set by name, 2 buffers unused'
  );

  t.end();
});

test('WebGL#TransformFeedback capture', async t => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  // TODO(v9) Test writing with offset into output buffer.

  const inArray = new Float32Array([10, 20, 31, 0, -57]);
  const vertexCount = inArray.length;

  const byteOffset = 0;
  const byteLength = vertexCount * Float32Array.BYTES_PER_ELEMENT;

  const inBuffer = webgl2Device.createBuffer({data: inArray});
  const outBuffer = webgl2Device.createBuffer({byteLength: byteLength * 2}); // pad output for write with offset
  const model = createModel(inBuffer, vertexCount);

  const transformFeedback = webgl2Device.createTransformFeedback({
    layout: model.pipeline.shaderLayout,
    buffers: {outValue: outBuffer}
  });
  model.setTransformFeedback(transformFeedback);

  const renderPass = webgl2Device.beginRenderPass({discard: true});
  model.draw(renderPass);
  renderPass.end();

  const outBytes = await outBuffer.readAsync(byteOffset, byteLength);
  const outArray = new Float32Array(outBytes.buffer, outBytes.byteOffset, vertexCount);

  t.deepEqual(
    Array.from(outArray),
    Array.from(inArray).map(x => x * 2),
    'transform feedback output'
  );

  t.end();
});

/**
 * Creates a model for TransformFeedback testing with input attribute 'inValue'
 * and output varying 'outValue', both of type float32.
 */
function createModel(buffer: Buffer, vertexCount: number): Model {
  return new Model(webgl2Device, {
    vs: VS,
    fs: FS,
    attributes: {inValue: buffer},
    bufferLayout: [{name: 'inValue', format: 'float32'}],
    varyings: ['outValue'],
    topology: 'point-list',
    vertexCount
  });
}
