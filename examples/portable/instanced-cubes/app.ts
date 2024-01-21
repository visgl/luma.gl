import {Buffer, glsl} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Two Cubes';
export const description = 'Shows usage of multiple uniform buffers.';

// WGSL

const VS_WGSL = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : array<mat4x4<f32>, 16>,
};

@binding(0) @group(0) var<uniform> app : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
  @builtin(instance_index) instanceIdx : u32,
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) texCoords : vec2<f32>
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = app.modelViewProjectionMatrix[instanceIdx] * positions;
  output.fragUV = texCoords;
  output.fragPosition = 0.5 * (positions + vec4<f32>(1.0, 1.0, 1.0, 1.0));
  return output;
}
`;

const FS_WGSL = /* WGSL */`\
@fragment
fn main(
  @location(0) fragUV: vec2<f32>,
  @location(1) fragPosition: vec4<f32>
) -> @location(0) vec4<f32> {
  return fragPosition;
}
`;

// GLSL

const VS_GLSL = glsl`\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix[16];
} app;

// CUBE GEOMETRY
layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix[gl_InstanceID] * vec4(positions, 1.0);
  fragUV = texCoords;
  fragPosition = vec4(positions, 1.);
}
`;

const FS_GLSL = glsl`\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;
in vec2 fragUV;
in vec4 fragPosition;

layout (location=0) out vec4 fragColor;

void main() {
  fragColor = fragPosition;
}
`;

const X_COUNT = 4;
const Y_COUNT = 4;
const NUMBER_OF_INSTANCES = X_COUNT * Y_COUNT;
const MATRIX_SIZE = 4 * 4 * 4; // 4x4 (x4 bytes) matrix
const UNIFORM_BUFFER_SIZE = NUMBER_OF_INSTANCES * MATRIX_SIZE; // 4x4 (x4 bytes) matrix

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  cubeModel: Model;
  uniformBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    this.uniformBuffer = device.createBuffer({
      id: 'uniforms',
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength: UNIFORM_BUFFER_SIZE,
    });

    this.cubeModel = new Model(device, {
      id: 'cube',
      vs: {wgsl: VS_WGSL, glsl: VS_GLSL},
      fs: {wgsl: FS_WGSL, glsl: FS_GLSL},
      geometry: new CubeGeometry({indices: false}),
      instanceCount: NUMBER_OF_INSTANCES,
      parameters: {
        depthWriteEnabled: true, // Fragment closest to the camera is rendered in front.
        depthCompare: 'less', 
        depthFormat: 'depth24plus',        
        cullMode: 'back' // Faces pointing away will be occluded by faces pointing toward the camera.
      },
      bindings: {
        app: this.uniformBuffer
      },
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

