// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';

import {luma, type Device, type PresentationContext} from '@luma.gl/core';
import {
  AnimationLoop,
  AnimationLoopTemplate,
  type AnimationProps,
  makeAnimationLoop,
  Model,
  ShaderInputs
} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

export type DeviceType = 'webgl' | 'webgpu';

type AppProps = {
  deviceType?: DeviceType;
  device?: Device | null;
  presentationDevice?: Device | null;
};

type AppState = {
  initializationError: string | null;
  isReady: boolean;
};

type AppUniforms = {
  resolution: [number, number];
  time: number;
  speed: number;
};

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 280;

// React components

export default class App extends React.PureComponent<AppProps, AppState> {
  static defaultProps = {
    deviceType: 'webgl' as DeviceType
  };

  readonly canvasRefs = [
    React.createRef<HTMLCanvasElement>(),
    React.createRef<HTMLCanvasElement>()
  ];

  device: Device | null = null;
  animationLoop: AnimationLoop | null = null;
  private initializationGeneration = 0;
  private isComponentMounted = false;

  constructor(props: AppProps) {
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

  override async componentDidUpdate(previousProps: AppProps): Promise<void> {
    if (
      previousProps.device !== this.props.device ||
      previousProps.presentationDevice !== this.props.presentationDevice ||
      (!this.props.device &&
        !this.props.presentationDevice &&
        previousProps.deviceType !== this.props.deviceType)
    ) {
      await this.initialize();
    }
  }

  override componentWillUnmount(): void {
    this.isComponentMounted = false;
    this.initializationGeneration++;
    this.destroyResources();
  }

  async initialize(): Promise<void> {
    const {deviceType = 'webgl'} = this.props;
    const initializationGeneration = ++this.initializationGeneration;
    this.destroyResources();
    this.setState({initializationError: null, isReady: false});

    try {
      const canvases = this.canvasRefs.map(ref => ref.current);
      if (canvases.some(canvas => !canvas)) {
        throw new Error('Multi-context canvases were not mounted.');
      }

      const providedDevice = this.props.device || this.props.presentationDevice || null;
      if (!providedDevice && typeof OffscreenCanvas === 'undefined') {
        throw new Error('This example requires OffscreenCanvas support.');
      }
      const device =
        providedDevice ||
        (await luma.createDevice({
          adapters: [webgl2Adapter, webgpuAdapter],
          type: deviceType,
          createCanvasContext: {
            canvas: new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT),
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            autoResize: false,
            useDevicePixels: false
          }
        }));
      multiCanvasAnimationLoopCanvases = canvases as HTMLCanvasElement[];
      const animationLoop = makeAnimationLoop(MultiCanvasAnimationLoopTemplate, {device});

      if (!this.isReadyForInitialization(initializationGeneration)) {
        animationLoop.destroy();
        if (!providedDevice) {
          device.destroy();
        }
        return;
      }

      this.device = device;
      this.animationLoop = animationLoop;
      this.animationLoop.start();

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

  destroyResources(): void {
    this.animationLoop?.destroy();
    this.animationLoop = null;
    if (!this.props.device && !this.props.presentationDevice) {
      this.device?.destroy();
    }
    this.device = null;
  }

  private isReadyForInitialization(initializationGeneration: number): boolean {
    return this.isComponentMounted && this.initializationGeneration === initializationGeneration;
  }

  override render(): React.ReactNode {
    const {initializationError, isReady} = this.state;

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
          <ExamplePaneCopy
            description={CONCENTRIC_WAVES_DESCRIPTION}
            title={CONCENTRIC_WAVES_TITLE}
          />
          <ExamplePaneCopy description={ANIMATED_NOISE_DESCRIPTION} title={ANIMATED_NOISE_TITLE} />
          <ExamplePaneCanvas canvasRef={this.canvasRefs[0]} isReady={isReady} />
          <ExamplePaneCanvas canvasRef={this.canvasRefs[1]} isReady={isReady} />
        </div>
      </div>
    );
  }
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
}): React.ReactNode {
  const {canvasRef, isReady} = props;

  return (
    <div
      style={{
        minWidth: 0,
        width: '100%'
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
    </div>
  );
}

export function renderToDOM(
  container: HTMLElement,
  props: {deviceType?: DeviceType; device?: Device | null; presentationDevice?: Device | null} = {}
): () => void {
  const root: Root = createRoot(container);
  root.render(<App {...props} />);

  return () => {
    root.unmount();
  };
}

// luma.gl

type VisualizationSpec = {
  title: string;
  description: string;
  clearColor: [number, number, number, number];
  fragmentShaderWGSL: string;
  fragmentShaderGLSL: string;
  speed: number;
};

type VisualizationRenderer = {
  buffer: ReturnType<Device['createBuffer']>;
  model: Model;
  presentationContext: PresentationContext;
  shaderInputs: ShaderInputs<{app: typeof app.props}>;
  spec: VisualizationSpec;
};

class MultiCanvasAnimationLoopTemplate extends AnimationLoopTemplate {
  readonly device: Device;
  readonly fullscreenBuffer: ReturnType<Device['createBuffer']>;
  readonly visualizations: VisualizationRenderer[];

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.fullscreenBuffer = device.createBuffer({data: FULLSCREEN_POSITIONS});
    this.visualizations = getVisualizationSpecs().map((spec, index) => {
      const shaderInputs = new ShaderInputs<{app: typeof app.props}>({
        app
      });
      const presentationContext = device.createPresentationContext({
        canvas: multiCanvasAnimationLoopCanvases[index],
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        autoResize: false,
        useDevicePixels: false
      });
      const model = createFullscreenModel(device, {
        buffer: this.fullscreenBuffer,
        fragmentShaderWGSL: spec.fragmentShaderWGSL,
        fragmentShaderGLSL: spec.fragmentShaderGLSL,
        id: `${spec.title.toLowerCase().replace(/\s+/g, '-')}-model`,
        shaderInputs
      });

      return {
        buffer: this.fullscreenBuffer,
        model,
        presentationContext,
        shaderInputs,
        spec
      };
    });
  }

  override onFinalize(): void {
    for (const visualization of this.visualizations) {
      visualization.model.destroy();
      visualization.presentationContext.destroy();
    }

    this.fullscreenBuffer.destroy();
  }

  override onRender({device, time}: AnimationProps): void {
    const elapsedSeconds = time / 1000;

    for (const visualization of this.visualizations) {
      const framebuffer = visualization.presentationContext.getCurrentFramebuffer({
        depthStencilFormat: false
      });
      const [width, height] = visualization.presentationContext.getDrawingBufferSize();

      visualization.shaderInputs.setProps({
        app: {
          resolution: [width, height],
          time: elapsedSeconds,
          speed: visualization.spec.speed
        }
      });
      visualization.model.updateShaderInputs();

      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: visualization.spec.clearColor
      });

      visualization.model.draw(renderPass);
      renderPass.end();
      visualization.presentationContext.present();
    }
  }
}

