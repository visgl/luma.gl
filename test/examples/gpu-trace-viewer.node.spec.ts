// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('trace viewer URL presets are device-qualified and shareable', t => {
  const supportedSpans = [250_000, 1_000_000, 4_000_000];
  const supportedDependencies = [0, ...supportedSpans];

  t.deepEqual(
    getTraceViewerURLPreset(
      '?spans=1000000&dependencies=4000000',
      supportedSpans,
      supportedDependencies
    ),
    {spanCapacity: 1_000_000, dependencyCapacity: 4_000_000},
    'supported preset values are restored'
  );
  t.deepEqual(
    getTraceViewerURLPreset(
      '?spans=25000000&dependencies=oops',
      supportedSpans,
      supportedDependencies
    ),
    {spanCapacity: undefined, dependencyCapacity: undefined},
    'unsupported or malformed values cannot bypass device-qualified controls'
  );

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
  t.equal(
    replacement,
    '/examples/experimental/gpu-trace-viewer?revision=test&spans=250000&dependencies=1000000#view',
    'full-page controls persist a shareable URL without dropping unrelated parameters'
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
  t.equal(replacement, '', 'embedded documentation examples do not rewrite the guide URL');
  t.end();
});

test('trace generation cancels stale work and idle views do not render', t => {
  const generationState = new TraceGenerationState();
  const firstGeneration = generationState.begin();
  const secondGeneration = generationState.begin();

  t.notOk(generationState.isCurrent(firstGeneration), 'a replacement cancels stale generation');
  t.ok(generationState.isCurrent(secondGeneration), 'the latest generation may publish');
  t.notOk(
    shouldRenderTraceFrame({
      gpuFrameInFlight: false,
      renderSignature: 'unchanged',
      lastRenderSignature: 'unchanged'
    }),
    'an unchanged idle view does not encode GPU work'
  );
  t.ok(
    shouldRenderTraceFrame({
      gpuFrameInFlight: false,
      renderSignature: 'changed',
      lastRenderSignature: 'unchanged'
    }),
    'an invalidated view encodes one new frame'
  );
  generationState.finalize();
  t.notOk(generationState.isCurrent(secondGeneration), 'finalization rejects pending publication');
  t.end();
});

test('trace analytics cache identity includes scope and selection generation inputs', t => {
  const base = {
    enabledMask: 7,
    statusMask: 15,
    activeFilterMask: 0,
    minimumDuration: 1
  };
  const viewport = getTraceAggregationFilterSignature({...base, scope: 'viewport'});
  const interval = getTraceAggregationFilterSignature({...base, scope: 'interval'});
  const fullTrace = getTraceAggregationFilterSignature({...base, scope: 'trace'});

  t.notEqual(viewport, interval, 'viewport and measured intervals cannot share cached output');
  t.notEqual(viewport, fullTrace, 'viewport and full-trace paths cannot share cached output');
  t.deepEqual(
    getTraceAnalysisWindow({
      scope: 'trace',
      traceDuration: 100,
      viewport: [20, 40],
      measured: [50, 60]
    }),
    [0, 100],
    'full-trace analysis owns the complete domain'
  );
});

test('GPU trace feature cards expose concrete GPUGraph and gpu-trace capabilities', t => {
  t.equal(GPU_CORE_FEATURE_CARDS.length, 17, 'lists the GPU Core capability contract');
  t.equal(GPU_TRACE_FEATURE_CARDS.length, 19, 'lists the GPU Trace capability contract');
  const graphHtml = getTraceFeatureCardsHtml(GPU_CORE_FEATURE_CARDS, 'GPU Core');
  const traceHtml = getTraceFeatureCardsHtml(GPU_TRACE_FEATURE_CARDS, 'GPU Trace');
  t.ok(graphHtml.includes('Conditional execution'), 'renders conditional graph work');
  t.ok(graphHtml.includes('Aliasing validation'), 'renders compile-time alias validation');
  t.ok(traceHtml.includes('Temporal candidates'), 'renders the temporal-index contract');
  t.ok(traceHtml.includes('25M span capacity posture'), 'renders the scale contract');
  t.end();
});

test('deck GPU trace copies complete canonical span records', t => {
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
      t.deepEqual(
        getTraceRow(deckData, rowIndex),
        {
          name: deckData.names[rowIndex],
          group: group.name,
          start: sourceFloats[sourceWordOffset],
          duration: sourceFloats[sourceWordOffset + 1],
          lane: group.data[sourceWordOffset + 2]
        },
        `deck row ${rowIndex} preserves canonical span geometry and group identity`
      );
    }
  }

  t.equal(rowIndex, count, 'all canonical span rows are copied');
  t.end();
});

test('GPU trace capacity options adapt to negotiated WebGPU buffer limits', t => {
  t.deepEqual(
    getTraceCapacityOptions(128 * 1024 * 1024, 256 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000],
    'portable limits expose twenty-five million spans through chunked source storage'
  );
  t.deepEqual(
    getTraceDependencyCapacityOptions(128 * 1024 * 1024, 256 * 1024 * 1024),
    [0, 250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000],
    'dependency chunking removes the single-binding ceiling'
  );
  t.deepEqual(
    getTraceCapacityOptions(256 * 1024 * 1024, 1024 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000],
    'chunking removes the single-binding ceiling'
  );
  t.deepEqual(
    getTraceCapacityOptions(1024 * 1024 * 1024, 1024 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000],
    'maximum adapters expose the twenty-five-million-span demonstration'
  );
  t.end();
});

test('GPU trace pixel mipmap preflight separates compact and indexed storage', t => {
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

  t.equal(routine.chunkCount, 2, '4M spans retain two 64 MiB canonical source chunks');
  t.equal(maximum.chunkCount, 12, '25M spans retain twelve independently bindable chunks');
  t.equal(maximum.rowOrderByteLength, 100_000_000, 'compact ordering costs one word per span');
  t.equal(
    maximum.rangeMaximumTreeByteLength,
    201_326_592,
    'optional power-of-two range trees are reported separately'
  );
  t.equal(
    maximum.compactPersistentByteLength,
    123_605_296,
    'compact search includes row order, lane offsets, and bounded representatives'
  );
  t.equal(
    maximum.indexedPersistentByteLength,
    324_931_888,
    'indexed mode makes its additional memory cost explicit before allocation'
  );
  t.equal(
    maximum.largestPersistentBufferByteLength,
    16 * 1024 * 1024,
    'every added persistent binding stays far below the 64 MiB canonical chunk target'
  );
  t.equal(
    maximum.maximumTransientBufferByteLength,
    TRACE_LANE_COUNT * 1920 * 2 * Uint32Array.BYTES_PER_ELEMENT,
    'view-dependent scratch remains bounded by lane and viewport dimensions'
  );
  t.ok(
    routine.indexedPersistentByteLength < maximum.indexedPersistentByteLength,
    'the same contract records scale-dependent memory before enabling the tree'
  );
  t.end();
});

