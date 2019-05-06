# RFC: Shader Module Code Injection

* **Author**: Tarek Sherif
* **Date**: May, 2019
* **Status**: **Draft**


## Summary

This RFC specifies a mechanism to allow shader modules to inject custom code into the source they are augmenting based on a defined set of directives.


## Background

Shader modules currently only add variables and define functions in shaders. Without the ability to inject code in the `main` function, shaders that use them are forced modify their code to use the functionality that a shader module provides.

There is a separate code-injection mechanism in `BaseModel` that allows for code injection by the application. It implements most of the functionality required for module code injection, but limits injections to variable declaration segments, or the beginning or end of the `main` function. This leads to a relatively brittle system, where the application must write arbitrary GLSL code against shader code that might change at some point, and that it cannot affect any intermediate calculations.


## Customers

deck.gl's effects system is currently unscalable due to the fact that effects are implemented as shader modules and enabling effects currently requires that shaders in all layers be updated to call module functions.


## Overview

The foundation of the proposed system is a set of directives that can be used to mark up shader code and indicate when certain data is ready to be processed, e.g.:
- `##FRAGMENT_COLOR(color)`
- `##PICK_COLOR(color)`
- `##VIEW_MATRIX(matrix)`
- `##SURFACE_LIGHT(surfaceColor, normal, eyePosition)`

The "arguments" in the directives are simply variables defined in the surrounding `main` function. This allows shaders to continue naming variables as they please. When a shader is assembled, these directives will be replaced by code defined by any included modules, or removed otherwise. This allows modules to automatically modify the behavior of a program, which also provides a simple mechanism for enabling and disabling features in a program.

It is important to note that these directives shouldn't be considered module-specific. They should generally be thought of as indicating moments in the lifecycle of a shader, the idea being that multiple modules can target particular directives.


## Example

Setting the picking color of a fragment simply involves replacing the calculated fragment color with a provided picking color, if picking is enabled. Currently, this is done by including the picking module and directly calling the `picking_filterColor` function it provides. This could be done automatically by defining a directive `##FRAGMENT_COLOR` to indicate that the fragment color has been finalized. In the fragment shader `main` function, this would appear as follows:
```js
void main() {
  //...
  ##FRAGMENT_COLOR(gl_FragColor)
}
```

The picking module would include an injection definition akin to the following:
```js
'FRAGMENT_COLOR(COLOR)' => 'COLOR = picking_filterColor(COLOR)'
```

If the picking module were included, the injection would modify the original fragment shader code to:
```js
void main() {
  //...
  gl_FragColor = picking_filterColor(gl_FragColor);
}
```
Without the picking module, the directive would simply be removed.

I've created a proof-of-concept of the proposed mechanism in this branch: https://github.com/uber/luma.gl/tree/module-injections
Sample usage can be seen in a modified version of the instancing example (in which both picking and lighting are handled via injections): https://github.com/uber/luma.gl/blob/ec560a2afeeb0425d8fc575098c2da440e9f386f/examples/core/instancing/app.js

## Implementation

Steps to implementation would include the following:
- Consolidate injection logic in `Program` (rather than in `BaseModel` where it currently lives).
- Define and gradually extend list of supported directives in `inject-shader.js` ([POC](https://github.com/uber/luma.gl/blob/ec560a2afeeb0425d8fc575098c2da440e9f386f/modules/shadertools/src/lib/inject-shader.js#L13-L16)).
- Define shader module injection API that allows modules to target one or more directives and the code replacement to perform [POC](https://github.com/uber/luma.gl/blob/ec560a2afeeb0425d8fc575098c2da440e9f386f/modules/shadertools/src/modules/picking/picking.js#L117-L123).

