// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { TransformFeedback } from '@luma.gl/core';
export class NullTransformFeedback extends TransformFeedback {
    device;
    handle = null;
    layout;
    buffers = {};
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.layout = this.props.layout;
        if (props.buffers) {
            this.setBuffers(props.buffers);
        }
        Object.seal(this);
    }
    begin(topology = 'point-list') { }
    end() { }
    setBuffers(buffers) {
        this.buffers = {};
        for (const bufferName in buffers) {
            this.setBuffer(bufferName, buffers[bufferName]);
        }
    }
    setBuffer(locationOrName, bufferOrRange) {
        this.buffers[locationOrName] = bufferOrRange;
    }
    getBuffer(locationOrName) {
        return this.buffers[locationOrName] || null;
    }
}
