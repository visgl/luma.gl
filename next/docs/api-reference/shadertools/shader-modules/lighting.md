# lighting

[lighting](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lighting.md)[dirlight](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/dirlight.md)[lambertMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lambert-material.md)[gouraudMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/gouraud-material.md)[phongMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/phong-material.md)[pbrMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md)

The `lighting` shader module collects scene lighting into a single uniform block that can be shared across draw calls. It is the common light source module used by

* [`lambertMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lambert-material.md),
* [`phongMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/phong-material.md),
* [`gouraudMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/gouraud-material.md),
* [`pbrMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md).

## Bind Group Convention[​](#bind-group-convention "Direct link to Bind Group Convention")

The module's bindings are currently assigned to bind group `2`. This reflects the recommended luma.gl convention of treating lighting as scene-level data that is stable across many draw calls.

See the [Bind Groups and Bindings Guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md) for details on how grouped bindings are declared and supplied.

## Props[​](#props "Direct link to Props")

For the uniform descriptor syntax behind the module's packed light array, see [Core Shader Types](https://luma.gl/next/docs/api-reference/core/shader-types.md).

### `enabled?: boolean`[​](#enabled-boolean "Direct link to enabled-boolean")

Enables or disables lighting calculations for the module.

### `useByteColors?: boolean`[​](#usebytecolors-boolean "Direct link to usebytecolors-boolean")

When `true`, light colors are interpreted in the legacy `0..255` convention. When `false`, light colors are interpreted directly as floats, which also enables HDR-style values above `1`.

Phase 1 keeps `useByteColors` enabled by default for backward compatibility.

### `lights?: Light[]`[​](#lights-light "Direct link to lights-light")

![From-v9.3](https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square)

Preferred API for supplying lights. The array can contain:

* `AmbientLight`
* `PointLight`
* `SpotLight`
* `DirectionalLight`

Ambient lights contribute to `ambientColor`. Point, spot, and directional lights are packed into a fixed-size light array in the module's uniform block.

### Legacy props[​](#legacy-props "Direct link to Legacy props")

The following legacy props are still accepted and are normalized to the same uniform layout:

* `ambientLight?: AmbientLight`
* `pointLights?: PointLight[]`
* `spotLights?: SpotLight[]`
* `directionalLights?: DirectionalLight[]`

## Light Types[​](#light-types "Direct link to Light Types")

### `AmbientLight`[​](#ambientlight "Direct link to ambientlight")

```
type AmbientLight = {
  type: 'ambient';
  color?: [number, number, number];
  intensity?: number;
};
```

### `PointLight`[​](#pointlight "Direct link to pointlight")

```
type PointLight = {
  type: 'point';
  position: [number, number, number];
  color?: [number, number, number];
  intensity?: number;
  attenuation?: [number, number, number];
};
```

### `SpotLight`[​](#spotlight "Direct link to spotlight")

![From-v9.3](https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square)

```
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

### `DirectionalLight`[​](#directionallight "Direct link to directionallight")

```
type DirectionalLight = {
  type: 'directional';
  direction: [number, number, number];
  color?: [number, number, number];
  intensity?: number;
};
```

By default colors are specified in the existing `0..255` convention used by the material modules. Set `useByteColors: false` to work directly with float colors.

## Uniform Layout[​](#uniform-layout "Direct link to Uniform Layout")

On the JavaScript side you work with `lights: Light[]`. On the GPU side the module uses a fixed-size, portable uniform buffer layout:

```
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

This gives the shader a trailing array of `5` light structs. The counts tell the shader how many entries are active:

* Point lights occupy `lights[0..pointLightCount-1]`
* Spot lights occupy the next `spotLightCount` entries
* Directional lights occupy the next `directionalLightCount` entries
* Ambient lights do not consume array slots

Additional non-ambient lights beyond `5` are truncated and logged as a warning.

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderInputs} from '@luma.gl/engine';
import {lighting, phongMaterial} from '@luma.gl/shadertools';

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

`ShaderInputs` preserves the nested `lights` array shape at the module API boundary. `UniformStore` and `ShaderBlockWriter` flatten it internally for portable std140 packing. See [Core Shader Types](https://luma.gl/next/docs/api-reference/core/shader-types.md) for the general rules behind that flow.

## Shader Functions[​](#shader-functions "Direct link to Shader Functions")

### `lighting_getPointLight(index)`[​](#lighting_getpointlightindex "Direct link to lighting_getpointlightindex")

Returns the packed point light at `index`.

### `lighting_getSpotLight(index)`[​](#lighting_getspotlightindex "Direct link to lighting_getspotlightindex")

![From-v9.3](https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square)

Returns the packed spot light at `index`.

### `lighting_getDirectionalLight(index)`[​](#lighting_getdirectionallightindex "Direct link to lighting_getdirectionallightindex")

Returns the packed directional light at `index`.

### `getPointLightAttenuation(pointLight, distance)`[​](#getpointlightattenuationpointlight-distance "Direct link to getpointlightattenuationpointlight-distance")

Returns the attenuation factor for a point light.

### `getSpotLightAttenuation(spotLight, positionWorldspace)`[​](#getspotlightattenuationspotlight-positionworldspace "Direct link to getspotlightattenuationspotlight-positionworldspace")

![From-v9.3](https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square)

Returns the attenuation factor for a spot light, including cone falloff.

## Remarks[​](#remarks "Direct link to Remarks")

* The fixed-size trailing array is intentional. Runtime-sized uniform arrays are not portable across the WebGL2 and WebGPU backends supported by luma.gl.
* The module's uniform block is designed to be stable for an entire scene and reused across multiple material modules and draw calls.
