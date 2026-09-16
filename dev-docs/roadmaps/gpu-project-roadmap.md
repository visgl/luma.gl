# GPU Project implementation roadmap

This maintainer roadmap tracks the development of `@luma.gl/experimental/gpu-project` from its
current adaptive Float32 evaluator into a composable, precision-tiered CRS transformation system
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

The implemented module samples an arbitrary CPU projection provider, recursively compiles local
polynomial patches, and evaluates them over chunk-preserving GPU vectors. Inputs may be
`float32x2` or raw binary64 `uint32x4`. The default `local-f32` mode emits `float32x2` positions
relative to a shared binary64 destination origin. The `double-single` mode evaluates normalization
and the fitted polynomial with the fp64 arithmetic shader module, then emits absolute `float32x4`
high/low coordinate limbs. Both modes can publish a separate caller-owned validity column.

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
`ProjectionProgram`. The program is an ordered list of typed, invertible operations with explicit
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

The compiled program should support both:

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

The double-single adaptive evaluator should fit coefficients in CPU binary64, split origins and
coefficients into high/low Float32 limbs, evaluate normalized coordinates and polynomials using
double-single arithmetic, and emit absolute double-single coordinates. This extends precision
through the projection result without first requiring a portable high-precision transcendental
library. The error oracle must simulate the selected GPU arithmetic and report error in destination
units.

Every mode should publish a separate validity result. `[0, 0]` must no longer be both a legitimate
coordinate and the only signal for a non-finite input, out-of-domain row, invalid patch assignment,
or unsupported operation.

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
| P.3b — Native CRS conversion lowering | Lower explicit PROJJSON conversion metadata; normalize ellipsoid, prime meridian, and named projection parameters; extend PROJ pipeline support and retain adaptive fallback | P.3a and P.4 native projection families | Supported CRS definitions choose inspectable native programs with explicit axis/unit/datum semantics; no private proj4js imports | Planned | Large |
| P.4 — cuProj parity core | Add native axis swap, degree/radian conversion, angular normalization, prime-meridian adjustment, affine scale/offset, Web Mercator, and sixth-order Transverse Mercator/UTM forward and inverse | P.2 and operation provenance policy | All WGS84 UTM zones and both directions match the PROJ/math.gl CPU oracle over central, boundary, polar-limit, and invalid domains; Float32 analytic and double-single adaptive tiers are benchmarked separately | Planned | Large |
| P.5a — High-value projection families | Add Albers Equal Area, Lambert Conformal Conic, and geocentric/ECEF operations, informed by the stack.gl module inventory but independently implemented | P.3 planner and P.4 native-operation conventions | Forward/inverse/property tests and PROJ-oracle fixtures cover parameter variants and domain failures; CRS planner selects each operation without custom consumer code | Planned | Large |
| P.5b — Visualization projection families | Add gnomonic and orthographic operations where demonstrated consumers require them | P.5a conventions and two requesting consumers | At least two consumers replace local projection shaders; clipping and inverse-domain behavior have explicit tests | Conditional | Medium |
| P.6 — Analytic high-precision math | Add range-reduced double-single transcendental functions and high-precision analytic projection variants where they beat adaptive plans | P.4/P.5 benchmarks showing adaptive memory or dispatch cost is material | Accuracy improves beyond Float32 across global domains and throughput/memory beats the adaptive double-single path on representative devices; otherwise the tranche is deferred | Conditional | Very large |
| P.7a — 3D datum pipelines | Add cartographic/geocentric conversion and static Helmert transformations with height-preserving three-component contracts | P.2 IR, P.3 CRS dimensions, and P.5a ECEF | 3D forward/inverse and datum fixtures match a PROJ oracle with explicit unit, axis, and validity handling | Planned | Large |
| P.7b — Grid and epoch resources | Add texture-backed horizontal/vertical grids, bounded residency, coordinate epoch, and time-dependent operations | P.7a plus consumers supplying licensed grid and epoch data | Missing resources fail explicitly; interpolation and temporal fixtures match PROJ; resource ownership and cache bounds are documented and tested | Conditional | Very large |
| P.8 — Routing, fusion, and cost model | Replace linear patch scans with bounded spatial routing; partition discontinuous domains; fuse projection into graph consumers when profitable | P.2 dual interface and representative P.1/P.4 plans | Scan, indexed, materialized, and fused paths pass one oracle before timing; selection thresholds include patch count, row count, reuse, memory, precision, and device capability | Planned | Large |
| P.9 — Consumers and graduation | Prove a preserved-batch table consumer and an inline render/analysis consumer, freeze ownership and package boundaries, then graduate stable pieces | P.3, P.4, P.8, and two production-shaped consumers | Both consumers share one program contract without repacking or adapter casts; build/test gates pass; execution core has no math.gl, proj4js, or Arrow dependency | Planned | Large |

## Recommended execution order

1. Land P.1 before adding projection families. Raw binary64 input followed by Float32 coefficients,
   arithmetic, and output is not a greater-than-Float32 projection contract.
2. Establish P.2 so new projection formulas target one typed operation program and both inline and
   materialized use, rather than accumulating standalone shaders.
3. P.3a establishes the optional frontend and bounded fallback. Land P.3b and P.4 together or in adjacent changes: math.gl supplies the CRS-facing frontend,
   while the cuProj-sized operation set provides the first useful native lowering target.
4. Add P.5a projection families based on observed CRS demand. Enter P.5b only with consumers.
5. Run the P.6 decision gate after native and adaptive double-single paths can be compared. Do not
   build a general software binary64/transcendental stack speculatively.
6. Add static 3D datum support before external grids and dynamic CRS. Grid licensing, download,
   residency, and epoch policy must remain explicit application concerns.
7. Optimize patch routing and fusion against real consumers, then graduate only the
   dependency-safe execution core. Keep CRS/provider planning in the higher-level package.

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
