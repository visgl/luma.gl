---
title: ANARI renderer architecture
description: Understand forward, deferred, and graph-based ray-tracing architecture, caching, and performance.
---

import {AnariGuideDocsTabs} from '@site/src/components/docs/anari-guide-docs-tabs';

# ANARI renderer architecture

<AnariGuideDocsTabs active="architecture" />

## Understand the renderer architecture

Each raster `frame.render()` performs the following work:

1. Resolve the frame's committed world, camera, and renderer.
2. Collect directly attached world surfaces and surfaces reached through world instances.
3. Group placements by retained surface object identity.
4. Select the registered forward or deferred renderer runtime from the committed renderer subtype.
5. Reuse or rebuild one luma.gl `Model` per distinct surface.
6. Upload four per-instance matrix-column vertex buffers.
7. Translate ANARI materials into luma.gl material uniforms and texture bindings.
8. Translate world and group lights into the renderer's lighting representation.
9. Configure camera, exposure, fog, debug mode, and HDR uniforms.
10. Issue one instanced draw per distinct surface.
11. Optionally run renderer-owned composition such as bloom or deferred lighting.
12. Return surface, instance, draw-call, and triangle statistics.

The ANARI adapter does not own a second shader or material pipeline. It translates retained
objects into the format-independent
[`SceneRenderer`](/docs/api-reference/experimental/scene-renderer),
[`DeferredSceneRenderer`](/docs/api-reference/experimental/deferred-scene-renderer), or
`RayTracingSceneRenderer` descriptors from `@luma.gl/experimental`. The shared forward runtime uses
WGSL shaders on WebGPU and equivalent GLSL shaders on WebGL 2. The WebGPU deferred path resolves
compatible opaque scenes through the same retained object graph and falls back to forward rendering
for unsupported scene features. The WebGPU ray-tracing path instead uses command-graph compute,
progressive HDR history, and a fullscreen presentation pass.

Applications can add another renderer without changing retained scene objects:

```ts
anariDevice.registerRenderer(
  'customRaymarch',
  graphicsDevice => new CustomRaymarchRuntime(graphicsDevice)
);

const raymarch = anariDevice.newRenderer('customRaymarch');
frame.setParameter('renderer', raymarch).commitParameters();
```

