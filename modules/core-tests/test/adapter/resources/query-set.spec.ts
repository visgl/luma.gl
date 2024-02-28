// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getTestDevices} from '@luma.gl/test-utils';
import {QuerySet} from '@luma.gl/core';


test('QuerySet construct/delete', async (t) => {
  for (const device of await getTestDevices()) {
    const querySet = device.createQuerySet({type: 'occlusion', count: 1});
    t.ok(querySet instanceof QuerySet, 'QuerySet construction successful');
    querySet.destroy();
    t.pass('QuerySet delete successful');
  }
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
