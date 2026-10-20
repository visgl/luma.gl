# glTF physics: draft import and body semantics

`@luma.gl/gltf/physics` is an optional WebGPU physics adapter. It imports **raw glTF
JSON**, such as loaders.gl's `loadedAsset.json`, before node references are replaced
with postprocessed objects. Normal glTF rendering does not import or start physics.
Install the optional `@luma.gl/gpgpu` peer when using this subpath.

```typescript
import {parseGLTFPhysics, createGLTFPhysicsWorld} from '@luma.gl/gltf/physics';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

const description = parseGLTFPhysics(loadedAsset.json);
if (!description.supported) {
  // Each issue has a source JSON path, code and explanation. Do not simulate partially.
  throw new Error(JSON.stringify(description.issues));
}
const world = createGLTFPhysicsWorld(description);
const definition = new GPUCommandGraph(device);
world.addToGraph(definition);
const graph = await definition.compileAsync();
// Encode graph once for each fixed world.timeStep; the caller submits the encoder.
// Finish readbacks and destroy graph before world.destroy().
```

## Pinned draft profile

This implements a documented subset of two **unratified drafts**, not a general
glTF physics conformance claim. The description records both commit identifiers:

- [`KHR_physics_rigid_bodies`, 13ffdd2d](https://github.com/eoineoineoin/glTF/tree/13ffdd2d681736c3fdbac0d53b4f490770c178e4/extensions/2.0/Khronos/KHR_physics_rigid_bodies)
- [`KHR_implicit_shapes`, f817a1b2](https://github.com/eoineoineoin/glTF/tree/f817a1b252dcee25fa14174a49bc219310f61ddb/extensions/2.0/Khronos/KHR_implicit_shapes)

`KHR_collision_shapes` is not silently treated as an alias. This profile uses
`collider.geometry.shape`; draft mesh geometry uses `geometry.node` and is reported
unsupported. By default it does not accept the older `geometry.mesh` spelling. An
explicit `resolveLegacyMeshPositions` callback enables a separate, bounded legacy
profile: return decoded referenced XYZ vertices for that mesh index. Only authored
`convexHull: true` meshes whose hull is exactly an axis-aligned box are accepted.
All eight exact bounding corners must exist; arbitrary hulls are rejected rather
than approximated by boxes. Interior vertices and duplicate corners are allowed.
The loader adapter owns accessor decoding; the importer applies mesh-center offsets,
node transforms, mass properties and filters. Collider provenance records `meshIndex`
instead of `shapeIndex` for this path. The source document remains unchanged. This
supports the published Filtering sample using the existing box fast path.

`resolveLegacyMeshGeometry` explicitly enables the broader sample-era profile. It
returns decoded positions and triangle indices for an authored mesh reference.
`convexHull: true` builds a float32 convex hull (or retains the exact box fast path);
`false` preserves the original triangles and builds a local-space BVH. Preprocessing
runs once on the CPU; support queries, narrow phase and integration run on the GPU.
The example rejects sparse/morphed collision accessors rather than guessing their
geometry. Render meshes remain separate from collision declarations.
The physics
draft's prose assigns infinity semantics to zero mass/principal inertia even though
its pinned JSON schema still specifies strictly positive values; this profile follows
the prose and tests that behavior explicitly.

For filter lists, this profile follows the prose and category-mask implementation
model: an include list requires at least one matching system; an exclusion list
rejects any matching system; both directions must permit the pair. An empty include
list permits nothing, including colliders without systems. The draft's subset
notation is ambiguous for multi-system membership; these cases have explicit tests.

| Area | Supported profile |
| --- | --- |
| Scene selection | `options.scene`, then authored default, then scene zero; only reachable nodes participate |
| Shapes | Spheres, oriented boxes, tapered capsules, cylinders/cones; explicit legacy convex and triangle meshes; shared definitions and child offsets |
| Hierarchy | Colliders belong to the closest ancestor motion; a descendant motion starts an independent body |
| Body modes | No motion means static; authored motion is dynamic or explicitly kinematic |
| Mass properties | Authored mass, center of mass, principal inertia and inertia orientation; zero locks corresponding response |
| Computed properties | Analytic tapered-primitive and closed-polyhedron integrals, additive volume, uniform density (default 1000 kg/m³), volume-weighted center and full compound tensor diagonalization |
| Materials | Separate static/dynamic friction, restitution, all four combine policies with draft precedence |
| Filtering | Both directional tests must permit response; arbitrary named systems compile to bounded collider exclusions without a 32-name limit |
| Coordinates | Source Y-up coordinates retained; default gravity `[0, -9.81, 0]`; initial velocities transformed to world space |
| Kinematics | Initial constant velocities or explicit `world.setKinematicTarget(bodyIndex, nodePosition, nodeOrientation)` |
| Provenance | Node/body/collider indices, source shape/material/filter references, world matrices and a separate source JSON copy |

Default mass calculation adds primitive volumes, including overlaps; it does not
compute a Boolean union. Supply authored mass properties when that distinction
matters. Computed compound inertia includes rotated primitive tensors and
parallel-axis offsets. Supplying an inertia orientation without a diagonal is
reported unsupported. Uniform node scale bakes into collision dimensions and COM offsets. Authored mass
and principal inertia are physical values and remain unchanged; nonuniformly scaled
authored inertia requires tensor transformation and is reported unsupported.
Dynamic mesh mass integration requires a closed, consistently wound surface.
Overlapping compound volumes are still additive.

## Execution and ownership

Parsing and capability inspection allocate no GPU resources. World construction
rejects descriptions with issues. The reference backend remains limited to **128
bodies and 128 total colliders**, quadratic collider-pair storage and discrete collision
detection. Sphere/box worlds use four graph operations. Extended worlds add a parallel mesh
query operation, with indirect dispatch generated by the collision pass. Triangle
queries use a 65,536-entry queue, and manifolds retain at most four contacts per pair.
GJK/EPA iteration and polytope budgets are bounded. `readCollisionDiagnostics()`
reports unresolved queries and dropped triangle work; it is optional and never
needed to advance simulation. This is a bounded reference solver, not a large-scene
broad phase or a continuous-collision engine.

`body.position` describes the node origin; GPU `positions` and `readState().position`
describe the world center of mass. `description.bodies[].centerOfMass` is the
node-to-center offset in the resolved body's rotation frame. Collider poses are
relative to the node frame and are recentered internally. Authored source JSON
is never modified by parsing or simulation.

Kinematic targets are world-space node poses. A target is reached exactly in the
next step and held until replaced. The solver uses linear/angular velocities over
that step to push dynamic bodies. Large target jumps still have discrete-collision
limits. Kinematic bodies do not receive collision impulses or sleep; moving
kinematic contacts wake sleeping dynamic islands. Static bodies remain fixed.

The adapter does not update render scenegraph transforms. GPU rendering/bounds
publication is tranche 20C; automatic animation ownership is 20D. Physics-affecting
animation channels are reported, while unrelated material animations remain allowed.
Applications may submit explicit kinematic targets themselves. Rendering visibility
does not enable or disable physics.

## Explicitly unsupported

Triggers, joints, planes, deforming mesh colliders, and general mesh-to-mesh contacts
are unsupported. Mesh pairs are accepted only when both bodies are static, filtering
excludes contact, or fixed translation and conservative rotational bounds prove they
cannot meet. The pinned Motion Properties ceiling/wheel pair satisfies that proof.
Other unsupported features include
automatic instanced-body expansion, sheared/singular transforms, nonuniform sphere
scaling, reflected motion frames, animation-driven physics properties, and unknown
physics modifier fields/extensions produce capability issues rather than fallback
approximations. Static reflected boxes are supported. Importing physics instances
from `EXT_mesh_gpu_instancing` is not inferred from render instancing.

The standard renderer extension registry continues to reject required physics
extensions because loading render nodes alone does not execute their semantics.
Use this adapter's per-asset capability report to validate the supported subset.
