# Shader

The `Shader` class

## Usage

Create a pair of shaders

```js
const vs = device.createShader({stage: 'vertex', source});
const fs = device.createShader({stage: 'fragment', source});
```

## Members

- `handle` - holds the underlying `WebGLShader` object


## Methods

### constructor


- `source` - string containing shader instructions.

## Remarks

- Shader sources: A `Program` needs to be constructed with two strings containing source code for vertex and fragment shaders.
- Default Shaders: luma.gl comes with a set of default shaders that can be used for basic rendering and picking.
