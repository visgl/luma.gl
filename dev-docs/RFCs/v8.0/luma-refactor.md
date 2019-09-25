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
- Several unfinished or unused parts of the API that make it hard to tell which parts are reliable
- Documentation is sprawling and not focused on the API. Examples demonstrate random scenes rather than API features.

Clearly defining luma.gl's goals as a framework, and structuring the codebase and documentation around those goals, would benefit it in the following ways:
- Reduce its complexity and associated maintenance costs
- Reduce the weight it imposes on applications that use
- Make the value proposition it's making clear to potential users
- Simplify adoption

## Overview

A refactor of luma.gl could occur in three phases:

1. Clean out unused code.

The following are areas of the code that are overly complex and/or haven't found a use case:
- SceneGraphNode, BaseModel, Model
- CameraNode
- Uniform animations
- ShaderCache
- core/lighting, core/materials (currently empty or simple data classes)

The usage of the following should be verified:
- core/multipass
- seer integration
- debug/parameter-definitions
- gpgpu module
- main module

We could also potentially move the core/geometry into math.gl

2. Structure modules around meaningful themes. I propose reducing the number of modules to five, around the following themes:

### Constants

The `constant` module would remain as it is now.

### Low-level

luma.gl would would contain two low-level modules:
- `shader-tools`: Current ShaderTools and shader debugging tools from current debug module
- `context-tools`: Current webgl-polyfill and webgl-state-tracker, and context debugging tools from current debug module

### Mid-level

The `webgl` module would remain as it is now

### High-level

A new `engine` module would contain the higher-level constructs in luma.gl including objects, resource management, rendering, GPGPU, etc.

3. Rewrite documentation and examples around the new themes and focus on luma.gl's strengths:
- Polyfilling and ease of debugging
- Shader composition system
- Interoperability with other systems
- Testability

Assume users are intermediate to advanced WebGL users. Don't present basic WebGL concepts. Instead focus on API features and how to use the different parts together. Examples should present API features, with a few showcase pieces.




