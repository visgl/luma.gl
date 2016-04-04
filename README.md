LumaGL: A JavaScript WebGL Framework for Data Visualization
===========================================================

## Overview

LumaGL's primary focus is to provide a set of efficient and easy-to-use
WebGL building blocks enabling high-performance browser-based data visualizations.

See [**Examples**](http://uber-common.github.io/luma.gl/) and [**Documentation**](http://uber-common.github.io/luma.gl/_site/docs/core.html).

**Note** LumaGL has just been made public. Documentation is still in the process of being updated to correspond with the latest API changes.

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

To run examples:
```sh
git clone git@github.com:uber-common/luma.gl.git
cd luma.gl
npm install
npm start
```
This builds the LumaGL bundle, starts a small local server, and opens a browser window on a welcome page, allowing you to run to all lessons and examples.

## Quickstart

The following code sample illustrates the "flavor" of the LumaGL API.
```javascript
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

# Developing
**Master**[![Build Status](https://travis-ci.org/uber-common/luma.gl.svg?branch=master)](https://travis-ci.org/uber-common/luma.gl)
**Dev**[![Build Status](https://travis-ci.org/uber-common/luma.gl.svg?branch=dev)](https://travis-ci.org/uber-common/luma.gl)

Use `npm start` to run the test server, it will start a watch and automatically update when you save modified source files.

## Publishing

Before publishing run
```
npm run prepublish
```
to generate the static bundles, the optional pretranspiled ES5 distribution, and the documention.

## Building Documentation

To run the static site generation, you need to install the `jekyll` and `pygments` ruby gems which can be done with the following command:
```sh
gem install jekyll pygments.rb
```
Once that's done, you can rebuild the static site using the following npm script:
```
npm run build-docs
```
This will create a folder called `_site` in the root directory which contains all the static content for the site.  To view the docs locally, you can also run jekyll as a standalone server with the command:
```
jekyll serve --source=docs/
```
or 
```
npm run open-docs
```
