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
| T2e: presentation and direct-light parity | Caller-owned offscreen framebuffers, actual-target color/depth formats, exact SDR/HDR tone mapping and sRGB/linear presentation, incoming directional-light agreement, scalar metallic/roughness GGX shading, and per-stage graph encoding diagnostics. | Implemented. Subsequent material and transport work is tracked in M2 and M3. GPU-stage timestamps remain open. |
| T2f: deforming scene extraction | Skeletal/morph geometry extraction, bounded deforming-mesh updates, and shared animated instance acceleration. | Planned. |
| T3: indirect transport and denoising | Advanced PBR texture, alpha, and transmission parity; multi-bounce material transport/path tracing, convergence controls, and denoising; primary-ray progressive accumulation already exists in T1. | Diffuse transport is implemented with opt-in bounded bounces. Opt-in opaque GGX reflective paths are implemented. Smooth dielectric paths, base-color/emissive/metallic-roughness/transmission maps, explicit emitter sampling and textured alpha masks are implemented. Triangle normal maps, smooth dielectric absorption, specular color/intensity and clearcoat strength/roughness are implemented. Remaining material and sampling gaps are listed below. Opt-in guided spatial presentation filtering is implemented. |
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
| M2: indirect transport | Diffuse bounces, emissive illumination, explicit light sampling, bounce budgets, accumulation invalidation and convergence controls. | M2a implements cosine-weighted diffuse secondary rays; M2b gathers incident emission and direct lighting at secondary hits; M2c adds bounded 0–8 bounce budgets, seeded paths, accumulation invalidation and a reproducible Chart Diffuse example. GPU acceptance covers emissive illumination, metallic rejection, deterministic pixels and history resets. M2d adds opt-in explicit sampling of emissive triangles and transformed analytic spheres, retaining CORE storage limits. M2e adds the Chart Lighting preset and preview controls. M2f adds opt-in area/luminance-weighted emitter selection with shader PDF compensation, a float32 CDF, a uniform safety mixture and retained update invalidation. M2g pairs emissive geometry and material sampling in diffuse and PBR transport. M2h adds constant environment radiance with MIS. Directional maps add luminance and solid-angle importance sampling. Measured hardware convergence targets remain planned. |
| M3: material parity | Material textures, reflective transport, dielectric transmission, IOR/attenuation, and distinct alpha behavior. | M3a adds opt-in bounded opaque specular transport. M3b adds roughness-dependent GGX sampling and Fresnel/combined-PDF diffuse-specular weighting. M3c adds a reproducible Chart Materials scene with retained datum IDs, matte marks, emissive points, a metal roughness sweep and glossy floor. Linear HDR GPU tests cover tint, reflection visibility, roughness, dielectric/mixed materials, seeded paths and history resets. M3d adds scalar alpha-mask visibility shared by color, secondary/shadow rays, picking and channels. M3e adds base-color/emissive/metallic-roughness/transmission maps with UV0/UV1 transforms and smooth dielectric transport. M3f adds textured alpha-mask visibility in mesh/sphere traversal, shadow rays, explicit emitter sampling, picking and primary-hit channels, including retained map changes. M3g adds triangle mesh normal maps with UV0/UV1 transforms and normal scale, while preserving hit normals for queries and dielectric interfaces. M3h adds distance-based absorption for closed smooth dielectrics. M3i adds dielectric specular color and intensity factors and maps for direct lighting and opaque PBR paths. M3j adds clearcoat strength and roughness maps for direct and opaque PBR paths. M3k adds independent triangle clearcoat normal maps. M3l adds primary triangle texture footprints and mip selection; secondary footprints and filtered cutout visibility remain open. M3m adds ambient occlusion maps and strength for ambient light. M3n adds fabric sheen factors and maps for direct lighting and opaque PBR paths. M3o adds thin-film iridescence strength and thickness maps for direct lighting and opaque PBR paths. M3p adds anisotropic GGX evaluation and matched opaque bounce sampling with retained direction and strength maps. M3q adds mapped diffuse transmission for thin surfaces in PBR transport. Blending, other extension maps, rough transmission and nested media remain planned. |
| M4: responsive quality | Guided denoising, disocclusion rejection, motion history, interactive/still presets, and optional GPU timestamps. | M4a adds explicit interactive/still quality presets and preview controls. M4b adds opt-in identity/depth/normal-guided spatial denoising without feeding filtered pixels back into history. M4c adds configurable 1–256 history confidence limits and saturation-safe weights. M4d adds explicit preview resolution choices with fixed-grid refinement; M4e exposes renderer comparison in the preview toolbar and restores ray settings after raster switches. M4f discounts partially occluded history and clips it against matching surface history. M4g fades guided spatial filtering as confidence rises. M4h adds optional log-luminance moments, variance-guided spatial filtering, and a variance debug view. Opt-in PBR diffuse/specular histories store first-interface radiance and confidence independently. Broader motion acceptance remains open. |
| M5: shape coverage | Cuboids, spheres, cylinders, hex prisms, ring and torus segments, with consistent raster/ray identity. | M5a implements retained capped hexagonal prisms with flat normals. M5b implements full and open partial torus sweeps using shared math.gl tessellation, with engine and strict JSON adapters. M5c adds the reproducible Chart Shapes preset, capture support and raster/ray identity acceptance. M5d adds closed annular prisms and ring segments, including hard cap/wall normals and both radial caps, using shared math.gl lathe/plane tessellation. Additional analytic intersections require measured benefit. |
| M6: export | Offscreen/tiled projections, global sampling coordinates, fixed exposure, seam-safe denoising, and bounded readback. | M6a adds full-image crop coordinates and explicit sampling-frame indices to preserve seeded primary/secondary paths. M6b adds lazy tile planning with clipped denoise and progressive-history halos. M6c adds a bounded RGBA8 async tile export with fixed exposure, per-tile readback, cancellation and early-return cleanup. GPU acceptance compares odd-sized stitched exports with independent full-frame renders for perspective/orthographic cameras, diffuse/PBR transport and guided filtering. M6d streams linear RGBA16F radiance tiles with the same sampling and history halos. M6e encodes the tile stream as RGB PFM for HDR workflows. M6f assembles sRGB tiles into a PNG using browser canvas encoding. M6g exposes tiled SDR and HDR export on retained ANARI frames with a requested output size and independent history. A playground export UI remains a follow-up. |

