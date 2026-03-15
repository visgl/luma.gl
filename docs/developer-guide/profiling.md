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

Resource allocation stats are collected in the `Resource Counts` stats bag:

```typescript
import {luma} from '@luma.gl/core';

const resourceStats = luma.stats.get('Resource Counts');

console.log('Total resources created', resourceStats.get('Resources Created').count);
console.log('Total resources active', resourceStats.get('Resources Active').count);
console.log('Total GPU memory', resourceStats.get('GPU Memory').count);
console.log('Buffers active', resourceStats.get('Buffers Active').count);
console.log('Buffer memory', resourceStats.get('Buffer Memory').count);
console.log('Textures active', resourceStats.get('Textures Active').count);
console.log('Texture memory', resourceStats.get('Texture Memory').count);
```

The `Resource Counts` bag includes:

- `Resources Created`: total number of luma.gl resources ever created.
- `Resources Active`: total number of luma.gl resources currently alive.
- `GPU Memory`: total tracked GPU memory across luma.gl resources.
- `<ResourceType>s Created` and `<ResourceType>s Active`: lifetime and live counters for each resource class, for example `Buffers Created`, `Buffers Active`, `Textures Created`, and `Textures Active`.
- `<ResourceType> Memory`: tracked GPU memory for a specific resource type, currently including `Buffer Memory` and `Texture Memory`.

## Memory Profiling

luma.gl automatically tracks GPU memory usage.

Note that JavaScript is a garbage collected language and while memory allocations can
always be tracked, it is only possible for luma.gl to track GPU memory deallocations if
they are performed through the luma.gl API (by calling the `.destroy()` methods on `Buffer` and `Texture` objects).

Apart from GPU memory tracking for luma.gl also maintain counts of the various
other luma.gl API objects. Such object generally do not consume a lot of memory,
however tracking allocations can help spot resource leaks or unnecessary work being done.

## Performance Profiling

`device.createQuerySet()` can be used to create GPU queries that 

- Occlusion Queries always supported.
- Timestamp Queries are supported if the `timestamp-query` feature is available, check with `device.features.has('timestamp-query')`.

`QuerySet` instances can be supplied when creating `RenderPass` and `ComputePass` instances.

Results are available through
`commandEncoder.resolveQuerySet()`
