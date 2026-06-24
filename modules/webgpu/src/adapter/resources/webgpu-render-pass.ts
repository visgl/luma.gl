// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, NumberArray4} from '@math.gl/types';
import type {
  RenderBundle,
  RenderPassProps,
  RenderPassParameters,
  RenderPassBindingOptions,
  RenderPassDrawOptions,
  Bindings,
  BindingsByGroup,
  VertexArray
} from '@luma.gl/core';
import {Buffer, RenderPass, RenderPipeline, _getDefaultBindGroupFactory, log} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
// import {WebGPUCommandEncoder} from './webgpu-command-encoder';
import {WebGPURenderPipeline} from './webgpu-render-pipeline';
import {WebGPUQuerySet} from './webgpu-query-set';
import {WebGPUFramebuffer} from './webgpu-framebuffer';
import {WebGPURenderBundle} from './webgpu-render-bundle';
import {getCpuHotspotProfiler, getTimestamp} from '../helpers/cpu-hotspot-profiler';

export class WebGPURenderPass extends RenderPass {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderPassEncoder;
  readonly framebuffer: WebGPUFramebuffer;

  /** Active pipeline */
  pipeline: WebGPURenderPipeline | null = null;

  /** Latest bindings applied to this pass */
  bindings: Bindings | BindingsByGroup = {};
  private bindingsPipeline: WebGPURenderPipeline | null = null;

  /** Vertex array used by subsequent draw commands. */
  vertexArray: VertexArray | null = null;

  constructor(
    device: WebGPUDevice,
    props: RenderPassProps = {},
    commandEncoder: GPUCommandEncoder = device.commandEncoder.handle
  ) {
    super(device, props);
    this.device = device;
    const {props: renderPassProps} = this;
    this.framebuffer =
      (renderPassProps.framebuffer as WebGPUFramebuffer) ||
      device.getCanvasContext().getCurrentFramebuffer();

    const profiler = getCpuHotspotProfiler(this.device);
    if (profiler) {
      const counterName:
        | 'explicitFramebufferRenderPassCount'
        | 'defaultFramebufferRenderPassCount' = renderPassProps.framebuffer
        ? 'explicitFramebufferRenderPassCount'
        : 'defaultFramebufferRenderPassCount';
      profiler[counterName] = (profiler[counterName] || 0) + 1;
    }

    const startTime = profiler ? getTimestamp() : 0;
    try {
      const descriptorAssemblyStartTime = profiler ? getTimestamp() : 0;
      const renderPassDescriptor = this.getRenderPassDescriptor(this.framebuffer);

      if (renderPassProps.occlusionQuerySet) {
        renderPassDescriptor.occlusionQuerySet = (
          renderPassProps.occlusionQuerySet as WebGPUQuerySet
        ).handle;
      }

      if (renderPassProps.timestampQuerySet) {
        const webgpuTSQuerySet = renderPassProps.timestampQuerySet as WebGPUQuerySet;
        webgpuTSQuerySet?._invalidateResults();
        renderPassDescriptor.timestampWrites = webgpuTSQuerySet
          ? ({
              querySet: webgpuTSQuerySet.handle,
              beginningOfPassWriteIndex: renderPassProps.beginTimestampIndex,
              endOfPassWriteIndex: renderPassProps.endTimestampIndex
            } as GPURenderPassTimestampWrites)
          : undefined;
      }
      if (profiler) {
        profiler.renderPassDescriptorAssemblyCount =
          (profiler.renderPassDescriptorAssemblyCount || 0) + 1;
        profiler.renderPassDescriptorAssemblyTimeMs =
          (profiler.renderPassDescriptorAssemblyTimeMs || 0) +
          (getTimestamp() - descriptorAssemblyStartTime);
      }

      this.device.pushErrorScope('validation');
      const beginRenderPassStartTime = profiler ? getTimestamp() : 0;
      const suppliedHandle = this.props.handle as GPURenderPassEncoder | undefined;
      this.handle = suppliedHandle || commandEncoder.beginRenderPass(renderPassDescriptor);
      if (profiler) {
        profiler.renderPassBeginCount = (profiler.renderPassBeginCount || 0) + 1;
        profiler.renderPassBeginTimeMs =
          (profiler.renderPassBeginTimeMs || 0) + (getTimestamp() - beginRenderPassStartTime);
      }
      this.device.popErrorScope((error: GPUError) => {
        this.device.reportError(new Error(`${this} creation failed:\n"${error.message}"`), this)();
        this.device.debug();
      });
      this.handle.label = this.props.id;
      log.groupCollapsed(3, `new WebGPURenderPass(${this.id})`)();
      log.probe(3, JSON.stringify(renderPassDescriptor, null, 2))();
      log.groupEnd(3)();
    } finally {
      if (profiler) {
        profiler.renderPassSetupCount = (profiler.renderPassSetupCount || 0) + 1;
        profiler.renderPassSetupTimeMs =
          (profiler.renderPassSetupTimeMs || 0) + (getTimestamp() - startTime);
      }
    }
  }

