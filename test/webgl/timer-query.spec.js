/* eslint-disable max-len, max-statements */
import test from 'tape-catch';
import {createGLContext, poll, TimerQuery} from '../../src/headless';

const fixture = {
  gl: createGLContext()
};

test('WebGL#TimerQuery construct/delete', t => {
  const {gl} = fixture;

  const supported = TimerQuery.isSupported(gl);
  if (supported) {
    t.comment('TimerQuery is supported, testing functionality');
  } else {
    t.comment('TimerQuery is not supported, testing graceful fallback');
  }

  t.throws(
    () => new TimerQuery(),
    /.*WebGLRenderingContext.*/,
    'TimerQuery throws on missing gl context');

  const timerQuery = new TimerQuery(gl);
  t.ok(timerQuery instanceof TimerQuery, 'TimerQuery construction successful');

  timerQuery.delete();
  t.ok(timerQuery instanceof TimerQuery, 'TimerQuery delete successful');

  timerQuery.delete();
  t.ok(timerQuery instanceof TimerQuery, 'TimerQuery repeated delete successful');

  t.end()
});

test('WebGL#TimerQuery begin/cancel', t => {
  const {gl} = fixture;

  // Cancelled query

  const timerQuery = new TimerQuery(gl, {
    onComplete: result => t.fail(`Query 1: ${result}`),
    onError: error => t.pass(`Query 1: ${error}`)
  });

  timerQuery.cancel().cancel().cancel();
  t.ok(timerQuery instanceof TimerQuery, 'TimerQuery multiple cancel successful');

  timerQuery.begin();
  t.ok(timerQuery instanceof TimerQuery, 'TimerQuery begin successful');

  timerQuery.cancel().cancel().cancel();
  t.ok(timerQuery instanceof TimerQuery, 'TimerQuery multiple cancel successful');

  timerQuery.promise.catch(error => {
    t.pass('TimerQuery promise reset by cancel or lack of implementation');
    t.end();
  });
});


test('WebGL#TimerQuery completed/failed queries', t => {
  const {gl} = fixture;

  // Completed query
  const timerQuery = TimerQuery.isSupported(gl) ?
    new TimerQuery(gl, {
      onComplete: result => t.pass(`Query 2: ${result}ms`),
      onError: error => t.fail(`Query 2: ${error}`)
    }) :
    new TimerQuery(gl);

  timerQuery.begin().end();
  t.ok(timerQuery.promise instanceof Promise, 'TimerQuery begin/end successful');

  const interval = setInterval(() => poll(gl), 20);

  function finalizer() {
    clearInterval(interval);
    t.end();
  }

  return timerQuery.promise.then(finalizer, finalizer);
});
