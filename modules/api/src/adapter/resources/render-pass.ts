// luma.gl, MIT license
import type Device from '../device'
import type { RenderPassParameters } from '../types/parameters';
// import {Binding} from '../types/shader-layout';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
// import Buffer from './buffer';
// import RenderPipeline from './render-pipeline';
// import CommandEncoder from './command-encoder';
import Framebuffer from './framebuffer';

export type RenderPassProps = ResourceProps & {
  framebuffer?: Framebuffer | null;
  parameters?: RenderPassParameters | null
};

const DEFAULT_RENDERPASS_PROPS: Required<RenderPassProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  framebuffer: null,
  parameters: null
}

export default abstract class RenderPass extends Resource<RenderPassProps> {
  override get [Symbol.toStringTag](): string {
    return 'RenderPass';
  }

  constructor(device: Device, props: RenderPassProps) {
    super(device, props, DEFAULT_RENDERPASS_PROPS);
  }

  abstract end(): void;

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
