// luma.gl, MIT license
import type {Device} from '../device';
import type {UniformValue} from '../types/types';
import type {PrimitiveTopology, RenderPipelineParameters} from '../types/parameters';
import type {ShaderLayout, Binding} from '../types/shader-layout';
import type {BufferLayout} from '../types/buffer-layout';
// import {normalizeAttributeMap} from '../helpers/attribute-bindings';
import {Resource, ResourceProps} from './resource';
import type {Shader} from './shader';
import type {RenderPass} from './render-pass';
import {VertexArray} from './vertex-array';
import {TransformFeedback} from './transform-feedback';

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
  bufferLayout?: BufferLayout[]; // Record<string, Omit<BufferLayout, 'name'>

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

    bindings: {},
    uniforms: {}
  };

  override get [Symbol.toStringTag](): string {
    return 'RenderPipeline';
  }

  hash: string = '';
  abstract readonly vs: Shader;
  abstract readonly fs: Shader | null;
  /** The merged layout */
  shaderLayout: ShaderLayout;
  /** Buffer map describing buffer interleaving etc */
  readonly bufferLayout: BufferLayout[];
  /** The linking status of the pipeline. 'pending' if linking is asynchronous, and on production */
  linkStatus: 'pending' | 'success' | 'error' = 'pending';

  constructor(device: Device, props: RenderPipelineProps) {
    super(device, props, RenderPipeline.defaultProps);
    this.shaderLayout = this.props.shaderLayout;
    this.bufferLayout = this.props.bufferLayout || [];
  }

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
    /** vertex attributes */
    vertexArray: VertexArray;
    /** Number of "rows" in index buffer */
    indexCount?: number;
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
    /** Transform feedback. WebGL only. */
    transformFeedback?: TransformFeedback;
  }): void;
}
