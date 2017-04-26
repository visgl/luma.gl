// WebGL2 Query Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery
import GL from './api';
import {assertWebGLContext, isWebGL2Context} from './context';
import Resource from '../webgl/resource';
import queryManager from '../webgl/helpers/query-manager';

// WebGL2 VertexArray Objects Helper

const noop = x => x;

const ERR_GPU_DISJOINT = 'Disjoint GPU operation invalidated timer queries';
const ERR_TIMER_QUERY_NOT_SUPPORTED = 'Timer queries require "EXT_disjoint_timer_query" extension';

const EMPTY_EXTENSION = {
  createQueryEXT() {
    return null;
  },
  getQueryEXT() {
    return 0;
  }
};

function getTimerQueryExtension(gl) {
  assertWebGLContext(gl);
  let extension;
  if (isWebGL2Context(gl)) {
    extension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  } else {
    extension = gl.getExtension('EXT_disjoint_timer_query');
  }
  return extension || EMPTY_EXTENSION;
}

function deleteQuery(handle) {
  // if (this.handle) {
  //   if (this.webgl2) {
  //     this.gl.deleteQuery(this.handle);
  //   } else {
  //     this.ext.deleteQueryEXT(this.handle);
  //   }
  // }
  // this.handle = null;
  // return this;
}

/* eslint-disable max-len */
// gl.ANY_SAMPLES_PASSED // Specifies an occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
// gl.ANY_SAMPLES_PASSED_CONSERVATIVE // Same as above above, but less accurate and faster version.
// gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN // Number of primitives that are written to transform feedback buffers.

// gl.QUERY_RESULT: Returns a GLuint containing the query result.
// gl.QUERY_RESULT_AVAILABLE: Returns a GLboolean indicating whether or not a query result is available.

export default class Query extends Resource {
  /**
   * Returns true if Query is supported by the WebGL implementation
   * (depends on the EXT_disjoint_timer_query extension)/
   * Can also check whether timestamp queries are available.
   *
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Object} opts= - options
   * @param {Object} opts.requireTimestamps=false -
   *   If true, checks if timestamps are supported
   * @return {Boolean} - TimerQueries are supported with specified configuration
   */
  static isSupported(gl, {
    queries = false,
    timers = false,
    timestamps = false
  } = {}) {
    const ext = getTimerQueryExtension(gl);

    let supported = true;
    if (queries) {
      supported = supported && isWebGL2Context(gl);
    }

    if (timestamps) {
      const queryCounterBits =
        ext.getQueryEXT(GL.TIMESTAMP_EXT, GL.QUERY_COUNTER_BITS_EXT);
      supported = supported && (queryCounterBits > 0);
    }

    return supported;
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
      const timerQuery = new Query({
        onComplete: timestamp => console.log(timestamp)
        onError: error => console.warn(error)
      });

      timerQuery.begin();

      // Issue GPU calls

      timerQuery.end();

      // Poll for resolved queries
      requestAnimationFrame(() => Query.poll(gl))
   *
   * Remarks:
   * - On Chrome, go to chrome:flags and enable "WebGL Draft Extensions"
   *
   * - For full functionality, Query depends on a `poll` function being
   *   called regularly. When this is done, completed queries will be
   *   automatically detected and any callbacks called.
   *
   * - Query instance creation will always succeed, even when the required
   *   extension is not supported. Instead any issued queries will fail
   *   immediately. This allows applications to unconditionally use TimerQueries
   *   without adding logic to check whether they are supported; the
   *   difference being that the `onComplete` callback never gets called,
   *   (the `onError` callback, if supplied, will be called instead).
   *
   * - Even when supported, timer queries can fail whenever a change in the
   *   GPU occurs that will make the values returned by this extension unusable
   *   for performance metrics. Power conservation might cause the GPU to go to
   *   sleep at the lower levers. Query will detect this condition and
   *   fail any outstanding queries (which calls the `onError` function,
   *   if supplied).
   *
   * @class
   * @param {WebGLRenderingContext | WebGL2RenderingContext} gl - gl context
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
    super();

    if (isWebGL2Context(gl)) {
      this.ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
      this.webgl2 = true;
    } else {
      this.ext = this.gl.getExtension('EXT_disjoint_timer_query');
      this.handle = this.ext ? this.ext.createQueryEXT() : null;
      this.webgl2 = false;
    }

    this.target = null;
    this.onComplete = onComplete;
    this.onError = onError;

    // query manager needs a promise field
    this.promise = null;

    Object.seal(this);
  }

