# RFC: Shader Fragment Injection

* **Authors**: Ib Green
* **Date**: May 2018
* **Status**: Implemented


## Overview

This RFC proposes a system enabling injection of shader fragments into existing shader code, allowing applications to a add a few lines of shader code without copying and maintaining a duplicate of an exiting shader. The main use case is adding the few lines of code needed to use a new shader module in an existing shader.


## Motivation

Being able to automatically (dynamically) inject modules into shaders would provide a lot of flexibility and simplicity to luma.gl and deck.gl applications.

An application can currently specify a list of modules to be injected into its shaders, however it still needs to manually modify its shaders to call those modules.


## Overview

* Application Customization, extending an existing shader by injecting a few lines when subclassing modules or layers
* Automatic Shader Module Injection


## Proposal

### Injection Map

`assembleShaders` (and `Model` constructor) will take a new `inject` argument that contains a map of:

* keys representing "patterns"
* values representing code to be injected.

```
  inject: {
    'COLOR_FILTERS': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
```

### Hint Based Injection

Shaders can leave hints in comments representing injection points, that can be used as keys for injection. It does mean that main shaders need to be modified.

```js
new Model(gl, {
  vs,
  fs: `void main() {
    gl_FragColor = vec4(1., 0., 0., 1.);
    // COLOR_FILTERS
  }`,
  modules: ['picking']
  inject: {
    'COLOR_FILTERS': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
});
```

### Pattern Based Injection

To avoid the need for adding hints to existing shaders, one could also do pattern matching against the existing code. It is recommended that the injections would always happen on the next line.

```js
new Model(gl, {
  vs,
  fs: `void main() {
    gl_FragColor = vec4(1., 0., 0., 1.);
    // COLOR_FILTERS
  }`,
  modules: ['picking']
  inject: {
    'gl_FragColor =': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
});
```


### Some predefined keys

* `fs-main`, `vs-main` - A simple convention can be that the main function must come last in the app shader, and we can just find the last brace in the file and start injecting before that.

* `fs-decl`, `vs-decl` - inject declarations at beginning of .


## Alternative Solutions

A more advanced templating library could be implemented.
