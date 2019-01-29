# RFCs and Roadmaps (luma.gl)

Implementation of non-trivial new luma.gl features should typically be started off with the creation of an RFC (Request for Comments). For more details see [RFC Guidelines](../RFC-GUIDELINES.md) .


## Roadmaps

Writeups of directions in major areas of interest

| Roadmap                                 | Description |
| ---                                     | ---         |
| [**Shadertools**](../roadmaps/shadertools-roadmap.md) | shader module system roadmap |
| [**GPGPU**](../roadmaps/gpgpu-roadmap.md) | gpgpu roadmap |
| [**Effects**](../roadmaps/effects-lighting-materials-roadmap.md) | Gradually build out our shader stack |
| [**Scenegraph and Loaders**](../roadmaps/scenegraph-loaders-roadmap.md) | Improved scenegraph and loader support |


## Longer-Terms RFCs

These are early ideas not yet associated with any release

| RFC | Author | Status | Description |
| --- | --- | --- | --- |
| **WIP/Draft** | | | |
| [**Automatic Shader Module Injection**](vNext/automatic-shader-module-injection-rfc.md) | @ibgreen | **Draft** | Automatically inject code required by a shader module |
| [**Dist Size Reduction**](vNext/reduce-distribution-size-rfc.md) | @ibgreen | **Draft** | Reduce luma.gl impact on app bundle size |


## v7.0 RFCs

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**luma.gl Module Structure**](v6.2/module-structure-rfc.md) | @ibgreen | **Partially Implemented** |  Outlines module structure to be used in monorepo transition. Implementeation continues from v6.2. |
| [**glTF2 support**](v7.0/gltf-support-rfc.md) | @ibgreen | **Draft** | Proposes a multi-step approach to full glTF2 support. |
| [**Framebuffer/Texture API cleanup**](v6.2/framebuffer-texture-api-rfc.md) | @ibgreen | **Draft** | API changes to improve tree-shakeability of the big `Texture` and `Framebuffer` classes. |
| [**Off-Thread (aka Off-Screen) Rendering**](vNext/offscreen-render-rfc.md) | @pessimistress | **Experimental** | Use the new Off-Screen API to enable WebGL to run in a separate thread. Still requires browser flag. |


## v6.2 RFCs

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**luma.gl Module Structure**](v6.2/module-structure-rfc.md) | @ibgreen | **Partially Implemented** | Outlines module structure to be used in monorepo transition. |
| [**Floating Point Textures in Transforms**](v6.2/transform-float-textures-rfc.md) | @1chandu | **Review** | Floating Point Texture Support in `Transform` class |
| [**WebGL1 Support for Transforms**](v6.2/transform-webgl1-support-rfc.md) | @1chandu | **Review** | Use render to texture and float packing to emulate transform feedback under WebGL1 |


## v6.1 RFCs

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**Multipass Rendering**](v6.1/multipass-rendering-rfc.md) | @ibgreen | **Implemented** | Multipass rendering system for postprocessing effects and advanced rendering |
| [**New Loaders Module**](v6.1/loader-module-rfc.md) | @ibgreen | **Implemented** | New loaders.gl submodule collecting framework-agnostic, thread-capable 3D format loaders. |


## v6.0 RFCs

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**Centralize Attribute Management in VertexArray**](v6.0/vertex-array-attributes-rfc.md) | @ibgreen | **Implemented** | Move attribute management to `VertexArray` |
| [**Portable GLSL 3.00 Shader Modules**](v6.0/portable-glsl-300-rfc.md) | @ibgreen | **Implemented** | "Transpile" GLSL 3.00 to 1.00 and vice versa. |
| [**Shader Fragment Injection**](v6.0/shader-fragment-injection-rfc.md) | @ibgreen | **Implemented** | Enables short fragments of code to be injected into existing shaders |


## v5.2 RFCs

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**New Transform Class**](v5.2/enhanced-transform-feedback-api.md) | @1chandu | **Implemented** | Simpler API for TransformFeedback |


## v5.0 RFCs

Release Focus: Address any WebGL2 issues from 4.0.

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**Break out Math Module**](v5.0/break-out-math-module-rfc.md) | @ibgreen | **Implemented** | Break out luma.gl math module |


## v4.0 RFCs

Version 4.0 focused on:
* Exposing the complete WebGL2 API
* Adding WebGL state management
* Shader module support
* Completing documentation


## v3.0 RFCs

Version 3.0 focused on improving luma.gl documentation
