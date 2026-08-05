import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';
import {TempestOceanExample} from '@site/src/examples';

# GPUFFT2D

<GPUPrimitivesDocsTabs active="fft2d" />

## Overview

`GPUFFT2D` records a bounded, out-of-place two-dimensional complex fast Fourier transform on
WebGPU. It accepts caller-owned row-major storage buffers, owns one equally sized scratch buffer,
and records every bit-reversal and radix-2 butterfly pass onto the application's
`CommandEncoder`. It never submits commands or reads values back to the CPU.

The initial implementation targets reusable simulation and signal-processing foundations such as
spectral oceans, frequency-domain filters, convolution, and procedural fields. It deliberately
does not own textures, convert real-valued inputs, select padding dimensions, or hide command
submission.

The live ocean below makes the transform's value tangible: GPU spectral coefficients evolve over
time, inverse FFT passes reconstruct spatial displacement fields, and the renderer turns those
fields into waves, normals, and whitecaps without reading intermediate results back to the CPU.

<TempestOceanExample embedded />

## Concepts

### Frequency-domain structure becomes spatial detail

A two-dimensional FFT changes how a complex field is represented without changing its logical
grid resolution. Frequency-space coefficients describe how much each wavelength and direction
contributes; the inverse transform reconstructs the corresponding spatial values. This makes
spectral water, image filtering, convolution, diffraction, and other field simulations practical
when a physical model is simpler to evolve in frequency space than at every spatial sample.

`GPUFFT2D` performs that representation change only. Applications still define coefficient
generation, physical units, normalization expectations, boundary policy, and how reconstructed
fields are consumed by later compute or rendering passes.

### FFT in a complete system

[`SpectralOceanSimulation`](../spectral-ocean-simulation) is the concrete composition example. It
evolves a Phillips wave spectrum, records three inverse `GPUFFT2D` transforms in one application-
owned command encoder, and turns their spatial fields into displacement, normal, and foam buffers.
The separation is intentional: the FFT owns transform mechanics, while the ocean owns spectrum,
time evolution, physical interpretation, and render-ready assembly.

## Usage

Each complex value occupies two consecutive `float32` components: real followed by imaginary.
Values are row-major, so the complete field contains `width * height * 2` floats.

```ts
import {Buffer} from '@luma.gl/core';
import {GPUFFT2D} from '@luma.gl/experimental';

const width = 256;
const height = 256;
const complexByteLength = width * height * 2 * Float32Array.BYTES_PER_ELEMENT;

const inputBuffer = device.createBuffer({
  data: initialComplexValues,
  usage: Buffer.STORAGE | Buffer.COPY_DST
});
const frequencyBuffer = device.createBuffer({
  byteLength: complexByteLength,
  usage: Buffer.STORAGE
});
const reconstructedBuffer = device.createBuffer({
  byteLength: complexByteLength,
  usage: Buffer.STORAGE
});
const transform = new GPUFFT2D(device, {width, height});

const commandEncoder = device.createCommandEncoder({id: 'spectral-step'});
transform.encode(commandEncoder, {
  inputBuffer,
  outputBuffer: frequencyBuffer,
  direction: 'forward'
});
transform.encode(commandEncoder, {
  inputBuffer: frequencyBuffer,
  outputBuffer: reconstructedBuffer,
  direction: 'inverse'
});
device.submit(commandEncoder.finish());
```

The two calls above compose in one command buffer. The second transform observes the first
transform's output through ordinary WebGPU command ordering; no intermediate submission or CPU
synchronization is required.

## Constructor

### `new GPUFFT2D(device, props)`

```ts
type GPUFFT2DProps = {
  id?: string;
  width: number;
  height: number;
};
```

`width` and `height` must each be powers of two from 2 through 2048. Rectangular transforms are
supported. The bound keeps allocation and dispatch costs predictable: the maximum field contains
4,194,304 complex values and occupies 32 MiB per complex buffer.

Construction allocates one field-sized scratch buffer, one compute pipeline, and two immutable
32-byte parameter buffers per pass so forward and inverse encodings never race through rewritten
uniforms. Input and output storage remain caller-owned.

## Encoding

### `encode(commandEncoder, options): Buffer`

```ts
type GPUFFT2DEncodeOptions = {
  inputBuffer: Buffer;
  outputBuffer: Buffer;
  direction?: 'forward' | 'inverse';
};
```

Both buffers must belong to the transform's device, declare `Buffer.STORAGE`, and contain at least
`stats.complexBufferByteLength` bytes. They must be separate allocations; the source is never
modified. Separate wrapper objects around the same underlying `GPUBuffer` are also rejected,
because the physical allocation would still alias across parallel butterfly invocations.
`encode()` returns `outputBuffer` for convenient downstream binding.

The normalization convention is:

- `forward`: negative complex exponent and no normalization;
- `inverse`: positive complex exponent and division by `width * height` on the final pass.

The transform first bit-reverses and evaluates every row, then does the same for every column.
Passes ping-pong between the class-owned scratch field and the caller's output so the final pass
always lands in `outputBuffer`.

## Support query

### `getGPUFFT2DSupport(device, props): GPUFFT2DSupport`

The support query validates dimensions before allocation and reports WebGPU compute, workgroup,
dispatch, storage-binding, and buffer-size limits. A valid plan is included in `stats` even when a
device limit prevents execution.

```ts
const support = getGPUFFT2DSupport(device, {width: 512, height: 256});
if (!support.supported) {
  console.warn(support.reason);
}
```

## Statistics

`transform.stats` is an immutable `GPUFFT2DStats` object:

| Field | Meaning |
| --- | --- |
| `width`, `height`, `elementCount` | Logical complex-field dimensions and value count. |
| `complexBufferByteLength` | Minimum byte length of input, output, and scratch fields. |
| `horizontalStageCount`, `verticalStageCount` | Radix-2 butterfly stages per axis. |
| `passCount`, `dispatchCountPerEncode` | Two bit-reversal passes plus all butterfly stages. |
| `workgroupSize`, `workgroupCount` | Fixed 8-by-8 invocation tile and dispatch grid. |
| `scratchBufferByteLength` | Class-owned transform scratch. |
| `parameterBufferCount`, `parameterBufferByteLength` | Immutable forward/inverse pass metadata. |

`makeGPUFFT2DStats(width, height)` computes the same plan without a device or GPU allocation.

## Ownership and lifecycle

`GPUFFT2D` owns only its compute pipeline, scratch buffer, and parameter buffers. The caller owns
input buffers, output buffers, command encoders, submission, and any optional readback. Destroying
the transform releases only class-owned resources and is idempotent. Previously supplied caller
buffers remain valid.

The same instance may encode more than one ordered transform into a command encoder. Do not encode
the same instance concurrently into command buffers that may execute simultaneously because those
encodings share its scratch field. Use separate instances when independent queues or overlapping
submissions need the same dimensions.

## Current limits

- WebGPU only; no WebGL fallback.
- Power-of-two dimensions from 2 through 2048.
- Packed row-major complex `float32` fields only.
- Out-of-place input and output only.
- One shared scratch field per instance; no concurrent execution contract.
- No hidden padding, real-to-complex packing, texture conversion, submission, or readback.

These constraints keep the primitive small and predictable while allowing higher-level systems to
define spectrum generation, texture outputs, cascade policy, and scheduling separately.
