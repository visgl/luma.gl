// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode} from './gpu-command-node';
import type {GPUCommandGraph} from './gpu-command-graph';
import {GPUGather, getGatherCommandNodes, type GPUGatherProps} from './gpu-gather';
import {validatePackedUint32View} from './graph-data-view-utils';
import {getGraphVectorData} from './graph-vector-view-utils';

export type GPUUint32GatherProps = GPUGatherProps<'uint32'> & {
  invalidValue?: number;
};

/** Gathers packed uint32 rows through global indices. Out-of-range indices use invalidValue. */
export class GPUUint32Gather extends GPUGather<'uint32'> {
  readonly invalidValue: number;

  constructor(props: GPUUint32GatherProps) {
    super({...props, id: props.id ?? 'gpu-uint32-gather'});
    this.invalidValue = props.invalidValue ?? 0;
    for (const view of [this.source, this.output]) {
      for (const chunk of getGraphVectorData(view)) validatePackedUint32View(chunk, this.id);
    }
    if (
      !Number.isSafeInteger(this.invalidValue) ||
      this.invalidValue < 0 ||
      this.invalidValue > 0xffffffff
    ) {
      throw new Error(`${this.id} invalidValue must be a uint32`);
    }
  }

  override getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    return getGatherCommandNodes(graph, this, this.invalidValue, 'GPUUint32Gather');
  }
}
