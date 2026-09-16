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
};

export type CrossfilterDataFrameColumns = {
  longitude: GPUData<'float32'>;
  latitude: GPUData<'float32'>;
  value: GPUData<'float32'>;
  risk: GPUData<'float32'>;
  hour: GPUData<'float32'>;
  category: GPUData<'uint32'>;
};

/** Creates a zero-copy dataframe view over the exact GPU chunks used by the linked dashboard. */
export function createCrossfilterDataFrame(
  columns: CrossfilterDataFrameColumns
): GPUDataFrame<CrossfilterDataFrameSchema> {
  const makeVector = <Format extends 'float32' | 'uint32'>(
    name: string,
    format: Format,
    data: GPUData<Format>
  ) => new GPUVector({type: 'data', name, format, data: [data], ownsData: false});

  return new GPUDataFrame<CrossfilterDataFrameSchema>({
    table: new GPUTable<CrossfilterDataFrameSchema>({
      vectors: {
        longitude: makeVector('longitude', 'float32', columns.longitude),
        latitude: makeVector('latitude', 'float32', columns.latitude),
        value: makeVector('value', 'float32', columns.value),
        risk: makeVector('risk', 'float32', columns.risk),
        hour: makeVector('hour', 'float32', columns.hour),
        category: makeVector('category', 'uint32', columns.category)
      }
    }),
    dictionaries: {category: {values: CROSS_FILTER_CATEGORY_NAMES, ordered: false}},
    ownership: 'owned'
  });
}

/**
 * Adds dataframe-backed dense category aggregation using the live linked-view selection mask.
 *
 * The current general dataframe query compiler owns graph finalization, so this shared-graph helper
 * deliberately consumes its semantic source (`GPUDataFrame`) plus an externally produced selection
 * mask. It replaces specialized Crossfilter category aggregation without duplicating source storage
 * or selection work, and establishes the seam that can later lower through GPUProgram.
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
  if (selectionMask.length !== dataFrame.numRows) {
    throw new Error('Crossfilter selection mask must match dataframe row count');
  }
  if (output.length !== CROSS_FILTER_CATEGORY_NAMES.length) {
    throw new Error('Crossfilter category output must match dataframe category dictionary');
  }
  const keys = graph.importGPUVector('crossfilter-dataframe-category', category).data[0];
  new GPUGroupAggregation({
    id: 'crossfilter-dataframe-category-count',
    keys,
    mask: selectionMask,
    output,
    operation: 'count'
  }).addToGraph(graph);
}
