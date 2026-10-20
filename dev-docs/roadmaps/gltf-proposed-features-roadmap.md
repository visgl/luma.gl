# glTF proposed features implementation roadmap

Audit date: October 20, 2026. Scope: the six proposals selected for the first implementation wave.

## Outcome and delivery rules

Deliver one implementation PR for each proposal below. Each PR includes the applicable parser,
scene/runtime or shader integration, truthful support reporting, focused regression tests,
documentation, and an example when a usable upstream asset is available. These are open proposals;
a KHR prefix does not imply ratification. Pin a specification commit and state the implemented
profile. Preserve unsupported source extension records during interchange.

Examples belong in **glTF proposed features**. Ratified/core examples belong in **glTF standard
features**. Existing mixed-feature viewers retain explicit draft labels inside their feature lists;
the section name describes their primary purpose, not certification of every displayed feature.

Use existing owners: `@luma.gl/gltf` for glTF interpretation/controllers, `@luma.gl/engine` for reusable
scene behavior, `@luma.gl/shadertools` for shader math, and existing scene/rendering infrastructure for
lighting and transport. Avoid a parallel scenegraph, audio context owner, or material system.

Before implementing a tranche:

1. Fetch the exact proposal revision and schemas; record defaults, units, extension dependencies,
   unsupported cases, and required-extension behavior.
2. Inspect the upstream sample and its referenced images, buffers, audio, and licenses. An example
   mentioned in a proposal is a lead until its actual files and redistribution terms are checked.
3. Decide an explicit backend/profile contract. Metadata preservation, parsing, faithful rendering,
   and approximations are different capabilities.
4. Keep the original upstream asset unchanged. Pin remote URLs to a source commit, resolve relative
   resources against the original document, display attribution, and show actionable load failures.
   If no upstream asset exists, use small authored offline fixtures for tests and document the gap.

## Tranches and PR order

| Tranche | Proposal | Relative scope | Depends on | Source/sample status |
| --- | --- | --- | --- | --- |
| 1 | `KHR_billboard` | Small/medium | Existing node transforms and cameras | Proposal repository verified; no sample file in its PR changes |
| 2 | `KHR_lightmap` | Medium | Existing PBR, texture coordinates, instancing | Two glTF examples verified in proposal source; Cornell Box implementation is an additional lead |
| 3 | `EXT_lights_area` | Large | Light extraction, PBR lighting and transport | Proposal source verified; upstream model discovery required |
| 4 | `KHR_materials_scatter` | Large | Existing transmission, diffuse transmission and volume scattering | Proposal source verified; upstream model discovery required |
| 5 | `KHR_audio_graph` | Large | Audio emitter PR #3486 | Published playable Drum Kit sample is a lead |
| 6 | `KHR_audio_environment` | Large | Tranche 5 and audio emitters | Same Drum Kit repository claims all three audio layers; verify exact supported revision |

Relative scope describes engineering complexity, not a delivery-date commitment. Every row is a
separate PR. A failing or incomplete tranche does not silently broaden the supported-extension claim.

## Tranche 1: billboards

