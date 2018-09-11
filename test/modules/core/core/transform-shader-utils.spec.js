import {getPassthroughFS} from '../../../../modules/core/src/core/transform-shader-utils';
import test from 'tape-catch';

const PASSTHROUGH_TEST_CASES = [
  {
    version: 100,
    varying: 'output',
    size: 'vec2',
    expected: `\
varying vec2 output;
void main() {
  gl_FragColor = vec4(output, 0.0, 1.0);
}`
  },
  {
    version: 300,
    varying: 'output',
    size: 'float',
    expected: `\
#version 300 es
in float output;
out vec4 transform_output;
void main() {
  transform_output = vec4(output, 0.0, 0.0, 1.0);
}`
  }
];

test('WebGL#Transform Shader Utils getPassthroughFS', t => {
  PASSTHROUGH_TEST_CASES.forEach(testCase => {
    const {version, varying, size, expected} = testCase;
    const result = getPassthroughFS({version, varying, size});
    t.equal(result, expected, `Passthrough shader should match when version=${version} size=${size}`);
  });
  t.end();
});
