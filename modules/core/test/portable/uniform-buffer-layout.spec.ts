import test from 'tape-promise/tape';
import {UniformBufferLayout} from '../../src';

function almostEqual(a: number, b: number, eps = 1e-3): boolean {
  return Math.abs(a - b) <= eps;
}

test('unaligned scalar forces padding before vec4', t => {
  const uniformTypes = {
    scalar: 'f32',
    vector: 'vec4<f32>'
  } as const;

  const layout = new UniformBufferLayout(uniformTypes);

  const data = layout.getData({
    scalar: 42,
    vector: [1, 2, 3, 4]
  });

  const view = new Float32Array(data.buffer);
  t.equal(view[0], 42, 'scalar');
  t.equal(view[1], 0, 'padding');
  t.equal(view[2], 0, 'padding');
  t.equal(view[3], 0, 'padding');
  t.equal(view[4], 1, 'vector[0]');
  t.equal(view[5], 2, 'vector[1]');
  t.equal(view[6], 3, 'vector[2]');
  t.equal(view[7], 4, 'vector[3]');
  t.end();
});

test('nested struct layout (struct inside struct)', t => {
  const uniformTypes = {
    light: {
      transform: {
        position: 'vec3<f32>',
        range: 'f32'
      },
      intensity: 'f32'
    }
  } as const;

  const layout = new UniformBufferLayout(uniformTypes);

  const data = layout.getData({
    light: {
      transform: {
        position: [1, 2, 3],
        range: 10
      },
      intensity: 0.8
    }
  });

  const view = new Float32Array(data.buffer);

  t.equal(view[0], 1, 'transform.position[0]');
  t.equal(view[1], 2);
  t.equal(view[2], 3);
  t.equal(view[3], 10, 'transform.range');
  t.ok(almostEqual(view[4], 0.8), 'light.intensity');
  t.end();
});

test.only('array of structs layout', t => {
  const uniformTypes = {
    lights: [
      {
        position: 'vec3<f32>',
        intensity: 'f32'
      }
    ]
  } as const;

  const layout = new UniformBufferLayout(uniformTypes);

  const data = layout.getData({
    lights: [
      {position: [1, 2, 3], intensity: 0.5},
      {position: [4, 5, 6], intensity: 1.0}
    ]
  });

  const view = new Float32Array(data.buffer);

  // First struct
  t.equal(view[0], 1, 'lights[0].position[0]');
  t.equal(view[1], 2, 'lights[0].position[1]');
  t.equal(view[2], 3, 'lights[0].position[2]');
  t.equal(view[3], 0.5, 'lights[0].intensity');

  // Second struct
  // TODO - the length of the array is not included in the layout
  // t.equal(view[4], 4, 'lights[1].position[0]');
  // t.equal(view[5], 5, 'lights[1].position[1]');
  // t.equal(view[6], 6, 'lights[1].position[2]');
  // t.equal(view[7], 1.0, 'lights[1].intensity');

  t.end();
});

/*
import test from 'tape-promise/tape';
import {UniformBufferLayout, UniformBlock} from '@luma.gl/core';
import {fixture} from 'test/setup';

const UBO_INDEX = 0;
const FLOAT = 1.0;
const VEC2 = [2.0, 2.0];
const VEC3 = [3.0, 3.0, 3.0];
const VEC4 = [4.0, 4.0, 4.0, 4.0];

const VS = /* glsl *`\
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

const FS = /* glsl *`\
#version 300 es
precision highp float;
out vec4 oColor;
void main(void) {
  oColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('shadertypes#UniformBufferLayout', (t) => {
  const std140 = new UniformBufferLayout({
    uEnabled: 'u32',
    uProjectionMatrix: 'mat4x4<f32>'
  })
  
  const uniformBlock = new UniformBlock(std140);
  uniformBlock.setUniforms({
    uEnabled: true,
    uProjectionMatrix: Array(16)
      .fill(0)
      .map((_, i) => i)
  });

  const value = uniformBlock.getData();
  t.ok(value, 'Std140Layout correct');

  t.end();
});

test.skip('shadertypes#UniformBufferLayout getData', (t) => {
  const program = new Program(gl2, {vs: VS, fs: FS});

  const uniformBlockIndex = program.getUniformBlockIndex('uboStruct');
  program.uniformBlockBinding(uniformBlockIndex, UBO_INDEX);
  const indices = program.getActiveUniformBlockParameter(
    uniformBlockIndex,
    GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES
  );

  // float offsets
  const offsets = program.getActiveUniforms(indices, GL.UNIFORM_OFFSET).map((x) => x / 4);

  const std140 = new UniformBufferLayout({
    float_1: 'f32',
    vec2_1: 'vec2<f32>',
    vec3_1: 'vec3<f32>',
    vec4_1: 'vec4<f32>'
  }).setUniforms({
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

test.skip('shadertypes#UniformBufferLayout setData', (t) => {
  const {gl2} = fixture;

  const sourceData = new Float32Array([1, 2, 3, 4, 5]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});
  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  const std140 = new UniformBufferLayout({
    float_1: 'f32',
    vec2_1: 'vec2<f32>',
    vec3_1: 'vec3<f32>',
    vec4_1: 'vec4<f32>'
  }).setUniforms({
    float_1: 1.0,
    vec2_1: VEC2,
    vec3_1: VEC3,
    vec4_1: VEC4
  });

  const data = std140.getData();
  const ubo = new Buffer(gl2, {
    target: GL.UNIFORM_BUFFER,
    data,
    accessor: {
      size: 1,
      index: UBO_INDEX
    }
  });

  ubo.bind();
  transform.run();
  ubo.unbind();
  const outData = transform.getBuffer('outValue').getData();
  const expectedData = sourceData.map((value) => value * 30.0);
  t.deepEqual(outData, expectedData, 'Should receive expected data');

  t.end();
});
*/
