# Profiling

GPU programming is all about performance, so having tools to systematically
measure the performance impact of code changes are critical. luma.gl offers
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

## Memory Profiling

luma.gl automatically tracks GPU memory usage.

Note that JavaScript is a garbage collected language and while memory allocations can
always be tracked, it is only possible for luma.gl to track GPU memory deallocations if
they are performed through the luma.gl API (by calling the `.destroy()` methods on `Buffer` and `Texture` objects).

Apart from GPU memory tracking for luma.gl also maintain counts of the various
other luma.gl API objects. Such object generally do not consume a lot of memory,
however tracking allocations can help spot resource leaks or unnecessary work being done.

## Performance Profiling

Queries are supported if available.
