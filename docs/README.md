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

Like most frameworks, luma.gl has been developed with a certain philosophy in mind, reflecting things its designers feel to be important to their work.

- **A WebGL2-first API** - luma.gl enables applications to code using the latest WebGL2 APIs and write their shaders in the latest GLSL 3.00 ES syntax, and (as far as possible) transparently keeps your application backwards compatible with WebGL1 (using WebGL extensions, shader transpilation and other techniques).
- **Expose WebGL2 to Programmers** - while many WebGL frameworks make efforts to hide and wrap the WebGL2 API, luma.gl intentionally exposes it, providing JavaScript classes corresponding to all WebGL objects defined in the [WebGL2 Specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/).
- **Simplify use of the WebGL2 API** - Using the raw WebGL API is notoriously verbose and fiddly. luma.gl's classes provide the standard WebGL2 objects and methods, but take care of all the tedious default parameters and object bindings behind the scenes.
- **Shader Programming** - luma.gl's shadertools is a GLSL module system that provides extensive facilities for developing, modularizing, debugging and profiling GLSL shaders.
- **Performance First** - luma.gl has strong focus on performance, which includes a preference for providing APIs on lower abstraction levels than some popular WebGL frameworks, and an emphasis of using features such as *instanced rendering* for large data sets.
- **Doing Computations on the GPU** - A focus on use cases like GPU based computing using *transform feedback*, and other WebGL2 and [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units) techniques.


## History

luma.gl was originally created in late 2015 as a fork of [PhiloGL](https://github.com/philogb/philogl) to provide high performance WebGL rendering capability for [deck.gl](https://github.com/uber/deck.gl) - a 3D visualization framework for large scale data.

With the increased adoption of the deck.gl framework, usage of luma.gl has also gradually increased. In addition, various contributors have started to create up their own custom deck.gl layers for their apps, which requires usage of luma.gl's classes and APIs. This triggered a major rewrite the documentation and the website.

The arrival of WebGL2 was a major milestone in the WebGL landscape. With the release of luma.gl v4 in July 2017, luma.gl was positioned as a foundation library for high-performance GPU programming in JavaScript, and luma.gl v5 and v6 series releases have continued to provide incremental improvements in the WebGL2 and GPGPU areas.

Today, luma.gl is the foundational WebGL library in the vis.gl framework suite, but is designed so that it can be used stand-alone.


## Comparison with other WebGL frameworks

luma.gl is the natural choice if you are working with any of the WebGL-based frameworks in the vis.gl suite (deck.gl, kepler.gl etc).

If not, and you are considering what WebGL framework to use in an independent project, then as a first step towards a decision we recommend that you take a look at the things that have been built on luma.gl (e.g. vis.gl), make sure the luma.gl design philosophy resonates with you, and finally, review the luma.gl roadmap to see that the library is heading in a direction that is meaningful to you.

We think that luma.gl could be a great choice if:

* you want to work with, learn, and leverage the power of the WebGL2 API.
* you want "more control" by having the option of working close to WebGL.
* you want to do shader coding
* you are focusing on rendering large data sets with high performance.

We feel that luma.gl is currently not the strongest choice if:

* You wish to avoid learning anything about WebGL, working exclusively with higher abstractions.
* You need to load 3D models from various formats.
* You need traditional game engine support for scenegraphs, complex materials, advanced lighting options, etc.

If you are considering luma.gl because you are interested in using WebGL2 and you are looking for options, it is worth noting that some of the more mature WebGL frameworks have been rather slow to upgrade to WebGL2, either because of historical reasons (e.g. existing higher-level APIs do not provide an obvious upgrade path) or for philosophical reasons (e.g. maintainers feel that WebGL2 is not worthwhile for their particular use cases).

If you are interested in using luma.gl with a higher abstraction level API, or just see what can be achieved with luma.gl, take a look at deck.gl and kepler.gl.


## Future

The current development direction for luma.gl can be found in the roadmap page on our website.
