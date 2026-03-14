// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { QuerySet } from '@luma.gl/core';
/**
 * Immutable
 */
export class WebGPUQuerySet extends QuerySet {
    device;
    handle;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.handle =
            this.props.handle ||
                this.device.handle.createQuerySet({
                    type: this.props.type,
                    count: this.props.count
                });
        this.handle.label = this.props.id;
    }
    destroy() {
        this.handle?.destroy();
        // @ts-expect-error readonly
        this.handle = null;
    }
}
