import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {ShaderModuleDocsTabs} from '@site/src/components/docs/shader-module-docs-tabs';

# lighting

<ShaderModuleDocsTabs group="lighting" active="lighting" />

The `lighting` shader module collects scene lighting into a single uniform block
that can be shared across draw calls. It is the common light source module used
by 
- [`lambertMaterial`](/docs/api-reference/shaders/shader-modules/lambert-material),
- [`phongMaterial`](/docs/api-reference/shaders/shader-modules/phong-material),
- [`gouraudMaterial`](/docs/api-reference/shaders/shader-modules/gouraud-material),
- [`pbrMaterial`](/docs/api-reference/shaders/shader-modules/pbr-material).

## Bind Group Convention

The module's bindings are currently assigned to bind group `2`. This reflects
the recommended luma.gl convention of treating lighting as scene-level data that
is stable across many draw calls.

See the [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings) for
details on how grouped bindings are declared and supplied.

## Props

For the uniform descriptor syntax behind the module's packed light array, see
[Core Shader Types](/docs/api-reference/core/shader-types).

### `enabled?: boolean`

Enables or disables lighting calculations for the module.

### `useByteColors?: boolean`

When `true`, light colors are interpreted in the legacy `0..255` convention.
When `false`, light colors are interpreted directly as floats, which also enables HDR-style values above `1`.

Phase 1 keeps `useByteColors` enabled by default for backward compatibility.

### `lights?: Light[]`

<DocumentationBadges>
  <DocumentationBadge tone="version">From v9.3</DocumentationBadge>
</DocumentationBadges>

Preferred API for supplying lights. The array can contain:

- `AmbientLight`
- `PointLight`
- `SpotLight`
- `DirectionalLight`
- `AreaLight` (`rect` or `disk`, evaluated by PBR materials)

Ambient lights contribute to `ambientColor`. Point, spot, and directional
lights are packed into a fixed-size light array in the module's uniform block.

### Legacy props

The following legacy props are still accepted and are normalized to the same
uniform layout:

- `ambientLight?: AmbientLight`
- `pointLights?: PointLight[]`
- `spotLights?: SpotLight[]`
- `directionalLights?: DirectionalLight[]`

## Light Types

### `AmbientLight`

```ts
type AmbientLight = {
  type: 'ambient';
  color?: [number, number, number];
  intensity?: number;
};
```

### `PointLight`

```ts
type PointLight = {
  type: 'point';
  position: [number, number, number];
  color?: [number, number, number];
  intensity?: number;
  attenuation?: [number, number, number];
};
```

### `SpotLight`

<DocumentationBadges>
  <DocumentationBadge tone="version">From v9.3</DocumentationBadge>
</DocumentationBadges>

```ts
type SpotLight = {
  type: 'spot';
  position: [number, number, number];
  direction: [number, number, number];
  color?: [number, number, number];
  intensity?: number;
  attenuation?: [number, number, number];
  innerConeAngle?: number;
  outerConeAngle?: number;
};
```

### `DirectionalLight`

```ts
type DirectionalLight = {
  type: 'directional';
  direction: [number, number, number];
  color?: [number, number, number];
  intensity?: number;
};
```

By default colors are specified in the existing `0..255` convention used by the material
modules. Set `useByteColors: false` to work directly with float colors.

## Uniform Layout

On the JavaScript side you work with `lights: Light[]`. On the GPU side the
module uses a fixed-size, portable uniform buffer layout:

```ts
{
  enabled: 'i32',
  directionalLightCount: 'i32',
  pointLightCount: 'i32',
  spotLightCount: 'i32',
  ambientColor: 'vec3<f32>',
  lights: [
    {
      color: 'vec3<f32>',
      position: 'vec3<f32>',
      direction: 'vec3<f32>',
      attenuation: 'vec3<f32>',
      coneCos: 'vec2<f32>'
    },
    5
  ]
}
```

This gives the shader a trailing array of `5` light structs. The counts tell
the shader how many entries are active:

