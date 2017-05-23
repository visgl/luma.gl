import test from 'tape-catch';
import {GL, UniformBufferLayout} from 'luma.gl';
import 'luma.gl/headless';

/*
const TEST_CASES = [
  {
    title: '',
    layout: {
      [GL.]
    },
    values: [
      {

      },
    ],
    data: []
  }
];
*/

test('WebGL#UniformLayout', t => {

  const std140 = new UniformBufferLayout({
    uEnabled: GL.BOOL,
    uProjectionMatrix: GL.FLOAT_MAT4
  })
  .setUniforms({
    uEnabled: true,
    uProjectionMatrix: Array(16).fill(0).map((_, i) => i)
  });

  const value = std140.getData();
  t.ok(value, 'Std140Layout correct');

  t.end();
});
