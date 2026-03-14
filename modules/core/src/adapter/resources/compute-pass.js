// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
export class ComputePass extends Resource {
    constructor(device, props) {
        super(device, props, ComputePass.defaultProps);
    }
    static defaultProps = {
        ...Resource.defaultProps,
        timestampQuerySet: undefined,
        beginTimestampIndex: undefined,
        endTimestampIndex: undefined
    };
    get [Symbol.toStringTag]() {
        return 'ComputePass';
    }
}
