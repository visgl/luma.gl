// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Sampler } from '@luma.gl/core';
export class NullSampler extends Sampler {
    device;
    handle = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
}
