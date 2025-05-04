# glTF Extensions


Below is a table covering most published glTF 2.0 extensions (both Khronos KHR_ and vendor‐specific EXT_/MSFT_ etc.) and whether luma.gl currently offers “built in” handling for them.

glTF extension support in luma.gl
| Extension                             | Status | Notes                                                                                                                                               |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KHR_draco_mesh_compression`          | ✅      | DRACO-compressed meshes are decompressed via loaders.gl before scenegraph creation.                                                                 |
| `KHR_lights_punctual`                 | ✅      | luma.gl’s ScenegraphNode and material system handle punctual lights if present in the glTF.                                                         |
| `KHR_materials_pbrSpecularGlossiness` | ✅      | Materials with the specular-glossiness workflow are parsed by loaders.gl; luma.gl treats them as material parameters on the built scenegraph nodes. |
| `KHR_materials_unlit`                 | ✅      | Unlit materials are supported (rendered without lighting calculations).                                                                             |
| `KHR_texture_basisu`                  | ✅      | BasisU textures are extracted by loaders.gl and passed as compressed textures to luma.gl where possible.                                            |
| `KHR_texture_transform`               | ✅      | Extra texture UV transforms (offset, scale, rotation) are respected by luma.gl’s material code.                                                     |
| `KHR_materials_clearcoat`             | ❌      | luma.gl’s material system exposes clearcoat parameters but rendering support depends on the chosen shader model.                                    |
| `KHR_materials_ior`                   | ❌      | Values are loaded but luma.gl shaders generally do not yet implement IOR-based effects.                                                             |
| `KHR_materials_specular`              | ❌      | Parameters are parsed but currently ignored by built–in PBR shaders.                                                                                |
| `KHR_materials_sheen`                 | ❌      | Sheen factors currently ignored unless the application provides custom shaders.                                                                     |
| `KHR_materials_transmission`          | ❌      | luma.gl does not implement refraction or transmissive materials at this time.                                                                       |
| `KHR_materials_volume`                | ❌      | Volume/thickness/attenuation features not implemented in the stock shader pipeline.                                                                 |
| `KHR_materials_iridescence`           | ❌      | Experimental. Requires custom material/shader code to render.                                                                                       |
| `KHR_materials_anisotropy`            | ❌      | Exposed on the parsed material but no built-in shading support.                                                                                     |
| `KHR_materials_emissive_strength`     | ✅      | Overwrites emissive intensity value if present.                                                                                                     |
| `KHR_materials_variants`              | ✅      | Variant mapping is parsed. Application must choose the active variant at runtime.                                                                   |
| `KHR_mesh_quantization`               | ✅      | Loaders.gl unpacks quantized attribute data back to floats before handing to luma.gl.                                                               |
| `KHR_animation_pointer`               | ❌      | Loaders.gl can expose the data; luma.gl does not currently map these pointers to runtime animations.                                                |
| `KHR_xmp_json_ld`                     | ❌      | Loader exposes metadata but luma.gl does not interpret it.                                                                                          |
| `KHR_materials_variants`              | ✅      | See above.                                                                                                                                          |
| `KHR_materials_translucency`          | ❌      | Not widely used	Some engines treat as prototype/experimental: no current luma.gl support.                                                           |
| `EXT_meshopt_compression`             | ✅      | Loaders.gl decompresses meshopt data; luma.gl then works with the decompressed results.                                                             |
| `EXT_mesh_gpu_instancing`             | ✅      | Instanced mesh attributes produce luma.gl InstancedModel/Instanced geometry.                                                                        |
| `EXT_texture_webp`                    | ✅      | WebP textures loaded via loaders.gl and passed to luma.gl Texture2D.                                                                                |
| `EXT_texture_avif`                    | ✅      | (if browser supports AVIF)	Dependent on browser support; once decoded the texture works like any other.                                             |
| `EXT_lights_image_based`              | ❌      | Partial	luma.gl has environment light constructs; ability to build from EXT_lights_image_based data is minimal without custom code.                 |
| `EXT_primitive_bounding_box`          | ❌      | Data available	Bounding boxes present in the glTF object; can be consumed for culling but no automatic pipeline.                                    |
| `EXT_texture_video`                   | ❌      | Not supported	Video textures are not automatically created; would require application level integration.                                            |
| `MSFT_lod	Not supported`              | ❌      | luma.gl does not parse/use MSFT_lod extension by default.                                                                                           |
| `MSFT_packing_occlusion`              | ❌      | Not consumed by default.                                                                                                              |
| `KHR_xxx`                             | ❌      | Many experimental proposals exists, they would need custom integrations.                                                                            |

## Summary

All the extensions marked as supported are at least parsed out of the loaded glTF data
thanks to loaders.gl and mapped to luma.gl scenegraph constructs where possible.

luma.gl at present focuses on common real-time PBR material parameters
(KHR_materials_* where noted), Draco & Meshopt mesh compression, and typical
texture/UV/misc feature extensions.

Many K`HR_materials_*` extensions (especially those adding new BRDF properties)
are parsed but are effectively ignored in the default luma.gl shader code.
Application code could provide custom shaders to interpret them if needed.

Vendor‐specific or rarely seen extensions (for example MSFT_lod,
MSFT_packing_occlusion, EXT_texture_video, etc.) generally have no built-in
handling in luma.gl out of the box.

If you rely heavily on any of the more recent or experimental extensions,
consider using loaders.gl to parse them and then implement the features in
custom luma.gl shaders or pipeline stages. The list above should match (and
extend) the shorter table normally shown in the loaders.gl documentation.

## loaders.gl glTF support

The loaders.gl GLTF loader handles most of the data manipulation (DRACO compression,
BasisU textures, extracting textures, etc.) so luma.gl generally relies on the loader results.
For some extensions—e.g. advanced material models—luma.gl does not yet provide specific
runtime support even if the loader can parse them.

The table below is a superset of that list and collects the other officially
registered extensions as well.

