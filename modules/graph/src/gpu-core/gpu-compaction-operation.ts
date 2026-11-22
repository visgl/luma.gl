// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {gpuGraph} from './gpu-graph-value';
import type {GPUOperation} from './gpu-operation';
import type {GPUOperationContract} from './gpu-operation-contract';

export type GPUCompactionOperationProps = {
  id?: string;
  input: string;
  /** uint32 selection mask: zero rejects, nonzero accepts. */
  flags: string;
  output: string;
  /** Produced uint32 scalar. Only the first count rows of output are valid. */
  count: string;
};

/** Stable uint32 compaction with input-sized capacity and a separate GPU logical count. */
export class GPUCompactionOperation implements GPUOperation {
  readonly type = 'compaction';
  readonly id: string;
  readonly props: Readonly<GPUCompactionOperationProps>;
  constructor(props: GPUCompactionOperationProps) {
    this.id = props.id ?? `${props.output}-compaction`;
    this.props = Object.freeze({...props});
  }
  get contract(): GPUOperationContract {
    const {input, flags, output, count} = this.props;
    return {
      outputs: ({getValue}) => {
        for (const name of [input, flags]) {
          const value = getValue(name);
          // The existing compaction kernel accepts packed uint32 values and flags.
          assert(value.type === 'vector' && value.format === 'uint32');
        }
        assert(output !== count);
        return {[output]: gpuGraph.vector('uint32'), [count]: gpuGraph.scalar('uint32')};
      },
      values: [
        {value: input, access: 'read'},
        {value: flags, access: 'read'},
        {value: output, access: 'write', shape: {like: input}},
        {value: count, access: 'write'}
      ]
    };
  }
}
