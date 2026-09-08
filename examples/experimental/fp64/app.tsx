// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';

import {luma, type Device, type PresentationContext} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {fp64arithmetic, type ShaderModule} from '@luma.gl/shadertools';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';
import type {SettingsChangeDescriptor, SettingsSchema} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting
} from '../../example-panels';
import {runFP64ComputeBenchmark, type FP64ComputeBenchmarkResult} from './fp64-compute-benchmark';
import {makeFP64ExampleLayout} from './app-ui';

type AppProps = {
  device?: Device | null;
  presentationDevice?: Device | null;
};

type AppState = {
  benchmarkError: string | null;
  benchmarkResults: FP64ComputeBenchmarkResult[] | null;
  fp64RenderTiming: FP64RenderTiming | null;
  initializationError: string | null;
  isBenchmarkRunning: boolean;
  isReady: boolean;
  renderWidth: number;
  selectedArithmeticMode: FP64ArithmeticMode;
  selectedBackend: RenderingBackend;
  selectedPresetId: ZoomPresetId;
  zoomDepth: number;
};

type RenderingBackend = 'auto' | 'webgl' | 'webgpu';
type FP64ArithmeticMode = 'classic' | 'hybrid' | 'integer';
type FP64RenderTimingSource = 'CPU encode' | 'GPU completion';

type FP64RenderTiming = {
  milliseconds: number;
  source: FP64RenderTimingSource;
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
  iterationLimit: number;
};

type Mandelbrot64Uniforms = {
  resolution: [number, number];
  centerX: [number, number];
  centerY: [number, number];
  pixelScale: [number, number];
  aspectRatio: number;
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
  timing: VisualizationTiming | null;
};

