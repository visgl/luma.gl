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
| T3: indirect transport and denoising | Advanced PBR texture, alpha, and transmission parity; multi-bounce material transport/path tracing, convergence controls, and denoising; primary-ray progressive accumulation already exists in T1. | Planned. |
| T4: ray marching and volumes | Signed-distance-field ray marching, retained spatial fields, 3D textures, transfer functions, and ANARI volume objects. | Planned. |
| T5: hybrid composition and advanced diagnostics | Raster/ray composition, GPU-stage timings, traversal counters, renderer capability reporting, and debug visualization channels. | Basic graph node/pass/CPU-encoding counters are implemented; full-resolution primary-hit GPU channels are implemented; projected-depth transfer supports raster overlays; GPU timings and traversal diagnostics remain planned. |

## Chart rendering acceptance track

This track defines visualization-focused capability targets within luma.gl.
Chart grammar, scales, layout,
and application interaction remain outside the renderer's responsibilities.

| Tranche | Scope | Acceptance gate / status |
| --- | --- | --- |
| M0: reproducible baseline | Shared raster/ray chart scenes, fixed camera/data, stable datum identities, sampling controls, capture and measurements. | Started: JSON playground Chart Baseline contains six cuboids, six spheres, six cylinders, and a floor. Capture automation, explicit sampling seeds, GPU memory measurement, and hardware baselines remain planned. |
| M1: interactive composition | Stable object-ID outputs, picking, depth/normal channels, outlines, and raster/ray depth composition. | Started with M1a: on-demand integer ray picking, retained placement identity, world-space hit position/normal/distance, and playground click inspection. M1b adds caller-owned full-resolution integer-ID, ray-distance, and world-normal GPU snapshots with retained identity tables. M1c adds visible-only inward selection outlines over exact ID textures, including playground click highlighting. M1d adds full-resolution projected device-depth snapshots and a color-preserving depth-attachment transfer for application-owned raster overlays. The complete application gate is selecting an animated mark while raster labels remain crisp and correctly occluded. |
| M2: indirect transport | Diffuse bounces, emissive illumination, explicit light sampling, bounce budgets, accumulation invalidation and convergence controls. | Planned: reproducible color bleeding and emissive illumination. Separate transport from the current T3. |
| M3: material parity | Material textures, reflective transport, dielectric transmission, IOR/attenuation, and distinct alpha behavior. | Planned: matte, textured, metal, glossy, and overlapping glass marks. |
| M4: responsive quality | Guided denoising, disocclusion rejection, motion history, interactive/still presets, and optional GPU timestamps. | Planned: motion stays responsive and stopping converges without persistent ghosts. |
| M5: shape coverage | Cuboids, spheres, cylinders, hex prisms, ring and torus segments, with consistent raster/ray identity. | Planned: shared tessellation first; use measured benefit to justify additional analytic intersections. |
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
