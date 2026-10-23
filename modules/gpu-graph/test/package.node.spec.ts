// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUGraph, GraphDataView, GPUCommandGraphInspector} from '@luma.gl/gpu-graph';
import {
  GPUGraph as CoreGPUGraph,
  GraphDataView as CoreGraphDataView,
  GPUCommandGraphInspector as CoreInspector
} from '@luma.gl/gpu-graph/gpu-core';
import {GPUGraph as FocusedGPUGraph} from '@luma.gl/gpu-graph/gpu-graph';
import * as graph from '@luma.gl/gpu-graph';

describe('GPU Graph package entry points', () => {
  it('shares scheduler, resource handles, and diagnostics across entry points', () => {
    expect(GPUGraph).toBe(CoreGPUGraph);
    expect(GPUGraph).toBe(FocusedGPUGraph);
    expect(GraphDataView).toBe(CoreGraphDataView);
    expect(GPUCommandGraphInspector).toBe(CoreInspector);
  });

  it('keeps optional processing modules out of the root API', () => {
    expect('GPUDataFrame' in graph).toBe(false);
    expect('GPUVolume' in graph).toBe(false);
    expect('GPUScan' in graph).toBe(false);
  });
});
