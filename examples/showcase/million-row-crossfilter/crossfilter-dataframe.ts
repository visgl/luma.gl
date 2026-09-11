// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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

/**
 * Creates a dataframe view over the exact GPUData chunks used by the linked crossfilter showcase.
 *
 * The vectors borrow their chunks, so creating the dataframe allocates no GPU storage and does not
 * duplicate the million resident rows. This deliberately establishes GPUDataFrame as the semantic
 * source layer while GPUCrossfilter continues to provide the specialized linked-view controller.
 */
export function createCrossfilterDataFrame(
  columns: CrossfilterDataFrameColumns
): GPUDataFrame<CrossfilterDataFrameSchema> {
  const vectors = {
    longitude: new GPUVector({
      type: 'data',
      name: 'longitude',
      format: 'float32',
      data: [columns.longitude],
      ownsData: false
    }),
    latitude: new GPUVector({
      type: 'data',
      name: 'latitude',
      format: 'float32',
      data: [columns.latitude],
      ownsData: false
    }),
    value: new GPUVector({
      type: 'data',
      name: 'value',
      format: 'float32',
      data: [columns.value],
      ownsData: false
    }),
    risk: new GPUVector({
      type: 'data',
      name: 'risk',
      format: 'float32',
      data: [columns.risk],
      ownsData: false
    }),
    hour: new GPUVector({
      type: 'data',
      name: 'hour',
      format: 'float32',
      data: [columns.hour],
      ownsData: false
    }),
    category: new GPUVector({
      type: 'data',
      name: 'category',
      format: 'uint32',
      data: [columns.category],
      ownsData: false
    })
  };

  return new GPUDataFrame<CrossfilterDataFrameSchema>({
    table: new GPUTable<CrossfilterDataFrameSchema>({vectors}),
    dictionaries: {
      category: {values: CROSS_FILTER_CATEGORY_NAMES, ordered: false}
    },
    ownership: 'owned'
  });
}
