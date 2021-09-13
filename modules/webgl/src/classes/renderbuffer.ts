/* eslint-disable no-inline-comments */
import GL from '@luma.gl/constants';
import Resource, {ResourceProps} from './resource';
import {isRenderbufferFormatSupported, getRenderbufferFormatBytesPerPixel} from './renderbuffer-formats';
import {isWebGL2} from '@luma.gl/gltools';
import {assert} from '../utils';

export type RenderbufferProps = ResourceProps & {
  format: number;
  width?: number;
  height?: number;
  samples?: number;
};

const DEFAULT_RENDERBUFFER_PROPS = {
  width: 1, 
  height: 1, 
  samples: 0
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
export class ImmutableRenderbuffer extends Resource {
  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean {
    return !options.format || isRenderbufferFormatSupported(gl, options.format);
  }

  constructor(gl: WebGLRenderingContext, props: RenderbufferProps) {
    super(gl, props);
    this._initialize(props);
  }

  // PRIVATE METHODS

  /** Creates and initializes a renderbuffer object's data store */
  protected _initialize(props: RenderbufferProps) {
    const {format, width, height, samples} = {...DEFAULT_RENDERBUFFER_PROPS, ...props};
    assert(format, 'Needs format');

    this._trackDeallocatedMemory();

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);

    if (samples !== 0 && isWebGL2(this.gl)) {
      // @ts-ignore
      this.gl.renderbufferStorageMultisample(GL.RENDERBUFFER, samples, format, width, height);
    } else {
      this.gl.renderbufferStorage(GL.RENDERBUFFER, format, width, height);
    }

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);

    this._trackAllocatedMemory(
      width * height * (samples || 1) * getRenderbufferFormatBytesPerPixel(format)
    );

    return this;
  }

  // RESOURECE IMPLEMENTATION

  _createHandle() {
    return this.gl.createRenderbuffer();
  }

  _deleteHandle(): void {
    this.gl.deleteRenderbuffer(this.handle);
    this._trackDeallocatedMemory();
  }

  _bindHandle(handle): void {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, handle);
  }
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
 */
 export default class Renderbuffer extends ImmutableRenderbuffer {
  width: number;
  height: number;
  format: number;
  samples: number;

  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean {
    return ImmutableRenderbuffer.isSupported(gl, options);
  }

  static getSamplesForFormat(gl: WebGL2RenderingContext, options: {format: number}): number{
    // Polyfilled to return [0] under WebGL1
    return gl.getInternalformatParameter(GL.RENDERBUFFER, options.format, GL.SAMPLES);
  }

  constructor(gl: WebGLRenderingContext, props?: RenderbufferProps) {
    super(gl, props);
    this.format = props.format;
    this.width = props.width;
    this.height = props.height;
    this.samples = props.samples;
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
    props = {...DEFAULT_RENDERBUFFER_PROPS, ...props};
    this._initialize(props);
    this.format = props.format;
    this.width = props.width;
    this.height = props.height;
    this.samples = props.samples;
    return this;
  }

  // PRIVATE

  _syncHandle(handle) {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);
    this.format = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_INTERNAL_FORMAT);
    this.width = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_WIDTH);
    this.height = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_HEIGHT);
    this.samples = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, GL.RENDERBUFFER_SAMPLES);
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
