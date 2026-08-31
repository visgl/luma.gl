// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {getTraceRow, makeDeckTraceData} from '../../examples/deck/gpu-culled-trace/trace-data';
import {FillPattern, fillPatternShaderPlugin} from '../../examples/fill-pattern-shader-plugin';
import {
  GPU_CORE_FEATURE_CARDS,
  GPU_TRACE_FEATURE_CARDS,
  getTraceFeatureCardsHtml
} from '../../examples/experimental/gpu-trace-viewer/trace-feature-cards';
import {
  getTraceAllocationStats,
  getTraceCapacityContract,
  getTraceDatasetPreflight,
  makeTraceCertificationReport,
  getTraceOverviewFrameTimingSummary,
  getTracePixelMipmapCapacityContract,
  getTraceScanTimingSummary,
  getTraceWorkloadCounters,
  TRACE_BENCHMARK_CAPACITIES,
  TRACE_BENCHMARK_SCENARIOS,
  TRACE_CERTIFICATION_DURATION_MILLISECONDS
} from '../../examples/experimental/gpu-trace-viewer/trace-benchmark';
import {
  getMaximumTraceAdjacencyByteLength,
  getTraceCapacityOptions,
  getTraceDatasetTransferables,
  getTraceDensityBinParameters,
  getTraceDensityBlend,
  getTraceDependencyDisplayBudget,
  getTraceDependencyCapacityOptions,
  getTraceDuration,
  getTraceFocusFrontierCapacity,
  getTraceOverviewRenderer,
  getTraceTemporalIndexLevel,
  isTraceDependencyBundlingEnabled,
  isTraceDensityMode,
  makeTraceAdjacencyChunks,
  makeTraceDataset,
  makeTraceDependencyChunkBatchIndex,
  makeTraceDependencyChunks,
  makeTraceDependencyBatches,
  makeTraceGroups,
  makeTraceSpanBatches,
  makeTraceSpanChunks,
  makeTraceTemporalIndex,
  releaseTraceDatasetStorage,
  TRACE_ADJACENCY_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_CROSS_PROCESS_DEPENDENCY,
  TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
  TRACE_DEPENDENCY_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_DEPENDENCY_FRAME_BATCH_BUDGET,
  TRACE_DEPENDENCY_FULL_DENSITY_ZOOM,
  TRACE_DEPENDENCY_OVERVIEW_DENSITY_FRACTION,
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DISPLAY_LANE_CAPACITY,
  TRACE_DEPENDENCY_RECORD_WORD_LENGTH,
  TRACE_DURATION_FILTER_MAXIMUM,
  TRACE_FOCUS_FRONTIER_MAXIMUM_CAPACITY,
  TRACE_GROUPS,
  TRACE_INVALID_SPAN_INDEX,
  TRACE_LANE_COUNT,
  TRACE_LANES_PER_THREAD,
  TRACE_PARENT_DEPENDENCY_FLAG,
  TRACE_PROCESS_COUNT,
  TRACE_SAME_PROCESS_DEPENDENCY,
  TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
  TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_SPAN_RECORD_WORD_LENGTH,
  TRACE_THREAD_COUNT,
  TRACE_THREADS_PER_PROCESS,
  TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH,
  type TraceAdjacencyData
} from '../../examples/experimental/gpu-trace-viewer/trace-data';
import {
  getBatchVisibilityShader,
  getCandidateDensityShader,
  getCandidateDependencySpanVisibilityShader,
  getCandidateDependencyVisibilityShader,
  getCandidateLabelShader,
  getCandidatePassDispatchShader,
  getCandidatePickShader,
  getCandidateRepresentativeSelectionShader,
  getCandidateVisibilityShader,
  getDensityClearShader,
  getDependencyBatchVisibilityShader,
  getDependencyDispatchBudgetShader,
  getDependencyDisplayBudgetClearShader,
  getDependencyDisplayBudgetShader,
  getDependencyEndpointResolveShader,
  getDependencyIntersectionVisibilityShader,
  getDependencyPickResolveShader,
  getDependencyPickShader,
  getFocusFrontierClearShader,
  getFocusFrontierDispatchShader,
  getFocusFrontierExpansionShader,
  getFocusFrontierSeedShader,
  getFocusOverflowClearShader,
  getFocusReachabilityClearShader,
  getPickClearShader,
  getPickResolveShader,
  getRepresentativeBestClearShader,
  getRepresentativeDurationNominationShader,
  getRepresentativeIdNominationShader,
  getRepresentativeVisibilityPublishShader,
  getSpanVisibilityClearShader,
  getTraceDrawCommandsShader,
  getTraceLabelClearShader,
  getTraceMinimapRenderShader,
  TRACE_DENSITY_RENDER_SHADER,
  TRACE_DEPENDENCY_PICKING_RENDER_SHADER,
  TRACE_DEPENDENCY_RENDER_SHADER,
  TRACE_LABEL_RENDER_SHADER,
  TRACE_PICKING_RENDER_SHADER,
  TRACE_RENDER_SHADER
} from '../../examples/experimental/gpu-trace-viewer/trace-shaders';
import {
  getTraceAggregationFilterSignature,
  getTraceAnalysisWindow
} from '../../examples/experimental/gpu-trace-viewer/trace-analytics-state';
import {
  getAggregationWindowSelectionShader,
  getAnomalyErrorMaskShader,
  getViewportAggregationClearShader,
  getViewportAggregationFinalizeShader,
  getViewportAggregationShader
} from '../../examples/experimental/gpu-trace-viewer/trace-analytics-shaders';
import {
  getTraceViewerURLPreset,
  shouldRenderTraceFrame,
  TraceGenerationState,
  updateTraceViewerURLPreset
} from '../../examples/experimental/gpu-trace-viewer/trace-viewer-state';

it('trace viewer URL presets are device-qualified and shareable', () => {
  const supportedSpans = [250_000, 1_000_000, 4_000_000];
  const supportedDependencies = [0, ...supportedSpans];

  expect(
    getTraceViewerURLPreset(
      '?spans=1000000&dependencies=4000000',
      supportedSpans,
      supportedDependencies
    ),
    'supported preset values are restored'
  ).toEqual({spanCapacity: 1_000_000, dependencyCapacity: 4_000_000});
  expect(
    getTraceViewerURLPreset(
      '?spans=25000000&dependencies=oops',
      supportedSpans,
      supportedDependencies
    ),
    'unsupported or malformed values cannot bypass device-qualified controls'
  ).toEqual({spanCapacity: undefined, dependencyCapacity: undefined});

  let replacement = '';
  updateTraceViewerURLPreset(
    {pathname: '/examples/experimental/gpu-trace-viewer', search: '?revision=test', hash: '#view'},
    {
      replaceState: (_data, _unused, url) => {
        replacement = String(url);
      }
    },
    {spanCapacity: 250_000, dependencyCapacity: 1_000_000}
  );
  expect(
    replacement,
    'full-page controls persist a shareable URL without dropping unrelated parameters'
  ).toBe(
    '/examples/experimental/gpu-trace-viewer?revision=test&spans=250000&dependencies=1000000#view'
  );

  replacement = '';
  updateTraceViewerURLPreset(
    {pathname: '/docs/api-reference/experimental/gpu-trace', search: '', hash: ''},
    {
      replaceState: () => {
        replacement = 'changed';
      }
    },
    {spanCapacity: 250_000, dependencyCapacity: 250_000}
  );
  expect(replacement, 'embedded documentation examples do not rewrite the guide URL').toBe('');
  void 0;
});

it('trace generation cancels stale work and idle views do not render', () => {
  const generationState = new TraceGenerationState();
  const firstGeneration = generationState.begin();
  const secondGeneration = generationState.begin();

  expect(
    Boolean(generationState.isCurrent(firstGeneration)),
    'a replacement cancels stale generation'
  ).toBe(false);
  expect(
    Boolean(generationState.isCurrent(secondGeneration)),
    'the latest generation may publish'
  ).toBe(true);
  expect(
    Boolean(
      shouldRenderTraceFrame({
        gpuFrameInFlight: false,
        renderSignature: 'unchanged',
        lastRenderSignature: 'unchanged'
      })
    ),
    'an unchanged idle view does not encode GPU work'
  ).toBe(false);
  expect(
    Boolean(
      shouldRenderTraceFrame({
        gpuFrameInFlight: false,
        renderSignature: 'changed',
        lastRenderSignature: 'unchanged'
      })
    ),
    'an invalidated view encodes one new frame'
  ).toBe(true);
  generationState.finalize();
  expect(
    Boolean(generationState.isCurrent(secondGeneration)),
    'finalization rejects pending publication'
  ).toBe(false);
  void 0;
});

it('trace analytics cache identity includes scope and selection generation inputs', () => {
  const base = {
    enabledMask: 7,
    statusMask: 15,
    activeFilterMask: 0,
    minimumDuration: 1
  };
  const viewport = getTraceAggregationFilterSignature({...base, scope: 'viewport'});
  const interval = getTraceAggregationFilterSignature({...base, scope: 'interval'});
  const fullTrace = getTraceAggregationFilterSignature({...base, scope: 'trace'});

  expect(viewport, 'viewport and measured intervals cannot share cached output').not.toBe(interval);
  expect(viewport, 'viewport and full-trace paths cannot share cached output').not.toBe(fullTrace);
  expect(
    getTraceAnalysisWindow({
      scope: 'trace',
      traceDuration: 100,
      viewport: [20, 40],
      measured: [50, 60]
    }),
    'full-trace analysis owns the complete domain'
  ).toEqual([0, 100]);
});

