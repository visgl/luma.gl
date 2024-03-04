// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ColorTextureFormat,
  DepthStencilTextureFormat,
  TextureFormat
} from '../types/texture-formats';
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
  colorAttachments: TextureView[] = [];
  /** Depth-stencil attachment, if provided */
  depthStencilAttachment: TextureView | null = null;

  constructor(device: Device, props: FramebufferProps = {}) {
    super(device, props, Framebuffer.defaultProps);
    this.width = this.props.width;
    this.height = this.props.height;

    // NOTE: call from subclass constructor as we cannot call overridden methods here (subclass not yet constructed)
    // this.autoCreateAttachmentTextures();
  }

  /**
   * Resizes all attachments
   * @note resize() destroys existing textures (if size has changed).
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

    this.colorAttachments = this.props.colorAttachments.map(attachment => {
      if (typeof attachment === 'string') {
        const texture = this.createColorTexture(attachment);
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
  protected createColorTexture(format: TextureFormat): Texture {
    return this.device.createTexture({
      id: 'color-attachment',
      usage: Texture.RENDER_ATTACHMENT,
      format,
      width: this.width,
      height: this.height
    });
  }

  /** Create depth stencil texture */
  protected createDepthStencilTexture(format: TextureFormat): Texture {
    return this.device.createTexture({
      id: 'depth-stencil-attachment',
      usage: Texture.RENDER_ATTACHMENT,
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
    for (let i = 0; i < this.colorAttachments.length; ++i) {
      if (this.colorAttachments[i]) {
        const resizedTexture = this.device._createTexture({
          ...this.colorAttachments[i].props,
          width,
          height
        });
        this.destroyAttachedResource(this.colorAttachments[i]);
        this.colorAttachments[i] = resizedTexture.view;
        this.attachResource(resizedTexture.view);
      }
    }

    if (this.depthStencilAttachment) {
      const resizedTexture = this.device._createTexture({
        ...this.depthStencilAttachment.props,
        width,
        height
      });
      this.destroyAttachedResource(this.depthStencilAttachment);
      this.depthStencilAttachment = resizedTexture.view;
      this.attachResource(resizedTexture);
    }
  }
}

// TODO - remove if not needed

// Create a color attachment for WebGL *
// protected override createColorTexture(colorAttachment: Required<ColorAttachment>): Required<ColorAttachment> {
//   return this.device._createTexture({
//     id: `${this.id}-color`,
//     data: null, // reserves texture memory, but texels are undefined
//     format,
//     // type: GL.UNSIGNED_BYTE,
//     width: this.width,
//     height: this.height,
//     // Note: Mipmapping can be disabled by texture resource when we resize the texture
//     // to a non-power-of-two dimenstion (NPOT texture) under WebGL1. To have consistant
//     // behavior we always disable mipmaps.
//     mipmaps: false,
//     // Set MIN and MAG filtering parameters so mipmaps are not used in sampling.
//     // Use LINEAR so subpixel algos like fxaa work.
//     // Set WRAP modes that support NPOT textures too.
//     sampler: {
//       minFilter: 'linear',
//       magFilter: 'linear',
//       addressModeU: 'clamp-to-edge',
//       addressModeV: 'clamp-to-edge'
//     }
//     // parameters: {
//     //   [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
//     //   [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
//     //   [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
//     //   [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
//     // }
//   });
// }

// /** Returns fully populated attachment object. */
// protected normalizeColorAttachment(
//   attachment: Texture | ColorTextureFormat
// ): Required<ColorAttachment> {

//   const COLOR_ATTACHMENT_DEFAULTS: Required<ColorAttachment> = {
//     texture: undefined!,
//     format: undefined!,
//     clearValue: [0.0, 0.0, 0.0, 0.0],
//     loadOp: 'clear',
//     storeOp: 'store'
//   };

//   if (attachment instanceof Texture) {
//     return {...COLOR_ATTACHMENT_DEFAULTS, texture: attachment};
//   }
//   if (typeof attachment === 'string') {
//     return {...COLOR_ATTACHMENT_DEFAULTS, format: attachment};
//   }
//   return {...COLOR_ATTACHMENT_DEFAULTS, ...attachment};
// }

// /** Wraps texture inside fully populated attachment object. */
// protected normalizeDepthStencilAttachment(
//   attachment: DepthStencilAttachment | Texture | DepthStencilTextureFormat
// ): Required<DepthStencilAttachment> {
//   const DEPTH_STENCIL_ATTACHMENT_DEFAULTS: Required<DepthStencilAttachment> = {
//     texture: undefined!,
//     format: undefined!,

//     depthClearValue: 1.0,
//     depthLoadOp: 'clear',
//     depthStoreOp: 'store',
//     depthReadOnly: false,

//     stencilClearValue: 0,
//     stencilLoadOp: 'clear',
//     stencilStoreOp: 'store',
//     stencilReadOnly: false
//   };

//   if (typeof attachment === 'string') {
//     return {...DEPTH_STENCIL_ATTACHMENT_DEFAULTS, format: attachment};
//   }
//   // @ts-expect-error attachment instanceof Texture doesn't cover Renderbuffer
//   if (attachment.handle || attachment instanceof Texture) {
//     return {...DEPTH_STENCIL_ATTACHMENT_DEFAULTS, texture: attachment as Texture};
//   }
//   return {...DEPTH_STENCIL_ATTACHMENT_DEFAULTS, ...attachment};
// }
