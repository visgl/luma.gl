// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, NumberArray4} from '@math.gl/types';
import type {RenderPassProps, RenderPassParameters, Binding} from '@luma.gl/core';
import {Buffer, RenderPass, RenderPipeline, log} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
// import {WebGPUCommandEncoder} from './webgpu-command-encoder';
import {WebGPURenderPipeline} from './webgpu-render-pipeline';
import {WebGPUQuerySet} from './webgpu-query-set';
import {WebGPUFramebuffer} from './webgpu-framebuffer';
import {getCpuHotspotProfiler, getTimestamp} from '../helpers/cpu-hotspot-profiler';

export class WebGPURenderPass extends RenderPass {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderPassEncoder;
  readonly framebuffer: WebGPUFramebuffer;

  /** Active pipeline */
  pipeline: WebGPURenderPipeline | null = null;

  /** Latest bindings applied to this pass */
  bindings: Record<string, Binding> = {};

  constructor(device: WebGPUDevice, props: RenderPassProps = {}) {
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

      if (!device.commandEncoder) {
        throw new Error('commandEncoder not available');
      }

      this.device.pushErrorScope('validation');
      const beginRenderPassStartTime = profiler ? getTimestamp() : 0;
      this.handle =
        this.props.handle || device.commandEncoder.handle.beginRenderPass(renderPassDescriptor);
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
  setBindings(bindings: Record<string, Binding>): void {
    this.bindings = bindings;
    const bindGroup = this.pipeline?._getBindGroup(bindings);
    if (bindGroup) {
      this.handle.setBindGroup(0, bindGroup);
    }
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

  draw(options: {
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
  }): void {
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

  // executeBundles(bundles: Iterable<GPURenderBundle>): void;

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
      }
      if (this.props.clearDepth !== false) {
        depthStencilAttachment.depthClearValue = this.props.clearDepth;
      }
      // STENCIL
      // if (this.props.clearStencil !== false) {
      //   depthStencilAttachment.stencilClearValue = this.props.clearStencil;
      // }

      // WebGPU only wants us to set these parameters if the texture format actually has a depth aspect
      const hasDepthAspect = true;
      if (hasDepthAspect) {
        depthStencilAttachment.depthLoadOp = this.props.clearDepth !== false ? 'clear' : 'load';
        depthStencilAttachment.depthStoreOp = 'store'; // TODO - support 'discard'?
      }

      // WebGPU only wants us to set these parameters if the texture format actually has a stencil aspect
      const hasStencilAspect = false;
      if (hasStencilAspect) {
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
