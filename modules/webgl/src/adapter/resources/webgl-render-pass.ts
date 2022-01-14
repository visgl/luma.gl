import {RenderPass, RenderPassProps, RenderPipeline, Buffer, Binding, RenderPassParameters, cast} from '@luma.gl/api';
import WebGLDevice from '../webgl-device';
import WEBGLRenderPipeline from './webgl-render-pipeline';

export default abstract class WEBGLRenderPass extends RenderPass {
  readonly device: WebGLDevice;

  constructor(device: WebGLDevice, props: RenderPassProps) {
    super(device, props);
  }

  endPass(): void {}

  setPipeline(pipeline: RenderPipeline): void {
    const webglPipeline = cast<WEBGLRenderPipeline>(pipeline);
    this.device.gl.useProgram(webglPipeline.handle);
  }

  setIndexBuffer(
    buffer: Buffer,
    indexFormat: 'uint16' | 'uint32',
    offset?: number,
    size?: number
  ): void {}

  setVertexBuffer(slot: number, buffer: Buffer, offset: number): void {}

  setBindings(bindings: Record<string, Binding>): void {}

  setParameters(parameters: RenderPassParameters): void {}

  draw(options: {
    vertexCount?: number; // Either vertexCount or indexCount must be provided
    indexCount?: number;  // Activates indexed drawing (call setIndexBuffer())
    instanceCount?: number; //
    firstVertex?: number;
    firstIndex?: number; // requires device.features.has('indirect-first-instance')?
    firstInstance?: number;
    baseVertex?: number;
  }) {}

  // drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  // drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup(): void {}
  insertDebugMarker(markerLabel: string): void {}

  // writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;

  // beginOcclusionQuery(queryIndex: number): void;
  // endOcclusionQuery(): void;

  // executeBundles(bundles: Iterable<GPURenderBundle>): void;
}
