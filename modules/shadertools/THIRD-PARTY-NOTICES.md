# Third-party notices: @luma.gl/shadertools

Shader composition by vis.gl contributors; historical Khronos PBR shaders, three.js half-float conversion, and Uber geospatial shader contributions.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
Separately installed dependencies retain their own licenses; this is not a transitive dependency inventory.

## Khronos glTF-WebGL-PBR

Copyright (c) 2016-2017 Mohamad Moneimne and Contributors.

Source: [Khronos glTF-WebGL-PBR](https://github.com/KhronosGroup/glTF-Sample-Viewer/tree/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: src/modules/lighting/pbr-material/pbr-material-glsl.ts and pbr-material-wgsl.ts adapt uniforms, lighting, extensions, and WGSL translation. The pinned historical MIT reference does not assert an exact original import revision. Later Apache terms do not replace this MIT version. The full upstream license includes its own third-party appendix; this does not mean the viewer GUI is bundled here.

Full terms: [pbr](./licenses/pbr.txt).

## three.js

three.js authors.

Source: [three.js](https://github.com/mrdoob/three.js).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: src/modules/math/fp16/fp16-utils.ts adapts half-float conversion to TypeScript and math.gl clamp.

Full terms: [three](./licenses/three.txt).

## Linearly Transformed Cosines fit data

Copyright (c) 2017, Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt.

Source: [selfshadow/ltc_code fit/results/ltc.js](https://github.com/selfshadow/ltc_code/blob/31e5e96b54f98f33098f8503003119ba2231a1c6/fit/results/ltc.js),
pinned to commit `31e5e96b54f98f33098f8503003119ba2231a1c6`.
The GGX fit tables are embedded in `src/modules/lighting/area-lighting/ltc-data.ts`
as TypeScript arrays for area-light shading.

Required paper reference: **Real-Time Polygonal-Light Shading with Linearly
Transformed Cosines**, Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt,
ACM Transactions on Graphics (Proceedings of ACM SIGGRAPH 2016), 35(4), 2016.
[Project page](https://eheitzresearch.wordpress.com/415-2/).

Full terms: [LicenseRef-LTC and paper citation](./src/modules/lighting/area-lighting/LTC-LICENSE.txt).
