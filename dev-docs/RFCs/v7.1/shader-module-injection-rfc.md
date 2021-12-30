# RFC: Shader Module Code Injection

* **Author**: Tarek Sherif
* **Date**: May, 2019
* **Status**: **Implemented**


## Summary

This RFC specifies a mechanism to allow shader modules to inject custom code into the source they are augmenting based on a defined set of lifecycle hook functions.


## Background

Shader modules currently only add variables and define functions in shaders. Without the ability to inject code in the `main` function, shaders that use them are forced modify their code to use the functionality that a shader module provides.

There is a separate code-injection mechanism that allows for code injection by the application, but it limits injections to variable declaration segments, or the beginning or end of the `main` function. This leads to a relatively brittle system, where the application must write arbitrary GLSL code against shader code that might change at some point, and that it cannot affect any intermediate calculations.


## Customers

deck.gl's effects system is currently unscalable due to the fact that effects are implemented as shader modules and enabling effects currently requires that shaders in all layers be updated to call module functions.


## Overview

The system proposed will allow the application to perform two new actions that will affect how shaders are compiled:
- Define a shader hook: a function that will be considered a "lifecycle" hook in the shader into which modules can
inject arbitrary code. The application can then call the hook function in the appropriate place in a given shader.
By default, the hook function will be a no-op, but if a shader module is included that has an injection defined
for the hook function, it's code will be injection into the hook function, automatically executing when the shader runs.
- Define module injections into hook functions.


## Implementation

Two function will be made available to applications:

`setShaderHook(shaderType, opts)`

Create a new shader hook function. Arguments:
- `shaderType`: `vs` or `fs`, the type of shader
- `opts.signature`: name and arguments of the function, e.g. `MYHOOK_func(inout vec4 value)`. Name of the function
will also be used as the name of the shader hook
- `opts.header` (optional): code always included at the beginning of a hook function
- `opts.footer` (optional): code always included at the end of a hook function


`setModuleInjection(shaderType, moduleName, opts)`

Define an shader hook injection for a module. Arguments:
- `shaderType`: `vs` or `fs`, the type of shader
- `moduleName`: the name of the module for which the injection is being defined
- `opts.shaderHook`: the shader hook to inject into
- `opts.injection`: the injection code
- `opts.priority` (optional): the priority with which to inject code into the shader hook. Lower priority numbers will
be injected first


## Example

Setting the picking color of a fragment simply involves replacing the calculated fragment color with a provided picking color, if picking is enabled. Currently, this is done by including the picking module and directly calling the `picking_filterColor` function it provides as the final operation on the fragment color. This could be done automatically by defining a hook function `MYHOOK_fragmentColor` to indicate that the fragment color has been finalized. The application would define the hook as follows:

```typescript
setShaderHook('fs', {
  signature: 'MYHOOK_fragmentColor(inout vec4 color)'
});
```

In the fragment shader `main` function, the new lifecycle function would appear as follows:
```typescript
void main() {
  //...
  MYHOOK_fragmentColor(gl_FragColor)
}
```

And the injection for the picking module would be defined as follows:

```typescript
setModuleInjection('fs', 'picking', {
  shaderHook: 'MYHOOK_fragmentColor',
  injection: 'color = picking_filterColor(color)',
  priority: Number.POSITIVE_INFINITY
});
```

If the picking module were included, the function `MYHOOK_fragmentColor` would be updated to modify the input color. Without the picking module, the function would remain a no-op.

I've created a proof-of-concept of the proposed mechanism in this branch: https://github.com/visgl/luma.gl/tree/module-injections
Sample usage can be seen in a modified version of the instancing example (in which both picking and lighting are handled via injections): https://github.com/visgl/luma.gl/blob/ec879f143ebfeec2fe55c1a2c17b60f55cf06c9b/examples/core/instancing/app.js#L134-L156


