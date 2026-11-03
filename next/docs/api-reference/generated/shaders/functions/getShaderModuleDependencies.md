# Function: getShaderModuleDependencies()

> **getShaderModuleDependencies**<`T`>(`modules`): `T`\[]

Defined in: [lib/shader-module/shader-module-dependencies.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-dependencies.ts#L28)

Takes a list of shader module names and returns a new list of shader module names that includes all dependencies, sorted so that modules that are dependencies of other modules come first.

If the shader glsl code from the returned modules is concatenated in the reverse order, it is guaranteed that all functions be resolved and that all function and variable definitions come before use.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* `AbstractModule`

## Parameters[​](#parameters "Direct link to Parameters")

### modules[​](#modules "Direct link to modules")

`T`\[]

Array of modules (inline modules or module names)

## Returns[​](#returns "Direct link to Returns")

`T`\[]

* Array of modules