type VisualizationTiming = {
  destroyed: boolean;
  readPending: boolean;
  smoothedMilliseconds: number | null;
  source: FP64RenderTimingSource | null;
};

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 280;
// Keep the expensive Mandelbrot fragment passes bounded even when the canvas is displayed larger.
const DEFAULT_RENDER_WIDTH = 192;
const MIN_RENDER_WIDTH = 96;
const MAX_RENDER_WIDTH = 256;
const RENDER_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
const FIXED_ITERATION_LIMIT = 768;
const BASE_ITERATION_LIMIT = 160;
const ITERATION_GROWTH_PER_ZOOM = 18;
const RENDER_INTERVAL_MILLISECONDS = 50;
const FULLSCREEN_POSITIONS = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
const INITIAL_PIXEL_SCALE = 1.35;
const MIN_PIXEL_SCALE = 1e-12;
const MAX_ZOOM_DEPTH = Math.log2(INITIAL_PIXEL_SCALE / MIN_PIXEL_SCALE);
const RENDER_TIMING_SAMPLE_INTERVAL = 5;
const RENDER_TIMING_SMOOTHING = 0.2;
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
const FP64_SETTINGS_HOST_ID = 'fp64-settings-host';

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
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;

  constructor(props: AppProps) {
    super(props);

    this.state = {
      benchmarkError: null,
      benchmarkResults: null,
      fp64RenderTiming: null,
      initializationError: null,
      isBenchmarkRunning: false,
      isReady: false,
      renderWidth: DEFAULT_RENDER_WIDTH,
      selectedArithmeticMode: 'hybrid',
      selectedBackend: 'auto',
      selectedPresetId: DEFAULT_PRESET_ID,
      zoomDepth: 0
    };
    const hasExternalDevice = Boolean(props.device || props.presentationDevice);
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'fp64-settings',
      schema: makeFP64SettingsSchema(!hasExternalDevice),
      settings: {
        selectedArithmeticMode: 'hybrid',
        selectedBackend: 'auto',
        selectedPresetId: DEFAULT_PRESET_ID,
        renderWidth: DEFAULT_RENDER_WIDTH,
        zoomDepth: 0
      },
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({
      hostId: FP64_SETTINGS_HOST_ID,
      panel: this.settingsPanel.makePanel()
    });
  }

  override async componentDidMount(): Promise<void> {
    this.isComponentMounted = true;
    this.panels.mount();
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

    if (
      !this.props.device &&
      !this.props.presentationDevice &&
      previousState.selectedBackend !== this.state.selectedBackend
    ) {
      await this.initialize();
      return;
    }

    if (previousState.selectedArithmeticMode !== this.state.selectedArithmeticMode) {
      await this.initialize();
      return;
    }

    if (previousState.selectedPresetId !== this.state.selectedPresetId) {
      this.renderer?.setZoomPreset(ZOOM_PRESETS[this.state.selectedPresetId]);
    }

    if (previousState.zoomDepth !== this.state.zoomDepth) {
      this.renderer?.setZoomDepth(this.state.zoomDepth);
    }

    if (previousState.renderWidth !== this.state.renderWidth) {
      this.renderer?.setRenderWidth(this.state.renderWidth);
    }

    if (
      this.state.fp64RenderTiming &&
      (previousState.zoomDepth !== this.state.zoomDepth ||
        previousState.renderWidth !== this.state.renderWidth)
    ) {
      this.setState({fp64RenderTiming: null});
    }
  }

  override componentWillUnmount(): void {
    this.isComponentMounted = false;
    this.initializationGeneration++;
    this.panels.finalize();
    this.settingsPanel.finalize();
    this.destroyResources();
  }

  async initialize(): Promise<void> {
    const initializationGeneration = ++this.initializationGeneration;
    this.destroyResources();
    this.setState({
      benchmarkError: null,
      benchmarkResults: null,
      fp64RenderTiming: null,
      initializationError: null,
      isBenchmarkRunning: false,
      isReady: false
    });

    try {
      const canvases = this.canvasRefs.map(reference => reference.current);
      if (canvases.some(canvas => !canvas)) {
        throw new Error('Mandelbrot canvases were not mounted.');
      }

      const externalDevice = this.props.device || this.props.presentationDevice;
      const device = externalDevice || (await this.createOwnedDevice(this.state.selectedBackend));
      const renderer = new MultiCanvasRenderer(
        device,
        canvases as HTMLCanvasElement[],
        ZOOM_PRESETS[this.state.selectedPresetId],
        this.state.selectedArithmeticMode,
        this.state.zoomDepth,
        this.state.renderWidth,
        this.handleFP64RenderTiming
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
      this.setState({
        initializationError: error instanceof Error ? error.message : String(error),
        isReady: false
      });
    }
  }

  override render(): React.ReactNode {
    const {
      benchmarkError,
      benchmarkResults,
      fp64RenderTiming,
      initializationError,
      isBenchmarkRunning,
      isReady,
      renderWidth,
      selectedArithmeticMode,
      selectedPresetId,
      zoomDepth
    } = this.state;
    const selectedPreset = ZOOM_PRESETS[selectedPresetId];
    const currentZoomLabel = formatZoomScale(getPixelScale(zoomDepth));
    const visualizationSpecs = getVisualizationSpecs();

    return makeFP64ExampleLayout({
      benchmarkError,
      benchmarkResults,
      canvasHeight: CANVAS_HEIGHT,
      canvasRefs: this.canvasRefs,
      canvasWidth: CANVAS_WIDTH,
      device: this.device,
      initializationError,
      isBenchmarkRunning,
      isReady,
      onRunBenchmark: this.handleRunBenchmark,
      settingsHostId: FP64_SETTINGS_HOST_ID,
      visualizations: visualizationSpecs.map((visualization, index) => ({
        canvasRef: this.canvasRefs[index],
        description: visualization.description,
        kind: visualization.kind,
        overlayLines: getOverlayLines(
          selectedPreset,
          currentZoomLabel,
          visualization.kind,
          this.device,
          selectedArithmeticMode,
          fp64RenderTiming,
          renderWidth
        ),
        title: visualization.title
      }))
    });
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

  private async createOwnedDevice(selectedBackend: RenderingBackend): Promise<Device> {
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('This example requires OffscreenCanvas support.');
    }

    return await luma.createDevice({
      adapters: [webgpuAdapter, webgl2Adapter],
      type: selectedBackend === 'auto' ? 'best-available' : selectedBackend,
      featureLevel: 'best-available',
      createCanvasContext: {
        canvas: new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        autoResize: false,
        useDevicePixels: false
      }
    });
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const selectedPresetId = getChangedSetting(changedSettings, 'selectedPresetId')?.nextValue;
    const selectedBackend = getChangedSetting(changedSettings, 'selectedBackend')?.nextValue;
    const selectedArithmeticMode = getChangedSetting(
      changedSettings,
      'selectedArithmeticMode'
    )?.nextValue;
    const zoomDepth = getChangedSetting(changedSettings, 'zoomDepth')?.nextValue;
    const renderWidth = getChangedSetting(changedSettings, 'renderWidth')?.nextValue;
    if (
      isZoomPresetId(selectedPresetId) ||
      isRenderingBackend(selectedBackend) ||
      isFP64ArithmeticMode(selectedArithmeticMode) ||
      isZoomDepth(zoomDepth) ||
      isRenderWidth(renderWidth)
    ) {
      this.setState({
        selectedArithmeticMode: isFP64ArithmeticMode(selectedArithmeticMode)
          ? selectedArithmeticMode
          : this.state.selectedArithmeticMode,
        selectedBackend: isRenderingBackend(selectedBackend)
          ? selectedBackend
          : this.state.selectedBackend,
        renderWidth: isRenderWidth(renderWidth) ? renderWidth : this.state.renderWidth,
        selectedPresetId: isZoomPresetId(selectedPresetId)
          ? selectedPresetId
          : this.state.selectedPresetId,
        zoomDepth: isZoomDepth(zoomDepth) ? zoomDepth : this.state.zoomDepth
      });
    }
  };

  private handleFP64RenderTiming = (fp64RenderTiming: FP64RenderTiming): void => {
    if (this.isComponentMounted) {
      this.setState({fp64RenderTiming});
    }
  };

  private handleRunBenchmark = async (): Promise<void> => {
    const device = this.device;
    const renderer = this.renderer;
    if (!device || device.type !== 'webgpu' || this.state.isBenchmarkRunning) {
      return;
    }

    const initializationGeneration = this.initializationGeneration;
    renderer?.pause();
    this.setState({benchmarkError: null, benchmarkResults: null, isBenchmarkRunning: true});

    try {
      const benchmarkResults = await runFP64ComputeBenchmark(device);
      if (this.isReadyForInitialization(initializationGeneration)) {
        this.setState({benchmarkResults});
      }
    } catch (error) {
      if (this.isReadyForInitialization(initializationGeneration)) {
        this.setState({
          benchmarkError: error instanceof Error ? error.message : String(error)
        });
      }
    } finally {
      if (this.isReadyForInitialization(initializationGeneration) && this.renderer === renderer) {
        renderer?.start();
        this.setState({isBenchmarkRunning: false});
      }
    }
  };
}

