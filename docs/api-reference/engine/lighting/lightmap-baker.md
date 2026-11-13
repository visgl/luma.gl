# Progressive lightmap baking

`LightmapBaker` records texture-space lighting samples and accumulates their arithmetic mean.
Use it for static geometry with caller-supplied nonoverlapping atlas UVs. It creates linear
irradiance **E**, compatible with `pbr_lightmapSampler`: the receiver applies its diffuse material
response and divides by pi. This is single-bounce diffuse light accumulation, without specular,
emission, albedo or feedback from an existing lightmap.

```typescript
import {LightmapBaker, createPBRLightmapModel} from '@luma.gl/engine/lighting';

const baker = new LightmapBaker(device, {width: 512, height: 512});
const model = createPBRLightmapModel(device, {geometry, material, receiveShadows: true});

const preview = baker.update({
  prepareSample: ({sampleIndex}) => {
    // Upload transforms and sampled/jittered lighting; prepare shadow maps here.
    model.shaderInputs.setProps({lighting, shadow, pbrShadow});
  },
  drawSample: ({renderPass}) => model.draw(renderPass)
});
// Record a receiver using preview.lightmapTexture, then submit through the application.
```

## Bake models

`createPBRLightmapModel(device, options)` returns an ordinary `Model` borrowing its material.
It reuses PBR transforms, skinning, instancing, geometric normals and alpha-cutout logic.
Supply normals and UVs. The default atlas UV set is `TEXCOORD_1`; CPU geometry keys and explicit
buffer layouts are preserved. Per-model props in `lightmapBake` are:

- `uvSet`: 0 or 1, default 1.
- `uvTransform`: column-major 3×3 atlas transform, default identity.
- `chartId`: positive integer, default 1. Use unique IDs for islands requiring separate gutters.
  IDs must be exactly representable by the target format (1–2048 is safe for rgba16float).

Set `ALPHA_CUTOFF` and the material's cutoff controls as for a visible model. Transparent
blending and overlapping UVs are unsupported: each covered texel represents one surface.
Alpha in bake targets is chart coverage, not material opacity.

Ambient, directional, point and spot lights use the shared lighting inputs. Optional shadow
maps attenuate matching direct lights; directional cascades use the supplied receiver view
matrix. Area lights, automatic environment integration, normal-map perturbations, multi-bounce GI and
baked specular are outside this implementation. Supply sampled punctual lights to approximate
an extended emitter over successive updates. The baker does not jitter lights automatically.

## Accumulation and recording

`update(options)` records one sample and returns `{lightmapTexture}`. `sampleCount` increases
only after the draw callback completes. Sample n receives weight 1/(n+1). History uses unfiltered rgba32float storage; preview/export conversion uses the selected output format, so half-float rounding does not discard late history updates. The first sample
replaces cleared history. Callback failures end the render pass and leave previous accumulation
and count intact. Submit pending commands before retrying a failed sample.

Record one update per baker per submission. Submit before changing uniforms for another sample,
resizing or releasing referenced resources. All operations record work without implicit submission
or CPU readback. Use separate bakers for independently recorded atlases.

`reset()` resets the count and schedules clears at the next update. Geometry, UVs, transforms,
coverage, material masks or light-distribution changes require an explicit reset. Preview storage
may alternate; reacquire and rebind the returned texture each frame. After reset, the previous
preview pixels remain until the next update. `resize({width, height})` replaces targets and resets
history; unchanged dimensions preserve it.

## Chart-safe gutters

Optional `dilationSteps` (0–16) fills one neighboring texel per step. Supply a same-device,
same-resolution `chartTexture`: red stores the permitted chart ID for each covered/gutter texel,
zero outside all chart regions. Values are linear numeric IDs, not normalized byte labels.
Dilation only copies neighbors with that chart ID. This prevents leakage between adjacent
islands. The application supplies unwraps, packing and chart ownership masks.

Dilation affects preview/export only; padded pixels never enter accumulation. Without a chart
texture and positive step count, uncovered pixels remain zero.

## Ownership and stable results

The baker owns its sample, accumulation and dilation targets, framebuffers and filter models.
It borrows the chart texture and callback resources. `textures` exposes the current borrowed
preview. `destroy()` is idempotent and releases only baker-owned resources.

`createResult()` records a copy and returns a `LightmapBakeResult` with an independent
`textures.lightmapTexture`. Submit the copy before consuming its result or destroying/replacing its source. The
result survives baker destruction and owns its texture until `result.destroy()`.

Both backends require renderable rgba32float history and renderable/filterable float output targets. Default format is `rgba16float`;
`rgba32float` is accepted only when supported. Unsupported capabilities fail explicitly, with
no SDR fallback. Match bake model color attachment formats when overriding the baker format.

The [Lightmap Baking example](/examples/api/lightmap-baking) includes Live/Baking/Baked modes,
sample count, reset and HDR export/reload controls.


## Environment sampling

`sampleLightmapEnvironment(environment, sampleIndex, sampleCount)` produces a directional light
sample from caller-owned, linear RGB equirectangular radiance. Row zero is the north pole;
longitude zero points along +X and increases toward +Z. The fixed-budget sequence samples uniform
solid angle, weights radiance by `4π`, and leaves the cosine term to the bake shader. Use
`lighting.useByteColors: false`. Constant radiance L converges to irradiance πL on an unoccluded plane.

Use `directionToLight` to prepare a directional shadow map before drawing each sample; use the
returned `light` for the bake model's lighting props. Shadow visibility is evaluated by the existing
bake model. The sampler borrows CPU pixels and allocates no GPU resources. Choose the sample budget
before starting; changing it or changing radiance requires resetting accumulation. Uniform sampling
can converge slowly around small bright emitters. This is direct environment illumination, without
interreflection, importance sampling, image decoding or automatic sky updates.

