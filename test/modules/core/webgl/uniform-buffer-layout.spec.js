import test from 'tape-catch';
import GL from 'luma.gl/constants';
import {UniformBufferLayout, Buffer, Program, Transform} from 'luma.gl';
import {fixture} from 'luma.gl/test/setup';

const UBO_INDEX = 0;
const FLOAT = 1.0;
const VEC2 = [2.0, 2.0];
const VEC3 = [3.0, 3.0, 3.0];
const VEC4 = [4.0, 4.0, 4.0, 4.0];

const VS = `\
#version 300 es
in float inValue;
layout(std140) uniform;
uniform uboStruct
{
float float_1;
vec2 vec2_1;
vec3 vec3_1;
vec4 vec4_1;
} uboData;
out float outValue;
void main()
{
vec2 vec2_1 = uboData.vec2_1;
vec3 vec3_1 = uboData.vec3_1;
vec4 vec4_1 = uboData.vec4_1;

float m = uboData.float_1;
m = m + vec2_1.x + vec2_1.y;
m = m + vec3_1.x + vec3_1.y + vec3_1.z;
m = m + vec4_1.x + vec4_1.y + vec4_1.z + vec4_1.w;;
outValue = m * inValue;
}
`;

const FS = `\
#version 300 es
precision highp float;
out vec4 oColor;
void main(void) {
  oColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

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

test('WebGL#UniformBufferLayout', t => {

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

test('WebGL#UniformBufferLayout getData', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const program = new Program(gl2, {vs: VS, fs: FS});

  const uniformBlockIndex = program.getUniformBlockIndex('uboStruct');
  program.uniformBlockBinding(uniformBlockIndex, UBO_INDEX);
  const indices = program.getActiveUniformBlockParameter(uniformBlockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES);

  // float offsests
  const offsets = program.getActiveUniforms(indices, GL.UNIFORM_OFFSET).map(x => x / 4);

  /* eslint-disable camelcase */
  const std140 = new UniformBufferLayout({
    float_1: GL.FLOAT,
    vec2_1: GL.FLOAT_VEC2,
    vec3_1: GL.FLOAT_VEC3,
    vec4_1: GL.FLOAT_VEC4
  })
  .setUniforms({
    float_1: 1.0,
    vec2_1: VEC2,
    vec3_1: VEC3,
    vec4_1: VEC4
  });

  const data = std140.getData();

  const float1 = data.slice(offsets[0], offsets[0] + 1);
  const vec2 = data.slice(offsets[1], offsets[1] + 2);
  const vec3 = data.slice(offsets[2], offsets[2] + 3);
  const vec4 = data.slice(offsets[3], offsets[3] + 4);

  t.equal(float1[0], FLOAT, 'float scalar uniform values matched');
  t.deepEqual(vec2, VEC2, 'vec2 uniform values matched');
  t.deepEqual(vec3, VEC3, 'vec3 uniform values matched');
  t.deepEqual(vec4, VEC4, 'vec4 uniform values matched');

  t.end();
});

test('WebGL#UniformBufferLayout setData', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([1, 2, 3, 4, 5]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});
  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    sourceDestinationMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  /* eslint-disable camelcase */
  const std140 = new UniformBufferLayout({
    float_1: GL.FLOAT,
    vec2_1: GL.FLOAT_VEC2,
    vec3_1: GL.FLOAT_VEC3,
    vec4_1: GL.FLOAT_VEC4
  })
  .setUniforms({
    float_1: 1.0,
    vec2_1: VEC2,
    vec3_1: VEC3,
    vec4_1: VEC4
  });

  const data = std140.getData();
  const ubo = new Buffer(gl2, {
    target: GL.UNIFORM_BUFFER,
    data,
    size: 1,
    index: UBO_INDEX
  });

  ubo.bind();
  transform.run();
  ubo.unbind();
  const outData = transform.getBuffer('outValue').getData();
  const expectedData = sourceData.map(value => value * 30.0);
  t.deepEqual(outData, expectedData, 'Should receive expected data');

  t.end();
});
