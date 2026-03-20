// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';

import {luma, type Device, type PresentationContext} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {fp64arithmetic, type ShaderModule} from '@luma.gl/shadertools';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

type AppProps = {
  device?: Device | null;
  presentationDevice?: Device | null;
};

type AppState = {
  currentZoomLabel: string;
  initializationError: string | null;
  isReady: boolean;
  selectedPresetId: ZoomPresetId;
};

type ZoomPresetId = 'seahorse' | 'elephant';

type ZoomPreset = {
  centerX: number;
  centerY: number;
  label: string;
};

type Mandelbrot32Uniforms = {
  resolution: [number, number];
  center: [number, number];
  pixelScale: number;
  aspectRatio: number;
  time: number;
  iterationLimit: number;
};

type Mandelbrot64Uniforms = {
  resolution: [number, number];
  centerX: [number, number];
  centerY: [number, number];
  pixelScale: [number, number];
  aspectRatio: number;
  time: number;
  iterationLimit: number;
};

type VisualizationSpec = {
  clearColor: [number, number, number, number];
  description: string;
  fragmentShaderGLSL: string;
  fragmentShaderWGSL: string;
  kind: 'fp32' | 'fp64';
  title: string;
};

type VisualizationRenderer = {
  error: string | null;
  model: Model | null;
  presentationContext: PresentationContext | null;
  shaderInputs: ShaderInputs<any> | null;
  spec: VisualizationSpec;
};

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 280;
const FIXED_ITERATION_LIMIT = 1400;
const FULLSCREEN_POSITIONS = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
const INITIAL_PIXEL_SCALE = 1.35;
const MIN_PIXEL_SCALE = 1e-12;
const ZOOM_RATE = 1.2;
const ZOOM_CYCLE_DURATION = Math.log2(INITIAL_PIXEL_SCALE / MIN_PIXEL_SCALE) / ZOOM_RATE;
const ZOOM_PRESETS: Record<ZoomPresetId, ZoomPreset> = {
  seahorse: {
    label: 'Seahorse',
    centerX: -0.743643887037151,
    centerY: 0.13182590420533
  },
  elephant: {
    label: 'Elephant',
    centerX: 0.28692299709,
    centerY: 0.014286693904
  }
};
const DEFAULT_PRESET_ID: ZoomPresetId = 'seahorse';

export default class App extends React.PureComponent<AppProps, AppState> {
  readonly canvasRefs = [
    React.createRef<HTMLCanvasElement>(),
    React.createRef<HTMLCanvasElement>()
  ];

  device: Device | null = null;
  renderer: MultiCanvasRenderer | null = null;
  private ownsDevice = false;
  private initializationGeneration = 0;
  private isComponentMounted = false;

  constructor(props: AppProps) {
    super(props);

    this.state = {
      currentZoomLabel: formatZoomScale(INITIAL_PIXEL_SCALE),
      initializationError: null,
      isReady: false,
      selectedPresetId: DEFAULT_PRESET_ID
    };
  }

  override async componentDidMount(): Promise<void> {
    this.isComponentMounted = true;
    await this.initialize();
  }

  override async componentDidUpdate(
    previousProps: AppProps,
    previousState: AppState
  ): Promise<void> {
    if (
      previousProps.device !== this.props.device ||
      previousProps.presentationDevice !== this.props.presentationDevice
    ) {
      await this.initialize();
      return;
    }

    if (previousState.selectedPresetId !== this.state.selectedPresetId) {
      this.renderer?.setZoomPreset(ZOOM_PRESETS[this.state.selectedPresetId]);
    }
  }

  override componentWillUnmount(): void {
    this.isComponentMounted = false;
    this.initializationGeneration++;
    this.destroyResources();
  }