it('GPU trace feature cards expose concrete GPUGraph and gpu-trace capabilities', () => {
  expect(GPU_CORE_FEATURE_CARDS.length, 'lists the GPU Core capability contract').toBe(17);
  expect(GPU_TRACE_FEATURE_CARDS.length, 'lists the GPU Trace capability contract').toBe(19);
  const graphHtml = getTraceFeatureCardsHtml(GPU_CORE_FEATURE_CARDS, 'GPU Core');
  const traceHtml = getTraceFeatureCardsHtml(GPU_TRACE_FEATURE_CARDS, 'GPU Trace');
  expect(
    Boolean(graphHtml.includes('Conditional execution')),
    'renders conditional graph work'
  ).toBe(true);
  expect(
    Boolean(graphHtml.includes('Aliasing validation')),
    'renders compile-time alias validation'
  ).toBe(true);
  expect(
    Boolean(traceHtml.includes('Temporal candidates')),
    'renders the temporal-index contract'
  ).toBe(true);
  expect(
    Boolean(traceHtml.includes('25M span capacity posture')),
    'renders the scale contract'
  ).toBe(true);
  void 0;
});

it('deck GPU trace copies complete canonical span records', () => {
  const count = 7;
  const deckData = makeDeckTraceData(count);
  const groups = makeTraceGroups(count);
  let rowIndex = 0;

  for (const group of groups) {
    const sourceFloats = new Float32Array(
      group.data.buffer,
      group.data.byteOffset,
      group.data.length
    );
    for (let groupRowIndex = 0; groupRowIndex < group.count; groupRowIndex++, rowIndex++) {
      const sourceWordOffset = groupRowIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
      expect(
        getTraceRow(deckData, rowIndex),
        `deck row ${rowIndex} preserves canonical span geometry and group identity`
      ).toEqual({
        name: deckData.names[rowIndex],
        group: group.name,
        start: sourceFloats[sourceWordOffset],
        duration: sourceFloats[sourceWordOffset + 1],
        lane: group.data[sourceWordOffset + 2]
      });
    }
  }

  expect(rowIndex, 'all canonical span rows are copied').toBe(count);
  void 0;
});

it('GPU trace capacity options adapt to negotiated WebGPU buffer limits', () => {
  expect(
    getTraceCapacityOptions(128 * 1024 * 1024, 256 * 1024 * 1024),
    'portable limits expose twenty-five million spans through chunked source storage'
  ).toEqual([250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000]);
  expect(
    getTraceDependencyCapacityOptions(128 * 1024 * 1024, 256 * 1024 * 1024),
    'dependency chunking removes the single-binding ceiling'
  ).toEqual([0, 250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000]);
  expect(
    getTraceCapacityOptions(256 * 1024 * 1024, 1024 * 1024 * 1024),
    'chunking removes the single-binding ceiling'
  ).toEqual([250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000]);
  expect(
    getTraceCapacityOptions(1024 * 1024 * 1024, 1024 * 1024 * 1024),
    'maximum adapters expose the twenty-five-million-span demonstration'
  ).toEqual([250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000]);
  void 0;
});

it('GPU trace pixel mipmap preflight separates compact and indexed storage', () => {
  const maximumChunkSpanCount =
    TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH /
    (TRACE_SPAN_RECORD_WORD_LENGTH * Uint32Array.BYTES_PER_ELEMENT);
  const routine = getTracePixelMipmapCapacityContract(
    4_000_000,
    TRACE_LANE_COUNT,
    maximumChunkSpanCount,
    1920
  );
  const maximum = getTracePixelMipmapCapacityContract(
    25_000_000,
    TRACE_LANE_COUNT,
    maximumChunkSpanCount,
    1920
  );

  expect(routine.chunkCount, '4M spans retain two 64 MiB canonical source chunks').toBe(2);
  expect(maximum.chunkCount, '25M spans retain twelve independently bindable chunks').toBe(12);
  expect(maximum.rowOrderByteLength, 'compact ordering costs one word per span').toBe(100_000_000);
  expect(
    maximum.rangeMaximumTreeByteLength,
    'optional power-of-two range trees are reported separately'
  ).toBe(201_326_592);
  expect(
    maximum.compactPersistentByteLength,
    'compact search includes row order, lane offsets, and bounded representatives'
  ).toBe(123_605_296);
  expect(
    maximum.indexedPersistentByteLength,
    'indexed mode makes its additional memory cost explicit before allocation'
  ).toBe(324_931_888);
  expect(
    maximum.largestPersistentBufferByteLength,
    'every added persistent binding stays far below the 64 MiB canonical chunk target'
  ).toBe(16 * 1024 * 1024);
  expect(
    maximum.maximumTransientBufferByteLength,
    'view-dependent scratch remains bounded by lane and viewport dimensions'
  ).toBe(TRACE_LANE_COUNT * 1920 * 2 * Uint32Array.BYTES_PER_ELEMENT);
  expect(
    Boolean(routine.indexedPersistentByteLength < maximum.indexedPersistentByteLength),
    'the same contract records scale-dependent memory before enabling the tree'
  ).toBe(true);
  void 0;
});

it('GPU trace focus frontiers scale with reachable dependency population', () => {
  expect(
    getTraceFocusFrontierCapacity(100_000_000, 250_000),
    'a sparse 100M-span trace allocates one frontier entry per dependency plus its seed'
  ).toBe(250_001);
  expect(
    getTraceFocusFrontierCapacity(100_000_000, 100_000_000),
    'a dense trace uses the bounded frontier and reports overflow separately'
  ).toBe(TRACE_FOCUS_FRONTIER_MAXIMUM_CAPACITY);
  expect(getTraceFocusFrontierCapacity(10, 10, 4), 'tests can inject a smaller bound').toBe(4);
  expect(
    getTraceFocusFrontierCapacity(0, 0),
    'an empty trace retains one allocation-safe frontier word'
  ).toBe(1);
  void 0;
});

it('GPU trace adjacency chunks preserve sparse CSR rows with local offsets', () => {
  const adjacency: TraceAdjacencyData = {
    nodes: Uint32Array.of(0, 2, 4, 7),
    offsets: Uint32Array.of(0, 2, 3, 6, 7),
    neighbors: Uint32Array.of(1, 3, 0, 2, 5, 6, 4)
  };
  const chunks = makeTraceAdjacencyChunks(adjacency, 5 * Uint32Array.BYTES_PER_ELEMENT);
  expect(chunks.length, 'the byte limit produces independently bindable partitions').toBe(2);
  expect(Array.from(chunks[0].topology), 'first CSR offsets are local').toEqual([0, 2, 0, 2, 3]);
  expect(Array.from(chunks[1].topology), 'second CSR offsets are local').toEqual([4, 7, 0, 3, 4]);
  expect(Array.from(chunks[0].neighbors), 'first neighbors remain ordered').toEqual([1, 3, 0]);
  expect(Array.from(chunks[1].neighbors), 'second neighbors remain ordered').toEqual([2, 5, 6, 4]);
  expect(
    Boolean(
      chunks.every(
        chunk =>
          chunk.topology.byteLength <= 5 * Uint32Array.BYTES_PER_ELEMENT &&
          chunk.neighbors.byteLength <= 5 * Uint32Array.BYTES_PER_ELEMENT
      )
    ),
    'both bindings honor the same limit'
  ).toBe(true);
  expect(
    makeTraceAdjacencyChunks({
      nodes: new Uint32Array(),
      offsets: Uint32Array.of(0),
      neighbors: new Uint32Array()
    }),
    'empty adjacency has no GPU chunks'
  ).toEqual([]);
  expect(
    () => makeTraceAdjacencyChunks(adjacency, Uint32Array.BYTES_PER_ELEMENT),
    'a row that cannot fit is rejected explicitly'
  ).toThrow(/row exceeds/);
  expect(
    TRACE_ADJACENCY_CHUNK_TARGET_BYTE_LENGTH,
    'production adjacency bindings retain the conservative target'
  ).toBe(64 * 1024 * 1024);
  void 0;
});

it('GPU trace span chunks preserve complete candidate batches and borrowed source rows', () => {
  const dataset = makeTraceDataset(2048, 0);
  const chunks = makeTraceSpanChunks(
    dataset.spans,
    dataset.spanBatches,
    300 * TRACE_SPAN_RECORD_WORD_LENGTH * Uint32Array.BYTES_PER_ELEMENT
  );
  expect(
    Boolean(chunks.length > 1),
    'small synthetic chunk limit creates multiple source buffers'
  ).toBe(true);
  expect(
    chunks.reduce((count, chunk) => count + chunk.spanCount, 0),
    'chunks cover every source span exactly once'
  ).toBe(dataset.spanCount);
  expect(
    Boolean(chunks.every(chunk => chunk.data.buffer === dataset.spans.buffer)),
    'chunk rows remain borrowed views of canonical source storage'
  ).toBe(true);
  expect(
    Boolean(
      chunks.every(chunk =>
        dataset.spanBatches
          .slice(chunk.firstBatchIndex, chunk.firstBatchIndex + chunk.batchCount)
          .every(
            batch =>
              batch.firstSpanIndex >= chunk.firstSpanIndex &&
              batch.firstSpanIndex + batch.count <= chunk.firstSpanIndex + chunk.spanCount
          )
      )
    ),
    'no candidate batch crosses a chunk boundary'
  ).toBe(true);
  expect(TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH, 'target stays portable').toBe(64 * 1024 * 1024);
  void 0;
});

