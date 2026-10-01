# GPUFFT2D

[Sort](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-sort.md)[Segmented Sort](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-sort.md)[Transpose](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-transpose.md)[FFT 1D](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-fft1d.md)[FFT 2D](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-fft2d.md)[Convolution](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-convolution.md)

## Overview[​](#overview "Direct link to Overview")

`GPUFFT2D` adds an out-of-place two-dimensional complex fast Fourier transform to a `GPUCommandGraph`. It accepts borrowed `GraphDataView<'float32x2'>` or `GraphVectorView<'float32x2'>` operands and declares graph-owned scratch. The compiled graph owns kernels and immutable pass parameters. Encoding never submits work or reads values back.

Contiguous batches use the existing 8-by-8 kernel with one transform per dispatch-depth slice. Independently chunked operands use two reusable, single-transform scratch fields. Only active spans are copied into algorithm scratch; source chunks keep their storage, offsets and ownership.

The live ocean below makes the transform's value tangible: GPU spectral coefficients evolve over time, inverse FFT passes reconstruct spatial displacement fields, and the renderer turns those fields into waves, normals, and whitecaps without reading intermediate results back to the CPU.

### Tempest Ocean: Spectral Stormfront

GPUFFT2D displacement · HDR whitecaps

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/tempest-ocean)Info

InfoSource

Mobile quality

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Compute a bounded out-of-place two-dimensional complex transform.                                             |
| **Reads / writes**       | Reads row-major complex values; writes the destination through graph-owned ping-pong scratch.                 |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | Exact complex transform for the configured power-of-two extent.                                               |
| **Expected work**        | Bit reversal plus radix-2 butterfly passes across both dimensions.                                            |
| **Chunks**               | Independent packed float32x2 chunks; bounded single-transform scratch preserves caller storage.               |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | complex field → GPUFFT2D → spectral filter, simulation step, or inverse transform.                            |

**Cost**O(width × height × (log width + log height)) passes and bandwidth.

**Common mistake**Do not omit normalization or complex layout conventions when composing forward and inverse transforms.

## Concepts[​](#concepts "Direct link to Concepts")

### Frequency-domain structure becomes spatial detail[​](#frequency-domain-structure-becomes-spatial-detail "Direct link to Frequency-domain structure becomes spatial detail")

A two-dimensional FFT changes how a complex field is represented without changing its logical grid resolution. Frequency-space coefficients describe how much each wavelength and direction contributes; the inverse transform reconstructs the corresponding spatial values. This makes spectral water, image filtering, convolution, diffraction, and other field simulations practical when a physical model is simpler to evolve in frequency space than at every spatial sample.

`GPUFFT2D` performs that representation change only. Applications still define coefficient generation, physical units, normalization expectations, boundary policy, and how reconstructed fields are consumed by later compute or rendering passes.

### FFT in a complete system[​](#fft-in-a-complete-system "Direct link to FFT in a complete system")

