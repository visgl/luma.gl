# babel-plugin-remove-glsl-comments

Remove comments in glsl shader source.


## Example

#### in

```js
// vertex.glsl.js
const vs = `
/* Projection uniforms */
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 modelMatrix;

/* Attributes */
attribute vec3 positions;
attribute vec3 instancePositions;

main() {
  vec4 worldPosition = vec4(instancePositions + modelMatrix * positions, 1.); // resolved position of the current vertex
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;
```

#### out

```js
// vertex.glsl.js
const vs = '\nuniform mat4 viewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat3 modelMatrix;\n\nattribute vec3 positions;\nattribute vec3 instancePositions;\n\nmain() {\n  vec4 worldPosition = vec4(instancePositions + modelMatrix * positions, 1.);\n  gl_Position = projectionMatrix * viewMatrix * worldPosition;\n}\n';
```

## Installation

```sh
$ npm install --save-dev babel-plugin-remove-glsl-comments
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["remove-glsl-comments"]
}
```

With options:

```json
{
  "plugins": [["remove-glsl-comments", {
    "patterns": ["*.glsl.js"]
  }]]
}
```

### Via CLI

```sh
$ babel --plugins remove-glsl-comments script.js
```

### Via Node API

```js
require("babel-core").transform("code", {
  plugins: ["remove-glsl-comments"]
});
```

## Options

### patterns (Array)

An array of glob expressions that specify which files to apply this plugin to. Default `['*.js']`.
