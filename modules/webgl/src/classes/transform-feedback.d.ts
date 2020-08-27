import Resource from "@luma.gl/webgl/classes/resource";

export default class TransformFeedback extends Resource {
  static isSupported(gl: WebGLRenderingContext): boolean;
  constructor(gl: WebGLRenderingContext, props?: {});
  initialize(props?: {}): this;
  setProps(props: any): void;
  setBuffers(buffers?: {}): this;
  setBuffer(locationOrName: any, bufferOrParams: any): this;
  begin(primitiveMode?: any): this;
  end(): this;
}
