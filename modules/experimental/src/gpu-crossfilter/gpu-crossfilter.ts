// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuXfilter.

import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '../gpu-core/gpu-command-graph';
import {
  GPUGroupAggregation,
  type GPUGroupAggregationOperation
} from '../gpu-core/gpu-group-aggregation';
import {
  GPUHistogram,
  type GPUHistogramDomain,
  type GPUHistogramEdges
} from '../gpu-core/gpu-histogram';
import {GPUMask} from '../gpu-core/gpu-mask';
import {GPUVisibilityWorkflow} from '../gpu-core/gpu-visibility-workflow';
import {createTransientView} from '../gpu-core/graph-data-view-utils';
import {
  GPUCrossfilterSelection,
  type GPUCrossfilterDimension,
  type GPUCrossfilterMask,
  type GPUCrossfilterScalarFormat,
  type GPUCrossfilterScalarInput
} from './gpu-selection';

/** Shared options for a linked, GPU-resident dashboard view. */
export type GPUCrossfilterViewOptions = {
  /** Stable view identifier used by graph nodes and {@link GPUCrossfilter.getViewMask}. */
  id: string;
  /** Selection dimension controlled by this view, if any. */
  dimension?: string;
  /** Whether this view includes its own selection in its result. */
  includeOwnSelection?: boolean;
};

/** GPU-resident histogram whose selection stays synchronized with linked views. */
export type GPUCrossfilterHistogramView<
  Format extends GPUCrossfilterScalarFormat = GPUCrossfilterScalarFormat
> = GPUCrossfilterViewOptions & {
  /** This view accumulates scalar values into histogram bins. */
  kind: 'histogram';
  /** Scalar source rows sharing the dashboard's chunk topology. */
  input: GPUCrossfilterScalarInput<Format>;
  /** Caller-owned bin counts. */
  output: GraphDataView<'uint32'>;
} & (
    | {
        /** Equal-width literal, GPU-resident, or automatically inferred domain. */
        domain: GPUHistogramDomain<Format>;
        /** Equal-width histograms do not accept explicit boundaries. */
        edges?: never;
      }
    | {
        /** Irregular literal or GPU-resident bin boundaries. */
        edges: GPUHistogramEdges<Format>;
        /** Irregular histograms do not use an equal-width domain. */
        domain?: never;
      }
  );

/** GPU-resident dense group counts or floating-point grouped statistics. */
export type GPUCrossfilterGroupView = GPUCrossfilterViewOptions & {
  /** This view aggregates rows by their dense unsigned group keys. */
  kind: 'group';
  /** One source-aligned group key per row. */
  keys: GPUCrossfilterMask;
} & (
    | {
        /** Caller-owned group counts. */
        output: GraphDataView<'uint32'>;
        /** Counting is the default grouped operation. */
        operation?: 'count';
        /** Counting does not consume floating-point values. */
        values?: never;
      }
    | {
        /** Caller-owned floating-point group statistics. */
        output: GraphDataView<'float32'>;
        /** Floating-point grouped aggregation to compute. */
        operation: Exclude<GPUGroupAggregationOperation, 'count'>;
        /** One source-aligned floating-point contribution per row. */
        values: GPUCrossfilterScalarInput<'float32'>;
      }
  );

/** Stable visible source indices and count for a linked scatterplot, map, or other renderer. */
export type GPUCrossfilterVisibilityView = GPUCrossfilterViewOptions & {
  /** This view publishes stable visible indices for rendering. */
  kind: 'visibility';
  /** Caller-owned destination for stable, compacted source indices. */
  output: GPUCrossfilterMask;
  /** Caller-owned visible count, optionally an indirect draw command word. */
  count: GraphDataView<'uint32'>;
  /** Optional additional caller-owned, canonical source-aligned mask. */
  outputMask?: GPUCrossfilterMask;
  /** Optional explicit stable source identifiers. */
  sourceIds?: GPUCrossfilterMask;
  /** First generated source identifier when explicit IDs are not supplied. */
  firstSourceIndex?: number;
};

