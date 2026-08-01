// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import GPUTraceViewerAnimationLoopTemplate from '../../examples/experimental/gpu-trace-viewer/app';
import {
  TRACE_COLLAPSED_STATE,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_PROCESS_COUNT,
  TRACE_THREAD_COUNT
} from '../../examples/experimental/gpu-trace-viewer/trace-data';

describe('GPU hierarchical trace viewer', () => {
  test('renders canonical spans and applies hierarchy and focused selection controls', async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) {
      return;
    }
    if (
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      Boolean(device.info.fallback)
    ) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'example-panel-host';
    document.body.append(host);
    let viewer: GPUTraceViewerAnimationLoopTemplate | null = null;
    try {
      viewer = new GPUTraceViewerAnimationLoopTemplate({
        device,
        traceCapacity: 4096
      } as AnimationProps & {traceCapacity: number});
      const state = viewer as unknown as {
        resources: {
          drawCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          activityBins: {readAsync: () => Promise<Uint8Array>};
          reachedSpans: {
            readAsync: (byteOffset?: number, byteLength?: number) => Promise<Uint8Array>;
          };
          dependencyCount: number;
          spanCount: number;
        };
        processStates: Uint32Array;
        threadStates: Uint32Array;
        selectedSpanIndex: number;
        focusDepth: number;
        focusOnly: boolean;
        activeFilterMask: number;
      };
      expect(state.resources.spanCount).toBe(4096);
      expect(state.resources.dependencyCount).toBeGreaterThan(0);
      expect(host.querySelectorAll('[data-process]')).toHaveLength(TRACE_PROCESS_COUNT);
      expect(host.querySelectorAll('[data-thread]')).toHaveLength(TRACE_THREAD_COUNT);

      viewer.onRender({device, time: 6000, width: 1, height: 1} as AnimationProps);
      device.submit();
      const firstFrame = await state.resources.drawCommands.buffer.readAsync();
      const firstCounts = new Uint32Array(
        firstFrame.buffer,
        firstFrame.byteOffset,
        firstFrame.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(firstCounts[1] + firstCounts[5] + firstCounts[9]).toBeGreaterThan(0);
      expect(firstCounts[13]).toBeGreaterThan(0);

      const firstProcess = host.querySelector<HTMLInputElement>('[data-process="0"]');
      expect(firstProcess).not.toBeNull();
      firstProcess!.checked = false;
      firstProcess!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.processStates[0]).toBe(TRACE_COLLAPSED_STATE);

      const firstThread = host.querySelector<HTMLInputElement>('[data-thread="4"]');
      expect(firstThread).not.toBeNull();
      firstThread!.checked = false;
      firstThread!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.threadStates[4]).toBe(TRACE_COLLAPSED_STATE);

      const sourceInput = host.querySelector<HTMLInputElement>('[data-source-span]');
      expect(sourceInput).not.toBeNull();
      sourceInput!.value = '29';
      host.querySelector<HTMLButtonElement>('[data-select-span]')!.click();
      expect(state.selectedSpanIndex).toBe(29);

      const focusOnly = host.querySelector<HTMLInputElement>('[data-focus-only]');
      expect(focusOnly).not.toBeNull();
      focusOnly!.checked = true;
      focusOnly!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.focusOnly).toBe(true);

      const hideOverlapping = host.querySelector<HTMLInputElement>('[data-hide-overlapping]');
      expect(hideOverlapping).not.toBeNull();
      hideOverlapping!.checked = true;
      hideOverlapping!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.activeFilterMask & TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN).toBe(
        TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN
      );

      const hideSimilarParents = host.querySelector<HTMLInputElement>(
        '[data-hide-similar-parents]'
      );
      expect(hideSimilarParents).not.toBeNull();
      hideSimilarParents!.checked = true;
      hideSimilarParents!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.activeFilterMask & TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS).toBe(
        TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS
      );

      const focusDepth = host.querySelector<HTMLInputElement>('[data-focus-depth]');
      expect(focusDepth).not.toBeNull();
      focusDepth!.value = '3';
      focusDepth!.dispatchEvent(new Event('input', {bubbles: true}));
      expect(state.focusDepth).toBe(3);

      viewer.onRender({device, time: 6000, width: 1, height: 1} as AnimationProps);
      device.submit();
      const focusedFrame = await state.resources.drawCommands.buffer.readAsync();
      const focusedCounts = new Uint32Array(
        focusedFrame.buffer,
        focusedFrame.byteOffset,
        focusedFrame.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(focusedCounts[1] + focusedCounts[5] + focusedCounts[9]).toBeLessThanOrEqual(
        firstCounts[1] + firstCounts[5] + firstCounts[9]
      );
      const reachedBytes = await state.resources.reachedSpans.readAsync(
        29 * Uint32Array.BYTES_PER_ELEMENT,
        Uint32Array.BYTES_PER_ELEMENT
      );
      expect(new Uint32Array(reachedBytes.buffer, reachedBytes.byteOffset, 1)[0]).toBe(1);
      const activityBytes = await state.resources.activityBins.readAsync();
      const activity = new Uint32Array(
        activityBytes.buffer,
        activityBytes.byteOffset,
        activityBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(activity.some(value => value > 0)).toBe(true);

      host.querySelector<HTMLButtonElement>('[data-clear-selection]')!.click();
      expect(state.selectedSpanIndex).toBe(0xffffffff);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);
});
