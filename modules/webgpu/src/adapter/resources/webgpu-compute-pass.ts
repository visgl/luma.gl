import {ComputePass, ComputePassProps, ComputePipeline, Buffer, Binding} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
// import {WebGPUCommandEncoder} from './webgpu-command-encoder';
import {WebGPUComputePipeline} from './webgpu-compute-pipeline';

export class WebGPUComputePass extends ComputePass {
  readonly device: WebGPUDevice;
  readonly handle: GPUComputePassEncoder;
  _bindGroupLayout: GPUBindGroupLayout | null = null;

  constructor(device: WebGPUDevice, props: ComputePassProps) {
    super(device, props);
    this.device = device;

    this.handle = this.props.handle || device.commandEncoder?.beginComputePass({
      label: this.props.id,
      // timestampWrites?: GPUComputePassTimestampWrites;
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
    this._bindGroupLayout = wgpuPipeline._getBindGroupLayout();
  }

  /** Sets an array of bindings (uniform buffers, samplers, textures, ...) */
  setBindings(bindings: Binding[]): void {
    throw new Error('fix me');
    // const bindGroup = getBindGroup(this.device.handle, this._bindGroupLayout, this.props.bindings);
    // this.handle.setBindGroup(0, bindGroup);
  }

  /**
   * Dispatch work to be performed with the current ComputePipeline.
   * @param x X dimension of the grid of workgroups to dispatch.
   * @param y Y dimension of the grid of workgroups to dispatch.
   * @param z Z dimension of the grid of workgroups to dispatch.
   */
  dispatch(x: number, y?: number, z?: number): void {
    this.handle.dispatchWorkgroups(x, y, z);
  }

  /**
   * Dispatch work to be performed with the current ComputePipeline.
   * @param indirectBuffer buffer must be a tightly packed block of three 32-bit unsigned integer values (12 bytes total), given in the same order as the arguments for dispatch()
   * @param indirectOffset
   */
  dispatchIndirect(indirectBuffer: Buffer, indirectOffset: number = 0): void {
    const webgpuBuffer = indirectBuffer as WebGPUBuffer;
    this.handle.dispatchWorkgroupsIndirect(webgpuBuffer.handle, indirectOffset);
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

  // writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
  // beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;
  // endPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;
}
