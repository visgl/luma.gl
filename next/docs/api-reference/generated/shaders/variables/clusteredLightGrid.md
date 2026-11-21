# Variable: clusteredLightGrid

> `const` **clusteredLightGrid**: `object`

Defined in: [modules/lighting/clustered-light-grid/clustered-light-grid.ts:7](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clustered-light-grid/clustered-light-grid.ts#L7)

Renderer-independent lookup for top-left normalized screen coordinates and positive view depth.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### name[​](#name "Direct link to name")

> `readonly` **name**: `"clusteredLightGrid"` = `'clusteredLightGrid'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nfn clusteredLightGrid\_getIndex(coordinates: vec2f, viewDepth: f32, dimensions: vec3u, nearPlane: f32, farPlane: f32) -> u32 {\n let tile = min(vec2u(clamp(coordinates, vec2f(0.0), vec2f(0.999999)) \* vec2f(dimensions.xy)), dimensions.xy - vec2u(1));\n let normalizedDepth = clamp(log(clamp(viewDepth, nearPlane, farPlane) / nearPlane) / log(farPlane / nearPlane), 0.0, 0.999999);\n let depthSlice = min(u32(normalizedDepth \* f32(dimensions.z)), dimensions.z - 1u);\n return (depthSlice \* dimensions.y + tile.y) \* dimensions.x + tile.x;\n}\n"