it('GPU trace worker datasets transfer every owned allocation without copying shared views', () => {
  const dataset = makeTraceDataset(2048, 128);
  const transferables = getTraceDatasetTransferables(dataset);
  expect(new Set(transferables).size, 'each owned buffer transfers once').toBe(
    transferables.length
  );
  expect(
    Boolean(transferables.includes(dataset.spans.buffer)),
    'canonical spans transfer ownership'
  ).toBe(true);
  expect(
    Boolean(dataset.groups.every(group => group.data.buffer === dataset.spans.buffer)),
    'group views remain aliases of the transferred canonical span allocation'
  ).toBe(true);
  expect(
    Boolean(dataset.spanBatches.every(batch => batch.data.buffer === dataset.spans.buffer)),
    'batch views remain aliases of the transferred canonical span allocation'
  ).toBe(true);
  void 0;
});

it('GPU trace supremacy contract exposes standard scales and interaction scenarios', () => {
  expect(
    TRACE_BENCHMARK_CAPACITIES,
    'capacity scales remain stable for comparable benchmark runs'
  ).toEqual([250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000]);
  expect(
    TRACE_BENCHMARK_SCENARIOS.map(scenario => scenario.id),
    'interaction scenarios cover hierarchy, filtering, focus, picking, and adaptive LOD'
  ).toEqual([
    'exact-expanded',
    'exact-collapsed',
    'exact-filtered',
    'exact-focused',
    'exact-picking',
    'density',
    'representative'
  ]);
  expect(
    new Set(TRACE_BENCHMARK_SCENARIOS.map(scenario => scenario.id)).size,
    'scenario identifiers are unique'
  ).toBe(TRACE_BENCHMARK_SCENARIOS.length);
  void 0;
});

it('GPU trace certification report distinguishes complete, slow, and incomplete runs', () => {
  const samples = TRACE_BENCHMARK_SCENARIOS.flatMap(scenario =>
    Array.from({length: 4}, (_, sampleIndex) => ({
      scenarioId: scenario.id,
      renderer:
        scenario.id === 'density'
          ? ('density' as const)
          : scenario.id === 'representative'
            ? ('representative' as const)
            : ('exact' as const),
      frameTimeMilliseconds: 10 + sampleIndex,
      encodeTimeMilliseconds: 1,
      candidateSpanBatchCount: 12,
      candidateDependencyBatchCount: 8,
      visibleSpanCount: 1000,
      visibleDependencyCount: 256
    }))
  );
  const base = {
    createdAt: '2026-08-17T00:00:00.000Z',
    adapterKey: 'test-adapter',
    spanCount: 25_000_000,
    dependencyCount: 25_000_000,
    canvasWidth: 1920,
    canvasHeight: 1080,
    durationMilliseconds: TRACE_CERTIFICATION_DURATION_MILLISECONDS,
    persistentByteLength: 1_000_000_000,
    largestBufferByteLength: 64 * 1024 * 1024,
    maxStorageBufferBindingSize: 128 * 1024 * 1024,
    maxBufferSize: 256 * 1024 * 1024,
    deviceLost: false,
    queueStallCount: 0,
    deferredPickFrameCount: 0,
    samples,
    pickResponseMilliseconds: [20, 30, 40]
  };
  const passing = makeTraceCertificationReport(base);
  expect(passing.status, 'a complete bounded 25M run passes').toBe('pass');
  expect(passing.scenarios.length, '').toBe(TRACE_BENCHMARK_SCENARIOS.length);
  expect(passing.scenarios[0].frameP95Milliseconds, 'scenario percentiles are retained').toBe(13);

  const slow = makeTraceCertificationReport({
    ...base,
    samples: samples.map(sample =>
      sample.scenarioId === 'density' ? {...sample, frameTimeMilliseconds: 50} : sample
    )
  });
  expect(slow.status, 'a measured frame-time regression fails certification').toBe('fail');
  expect(Boolean(slow.failures.some(failure => failure.includes('density frame p95'))), '').toBe(
    true
  );

  const incomplete = makeTraceCertificationReport({
    ...base,
    spanCount: 4_000_000,
    dependencyCount: 4_000_000,
    samples: samples.filter(sample => sample.scenarioId !== 'exact-picking'),
    pickResponseMilliseconds: []
  });
  expect(incomplete.status, 'a non-25M run cannot claim certification').toBe('incomplete');
  expect(Boolean(incomplete.failures.some(failure => failure.includes('exactly 25M'))), '').toBe(
    true
  );

  const deviceLost = makeTraceCertificationReport({...base, deviceLost: true});
  expect(deviceLost.status, 'device loss is a hard certification failure').toBe('fail');
  void 0;
});

it('GPU trace capacity contract chunks spans and dependencies independently', () => {
  const portable = getTraceCapacityContract(10_000_000, 10_000_000, {
    maxStorageBufferBindingSize: 128 * 1024 * 1024,
    maxBufferSize: 256 * 1024 * 1024
  });
  expect(portable.spanBufferByteLength, '10M spans require a 320 MB source buffer').toBe(
    320_000_000
  );
  expect(
    portable.dependencyBufferByteLength,
    'the contract accounts for ten million actual dependency records'
  ).toBe(160_000_000);
  expect(portable.fitsDeviceLimits, 'portable limits reject the monolithic 10M source').toBe(false);
  expect(portable.spanChunkCount, 'portable chunk target splits the 320 MB source five ways').toBe(
    5
  );
  expect(
    portable.dependencyChunkCount,
    'portable chunk target splits the 160 MB dependency source three ways'
  ).toBe(3);
  expect(
    portable.adjacencyChunkCount,
    'the worst-case bidirectional sparse topology is independently chunked'
  ).toBe(4);
  expect(
    getTraceCapacityContract(10_000_000, 0, {
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 256 * 1024 * 1024
    }).fitsChunkedDeviceLimits,
    'portable limits admit ten million spans without dependencies'
  ).toBe(true);
  expect(
    getTraceCapacityContract(10_000_000, 250_000, {
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 256 * 1024 * 1024
    }).fitsChunkedDeviceLimits,
    'chunk-resolved endpoints admit dependencies without monolithic source allocations'
  ).toBe(true);

  const maximum = getTraceCapacityContract(10_000_000, 10_000_000, {
    maxStorageBufferBindingSize: 1024 * 1024 * 1024,
    maxBufferSize: 1024 * 1024 * 1024
  });
  expect(maximum.fitsDeviceLimits, 'maximum-context limits admit the same source layout').toBe(
    true
  );
  void 0;
});

it('GPU trace dataset preflight leaves routine sizes frictionless and flags extreme work', () => {
  const routine = getTraceDatasetPreflight(4_000_000, 4_000_000);
  const extreme = getTraceDatasetPreflight(25_000_000, 25_000_000);
  expect(routine.requiresConfirmation, 'the default 4M trace does not require confirmation').toBe(
    false
  );
  expect(extreme.requiresConfirmation, 'the 25M trace requires a soft confirmation').toBe(true);
  expect(
    Boolean(extreme.estimatedSourceByteLength > routine.estimatedSourceByteLength),
    'source topology estimates grow with trace size'
  ).toBe(true);
  expect(extreme.dependencyCount, 'preflight uses the requested actual dependency population').toBe(
    25_000_000
  );
  expect(extreme.minimumScanInvocationCount, 'preflight exposes the minimum full-data work').toBe(
    50_000_000
  );
  void 0;
});

it('GPU trace workload counters report persistent memory and proportional work', () => {
  const firstBuffer = {byteLength: 320};
  const allocation = getTraceAllocationStats([
    firstBuffer,
    firstBuffer,
    {byteLength: 160},
    {byteLength: 40}
  ]);
  expect(allocation, 'allocation accounting deduplicates shared buffer identities').toEqual({
    bufferCount: 3,
    persistentByteLength: 520,
    largestBufferByteLength: 320
  });
  const counters = getTraceWorkloadCounters({
    spanCount: 1000,
    dependencyCount: 400,
    spanBatchCount: 10,
    candidateSpanBatchCount: 2,
    dependencyBatchCount: 8,
    candidateDependencyBatchCount: 2,
    visibleSpanCount: 50,
    visibleDependencyCount: 12,
    collapsedProcessCount: 1,
    densityMode: false,
    overviewRenderer: 'representative',
    overviewLaneCount: TRACE_LANE_COUNT,
    overviewPixelCount: 100,
    overviewSpanChunkCount: 4,
    filterActive: true,
    focusActive: true,
    pickActive: false,
    allocation
  });
  expect(counters['candidate-span-percent'], 'span work is reported as a candidate ratio').toBe(20);
  expect(
    counters['candidate-dependency-percent'],
    'dependency work is reported as a candidate ratio'
  ).toBe(25);
  expect(counters['visible-span-percent'], 'visible output is normalized by source size').toBe(5);
  expect(counters['candidate-span-upper-bound'], 'candidate span work is bounded').toBe(512);
  expect(counters['candidate-dependency-upper-bound'], 'candidate dependency work is bounded').toBe(
    256
  );
  expect(counters['actual-output-rows'], 'actual visible output work stays separate').toBe(62);
  expect(counters['persistent-bytes'], 'persistent memory uses exact buffer accounting').toBe(520);
  expect(counters['filter-active'], 'interaction modes are exposed as numeric counters').toBe(1);
  expect(counters['pick-active'], 'inactive interaction modes remain explicit').toBe(0);
  expect(counters['overview-renderer'], 'representative mode has a stable scalar code').toBe(2);
  expect(
    counters['overview-output-upper-bound'],
    'representative output is bounded by lanes and pixel columns'
  ).toBe(TRACE_LANE_COUNT * 100);
  expect(
    counters['representative-search-cells'],
    'chunk-local representative searches remain separate from final output'
  ).toBe(TRACE_LANE_COUNT * 100 * 4);
  void 0;
});

