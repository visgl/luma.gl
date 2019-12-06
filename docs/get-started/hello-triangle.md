# Hello Triangle

This tutorial will demonstrate how to draw a triangle using luma.gl's high-level APIs. It is assumed you've set up your development environment as described in [Getting Started](./README.md). Your `index.js` file should look like the following:

```js
import {AnimationLoop} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl';

const loop = new AnimationLoop({
  onInitialize({gl}) {
    // Setup logic goes here
  },

  onRender({gl}) {
    // Drawing logic goes here
    clear(gl, {color: [0, 0, 0, 1]});
  }
});

loop.start();
```

First, we'll need to update our imports with the classes we'll be using, `Buffer` and `Model`:
```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';
```

Now let's create some buffers in the `onInitialize` method to hold our attribute data:
```js
  onInitialize({gl}) {
    // Setup logic goes here
    const positionBuffer = new Buffer(gl, new Float32Array([
      -0.5, -0.5,
      0.5, -0.5,
      0.0, 0.5
    ]));

    const colorBuffer = new Buffer(gl, new Float32Array([
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0
    ]));
  }
```
Next let's add the vertex and fragment shader code we'll be using to draw:
```js
  onInitialize({gl}) {
    // Setup logic goes here

    // Buffers...

    const vs = `
      attribute vec2 position;
      attribute vec3 color;

      varying vec3 vColor;

      void main() {
        vColor = color;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fs = `
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

  }
```

As a final step in our initialization, we'll create a `Model` and return it from `onInitialize`:

```js
  onInitialize({gl}) {
    // Setup logic goes here

    // Buffers...

    // Shaders...

    const model = new Model(gl, {
      vs,
      fs,
      attributes: {
        position: positionBuffer,
        color: colorBuffer
      },
      vertexCount: 3
    });

    return {model};
  }
```
A `Model` can be thought of as gathering all the WebGL pieces necessary for a single draw call: programs, attributes, uniforms. Also note that we return the `Model` instance we created. This will make it available to the `onRender` method.

Our `onRender` method is comparitavely much simpler:
```js
  onRender({gl, model}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model.draw();
  }
```
This clears the canvas and draws the `Model`. If all went well, you should see a tri-color triangle on a black background. See the live demo [here](/examples/getting-started/hello-triangle).

The entire application should look like the following:
```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const loop = new AnimationLoop({
  onInitialize({gl}) {
    const positionBuffer = new Buffer(gl, new Float32Array([
      -0.5, -0.5,
      0.5, -0.5,
      0.0, 0.5
    ]));

    const colorBuffer = new Buffer(gl, new Float32Array([
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0
    ]));

    const vs = `
      attribute vec2 position;
      attribute vec3 color;

      varying vec3 vColor;

      void main() {
        vColor = color;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fs = `
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

    const model = new Model(gl, {
      vs,
      fs,
      attributes: {
        position: positionBuffer,
        color: colorBuffer
      },
      vertexCount: 3
    });

    return {model};
  },

  onRender({gl, model}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model.draw();
  }
});

loop.start();
```

