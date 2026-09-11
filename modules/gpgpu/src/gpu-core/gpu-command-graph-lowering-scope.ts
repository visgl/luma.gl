// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from './gpu-command-graph';
import type {GPUCommandGraphAutotuner} from './gpu-command-graph-autotuner';

export type GPUCommandGraphComputeLowering<Parameters = void> = (
  node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>
) => Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>;

/**
 * GPUCommandGraph used by backend compilers that need to decorate compute nodes during lowering.
 *
 * Unlike the earlier compiler prototype, this never replaces graph methods at runtime. The
 * lowering stack is ordinary instance state and `addComputePass()` is overridden once.
 */
export class GPUCommandLoweringGraph<Parameters = void> extends GPUCommandGraph<Parameters> {
  private readonly computeLowerings: GPUCommandGraphComputeLowering<Parameters>[] = [];

  constructor(
    device: Device,
    props: {id?: string; autotuner?: GPUCommandGraphAutotuner} = {}
  ) {
    super(device, props);
  }

  override addComputePass(
    node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>
  ): void {
    let lowered = node;
    for (const lowering of this.computeLowerings) lowered = lowering(lowered);
    super.addComputePass(lowered);
  }

  /** Applies one or more compiler-owned node transforms for the duration of `callback`. */
  withComputeLowering<Result>(
    lowering: GPUCommandGraphComputeLowering<Parameters>,
    callback: () => Result
  ): Result {
    this.computeLowerings.push(lowering);
    try {
      return callback();
    } finally {
      this.computeLowerings.pop();
    }
  }
}
