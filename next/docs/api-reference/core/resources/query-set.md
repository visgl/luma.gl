# QuerySet

A `QuerySet` stores asynchronous GPU query results.

For guidance on how this data is used for profiling in luma.gl, see [Performance Profiling](https://luma.gl/next/docs/developer-guide/profiling.md). For guidance on how queries fit into explicit command streams, see [GPU Commands](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md).

* Use `type: 'occlusion'` to count samples that pass depth/stencil tests.
* Use `type: 'timestamp'` to profile GPU work durations.

Timestamp queries are portable when `device.features.has('timestamp-query')` is `true`. On WebGL this is backed by [`EXT_disjoint_timer_query_webgl2`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query_webgl2/).

## Usage[​](#usage "Direct link to Usage")

Create a timestamp query set:

```
const querySet = device.createQuerySet({type: 'timestamp', count: 2});
```

Record timestamps through the command stream:

```
device.commandEncoder.writeTimestamp(querySet, 0);
// encode GPU work here
device.commandEncoder.writeTimestamp(querySet, 1);
device.submit();
```

`luma.gl` can also apply timestamps automatically on render/compute passes when a pass does not already specify `timestampQuerySet`, `beginTimestampIndex`, or `endTimestampIndex`:

```
const querySet = device.createQuerySet({type: 'timestamp', count: 256});
const commandEncoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
commandEncoder.beginRenderPass({});
// ... encode passes ...
device.submit();
```

Read the duration asynchronously:

```
const milliseconds = await querySet.readTimestampDuration(0, 1);
```

You can also read all timestamps in one call:

```
const timestamps = await querySet.readResults();
```

### Related API Surfaces[​](#related-api-surfaces "Direct link to Related API Surfaces")

* [RenderPass props](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md#renderpassprops): pass query sets through `timestampQuerySet`, `beginTimestampIndex`, `endTimestampIndex`, or `occlusionQuerySet`.
* [ComputePass props](https://luma.gl/next/docs/api-reference/core/resources/compute-pass.md#computepassprops): pass `timestampQuerySet`, `beginTimestampIndex`, and `endTimestampIndex`.
* [Command encoding](https://luma.gl/next/docs/api-reference/core/resources/command-encoder.md): use `CommandEncoder.writeTimestamp()` for manual timestamp capture.

## Types[​](#types "Direct link to Types")

### `QuerySetProps`[​](#querysetprops "Direct link to querysetprops")

* `type`: `'occlusion' | 'timestamp'`
* `count`: `number`

For timestamp duration profiling, use adjacent begin/end indices such as `(0, 1)` or `(2, 3)`.

## Methods[​](#methods "Direct link to Methods")

### `isResultAvailable(queryIndex?: number): boolean`[​](#isresultavailablequeryindex-number-boolean "Direct link to isresultavailablequeryindex-number-boolean")

Returns `true` when the requested result can be read without blocking. Backends may implement this conservatively.

### `readResults(options?: {firstQuery?: number; queryCount?: number}): Promise<bigint[]>`[​](#readresultsoptions-firstquery-number-querycount-number-promisebigint "Direct link to readresultsoptions-firstquery-number-querycount-number-promisebigint")

Reads 64-bit query values asynchronously.

### `readTimestampDuration(beginIndex: number, endIndex: number): Promise<number>`[​](#readtimestampdurationbeginindex-number-endindex-number-promisenumber "Direct link to readtimestampdurationbeginindex-number-endindex-number-promisenumber")

Reads a timestamp duration in milliseconds.

### `destroy()`[​](#destroy "Direct link to destroy")

Destroys the underlying query resources.

## Remarks[​](#remarks "Direct link to Remarks")

* `QuerySet` is a passive container. Record timestamps with `CommandEncoder.writeTimestamp()`, pass timestamp descriptors to render/compute passes, or let `AnimationLoop` inject pass-level profiling by constructing command encoders with `timeProfilingQuerySet`.
* Query results are asynchronous and are typically not available in the same frame they are recorded.
* On WebGL, timestamp results may be invalidated by disjoint timer events. Handle rejected reads when profiling long-running sessions.
