// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUByteRangeGather, GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';

export type GPUParquetPlainByteArrayDecoderProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  sourceOffsets: GraphDataView<'uint32'>;
  valueLengths: GraphDataView<'uint32'>;
  valueOffsets: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  encodedByteLength: number;
  outputByteLength: number;
};

/** Adapts a PLAIN BYTE_ARRAY plan to the generic packed byte-range gather. */
export class GPUParquetPlainByteArrayDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetPlainByteArrayDecoderProps>;

  constructor(props: GPUParquetPlainByteArrayDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-plain-byte-array';
    this.props = Object.freeze({...props, id: this.id});
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    new GPUByteRangeGather({
      id: this.id,
      source: this.props.input,
      sourceOffsets: this.props.sourceOffsets,
      lengths: this.props.valueLengths,
      outputOffsets: this.props.valueOffsets,
      output: this.props.output,
      sourceByteLength: this.props.encodedByteLength,
      outputByteCapacity: this.props.outputByteLength
    }).addToGraph(graph);
  }
}
