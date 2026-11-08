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
matrix. Area lights, environment integration, normal-map perturbations, multi-bounce GI and
baked specular are outside this implementation. Supply sampled punctual lights to approximate
an extended emitter over successive updates. The baker does not jitter lights automatically.

## Accumulation and recording

`update(options)` records one sample and returns `{lightmapTexture}`. `sampleCount` increases
only after the draw callback completes. Sample n receives weight 1/(n+1). The first sample
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

Both backends require renderable/filterable float targets. Default format is `rgba16float`;
`rgba32float` is accepted only when supported. Unsupported capabilities fail explicitly, with
no SDR fallback. Match bake model color attachment formats when overriding the baker format.

The [PBR Shadows example](/examples/api/pbr-shadows) includes Live/Baking/Baked modes with a
fixed-UV plane, sample count and reset control. File encoding/export remains application supplied.
