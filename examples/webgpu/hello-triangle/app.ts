import {ModelV2, RenderLoop, AnimationProps} from '@luma.gl/engine';
import '@luma.gl/webgpu';

export const title = 'Hello Triangle';
export const description = 'Shows rendering a basic triangle.';

/** Provide both GLSL and WGSL shaders */
const SHADERS = {
  glsl: {
    vs: `\
#version 300 es
const vec2 pos[3] = vec2[3](vec2(0.0f, 0.5f), vec2(-0.5f, -0.5f), vec2(0.5f, -0.5f));
void main() {
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}
`,
    fs: `\
#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
void main() {
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`
  },
  wgsl: {
    vs: `\
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
    fs: `\
[[stage(fragment)]]
fn main() -> [[location(0)]] vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
`
  }
};

export default class AppRenderLoop extends RenderLoop {
  model: ModelV2;

  constructor({device}: AnimationProps) {
    super();
    this.model = new ModelV2(device, {
      vs: {wgsl: SHADERS.wgsl.vs, glsl: SHADERS.glsl.vs},
      fs: {wgsl: SHADERS.wgsl.fs, glsl: SHADERS.glsl.fs},
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

  frame({device}: AnimationProps) {
    this.model.draw();
    device.submit();
  }
}

if (!globalThis.website) {
  RenderLoop.run(AppRenderLoop, {type: 'webgpu', canvas: 'canvas'});
}
