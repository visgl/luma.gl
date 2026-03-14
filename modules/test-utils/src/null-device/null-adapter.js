// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Adapter } from '@luma.gl/core';
import { NullDevice } from './null-device';
export class NullAdapter extends Adapter {
    /** type of device's created by this adapter */
    type = 'null';
    constructor() {
        super();
        // @ts-ignore DEPRECATED For backwards compatibility luma.registerDevices
        NullDevice.adapter = this;
    }
    isSupported() {
        return true;
    }
    isDeviceHandle(handle) {
        return handle === null;
    }
    async attach(handle) {
        return new NullDevice({});
    }
    async create(props = {}) {
        return new NullDevice(props);
    }
}
export const nullAdapter = new NullAdapter();
