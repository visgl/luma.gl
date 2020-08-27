import Resource from "@luma.gl/webgl/classes/resource";

export class Shader extends Resource {
  static getTypeName(
    shaderType: any
  ): "vertex-shader" | "fragment-shader" | "unknown";
  constructor(gl: WebGLRenderingContext, props: object);
  initialize(options: { source: string }): void;
  getParameter(pname: any): any;
  toString(): string;
  getName(): any;
  getSource(): any;
  getTranslatedSource(): any;
}

export class VertexShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: any);
}

export class FragmentShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: any);
}
