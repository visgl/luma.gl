# ShaderCache

A cache of compiled shaders, keyed by shader source strings. Compilation of long shaders can be time consuming. By using a `ShaderCache`, the application can ensure that each shader is only compiled once.


## Methods

### constructor

Creates a new `ShaderCache` object.


### delete

`ShaderCache.delete()`

Hint to delete any unused cached shaders (currently a no-op).
Returns itself to enable chaining.


### getVertexShader

`ShaderCache.getVertexShader(gl, source)`

Returns a compiled `VertexShader` object corresponding to the supplied
GLSL source code string, if possible from cache.

* `gl` {WebGLRenderingContext} - gl context
* `source` {String} - Source code for shader
returns {VertexShader} - a compiled vertex shader


### getFragmentShader

Returns a compiled `FragmentShader` object corresponding to the supplied
GLSL source code string, if possible from cache.

`ShaderCache.getFragmentShader(gl, source)`

* `gl` {WebGLRenderingContext} - gl context
* `source` {String} - Source code for shader
returns {FragmentShader} - a compiled fragment shader
