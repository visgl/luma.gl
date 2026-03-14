// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/**
 * Encodes commands to queue that can be executed later
 */
export class CommandBuffer extends Resource {
    get [Symbol.toStringTag]() {
        return 'CommandBuffer';
    }
    constructor(device, props) {
        super(device, props, CommandBuffer.defaultProps);
    }
    static defaultProps = {
        ...Resource.defaultProps
    };
}