test('GPU trace focus frontiers scale with reachable dependency population', t => {
  t.equal(
    getTraceFocusFrontierCapacity(100_000_000, 250_000),
    250_001,
    'a sparse 100M-span trace allocates one frontier entry per dependency plus its seed'
  );
  t.equal(
    getTraceFocusFrontierCapacity(100_000_000, 100_000_000),
    TRACE_FOCUS_FRONTIER_MAXIMUM_CAPACITY,
    'a dense trace uses the bounded frontier and reports overflow separately'
  );
  t.equal(getTraceFocusFrontierCapacity(10, 10, 4), 4, 'tests can inject a smaller bound');
  t.equal(
    getTraceFocusFrontierCapacity(0, 0),
    1,
    'an empty trace retains one allocation-safe frontier word'
  );
  t.end();
});

test('GPU trace adjacency chunks preserve sparse CSR rows with local offsets', t => {
  const adjacency: TraceAdjacencyData = {
    nodes: Uint32Array.of(0, 2, 4, 7),
    offsets: Uint32Array.of(0, 2, 3, 6, 7),
    neighbors: Uint32Array.of(1, 3, 0, 2, 5, 6, 4)
  };
  const chunks = makeTraceAdjacencyChunks(adjacency, 5 * Uint32Array.BYTES_PER_ELEMENT);
  t.equal(chunks.length, 2, 'the byte limit produces independently bindable partitions');
  t.deepEqual(Array.from(chunks[0].topology), [0, 2, 0, 2, 3], 'first CSR offsets are local');
  t.deepEqual(Array.from(chunks[1].topology), [4, 7, 0, 3, 4], 'second CSR offsets are local');
  t.deepEqual(Array.from(chunks[0].neighbors), [1, 3, 0], 'first neighbors remain ordered');
  t.deepEqual(Array.from(chunks[1].neighbors), [2, 5, 6, 4], 'second neighbors remain ordered');
  t.ok(
    chunks.every(
      chunk =>
        chunk.topology.byteLength <= 5 * Uint32Array.BYTES_PER_ELEMENT &&
        chunk.neighbors.byteLength <= 5 * Uint32Array.BYTES_PER_ELEMENT
    ),
    'both bindings honor the same limit'
  );
  t.deepEqual(
    makeTraceAdjacencyChunks({
      nodes: new Uint32Array(),
      offsets: Uint32Array.of(0),
      neighbors: new Uint32Array()
    }),
    [],
    'empty adjacency has no GPU chunks'
  );
  t.throws(
    () => makeTraceAdjacencyChunks(adjacency, Uint32Array.BYTES_PER_ELEMENT),
    /row exceeds/,
    'a row that cannot fit is rejected explicitly'
  );
  t.equal(
    TRACE_ADJACENCY_CHUNK_TARGET_BYTE_LENGTH,
    64 * 1024 * 1024,
    'production adjacency bindings retain the conservative target'
  );
  t.end();
});

test('GPU trace span chunks preserve complete candidate batches and borrowed source rows', t => {
  const dataset = makeTraceDataset(2048, 0);
  const chunks = makeTraceSpanChunks(
    dataset.spans,
    dataset.spanBatches,
    300 * TRACE_SPAN_RECORD_WORD_LENGTH * Uint32Array.BYTES_PER_ELEMENT
  );
  t.ok(chunks.length > 1, 'small synthetic chunk limit creates multiple source buffers');
  t.equal(
    chunks.reduce((count, chunk) => count + chunk.spanCount, 0),
    dataset.spanCount,
    'chunks cover every source span exactly once'
  );
  t.ok(
    chunks.every(chunk => chunk.data.buffer === dataset.spans.buffer),
    'chunk rows remain borrowed views of canonical source storage'
  );
  t.ok(
    chunks.every(chunk =>
      dataset.spanBatches
        .slice(chunk.firstBatchIndex, chunk.firstBatchIndex + chunk.batchCount)
        .every(
          batch =>
            batch.firstSpanIndex >= chunk.firstSpanIndex &&
            batch.firstSpanIndex + batch.count <= chunk.firstSpanIndex + chunk.spanCount
        )
    ),
    'no candidate batch crosses a chunk boundary'
  );
  t.equal(TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH, 64 * 1024 * 1024, 'target stays portable');
  t.end();
});

test('GPU trace worker datasets transfer every owned allocation without copying shared views', t => {
  const dataset = makeTraceDataset(2048, 128);
  const transferables = getTraceDatasetTransferables(dataset);
  t.equal(new Set(transferables).size, transferables.length, 'each owned buffer transfers once');
  t.ok(transferables.includes(dataset.spans.buffer), 'canonical spans transfer ownership');
  t.ok(
    dataset.groups.every(group => group.data.buffer === dataset.spans.buffer),
    'group views remain aliases of the transferred canonical span allocation'
  );
  t.ok(
    dataset.spanBatches.every(batch => batch.data.buffer === dataset.spans.buffer),
    'batch views remain aliases of the transferred canonical span allocation'
  );
  t.end();
});

test('GPU trace supremacy contract exposes standard scales and interaction scenarios', t => {
  t.deepEqual(
    TRACE_BENCHMARK_CAPACITIES,
    [250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000],
    'capacity scales remain stable for comparable benchmark runs'
  );
  t.deepEqual(
    TRACE_BENCHMARK_SCENARIOS.map(scenario => scenario.id),
    [
      'exact-expanded',
      'exact-collapsed',
      'exact-filtered',
      'exact-focused',
      'exact-picking',
      'density',
      'representative'
    ],
    'interaction scenarios cover hierarchy, filtering, focus, picking, and adaptive LOD'
  );
  t.equal(
    new Set(TRACE_BENCHMARK_SCENARIOS.map(scenario => scenario.id)).size,
    TRACE_BENCHMARK_SCENARIOS.length,
    'scenario identifiers are unique'
  );
  t.end();
});

test('GPU trace certification report distinguishes complete, slow, and incomplete runs', t => {
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
  t.equal(passing.status, 'pass', 'a complete bounded 25M run passes');
  t.equal(passing.scenarios.length, TRACE_BENCHMARK_SCENARIOS.length);
  t.equal(passing.scenarios[0].frameP95Milliseconds, 13, 'scenario percentiles are retained');

  const slow = makeTraceCertificationReport({
    ...base,
    samples: samples.map(sample =>
      sample.scenarioId === 'density' ? {...sample, frameTimeMilliseconds: 50} : sample
    )
  });
  t.equal(slow.status, 'fail', 'a measured frame-time regression fails certification');
  t.ok(slow.failures.some(failure => failure.includes('density frame p95')));

  const incomplete = makeTraceCertificationReport({
    ...base,
    spanCount: 4_000_000,
    dependencyCount: 4_000_000,
    samples: samples.filter(sample => sample.scenarioId !== 'exact-picking'),
    pickResponseMilliseconds: []
  });
  t.equal(incomplete.status, 'incomplete', 'a non-25M run cannot claim certification');
  t.ok(incomplete.failures.some(failure => failure.includes('exactly 25M')));

  const deviceLost = makeTraceCertificationReport({...base, deviceLost: true});
  t.equal(deviceLost.status, 'fail', 'device loss is a hard certification failure');
  t.end();
});

