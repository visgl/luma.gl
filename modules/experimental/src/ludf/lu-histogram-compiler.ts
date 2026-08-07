// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {GPUVector, type GPUField, type GPUTypeMap} from '@luma.gl/tables';
import {type GPUCommandGraph, type GraphDataView} from '../gpu-primitives/gpu-command-graph';
import {GPUHistogram} from '../gpu-primitives/gpu-histogram';
import {getViewElementOffset} from '../gpu-primitives/graph-data-view-utils';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addLuAnalyticsComputePass,
  createLuAnalyticsOutputVector,
  createLuAnalyticsResultTable,
  getLuAnalyticsSelectionMask,
  getLuAnalyticsVector,
  validateLuAnalyticsOutputLength,
  validateLuAnalyticsSource,
  type LuAnalyticsScalarFormat
} from './lu-analytics-compiler-utils';
import type {LuDataFrame, LuDataFrameDictionaries, LuDataFrameValidity} from './lu-data-frame';
import type {LuDataFrameDerivedColumn} from './lu-data-frame-query';
import type {LuExpression} from './lu-expression';
import type {LuDataFrameHistogramOptions} from './lu-histogram-query';
import {
  CompiledLuDataFrameQuery,
  compileLuDataFrameQuery,
  type CompiledLuDataFrameQueryProps,
  type LuDataFrameQueryExtensionContext,
  type LuDataFrameQueryExtensionResult,
  type LuDataFrameQueryParameters
} from './lu-query-compiler';

type LuHistogramResult = {bin: 'uint32'; count: 'uint32'};

/** Dense source-aligned histogram with explicit, immutable numeric bin metadata. */
export class CompiledLuDataFrameHistogram extends CompiledLuDataFrameQuery<LuHistogramResult> {
  /** Number of dense GPU-resident histogram bins. */
  readonly binCount: number;
  /** Inclusive equal-width source domain, when explicit boundaries are not supplied. */
  readonly domain?: readonly [number, number];
  /** Explicit strictly increasing bin boundaries, when using irregular intervals. */
  readonly edges?: readonly number[];

  /** @internal */
  constructor(
    props: CompiledLuDataFrameQueryProps<LuHistogramResult>,
    options: LuDataFrameHistogramOptions
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
export function compileLuDataFrameHistogram<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap
>(
  source: LuDataFrame<Source>,
  predicates: readonly LuExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly LuDataFrameDerivedColumn[],
  column: keyof Selection & string,
  options: LuDataFrameHistogramOptions,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): CompiledLuDataFrameHistogram {
  validateLuAnalyticsSource(source, [column]);
  validateLuAnalyticsOutputLength(
    graph,
    'edges' in options ? options.edges.length - 1 : options.bins
  );
  return compileLuDataFrameQuery<
    Source,
    Selection,
    LuHistogramResult,
    CompiledLuDataFrameHistogram
  >(source, predicates, selectedColumns, graph, derivedColumns, {
    allowEmptyPredicates: true,
    prepare: context => addLuHistogramToGraph(context, column, options)
  });
}

/** Initializes dense bin IDs and applies source null/selection masks to native histogram passes. */
function addLuHistogramToGraph<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  column: keyof Selection & string,
  options: LuDataFrameHistogramOptions
): LuDataFrameQueryExtensionResult<LuHistogramResult, CompiledLuDataFrameHistogram> {
  const prefix = `${context.queryId}-histogram`;
  const binCount = 'edges' in options ? options.edges.length - 1 : options.bins;
  const ownedVectors: GPUVector[] = [];
  let table:
    | ReturnType<typeof createLuAnalyticsResultTable<Selection, LuHistogramResult>>
    | undefined;

  try {
    const vector = getLuAnalyticsVector(context, column);
    const input = context.graph.importGPUVector(`${prefix}-input`, vector);
    const mask = getLuAnalyticsSelectionMask(context, column, prefix);
    const bins = createLuAnalyticsOutputVector(
      context.graph.device,
      `${prefix}-bins`,
      'uint32',
      binCount
    );
    ownedVectors.push(bins);
    const counts = createLuAnalyticsOutputVector(
      context.graph.device,
      `${prefix}-counts`,
      'uint32',
      binCount
    );
    ownedVectors.push(counts);
    const binView = context.graph.importGPUVector(`${prefix}-bin-vector`, bins).data[0];
    const output = context.graph.importGPUVector(`${prefix}-count-vector`, counts).data[0];
    addLuHistogramBinIdentityPass(context.graph, `${prefix}-initialize-bins`, binView);

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
    const vectors = new Map<string, GPUVector<LuAnalyticsScalarFormat>>([
      ['bin', bins],
      ['count', counts]
    ]);
    table = createLuAnalyticsResultTable<Selection, LuHistogramResult>(
      context.table,
      fields,
      vectors
    );

    return {
      table,
      validity: Object.freeze({}) as Readonly<LuDataFrameValidity<LuHistogramResult>>,
      dictionaries: Object.freeze({}) as Readonly<LuDataFrameDictionaries<LuHistogramResult>>,
      ownedTables: [table],
      ownedVectors,
      createCompiled: props => new CompiledLuDataFrameHistogram(props, options)
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
function addLuHistogramBinIdentityPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  output: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputBins: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < ELEMENT_COUNT) {
    outputBins[OUTPUT_OFFSET + globalId.x] = globalId.x;
  }
}`;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputBins: output},
    length: output.length
  });
}
