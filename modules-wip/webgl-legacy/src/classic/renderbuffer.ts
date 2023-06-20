/* eslint-disable no-inline-comments */
import type {Device} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice, WEBGLRenderbuffer, RenderbufferProps, convertGLToTextureFormat} from '@luma.gl/webgl';

export type ClassicRenderbufferProps = Omit<RenderbufferProps, 'format'> & {
  format: GL;
}

/**
 * Renderbuffers are GPU objects that contain images.
 * In contrast to Textures they are optimized for use as render targets, with Framebuffers.
 * while Textures may not be, and are the logical choice when
 * you do not need to sample (i.e. in a post-pass shader)
 * from the produced image. If you need to resample
 * (such as when reading depth back in a second shader pass),
 * use Textures instead.
 * Renderbuffer objects also natively accommodate Multisampling (MSAA).
 * 
 * @deprecated Use WEBGLRenderBuffer
 */
export class ClassicRenderbuffer extends WEBGLRenderbuffer {
  static override isSupported(device: Device | WebGLRenderingContext, options?: {format?: number}): boolean {
    const gl = WebGLDevice.attach(device).gl;
    return WEBGLRenderbuffer.isSupported(gl, options);
  }

  static getSamplesForFormat(device: Device | WebGL2RenderingContext, options: {format: number}): number{
    const gl2 = WebGLDevice.attach(device).gl as WebGL2RenderingContext;
    // Polyfilled to return [0] under WebGL1
    return gl2.getInternalformatParameter(GL.RENDERBUFFER, options.format, GL.SAMPLES);
  }

  constructor(device: Device | WebGLRenderingContext, props?: ClassicRenderbufferProps) {
    const newProps: RenderbufferProps = {...props, format: convertGLToTextureFormat(props.format)};
    super(WebGLDevice.attach(device), newProps);
  }

  /** Creates and initializes a renderbuffer object's data store */
  override initialize(props: RenderbufferProps): this {
    Object.assign(this.props, props);
    const newProps: Required<RenderbufferProps> = {...this.props, format: convertGLToTextureFormat(this.props.format)};
    this._initialize(newProps);
    return this;
  }

  // PRIVATE

  // _syncHandle() {
  //   this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);
  //   Object.assign(this.props, {
  //     format: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_INTERNAL_FORMAT),
  //     width: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_WIDTH),
  //     height: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_HEIGHT),
  //     samples: this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_SAMPLES)
  //   });
  // }

  // @param {Boolean} opt.autobind=true - method call will bind/unbind object
  // @returns {GLenum|GLint} - depends on pname
  override _getParameter(pname: GL): number {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);
    const value = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, pname);
    // this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);
    return value;
  }
}
