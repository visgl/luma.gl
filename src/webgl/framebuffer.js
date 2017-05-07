import GL from './api';
import {assertWebGLContext, assertWebGL2Context} from './context';
import {getContextCaps} from './context-limits';
import Resource from './resource';
import Texture2D from './texture-2d';
import Renderbuffer from './renderbuffer';
import {getTypedArrayFromGLType, getGLTypeFromTypedArray} from '../utils/typed-array-utils';
import {log} from '../utils';
import assert from 'assert';

export default class Framebuffer extends Resource {

  constructor(gl, opts = {}) {
    super(gl, opts);

    // Public members
    this.width = null;
    this.height = null;
    this.attachments = {};
    this.colorBuffer = null;
    this.depthBuffer = null;
    this.stencilBuffer = null;
    this.texture = null;

    this.initialize(opts);

    Object.seal(this);
  }

  // SIMPLIFIED INTERFACE

  resize({width, height}) {
    this.initialize(Object.assign({}, this.opts, {width, height}));
  }

  /* eslint-disable max-statements */
  initialize({
    attachments = {},
    width = 1,
    height = 1,
    color = true,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE,
    parameters = {
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST
    },
    depth = true
  }) {
    const {gl} = this;

    assert(width >= 0 && height >= 0, 'Width and height need to be integers');
    if (width === this._width && height === this._height) {
      return;
    }

    log.log(2, `Resizing framebuffer ${this.id} to ${width}x${height}`);

    this.colorBuffer = null;
    this.depthBuffer = null;
    this.stencilBuffer = null;
    this.texture = null;

    attachments = Object.assign({}, attachments);

    // Add a color buffer if requested and not supplied
    if (color && !attachments[gl.COLOR_ATTACHMENT0]) {
      const colorBuffer = new Texture2D(this.gl, {
        data: null,
        format,
        type,
        width,
        height,
        parameters
      });

      attachments[gl.COLOR_ATTACHMENT0] = colorBuffer;

      if (this.texture) {
        // this.texture.delete();
      }
      this.texture = colorBuffer;
    }

    // Add a depth buffer if requested and not supplied
    if (depth && !attachments[gl.DEPTH_ATTACHMENT]) {
      const depthBuffer = new Renderbuffer(this.gl, {
        format: gl.DEPTH_COMPONENT16,
        width,
        height
      });
      attachments[gl.DEPTH_ATTACHMENT] = depthBuffer;

      if (this.depthBuffer) {
        // this.depthBuffer.delete();
      }
      this.depthBuffer = depthBuffer;
    }

    // Store actual width and height for diffing
    // Note: A framebuffer has no separate size it is defined by its attachments
    this.width = width;
    this.height = height;

    this.attach(attachments);

    // Checks that framebuffer was properly set up,
    // if not, throws an explanatory error
    this.checkStatus();
  }
  /* eslint-enable max-statements */

  // Attach from a map of attachments
  attach(attachments) {
    for (const attachmentId in attachments) {
      const attachment = attachments[attachmentId];
      if (!attachment) {
        this.unattach({attachment: attachmentId});
      } else if (attachment instanceof Renderbuffer) {
        this.attachRenderbuffer({renderbuffer: attachment, attachment: attachmentId});
      } else {
        this.attachTexture({texture: attachment, attachment: attachmentId});
      }
    }
    Object.assign(this.attachments, attachments);
  }

  unattach(attachment) {

  }

  // Used to attach a renderbuffer to a framebuffer
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

    this.gl.framebufferRenderbuffer(target, attachment, GL.RENDERBUFFER, renderbuffer.handle);

    if (renderbuffer) {
      renderbuffer.unbind();
    }
    this.unbind({target});
    return this;
  }

  // Used to attach textures to a framebuffer, the textures will store the various buffers.
  attachTexture({
    texture = null,
    target = GL.FRAMEBUFFER,
    attachment = GL.COLOR_ATTACHMENT0,
    textureTarget = GL.TEXTURE_2D
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
      0 // mipmapLevel, currently only 0 is supported by WebGL
    );

    if (texture) {
      this.gl.bindTexture(texture.target, null);
    }
    this.unbind();
    return this;
  }

  // WebGL2 only
  // Similar to attachTexture but only a given single layer of the texture
  // level is attached to the attachment point.
  attachTextureLayer({
    attachment = GL.COLOR_ATTACHMENT0,
    texture,
    level,
    layer
  } = {}) {
    const {gl} = this;
    assertWebGL2Context(gl);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.handle);
    gl.framebufferTextureLayer(gl.READ_FRAMEBUFFER, attachment, texture, level, layer);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    return this;
  }

  checkStatus() {
    const {gl} = this;
    gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);
    const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER);
    gl.bindFramebuffer(GL.FRAMEBUFFER, this.handle);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(_getFrameBufferStatus(status));
    }
    return this;
  }

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

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.handle);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFramebuffer.handle);
    gl.blitFramebuffer(
      srcX0, srcY0, srcX1, srcY1,
      dstX0, dstY0, dstX1, dstY1,
      mask,
      filter
    );
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    return this;
  }

  // signals to the GL that it need not preserve all pixels of a specified region
  // of the framebuffer
  invalidate({
    target = GL.FRAMEBUFFER,
    attachments = [],
    x = 0,
    y = 0,
    width,
    height
  }) {
    const {gl} = this;
    assertWebGL2Context(this.gl);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.handle);
    const invalidateAll = x === 0 && y === 0 && width === undefined && height === undefined;
    if (invalidateAll) {
      gl.invalidateFramebuffer(gl.READ_FRAMEBUFFER, attachments);
    } else {
      this.gl.invalidateFramebuffer(gl.READ_FRAMEBUFFER, attachments, x, y, width, height);
    }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
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
    attachment = GL.COLOR_ATTACHMENT0,
    parameters = this.constructor.ATTACHMENT_PARAMETERS || {}
  ) {
    const values = {};
    for (const pname in parameters) {
      values[pname] = this.getParameter(pname);
    }
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

function _getFrameBufferStatus(status) {
  // Use error mapping if installed
  return Framebuffer.STATUS[status] || `Framebuffer error ${status}`;
}
