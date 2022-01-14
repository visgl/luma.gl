// luma.gl, MIT license
import type Device from '../device';
import type {RenderPipelineParameters} from '../types/parameters';
import type {ShaderLayout, BufferMapping, Binding} from '../types/shader-layout';
// import {normalizeAttributeMap} from '../helpers/attribute-bindings';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import type {default as Buffer} from './buffer';
import type {default as Shader} from './shader';

export type RenderPipelineProps = ResourceProps & {
  // Shaders and shader layout

  /** Compiled vertex shader */
  vs?: Shader | string;
  /** Vertex shader entry point (defaults to 'main'). WGSL only */
  vsEntryPoint?: string; //
  /** Constants to apply to compiled vertex shader (WGSL only) */
  vsConstants?: Record<string, number>; // WGSL only
  /** Compiled fragment shader */
  fs?: Shader | string;
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
  /** Buffers for attributes */
  attributes?: Record<string, Buffer>;
  /** Buffers, Textures, Samplers for the shader bindings */
  bindings?: Record<string, Binding>;
};

export const DEFAULT_RENDER_PIPELINE_PROPS: Required<RenderPipelineProps> = {
  ...DEFAULT_RESOURCE_PROPS,

  vs: undefined,
  vsEntryPoint: undefined,
  vsConstants: undefined,
  fs: undefined,
  fsEntryPoint: undefined,
  fsConstants: undefined,
  layout: {attributes: [], bindings: []},

  topology: 'triangle-list',
  // targets:

  parameters: {},
  bufferMap: [],

  vertexCount: 0,
  instanceCount: 0,
  attributes: {},
  bindings: {},
};

/**
 * A compiled and linked shader program
 */
export default abstract class RenderPipeline extends Resource<RenderPipelineProps> {
  get [Symbol.toStringTag](): string { return 'RenderPipeline'; }

  constructor(device: Device, props: RenderPipelineProps) {
    super(device, normalizeProps(props), DEFAULT_RENDER_PIPELINE_PROPS);
  }

  // abstract setAttributes(attributes: Record<string, Buffer>): void;
  // abstract setBindings(bindings: Record<string, Binding>): void;

  // abstract draw();

  /** Private "export" for Model class */
  static _DEFAULT_PROPS = DEFAULT_RENDER_PIPELINE_PROPS;
}

function normalizeProps(props: RenderPipelineProps): RenderPipelineProps {
  return {...props};
  // return {...props, attributeMap: normalizeAttributeMap(props)};
}
