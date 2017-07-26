# Geometry Module

A geometry holds a set of attributes (native JavaScript arrays)
(vertices, normals, texCoords, indices) and a drawType.

| **Class** | **Description** |
| --- | --- | --- |
| [`Geometry`](geometry.html#Geometry) | Base class, holds vertex attributes and drawType |
| [`ConeGeometry`](geometry.html#ConeGeometry) | Vertex attributes for a cone |
| [`CubeGeometry`](geometry.html#CubeGeometry) | Vertex attributes for a cube |
| [`IcoSphereGeometry`](geometry.html#IcoSphereGeometry) | Vertex attributes for an icosahedron |
| [`PlaneGeometry`](geometry.html#PlaneGeometry) | Vertex attributes for a plane |
| [`SphereGeometry`](geometry.html#SphereGeometry) | Vertex attributes for a sphere |
| [`SphereGeometry`](geometry.html#SphereGeometry) | Vertex attributes for a sphere |

It should be fairly straightforward to use other primitives, e.g. from npm modules. As long as you have a number of attributes you can wrap them in a `Geometry` or set them directly on a `Model` or a `Program`.

