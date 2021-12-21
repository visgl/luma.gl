import {luma, Device} from '@luma.gl/api';
import {_NonIndexedCubeGeometry} from '@luma.gl/engine';
import {Model} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

export const title = 'Rotating Cube';
export const description = 'Shows rendering a basic triangle.';

/** @todo - Provide both GLSL and WGSL shaders */
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

function init(device: Device, language: 'glsl' | 'wgsl') {
  // Create vertex buffers for the cube data.
  const cube = new _NonIndexedCubeGeometry();
  const positionBuffer = device.createBuffer({id: 'cube-positions', data: cube.attributes.POSITION.value});
  const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cube.attributes.TEXCOORD_0.value});

  const uniformBuffer = device.createBuffer({
    id: 'uniforms', 
    byteLength: UNIFORM_BUFFER_SIZE,
    // TODO - use API constants instead of WebGPU constants
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const model = new Model(device, {
    id: 'cube',
    vs: SHADERS[language].vertex,
    fs: SHADERS[language].fragment,
    topology: 'triangle-list',
    attributeLayouts: [
      {name: 'position', location: 0, accessor: {format: 'float32x4'}},
      {name: 'uv', location: 1, accessor: {format: 'float32x2'}}
    ],
    attributeBuffers: [positionBuffer, uvBuffer],
    bindings: [uniformBuffer],
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
  });

  const projectionMatrix = new Matrix4();
  const viewMatrix = new Matrix4();
  const modelViewProjectionMatrix = new Matrix4();

  function frame() {
    const aspect = device.canvas.width / device.canvas.height;
    const now = Date.now() / 1000;

    viewMatrix.identity().translate([0, 0, -4]).rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    projectionMatrix.perspective({fov: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    uniformBuffer.write(new Float32Array(modelViewProjectionMatrix));
  
    // device.beginRenderPass();
    model.draw();
    device.commit();
    
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// Create device and run
(async () => init(await luma.createDevice({canvas: 'canvas'}), 'wgsl'))();
