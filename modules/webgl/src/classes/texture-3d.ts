import GL from '@luma.gl/constants';
import {isWebGL2, assertWebGL2Context, withParameters} from '@luma.gl/gltools';
import Texture, {TextureProps} from './texture';
import {DATA_FORMAT_CHANNELS, TYPE_SIZES} from './texture-formats';
import Buffer from './webgl-buffer';

export type Texture3DProps = TextureProps & {
};

type SetImageDataOptions = {
  level?: number;
  dataFormat?: any;
  width: any;
  height: any;
  depth?: number;
  border?: number;
  format: any;
  type?: any;
  offset?: number;
  data: any;
  parameters?: {};
};

/**
 * Textures that have 3 dimensions: width, height, and depth.
 * They are accessed by 3-dimensional texture coordinates.
 */
export default class Texture3D extends Texture {
  static isSupported(gl: WebGLRenderingContext): boolean {
    return isWebGL2(gl);
  }

  constructor(gl: WebGL2RenderingContext, props: Texture3DProps = {}) {
    super(gl as WebGLRenderingContext, props);
    assertWebGL2Context(gl);
    props = Object.assign({depth: 1}, props, {target: GL.TEXTURE_3D, unpackFlipY: false});
    this.initialize(props);

    Object.seal(this);
  }

  get [Symbol.toStringTag](): string {
    return 'Texture3D';
  }

  /** Image 3D copies from Typed Array or WebGLBuffer */
  setImageData({
    level = 0,
    dataFormat = GL.RGBA,
    width,
    height,
    depth = 1,
    border = 0,
    format,
    type = GL.UNSIGNED_BYTE,
    offset = 0,
    data,
    parameters = {}
  }: SetImageDataOptions) {
    this.trackDeallocatedMemory('Texture');

    this.gl.bindTexture(this.target, this.handle);

    withParameters(this.gl, parameters, () => {
      if (ArrayBuffer.isView(data)) {
        // @ts-ignore
        this.gl.texImage3D(
          this.target,
          level,
          dataFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          data
        );
      }

      if (data instanceof Buffer) {
        this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data.handle);
        // @ts-ignore
        this.gl.texImage3D(
          this.target,
          level,
          dataFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          offset
        );
      }
    });

    if (data && data.byteLength) {
      this.trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      // NOTE(Tarek): Default to RGBA bytes
      // @ts-ignore
      const channels = DATA_FORMAT_CHANNELS[this.dataFormat] || 4;
      // @ts-ignore
      const channelSize = TYPE_SIZES[this.type] || 1;

      this.trackAllocatedMemory(
        this.width * this.height * this.depth * channels * channelSize,
        'Texture'
      );
    }

    this.loaded = true;

    return this;
  }
}
