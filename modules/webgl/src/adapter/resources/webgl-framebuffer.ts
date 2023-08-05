// luma.gl, MIT license

import type {FramebufferProps, TextureFormat} from '@luma.gl/api';
import {Framebuffer, Texture, assert} from '@luma.gl/api';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WEBGLTexture} from './webgl-texture';
import {WEBGLRenderbuffer} from '../objects/webgl-renderbuffer';
import {getDepthStencilAttachmentWebGL} from '../converters/texture-formats';

export type TextureAttachment = [Texture, number?, number?];
export type Attachment = WEBGLTexture | WEBGLRenderbuffer | TextureAttachment;

/** luma.gl Framebuffer, WebGL implementation  */
export class WEBGLFramebuffer extends Framebuffer {
  device: WebGLDevice;
  gl: WebGLRenderingContext;
  handle: WebGLFramebuffer;

  get texture() {
    return this.colorAttachments[0];
  }

  constructor(device: WebGLDevice, props: FramebufferProps) {
    super(device, props);

    // WebGL default framebuffer handle is null
    const isDefaultFramebuffer = props.handle === null;

    this.device = device;
    this.gl = device.gl;
    this.handle =
      this.props.handle || isDefaultFramebuffer ? this.props.handle : this.gl.createFramebuffer();

    if (!isDefaultFramebuffer) {
      // default framebuffer handle is null, so we can't set spector metadata...
      device.setSpectorMetadata(this.handle, {id: this.props.id, props: this.props});

      // Auto create textures for attachments if needed
      this.autoCreateAttachmentTextures();

      /** Attach from a map of attachments */
      this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);

      // Walk the attachments
      for (let i = 0; i < this.colorAttachments.length; ++i) {
        const attachment = this.colorAttachments[i];
        const attachmentPoint = GL.COLOR_ATTACHMENT0 + i;
        if (attachment) {
          this._attachOne(attachmentPoint, attachment as WEBGLTexture);
        }
      }

      if (this.depthStencilAttachment) {
        this._attachOne(
          getDepthStencilAttachmentWebGL(this.depthStencilAttachment.format),
          this.depthStencilAttachment as WEBGLTexture
        );
      }

      this.gl.bindFramebuffer(GL.FRAMEBUFFER, null);
    }

