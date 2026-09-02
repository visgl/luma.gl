// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  Model,
  OrbitControls,
  ShaderInputs,
  ShaderPassRenderer,
  type AnimationProps,
  type ShaderPassRendererRenderOptions
} from '@luma.gl/engine';
import {createBloomCompositeShaderPass, toneMapping} from '@luma.gl/effects';
import {SpectralOceanSimulation} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {
  getTempestOceanSunDirection,
  TEMPEST_OCEAN_CAMERA_PROPS,
  TEMPEST_OCEAN_FIELD_OF_VIEW_DEGREES
} from './tempest-ocean-camera';
import {makeTempestOceanGridPlan, type TempestOceanGridPlan} from './tempest-ocean-grid';
import {TEMPEST_OCEAN_SKY_SHADER, TEMPEST_OCEAN_SURFACE_SHADER} from './tempest-ocean-shaders';
import {
  makeTempestOceanHDRScreenshot,
  type TempestOceanHDRScreenshot
} from './tempest-ocean-capture';
import {TempestOceanAudio, type TempestOceanAudioStatus} from './tempest-ocean-audio';

const DEFAULT_SIMULATION_RESOLUTION = 128;
const DEFAULT_GRID_RESOLUTION = 145;
const DEFAULT_TILE_COUNT = 3;
const DEFAULT_PATCH_SIZE = 360;
const DEFAULT_STORM_INTENSITY = 0.82;
const MAXIMUM_DELTA_TIME_SECONDS = 1 / 30;
const HIGH_DYNAMIC_RANGE_MAXIMUM_LUMINANCE = 5.5;
const STANDARD_DYNAMIC_RANGE_MAXIMUM_LUMINANCE = 1;
const NEAR_PLANE = 0.1;
const FAR_PLANE = 1_400;

type TempestOceanSceneUniforms = {
  viewProjectionMatrix: Matrix4;
  inverseViewProjectionMatrix: Matrix4;
  cameraAndTime: readonly [number, number, number, number];
  sunAndStorm: readonly [number, number, number, number];
  surface: readonly [number, number, number, number];
};

const tempestOceanScene: ShaderModule<TempestOceanSceneUniforms> = {
  name: 'tempestOceanScene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    inverseViewProjectionMatrix: 'mat4x4<f32>',
    cameraAndTime: 'vec4<f32>',
    sunAndStorm: 'vec4<f32>',
    surface: 'vec4<f32>'
  }
};

type TempestOceanSceneTarget = {
  readonly width: number;
  readonly height: number;
  readonly texture: Texture;
  readonly framebuffer: Framebuffer;
};

type TempestOceanCaptureRequest = {
  promise: Promise<TempestOceanHDRScreenshot>;
  resolve: (capture: TempestOceanHDRScreenshot) => void;
  reject: (reason?: unknown) => void;
  encoded: boolean;
};

type TempestOceanCaptureReadback = {
  buffer: Buffer;
  byteLength: number;
  bytesPerRow: number;
};

/** Optional lower-cost dimensions used by focused WebGPU tests and embedders. */
export type TempestOceanExampleProps = Pick<AnimationProps, 'device' | 'width' | 'height'> & {
  simulationResolution?: number;
  gridResolution?: number;
  tileCount?: number;
  patchSize?: number;
  stormIntensity?: number;
};

const INFO_HTML = `
<style>
  .tempest-ocean-info { font: 13px/1.45 system-ui, sans-serif; }
  .tempest-ocean-info p { margin: 0; color: inherit; opacity: .82; }
  .tempest-ocean-info strong { color: #fff2c8; }
  .tempest-ocean-controls { margin-top: 10px; color: #e2f4ff; font-size: 12px; }
  .tempest-ocean-badges { display: flex; gap: 7px; margin-top: 11px; flex-wrap: wrap; }
  .tempest-ocean-badge { padding: 4px 7px; border: 1px solid rgb(120 205 255 / 24%); border-radius: 99px; background: rgb(22 91 132 / 20%); color: #daf3ff; font-size: 10px; letter-spacing: .05em; text-transform: uppercase; }
</style>
<section class="tempest-ocean-info">
  <p>A reusable <strong>GPUFFT2D spectral field</strong> physically displaces this raster surface. Live normals and Jacobian whitecaps drive the HDR water material without CPU readback.</p>
  <div class="tempest-ocean-controls">Drag to orbit · wheel to zoom · <strong>C</strong> cinematic · <strong>P</strong> pause waves · <strong>R</strong> deterministic reset · <strong>M</strong> mute sound · <span data-tempest-state>cinematic · running</span> · <span data-tempest-audio-state>sound waiting for a gesture</span></div>
  <div class="tempest-ocean-badges"><span class="tempest-ocean-badge">WebGPU compute</span><span class="tempest-ocean-badge">Storage-buffer surface</span><span class="tempest-ocean-badge">HDR sunbreak</span></div>
</section>`;

