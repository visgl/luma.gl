// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { ComputePass } from '@luma.gl/core';
export class WebGPUComputePass extends ComputePass {
    device;
    handle;
    _webgpuPipeline = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        // Set up queries
        let timestampWrites;
        if (device.features.has('timestamp-query')) {
            const webgpuQuerySet = props.timestampQuerySet;
            if (webgpuQuerySet) {
                timestampWrites = {
                    querySet: webgpuQuerySet.handle,
                    beginningOfPassWriteIndex: props.beginTimestampIndex,
                    endOfPassWriteIndex: props.endTimestampIndex
                };
            }
        }
        this.handle =
            this.props.handle ||
                device.commandEncoder.handle.beginComputePass({
                    label: this.props.id,
                    timestampWrites
                });
    }
    /** @note no WebGPU destroy method, just gc */
    destroy() { }
    end() {
        this.handle.end();
    }
    setPipeline(pipeline) {
        const wgpuPipeline = pipeline;
        this.handle.setPipeline(wgpuPipeline.handle);
        this._webgpuPipeline = wgpuPipeline;
        this.setBindings([]);
    }
    /**
     * Sets an array of bindings (uniform buffers, samplers, textures, ...)
     * TODO - still some API confusion - does this method go here or on the pipeline?
     */
    setBindings(bindings) {
        // @ts-expect-error
        const bindGroup = this._webgpuPipeline._getBindGroup();
        this.handle.setBindGroup(0, bindGroup);
    }
    /**
     * Dispatch work to be performed with the current ComputePipeline.
     * @param x X dimension of the grid of work groups to dispatch.
     * @param y Y dimension of the grid of work groups to dispatch.
     * @param z Z dimension of the grid of work groups to dispatch.
     */
    dispatch(x, y, z) {
        this.handle.dispatchWorkgroups(x, y, z);
    }
    /**
     * Dispatch work to be performed with the current ComputePipeline.
     *
     * Buffer must be a tightly packed block of three 32-bit unsigned integer values (12 bytes total), given in the same order as the arguments for dispatch()
     * @param indirectBuffer
     * @param indirectOffset offset in buffer to the beginning of the dispatch data.
     */
    dispatchIndirect(indirectBuffer, indirectByteOffset = 0) {
        const webgpuBuffer = indirectBuffer;
        this.handle.dispatchWorkgroupsIndirect(webgpuBuffer.handle, indirectByteOffset);
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
