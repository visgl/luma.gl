import GL from '@luma.gl/constants';
import {getWebGL2Context, assertWebGL2Context, log} from '@luma.gl/gltools';
import Resource, {ResourceProps} from './webgl-resource';
import Texture2D from './texture-2d';
import Renderbuffer from './renderbuffer';
import {clear, clearBuffer} from './clear';
import {copyToDataUrl} from './copy-and-blit';

import {getLumaContextData} from '../device/luma-context-data';
import {getFeatures} from '@luma.gl/gltools';
import {getKey} from '../webgl-utils/constants-to-keys';
import {assert} from '../utils/assert';

const ERR_MULTIPLE_RENDERTARGETS = 'Multiple render targets not supported';

type TextureAttachment = {
  texture: Texture2D;
  layer?: number; //  = 0
  level?: number; // = 0
};

type Attachment = Renderbuffer | Texture2D | TextureAttachment;

export type ImmutableFramebufferProps = ResourceProps & {
  attachments?: Record<string, Attachment>;
  readBuffer?: number;
  drawBuffers?: number[];
  check?: boolean;
};

export type FramebufferProps = ImmutableFramebufferProps & {
  width?: number;
  height?: number;
  color?: boolean;
  depth?: boolean;
  stencil?: boolean;
};

type colorBufferFloatOptions = {colorBufferFloat?: boolean; colorBufferHalfFloat?: boolean};

export class ImmutableFramebuffer extends Resource<FramebufferProps> {
  constructor(gl: WebGLRenderingContext, props?: FramebufferProps) {
    super(gl, props, {} as any);
    this._initialize({
      attachments: props?.attachments || {},
      readBuffer: props?.readBuffer,
      drawBuffers: props?.drawBuffers
    });
  }

