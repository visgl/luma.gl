/// <reference types="@webgpu/types" />

import type {
  DeviceProps,
  DeviceInfo,
  DeviceLimits,
  DeviceFeature,
  CanvasContextProps,
  BufferProps,
  SamplerProps,
  ShaderProps,
  TextureProps,
  RenderPipelineProps,
  FramebufferProps,
  TextureFormat
} from '@luma.gl/api';
import {Device, CanvasContext, log, cast} from '@luma.gl/api';
import WebGPUBuffer from './resources/webgpu-buffer';
import WebGPUTexture from './resources/webgpu-texture';
import WebGPUSampler from './resources/webgpu-sampler';
import WebGPUShader from './resources/webgpu-shader';
import WebGPURenderPipeline from './resources/webgpu-render-pipeline';
import WebGPUFramebuffer from './resources/webgpu-framebuffer';

import WebGPUCanvasContext from './webgpu-canvas-context';
// import {loadGlslangModule} from '../glsl/glslang';

/** WebGPU Device implementation */
export default class WebGPUDevice extends Device {
  readonly handle: GPUDevice;
  readonly adapter: GPUAdapter;
  readonly lost: Promise<{reason: 'destroyed', message: string}>;
  canvasContext: WebGPUCanvasContext | undefined;

  commandEncoder: GPUCommandEncoder;
  renderPass: GPURenderPassEncoder;

  private _renderPassDescriptor: GPURenderPassDescriptor;
  private _info: DeviceInfo;
  private _isLost: boolean = false;

  static type: string = 'webgpu';

  /** Check if WebGPU is available */
  static isSupported(): boolean {
    return Boolean(typeof navigator !== 'undefined' && navigator.gpu);
  }

  static async create(props: DeviceProps): Promise<WebGPUDevice> {
    if (!navigator.gpu) {
      throw new Error('WebGPU not available. Open in Chrome Canary and turn on chrome://flags/#enable-unsafe-webgpu');
    }
    log.groupCollapsed(1, 'WebGPUDevice created')();
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance"
      // forceSoftware: false
    });
    log.probe(1, "Adapter available")();

    const gpuDevice = await adapter.requestDevice({
      requiredFeatures: adapter.features as ReadonlySet<GPUFeatureName>,
      // TODO ensure we obtain best limits
      // requiredLimits: adapter.limits
    });
    log.probe(1, "GPUDevice available")();

    if (typeof props.canvas === 'string') {
      await CanvasContext.pageLoaded;
      log.probe(1, "DOM is loaded")();
    }

    const device = new WebGPUDevice(gpuDevice, adapter, props);
    log.probe(1, "Device created", device.info)();
    log.table(1, device.info)();
    log.groupEnd(1)();
    return device;
  }

  constructor(device: GPUDevice, adapter: GPUAdapter, props: DeviceProps) {
    super(props);
    this.handle = device;
    this.adapter = adapter;

    this._info = {
      type: 'webgpu',
      vendor: this.adapter.name,
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

    this.lost = this.handle.lost;
    this.lost.then(_ => {
      this._isLost = true;
    });

    // Note: WebGPU devices can be created without a canvas, for compute shader purposes
    if (props.canvas) {
      this.canvasContext = new WebGPUCanvasContext(this.handle, this.adapter, {canvas: props.canvas});
      // TODO - handle offscreen canvas?
      this.canvas = this.canvasContext.canvas as HTMLCanvasElement;
    }

    this.features = this._getFeatures();
  }

  // TODO
  // Load the glslang module now so that it is available synchronously when compiling shaders
  // const {glsl = true} = props;
  // this.glslang = glsl && await loadGlslangModule();

  destroy() {
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

  resize(options: any): void {
    this.canvasContext.update();
  }

  _createBuffer(props: BufferProps): WebGPUBuffer {
    return new WebGPUBuffer(this, props);
  }

  _createTexture(props: TextureProps): WebGPUTexture {
    return new WebGPUTexture(this, props);
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

  commit(): void {
    this.renderPass.endPass();
    const commandBuffer = this.commandEncoder.finish();
    this.handle.queue.submit([commandBuffer]);
    this.renderPass = null;
  }

  // WebGPU specifics

  /** 
   * Allows a render pass to begin against a canvas context
   * @todo need to support a "Framebuffer" equivalent (aka preconfigured RenderPassDescriptors?).
   */
  beginRenderPass(canvasContext?: CanvasContext): void {
    if (!this.renderPass) {
      this.commandEncoder = this.handle.createCommandEncoder();
      const renderPassDescriptor = this._updateRenderPassDescriptor(canvasContext || this.canvasContext);
      this.renderPass = this.commandEncoder.beginRenderPass(renderPassDescriptor);
    }
  }

  createCanvasContext(props?: CanvasContextProps): WebGPUCanvasContext {
    return new WebGPUCanvasContext(this.handle, this.adapter, props);
  }

  /** 
   * Gets active renderpass encoder. 
   * Creates a new encoder against default canvasContext if not already created 
   * @note Called internally by Model.
   */
  getActiveRenderPass(): GPURenderPassEncoder {
    this.beginRenderPass();
    return this.renderPass;
  }

  /** Initialize a dummy "framebuffer" */
  _initializeRenderPassDescriptor() {
    this._renderPassDescriptor = {
      colorAttachments: [{
        view: undefined, // Assigned later
        loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
        storeOp: 'store'
      }],

      depthStencilAttachment: {
        view: undefined, // Assigned later
        depthLoadValue: 1.0,
        depthStoreOp: "store",
        stencilLoadValue: 0,
        stencilStoreOp: "store",
      }
    };

    log.groupCollapsed(1, 'Device.GPURenderPassDescriptor')();
    log.probe(1, JSON.stringify(this._renderPassDescriptor, null, 2))();
    log.groupEnd(1)();
  }

  /** Update framebuffer with properly resized "swap chain" texture views */
  _updateRenderPassDescriptor(canvasContext: CanvasContext) {
    const webgpuCanvasContext = cast<WebGPUCanvasContext>(canvasContext);
    if (!this._renderPassDescriptor) {
      this._initializeRenderPassDescriptor();
    }
    const {colorAttachment, depthStencil} = webgpuCanvasContext.getRenderTargets();;
    this._renderPassDescriptor.colorAttachments[0].view = colorAttachment;
    this._renderPassDescriptor.depthStencilAttachment.view = depthStencil;
    return this._renderPassDescriptor;
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
}
