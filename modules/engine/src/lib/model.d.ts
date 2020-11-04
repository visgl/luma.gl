import ProgramManager from './program-manager';
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
  ShaderModuleObject,
  InjectionMap
} from '@luma.gl/shadertools/src/lib/shader-module'

type Attribute = Buffer | AccessorObject | Accessor |
  [Buffer, Accessor] | [Buffer, AccessorObject]

interface Attributes {
  [attributeName: string]: Attribute
}

interface Parameters {
  [parameterConstant: number]: boolean
  [settingName: string]: boolean
}

interface DefineMap {
  [define: string]: boolean | number
}

interface FeedbackBuffers {
  [name: string]: string | Buffer
}

interface ProgramProps {
  program: Program
  vs: VertexShader | string
  fs: FragmentShader | string
  modules: Array<ShaderModuleObject | string>
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
  id: string
  gl: WebGLRenderingContext
  lastLogTime: number
  programManager: ProgramManager
  programProps: ProgramProps
  program?: Program
  vertexArray?: VertexArray
  userData: {
    [key: string]: any
  }
  needsRedraw: boolean
  attributes: Attributes
  uniforms: Uniforms
  pickable: boolean
  drawMode: number
  geometryBuffers: {
    [geometryName: string]: Buffer | [Buffer, AccessorObject]
  }
  transformFeedback: TransformFeedback

  vertexCount: number   // deprecated 7.0?
  isInstanced: boolean  // deprecated 7.0?
  geometry: Geometry    // deprecated 7.0? (set in clips-space)
  instanceCount: number // deprecated 7.0?

  _attributes: Attributes
  _programDirty: boolean
  _programManagerState: number
  _managedProgram: boolean

  constructor(gl: WebGLRenderingContext, props?: ModelProps);
  initialize(props: ModelProps): void;
  setProps(props: ModelProps): void;
  delete(): void;
  getDrawMode(): number;      // deprecated 7.0?
  getVertexCount(): number;   // deprecated 7.0?
  getInstanceCount(): number; // deprecated 7.0?
  getAttributes(): Attributes;// deprecated 7.0?
  getProgram(): Program;
  setProgram(props: ProgramProps): void;
  getUniforms(): Uniforms;
  setDrawMode(drawMode: number): Model;           // deprecated 7.0?
  setVertexCount(vertexCount: number): Model;     // deprecated 7.0? (used in clips-space)
  setInstanceCount(instanceCount: number): Model; // deprecated 7.0?
  setGeometry(geometry: any): Model;              // deprecated 7.0?
  setAttributes(attributes?: Attributes): Model;  // deprecated 7.0?
  setUniforms(uniforms?: Uniforms): Model;
  getModuleUniforms(opts: UniformsOptions): Uniforms;
  updateModuleSettings(opts: UniformsOptions): Model;
  clear(opts?: ClearOpts): Model;
  draw(opts?: DrawOpts): boolean;
  transform(opts?: TransformOpts): Model;
  render(uniforms?: Uniforms): boolean;           // deprecated 7.0
  _setModelProps(props: ModelProps): void;
  _checkProgram(): void;
  _deleteGeometryBuffers(): void;
  _setAnimationProps(animationProps: AnimationProps): void;
  _setFeedbackBuffers(feedbackBuffers?: FeedbackBuffers): Model;
  _logDrawCallStart(logLevel: number): number;
  _logDrawCallEnd(
    vertexArray: VertexArray,
    uniforms: Uniforms,
    framebuffer: Framebuffer,
    logLevel?: number
  ): void;
}