test('GPU trace capacity contract chunks spans and dependencies independently', t => {
  const portable = getTraceCapacityContract(10_000_000, 10_000_000, {
    maxStorageBufferBindingSize: 128 * 1024 * 1024,
    maxBufferSize: 256 * 1024 * 1024
  });
  t.equal(portable.spanBufferByteLength, 320_000_000, '10M spans require a 320 MB source buffer');
  t.equal(
    portable.dependencyBufferByteLength,
    160_000_000,
    'the contract accounts for ten million actual dependency records'
  );
  t.equal(portable.fitsDeviceLimits, false, 'portable limits reject the monolithic 10M source');
  t.equal(portable.spanChunkCount, 5, 'portable chunk target splits the 320 MB source five ways');
  t.equal(
    portable.dependencyChunkCount,
    3,
    'portable chunk target splits the 160 MB dependency source three ways'
  );
  t.equal(
    portable.adjacencyChunkCount,
    4,
    'the worst-case bidirectional sparse topology is independently chunked'
  );
  t.equal(
    getTraceCapacityContract(10_000_000, 0, {
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 256 * 1024 * 1024
    }).fitsChunkedDeviceLimits,
    true,
    'portable limits admit ten million spans without dependencies'
  );
  t.equal(
    getTraceCapacityContract(10_000_000, 250_000, {
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 256 * 1024 * 1024
    }).fitsChunkedDeviceLimits,
    true,
    'chunk-resolved endpoints admit dependencies without monolithic source allocations'
  );

  const maximum = getTraceCapacityContract(10_000_000, 10_000_000, {
    maxStorageBufferBindingSize: 1024 * 1024 * 1024,
    maxBufferSize: 1024 * 1024 * 1024
  });
  t.equal(maximum.fitsDeviceLimits, true, 'maximum-context limits admit the same source layout');
  t.end();
});

test('GPU trace dataset preflight leaves routine sizes frictionless and flags extreme work', t => {
  const routine = getTraceDatasetPreflight(4_000_000, 4_000_000);
  const extreme = getTraceDatasetPreflight(25_000_000, 25_000_000);
  t.equal(
    routine.requiresConfirmation,
    false,
    'the default 4M trace does not require confirmation'
  );
  t.equal(extreme.requiresConfirmation, true, 'the 25M trace requires a soft confirmation');
  t.ok(
    extreme.estimatedSourceByteLength > routine.estimatedSourceByteLength,
    'source topology estimates grow with trace size'
  );
  t.equal(
    extreme.dependencyCount,
    25_000_000,
    'preflight uses the requested actual dependency population'
  );
  t.equal(
    extreme.minimumScanInvocationCount,
    50_000_000,
    'preflight exposes the minimum full-data work'
  );
  t.end();
});

test('GPU trace workload counters report persistent memory and proportional work', t => {
  const firstBuffer = {byteLength: 320};
  const allocation = getTraceAllocationStats([
    firstBuffer,
    firstBuffer,
    {byteLength: 160},
    {byteLength: 40}
  ]);
  t.deepEqual(
    allocation,
    {bufferCount: 3, persistentByteLength: 520, largestBufferByteLength: 320},
    'allocation accounting deduplicates shared buffer identities'
  );
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
  t.equal(counters['candidate-span-percent'], 20, 'span work is reported as a candidate ratio');
  t.equal(
    counters['candidate-dependency-percent'],
    25,
    'dependency work is reported as a candidate ratio'
  );
  t.equal(counters['visible-span-percent'], 5, 'visible output is normalized by source size');
  t.equal(counters['candidate-span-upper-bound'], 512, 'candidate span work is bounded');
  t.equal(
    counters['candidate-dependency-upper-bound'],
    256,
    'candidate dependency work is bounded'
  );
  t.equal(counters['actual-output-rows'], 62, 'actual visible output work stays separate');
  t.equal(counters['persistent-bytes'], 520, 'persistent memory uses exact buffer accounting');
  t.equal(counters['filter-active'], 1, 'interaction modes are exposed as numeric counters');
  t.equal(counters['pick-active'], 0, 'inactive interaction modes remain explicit');
  t.equal(counters['overview-renderer'], 2, 'representative mode has a stable scalar code');
  t.equal(
    counters['overview-output-upper-bound'],
    TRACE_LANE_COUNT * 100,
    'representative output is bounded by lanes and pixel columns'
  );
  t.equal(
    counters['representative-search-cells'],
    TRACE_LANE_COUNT * 100 * 4,
    'chunk-local representative searches remain separate from final output'
  );
  t.end();
});

test('GPU trace overview frame timings retain renderer-specific percentile semantics', t => {
  t.equal(getTraceOverviewFrameTimingSummary([]), null, 'empty histories remain explicit');
  t.deepEqual(
    getTraceOverviewFrameTimingSummary([8, 2, 5, 3, 20]),
    {
      sampleCount: 5,
      latestMilliseconds: 20,
      p50Milliseconds: 5,
      p95Milliseconds: 20
    },
    'nearest-rank percentiles do not mutate chronological samples'
  );
  t.end();
});

test('GPU trace scan timing summary isolates and aggregates scan nodes', t => {
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
  t.deepEqual(
    summary,
    {nodeCount: 2, sampleCount: 7, p50Milliseconds: 0.75, p95Milliseconds: 1},
    'only scan stages contribute and the minimum common sample count is reported'
  );
  t.equal(getTraceScanTimingSummary({graphs: []}, 'trace'), null, 'missing samples return null');
  t.end();
});

test('GPU trace LOD switches at a stable trace-time-per-pixel threshold', t => {
  t.equal(getTraceDensityBlend(0, 50, 2000), 0, 'exact rendering leads into the blend');
  t.equal(getTraceDensityBlend(0, 80, 2000), 0.5, 'both renderers share the midpoint');
  t.equal(getTraceDensityBlend(0, 110, 2000), 1, 'density rendering finishes the blend');
  t.equal(getTraceDensityBlend(0, 50, 2000, false), 0, 'hard switch keeps the exact boundary');
  t.equal(getTraceDensityBlend(0, 79, 2000, false), 0, 'hard switch stays exact below midpoint');
  t.equal(getTraceDensityBlend(0, 80, 2000, false), 1, 'hard switch selects density at midpoint');
  t.equal(getTraceDensityBlend(0, 81, 2000, false), 1, 'hard switch stays density above midpoint');
  t.equal(getTraceDensityBlend(0, 110, 2000, false), 1, 'hard switch keeps density boundary');
  t.equal(isTraceDensityMode(0, 150, 2048), true, 'wide time range remains density-dominant');
  t.equal(isTraceDensityMode(0, 150, 1), true, 'zoomed-out viewport uses density bins');
  t.equal(isTraceDensityMode(10, 10.01, 0), false, 'zero-width viewport remains bounded');
  t.equal(
    getTraceOverviewRenderer(0, 50, 2000, 'auto', false),
    'exact',
    'auto keeps exact spans below the hard transition'
  );
  t.equal(
    getTraceOverviewRenderer(0, 80, 2000, 'density', false),
    'density',
    'explicit density takes over at the hard transition'
  );
  t.equal(
    getTraceOverviewRenderer(0, 80, 2000, 'representative', false),
    'representative',
    'explicit representatives take over at the hard transition'
  );
  t.equal(
    getTraceOverviewRenderer(0, 150, 2000, 'auto', false),
    'representative',
    'auto prefers canonical representatives at moderate overview scale'
  );
  t.equal(
    getTraceOverviewRenderer(0, 1000, 2000, 'auto', false),
    'density',
    'auto retains density bins at extreme overview scale'
  );
  t.notOk(
    isTraceDependencyBundlingEnabled(0, 4, 2000, 'auto'),
    'auto routing keeps readable close-up dependencies exact'
  );
  t.ok(
    isTraceDependencyBundlingEnabled(0, 5.1, 2000, 'auto'),
    'auto routing bundles dense exact views before the semantic handoff'
  );
  t.ok(
    isTraceDependencyBundlingEnabled(0, 80, 2000, 'auto'),
    'auto routing stays bundled through the semantic handoff'
  );
  t.notOk(
    isTraceDependencyBundlingEnabled(0, 1000, 2000, 'exact'),
    'exact routing always disables bundling'
  );
  t.ok(
    isTraceDependencyBundlingEnabled(0, 50, 2000, 'bundled'),
    'bundled routing remains available at close zoom'
  );
  t.end();
});

