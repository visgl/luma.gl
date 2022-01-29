import {glsl} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {TransformFeedback, Buffer} from '@luma.gl/webgl-legacy';
import {WEBGLTransformFeedback, Buffer} from '@luma.gl/webgl';
// TODO - tests shouldn't depend on higher level module?
import {Model} from '@luma.gl/webgl-legacy';
import test from 'tape-promise/tape';

import {fixture} from 'test/setup';

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
  const {gl, gl2} = fixture;
  t.equal(
    TransformFeedback.isSupported(gl),
    false,
    'isSupported returns correct result for WebGL1'
  );
  if (gl2) {
    t.equal(
      TransformFeedback.isSupported(gl2),
      true,
      'isSupported returns correct result for WebGL2'
    );
  }
  t.end();
});

test('WebGL#TransformFeedback constructor/delete', (t) => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  t.throws(
    // @ts-expect-error
    () => new TransformFeedback(),
    'TransformFeedback throws on missing gl context'
  );

  const tf = new TransformFeedback(gl2);
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback construction successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback delete successful');

  tf.delete();
  t.ok(tf instanceof TransformFeedback, 'TransformFeedback repeated delete successful');

  t.end();
});

test('WebGL#TransformFeedback bindBuffers', (t) => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const tf = new TransformFeedback(gl2);
  const buffer1 = new Buffer(gl2);
  const buffer2 = new Buffer(gl2);

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

function testDataCapture({t, gl2, byteOffset = 0}) {
  const inData = new Float32Array([10, 20, 31, 0, -57]);
  const vertexCount = inData.length;
  const inBuffer = new Buffer(gl2, {data: inData});
  const outBuffer = new Buffer(gl2, 10 * 4); // allocate memory for 10 floats
  const model = new Model(gl2, {
    vs: VS,
    fs: FS,
    attributes: {inValue: inBuffer},
    varyings: ['outValue'],
    drawMode: GL.POINTS,
    vertexCount: 5
  });
  const offset = byteOffset / 4;
  const tf = new TransformFeedback(gl2, {
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
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  // no offset
  testDataCapture({t, gl2});

  // with offset
  testDataCapture({t, gl2, byteOffset: 2 * 4});

  t.end();
});
