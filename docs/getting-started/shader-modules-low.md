# Shader Modules (Low-level)

So far, we've been using shader modules and hooks via the `Model` class, but these tools are also available own their via the the [assembleShaders](/docs/api-reference/shadertools/assemble-shaders) function in **@luma.gl/shadertools**. `assembleShaders` operates on the shader source as text, so it can be used in any framework or even with the WebGL API itself.

`assembleShaders` takes the base vertex and fragment source, as well as any modules and hookFunctions we want to include, and returns a JavaScript object with the the final shader sources in the `vs` and `fs` properties:

```js
const assembledShaders = assembleShaders(gl, {
  vs,
  fs,
  modules: [offsetLeftModule],
  hookFunctions: ['vs:OFFSET_POSITION(inout vec4 position)']
});
```

To demonstrate how this works, we'll re-implement the [shader hook tutorial](/docs/getting-started/shader-hooks) using WebGL calls directly. To start, we'll modify our imports:

```js
import {assembleShaders} from '@luma.gl/shadertools';
```

Our shaders and modules will be the same as before:

```js
const vs = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `
  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};

const offsetRightModule = {
  name: 'offsetRight',
  inject: {
    'vs:OFFSET_POSITION': 'position.x += 0.5;'
  }
};
```

We then create two programs by first assembling our base shaders with the desired modules and shader hooks, and then using them to create WebGL program objects:

```js
// Program 1

// Call assembleShaders to combine base source with modules.
const assembledShaders1 = assembleShaders(gl, {
  vs,
  fs,
  modules: [offsetLeftModule],
  hookFunctions: ['vs:OFFSET_POSITION(inout vec4 position)']
});

// Use assembled results to create our program.
const vShader1 = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader1, assembledShaders1.vs);
gl.compileShader(vShader1);

const fShader1 = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader1, assembledShaders1.fs);
gl.compileShader(fShader1);

const program1 = gl.createProgram();
gl.attachShader(program1, vShader1);
gl.attachShader(program1, fShader1);
gl.linkProgram(program1);
gl.useProgram(program1);
const colorLocation1 = gl.getUniformLocation(program1, 'color');
gl.uniform3fv(colorLocation1, new Float32Array([1.0, 0.0, 0.0]));

// Program 2

// Call assembleShaders to combine base source with modules.
const assembledShaders2 = assembleShaders(gl, {
  vs,
  fs,
  modules: [offsetRightModule],
  hookFunctions: ['vs:OFFSET_POSITION(inout vec4 position)']
});

// Use assembled results to create our program.
const vShader2 = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader2, assembledShaders2.vs);
gl.compileShader(vShader2);

const fShader2 = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader2, assembledShaders2.fs);
gl.compileShader(fShader2);

const program2 = gl.createProgram();
gl.attachShader(program2, vShader2);
gl.attachShader(program2, fShader2);
gl.linkProgram(program2);
gl.useProgram(program2);
const colorLocation2 = gl.getUniformLocation(program2, 'color');
gl.uniform3fv(colorLocation2, new Float32Array([0.0, 0.0, 1.0]));
```

With our final programs created, we can draw as we would in any other WebGL application. The complete port of the shader hook demo is listed below and the live version is available [here](/examples/getting-started/shader-modules-low).

```js
import {assembleShaders} from '@luma.gl/shadertools';

const vs = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};

const offsetRightModule = {
  name: 'offsetRight',
  inject: {
    'vs:OFFSET_POSITION': 'position.x += 0.5;'
  }
};

const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');
gl.clearColor(0, 0, 0, 1);

// Program 1

const assembled1 = assembleShaders(gl, {
  vs,
  fs,
  modules: [offsetLeftModule],
  hookFunctions: ['vs:OFFSET_POSITION(inout vec4 position)']
});

const vShader1 = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader1, assembled1.vs);
gl.compileShader(vShader1);

const fShader1 = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader1, assembled1.fs);
gl.compileShader(fShader1);

const program1 = gl.createProgram();
gl.attachShader(program1, vShader1);
gl.attachShader(program1, fShader1);
gl.linkProgram(program1);
gl.useProgram(program1);
const colorLocation1 = gl.getUniformLocation(program1, 'color');
gl.uniform3fv(colorLocation1, new Float32Array([1.0, 0.0, 0.0]));

// Program 2

const assembled2 = assembleShaders(gl, {
  vs,
  fs,
  modules: [offsetRightModule],
  hookFunctions: ['vs:OFFSET_POSITION(inout vec4 position)']
});

const vShader2 = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader2, assembled2.vs);
gl.compileShader(vShader2);

const fShader2 = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader2, assembled2.fs);
gl.compileShader(fShader2);

const program2 = gl.createProgram();
gl.attachShader(program2, vShader2);
gl.attachShader(program2, fShader2);
gl.linkProgram(program2);
gl.useProgram(program2);
const colorLocation2 = gl.getUniformLocation(program2, 'color');
gl.uniform3fv(colorLocation2, new Float32Array([0.0, 0.0, 1.0]));

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]), gl.STATIC_DRAW);

const positionLocation1 = gl.getAttribLocation(program1, 'position');
gl.vertexAttribPointer(positionLocation1, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation1);

const positionLocation2 = gl.getAttribLocation(program2, 'position');
gl.vertexAttribPointer(positionLocation2, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation2);

requestAnimationFrame(function draw() {
  requestAnimationFrame(draw);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.useProgram(program2);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
});
```