let multiCanvasAnimationLoopCanvases: HTMLCanvasElement[] = [];

const FULLSCREEN_POSITIONS = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);

const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    resolution: 'vec2<f32>',
    time: 'f32',
    speed: 'f32'
  }
};

const CONCENTRIC_WAVES_TITLE = 'Concentric Waves';
const CONCENTRIC_WAVES_DESCRIPTION =
  'A radial shader rendered into its own PresentationContext-backed canvas.';
const CONCENTRIC_WAVES_CLEAR_COLOR: [number, number, number, number] = [0.02, 0.03, 0.05, 1];
const CONCENTRIC_WAVES_SPEED = 1.0;
const CONCENTRIC_WAVES_FRAGMENT_WGSL = /* wgsl */ `\
@fragment
fn fragmentMain(inputs: FragmentOutput) -> @location(0) vec4<f32> {
  var centered = inputs.uv * 2.0 - vec2<f32>(1.0, 1.0);
  centered.x *= app.resolution.x / max(app.resolution.y, 1.0);

  let radius = length(centered);
  let angle = atan2(centered.y, centered.x);
  let rings = 0.5 + 0.5 * cos(28.0 * radius - app.time * 5.0 * app.speed);
  let spokes = 0.5 + 0.5 * sin(6.0 * angle + app.time * 2.5 * app.speed);
  let vignette = smoothstep(1.15, 0.2, radius);

  var color = mix(vec3<f32>(0.08, 0.12, 0.18), vec3<f32>(1.0, 0.64, 0.18), rings);
  color = mix(color, vec3<f32>(0.14, 0.7, 1.0), 0.35 * spokes);

  return vec4<f32>(color * vignette, 1.0);
}
`;
const CONCENTRIC_WAVES_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

layout(std140) uniform appUniforms {
  vec2 resolution;
  float time;
  float speed;
} app;

