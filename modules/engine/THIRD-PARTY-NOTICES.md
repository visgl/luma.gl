# Third-party notices: @luma.gl/engine

PhiloGL heritage; primitive generation is supplied by the separately installed math.gl geometry package. Historical Google TDL primitive contributions remain acknowledged in the public credits guide, rather than being described as source shipped by this package.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
Separately installed dependencies retain their own licenses; this is not a transitive dependency inventory.

## PhiloGL

Nicolas Garcia Belmonte; Sencha Labs.

Source: [PhiloGL](https://github.com/senchalabs/philogl).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: Historical ES6 port and subsequent engine evolution. The root LICENSE retains the 2013 Sencha notice; upstream also names the author in its 2011 notice. This is project lineage, not a claim that every engine file is copied.

Full terms: [philogl](./licenses/philogl.txt).
# Third-party notices: @luma.gl/arrow

Apache Arrow and GeoArrow provide format and interoperability foundations. The separately installed apache-arrow dependency retains its Apache-2.0 license.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
This workspace is private; these notices also accompany local distributions.
Separately installed dependencies retain their own licenses.
# Third-party notices: @luma.gl/effects

Classic image filters derive from Evan Wallace’s glfx.js; LICENSE also retains three.js postprocessing attribution. FXAA comes through NVIDIA and Cesium.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
Separately installed dependencies retain their own licenses; this is not a transitive dependency inventory.

## glfx.js

Copyright (C) 2011 by Evan Wallace.

Source: [glfx.js](https://github.com/evanw/glfx.js).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: Classic adjustment, blur, artistic, and warp filters are adapted to ShaderPass, GLSL, and WGSL. The image-processing documentation identifies glfx.js; newer effects may be independently authored.

Full terms: [glfx](./licenses/glfx.txt).

## three.js postprocessing

three.js authors; historical Copyright 2010-2018 retained in LICENSE.

Source: [three.js postprocessing](https://github.com/mrdoob/three.js).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: Historical postprocessing adaptations recorded by the repository LICENSE; exact original file mapping is unknown.

Full terms: [three](./licenses/three.txt).

## FXAA via Cesium

NVIDIA CORPORATION; Cesium Contributors.

Source: [FXAA via Cesium](https://github.com/CesiumGS/cesium/tree/1.40).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: src/passes/postprocessing/fxaa/fxaa.ts records sampling, alpha, and luminance modifications. Cesium 1.40 is a license reference, not an asserted import version. NVIDIA FXAA 3.11 BSD and Cesium Apache-2.0 terms are retained separately.

Full terms: [cesium](./licenses/cesium.txt).

## NVIDIA FXAA 3.11

Copyright (c) 2014-2015, NVIDIA CORPORATION. All rights reserved..

Source: [NVIDIA FXAA 3.11](https://github.com/NVIDIAGameWorks/GraphicsSamples/blob/master/samples/es3-kepler/FXAA/FXAA3_11.h).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: See FXAA via Cesium. The full NVIDIA notice is extracted from the retained source comment.

Full terms: [nvidia-fxaa](./licenses/nvidia-fxaa.txt).
# Third-party notices: @luma.gl/gltf

glTF interpretation follows Khronos specifications. Fixture provenance, licenses, revisions, and transformations are documented at modules/gltf/test/data/README.md in the repository; test fixtures are not shipped by this package.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
Separately installed dependencies retain their own licenses; this is not a transitive dependency inventory.



## gltf-loader-ts schema types

Copyright (c) 2018 Benjamin Wasty.

Source: [gltf-loader-ts](https://github.com/bwasty/gltf-loader-ts). Historical import revision unknown; the source was previously maintained through loaders.gl and moved into luma.gl.

Affected files: src/types/gltf-json-schema.ts and src/types/gltf-postprocessed-schema.ts. Types are adapted for luma.gl’s glTF extensions, parser output, and strict TypeScript APIs.

Full terms: [MIT license](./licenses/gltf-loader-ts.txt).
# Third-party notices: @luma.gl/splats

Gaussian-splat rendering with Spark RAD opacity/support behavior adapted from World Labs.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
This workspace is private; these notices also accompany local distributions.
Separately installed dependencies retain their own licenses.

## Spark

Copyright © 2025 WORLD LABS TECHNOLOGIES, INC..

Source: [Spark](https://github.com/sparkjsdev/spark/blob/main/src/shaders/splatVertex.glsl).

Revision: historical import revision unknown unless identified below.

Adaptation: src/splat-rad-hierarchy.ts and src/gpu-paged-splat-shaders.ts adapt RAD opacity/support behavior for luma.gl paging and shaders.

Full terms: [spark](./licenses/spark.txt).
# Third-party notices: @luma.gl/text

Text paths, extrusion, and font loading adapted from three.js; browser atlas utilities adapted from deck.gl. Font data has its own retained terms.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
These notices accompany the published text package and local distributions.
Separately installed dependencies retain their own licenses.

## three.js text utilities

three.js authors.

Source: [three.js text utilities](https://github.com/mrdoob/three.js).

Revision: historical import revision unknown unless identified below.

Adaptation: src/text-3d paths, curves, shapes, FontLoader, TextGeometry, and ExtrudeGeometry adapted to TypeScript and luma.gl geometry; src/fonts/typeface-font-data.ts and helvetiker.ts retain three.js data lineage.

Full terms: [three](./licenses/three.txt).

## deck.gl text atlas

Vis.gl contributors.

Source: [deck.gl text atlas](https://github.com/visgl/deck.gl).

Revision: historical import revision unknown unless identified below.

Adaptation: src/fonts/atlas/browser-font-atlas.ts and text-utils.ts adapt browser font atlas and text utilities.

Full terms: [deck](./licenses/deck.txt).

## Helvetiker / MgOpen

Copyright (c) 2004 by MAGENTA Ltd. All Rights Reserved..

Source: [Helvetiker / MgOpen](https://github.com/mrdoob/three.js/blob/master/examples/fonts/helvetiker_regular.typeface.json).

Revision: historical import revision unknown unless identified below.

Adaptation: src/fonts/helvetiker.ts packages font data as TypeScript. Metadata identifies version 1.00, 2004 initial release. The embedded original font terms are reproduced separately from the code license.

Full terms: [magenta-font](./licenses/magenta-font.txt).
