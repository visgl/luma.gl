// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPassProps, RenderPassParameters, Binding, Framebuffer} from '@luma.gl/core';
import {Buffer, RenderPass, RenderPipeline, cast, log} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
import {WebGPUTextureView} from './webgpu-texture-view';
// import {WebGPUCommandEncoder} from './webgpu-command-encoder';
import {WebGPURenderPipeline} from './webgpu-render-pipeline';
import {WebGPUQuerySet} from './webgpu-query-set';

export class WebGPURenderPass extends RenderPass {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderPassEncoder;

  /** Active pipeline */
  pipeline: WebGPURenderPipeline | null = null;

  constructor(device: WebGPUDevice, props: RenderPassProps = {}) {
    super(device, props);
    this.device = device;
    const framebuffer = props.framebuffer || device.canvasContext.getCurrentFramebuffer();
    const renderPassDescriptor = this.getRenderPassDescriptor(framebuffer);

    const webgpuQuerySet = props.timestampQuerySet as WebGPUQuerySet;
    if (webgpuQuerySet) {
      renderPassDescriptor.occlusionQuerySet = webgpuQuerySet.handle;
    }

    if (device.features.has('timestamp-query')) {
      const webgpuQuerySet = props.timestampQuerySet as WebGPUQuerySet;
      renderPassDescriptor.timestampWrites = webgpuQuerySet
        ? ({
            querySet: webgpuQuerySet.handle,
            beginningOfPassWriteIndex: props.beginTimestampIndex,
            endOfPassWriteIndex: props.endTimestampIndex
          } as GPUComputePassTimestampWrites)
        : undefined;
    }

    this.handle = this.props.handle || device.commandEncoder.beginRenderPass(renderPassDescriptor);
    this.handle.label = this.props.id;
    log.groupCollapsed(3, `new WebGPURenderPass(${this.id})`)();
    log.probe(3, JSON.stringify(renderPassDescriptor, null, 2))();
    log.groupEnd(3)();
  }

  override destroy(): void {}

  end(): void {
    this.handle.end();
  }

  setPipeline(pipeline: RenderPipeline): void {
    this.pipeline = cast<WebGPURenderPipeline>(pipeline);
    this.handle.setPipeline(this.pipeline.handle);
  }

  /** Sets an array of bindings (uniform buffers, samplers, textures, ...) */
  setBindings(bindings: Record<string, Binding>): void {
    this.pipeline?.setBindings(bindings);
    const bindGroup = this.pipeline?._getBindGroup();
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
    this.handle.setIndexBuffer(cast<WebGPUBuffer>(buffer).handle, indexFormat, offset, size);
  }

  setVertexBuffer(slot: number, buffer: Buffer, offset: number = 0): void {
    this.handle.setVertexBuffer(slot, cast<WebGPUBuffer>(buffer).handle, offset);
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
        viewport[4],
        viewport[5]
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
  protected getRenderPassDescriptor(framebuffer: Framebuffer): GPURenderPassDescriptor {
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: []
    };

    renderPassDescriptor.colorAttachments = framebuffer.colorAttachments.map(colorAttachment => ({
      // clear values
      loadOp: this.props.clearColor !== false ? 'clear' : 'load',
      colorClearValue: this.props.clearColor || [0, 0, 0, 0],
      storeOp: this.props.discard ? 'discard' : 'store',
      // ...colorAttachment,
      view: (colorAttachment as WebGPUTextureView).handle
    }));

    if (framebuffer.depthStencilAttachment) {
      renderPassDescriptor.depthStencilAttachment = {
        view: (framebuffer.depthStencilAttachment as WebGPUTextureView).handle
      };
      const {depthStencilAttachment} = renderPassDescriptor;

      // DEPTH
      if (this.props.depthReadOnly) {
        depthStencilAttachment.depthReadOnly = true;
      }
      depthStencilAttachment.depthClearValue = this.props.clearDepth || 0;

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
