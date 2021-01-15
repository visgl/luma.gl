import Program from './program'; 
import ProgramConfiguration from './program-configuration';
import VertexArrayObject from './vertex-array-object';
import Accessor from './accessor';

export type VertexArrayProps = {
  program?: Program;
  configuration?: ProgramConfiguration;
  attributes?: any[];
  elements?: any;
  bindOnUse?: boolean;
};

export default class VertexArray {
  readonly attributes: object;

  constructor(gl: WebGLRenderingContext, opts?: {});
  delete(): void;
  initialize(props?: {}): this;
  reset(): this;
  setProps(props: any): this;
  clearDrawParams(): void;
  getDrawParams(): any;
  setAttributes(attributes: any): this;
  setElementBuffer(elementBuffer?: any, accessor?: {}): this;
  setBuffer(locationOrName: any, buffer: any, appAccessor?: {}): this;
  setConstant(locationOrName: any, arrayValue: any, appAccessor?: {}): this;
  unbindBuffers(): this;
  bindBuffers(): this;
  bindForDraw(vertexCount: any, instanceCount: any, func: any): any;
  setElements(elementBuffer?: any, accessor?: {}): this;

  // FOR TESTING
  readonly configuration: ProgramConfiguration | null;
  readonly accessors: Accessor[];
  readonly vertexArrayObject: VertexArrayObject;
}
