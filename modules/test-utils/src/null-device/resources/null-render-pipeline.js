// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { RenderPipeline } from '@luma.gl/core';
/** Creates a new render pipeline */
export class NullRenderPipeline extends RenderPipeline {
    device;
    handle = null;
    vs;
    fs;
    uniforms = {};
    bindings = {};
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.vs = props.vs;
        this.fs = props.fs;
        this.shaderLayout = props.shaderLayout || {
            attributes: [],
            bindings: [],
            uniforms: []
        };
    }
    setBindings(bindings) {
        Object.assign(this.bindings, bindings);
    }
    draw(options) {
        const { renderPass, vertexArray } = options;
        vertexArray.bindBeforeRender(renderPass);
        vertexArray.unbindAfterRender(renderPass);
        return true;
    }
}
