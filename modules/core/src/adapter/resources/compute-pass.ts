import {Resource, ResourceProps} from './resource';
import {ComputePipeline} from './compute-pipeline';
import {Buffer} from './buffer';
import type {Device} from '../device';

export type ComputePassProps = ResourceProps & {};

export abstract class ComputePass extends Resource<ComputePassProps> {
  static override defaultProps: Required<ComputePassProps> = {
    ...Resource.defaultProps
  };

  override get [Symbol.toStringTag](): string {
    return 'ComputePass';
  }

  constructor(device: Device, props: ComputePassProps) {
    super(device, props, Resource.defaultProps);
  }

  abstract override destroy(): void;

  abstract end(): void;

  abstract setPipeline(pipeline: ComputePipeline): void;

  /** Sets an array of bindings (uniform buffers, samplers, textures, ...) */
  // abstract setBindings(bindings: Binding[]): void;

  /**
   * Dispatch work to be performed with the current ComputePipeline.
   * @param x X dimension of the grid of workgroups to dispatch.
   * @param y Y dimension of the grid of workgroups to dispatch.
   * @param z Z dimension of the grid of workgroups to dispatch.
   */
  abstract dispatch(x: number, y?: number, z?: number): void;

  /**
   * Dispatch work to be performed with the current ComputePipeline.
   * @param indirectBuffer buffer must be a tightly packed block of three 32-bit unsigned integer values (12 bytes total), given in the same order as the arguments for dispatch()
   * @param indirectOffset
   */
  abstract dispatchIndirect(indirectBuffer: Buffer, indirectOffset?: number): void;

  abstract pushDebugGroup(groupLabel: string): void;
  abstract popDebugGroup(): void;
  abstract insertDebugMarker(markerLabel: string): void;

  // writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
  // beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;
  // endPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;
}
