import GL from './api';
import {assertWebGLContext, assertWebGL2Context} from './context';
import {getContextCaps} from './context-limits';
import Resource from './resource';
import Texture2D from './texture-2d';
import Renderbuffer from './renderbuffer';
import {getTypedArrayFromGLType, getGLTypeFromTypedArray} from '../utils/typed-array-utils';
import {log} from '../utils';
import assert from 'assert';

// Local constants - will collapse during minification
const GL_FRAMEBUFFER = 0x8D40;
const GL_RENDERBUFFER = 0x8D41;
const GL_DRAW_FRAMEBUFFER = 0;
const GL_READ_FRAMEBUFFER = 0;

const GL_COLOR_ATTACHMENT0 = 0x8CE0;
const GL_DEPTH_ATTACHMENT = 0x8D00;
const GL_STENCIL_ATTACHMENT = 0x8D20;
// const GL_DEPTH_STENCIL_ATTACHMENT = 0x821A;

const GL_TEXTURE_3D = 0x806F;
const GL_TEXTURE_2D_ARRAY = 0x8C1A;
const GL_TEXTURE_2D = 0x0DE1;
const GL_TEXTURE_CUBE_MAP = 0x8513;

const GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;

export default class Framebuffer extends Resource {

  constructor(gl, opts = {}) {
    super(gl, opts);

    // Public members
    this.width = null;
    this.height = null;
    this.attachments = {};
    this.initialize(opts);

    Object.seal(this);
  }

  initialize({
    width = 1,
    height = 1,
    attachments = null,
    color = true,
    depth = true,
    stencil = false,
    check = true
  }) {
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
      attachments = this._createDefaultAttachments({color, depth, stencil, width, height});
    }

    // Any current attachments need to be removed, create a map with null values
    const attachmentsToRemove = Object.keys(this.attachments).reduce((map, key) => {
      map[key] = null;
      return map;
    }, {});

    // Unattach/attach the attachments
    this.attach(Object.assign(attachmentsToRemove, attachments));

