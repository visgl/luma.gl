# User's Guide

luma.gl is a relatively large framework, but it is divided into submodules, which hopefully makes it can be approachable in a piece-wise fashion.

| Module                         | Description |
| ---                            | --- |
| [core](api-reference/core)     | A set of "traditional" 3D library classes on a slightly higher abstraction level than the WebGL2 API, that can serve as the basic building blocks for most applications. Contains luma.gl's signature [`Model`](model) class. |
| [webgl2](api-reference/webgl2) | The heart of luma.gl is the WebGL2 module, a set of classes covering all OpenGL objects exposed by the WebGL2 API. These classes organize the sprawling WebGL2 API and makes it easy to work with in JavaScript. |
| [geometry]()                   | Provides a collection of geometric primitives, including `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry` |
| [math](math.html)              | Small math library, `Vector3`, `Vector4`, `Matrix4`, `Quaternion` |
| [io](io.html)                  | Node.js loader support. Also enables using streams in browser. |
| [event](event.html)            | Browser Event handling |


## Core Classes

The [core module](api-reference/core), with the signature [`Model`](model) class, represent a set of fairly traditional 3D library classes on a slightly higher abstraction level than the WebGL2 API, that can serve as the basic building blocks for most applications.

* [`Model`](api-reference/core/model) - A renderable object with attributes and uniforms. |
* [`Geometry`](api-reference/core/geometry) - Holds attributes and drawType for a geometric primitive |
* [`Group`](api-reference/core/group) - Supports recursive travesal and matrix transformation |
* [`AnimationFrame`](api-reference/core/animation-frame) - render loop / app life cycle support |
* [`Object3D`](api-reference/core/object3d) - Base class, golds position, rotation, scale (TBD) |

Note the `Model` class is in many ways the quintessential luma.gl class. It ties together many concepts in luma.gl and is a good place to start reading if you are new to the framework.


## WebGL2 Classes

The heart of luma.gl is the [webgl2 module](api-reference/webgl2), a set of JavaScript class wrappers covering all WebGL2 API objects. These classes help organize the sprawling WebGL2 API and makes it much easier to program WebGL2 in JavaScript.

After creating a context, perhaps with luma.gl's [`createGLContext`](context.html) function, you have can start instantiating luma.gl's WebGL2 classes: `Buffer`, `FrameBuffer`, `RenderBuffer`, `Program`, `Shader`, `Texture2D`, `TextureCube`, `Texture2DArray`, `Texture3D`, `Query`, `Sampler`, `Sync`, `TransformFeedback`, `VertexArrayObject`, `VertexAttributes`, `VertexAttributes`.


## Geometric Primitives

A geometry holds a set of attributes (native JavaScript arrays) (vertices, normals, texCoords, indices) and a drawType.

Classes: `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`

It should be fairly straightforward to use other primitives, e.g. from npm modules. As long as you have a number of attributes you can wrap them in a `Geometry` or set them directly on a `Model` or a `Program`.



## Companion Modules

luma.gl offers a number of companion "modules":

* **WebGL Classes** - Make working with WebGL a little easier.
* **Math Library** - A math library with basic 2, 3 and 4 dimensional vectors and matrices. Allows you to manipulate arrays as if they were JavaScript objects.
* **shadertools** - Registry of reusable shader packages, with platform patching support.
* **Geometry Primitives** - Cubes, Spheres, Cones etc.
* **IO** - Load images and data both in the Browser and under Node.js.
* **Addons** - Browser Event handling
