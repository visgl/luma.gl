# Geometry Module

A geometry holds a set of attributes (native JavaScript arrays)
(vertices, normals, texCoords, indices) and a drawType.

| **Class** | **Description** |
| --- | --- | --- |
| [`Geometry`](/docs/api-reference/core/geometry.md) | Base class, holds vertex attributes and drawType |
| [`ConeGeometry`](/docs/api-reference/core/geometry.md#ConeGeometry) | Vertex attributes for a cone |
| [`CubeGeometry`](/docs/api-reference/core/geometry.md#CubeGeometry) | Vertex attributes for a cube |
| [`IcoSphereGeometry`](/docs/api-reference/core/geometry.md#IcoSphereGeometry) | Vertex attributes for an icosahedron |
| [`PlaneGeometry`](/docs/api-reference/core/geometry.md#PlaneGeometry) | Vertex attributes for a plane |
| [`SphereGeometry`](/docs/api-reference/core/geometry.md#SphereGeometry) | Vertex attributes for a sphere |
| [`SphereGeometry`](/docs/api-reference/core/geometry.md#SphereGeometry) | Vertex attributes for a sphere |

It should be fairly straightforward to use other primitives, e.g. from npm modules. As long as you have a number of attributes you can wrap them in a `Geometry` or set them directly on a `Model` or a `Program`.

