<p align="right">
  <a href="https://npmjs.org/package/@luma.gl/core">
    <img src="https://img.shields.io/npm/v/@luma.gl/core.svg?style=flat-square" alt="version" />
  </a>
  <a href="https://github.com/visgl/luma.gl/actions?query=workflow%3Atest+branch%3Amaster">
    <img src="https://github.com/visgl/luma.gl/workflows/test/badge.svg?branch=master" alt="build" />
  </a>
  <a href="https://npmjs.org/package/@luma.gl.core">
    <img src="https://img.shields.io/npm/dm/@luma.gl/core.svg?style=flat-square" alt="downloads" />
  </a>
  <a href='https://coveralls.io/github/visgl/luma.gl?branch=master'>
    <img src='https://img.shields.io/coveralls/visgl/luma.gl.svg?style=flat-square' alt='Coverage Status' />
  </a>
</p>

<h1 align="center">luma.gl | <a href="https://luma.gl">Docs</a></h1>

<h5 align="center">luma.gl: High-performance Toolkit for WebGL-based Data Visualization</h5>

## Overview

luma.gl is a GPU toolkit for the Web focused primarily on data visualization use cases. luma.gl aims to provide support for GPU programmers that need to work directly with shaders and want a low abstraction API that remains conceptually close to the WebGPU and WebGL APIs. Some features of luma.gl include:

- A robust GLSL shader module system.
- A convenient object-oriented API wrapping most WebGL objects
- Higher-level engine constructs to manage the animation loop, drawing and resource management

Unlike other common WebGL APIs, the developer can choose to use the parts of luma.gl that support their use case and leave the others behind.

While generic enough to be used for general 3D rendering, luma.gl's mandate is primarily to support GPU needs of data visualization frameworks in the vis.gl suite, such as:

- [kepler.gl](https://github.com/keplergl/kepler.gl) a powerful open source geospatial analysis tool for large-scale data sets
- [deck.gl](https://github.com/visgl/deck.gl) a WebGL-powered framework for visual exploratory data analysis of large data sets
- [streetscape.gl](https://github.com/uber/streetscape.gl) A visualization toolkit for autonomy and robotics data encoded in the XVIZ protocol

# Installation, Running Examples etc

For details, please refer to the extensive [online website](https://luma.gl).
