// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getTestDevices, getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {QuerySet} from '@luma.gl/core';

test('QuerySet construct/delete', async t => {
  for (const device of await getTestDevices()) {
    const querySet = device.createQuerySet({type: 'occlusion', count: 1});
    t.ok(querySet instanceof QuerySet, 'QuerySet construction successful');
    querySet.destroy();
    t.pass('QuerySet delete successful');
  }
  t.end();
});

test('QuerySet timestamp duration', async t => {
  for (const device of await getTestDevices()) {
    if (!device.features.has('timestamp-query')) {
      t.comment(`${device.type} does not support timestamp queries`);
    } else {
      const querySet = device.createQuerySet({type: 'timestamp', count: 2});
      t.notOk(
        querySet.isResultAvailable(),
        `${device.type} timestamp result unavailable before recording`
      );

      device.commandEncoder.writeTimestamp(querySet, 0);
      device.commandEncoder.writeTimestamp(querySet, 1);
      device.submit();

      const duration = await querySet.readTimestampDuration(0, 1);
      t.ok(duration >= 0, `${device.type} timestamp duration is non-negative`);

      querySet.destroy();
    }
  }
  t.end();
});

test('WebGPU QuerySet defers inline resolve when a readback is already in flight', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  if (!device.features.has('timestamp-query')) {
    t.comment('WebGPU timestamp queries are not supported');
    t.end();
    return;
  }

  const querySet = device.createQuerySet({type: 'timestamp', count: 2}) as any;
  querySet._resultsPendingResolution = true;
  querySet._readResultsPromise = new Promise<bigint[]>(() => {});

  let resolveQuerySetCallCount = 0;
  let copyBufferToBufferCallCount = 0;
  const encoded = querySet._encodeResolveToReadBuffer({
    resolveQuerySet: () => {
      resolveQuerySetCallCount++;
    },
    copyBufferToBuffer: () => {
      copyBufferToBufferCallCount++;
    }
  });

  t.notOk(encoded, 'webgpu skips inline resolve while a readback is already in flight');
  t.equal(
    resolveQuerySetCallCount,
    0,
    'webgpu does not encode resolveQuerySet while readback is active'
  );
  t.equal(
    copyBufferToBufferCallCount,
    0,
    'webgpu does not encode copyBufferToBuffer while readback is active'
  );
  t.ok(querySet._resultsPendingResolution, 'webgpu keeps results pending for fallback resolution');

  querySet._readResultsPromise = null;
  querySet.destroy();
  t.end();
});

test('WebGL QuerySet timestamp pair validation', async t => {
  const device = await getWebGLTestDevice();
  if (!device.features.has('timestamp-query')) {
    t.comment('WebGL timestamp queries are not supported');
    t.end();
    return;
  }

  const querySet = device.createQuerySet({type: 'timestamp', count: 2});
  t.throws(
    () => device.commandEncoder.writeTimestamp(querySet, 1),
    /started/,
    'ending before starting throws'
  );

  device.commandEncoder.writeTimestamp(querySet, 0);
  t.throws(
    () => device.commandEncoder.writeTimestamp(querySet, 0),
    /active/,
    'starting the same timestamp pair twice throws'
  );
  device.commandEncoder.writeTimestamp(querySet, 1);
  device.submit();

  const duration = await querySet.readTimestampDuration(0, 1);
  t.ok(duration >= 0, 'completed WebGL timestamp pair is readable');

  querySet.destroy();
  t.end();
});

/*
test('Query construct/delete', (t) => {
  const ext = gl.getExtension('EXT_disjoint_timer_query');
  t.comment(`EXT_disjoint_timer_query is ${Boolean(ext)} ${ext}`, ext);
  // util.inspect(ext, {showHidden: true});

  const supported = Query.isSupported(gl);
  if (supported) {
    t.comment('Query is supported, testing functionality');
  } else {
    t.comment('Query is not supported, testing graceful fallback');
  }


  const timerQuery = new Query(gl);
  t.ok(timerQuery, 'Query construction successful');

  timerQuery.destroy();
  t.ok(timerQuery instanceof Query, 'Query delete successful');

  timerQuery.destroy();
  t.ok(timerQuery instanceof Query, 'Query repeated delete successful');

  t.end();
}

function testQueryCompleteFail(gl, t) {
}

test('Query completed/failed queries', (t) => {
  if (!Query.isSupported(gl, ['timers'])) {
    t.comment('Query Timer API not supported, skipping tests');
    return null;
  }
  // Completed query
  const timerQuery = new Query(gl);

  timerQuery.beginTimeElapsedQuery().end();

  return pollQuery(timerQuery, t);
  t.end();
});

test('TimeElapsedQuery', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const opts = ['timers'];
  if (!Query.isSupported(gl, opts)) {
    t.comment('Query API not supported, skipping tests');
    return null;
  }
  const query = new Query(gl);
  query.begin(target).end();

  return pollQuery(query, t);
  t.end();
});

test('OcclusionQuery', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const opts = ['queries'];
  testQuery(gl2, opts, GL.ANY_SAMPLES_PASSED_CONSERVATIVE, t);
  t.end();
});

test('WebGL#TransformFeedbackQuery', (t) => {
  const {gl} = fixture;
  const opts = ['queries'];
  testQuery(gl, opts, GL.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, t);
  t.end();
});

test('TransformFeedbackQuery', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const opts = ['queries'];
  testQuery(gl2, opts, GL.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, t);
  t.end();
});

function pollQuery(query, t) {
  return query
    .createPoll(10)
    .then((result) => t.pass(`Timer query: ${result}ms`))
    .catch((error) => t.fail(`Timer query: ${error}`));
}
*/