/** Cinematic HDR renderer that consumes {@link SpectralOceanSimulation} without owning submission. */
export default class TempestOceanAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  readonly device: Device;
  readonly simulation: SpectralOceanSimulation;
  readonly gridPlan: TempestOceanGridPlan;
  readonly skyModel: Model;
  readonly oceanModel: Model;
  readonly postprocessingRenderer: ShaderPassRenderer;
  readonly simulationResolution: number;
  readonly patchSize: number;
  readonly stormIntensity: number;

  sceneTarget: TempestOceanSceneTarget;
  orbitControls: OrbitControls | null = null;

  private readonly skyShaderInputs = new ShaderInputs({tempestOceanScene});
  private readonly oceanShaderInputs = new ShaderInputs({tempestOceanScene});
  private readonly oceanAudio = new TempestOceanAudio();
  private canvas: HTMLCanvasElement | null = null;
  private previousTimeMilliseconds: number | null = null;
  private simulationTimeSeconds = 0;
  private paused = false;
  private cinematicCamera = true;
  private resetRequested = true;
  private captureRequest: TempestOceanCaptureRequest | null = null;
  private finalized = false;

  constructor({
    device,
    width,
    height,
    simulationResolution = DEFAULT_SIMULATION_RESOLUTION,
    gridResolution = DEFAULT_GRID_RESOLUTION,
    tileCount = DEFAULT_TILE_COUNT,
    patchSize = DEFAULT_PATCH_SIZE,
    stormIntensity = DEFAULT_STORM_INTENSITY
  }: TempestOceanExampleProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Tempest Ocean requires WebGPU.');
    }
    if (!Number.isFinite(stormIntensity) || stormIntensity < 0 || stormIntensity > 1) {
      throw new Error('Tempest Ocean stormIntensity must be from 0 through 1.');
    }
    this.device = device;
    this.simulationResolution = simulationResolution;
    this.gridPlan = makeTempestOceanGridPlan(gridResolution, tileCount);
    this.patchSize = patchSize;
    this.stormIntensity = stormIntensity;
    this.simulation = new SpectralOceanSimulation(device, {
      id: 'tempest-ocean-simulation',
      resolution: simulationResolution,
      patchSize,
      windDirection: [0.86, 0.5],
      windSpeed: 27,
      amplitude: 0.0007,
      choppiness: 2,
      seed: 0x20260802,
      foamDecay: 0.65,
      foamThreshold: 0.83,
      foamGain: 2.6
    });
    this.sceneTarget = createTempestOceanSceneTarget(device, width, height);
    this.skyModel = new Model(device, {
      id: 'tempest-ocean-sky',
      source: TEMPEST_OCEAN_SKY_SHADER,
      vertexCount: 3,
      shaderInputs: this.skyShaderInputs,
      colorAttachmentFormats: ['rgba16float']
    });
    this.oceanModel = new Model(device, {
      id: 'tempest-ocean-surface',
      source: TEMPEST_OCEAN_SURFACE_SHADER,
      vertexCount: this.gridPlan.vertexCount,
      instanceCount: this.gridPlan.instanceCount,
      shaderInputs: this.oceanShaderInputs,
      bindings: {
        oceanDisplacements: this.simulation.outputs.displacementBuffer,
        oceanNormalFoam: this.simulation.outputs.normalFoamBuffer
      },
      colorAttachmentFormats: ['rgba16float'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'none'
      }
    });
    this.postprocessingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createBloomCompositeShaderPass({colorFormat: 'rgba16float', resolutionScale: 0.62}),
        toneMapping
      ],
      colorFormat: 'rgba16float'
    });
    this.postprocessingRenderer.resize([this.sceneTarget.width, this.sceneTarget.height]);
  }

  /** Floating-point beauty target exposed for focused WebGPU verification. */
  get sceneColorTexture(): Texture {
    return this.sceneTarget.texture;
  }

  /** Absolute deterministic wave time, unchanged while paused. */
  get oceanTimeSeconds(): number {
    return this.simulationTimeSeconds;
  }

  /** Captures matched HDR and SDR planes from the next rendered frame. */
  captureHDRScreenshot(): Promise<TempestOceanHDRScreenshot> {
    if (this.captureRequest) {
      return this.captureRequest.promise;
    }
    if (this.finalized) {
      return Promise.reject(new Error('Tempest Ocean has been finalized.'));
    }

    // Artifact capture always starts from the authored seed so runner timing cannot change pixels.
    this.paused = true;
    this.cinematicCamera = true;
    this.orbitControls?.setAutoRotate(true);
    this.resetRequested = true;
    this.previousTimeMilliseconds = null;
    this.updateControlStatus();

    let resolveCapture!: (capture: TempestOceanHDRScreenshot) => void;
    let rejectCapture!: (reason?: unknown) => void;
    const promise = new Promise<TempestOceanHDRScreenshot>((resolve, reject) => {
      resolveCapture = resolve;
      rejectCapture = reject;
    });
    this.captureRequest = {
      promise,
      resolve: resolveCapture,
      reject: rejectCapture,
      encoded: false
    };
    return promise;
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      this.orbitControls = new OrbitControls(canvas, TEMPEST_OCEAN_CAMERA_PROPS);
      canvas.addEventListener('pointerdown', this.handleAudioActivation);
      globalThis.addEventListener('keydown', this.handleKeyDown);
      globalThis.document?.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.oceanAudio.setPageVisible(!globalThis.document?.hidden);
    }
    this.updateControlStatus();
  }

  onRender({device, width, height, aspect, time}: AnimationProps): void {
    if (width !== this.sceneTarget.width || height !== this.sceneTarget.height) {
      destroyTempestOceanSceneTarget(this.sceneTarget);
      this.sceneTarget = createTempestOceanSceneTarget(device, width, height);
      this.postprocessingRenderer.resize([width, height]);
    }

    const deltaTimeSeconds =
      this.previousTimeMilliseconds === null
        ? 1 / 60
        : Math.min(
            Math.max((time - this.previousTimeMilliseconds) / 1000, 0),
            MAXIMUM_DELTA_TIME_SECONDS
          );
    this.previousTimeMilliseconds = time;
    const resetFoamHistory = this.resetRequested;
    if (this.resetRequested) {
      this.simulationTimeSeconds = 0;
      this.orbitControls?.reset();
      this.resetRequested = false;
    } else if (!this.paused) {
      this.simulationTimeSeconds += deltaTimeSeconds;
      this.orbitControls?.update(time);
    } else {
      this.orbitControls?.update(time);
    }

    const cameraPosition = (this.orbitControls?.getEyePosition() ?? [75, 26, 92]) as [
      number,
      number,
      number
    ];
    const cameraTarget = TEMPEST_OCEAN_CAMERA_PROPS.target;
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(TEMPEST_OCEAN_FIELD_OF_VIEW_DEGREES),
      aspect,
      near: NEAR_PLANE,
      far: FAR_PLANE
    });
    const viewMatrix = new Matrix4().lookAt({
      eye: cameraPosition,
      center: cameraTarget,
      up: [0, 1, 0]
    });
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const inverseViewProjectionMatrix = new Matrix4(viewProjectionMatrix).invert();
    const sunDirection = getTempestOceanSunDirection(cameraPosition);
    const sceneProps: TempestOceanSceneUniforms = {
      viewProjectionMatrix,
      inverseViewProjectionMatrix,
      cameraAndTime: [...cameraPosition, this.simulationTimeSeconds],
      sunAndStorm: [...sunDirection, this.stormIntensity],
      surface: [
        this.patchSize,
        this.simulationResolution,
        this.gridPlan.gridResolution,
        this.gridPlan.tileCount
      ]
    };
    this.skyShaderInputs.setProps({tempestOceanScene: sceneProps});
    this.oceanShaderInputs.setProps({tempestOceanScene: sceneProps});

    // Preserve the reusable primitive's contract: simulation first, draw second, one caller encoder.
    this.simulation.encode(device.commandEncoder, {
      time: this.simulationTimeSeconds,
      deltaTime: this.paused ? 0 : deltaTimeSeconds,
      resetFoamHistory
    });
    this.skyModel.predraw(device.commandEncoder);
    this.oceanModel.predraw(device.commandEncoder);
    const scenePass = device.beginRenderPass({
      id: 'tempest-ocean-scene-pass',
      framebuffer: this.sceneTarget.framebuffer,
      clearColor: [0.004, 0.009, 0.018, 1],
      clearDepth: 1
    });
    this.skyModel.draw(scenePass);
    this.oceanModel.draw(scenePass);
    scenePass.end();

    this.postprocessingRenderer.renderToScreen(
      this.getPostprocessingOptions(
        device.preferredColorFormat === 'rgba16float'
          ? HIGH_DYNAMIC_RANGE_MAXIMUM_LUMINANCE
          : STANDARD_DYNAMIC_RANGE_MAXIMUM_LUMINANCE
      )
    );
    this.encodePendingHDRScreenshot();
  }

  onFinalize(): void {
    this.finalized = true;
    this.rejectCaptureRequest(this.captureRequest, new Error('Tempest Ocean was finalized.'));
    globalThis.removeEventListener('keydown', this.handleKeyDown);
    globalThis.document?.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.canvas?.removeEventListener('pointerdown', this.handleAudioActivation);
    this.orbitControls?.destroy();
    this.orbitControls = null;
    this.canvas = null;
    this.postprocessingRenderer.destroy();
    this.oceanModel.destroy();
    this.skyModel.destroy();
    this.skyShaderInputs.destroy();
    this.oceanShaderInputs.destroy();
    destroyTempestOceanSceneTarget(this.sceneTarget);
    this.simulation.destroy();
    this.oceanAudio.destroy();
  }

  private getPostprocessingOptions(maximumLuminance: number): ShaderPassRendererRenderOptions {
    return {
      sourceTexture: this.sceneTarget.texture,
      uniforms: {
        bloomExtract: {threshold: 1.7},
        bloomBlur: {radius: 6},
        bloomComposite: {intensity: 0.22},
        toneMapping: {
          exposure: 0.76,
          maximumLuminance
        }
      }
    };
  }

  private encodePendingHDRScreenshot(): void {
    const captureRequest = this.captureRequest;
    if (!captureRequest || captureRequest.encoded) {
      return;
    }
    captureRequest.encoded = true;

    let highDynamicRangeReadback: TempestOceanCaptureReadback | null = null;
    let standardDynamicRangeReadback: TempestOceanCaptureReadback | null = null;
    try {
      const highDynamicRangeTexture = this.postprocessingRenderer.encodeToTexture(
        this.device.commandEncoder,
        this.getPostprocessingOptions(HIGH_DYNAMIC_RANGE_MAXIMUM_LUMINANCE)
      );
      if (!highDynamicRangeTexture) {
        throw new Error('Tempest Ocean HDR capture output is unavailable.');
      }
      highDynamicRangeReadback = encodeTempestOceanCaptureReadback(
        this.device,
        highDynamicRangeTexture,
        this.sceneTarget.width,
        this.sceneTarget.height,
        'tempest-ocean-hdr-readback'
      );

      const standardDynamicRangeTexture = this.postprocessingRenderer.encodeToTexture(
        this.device.commandEncoder,
        this.getPostprocessingOptions(STANDARD_DYNAMIC_RANGE_MAXIMUM_LUMINANCE)
      );
      if (!standardDynamicRangeTexture) {
        throw new Error('Tempest Ocean SDR capture output is unavailable.');
      }
      standardDynamicRangeReadback = encodeTempestOceanCaptureReadback(
        this.device,
        standardDynamicRangeTexture,
        this.sceneTarget.width,
        this.sceneTarget.height,
        'tempest-ocean-sdr-readback'
      );

      const width = this.sceneTarget.width;
      const height = this.sceneTarget.height;
      const capturedHighDynamicRangeReadback = highDynamicRangeReadback;
      const capturedStandardDynamicRangeReadback = standardDynamicRangeReadback;
      queueMicrotask(() => {
        void this.readHDRScreenshot(
          captureRequest,
          width,
          height,
          capturedHighDynamicRangeReadback,
          capturedStandardDynamicRangeReadback
        );
      });
    } catch (error) {
      highDynamicRangeReadback?.buffer.destroy();
      standardDynamicRangeReadback?.buffer.destroy();
      this.rejectCaptureRequest(captureRequest, error);
    }
  }

  private async readHDRScreenshot(
    captureRequest: TempestOceanCaptureRequest,
    width: number,
    height: number,
    highDynamicRangeReadback: TempestOceanCaptureReadback,
    standardDynamicRangeReadback: TempestOceanCaptureReadback
  ): Promise<void> {
    try {
      const [highDynamicRangeSourceData, standardDynamicRangeSourceData] = await Promise.all([
        highDynamicRangeReadback.buffer.readAsync(0, highDynamicRangeReadback.byteLength),
        standardDynamicRangeReadback.buffer.readAsync(0, standardDynamicRangeReadback.byteLength)
      ]);
      const capture = makeTempestOceanHDRScreenshot({
        width,
        height,
        highDynamicRangeSourceData,
        highDynamicRangeSourceBytesPerRow: highDynamicRangeReadback.bytesPerRow,
        standardDynamicRangeSourceData,
        standardDynamicRangeSourceBytesPerRow: standardDynamicRangeReadback.bytesPerRow
      });
      if (this.captureRequest === captureRequest) {
        this.captureRequest = null;
        captureRequest.resolve(capture);
      }
    } catch (error) {
      this.rejectCaptureRequest(captureRequest, error);
    } finally {
      highDynamicRangeReadback.buffer.destroy();
      standardDynamicRangeReadback.buffer.destroy();
    }
  }

  private rejectCaptureRequest(
    captureRequest: TempestOceanCaptureRequest | null,
    reason: unknown
  ): void {
    if (captureRequest && this.captureRequest === captureRequest) {
      this.captureRequest = null;
      captureRequest.reject(reason);
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() === 'm') {
      this.oceanAudio.setEnabled(!this.oceanAudio.enabled);
      if (this.oceanAudio.enabled) {
        this.activateOceanAudio();
      }
      this.updateControlStatus();
      return;
    }
    this.activateOceanAudio();
    const key = event.key.toLowerCase();
    if (key === 'p' || event.key === ' ') {
      this.paused = !this.paused;
    } else if (key === 'c') {
      this.cinematicCamera = !this.cinematicCamera;
      this.orbitControls?.setAutoRotate(this.cinematicCamera);
    } else if (key === 'r') {
      this.paused = false;
      this.cinematicCamera = true;
      this.orbitControls?.setAutoRotate(true);
      this.resetRequested = true;
    } else {
      return;
    }
    this.updateControlStatus();
  };

  private readonly handleAudioActivation = (): void => {
    this.activateOceanAudio();
  };

  private readonly handleVisibilityChange = (): void => {
    this.oceanAudio.setPageVisible(!globalThis.document?.hidden);
    this.updateControlStatus();
  };

  private activateOceanAudio(): void {
    void this.oceanAudio.activate().then(
      () => this.updateControlStatus(),
      () => this.updateControlStatus()
    );
  }

  private updateControlStatus(): void {
    const status = globalThis.document?.querySelector('[data-tempest-state]');
    if (status) {
      status.textContent = `${this.cinematicCamera ? 'cinematic' : 'manual'} · ${this.paused ? 'paused' : 'running'}`;
    }
    const audioStatus = globalThis.document?.querySelector('[data-tempest-audio-state]');
    if (audioStatus) {
      const statusLabels: Record<TempestOceanAudioStatus, string> = {
        waiting: 'sound: click or press a key to enable',
        ready: 'sound: ocean atmosphere armed',
        muted: 'sound: muted',
        unavailable: 'sound unavailable'
      };
      audioStatus.textContent = statusLabels[this.oceanAudio.status];
    }
  }
}

