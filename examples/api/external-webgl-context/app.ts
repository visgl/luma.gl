import mapboxgl from 'mapbox-gl'
import {Matrix4, radians} from '@math.gl/core'
import {UniformStore} from '@luma.gl/core'
import {Model} from '@luma.gl/engine'
import type {WebGLDevice} from '@luma.gl/webgl'
import {webgl2Adapter} from '@luma.gl/webgl'
import 'mapbox-gl/dist/mapbox-gl.css'

export const title = 'External WebGL Context'
export const description = 'Attach luma.gl to a Mapbox-managed WebGL context.'

type AppUniforms = {
  uModelViewProjection: Matrix4
}

type ExternalWebGLContextHandle = {
  destroy: () => void
}

type ExternalWebGLContextOptions = {
  container?: HTMLElement | null
}

const POSITIONS = new Float32Array([
  0.0, 0.15, 0.0,
  -0.1, -0.15, 0.0,
  0.1, -0.15, 0.0,
  0.0, 0.15, 0.0,
  0.1, -0.15, 0.0,
  0.0, -0.35, 0.0
])

const COLORS = new Float32Array([
  0.0, 0.6, 1.0,
  0.0, 0.4, 0.8,
  0.0, 0.8, 0.8,
  0.0, 0.6, 1.0,
  0.0, 0.8, 0.8,
  0.0, 0.4, 0.8
])

const WGSL_SHADER = /* WGSL */ `
struct AppUniforms {
  uModelViewProjection : mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> app : AppUniforms;

struct VertexInput {
  @location(0) positions : vec3<f32>,
  @location(1) colors : vec3<f32>
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) colors : vec3<f32>
}

@vertex
fn vertexMain(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = app.uModelViewProjection * vec4<f32>(input.positions, 1.0);
  output.colors = input.colors;
  return output;
}

@fragment
fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(input.colors, 0.8);
}
`

const VS_GLSL = /* glsl */ `
#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec3 colors;

layout(std140) uniform app {
  mat4 uModelViewProjection;
};

out vec3 vColor;

void main(void) {
  gl_Position = uModelViewProjection * vec4(positions, 1.0);
  vColor = colors;
}
`

const FS_GLSL = /* glsl */ `
#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;

void main(void) {
  fragColor = vec4(vColor, 0.8);
}
`

export async function initializeExternalWebGLContext(
  options: ExternalWebGLContextOptions = {}
): Promise<ExternalWebGLContextHandle> {
  const container = options.container || document.body
  mapboxgl.accessToken = ''

  const uniformStore = new UniformStore<{app: AppUniforms}>({
    app: {
      uModelViewProjection: new Matrix4()
    }
  })

  let device: WebGLDevice | null = null
  let model: Model | null = null
  let activeWebglContext: WebGL2RenderingContext | null = null

  const baseModelMatrix = new Matrix4()
  const modelMatrix = new Matrix4()
  const modelViewProjectionMatrix = new Matrix4()
  let rotation = 0

  const mapboxMap = new mapboxgl.Map({
    container,
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [-122.43, 37.77],
    pitch: 60,
    zoom: 12.5,
    antialias: true
  })

  const resizeCanvasContext = (webglContext: WebGL2RenderingContext) => {
    if (device) {
      device.canvasContext.resize({
        width: webglContext.drawingBufferWidth,
        height: webglContext.drawingBufferHeight
      })
    }
  }

  const customLayer: mapboxgl.CustomLayerInterface = {
    id: 'luma-gl-overlay',
    type: 'custom',
    renderingMode: '3d',
    onAdd: async (mapboxInstance, mapboxWebglContext) => {
      if (!(mapboxWebglContext instanceof WebGL2RenderingContext)) {
        throw new Error('Mapbox needs to provide a WebGL2RenderingContext to attach a luma.gl device.')
      }

      activeWebglContext = mapboxWebglContext
      device = await webgl2Adapter.attach(mapboxWebglContext, {createCanvasContext: {autoResize: false}})

      resizeCanvasContext(mapboxWebglContext)

      const mercator = mapboxgl.MercatorCoordinate.fromLngLat(mapboxInstance.getCenter(), 250)
      const meterScale = mercator.meterInMercatorCoordinateUnits()

      baseModelMatrix
        .identity()
        .translate([mercator.x, mercator.y, mercator.z])
        .scale([meterScale * 800, meterScale * 800, meterScale * 800])

      model = new Model(device, {
        id: 'mapbox-overlay-model',
        source: WGSL_SHADER,
        vs: VS_GLSL,
        fs: FS_GLSL,
        shaderLayout: {
          attributes: [
            {name: 'positions', location: 0, format: 'float32x3'},
            {name: 'colors', location: 1, format: 'float32x3'}
          ],
          bindings: [{name: 'app', type: 'uniform', location: 0}]
        },
        attributes: {
          positions: POSITIONS,
          colors: COLORS
        },
        vertexCount: POSITIONS.length / 3,
        bindings: {
          app: uniformStore.getManagedUniformBuffer(device, 'app')
        },
        parameters: {
          depthWriteEnabled: false,
          depthCompare: 'less-equal',
          blend: true,
          blendColor: [0, 0, 0, 0],
          blendEquation: 'add',
          blendFunc: {
            srcRGB: 'src-alpha',
            dstRGB: 'one-minus-src-alpha',
            srcAlpha: 'src-alpha',
            dstAlpha: 'one-minus-src-alpha'
          }
        }
      })
    },
    render: (mapboxWebglContext, matrix) => {
      if (
        !(mapboxWebglContext instanceof WebGL2RenderingContext) ||
        !device ||
        !model
      ) {
        return
      }

      activeWebglContext = mapboxWebglContext
      resizeCanvasContext(mapboxWebglContext)

      rotation += 0.01
      modelMatrix.copy(baseModelMatrix).rotateX(radians(50)).rotateZ(rotation)
      modelViewProjectionMatrix.fromArray(matrix).multiplyRight(modelMatrix)

      uniformStore.setUniforms({
        app: {
          uModelViewProjection: modelViewProjectionMatrix
        }
      })
      uniformStore.updateUniformBuffers()

      const renderPass = device.beginRenderPass({
        clearColor: false,
        clearDepth: false
      })
      model.draw(renderPass)
      renderPass.end()

      mapboxMap.triggerRepaint()
    }
  }

  const resizeHandler = () => {
    if (activeWebglContext) {
      resizeCanvasContext(activeWebglContext)
    }
  }

  mapboxMap.on('load', () => {
    mapboxMap.addLayer(customLayer)
    resizeHandler()
  })
  mapboxMap.on('resize', resizeHandler)

  return {
    destroy: () => {
      mapboxMap.off('resize', resizeHandler)

      if (mapboxMap.getLayer(customLayer.id)) {
        mapboxMap.removeLayer(customLayer.id)
      }
      mapboxMap.remove()

      model?.destroy()
      uniformStore.destroy()
      device?.destroy()
    }
  }
}

export type {ExternalWebGLContextHandle, ExternalWebGLContextOptions}
export default initializeExternalWebGLContext
