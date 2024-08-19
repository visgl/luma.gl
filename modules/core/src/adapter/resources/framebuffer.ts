// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ColorTextureFormat,
  DepthStencilTextureFormat,
  TextureFormat
} from '../../gpu-type-utils/texture-formats';
import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';
import {Texture} from './texture';
import {TextureView} from './texture-view';
import {log} from '../../utils/log';

export type FramebufferProps = ResourceProps & {
  width?: number;
  height?: number;
  colorAttachments?: (TextureView | Texture | ColorTextureFormat)[];
  depthStencilAttachment?: (TextureView | Texture | DepthStencilTextureFormat) | null;
};

/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
export abstract class Framebuffer extends Resource<FramebufferProps> {
  static override defaultProps: Required<FramebufferProps> = {
    ...Resource.defaultProps,
    width: 1,
    height: 1,
    colorAttachments: [], // ['rgba8unorm'],
    depthStencilAttachment: null // 'depth24plus-stencil8'
  };

  override get [Symbol.toStringTag](): string {
    return 'Framebuffer';
  }

  /** Width of all attachments in this framebuffer */
  width: number;
  /** Height of all attachments in this framebuffer */
  height: number;
  /** Color attachments */
  abstract colorAttachments: TextureView[];
  /** Depth-stencil attachment, if provided */
  abstract depthStencilAttachment: TextureView | null;

  constructor(device: Device, props: FramebufferProps = {}) {
    super(device, props, Framebuffer.defaultProps);
    this.width = this.props.width;
    this.height = this.props.height;
  }

  /**
   * Create a copy of this framebuffer with new attached textures, with same props but of the specified size.
   * @note Does not copy contents of the attached textures.
   */
  clone(size?: {width: number; height: number}): Framebuffer {
    const colorAttachments = this.colorAttachments.map(colorAttachment =>
      colorAttachment.texture.clone(size)
    );

    const depthStencilAttachment =
      this.depthStencilAttachment && this.depthStencilAttachment.texture.clone(size);

    return this.device.createFramebuffer({...this.props, colorAttachments, depthStencilAttachment});
  }

  /**
   * Resizes all attachments
   * @note resize() destroys existing textures (if size has changed).
   * @deprecated Use framebuffer.clone()
   */
  resize(size: {width: number; height: number}): void;
  resize(size: [width: number, height: number]): void;
  resize(): void;
  resize(size?: {width: number; height: number} | [width: number, height: number]): void {
    let updateSize: boolean = !size;
    if (size) {
      const [width, height] = Array.isArray(size) ? size : [size.width, size.height];
      updateSize = updateSize || height !== this.height || width !== this.width;
      this.width = width;
      this.height = height;
    }
    if (updateSize) {
      log.log(2, `Resizing framebuffer ${this.id} to ${this.width}x${this.height}`)();
      this.resizeAttachments(this.width, this.height);
    }
  }

  /** Auto creates any textures */
  protected autoCreateAttachmentTextures(): void {
    if (this.props.colorAttachments.length === 0 && !this.props.depthStencilAttachment) {
      throw new Error('Framebuffer has noattachments');
    }

    this.colorAttachments = this.props.colorAttachments.map((attachment, index) => {
      if (typeof attachment === 'string') {
        const texture = this.createColorTexture(attachment, index);
        this.attachResource(texture);
        return texture.view;
      }
      if (attachment instanceof Texture) {
        return attachment.view;
      }
      return attachment;
    });

    const attachment = this.props.depthStencilAttachment;
    if (attachment) {
      if (typeof attachment === 'string') {
        const texture = this.createDepthStencilTexture(attachment);
        this.attachResource(texture);
        this.depthStencilAttachment = texture.view;
      } else if (attachment instanceof Texture) {
        this.depthStencilAttachment = attachment.view;
      } else {
        this.depthStencilAttachment = attachment;
      }
    }
  }

  /** Create a color texture */
  protected createColorTexture(format: TextureFormat, index: number): Texture {
    return this.device.createTexture({
      id: `${this.id}-color-attachment-${index}`,
      usage: Texture.RENDER_ATTACHMENT,
      format,
      width: this.width,
      height: this.height,
      // TODO deprecated? - luma.gl v8 compatibility
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear'
      }
    });
  }

  /** Create depth stencil texture */
  protected createDepthStencilTexture(format: TextureFormat): Texture {
    return this.device.createTexture({
      id: `${this.id}-depth-stencil-attachment`,
      usage: Texture.RENDER_ATTACHMENT,
      format,
      width: this.width,
      height: this.height,
      mipmaps: false
    });
  }

  /**
   * Default implementation of resize
   * Creates new textures with correct size for all attachments.
   * and destroys existing textures if owned
   */
  protected resizeAttachments(width: number, height: number): void {
    for (let i = 0; i < this.colorAttachments.length; ++i) {
      if (this.colorAttachments[i]) {
        const resizedTexture = this.colorAttachments[i].texture.clone({
          width,
          height
        });
        this.destroyAttachedResource(this.colorAttachments[i]);
        this.colorAttachments[i] = resizedTexture.view;
        this.attachResource(resizedTexture.view);
      }
    }

    if (this.depthStencilAttachment) {
      const resizedTexture = this.depthStencilAttachment.texture.clone({
        width,
        height
      });
      this.destroyAttachedResource(this.depthStencilAttachment);
      this.depthStencilAttachment = resizedTexture.view;
      this.attachResource(resizedTexture);
    }

    this.updateAttachments();
  }

  /** Implementation is expected to update any underlying binding (WebGL framebuffer attachment) */
  protected abstract updateAttachments(): void;
}
