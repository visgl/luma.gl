/* eslint-disable max-len, max-statements */
/* global setInterval, clearInterval */
import test from 'tape-catch';
import {pollContext, Query} from 'luma.gl';
import util from 'util';
import {fixture} from '../setup';

test('WebGL#Query construct/delete', t => {
  const {gl} = fixture;

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
});

test('WebGL#Query begin/cancel', t => {
  const {gl} = fixture;

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
});

test('WebGL#Query completed/failed queries', t => {
  const {gl} = fixture;

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
    t.end();
  }

  return timerQuery.promise.then(finalizer, finalizer);
});
