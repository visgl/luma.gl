// luma.gl, MIT license
import type {Device} from '../device'
import type { RenderPassParameters } from '../types/parameters';
// import {Binding} from '../types/shader-layout';
import {Resource, ResourceProps} from './resource';
// import {Buffer} from './buffer';
// import {RenderPipeline} from './render-pipeline';
// import {CommandEncoder} from './command-encoder';
import {Framebuffer} from './framebuffer';
import {NumericArray} from '../..';

/**
 * Properties for a RenderPass instance is a required parameter to all draw calls.
 */
export type RenderPassProps = ResourceProps & {
  /** Framebuffer specifies which textures to render into. Default gets framebuffer from canvas context. */
  framebuffer?: Framebuffer | null;
  /** Control viewport, scissor rect, blend constant and stencil ref */
  parameters?: RenderPassParameters;
  /** Clear value for color attachment, or `load` to preserve the previous value */
  clearColor?: NumericArray | false;
  /** Clear value for depth attachment, or `load` to preserve the previous value */
  clearDepth?: number | false;
  /** Clear value for stencil attachment, or `load` to preserve the previous value */
  clearStencil?: number | false;
  /** Indicates that the depth component is read only. */
  depthReadOnly?: boolean;
  /** Indicates that the stencil component is read only. */
  stencilReadOnly?: boolean;
  /** Whether to disable / discard the output of the rasterizer */
  discard?: boolean; 
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
    parameters: undefined,
    clearColor: [0, 0, 0, 0],
    clearDepth: 1,
    clearStencil: 0,
    depthReadOnly: false,
    stencilReadOnly: false,
    discard: false
  };

  override get [Symbol.toStringTag](): string {
    return 'RenderPass';
  }

  constructor(device: Device, props: RenderPassProps) {
    super(device, props, RenderPass.defaultProps);
  }

  /** Call when rendering is done in this pass. */
  abstract end(): void;

  /** 
   * A small set of parameters can be changed between every draw call 
   * (viewport, scissorRect, blendColor, stencilReference) 
   */
  abstract setParameters(parameters: RenderPassParameters): void;

  abstract pushDebugGroup(groupLabel: string): void;
  abstract popDebugGroup(): void;
  abstract insertDebugMarker(markerLabel: string): void;

  // writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;

  // beginOcclusionQuery(queryIndex: number): void;
  // endOcclusionQuery(): void;

  // executeBundles(bundles: Iterable<GPURenderBundle>): void;

  // In WebGPU the following methods are on the renderpass.
  // luma.gl keeps them on the pipeline for now

  /*
  setPipeline(pipeline: RenderPipeline): void {}

  setIndexBuffer(
    buffer: Buffer,
    indexFormat: 'uint16' | 'uint32',
    offset?: number,
    size?: number
  ): void {}

  abstract setVertexBuffer(slot: number, buffer: Buffer, offset: number): void;

  abstract setBindings(bindings: Record<string, Binding>): void;

  abstract setParameters(parameters: RenderPassParameters);

  draw(options: {
    vertexCount?: number; // Either vertexCount or indexCount must be provided
    indexCount?: number;  // Activates indexed drawing (call setIndexBuffer())
    instanceCount?: number; //
    firstVertex?: number;
    firstIndex?: number; // requires device.features.has('indirect-first-instance')?
    firstInstance?: number;
    baseVertex?: number;
  }): void {}

  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  */
}
