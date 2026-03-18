# Profiling

GPU programming is all about performance, so having tools to systematically
measure the performance impact of code changes is critical. luma.gl offers
several built-in facilities.

## probe.gl Stats

`probe.gl` is a companion framework focused on instrumentation and logging of
JavaScript applications. It provides a `Stats` class which can be thought of
as a "bag" of different stats (or performance measurements), and luma.gl itself
automatically populates `Stats` objects that can be inspected by the application.

```typescript
import {luma} from '@luma.gl/core';

console.log(luma.stats.getTable());
```

Resource allocation and timing stats are collected in these buckets:

```typescript
import {luma} from '@luma.gl/core';

const gpuTimeAndMemoryStats = luma.stats.get('GPU Time and Memory');
const resourceStats = luma.stats.get('GPU Resource Counts');

console.log('Frame rate', gpuTimeAndMemoryStats.get('Frame Rate').getSampleHz());
console.log('CPU time', gpuTimeAndMemoryStats.get('CPU Time').getSampleAverageTime());
console.log('GPU time', gpuTimeAndMemoryStats.get('GPU Time').getSampleAverageTime());
console.log('Total GPU memory', gpuTimeAndMemoryStats.get('GPU Memory').count);
console.log('Buffer memory', gpuTimeAndMemoryStats.get('Buffer Memory').count);
console.log('Texture memory', gpuTimeAndMemoryStats.get('Texture Memory').count);
console.log('Total resources created', resourceStats.get('Resources Created').count);
console.log('Total resources active', resourceStats.get('Resources Active').count);
console.log('Buffers active', resourceStats.get('Buffers Active').count);
console.log('Textures active', resourceStats.get('Textures Active').count);
```

Notes:
- `GPU Time and Memory` includes timing and memory counters and is the preferred bucket for most runtime telemetry.
- `GPU Resource Counts` includes only resource life-cycle and type counts.
- `Resource Counts` is kept as an alias for backward compatibility.

The `GPU Resource Counts` bag includes:

- `Resources Created`: total number of luma.gl resources ever created.
- `Resources Active`: total number of luma.gl resources currently alive.
- `<ResourceType>s Created` and `<ResourceType>s Active`: lifetime and live counters for each resource class, for example `Buffers Created`, `Buffers Active`, `Textures Created`, and `Textures Active`.

The `GPU Time and Memory` bag includes:

- `Frame Rate`: frame rate sample from the active animation loop.
- `CPU Time`: CPU time sample for frame rendering.
- `GPU Time`: GPU time sample for frame rendering.
- `GPU Memory`: total tracked GPU memory across luma.gl resources.
- `<ResourceType> Memory`: tracked GPU memory for a specific resource type, including `Buffer Memory` and `Texture Memory`.

Animation loop stats are mirrored into `luma.stats` under `Animation Loop`, exposing the latest updated loop's `Frame Rate`, `CPU Time`, and `GPU Time` values through the shared stats manager.

## Memory Profiling

luma.gl automatically tracks GPU memory usage.

Note that JavaScript is a garbage collected language and while memory allocations can
always be tracked, it is only possible for luma.gl to track GPU memory deallocations if
they are performed through the luma.gl API (by calling the `.destroy()` methods on `Buffer` and `Texture` objects).

Apart from GPU memory tracking for luma.gl also maintain counts of the various
other luma.gl API objects. Such object generally do not consume a lot of memory,
however tracking allocations can help spot resource leaks or unnecessary work being done.

## Performance Profiling

[QuerySet](/docs/api-reference/core/resources/query-set) can be used to capture GPU-side profiling data.

- Occlusion queries are available through `device.createQuerySet({type: 'occlusion', ...})`.
- Timestamp queries require `device.features.has('timestamp-query')`.

### Profiling With QuerySet

Create a timestamp query set with enough slots for all the passes you want to profile:

```typescript
const querySet = device.createQuerySet({type: 'timestamp', count: 256});
```

Record timestamps through the command encoder:

```typescript
device.commandEncoder.writeTimestamp(querySet, 0);
// encode GPU work here
device.commandEncoder.writeTimestamp(querySet, 1);
device.submit();
```

Most engines can also use automatic per-pass profiling by constructing a command encoder with
the profiling query set:

```typescript
const commandEncoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
const pass = commandEncoder.beginRenderPass({});
// no need to manually write begin/end timestamps
pass.end();
device.submit();
```

Read the duration asynchronously:

```typescript
try {
  const gpuMilliseconds = await querySet.readTimestampDuration(0, 1);
  console.log(`GPU work took ${gpuMilliseconds.toFixed(3)}ms`);
} catch (error) {
  console.warn('GPU timing was invalid', error);
}
```

Notes:

- Query results are asynchronous. They are usually not available in the same frame they are recorded.
- `querySet.isResultAvailable()` can be used as a non-blocking poll before starting a read.
- On WebGL, timestamp queries are backed by `EXT_disjoint_timer_query_webgl2`. Reads may be rejected when the GPU enters a disjoint state, for example after throttling or a reset.
- `QuerySet` can also be supplied to render and compute passes through `timestampQuerySet`, `beginTimestampIndex`, and `endTimestampIndex`.
