// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraph,
  GPUScanUint64,
  createTransientView,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUParquetDeltaBinaryPackedInt64Unpacker} from './gpu-parquet-delta-binary-packed-int64-unpacker';

export type GPUParquetDeltaBinaryPackedInt64DecoderProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  miniBlockDescriptors: GraphDataView<'uint32'>;
  outputLow: GraphDataView<'uint32'>;
  outputHigh: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  descriptorCount: number;
  firstValueLow: number;
  firstValueHigh: number;
};

/** Composes INT64 delta unpacking with a split-word inclusive scan. */
export class GPUParquetDeltaBinaryPackedInt64Decoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetDeltaBinaryPackedInt64DecoderProps>;

  constructor(props: GPUParquetDeltaBinaryPackedInt64DecoderProps) {
    this.id = props.id ?? 'gpu-parquet-delta-binary-packed-int64';
    this.props = Object.freeze({...props, id: this.id});
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    const deltaLow = createTransientView(graph, `${this.id}-delta-low`, 'uint32', props.valueCount);
    const deltaHigh = createTransientView(
      graph,
      `${this.id}-delta-high`,
      'uint32',
      props.valueCount
    );
    new GPUParquetDeltaBinaryPackedInt64Unpacker({
      ...props,
      id: `${this.id}-unpack`,
      outputDeltaLow: deltaLow,
      outputDeltaHigh: deltaHigh
    }).addToGraph(graph);
    new GPUScanUint64({
      id: `${this.id}-scan`,
      inputLow: deltaLow,
      inputHigh: deltaHigh,
      outputLow: props.outputLow,
      outputHigh: props.outputHigh
    }).addToGraph(graph);
  }
}
