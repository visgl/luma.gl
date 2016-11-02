/* eslint-disable */
import {GL, glGet, glArrayFromType, glTypeFromArray} from './webgl-types';
import {assertWebGLContext, assertWebGL2Context} from './webgl-checks';
import {Texture2D} from './texture';
import Renderbuffer from './renderbuffer';

/* eslint-disable max-len, no-multi-str */
const ERR_FRAMEBUFFER = {
  [GL.FRAMEBUFFER_COMPLETE]:
      'Success. Framebuffer is correctly set up',
  [GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]:
      'The attachment types are mismatched or not all framebuffer attachment \
points are framebuffer attachment complete.',
  [GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]:
      'There is no attachment.',
  [GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]:
      'Height and width of the attachment are not the same.',
  [GL.FRAMEBUFFER_UNSUPPORTED]:
      'The format of the attachment is not supported or if depth and stencil \
attachments are not the same renderbuffer.',
  // When using a WebGL 2 context, the following values can be returned
  [GL.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE]:
      'The values of GL.RENDERBUFFER_SAMPLES are different among attached \
renderbuffers, or are non-zero if the attached images are a mix of \
renderbuffers and textures.'
};
/* eslint-enable max-len */

function getFrameBufferStatus(status) {
  return ERR_FRAMEBUFFER[status] || `Framebuffer error ${status}`;
}

function glFormatComponents(format) {
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

  constructor(gl) {
    assertWebGLContext(gl);

    this.gl = gl;
    this.handle = gl.createFramebuffer();
    if (!this.handle) {
      throw new Error('Failed to create WebGL Framebuffer');
    }
  }

  delete() {
    const {gl} = this;
    gl.deleteFramebuffer(this.handle);
  }

  // SIMPLIFIED INTERFACE

  // WEBGL INTERFACE

  bind({target = GL.FRAMEBUFFER} = {}) {
    const {gl} = this;
    gl.bindFramebuffer(glGet(target), this.handle);
    return this;
  }

  unbind({target = GL.FRAMEBUFFER} = {}) {
    const {gl} = this;
    gl.bindFramebuffer(glGet(target), null);
    return this;
  }

  // TODO - move out of renderbuffer since it should also work on draw buffer?
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
      const ArrayType = glArrayFromType(type);
      const components = glFormatComponents(format);
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
      glGet(target),
      glGet(attachment),
      glGet(textureTarget),
      texture.handle,
      mipmapLevel
    );

    this.unbind();
    return this;
  }

  /**
   * Used to attach a renderbuffer to a framebuffer, the renderbuffer will
   * store the various buffers.
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
      glGet(target),
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

    const status = gl.checkFramebufferStatus(glGet(target));

    this.unbind({target});

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(getFrameBufferStatus(status));
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
      alphaSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE),
      blueSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE),
      colorEncoding: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING),
      componentType: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE),
      depthSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE),
      greenSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE),
      objectName: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME),
      objectType: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE),
      redSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_RED_SIZE),
      stencilSize: this.getAttachmentParameter(
        GL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE),
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
}
