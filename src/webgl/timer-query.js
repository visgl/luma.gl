// WebGL2 VertexArray Objects Helper
import {assertWebGLContext, glCheckError} from '../webgl/webgl-checks';
import queryManager from './helpers/query-manager';

/* eslint-disable no-multi-spaces */
const GL_QUERY_COUNTER_BITS_EXT      = 0x8864;
const GL_QUERY_RESULT_EXT            = 0x8866;
const GL_QUERY_RESULT_AVAILABLE_EXT  = 0x8867;
const GL_TIME_ELAPSED_EXT            = 0x88BF;
const GL_TIMESTAMP_EXT               = 0x8E28;
const GL_GPU_DISJOINT_EXT            = 0x8FBB;
/* eslint-enable no-multi-spaces */

const noop = x => x;

const ERR_GPU_DISJOINT =
  'Disjoint GPU operation invalidated timer queries';
const ERR_TIMER_QUERY_NOT_SUPPORTED =
  'Timer queries require "EXT_disjoint_timer_query" extension';

export default class TimerQuery {
  /**
   * Returns true if TimerQuery is supported by the WebGL implementation
   * (depends on the EXT_disjoint_timer_query extension)/
   * Can also check whether timestamp queries are available.
   *
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Object} opts= - options
   * @param {Object} opts.requireTimestamps=false -
   *   If true, checks if timestamps are supported
   * @return {Boolean} - TimerQueries are supported with specified configuration
   */
  static isSupported(gl, {requireTimestamps = false} = {}) {
    assertWebGLContext(gl);
    const ext = gl.getExtension('EXT_disjoint_timer_query');
    const queryCounterBits = ext ?
      ext.getQueryEXT(GL_TIMESTAMP_EXT, GL_QUERY_COUNTER_BITS_EXT) :
      0;
    const timestampsSupported = queryCounterBits > 0;
    return Boolean(ext) && (!requireTimestamps || timestampsSupported);
  }

  /**
   * @classdesc
   * Provides a way to measure the duration of a set of GL commands,
   * without stalling the rendering pipeline.
   *
   * Exposes a `promise` member that tracks the state of the query
   * when `poll` is used to update queries.
   *
   * @example
      const timerQuery = new TimerQuery({
        onComplete: timestamp => console.log(timestamp)
        onError: error => console.warn(error)
      });

      timerQuery.begin();

      // Issue GPU calls

      timerQuery.end();

      // Poll for resolved queries
      requestAnimationFrame(() => TimerQuery.poll(gl))
   *
   * Remarks:
   * - On Chrome, go to chrome:flags and enable "WebGL Draft Extensions"
   *
   * - For full functionality, TimerQuery depends on a `poll` function being
   *   called regularly. When this is done, completed queries will be
   *   automatically detected and any callbacks called.
   *
   * - TimerQuery instance creation will always succeed, even when the required
   *   extension is not supported. Instead any issued queries will fail
   *   immediately. This allows applications to unconditionally use TimerQueries
   *   without adding logic to check whether they are supported; the
   *   difference being that the `onComplete` callback never gets called,
   *   (the `onError` callback, if supplied, will be called instead).
   *
   * - Even when supported, timer queries can fail whenever a change in the
   *   GPU occurs that will make the values returned by this extension unusable
   *   for performance metrics. Power conservation might cause the GPU to go to
   *   sleep at the lower levers. TimerQuery will detect this condition and
   *   fail any outstanding queries (which calls the `onError` function,
   *   if supplied).
   *
   * @class
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Object} opts - options
   * @param {Function} opts.onComplete - called with a timestamp.
   *   Specifying this parameter causes a timestamp query to be initiated
   * @param {Function} opts.onComplete - called with a timestamp.
   *   Specifying this parameter causes a timestamp query to be initiated
   */
  constructor(gl, {
    onComplete = noop,
    onError = noop
  } = {}) {
    assertWebGLContext(gl);

    this.gl = gl;
    this.ext = this.gl.getExtension('EXT_disjoint_timer_query');
    this.handle = this.ext ? this.ext.createQueryEXT() : null;
    this.target = null;
    this.userData = {};

    this.onComplete = onComplete;
    this.onError = onError;

    // query manager needs a promise field
    this.promise = null;

    Object.seal(this);
  }

