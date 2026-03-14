// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/** Synchronization primitive that resolves when GPU work is completed */
export class Fence extends Resource {
    static defaultProps = {
        ...Resource.defaultProps
    };
    [Symbol.toStringTag] = 'WEBGLFence';
    constructor(device, props = {}) {
        super(device, props, Fence.defaultProps);
    }
}
