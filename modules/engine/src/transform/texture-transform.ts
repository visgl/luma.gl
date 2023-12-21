// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import { Buffer, Device, Framebuffer, RenderPassProps, Sampler, Texture } from '@luma.gl/core';
import { Model, ModelProps } from '../model/model';
import { getPassthroughFS } from '@luma.gl/shadertools';

/**
 * Properties for creating a {@link TextureTransform}
 * @deprecated
 */
export type TextureTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs']; // override as optional
  /** @deprecated TODO(donmccurdy): Needed? */
  inject?: Record<string, string>;
  /** @deprecated TODO(donmccurdy): Needed? */
  framebuffer?: Framebuffer;
  /** @deprecated TODO(donmccurdy): Model already handles this? */
  sourceBuffers?: Record<string, Buffer>;
  /** @deprecated TODO(donmccurdy): Model already handles this? */
  sourceTextures?: Record<string, Texture>;
  targetTexture: Texture;
  targetTextureChannels: 1 | 2 | 3 | 4;
  targetTextureVarying: string;
  elementCount: number;
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
  readonly model: Model;
  readonly sampler: Sampler;

  readonly elementIDBuffer: Buffer;
  readonly elementCount: number;
  
  currentIndex = 0;
  samplerTextureMap: Record<string, any> | null = null;
  bindings: TextureBinding[] = []; // each element is an object : {sourceTextures, targetTexture, framebuffer}
  resources: Record<string, any> = {}; // resources to be deleted

  constructor(device: Device, props: TextureTransformProps) {
    this.device = device;
    this.elementIDBuffer = createElementIDBuffer(device, props.elementCount);
    this.elementCount = props.elementCount;

    // For precise picking of element IDs.
    this.sampler = device.createSampler({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'nearest',
      magFilter: 'nearest',
      mipmapFilter: 'nearest',
    });

    this.model = new Model(this.device, {
      id: props.id || 'texture-transform-model',
      fs: props.fs || getPassthroughFS({
        version: 300,
        input: props.targetTextureVarying,
        inputChannels: props.targetTextureChannels,
        output: FS_OUTPUT_VARIABLE
      }),
      vertexCount: props.elementCount, // TODO(donmccurdy): Naming?
      ...props
    });

    this._initialize(props);
    Object.seal(this);
  }

  // Delete owned resources.
  destroy(): void {
    if (this.elementIDBuffer) {
      this.elementIDBuffer.destroy();
    }
  }

  run(options?: RenderPassProps): void {
    const {framebuffer} = this.bindings[this.currentIndex];
    const renderPass = this.device.beginRenderPass({framebuffer, ...options});
    this.model.draw(renderPass);
    renderPass.end();
  }

  swap(): void {
    throw new Error('swap() not implemented');
    // this.currentIndex = (this.currentIndex + 1) % 2;
  }

  getData({packed = false} = {}) {
    throw new Error('getData() not implemented');
  }

  getTargetTexture(): Texture {
    const {targetTexture} = this.bindings[this.currentIndex];
    return targetTexture;
  }


  getFramebuffer(): Framebuffer {
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

/** Creates an element ID buffer, using float32 for GLSL 1.00 compatibility. */
function createElementIDBuffer(device: Device, count: number): Buffer {
  const data = new Float32Array(count);
  for (let i = 0; i < count; i++) data[i] = i;
  return device.createBuffer({data});
}
