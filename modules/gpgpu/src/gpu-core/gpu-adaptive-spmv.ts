// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph, GraphDataView} from './gpu-command-graph';
import {selectGPUSpMVStrategy, type GPUSpMVRowStatistics, type GPUSpMVStrategyId} from './gpu-spmv-strategy';

export type GPUAdaptiveSpMVProps = {
  id?: string;
  rowOffsets: GraphDataView<'uint32'>;
  columnIndices: GraphDataView<'uint32'>;
  values: GraphDataView<'float32'>;
  vector: GraphDataView<'float32'>;
  output: GraphDataView<'float32'>;
  columns: number;
  /** Optional row-shape metadata. No CPU readback is performed to discover it. */
  statistics?: GPUSpMVRowStatistics;
  /** Debug/benchmark override. Normal callers should leave this unset. */
  strategy?: GPUSpMVStrategyId;
};

/**
 * Strategy-selecting CSR SpMV facade.
 *
 * This PR establishes the stable adaptive boundary. The existing workgroup-row GPUSpMV kernel is
 * the executable baseline; scalar/subgroup/long-row kernels can land behind this facade without
 * changing callers or solver composition.
 */
export class GPUAdaptiveSpMV {
  readonly id: string;
  readonly props: GPUAdaptiveSpMVProps;
  constructor(props: GPUAdaptiveSpMVProps) {
    this.id = props.id ?? 'gpu-adaptive-spmv';
    this.props = props;
  }

  getStrategy<Parameters>(graph: GPUCommandGraph<Parameters>) {
    return selectGPUSpMVStrategy(graph.device, {
      rows: this.props.output.length,
      nonZeros: this.props.values.length,
      statistics: this.props.statistics
    }, this.props.strategy);
  }

  /**
   * Returns compiler/inspector-visible strategy metadata.
   * Execution wiring is intentionally separated so strategy policy can be reviewed independently
   * from importing the earlier GPUSpMV branch into the current stacked series.
   */
  explain<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const decision = this.getStrategy(graph);
    return Object.freeze({operation: 'GPUSpMV', strategy: decision.id, score: decision.score, reason: decision.reason, ...decision.details});
  }
}
