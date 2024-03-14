// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ComputePass, ComputePassProps, ComputePipeline, Buffer, Binding} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
import {WebGPUComputePipeline} from './webgpu-compute-pipeline';
import {WebGPUQuerySet} from './webgpu-query-set';

export class WebGPUComputePass extends ComputePass {
  readonly device: WebGPUDevice;
  readonly handle: GPUComputePassEncoder;

  _webgpuPipeline: WebGPUComputePipeline | null = null;

  constructor(device: WebGPUDevice, props: ComputePassProps) {
    super(device, props);
    this.device = device;

    // Set up queries
    let timestampWrites: GPUComputePassTimestampWrites | undefined;
    if (device.features.has('timestamp-query')) {
      const webgpuQuerySet = props.timestampQuerySet as WebGPUQuerySet;
      if (webgpuQuerySet) {
        timestampWrites = {
          querySet: webgpuQuerySet.handle,
          beginningOfPassWriteIndex: props.beginTimestampIndex,
          endOfPassWriteIndex: props.endTimestampIndex
        };
      }
    }

    this.handle =
      this.props.handle ||
      device.commandEncoder?.beginComputePass({
        label: this.props.id,
        timestampWrites
      });
  }

  /** @note no WebGPU destroy method, just gc */
  override destroy(): void {}

  end(): void {
    this.handle.end();
  }

  setPipeline(pipeline: ComputePipeline): void {
    const wgpuPipeline = pipeline as WebGPUComputePipeline;
    this.handle.setPipeline(wgpuPipeline.handle);
    this._webgpuPipeline = wgpuPipeline;
    this.setBindings([]);
  }

  /**
   * Sets an array of bindings (uniform buffers, samplers, textures, ...)
   * TODO - still some API confusion - does this method go here or on the pipeline?
   */
  setBindings(bindings: Binding[]): void {
    // @ts-expect-error
    const bindGroup = this._webgpuPipeline._getBindGroup();
    this.handle.setBindGroup(0, bindGroup);
  }

  /**
   * Dispatch work to be performed with the current ComputePipeline.
   * @param x X dimension of the grid of work groups to dispatch.
   * @param y Y dimension of the grid of work groups to dispatch.
   * @param z Z dimension of the grid of work groups to dispatch.
   */
  dispatch(x: number, y?: number, z?: number): void {
    this.handle.dispatchWorkgroups(x, y, z);
  }

  /**
   * Dispatch work to be performed with the current ComputePipeline.
   *
   * Buffer must be a tightly packed block of three 32-bit unsigned integer values (12 bytes total), given in the same order as the arguments for dispatch()
   * @param indirectBuffer
   * @param indirectOffset offset in buffer to the beginning of the dispatch data.
   */
  dispatchIndirect(indirectBuffer: Buffer, indirectByteOffset: number = 0): void {
    const webgpuBuffer = indirectBuffer as WebGPUBuffer;
    this.handle.dispatchWorkgroupsIndirect(webgpuBuffer.handle, indirectByteOffset);
  }

  pushDebugGroup(groupLabel: string): void {
    this.handle.pushDebugGroup(groupLabel);
  }

  popDebugGroup(): void {
    this.handle.popDebugGroup();
  }

  insertDebugMarker(markerLabel: string): void {
    this.handle.insertDebugMarker(markerLabel);
  }
}
