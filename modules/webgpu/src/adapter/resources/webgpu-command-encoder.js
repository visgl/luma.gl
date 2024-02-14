import { CommandEncoder } from '@luma.gl/core';
export class WebGPUCommandEncoder extends CommandEncoder {
    device;
    handle;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.handle =
            props.handle ||
                this.device.handle.createCommandEncoder({
                // TODO was this removed in standard?
                // measureExecutionTime: this.props.measureExecutionTime
                });
        this.handle.label = this.props.id;
    }
    destroy() { }
    finish(options) {
        return this.finish(options);
    }
    // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
    // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;
    copyBufferToBuffer(options) {
        const webgpuSourceBuffer = options.source;
        const WebGPUDestinationBuffer = options.destination;
        this.handle.copyBufferToBuffer(webgpuSourceBuffer.handle, options.sourceOffset ?? 0, WebGPUDestinationBuffer.handle, options.destinationOffset ?? 0, options.size ?? 0);
    }
    copyBufferToTexture(options) {
        const webgpuSourceBuffer = options.source;
        const WebGPUDestinationTexture = options.destination;
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
            // TODO exclamation mark hack
            width: options.extent[0],
            height: options.extent[1],
            depthOrArrayLayers: options.extent[2]
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
}
