// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUCommandGraph, GraphDataView, GPUCommandGraphInspector} from '@luma.gl/graph';
import {
  GPUCommandGraph as CoreGPUGraph,
  GraphDataView as CoreGraphDataView,
  GPUCommandGraphInspector as CoreInspector
} from '@luma.gl/graph/gpu-core';
import {GPUCommandGraph as FocusedGPUGraph} from '@luma.gl/graph/gpu-graph';
import * as graph from '@luma.gl/graph';
import * as coreGraph from '@luma.gl/graph/gpu-core';
import * as focusedGraph from '@luma.gl/graph/gpu-graph';

describe('GPU Graph package entry points', () => {
  it('shares scheduler, resource handles, and diagnostics across entry points', () => {
    expect(GPUCommandGraph).toBe(CoreGPUGraph);
    expect(GPUCommandGraph).toBe(FocusedGPUGraph);
    expect(GraphDataView).toBe(CoreGraphDataView);
    expect(GPUCommandGraphInspector).toBe(CoreInspector);
  });

  it('shares semantic authoring constructors and distinguishes command execution', () => {
    expect(graph.GPUGraph).toBe(coreGraph.GPUGraph);
    expect(graph.GPUGraph).toBe(focusedGraph.GPUGraph);
    expect(graph.GPUGraphCompiler).toBe(coreGraph.GPUGraphCompiler);
    expect(graph.GPUGraphVector).toBe(coreGraph.GPUGraphVector);
    expect(graph.GPUGraphTexture).toBe(coreGraph.GPUGraphTexture);
    expect(graph.GPUGraph).not.toBe(graph.GPUCommandGraph);
    const authoredGraph = new graph.GPUGraph({id: 'authored'});
    expect(authoredGraph.vector('positions', 'float32', 3)).toBeInstanceOf(graph.GPUGraphVector);
    expect(authoredGraph.id).toBe('authored');
  });

  it('keeps optional processing modules out of the root API', () => {
    expect('GPUDataFrame' in graph).toBe(false);
    expect('GPUVolume' in graph).toBe(false);
    expect('GPUScan' in graph).toBe(false);
  });
});