## Portable HDR results

- `readLightmapData(texture, uvSet = 1)` explicitly submits pending work and performs asynchronous
  readback of a float16/float32 texture into independent float32 RGBA CPU data. Call it outside open
  render/compute passes. Keep the source alive until the promise resolves.
- `encodeLightmapData(data)` returns an independent binary `ArrayBuffer`; `decodeLightmapData(buffer)`
  returns an independent CPU copy. The LML1 container stores dimensions, UV set, linear irradiance E
  and chart coverage in alpha. Values receive no tone mapping or color conversion.
- `createLightmapFromData(device, data, format = 'rgba16float')` returns an owned `LightmapBakeResult`.
  Half-float upload rounds values and rejects nonfinite/out-of-range values instead of saturating HDR.
  Explicit float32 output requires float32 filtering support. CPU input remains caller-owned.

LML1 consists of four little-endian uint32 words (magic `0x314c4d4c`, width, height, UV set), followed
by tightly packed little-endian float32 RGBA. Rows follow increasing texture V, starting at V=0.
It is a luma-specific transport format, not an EXR or Radiance HDR image. Geometry, chart transforms,
scene identity and bake settings remain application metadata; reloading requires matching UVs.

The [Lightmap Baking example](/examples/api/lightmap-baking) uses two static rooms connected by a
doorway, warm/cool lights and colored objects. The solid divider intersects the floor and back wall. The example uses a 1024×512 atlas and 1024px point/cascaded-directional shadow maps; no light probes are involved. It offers progressive baking, a frozen result, explicit
stale/reset behavior, chart-owned gutter padding, export and reload. Unsupported float-rendering devices receive an explanatory message before bake resources are allocated. Live mode uses direct shadowed lights with unoccluded ambient
as a reference; baked mode adds shadowed environment illumination and disables duplicate live diffuse
lighting. Camera movement does not alter the bake. Materials provide object color at receiving time;
this workflow does not simulate multi-bounce color bleeding.

## Preparing atlas UVs

`createLightmapAtlas(inputs, options)` prepares CPU triangle-list geometry for a shared bake.
Each input has a unique application `id`, a `Geometry`, and an optional affine `modelMatrix`.
Options specify `width`, `height`, world-space `texelsPerUnit`, `padding` (default 2,
0–16), and `uvSet` (default 1). It uses deterministic height-sorted shelf packing;
if the requested density does not fit, it throws instead of silently reducing quality.

```typescript
import {createLightmapAtlas, validateLightmapAtlas} from '@luma.gl/engine/lighting';

const atlas = createLightmapAtlas(
  [{id: 'room', geometry: roomGeometry, modelMatrix}],
  {width: 1024, height: 1024, texelsPerUnit: 32, padding: 2}
);
console.log(validateLightmapAtlas(atlas)); // []
const chartTexture = device.createTexture({
  width: atlas.width,
  height: atlas.height,
  format: 'r32float',
  data: atlas.chartOwners
});
```

Use each returned mesh's `geometry` for both the visible PBR receiver and its bake models.
For each `atlas.charts` entry, find the mesh with the matching `meshId`, create a
`createPBRLightmapModel` with its `firstVertex` and `vertexCount`, and set
`lightmapBake.chartId` to the chart's `id`. Apply the same model transform supplied during
preparation. Pass `chartTexture` and `dilationSteps: atlas.padding` to `LightmapBaker.update`.
The caller owns and destroys all GPU textures and models; preparation allocates none.

The result owns independent, deindexed attribute arrays. Positions remain in object space;
world-space transforms affect density measurements only. Numeric storage, normalization,
custom attribute names, and the other UV set are preserved. Source geometry and explicit
source shader buffer layouts are untouched; output layouts are synthesized for the new
packed attributes. Inputs must have tightly packed per-vertex attributes, a `POSITION`
attribute, and nondegenerate triangles. Instancing, interleaved attributes, skinning and
morph deformation must be resolved by the caller before preparing a static bake.

The initial implementation assigns one planar chart per triangle. It supports arbitrary
triangle meshes without a seam-selection dependency, but uses more space and bake draw
calls than an optimized chart unwrapper. At most 2048 charts are supported so IDs remain
exact in the default half-float bake target. Increase density for thin triangles that are
smaller than a raster sample. Packing is deterministic for the same ordered inputs and
options; preserve these alongside exported lightmaps, or persist the returned geometry.
Texture serialization does not serialize mesh geometry or atlas layout.

`validateLightmapAtlas(atlas)` performs an explicit diagnostic pass for chart bounds,
rectangle overlap, draw ranges, UV bounds, and gutter ownership. It returns an array of
messages and does not modify the atlas. `getLightmapAtlasDebugData(atlas)` returns independent
RGBA8 chart colors suitable for `ImageData`; black pixels are unallocated. `occupancy`
reports the fraction reserved by chart rectangles, including padding, rather than actual
triangle coverage. All pixel coordinates and ownership/debug arrays run top-to-bottom.


### Static example scenes

The Lightmap Baking example defaults to Courtyard & Arcade and retains Two Rooms,
Sculpture Gallery, Architectural Light Wells, Workshop, and Material Pavilion.
WebGPU combines direct/environment samples with two-bounce diffuse transport from
ANARI. Only the indirect term receives a small chart-local spatial filter; direct
shadow detail and chart boundaries are preserved. This is progressive Monte Carlo
baking, so early samples can be noisy.

Example exports use a `.lmb` envelope carrying the scene identity and atlas revision
around the standard engine lightmap payload. Loading a different scene is rejected
before upload. The public `encodeLightmapData` / `decodeLightmapData` format remains
unchanged. Applications using those lower-level APIs own scene/layout association.
