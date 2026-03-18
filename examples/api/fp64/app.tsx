// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';

import {luma, type Device, type PresentationContext} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {webgl2Adapter} from '@luma.gl/webgl';
import {fp64arithmeticShader} from '../../../modules/shadertools/src/modules/math/fp64/fp64-arithmetic-glsl';

type AppState = {
  initializationError: string | null;
  isReady: boolean;
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

type FP64ArithmeticUniforms = {
  ONE: number;
};

type VisualizationSpec = {
  clearColor: [number, number, number, number];
  description: string;
  fragmentShaderGLSL: string;
  kind: 'fp32' | 'fp64';
  title: string;
};

type VisualizationRenderer = {
  model: Model;
  presentationContext: PresentationContext;
  shaderInputs: ShaderInputs<any>;
  spec: VisualizationSpec;
};

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 280;
const FIXED_ITERATION_LIMIT = 1400;
const FULLSCREEN_POSITIONS = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
const TARGET_CENTER_X = -0.743643887037151;
const TARGET_CENTER_Y = 0.13182590420533;
const INITIAL_PIXEL_SCALE = 1.35;
const MIN_PIXEL_SCALE = 1e-12;
const ZOOM_RATE = 1.2;
const ZOOM_CYCLE_DURATION = Math.log2(INITIAL_PIXEL_SCALE / MIN_PIXEL_SCALE) / ZOOM_RATE;
const EXPERIMENT_OVERLAY_LINES = [
  'mode = mandelbrot zoom',
  `target x = ${TARGET_CENTER_X}`,
  `target y = ${TARGET_CENTER_Y}`,
  `zoom = ${INITIAL_PIXEL_SCALE} -> ${MIN_PIXEL_SCALE}`,
  'iterations = adaptive'
];

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

const fp64arithmeticFragmentModule: ShaderModule<{}, FP64ArithmeticUniforms> = {
  name: 'fp64arithmetic',
  fs: fp64arithmeticShader,
  defaultUniforms: {
    ONE: 1.0
  },
  uniformTypes: {
    ONE: 'f32'
  }
};

const mandelbrot64: ShaderModule<Mandelbrot64Uniforms> = {
  name: 'mandelbrot64',
  dependencies: [fp64arithmeticFragmentModule],
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

const MANDELBROT32_TITLE = 'Mandelbrot FP32';
const MANDELBROT32_DESCRIPTION =
  'Single-precision Mandelbrot fragment shader. The view starts on the Seahorse target and zooms in from there.';
const MANDELBROT32_CLEAR_COLOR: [number, number, number, number] = [0.02, 0.015, 0.04, 1];
const MANDELBROT64_TITLE = 'Mandelbrot FP64';
const MANDELBROT64_DESCRIPTION =
  'FP64 Mandelbrot fragment shader using the same zoom path, with center and scale split into hi/lo parts before upload.';
const MANDELBROT64_CLEAR_COLOR: [number, number, number, number] = [0.01, 0.015, 0.03, 1];

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

const VISUALIZATIONS: VisualizationSpec[] = [
  {
    clearColor: MANDELBROT32_CLEAR_COLOR,
    description: MANDELBROT32_DESCRIPTION,
    fragmentShaderGLSL: MANDELBROT32_FRAGMENT_SHADER,
    kind: 'fp32',
    title: MANDELBROT32_TITLE
  },
  {
    clearColor: MANDELBROT64_CLEAR_COLOR,
    description: MANDELBROT64_DESCRIPTION,
    fragmentShaderGLSL: MANDELBROT64_FRAGMENT_SHADER,
    kind: 'fp64',
    title: MANDELBROT64_TITLE
  }
];

export default class App extends React.PureComponent<Record<string, never>, AppState> {
  readonly canvasRefs = [
    React.createRef<HTMLCanvasElement>(),
    React.createRef<HTMLCanvasElement>()
  ];

  device: Device | null = null;
  renderer: MultiCanvasRenderer | null = null;
  private initializationGeneration = 0;
  private isComponentMounted = false;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      initializationError: null,
      isReady: false
    };
  }

  override async componentDidMount(): Promise<void> {
    this.isComponentMounted = true;
    await this.initialize();
  }

  override componentWillUnmount(): void {
    this.isComponentMounted = false;
    this.initializationGeneration++;
    this.destroyResources();
  }

  async initialize(): Promise<void> {
    const initializationGeneration = ++this.initializationGeneration;
    this.destroyResources();
    this.setState({initializationError: null, isReady: false});

    try {
      const canvases = this.canvasRefs.map(reference => reference.current);
      if (canvases.some(canvas => !canvas)) {
        throw new Error('Mandelbrot canvases were not mounted.');
      }

      const device = await this.createOwnedDevice();
      const renderer = new MultiCanvasRenderer(device, canvases as HTMLCanvasElement[]);

      if (!this.isReadyForInitialization(initializationGeneration)) {
        renderer.destroy();
        device.destroy();
        return;
      }

      this.device = device;
      this.renderer = renderer;
      this.renderer.start();

      if (!this.isReadyForInitialization(initializationGeneration)) {
        this.destroyResources();
        return;
      }

      this.setState({initializationError: null, isReady: true});
    } catch (error) {
      this.setState({
        initializationError: error instanceof Error ? error.message : String(error),
        isReady: false
      });
    }
  }

  override render(): React.ReactNode {
    const {initializationError, isReady} = this.state;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: 20
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
          {VISUALIZATIONS.map(visualization => (
            <ExamplePaneCopy
              description={visualization.description}
              key={`${visualization.kind}-copy`}
              title={visualization.title}
            />
          ))}
          {this.canvasRefs.map((canvasRef, index) => (
            <ExamplePaneCanvas
              canvasRef={canvasRef}
              isReady={isReady}
              key={`${VISUALIZATIONS[index].kind}-canvas`}
              overlayLines={EXPERIMENT_OVERLAY_LINES}
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
    this.device?.destroy();
    this.device = null;
  }

  private async createOwnedDevice(): Promise<Device> {
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('This example requires OffscreenCanvas support.');
    }

    return await luma.createDevice({
      adapters: [webgl2Adapter],
      type: 'webgl',
      createCanvasContext: {
        canvas: new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        autoResize: false,
        useDevicePixels: false
      }
    });
  }
}

export function renderToDOM(container: HTMLElement): () => void {
  const root: Root = createRoot(container);
  root.render(<App />);

  return () => {
    root.unmount();
  };
}

class MultiCanvasRenderer {
  readonly device: Device;
  readonly fullscreenBuffer: ReturnType<Device['createBuffer']>;
  readonly visualizations: VisualizationRenderer[];

  animationFrame: number | null = null;
  startTime = 0;

  constructor(device: Device, canvases: HTMLCanvasElement[]) {
    this.device = device;
    this.fullscreenBuffer = device.createBuffer({data: FULLSCREEN_POSITIONS});
    this.visualizations = VISUALIZATIONS.map((spec, index) =>
      createVisualizationRenderer(device, canvases[index], this.fullscreenBuffer, spec)
    );
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
      visualization.model.destroy();
      visualization.presentationContext.destroy();
    }

    this.fullscreenBuffer.destroy();
  }

  private animate = (timestamp: number): void => {
    const time = (timestamp - this.startTime) / 1000;

    for (const visualization of this.visualizations) {
      renderVisualization(this.device, visualization, time);
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
          fp64arithmetic: fp64arithmeticFragmentModule,
          mandelbrot64
        })
      : new ShaderInputs({
          mandelbrot32
        });

  const model = new Model(device, {
    id: `${spec.kind}-mandelbrot-model`,
    source: FULLSCREEN_SOURCE,
    vs: FULLSCREEN_VERTEX_SHADER,
    fs: spec.fragmentShaderGLSL,
    modules: spec.kind === 'fp64' ? [mandelbrot64, fp64arithmeticFragmentModule] : [mandelbrot32],
    bufferLayout: [{name: 'position', format: 'float32x2'}],
    attributes: {
      position: buffer
    },
    vertexCount: 4,
    topology: 'triangle-strip',
    shaderInputs
  });

  return {model, presentationContext, shaderInputs, spec};
}

function renderVisualization(
  device: Device,
  visualization: VisualizationRenderer,
  elapsedTime: number
): void {
  const framebuffer = visualization.presentationContext.getCurrentFramebuffer({
    depthStencilFormat: false
  });
  const [width, height] = visualization.presentationContext.getDrawingBufferSize();
  const aspectRatio = width / Math.max(height, 1);
  const cycleTime = elapsedTime % ZOOM_CYCLE_DURATION;
  const centerX = TARGET_CENTER_X;
  const centerY = TARGET_CENTER_Y;
  const scale = INITIAL_PIXEL_SCALE * Math.pow(0.5, cycleTime * ZOOM_RATE);
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

function ExamplePaneCopy(props: {description: string; title: string}): React.ReactNode {
  const {description, title} = props;

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
