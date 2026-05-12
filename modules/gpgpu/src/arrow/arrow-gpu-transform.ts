// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {ArrowGPUVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import {
  arrowAdd,
  arrowDeinterleave,
  arrowDesegment,
  arrowFround,
  arrowInterleave,
  arrowProjectWGS84ToPseudoMercator,
  arrowSegment,
  arrowUpload,
  evaluateGPUComputeGraph,
  type ArrowGPUAddOutput,
  type ArrowGPUDeinterleaveProps,
  type ArrowGPUDesegmentProps,
  type ArrowGPUFroundOutput,
  type ArrowGPUInterleaveProps,
  type ArrowGPUOperationProps,
  type ArrowGPUProjectWGS84ToPseudoMercatorOutput,
  type ArrowGPUSegmentProps,
  type ArrowGPUUploadProps
} from './arrow-gpu-compute-graph';

/**
 * Immediate single-operation transform API for {@link ArrowGPUVector}s.
 *
 * The transform does not own input vectors. Returned vectors own their generated GPU buffers.
 */
export class ArrowGPUTransform {
  readonly device: Device;

  constructor(device: Device) {
    this.device = device;
  }

  /** Uploads an Arrow vector or table column and returns a GPU-resident Arrow vector. */
  upload<TType extends arrow.DataType>(
    vector: arrow.Vector<TType>,
    props?: ArrowGPUUploadProps
  ): ArrowGPUVector<TType>;
  upload<TType extends arrow.DataType>(
    table: arrow.Table,
    path: string,
    props?: ArrowGPUUploadProps
  ): ArrowGPUVector<TType>;
  upload<TType extends arrow.DataType>(
    source: arrow.Vector<TType> | arrow.Table,
    pathOrProps?: string | ArrowGPUUploadProps,
    props?: ArrowGPUUploadProps
  ): ArrowGPUVector<TType> {
    return typeof pathOrProps === 'string'
      ? evaluateGPUComputeGraph(arrowUpload(source as arrow.Table, pathOrProps, props), this.device)
      : evaluateGPUComputeGraph(
          arrowUpload(source as arrow.Vector<TType>, pathOrProps),
          this.device
        );
  }

  /** Adds two Arrow GPU vectors and returns a GPU-resident result vector. */
  add<XType extends arrow.DataType, YType extends arrow.DataType>(
    x: ArrowGPUVector<XType>,
    y: ArrowGPUVector<YType>,
    props: ArrowGPUOperationProps = {}
  ): ArrowGPUVector<ArrowGPUAddOutput<XType, YType>> {
    return evaluateGPUComputeGraph(arrowAdd(x, y, props), this.device);
  }

  /** Splits float64 values into high and low float32 components. */
  fround<TType extends arrow.DataType>(
    x: ArrowGPUVector<TType>,
    props: ArrowGPUOperationProps = {}
  ): ArrowGPUVector<ArrowGPUFroundOutput<TType>> {
    return evaluateGPUComputeGraph(arrowFround(x, props), this.device);
  }

  /** Interleaves Arrow GPU vectors and returns a GPU-resident interleaved result vector. */
  interleave(
    inputs: ArrowGPUVector[],
    props: ArrowGPUInterleaveProps = {}
  ): ArrowGPUVector<arrow.Binary> {
    return evaluateGPUComputeGraph(arrowInterleave(inputs, props), this.device);
  }

  /** Segments packed Arrow GPU vectors into one GPU-resident segmented result vector. */
  segment(
    inputs: ArrowGPUVector[],
    props: ArrowGPUSegmentProps = {}
  ): ArrowGPUVector<arrow.Binary> {
    return evaluateGPUComputeGraph(arrowSegment(inputs, props), this.device);
  }

  /** Extracts one attribute from an interleaved Arrow GPU vector. */
  deinterleave(
    source: ArrowGPUVector<arrow.Binary>,
    attribute: string,
    props: ArrowGPUDeinterleaveProps = {}
  ): ArrowGPUVector {
    return evaluateGPUComputeGraph(arrowDeinterleave(source, attribute, props), this.device);
  }

  /** Extracts one segment from a segmented Arrow GPU vector. */
  desegment(
    source: ArrowGPUVector<arrow.Binary>,
    segment: string,
    props: ArrowGPUDesegmentProps = {}
  ): ArrowGPUVector {
    return evaluateGPUComputeGraph(arrowDesegment(source, segment, props), this.device);
  }

  /** Projects double-single WGS84 longitude/latitude to EPSG:3857 pseudo-Mercator. */
  projectWGS84ToPseudoMercator<TType extends arrow.DataType>(
    x: ArrowGPUVector<TType>,
    props: ArrowGPUOperationProps = {}
  ): ArrowGPUVector<ArrowGPUProjectWGS84ToPseudoMercatorOutput<TType>> {
    return evaluateGPUComputeGraph(arrowProjectWGS84ToPseudoMercator(x, props), this.device);
  }
}
