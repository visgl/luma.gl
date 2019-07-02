# RFC: Program Management in luma.gl

* **Author**: Tarek Sherif
* **Date**: July, 2019
* **Status**: **Draft**


## Summary

This RFC specifies subsystem for managing and re-using GLSL programs.


## Background

Program management is currently done in an ad hoc manner across luma.gl and deck.gl. There are mechanisms, via `injectShaders` and shader modules to customize the code of a given shader, but currently no way to know if the program one is about to create has already been created. This has serious performance implications as program compilation is expensive and program switching is one of the more expensive GL state changes. In addition to to performance concerns, this limitation also complicates interaction with programs as parameters that are used as uniforms must be handled separately from parameters that modify shaders (see e.g. the [data filter layer extension](https://github.com/uber/deck.gl/blob/6113d2c8984c406e9df59c16f19630a18f36c42d/modules/extensions/src/data-filter/data-filter.js#L42) that has to handle `filterSize` separately from other props).

Another, less critical, concern is that shader hook functions and module injections are currently defined as global parameters, meaning they must always be the same across an entire application importing luma.gl. A program management system could be responsible for tracking hook functions and injections, making them more flexible for general use.


## Overview

The proposed program manager would provide the following functionality:
- Registering vertex and fragment shader sources.
- Registering shader modules and their shader hook injections.
- Registering shader hook functions.
- Building programs, caching and re-using them based on their source code, deleting them when they are no longer used.

The `Model` class would be updated to support attaching a program manager, so that it could support re-using programs.


## Implementation

A `ProgramManager` that supports the following methods:
- `addVertexShader(id, source)`: register vertex shader source code.
- `addFragmentShader(id, source)`: register fragment shader source code.
- `addModule(id, module, injections)`: register a module, along with optional shader hook injections.
- `addShaderHook(type, {signature, header, footer})`: register a shader hook function.
- `get(vsId, fsId, {defines, modules})`: return a program. Compile and cache it on first call, return cached version subsequently (and increment usage count).
- `put(program)`: indicate that program is no longer being used (decrement usage count, delete if it reaches 0).


## Example

```js
const pm = new ProgramManager();

pm.addVertexShader('myVs', `
attribute vec4 position;

void main() {
#ifdef MY_DEFINE
  gl_Position = position;
#else
  gl_Position = position.wzyx;
#endif
}
`);

pm.addFragmentShader('myFs', `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  MY_SHADER_HOOK(gl_FragColor);
}
`);

pm.addShaderHook('fs:MY_SHADER_HOOK(inout vec4 color)');

pm.addModule(picking, [
  {
    hook: 'fs:#MY_SHADER_HOOK',
    injection: 'gl_FragColor = picking_filterColor(gl_FragColor);',
    order: Number.POSITIVE_INFINITY
  }
]);

const program1 = pm.get('myVs', 'myFs');   // Basic, no modules or defines
const program2 = pm.get('myVs', 'myFs');   // Cached, same as program 1, use count 2
const program3 = pm.get('myVs', 'myFs', {  // New program, with different source based on define
  defines: {
    MY_DEFINE: true
  }
});
const program4 = pm.get('myVs', 'myFs', {  // New program, with different source based on module and its injection
  defines: {
    MY_DEFINE: true
  },
  modules: ['picking']
});
const program5 = pm.get('myVs', 'myFs', {  // Cached, same as program 4, use count 2
  defines: {
    MY_DEFINE: true
  },
  modules: ['picking']
});

pm.put(program1); // Cached program still available, use count 1
pm.put(program2); // Cached program deleted
pm.put(program3); // Cached program deleted
pm.put(program4); // Cached program still available, use count 1
pm.put(program5); // Cached program deleted

```