/** Source-aligned selection output consumed directly by a linked renderer or compute pass. */
export type GPUCrossfilterMaskView = GPUCrossfilterViewOptions & {
  /** This view publishes a canonical source-aligned selection mask. */
  kind: 'mask';
  /** Caller-owned zero-or-one selection destination. */
  output: GPUCrossfilterMask;
};

/** Dashboard view kept synchronized entirely through GPU command-graph work. */
export type GPUCrossfilterView =
  | GPUCrossfilterHistogramView
  | GPUCrossfilterGroupView
  | GPUCrossfilterVisibilityView
  | GPUCrossfilterMaskView;

/** Source selections, linked views, and optional public mask owned by one dashboard. */
export type GPUCrossfilterProps = {
  /** Prefix for generated graph resources and compute passes. */
  id?: string;
  /** Range and rectangular brush dimensions sharing source row and chunk topology. */
  dimensions: readonly GPUCrossfilterDimension[];
  /** Linked histogram, group, visibility, and mask consumers. */
  views?: readonly GPUCrossfilterView[];
  /** Optional caller-owned destination for the intersection of every selection. */
  outputMask?: GPUCrossfilterMask;
};

/**
 * Coordinates GPU-resident selections across linked histogram, group, and rendering views.
 *
 * Range and rectangular-brush updates write only a small selection-control buffer. Source rows,
 * per-dimension predicates, composed masks, grouped counts, and compacted visible indices never
 * leave the GPU. Compile the command graph once and encode it again after each interaction.
 */
export class GPUCrossfilter<Parameters = void> {
  /** Prefix for graph resources and linked-view passes. */
  readonly id: string;
  /** Graph that owns transient selection masks and linked-view compute nodes. */
  readonly graph: GPUCommandGraph<Parameters>;
  /** Registered dashboard dimensions in selection-composition order. */
  readonly dimensions: readonly GPUCrossfilterDimension[];
  /** Linked dashboard consumers. */
  readonly views: readonly GPUCrossfilterView[];
  /** GPU-resident intersection of every registered dimension. */
  readonly mask: GPUCrossfilterMask;

  private readonly selections = new Map<string, GPUCrossfilterSelection>();
  private readonly viewMasks = new Map<string, GPUCrossfilterMask | undefined>();
  private readonly excludedDimensionMasks = new Map<string, GPUCrossfilterMask | undefined>();
  private addedToGraph = false;
  private destroyed = false;

  /** Registers source-aligned selections and reserves GPU control and mask storage. */
  constructor(graph: GPUCommandGraph<Parameters>, props: GPUCrossfilterProps) {
    this.id = props.id ?? 'gpu-crossfilter';
    this.graph = graph;
    this.dimensions = props.dimensions;
    this.views = props.views ?? [];

    if (this.dimensions.length === 0) {
      throw new Error(`${this.id} requires at least one selection dimension`);
    }

    try {
      for (const dimension of this.dimensions) {
        if (this.selections.has(dimension.id)) {
          throw new Error(`${this.id} selection dimensions require unique identifiers`);
        }
        const firstSelection = this.selections.values().next().value;
        const selection = new GPUCrossfilterSelection(graph, dimension, {
          id: `${this.id}-${dimension.id}`
        });
        this.selections.set(dimension.id, selection);
        if (firstSelection) {
          assertMatchingInputs(firstSelection.mask, selection.mask, `${this.id} ${dimension.id}`);
        }
      }
      validateViews(this.views, this.selections, this.id);

      const firstMask = this.selections.values().next().value!.mask;
      this.mask = props.outputMask ?? createMaskLike(graph, `${this.id}-mask`, firstMask);
      assertMatchingInputs(firstMask, this.mask, `${this.id} output mask`);
    } catch (error) {
      for (const selection of this.selections.values()) selection.destroy();
      throw error;
    }
  }

