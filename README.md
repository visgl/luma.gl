LumaGL: A JavaScript WebGL Framework for Data Visualization
===========================================================

## Overview

LumaGL's primary focus is to provide a set of efficient and easy-to-use
WebGL building blocks enabling high-performance browser-based data visualizations.

## LumaGL Design Goals

- Focused on data visualization. While generic in nature, LumaGL
  will prioritize features that enable efficient rendering of large sets of data
  or that support improved visualization techniques.
- Modular: a set of small collaborating classes that can used together
  with components from other frameworks (e.g. stackgl).
- No "magic" global state. All components work with a standard
  WebGLRenderingContext.
- A modern, compact codebase leveraging the latest JavaScript standards (ES6+)
- Use modern JavaScript build technologies (browserify/babel/npm etc).

## History

LumaGL started as a fork of
PhiloGL (https://github.com/philogb/philogl) however no effort has been
made to maintain compatibility with PhiloGL-based applications.

# Installation

```sh
npm install luma.gl --save
```

# Documentation, Lessons and Examples

Luma.gl comes with 16 lessons, a number of examples, and a full set of
reference documenation.

## Quickstart

```
import {createGLContext, Program, Buffer, PerspectiveCamera} from 'luma.gl';

// Initialize WebGL context
const canvas = document.getElementById('lesson01-canvas');

const gl = createGLContext(canvas, {initialize: true});
const camera = new PerspectiveCamera({aspect: canvas.width/canvas.height});

const program = Program.fromDefaultShaders(gl);
program.use();
program.setBuffer(new Buffer(gl, {
  attribute: 'aVertexPosition',
  data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
  size: 3
}));

camera.view.$translate(-1.5, 0, -7);
program.setUniform('uMVMatrix', camera.view);
program.setUniform('uPMatrix', camera.projection);

// Draw Triangle
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```
