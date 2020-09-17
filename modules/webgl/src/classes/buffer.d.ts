import Resource from "./resource";

export default class Buffer extends Resource {
  readonly byteLength: number;
  readonly bytesUsed: number;
  readonly usage: number;
  readonly accessor: object;

  constructor(gl: WebGLRenderingContext, props?: {});
  getElementCount(accessor?: any): number;
  getVertexCount(accessor?: any): number;
  initialize(props?: {}): this;
  setProps(props: any): this;
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
  bind(options?: {
    target?: any;
    index?: any;
    offset?: number;
    size: any;
  }): this;
  unbind(options?: { target?: any; index?: any }): this;
  getDebugData(): {
    data: any;
    changed: boolean;
  };
  invalidateDebugData(): void;
  get type(): any;
  get bytes(): any;
  setByteLength(byteLength: any): boolean;
  updateAccessor(opts: any): this;
}
