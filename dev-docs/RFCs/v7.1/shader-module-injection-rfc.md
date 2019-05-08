# RFC: Shader Module Code Injection

* **Author**: Tarek Sherif
* **Date**: May, 2019
* **Status**: **Draft**


## Summary

This RFC specifies a mechanism to allow shader modules to inject custom code into the source they are augmenting based on a defined set of lifecycle hook functions.


## Background

Shader modules currently only add variables and define functions in shaders. Without the ability to inject code in the `main` function, shaders that use them are forced modify their code to use the functionality that a shader module provides.

There is a separate code-injection mechanism in, primarily used via `BaseModel`, that allows for code injection by the application. It limits injections to variable declaration segments, or the beginning or end of the `main` function. This leads to a relatively brittle system, where the application must write arbitrary GLSL code against shader code that might change at some point, and that it cannot affect any intermediate calculations.


## Customers

deck.gl's effects system is currently unscalable due to the fact that effects are implemented as shader modules and enabling effects currently requires that shaders in all layers be updated to call module functions.


## Overview

The foundation of the proposed system is a set of predifined hook functions into which modules can inject code, e.g:
- `LUMAGL_fragmentColor(color)`
- `LUMAGL_pickColor(color)`
- `LUMAGL_viewMatrix(matrix)`
- `LUMAGL_surfaceLight(surfaceColor, normal, eyePosition)`

These functions will always be included in assembled shaders, and by default will be no-ops. Shader source code will use these functions to indicate that variables are ready for use, and modules can choose to inject code into these functions to modify the input data.

It is important to note that these functions shouldn't be considered module-specific. They should generally be thought of as indicating moments in the lifecycle of a shader, the idea being that multiple modules can inject code into a particular function.


## Example

Setting the picking color of a fragment simply involves replacing the calculated fragment color with a provided picking color, if picking is enabled. Currently, this is done by including the picking module and directly calling the `picking_filterColor` function it provides. This could be done automatically by defining a hook function `LUMAGL_fragmentColor` to indicate that the fragment color has been finalized. In the fragment shader `main` function, this would appear as follows:
```js
void main() {
  //...
  LUMAGL_fragmentColor(gl_FragColor)
}
```

The picking module would include an injection definition akin to the following:
```js
'LUMAGL_fragmentColor': 'color = picking_filterColor(color)'
```

If the picking module were included, the function `LUMAGL_fragmentColor` would be updated to modify the input color. Without the picking module, the function would remain a no-op.

I've created a proof-of-concept of the proposed mechanism in this branch: https://github.com/uber/luma.gl/tree/module-injections
Sample usage can be seen in a modified version of the instancing example (in which both picking and lighting are handled via injections): https://github.com/uber/luma.gl/blob/7f59fea27e5be1144a211c93ee4e3c768f9c4f09/examples/core/instancing/app.js

## Implementation

Steps to implementation would include the following:
- Define and gradually extend list of supported hook functions in `assemble-shaders.js` ([POC](https://github.com/uber/luma.gl/blob/7f59fea27e5be1144a211c93ee4e3c768f9c4f09/modules/shadertools/src/lib/assemble-shaders.js#L12-L19)).
- Define shader module injection API that allows modules to target one or more directives and the code replacement to perform [POC](https://github.com/uber/luma.gl/blob/7f59fea27e5be1144a211c93ee4e3c768f9c4f09/modules/shadertools/src/lib/assemble-shaders.js#L12-L19).