Specification: [Khronos proposal #2522](https://github.com/KhronosGroup/glTF/pull/2522).
Pinned source: `CesiumGS/glTF@aeb5a437219a33aa757743dc1a5d892e3b8e128a`.

Implementation:

- Parse the authored billboard mode/axis and attach the behavior at the glTF adapter boundary.
- Compute camera-dependent runtime transforms after animation. Keep source node transforms and
  export metadata intact; account for parent transforms and the draft's child-inheritance rules.
- Reuse the same camera-facing result for rendering, picking and bounds where applicable. Define
  limitations for instanced nodes and unsupported transforms instead of silently flattening them.

Acceptance:

- Camera-facing and constrained-axis behavior matches the pinned specification on both backends.
- Parent transforms, nonuniform scales, animated transforms, child nodes, multiple cameras and
  repeated updates do not accumulate rotation or mutate the source document.
- Search the Cesium proposal/demo repositories for a licensed glTF sample. Add a remote-source
  example if one is found; otherwise retain deterministic authored test fixtures.

## Tranche 2: baked lightmaps

Specification: [Khronos proposal #2679](https://github.com/KhronosGroup/glTF/pull/2679).
Pinned source: `bhouston/glTF@c83154543c8a227bca17b5fe0eafdef2a6cb6efb`.

Verified example paths under `extensions/2.0/Khronos/KHR_lightmap/examples/`:
`node-atlas.gltf` and `gpu-atlas.gltf`. The proposal additionally links a three.js implementation and
baked Cornell Box in [bhouston/three.js#46](https://github.com/bhouston/three.js/pull/46).

Implementation:

- Parse irradiance textures, bindings, encodings, texture-coordinate selection and atlas transforms.
- Add a shared shader module/texture slot that applies baked irradiance to the diffuse BRDF at the
  specified stage, while preserving specular/environment lighting and avoiding diffuse double-counting.
- Support node and per-instance atlas mappings through existing instancing metadata. Make GPU texture
  ownership and feature-dependent shader variants explicit.

Acceptance:

- Unmodified source examples load from pinned URLs; all referenced resources resolve correctly.
- Node/instance atlas addressing, HDR/linear decoding and the specified material interaction agree
  with a reference renderer on WebGPU and WebGL2.
- Missing optional maps fall back correctly; unsupported required encodings are reported precisely.

## Tranche 3: area lights

Specification: [Khronos proposal #2525](https://github.com/KhronosGroup/glTF/pull/2525).
Pinned source: `MiiBond/glTF@e77b27a67d0ee19327f6104aca5d869433b3e367`.

Implementation:

- Enumerate every light shape, photometric quantity, orientation and sidedness in the pinned draft.
- Extend shared light metadata and node-to-world extraction; reuse the existing material/scene
  lighting path. Select and validate a raster integration method and any required lookup-table license.
- Define raster versus ray-traced behavior, including shadow support, sampling budgets, and any
  approximation. Advertise only the combinations actually implemented.

Acceptance:

- Authored shape, intensity, orientation, distance and scale changes produce the expected lighting.
- Compare diffuse and rough/smooth specular cases against a reference; include grazing angles and
  back-face behavior. Existing punctual lights retain their outputs.
- Publish an upstream-source example if a suitable licensed asset is found; otherwise document sample
  unavailability and use quantitative authored regression scenes.

## Tranche 4: material scattering

Specification: [Khronos proposal #2579](https://github.com/KhronosGroup/glTF/pull/2579).
Pinned source: `MiiBond/glTF@a6cd5b46fb4bd2c9ef83f0bb4a123f45a97a6d9f`.

This proposal replaces the earlier volume-scatter proposal and combines thin-wall diffuse
transmission with volume scattering. Existing related extensions remain independently supported.

Implementation:

- Map draft factors/textures and thin-wall versus volume behavior into the existing PBR material.
- Reuse existing transmission/scattering infrastructure where its physical meaning matches the new
  draft. Verify energy conservation and interactions with volume, IOR, coat and ordinary transmission.
- Document bounded raster approximations and distinguish them from multiple-scattering transport.

Acceptance:

- Zero-strength, thin-wall and volumetric limits match the pinned draft and reference renders.
- Factor/texture combinations, color-space handling and material animation paths work as documented.
- Locate a proposal-author sample or demonstrably compatible conversion source before adding a remote
  example. A related old-extension model is not evidence of new-extension support.

## Tranche 5: audio processing graphs

Specification: [Khronos proposal #2632](https://github.com/KhronosGroup/glTF/pull/2632).
Pinned source: `rudybear/glTF@c0042d72e74dfd25790566d21e02f71e420b130f`.
Sample lead: [Drum Kit](https://github.com/rudybear/gltf-webgpu/tree/feature/khr-audio/examples/drum-kit).

Implementation:

- Enumerate the pinned graph node roster, channel/mixing rules, source/emitter bindings, clock,
  automation and feedback-delay rules before choosing an implementation profile.
- Extend the optional audio controller with graph construction and explicit ownership. Map supported
  nodes to Web Audio without duplicating the application-owned context or emitter/source playback.
- Handle shared decoded buffers, scene-local activation, start/stop/reset, graph cycles, pending-load
  cancellation and destruction without leaking nodes or audible playback.

Acceptance:

- Offline audio tests measure the processing outcome, channel routing and timing for every supported
  node. Invalid cycles and unsupported nodes are diagnosed before partial graph activation.
- Verify the Drum Kit's exact graph operations and licenses. If compatible, load the original asset
  from a pinned repository URL and expose gesture-based activation and useful playback diagnostics.

## Tranche 6: audio environments

Specification: [Khronos proposal #2631](https://github.com/KhronosGroup/glTF/pull/2631).
Pinned source: `rudybear/glTF@913251a1157661b105e5c7db189fc624eee3fe17`.
Sample lead: the Drum Kit repository linked in tranche 5.

Implementation:

- Implement the specified listener-selection lifecycle, scene bindings, master gain and spatializer
  fallback rules, preserving emitter-only playback behavior.
- Add environment zones, transforms, priorities and blends, then direct/reverb sends and supported
  impulse-response or parametric reverb behavior. Validate Doppler and filter semantics explicitly.
- Define interoperability between shared graph sources, listener movement, environment switching,
  asynchronous impulse responses, stop/reset and resource destruction.

Acceptance:

- Offline tests measure dry/wet routing, impulse-response decay, zone transitions and listener choice.
- Optional/default behavior preserves the emitter-only baseline; unsupported acoustic profiles remain
  visible in capability reporting.
- Load the verified original multi-layer Drum Kit asset if its revision matches the supported draft;
  otherwise document the compatibility gap rather than rewriting its authored extension records.

## Shared PR verification and review

Each implementation PR records the actual results of `nvm use`, `yarn install`, `yarn lint fix`,
`yarn build`, `yarn test`, `yarn website:build`, and `(cd website && yarn build)`, plus focused tests
and reference evidence appropriate to its behavior. Run build and tests after final source/format
changes. Run expensive checks in dependency order so a clean build does not remove artifacts while
another check is using them.

Register examples in the authoritative catalog, mobile-support registry, thumbnail set, backend
metadata and example typecheck list. Each example displays draft status, supported profile,
source revision, attribution and loading errors. Offline regressions do not depend on upstream
network availability; a separate integration smoke check verifies pinned remote assets.

Wait at least 15 minutes after opening each PR, address and reply to actionable comments, resolve
threads after pushing their fixes, and require green CI. Merge only with separate user authorization.

## Related work

- [Existing glTF/PBR roadmap](effects-lighting-materials-roadmap.md) owns broader rendering work.
- [Linked sample support](gltf-linked-sample-support.md) owns physics/interactivity sample gaps.
- Audio emitter implementation: [luma.gl PR #3486](https://github.com/visgl/luma.gl/pull/3486).

Camera metadata, skeleton bones, other OpenPBR material proposals, opacity micromaps, procedural
textures and additional mesh compression remain outside this user-selected six-proposal wave.
