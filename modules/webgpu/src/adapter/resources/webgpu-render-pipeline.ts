// luma.gl MIT license

import type {Binding, RenderPass, VertexArray} from '@luma.gl/core';
import {RenderPipeline, RenderPipelineProps, log} from '@luma.gl/core';
import {applyParametersToRenderPipelineDescriptor} from '../helpers/webgpu-parameters';
import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import {getBindGroup} from '../helpers/get-bind-group';
import {getVertexBufferLayout} from '../helpers/get-vertex-buffer-layout';
// import {convertAttributesVertexBufferToLayout} from '../helpers/get-vertex-buffer-layout';
// import {mapAccessorToWebGPUFormat} from './helpers/accessor-to-format';
// import type {BufferAccessors} from './webgpu-pipeline';

import type {WebGPUDevice} from '../webgpu-device';
// import type {WebGPUBuffer} from './webgpu-buffer';
import type {WebGPUShader} from './webgpu-shader';
import type {WebGPURenderPass} from './webgpu-render-pass';

// RENDER PIPELINE

/** Creates a new render pipeline when parameters change */
export class WebGPURenderPipeline extends RenderPipeline {
  device: WebGPUDevice;
  handle: GPURenderPipeline;

  vs: WebGPUShader;
  fs: WebGPUShader | null = null;

  /** For internal use to create BindGroups */
  private _bindings: Record<string, Binding>;
  private _bindGroupLayout: GPUBindGroupLayout | null = null;
  private _bindGroup: GPUBindGroup | null = null;

  constructor(device: WebGPUDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle as GPURenderPipeline;
    if (!this.handle) {
      const descriptor = this._getRenderPipelineDescriptor();
      log.groupCollapsed(1, `new WebGPURenderPipeline(${this.id})`)();
      log.probe(1, JSON.stringify(descriptor, null, 2))();
      log.groupEnd(1)();
      this.handle = this.device.handle.createRenderPipeline(descriptor);
    }
    this.handle.label = this.props.id;

    this.vs = props.vs as WebGPUShader;
    this.fs = props.fs as WebGPUShader;

    this._bindings = {...this.props.bindings};
  }

  override destroy(): void {
    // WebGPURenderPipeline has no destroy method.
    this.handle = null;
  }

  /**
   * @todo Use renderpass.setBindings() ?
   * @todo Do we want to expose BindGroups in the API and remove this?
   */
  setBindings(bindings: Record<string, Binding>): void {
    Object.assign(this._bindings, bindings);
  }

  /** @todo - should this be moved to renderpass? */
  draw(options: {
    renderPass: RenderPass;
    vertexArray: VertexArray;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
  }): boolean {
    const webgpuRenderPass = options.renderPass as WebGPURenderPass;

    // Set pipeline
    webgpuRenderPass.handle.setPipeline(this.handle);

    // Set bindings (uniform buffers, textures etc)
    const bindGroup = this._getBindGroup();
    if (bindGroup) {
      webgpuRenderPass.handle.setBindGroup(0, bindGroup);
    }

    // Set attributes
    // Note: Rebinds constant attributes before each draw call
    options.vertexArray.bindBeforeRender(options.renderPass);

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
        options.instanceCount || 1, // If 0, nothing will be drawn
        options.firstInstance
      );
    }

    // Note: Rebinds constant attributes before each draw call
    options.vertexArray.unbindAfterRender(options.renderPass);

    return true;
  }

  /** Return a bind group created by setBindings */
  _getBindGroup() {
    if (this.props.shaderLayout.bindings.length === 0) {
      return null;
    }

    // Get hold of the bind group layout. We don't want to do this unless we know there is at least one bind group
    this._bindGroupLayout = this._bindGroupLayout || this.handle.getBindGroupLayout(0);

    // Set up the bindings
    // TODO what if bindings change? We need to rebuild the bind group!
    this._bindGroup =
      this._bindGroup ||
      getBindGroup(
        this.device.handle,
        this._bindGroupLayout,
        this.props.shaderLayout,
        this._bindings
      );

    return this._bindGroup;
  }

  /**
   * Populate the complex WebGPU GPURenderPipelineDescriptor
   */
  protected _getRenderPipelineDescriptor() {
    // Set up the vertex stage
    const vertex: GPUVertexState = {
      module: (this.props.vs as WebGPUShader).handle,
      entryPoint: this.props.vertexEntryPoint || 'main',
      buffers: getVertexBufferLayout(this.props.shaderLayout, this.props.bufferLayout)
    };

    // Set up the fragment stage
    const fragment: GPUFragmentState = {
      module: (this.props.fs as WebGPUShader).handle,
      entryPoint: this.props.fragmentEntryPoint || 'main',
      targets: [
        {
          // TODO exclamation mark hack!
          format: getWebGPUTextureFormat(this.device?.canvasContext?.format)
        }
      ]
    };

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
}
/**
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
  *
}
*/