test('GPU trace dependency density rises smoothly and monotonically with zoom', t => {
  const maximumBudget = 2048;
  const traceDuration = 1000;
  const overviewBudget = getTraceDependencyDisplayBudget(
    maximumBudget,
    0,
    traceDuration,
    traceDuration
  );
  t.equal(
    overviewBudget,
    maximumBudget * TRACE_DEPENDENCY_OVERVIEW_DENSITY_FRACTION,
    'the full-trace overview starts at a sparse fraction of the selected maximum'
  );

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
  t.ok(
    budgets.every((budget, index) => index === 0 || budget > budgets[index - 1]),
    'every equal multiplicative zoom step adds dependency lines'
  );
  t.equal(
    budgets.at(-1),
    maximumBudget,
    'the configured zoom ratio reaches the selected maximum density'
  );
  t.equal(
    getTraceDependencyDisplayBudget(maximumBudget, 400, 525, traceDuration),
    getTraceDependencyDisplayBudget(maximumBudget, 0, 125, traceDuration),
    'panning at a fixed zoom preserves the dependency budget'
  );
  t.equal(
    getTraceDependencyDisplayBudget(0, 0, traceDuration, traceDuration),
    0,
    'a disabled maximum remains disabled'
  );
  t.end();
});

test('GPU trace density bins stay anchored while the viewport scrolls', t => {
  const first = getTraceDensityBinParameters(10, 110);
  const scrolled = getTraceDensityBinParameters(10.1, 110.1);
  const crossedBoundary = getTraceDensityBinParameters(10.3, 110.3);
  t.equal(first.duration, scrolled.duration, 'scrolling preserves the zoom-selected bin duration');
  t.equal(first.origin, scrolled.origin, 'sub-bin scrolling preserves the absolute bin anchor');
  const sampleTime = 50.1;
  const getSampleBinStart = ({origin, duration}: {origin: number; duration: number}): number =>
    origin + Math.floor((sampleTime - origin) / duration) * duration;
  t.equal(
    getSampleBinStart(first),
    getSampleBinStart(crossedBoundary),
    'crossing a window boundary does not change absolute bin membership'
  );
  t.equal(
    getTraceDensityBinParameters(10, 210).duration,
    first.duration * 2,
    'zooming out selects the next power-of-two density level'
  );
  t.end();
});