Runtime factories are lazy and device-owned. See
[registering renderer runtimes](/docs/api-reference/anari/anari-device#registering-renderer-runtimes)
for the runtime contract and ownership details.

### Ray-tracing technique background and tradeoffs

#### Software WebGPU, not hardware ray tracing

The `raytrace` subtype is deliberately a software ray tracer. It uses ordinary WebGPU compute
passes, storage buffers, textures, and a fullscreen presentation draw; it does not request a
hardware ray-tracing pipeline or browser-specific adapter feature. That keeps the implementation
portable to default CORE WebGPU, but it also means the renderer owns acceleration-structure
construction, traversal stacks, ray scheduling, and reconstruction itself.

The default WebGPU profile exposes only eight storage-buffer bindings per shader stage; see the
[WebGPU supported-limits table](https://gpuweb.github.io/gpuweb/#limits). The trace shader uses
exactly those eight slots for scene records, TLAS data, and BLAS data. Construction is therefore
split into command-graph passes that each stay at or below the same limit, and data that would be
separate descriptors in a hardware RT API is packed into shared buffers. This constraint is not
just bookkeeping: adding another traversal feature may require packing data, reusing a binding, or
moving work into another graph pass rather than adding one more storage buffer.

#### TLAS and BLAS

**Implemented.** The renderer separates the hierarchy by update frequency. The top-level
acceleration structure (TLAS) stores world-space bounds for analytic objects and mesh instances.
Each mesh has a bottom-level acceleration structure (BLAS) over its local-space triangles. A ray
first traverses the TLAS; after selecting a mesh instance, it transforms into local space and
traverses that mesh's BLAS. Analytic spheres keep their direct intersection path and do not need
triangle BLAS leaves.

That split avoids duplicating triangle hierarchy data for every instance and makes transform
animation cheaper: a moving instance changes TLAS bounds but not the mesh's local triangle BLAS.
The cost is two nested traversals, extra packed hierarchy memory, and a topology-build phase when
mesh geometry changes. It is still a useful separation even without hardware RT because it gives
the software tracer the same coarse/fine reuse boundary that hardware APIs expose.

#### Morton ordering, LBVH, and SAH

**Implemented, with an important limit.** The GPU build path computes bounds, quantizes centroids,
encodes Morton keys, sorts keys and explicit leaf identifiers, gathers sorted bounds, and refits a
complete-binary hierarchy. Morton order is cheap and parallel because nearby centroids tend to
become nearby leaves. It is an LBVH-style spatial ordering strategy, used for both object/instance
TLAS leaves and per-mesh triangle BLAS leaves. The reusable graph-native sorter resolves inputs of
up to 256 elements with a single-workgroup stable bitonic dispatch and larger inputs with a stable
four-bit radix histogram, prefix scan, and scatter pipeline. `GPUSegmentedSort` additionally groups
many small, independent packed mesh permutations by workgroup width, so arbitrary mesh counts need
at most eight local sorting dispatches. `GPUBVH` similarly fuses hierarchies of up to 128 leaves
into a single workgroup while retaining its level-by-level fallback for larger trees.
`GPUSegmentedBVH` extends that contract across packed independent mesh hierarchies, grouping all
trees of the same leaf capacity into one dispatch and using at most eight capacity buckets. These
are general graph contributors, not ANARI-specific acceleration implementations.

Morton sorting is not the same as a full high-quality BVH builder. In particular, the current code
does not implement the binary-radix-tree topology from
[Karras, “Maximizing Parallelism in the Construction of BVHs, Octrees, and k-d Trees”](https://research.nvidia.com/publication/2012-06_maximizing-parallelism-construction-bvhs-octrees-and-k-d-trees),
and it does not choose splits with the surface-area heuristic (SAH), as described by
[Wald, “On fast Construction of SAH-based Bounding Volume Hierarchies”](https://www.sci.utah.edu/~wald/Publications/2007/ParallelBVHBuild/fastbuild.pdf).
The implemented sorted complete-binary tree is cheaper to build and easy to express in the existing
`GPUBVH` graph, but its traversal quality can be worse for clustered or highly overlapping
geometry. Exact transformed BLAS-root bounds avoid the unnecessary enclosing-sphere overlap of
elongated instances, but Karras-style topology, SAH refinement, wider nodes, and measured traversal
diagnostics remain planned rather than implied by the word “Morton.”

#### Refit versus rebuild

**Implemented.** A topology change builds mesh BLASes and rebuilds the Morton TLAS permutation.
Transform-only animation retains that permutation, gathers updated world-space bounds in the same
leaf order, and refits TLAS parents without rerunning the scene-bounds reduction or sort. Camera,
light, and material-only frames do not encode acceleration work. After a bounded run of refits, the
renderer periodically rebuilds Morton order so large object motion cannot degrade the hierarchy
forever.

Adapters that provide categorized scene revisions avoid materializing transform signatures on every
frame. Other callers materialize transform revisions once and reuse them for primitive changes.
Updated instance records are written directly into their final packed `Float32Array`, avoiding the
previous intermediate JavaScript number arrays and duplicate copied transform matrices. When a
retained adapter reports a small set of stable dirty placements, only their current/inverse
matrices and previous-motion matrices are uploaded; the following frame commits only the remaining
previous-motion slots. Larger updates and replaced descriptors safely use the full packed path.

Nearest-hit and shadow traversal compute guarded inverse ray directions once per world-space ray
and mesh-local ray. Pending TLAS and BLAS stack entries retain their already-computed box entry
distances, avoiding the former second slab test when a queued child is popped. Mesh traversal
starts from its exact BLAS root, analytic spheres evaluate their quadratic intersection only once,
and the CPU publishes the direct-light count so shading does not rescan every light per sample.

Refit is much cheaper than rebuild, but it preserves old leaf neighborhoods even when objects have
moved apart. Rebuild restores spatial quality but pays for bounds reduction, key generation, sort,
gather, and hierarchy propagation. The current policy is intentionally simple and deterministic; a
future policy could use measured overlap, visited-node counts, or build/traversal timing instead of
only a bounded periodic refresh.

#### Megakernel versus wavefront execution

**Implemented now:** one trace megakernel handles primary intersection, direct-light evaluation,
hard shadow rays, temporal history validation, and output writes. For the current direct-light
renderer this avoids queue storage, compaction passes, and extra synchronization, and it keeps
command-graph submission straightforward.

**Planned:** wavefront ray queues and compaction. A megakernel becomes less attractive as materials,
multiple bounces, alpha/transmission, and heterogeneous ray types increase divergence and register
pressure. The wavefront formulation described by
[Laine, Karras, and Aila, “Megakernels Considered Harmful: Wavefront Path Tracing on GPUs”](https://research.nvidia.com/index.php/publication/2013-07_megakernels-considered-harmful-wavefront-path-tracing-gpus)
separates ray generation, intersection, shading, and continuation into queues so each pass does more
coherent work. In WebGPU that also means more graph nodes, queue buffers, scans/compaction, and
indirect dispatch bookkeeping, so it should follow measured pressure from multi-bounce or complex
materials rather than replace the direct-light megakernel preemptively.

#### Target-aware presentation and physically based direct lighting

**Implemented.** Radiance and progressive history remain in linear floating-point textures until a
fullscreen graph render node presents the current frame. That node can render directly into the
canvas or a compatible caller-owned offscreen framebuffer without taking ownership of command
submission. Its pipeline follows the selected target's actual color and depth/stencil formats,
including depthless targets, rather than assuming the canvas format.

Presentation applies the same selected transfer policy as the forward renderer: no tone map,
Reinhard, Khronos PBR Neutral, or ACES, followed by the exact piecewise IEC sRGB transfer function
when software sRGB encoding is required. Floating-point and hardware-sRGB targets preserve linear
shader output by default. Switching incompatible target formats or presentation policies refreshes
the presentation pipeline; switching compatible caller-owned framebuffers does not require a new
graph solely because their identities differ.

Direct lighting evaluates scalar base color, metallic, and roughness with GGX distribution, Smith
visibility, and Fresnel terms while retaining immediate ambient and emissive contributions. All
renderer paths interpret the retained scene's directional-light vector as incoming light; the
forward raster boundary adapts that vector to its shader module's outgoing convention without
mutating shared scene lights. Multiple retained ambient lights are also combined consistently
across forward, deferred, and ray-traced rendering. This closes direct-light and scalar-material
gaps, but does not add material textures, alpha masking, transmission, image-based lighting, or
indirect bounces to the ray tracer.

#### Graph-stage diagnostics

**Implemented without synchronization.** Ray-traced frame statistics expose logical node counts,
physical compute passes, coalesced compute nodes, and synchronous CPU encoding time for the entire
frame and for each graph stage actually encoded. The trace/presentation stage is always present;
topology construction, Morton acceleration rebuild, and retained-order refit appear only when
necessary. Stage counters make camera-only, light-only, topology-changing, and transform-changing
frames distinguishable without GPU readback, timestamp-query requirements, or hidden submission.

These values describe graph recording and scheduling, not GPU execution duration, ray throughput,
hierarchy traversal quality, achieved frames per second, or image quality. Meaningful speed claims
still require workload-controlled measurements against explicit hardware and image-quality targets.

#### Frame budget, sparse sampling, and temporal reconstruction

**Implemented.** The default internal target is half the display width and height, which traces
roughly one quarter of the primary pixels before temporal reuse. Adaptive resolution moves among
bounded scales using smoothed animation-frame intervals and hysteresis. At minimum scale, rotating
interleaved pixel phases spread work across frames; a manual HDR reconstruction pass upscales the
retained result. Direct-light shadow sampling is also bounded and rotated across frames.

Those controls trade instantaneous detail for latency and stability. Lower resolution softens small
features; interleaving leaves some pixels dependent on history; rotating light samples add variance
until accumulation converges. They reduce work without claiming that every frame is a complete,
independent full-resolution render.

**Implemented baseline.** Temporal reprojection uses previous camera matrices and stable retained
instance transforms to find compatible history. Depth, normal, primitive identity, and neighborhood
color checks reject disocclusions and incompatible samples, then valid history increases the
effective sample count. This is temporal sample reuse, not a general frame-interpolation system and
not a full denoiser.

When `samplesPerPixel` is one and both `progressive` and `temporalReprojection` are explicitly
disabled, the centered guide ray also supplies that pixel's radiance sample. This removes animated
subpixel jitter and its otherwise redundant second nearest-hit traversal. Progressive or temporally
reprojected rendering retains separate centered guide and jittered radiance samples, preserving
the normal antialiasing and history-validation behavior.

Color and metadata each use a reusable `GPUTextureHistory` pair. The command graph binds one texture
as the previous frame and the other as the current output, then exchanges their logical roles only
after encoding succeeds. This removes all full-frame history copies without increasing the four
physical history/output allocations. Sparse phases preserve untouched pixels with a densely packed
carry dispatch that is coalesced with ray tracing; full-coverage phases skip that dispatch.

**Planned.** Stronger reconstruction should add variance-guided spatial filtering, adaptive
per-pixel sampling, reactive/disocclusion handling, and a better edge-aware upscaler. The relevant
reference point for low-sample denoising is
[SVGF](https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/), which combines
temporal accumulation, variance estimates, and hierarchical image-space filtering. For many-light
direct illumination, [ReSTIR](https://research.nvidia.com/publication/2020-07_spatiotemporal-reservoir-resampling-real-time-ray-tracing-dynamic-direct)
is a separate future direction: it reuses light-sampling reservoirs spatially and temporally rather
than merely rotating a fixed subset of lights. Neither SVGF nor ReSTIR is implemented by the
current renderer.

| Area | Implemented now | Planned or absent |
| --- | --- | --- |
| Acceleration | Morton-sorted TLAS/BLAS, retained transform refits, tight BLAS-root bounds, batched segmented sort/BVH construction | Karras/SAH topology, wide/compressed nodes, traversal-driven rebuild policy |
| Execution | Direct-light megakernel, hard shadow rays, coalesced graph passes, per-stage node/pass/CPU counters | Wavefront queues, compaction, multi-bounce transport, GPU-stage timings |
| Sampling | Half-resolution default, adaptive scales, interleaved phases, rotating shadow-light samples | Variance-driven adaptive sampling and reservoir-based many-light reuse |
| Reconstruction | Motion-aware temporal reprojection, rejection, neighborhood clamp, manual HDR upscale | SVGF-class denoising, stronger edge-aware upscaling, reactive masks |
| Shading and presentation | Analytic spheres, mesh triangles, scalar metallic/roughness GGX, directional-light parity, target-aware HDR/SDR tone mapping and offscreen output | Full PBR texture parity, alpha/transmission, deformation, indirect bounces |

### Cache invalidation

The runtime rebuilds a compiled model when:

- A structural geometry attribute or its committed layout changes.
- The number of placements for a retained surface changes.
- Alpha mode, sidedness, texture bindings, or another structural material feature changes.
- A previously removed surface becomes visible again.

Transforms, nonstructural material uniforms, joint palettes, and animated morph weights update
without reconstructing geometry. Removing a surface from the world destroys its cached model and
associated instance buffers.

### Practical performance rules

- Reuse surface and group identities for repeated objects.
- Animate committed instance transforms and light parameters instead of recreating entire worlds.
- Avoid retessellating geometry every frame.
- Keep frame size stable unless the drawing buffer actually changes.
- Enable bloom only when the scene benefits from its extra framebuffer and postprocessing passes.
- Check `drawCount` and `instanceCount` to verify that scene reuse translates into actual batching.

## Related pages

- [Declarative ANARI rendering](/docs/api-guide/engine/anari-rendering)
- [ANARI API reference](/docs/api-reference/anari)
- [Engine programming](/docs/api-guide/engine)
