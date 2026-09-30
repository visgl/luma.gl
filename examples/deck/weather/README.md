# Riverfront weather

A portable WebGPU/WebGL2 example with wind-driven rain, drifting snow, and height fog.
Run `yarn workspace luma.gl-examples-deck-weather start`; the website route is
`/examples/deck/weather`.

Choose Clear, Rain, Snow, or Fog. Intensity controls the particle count, wind uses metres
per second with direction clockwise from north, and visibility sets the fog extinction.
Pause freezes the clock exactly; reset returns to the seeded initial particle positions.
Camera movement remains available while paused. Time gaps above 0.1 seconds are dropped
so resuming a hidden or slow tab does not produce a large jump.

`precipitation` and `heightFog` are reusable shader modules. `WeatherParticleLayer` connects
those modules to Deck projection and depth. Its particle volume follows the view's ground
center while particles in the overlap retain their world positions. The vertical band is
0–450 metres; this example is intended for neighborhood-scale views. A CSS sky color sits
behind the transparent canvas. Clouds, precipitation splashes, surface accumulation, and
lighting changes are separate effects and are not simulated here.

Opaque geometry writes depth before precipitation. A conservative, example-owned 256×384
`r32float` height map excludes particles below roofs and covered bridges. This field costs
384 KiB, is uploaded once, and is borrowed by the layer. It represents only the highest
surface at each horizontal location; it is not a collision simulation or a general 3D
occlusion volume. Features smaller than a texel can exclude nearby air. Outside the map,
the surface height is zero. Applications with changing buildings must update the field.

Particle positions are evaluated from identifier, seed, clock, and velocity without state
textures or CPU particle updates. Changing velocity or volume dimensions changes the
analytic trajectories. Keep volume size fixed while moving its center. Extending a clock
for very long sessions eventually loses float precision; applications can reset the effect
between sessions. Fade at volume boundaries hides recycling. Particle count is capped at
262,144; practical limits depend on overdraw, viewport, and hardware.

Fog integrates exponential density along a ray in local metres. Density is constant below
the base height and decays exponentially above it. The visibility slider uses `3.912 / distance`
as base extinction, corresponding to 2% transmittance through a homogeneous medium. Height
falloff makes visibility greater above that base. The model uses a constant fog tint, without
light scattering, shadowed fog, or temporal accumulation. Materials must opt into the fog
module; it is not a whole-scene postprocess.

Run `yarn workspace luma.gl-examples-deck-weather test:visual` for both-backend movement,
pause, fog, depth-occlusion, surface-mask, and ownership checks. GPU module tests separately
check analytic fog and seeded, world-anchored motion.

The district geometry is rendered by `../river-district-layer.ts`, shared with the other riverfront
examples. It uses luma.gl's Lambert material for lighting, optional `heightFog`, and `surfaceBuffer`
for view-space normals/roughness and selection output. The layer owns its generated mesh buffer and
model; Deck owns their layer lifecycle. Fog defaults to zero density.