export function makeFP64SettingsSchema(includeBackend = true): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'view',
        name: 'View',
        initiallyCollapsed: false,
        settings: [
          ...(includeBackend
            ? [
                {
                  name: 'selectedBackend',
                  label: 'Rendering backend',
                  description: 'Recreates the example on the selected graphics API.',
                  type: 'select' as const,
                  persist: 'none' as const,
                  options: [
                    {label: 'Auto (WebGPU preferred)', value: 'auto'},
                    {label: 'WebGPU', value: 'webgpu'},
                    {label: 'WebGL2', value: 'webgl'}
                  ]
                }
              ]
            : []),
          {
            name: 'selectedArithmeticMode',
            label: 'FP64 arithmetic',
            description:
              'WebGPU only. Classic is fastest, hybrid protects critical residuals, and integer is fully controlled but slow.',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Classic · fast', value: 'classic'},
              {label: 'Hybrid · balanced', value: 'hybrid'},
              {label: 'Integer · reliable', value: 'integer'}
            ]
          },
          {
            name: 'selectedPresetId',
            label: 'Zoom target',
            type: 'select',
            persist: 'none',
            options: Object.entries(ZOOM_PRESETS).map(([value, preset]) => ({
              label: preset.label,
              value
            }))
          },
          {
            name: 'zoomDepth',
            label: 'Zoom depth (powers of 2)',
            description: 'Scrub the same fixed zoom level in both precision views.',
            type: 'number',
            persist: 'none',
            min: 0,
            max: MAX_ZOOM_DEPTH,
            step: 0.1,
            sliderDebounceMs: 0
          },
          {
            name: 'renderWidth',
            label: 'Render-buffer width (pixels)',
            description:
              'Changes the bounded GPU fragment workload for both views without changing their CSS size.',
            type: 'number',
            persist: 'none',
            min: MIN_RENDER_WIDTH,
            max: MAX_RENDER_WIDTH,
            step: 20,
            sliderDebounceMs: 80
          }
        ]
      }
    ]
  };
}

