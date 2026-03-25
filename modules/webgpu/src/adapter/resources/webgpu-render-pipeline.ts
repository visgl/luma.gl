// luma.gl MIT license

import type {Bindings, BindingsByGroup, RenderPass, VertexArray} from '@luma.gl/core';
import {
  RenderPipeline,
  RenderPipelineProps,
  _getDefaultBindGroupFactory,
  log,
  normalizeBindingsByGroup
} from '@luma.gl/core';
import {applyParametersToRenderPipelineDescriptor} from '../helpers/webgpu-parameters';
import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import {getVertexBufferLayout} from '../helpers/get-vertex-buffer-layout';
// import {convertAttributesVertexBufferToLayout} from '../helpers/get-vertex-buffer-layout';
// import type {BufferAccessors} from './webgpu-pipeline';

import type {WebGPUDevice} from '../webgpu-device';
// import type {WebGPUBuffer} from './webgpu-buffer';
import type {WebGPUShader} from './webgpu-shader';
import type {WebGPURenderPass} from './webgpu-render-pass';

// RENDER PIPELINE

/** Creates a new render pipeline when parameters change */
export class WebGPURenderPipeline extends RenderPipeline {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderPipeline;
  readonly descriptor: GPURenderPipelineDescriptor | null;

  readonly vs: WebGPUShader;
  readonly fs: WebGPUShader | null = null;

  /** Compatibility path for direct pipeline.setBindings() usage */
  private _bindingsByGroup: BindingsByGroup;
  private _bindGroupCacheKeysByGroup: Partial<Record<number, object>> = {};

  override get [Symbol.toStringTag]() {
    return 'WebGPURenderPipeline';
  }

  constructor(device: WebGPUDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.shaderLayout ||= this.device.getShaderLayout((props.vs as WebGPUShader).source) || {
      attributes: [],
      bindings: []
    };
    this.handle = this.props.handle as GPURenderPipeline;
    let descriptor: GPURenderPipelineDescriptor | null = null;
    if (!this.handle) {
      descriptor = this._getRenderPipelineDescriptor();
      log.groupCollapsed(1, `new WebGPURenderPipeline(${this.id})`)();
      log.probe(1, JSON.stringify(descriptor, null, 2))();
      log.groupEnd(1)();

      this.device.pushErrorScope('validation');
      this.handle = this.device.handle.createRenderPipeline(descriptor);
      this.device.popErrorScope((error: GPUError) => {
        this.linkStatus = 'error';
        this.device.reportError(new Error(`${this} creation failed:\n"${error.message}"`), this)();
        this.device.debug();
      });
    }
    this.descriptor = descriptor;
    this.handle.label = this.props.id;
    this.linkStatus = 'success';

    // Note: Often the same shader in WebGPU
    this.vs = props.vs as WebGPUShader;
    this.fs = props.fs as WebGPUShader;
    this._bindingsByGroup =
      props.bindGroups || normalizeBindingsByGroup(this.shaderLayout, props.bindings);
    this._bindGroupCacheKeysByGroup = createBindGroupCacheKeys(this._bindingsByGroup);
  }

  override destroy(): void {
    // WebGPURenderPipeline has no destroy method.
    // @ts-expect-error
    this.handle = null;
  }

