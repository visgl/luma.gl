import type {FramebufferProps} from '@luma.gl/api';
import {Device, log, assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {getWebGL2Context, assertWebGL2Context, WEBGLTexture} from '@luma.gl/webgl';
import {getKey} from '../webgl-utils/constants-to-keys';
import Renderbuffer from './renderbuffer';
import {clear, clearBuffer} from './clear';
import Texture from './texture';
// import {copyToDataUrl} from './copy-and-blit';

import {WebGLDevice, WEBGLFramebuffer} from '@luma.gl/webgl';

export type TextureAttachment = [Texture, number?, number?];
export type Attachment = WEBGLTexture | Renderbuffer | TextureAttachment | null;

export type Attachments = Record<string, Attachment | Renderbuffer>;

const ERR_MULTIPLE_RENDERTARGETS = 'Multiple render targets not supported';

/** @deprecated backwards compatibility props */
export type ClassicFramebufferProps = FramebufferProps & {
  attachments?: Attachments;
  readBuffer?: number;
  drawBuffers?: number[];
  check?: boolean;
  width?: number;
  height?: number;
  color?: boolean;
  depth?: boolean;
  stencil?: boolean;
};

type ColorBufferFloatOptions = {colorBufferFloat?: boolean; colorBufferHalfFloat?: boolean};

/** Convert classic framebuffer attachments array to WebGPU style attachments */
function getDefaultProps(props: ClassicFramebufferProps): FramebufferProps {
  const newProps: FramebufferProps = {...props};
  const {color = true, depth = true, stencil = false} = props;

  if (props.attachments) {
    newProps.depthStencilAttachment = undefined;
    newProps.colorAttachments = newProps.colorAttachments || [];
    for (const [attachmentPoint, attachment] of Object.entries(props.attachments)) {
      switch (Number(attachmentPoint) as GL) {
        case GL.DEPTH_ATTACHMENT:
        case GL.STENCIL_ATTACHMENT:
        case GL.DEPTH_STENCIL_ATTACHMENT:
          // @ts-expect-error
          newProps.depthStencilAttachment = attachment;
          break;
        default:
          // TODO, map attachmentPoint
          // @ts-expect-error
          newProps.colorAttachments.push(attachment);
          break;
      }
    }
    // @ts-expect-error
    delete newProps.attachments;
    return newProps;
  }

  if (color) {
    newProps.colorAttachments = newProps.colorAttachments || ['rgba8unorm-unsized'];
  }
  if (depth && stencil) {
    newProps.depthStencilAttachment = newProps.depthStencilAttachment || 'depth24plus-stencil8';
  } else if (depth) {
    newProps.depthStencilAttachment = newProps.depthStencilAttachment || 'depth16unorm';
  } else if (stencil) {
    newProps.depthStencilAttachment = newProps.depthStencilAttachment || 'stencil8';
  }
  return newProps;
}

/** @deprecated Use device.createFramebuffer() */
export default class ClassicFramebuffer extends WEBGLFramebuffer {
  attachments: Attachments = {};
  readBuffer = GL.COLOR_ATTACHMENT0;
  drawBuffers = [GL.COLOR_ATTACHMENT0];
  ownResources: unknown[] = [];

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
  static isSupported(device: Device | WebGLRenderingContext, options: ColorBufferFloatOptions): boolean {
    const webglDevice = WebGLDevice.attach(device);
    return isFloatColorBufferSupported(webglDevice.gl, options);
  }

  /**
   * returns the default Classic
   * Creates a Framebuffer object wrapper for the default WebGL framebuffer (target === null)
   */
  static getDefaultFramebuffer(device: Device | WebGLRenderingContext): ClassicFramebuffer {
    const webglDevice = WebGLDevice.attach(device);
    // @ts-expect-error
    webglDevice.defaultFramebuffer =
    // @ts-expect-error
    webglDevice.defaultFramebuffer ||
      new ClassicFramebuffer(device, {
        id: 'default-framebuffer',
        handle: null,
        attachments: {},
        check: false
      });
    // TODO - can we query for and get a handle to the GL.FRONT renderbuffer?
    // @ts-expect-error
    return webglDevice.defaultFramebuffer;
  }

  get MAX_COLOR_ATTACHMENTS(): number {
    const gl2 = assertWebGL2Context(this.gl);
    return gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS);
  }

  get MAX_DRAW_BUFFERS(): number {
    const gl2 = assertWebGL2Context(this.gl);
    return gl2.getParameter(gl2.MAX_DRAW_BUFFERS);
  }

  constructor(device: Device | WebGLRenderingContext, props: ClassicFramebufferProps = {}) {
    super(WebGLDevice.attach(device), getDefaultProps(props));
    this.width = null;
    this.height = null;
  
    this.initialize(props);
    Object.seal(this);
  }

  get color() {
    return this.colorAttachments[0] || null;
    // return this.attachments[GL.COLOR_ATTACHMENT0] || null;
  }

  override get texture() {
    return this.colorAttachments[0] || null;
    // return this.attachments[GL.COLOR_ATTACHMENT0] || null;
  }

  get depth() {
    return (
      this.depthStencilAttachment || null
      // this.attachments[GL.DEPTH_ATTACHMENT] || this.attachments[GL.DEPTH_STENCIL_ATTACHMENT] || null
    );
  }

  get stencil() {
    return (
      this.depthStencilAttachment ||
      // this.attachments[GL.STENCIL_ATTACHMENT] ||
      // this.attachments[GL.DEPTH_STENCIL_ATTACHMENT] ||
      null
    );
  }

  // initialize(props?: ClassicFramebufferProps): this;
  initialize(props: ClassicFramebufferProps) {
    const {attachments = null} = props || {};
    const {
      width = 1,
      height = 1,
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
        // @ts-ignore-error
        object.resize({width, height});
      }
    } else {
      // Create any requested default attachments
      // attachments = this._createDefaultAttachments(color, depth, stencil, width, height);
    }

    this.update({clearAttachments: true, attachments, readBuffer, drawBuffers});

    // Checks that framebuffer was properly set up, if not, throws an explanatory error
    if (attachments && check) {
      this.checkStatus();
    }
  }

  checkStatus(): this {
    super._checkStatus();
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

  // WEBGL INTERFACE
  bind({target = GL.FRAMEBUFFER} = {}) {
    this.gl.bindFramebuffer(target, this.handle);
    return this;
  }

  unbind({target = GL.FRAMEBUFFER} = {}) {
    this.gl.bindFramebuffer(target, null);
    return this;
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

  _createHandle(): WebGLFramebuffer {
    return this.gl.createFramebuffer();
  }

  _deleteHandle(): void {
    this.gl.deleteFramebuffer(this.handle);
  }

  _bindHandle(handle: WebGLFramebuffer): unknown {
    return this.gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  }

  update(options: {
    attachments: Record<string, Attachment | Renderbuffer>,
    readBuffer?: number,
    drawBuffers?: number[],
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

  /** Attach from a map of attachments */
  attach(attachments: Attachments, {clearAttachments = false, resizeAttachments = true} = {}) {
    const newAttachments: Attachments = {};

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
        // @ts-expect-error TODO looks like a valid type mismatch
        object = this._attachOne(attachment, object);
        this.attachments[attachment] = object;
      }

      // Resize objects
      if (resizeAttachments && object) {
        // @ts-expect-error TODO looks like a valid type mismatch
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
  getAttachmentParameter(attachment: number, pname: GL, keys?: boolean) {
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
    keys?: boolean,
    // @ts-expect-error
    parameters = this.constructor.ATTACHMENT_PARAMETERS || []
  ) {
    const values: Record<string, number> = {};
    for (const pname of parameters) {
      const key = keys ? getKey(this.gl, pname) : pname;
      values[key] = this.getAttachmentParameter(attachment, pname, keys);
    }
    return values;
  }

  getParameters(keys = true) {
    const attachments = Object.keys(this.attachments);
    // if (this === this.gl.luma.defaultFramebuffer) {
    //   attachments = [GL.COLOR_ATTACHMENT0, GL.DEPTH_STENCIL_ATTACHMENT];
    // }
    const parameters: Record<string, number> = {};
    for (const attachmentName of attachments) {
      const attachment = Number(attachmentName);
      const key = keys ? getKey(this.gl, attachment) : attachment;
      // @ts-expect-error - this looks wrong?
      parameters[key] = this.getAttachmentParameters(attachment, keys);
    }
    return parameters;
  }

  // Note: Will only work when called in an event handler
  show() {
    if (typeof window !== 'undefined') {
      // window.open(copyToDataUrl(this), 'luma-debug-texture');
    }
    return this;
  }

  log(logLevel = 0, message = '') {
    if (logLevel > log.level || typeof window === 'undefined') {
      return this;
    }
    message = message || `Framebuffer ${this.id}`;
    // const image = copyToDataUrl(this, {targetMaxHeight: 100});
    // // @ts-expect-error probe.gl typings incorrectly require priority...
    // log.image({logLevel, message, image})();
    return this;
  }

  // PRIVATE METHODS

  _unattach(attachment: GL) {
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
  _getAttachmentParameterFallback(pname: GL): number {
    const webglDevice = WebGLDevice.attach(this.gl);
    const features = webglDevice.features;

    switch (pname) {
      case GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: // GLint
        return !features.has('webgl2') ? 0 : null;
      case GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: // GLint
      case GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: // GLint
        return !features.has('webgl2') ? 8 : null;
      case GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: // GLenum
        return !features.has('webgl2') ? GL.UNSIGNED_INT : null;
      case GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING:
        return !features.has('webgl2') && !features.has('texture-formats-srgb-webgl1') ? GL.LINEAR : null;
      default:
        return null;
    }
  }
}

// PUBLIC METHODS

/**
 * Support
 * @param gl
 * @param options.colorBufferFloat  Whether floating point textures can be rendered and read
 * @param options.colorBufferHalfFloat Whether half float textures can be rendered and read
 */
function isFloatColorBufferSupported(
  device: Device | WebGLRenderingContext,
  options: {colorBufferFloat?: boolean; colorBufferHalfFloat?: boolean}
): boolean {
  const {
    colorBufferFloat, // Whether floating point textures can be rendered and read
    colorBufferHalfFloat // Whether half float textures can be rendered and read
  } = options;
  const webglDevice = WebGLDevice.attach(device);
  let supported = true;

  if (colorBufferFloat) {
    supported = Boolean(
      // WebGL 2
      webglDevice.gl.getExtension('EXT_color_buffer_float') ||
      // WebGL 1, not exposed on all platforms
      webglDevice.gl.getExtension('WEBGL_color_buffer_float') ||
      // WebGL 1, implicitly enables float render targets https://www.khronos.org/registry/webgl/extensions/OES_texture_float/
      webglDevice.gl.getExtension('OES_texture_float')
    );
  }

  if (colorBufferHalfFloat) {
    supported =
      supported &&
      Boolean(
        // WebGL 2
        webglDevice.gl.getExtension('EXT_color_buffer_float') ||
        // WebGL 1
        webglDevice.gl.getExtension('EXT_color_buffer_half_float')
      );
  }

  return supported;
}
