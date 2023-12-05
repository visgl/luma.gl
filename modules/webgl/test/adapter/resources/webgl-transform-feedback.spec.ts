// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

import {glsl, Buffer, TransformFeedback} from '@luma.gl/core';
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

test('WebGL#TransformFeedback isSupported', t => {
  // WebGL 1.0
  t.throws(
    () => TransformFeedback.isSupported(webgl1Device),
    'TransformFeedback#isSupported (WebGL1)'
  );
  t.false(
    WEBGLTransformFeedback.isSupported(webgl1Device),
    'WEBGLTransformFeedback#isSupported (WebGL1)'
  );

  // WebGL 2.0
  if (webgl2Device) {
    t.throws(
      () => TransformFeedback.isSupported(webgl2Device),
      'TransformFeedback#isSupported (WebGL2)'
    );
    t.true(
      WEBGLTransformFeedback.isSupported(webgl2Device),
      'WEBGLTransformFeedback#isSupported (WebGL2)'
    );
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

  const buffer1 = webgl2Device.createBuffer({byteLength: 16})
  const buffer2 = webgl2Device.createBuffer({byteLength: 16})
  const model = createModel(buffer1, 4);

  const tf = webgl2Device.createTransformFeedback({
    layout: model.pipeline.shaderLayout,
    buffers: {outValue: buffer2},
  });

  t.ok(tf instanceof TransformFeedback, 'TransformFeedback construction successful');

  tf.destroy();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback destroy successful');

  tf.destroy();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback repeated destroy successful');

  t.end();
});

test('WebGL#TransformFeedback setBuffers', t => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const buffer1 = webgl2Device.createBuffer({byteLength: 16})
  const buffer2 = webgl2Device.createBuffer({byteLength: 16})
  const model = createModel(buffer1, 4);

  const tf = webgl2Device.createTransformFeedback({
    layout: model.pipeline.shaderLayout,
    buffers: {outValue: buffer2},
  });
  

  tf.setBuffers({ 0: buffer1, 1: buffer2 });
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback bindBuffers successful');

  // TODO(v9): Use ProgramConfiguration or model.pipeline.shaderLayout?

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
    buffers: {outValue: outBuffer},
  });

  const renderPass = webgl2Device.beginRenderPass({discard: true});
  model.draw(renderPass, {transformFeedback});
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
    bufferLayout: [{
      name: 'inValue',
      attributes: [
        {attribute: 'inValue', byteOffset: 0, format: 'float32'}
      ]
    }],
    // @ts-ignore
    varyings: ['outValue'],
    topology: 'point-list',
    vertexCount,
  });
}
