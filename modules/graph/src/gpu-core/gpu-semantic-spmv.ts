// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperationContract} from './gpu-operation-contract';
import type {GPUOperation, GPUOperationMetadata} from './gpu-operation';
import type {GPUGraphVector} from './gpu-graph-value';
import type {GPUSpMVRowStatistics, GPUSpMVStrategyId} from './gpu-spmv-strategy';

/** Backend-independent CSR sparse matrix resource assembled from logical program vectors. */
export class GPUGraphCSRMatrix {
  readonly id: string;
  readonly rows: number;
  readonly columns: number;
  readonly rowOffsets: GPUGraphVector<'uint32'>;
  readonly columnIndices: GPUGraphVector<'uint32'>;
  readonly values: GPUGraphVector<'float32'>;
  readonly statistics?: GPUSpMVRowStatistics;
  constructor(props: {
    id: string;
    rows: number;
    columns: number;
    rowOffsets: GPUGraphVector<'uint32'>;
    columnIndices: GPUGraphVector<'uint32'>;
    values: GPUGraphVector<'float32'>;
    statistics?: GPUSpMVRowStatistics;
  }) {
    this.id = props.id;
    this.rows = props.rows;
    this.columns = props.columns;
    this.rowOffsets = props.rowOffsets;
    this.columnIndices = props.columnIndices;
    this.values = props.values;
    this.statistics = props.statistics;
    if (props.rowOffsets.length !== props.rows + 1)
      throw new Error(`${props.id} rowOffsets length must equal rows + 1`);
    if (props.columnIndices.length !== props.values.length)
      throw new Error(`${props.id} CSR index/value lengths must match`);
  }
}

/** Semantic `output = matrix * vector`. Strategy selection belongs to the backend compiler. */
export class GPUGraphSpMV implements GPUOperation {
  get contract(): GPUOperationContract {
    const {matrix, vector, output} = this.props;
    return {
      values: [
        ...[matrix.rowOffsets, matrix.columnIndices, matrix.values, vector].map(value => ({
          value,
          access: 'read' as const
        })),
        {value: output, access: 'write', shape: {length: matrix.rows}}
      ]
    };
  }
  readonly type = 'spmv';
  readonly id: string;
  readonly metadata: GPUOperationMetadata;
  constructor(
    readonly props: {
      id?: string;
      matrix: GPUGraphCSRMatrix;
      vector: GPUGraphVector<'float32'>;
      output: GPUGraphVector<'float32'>;
      /** Optional benchmark/debug hint, not portable semantics. */
      strategy?: GPUSpMVStrategyId;
    }
  ) {
    this.id = props.id ?? 'gpu-spmv';
    if (props.vector.length !== props.matrix.columns)
      throw new Error(`${this.id} vector length must equal matrix columns`);
    if (props.output.length !== props.matrix.rows)
      throw new Error(`${this.id} output length must equal matrix rows`);
    this.metadata = Object.freeze({
      workload: Object.freeze({
        rows: props.matrix.rows,
        columns: props.matrix.columns,
        ...(props.matrix.values.length === undefined ? {} : {nonZeros: props.matrix.values.length})
      })
    });
  }
}