function isZoomPresetId(value: unknown): value is ZoomPresetId {
  return value === 'seahorse' || value === 'elephant';
}

function isRenderingBackend(value: unknown): value is RenderingBackend {
  return value === 'auto' || value === 'webgl' || value === 'webgpu';
}

function isFP64ArithmeticMode(value: unknown): value is FP64ArithmeticMode {
  return value === 'classic' || value === 'hybrid' || value === 'integer';
}

function isZoomDepth(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRenderWidth(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
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
  readonly onFP64RenderTiming?: (timing: FP64RenderTiming) => void;
  readonly renderingOrder: VisualizationRenderer[];
  readonly visualizations: VisualizationRenderer[];

  animationFrame: number | null = null;
  frameIndex = 0;
  nextRenderTime = 0;
  isRunning = false;
  zoomDepth: number;
  zoomPreset: ZoomPreset;

  constructor(
    device: Device,
    canvases: HTMLCanvasElement[],
    zoomPreset: ZoomPreset,
    arithmeticMode: FP64ArithmeticMode,
    zoomDepth: number,
    renderWidth: number,
    onFP64RenderTiming?: (timing: FP64RenderTiming) => void
  ) {
    this.device = device;
    this.onFP64RenderTiming = onFP64RenderTiming;
    this.zoomDepth = zoomDepth;
    this.zoomPreset = zoomPreset;
    this.fullscreenBuffer = device.createBuffer({data: FULLSCREEN_POSITIONS});
    this.visualizations = getVisualizationSpecs().map((spec, index) => {
      try {
        return createVisualizationRenderer(
          device,
          canvases[index],
          this.fullscreenBuffer,
          spec,
          arithmeticMode,
          renderWidth
        );
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
          model: null,
          presentationContext: null,
          shaderInputs: null,
          spec,
          timing: null
        };
      }
    });
    this.renderingOrder = [
      ...this.visualizations.filter(visualization => visualization.spec.kind === 'fp64'),
      ...this.visualizations.filter(visualization => visualization.spec.kind === 'fp32')
    ];
  }

  start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.nextRenderTime = 0;
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  pause(): void {
    this.isRunning = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  destroy(): void {
    this.pause();

    for (const visualization of this.renderingOrder) {
      destroyVisualizationTiming(visualization.timing);
      visualization.model?.destroy();
      visualization.presentationContext?.destroy();
    }

    this.fullscreenBuffer.destroy();
  }

  setZoomPreset(zoomPreset: ZoomPreset): void {
    this.zoomPreset = zoomPreset;
  }

  setZoomDepth(zoomDepth: number): void {
    this.zoomDepth = zoomDepth;
    this.resetRenderTiming();
  }

  setRenderWidth(renderWidth: number): void {
    const boundedRenderWidth = clampRenderWidth(renderWidth);
    const renderHeight = getRenderHeight(boundedRenderWidth);
    for (const visualization of this.visualizations) {
      visualization.presentationContext?.setDrawingBufferSize(boundedRenderWidth, renderHeight);
    }
    this.resetRenderTiming();
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

  private resetRenderTiming(): void {
    for (const visualization of this.visualizations) {
      if (visualization.timing) {
        visualization.timing.smoothedMilliseconds = null;
        visualization.timing.source = null;
      }
    }
  }

  private animate = (time: number): void => {
    this.animationFrame = null;
    if (time < this.nextRenderTime) {
      this.scheduleNextFrame();
      return;
    }
    this.nextRenderTime = time + RENDER_INTERVAL_MILLISECONDS;
    const pixelScale = getPixelScale(this.zoomDepth);
    const sampleTiming = this.frameIndex % RENDER_TIMING_SAMPLE_INTERVAL === 0;

    for (const visualization of this.renderingOrder) {
      renderVisualization(
        this.device,
        visualization,
        pixelScale,
        this.zoomPreset,
        sampleTiming ? this.onFP64RenderTiming : undefined
      );
    }

    this.frameIndex++;
    const submittedWork = waitForSubmittedWork(this.device);
    if (submittedWork) {
      void submittedWork.then(this.scheduleNextFrame, this.scheduleNextFrame);
    } else {
      this.scheduleNextFrame();
    }
  };

  private scheduleNextFrame = (): void => {
    if (this.isRunning) {
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  };
}

function createVisualizationRenderer(
  device: Device,
  canvas: HTMLCanvasElement,
  buffer: ReturnType<Device['createBuffer']>,
  spec: VisualizationSpec,
  arithmeticMode: FP64ArithmeticMode,
  renderWidth: number
): VisualizationRenderer {
  renderWidth = clampRenderWidth(renderWidth);
  const presentationContext = device.createPresentationContext({
    canvas,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    autoResize: false,
    useDevicePixels: false
  });
  presentationContext.setDrawingBufferSize(renderWidth, getRenderHeight(renderWidth));

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
    defines: getVisualizationDefines(device, spec.kind, arithmeticMode),
    bufferLayout: [{name: 'position', format: 'float32x2'}],
    attributes: {
      position: buffer
    },
    vertexCount: 4,
    topology: 'triangle-strip',
    shaderInputs
  });

  return {
    error: null,
    model,
    presentationContext,
    shaderInputs,
    spec,
    timing: spec.kind === 'fp64' ? createVisualizationTiming() : null
  };
}

export function getVisualizationDefines(
  device: {info: Pick<Device['info'], 'gpu'>; type: Device['type']},
  kind: 'fp32' | 'fp64',
  arithmeticMode: FP64ArithmeticMode
): Record<string, boolean> {
  if (kind !== 'fp64' || device.type !== 'webgpu') {
    return {};
  }
  switch (arithmeticMode) {
    case 'classic':
      return {
        LUMA_FP64_HYBRID_ARITHMETIC: false,
        LUMA_FP64_INTEGER_ARITHMETIC: false
      };
    case 'hybrid':
      return {
        LUMA_FP64_HYBRID_ARITHMETIC: true,
        LUMA_FP64_INTEGER_ARITHMETIC: false
      };
    case 'integer':
      return {
        LUMA_FP64_HYBRID_ARITHMETIC: false,
        LUMA_FP64_INTEGER_ARITHMETIC: true
      };
  }
}

function renderVisualization(
  device: Device,
  visualization: VisualizationRenderer,
  pixelScale: number,
  zoomPreset: ZoomPreset,
  onFP64RenderTiming?: (timing: FP64RenderTiming) => void
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
  const scale = pixelScale;
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
        iterationLimit
      }
    });
  }

  visualization.model.updateShaderInputs();

  const timing = visualization.timing;
  const measureTiming = Boolean(onFP64RenderTiming && timing && !timing.readPending);
  const cpuStartTime = measureTiming ? performance.now() : 0;
  const renderPass = device.beginRenderPass({
    framebuffer,
    clearColor: visualization.spec.clearColor
  });

  visualization.model.draw(renderPass);
  renderPass.end();
  visualization.presentationContext.present();

  if (measureTiming && timing && onFP64RenderTiming) {
    const cpuMilliseconds = performance.now() - cpuStartTime;
    const submittedWork = waitForSubmittedWork(device);
    if (submittedWork) {
      readFP64CompletionTiming(timing, submittedWork, cpuStartTime, onFP64RenderTiming);
    } else {
      updateFP64RenderTiming(timing, cpuMilliseconds, 'CPU encode', onFP64RenderTiming);
    }
  }
}

