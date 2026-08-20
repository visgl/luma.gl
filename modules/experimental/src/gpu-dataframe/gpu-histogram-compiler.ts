// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {type GPUField, type GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import {type GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUHistogram} from '@luma.gl/gpgpu/gpu-core';
import {getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addGPUAnalyticsComputePass,
  createGPUAnalyticsOutputVector,
  createGPUAnalyticsResultTable,
  getGPUAnalyticsSelectionMask,
  getGPUAnalyticsInvocationIndexSource,
  getGPUAnalyticsVector,
  validateGPUAnalyticsOutputLength,
  validateGPUAnalyticsSource,
  type GPUAnalyticsScalarFormat
} from './gpu-analytics-compiler-utils';
import type {GPUDataFrame, GPUDataFrameDictionaries, GPUDataFrameValidity} from './gpu-data-frame';
import type {GPUDataFrameDerivedColumn} from './gpu-data-frame-query';
import type {GPUExpression} from './gpu-expression';
import type {GPUDataFrameHistogramOptions} from './gpu-histogram-query';
import {
  CompiledGPUDataFrameQuery,
  compileGPUDataFrameQuery,
  type CompiledGPUDataFrameQueryProps,
  type GPUDataFrameQueryExtensionContext,
  type GPUDataFrameQueryExtensionResult,
  type GPUDataFrameQueryParameters
} from './gpu-query-compiler';

type GPUHistogramResult = {bin: 'uint32'; count: 'uint32'};

/** Dense source-aligned histogram with explicit, immutable numeric bin metadata. */
export class CompiledGPUDataFrameHistogram extends CompiledGPUDataFrameQuery<GPUHistogramResult> {
  /** Number of dense GPU-resident histogram bins. */
  readonly binCount: number;
  /** Inclusive equal-width source domain, when explicit boundaries are not supplied. */
  readonly domain?: readonly [number, number];
  /** Explicit strictly increasing bin boundaries, when using irregular intervals. */
  readonly edges?: readonly number[];

  /** @internal */
  constructor(
    props: CompiledGPUDataFrameQueryProps<GPUHistogramResult>,
    options: GPUDataFrameHistogramOptions
  ) {
    super(props);
    if ('edges' in options) {
      this.edges = Object.freeze([...options.edges]);
      this.binCount = options.edges.length - 1;
    } else {
      this.domain = Object.freeze([...options.domain]) as readonly [number, number];
      this.binCount = options.bins;
    }
  }
}

/** Adds filtered numeric histogram work to the same graph as the source dataframe query. */
export function compileGPUDataFrameHistogram<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap
>(
  source: GPUDataFrame<Source>,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[],
  column: keyof Selection & string,
  options: GPUDataFrameHistogramOptions,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): CompiledGPUDataFrameHistogram {
  validateGPUAnalyticsSource(source, [column]);
  validateGPUAnalyticsOutputLength(
    graph,
    'edges' in options ? options.edges.length - 1 : options.bins
  );
  return compileGPUDataFrameQuery<
    Source,
    Selection,
    GPUHistogramResult,
    CompiledGPUDataFrameHistogram
  >(source, predicates, selectedColumns, graph, derivedColumns, {
    allowEmptyPredicates: true,
    prepare: context => addGPUHistogramToGraph(context, column, options)
  });
}

/** Initializes dense bin IDs and applies source null/selection masks to native histogram passes. */
function addGPUHistogramToGraph<Selection extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  column: keyof Selection & string,
  options: GPUDataFrameHistogramOptions
): GPUDataFrameQueryExtensionResult<GPUHistogramResult, CompiledGPUDataFrameHistogram> {
  const prefix = `${context.queryId}-histogram`;
  const binCount = 'edges' in options ? options.edges.length - 1 : options.bins;
  const ownedVectors: GPUVector[] = [];
  let table:
    | ReturnType<typeof createGPUAnalyticsResultTable<Selection, GPUHistogramResult>>
    | undefined;

  try {
    const vector = getGPUAnalyticsVector(context, column);
    const input = context.graph.importGPUVector(`${prefix}-input`, vector);
    const mask = getGPUAnalyticsSelectionMask(context, column, prefix);
    const bins = createGPUAnalyticsOutputVector(
      context.graph.device,
      `${prefix}-bins`,
      'uint32',
      binCount
    );
    ownedVectors.push(bins);
    const counts = createGPUAnalyticsOutputVector(
      context.graph.device,
      `${prefix}-counts`,
      'uint32',
      binCount
    );
    ownedVectors.push(counts);
    const binView = context.graph.importGPUVector(`${prefix}-bin-vector`, bins).data[0];
    const output = context.graph.importGPUVector(`${prefix}-count-vector`, counts).data[0];
    addGPUHistogramBinIdentityPass(context.graph, `${prefix}-initialize-bins`, binView);

    if ('edges' in options) {
      new GPUHistogram({id: prefix, input, output, mask, edges: options.edges}).addToGraph(
        context.graph
      );
    } else {
      new GPUHistogram({id: prefix, input, output, mask, domain: options.domain}).addToGraph(
        context.graph
      );
    }

    const fields: GPUField[] = [
      {name: 'bin', format: 'uint32', nullable: false, metadata: new Map()},
      {name: 'count', format: 'uint32', nullable: false, metadata: new Map()}
    ];
    const vectors = new Map<string, GPUVector<GPUAnalyticsScalarFormat>>([
      ['bin', bins],
      ['count', counts]
    ]);
    table = createGPUAnalyticsResultTable<Selection, GPUHistogramResult>(
      context.table,
      fields,
      vectors
    );

    return {
      table,
      validity: Object.freeze({}) as Readonly<GPUDataFrameValidity<GPUHistogramResult>>,
      dictionaries: Object.freeze({}) as Readonly<GPUDataFrameDictionaries<GPUHistogramResult>>,
      ownedTables: [table],
      ownedVectors,
      createCompiled: props => new CompiledGPUDataFrameHistogram(props, options)
    };
  } catch (error) {
    table?.destroy();
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Publishes deterministic dense histogram-bin identities directly from a GPU compute pass. */
function addGPUHistogramBinIdentityPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  output: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputBins: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, output.length)}
  if (index < ELEMENT_COUNT) {
    outputBins[OUTPUT_OFFSET + index] = index;
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputBins: output},
    length: output.length
  });
}
