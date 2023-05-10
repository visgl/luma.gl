// luma.gl, MIT license

import type {FramebufferProps, ColorTextureFormat} from '@luma.gl/api';
import {Framebuffer, Texture, log, assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WEBGLTexture} from './webgl-texture';
import {WEBGLRenderbuffer} from '../objects/webgl-renderbuffer';
import {getWebGLTextureFormat, getWebGLDepthStencilAttachment} from '../converters/texture-formats';

export type TextureAttachment = [Texture, number?, number?];
export type Attachment = WEBGLTexture | WEBGLRenderbuffer | TextureAttachment;

/** luma.gl Framebuffer, WebGL implementation  */
export class WEBGLFramebuffer extends Framebuffer {
  device: WebGLDevice;
  gl: WebGLRenderingContext;
  handle: WebGLFramebuffer;

  get texture() { return this.colorAttachments[0]; }
  readonly colorAttachments: WEBGLTexture[] = [];
  readonly depthStencilAttachment: WEBGLTexture | null = null;
  protected _ownResources: (WEBGLTexture | WEBGLRenderbuffer)[] = [];

  constructor(device: WebGLDevice, props: FramebufferProps) {
    super(device, props);
    this.device = device;
    this.gl = device.gl;
    this.handle = this.props.handle !== undefined ? this.props.handle : this.gl.createFramebuffer();

    if (this.handle) { // default framebuffer is null...
      device.setSpectorMetadata(this.handle, {id: this.props.id, props: this.props});
    }

    this.colorAttachments = this._createColorAttachments();
    // @ts-expect-error
    this.depthStencilAttachment = this._createDepthStencilAttachment();

    /** Attach from a map of attachments */
    const prevHandle = this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);

    // Walk the attachments
    for (let i = 0; i < this.colorAttachments.length; ++i) {
      const attachment = this.colorAttachments[i];
      const attachmentPoint = GL.COLOR_ATTACHMENT0 + i;
      if (attachment) {
        this._attachOne(attachmentPoint, attachment);
      }
    }

    if (this.props.depthStencilAttachment) {
      this._attachOne(getWebGLDepthStencilAttachment(this.depthStencilAttachment.format), this.depthStencilAttachment);
    }

    // @ts-expect-error
    this.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);

    // @ts-expect-error
    if (props.check !== false) {
      this._checkStatus();
    }
  }

  override destroy(): void {
    if (this.handle !== null) {
      for (const resource of this._ownResources) {
        resource.destroy();
      }
      this.gl.deleteFramebuffer(this.handle);
      // this.handle = null;
      this.destroyed = true;
    }
  }

  // PRIVATE

  /** Check the status */
  protected _checkStatus(): void {
    const {gl} = this;
    const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);
    const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER);
    // @ts-expect-error
    gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer ${_getFrameBufferStatus(status)}`);
    }
  }

  _createColorAttachments(): WEBGLTexture[] {
    return this.props.colorAttachments.map(colorAttachment => {
      if (!colorAttachment) {
        return undefined;
      }
      if (colorAttachment instanceof WEBGLTexture) {
        return colorAttachment;
      }
      // if (typeof colorAttachment === 'default') {
      //   return this._createColorAttachment('rgba8unorm', this.width, this.height);
      // }
      // @ts-expect-error
      return this._createColorAttachment(colorAttachment, this.width, this.height);
    });
  }

  /** Create a color attachment */
  protected _createColorAttachment(format: ColorTextureFormat, width: number, height: number): WEBGLTexture {
    const texture = this.device._createTexture({
      id: `${this.id}-color`,
      data: null, // reserves texture memory, but texels are undefined
      format,
      // type: GL.UNSIGNED_BYTE,
      width,
      height,
      // Note: Mipmapping can be disabled by texture resource when we resize the texture
      // to a non-power-of-two dimenstion (NPOT texture) under WebGL1. To have consistant
      // behavior we always disable mipmaps.
      mipmaps: false,
      // Set MIN and MAG filtering parameters so mipmaps are not used in sampling.
      // Use LINEAR so subpixel algos like fxaa work.
      // Set WRAP modes that support NPOT textures too.
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      },
      // parameters: {
      //   [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
      //   [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
      //   [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
      //   [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
      // }
    }) ;
    this._ownResources.push(texture);
    return texture;
  }

  /** Create a depth stencil attachment GL.DEPTH24_STENCIL8 */
  protected _createDepthStencilAttachment(): WEBGLRenderbuffer | WEBGLTexture {
    if (!this.props.depthStencilAttachment) {
      return undefined;
    }
    if (this.props.depthStencilAttachment instanceof WEBGLRenderbuffer) {
      return this.props.depthStencilAttachment;
    }
    if (this.props.depthStencilAttachment instanceof Texture) {
      return this.props.depthStencilAttachment as unknown as WEBGLTexture;
    }
    const format = this.props.depthStencilAttachment;
    const webglFormat = getWebGLTextureFormat(this.gl, format);

    const texture = new WEBGLRenderbuffer(this.device, {
      id: `${this.id}-depth-stencil`, // TODO misleading if not depth and stencil?
      format: webglFormat,
      // dataFormat: GL.DEPTH_STENCIL,
      // type: GL.UNSIGNED_INT_24_8,
      width: this.width,
      height: this.height
    });
    this._ownResources.push(texture);
    return texture;
  }

  /** Attachment resize is expected to be a noop if size is same */
  protected _resizeAttachments(width: number, height: number): this {
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

    if (width !== this.width && height !== this.height) {
      log.log(2, `Resizing framebuffer ${this.id} to ${width}x${height}`)();
    }

    for (const colorAttachment of this.colorAttachments) {
      colorAttachment.resize({width, height});
    }
    this.depthStencilAttachment?.resize({width, height});
    return this;
  }

  /** Attach one attachment */
  protected _attachOne(attachmentPoint: GL, attachment: Attachment): WEBGLTexture | WEBGLRenderbuffer {
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
  protected _attachTexture(attachment: GL, texture: WEBGLTexture, layer: number, level: number): void {
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
