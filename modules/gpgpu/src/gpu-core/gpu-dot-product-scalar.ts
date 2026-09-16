// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph, GraphVectorView, GraphDataView} from './gpu-command-graph';
import type {GPUCommandNode} from './gpu-command-node';
import {validatePackedView} from './graph-data-view-utils';
import type {GPUScalar} from './gpu-scalar';
import {type GPUScalarDispatchGate, gateGPUCommandNodes} from './gpu-scalar-dispatch-gate';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {GPUScalarLiteral} from './gpu-scalar-literal';
import {getGPUScalarReductionNodes} from './gpu-reduction-substrate';

/** Hierarchical float32 dot product over borrowed chunks, writing directly to a GPUScalar. */
export class GPUDotProductScalar {
  readonly id: string;
  constructor(
    readonly props: {
      id?: string;
      left: GraphDataView<'float32'> | GraphVectorView<'float32'>;
      right: GraphDataView<'float32'> | GraphVectorView<'float32'>;
      output: GPUScalar<'float32'>;
      gate?: GPUScalarDispatchGate;
    }
  ) {
    this.id = props.id ?? 'gpu-dot-product-scalar';
    for (const view of [props.left, props.right]) {
      for (const chunk of getGraphVectorData(view)) validatePackedView(chunk, ['float32'], this.id);
    }
    if (props.left.length !== props.right.length || props.left.length > 0xffffffff)
      throw new Error(`${this.id} inputs must have equal uint32-addressable lengths`);
  }
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {left, right, output, gate} = this.props;
    if (
      output.arena.graph !== graph ||
      (gate && gate.active.arena.graph !== graph) ||
      [left, right].flatMap(getGraphVectorData).some(view => view.buffer.graph !== graph)
    ) {
      throw new Error(`${this.id} resources must belong to target graph`);
    }
    const nodes: GPUCommandNode<Parameters>[] = [];
    let segment = 0;
    for (const pair of alignGraphVectorViews(graph, [left, right])) {
      for (let start = 0; start < pair[0].length; ) {
        const length = Math.min(
          pair[0].length - start,
          ...pair.map(view =>
            Math.floor(
              (graph.device.limits.maxStorageBufferBindingSize -
                ((view.byteOffset + start * 4) % 256)) /
                4
            )
          )
        );
        if (length < 1) throw new Error('Dot product span must fit a storage binding');
        const input = graph.createDataView(pair[0].buffer, {
          format: 'float32',
          byteOffset: pair[0].byteOffset + start * 4,
          length
        });
        const inputB =
          pair[1] === pair[0]
            ? input
            : graph.createDataView(pair[1].buffer, {
                format: 'float32',
                byteOffset: pair[1].byteOffset + start * 4,
                length
              });
        nodes.push(
          ...getGPUScalarReductionNodes(graph, {
            id: `${this.id}-chunk-${segment}`,
            input,
            inputB,
            output,
            accumulate: segment > 0
          })
        );
        segment++;
        start += length;
      }
    }
    if (!segment)
      nodes.push(...new GPUScalarLiteral({id: this.id, output, value: 0}).getCommandNodes(graph));
    return gate ? gateGPUCommandNodes(graph, nodes, gate.active) : nodes;
  }
}
