# Query

A `Query` object provides single unified API for using WebGL asynchronus queries, which include query objects ('Occlusion' and 'Transform Feedback') and timer queries.

See also:

* WebGL1 timer extension: [`EXT_disjoint_timer_query`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query/)
* WebGL2 timer extension: [`EXT_disjoint_timer_query_webgl2`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query_webgl2/)


## Usage

Use a query to time GPU calls
```js
import {Query, GL} from '@luma.gl/core';
...
const timerQuery = new Query(gl);


// In animation loop
if (timerQuery.isResultAvailable() && !timerQuery.isTimerDisjoin()) {
  result = timerQuery.getResult();
}


// Option #1
timerQuery.beginTimeElapsedQuery();
// Option #2
// timerQuery.begin(GL.TIME_ELAPSED_EXT)

// Issue GPU calls

timerQuery.end();
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

### static Query.isSupported(gl : WebGLRenderingContext, options : Object)

Returns true if Query is supported by the WebGL implementation
(depends on the EXT_disjoint_timer_query extension)/
Can also check whether timestamp queries are available.

* options.queries=false {Object}  - If true, checks if Query objects (occlusion/transform feedback) are supported
* options.timers=false {Object}  - If true, checks if 'TIME_ELAPSED_EXT' queries are supported

Returns: {Boolean} - Query API is supported with specified configuration

Options
* queries = false,
* timers = false,


### constructor(gl : WebGLRenderingContext, props : Object)

`new Query(gl, {})`


### delete()

Destroys the WebGL object. Rejects any pending query.
* return {Query} - returns itself, to enable chaining of calls.


### beginTimeElapsedQuery()

Shortcut for timer query (dependent on extension in both WebGL1 and 2)


### Query.beginOcclusionQuery({conservative = false})

Shortcut for occlusion query (dependent on WebGL2)


### beginTransformFeedbackQuery()

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


### isResultAvailable

return {Boolean} - true if query result is available


### getResult

Returns the query result

return {Number} - query result. Semantics depend on query type


### getTimerMilliseconds

Shorthand for getting timer query results and converting to milliseconds to match JavaScript conventions.

return {Number} - measured time or timestamp, in milliseconds

### isTimerDisjoint

Returns `true` if the timer query was disjoint, indicating that timing results are invalid.
This is rare and might occur, for example, if the GPU was throttled while timing.

return {Boolean} - true if timer query was disjoint


### createPoll(limit = Number.POSITIVE_INFINITY)

Begins polling `Query` once per frame to check if results are available.

* limit {Number}  - Maximum number of frames to poll before rejecting the `Promise`.

return {Promise} - Resolves to the `Query` result if it becomes available before `limit`
frames have elapsed, and is rejected otherwise.


## Remarks

* Even when supported, timer queries can fail whenever a change in the GPU occurs that will make the values returned by this extension unusable for performance metrics, for example if the GPU is throttled mid-frame. This occurance is captured in `isTimerDisjoint` method.
* Note that from a JavaScript perspective, where callback driven APIs are the norm, the functionality of the WebGL `Query` class seems limited. Many operations that require expensive roundtrips to the GPU (such as `readPixels`) that would obviously benefit from asynchronous queries, are not covered by the `Query` class.
