import ProgramManager from './program-manager';
import {Program, Shader} from '@luma.gl/webgl';

export type ModelProps = {
  program?: Program;
  vs?: Shader | string;
  fs?: Shader | string;
  modules?: object;
  defines?: object;
  inject?: object;
  varyings?: object;
  bufferMode?: number;
  transpileToGLSL100?: boolean;
};

export default class Model {
  readonly id: string;
  readonly gl: WebGLRenderingContext;
  readonly animated: boolean;
  readonly programManager: ProgramManager;

  constructor(gl: WebGLRenderingContext, props?: ModelProps);
  initialize(props: any): void;
  setProps(props: any): void;
  delete(): void;
  getDrawMode(): any;
  getVertexCount(): any;
  getInstanceCount(): any;
  getAttributes(): any;
  getProgram(): any;
  setProgram(props: any): void;
  getUniforms(): any;
  setDrawMode(drawMode: any): this;
  setVertexCount(vertexCount: number): this;
  setInstanceCount(instanceCount: number): this;
  setGeometry(geometry: any): this;
  setAttributes(attributes?: object): this;
  setUniforms(uniforms?: object): this;
  getModuleUniforms(opts?: object): any;
  updateModuleSettings(opts?: object): this;
  clear(opts: any): this;
  draw(opts?: {}): any;
  transform(opts?: {}): this;
  render(uniforms?: {}): any;
}
