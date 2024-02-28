# QuerySet

:::caution
This page is incomplete.
:::

A `QuerySet` object provides an API for using asynchronous GPU queries of the following types
- timer queries.
- 'Occlusion' 
- 'Transform Feedback'

A `QuerySet` holds a number of 64 bit values. 

Timer queries are available if the `timestamp-query` extension is available. (On WebGL 2 this is equivalent to the 
[`EXT_disjoint_timer_query_webgl2`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query_webgl2/)
being supported on the current browser.

Note that even when supported, timer queries can fail whenever a change in the GPU occurs that will make the values returned by this extension unusable for performance metrics, for example if the GPU is throttled mid-frame. 

## Usage

Create a timestamp query set:

```typescript
import {QuerySet} from '@luma.gl/core';
...
const timestampQuery = device.createQuerySet({type: 'timestamp'}});
```

## Types

### `QueryProps`

- `type`: `occlusion` | `timestamp` - type of timer
- `count`: `number` - number of query results held by this `QuerySet`

| Query Type                               | Usage                                        | Description                                                                |
| ---------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `timestamp` (`RenderPass begin/end`)     | `beginRenderPass({timestampQuery: ...})`     | Time taken by GPU to execute RenderPass commands                           |
| `timestamp`  (`ComputePass begin/end`)   | `beginComputePass({timestampQuery: ...})`    | Time taken by GPU to execute ComputePass commands                          |
| `occlusion`                              | `beginOcclusionQuery({conservative: false})` | Occlusion query how many fragment samples pass tests (depth, stencil, ...) |
| `occlusion`                              | `beginOcclusionQuery({conservative: true})`  | Same as above above, but less accurate and faster                          | 
| `transform-feedback` (Not yet supported) | `beginTransformFeedbackQuery()`              | Number of primitives that are written to transform feedback buffers.       |

In addition to above queries, Query object also provides `getTimeStamp` which returns GPU time stamp at the time this query is executed by GPU. Two sets of these methods can be used to calculate time taken by GPU for a set of GL commands.

## DeviceFeatures

`timestamp-query`: Whether `QuerySet` can be created with type `timestamp`.

## Methods



### `constructor(device: Device, props: Object)`

`new Query(gl, {})`
- options.timers=false Object - If true, checks if 'TIME_ELAPSED_EXT' queries are supported

### `destroy()`

Destroys the WebGL object. Rejects any pending query.

- return Query - returns itself, to enable chaining of calls.


### beginTimeElapsedQuery()

Shortcut for timer query (dependent on extension in both WebGL 1 and 2)

## RenderPass


### `RenderPass.beginOcclusionQuery({conservative = false})`

Shortcut for occlusion query (dependent on WebGL 2)

### `RenderPass.beginTransformFeedbackQuery()`

WebGL 2 only. not yet implemented.

