# Materials

[Model](https://luma.gl/next/docs/api-reference/engine/model.md)[Inputs workflow](https://luma.gl/next/docs/api-guide/engine/shader-inputs.md)[ShaderInputs](https://luma.gl/next/docs/api-reference/engine/shader-inputs.md)[Materials](https://luma.gl/next/docs/api-guide/engine/materials.md)

In luma.gl, a `Material` describes reusable surface state for one shading model or material schema. A `MaterialFactory` defines that schema and creates compatible `Material` instances that can be attached to `Model`s or shared across many `ModelNode`s in a scenegraph.

Materials are scenegraph-adjacent engine resources:

* `Model` uses a material when it draws.
* `ModelNode` can reference a `Model` that already has a material attached.
* Material-owned bindings typically live in bind group `3`.

For scenegraph-specific guidance, see the [Scenegraph guide](https://luma.gl/next/docs/api-guide/engine/scenegraph.md). For bind-group ownership, see the [Bind Groups guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md).

luma.gl owns the material implementations described here. The glTF converter maps authored factors, textures, and extensions onto those shared materials; retained ANARI scenes use the same PBR shader implementation.

## Material capabilities[​](#material-capabilities "Direct link to Material capabilities")

Each capability page explains the native material inputs and includes an existing glTF asset example. Core material features are documented alongside advanced surface and volume effects.

| Capability                       | Pages                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface color and coverage       | [Base color](https://luma.gl/next/docs/api-guide/engine/features/base-color.md), [opacity](https://luma.gl/next/docs/api-guide/engine/features/opacity.md), [double-sided surfaces](https://luma.gl/next/docs/api-guide/engine/features/double-sided.md)                                                                      |
| Metallic and rough surfaces      | [Metallic](https://luma.gl/next/docs/api-guide/engine/features/metallic.md), [roughness](https://luma.gl/next/docs/api-guide/engine/features/roughness.md)                                                                                                                                                                         |
| Self-emission                    | [Emission](https://luma.gl/next/docs/api-guide/engine/features/emission.md), [emissive strength](https://luma.gl/next/docs/api-guide/engine/features/emissive-strength.md)                                                                                                                                                         |
| Surface detail                   | [Normal mapping](https://luma.gl/next/docs/api-guide/engine/features/normal-mapping.md), [bump mapping](https://luma.gl/next/docs/api-guide/engine/features/bump-mapping.md), [ambient occlusion](https://luma.gl/next/docs/api-guide/engine/features/occlusion.md)                                                           |
| Light response                   | [Unlit](https://luma.gl/next/docs/api-guide/engine/features/unlit.md), [specular](https://luma.gl/next/docs/api-guide/engine/features/specular.md), [index of refraction](https://luma.gl/next/docs/api-guide/engine/features/index-of-refraction.md)                                                                         |
| Layered and directional response | [Clearcoat](https://luma.gl/next/docs/api-guide/engine/features/clearcoat.md), [sheen](https://luma.gl/next/docs/api-guide/engine/features/sheen.md), [anisotropy](https://luma.gl/next/docs/api-guide/engine/features/anisotropy.md), [iridescence](https://luma.gl/next/docs/api-guide/engine/features/iridescence.md) |
| Transmission and volumes         | [Transmission](https://luma.gl/next/docs/api-guide/engine/features/transmission.md), [thickness and attenuation](https://luma.gl/next/docs/api-guide/engine/features/volume.md), [dispersion](https://luma.gl/next/docs/api-guide/engine/features/dispersion.md)                                                              |
| Translucency and scattering      | [Diffuse transmission](https://luma.gl/next/docs/api-guide/engine/features/diffuse-transmission.md), [volume scattering](https://luma.gl/next/docs/api-guide/engine/features/volume-scattering.md), [thin-wall scattering](https://luma.gl/next/docs/api-guide/engine/features/thin-wall-scattering.md)                       |
| Texture inputs and lighting      | [Coordinates and transforms](https://luma.gl/next/docs/api-guide/engine/features/texture-coordinates.md), [lightmaps](https://luma.gl/next/docs/api-guide/engine/features/lightmaps.md), [environment lighting](https://luma.gl/next/docs/api-reference/anari/pbr-environment.md)                                             |

See [glTF material conversion](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md) for importer contracts and [ANARI materials](https://luma.gl/next/docs/api-reference/anari/anari-materials-and-lights.md) for retained parameters.

## What Is a Material?[​](#what-is-a-material "Direct link to What Is a Material?")

A material describes how a surface responds to light and how its surface colors are produced. In practice that includes the surface's bidirectional reflectance distribution function (BRDF), material uniform values, and material-owned textures and samplers.

If a change primarily affects BRDF or surface color response, it belongs in material space. If a change primarily affects how primitives are rasterized, expanded, or derived from mesh topology, it is not just a material concern.

This distinction helps keep material APIs focused:

* Material-like concerns:

  <!-- -->

  * `pbrMaterial`
  * `lambertMaterial`
  * `phongMaterial`
  * `gouraudMaterial`
  * a possible future `unlitMaterial`
  * a possible future `normalMaterial` used for debugging or inspection

* Not-just-material concerns:

  <!-- -->

  * wireframe rendering
  * barycentric wireframe overlays
  * line-topology rendering
  * point or sprite expansion
  * geometry-derived outline or edge rendering

Some visual modes combine both layers. For example, wireframe rendering often needs geometry or pipeline support in addition to shader logic, so it is usually better described as a rendering technique than as a traditional material.

## Choosing A Stock Material[​](#choosing-a-stock-material "Direct link to Choosing A Stock Material")

The current built-in lighting materials target different tradeoffs:

| Material          | Surface Model                                                             | Relative Cost                                  | Typical Use                                                                                |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `lambertMaterial` | Diffuse-only matte shading with no specular highlights                    | Fastest of the lit stock materials             | Clean visualizations, extruded solids, and scenes where glossy highlights would add noise  |
| `phongMaterial`   | Simple specular model with per-fragment lighting                          | Fast                                           | General-purpose lit surfaces when you want readable highlights without full PBR complexity |
| `gouraudMaterial` | Simple specular model with per-vertex lighting                            | Faster than `phongMaterial`, but lower quality | Large or simple meshes where lower cost matters more than highlight accuracy               |
| `pbrMaterial`     | Physically based material model with textures and richer surface response | Most expensive of the stock materials          | Asset rendering, glTF materials, and scenes that need more realistic surface behavior      |

In practice:

* choose `lambertMaterial` when you want a matte result and the cleanest visual output
* choose `phongMaterial` when you want simple shiny highlights and solid default quality
* choose `gouraudMaterial` when you want a cheaper approximation of Phong-style lighting
* choose `pbrMaterial` when the scene or asset needs material textures and more realistic shading

All four stock material families also support `unlit?: boolean` when you want to keep the same material family on a model but skip lighting calculations.

## Materials In The Binding Model[​](#materials-in-the-binding-model "Direct link to Materials In The Binding Model")

In the current luma.gl convention:

* group `0` holds model or draw-local engine state
* group `2` holds scene-shared lighting and IBL state
* group `3` holds material state

That means a material is the natural owner of per-surface uniform buffers, textures, and samplers that can be reused across many draws, while scene-level state like lighting stays outside the material itself.

## Explore engine features[​](#explore-engine-features "Direct link to Explore engine features")

Learn each material aspect and rendering capability through its API and a live sample in the [engine feature guide](https://luma.gl/next/docs/api-guide/engine/features.md). glTF core and extension mappings are described within each feature page; the Materials section is organized by shading capability rather than source format.
