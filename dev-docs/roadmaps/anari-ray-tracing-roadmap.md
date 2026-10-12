# ANARI ray-tracing implementation roadmap

This maintainer roadmap tracks planned work for the experimental software ray tracer. The
[user-facing ANARI rendering guide](../../docs/api-guide/engine/anari-rendering.md) documents
current behavior, architecture, and limitations.

## Ray-tracing implementation roadmap

| Tranche | Scope | Status |
| --- | --- | --- |
| T0: renderer and graph foundation | Lazy subtype registration, retained-scene adapters, the shared experimental `RayTracingSceneRenderer`, explicit WebGPU command-graph resources, and application-owned submission. | Implemented. |
| T1: direct rays and shadows | Transformed analytic spheres, mesh triangles, tessellated analytic shapes, perspective/orthographic cameras, direct lights, hard shadow rays, progressive primary-ray sampling, and HDR presentation. | Implemented with WebGPU compute rather than hardware ray tracing. |
| T2a: GPU object acceleration | World-space instance bounds, graph-owned complete-binary TLAS construction and refitting, nearest-hit object traversal, early-exit shadow rays, and default-CORE storage limits. | Implemented. |
| T2b: interactive frame budgeting | Half-resolution defaults, bounded adaptive quality, interleaved pixel coverage, retained-identity temporal reprojection, rotating shadow samples, and dirty-triggered object acceleration. | Implemented; frame pacing uses CPU animation intervals. |
| T2c: large-scene acceleration | GPU Morton-sorted object/instance TLAS leaves, retained-permutation transform refits, tight transformed BLAS-root bounds, four-bit radix sorting, batched small-mesh sort/BVH construction, and CORE-compatible packed traversal. | Implemented; SAH/Karras topology, wide hierarchies, and traversal counters remain planned. |
| T2d: retained scene updates | Categorized world/topology/transform/material/light revisions, cached scene descriptors, stable animated placement identities, sparse packed-transform uploads, and rotating copy-free texture history. | Implemented; camera- and light-only frames avoid acceleration rebuilds. |
| T2e: presentation and direct-light parity | Caller-owned offscreen framebuffers, actual-target color/depth formats, exact SDR/HDR tone mapping and sRGB/linear presentation, incoming directional-light agreement, scalar metallic/roughness GGX shading, and per-stage graph encoding diagnostics. | Implemented for direct lighting; material textures, alpha/transmission, indirect transport, and GPU-stage timestamps remain separate work. |
| T2f: deforming scene extraction | Skeletal/morph geometry extraction, bounded deforming-mesh updates, and shared animated instance acceleration. | Planned. |
| T3: indirect transport and denoising | Advanced PBR texture, alpha, and transmission parity; multi-bounce material transport/path tracing, convergence controls, and denoising; primary-ray progressive accumulation already exists in T1. | Diffuse transport is implemented with opt-in bounded bounces. Opt-in opaque GGX reflective paths are implemented. Transmissive paths, texture parity, explicit emitter sampling and advanced temporal denoising remain planned. Opt-in guided spatial presentation filtering is implemented. |
| T4: ray marching and volumes | Signed-distance-field ray marching, retained spatial fields, 3D textures, transfer functions, and ANARI volume objects. | Planned. |
| T5: hybrid composition and advanced diagnostics | Raster/ray composition, GPU-stage timings, traversal counters, renderer capability reporting, and debug visualization channels. | Basic graph node/pass/CPU-encoding counters are implemented; full-resolution primary-hit GPU channels are implemented; projected-depth transfer supports raster overlays. T5a adds allocation-free implementation capability reporting; T5b adds normal/camera-distance/identity/history presentation diagnostics. GPU timings and traversal diagnostics remain planned. |

## Chart rendering acceptance track

This track defines visualization-focused capability targets within luma.gl.
Chart grammar, scales, layout,
and application interaction remain outside the renderer's responsibilities.

