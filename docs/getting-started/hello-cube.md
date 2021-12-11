# Hello Cube

In this tutorial, we'll pull together several of the techniques we've looked at in the previous tutorials (and add a few new ones) to render a more complex scene: a rotating 3D cube. We'll use luma.gl's built-in geometry primitives to create a cube mesh and handle 3D math using [math.gl](https://math.gl/). **math.gl** can be installed by running `npm i math.gl`

As always, we'll start with our imports:

```js
import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Texture2D, clear} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {Matrix4} from '@math.gl/core';
```

Our shaders are somewhat more involved that we've seen before:

```js
const vs = `\
  attribute vec3 positions;
  attribute vec2 texCoords;

  uniform mat4 uMVP;

  varying vec2 vUV;

  void main(void) {
    gl_Position = uMVP * vec4(positions, 1.0);
    vUV = texCoords;
  }
`;

const fs = `\
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uEyePosition;

  varying vec2 vUV;

  void main(void) {
    gl_FragColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  }
`;
```

The two biggest additions to the shaders we've seen before are transforming the positions to rotate our model and create the 3D perspective effect (via the `uMVP` matrix) and sampling a texture to color fragments (via the `texture2D` call).

The set up to render in 3D involves a few extra steps compared to the triangles we've been drawing so far:

```js
  onInitialize({gl}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const texture = new Texture2D(gl, {
      data: 'vis-logo.png'
    });

    const eyePosition = [0, 0, 5];
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const mvpMatrix = new Matrix4();

    const model = new Model(gl, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      uniforms: {
        uTexture: texture
      }
    });

    return {
      model,
      viewMatrix,
      mvpMatrix
    };
  }
```

Some of the new techniques we're leveraging here are:

- Using `setParameters` to set up depth testing and ensure surfaces occlude each other properly. Compared to setting these parameters directly, the `setParameters` function has the advantage of tracking state and preventing redundant WebGL calls.
- Creating a texture using the `Texture2D` class. For our purposes, this is as simple as passing a URL to the image location (the image used in this tutorial is available [here](https://github.com/visgl/luma.gl/tree/master/examples/api/cubemap/vis-logo.png), but any JPEG or PNG image will do).
- Creating view and MVP matrices using **math.gl**'s `Matrix4` class to store the matrices we'll pass to our shaders to perform the animation and perspective projection.
- Generating attribute data using the `CubeGeometry` class and passing it to our `Model` using the `geometry` property. The geometry will automatically feed vertex position data into the `positions` attribute and texture coordinates (or UV coordinates) into the `texCoords` attribute.

Our `onRender` is similar to what we've seen before with the extra step of setting up the transform matrix and passing it as a uniform to the `Model`:

```js
  onRender({gl, aspect, tick, model, mvpMatrix, viewMatrix}) {
    mvpMatrix.perspective({fov: Math.PI / 3, aspect})
      .multiplyRight(viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    clear(gl, {color: [0, 0, 0, 1]});

    model.setUniforms({uMVP: mvpMatrix})
      .draw();
  }
```

We use `Matrix4`'s matrix operations to create our final transformation matrix, taking advantage of a few additional parameters that are passed to the `onRender` method:

- `aspect` is the aspect ratio of the canvas and is used to set up the perspective projection.
- `tick` is simply a counter that increments each frame. We use it to drive the rotation animation.

If all went well, you should see a rotating cube with the vis.gl logo painted on each side. The live demo is available [here](/examples/getting-started/hello-cube), and the full source code is listed below for reference:

```js
import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Texture2D, clear} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {Matrix4} from '@math.gl/core';

const vs = `\
  attribute vec3 positions;
  attribute vec2 texCoords;

  uniform mat4 uMVP;

  varying vec2 vUV;

  void main(void) {
    gl_Position = uMVP * vec4(positions, 1.0);
    vUV = texCoords;
  }
`;

const fs = `\
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uEyePosition;

  varying vec2 vUV;

  void main(void) {
    gl_FragColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  }
`;

const loop = new AnimationLoop({
  onInitialize({gl}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const texture = new Texture2D(gl, {
      data: 'vis-logo.png'
    });

    const eyePosition = [0, 0, 5];
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const mvpMatrix = new Matrix4();

    const model = new Model(gl, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      uniforms: {
        uTexture: texture
      }
    });

    return {
      model,
      viewMatrix,
      mvpMatrix
    };
  },

  onRender({gl, aspect, tick, model, mvpMatrix, viewMatrix}) {
    mvpMatrix
      .perspective({fov: Math.PI / 3, aspect})
      .multiplyRight(viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    clear(gl, {color: [0, 0, 0, 1]});

    model.setUniforms({uMVP: mvpMatrix}).draw();
  }
});

loop.start();
```
