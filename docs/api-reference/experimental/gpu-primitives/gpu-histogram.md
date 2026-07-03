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
  input: GraphDataView<T> | GraphVectorView<T>;
  output: GraphDataView<'uint32'>;
  domain: readonly [number, number] | GraphDataView<T> | 'auto';
};
```

For a `GraphVectorView`, the histogram preserves the ordered input topology: it does not pack,
concatenate, or rewrite chunks. The output is cleared once, then each non-empty `GraphDataView`
chunk accumulates into the same bins in source order. Empty chunks add no accumulation pass.

`'auto'` inserts one multi-chunk `GPUReduction` extent, so its domain covers every non-empty chunk.
Values outside the domain and non-finite floats are ignored. An exact maximum enters the final bin.
For a degenerate domain, matching values enter bin zero. Counts wrap as `uint32`.

Every encoding clears the output before accumulation, so a compiled graph is safely reusable.
Up to 256 bins use workgroup-local atomics; larger histograms use direct global atomics.
