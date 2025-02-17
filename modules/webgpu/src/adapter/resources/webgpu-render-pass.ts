// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPassProps, RenderPassParameters, Binding} from '@luma.gl/core';
import {Buffer, RenderPass, RenderPipeline, log} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
// import {WebGPUCommandEncoder} from './webgpu-command-encoder';
import {WebGPURenderPipeline} from './webgpu-render-pipeline';
import {WebGPUQuerySet} from './webgpu-query-set';
import {WebGPUFramebuffer} from './webgpu-framebuffer';

export class WebGPURenderPass extends RenderPass {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderPassEncoder;

  /** Active pipeline */
  pipeline: WebGPURenderPipeline | null = null;

  constructor(device: WebGPUDevice, props: RenderPassProps = {}) {
    super(device, props);
    this.device = device;
    const framebuffer =
      (props.framebuffer as WebGPUFramebuffer) || device.getCanvasContext().getCurrentFramebuffer();

    const renderPassDescriptor = this.getRenderPassDescriptor(framebuffer);

    const webgpuQuerySet = props.timestampQuerySet as WebGPUQuerySet;
    if (webgpuQuerySet) {
      renderPassDescriptor.occlusionQuerySet = webgpuQuerySet.handle;
    }

    if (device.features.has('timestamp-query')) {
      const webgpuTSQuerySet = props.timestampQuerySet as WebGPUQuerySet;
      renderPassDescriptor.timestampWrites = webgpuTSQuerySet
        ? ({
            querySet: webgpuTSQuerySet.handle,
            beginningOfPassWriteIndex: props.beginTimestampIndex,
            endOfPassWriteIndex: props.endTimestampIndex
          } as GPUComputePassTimestampWrites)
        : undefined;
    }

    if (!device.commandEncoder) {
      throw new Error('commandEncoder not available');
    }

    this.device.handle.pushErrorScope('validation');
    this.handle = this.props.handle || device.commandEncoder.beginRenderPass(renderPassDescriptor);
    this.device.handle.popErrorScope().then((error: GPUError | null) => {
      if (error) {
        log.error(`${this} creation failed:\n"${error.message}"`, this)();
      }
    });
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
    this.pipeline = pipeline as WebGPURenderPipeline;
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
        viewport[4] as any,
        viewport[5] as any
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
          this.props.clearColors?.[index] || this.props.clearColor || RenderPass.defaultClearColor),
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

function convertColor(color: number[]): GPUColor {
  return {r: color[0], g: color[1], b: color[2], a: color[3]};
}
