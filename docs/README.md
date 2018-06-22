# Overview

luma.gl is a Javascript framework that provides developers complete access to the WebGL2 API provided by modern browsers.


## Design Goals

- **Complete WebGL2 API** - Components cover the [full WebGL2 APIs](https://www.khronos.org/registry/webgl/specs/latest/2.0/). luma.gl provides WebGL2 classes that are stream-lined for us in modern object-oriented applications.
- **A WebGL2-first API** - Exposes a modern WebGL2 / GLSL 3.00 ES based API to applications. When WebGL2 is not available, luma.gl internally "translates" WebGL2 calls to WebGL1 (and transpiles shaders from GLSL 3.00 ES to GLSL 1.00 ES), letting apps use the latest APIs while remaining backwards portable.
- **Facilitate Shader Programming** - Extensive facilities for developing, modularizing, debugging and profiling GLSL shaders.
- **Performance First** - A strong focus on performance, which includes a preference for providing APIs on lower abstraction levels than some other WebGL frameworks.
- **Advanced GPU Programming** - targets use cases like GPU based computing using *transform feedback*, *instance rendering* for large data sets, and other WebGL2 and [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units) techniques.


## History

luma.gl was originally created in 2015 as a fork of [PhiloGL](https://github.com/philogb/philogl) to provide high performance WebGL rendering capability for [deck.gl](https://github.com/uber/deck.gl) - a 3D visualization framework for large scale data.

With the increased adoption of the deck.gl framework, usage of luma.gl has also gradually increased. In addition, various contributors have started to create up their own custom deck.gl layers for their apps, which requires usage of luma.gl's classes and APIs. This triggered a major rewrite the documentation and the website.

The arrival of WebGL2 was a major milestone in the WebGL landscape. With the release of luma.gl v4 in July 2017, luma.gl was positioned as a foundation library for high-performance GPU programming in JavaScript, and luma.gl v4.1, v5.0, v5.1 and v5.2 have continued to provide incremental improvements in the WebGL2 and GPGPU areas.

Today luma.gl is a foundational library in the vis.gl framework suite, but is very much designed so that it can be used stand-alone.


## Future

The current development direction for luma.gl can be found in the roadmap page on our website.
