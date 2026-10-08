# GPU Project implementation roadmap

This maintainer roadmap tracks the development of `@luma.gl/experimental/gpu-project` from its
current composable 2D native/adaptive programs into a broader, precision-tiered CRS transformation system
for GPU command graphs. Numbering expresses dependency order, not a release or staffing
commitment.

## Goal

Make GPU reprojection a reusable compute primitive rather than a renderer-specific shader:

- accept CRS definitions and projection providers supported by math.gl 5;
- preserve more than Float32 precision through projection, not only while transporting input;
- specialize common transformations into efficient static WGSL;
- retain an adaptive approximation backend for the long tail of smooth transformations;
- expose the same compiled transformation as an inline shader function and a materializing GPU
  graph contributor;
- publish explicit domains, error estimates, validity, resource ownership, and precision.

The goal is broad practical coverage and measurable GPU advantage. It is not immediate parity with
the complete PROJ operation database, grid catalog, operation-selection engine, or IEEE-754
binary64 semantics.

## Current foundation

Reconciled against `master` at `f87695a430` on 2026-10-08.
The dependency upgrade in [#3400](https://github.com/visgl/luma.gl/pull/3400) locks
`@math.gl/crs` and `@math.gl/projection` to `5.0.0-alpha.13`. This assessment uses installed
package sources and documentation at their published math.gl revision
`4c52326098194bd1b290a72a512a328d10565bfd`, not unreleased upstream changes.

P.0 through P.4c are implemented,
including [native TM/UTM (#3275)](https://github.com/visgl/luma.gl/pull/3275) and
[explicit normalization and comparative benchmarks (#3277)](https://github.com/visgl/luma.gl/pull/3277).
P.3c landed in [#3280](https://github.com/visgl/luma.gl/pull/3280) with verified adaptive conic
coverage, not native formulas. P.8a's local sweeps and matched CPU comparison landed in
[#3283](https://github.com/visgl/luma.gl/pull/3283); cross-vendor and real-consumer evidence
remain outstanding. P.9a.1 landed in [#3399](https://github.com/visgl/luma.gl/pull/3399):
`planProjection()` accepts caller-prepared eager or explicitly preloaded synchronous providers.
P.9a.2, P.3d.1, P.3d.2 and the local P.8a.1 rebaseline landed in
[#3401](https://github.com/visgl/luma.gl/pull/3401). This change implements P.9a.3:
`ProjectionTableTransform` executes batch-atomic CPU projection or creates a `GPUProjectionTable`
that borrows source batches and materializes derived positions/validity in a caller-owned graph.
The next interoperability tranche is P.9a.4 (inline rendering/deck adapter), followed by real-consumer
and cross-vendor measurements in P.8a.2. Neither requires a new native projection formula.

The implemented module samples an arbitrary CPU projection provider, recursively compiles local
polynomial patches, and evaluates them over chunk-preserving GPU vectors. Inputs may be
`float32x2` or raw binary64 `uint32x4`. The default `local-f32` mode emits `float32x2` positions
relative to a shared binary64 destination origin. The `double-single` mode evaluates normalization
and the fitted polynomial with the fp64 arithmetic shader module, then emits absolute `float32x4`
high/low coordinate limbs. Both modes can publish a separate caller-owned validity column.

The operation program now composes axis, unit, affine, adaptive, native Web Mercator, bounded native
TM/UTM, and explicit longitude-wrap stages. It accepts Float32, double-single, or raw binary64
inputs and exposes both inline WGSL and graph materialization. Native projection formulas use
explicitly selected Float32 arithmetic; the CRS planner defaults to double-single adaptive fitting.
Longitude wrapping invalidates its declared seam guard and cannot be automatically inverted.
Dimensions remain strictly 2D: neither ECEF/height nor datum/grid/epoch transformations are implemented.

The repository already contains the portable building blocks for the next precision tier:
integer-controlled double-single add, subtract, multiply, divide, square root, comparison, and raw
binary64-to-double-single subtraction. Double-single provides up to approximately 48 significant
bits while values remain in the normal Float32 exponent range. It is not native or software
IEEE-754 binary64.

## math.gl alpha.13 alignment assessment

| Available upstream | GPU Project alignment in this change | Remaining boundary |
| --- | --- | --- |
| Type-only `ProjectionEngine` factory and structural `ProjectionInstance`; eager, selective and lazy engines | `prepareCRSProjection()` / `prepareCRSProjectionAsync()` retain the CPU instance and fit its authoritative transform | P.9a.2 implemented; no hidden loading, native substitution or GPU readback masquerading as a CPU method |
| Public `normalizeCRS()` and `NormalizedCRS` from `/core`, with optional readers and per-engine configuration | Provider preparation validates public semantics; verified obsolete conic/Pseudo Mercator guards removed | P.3d.1 implemented; retain identifier conflict checks, raw dimensions and native bounded oracles |
| `CRSReference`/`SpatialReference`, stored coordinate order, strict/horizontal modes and `lossy` metadata | Wrappers accepted with stored-axis/unit validation, immutable provenance and explicit rejection rules | P.3d.2 implemented; metadata wrappers use adaptive planning, not new native optimization |
| Reusable scalar outputs, flat transforms and `ProjectionBuffer` | Allocating/reusable scalar, flat, contiguous/strided/column bulk baselines with matched consumers and validity | P.8a.1 local rebaseline implemented; cross-vendor and production consumers remain P.8a.2 |
| Optional `OperationCatalog`, `ProjectionAnalysis`, CPU pipelines and grid/epoch facilities | These do not supply GPU operation lowering, GPU grids, 3D storage or certified approximation bounds | Reuse metadata/reference implementations where appropriate; retain explicit P.7 and domain work |

The [engine contract](https://github.com/visgl/math.gl/blob/4c52326098194bd1b290a72a512a328d10565bfd/docs/modules/projection/api-reference/projection-engine.md)
separates a reusable factory from each transform. A lazy `createProjection()` does not load
algorithms; await `createProjectionAsync()` or explicitly preload before sampling. Never use
promise-returning scalar methods in the fitter. Optional engine types/runtime adapters belong
above the dependency-free prepared-provider boundary.

Limits confirmed in alpha.13:

- The CPU implementation is math.gl's TypeScript engine, not a proj4js runtime wrapper. Upgrading
  the CPU package does not change GPU arithmetic.
- The engine interface exposes no normalization/description hook or registry. Default
  `normalizeCRS()` cannot describe an arbitrary engine's aliases, readers or plugins. Treat its
  transform as opaque unless a matching, explicitly supported semantic configuration is supplied;
  never replace a custom transform with guessed native formulas.
- The PROJJSON reader still resolves conversion methods/parameters by names. Direct identifier-only
  Lambert definitions with empty names are rejected. Keep our EPSG identifier, localized-label
  and conflict checks: an unnamed CRS is not an unknown conversion method.
- The new Lambert kernel preserves explicit zero standard parallels. The obsolete rejection,
  tangent-parallel injection, Albers swapping and Pseudo Mercator provider rejection have been
  removed with regression coverage. This expands adaptive coverage, not native LCC/Albers kernels.
- `SpatialReference.coordinateOrder` describes stored coordinates independently of `enforceAxis`.
  Unknown/absent references must not become WGS84. Reject unsupported vertical/epoch semantics and
  `lossy` extraction. Retain raw dimensionality checks: normalized metadata or a two-value callback
  alone cannot establish a 2D contract.
- [ProjectionBuffer](https://github.com/visgl/math.gl/blob/4c52326098194bd1b290a72a512a328d10565bfd/docs/modules/projection/api-reference/projection-buffer.md)
  is CPU storage, not a GPU vector ABI. Coordinate failures commit preceding records and preserve
  the failing/following records; that is not our zero-output/per-row-validity contract.
- [OperationCatalog](https://github.com/visgl/math.gl/blob/4c52326098194bd1b290a72a512a328d10565bfd/docs/modules/projection/api-reference/operation-catalog.md)
  selects application-supplied metadata/payloads; it does not discover EPSG operations or load
  resources. Its geographic area and `accuracyMeters` are separate from adaptive input bounds and
  fitting tolerance. Preserve selected-operation provenance when used.
- [ProjectionAnalysis](https://github.com/visgl/math.gl/blob/4c52326098194bd1b290a72a512a328d10565bfd/docs/modules/projection/api-reference/projection-analysis.md)
  describes one projection in radians, not a complete CRS transform. Derivative samples may inform
  experiments, but cannot certify patch errors or resolve discontinuities.

Verification includes factory lifecycle/retry, retained CPU identity, opaque custom transforms,
metadata rejection before loading, authoritative/stored axes, units, zero-parallel conic
forward/inverse evaluation, CPU bulk failure handling and inline/materialized hardware execution.
Historical alpha.5 measurements remain unchanged; new captures identify alpha.13 explicitly.

## Reference designs

Three systems inform the design, but none should be copied as the complete architecture.

- [RAPIDS cuProj](https://github.com/rapidsai/cuspatial/tree/branch-25.04/cpp/cuproj) demonstrates
  a small ordered pipeline of invertible operations, CPU-precomputed projection parameters, and a
  device-callable transform that can be embedded in another kernel. Its released scope is only
  WGS84 to and from UTM, so its strongest lesson is the execution model rather than CRS breadth.
- [glsl-proj4](https://github.com/glslify/glsl-proj4) demonstrates statically composed shader
  functions with CPU-derived constants. Its six Float32 GLSL projection families are useful scope
  input, but it is not a complete CRS pipeline and its formulas, validation, and WebGL assumptions
  should not become the implementation baseline.
- [PROJ operations](https://proj.org/en/stable/operations/index.html) remain the semantic and
  numerical reference. New native operations should be independently implemented from current
  published formulas or suitably licensed sources, with provenance recorded per operation.

## Architecture

### CRS frontend and operation program

The CPU planner should compile supported CRS definitions into a provider-independent
`ProjectionProgram`. The program is an ordered list of typed operations with explicit invertibility,
parameters, source and destination dimensions, domains, precision requirements, and validity
behavior. Likely initial operations are axis mapping, unit conversion, angular normalization,
prime-meridian offset, affine offset/scale, ellipsoid conversion, and named map projections.

math.gl 5 supplies CRS types, syntax preservation, spatial-reference metadata, public semantic
normalization and a TypeScript CPU projection engine. Lower supported explicit metadata and PROJ
pipeline syntax without depending on private engine state or inferring operations from authority
labels. Supported, bounded 2D transforms that cannot be lowered may use adaptive fitting.
Unsupported dimensions, datum/resource/epoch semantics and unresolved definitions must be
declined; provider availability alone does not authorize fallback.

### Execution strategies

One program may select or combine three execution strategies:

1. **Native analytic WGSL** for common operations and projections. The compiler emits static
   function calls and constants rather than a per-coordinate operation switch.
2. **Adaptive polynomial WGSL** for smooth transformations supplied only as a CPU oracle. This is
   the coverage backend and can run in Float32 or double-single precision.
3. **Explicit caller-selected CPU fallback** when GPU planning declines and a fully prepared CPU
   operation can meet the request. Missing required grids or epochs are failures on either path,
   not permission to approximate. No automatic CPU fallback or GPU readback is implemented.

Compatible stages should eventually fuse into one compute pass or into the consumer's own shader.
Parameters live in stable buffers so changing an origin, epoch, or projection parameter does not
require rebuilding an otherwise compatible graph.

### Dual consumption model

The compiled program supports both:

- an inline WGSL function/module callable from rendering or analysis shaders, following the useful
  composability of cuProj's device projection and stack.gl's GLSL modules; and
- a graph contributor that materializes transformed columns while preserving chunks, explicit
  ownership, and caller-controlled submission.

This avoids forcing every consumer to pay for an intermediate buffer while retaining a reusable
table-oriented transformation.

### Precision and output contract

Precision is part of the public program contract, not an implementation detail.

| Mode | Input | Arithmetic | Output | Intended use |
| --- | --- | --- | --- | --- |
| `local-f32` | `float32x2` or raw binary64 `uint32x4` | Float32 after exact/local input translation | `float32x2` plus binary64 destination origin | Rendering and tolerant analysis |
| `double-single` | raw binary64 `uint32x4` or normalized double-single | Integer-controlled double-single where precision matters | `float32x4` as `[xHigh, xLow, yHigh, yLow]` | Reprojection chaining and precise analysis |
| `native-f64` | backend-defined | Native Float64 | backend-defined | Future capability-gated non-portable backend |

The double-single adaptive evaluator fits coefficients in CPU binary64, splits origins and
coefficients into high/low Float32 limbs, evaluates normalized coordinates and polynomials using
double-single arithmetic, and emits absolute double-single coordinates. This extends precision
through the projection result without first requiring a portable high-precision transcendental
library. The error oracle simulates the selected GPU arithmetic and reports error in destination
units.

Every compiled program publishes a separate validity result. A valid `[0, 0]` is distinguishable
from a non-finite input, out-of-domain row, or invalid patch assignment. Unsupported operations
are declined during planning/compilation, not emitted as plausible-looking coordinates.

## Tranche map

A tranche lands only when its dependency is present and its measurable exit can be produced.
Conditional tranches require consumer or benchmark evidence before their larger complexity is
accepted.

**Optimization only** means improving already supported work, not a prerequisite for coverage or
API interchangeability. Evidence, interoperability and new semantic coverage are separate categories.

| Tranche | Outcome | Entry dependency | Measurable exit | Status | Cost |
| --- | --- | --- | --- | --- | :---: |
| P.0 — Adaptive graph baseline | Provider-driven local polynomial plans, Float32 and raw binary64 input, chunk preservation, explicit graph contribution, and correctness-gated benchmarks | GPU command graph and FP64 helpers | Existing node and WebGPU tests cover plan compilation, both input encodings, patch assignment, ownership, and benchmark correctness | Implemented | Complete |
| P.1 — Precision and validity ABI | Add double-single `float32x4` result mode, split plan origins and coefficients, double-single polynomial evaluation, and explicit row validity | P.0 and integer-controlled FP64 arithmetic | Adversarial large-origin tests demonstrate more than 24 significant bits through the result; CPU-oracle error stays within the declared destination-unit tolerance; valid zero and invalid rows are distinguishable | Implemented | Complete |
| P.2a — Projection program and shader interface | Typed 2D axis, unit, affine, and adaptive operation IR; static WGSL composition; stable parameter blocks; one compiled object consumable inline or as a graph contributor | P.1 precision/failure contracts | Forward/inverse operation tests pass; graph and inline paths agree bit-for-bit; shader output contains no per-row dynamic operation dispatch; updates do not cause hidden submit/readback | Implemented | Complete |
| P.2b — Program numerical metadata | Immutable 2D dimension/domain, input encoding, arithmetic/output precision, validity, and inversion metadata; native propagation of sampled adaptive errors and explicit unknown composition | P.2a and P.3 frontend requirements | Metadata snapshots remain independent of mutable plans; native scales amplify sampled estimates; repeated adaptive stages report unknown error; no sampled tolerance is presented as a guarantee | Implemented | Complete |
| P.3a — math.gl planner entry point | Optional CPU adapter for signed 2D axis/unit/diagonal-affine PROJ pipelines and bounded CRS-provider fallback, with explicit inverse domains and structured decline reasons | P.2b and public math.gl 5 CRS APIs | Real PROJJSON/UTM oracle and hardware tests pass; unsupported semantics are declined; math.gl/proj4 remain outside the execution bundle | Implemented | Complete |
| P.3b.1 — Native CRS coordinate frames | Normalize explicit PROJJSON axes, units, ellipsoid, prime meridian, and TM/Pseudo Mercator natural-origin parameters; cancel equivalent conversions while retaining datum boundaries | P.3a and existing axis/affine IR | Geographic frame changes and equivalent projected conversions need no sampling; all 60 UTM zones/both hemispheres match the CPU oracle for frame changes; native GPU inverse preserves sub-Float32 detail | Implemented | Complete |
| P.3b.2 — Native projection conversion lowering | Lower geographic/projected and different projected conversions into native named projection operations; extend explicit PROJ pipelines and retain adaptive fallback | P.3b.1 normalization and P.4 native projection families | Web Mercator and TM/UTM pairs and pipelines lower with explicit arithmetic selection; the default uses double-single fitting of the normalized binary64 reference | Implemented | Complete |
| P.3c — Verified adaptive PROJJSON coverage | Normalize Lambert 1SP/2SP and Albers method/parameter identifiers or canonical names into the CPU provider; retain custom/unregistered CRS labels and optional throwing diagnostics | P.3a adaptive frontend | Forward/inverse CPU and GPU fixtures agree with independently serialized definitions; unnamed/localized labels, units, axes, invalid definitions, and precision contracts are covered without native Float32 formulas | Implemented | Complete |
| P.3d.1 — Public CRS semantics and compatibility cleanup | Alignment/coverage: validate public normalized semantics before bounded 2D fitting; remove verified obsolete provider guards | alpha.13 plus existing identifier normalization and native safety checks | Regressions cover zero-parallel conics, 1SP defaults, Pseudo Mercator, axes/units, unnamed/localized identifiers and conflicts; preserve dimension/datum/resource declines and matching normalizer configuration | Implemented (this PR) | Complete |
| P.3d.2 — Spatial-reference metadata boundary | Interoperability: accept CRSReference/SpatialReference without losing stored order, units, provenance or unsupported dimensions | P.3d.1 and explicit engine preparation | CPU/GPU agree for stored vs authoritative axes; reject unknown/absent, unit mismatches, unsupported vertical/epoch and lossy inputs; separate provenance from GPU numerical error | Implemented (this PR) | Complete |
| P.4a — Native Web Mercator | Add independently implemented forward/inverse WGSL formulas with explicit Float32 arithmetic, square-world domain/validity, stable parameters, and native CRS/pipeline selection | P.2 and P.3b.1 | CPU oracle and hardware tests cover hemispheres, edges, invalid inputs, inline/graph agreement, all input encodings, and preservation of default sub-Float32 adaptive accuracy | Implemented | Complete |
| P.4b.1 — Bounded native Transverse Mercator/UTM | Add sixth-order Transverse Mercator/UTM forward and inverse with CRS/pipeline lowering, bounded local-branch validity, and inverse footprint checks | P.4a arithmetic/validity conventions | All 60 WGS84 UTM zones and both hemispheres/directions have CPU-oracle and hardware coverage; all input encodings share inline/graph behavior; no implicit downgrade of double-single requests | Implemented | Complete |
| P.4b.2 — Explicit angular normalization | Add a named double-single range-reduction operation with declared interval, invalid seam guards and no automatic many-to-one inverse; enable explicit antimeridian-crossing plans | P.4b.1 local-branch contract | CPU and all-input-format hardware seam/branch tests pass; explicit wrapping composes before smooth native/adaptive UTM plans; no implicit wrapping changes existing plans | Implemented | Complete |
| P.4c — Analytic/adaptive comparison | Compare named native Float32/adaptive double-single programs and an identical inline/materialized consumer against an independent oracle | P.4a/P.4b | Report independent accuracy, parameter/intermediate buffer memory, planning/compilation, first use and synchronized execution on representative hardware; keep output precision fixed and fail invalid results before timing | Implemented | Complete |
| P.5a.1 — Native Lambert Conformal Conic | **Optimization only**: bounded direct LCC formulas where they improve on adaptive coverage | P.3c/P.3d.1, P.4 conventions and refreshed P.8a evidence | Measure planning, memory or execution wins at stated accuracy budgets; retain independent oracle/GPU domain and precision tests | Conditional | Medium |
| P.5a.2 — Native Albers Equal Area | **Optimization only**: bounded direct Albers formulas where they improve on adaptive coverage | P.3c/P.3d.1, P.4 conventions and refreshed P.8a evidence | Parameter variants, equal-area properties and inverse domains pass oracle/GPU tests; measured benefits never silently downgrade precision | Conditional | Medium |
| P.5b — Visualization projection qualification | Coverage/integration: qualify gnomonic/orthographic clipping and inverse domains; native kernels are optional | Prepared providers and two requesting consumers; no dependency on native conic kernels | Demonstrate bounded adaptive coverage or identify a specific gap; justify any direct WGSL kernel separately | Conditional | Medium |
| P.6 — Analytic high-precision math | **Optimization only**: double-single transcendental functions needed by demonstrated analytic wins | Refreshed P.8a evidence of material adaptive cost at equal accuracy | Beat adaptive double-single in throughput or memory at matching error budgets on representative devices, with validated domains; otherwise defer | Conditional | Very large |
| P.7a.1 — 3D contract and ECEF | Extend dimensions, encodings, metadata, inline/graph interfaces, and validity to height-preserving cartographic/geocentric conversion | P.2/P.3 contracts and an explicit 3D precision design | Ellipsoid/axis/unit, pole, near-origin, invalid-height, and round-trip fixtures match a PROJ oracle; all three components retain the declared precision without silently dropping height | Planned | Large |
| P.7a.2 — Static Helmert pipelines | Compose explicit static datum transformations with 3D conversions | P.7a.1 | Translation, rotation convention, scale, forward/inverse, and datum fixtures match PROJ; unsupported operation selection is declined | Planned | Medium |
| P.7b — Grid and epoch resources | Add texture-backed horizontal/vertical grids, bounded residency, coordinate epoch, and time-dependent operations | P.7a.2 plus consumers supplying licensed grid and epoch data | Missing resources fail explicitly; interpolation and temporal fixtures match PROJ; resource ownership and cache bounds are documented and tested | Conditional | Very large |
| P.8a — Representative performance evidence | Evidence umbrella: landed local sweeps plus refreshed CPU, routing, cross-vendor and consumer measurements | P.4c; P.9a for real workloads | Accuracy-gated reports distinguish equal-budget comparisons from accuracy/speed trade-offs | Partial on master; remaining work split below | Medium |
| P.8a.1 — alpha.13 CPU/GPU rebaseline | Evidence: scalar, reusable-output, contiguous flat and strided/column CPU APIs against inline/materialized GPU paths | Upgraded math.gl and existing harness; no new kernels required | Separate preparation, fitting/compile, first-use, allocation, upload/readback and resident execution; match domains, validity, accuracy and consumer work; record version/API/layout | Implemented (this PR) | Complete |
| P.8a.2 — Consumer, routing and cross-vendor evidence | Evidence: isolate patch-routing cost; add real workloads and other GPU vendors | P.8a.1; P.9a.3/P.9a.4 for consumers | Publish reproducible row/patch/reuse sweeps and precision budgets without extrapolating one device to all devices | Planned | Medium |
| P.8b.1 — Indexed patch routing | **Optimization only**: replace scanning where measured routing cost warrants it | P.8a.2 routing evidence | Indexed/scan paths agree at boundaries and invalid seams; include routing storage/build costs and measured benefit | Evidence-gated | Medium–large |
| P.8b.2 — Discontinuous-domain partitioning | Coverage: explicitly partition seams, clipping regions and disconnected valid domains | Existing seam validity plus demonstrated consumer domains | Preserve rejected seams and branch-specific inverse domains; derivatives and geographic catalog rectangles are not validity proofs | Conditional | Large |
| P.8c — Consumer fusion and cost selection | **Optimization only**: choose existing inline/materialized paths from measured costs | P.8a.2 and P.9a consumers; P.8b.1 only for indexed candidates | Thresholds cover row/patch count, reuse, memory and capabilities; preserve precision, validity and caller-controlled submission | Evidence-gated | Medium |
| P.9a.1 — Provider preparation boundary | Caller-prepared synchronous transforms without an engine-catalogue import | Adaptive compiler and program contracts | Eager/preloaded providers share double-single, inverse-domain and failure contracts; bundle/no-implicit-loading tests pass | Landed in #3399; alpha.13 migration in #3400 | Complete |
| P.9a.2 — Engine factory integration | Interoperability: upstream ProjectionEngine/ProjectionInstance types in an optional preparation adapter with explicit sync/async lifecycle | P.9a.1 and alpha.13, both landed | Default/selective/custom/lazy engines use the same prepared-provider path; test no implicit loading, retry, ownership and CPU reference retention; never bypass custom transforms via native lowering | Implemented (this PR) | Complete |
| P.9a.3 — Chunk-preserving CPU/GPU table consumer | Interoperability: ProjectionTableTransform and GPUProjectionTable expose explicit CPU/GPU execution | P.9a.2 and P.3d.2 for metadata inputs | Preserved/empty batches, offsets, source identity, explicit masks, batch-atomic CPU failures, borrowed inputs, caller submission and explicit output encodings; UTM CPU/hardware regressions | Implemented (this PR) | Complete |
| P.9a.4 — Inline rendering/deck adapter | Interoperability: CPU transform for picking and the same planned transform in a real render/analysis consumer | P.9a.2; P.3d.2 for coordinate metadata | Specify projected/common-space conversion, origins/units, altitude policy, validity, attributes and invalidation; compare CPU/materialized/inline results and buffer lifecycle | Planned | Medium–large |
| P.9a — Production-shaped consumers | Tracking umbrella for P.9a.1–P.9a.4, not another implementation tranche | Existing program contracts and explicit adapters | One preserved-batch table consumer and one inline consumer share a transform contract and supply P.8a workloads | Partial: provider and table boundaries implemented; inline consumer remains | — |
| P.9b — Package graduation | Freeze proven APIs and move stable execution pieces across reviewed package boundaries | P.9a and demonstrated ownership/API stability; P.8 optimizations only if justified | Build/test gates pass, migration is documented, and the execution core has no math.gl, proj4js, or Arrow dependency | Planned | Medium |

## Recommended execution order

P.4c's [recorded hardware baseline](../benchmarks/gpu-project-programs.md) includes forward/inverse
accuracy, parameter and intermediate memory, planning/compilation, and synchronized execution.
It is a one-device, one-patch baseline; it does not establish a cross-device speedup or justify
changing the default precision. The [P.8a local sweeps](../benchmarks/gpu-project-performance-sweeps.md)
add 1–256 patches, row-count and consumer-reuse comparisons at an equal double-single error budget.
Other vendors, isolated routing costs and real consumers remain evidence requirements for P.6/P.8.

Historical CPU reports identify math.gl alpha.5/proj4 2.21.0. Those results and their version labels
are preserved. The [2026-10-08 rebaseline](../benchmarks/gpu-project-performance-sweeps.md)
compares six alpha.13 CPU API/layouts: flat CPU is fastest in the measured 65K-row cases and
materialized Albers is nearly tied with GPU. Comparing a fit with
the same CPU engine validates approximation, not independent algorithm correctness; use
independently generated PROJ fixtures for semantic/numerical qualification.

1. **Landed together in #3401: P.9a.2, P.3d.1, P.3d.2 and P.8a.1.** Explicit factory preparation,
   retained CPU transforms, public semantic validation, metadata ingestion and CPU/GPU rebaseline
   form the alignment foundation. `planProjection()` stays synchronous and math.gl-independent.
   GPU materialization is not a synchronous CPU `ProjectionInstance`. No native-kernel or
   3D/datum/grid coverage is implied. Bulk failures remain different from GPU row validity;
   benchmark adapters explicitly compact validated rows and propagate coordinate exceptions.
2. **P.9a.3 implemented; next P.9a.4, then complete P.8a.2 using those consumers.** The table
   consumer preserves batches and uses explicit CPU/GPU selection without hidden uploads/readbacks.
   CPU exceptions abort the current batch rather than exposing a bulk API's partially committed prefix;
   masked/nonfinite/out-of-domain rows use the GPU-compatible validity contract. Add the inline workload.
   The deck adapter must distinguish CRS projected coordinates from deck common space and give
   altitude an explicit reject/pass-through/transform policy; it cannot imply 3D reprojection.
   No upstream deck API change is assumed necessary until an adapter demonstrates a concrete gap.
   Axis-swap fixtures alone are not production consumers.
3. **Only then choose optimization-only work:** P.5a.1/P.5a.2, P.8b.1, P.8c or P.6, supported by
   refreshed equal-budget evidence. Native conic formulas are not prerequisites for conic coverage.
   Degree/patch-count sweeps do not isolate routing cost, and Float32 timings at looser accuracy
   cannot justify replacing double-single fitting. P.8b.2 is separate coverage work: explicit
   wrapping does not already partition discontinuous domains.
4. **Independent expansion: P.7a.1, P.7a.2, then conditional P.7b.** CPU ECEF, Helmert, grids and
   temporal pipelines are reference/preparation tools, not implemented GPU capabilities. Validate
   greater-than-Float32 arithmetic in all three components; high/low storage around Float32
   formulas is insufficient. Reuse upstream operation selection/resource identities when needed,
   without confusing geodetic accuracy with numerical tolerance. Keep P.5b demand-driven and
   graduate stable APIs through P.9b without waiting for every speculative feature.

Across every tranche, unsupported semantics must be declined rather than approximated silently.
Native Float32 selection remains explicit; default high-precision CRS programs retain double-single
adaptive fitting, sampled errors remain estimates rather than guarantees, and many-to-one wrapping
does not acquire an automatic inverse.

## Package boundaries

- `@luma.gl/shadertools` owns reusable arithmetic and, after API review, generally useful WGSL
  operation modules.
- `@luma.gl/gpgpu` owns primitive GPU data formats and the graph-safe execution machinery after
  graduation.
- `@luma.gl/experimental/gpu-project` owns the evolving program, planners, adaptive compiler,
  projection catalog, and optional math.gl adapters.
- `@math.gl/crs` and `@math.gl/projection` remain optional CPU-side definition/resolution/oracle
  dependencies. They do not enter the low-level GPU execution package.
- Arrow upload, conversion, and readback remain in `@luma.gl/arrow`.
