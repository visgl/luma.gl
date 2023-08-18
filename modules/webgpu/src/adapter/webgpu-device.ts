// prettier-ignore
// / <reference types="@webgpu/types" />

import type {
  DeviceProps,
  DeviceInfo,
  DeviceLimits,
  DeviceFeature,
  CanvasContextProps,
  BufferProps,
  SamplerProps,
  ShaderProps,
  Texture,
  TextureProps,
  TextureFormat,
  ExternalTextureProps,
  FramebufferProps,
  RenderPipelineProps,
  ComputePipelineProps,
  RenderPassProps,
  ComputePassProps,
  // CommandEncoderProps
} from '@luma.gl/core';
import {Device, CanvasContext, log, uid} from '@luma.gl/core';
import {WebGPUBuffer} from './resources/webgpu-buffer';
import {WebGPUTexture} from './resources/webgpu-texture';
import {WebGPUExternalTexture} from './resources/webgpu-external-texture';
import {WebGPUSampler} from './resources/webgpu-sampler';
import {WebGPUShader} from './resources/webgpu-shader';
import {WebGPURenderPipeline} from './resources/webgpu-render-pipeline';
import {WebGPUFramebuffer} from './resources/webgpu-framebuffer';
import {WebGPUComputePipeline} from './resources/webgpu-compute-pipeline';
import {WebGPURenderPass} from './resources/webgpu-render-pass';
import {WebGPUComputePass} from './resources/webgpu-compute-pass';
// import {WebGPUCommandEncoder} from './resources/webgpu-command-encoder';

import {WebGPUCanvasContext} from './webgpu-canvas-context';
// import {loadGlslangModule} from '../glsl/glslang';

/** WebGPU Device implementation */
export class WebGPUDevice extends Device {
  readonly handle: GPUDevice;
  readonly adapter: GPUAdapter;
  readonly lost: Promise<{reason: 'destroyed'; message: string}>;
  canvasContext: WebGPUCanvasContext | null = null;

  commandEncoder: GPUCommandEncoder | null = null;
  renderPass: WebGPURenderPass | null = null;

  private _info: DeviceInfo;
  private _isLost: boolean = false;

  static type: string = 'webgpu';

  /** Check if WebGPU is available */
  static isSupported(): boolean {
    return Boolean(typeof navigator !== 'undefined' && navigator.gpu);
  }

