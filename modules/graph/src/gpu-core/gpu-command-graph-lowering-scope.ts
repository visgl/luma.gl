// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode, GPURenderCommandNode, GPUCopyCommandNode} from './gpu-command-node';

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph, type GPUCommandGraphComputeNode} from './gpu-command-graph';
import type {GPUCommandGraphAutotuner} from './gpu-command-graph-autotuner';

export type GPUCommandGraphComputeLowering<Parameters = void> = (
  node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>
) => Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>;

/**
 * GPUCommandGraph used by backend compilers that decorate compute nodes during lowering.
 * Lowering scopes are ordinary instance state; graph methods are never replaced at runtime.
 */
export class GPUCommandLoweringGraph<Parameters = void> extends GPUCommandGraph<Parameters> {
  private readonly computeLowerings: GPUCommandGraphComputeLowering<Parameters>[] = [];
  private loweringsSuspended = 0;
  private readonly otherLowerings: ((
    node: GPUCommandNode<Parameters>
  ) => GPUCommandNode<Parameters>)[] = [];
  override addRenderPass(node: Omit<GPURenderCommandNode<Parameters>, 'type'>): void {
    let lowered: GPUCommandNode<Parameters> = {
      ...node,
      type: 'render'
    };
    for (const lower of [...this.otherLowerings].reverse()) lowered = lower(lowered);
    super.addRenderPass(lowered as GPURenderCommandNode<Parameters>);
  }
  override addCopyPass(node: Omit<GPUCopyCommandNode<Parameters>, 'type'>): void {
    let lowered: GPUCommandNode<Parameters> = {...node, type: 'copy'};
    for (const lower of [...this.otherLowerings].reverse()) lowered = lower(lowered);
    super.addCopyPass(lowered as GPUCopyCommandNode<Parameters>);
  }
  withOtherLowering<Result>(
    lower: (node: GPUCommandNode<Parameters>) => GPUCommandNode<Parameters>,
    callback: () => Result
  ): Result {
    this.otherLowerings.push(lower);
    try {
      return callback();
    } finally {
      this.otherLowerings.pop();
    }
  }

  constructor(device: Device, props: {id?: string; autotuner?: GPUCommandGraphAutotuner} = {}) {
    super(device, props);
  }

  override addComputePass(node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>): void {
    let lowered = node;
    if (this.loweringsSuspended === 0) {
      // Inner scopes realize concrete execution details first; outer scopes can then inspect them.
      for (let index = this.computeLowerings.length - 1; index >= 0; index--) {
        lowered = this.computeLowerings[index](lowered);
      }
    }
    super.addComputePass(lowered);
  }

  /** Applies a compiler-owned node transform for the duration of `callback`. */
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

  /** Emits compiler-support nodes without recursively applying the surrounding semantic scopes. */
  withoutComputeLowering<Result>(callback: () => Result): Result {
    this.loweringsSuspended++;
    try {
      return callback();
    } finally {
      this.loweringsSuspended--;
    }
  }
}
