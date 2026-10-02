import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUFiniteDifference2D and GPUFiniteDifference3D

## Overview

Graph-native second-order gradient, divergence, curl, and Laplacian operators on regularly sampled
fields. Rows form one global row-major domain: x varies fastest, followed by y, then z in 3D.
Chunk boundaries may split any row or plane and do not introduce physical boundaries.

<GPUOperationContract operation="gpu-finite-differences" />

```ts
graph.add(new GPUFiniteDifference2D({
  input: temperature,
  output: temperatureGradient,
  width,
  height,
  spacing: [0.25, 0.5],
  operator: 'gradient',
  boundary: 'periodic'
}));
```

## Operands and numerical policy

Both `input` and `output` accept atomic `GraphDataView` or independently partitioned
`GraphVectorView` values. All chunks must be packed. Each operand must cover the field; extra
output rows remain untouched. Dimensions must be at least four and the total row count must fit
in a uint32 index. Spacing must be finite and positive on every axis. The 3D API also takes
`depth` and a three-value `spacing` tuple.

| Operator | Input | 2D output | 3D output |
| --- | --- | --- | --- |
| `gradient` | `float32` | `float32x2` | `float32x4` (xyz, w = 0) |
| `divergence` | `float32x2` in 2D; `float32x4` in 3D | `float32` | `float32` |
| `curl` | `float32x2` in 2D; `float32x4` in 3D | `float32` | `float32x4` (xyz, w = 0) |
| `laplacian` | `float32` | `float32` | `float32` |

The default `one-sided` policy uses centered interior differences and second-order forward/backward
formulas at field edges. `periodic` wraps every axis. Boundaries are evaluated in global field
coordinates, regardless of chunking. Floating-point shader specialization may change rounding;
compare results with an appropriate numerical tolerance.

Outputs must use separate buffers from all inputs; output chunks must not overlap. Vector view
offsets must align to their WGSL array elements: 8 bytes for `float32x2` and 16 for `float32x4`.
Every encoding reads current inputs and overwrites the field output.

## Storage and support queries

One source chunk uses the direct kernel without scratch, even with multiple output chunks.
Multiple source chunks gather stencil samples into one reusable graph-owned buffer, sized for at
most 4096 output rows and reduced to fit device limits. This preserves the stencil expressions
without concatenating or repacking caller buffers. Gather work currently scales with source
chunk count times output blocks; optimizing neighbor routing is follow-up work.

`getGPUFiniteDifference2DSupport(device, props)` and `getGPUFiniteDifference3DSupport(device, props)`
check the numerical plan and device support. Pass `input` and `output` to check actual chunk binding
sizes; plan-only calls conservatively estimate one buffer per operand. A logical field may exceed
a single storage binding when its individual chunks fit. Lowering also checks graph ownership,
dispatch limits, and stencil scratch capacity before compilation.