  /** Updates an inclusive scalar range without reading source data or recompiling the graph. */
  setRange(dimensionId: string, range: readonly [number, number]): this {
    this.getSelection(dimensionId).setRange(range);
    return this;
  }

  /** Updates inclusive `[minX, minY, maxX, maxY]` map or scatterplot brush bounds. */
  setBounds(dimensionId: string, bounds: readonly [number, number, number, number]): this {
    this.getSelection(dimensionId).setBounds(bounds);
    return this;
  }

  /** Disables one selection while retaining its reusable GPU control buffer and graph passes. */
  clear(dimensionId: string): this {
    this.getSelection(dimensionId).clear();
    return this;
  }

  /** Disables every selection without changing source buffers or command-graph topology. */
  clearAll(): this {
    this.assertAvailable();
    for (const selection of this.selections.values()) selection.clear();
    return this;
  }

  /** Returns one dimension's GPU-resident predicate mask. */
  getDimensionMask(dimensionId: string): GPUCrossfilterMask {
    return this.getSelection(dimensionId).mask;
  }

  /**
   * Returns a linked view's effective GPU mask after {@link addToGraph}.
   *
   * An own-selection-excluding view with no other dimensions returns `undefined`, indicating that
   * its histogram or grouped aggregation consumes every source row without a mask.
   */
  getViewMask(viewId: string): GPUCrossfilterMask | undefined {
    this.assertAvailable();
    if (!this.views.some(view => view.id === viewId)) {
      throw new Error(`${this.id} does not contain view "${viewId}"`);
    }
    if (!this.addedToGraph) {
      throw new Error(`${this.id} view masks are available after addToGraph()`);
    }
    return this.viewMasks.get(viewId);
  }

  /** Adds reusable selection, composition, aggregation, and visibility passes to the graph. */
  addToGraph(graph: GPUCommandGraph<Parameters> = this.graph): void {
    this.assertAvailable();
    if (graph !== this.graph) {
      throw new Error(`${this.id} selections must be added to their owning graph`);
    }
    if (this.addedToGraph) {
      throw new Error(`${this.id} can only be added to its graph once`);
    }

    for (const selection of this.selections.values()) selection.addToGraph(graph);
    new GPUMask({
      id: `${this.id}/controller/compose`,
      inputs: Array.from(this.selections.values(), selection => selection.mask),
      output: this.mask
    }).addToGraph(graph);

    for (const view of this.views) {
      const mask = this.getEffectiveMask(view);
      this.viewMasks.set(view.id, mask);

      switch (view.kind) {
        case 'histogram':
          this.addHistogramView(view, mask);
          break;
        case 'group':
          this.addGroupView(view, mask);
          break;
        case 'visibility':
          this.addVisibilityView(view, mask);
          break;
        case 'mask':
          this.addMaskView(view, mask);
          break;
      }
    }
    this.addedToGraph = true;
  }

  /** Releases controller-owned selection controls without destroying imported source buffers. */
  destroy(): void {
    if (this.destroyed) return;
    for (const selection of this.selections.values()) selection.destroy();
    this.destroyed = true;
  }

  /** Resolves one registered range or bounds selection. */
  private getSelection(dimensionId: string): GPUCrossfilterSelection {
    this.assertAvailable();
    const selection = this.selections.get(dimensionId);
    if (!selection) {
      throw new Error(`${this.id} does not contain selection dimension "${dimensionId}"`);
    }
    return selection;
  }

