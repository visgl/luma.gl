// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';
import {getTraceRow, makeDeckTraceData} from '../../examples/deck/gpu-culled-trace/trace-data';
import {
  getTraceCapacityOptions,
  getTraceDependencyCapacityOptions,
  isTraceDensityMode,
  makeTraceDependencyBatches,
  makeTraceDataset,
  makeTraceGroups,
  makeTraceSpanBatches,
  TRACE_CROSS_PROCESS_DEPENDENCY,
  TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
  TRACE_DEPENDENCY_RECORD_WORD_LENGTH,
  TRACE_GROUPS,
  TRACE_INVALID_SPAN_INDEX,
  TRACE_LANES_PER_THREAD,
  TRACE_PARENT_DEPENDENCY_FLAG,
  TRACE_PROCESS_COUNT,
  TRACE_SAME_PROCESS_DEPENDENCY,
  TRACE_SPAN_RECORD_WORD_LENGTH,
  TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
  TRACE_THREAD_COUNT,
  TRACE_THREADS_PER_PROCESS
} from '../../examples/experimental/gpu-trace-viewer/trace-data';
import {
  getBatchVisibilityShader,
  getCandidateDensityShader,
  getCandidatePassDispatchShader,
  getCandidatePickShader,
  getCandidateVisibilityShader,
  getCandidateDependencyVisibilityShader,
  getDensityClearShader,
  getDependencyBatchVisibilityShader,
  getFocusFrontierClearShader,
  getFocusFrontierDispatchShader,
  getFocusFrontierExpansionShader,
  getFocusFrontierSeedShader,
  getPickClearShader,
  getTraceDrawCommandsShader,
  TRACE_DENSITY_RENDER_SHADER,
  TRACE_DEPENDENCY_RENDER_SHADER,
  TRACE_RENDER_SHADER
} from '../../examples/experimental/gpu-trace-viewer/trace-shaders';

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
    [250_000, 1_000_000, 4_000_000],
    'portable limits retain the four-million-span ceiling'
  );
  t.deepEqual(
    getTraceDependencyCapacityOptions(128 * 1024 * 1024, 256 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000],
    'dependency options use their smaller fixed-width record size'
  );
  t.deepEqual(
    getTraceCapacityOptions(256 * 1024 * 1024, 1024 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000],
    'a 256 MiB storage binding remains below the ten-million-span requirement'
  );
  t.deepEqual(
    getTraceCapacityOptions(1024 * 1024 * 1024, 1024 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000, 10_000_000],
    'maximum adapters expose the ten-million-span demonstration'
  );
  t.end();
});

test('GPU trace LOD switches at a stable trace-time-per-pixel threshold', t => {
  t.equal(isTraceDensityMode(0, 150, 2048), false, 'wide viewport keeps exact spans');
  t.equal(isTraceDensityMode(0, 150, 1), true, 'zoomed-out viewport uses density bins');
  t.equal(isTraceDensityMode(10, 10.01, 0), false, 'zero-width viewport remains bounded');
  t.end();
});

test('GPU trace adaptive LOD shaders parse as WGSL', t => {
  const shaders = [
    TRACE_RENDER_SHADER,
    TRACE_DEPENDENCY_RENDER_SHADER,
    TRACE_DENSITY_RENDER_SHADER,
    getBatchVisibilityShader(3),
    getPickClearShader(),
    getCandidateVisibilityShader(),
    getCandidatePassDispatchShader(),
    getDensityClearShader(),
    getCandidateDensityShader(),
    getCandidatePickShader(),
    getTraceDrawCommandsShader([
      {firstBatchIndex: 0, batchCount: 2},
      {firstBatchIndex: 2, batchCount: 1}
    ]),
    getDependencyBatchVisibilityShader(3),
    getCandidateDependencyVisibilityShader(11),
    getFocusFrontierSeedShader(11),
    getFocusFrontierClearShader(),
    getFocusFrontierExpansionShader({
      spanCount: 11,
      sourceNodeBase: 0,
      sourceNodeCount: 6,
      offsetWordBase: 0,
      neighborWordBase: 0,
      neighborCount: 4,
      depth: 0
    }),
    getFocusFrontierDispatchShader()
  ];
  for (const shader of shaders) {
    t.ok(new WgslReflect(shader), 'shader parses');
  }
  t.end();
});

