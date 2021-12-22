# External Contexts

This tutorial will be a simple demonstration of how to use an externally created WebGL context with luma.gl's higher-level APIs. So far, we have either created a WebGL context ourselves to use with low-level APIs, or allowed the the `AnimationLoop` class to create a WebGL context for us. luma.gl's higher-level APIs expect some instrumentation on the WebGL context, so we can't just use a context we create ourselves with classes like `Model` and `Buffer`. The `AnimationLoop` class performs this instrumentation for us using the `instrumentGLContext` function from **@luma.gl/gltools**, and we can use this function directly if we want to control creation of the context or use a context passed to us by another framework (e.g. the [GeoSpatial](/examples/showcase/geospatial) example uses this technique with a WebGL context created by [MapboxGL](https://docs.mapbox.com/mapbox-gl-js/api/)).

We'll create a modified version of the [Hello Triangle](/docs/getting-started/hello-triangle) tutorial that creates a WebGL context manually rather than using the `AnimationLoop` class. To start with, we'll modify our imports:

```js
import {Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';
import {instrumentGLContext} from '@luma.gl/gltools';
```

We then create our context and pass it to `instrumentGLContext`:

```js
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

const gl = instrumentGLContext(canvas.getContext('webgl'));
```

This performs some polyfilling (done by `polyfillContext`, which we saw in the [Hello Instancing Low-level tutorial](/docs/getting-started/hello-instancing-low)) and tracks some additional metadata on the context, ensuring it will work properly with the rest of luma.gl. With that done, we simply create our luma.gl objects and draw as we did in the original example, with the sole difference being we create our own render loop using `requestAnimationFrame` rather than using the `AnimationLoop` callbacks.

```js
const gl = instrumentGLContext(canvas.getContext('webgl'));
gl.clearColor(0, 0, 0, 1);

const positionBuffer = new Buffer(gl, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));

const colorBuffer = new Buffer(gl, new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]));

// ...

const model = new Model(gl, {
  vs,
  fs,
  attributes: {
    position: positionBuffer,
    color: colorBuffer
  },
  vertexCount: 3
});

requestAnimationFrame(function draw() {
  requestAnimationFrame(draw);

  clear(gl, {color: [0, 0, 0, 1]});
  model.draw();
});
```

If all went well, a tri-color triangle should render as it did in the **Hello Triangle** example. A live version is available [here](/examples/getting-started/external-context), and the full source code is listed below for reference:

```js
import {Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';
import {instrumentGLContext} from '@luma.gl/gltools';

const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

const gl = instrumentGLContext(canvas.getContext('webgl'));
gl.clearColor(0, 0, 0, 1);

const positionBuffer = new Buffer(gl, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));

const colorBuffer = new Buffer(gl, new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]));

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

requestAnimationFrame(function draw() {
  requestAnimationFrame(draw);

  clear(gl, {color: [0, 0, 0, 1]});
  model.draw();
});
```