### Run the initial baseline

Run `yarn workspace luma.gl-examples-showcase-scene start`, open `playground.html`,
and choose **Chart Baseline**. Switch the renderer selector between forward and ray tracing
on WebGPU. The preset supplies full-resolution ray settings with adaptive resolution and
temporal reprojection disabled; it has no automatic camera or mark animation. The same
scene inputs are used in both renderers. Compare silhouettes, visibility, and retained identity. The raster and ray configurations use different lighting and shadow algorithms.

`chart-baseline.ts` also exports `makeChartBaseline(rendererSubtype)` for future capture
and benchmark harnesses. IDs combine mark type and source datum identifier. These are
retained scene identities. The ray renderer's on-demand picking query resolves its integer hit ID back to the retained surface and instance; the playground displays the authored instance ID.

Measure interaction latency, scene-update cost, time to a defined image-quality threshold,
and peak GPU memory on named hardware before setting numeric budgets. Record canvas size,
renderer settings, browser/backend, and warm-up separately. Existing graph counters report
CPU encoding work, not GPU completion time. Volumes, deformation, and advanced BVH topology
remain independent tracks unless chart benchmarks establish a dependency.

## November 2026 technical review

The target is interactive visualization and reproducible stills on portable WebGPU, with
stable picking and raster composition. The renderer already provides a credible geometry
and visibility foundation for that target. Its current evidence does not establish
state-of-the-art light transport, convergence, or real-time performance. Evaluate those
separately: an artifact-free still, the time required to reach it, and the behavior of the
image during camera or scene motion are different outcomes.

