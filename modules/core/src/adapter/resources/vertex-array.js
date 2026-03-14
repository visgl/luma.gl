// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { getAttributeInfosByLocation } from '../../adapter-utils/get-attribute-from-layouts';
import { Resource } from './resource';
/**
 * Stores attribute bindings.
 * Makes it easy to share a render pipeline and use separate vertex arrays.
 * @note On WebGL, VertexArray allows non-constant bindings to be performed in advance
 * reducing the number of WebGL calls per draw call.
 * @note On WebGPU this is just a convenience class that collects the bindings.
 */
export class VertexArray extends Resource {
    static defaultProps = {
        ...Resource.defaultProps,
        shaderLayout: undefined,
        bufferLayout: []
    };
    get [Symbol.toStringTag]() {
        return 'VertexArray';
    }
    /** Max number of vertex attributes */
    maxVertexAttributes;
    /** Attribute infos indexed by location - TODO only needed by webgl module? */
    attributeInfos;
    /** Index buffer */
    indexBuffer = null;
    /** Attributes indexed by buffer slot */
    attributes;
    constructor(device, props) {
        super(device, props, VertexArray.defaultProps);
        this.maxVertexAttributes = device.limits.maxVertexAttributes;
        this.attributes = new Array(this.maxVertexAttributes).fill(null);
        this.attributeInfos = getAttributeInfosByLocation(props.shaderLayout, props.bufferLayout, this.maxVertexAttributes);
    }
    // DEPRECATED METHODS
    /** @deprecated Set constant attributes (WebGL only) */
    setConstantWebGL(location, value) {
        this.device.reportError(new Error('constant attributes not supported'), this)();
    }
}