  async initialize(): Promise<void> {
    const initializationGeneration = ++this.initializationGeneration;
    this.destroyResources();
    this.setState({
      currentZoomLabel: formatZoomScale(INITIAL_PIXEL_SCALE),
      initializationError: null,
      isReady: false
    });

    try {
      const canvases = this.canvasRefs.map(reference => reference.current);
      if (canvases.some(canvas => !canvas)) {
        throw new Error('Mandelbrot canvases were not mounted.');
      }

      const externalDevice = this.props.device || this.props.presentationDevice;
      const device = externalDevice || (await this.createOwnedDevice());
      const renderer = new MultiCanvasRenderer(
        device,
        canvases as HTMLCanvasElement[],
        ZOOM_PRESETS[this.state.selectedPresetId],
        this.handleFrame
      );

      if (!this.isReadyForInitialization(initializationGeneration)) {
        renderer.destroy();
        if (!externalDevice) {
          device.destroy();
        }
        return;
      }

      this.device = device;
      this.renderer = renderer;
      this.ownsDevice = !externalDevice;
      this.renderer.start();

      const rendererErrors = this.renderer.getInitializationErrors();

      if (!this.isReadyForInitialization(initializationGeneration)) {
        this.destroyResources();
        return;
      }

      this.setState({
        initializationError: rendererErrors.length > 0 ? rendererErrors.join(' ') : null,
        isReady: this.renderer.hasActiveVisualizations()
      });
    } catch (error) {
      console.error('FP64 example initialization failed', error);
      this.setState({
        initializationError: error instanceof Error ? error.message : String(error),
        isReady: false
      });
    }
  }

  override render(): React.ReactNode {
    const {currentZoomLabel, initializationError, isReady, selectedPresetId} = this.state;
    const selectedPreset = ZOOM_PRESETS[selectedPresetId];
    const overlayLines = getOverlayLines(selectedPreset, currentZoomLabel);
    const visualizationSpecs = getVisualizationSpecs();

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: '72px 20px 20px'
        }}
      >
        {initializationError ? (
          <p style={{color: '#b00020', margin: 0}}>{initializationError}</p>
        ) : null}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gridTemplateRows: 'auto auto',
            gap: 20,
            alignItems: 'start'
          }}
        >
          {visualizationSpecs.map((visualization, index) => (
            <ExamplePaneCopy
              control={
                index === 0 ? (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 12,
                      maxWidth: 220
                    }}
                  >
                    <span style={{fontSize: 13, fontWeight: 600}}>Zoom target</span>
                    <select
                      onChange={this.handlePresetChange}
                      value={selectedPresetId}
                      style={{
                        border: '1px solid #c7cad1',
                        borderRadius: 8,
                        padding: '8px 10px',
                        font: 'inherit',
                        background: '#fff'
                      }}
                    >
                      {Object.entries(ZOOM_PRESETS).map(([presetId, preset]) => (
                        <option key={presetId} value={presetId}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : undefined
              }
              description={visualization.description}
              key={`${visualization.kind}-copy`}
              title={visualization.title}
            />
          ))}
          {this.canvasRefs.map((canvasRef, index) => (
            <ExamplePaneCanvas
              canvasRef={canvasRef}
              isReady={isReady}
              key={`${visualizationSpecs[index].kind}-canvas`}
              overlayLines={overlayLines}
            />
          ))}
        </div>
      </div>
    );
  }

  private isReadyForInitialization(initializationGeneration: number): boolean {
    return this.isComponentMounted && this.initializationGeneration === initializationGeneration;
  }

  private destroyResources(): void {
    this.renderer?.destroy();
    this.renderer = null;
    if (this.ownsDevice) {
      this.device?.destroy();
    }
    this.device = null;
    this.ownsDevice = false;
  }

  private async createOwnedDevice(): Promise<Device> {
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('This example requires OffscreenCanvas support.');
    }

    return await luma.createDevice({
      adapters: [webgpuAdapter, webgl2Adapter],
      createCanvasContext: {
        canvas: new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        autoResize: false,
        useDevicePixels: false
      }
    });
  }

  private handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    this.setState({selectedPresetId: event.target.value as ZoomPresetId});
  };

  private handleFrame = (pixelScale: number): void => {
    const currentZoomLabel = formatZoomScale(pixelScale);
    if (currentZoomLabel !== this.state.currentZoomLabel) {
      this.setState({currentZoomLabel});
    }
  };
}

