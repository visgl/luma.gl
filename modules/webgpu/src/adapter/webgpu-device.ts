import {
  Device,
  // DeviceProps,
  DeviceInfo,
  DeviceLimits,
  BufferProps,
  SamplerProps,
  ShaderProps,
  TextureProps,
  RenderPipelineProps,
  // ComputePipelineProps,
  assert,
  log
} from '@luma.gl/api';
// import type {
//   CopyBufferToBufferOptions,
//   CopyBufferToTextureOptions,
//   CopyTextureToBufferOptions,
//   CopyTextureToTextureOptions
// } from '@luma.gl/api';
import WebGPUBuffer from './resources/webgpu-buffer';
import WebGPUTexture from './resources/webgpu-texture';
import WebGPUSampler from './resources/webgpu-sampler';
import WebGPUShader from './resources/webgpu-shader';
import WebGPURenderPipeline from './resources/webgpu-render-pipeline';
// import WebGPUComputePipeline from './webgpu-compute-pipeline';

// import {loadGlslangModule} from '../glsl/glslang';

type Feature = string;

type DeviceProps = {
  canvas: HTMLCanvasElement
};

/** */
export default class WebGPUDevice extends Device {
  readonly handle: GPUDevice;
  readonly adapter: GPUAdapter;
  readonly context: GPUCanvasContext;
  // readonly swapChain: GPUSwapChain;
  readonly presentationFormat: GPUTextureFormat;
  presentationSize = [1, 1];
  private _renderPassDescriptor: GPURenderPassDescriptor;
  private _info: DeviceInfo;

  static isSupported(): boolean {
    return true;
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

    // Configure swap chain
    assert(props.canvas);
    this.context = props.canvas.getContext('webgpu') as GPUCanvasContext;
    this.presentationFormat = this.context.getPreferredFormat(this.adapter);

    const devicePixelRatio = window.devicePixelRatio || 1;
    this.presentationSize = [
      props.canvas.clientWidth * devicePixelRatio,
      props.canvas.clientHeight * devicePixelRatio,
    ];

    this.context.configure({
      device,
      format: this.presentationFormat,
      size: this.presentationSize,
    });
  }

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
  // createComputePipeline(props: ComputePipelineProps): WebGPUComputePipeline {
  //   return new WebGPUComputePipeline(this, props);
  // }

  commandEncoder: GPUCommandEncoder;
  renderPass: GPURenderPassEncoder;

  beginRenderPass(): GPURenderPassEncoder {
    if (!this.renderPass) {
      this.commandEncoder = this.handle.createCommandEncoder();
      const renderPassDescriptor = this._updateRenderPassDescriptor();
      this.renderPass = this.commandEncoder.beginRenderPass(renderPassDescriptor);
    }
    return this.renderPass;
  }

  submit(): void {
    this.renderPass.endPass();
    const commandBuffer = this.commandEncoder.finish();
    this.handle.queue.submit([commandBuffer]);
    this.renderPass = null;
  }

  getActiveRenderPass(): GPURenderPassEncoder {
    return this.beginRenderPass()
  }

  // TODO: Possible to support multiple canvases with one device?
  _initializeRenderPassDescriptor() {
    const depthTexture = this.createTexture({
      width: this.presentationSize[0],
      height: this.presentationSize[1],
      depth: 1,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    const depthStencilAttachment = depthTexture.handle.createView();
    depthStencilAttachment.label = 'depth-stencil-attachment';

    this._renderPassDescriptor = {
      colorAttachments: [{
        view: undefined, // Assigned later
        loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
        storeOp: 'store'
      }],

      depthStencilAttachment: {
        view: depthStencilAttachment,
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

  _updateRenderPassDescriptor() {
    if (!this._renderPassDescriptor) {
      this._initializeRenderPassDescriptor();
    }
    const textureView = this.context.getCurrentTexture().createView();
    this._renderPassDescriptor.colorAttachments[0].view = textureView;
    return this._renderPassDescriptor;
  }
}

/** WebGPU Device implementation
export default class WebGPUDevice2 {
  static isSupported() {
    // Node.js
    if (typeof navigator === 'undefined') {
      return false;
    }

    // @ts-ignore
    const {gpu} = navigator;

    return Boolean(gpu);
  }

  static async create(props = {}) {
    const {glsl = true} = props;

    // @ts-ignore
    const {gpu} = navigator;

    const adapter = await gpu.requestAdapter();
    const device = await adapter.requestDevice();

    // Load the glslang module now so that it is available synchronously when compiling shaders
    this.glslang = glsl && await loadGlslangModule();

    return new WebGPUDevice(device, props);
  }

  static attach(device, props = {}) {
    return new WebGPUDevice(device, props);
  }

  constructor(device, props = {}) {
    const {presentation = "bgra8unorm"} = props;

    this.device = device;

    // TODO should we maintain the swapchain here or in the AnimationLoop?
    this.canvas = canvas;
    this.context = this.canvas.getContext("gpupresent");
    this.swapChain = this.context.configureSwapChain({
      device: this.device,
      presentation,
    });
  }

  resize(width, height) {
    console.warn('WebGPUDevice::resize() not implemented');
  }

  // PRIVATE

  // Support for animationLoop / model
  _startFrame() {
    this.commandEncoder = this.device.createCommandEncoder();
    const textureView = this.swapChain.getCurrentTexture().createView();

    /* @type {GPURenderPassDescriptor} *
    const renderPassDescriptor = {
      colorAttachments: [
        {
          attachment: textureView,
          // TODO - is this clear color?
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        },
      ],
    };

    this.passEncoder = this.commandEncoder.beginRenderPass(renderPassDescriptor);
  }

  _draw(pipeline) {
    this.passEncoder.setPipeline(pipeline);
    this.passEncoder.draw(3, 1, 0, 0);
  }

  _endFrame() {
    this.passEncoder.endPass();
    this.device.defaultQueue.submit([this.commandEncoder.finish()]);
  }
}
*/