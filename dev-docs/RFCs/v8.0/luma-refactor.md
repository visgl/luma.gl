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
- A large code base. ~733kB of source files (compare to, e.g. three.js, a full 3D engine, at ~1.2MB)
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
- `SceneGraphNode`, `BaseModel`, `Model` - functionality could be supported with just the `Model` and `Group` classes
- `CameraNode` - Appears unused
- Uniform animations - Complex and unused
- `ShaderCache` - Superseded by `ProgramManager`
- core/lighting, core/materials - currently empty or simple data classes
- core/multipass - Appears unused
- seer integration - Complex and will interfere with other parts of the system if enabled (e.g. GPU timing). Is anyone using it?
- debug/parameter-definitions - Appears unused
- main module - Appears unused
- core/geometry - Perhaps better suited to math.gl?

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

