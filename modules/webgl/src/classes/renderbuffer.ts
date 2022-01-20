/* eslint-disable no-inline-comments */
import GL from '@luma.gl/constants';
import WebGLDevice from '../adapter/webgl-device';
import type {RenderbufferProps} from '../adapter/objects/webgl-renderbuffer';
import WEBGLRenderbuffer from '../adapter/objects/webgl-renderbuffer';

export type {RenderbufferProps}

/**
 * Renderbuffers are GPU objects that contain images.
 * In contrast to Textures they are optimized for use as render targets, with Framebuffers.
 * while Textures may not be, and are the logical choice when
 * you do not need to sample (i.e. in a post-pass shader)
 * from the produced image. If you need to resample
 * (such as when reading depth back in a second shader pass),
 * use Textures instead.
 * Renderbuffer objects also natively accommodate Multisampling (MSAA).
 */
export default class Renderbuffer extends WEBGLRenderbuffer {
  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean {
    return WEBGLRenderbuffer.isSupported(gl, options);
  }

  static getSamplesForFormat(gl: WebGL2RenderingContext, options: {format: number}): number{
    // Polyfilled to return [0] under WebGL1
    return gl.getInternalformatParameter(GL.RENDERBUFFER, options.format, GL.SAMPLES);
  }

  constructor(gl: WebGLRenderingContext, props?: RenderbufferProps) {
    super(WebGLDevice.attach(gl), props);
  }

  resize(size: {width: number, height: number}): this {
    // Don't resize if width/height haven't changed
    if (size.width !== this.width || size.height !== this.height) {
      return this.initialize({...size, format: this.format, samples: this.samples});
    }
    return this;
  }

  /** Creates and initializes a renderbuffer object's data store */
  initialize(props: RenderbufferProps): this {
    Object.assign(this.props, props);
    this._initialize(this.props);
    return this;
  }

  // PRIVATE

  _syncHandle(handle) {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);
    Object.assign(this.props, {
      format: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_INTERNAL_FORMAT),
      width: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_WIDTH),
      height: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_HEIGHT),
      samples: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_SAMPLES)
    });
  }

  // @param {Boolean} opt.autobind=true - method call will bind/unbind object
  // @returns {GLenum|GLint} - depends on pname
  _getParameter(pname) {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);
    const value = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, pname);
    // this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);
    return value;
  }
}
