/* eslint-disable max-len, max-statements */
/* global setInterval, clearInterval */
import test from 'tape-catch';
import {createGLContext, poll, Query} from '../../src/headless';

const fixture = {
  gl: createGLContext()
};

test('WebGL#Query construct/delete', t => {
  const {gl} = fixture;

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

  const timerQuery = new Query(gl);
  t.ok(timerQuery instanceof Query, 'Query construction successful');

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

  timerQuery.begin();
  t.ok(timerQuery instanceof Query, 'Query begin successful');

  timerQuery.cancel().cancel().cancel();
  t.ok(timerQuery instanceof Query, 'Query multiple cancel successful');

  timerQuery.promise.catch(error => {
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

  timerQuery.begin().end();
  t.ok(timerQuery.promise instanceof Promise, 'Query begin/end successful');

  const interval = setInterval(() => poll(gl), 20);

  function finalizer() {
    clearInterval(interval);
    t.end();
  }

  return timerQuery.promise.then(finalizer, finalizer);
});