test('GPU trace adaptive LOD shaders parse as WGSL', t => {
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
      t.ok(new WgslReflect(shader), 'shader parses');
    } catch (error) {
      throw new Error(`shader ${shaderIndex} failed to parse`, {cause: error});
    }
  }
  for (const chunkIndex of [0, 1]) {
    const shader = getDependencyEndpointResolveShader(endpointRouting, chunkIndex);
    t.equal(
      shader.match(/const CHUNK_INDEX:/g)?.length,
      1,
      `dependency endpoint shader ${chunkIndex} declares its chunk index once`
    );
    t.match(
      shader,
      new RegExp(`const CHUNK_INDEX: u32 = ${chunkIndex}u;`),
      `dependency endpoint shader ${chunkIndex} declares the selected chunk index`
    );
  }
  t.match(
    getDependencyDispatchBudgetShader(TRACE_DEPENDENCY_FRAME_BATCH_BUDGET),
    new RegExp(`BATCH_BUDGET: u32 = ${TRACE_DEPENDENCY_FRAME_BATCH_BUDGET}u`),
    'dependency dispatch budget is embedded in the GPU-side publisher'
  );
  for (const chunkIndex of [0, 1]) {
    const shader = getDependencyEndpointResolveShader(endpointRouting, chunkIndex);
    t.equal(
      shader.match(/const CHUNK_INDEX:/g)?.length,
      1,
      `dependency endpoint shader ${chunkIndex} declares its chunk index once`
    );
    t.match(
      shader,
      new RegExp(`const CHUNK_INDEX: u32 = ${chunkIndex}u;`),
      `dependency endpoint shader ${chunkIndex} declares the selected chunk index`
    );
  }
  t.match(
    getDependencyIntersectionVisibilityShader(128),
    /segmentIntersectsViewport\(first, second\)/,
    'dependency visibility retains segments that cross the viewport'
  );
  t.match(
    getDependencyDisplayBudgetClearShader(5),
    /atomicStore\(&drawCommands\[DRAW_COUNT_WORD_OFFSET\], 0u\)/,
    'dependency display count is cleared before parallel selection'
  );
  t.match(
    getDependencyDisplayBudgetShader(128, 0, 2, 5),
    /getChunkBudget\(viewUniforms\.dependencyDisplayBudget\)/,
    'dependency display culling applies the configured viewport budget'
  );
  t.match(
    getDependencyDisplayBudgetShader(128, 0, 2, 5),
    /stableHash\(dependencyIndex\) >> 8u/,
    'dependency display culling keeps a stable monotonic ID-based sample while zooming'
  );
  t.match(
    getDependencyDisplayBudgetShader(128, 0, 2, 5),
    /atomicCompareExchangeWeak/,
    'dependency display selection reserves bounded output slots in parallel'
  );
  t.match(
    getDensityClearShader(),
    new RegExp(
      `DENSITY_BIN_COUNT: u32 = ${TRACE_DISPLAY_LANE_CAPACITY * TRACE_DENSITY_BIN_COUNT * TRACE_GROUPS.length}u`
    ),
    'density storage includes hierarchy gap rows'
  );
  t.match(
    getCandidateDensityShader(spanChunk),
    /for \(var bin = firstBin; bin <= lastBin; bin\+\+\)/,
    'density aggregation preserves long-span coverage across bins'
  );
  t.match(
    getCandidateDensityShader(spanChunk),
    /span\.start - viewUniforms\.densityBinOrigin/,
    'density aggregation uses scroll-stable trace-time bin membership'
  );
  t.match(
    getBatchVisibilityShader(3),
    /viewUniforms\.timeMin - timePadding/,
    'coarse visibility keeps a horizontal guard band around the viewport'
  );
  t.match(
    getCandidateVisibilityShader(spanChunk),
    /span\.start <= viewUniforms\.timeMax \+ timePadding/,
    'exact spans remain candidates until they clear the padded viewport edge'
  );
  t.match(
    getCandidatePassDispatchShader([
      {firstBatchIndex: 0, batchCount: 7},
      {firstBatchIndex: 7, batchCount: 5}
    ]),
    /lowerBoundCandidate/,
    'density dispatch partitions the stable candidate list at span-chunk boundaries'
  );
  t.match(
    getCandidateDensityShader(spanChunk),
    /candidateChunkOffsets\[CHUNK_INDEX\] \+ workgroupId\.y/,
    'density aggregation starts at its compacted chunk candidate offset'
  );
  t.match(
    getCandidatePickShader(spanChunk),
    /candidateChunkOffsets\[CHUNK_INDEX\] \+ workgroupId\.y/,
    'picking consumes only the candidate rows assigned to its span chunk'
  );
  t.match(
    TRACE_DENSITY_RENDER_SHADER,
    /traceTime - viewUniforms\.densityBinOrigin/,
    'stable density bins are projected into the moving viewport'
  );
  t.match(
    getCandidateDensityShader(spanChunk),
    /!retainedExactSpan/,
    'density aggregation excludes spans retained as exact geometry'
  );
  t.match(
    getCandidateVisibilityShader(spanChunk),
    /isFullExactModeActive\(\) \|\| isSpanWideEnoughForExactRendering\(span\.duration\)/,
    'wide spans remain eligible for exact compaction in density mode'
  );
  t.match(
    getCandidateVisibilityShader(spanChunk),
    /batch\.maximumDuration < getMinimumExactSpanDuration\(\)/,
    'coarse exact visibility rejects batches whose longest span is too narrow'
  );
  t.match(
    getBatchVisibilityShader(3),
    /batch\.maximumDuration >= getMinimumExactSpanDuration\(\)/,
    'the coarse pass creates a sparse exact batch list for wide spans'
  );
  t.match(
    TRACE_RENDER_SHADER,
    /viewUniforms\.lodFadeEnabled/,
    'rendering selects the smooth or hard LOD transition from the view uniform'
  );
  t.match(
    TRACE_RENDER_SHADER,
    /anomalyMask\[sourceIndex - spanChunk\.firstSpanIndex\]/,
    'exact and representative rendering consume chunk-local per-span anomaly masks'
  );
  t.match(
    TRACE_RENDER_SHADER,
    /verticalFraction < 0\.11/,
    'anomalous spans receive a restrained solid edge instead of a full-span color replacement'
  );
  t.match(
    TRACE_RENDER_SHADER,
    /select\(\s*1\.0,\s*spanReadability,\s*viewUniforms\.lodFadeEnabled != 0u\s*\)/,
    'hard-switch exact spans bypass sub-pixel readability fading'
  );
  t.match(
    TRACE_DENSITY_RENDER_SHADER,
    /pluginApplyFillPattern/,
    'aggregated density bins use the shared fill-pattern ShaderPlugin'
  );
  t.match(
    TRACE_DENSITY_RENDER_SHADER,
    /patternOffset = f32\(\(lane \* 3u\) % 10u\)/,
    'density patterns stagger their phase by lane instead of forming a screen-wide grid'
  );
  t.match(
    TRACE_DENSITY_RENDER_SHADER,
    /array<vec2<f32>, 3>/,
    'density rendering samples its GPU bins from one full-screen triangle'
  );
  t.equal(FillPattern.hash45, 2, 'the default diagonal dash pattern has a stable shader value');
  t.ok(fillPatternShaderPlugin.wgsl, 'the shared fill-pattern plugin supports WGSL');
  t.match(
    TRACE_RENDER_SHADER,
    /focusEnabled = viewUniforms\.focusMode != 0u && hasSelection/,
    'ordinary picking highlights its span without dimming the complete trace'
  );
  t.match(
    TRACE_PICKING_RENDER_SHADER,
    /indices = vec2<i32>\(i32\(input\.sourceIndex\), 0\)/,
    'raster span picking publishes canonical source rows in the shared integer target'
  );
  t.match(
    TRACE_DEPENDENCY_PICKING_RENDER_SHADER,
    /indices = vec2<i32>\(i32\(input\.dependencyIndex\), 1\)/,
    'raster dependency picking uses a distinct object-kind channel'
  );
  t.match(
    getCandidateLabelShader(spanChunk, 5),
    /spanPixelWidth < metric\.advancePixels/,
    'label expansion rejects strings that do not fit before reserving glyph occurrences'
  );
  t.match(
    TRACE_LABEL_RENDER_SHADER,
    /isGlyphVertexClipped\(input\.glyphPixelOffset, input\.clipRect\)/,
    'label rendering retains a final span clip-rectangle guard'
  );
  t.match(
    TRACE_LABEL_RENDER_SHADER,
    /-textDictionaryStyle\.lineHeightPixels \* 0\.5/,
    'the label line box is centered vertically around the span midpoint'
  );
  t.end();
});

test('GPU trace focus seed exposes only resources consumed by its compute entry point', t => {
  const reflection = new WgslReflect(getFocusFrontierSeedShader(11));
  t.deepEqual(
    reflection.storage.map(resource => ({name: resource.name, location: resource.binding})),
    [
      {name: 'selectedSeeds', location: 0},
      {name: 'activeSeedCount', location: 1},
      {name: 'focusTraversalState', location: 2},
      {name: 'reachedSpans', location: 3},
      {name: 'frontier', location: 4},
      {name: 'frontierCount', location: 5},
      {name: 'dispatchCommand', location: 6}
    ],
    'seed bindings match the native WebGPU pipeline layout without an optimized-out slot'
  );
  t.end();
});

test('GPU trace data preserves deterministic canonical group and hierarchy identities', t => {
  const dataset = makeTraceDataset(257);
  const repeated = makeTraceDataset(257);
  t.equal(dataset.groups.length, TRACE_GROUPS.length, 'creates all stable draw groups');
  t.deepEqual(
    dataset.groups.map(group => [group.firstSpanIndex, group.count]),
    [
      [0, 86],
      [86, 86],
      [172, 85]
    ],
    'group ranges completely cover canonical source rows'
  );
  t.deepEqual(dataset.spans, repeated.spans, 'source data is deterministic');
  t.deepEqual(dataset.dependencies, repeated.dependencies, 'dependency data is deterministic');
  t.equal(dataset.processCount, TRACE_PROCESS_COUNT, 'publishes stable process count');
  t.equal(dataset.threadCount, TRACE_THREAD_COUNT, 'publishes stable thread count');
  t.equal(dataset.parentSpans.length, dataset.spanCount, 'publishes one canonical parent per span');

  for (const group of dataset.groups) {
    t.equal(group.data.buffer, dataset.spans.buffer, 'group borrows canonical source allocation');
    for (let rowIndex = 0; rowIndex < group.count; rowIndex++) {
      const sourceIndex = group.firstSpanIndex + rowIndex;
      const wordOffset = sourceIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
      const laneIndex = dataset.spans[wordOffset + 2];
      const threadIndex = dataset.spans[wordOffset + 5];
      t.equal(dataset.spans[wordOffset + 3], group.groupIndex, 'row retains its draw group');
      t.equal(dataset.spans[wordOffset + 6], sourceIndex, 'row retains its stable source identity');
      t.equal(
        threadIndex,
        Math.floor(laneIndex / TRACE_LANES_PER_THREAD),
        'lane resolves to its owning thread'
      );
      t.equal(
        dataset.spans[wordOffset + 4],
        Math.floor(threadIndex / TRACE_THREADS_PER_PROCESS),
        'thread resolves to its owning process'
      );
    }
  }
  t.deepEqual(
    makeTraceGroups(7).map(group => group.count),
    [3, 2, 2],
    'the original trace-group helper remains compatible'
  );
  t.end();
});

