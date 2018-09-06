# Multi Pass Rendering (Experimental)

The multi pass rendering system allows you to describe a complex rendering pipeline as a sequence of render passes that you can then execute at a later stage.

This helps the programmer articulate how the rendering pipeline is defined, and also allows the use of a number of pre-defined post processing effects in combination with custom rendering.


## Using Existing Passes

There are a number of pre-define passes available that can be composed in custom render pipelines.


## Core Passes

| Pass               | Description              |
| ---                | ---                      |
| `ClearPass`        | Clears the Screen        |
| `RenderPass`       | Draws a list of models   |
| `PickingPass`      | Draws a list of models into the picking buffer |
| `CopyPass`         | Copies output a previous pass (e.g. to the screen) |
| `RenderPass`       | Renders a list of models into the destination framebuffer |
| `TexturePass`      | Renders a texture into the destination framebuffer |
| `ShaderModulePass` | Automatically builds a render `Pass` from a compatible shader module |


### Post Processing Passes

A basic set of post processing samples are provided

| Pass               | Description                     |
| ---                | ---                             |
| `ConvolutionPass`  | Screen space convolution, edge detection, blur, sharpening etc. |
| `OutlinePass`      | Stencil buffer based outlining. |
| `SSAOPass`         | Depth-buffer based Screen Space Ambient Occlusion |


## Custom Passes

The multi pass rendering system is designed to be extensible and make it easy to implement new rendering passes. Additional post processing effects can easily be created or ported/adapted to the system.


## Shader Module Passes

Shader modules that expose "standard" filtering and sampling functions can be given extra metadata (the `passes` field) enabling a `Pass` to be automatically instantiated. Look for `ShaderPass` badges in the documentation of shader modules.


## The Canvas Class

Since many render passes provide basic image processing effects, that can be desirable to use in non-WebGL focused applications, the multi pass render system comes with a Canvas class that makes it possible to use compatible shader modules directly with browser canvases without explcitly creating WebGL contexts, creating `Texture` instances etc.


## How Rendering Passes work

* Passes will render to the outputBuffer, unless `screen` is set to `true`.
* If `swap` is set, buffers will be swapped.


## Attributions / Credits

The luma.gl multi-pass rendering system was inspired by similar systems in other 3D frameworks, in particular by the `EffectComposer` system in THREE.js.
