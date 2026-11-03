# Bodies and collisions

A body stores motion and mass properties. A collider attaches a collision shape and material/filter properties to a body. Several colliders can form a compound body. The rendered surface and collision shape are separate representations.

| Body mode | Motion owner             | Typical use                         |
| --------- | ------------------------ | ----------------------------------- |
| Static    | Authored scene           | Floors, walls and fixed anchors     |
| Kinematic | Animation or application | Moving platforms and machinery      |
| Dynamic   | Physics                  | Blocks, balls and other free bodies |

Mass, center of mass and inertia control response to impulses. Off-center impulses can rotate a body. Keep node origins, collider-local frames and centers of mass distinct.

## Choose geometry deliberately[​](#choose-geometry-deliberately "Direct link to Choose geometry deliberately")

Use analytic primitives when they match the object. Spheres, boxes, capsules and cylinders can be represented by parameters rather than collision meshes. Convex hulls and cooked triangle meshes handle more complex geometry at greater cost.

A convex hull closes openings. Triangle-mesh contacts preserve original openings but use surface semantics; they do not generally recover a body initially deep inside a closed solid. Check the [collision coverage matrix](https://luma.gl/next/docs/api-reference/graph/gpu-physics-collision-coverage.md) for supported pairs and qualification limits.

## Materials and filters[​](#materials-and-filters "Direct link to Materials and filters")

Restitution controls normal bounce. Friction constrains tangential motion; static and dynamic friction can differ. Ordinary contact friction alone does not dissipate ideal rolling indefinitely, so inspect the chosen world's rolling/spinning resistance controls.

Filters decide whether a pair is eligible to collide. Trigger volumes observe overlaps without producing contact forces. When boxes pass through each other, inspect filters, shape support and diagnostics before increasing solver iterations.

## Events and queries[​](#events-and-queries "Direct link to Events and queries")

Rigid-body worlds opt into contact events with `eventCapacity`, and queries with `enableQueries`, before graph attachment. These features allocate additional storage.

* `readContactEvents()` returns begin, impact and end records with step and body/collider identities.
* `raycast()` finds a nearest surface hit.
* `overlapSphere()` finds intersecting colliders within a declared result budget.
* `castSphere()` performs a bounded translated-sphere sweep.

These are asynchronous GPU results. Keep simulation step identity, consumer latency and reported event loss explicit. Queries do not advance physics, and query selection is independent of simulation collision filters. See the [collision API reference](https://luma.gl/next/docs/api-reference/graph/gpu-rigid-body-world.md#game-facing-collision-apis) for geometry semantics and concurrency limits.

## Fast motion[​](#fast-motion "Direct link to Fast motion")

Discrete steps can miss thin objects. A smaller timestep reduces risk but is not a general continuous-collision guarantee. The worlds offer different bounded CCD paths; moving convex CCD, sphere/static CCD, jointed bodies and nonconvex shapes have different envelopes. Use the [rigid-body reference](https://luma.gl/next/docs/api-reference/graph/gpu-rigid-body-world.md#moving-convex-ccd) and qualify the actual geometry, speed and timestep.
