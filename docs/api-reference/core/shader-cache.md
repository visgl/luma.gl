# ShaderCache (Experimental)

A cache of compiled shaders, keyed by shader source strings. Compilation of long shaders can be time consuming. By using a `ShaderCache`, the application can ensure that each shader is only compiled once.


## Usage

```js
import {_ShaderCache as ShaderCache} from 'luma.gl';
```


## Methods

### constructor

Creates a new `ShaderCache` object.

`new ShaderCache(gl)`

Note that only objects from a single context can be cached, any attempts to use this cache with other gl contexts will result in exceptions.


### delete

`ShaderCache.delete()`

Hint to delete any unused cached shaders (currently a no-op).


### getVertexShader

Returns a compiled `VertexShader` object corresponding to the supplied GLSL source code string, if possible from cache.

`ShaderCache.getVertexShader(gl, source)`


* `gl` {WebGLRenderingContext} - gl context
* `source` {String} - Source code for shader
returns {VertexShader} - a compiled vertex shader


### getFragmentShader

Returns a compiled `FragmentShader` object corresponding to the supplied GLSL source code string, if possible from cache.

`ShaderCache.getFragmentShader(gl, source)`

* `gl` {WebGLRenderingContext} - gl context
* `source` {String} - Source code for shader
returns {FragmentShader} - a compiled fragment shader
