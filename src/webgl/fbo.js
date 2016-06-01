import {Framebuffer} from './framebuffer';
import {Texture2D} from './texture';
import {Renderbuffer} from './framebuffer';
import assert from 'assert';

export default class FramebufferObject {

  /* eslint-disable max-statements */
  constructor(gl, {
    width = 1,
    height = 1,
    depth = true,
    minFilter = gl.NEAREST,
    magFilter = gl.NEAREST,
    format = gl.RGBA,
    type = gl.UNSIGNED_BYTE
  } = {}) {
    this.depth = depth;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.format = format;
    this.type = type;

    this.resize(width, height);
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
      width,
      height,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      type: this.type,
      format: this.format
    });

    fb.texture2D({
      attachment: gl.COLOR_ATTACHMENT0,
      texture: colorBuffer
    });

    if (this.colorBuffer) {
      this.colorBuffer.delete();
    }
    this.colorBuffer = colorBuffer;

    // Add a depth buffer if requested
    if (this.depth) {
      const depthBuffer = new Renderbuffer().storage({
        format: gl.DEPTH_COMPONENT16,
        width,
        height
      });
      fb.attachRenderbuffer({renderbuffer: depthBuffer});

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
