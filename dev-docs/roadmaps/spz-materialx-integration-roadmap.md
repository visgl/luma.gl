# SPZ and procedural material integration roadmap

This plan connects loaders.gl beta.4 capabilities to luma.gl's existing rendering APIs.
The dependency upgrade and expression-parser consolidation are separate from the integrations
planned here. No implementation or full MaterialX conformance is implied by this roadmap.

## Verified starting point

- loaders.gl's glTF loader identifies Gaussian primitives, retains embedded compressed bytes,
  and accepts an injected SPZ loader or `gltf.splatDecoder`. Decoded results are attached to
  `gaussianSplatPrimitives`; they are not automatically converted into luma.gl primitives.
- The beta.4 SPZ parser contains legacy gzip v2/v3 decoding and v4 decoding. Qualify the actual
  published package and coordinate conventions with fixtures before advertising compatibility.
  The existing splat roadmap's v4-only description needs updating when that gate passes.
- Engine already supplies `makeSplatSourceFromGLTF`, `makeGPUSplatDataFromGLTF`, and an optional
  compressed-primitive callback. Its Arrow entry supplies `makeGPUSplatDataFromArrow` and streaming
  upload. Ordinary glTF scene creation does not yet render Gaussian primitives.
- loaders.gl exposes `MaterialXLoader` and an XML document representation. Its source also defines
  a typed procedural graph and dependency ordering with reference, port-type, and cycle checks.
  The graph validator is not exposed through the beta.4 public package entries inspected here.
  XML parsing, graph validation, MaterialX semantic translation, and rendering are distinct steps.
- Engine already owns `MaterialFactory`, PBR material parsing, scenegraph integration, and the
  optional experimental materials entry. Graph owns execution primitives; shaders owns portable
  shader modules. Reuse those boundaries.

## Ownership and package boundaries

| Concern | Owner |
| --- | --- |
| Network requests, glTF/SPZ/XML parsing, decompression, source-format validation | loaders.gl and the application |
| Decoder selection, worker runner, cancellation, source resource lifetime | Application or optional loading integration |
| Typed arrays and Arrow chunks to GPU splat data | Existing engine splat and Arrow adapters |
| Scene transforms, material attachment, draw preparation and destruction | Engine scenegraph and renderers |
| Typed procedural operations and reusable execution/lowering | Graph, using core and shaders without importing engine |
| GLSL/WGSL shader modules and language contributions | Shaders |
| PBR material resources and procedural texture lifetime | Engine, through the existing material system |

Do not add loaders.gl, SPZ codecs, XML parsers, or Arrow runtime dependencies to engine's base
rendering entries. Keep application loading in examples initially. Add an optional integration
entry only if repeated application code establishes a useful public contract. Do not import
unexported upstream files or fork their parser and validation implementations.

## Track A: SPZ and glTF Gaussian splats

### A0: qualify the loader contract

1. Add small, redistributable fixtures for standalone SPZ v2, v3, and v4; an embedded SPZ2 GLB;
   and an uncompressed Gaussian GLB. Record source, license, expected values, and coordinate frame.
2. Exercise both injected-loader and callback paths with the published beta.4 package. Request
   Arrow output explicitly and verify the actual decoded result shape.
3. Verify that glTF uses the declared LUF source frame. Choose the renderer's target frame once;
   do not apply a second handedness conversion in the upload adapter.
4. Confirm how decoded data, feature identifiers, SH bands, and source primitive identity are
   represented. If public types lose that information, improve the upstream contract first.

Acceptance: known position, scale, quaternion, opacity, color and SH coefficients agree with
an independent decoded reference, including nontrivial rotations and coordinate transforms.
Unsupported or malformed versions produce a loading error before GPU allocation.

### A1: bridge decoded results to existing upload APIs

