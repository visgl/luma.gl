# Multi Pass Rendering (Experimental)

The multi pass rendering system allows you to describe a complex rendering pipeline as a sequence of render passes that you can then execute at a later stage.

This helps the programmer articulate how the rendering pipeline is defined, and also allows the use of a number of pre-defined post processing effects in combination with custom rendering.


## Attributions / Credits

The luma.gl Multi Pass Rendering system was inspired by the `EffectComposer` system in THREE.js.


## Using Existing Passes

There are a number of pre-define passes available that can be composed in custom render pipelines.


## Core Passes

| Pass               | Description              |
| ---                | ---                      |
| `ClearPass`        | Clears the Screen        |
| `RenderPass`       | Renders a list of models |
| `PickingPass`       | Renders a list of models |
| `CopyPass`         | Copies output a previous pass (e.g. to the screen) |
| `RenderPass`       | Renders a list of models |
| `RenderPass`       | Renders a list of models |


### Post Processing Passes

| Pass               | Description                     |
| ---                | ---                             |
| `ConvolutionPass`  | Screen space convolution, edge detection, blur, sharpening etc. |
| `OutlinePass`      | Stencil buffer based outlining. |
| `SSAOPass`         | Depth-buffer based Screen Space Ambient Occlusion |


## Additional Passes

The multi pass rendering system is designed to be extensible and make it easy to implement new rendering passes. Additional post processing effects can easily be created or ported/adapted to the system.


## How Rendering Passes work

* Passes will render to the outputBuffer, unless `screen` is set to `true`.
* If `swap` is set, buffers will be swapped.
