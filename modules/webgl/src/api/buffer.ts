import Resource, {ResourceProps} from './resource';

/** Abstract Buffer interface */
export type BufferProps = ResourceProps & {
  handle?: WebGLBuffer;
  data?: any; // ArrayBufferView;
  byteLength?: number;
  target?: number;
  usage?: number;
  accessor?: any; // AccessorObject;

  /** @deprecated */
  index?: number;
  /** @deprecated */
  offset?: number;
  /** @deprecated */
  size?: number;
  /** @deprecated */
  type?: number
};

/** Abstract Buffer interface */
export class Buffer extends Resource<BufferProps> {
  get [Symbol.toStringTag](): string {
    return 'Buffer';
  }
  // toString(): string {
  //   return `Buffer${this.precision}`;
  // }
};
