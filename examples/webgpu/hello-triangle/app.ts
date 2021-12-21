/// <reference types='@webgpu/types' />

import {Model, WebGPUDevice} from '@luma.gl/webgpu';

export const title = 'Hello Triangle';
export const description = 'Shows rendering a basic triangle.';

/** Provide both GLSL and WGSL shaders */
const SHADERS = {
  glsl: {
    vertex: `#version 450
const vec2 pos[3] = vec2[3](vec2(0.0f, 0.5f), vec2(-0.5f, -0.5f), vec2(0.5f, -0.5f));

void main() {
  gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
}
`,

    fragment: `#version 450
layout(location = 0) out vec4 outColor;

void main() {
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`
  },
  wgsl: {
    vertex: `
[[stage(vertex)]]
fn main([[builtin(vertex_index)]] VertexIndex : u32)
    -> [[builtin(position)]] vec4<f32> {
  var pos = array<vec2<f32>, 3>(
      vec2<f32>(0.0, 0.5),
      vec2<f32>(-0.5, -0.5),
      vec2<f32>(0.5, -0.5));

  return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}
    `,
    fragment: `
[[stage(fragment)]]
fn main() -> [[location(0)]] vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
    `
  }
};

export async function init(canvas: HTMLCanvasElement, language: 'glsl' | 'wgsl') {
  const device = await WebGPUDevice.create({canvas});

  const model = new Model(device, {
    vs: SHADERS[language].vertex,
    fs: SHADERS[language].fragment,
    topology: 'triangle-list',
    vertexCount: 3,
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
    }
  });

  function frame() {
    device.beginRenderPass();
    model.draw();
    device.commit();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init(document.getElementById('canvas') as HTMLCanvasElement, 'wgsl');
