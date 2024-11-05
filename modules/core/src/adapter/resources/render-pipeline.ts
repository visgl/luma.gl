// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import type {UniformValue} from '../types/uniforms';
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
  /** Name of vertex shader stage main function (defaults to 'main'). WGSL only */
  vertexEntryPoint?: string; //
  /** Constant values to apply to compiled vertex shader. Do not require re-compilation. (WGSL only) */
  vsConstants?: Record<string, number>; // WGSL only
  /** Compiled fragment shader */
  fs?: Shader | null;
  /** Name of fragment shader stage main function (defaults to 'main'). WGSL only */
  fragmentEntryPoint?: string; // WGSL only
  /** Constant values to apply to compiled fragment shader. Do not require re-compilation. (WGSL only) */
  fsConstants?: Record<string, number>;

  /** Describes the attributes and bindings exposed by the pipeline shader(s). */
  shaderLayout?: ShaderLayout | null;
  /** Describes the buffers accepted by this pipeline and how they are mapped to shader attributes. */
  bufferLayout?: BufferLayout[]; // Record<string, Omit<BufferLayout, 'name'>

  /** Determines how vertices are read from the 'vertex' attributes */
  topology?: PrimitiveTopology;
  /** Parameters that are controlled by pipeline */
  parameters?: RenderPipelineParameters;

  // /** Use instanced rendering? */
  // isInstanced?: boolean;
  // /** Number of instances */
  // instanceCount?: number;
  // /** Number of vertices */
  // vertexCount?: number;

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
    vertexEntryPoint: 'vertexMain',
    vsConstants: {},

    fs: null,
    fragmentEntryPoint: 'fragmentMain',
    fsConstants: {},

    shaderLayout: null,
    bufferLayout: [],
    topology: 'triangle-list',
    parameters: {},

    // isInstanced: false,
    // instanceCount: 0,
    // vertexCount: 0,

    bindings: {},
    uniforms: {}
  };

  override get [Symbol.toStringTag](): string {
    return 'RenderPipeline';
  }

  abstract readonly vs: Shader;
  abstract readonly fs: Shader | null;

  /** The merged layout */
  shaderLayout: ShaderLayout;
  /** Buffer map describing buffer interleaving etc */
  readonly bufferLayout: BufferLayout[];
  /** The linking status of the pipeline. 'pending' if linking is asynchronous, and on production */
  linkStatus: 'pending' | 'success' | 'error' = 'pending';
  /** The hash of the pipeline */
  hash: string = '';

  constructor(device: Device, props: RenderPipelineProps) {
    super(device, props, RenderPipeline.defaultProps);
    this.shaderLayout = this.props.shaderLayout!;
    this.bufferLayout = this.props.bufferLayout || [];
  }

  /** Set bindings (stored on pipeline and set before each call) */
  abstract setBindings(
    bindings: Record<string, Binding>,
    options?: {disableWarnings?: boolean}
  ): void;

  /** Draw call. Returns false if the draw call was aborted (due to resources still initializing) */
  abstract draw(options: {
    /** Render pass to draw into (targeting screen or framebuffer) */
    renderPass?: RenderPass;
    /** Parameters to be set during draw call. Note that most parameters can only be overridden in WebGL. */
    parameters?: RenderPipelineParameters;
    /** Topology. Note can only be overridden in WebGL. */
    topology?: PrimitiveTopology;
    /** vertex attributes */
    vertexArray: VertexArray;
    /** Use instanced rendering? */
    isInstanced?: boolean;
    /** Number of "rows" in 'instance' buffers */
    instanceCount?: number;
    /** Number of "rows" in 'vertex' buffers */
    vertexCount?: number;
    /** Number of "rows" in index buffer */
    indexCount?: number;
    /** First vertex to draw from */
    firstVertex?: number;
    /** First index to draw from */
    firstIndex?: number;
    /** First instance to draw from */
    firstInstance?: number;
    baseVertex?: number;
    /** Transform feedback. WebGL only. */
    transformFeedback?: TransformFeedback;
  }): boolean;

  // DEPRECATED METHODS

  /**
   * Uniforms
   * @deprecated Use uniforms buffers
   * @note textures, samplers and uniform buffers should be set via `setBindings()`, these are not considered uniforms.
   * @note In WebGL uniforms have a performance penalty, they are reset before each call to enable pipeline sharing.
   */
  setUniformsWebGL(uniforms: Record<string, UniformValue>): void {
    throw new Error('Use uniform blocks');
  }
}
