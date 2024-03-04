// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert, ResourceProps, TextureFormat} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WebGLResource} from './webgl-resource';
import {isRenderbufferFormatSupported} from '../converters/texture-formats';
import {
  convertTextureFormatToGL,
  getTextureFormatBytesPerPixel
} from '../converters/texture-formats';

export type RenderbufferProps = ResourceProps & {
  format: TextureFormat;
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
export class WEBGLRenderbuffer extends WebGLResource<RenderbufferProps> {
  static override readonly defaultProps: Required<RenderbufferProps> = {
    id: undefined,
    handle: undefined,
    userData: undefined,
    format: undefined, // 'depth16unorm'
    width: 1,
    height: 1,
    samples: 0
  };

  override get [Symbol.toStringTag](): string {
    return 'Renderbuffer';
  }

  get width(): number {
    return this.props.width;
  }
  get height(): number {
    return this.props.height;
  }
  get format(): TextureFormat {
    return this.props.format;
  }
  get samples(): number {
    return this.props.samples;
  }
  get attachment() {
    return;
  }

  /** WebGL format constant */
  glFormat: GL;

  static isTextureFormatSupported(device: WebGLDevice, format: TextureFormat): boolean {
    return isRenderbufferFormatSupported(device.gl, format, device._extensions);
  }

  constructor(device: WebGLDevice, props: RenderbufferProps) {
    // TODO - remove temporary sanity check
    if (typeof props.format === 'number') {
      throw new Error('Renderbuffer');
    }
    super(device, props, WEBGLRenderbuffer.defaultProps);
    this.glFormat = convertTextureFormatToGL(this.props.format);
    this._initialize(this.props);
  }

  resize(size: {width: number; height: number}): void {
    // Don't resize if width/height haven't changed
    if (size.width !== this.width || size.height !== this.height) {
      Object.assign(this.props, {...size, format: this.format, samples: this.samples});
      this._initialize(this.props);
    }
  }

  // PRIVATE METHODS

  /** Creates and initializes a renderbuffer object's data store */
  protected _initialize(props: Required<RenderbufferProps>): void {
    const {format, width, height, samples} = props;
    assert(format, 'Needs format');

    this.trackDeallocatedMemory();

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);

    if (samples !== 0) {
      this.gl.renderbufferStorageMultisample(
        GL.RENDERBUFFER,
        samples,
        this.glFormat,
        width,
        height
      );
    } else {
      this.gl.renderbufferStorage(GL.RENDERBUFFER, this.glFormat, width, height);
    }

    this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);

    this.trackAllocatedMemory(
      width * height * (samples || 1) * getTextureFormatBytesPerPixel(this.format)
    );
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
