# Overview

luma.gl is a Javascript framework that provides developers complete access to the WebGL2 APIs provided by modern browsers.


## Design Goals

- **Complete WebGL2 API** - Unlike many other WebGL frameworks, luma.gl makes the [full WebGL2 APIs](https://www.khronos.org/registry/webgl/specs/latest/2.0/) available to apps. luma.gl provides WebGL2 classes that are stream-lined for us in modern object-oriented applications.
- **Facilitate Shader Programming** - Extensive facilities for developing, modularizing, debugging and profiling GLSL shaders.
- **Performance First** - A strong focus on performance, which includes a preference for providing APIs on lower abstraction levels than some other WebGL frameworks.
- **Advanced GPU Programming** - targets use cases like GPU based computing using *transform feedback*, *instance rendering* for large data sets, and other WebGL2 and [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units) techniques.
- **Device feature and capability management** - luma.gl checks if certain features/extensions are available on the current browser. and expose the available functionalities with a consistent API, making it easy to write apps that support the latest WebGL versions and WebGL extensions, but gracvefully fall back when they are not available.


## History

luma.gl was originally created in 2015 as a fork of [PhiloGL](https://github.com/philogb/philogl) to provide high performance WebGL rendering capability for [deck.gl](https://github.com/uber/deck.gl) - an advanced 3D geospatial visualization framework.

The arrival of WebGL2 was a major milestone the WebGL framework landscape. With the release of luma.gl v4 in July 2017, luma.gl was positioned as a foundation library for high-performance GPU programming in JavaScript, and luma.gl v4.1, v5.0, v5.1 and v5.2 have continued to provide incremental improvements in the WebGL2 and GPGPU areas.

Later, with the increased adoption of the deck.gl framework, the adoption of luma.gl also rise gradually. In addition, various contributors within and outside the company started to build up their own repository of custom deck.gl layers for their apps, which requires understanding of luma.gl's classes and APIs. This prompts us to completely rewrite the documentation and rebuild the website for luma.gl, along with the brand new v4 release with compelete WebGL2 support.
