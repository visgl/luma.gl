// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperation} from './gpu-operation';
import type {GPUOperationContract} from './gpu-operation-contract';
import type {GPUGraphVectorDescriptor, GPUGraphVectorFormat} from './gpu-graph-value';

/** Packed numeric rows supported by portable graph operations. */
export type GPUCPUArray = Float32Array | Int32Array | Uint32Array;
export type GPUCPUVector = {
  readonly format: GPUGraphVectorFormat;
  readonly length: number;
  readonly chunks: readonly {readonly values: GPUCPUArray; readonly length: number}[];
  /** Explicitly combine the source chunks into a new packed array. */
  pack(): GPUCPUArray;
};
export type GPUCPUResult = GPUCPUArray | {chunks: readonly {values: GPUCPUArray}[]};
export type GPUCPUOperationProps = {
  id: string;
  inputs: Readonly<Record<string, string>>;
  outputs: Readonly<Record<string, GPUGraphVectorDescriptor>>;
  /** Input arrays are borrowed read-only snapshots. Do not mutate returned arrays until run settles. */
  execute(context: {
    inputs: Readonly<Record<string, GPUCPUVector | number>>;
  }): Record<string, GPUCPUResult> | Promise<Record<string, GPUCPUResult>>;
};

/** Shared CPU operation intent. Executed by reusable, unscoped GPUGraph and GPUSimpleGraph. */
export class GPUCPUOperation implements GPUOperation {
  readonly type = 'cpu';
  readonly id: string;
  readonly inputs: GPUCPUOperationProps['inputs'];
  readonly outputs: GPUCPUOperationProps['outputs'];
  readonly execute: GPUCPUOperationProps['execute'];

  constructor(props: GPUCPUOperationProps) {
    this.id = props.id;
    this.inputs = Object.freeze({...props.inputs});
    this.outputs = Object.freeze(
      Object.fromEntries(
        Object.entries(props.outputs).map(([name, descriptor]) => [
          name,
          Object.freeze({
            ...descriptor,
            ...(descriptor.chunkLengths
              ? {chunkLengths: Object.freeze([...descriptor.chunkLengths])}
              : {})
          })
        ])
      )
    );
    this.execute = props.execute;
  }

  get contract(): GPUOperationContract {
    return {
      outputs: this.outputs,
      values: [
        ...Object.values(this.inputs).map(value => ({value, access: 'read' as const})),
        ...Object.keys(this.outputs).map(value => ({value, access: 'write' as const}))
      ]
    };
  }
}
