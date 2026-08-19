import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# ANARI Materials and Lights

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="neutral">Private workspace</DocumentationBadge>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
</DocumentationBadges>

Retained ANARI materials translate directly into the canonical `@luma.gl/shadertools` PBR
uniforms and texture bindings. ANARI does not own a separate BRDF or shader implementation.
Lights reuse the shared ambient, directional, point, and spot lighting descriptions.

## `ANARIMaterial`

```ts
const material = anariDevice.newMaterial('physicallyBased', {
  baseColor: [0.18, 0.52, 0.96, 0.8],
  metallic: 0.7,
  roughness: 0.25,
  alphaMode: 'blend',
  clearcoat: 0.35
});
```

The supported subtypes are `matte` and `physicallyBased`. Both share these parameters:

```ts
type ANARIMaterialParameters = {
  color?: ANARIVector3 | ANARIVector4;
  baseColor?: ANARIVector3 | ANARIVector4;
  emissive?: ANARIVector3;
  emissiveStrength?: number;
  metallic?: number;
  roughness?: number;
  opacity?: number;
  alphaMode?: 'opaque' | 'mask' | 'blend';
  alphaCutoff?: number;
  doubleSided?: boolean;
  unlit?: boolean;
  specularColor?: ANARIVector3;
  specularIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  dispersion?: number;
  thickness?: number;
  attenuationDistance?: number;
  attenuationColor?: ANARIVector3;
  indexOfRefraction?: number;
  sheenColor?: ANARIVector3;
  sheenRoughness?: number;
  iridescence?: number;
  iridescenceIndexOfRefraction?: number;
  iridescenceThicknessMinimum?: number;
  iridescenceThicknessMaximum?: number;
  anisotropyStrength?: number;
  anisotropyRotation?: number;
  anisotropyDirection?: readonly [number, number];
  normalScale?: number;
  occlusionStrength?: number;
  baseColorTexture?: ANARISampler;
  metallicRoughnessTexture?: ANARISampler;
  normalTexture?: ANARISampler;
  occlusionTexture?: ANARISampler;
  emissiveTexture?: ANARISampler;
  specularColorTexture?: ANARISampler;
  specularIntensityTexture?: ANARISampler;
  transmissionTexture?: ANARISampler;
  thicknessTexture?: ANARISampler;
  clearcoatTexture?: ANARISampler;
  clearcoatRoughnessTexture?: ANARISampler;
  clearcoatNormalTexture?: ANARISampler;
  sheenColorTexture?: ANARISampler;
  sheenRoughnessTexture?: ANARISampler;
  iridescenceTexture?: ANARISampler;
  iridescenceThicknessTexture?: ANARISampler;
  anisotropyTexture?: ANARISampler;
};
```

### Core material factors

| Parameter | Default | Meaning |
| --- | --- | --- |
| `baseColor`, `color` | `[0.8, 0.8, 0.8]` | Linear RGB/RGBA base color; `baseColor` takes precedence. |
| `metallic` | `0` | Metallic factor; `matte` materials always use zero. |
| `roughness` | `0.38` physically based; `0.92` matte | Surface roughness. |
| `emissive`, `emissiveStrength` | `[0, 0, 0]`, `1` | Linear emitted color and intensity. |
| `normalScale`, `occlusionStrength` | `1`, `1` | Normal-map and occlusion-map multipliers. |
| `opacity` | Base-color alpha, otherwise `1` | Explicit opacity overriding the color's alpha component. |
| `alphaMode` | `blend` when opacity is below one; otherwise `opaque` | Explicit `opaque`, `mask`, or `blend` rendering mode. |
| `alphaCutoff` | `0.5` | Fragment-discard threshold when `alphaMode` is `mask`. |
| `doubleSided` | `true` | Whether both triangle faces are rendered. |
| `unlit` | `false` | Whether the canonical material bypasses lighting. |

### Extension material factors

| Parameters | Meaning |
| --- | --- |
| `specularColor`, `specularIntensity` | Dielectric specular color and strength. |
| `clearcoat`, `clearcoatRoughness` | Secondary surface coating and coating roughness. |
| `transmission`, `thickness` | Screen-space transmission strength and medium thickness. |
| `dispersion` | Nonnegative chromatic transmission spread using the ratified glTF 20/Abbe-number parameterization; defaults to zero. |
| `attenuationColor`, `attenuationDistance`, `indexOfRefraction` | Transmitted-light tint, attenuation distance, and IOR. |
| `sheenColor`, `sheenRoughness` | Cloth-like sheen response. |
| `iridescence`, `iridescenceIndexOfRefraction` | Thin-film iridescence strength and film IOR. |
| `iridescenceThicknessMinimum`, `iridescenceThicknessMaximum` | Authored iridescent film thickness range. |
| `anisotropyStrength`, `anisotropyRotation`, `anisotropyDirection` | Directional highlight response. |

When a retained material has nonzero `transmission`, ANARI's shared
[experimental SceneRenderer](/docs/api-reference/experimental/scene-renderer) automatically
captures opaque scene color and samples it for screen-space refraction. Thickness, attenuation,
index of refraction, chromatic dispersion, and roughness shape the transmitted result. Opaque
radiance is captured in linear HDR when supported, then exposed and tone-mapped only after the
physical material response. This is a single opaque-scene capture, not ray tracing or arbitrary
layered refraction. ANARI inherits this behavior from the shared renderer and does not implement a
separate transmission pass.

### Supported image maps

Every retained image sampler maps to its existing canonical PBR texture binding:

