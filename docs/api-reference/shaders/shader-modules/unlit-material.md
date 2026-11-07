import {ShaderModuleDocsTabs} from '@site/src/components/docs/shader-module-docs-tabs';

# unlitMaterial

<ShaderModuleDocsTabs group="lighting" active="unlit-material" />

`unlitMaterial` from `@luma.gl/shaders` preserves incoming surface color without
lighting. Use it for raster imagery, diagrams, UI surfaces, or baked artwork whose
colors should not change with lights or camera position.

```ts
import {unlitMaterial} from '@luma.gl/shaders';

// Include this module in a Model with a shader that calls the functions below.
const modules = [unlitMaterial];
```

## Shader functions

Available in both vertex and fragment stages:

```glsl
// GLSL
vec4 unlitMaterial_getColor(vec4 surfaceColor);
```

```wgsl
// WGSL
fn unlitMaterial_getColor(surfaceColor: vec4<f32>) -> vec4<f32>;
```

Returns the supplied RGBA unchanged, including alpha and HDR values outside
`[0, 1]`. The caller samples textures and combines them with vertex colors or
color factors before calling this function. The module does not normalize byte
colors, premultiply alpha, convert color spaces, tone-map, or set blend state.
For example, in a GLSL fragment shader:

```glsl
fragmentColor = unlitMaterial_getColor(texture(surfaceTexture, textureCoordinates) * vertexColor);
```

The texture, sampler, coordinates, and vertex color in this example belong to the
application shader, not the material module.

### Phong/Gouraud compatibility

The aggregate color-evaluation signatures also return the supplied RGB unchanged:

```glsl
vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition,
                           vec3 positionWorldspace, vec3 normalWorldspace);
```

```wgsl
fn lighting_getLightColor2(surfaceColor: vec3<f32>, cameraPosition: vec3<f32>,
                          positionWorldspace: vec3<f32>, normalWorldspace: vec3<f32>) -> vec3<f32>;
```

Camera position, surface position, and normal are ignored. Alpha remains the
caller's responsibility with these RGB signatures. Per-light helper functions
and PBR-specific entry points are not provided.

Replace the lit material module with `unlitMaterial`; do not include both in the
same shader, since their color-evaluation function names overlap. Remove
application-owned normal calculations and lighting bindings when they are no
longer used. Merely swapping modules does not remove normal attributes or
varyings declared by the application.

## Resources and switching

This module has no props, uniforms, textures, samplers, bind groups, or dependency
on `lighting`. It emits no light loops or material uniform branch. It is a shader
module, not a separate engine `UnlitMaterial` class; a `Model` can include it
without allocating an engine `Material` resource.

Lambert, Phong, Gouraud, and PBR also support `{unlit: true}`. Keep that flag when
switching lighting on and off at runtime within the same shader. The dedicated
module avoids those material and lighting dependencies when the surface is
always unlit. Switching material modules requires a matching shader/pipeline
variant. No frame-rate improvement is implied; GPU compilers may optimize lit
shader branches, and other modules may still require lighting resources.

See the [Materials guide](/docs/api-guide/engine/materials) for the stock material
comparison and [unlit surfaces](/docs/api-guide/engine/features/unlit) for imported
PBR/glTF materials, which retain their existing unlit flag.