The implementation baseline includes clearcoat strength and roughness (#3745), dielectric
specular parameters (#3744), absorption inside closed smooth dielectrics (#3743), triangle
normal maps (#3739), and textured cutouts (#3738). Clearcoat normal maps are a separate
implementation tranche.

| Dimension | Current implementation and gap | Reference |
| --- | --- | --- |
| Visibility and acceleration | Software TLAS/BLAS traversal, retained refits, hard visibility and alpha cutouts. The portable WebGPU API offers no standard hardware ray-query or acceleration-structure interface. GPU timing and traversal counters are needed to distinguish bandwidth, divergence, and hierarchy quality. | [WebGPU specification](https://www.w3.org/TR/2026/CRD-webgpu-20260512/), [GPU path tracing architecture](https://pbr-book.org/4ed/Wavefront_Rendering_on_GPUs/Mapping_Path_Tracing_to_the_GPU) |
| Transport and convergence | Bounded diffuse and GGX paths, smooth dielectric interfaces, explicit emitter sampling and power-weighted selection. Emissive geometry and constant environment radiance use MIS with BSDF sampling. Directional environment maps sample texels by luminance and solid angle. The display backdrop is independent of environment lighting. An emitter CDF accounts for source power but not receiver location or orientation. | [PBRT's reference path integrator](https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer) |
| Shadows | Direct lights use hard visibility and optional rotation across lights. Sampled emissive geometry can give area-light penumbrae. Shadow rays treat transmissive glass as an occluder even when camera paths refract through it. Straight-line colored shadow transmittance would be an approximation and cannot reproduce refracted caustics. | [PBRT surface transport](https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer), [Bidirectional ReSTIR caustics research](https://research.nvidia.com/labs/rtr/publication/hedstrom2025restir/hedstrom2025restir.pdf) |
| Reconstruction | Retained-identity reprojection rejects incompatible clipping neighbors and reduces history confidence at partial disocclusions. Guided spatial filtering fades with retained sample count. Optional per-pixel log-luminance variance guides spatial filtering. More complete motion validation and separate diffuse/specular history remain open. | [SVGF](https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/), [RTXPT design](https://github.com/NVIDIA-RTX/RTXPT/blob/main/Docs/Design.md) |
| Materials and assets | The shipped subset handles common metallic/roughness materials, cutouts, smooth glass, specular maps and clearcoat. Mip-zero material sampling, the per-frame texture binding budget, and missing deformation all affect ordinary asset fidelity. Rough refraction, nested media and further glTF extensions need distinct acceptance scenes. | [Khronos glTF material extensions](https://www.khronos.org/gltf/pbr) |
| Research frontier | Production-oriented native examples use hardware traversal with next-event estimation, reconstruction, and optional reservoirs or radiance caches. Recent reservoir methods improve reuse for difficult paths, but introduce state, visibility checks and history rejection costs. Their native performance figures cannot predict a portable browser implementation. | [RTXPT design](https://github.com/NVIDIA-RTX/RTXPT/blob/main/Docs/Design.md), [ReSTIR PT Enhanced](https://research.nvidia.com/labs/rtr/publication/lin2026restirptenhanced/) |

### Priority and acceptance gates

1. **Measure convergence and latency.** Capture static chart, small emissive source, glTF
   material, and animated displacement scenes at fixed seeds. Compare linear HDR error
   against an analytic result or an independently converged reference in the same material
   model. Track error versus elapsed GPU time and samples, plus frame-time percentiles,
   history rejection, and logical allocation size. Keep tone-mapped comparisons for visible
   artifacts. Record the browser, hardware and resolution. Report GPU timings only when the
   optional timestamp feature is available, and distinguish logical allocations from peak VRAM.
2. **Fix the estimator before adding reuse.** Pair light-sampled and BSDF-sampled paths with
   MIS, including emitter-hit PDFs, delta events, and the uniform/power emitter selection
   mixture. Validate mean radiance across seeds and check variance at equal GPU cost. Add
   importance-sampled environment lighting separately from the display backdrop. Evaluate
   spatial light sampling or reservoirs only if many-light scenes remain the bottleneck.
3. **Make motion and shadows predictable.** Gate temporal improvements on measured ghosting
   at moving silhouettes, glossy highlights and exposure changes. Track variance separately
   from history confidence. Compare transmissive shadow approximations against a reference
   with a neutral receiver and known attenuation, and measure opaque visibility regressions.
4. **Prioritize asset gaps by visible impact.** Add texture footprints and mip selection for
   distant detail, then expand material and deformation support using representative glTF
   fixtures. Keep transport changes such as rough dielectric transmission separate from
   localized shading changes. Validate energy, UV selection, retained updates, and query
   behavior on each feature.
5. **Profile before changing traversal architecture.** Use timings and traversal statistics
   to compare better build topology, wide nodes, and queue-based stages against the existing
   graph. A wavefront design can reduce divergence but adds queue traffic. Keep the existing
   portable path as the baseline. Treat hardware traversal and neural reconstruction as
   future backend options with their own portability and performance evidence.

The lightmap-baking example owns a separate UV-space lighting pipeline. Diagnose blocky
baked shadows by checking shadow-map projection/filtering and atlas texel density before
changing ANARI's interactive ray tracer.

### Performance plan

Optimize for time to a usable preview during motion and GPU time to an HDR error
target for stills. Keep render resolution, seed, and sample budgets fixed when
comparing throughput. Use pose-matched references when comparing motion quality.
Run the chart baseline, glossy motion, textured glTF, and a larger instanced
scene on an integrated GPU and a discrete GPU before choosing numeric targets.

| Order | Work | Acceptance |
| --- | --- | --- |
| P1 · Attribute GPU cost | Use GPU Command Graph timestamp reports to separate BLAS/TLAS build or refit, sparse history carry, trace, and presentation. Add opt-in sampled counters for primary, guide, shadow, and continuation rays and for TLAS/BLAS node and triangle visits. Keep browser startup and queue latency separate from GPU execution. | Publish warm/cold costs, p50/p95 frame times, GPU time versus pose-matched HDR error, and logical allocation size. Report timestamps as unavailable on unsupported devices. Run instrumented counters separately so they do not distort timing. |
| P2 · Eliminate redundant work | The trace shader intersects a center guide ray before tracing jittered samples. Skip that traversal where history and presentation do not consume guides, or retain the guide while camera, geometry, visibility, and resolution are stable. Measure sparse history carry separately. It reads and writes untouched pixels even when pacing reduces tracing. Prototype tile-local history updates if carry becomes a material share of GPU time. | Preserve seeded radiance, history confidence, debug views, and sparse-batch behavior. Compare full-coverage and paced frames at equal effective sample counts. |
| P3 · Reduce cost per ray | Test position-only triangle traversal and fetch full attributes for winning hits or alpha-tested candidates. The current packed triangle record is 224 bytes and includes shading data. Keep the existing CORE storage-binding budget. The analytic-light evaluator scans the light list per hit even when rotating shadow samples. Visit only the selected indices and keep ambient light separate. Evaluate weighted light selection for many-light scenes with matching PDFs. | Measure node/triangle visits, trace time, and HDR error at equal GPU cost. Preserve alpha visibility and picking. Compare lighting mean and variance against the all-lights reference. |
| P4 · Improve hierarchy quality | Use P1 counters to identify poor Morton trees or refit degradation. Try quality-triggered rebuilds and a higher-quality static BLAS builder before changing traversal format. Evaluate a compact wide hierarchy if node traffic still dominates on large assets. | Report build, refit, and trace cost separately and find the number of reused frames needed to repay a more expensive build. [Parallel high-quality BVH construction](https://research.nvidia.com/publication/2013-07_fast-parallel-construction-high-quality-bounding-volume-hierarchies) |
| P5 · Prototype a staged tracer | The current trace dispatch mixes primary traversal, shading, shadow visibility, and continuation loops. If P1–P4 still leave a material divergence cost, prototype a bounded shadow or continuation queue as GPU Command Graph passes. Retain the existing path as the benchmark control. | Include compaction, queue memory traffic, and pass overhead in time-to-quality comparisons. Adopt the staged path only for workloads where it improves end-to-end results. [Mapping path tracing to the GPU](https://pbr-book.org/4ed/Wavefront_Rendering_on_GPUs/Mapping_Path_Tracing_to_the_GPU) |

P1 now exposes per-pass timing reports and opt-in sampled traversal counters through
the capture harness. The multi-device baseline and numeric targets remain open.

P2 skips guide traversal and guide metadata traffic when no pass consumes the
guides. Stationary frames reuse valid guide metadata when history can use
same-pixel radiance. Full batches skip the sparse carry pass. The capture
harness supports fixed batch phase counts and checks completed samples.

The submission budget controller manages latency by pacing ray batches. Compare
it at matched sample counts before attributing any throughput gain to it.

### Next implementation tranches

| Tranche | Scope | Acceptance |
| --- | --- | --- |
| M0d · Convergence baseline | Extend the deterministic capture workflow with a small emissive source and a textured glTF scene. Record linear HDR error, samples, elapsed time, and the browser and GPU used. | Reproduce a fixed-seed capture and publish error-versus-samples and error-versus-time measurements against an analytic or independently converged reference. Report GPU time when timestamps are available. |
| M2g · Emissive geometry MIS | Pair existing emitter sampling with BSDF sampling, including the emitter-hit PDF under both uniform and power-weighted selection. Preserve the contribution of delta paths. | Verify mean radiance across seeds for both selection modes. Compare variance at equal GPU cost on the small-emitter fixture. |
| M2h · Environment lighting | Add an explicit environment-light input and importance-sampled directions. Combine environment and BSDF samples with MIS. Keep the display backdrop independently configurable. | Compare constant-environment illumination against an analytic reference and test convergence with a small bright region in the environment map. Verify that changing the backdrop leaves illumination unchanged. |
| M3r · Secondary-ray texture filtering | Propagate a footprint through secondary paths and use it for material mip selection on triangle hits. | Verify that receding texture detail filters in reflections and indirect illumination. Use the existing fixed-seed captures to check for regressions in primary shading. Track filtered cutout visibility separately because it affects intersection and picking behavior. |

Use M0d to establish the reference scenes and measurements for M2g and M2h.
The capture harness supports fixed-seed sweeps for the small-emitter and Antique Camera glTF
scenes with display RGB and pre-presentation linear HDR comparisons and elapsed wall time.
Optional WebGPU timestamps measure scene pass cost. Paired uniform and power emitter
sweeps record linear RGB error over the common range of measured GPU costs. M3r carries the camera footprint to secondary triangle hits
in both diffuse and PBR transport. Filtered cutout visibility remains a separate tranche.

The first M2h increment adds constant environment radiance and pairs uniform-solid-angle
samples with diffuse and PBR continuation using MIS. The directional increment uses a
luminance-weighted solid-angle distribution and verifies a single bright texel against an
analytic irradiance reference.

The visibility tranche adds opt-in camera-footprint filtering for mipmapped triangle
cutouts, shared by primary color and queries. A separate PBR option approximates
tinted straight-line shadows through thin diffuse-transmission layers for analytic
lights. With cutout filtering enabled, continuation and explicit light samples
share a camera footprint propagated along the path. This includes triangle
emitter endpoints and analytic-light shadow blockers. Finite analytic visibility
rays now aim at the light from their biased origin. The opt-in shadow mode applies
Beer–Lambert attenuation to index-matched analytic spheres and clips that
attenuation at point and spot light endpoints. Bent and nested dielectric
connections remain open.


The reconstruction benchmark compares unfiltered, spatial, and variance-guided
presentation at fixed seeds and shared measured GPU costs. Motion captures can
toggle reprojection against an independently sampled, stationary reference at
the exact target pose. The Chart Motion and glossy motion workflows measure
linear HDR recovery error versus new samples and GPU time after the pose stops.
The report compares both modes at shared GPU budgets and records HDR error
tails to expose localized failures that whole-frame RMSE can hide.
Stationary PBR paths now accumulate without reprojection clipping, while glossy
guides reject stale history during movement. The glossy benchmark can gate the
final HDR error relative to a pose-matched temporal-off control. Broader
ghosting acceptance scenes remain open.


The first glTF vertex fidelity increment applies retained morph position and
normal deltas in ray geometry and interpolates `COLOR_0`. The vertex alpha
factor participates in triangle mask visibility and sampled emitter endpoints.
The next increment preserves glTF unlit base color and interpolates authored
tangents, including handedness and morph deltas. Skeletal skinning now supports retained CPU joint palettes with four influences
per vertex, after morphing positions, normals, and tangents. GPU-only and
per-instance palettes remain open on the ray path. Compatible CPU pose updates refresh packed triangles and refit mesh and
scene hierarchies on the GPU in their retained triangle and primitive order.
Periodic Morton rebuilds restore spatial ordering. Structural changes and pose
changes that alter the packed layout rebuild the graphs. Deformation still
invalidates progressive history.

The ray tracer now supports glTF alpha blending through stochastic surface
coverage for camera, continuation, and shadow rays. Explicit emitter samples
weight radiance by coverage. Hit queries skip fully transparent layers.

Smooth PBR transport supports RGB dispersion. Explicit mesh sidedness applies
to ray visibility, and closed transmissive meshes keep both interfaces.

Opt-in rough dielectric continuation uses GGX facet sampling for Fresnel reflection
and refraction. Light-sampled rough dielectric connections and nested media remain open.


The next transport increment adds analytic-light connections at nondispersive
exterior rough dielectric interfaces and tracks IOR and absorption through
properly nested closed shells. Rough dielectric area/environment MIS and bent
light connections through nested media remain open.

Opt-in separate diffuse and specular histories split the first PBR interaction while
using the same sampling PDF and light connections. Sparse batches carry both lobes
and their confidence, and presentation and HDR readback use the linear composite.
Run the pose-matched motion benchmark with `--separate-lobe-histories` to measure
recovery against the temporal-off control. Omit the flag for the combined-history
baseline.
