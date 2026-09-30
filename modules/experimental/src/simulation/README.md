# Flow particles

`FlowParticleSimulation` advances a fixed-capacity particle set entirely on the GPU.
It supports WebGPU and WebGL2 devices that can render `rgba32float` targets; call
`isFlowParticleSimulationSupported(device)` before offering the effect.

```ts
const simulation = new FlowParticleSimulation(device, {
  field: {
    texture: velocityTexture,
    bounds: [-100, -500, 100, 500],
    coordinates: 'cartesian'
  },
  particleCount: 16384,
  lifetime: 60,
  seed: 1
});
const particles = simulation.step(elapsedSeconds);
// Render particles.texture and particles.previousTexture before the next step.
simulation.destroy();
// velocityTexture remains caller-owned.
```

The borrowed velocity texture has at least two samples along each axis, with samples
at both endpoints of the bounds. Column zero is west/lower X; row zero is south/lower Y.
RGBA float channels contain `(east velocity, north velocity, validity, unused)`.
Velocities are metres/second. Use a finite validity value below 0.5 for missing data;
never upload NaNs. Bilinear interpolation requires all four neighboring samples to be
valid, conservatively excluding cells beside missing data. Update texture contents or
call `setField` to supply a different time slice. Changing bounds or coordinate systems
resets particles; changing the velocity texture alone preserves them.

Cartesian bounds are in metres. Geographic bounds are longitude/latitude degrees within
±85° latitude. East/north velocity is converted using a spherical Earth radius of
6,371,008.8m and the particle's current latitude. This is a visualization approximation,
not a geodesic transport solver. Unwrap dateline-crossing bounds such as `[170,-10,190,10]`;
particles leave and respawn at the domain boundary, including full-world domains.

Each state texel is `(normalized X, normalized Y, age in seconds, generation)`. Stable
particle IDs are row-major texture indices below `particleCount`. A negative age marks an
inactive particle awaiting a valid spawn. Hide inactive particles and break trajectories
when generation changes. Unused padding records stay inactive. Two textures are reused;
references are borrowed and may be overwritten by the next step or reset.

Integration uses explicit midpoint steps no longer than 1/30s, with at most eight steps
per call. Longer gaps are dropped and reported by `droppedTime`. Zero time is a true pause.
This bounds execution cost, not spatial error: fast fields and thin obstacles still need
smaller caller steps. The validity mask is sampled at the start, midpoint, and endpoint;
it is not continuous collision detection. Respawning makes one uniformly distributed
attempt per inactive particle per substep, so sparse valid domains populate gradually.
Reset is seeded and reproducible for an identical sequence of time steps on one backend.

The class submits one pass itself. Call it before the application's drawing pass.
There is no CPU particle readback and no implicit animation loop. Two state textures cost
32 bytes per allocated texel; the hard limit of 1,048,576 particles caps them at 32 MiB.
The caller owns the velocity grid and controls particle density independently of view size.

## Tiled and changing fields

`FlowFieldAtlas` owns a fixed-capacity `rgba32float` grid. Pass its `field` to
`FlowParticleSimulation`; the simulation borrows the texture. `writeTile(column, row, data)`
updates one complete tile in place, and `clearTile(column, row)` marks it missing. Neither
operation resets particles or reallocates the texture. Destroy the simulation before the atlas.

Tiles are non-overlapping blocks of a single regular sample lattice, ordered west to east
and south to north. `bounds` describe the first and last samples across the **whole** grid,
not tile edges. For example, a 2×2 atlas of 2×2-sample tiles with bounds `[0, 0, 3, 3]` has
sample coordinates 0, 1, 2, 3 on each axis. Do not duplicate border samples or add gutters.
The existing bilinear sampler interpolates across adjacent tiles. A cell touching any missing
sample is invalid, including along unloaded tile boundaries. Particles reseed when they reach
invalid cells; tile arrival alone does not reset valid particles.

```ts
const atlas = new FlowFieldAtlas(device, {
  bounds: [0, 0, 3, 3],
  coordinates: 'cartesian',
  tileSize: [2, 2],
  tileCount: [2, 2]
});
// Four row-major samples: east velocity, north velocity, validity, unused.
atlas.writeTile(0, 0, new Float32Array([
  1, 0, 1, 0, 1, 0, 1, 0,
  1, 0, 1, 0, 1, 0, 1, 0
]));
const simulation = new FlowParticleSimulation(device, {field: atlas.field, particleCount: 1024});
```

The next simulation step observes completed writes. Updating several tiles synchronously
before that step gives one coherent field snapshot. Snapshots are piecewise constant; there
is no implicit interpolation in time. The application owns timestamps, out-of-order arrival
handling, loading and eviction. For deterministic replay, repeat the same field writes and
step intervals. Geographic atlases use the existing unwrapped longitude/latitude contract;
tiles must share one coordinate system and resolution. Mixed-resolution pyramids and reprojection
of arbitrary source tiles are not supported by this container.

`MAX_FLOW_FIELD_SAMPLES` limits GPU storage to 64 MiB, also subject to the device texture-size
limit. `byteLength` reports GPU sample bytes. Initialization uses an equally sized temporary CPU
array, and the atlas retains one zero-filled tile for clearing. Uploaded caller arrays are not
retained. Missing tiles occupy their reserved capacity; memory never grows with streaming updates.
