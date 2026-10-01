# pointGlow

`pointGlow` produces linear RGB radiance for a bounded point sprite with a white core and a colored halo. The module supports GLSL and WGSL and does not depend on Deck or a postprocess pass.

```
import {pointGlow} from '@luma.gl/shadertools';



const model = new Model(device, {modules: [pointGlow], /* application shaders and geometry */});

model.shaderInputs.setProps({pointGlow: {coreRadius: 0.12, haloIntensity: 0.6, falloff: 5}});
```

Call `pointGlow_getColor(coordinates, tint)` from the fragment shader with coordinates spanning `[-1, 1]` across the sprite and a linear RGB tint. The returned `vec3` contains radiance, not a premultiplied RGBA surface color. Multiply it by application opacity before additive blending. The caller owns geometry, projection, depth testing, picking, and tone mapping.

| Property        | Default | Meaning                                                                                |
| --------------- | ------- | -------------------------------------------------------------------------------------- |
| `coreRadius`    | `0.12`  | White core radius relative to the outer sprite radius, clamped to 0–1                  |
| `coreIntensity` | `1`     | Nonnegative white-core radiance; values above 1 are allowed                            |
| `haloIntensity` | `0.6`   | Nonnegative colored-halo radiance; values above 1 are allowed                          |
| `falloff`       | `5`     | Exponential radial falloff, clamped to at least `0.01`; larger values tighten the halo |

Partial updates retain previous values. A zero core radius removes the core, and zero intensity removes its component. The halo approaches zero at radius 1 and contributes nothing outside it. Derivatives soften the core and sprite boundary; call the function outside divergent fragment branches. Very small sprites can lose their core detail; no temporal or energy-preserving subpixel accumulation is performed.

Use additive color blending (`one`, `one`) after scaling radiance by opacity, and disable depth writes for the halo. Destination alpha can be preserved independently. This is suitable for an opaque scene or an HDR light buffer; adding RGB to a transparent premultiplied canvas without also defining its alpha composition is not supported by this recipe. Standard normalized color targets clamp overlapping brightness. HDR targets preserve it for a later tone-mapping pass.

See [Riverfront lights](https://luma.gl/examples/deck/point-glow) for a Deck example with feature picking.
