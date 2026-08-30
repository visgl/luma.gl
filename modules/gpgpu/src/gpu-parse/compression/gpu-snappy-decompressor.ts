// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPULZByteDecompressor,
  GPU_LZ_BYTE_WORKGROUP_SIZE,
  type GPUCommandGraph,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

export const GPU_SNAPPY_WORKGROUP_SIZE = GPU_LZ_BYTE_WORKGROUP_SIZE;

export type GPUSnappyDecompressorProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  descriptors: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  compressedByteLength: number;
  outputByteLength: number;
  descriptorCount: number;
};

/** Raw Snappy semantic wrapper over the generic literal/backreference byte decompressor. */
export class GPUSnappyDecompressor {
  readonly id: string;
  readonly props: Readonly<GPUSnappyDecompressorProps>;

  constructor(props: GPUSnappyDecompressorProps) {
    this.id = props.id ?? 'gpu-snappy';
    this.props = Object.freeze({...props, id: this.id});
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    new GPULZByteDecompressor({
      id: props.id,
      input: props.input,
      descriptors: props.descriptors,
      output: props.output,
      inputByteLength: props.compressedByteLength,
      outputByteLength: props.outputByteLength,
      descriptorCount: props.descriptorCount
    }).addToGraph(graph);
  }
}
