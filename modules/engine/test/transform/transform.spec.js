import test from 'tape-catch';
import {Buffer} from '@luma.gl/core';
import {Transform} from '@luma.gl/engine';
import {fixture} from 'test/setup';

const VS = `\
attribute float source;
varying float feedback;

void main()
{
  feedback = 2.0 * source;
}
`;

// const FS = `\
// void main(void) {
//   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
// }
// `;

test('WebGL#Transform construction', t => {
  const gl = fixture.gl2;
  if (!gl) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const transform = new Transform(gl, {
    vs: VS,
    sourceBuffers: {
      source: new Buffer(gl, {id: 'source', data: new Float32Array([0, 2.7, -45])})
    },
    feedbackBuffers: {
      feedback: 'source'
    },
    elementCount: 3
  });

  t.ok(transform instanceof Transform, 'should construct Transform object');

  t.end();
});