void main(void) {
  vec2 centered = vUV * 2.0 - vec2(1.0);
  centered.x *= app.resolution.x / max(app.resolution.y, 1.0);

  float radius = length(centered);
  float angle = atan(centered.y, centered.x);
  float rings = 0.5 + 0.5 * cos(28.0 * radius - app.time * 5.0 * app.speed);
  float spokes = 0.5 + 0.5 * sin(6.0 * angle + app.time * 2.5 * app.speed);
  float vignette = smoothstep(1.15, 0.2, radius);

  vec3 color = mix(vec3(0.08, 0.12, 0.18), vec3(1.0, 0.64, 0.18), rings);
  color = mix(color, vec3(0.14, 0.7, 1.0), 0.35 * spokes);

  fragColor = vec4(color * vignette, 1.0);
}
`;

const ANIMATED_NOISE_TITLE = 'Animated Noise';
const ANIMATED_NOISE_DESCRIPTION =
  'A second visualization presented through a different PresentationContext on the same Device.';
const ANIMATED_NOISE_CLEAR_COLOR: [number, number, number, number] = [0.01, 0.02, 0.02, 1];
const ANIMATED_NOISE_SPEED = 1.4;
const ANIMATED_NOISE_FRAGMENT_WGSL = /* wgsl */ `\
fn hash(point: vec2<f32>) -> f32 {
  return fract(sin(dot(point, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

fn noise(point: vec2<f32>) -> f32 {
  let cell = floor(point);
  let local = fract(point);
  let blend = local * local * (3.0 - 2.0 * local);

  let a = hash(cell);
  let b = hash(cell + vec2<f32>(1.0, 0.0));
  let c = hash(cell + vec2<f32>(0.0, 1.0));
  let d = hash(cell + vec2<f32>(1.0, 1.0));

  let x1 = mix(a, b, blend.x);
  let x2 = mix(c, d, blend.x);
  return mix(x1, x2, blend.y);
}

@fragment
fn fragmentMain(inputs: FragmentOutput) -> @location(0) vec4<f32> {
  let scaledUv = inputs.uv * (app.resolution / 120.0);
  let drift = vec2<f32>(app.time * 0.28 * app.speed, app.time * 0.18 * app.speed);
  let grain = noise(scaledUv + drift);
  let scan = 0.5 + 0.5 * sin((inputs.uv.y + app.time * 0.03 * app.speed) * app.resolution.y * 0.12);

  let baseColor = mix(vec3<f32>(0.04, 0.05, 0.05), vec3<f32>(0.18, 0.95, 0.72), grain);
  let color = baseColor * (0.55 + 0.45 * scan);
  return vec4<f32>(color, 1.0);
}
`;
const ANIMATED_NOISE_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

layout(std140) uniform appUniforms {
  vec2 resolution;
  float time;
  float speed;
} app;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);

  float a = hash(cell);
  float b = hash(cell + vec2(1.0, 0.0));
  float c = hash(cell + vec2(0.0, 1.0));
  float d = hash(cell + vec2(1.0, 1.0));

  float x1 = mix(a, b, blend.x);
  float x2 = mix(c, d, blend.x);
  return mix(x1, x2, blend.y);
}

void main(void) {
  vec2 scaledUv = vUV * (app.resolution / 120.0);
  vec2 drift = vec2(app.time * 0.28 * app.speed, app.time * 0.18 * app.speed);
  float grain = noise(scaledUv + drift);
  float scan = 0.5 + 0.5 * sin((vUV.y + app.time * 0.03 * app.speed) * app.resolution.y * 0.12);

  vec3 baseColor = mix(vec3(0.04, 0.05, 0.05), vec3(0.18, 0.95, 0.72), grain);
  vec3 color = baseColor * (0.55 + 0.45 * scan);
  fragColor = vec4(color, 1.0);
}
`;

const FULLSCREEN_SOURCE = /* wgsl */ `\
struct AppUniforms {
  resolution: vec2<f32>,
  time: f32,
  speed: f32,
};

@group(0) @binding(0) var<uniform> app : AppUniforms;

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

function getVisualizationSpecs(): VisualizationSpec[] {
  return [
    {
      title: CONCENTRIC_WAVES_TITLE,
      description: CONCENTRIC_WAVES_DESCRIPTION,
      clearColor: CONCENTRIC_WAVES_CLEAR_COLOR,
      fragmentShaderWGSL: CONCENTRIC_WAVES_FRAGMENT_WGSL,
      fragmentShaderGLSL: CONCENTRIC_WAVES_FRAGMENT_GLSL,
      speed: CONCENTRIC_WAVES_SPEED
    },
    {
      title: ANIMATED_NOISE_TITLE,
      description: ANIMATED_NOISE_DESCRIPTION,
      clearColor: ANIMATED_NOISE_CLEAR_COLOR,
      fragmentShaderWGSL: ANIMATED_NOISE_FRAGMENT_WGSL,
      fragmentShaderGLSL: ANIMATED_NOISE_FRAGMENT_GLSL,
      speed: ANIMATED_NOISE_SPEED
    }
  ];
}

function createFullscreenModel(
  device: Device,
  props: {
    buffer: ReturnType<Device['createBuffer']>;
    fragmentShaderGLSL: string;
    fragmentShaderWGSL: string;
    id: string;
    shaderInputs: ShaderInputs<{app: typeof app.props}>;
  }
): Model {
  return new Model(device, {
    id: props.id,
    source: `${FULLSCREEN_SOURCE}\n${props.fragmentShaderWGSL}`,
    vs: FULLSCREEN_VERTEX_SHADER,
    fs: props.fragmentShaderGLSL,
    bufferLayout: [{name: 'position', format: 'float32x2'}],
    attributes: {
      position: props.buffer
    },
    vertexCount: 4,
    topology: 'triangle-strip',
    shaderInputs: props.shaderInputs
  });
}