it('GPU trace overview frame timings retain renderer-specific percentile semantics', () => {
  expect(getTraceOverviewFrameTimingSummary([]), 'empty histories remain explicit').toBe(null);
  expect(
    getTraceOverviewFrameTimingSummary([8, 2, 5, 3, 20]),
    'nearest-rank percentiles do not mutate chronological samples'
  ).toEqual({
    sampleCount: 5,
    latestMilliseconds: 20,
    p50Milliseconds: 5,
    p95Milliseconds: 20
  });
  void 0;
});

it('GPU trace scan timing summary isolates and aggregates scan nodes', () => {
  const summary = getTraceScanTimingSummary(
    {
      graphs: [
        {
          id: 'trace',
          nodes: [
            {
              id: 'visibility-scan-level-0-scan',
              gpu: {sampleCount: 8, p50Milliseconds: 0.5, p95Milliseconds: 0.75}
            },
            {
              id: 'hierarchy-scan-level-0-add-offsets',
              gpu: {sampleCount: 7, p50Milliseconds: 0.25, p95Milliseconds: 0.25}
            },
            {
              id: 'draw-spans',
              gpu: {sampleCount: 8, p50Milliseconds: 1.5, p95Milliseconds: 2}
            }
          ]
        }
      ]
    },
    'trace'
  );
  expect(
    summary,
    'only scan stages contribute and the minimum common sample count is reported'
  ).toEqual({nodeCount: 2, sampleCount: 7, p50Milliseconds: 0.75, p95Milliseconds: 1});
  expect(getTraceScanTimingSummary({graphs: []}, 'trace'), 'missing samples return null').toBe(
    null
  );
  void 0;
});

it('GPU trace LOD switches at a stable trace-time-per-pixel threshold', () => {
  expect(getTraceDensityBlend(0, 50, 2000), 'exact rendering leads into the blend').toBe(0);
  expect(getTraceDensityBlend(0, 80, 2000), 'both renderers share the midpoint').toBe(0.5);
  expect(getTraceDensityBlend(0, 110, 2000), 'density rendering finishes the blend').toBe(1);
  expect(getTraceDensityBlend(0, 50, 2000, false), 'hard switch keeps the exact boundary').toBe(0);
  expect(getTraceDensityBlend(0, 79, 2000, false), 'hard switch stays exact below midpoint').toBe(
    0
  );
  expect(getTraceDensityBlend(0, 80, 2000, false), 'hard switch selects density at midpoint').toBe(
    1
  );
  expect(getTraceDensityBlend(0, 81, 2000, false), 'hard switch stays density above midpoint').toBe(
    1
  );
  expect(getTraceDensityBlend(0, 110, 2000, false), 'hard switch keeps density boundary').toBe(1);
  expect(isTraceDensityMode(0, 150, 2048), 'wide time range remains density-dominant').toBe(true);
  expect(isTraceDensityMode(0, 150, 1), 'zoomed-out viewport uses density bins').toBe(true);
  expect(isTraceDensityMode(10, 10.01, 0), 'zero-width viewport remains bounded').toBe(false);
  expect(
    getTraceOverviewRenderer(0, 50, 2000, 'auto', false),
    'auto keeps exact spans below the hard transition'
  ).toBe('exact');
  expect(
    getTraceOverviewRenderer(0, 80, 2000, 'density', false),
    'explicit density takes over at the hard transition'
  ).toBe('density');
  expect(
    getTraceOverviewRenderer(0, 80, 2000, 'representative', false),
    'explicit representatives take over at the hard transition'
  ).toBe('representative');
  expect(
    getTraceOverviewRenderer(0, 150, 2000, 'auto', false),
    'auto prefers canonical representatives at moderate overview scale'
  ).toBe('representative');
  expect(
    getTraceOverviewRenderer(0, 1000, 2000, 'auto', false),
    'auto retains density bins at extreme overview scale'
  ).toBe('density');
  expect(
    Boolean(isTraceDependencyBundlingEnabled(0, 4, 2000, 'auto')),
    'auto routing keeps readable close-up dependencies exact'
  ).toBe(false);
  expect(
    Boolean(isTraceDependencyBundlingEnabled(0, 5.1, 2000, 'auto')),
    'auto routing bundles dense exact views before the semantic handoff'
  ).toBe(true);
  expect(
    Boolean(isTraceDependencyBundlingEnabled(0, 80, 2000, 'auto')),
    'auto routing stays bundled through the semantic handoff'
  ).toBe(true);
  expect(
    Boolean(isTraceDependencyBundlingEnabled(0, 1000, 2000, 'exact')),
    'exact routing always disables bundling'
  ).toBe(false);
  expect(
    Boolean(isTraceDependencyBundlingEnabled(0, 50, 2000, 'bundled')),
    'bundled routing remains available at close zoom'
  ).toBe(true);
  void 0;
});

it('GPU trace dependency density rises smoothly and monotonically with zoom', () => {
  const maximumBudget = 2048;
  const traceDuration = 1000;
  const overviewBudget = getTraceDependencyDisplayBudget(
    maximumBudget,
    0,
    traceDuration,
    traceDuration
  );
  expect(
    overviewBudget,
    'the full-trace overview starts at a sparse fraction of the selected maximum'
  ).toBe(maximumBudget * TRACE_DEPENDENCY_OVERVIEW_DENSITY_FRACTION);

  const visibleDurations = [
    1000,
    500,
    250,
    125,
    62.5,
    traceDuration / TRACE_DEPENDENCY_FULL_DENSITY_ZOOM
  ];
  const budgets = visibleDurations.map(visibleDuration =>
    getTraceDependencyDisplayBudget(maximumBudget, 0, visibleDuration, traceDuration)
  );
  expect(
    Boolean(budgets.every((budget, index) => index === 0 || budget > budgets[index - 1])),
    'every equal multiplicative zoom step adds dependency lines'
  ).toBe(true);
  expect(budgets.at(-1), 'the configured zoom ratio reaches the selected maximum density').toBe(
    maximumBudget
  );
  expect(
    getTraceDependencyDisplayBudget(maximumBudget, 400, 525, traceDuration),
    'panning at a fixed zoom preserves the dependency budget'
  ).toBe(getTraceDependencyDisplayBudget(maximumBudget, 0, 125, traceDuration));
  expect(
    getTraceDependencyDisplayBudget(0, 0, traceDuration, traceDuration),
    'a disabled maximum remains disabled'
  ).toBe(0);
  void 0;
});

it('GPU trace density bins stay anchored while the viewport scrolls', () => {
  const first = getTraceDensityBinParameters(10, 110);
  const scrolled = getTraceDensityBinParameters(10.1, 110.1);
  const crossedBoundary = getTraceDensityBinParameters(10.3, 110.3);
  expect(first.duration, 'scrolling preserves the zoom-selected bin duration').toBe(
    scrolled.duration
  );
  expect(first.origin, 'sub-bin scrolling preserves the absolute bin anchor').toBe(scrolled.origin);
  const sampleTime = 50.1;
  const getSampleBinStart = ({origin, duration}: {origin: number; duration: number}): number =>
    origin + Math.floor((sampleTime - origin) / duration) * duration;
  expect(
    getSampleBinStart(first),
    'crossing a window boundary does not change absolute bin membership'
  ).toBe(getSampleBinStart(crossedBoundary));
  expect(
    getTraceDensityBinParameters(10, 210).duration,
    'zooming out selects the next power-of-two density level'
  ).toBe(first.duration * 2);
  void 0;
});

