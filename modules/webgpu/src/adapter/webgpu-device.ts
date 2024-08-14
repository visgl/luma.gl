// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// prettier-ignore
// / <reference types="@webgpu/types" />

import type {
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
  // CommandEncoderProps,
  VertexArrayProps,
  TransformFeedback,
  TransformFeedbackProps,
  QuerySet,
  QuerySetProps,
  DeviceProps
} from '@luma.gl/core';
import {Device, DeviceFeatures} from '@luma.gl/core';
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
import {WebGPUVertexArray} from './resources/webgpu-vertex-array';

import {WebGPUCanvasContext} from './webgpu-canvas-context';
import {WebGPUQuerySet} from './resources/webgpu-query-set';

/** WebGPU Device implementation */
export class WebGPUDevice extends Device {
  /** type of this device */
  readonly type = 'webgpu';

  /** The underlying WebGPU device */
  readonly handle: GPUDevice;
  /* The underlying WebGPU adapter */
  readonly adapter: GPUAdapter;
  /* The underlying WebGPU adapter's info */
  readonly adapterInfo: GPUAdapterInfo;

  readonly features: DeviceFeatures;
  readonly info: DeviceInfo;
  readonly limits: DeviceLimits;

  readonly lost: Promise<{reason: 'destroyed'; message: string}>;
  canvasContext: WebGPUCanvasContext | null = null;

  private _isLost: boolean = false;
  commandEncoder: GPUCommandEncoder | null = null;
  renderPass: WebGPURenderPass | null = null;

  constructor(
    props: DeviceProps,
    device: GPUDevice,
    adapter: GPUAdapter,
    adapterInfo: GPUAdapterInfo
  ) {
    super({...props, id: props.id || 'webgpu-device'});
    this.handle = device;
    this.adapter = adapter;
    this.adapterInfo = adapterInfo;

    this.info = this._getInfo();
    this.features = this._getFeatures();
    this.limits = this.handle.limits;

    // Listen for uncaptured WebGPU errors
    device.addEventListener('uncapturederror', (event: Event) => {
      // TODO is this the right way to make sure the error is an Error instance?
      const errorMessage =
        event instanceof GPUUncapturedErrorEvent ? event.error.message : 'Unknown error';
      this.error(new Error(errorMessage));
    });

    // "Context" loss handling
    this.lost = new Promise<{reason: 'destroyed'; message: string}>(async resolve => {
      const lostInfo = await this.handle.lost;
      this._isLost = true;
      resolve({reason: 'destroyed', message: lostInfo.message});
    });

    // Note: WebGPU devices can be created without a canvas, for compute shader purposes
    if (props.canvasContext) {
      this.canvasContext = new WebGPUCanvasContext(this, this.adapter, props.canvasContext);
    }
  }

  // TODO
  // Load the glslang module now so that it is available synchronously when compiling shaders
  // const {glsl = true} = props;
  // this.glslang = glsl && await loadGlslangModule();

  destroy(): void {
    this.handle.destroy();
  }

  isTextureFormatSupported(format: TextureFormat): boolean {
    return !format.includes('webgl');
  }

  /** @todo implement proper check? */
  isTextureFormatFilterable(format: TextureFormat): boolean {
    return (
      this.isTextureFormatSupported(format) &&
      !format.startsWith('depth') &&
      !format.startsWith('stencil')
    );
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

  createTexture(props: TextureProps): WebGPUTexture {
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
    return new WebGPUFramebuffer(this, props);
  }

  createComputePipeline(props: ComputePipelineProps): WebGPUComputePipeline {
    return new WebGPUComputePipeline(this, props);
  }

  createVertexArray(props: VertexArrayProps): WebGPUVertexArray {
    return new WebGPUVertexArray(this, props);
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

  createTransformFeedback(props: TransformFeedbackProps): TransformFeedback {
    throw new Error('Transform feedback not supported in WebGPU');
  }

  override createQuerySet(props: QuerySetProps): QuerySet {
    return new WebGPUQuerySet(this, props);
  }

  createCanvasContext(props: CanvasContextProps): WebGPUCanvasContext {
    return new WebGPUCanvasContext(this, this.adapter, props);
  }

  submit(): void {
    // this.renderPass?.end();
    const commandBuffer = this.commandEncoder?.finish();
    if (commandBuffer) {
      this.handle.queue.submit([commandBuffer]);
    }
    this.commandEncoder = null;
    // this.renderPass = null;
  }

  // PRIVATE METHODS

  protected _getInfo(): DeviceInfo {
    const [driver, driverVersion] = ((this.adapterInfo as any).driver || '').split(' Version ');

    // See https://developer.chrome.com/blog/new-in-webgpu-120#adapter_information_updates
    const vendor = this.adapterInfo.vendor || this.adapter.__brand || 'unknown';
    const renderer = driver || '';
    const version = driverVersion || '';

    const gpu = vendor === 'apple' ? 'apple' : 'unknown'; // 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown',
    const gpuArchitecture = this.adapterInfo.architecture || 'unknown';
    const gpuBackend = (this.adapterInfo as any).backend || 'unknown';
    const gpuType = ((this.adapterInfo as any).type || '').split(' ')[0].toLowerCase() || 'unknown';

    return {
      type: 'webgpu',
      vendor,
      renderer,
      version,
      gpu,
      gpuType,
      gpuBackend,
      gpuArchitecture,
      shadingLanguage: 'wgsl',
      shadingLanguageVersion: 100
    };
  }

  protected _getFeatures(): DeviceFeatures {
    // Initialize with actual WebGPU Features (note that unknown features may not be in DeviceFeature type)
    const features = new Set<DeviceFeature>(this.handle.features as Set<DeviceFeature>);
    // Fixups for pre-standard names: https://github.com/webgpu-native/webgpu-headers/issues/133
    // @ts-expect-error Chrome Canary v99
    if (features.has('depth-clamping')) {
      // @ts-expect-error Chrome Canary v99
      features.delete('depth-clamping');
      features.add('depth-clip-control');
    }

    // Some subsets of WebGPU extensions correspond to WebGL extensions
    if (features.has('texture-compression-bc')) {
      features.add('texture-compression-bc5-webgl');
    }

    const WEBGPU_ALWAYS_FEATURES: DeviceFeature[] = [
      'timer-query-webgl',
      'compilation-status-async-webgl',
      'float32-renderable-webgl',
      'float16-renderable-webgl',
      'norm16-renderable-webgl',
      'texture-filterable-anisotropic-webgl',
      'shader-noperspective-interpolation-webgl'
    ];

    for (const feature of WEBGPU_ALWAYS_FEATURES) {
      features.add(feature);
    }

    return new DeviceFeatures(Array.from(features), this.props._disabledFeatures);
  }

  copyExternalImageToTexture(options: {
    texture: Texture;
    mipLevel?: number;
    aspect?: 'all' | 'stencil-only' | 'depth-only';
    colorSpace?: 'display-p3' | 'srgb';
    premultipliedAlpha?: boolean;

    source: ImageBitmap | HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas;
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
      [width, height, depth]
    );
  }
}
