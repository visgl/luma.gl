// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/**
 * Encodes commands to queue that can be executed later
 */
export class CommandEncoder extends Resource {
    get [Symbol.toStringTag]() {
        return 'CommandEncoder';
    }
    constructor(device, props) {
        super(device, props, CommandEncoder.defaultProps);
    }
    // TODO - luma.gl has these on the device, should we align with WebGPU API?
    // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
    // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;
    static defaultProps = {
        ...Resource.defaultProps,
        measureExecutionTime: undefined
    };
}
