import Resource from "./resource";

export default class VertexArrayObject extends Resource {
  static isSupported(gl: WebGLRenderingContext, options?: {}): boolean;
  static getDefaultArray(gl: WebGLRenderingContext): any;
  static getMaxAttributes(gl: WebGLRenderingContext): any;
  static setConstant(gl: WebGLRenderingContext, location: any, array: any): void;
  constructor(gl: WebGLRenderingContext, opts?: {});
  delete(): this;
  get MAX_ATTRIBUTES(): any;
  initialize(props?: {}): this;
  setProps(props: any): this;
  setElementBuffer(elementBuffer?: any, opts?: {}): this;
  setBuffer(location: any, buffer: any, accessor: any): this;
  enable(location: any, enable?: boolean): this;
  getConstantBuffer(elementCount: any, value: any, accessor: any): any;
}
