// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, createTransientView, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUParquetDictionaryDecoder} from './gpu-parquet-dictionary-decoder';
import {GPUParquetRleBitPackedDecoder} from './gpu-parquet-rle-bit-packed-decoder';

export type GPUParquetRleDictionaryDecoderProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  runDescriptors: GraphDataView<'uint32'>;
  dictionary: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  runCount: number;
  bitWidth: number;
  dictionaryValueCount: number;
  byteWidth: number;
};

/** Composes hybrid index expansion and fixed-width dictionary gather through transient storage. */
export class GPUParquetRleDictionaryDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetRleDictionaryDecoderProps>;

  constructor(props: GPUParquetRleDictionaryDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-rle-dictionary';
    this.props = Object.freeze({...props, id: this.id});
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const indices = createTransientView(
      graph,
      `${this.id}-indices`,
      'uint32',
      this.props.valueCount
    );
    new GPUParquetRleBitPackedDecoder({
      id: `${this.id}-indices`,
      input: this.props.input,
      runDescriptors: this.props.runDescriptors,
      output: indices,
      encodedByteLength: this.props.encodedByteLength,
      valueCount: this.props.valueCount,
      runCount: this.props.runCount,
      bitWidth: this.props.bitWidth
    }).addToGraph(graph);
    new GPUParquetDictionaryDecoder({
      id: `${this.id}-gather`,
      dictionary: this.props.dictionary,
      indices,
      output: this.props.output,
      valueCount: this.props.valueCount,
      dictionaryValueCount: this.props.dictionaryValueCount,
      byteWidth: this.props.byteWidth
    }).addToGraph(graph);
  }
}