| Tranche | Scope | Acceptance gate / status |
| --- | --- | --- |
| M0: reproducible baseline | Shared raster/ray chart scenes, fixed camera/data, stable datum identities, sampling controls, capture and measurements. | Started: JSON playground Chart Baseline contains six cuboids, six spheres, six cylinders, and a floor. M0a adds explicit uint32 primary sampling seeds and a bounded Playwright capture harness with fixed frame counts and JSON metadata. M0b adds synchronous logical owned-allocation diagnostics and capture telemetry; M0c adds reference-image display-RGB error metrics and optional RMSE acceptance thresholds to deterministic captures; measured peak VRAM and named-hardware convergence baselines remain planned. |
| M1: interactive composition | Stable object-ID outputs, picking, depth/normal channels, outlines, and raster/ray depth composition. | Started with M1a: on-demand integer ray picking, retained placement identity, world-space hit position/normal/distance, and playground click inspection. M1b adds caller-owned full-resolution integer-ID, ray-distance, and world-normal GPU snapshots with retained identity tables. M1c adds visible-only inward selection outlines over exact ID textures, including playground click highlighting. M1d adds full-resolution projected device-depth snapshots and a color-preserving depth-attachment transfer for application-owned raster overlays. M1e adds the Chart Motion playground scene: retained animated marks, click outlines, and raster text labels composited against current ray depth. The renderer foundation and interactive demo are implemented; GPU tests cover moving placement picks, glyph rendering and depth rejection; full browser interaction regression coverage remains follow-up work. |
| M2: indirect transport | Diffuse bounces, emissive illumination, explicit light sampling, bounce budgets, accumulation invalidation and convergence controls. | M2a implements cosine-weighted diffuse secondary rays; M2b gathers incident emission and direct lighting at secondary hits; M2c adds bounded 0–8 bounce budgets, seeded paths, accumulation invalidation and a reproducible Chart Diffuse example. GPU acceptance covers emissive illumination, metallic rejection, deterministic pixels and history resets. Explicit emitter sampling and measured convergence targets remain planned. |
| M3: material parity | Material textures, reflective transport, dielectric transmission, IOR/attenuation, and distinct alpha behavior. | M3a adds opt-in bounded opaque specular transport. M3b adds roughness-dependent GGX sampling and Fresnel/combined-PDF diffuse-specular weighting. M3c adds a reproducible Chart Materials scene with retained datum IDs, matte marks, emissive points, a metal roughness sweep and glossy floor. Linear HDR GPU tests cover tint, reflection visibility, roughness, dielectric/mixed materials, seeded paths and history resets. Texture parity, alpha behavior, dielectric transmission/IOR/attenuation and glass acceptance remain planned. |
| M4: responsive quality | Guided denoising, disocclusion rejection, motion history, interactive/still presets, and optional GPU timestamps. | M4a adds explicit interactive/still quality presets and preview controls. M4b adds opt-in identity/depth/normal-guided spatial denoising without feeding filtered pixels back into history. M4c adds configurable 1–256 history confidence limits and saturation-safe weights. Advanced temporal denoising, disocclusion/motion validation, GPU timestamps, and the complete ghost-free motion acceptance gate remain planned. |
| M5: shape coverage | Cuboids, spheres, cylinders, hex prisms, ring and torus segments, with consistent raster/ray identity. | M5a implements retained capped hexagonal prisms with flat normals. M5b implements full and open partial torus sweeps using shared math.gl tessellation, with engine and strict JSON adapters. M5c adds the reproducible Chart Shapes preset, capture support and raster/ray identity acceptance. Annular prism/ring segments remain planned; additional analytic intersections require measured benefit. |
| M6: export | Offscreen/tiled projections, global sampling coordinates, fixed exposure, seam-safe denoising, and bounded readback. | Planned: tiled output matches a single-frame reference without seams. |

### Run the initial baseline

Run `yarn workspace luma.gl-examples-showcase-scene start`, open `playground.html`,
and choose **Chart Baseline**. Switch the renderer selector between forward and ray tracing
on WebGPU. The preset supplies full-resolution ray settings with adaptive resolution and
temporal reprojection disabled; it has no automatic camera or mark animation. The same
scene inputs are used in both renderers. Direct shadows currently exist only in the ray
path, so pixel equality is not the acceptance criterion.

`chart-baseline.ts` also exports `makeChartBaseline(rendererSubtype)` for future capture
and benchmark harnesses. IDs combine mark type and source datum identifier. These are
retained scene identities. The ray renderer's on-demand picking query resolves its integer hit ID back to the retained surface and instance; the playground displays the authored instance ID.

Measure interaction latency, scene-update cost, time to a defined image-quality threshold,
and peak GPU memory on named hardware before setting numeric budgets. Record canvas size,
renderer settings, browser/backend, and warm-up separately. Existing graph counters report
CPU encoding work, not GPU completion time. Volumes, deformation, and advanced BVH topology
remain independent tracks unless chart benchmarks establish a dependency.