test('GPU trace duration grows with tightly packed non-overlapping lane slots', t => {
  t.equal(getTraceDuration(250_000), 1000, 'the baseline capacity retains a one-second trace');
  t.ok(
    Math.abs(getTraceDuration(1_000_000) - 4000) < 2,
    'one million spans expands to about four seconds'
  );
  t.ok(
    Math.abs(getTraceDuration(10_000_000) - 40_000) < 25,
    'ten million spans expands to about forty seconds'
  );

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
      t.ok(
        spans[spanIndex][0] >= spans[spanIndex - 1][1],
        'successive spans in one lane do not overlap'
      );
      sameGroupNeighborCount += Number(spans[spanIndex][2] === spans[spanIndex - 1][2]);
      neighborCount++;
    }
  }
  t.ok(
    sameGroupNeighborCount / neighborCount > 0.9,
    'span groups form coherent lane phases instead of alternating every span'
  );
  t.ok(
    focusedLaneCount / laneSpans.length > 0.9,
    'most lanes spend a clear majority of their time on one span group'
  );
  const occupancy = occupiedDuration / (dataset.duration * TRACE_LANE_COUNT);
  t.ok(
    occupancy > 0.4 && occupancy < 0.8,
    'lane packing remains dense while sparse extra-wide spans extend individual lanes'
  );
  t.ok(minimumDuration < 0.05, 'the trace includes very short spans');
  t.ok(maximumDuration > 20, 'the trace includes very wide spans');
  t.ok(maximumDuration > 100, 'the trace includes sparse spans that survive coarse density LOD');
  t.ok(
    maximumDuration > TRACE_DURATION_FILTER_MAXIMUM,
    'duration filter maximum retains spans from the generated upper tail'
  );
  t.ok(
    dataset.groups.every(group => {
      const groupFloats = new Float32Array(
        group.data.buffer,
        group.data.byteOffset,
        group.data.length
      );
      return groupFloats[0] < getTraceDuration(TRACE_LANE_COUNT);
    }),
    'all color groups appear in the first timeline slot'
  );
  t.end();
});

test('GPU trace dependency generation respects its independent capacity', t => {
  const dataset = makeTraceDataset(10_000, 250);
  t.equal(dataset.spanCount, 10_000, 'span capacity remains independent');
  t.equal(dataset.dependencyCount, 250, 'dependency generation stops at its requested capacity');
  t.equal(makeTraceDataset(10_000, 0).dependencyCount, 0, 'zero dependencies are supported');
  t.end();
});

test('GPU trace dependency chunks preserve complete candidate batches', t => {
  const dataset = makeTraceDataset(10_000, 10_000);
  const maximumChunkByteLength = TRACE_DEPENDENCY_CHUNK_TARGET_BYTE_LENGTH / 1024;
  const chunks = makeTraceDependencyChunks(
    dataset.dependencies,
    dataset.dependencyBatches,
    maximumChunkByteLength
  );
  t.ok(chunks.length > 1, 'small test chunk target produces multiple dependency chunks');
  t.equal(
    chunks.reduce((sum, chunk) => sum + chunk.dependencyCount, 0),
    dataset.dependencyCount,
    'dependency chunks cover every canonical dependency exactly once'
  );
  t.ok(
    chunks.every(
      chunk =>
        chunk.data.byteOffset ===
        dataset.dependencies.byteOffset +
          chunk.firstDependencyIndex *
            TRACE_DEPENDENCY_RECORD_WORD_LENGTH *
            Uint32Array.BYTES_PER_ELEMENT
    ),
    'dependency chunks borrow canonical storage without repacking'
  );
  t.ok(
    chunks.every(
      chunk =>
        chunk.dependencyCount ===
        dataset.dependencyBatches
          .slice(chunk.firstBatchIndex, chunk.firstBatchIndex + chunk.batchCount)
          .reduce((sum, batch) => sum + batch.count, 0)
    ),
    'no dependency batch crosses a chunk boundary'
  );
  for (const chunk of chunks) {
    const localBatchIndex = makeTraceDependencyChunkBatchIndex(dataset.dependencyBatchIndex, chunk);
    t.equal(localBatchIndex[0], 0, 'each dependency chunk starts at local row zero');
    for (let localIndex = 0; localIndex < chunk.batchCount; localIndex++) {
      const wordOffset = localIndex * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH;
      t.equal(
        localBatchIndex[wordOffset + 5],
        localIndex,
        'each dependency chunk publishes local stable batch IDs'
      );
    }
  }
  t.end();
});

test('GPU trace dependency batches preserve identity and conservative ancestor bounds', t => {
  const dataset = makeTraceDataset(2048);
  const {dependencyBatches, dependencyBatchIndex} = makeTraceDependencyBatches(
    dataset.spans,
    dataset.dependencies,
    dataset.parentSpans,
    7
  );
  t.equal(
    dependencyBatchIndex.length,
    dependencyBatches.length * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
    'publishes one fixed-width GPU index record per dependency batch'
  );
  const indexFloats = new Float32Array(dependencyBatchIndex.buffer);
  for (const batch of dependencyBatches) {
    const indexOffset = batch.batchIndex * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH;
    t.equal(
      dependencyBatchIndex[indexOffset],
      batch.firstDependencyIndex,
      'index preserves dependency base'
    );
    t.equal(dependencyBatchIndex[indexOffset + 1], batch.count, 'index preserves batch length');
    t.equal(dependencyBatchIndex[indexOffset + 4], batch.familyMask, 'index preserves families');
    t.equal(dependencyBatchIndex[indexOffset + 5], batch.batchIndex, 'index preserves identity');
    t.ok(
      Math.abs(indexFloats[indexOffset + 2] - batch.timeMin) < 0.001,
      'index preserves minimum time'
    );
    t.ok(
      Math.abs(indexFloats[indexOffset + 3] - batch.timeMax) < 0.001,
      'index preserves maximum time'
    );
  }
  t.throws(
    () => makeTraceDependencyBatches(dataset.spans, dataset.dependencies, dataset.parentSpans, 0),
    /positive safe integer/,
    'invalid dependency batch capacity is rejected'
  );
  t.end();
});

