import {GL} from '../webgl/webgl';
import {assertWebGLContext} from '../webgl/webgl-checks';
import Framebuffer from '../webgl/framebuffer';
import Renderbuffer from '../webgl/renderbuffer';
import Texture2D from '../webgl/texture-2d';
import assert from 'assert';

export default class FramebufferObject {

  /* eslint-disable max-statements */
  constructor(gl, {
    width = 1,
    height = 1,
    depth = true,
    minFilter = GL.NEAREST,
    magFilter = GL.NEAREST,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE
  } = {}) {
    assertWebGLContext(gl);

    this.gl = gl;
    this.depth = depth;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.format = format;
    this.type = type;

    this.resize(width, height);
  }

  delete() {
  }

  resize(width, height) {
    assert(width >= 0 && height >= 0, 'Width and height need to be integers');
    if (width === this.width && height === this.height) {
      return;
    }

    const {gl} = this;

    // TODO - do we need to reallocate the framebuffer?
    const fb = new Framebuffer(gl);

    const colorBuffer = new Texture2D(gl, {
      minFilter: this.minFilter,
      magFilter: this.magFilter
    })
    // TODO - should be handled by Texture2D constructor?
    .setImageData({
      data: null,
      width,
      height,
      type: this.type,
      format: this.format
    });

    fb.attachTexture({
      attachment: GL.COLOR_ATTACHMENT0,
      texture: colorBuffer
    });

    if (this.colorBuffer) {
      this.colorBuffer.delete();
    }
    this.colorBuffer = colorBuffer;

    // Add a depth buffer if requested
    if (this.depth) {
      const depthBuffer = new Renderbuffer(gl).storage({
        internalFormat: GL.DEPTH_COMPONENT16,
        width,
        height
      });
      fb.attachRenderbuffer({
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
    fb.checkStatus();

    this.width = width;
    this.height = height;

    // Immediately dispose of old buffer
    if (this.fb) {
      this.fb.delete();
    }
    this.fb = fb;
  }
  /* eslint-enable max-statements */

  bind() {
    this.fb.bind();
  }

  unbind() {
    this.fb.unbind();
  }
}
