import {expect, test} from 'vitest';
import { UniformBufferLayout, UniformStore } from '../../src';
function almostEqual(a: number, b: number, eps = 1e-3): boolean {
  return Math.abs(a - b) <= eps;
}
test('unaligned scalar forces padding before vec4', () => {
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
  expect(view[0], 'scalar').toBe(42);
  expect(view[1], 'padding').toBe(0);
  expect(view[2], 'padding').toBe(0);
  expect(view[3], 'padding').toBe(0);
  expect(view[4], 'vector[0]').toBe(1);
  expect(view[5], 'vector[1]').toBe(2);
  expect(view[6], 'vector[2]').toBe(3);
  expect(view[7], 'vector[3]').toBe(4);
});
test('nested struct layout (struct inside struct)', () => {
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
  expect(view[0], 'transform.position[0]').toBe(1);
  expect(view[1]).toBe(2);
  expect(view[2]).toBe(3);
  expect(view[3], 'vec3 padding').toBe(0);
  expect(view[4], 'transform.range').toBe(10);
  expect(almostEqual(view[8], 0.8), 'light.intensity').toBeTruthy();
});
test('array of primitives uses std140 stride', () => {
  const uniformTypes = {
    thresholds: ['f32', 3]
  } as const;
  const layout = new UniformBufferLayout(uniformTypes);
  const data = layout.getData({
    thresholds: [1, 2, 3]
  });
  const view = new Float32Array(data.buffer);
  expect(view[0], 'thresholds[0]').toBe(1);
  expect(view[4], 'thresholds[1]').toBe(2);
  expect(view[8], 'thresholds[2]').toBe(3);
});
test('array of matrices accepts packed values', () => {
  const layout = new UniformBufferLayout({
    jointMatrix: ['mat4x4<f32>', 2]
  });
  const data = layout.getData({
    jointMatrix: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2])
  });
  const view = new Float32Array(data.buffer);
  expect(view[0], 'jointMatrix[0][0]').toBe(1);
  expect(view[15], 'jointMatrix[0][15]').toBe(1);
  expect(view[16], 'jointMatrix[1][0]').toBe(2);
  expect(view[31], 'jointMatrix[1][15]').toBe(2);
});
test('array of structs layout', () => {
  const uniformTypes = {
    lights: [{
      position: 'vec3<f32>',
      intensity: 'f32'
    }, 2]
  } as const;
  const layout = new UniformBufferLayout(uniformTypes);
  const data = layout.getData({
    lights: [{
      position: [1, 2, 3],
      intensity: 0.5
    }, {
      position: [4, 5, 6],
      intensity: 1.0
    }]
  });
  const view = new Float32Array(data.buffer);

  // First struct
  expect(view[0], 'lights[0].position[0]').toBe(1);
  expect(view[1], 'lights[0].position[1]').toBe(2);
  expect(view[2], 'lights[0].position[2]').toBe(3);
  expect(view[3], 'lights[0] vec3 padding').toBe(0);
  expect(view[4], 'lights[0].intensity').toBe(0.5);

  // Second struct
  expect(view[8], 'lights[1].position[0]').toBe(4);
  expect(view[9], 'lights[1].position[1]').toBe(5);
  expect(view[10], 'lights[1].position[2]').toBe(6);
  expect(view[11], 'lights[1] vec3 padding').toBe(0);
  expect(view[12], 'lights[1].intensity').toBe(1.0);
});
test('partial nested updates preserve unspecified leaves', () => {
  const uniformStore = new UniformStore({
    lighting: {
      uniformTypes: {
        light: {
          transform: {
            position: 'vec3<f32>',
            range: 'f32'
          },
          intensity: 'f32'
        }
      },
      defaultUniforms: {
        light: {
          transform: {
            position: [1, 2, 3],
            range: 10
          },
          intensity: 0.5
        }
      }
    }
  });
  uniformStore.setUniforms({
    lighting: {
      light: {
        intensity: 0.8
      }
    }
  });
  const data = uniformStore.getUniformBufferData('lighting');
  const view = new Float32Array(data.buffer);
  expect(view[0], 'default position[0] preserved').toBe(1);
  expect(view[1], 'default position[1] preserved').toBe(2);
  expect(view[2], 'default position[2] preserved').toBe(3);
  expect(view[4], 'default range preserved').toBe(10);
  expect(almostEqual(view[8], 0.8), 'updated intensity written').toBeTruthy();
});
test('uniform layout accepts WGSL alias types', () => {
  const layout = new UniformBufferLayout({
    camera: 'vec3f',
    modelMatrix: 'mat4x4f'
  } as any);
  const data = layout.getData({
    camera: [1, 2, 3],
    modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  });
  const view = new Float32Array(data.buffer);
  expect(view[0], 'camera[0]').toBe(1);
  expect(view[1], 'camera[1]').toBe(2);
  expect(view[2], 'camera[2]').toBe(3);
  expect(view[4], 'modelMatrix[0]').toBe(1);
  expect(view[9], 'modelMatrix[5]').toBe(1);
  expect(view[14], 'modelMatrix[10]').toBe(1);
  expect(view[19], 'modelMatrix[15]').toBe(1);
});

/*
import test from '@luma.gl/devtools-extensions/tape-test-utils';
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