  /** Computes and caches leave-one-dimension-out masks for linked distribution views. */
  private getEffectiveMask(view: GPUCrossfilterView): GPUCrossfilterMask | undefined {
    const excludesOwnSelection =
      view.dimension !== undefined &&
      (view.includeOwnSelection === false ||
        (view.includeOwnSelection !== true &&
          (view.kind === 'histogram' || view.kind === 'group')));
    if (!excludesOwnSelection || !view.dimension) return this.mask;
    if (this.excludedDimensionMasks.has(view.dimension)) {
      return this.excludedDimensionMasks.get(view.dimension);
    }

    const inputs = Array.from(this.selections.values())
      .filter(selection => selection.dimension.id !== view.dimension)
      .map(selection => selection.mask);
    if (inputs.length === 0) {
      this.excludedDimensionMasks.set(view.dimension, undefined);
      return undefined;
    }

    const output = createMaskLike(
      this.graph,
      `${this.id}/controller/mask/without/${view.dimension}`,
      this.mask
    );
    new GPUMask({
      id: `${this.id}/controller/compose-without/${view.dimension}`,
      inputs,
      output
    }).addToGraph(this.graph);
    this.excludedDimensionMasks.set(view.dimension, output);
    return output;
  }

  /** Adds either an equal-width or an irregular linked histogram. */
  private addHistogramView(
    view: GPUCrossfilterHistogramView,
    mask: GPUCrossfilterMask | undefined
  ): void {
    const id = `${this.id}/view/${view.id.length}:${view.id}`;
    if (view.edges !== undefined) {
      new GPUHistogram({
        id,
        input: view.input,
        output: view.output,
        edges: view.edges,
        mask
      }).addToGraph(this.graph);
      return;
    }
    new GPUHistogram({
      id,
      input: view.input,
      output: view.output,
      domain: view.domain,
      mask
    }).addToGraph(this.graph);
  }

  /** Adds source-aligned masked counts or floating-point grouped statistics. */
  private addGroupView(view: GPUCrossfilterGroupView, mask: GPUCrossfilterMask | undefined): void {
    const id = `${this.id}/view/${view.id.length}:${view.id}`;
    if (!isGroupStatisticView(view)) {
      new GPUGroupAggregation({
        id,
        keys: view.keys,
        output: view.output,
        operation: 'count',
        mask
      }).addToGraph(this.graph);
      return;
    }

    new GPUGroupAggregation({
      id,
      keys: view.keys,
      values: view.values,
      output: view.output,
      operation: view.operation,
      mask
    }).addToGraph(this.graph);
  }

  /** Adds stable row-ID compaction and an optional public source-aligned predicate. */
  private addVisibilityView(
    view: GPUCrossfilterVisibilityView,
    mask: GPUCrossfilterMask | undefined
  ): void {
    const selectionMask = mask ?? this.createAllRowsMask(view.id);
    this.viewMasks.set(view.id, selectionMask);
    new GPUVisibilityWorkflow({
      id: `${this.id}/view/${view.id.length}:${view.id}`,
      predicates: [{kind: 'selection', mask: selectionMask}],
      output: view.output,
      count: view.count,
      outputMask: view.outputMask,
      sourceIds: view.sourceIds,
      firstSourceIndex: view.firstSourceIndex
    }).addToGraph(this.graph);
  }

  /** Publishes one effective source-aligned view mask without transferring GPU ownership. */
  private addMaskView(view: GPUCrossfilterMaskView, mask: GPUCrossfilterMask | undefined): void {
    const selectionMask = mask ?? this.createAllRowsMask(view.id);
    if (selectionMask !== view.output) {
      new GPUMask({
        id: `${this.id}/view/${view.id.length}:${view.id}`,
        inputs: [selectionMask],
        output: view.output
      }).addToGraph(this.graph);
    }
    this.viewMasks.set(view.id, view.output);
  }

  /** Creates an all-rows predicate using only source-aligned GPU mask operations. */
  private createAllRowsMask(viewId: string): GPUCrossfilterMask {
    const id = `${this.id}/controller/mask/view/${viewId}/all`;
    const nodeId = `${this.id}/controller/view/${viewId}/all`;
    const firstMask = this.selections.values().next().value!.mask;
    const inverse = createMaskLike(this.graph, `${id}-inverse`, firstMask);
    const output = createMaskLike(this.graph, id, firstMask);
    new GPUMask({
      id: `${nodeId}/not`,
      inputs: [firstMask],
      output: inverse,
      operation: 'not'
    }).addToGraph(this.graph);
    new GPUMask({
      id: `${nodeId}/compose`,
      inputs: [firstMask, inverse],
      output,
      operation: 'or'
    }).addToGraph(this.graph);
    return output;
  }

