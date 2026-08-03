# Bundling

[Overview](https://luma.gl/next/docs/developer-guide.md)[AI Agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)[Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)[Editing](https://luma.gl/next/docs/developer-guide/editing.md)[Testing](https://luma.gl/next/docs/developer-guide/testing.md)[Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)[Profiling](https://luma.gl/next/docs/developer-guide/profiling.md)[Bundling](https://luma.gl/next/docs/developer-guide/bundling.md)

luma.gl is published as tree-shakeable ES modules. Application bundle size depends on which modules and adapters are imported, how much of their APIs are used, and how the application is bundled and compressed.

Always assess luma.gl's impact using a minified production build of the actual application. Development builds, installed package size, and unminified source size are not useful proxies for the number of bytes delivered to users.

## Using luma.gl as a WebGPU/WebGL 2 Portability Layer[​](#using-lumagl-as-a-webgpuwebgl-2-portability-layer "Direct link to Using luma.gl as a WebGPU/WebGL 2 Portability Layer")

Applications can build directly on luma.gl's portable GPU abstraction without directly using higher-level engine or shader APIs. This configuration consists of:

* [`@luma.gl/core`](https://luma.gl/next/docs/api-reference/core.md), which defines the portable `Device` and resource APIs;
* [`@luma.gl/webgpu`](https://luma.gl/next/docs/api-reference/webgpu.md), which implements the portable subset using WebGPU; and
* [`@luma.gl/webgl`](https://luma.gl/next/docs/api-reference/webgl.md), which implements the portable subset using WebGL 2.

The backends share a common API where practical, but they do not have identical capabilities. For example, compute pipelines are available only on WebGPU.

For example, an application can prefer WebGPU and fall back to WebGL:

```
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({
  type: 'best-available',
  adapters: [webgpuAdapter, webgl2Adapter],
  createCanvasContext: true
});
```

Import only the adapter or adapters the application can use. A WebGPU-only application should not import `@luma.gl/webgl`, and a WebGL-only application should not import `@luma.gl/webgpu`. See [Installing](https://luma.gl/next/docs/developer-guide/installing.md#a-minimal-install) for package setup and [WebGPU versus WebGL](https://luma.gl/next/docs/api-guide/background/webgpu-vs-webgl.md) for backend selection guidance.

### Portability-layer Bundle Sizes[​](#portability-layer-bundle-sizes "Direct link to Portability-layer Bundle Sizes")

The following starting baselines were recorded by the initial [bundle-size regression tracker](https://github.com/visgl/luma.gl/pull/2853) in August 2026. Its ES module fixtures use esbuild with minification and tree-shaking enabled, target Chrome 110, Firefox 110, and Safari 15, and calculate compressed transfer sizes with `gzip -9` and Brotli quality 11. Values below use decimal KB, where 1 KB is 1,000 bytes.

| Module or combination           | Starting minified | Starting gzip | Starting Brotli | Initial gzip target    |
| ------------------------------- | ----------------- | ------------- | --------------- | ---------------------- |
| `@luma.gl/core`                 | 97.4 KB           | 27.1 KB       | 23.9 KB         | ≤ 24 KB                |
| WebGL 2 backend, excluding core | 136.0 KB          | 38.4 KB       | 32.9 KB         | ≤ 30 KB                |
| WebGPU backend, excluding core  | 274.4 KB          | 56.9 KB       | 47.9 KB         | ≤ 22 KB                |
| core + WebGL 2                  | 233.3 KB          | 65.5 KB       | 56.8 KB         | approximately 52-54 KB |
| core + WebGPU                   | 371.7 KB          | 84.0 KB       | 71.7 KB         | approximately 42-46 KB |
| core + both backends            | 507.7 KB          | 122.4 KB      | 104.6 KB        | approximately 76 KB    |

The backend fixtures externalize the shared `@luma.gl/core` peer so that core is not counted twice. The combined rows add separately compressed fixture sizes. They model separate artifacts rather than requiring a particular network or chunking strategy, and are stable comparison baselines rather than predictions for every application bundle.

The both-backends target is derived by summing the individual package budgets. It is not yet a dedicated CI fixture.

A tree-shaking production bundler can remove unused core exports and share common code. For comparison, representative application fixtures that import `luma` and the indicated adapters currently measure:

| Application imports      | Starting minified | Starting gzip | Starting Brotli | Initial gzip target |
| ------------------------ | ----------------- | ------------- | --------------- | ------------------- |
| `luma` + `webgl2Adapter` | 210.8 KB          | 59.5 KB       | 49.6 KB         | ≤ 50 KB             |
| `luma` + `webgpuAdapter` | 353.3 KB          | 78.2 KB       | 65.5 KB         | ≤ 45 KB             |

These application fixtures use a single output file. They include code reachable through dynamic imports and therefore measure the complete eventual bundle graph, not an application's initial chunk.

These numbers cover the low-level portability layer only. Shaders, application code, framework integrations, and higher-level luma.gl modules add to the final application bundle.

## Using luma.gl's Higher-level Libraries[​](#using-lumagls-higher-level-libraries "Direct link to Using luma.gl's Higher-level Libraries")

Applications commonly add two first-class libraries above the portability layer:

* [`@luma.gl/shadertools`](https://luma.gl/next/docs/api-reference/shadertools.md) assembles reusable WGSL and GLSL shader modules, plugins, and passes. It does not compile shaders or call WebGPU or WebGL itself, so it can be used with either the core API or the engine. See the [Shader API guide](https://luma.gl/next/docs/api-guide/shaders.md).
* [`@luma.gl/engine`](https://luma.gl/next/docs/api-reference/engine.md) builds on `@luma.gl/core` and `@luma.gl/shadertools` to provide `Model`, `AnimationLoop`, geometry, scenegraph, compute, and shader-pass rendering.

Focused packages such as `@luma.gl/effects`, `@luma.gl/gltf`, `@luma.gl/gpgpu`, and `@luma.gl/tables` build on one or more of these layers. They are not automatically included by the engine. See the [API overview](https://luma.gl/next/docs/api-guide.md) and [module catalog](https://luma.gl/next/docs/api-reference.md) for the complete package map.

### Shader Source Bundling[​](#shader-source-bundling "Direct link to Shader Source Bundling")

luma.gl stores shader source as strings in the JavaScript module graph and does not transpile between WGSL and GLSL. The source required by an application depends on its backend strategy:

| Application target             | Shader source required at runtime                        |
| ------------------------------ | -------------------------------------------------------- |
| WebGL 2 only                   | GLSL ES 3.00 vertex and fragment strings (`vs` and `fs`) |
| WebGPU only                    | A unified WGSL string (`source`)                         |
| WebGPU with a WebGL 2 fallback | Both WGSL and GLSL                                       |

A portable `ShaderModule` commonly references all three strings from one object, and `Model` selects the active fields after creating a device. Tree-shaking can remove a wholly unused shader module, but generally cannot remove the inactive properties of a module object that remains reachable. Importing only one backend therefore removes the other backend implementation, but does not guarantee that the unused shader dialect is removed from portable engine or shadertools code. Shader `defines` are evaluated during shader assembly, after the JavaScript has loaded, and do not reduce transfer size. JavaScript minifiers also do not normally minify the contents of shader strings.

Today, fixed-backend applications can keep their own GLSL and WGSL definitions in separate entry points and import only the matching dialect. Work is ongoing to make this selection configurable at build time for published shader libraries. The [draft deck.gl prototype](https://github.com/visgl/deck.gl/pull/10504) uses a TypeScript transform and a package export condition to produce a WebGL-only artifact with recognized WGSL sources removed. The intended luma.gl design would let bundlers select portable, WebGL-only, or WebGPU-only shader assets without changing application imports.

Current luma.gl releases do not yet expose this selector, and the prototype does not yet provide the symmetric WebGPU-only removal of GLSL. Follow the [bundle-size work tracker](https://github.com/visgl/luma.gl/issues/2852) for progress, and see [Writing Portable Shaders](https://luma.gl/next/docs/api-guide/shaders/writing-portable-shaders.md) for the shader authoring model.

### Higher-level Bundle-size References[​](#higher-level-bundle-size-references "Direct link to Higher-level Bundle-size References")

The August 2026 reference measurements below use the same esbuild, browser targets, minification, and compression settings as the portability-layer fixtures. Unlike the portability-layer numbers, these are informational measurements rather than adopted budgets or dedicated CI fixtures.

A full public-entry fixture retains every runtime export. This makes it a useful broad regression reference, but it is not representative of an application that imports a few named APIs:

| Full public-entry fixture                         | Reference minified | Reference gzip | Reference Brotli |
| ------------------------------------------------- | ------------------ | -------------- | ---------------- |
| `@luma.gl/shadertools`, excluding core            | 321.9 KB           | 73.4 KB        | 58.8 KB          |
| `@luma.gl/engine`, excluding core and shadertools | 163.6 KB           | 45.4 KB        | 38.4 KB          |
| core + shadertools + engine                       | 582.9 KB           | 145.9 KB       | 121.1 KB         |

The first two rows externalize the named peer packages so that shared code is not counted twice. The combined row adds the separately compressed core, shadertools, and engine fixtures; it is a stable comparison point, not a required chunking strategy.

Named-import fixtures demonstrate how tree-shaking changes the result:

| Application imports, without a GPU backend     | Reference minified | Reference gzip | Reference Brotli |
| ---------------------------------------------- | ------------------ | -------------- | ---------------- |
| `ShaderAssembler`                              | 42.8 KB            | 13.6 KB        | 12.0 KB          |
| `ShaderAssembler` + `pbrMaterial`              | 139.9 KB           | 34.4 KB        | 26.7 KB          |
| `Model` + `CubeGeometry` + `makeAnimationLoop` | 158.9 KB           | 46.1 KB        | 40.3 KB          |

These fixtures include their reachable higher-level dependencies, but no WebGL or WebGPU adapter because none is imported. A complete application also needs the selected portability backend. Measure that combined production graph rather than assuming separately compressed sizes add exactly.

There is no single representative "engine and up" bundle size. The retained code depends heavily on the exact models, shader modules, effects, loaders, and data-processing APIs an application imports. Use named imports and measure the resulting production application bundle.

## Our Bundle-size Commitment[​](#our-bundle-size-commitment "Direct link to Our Bundle-size Commitment")

The core portability layer is infrastructure used by applications and other frameworks. luma.gl is committed to keeping this layer reasonably trimmed as both backends evolve, and treats its size as a maintained performance characteristic. The project tracks the portable core, both backends, and representative application fixtures against explicit minified and compressed size budgets.

The targets above describe the direction of current bundle-reduction work, not a guarantee for an individual application or a claim that the targets have already been reached. Implementation plans and progress are tracked in [luma.gl issue #2852](https://github.com/visgl/luma.gl/issues/2852).

## Tree-shaking and Code Splitting[​](#tree-shaking-and-code-splitting "Direct link to Tree-shaking and Code Splitting")

luma.gl packages declare that their modules are free of package-level side effects. Modern bundlers can therefore remove exports that are not reachable from application code. To get the best result:

* use named ES module imports;
* build in production mode with minification and tree-shaking enabled;
* avoid importing a backend solely for feature detection;
* consider loading a fallback backend in a separate chunk when initial-load latency matters; and
* compare bundle analyzer output before and after adding an import.

Tree-shaking happens across the complete application graph. A source file or npm package that looks large on disk may have little effect when only one export is used, while a small static import can retain a much larger dependency graph.

### Dynamic Imports and Backend Chunks[​](#dynamic-imports-and-backend-chunks "Direct link to Dynamic Imports and Backend Chunks")

`type: 'best-available'` selects among loaded adapters at runtime; it is not a build-time signal that lets a bundler remove a backend. luma.gl does contain literal dynamic imports in several places: the WebGL and WebGPU adapters import their concrete device implementations when `create()` runs, and `@luma.gl/gpgpu` imports the operation backend that matches the first asynchronously evaluated device.

A literal `import()` is a possible code-splitting boundary, not automatic code removal. With ESM code splitting enabled, a bundler can emit a separate chunk and fetch it on first use. A single-file build includes the same code in its initial artifact, while shared dependencies may be hoisted or preloaded even in a split build. An async chunk reduces total transfer only for users who never take the path that loads it.

Production checks in August 2026 demonstrate why the distinction matters:

| Production build                                                                  | Observed result                                                                                             |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Vite 8 hello-cube example, importing both adapters                                | Separate async WebGL and WebGPU device chunks                                                               |
| esbuild 0.27.7 ESM splitting, importing adapters through the public package roots | Async wrappers were emitted, but package-root exports kept backend implementation code statically reachable |
| esbuild 0.27.7 single-output fixture                                              | No transfer-level split; all reachable code remained in one file                                            |

The current WebGL and WebGPU package roots also export concrete device and resource classes, so do not assume that a static adapter import creates a clean backend chunk in every bundler. When the initial route must defer an entire backend, put the boundary in application code and use literal package specifiers:

```
async function loadAdapter(type: 'webgpu' | 'webgl') {
  if (type === 'webgpu') {
    const {webgpuAdapter} = await import('@luma.gl/webgpu');
    return webgpuAdapter;
  }

  const {webgl2Adapter} = await import('@luma.gl/webgl');
  return webgl2Adapter;
}
```

Avoid constructing the package name dynamically: a bundler may include every matching module, require special configuration, or fail to resolve the import. The non-selected backend can still be present in the deployment, but it does not need to be downloaded on that application path. `best-available` can only consider adapters already supplied or registered, so an application that delays its fallback import owns the asynchronous fallback and retry flow. In server-rendered applications, call browser backend imports and device creation only from client-side code.

## Interpreting Bundle Numbers[​](#interpreting-bundle-numbers "Direct link to Interpreting Bundle Numbers")

* **Minified size** is useful for attributing code and comparing implementation changes.
* **gzip size** approximates transfer size when a server uses gzip compression. The tables use `gzip -9` for repeatability.
* **Brotli size** is often smaller for static assets and is worth enabling in production. The tables use Brotli quality 11 for repeatability, but the exact improvement depends on the bundle.
* Source maps are not included in the numbers above and should normally be delivered only when requested by developer tooling.
* Different bundlers, targets, minifiers, dependency versions, and chunk boundaries produce different results. Treat the listed values as regression baselines rather than universal costs.
