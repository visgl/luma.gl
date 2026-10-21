# KHR_lightmap draft

This implementation targets the `KHR_lightmap` proposal at
[bhouston/glTF c831545](https://github.com/bhouston/glTF/tree/c83154543c8a227bca17b5fe0eafdef2a6cb6efb/extensions/2.0/Khronos/KHR_lightmap).
The proposal is not a ratified glTF extension.

## Rendering

Lightmaps contain linear RGB irradiance. The material intensity multiplies that
irradiance before the diffuse BRDF and ambient occlusion are applied. Lightmaps do
not contribute specular illumination. Unlit materials multiply their base color by
irradiance divided by pi. Alpha is unchanged.

Material bindings support UV0, UV1, and `KHR_texture_transform`. A node binding
replaces the entire selected primitive binding; omitted intensity and transform
fields use the extension defaults, rather than inheriting the replaced material.

Instance atlas attributes `_LIGHTMAP_OFFSET`, `_LIGHTMAP_SCALE`,
`_LIGHTMAP_ROTATION`, and `_LIGHTMAP_INTENSITY` compose after the selected binding
transform. The current portable implementation expands these atlas batches into
individual draws with independent material uniforms. It preserves `I * B` even
when the composed matrix contains shear, but increases draw calls and resource
usage compared with GPU batching. Ordinary instances without atlas attributes
continue to use the existing GPU instancing path.

## Implementation status

Material parsing, node override bindings, atlas attribute decoding, and WebGL/WGSL
shader paths are under development. Parser and uniform-layout tests pass; the core
and layered WGSL paths compile in the browser tests. Rendered atlas fixtures,
material variant interactions, resource cleanup, and the shared Cornell Box
example still require validation before this implementation is advertised as
supported.
