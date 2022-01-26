// luma.gl, MIT license
import type Device from '../device';
import type {RenderPipelineParameters} from '../types/parameters';
import type {ShaderLayout, BufferMapping, Binding} from '../types/shader-layout';
// import {normalizeAttributeMap} from '../helpers/attribute-bindings';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import type {default as Buffer} from './buffer';
import type {default as Shader} from './shader';
import type {default as RenderPass} from './render-pass';

export type RenderPipelineProps = ResourceProps & {
  // Shaders and shader layout

  /** Compiled vertex shader */
  vs?: Shader;
  /** Vertex shader entry point (defaults to 'main'). WGSL only */
  vsEntryPoint?: string; //
  /** Constants to apply to compiled vertex shader (WGSL only) */
  vsConstants?: Record<string, number>; // WGSL only
  /** Compiled fragment shader */
  fs?: Shader;
  /** Fragment shader entry point (defaults to 'main'). WGSL only */
  fsEntryPoint?: string; // WGSL only
  /** Constants to apply to compiled fragment shader (WGSL only) */
  fsConstants?: Record<string, number>;

  /** Describes the attributes and bindings exposed by the pipeline shader(s). */
  layout?: ShaderLayout;

  /** Determines how vertices are read from the 'vertex' attributes */
  topology?: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  /** Parameters that are controlled by pipeline */
  parameters?: RenderPipelineParameters;
  // targets...

  /**
   * Describes the buffers accepted by this pipeline and how they are mapped to shader attributes.
   * A default mapping of one buffer per attribute is always created.
   * @note interleaving attributes into the same buffer does not increase the number of attributes
   * that can be used in a shader (16 on many systems).
   */
  bufferMap?: BufferMapping[], // Record<string, Omit<BufferMapping, 'name'>

  // Can be changed after creation
  // TODO - could be supplied to draw, making pipeline immutable

  /** Number of "rows" in 'vertex' buffers */
  vertexCount?: number;
  /** Number of "rows" in 'instance' buffers */
  instanceCount?: number;
  /** Optional index buffer */
  indices?: Buffer;
  /** Buffers for attributes */
  attributes?: Record<string, Buffer>;
  /** Buffers, Textures, Samplers for the shader bindings */
  bindings?: Record<string, Binding>;
  /** uniforms (WebGL only) */
  uniforms?: Record<string, any>;
};

export const DEFAULT_RENDER_PIPELINE_PROPS: Required<RenderPipelineProps> = {
  ...DEFAULT_RESOURCE_PROPS,

  vs: undefined,
  vsEntryPoint: undefined,
  vsConstants: undefined,

  fs: undefined,
  fsEntryPoint: undefined,
  fsConstants: undefined,

  layout: undefined, // {attributes: [], bindings: []},

  topology: 'triangle-list',
  // targets:

  parameters: {},
  bufferMap: [],

  vertexCount: 0,
  instanceCount: 0,

  indices: undefined,
  attributes: {},
  bindings: {},
  uniforms: {}
};

/**
 * A compiled and linked shader program
 */
export default abstract class RenderPipeline extends Resource<RenderPipelineProps> {
  get [Symbol.toStringTag](): string { return 'RenderPipeline'; }

  hash: string;

  constructor(device: Device, props: RenderPipelineProps) {
    super(device, props, DEFAULT_RENDER_PIPELINE_PROPS);
  }

  /** Set attributes (stored on pipeline and set before each call) */
  abstract setIndexBuffer(indices: Buffer): void;
  /** Set attributes (stored on pipeline and set before each call) */
  abstract setAttributes(attributes: Record<string, Buffer>): void;
  /** Set bindings (stored on pipeline and set before each call) */
  abstract setBindings(bindings: Record<string, Binding>): void;
  /** Uniforms (only supported on WebGL devices. Reset before each call to enable pipeline sharing) */
  abstract setUniforms(bindings: Record<string, any>): void;

  /** Draw call */ 
  abstract draw(options: {
    renderPass?: RenderPass;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
  }): void;

  /** Private "export" for Model class */
  static _DEFAULT_PROPS = DEFAULT_RENDER_PIPELINE_PROPS;
}
