# RFC: Refactoring luma.gl

* **Author**: Tarek Sherif
* **Date**: September, 2019
* **Status**: **Draft**


## Summary

This RFC proposes steps to simplify luma.gl's API and ease its adoption among users.


## Background

luma.gl is currently a very large library relative to the functionality it provides and is difficult to approach for new users. This is due to several factors, among them the following:
- 14 separate modules with no clear sense of how they're meant to interoperate
- 201 exported classes and functions, again without a clear sense of their relationships
- A large code base. The minified dist files (dist.min.js) total 981kB with the webgl re-exports from core removed. Compare to the minified build files of e.g. a full 3D engine like three.js at 592kB, a low-level library like PicoGL at 66kB. Breakdown of build file sizes for luma.gl modules is as follows:

| Module      | Size |
| ----------- | ----------- |
|core|235kB|
|debug|202kB|
|webgl|145kB|
|addons|134kB|
|shadertools|97kB|
|effects|72kB|
|webgl-state-tracker|30kB|
|gpgpu|25kB|
|webgl2-polyfill|21kB|
|constants|16kB|
|total|981kB|

- Several unfinished or unused APIs that make it hard to tell what's reliable
- Documentation is sprawling and not focused on the API. Examples demonstrate random scenes rather than API features

Clearly defining luma.gl's goals as a framework, and structuring the codebase and documentation around those goals, would benefit it in the following ways:
- Reduce its complexity and associated maintenance costs
- Reduce the weight it imposes on applications that use it
- Make its value proposition clear to potential users
- Simplify adoption

## Overview

The first step towards simplifying luma.gl is to be explicit about what its goals are. I propose that changes be made around the following key principles:
- Targeting intermediate to advanced WebGL users
- All systems implemented should solve explicitly identified problems. Experiments are encouraged, but those that fail to find a use case should be removed
- Structured around levels of abstraction, primarily helper tools for low-level WebGL work, WebGL wrapper classes, and higher-level engine features
- Increased focus on architectural fundamentals, simplicity, building systems that are easy to reason about. Less focus on using the latest APIs or frameworks


The actual refactor of luma.gl would occur in three phases:

### Clean Out Unused Code

This will warrant some discussion. The following are systems I believe should be considered for removal or consolidation:
- [ModelNode](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/scenegraph/nodes/model-node.js), [BaseModel](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/lib/base-model.js), [Model](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/lib/model.js) - functionality could be supported with just the `Model` and `Group` classes
- [CameraNode](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/scenegraph/nodes/camera-node.js) - Appears unused
- [Uniform animations](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/lib/base-model.js#L280-L333) - Complex, unused, and the `_extractAnimatedUniforms` method appears as 12th most costly function in the [deck.gl stress test](https://github.com/uber/deck.gl/tree/master/test/apps/stress-tests) CPU profile without there being any animated uniforms in the test scene.
- [ShaderCache](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/lib/shader-cache.js) - Superseded by `ProgramManager`
- [core/lighting](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/lighting/light-source.js), [core/materials](https://github.com/uber/luma.gl/tree/7.2-release/modules/core/src/materials) - currently empty or simple data classes
- [core/multipass](https://github.com/uber/luma.gl/tree/7.2-release/modules/core/src/multipass) - Appears unused (has it been superseded by deck effects?)
- [seer integration](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/debug/seer-integration.js) - Complex and will interfere with other parts of the system if enabled (e.g. [GPU timing](https://github.com/uber/luma.gl/blob/7.2-release/modules/core/src/lib/base-model.js#L337-L376)). The `getOverrides` function appears as 6th most costly function in the [deck.gl stress test](https://github.com/uber/deck.gl/tree/master/test/apps/stress-tests) CPU profile without seer being active.
- [debug/parameter-definitions](https://github.com/uber/luma.gl/blob/7.2-release/modules/debug/src/webgl-api-tracing/parameter-definitions.js) - Appears unused
- [main module](https://github.com/uber/luma.gl/tree/7.2-release/modules/main) - Appears unused
- [core/geometry](https://github.com/uber/luma.gl/tree/7.2-release/modules/core/src/geometries) - Perhaps better suited to math.gl?

### Structure Modules Around Meaningful Themes

I propose reducing the number of modules to five, around the following themes:

#### Constants

The `constants` module would remain as it is now.

#### Low-level

luma.gl would would contain two low-level modules:
- `shader-tools`: Current ShaderTools and shader debugging tools from current debug module
- `context-tools`: Current webgl-polyfill and webgl-state-tracker, and context debugging tools from current debug module

#### Mid-level

The `webgl` module would remain as it is now

#### High-level

A new `engine` module would contain the higher-level constructs in luma.gl including models, resource management, rendering, GPGPU, etc.

### Rewrite Documentation and Examples

Documentation would be rewritten to focus on the API itself and structured around the new themes (e.g. with tutorials working from low to high-level usage). Users will be assumed to intermediate to advanced WebGL users, so presentation of basic WebGL concepts would be removed. Examples would present API features, with a few showcase pieces. Focus would be on luma.gl's strengths, including the following:
- Polyfilling and ease of debugging
- Shader composition system
- Interoperability with other systems
- Flexible, composable tools
- Testability

