import GL from './api';
import {assertWebGLContext, assertWebGL2Context} from './context';
import Resource from './resource';
import Texture2D from './texture-2d';
import Renderbuffer from './renderbuffer';
import {getTypedArrayFromGLType, getGLTypeFromTypedArray} from '../utils/typed-array-utils';
import {log} from '../utils';
import assert from 'assert';

const ATTACHMENT_PARAMETERS = [
  GL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, // WebGLRenderbuffer or WebGLTexture
  GL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, // GL.RENDERBUFFER, GL.TEXTURE, GL.NONE
  GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE, // GL.TEXTURE_CUBE_MAP_POSITIVE_X, etc.
  GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL, // GLint
  // EXT_sRGB or WebGL2
  GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING, // GL.LINEAR, GL.SRBG
  // WebGL2
  GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE, // GLint
  GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE
  // GL.FLOAT, GL.INT, GL.UNSIGNED_INT, GL.SIGNED_NORMALIZED, OR GL.UNSIGNED_NORMALIZED.
];

export default class Framebuffer extends Resource {

  constructor(gl, opts = {}) {
    super(gl, opts);
    this.initialize(opts);
    Object.seal(this);
    this.resize(opts);
  }

  // SIMPLIFIED INTERFACE

  resize({width, height}) {
    this.initialize(Object.assign({}, this.opts, {width, height}));
  }

  /* eslint-disable max-statements */
  initialize({
    width = 1,
    height = 1,
    depth = true,
    minFilter = GL.NEAREST,
    magFilter = GL.NEAREST,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE
  }) {
    assert(width >= 0 && height >= 0, 'Width and height need to be integers');
    if (width === this.width && height === this.height) {
      return;
    }

    log.log(2, `Resizing framebuffer ${this.id} to ${width}x${height}`);

    this.opts.colorBuffer = null;
    this.opts.depthBuffer = null;
    this.opts.stencilBuffer = null;
    this.opts.texture = null;

    // TODO - do we need to reallocate the framebuffer?
    const colorBuffer = new Texture2D(this.gl, {
      data: null,
      format,
      type,
      width,
      height,
      [GL.TEXTURE_MIN_FILTER]: this.minFilter,
      [GL.TEXTURE_MAG_FILTER]: this.magFilter
    });

    this.attachTexture({
      attachment: GL.COLOR_ATTACHMENT0,
      texture: colorBuffer
    });

    if (this.opts.colorBuffer) {
      this.opts.colorBuffer.delete();
    }
    this.opts.colorBuffer = colorBuffer;
    this.opts.texture = colorBuffer;

    // Add a depth buffer if requested
    if (depth) {
      const depthBuffer = new Renderbuffer(this.gl, {
        format: GL.DEPTH_COMPONENT16,
        width,
        height
      });
      this.attachRenderbuffer({
        attachment: GL.DEPTH_ATTACHMENT,
        renderbuffer: depthBuffer
      });

      if (this.opts.depthBuffer) {
        this.opts.depthBuffer.delete();
      }
      this.opts.depthBuffer = depthBuffer;
    }

    this.opts.width = width;
    this.opts.height = height;

    // Checks that framebuffer was properly set up,
    // if not, throws an explanatory error
    this.checkStatus();
  }
  /* eslint-enable max-statements */

  // ACCESSORS

  /* eslint-disable brace-style */
  get width() { return this.opts.width; }
  get height() { return this.opts.height; }
  get colorBuffer() { return this.opts.colorBuffer; }
  get depthBuffer() { return this.opts.depthBuffer; }
  get stencilBuffer() { return this.opts.stencilBuffer; }
  get texture() { return this.opts.texture; }

