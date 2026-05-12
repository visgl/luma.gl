// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {ArrowGPUVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import {
  ArrowGPUComputeGraph,
  type ArrowGPUAddOutput,
  type ArrowGPUFroundOutput,
  type ArrowGPUInterleaveProps,
  type ArrowGPUOperationProps
} from './arrow-gpu-compute-graph';

/**
 * Immediate single-operation transform API for {@link ArrowGPUVector}s.
 *
 * The transform does not own input vectors. Returned vectors own their generated GPU buffers.
 */
export class ArrowGPUTransform {
  readonly graph: ArrowGPUComputeGraph;

  constructor(device: Device) {
    this.graph = new ArrowGPUComputeGraph(device);
  }

  /** Adds two Arrow GPU vectors and returns a GPU-resident result vector. */
  add<XType extends arrow.DataType, YType extends arrow.DataType>(
    x: ArrowGPUVector<XType>,
    y: ArrowGPUVector<YType>,
    props: ArrowGPUOperationProps = {}
  ): ArrowGPUVector<ArrowGPUAddOutput<XType, YType>> {
    return this.graph.evaluate(this.graph.add(x, y, props));
  }

  /** Splits float64 values into high and low float32 components. */
  fround<TType extends arrow.DataType>(
    x: ArrowGPUVector<TType>,
    props: ArrowGPUOperationProps = {}
  ): ArrowGPUVector<ArrowGPUFroundOutput<TType>> {
    return this.graph.evaluate(this.graph.fround(x, props));
  }

  /** Interleaves Arrow GPU vectors and returns a GPU-resident interleaved result vector. */
  interleave(
    inputs: ArrowGPUVector[],
    props: ArrowGPUInterleaveProps = {}
  ): ArrowGPUVector<arrow.Binary> {
    return this.graph.evaluate(this.graph.interleave(inputs, props));
  }
}