test('GPU trace span batches preserve global identity and publish coarse index bounds', t => {
  const dataset = makeTraceDataset(11);
  const {spanBatches, spanBatchIndex} = makeTraceSpanBatches(dataset.spans, dataset.groups, 2);
  t.deepEqual(
    spanBatches.map(batch => [batch.firstSpanIndex, batch.count, batch.groupIndex]),
    [
      [0, 2, 0],
      [2, 2, 0],
      [4, 2, 1],
      [6, 2, 1],
      [8, 2, 2],
      [10, 1, 2]
    ],
    'batches remain group aligned and completely cover source rows'
  );
  t.equal(
    spanBatchIndex.length,
    spanBatches.length * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
    'publishes one fixed-width GPU index record per batch'
  );
  const spanFloats = new Float32Array(dataset.spans.buffer);
  const indexFloats = new Float32Array(spanBatchIndex.buffer);
  for (const batch of spanBatches) {
    const indexOffset = batch.batchIndex * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH;
    t.equal(spanBatchIndex[indexOffset], batch.firstSpanIndex, 'index preserves global base');
    t.equal(spanBatchIndex[indexOffset + 1], batch.count, 'index preserves batch length');
    t.equal(spanBatchIndex[indexOffset + 6], batch.groupIndex, 'index preserves group identity');
    t.equal(spanBatchIndex[indexOffset + 7], batch.batchIndex, 'index preserves batch identity');
    t.ok(
      Math.abs(indexFloats[indexOffset + 2] - batch.timeMin) < 0.001,
      'index preserves minimum time'
    );
    t.ok(
      Math.abs(indexFloats[indexOffset + 3] - batch.timeMax) < 0.001,
      'index preserves maximum time'
    );
    t.ok(
      Math.abs(indexFloats[indexOffset + 8] - batch.maximumDuration) < 0.001,
      'index preserves maximum span duration'
    );
    for (let rowIndex = 0; rowIndex < batch.count; rowIndex++) {
      const sourceIndex = batch.firstSpanIndex + rowIndex;
      const wordOffset = sourceIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
      const start = spanFloats[wordOffset];
      const end = start + spanFloats[wordOffset + 1];
      const lane = dataset.spans[wordOffset + 2];
      t.ok(start >= batch.timeMin && end <= batch.timeMax, 'batch encloses span time');
      t.ok(lane >= batch.laneMin && lane < batch.laneMax, 'batch encloses span lane');
      t.ok(spanFloats[wordOffset + 1] <= batch.maximumDuration, 'batch encloses span duration');
    }
  }
  for (const group of dataset.groups) {
    const groupBatches = spanBatches.filter(batch => batch.groupIndex === group.groupIndex);
    const slotDuration = getTraceDuration(TRACE_LANE_COUNT);
    for (let batchIndex = 1; batchIndex < groupBatches.length; batchIndex++) {
      t.ok(
        Math.floor(groupBatches[batchIndex].timeMin / slotDuration) >=
          Math.floor(groupBatches[batchIndex - 1].timeMin / slotDuration),
        'group batches retain increasing temporal-slot locality'
      );
    }
  }
  t.equal(spanBatches[0].data.buffer, dataset.spans.buffer, 'batch borrows canonical storage');
  t.throws(
    () => makeTraceSpanBatches(dataset.spans, dataset.groups, 0),
    /positive safe integer/,
    'invalid batch capacity is rejected'
  );
  t.end();
});

test('GPU trace temporal index builds conservative source-ordered hierarchy levels', t => {
  const dataset = makeTraceDataset(96);
  const {spanBatches} = makeTraceSpanBatches(dataset.spans, dataset.groups, 2);
  const temporalIndex = makeTraceTemporalIndex(spanBatches, 2, 8);
  const floats = new Float32Array(temporalIndex.data.buffer);
  t.deepEqual(
    temporalIndex.levels.map(level => level.maximumBatchCount),
    [2, 4, 8],
    'each level doubles its bounded leaf range'
  );
  t.equal(
    temporalIndex.data.length,
    temporalIndex.levels.reduce((sum, level) => sum + level.nodeCount, 0) *
      TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH,
    'packed levels cover every hierarchy node exactly once'
  );
  for (const level of temporalIndex.levels) {
    for (let localNodeIndex = 0; localNodeIndex < level.nodeCount; localNodeIndex++) {
      const nodeIndex = level.firstNodeIndex + localNodeIndex;
      const wordOffset = nodeIndex * TRACE_TEMPORAL_INDEX_RECORD_WORD_LENGTH;
      const groupIndex = temporalIndex.data[wordOffset + 3];
      const firstBatchIndex = temporalIndex.data[wordOffset + 4];
      const batchCount = temporalIndex.data[wordOffset + 5];
      const leaves = spanBatches.slice(firstBatchIndex, firstBatchIndex + batchCount);
      t.ok(leaves.length > 0, 'node owns at least one canonical leaf batch');
      t.ok(
        leaves.every(batch => batch.groupIndex === groupIndex),
        'node never crosses a renderer-group boundary'
      );
      t.ok(
        leaves.every(
          batch =>
            Math.fround(batch.timeMin) >= floats[wordOffset] &&
            Math.fround(batch.timeMax) <= floats[wordOffset + 1]
        ),
        'node time bounds conservatively contain every owned leaf'
      );
      t.ok(
        leaves.every(batch => Math.fround(batch.maximumDuration) <= floats[wordOffset + 2]),
        'node duration bound conservatively contains every owned leaf'
      );
      t.ok(
        leaves.every(
          batch =>
            batch.laneMin >= temporalIndex.data[wordOffset + 6] &&
            batch.laneMax <= temporalIndex.data[wordOffset + 7]
        ),
        'node lane bounds conservatively contain every owned leaf'
      );
    }
  }
  t.equal(
    getTraceTemporalIndexLevel(temporalIndex.levels, Number.EPSILON),
    0,
    'a close view uses the finest hierarchy level'
  );
  t.equal(
    getTraceTemporalIndexLevel(temporalIndex.levels, 1e6),
    temporalIndex.levels.length - 1,
    'a full overview uses the coarsest hierarchy level'
  );
  t.end();
});

