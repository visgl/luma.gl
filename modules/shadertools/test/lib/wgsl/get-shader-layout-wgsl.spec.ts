import test from 'tape-promise/tape';
import {ShaderLayout} from '@luma.gl/core';
import {getShaderLayoutFromWGSL} from '@luma.gl/shadertools';

const SHADER = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
  @location(0) position : vec4<f32>,
  @location(1) uv : vec2<f32>,
  @location(2) offset: f32,
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragUV = uv;
  output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
  return output;
}

@fragment
fn main(
  @location(0) fragUV: vec2<f32>,
  @location(1) fragPosition: vec4<f32>
) -> @location(0) vec4<f32> {
  return fragPosition;
}
`;

const TEST_CASES: {title?: string; wgsl: string; shaderLayout: ShaderLayout}[] = [
  {
    wgsl: SHADER,
    shaderLayout: {
      attributes: [
        {
          name: 'position',
          location: 0,
          type: 'vec4<f32>'
        },
        {
          name: 'uv',
          location: 1,
          type: 'vec2<f32>'
        },
        {
          name: 'offset',
          location: 2,
          type: 'f32'
        }
      ],
      bindings: [
        {
          type: 'uniform',
          name: 'uniforms',
          location: 0,
          // @ts-expect-error
          group: 0,
          members: [
            {
              name: 'modelViewProjectionMatrix',
              type: 'mat4x4<f32>'
            }
          ]
        }
      ]
    }
  }
];

test('WebGPU#getShaderLayoutFromWGSL', t => {
  for (const tc of TEST_CASES) {
    const shaderLayout = getShaderLayoutFromWGSL(tc.wgsl);
    t.deepEqual(shaderLayout, tc.shaderLayout, `correct ShaderLayout parsed ${tc.title || ''}`);
    // console.error(JSON.stringify(shaderLayout, null, 2));
  }
  t.end();
});
