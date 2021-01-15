import Resource, {ResourceProps} from './resource';

export type ShaderProps = ResourceProps & {
  source: string;
  shaderType?: string;
};

/**
 * Encapsulates the compiled or linked Shaders that execute portions of the WebGL Pipeline
 */
export class Shader extends Resource {
  static getTypeName(shaderType: any): 'vertex-shader' | 'fragment-shader' | 'unknown';

  constructor(gl: WebGLRenderingContext, props: ShaderProps);
  initialize(options: ShaderProps): this;
  getParameter(pname: any): any;
  toString(): string;
  getName(): string;
  getSource(): string;
  getTranslatedSource(): string;
}

export class VertexShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: any);
}

export class FragmentShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: any);
}
