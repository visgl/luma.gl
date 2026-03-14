// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { QuerySet } from '@luma.gl/core';
export class NullQuerySet extends QuerySet {
    device;
    handle = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
}