  /**
   * Destroys the WebGL object
   * Rejects any pending query
   *
   * @return {TimerQuery} - returns itself, to enable chaining of calls.
   */
  delete() {
    if (this.handle) {
      queryManager.deleteQuery(this);
      this.ext.deleteQueryEXT(this.handle);
      glCheckError(this.gl);
      this.handle = null;
    }
    return this;
  }

  /**
   * Measures GPU time delta between this call and a matching `end` call in the
   * GPU instruction stream.
   *
   * Remarks:
   * - Due to OpenGL API limitations, after calling `begin()` on one TimerQuery
   *   instance, `end()` must be called on that same instance before
   *   calling `begin()` on another query. While there can be multiple
   *   outstanding queries representing disjoint `begin()`/`end()` intervals.
   *   It is not possible to interleave or overlap `begin` and `end` calls.
   *
   * - Triggering a new query when a TimerQuery is already tracking an
   *   unresolved query causes that query to be cancelled.
   *
   * @return {TimerQuery} - returns itself, to enable chaining of calls.
   */
  begin() {
    queryManager.beginQuery(this, this.onComplete, this.onError);
    if (this.ext) {
      this.target = GL_TIME_ELAPSED_EXT;
      this.ext.beginQueryEXT(this.target, this.handle);
    } else {
      queryManager.rejectQuery(this, ERR_TIMER_QUERY_NOT_SUPPORTED);
    }
    return this;
  }

  /**
   * Inserts a query end marker into the GPU instruction stream.
   * Can be called multiple times.
   *
   * @return {TimerQuery} - returns itself, to enable chaining of calls.
   */
  end() {
    // Note: calling end does not affect the pending promise
    if (this.target) {
      this.ext.endQueryEXT(this.target);
      this.target = null;
    }
    return this;
  }

  /**
   * Generates a GPU time stamp when the GPU instruction stream reaches
   * this instruction.
   * To measure time deltas, two queries are needed.
   *
   * Remarks:
   * - timestamp() queries may not be available even when the timer query
   *   extension is. See TimeQuery.isSupported() flags.
   *
   * - Triggering a new query when a TimerQuery is already tracking an
   *   unresolved query causes that query to be cancelled.
   *
   * @return {TimerQuery} - returns itself, to enable chaining of calls.
   */
  timestamp() {
    queryManager.beginQuery(this, this.onComplete, this.onError);
    if (this.ext) {
      this.ext.queryCounterEXT(this.handle, GL_TIMESTAMP_EXT);
    } else {
      queryManager.rejectQuery(this, ERR_TIMER_QUERY_NOT_SUPPORTED);
    }
    return this;
  }

  /**
   * Cancels a pending query
   * Note - Cancel's the promise and calls end on the current query if needed.
   *
   * @return {TimerQuery} - returns itself, to enable chaining of calls.
   */
  cancel() {
    this.end();
    queryManager.cancelQuery(this);
    return this;
  }

  /**
   * @return {Boolean} - true if query result is available
   */
  isResultAvailable() {
    return this.ext &&
      this.ext.getQueryObjectEXT(this.handle, GL_QUERY_RESULT_AVAILABLE_EXT);
  }

  /**
   * Returns the query result, converted to milliseconds to match
   * JavaScript conventions.
   *
   * @return {Number} - measured time or timestamp, in milliseconds
   */
  getResult() {
    return this.ext ?
      this.ext.getQueryObjectEXT(this.handle, GL_QUERY_RESULT_EXT) / 1e6 : 0;
  }
}

// NOTE: This call lets the queryManager know how to detect disjoint GPU state
// It will check dsjoint state on polls and before adding a new query
// and reject any outstanding TimerQueries with our supplied error message.
queryManager.setInvalidator({
  queryType: TimerQuery,
  errorMessage: ERR_GPU_DISJOINT,
  // Note: Querying the disjoint state resets it
  checkInvalid: gl => gl.getParameter(GL_GPU_DISJOINT_EXT)
});
