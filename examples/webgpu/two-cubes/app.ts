import {AttributeBinding, RenderPipelineParameters} from '@luma.gl/api';
import {_NonIndexedCubeGeometry} from '@luma.gl/engine';
import {Model, WebGPUDevice} from '@luma.gl/webgpu';
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

const CUBE_ATTRIBUTE_LAYOUTS: AttributeBinding[] = [
  {name: 'position', location: 0, accessor: {format: 'float32x4'}},
  {name: 'uv', location: 1, accessor: {format: 'float32x2'}}
];

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

export async function init(canvas: HTMLCanvasElement, language: 'glsl' | 'wgsl') {
  const device = await WebGPUDevice.create({canvas});

  // Create a vertex buffer from the cube data.
  // Create vertex buffers for the cube data.
  const cube = new _NonIndexedCubeGeometry();
  const positionBuffer = device.createBuffer({id: 'cube-positions', data: cube.attributes.POSITION.value});
  const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cube.attributes.TEXCOORD_0.value});

  const cubeModel = new Model(device, {
    id: 'cube',
    vs: SHADERS[language].vertex,
    fs: SHADERS[language].fragment,
    topology: 'triangle-list',
    attributeLayouts: CUBE_ATTRIBUTE_LAYOUTS,
    attributeBuffers: [positionBuffer, uvBuffer],
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
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const now = Date.now() / 1000;

    projectionMatrix.perspective({fov: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});

    viewMatrix.identity().translate([-2, 0, -7]).rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    uniformBuffer1.write(new Float32Array(modelViewProjectionMatrix));

    viewMatrix.identity().translate([2, 0, -7]).rotateAxis(1, [Math.cos(now), Math.sin(now), 0]);
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    uniformBuffer2.write(new Float32Array(modelViewProjectionMatrix));

    device.beginRenderPass();
    cubeModel.setBindings([uniformBuffer1]);
    cubeModel.draw();
    cubeModel.setBindings([uniformBuffer2]);
    cubeModel.draw();
    device.commit();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init(document.getElementById('canvas') as HTMLCanvasElement, 'wgsl');
