import maplibregl, {CustomRenderMethodInput} from 'maplibre-gl';
import {Matrix4, radians} from '@math.gl/core';
import {UniformStore} from '@luma.gl/core';
import type {Buffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {WebGLDevice} from '@luma.gl/webgl';
import {webgl2Adapter} from '@luma.gl/webgl';
import 'maplibre-gl/dist/maplibre-gl.css';

export const title = 'External WebGL Context';
export const description = 'Attach luma.gl to a MapLibre-managed WebGL context.';

type AppUniforms = {
  uModelViewProjection: Float32Array;
};

type ExternalWebGLContextHandle = {
  destroy: () => void;
};

type ExternalWebGLContextOptions = {
  container?: HTMLElement | null;
};

const POSITIONS = new Float32Array([
  0.0, 0.15, 0.0, -0.1, -0.15, 0.0, 0.1, -0.15, 0.0, 0.0, 0.15, 0.0, 0.1, -0.15, 0.0, 0.0, -0.35,
  0.0
]);

const COLORS = new Float32Array([
  0.0, 0.6, 1.0, 0.0, 0.4, 0.8, 0.0, 0.8, 0.8, 0.0, 0.6, 1.0, 0.0, 0.8, 0.8, 0.0, 0.4, 0.8
]);

const WGSL_SHADER = /* WGSL */ `\
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
`;

const VS_GLSL = /* glsl */ `\
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
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;

void main(void) {
  fragColor = vec4(vColor, 0.8);
}
`;

export async function initializeExternalWebGLContext(
  options: ExternalWebGLContextOptions = {}
): Promise<ExternalWebGLContextHandle> {
  const container = options.container || document.body;

  const uniformStore = new UniformStore<{app: AppUniforms}>({
    app: {
      uniformTypes: {
        uModelViewProjection: 'mat4x4<f32>'
      }
    }
  });

  let device: WebGLDevice | null = null;
  let model: Model | null = null;
  let activeWebglContext: WebGL2RenderingContext | null = null;
  let positionsBuffer: Buffer | null = null;
  let colorsBuffer: Buffer | null = null;

  const baseModelMatrix = new Matrix4();
  const modelViewProjectionMatrix = new Matrix4();
  const modelMatrix = new Matrix4();
  const rotation = 0;

  const maplibreMap = new maplibregl.Map({
    container,
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [-122.43, 37.77],
    pitch: 60,
    zoom: 12.5,
    antialias: true
  });

  const resizeCanvasContext = (webglContext: WebGL2RenderingContext) => {
    if (device) {
      device.canvasContext.resize({
        width: webglContext.drawingBufferWidth,
        height: webglContext.drawingBufferHeight
      });
    }
  };

  const customLayer: maplibregl.CustomLayerInterface = {
    id: 'luma-gl-overlay',
    type: 'custom',
    renderingMode: '3d',
    onAdd: async (maplibreInstance, maplibreWebglContext) => {
      if (!(maplibreWebglContext instanceof WebGL2RenderingContext)) {
        throw new Error(
          'MapLibre needs to provide a WebGL2RenderingContext to attach a luma.gl device.'
        );
      }

      activeWebglContext = maplibreWebglContext;
      device = await webgl2Adapter.attach(maplibreWebglContext, {
        createCanvasContext: {autoResize: false}
      });

      resizeCanvasContext(maplibreWebglContext);

      const mercator = maplibregl.MercatorCoordinate.fromLngLat(maplibreInstance.getCenter(), 250);
      const meterScale = mercator.meterInMercatorCoordinateUnits();
      const overlaySizeMeters = 800;

      baseModelMatrix
        .identity()
        .translate([mercator.x, mercator.y, mercator.z])
        .scale([
          meterScale * overlaySizeMeters,
          -meterScale * overlaySizeMeters,
          meterScale * overlaySizeMeters
        ]);

      positionsBuffer = device.createBuffer({data: POSITIONS});
      colorsBuffer = device.createBuffer({data: COLORS});

      model = new Model(device, {
        id: 'maplibre-overlay-model',
        source: WGSL_SHADER,
        vs: VS_GLSL,
        fs: FS_GLSL,
        bufferLayout: [
          {name: 'positions', format: 'float32x3'},
          {name: 'colors', format: 'float32x3'}
        ],
        attributes: {
          positions: positionsBuffer,
          colors: colorsBuffer
        },
        vertexCount: POSITIONS.length / 3,
        bindings: {
          app: uniformStore.getManagedUniformBuffer(device, 'app')
        },
        parameters: {
          depthWriteEnabled: false,
          depthCompare: 'always'
          // blend: true,
          // blendColor: [0, 0, 0, 0],
          // blendEquation: 'add',
          // blendFunc: {
          //   srcRGB: 'src-alpha',
          //   dstRGB: 'one-minus-src-alpha',
          //   srcAlpha: 'src-alpha',
          //   dstAlpha: 'one-minus-src-alpha'
          // }
        }
      });
    },
    render: (maplibreWebglContext, customRenderInput: CustomRenderMethodInput) => {
      if (!(maplibreWebglContext instanceof WebGL2RenderingContext) || !device || !model) {
        return;
      }

      const {modelViewProjectionMatrix: matrix} = customRenderInput;
      const maplibreModelViewProjectionMatrix = Array.from(matrix);
      if (maplibreModelViewProjectionMatrix.some(value => !Number.isFinite(value))) {
        throw new Error('Invalid values in modelViewProjectionMatrix');
      }

      activeWebglContext = maplibreWebglContext;
      resizeCanvasContext(maplibreWebglContext);

      // rotation += 0.01
      // modelMatrix.copy(baseModelMatrix).rotateX(radians(50)).rotateZ(rotation)
      // modelViewProjectionMatrix
      //   .fromArray(maplibreModelViewProjectionMatrix)
      //   .multiplyRight(modelMatrix)

      uniformStore.setUniforms({
        app: {
          uModelViewProjection: modelViewProjectionMatrix.toFloat32Array()
        }
      });
      uniformStore.updateUniformBuffers();

      const renderPass = device.beginRenderPass({
        clearColor: false,
        clearDepth: 1.0
      });
      model.draw(renderPass);
      renderPass.end();

      maplibreMap.triggerRepaint();
    }
  };

  const resizeHandler = () => {
    if (activeWebglContext) {
      resizeCanvasContext(activeWebglContext);
    }
  };

  maplibreMap.on('load', () => {
    maplibreMap.addLayer(customLayer);
    resizeHandler();
  });
  maplibreMap.on('resize', resizeHandler);

  return {
    destroy: () => {
      maplibreMap.off('resize', resizeHandler);

      if (maplibreMap.getLayer(customLayer.id)) {
        maplibreMap.removeLayer(customLayer.id);
      }
      maplibreMap.remove();

      positionsBuffer?.destroy();
      colorsBuffer?.destroy();
      model?.destroy();
      uniformStore.destroy();
      device?.destroy();
    }
  };
}

export type {ExternalWebGLContextHandle, ExternalWebGLContextOptions};
export default initializeExternalWebGLContext;
