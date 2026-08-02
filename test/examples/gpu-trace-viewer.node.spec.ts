// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {WgslReflect} from 'wgsl_reflect';
import {
  getTraceCapacityOptions,
  isTraceDensityMode,
  makeTraceDataset,
  makeTraceGroups,
  makeTraceSpanBatches,
  TRACE_CROSS_PROCESS_DEPENDENCY,
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
  getDependencyVisibilityShader,
  getFocusMaskShader,
  getPickClearShader,
  getVisibilityShader,
  TRACE_DENSITY_RENDER_SHADER,
  TRACE_DEPENDENCY_RENDER_SHADER,
  TRACE_RENDER_SHADER
} from '../../examples/experimental/gpu-trace-viewer/trace-shaders';

test('GPU trace capacity options adapt to negotiated WebGPU buffer limits', t => {
  t.deepEqual(
    getTraceCapacityOptions(128 * 1024 * 1024, 256 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000],
    'portable limits retain the four-million-span ceiling'
  );
  t.deepEqual(
    getTraceCapacityOptions(256 * 1024 * 1024, 1024 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000],
    'larger limits retain the interactive demonstration ceiling'
  );
  t.deepEqual(
    getTraceCapacityOptions(1024 * 1024 * 1024, 1024 * 1024 * 1024),
    [250_000, 1_000_000, 4_000_000],
    'maximum adapters retain the interactive demonstration ceiling'
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
    getFocusMaskShader(17),
    getPickClearShader(),
    getVisibilityShader(17, 1, 5),
    getDependencyVisibilityShader(11)
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
    const flags = dataset.dependencies[wordOffset + 3];
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
    t.equal(flags, TRACE_PARENT_DEPENDENCY_FLAG, 'parent classification remains numeric');
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
  t.deepEqual(Array.from(dataset.outgoing.offsets), [0], 'empty forward CSR has a sentinel');
  t.deepEqual(Array.from(dataset.incoming.offsets), [0], 'empty reverse CSR has a sentinel');
  t.throws(() => makeTraceDataset(-1), /nonnegative uint32/, 'negative capacity is rejected');
  t.throws(() => makeTraceDataset(1.5), /nonnegative uint32/, 'fractional capacity is rejected');
  t.end();
});
