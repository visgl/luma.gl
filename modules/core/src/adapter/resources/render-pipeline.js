// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/**
 * A compiled and linked shader program
 */
export class RenderPipeline extends Resource {
    get [Symbol.toStringTag]() {
        return 'RenderPipeline';
    }
    /** The merged layout */
    shaderLayout;
    /** Buffer map describing buffer interleaving etc */
    bufferLayout;
    /** The linking status of the pipeline. 'pending' if linking is asynchronous, and on production */
    linkStatus = 'pending';
    /** The hash of the pipeline */
    hash = '';
    constructor(device, props) {
        super(device, props, RenderPipeline.defaultProps);
        this.shaderLayout = this.props.shaderLayout;
        this.bufferLayout = this.props.bufferLayout || [];
    }
    static defaultProps = {
        ...Resource.defaultProps,
        vs: null,
        vertexEntryPoint: 'vertexMain',
        vsConstants: {},
        fs: null,
        fragmentEntryPoint: 'fragmentMain',
        fsConstants: {},
        shaderLayout: null,
        bufferLayout: [],
        topology: 'triangle-list',
        colorAttachmentFormats: undefined,
        depthStencilAttachmentFormat: undefined,
        parameters: {},
        bindings: {},
        uniforms: {}
    };
}
