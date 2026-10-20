# Full support for the linked glTF samples

Scope: the four physics and four interactivity assets currently linked by the example
selectors. This is asset coverage, not full conformance to either draft extension.
The audit reads the actual pinned GLB JSON, rather than inferring requirements from
sample names. Implementation estimates below are planning estimates, not commitments.

Implementation update: inspecting Filtering's actual vertex buffers showed that both
legacy mesh hulls are exact unit boxes. It now simulates through an explicit legacy
mesh resolver and exact hull recognition. This completes that asset without general
convex collision. The follow-up now implements the Motion Properties geometry path:
analytic tapered primitives, float32 convex hulls, triangle BVHs, parallel GPU
triangle queries and bounded GJK/EPA. M1–M5 below record the original acceptance plan;
the implementation status and remaining generalization limits are summarized here.

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
| Filtering | GPU simulation: 9 bodies, 10 colliders | Exact box-hull recognition and explicit legacy mesh decoding preserve both compound child colliders and their independent filters; arbitrary convex hulls now use the extended backend |
| MotionProperties | GPU simulation: all 10 bodies/colliders | Implemented tapered primitives, convex hulls, original wheel/ceiling triangles, authored COM, negative gravity and inertia locks. General mesh/mesh contacts, CCD and unbounded query capacity remain out of scope |
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

Acceptance: non-box convex meshes simulate faithfully, while Filtering continues to
simulate its original exact box hulls without missing children.
Differential/reference tests cover separation, penetration, contacts,
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

A validates the now-enabled Filtering sample. B → C → D completes MotionProperties. A → E → F closes
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

## Motion Properties: focused implementation plan

The final gallery sample is achievable, but unlike Filtering it cannot be completed
through exact box recognition. Audit of the pinned GLB's decoded geometry:

| Part | Authored geometry | Existing dynamics |
| --- | --- | --- |
| Wobbling toy | Tapered capsule: radii 0.389 and 0.25, height 0.5498 | Authored COM offset approximately -0.35 on Y |
| Cone | Tapered cylinder with zero top radius | Static collider |
| Four balloons | Convex hulls; each render mesh has 592 unique positions and 1,152 triangles | Gravity factor -0.5 |
| Ceiling | Non-convex mesh, 20 triangles | Static collider |
| Wheel | Non-convex mesh, 12,288 vertices and 24,576 triangles | Zero mass, inertia diagonal [0, 1, 0], zero gravity |
| Infinite-inertia box | Convex mesh, 6,146 unique positions and 12,288 triangles | Finite mass, all rotational response locked |

Counts describe the source meshes, not precomputed convex hull complexity. Do not
assume the balloons are spheres or the rounded box is an exact box. They do not
qualify for Filtering's exact eight-corner path.

### M1. Geometry contract and wheel feasibility

- Add decoded convex-hull and indexed-triangle descriptors with source provenance,
  explicit ownership and bounded shape buffers. Keep body state in the existing
  GPU structure-of-arrays layout and fixed-step graph.
- Decode the legacy sample profile without confusing mesh indices with node indices.
  Reuse loader accessor handling, then preprocess shapes once at load time.
- Prototype convex-versus-wheel contacts early. Prefer a reusable local-space
  triangle BVH for original non-convex geometry; rigid motion can transform queries
  without rebuilding the wheel topology every frame.
- Establish the required contact pair matrix, contact/triangle budgets and performance
  targets. Assess whether the authored scene actually needs mesh-versus-mesh contact.
  Do not promise general dynamic concave collision based on convex-versus-mesh alone.
- Convex decomposition is an alternative only with an explicit approximation contract,
  geometric error checks and collider-budget checks; filling the wheel's openings with
  one convex hull is not an acceptable substitute.

Exit: a measured wheel contact prototype and a precise supported pair matrix before
committing to the whole implementation. This is the main feasibility/risk gate.

### M2. Tapered primitives and mass properties

- Implement WGSL support queries for tapered capsules and cylinders/cones, matching
  math.gl's existing CPU conventions. Add analytic volume, COM and inertia, including
  unequal radii and the cone limit; retain the toy's authored COM override.
- Add GPU narrow-phase/manifold support for the primitive pairs needed by the sample.
  Reuse the convex path developed alongside M3 where appropriate.
- Compare CPU and GPU support points and verify the toy's restoring motion against
  an independent reference. No CPU collision loop or pose-readback dependency.

