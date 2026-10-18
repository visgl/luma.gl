// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraphInspector,
  type GPUCommandGraphEncoding,
  type GPUCommandGraphInspectorGraph
} from '@luma.gl/gpgpu/gpu-core';
import {GPUCommandGraphDebugPanel} from './gpu-command-graph-debug-panel';
import {GPUTracePanel} from './gpu-trace-panel';

/** Example-owned diagnostics; the renderer remains responsible for queue submission. */
export class GPUGraphDiagnostics {
  readonly inspectorPanel = new GPUCommandGraphDebugPanel();
  readonly tracePanel = new GPUTracePanel();
  private readonly inspector = new GPUCommandGraphInspector();
  private readonly graphs = new Map<string, GPUCommandGraphInspectorGraph>();
  private readonly sampleCounts = new Map<string, number>();
  private latestEncoding: GPUCommandGraphEncoding | null = null;
  private generation = 0;

  record(graph: GPUCommandGraphInspectorGraph, encoding: GPUCommandGraphEncoding): void {
    if (this.graphs.get(graph.id) !== graph) {
      this.graphs.set(graph.id, graph);
      this.sampleCounts.set(graph.id, 0);
      this.inspector.registerGraph(graph);
    }
    this.inspector.recordEncoding(graph.id, encoding);
    const sampleCount = this.sampleCounts.get(graph.id)!;
    this.sampleCounts.set(graph.id, sampleCount + 1);
    if (sampleCount % 60 !== 0) return;
    this.latestEncoding = encoding;
    this.inspectorPanel.update(this.inspector.getSnapshot(), graph.id);
    this.tracePanel.update(encoding.stats, graph.id);
    const generation = this.generation;
    // AnimationLoop and Deck submit synchronously after rendering. Read only after that frame.
    queueMicrotask(() => {
      if (generation !== this.generation || this.graphs.get(graph.id) !== graph) return;
      void this.inspector
        .recordGPUTimings(graph.id, encoding)
        .then(report => {
          if (generation !== this.generation || this.graphs.get(graph.id) !== graph) return;
          this.inspectorPanel.update(this.inspector.getSnapshot());
          if (report && this.latestEncoding === encoding) this.tracePanel.update(report, graph.id);
        })
        .catch(() => {
          // Optional timestamps can become unavailable on device loss; retain the CPU sample.
        });
    });
  }

  clear(): void {
    this.generation++;
    this.latestEncoding = null;
    this.graphs.clear();
    this.sampleCounts.clear();
    this.inspector.clear();
    this.inspectorPanel.update(this.inspector.getSnapshot());
    this.tracePanel.update(undefined);
  }
}
