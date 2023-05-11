/* eslint-disable no-inline-comments */
import {assert, ResourceProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WebGLResource} from './webgl-resource';
import {
  isRenderbufferFormatSupported, getRenderbufferFormatBytesPerPixel
} from '../converters/renderbuffer-formats';

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
export class WEBGLRenderbuffer extends WebGLResource<RenderbufferProps> {
  override get [Symbol.toStringTag](): string { return 'Renderbuffer'; }

  get width(): number { return this.props.width; }
  get height(): number { return this.props.height; }
  get format(): number  { return this.props.format; }
  get samples(): number { return this.props.samples; }

  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean {
    return !options?.format || isRenderbufferFormatSupported(gl, options.format);
  }

  constructor(device: WebGLDevice, props: RenderbufferProps) {
    super(device, props, DEFAULT_RENDERBUFFER_PROPS);
    this._initialize(this.props);
  }

  resize(size: {width: number, height: number}): this {
    // Don't resize if width/height haven't changed
    if (size.width !== this.width || size.height !== this.height) {
      Object.assign(this.props, {...size, format: this.format, samples: this.samples});
      this._initialize(this.props);
    }
    return this;
  }

  // PRIVATE METHODS

  /** Creates and initializes a renderbuffer object's data store */
  protected _initialize(props: Required<RenderbufferProps>) {
    const {format, width, height, samples} = props;
    assert(format, 'Needs format');

    this.trackDeallocatedMemory();

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);

    if (samples !== 0 && this.device.isWebGL2) {
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

  // RESOURCE IMPLEMENTATION

  override _createHandle() {
    return this.gl.createRenderbuffer();
  }

  override _deleteHandle(): void {
    this.gl.deleteRenderbuffer(this.handle);
    this.trackDeallocatedMemory();
  }

  override _bindHandle(handle: WEBGLRenderbuffer): void {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, handle);
  }
}