  /**
   * Compatibility shim for code paths that still set bindings on the pipeline.
   * The shared-model path passes bindings per draw and does not rely on this state.
   */
  setBindings(bindings: Bindings | BindingsByGroup): void {
    const nextBindingsByGroup = normalizeBindingsByGroup(this.shaderLayout, bindings);
    for (const [groupKey, groupBindings] of Object.entries(nextBindingsByGroup)) {
      const group = Number(groupKey);
      for (const [name, binding] of Object.entries(groupBindings || {})) {
        const currentGroupBindings = this._bindingsByGroup[group] || {};
        if (currentGroupBindings[name] !== binding) {
          if (
            !this._bindingsByGroup[group] ||
            this._bindingsByGroup[group] === currentGroupBindings
          ) {
            this._bindingsByGroup[group] = {...currentGroupBindings};
          }
          this._bindingsByGroup[group][name] = binding;
          this._bindGroupCacheKeysByGroup[group] = {};
        }
      }
    }
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
    bindings?: Bindings;
    bindGroups?: BindingsByGroup;
    _bindGroupCacheKeys?: Partial<Record<number, object>>;
    uniforms?: Record<string, unknown>;
  }): boolean {
    if (this.isErrored) {
      log.info(2, `RenderPipeline:${this.id}.draw() aborted - pipeline initialization failed`)();
      return false;
    }

    const webgpuRenderPass = options.renderPass as WebGPURenderPass;
    const instanceCount =
      options.instanceCount && options.instanceCount > 0 ? options.instanceCount : 1;

    // Set pipeline
    this.device.pushErrorScope('validation');
    webgpuRenderPass.handle.setPipeline(this.handle);
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} setPipeline failed:\n"${error.message}"`), this)();
      this.device.debug();
    });

    // Set bindings (uniform buffers, textures etc)
    const hasExplicitBindings = Boolean(options.bindGroups || options.bindings);
    const bindGroups = _getDefaultBindGroupFactory(this.device).getBindGroups(
      this,
      hasExplicitBindings ? options.bindGroups || options.bindings : this._bindingsByGroup,
      hasExplicitBindings ? options._bindGroupCacheKeys : this._bindGroupCacheKeysByGroup
    );
    for (const [group, bindGroup] of Object.entries(bindGroups)) {
      if (bindGroup) {
        webgpuRenderPass.handle.setBindGroup(Number(group), bindGroup as GPUBindGroup);
      }
    }

    // Set attributes
    // Note: Rebinds constant attributes before each draw call
    options.vertexArray.bindBeforeRender(options.renderPass);

    // Draw
    if (options.indexCount) {
      webgpuRenderPass.handle.drawIndexed(
        options.indexCount,
        instanceCount,
        options.firstIndex || 0,
        options.baseVertex || 0,
        options.firstInstance || 0
      );
    } else {
      webgpuRenderPass.handle.draw(
        options.vertexCount || 0,
        instanceCount,
        options.firstVertex || 0,
        options.firstInstance || 0
      );
    }

    // Note: Rebinds constant attributes before each draw call
    options.vertexArray.unbindAfterRender(options.renderPass);

    return true;
  }

  _getBindingsByGroupWebGPU(): BindingsByGroup {
    return this._bindingsByGroup;
  }

  _getBindGroupCacheKeysWebGPU(): Partial<Record<number, object>> {
    return this._bindGroupCacheKeysByGroup;
  }

  /**
   * Populate the complex WebGPU GPURenderPipelineDescriptor
   */
  protected _getRenderPipelineDescriptor() {
    // Set up the vertex stage
    const vertex: GPUVertexState = {
      module: (this.props.vs as WebGPUShader).handle,
      entryPoint: this.props.vertexEntryPoint || 'main',
      buffers: getVertexBufferLayout(this.shaderLayout, this.props.bufferLayout, {
        pipelineId: this.id
      })
    };

    // Populate color targets
    // TODO - at the moment blend and write mask are only set on the first target
    const targets: (GPUColorTargetState | null)[] = [];
    if (this.props.colorAttachmentFormats) {
      for (const format of this.props.colorAttachmentFormats) {
        targets.push(format ? {format: getWebGPUTextureFormat(format)} : null);
      }
    } else {
      targets.push({format: getWebGPUTextureFormat(this.device.preferredColorFormat)});
    }

    // Set up the fragment stage
    const fragment: GPUFragmentState = {
      module: (this.props.fs as WebGPUShader).handle,
      entryPoint: this.props.fragmentEntryPoint || 'main',
      targets
    };

    const layout = this.device.createPipelineLayout({
      shaderLayout: this.shaderLayout
    });

    // Create a partially populated descriptor
    const descriptor: GPURenderPipelineDescriptor = {
      vertex,
      fragment,
      primitive: {
        topology: this.props.topology
      },
      layout: layout.handle
    };

    // Set depth format if required, defaulting to the preferred depth format
    const depthFormat = this.props.depthStencilAttachmentFormat || this.device.preferredDepthFormat;

    if (this.props.parameters.depthWriteEnabled) {
      descriptor.depthStencil = {
        format: getWebGPUTextureFormat(depthFormat)
      };
    }

    // Set parameters on the descriptor
    applyParametersToRenderPipelineDescriptor(descriptor, this.props.parameters);

    return descriptor;
  }
}

function createBindGroupCacheKeys(
  bindingsByGroup: BindingsByGroup
): Partial<Record<number, object>> {
  const bindGroupCacheKeys: Partial<Record<number, object>> = {};
  for (const [groupKey, groupBindings] of Object.entries(bindingsByGroup)) {
    if (groupBindings && Object.keys(groupBindings).length > 0) {
      bindGroupCacheKeys[Number(groupKey)] = {};
    }
  }
  return bindGroupCacheKeys;
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
      const attribute = this.shaderLayout.attributes.find(
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
