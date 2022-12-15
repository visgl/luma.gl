# RFC: Program Management in luma.gl

* **Author**: Tarek Sherif
* **Date**: July, 2019
* **Status**: **Approved**


## Summary

This RFC specifies subsystem for managing and re-using GLSL programs.


## Background

Creation and management of programs is currently handled by several systems in luma.gl:
- Modules are simply JavaScript objects that can be created anywhere by the application.
- Injections and shader hooks are managed as library-wide global state managed by functions `setShaderHook` and `setModuleInjection`.
- Assembling base shader sources, modules, defines and injections into a final shader source is handled by `assembleShaders`.
- Caching and re-use of programs is handled by `ShaderCache`, which is currently limited in that it scopes caches to `BaseModel` objects meaning that `BaseModel`s cannot share programs (this is due to an easily-remedied limitation in the `BaseModel` class that it doesn't set uniforms per-draw).

Issues with the current system include:
- These systems are currently only consolidated around the `BaseModel` class, which treats programs as immutable. This means that modifying programs and taking advantage of these system involves re-constructing the entire `BaseModel`. This complicates interaction with programs as they and parameters that modify their source must generally be treated as immutable and separated out from mutable properties (e.g. the [data filter layer extension](https://github.com/visgl/deck.gl/blob/6113d2c8984c406e9df59c16f19630a18f36c42d/modules/extensions/src/data-filter/data-filter.js#L42) in deck.gl has to handle `filterSize`  and `softMargin` separately from other props because they modify the shader code).
- Shader hooks and module injections are global state meaning that an application that imports luma.gl must use the same definitions globally (a case where one might not want this is when rendering to separate canvases on the same page).
- Caching being limited per-model presents serious performance concerns as program compilation is expensive, and program switching is among the more expensive GL state changes (this would be a concern, for example, in deck.gl when rendering multiple instances of the same layer).
- With out a centralized system for managing programs, it will be difficult to take advantage of optimizations that require batching program operations, such `KHR_parallel_shader_compile`.


## Overview

The proposed program manager would take the caching mechanisms provide by `ShaderCache` and extend it in the following ways:
- Remove the per-model scoping.
- Manage shader sources, modules, injections and shader hooks.
- Provide a simple API for building a program from shader sources, modules and defines, returning a cached version if available.

The `BaseModel` class would be modified to:
- Support attachment of a program manager from which it would acquire programs.
- Support sharing programs with other `BaseModel`s.
- Support switching programs.

## Implementation

A `ProgramManager` that supports the following methods:
- `addModule(module, injections)`: register a module, along with optional shader hook injections.
- `addShaderHook(signature, {header, footer})`: register a shader hook function.
- `get(vsSource, fsSource, {defines, modules})`: return a program. Compile and cache it on first call, return cached version subsequently (and increment usage count).
- `release(program)`: indicate that program is no longer being used (decrement usage count, delete if it reaches 0).

`BaseModel` would be modified to:
- Take a `ProgramManager` instance as construction parameter, from which it can get programs.
- Update its `Program`s uniforms on every draw. This will allow program sharing and program switching.
- Add a method `updateProgram(vsId, fdId, {defines, modules})` that would allow it to switch programs (via its `ProgramManger`) without having to be rebuilt.


## Example

```typescript
const pm = new ProgramManager(gl);

const vs = `
attribute vec4 position;

void main() {
#ifdef MY_DEFINE
  gl_Position = position;
#else
  gl_Position = position.wzyx;
#endif
}
`;

const fs = `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  MY_SHADER_HOOK(gl_FragColor);
}
`;

pm.addShaderHook('fs:MY_SHADER_HOOK(inout vec4 color)');

pm.addModule(picking, [
  {
    hook: 'fs:#MY_SHADER_HOOK',
    injection: 'color = picking_filterColor(color);',
    order: Number.POSITIVE_INFINITY
  }
]);

const program1 = pm.get(vs, fs);   // Basic, no modules or defines
const program2 = pm.get(vs, fs);   // Cached, same as program 1, use count 2
const program3 = pm.get(vs, fs, {  // New program, with different source based on define
  defines: {
    MY_DEFINE: true
  }
});
const program4 = pm.get(vs, fs, {  // New program, with different source based on module and its injection
  defines: {
    MY_DEFINE: true
  },
  modules: [picking]
});
const program5 = pm.get(vs, fs, {  // Cached, same as program 4, use count 2
  defines: {
    MY_DEFINE: true
  },
  modules: [picking]
});

pm.release(program1); // Cached program still available, use count 1
pm.release(program2); // Cached program deleted
pm.release(program3); // Cached program deleted
pm.release(program4); // Cached program still available, use count 1
pm.release(program5); // Cached program deleted

const m1 = new Model({programManger: pm, vs, fs}); // Create and cache program
const m2 = new Model({programManger: pm, vs, fs}); // Re-use same program as m1
m1.updateProgram(vs, fs);   // No change, using cached program
m1.updateProgram(vs, fs, {  // New program, with different source based on define
  defines: {
    MY_DEFINE: true
  }
});

```
