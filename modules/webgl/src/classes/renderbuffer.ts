/* eslint-disable no-inline-comments */
import GL from '@luma.gl/constants';
import Resource, {ResourceProps} from './resource';
import RENDERBUFFER_FORMATS from './renderbuffer-formats';
import {isWebGL2} from '@luma.gl/gltools';
import {assert} from '../utils';

export type RenderbufferProps = ResourceProps & {
  format: number;
  width?: number;
  height?: number;
  samples?: number;
};

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
export default class Renderbuffer extends Resource {
  width: number;
  height: number;
  format: number;
  samples;

  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean {
    return !options.format || isFormatSupported(gl, options.format, RENDERBUFFER_FORMATS);
  }

  static getSamplesForFormat(gl: WebGL2RenderingContext, options: {format: number}): number{
    // Polyfilled to return [0] under WebGL1
    return gl.getInternalformatParameter(GL.RENDERBUFFER, options.format, GL.SAMPLES);
  }

  constructor(gl: WebGLRenderingContext, props?: RenderbufferProps) {
    super(gl, props);

    // @ts-ignore
    this.initialize(props);

    Object.seal(this);
  }

  /** Creates and initializes a renderbuffer object's data store */
  initialize(props: RenderbufferProps) {
    const {format, width = 1, height = 1, samples = 0} = props || {};
    assert(format, 'Needs format');

    this._trackDeallocatedMemory();

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);

    if (samples !== 0 && isWebGL2(this.gl)) {
      // @ts-ignore
      this.gl.renderbufferStorageMultisample(GL.RENDERBUFFER, samples, format, width, height);
    } else {
      this.gl.renderbufferStorage(GL.RENDERBUFFER, format, width, height);
    }

    // this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);

    this.format = format;
    this.width = width;
    this.height = height;
    this.samples = samples;

    this._trackAllocatedMemory(
      this.width * this.height * (this.samples || 1) * RENDERBUFFER_FORMATS[this.format].bpp
    );

    return this;
  }

  resize(size: {width: number, height: number}): this {
    // Don't resize if width/height haven't changed
    if (size.width !== this.width || size.height !== this.height) {
      return this.initialize({...size, format: this.format, samples: this.samples});
    }
    return this;
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createRenderbuffer();
  }

  _deleteHandle() {
    this.gl.deleteRenderbuffer(this.handle);
    this._trackDeallocatedMemory();
  }

  _bindHandle(handle) {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, handle);
  }

  _syncHandle(handle) {
    this.format = this.getParameter(GL.RENDERBUFFER_INTERNAL_FORMAT);
    this.width = this.getParameter(GL.RENDERBUFFER_WIDTH);
    this.height = this.getParameter(GL.RENDERBUFFER_HEIGHT);
    this.samples = this.getParameter(GL.RENDERBUFFER_SAMPLES);
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

function isFormatSupported(gl: WebGLRenderingContext, format, formats): boolean {
  const info = formats[format];
  if (!info) {
    return false;
  }
  const value = isWebGL2(gl) ? info.gl2 || info.gl1 : info.gl1;
  if (typeof value === 'string') {
    return gl.getExtension(value);
  }
  return value;
}
