# Advection source audit

Audited 2026-11-28. This is a source review, not an upstream runtime benchmark or
a certification of correctness. Revisions below pin the inspected default-branch
snapshots; they do not imply that every feature is in a published package.

## Conclusions that change the roadmap

- Separate three goals: weather presentation, deterministic trajectory transport,
  and scientific ocean/dispersion applications. One score called SOTA hides their
  different contracts. Our RK45, stable IDs and graph tracing are substantial
  capabilities, but do not establish superiority over other complete products.
- Prioritize temporal residency and tile boundaries alongside spherical scheduling.
  Repeated full-field uploads and rendering can dominate even when integration is fast.
- Qualify interpolation and boundary behavior before claiming ocean-model parity.
  Higher-order integration cannot repair a wrongly reconstructed velocity field.
- Preserve the scientific tracer's explicit failure semantics. Visual reseeding,
  display-speed scaling and tile-edge dropout belong to a separate presentation policy.
- Add backward deterministic transport, local cell-travel limits, and explicit
  reference-version contracts. Neither a shared RK tableau nor a similarly named
  integrator guarantees matching trajectories.

## Web implementations

### Mapbox webgl-wind: useful historical baseline

[Update shader](https://github.com/mapbox/webgl-wind/blob/b1f6468d90d2f39763a8795a5042f316a32ff3c8/src/shaders/update.frag.glsl) implements manual bilinear field sampling, a single velocity-based
position update, latitude-dependent longitude scaling, packed RGBA positions and
probabilistic reseeding. This is a visual animation baseline, not an adaptive solver
with physical error control. Its random resets must not become implicit scientific
particle termination/release semantics. Use it to compare implementation footprint
and visual density, not as the sole accuracy oracle.

### Mapbox GL JS raster-particle: tile/render architecture

[Particle update](https://github.com/mapbox/mapbox-gl-js/blob/1511bc5a2fa5934a379b2f2d83eee0dd3f0d03aa/src/shaders/raster_particle_update.fragment.glsl) updates tile-local packed positions with one sampled velocity.
Outside-tile persistence decreases smoothly before a hard encoding-boundary reset.
[Render orchestration](https://github.com/mapbox/mapbox-gl-js/blob/1511bc5a2fa5934a379b2f2d83eee0dd3f0d03aa/src/render/draw_raster_particle.ts) maintains per-tile particle/color state, draws neighboring
tiles' particles into tile color targets, handles parent-tile fades, and renders onto globe/terrain geometry.
These are valuable precedents for tile-edge presentation and zoom transitions.
They do not demonstrate stable particle identities across tile ownership changes.
Our scientific tiled transport must instead define stencil halos, ownership,
missing-tile behavior and consistent resolution before adopting any visual dropout.

### wind-layer: temporal sources and multiple presentations

[Timeline source](https://github.com/sakitam-fdd/wind-layer/blob/76a96c224372df3325d6f47112e9fcb547322118/packages/gl-core/src/source/Timeline.ts) maintains paired sources, a tile cache and fractional timeline
progress. [Particle shader](https://github.com/sakitam-fdd/wind-layer/blob/76a96c224372df3325d6f47112e9fcb547322118/packages/gl-core/src/shaders/particles/update.frag.glsl) blends current/next textures, bilinearly samples them,
advances by a display-scaled velocity and reseeds outside data/view bounds or invalid
pixels. Initialization advances particles repeatedly to populate the view.
This argues for explicit prewarm/seeding controls in visual layers and an independent
bounded temporal-residency contract in graph. A rendered timeline blend alone is not
evidence of physical-time interpolation at all RK stages. Keep cache budgets,
cancellation and out-of-order loads explicit in our design.

### MapLibre particle fork: neighbor sampling

[Particle shader](https://github.com/danwild/maplibre-gl-particle/blob/9fcb9900b55f3eb62e3da2031541389524997055/src/shaders/particles.glsl) samples wind from a 3×3 texture neighborhood and uses visual dropout;
[Tile tests](https://github.com/danwild/maplibre-gl-particle/blob/9fcb9900b55f3eb62e3da2031541389524997055/test/particleTiling.test.js) tests tile selection. Neighbor access is directly relevant to
sampling halos. It does not by itself prove conservative fluxes, scientific boundary
crossing, or stable identity transfer. Include tile-edge numerical tests separately
from screenshots of continuous-looking trails.

### Cesium wind layer: globe rendering is not 3D transport

[Speed shader](https://github.com/hongfaqiu/cesium-wind-layer/blob/b1f4ac4b4d158ab62c20800a28c64a4872145779/packages/cesium-wind-layer/src/shaders/calculateSpeed.ts) uses a two-stage RK2-style longitude/latitude update, bilinear U/V
sampling, metre-to-degree conversion and frame-rate adjustment. Its inspected field
is two-dimensional: globe placement/elevation does not establish integration of a W
component or vertically varying coordinates. [Rendering implementation](https://github.com/hongfaqiu/cesium-wind-layer/blob/b1f4ac4b4d158ab62c20800a28c64a4872145779/packages/cesium-wind-layer/src/windParticlesRendering.ts) builds segment
geometry and depth resources for scene integration. Borrow the separation of compute,
segment rendering and depth handling; do not use this implementation as evidence for
qualified pole crossings or general 3D transport. This finding applies to the pinned
hongfaqiu repository, not every similarly named Cesium fork.

### deck.gl-community: reuse the existing ownership boundary

[Station particle simulation](https://github.com/visgl/deck.gl-community/blob/e22735513f22247d2572e62568ab0b5d9a84f165/modules/layers/src/wind-layers/wind-layer/gpu-particle-simulation.ts) already has GPU-resident WebGL2 transform-feedback and WebGPU
compute paths, current/next weather textures, frame-adjusted single-sample updates,
respawn and previous-position handling. [FlowParticleLayer](https://github.com/visgl/deck.gl-community/blob/e22735513f22247d2572e62568ab0b5d9a84f165/modules/layers/src/effect-layers/flow-particle-layer.ts) already consumes
borrowed texture-backed `FlowParticleStepResult` state and renders extrapolated
streaks, not retained curved history. Scientific tracers expose buffer-backed state;
an explicit typed adapter or renderer extension is required. There is no need to invent another generic
flow renderer. Audit the station-field adapter and add an opt-in graph solver where
contracts match; retain the lightweight visual backend and WebGL compatibility.
Scientific RK45 is currently WebGPU-only, so swapping it in unconditionally would
regress supported devices. Station interpolation also needs its own error evidence.

### earth: presentation reference, not a GPU throughput target

[Earth implementation](https://github.com/cambecc/earth/blob/5f091f0c3b60aa38a996a886985bacb3673d16c3/public/libs/earth/1.0.0/earth.js) interpolates a projected screen-space field, accounts for projection
distortion, groups particle strokes by speed, fades a canvas and reduces particle
count on mobile. This explains why readable wind structure is not simply a function
of integration order or particle count. Use it as a reference for density, color,
projection behavior and responsiveness; separately measure physical trajectories.

## Parcels: scientific contracts to qualify explicitly

### Integration and version differences

[Advection kernels](https://github.com/OceanParcels/Parcels/blob/0950e2383c5193345a0d0d04f921620bfc7736a3/src/parcels/kernels/_advection.py) contains RK2/RK4, their 3D variants, adaptive RK45 and an
analytical cell-advection implementation. In this revision, RK45 accepts a trial
when it meets tolerance **or reaches the minimum step**; our tracers instead report
`ToleranceFailure` for an over-tolerance minimum-step trial. Preserve that difference
and include it in comparison fixtures. The source also retains signed timestep
handling; our forward-only API leaves backward source tracing open.

The RK45 docstring labels tolerance in metres while the visible embedded estimate
is formed from coordinate increments. A geographic reference harness must verify
unit conversion in the complete executed configuration, rather than infer metre
parity from the docstring. Pin the version, mesh, interpolator, timestep/controller,
minimum-step policy and float precision in every exported reference.

The analytical kernel describes Ariane/TRACMASS-style cell transport and explicitly
uses intermediate timesteps for time-dependent fields. Treat analytical C-grid
transport as a separate investigation after grid/flux contracts, not as a drop-in
replacement or a completed exact solution for arbitrary time-varying fields.

### Interpolation and boundaries

[Structured interpolators](https://github.com/OceanParcels/Parcels/blob/0950e2383c5193345a0d0d04f921620bfc7736a3/src/parcels/interpolators/_xinterpolators.py) reconstructs C-grid velocity in face directions, handles
rectilinear/curvilinear coordinates and geographic cell metrics, and exposes free-slip
and partial-slip velocity interpolators. Slip is a field-reconstruction rule near
land, not simply a reflected particle endpoint. Split our boundary tranche into
localized termination, slip-aware sampling and explicit reflection; do not conflate
these policies or silently reinterpret zero velocity as a mask.

[Unstructured interpolators](https://github.com/OceanParcels/Parcels/blob/0950e2383c5193345a0d0d04f921620bfc7736a3/src/parcels/interpolators/_uxinterpolators.py) has distinct node/face/edge interpolators and a velocity
interpolator for unstructured grids. That motivates a deferred mesh-sampling tranche,
not a claim that Cartesian C-grid support covers general ocean grids.
[Vertical-coordinate tests](https://github.com/OceanParcels/Parcels/blob/0950e2383c5193345a0d0d04f921620bfc7736a3/tests/test_vertical_coordinate_interpolators.py) exercises vertical-coordinate interpolation; 3D work
must distinguish physical z, grid coordinates and time-varying interfaces.

### Residency and stochastic transport

[WindowedArray](https://github.com/OceanParcels/Parcels/blob/0950e2383c5193345a0d0d04f921620bfc7736a3/src/parcels/_core/_windowed_array.py) implements a lazy rolling time-window cache, records loads and
bytes, and assumes the retained window can cover particle clocks. It warns and may
exceed the requested maximum when required levels do not fit. Our GPU residency
contract should explicitly choose pause/backpressure or rejection under a hard
budget, rather than silently extrapolate or claim an unconditional cap.

[Diffusion kernels](https://github.com/OceanParcels/Parcels/blob/0950e2383c5193345a0d0d04f921620bfc7736a3/src/parcels/kernels/_advectiondiffusion.py) contains uniform diffusivity, Euler–Maruyama and Milstein
schemes with spatial diffusivity-gradient terms. A random displacement is not enough
for variable-diffusivity transport. Reproducible counter-based randomness and Brownian
increment handling across retries/batches need separate tests; adaptive deterministic
steps cannot automatically define a reproducible stochastic discretization.

### Reference fixtures worth reproducing

The pinned [advection tests](https://github.com/OceanParcels/Parcels/blob/0950e2383c5193345a0d0d04f921620bfc7736a3/tests/test_advection.py)
include moving and decaying eddies, a Stommel gyre with A/C-grid variants, spherical
versus flat cases, and vertical out-of-bounds behavior. These give B1b2/B2c3b/C1b
concrete fixture candidates beyond our uniform projected flow and rotation tests.
Reproduce the governing field independently and record differing interpolators;
matching an upstream test name or threshold alone is not a parity test.

## Comparison protocol

1. Pin input bytes, units, coordinates, masks, interpolation, release times/IDs,
   physical horizons, controller policies and reference revision. Run reference
   generation offline and retain independently checkable manufactured solutions.
2. Compare deterministic solvers at matched trajectory error, separating spatial,
   temporal, integrator and representation errors. Record termination differences.
   Observational mismatch also includes model/forcing uncertainty.
3. Compare visual products at matched viewport, field, particle/trail count and image
   quality. Report frame-time percentiles, camera motion, resize, memory, uploads,
   synchronization and cold/warm loading, as well as compute-only time.
4. Test at least two GPU families and a mobile device before a broad web-performance
   claim. Record backend/features and unsupported paths; do not silently substitute
   a different solver for a missing WebGPU feature.
5. Keep visual density maintenance separate from scientific release identities.
   Test tile seams, poles, LOD changes and delayed data numerically and visually.

The existing 1.45× initial / 2.57× repeat persistent-queue results compare our own
Cartesian scheduling modes on one shared Apple host. They establish neither a speedup
over these libraries nor a whole-frame globe speedup.

## Pinned inventory

- `OceanParcels/Parcels`: `0950e2383c5193345a0d0d04f921620bfc7736a3`.
- `cambecc/earth`: `5f091f0c3b60aa38a996a886985bacb3673d16c3`.
- `danwild/maplibre-gl-particle`: `9fcb9900b55f3eb62e3da2031541389524997055`.
- `hongfaqiu/cesium-wind-layer`: `b1f4ac4b4d158ab62c20800a28c64a4872145779`.
- `mapbox/mapbox-gl-js`: `1511bc5a2fa5934a379b2f2d83eee0dd3f0d03aa`.
- `mapbox/webgl-wind`: `b1f6468d90d2f39763a8795a5042f316a32ff3c8`.
- `sakitam-fdd/wind-layer`: `76a96c224372df3325d6f47112e9fcb547322118`.
- `visgl/deck.gl-community`: `e22735513f22247d2572e62568ab0b5d9a84f165`.
