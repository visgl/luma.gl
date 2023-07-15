import {Buffer, glsl} from '@luma.gl/api';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Rotating Cube';
export const description = 'Shows rendering a basic triangle.';

/** @todo - Provide both GLSL and WGSL shaders */
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
  // fragPosition = 0.5 * (vec4(position, 1.) + vec4(1., 1., 1., 1.));
}
    `,
    wgsl: /* WGSL */`\
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
    wgsl: /* WGSL */`\
[[stage(fragment)]]
fn main([[location(0)]] fragUV: vec2<f32>,
        [[location(1)]] fragPosition: vec4<f32>) -> [[location(0)]] vec4<f32> {
  return fragPosition;
}
`
  }
};

const UNIFORM_BUFFER_SIZE = 4 * 16; // 4x4 matrix

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  model: Model;
  uniformBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    // Create vertex buffers for the cube data.
    const cube = new CubeGeometry({indices: false});
    const positionBuffer = device.createBuffer({id: 'cube-positions', data: cube.attributes.POSITION.value});
    const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cube.attributes.TEXCOORD_0.value});

    this.uniformBuffer = device.createBuffer({
      id: 'uniforms',
      byteLength: UNIFORM_BUFFER_SIZE,
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
    });

    this.model = new Model(device, {
      id: 'cube',
      vs: SHADERS.vs,
      fs: SHADERS.fs,
      layout: {
        attributes: [
          {name: 'position', location: 0, format: 'float32x4'},
          {name: 'uv', location: 1, format: 'float32x2'}
        ],
        bindings: [
          {name: 'uniforms', location: 0, type: 'uniform'}
        ]
      },
      topology: 'triangle-list',
      vertexCount: cube.vertexCount,
      parameters: {
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthWriteEnabled: true,
        depthCompare: 'less',
        depthFormat: 'depth24plus',

        // Backface culling since the cube is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back',
      },
      attributes: {
        position: positionBuffer,
        uv: uvBuffer
      },
      bindings: {
        uniforms: this.uniformBuffer
      },
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

    viewMatrix.identity().translate([0, 0, -4]).rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    projectionMatrix.perspective({fovy: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    this.uniformBuffer.write(new Float32Array(modelViewProjectionMatrix));
  
    const renderPass = device.beginRenderPass({});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
