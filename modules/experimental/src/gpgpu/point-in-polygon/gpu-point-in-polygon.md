# GPUPointInPolygon (WebGL2)

`GPUPointInPolygon` provides GPU accelerated PIP (Point-In-Polygon) testing functionality. A given set of 2D points and one or more 2D polygons, it computes, whether each point is inside or outside of any polygon.

## Sample Usage

```js
// construct data into required formats
const polygons =
  [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5]] // polygon vertices
];

// XY locations of 6 points
const points = [
  0, 0,
  5.0, -0.25,
  0.25, -0.25,
  0.25, 8.25,
  -0.25, 0.25,
  -3.45, 0.45
];

const positionBuffer = new Buffer(gl2, new Float32Array(points));
const count = 6;
// Allocate result buffer with enough space (2 floats for each point)
const filterValueIndexBuffer = new Buffer(gl2, count * 2 * 4);

const gpuPointInPolygon = new GPUPointInPolygon(gl2);
gpuPointInPolygon.update({polygons});
gpuPointInPolygon.filter({positionBuffer, filterValueIndexBuffer, count});

const results = filterValueIndexBuffer.getData();

// results array contains 2 elements (filterValue, index) for each point, where
// `filterValue` is '-1' if point in outside of polygons, otherwise index of the polygon in which it lies
// `index` is the point index in `positionBuffer`
```

## Constructor

### GPUPointInPolygon(gl: WebGL2RenderingContext, props: Object)

Creates a new `GPUPointInPolygon` object.

- `gl` - (WebGL2RenderingContext) - WebGL2 context.
- `opts.polygons` (`Array`, Optional) - Array of polygons, where each polygon is in following format:
  - `Simple polygon` : [[x1, y1], [x2, y2], ...]
  - `Polygon with holes` : [
    [[x1, y1], [x2, y2], ...], // outer ring
    [[a1, b1], [a2, b2], ...], // hole - 1
    [[s1, t1], [s2, t2], ...], // hole - 2
    ...
    ]
- `opts.textureSize` (`Number`, Optional) - Size of the texture to be used to create a polygon texture. Default value is 512.

## Methods

### update(opts)

- `opts.polygons` (`Array`, Optional) - Array of polygons, where each polygon is in following format:
  - `Simple polygon` : [[x1, y1], [x2, y2], ...]
  - `Polygon with holes` : [
    [[x1, y1], [x2, y2], ...] // outer ring
    [[a1, b1], [a2, b2], ...] // hole - 1
    [[s1, t1], [s2, t2], ...] // hole - 2
    ]
- `opts.textureSize` (`Number`, Optional) - Size of the texture to be used to create a polygon texture, that is used internally. Default value is 512.

NOTE: Index of a polygon in `opts.polygons` array is its id, and it is used to identify which polygon a point lies in the result buffer (check `filterValueIndexBuffer below`). A maximum of 256 values are supported for polygon id, i.e its valid range is [0, 255], if `opts.polygons` size is more than 256, polygon id will be clamped to 255.

### filter(opts)

- `opts.positionBuffer` (`Buffer`) - Buffer object containing X, Y position of input points.
- `opts.count` (`Number`) - Number of points to be processed.
- `opts.filterValueIndexBuffer` (`Buffer`) - Buffer object to hold results for each input point. After the method is executed, this buffer contains two floats `filterValue` and `index` for each input point, where :
  - `filterValue` is '-1' if point in outside of polygons, else index of the polygon in which it lies
  - `index` is the point index in `positionBuffer`

NOTE: If a point lies in the region that is overlapped by 2 or more polygons, `filterValue` will be index of one of the polygons.
