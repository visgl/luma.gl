luma.gl: A JavaScript WebGL Framework for Data Visualization
============================================================

## Overview

luma.gl's primary focus is to provide a set of efficient and easy-to-use
WebGL building blocks enabling high-performance browser-based data
visualizations.

See
[**Examples**](http://uber/.github.io/luma.gl/) and
[**Documentation**](http://uber/.github.io/luma.gl/_site/docs/core.html).


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
- Facilitate Shader Programming - Adapts techniques (such as
  [glslify](https://www.npmjs.com/package/glslify) that
  help developers efficiently create, organize and debug shader code.
- No "magic" global state that gets in the way of interoperability. All
  components work with a standard `WebGLRenderingContext` and can used
  together with components from other frameworks (e.g. stackgl).
- Built in support for WebGL and Shader debugging and profiling.


### Running luma.gl outside of a Browser (Node.js)

luma.gl's unit tests run in Node.js (`npm run test-headless`, see
[Travis CI](https://travis-ci.org/uber/luma.gl) using
`[headless-gl](https://www.npmjs.com/package/gl)`

If `headless-gl` is properly configured on your system (it can often autodetect
your configuration), you should be able to run luma.gl even on e.g.
virtual machines that do not have GPUs (uses Mesa emulation).
See [headless-gl](https://www.npmjs.com/package/gl) for more information
about such configurations. While you can use `headless-gl` directly, to
create a context, luma.gl provides some helpful integration points:
* The `createGLContext` method will automatically create a browser or
  headless context depending on the environment, enabling you to write
  clean code that works both in both environments
* luma.gl has implementations of IO functions, including image loading,
  that work both in browser and under Node.js. (Browser apps tend to rely on
  the DOM `Image` class to load images, which is not available under Node.js).
**Note** To avoid including the `gl` module in environments that don't
need it, headless-gl is not installed by default (i.e. `gl` is not a
package dependency of luma.gl). Instead, the app must install and import
headless-gl itself, and pass headless-gl as an argument to `createGLContext`.


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


## Roadmap

These are some ideas for next steps for luma.gl:

* WebGL2 support - Continue to build javascript abstractions for
  WebGL2 features, especially transform feedback.

* Replace current math library with `gl-matrix` -
  Increase interoperability with e.g.
  `stack.gl` and remove the need to maintain our own math library.

* Break out IO library to a separate module - Most of luma.gl's dependencies
  come from this module, but these dependencies are not needed for smaller
  browser based apps, so these functions should really be optional.


## History

luma.gl started out as a fork of
[PhiloGL](https://github.com/philogb/philogl) however no effort has been
made to maintain compatibility with PhiloGL-based applications.

luma.gl is considered a companion library to
[deck.gl](https://github.com/uber/deck.gl).


# Installation

```sh
npm install luma.gl --save
```

# Documentation, Lessons and Examples

Luma.gl comes with 16 lessons, a number of examples, and a full set of
reference documenation.

To run examples:
```sh
git clone git@github.com:uber//luma.gl.git
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
This will create a folder called `_site` in the root directory
which contains all the static content for the site.  To view
the docs locally, you can also run jekyll as a standalone server
with the command:
```
jekyll serve --source=docs/
```
or
```
npm run open-docs
```
