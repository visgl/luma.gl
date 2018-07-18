# Overview

luma.gl is a Javascript framework that provides developers complete access to the WebGL2 API provided by modern browsers.


## Philosophy

luma.gl is developed with certain ideas in mind. It is developed with the following design goals:

- **A WebGL2-first API** - luma.gl enables applications to use the latest WebGL2 APIs (and write shaders in the new GLSL 3.00 ES syntax), while automatically remaining backwards compatible with WebGL1. No need to fiddle with WebGL extensions or shader versions, luma.gl handles translation/transpilation of WebGL2 to WebGL1 counterparts as needed).
- **Expose WebGL to Programmers** - luma.gl intentionally exposes (rather than hides) the WebGL API, providing easy-to-use JavaScript class wrappers for all WebGL2 objects defined in the [WebGL2 API](https://www.khronos.org/registry/webgl/specs/latest/2.0/).
- **Shader Programming** - luma.gl provides extensive facilities for developing, modularizing, debugging and profiling GLSL shaders.
- **Performance First** - A strong focus on performance, which includes a preference for providing APIs on lower abstraction levels than many WebGL frameworks.
- **Advanced GPU Programming** - targets use cases like GPU based computing using *transform feedback*, *instance rendering* for large data sets, and other WebGL2 and [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units) techniques.


## History

luma.gl was originally created in late 2015 as a fork of [PhiloGL](https://github.com/philogb/philogl) to provide high performance WebGL rendering capability for [deck.gl](https://github.com/uber/deck.gl) - a 3D visualization framework for large scale data.

With the increased adoption of the deck.gl framework, usage of luma.gl has also gradually increased. In addition, various contributors have started to create up their own custom deck.gl layers for their apps, which requires usage of luma.gl's classes and APIs. This triggered a major rewrite the documentation and the website.

The arrival of WebGL2 was a major milestone in the WebGL landscape. With the release of luma.gl v4 in July 2017, luma.gl was positioned as a foundation library for high-performance GPU programming in JavaScript, and luma.gl v5 and v6 series releases have continued to provide incremental improvements in the WebGL2 and GPGPU areas.

Today, luma.gl is the foundational WebGL library in the vis.gl framework suite, but is designed so that it can be used stand-alone.


## Comparison with other WebGL frameworks

luma.gl is the natural choice if you are working with any of the WebGL-based frameworks in the vis.gl suite (deck.gl, kepler.gl etc).

If not, and you are considering what WebGL framework to use in an independent projects, then as a first step towards a decision we recommend that you take a look at the things that have been built on luma.gl (e.g. vis.gl), make sure the luma.gl design philosophy resonates with you, and finally, review the luma.gl roadmap.

We think that luma.gl is great if:

* you want to work with (and perhaps learn) the WebGL2 API.
* you want full control by working directly with WebGL.
* you plan to do a lot of shader coding and you are focusing on rendering large data sets with "insane" performance.

We think that luma.gl is currently not the strongest choice if:

* You need to load models from various formats
* You need traditional game engine support for scenegraphs, materials, lighting, effects

If you are considering luma.gl because you are interested in WebGL2, it is worth noting that traditional WebGL frameworks seems slow to upgrade to WebGL2, either because of historical inertia (e.g. existing APIs do not provide an obvious upgrade path) or for philosophical reasons (e.g. maintainers feel that WebGL2 is not worthwhile for their use cases).

If you are interested in using luma.gl with a higher abstraction level API, or just see what can be achieved with luma.gl, take a look at deck.gl and kepler.gl.


## Future

The current development direction for luma.gl can be found in the roadmap page on our website.
