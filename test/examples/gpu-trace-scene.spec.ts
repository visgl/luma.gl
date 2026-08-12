// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import GPUTraceSceneAnimationLoopTemplate from '../../examples/experimental/gpu-trace-scene/app';
import {TRACE_DURATION_FILTER_MAXIMUM} from '../../examples/experimental/gpu-trace-viewer/trace-data';

describe('GPU scene-backed trace explorer', () => {
  test('composes one scene graph and updates hierarchy, classification, and focus controls', async () => {
    const device = await getWebGPUTestDevice();
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      device.info.fallback
    ) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'example-panel-host';
    document.body.append(host);
    let explorer: GPUTraceSceneAnimationLoopTemplate | null = null;
    try {
      explorer = new GPUTraceSceneAnimationLoopTemplate({
        device,
        traceCapacity: 96
      } as AnimationProps & {
        traceCapacity: number;
      });
      const state = explorer as unknown as {
        resources: {
          compiled: {stats: {nodeOrder: string[]}};
          trace: {stats: {spanCount: number; partitionCount: number}};
          commands: {capacity: number};
        };
        processExpansion: Uint32Array;
        threadExpansion: Uint32Array;
        errorsOnly: boolean;
        focusEnabled: boolean;
        traceDuration: number;
        timeMinimum: number;
        timeMaximum: number;
      };
      expect(state.resources.trace.stats.spanCount).toBe(96);
      expect(state.resources.trace.stats.partitionCount).toBe(3);
      expect(state.resources.commands.capacity).toBe(96);
      expect(state.resources.compiled.stats.nodeOrder).toContain('scene-trace-picking');
      expect(state.resources.compiled.stats.nodeOrder).toContain('scene-trace-render');
      expect(state.resources.compiled.stats.nodeOrder).toContain(
        'scene-trace-resource-groups-classify'
      );
      expect(state.timeMinimum).toBe(0);
      expect(state.timeMaximum).toBeLessThan(state.traceDuration);
      const durationFilter = host.querySelector<HTMLInputElement>('[data-minimum-duration]');
      expect(durationFilter?.max).toBe(String(TRACE_DURATION_FILTER_MAXIMUM));
      expect(durationFilter?.step).toBe('0.01');

      const process = host.querySelector<HTMLInputElement>('[data-process="0"]');
      expect(process).not.toBeNull();
      process!.checked = false;
      process!.dispatchEvent(new Event('change', {bubbles: true}));

      const errors = host.querySelector<HTMLInputElement>('[data-errors-only]');
      expect(errors).not.toBeNull();
      errors!.checked = true;
      errors!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.processExpansion[0]).toBe(0);
      expect(state.errorsOnly).toBe(true);

      const thread = host.querySelector<HTMLInputElement>('[data-thread="1"]');
      expect(thread).not.toBeNull();
      thread!.checked = false;
      thread!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.threadExpansion[1]).toBe(0);

      const focus = host.querySelector<HTMLInputElement>('[data-focus]');
      expect(focus).not.toBeNull();
      focus!.checked = true;
      focus!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.focusEnabled).toBe(true);
      expect(explorer.graphInspector.getSnapshot().graphs[0].encodingCount).toBe(0);
    } finally {
      explorer?.onFinalize();
      host.remove();
    }
  });
});
