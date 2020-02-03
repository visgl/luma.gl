# RFC: GPU Accelerated Polygon Clipping

* Authors: Ravi Akkenapally
* Date: Feb 03, 2020
* Status: **Draft**

## Overview

Finding weather a point resides inside a polygon or not (in 2D space) has complexity Of `(N * M)`,  where `N` is the number of points and `M` is number of polygon edges. When performing this on large number of points takes a long time. This RFC proposes a GPU accelerated approach that can be implemented within `WebGL` limitation.

### Existing Research Work

Finding a point inside a polygon or not is also referred as PIP test. There has been lot of research work recently, to accelerate the PIP test using GPU.


Following is the list of papers I found and explored :

1. Speeding up Large-Scale Point-in-Polygon Test Based Spatial Join on GPUs ([Paper](http://www-cs.ccny.cuny.edu/~jzhang/papers/bigspaital_cr.pdf))

2. A cell-based point-in-polygon algorithm suitable for large sets of points ([Paper](https://www.sciencedirect.com/science/article/pii/S0098300401000371?via%3Dihub))

3. GPU Rasterization for Real-Time Spatial Aggregation over Arbitrary Polygons ([Paper](http://www.vldb.org/pvldb/vol11/p352-zacharatou.pdf))

4. A Simple and fast hardware-accelerated point-in-polygon test ([Paper](https://pdfs.semanticscholar.org/04a4/7b99d57cdf81bbd58a8dc21c2d15ac528855.pdf))

All of above work uses more advanced Graphics APIs (such as OpenGL Compute Shaders, CUDA, SSBO, etc) and or not supported either by WebGL1 or WebGL2. This RFC proposes a method that can be implemented with in WebGL1 and WebGL2 limitations.


## Proposed Approach

A texture based filtering can be implemented to perform PIP test on GPU. The idea is, user provided polygon(s) is triangulated and rendered to an offline frame buffer. And then, given points are run through transform feedback loop, each point is translated into the texture space and above texture is sampled, result of this sample determines if the point is inside or outside the polygon.


## Proposed New Components

### `texturefilter` (ShaderModule)

Provides shader functionality, for transforming input point to texture space and sample the texture to determine if the point is inside or outside the region defined by the texture. When performing polygon clipping, this texture is created by rendering polygons to it.

- Uniforms:
   - `bboxOrigin` (vec2)  // origin of the bounding box
   - `bboxSize` (vec2)  // Sizes in X and Y directions of the bounding box
   - `maskTexture` (sampler2D) // Texture created by rendering polygons
- VS Function:
     - `vec3 isWithInTextureMask(vec2 point)`: returns [flag, id, pointIndex]


### GPUPolygonFilter (JS Class) (WebGL2 only)

Class that builds a texture mask from given set of polygons, performs transform feedback loop on given set of points and generates the results. It internally uses `texturefilter` shader module.

#### Methods

##### Constructor

Constructor has following arguments, it constructs required objects such as `Texture2D` and `Transform`.

* `gl`(WebGL2Context): WebGL Context
* `opts` (Optional, Default: {}): Object containing following optional fields.
* `opts.polygons` (Array, Optional): One or an array of polygon objects. Each polygon object contains following :
 - `id` (Integer, Optional) : An integer in [0, 255] range, value outside this range will be clamped to this range. When not provided, index of this object in the array used as the value.
 - `polygon` (Array) : A simple or complex polygon in following format:

  Simple polygon: [[x1, y1], [x2, y2], ...]
  Complex polygon (with hole) :
    [                                           
      [[x1, y1], [x2, y2], ...], // outer ring
      [[hx1, hy1], [hx2, hy2], ...] // hole
    ]

##### update(opts)

`opts` object is same as `opts` argument of constructor. Once object is constructed, polygons can be updated.

##### run(opts)

* `opts.positionBuffer` (Buffer) : `Buffer` object containing position data of input points, must contain X and Y values.
* `opts.count` (Integer) : Count of number of points to be processed.
* `opts.resultBuffer` (Buffer): `Buffer` object where results will be stored. It should hold at least 3 elements (vec3) for each input point. Once this method is completed this buffer will contain a vec3 [`flag`, `id`, `index`]. Each element (vec3) of this buffer contains the result of corresponding point (vec2) from the `positionBuffer`.
 - `flag` : 0 if the point is outside the polygon, 1 if inside any polygon.
 - `id` : if the `flag` is `1`, this corresponds to the `id` of the polygon in which the point is inside.
 - `index` : this is the index of the point, which is same of the element id. Its usage is discussed in `Future Work` section.

##### delete()

* Deletes all owned resources.

Example :
```js
// Initialize

const polygonFilter = new GPUPolygonFilter(gl);

// update with polygons

polygonFilter.update([
  {
    id: 5,
    polygon: [[0, 0], [0, 1], [1, 1], [1, 0]]
  }
]);

const count = 4;
const positionBuffer = new Buffer(gl, new Float32Array([0.5, 0.5,  0, 0.5, 0, 3,  0.25, 0.75]));

// holds 4 vec3 elements
const resultBuffer = new Buffer(gl, new Float32Array(4 * 4 * 3));

polygonFilter.run({positionBuffer, count, resultBuffer});

// resultBuffer.getData() will return following array
// [
//   // flag, id, index
//   1, 5, 0, // inside
//   1, 5, 1, // inside
//   0, 0, 2, // outside
//   1, 5, 3 // inside
// ]

```

## WebGL1 Support

Praposed above new class `GPUPolygonFilter` is WebGL2 only. For WebGL1 applications, above shader module `textureFilter` can be used to and PIP test can be performed with in the application vertex shader. Based on the result vertices can be either discarded (in fragment shader) or any of the attribute (such as color) can be changed as per required visual effect.


## Precision

Compared to CPU, GPU's have low floating point precision and depending on the system, texture size is always limited to fixed number (usually 4K), hence there could be cases where a point very close the the boundary could have different result when PIP test is performed on CPU and GPU. To improve GPU's precession, `fp64-arithmetic` shader module can be used when generating texture coordinates in the `texturefilter` shader module.


## Future Work

Result of the PIP test returned by `GPUPolygonFilter` class resides in a `WebGLBuffer` object. Reading this `Buffer` object involves CPU and GPU sync. For a GPU bound application this causes a bottleneck, as it requires CPU and GPU sync. To avoid this, another `Transform Feedback` can be run on this Buffer object to produce the index buffer of point that have passed PIP test.


## Performance

CPU filtering is expensive as it performs filtering of each individual object in a serial fashion and it's complexity is O(N*E), where `N` is number of objects and `E` is number of polygon edges.

Above proposed GPU Filtering runs in parallel and the number polygons or polygon edges has no impact on time as everything is combined to same texture.

Texture sampling is not cheap and it comes with some overhead. But when number of points to be clipped and there are multiple polygons, the overhead could much smaller than the gains.

Here are the performance numbers for clipping randomly generated points (same set of points are used for both CPU and GPU) to a 10 side convex polygon. For CPU clipping, I used [@turf/boolean-within](https://www.npmjs.com/package/@turf/boolean-within)

|#Points| CPU #Iterations/Second | GPU #Iterations/Second | GPU is faster by |
|-|-|-|-|
|10K|411|6900| <b style="color:green">16X</b> |
|1M|4|4200| <b style="color:green">1000X</b> |
|10M|0.378|3120| <b style="color:green">8000X</b> |

Above number are taken on a 'MacbookPro' with '2.6 GHz Intel Core i7' CPU and 'Radeon Pro 560X 4 GB' GPU.
