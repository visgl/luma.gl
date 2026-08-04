# ANARI Materials and Lights

![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)![Private workspace](https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square)![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)

Materials define how a surface responds to light. Lights are attached to a world or an instanced group and contribute ambient, directional, point, or spot illumination.

## `ANARIMaterial`[​](#anarimaterial "Direct link to anarimaterial")

```
new ANARIMaterial(

  device: ANARIDevice,

  subtype: ANARIMaterialSubtype,

  parameters?: ANARIMaterialParameters

);



newMaterial(

  subtype: 'matte' | 'physicallyBased',

  parameters?: ANARIMaterialParameters

): ANARIMaterial;
```

### Material parameters[​](#material-parameters "Direct link to Material parameters")

```
type ANARIMaterialParameters = {

  color?: ANARIVector3 | ANARIVector4;

  baseColor?: ANARIVector3 | ANARIVector4;

  emissive?: ANARIVector3;

  emissiveStrength?: number;

  metallic?: number;

  roughness?: number;

  opacity?: number;

  alphaMode?: 'opaque' | 'blend';

  clearcoat?: number;

  clearcoatRoughness?: number;

  iridescence?: number;

  transmission?: number;

  indexOfRefraction?: number;

  sheenColor?: ANARIVector3;

  sheenRoughness?: number;

  normalScale?: number;

  occlusionStrength?: number;

  baseColorTexture?: ANARISampler;

  normalTexture?: ANARISampler;

  metallicRoughnessTexture?: ANARISampler;

  emissiveTexture?: ANARISampler;

  occlusionTexture?: ANARISampler;

  clearcoatTexture?: ANARISampler;

  transmissionTexture?: ANARISampler;

  sheenColorTexture?: ANARISampler;

};
```

| Parameter                           | Default                                              | Meaning                                                                                   |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `baseColor`                         | `color`, then `[0.8, 0.8, 0.8]`                      | Linear RGB or RGBA surface color. Takes precedence over `color`.                          |
| `color`                             | `[0.8, 0.8, 0.8]`                                    | Alternate surface color when `baseColor` is not supplied.                                 |
| `emissive`                          | `[0, 0, 0]`                                          | Linear RGB radiance added without external illumination.                                  |
| `emissiveStrength`                  | `1`                                                  | Multiplier applied to `emissive`.                                                         |
| `metallic`                          | `0`                                                  | Metallic response for `physicallyBased`; forced to `0` for `matte`.                       |
| `roughness`                         | `0.38` for `physicallyBased`; `0.92` for `matte`     | Width of diffuse/specular response.                                                       |
| `opacity`                           | Alpha component of the selected color, otherwise `1` | Surface opacity. Values below `1` enable alpha blending when the model is first compiled. |
| `alphaMode`                         | —                                                    | Accepted parameter; the current runtime chooses blending from `opacity`, not `alphaMode`. |
| `clearcoat`                         | `0`                                                  | Additional glossy clearcoat response.                                                     |
| `clearcoatRoughness`                | `0.18`                                               | Width of the clearcoat highlight.                                                         |
| `iridescence`                       | `0`                                                  | Angle-dependent spectral color effect.                                                    |
| `transmission`, `indexOfRefraction` | `0`, `1.5`                                           | Approximate glass transmission and Fresnel response.                                      |
| `sheenColor`, `sheenRoughness`      | `[0, 0, 0]`, `0.5`                                   | Cloth-like grazing response.                                                              |
| `normalScale`, `occlusionStrength`  | `1`, `1`                                             | Multipliers for sampled normal and occlusion maps.                                        |

### Image samplers[​](#image-samplers "Direct link to Image samplers")

```
const sampler = anariDevice.newSampler('image2D', {

  image: texture,

  transform: [1, 0, 0, 0, 1, 0, 0, 0, 1]

});
```

`image2D` samplers retain a luma.gl `Texture` and an optional column-major 3×3 UV transform. Assign them to `baseColorTexture`, `normalTexture`, `metallicRoughnessTexture`, `emissiveTexture`, `occlusionTexture`, `clearcoatTexture`, `transmissionTexture`, or `sheenColorTexture`. glTF metallic-roughness maps follow the standard green roughness / blue metallic packing.

Values are not automatically clamped or validated. Treat metallic, roughness, opacity, clearcoat, and iridescence as normalized values unless intentionally experimenting with the implementation.

### Matte materials[​](#matte-materials "Direct link to Matte materials")

```
const matte = anariDevice.newMaterial('matte', {

  color: [0.72, 0.2, 0.12],

  roughness: 0.8

});
```

`matte` forces metallic response to zero. It defaults to roughness `0.92`, but an explicitly supplied `roughness` is respected.