  _createHandle() {
    return this.gl.createQuery();
  }

  _deleteHandle() {
    queryManager.deleteQuery(this);
    deleteQuery(this.gl, this.handle);
  }

  // Shortcut for timer query (dependent on extension in both WebGL1 and 2)
  beginTimeElapsedQuery() {
    return this.begin(GL.TIME_ELAPSED_EXT);
  }

  // Shortcut for timer query (dependent on extension in both WebGL1 and 2)
  beginOcclusionQuery(conservative = false) {
    return this.begin(conservative ?
      this.gl.ANY_SAMPLES_PASSED_CONSERVATIVE :
      this.gl.ANY_SAMPLES_PASSED
    );
  }

  // Shortcut for timer query (dependent on extension in both WebGL1 and 2)
  beginTransformFeedbackQuery() {
    return this.begin(this.gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN);
  }

  /**
   * Measures GPU time delta between this call and a matching `end` call in the
   * GPU instruction stream.
   *
   * Remarks:
   * - Due to OpenGL API limitations, after calling `begin()` on one Query
   *   instance, `end()` must be called on that same instance before
   *   calling `begin()` on another query. While there can be multiple
   *   outstanding queries representing disjoint `begin()`/`end()` intervals.
   *   It is not possible to interleave or overlap `begin` and `end` calls.
   *
   * - Triggering a new query when a Query is already tracking an
   *   unresolved query causes that query to be cancelled.
   *
   * @param {GLenum} target - target to query
   * @return {Query} - returns itself, to enable chaining of calls.
   */
  begin(target) {
    queryManager.beginQuery(this, this.onComplete, this.onError);
    this.target = target;

    // WebGL2
    if (this.webgl2) {
      this.gl.beginQuery(target, this.handle);
      return this;
    }

    // WebGL1
    switch (target) {
    case GL.TIME_ELAPSED_EXT:
      if (this.ext) {
        this.ext.beginQueryEXT(this.target, this.handle);
      } else {
        queryManager.rejectQuery(this, ERR_TIMER_QUERY_NOT_SUPPORTED);
      }
      break;
    default:
      queryManager.rejectQuery(this, 'Query not supported');
      throw new Error('Query not supported');
    }

    return this;
  }

  /**
   * Inserts a query end marker into the GPU instruction stream.
   * Can be called multiple times.
   *
   * @return {Query} - returns itself, to enable chaining of calls.
   */
  end() {
    // Note: calling end does not affect the pending promise
    if (this.target) {
      if (this.webgl2) {
        this.gl.endQuery(this.target);
      } else if (this.ext) {
        this.ext.endQueryEXT(this.target);
      }
    }
    this.target = null;
    return this;
  }

  /**
   * Generates a GPU time stamp when the GPU instruction stream reaches
   * this instruction.
   * To measure time deltas, two timestamp queries are needed.
   *
   * Remarks:
   * - timestamp() queries may not be available even when the timer query
   *   extension is. See TimeQuery.isSupported() flags.
   *
   * - Triggering a new query when a Query is already tracking an
   *   unresolved query causes that query to be cancelled.
   *
   * @return {Query} - returns itself, to enable chaining of calls.
   */
  getTimestamp() {
    queryManager.beginQuery(this, this.onComplete, this.onError);
    if (this.ext) {
      // Note: Same function signature for both WebGL1 and WebGL2 extensions
      this.ext.queryCounterEXT(this.handle, GL.TIMESTAMP_EXT);
    } else {
      queryManager.rejectQuery(this, ERR_TIMER_QUERY_NOT_SUPPORTED);
    }
    return this;
  }