test('GPU trace data publishes stable forward and reverse dependency adjacency', t => {
  const dataset = makeTraceDataset(513);
  t.ok(dataset.dependencyCount > 0, 'generates realistic sparse dependencies');
  t.equal(
    dataset.outgoing.offsets.length,
    dataset.outgoing.nodes.length + 1,
    'forward CSR owns one offset per active source plus its sentinel'
  );
  t.equal(
    dataset.incoming.offsets.length,
    dataset.incoming.nodes.length + 1,
    'reverse CSR owns one offset per active destination plus its sentinel'
  );
  t.equal(
    dataset.outgoing.offsets[dataset.outgoing.nodes.length],
    dataset.dependencyCount,
    'forward sentinel equals the canonical dependency count'
  );
  t.equal(
    dataset.incoming.offsets[dataset.incoming.nodes.length],
    dataset.dependencyCount,
    'reverse sentinel equals the canonical dependency count'
  );
  t.ok(
    dataset.outgoing.nodes.length <= dataset.dependencyCount &&
      dataset.incoming.nodes.length <= dataset.dependencyCount,
    'both directions allocate rows only for nodes that own edges'
  );
  for (const adjacency of [dataset.outgoing, dataset.incoming]) {
    for (let rowIndex = 0; rowIndex < adjacency.nodes.length; rowIndex++) {
      if (rowIndex > 0) {
        t.ok(
          adjacency.nodes[rowIndex] > adjacency.nodes[rowIndex - 1],
          'sparse owner rows preserve strict global-ID order for GPU binary search'
        );
      }
      t.ok(
        adjacency.offsets[rowIndex + 1] > adjacency.offsets[rowIndex],
        'every sparse owner row contains at least one dependency'
      );
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
    t.deepEqual(
      Array.from(getTraceAdjacencyNeighbors(dataset.outgoing, spanIndex)),
      expectedOutgoing[spanIndex],
      'forward CSR preserves canonical dependency order exactly'
    );
    t.deepEqual(
      Array.from(getTraceAdjacencyNeighbors(dataset.incoming, spanIndex)),
      expectedIncoming[spanIndex],
      'reverse CSR preserves canonical dependency order exactly'
    );
  }
  for (let spanIndex = 0; spanIndex < dataset.spanCount; spanIndex++) {
    const parentSpanIndex = dataset.parentSpans[spanIndex];
    if (parentSpanIndex === TRACE_INVALID_SPAN_INDEX) {
      continue;
    }
    const incoming = getTraceAdjacencyNeighbors(dataset.incoming, spanIndex);
    t.ok(incoming.includes(parentSpanIndex), 'canonical ancestry is backed by a real parent edge');
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
    t.ok(outgoing.includes(destination), 'forward CSR contains the canonical destination');
    t.ok(incoming.includes(source), 'reverse CSR contains the canonical source');
    t.equal(metadata & 0xff, TRACE_PARENT_DEPENDENCY_FLAG, 'parent classification remains numeric');
    if (family === TRACE_SAME_PROCESS_DEPENDENCY) {
      sameProcessCount++;
      t.equal(
        dataset.spans[source * TRACE_SPAN_RECORD_WORD_LENGTH + 5],
        dataset.spans[destination * TRACE_SPAN_RECORD_WORD_LENGTH + 5],
        'same-process edges preserve their source thread'
      );
    } else if (family === TRACE_CROSS_PROCESS_DEPENDENCY) {
      crossProcessCount++;
      t.notEqual(
        dataset.spans[source * TRACE_SPAN_RECORD_WORD_LENGTH + 4],
        dataset.spans[destination * TRACE_SPAN_RECORD_WORD_LENGTH + 4],
        'cross-process edges connect distinct process owners'
      );
    }
  }
  t.ok(sameProcessCount > 0, 'includes same-thread parent dependencies');
  t.ok(crossProcessCount > 0, 'includes cross-process parent dependencies');
  t.equal(
    getMaximumTraceAdjacencyByteLength(250_000),
    6_000_008,
    '250K dependencies need at most 6 MB of bidirectional sparse adjacency at any span count'
  );
  t.ok(
    getMaximumTraceAdjacencyByteLength(250_000) * 100 <
      2 * (100_000_000 + 1 + 250_000) * Uint32Array.BYTES_PER_ELEMENT,
    '100M spans with 250K dependencies use over 100x less adjacency storage than dense CSR'
  );
  t.end();
});

test('GPU trace generation reports phases and releases uploaded CPU storage', t => {
  const phases: string[] = [];
  const dataset = makeTraceDataset(513, 513, phase => phases.push(phase));
  const spanCount = dataset.spanCount;
  const dependencyCount = dataset.dependencyCount;

  t.deepEqual(
    phases,
    ['spans', 'dependencies', 'indexes', 'adjacency', 'complete'],
    'worker-facing progress follows the expensive generation phases'
  );
  t.ok(dataset.spans.byteLength > 0, 'generated source storage starts populated');
  t.ok(dataset.outgoing.neighbors.byteLength > 0, 'generated adjacency starts populated');

  releaseTraceDatasetStorage(dataset);

  t.equal(dataset.spanCount, spanCount, 'release preserves span metadata');
  t.equal(dataset.dependencyCount, dependencyCount, 'release preserves dependency metadata');
  t.equal(dataset.spans.byteLength, 0, 'release drops canonical span storage');
  t.equal(dataset.temporalIndex.data.byteLength, 0, 'release drops temporal index storage');
  t.equal(dataset.dependencies.byteLength, 0, 'release drops canonical dependency storage');
  t.equal(dataset.outgoing.neighbors.byteLength, 0, 'release drops outgoing adjacency storage');
  t.equal(dataset.incoming.neighbors.byteLength, 0, 'release drops incoming adjacency storage');
  t.ok(
    dataset.groups.every(group => group.data.byteLength === 0),
    'release drops group views'
  );
  t.ok(
    dataset.spanBatches.every(batch => batch.data.byteLength === 0),
    'release drops batch views'
  );
  t.ok(
    dataset.dependencyChunks.every(chunk => chunk.data.byteLength === 0),
    'release drops dependency chunk views'
  );
  t.end();
});

test('GPU trace data handles empty inputs and rejects invalid capacities', t => {
  const dataset = makeTraceDataset(0);
  t.equal(dataset.spans.length, 0, 'empty traces have no span rows');
  t.equal(dataset.dependencies.length, 0, 'empty traces have no dependency rows');
  t.equal(dataset.parentSpans.length, 0, 'empty traces have no canonical parent rows');
  t.equal(dataset.spanBatches.length, 0, 'empty traces have no span batches');
  t.equal(dataset.spanBatchIndex.length, 0, 'empty traces have no batch index records');
  t.equal(dataset.temporalIndex.data.length, 0, 'empty traces have no temporal index nodes');
  t.equal(dataset.temporalIndex.levels.length, 0, 'empty traces have no temporal index levels');
  t.equal(dataset.dependencyBatches.length, 0, 'empty traces have no dependency batches');
  t.equal(
    dataset.dependencyBatchIndex.length,
    0,
    'empty traces have no dependency batch index records'
  );
  t.deepEqual(Array.from(dataset.outgoing.nodes), [], 'empty forward CSR has no active rows');
  t.deepEqual(Array.from(dataset.outgoing.offsets), [0], 'empty forward CSR has a sentinel');
  t.deepEqual(Array.from(dataset.incoming.nodes), [], 'empty reverse CSR has no active rows');
  t.deepEqual(Array.from(dataset.incoming.offsets), [0], 'empty reverse CSR has a sentinel');
  t.throws(() => makeTraceDataset(-1), /nonnegative uint32/, 'negative capacity is rejected');
  t.throws(() => makeTraceDataset(1.5), /nonnegative uint32/, 'fractional capacity is rejected');
  t.throws(
    () => makeTraceDataset(1, -1),
    /dependency count must be a nonnegative uint32/,
    'negative dependency capacity is rejected'
  );
  t.end();
});

function getTraceAdjacencyNeighbors(adjacency: TraceAdjacencyData, node: number): Uint32Array {
  const rowIndex = adjacency.nodes.indexOf(node);
  return rowIndex < 0
    ? adjacency.neighbors.subarray(0, 0)
    : adjacency.neighbors.subarray(adjacency.offsets[rowIndex], adjacency.offsets[rowIndex + 1]);
}
