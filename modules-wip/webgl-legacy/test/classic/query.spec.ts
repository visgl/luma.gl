/* eslint-disable max-len, max-statements */
import test from 'tape-promise/tape';
import {Query} from '@luma.gl/webgl-legacy';
// import util from 'util';
import GL from '@luma.gl/constants';
import {fixture} from 'test/setup';

function pollQuery(query, t) {
  return query
    .createPoll(10)
    .then((result) => t.pass(`Timer query: ${result}ms`))
    .catch((error) => t.fail(`Timer query: ${error}`));
}

function testQueryConstructDelete(gl, t) {
  const ext = gl.getExtension('EXT_disjoint_timer_query');
  t.comment(`EXT_disjoint_timer_query is ${Boolean(ext)} ${ext}`, ext);
  // util.inspect(ext, {showHidden: true});

  const supported = Query.isSupported(gl);
  if (supported) {
    t.comment('Query is supported, testing functionality');
  } else {
    t.comment('Query is not supported, testing graceful fallback');
  }

  // @ts-expect-error
  t.throws(() => new Query(), /.*WebGLRenderingContext.*/, 'Query throws on missing gl context');

  const timerQuery = new Query(gl);
  t.ok(timerQuery, 'Query construction successful');

  timerQuery.destroy();
  t.ok(timerQuery instanceof Query, 'Query delete successful');

  timerQuery.destroy();
  t.ok(timerQuery instanceof Query, 'Query repeated delete successful');

  t.end();
}

test('WebGL#Query construct/delete', (t) => {
  const {gl} = fixture;

  testQueryConstructDelete(gl, t);
});

test('WebGL2#Query construct/delete', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  testQueryConstructDelete(gl2, t);
});

function testQueryCompleteFail(gl, t) {
  if (!Query.isSupported(gl, ['timers'])) {
    t.comment('Query Timer API not supported, skipping tests');
    return null;
  }
  // Completed query
  const timerQuery = new Query(gl);

  timerQuery.beginTimeElapsedQuery().end();

  return pollQuery(timerQuery, t);
}

test('WebGL#Query completed/failed queries', (t) => {
  const {gl} = fixture;
  testQueryCompleteFail(gl, t);
  t.end();
});

test('WebGL2#Query completed/failed queries', (t) => {
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
  const query = new Query(gl);
  query.begin(target).end();

  return pollQuery(query, t);
}

test('WebGL#TimeElapsedQuery', (t) => {
  const {gl} = fixture;
  const opts = ['timers'];
  testQuery(gl, opts, GL.TIME_ELAPSED_EXT, t);
  t.end();
});

test('WebGL2#TimeElapsedQuery', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const opts = ['timers'];
  testQuery(gl2, opts, GL.TIME_ELAPSED_EXT, t);
  t.end();
});

test('WebGL#OcclusionQuery', (t) => {
  const {gl} = fixture;
  const opts = ['queries'];
  testQuery(gl, opts, GL.ANY_SAMPLES_PASSED_CONSERVATIVE, t);
  t.end();
});

test('WebGL2#OcclusionQuery', (t) => {
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

test('WebGL2#TransformFeedbackQuery', (t) => {
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
