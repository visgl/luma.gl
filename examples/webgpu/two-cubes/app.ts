// luma.gl, MIT license
import {luma, Device, ShaderLayout, RenderPipelineParameters} from '@luma.gl/api';
import {ModelV2 as Model, CubeGeometry} from '@luma.gl/engine';
import '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Two Cubes';
export const description = 'Shows usage of multiple uniform buffers.';

/** Provide both GLSL and WGSL shaders */
const SHADERS = {
  wgsl: {
    vertex: `
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
        `,
    fragment: `
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
    {name: 'position', location: 0, format: 'float32x4'},
    {name: 'uv', location: 1, format: 'float32x2'}
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

export async function init(device: Device, language: 'glsl' | 'wgsl') {
  // Create a vertex buffer from the cube data.
  // Create vertex buffers for the cube data.
  const cube = new CubeGeometry({indices: false});
  const positionBuffer = device.createBuffer({id: 'cube-positions', data: cube.attributes.POSITION.value});
  const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cube.attributes.TEXCOORD_0.value});

  const cubeModel = new Model(device, {
    id: 'cube',
    vs: SHADERS[language].vertex,
    fs: SHADERS[language].fragment,
    topology: 'triangle-list',
    layout: CUBE_SHADER_LAYOUT,
    attributes: {
      position: positionBuffer,
      uv: uvBuffer
    },
    vertexCount: cube.vertexCount,
    parameters: CUBE_RENDER_PARAMETERS
  });

  const uniformBuffer1 = device.createBuffer({
    id: 'uniforms-1',
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    byteLength: UNIFORM_BUFFER_SIZE,
  });

  const uniformBuffer2 = device.createBuffer({
    id: 'uniforms-2',
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    byteLength: UNIFORM_BUFFER_SIZE,
  });

  const projectionMatrix = new Matrix4();
  const viewMatrix = new Matrix4();
  const modelViewProjectionMatrix = new Matrix4();

  function frame() {
    const aspect = device.canvas.clientWidth / device.canvas.clientHeight;
    const now = Date.now() / 1000;

    projectionMatrix.perspective({fov: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});

    viewMatrix.identity().translate([-2, 0, -7]).rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    uniformBuffer1.write(new Float32Array(modelViewProjectionMatrix));

    viewMatrix.identity().translate([2, 0, -7]).rotateAxis(1, [Math.cos(now), Math.sin(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    uniformBuffer2.write(new Float32Array(modelViewProjectionMatrix));

    cubeModel.setBindings({uniforms: uniformBuffer1});
    cubeModel.draw();
    cubeModel.setBindings({uniforms: uniformBuffer2});
    cubeModel.draw();
    device.commit();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

(async () => await init(await luma.createDevice({type: 'webgpu', canvas: 'canvas'}), 'wgsl'))();
