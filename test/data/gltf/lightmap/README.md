These self-contained fixtures are copied unchanged from Ben Houston's
`KHR_lightmap` proposal at revision `c83154543c8a227bca17b5fe0eafdef2a6cb6efb`:

https://github.com/bhouston/glTF/tree/c83154543c8a227bca17b5fe0eafdef2a6cb6efb/extensions/2.0/Khronos/KHR_lightmap/examples

The source files declare `2026 Ben Houston, CC0-1.0` in `asset.copyright`.
`node-atlas.gltf` selects two atlas regions through node overrides;
`gpu-atlas.gltf` selects them through instance attributes and halves the second
instance's intensity. Embedded buffers and the two-texel PNG avoid network access
in the regression tests.
