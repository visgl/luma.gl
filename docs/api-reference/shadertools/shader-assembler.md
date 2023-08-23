# ShaderAssembler

The functionality of the `shadertools` module shader system is primarily exposed 
via the `ShaderAssembler` class.

`ahaderAssebler.assembleShaders()` composes base vertex and fragment shader source with shader modules, 
hook functions and injections to generate the final vertex and 
fragment shader source that can be used to create a program.

## Static Methods

### `defaultShaderAssembler()`

Most applications that register default modules and hooks will want to use a single `Shader`


## Methods

### `assembleShaders`

`ahaderAssebler.assembleShaders()` composes base vertex and fragment shader source with shader modules, 
hook functions and injections to generate the final vertex and 
fragment shader source that can be used to create a program.

### `addDefaultModule(module: ShaderModule)`

Add a module that will automatically be added to any programs created by the program manager.

### `removeDefaultModule(module: ShaderModule)`

Remove a module that is automatically being added to programs created by the program manager.

### `addShaderHook(hook: String, [opts: Object])`

Creates a shader hook function that shader modules can injection code into. Shaders can call these functions, which will be no-ops by default. If a shader module injects code it will be executed upon the hook function call. This mechanism allows the application to create shaders that can be automatically extended by included shader modules.

- `hook`: `vs:` or `fs:` followed by the name and arguments of the function, e.g. `vs:MYHOOK_func(inout vec4 value)`. Hook name without arguments
  will also be used as the name of the shader hook
- `opts.header` (optional): code always included at the beginning of a hook function
- `opts.footer` (optional): code always included at the end of a hook function