### Physically based materials[​](#physically-based-materials "Direct link to Physically based materials")

```
const metal = anariDevice.newMaterial('physicallyBased', {

  baseColor: [0.18, 0.52, 0.96],

  metallic: 0.9,

  roughness: 0.16,

  clearcoat: 0.35,

  iridescence: 0.2

});
```

The current shader combines a GGX-style specular term, Schlick Fresnel, diffuse response, optional clearcoat, and an angle-dependent iridescence approximation.

### Emissive materials[​](#emissive-materials "Direct link to Emissive materials")

```
const emitter = anariDevice.newMaterial('physicallyBased', {

  baseColor: [0.06, 0.12, 0.18],

  emissive: [0.2, 0.8, 1],

  emissiveStrength: 8,

  metallic: 0,

  roughness: 0.35

});
```

Emission changes the surface's appearance but does not automatically create a light. Add a colocated [`ANARILight`](#anarilight) when nearby objects should also receive illumination.

### Dynamic updates[​](#dynamic-updates "Direct link to Dynamic updates")

```
metal.setParameters({roughness: 0.08, metallic: 1}).commitParameters();

frame.render();
```

Committed material values are uploaded on subsequent renders. However, transparency pipeline state is chosen when a surface model is first compiled; changing an already compiled material from opaque to transparent does not currently rebuild blending state.

## `ANARILight`[​](#anarilight "Direct link to anarilight")

```
new ANARILight(

  device: ANARIDevice,

  subtype: ANARILightSubtype,

  parameters?: ANARILightParameters

);



newLight(

  subtype: 'ambient' | 'directional' | 'point' | 'spot',

  parameters?: ANARILightParameters

): ANARILight;
```

### Light parameters[​](#light-parameters "Direct link to Light parameters")

```
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

| Parameter      | Used by               | Default                                              | Meaning                                                                        |
| -------------- | --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `color`        | All lights            | `[1, 1, 1]`                                          | RGB light color.                                                               |
| `direction`    | `directional`, `spot` | `[0, -1, -1]` for directional; `[0, -1, 0]` for spot | World-space light direction.                                                   |
| `position`     | `point`, `spot`       | `[0, 0, 0]`                                          | World-space light position.                                                    |
| `intensity`    | All lights            | `1`                                                  | General light-strength fallback.                                               |
| `irradiance`   | `directional`         | `intensity`, then `1`                                | Directional-light strength.                                                    |
| `radiance`     | `ambient`             | `intensity`, then `1`                                | Ambient-light strength.                                                        |
| `openingAngle` | `spot`                | `0.5` radians                                        | Outer spotlight cone angle. The inner angle is currently `openingAngle * 0.7`. |
| `falloffAngle` | None currently        | —                                                    | Accepted but not consumed by the current spotlight implementation.             |

The renderer also supplies a base ambient light using `renderer.ambientRadiance`, which defaults to `0.12`.

### Ambient lights[​](#ambient-lights "Direct link to Ambient lights")

```
const ambient = anariDevice.newLight('ambient', {

  color: [0.4, 0.55, 0.8],

  radiance: 0.25

});
```

Ambient lights have no position or direction. `radiance` takes precedence over `intensity`.

### Directional lights[​](#directional-lights "Direct link to Directional lights")

```
const sunlight = anariDevice.newLight('directional', {

  direction: [-0.7, -1, -0.35],

  color: [1, 0.91, 0.74],

  irradiance: 2.2

});
```

Directional lights have no position. `irradiance` takes precedence over `intensity`.

### Point lights[​](#point-lights "Direct link to Point lights")

```
const point = anariDevice.newLight('point', {

  position: [2, 3, 1],

  color: [1, 0.35, 0.12],

  intensity: 30

});
```

Point lights use a fixed attenuation configuration in the current runtime. Add them directly to a world or to a group referenced by an instance.

### Spot lights[​](#spot-lights "Direct link to Spot lights")

```
const spotlight = anariDevice.newLight('spot', {

  position: [0, 5, 3],

  direction: [0, -1, -0.5],

  color: [0.8, 0.9, 1],

  intensity: 24,

  openingAngle: Math.PI / 5

});
```

Spotlights use fixed attenuation. The current implementation derives the inner cone automatically and ignores `falloffAngle`.

### Committing animated lights[​](#committing-animated-lights "Direct link to Committing animated lights")

```
function updateLight(time: number): void {

  point

    .setParameter('position', [Math.cos(time) * 3, 2, Math.sin(time) * 3])

    .commitParameters();

}
```

Light changes remain invisible until committed. Group-attached lights are collected from instanced groups, but group instance transforms are not currently applied to light positions or directions; provide world-space light parameters explicitly.
