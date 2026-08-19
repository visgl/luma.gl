// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraph,
  GraphDataView,
  GraphVectorView,
  type GPUCommandGraphContributor
} from '../gpu-core/gpu-command-graph';
import {
  GPUGroupAggregation,
  type GPUGroupAggregationOperation
} from '../gpu-core/gpu-group-aggregation';

/** One packed canonical column or ordered chunks preserving canonical row order. */
export type GPUTraceAggregationColumn<T extends 'uint32' | 'float32'> =
  | GraphDataView<T>
  | GraphVectorView<T>;

/** Minimal trace-column source accepted by {@link GPUTraceAggregation}. */
export type GPUTraceAggregationSource = {
  lanes: GPUTraceAggregationColumn<'uint32'>;
  groupIds: GPUTraceAggregationColumn<'uint32'>;
  processIds: GPUTraceAggregationColumn<'uint32'>;
  threadIds: GPUTraceAggregationColumn<'uint32'>;
  classifications: GPUTraceAggregationColumn<'uint32'>;
  durations: GPUTraceAggregationColumn<'float32'>;
};

/** Canonical trace column used as a dense aggregation key. */
export type GPUTraceAggregationDimension =
  | 'lane'
  | 'group'
  | 'process'
  | 'thread'
  | 'classification';

/** Statistic produced for each dense trace dimension value. */
export type GPUTraceAggregationMetric =
  | 'count'
  | 'duration-sum'
  | 'duration-min'
  | 'duration-max'
  | 'duration-mean';

type GPUTraceAggregationBaseProps = {
  /** Prefix for generated command-graph node IDs. */
  id?: string;
  /** Canonical GPU trace whose columns are aggregated. */
  trace: GPUTraceAggregationSource;
  /** Built-in trace dimension or a caller-produced dense unsigned key column. */
  dimension: GPUTraceAggregationDimension | GPUTraceAggregationColumn<'uint32'>;
  /** Optional source-aligned selection, normally `GPUTraceInteraction.visibleMask`. */
  selection?: GPUTraceAggregationColumn<'uint32'>;
};

/** Properties for one graph-native trace aggregation. */
export type GPUTraceAggregationProps = GPUTraceAggregationBaseProps &
  (
    | {
        metric: 'count';
        /** Caller-owned dense unsigned counts; its length defines the accepted key range. */
        output: GraphDataView<'uint32'>;
      }
    | {
        metric: Exclude<GPUTraceAggregationMetric, 'count'>;
        /** Caller-owned dense floating-point duration statistics. */
        output: GraphDataView<'float32'>;
      }
  );

/**
 * Aggregates canonical GPU trace rows by a dense trace dimension.
 *
 * This trace-domain contributor deliberately reuses {@link GPUGroupAggregation}. It adds no
 * submission or readback policy: outputs remain GPU-resident and callers decide whether to render,
 * compose, or asynchronously sample the small result. Supplying an interaction visibility mask
 * makes filters, hierarchy changes, and dependency focus update the same aggregation graph without
 * rebuilding CPU span lists.
 */
export class GPUTraceAggregation implements GPUCommandGraphContributor {
  /** Prefix for generated command-graph node IDs. */
  readonly id: string;
  /** Canonical source trace. */
  readonly trace: GPUTraceAggregationSource;
  /** Built-in dimension name or caller-provided key column. */
  readonly dimension: GPUTraceAggregationDimension | GPUTraceAggregationColumn<'uint32'>;
  /** Statistic produced for each dimension value. */
  readonly metric: GPUTraceAggregationMetric;
  /** Optional source-aligned zero/nonzero selection. */
  readonly selection?: GPUTraceAggregationColumn<'uint32'>;
  /** Caller-owned aggregation result. */
  readonly output: GraphDataView<'uint32'> | GraphDataView<'float32'>;

  constructor(props: GPUTraceAggregationProps) {
    this.id = props.id ?? 'gpu-trace-aggregation';
    this.trace = props.trace;
    this.dimension = props.dimension;
    this.metric = props.metric;
    this.selection = props.selection;
    this.output = props.output;

    const keys = getDimensionView(this.trace, this.dimension);
    if (this.selection && this.selection.length !== keys.length) {
      throw new Error(`${this.id} selection must align with canonical trace rows`);
    }
  }

  /** Adds the aggregation to a caller-owned graph without compiling, submitting, or reading back. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const keys = getDimensionView(this.trace, this.dimension);
    if (this.metric === 'count') {
      new GPUGroupAggregation({
        id: this.id,
        keys,
        mask: this.selection,
        output: this.output as GraphDataView<'uint32'>,
        operation: 'count'
      }).addToGraph(graph);
      return;
    }

    new GPUGroupAggregation({
      id: this.id,
      keys,
      values: this.trace.durations,
      mask: this.selection,
      output: this.output as GraphDataView<'float32'>,
      operation: getDurationOperation(this.metric)
    }).addToGraph(graph);
  }
}

function getDimensionView(
  trace: GPUTraceAggregationSource,
  dimension: GPUTraceAggregationDimension | GPUTraceAggregationColumn<'uint32'>
): GPUTraceAggregationColumn<'uint32'> {
  if (dimension instanceof GraphDataView || dimension instanceof GraphVectorView) return dimension;
  switch (dimension) {
    case 'lane':
      return trace.lanes;
    case 'group':
      return trace.groupIds;
    case 'process':
      return trace.processIds;
    case 'thread':
      return trace.threadIds;
    case 'classification':
      return trace.classifications;
  }
}

function getDurationOperation(
  metric: Exclude<GPUTraceAggregationMetric, 'count'>
): Exclude<GPUGroupAggregationOperation, 'count'> {
  switch (metric) {
    case 'duration-sum':
      return 'sum';
    case 'duration-min':
      return 'min';
    case 'duration-max':
      return 'max';
    case 'duration-mean':
      return 'mean';
  }
}
