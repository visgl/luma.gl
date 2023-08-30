// luma.gl MIT license

import type {TypedArray, Binding, UniformValue, RenderPass} from '@luma.gl/core';
import {Buffer, RenderPipeline, RenderPipelineProps, cast, log, isObjectEmpty} from '@luma.gl/core';
import {applyParametersToRenderPipelineDescriptor} from '../helpers/webgpu-parameters';
import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import {getBindGroup} from '../helpers/get-bind-group';
import {getVertexBufferLayout, getBufferSlots} from '../helpers/get-vertex-buffer-layout';
// import {convertAttributesVertexBufferToLayout} from '../helpers/get-vertex-buffer-layout';
// import {mapAccessorToWebGPUFormat} from './helpers/accessor-to-format';
// import type {BufferAccessors} from './webgpu-pipeline';

import type {WebGPUDevice} from '../webgpu-device';
import type {WebGPUBuffer} from './webgpu-buffer';
import type {WebGPUShader} from './webgpu-shader';
import type {WebGPURenderPass} from './webgpu-render-pass';

// RENDER PIPELINE

/** Creates a new render pipeline when parameters change */
export class WebGPURenderPipeline extends RenderPipeline {
  device: WebGPUDevice;
  handle: GPURenderPipeline;

  vs: WebGPUShader;
  fs: WebGPUShader | null = null;

  private _bufferSlots: Record<string, number>;
  private _buffers: Buffer[];
  private _indexBuffer: WebGPUBuffer | null = null;
  // private _firstIndex: number;
  // private _lastIndex: number;

  /** For internal use to create BindGroups */
  private _bindGroupLayout: GPUBindGroupLayout;
  private _bindGroup: GPUBindGroup | null = null;

  constructor(device: WebGPUDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = (this.props.handle as GPURenderPipeline) || this.createHandle();
    this.handle.label = this.props.id;

    this.vs = cast<WebGPUShader>(props.vs);
    this.fs = cast<WebGPUShader>(props.fs);

    this._bufferSlots = getBufferSlots(this.props.shaderLayout, this.props.bufferLayout);
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

  override destroy(): void {
    // WebGPURenderPipeline has no destroy method.
  }

  setIndexBuffer(indexBuffer: Buffer): void {
    this._indexBuffer = cast<WebGPUBuffer>(indexBuffer);
  }

  setAttributes(attributes: Record<string, Buffer | TypedArray | null>): void {
    for (const [name, value] of Object.entries(attributes)) {
      if (ArrayBuffer.isView(value)) {
        throw new Error('not implemented');
      }

      const bufferIndex = this._bufferSlots[name];
      if (bufferIndex >= 0) {
        this._buffers[bufferIndex] = value;
      } else {
        throw new Error(
          `Setting attribute '${name}' not listed in shader layout for program ${this.id}`
        );
      }
    }
  }

  setBindings(bindings: Record<string, Binding>): void {
    if (!isObjectEmpty(this.props.bindings)) {
      Object.assign(this.props.bindings, bindings);
      // Set up the bindings
      this._bindGroup = getBindGroup(
        this.device.handle,
        this._bindGroupLayout,
        this.props.shaderLayout,
        this.props.bindings
      );
    }
  }

  setUniforms(uniforms: Record<string, UniformValue>): void {
    if (!isObjectEmpty(uniforms)) {
      throw new Error('WebGPU does not support uniforms');
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
      buffers: getVertexBufferLayout(this.props.shaderLayout, this.props.bufferLayout)
    };

    // Set up the fragment stage
    let fragment: GPUFragmentState | undefined;
    if (this.props.fs) {
      fragment = {
        module: cast<WebGPUShader>(this.props.fs).handle,
        entryPoint: this.props.fsEntryPoint || 'main',
        targets: [
          {
            // TODO exclamation mark hack!
            format: getWebGPUTextureFormat(this.device?.canvasContext?.format)
          }
        ]
      };
    }

    // WebGPU has more restrictive topology support than WebGL
    switch (this.props.topology) {
      case 'triangle-fan-webgl':
      case 'line-loop-webgl':
        throw new Error(`WebGPU does not support primitive topology ${this.props.topology}`);
      default:
    }

    // Create a partially populated descriptor
    const descriptor: GPURenderPipelineDescriptor = {
      vertex,
      fragment,
      primitive: {
        topology: this.props.topology
      },
      layout: 'auto'
    };

    // Set parameters on the descriptor
    applyParametersToRenderPipelineDescriptor(descriptor, this.props.parameters);

    return descriptor;
  }

  draw(options: {
    renderPass?: RenderPass;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
  }): void {
    const webgpuRenderPass: WebGPURenderPass =
      cast<WebGPURenderPass>(options.renderPass) || this.device.getDefaultRenderPass();

    // Set pipeline
    webgpuRenderPass.handle.setPipeline(this.handle);

    // Set bindings (uniform buffers, textures etc)
    const bindGroup = this._getBindGroup();
    if (bindGroup) {
      webgpuRenderPass.handle.setBindGroup(0, bindGroup);
    }

    // Set attributes
    this._setAttributeBuffers(webgpuRenderPass);

    // Draw
    if (options.indexCount) {
      webgpuRenderPass.handle.drawIndexed(
        options.indexCount,
        options.instanceCount,
        options.firstIndex,
        options.baseVertex,
        options.firstInstance
      );
    } else {
      webgpuRenderPass.handle.draw(
        options.vertexCount || 0,
        options.instanceCount,
        options.firstIndex,
        options.firstInstance
      );
    }
  }

  _setAttributeBuffers(webgpuRenderPass: WebGPURenderPass) {
    if (this._indexBuffer) {
      webgpuRenderPass.handle.setIndexBuffer(this._indexBuffer.handle, this._indexBuffer.props.indexType);
    }

    const buffers = this._getBuffers();
    for (let i = 0; i < buffers.length; ++i) {
      const buffer = cast<WebGPUBuffer>(buffers[i]);
      if (!buffer) {
        const attribute = this.props.shaderLayout.attributes.find(
          (attribute) => attribute.location === i
        );
        throw new Error(
          `No buffer provided for attribute '${attribute?.name || ''}' in Model '${this.props.id}'`
        );
      }
      webgpuRenderPass.handle.setVertexBuffer(i, buffer.handle);
    }

    // TODO - HANDLE buffer maps
    /*
    for (const [bufferName, attributeMapping] of Object.entries(this.props.bufferLayout)) {
      const buffer = cast<WebGPUBuffer>(this.props.attributes[bufferName]);
      if (!buffer) {
        log.warn(`Missing buffer for buffer map ${bufferName}`)();
        continue;
      }

      if ('location' in attributeMapping) {
        // @ts-expect-error TODO model must not depend on webgpu
        renderPass.handle.setVertexBuffer(layout.location, buffer.handle);
      } else {
        for (const [bufferName, mapping] of Object.entries(attributeMapping)) {
          // @ts-expect-error TODO model must not depend on webgpu
          renderPass.handle.setVertexBuffer(field.location, buffer.handle);
        }
      }
    }
    */
  }
}
