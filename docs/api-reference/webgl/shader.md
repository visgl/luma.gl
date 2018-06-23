# Shader

The `Shader` class are the base class for `VertexShader` class and `FragmentShader` class


## Usage

Create a pair of shaders
```js
const fs = new VertexShader(gl, source);
const fs = new FragmentShader(gl, source);
```

## Members

* `handle` - holds the underlying `WebGLShader` object


## Constructor

### Shader(gl : WebGLRenderingContext, source : String)

* `source` - string containing shader instructions.



## Remarks

* Shader sources: A `Program` needs to be constructed with two strings containing source code for vertex and fragment shaders.
* Default Shaders: luma.gl comes with a set of default shaders that can be used for basic rendering and picking.
