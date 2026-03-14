// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/** Immutable PipelineLayout object */
export class PipelineLayout extends Resource {
    get [Symbol.toStringTag]() {
        return 'PipelineLayout';
    }
    constructor(device, props) {
        super(device, props, PipelineLayout.defaultProps);
    }
    static defaultProps = {
        ...Resource.defaultProps,
        shaderLayout: {
            attributes: [],
            bindings: []
        }
    };
}
