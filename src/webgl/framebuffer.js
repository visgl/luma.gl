import {GL, glGet, glTypeToArray, glTypeFromArray} from './webgl';
import {assertWebGLContext, assertWebGL2Context} from './webgl-checks';
import Texture2D from './texture-2d';
import Renderbuffer from './renderbuffer';
import assert from 'assert';
import {uid, log} from '../utils';

// Returns number of components in a specific WebGL format
function glFormatToComponents(format) {
  switch (format) {
  case GL.ALPHA: return 1;
  case GL.RGB: return 3;
  case GL.RGBA: return 4;
  default: throw new Error('Unknown format');
  }
}

export default class Framebuffer {
  static makeFrom(gl, object = {}) {
    return object instanceof Framebuffer ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Framebuffer(gl, {handle: object.handle || object});
  }

  /* eslint-disable max-statements */
  constructor(gl, opts = {}) {
    assertWebGLContext(gl);

    const {id} = opts;

    const handle = gl.createFramebuffer();
    if (!handle) {
      throw new Error('Failed to create WebGL Framebuffer');
    }

    this.gl = gl;
    this.id = uid(id);
    this.handle = handle;
    this.colorBuffer = null;
    this.depthBuffer = null;
    this.stencilBuffer = null;
    this.texture = null;
    this.userData = {};
    this.width = 0;
    this.height = 0;
    Object.seal(this);

    this.resize(opts);
  }
  /* eslint-enable max-statements */

  delete() {
    const {gl} = this;
    gl.deleteFramebuffer(this.handle);
  }

  // SIMPLIFIED INTERFACE

  resize({width, height}) {
    this.update({width, height});
  }

  /* eslint-disable max-statements */
  update({
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

    const {gl} = this;

    // TODO - do we need to reallocate the framebuffer?
    const colorBuffer = new Texture2D(gl, {
      minFilter: this.minFilter,
      magFilter: this.magFilter
    })
    // TODO - should be handled by Texture2D constructor?
    .setImageData({
      data: null,
      width,
      height,
      type,
      format
    });

    this.attachTexture({
      attachment: GL.COLOR_ATTACHMENT0,
      texture: colorBuffer
    });

    if (this.colorBuffer) {
      this.colorBuffer.delete();
    }
    this.colorBuffer = colorBuffer;
    this.texture = colorBuffer;

    // Add a depth buffer if requested
    if (depth) {
      const depthBuffer = new Renderbuffer(gl).storage({
        internalFormat: GL.DEPTH_COMPONENT16,
        width,
        height
      });
      this.attachRenderbuffer({
        attachment: GL.DEPTH_ATTACHMENT,
        renderbuffer: depthBuffer
      });

      if (this.depthBuffer) {
        this.depthBuffer.delete();
      }
      this.depthBuffer = depthBuffer;
    }

    // Checks that framebuffer was properly set up,
    // if not, throws an explanatory error
    this.checkStatus();

    this.width = width;
    this.height = height;
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
      type = type || GL.UNSIGNED_BYTE;
      const ArrayType = glTypeToArray(type);
      const components = glFormatToComponents(format);
      // TODO - check for composite type (components = 1).
      pixelArray = pixelArray || new ArrayType(width * height * components);
    }

    // Pixel array available, if necessary, deduce type from it.
    type = type || glTypeFromArray(pixelArray);

    this.bind();
    gl.readPixels(x, y, width, height, format, type, pixelArray);
    this.unbind();

    return pixelArray;
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
    const {gl} = this;

    texture = texture && Texture2D.makeFrom(gl, texture);

    this.bind({target});

    gl.framebufferTexture2D(
      target,
      glGet(attachment),
      glGet(textureTarget),
      texture.handle,
      mipmapLevel
    );

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
    const {gl} = this;
    renderbuffer = renderbuffer && Renderbuffer.makeFrom(gl, renderbuffer);

    this.bind({target});

    gl.framebufferRenderbuffer(
      target,
      glGet(attachment),
      glGet(renderbufferTarget),
      renderbuffer.handle
    );

    this.unbind({target});

    return this;
  }