| Material parameter | Texture contents | Color space |
| --- | --- | --- |
| `baseColorTexture` | Base color and optional alpha. | sRGB |
| `metallicRoughnessTexture` | Roughness in green; metallic in blue. | Linear |
| `normalTexture` | Tangent-space surface normals. | Linear |
| `occlusionTexture` | Ambient-occlusion data. | Linear |
| `emissiveTexture` | Emitted color. | sRGB |
| `specularColorTexture` | Dielectric specular color. | sRGB |
| `specularIntensityTexture` | Dielectric specular intensity. | Linear |
| `transmissionTexture` | Transmission factor. | Linear |
| `thicknessTexture` | Volume thickness. | Linear |
| `clearcoatTexture` | Clearcoat intensity. | Linear |
| `clearcoatRoughnessTexture` | Clearcoat roughness. | Linear |
| `clearcoatNormalTexture` | Clearcoat tangent-space normals. | Linear |
| `sheenColorTexture` | Sheen color. | sRGB |
| `sheenRoughnessTexture` | Sheen roughness. | Linear |
| `iridescenceTexture` | Iridescence strength. | Linear |
| `iridescenceThicknessTexture` | Thin-film thickness. | Linear |
| `anisotropyTexture` | Anisotropy direction and strength. | Linear |

Color textures should be uploaded with an sRGB format; data textures should use a linear format.
Avoid applying an additional shader-side sRGB conversion to textures already decoded by hardware.

### Samplers, UV transforms, and secondary coordinates

```ts
const image = graphicsDevice.createTexture({
  width: 256,
  height: 256,
  format: 'rgba8unorm-srgb',
  sampler: {
    addressModeU: 'repeat',
    addressModeV: 'mirror-repeat',
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: 'linear'
  },
  data: imageData
});

const imageSampler = anariDevice.newSampler('image2D', {
  image,
  textureCoordinateSet: 1,
  transform: [1, 0, 0, 0, 1, 0, 0.25, 0, 1]
});

material.setParameter('baseColorTexture', imageSampler).commitParameters();
```

Addressing and filtering belong to the underlying luma.gl `Texture`. The retained ANARI sampler
adds a column-major 3×3 transform and selects `0` or `1`, corresponding to geometry
`'vertex.attribute1'` / `TEXCOORD_0` or `'vertex.attribute2'` / `TEXCOORD_1`.

The showcase glTF importer reuses `@luma.gl/gltf` helpers to retain authored wrap modes,
nearest/linear filters, mipmapping, slot-specific UV transforms, and source color-space choices.

### Dynamic material updates

```ts
material
  .setParameters({alphaMode: 'mask', alphaCutoff: 0.35, doubleSided: false})
  .commitParameters();

frame.render();
```

Committed uniform changes update the shared cached material. Structural changes, including alpha
mode and face-culling changes, select the appropriate shared renderer pipeline on later renders.
Emission affects a surface's appearance but does not automatically illuminate surrounding objects;
add a separate light when that behavior is needed.

## Image-based lighting

An ANARI renderer can use existing, caller-owned image-based lighting textures:

```ts
const renderer = anariDevice.newRenderer('default', {
  environment: {
    diffuseTexture,
    specularTexture,
    brdfLUTTexture,
    intensity: 1,
    rotation: Math.PI / 4
  }
});
```

Supply the complete diffuse/specular/BRDF texture set to enable the existing shared environment
shader. ANARI forwards these resources to the
[experimental SceneRenderer](/docs/api-reference/experimental/scene-renderer); it does not
generate cubemaps or implement its own environment shader. Existing prefiltered source textures
can be loaded with `@luma.gl/gltf`'s `loadPBREnvironment()` helper, or generated from an
equirectangular source through the shared
[`PBREnvironmentGenerator`](/docs/api-reference/experimental/pbr-environment).

## `ANARILight`

```ts
const light = anariDevice.newLight('spot', {
  position: [0, 5, 3],
  direction: [0, -1, -0.5],
  color: [0.8, 0.9, 1],
  intensity: 24,
  openingAngle: Math.PI / 5,
  falloffAngle: Math.PI / 8
});
```

The supported light subtypes are `ambient`, `directional`, `point`, and `spot`.

```ts
type ANARILightParameters = {
  color?: ANARIVector3;
  direction?: ANARIVector3;
  position?: ANARIVector3;
  intensity?: number;
  irradiance?: number;
  radiance?: number;
  openingAngle?: number;
  falloffAngle?: number;
};
```

| Parameter | Used by | Meaning |
| --- | --- | --- |
| `color` | All lights | Linear RGB light color; defaults to `[1, 1, 1]`. |
| `direction` | `directional`, `spot` | World-space light direction. |
| `position` | `point`, `spot` | World-space light position. |
| `intensity` | All lights | General strength fallback. |
| `irradiance` | `directional` | Directional strength; overrides `intensity`. |
| `radiance` | `ambient` | Ambient strength; overrides `intensity`. |
| `openingAngle` | `spot` | Outer cone angle in radians; defaults to `0.5`. |
| `falloffAngle` | `spot` | Inner cone angle in radians; defaults to `openingAngle * 0.7`. |

glTF showcase import reuses `parseGLTFLights(gltf, {useByteColors: false})`, preserving authored
world transforms, linear light color, intensity, and both spotlight cone angles.

Lights attached to instanced groups are collected, but group instance transforms are not applied
to their positions or directions; specify world-space light parameters. As with other retained
objects, changed light parameters become visible after `commitParameters()`.
