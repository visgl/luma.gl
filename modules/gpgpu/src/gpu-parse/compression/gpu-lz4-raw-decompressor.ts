// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPULZByteDecompressor,
  GPU_LZ_BYTE_WORKGROUP_SIZE,
  getGPULZByteDecompressorShaderSource,
  type GPUBoundedDispatchLayout,
  type GPUCommandGraph,
  type GPULZByteDecompressorProps,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

export const GPU_LZ4_RAW_WORKGROUP_SIZE = GPU_LZ_BYTE_WORKGROUP_SIZE;

export type GPULZ4RawDecompressorProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  descriptors: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  compressedByteLength: number;
  outputByteLength: number;
  descriptorCount: number;
};

/** Semantic LZ4_RAW wrapper over the generic literal/backreference byte decompressor. */
export class GPULZ4RawDecompressor {
  readonly id: string;
  readonly props: Readonly<GPULZ4RawDecompressorProps>;

  constructor(props: GPULZ4RawDecompressorProps) {
    this.id = props.id ?? 'gpu-lz4-raw';
    this.props = Object.freeze({...props, id: this.id});
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    new GPULZByteDecompressor(makeGPULZ4RawDecompressorProps(this.props)).addToGraph(graph);
  }
}

/** Returns the shared resolver shader configured for an LZ4_RAW operation. @internal */
export function getGPULZ4RawShaderSource(
  decompressor: GPULZ4RawDecompressor,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  return getGPULZByteDecompressorShaderSource(
    makeGPULZ4RawDecompressorProps(decompressor.props),
    dispatchLayout
  );
}

/** Returns the shared LZ byte resolver properties used by the LZ4_RAW wrapper. @internal */
export function makeGPULZ4RawDecompressorProps(
  props: Readonly<GPULZ4RawDecompressorProps>
): GPULZByteDecompressorProps {
  return {
    id: props.id,
    input: props.input,
    descriptors: props.descriptors,
    output: props.output,
    inputByteLength: props.compressedByteLength,
    outputByteLength: props.outputByteLength,
    descriptorCount: props.descriptorCount
  };
}
