# RFC: luma.gl Module Structure

* **Author**: Ib Green
* **Date**: Sep, 2018
* **Status**: **Partially Implemented** in v6.x

Notes:

## Summary

This RFC proposes an npm module structure for luma.gl. As the repository grows, it will be natural to split it into sub-modules.


## Proposed Primary Modules

These modules should bump version in lock step with core module (i.e. they are all always published together with matching versions)


### @luma.gl/core

Contents: `core`, `multipass`, `scenegraph` directories
TBD - models, geometry?

Depends on: `@luma.gl/webgl`, `@luma.gl/shadertools`


### @luma.gl/shadertools

Module handling shader module registration and textual processing of shaders.

Justification: See shadertools entry in Long Term section below.


### @luma.gl/webgl

Contents: The WebGL2 classes, WebGL context, webgl-utils etc.

There could be an interest in exposing more primitive modules, like the `webgl-utils`, but for the initial split we should keep the list of modules small.

Justification: Clean layering, Could be used separately, leaves room for separate `@luma.gl/webgpu` module to support next-gen Web graphics.


### @luma.gl/constants

Optional module with all the GL constants.


### @luma.gl/debug

Optional module with all the debug functionality. In particular bigger features like:

* Khronos Context Instrumentation
* Shader transpilation: GLSL -> JS?
* TBD: Logging of uniforms etc, bundle size reduction vs. convenience

Justification: Allows us to add heavy debug functionality without impacting bundle size of production builds.


### @luma.gl/filters (TBD)

All the image (screen space filters)

Contents: modules/imageprocessing, modules/glfx

TBDS:

* name (e.g. `@luma.gl/imageprocessing`, @luma.gl/postprocessing)
* should general 3d post processing be included, or should we have a separate module for that (@luma.gl/postprocessing)?


### @luma.gl/geometries (TBD)

Optional module with the geometries???.

Justification: A bit like deck.gl/layers.

Issues:
* We export both geometries and matching Model wrappers. Maybe some API improvement can avoid this?
* We don't have that many geometries, and of those, some are pretty core (Cube / ClipspaceModel), some are less so (truncated-cone-geometry).


## Scripting support

In addition luma.gl script bundles will be published from a "virtual module" `modules/script`.

luma.gl will not offer a-la-carte sub-module scripts bundle but will only export one set of script bundles (minified and non-minified) that include all (or most) of the primary modules



## Proposed Support Modules

These modules should NOT bump version in lock step with core module

### babel-plugin-inline-gl-constants

Already exists...


### babel-plugin-strip-assert

Would be nice!


### loaders.gl

Contents: `modules/loaders.gl`, `modules/io`.

Being broken out to separate repo, should be completed before the submodule split is completed.




## Open Issues

### Utility functions

A standard issue with monorepo modules splits is where to put utility functions that are shared by sub-modules. Publishing an @luma.gl/utils module seems like just to much.



## Longer term

### shadertools

There is a long-standing plan to make this library more luma.gl independent. Currently 95% of the functionality are completely textual/WebGL-independent GLSL transformations that could be used with any WebGL framework.

Perhaps moving it to a separate repository would make the most sense. Perhaps under a new better name.

