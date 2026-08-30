// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraph,
  GPUScan,
  createTransientView,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUParquetDeltaBinaryPackedUnpacker} from './gpu-parquet-delta-binary-packed-unpacker';

export type GPUParquetDeltaBinaryPackedDecoderProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  miniBlockDescriptors: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  descriptorCount: number;
  firstValue: number;
};

/** Composes delta unpacking and an inclusive wrapping prefix scan for Parquet INT32 values. */
export class GPUParquetDeltaBinaryPackedDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetDeltaBinaryPackedDecoderProps>;

  constructor(props: GPUParquetDeltaBinaryPackedDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-delta-binary-packed';
    this.props = Object.freeze({...props, id: this.id});
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const deltas = createTransientView(graph, `${this.id}-deltas`, 'uint32', this.props.valueCount);
    new GPUParquetDeltaBinaryPackedUnpacker({
      id: `${this.id}-unpack`,
      input: this.props.input,
      miniBlockDescriptors: this.props.miniBlockDescriptors,
      outputDeltas: deltas,
      encodedByteLength: this.props.encodedByteLength,
      valueCount: this.props.valueCount,
      descriptorCount: this.props.descriptorCount,
      firstValue: this.props.firstValue
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-scan`,
      input: deltas,
      output: this.props.output,
      mode: 'inclusive'
    }).addToGraph(graph);
  }
}
