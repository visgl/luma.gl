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

Reconciled against `master` at `789a197d7` on 2026-09-16. P.0 through P.4c are implemented,
including [native TM/UTM (#3275)](https://github.com/visgl/luma.gl/pull/3275) and
[explicit normalization and comparative benchmarks (#3277)](https://github.com/visgl/luma.gl/pull/3277).
P.5 and later remain future work; the subdivisions below are proposed implementation boundaries.
P.3c extends that baseline in this branch with verified adaptive conic coverage, not native formulas.

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

math.gl 5 supplies CRS types, syntax preservation, spatial-reference metadata, and a compatible
proj4-backed CPU transform. The planner may lower explicit PROJJSON conversion metadata and
supported PROJ pipeline syntax, but it must not depend on private proj4js converter internals.
Opaque authority identifiers, WKT, unsupported methods, and transformations selected using
external registry or grid state fall back to the CPU-provider adaptive compiler unless a public
resolver supplies an explicit operation description.

### Execution strategies

One program may select or combine three execution strategies:

1. **Native analytic WGSL** for common operations and projections. The compiler emits static
   function calls and constants rather than a per-coordinate operation switch.
2. **Adaptive polynomial WGSL** for smooth transformations supplied only as a CPU oracle. This is
   the coverage backend and can run in Float32 or double-single precision.
3. **CPU fallback** when the requested domain cannot be safely partitioned, required grid or epoch
   data is unavailable, or the requested numerical contract cannot be met.

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

| Tranche | Outcome | Entry dependency | Measurable exit | Status | Cost |
| --- | --- | --- | --- | --- | :---: |
| P.0 — Adaptive graph baseline | Provider-driven local polynomial plans, Float32 and raw binary64 input, chunk preservation, explicit graph contribution, and correctness-gated benchmarks | GPU command graph and FP64 helpers | Existing node and WebGPU tests cover plan compilation, both input encodings, patch assignment, ownership, and benchmark correctness | Implemented | Complete |
| P.1 — Precision and validity ABI | Add double-single `float32x4` result mode, split plan origins and coefficients, double-single polynomial evaluation, and explicit row validity | P.0 and integer-controlled FP64 arithmetic | Adversarial large-origin tests demonstrate more than 24 significant bits through the result; CPU-oracle error stays within the declared destination-unit tolerance; valid zero and invalid rows are distinguishable | Implemented | Complete |
| P.2a — Projection program and shader interface | Typed 2D axis, unit, affine, and adaptive operation IR; static WGSL composition; stable parameter blocks; one compiled object consumable inline or as a graph contributor | P.1 precision/failure contracts | Forward/inverse operation tests pass; graph and inline paths agree bit-for-bit; shader output contains no per-row dynamic operation dispatch; updates do not cause hidden submit/readback | Implemented | Complete |
| P.2b — Program numerical metadata | Immutable 2D dimension/domain, input encoding, arithmetic/output precision, validity, and inversion metadata; native propagation of sampled adaptive errors and explicit unknown composition | P.2a and P.3 frontend requirements | Metadata snapshots remain independent of mutable plans; native scales amplify sampled estimates; repeated adaptive stages report unknown error; no sampled tolerance is presented as a guarantee | Implemented | Complete |
| P.3a — math.gl planner entry point | Optional CPU adapter for signed 2D axis/unit/diagonal-affine PROJ pipelines and bounded CRS-provider fallback, with explicit inverse domains and structured decline reasons | P.2b and public math.gl 5 CRS APIs | Real PROJJSON/UTM oracle and hardware tests pass; unsupported semantics are declined; math.gl/proj4 remain outside the execution bundle | Implemented | Complete |
| P.3b.1 — Native CRS coordinate frames | Normalize explicit PROJJSON axes, units, ellipsoid, prime meridian, and TM/Pseudo Mercator natural-origin parameters; cancel equivalent conversions while retaining datum boundaries | P.3a and existing axis/affine IR | Geographic frame changes and equivalent projected conversions need no sampling; all 60 UTM zones/both hemispheres match the CPU oracle for frame changes; native GPU inverse preserves sub-Float32 detail | Implemented | Complete |
| P.3b.2 — Native projection conversion lowering | Lower geographic/projected and different projected conversions into native named projection operations; extend explicit PROJ pipelines and retain adaptive fallback | P.3b.1 normalization and P.4 native projection families | Web Mercator and TM/UTM pairs and pipelines lower with explicit arithmetic selection; the default uses double-single fitting of the normalized binary64 reference | Implemented | Complete |
| P.3c — Verified adaptive PROJJSON coverage | Normalize Lambert 1SP/2SP and Albers method/parameter identifiers or canonical names into the CPU provider; retain custom/unregistered CRS labels and optional throwing diagnostics | P.3a adaptive frontend | Forward/inverse CPU and GPU fixtures agree with independently serialized definitions; unnamed/localized labels, units, axes, invalid definitions, and precision contracts are covered without native Float32 formulas | Implemented in this branch | Medium |
| P.4a — Native Web Mercator | Add independently implemented forward/inverse WGSL formulas with explicit Float32 arithmetic, square-world domain/validity, stable parameters, and native CRS/pipeline selection | P.2 and P.3b.1 | CPU oracle and hardware tests cover hemispheres, edges, invalid inputs, inline/graph agreement, all input encodings, and preservation of default sub-Float32 adaptive accuracy | Implemented | Complete |
| P.4b.1 — Bounded native Transverse Mercator/UTM | Add sixth-order Transverse Mercator/UTM forward and inverse with CRS/pipeline lowering, bounded local-branch validity, and inverse footprint checks | P.4a arithmetic/validity conventions | All 60 WGS84 UTM zones and both hemispheres/directions have CPU-oracle and hardware coverage; all input encodings share inline/graph behavior; no implicit downgrade of double-single requests | Implemented | Complete |
| P.4b.2 — Explicit angular normalization | Add a named double-single range-reduction operation with declared interval, invalid seam guards and no automatic many-to-one inverse; enable explicit antimeridian-crossing plans | P.4b.1 local-branch contract | CPU and all-input-format hardware seam/branch tests pass; explicit wrapping composes before smooth native/adaptive UTM plans; no implicit wrapping changes existing plans | Implemented | Complete |
| P.4c — Analytic/adaptive comparison | Compare named native Float32/adaptive double-single programs and an identical inline/materialized consumer against an independent oracle | P.4a/P.4b | Report independent accuracy, parameter/intermediate buffer memory, planning/compilation, first use and synchronized execution on representative hardware; keep output precision fixed and fail invalid results before timing | Implemented | Complete |
| P.5a.1 — Native Lambert Conformal Conic optimization | Add bounded direct LCC formulas and explicit native selection only where they improve on P.3c adaptive coverage | P.3c, P.4 conventions, and benchmark/consumer evidence | Independent oracle and GPU tests retain explicit domains/precision; planning, memory or execution gains are measured at stated accuracy budgets | Conditional | Medium |
| P.5a.2 — Native Albers Equal Area optimization | Add bounded direct Albers formulas only where they improve on P.3c adaptive coverage | P.3c, P.4 conventions, and benchmark/consumer evidence | Parameter variants, equal-area properties and inverse domains have oracle/GPU coverage; measured benefits do not silently downgrade precision | Conditional | Medium |
| P.5b — Visualization projection families | Add gnomonic and orthographic operations where demonstrated consumers require them | P.5a conventions and two requesting consumers | At least two consumers replace local projection shaders; clipping and inverse-domain behavior have explicit tests | Conditional | Medium |
| P.6 — Analytic high-precision math | Add only the range-reduced double-single transcendental functions needed by demonstrated high-precision analytic projection wins | P.8a evidence showing material adaptive cost at the same accuracy target | Accuracy exceeds Float32 over declared domains; throughput or memory improves on adaptive double-single at matching error budgets on representative devices; otherwise defer | Conditional | Very large |
| P.7a.1 — 3D contract and ECEF | Extend dimensions, encodings, metadata, inline/graph interfaces, and validity to height-preserving cartographic/geocentric conversion | P.2/P.3 contracts and an explicit 3D precision design | Ellipsoid/axis/unit, pole, near-origin, invalid-height, and round-trip fixtures match a PROJ oracle; all three components retain the declared precision without silently dropping height | Planned | Large |
| P.7a.2 — Static Helmert pipelines | Compose explicit static datum transformations with 3D conversions | P.7a.1 | Translation, rotation convention, scale, forward/inverse, and datum fixtures match PROJ; unsupported operation selection is declined | Planned | Medium |
| P.7b — Grid and epoch resources | Add texture-backed horizontal/vertical grids, bounded residency, coordinate epoch, and time-dependent operations | P.7a.2 plus consumers supplying licensed grid and epoch data | Missing resources fail explicitly; interpolation and temporal fixtures match PROJ; resource ownership and cache bounds are documented and tested | Conditional | Very large |
| P.8a — Representative performance evidence | Extend P.4c with multi-patch domains, row/patch-count and reuse sweeps, and more GPU vendors; include real consumer workloads as P.9a supplies them | Landed P.4c harness; P.9a for consumer measurements | Reproducible accuracy-gated reports separate routing, compilation, buffer memory, and execution costs; distinguish equal-budget comparisons from explicit accuracy/speed trade-offs | Planned | Medium |
| P.8b — Indexed patch routing and domain partitioning | Add bounded spatial lookup and explicit partitioning of discontinuous domains while preserving seam validity | P.8a evidence that scanning is a bottleneck | Indexed and scan paths agree at patch boundaries and invalid seams; routing storage/build costs are reported and improve a demonstrated workload without changing the precision contract | Evidence-gated | Large |
| P.8c — Consumer fusion and cost selection | Use the existing inline interface in real consumers and choose inline/materialized execution from measured costs | P.8a and P.9a; P.8b only for indexed candidates | Thresholds account for row/patch count, reuse, memory, and device capability; both paths pass the same oracle and error budget; no silent precision downgrade or hidden submission | Evidence-gated | Medium |
| P.9a — Production-shaped consumers | Integrate one preserved-batch table consumer and one inline render/analysis consumer before selecting optimizations | Landed P.2/P.3/P.4 contracts | Both share one program without implicit repacking or adapter casts, preserve ownership/validity/precision, and provide workloads for P.8a | Planned | Medium |
| P.9b — Package graduation | Freeze proven APIs and move stable execution pieces across reviewed package boundaries | P.9a and demonstrated ownership/API stability; P.8 optimizations only if justified | Build/test gates pass, migration is documented, and the execution core has no math.gl, proj4js, or Arrow dependency | Planned | Medium |

## Recommended execution order

P.4c's [recorded hardware baseline](../benchmarks/gpu-project-programs.md) includes forward/inverse
accuracy, parameter and intermediate memory, planning/compilation, and synchronized execution.
It is a one-device, one-patch baseline; it does not establish a cross-device speedup or justify
changing the default precision. More vendors, multi-patch domains, and real consumers remain
evidence requirements for P.6/P.8 decisions.

1. **Coverage first: P.3c.** Verify PROJJSON semantics and reuse the double-single adaptive backend.
   The first additions are Lambert 1SP/2SP and Albers, including custom CRS labels without registry
   identifiers. Additional provider methods should follow actual demand and verified parameter
   mappings. Dedicated GPU formulas are not a prerequisite for this coverage.
2. **In parallel: P.9a and P.8a.** Consumers do not need automatic routing/fusion to start: the dual
   interface already exists. First collect multi-patch baselines, then add consumer and cross-vendor
   evidence. The P.4c axis-swap fixture is not a production consumer.
3. **Use evidence to choose P.5a, P.8b/P.8c, or P.6.** Native Lambert/Albers formulas are optional
   optimizations, not missing general projection functionality. The current shader still scans patches unless an
   assignment is supplied. Do not infer an indexed-routing win from one-patch tests, or infer a
   high-precision analytic win from native Float32 timings at a looser error budget. Explicit
   wrapping does not already provide automatic discontinuity partitioning.
4. **Separate 3D expansion: P.7a.1, then P.7a.2.** Move ECEF out of the 2D P.5a family bundle; its
   encodings, height, precision, and domain contracts must land first. Any greater-than-Float32 3D
   path needs a separately validated adaptive or analytic implementation, not Float32 formulas
   placed in high/low output storage. Enter P.7b only with concrete grid/epoch consumers and data.
5. **Keep P.5b conditional; graduate through P.9b.** Gnomonic/orthographic need the stated consumer
   evidence. Package stability need not wait for every speculative optimization, 3D feature, or
   grid catalog. Keep CRS/provider planning above the dependency-safe execution core.

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
- `@math.gl/crs` and `@math.gl/proj4` remain optional CPU-side definition/resolution/oracle
  dependencies. They do not enter the low-level GPU execution package.
- Arrow upload, conversion, and readback remain in `@luma.gl/arrow`.
