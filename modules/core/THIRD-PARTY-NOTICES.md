# Third-party notices: @luma.gl/core

Original vis.gl portable GPU resource abstractions informed by W3C WebGPU and Khronos WebGL. Standards compatibility is distinct from copied implementation code.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
Separately installed dependencies retain their own licenses; this is not a transitive dependency inventory.

## regl

Copyright (c) 2016 Mikola Lysenko.

Source: [regl](https://github.com/regl-project/regl).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: src/webgl/context/polyfills/polyfill-webgl1-extensions.ts records older regl code and inspiration; extension compatibility is integrated with luma.gl.

Full terms: [regl](./licenses/regl.txt).

## gl-format-compiler-error

wwwtyro.

Source: [gl-format-compiler-error](https://github.com/wwwtyro/gl-format-compiler-error).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: src/webgl/adapter/helpers/parse-shader-compiler-log.ts adapts compiler-log parsing from the public-domain implementation.

Full terms: [compiler](./licenses/compiler.txt).

## Spector.js

Babylon.js / Spector.js contributors; see full upstream notice.

Source: [Spector.js](https://github.com/BabylonJS/Spector.js/blob/master/dist/spector.d.ts).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: src/webgl-debug/spector-types.ts retains Spector declarations for debugger integration.

Full terms: [spector](./licenses/spector.txt).

## webgpu-utils

Copyright (c) 2022 Gregg Tavares.

Source: [webgpu-utils](https://github.com/greggman/webgpu-utils).

Revision: historical import revision unknown unless explicitly identified below. Upstream license copies supplement retained source and repository notices.

Adaptation: src/webgpu/adapter/helpers/generate-mipmaps-webgpu.ts adapts mipmap generation to luma.gl resources, texture dimensions, and render/compute paths.

Full terms: [webgpu-utils](./licenses/webgpu-utils.txt).