function createVisualizationTiming(): VisualizationTiming {
  return {
    destroyed: false,
    readPending: false,
    smoothedMilliseconds: null,
    source: null
  };
}

function destroyVisualizationTiming(timing: VisualizationTiming | null): void {
  if (!timing) {
    return;
  }
  timing.destroyed = true;
}

function readFP64CompletionTiming(
  timing: VisualizationTiming,
  submittedWork: Promise<void>,
  startTime: number,
  onFP64RenderTiming: (timing: FP64RenderTiming) => void
): void {
  timing.readPending = true;
  void submittedWork
    .then(() => {
      updateFP64RenderTiming(
        timing,
        performance.now() - startTime,
        'GPU completion',
        onFP64RenderTiming
      );
    })
    .catch(() => {})
    .finally(() => {
      timing.readPending = false;
    });
}

function updateFP64RenderTiming(
  timing: VisualizationTiming,
  milliseconds: number,
  source: FP64RenderTimingSource,
  onFP64RenderTiming: (timing: FP64RenderTiming) => void
): void {
  if (timing.destroyed || !Number.isFinite(milliseconds) || milliseconds <= 0) {
    return;
  }
  timing.smoothedMilliseconds =
    timing.smoothedMilliseconds === null || timing.source !== source
      ? milliseconds
      : timing.smoothedMilliseconds * (1 - RENDER_TIMING_SMOOTHING) +
        milliseconds * RENDER_TIMING_SMOOTHING;
  timing.source = source;
  onFP64RenderTiming({milliseconds: timing.smoothedMilliseconds, source});
}

