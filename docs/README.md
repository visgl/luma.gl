# Introduction

<span />This is the luma.gl documentation, covering
<a href="https://github.com/visgl/luma.gl/blob/8.5-release/docs">
  <img style="margin-bottom: -4px" src="https://img.shields.io/badge/v-8.5-brightgreen.svg?style=flat-square" />
</a>
<span />Looking for an older version?
<a href="https://github.com/visgl/luma.gl/blob/8.4-release/docs">
  <img src="https://img.shields.io/badge/v-8.4-green.svg?style=flat-square" />
</a>
<a href="https://github.com/visgl/luma.gl/blob/7.3-release/docs">
  <img src="https://img.shields.io/badge/v-7.3-green.svg?style=flat-square" />
</a>
<a href="https://github.com/visgl/luma.gl/blob/6.4-release/docs">
  <img src="https://img.shields.io/badge/v-6.4-green.svg?style=flat-square" />
</a>

luma.gl is a GPU toolkit for the Web, focused primarily on visualization of large datasets,
however the design is generic and supports more general 3D usage.
luma.gl is the core rendering library in the [vis.gl](http://vis.gl/) framework suite.

## Highlights

luma.gl aims to help developers stay in control of GPU programming and
work directly with shaders and GPU data structures. By offering a low abstraction API that
remains conceptually close to the underlying WebGPU and WebGL APIs, luma.gl focuses on the processing
of data on the GPU rather than higher level 3D engine type abstractions.

Some key features of luma.gl are:

- A device-independent API that enables applications to portably access GPU resources.
- A GLSL shader system supporting modules, dependencies, injection, transpilation etc.
- A few high-level classes such as `Model`, `Transform` and `AnimationLoop`.

## Showcases

For some high-impact examples of what can be achieved with luma.gl, take a look at:

- [kepler.gl](https://kepler.gl/) ([GitHub](https://github.com/keplergl/kepler.gl)) a powerful open source geospatial analysis tool for large-scale data sets
- [deck.gl](http://deck.gl/#/) ([GitHub](https://github.com/visgl/deck.gl)) a WebGL-powered framework for visual exploratory data analysis of large data sets
- [avs.auto](https://avs.auto/#/) and [streetscape.gl](https://github.com/uber/streetscape.gl) A visualization toolkit for autonomy and robotics data encoded in the XVIZ protocol

|  <img height="200" src="https://deck.gl/images/showcase/kepler-gl.jpg" /> | <img height="200" src="https://deck.gl/images/showcase/avs.jpg" /> | <img height="200" src="https://deck.gl/images/showcase/viv.jpg" />
| :---: | :---: | :---: |
| <center>kepler.gl</center> | <center>AVS</center> | <center>VIV</center> |

## Standards

<center>
  <img height="80" src="https://raw.githubusercontent.com/gpuweb/gpuweb/3b3a1632ff1ad6a573330a58710e341bb9d65576/logo/webgpu-horizontal.svg" />
  <img height="80" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/webgl2.jpg" />
  <img height="80" src="https://raw.github.com/visgl/deck.gl-data/master/images/gltf.png" />
</center>

luma.gl supports the latest 3D web standards from Khronos and W3C.
In addition, luma.gl integrates seamlessly with the companion [loaders.gl](https://loaders.gl) framework,
ensuring that a long list of 3D and geospatial data format standards are supported out of the box.

## Open Governance

<center>
<a href="https://vis.gl">
  <img height="30" src="https://raw.githubusercontent.com/visgl/vis.gl/master/src/images/logos/linux-foundation.svg" />
  <span style="padding-left: 50px;" />
  <img height="30" src="https://raw.githubusercontent.com/visgl/vis.gl/master/src/images/logos/ucf-color-hztl.svg" />
</a>
</center>

luma.gl is a part of the <a href="https://vis.gl"><b>vis.gl framework suite</b></a>, an open governance Linux Foundation project that is developed collaboratively by multiple organizations and individuals and the Urban Computing Foundation.

Check out the [vis.gl Medium blog](https://medium.com/vis-gl), and join the community
in the [Slack workspace](https://join.slack.com/t/deckgl/shared_invite/zt-7oeoqie8-NQqzSp5SLTFMDeNSPxi7eg) for learning and discussions.

Current main contributors to the development and maintenance of luma.gl:

<center>
<p style="margin-left: auto; margin-right: auto;">
  <a href="https://foursquare.com">
    <img height="40" src="https://raw.githubusercontent.com/visgl/vis.gl/master/src/images/logos/unfolded-logo.png" />
  </a>
</p>
</center>

## History

luma.gl was originally created at Uber in 2015 as an open source project to support deck.gl. It started out as a fork of the [PhiloGL](https://github.com/senchalabs/philogl) WebGL library but has evolved beyond recognition.

In 2019, luma.gl was transferred to open governance in the Linux Foundation.

## Future

luma.gl keeps evolving based on the needs of downstream frameworks and applications.
One primary focus is supporting more advanced GPU compute use cases.

We share information about the direction of luma.gl in the following ways:

- **[RFCs](https://github.com/visgl/luma.gl/tree/master/dev-docs/RFCs)** - RFCs are technical writeups that describe proposed features in upcoming releases.
- **[Roadmap Document](https://luma.gl/#/documentation/overview/roadmap)** - (this document) A high-level summary of our current direction for future releases.
- **[Blog](https://medium.com/@vis.gl)** - We use the vis.gl blog to share information about what we are doing.
- **[Github Issues](https://github.com/visgl/luma.gl/issues)** - The traditional way to start or join a discussion.