export function renderToDOM(
  container: HTMLElement,
  props: {device?: Device | null; presentationDevice?: Device | null} = {}
): () => void {
  const root: Root = createRoot(container);
  root.render(<App {...props} />);

  return () => {
    root.unmount();
  };
}

class MultiCanvasRenderer {
  readonly device: Device;
  readonly fullscreenBuffer: ReturnType<Device['createBuffer']>;
  readonly onFrame?: (pixelScale: number) => void;
  readonly visualizations: VisualizationRenderer[];

  animationFrame: number | null = null;
  startTime = 0;
  zoomPreset: ZoomPreset;

  constructor(
    device: Device,
    canvases: HTMLCanvasElement[],
    zoomPreset: ZoomPreset,
    onFrame?: (pixelScale: number) => void
  ) {
    this.device = device;
    this.onFrame = onFrame;
    this.zoomPreset = zoomPreset;
    this.fullscreenBuffer = device.createBuffer({data: FULLSCREEN_POSITIONS});
    this.visualizations = getVisualizationSpecs().map((spec, index) => {
      try {
        return createVisualizationRenderer(device, canvases[index], this.fullscreenBuffer, spec);
      } catch (error) {
        console.error(`Failed to initialize ${spec.kind} visualization`, error);
        return {
          error: error instanceof Error ? error.message : String(error),
          model: null,
          presentationContext: null,
          shaderInputs: null,
          spec
        };
      }
    });
  }

  start(): void {
    this.startTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    for (const visualization of this.visualizations) {
      visualization.model?.destroy();
      visualization.presentationContext?.destroy();
    }

    this.fullscreenBuffer.destroy();
  }

  setZoomPreset(zoomPreset: ZoomPreset): void {
    this.zoomPreset = zoomPreset;
    this.startTime = performance.now();
  }

  hasActiveVisualizations(): boolean {
    return this.visualizations.some(
      visualization => visualization.model && visualization.shaderInputs
    );
  }

  getInitializationErrors(): string[] {
    return this.visualizations
      .filter(visualization => visualization.error)
      .map(
        visualization =>
          `${visualization.spec.title} initialization failed: ${visualization.error as string}`
      );
  }

