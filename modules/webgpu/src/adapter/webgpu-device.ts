import type {
  DeviceProps,
  DeviceInfo,
  DeviceLimits,
  CanvasContext,
  CanvasContextProps,
  BufferProps,
  SamplerProps,
  ShaderProps,
  TextureProps,
  RenderPipelineProps
} from '@luma.gl/api';
import {Device, log, cast} from '@luma.gl/api';
import WebGPUBuffer from './resources/webgpu-buffer';
import WebGPUTexture from './resources/webgpu-texture';
import WebGPUSampler from './resources/webgpu-sampler';
import WebGPUShader from './resources/webgpu-shader';
import WebGPURenderPipeline from './resources/webgpu-render-pipeline';

import WebGPUCanvasContext from './webgpu-canvas-context';
// import {loadGlslangModule} from '../glsl/glslang';

type Feature = string;

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

  /** Check if WebGPU is available */
  static isSupported(): boolean {
    return Boolean(typeof navigator !== 'undefined' && navigator.gpu);
  }

  static async create(props) {
    if (!navigator.gpu) {
      throw new Error('WebGPU not available. Use Chrome Canary and turn on chrome://flags/#enable-unsafe-webgpu');
    }
    log.groupCollapsed(1, 'Creating device')();
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance"
    });
    log.log(1, "Adapter available")();
    const gpuDevice = await adapter.requestDevice();
    log.log(1, "GPUDevice available")();
    const device = new WebGPUDevice(gpuDevice, adapter, props);
    log.log(1, "Device created", device.info)();
    log.groupEnd(1)();
    return device;
  }

  constructor(device: GPUDevice, adapter: GPUAdapter, props: DeviceProps) {
    super();
    this.handle = device;
    this.adapter = adapter;

    this._info = {
      type: 'webgpu',
      vendor: this.adapter.name,
      renderer: '',
      version: '',
      gpuVendor: 'UNKNOWN', // 'NVIDIA' | 'AMD' | 'INTEL' | 'APPLE' | 'UNKNOWN',
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

  get features(): Set<Feature> {
    // TODO not efficient
    return new Set<Feature>(this.handle.features).add('webgpu');
  }

  get limits(): DeviceLimits {
    return this.handle.limits;
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

  createTexture(props: TextureProps): WebGPUTexture {
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
    log.log(1, JSON.stringify(this._renderPassDescriptor, null, 2))();
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
}
