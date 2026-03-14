// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/**
 * A compiled and linked shader program for compute
 */
export class ComputePipeline extends Resource {
    get [Symbol.toStringTag]() {
        return 'ComputePipeline';
    }
    hash = '';
    /** The merged shader layout */
    shaderLayout;
    constructor(device, props) {
        super(device, props, ComputePipeline.defaultProps);
        this.shaderLayout = props.shaderLayout;
    }
    static defaultProps = {
        ...Resource.defaultProps,
        shader: undefined,
        entryPoint: undefined,
        constants: {},
        shaderLayout: undefined
    };
}
