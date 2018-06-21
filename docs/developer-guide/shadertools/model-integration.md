# Model Integration

Note that the luma.gl `Model` class is integrated with the `assembleShaders` system. The shader you pass to the `Model` class constructor will automatically be passed to `assembleShaders` if you supply `modules` parameter.

By passing your shaders to the `assembleShaders` function, the `shadertools` module adds platform detection and portability your shaders. In addition it also enables you to "inject" shader code (GLSL code) that has been packaged into reusable, composable "modules". And naturally, `shadertools` also allows you to create your own reusable shader modules.

## Usage

```js
const model = new Model(gl, {
  fs: '...',
  vs,
  modules: [],
});
```

To use the shader module system directly to add/inject modules into your shaders, just call `assembleShaders`:
```js
const {vs, fs, getUniforms, moduleMap} = assembleShaders(gl, {
  fs: '...',
  vs: '...',
  modules: [...],
  defines: {...}
})
```

To create a new shader module, you need to create the following object
```js
const module = {
  name: 'my-module',
  vs: ....
  fs: null,
  dependencies: [],
  deprecations: [],
  getUniforms
};
```

This object can be used as shader module directly, or you can register it so that it can be referred to by name.
```js
new Model(gl, {..., modules: [module]});
registerShaderModules([module]);
new Model(gl, {..., modules: ['my-module']});
```
