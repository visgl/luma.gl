import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# SpectralOceanSimulation

<ExperimentalDocsTabs active="spectral-ocean-simulation" />

## Overview

`SpectralOceanSimulation` generates a periodic, render-ready deep-water ocean entirely on WebGPU.
Construction uploads a deterministic seeded Phillips spectrum. Each step evolves that spectrum
with the deep-water dispersion relation, runs normalized inverse transforms for height and X/Z
horizontal displacement through `GPUFFT2D`, then derives normals and
whitecaps from the displaced surface.

The simulation records into an application-owned `CommandEncoder`. It never submits commands,
maps buffers, reads results to the CPU, creates a frame loop, or owns scene geometry.

## Usage

```ts
import {SpectralOceanSimulation} from '@luma.gl/experimental';

const ocean = new SpectralOceanSimulation(device, {
  id: 'offshore-ocean',
  resolution: 256,
  patchSize: 512,
  windDirection: [0.9, 0.3],
  windSpeed: 22,
  amplitude: 0.0005,
  choppiness: 1.4,
  seed: 2026
});

const commandEncoder = device.createCommandEncoder({id: 'ocean-frame'});
const outputs = ocean.encode(commandEncoder, {
  time: elapsedSeconds,
  deltaTime: frameDeltaSeconds
});

// Bind outputs.displacementBuffer and outputs.normalFoamBuffer to a grid model.
device.submit(commandEncoder.finish());
```

## Constructor

### `new SpectralOceanSimulation(device, props)`

```ts
type SpectralOceanSimulationProps = {
  id?: string;
  resolution: number;
  patchSize?: number;
  windDirection?: readonly [number, number];
  windSpeed?: number;
  amplitude?: number;
  choppiness?: number;
  gravity?: number;
  seed?: number;
  foamDecay?: number;
  foamThreshold?: number;
  foamGain?: number;
};
```

`resolution` is a square power-of-two sample count from 8 through 1024. The upper bound keeps the
simulation's class-owned field storage near 96 MiB before backend pipeline metadata. `patchSize`
defaults to 256 world units and describes the periodic X/Z span.

`windDirection` defaults to `[1, 0]` and is normalized during construction. `windSpeed` defaults to
18, `amplitude` to `0.0005`, `choppiness` to `1.3`, `gravity` to `9.81`, and `seed` to `1`. The seed
is an unsigned 32-bit integer; the same physical parameters and seed produce the same initial
frequency field.

Foam comes from horizontal-displacement compression. `foamThreshold` is the Jacobian determinant
below which whitecaps appear, `foamGain` controls their response, and `foamDecay` is the retained
history's exponential decay per second.

## Encoding

### `encode(commandEncoder, options): SpectralOceanSimulationOutputs`

```ts
type SpectralOceanSimulationEncodeOptions = {
  time: number;
  deltaTime?: number;
  resetFoamHistory?: boolean;
};
```

`time` is absolute simulation time in seconds. It controls deterministic wave phase, so pausing or
seeking does not accumulate integration error. `deltaTime` defaults to `1 / 60` and only controls
foam-history decay.

WebGPU zero-initializes the normal/foam allocation, so the first encode starts without retained
foam. `resetFoamHistory: true` ignores the prior whitecap value before evaluating current surface
compression. It therefore clears history without suppressing whitecaps that form on that step.

Dynamic parameters are copied through the supplied encoder before their dispatches. Multiple
steps can consequently be recorded in one command encoder and each observes its own `time` and
`deltaTime`. All class-owned fields are reused, so a later step overwrites the outputs of an earlier
step unless the application records a copy between them.

One encode records:

1. one frequency-domain evolution dispatch;
2. three ordered normalized inverse `GPUFFT2D` transforms for height, X displacement, and Z
   displacement;
3. one surface assembly dispatch for output records, finite-difference normals, the horizontal
   displacement Jacobian, and foam history.

## Output buffers

`simulation.outputs` and every `encode()` return value are the same frozen object. The buffer
contents remain GPU-writable; the object only makes the resource references stable.

| Field | Layout | GPU usage |
| --- | --- | --- |
| `displacementBuffer` | Row-major `resolution²` `vec4<f32>` records: `(dx, height, dz, 0)` | `STORAGE`, `VERTEX`, `COPY_SRC` |
| `normalFoamBuffer` | Row-major `vec4<f32>` records: unit `(nx, ny, nz)` and foam in `[0, 1]` | `STORAGE`, `VERTEX`, `COPY_SRC` |

Both records have a 16-byte stride. `outputs.resolution`, `outputs.vertexCount`, and
`outputs.byteStride` make it straightforward to bind them as two `float32x4` vertex attributes or
as read-only storage arrays in a vertex shader.

Sparse wakes do not need to mutate the base FFT field. A renderer can bind a separate wake record
buffer and add its local height/normal/foam disturbance after reading these periodic base outputs.
A downstream compute pass can use the same two storage buffers as read-only inputs when a material
needs a physically combined field.

## Support and statistics

`getSpectralOceanSimulationSupport(device, props)` validates physical inputs and reports WebGPU,
workgroup, dispatch, binding-count, storage-binding-size, and buffer-size limits without allocating
resources. A valid CPU plan is included in `stats` even when a device limit prevents execution.

`makeSpectralOceanSimulationStats(props)` returns the same immutable plan without a device. It
includes field and output byte lengths, storage/uniform buffer counts, workgroup dimensions, the
three-transform dispatch count, total dispatches per encode, and the nested `GPUFFT2DStats` plan.

## Ownership and lifecycle

The class owns its initial and evolved spectra, three spatial fields, output buffers, uniform
storage, compute pipelines, and `GPUFFT2D` instance. The caller owns command encoders, submission,
render models, optional output copies, and readback. `destroy()` releases every class-owned
resource and is idempotent; output references become destroyed resources.

Ordered encodes on one command encoder are supported. Do not submit overlapping command buffers
that use the same simulation instance because its spectrum, spatial, output, foam-history, and FFT
scratch buffers are shared. Use one instance per independently executing ocean cascade.

## Current limits

- WebGPU only; no WebGL fallback.
- One square periodic deep-water patch per instance.
- Power-of-two resolution from 8 through 1024.
- Phillips spectrum and the deep-water dispersion relation; no shallow-water or shoreline solve.
- Float32 storage-buffer outputs rather than textures.
- No hidden scene mesh, wake policy, frame loop, submission, or CPU readback.