function encodeTempestOceanCaptureReadback(
  device: Device,
  texture: Texture,
  width: number,
  height: number,
  id: string
): TempestOceanCaptureReadback {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = device.createBuffer({
    id,
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  device.commandEncoder.copyTextureToBuffer({
    sourceTexture: texture,
    destinationBuffer: buffer,
    width,
    height,
    depthOrArrayLayers: 1,
    bytesPerRow: layout.bytesPerRow,
    rowsPerImage: layout.rowsPerImage
  });
  return {buffer, byteLength: layout.byteLength, bytesPerRow: layout.bytesPerRow};
}

function createTempestOceanSceneTarget(
  device: Device,
  width: number,
  height: number
): TempestOceanSceneTarget {
  const targetWidth = Math.max(Math.round(width), 1);
  const targetHeight = Math.max(Math.round(height), 1);
  const texture = device.createTexture({
    id: 'tempest-ocean-scene-color',
    width: targetWidth,
    height: targetHeight,
    format: 'rgba16float',
    usage: Texture.RENDER | Texture.SAMPLE | Texture.COPY_SRC
  });
  return {
    width: targetWidth,
    height: targetHeight,
    texture,
    framebuffer: device.createFramebuffer({
      id: 'tempest-ocean-scene-framebuffer',
      width: targetWidth,
      height: targetHeight,
      colorAttachments: [texture],
      depthStencilAttachment: 'depth24plus'
    })
  };
}

function destroyTempestOceanSceneTarget(target: TempestOceanSceneTarget): void {
  target.framebuffer.destroy();
  target.texture.destroy();
}
