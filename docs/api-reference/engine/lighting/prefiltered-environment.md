# PrefilteredEnvironment

`PrefilteredEnvironment` prepares image-based lighting (IBL) from an equirectangular
texture. It produces a GGX-filtered specular cubemap, a diffuse irradiance cubemap, and
a split-sum BRDF lookup for use in rendering models.

Import it from `@luma.gl/engine/lighting`. Filtering runs on WebGL and WebGPU, and the
generated textures can be used independently of the preparation pipeline.

```typescript
import {createPrefilteredEnvironment} from '@luma.gl/engine/lighting';

// source is a caller-owned equirectangular Texture on the same device.
const environment = createPrefilteredEnvironment(device, {
  source,
  sourceEncoding: 'linear',
  size: 64,
  sampleCount: 128
});

// Use a Model whose shaders declare the IBL bindings and USE_IBL define.
model.setBindings(environment.getBindings());
// Supply the material shader with environment.textures.specularTexture.mipLevels.
// Intensity, rotation, exposure and tone mapping belong to the consuming renderer.

// After the last use:
environment.destroy();
source.destroy();
```

See the standalone [roughness/metalness grid example](https://github.com/visgl/luma.gl/tree/master/examples/api/prefiltered-environment).

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `source` | required | Live 2D equirectangular texture on the generator's device. |
| `sourceEncoding` | `'linear'` | Use `'srgb'` to decode an ordinary unorm source. Hardware sRGB textures are decoded by sampling, without a second conversion. |
| `size` | `64` | Specular cube face width; the full mip chain is generated. |
| `irradianceSize` | `16` | Diffuse cube face width. |
| `brdfLUTSize` | `128` | Square split-sum lookup size; ignored when borrowing a LUT. |
| `sampleCount` | `64` | Importance samples per output texel, clamped to 1–1024. |
| `format` | `'rgba16float'` | Renderable, linearly filterable output format. Explicitly select `'rgba8unorm'` only when LDR clipping is acceptable. |
| `brdfLUTTexture` | generated | Optional borrowed 2D LUT on the same device, using the convention below. |

Dimensions are floored and clamped to at least one. The default format must be supported;
the engine helper does not silently downgrade HDR radiance. Outputs are linear-light textures:
choose a linear color format, not an sRGB or integer format. Source sampling uses the source's
sampler; equirectangular images generally need repeat in U and clamp-to-edge in V.

## Texture contract

`environment.textures` contains ordinary Core textures:

- `diffuseTexture`: one-mip cube storing cosine-weighted diffuse irradiance **divided by pi**.
  A constant environment remains constant. Do not divide this value by pi a second time.
- `specularTexture`: GGX-prefiltered cube with a full mip chain. Sample at
  `perceptualRoughness * (mipLevels - 1)`. GGX alpha is perceptual roughness squared.
- `brdfLUTTexture`: 2D split-sum lookup; sample RG at `(NdotV, 1 - perceptualRoughness)`.
  Combine prefiltered radiance with `F0 * lookup.r + lookup.g`.

Cube layers follow `+X, -X, +Y, -Y, +Z, -Z`. Equirectangular coordinates are
`u = atan2(z, x) / (2*pi) + 0.5`, `v = acos(y) / pi`. Rotation is not baked into outputs.
The implementation uses fixed-count importance sampling, not a hierarchical or incremental filter.

`getBindings()` maps these textures to `pbr_diffuseEnvSampler`, `pbr_specularEnvSampler`
and `pbr_brdfLUT`, as declared by the shared `ibl` shader module. It does not enable material
shader defines or set scene uniforms.

## Reuse and ownership

```typescript
import {PrefilteredEnvironmentGenerator} from '@luma.gl/engine/lighting';

const generator = new PrefilteredEnvironmentGenerator(device);
const first = generator.prepare({source: firstSource});
const second = generator.prepare({
  source: secondSource,
  brdfLUTTexture: first.textures.brdfLUTTexture
});

generator.destroy(); // Generated textures remain usable.
second.destroy();    // Releases only its own two cubes.
first.destroy();     // Also releases the shared LUT; destroy borrowers first.
```

Each result owns its generated textures and borrows the source and any supplied LUT.
`destroy()` is idempotent. Failed preparation releases textures allocated by that call.
The caller must keep a borrowed LUT alive until all consumers have finished using it.
The generator owns only its reusable integration model; changing formats replaces that model.
The one-shot helper destroys its generator before returning the result.

`prepare()` records and submits work. It does **not** wait for GPU completion. Subsequent
sampling on the same device follows queue order. CPU readback needs the usual asynchronous
readback path. Caller-controlled command recording, cancellation, caching, source cubemaps,
progressive updates, and automatic invalidation are outside this API.

