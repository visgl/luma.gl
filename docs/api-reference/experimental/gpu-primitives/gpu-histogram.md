import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUHistogram

<GPUPrimitivesDocsTabs active="histogram" />

`GPUHistogram` counts packed scalar values into a caller-owned `uint32` output view. The output
length defines the bin count.

```ts
new GPUHistogram({input: values, output: counts, domain: 'auto'}).addToGraph(graph);
```

## Constructor

```ts
type GPUHistogramProps<T extends 'uint32' | 'sint32' | 'float32'> = {
  id?: string;
  input: GraphBufferView<T>;
  output: GraphBufferView<'uint32'>;
  domain: readonly [number, number] | GraphBufferView<T> | 'auto';
};
```

`'auto'` inserts a `GPUReduction` extent. Values outside the domain and non-finite floats are
ignored. An exact maximum enters the final bin. For a degenerate domain, matching values enter bin
zero. Counts wrap as `uint32`.

Every encoding clears the output before accumulation, so a compiled graph is safely reusable.
Up to 256 bins use workgroup-local atomics; larger histograms use direct global atomics.
