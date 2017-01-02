# Shader Modules

## Usage

Ultimately, many modules end by offering a `<moduleName>_filterColor()`
function for the fragment shader. Sometimes there are complementary functions
in the vertex shader.

Often there is a vertex shader function that needs to be called to set
a number of "varyings" that the fragment shader call will need, like
`<moduleName>_setParams()`

The `filterColor` functions can typically be chained to combine modules, as
long as some care is taken with properly ordering the calls.
```
gl_FragColor = ...; // e.g. app shader samples from a texture
gl_FragColor = lighting_filterColor(gl_FragColor);
gl_FragColor = fog_filterColor(gl_FragColor);
gl_FragColor = picking_filterColor(gl_FragColor);
```

## Uniforms

Modules usually have uniforms. These are automatically included in the glsl
source code when the module is included, but of course they still need to be
set by the app before calling the assembled shader.
