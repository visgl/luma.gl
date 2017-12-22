# API Reference

luma.gl constains a lot of classes and functions that might make new users wonder where to get started. The authors of luma.gl therefore organize classes and functions into groups, as shown in the following table and also in the folder structure of the source code

| Folder                           | Description |
| ---                              | --- |
| src/webgl | A set of classes covering all **WebGL objects**. Currently luma.gl supports WebGL 2.0. These classes organize the sprawling WebGL API and makes it easy to work with in JavaScript. |
| src/core | A set of common classes across all 3D graphics applications. They are on a higher abstraction level than the WebGL API. luma.gl's signature [`Model`](/#/documentation/api-reference/model) class is in this folder. |
| src/geometry | This folder contains a collection of geometric primitives extending from the base `Geometry` class, including `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`. They can be used to create [`Models`](/#/documentation/api-reference/model) class with common geometries|
| src/models | Some predefined subclasses of [`Models`](/#/documentation/api-reference/model) created from simple geometries from the `src/geometry` folder|
| src/io | Node.js and browser file loaders. Also enables using streams in browser. |
| src/packages/events | A very simple browser event handling class used by luma.gl examples |
| src/shadertools | luma.gl's internal shader module system and shader assembler utility |
| src/webgl-utils | Miscellanious utilies |

## WebGL Classes

The heart of luma.gl is the `webgl` module, a set of JavaScript class wrappers covering all WebGL objects. From luma.gl v4, These classes help organize the sprawling WebGL2 API and makes it much easier to program WebGL2 in JavaScript.

After creating a context, perhaps with luma.gl's [`createGLContext`](/#/documentation/api-reference/create-context) function, you have can start instantiating luma.gl's WebGL2 classes: [`Buffer`](/#/documentation/api-reference/buffer), [`FrameBuffer`](/#/documentation/api-reference/framebuffer), [`RenderBuffer`](/#/documentation/api-reference/renderbuffer), [`Program`](/#/documentation/api-reference/program), [`Shader`](/#/documentation/api-reference/shader), [`Texture2D`](/#/documentation/api-reference/texture-2), [`Texture2DArray`](/#/documentation/api-reference/texture-2-array), [`Texture3D`](/#/documentation/api-reference/texture-3d), [`TextureCube`](/#/documentation/api-reference/texture-cube), [`Query`](/#/documentation/api-reference/query), [`Sampler`](/#/documentation/api-reference/sampler), [`TransformFeedback`](/#/documentation/api-reference/transform-feedback), [`VertexArrayObject`](/#/documentation/api-reference/vertex-array)

## Core Classes

The `core` classes, with the signature [`Model`](/#/documentation/api-reference/model) class, represents a set of objects that is common in most 3D rendering libraries or engines. These objects are at higher abstraction levels than the actual WebGL objects and that can serve as the basic building blocks for most 3D applications.

* [`Model`](/#/documentation/api-reference/model) - A renderable object with program, attributes, uniforms and other state required for rendering 3D objects on the screen
* [`Geometry`](/#/documentation/api-reference/geometry) - Holds attributes and drawType for a primitive geometric object
* [`AnimationLoop`](/#/documentation/api-reference/animation-loop) - A simple animation loop that connects with browser's animation mechanism

<!---
* [`Object3D`](api-reference/core/object3d) - Base class, golds position, rotation, scale (TBD)
* [`Group`](api-reference/core/group) - Supports recursive travesal and matrix transformation
-->

## Basic Geometries and Models

A `Geomtry` object holds a set of attributes (native JavaScript arrays) (vertices, normals, texCoords, indices) and a `drawMode` prop to indicate how to interpret those vertices and normals as actual geometries.

There are several basic geometry classes predefined in luma.gl: `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`. They are all subclasses of the `Geometry` class.

Corresponding to those geometry objects, luma.gl also provides commonly used [`Model`](/#/documentation/api-reference/model) classes that consist of basic geometries. These include [`Cone`](/#/documentation/api-reference/model), [`Cube`](/#/documentation/api-reference/model-cube), [`Cylinder`](/#/documentation/api-reference/model-cylinder), [`IcoSphere`](/#/documentation/api-reference/model-icosphere), [`Plane`](/#/documentation/api-reference/model-plane) and [`Sphere`](/#/documentation/api-reference/model-sphere), etc...


Users are encouraged to write their own geometries and models and luma.gl could include them in its future releases.
