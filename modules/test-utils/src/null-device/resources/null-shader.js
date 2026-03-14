// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Shader } from '@luma.gl/core';
export class NullShader extends Shader {
    device;
    handle = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
    get asyncCompilationStatus() {
        return this.getCompilationInfo().then(() => 'success');
    }
    async getCompilationInfo() {
        return [];
    }
}
