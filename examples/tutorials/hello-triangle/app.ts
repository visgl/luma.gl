import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine'
import {createDeviceInfoPanel} from '@luma.gl/experimental'

export const title = 'Hello Triangle'
export const description = 'Shows rendering a basic triangle.'

const WGSL_SHADER = /* WGSL */ `
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5))
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0)
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0)
}
`

/** Provide both GLSL and WGSL shaders */
const VS_GLSL = /* glsl */ `
#version 300 es
const vec2 pos[3] = vec2[3](vec2(0.0f, 0.5f), vec2(-0.5f, -0.5f), vec2(0.5f, -0.5f));
void main() {
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}
`

const FS_GLSL = /* glsl */ `
#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
void main() {
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Have to start somewhere...</p>
`

  model: Model
  deviceInfoPanel?: HTMLElement

  constructor({device}: AnimationProps) {
    super()
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
    })
  }

  async onInitialize({device}: AnimationProps): Promise<null> {
    if (typeof document !== 'undefined') {
      this.deviceInfoPanel = createDeviceInfoPanel(device, {showExtensionsList: true})
      Object.assign(this.deviceInfoPanel.style, {
        position: 'absolute',
        right: '12px',
        top: '12px',
        maxHeight: 'calc(100vh - 24px)',
        overflow: 'auto',
        zIndex: '10'
      })
      document.body.appendChild(this.deviceInfoPanel)
    }

    return null
  }

  onFinalize() {
    if (this.deviceInfoPanel?.parentElement) {
      this.deviceInfoPanel.parentElement.removeChild(this.deviceInfoPanel)
    }
    this.model.destroy()
  }

  onRender({device}: AnimationProps) {
    const renderPass = device.beginRenderPass({clearColor: [1, 1, 1, 1]})
    this.model.draw(renderPass)
    renderPass.end()
  }
}