  /** Rejects interactions after controller-owned selection buffers have been destroyed. */
  private assertAvailable(): void {
    if (this.destroyed) {
      throw new Error(`${this.id} has been destroyed`);
    }
  }
}

/** Narrows optional count operations away from floating-point grouped-statistic views. */
function isGroupStatisticView(
  view: GPUCrossfilterGroupView
): view is Extract<
  GPUCrossfilterGroupView,
  {operation: Exclude<GPUGroupAggregationOperation, 'count'>}
> {
  return view.operation !== undefined && view.operation !== 'count';
}

/** Reserves graph-owned mask storage while retaining every original vector chunk boundary. */
function createMaskLike<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  template: GPUCrossfilterMask
): GPUCrossfilterMask {
  if (!(template instanceof GraphVectorView)) {
    return createTransientView(graph, id, 'uint32', template.length);
  }

  let emptyChunk: GraphDataView<'uint32'> | undefined;
  const data = template.data.map((chunk, chunkIndex) => {
    if (chunk.length === 0) {
      emptyChunk ??= createTransientView(graph, `${id}-empty`, 'uint32', 0);
      return emptyChunk;
    }
    return createTransientView(graph, `${id}-chunk-${chunkIndex}`, 'uint32', chunk.length);
  });

  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length: template.length,
    valueLength: template.length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data
  });
}

/** Validates exact source-view kind, row count, and ordered vector chunk topology. */
function assertMatchingInputs(
  first: GPUCrossfilterScalarInput,
  second: GPUCrossfilterScalarInput,
  name: string
): void {
  if (first instanceof GraphVectorView !== second instanceof GraphVectorView) {
    throw new Error(`${name} must preserve the same view kind`);
  }
  if (first.length !== second.length) {
    throw new Error(`${name} must preserve the same row count`);
  }
  if (
    first instanceof GraphVectorView &&
    second instanceof GraphVectorView &&
    (first.data.length !== second.data.length ||
      first.data.some((chunk, chunkIndex) => chunk.length !== second.data[chunkIndex].length))
  ) {
    throw new Error(`${name} must preserve the same chunk topology`);
  }
}

/** Validates stable view identifiers and their optional linked selection dimensions. */
function validateViews(
  views: readonly GPUCrossfilterView[],
  selections: ReadonlyMap<string, GPUCrossfilterSelection>,
  controllerId: string
): void {
  const firstMask = selections.values().next().value?.mask;
  const identifiers = new Set<string>();
  for (const view of views) {
    if (identifiers.has(view.id)) {
      throw new Error(`${controllerId} linked views require unique identifiers`);
    }
    identifiers.add(view.id);
    if (view.dimension !== undefined && !selections.has(view.dimension)) {
      throw new Error(`${controllerId} view "${view.id}" references an unknown dimension`);
    }
    if (!firstMask) continue;

    switch (view.kind) {
      case 'histogram':
        assertMatchingInputs(firstMask, view.input, `${controllerId} view "${view.id}" input`);
        break;
      case 'group':
        assertMatchingInputs(firstMask, view.keys, `${controllerId} view "${view.id}" keys`);
        if (isGroupStatisticView(view)) {
          assertMatchingInputs(firstMask, view.values, `${controllerId} view "${view.id}" values`);
        }
        break;
      case 'mask':
        assertMatchingInputs(firstMask, view.output, `${controllerId} view "${view.id}" output`);
        break;
      case 'visibility':
        if (view.outputMask) {
          assertMatchingInputs(
            firstMask,
            view.outputMask,
            `${controllerId} view "${view.id}" output mask`
          );
        }
        if (view.sourceIds) {
          assertMatchingInputs(
            firstMask,
            view.sourceIds,
            `${controllerId} view "${view.id}" source IDs`
          );
        }
        break;
    }
  }
}