  checkStatus({target = GL.FRAMEBUFFER} = {}) {
    const {gl} = this;

    this.bind({target});

    const status = gl.checkFramebufferStatus(target);

    this.unbind({target});

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(this._getFrameBufferStatus(status));
    }

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
    attachment,
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

  // Selects a color buffer as the source for pixels for subsequent calls to
  // copyTexImage2D, copyTexSubImage2D, copyTexSubImage3D or readPixels.
  // src
  //  gl.BACK: Reads from the back color buffer.
  //  gl.NONE: Reads from no color buffer.
  //  gl.COLOR_ATTACHMENT{0-15}: Reads from one of 16 color attachment buffers.
  readBuffer({src}) {
    const {gl} = this;
    assertWebGL2Context(gl);
    gl.readBuffer(src);
    return this;
  }

  // @returns {GLint}
  alphaSize() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE);
  }

  // @returns {GLint}
  blueSize() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE);
  }

  // @returns {GLenum}
  colorEncoding() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING);
  }

  // @returns {GLenum}
  componentType() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE);
  }

  // @returns {GLint}
  depthSize() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE);
  }

  // @returns {GLint}
  greenSize() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE);
  }

  // @returns {WebGLRenderbuffer|WebGLTexture}
  objectName() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
  }

  // @returns {GLenum}
  objectType() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE);
  }

  // @returns {GLint}
  redSize() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE);
  }

  // @returns {GLint}
  stencilSize() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE);
  }

  // @returns {GLint}
  cubeMapFace() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE);
  }

  // @returns {GLint}
  layer() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER);
  }

  // @returns {GLint}
  level() {
    return this.getAttachmentParameter(
      GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL);
  }

  getParameters() {
    return {
      redSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE),
      greenSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE),
      blueSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE),
      alphaSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE),

      depthSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE),
      stencilSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE),

      colorEncoding: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING),
      componentType: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE),
      objectName: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME),
      objectType: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE),
      cubeMapFace: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE),
      layer: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER),
      level: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL)
    };
  }

  // (OpenGL ES 3.0.4 §6.1.13, similar to glGetFramebufferAttachmentParameteriv)
  // Return the value for the passed pname given the target and attachment.
  // The type returned is the natural type for the requested pname:
  // pname returned type
  // FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE GLint
  // FRAMEBUFFER_ATTACHMENT_BLUE_SIZE  GLint
  // FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING GLenum
  // FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE GLenum
  // FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE GLint
  // FRAMEBUFFER_ATTACHMENT_GREEN_SIZE GLint
  // FRAMEBUFFER_ATTACHMENT_OBJECT_NAME  WebGLRenderbuffer or WebGLTexture
  // FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE  GLenum
  // FRAMEBUFFER_ATTACHMENT_RED_SIZE GLint
  // FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE GLint
  // FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE  GLint
  // FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER  GLint
  // FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL  GLint
  // If pname is not in the table above, generates an INVALID_ENUM error.
  // If an OpenGL error is generated, returns null.
  getAttachmentParameter({
    pname,
    target,
    attachment
  } = {}) {
    const {gl} = this;
    assertWebGL2Context(gl);
    const value = gl.getFramebufferAttachmentParameter(
      target, attachment, pname
    );
    return value;
  }

  /* eslint-disable max-len */
  _getFrameBufferStatus(status) {
    let error;
    switch (status) {
    case GL.FRAMEBUFFER_COMPLETE:
      error = 'Success. Framebuffer is correctly set up';
      break;
    case GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      error = 'The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete.';
      break;
    case GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      error = 'There is no attachment.';
      break;
    case GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      error = 'Height and width of the attachment are not the same.';
      break;
    case GL.FRAMEBUFFER_UNSUPPORTED:
      error = 'The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer.';
      break;
    // When using a WebGL 2 context, the following values can be returned
    case GL.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      error = 'The values of GL.RENDERBUFFER_SAMPLES are different among attached renderbuffers, or are non-zero if the attached images are a mix of renderbuffers and textures.';
      break;
    default:
      error = `Framebuffer error ${status}`;
      break;
    }
    return error;
  }
  /* eslint-enable max-len */
}
