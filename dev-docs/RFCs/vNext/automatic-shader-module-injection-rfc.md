# RFC: Automatic Shader Module Injection

* **Authors**: Ib Green
* **Date**: Sep 2017
* **Status**: Early Draft


References

* A related system is described here [Shader Fragment Injection](https://github.com/uber/luma.gl/blob/master/dev-docs/RFCs/v6.0/shader-injection-rfc.md)


## Overview

This RFC explores dynamic injection of shader modules into existing code. whether it is possible to have the necessary additions to the main shader happen automatically as a result of just adding a shader module to the module list.


## Motivation

Being able to automatically / dynamically inject shader modules into existing shaders (i.e. without having to copy or modify the existing shaders) would provide a tremendous amount of flexibility and simplicity to luma.gl and deck.gl applications.

An application can currently specify a list of modules to be injected into its shaders, however it still needs to manually modify its shaders to call those modules, or use shader fragment injection.

Now that we have developed a number of shader modules, we are starting to see that the API provided by these modules is quite "formulaic". Especially the fragment shaders tend to use `<module_name>_filterColor` convention.


## Proposal

```js
new Model(gl, {
  vs, fs,
  modules: [
  	'picking',
  	['lighting', ``]
  }
});
```

### Fragment shader

A common pattern is for shader modules to offer a fragment shader that exposes a single primary `<module>_filterColor()` method. This needs to be added to the fragment shader. Normally the only thing that matters is the order of the filterColor calls from different modules.

By adding a priority value (integer) to each shader module definition, the assembleShaders system could automatically inject these `_filterColor()` calls in the right order simply by walking the list of requested modules.


### Vertex shader



## Identifying where to inject

A simple convention can be that the main function must come last in the app shader, and we can just find the last brace in the file and start injecting before that.

For more control, we can let application give injection hints:

In vertex.glsl

TBD - the vertex shader code usually involves wiring up the module with specific attributes.


In fragment.glsl
```
main() {
   ... // Application code

   FILTER_COLOR(100); // injects filter color in order for any module below given value
   FILTER_COLOR(picking); // injects filter color in order for any module below given value

   ... // Additional application code

   FILTER_COLOR(); // Any additional filter colors
```

## Proposal: Shader Module Changes

The shader modules are expected to define relative priorities of their `<module>_filterColor` calls, so that assembleShaders can automatically order the selected injections.

Perhaps priorities could be given explicitly by the app when listing shader modules?


## Open Issues

* JavaScript side, additional uniforms and attributes needed.