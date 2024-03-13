// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Resource, ResourceProps} from './resource';
import {ComputePipeline} from './compute-pipeline';
import type {Device} from '../device';
import {Buffer} from './buffer';
import {QuerySet} from './query-set';

export type ComputePassProps = ResourceProps & {
  /** QuerySet to write beging/end timestamps to */
  timestampQuerySet?: QuerySet;
  /** QuerySet index to write begin timestamp to. No timestamp is written if not provided. */
  beginTimestampIndex?: number;
  /** QuerySet index to write end timestamp to. No timestamp is written if not provided. */
  endTimestampIndex?: number;
};

export abstract class ComputePass extends Resource<ComputePassProps> {
  static override defaultProps: Required<ComputePassProps> = {
    ...Resource.defaultProps,
    timestampQuerySet: undefined!,
    beginTimestampIndex: undefined!,
    endTimestampIndex: undefined!
  };

  override get [Symbol.toStringTag](): string {
    return 'ComputePass';
  }

  constructor(device: Device, props: ComputePassProps) {
    super(device, props, ComputePass.defaultProps);
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

  /** Begins a labeled debug group containing subsequent commands */
  abstract pushDebugGroup(groupLabel: string): void;
  /** Ends the labeled debug group most recently started by pushDebugGroup() */
  abstract popDebugGroup(): void;
  /** Marks a point in a stream of commands with a label */
  abstract insertDebugMarker(markerLabel: string): void;
}
