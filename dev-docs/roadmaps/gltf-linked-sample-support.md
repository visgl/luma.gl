# Full support for the linked glTF samples

Scope: the four physics and four interactivity assets currently linked by the example
selectors. This is asset coverage, not full conformance to either draft extension.
The audit reads the actual pinned GLB JSON, rather than inferring requirements from
sample names. Implementation estimates below are planning estimates, not commitments.

## Pinned sources

- [Physics samples](https://github.com/eoineoineoin/glTF_Physics/tree/9dc61cb3474ff9a51f58d3592f79d5c9e572056a/samples), revision `9dc61cb3474ff9a51f58d3592f79d5c9e572056a`.
- [Interactivity samples](https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity/tree/926bec45dfbe052bad4013ab5852ed2f4042bff5), revision `926bec45dfbe052bad4013ab5852ed2f4042bff5`.
- The importer separately pins the physics and implicit-shapes draft profiles in
  `modules/gltf/src/physics/README.md`. The sample revision and schema revision are
  distinct; matching extension names do not establish schema compatibility.

## Coverage and missing work

| Asset | Current behavior | Requirements for full asset support |
| --- | --- | --- |
| Materials_Restitution | Simulated | Deterministic bounce-height and combine-policy regression tests; visual source comparison |
| Materials_Friction | Simulated | Validate sliding/sticking on the authored slope and box contact stability, not just successful import |
| Filtering | Static preview | Explicit legacy `geometry.mesh` compatibility; indexed mesh decoding; convex hull colliders; compound mass properties; per-collider filter validation |
| MotionProperties | Static preview | Legacy mesh profile; tapered capsule and cylinder/cone geometry; convex hulls; static and dynamic non-convex meshes; authored COM, negative gravity, and locked inertia integration tests |
| Branch | All 4 checks pass | Run the unmodified graph in automated asset tests, verify success events and original labels |
| Sequence | All 3 checks pass | Asset tests for authored lexicographic socket order, success events and original labels |
| Switch | All 12 checks pass | Asset tests for duplicates/default/extra sockets and original labels |
| Traffic Light | Authored selection and delayed material changes work | Reusable scene picking/selectability adapter, correct selection payloads, complete lifecycle and repeated-click tests |

The current test-gallery labels are replacements derived from authored node names.
Faithful rendering must account for the upstream SDF text materials, rather than
silently dropping their shader behavior. Traffic Light currently uses projected DOM
hit targets for its two authored buttons. Its graph is original, but that host input
bridge is example-specific. `selectNode` currently supplies placeholder ray/point and
controller/event values; these are unused by this asset and are not general support.

## A. Asset contract and compatibility (small: approximately 2–4 engineering days)

- Produce a reproducible capability manifest for every pinned GLB: extensions,
  operation declarations, collider kinds, pointer paths, source indices and expected
  outcomes. Keep network fetches in a separate explicit integration step; preserve
  source hashes and licensing if fixtures are checked in.
- Add an explicit sample-era physics profile for `geometry.mesh`. Normalize that
  field through a dedicated adapter; do not silently alias it to the newer
  `geometry.node`, whose index refers to a different glTF object collection.
- Resolve accessor data including indexed/nonindexed primitives, offsets, strides,
  sparse accessors and source transforms. Report unsupported modes precisely.
- Test current restitution/friction trajectories, all 19 interactivity assertions,
  custom success/failure events, and the full Traffic Light cycle including Reset.

Acceptance: every selector entry has a machine-readable supported/blocked status,
with blockers attributed to an exact source node/field. Existing runnable samples
remain unchanged. This tranche establishes a stable regression baseline.

## B. Convex mesh collision (large: approximately 2–3 engineering weeks)

- Introduce shared convex shape storage and explicit geometry ownership. Precompute
  hulls on the CPU at load time; keep simulation/contact solving on the GPU.
- Add convex support mapping, bounded GJK/EPA or an equivalent validated narrow
  phase, robust contact manifolds and persistent warm-started contacts. Preserve
  friction, restitution, filtering and existing sphere/box fast paths.
- Compute volume, center of mass and full inertia from closed hulls; transform and
  combine child colliders without replacing authored mass properties.
- Verify independent filter membership on compound children, including pairs that
  overlap geometrically but must not receive impulses.

Acceptance: Filtering simulates its original geometry with no proxy boxes or missing
children. Differential/reference tests cover separation, penetration, contacts,
compound inertia and named filter systems. Retain the bounded rigid-body budget;
this work does not imply a scalable arbitrary-convex engine.

## C. Remaining Motion Properties shapes (large: approximately 1–2 additional weeks)

- Support the actual tapered capsule (`radiusBottom != radiusTop`) and the cylinder
  with zero top radius, which is a cone. Equal-radius-only primitives are insufficient.
- Implement analytic support functions and mass properties, or explicitly validated
  convex tessellation with documented error bounds. Do not label coarse proxies as
  faithful support.
- Validate the shifted-COM wobbling toy, negative-gravity balloons, and zero inertia
  axes. Gravity factors, authored COM and zero mass/inertia already exist in the
  importer/backend; extend them only where the asset tests reveal a gap.

Acceptance: original tapered primitives import and respond correctly; balloons rise;
locked inertia axes remain locked; the COM offset produces the expected restoring
motion. MotionProperties remains a preview until its non-convex colliders also work.

## D. Non-convex collision and completion of Motion Properties (largest: 3–5+ weeks)

- Decode and build a static triangle-mesh acceleration structure for the ceiling;
  add convex/triangle candidate generation and stable edge/contact handling.
- Inspect the wheel mesh topology before choosing its dynamic representation.
  The asset explicitly requests `convexHull: false` with zero mass and finite inertia
  on one axis. A single convex hull loses any openings and changes its collision
  behavior. Use validated convex decomposition with compound inertia or a dedicated
  dynamic concave algorithm; retain source-to-piece provenance.
- Test moving angular-only non-convex bodies, mesh contact filtering, contact budgets,
  tunneling and sleeping. Add swept collision only where required by measured asset
  speeds; general CCD is a separate engine milestone.

Acceptance: the complete unmodified MotionProperties asset runs without excluded
colliders; the wheel rotates on its permitted axis while its center stays fixed;
ceiling and wheel contacts match a trusted reference within stated tolerances.
Shape complexity and decomposition quality make this the least certain estimate.

## E. Reusable interactivity host integration (medium: approximately 1 week)

Can proceed independently of B–D after A.

- Move node selection into a renderer host adapter. Resolve picked primitives to
  authored glTF node indices, honor `KHR_node_selectability`, populate actual world
  selection point/ray/controller values and arbitrate camera gestures.
- Centralize typed glTF pointer access for node transforms and material factors,
  including shared material instances and dirty-state propagation.
- Make tick/reset/dispose ownership explicit; test concurrent delayed sequences,
  cancellation, first-tick clock alignment, scene switching and background pauses.
- Keep the CPU behavior interpreter distinct from GPU command graph diagnostics.
  Add diagnostics for executed flows and pending delays without mislabeling them
  as GPU work.

Acceptance: Traffic Light works through both source buttons across camera views,
mouse/touch input and resets, without model-specific input overlays. No additional
operation families are required just to execute these four selected graphs.

## F. Rendering fidelity and release gate (medium: approximately 1 week)

- Audit embedded label materials and implement the upstream text/SDF rendering
  contract or a faithful renderer adapter, preserving glyph layout and atlas UVs.
  Retain accessible DOM instructions and make test results visibly read-only.
- Capture reference comparisons for all eight assets: textures, lights, camera,
  text and selection targets; exercise all panel controls and diagnostics tabs.
- Remove preview labels only after complete asset capability and behavioral tests
  pass. Run root build, tests, formatting, example builds and both website builds.
- Publish an asset coverage matrix and pinned draft compatibility notes. Full
  sample coverage must not be described as complete extension conformance.

## Recommended sequence

A → B enables Filtering. B → C → D completes MotionProperties. A → E → F closes
interactivity fidelity and input integration. F also gates the final physics gallery.
Keep each tranche as a separately reviewable PR with runnable examples and regression
evidence. A and E give the fastest visible improvements; B–D are substantial physics
engine work, rather than importer-only changes. General joints, triggers, deforming
meshes and all other repository samples are outside this eight-asset scope.

## math.gl audit and package boundary

Audited the installed `@math.gl/*` version `5.0.0-alpha.15` and the local math.gl
checkout (HEAD `e45fe31b`, with unrelated uncommitted work). No math.gl files were
changed. The installed declaration files confirm the shape API is already available;
this recommendation does not depend on assuming local work is published.

| Need | Existing math.gl support | Recommended ownership |
| --- | --- | --- |
| Tapered capsules and cylinders/cones | `@math.gl/culling` CapsuleShape and CylinderShape expose unequal radii, local support mapping, point containment/distance and ray intersection | Reuse CPU queries for picking/reference tests; implement matching WGSL support functions in gpu-physics |
| Primitive display/debug meshes | `@math.gl/geometry` includes tapered CapsuleGeometry and CylinderGeometry | Reuse for visualization; do not substitute their tessellation for exact collision implicitly |
| Bounds and transforms | AABB, OBB, spheres, affine transforms and eigen decomposition already exist | Reuse at import/debug boundaries; retain GPU-resident broad phase in gpu-physics |
| Mesh primitive traversal | `@math.gl/geometry-utils` provides attribute/primitive iterators | Reuse where compatible after loaders.gl resolves accessors; glTF buffer/accessor decoding remains loader/adapter responsibility |
| Convex hull construction | No general 3D hull builder found in the audited source/export surfaces | Good upstream candidate in geometry-utils, as a pure CPU preprocessing utility |
| Convex/mesh volume, COM and inertia | No corresponding general polyhedral mass integration API found | Candidate for geometry-utils after a concrete reusable API and numerical tests exist; body modes, mass locks and compound dynamics stay in gpu-physics |
| GJK/EPA, contact manifolds and constraints | No general contact engine found; culling explicitly excludes time-dependent simulation | Implement GPU kernels, persistent contacts and iterative solving in gpu-physics |
| Triangle BVH and convex decomposition | No general implementations found in audited packages | Begin with physics-owned typed storage and measured needs; consider a reusable CPU BVH builder later. Treat decomposition as a dedicated preprocessing dependency/project |

`ImplicitShape` does not currently expose support mapping in its common interface.
Concrete classes expose `supportLocal`, while the transformed `getSupportPoint` is
protected. A small upstream improvement would be a public, allocation-conscious
finite-convex support-query contract usable across boxes, spheres, capsules and
cylinders. Exclude infinite planes from that contract. Document that affine support
queries use the transposed linear transform for directions; normals and support
directions have different transformation rules. Existing point-distance methods are
conservative under nonuniform scale/shear and must not become exact contact-distance
oracles by accident.

Recommended split:

1. Keep shape conventions aligned with existing math.gl classes and test matching
   CPU/WGSL support points, including unequal radii, zero top radius, degenerate
   directions and permitted affine transforms.
2. Offer a narrowly scoped upstream support-query API and CPU hull builder. Consider
   polyhedral mass properties separately once required by real hull import. Do not
   block the GPU implementation on acceptance of these optional upstream changes.
3. Own GPU shape descriptors, buffer layout, hull upload, GPU candidate generation,
   GJK/EPA, manifold persistence, friction/restitution impulses, islands/sleeping and
   solver scheduling in gpu-physics. Keep all per-step collision and response there;
   no CPU math.gl collision loop or readback-driven fallback.
4. Keep glTF draft compatibility, node/material pointer bindings and behavior graph
   selection in the glTF integration layer. None belongs in math.gl.

This reduces tranche C's CPU geometry/picking work, but does not remove its GPU
narrow-phase or mass-property work. CPU preprocessing at load time is compatible
with the GPU physics direction; moving the simulation's hot path onto the CPU is not.
A CPU query implementation is useful as an independent correctness oracle, not the
runtime contact solver.

References: [math.gl culling scope](https://vis.gl/math.gl/docs/modules/culling),
[analytic glTF shapes](https://vis.gl/math.gl/docs/modules/culling/api-reference/shapes),
[geometry](https://vis.gl/math.gl/docs/modules/geometry). Estimates above should be
revisited after profiling hull complexity and inspecting the wheel topology.
