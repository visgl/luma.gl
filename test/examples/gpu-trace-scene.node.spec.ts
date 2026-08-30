// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {getGPUTracePickingShader} from '@luma.gl/experimental/gpu-trace';
import {TRACE_SCENE_RENDER_SHADER} from '../../examples/experimental/gpu-trace-scene/trace-scene-shaders';
import {
  TRACE_ERROR_SPAN_FLAG,
  TRACE_LANES_PER_THREAD
} from '../../examples/experimental/gpu-trace-viewer/trace-data';

describe('GPU scene-backed trace shaders', () => {
  test('renders generic scene bounds while keeping trace ownership in canonical source records', () => {
    expect(TRACE_SCENE_RENDER_SHADER).toContain('sceneRecords[recordBase + 2u]');
    expect(TRACE_SCENE_RENDER_SHADER).toContain('sceneRecords[recordBase + 3u]');
    expect(TRACE_SCENE_RENDER_SHADER).toContain('spans[sourceIndex * 2u + 1u]');
    expect(TRACE_SCENE_RENDER_SHADER).toContain(`${TRACE_ERROR_SPAN_FLAG}u`);
  });

  test('bounds GPU picking to visible canonical rows and scanned effective lanes', () => {
    const source = getGPUTracePickingShader(384, TRACE_LANES_PER_THREAD);

    expect(source).toContain('sourceIndex >= 384u');
    expect(source).toContain('visibleMask[sourceIndex] == 0u');
    expect(source).toContain('request.enabled == 0u');
    expect(source).not.toContain('active: u32');
    expect(source).toContain(`timing.z % ${TRACE_LANES_PER_THREAD}u`);
    expect(source).toContain('atomicMin(&result, sourceIndex)');
  });
});
