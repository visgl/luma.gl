// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Texture } from '@luma.gl/core';
import { NullSampler } from './null-sampler';
import { NullTextureView } from './null-texture-view';
export class NullTexture extends Texture {
    device;
    handle = null;
    sampler;
    view;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        // const data = props.data;
        // this.setImageData(props);
        if (props.sampler) {
            this.setSampler(props.sampler);
        }
        this.sampler = new NullSampler(this.device, this.props.sampler);
        this.view = new NullTextureView(this.device, {
            ...props,
            texture: this,
            mipLevelCount: 1,
            arrayLayerCount: 1
        });
        Object.seal(this);
    }
    destroy() {
        if (!this.destroyed) {
            super.destroy();
            this.trackDeallocatedMemory('Texture');
        }
    }
    createView(props) {
        return new NullTextureView(this.device, { ...props, texture: this });
    }
    copyExternalImage(options) {
        this.trackDeallocatedMemory('Texture');
        // const {image: data} = options;
        // if (data && data.byteLength) {
        //   this.trackAllocatedMemory(data.byteLength, 'Texture');
        // } else {
        const bytesPerPixel = 4;
        this.trackAllocatedMemory(this.width * this.height * bytesPerPixel, 'Texture');
        // }
        return { width: this.width, height: this.height };
    }
    setSampler(sampler) {
        // ignore
    }
    copyImageData(options) {
        super.copyImageData(options);
    }
    readBuffer(options = {}, buffer) {
        return this.device.createBuffer({});
    }
    async readDataAsync(options = {}) {
        return new ArrayBuffer(0);
    }
    writeBuffer(buffer, options = {}) {
        // ignore
    }
    writeData(data, options = {}) {
        // ignore
    }
}
