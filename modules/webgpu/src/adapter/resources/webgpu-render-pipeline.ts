// luma.gl MIT license

import type {Bindings, BindingsByGroup, RenderPass, VertexArray} from '@luma.gl/core';
import {RenderPipeline, RenderPipelineProps, log, normalizeBindingsByGroup} from '@luma.gl/core';
import {applyParametersToRenderPipelineDescriptor} from '../helpers/webgpu-parameters';
import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import {getBindGroup} from '../helpers/get-bind-group';
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
  /** For internal use to create BindGroups */
  private _bindGroupLayouts: Partial<Record<number, GPUBindGroupLayout>> = {};
  private _bindGroups: Partial<Record<number, GPUBindGroup | null>> = {};

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
        this.device.reportError(new Error(`${this} creation failed:\n"${error.message}"`), this)();
        this.device.debug();
      });
    }
    this.descriptor = descriptor;
    this.handle.label = this.props.id;

    // Note: Often the same shader in WebGPU
    this.vs = props.vs as WebGPUShader;
    this.fs = props.fs as WebGPUShader;
    this._bindingsByGroup =
      props.bindGroups || normalizeBindingsByGroup(this.shaderLayout, props.bindings);
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
          this._bindGroups[group] = null;
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
    uniforms?: Record<string, unknown>;
  }): boolean {
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
    const bindGroups = this._getBindGroups(options.bindGroups || options.bindings);
    for (const [group, bindGroup] of Object.entries(bindGroups)) {
      if (bindGroup) {
        webgpuRenderPass.handle.setBindGroup(Number(group), bindGroup);
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

  /** Return a bind group created by setBindings */
  _getBindGroups(
    bindings?: Bindings | BindingsByGroup
  ): Partial<Record<number, GPUBindGroup | null>> {
    if (this.shaderLayout.bindings.length === 0) {
      return {};
    }

    const bindGroups = bindings
      ? normalizeBindingsByGroup(this.shaderLayout, bindings)
      : this._bindingsByGroup;
    const groups = getBindGroupIndicesUpToMax(this.shaderLayout.bindings);
    const resolvedBindGroups: Partial<Record<number, GPUBindGroup | null>> = {};

    for (const group of groups) {
      const groupBindings = bindGroups[group];
      this._bindGroupLayouts[group] ||= this.handle.getBindGroupLayout(group);

      if (!groupBindings || Object.keys(groupBindings).length === 0) {
        if (!hasBindingsInGroup(this.shaderLayout.bindings, group)) {
          resolvedBindGroups[group] = this._getEmptyBindGroup(group);
        }
        continue;
      }

      if (bindings) {
        resolvedBindGroups[group] = getBindGroup(
          this.device,
          this._bindGroupLayouts[group],
          this.shaderLayout,
          groupBindings,
          group
        );
      } else {
        this._bindGroups[group] =
          this._bindGroups[group] ||
          getBindGroup(
            this.device,
            this._bindGroupLayouts[group],
            this.shaderLayout,
            groupBindings,
            group
          );
        resolvedBindGroups[group] = this._bindGroups[group];
      }
    }

    return resolvedBindGroups;
  }

  _getBindGroup(bindings?: Bindings | BindingsByGroup, group: number = 0): GPUBindGroup | null {
    return this._getBindGroups(bindings)[group] || null;
  }

  private _getEmptyBindGroup(group: number): GPUBindGroup {
    const cachedBindGroup = this._bindGroups[group];
    if (cachedBindGroup) {
      return cachedBindGroup;
    }

    const bindGroupLayout = this._bindGroupLayouts[group] || this.handle.getBindGroupLayout(group);
    this._bindGroupLayouts[group] = bindGroupLayout;
    const bindGroup = this.device.handle.createBindGroup({
      label: `${this.id}-empty-bind-group-${group}`,
      layout: bindGroupLayout,
      entries: []
    });
    this._bindGroups[group] = bindGroup;
    return bindGroup;
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

function getBindGroupIndicesUpToMax(
  bindings: RenderPipeline['shaderLayout']['bindings']
): number[] {
  const maxGroup = bindings.reduce(
    (highestGroup, binding) => Math.max(highestGroup, binding.group),
    -1
  );
  return Array.from({length: maxGroup + 1}, (_, group) => group);
}

function hasBindingsInGroup(
  bindings: RenderPipeline['shaderLayout']['bindings'],
  group: number
): boolean {
  return bindings.some(binding => binding.group === group);
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