  checkStatus(): this {
    const {gl} = this;
    const status = this.getStatus();
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(_getFrameBufferStatus(status));
    }
    return this;
  }

  getStatus(): number {
    const {gl} = this;
    const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);
    const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER);
    // @ts-expect-error
    gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
    return status;
  }

  // DEBUG

  // Note: Will only work when called in an event handler
  show() {
    if (typeof window !== 'undefined') {
      window.open(copyToDataUrl(this), 'luma-debug-texture');
    }
    return this;
  }

  log(logLevel = 0, message = '') {
    if (logLevel > log.level || typeof window === 'undefined') {
      return this;
    }
    message = message || `Framebuffer ${this.id}`;
    const image = copyToDataUrl(this, {targetMaxHeight: 100});
    // @ts-expect-error probe.gl typings incorrectly require priority...
    log.image({logLevel, message, image})();
    return this;
  }

  // WEBGL INTERFACE
  bind({target = GL.FRAMEBUFFER} = {}) {
    this.gl.bindFramebuffer(target, this.handle);
    return this;
  }

  unbind({target = GL.FRAMEBUFFER} = {}) {
    this.gl.bindFramebuffer(target, null);
    return this;
  }

  // PRIVATE

  _initialize(options: {attachments: Record<string, Attachment>; readBuffer?: number; drawBuffers?: number[]}): this {
    const {attachments = {}, readBuffer, drawBuffers} = options;

    this._attach(attachments);

    // Multiple render target support, set read buffer and draw buffers
    const prevHandle = this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);
    if (readBuffer) {
      this._setReadBuffer(readBuffer);
    }
    if (drawBuffers) {
      this._setDrawBuffers(drawBuffers);
    }
    // @ts-expect-error
    this.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);

    return this;
  }

  /** Attach from a map of attachments */
  _attach(attachments: Record<string, Attachment>) {
    const prevHandle = this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);

    // Walk the attachments
    for (const key in attachments) {
      // Ensure key is not undefined
      assert(key !== undefined, 'Misspelled framebuffer binding point?');
      const attachmentPoint = Number(key) as GL;
      const attachment = attachments[attachmentPoint];
      this._attachOne(attachmentPoint, attachment);
    }

    // @ts-expect-error
    this.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  }

  /** Attach one attachment */
  _attachOne(attachmentPoint: GL, attachment: Attachment): Renderbuffer | Texture2D {
    if (attachment instanceof Renderbuffer) {
      this._attachRenderbuffer(attachmentPoint, attachment);
      return attachment;
    } else if (Array.isArray(attachment)) {
      const [texture, layer = 0, level = 0] = attachment;
      this._attachTexture(attachmentPoint, texture, layer, level);
      return texture;
    } else if (attachment instanceof Texture2D) {
      this._attachTexture(attachmentPoint, attachment, 0, 0);
      return attachment;
    }
  }

  _attachRenderbuffer(attachment: GL, renderbuffer: Renderbuffer): void {
    this.gl.framebufferRenderbuffer(GL.FRAMEBUFFER, attachment, GL.RENDERBUFFER, renderbuffer.handle);
  }

  /**
   * @param attachment 
   * @param texture 
   * @param layer = 0 - index into Texture2DArray and Texture3D or face for `TextureCubeMap`
   * @param level  = 0 - mipmapLevel (must be 0 in WebGL1)
   */
  _attachTexture(attachment: GL, texture: Texture2D, layer: number, level: number): void {
    const {gl} = this;
    gl.bindTexture(texture.target, texture.handle);

    switch (texture.target) {
      case GL.TEXTURE_2D_ARRAY:
      case GL.TEXTURE_3D:
        const gl2 = assertWebGL2Context(gl);
        gl2.framebufferTextureLayer(GL.FRAMEBUFFER, attachment, texture.target, level, layer);
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

  /** @note Expects framebuffer to be bound */
  _setReadBuffer(readBuffer: number): void {
    const gl2 = getWebGL2Context(this.gl);
    if (gl2) {
      gl2.readBuffer(readBuffer);
    } else {
      // Setting to color attachment 0 is a noop, so allow it in WebGL1
      assert(
        readBuffer === GL.COLOR_ATTACHMENT0 || readBuffer === GL.BACK,
        ERR_MULTIPLE_RENDERTARGETS
      );
    }
  }

  /** @note Expects framebuffer to be bound */
  _setDrawBuffers(drawBuffers: number[]) {
    const {gl} = this;
    const gl2 = assertWebGL2Context(gl);
    if (gl2) {
      gl2.drawBuffers(drawBuffers);
    } else {
      // TODO - is this not handled by polyfills?
      const ext = gl.getExtension('WEBGL_draw_buffers');
      if (ext) {
        ext.drawBuffersWEBGL(drawBuffers);
      } else {
        // Setting a single draw buffer to color attachment 0 is a noop, allow in WebGL1
        assert(
          drawBuffers.length === 1 &&
            (drawBuffers[0] === GL.COLOR_ATTACHMENT0 || drawBuffers[0] === GL.BACK),
          ERR_MULTIPLE_RENDERTARGETS
        );
      }
    }
  }

  // RESOURCE METHODS

  _createHandle() {
    return this.gl.createFramebuffer();
  }

  _deleteHandle() {
    this.gl.deleteFramebuffer(this.handle);
  }

  _bindHandle(handle) {
    return this.gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  }
}

export default class Framebuffer extends ImmutableFramebuffer {
  width = null;
  height = null;
  attachments = {};
  readBuffer = GL.COLOR_ATTACHMENT0;
  drawBuffers = [GL.COLOR_ATTACHMENT0];
  ownResources = [];

  static readonly FRAMEBUFFER_ATTACHMENT_PARAMETERS = [
    GL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, // WebGLRenderbuffer or WebGLTexture
    GL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, // GL.RENDERBUFFER, GL.TEXTURE, GL.NONE
    // GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE, // GL.TEXTURE_CUBE_MAP_POSITIVE_X, etc.
    // GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL, // GLint
    // EXT_sRGB or WebGL2
    GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING, // GL.LINEAR, GL.SRBG
    // WebGL2
    // GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER, // GLint
    GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE, // GLint
    GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE, // GLint
    GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE, // GLint
    GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE, // GLint
    GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE, // GLint
    GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE // GLint
    // GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE
    // GL.FLOAT, GL.INT, GL.UNSIGNED_INT, GL.SIGNED_NORMALIZED, OR GL.UNSIGNED_NORMALIZED.
  ];

  /**
   * Check color buffer float support
   * @param options.colorBufferFloat  Whether floating point textures can be rendered and read
   * @param options.colorBufferHalfFloat Whether half float textures can be rendered and read
   */
  static isSupported(gl: WebGLRenderingContext, options: colorBufferFloatOptions): boolean {
    return isFloatColorBufferSupported(gl, options);
  }

  /**
   * returns the default Framebuffer
   * Creates a Framebuffer object wrapper for the default WebGL framebuffer (target === null)
   */
  static getDefaultFramebuffer(gl: WebGLRenderingContext): Framebuffer {
    const lumaContextData = getLumaContextData(gl);
    lumaContextData.defaultFramebuffer =
      lumaContextData.defaultFramebuffer ||
      new Framebuffer(gl, {
        id: 'default-framebuffer',
        handle: null,
        attachments: {}
      });
    // TODO - can we query for and get a handle to the GL.FRONT renderbuffer?
    return lumaContextData.defaultFramebuffer;
  }

  get MAX_COLOR_ATTACHMENTS(): number {
    const gl2 = assertWebGL2Context(this.gl);
    return gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS);
  }

  get MAX_DRAW_BUFFERS(): number {
    const gl2 = assertWebGL2Context(this.gl);
    return gl2.getParameter(gl2.MAX_DRAW_BUFFERS);
  }

  constructor(gl: WebGLRenderingContext, props?: FramebufferProps) {
    super(gl, props);
    this.initialize(props);
    Object.seal(this);
  }

  get color() {
    return this.attachments[GL.COLOR_ATTACHMENT0] || null;
  }

  get texture() {
    return this.attachments[GL.COLOR_ATTACHMENT0] || null;
  }

  get depth() {
    return (
      this.attachments[GL.DEPTH_ATTACHMENT] || this.attachments[GL.DEPTH_STENCIL_ATTACHMENT] || null
    );
  }

  get stencil() {
    return (
      this.attachments[GL.STENCIL_ATTACHMENT] ||
      this.attachments[GL.DEPTH_STENCIL_ATTACHMENT] ||
      null
    );
  }

  // initialize(props?: FramebufferProps): this;
  initialize(props: FramebufferProps) {
    let {attachments = null} = props || {};
    const {
      width = 1,
      height = 1,
      color = true,
      depth = true,
      stencil = false,
      check = true,
      readBuffer = undefined,
      drawBuffers = undefined
    } = props || {};
    assert(width >= 0 && height >= 0, 'Width and height need to be integers');

    // Store actual width and height for diffing
    this.width = width;
    this.height = height;

    // Resize any provided attachments - note that resize only resizes if needed
    // Note: A framebuffer has no separate size, it is defined by its attachments (which must agree)
    if (attachments) {
      for (const attachment in attachments) {
        const target = attachments[attachment];
        const object = Array.isArray(target) ? target[0] : target;
        object.resize({width, height});
      }
    } else {
      // Create any requested default attachments
      attachments = this._createDefaultAttachments(color, depth, stencil, width, height);
    }

    this.update({clearAttachments: true, attachments, readBuffer, drawBuffers});

    // Checks that framebuffer was properly set up, if not, throws an explanatory error
    if (attachments && check) {
      this.checkStatus();
    }
  }

  delete(): this {
    for (const resource of this.ownResources) {
      resource.delete();
    }
    super.delete();
    return this;
  }

  update(options: {
    attachments: Record<string, Attachment>,
    readBuffer?: number,
    drawBuffers?,
    clearAttachments?: boolean,
    resizeAttachments?: boolean
  }): this {

    const {
      attachments = {},
      readBuffer,
      drawBuffers,
      clearAttachments = false,
      resizeAttachments = true
    } = options;

    this.attach(attachments, {clearAttachments, resizeAttachments});

    const {gl} = this;
    // Multiple render target support, set read buffer and draw buffers
    const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);
    if (readBuffer) {
      this._setReadBuffer(readBuffer);
      this.readBuffer = readBuffer;
    }
    if (drawBuffers) {
      this._setDrawBuffers(drawBuffers);
      this.drawBuffers = drawBuffers;
    }
    // @ts-expect-error
    gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);

    return this;
  }

  /** Attachment resize is expected to be a noop if size is same */
  resize(size?: {width?: number; height?: number}): this {
    let {width, height} = size || {};
    // for default framebuffer, just update the stored size
    if (this.handle === null) {
      assert(width === undefined && height === undefined);
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
    for (const attachmentPoint in this.attachments) {
      this.attachments[attachmentPoint].resize({width, height});
    }
    this.width = width;
    this.height = height;
    return this;
  }

  /** Attach from a map of attachments */
  attach(attachments, {clearAttachments = false, resizeAttachments = true} = {}) {
    const newAttachments = {};

    // Any current attachments need to be removed, add null values to map
    if (clearAttachments) {
      Object.keys(this.attachments).forEach((key) => {
        newAttachments[key] = null;
      });
    }

    // Overlay the new attachments
    Object.assign(newAttachments, attachments);

    const prevHandle = this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);

    // Walk the attachments
    for (const key in newAttachments) {
      // Ensure key is not undefined
      assert(key !== undefined, 'Misspelled framebuffer binding point?');

      const attachment = Number(key);

      const descriptor = newAttachments[attachment];
      let object = descriptor;
      if (!object) {
        this._unattach(attachment);
      } else {
        object = this._attachOne(attachment, object);
        this.attachments[attachment] = object;
      }

      // Resize objects
      if (resizeAttachments && object) {
        object.resize({width: this.width, height: this.height});
      }
    }

    // @ts-expect-error
    this.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);

    // Assign to attachments and remove any nulls to get a clean attachment map
    Object.assign(this.attachments, attachments);
    Object.keys(this.attachments)
      .filter((key) => !this.attachments[key])
      .forEach((key) => {
        delete this.attachments[key];
      });
  }

  clear(options?: {color?: any; depth?: any; stencil?: any; drawBuffers?: any[]}): this {
    const {color, depth, stencil, drawBuffers = []} = options;

    // Bind framebuffer and delegate to global clear functions
    const prevHandle = this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);

    if (color || depth || stencil) {
      clear(this.gl, {color, depth, stencil});
    }

    drawBuffers.forEach((value, drawBuffer) => {
      clearBuffer(this.gl, {drawBuffer, value});
    });

    // @ts-expect-error
    this.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);

    return this;
  }

  // WEBGL2 INTERFACE

  // Copies a rectangle of pixels between framebuffers
  // eslint-disable-next-line complexity
  blit(opts = {}) {
    log.error('Framebuffer.blit({...}) is no logner supported, use blit(source, target, opts)')();
    return null;
  }

  // signals to the GL that it need not preserve all pixels of a specified region of the framebuffer
  invalidate(options: {attachments: []; x?: number; y?: number; width: number; height: number}) {
    const {attachments = [], x = 0, y = 0, width, height} = options;
    const gl2 = assertWebGL2Context(this.gl);
    const prevHandle = gl2.bindFramebuffer(GL.READ_FRAMEBUFFER, this.handle);
    const invalidateAll = x === 0 && y === 0 && width === undefined && height === undefined;
    if (invalidateAll) {
      gl2.invalidateFramebuffer(GL.READ_FRAMEBUFFER, attachments);
    } else {
      // TODO - why does type checking fail on this line
      // @ts-expect-error
      gl2.invalidateFramebuffer(GL.READ_FRAMEBUFFER, attachments, x, y, width, height);
    }
    // @ts-expect-error
    gl2.bindFramebuffer(GL.READ_FRAMEBUFFER, prevHandle);
    return this;
  }

  // Return the value for `pname` of the specified attachment.
  // The type returned is the type of the requested pname
  getAttachmentParameter(attachment, pname, keys) {
    let value = this._getAttachmentParameterFallback(pname);
    if (value === null) {
      this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);
      value = this.gl.getFramebufferAttachmentParameter(GL.FRAMEBUFFER, attachment, pname);
      this.gl.bindFramebuffer(GL.FRAMEBUFFER, null);
    }
    if (keys && value > 1000) {
      // @ts-expect-error
      value = getKey(this.gl, value);
    }
    return value;
  }

  getAttachmentParameters(
    attachment = GL.COLOR_ATTACHMENT0,
    keys,
    // @ts-expect-error
    parameters = this.constructor.ATTACHMENT_PARAMETERS || []
  ) {
    const values = {};
    for (const pname of parameters) {
      const key = keys ? getKey(this.gl, pname) : pname;
      values[key] = this.getAttachmentParameter(attachment, pname, keys);
    }
    return values;
  }

  // @ts-expect-error
  getParameters(keys = true) {
    const attachments = Object.keys(this.attachments);
    // if (this === this.gl.luma.defaultFramebuffer) {
    //   attachments = [GL.COLOR_ATTACHMENT0, GL.DEPTH_STENCIL_ATTACHMENT];
    // }
    const parameters = {};
    for (const attachmentName of attachments) {
      const attachment = Number(attachmentName);
      const key = keys ? getKey(this.gl, attachment) : attachment;
      parameters[key] = this.getAttachmentParameters(attachment, keys);
    }
    return parameters;
  }

  // PRIVATE METHODS

  _createDefaultAttachments(color, depth, stencil, width, height) {
    let defaultAttachments = null;

    // Add a color buffer if requested and not supplied
    if (color) {
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[GL.COLOR_ATTACHMENT0] = new Texture2D(this.gl, {
        id: `${this.id}-color0`,
        pixels: null, // reserves texture memory, but texels are undefined
        format: GL.RGBA,
        type: GL.UNSIGNED_BYTE,
        width,
        height,
        // Note: Mipmapping can be disabled by texture resource when we resize the texture
        // to a non-power-of-two dimenstion (NPOT texture) under WebGL1. To have consistant
        // behavior we always disable mipmaps.
        mipmaps: false,
        // Set MIN and MAG filtering parameters so mipmaps are not used in sampling.
        // Use LINEAR so subpixel algos like fxaa work.
        // Set WRAP modes that support NPOT textures too.
        parameters: {
          [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
          [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
          [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
        }
      });
      // track to delete later
      this.ownResources.push(defaultAttachments[GL.COLOR_ATTACHMENT0]);
    }

    if (depth && stencil) {
      // TODO - handle separate stencil
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[GL.DEPTH_STENCIL_ATTACHMENT] = new Renderbuffer(this.gl, {
        id: `${this.id}-depth-stencil`,
        format: GL.DEPTH24_STENCIL8,
        width,
        height: 111
      });
      // track to delete later
      this.ownResources.push(defaultAttachments[GL.DEPTH_STENCIL_ATTACHMENT]);
      // TODO - optional texture
      // new Texture2D(this.gl, {
      //   id: `${this.id}-depth-stencil`,
      //   format: GL.DEPTH24_STENCIL8,
      //   dataFormat: GL.DEPTH_STENCIL,
      //   type: GL.UNSIGNED_INT_24_8,
      //   width,
      //   height,
      //   mipmaps: false
      // });
    } else if (depth) {
      // Add a depth buffer if requested and not supplied
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[GL.DEPTH_ATTACHMENT] = new Renderbuffer(this.gl, {
        id: `${this.id}-depth`,
        format: GL.DEPTH_COMPONENT16,
        width,
        height
      });
      // track to delete later
      this.ownResources.push(defaultAttachments[GL.DEPTH_ATTACHMENT]);
    } else if (stencil) {
      // TODO - handle separate stencil
      assert(false);
    }

    return defaultAttachments;
  }

  _unattach(attachment) {
    const oldAttachment = this.attachments[attachment];
    if (!oldAttachment) {
      return;
    }
    if (oldAttachment instanceof Renderbuffer) {
      // render buffer
      this.gl.framebufferRenderbuffer(GL.FRAMEBUFFER, attachment, GL.RENDERBUFFER, null);
    } else {
      // Must be a texture attachment
      this.gl.framebufferTexture2D(GL.FRAMEBUFFER, attachment, GL.TEXTURE_2D, null, 0);
    }
    delete this.attachments[attachment];
  }

  /**
   * Attempt to provide workable defaults for WebGL2 symbols under WebGL1
   * null means OK to query
   * TODO - move to webgl1 polyfills
   * @param pname 
   * @returns 
   */
  // eslint-disable-next-line complexity
  _getAttachmentParameterFallback(pname) {
    const caps = getFeatures(this.gl);

    switch (pname) {
      case GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: // GLint
        return !caps.WEBGL2 ? 0 : null;
      case GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: // GLint
        return !caps.WEBGL2 ? 8 : null;
      case GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: // GLenum
        return !caps.WEBGL2 ? GL.UNSIGNED_INT : null;
      case GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING:
        return !caps.WEBGL2 && !caps.EXT_sRGB ? GL.LINEAR : null;
      default:
        return null;
    }
  }
}

// PUBLIC METHODS

// Map an index to a cube map face constant
function mapIndexToCubeMapFace(layer) {
  // TEXTURE_CUBE_MAP_POSITIVE_X is a big value (0x8515)
  // if smaller assume layer is index, otherwise assume it is already a cube map face constant
  return layer < GL.TEXTURE_CUBE_MAP_POSITIVE_X ? layer + GL.TEXTURE_CUBE_MAP_POSITIVE_X : layer;
}

// Helper METHODS
// Get a string describing the framebuffer error if installed
function _getFrameBufferStatus(status) {
  // Use error mapping if installed
  // @ts-expect-error
  const STATUS = Framebuffer.STATUS || {};
  return STATUS[status] || `Framebuffer error ${status}`;
}

/**
 * Support
 * @param gl
 * @param options.colorBufferFloat  Whether floating point textures can be rendered and read
 * @param options.colorBufferHalfFloat Whether half float textures can be rendered and read
 */
function isFloatColorBufferSupported(
  gl: WebGLRenderingContext,
  options: {colorBufferFloat?: boolean; colorBufferHalfFloat?: boolean}
): boolean {
  const {
    colorBufferFloat, // Whether floating point textures can be rendered and read
    colorBufferHalfFloat // Whether half float textures can be rendered and read
  } = options;
  let supported = true;

  if (colorBufferFloat) {
    supported = Boolean(
      // WebGL 2
      gl.getExtension('EXT_color_buffer_float') ||
        // WebGL 1, not exposed on all platforms
        gl.getExtension('WEBGL_color_buffer_float') ||
        // WebGL 1, implicitly enables float render targets https://www.khronos.org/registry/webgl/extensions/OES_texture_float/
        gl.getExtension('OES_texture_float')
    );
  }

  if (colorBufferHalfFloat) {
    supported =
      supported &&
      Boolean(
        // WebGL 2
        gl.getExtension('EXT_color_buffer_float') ||
          // WebGL 1
          gl.getExtension('EXT_color_buffer_half_float')
      );
  }

  return supported;
}
