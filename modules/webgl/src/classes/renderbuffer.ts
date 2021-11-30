/* eslint-disable no-inline-comments */
import GL from '@luma.gl/constants';
import WebGLResource, {ResourceProps} from './webgl-resource';
import {isRenderbufferFormatSupported, getRenderbufferFormatBytesPerPixel} from './renderbuffer-formats';
import {isWebGL2} from '@luma.gl/gltools';
import {assert} from '../utils/assert';

export type RenderbufferProps = ResourceProps & {
  format: number;
  width?: number;
  height?: number;
  samples?: number;
};

const DEFAULT_RENDERBUFFER_PROPS: Required<RenderbufferProps> = {
  id: undefined,
  handle: undefined,
  userData: undefined,
  format: 0,
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
export class ImmutableRenderbuffer extends WebGLResource<RenderbufferProps> {
  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean {
    return !options.format || isRenderbufferFormatSupported(gl, options.format);
  }

  constructor(gl: WebGLRenderingContext, props: RenderbufferProps) {
    super(gl, props, DEFAULT_RENDERBUFFER_PROPS);
    this._initialize(this.props);
  }

  // PRIVATE METHODS

  /** Creates and initializes a renderbuffer object's data store */
  protected _initialize(props: Required<RenderbufferProps>) {
    const {format, width, height, samples} = props;
    assert(format, 'Needs format');

    this.trackDeallocatedMemory();

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);

    if (samples !== 0 && isWebGL2(this.gl)) {
      // @ts-expect-error
      this.gl.renderbufferStorageMultisample(GL.RENDERBUFFER, samples, format, width, height);
    } else {
      this.gl.renderbufferStorage(GL.RENDERBUFFER, format, width, height);
    }

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);

    this.trackAllocatedMemory(
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
    this.trackDeallocatedMemory();
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
  get width(): number { return this.props.width; }
  get height(): number { return this.props.height; }
  get format(): number  { return this.props.format; }
  get samples(): number { return this.props.samples; }

  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean {
    return ImmutableRenderbuffer.isSupported(gl, options);
  }

  static getSamplesForFormat(gl: WebGL2RenderingContext, options: {format: number}): number{
    // Polyfilled to return [0] under WebGL1
    return gl.getInternalformatParameter(GL.RENDERBUFFER, options.format, GL.SAMPLES);
  }

  constructor(gl: WebGLRenderingContext, props?: RenderbufferProps) {
    super(gl, props);
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