- Build an application-side adapter that pairs each loader descriptor with its glTF primitive.
  Route decoded Arrow output through `makeGPUSplatDataFromArrow`; route uncompressed decoded
  accessors through the existing glTF splat adapter. Do not reinterpret an Arrow table as a
  `GLTFSplatPrimitive` or assume the loader populated primitive accessor fields.
- Preserve source primitive, batch, row and feature-ID identity. Preserve batch/chunk boundaries
  and borrowed-buffer ownership; document every unavoidable quaternion or SH representation copy.
- Check XYZW versus WXYZ quaternion order, linear versus sRGB color, opacity encoding, scale,
  covariance and retained SH degrees at the adapter boundary.
- Keep the existing caller-decoder hook for other loading libraries. Do not decode an already
  decoded source again, even if compression metadata remains attached.
- Propagate aborts through fetching, decoding and upload preparation; destroy only newly owned
  GPU resources after cancellation or failure. Borrowed source arrays and textures remain alive.

Acceptance: compressed and uncompressed versions of the same scene produce equivalent source
values, picking IDs and rendered images. Tests cover aborts, decoder failures, partial allocation,
multiple primitives, missing optional attributes and unsupported harmonics.

### A2: integrate scene placement and mixed rendering

- Add an explicit, opt-in splat path to glTF scene creation, using the existing splat renderer
  and mesh host-pass composition. Do not pass POINTS splat primitives through ordinary mesh PBR.
- Preserve glTF node hierarchy, instance transforms, visibility and scene placement. Establish
  one shared convention for renderer coordinates and loader-computed transforms.
- Render meshes and splats with coherent depth, alpha ordering and picking. Keep the extension
  support registry accurate: decoding alone does not mean ordinary scene loading supports it.
- Extend the Gaussian showcase with an embedded GLB fixture and a mixed mesh/splat scene.

Acceptance: equivalent standalone and embedded scenes match; translated, rotated, scaled and
instanced nodes render and pick correctly on WebGPU and WebGL2. Loading and renderer teardown
release owned resources. Update the existing Gaussian roadmap and user documentation only after
this path works end to end.

3D Tiles traversal, tile selection and transport remain with loaders.gl. Connect them in a later
tranche using the same per-primitive upload path and per-tile/page transforms; do not build another
traversal, fetch scheduler or source cache for this integration.

## Track B: MaterialX and procedural graphs

### B0: establish a public upstream graph contract

- Request a focused public loaders.gl export for procedural graph types and validation/order.
  Agree on stable node identities, explicit port types, outputs, image references and provenance.
- Establish whether MaterialX XML can be translated to that graph through public APIs. Beta.4's
  XML tree alone is not a semantic graph compiler; keep any reusable MaterialX translation
  upstream, with deterministic unsupported-node diagnostics and a pinned supported profile.
- Treat proposed glTF procedural-texture metadata as a separate, versioned input adapter. Pin
  the proposal revision and fixtures; do not equate its graphs with arbitrary MaterialX documents.

Acceptance: public package imports work in ESM, CommonJS and declaration consumers. Fixtures cover
forward references, invalid ports/types, cycles, duplicate IDs and unsupported operations. luma.gl
requires neither deep imports nor a parallel upstream graph schema.

### B1: implement a limited portable evaluation profile

Initial profile: explicit scalar/vector constants, UV coordinates, arithmetic, clamp/mix, and
2D image sampling, producing a bounded 2D color or scalar texture. No implicit type coercion.
Declare supported node names, value types, coordinate conventions and color spaces in one registry.

- Lower the validated source into graph-owned typed operations. Reuse existing Kernel/RenderKernel
  execution and shader language contributions; graph must not depend on engine materials.
- Start with explicit texture baking on WebGPU and WebGL2. Keep baking resolution, output format,
  update triggers and resource ownership visible to the caller. Use a CPU reference evaluator
  in tests rather than creating a second production material engine.
- Separate structural compilation from parameter and resource binding. Cache by graph structure,
  backend/capabilities and output layout; invalidate baked results on relevant values, input
  texture revisions, dimensions and color-space changes. No frame-by-frame rebaking by default.
