# Overview

luma.gl is a JavaScript framework intended for programmers who want full access to GPU-based computing and rendering in the browser using the capabilities of the WebGL2 API.


## High Level Design Goals

- **Advanced GPU Programming** - whether you need *instanced rendering* for extremely large data sets, or GPU based computing using *transform feedback*, or other WebGL2 / GPGPU techniques, luma.gl has you covered.
- **Performance First** - A strong focus on performance, complete with lower abstraction level APIs.
- **No hiding of WebGL** - Unlike many WebGL frameworks, luma.gl simplifies the use of WebGL2 but does not hide it. Learn luma.gl and you will learn WebGL2, all WebGL2 concepts are exposed.
- **Shader Programming** - Extensive facilities for modularizing, debugging and profiling your WebGL2 objects and your GLSL shaders.


## History

luma.gl was originally created to be a high performance WebGL rendering engine for [deck.gl](https://github.com/uber/deck.gl), which is an advanced 3D geospatial visualization framework that does all its rendering using luma.gl. Due to the adoption of deck.gl, luma.gl became increasingly important as a foundation library, but saw mostly indirect use.

The arrival of WebGL2 has changed the landscape, and luma.gl is a natural focal point for developing APIs and capabilities for high-performance GPU usage in browsers

luma.gl started out as a fork of [PhiloGL](https://github.com/philogb/philogl) however no effort has been made to maintain compatibility with PhiloGL-based applications.


## Module Structure

luma.gl is a somewhat large framework, but it is divided into a set of independent, well-defined submodules.
See the User's Guide for more information on luma.gl's module structure.

| Module                         | Description |
| ---                            | --- |
| [core](api-reference/core)     | A set of "traditional" 3D library classes on a slightly higher abstraction level than the WebGL2 API, that can serve as the basic building blocks for most applications. Contains luma.gl's signature [`Model`](model) class. |
| [webgl2](api-reference/webgl2) | The heart of luma.gl is the WebGL2 module, a set of classes covering all OpenGL objects exposed by the WebGL2 API. These classes organize the sprawling WebGL2 API and makes it easy to work with in JavaScript. |
| [geometry]()                   | Provides a collection of geometric primitives, including `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry` |
| [math](math.html)              | Small math library, `Vector3`, `Vector4`, `Matrix4`, `Quaternion` |
| [io](io.html)                  | Node.js loader support. Also enables using streams in browser. |
| [event](event.html)            | Browser Event handling |
