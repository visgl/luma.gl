<p align="right">
  <a href="https://npmjs.org/package/luma.gl">
    <img src="https://img.shields.io/npm/v/luma.gl.svg?style=flat-square" alt="version" />
  </a>
  <a href="https://travis-ci.org/uber/luma.gl">
    <img src="https://img.shields.io/travis/uber/luma.gl/master.svg?style=flat-square" alt="build" />
  </a>
  <a href="https://npmjs.org/package/luma.gl">
    <img src="https://img.shields.io/npm/dm/luma.gl.svg?style=flat-square" alt="downloads" />
  </a>
  <a href="http://starveller.sigsev.io/uber/luma.gl">
    <img src="http://starveller.sigsev.io/api/repos/uber/luma.gl/badge" alt="stars" />
  </a>
</p>

<h1 align="center">luma.gl</h1>

<h5 align="center">luma.gl: A JavaScript WebGL Framework for Data Visualization</h5>

## Overview

luma.gl's primary focus is to provide a set of efficient and easy-to-use
WebGL building blocks enabling high-performance browser-based data
visualizations.

See
[**Examples**](http://uber.github.io/luma.gl/) and
[**Documentation**](http://uber.github.io/luma.gl/docs/).
[**Change Log**](https://github.com/uber/luma.gl/blob/master/CHANGELOG.md).


## luma.gl Design Goals

High Level Design Goals
- Focus on data visualization. While generic in nature, luma.gl
  will prioritize features that enable efficient rendering of
  large sets of data or that support improved visualization techniques.
- Provide a modern, easy-to-use API built from small independent classes,
  that simplifies WebGL usage without hiding WebGL from the programmer.

Technical Design Goals:
- Ensure smooth integration in modern applications by leveraging the
  latest JavaScript language standards (ES6+) and build technologies
  (browserify/babel/npm etc).
- Facilitate Shader Programming - Supports tools (such as
  [glslify](https://www.npmjs.com/package/glslify) that
  help developers efficiently create, organize and debug shader code.
- No "magic" global state that gets in the way of interoperability. All
  components work with a standard `WebGLRenderingContext` and can used
  together with components from other frameworks (e.g. stackgl).
- Built in support for WebGL and Shader debugging and profiling.


### Running luma.gl in Node.js

If `headless-gl` is installed and properly configured on your system
(it can often autodetect your configuration),
you should be able to run luma.gl in Node.js from the console,
even machines that do not have GPUs.

To do this, your application should import 'luma.gl/headless':
```js
import 'luma.gl/headless';
import {createGLContext, Model, ...} from 'luma.gl';
const gl = createGLContext({width, height, ...});
```

All luma.gl unit tests are run under Node.js in this configuration so it
should work out of the box. For more information, see
[headless-gl](https://www.npmjs.com/package/gl) and
[luma.gl documentation](http://uber.github.io/luma.gl/context.html#createGLContext).


## Compatibility

### [ndarray](https://www.npmjs.com/package/ndarray)
"Strided" `ndarrays` are returned by a number of good image-loading
npm modules and are also quite useful on their own.
- `Buffer`s and `Texture`s can accept `ndarray`s as long as they are backed by
  a typed javascript array. Note that if your `ndarray` is not "packed" you
  may need to transform it to a "packed" format `ndarray` first.
- Note: luma.gl has no direct dependencies on any of the ndarray npm modules.
  luma.gl uses "soft" detection techniques to decide if a data object is an
  `ndarray`.


## Usage

* [deck.gl](https://github.com/uber/deck.gl) builds 3D map visualization
  overlays on luma.gl.


## History

luma.gl started out as a fork of
[PhiloGL](https://github.com/philogb/philogl) however no effort has been
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
git clone git@github.com:uber/luma.gl.git
cd luma.gl
npm install
npm start
```
This builds the luma.gl bundle, starts a small local server, and opens a browser window on a welcome page, allowing you to run to all lessons and examples.

## Quickstart

The following code sample illustrates the "flavor" of the luma.gl API.
```javascript
import {createGLContext, Program, Buffer, PerspectiveCamera} from 'luma.gl';

// Initialize WebGL context
const canvas = document.getElementById('lesson01-canvas');

const gl = createGLContext({canvas});
const camera = new PerspectiveCamera({aspect: canvas.width/canvas.height});

const program = new Program(gl);
camera.view.$translate(new Vec3(-1.5, 0, -7));
program
  .setBuffers({
    aVertexPosition: new Buffer(gl).setData({
      data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
      size: 3
    })
  })
  .setUniforms({
    uMVMatrix: camera.view.
    uPMatrix: camera.projection
  })
  .use();

// Draw Triangle
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

# Developing

Use `npm start` to run the test server, it will open a web page from which
you can access the examples and lessons, and automatically update when you
save modified source files.


## Testing

**Master**
[![Build Status](https://travis-ci.org/uber/luma.gl.svg?branch=master)](https://travis-ci.org/uber/luma.gl)
**Dev**
[![Build Status](https://travis-ci.org/uber/luma.gl.svg?branch=dev)](https://travis-ci.org/uber/luma.gl)

Testing is performed on Travis CI and using a precommit hook. Local testing is
supported on three environments
* `npm test` - runs `npm run test-headless`
* `npm run test-headless` - Tests using headless-gl (Node.js, without jsdom).
* `npm run test-electron` - Tests using electron (a browser run-time).
* `npm run test-browser` - Tests in your browser, may be helpful
  to quickly debug test case failures since it autoreloads on changes and
  gives you full access to your browser's debugger.

When adding new features, or modifying existing ones, carefully consider if
unit testing can be provided.

## Publishing

Before publishing run
```
npm run prepublish
```
to generate the static bundles, the optional pretranspiled ES5 distribution,
and the documention.

## Building Documentation

To run the static site generation, you need to install the
`jekyll` and `pygments` ruby gems which can be done with the following command:
```sh
gem install jekyll pygments.rb
```
Once that's done, you can rebuild the static site using
the following npm script:
```
npm run build-docs
```
This will create a folder called `_docs` in the root directory
which contains all the static content for the site.  To view
the docs locally, run this command:
```
npm run docs
```

To publish the documentation to the `gh-pages` branch, run the following command
on a clean brach:
```
npm run docs-publish
```