- Report the source node and unsupported operation before allocating output resources. Keep
  format validation at the loading/compilation boundary rather than adding checks to draw loops.

Acceptance: CPU reference, WebGPU and WebGL2 outputs agree within declared tolerances for each
operation and composed graphs. Tests cover shader compilation, sampling, numeric boundaries,
color-space handling, parameter updates and deterministic cache invalidation.

### B2: connect outputs to existing PBR materials

- Attach baked outputs through `MaterialFactory` and the existing glTF/PBR binding path. Begin
  with base color and emissive, then metallic/roughness with explicit channel packing.
- Keep normal mapping, derivatives, displacement, time-varying graphs, custom code and general
  MaterialX surface closures out of the first supported profile. Add them only with an agreed
  shader contract and backend parity tests.
- Share owned baked textures between materials only through an explicit lifetime owner. Do not
  destroy caller-owned input textures. Distinguish parameter updates from graph recompilation.
- Add a small example that compares a baked procedural material with its equivalent ordinary PBR
  material, and reports unsupported nodes clearly. Parsing success must not imply render support.

Acceptance: material updates, cloning, shared textures, color/alpha handling and teardown behave
like ordinary engine materials. Test a representative MaterialX input and the separately pinned
proposed glTF input through parsing, normalization, baking and rendering.

## Suggested delivery order

| PR | Deliverable | Depends on |
| --- | --- | --- |
| 1 | Qualify SPZ versions, embedded decoding and the published loader contract (A0) | Dependency upgrade |
| 2 | Add decoded-data bridge and ownership/cancellation coverage (A1) | PR 1 |
| 3 | Opt-in glTF scene integration, mixed rendering and showcase (A2) | PR 2 |
| 4, upstream | Expose procedural graph APIs and qualify the MaterialX translation profile (B0) | Agreed public contract |
| 5 | Typed portable procedural texture evaluation and reference tests (B1) | Upstream PR 4 |
| 6 | Existing PBR integration and example, with explicit support reporting (B2) | PR 5 |

The upstream procedural contract work can run independently of the SPZ track. No full MaterialX
renderer or automatic general-purpose graph translation is part of these first six changes.

## Verification and release gates

For implementation PRs, run `nvm use`, `yarn install`, `yarn lint fix`, `yarn build`, `yarn test-node`,
and full `yarn test` after final changes. Run `yarn test-package-layering` for graph/engine boundary
changes, and both website build commands for examples/documentation. Require clean CI, the
repository's review window, accurate extension support reporting and documented ownership before
merging. Measure decode time, copied bytes, upload time, peak memory and first rendered frame for
SPZ; measure compile/bake time, rebakes and steady-state material cost for procedural textures.
Use fixed fixture data and GPU/browser configurations when comparing results.

## Sources and related plans

- [loaders.gl beta.4 Gaussian glTF decoder](https://github.com/visgl/loaders.gl/blob/v5.0.0-beta.4/modules/scene/src/gltf/lib/extensions/KHR_gaussian_splatting.ts)
- [loaders.gl beta.4 SPZ parser](https://github.com/visgl/loaders.gl/blob/v5.0.0-beta.4/modules/splats/src/lib/parse-spz.ts)
- [loaders.gl beta.4 procedural graph source](https://github.com/visgl/loaders.gl/blob/v5.0.0-beta.4/modules/scene/src/materialx/procedural-graph.ts)
- [loaders.gl beta.4 public scene exports](https://github.com/visgl/loaders.gl/blob/v5.0.0-beta.4/modules/scene/package.json)
- [Gaussian splat roadmap](gaussian-splats-roadmap.md)
- [Effects, lighting and materials roadmap](effects-lighting-materials-roadmap.md)
- [Proposed glTF features roadmap](gltf-proposed-features-roadmap.md)
