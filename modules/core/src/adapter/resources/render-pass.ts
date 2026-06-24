// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4, TypedArray} from '@math.gl/types';
import type {Device} from '../device';
import type {RenderPassParameters} from '../types/parameters';
import type {PrimitiveTopology, RenderPipelineParameters} from '../types/parameters';
import type {Bindings, BindingsByGroup} from '../types/shader-layout';
import {Resource, ResourceProps} from './resource';
import {Framebuffer} from './framebuffer';
import {QuerySet} from './query-set';
import type {RenderBundle} from './render-bundle';
import type {RenderPipeline} from './render-pipeline';
import type {TransformFeedback} from './transform-feedback';
import type {VertexArray} from './vertex-array';

/** Draw arguments consumed by the active state on a {@link RenderPass}. */
export type RenderPassDrawOptions = {
  /** Use instanced rendering? WebGL compatibility only; WebGPU infers this from instanceCount. */
  isInstanced?: boolean;
  /** Number of vertices to draw. */
  vertexCount?: number;
  /** Number of indices to draw. */
  indexCount?: number;
  /** Number of instances to draw. */
  instanceCount?: number;
  /** First vertex to draw from. */
  firstVertex?: number;
  /** First index to draw from. */
  firstIndex?: number;
  /** First instance to draw from. */
  firstInstance?: number;
  /** Base vertex added to indexed draws. */
  baseVertex?: number;
  /** @deprecated WebGL-only compatibility override. Prefer fixed pipeline parameters. */
  parameters?: RenderPipelineParameters;
  /** @deprecated WebGL-only compatibility override. Prefer fixed pipeline topology. */
  topology?: PrimitiveTopology;
  /** @deprecated WebGL-only compatibility state. */
  transformFeedback?: TransformFeedback;
  /** @deprecated WebGL-only compatibility uniforms. Prefer buffer bindings. */
  uniforms?: Record<string, unknown>;
};

/** Internal options used by engine draw paths to preserve bind-group cache reuse. */
export type RenderPassBindingOptions = {
  /** @internal Stable keys for backend bind-group reuse. */
  _bindGroupCacheKeys?: Partial<Record<number, object>>;
};

/**
 * Properties for a RenderPass instance is a required parameter to all draw calls.
 */
export type RenderPassProps = ResourceProps & {
  /** Framebuffer specifies which textures to render into. Default gets framebuffer from canvas context. */
  framebuffer?: Framebuffer | null;
  /** Control viewport, scissor rect, blend constant and stencil ref */
  parameters?: RenderPassParameters;

  // TODO - API needs to be able to control multiple render targets

  /** Clear value for color attachment, or false to preserve the previous value */
  clearColor?: NumberArray4 | TypedArray | false;
  /** Experimental: Clear color values for multiple color attachments. Must specify typed arrays. props.clearColor will be ignored. */
  clearColors?: (TypedArray | false)[];
  /** Clear value for depth attachment (true === `1`), or false to preserve the previous value. Must be between 0.0 (near) and 1.0 (far), inclusive. */
  clearDepth?: number | false;
  /** Clear value for stencil attachment (true === `0`), or false to preserve the previous value. Converted to the type and number of LSBs as the number of bits in the stencil aspect */
  clearStencil?: number | false;

  /** Indicates that the depth component is read only. */
  depthReadOnly?: boolean;
  /** Indicates that the stencil component is read only. */
  stencilReadOnly?: boolean;

  /** Whether to disable / discard the output of the rasterizer */
  discard?: boolean;

  /** QuerySet to write begin/end timestamps to */
  occlusionQuerySet?: QuerySet;
  /** QuerySet to write begin/end timestamps to */
  timestampQuerySet?: QuerySet;
  /** QuerySet index to write begin timestamp to. No timestamp is written if not provided. */
  beginTimestampIndex?: number;
  /** QuerySet index to write end timestamp to. No timestamp is written if not provided. */
  endTimestampIndex?: number;
};

/**
 * A RenderPass instance is a required parameter to all draw calls.
 *
 * It holds a combination of
 * - render targets (specified via a framebuffer)
 * - clear colors, read/write, discard information for the framebuffer attachments
 * - a couple of mutable parameters ()
 */
export abstract class RenderPass extends Resource<RenderPassProps> {
  /** TODO - should be [0, 0, 0, 0], update once deck.gl tests run clean */
  static defaultClearColor: [number, number, number, number] = [0, 0, 0, 1];
  /** Depth 1.0 represents the far plance */
  static defaultClearDepth = 1;
  /** Clears all stencil bits */
  static defaultClearStencil = 0;

  override get [Symbol.toStringTag](): string {
    return 'RenderPass';
  }

  constructor(
    device: Device,
    props: RenderPassProps,
    defaultProps: Required<RenderPassProps> = RenderPass.defaultProps
  ) {
    props = RenderPass.normalizeProps(device, props);
    super(device, props, defaultProps);
  }

  /** Call when rendering is done in this pass. */
  abstract end(): void;

  /** A few parameters can be changed at any time (viewport, scissorRect, blendColor, stencilReference) */
  abstract setParameters(parameters: RenderPassParameters): void;

  /** Selects the pipeline used by subsequent binding and draw commands. */
  abstract setPipeline(pipeline: RenderPipeline): void;

  /**
   * Replaces the complete binding set used by subsequent draw commands.
   * A pipeline must be selected first so bindings can be resolved against its shader layout.
   */
  abstract setBindings(
    bindings: Bindings | BindingsByGroup,
    options?: RenderPassBindingOptions
  ): void;

  /** Selects the vertex array used by subsequent draw commands. */
  abstract setVertexArray(vertexArray: VertexArray): void;

  /** Issues a draw using the currently selected pipeline, bindings, and vertex array. */
  abstract draw(options: RenderPassDrawOptions): boolean;

  /**
   * Replays reusable draw commands recorded by one or more render bundle encoders.
   * @param bundles - Bundles whose attachment formats and sample count are compatible with this pass.
   * @throws On backends other than WebGPU.
   */
  abstract executeBundles(bundles: Iterable<RenderBundle>): void;

  /** Being an occlusion query. Value will be stored in the occlusionQuerySet at the index. Occlusion queries cannot be nested. */
  abstract beginOcclusionQuery(queryIndex: number): void;
  /** End an occlusion query. Stores result in the index specified in beginOcclusionQuery. */
  abstract endOcclusionQuery(): void;

  /** Begins a labeled debug group containing subsequent commands */
  abstract pushDebugGroup(groupLabel: string): void;
  /** Ends the labeled debug group most recently started by pushDebugGroup() */
  abstract popDebugGroup(): void;
  /** Marks a point in a stream of commands with a label */
  abstract insertDebugMarker(markerLabel: string): void;

  protected static normalizeProps(device: Device, props: RenderPassProps): RenderPassProps {
    return props;
  }

  /** Default properties for RenderPass */
  static override defaultProps: Required<RenderPassProps> = {
    ...Resource.defaultProps,
    framebuffer: null,
    parameters: undefined!,
    clearColor: RenderPass.defaultClearColor,
    clearColors: undefined!,
    clearDepth: RenderPass.defaultClearDepth,
    clearStencil: RenderPass.defaultClearStencil,
    depthReadOnly: false,
    stencilReadOnly: false,
    discard: false,

    occlusionQuerySet: undefined!,
    timestampQuerySet: undefined!,
    beginTimestampIndex: undefined!,
    endTimestampIndex: undefined!
  };
}
