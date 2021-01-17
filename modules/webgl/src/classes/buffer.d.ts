import {AccessorObject} from '../types';
import Resource, {ResourceProps} from './resource';

export type BufferProps = ResourceProps & {
  data?: any; // ArrayBufferView;
  byteLength?: number;
  target?: number;
  usage?: number;
  accessor?: AccessorObject;

  /** @deprecated */
  index?: number;
  /** @deprecated */
  offset?: number;
  /** @deprecated */
  size?: number;
  /** @deprecated */
  type?: number
}

/**
 * Holds a block of unformatted memory allocated on the GPU via an underlying 
 * WebGLBuffer. These can be used to store vertex data, pixel data retrieved
 * from images or the framebuffer, and a variety of other things. 
 */
export default class Buffer extends Resource {

  readonly handle: WebGLBuffer;
  readonly byteLength: number;
  readonly bytesUsed: number;
  readonly usage: number;
  readonly accessor: object;

  readonly type: any;
  readonly bytes: any;

  constructor(gl: WebGLRenderingContext, props?: BufferProps);
  constructor(gl: WebGLRenderingContext, data: ArrayBufferView | number[]);
  constructor(gl: WebGLRenderingContext, byteLength: number);

  initialize(props?: BufferProps): this;
  setProps(props: BufferProps): this;

  getElementCount(accessor?: any): number;
  getVertexCount(accessor?: any): number;

  setAccessor(accessor: any): this;
  reallocate(byteLength: any): boolean;

  setData(props: any): this;
  subData(props: any): this;

  copyData(options: {
    sourceBuffer: any;
    readOffset?: number;
    writeOffset?: number;
    size: any;
  }): this;

  getData(options?: {
    dstData?: any;
    srcByteOffset?: number;
    dstOffset?: number;
    length?: number;
  }): any;

  /**
   * Binds a buffer to a given binding point (target).
   *   GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER take an index, and optionally a range.
   *   - GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER need an index to affect state
   *   - GL.UNIFORM_BUFFER: `offset` must be aligned to GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT.
   *   - GL.UNIFORM_BUFFER: `size` must be a minimum of GL.UNIFORM_BLOCK_SIZE_DATA.
   */
  bind(options?: {target?: any; index?: any; offset?: number; size: any}): this;
  unbind(options?: {target?: any; index?: any}): this;

  getDebugData(): {
    data: any;
    changed: boolean;
  };
  invalidateDebugData(): void;
  setByteLength(byteLength: any): boolean;
  updateAccessor(opts: any): this;
}
