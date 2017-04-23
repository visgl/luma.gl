# Query

A `Query` object

* Provides a way to measure the duration of a set of GL commands,
  without stalling the rendering pipeline.

Exposes a `promise` member that tracks the state of the query
when `poll` is used to update queries.

Example
```js
  const timerQuery = new Query({
    onComplete: timestamp => console.log(timestamp)
    onError: error => console.warn(error)
  });

  timerQuery.begin();

  // Issue GPU calls

  timerQuery.end();

  // Poll for resolved queries
  requestAnimationFrame(() => Query.poll(gl))
```

Remarks:
* On Chrome, go to chrome:flags and enable "WebGL Draft Extensions"
* For full functionality, Query depends on a `poll` function being
  called regularly. When this is done, completed queries will be
  automatically detected and any callbacks called.
* Query instance creation will always succeed, even when the required
  extension is not supported. Instead any issued queries will fail
  immediately. This allows applications to unconditionally use TimerQueries
  without adding logic to check whether they are supported; the
  difference being that the `onComplete` callback never gets called,
  (the `onError` callback, if supplied, will be called instead).
* Even when supported, timer queries can fail whenever a change in the
  GPU occurs that will make the values returned by this extension unusable
  for performance metrics. Power conservation might cause the GPU to go to
  sleep at the lower levers. Query will detect this condition and
  fail any outstanding queries (which calls the `onError` function,
  if supplied).
* Note that from a JavaScript perspective, where callback driven
  APIs are the norm, the functionality of the WebGL `Query` class
  seems limited. Many operations that require expensive rountrips to the GPU
  (such as `readPixels`) that would obviously benefit from asynchronous
  queries, are not covered by the `Query` class.

| ------------------------------------------ | ------------ |
| `GL.ANY_SAMPLES_PASSED`                    | Specifies an occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
| `GL.ANY_SAMPLES_PASSED_CONSERVATIVE`       | Same as above above, but less accurate and faster version.
| `GL.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN` | Number of primitives that are written to transform feedback buffers.


### static `Query.isSupported`(gl, opts)

Returns true if Query is supported by the WebGL implementation
(depends on the EXT_disjoint_timer_query extension)/
Can also check whether timestamp queries are available.

* gl {WebGLRenderingContext} - gl context
* opts= {Object}  - options
* opts.requireTimestamps=false {Object}  - If true, checks if timestamps are supported
return {Boolean} - TimerQueries are supported with specified configuration

Options
* queries = false,
* timers = false,
* timestamps = false


### `Query` constructor(gl, opts)

* gl {WebGLRenderingContext | WebGL2RenderingContext} - gl context
* opts {Object} opts - options
* opts.onComplete {Function}  - called with a timestamp.
   Specifying this parameter causes a timestamp query to be initiated
* opts.onError {Function} opts.onComplete - called with a timestamp.
   Specifying this parameter causes a timestamp query to be initiated


### `Query.delete()`

Destroys the WebGL object. Rejects any pending query.
return {Query} - returns itself, to enable chaining of calls.


### `Query.beginTimeElapsedQuery()`

Shortcut for timer query (dependent on extension in both WebGL1 and 2)


### `Query.beginOcclusionQuery(conservative = false)`

Shortcut for occlusion query (dependent on WebGL2)


### `Query.beginTransformFeedbackQuery()`

Shortcut for transform feedback query (dependent on WebGL2)


### `Query.begin(target)`

Measures GPU time delta between this call and a matching `end` call in the
GPU instruction stream.

Remarks:
* Due to OpenGL API limitations, after calling `begin()` on one Query
  instance, `end()` must be called on that same instance before
  calling `begin()` on another query. While there can be multiple
  outstanding queries representing disjoint `begin()`/`end()` intervals.
  It is not possible to interleave or overlap `begin` and `end` calls.
* Triggering a new query when a Query is already tracking an
  unresolved query causes that query to be cancelled.

* target {GLenum}  - target to query
return {Query} - returns itself, to enable chaining of calls.


### `Query.end()`

Inserts a query end marker into the GPU instruction stream.
Note: Can be called multiple times.

return {Query} - returns itself, to enable chaining of calls.


### `Query.getTimestamp()`

Generates a GPU time stamp when the GPU instruction stream reaches
this instruction.
To measure time deltas, two timestamp queries are needed.

return {Query} - returns itself, to enable chaining of calls.

Remarks:
* timestamp() queries may not be available even when the timer query
  extension is. See TimeQuery.isSupported() flags.
* Triggering a new query when a Query is already tracking an
  unresolved query causes that query to be cancelled.


### `Query.cancel()`

Cancels a pending query
Note - Cancel's the promise and calls end on the current query if needed.

return {Query} - returns itself, to enable chaining of calls.


### `Query.isResultAvailable`()

return {Boolean} - true if query result is available


### `Query.getResult`()

Returns the query result, converted to milliseconds to match
JavaScript conventions.

return {Number} - measured time or timestamp, in milliseconds

### static `Query.poll`(gl)

