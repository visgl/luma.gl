// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  TextureFormatColor,
  TextureFormatDepthStencil,
  TextureFormat
} from '../../../shadertypes/texture-types/texture-formats';
import type {Device} from '../device';
import {DeviceResource, DeviceResourceProps} from './device-resource';
import {Texture} from './texture';
import {TextureView} from './texture-view';
import {log} from '../../utils/log';

export type FramebufferProps = DeviceResourceProps & {
  width?: number;
  height?: number;
  /** Sample count for automatically allocated offscreen render storage. */
  samples?: 1 | 4;
  colorAttachments?: (TextureView | Texture | TextureFormatColor)[];
  depthStencilAttachment?: (TextureView | Texture | TextureFormatDepthStencil) | null;
};

/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
export abstract class Framebuffer extends DeviceResource<FramebufferProps> {
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
    if (this.props.samples === 4) {
      const depth = this.props.depthStencilAttachment;
      if (depth && typeof depth !== 'string') {
        throw new Error('Multisampled framebuffer depth/stencil storage requires a format string');
      }
      for (const attachment of this.props.colorAttachments) {
        if (typeof attachment === 'string') continue;
        const texture = attachment instanceof Texture ? attachment : attachment.texture;
        if (
          texture.samples !== 1 ||
          texture.width !== this.width ||
          texture.height !== this.height
        ) {
          throw new Error(
            'Multisampled framebuffer color targets must be matching single-sample textures'
          );
        }
      }
    }
  }

  /**
   * Create a copy of this framebuffer with new attached textures, with same props but of the specified size.
   * @note Does not copy contents of the attached textures.
   */
  clone(size?: {width: number; height: number}): Framebuffer {
    const colorAttachments = this.colorAttachments.map(colorAttachment =>
      colorAttachment.texture.clone(size)
    );

    // Backend-owned storage may have no texture view. Preserve the requested format so
    // the new framebuffer can allocate its own storage.
    const depthStencilAttachment =
      this.props.samples === 4
        ? this.props.depthStencilAttachment
        : (this.depthStencilAttachment?.texture.clone(size) ??
          (typeof this.props.depthStencilAttachment === 'string'
            ? this.props.depthStencilAttachment
            : null));

    const framebuffer = this.device.createFramebuffer({
      ...this.props,
      width: this.width,
      height: this.height,
      ...size,
      colorAttachments,
      depthStencilAttachment
    });
    for (const texture of colorAttachments) {
      framebuffer.attachResource(texture);
    }
    if (depthStencilAttachment instanceof Texture) {
      framebuffer.attachResource(depthStencilAttachment);
    }
    return framebuffer;
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

  /** Creates attachment textures. Backends can pass null for native depth/stencil storage. */
  protected autoCreateAttachmentTextures(attachment = this.props.depthStencilAttachment): void {
    // Validate the requested attachments. A backend can omit a texture here and attach
    // native storage separately, such as a WebGL stencil renderbuffer.
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

  /** Creates a depth/stencil texture. */
  protected createDepthStencilTexture(format: TextureFormat): Texture {
    return this.device.createTexture({
      id: `${this.id}-depth-stencil-attachment`,
      usage:
        this.props.samples === 4
          ? Texture.RENDER_ATTACHMENT
          : Texture.RENDER_ATTACHMENT | Texture.SAMPLE,
      samples: this.props.samples,
      format,
      width: this.width,
      height: this.height
    });
  }

  /**
   * Default implementation of resize
   * Creates new textures with correct size for all attachments.
   * and destroys existing textures if owned
   */
  protected resizeAttachments(width: number, height: number): void {
    this.colorAttachments.forEach((colorAttachment, index) => {
      const resizedTexture = colorAttachment.texture.clone({
        width,
        height
      });
      this.destroyAttachedResource(colorAttachment.texture);
      this.colorAttachments[index] = resizedTexture.view;
      this.attachResource(resizedTexture);
    });

    if (this.depthStencilAttachment) {
      const resizedTexture = this.depthStencilAttachment.texture.clone({
        width,
        height
      });
      this.destroyAttachedResource(this.depthStencilAttachment.texture);
      this.depthStencilAttachment = resizedTexture.view;
      this.attachResource(resizedTexture);
    }

    this.updateAttachments();
  }

  /** Implementation is expected to update any underlying binding (WebGL framebuffer attachment) */
  protected abstract updateAttachments(): void;

  static override defaultProps: Required<FramebufferProps> = {
    ...DeviceResource.defaultProps,
    width: 1,
    height: 1,
    samples: 1,
    colorAttachments: [], // ['rgba8unorm'],
    depthStencilAttachment: null // 'depth24plus-stencil8'
  };
}
