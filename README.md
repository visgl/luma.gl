<p align="right">
  <a href="https://npmjs.org/package/luma.gl">
    <img src="https://img.shields.io/npm/v/luma.gl.svg?style=flat-square" alt="version" />
  </a>
  <a href="https://travis-ci.com/uber/luma.gl">
    <img src="https://api.travis-ci.com/uber/luma.gl.svg?branch=master" alt="build" />
  </a>
  <a href="https://npmjs.org/package/luma.gl">
    <img src="https://img.shields.io/npm/dm/luma.gl.svg?style=flat-square" alt="downloads" />
  </a>
  <a href='https://coveralls.io/github/uber/luma.gl?branch=master'>
    <img src='https://img.shields.io/coveralls/uber/luma.gl.svg?style=flat-square' alt='Coverage Status' />
  </a>
</p>

<h1 align="center">luma.gl | <a href="https://uber.github.io/luma.gl">Docs</a></h1>

<h5 align="center">luma.gl: High-performance Toolkit for WebGL-based Data Visualization</h5>


## Overview

luma.gl is a WebGL toolkit focused primarily on data visualization use cases. luma.gl aims to provide support for GPU programmers whether they wish to work directly with the WebGL API or at a higher level through convenient wrapper classes. Some features of luma.gl include:
- Polyfilling WebGL 2 functionality into a WebGL 1 context.
- A robust GLSL shader module system.
- A convenient object-oriented API wrapping most WebGL objects
- Higher-level engine constructs to manage the animation loop, drawing and resource management

Unlike many other WebGL APIs, however, the developer can choose to use the parts of luma.gl that support their use case and leave the others behind.

While generic enough to be used for general 3D rendering, luma.gl's mandate is primarily to support GPU needs of data visualization frameworks in the vis.gl suite, such as:
* [kepler.gl](https://github.com/uber/kepler.gl) a powerful open source geospatial analysis tool for large-scale data sets
* [deck.gl](https://github.com/uber/deck.gl) a WebGL-powered framework for visual exploratory data analysis of large data sets
* [streetscape.gl](https://github.com/uber/streetscape.gl) A visualization toolkit for autonomy and robotics data encoded in the XVIZ protocol


# Installation, Running Examples etc

For details, please refer to the extensive [online website](https://luma.gl).
