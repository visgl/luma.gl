import test from 'tape-promise/tape';
import {compileShaderModule, compileVertexShader, compileFragmentShader} from '@luma.gl/debug';

test('compileVertexShader', (t) => {
  const vs = `
uniform mat4 viewMatrix;
uniform vec2 color64[3];
attribute vec4 positions;
varying vec4 vColor;

vec3 fp64_to_fp32(vec2 value[3]) {
  return vec3(value[0].x, value[1].x, value[2].x);
}

void main() {
  gl_Position = viewMatrix * positions;
  vColor = vec4(fp64_to_fp32(color64), 1.0);
}
`;

  const vsFunc = compileVertexShader('test-vertex-shader', vs);
  const result = vsFunc(
    {
      color64: [
        [1.0, 0.0],
        [0.5, 0.0],
        [0.0, 0.0]
      ],
      viewMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    },
    {positions: [1, 0, 0, 1]}
  );

  t.deepEqual(result.gl_Position, [1, 0, 0, 1], 'gl_Position calculated');
  t.deepEqual(result.varyings.vColor, [1, 0.5, 0, 1], 'vColor calculated');

  t.end();
});

test('compileFragmentShader', (t) => {
  const fs = `
uniform float opacity;
varying vec4 vColor;

void main() {
  if (vColor.a == 0.0) {
    discard;
  }
  gl_FragColor = vec4(vColor.rgb, vColor.a * opacity);
}
`;

  const fsFunc = compileFragmentShader('test-fragment-shader', fs);
  let result = fsFunc({opacity: 0.5}, {vColor: [1, 0.5, 0, 1]});
  t.notOk(result.isDiscarded, 'fragment not discarded');
  t.deepEqual(result.gl_FragColor, [1, 0.5, 0, 0.5], 'gl_FragColor calculated');

  result = fsFunc({opacity: 0.5}, {vColor: [1, 1, 0, 0]});
  t.ok(result.isDiscarded, 'fragment discarded');

  t.end();
});

test('compileShaderModule', (t) => {
  const vs = `
uniform float intensity;

vec4 filterLightColor(vec4 objectColor, vec4 lightColor) {
  return objectColor + lightColor * intensity;
}
`;

  const module = compileShaderModule('test-shader-module', vs);
  const {filterLightColor} = module({intensity: 0.5});

  t.deepEqual(
    filterLightColor([1, 0.5, 0, 1], [1, 1, 1, 1]),
    [1.5, 1, 0.5, 1.5],
    'returns correct result'
  );

  t.end();
});
