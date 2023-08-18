import type {RenderPassProps, RenderPassParameters, Binding, Framebuffer} from '@luma.gl/core';
import {Buffer, RenderPass, RenderPipeline, cast} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
import {WebGPUTexture} from './webgpu-texture';
// import {WebGPUCommandEncoder} from './webgpu-command-encoder';
import {WebGPURenderPipeline} from './webgpu-render-pipeline';

export class WebGPURenderPass extends RenderPass {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderPassEncoder;

  /** Active pipeline */
  pipeline: WebGPURenderPipeline | null = null;

  constructor(device: WebGPUDevice, props: RenderPassProps = {}) {
    super(device, props);
    this.device = device;
    const framebuffer = props.framebuffer || device.canvasContext.getCurrentFramebuffer() ;
    const renderPassDescriptor = this.getRenderPassDescriptor(framebuffer);
    this.handle = this.props.handle || device.commandEncoder.beginRenderPass(renderPassDescriptor);
    this.handle.label = this.props.id;
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
        options.instanceCount,
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

  // writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
  // beginOcclusionQuery(queryIndex: number): void;
  // endOcclusionQuery(): void;
  // beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;
  // endPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;

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
      loadOp: 'clear',
      colorClearValue: this.props.clearColor || [0, 0, 0, 0],
      storeOp: this.props.discard? 'discard': 'store',
      // ...colorAttachment,
      view: (colorAttachment as WebGPUTexture).handle.createView()
    }));

    if (framebuffer.depthStencilAttachment) {
      renderPassDescriptor.depthStencilAttachment = {
        ...this.props,
        view: (framebuffer.depthStencilAttachment as WebGPUTexture).handle.createView()
      };
    }

    return renderPassDescriptor;
  }
}
