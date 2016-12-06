# shadertools

## Overview

Enables packaging of GLSL code in reusable module, and defines a dependency
graph that allows root shaders to make simple imports of just the.


### Shader Modules

A shader module is defined as a set of complementary vertex shader and fragment
shader functions together with a list of names of other shader modules that
this module is dependent on.

Note that modules can define uniforms and varyings

* `name`
* `vertexSource`
* `fragmentSource`
* `getUniforms` - Each shader module provides a method to get a map of uniforms for the
  shader. This function takes named arguments with defaults. It can thus be
  called with no arguments to generate a set of default uniform values.
  Most WebGL frameworks, including luma.gl, have functions that accept a
  JavaScript object with keys representing uniform names and values
  representing uniform values.

Note: At the moment shader modules are not expected to use attributes.
It is up to the root application shaders to define attributes and call
GLSL functions from the imported shader modules with the appropriate
attributes. This is just a convention, not a hard limitation.


## Platform Detection

Also does some platform detection and injects `#define` statements enabling
your shader to conditionally use code.


## API


### `registerShaderModules`

Registers new shader modules, making them available to `assembleShaders`


### `assembleShaders`

Takes the source code of a vertex shader and a fragment shader, and


### `getShaderUniforms`

Takes a list of shader module names and an object with options, and
creates a combined uniform object that contains all necessary uniforms


### `getShaderDependencies`

* moduleNames {String[]} - Array of module names
returns {String[]} - Array of modules

Takes a list of shader module names and returns a new list of
shader module names that includes all dependencies, sorted so
that modules that are dependencies of other modules come first.

If the shader glsl code from the returned modules is concatenated
in the reverse order, it is guaranteed that all functions be resolved and
that all function and variable definitions come before use.

Note: This function is called internally by `assembleShaders` so the
application does not normally need to call it directly.
