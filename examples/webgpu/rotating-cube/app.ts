import {Model, WebGPUDevice} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

import {
  cubePositions,
  cubeUVs,
  cubeVertexCount
} from './cube';

export const title = 'Rotating Cube';
export const description = 'Shows rendering a basic triangle.';

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

// const vertexBufferLayout = {
//   arrayStride: cubeVertexSize,
//   attributes: [
//     {
//       // position
//       shaderLocation: 0,
//       offset: cubePositionOffset,
//       format: 'float32x4',
//     },
//     {
//       // uv
//       shaderLocation: 1,
//       offset: cubeUVOffset,
//       format: 'float32x2',
//     },
//   ],
// };

// const uniformBindGroup = device.handle.createBindGroup({
//   layout: pipeline.handle.getBindGroupLayout(0),
//   entries: [
//     {
//       binding: 0,
//       resource: {
//         buffer: uniformBuffer.handle,
//       },
//     },
//   ],
// });

const UNIFORM_BUFFER_SIZE = 4 * 16; // 4x4 matrix

export async function init(canvas: HTMLCanvasElement, language: 'glsl' | 'wgsl') {
  const device = await WebGPUDevice.create({canvas});

  // Create a vertex buffer from the cube data.
  const positionBuffer = device.createBuffer({id: 'cube-positions', data: cubePositions});
  const uvBuffer = device.createBuffer({id: 'cube-uvs', data: cubeUVs});


  const uniformBuffer = device.createBuffer({
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
    vertexCount: cubeVertexCount,
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
    const aspect = canvas.width / canvas.height;
    const now = Date.now() / 1000;

    viewMatrix.identity().translate([0, 0, -4]).rotateAxis(1, [Math.sin(now), Math.cos(now), 0]);
    projectionMatrix.perspective({fov: (2 * Math.PI) / 5, aspect, near: 1, far: 100.0});
    modelViewProjectionMatrix.copy(viewMatrix).multiplyLeft(projectionMatrix);
    uniformBuffer.write(new Float32Array(modelViewProjectionMatrix));
  
    device.beginRenderPass();
    model.draw();

    device.submit();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init(document.getElementById('canvas') as HTMLCanvasElement, 'wgsl');


/*
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, );

function getTransformationMatrix() {
  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -4));
  const now = Date.now() / 1000;
  mat4.rotate(
    viewMatrix,
    viewMatrix,
    1,
    vec3.fromValues(Math.sin(now), Math.cos(now), 0)
  );

  const modelViewProjectionMatrix = mat4.create();
  mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);

  return modelViewProjectionMatrix as Float32Array;
}
*/
