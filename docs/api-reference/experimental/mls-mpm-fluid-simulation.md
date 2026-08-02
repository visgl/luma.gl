import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {FluidFoundryExample} from '@site/src/examples';

# MLSMPMFluidSimulation

<ExperimentalDocsTabs active="mls-mpm-fluid-simulation" />

`MLSMPMFluidSimulation` is an experimental WebGPU-only, fixed-capacity two-dimensional fluid
solver. Each step uses moving least squares material point method (MLS-MPM) transfers with an APIC
affine velocity field to move state from particles to a nodal grid and back.

The class owns its compute pipelines, atomic grid, uniforms, and double-buffered particle state.
It records work into the application's `CommandEncoder` and never submits commands or reads data
back. Applications can therefore encode simulation and storage-backed particle rendering in one
frame command buffer.

<FluidFoundryExample embedded showStats={false} />

## Usage

```ts
import {MLSMPMFluidSimulation} from '@luma.gl/experimental';

const simulation = new MLSMPMFluidSimulation(device, {
  gridSize: [96, 64],
  particleCount: 16_384,
  seed: 42,
  velocityDamping: 0.1,
  maxVelocity: 2
});

const commandEncoder = device.createCommandEncoder({id: 'fluid-frame'});
const particleBuffer = simulation.encode(commandEncoder, {
  deltaTime: 1 / 960,
  gravity: [0, -9.81],
  force: pointerDown
    ? {position: pointerPosition, radius: 0.08, vector: pointerForce}
    : undefined
});

particleModel.setBindings({particles: particleBuffer});
particleModel.predraw(commandEncoder);
const renderPass = commandEncoder.beginRenderPass({framebuffer});
particleModel.draw(renderPass);
renderPass.end();

device.submit(commandEncoder.finish());
```

`encode()` returns the new current particle buffer. The same buffer is available through
`simulation.particleBuffer`; bind it as read-only storage after the encoded compute step. The
public `gridBuffer` exposes the current atomic grid for diagnostics or specialized consumers. Both
buffers remain owned by the simulation and are destroyed with it. Because particle state alternates
between two buffers, update a renderer's binding from the return value or accessor after every
`encode()` instead of caching the first buffer.

## Stable simulation substeps

One `encode(commandEncoder, options)` call splits the requested delta into one or more stable
substeps. Each substep records four ordered stages in the same compute pass:

1. Clear the atomic grid.
2. Scatter particle mass and momentum to a quadratic three-by-three grid stencil.
3. Convert momentum to velocity, then apply gravity, an optional radial force, global velocity
   damping, boundary conditions, and the configured velocity limit.
4. Gather grid velocity back to the output particle buffer, update the APIC affine field and
   deformation estimate, and advect particles.

The conservative substep bound combines half-cell advection CFL with the configured material wave
speed at the maximum supported deformation, grid resolution, and hard velocity limit.
`stableDeltaTime` reports that bound. The solver uses `ceil(deltaTime / stableDeltaTime)` equal
substeps, so one uniform upload safely serves the entire encoded compute pass. To bound command
recording, one encode is limited to 128 substeps (512 compute dispatches); `encode()` throws before
recording if the requested delta would exceed that work budget. Reduce `deltaTime` or solver
resolution in that case. `maximumSubstepCount`, `lastSubstepCount`, and `lastSubstepDeltaTime`
expose the budget and actual split. `getMLSMPMFluidStableDeltaTime()` performs the same calculation
without allocating GPU resources.

Grid scatter uses signed fixed-point integer atomics so accumulation order does not change mass or
momentum sums. Mass and signed momentum scales are the largest safe powers of two up to the shader's
precision cap for the configured particle count, mass, and velocity limit. This preserves small-mass
stencil contributions while keeping conservative worst-case accumulation below signed 32-bit
capacity. The grid stores fixed-point mass and velocity after a complete substep; its signed fields
contain momentum only between the scatter and grid-update stages inside that substep.

