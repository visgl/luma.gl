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
| T5: hybrid composition and advanced diagnostics | Raster/ray composition, GPU-stage timings, traversal counters, renderer capability reporting, and debug visualization channels. | Basic graph node/pass/CPU-encoding counters are implemented; hybrid composition, GPU timings, and advanced diagnostics remain planned. |
