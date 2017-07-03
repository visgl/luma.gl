# Overview

luma.gl is a JavaScript framework intended for programmers who want full access to GPU-based computing and rendering in the browser using the capabilities of the WebGL2 API.


## High Level Design Goals

- **Full WebGL2 Access** - Unlike many WebGL frameworks, luma.gl is designed expose the full WebGL2 API while simplifying its use. luma.gl does not hide WebGL under e.g. `Mesh` and `Material` classes. Learn luma.gl and you will learn WebGL2 and OpenGL ES, all WebGL2 concepts are exposed.
- **Facilitate Shader Programming** - Extensive facilities for developing, modularizing, debugging and profiling your GLSL shaders.
- **Advanced GPU Programming** - targets use cases like *instanced rendering* for extremely large data sets, GPU based computing using *transform feedback*, and similar WebGL2 / GPGPU techniques.
- **Performance First** - A strong focus on performance, which means providing access to APIs on lower abstraction levels.


## History

The arrival of WebGL2 is changing the WebGL framework landscape, and with the release of v4, luma.gl is now positioned as a foundation library for high-performance GPU programming in JavaScript.

luma.gl was originally created in 2015 to be a high performance WebGL rendering engine for [deck.gl](https://github.com/uber/deck.gl), which is an advanced 3D geospatial visualization framework that does all its rendering using luma.gl. Due to the growing adoption of deck.gl, luma.gl has seen constantly increasing use.

luma.gl started out as a fork of [PhiloGL](https://github.com/philogb/philogl) however no effort has been made to maintain compatibility with PhiloGL-based applications.
