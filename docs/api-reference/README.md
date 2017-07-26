# API Reference

luma.gl constains a lot of classes and functions that might make new users wonder where to get started. The authors of luma.gl therefore organize classes and functions into groups, as shown in the following table and also in the folder structure of the source code

| Folder                           | Description |
| ---                              | --- |
| src/webgl | A set of classes covering all **WebGL objects**. Currently luma.gl supports WebGL 2.0. These classes organize the sprawling WebGL API and makes it easy to work with in JavaScript. |
| src/core | A set of common classes across all 3D graphics applications. They are on a higher abstraction level than the WebGL API. luma.gl's signature [`Model`](/docs/api-reference/core/model) class is in this folder. |
| src/geometry | This folder contains a collection of geometric primitives extending from the base `Geometry` class, including `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`. They can be used to create `Model` class with common geometries|
| src/models | Some predefined `Models` created from simple geometries from the `src/geometry` folder|
| src/io | Node.js and browser file loaders. Also enables using streams in browser. |
| src/packges/math | A small math library, currently containing `Vector3`, `Vector4`, `Matrix4`, `Quaternion` classes based on the `gl-matrix` library |
| src/packges/events | A very simple browser event handling class used by luma.gl examples |
| src/shadertools | luma.gl's internal shader module system and shader assembler utility |
| src/webgl-utils | Miscellanious utilies |

## WebGL Classes

The heart of luma.gl is the `webgl` module, a set of JavaScript class wrappers covering all WebGL objects. From luma.gl v4, These classes help organize the sprawling WebGL2 API and makes it much easier to program WebGL2 in JavaScript.

After creating a context, perhaps with luma.gl's [`createGLContext`](context.html) function, you have can start instantiating luma.gl's WebGL2 classes: `Buffer`, `FrameBuffer`, `RenderBuffer`, `Program`, `Shader`, `Texture2D`, `TextureCube`, `Texture2DArray`, `Texture3D`, `Query`, `Sampler`, `Sync`, `TransformFeedback`, `VertexArrayObject`, `VertexAttributes`, `VertexAttributes`.

## Core Classes

The `core` classes, with the signature [`Model`](/docs/api-reference/core/model) class, represents a set of objects that is common in most 3D rendering libraries or engines. These objects are at higher abstraction levels than the actual WebGL objects and that can serve as the basic building blocks for most 3D applications.

* [`Model`](/docs/api-reference/core/model) - A renderable object with program, attributes, uniforms and other state required for rendering 3D objects on the screen
* [`Geometry`](/docs/api-reference/core/geometry) - Holds attributes and drawType for a primitive geometric object

<!--* [`Object3D`](api-reference/core/object3d) - Base class, golds position, rotation, scale (TBD)
* [`Group`](api-reference/core/group) - Supports recursive travesal and matrix transformation
-->
* [`AnimationLoop`](/docs/api-reference/core/animation-loop) - A simple animation loop that connects with browser's animation mechanism


## Basic Geometries and Models

A `Geomtry` object holds a set of attributes (native JavaScript arrays) (vertices, normals, texCoords, indices) and a `drawMode` prop to indicate how to interpret those vertices and normals as actual geometries.

There are several basic geometry classes predefined in luma.gl: `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`. They are all subclasses of the `Geometry` class.

Corresponding to those geometry objects, luma.gl also provides commonly used `Model` classes that consist of basic geometries. These include `Cone`, `Cube`, `Cylinder`, `IcoSphere`, `Plane`, `Sphere`, `TruncatedCone` and `ClipSpaceQuad`.


Users are encouraged to write their own geometries and models and luma.gl could include them in its future releases.

## Utilities

