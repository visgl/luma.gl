// Ported from https://github.com/BartVanBeurden/node-noise3d
// Used under WTFPL
/* eslint-disable */

export function nearestNeighbour(a, b, t) {
  return t < 0.5 ? a : b;
}

export function lerp(a, b, t) {
  return a + t * (b - a);
}

export function cosine(a, b, t) {
  t = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a + t * (b - a);
}

export function range(a, b) {
  var result = [];
  for (var i = a; i <= b; i++) {
    result.push(i);
  }
  return result;
}

export function shuffle(array, random) {
  // Fisher-Yates
  var currentIndex = array.length;
  var swapValue = 0;
  var randomIndex;

  while (currentIndex) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;

    swapValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = swapValue;
  }

  return array;
}

var fade = function (x) {
  return x * x * x * (x * (x * 6 - 15) + 10);
};

var grad = function (hash, x, y, z) {
  var h = hash & 15;
  var u = h < 8 ? x : y;
  var v = h < 4 ? y : h == 12 || h == 14 ? x : z;
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
};

export function perlin(params) {
  if (typeof params != 'object') throw new TypeError('params is not an object');
  if (typeof params.interpolation != 'function')
    throw new TypeError('params.interpolation is not a function');
  if (!Array.isArray(params.permutation)) throw new TypeError('params.permutation is not an array');
  if (params.permutation.length != 256) throw new Error('params.permutation must have 256 items');

  var irp = params.interpolation;
  var p = params.permutation.slice(0);

  for (var i = 0; i < 256; i++) p[256 + i] = p[i];

  return function (x, y, z) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    var fz = Math.floor(z);

    var X = fx & 255;
    var Y = fy & 255;
    var Z = fz & 255;

    x -= fx;
    y -= fy;
    z -= fz;

    var u = fade(x);
    var v = fade(y);
    var w = fade(z);

    var A = p[X] + Y;
    var AA = p[A] + Z;
    var AB = p[A + 1] + Z;
    var B = p[X + 1] + Y;
    var BA = p[B] + Z;
    var BB = p[B + 1] + Z;

    return irp(
      irp(
        irp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
        irp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
        v
      ),
      irp(
        irp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
        irp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  };
}
