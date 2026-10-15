# GPU sphere physics

`@luma.gl/gpgpu/gpu-physics` is an experimental WebGPU sphere-dynamics module.
`GPUSphereWorld` composes existing `GPUSort`, `GPUScan`, and command-graph resource
scheduling. Simulation state stays on the GPU and can be bound directly to rendering.
It is a discrete sphere solver, not a general-purpose rigid-body engine.

## Use

```typescript
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPUSphereWorld} from '@luma.gl/gpgpu/gpu-physics';

const definition = new GPUCommandGraph(device);
const world = new GPUSphereWorld({
  count,
  positions, // STORAGE vec4f: center.xyz, radius
  velocities, // STORAGE vec4f: linear velocity.xyz, inverse mass
  orientations, // optional STORAGE vec4f: quaternion xyzw
  maximumRadius: 0.5,
  maximumContacts: 32,
  iterations: 8,
  plane: {halfExtents: [6, 6]},
  gravity: [0, 0, -9.81]
});
world.addToGraph(definition);
const graph = await definition.compileAsync();

world.update({gravity: [2, 0, -9.81]});
const encoder = device.createCommandEncoder();
graph.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());

// After pending rendering/readback has completed:
graph.destroy();
world.destroy();
```

Update live settings once before submitting the next batch of graph encodings.
Updates share one uniform buffer; changing settings several times before submitting
a combined command buffer does not capture a separate settings snapshot per encoding.
The application owns the clock, fixed-step accumulator, submission and readback.

## Passes and bounds

Each substep integrates gravity, assigns hashed uniform-grid cells, stably sorts
cell/body pairs, counts nearby sphere contacts, scans counts into CSR offsets,
emits bounded directed contacts, solves them with out-of-place Jacobi iterations,
and updates orientation, rolling resistance and sleeping. Solver iterations use
symmetric degree-based relaxation and inverse-mass weighting. Contact bounce targets
are captured before iteration rather than repeatedly adding restitution.

Cell width is `2 * maximumRadius + contactSkin`; all 27 adjacent cells are examined.
Exact integer cell coordinates filter hash collisions. Negative coordinates and
variable radii are supported. Radii must be positive and at most `maximumRadius`;
coordinate magnitude must be below `cellWidth * 100,000,000`. Invalid bodies are
reported and excluded from contact discovery. Input velocities/inverse masses must
be finite, with nonnegative inverse masses. Zero inverse mass denotes a static body.

`maximumContacts` bounds each body's directed neighbor list, not the whole world's
list. Dense cells are traversed completely so dropped contacts are counted. Uniform
cells remove quadratic work for spatially distributed scenes; a pile concentrated
in one cell can still require quadratic candidate tests. Overflow is explicit and
must be resolved by increasing capacity, reducing density, or rejecting that scene.
The bounded `all-pairs` mode is limited to 256 bodies and exists as a test reference.

Contacts are rebuilt once per substep; large solver corrections can introduce new
contacts on the next substep. There is no continuous collision detection: use small
steps for fast or small bodies. The module checks dispatch and storage capacities
before declaring the graph and requires eight storage bindings per compute stage.

## State and ownership

All state rows occupy 16 bytes. Supplied buffers require STORAGE usage and must not
alias. Add COPY_SRC if the application needs readback.

| Buffer | Row |
| --- | --- |
| `positions` | center xyz, radius |
| `velocities` | linear velocity xyz, inverse mass |
| `orientations` | normalized quaternion xyzw |
| `angularVelocities` | world angular velocity xyz, reserved |
| `sleepStates` | quiet time, settings revision, reserved, reserved |

Omitted orientation, angular, sleep and diagnostics buffers are allocated by the
world when it is added to the graph and exposed on its fields. They persist across
encodings. Zero quaternions initialize to identity. Caller-supplied orientation
quaternions should be normalized. The graph owns scratch; the world owns only buffers
it allocated. Destroy the compiled graph before destroying the world. Neither
operation destroys caller-owned state. A world instance can be added to one graph.

## Contact and material model

A solid sphere has inertia `2/5 * mass * radius²`. Contact impulses update both
linear and angular velocity. Static/dynamic Coulomb friction switches based on the
impulse required to cancel slip. `rollingResistance` dissipates residual rolling
motion so a level platform eventually settles. Restitution is suppressed below
`restitutionThreshold` to avoid persistent micro-bounces. Low-speed supported bodies
sleep after `sleepAfter` seconds; zero disables sleeping. Impacts can wake bodies,
and changing gravity or plane settings wakes sleepers. Clear a body's sleep-state
row when explicitly teleporting it or assigning an external velocity.

