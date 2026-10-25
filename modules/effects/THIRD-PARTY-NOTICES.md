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
