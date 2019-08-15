import test from 'tape-catch';
import BinBufferTransformBinding from '@luma.gl/core/lib/transform-new/buffer-transform-binding';
import {Buffer, Model, TransformFeedback} from '@luma.gl/core';
import {fixture} from 'test/setup';

const VS = `\
attribute float source;
varying float feedback;

void main()
{
  feedback = 2.0 * source;
}
`;

const FS = `\
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('WebGL#BufferTransformBinding construct', t => {
  const {gl} = fixture;
  const source = new Buffer(gl, {id: 'source', data: new Float32Array([0, 2.7, -45])});
  const feedback = new Buffer(gl, {id: 'feedback', data: new Float32Array([0, 2.7, -45])});

  const btb = new BinBufferTransformBinding(gl, {
    sourceBuffers: {source},
    feedbackBuffers: {feedback}
  });

  t.ok(btb instanceof BinBufferTransformBinding, 'should create a BinBufferTransformBinding instance');
  t.equal(btb.sourceBuffers.source.id, 'source', 'should set sourceBuffers');
  t.equal(btb.feedbackBuffers.feedback.id, 'feedback', 'should set feedbackBuffers');

  t.end();
});

test('WebGL#BufferTransformBinding setupTransformFeedback', t => {

  const gl = fixture.gl2;
  if (!gl) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const source = new Buffer(gl, {id: 'source', data: new Float32Array([0, 2.7, -45])});
  const feedback = new Buffer(gl, {id: 'feedback', data: new Float32Array([0, 2.7, -45])});
  const model = new Model(gl, {vs: VS, fs: FS, vertexCount: 1, varyings: ['feedback']});

  const btb = new BinBufferTransformBinding(gl, {
    sourceBuffers: {source},
    feedbackBuffers: {feedback}
  });
  btb.setupTransformFeedback({model});

  t.ok(btb.transformFeedback instanceof TransformFeedback, 'should setup TransformFeedback object')
  t.end();
});