The plane is a one-sided finite rectangle when half extents are supplied, otherwise
an effectively infinite plane. `normal` is normalized; `offset` is signed distance
along it. A deterministic tangent frame defines rectangle axes. Finite edges use
the closest point on the rectangle, so spheres can roll over the edge. Plane poses,
gravity and materials can change without recompiling. Legacy `floor` and `friction`
inputs remain accepted; `friction` is converted to a dynamic coefficient of
`1 - friction`. New applications should use explicit material coefficients.

## Diagnostics

The optional diagnostics buffer contains eight uint32 words. Its first seven words
are: dropped directed contacts, invalid bodies, emitted directed contacts, awake
dynamic bodies, sleeping dynamic bodies, candidate tests, and maximum required
contacts per body. The final word is reserved. Counters describe the last substep. Dropped-contact and candidate counters saturate at uint32 maximum instead of wrapping.
Use `decodeGPUSphereWorldDiagnostics(new Uint32Array(readback.buffer))` to decode a
sample. Reading diagnostics is explicit and never required by the simulation.

The standalone `examples/experimental/gpu-sphere-world` example offers 64, 1,024 and
10,000 bodies, direct GPU-buffer rendering, quaternion-driven cue-ball bands,
OrbitControls tilt, a bubble level, and a reproducible benchmark/report download.
It samples diagnostics and optional GPU timestamps separately from the simulation.

## Verification and remaining scope

WebGPU tests compare grid contact counts against a CPU reference and the bounded
GPU all-pairs path; check unequal-mass momentum/energy, static bodies, coincident
centers, finite edges, torque/no-slip rolling, quaternion normalization, sleeping,
live wake-up, stack convergence, repeatability, ownership and a 10k sparse scene.

Boxes, capsules, arbitrary collision meshes, joints, continuous collision detection,
broad-phase acceleration for pathological dense cells, cross-device bitwise
reproducibility and glTF physics adapters remain outside this sphere module.

## Interactive body controls and surfaces

`planes` accepts up to 32 static rectangles or infinite planes. It overrides the
legacy `plane` property; an empty array disables all surfaces. Each plane can
specify a `center`, `normal`, `halfExtents`, `restitution`, `staticFriction`,
`dynamicFriction`, `rollingResistance`, and `spinningResistance`. Omitted material values inherit the
world material. Spinning resistance defaults to zero and adds angular deceleration
about the contact normal of `coefficient * normalGravity / radius`; the pool cloth
uses it to dissipate residual side spin. A center overrides offset. The first half extent follows the
same deterministic tangent basis as the original plane: normalize `[normal.z,
0, -normal.x]` when `abs(normal.y) < 0.9`, otherwise normalize `[0, -normal.z,
normal.y]`. The second tangent is `cross(normal, firstTangent)`.

After `addToGraph`, body controls submit ordered GPU commands immediately:

```ts
world.applyImpulse(0, [2, 0, 0]);
world.applyImpulse(0, [2, 0, 0], [0, 0.1, 0]); // world-space application point
world.applyAngularImpulse(0, [0, 0, 0.1]);
world.wakeBody(0);
world.teleportBody(0, [-3, 0, 0.18]); // clears velocities and resets orientation
world.setBodyEnabled(0, false);
```

Submit any already-encoded simulation commands before calling these methods.
Each impulse executes once, independently of graph substeps. Static and disabled
bodies ignore impulses. Teleport preserves radius, mass and enabled state;
optional orientation is normalized. Enabling/disabling clears velocities and
wakes the body. Disabled bodies use a negative radius in the GPU position buffer,
retain their mass, and are omitted from integration, contacts and diagnostics.
Renderers should hide negative-radius bodies.

`await world.readState()` explicitly reads a small-scene snapshot of positions,
velocities, angular velocities, orientations and sleeping/enabled state. Caller
buffers must have `COPY_SRC` usage to use this helper. Snapshot radii are positive.
`getSphereTriggerBodies(snapshot, center, radius)` returns enabled bodies whose
centers lie within a spherical trigger. It performs no readback and does not
mutate the simulation. Pocket logic and scoring remain example responsibilities.
See `examples/experimental/gpu-pool` for a complete consumer.

### Experimental throw controls

`cutInducedThrow` and `spinInducedThrow` default to true. These select whether
linear relative velocity and angular contact-point velocity, respectively,
contribute to sphere–sphere tangential friction. With both enabled, the complete
relative surface velocity drives the existing Coulomb model. Disabling either
is an educational isolation of that contribution, not a calibrated billiards
material law. Plane friction is unaffected. The pool contact diagram chooses an
off-center world-space impulse point to produce top, back and side spin.
