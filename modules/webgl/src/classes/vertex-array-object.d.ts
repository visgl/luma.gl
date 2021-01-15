import Resource, {ResourceProps} from './resource';

export type VertexArrayObjectProps = ResourceProps & object;

export default class VertexArrayObject extends Resource {
  static isSupported(gl: WebGLRenderingContext, options?: VertexArrayObjectProps): boolean;
  static getDefaultArray(gl: WebGLRenderingContext): any;
  static getMaxAttributes(gl: WebGLRenderingContext): any;
  static setConstant(gl: WebGLRenderingContext, location: any, array: any): void;

  get MAX_ATTRIBUTES(): any;

  constructor(gl: WebGLRenderingContext, opts?: VertexArrayObjectProps);
  delete(): this;

  initialize(props?: {}): this;
  setProps(props: any): this;
  setElementBuffer(elementBuffer?: any, opts?: {}): this;
  setBuffer(location: any, buffer: any, accessor: any): this;
  enable(location: any, enable?: boolean): this;
  getConstantBuffer(elementCount: any, value: any): any;

  // PRIVATE
  // _normalizeConstantArrayValue(arrayValue);
}