it('GPU trace adaptive LOD shaders parse as WGSL', () => {
  const spanChunk = {
    firstSpanIndex: 0,
    spanCount: 11,
    firstBatchIndex: 0,
    batchCount: 3
  };
  const endpointRouting = {
    dependencyCount: 7,
    spanChunks: [
      {...spanChunk, spanCount: 6, batchCount: 2},
      {firstSpanIndex: 6, spanCount: 5, firstBatchIndex: 2, batchCount: 1}
    ]
  };
  const shaders = [
    TRACE_RENDER_SHADER,
    TRACE_PICKING_RENDER_SHADER,
    TRACE_DEPENDENCY_RENDER_SHADER,
    TRACE_DEPENDENCY_PICKING_RENDER_SHADER,
    TRACE_DENSITY_RENDER_SHADER,
    TRACE_LABEL_RENDER_SHADER,
    getTraceMinimapRenderShader(7, 13, 5000),
    getBatchVisibilityShader(3),
    getPickClearShader(),
    getCandidateVisibilityShader(spanChunk),
    getCandidateRepresentativeSelectionShader(spanChunk),
    getRepresentativeBestClearShader(128),
    getRepresentativeDurationNominationShader(spanChunk, 128),
    getRepresentativeIdNominationShader(spanChunk, 128),
    getRepresentativeVisibilityPublishShader(spanChunk, 128),
    getTraceLabelClearShader(5),
    getCandidateLabelShader(spanChunk, 5),
    getCandidateDependencySpanVisibilityShader(spanChunk),
    getCandidatePassDispatchShader([
      {firstBatchIndex: 0, batchCount: 2},
      {firstBatchIndex: 2, batchCount: 1}
    ]),
    getDensityClearShader(),
    getSpanVisibilityClearShader(11),
    getCandidateDensityShader(spanChunk),
    getCandidatePickShader(spanChunk),
    getPickResolveShader(spanChunk),
    getTraceDrawCommandsShader([
      {firstBatchIndex: 0, batchCount: 2},
      {firstBatchIndex: 2, batchCount: 1}
    ]),
    getDependencyBatchVisibilityShader(3),
    getDependencyDispatchBudgetShader(TRACE_DEPENDENCY_FRAME_BATCH_BUDGET),
    getDependencyDisplayBudgetClearShader(5),
    getDependencyDisplayBudgetShader(128, 0, 2, 5),
    getDependencyPickShader(128, 0, 5),
    getDependencyPickResolveShader(0),
    getDependencyEndpointResolveShader(endpointRouting, 0),
    getDependencyEndpointResolveShader(endpointRouting, 1),
    getCandidateDependencyVisibilityShader(endpointRouting),
    getDependencyIntersectionVisibilityShader(128),
    getFocusReachabilityClearShader(1),
    getFocusOverflowClearShader(),
    getFocusFrontierSeedShader(11),
    getFocusFrontierClearShader(),
    getFocusFrontierExpansionShader({
      spanCount: 11,
      frontierCapacity: 5,
      nodeWordBase: 0,
      sourceNodeCount: 6,
      offsetWordBase: 0,
      neighborWordBase: 0,
      neighborCount: 4,
      depth: 0
    }),
    getFocusFrontierDispatchShader(5),
    getViewportAggregationClearShader(),
    getViewportAggregationShader(spanChunk),
    getViewportAggregationFinalizeShader(),
    getAggregationWindowSelectionShader(0, 11),
    getAnomalyErrorMaskShader(11, 3)
  ];
  for (const [shaderIndex, shader] of shaders.entries()) {
    try {
      expect(Boolean(new WgslReflect(shader)), 'shader parses').toBe(true);
    } catch (error) {
      throw new Error(`shader ${shaderIndex} failed to parse`, {cause: error});
    }
  }
  for (const chunkIndex of [0, 1]) {
    const shader = getDependencyEndpointResolveShader(endpointRouting, chunkIndex);
    expect(
      shader.match(/const CHUNK_INDEX:/g)?.length,
      `dependency endpoint shader ${chunkIndex} declares its chunk index once`
    ).toBe(1);
    expect(
      shader,
      `dependency endpoint shader ${chunkIndex} declares the selected chunk index`
    ).toMatch(new RegExp(`const CHUNK_INDEX: u32 = ${chunkIndex}u;`));
  }
  expect(
    getDependencyDispatchBudgetShader(TRACE_DEPENDENCY_FRAME_BATCH_BUDGET),
    'dependency dispatch budget is embedded in the GPU-side publisher'
  ).toMatch(new RegExp(`BATCH_BUDGET: u32 = ${TRACE_DEPENDENCY_FRAME_BATCH_BUDGET}u`));
  for (const chunkIndex of [0, 1]) {
    const shader = getDependencyEndpointResolveShader(endpointRouting, chunkIndex);
    expect(
      shader.match(/const CHUNK_INDEX:/g)?.length,
      `dependency endpoint shader ${chunkIndex} declares its chunk index once`
    ).toBe(1);
    expect(
      shader,
      `dependency endpoint shader ${chunkIndex} declares the selected chunk index`
    ).toMatch(new RegExp(`const CHUNK_INDEX: u32 = ${chunkIndex}u;`));
  }
  expect(
    getDependencyIntersectionVisibilityShader(128),
    'dependency visibility retains segments that cross the viewport'
  ).toMatch(/segmentIntersectsViewport\(first, second\)/);
  expect(
    getDependencyDisplayBudgetClearShader(5),
    'dependency display count is cleared before parallel selection'
  ).toMatch(/atomicStore\(&drawCommands\[DRAW_COUNT_WORD_OFFSET\], 0u\)/);
  expect(
    getDependencyDisplayBudgetShader(128, 0, 2, 5),
    'dependency display culling applies the configured viewport budget'
  ).toMatch(/getChunkBudget\(viewUniforms\.dependencyDisplayBudget\)/);
  expect(
    getDependencyDisplayBudgetShader(128, 0, 2, 5),
    'dependency display culling keeps a stable monotonic ID-based sample while zooming'
  ).toMatch(/stableHash\(dependencyIndex\) >> 8u/);
  expect(
    getDependencyDisplayBudgetShader(128, 0, 2, 5),
    'dependency display selection reserves bounded output slots in parallel'
  ).toMatch(/atomicCompareExchangeWeak/);
  expect(getDensityClearShader(), 'density storage includes hierarchy gap rows').toMatch(
    new RegExp(
      `DENSITY_BIN_COUNT: u32 = ${TRACE_DISPLAY_LANE_CAPACITY * TRACE_DENSITY_BIN_COUNT * TRACE_GROUPS.length}u`
    )
  );
  expect(
    getCandidateDensityShader(spanChunk),
    'density aggregation preserves long-span coverage across bins'
  ).toMatch(/for \(var bin = firstBin; bin <= lastBin; bin\+\+\)/);
  expect(
    getCandidateDensityShader(spanChunk),
    'density aggregation uses scroll-stable trace-time bin membership'
  ).toMatch(/span\.start - viewUniforms\.densityBinOrigin/);
  expect(
    getBatchVisibilityShader(3),
    'coarse visibility keeps a horizontal guard band around the viewport'
  ).toMatch(/viewUniforms\.timeMin - timePadding/);
  expect(
    getCandidateVisibilityShader(spanChunk),
    'exact spans remain candidates until they clear the padded viewport edge'
  ).toMatch(/span\.start <= viewUniforms\.timeMax \+ timePadding/);
  expect(
    getCandidatePassDispatchShader([
      {firstBatchIndex: 0, batchCount: 7},
      {firstBatchIndex: 7, batchCount: 5}
    ]),
    'density dispatch partitions the stable candidate list at span-chunk boundaries'
  ).toMatch(/lowerBoundCandidate/);
  expect(
    getCandidateDensityShader(spanChunk),
    'density aggregation starts at its compacted chunk candidate offset'
  ).toMatch(/candidateChunkOffsets\[CHUNK_INDEX\] \+ workgroupId\.y/);
  expect(
    getCandidatePickShader(spanChunk),
    'picking consumes only the candidate rows assigned to its span chunk'
  ).toMatch(/candidateChunkOffsets\[CHUNK_INDEX\] \+ workgroupId\.y/);
  expect(
    TRACE_DENSITY_RENDER_SHADER,
    'stable density bins are projected into the moving viewport'
  ).toMatch(/traceTime - viewUniforms\.densityBinOrigin/);
  expect(
    getCandidateDensityShader(spanChunk),
    'density aggregation excludes spans retained as exact geometry'
  ).toMatch(/!retainedExactSpan/);
  expect(
    getCandidateVisibilityShader(spanChunk),
    'wide spans remain eligible for exact compaction in density mode'
  ).toMatch(/isFullExactModeActive\(\) \|\| isSpanWideEnoughForExactRendering\(span\.duration\)/);
  expect(
    getCandidateVisibilityShader(spanChunk),
    'coarse exact visibility rejects batches whose longest span is too narrow'
  ).toMatch(/batch\.maximumDuration < getMinimumExactSpanDuration\(\)/);
  expect(
    getBatchVisibilityShader(3),
    'the coarse pass creates a sparse exact batch list for wide spans'
  ).toMatch(/batch\.maximumDuration >= getMinimumExactSpanDuration\(\)/);
  expect(
    TRACE_RENDER_SHADER,
    'rendering selects the smooth or hard LOD transition from the view uniform'
  ).toMatch(/viewUniforms\.lodFadeEnabled/);
  expect(
    TRACE_RENDER_SHADER,
    'exact and representative rendering consume chunk-local per-span anomaly masks'
  ).toMatch(/anomalyMask\[sourceIndex - spanChunk\.firstSpanIndex\]/);
  expect(
    TRACE_RENDER_SHADER,
    'anomalous spans receive a restrained solid edge instead of a full-span color replacement'
  ).toMatch(/verticalFraction < 0\.11/);
  expect(
    TRACE_RENDER_SHADER,
    'hard-switch exact spans bypass sub-pixel readability fading'
  ).toMatch(/select\(\s*1\.0,\s*spanReadability,\s*viewUniforms\.lodFadeEnabled != 0u\s*\)/);
  expect(
    TRACE_DENSITY_RENDER_SHADER,
    'aggregated density bins use the shared fill-pattern ShaderPlugin'
  ).toMatch(/pluginApplyFillPattern/);
  expect(
    TRACE_DENSITY_RENDER_SHADER,
    'density patterns stagger their phase by lane instead of forming a screen-wide grid'
  ).toMatch(/patternOffset = f32\(\(lane \* 3u\) % 10u\)/);
  expect(
    TRACE_DENSITY_RENDER_SHADER,
    'density rendering samples its GPU bins from one full-screen triangle'
  ).toMatch(/array<vec2<f32>, 3>/);
  expect(FillPattern.hash45, 'the default diagonal dash pattern has a stable shader value').toBe(2);
  expect(
    Boolean(fillPatternShaderPlugin.wgsl),
    'the shared fill-pattern plugin supports WGSL'
  ).toBe(true);
  expect(
    TRACE_RENDER_SHADER,
    'ordinary picking highlights its span without dimming the complete trace'
  ).toMatch(/focusEnabled = viewUniforms\.focusMode != 0u && hasSelection/);
  expect(
    TRACE_PICKING_RENDER_SHADER,
    'raster span picking publishes canonical source rows in the shared integer target'
  ).toMatch(/indices = vec2<i32>\(i32\(input\.sourceIndex\), 0\)/);
  expect(
    TRACE_DEPENDENCY_PICKING_RENDER_SHADER,
    'raster dependency picking uses a distinct object-kind channel'
  ).toMatch(/indices = vec2<i32>\(i32\(input\.dependencyIndex\), 1\)/);
  expect(
    getCandidateLabelShader(spanChunk, 5),
    'label expansion rejects strings that do not fit before reserving glyph occurrences'
  ).toMatch(/spanPixelWidth < metric\.advancePixels/);
  expect(
    TRACE_LABEL_RENDER_SHADER,
    'label rendering retains a final span clip-rectangle guard'
  ).toMatch(/isGlyphVertexClipped\(input\.glyphPixelOffset, input\.clipRect\)/);
  expect(
    TRACE_LABEL_RENDER_SHADER,
    'the label line box is centered vertically around the span midpoint'
  ).toMatch(/-textDictionaryStyle\.lineHeightPixels \* 0\.5/);
  void 0;
});

