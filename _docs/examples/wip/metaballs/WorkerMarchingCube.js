var MarchingCubes;

(function() {
   var edgeTable = new Float32Array([
0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0]);

  var triTable = [
new Int8Array([-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1]),
new Int8Array([8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1]),
new Int8Array([3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1]),
new Int8Array([4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1]),
new Int8Array([4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1]),
new Int8Array([9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1]),
new Int8Array([10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1]),
new Int8Array([5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1]),
new Int8Array([5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1]),
new Int8Array([8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1]),
new Int8Array([2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1]),
new Int8Array([2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1]),
new Int8Array([11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1]),
new Int8Array([5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1]),
new Int8Array([11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1]),
new Int8Array([11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1]),
new Int8Array([2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1]),
new Int8Array([6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1]),
new Int8Array([3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1]),
new Int8Array([6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1]),
new Int8Array([6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1]),
new Int8Array([8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1]),
new Int8Array([7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1]),
new Int8Array([3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1]),
new Int8Array([0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1]),
new Int8Array([9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1]),
new Int8Array([8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1]),
new Int8Array([5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1]),
new Int8Array([0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1]),
new Int8Array([6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1]),
new Int8Array([10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1]),
new Int8Array([1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1]),
new Int8Array([0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1]),
new Int8Array([3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1]),
new Int8Array([6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1]),
new Int8Array([9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1]),
new Int8Array([8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1]),
new Int8Array([3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1]),
new Int8Array([10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1]),
new Int8Array([10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1]),
new Int8Array([2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1]),
new Int8Array([7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1]),
new Int8Array([2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1]),
new Int8Array([1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1]),
new Int8Array([11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1]),
new Int8Array([8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1]),
new Int8Array([0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1]),
new Int8Array([7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1]),
new Int8Array([7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1]),
new Int8Array([10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1]),
new Int8Array([0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1]),
new Int8Array([7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1]),
new Int8Array([6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1]),
new Int8Array([4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1]),
new Int8Array([10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1]),
new Int8Array([8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1]),
new Int8Array([1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1]),
new Int8Array([10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1]),
new Int8Array([10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1]),
new Int8Array([9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1]),
new Int8Array([7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1]),
new Int8Array([3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1]),
new Int8Array([7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1]),
new Int8Array([3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1]),
new Int8Array([6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1]),
new Int8Array([9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1]),
new Int8Array([1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1]),
new Int8Array([4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1]),
new Int8Array([7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1]),
new Int8Array([6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1]),
new Int8Array([0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1]),
new Int8Array([6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1]),
new Int8Array([0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1]),
new Int8Array([11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1]),
new Int8Array([6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1]),
new Int8Array([5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1]),
new Int8Array([9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1]),
new Int8Array([1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1]),
new Int8Array([10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1]),
new Int8Array([0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1]),
new Int8Array([11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1]),
new Int8Array([9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1]),
new Int8Array([7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1]),
new Int8Array([2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1]),
new Int8Array([9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1]),
new Int8Array([9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1]),
new Int8Array([1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1]),
new Int8Array([0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1]),
new Int8Array([10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1]),
new Int8Array([2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1]),
new Int8Array([0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1]),
new Int8Array([0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1]),
new Int8Array([9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1]),
new Int8Array([5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1]),
new Int8Array([5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1]),
new Int8Array([8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1]),
new Int8Array([9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1]),
new Int8Array([1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1]),
new Int8Array([3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1]),
new Int8Array([4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1]),
new Int8Array([9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1]),
new Int8Array([11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1]),
new Int8Array([2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1]),
new Int8Array([9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1]),
new Int8Array([3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1]),
new Int8Array([1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1]),
new Int8Array([4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1]),
new Int8Array([0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1]),
new Int8Array([1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]),
new Int8Array([-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1])
];

  var abs = Math.abs, sqrt = Math.sqrt;

  function interp(isolevel, p1, p2, valp1, valp2) {
   if (abs(isolevel-valp1) < 0.00001)
      return p1;
   if (abs(isolevel-valp2) < 0.00001)
      return p2;
   if (abs(valp1-valp2) < 0.00001)
      return p1;
   var mu = (isolevel - valp1) / (valp2 - valp1);
   return [
     p1[0] + mu * (p2[0] - p1[0]),
     p1[1] + mu * (p2[1] - p1[1]),
     p1[2] + mu * (p2[2] - p1[2])
   ];
  }

  var normalCache = {};
  function normal(p, fn) {
    if (normalCache[p]) {
      return normalCache[p];
    }
    var x = fn(p[0] - .01, p[1], p[2]) - fn(p[0] + .01, p[1], p[2]),
        y = fn(p[0], p[1] - .01, p[2]) - fn(p[0], p[1] + .01, p[2]),
        z = fn(p[0], p[1], p[2] - .01) - fn(p[0], p[1], p[2] + .01),
        d = sqrt(x * x + y * y + z * z);
    return (normalCache[p] = [ x / d, y / d, z / d ]);
  }
  

  MarchingCubes = {
    polygonise: function(grid, isolevel, fn) {
       var i, 
           cubeindex = 0,
           vertlist = Array(12),
           normlist = Array(12),
           vertices = [],
           normals = [],
           ans = [],
           indexedTable;

      /*
        Determine the index into the edge table which
        tells us which vertices are inside of the surface
      */
      cubeindex = 0;
      if (grid.val[0] < isolevel) cubeindex |= 1;
      if (grid.val[1] < isolevel) cubeindex |= 2;
      if (grid.val[2] < isolevel) cubeindex |= 4;
      if (grid.val[3] < isolevel) cubeindex |= 8;
      if (grid.val[4] < isolevel) cubeindex |= 16;
      if (grid.val[5] < isolevel) cubeindex |= 32;
      if (grid.val[6] < isolevel) cubeindex |= 64;
      if (grid.val[7] < isolevel) cubeindex |= 128;
      indexedTable = triTable[cubeindex];

      /* Cube is entirely in/out of the surface */
      if (edgeTable[cubeindex] == 0)
        return false;

      /* Find the vertices where the surface intersects the cube */
      if (edgeTable[cubeindex] & 1) {
          vertlist[0] = interp(isolevel,grid.p[0],grid.p[1],grid.val[0],grid.val[1]);
          normlist[0] = normal(vertlist[0], fn);
      }
     if (edgeTable[cubeindex] & 2) {
          vertlist[1] = interp(isolevel,grid.p[1],grid.p[2],grid.val[1],grid.val[2]);
          normlist[1] = normal(vertlist[1], fn);
      }
      if (edgeTable[cubeindex] & 4) {
          vertlist[2] = interp(isolevel,grid.p[2],grid.p[3],grid.val[2],grid.val[3]);
          normlist[2] = normal(vertlist[2], fn);
      }
     if (edgeTable[cubeindex] & 8) {
          vertlist[3] = interp(isolevel,grid.p[3],grid.p[0],grid.val[3],grid.val[0]);
          normlist[3] = normal(vertlist[3], fn);
      }
     if (edgeTable[cubeindex] & 16) {
          vertlist[4] = interp(isolevel,grid.p[4],grid.p[5],grid.val[4],grid.val[5]);
          normlist[4] = normal(vertlist[4], fn);
      }
     if (edgeTable[cubeindex] & 32) {
          vertlist[5] = interp(isolevel,grid.p[5],grid.p[6],grid.val[5],grid.val[6]);
          normlist[5] = normal(vertlist[5], fn);
      }
     if (edgeTable[cubeindex] & 64) {
          vertlist[6] = interp(isolevel,grid.p[6],grid.p[7],grid.val[6],grid.val[7]);
          normlist[6] = normal(vertlist[6], fn);
      }
     if (edgeTable[cubeindex] & 128) {
          vertlist[7] = interp(isolevel,grid.p[7],grid.p[4],grid.val[7],grid.val[4]);
          normlist[7] = normal(vertlist[7], fn);
      }
     if (edgeTable[cubeindex] & 256) {
          vertlist[8] = interp(isolevel,grid.p[0],grid.p[4],grid.val[0],grid.val[4]);
          normlist[8] = normal(vertlist[8], fn);
      }
     if (edgeTable[cubeindex] & 512) {
          vertlist[9] = interp(isolevel,grid.p[1],grid.p[5],grid.val[1],grid.val[5]);
          normlist[9] = normal(vertlist[9], fn);
      }
     if (edgeTable[cubeindex] & 1024) {
          vertlist[10] = interp(isolevel,grid.p[2],grid.p[6],grid.val[2],grid.val[6]);
          normlist[10] = normal(vertlist[10], fn);
      }
     if (edgeTable[cubeindex] & 2048) {
          vertlist[11] = interp(isolevel,grid.p[3],grid.p[7],grid.val[3],grid.val[7]);
          normlist[11] = normal(vertlist[11], fn);
      }
      /* Create the triangle */
      for (i = 0; indexedTable[i] != -1; i += 3) {
          var v1 = vertlist[indexedTable[i  ]],
              v2 = vertlist[indexedTable[i+1]],
              v3 = vertlist[indexedTable[i+2]],
              n1 = normlist[indexedTable[i  ]],
              n2 = normlist[indexedTable[i+1]],
              n3 = normlist[indexedTable[i+2]];
              
 
          vertices.push(v1[0] * 0.5, v1[1] * 0.5, v1[2] * 0.5,
                        v2[0] * 0.5, v2[1] * 0.5, v2[2] * 0.5,
                        v3[0] * 0.5, v3[1] * 0.5, v3[2] * 0.5);

          normals.push(n1[0], n1[1], n1[2],
                       n2[0], n2[1], n2[2],
                       n3[0], n3[1], n3[2]);
          
      }
      return {
        vertices: vertices,
        normals: normals
      };
    },

    compute: function(obj, fn, isolevel) {
      normalCache = {};

      var x = obj.x,
          xfrom = x.from,
          xto = x.to,
          xstep = x.step,
          y = obj.y,
          yfrom = y.from,
          yto = y.to,
          ystep = y.step,
          z = obj.z,
          zfrom = z.from,
          zto = z.to,
          zstep = z.step,
          xstep2 = xstep/2,
          ystep2 = ystep/2,
          zstep2 = zstep/2,
          vertices = [],
          normals = [],
          val, grid, isolevel,
          polygonise = this.polygonise,
          p1 = new Float32Array(3),
          p2 = new Float32Array(3),
          p3 = new Float32Array(3),
          p4 = new Float32Array(3),
          p5 = new Float32Array(3),
          p6 = new Float32Array(3),
          p7 = new Float32Array(3),
          p8 = new Float32Array(3);


     for (var xcur = xfrom; xcur <= xto; xcur += xstep) {
        for (var ycur = yfrom; ycur <= yto; ycur += ystep) {
          for (var zcur = zfrom; zcur <= zto; zcur += zstep) {
            val = [];
            
            p1[0] = xcur - xstep2;
            p1[1] = ycur - ystep2;
            p1[2] = zcur - zstep2;
            p2[0] = xcur + xstep2;
            p2[1] = ycur - ystep2;
            p2[2] = zcur - zstep2;
            p3[0] = xcur + xstep2;
            p3[1] = ycur + ystep2;
            p3[2] = zcur - zstep2;
            p4[0] = xcur - xstep2;
            p4[1] = ycur + ystep2;
            p4[2] = zcur - zstep2;
            p5[0] = xcur - xstep2;
            p5[1] = ycur - ystep2;
            p5[2] = zcur + zstep2;
            p6[0] = xcur + xstep2;
            p6[1] = ycur - ystep2;
            p6[2] = zcur + zstep2;
            p7[0] = xcur + xstep2;
            p7[1] = ycur + ystep2;
            p7[2] = zcur + zstep2;
            p8[0] = xcur - xstep2;
            p8[1] = ycur + ystep2;
            p8[2] = zcur + zstep2;

            val.push(fn(p1[0], p1[1], p1[2]),
                     fn(p2[0], p2[1], p2[2]),
                     fn(p3[0], p3[1], p3[2]),
                     fn(p4[0], p4[1], p4[2]),
                     fn(p5[0], p5[1], p5[2]),
                     fn(p6[0], p6[1], p6[2]),
                     fn(p7[0], p7[1], p7[2]),
                     fn(p8[0], p8[1], p8[2]));
           
            grid = {
              p: [p1, p2, p3, p4, p5, p6, p7, p8],
              val: val
            };
            var ans = polygonise(grid, isolevel, fn);
            if (ans) {
              vertices.push.apply(vertices, ans.vertices || []);
              normals.push.apply(normals, ans.normals || []);
            }
         }
        }
      }
      return {
        vertices: vertices,
        normals: normals
      };
    }
  };

})();

onmessage = function(e) {

  var data = e.data,
      grid = data.grid,
      balls = data.balls,
      l = balls.length,
      isolevel = data.isolevel,
      fn = function(x, y, z) {
        for (var i = 0, acum = 0; i < l; i++) {
          var p = balls[i].pos,
              px = p[0],
              py = p[1],
              pz = p[2],
              num = i == (l -1) ? 5 : 0.1;

          acum += num / (((x - px) * (x - px) + (y - py) * (y - py) + (z - pz) * (z - pz)) || 1);
        }
        return acum;
      };
  var val = MarchingCubes.compute(grid, fn, isolevel);
  postMessage(val);
};
