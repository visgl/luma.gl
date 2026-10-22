# Engine features

Choose a material aspect or rendering capability, learn its public API, and explore it in a live glTF sample. These features belong to the engine and shared shader modules; glTF is one way to author and exchange them. Each page describes glTF core or extension support separately.

## Surface appearance[​](#surface-appearance "Direct link to Surface appearance")

* [Metallic and rough surfaces](https://luma.gl/docs/api-guide/engine/features/metallic-roughness.md) — Base color, metallic response, and roughness describe surfaces ranging from matte dielectrics to polished metals.

* [Unlit surfaces](https://luma.gl/docs/api-guide/engine/features/unlit.md) — Unlit surfaces preserve their surface color without evaluating scene lighting, useful for signs, diagrams, and baked artwork.

* [Emissive surfaces](https://luma.gl/docs/api-guide/engine/features/emission.md) — Emission makes a surface contribute its own visible radiance, including values above the display white level.

* [Specular reflection](https://luma.gl/docs/api-guide/engine/features/specular.md) — Specular reflection controls the strength and tint of dielectric highlights independently of the base diffuse color.

* [Index of refraction](https://luma.gl/docs/api-guide/engine/features/index-of-refraction.md) — Index of refraction controls the optical contrast at a dielectric boundary and influences reflection and transmitted light.

* [Transmission, volume, and dispersion](https://luma.gl/docs/api-guide/engine/features/transmission.md) — Transparent materials transmit light through a surface; thickness, absorption, and wavelength separation describe glass and colored volumes.

* [Clearcoat](https://luma.gl/docs/api-guide/engine/features/clearcoat.md) — Clearcoat adds a secondary glossy layer over a base surface, useful for varnish, lacquer, and automotive paint.

* [Sheen](https://luma.gl/docs/api-guide/engine/features/sheen.md) — Sheen adds a soft grazing-angle response for fabric, velvet, and other surfaces with fine fibers.

* [Iridescence](https://luma.gl/docs/api-guide/engine/features/iridescence.md) — Thin-film interference produces view-dependent colors, useful for coated glass, soap films, and decorative finishes.

* [Anisotropic reflection](https://luma.gl/docs/api-guide/engine/features/anisotropy.md) — Anisotropic reflection stretches highlights along a surface direction, useful for brushed metal and directional surface finishes.

* [Normal and bump mapping](https://luma.gl/docs/api-guide/engine/features/surface-detail.md) — Normal and height textures add apparent fine surface detail without increasing mesh tessellation.

* [Diffuse transmission and scattering](https://luma.gl/docs/api-guide/engine/features/diffuse-transmission.md) — Diffuse transmission lets light emerge from the opposite side of a thin or scattering surface, useful for leaves, paper, and translucent ceramics.

* [Texture coordinates and transforms](https://luma.gl/docs/api-guide/engine/features/texture-coordinates.md) — Independent texture coordinate sets and transforms let each surface map use its own placement, rotation, and scale.

* [Base color](https://luma.gl/docs/api-guide/engine/features/base-color.md)

* [Opacity and cutouts](https://luma.gl/docs/api-guide/engine/features/opacity.md)

* [Double-sided surfaces](https://luma.gl/docs/api-guide/engine/features/double-sided.md)

* [Ambient occlusion](https://luma.gl/docs/api-guide/engine/features/occlusion.md)

* [Normal mapping](https://luma.gl/docs/api-guide/engine/features/normal-mapping.md)

* [Emissive strength](https://luma.gl/docs/api-guide/engine/features/emissive-strength.md)

* [Volume absorption](https://luma.gl/docs/api-guide/engine/features/volume.md)

* [Dispersion](https://luma.gl/docs/api-guide/engine/features/dispersion.md)

## Scene capabilities and asset delivery[​](#scene-capabilities-and-asset-delivery "Direct link to Scene capabilities and asset delivery")

* [Material variants](https://luma.gl/docs/api-guide/engine/features/material-variants.md) — Material variants switch authored surface appearances while preserving the scene hierarchy and model identities.

* [Animation and deformation](https://luma.gl/docs/api-guide/engine/features/animation.md) — Animation combines clip playback, skeletal deformation, and morph targets to bring characters and scene objects to life.

* [Mesh instancing](https://luma.gl/docs/api-guide/engine/features/instancing.md) — Instancing draws many placements of shared geometry with one draw per compatible primitive instead of duplicating models.

* [Punctual lighting](https://luma.gl/docs/api-guide/engine/features/lighting.md) — Directional, point, and spot lights provide explicit scene illumination with controllable direction, intensity, and color.

* [Compressed geometry and textures](https://luma.gl/docs/api-guide/engine/features/asset-compression.md) — Compressed geometry and textures reduce asset transfer size and can reduce GPU texture storage when the device supports the resulting format.

* [Scene visibility](https://luma.gl/docs/api-guide/engine/features/visibility.md) — Hide a scene subtree while preserving its hierarchy and resources for later reuse.

* [Animated crowds and levels of detail](https://luma.gl/docs/api-guide/engine/features/animated-crowds.md) — Render independently animated characters with shared GPU geometry and select mesh detail by projected screen size.

## glTF integration reference[​](#gltf-integration-reference "Direct link to glTF integration reference")

The format-focused documentation remains the source for import contracts and support details:

* [glTF overview](https://luma.gl/docs/api-reference/gltf.md)
* [Materials, textures, and lighting](https://luma.gl/docs/api-reference/gltf/gltf-materials.md)
* [Animation and deformation](https://luma.gl/docs/api-reference/gltf/gltf-animation.md)
* [Native extensions](https://luma.gl/docs/api-reference/gltf/gltf-native-extensions.md)
* [Extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md)
* [Animated crowds and levels of detail](https://luma.gl/docs/api-reference/gltf/gltf-animated-crowd.md)
