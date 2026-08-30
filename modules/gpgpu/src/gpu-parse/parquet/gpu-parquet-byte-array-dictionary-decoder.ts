// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUByteRangeGather,
  GPUCommandGraph,
  GPUScan,
  GPUUint32Gather,
  createTransientView,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

export type GPUParquetByteArrayDictionaryDecoderProps = {
  id?: string;
  dictionary: GraphDataView<'uint32'>;
  dictionaryLengths: GraphDataView<'uint32'>;
  dictionaryOffsets: GraphDataView<'uint32'>;
  indices: GraphDataView<'uint32'>;
  outputLengths: GraphDataView<'uint32'>;
  outputOffsets: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  dictionaryByteLength: number;
  outputByteCapacity: number;
};

/** Composes generic gathers and a scan for variable-width dictionary values. */
export class GPUParquetByteArrayDictionaryDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetByteArrayDictionaryDecoderProps>;

  constructor(props: GPUParquetByteArrayDictionaryDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-byte-array-dictionary';
    this.props = Object.freeze({...props, id: this.id});
    if (
      props.outputLengths.length < props.indices.length ||
      props.outputOffsets.length < props.indices.length
    ) {
      throw new Error(`${this.id} output metadata must contain at least indices.length rows`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const sourceOffsets = createTransientView(
      graph,
      `${this.id}-source-offsets`,
      'uint32',
      this.props.indices.length
    );
    new GPUUint32Gather({
      id: `${this.id}-lengths`,
      source: this.props.dictionaryLengths,
      indices: this.props.indices,
      output: this.props.outputLengths
    }).addToGraph(graph);
    new GPUUint32Gather({
      id: `${this.id}-source-offsets`,
      source: this.props.dictionaryOffsets,
      indices: this.props.indices,
      output: sourceOffsets
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-output-offsets`,
      input: this.props.outputLengths,
      output: this.props.outputOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    new GPUByteRangeGather({
      id: `${this.id}-bytes`,
      source: this.props.dictionary,
      sourceOffsets,
      lengths: this.props.outputLengths,
      outputOffsets: this.props.outputOffsets,
      output: this.props.output,
      sourceByteLength: this.props.dictionaryByteLength,
      outputByteCapacity: this.props.outputByteCapacity
    }).addToGraph(graph);
  }
}