  /**
   * Cancels a pending query
   * Note - Cancel's the promise and calls end on the current query if needed.
   *
   * @return {Query} - returns itself, to enable chaining of calls.
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
    const {webgl2, gl, handle, ext} = this;
    return webgl2 ?
      gl.getQueryParameter(handle, GL.QUERY_RESULT_AVAILABLE_EXT) :
      ext && ext.getQueryObjectEXT(handle, GL.QUERY_RESULT_AVAILABLE_EXT);
  }

  /**
   * Returns the query result, converted to milliseconds to match
   * JavaScript conventions.
   *
   * @return {Number} - measured time or timestamp, in milliseconds
   */
  getResult() {
    const {webgl2, gl, handle, ext} = this;
    const result = webgl2 ?
      gl.getQueryParameter(handle, GL.QUERY_RESULT_EXT) :
      ext && ext.getQueryObjectEXT(handle, GL.QUERY_RESULT_EXT);
    return Number.isFinite(result) ? result / 1e6 : 0;
  }

  static poll(gl) {
    queryManager.poll(gl);
  }
}

// NOTE: This call lets the queryManager know how to detect disjoint GPU state
// It will check dsjoint state on polls and before adding a new query
// and reject any outstanding TimerQueries with our supplied error message.
queryManager.setInvalidator({
  queryType: Query,
  errorMessage: ERR_GPU_DISJOINT,
  // Note: Querying the disjoint state resets it
  checkInvalid: gl => gl.getParameter(GL.GPU_DISJOINT_EXT)
});

/* TODO - remove code below
/* eslint-disable max-len *
// gl.ANY_SAMPLES_PASSED // Specifies an occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
// gl.ANY_SAMPLES_PASSED_CONSERVATIVE // Same as above above, but less accurate and faster version.
// gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN // Number of primitives that are written to transform feedback buffers.

// gl.QUERY_RESULT: Returns a GLuint containing the query result.
// gl.QUERY_RESULT_AVAILABLE: Returns a GLboolean indicating whether or not a query result is available.

export default class Query {

  static isSupported(gl) {
    return isWebGL2Context(gl);
  }

  /**
   * @class
   * @param {WebGL2Context} gl
   *
  constructor(gl) {
    assertWebGL2Context(gl);
    const handle = gl.createQuery();
    glCheckError(gl);

    this.gl = gl;
    this.handle = handle;
    this.target = null;
    this.userData = {};

    // query manager needs a promise field
    this.promise = null;

    Object.seal(this);
  }

  /*
   * @return {Query} returns self to enable chaining
   *
  delete() {
    queryManager.deleteQuery(this);
    if (this.handle) {
      this.gl.deleteQuery(this.handle);
      this.handle = null;
      glCheckError(this.gl);
    }
    return this;
  }

  /*
   * @return {Query} returns self to enable chaining
   *
  begin(target) {
    queryManager.beginQuery(this);
    this.target = target;
    this.gl.beginQuery(target, this.handle);
    glCheckError(this.gl);
    return this;
  }

  /*
   * @return {Query} returns self to enable chaining
   *
  end() {
    if (this.target) {
      this.target = null;
      this.gl.endQuery(this.target);
      glCheckError(this.gl);
    }
    return this;
  }

  cancel() {
    this.end();
    queryManager.cancelQuery(this);
    return this;
  }

  isResultAvailable() {
    return this.gl.getQueryParameter(this.handle,
      this.gl.QUERY_RESULT_AVAILBLE);
  }

  getResult() {
    return this.gl.getQueryParameter(this.handle, this.gl.QUERY_RESULT);
  }

  static poll(gl) {
    queryManager.poll(gl);
  }
}
*/
