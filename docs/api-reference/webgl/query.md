# Query

A `Query` object provides single unified API for using WebGL asynchronus queries, which include query objects ('Occlusion' and 'Transform Feedback') and timer queries. `Query` objects expose a `promise` member that tracks the state of the query and `poll` is used to update queries.

See also:

* WebGL1 timer extension: [`EXT_disjoint_timer_query`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query/)
* WebGL2 timer extension: [`EXT_disjoint_timer_query_webgl2`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query_webgl2/)


## Usage

Use a query to time GPU calls
```js
import {pollContext, Query, GL} from 'luma.gl';
...
const timerQuery = new Query({
  onComplete: timestamp => console.log(timestamp)
  onError: error => console.warn(error)
});

// Option #1
timerQuery.beginTimeElapsedQuery();
// Option #2
// timerQuery.begin(GL.TIME_ELAPSED_EXT)

// Issue GPU calls

timerQuery.end();

// Poll for resolved queries
requestAnimationFrame(() => pollContext(gl))
```


## Query Types

A query can be started by passing following query type to to `begin()` or by using corresponding begin* method.

| Query Type | begin method | Description |
| ------------------------------------------ | --------------------- | ------------ |
| `GL_TIME_ELAPSED_EXT`                      | `beginTimeElapsedQuery()` | Time taken by GPU to fully complete a set of GL commands |
| `GL.ANY_SAMPLES_PASSED`                    | `beginOcclusionQuery({conservative: false})` | Occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
| `GL.ANY_SAMPLES_PASSED_CONSERVATIVE`                    | `beginOcclusionQuery({conservative: true})` | Same as above above, but less accurate and faster version.
| `GL.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN`  | `beginTransformFeedbackQuery()` | Number of primitives that are written to transform feedback buffers.

In addition to above queries, Query object also provides `getTimeStamp` which returns GPU time stamp at the time this query is executed by GPU. Two sets of these methods can be used to calculate time taken by GPU for a set of GL commands.

## Methods

### static Query.isSupported(gl, opts)

Returns true if Query is supported by the WebGL implementation
(depends on the EXT_disjoint_timer_query extension)/
Can also check whether timestamp queries are available.

* gl {WebGLRenderingContext} - gl context
* opts= {Object}  - options
* opts.queries=false {Object}  - If true, checks if Query objects (occlusion/transform feedback) are supported
* opts.timers=false {Object}  - If true, checks if 'TIME_ELAPSED_EXT' queries are supported
* opts.timestamps=false {Object}  - If true, checks if 'TIMESTAMP_EXT' queries are supported
* return {Boolean} - Query API is supported with specified configuration

Options
* queries = false,
* timers = false,
* timestamps = false


### constructor

`new Query(gl, opts)`

* gl {WebGLRenderingContext | WebGL2RenderingContext} - gl context
* opts {Object} opts - options
* opts.onComplete {Function}  - called with a timestamp. Specifying this parameter causes a timestamp query to be initiated
* opts.onError {Function} opts.onComplete - called with a timestamp. Specifying this parameter causes a timestamp query to be initiated


### delete

Destroys the WebGL object. Rejects any pending query.
* return {Query} - returns itself, to enable chaining of calls.


### beginTimeElapsedQuery

Shortcut for timer query (dependent on extension in both WebGL1 and 2)


### Query.beginOcclusionQuery({conservative = false})

Shortcut for occlusion query (dependent on WebGL2)


### beginTransformFeedbackQuery

Shortcut for transform feedback query (dependent on WebGL2)


### Query.begin(target)

Measures GPU time delta between this call and a matching `end` call in the GPU instruction stream.

Remarks:
* Due to OpenGL API limitations, after calling `begin()` on one Query
  instance, `end()` must be called on that same instance before
  calling `begin()` on another query. While there can be multiple
  outstanding queries representing disjoint `begin()`/`end()` intervals.
  It is not possible to interleave or overlap `begin` and `end` calls.
* Triggering a new query when a Query is already tracking an
  unresolved query causes that query to be cancelled.

* target {GLenum}  - target to query
* return {Query} - returns itself, to enable chaining of calls.


### end

Inserts a query end marker into the GPU instruction stream.
Note: Can be called multiple times.

return {Query} - returns itself, to enable chaining of calls.


### getTimestamp

Generates a GPU time stamp when the GPU instruction stream reaches this instruction.
To measure time deltas, two timestamp queries are needed.

return {Query} - returns itself, to enable chaining of calls.

Remarks:
* timestamp() queries may not be available even when the timer query
  extension is. See Query.isSupported() flags.
* Triggering a new query when a Query is already tracking an
  unresolved query causes that query to be cancelled.


### cancel

Cancels a pending query
Note - Cancel's the promise and calls end on the current query if needed.

return {Query} - returns itself, to enable chaining of calls.


### isResultAvailable

return {Boolean} - true if query result is available


### getResult

Returns the query result, converted to milliseconds to match JavaScript conventions.

return {Number} - measured time or timestamp, in milliseconds


## Remarks

* On Chrome, go to chrome:flags and enable "WebGL Draft Extensions"
* For full functionality, Query depends on a `pollContext()` function being called regularly. When this is done, completed queries will be automatically detected and any callbacks are called.
* Query instance creation will always succeed, even when the required extension is not supported. Instead any issued queries will fail immediately. This allows applications to unconditionally use TimerQueries without adding logic to check whether they are supported; the difference being that the `onComplete` callback never gets called,
  (the `onError` callback, if supplied, will be called instead).
* Even when supported, timer queries can fail whenever a change in the GPU occurs that will make the values returned by this extension unusable for performance metrics. Power conservation might cause the GPU to go to sleep at the lower levers. Query will detect this condition and fail any outstanding queries (which calls the `onError` function, if supplied).
* Note that from a JavaScript perspective, where callback driven APIs are the norm, the functionality of the WebGL `Query` class seems limited. Many operations that require expensive roundtrips to the GPU (such as `readPixels`) that would obviously benefit from asynchronous queries, are not covered by the `Query` class.
