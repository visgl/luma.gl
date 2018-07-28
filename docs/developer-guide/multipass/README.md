# Multi Pass Rendering

The multi pass rendering system allows you to describe a complex rendering pipeline as a sequence of render passes that you can then execute at a later stage.

This helps clearly articulate how the rendering pipeline is defined, and also allows the use of a number of pre-defined post processing effects.

References:

* The luma.gl Multi Pass Rendering system was inspired by the `EffectComposer` system in THREE.js.


## Overview

The system is extensible and additional post processing effects can easily be created or ported/adapted to the system.

* Passes will render to the outputBuffer, unless `screen` is set to `true`.
* If `swap` is set, buffers will be swapped.


## Core Passes

| Pass               | Description              |
| ---                | ---                      |
| `ClearPass`        | Clears the Screen        |
| `RenderPass`       | Renders a list of models |


## Additional passes

The multi pass rendering system is designed to be extensible and make it easy to implement new rendering passes.


### Image Processing Library

| Pass               | Description              |
| ---                | ---                      |
| `ConvolutionPass`  | Renders a list of models |
| `BlurPass`         | Renders a list of models |
| `DitheringPass`    |                          |


### Roadmap / Ideas

* `TransformPass` ? - Does a transform feedback pass fit into / make sense in the multi pass system?
* Temporal Passes - add a "shake" or "shock wave" or "blur" pass that plays and the removes/disables itself? A stack of playing passes?
* Image Effects, add toon effects etc.
* FPS limits, priorities, disable passes when FPS drops?
