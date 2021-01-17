import ProgramManager from './program-manager';
import {Program, Shader} from '@luma.gl/webgl';

type DefineMap = object;
type InjectionMap = object;

type ProgramProps = {
  program?: Program
  vs?: Shader | string
  fs?: Shader | string
  modules?: (object | string)[]; // Array<ShaderModule | ShaderModuleObject | string>
  defines?: DefineMap
  inject?: InjectionMap
  varyings?: string[]
  bufferMode?: number
  transpileToGLSL100?: boolean
}

type ModelProps = ProgramProps & {
  id?: string
  moduleSettings?: object; // UniformsOptions
  attributes?: object,
  uniforms?: object; // Uniforms
  geometry?: object; // Geometry
  vertexCount?: number
  drawMode?: number
  isInstanced?: boolean
  instanceCount?: number
  programManager?: ProgramManager
  onBeforeRender?: () => void
  onAfterRender?: () => void
  _feedbackBuffers?: object; // FeedbackBuffers
}

/*
export type ModelProps = {
  id?: string;
  program?: Program;
  vs?: Shader | string;
  fs?: Shader | string;
  geometry?: object;
  drawMode?: number;
  vertexCount?: number;
  isInstanced?: boolean;
  modules?: object;
  defines?: object;
  inject?: object;
  varyings?: object;
  bufferMode?: number;
  transpileToGLSL100?: boolean;
};
*/

export default class Model {
  readonly id: string;
  readonly gl: WebGLRenderingContext;
  readonly animated: boolean;
  readonly programManager: ProgramManager;
  readonly vertexCount: number;

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
  draw(opts?: {}): boolean;
  transform(opts?: {}): this;
  render(uniforms?: {}): any;
}

/*
import Geometry from '../geometry/geometry';
import { AnimationProps } from './animation-loop';
import {
  Buffer,
  Program,
  VertexArray,
  Framebuffer,
  TransformFeedback,
  Accessor,
  VertexShader,
  FragmentShader
} from '@luma.gl/webgl';

import {
  AccessorObject
} from '@luma.gl/webgl/src/classes/accessor'

import {
  Uniforms,
  UniformsOptions
} from '@luma.gl/webgl/src/classes/uniforms'

import {
  ShaderModule,
  ShaderModuleObject,
  InjectionMap
} from '@luma.gl/shadertools/src/lib/shader-module'

import {
  DefineMap
} from '@luma.gl/shadertools/src/lib/assemble-shaders'

type Attribute = Buffer | AccessorObject | Accessor |
  [Buffer, Accessor] | [Buffer, AccessorObject]

interface Attributes {
  [attributeName: string]: Attribute
}

interface Parameters {
  [parameterConstant: number]: boolean
  [settingName: string]: boolean
}

interface FeedbackBuffers {
  [name: string]: string | Buffer
}

interface ProgramProps {
  program: Program
  vs: VertexShader | string
  fs: FragmentShader | string
  modules: Array<ShaderModule | ShaderModuleObject | string>
  defines: DefineMap
  inject: InjectionMap
  varyings: Array<string>
  bufferMode: number
  transpileToGLSL100: boolean
}

interface ModelProps extends ProgramProps {
  id?: string
  moduleSettings?: UniformsOptions
  uniforms?: Uniforms
  geometry?: Geometry
  vertexCount?: number
  drawMode?: number
  programManager?: ProgramManager
  onBeforeRender?: () => void
  onAfterRender?: () => void
  _feedbackBuffers?: FeedbackBuffers
}

interface DrawOpts {
  moduleSettings?: UniformsOptions
  framebuffer: Framebuffer
  uniforms?: Uniforms
  attributes?: Attributes
  parameters?: Parameters
  transformFeedback?: TransformFeedback
  vertexArray?: VertexArray
}

interface ClearOpts {
  framebuffer?: Framebuffer
  color?: boolean
  depth?: boolean
  stencil?: boolean
}

interface TransformOpts extends DrawOpts {
  discard: boolean
  feedbackBuffers: FeedbackBuffers
  unbindModels: Array<Model>
  parameters: Parameters
}

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
*/
