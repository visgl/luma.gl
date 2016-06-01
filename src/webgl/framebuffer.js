import {glGet, glConstant, assertWebGL2} from './context';
import {Renderbuffer} from './framebuffer';
import {WebGLFramebuffer} from './webgl-types';

export class Framebuffer {

  // @returns {WebGLFramebuffer}
  static getHandle(object) {
    if (object instanceof Framebuffer) {
      object = object.handle;
    }
    if (!(object instanceof WebGLFramebuffer)) {
      throw new Error(`Expected Luma Framebuffer or WebGLFramebuffer`);
    }
    return object;
  }

  constructor(gl) {
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

  /**
   * Used to attach textures to a framebuffer, the textures will store
   * the various buffers.
   * @param {Object} opts= - named parameters
   * @param {Texture2D|TextureCube} opts.texture= - texture to bind
   *    default is null which unbinds the texture for the attachment
   * @param {String|Number} opts.attachment= - which buffer to bind
   * @returns {FrameBuffer} returns itself to enable chaining
   */
  attachTexture(opts) {
    return this.texture2D(opts);
  }

  attachRenderbuffer(opts) {
    return this.texture2D(opts);
  }

  // WEBGL INTERFACE

  bind({target = 'FRAMEBUFFER'} = {}) {
    const {gl} = this;
    gl.bindFramebuffer(glGet(target), this.handle);
    return this;
  }

  unbind({target = 'FRAMEBUFFER'} = {}) {
    const {gl} = this;
    gl.bindFramebuffer(glGet(target), null);
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
   * @param {String|Number} opt.attachment= - which attachment to bind
   *    defaults to gl.COLOR_ATTACHMENT0.
   * @param {Texture2D|TextureCube} opt.texture= - texture to bind
   *    default is null which unbinds the texture for the attachment
   * @param {String|Number} opt.target= - bind point, normally gl.FRAMEBUFFER
   *    (WebGL2 support separating bet)
   * @param {String|Number} opt.textureTarget= - can be used to specify
   *    faces of a cube map.
   * @returns {FrameBuffer} returns itself to enable chaining
   */
  texture2D({
    attachment = 'COLOR_ATTACHMENT0',
    texture = null,
    target = 'FRAMEBUFFER',
    textureTarget = 'TEXTURE_2D',
    autobind = true
  } = {}) {
    const {gl} = this;
    const glTexture = Texture.getHandle(texture);

    if (autobind) {
      this.bind({target});
    }

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      glGet(attachment),
      glGet(textureTarget),
      glTexture,
      // mipmapLevel, currently only 0 is supported by WebGL
      0
    );

    if (autobind) {
      this.unbind({target});
    }

    return this;
  }

  renderbuffer({
    attachment = 'COLOR_ATTACHMENT0',
    renderbuffer = null,
    target = 'FRAMEBUFFER',
    renderbufferTarget = 'RENDERBUFFER',
    autobind = true
  } = {}) {
    const {gl} = this;
    const glRenderbuffer = Renderbuffer.getHandle(renderbuffer);

    if (autobind) {
      this.bind({target});
    }

    gl.framebufferRenderbuffer(
      glGet(target),
      glGet(attachment),
      glGet(renderbufferTarget),
      glRenderbuffer
    );

    if (autobind) {
      this.unbind({target});
    }

    return this;
  }

  checkStatus({target = 'FRAMEBUFFER', autobind = true}) {
    const {gl} = this;

    if (autobind) {
      this.bind({target});
    }

    const status = gl.checkFramebufferStatus(glGet(target));

    if (autobind) {
      this.unbind({target});
    }

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(_getFrameBufferStatus(status));
    }

    return this;
  }

  // WEBGL2 INTERFACE

  blit({
    srcX0, srcY0, srcX1, srcY1,
    dstX0, dstY0, dstX1, dstY1,
    mask,
    filter = 'NEAREST'
  }) {
    const {gl} = this;
    assertWebGL2(gl);
    gl.blitFramebuffer(
      srcX0, srcY0, srcX1, srcY1,
      dstX0, dstY0, dstX1, dstY1,
      mask,
      filter
    );
    return this;
  }

  textureLayer({
    target = 'FRAMEBUFFER',
    attachment,
    texture,
    level,
    layer
  } = {}) {
    const {gl} = this;
    assertWebGL2(gl);
    gl.framebufferTextureLayer(target, attachment, texture, level, layer);
    return this;
  }

  invalidate({
    target = 'FRAMEBUFFER',
    attachments = []
  }) {
    const {gl} = this;
    assertWebGL2(gl);
    gl.invalidateFramebuffer(glConstant(target), attachments);
    return this;
  }

  invalidateSub({
    target = 'FRAMEBUFFER',
    attachments = [],
    x = 0,
    y = 0,
    width,
    height
  }) {
    const {gl} = this;
    assertWebGL2(gl);
    gl.invalidateFramebuffer(
      glConstant(target), attachments, x, y, width, height
    );
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
    assertWebGL2(gl);
    gl.readBuffer(src);
    return this;
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
    assertWebGL2(gl);
    const value = gl.getFramebufferAttachmentParameter(
      target, attachment, pname
    );
    return value;
  }

  // @returns {GLint}
  get alphaSize() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE);
  }

  // @returns {GLint}
  get blueSize() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE);
  }

  // @returns {GLenum}
  get colorEncoding() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING);
  }

  // @returns {GLenum}
  get componentType() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE);
  }

  // @returns {GLint}
  get depthSize() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE);
  }

  // @returns {GLint}
  get greenSize() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE);
  }

  // @returns {WebGLRenderbuffer|WebGLTexture}
  get objectName() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
  }

  // @returns {GLenum}
  get objectType() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE);
  }

  // @returns {GLint}
  get redSize() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_RED_SIZE);
  }

  // @returns {GLint}
  get stencilSize() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE);
  }

  // @returns {GLint}
  get cubeMapFace() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE);
  }

  // @returns {GLint}
  get layer() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER);
  }

  // @returns {GLint}
  get level() {
    return this.getAttachmentParameter(
      this.gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL);
  }
}

/* eslint-disable max-len */
function _getFrameBufferStatus(status) {
  const {gl} = this;
  let error;
  switch (status) {
  case gl.FRAMEBUFFER_COMPLETE:
    error = 'Success. Framebuffer is correctly set up';
    break;
  case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
    error = `The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete.`;
    break;
  case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
    error = `There is no attachment.`;
    break;
  case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
    error = `Height and width of the attachment are not the same.`;
    break;
  case gl.FRAMEBUFFER_UNSUPPORTED:
    error = `The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer.`;
    break;
  // When using a WebGL 2 context, the following values can be returned
  case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
    error = `The values of gl.RENDERBUFFER_SAMPLES are different among attached renderbuffers, or are non-zero if the attached images are a mix of renderbuffers and textures.`;
    break;
  default:
    error = `Framebuffer error ${status}`;
    break;
  }
  return error;
}
/* eslint-enable max-len */

