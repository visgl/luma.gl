# Hello Instancing (Low-level)

In this tutorial, we'll work through how to do instanced drawing with luma.gl's low-level APIs. This essentially means writing our app using the WebGL API directly, using only a few low-level helper functions to manage shaders and polyfilling. We'll need to install the `gltools` module so we can get a polyfilled context without the `AnimationLoop`:
```bash
npm i @luma.gl/gltools
```

Now we can update the imports:
```js
import {assembleShaders} from '@luma.gl/shadertools';
import {polyfillContext} from '@luma.gl/gltools';
```

Since we aren't using the `AnimationLoop`, we'll create our canvas and get a WebGL context directly:
```js
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

const gl = polyfillContext(canvas.getContext("webgl"));
gl.clearColor(0, 0, 0, 1);
```
Note that we're creating a WebGL 1 context here. This will allow us to demonstrate the polyfilling. Creating our program is *a little* more verbose than before:
```js
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

const vShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader, assembled.vs);
gl.compileShader(vShader);

const fShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader, assembled.fs);
gl.compileShader(fShader);

const program = gl.createProgram();
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.linkProgram(program);
```

Next we'll create our vertex array:
```js
const vertexArray = gl.createVertexArray();
gl.bindVertexArray(vertexArray);
```
Wait a minute... we're calling `createVertexArray` and `bindVertexArray` on a WebGL 1 context. But those functions aren't part of the WebGL 1 API! How is this working? The function `polyfillContext` that we used when creating our context will use WebGL extensions that are available to implement WebGL 2 functions on a WebGL 1 context. So we can just program against the WebGL 2 API!

Well... mostly... Polyfilling will only work if the necessary extensions are available. And some WebGL 2 features like occlusion queries and transform feedback simply aren't supported by polyfills.

Moving on... setting up the vertex array, concise as always in WebGL:
```js
const vertexArray = gl.createVertexArray();
gl.bindVertexArray(vertexArray);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -0.2, -0.2,
  0.2, -0.2,
  0.0, 0.2
]), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "position");
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  1.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 0.0, 1.0,
  1.0, 1.0, 0.0
]), gl.STATIC_DRAW);

const colorLocation = gl.getAttribLocation(program, "color");
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(colorLocation, 1);
gl.enableVertexAttribArray(colorLocation);

const offsetBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0.5, 0.5,
  -0.5, 0.5,
  0.5,  -0.5,
  -0.5, -0.5
]), gl.STATIC_DRAW);

const offsetLocation = gl.getAttribLocation(program, "offset");
gl.vertexAttribPointer(offsetLocation, 2, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(offsetLocation, 1);
gl.enableVertexAttribArray(offsetLocation);

gl.bindVertexArray(null);
```

And then we set up our draw loop:
```js
requestAnimationFrame(function draw() {
  requestAnimationFrame(draw);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindVertexArray(vertexArray);
  gl.useProgram(program);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 4);
});
```

If all went well, you should see the same scene as drawn by the high- and mid-level apps: four triangles of different colors. See the live demo [here](/examples/getting-started/hello-instancing-low).

We simply used luma.gl's `shadertools` and `gltools` to provide polyfilled instanced drawing and compose our shaders from modules. The full code for the app is available below:
```js
import {assembleShaders} from '@luma.gl/shadertools';
import {polyfillContext} from '@luma.gl/gltools';

const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
const gl = polyfillContext(canvas.getContext("webgl"));
gl.clearColor(0, 0, 0, 1);

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

const vShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader, assembled.vs);
gl.compileShader(vShader);

const fShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader, assembled.fs);
gl.compileShader(fShader);

const program = gl.createProgram();
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.linkProgram(program);


const vertexArray = gl.createVertexArray();
gl.bindVertexArray(vertexArray);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -0.2, -0.2,
  0.2, -0.2,
  0.0, 0.2
]), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "position");
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  1.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 0.0, 1.0,
  1.0, 1.0, 0.0
]), gl.STATIC_DRAW);

const colorLocation = gl.getAttribLocation(program, "color");
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(colorLocation, 1);
gl.enableVertexAttribArray(colorLocation);

const offsetBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0.5, 0.5,
  -0.5, 0.5,
  0.5,  -0.5,
  -0.5, -0.5
]), gl.STATIC_DRAW);

const offsetLocation = gl.getAttribLocation(program, "offset");
gl.vertexAttribPointer(offsetLocation, 2, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(offsetLocation, 1);
gl.enableVertexAttribArray(offsetLocation);

gl.bindVertexArray(null);

requestAnimationFrame(function draw() {
  requestAnimationFrame(draw);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindVertexArray(vertexArray);
  gl.useProgram(program);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 4);
});
```
