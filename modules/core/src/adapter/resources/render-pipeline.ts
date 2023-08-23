// luma.gl, MIT license
import type {Device} from '../device';
import type {TypedArray} from '../../types';
import type {UniformValue} from '../types/types';
import type {PrimitiveTopology, RenderPipelineParameters} from '../types/parameters';
import type {ShaderLayout, BufferLayout, Binding} from '../types/shader-layout';
// import {normalizeAttributeMap} from '../helpers/attribute-bindings';
import {Resource, ResourceProps} from './resource';
import type {Buffer} from './buffer';
import type {Shader} from './shader';
import type {RenderPass} from './render-pass';

export type RenderPipelineProps = ResourceProps & {
  // Shaders and shader layout

  /** Compiled vertex shader */
  vs?: Shader | null;
  /** Vertex shader entry point (defaults to 'main'). WGSL only */
  vsEntryPoint?: string; //
  /** Constants to apply to compiled vertex shader (WGSL only) */
  vsConstants?: Record<string, number>; // WGSL only
  /** Compiled fragment shader */
  fs?: Shader | null;
  /** Fragment shader entry point (defaults to 'main'). WGSL only */
  fsEntryPoint?: string; // WGSL only
  /** Constants to apply to compiled fragment shader (WGSL only) */
  fsConstants?: Record<string, number>;

  /** Describes the attributes and bindings exposed by the pipeline shader(s). */
  shaderLayout?: ShaderLayout | null;
  /**
   * Describes the buffers accepted by this pipeline and how they are mapped to shader attributes.
   * A default mapping of one buffer per attribute is always created.
   */
  bufferLayout?: BufferLayout[], // Record<string, Omit<BufferLayout, 'name'>

  /** Determines how vertices are read from the 'vertex' attributes */
  topology?: PrimitiveTopology;
  /** Parameters that are controlled by pipeline */
  parameters?: RenderPipelineParameters;

  // Can be changed after creation
  // TODO make pipeline immutable? these could be supplied to draw as parameters, in WebGPU they are set on the render pass 

  /** Number of vertices */
  vertexCount?: number;
  /** Number of instances */
  instanceCount?: number;

  /** Optional index buffer */
  indices?: Buffer | null;
  /** Buffers for attributes */
  attributes?: Record<string, Buffer>;
  /** Buffers, Textures, Samplers for the shader bindings */
  bindings?: Record<string, Binding>;
  /** @deprecated uniforms (WebGL only) */
  uniforms?: Record<string, UniformValue>;
};

/**
 * A compiled and linked shader program
 */
export abstract class RenderPipeline extends Resource<RenderPipelineProps> {
  static override defaultProps: Required<RenderPipelineProps> = {
    ...Resource.defaultProps,
  
    vs: null,
    vsEntryPoint: '', // main
    vsConstants: {},
  
    fs: null,
    fsEntryPoint: '', // main
    fsConstants: {},
  
    shaderLayout: null,
    bufferLayout: [],
    topology: 'triangle-list',
    parameters: {},
  
    vertexCount: 0,
    instanceCount: 0,
  
    indices: null,
    attributes: {},
    bindings: {},
    uniforms: {}
  }; 

  override get [Symbol.toStringTag](): string { return 'RenderPipeline'; }

  hash: string = '';
  abstract vs: Shader;
  abstract fs: Shader | null;

  constructor(device: Device, props: RenderPipelineProps) {
    super(device, props, RenderPipeline.defaultProps);
  }

  /** Set attributes (stored on pipeline and set before each call) */
  abstract setIndexBuffer(indices: Buffer | null): void;
  /** Set attributes (stored on pipeline and set before each call) */
  abstract setAttributes(attributes: Record<string, Buffer>): void;
  /** Set constant attributes (WebGL only) */
  abstract setConstantAttributes(attributes: Record<string, TypedArray>): void;
  /** Set bindings (stored on pipeline and set before each call) */
  abstract setBindings(bindings: Record<string, Binding>): void;
  /** Uniforms 
   * @deprecated Only supported on WebGL devices.
   * @note textures, samplers and uniform buffers should be set via `setBindings()`, these are not considered uniforms.
   * @note In WebGL uniforms have a performance penalty, they are reset before each call to enable pipeline sharing. 
   */
  abstract setUniforms(bindings: Record<string, UniformValue>): void;

  /** Draw call */ 
  abstract draw(options: {
    /** Render pass to draw into (targeting screen or framebuffer) */
    renderPass?: RenderPass;
    /** Number of "rows" in 'vertex' buffers */
    vertexCount?: number;
    /** Number of "rows" in 'instance' buffers */
    instanceCount?: number;
    /** First vertex to draw from */
    firstVertex?: number;
    /** First index to draw from */
    firstIndex?: number;
    /** First instance to draw from */
    firstInstance?: number;
    baseVertex?: number;
  }): void;
}