test('GPU trace data preserves deterministic canonical group and hierarchy identities', t => {
  const dataset = makeTraceDataset(257);
  const repeated = makeTraceDataset(257);
  t.equal(dataset.groups.length, TRACE_GROUPS.length, 'creates all stable draw groups');
  t.deepEqual(
    dataset.groups.map(group => [group.firstSpanIndex, group.count]),
    [
      [0, 85],
      [85, 85],
      [170, 87]
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
    [2, 2, 3],
    'the original trace-group helper remains compatible'
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
      [2, 1, 0],
      [3, 2, 1],
      [5, 1, 1],
      [6, 2, 2],
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
    for (let rowIndex = 0; rowIndex < batch.count; rowIndex++) {
      const sourceIndex = batch.firstSpanIndex + rowIndex;
      const wordOffset = sourceIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
      const start = spanFloats[wordOffset];
      const end = start + spanFloats[wordOffset + 1];
      const lane = dataset.spans[wordOffset + 2];
      t.ok(start >= batch.timeMin && end <= batch.timeMax, 'batch encloses span time');
      t.ok(lane >= batch.laneMin && lane < batch.laneMax, 'batch encloses span lane');
    }
  }
  for (const group of dataset.groups) {
    const groupBatches = spanBatches.filter(batch => batch.groupIndex === group.groupIndex);
    for (let batchIndex = 1; batchIndex < groupBatches.length; batchIndex++) {
      t.ok(
        groupBatches[batchIndex].timeMin >= groupBatches[batchIndex - 1].timeMin,
        'group batches retain increasing temporal locality'
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

test('GPU trace data publishes stable forward and reverse dependency adjacency', t => {
  const dataset = makeTraceDataset(513);
  t.ok(dataset.dependencyCount > 0, 'generates realistic sparse dependencies');
  t.equal(
    dataset.outgoing.offsets.length,
    dataset.spanCount + 1,
    'forward CSR owns one offset per span plus its sentinel'
  );
  t.equal(
    dataset.incoming.offsets.length,
    dataset.spanCount + 1,
    'reverse CSR owns one offset per span plus its sentinel'
  );
  t.equal(
    dataset.outgoing.offsets[dataset.spanCount],
    dataset.dependencyCount,
    'forward sentinel equals the canonical dependency count'
  );
  t.equal(
    dataset.incoming.offsets[dataset.spanCount],
    dataset.dependencyCount,
    'reverse sentinel equals the canonical dependency count'
  );
  for (let spanIndex = 0; spanIndex < dataset.spanCount; spanIndex++) {
    const parentSpanIndex = dataset.parentSpans[spanIndex];
    if (parentSpanIndex === TRACE_INVALID_SPAN_INDEX) {
      continue;
    }
    const incoming = dataset.incoming.neighbors.subarray(
      dataset.incoming.offsets[spanIndex],
      dataset.incoming.offsets[spanIndex + 1]
    );
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
    const outgoing = dataset.outgoing.neighbors.subarray(
      dataset.outgoing.offsets[source],
      dataset.outgoing.offsets[source + 1]
    );
    const incoming = dataset.incoming.neighbors.subarray(
      dataset.incoming.offsets[destination],
      dataset.incoming.offsets[destination + 1]
    );
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
  t.end();
});

test('GPU trace data handles empty inputs and rejects invalid capacities', t => {
  const dataset = makeTraceDataset(0);
  t.equal(dataset.spans.length, 0, 'empty traces have no span rows');
  t.equal(dataset.dependencies.length, 0, 'empty traces have no dependency rows');
  t.equal(dataset.parentSpans.length, 0, 'empty traces have no canonical parent rows');
  t.equal(dataset.spanBatches.length, 0, 'empty traces have no span batches');
  t.equal(dataset.spanBatchIndex.length, 0, 'empty traces have no batch index records');
  t.equal(dataset.dependencyBatches.length, 0, 'empty traces have no dependency batches');
  t.equal(
    dataset.dependencyBatchIndex.length,
    0,
    'empty traces have no dependency batch index records'
  );
  t.deepEqual(Array.from(dataset.outgoing.offsets), [0], 'empty forward CSR has a sentinel');
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