it('GPU trace focus seed exposes only resources consumed by its compute entry point', () => {
  const reflection = new WgslReflect(getFocusFrontierSeedShader(11));
  expect(
    reflection.storage.map(resource => ({name: resource.name, location: resource.binding})),
    'seed bindings match the native WebGPU pipeline layout without an optimized-out slot'
  ).toEqual([
    {name: 'selectedSeeds', location: 0},
    {name: 'activeSeedCount', location: 1},
    {name: 'focusTraversalState', location: 2},
    {name: 'reachedSpans', location: 3},
    {name: 'frontier', location: 4},
    {name: 'frontierCount', location: 5},
    {name: 'dispatchCommand', location: 6}
  ]);
  void 0;
});

it('GPU trace data preserves deterministic canonical group and hierarchy identities', () => {
  const dataset = makeTraceDataset(257);
  const repeated = makeTraceDataset(257);
  expect(dataset.groups.length, 'creates all stable draw groups').toBe(TRACE_GROUPS.length);
  expect(
    dataset.groups.map(group => [group.firstSpanIndex, group.count]),
    'group ranges completely cover canonical source rows'
  ).toEqual([
    [0, 86],
    [86, 86],
    [172, 85]
  ]);
  expect(dataset.spans, 'source data is deterministic').toEqual(repeated.spans);
  expect(dataset.dependencies, 'dependency data is deterministic').toEqual(repeated.dependencies);
  expect(dataset.processCount, 'publishes stable process count').toBe(TRACE_PROCESS_COUNT);
  expect(dataset.threadCount, 'publishes stable thread count').toBe(TRACE_THREAD_COUNT);
  expect(dataset.parentSpans.length, 'publishes one canonical parent per span').toBe(
    dataset.spanCount
  );

  for (const group of dataset.groups) {
    expect(group.data.buffer, 'group borrows canonical source allocation').toBe(
      dataset.spans.buffer
    );
    for (let rowIndex = 0; rowIndex < group.count; rowIndex++) {
      const sourceIndex = group.firstSpanIndex + rowIndex;
      const wordOffset = sourceIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
      const laneIndex = dataset.spans[wordOffset + 2];
      const threadIndex = dataset.spans[wordOffset + 5];
      expect(dataset.spans[wordOffset + 3], 'row retains its draw group').toBe(group.groupIndex);
      expect(dataset.spans[wordOffset + 6], 'row retains its stable source identity').toBe(
        sourceIndex
      );
      expect(threadIndex, 'lane resolves to its owning thread').toBe(
        Math.floor(laneIndex / TRACE_LANES_PER_THREAD)
      );
      expect(dataset.spans[wordOffset + 4], 'thread resolves to its owning process').toBe(
        Math.floor(threadIndex / TRACE_THREADS_PER_PROCESS)
      );
    }
  }
  expect(
    makeTraceGroups(7).map(group => group.count),
    'the original trace-group helper remains compatible'
  ).toEqual([3, 2, 2]);
  void 0;
});

it('GPU trace duration grows with tightly packed non-overlapping lane slots', () => {
  expect(getTraceDuration(250_000), 'the baseline capacity retains a one-second trace').toBe(1000);
  expect(
    Boolean(Math.abs(getTraceDuration(1_000_000) - 4000) < 2),
    'one million spans expands to about four seconds'
  ).toBe(true);
  expect(
    Boolean(Math.abs(getTraceDuration(10_000_000) - 40_000) < 25),
    'ten million spans expands to about forty seconds'
  ).toBe(true);

  const dataset = makeTraceDataset(65_536, 0);
  const spanFloats = new Float32Array(dataset.spans.buffer);
  const laneSpans = Array.from(
    {length: TRACE_LANE_COUNT},
    () => [] as Array<[start: number, end: number, group: number]>
  );
  let occupiedDuration = 0;
  let minimumDuration = Number.POSITIVE_INFINITY;
  let maximumDuration = 0;
  for (let spanIndex = 0; spanIndex < dataset.spanCount; spanIndex++) {
    const wordOffset = spanIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
    const start = spanFloats[wordOffset];
    const duration = spanFloats[wordOffset + 1];
    const lane = dataset.spans[wordOffset + 2];
    laneSpans[lane].push([start, start + duration, dataset.spans[wordOffset + 3]]);
    occupiedDuration += duration;
    minimumDuration = Math.min(minimumDuration, duration);
    maximumDuration = Math.max(maximumDuration, duration);
  }
  let sameGroupNeighborCount = 0;
  let neighborCount = 0;
  let focusedLaneCount = 0;
  for (const spans of laneSpans) {
    spans.sort((left, right) => left[0] - right[0]);
    const groupCounts = new Uint32Array(TRACE_GROUPS.length);
    for (const span of spans) {
      groupCounts[span[2]]++;
    }
    focusedLaneCount += Number(Math.max(...groupCounts) / spans.length > 0.65);
    for (let spanIndex = 1; spanIndex < spans.length; spanIndex++) {
      expect(
        Boolean(spans[spanIndex][0] >= spans[spanIndex - 1][1]),
        'successive spans in one lane do not overlap'
      ).toBe(true);
      sameGroupNeighborCount += Number(spans[spanIndex][2] === spans[spanIndex - 1][2]);
      neighborCount++;
    }
  }
  expect(
    Boolean(sameGroupNeighborCount / neighborCount > 0.9),
    'span groups form coherent lane phases instead of alternating every span'
  ).toBe(true);
  expect(
    Boolean(focusedLaneCount / laneSpans.length > 0.9),
    'most lanes spend a clear majority of their time on one span group'
  ).toBe(true);
  const occupancy = occupiedDuration / (dataset.duration * TRACE_LANE_COUNT);
  expect(
    Boolean(occupancy > 0.4 && occupancy < 0.8),
    'lane packing remains dense while sparse extra-wide spans extend individual lanes'
  ).toBe(true);
  expect(Boolean(minimumDuration < 0.05), 'the trace includes very short spans').toBe(true);
  expect(Boolean(maximumDuration > 20), 'the trace includes very wide spans').toBe(true);
  expect(
    Boolean(maximumDuration > 100),
    'the trace includes sparse spans that survive coarse density LOD'
  ).toBe(true);
  expect(
    Boolean(maximumDuration > TRACE_DURATION_FILTER_MAXIMUM),
    'duration filter maximum retains spans from the generated upper tail'
  ).toBe(true);
  expect(
    Boolean(
      dataset.groups.every(group => {
        const groupFloats = new Float32Array(
          group.data.buffer,
          group.data.byteOffset,
          group.data.length
        );
        return groupFloats[0] < getTraceDuration(TRACE_LANE_COUNT);
      })
    ),
    'all color groups appear in the first timeline slot'
  ).toBe(true);
  void 0;
});

it('GPU trace dependency generation respects its independent capacity', () => {
  const dataset = makeTraceDataset(10_000, 250);
  expect(dataset.spanCount, 'span capacity remains independent').toBe(10_000);
  expect(dataset.dependencyCount, 'dependency generation stops at its requested capacity').toBe(
    250
  );
  expect(makeTraceDataset(10_000, 0).dependencyCount, 'zero dependencies are supported').toBe(0);
  void 0;
});

it('GPU trace dependency chunks preserve complete candidate batches', () => {
  const dataset = makeTraceDataset(10_000, 10_000);
  const maximumChunkByteLength = TRACE_DEPENDENCY_CHUNK_TARGET_BYTE_LENGTH / 1024;
  const chunks = makeTraceDependencyChunks(
    dataset.dependencies,
    dataset.dependencyBatches,
    maximumChunkByteLength
  );
  expect(
    Boolean(chunks.length > 1),
    'small test chunk target produces multiple dependency chunks'
  ).toBe(true);
  expect(
    chunks.reduce((sum, chunk) => sum + chunk.dependencyCount, 0),
    'dependency chunks cover every canonical dependency exactly once'
  ).toBe(dataset.dependencyCount);
  expect(
    Boolean(
      chunks.every(
        chunk =>
          chunk.data.byteOffset ===
          dataset.dependencies.byteOffset +
            chunk.firstDependencyIndex *
              TRACE_DEPENDENCY_RECORD_WORD_LENGTH *
              Uint32Array.BYTES_PER_ELEMENT
      )
    ),
    'dependency chunks borrow canonical storage without repacking'
  ).toBe(true);
  expect(
    Boolean(
      chunks.every(
        chunk =>
          chunk.dependencyCount ===
          dataset.dependencyBatches
            .slice(chunk.firstBatchIndex, chunk.firstBatchIndex + chunk.batchCount)
            .reduce((sum, batch) => sum + batch.count, 0)
      )
    ),
    'no dependency batch crosses a chunk boundary'
  ).toBe(true);
  for (const chunk of chunks) {
    const localBatchIndex = makeTraceDependencyChunkBatchIndex(dataset.dependencyBatchIndex, chunk);
    expect(localBatchIndex[0], 'each dependency chunk starts at local row zero').toBe(0);
    for (let localIndex = 0; localIndex < chunk.batchCount; localIndex++) {
      const wordOffset = localIndex * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH;
      expect(
        localBatchIndex[wordOffset + 5],
        'each dependency chunk publishes local stable batch IDs'
      ).toBe(localIndex);
    }
  }
  void 0;
});

