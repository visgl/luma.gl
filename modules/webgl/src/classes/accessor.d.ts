interface AccessorObject {
  buffer?: Buffer
  offset?: number
  stride?: number
  type?: number
  size?: number
  divisor?: number
  normalize?: boolean
  integer?: boolean
}

export default class Accessor {
  static getBytesPerElement(accessor: any): number;
  static getBytesPerVertex(accessor: any): number;
  static resolve(...accessors: any[]): Accessor;
  constructor(...accessors: any[]);
  toString(): string;
  get BYTES_PER_ELEMENT(): number;
  get BYTES_PER_VERTEX(): number;

  readonly offset: number;
  readonly stride: number;
  readonly type: number;
  readonly size: number;
  readonly divisor: number;
  readonly normalized: boolean;
  readonly integer: boolean;
}
