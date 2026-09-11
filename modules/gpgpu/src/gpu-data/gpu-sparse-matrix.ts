// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUDataView} from './gpu-data';

export type GPUCOOMatrixProps = {
  rows: number;
  columns: number;
  rowIndices: GPUDataView<'uint32'>;
  columnIndices: GPUDataView<'uint32'>;
  values: GPUDataView<'float32'>;
};

export class GPUCOOMatrix {
  readonly rows: number;
  readonly columns: number;
  readonly rowIndices: GPUDataView<'uint32'>;
  readonly columnIndices: GPUDataView<'uint32'>;
  readonly values: GPUDataView<'float32'>;
  constructor(props: GPUCOOMatrixProps) {
    validateShape(props.rows, props.columns, 'GPUCOOMatrix');
    if (props.rowIndices.length !== props.columnIndices.length || props.rowIndices.length !== props.values.length) {
      throw new Error('GPUCOOMatrix rowIndices, columnIndices and values must have equal length');
    }
    this.rows = props.rows; this.columns = props.columns; this.rowIndices = props.rowIndices;
    this.columnIndices = props.columnIndices; this.values = props.values;
  }
  get nonZeroCount(): number { return this.values.length; }
}

export type GPUCSRMatrixProps = {
  rows: number;
  columns: number;
  rowOffsets: GPUDataView<'uint32'>;
  columnIndices: GPUDataView<'uint32'>;
  values: GPUDataView<'float32'>;
};

export class GPUCSRMatrix {
  readonly rows: number;
  readonly columns: number;
  readonly rowOffsets: GPUDataView<'uint32'>;
  readonly columnIndices: GPUDataView<'uint32'>;
  readonly values: GPUDataView<'float32'>;
  constructor(props: GPUCSRMatrixProps) {
    validateShape(props.rows, props.columns, 'GPUCSRMatrix');
    if (props.rowOffsets.length !== props.rows + 1) throw new Error('GPUCSRMatrix rowOffsets length must equal rows + 1');
    if (props.columnIndices.length !== props.values.length) throw new Error('GPUCSRMatrix columnIndices and values must have equal length');
    this.rows = props.rows; this.columns = props.columns; this.rowOffsets = props.rowOffsets;
    this.columnIndices = props.columnIndices; this.values = props.values;
  }
  get nonZeroCount(): number { return this.values.length; }
}

function validateShape(rows: number, columns: number, name: string): void {
  if (!Number.isInteger(rows) || rows < 0) throw new Error(`${name} rows must be a non-negative integer`);
  if (!Number.isInteger(columns) || columns < 0) throw new Error(`${name} columns must be a non-negative integer`);
}
