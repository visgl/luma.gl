# Overview

luma.gl is a set of Javascript components for the WebGL2 API in modern browsers.


## Versions

These docs are for
<a href="https://github.com/uber/luma.gl/blob/7.0-release/docs">
  <img style="margin-bottom: -4px" src="https://img.shields.io/badge/luma.gl-v7.0-brightgreen.svg?style=flat-square" />
</a> Looking for an older version?

<a href="https://github.com/uber/luma.gl/blob/6.3-release/docs">
  <img src="https://img.shields.io/badge/v-6.3-green.svg?style=flat-square" />
</a>
<a href="https://github.com/uber/luma.gl/blob/6.2-release/docs">
  <img src="https://img.shields.io/badge/v-6.2-green.svg?style=flat-square" />
</a>
<a href="https://github.com/uber/luma.gl/blob/6.1-release/docs">
  <img src="https://img.shields.io/badge/v-6.1-green.svg?style=flat-square" />
</a>
<a href="https://github.com/uber/luma.gl/blob/6.0-release/docs">
  <img src="https://img.shields.io/badge/v-6.0-green.svg?style=flat-square" />
</a>
<a href="https://github.com/uber/luma.gl/blob/5.0-release/docs">
  <img src="https://img.shields.io/badge/v-5.0-green.svg?style=flat-square" />
</a>
<a href="https://github.com/uber/luma.gl/blob/4.0-release/docs">
  <img src="https://img.shields.io/badge/v-4.0-green.svg?style=flat-square" />
</a>
<a href="https://github.com/uber/luma.gl/tree/3.0-release/docs">
  <img src="https://img.shields.io/badge/v-3.0-green.svg?style=flat-square" />
</a>



## Philosophy

luma.gl's core philosophy is to expose the WebGL 2 API to developers, while providing fallbacks to WebGL 1 when necessary. The core use case for luma.gl is visualization of large datasets, but its design is generic enough for more general usage. Key aspects of that philosphy are:

- **A WebGL2-first API** - luma.gl enables applications to code using the latest WebGL2 APIs and write their shaders in the latest GLSL 3.00 ES syntax, and (as far as possible) transparently keeps your application backwards compatible with WebGL1 (using WebGL extensions, shader transpilation and other techniques).
- **Expose WebGL2 to Programmers** - while many WebGL frameworks make efforts to hide and wrap the WebGL2 API, luma.gl intentionally exposes it, providing JavaScript classes corresponding to WebGL objects defined in the [WebGL2 Specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/).
- **Simplify use of the WebGL2 API** - Using the raw WebGL API is notoriously verbose and fiddly. luma.gl's classes provide the standard WebGL2 objects and methods, but take care of all the tedious default parameters and object bindings behind the scenes.
- **Shader Programming** - luma.gl's shadertools is a GLSL module system that provides extensive facilities for developing, modularizing, debugging and profiling GLSL shaders.
- **Performance First** - luma.gl has strong focus on performance, which includes a preference for providing APIs on lower abstraction levels than some popular WebGL frameworks, and an emphasis of using features such as *instanced rendering* for large data sets.
- **Doing Computations on the GPU** - A focus on use cases like GPU based computing using *transform feedback*, and other WebGL2 and [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units) techniques.


## History

luma.gl was originally created in late 2015 as a fork of [PhiloGL](https://github.com/philogb/philogl) to provide high performance WebGL rendering capability for [deck.gl](https://github.com/uber/deck.gl) - a 3D visualization framework for large scale data. As deck.gl became increasingly popluar, luma.gl saw heavier usage.

WebGL 2 introduced several powerful features related to general purpose GPU usage (GPGPU) and reducing driver overhead for drawing massive numbers of objects, both of significant interest in the domain of geospatial visualization. luma.gl is built to expose these new features, while providing polyfills wherever possible when falling back to WebGL 1.

Today, luma.gl is the core 3D rendering library in the [vis.gl](http://vis.gl/) framework suite.


## Comparison with other WebGL frameworks

luma.gl is a strong choice if the following are priorities:
 * Low-level access to WebGL 2 constructs: programs, shaders, buffers, etc.
 * Access to the WebGL 2 API, with seamless fallbacks to WebGL 1 for functionality that can be polyfilled via, for example, WebGL 1 extensions.
 * A focus on drawing large number of objects with minimal overhead.

Note, however that luma.gl is not a complete game engine or scenegraph library, as its priority is to provide low-level access to the GPU. There is some support for higher-level abstractions like a `Model` class and a scenegraph, but these are relatively thin layers over core WebGL constructs.

For some powerful examples of what can be achieved with luma.gl, take a look at [deck.gl](http://deck.gl/#/), [kepler.gl](https://kepler.gl/) and [avs.auto](https://avs.auto/#/).


## Future

We share information about the direction of luma.gl in the following ways:

* **[RFCs](https://github.com/uber/luma.gl/tree/7.0-release/dev-docs/RFCs)** - RFCs are technical writeups that describe proposed features in upcoming releases.
* **[Roadmap Document](https://luma.gl/#/documentation/overview/roadmap)** - (this document) A high-level summary of our current direction for future releases.
* **[Blog](https://medium.com/@vis.gl)** - We use the vis.gl blog to share information about what we are doing.
* **[Github Issues](https://github.com/uber/luma.gl/issues)** - The traditional way to start or join a discussion.
