/// <reference types="@webgpu/types" />

import {WebGPUDevice} from '@luma.gl/webgpu';

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

  const vertexShader = device.createShader({stage: 'vertex', source: SHADERS[language].vertex, language});
  const fragmentShader = device.createShader({stage: 'fragment', source: SHADERS[language].fragment, language});

  const pipeline = device.createRenderPipeline({
    vertexShader,
    fragmentShader,
    primitiveTopology: "triangle-list"
    // Geometry in the vertex shader!
  });

  function frame() {
    const renderPass = device.beginRenderPass();

    renderPass.setPipeline(pipeline.handle);
    renderPass.draw(3, 1, 0, 0);

    device.submit();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init(document.getElementById('canvas') as HTMLCanvasElement, 'wgsl');