```ts
export type MLSMPMFluidSimulationStepOptions = {
  deltaTime: number;
  gravity?: readonly [number, number];
  force?: {
    position: readonly [number, number];
    radius: number;
    vector: readonly [number, number];
  };
};
```

Positions and force centers use normalized `[0, 1]` simulation coordinates. The requested frame
`deltaTime` must be at least `1e-7` and no larger than `1 / 30`; the solver automatically records
smaller numerical substeps when required. Gravity defaults to `[0, -9.81]`.

## Construction

```ts
new MLSMPMFluidSimulation(device, props?)
```

| Prop | Default | Meaning |
| --- | ---: | --- |
| `id` | `'mls-mpm-fluid-simulation'` | Debug-resource prefix. |
| `gridSize` | `[64, 64]` | Nodal grid width and height; each dimension must be from 8 through 512. |
| `particleCount` | `8192` | Fixed particle capacity when `initialParticles` is omitted; maximum 65,536. |
| `seed` | `1` | Unsigned 32-bit seed for generated particle jitter. |
| `initialParticles` | generated block | Explicit normalized positions and optional velocities. |
| `boundaryCells` | `2` | Solid boundary thickness, at most one quarter of the smaller grid dimension. |
| `particleMass` | `1` | Uniform particle mass used by transfer and fixed-point capacity planning. |
| `restDensity` | `4` | Density used to derive particle volume. |
| `stiffness` | `8` | Isotropic equation-of-state stiffness; zero disables pressure. |
| `velocityDamping` | `0.08` | Global grid-velocity damping rate in inverse seconds. |
| `maxVelocity` | `16` | Stability and signed-atomic velocity bound. |

When `initialParticles` is supplied, its length defines the fixed capacity and must match an
explicit `particleCount`. Every particle position must be inside the normalized domain. Accepted
generated, explicit, and reset positions are clamped to the configured solid-boundary interior so
their complete quadratic transfer stencil lies on the grid. Particle velocity is validated by
vector magnitude, which must not exceed `maxVelocity`.

The public `particleBuffer` uses a stable 48-byte particle record:

| Float offset | Value |
| ---: | --- |
| 0–1 | Normalized position. |
| 2–3 | Normalized-domain velocity per second. |
| 4–7 | Two APIC affine matrix columns. |
| 8 | Deformation estimate. |
| 9–11 | Reserved padding. |

## Reset and diagnostics

```ts
simulation.reset(commandEncoder);
simulation.reset(commandEncoder, replacementParticles);
```

`reset()` records uploads into both particle buffers, restores buffer A as current, and resets the
encode and substep diagnostics. Omitting particles restores the exact generated or explicit constructor seed;
supplying particles requires exactly the original fixed count. The caller still submits the
encoder. The grid is cleared by the next encoded step, not by a separate reset dispatch.

`stats` reports grid and buffer sizes, particle and grid workgroup counts, selected fixed-point
scales and conservative signed-atomic bounds, the per-substep stage order, stable delta, public
encode count, total numerical step count, and most recent substep split.
`getMLSMPMFluidFixedPointBounds()` exposes the same scale and capacity calculation without creating
GPU resources. `MLS_MPM_FLUID_STAGE_ORDER` publishes the per-substep diagnostic stage names.

## Support and lifecycle

`getMLSMPMFluidSimulationSupport(device, props?)` validates props and checks for WebGPU, three
compute-stage storage buffers, 64 compute invocations per workgroup, storage-buffer capacity, and
dispatch limits. Construction performs the same checks before allocating resources.

`destroy()` is idempotent and releases every owned computation and buffer. Accessing `encode()` or
`reset()` after destruction throws; application models that borrow `particleBuffer` or `gridBuffer`
must stop using them before destruction.

This foundation intentionally solves one bounded two-dimensional domain. It does not provide a
particle renderer, scene integration, adaptive particle allocation, obstacles beyond the solid
domain boundary, or general three-dimensional material simulation.
