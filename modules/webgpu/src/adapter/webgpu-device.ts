// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// prettier-ignore
// / <reference types="@webgpu/types" />

import type {
  DeviceInfo,
  DeviceLimits,
  DeviceFeature,
  DeviceTextureFormatCapabilities,
  VertexFormat,
  CanvasContextProps,
  BufferProps,
  SamplerProps,
  ShaderProps,
  TextureProps,
  ExternalTextureProps,
  FramebufferProps,
  RenderPipelineProps,
  ComputePipelineProps,
  VertexArrayProps,
  TransformFeedback,
  TransformFeedbackProps,
  QuerySet,
  QuerySetProps,
  DeviceProps,
  CommandEncoderProps,
  PipelineLayoutProps,
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
import {WebGPUVertexArray} from './resources/webgpu-vertex-array';

import {WebGPUCanvasContext} from './webgpu-canvas-context';
import {WebGPUCommandEncoder} from './resources/webgpu-command-encoder';
import {WebGPUCommandBuffer} from './resources/webgpu-command-buffer';
import {WebGPUQuerySet} from './resources/webgpu-query-set';
import {WebGPUPipelineLayout} from './resources/webgpu-pipeline-layout';

/** WebGPU Device implementation */
export class WebGPUDevice extends Device {
  /** The underlying WebGPU device */
  readonly handle: GPUDevice;
  /** type of this device */
  readonly type = 'webgpu';

  readonly preferredColorFormat = navigator.gpu.getPreferredCanvasFormat() as
    | 'rgba8unorm'
    | 'bgra8unorm';
  readonly preferredDepthFormat = 'depth24plus';

  readonly features: DeviceFeatures;
  readonly info: DeviceInfo;
  readonly limits: DeviceLimits;

  readonly lost: Promise<{reason: 'destroyed'; message: string}>;

  override canvasContext: WebGPUCanvasContext | null = null;

  private _isLost: boolean = false;
  commandEncoder: WebGPUCommandEncoder;
  /* The underlying WebGPU adapter */
  readonly adapter: GPUAdapter;
  /* The underlying WebGPU adapter's info */
  readonly adapterInfo: GPUAdapterInfo;

  override get [Symbol.toStringTag](): string {
    return 'WebGPUDevice';
  }

  override toString(): string {
    return `WebGPUDevice(${this.id})`;
  }

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
      event.preventDefault();
      // TODO is this the right way to make sure the error is an Error instance?
      const errorMessage =
        event instanceof GPUUncapturedErrorEvent ? event.error.message : 'Unknown WebGPU error';
      this.reportError(new Error(errorMessage), this)();
      this.debug();
    });

    // "Context" loss handling
    this.lost = new Promise<{reason: 'destroyed'; message: string}>(async resolve => {
      const lostInfo = await this.handle.lost;
      this._isLost = true;
      resolve({reason: 'destroyed', message: lostInfo.message});
    });

    // Note: WebGPU devices can be created without a canvas, for compute shader purposes
    const canvasContextProps = Device._getCanvasContextProps(props);
    if (canvasContextProps) {
      this.canvasContext = new WebGPUCanvasContext(this, this.adapter, canvasContextProps);
    }

    this.commandEncoder = this.createCommandEncoder({});
  }

  // TODO
  // Load the glslang module now so that it is available synchronously when compiling shaders
  // const {glsl = true} = props;
  // this.glslang = glsl && await loadGlslangModule();

  destroy(): void {
    this.handle.destroy();
  }

  get isLost(): boolean {
    return this._isLost;
  }

  override isVertexFormatSupported(format: VertexFormat): boolean {
    const info = this.getVertexFormatInfo(format);
    return !info.webglOnly;
  }

  createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): WebGPUBuffer {
    const newProps = this._normalizeBufferProps(props);
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

  override createCommandEncoder(props?: CommandEncoderProps): WebGPUCommandEncoder {
    return new WebGPUCommandEncoder(this, props);
  }

  // WebGPU specifics

  createTransformFeedback(props: TransformFeedbackProps): TransformFeedback {
    throw new Error('Transform feedback not supported in WebGPU');
  }

  override createQuerySet(props: QuerySetProps): QuerySet {
    return new WebGPUQuerySet(this, props);
  }

  createCanvasContext(props: CanvasContextProps): WebGPUCanvasContext {
    return new WebGPUCanvasContext(this, this.adapter, props);
  }

  createPipelineLayout(props: PipelineLayoutProps): WebGPUPipelineLayout {
    return new WebGPUPipelineLayout(this, props);
  }

  submit(commandBuffer?: WebGPUCommandBuffer): void {
    if (!commandBuffer) {
      commandBuffer = this.commandEncoder.finish();
      this.commandEncoder.destroy();
      this.commandEncoder = this.createCommandEncoder({id: `${this.id}-default-encoder`});
    }

    this.pushErrorScope('validation');
    this.handle.queue.submit([commandBuffer.handle]);
    this.popErrorScope((error: GPUError) => {
      this.reportError(new Error(`${this} command submission: ${error.message}`), this)();
      this.debug();
    });
  }

  // WebGPU specific

  pushErrorScope(scope: 'validation' | 'out-of-memory'): void {
    this.handle.pushErrorScope(scope);
  }

  popErrorScope(handler: (error: GPUError) => void): void {
    this.handle.popErrorScope().then((error: GPUError | null) => {
      if (error) {
        handler(error);
      }
    });
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

  override _getDeviceSpecificTextureFormatCapabilities(
    capabilities: DeviceTextureFormatCapabilities
  ): DeviceTextureFormatCapabilities {
    const {format} = capabilities;
    if (format.includes('webgl')) {
      return {format, create: false, render: false, filter: false, blend: false, store: false};
    }
    return capabilities;
  }
}