    // @ts-expect-error
    if (props.check !== false) {
      this._checkStatus();
    }
  }

  /** destroys any auto created resources etc. */
  override destroy(): void {
    super.destroy(); // destroys owned resources etc.
    if (!this.destroyed && this.handle !== null) {
      this.gl.deleteFramebuffer(this.handle);
      // this.handle = null;
    }
  }

  // PRIVATE

  /** Check the status */
  protected _checkStatus(): void {
    const {gl} = this;
    // TODO - should we really rely on this trick? 
    const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle) as unknown as WebGLFramebuffer;
    const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER);
    gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer ${_getFrameBufferStatus(status)}`);
    }
  }

  /** In WebGL we must use renderbuffers for depth/stencil attachments (unless we have extensions) */
  protected override createDepthStencilTexture(format: TextureFormat): Texture {
    return new WEBGLRenderbuffer(this.device, {
      id: `${this.id}-depth-stencil`, // TODO misleading if not depth and stencil?
      format,
      // dataFormat: GL.DEPTH_STENCIL,
      // type: GL.UNSIGNED_INT_24_8,
      width: this.width,
      height: this.height
    }) as unknown as WEBGLTexture;
  }

  /** 
   * Attachment resize is expected to be a noop if size is same 
   */
  protected override resizeAttachments(width: number, height: number): this {
    // for default framebuffer, just update the stored size
    if (this.handle === null) {
      // assert(width === undefined && height === undefined);
      this.width = this.gl.drawingBufferWidth;
      this.height = this.gl.drawingBufferHeight;
      return this;
    }

    if (width === undefined) {
      width = this.gl.drawingBufferWidth;
    }
    if (height === undefined) {
      height = this.gl.drawingBufferHeight;
    }

    // TODO Not clear that this is better than default destroy/create implementation

    for (const colorAttachment of this.colorAttachments) {
      (colorAttachment as WEBGLTexture).resize({width, height});
    }
    if (this.depthStencilAttachment) {
      (this.depthStencilAttachment as WEBGLTexture).resize({width, height});
    }
    return this;
  }

  /** Attach one attachment */
  protected _attachOne(
    attachmentPoint: GL,
    attachment: Attachment
  ): WEBGLTexture | WEBGLRenderbuffer {
    if (attachment instanceof WEBGLRenderbuffer) {
      this._attachWEBGLRenderbuffer(attachmentPoint, attachment);
      return attachment;
    } else if (Array.isArray(attachment)) {
      const [texture, layer = 0, level = 0] = attachment;
      this._attachTexture(attachmentPoint, texture as unknown as WEBGLTexture, layer, level);
      return texture as unknown as WEBGLTexture;
    } else if (attachment instanceof WEBGLTexture) {
      this._attachTexture(attachmentPoint, attachment, 0, 0);
      return attachment;
    }
    throw new Error('attach');
  }

  protected _attachWEBGLRenderbuffer(attachment: GL, renderbuffer: WEBGLRenderbuffer): void {
    this.gl.framebufferRenderbuffer(
      GL.FRAMEBUFFER,
      attachment,
      GL.RENDERBUFFER,
      renderbuffer.handle
    );
  }

  /**
   * @param attachment
   * @param texture
   * @param layer = 0 - index into WEBGLTextureArray and Texture3D or face for `TextureCubeMap`
   * @param level  = 0 - mipmapLevel (must be 0 in WebGL1)
   */
  protected _attachTexture(
    attachment: GL,
    texture: WEBGLTexture,
    layer: number,
    level: number
  ): void {
    const {gl, gl2} = this.device;
    gl.bindTexture(texture.target, texture.handle);

    switch (texture.target) {
      case GL.TEXTURE_2D_ARRAY:
      case GL.TEXTURE_3D:
        this.device.assertWebGL2();
        gl2?.framebufferTextureLayer(GL.FRAMEBUFFER, attachment, texture.target, level, layer);
        break;

      case GL.TEXTURE_CUBE_MAP:
        // layer must be a cubemap face (or if index, converted to cube map face)
        const face = mapIndexToCubeMapFace(layer);
        gl.framebufferTexture2D(GL.FRAMEBUFFER, attachment, face, texture.handle, level);
        break;

      case GL.TEXTURE_2D:
        gl.framebufferTexture2D(GL.FRAMEBUFFER, attachment, GL.TEXTURE_2D, texture.handle, level);
        break;

      default:
        assert(false, 'Illegal texture type');
    }

    gl.bindTexture(texture.target, null);
  }
}

// Helper functions

// Map an index to a cube map face constant
function mapIndexToCubeMapFace(layer: number | GL): GL {
  // TEXTURE_CUBE_MAP_POSITIVE_X is a big value (0x8515)
  // if smaller assume layer is index, otherwise assume it is already a cube map face constant
  return layer < GL.TEXTURE_CUBE_MAP_POSITIVE_X ? layer + GL.TEXTURE_CUBE_MAP_POSITIVE_X : layer;
}

// Helper METHODS
// Get a string describing the framebuffer error if installed
function _getFrameBufferStatus(status: GL) {
  switch (status) {
    case GL.FRAMEBUFFER_COMPLETE:
      return 'success';
    case GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return 'Mismatched attachments';
    case GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return 'No attachments';
    case GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return 'Height/width mismatch';
    case GL.FRAMEBUFFER_UNSUPPORTED:
      return 'Unsupported or split attachments';
    // WebGL2
    case GL.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      return 'Samples mismatch';
    // OVR_multiview2 extension
    // case GL.FRAMEBUFFER_INCOMPLETE_VIEW_TARGETS_OVR: return 'baseViewIndex mismatch';
    default:
      return `${status}`;
  }
}
