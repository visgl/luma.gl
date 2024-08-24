// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4, TypedArray} from '@math.gl/types';
import type {Device} from '../device';
import type {RenderPassParameters} from '../types/parameters';
// import {Binding} from '../types/shader-layout';
import {Resource, ResourceProps} from './resource';
import {Framebuffer} from './framebuffer';
import {QuerySet} from './query-set';

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
  clearColor?: NumberArray4 | TypedArray | boolean;
  /** Experimental: Clear color values for multiple color attachments. Must specify typed arrays */
  clearColors?: (TypedArray | false)[];
  /** Clear value for depth attachment (true === `1`), or false to preserve the previous value */
  clearDepth?: number | boolean;
  /** Clear value for stencil attachment (true === `0`), or false to preserve the previous value */
  clearStencil?: number | boolean;

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
  /** Default properties for RenderPass */
  static override defaultProps: Required<RenderPassProps> = {
    ...Resource.defaultProps,
    framebuffer: null,
    parameters: undefined!,
    clearColor: false,
    clearColors: undefined!,
    clearDepth: false,
    clearStencil: false,
    depthReadOnly: false,
    stencilReadOnly: false,
    discard: false,

    occlusionQuerySet: undefined!,
    timestampQuerySet: undefined!,
    beginTimestampIndex: undefined!,
    endTimestampIndex: undefined!
  };

  override get [Symbol.toStringTag](): string {
    return 'RenderPass';
  }

  constructor(device: Device, props: RenderPassProps) {
    props = RenderPass.normalizeProps(device, props);
    super(device, props, RenderPass.defaultProps);
  }

  /** Call when rendering is done in this pass. */
  abstract end(): void;

  /** A few parameters can be changed at any time (viewport, scissorRect, blendColor, stencilReference) */
  abstract setParameters(parameters: RenderPassParameters): void;

  // executeBundles(bundles: Iterable<GPURenderBundle>): void;

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
    // Intended to override e.g. set default clear values to true
    const overrideProps = device.props._resourceDefaults?.renderPass;
    const newProps = {...overrideProps, ...props};
    return newProps;
  }
}

// TODO - Can we align WebGL implementation with WebGPU API?
// In WebGPU the following methods are on the renderpass instead of the renderpipeline
// luma.gl keeps them on the pipeline for now, but that has some issues.

// abstract setPipeline(pipeline: RenderPipeline): void {}
// abstract setIndexBuffer()
// abstract setVertexBuffer(slot: number, buffer: Buffer, offset: number): void;
// abstract setBindings(bindings: Record<string, Binding>): void;
// abstract setParameters(parameters: RenderPassParameters);
// abstract draw(options: {
// abstract drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
// abstract drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
