// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph, GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUGroupAggregation} from '@luma.gl/gpgpu/gpu-core';
import {GPUVector, type GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPUTable} from '@luma.gl/experimental/gpu-tables';
import {GPUDataFrame} from '@luma.gl/experimental/gpu-dataframe';
import {CROSS_FILTER_CATEGORY_NAMES} from './crossfilter-data';

export type CrossfilterDataFrameSchema = {
  longitude: 'float32';
  latitude: 'float32';
  value: 'float32';
  risk: 'float32';
  hour: 'float32';
  category: 'uint32';
  selected: 'uint32';
};

export type CrossfilterDataFrameColumns = {
  longitude: GPUData<'float32'>;
  latitude: GPUData<'float32'>;
  value: GPUData<'float32'>;
  risk: GPUData<'float32'>;
  hour: GPUData<'float32'>;
  category: GPUData<'uint32'>;
  selected: GPUData<'uint32'>;
};

/**
 * Creates a dataframe view over the exact GPUData chunks used by the linked crossfilter showcase.
 *
 * The vectors borrow their chunks, so creating the dataframe allocates no GPU storage and does not
 * duplicate the million resident rows. The live Crossfilter selection mask is represented as the
 * `selected` uint32 column, allowing general dataframe-style analytics to consume linked-view state
 * without introducing a special crossfilter-only mask contract.
 */
export function createCrossfilterDataFrame(
  columns: CrossfilterDataFrameColumns
): GPUDataFrame<CrossfilterDataFrameSchema> {
  const makeVector = <Format extends 'float32' | 'uint32'>(
    name: string,
    format: Format,
    data: GPUData<Format>
  ) =>
    new GPUVector({
      type: 'data',
      name,
      format,
      data: [data],
      ownsData: false
    });

  const vectors = {
    longitude: makeVector('longitude', 'float32', columns.longitude),
    latitude: makeVector('latitude', 'float32', columns.latitude),
    value: makeVector('value', 'float32', columns.value),
    risk: makeVector('risk', 'float32', columns.risk),
    hour: makeVector('hour', 'float32', columns.hour),
    category: makeVector('category', 'uint32', columns.category),
    selected: makeVector('selected', 'uint32', columns.selected)
  };

  return new GPUDataFrame<CrossfilterDataFrameSchema>({
    table: new GPUTable<CrossfilterDataFrameSchema>({vectors}),
    dictionaries: {
      category: {values: CROSS_FILTER_CATEGORY_NAMES, ordered: false}
    },
    ownership: 'owned'
  });
}

/**
 * Adds a dense category count driven by the dataframe's live `selected` column.
 *
 * This is intentionally a shared-graph contribution rather than `GPUDataFrameQuery.compile()`: the
 * current query compiler owns final graph compilation, while this showcase needs Crossfilter,
 * analytics, and rendering-facing resources to coexist in one reusable command graph. The helper
 * establishes the semantic/data ownership boundary now and can later lower through GPUProgram
 * without changing the hero's storage or interaction contracts.
 */
export function addCrossfilterDataFrameCategoryCount<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  dataFrame: GPUDataFrame<CrossfilterDataFrameSchema>,
  selectionMask: GraphDataView<'uint32'>,
  output: GraphDataView<'uint32'>
): void {
  const category = dataFrame.column('category');
  if (!(category instanceof GPUVector)) {
    throw new Error('Crossfilter dataframe category column must be a GPUVector');
  }
  const categoryView = graph.importGPUVector('crossfilter-dataframe-category', category).data[0];
  if (selectionMask.length !== dataFrame.numRows) {
    throw new Error('Crossfilter dataframe selection mask must match the dataframe row count');
  }
  if (output.length !== CROSS_FILTER_CATEGORY_NAMES.length) {
    throw new Error('Crossfilter dataframe category output must match the category dictionary');
  }

  new GPUGroupAggregation({
    id: 'crossfilter-dataframe-category-count',
    keys: categoryView,
    mask: selectionMask,
    output,
    operation: 'count'
  }).addToGraph(graph);
}