Exit: the toy wobbles and settles around its shifted COM, and the cone collides with
supported bodies using its actual geometry.

### M3. Convex meshes and stable contacts

- Construct convex hull topology at load time, upload vertices/faces/adjacency, and
  compute polyhedral mass properties. Reuse equivalent geometry where verified.
- Implement bounded GPU convex narrow phase, penetration/contact generation and
  persistent manifolds with friction/restitution. Preserve primitive fast paths.
- Benchmark support searches on the rounded box's real hull; source mesh complexity
  makes a naive full vertex scan per solver query a potential bottleneck.
- Validate rising balloons, ceiling approaches and locked box rotation. GPU contacts
  must preserve authored zero inverse-inertia axes and negative gravity factors.

Exit: all convex bodies behave correctly and stay within measured timestep budgets.

### M4. Non-convex mesh contacts

- Complete GPU BVH traversal and triangle contact generation for the ceiling and
  wheel, with robust face/edge contacts and duplicate-contact reduction.
- Apply wheel contact impulses through its finite rotational inertia while keeping
  translation and the other rotation axes locked. Retain the existing impulse solver.
- Address required mesh-versus-mesh pairs only after the M1 audit; otherwise keep
  these combinations explicitly unsupported outside this bounded sample profile.
- Exercise fast impacts, resting contacts and contact-buffer overflow reporting.

Exit: the original ceiling and wheel participate in simulation without omitted
geometry, silent hull replacement or CPU collision fallback.

### M5. Full-asset acceptance and gallery integration

- Run the unmodified pinned asset with all 10 physics bodies/colliders supported.
- Verify upward balloons, COM-driven wobbling, the wheel's one permitted rotation
  axis, the box's locked orientation, and actual ceiling/cone contacts.
- Add deterministic GPU regressions and an independent reference comparison with
  stated tolerances; exercise Reset, Pause, selection changes and graph diagnostics.
- Remove the preview label only when the entire asset is supported. Keep any partial
  development scenes separate and clearly labelled.
- Require build, formatting, node/headless tests, example/website builds and green CI.

Recommended implementation order: M1 first; M2 and M3 share the convex-contact
foundation; M4 follows the wheel prototype; M5 is the release gate. CPU support-query,
convex-hull and geometric mass-property utilities are candidates for math.gl reuse
or upstreaming. GPU collision, BVH traversal, contact state and solving remain in
luma.gl's gpu-physics module. This is several substantial engine PRs, with the wheel
prototype determining the final scope and estimate.


### M1–M5 implementation outcome

- The wheel preserves all 24,576 authored triangles; no hole-filling convex replacement.
  The ceiling retains its 20 triangles. Conservative fixed-center rotational bounds
  prove that this pair cannot meet, so no mesh/mesh response is needed by the asset.
- Hull construction uses filtered exact float32 orientation signs near coplanarity.
  Meshes retain explicit BVH, closed-surface and unit-density mass metadata.
- Tapered capsules and cylinders/cones use analytic support and integrated volume,
  COM and inertia. Compound bodies rotate full tensors and apply parallel-axis shifts.
- Existing sphere/box SAT remains the fast path. Other convex pairs use bounded
  GJK/EPA; convex/mesh candidates run in a parallel, indirect GPU operation and merge
  into four-contact persistent manifolds. Diagnostic readback exposes query limits.
- Controlled Apple Metal run: 360 fixed steps, all ten bodies finite, balloons reached
  the ceiling, wheel translation stayed fixed with unlocked-axis rotation, and the
  rounded box retained its orientation. Sampled diagnostics showed zero dropped or
  unresolved queries. This behavioral check is not a real-time throughput guarantee.
- CPU and WebGPU regression tests cover hull topology/mass, near-coplanar hulls,
  tapered primitives, original mesh openings, inertia locks and backend capability
  rejection. Full draft conformance, arbitrary dynamic mesh pairs, CCD, general
  mesh quality repair and scalable rigid-body broad phase remain follow-ups.

- Performance regression fixed: world-space conservative bounds reject the separated
  rotating wheel/ground pair before the floor's mesh-local AABB can cover the wheel
  BVH. In the same 360-step harness, sampled triangle work fell from 24,588 to 686
  and elapsed time fell from 8.68 s to 1.80 s (including readbacks and rendering).
  The example also permits only one unpublished simulation submission, preventing
  slow hardware from accumulating seconds of queued physics work.