it('GPU trace dependency batches preserve identity and conservative ancestor bounds', () => {
  const dataset = makeTraceDataset(2048);
  const {dependencyBatches, dependencyBatchIndex} = makeTraceDependencyBatches(
    dataset.spans,
    dataset.dependencies,
    dataset.parentSpans,
    7
  );
  expect(
    dependencyBatchIndex.length,
    'publishes one fixed-width GPU index record per dependency batch'
  ).toBe(dependencyBatches.length * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH);
  const indexFloats = new Float32Array(dependencyBatchIndex.buffer);
  for (const batch of dependencyBatches) {
    const indexOffset = batch.batchIndex * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH;
    expect(dependencyBatchIndex[indexOffset], 'index preserves dependency base').toBe(
      batch.firstDependencyIndex
    );
    expect(dependencyBatchIndex[indexOffset + 1], 'index preserves batch length').toBe(batch.count);
    expect(dependencyBatchIndex[indexOffset + 4], 'index preserves families').toBe(
      batch.familyMask
    );
    expect(dependencyBatchIndex[indexOffset + 5], 'index preserves identity').toBe(
      batch.batchIndex
    );
    expect(
      Boolean(Math.abs(indexFloats[indexOffset + 2] - batch.timeMin) < 0.001),
      'index preserves minimum time'
    ).toBe(true);
    expect(
      Boolean(Math.abs(indexFloats[indexOffset + 3] - batch.timeMax) < 0.001),
      'index preserves maximum time'
    ).toBe(true);
  }
  expect(
    () => makeTraceDependencyBatches(dataset.spans, dataset.dependencies, dataset.parentSpans, 0),
    'invalid dependency batch capacity is rejected'
  ).toThrow(/positive safe integer/);
  void 0;
});

it('GPU trace span batches preserve global identity and publish coarse index bounds', () => {
  const dataset = makeTraceDataset(11);
  const {spanBatches, spanBatchIndex} = makeTraceSpanBatches(dataset.spans, dataset.groups, 2);
  expect(
    spanBatches.map(batch => [batch.firstSpanIndex, batch.count, batch.groupIndex]),
    'batches remain group aligned and completely cover source rows'
  ).toEqual([
    [0, 2, 0],
    [2, 2, 0],
    [4, 2, 1],
    [6, 2, 1],
    [8, 2, 2],
    [10, 1, 2]
  ]);
  expect(spanBatchIndex.length, 'publishes one fixed-width GPU index record per batch').toBe(
    spanBatches.length * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH
  );
  const spanFloats = new Float32Array(dataset.spans.buffer);
  const indexFloats = new Float32Array(spanBatchIndex.buffer);
  for (const batch of spanBatches) {
    const indexOffset = batch.batchIndex * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH;
    expect(spanBatchIndex[indexOffset], 'index preserves global base').toBe(batch.firstSpanIndex);
    expect(spanBatchIndex[indexOffset + 1], 'index preserves batch length').toBe(batch.count);
    expect(spanBatchIndex[indexOffset + 6], 'index preserves group identity').toBe(
      batch.groupIndex
    );
    expect(spanBatchIndex[indexOffset + 7], 'index preserves batch identity').toBe(
      batch.batchIndex
    );
    expect(
      Boolean(Math.abs(indexFloats[indexOffset + 2] - batch.timeMin) < 0.001),
      'index preserves minimum time'
    ).toBe(true);
    expect(
      Boolean(Math.abs(indexFloats[indexOffset + 3] - batch.timeMax) < 0.001),
      'index preserves maximum time'
    ).toBe(true);
    expect(
      Boolean(Math.abs(indexFloats[indexOffset + 8] - batch.maximumDuration) < 0.001),
      'index preserves maximum span duration'
    ).toBe(true);
    for (let rowIndex = 0; rowIndex < batch.count; rowIndex++) {
      const sourceIndex = batch.firstSpanIndex + rowIndex;
      const wordOffset = sourceIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
      const start = spanFloats[wordOffset];
      const end = start + spanFloats[wordOffset + 1];
      const lane = dataset.spans[wordOffset + 2];
      expect(
        Boolean(start >= batch.timeMin && end <= batch.timeMax),
        'batch encloses span time'
      ).toBe(true);
      expect(
        Boolean(lane >= batch.laneMin && lane < batch.laneMax),
        'batch encloses span lane'
      ).toBe(true);
      expect(
        Boolean(spanFloats[wordOffset + 1] <= batch.maximumDuration),
        'batch encloses span duration'
      ).toBe(true);
    }
  }
  for (const group of dataset.groups) {
    const groupBatches = spanBatches.filter(batch => batch.groupIndex === group.groupIndex);
    const slotDuration = getTraceDuration(TRACE_LANE_COUNT);
    for (let batchIndex = 1; batchIndex < groupBatches.length; batchIndex++) {
      expect(
        Boolean(
          Math.floor(groupBatches[batchIndex].timeMin / slotDuration) >=
            Math.floor(groupBatches[batchIndex - 1].timeMin / slotDuration)
        ),
        'group batches retain increasing temporal-slot locality'
      ).toBe(true);
    }
  }
  expect(spanBatches[0].data.buffer, 'batch borrows canonical storage').toBe(dataset.spans.buffer);
  expect(
    () => makeTraceSpanBatches(dataset.spans, dataset.groups, 0),
    'invalid batch capacity is rejected'
  ).toThrow(/positive safe integer/);
  void 0;
});

it('GPU trace temporal index builds conservative source-ordered hierarchy levels', () => {
  const dataset = makeTraceDataset(96);
  const {spanBatches} = makeTraceSpanBatches(dataset.spans, dataset.groups, 2);
  const temporalIndex = makeTraceTemporalIndex(spanBatches, 2, 8);
  const floats = new Float32Array(temporalIndex.data.buffer);
  expect(
    temporalIndex.levels.map(level => level.maximumBatchCount),
    'each level doubles its bounded leaf range'
  ).toEqual([2, 4, 8]);
  expect(temporalIndex.data.length, 'packed levels cover every hierarchy node exactly once').toBe(
    temporalIndex.levels.reduce((sum, level) => sum + level.nodeCount, 0) *
      TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH
  );
  for (const level of temporalIndex.levels) {
    for (let localNodeIndex = 0; localNodeIndex < level.nodeCount; localNodeIndex++) {
      const nodeIndex = level.firstNodeIndex + localNodeIndex;
      const wordOffset = nodeIndex * TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH;
      const groupIndex = temporalIndex.data[wordOffset + 3];
      const firstBatchIndex = temporalIndex.data[wordOffset + 4];
      const batchCount = temporalIndex.data[wordOffset + 5];
      const leaves = spanBatches.slice(firstBatchIndex, firstBatchIndex + batchCount);
      expect(Boolean(leaves.length > 0), 'node owns at least one canonical leaf batch').toBe(true);
      expect(
        Boolean(leaves.every(batch => batch.groupIndex === groupIndex)),
        'node never crosses a renderer-group boundary'
      ).toBe(true);
      expect(
        Boolean(
          leaves.every(
            batch =>
              Math.fround(batch.timeMin) >= floats[wordOffset] &&
              Math.fround(batch.timeMax) <= floats[wordOffset + 1]
          )
        ),
        'node time bounds conservatively contain every owned leaf'
      ).toBe(true);
      expect(
        Boolean(
          leaves.every(batch => Math.fround(batch.maximumDuration) <= floats[wordOffset + 2])
        ),
        'node duration bound conservatively contains every owned leaf'
      ).toBe(true);
      expect(
        Boolean(
          leaves.every(
            batch =>
              batch.laneMin >= temporalIndex.data[wordOffset + 6] &&
              batch.laneMax <= temporalIndex.data[wordOffset + 7]
          )
        ),
        'node lane bounds conservatively contain every owned leaf'
      ).toBe(true);
    }
  }
  expect(
    getTraceTemporalIndexLevel(temporalIndex.levels, Number.EPSILON),
    'a close view uses the finest hierarchy level'
  ).toBe(0);
  expect(
    getTraceTemporalIndexLevel(temporalIndex.levels, 1e6),
    'a full overview uses the coarsest hierarchy level'
  ).toBe(temporalIndex.levels.length - 1);
  void 0;
});

