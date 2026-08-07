# pbrMaterial

[lighting](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lighting.md)[dirlight](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/dirlight.md)[lambertMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lambert-material.md)[gouraudMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/gouraud-material.md)[phongMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/phong-material.md)[pbrMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md)

Implements Physically Based Shading of a microfacet surface defined by a glTF material.

Lighting is expected to be defined by the `lights` module.

## Bind Group Convention[​](#bind-group-convention "Direct link to Bind Group Convention")

The `pbrMaterial` module's material uniform buffer, textures, and samplers are currently assigned to bind group `3`. The module also depends on lighting, which is assigned to bind group `2`, while projection-style globals typically remain in group `0`.

See the [Bind Groups and Bindings Guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md) for details on how grouped bindings are declared and supplied.

## References[​](#references "Direct link to References")

* [Real Shading in Unreal Engine 4](http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf)
* [Physically Based Shading at Disney](http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf)
* [README.md - Environment Maps](https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1/README.md#environment-maps)
* ["An Inexpensive BRDF Model for Physically based Rendering" by Christophe Schlick](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf)

## Attribution[​](#attribution "Direct link to Attribution")

The GLSL and WGSL material shaders derive from the historical [Khronos glTF-WebGL-PBR reference shader](https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1/shaders/pbr-frag.glsl). The version incorporated into luma.gl was distributed under the [MIT License](https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1/LICENSE.md) with `Copyright (c) 2016-2017 Mohamad Moneimne and Contributors`. Both shaders preserve that upstream copyright alongside the vis.gl contributors' additions and remain MIT-licensed.

The upstream project has since been renamed [glTF Sample Viewer](https://github.com/KhronosGroup/glTF-Sample-Viewer), and its current releases use the [Apache License 2.0](https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/main/LICENSE.md). That later license does not replace the MIT terms attached to the historical version used here.