[`SpectralOceanSimulation`](https://luma.gl/docs/api-reference/experimental/spectral-ocean-simulation.md) is the concrete composition example. It evolves a Phillips wave spectrum, records three inverse `GPUFFT2D` transforms in one application- owned command encoder, and turns their spatial fields into displacement, normal, and foam buffers. The separation is intentional: the FFT owns transform mechanics, while the ocean owns spectrum, time evolution, physical interpretation, and render-ready assembly.

## Usage[​](#usage "Direct link to Usage")

Each complex value occupies two consecutive `float32` components: real followed by imaginary. Values are row-major, so the complete field contains `width * height * 2` floats.

```
import {GPUCommandGraph, GPUFFT2D} from '@luma.gl/gpgpu/gpu-core';



const graph = new GPUCommandGraph(device);

// These are GPUVector<'float32x2'> values; each can have independent chunk boundaries.

const input = graph.importGPUVector('input', spatialValues);

const frequency = graph.importGPUVector('frequency', frequencyValues);

const reconstructed = graph.importGPUVector('reconstructed', reconstructedValues);

graph.add([

  new GPUFFT2D({id: 'forward', input, output: frequency, width, height, batchCount}),

  new GPUFFT2D({

    id: 'inverse', input: frequency, output: reconstructed,

    width, height, batchCount, direction: 'inverse'

  })

]);

const compiled = graph.compile();

const encoder = device.createCommandEncoder();

compiled.encode(encoder, {parameters: undefined});

device.submit(encoder.finish());

// After the application finishes using the plan:

compiled.destroy();
```

Both transforms compose in one command buffer without intermediate submission or CPU synchronization. Use `graph.importBuffer()` and `graph.createDataView()` for individual buffers.

## Constructor[​](#constructor "Direct link to Constructor")

### `new GPUFFT2D(props)`[​](#new-gpufft2dprops "Direct link to new-gpufft2dprops")

```
type GPUFFT2DProps = {

  id?: string;

  input: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;

  output: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;

  width: number;

  height: number;

  batchCount?: number;

  direction?: 'forward' | 'inverse';

};
```

Each dimension must be a power of two from 2 through 2048. `batchCount` defaults to one. Each operand must hold at least `width * height * batchCount` complex values. Views must be packed and aligned to eight bytes; input and output must use separate buffers. Writable chunks must not overlap. Construction is CPU-only; adding the primitive declares resources and nodes, and graph compilation allocates GPU resources.

### `getCommandNodes(graph)`[​](#getcommandnodesgraph "Direct link to getcommandnodesgraph")

Returns the ordered bit-reversal and butterfly nodes. Normally use `graph.add(transform)` or `graph.add([transform, otherOperation])` so the graph expands the primitive.

The normalization convention is:

* `forward`: negative complex exponent and no normalization;
* `inverse`: positive complex exponent and division by `width * height` on the final pass.

The transform first evaluates rows, then columns. Chunked transforms borrow source and destination spans and reuse bounded scratch across the batch. No source vector is concatenated into an owned whole-vector allocation.

## Support query[​](#support-query "Direct link to Support query")

### `getGPUFFT2DSupport(device, props): GPUFFT2DSupport`[​](#getgpufft2dsupportdevice-props-gpufft2dsupport "Direct link to getgpufft2dsupportdevice-props-gpufft2dsupport")

The support query validates dimensions before allocation and reports WebGPU compute, workgroup, dispatch, storage-binding, and buffer-size limits. A valid plan is included in `stats` even when a device limit prevents execution. With `input` and `output` views supplied, support is checked for one bounded scratch field; without views it describes the contiguous batched fast path.

```
const support = getGPUFFT2DSupport(device, {width: 512, height: 256});

if (!support.supported) {

  console.warn(support.reason);

}
```

## Statistics[​](#statistics "Direct link to Statistics")

`transform.stats` is an immutable `GPUFFT2DStats` object:

| Field                                               | Meaning                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `width`, `height`, `elementCount`                   | Logical complex-field dimensions and value count.                             |
| `complexBufferByteLength`                           | Logical bytes across the batch (contiguous-plan scratch size).                |
| `horizontalStageCount`, `verticalStageCount`        | Radix-2 butterfly stages per axis.                                            |
| `passCount`, `dispatchCountPerEncode`               | Two bit-reversal passes plus all butterfly stages.                            |
| `workgroupSize`, `workgroupCount`                   | Fixed 8-by-8 invocation tile and dispatch grid.                               |
| `scratchBufferByteLength`                           | Contiguous-plan graph scratch; chunked plans use two single-transform fields. |
| `parameterBufferCount`, `parameterBufferByteLength` | One immutable 48-byte parameter block per pass in the chosen direction.       |

`makeGPUFFT2DStats(width, height)` computes the same plan without a device or GPU allocation.

## Ownership and lifecycle[​](#ownership-and-lifecycle "Direct link to Ownership and lifecycle")

The primitive owns no GPU resources and has no `encode()` or `destroy()` method. Destroy the compiled graph to release scratch, kernels and immutable parameters. Imported buffers remain caller-owned. The compiled graph supports ordered reuse and normal external buffer rebinding; replacement buffers must satisfy the original graph descriptors.

## Current limits[​](#current-limits "Direct link to Current limits")

* WebGPU only; no WebGL fallback.
* Power-of-two dimensions from 2 through 2048.
* Packed row-major complex `float32` fields only.
* Out-of-place input and output only.
* One complete transform must fit the device storage-binding and buffer-size limits.
* Scratch is reused across ordered encodings of the compiled graph.
* No hidden padding, real-to-complex packing, texture conversion, submission, or readback.

These constraints keep the primitive small and predictable while allowing higher-level systems to define spectrum generation, texture outputs, cascade policy, and scheduling separately.