- Point lights occupy `lights[0..pointLightCount-1]`
- Spot lights occupy the next `spotLightCount` entries
- Directional lights occupy the next `directionalLightCount` entries
- Ambient lights do not consume array slots

Additional non-ambient lights beyond `5` are truncated and logged as a warning.

## Usage

```ts
import {ShaderInputs} from '@luma.gl/engine';
import {lighting, phongMaterial} from '@luma.gl/shaders';

const shaderInputs = new ShaderInputs({lighting, phongMaterial});

shaderInputs.setProps({
  lighting: {
    useByteColors: false,
    lights: [
      {type: 'ambient', color: [1, 1, 1], intensity: 0.1},
      {type: 'point', color: [1, 0.47, 0.04], position: [2, 4, 3]},
      {
        type: 'spot',
        color: [0.31, 0.63, 1],
        position: [-3, -2, 2],
        direction: [3, 2, -2],
        innerConeAngle: 0.2,
        outerConeAngle: 0.6
      },
      {type: 'directional', color: [1, 1, 1], direction: [0, -1, 0]}
    ]
  }
});
```

`ShaderInputs` preserves the nested `lights` array shape at the module API
boundary. `UniformStore` and `ShaderBlockWriter` flatten it internally for
portable std140 packing. See
[Core Shader Types](/docs/api-reference/core/shader-types) for the general
rules behind that flow.

## Shader Functions

### `lighting_getPointLight(index)`

Returns the packed point light at `index`.

### `lighting_getSpotLight(index)`

<DocumentationBadges>
  <DocumentationBadge tone="version">From v9.3</DocumentationBadge>
</DocumentationBadges>

Returns the packed spot light at `index`.

### `lighting_getDirectionalLight(index)`

Returns the packed directional light at `index`.

### `getPointLightAttenuation(pointLight, distance)`

Returns the attenuation factor for a point light.

### `getSpotLightAttenuation(spotLight, positionWorldspace)`

<DocumentationBadges>
  <DocumentationBadge tone="version">From v9.3</DocumentationBadge>
</DocumentationBadges>

Returns the attenuation factor for a spot light, including cone falloff.

## Remarks

- The fixed-size trailing array is intentional. Runtime-sized uniform arrays are
  not portable across the WebGL2 and WebGPU backends supported by luma.gl.
- The module's uniform block is designed to be stable for an entire scene and
  reused across multiple material modules and draw calls.

### `AreaLight` and LTC PBR shading

```ts
import {createAreaLightLTCTextures, type Light} from '@luma.gl/shaders';

const lights: Light[] = [{
  type: 'rect',
  position: [0, 2, 0],
  halfAxisX: [1, 0, 0],
  halfAxisY: [0, 0, 0.5],
  normal: [0, -1, 0],
  color: [1, 0.9, 0.8],
  intensity: 1000 // luminance in nits
}];
const lookup = createAreaLightLTCTextures(device);
// Compile the PBR model with defines: {USE_AREA_LIGHT_LTC: true}.
model.shaderInputs.setProps({
  lighting: {lights, useByteColors: false},
  bindings: lookup.bindings
});
// Destroy consuming models before lookup.destroy().
```

`halfAxisX` and `halfAxisY` are orthogonal world-space half extents (radii for disks). `normal` selects the emitting side. Up to four area lights are packed after the existing punctual-light fields; existing offsets are preserved, but the uniform buffer grows. Area lights do not consume punctual light slots.

LTC supports diffuse, isotropic GGX and clearcoat. Disk emitters use an inscribed 32-gon. Sheen, anisotropy and diffuse transmission use the numerical fallback. The LUT textures are caller-owned and required only for models compiled with the LTC define; they use portable RGBA16F with manual bilinear interpolation. The legacy `areaLighting` props remain available as an alternate source; avoid supplying the same light through both collections.

Area lights are not evaluated by Lambert, Phong or Gouraud. Neither LTC nor the numerical fallback provides shadows or indirect illumination.

For the LTC paper citation, fitted-table provenance and retained license notice, see
[Attributions and Credits](/docs/credits#area-lighting-ltc).