  static async create(props: DeviceProps): Promise<WebGPUDevice> {
    if (!navigator.gpu) {
      throw new Error(
        'WebGPU not available. Open in Chrome Canary and turn on chrome://flags/#enable-unsafe-webgpu'
      );
    }
    log.groupCollapsed(1, 'WebGPUDevice created')();
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
      // forceSoftware: false
    });
    if (!adapter) {
      throw new Error('Failed to request WebGPU adapter');
    }

    const adapterInfo = await adapter.requestAdapterInfo();
    log.probe(1, 'Adapter available', adapterInfo)();

    const gpuDevice = await adapter.requestDevice({
      requiredFeatures: adapter.features as ReadonlySet<GPUFeatureName>
      // TODO ensure we obtain best limits
      // requiredLimits: adapter.limits
    });
    log.probe(1, 'GPUDevice available')();

    if (typeof props.canvas === 'string') {
      await CanvasContext.pageLoaded;
      log.probe(1, 'DOM is loaded')();
    }

    const device = new WebGPUDevice(gpuDevice, adapter, props);
    log.probe(1, 'Device created', device.info)();
    log.table(1, device.info)();
    log.groupEnd(1)();
    return device;
  }

  constructor(device: GPUDevice, adapter: GPUAdapter, props: DeviceProps) {
    super({...props, id: props.id || uid('webgpu-device')});
    this.handle = device;
    this.adapter = adapter;

    this._info = {
      type: 'webgpu',
      vendor: this.adapter.__brand,
      renderer: '',
      version: '',
      gpu: 'unknown', // 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown',
      shadingLanguages: ['glsl', 'wgsl'],
      shadingLanguageVersions: {
        glsl: '450',
        wgsl: '100'
      },
      vendorMasked: '',
      rendererMasked: ''
    };

    // "Context" loss handling
    this.lost = new Promise<{reason: 'destroyed'; message: string}>(async (resolve) => {
      const lostInfo = await this.handle.lost;
      this._isLost = true;
      resolve({reason: 'destroyed', message: lostInfo.message});
    });

    // Note: WebGPU devices can be created without a canvas, for compute shader purposes
    if (props.canvas) {
      this.canvasContext = new WebGPUCanvasContext(this, this.adapter, {canvas: props.canvas});
    }

    this.features = this._getFeatures();
  }

  // TODO
  // Load the glslang module now so that it is available synchronously when compiling shaders
  // const {glsl = true} = props;
  // this.glslang = glsl && await loadGlslangModule();

  destroy(): void {
    this.handle.destroy();
  }

  get info(): DeviceInfo {
    return this._info;
  }

  features: Set<DeviceFeature>;

  get limits(): DeviceLimits {
    return this.handle.limits;
  }

  isTextureFormatSupported(format: TextureFormat): boolean {
    return !format.includes('webgl');
  }

  /** @todo implement proper check? */
  isTextureFormatFilterable(format: TextureFormat): boolean {
    return this.isTextureFormatSupported(format);
  }

  /** @todo implement proper check? */
  isTextureFormatRenderable(format: TextureFormat): boolean {
    return this.isTextureFormatSupported(format);
  }

  get isLost(): boolean {
    return this._isLost;
  }

  createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): WebGPUBuffer {
    const newProps = this._getBufferProps(props);
    return new WebGPUBuffer(this, newProps);
  }

  _createTexture(props: TextureProps): WebGPUTexture {
    return new WebGPUTexture(this, props);
  }

  createExternalTexture(props: ExternalTextureProps): WebGPUExternalTexture {
    return new WebGPUExternalTexture(this, props);
  }

  createShader(props: ShaderProps): WebGPUShader {
    return new WebGPUShader(this, props);
  }

  createSampler(props: SamplerProps): WebGPUSampler {
    return new WebGPUSampler(this, props);
  }

  createRenderPipeline(props: RenderPipelineProps): WebGPURenderPipeline {
    return new WebGPURenderPipeline(this, props);
  }

  createFramebuffer(props: FramebufferProps): WebGPUFramebuffer {
    throw new Error('Not implemented');
  }

  createComputePipeline(props: ComputePipelineProps): WebGPUComputePipeline {
    return new WebGPUComputePipeline(this, props);
  }

  // WebGPU specifics

  /**
   * Allows a render pass to begin against a canvas context
   * @todo need to support a "Framebuffer" equivalent (aka preconfigured RenderPassDescriptors?).
   */
  beginRenderPass(props: RenderPassProps): WebGPURenderPass {
    this.commandEncoder = this.commandEncoder || this.handle.createCommandEncoder();
    return new WebGPURenderPass(this, props);
  }

  beginComputePass(props: ComputePassProps): WebGPUComputePass {
    this.commandEncoder = this.commandEncoder || this.handle.createCommandEncoder();
    return new WebGPUComputePass(this, props);
  }

  // createCommandEncoder(props: CommandEncoderProps): WebGPUCommandEncoder {
  //   return new WebGPUCommandEncoder(this, props);
  // }

  createCanvasContext(props: CanvasContextProps): WebGPUCanvasContext {
    return new WebGPUCanvasContext(this, this.adapter, props);
  }

  /**
   * Gets default renderpass encoder.
   * Creates a new encoder against default canvasContext if not already created
   * @note Called internally by Model.
   */
  getDefaultRenderPass(): WebGPURenderPass {
    this.renderPass =
      this.renderPass ||
      this.beginRenderPass({
        framebuffer: this.canvasContext?.getCurrentFramebuffer()
      });
    return this.renderPass;
  }

  submit(): void {
    this.renderPass?.end();
    const commandBuffer = this.commandEncoder?.finish();
    if (commandBuffer) {
      this.handle.queue.submit([commandBuffer]);
    }
    this.commandEncoder = null;
    this.renderPass = null;
  }

  _getFeatures() {
    // WebGPU Features
    const features = new Set<DeviceFeature>(this.handle.features as Set<DeviceFeature>);

    // Fixups for pre-standard names: https://github.com/webgpu-native/webgpu-headers/issues/133
    // @ts-expect-error Chrome Canary v99
    if (features.has('depth-clamping')) {
      // @ts-expect-error Chrome Canary v99
      features.delete('depth-clamping');
      features.add('depth-clip-control');
    }

    // Add subsets
    if (features.has('texture-compression-bc')) {
      features.add('texture-compression-bc5-webgl');
    }

    features.add('webgpu');

    features.add('timer-query-webgl');

    // WEBGL1 SUPPORT
    features.add('vertex-array-object-webgl1');
    features.add('instanced-rendering-webgl1');
    features.add('multiple-render-targets-webgl1');
    features.add('index-uint32-webgl1');
    features.add('blend-minmax-webgl1');
    features.add('texture-blend-float-webgl1');

    // TEXTURES, RENDERBUFFERS
    features.add('texture-formats-srgb-webgl1');

    // TEXTURES
    features.add('texture-formats-depth-webgl1');
    features.add('texture-formats-float32-webgl1');
    features.add('texture-formats-float16-webgl1');

    features.add('texture-filter-linear-float32-webgl');
    features.add('texture-filter-linear-float16-webgl');
    features.add('texture-filter-anisotropic-webgl');

    // FRAMEBUFFERS, TEXTURES AND RENDERBUFFERS
    features.add('texture-renderable-rgba32float-webgl');
    features.add('texture-renderable-float32-webgl');
    features.add('texture-renderable-float16-webgl');

    // GLSL extensions
    features.add('glsl-frag-data');
    features.add('glsl-frag-depth');
    features.add('glsl-derivatives');
    features.add('glsl-texture-lod');

    return features;
  }

  copyExternalImageToTexture(options: {
    texture: Texture;
    mipLevel?: number;
    aspect?: 'all' | 'stencil-only' | 'depth-only';
    colorSpace?: 'display-p3' | 'srgb';
    premultipliedAlpha?: boolean;

    source:  ImageBitmap | HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas;
    sourceX?: number;
    sourceY?: number;

    width?: number;
    height?: number;
    depth?: number;
  }): void {
    const {
      source,
      sourceX = 0,
      sourceY = 0,

      texture,
      mipLevel = 0,
      aspect = 'all',
      colorSpace = 'display-p3',
      premultipliedAlpha = false,
      // destinationX,
      // destinationY,
      // desitnationZ,

      width = texture.width,
      height = texture.height,
      depth = 1
    } = options;

    const webGpuTexture = texture as WebGPUTexture;

    this.handle?.queue.copyExternalImageToTexture(
      // source: GPUImageCopyExternalImage
      {
        source,
        origin: [sourceX, sourceY]
      },
      // destination: GPUImageCopyTextureTagged
      {
        texture: webGpuTexture.handle,
        origin: [0, 0, 0], // [x, y, z],
        mipLevel,
        aspect,
        colorSpace,
        premultipliedAlpha
      },
      // copySize: GPUExtent3D
      [
        width,
        height,
        depth
      ]
    )
  }
}
