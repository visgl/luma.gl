// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { RenderPass } from '@luma.gl/core';
export class NullRenderPass extends RenderPass {
    device;
    handle = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
    end() { }
    pushDebugGroup(groupLabel) { }
    popDebugGroup() { }
    insertDebugMarker(markerLabel) { }
    setParameters(parameters = {}) { }
    beginOcclusionQuery(queryIndex) { }
    endOcclusionQuery() { }
}
