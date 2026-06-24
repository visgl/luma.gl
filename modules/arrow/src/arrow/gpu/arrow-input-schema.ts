// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {validateGPUInputVectors, type GPUInputSchema, type GPUInputVectors} from '@luma.gl/tables';
import type {RecordBatch, Table} from 'apache-arrow';

/** Arrow table-like source accepted by generic Arrow input schemas. */
export type ArrowInputSourceData = Table | RecordBatch;

/** Source data and selectors passed to an Arrow input schema resolver. */
export type ArrowInputResolveProps<
  SelectorsT = Record<string, unknown>,
  SourceDataT extends ArrowInputSourceData = ArrowInputSourceData
> = {
  /** Optional Arrow table or record batch containing source columns. */
  data?: SourceDataT | null;
  /** Optional adapter-owned source column selectors. */
  selectors?: SelectorsT;
};

/**
 * Arrow-owned adapter contract for preparing one GPU input schema.
 *
 * `GPUInputSchema` stays Arrow-free and validates the final prepared vectors.
 * `ArrowInputSchema` owns source-column resolution and conversion policy, including
 * multi-column normalization and generation of internal GPU inputs.
 */
export type ArrowInputSchema<
  SourceVectorsT,
  PreparedInputT,
  SelectorsT = Record<string, unknown>,
  ConversionOptionsT = void,
  SourceDataT extends ArrowInputSourceData = ArrowInputSourceData
> = {
  /** Error label used when final prepared vectors fail GPU input validation. */
  name: string;
  /** Arrow-free final GPU vector contract accepted by the consumer. */
  gpuInputSchema: GPUInputSchema;
  /** Resolves raw Arrow columns or direct vectors before conversion. */
  resolveSourceVectors: (props: ArrowInputResolveProps<SelectorsT, SourceDataT>) => SourceVectorsT;
  /** Converts resolved Arrow vectors and generates any internal GPU inputs. */
  convertToGPUVectors: (
    device: Device,
    sourceVectors: SourceVectorsT,
    options?: ConversionOptionsT
  ) => PreparedInputT | Promise<PreparedInputT>;
  /** Extracts final GPU vectors from the converter's prepared result for validation. */
  getGPUInputVectors: (preparedInput: PreparedInputT) => GPUInputVectors;
};

/** Options for resolving, converting, and validating one Arrow input schema. */
export type PrepareArrowInputProps<
  SelectorsT = Record<string, unknown>,
  ConversionOptionsT = void,
  SourceDataT extends ArrowInputSourceData = ArrowInputSourceData
> = ArrowInputResolveProps<SelectorsT, SourceDataT> & {
  /** Adapter-owned conversion options forwarded after source resolution. */
  options?: ConversionOptionsT;
};

/**
 * Resolves Arrow source columns, converts them to GPU inputs, and validates the final vectors.
 */
export async function prepareArrowInput<
  SourceVectorsT,
  PreparedInputT,
  SelectorsT = Record<string, unknown>,
  ConversionOptionsT = void,
  SourceDataT extends ArrowInputSourceData = ArrowInputSourceData
>(
  device: Device,
  schema: ArrowInputSchema<
    SourceVectorsT,
    PreparedInputT,
    SelectorsT,
    ConversionOptionsT,
    SourceDataT
  >,
  props: PrepareArrowInputProps<SelectorsT, ConversionOptionsT, SourceDataT>
): Promise<PreparedInputT> {
  const sourceVectors = schema.resolveSourceVectors({
    data: props.data,
    selectors: props.selectors
  });
  const preparedInput = await schema.convertToGPUVectors(device, sourceVectors, props.options);
  validateGPUInputVectors(
    schema.name,
    schema.gpuInputSchema,
    schema.getGPUInputVectors(preparedInput)
  );
  return preparedInput;
}
