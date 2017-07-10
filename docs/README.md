# Overview

luma.gl is a Javascript framework that provides developers easier and complete access to underlying WebGL2 APIs provided by modern browsers.


## Design Goals

- **Full WebGL2 Access** - Unlike many other WebGL frameworks, luma.gl is designed expose the full WebGL2 APIs but makes it easier to use. luma.gl simply reorganizes WebGL2 objects and APIs so that it's more natural to users with experience in modern object-oriented programming languages.
- **Device feature and capability management** - Easily check if certain features and capability extensions are available on a specific device / platform / API combination and expose those functionalities with consistent APIs
- **Facilitate Shader Programming** - Extensive facilities for developing, modularizing, debugging and profiling GLSL shaders.
- **Advanced GPU Programming** - targets use cases like *instance rendering* for extremely large data sets, GPU based computing using *transform feedback*, and other WebGL2 / GPGPU techniques.
- **Performance First** - A strong focus on performance, which means providing access to APIs on lower abstraction levels.

## History

The arrival of WebGL2 is changing the WebGL framework landscape. With the release of v4, luma.gl is now positioned as a foundation library for high-performance GPU programming in JavaScript.

luma.gl was originally created in 2015 as a fork of [PhiloGL](https://github.com/philogb/philogl) to provide high performance WebGL rendering capability for [deck.gl](https://github.com/uber/deck.gl) - an advanced 3D geospatial visualization framework.

Later, with the increase of adoption of its downstream deck.gl framework, the adoption of luma.gl also rise gradually. In addition, various contributors within and outside the company started to build up their own repository of custom deck.gl layers for their apps, which requires understanding of luma.gl's classes and APIs. This prompts us to completely rewrite the documentation and rebuild the website for luma.gl, along with the brand new v4 release with compelete WebGL2 support.
