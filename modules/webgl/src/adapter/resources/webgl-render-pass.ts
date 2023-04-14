import {RenderPass, RenderPassProps} from '@luma.gl/api';
import WebGLDevice from '../webgl-device';

export default class WEBGLRenderPass extends RenderPass {
  readonly device: WebGLDevice;

  constructor(device: WebGLDevice, props: RenderPassProps) {
    super(device, props);
    this.device = device;
  }

  end(): void {}

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup(): void {}
  insertDebugMarker(markerLabel: string): void {}

  // writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;

  // beginOcclusionQuery(queryIndex: number): void;
  // endOcclusionQuery(): void;

  // executeBundles(bundles: Iterable<GPURenderBundle>): void;
}
