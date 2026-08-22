# Visualization and compute, at GPU scale.

Move massive datasets through GPU-resident pipelines. Filter, aggregate, project, and render without unnecessary CPU round trips. luma.gl is a modular, TypeScript-first framework for data-intensive visualization, portable GPU programming, and high-quality interactive rendering.

Choose the level you need: typed columnar data, GPU-resident dataframes, graph and raster analytics, reusable compute operations, GPU command graphs, rendering primitives, composable visual effects, or retained three-dimensional scenes.

**Massive data. GPU-native compute. Interactive visualization. WebGPU and WebGL2.**

## The framework, module by module[​](#the-framework-module-by-module "Direct link to The framework, module by module")

[GPU-native computation**Compute, tables, and Arrow**Connect GPU-resident columns, reusable operations, command graphs, filtering, aggregation, and large-scale visualization.@luma.gl/gpgpu · @luma.gl/experimental@luma.gl/arrow · experimental / private](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing)[Experimental GPU analytics**Dataframes, graphs, and rasters**Query GPU-resident tables, discover graph communities, and analyze cached scientific or geospatial raster tiles without unnecessary readback.GPU Dataframe · GPU Graph · GPURaster@luma.gl/experimental · private](https://luma.gl/next/docs/api-reference/experimental)[![WebGPU](/img/standards/webgpu.svg)![WebGL](/img/standards/webgl.svg)Portable GPU foundation**Core, WebGPU, and WebGL**One application-facing device API for buffers, textures, pipelines, commands, and explicit GPU resource ownership.@luma.gl/core · @luma.gl/webgpu · @luma.gl/webgl](https://luma.gl/next/docs/api-reference/core)[Rendering engine**Models, geometry, and animation**Build with models, GPU geometry, picking, instancing, render loops, and reusable animation mixing.@luma.gl/engine](https://luma.gl/next/docs/api-reference/engine)[Shader programming**Reusable shaders and modules**Compose WGSL and GLSL with typed shader modules, injection hooks, lighting, and high-precision visualization tools.@luma.gl/shadertools](https://luma.gl/next/docs/api-reference/shadertools)[Visual effects**Composable image processing**Combine bloom, ambient occlusion, reflections, indirect light, volumetrics, motion blur, and temporal antialiasing.@luma.gl/effects](https://luma.gl/next/docs/api-guide/shaders/shader-passes)[![ANARI](/img/standards/anari.svg)![glTF](/img/standards/gltf.svg)![OpenUSD](/img/standards/openusd.png)Experimental retained scenes**ANARI / Scene API**Describe cameras, geometry, lights, and renderers; explore glTF and experimental OpenUSD import in the ANARI Playground.@luma.gl/scene · experimental / privateANARI-inspired; not an ANARI-conformant implementation.](https://luma.gl/next/docs/api-reference/scene)[![glTF](/img/standards/gltf.svg)![WebGPU](/img/standards/webgpu.svg)![WebGL](/img/standards/webgl.svg)Assets and materials**glTF and physically based shading**Render portable PBR assets, native glTF extensions, skeletal and morph animations, and independently animated GPU-instanced crowds.@luma.gl/gltf](https://luma.gl/next/docs/api-reference/gltf)[Experimental neural rendering**Streaming Gaussian splats**Render progressively streamed captured scenes with view-dependent harmonics, semantic picking and filtering, and bounded tile residency.@luma.gl/splats · experimental / private](https://luma.gl/next/docs/api-reference/splats)

WebGPU logo by [W3C](https://www.w3.org/), used under the<!-- --> <!-- -->[Creative Commons Attribution 4.0 International license](https://creativecommons.org/licenses/by/4.0/). Standards marks identify related technologies and do not imply endorsement, certification, or conformance.

## How to read the feature matrices[​](#how-to-read-the-feature-matrices "Direct link to How to read the feature matrices")

| Status           | Meaning                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| **Available**    | Implemented in a published framework module, subject to documented device and browser requirements.      |
| **Evolving**     | Implemented in a published module, but integration, feature coverage, or the v10 API remains incomplete. |
| **Experimental** | Implemented in an incubating or private module whose public contract may still change.                   |
| **Opportunity**  | A useful extension or known limitation; do not interpret it as existing functionality.                   |

`WebGPU + WebGL2` means an application-facing path exists for both backends; exact shader, texture, or device-feature requirements can still differ. `WebGPU` identifies capabilities that require compute shaders, storage resources, or another WebGPU-specific implementation.

## Explore the detailed matrices[​](#explore-the-detailed-matrices "Direct link to Explore the detailed matrices")

[Data and compute**GPU-resident analytics**Tables, Arrow, command graphs, dataframe operations, graph analytics, raster processing, queries, and GPU-driven visualization.WebGPU-first analytical capabilities](https://luma.gl/next/docs/capabilities/gpu-data-compute)[Rendering and visualization**Portable visual systems**Core resources, Engine workflows, shaders, effects, glTF, retained scenes, Gaussian splats, simulations, and immersive presentation.WebGPU and WebGL 2 where supported](https://luma.gl/next/docs/capabilities/rendering-visualization)

## Related pages[​](#related-pages "Direct link to Related pages")

* [Getting Started](https://luma.gl/next/docs/getting-started.md)
* [Choosing a luma.gl API layer](https://luma.gl/next/docs/api-guide.md)
* [API reference](https://luma.gl/next/docs/api-reference.md)
