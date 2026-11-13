# Ray-tracing renderer

This page describes the `raytrace` renderer selected by an `ANARIFrame`.
See [cameras, renderers, and frames](/docs/api-reference/anari/anari-rendering)
for shared parameters and frame lifecycle.

```ts
const renderer = anariDevice.newRenderer('raytrace', {
  background: [0.012, 0.016, 0.04, 1],
  samplesPerPixel: 1,
  maxBounces: 1,
  progressive: true,
  shadows: true,
  resolutionScale: 0.5,
  minimumResolutionScale: 0.25,
  adaptiveResolution: true,
  targetFrameTimeMilliseconds: 33.3,
  temporalReprojection: true,
  shadowSamplesPerFrame: 1
});

frame.setParameter('renderer', renderer).commitParameters();
```

`raytrace` requires WebGPU. The ANARI adapter translates committed scene objects into descriptors
for the shared `RayTracingSceneRenderer` in `@luma.gl/anari`. Its GPU compute graph derives
world-space object bounds, Morton-sorts active object/instance leaves into an explicit retained
permutation, builds and refits a graph-owned complete-binary TLAS, and traverses that hierarchy for
nearest-hit rays and early-exit hard shadows. Transform-only animation gathers updated bounds
through the retained permutation and refits without sorting; topology changes and periodic spatial
refreshes rebuild the Morton order. A topology-only graph Morton-sorts each mesh's triangles into
GPU-built BLASes, which transform-only updates reuse. It traces transformed analytic spheres and
triangle meshes, including tessellated quads, cylinders, and cones; evaluates ambient, directional,
point, and spot lights; and presents the result through a fullscreen pass. An `rgba16float` canvas
or caller-owned framebuffer preserves HDR radiance; ordinary targets use the same configurable
tone-mapping and exact sRGB transfer as forward rendering. Scalar metallic-roughness materials use
GGX distribution, Smith visibility, Schlick Fresnel, and energy-balanced diffuse lighting. The
trace pass uses exactly eight storage buffers, and every TLAS or BLAS construction pass remains
within the default WebGPU CORE limit of eight storage buffers.

The default half-resolution internal target traces one quarter as many pixels as the output canvas.
When adaptive quality is enabled, the renderer can reduce scale to `0.25`, spread interleaved pixel
coverage across frames, and rotate one shadowed direct light per frame. It approaches the configured
frame budget using smoothed animation-frame intervals; no GPU timestamp feature is required. The
fullscreen presentation pass upsamples the internal HDR result.

Progressive history is reprojected through previous camera matrices and stable ANARI instance/group/
surface identities. Depth and normal validation plus bounded neighborhood color clamping reject
incompatible history; camera cuts, changed topology/materials, changed light counts, and target
resizing invalidate it. GPU acceleration updates are encoded only for changed geometry or transforms,
while camera-only and lighting-only frames reuse the retained TLAS. Transform-only frames use the
retained-permutation gather/refit graph; topology changes and periodic refreshes use the full Morton
build graph.

The Morton-sorted TLAS accelerates object and instance selection, while intersected meshes traverse
GPU-built Morton-sorted triangle BLASes. Hardware ray tracing and SAH/Karras hierarchy topology are
not implemented. Skeletal skinning, morph-target displacement, alpha blending, normal maps,
and advanced PBR material extensions require raster rendering; deferred uses its forward fallback for unsupported materials.

Base-color, emissive, metallic/roughness and transmission maps support UV sets 0/1 and UV transforms,
with explicit mip-zero sampling and up to 14 distinct textures per frame. `MASK` multiplies the
base-color factor alpha by the sampled base-color map alpha before comparing with `alphaCutoff`.
Cutouts apply to primary/secondary rays, shadows, explicit emitter samples, picking and primary-hit
channels. Rejected triangles do not hide deeper triangles in the same mesh; analytic spheres check
both interfaces. `OPAQUE` ignores texture alpha; alpha blending and transparent shadows remain unsupported.
Replacing a map or changing its UV metadata invalidates history. After an in-place texture upload,
increment the scene material version (or commit its retained ANARI material) before rendering.
Diffuse secondary transport is opt-in through `maxBounces` (0–8). Each bounce samples a
cosine-weighted hemisphere and gathers emission and existing direct lighting at the next hit,
so matte surfaces receive color bleeding and emissive illumination. The scalar diffuse
throughput in `transportMode: 'diffuse'` is base color × 0.96 × (1 − metallic).
`transportMode: 'pbr'` additionally samples GGX reflection and smooth dielectric transmission with IOR. Rough transmission, absorption and nested media are not implemented. Misses contribute no indirect radiance: `background` is a display color, not an
environment light. Ambient lights and fog retain the existing per-hit approximations.

`samplingSeed` controls primary and diffuse paths. Pixel, frame, sample, and bounce indices
separate samples; unchanged progressive frames converge through the existing bounded history.
Seed and bounce-budget changes invalidate accumulation. With diffuse bounces enabled,
geometry, placement, material and light changes reset history even when temporal reprojection
is enabled: primary-hit metadata cannot validate indirect illumination. Camera movement resets
history when temporal reprojection is disabled; otherwise it uses the existing primary-hit
reprojection and camera-cut rejection.
Use a stationary scene, full resolution, disabled adaptive resolution and temporal reprojection,
and multiple progressive frames for comparison. Small emitters can converge slowly under the default BSDF-only emission gathering.
Opt-in explicit emitter sampling, opaque GGX transport and spatial denoising are available;
MIS, transmissive transport, advanced temporal denoising and volumes remain planned.

For the rationale behind the TLAS/BLAS split, Morton ordering, refit policy, megakernel execution,
and temporal reconstruction policy, see
[ray-tracing technique background and tradeoffs](/docs/api-guide/engine/anari-architecture#ray-tracing-technique-background-and-tradeoffs).

Applications can also
[register custom renderer runtimes](/docs/api-reference/anari/anari-device#registering-renderer-runtimes).
