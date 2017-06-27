/* eslint-disable max-len, max-statements */
/* global setInterval, clearInterval */
import test from 'tape-catch';
import {pollContext, Query} from 'luma.gl';
import util from 'util';
import {fixture} from '../setup';
import GL from '../../src/webgl-utils/constants';

function testQueryConstructDelete(gl, t) {
  const ext = gl.getExtension('EXT_disjoint_timer_query');
  t.comment(`EXT_disjoint_timer_query is ${Boolean(ext)} ${ext}`, ext);
  util.inspect(ext, {showHidden: true});

  const supported = Query.isSupported(gl);
  if (supported) {
    t.comment('Query is supported, testing functionality');
  } else {
    t.comment('Query is not supported, testing graceful fallback');
  }

  t.throws(
    () => new Query(),
    /.*WebGLRenderingContext.*/,
    'Query throws on missing gl context');

  let timerQuery;
  t.doesNotThrow(
    () => {
      timerQuery = new Query(gl);
    },
    'Query construction successful');

  timerQuery.delete();
  t.ok(timerQuery instanceof Query, 'Query delete successful');

  timerQuery.delete();
  t.ok(timerQuery instanceof Query, 'Query repeated delete successful');

  t.end();
}

test('WebGL#Query construct/delete', t => {
  const {gl} = fixture;

  testQueryConstructDelete(gl, t);
});

test('WebGL2#Query construct/delete', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  testQueryConstructDelete(gl2, t);
});

function testQueryBeginCancel(gl, t) {
  // Cancelled query

  const timerQuery = new Query(gl, {
    onComplete: result => t.fail(`Query 1: ${result}`),
    onError: error => t.pass(`Query 1: ${error}`)
  });

  timerQuery.cancel().cancel().cancel();
  t.ok(timerQuery instanceof Query, 'Query multiple cancel successful');

  timerQuery.beginTimeElapsedQuery();
  t.ok(timerQuery instanceof Query, 'Query begin successful');

  timerQuery.cancel().cancel().cancel();
  t.ok(timerQuery instanceof Query, 'Query multiple cancel successful');

  timerQuery.promise
  .then(_ => {
    t.end();
  })
  .catch(error => {
    t.pass(`Query promise reset by cancel or not implemented ${error}`);
    t.end();
  });
}

test('WebGL#Query begin/cancel', t => {
  const {gl} = fixture;
  testQueryBeginCancel(gl, t);
});

test('WebGL2#Query begin/cancel', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  testQueryBeginCancel(gl2, t);
});

function testQueryCompleteFail(gl, t) {
  // Completed query
  const timerQuery = Query.isSupported(gl) ?
    new Query(gl, {
      onComplete: result => t.pass(`Query 2: ${result}ms`),
      onError: error => t.fail(`Query 2: ${error}`)
    }) :
    new Query(gl);

  timerQuery.beginTimeElapsedQuery().end();
  t.ok(timerQuery.promise instanceof Promise, 'Query begin/end successful');

  const interval = setInterval(() => pollContext(gl), 20);

  function finalizer() {
    clearInterval(interval);
  }

  return timerQuery.promise.then(finalizer, finalizer);
}

test('WebGL#Query completed/failed queries', t => {
  const {gl} = fixture;
  testQueryCompleteFail(gl, t);
  t.end();
});

test('WebGL2#Query completed/failed queries', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  testQueryCompleteFail(gl2, t);
  t.end();
});

function testQuery(gl, opts, target, t) {
  if (!Query.isSupported(gl, opts)) {
    t.comment('Query API not supported, skipping tests');
    return null;
  }
  const query = new Query(gl, {
    onComplete: result => t.pass(`Timer query: ${result}ms`),
    onError: error => t.fail(`Timer query: ${error}`)
  });

  query.begin(target).end();
  t.ok(query.promise instanceof Promise, 'Query begin/end successful');

  const interval = setInterval(() => pollContext(gl), 20);
  function finalizer() {
    clearInterval(interval);
  }

  return query.promise.then(finalizer, finalizer);
}

test('WebGL#TimeElapsedQuery', t => {
  const {gl} = fixture;
  const opts = {timer: true};
  testQuery(gl, opts, GL.TIME_ELAPSED_EXT, t);
  t.end();
});

test('WebGL2#TimeElapsedQuery', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const opts = {timer: true};
  testQuery(gl2, opts, GL.TIME_ELAPSED_EXT, t);
  t.end();
});

test('WebGL#OcclusionQuery', t => {
  const {gl} = fixture;
  const opts = {queries: true};
  testQuery(gl, opts, GL.ANY_SAMPLES_PASSED_CONSERVATIVE, t);
  t.end();
});

test('WebGL2#OcclusionQuery', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const opts = {queries: true};
  testQuery(gl2, opts, GL.ANY_SAMPLES_PASSED_CONSERVATIVE, t);
  t.end();
});

test('WebGL#TransformFeedbackQuery', t => {
  const {gl} = fixture;
  const opts = {queries: true};
  testQuery(gl, opts, GL.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, t);
  t.end();
});

test('WebGL2#TransformFeedbackQuery', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const opts = {queries: true};
  testQuery(gl2, opts, GL.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, t);
  t.end();
});

function testGetTimestamp(gl, t) {
  if (!Query.isSupported(gl, {timestamps: true})) {
    t.comment('TIMESTAMP_EXT Query not supported, skipping tests');
    return null;
  }
  const query = new Query(gl, {
    onComplete: result => t.pass(`timestamp: ${result}`),
    onError: error => t.fail(`timestamp: ${error}`)
  });

  query.getTimestamp().end();
  t.ok(query.promise instanceof Promise, 'Query getTimestamp/end successful');

  const interval = setInterval(() => pollContext(gl), 20);
  function finalizer() {
    clearInterval(interval);
  }

  return query.promise.then(finalizer, finalizer);
}

test('WebGL#getTimestamp', t => {
  const {gl} = fixture;

  testGetTimestamp(gl, t);
  t.end();
});

test('WebGL2#getTimestamp', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  testGetTimestamp(gl2, t);
  t.end();
});
