// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import GPUTraceViewerAnimationLoopTemplate from '../../examples/experimental/gpu-trace-viewer/app';
import {
  getTraceFocusFrontierCapacity,
  TRACE_COLLAPSED_STATE,
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DISPLAY_LANE_CAPACITY,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_DISPLAY_BUDGET,
  TRACE_DEPENDENCY_RECORD_WORD_LENGTH,
  TRACE_DURATION_FILTER_MAXIMUM,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_PROCESS_COUNT,
  TRACE_SPAN_BATCH_CAPACITY,
  TRACE_SPAN_RECORD_WORD_LENGTH,
  TRACE_THREAD_COUNT
} from '../../examples/experimental/gpu-trace-viewer/trace-data';

describe('GPU hierarchical trace viewer', () => {
  test('renders canonical spans and applies hierarchy and focused selection controls', async () => {
    const device = await getWebGPUTestDevice('max');
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
        traceCapacity: 4096,
        dependencyCapacity: 250_000
      } as AnimationProps & {traceCapacity: number; dependencyCapacity: number});
      const state = viewer as unknown as {
        resources: {
          candidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          densityCandidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          pickCandidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          candidateDependencyBatchCounts: {readAsync: () => Promise<Uint8Array>};
          drawCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          spanChunks: Array<{
            spanCount: number;
            visibility: {byteLength: number};
            visibleIds: {readAsync: () => Promise<Uint8Array>};
          }>;
          dependencyChunks: Array<{
            buffer: {byteLength: number};
            results: {readAsync: () => Promise<Uint8Array>};
            visibleIds: {readAsync: () => Promise<Uint8Array>};
            candidateDispatchCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
            dependencyCount: number;
            drawCommandIndex: number;
          }>;
          densityBins: {readAsync: () => Promise<Uint8Array>};
          reachedSpans: {
            byteLength: number;
            readAsync: (byteOffset?: number, byteLength?: number) => Promise<Uint8Array>;
          };
          dependencyCount: number;
          focusFrontierCapacity: number;
          spanCount: number;
          spanBatchCount: number;
          dependencyBatchCount: number;
        };
        processStates: Uint32Array;
        threadStates: Uint32Array;
        selectedSpanIndex: number;
        focusDepth: number;
        focusOnly: boolean;
        dependencyDisplayBudget: number;
        dependencyRouting: 'auto' | 'exact' | 'bundled';
        autoScroll: boolean;
        analysisScope: 'trace' | 'viewport' | 'interval';
        measuredTimeMinimum: number;
        measuredTimeMaximum: number;
        lodFadeEnabled: boolean;
        minimapEnabled: boolean;
        activeFilterMask: number;
        spanCapacity: number;
        dependencyCapacity: number;
        compileCount: number;
        frameIndex: number;
        gpuFrameInFlight: boolean;
        initialDependencyWarmup: boolean;
        traceDuration: number;
        view: {timeMin: number; timeMax: number; laneMin: number; laneMax: number};
        pendingPick: {
          time: number;
          lane: number;
          requestIdentifier: number;
          intent: 'hover' | 'select';
          clientX: number;
          clientY: number;
        } | null;
        latestSelectionPickRequestIdentifier: number;
        graphInspector: {
          getSnapshot: () => {
            graphs: Array<{
              encodingCount: number;
              counters: Array<{id: string; latestValue: number}>;
            }>;
          };
        };
        setDatasetStatus: (status: string) => void;
      };
      await vi.waitFor(() => expect(state.resources).not.toBeNull(), {timeout: 20_000});
      const readDependencyCandidateCount = async (): Promise<number> => {
        const bytes = await state.resources.candidateDependencyBatchCounts.readAsync();
        const counts = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
        return state.resources.dependencyChunks.reduce(
          (sum, _, chunkIndex) => sum + counts[chunkIndex],
          0
        );
      };
      const renderFrame = async (width = 2048, height = 1): Promise<void> => {
        await vi.waitFor(() => expect(state.gpuFrameInFlight).toBe(false), {timeout: 20_000});
        expect(viewer!.onRender({device, time: 6000, width, height} as AnimationProps)).toBe(true);
        device.submit();
        await vi.waitFor(() => expect(state.gpuFrameInFlight).toBe(false), {timeout: 20_000});
      };
      expect(state.resources.spanCount).toBe(4096);
      expect(state.resources.spanBatchCount).toBeGreaterThan(0);
      expect(state.resources.dependencyCount).toBeGreaterThan(0);
      expect(state.resources.focusFrontierCapacity).toBe(
        getTraceFocusFrontierCapacity(state.resources.spanCount, state.resources.dependencyCount)
      );
      expect(
        state.resources.spanChunks.every(
          chunk =>
            chunk.visibility.byteLength ===
            Math.ceil(chunk.spanCount / 32) * Uint32Array.BYTES_PER_ELEMENT
        )
      ).toBe(true);
      expect(state.resources.dependencyBatchCount).toBeGreaterThan(0);
      expect(host.querySelectorAll('[data-process]')).toHaveLength(TRACE_PROCESS_COUNT);
      expect(host.querySelectorAll('[data-thread]')).toHaveLength(TRACE_THREAD_COUNT);
      expect(host.querySelectorAll('[data-span-capacity]')).toHaveLength(1);
      expect(host.querySelectorAll('[data-dependency-capacity]')).toHaveLength(1);
      const durationFilter = host.querySelector<HTMLInputElement>('[data-duration]');
      expect(durationFilter?.max).toBe(String(TRACE_DURATION_FILTER_MAXIMUM));
      expect(durationFilter?.step).toBe('0.01');
      expect(state.spanCapacity).toBe(4096);
      expect(state.dependencyCapacity).toBe(250_000);
      const lodFade = host.querySelector<HTMLInputElement>('[data-lod-fade]');
      expect(lodFade).not.toBeNull();
      expect(lodFade!.checked).toBe(false);
      expect(state.lodFadeEnabled).toBe(false);
      const overviewPanel = host.querySelector<HTMLElement>('[data-trace-tab-panel="overview"]');
      const filtersPanel = host.querySelector<HTMLElement>('[data-trace-tab-panel="filters"]');
      const graphPanel = host.querySelector<HTMLElement>('[data-trace-tab-panel="graph"]');
      expect(overviewPanel?.querySelector('[data-overview-mode]')).not.toBeNull();
      expect(overviewPanel?.querySelector('[data-dependency-display-budget]')).not.toBeNull();
      const dependencyRouting = overviewPanel?.querySelector<HTMLSelectElement>(
        '[data-dependency-routing]'
      );
      expect(dependencyRouting).not.toBeNull();
      expect(dependencyRouting!.value).toBe('auto');
      expect(state.dependencyRouting).toBe('auto');
      dependencyRouting!.value = 'bundled';
      dependencyRouting!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.dependencyRouting).toBe('bundled');
      dependencyRouting!.value = 'auto';
      dependencyRouting!.dispatchEvent(new Event('change', {bubbles: true}));
      const minimap = overviewPanel?.querySelector<HTMLInputElement>('[data-minimap]');
      expect(minimap).not.toBeNull();
      expect(minimap!.checked).toBe(true);
      expect(state.minimapEnabled).toBe(true);
      minimap!.checked = false;
      minimap!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.minimapEnabled).toBe(false);
      minimap!.checked = true;
      minimap!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(overviewPanel?.querySelector('[data-density-pattern]')).not.toBeNull();
      expect(overviewPanel?.querySelector('[data-overview-comparison]')).not.toBeNull();
      expect(filtersPanel?.querySelector('[data-overview-mode]')).toBeNull();
      const pickingMode = host.querySelector<HTMLSelectElement>('[data-picking-mode]');
      expect(pickingMode).not.toBeNull();
      expect(graphPanel?.querySelector('[data-picking-mode]')).toBe(pickingMode);
      expect(overviewPanel?.querySelector('[data-picking-mode]')).toBeNull();
      expect(pickingMode!.value).toBe('raster');
      expect(state.pickingMode).toBe('raster');
      pickingMode!.value = 'compute';
      pickingMode!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.pickingMode).toBe('compute');
      pickingMode!.value = 'raster';
      pickingMode!.dispatchEvent(new Event('change', {bubbles: true}));
      const dependencyDisplayBudget = host.querySelector<HTMLSelectElement>(
        '[data-dependency-display-budget]'
      );
      expect(dependencyDisplayBudget).not.toBeNull();
      expect(Number(dependencyDisplayBudget!.value)).toBe(TRACE_DEPENDENCY_DISPLAY_BUDGET);
      expect(state.dependencyDisplayBudget).toBe(TRACE_DEPENDENCY_DISPLAY_BUDGET);
      dependencyDisplayBudget!.value = '512';
      dependencyDisplayBudget!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.dependencyDisplayBudget).toBe(512);
      dependencyDisplayBudget!.value = String(TRACE_DEPENDENCY_DISPLAY_BUDGET);
      dependencyDisplayBudget!.dispatchEvent(new Event('change', {bubbles: true}));
      const analysisScope = host.querySelector<HTMLSelectElement>('[data-analysis-scope]');
      expect(analysisScope).not.toBeNull();
      expect(analysisScope!.value).toBe('viewport');
      const analysisScopeOptions = host.querySelectorAll<HTMLButtonElement>(
        '[data-analysis-scope-option]'
      );
      expect(analysisScopeOptions).toHaveLength(3);
      expect(analysisScopeOptions[0].getAttribute('aria-pressed')).toBe('false');
      expect(analysisScopeOptions[1].getAttribute('aria-pressed')).toBe('true');
      expect(host.querySelector('[data-aggregation-summary]')).not.toBeNull();
      expect(host.querySelector('[data-operation-aggregations]')).not.toBeNull();
      expect(host.querySelector('[data-duration-histogram]')).not.toBeNull();
      expect(host.querySelector('[data-utilization]')).not.toBeNull();
      const graphDiagnostic = host.querySelector<HTMLElement>('[data-graph-diagnostic]');
      expect(graphDiagnostic?.hidden).toBe(true);
      state.setDatasetStatus('GPU build failed: synthetic validation failure');
      expect(graphDiagnostic?.hidden).toBe(false);
      expect(graphDiagnostic?.textContent).toContain('Graph validation stopped submission');
      state.setDatasetStatus('Ready');
      expect(graphDiagnostic?.hidden).toBe(true);
      const openAnalysis = host.querySelector<HTMLButtonElement>('[data-open-analysis]');
      openAnalysis!.click();
      expect(
        host
          .querySelector<HTMLButtonElement>('[data-trace-tab="analysis"]')
          ?.getAttribute('aria-selected')
      ).toBe('true');
      expect(host.querySelector<HTMLElement>('[data-trace-tab-panel="analysis"]')?.hidden).toBe(
        false
      );
      const dependencyCapacity = host.querySelector<HTMLSelectElement>(
        '[data-dependency-capacity]'
      );
      expect(dependencyCapacity).not.toBeNull();
      const initialCompileCount = state.compileCount;
      dependencyCapacity!.dispatchEvent(new Event('input', {bubbles: true}));
      expect(state.compileCount).toBe(initialCompileCount);
      dependencyCapacity!.dispatchEvent(new Event('change', {bubbles: true}));
      await vi.waitFor(() => expect(state.compileCount).toBe(initialCompileCount + 1), {
        timeout: 20_000
      });

      await renderFrame();
      await vi.waitFor(() => expect(state.initialDependencyWarmup).toBe(false), {
        timeout: 20_000
      });
      const graphInspection = state.graphInspector.getSnapshot().graphs[0];
      expect(graphInspection.encodingCount).toBe(1);
      expect(
        graphInspection.counters.find(counter => counter.id === 'persistent-bytes')?.latestValue
      ).toBeGreaterThan(0);
      expect(
        graphInspection.counters.find(counter => counter.id === 'largest-buffer-bytes')?.latestValue
      ).toBeGreaterThan(0);
      const candidateSpanPercent = graphInspection.counters.find(
        counter => counter.id === 'candidate-span-percent'
      )?.latestValue;
      expect(candidateSpanPercent).toBeGreaterThanOrEqual(0);
      expect(candidateSpanPercent).toBeLessThanOrEqual(100);
      state.latestSelectionPickRequestIdentifier = 1;
      state.pendingPick = {
        time: 0,
        lane: 0,
        requestIdentifier: 1,
        intent: 'select',
        clientX: 0,
        clientY: 0
      };
      await renderFrame();
      expect(state.pendingPick).toBeNull();
      const firstFrame = await state.resources.drawCommands.buffer.readAsync();
      const firstCounts = new Uint32Array(
        firstFrame.buffer,
        firstFrame.byteOffset,
        firstFrame.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(firstCounts[1] + firstCounts[5] + firstCounts[9]).toBeGreaterThan(0);
      const visibleDependencyCount = state.resources.dependencyChunks.reduce(
        (sum, chunk) => sum + firstCounts[chunk.drawCommandIndex * 4 + 1],
        0
      );
      expect(visibleDependencyCount).toBeGreaterThan(0);
      expect(visibleDependencyCount).toBeLessThanOrEqual(TRACE_DEPENDENCY_DISPLAY_BUDGET);
      const visibleSpanBytes = await state.resources.spanChunks[0].visibleIds.readAsync();
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
      for (const chunk of state.resources.dependencyChunks) {
        const instanceCount = firstCounts[chunk.drawCommandIndex * 4 + 1];
        const visibleDependencyBytes = await chunk.visibleIds.readAsync();
        const visibleDependencyIds = new Uint32Array(
          visibleDependencyBytes.buffer,
          visibleDependencyBytes.byteOffset,
          instanceCount
        );
        expect(new Set(visibleDependencyIds).size).toBe(visibleDependencyIds.length);
        expect(
          Array.from(visibleDependencyIds).every(
            dependencyIndex => dependencyIndex < chunk.dependencyCount
          )
        ).toBe(true);
        const dependencyResultBytes = await chunk.results.readAsync();
        const dependencyResults = new Uint32Array(
          dependencyResultBytes.buffer,
          dependencyResultBytes.byteOffset,
          dependencyResultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
        );
        for (const dependencyIndex of visibleDependencyIds) {
          const endpointOffset = chunk.dependencyCount + dependencyIndex * 2;
          const sourceSpanIndex = dependencyResults[endpointOffset];
          const destinationSpanIndex = dependencyResults[endpointOffset + 1];
          expect(sourceSpanIndex).toBeLessThan(state.resources.spanCount);
          expect(destinationSpanIndex).toBeLessThan(state.resources.spanCount);
          expect(sourceSpanIndex).not.toBe(destinationSpanIndex);
        }
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
      const densityCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
      const pickCandidateBytes =
        await state.resources.pickCandidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(densityCandidateBytes.buffer, densityCandidateBytes.byteOffset, 3)[1]
      ).toBe(0);
      expect(new Uint32Array(pickCandidateBytes.buffer, pickCandidateBytes.byteOffset, 3)[1]).toBe(
        0
      );
      const dependencyCandidateCount = await readDependencyCandidateCount();
      expect(dependencyCandidateCount).toBeGreaterThan(0);
      expect(dependencyCandidateCount).toBeLessThanOrEqual(state.resources.dependencyBatchCount);
      await vi.waitFor(() => expect(state.gpuFrameInFlight).toBe(false), {timeout: 20_000});

      const autoScroll = host.querySelector<HTMLInputElement>('[data-auto-scroll]');
      expect(autoScroll).not.toBeNull();
      autoScroll!.checked = false;
      autoScroll!.dispatchEvent(new Event('change', {bubbles: true}));
      const overviewMode = host.querySelector<HTMLSelectElement>('[data-overview-mode]');
      expect(overviewMode).not.toBeNull();
      overviewMode!.value = 'density';
      overviewMode!.dispatchEvent(new Event('change', {bubbles: true}));
      const initialView = {...state.view};
      state.view = {timeMin: 0, timeMax: 82, laneMin: 0, laneMax: 72};
      await renderFrame(2000);
      const hardDensityCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(
          hardDensityCandidateBytes.buffer,
          hardDensityCandidateBytes.byteOffset,
          3
        )[1]
      ).toBeGreaterThan(0);
      expect(await readDependencyCandidateCount()).toBe(0);
      await vi.waitFor(() => expect(state.gpuFrameInFlight).toBe(false), {timeout: 20_000});

      lodFade!.checked = true;
      lodFade!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.lodFadeEnabled).toBe(true);
      await renderFrame(2000);
      const smoothDensityCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
      expect(
        new Uint32Array(
          smoothDensityCandidateBytes.buffer,
          smoothDensityCandidateBytes.byteOffset,
          3
        )[1]
      ).toBeGreaterThan(0);
      const smoothDrawCommandBytes = await state.resources.drawCommands.buffer.readAsync();
      const smoothDrawCommands = new Uint32Array(
        smoothDrawCommandBytes.buffer,
        smoothDrawCommandBytes.byteOffset,
        smoothDrawCommandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(smoothDrawCommands[1] + smoothDrawCommands[5] + smoothDrawCommands[9]).toBeGreaterThan(
        0
      );
      expect(await readDependencyCandidateCount()).toBeGreaterThan(0);
      await vi.waitFor(() => expect(state.gpuFrameInFlight).toBe(false), {timeout: 20_000});
      lodFade!.checked = false;
      lodFade!.dispatchEvent(new Event('change', {bubbles: true}));
      overviewMode!.value = 'auto';
      overviewMode!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.lodFadeEnabled).toBe(false);
      state.view = initialView;

      const firstGroup = host.querySelector<HTMLInputElement>('[data-group="0"]');
      expect(firstGroup).not.toBeNull();
      firstGroup!.checked = false;
      firstGroup!.dispatchEvent(new Event('change', {bubbles: true}));
      await renderFrame();
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

      await renderFrame();
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
      await renderFrame();
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

      await renderFrame();
      const focusedFrame = await state.resources.drawCommands.buffer.readAsync();
      const focusedCounts = new Uint32Array(
        focusedFrame.buffer,
        focusedFrame.byteOffset,
        focusedFrame.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      const focusedSpanCount = focusedCounts[1] + focusedCounts[5] + focusedCounts[9];
      expect(focusedSpanCount).toBeGreaterThan(0);
      expect(focusedSpanCount).toBeLessThan(state.resources.spanCount);
      expect(state.resources.reachedSpans.byteLength).toBe(
        Math.ceil(state.resources.spanCount / 32) * Uint32Array.BYTES_PER_ELEMENT
      );
      const reachedBytes = await state.resources.reachedSpans.readAsync(
        0,
        Uint32Array.BYTES_PER_ELEMENT
      );
      const reachedWord = new Uint32Array(reachedBytes.buffer, reachedBytes.byteOffset, 1)[0];
      expect(reachedWord & (1 << 29)).not.toBe(0);
      focusOnly!.checked = false;
      focusOnly!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.focusOnly).toBe(false);
      await renderFrame(1);
      const densityFrame = await state.resources.drawCommands.buffer.readAsync();
      const densityCounts = new Uint32Array(
        densityFrame.buffer,
        densityFrame.byteOffset,
        densityFrame.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      const wideSpanCount = densityCounts[1] + densityCounts[5] + densityCounts[9];
      expect(wideSpanCount).toBeGreaterThan(0);
      expect(wideSpanCount).toBeLessThan(state.resources.spanCount);
      expect(
        state.resources.dependencyChunks.reduce(
          (sum, chunk) => sum + densityCounts[chunk.drawCommandIndex * 4 + 1],
          0
        )
      ).toBe(0);
      const densityModeCandidateBytes =
        await state.resources.densityCandidateDispatchCommands.buffer.readAsync();
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

      host.querySelector<HTMLButtonElement>('[data-fit-trace]')!.click();
      expect(state.view.timeMin).toBe(0);
      expect(state.view.timeMax).toBe(state.traceDuration);
      expect(state.view.laneMin).toBe(0);
      expect(state.view.laneMax).toBeGreaterThan(0);
      expect(state.view.laneMax).toBeLessThanOrEqual(TRACE_DISPLAY_LANE_CAPACITY);
      host.querySelector<HTMLButtonElement>('[data-reset]')!.click();
      expect(state.view).toEqual({
        timeMin: 0,
        timeMax: Math.min(150, state.traceDuration),
        laneMin: 0,
        laneMax: 72
      });
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);

  test('renders exact spans and dependencies from multiple bounded source chunks', async () => {
    const device = await getWebGPUTestDevice('max');
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
    const spanChunkByteLength =
      TRACE_SPAN_BATCH_CAPACITY * TRACE_SPAN_RECORD_WORD_LENGTH * Uint32Array.BYTES_PER_ELEMENT;
    const dependencyChunkByteLength =
      TRACE_DEPENDENCY_BATCH_CAPACITY *
      4 *
      TRACE_DEPENDENCY_RECORD_WORD_LENGTH *
      Uint32Array.BYTES_PER_ELEMENT;
    const adjacencyChunkByteLength = 16 * 1024;
    let viewer: GPUTraceViewerAnimationLoopTemplate | null = null;
    try {
      viewer = new GPUTraceViewerAnimationLoopTemplate({
        device,
        traceCapacity: 4096,
        dependencyCapacity: 250_000,
        spanChunkByteLength,
        dependencyChunkByteLength,
        adjacencyChunkByteLength
      } as AnimationProps & {
        traceCapacity: number;
        dependencyCapacity: number;
        spanChunkByteLength: number;
        dependencyChunkByteLength: number;
        adjacencyChunkByteLength: number;
      });
      const state = viewer as unknown as {
        resources: {
          drawCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          spanChunks: Array<{
            buffer: {byteLength: number};
            visibleIds: {readAsync: () => Promise<Uint8Array>};
            firstSpanIndex: number;
            spanCount: number;
          }>;
          spanDraws: Array<{commandIndex: number; chunkIndex: number}>;
          dependencyChunks: Array<{
            buffer: {byteLength: number};
            visibleIds: {readAsync: () => Promise<Uint8Array>};
            firstDependencyIndex: number;
            dependencyCount: number;
            drawCommandIndex: number;
          }>;
          outgoingAdjacencyChunks: Array<{
            topology: {byteLength: number};
            neighbors: {byteLength: number};
          }>;
          incomingAdjacencyChunks: Array<{
            topology: {byteLength: number};
            neighbors: {byteLength: number};
          }>;
          dependencyCount: number;
        };
        gpuFrameInFlight: boolean;
        initialDependencyWarmup: boolean;
      };

      await vi.waitFor(() => expect(state.resources).not.toBeNull(), {timeout: 20_000});
      const renderFrame = async (): Promise<void> => {
        await vi.waitFor(() => expect(state.gpuFrameInFlight).toBe(false), {timeout: 20_000});
        expect(
          viewer!.onRender({device, time: 6000, width: 2048, height: 1} as AnimationProps)
        ).toBe(true);
        device.submit();
        await vi.waitFor(() => expect(state.gpuFrameInFlight).toBe(false), {timeout: 20_000});
      };

      expect(state.resources.dependencyCount).toBeGreaterThan(0);
      expect(state.resources.spanChunks.length).toBeGreaterThan(1);
      expect(state.resources.dependencyChunks.length).toBeGreaterThan(1);
      expect(
        state.resources.outgoingAdjacencyChunks.length +
          state.resources.incomingAdjacencyChunks.length
      ).toBeGreaterThan(2);
      expect(state.resources.spanDraws.length).toBeGreaterThan(3);
      expect(
        state.resources.spanChunks.every(chunk => chunk.buffer.byteLength <= spanChunkByteLength)
      ).toBe(true);
      expect(
        state.resources.dependencyChunks.every(
          chunk => chunk.buffer.byteLength <= dependencyChunkByteLength
        )
      ).toBe(true);
      expect(
        [
          ...state.resources.outgoingAdjacencyChunks,
          ...state.resources.incomingAdjacencyChunks
        ].every(
          chunk =>
            chunk.topology.byteLength <= adjacencyChunkByteLength &&
            chunk.neighbors.byteLength <= adjacencyChunkByteLength
        )
      ).toBe(true);

      await renderFrame();
      await vi.waitFor(() => expect(state.initialDependencyWarmup).toBe(false), {
        timeout: 20_000
      });
      await renderFrame();
      const drawCommandBytes = await state.resources.drawCommands.buffer.readAsync();
      const drawCommands = new Uint32Array(
        drawCommandBytes.buffer,
        drawCommandBytes.byteOffset,
        drawCommandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      const visibleSpanCount = state.resources.spanDraws.reduce(
        (count, draw) => count + drawCommands[draw.commandIndex * 4 + 1],
        0
      );
      expect(visibleSpanCount).toBeGreaterThan(0);
      for (const draw of state.resources.spanDraws) {
        const chunk = state.resources.spanChunks[draw.chunkIndex];
        const visibleIdBytes = await chunk.visibleIds.readAsync();
        const visibleIds = new Uint32Array(
          visibleIdBytes.buffer,
          visibleIdBytes.byteOffset,
          visibleIdBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
        );
        const instanceCount = drawCommands[draw.commandIndex * 4 + 1];
        const firstInstance = drawCommands[draw.commandIndex * 4 + 3];
        const drawIds = Array.from(
          visibleIds.subarray(firstInstance, firstInstance + instanceCount)
        );
        expect(drawIds).toEqual([...drawIds].sort((left, right) => left - right));
        expect(
          drawIds.every(
            spanIndex =>
              spanIndex >= chunk.firstSpanIndex &&
              spanIndex < chunk.firstSpanIndex + chunk.spanCount
          )
        ).toBe(true);
      }
      expect(
        state.resources.dependencyChunks.reduce(
          (sum, chunk) => sum + drawCommands[chunk.drawCommandIndex * 4 + 1],
          0
        )
      ).toBeGreaterThan(0);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);
});
