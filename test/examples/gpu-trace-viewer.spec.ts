// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import GPUTraceViewerAnimationLoopTemplate from '../../examples/experimental/gpu-trace-viewer/app';
import {
  TRACE_COLLAPSED_STATE,
  TRACE_DENSITY_BIN_COUNT,
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
          candidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          exactCandidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          densityCandidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          pickCandidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          candidateDependencyDispatchCommands: {
            buffer: {readAsync: () => Promise<Uint8Array>};
          };
          drawCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          visibleSpanIds: {readAsync: () => Promise<Uint8Array>};
          visibleDependencyIds: {readAsync: () => Promise<Uint8Array>};
          dependencyResults: {readAsync: () => Promise<Uint8Array>};
          densityBins: {readAsync: () => Promise<Uint8Array>};
          reachedSpans: {
            readAsync: (byteOffset?: number, byteLength?: number) => Promise<Uint8Array>;
          };
          dependencyCount: number;
          spanCount: number;
          spanBatchCount: number;
          dependencyBatchCount: number;
        };
        processStates: Uint32Array;
        threadStates: Uint32Array;
        selectedSpanIndex: number;
        focusDepth: number;
        focusOnly: boolean;
        activeFilterMask: number;
        spanCapacity: number;
        dependencyCapacity: number;
        compileCount: number;
        frameIndex: number;
      };
      expect(state.resources.spanCount).toBe(4096);
      expect(state.resources.spanBatchCount).toBeGreaterThan(0);
      expect(state.resources.dependencyCount).toBeGreaterThan(0);
      expect(state.resources.dependencyBatchCount).toBeGreaterThan(0);
      expect(host.querySelectorAll('[data-process]')).toHaveLength(TRACE_PROCESS_COUNT);
      expect(host.querySelectorAll('[data-thread]')).toHaveLength(TRACE_THREAD_COUNT);
      expect(host.querySelectorAll('[data-span-capacity]')).toHaveLength(1);
      expect(host.querySelectorAll('[data-dependency-capacity]')).toHaveLength(1);
      expect(state.spanCapacity).toBe(4096);
      expect(state.dependencyCapacity).toBe(250_000);
      const dependencyCapacity = host.querySelector<HTMLSelectElement>(
        '[data-dependency-capacity]'
      );
      expect(dependencyCapacity).not.toBeNull();
      const initialCompileCount = state.compileCount;
      dependencyCapacity!.dispatchEvent(new Event('input', {bubbles: true}));
      expect(state.compileCount).toBe(initialCompileCount);
      dependencyCapacity!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.compileCount).toBe(initialCompileCount + 1);

      viewer.onRender({device, time: 6000, width: 2048, height: 1} as AnimationProps);
      device.submit();
      const firstFrame = await state.resources.drawCommands.buffer.readAsync();
      const firstCounts = new Uint32Array(
        firstFrame.buffer,
        firstFrame.byteOffset,
        firstFrame.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(firstCounts[1] + firstCounts[5] + firstCounts[9]).toBeGreaterThan(0);
      expect(firstCounts[13]).toBeGreaterThan(0);
      const visibleSpanBytes = await state.resources.visibleSpanIds.readAsync();
      const visibleSpanIds = new Uint32Array(
        visibleSpanBytes.buffer,
        visibleSpanBytes.byteOffset,
        visibleSpanBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      for (let groupIndex = 0; groupIndex < 3; groupIndex++) {
        const instanceCount = firstCounts[groupIndex * 4 + 1];
        const firstInstance = firstCounts[groupIndex * 4 + 3];
        const groupIds = Array.from(
          visibleSpanIds.subarray(firstInstance, firstInstance + instanceCount)
        );
        expect(groupIds).toEqual([...groupIds].sort((left, right) => left - right));
      }
      const visibleDependencyBytes = await state.resources.visibleDependencyIds.readAsync();
      const visibleDependencyIds = new Uint32Array(
        visibleDependencyBytes.buffer,
        visibleDependencyBytes.byteOffset,
        firstCounts[13]
      );
      expect(Array.from(visibleDependencyIds)).toEqual(
        Array.from(visibleDependencyIds).sort((left, right) => left - right)
      );
      const dependencyResultBytes = await state.resources.dependencyResults.readAsync();
      const dependencyResults = new Uint32Array(
        dependencyResultBytes.buffer,
        dependencyResultBytes.byteOffset,
        dependencyResultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      for (const dependencyIndex of visibleDependencyIds) {
        const endpointOffset = state.resources.dependencyCount + dependencyIndex * 2;
        const sourceSpanIndex = dependencyResults[endpointOffset];
        const destinationSpanIndex = dependencyResults[endpointOffset + 1];
        expect(sourceSpanIndex).toBeLessThan(state.resources.spanCount);
        expect(destinationSpanIndex).toBeLessThan(state.resources.spanCount);
        expect(sourceSpanIndex).not.toBe(destinationSpanIndex);
      }
      const candidateBytes = await state.resources.candidateDispatchCommands.buffer.readAsync();
      const candidateDispatch = new Uint32Array(
        candidateBytes.buffer,
        candidateBytes.byteOffset,
        3
      );
      expect(candidateDispatch[0]).toBeGreaterThan(0);
      const candidateCount = candidateDispatch[1];
      expect(candidateCount).toBeGreaterThan(0);
      expect(candidateCount).toBeLessThanOrEqual(state.resources.spanBatchCount);
      const exactCandidateBytes =
        await state.resources.exactCandidateDispatchCommands.buffer.readAsync();
      const densityCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
      const pickCandidateBytes =
        await state.resources.pickCandidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(exactCandidateBytes.buffer, exactCandidateBytes.byteOffset, 3)[1]
      ).toBe(candidateCount);
      expect(
        new Uint32Array(densityCandidateBytes.buffer, densityCandidateBytes.byteOffset, 3)[1]
      ).toBe(0);
      expect(new Uint32Array(pickCandidateBytes.buffer, pickCandidateBytes.byteOffset, 3)[1]).toBe(
        0
      );
      const dependencyCandidateBytes =
        await state.resources.candidateDependencyDispatchCommands.buffer.readAsync();
      const dependencyCandidateCount = new Uint32Array(
        dependencyCandidateBytes.buffer,
        dependencyCandidateBytes.byteOffset,
        3
      )[1];
      expect(dependencyCandidateCount).toBeGreaterThan(0);
      expect(dependencyCandidateCount).toBeLessThan(state.resources.dependencyBatchCount);

      const firstGroup = host.querySelector<HTMLInputElement>('[data-group="0"]');
      expect(firstGroup).not.toBeNull();
      firstGroup!.checked = false;
      firstGroup!.dispatchEvent(new Event('change', {bubbles: true}));
      viewer.onRender({device, time: 6000, width: 2048, height: 1} as AnimationProps);
      device.submit();
      const filteredCandidateBytes =
        await state.resources.candidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(filteredCandidateBytes.buffer, filteredCandidateBytes.byteOffset, 3)[1]
      ).toBeLessThan(candidateCount);
      firstGroup!.checked = true;
      firstGroup!.dispatchEvent(new Event('change', {bubbles: true}));

      const firstProcess = host.querySelector<HTMLInputElement>('[data-process="0"]');
      expect(firstProcess).not.toBeNull();
      firstProcess!.checked = false;
      firstProcess!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.processStates[0]).toBe(TRACE_COLLAPSED_STATE);

      viewer.onRender({device, time: 6000, width: 2048, height: 1} as AnimationProps);
      device.submit();
      const collapsedDensityCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(
          collapsedDensityCandidateBytes.buffer,
          collapsedDensityCandidateBytes.byteOffset,
          3
        )[1]
      ).toBeGreaterThan(0);
      const collapsedDensityBytes = await state.resources.densityBins.readAsync();
      const collapsedDensity = new Uint32Array(
        collapsedDensityBytes.buffer,
        collapsedDensityBytes.byteOffset,
        collapsedDensityBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(collapsedDensity.slice(0, TRACE_DENSITY_BIN_COUNT).some(value => value > 0)).toBe(
        true
      );

      firstProcess!.checked = true;
      firstProcess!.dispatchEvent(new Event('change', {bubbles: true}));
      viewer.onRender({device, time: 6000, width: 2048, height: 1} as AnimationProps);
      device.submit();
      const expandedDensityCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(
          expandedDensityCandidateBytes.buffer,
          expandedDensityCandidateBytes.byteOffset,
          3
        )[1]
      ).toBe(0);
      const expandedDensityBytes = await state.resources.densityBins.readAsync();
      const expandedDensity = new Uint32Array(
        expandedDensityBytes.buffer,
        expandedDensityBytes.byteOffset,
        expandedDensityBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(expandedDensity.some(value => value > 0)).toBe(false);
      firstProcess!.checked = false;
      firstProcess!.dispatchEvent(new Event('change', {bubbles: true}));

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

      viewer.onRender({device, time: 6000, width: 2048, height: 1} as AnimationProps);
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
      expect(new Uint32Array(reachedBytes.buffer, reachedBytes.byteOffset, 1)[0]).toBe(
        state.frameIndex
      );
      focusOnly!.checked = false;
      focusOnly!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.focusOnly).toBe(false);
      viewer.onRender({device, time: 6000, width: 1, height: 1} as AnimationProps);
      device.submit();
      const densityFrame = await state.resources.drawCommands.buffer.readAsync();
      const densityCounts = new Uint32Array(
        densityFrame.buffer,
        densityFrame.byteOffset,
        densityFrame.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(densityCounts[1] + densityCounts[5] + densityCounts[9]).toBe(0);
      expect(densityCounts[13]).toBe(0);
      const densityModeExactCandidateBytes =
        await state.resources.exactCandidateDispatchCommands.buffer.readAsync();
      const densityModeCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(
          densityModeExactCandidateBytes.buffer,
          densityModeExactCandidateBytes.byteOffset,
          3
        )[1]
      ).toBe(0);
      expect(
        new Uint32Array(
          densityModeCandidateBytes.buffer,
          densityModeCandidateBytes.byteOffset,
          3
        )[1]
      ).toBeGreaterThan(0);
      const adaptiveDensityBytes = await state.resources.densityBins.readAsync();
      const adaptiveDensity = new Uint32Array(
        adaptiveDensityBytes.buffer,
        adaptiveDensityBytes.byteOffset,
        adaptiveDensityBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(adaptiveDensity.some(value => value > 0)).toBe(true);
      expect(adaptiveDensity.slice(0, TRACE_DENSITY_BIN_COUNT).some(value => value > 0)).toBe(true);

      host.querySelector<HTMLButtonElement>('[data-clear-selection]')!.click();
      expect(state.selectedSpanIndex).toBe(0xffffffff);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);
});
