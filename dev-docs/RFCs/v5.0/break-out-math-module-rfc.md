# RFC: Break out "math.gl"

* **Author**: Ib Green
* **Date**: Aug, 2017
* **Status**: **Implemented**

Note: Math classes have now been published as math.gl
* [math.gl](https://github.com/uber-web/math.gl).
* We have published `math.gl` on npm.


## Overview

Break out the luma.gl v4 math classes into a separate repository and npm module, as they are independently useful and would benefit from more focused docs.


## Motivation

* The math submodule in luma.gl is central to using luma.gl and to advanced use of deck.gl.
* **Better Documentation** - and test cases for the math library really deserve first-class citizen status. As long as they are part of luma.gl they will be least prioritized.
* **Avoid math code duplication** - Due to the complications involved with updating luma.gl we have seen the math submodule being copied into apps and forked, which is not desirable.
* **Size of gl-matrix dependency** - We love gl-matrix but the code size is an issue, we need to do special per-function imports. These imports are an ugly implementation detail that has started to spread out through our code. A separate math repo / module can manage the ugly imports.
* LICENSE-wise we are happy to reuse math code from other libraries. We want to copy code from other libraries such as gl-matrix and THREE.js. By keeping the math code in a separate repo we don't have to complicate the LICENSE files in our main repos.


## Proposed: Add SphericalCoordinates class

While projection matrix creation functions typically take a `lookAt` (Vector3) parameter, directions are often specified as spherical coordinates (pitch and bearing).
* To make is easy to use both spherical coordinates and direction vectors for the camera, we can extend our math library with a SphericalCoordinates class to make transformations between direction vectors and spherical coordinates easy. We already have an initial implementation.
