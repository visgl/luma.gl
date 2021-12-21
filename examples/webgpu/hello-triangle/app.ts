import {luma, Device, log} from '@luma.gl/api';
import {Model} from '@luma.gl/webgpu';

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

class RenderLoop {
  device: Device;
  model: Model;

  constructor(device: Device, language: 'glsl' | 'wgsl') {
    this.device = device;
    this.model = new Model(device, {
      vs: SHADERS[language].vertex,
      fs: SHADERS[language].fragment,
      topology: 'triangle-list',
      vertexCount: 3,
      parameters: {
        depthFormat: 'depth24plus',
      }
    });
  }

  destroy() {
    this.model.destroy();
  }

  frame() {
    log.probe('frame')();
    // device.beginRenderPass();
    this.model.draw();
    this.device.commit();
    requestAnimationFrame(this.frame.bind(this));
  }

  start() {
    requestAnimationFrame(this.frame.bind(this));
  }
}

async function main() {
  const device = await luma.createDevice({type: 'webgpu', canvas: 'canvas'});
  const loop = new RenderLoop(device, 'wgsl');
  loop.start();
}

main();