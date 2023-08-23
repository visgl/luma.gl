// luma.gl, MIT license
import {ShaderLayout, RenderPipelineParameters, Buffer, glsl} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Two Cubes';
export const description = 'Shows usage of multiple uniform buffers.';

/** Provide both GLSL and WGSL shaders */
const SHADERS = {
  vs: {
    glsl: glsl`\
#version 300 es
#define SHADER_NAME cube-vs

uniform uniforms {
  mat4 modelViewProjectionMatrix;
};

layout(location=0) in vec3 position;
layout(location=1) in vec2 uv;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
  fragUV = uv;
  fragPosition = vec4(position, 1.);
}
    `,
    wgsl: /* WGSL */`
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>;
};
[[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragUV : vec2<f32>;
  [[location(1)]] fragPosition: vec4<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] position : vec4<f32>,
        [[location(1)]] uv : vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragUV = uv;
  output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
  return output;
}
        `
  },
  fs: {
    glsl: glsl`\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;
in vec2 fragUV;
in vec4 fragPosition;

layout (location=0) out vec4 fragColor;

void main() {
  fragColor = fragPosition;
}
    `,
    wgsl: /* WGSL */`
[[stage(fragment)]]
fn main([[location(0)]] fragUV: vec2<f32>,
        [[location(1)]] fragPosition: vec4<f32>) -> [[location(0)]] vec4<f32> {
  return fragPosition;
}
        `
  }
};

const UNIFORM_BUFFER_SIZE = 4 * 16; // 4x4 matrix

const CUBE_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'position', location: 0, type: 'vec4<f32>'},
    {name: 'uv', location: 1, type: 'vec2<f32>'}
  ],
  bindings: [
    {name: 'uniforms', location: 0, type: 'uniform'}
  ]
};

const CUBE_RENDER_PARAMETERS: RenderPipelineParameters = {
  // Enable depth testing so that the fragment closest to the camera
  // is rendered in front.
  depthWriteEnabled: true,
  depthCompare: 'less',
  depthFormat: 'depth24plus',

  // Backface culling since the cube is solid piece of geometry.
  // Faces pointing away from the camera will be occluded by faces
  // pointing toward the camera.
  cullMode: 'back',
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {

  cubeModel: Model;
  uniformBuffer1: Buffer;
  uniformBuffer2: Buffer;

  constructor({device}: AnimationProps) {
    super();
    // Create a vertex buffer from the cube data.
    // Create vertex buffers for the cube data.
    const cube = new CubeGeometry({indices: false});
    const positionBuffer = device.createBuffer({id: 'cube-positions', data: cube.attributes.POSITION.value});
    const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cube.attributes.TEXCOORD_0.value});

    this.cubeModel = new Model(device, {
      id: 'cube',
      vs: SHADERS.vs,
      fs: SHADERS.fs,
      topology: 'triangle-list',
      shaderLayout: CUBE_SHADER_LAYOUT,
      attributes: {
        position: positionBuffer,
        uv: uvBuffer
      },
      vertexCount: cube.vertexCount,
      parameters: CUBE_RENDER_PARAMETERS
    });

    this.uniformBuffer1 = device.createBuffer({
      id: 'uniforms-1',
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength: UNIFORM_BUFFER_SIZE,
    });

    this.uniformBuffer2 = device.createBuffer({
      id: 'uniforms-2',
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength: UNIFORM_BUFFER_SIZE,
    });
  }

  override onFinalize() {
    this.cubeModel.destroy();
    this.uniformBuffer1.destroy();
    this.uniformBuffer2.destroy();
  }

  override onRender({device}: AnimationProps): void {
    const projectionMatrix = new Matrix4();
    const viewMatrix = new Matrix4();
    const modelViewProjectionMatrix = new Matrix4();

    const aspect = device.canvasContext?.getAspect();
    const now = Date.now() / 1000;

    projectionMatrix.perspective({fovy: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});

    viewMatrix.identity().translate([-2, 0, -7]).rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    this.uniformBuffer1.write(new Float32Array(modelViewProjectionMatrix));

    viewMatrix.identity().translate([2, 0, -7]).rotateAxis(1, [Math.cos(now), Math.sin(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    this.uniformBuffer2.write(new Float32Array(modelViewProjectionMatrix));

    const renderPass = device.beginRenderPass({});
    this.cubeModel.setBindings({uniforms: this.uniformBuffer1});
    this.cubeModel.draw(renderPass);
    this.cubeModel.setBindings({uniforms: this.uniformBuffer2});
    this.cubeModel.draw(renderPass);
    renderPass.end();
  }
}