function split64(value: number): [number, number] {
  const highPart = Math.fround(value);
  const lowPart = value - highPart;
  return [highPart, lowPart];
}

function computeIterationLimit(pixelScale: number): number {
  const zoomDepth = Math.max(0, Math.log2(INITIAL_PIXEL_SCALE / pixelScale));
  return Math.min(
    FIXED_ITERATION_LIMIT,
    Math.round(BASE_ITERATION_LIMIT + zoomDepth * ITERATION_GROWTH_PER_ZOOM)
  );
}

function getPixelScale(zoomDepth: number): number {
  const clampedZoomDepth = Math.max(0, Math.min(MAX_ZOOM_DEPTH, zoomDepth));
  return INITIAL_PIXEL_SCALE * Math.pow(0.5, clampedZoomDepth);
}

function getRenderHeight(renderWidth: number): number {
  return Math.round(renderWidth / RENDER_ASPECT_RATIO);
}

function clampRenderWidth(renderWidth: number): number {
  return Math.max(MIN_RENDER_WIDTH, Math.min(MAX_RENDER_WIDTH, Math.round(renderWidth)));
}

function waitForSubmittedWork(device: Device): Promise<void> | null {
  if (device.type !== 'webgpu') {
    return null;
  }
  const queue = (device.handle as {queue?: {onSubmittedWorkDone?: () => Promise<void>}}).queue;
  return queue?.onSubmittedWorkDone?.() || null;
}

function formatZoomScale(pixelScale: number): string {
  return pixelScale.toExponential(3);
}

function getOverlayLines(
  zoomPreset: ZoomPreset,
  currentZoomLabel: string,
  kind: 'fp32' | 'fp64',
  device: Device | null,
  arithmeticMode: FP64ArithmeticMode,
  fp64RenderTiming: FP64RenderTiming | null,
  renderWidth: number
): string[] {
  const precisionLabel =
    device?.type === 'webgpu' ? `fp64 ${arithmeticMode}` : 'fp64 classic (WebGL2)';

  const overlayLines = [
    'mode = mandelbrot zoom',
    `target = ${zoomPreset.label}`,
    `x = ${zoomPreset.centerX}`,
    `y = ${zoomPreset.centerY}`,
    `scale = ${currentZoomLabel}`,
    `render buffer = ${renderWidth} × ${getRenderHeight(renderWidth)}`,
    `zoom = ${INITIAL_PIXEL_SCALE} -> ${MIN_PIXEL_SCALE}`,
    kind === 'fp32' ? 'precision = native fp32' : `precision = ${precisionLabel}`,
    'iterations = adaptive'
  ];
  if (kind === 'fp64') {
    overlayLines.push(
      fp64RenderTiming ? formatFP64RenderTiming(fp64RenderTiming) : 'fp64 render = sampling…'
    );
  }
  return overlayLines;
}

