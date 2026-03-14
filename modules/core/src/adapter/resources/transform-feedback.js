// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/** Holds a set of output buffers for pipeline (WebGL only) */
export class TransformFeedback extends Resource {
    static defaultProps = {
        ...Resource.defaultProps,
        layout: undefined,
        buffers: {}
    };
    get [Symbol.toStringTag]() {
        return 'TransformFeedback';
    }
    constructor(device, props) {
        super(device, props, TransformFeedback.defaultProps);
    }
}
