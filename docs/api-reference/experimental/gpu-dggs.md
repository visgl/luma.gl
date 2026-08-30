import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {DGGSCellProjectionBenchmark} from '@site/src/components/docs/dggs-cell-projection-benchmark';

# GPU DGGS

<ExperimentalDocsTabs active="gpu-dggs" />

Discrete global grid indexes are compact, stable identifiers. Rendering and spatial analysis need
coordinates. The experimental `@luma.gl/gpgpu/gpu-dggs` module connects those two representations
without pulling a large cell column back to JavaScript.

| Input | Shared GPU primitive | Output |
| --- | --- | --- |
| Packed `uint32x2` cell IDs | validation → topology decode → spherical projection | `float32x2` longitude/latitude or `float32x3` unit vectors |

The same command-graph operation powers the family-specific [`gpu-h3`](./gpu-h3) and
[`gpu-a5`](./gpu-a5) modules. Use those typed adapters when the grid is known in advance. Use
`GPUDGGSCellProjection` when a planner or application selects the grid at runtime.

## Live benchmark

This benchmark runs locally on the reader's WebGPU adapter. It validates every result before and
after timing and reports portable completion-fence latency separately from compute-only timestamp
queries when the adapter exposes them.

<DGGSCellProjectionBenchmark />

Benchmark input is already resident when timing begins. Upload, shader compilation, and validation
readback are deliberately excluded. That makes the result representative of a projection pass
inside a larger GPU pipeline, not a claim about end-to-end file ingestion.

## One contract, three entry points

| Entry point | Primary class | Best fit |
| --- | --- | --- |
| `@luma.gl/gpgpu/gpu-dggs` | `GPUDGGSCellProjection` | Runtime-selected H3/A5 workflows and reusable planners |
| `@luma.gl/gpgpu/gpu-h3` | `GPUH3CellProjection` | H3-specific pipelines and the clearest static types |
| `@luma.gl/gpgpu/gpu-a5` | `GPUA5CellProjection` | A5-specific pipelines and the clearest static types |

All three classes implement `GPUCommandGraphContributor`. They add one bounded compute pass; they
do not submit commands, allocate hidden result buffers, or read output back.

```ts
import {GPUDGGSCellProjection} from '@luma.gl/gpgpu/gpu-dggs';

new GPUDGGSCellProjection({
  family: selectedGrid, // 'h3' | 'a5'
  cells,
  output: centers,
  validity,
  projection: 'unit-vector'
}).addToGraph(graph);
```

## GPU data contract

`cells` is a packed `GraphDataView<'uint32x2'>`. The default `wordOrder: 'little-endian'` expects
the low 32-bit word first and matches a native `BigUint64Array` on the browser platforms WebGPU
targets. Set `wordOrder: 'high-low'` for canonical high-word-first storage.

| Property | Format | Meaning |
| --- | --- | --- |
| `cells` | `uint32x2` | One split 64-bit cell index per row |
| `output`, `projection: 'lnglat'` | `float32x2` | Longitude then latitude, in degrees |
| `output`, `projection: 'unit-vector'` | `float32x3` | Normalized Earth-centered Cartesian vector |
| `validity` | optional `uint32` | `1` for a valid cell, `0` for an invalid index |

Invalid rows write zero coordinates. All views must have the same row count, belong to the target
graph, use packed layouts, and occupy separate buffers. Three-dimensional bounded dispatch removes
the device's one-dimensional workgroup-count limit for very large arrays.

:::tip
**Choose unit vectors for GPU-resident geometry.**

Unit vectors compose directly with globe rendering, dot-product distance filters, hemisphere
tests, and normal generation. They also avoid the inverse trigonometry required to materialize
longitude and latitude. Choose geographic output when downstream code genuinely needs degrees.
:::

## Reusable pipeline patterns

The primitive is source-aligned: output row `i` always describes cell row `i`. That makes it easy
to compose with existing graph operations.

| Goal | Suggested graph |
| --- | --- |
| Render cell centers | DGGS projection → model vertex input |
| Cull invalid data | projection with validity → `GPUCompaction` |
| Aggregate spatial metrics | unit vectors → expression/filter → reduction |
| Publish coordinates to the CPU | projection → explicit readback ring |
| Switch grids at runtime | planner chooses `family` → `GPUDGGSCellProjection` |

The fixed H3 icosahedron basis is currently a 960-byte module-scope WGSL constant. A storage-buffer
table would add a binding and upload without reducing the working set. The shared family-neutral
class deliberately leaves that implementation choice behind the API boundary, so a profiled
adapter-specific table path could be added later without changing application graphs.

## Scope

The current primitive decodes cell indexes to centers. It does not yet encode coordinates to cells,
generate polygon boundaries, or enumerate neighbors. Those operations have different output and
precision shapes:

- coordinate-to-cell encoding needs an exact-integer or hybrid verification strategy near cell
  boundaries;
- variable-length boundaries fit a count → prefix scan → write graph;
- neighborhood expansion needs explicit capacity and overflow semantics.

The shared split-64-bit representation, validity handling, bounded dispatch, and graph-contributor
contract are designed to be reused by those future operations.

## Benchmark API

The live page uses an isolated optional entry point, keeping measurement code out of application
bundles:

```ts
import {runGPUDGGSCellProjectionBenchmark} from '@luma.gl/gpgpu/gpu-dggs/benchmarks';

const report = await runGPUDGGSCellProjectionBenchmark(device, {
  family: 'h3',
  cells: packedCellWords,
  referenceValues: precomputedUnitVectorCenters,
  projection: 'unit-vector'
});
```

The runner accepts low-word/high-word `Uint32Array` input plus row-matched CPU or precomputed
reference centers. It rejects invalid cells, compares every output component with that oracle,
range-checks geographic centers, verifies vector normalization, and returns distributions rather
than a single best-case sample. Use `referenceTolerance` to override the default `0.03°` geographic
or `0.002` unit-vector component tolerance.