export function formatFP64RenderTiming(timing: FP64RenderTiming): string {
  const framesPerSecondEquivalent = 1000 / timing.milliseconds;
  const milliseconds =
    timing.milliseconds < 1 ? timing.milliseconds.toFixed(3) : timing.milliseconds.toFixed(2);
  return `fp64 ${timing.source} = ${milliseconds} ms · ${framesPerSecondEquivalent.toFixed(1)} FPS-equivalent`;
}

const mandelbrot32: ShaderModule<Mandelbrot32Uniforms> = {
  name: 'mandelbrot32',
  uniformTypes: {
    resolution: 'vec2<f32>',
    center: 'vec2<f32>',
    pixelScale: 'f32',
    aspectRatio: 'f32',
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
    iterationLimit: 'f32'
  }
};

const {
  FULLSCREEN_SOURCE,
  FULLSCREEN_VERTEX_SHADER,
  MANDELBROT32_FRAGMENT_SHADER,
  MANDELBROT32_FRAGMENT_WGSL,
  MANDELBROT64_FRAGMENT_SHADER,
  MANDELBROT64_FRAGMENT_WGSL
} = getShaderSources();

function getVisualizationSpecs(): VisualizationSpec[] {
  return [
    {
      clearColor: [0.02, 0.015, 0.04, 1],
      description:
        'Single-precision Mandelbrot fragment shader. Use the shared zoom slider to inspect the selected target.',
      fragmentShaderGLSL: MANDELBROT32_FRAGMENT_SHADER,
      fragmentShaderWGSL: MANDELBROT32_FRAGMENT_WGSL,
      kind: 'fp32',
      title: 'Mandelbrot FP32'
    },
    {
      clearColor: [0.01, 0.015, 0.03, 1],
      description:
        'FP64 Mandelbrot fragment shader using fp64arithmetic. On Apple WebGPU, hybrid mode uses integer-reconstructed high residuals and native low-term accumulation; the fully reliable integer path remains available in the benchmark.',
      fragmentShaderGLSL: MANDELBROT64_FRAGMENT_SHADER,
      fragmentShaderWGSL: MANDELBROT64_FRAGMENT_WGSL,
      kind: 'fp64',
      title: 'Mandelbrot FP64 (fp64arithmetic)'
    }
  ];
}

function getShaderSources() {
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
  float iterationLimit;
} mandelbrot32;

const int MAX_ITERATIONS = 1024;
const float ESCAPE_RADIUS_SQUARED = 256.0;
const float COLOR_FREQUENCY = 0.025;
const float TAU = 6.28318530718;

