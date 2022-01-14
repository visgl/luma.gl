import type {Binding} from '@luma.gl/api';
import {Buffer, RenderPipeline, RenderPipelineProps, assert, cast, log, isObjectEmpty} from '@luma.gl/api';
import {applyParametersToRenderPipelineDescriptor} from '../helpers/webgpu-parameters';
import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import {getBindGroup} from '../helpers/get-bind-group';
import {getVertexBufferLayout, getBufferSlots} from '../helpers/get-vertex-buffer-layout';
// import {convertAttributesVertexBufferToLayout} from '../helpers/get-vertex-buffer-layout';
// import {mapAccessorToWebGPUFormat} from './helpers/accessor-to-format';
// import type {BufferAccessors} from './webgpu-pipeline';

import type WebGPUDevice from '../webgpu-device';
import WebGPUShader from './webgpu-shader';

// RENDER PIPELINE

/** Creates a new render pipeline when parameters change */
export default class WebGPURenderPipeline extends RenderPipeline {
  device: WebGPUDevice;
  handle: GPURenderPipeline;

  private _bufferSlots: Record<string, number>;
  private _buffers: Buffer[];
  /** For internal use to create BindGroups */
  private _bindGroupLayout: GPUBindGroupLayout;
  private _bindGroup: GPUBindGroup = null;

  constructor(device: WebGPUDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle as GPURenderPipeline || this.createHandle();
    this.handle.label = this.props.id;

    this._bufferSlots = getBufferSlots(this.props.layout, this.props.bufferMap);
    this._buffers = new Array<Buffer>(Object.keys(this._bufferSlots).length).fill(null);
    this._bindGroupLayout = this.handle.getBindGroupLayout(0);
  }

  protected createHandle(): GPURenderPipeline {
    const descriptor = this._getRenderPipelineDescriptor();
    const renderPipeline = this.device.handle.createRenderPipeline(descriptor);
    log.groupCollapsed(1, `new WebGPRenderPipeline(${this.id})`)();
    log.log(1, JSON.stringify(descriptor, null, 2))();
    log.groupEnd(1)();
    return renderPipeline;
  }

  destroy() {
    // WebGPURenderPipeline has no destroy method.
  }

  setAttributes(attributes: Record<string, Buffer>): void {
    for (const [name, buffer] of Object.entries(attributes)) {
      const bufferIndex = this._bufferSlots[name];
      if (bufferIndex >= 0) {
        this._buffers[bufferIndex] = buffer
      }
    }
    // for (let i = 0; i < this._bufferSlots.length; ++i) {
    //   const bufferName = this._bufferSlots[i];
    //   if (attributes[bufferName]) {
    //     this.handle
    //   }
    // }
  }

  /** Set the bindings */
  setBindings(bindings: Record<string, Binding>): void {
    if (!isObjectEmpty(this.props.bindings)) {
      Object.assign(this.props.bindings, bindings);
      // Set up the bindings
      this._bindGroup = getBindGroup(
        this.device.handle,
        this._bindGroupLayout,
        this.props.layout,
        this.props.bindings
      );
    }
  }

  _getBuffers() {
    return this._buffers;
  }

  /** Return a bind group created by setBindings */
  _getBindGroup() {
    // assert(this._bindGroup);
    return this._bindGroup;
  }

  /** Populate the complex WebGPU GPURenderPipelineDescriptor */
  protected _getRenderPipelineDescriptor() {
    // Set up the vertex stage
    const vertex: GPUVertexState = {
      module: cast<WebGPUShader>(this.props.vs).handle,
      entryPoint: this.props.vsEntryPoint || 'main',
      buffers: getVertexBufferLayout(this.props.layout, this.props.bufferMap)
    };

    // Set up the fragment stage
    let fragment: GPUFragmentState | undefined;
    if (this.props.fs) {
      fragment = {
        module: cast<WebGPUShader>(this.props.fs).handle,
        entryPoint: this.props.fsEntryPoint || 'main',
        targets: [
          {
            format: getWebGPUTextureFormat(this.device.canvasContext.format),
          }
        ]
      };
    }

    // Create a partially populated descriptor
    let descriptor: GPURenderPipelineDescriptor = {
      vertex,
      fragment,
      primitive: {
        topology: this.props.topology
      }
    };

    // Set parameters on the descriptor
    applyParametersToRenderPipelineDescriptor(descriptor, this.props.parameters);

    return descriptor;
  }
}
