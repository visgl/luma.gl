// luma.gl, MIT license
import {Buffer, glsl} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Two Cubes';
export const description = 'Shows usage of multiple uniform buffers.';

// type AppUniforms = {
//   modelViewProjectionMatrix: number[];
// };

// const app = {
//   uniformTypes: {'modelViewProjectionMatrix': 'mat4x4<f32>'}
// }

const VS_WGSL = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};
@binding(0) @group(0) var<uniform> app : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
  @location(0) positions : vec4<f32>,
  @location(1) texCoords : vec2<f32>
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = app.modelViewProjectionMatrix * positions;
  output.fragUV = texCoords;
  output.fragPosition = 0.5 * (positions + vec4(1.0, 1.0, 1.0, 1.0));
  return output;
}
`;

const FS_WGSL = /* WGSL */ `
@fragment
fn main(@location(0) fragUV: vec2<f32>,
        @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
  return fragPosition;
}
`;

// GLSL

const VS_GLSL = glsl`\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  fragUV = texCoords;
  fragPosition = vec4(positions, 1.);
}
`;

const FS_GLSL = glsl`\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

in vec2 fragUV;
in vec4 fragPosition;

layout (location=0) out vec4 fragColor;

void main() {
  fragColor = fragPosition;
}
`;

const UNIFORM_BUFFER_SIZE = 4 * 16; // 4x4 matrix

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  cubeModel: Model;
  uniformBuffer1: Buffer;
  uniformBuffer2: Buffer;
  // uniformStore = new UniformStore<{app: AppUniforms}>({app});

  constructor({device}: AnimationProps) {
    super();

    this.uniformBuffer1 = device.createBuffer({
      id: 'uniforms-1',
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength: UNIFORM_BUFFER_SIZE
    });

    this.uniformBuffer2 = device.createBuffer({
      id: 'uniforms-2',
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength: UNIFORM_BUFFER_SIZE
    });

    this.cubeModel = new Model(device, {
      id: 'cube',
      vs: {wgsl: VS_WGSL, glsl: VS_GLSL},
      fs: {wgsl: FS_WGSL, glsl: FS_GLSL},
      geometry: new CubeGeometry({indices: false}),
      parameters: {
        depthWriteEnabled: true, // Fragment closest to the camera is rendered in front.
        depthCompare: 'less', 
        depthFormat: 'depth24plus',        
        cullMode: 'back' // Faces pointing away will be occluded by faces pointing toward the camera.
      },
      // TODO - bindings should not be needed here, as they are set later
      bindings: {
        app: this.uniformBuffer1
      }
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

    viewMatrix
      .identity()
      .translate([-2, 0, -7])
      .rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    this.uniformBuffer1.write(new Float32Array(modelViewProjectionMatrix));

    viewMatrix
      .identity()
      .translate([2, 0, -7])
      .rotateAxis(1, [Math.cos(now), Math.sin(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    this.uniformBuffer2.write(new Float32Array(modelViewProjectionMatrix));

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.cubeModel.setBindings({app: this.uniformBuffer1});
    this.cubeModel.draw(renderPass);
    this.cubeModel.setBindings({app: this.uniformBuffer2});
    this.cubeModel.draw(renderPass);
    renderPass.end();
  }
}
