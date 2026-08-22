# VolumetricFireSimulation

[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[Volumetric Fire](https://luma.gl/next/docs/api-reference/experimental/volumetric-fire-simulation.md)

`VolumetricFireSimulation` is an experimental WebGPU-only dense-grid fire and smoke simulation. It records a fixed-capacity sequence of 3D compute passes through `GPUCommandGraph`: velocity and combustion advection, external forces, divergence, Jacobi pressure projection, dissipation, reaction, and emitter injection. The class owns the simulation fields but leaves command submission, fixed-step scheduling, rendering, and scene-to-volume transforms to the application.

This is a real-time visual-effects solver rather than a general computational-fluid-dynamics API. Its public textures can be sampled by a volume renderer, a lighting pass, or diagnostic views without copying simulation state through the CPU.

## Usage[​](#usage "Direct link to Usage")

```
import {Texture} from '@luma.gl/core';

import {VolumetricFireSimulation} from '@luma.gl/experimental';



const dimensions = [64, 96, 64] as const;

const obstacleTexture = device.createTexture({

  dimension: '3d',

  width: dimensions[0],

  height: dimensions[1],

  depth: dimensions[2],

  format: 'r8unorm',

  usage: Texture.SAMPLE | Texture.COPY_DST,

  data: obstacleMask

});



const simulation = new VolumetricFireSimulation(device, {

  id: 'forge-fire',

  dimensions,

  pressureIterations: 6,

  obstacleTexture

});



const commandEncoder = device.createCommandEncoder({id: 'fire-step'});

simulation.encode(commandEncoder, {

  deltaTime: 1 / 60,

  time: elapsedSeconds,

  emitters: [

    {

      position: [0.5, 0.08, 0.5],

      radius: 0.07,

      velocity: [0, 0.45, 0],

      density: 1.2,

      temperature: 5.5,

      fuel: 1,

      rate: 1,

      impulse: 1

    }

  ],

  buoyancy: 3,

  smokeWeight: 0.15,

  turbulence: 2.5,

  vorticity: 0.45,

  velocityDissipation: 0.997,

  densityDissipation: 0.995,

  temperatureDissipation: 0.99,

  fuelDissipation: 0.985,

  reactionRate: 1.5,

  heatRelease: 2,

  smokeYield: 0.6,

  cooling: 0.12,

  boundaryDamping: 0.72,

  obstacleThreshold: 0.5,

  noiseScale: 3.4

});

device.submit(commandEncoder.finish());
```

Bind `simulation.combustionTexture` to the volume-rendering shader after the simulation step has been submitted. `simulation.velocityTexture` is also available for flow diagnostics or custom advection-aware rendering.

## Constructor[​](#constructor "Direct link to Constructor")

### `new VolumetricFireSimulation(device, props?)`[​](#new-volumetricfiresimulationdevice-props "Direct link to new-volumetricfiresimulationdevice-props")

Creates the persistent simulation textures, compute pipelines, and compiled command graph. The constructor rejects non-WebGPU devices and texture dimensions outside the active device limits.

| Prop                 | Meaning                                                                                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | Optional debug-resource prefix. Defaults to `volumetric-fire-simulation`.                                                                                                                                                                                                                           |
| `dimensions`         | Width, height, and depth of the dense Cartesian grid. Each entry must be an integer of at least four within `device.limits.maxTextureDimension3D`. Defaults to `[64, 96, 64]`.                                                                                                                      |
| `pressureIterations` | Positive integer Jacobi iteration count recorded into each simulation step. More iterations reduce residual divergence at additional compute cost. Defaults to `6`.                                                                                                                                 |
| `obstacleTexture`    | Optional caller-owned, sampleable `r8unorm` 3D texture from the same device and matching `dimensions`. Zero denotes fluid space and one denotes solid cells; intermediate values are compared with `obstacleThreshold`. When omitted, the simulation creates an internally owned all-fluid texture. |

The obstacle field is static for an encoded step. Applications that rewrite it are responsible for ordering that update before the next simulation submission. The simulation does not voxelize scene meshes or infer obstacles from rendered depth.

## Emitters and volume coordinates[​](#emitters-and-volume-coordinates "Direct link to Emitters and volume coordinates")

Emitter positions use normalized volume coordinates. `[0, 0, 0]` addresses the minimum corner of the simulation domain and `[1, 1, 1]` addresses its maximum corner. Before upload, the simulation converts positions to centered grid-cell coordinates and converts `radius`, which is normalized relative to the shortest volume dimension, to grid cells. `velocity` supplies momentum direction and relative magnitude, while `impulse` is an additional multiplier. Callers must transform world-space scene values into this coordinate system before calling `encode()`.

Each emitter may provide density, temperature, and fuel injection strengths; `rate` scales the source as a whole. The solver applies injection over `deltaTime`, so changing the fixed-step frequency does not intentionally change the total emission per second. At most four emitters are active; entries beyond that fixed capacity are ignored. Density, temperature, fuel, rate, and impulse each default to `1`; velocity defaults to `[0, 1, 0]`. Keep emitter positions inside the normalized domain and use a finite, nonnegative radius.

## Encoding a step[​](#encoding-a-step "Direct link to Encoding a step")

### `encode(commandEncoder, options): GPUCommandGraphEncoding`[​](#encodecommandencoder-options-gpucommandgraphencoding "Direct link to encodecommandencoder-options-gpucommandgraphencoding")

Records exactly one simulation step into the supplied `CommandEncoder`. The method does not submit commands, wait for completion, allocate per-frame textures, or read simulation data back to the CPU.

| Option                   | Meaning                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deltaTime`              | Required positive finite step duration in seconds. Use a bounded fixed timestep; one step traces at most eight grid cells along a characteristic. |
| `time`                   | Application simulation time in seconds used by time-varying turbulence. Defaults to `0`.                                                          |
| `emitters`               | Normalized emitter records. Defaults to `[]`; at most four entries are used.                                                                      |
| `buoyancy`               | Upward acceleration contributed by hot gas. Defaults to `2.2`.                                                                                    |
| `smokeWeight`            | Downward force contributed by dense smoke. Defaults to `0.28`.                                                                                    |
| `turbulence`             | Strength of the analytic divergence-free turbulence field. Defaults to `0.8`.                                                                     |
| `vorticity`              | Small-scale rotational confinement strength. Defaults to `0.45`.                                                                                  |
| `velocityDissipation`    | Velocity retained over one nominal 60 Hz step. Defaults to `0.997`.                                                                               |
| `densityDissipation`     | Smoke density retained over one nominal 60 Hz step. Defaults to `0.995`.                                                                          |
| `temperatureDissipation` | Temperature retained over one nominal 60 Hz step. Defaults to `0.99`.                                                                             |
| `fuelDissipation`        | Fuel retained over one nominal 60 Hz step. Defaults to `0.985`.                                                                                   |
| `reactionRate`           | Fuel consumption rate. Defaults to `2.6`.                                                                                                         |
| `heatRelease`            | Temperature released by consumed fuel. Defaults to `1.45`.                                                                                        |
| `smokeYield`             | Smoke produced by consumed fuel. Defaults to `0.62`.                                                                                              |
| `cooling`                | Additional height-independent cooling rate. Defaults to `0.12`.                                                                                   |
| `boundaryDamping`        | Velocity retained close to a solid boundary. Defaults to `0.72`.                                                                                  |
| `obstacleThreshold`      | `r8unorm` mask value at or above which a cell is solid. Defaults to `0.5`.                                                                        |
| `noiseScale`             | Spatial frequency of the analytic turbulence field. Defaults to `3.4`.                                                                            |
| `reset`                  | Clears state before this step's emitters are applied. Defaults to `false`; use an empty emitter list to leave a clear domain.                     |

All numeric step and active-emitter values must be finite. Retention values and other bounded shader controls are clamped where they are consumed; negative forces and source channels remain available for deliberate artistic effects.

Record one `encode()` call for each simulation step. Per-step uniform uploads are recorded on the supplied command encoder, so an application may encode multiple ordered catch-up substeps before dependent rendering and submit them together. `VolumetricFireSimulation` intentionally has no hidden accumulator or animation clock; the caller chooses the number, duration, and submission order of all steps.

### `makeVolumetricFireSimulationUniformData(dimensions, options): Float32Array`[​](#makevolumetricfiresimulationuniformdatadimensions-options-float32array "Direct link to makevolumetricfiresimulationuniformdatadimensions-options-float32array")

Packs one step into the stable cross-kernel uniform layout. This is primarily useful for shader contract tests and diagnostics; applications normally pass the same options directly to `encode()`. The returned array is independent CPU data and uploading it does not advance the simulation.

## Public textures and statistics[​](#public-textures-and-statistics "Direct link to Public textures and statistics")

### `velocityTexture: Texture`[​](#velocitytexture-texture "Direct link to velocitytexture-texture")

The current projected velocity field. It is an `rgba16float` 3D texture; XYZ contain velocity in grid cells per second. The remaining channel is reserved for implementation use.

### `combustionTexture: Texture`[​](#combustiontexture-texture "Direct link to combustiontexture-texture")

The current `rgba16float` 3D combustion field. Its channels contain smoke density, temperature, fuel, and age. Renderers should treat these as linear simulation values rather than display-ready colors.

### `obstacleTexture: Texture`[​](#obstacletexture-texture "Direct link to obstacletexture-texture")

The obstacle mask used by every simulation pass. This is the borrowed texture supplied at construction or an internally owned all-fluid `r8unorm` texture when no mask was supplied. The simulation never destroys a caller-provided obstacle texture.

### `stats: GPUCommandGraphStats`[​](#stats-gpucommandgraphstats "Direct link to stats-gpucommandgraphstats")

Read-only resource-allocation and scheduling statistics from the compiled command graph, including its stable node order and logical, imported, transient, and physical allocation counts and byte estimates. Reading `stats` does not trigger GPU readback. It describes the compiled graph, not live density, temperature, or divergence.

### `getBindings(): VolumetricFireSimulationBindings`[​](#getbindings-volumetricfiresimulationbindings "Direct link to getbindings-volumetricfiresimulationbindings")

Returns `velocityTexture`, `combustionTexture`, and `obstacleTexture` together for renderers and diagnostic passes. The returned handles follow the same ownership rules as the public properties.

## Resource ownership[​](#resource-ownership "Direct link to Resource ownership")

`VolumetricFireSimulation` owns its velocity and combustion textures together with its transient pressure, divergence, and scratch allocations, uniform buffer, compute pipelines, sampler, and compiled command graph. When no obstacle texture is supplied, it also owns the all-fluid fallback texture. Call `destroy()` when the simulation is no longer needed. Public simulation texture handles are borrowed views of that owned state and must not be destroyed separately.

The optional `obstacleTexture` remains caller-owned. Destroying the simulation does not destroy it. Conversely, the caller must keep it alive until the simulation is destroyed or no longer uses the obstacle field.

## Current scope[​](#current-scope "Direct link to Current scope")

The first implementation intentionally uses a uniform dense grid, semi-Lagrangian advection, and a bounded Jacobi pressure solve. It does not yet provide:

* sparse, tiled, or adaptively refined volume storage;
* MacCormack or BFECC advection;
* arbitrary mesh voxelization or moving solid boundaries;
* a general chemical-combustion or production CFD model;
* WebGL execution;
* automatic rendering, command submission, or simulation readback.

These boundaries keep memory and work explicit while leaving room for higher-order transport and sparse grids in later revisions.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPU Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-command-graph.md) documents graph ownership, hazard inference, and encoding.
* [GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md) provides depth, normal, and velocity attachments for depth-aware volume composition.
* [Shader Passes](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) describes composable HDR and temporal rendering pipelines that can consume the simulation textures.
