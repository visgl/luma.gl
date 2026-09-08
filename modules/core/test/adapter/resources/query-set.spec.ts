// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getTestDevices, getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {QuerySet} from '@luma.gl/core';

it('QuerySet construct/delete', async () => {
  for (const device of await getTestDevices()) {
    const querySet = device.createQuerySet({type: 'occlusion', count: 1});
    expect(Boolean(querySet instanceof QuerySet), 'QuerySet construction successful').toBe(true);
    querySet.destroy();
    expect(Boolean('QuerySet delete successful'), '').toBe(true);
  }
  void 0;
});

it('QuerySet timestamp duration', async () => {
  for (const device of await getTestDevices()) {
    if (!device.features.has('timestamp-query')) {
      void 0;
    } else {
      const querySet = device.createQuerySet({type: 'timestamp', count: 2});
      expect(
        Boolean(querySet.isResultAvailable()),
        `${device.type} timestamp result unavailable before recording`
      ).toBe(false);

      device.commandEncoder.writeTimestamp(querySet, 0);
      device.commandEncoder.writeTimestamp(querySet, 1);
      device.submit();

      const duration = await querySet.readTimestampDuration(0, 1);
      expect(Boolean(duration >= 0), `${device.type} timestamp duration is non-negative`).toBe(
        true
      );

      querySet.destroy();
    }
  }
  void 0;
});

it('WebGPU QuerySet reads do not replace the active command encoder', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  if (!device.features.has('timestamp-query')) {
    void 0;
    void 0;
    return;
  }

  const querySet = device.createQuerySet({type: 'timestamp', count: 2});
  device.commandEncoder.writeTimestamp(querySet, 0);
  device.commandEncoder.writeTimestamp(querySet, 1);
  device.submit();

  const activeCommandEncoder = device.commandEncoder;
  const duration = await querySet.readTimestampDuration(0, 1);

  expect(Boolean(duration >= 0), 'WebGPU timestamp duration remains readable').toBe(true);
  expect(device.commandEncoder, 'WebGPU query reads keep the active command encoder intact').toBe(
    activeCommandEncoder
  );

  querySet.destroy();
  void 0;
});

it('WebGPU QuerySet defers inline resolve when a readback is already in flight', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  if (!device.features.has('timestamp-query')) {
    void 0;
    void 0;
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

  expect(
    Boolean(encoded),
    'webgpu skips inline resolve while a readback is already in flight'
  ).toBe(false);
  expect(
    resolveQuerySetCallCount,
    'webgpu does not encode resolveQuerySet while readback is active'
  ).toBe(0);
  expect(
    copyBufferToBufferCallCount,
    'webgpu does not encode copyBufferToBuffer while readback is active'
  ).toBe(0);
  expect(
    Boolean(querySet._resultsPendingResolution),
    'webgpu keeps results pending for fallback resolution'
  ).toBe(true);

  querySet._readResultsPromise = null;
  querySet.destroy();
  void 0;
});

it('WebGL QuerySet timestamp pair validation', async () => {
  const device = await getWebGLTestDevice();
  if (!device.features.has('timestamp-query')) {
    void 0;
    void 0;
    return;
  }

  const querySet = device.createQuerySet({type: 'timestamp', count: 2});
  expect(
    () => device.commandEncoder.writeTimestamp(querySet, 1),
    'ending before starting throws'
  ).toThrow(/started/);

  device.commandEncoder.writeTimestamp(querySet, 0);
  expect(
    () => device.commandEncoder.writeTimestamp(querySet, 0),
    'starting the same timestamp pair twice throws'
  ).toThrow(/active/);
  device.commandEncoder.writeTimestamp(querySet, 1);
  device.submit();

  const duration = await querySet.readTimestampDuration(0, 1);
  expect(Boolean(duration >= 0), 'completed WebGL timestamp pair is readable').toBe(true);

  querySet.destroy();
  void 0;
});

it('WebGL QuerySet destroy cancels pending RAF polling', async () => {
  const device = await getWebGLTestDevice();
  const querySet = device.createQuerySet({type: 'timestamp', count: 2}) as any;
  const queryHandle = device.gl.createQuery();

  expect(Boolean(queryHandle), 'created a WebGL query handle for the pending poll test').toBe(true);
  if (!queryHandle) {
    querySet.destroy();
    void 0;
    return;
  }

  const querySetPrototype = Object.getPrototypeOf(querySet);
  const originalRequestAnimationFrame = querySetPrototype._requestAnimationFrame;
  const originalCancelAnimationFrame = querySetPrototype._cancelAnimationFrame;
  const originalPollQueryAvailability = querySetPrototype._pollQueryAvailability;

  let scheduledCallback: FrameRequestCallback | null = null;
  let cancelAnimationFrameCallCount = 0;

  try {
    querySetPrototype._requestAnimationFrame = (callback: FrameRequestCallback): number => {
      scheduledCallback = callback;
      return 1;
    };

    querySetPrototype._cancelAnimationFrame = (requestId: number): void => {
      if (requestId === 1) {
        cancelAnimationFrameCallCount++;
        scheduledCallback = null;
      }
    };

    querySet._timestampPairs[0].completedQueries.push({
      handle: queryHandle,
      promise: null,
      result: null,
      disjoint: false,
      cancelled: false,
      pollRequestId: null,
      resolve: null,
      reject: null
    });
    querySetPrototype._pollQueryAvailability = () => false;

    const durationPromise = querySet.readTimestampDuration(0, 1);
    expect(
      Boolean(scheduledCallback),
      'readTimestampDuration schedules an RAF poll when results are unavailable'
    ).toBe(true);

    querySet.destroy();
    const duration = await Promise.race([
      durationPromise,
      new Promise<number>((_, reject) =>
        setTimeout(
          () => reject(new Error('Timed out waiting for pending query cancellation')),
          1000
        )
      )
    ]);

    expect(cancelAnimationFrameCallCount, 'destroy cancels the pending RAF poll').toBe(1);
    expect(duration, 'destroy resolves the pending timestamp read with a neutral duration').toBe(0);
  } finally {
    querySetPrototype._requestAnimationFrame = originalRequestAnimationFrame;
    querySetPrototype._cancelAnimationFrame = originalCancelAnimationFrame;
    querySetPrototype._pollQueryAvailability = originalPollQueryAvailability;
  }

  void 0;
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
