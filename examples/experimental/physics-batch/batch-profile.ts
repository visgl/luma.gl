// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Device} from '@luma.gl/core';
import type {GPUPhysicsEnsemble} from '@luma.gl/graph/gpu-physics';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

/** A separate instrumented step; timestamp pass boundaries never contaminate throughput samples. */
export async function profileEnsemble(
  device: Device,
  ensemble: GPUPhysicsEnsemble,
  diagnostics?: GPUGraphDiagnostics
) {
  const graph = ensemble.inspect().graph;
  const encoder = device.createCommandEncoder();
  const querySet =
    device.features.has('timestamp-query') && encoder.withTimeProfilingQuerySet
      ? device.createQuerySet({
          type: 'timestamp',
          count: Math.min(8192, graph.stats.nodeOrder.length * 2)
        })
      : undefined;
  try {
    if (querySet) encoder.withTimeProfilingQuerySet!(querySet, () => ensemble.encode(encoder));
    else ensemble.encode(encoder);
    device.submit(encoder.finish());
    const encoding = ensemble.inspect().encoding!;
    const timing = await encoding.readTimings();
    diagnostics?.record(graph, encoding);
    const groups: Record<
      string,
      {cpuEncodeMilliseconds: number; gpuMilliseconds: number | null; nodes: number}
    > = {};
    for (const node of timing.nodes) {
      const category = /checkpoint|rollback/.test(node.id)
        ? 'rollback'
        : /broad-phase|bounds/.test(node.id)
          ? 'broadPhase'
          : /ensemble/.test(node.id)
            ? 'scheduling'
            : /prepare|collide|mesh/.test(node.id)
              ? 'contacts'
              : /parallel|solve/.test(node.id)
                ? 'solver'
                : 'other';
      groups[category] ??= {
        cpuEncodeMilliseconds: 0,
        gpuMilliseconds: null,
        nodes: 0
      };
      const group = groups[category];
      group.cpuEncodeMilliseconds += node.cpuEncodeTimeMilliseconds;
      if (node.gpuTimeMilliseconds !== undefined)
        group.gpuMilliseconds = (group.gpuMilliseconds ?? 0) + node.gpuTimeMilliseconds;
      group.nodes++;
    }
    return {
      groups,
      gpuTimestampsAvailable: encoding.canReadGPUTimings,
      computePasses: encoding.stats.computePassCount,
      graphNodes: encoding.stats.nodeCount,
      declaredCommands: graph.preflight.commandCount,
      annotatedNodes: graph.preflight.annotatedNodeCount,
      scope:
        'One additional instrumented step after quality sampling. GPU timings are unavailable without timestamp-query; copy timings are CPU-only. This sample is excluded from latency and throughput.'
    };
  } finally {
    querySet?.destroy();
  }
}