  override destroy(): void {
    this.destroyResource();
  }

  end(): void {
    if (this.destroyed) {
      return;
    }
    this.handle.end();
    this.destroy();
  }

  setPipeline(pipeline: RenderPipeline): void {
    this.pipeline = pipeline as WebGPURenderPipeline;
    this.device.pushErrorScope('validation');
    this.handle.setPipeline(this.pipeline.handle);
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} setPipeline failed:\n"${error.message}"`), this)();
      this.device.debug();
    });
  }

  /** Sets an array of bindings (uniform buffers, samplers, textures, ...) */
  setBindings(bindings: Bindings | BindingsByGroup, options?: RenderPassBindingOptions): void {
    if (!this.pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before setBindings()');
    }
    this.bindings = bindings;
    this.bindingsPipeline = this.pipeline;
    const bindGroups = _getDefaultBindGroupFactory(this.device).getBindGroups(
      this.pipeline,
      bindings,
      options?._bindGroupCacheKeys
    );
    for (const [group, bindGroup] of Object.entries(bindGroups)) {
      if (bindGroup) {
        this.handle.setBindGroup(Number(group), bindGroup as GPUBindGroup);
      }
    }
  }

  /** Selects the vertex array used by subsequent draw commands. */
  setVertexArray(vertexArray: VertexArray): void {
    this.vertexArray = vertexArray;
  }

  setIndexBuffer(
    buffer: Buffer,
    indexFormat: GPUIndexFormat,
    offset: number = 0,
    size?: number
  ): void {
    this.handle.setIndexBuffer((buffer as WebGPUBuffer).handle, indexFormat, offset, size);
  }

  setVertexBuffer(slot: number, buffer: Buffer, offset: number = 0): void {
    this.handle.setVertexBuffer(slot, (buffer as WebGPUBuffer).handle, offset);
  }

  draw(options: RenderPassDrawOptions): boolean {
    if (!this.pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before draw()');
    }
    if (this.pipeline.shaderLayout.bindings.length > 0 && this.bindingsPipeline !== this.pipeline) {
      throw new Error('RenderPass.setBindings() must be called after setPipeline() before draw()');
    }

    this.vertexArray?.bindBeforeRender(this);
    if (options.indexCount) {
      this.handle.drawIndexed(
        options.indexCount,
        options.instanceCount,
        options.firstIndex,
        options.baseVertex,
        options.firstInstance
      );
    } else {
      this.handle.draw(
        options.vertexCount || 0,
        options.instanceCount || 1,
        options.firstIndex,
        options.firstInstance
      );
    }
    this.vertexArray?.unbindAfterRender(this);
    return true;
  }

  drawIndirect(): void {
    // drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    // drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  }

  setParameters(parameters: RenderPassParameters): void {
    const {blendConstant, stencilReference, scissorRect, viewport} = parameters;
    if (blendConstant) {
      this.handle.setBlendConstant(blendConstant);
    }
    if (stencilReference) {
      this.handle.setStencilReference(stencilReference);
    }
    if (scissorRect) {
      this.handle.setScissorRect(scissorRect[0], scissorRect[1], scissorRect[2], scissorRect[3]);
    }
    // TODO - explain how 3 dimensions vs 2 in WebGL works.
    if (viewport) {
      this.handle.setViewport(
        viewport[0],
        viewport[1],
        viewport[2],
        viewport[3],
        viewport[4] ?? 0,
        viewport[5] ?? 1
      );
    }
  }

  pushDebugGroup(groupLabel: string): void {
    this.handle.pushDebugGroup(groupLabel);
  }
  popDebugGroup(): void {
    this.handle.popDebugGroup();
  }
  insertDebugMarker(markerLabel: string): void {
    this.handle.insertDebugMarker(markerLabel);
  }

  beginOcclusionQuery(queryIndex: number): void {
    this.handle.beginOcclusionQuery(queryIndex);
  }
  endOcclusionQuery(): void {
    this.handle.endOcclusionQuery();
  }

  /** Replays compatible native WebGPU render bundles in this pass. */
  executeBundles(bundles: Iterable<RenderBundle>): void {
    this.device.pushErrorScope('validation');
    this.handle.executeBundles(
      Array.from(bundles, renderBundle => (renderBundle as WebGPURenderBundle).handle)
    );
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(
        new Error(`${this} executeBundles failed:\n"${error.message}"`),
        this
      )();
      this.device.debug();
    });

    // Native executeBundles clears the pass draw state after replaying the bundle.
    this.pipeline = null;
    this.bindings = {};
  }

  // INTERNAL

  /**
   * Partial render pass descriptor. Used by WebGPURenderPass.
   * @returns attachments fields of a renderpass descriptor.
   */
  protected getRenderPassDescriptor(framebuffer: WebGPUFramebuffer): GPURenderPassDescriptor {
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: []
    };

    renderPassDescriptor.colorAttachments = framebuffer.colorAttachments.map(
      (colorAttachment, index) => ({
        // clear values
        loadOp: this.props.clearColor !== false ? 'clear' : 'load',
        clearValue: convertColor(
          this.props.clearColors?.[index] || this.props.clearColor || RenderPass.defaultClearColor
        ),
        storeOp: this.props.discard ? 'discard' : 'store',
        // ...colorAttachment,
        view: colorAttachment.handle
      })
    );

    if (framebuffer.depthStencilAttachment) {
      renderPassDescriptor.depthStencilAttachment = {
        view: framebuffer.depthStencilAttachment.handle
      };
      const {depthStencilAttachment} = renderPassDescriptor;

      // DEPTH
      if (this.props.depthReadOnly) {
        depthStencilAttachment.depthReadOnly = true;
      } else if (this.props.clearDepth !== false) {
        depthStencilAttachment.depthClearValue = this.props.clearDepth;
      }
      // STENCIL
      if (this.props.stencilReadOnly) {
        depthStencilAttachment.stencilReadOnly = true;
      }
      // if (!this.props.stencilReadOnly && this.props.clearStencil !== false) {
      //   depthStencilAttachment.stencilClearValue = this.props.clearStencil;
      // }

      // WebGPU only wants us to set these parameters if the texture format actually has a depth aspect
      const hasDepthAspect = true;
      if (hasDepthAspect && !this.props.depthReadOnly) {
        depthStencilAttachment.depthLoadOp = this.props.clearDepth !== false ? 'clear' : 'load';
        depthStencilAttachment.depthStoreOp = 'store'; // TODO - support 'discard'?
      }

      // WebGPU only wants us to set these parameters if the texture format actually has a stencil aspect
      const hasStencilAspect = false;
      if (hasStencilAspect && !this.props.stencilReadOnly) {
        depthStencilAttachment.stencilLoadOp = this.props.clearStencil !== false ? 'clear' : 'load';
        depthStencilAttachment.stencilStoreOp = 'store'; // TODO - support 'discard'?
      }
    }

    return renderPassDescriptor;
  }
}

function convertColor(color: TypedArray | NumberArray4): GPUColor {
  return {r: color[0], g: color[1], b: color[2], a: color[3]};
}
