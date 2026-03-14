// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CommandEncoder } from '@luma.gl/core';
import { WebGPUCommandBuffer } from './webgpu-command-buffer';
import { WebGPURenderPass } from './webgpu-render-pass';
import { WebGPUComputePass } from './webgpu-compute-pass';
export class WebGPUCommandEncoder extends CommandEncoder {
    device;
    handle;
    constructor(device, props = {}) {
        super(device, props);
        this.device = device;
        this.handle =
            props.handle ||
                this.device.handle.createCommandEncoder({
                    label: this.props.id
                    // TODO was this removed in standard?
                    // measureExecutionTime: this.props.measureExecutionTime
                });
        this.handle.label = this.props.id;
    }
    destroy() { }
    finish(props) {
        this.device.pushErrorScope('validation');
        const commandBuffer = new WebGPUCommandBuffer(this, {
            id: props?.id || 'unnamed-command-buffer'
        });
        this.device.popErrorScope((error) => {
            const message = `${this} command encoding: ${error.message}. Maybe add depthWriteEnabled to your Model?`;
            this.device.reportError(new Error(message), this)();
            this.device.debug();
        });
        return commandBuffer;
    }
    /**
     * Allows a render pass to begin against a canvas context
     * @todo need to support a "Framebuffer" equivalent (aka preconfigured RenderPassDescriptors?).
     */
    beginRenderPass(props) {
        return new WebGPURenderPass(this.device, props);
    }
    beginComputePass(props) {
        return new WebGPUComputePass(this.device, props);
    }
    // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
    // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;
    copyBufferToBuffer(options) {
        const webgpuSourceBuffer = options.sourceBuffer;
        const WebGPUDestinationBuffer = options.destinationBuffer;
        this.handle.copyBufferToBuffer(webgpuSourceBuffer.handle, options.sourceOffset ?? 0, WebGPUDestinationBuffer.handle, options.destinationOffset ?? 0, options.size ?? 0);
    }
    copyBufferToTexture(options) {
        const webgpuSourceBuffer = options.sourceBuffer;
        const WebGPUDestinationTexture = options.destinationTexture;
        this.handle.copyBufferToTexture({
            buffer: webgpuSourceBuffer.handle,
            offset: options.offset ?? 0,
            bytesPerRow: options.bytesPerRow,
            rowsPerImage: options.rowsPerImage
        }, {
            texture: WebGPUDestinationTexture.handle,
            mipLevel: options.mipLevel ?? 0,
            origin: options.origin ?? {}
            // aspect: options.aspect
        }, {
            // @ts-ignore
            width: options.extent?.[0],
            height: options.extent?.[1],
            depthOrArrayLayers: options.extent?.[2]
        });
    }
    copyTextureToBuffer(options) {
        // this.handle.copyTextureToBuffer(
        //   // source
        //   {},
        //   // destination
        //   {},
        //   // copySize
        //   {}
        // );
    }
    copyTextureToTexture(options) {
        // this.handle.copyTextureToTexture(
        //   // source
        //   {},
        //   // destination
        //   {},
        //   // copySize
        //   {}
        // );
    }
    pushDebugGroup(groupLabel) {
        this.handle.pushDebugGroup(groupLabel);
    }
    popDebugGroup() {
        this.handle.popDebugGroup();
    }
    insertDebugMarker(markerLabel) {
        this.handle.insertDebugMarker(markerLabel);
    }
    resolveQuerySet(querySet, destination, options) {
        const webgpuQuerySet = querySet;
        const webgpuBuffer = destination;
        this.handle.resolveQuerySet(webgpuQuerySet.handle, options?.firstQuery || 0, options?.queryCount || querySet.props.count - (options?.firstQuery || 0), webgpuBuffer.handle, options?.destinationOffset || 0);
    }
}
/*
  // setDataFromTypedArray(data): this {
  //   const textureDataBuffer = this.device.handle.createBuffer({
  //     size: data.byteLength,
  //     usage: Buffer.COPY_DST | Buffer.COPY_SRC,
  //     mappedAtCreation: true
  //   });
  //   new Uint8Array(textureDataBuffer.getMappedRange()).set(data);
  //   textureDataBuffer.unmap();

  //   this.setBuffer(textureDataBuffer);

  //   textureDataBuffer.destroy();
  //   return this;
  // }

 */
