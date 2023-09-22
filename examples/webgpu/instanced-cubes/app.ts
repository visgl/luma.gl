import {Buffer, ShaderLayout, RenderPipelineParameters, glsl} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Two Cubes';
export const description = 'Shows usage of multiple uniform buffers.';

/** TODO - Provide both GLSL and WGSL shaders */
const SHADERS = {
  vs: {
    glsl: glsl`\
#version 300 es
#define SHADER_NAME cube-vs

uniform uniforms {
  mat4 modelViewProjectionMatrix[16];
};

layout(location=0) in vec3 position;
layout(location=1) in vec2 uv;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = modelViewProjectionMatrix[gl_InstanceID] * vec4(position, 1.0);
  fragUV = uv;
  fragPosition = vec4(position, 1.);
}
    `,
    wgsl: /* WGSL */`
struct Uniforms {
  modelViewProjectionMatrix : @stride(64) array<mat4x4<f32>, 16>;
};

@binding(0) group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
};

@vertex
fn main(@builtin(instance_index) instanceIdx : u32,
        @location(0) position : vec4<f32>,
        @location(1) uv : vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix[instanceIdx] * position;
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
@fragment
fn main(@location(0) fragUV: vec2<f32>,
        @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
  return fragPosition;
}
    `
  }
};

const X_COUNT = 4;
const Y_COUNT = 4;
const NUMBER_OF_INSTANCES = X_COUNT * Y_COUNT;
const MATRIX_SIZE = 4 * 4 * 4; // 4x4 (x4 bytes) matrix
const UNIFORM_BUFFER_SIZE = NUMBER_OF_INSTANCES * MATRIX_SIZE; // 4x4 (x4 bytes) matrix

const CUBE_ATTRIBUTE_LAYOUTS: ShaderLayout = {
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
  uniformBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();
    // Create vertex buffers for the cube data.
    const cube = new CubeGeometry({indices: false});
    const positionBuffer = device.createBuffer({id: 'cube-positions', data: cube.attributes.POSITION.value});
    const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cube.attributes.TEXCOORD_0.value});

    this.uniformBuffer = device.createBuffer({
      id: 'uniforms',
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength: UNIFORM_BUFFER_SIZE,
    });

    this.cubeModel = new Model(device, {
      id: 'cube',
      vs: SHADERS.vs,
      fs: SHADERS.fs,
      topology: 'triangle-list',
      shaderLayout: CUBE_ATTRIBUTE_LAYOUTS,
      attributes: {
        position: positionBuffer,
        uv: uvBuffer
      },
      bindings: {
        uniforms: this.uniformBuffer
      },
      vertexCount: cube.vertexCount,
      instanceCount: NUMBER_OF_INSTANCES,
      parameters: CUBE_RENDER_PARAMETERS
    });
  }

  onFinalize(animationProps: AnimationProps): void {
    this.uniformBuffer.destroy();
    this.cubeModel.destroy();
  }

  onRender({device}: AnimationProps) {
    const projectionMatrix = new Matrix4();
    const aspect = device.canvasContext?.getAspect();
    const now = Date.now() / 1000;

    projectionMatrix.perspective({fovy: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});

    const mvpMatrices = getMVPMatrixArray(projectionMatrix, now);
    this.uniformBuffer.write(mvpMatrices);

    const renderPass = device.beginRenderPass();
    this.cubeModel.draw(renderPass);
    renderPass.end();
  }
}

// Initialize the matrix data for every instance.
const modelMatrices = [];
const STEP = 4.0;

for (let x = 0; x < X_COUNT; x++) {
  for (let y = 0; y < Y_COUNT; y++) {
    modelMatrices.push(new Matrix4().translate([STEP * (x - X_COUNT / 2 + 0.5), STEP * (y - Y_COUNT / 2 + 0.5), 0]));
  }
}

const mvpMatricesData = new Float32Array(NUMBER_OF_INSTANCES * 16);

// Update the transformation matrix data for each instance.
function getMVPMatrixArray(projectionMatrix: Matrix4, now: number): Float32Array {
  const viewMatrix = new Matrix4().translate([0, 0, -12]);

  const tmpMat4 = new Matrix4();

  let i = 0;
  let offset = 0;
  for (let x = 0; x < X_COUNT; x++) {
    for (let y = 0; y < Y_COUNT; y++) {
      tmpMat4.copy(modelMatrices[i]).rotateAxis(1, [Math.sin((x + 0.5) * now), Math.cos((y + 0.5) * now), 0])
        .multiplyLeft(viewMatrix).multiplyLeft(projectionMatrix);

      mvpMatricesData.set(tmpMat4, offset);

      i++;
      offset += 16;
    }
  }
  return mvpMatricesData;
}

