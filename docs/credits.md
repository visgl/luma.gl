---
title: Attributions and credits
description: Contributors, upstream implementations, research citations, and example asset credits for luma.gl.
---

# Attributions and credits

luma.gl combines original vis.gl work with adapted graphics implementations, published
research, and example datasets. We thank the [contributors](https://github.com/visgl/luma.gl/graphs/contributors)
and upstream authors who make this work possible.

This page collects major implementation credits and scientific references. See the
[References and credits guide](./references-and-credits.md) for package notice indexes,
additional project history, and distribution provenance. Full license
terms remain in the [repository license](https://github.com/visgl/luma.gl/blob/master/LICENSE),
source headers, adjacent notices, and the licenses of installed dependencies. A research
citation credits an algorithm; it does not imply that its authors supplied luma.gl's code.

## Project foundations

The repository license credits **Uber Technologies, Inc.** for the initial open-source
development, **Sencha Labs** for the PhiloGL portions, and the **vis.gl contributors** for
the project's continued development.

luma.gl is part of the [vis.gl](https://vis.gl/) ecosystem. Its development benefits from
collaboration with [deck.gl](https://deck.gl/), [math.gl](https://math.gl/),
[loaders.gl](https://loaders.gl/), and their contributors. Separately installed libraries
retain their own licenses; the inventory below is not a transitive dependency inventory.

## Adapted implementations and data

| Source | Use in luma.gl | Attribution and license references |
| --- | --- | --- |
| [PhiloGL](https://github.com/philogb/philogl) | Historical foundations retained in luma.gl. | Sencha Labs, 2013; MIT terms recorded in the repository license. |
| [three.js](https://github.com/mrdoob/three.js) | Adapted post-processing code, text geometry and font/path utilities, and half-float conversion. | three.js authors; MIT. The repository license and the affected source headers identify these adaptations. |
| [Historical Khronos glTF-WebGL-PBR shader](https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1/shaders/pbr-frag.glsl) | Foundation of the shared GLSL and WGSL PBR material shaders. | Mohamad Moneimne and Contributors, 2016–2017; the incorporated revision is MIT-licensed. See the [PBR attribution](./api-reference/shaders/shader-modules/pbr-material.md#attribution) for the historical license and later upstream licensing changes. |
| [LTC fitting data](https://github.com/selfshadow/ltc_code/tree/31e5e96b54f98f33098f8503003119ba2231a1c6) | Precomputed GGX lookup coefficients for optional linearly transformed cosine area-light shading. | Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt, 2017. The [upstream notice](https://github.com/selfshadow/ltc_code/blob/31e5e96b54f98f33098f8503003119ba2231a1c6/LICENSE) is retained as `LTC-LICENSE.txt` with the data. It includes a paper-citation condition; see [Area lighting](#area-lighting-ltc). |
| [webgpu-utils](https://github.com/greggman/webgpu-utils) | Adapted WebGPU mipmap generation. | Gregg Tavares, 2022; MIT. The implementation preserves its upstream copyright. |
| [FXAA pass](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/effects/passes/postprocessing/fxaa/fxaa.ts) | Anti-aliasing shader adapted through the Cesium WebGL implementation. | NVIDIA CORPORATION, 2014–2015. The source retains NVIDIA’s full notice and records the Cesium Apache-2.0 adaptation lineage. |
| [Spark](https://github.com/sparkjsdev/spark) | Adapted Gaussian-splat rendering and level-of-detail behavior, including RAD opacity/support behavior. | WORLD LABS TECHNOLOGIES, INC., 2025; MIT. Attribution is retained in the repository license and relevant splat sources. |
| [Parcels `AdvectionRK45`](https://github.com/Parcels-code/Parcels/blob/8584c09a4189ed29a49aa980b9830a2379e42c65/src/parcels/kernels/_advection.py) | Adapted RKF45 stages and controller for the scientific flow tracer. | Parcels team, 2025; MIT. The shader retains the notice, which also ships as `simulation/PARCELS-LICENSE.txt`. See the [flow tracer documentation](./api-reference/experimental/scientific-flow-tracer.md). |
| [deck.gl](https://github.com/visgl/deck.gl) and [deck.gl-community](https://github.com/visgl/deck.gl-community) | Adapted browser text-atlas, text-layout, and glyph-range utilities. | The corresponding source headers record the MIT-licensed adaptations. |
| [gl-format-compiler-error](https://github.com/wwwtyro/gl-format-compiler-error) | Reference for parsing WebGL shader compiler diagnostics. | Recorded as a public-domain source in the compiler-log parser. |
| [Spector.js](https://github.com/BabylonJS/Spector.js) and [gltf-loader-ts](https://github.com/bwasty/gltf-loader-ts) | Upstream sources for the Spector integration declarations and glTF schema types, respectively. | Source files identify the original projects; the glTF schema headers record their MIT origin. |

## Citations

### Area lighting (LTC)

**Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt.**
*Real-Time Polygonal-Light Shading with Linearly Transformed Cosines.*
ACM Transactions on Graphics (Proceedings of ACM SIGGRAPH 2016), 35(4), 2016.
[Author project page and paper](https://eheitzresearch.wordpress.com/415-2/).

luma.gl uses the fitted GGX tables from the upstream implementation for its optional LTC
PBR area-light path. The tables and their retained notice are distinct from the shader
assembly system. The numerical area-light fallback does not require the tables. See
[AreaLight and LTC PBR shading](./api-reference/shaders/shader-modules/lighting.md#arealight-and-ltc-pbr-shading).

```bibtex
@article{heitz2016ltc,
  author = {Heitz, Eric and Dupuy, Jonathan and Hill, Stephen and Neubelt, David},
  title = {Real-Time Polygonal-Light Shading with Linearly Transformed Cosines},
  journal = {ACM Transactions on Graphics},
  volume = {35},
  number = {4},
  year = {2016}
}
```

### Physically based materials

The [PBR module reference](./api-reference/shaders/shader-modules/pbr-material.md#references)
records the shading literature used by the material implementation, including:

- **Brian Karis.** *Real Shading in Unreal Engine 4.* SIGGRAPH 2013 course notes.
  [Course notes](https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf).
- **Brent Burley.** *Physically Based Shading at Disney.* SIGGRAPH 2012 course notes.
  [Course notes](https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf).

These publications describe rendering methods. The adapted PBR source has the separate
historical Khronos attribution recorded above.

### Gaussian splatting

**Bernhard Kerbl, Georgios Kopanas, Thomas Leimkühler and George Drettakis.**
*3D Gaussian Splatting for Real-Time Radiance Field Rendering.*
ACM Transactions on Graphics, 42(4), 2023.
[Author project page, paper and citation](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/).

This is a research reference for the Gaussian representation and rendering approach used
by [luma.gl's splat renderer](./api-reference/splats/README.md). The Spark adaptations
listed above have their own implementation credits and license.

## Example models, images and datasets

Example assets have their own creators and terms, which may differ from luma.gl's source
license. Consult the notice for the particular asset or gallery:

| Assets | Credits and terms |
| --- | --- |
| glTF material gallery images and the Scatter Strength Thin-Walled render | [Gallery attribution](https://github.com/visgl/luma.gl/blob/master/website/static/images/examples/gltf/ATTRIBUTION.md) records the Khronos sample revisions, artists, and CC0 or CC BY 4.0 terms. |
| Bundled glTF scene examples | [glTF asset notice](https://github.com/visgl/luma.gl/blob/master/examples/anari/scenes/public/gltf/ASSET-LICENSE.md) identifies the model authors, sources and CC0 terms. |
| Bundled OpenUSD scene examples | [USD asset notice](https://github.com/visgl/luma.gl/blob/master/examples/anari/scenes/public/usd/ASSET-LICENSE.md) identifies the selected collections, contributors and asset-specific terms. |

## Maintaining credits

When adding adapted code or data, retain the upstream copyright and full license notice,
record its source revision and material modifications, and include the notice in the
package that distributes it. Update this page with the implementation credit and relevant
research citation. For example assets, record the original creator, source and terms in
an adjacent asset notice. Moving code between packages must also move its applicable notices.
