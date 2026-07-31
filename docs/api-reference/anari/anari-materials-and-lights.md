# ANARI Materials and Lights

<p className="badges">
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Experimental" />
  <img src="https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square" alt="Private workspace" />
</p>

Materials define how a surface responds to light. Lights are attached to a world or an instanced group and contribute ambient, directional, point, or spot illumination.

## `ANARIMaterial`

```ts
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

### Material parameters

```ts
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
  iridescence?: number;
};
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `baseColor` | `color`, then `[0.8, 0.8, 0.8]` | Linear RGB or RGBA surface color. Takes precedence over `color`. |
| `color` | `[0.8, 0.8, 0.8]` | Alternate surface color when `baseColor` is not supplied. |
| `emissive` | `[0, 0, 0]` | Linear RGB radiance added without external illumination. |
| `emissiveStrength` | `1` | Multiplier applied to `emissive`. |
| `metallic` | `0` | Metallic response for `physicallyBased`; forced to `0` for `matte`. |
| `roughness` | `0.38` for `physicallyBased`; `0.92` for `matte` | Width of diffuse/specular response. |
| `opacity` | Alpha component of the selected color, otherwise `1` | Surface opacity. Values below `1` enable alpha blending when the model is first compiled. |
| `alphaMode` | — | Accepted parameter; the current runtime chooses blending from `opacity`, not `alphaMode`. |
| `clearcoat` | `0` | Additional glossy clearcoat response. |
| `iridescence` | `0` | Angle-dependent spectral color effect. |

Values are not automatically clamped or validated. Treat metallic, roughness, opacity, clearcoat, and iridescence as normalized values unless intentionally experimenting with the implementation.

### Matte materials

```ts
const matte = anariDevice.newMaterial('matte', {
  color: [0.72, 0.2, 0.12],
  roughness: 0.8
});
```

`matte` forces metallic response to zero. It defaults to roughness `0.92`, but an explicitly supplied `roughness` is respected.

### Physically based materials

```ts
const metal = anariDevice.newMaterial('physicallyBased', {
  baseColor: [0.18, 0.52, 0.96],
  metallic: 0.9,
  roughness: 0.16,
  clearcoat: 0.35,
  iridescence: 0.2
});
```

The current shader combines a GGX-style specular term, Schlick Fresnel, diffuse response, optional clearcoat, and an angle-dependent iridescence approximation.

### Emissive materials

```ts
const emitter = anariDevice.newMaterial('physicallyBased', {
  baseColor: [0.06, 0.12, 0.18],
  emissive: [0.2, 0.8, 1],
  emissiveStrength: 8,
  metallic: 0,
  roughness: 0.35
});
```

Emission changes the surface's appearance but does not automatically create a light. Add a colocated [`ANARILight`](#anarilight) when nearby objects should also receive illumination.

### Dynamic updates

```ts
metal.setParameters({roughness: 0.08, metallic: 1}).commitParameters();
frame.render();
```

Committed material values are uploaded on subsequent renders. However, transparency pipeline state is chosen when a surface model is first compiled; changing an already compiled material from opaque to transparent does not currently rebuild blending state.

## `ANARILight`

```ts
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

### Light parameters

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

| Parameter | Used by | Default | Meaning |
| --- | --- | --- | --- |
| `color` | All lights | `[1, 1, 1]` | RGB light color. |
| `direction` | `directional`, `spot` | `[0, -1, -1]` for directional; `[0, -1, 0]` for spot | World-space light direction. |
| `position` | `point`, `spot` | `[0, 0, 0]` | World-space light position. |
| `intensity` | All lights | `1` | General light-strength fallback. |
| `irradiance` | `directional` | `intensity`, then `1` | Directional-light strength. |
| `radiance` | `ambient` | `intensity`, then `1` | Ambient-light strength. |
| `openingAngle` | `spot` | `0.5` radians | Outer spotlight cone angle. The inner angle is currently `openingAngle * 0.7`. |
| `falloffAngle` | None currently | — | Accepted but not consumed by the current spotlight implementation. |

The renderer also supplies a base ambient light using `renderer.ambientRadiance`, which defaults to `0.12`.

### Ambient lights

```ts
const ambient = anariDevice.newLight('ambient', {
  color: [0.4, 0.55, 0.8],
  radiance: 0.25
});
```

Ambient lights have no position or direction. `radiance` takes precedence over `intensity`.

### Directional lights

```ts
const sunlight = anariDevice.newLight('directional', {
  direction: [-0.7, -1, -0.35],
  color: [1, 0.91, 0.74],
  irradiance: 2.2
});
```

Directional lights have no position. `irradiance` takes precedence over `intensity`.

### Point lights

```ts
const point = anariDevice.newLight('point', {
  position: [2, 3, 1],
  color: [1, 0.35, 0.12],
  intensity: 30
});
```

Point lights use a fixed attenuation configuration in the current runtime. Add them directly to a world or to a group referenced by an instance.

### Spot lights

```ts
const spotlight = anariDevice.newLight('spot', {
  position: [0, 5, 3],
  direction: [0, -1, -0.5],
  color: [0.8, 0.9, 1],
  intensity: 24,
  openingAngle: Math.PI / 5
});
```

Spotlights use fixed attenuation. The current implementation derives the inner cone automatically and ignores `falloffAngle`.

### Committing animated lights

```ts
function updateLight(time: number): void {
  point
    .setParameter('position', [Math.cos(time) * 3, 2, Math.sin(time) * 3])
    .commitParameters();
}
```

Light changes remain invisible until committed. Group-attached lights are collected from instanced groups, but group instance transforms are not currently applied to light positions or directions; provide world-space light parameters explicitly.