    // Checks that framebuffer was properly set up, if not, throws an explanatory error
    if (check) {
      this.checkStatus();
    }
  }

  resize({width, height}) {
    if (width === this.width && height === this.height) {
      return this;
    }
    log.log(2, `Resizing framebuffer ${this.id} to ${width}x${height}`);
    return this.initialize(Object.assign({}, this.opts, {width, height}));
  }

  // Attach from a map of attachments
  attach(attachments) {
    this.gl.bindFramebuffer(GL_FRAMEBUFFER, this.handle);

    for (const attachment in attachments) {
      const object = attachments[attachment];
      if (!object) {
        this._unattach({attachment});
      } else if (object instanceof Renderbuffer) {
        this._attachRenderbuffer({attachment, renderbuffer: object});
      } else if (Array.isArray(object)) {
        const [texture, layer = 0, level = 0] = object;
        this._attachTexture({attachment, texture, layer, level});
      } else {
        this._attachTexture({attachment, texture: object, layer: 0, level: 0});
      }
    }
    Object.assign(this.attachments, attachments);

    this.gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  }

  checkStatus() {
    const {gl} = this;
    gl.bindFramebuffer(GL_FRAMEBUFFER, this.handle);
    const status = gl.checkFramebufferStatus(GL_FRAMEBUFFER);
    gl.bindFramebuffer(GL_FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(_getFrameBufferStatus(status));
    }
    return this;
  }

  get color() {
    return this.attachments[GL_COLOR_ATTACHMENT0] || null;
  }

  get texture() {
    return this.attachments[GL_COLOR_ATTACHMENT0] || null;
  }

  get depth() {
    return this.attachments[GL_DEPTH_ATTACHMENT] || null;
  }

  get stencil() {
    return this.attachments[GL_STENCIL_ATTACHMENT] || null;
  }

  // NOTE: Slow requires roundtrip to GPU
  // App can provide pixelArray or have it auto allocated by this method
  // @returns {Uint8Array|Uint16Array|FloatArray} - pixel array,
  //  newly allocated by this method unless provided by app.
  readPixels({
    x = 0,
    y = 0,
    width,
    height,
    format = GL.RGBA,
    type,
    pixelArray = null
  }) {
    const {gl} = this;

    // Deduce type and allocated pixelArray if needed
    if (!pixelArray) {
      // Allocate pixel array if not already available, using supplied type
      type = type || gl.UNSIGNED_BYTE;
      const ArrayType = getTypedArrayFromGLType(type);
      const components = glFormatToComponents(format);
      // TODO - check for composite type (components = 1).
      pixelArray = pixelArray || new ArrayType(width * height * components);
    }

    // Pixel array available, if necessary, deduce type from it.
    type = type || getGLTypeFromTypedArray(pixelArray);

    this.bind();
    this.gl.readPixels(x, y, width, height, format, type, pixelArray);
    this.unbind();

    return pixelArray;
  }

  // Selects a color buffer as the source for pixels for subsequent calls to
  // copyTexImage2D, copyTexSubImage2D, copyTexSubImage3D or readPixels.
  // src
  //  gl.BACK: Reads from the back color buffer.
  //  gl.NONE: Reads from no color buffer.
  //  gl.COLOR_ATTACHMENT{0-15}: Reads from one of 16 color attachment buffers.
  readBuffer({src}) {
    assertWebGLContext(this.gl);
    this.gl.readBuffer(src);
    return this;
  }

  // WEBGL2 INTERFACE

  // Copies a rectangle of pixels between framebuffers
  blit({
    srcFramebuffer,
    srcX0, srcY0, srcX1, srcY1,
    dstX0, dstY0, dstX1, dstY1,
    mask,
    filter = GL.NEAREST
  }) {
    const {gl} = this;
    assertWebGL2Context(gl);

    gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, this.handle);
    gl.bindFramebuffer(GL_READ_FRAMEBUFFER, srcFramebuffer.handle);
    gl.blitFramebuffer(
      srcX0, srcY0, srcX1, srcY1,
      dstX0, dstY0, dstX1, dstY1,
      mask,
      filter
    );
    gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, null);
    gl.bindFramebuffer(GL_READ_FRAMEBUFFER, null);
    return this;
  }

  // signals to the GL that it need not preserve all pixels of a specified region
  // of the framebuffer
  invalidate({
    attachments = [],
    x = 0,
    y = 0,
    width,
    height
  }) {
    const {gl} = this;
    assertWebGL2Context(this.gl);
    gl.bindFramebuffer(GL_READ_FRAMEBUFFER, this.handle);
    const invalidateAll = x === 0 && y === 0 && width === undefined && height === undefined;
    if (invalidateAll) {
      gl.invalidateFramebuffer(GL_READ_FRAMEBUFFER, attachments);
    } else {
      this.gl.invalidateFramebuffer(GL_READ_FRAMEBUFFER, attachments, x, y, width, height);
    }
    gl.bindFramebuffer(GL_READ_FRAMEBUFFER, null);
    return this;
  }

  // Return the value for the passed pname given the target and attachment.
  // The type returned is the natural type for the requested pname:
  // pname returned type
  // If an OpenGL error is generated, returns null.
  /* eslint-disable complexity */
  getAttachmentParameter({
    target = this.target,
    attachment = GL_COLOR_ATTACHMENT0,
    pname
  } = {}) {
    const caps = getContextCaps(this.gl);

    switch (pname) {
    // EXT_sRGB or WebGL2
    case GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING:
      if (!caps.EXT_sRGB) {
        return GL.LINEAR;
      }
      break;
    // WebGL2
    case GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: // GLint
      if (!caps.webgl2) {
        return 8;
      }
      break;
    case GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE:
      // GL.FLOAT, GL.INT, GL.UNSIGNED_INT, GL.SIGNED_NORMALIZED, OR GL.UNSIGNED_NORMALIZED.
      if (!caps.webgl2) {
        return GL.UNSIGNED_INT;
      }
      break;

    default:
    }

    return this.gl.getFramebufferAttachmentParameter(target, attachment, pname);
  }
  /* eslint-enable complexity */

  getAttachmentParameters(
    attachment = GL_COLOR_ATTACHMENT0,
    parameters = this.constructor.ATTACHMENT_PARAMETERS || {}
  ) {
    const values = {};
    for (const pname in parameters) {
      values[pname] = this.getParameter(pname);
    }
    return this;
  }

  // WEBGL INTERFACE

  bind({target = GL_FRAMEBUFFER} = {}) {
    this.gl.bindFramebuffer(target, this.handle);
    return this;
  }

  unbind({target = GL_FRAMEBUFFER} = {}) {
    this.gl.bindFramebuffer(target, null);
    return this;
  }

  // PRIVATE METHODS

  _createDefaultAttachments({color, depth, stencil, width, height}) {
    const defaultAttachments = {};

    // Add a color buffer if requested and not supplied
    if (color) {
      defaultAttachments[GL_COLOR_ATTACHMENT0] = new Texture2D(this.gl, {
        data: null,
        format: GL.RGBA,
        type: GL.UNSIGNED_BYTE,
        width,
        height,
        parameters: {
          [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
          [GL.TEXTURE_MAG_FILTER]: GL.NEAREST
        },
        mipmaps: false
      });
    }

    // Add a depth buffer if requested and not supplied
    if (depth) {
      defaultAttachments[GL_DEPTH_ATTACHMENT] = new Renderbuffer(this.gl, {
        format: GL.DEPTH_COMPONENT16,
        width,
        height
      });
    }

    // TODO - handle stencil and combined depth and stencil

    return defaultAttachments;
  }

  _unattach({attachment}) {
    this.gl.bindRenderbuffer(GL_RENDERBUFFER, this.handle);
    this.gl.framebufferRenderbuffer(GL_FRAMEBUFFER, attachment, GL_RENDERBUFFER, null);
    delete this.attachments[attachment];
  }

  _attachRenderbuffer({attachment = GL_COLOR_ATTACHMENT0, renderbuffer}) {
    const {gl} = this;
    // TODO - is the bind needed?
    // gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.handle);
    gl.framebufferRenderbuffer(GL_FRAMEBUFFER, attachment, GL_RENDERBUFFER, renderbuffer.handle);
    // TODO - is the unbind needed?
    // gl.bindRenderbuffer(GL_RENDERBUFFER, null);

    this.attachments[attachment] = renderbuffer;
  }

  // layer = 0 - index into Texture2DArray and Texture3D or face for `TextureCubeMap`
  // level = 0 - mipmapLevel (must be 0 in WebGL1)
  _attachTexture({attachment = GL_COLOR_ATTACHMENT0, texture, layer, level}) {
    const {gl} = this;
    gl.bindTexture(texture.target, texture.handle);

    switch (texture.target) {
    case GL_TEXTURE_2D_ARRAY:
    case GL_TEXTURE_3D:
      gl.framebufferTextureLayer(GL_FRAMEBUFFER, attachment, texture.target, level, layer);
      break;

    case GL_TEXTURE_CUBE_MAP:
      // layer must be a cubemap face (or if index, converted to cube map face)
      const face = mapIndexToCubeMapFace(layer);
      gl.framebufferTexture2D(GL_FRAMEBUFFER, attachment, face, texture.handle, level);
      break;

    case GL_TEXTURE_2D:
      gl.framebufferTexture2D(GL_FRAMEBUFFER, attachment, GL_TEXTURE_2D, texture.handle, level);
      break;

    default:
      assert(false, 'Illegal texture type');
    }

    gl.bindTexture(texture.target, null);
    this.attachments[attachment] = texture;
  }

  // RESOURCE METHODS

  _createHandle() {
    return this.gl.createFramebuffer();
  }

  _deleteHandle() {
    this.gl.deleteFramebuffer(this.handle);
  }
}

// Map an index to a cube map face constant
function mapIndexToCubeMapFace(layer) {
  // TEXTURE_CUBE_MAP_POSITIVE_X is a big value (0x8515)
  // if smaller assume layer is index, otherwise assume it is already a cube map face constant
  return layer < GL_TEXTURE_CUBE_MAP_POSITIVE_X ?
    layer + GL_TEXTURE_CUBE_MAP_POSITIVE_X :
    layer;
}

// Returns number of components in a specific WebGL format
function glFormatToComponents(format) {
  switch (format) {
  case GL.ALPHA: return 1;
  case GL.RGB: return 3;
  case GL.RGBA: return 4;
  default: throw new Error('Unknown format');
  }
}

// Get a string describing the framebuffer error if installed
function _getFrameBufferStatus(status) {
  // Use error mapping if installed
  const STATUS = Framebuffer.STATUS || {};
  return STATUS[status] || `Framebuffer error ${status}`;
}
