import Resource, {ResourceProps} from './resource';
import ProgramConfiguration from './program-configuration';

export type ProgramProps = ResourceProps & {

}

/**
 * A Program holds fully processed executable code,
 * for one or more Shader stages. 
 */
export default class Program extends Resource {

  readonly handle: WebGLProgram;  
  readonly configuration: ProgramConfiguration;

  constructor(gl: WebGLRenderingContext, props?: {});
  initialize(props?: {}): this;
  delete(options?: {}): this;
  setProps(props: any): this;
  draw(options: {
    logPriority?: any;
    drawMode?: any;
    vertexCount: any;
    offset?: number;
    start?: any;
    end?: any;
    isIndexed?: boolean;
    indexType?: any;
    instanceCount?: number;
    isInstanced?: boolean;
    vertexArray?: any;
    transformFeedback?: any;
    framebuffer?: any;
    parameters?: {};
    uniforms?: any;
    samplers?: any;
  }): boolean;
  setUniforms(uniforms?: {}): this;
  getActiveUniforms(uniformIndices: any, pname: any): any;
  getUniformBlockIndex(blockName: any): any;
  getActiveUniformBlockParameter(blockIndex: any, pname: any): any;
  uniformBlockBinding(blockIndex: any, blockBinding: any): void;
}
