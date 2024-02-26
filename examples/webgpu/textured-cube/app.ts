import {Buffer, loadImageBitmap, glsl} from '@luma.gl/core';
import {Model, CubeGeometry, AnimationLoopTemplate, AnimationProps} from '@luma.gl/engine';
// import {luma, Device, Buffer, Texture, loadImageBitmap, ShaderLayout} from '@luma.gl/core';
// import {Model, CubeGeometry, AnimationLoopTemplate, AnimationProps} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Rotating Cube';
export const description = 'Shows rendering a basic triangle.';

const TEXTURE_URL =
  'https://raw.githubusercontent.com/uber/luma.gl/8.5-release/examples/getting-started/hello-cube/vis-logo.png';

// GLSL

const VS_WGSL = /* WGSL */ `
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};
@binding(0) @ group(0) var<uniform> app : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
};

@vertex
fn main(
  @location(0) positions : vec4<f32>,
  @location(1) texCoords : vec2<f32>) -> VertexOutput 
{
  var output : VertexOutput;
  output.Position = app.modelViewProjectionMatrix * positions;
  output.fragUV = texCoords;
  output.fragPosition = 0.5 * (positions + vec4<f32>(1.0, 1.0, 1.0, 1.0));
  return output;
}
`;

const FS_WGSL = /* WGSL */ `
@group(0) @binding(1) var uSampler: sampler;
@group(0) @binding(2) var uTexture: texture_2d<f32>;

@fragment
fn main(@location(0) fragUV: vec2<f32>,
        @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
  let flippedUV = vec2<f32>(1.0 - fragUV.x, fragUV.y);
  return textureSample(uTexture, uSampler, flippedUV) * fragPosition;
}
`;

// GLSL

const VS_GLSL = glsl`\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

// CUBE GEOMETRY 
layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  fragUV = texCoords;
  fragPosition = vec4(positions, 1.);
  // fragPosition = 0.5 * (vec4(position, 1.) + vec4(1., 1., 1., 1.));
}
`;

const FS_GLSL = glsl`\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform sampler2D uTexture;

in vec2 fragUV;
in vec4 fragPosition;

layout (location=0) out vec4 fragColor;

void main() {
  fragColor = texture(uTexture, vec2(fragUV.x, 1.0 - fragUV.y));;
}
`;

const UNIFORM_BUFFER_SIZE = 4 * 16; // 4x4 matrix

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  model: Model;
  uniformBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();
    // Fetch the image and upload it into a GPUTexture.
    const texture = device.createTexture({
      data: loadImageBitmap(TEXTURE_URL),
      // usage: Texture.TEXTURE_BINDING | Texture.COPY_DST | Texture.RENDER_ATTACHMENT,
      mipmaps: true, // Create mipmaps
      sampler: {
        // linear filtering for smooth interpolation.
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      }
    });

    this.uniformBuffer = device.createBuffer({
      id: 'uniforms',
      byteLength: UNIFORM_BUFFER_SIZE,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });

    this.model = new Model(device, {
      id: 'cube',
      vs: {wgsl: VS_WGSL, glsl: VS_GLSL},
      fs: {wgsl: FS_WGSL, glsl: FS_GLSL},
      geometry: new CubeGeometry({indices: false}),
      bindings: {
        app: this.uniformBuffer,
        uSampler: texture.sampler,
        uTexture: texture
      },
      parameters: {
        depthWriteEnabled: true, // Fragment closest to the camera is rendered in front.
        depthCompare: 'less'
        // depthFormat: 'depth24plus',
        // cullMode: 'back' // Faces pointing away will be occluded by faces pointing toward the camera.
      }
    });
  }

  onFinalize() {
    this.model.destroy();
    this.uniformBuffer.destroy();
  }

  onRender({device}: AnimationProps) {
    const projectionMatrix = new Matrix4();
    const viewMatrix = new Matrix4();
    const modelViewProjectionMatrix = new Matrix4();

    const aspect = device.canvasContext?.getAspect();
    const now = Date.now() / 1000;

    viewMatrix
      .identity()
      .translate([0, 0, -4])
      .rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    projectionMatrix.perspective({fovy: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    this.uniformBuffer.write(new Float32Array(modelViewProjectionMatrix));

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
