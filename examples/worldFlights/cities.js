importScripts('../../build/PhiloGL.js');

PhiloGL.unpack(self);

onmessage = function(e) {
  var cities = e.data,
      citiesLayer = createCitiesLayer(cities);

  postMessage(citiesLayer);
};

function createCitiesLayer(cities) {
  var pi = Math.PI,
      pi2 = pi * 2,
      sin = Math.sin,
      cos = Math.cos,
      index = 0,
      cityIndex = [],
      vertices = [],
      normals = [],
      pickingColors = [],
      indices = [],
      vertexCount = 0,
      step = Object.keys(cities).length / 5 >> 0,
      slice = Array.prototype.slice,
      position = {};

  for (var prop in cities) {
    var city = cities[prop],
        theta = pi2 - (+city[3] + 180) / 360 * pi2,
        phi = pi - (+city[2] + 90) / 180 * pi,
        sinTheta = sin(theta),
        cosTheta = cos(theta),
        sinPhi = sin(phi),
        cosPhi = cos(phi),
        ux = cosTheta * sinPhi,
        uy = cosPhi,
        uz = sinTheta * sinPhi,
        coords = [ux, uy, uz],
        r = 0,
        g = ((index / 256) >> 0) % 256,
        b = index % 256,
        sphere = new O3D.Sphere({
          nlat: 5,
          nlong: 5,
          radius: 1 / 120,
          pickingColors: [0, g / 255, b / 255, 1]
        }),
        tvertices = slice.call(sphere.vertices).map(function(v, i) { return coords[i % 3] + v; });

    position[prop] = coords;
    vertices.push.apply(vertices, tvertices);
    normals.push.apply(normals, slice.call(sphere.normals));
    pickingColors.push.apply(pickingColors, slice.call(sphere.pickingColors));
    indices.push.apply(indices, slice.call(sphere.indices).map(function(index) { return index + vertexCount; }));
    cityIndex[index++] = prop;

    vertexCount += tvertices.length / 3;

    if ((index % step) === 0) {
      postMessage(Math.round(index / step * 20));
    }
  }

  return {
    pickable: true,
    vertices: vertices,
    normals: normals,
    indices: indices,
    pickingColors: pickingColors,
    citiesIndex: cityIndex,
    program: 'layer',
    uniforms: {
      colorUfm: [1, 1, 0.5, 1]
    }
  };
}
