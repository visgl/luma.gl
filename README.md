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

<h5 align="center">luma.gl: A JavaScript WebGL2 Framework for Data Visualization</h5>

## Overview

luma.gl's provides efficient and easy-to-use WebGL2-based building blocks enabling high-performance GPU-based data visualizations and computations on your browser.

See
[**Examples**](http://uber.github.io/luma.gl/) and
[**Documentation**](http://uber.github.io/luma.gl/docs/).
[**Change Log**](https://github.com/uber/luma.gl/blob/master/CHANGELOG.md).


## luma.gl Design Goals

High Level Design Goals
- **Focus on data visualization** - While generic, luma.gl prioritizes features that enable efficient rendering of large data sets or that support improved visualization techniques. In practice this means that luma.gl is an early adopter of techniques like instanced rendering, WebGL2 and GPGPU techniques.
- **Celebrate WebGL** Simplify the use of WebGL but do not hide it from the programmer. Learn luma.gl and you learn WebGL.
- **Simplification, not abstraction** Provide an API that simplifies WebGL usage without hiding WebGL from the programmer. Abstractions are good but they should be built on top of luma.gl.

Secondary Design Goals:
- Focus on Shader Programming - Let's efficiently create, organize and debug shader code.
- **Interoperability** - No "magic" global state that gets in the way of interoperability. All components work with a standard `WebGLRenderingContext` and can used together with components from other frameworks (e.g. stackgl).
- **Debugging** Built in support for debugging and profiling WebGL and GLSL haders.


## Usage

* [deck.gl](https://github.com/uber/deck.gl) builds 3D map visualization overlays on luma.gl.


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


# Developing

Use `npm start` to run the test server, it will open a web page from which
you can access the examples and lessons, and automatically update when you
save modified source files.


## Testing

Testing is performed on Travis CI and using a precommit hook. Local testing is
supported on three environments
* `npm test` - runs `npm run test-headless`
* `npm run test-browser` - Tests in your browser, may be helpful
  to quickly debug test case failures since it autoreloads on changes and
  gives you full access to your browser's debugger.

When adding new features, or modifying existing ones, carefully consider if
unit testing can be provided.
