# Hello Instancing (Mid-level)

In this tutorial, we'll work through how to do instanced drawing with luma.gl's mid-level APIs. This will involve using luma.gl's WebGL wrappers to do the drawing instead of the higher-level `Model`. We'll start from the [high-level app](./hello-instancing-high.md) we created. First we need to install the `shadertools` module so we can compose shaders without the `Model` class:
```bash
npm i @luma.gl/shadertools
```

Now we can update the imports:
```js
import {AnimationLoop} from '@luma.gl/engine';
import {Program, VertexArray, Buffer, clear} from '@luma.gl/webgl';
import {assembleShaders} from '@luma.gl/shadertools';
```
Most of the initialization is similar, but we'll replace the creation of `Model` with its individual parts: shader composition, a vertex array, and a program. Shader composition is handled by `assembleShaders`
```js
const assembled = assembleShaders(gl, {
  vs,
  fs,
  modules: [colorShaderModule]
});
```

We can then use the assembled shaders to create a `Program`:
```js
const program = new Program(gl, assembled);
```

The attributes for the draw are managed by a `VertexArray`:
```js
const vertexArray = new VertexArray(gl, {
  program,
  attributes: {
    position: positionBuffer,
    color: [colorBuffer, {divisor: 1}],
    offset: [offsetBuffer, {divisor: 1}]
  }
});
```
The `VertexArray` takes the `program` as an argument to infer attribute parameters.

The `vertexArray` and `program` are required for drawing, so we'll return them from `onInitialize`, and then use them in `onRender`:
```js
onInitialize({gl}) {
  // Setup...

  return {program, vertexArray};
}

onRender({gl, program, vertexArray}) {
  clear(gl, {color: [0, 0, 0, 1]});
  program.draw({
    vertexArray,
    vertexCount: 3,
    instanceCount: 4
  });
}
```

The scene should be identical to the one draw with the high-level API. The complete app is as follows:
```js
import {AnimationLoop} from '@luma.gl/engine';
import {Program, VertexArray, Buffer, clear} from '@luma.gl/webgl';
import {assembleShaders} from '@luma.gl/shadertools';

const colorShaderModule = {
  name: 'color',
  vs: `
    varying vec3 color_vColor;

    void color_setColor(vec3 color) {
      color_vColor = color;
    }
  `,
  fs: `
    varying vec3 color_vColor;

    vec3 color_getColor() {
      return color_vColor;
    }
  `
};

const loop = new AnimationLoop({
  onInitialize({gl}) {
    const positionBuffer = new Buffer(gl, new Float32Array([
      -0.2, -0.2,
      0.2, -0.2,
      0.0, 0.2
    ]));

    const colorBuffer = new Buffer(gl, new Float32Array([
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0,
      1.0, 1.0, 0.0
    ]));

    const offsetBuffer = new Buffer(gl, new Float32Array([
      0.5, 0.5,
      -0.5, 0.5,
      0.5,  -0.5,
      -0.5, -0.5
    ]));

    const vs = `
      attribute vec2 position;
      attribute vec3 color;
      attribute vec2 offset;

      void main() {
        color_setColor(color);
        gl_Position = vec4(position + offset, 0.0, 1.0);
      }
    `;
    const fs = `
      void main() {
        gl_FragColor = vec4(color_getColor(), 1.0);
      }
    `;

    const assembled = assembleShaders(gl, {
      vs,
      fs,
      modules: [colorShaderModule]
    });

    const program = new Program(gl, assembled);

    const vertexArray = new VertexArray(gl, {
      program,
      attributes: {
        position: positionBuffer,
        color: [colorBuffer, {divisor: 1}],
        offset: [offsetBuffer, {divisor: 1}]
      }
    });

    return {program, vertexArray};
  },

  onRender({gl, program, vertexArray}) {
    clear(gl, {color: [0, 0, 0, 1]});
    program.draw({
      vertexArray,
      vertexCount: 3,
      instanceCount: 4
    });
  }
});

loop.start();

```
