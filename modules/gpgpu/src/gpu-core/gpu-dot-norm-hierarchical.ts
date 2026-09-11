// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {GPUFloat32HierarchicalReduction} from './gpu-reduction-substrate';
import {GPUScalar} from './gpu-scalar';
import type {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';

/** Hierarchical dot product that scales beyond one workgroup and writes directly to GPUScalar. */
export class GPUDotProductHierarchical {
  readonly id: string;
  constructor(readonly props: {
    id?: string;
    left: GraphDataView<'float32'>;
    right: GraphDataView<'float32'>;
    output: GPUScalar<'float32'>;
    gate?: GPUScalarDispatchGate;
  }) {
    this.id = props.id ?? 'gpu-dot-product-hierarchical';
  }
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    new GPUFloat32HierarchicalReduction({
      id: this.id,
      input: this.props.left,
      inputB: this.props.right,
      map: 'multiply',
      output: this.props.output,
      gate: this.props.gate
    }).addToGraph(graph);
  }
}

/** Hierarchical squared L2 norm: output = sum(x*x). Avoids sqrt when convergence uses norm². */
export class GPUVectorNormSquaredHierarchical {
  readonly id: string;
  constructor(readonly props: {
    id?: string;
    input: GraphDataView<'float32'>;
    output: GPUScalar<'float32'>;
    gate?: GPUScalarDispatchGate;
  }) {
    this.id = props.id ?? 'gpu-vector-norm-squared-hierarchical';
  }
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    new GPUFloat32HierarchicalReduction({
      id: this.id,
      input: this.props.input,
      map: 'square',
      output: this.props.output,
      gate: this.props.gate
    }).addToGraph(graph);
  }
}
