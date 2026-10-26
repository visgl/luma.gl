// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Device, Framebuffer, RenderPassProps, Sampler, Texture} from '@luma.gl/core';
import {getPassthroughFS} from '@luma.gl/shadertools';
import {GPUVectorModel, type GPUVectorModelProps, type GPUVectorModelInputs} from '@luma.gl/gpgpu';
import {uid} from '../utils/uid';

/**
 * Properties for creating a {@link TextureTransform}
 */
export type TextureTransformProps = Omit<GPUVectorModelProps, 'fs'> & {
  /** Borrowed contiguous vectors mapped to vertex-buffer layout names. */
  inputVectors?: GPUVectorModelInputs;
  fs?: GPUVectorModelProps['fs']; // override as optional
  /** @deprecated TODO(donmccurdy): Needed? */
  inject?: Record<string, string>;
  /** @deprecated TODO(donmccurdy): Needed? */
  framebuffer?: Framebuffer;
  /** @deprecated TODO(donmccurdy): GPUVectorModel already handles this? */
  sourceBuffers?: Record<string, Buffer>;
  /** @deprecated TODO(donmccurdy): GPUVectorModel already handles this? */
  sourceTextures?: Record<string, Texture>;
  targetTexture: Texture;
  targetTextureChannels: 1 | 2 | 3 | 4;
  targetTextureVarying: string;
};

type TextureBinding = {
  sourceBuffers: Record<string, Buffer>;
  sourceTextures: Record<string, Texture>;
  targetTexture: Texture;
  framebuffer?: Framebuffer;
};

const FS_OUTPUT_VARIABLE = 'transform_output';

/**
 * Creates a pipeline for texture→texture transforms.
 * @deprecated
 */
export class TextureTransform {
  readonly device: Device;
  readonly model: GPUVectorModel;
  readonly sampler: Sampler;

  currentIndex = 0;
  samplerTextureMap: Record<string, any> | null = null;
  bindings: TextureBinding[] = []; // each element is an object : {sourceTextures, targetTexture, framebuffer}
  resources: Record<string, any> = {}; // resources to be deleted

  constructor(device: Device, props: TextureTransformProps) {
    this.device = device;
    const {inputVectors, ...modelProps} = props;

    // For precise picking of element IDs.
    this.sampler = device.createSampler({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'nearest',
      magFilter: 'nearest',
      mipmapFilter: 'nearest'
    });

    this.model = new GPUVectorModel(this.device, {
      id: props.id || uid('texture-transform-model'),
      fs:
        props.fs ||
        getPassthroughFS({
          input: props.targetTextureVarying,
          inputChannels: props.targetTextureChannels,
          output: FS_OUTPUT_VARIABLE
        }),
      vertexCount: props.vertexCount, // TODO(donmccurdy): Naming?
      ...modelProps
    });

    if (inputVectors) this.model.setGPUVectors(inputVectors, {count: 'vertex'});
    this._initialize(props);
    Object.seal(this);
  }

  // Delete owned resources.
  destroy(): void {
    this.model.destroy();
    for (const binding of this.bindings) {
      binding.framebuffer?.destroy();
    }
  }

  /** @deprecated Use {@link destroy}. */
  delete(): void {
    this.destroy();
  }

  run(options?: RenderPassProps & {inputVectors?: GPUVectorModelInputs}): void {
    const {inputVectors, ...renderPassProps} = options ?? {};
    if (inputVectors) this.model.setGPUVectors(inputVectors, {count: 'vertex'});
    const {framebuffer} = this.bindings[this.currentIndex];
    const renderPass = this.device.beginRenderPass({framebuffer, ...renderPassProps});
    try {
      this.model.draw(renderPass);
    } finally {
      renderPass.end();
    }
    this.device.submit();
  }

  getTargetTexture(): Texture {
    const {targetTexture} = this.bindings[this.currentIndex];
    return targetTexture;
  }

  getFramebuffer(): Framebuffer | undefined {
    const currentResources = this.bindings[this.currentIndex];
    return currentResources.framebuffer;
  }

  // Private

  _initialize(props: TextureTransformProps): void {
    this._updateBindings(props);
  }

  _updateBindings(props: TextureTransformProps) {
    this.bindings[this.currentIndex] = this._updateBinding(this.bindings[this.currentIndex], props);
  }

  _updateBinding(
    binding: TextureBinding,
    {sourceBuffers, sourceTextures, targetTexture}: TextureTransformProps
  ): TextureBinding {
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
      const {width, height} = targetTexture;
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
      binding.framebuffer.resize({width, height});
    }
    return binding;
  }

  // set texture filtering parameters on source textures.
  _setSourceTextureParameters(): void {
    const index = this.currentIndex;
    const {sourceTextures} = this.bindings[index];
    for (const name in sourceTextures) {
      sourceTextures[name].sampler = this.sampler;
    }
  }
}
