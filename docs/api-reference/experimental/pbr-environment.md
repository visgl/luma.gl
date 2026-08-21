# Physically Based Environment Lighting

[Scene Renderer](https://luma.gl/docs/api-reference/experimental/scene-renderer.md)[Deferred Scenes](https://luma.gl/docs/api-reference/experimental/deferred-scene-renderer.md)[PBR Environments](https://luma.gl/docs/api-reference/experimental/pbr-environment.md)

`PBREnvironmentGenerator` converts a caller-provided equirectangular GPU texture into the three resources required by physically based image-based lighting: a roughness-prefiltered specular cubemap, a diffuse irradiance cubemap, and an integrated BRDF lookup texture. The shared pipeline runs on both WebGPU and WebGL and produces a `PreparedPBREnvironment` accepted directly by [`SceneRenderer`](https://luma.gl/docs/api-reference/experimental/scene-renderer.md).

Environment preparation lives in `@luma.gl/experimental`. Canonical PBR shading remains in `@luma.gl/shadertools`; `@luma.gl/gltf` continues to own its separate loader for already prepared environment images and does not depend on the experimental package.

## Generate an environment[​](#generate-an-environment "Direct link to Generate an environment")

```
import {PBREnvironmentGenerator, SceneRenderer} from '@luma.gl/experimental';



const generator = new PBREnvironmentGenerator(device);



const environment = generator.prepare({

  source: equirectangularTexture,

  sourceEncoding: 'linear',

  size: 128,

  irradianceSize: 32,

  brdfLUTSize: 128,

  sampleCount: 128,

  intensity: 1.2,

  rotation: Math.PI / 6

});



const renderer = new SceneRenderer(device);



renderer.render({

  id: 'environment-lit-scene',

  surfaces,

  camera,

  environment

});

device.submit();



renderer.destroy();

environment.destroy();

generator.destroy();
```

`source` must be a two-dimensional equirectangular `Texture` already uploaded to the same device. Applications remain responsible for loading and decoding an HDR, EXR, or ordinary image before creating that texture. Environment preparation does not fetch URLs or parse image formats.

`prepare()` submits its integration work to the device before returning, so the completed environment can be bound by the next render. This is an explicit convenience behavior of environment preparation; ordinary scene command submission remains the application's responsibility.

## One-shot preparation[​](#one-shot-preparation "Direct link to One-shot preparation")

Use `preparePBREnvironment()` when the integration pipeline does not need to be retained:

```
import {preparePBREnvironment} from '@luma.gl/experimental';



const environment = preparePBREnvironment(device, {

  source: equirectangularTexture,

  size: 64,

  sampleCount: 64

});



renderer.render({...options, environment});

device.submit();



environment.destroy();
```

The helper creates a temporary `PBREnvironmentGenerator`, prepares the resources, and destroys only the temporary integration pipeline. The returned environment remains valid until the caller destroys it.

Keep a `PBREnvironmentGenerator` instance when preparing multiple environments with compatible output formats; it reuses its fullscreen integration model. Switching output formats recreates that model as necessary.

## Preparation options[​](#preparation-options "Direct link to Preparation options")

| Option           | Default                                                          | Meaning                                                                      |
| ---------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `source`         | Required                                                         | Caller-owned, two-dimensional equirectangular source `Texture`.              |
| `sourceEncoding` | Linear sampling                                                  | `linear` for already-linear/HDR input or `srgb` for raw sRGB-encoded texels. |
| `size`           | `64`                                                             | Base width/height of the six-face GGX-prefiltered specular cubemap.          |
| `irradianceSize` | `16`                                                             | Width/height of each cosine-weighted diffuse irradiance face.                |
| `brdfLUTSize`    | `128`                                                            | Width/height of the integrated split-sum BRDF lookup texture.                |
| `sampleCount`    | `64`                                                             | Hammersley importance samples per destination texel; clamped to `1`–`1024`.  |
| `format`         | `rgba16float` when renderable/filterable; otherwise `rgba8unorm` | Shared output texture format.                                                |
| `intensity`      | `1`                                                              | Environment radiance multiplier consumed by `SceneRenderer`.                 |
| `rotation`       | `0`                                                              | Horizontal environment rotation in radians.                                  |

Higher `size`, `irradianceSize`, `brdfLUTSize`, and `sampleCount` values increase preparation cost. The generator renders every cubemap face at every specular mip level, all six irradiance faces, and one BRDF lookup pass. For interactive environment changes, start with the defaults and reuse the generator.

## Generated textures[​](#generated-textures "Direct link to Generated textures")

`PreparedPBREnvironment` implements `SceneEnvironment` and exposes these resources:

| Property          | Resource                                    | Use                                                                                  |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `specularTexture` | Six-face cubemap with a complete mip chain. | GGX-importance-sampled radiance; each mip represents a different material roughness. |
| `diffuseTexture`  | Six-face, single-mip cubemap.               | Cosine-weighted diffuse irradiance.                                                  |
| `brdfLUTTexture`  | Single-mip 2D texture.                      | Split-sum Fresnel/geometry integration.                                              |
| `intensity`       | Mutable number.                             | Scene radiance multiplier.                                                           |
| `rotation`        | Mutable number.                             | Horizontal lighting rotation, in radians.                                            |

The canonical WebGPU/WGSL and WebGL/GLSL PBR shaders use the actual specular cubemap mip count to select roughness-dependent reflection levels. A complete environment requires all three textures; incomplete manually supplied resources leave IBL disabled.

```
console.log(environment.specularTexture.mipLevels);



environment.intensity = 0.8;

environment.rotation = Math.PI / 2;



renderer.render({...options, environment});

device.submit();
```

## Color encoding and HDR[​](#color-encoding-and-hdr "Direct link to Color encoding and HDR")

Floating-point or otherwise linear equirectangular textures should use `sourceEncoding: 'linear'`, or omit `sourceEncoding`:

```
const hdrEnvironment = generator.prepare({

  source: linearFloatingPointTexture,

  sourceEncoding: 'linear'

});
```

Raw sRGB image bytes stored in a linear texture format such as `rgba8unorm` need manual decoding:

```
const decodedEnvironment = generator.prepare({

  source: rawSRGBTexture,

  sourceEncoding: 'srgb'

});
```

An sRGB texture format such as `rgba8unorm-srgb` is decoded automatically by the graphics device. The generator detects that format and never applies an additional manual decode, even when `sourceEncoding: 'srgb'` is provided. Generated lookup and lighting textures remain linear.

The default output preserves HDR values only when `rgba16float` is both renderable and filterable on the active device. Otherwise the generator chooses `rgba8unorm`; that portable fallback does not preserve radiance above the normalized range. Explicit formats must be supported by the selected device.

## Resource ownership[​](#resource-ownership "Direct link to Resource ownership")

The caller retains ownership of the original equirectangular source texture. A prepared environment owns exactly its generated diffuse cubemap, specular cubemap, and BRDF lookup texture. `SceneRenderer` borrows those textures; destroying the renderer does not destroy its environment.

```
renderer.destroy();

environment.destroy();

generator.destroy();

equirectangularTexture.destroy();
```

`PBREnvironmentGenerator.destroy()` releases its reusable integration model only. Existing `PreparedPBREnvironment` instances remain valid. `PreparedPBREnvironment.destroy()` releases the three generated textures but never destroys the source texture or the generator.

## Prepared glTF environments[​](#prepared-gltf-environments "Direct link to Prepared glTF environments")

If cubemap faces and a BRDF lookup texture have already been generated offline, the existing `@luma.gl/gltf` `loadPBREnvironment()` helper can load those images instead:

```
import {loadPBREnvironment} from '@luma.gl/gltf';



const loadedEnvironment = loadPBREnvironment(device, {

  brdfLutUrl: '/environments/studio/brdf-lut.png',

  getTexUrl: (name, face, level) => `/environments/studio/${name}-${face}-${level}.png`,

  specularMipLevels: 6

});



await Promise.all([

  loadedEnvironment.diffuseEnvSampler.ready,

  loadedEnvironment.specularEnvSampler.ready,

  loadedEnvironment.brdfLutTexture.ready

]);



renderer.render({

  ...options,

  environment: {

    diffuseTexture: loadedEnvironment.diffuseEnvSampler.texture,

    specularTexture: loadedEnvironment.specularEnvSampler.texture,

    brdfLUTTexture: loadedEnvironment.brdfLutTexture.texture

  }

});

device.submit();
```

Choose `loadPBREnvironment()` for existing prefiltered assets. Choose `PBREnvironmentGenerator` when the input is an equirectangular GPU texture and the application needs to integrate its own environment at runtime.

## Methods[​](#methods "Direct link to Methods")

### `new PBREnvironmentGenerator(device: Device)`[​](#new-pbrenvironmentgeneratordevice-device "Direct link to new-pbrenvironmentgeneratordevice-device")

Creates a reusable portable integration pipeline owner.

### `prepare(options: PreparePBREnvironmentOptions): PreparedPBREnvironment`[​](#prepareoptions-preparepbrenvironmentoptions-preparedpbrenvironment "Direct link to prepareoptions-preparepbrenvironmentoptions-preparedpbrenvironment")

Generates all cubemap faces, roughness mip levels, diffuse irradiance, and BRDF integration; submits the integration work; and returns a caller-owned complete environment.

### `PBREnvironmentGenerator.destroy(): void`[​](#pbrenvironmentgeneratordestroy-void "Direct link to pbrenvironmentgeneratordestroy-void")

Releases the reusable integration model without destroying source textures or previously prepared environments.

### `preparePBREnvironment(device, options): PreparedPBREnvironment`[​](#preparepbrenvironmentdevice-options-preparedpbrenvironment "Direct link to preparepbrenvironmentdevice-options-preparedpbrenvironment")

Prepares one environment and immediately destroys the temporary integration model.

### `PreparedPBREnvironment.destroy(): void`[​](#preparedpbrenvironmentdestroy-void "Direct link to preparedpbrenvironmentdestroy-void")

Destroys the generated diffuse, specular, and BRDF textures.

## Related pages[​](#related-pages "Direct link to Related pages")

* [`SceneRenderer`](https://luma.gl/docs/api-reference/experimental/scene-renderer.md) documents environment binding, roughness-aware shading, and captured opaque-scene transmission.
* [`DeferredSceneRenderer`](https://luma.gl/docs/api-reference/experimental/deferred-scene-renderer.md) documents automatic forward fallback for image-based lighting and transmissive materials.
* [glTF Materials, Textures, and Lighting](https://luma.gl/docs/api-reference/gltf/gltf-materials.md) documents the format-owned loader for already prepared cubemap images.
