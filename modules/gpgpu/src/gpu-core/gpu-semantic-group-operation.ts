// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperation, GPUOperationMetadata} from './gpu-operation';
import type {GPUProgramVector} from './gpu-program-value';

/** Semantic dense uint32 group count over a source-aligned uint32 selection mask. */
export class GroupCount implements GPUOperation {
  readonly type = 'group-count';
  readonly id: string;
  readonly metadata: GPUOperationMetadata;

  constructor(
    readonly props: {
      id?: string;
      keys: GPUProgramVector<'uint32'>;
      mask: GPUProgramVector<'uint32'>;
      output: GPUProgramVector<'uint32'>;
    }
  ) {
    this.id = props.id ?? 'group-count';
    if (props.keys.length !== props.mask.length) {
      throw new Error(`${this.id} keys and mask lengths must match`);
    }
    if (props.output.length <= 0) {
      throw new Error(`${this.id} requires at least one dense output group`);
    }
    this.metadata = Object.freeze({
      inputs: Object.freeze([
        {name: props.keys.id, kind: 'vector', format: 'uint32', shape: [props.keys.length]},
        {name: props.mask.id, kind: 'mask', format: 'uint32', shape: [props.mask.length]}
      ]),
      outputs: Object.freeze([
        {name: props.output.id, kind: 'vector', format: 'uint32', shape: [props.output.length]}
      ]),
      workload: Object.freeze({elements: props.keys.length, groups: props.output.length})
    });
  }
}

/** @deprecated Prefer GroupCount. */
export {GroupCount as GPUProgramGroupCount};
