// rye: TODO- Defining window so that the window detection in the root PhiloGL
//          index.js doesn't blow up. This ickiness will go away when we 
//          implement the two build paths.
window = this;

importScripts('../../build/PhiloGL.js');

var dim = 8,
    cube = dim * dim * dim,
    nlat = dim,
    nlong = dim,
    colors = [],
    sphereVertices = [],
    sphereNormals = [],
    sphereIndices = [],
    lastIndex = 0,
    slice = Array.prototype.slice,

    rgbPositions = [],
    hsvPositions = [],
    hslPositions = [],
    hcvPositions = [],
    hclPositions = [];

function createSpheres() {
  var cube = dim * dim * dim,
      sphere = new PhiloGL.O3D.Sphere({
        nlat: nlat,
        nlong: nlong,
        radius: 0.1
      }),
      vertices = slice.call(sphere.vertices),
      normals = slice.call(sphere.normals),
      sindices = slice.call(sphere.indices),
      indices;

       
  while(cube--) {
    sphereVertices.push.apply(sphereVertices, vertices.slice());
    sphereNormals.push.apply(sphereNormals, normals.slice());
    indices = sindices.map((function(offset) {
      return function(n) { return n + offset; };
    })(lastIndex));
    sphereIndices.push.apply(sphereIndices, indices);
    lastIndex = lastIndex + vertices.length / 3;
  }

}

function createRGB() {
  var step = 2 / dim;
  for (var i = -1; i < 1; i += step) {
    for(var j = -1; j < 1; j += step) {
      for(var k = -1; k < 1; k += step) {
        for (var u = 0; u < (dim +1) * (dim +1); u++) {
          rgbPositions.push(i, j, k);
          colors.push((k + 1) / 2, (j + 1) / 2, (i + 1) / 2);
        }
      }
    }
  }
}

function createHueMaps() {
  var sin = Math.sin,
      cos = Math.cos,
      atan2 = Math.atan2,
      min = Math.min,
      max = Math.max,
      sqrt = Math.sqrt;

  for (var i = 0, lc = colors.length; i < lc; i+=3) {
    var r = colors[i   ],
        g = colors[i +1],
        b = colors[i +2],
        
        alpha = 0.5 * (2 * r - g - b),
        beta = 0.866025 * (g - b),
        
        h = atan2(beta, alpha),
        c = sqrt(alpha * alpha + beta * beta),
        v = max(r, g, b),
        l = 0.5 * (v + min(r, g, b)),

        x = cos(h) * c * 1.5,
        yv = -1.5 + 3 * v,
        yl = -1.5 + 3 * l,
        z = sin(h) * c * 1.5;

    hsvPositions.push(x, yv, z);
    hslPositions.push(x, yl, z);
  }
}

onmessage = function(e) {
  createSpheres();
  createRGB();
  createHueMaps();
  
  postMessage({
    sphereVertices: sphereVertices,
    sphereNormals: sphereNormals,
    colors: colors,
    rgb: rgbPositions,
    hsv: hsvPositions,
    hsl: hslPositions,
    indices: sphereIndices
  });
};
