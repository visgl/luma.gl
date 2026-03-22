# lighting

The `lighting` shader module collects scene lighting into a single uniform block
that can be shared across draw calls. It is the common light source module used
by 
- [`lambertMaterial`](/docs/api-reference/shadertools/shader-modules/lambert-material),
- [`phongMaterial`](/docs/api-reference/shadertools/shader-modules/phong-material),
- [`gouraudMaterial`](/docs/api-reference/shadertools/shader-modules/gouraud-material),
- [`pbrMaterial`](/docs/api-reference/shadertools/shader-modules/pbr-material).

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

### `lights?: Light[]`

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

Preferred API for supplying lights. The array can contain:

- `AmbientLight`
- `PointLight`
- `SpotLight`
- `DirectionalLight`

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

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

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

Colors are specified in the existing 0-255 convention used by the material
modules. The module converts them to 0-1 shader values internally.

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
import {lighting, phongMaterial} from '@luma.gl/shadertools';

const shaderInputs = new ShaderInputs({lighting, phongMaterial});

shaderInputs.setProps({
  lighting: {
    lights: [
      {type: 'ambient', color: [255, 255, 255], intensity: 0.1},
      {type: 'point', color: [255, 120, 10], position: [2, 4, 3]},
      {
        type: 'spot',
        color: [80, 160, 255],
        position: [-3, -2, 2],
        direction: [3, 2, -2],
        innerConeAngle: 0.2,
        outerConeAngle: 0.6
      },
      {type: 'directional', color: [255, 255, 255], direction: [0, -1, 0]}
    ]
  }
});
```

`ShaderInputs` preserves the nested `lights` array shape at the module API
boundary. `UniformStore` and `UniformBufferLayout` flatten it internally for
portable std140 packing. See
[Core Shader Types](/docs/api-reference/core/shader-types) for the general
rules behind that flow.

## Shader Functions

### `lighting_getPointLight(index)`

Returns the packed point light at `index`.

### `lighting_getSpotLight(index)`

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

Returns the packed spot light at `index`.

### `lighting_getDirectionalLight(index)`

Returns the packed directional light at `index`.

### `getPointLightAttenuation(pointLight, distance)`

Returns the attenuation factor for a point light.

### `getSpotLightAttenuation(spotLight, positionWorldspace)`

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

Returns the attenuation factor for a spot light, including cone falloff.

## Remarks

- The fixed-size trailing array is intentional. Runtime-sized uniform arrays are
  not portable across the WebGL2 and WebGPU backends supported by luma.gl.
- The module's uniform block is designed to be stable for an entire scene and
  reused across multiple material modules and draw calls.
