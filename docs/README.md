# Overview

luma.gl is a high-performance toolkit for WebGL-based data visualization. luma.gl is the core 3D rendering library in the [vis.gl](http://vis.gl/) framework suite.


## Versions

These docs are for
<a href="https://github.com/uber/luma.gl/blob/8.1-release/docs">
  <img style="margin-bottom: -4px" src="https://img.shields.io/badge/luma.gl-v8.1-brightgreen.svg?style=flat-square" />
</a> Looking for an older version?

<a href="https://github.com/uber/luma.gl/blob/8.0-release/docs">
  <img src="https://img.shields.io/badge/v-8.0-green.svg?style=flat-square" />
</a>
<a href="https://github.com/uber/luma.gl/blob/7.0-release/docs">
  <img src="https://img.shields.io/badge/v-7.0-green.svg?style=flat-square" />
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

<BR>
<BR>

luma.gl aims to provide tools for WebGL developers wether they wish to do high or low-level GPU programming. Polyfilling and shader composition utilities, for example, can be used while programming directly with the WebGL API, while resource management utilities provide higher-level 3D engine functionality.

The core use case for luma.gl is visualization of large datasets, but its design is generic enough for more general usage. Key strengths of luma.gl include:

- **A WebGL 2-first API** - luma.gl polyfills WebGL 1 contexts insofar as possible to support the WebGL 2 API. This allows applications to code using the latest WebGL 2 APIs while transparently keeping the application backwards compatible with WebGL 1 (using WebGL extensions, shader transpilation and other techniques).
- **Modular, Composable Tools** - It is left to the develop to decide what parts of luma.gl suit their application. Program at a higher level using WebGL wrapper classes or a `Model`, or simply polyfill the context and program using the WebGL 2 API.
- **High-performance Data Visualization** - luma.gl focuses on simplifying access to APIs that are particularly useful when visualizing large data sets, such as instanced drawing and transform feedback.

For some powerful examples of what can be achieved with luma.gl, take a look at [deck.gl](http://deck.gl/#/), [kepler.gl](https://kepler.gl/) and [avs.auto](https://avs.auto/#/).

## Future

We share information about the direction of luma.gl in the following ways:

* **[RFCs](https://github.com/uber/luma.gl/tree/7.3-release/dev-docs/RFCs)** - RFCs are technical writeups that describe proposed features in upcoming releases.
* **[Roadmap Document](https://luma.gl/#/documentation/overview/roadmap)** - (this document) A high-level summary of our current direction for future releases.
* **[Blog](https://medium.com/@vis.gl)** - We use the vis.gl blog to share information about what we are doing.
* **[Github Issues](https://github.com/uber/luma.gl/issues)** - The traditional way to start or join a discussion.
