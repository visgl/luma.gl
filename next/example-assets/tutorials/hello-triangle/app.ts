import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';
import {HELLO_TRIANGLE_INFO_HTML} from './app-ui';

export const title = 'Hello Triangle';
export const description = 'Shows rendering a basic triangle.';

const {WGSL_SHADER, VS_GLSL, FS_GLSL} = getShaderSources();

// This class extends AnimationLoopTemplate to define the main render loop
export default class App extends AnimationLoopTemplate {
  static info = HELLO_TRIANGLE_INFO_HTML;

  model: Model;

  constructor({device}: AnimationProps) {
    super();

    this.model = new Model(device, {
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      topology: 'triangle-list',
      vertexCount: 3,
      shaderLayout: {
        attributes: [],
        bindings: []
      },
      parameters: {
        depthFormat: 'depth24plus'
      }
    });
  }

  // main render loop
  override onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({
      clearColor: [0.961, 0.961, 0.961, 1] // clears the color buffer to a light gray color
    });

    this.model.draw(renderPass);

    renderPass.end(); // ends the render pass
  }

  onFinalize(): void {
    this.model.destroy();
  }
}

function getShaderSources() {
  // vertex & fragment shader in WGSL
  const WGSL_SHADER = /* wgsl */ `\
    @vertex
    fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {

    var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));
        return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
    }

    @fragment
    fn fragmentMain() -> @location(0) vec4<f32> {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0);
    }
`;

  // vertex shader in GLSL
  const VS_GLSL = /* glsl */ `\#version 300 es
    const vec2 pos[3] = vec2[3](vec2(0.0f, 0.5f), vec2(-0.5f, -0.5f), vec2(0.5f, -0.5f));
    void main() {
    gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
    }
`;

  // fragment shader in GLSL
  const FS_GLSL = /* glsl */ `\
    #version 300 es

    precision highp float;

    layout(location = 0) out vec4 outColor;

    void main() {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

  return {WGSL_SHADER, VS_GLSL, FS_GLSL} as const;
}
