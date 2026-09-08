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
import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';
import {SpectralOceanSimulation} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {
  getTempestOceanSunDirection,
  TEMPEST_OCEAN_CAMERA_PROPS,
  TEMPEST_OCEAN_FIELD_OF_VIEW_DEGREES
} from './tempest-ocean-camera';
import {makeTempestOceanGridPlan, type TempestOceanGridPlan} from './tempest-ocean-grid';
import {
  makeTempestOceanHDRScreenshot,
  type TempestOceanHDRScreenshot
} from './tempest-ocean-capture';
import {TempestOceanAudio, type TempestOceanAudioStatus} from './tempest-ocean-audio';
import {TEMPEST_OCEAN_INFO_HTML} from './app-ui';

export const {TEMPEST_OCEAN_SKY_SHADER, TEMPEST_OCEAN_SURFACE_SHADER} = getShaderSources();

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

/** Cinematic HDR renderer that consumes {@link SpectralOceanSimulation} without owning submission. */
export default class TempestOceanAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = TEMPEST_OCEAN_INFO_HTML;

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
        createBloomShaderPassPipeline({colorFormat: 'rgba16float', resolutionScale: 0.62}),
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

function getShaderSources() {
  const TEMPEST_OCEAN_SCENE_PARAMETERS = /* wgsl */ `\
  struct TempestOceanSceneParameters {
    viewProjectionMatrix: mat4x4f,
    inverseViewProjectionMatrix: mat4x4f,
    cameraAndTime: vec4f,
    sunAndStorm: vec4f,
    surface: vec4f,
  };
  @group(0) @binding(auto) var<uniform> tempestOceanScene: TempestOceanSceneParameters;
  `;

  const TEMPEST_OCEAN_ATMOSPHERE = /* wgsl */ `\
  fn tempestHash(position: vec2f) -> f32 {
    let hashPosition = fract(position * vec2f(123.34, 456.21));
    let mixed = hashPosition + dot(hashPosition, hashPosition + vec2f(45.32));
    return fract(mixed.x * mixed.y);
  }

  fn tempestNoise(position: vec2f) -> f32 {
    let cell = floor(position);
    let local = fract(position);
    let blend = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(tempestHash(cell), tempestHash(cell + vec2f(1.0, 0.0)), blend.x),
      mix(tempestHash(cell + vec2f(0.0, 1.0)), tempestHash(cell + vec2f(1.0)), blend.x),
      blend.y
    );
  }

  fn tempestCloudNoise(position: vec2f) -> f32 {
    var coordinate = position;
    var value = 0.0;
    var weight = 0.52;
    for (var octave = 0u; octave < 4u; octave++) {
      value += tempestNoise(coordinate) * weight;
      coordinate = mat2x2f(1.55, 1.21, -1.21, 1.55) * coordinate + vec2f(2.7, -1.9);
      weight *= 0.5;
    }
    return value;
  }

  fn getTempestSkyColor(directionInput: vec3f) -> vec3f {
    let direction = normalize(vec3f(directionInput.x, max(directionInput.y, -0.08), directionInput.z));
    let sunDirection = normalize(tempestOceanScene.sunAndStorm.xyz);
    let storm = tempestOceanScene.sunAndStorm.w;
    let time = tempestOceanScene.cameraAndTime.w;
    let elevation = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
    let horizon = pow(1.0 - abs(direction.y), 4.0);
    let zenithColor = mix(vec3f(0.018, 0.04, 0.075), vec3f(0.03, 0.085, 0.16), 1.0 - storm);
    let horizonColor = mix(vec3f(0.17, 0.145, 0.16), vec3f(0.22, 0.32, 0.42), 1.0 - storm);
    var color = mix(horizonColor, zenithColor, smoothstep(0.46, 0.88, elevation));

    let cloudProjection = direction.xz / max(direction.y + 0.32, 0.09);
    let cloudCoordinate = cloudProjection * 0.68 + vec2f(time * 0.011, -time * 0.006);
    let cloudNoise = tempestCloudNoise(cloudCoordinate);
    let cloudMask = smoothstep(0.48, 0.74, cloudNoise + horizon * 0.08) * storm;
    let cloudShade = mix(vec3f(0.055, 0.07, 0.095), vec3f(0.19, 0.21, 0.24), cloudNoise);
    color = mix(color, cloudShade, cloudMask * (0.68 + 0.22 * elevation));

    let sunAlignment = max(dot(direction, sunDirection), 0.0);
    let sunDisk = smoothstep(0.99976, 0.99994, sunAlignment);
    let sunHalo = pow(sunAlignment, 720.0);
    let horizontalDirection = direction.xz / max(length(direction.xz), 0.00001);
    let horizontalSunDirection = sunDirection.xz / max(length(sunDirection.xz), 0.00001);
    let sunBreak = pow(max(dot(horizontalDirection, horizontalSunDirection), 0.0), 8.0) *
      exp(-abs(direction.y - sunDirection.y) * 13.0);
    let cloudTransmission = 1.0 - cloudMask * 0.68;
    color += vec3f(1.35, 0.68, 0.2) * sunHalo * cloudTransmission;
    color += vec3f(10.0, 6.0, 2.15) * sunDisk * cloudTransmission;
    color += vec3f(0.24, 0.095, 0.028) * sunBreak * (0.25 + horizon * 0.75);
    return max(color, vec3f(0.0));
  }
  `;

  /** Fullscreen procedural HDR stormfront and low sun. */
  const TEMPEST_OCEAN_SKY_SHADER = /* wgsl */ `\
  ${TEMPEST_OCEAN_SCENE_PARAMETERS}
  ${TEMPEST_OCEAN_ATMOSPHERE}

  struct SkyFragmentInputs {
    @builtin(position) position: vec4f,
    @location(0) clipPosition: vec2f,
  };

  @vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> SkyFragmentInputs {
    let positions = array<vec2f, 3>(
      vec2f(-1.0, -1.0),
      vec2f(3.0, -1.0),
      vec2f(-1.0, 3.0)
    );
    let clipPosition = positions[vertexIndex];
    var output: SkyFragmentInputs;
    output.position = vec4f(clipPosition, 1.0, 1.0);
    output.clipPosition = clipPosition;
    return output;
  }

  @fragment fn fragmentMain(inputs: SkyFragmentInputs) -> @location(0) vec4f {
    let farClip = vec4f(inputs.clipPosition, 1.0, 1.0);
    let worldPositionHomogeneous = tempestOceanScene.inverseViewProjectionMatrix * farClip;
    let worldPosition = worldPositionHomogeneous.xyz / worldPositionHomogeneous.w;
    let direction = normalize(worldPosition - tempestOceanScene.cameraAndTime.xyz);
    return vec4f(getTempestSkyColor(direction), 1.0);
  }
  `;

  /** Procedural tiled grid that consumes the reusable simulation storage buffers directly. */
  const TEMPEST_OCEAN_SURFACE_SHADER = /* wgsl */ `\
  ${TEMPEST_OCEAN_SCENE_PARAMETERS}
  ${TEMPEST_OCEAN_ATMOSPHERE}

  @group(0) @binding(0) var<storage, read> oceanDisplacements: array<vec4f>;
  @group(0) @binding(1) var<storage, read> oceanNormalFoam: array<vec4f>;

  struct OceanSurfaceSample {
    displacement: vec3f,
    normal: vec3f,
    foam: f32,
  };

  struct OceanFragmentInputs {
    @builtin(position) position: vec4f,
    @location(0) worldPosition: vec3f,
    @location(1) worldNormal: vec3f,
    @location(2) foam: f32,
  };

  fn getOceanIndex(coordinate: vec2u, resolution: u32) -> u32 {
    let wrapped = coordinate % vec2u(resolution);
    return wrapped.y * resolution + wrapped.x;
  }

  fn sampleOceanSurface(uv: vec2f) -> OceanSurfaceSample {
    let resolution = u32(tempestOceanScene.surface.y);
    let samplePosition = fract(uv) * f32(resolution);
    let baseCoordinate = vec2u(floor(samplePosition));
    let blend = fract(samplePosition);
    let index00 = getOceanIndex(baseCoordinate, resolution);
    let index10 = getOceanIndex(baseCoordinate + vec2u(1u, 0u), resolution);
    let index01 = getOceanIndex(baseCoordinate + vec2u(0u, 1u), resolution);
    let index11 = getOceanIndex(baseCoordinate + vec2u(1u), resolution);
    let displacementBottom = mix(oceanDisplacements[index00].xyz, oceanDisplacements[index10].xyz, blend.x);
    let displacementTop = mix(oceanDisplacements[index01].xyz, oceanDisplacements[index11].xyz, blend.x);
    let normalFoamBottom = mix(oceanNormalFoam[index00], oceanNormalFoam[index10], blend.x);
    let normalFoamTop = mix(oceanNormalFoam[index01], oceanNormalFoam[index11], blend.x);
    let normalFoam = mix(normalFoamBottom, normalFoamTop, blend.y);
    var sample: OceanSurfaceSample;
    sample.displacement = mix(displacementBottom, displacementTop, blend.y);
    sample.normal = normalize(normalFoam.xyz);
    sample.foam = clamp(normalFoam.w, 0.0, 1.0);
    return sample;
  }

  @vertex fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
  ) -> OceanFragmentInputs {
    let cornerPattern = array<vec2u, 6>(
      vec2u(0u, 0u), vec2u(1u, 1u), vec2u(1u, 0u),
      vec2u(0u, 0u), vec2u(0u, 1u), vec2u(1u, 1u)
    );
    let gridResolution = u32(tempestOceanScene.surface.z);
    let cellResolution = gridResolution - 1u;
    let cellIndex = vertexIndex / 6u;
    let cellCoordinate = vec2u(cellIndex % cellResolution, cellIndex / cellResolution);
    let gridCoordinate = cellCoordinate + cornerPattern[vertexIndex % 6u];
    let uv = vec2f(gridCoordinate) / f32(cellResolution);
    let patchSize = tempestOceanScene.surface.x;
    let tileCount = u32(tempestOceanScene.surface.w);
    let halfTileCount = i32(tileCount / 2u);
    let tileCoordinate = vec2i(
      i32(instanceIndex % tileCount) - halfTileCount,
      i32(instanceIndex / tileCount) - halfTileCount
    );
    let tileOffset = vec2f(tileCoordinate) * patchSize;
    let surfaceSample = sampleOceanSurface(uv);
    let basePosition = vec3f(
      (uv.x - 0.5) * patchSize + tileOffset.x,
      0.0,
      (uv.y - 0.5) * patchSize + tileOffset.y
    );
    let worldPosition = basePosition + surfaceSample.displacement;
    var output: OceanFragmentInputs;
    output.position = tempestOceanScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
    output.worldPosition = worldPosition;
    output.worldNormal = surfaceSample.normal;
    output.foam = surfaceSample.foam;
    return output;
  }

  @fragment fn fragmentMain(inputs: OceanFragmentInputs) -> @location(0) vec4f {
    let normal = normalize(inputs.worldNormal);
    let cameraPosition = tempestOceanScene.cameraAndTime.xyz;
    let viewDirection = normalize(cameraPosition - inputs.worldPosition);
    let sunDirection = normalize(tempestOceanScene.sunAndStorm.xyz);
    let halfDirection = normalize(viewDirection + sunDirection);
    let normalView = max(dot(normal, viewDirection), 0.0);
    let normalSun = max(dot(normal, sunDirection), 0.0);
    let fresnel = 0.018 + 0.982 * pow(1.0 - normalView, 5.0);
    let reflectionDirection = reflect(-viewDirection, normal);
    let reflectedSky = getTempestSkyColor(reflectionDirection);
    let slopeEnergy = 1.0 - clamp(normal.y, 0.0, 1.0);
    let deepWater = vec3f(0.014, 0.07, 0.115);
    let crestWater = vec3f(0.045, 0.235, 0.315);
    var color = mix(deepWater, crestWater, clamp(slopeEnergy * 2.3 + normalSun * 0.22, 0.0, 1.0));
    color = mix(color, reflectedSky, clamp(fresnel * 0.88 + slopeEnergy * 0.18, 0.0, 1.0));

    let sunSpecular = pow(max(dot(normal, halfDirection), 0.0), mix(168.0, 42.0, inputs.foam));
    color += vec3f(7.5, 4.4, 1.55) * sunSpecular * normalSun * (1.0 - inputs.foam * 0.58);
    let foamCompression = clamp(inputs.foam + slopeEnergy * 0.35, 0.0, 1.0);
    let foamWidth = max(fwidth(foamCompression) * 1.05, 0.015);
    let foamContour = smoothstep(0.18 - foamWidth, 0.5 + foamWidth, foamCompression);
    let foamNoise = tempestNoise(
      inputs.worldPosition.xz * 0.13 + vec2f(tempestOceanScene.cameraAndTime.w * 0.31, -tempestOceanScene.cameraAndTime.w * 0.19)
    );
    let foamMask = clamp(foamContour * mix(0.5, 0.95, smoothstep(0.28, 0.72, foamNoise)), 0.0, 1.0);
    let foamColor = vec3f(0.56, 0.76, 0.94) * (0.72 + normalSun * 0.5) +
      reflectedSky * 0.13 + vec3f(0.7, 0.38, 0.12) * sunSpecular;
    color = mix(color, foamColor, foamMask * (0.7 + slopeEnergy * 0.18));

    let horizontalDistance = length(inputs.worldPosition.xz - cameraPosition.xz);
    let patchSize = tempestOceanScene.surface.x;
    let horizonFog = smoothstep(patchSize * 0.72, patchSize * 1.48, horizontalDistance);
    let horizonDirection = normalize(vec3f(
      inputs.worldPosition.x - cameraPosition.x,
      0.035 * patchSize,
      inputs.worldPosition.z - cameraPosition.z
    ));
    color = mix(color, getTempestSkyColor(horizonDirection), horizonFog * 0.84);
    return vec4f(max(color, vec3f(0.0)), 1.0);
  }
  `;

  return {TEMPEST_OCEAN_SKY_SHADER, TEMPEST_OCEAN_SURFACE_SHADER} as const;
}