vec3 palette(float value) {
  vec3 phase = vec3(0.18, 0.41, 0.73);
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

  int iterationLimit = int(mandelbrot32.iterationLimit);
  for (int iteration = 0; iteration < MAX_ITERATIONS && iteration < iterationLimit; iteration++) {
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
  float colorPosition = smoothIteration * COLOR_FREQUENCY;
  vec3 color = palette(colorPosition);
  color *= 0.55 + 0.45 * smoothstep(0.0, 80.0, smoothIteration);

  fragColor = vec4(color, 1.0);
}
`;

  const MANDELBROT32_FRAGMENT_WGSL = /* wgsl */ `\
struct Mandelbrot32Uniforms {
  resolution: vec2<f32>,
  center: vec2<f32>,
  pixelScale: f32,
  aspectRatio: f32,
  iterationLimit: f32,
};

@group(0) @binding(auto) var<uniform> mandelbrot32 : Mandelbrot32Uniforms;

const MAX_ITERATIONS: i32 = 1024;
const ESCAPE_RADIUS_SQUARED: f32 = 256.0;
const COLOR_FREQUENCY: f32 = 0.025;
const TAU: f32 = 6.28318530718;

fn palette32(value: f32) -> vec3<f32> {
  let phase = vec3<f32>(0.18, 0.41, 0.73);
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

  let iterationLimit = i32(mandelbrot32.iterationLimit);
  for (var iteration: i32 = 0; iteration < MAX_ITERATIONS && iteration < iterationLimit; iteration = iteration + 1) {
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
  let colorPosition = smoothIteration * COLOR_FREQUENCY;
  var color = palette32(colorPosition);
  color = color * (0.55 + 0.45 * smoothstep(0.0, 80.0, smoothIteration));
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
  float iterationLimit;
} mandelbrot64;

const int MAX_ITERATIONS = 1024;
const float ESCAPE_RADIUS_SQUARED = 256.0;
const float COLOR_FREQUENCY = 0.025;
const float TAU = 6.28318530718;

vec3 palette(float value) {
  vec3 phase = vec3(0.18, 0.41, 0.73);
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

  int iterationLimit = int(mandelbrot64.iterationLimit);
  for (int iteration = 0; iteration < MAX_ITERATIONS && iteration < iterationLimit; iteration++) {
    vec2 xSquared = mul_fp64(zx, zx);
    vec2 ySquared = mul_fp64(zy, zy);
    vec2 xy = mul_fp64(zx, zy);
    vec2 nextX = sum_fp64(sub_fp64(xSquared, ySquared), cx);
    vec2 nextY = sum_fp64(sum_fp64(xy, xy), cy);

    zx = nextX;
    zy = nextY;

    // The high terms are sufficient for the bailout threshold and avoid two fp64 multiplies.
    radiusSquared = dot(vec2(nextX.x, nextY.x), vec2(nextX.x, nextY.x));

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
  float colorPosition = smoothIteration * COLOR_FREQUENCY;
  vec3 color = palette(colorPosition);
  color *= 0.55 + 0.45 * smoothstep(0.0, 80.0, smoothIteration);

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
  iterationLimit: f32,
};

@group(0) @binding(auto) var<uniform> mandelbrot64 : Mandelbrot64Uniforms;

const MAX_ITERATIONS: i32 = 1024;
const ESCAPE_RADIUS_SQUARED: f32 = 256.0;
const COLOR_FREQUENCY: f32 = 0.025;
const TAU: f32 = 6.28318530718;

fn palette64(value: f32) -> vec3<f32> {
  let phase = vec3<f32>(0.18, 0.41, 0.73);
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

  let iterationLimit = i32(mandelbrot64.iterationLimit);
  for (var iteration: i32 = 0; iteration < MAX_ITERATIONS && iteration < iterationLimit; iteration = iteration + 1) {
    let xSquared = mul_fp64(zx, zx);
    let ySquared = mul_fp64(zy, zy);
    let xy = mul_fp64(zx, zy);
    let nextX = sum_fp64(sub_fp64(xSquared, ySquared), cx);
    let nextY = sum_fp64(sum_fp64(xy, xy), cy);

    zx = nextX;
    zy = nextY;

    // The high terms are sufficient for the bailout threshold and avoid two fp64 multiplies.
    radiusSquared = dot(vec2<f32>(nextX.x, nextY.x), vec2<f32>(nextX.x, nextY.x));

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
  let colorPosition = smoothIteration * COLOR_FREQUENCY;
  var color = palette64(colorPosition);
  color = color * (0.55 + 0.45 * smoothstep(0.0, 80.0, smoothIteration));
  return vec4<f32>(color, 1.0);
}
`;

  return {
    FULLSCREEN_SOURCE,
    FULLSCREEN_VERTEX_SHADER,
    MANDELBROT32_FRAGMENT_SHADER,
    MANDELBROT32_FRAGMENT_WGSL,
    MANDELBROT64_FRAGMENT_SHADER,
    MANDELBROT64_FRAGMENT_WGSL
  } as const;
}
