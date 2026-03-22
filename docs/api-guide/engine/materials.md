# Materials

In luma.gl, a `Material` describes reusable surface state for one shading model
or material schema. A `MaterialFactory` defines that schema and creates
compatible `Material` instances that can be attached to `Model`s or shared
across many `ModelNode`s in a scenegraph.

Materials are scenegraph-adjacent engine resources:

- `Model` uses a material when it draws.
- `ModelNode` can reference a `Model` that already has a material attached.
- Material-owned bindings typically live in bind group `3`.

For scenegraph-specific guidance, see the
[Scenegraph guide](/docs/api-guide/engine/scenegraph). For bind-group ownership,
see the [Bind Groups guide](/docs/api-guide/gpu/gpu-bindings).

## What Is a Material?

A material describes how a surface responds to light and how its surface colors
are produced. In practice that includes the surface's bidirectional
reflectance distribution function (BRDF), material uniform values, and
material-owned textures and samplers.

If a change primarily affects BRDF or surface color response, it belongs in
material space. If a change primarily affects how primitives are rasterized,
expanded, or derived from mesh topology, it is not just a material concern.

This distinction helps keep material APIs focused:

- Material-like concerns:
  - `pbrMaterial`
  - `lambertMaterial`
  - `phongMaterial`
  - `gouraudMaterial`
  - a possible future `unlitMaterial`
  - a possible future `normalMaterial` used for debugging or inspection
- Not-just-material concerns:
  - wireframe rendering
  - barycentric wireframe overlays
  - line-topology rendering
  - point or sprite expansion
  - geometry-derived outline or edge rendering

Some visual modes combine both layers. For example, wireframe rendering often
needs geometry or pipeline support in addition to shader logic, so it is
usually better described as a rendering technique than as a traditional
material.

## Choosing A Stock Material

The current built-in lighting materials target different tradeoffs:

| Material | Surface Model | Relative Cost | Typical Use |
| --- | --- | --- | --- |
| `lambertMaterial` | Diffuse-only matte shading with no specular highlights | Fastest of the lit stock materials | Clean visualizations, extruded solids, and scenes where glossy highlights would add noise |
| `phongMaterial` | Simple specular model with per-fragment lighting | Fast | General-purpose lit surfaces when you want readable highlights without full PBR complexity |
| `gouraudMaterial` | Simple specular model with per-vertex lighting | Faster than `phongMaterial`, but lower quality | Large or simple meshes where lower cost matters more than highlight accuracy |
| `pbrMaterial` | Physically based material model with textures and richer surface response | Most expensive of the stock materials | Asset rendering, glTF materials, and scenes that need more realistic surface behavior |

In practice:

- choose `lambertMaterial` when you want a matte result and the cleanest visual output
- choose `phongMaterial` when you want simple shiny highlights and solid default quality
- choose `gouraudMaterial` when you want a cheaper approximation of Phong-style lighting
- choose `pbrMaterial` when the scene or asset needs material textures and more realistic shading

All four stock material families also support `unlit?: boolean` when you want
to keep the same material family on a model but skip lighting calculations.

## Materials In The Binding Model

In the current luma.gl convention:

- group `0` holds model or draw-local engine state
- group `2` holds scene-shared lighting and IBL state
- group `3` holds material state

That means a material is the natural owner of per-surface uniform buffers,
textures, and samplers that can be reused across many draws, while scene-level
state like lighting stays outside the material itself.