  //
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
    // Deduce type and allocated pixelArray if needed
    if (!pixelArray) {
      // Allocate pixel array if not already available, using supplied type
      type = type || GL.UNSIGNED_BYTE;
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

  checkStatus({target = GL.FRAMEBUFFER} = {}) {
    this.bind({target});
    const status = this.gl.checkFramebufferStatus(target);
    this.unbind({target});
    if (status !== GL.FRAMEBUFFER_COMPLETE) {
      throw new Error(_getFrameBufferStatus(status));
    }
    return this;
  }

  /**
   * Used to attach textures to a framebuffer, the textures will store
   * the various buffers.
   *
   *  The set of available attachments is larger in WebGL2, and also the
   *  extensions WEBGL_draw_buffers and WEBGL_depth_texture provide additional
   *  attachments that match or exceed the WebGL2 set.
   *
   * @param {Texture2D|TextureCube|WebGLTexture|null} opt.texture=null -
   *    default is null which unbinds the texture for the attachment
   * @param {String|Number} opt.attachment= - which attachment to bind
   *    defaults to gl.COLOR_ATTACHMENT0.
   * @param {String|Number} opt.target= - bind point, normally gl.FRAMEBUFFER
   *    (WebGL2 support separating bet)
   * @param {String|Number} opt.textureTarget= - can be used to specify
   *    faces of a cube map.
   * @returns {FrameBuffer} returns itself to enable chaining
   */
  attachTexture({
    texture = null,
    target = GL.FRAMEBUFFER,
    attachment = GL.COLOR_ATTACHMENT0,
    textureTarget = GL.TEXTURE_2D,
    // mipmapLevel, currently only 0 is supported by WebGL
    mipmapLevel = 0
  } = {}) {
    this.bind({target});
    if (texture) {
      this.gl.bindTexture(texture.target, texture.handle);
    }

    this.gl.framebufferTexture2D(
      target,
      attachment,
      texture && texture.target,
      texture && texture.handle,
      mipmapLevel
    );

    if (texture) {
      this.gl.bindTexture(texture.target, null);
    }
    this.unbind();
    return this;
  }

  /**
   * Used to attach a framebuffer to a framebuffer, the textures will store
   * the various buffers.
   * @param {Object} opts= - named parameters
   * @param {RenderBuffer|WebGLRenderBuffer|null} opts.renderbuffer=null -
   *    renderbuffer to bind
   *    default is null which unbinds the renderbuffer for the attachment
   * @param {String|Number} opts.attachment= - which buffer to bind
   * @returns {FrameBuffer} returns itself to enable chaining
   */
  attachRenderbuffer({
    renderbuffer = null,
    attachment = GL.COLOR_ATTACHMENT0,
    target = GL.FRAMEBUFFER,
    renderbufferTarget = GL.RENDERBUFFER
  } = {}) {
    this.bind({target});
    if (renderbuffer) {
      renderbuffer.bind();
    }

    this.gl.framebufferRenderbuffer(
      target,
      attachment,
      GL.RENDERBUFFER,
      renderbuffer.handle
    );

    if (renderbuffer) {
      renderbuffer.unbind();
    }
    this.unbind({target});
    return this;
  }

  // WEBGL2 INTERFACE

  blit({
    srcX0, srcY0, srcX1, srcY1,
    dstX0, dstY0, dstX1, dstY1,
    mask,
    filter = GL.NEAREST
  }) {
    const {gl} = this;
    assertWebGL2Context(gl);
    gl.blitFramebuffer(
      srcX0, srcY0, srcX1, srcY1,
      dstX0, dstY0, dstX1, dstY1,
      mask,
      filter
    );
    return this;
  }

  textureLayer({
    target = GL.FRAMEBUFFER,
    attachment = GL.COLOR_ATTACHMENT0,
    texture,
    level,
    layer
  } = {}) {
    const {gl} = this;
    assertWebGL2Context(gl);
    gl.framebufferTextureLayer(target, attachment, texture, level, layer);
    return this;
  }

  invalidate({
    target = GL.FRAMEBUFFER,
    attachments = []
  }) {
    const {gl} = this;
    assertWebGL2Context(gl);
    gl.invalidateFramebuffer(target, attachments);
    return this;
  }

  invalidateSub({
    target = GL.FRAMEBUFFER,
    attachments = [],
    x = 0,
    y = 0,
    width,
    height
  }) {
    const {gl} = this;
    assertWebGL2Context(gl);
    gl.invalidateFramebuffer(target, attachments, x, y, width, height);
    return this;
  }

  // Return the value for the passed pname given the target and attachment.
  // The type returned is the natural type for the requested pname:
  // pname returned type
  // If an OpenGL error is generated, returns null.
  /* eslint-disable complexity */
  getAttachmentParameter({
    target = this.target,
    attachment = GL.COLOR_ATTACHMENT0,
    pname
  } = {}) {
    // const caps = getContextCaps(this.gl);

    switch (pname) {
    // EXT_sRGB or WebGL2
    case GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING:
      // if (!caps.EXT_sRGB) {
      return GL.LINEAR;
      // }
      // break;
    // WebGL2
    case GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: // GLint
    case GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: // GLint
      // if (!caps.webgl2) {
      return 8;
      // }
      // break;
    case GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE:
      // GL.FLOAT, GL.INT, GL.UNSIGNED_INT, GL.SIGNED_NORMALIZED, OR GL.UNSIGNED_NORMALIZED.
      // if (!caps.webgl2) {
      return GL.UNSIGNED_INT;
      // }
      // break;
    default:
    }

    return this.gl.getFramebufferAttachmentParameter(target, attachment, pname);
  }
  /* eslint-enable complexity */

  getAttachmentParameters(
    attachment = GL.COLOR_ATTACHMENT0,
    parameters = this.constructor.ATTACHMENT_PARAMETERS
  ) {
    const values = {};
    for (const pname in parameters) {
      values[pname] = this.getParameter(pname);
    }
    return this;
  }

  // WEBGL INTERFACE

  bind({target = GL.FRAMEBUFFER} = {}) {
    const {gl} = this;
    gl.bindFramebuffer(target, this.handle);
    return this;
  }

  unbind({target = GL.FRAMEBUFFER} = {}) {
    const {gl} = this;
    gl.bindFramebuffer(target, null);
    return this;
  }

  // PRIVATE METHODS

  _createHandle() {
    return this.gl.createFramebuffer();
  }

  _deleteHandle() {
    this.gl.deleteFramebuffer(this.handle);
  }
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

const FRAMEBUFFER_STATUS = {
  [GL.FRAMEBUFFER_COMPLETE]:
    'Success. Framebuffer is correctly set up',
  [GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]:
    'Attachment types are mismatched or \
not all framebuffer attachment points are framebuffer attachment complete.',
  [GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]:
    'There is no attachment.',
  [GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]:
    'Height and width of the attachment are not the same.',
  [GL.FRAMEBUFFER_UNSUPPORTED]:
    'Format of attachment is not supported or \
depth and stencil attachments are not the same renderbuffer.',
    // When using a WebGL 2 context, the following values can be returned
  [GL.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE]:
    'Values of GL.RENDERBUFFER_SAMPLES are different among attached \
renderbuffers, or are non-zero if the attached images are a mix of \
renderbuffers and textures.'
};

function _getFrameBufferStatus(status) {
  return FRAMEBUFFER_STATUS[status] || `Framebuffer error ${status}`;
}

Framebuffer.ATTACHMENT_PARAMETERS = ATTACHMENT_PARAMETERS;