  private animate = (timestamp: number): void => {
    const time = (timestamp - this.startTime) / 1000;
    const pixelScale = getPixelScale(time);

    this.onFrame?.(pixelScale);

    for (const visualization of this.visualizations) {
      renderVisualization(this.device, visualization, time, this.zoomPreset);
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };
}

function createVisualizationRenderer(
  device: Device,
  canvas: HTMLCanvasElement,
  buffer: ReturnType<Device['createBuffer']>,
  spec: VisualizationSpec
): VisualizationRenderer {
  const presentationContext = device.createPresentationContext({
    canvas,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    autoResize: false,
    useDevicePixels: false
  });

  const shaderInputs =
    spec.kind === 'fp64'
      ? new ShaderInputs({
          fp64arithmetic,
          mandelbrot64
        })
      : new ShaderInputs({
          mandelbrot32
        });

  const model = new Model(device, {
    id: `${spec.kind}-mandelbrot-model`,
    source: `${FULLSCREEN_SOURCE}\n${spec.fragmentShaderWGSL}`,
    vs: FULLSCREEN_VERTEX_SHADER,
    fs: spec.fragmentShaderGLSL,
    modules: spec.kind === 'fp64' ? [fp64arithmetic] : [],
    bufferLayout: [{name: 'position', format: 'float32x2'}],
    attributes: {
      position: buffer
    },
    vertexCount: 4,
    topology: 'triangle-strip',
    shaderInputs
  });

  return {error: null, model, presentationContext, shaderInputs, spec};
}

function renderVisualization(
  device: Device,
  visualization: VisualizationRenderer,
  elapsedTime: number,
  zoomPreset: ZoomPreset
): void {
  if (!visualization.model || !visualization.presentationContext || !visualization.shaderInputs) {
    return;
  }

  const framebuffer = visualization.presentationContext.getCurrentFramebuffer({
    depthStencilFormat: false
  });
  const [width, height] = visualization.presentationContext.getDrawingBufferSize();
  const aspectRatio = width / Math.max(height, 1);
  const centerX = zoomPreset.centerX;
  const centerY = zoomPreset.centerY;
  const scale = getPixelScale(elapsedTime);
  const fp64CenterX = split64(centerX);
  const fp64CenterY = split64(centerY);
  const fp64Scale = split64(scale);
  const iterationLimit = computeIterationLimit(scale);

  if (visualization.spec.kind === 'fp64') {
    visualization.shaderInputs.setProps({
      mandelbrot64: {
        resolution: [width, height],
        centerX: fp64CenterX,
        centerY: fp64CenterY,
        pixelScale: fp64Scale,
        aspectRatio,
        time: elapsedTime,
        iterationLimit
      }
    });
  } else {
    visualization.shaderInputs.setProps({
      mandelbrot32: {
        resolution: [width, height],
        center: [centerX, centerY],
        pixelScale: scale,
        aspectRatio,
        time: elapsedTime,
        iterationLimit
      }
    });
  }

  visualization.model.updateShaderInputs();

  const renderPass = device.beginRenderPass({
    framebuffer,
    clearColor: visualization.spec.clearColor
  });

  visualization.model.draw(renderPass);
  renderPass.end();
  visualization.presentationContext.present();
}

function split64(value: number): [number, number] {
  const highPart = Math.fround(value);
  const lowPart = value - highPart;
  return [highPart, lowPart];
}

function computeIterationLimit(pixelScale: number): number {
  const zoomDepth = Math.max(0, Math.log2(INITIAL_PIXEL_SCALE / pixelScale));
  return Math.min(FIXED_ITERATION_LIMIT, Math.round(220 + zoomDepth * 28));
}

function getPixelScale(elapsedTime: number): number {
  const cycleTime = elapsedTime % ZOOM_CYCLE_DURATION;
  return INITIAL_PIXEL_SCALE * Math.pow(0.5, cycleTime * ZOOM_RATE);
}

function formatZoomScale(pixelScale: number): string {
  return pixelScale.toExponential(3);
}

function getOverlayLines(zoomPreset: ZoomPreset, currentZoomLabel: string): string[] {
  return [
    'mode = mandelbrot zoom',
    `target = ${zoomPreset.label}`,
    `x = ${zoomPreset.centerX}`,
    `y = ${zoomPreset.centerY}`,
    `scale = ${currentZoomLabel}`,
    `zoom = ${INITIAL_PIXEL_SCALE} -> ${MIN_PIXEL_SCALE}`,
    'iterations = adaptive'
  ];
}

function ExamplePaneCopy(props: {
  control?: React.ReactNode;
  description: string;
  title: string;
}): React.ReactNode {
  const {control, description, title} = props;

  return (
    <div
      style={{
        minWidth: 0,
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          paddingBottom: 2
        }}
      >
        <h3 style={{marginTop: 0, marginBottom: 6}}>{title}</h3>
        <p style={{margin: 0, lineHeight: 1.45}}>{description}</p>
        {control}
      </div>
    </div>
  );
}

function ExamplePaneCanvas(props: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  overlayLines: string[];
}): React.ReactNode {
  const {canvasRef, isReady, overlayLines} = props;

  return (
    <div
      style={{
        minWidth: 0,
        width: '100%',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          border: '1px solid #1f192c',
          background: '#000',
          opacity: isReady ? 1 : 0.5
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          padding: '8px 10px',
          background: 'rgba(0, 0, 0, 0.68)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.45,
          borderRadius: 8,
          pointerEvents: 'none'
        }}
      >
        {overlayLines.map(line => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

const mandelbrot32: ShaderModule<Mandelbrot32Uniforms> = {
  name: 'mandelbrot32',
  uniformTypes: {
    resolution: 'vec2<f32>',
    center: 'vec2<f32>',
    pixelScale: 'f32',
    aspectRatio: 'f32',
    time: 'f32',
    iterationLimit: 'f32'
  }
};

const mandelbrot64: ShaderModule<Mandelbrot64Uniforms> = {
  name: 'mandelbrot64',
  dependencies: [fp64arithmetic],
  uniformTypes: {
    resolution: 'vec2<f32>',
    centerX: 'vec2<f32>',
    centerY: 'vec2<f32>',
    pixelScale: 'vec2<f32>',
    aspectRatio: 'f32',
    time: 'f32',
    iterationLimit: 'f32'
  }
};

const FULLSCREEN_SOURCE = /* wgsl */ `\
struct VertexInput {
  @location(0) position: vec2<f32>,
}

struct FragmentOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(input: VertexInput) -> FragmentOutput {
  var output: FragmentOutput;
  output.position = vec4<f32>(input.position, 0.0, 1.0);
  output.uv = input.position * 0.5 + vec2<f32>(0.5, 0.5);
  return output;
}
`;

const FULLSCREEN_VERTEX_SHADER = /* glsl */ `\
#version 300 es
layout(location = 0) in vec2 position;

out vec2 vUV;

void main(void) {
  gl_Position = vec4(position, 0.0, 1.0);
  vUV = position * 0.5 + vec2(0.5, 0.5);
}
`;

const MANDELBROT32_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

layout(std140) uniform mandelbrot32Uniforms {
  vec2 resolution;
  vec2 center;
  float pixelScale;
  float aspectRatio;
  float time;
  float iterationLimit;
} mandelbrot32;

const int MAX_ITERATIONS = 2048;
const float ESCAPE_RADIUS_SQUARED = 256.0;
const float TAU = 6.28318530718;

vec3 palette(float value) {
  vec3 phase = vec3(0.18, 0.41, 0.73) + mandelbrot32.time * vec3(0.008, 0.012, 0.02);
  return 0.5 + 0.5 * cos(TAU * (value + phase));
}

void main(void) {
  vec2 centered = vUV * 2.0 - vec2(1.0);
  vec2 c = mandelbrot32.center + vec2(
    centered.x * mandelbrot32.aspectRatio * mandelbrot32.pixelScale,
    centered.y * mandelbrot32.pixelScale
  );

  vec2 z = vec2(0.0);
  float escapedIteration = mandelbrot32.iterationLimit;
  float radiusSquared = 0.0;

  for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    if (float(iteration) >= mandelbrot32.iterationLimit) {
      break;
    }

    float nextX = z.x * z.x - z.y * z.y + c.x;
    float nextY = 2.0 * z.x * z.y + c.y;
    z = vec2(nextX, nextY);
    radiusSquared = dot(z, z);

    if (radiusSquared > ESCAPE_RADIUS_SQUARED) {
      escapedIteration = float(iteration);
      break;
    }
  }

  if (radiusSquared <= ESCAPE_RADIUS_SQUARED) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float smoothIteration = escapedIteration + 1.0 - log2(log2(max(radiusSquared, 1.000001)));
  float colorPosition = smoothIteration / mandelbrot32.iterationLimit;
  vec3 color = palette(colorPosition);
  color *= 0.55 + 0.45 * smoothstep(0.0, 1.0, colorPosition);

  fragColor = vec4(color, 1.0);
}
`;

const MANDELBROT32_FRAGMENT_WGSL = /* wgsl */ `\
struct Mandelbrot32Uniforms {
  resolution: vec2<f32>,
  center: vec2<f32>,
  pixelScale: f32,
  aspectRatio: f32,
  time: f32,
  iterationLimit: f32,
};

@group(0) @binding(0) var<uniform> mandelbrot32 : Mandelbrot32Uniforms;

const MAX_ITERATIONS: i32 = 2048;
const ESCAPE_RADIUS_SQUARED: f32 = 256.0;
const TAU: f32 = 6.28318530718;

fn palette32(value: f32) -> vec3<f32> {
  let phase = vec3<f32>(0.18, 0.41, 0.73) + mandelbrot32.time * vec3<f32>(0.008, 0.012, 0.02);
  return 0.5 + 0.5 * cos(TAU * (value + phase));
}

@fragment
fn fragmentMain(inputs: FragmentOutput) -> @location(0) vec4<f32> {
  let centered = inputs.uv * 2.0 - vec2<f32>(1.0, 1.0);
  let c = mandelbrot32.center + vec2<f32>(
    centered.x * mandelbrot32.aspectRatio * mandelbrot32.pixelScale,
    centered.y * mandelbrot32.pixelScale
  );

  var z = vec2<f32>(0.0, 0.0);
  var escapedIteration = mandelbrot32.iterationLimit;
  var radiusSquared = 0.0;

  for (var iteration: i32 = 0; iteration < MAX_ITERATIONS; iteration = iteration + 1) {
    if (f32(iteration) >= mandelbrot32.iterationLimit) {
      break;
    }

    let nextX = z.x * z.x - z.y * z.y + c.x;
    let nextY = 2.0 * z.x * z.y + c.y;
    z = vec2<f32>(nextX, nextY);
    radiusSquared = dot(z, z);

    if (radiusSquared > ESCAPE_RADIUS_SQUARED) {
      escapedIteration = f32(iteration);
      break;
    }
  }

  if (radiusSquared <= ESCAPE_RADIUS_SQUARED) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }

  let smoothIteration =
    escapedIteration + 1.0 - log2(log2(max(radiusSquared, 1.000001)));
  let colorPosition = smoothIteration / mandelbrot32.iterationLimit;
  var color = palette32(colorPosition);
  color = color * (0.55 + 0.45 * smoothstep(0.0, 1.0, colorPosition));
  return vec4<f32>(color, 1.0);
}
`;

const MANDELBROT64_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

layout(std140) uniform mandelbrot64Uniforms {
  vec2 resolution;
  vec2 centerX;
  vec2 centerY;
  vec2 pixelScale;
  float aspectRatio;
  float time;
  float iterationLimit;
} mandelbrot64;

const int MAX_ITERATIONS = 2048;
const float ESCAPE_RADIUS_SQUARED = 256.0;
const float TAU = 6.28318530718;

vec3 palette(float value) {
  vec3 phase = vec3(0.18, 0.41, 0.73) + mandelbrot64.time * vec3(0.008, 0.012, 0.02);
  return 0.5 + 0.5 * cos(TAU * (value + phase));
}

void main(void) {
  vec2 centered = vUV * 2.0 - vec2(1.0);
  vec2 offsetX = mul_fp64(
    vec2(centered.x * mandelbrot64.aspectRatio, 0.0),
    mandelbrot64.pixelScale
  );
  vec2 offsetY = mul_fp64(vec2(centered.y, 0.0), mandelbrot64.pixelScale);

  vec2 cx = sum_fp64(mandelbrot64.centerX, offsetX);
  vec2 cy = sum_fp64(mandelbrot64.centerY, offsetY);
  vec2 zx = vec2(0.0);
  vec2 zy = vec2(0.0);

  float escapedIteration = mandelbrot64.iterationLimit;
  float radiusSquared = 0.0;

  for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    if (float(iteration) >= mandelbrot64.iterationLimit) {
      break;
    }

    vec2 xSquared = mul_fp64(zx, zx);
    vec2 ySquared = mul_fp64(zy, zy);
    vec2 xy = mul_fp64(zx, zy);
    vec2 nextX = sum_fp64(sub_fp64(xSquared, ySquared), cx);
    vec2 nextY = sum_fp64(sum_fp64(xy, xy), cy);

    zx = nextX;
    zy = nextY;

    vec2 magnitudeSquared = sum_fp64(mul_fp64(zx, zx), mul_fp64(zy, zy));
    radiusSquared = magnitudeSquared.x + magnitudeSquared.y;

    if (radiusSquared > ESCAPE_RADIUS_SQUARED) {
      escapedIteration = float(iteration);
      break;
    }
  }

  if (radiusSquared <= ESCAPE_RADIUS_SQUARED) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float smoothIteration = escapedIteration + 1.0 - log2(log2(max(radiusSquared, 1.000001)));
  float colorPosition = smoothIteration / mandelbrot64.iterationLimit;
  vec3 color = palette(colorPosition);
  color *= 0.55 + 0.45 * smoothstep(0.0, 1.0, colorPosition);

  fragColor = vec4(color, 1.0);
}
`;

const MANDELBROT64_FRAGMENT_WGSL = /* wgsl */ `\
struct Mandelbrot64Uniforms {
  resolution: vec2<f32>,
  centerX: vec2<f32>,
  centerY: vec2<f32>,
  pixelScale: vec2<f32>,
  aspectRatio: f32,
  time: f32,
  iterationLimit: f32,
};

@group(0) @binding(1) var<uniform> mandelbrot64 : Mandelbrot64Uniforms;

const MAX_ITERATIONS: i32 = 2048;
const ESCAPE_RADIUS_SQUARED: f32 = 256.0;
const TAU: f32 = 6.28318530718;

fn palette64(value: f32) -> vec3<f32> {
  let phase = vec3<f32>(0.18, 0.41, 0.73) + mandelbrot64.time * vec3<f32>(0.008, 0.012, 0.02);
  return 0.5 + 0.5 * cos(TAU * (value + phase));
}

@fragment
fn fragmentMain(inputs: FragmentOutput) -> @location(0) vec4<f32> {
  let centered = inputs.uv * 2.0 - vec2<f32>(1.0, 1.0);
  let offsetX = mul_fp64(
    vec2<f32>(centered.x * mandelbrot64.aspectRatio, 0.0),
    mandelbrot64.pixelScale
  );
  let offsetY = mul_fp64(vec2<f32>(centered.y, 0.0), mandelbrot64.pixelScale);
  let cx = sum_fp64(mandelbrot64.centerX, offsetX);
  let cy = sum_fp64(mandelbrot64.centerY, offsetY);
  var zx = vec2<f32>(0.0, 0.0);
  var zy = vec2<f32>(0.0, 0.0);

  var escapedIteration = mandelbrot64.iterationLimit;
  var radiusSquared = 0.0;

  for (var iteration: i32 = 0; iteration < MAX_ITERATIONS; iteration = iteration + 1) {
    if (f32(iteration) >= mandelbrot64.iterationLimit) {
      break;
    }

    let xSquared = mul_fp64(zx, zx);
    let ySquared = mul_fp64(zy, zy);
    let xy = mul_fp64(zx, zy);
    let nextX = sum_fp64(sub_fp64(xSquared, ySquared), cx);
    let nextY = sum_fp64(sum_fp64(xy, xy), cy);

    zx = nextX;
    zy = nextY;

    let magnitudeSquared = sum_fp64(mul_fp64(zx, zx), mul_fp64(zy, zy));
    radiusSquared = magnitudeSquared.x + magnitudeSquared.y;

    if (radiusSquared > ESCAPE_RADIUS_SQUARED) {
      escapedIteration = f32(iteration);
      break;
    }
  }

  if (radiusSquared <= ESCAPE_RADIUS_SQUARED) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }

  let smoothIteration =
    escapedIteration + 1.0 - log2(log2(max(radiusSquared, 1.000001)));
  let colorPosition = smoothIteration / mandelbrot64.iterationLimit;
  var color = palette64(colorPosition);
  color = color * (0.55 + 0.45 * smoothstep(0.0, 1.0, colorPosition));
  return vec4<f32>(color, 1.0);
}
`;

function getVisualizationSpecs(): VisualizationSpec[] {
  return [
    {
      clearColor: [0.02, 0.015, 0.04, 1],
      description:
        'Single-precision Mandelbrot fragment shader. The view starts on the Seahorse target and zooms in from there.',
      fragmentShaderGLSL: MANDELBROT32_FRAGMENT_SHADER,
      fragmentShaderWGSL: MANDELBROT32_FRAGMENT_WGSL,
      kind: 'fp32',
      title: 'Mandelbrot FP32'
    },
    {
      clearColor: [0.01, 0.015, 0.03, 1],
      description:
        'FP64 Mandelbrot fragment shader using the same zoom path, with center and scale split into hi/lo parts before upload.',
      fragmentShaderGLSL: MANDELBROT64_FRAGMENT_SHADER,
      fragmentShaderWGSL: MANDELBROT64_FRAGMENT_WGSL,
      kind: 'fp64',
      title: 'Mandelbrot FP64'
    }
  ];
}