it('GPU trace data publishes stable forward and reverse dependency adjacency', () => {
  const dataset = makeTraceDataset(513);
  expect(Boolean(dataset.dependencyCount > 0), 'generates realistic sparse dependencies').toBe(
    true
  );
  expect(
    dataset.outgoing.offsets.length,
    'forward CSR owns one offset per active source plus its sentinel'
  ).toBe(dataset.outgoing.nodes.length + 1);
  expect(
    dataset.incoming.offsets.length,
    'reverse CSR owns one offset per active destination plus its sentinel'
  ).toBe(dataset.incoming.nodes.length + 1);
  expect(
    dataset.outgoing.offsets[dataset.outgoing.nodes.length],
    'forward sentinel equals the canonical dependency count'
  ).toBe(dataset.dependencyCount);
  expect(
    dataset.incoming.offsets[dataset.incoming.nodes.length],
    'reverse sentinel equals the canonical dependency count'
  ).toBe(dataset.dependencyCount);
  expect(
    Boolean(
      dataset.outgoing.nodes.length <= dataset.dependencyCount &&
        dataset.incoming.nodes.length <= dataset.dependencyCount
    ),
    'both directions allocate rows only for nodes that own edges'
  ).toBe(true);
  for (const adjacency of [dataset.outgoing, dataset.incoming]) {
    for (let rowIndex = 0; rowIndex < adjacency.nodes.length; rowIndex++) {
      if (rowIndex > 0) {
        expect(
          Boolean(adjacency.nodes[rowIndex] > adjacency.nodes[rowIndex - 1]),
          'sparse owner rows preserve strict global-ID order for GPU binary search'
        ).toBe(true);
      }
      expect(
        Boolean(adjacency.offsets[rowIndex + 1] > adjacency.offsets[rowIndex]),
        'every sparse owner row contains at least one dependency'
      ).toBe(true);
    }
  }
  const expectedOutgoing = Array.from({length: dataset.spanCount}, () => [] as number[]);
  const expectedIncoming = Array.from({length: dataset.spanCount}, () => [] as number[]);
  for (let edgeIndex = 0; edgeIndex < dataset.dependencyCount; edgeIndex++) {
    const wordOffset = edgeIndex * TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
    const source = dataset.dependencies[wordOffset];
    const destination = dataset.dependencies[wordOffset + 1];
    expectedOutgoing[source].push(destination);
    expectedIncoming[destination].push(source);
  }
  for (let spanIndex = 0; spanIndex < dataset.spanCount; spanIndex++) {
    expect(
      Array.from(getTraceAdjacencyNeighbors(dataset.outgoing, spanIndex)),
      'forward CSR preserves canonical dependency order exactly'
    ).toEqual(expectedOutgoing[spanIndex]);
    expect(
      Array.from(getTraceAdjacencyNeighbors(dataset.incoming, spanIndex)),
      'reverse CSR preserves canonical dependency order exactly'
    ).toEqual(expectedIncoming[spanIndex]);
  }
  for (let spanIndex = 0; spanIndex < dataset.spanCount; spanIndex++) {
    const parentSpanIndex = dataset.parentSpans[spanIndex];
    if (parentSpanIndex === TRACE_INVALID_SPAN_INDEX) {
      continue;
    }
    const incoming = getTraceAdjacencyNeighbors(dataset.incoming, spanIndex);
    expect(
      Boolean(incoming.includes(parentSpanIndex)),
      'canonical ancestry is backed by a real parent edge'
    ).toBe(true);
  }

  let sameProcessCount = 0;
  let crossProcessCount = 0;
  for (let edgeIndex = 0; edgeIndex < dataset.dependencyCount; edgeIndex++) {
    const wordOffset = edgeIndex * TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
    const source = dataset.dependencies[wordOffset];
    const destination = dataset.dependencies[wordOffset + 1];
    const family = dataset.dependencies[wordOffset + 2];
    const metadata = dataset.dependencies[wordOffset + 3];
    const outgoing = getTraceAdjacencyNeighbors(dataset.outgoing, source);
    const incoming = getTraceAdjacencyNeighbors(dataset.incoming, destination);
    expect(
      Boolean(outgoing.includes(destination)),
      'forward CSR contains the canonical destination'
    ).toBe(true);
    expect(Boolean(incoming.includes(source)), 'reverse CSR contains the canonical source').toBe(
      true
    );
    expect(metadata & 0xff, 'parent classification remains numeric').toBe(
      TRACE_PARENT_DEPENDENCY_FLAG
    );
    if (family === TRACE_SAME_PROCESS_DEPENDENCY) {
      sameProcessCount++;
      expect(
        dataset.spans[source * TRACE_SPAN_RECORD_WORD_LENGTH + 5],
        'same-process edges preserve their source thread'
      ).toBe(dataset.spans[destination * TRACE_SPAN_RECORD_WORD_LENGTH + 5]);
    } else if (family === TRACE_CROSS_PROCESS_DEPENDENCY) {
      crossProcessCount++;
      expect(
        dataset.spans[source * TRACE_SPAN_RECORD_WORD_LENGTH + 4],
        'cross-process edges connect distinct process owners'
      ).not.toBe(dataset.spans[destination * TRACE_SPAN_RECORD_WORD_LENGTH + 4]);
    }
  }
  expect(Boolean(sameProcessCount > 0), 'includes same-thread parent dependencies').toBe(true);
  expect(Boolean(crossProcessCount > 0), 'includes cross-process parent dependencies').toBe(true);
  expect(
    getMaximumTraceAdjacencyByteLength(250_000),
    '250K dependencies need at most 6 MB of bidirectional sparse adjacency at any span count'
  ).toBe(6_000_008);
  expect(
    Boolean(
      getMaximumTraceAdjacencyByteLength(250_000) * 100 <
        2 * (100_000_000 + 1 + 250_000) * Uint32Array.BYTES_PER_ELEMENT
    ),
    '100M spans with 250K dependencies use over 100x less adjacency storage than dense CSR'
  ).toBe(true);
  void 0;
});

it('GPU trace generation reports phases and releases uploaded CPU storage', () => {
  const phases: string[] = [];
  const dataset = makeTraceDataset(513, 513, phase => phases.push(phase));
  const spanCount = dataset.spanCount;
  const dependencyCount = dataset.dependencyCount;

  expect(phases, 'worker-facing progress follows the expensive generation phases').toEqual([
    'spans',
    'dependencies',
    'indexes',
    'adjacency',
    'complete'
  ]);
  expect(Boolean(dataset.spans.byteLength > 0), 'generated source storage starts populated').toBe(
    true
  );
  expect(
    Boolean(dataset.outgoing.neighbors.byteLength > 0),
    'generated adjacency starts populated'
  ).toBe(true);

  releaseTraceDatasetStorage(dataset);

  expect(dataset.spanCount, 'release preserves span metadata').toBe(spanCount);
  expect(dataset.dependencyCount, 'release preserves dependency metadata').toBe(dependencyCount);
  expect(dataset.spans.byteLength, 'release drops canonical span storage').toBe(0);
  expect(dataset.temporalIndex.data.byteLength, 'release drops temporal index storage').toBe(0);
  expect(dataset.dependencies.byteLength, 'release drops canonical dependency storage').toBe(0);
  expect(dataset.outgoing.neighbors.byteLength, 'release drops outgoing adjacency storage').toBe(0);
  expect(dataset.incoming.neighbors.byteLength, 'release drops incoming adjacency storage').toBe(0);
  expect(
    Boolean(dataset.groups.every(group => group.data.byteLength === 0)),
    'release drops group views'
  ).toBe(true);
  expect(
    Boolean(dataset.spanBatches.every(batch => batch.data.byteLength === 0)),
    'release drops batch views'
  ).toBe(true);
  expect(
    Boolean(dataset.dependencyChunks.every(chunk => chunk.data.byteLength === 0)),
    'release drops dependency chunk views'
  ).toBe(true);
  void 0;
});

it('GPU trace data handles empty inputs and rejects invalid capacities', () => {
  const dataset = makeTraceDataset(0);
  expect(dataset.spans.length, 'empty traces have no span rows').toBe(0);
  expect(dataset.dependencies.length, 'empty traces have no dependency rows').toBe(0);
  expect(dataset.parentSpans.length, 'empty traces have no canonical parent rows').toBe(0);
  expect(dataset.spanBatches.length, 'empty traces have no span batches').toBe(0);
  expect(dataset.spanBatchIndex.length, 'empty traces have no batch index records').toBe(0);
  expect(dataset.temporalIndex.data.length, 'empty traces have no temporal index nodes').toBe(0);
  expect(dataset.temporalIndex.levels.length, 'empty traces have no temporal index levels').toBe(0);
  expect(dataset.dependencyBatches.length, 'empty traces have no dependency batches').toBe(0);
  expect(
    dataset.dependencyBatchIndex.length,
    'empty traces have no dependency batch index records'
  ).toBe(0);
  expect(Array.from(dataset.outgoing.nodes), 'empty forward CSR has no active rows').toEqual([]);
  expect(Array.from(dataset.outgoing.offsets), 'empty forward CSR has a sentinel').toEqual([0]);
  expect(Array.from(dataset.incoming.nodes), 'empty reverse CSR has no active rows').toEqual([]);
  expect(Array.from(dataset.incoming.offsets), 'empty reverse CSR has a sentinel').toEqual([0]);
  expect(() => makeTraceDataset(-1), 'negative capacity is rejected').toThrow(/nonnegative uint32/);
  expect(() => makeTraceDataset(1.5), 'fractional capacity is rejected').toThrow(
    /nonnegative uint32/
  );
  expect(() => makeTraceDataset(1, -1), 'negative dependency capacity is rejected').toThrow(
    /dependency count must be a nonnegative uint32/
  );
  void 0;
});

function getTraceAdjacencyNeighbors(adjacency: TraceAdjacencyData, node: number): Uint32Array {
  const rowIndex = adjacency.nodes.indexOf(node);
  return rowIndex < 0
    ? adjacency.neighbors.subarray(0, 0)
    : adjacency.neighbors.subarray(adjacency.offsets[rowIndex], adjacency.offsets[rowIndex + 1]);
}
