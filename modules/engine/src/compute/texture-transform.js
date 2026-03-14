// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { getPassthroughFS } from '@luma.gl/shadertools';
import { Model } from '../model/model';
import { uid } from '../utils/uid';
const FS_OUTPUT_VARIABLE = 'transform_output';
/**
 * Creates a pipeline for texture→texture transforms.
 * @deprecated
 */
export class TextureTransform {
    device;
    model;
    sampler;
    currentIndex = 0;
    samplerTextureMap = null;
    bindings = []; // each element is an object : {sourceTextures, targetTexture, framebuffer}
    resources = {}; // resources to be deleted
    constructor(device, props) {
        this.device = device;
        // For precise picking of element IDs.
        this.sampler = device.createSampler({
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            minFilter: 'nearest',
            magFilter: 'nearest',
            mipmapFilter: 'nearest'
        });
        this.model = new Model(this.device, {
            id: props.id || uid('texture-transform-model'),
            fs: props.fs ||
                getPassthroughFS({
                    input: props.targetTextureVarying,
                    inputChannels: props.targetTextureChannels,
                    output: FS_OUTPUT_VARIABLE
                }),
            vertexCount: props.vertexCount, // TODO(donmccurdy): Naming?
            ...props
        });
        this._initialize(props);
        Object.seal(this);
    }
    // Delete owned resources.
    destroy() {
        this.model.destroy();
        for (const binding of this.bindings) {
            binding.framebuffer?.destroy();
        }
    }
    /** @deprecated Use {@link destroy}. */
    delete() {
        this.destroy();
    }
    run(options) {
        const { framebuffer } = this.bindings[this.currentIndex];
        const renderPass = this.device.beginRenderPass({ framebuffer, ...options });
        this.model.draw(renderPass);
        renderPass.end();
        this.device.submit();
    }
    getTargetTexture() {
        const { targetTexture } = this.bindings[this.currentIndex];
        return targetTexture;
    }
    getFramebuffer() {
        const currentResources = this.bindings[this.currentIndex];
        return currentResources.framebuffer;
    }
    // Private
    _initialize(props) {
        this._updateBindings(props);
    }
    _updateBindings(props) {
        this.bindings[this.currentIndex] = this._updateBinding(this.bindings[this.currentIndex], props);
    }
    _updateBinding(binding, { sourceBuffers, sourceTextures, targetTexture }) {
        if (!binding) {
            binding = {
                sourceBuffers: {},
                sourceTextures: {},
                // @ts-expect-error
                targetTexture: null
            };
        }
        Object.assign(binding.sourceTextures, sourceTextures);
        Object.assign(binding.sourceBuffers, sourceBuffers);
        if (targetTexture) {
            binding.targetTexture = targetTexture;
            const { width, height } = targetTexture;
            // TODO(donmccurdy): When is this called, and is this expected?
            if (binding.framebuffer) {
                binding.framebuffer.destroy();
            }
            binding.framebuffer = this.device.createFramebuffer({
                id: 'transform-framebuffer',
                width,
                height,
                colorAttachments: [targetTexture]
            });
            binding.framebuffer.resize({ width, height });
        }
        return binding;
    }
    // set texture filtering parameters on source textures.
    _setSourceTextureParameters() {
        const index = this.currentIndex;
        const { sourceTextures } = this.bindings[index];
        for (const name in sourceTextures) {
            sourceTextures[name].sampler = this.sampler;
        }
    }
}
