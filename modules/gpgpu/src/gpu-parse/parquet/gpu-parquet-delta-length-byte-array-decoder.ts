// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, GPUScan, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUParquetDeltaBinaryPackedDecoder} from './gpu-parquet-delta-binary-packed-decoder';

export type GPUParquetDeltaLengthByteArrayDecoderProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  miniBlockDescriptors: GraphDataView<'uint32'>;
  lengths: GraphDataView<'uint32'>;
  offsets: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  descriptorCount: number;
  firstValue: number;
};

/** Composes delta length decoding with an exclusive scan into byte-array offsets. */
export class GPUParquetDeltaLengthByteArrayDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetDeltaLengthByteArrayDecoderProps>;

  constructor(props: GPUParquetDeltaLengthByteArrayDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-delta-length-byte-array';
    this.props = Object.freeze({...props, id: this.id});
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    new GPUParquetDeltaBinaryPackedDecoder({
      id: `${this.id}-lengths`,
      input: this.props.input,
      miniBlockDescriptors: this.props.miniBlockDescriptors,
      output: this.props.lengths,
      encodedByteLength: this.props.encodedByteLength,
      valueCount: this.props.valueCount,
      descriptorCount: this.props.descriptorCount,
      firstValue: this.props.firstValue
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-offsets`,
      input: this.props.lengths,
      output: this.props.offsets,
      mode: 'exclusive'
    }).addToGraph(graph);
  }
}
