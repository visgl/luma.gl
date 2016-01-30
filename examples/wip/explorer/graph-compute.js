//Unpack Math Functions
var that = this;
['sin', 'cos', 'tan', 'atan', 'max', 'min', 
 'acos', 'asin', 'exp', 'log', 'pow', 'sqrt', 'floor', 'ceil', 
 'PI', 'E', 'abs'].forEach(function (f) { that[f] = Math[f]; });

function sampler(grid, fn) {
  var x = grid.x,
      xFrom = x.from,
      xTo = x.to,
      xStep = x.step,
      y = grid.y,
      yFrom = y.from,
      yTo = y.to,
      yStep = y.step,
      vertices = [],
      normals = [],
      z, v1, v2, n, d;

  for (x = xFrom; x < xTo; x += xStep) {
    for (y = yFrom; y < yTo; y += yStep) {
      //get value from fn
      z = fn(x, y);
      //add vertex
      vertices.push(x, y, z);
      //calculate normal
      v1 = [xStep, 0, fn(x + xStep, y) - z];
      v2 = [0, yStep, fn(x, y + yStep) - z];
      n = [v1[1] * v2[2] - v1[2] * v2[1],
           v1[2] * v2[0] - v1[0] * v2[2],
           v1[0] * v2[1] - v1[1] * v2[0]];
      d = sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
      if (d > 1e-6) {
        normals.push(n[0] / d, n[1] / d, n[2] / d);
      } else {
        normals.push(n[0], n[1], n[2]);
      }
    }
  }

  return {
    vertices: vertices,
    normals: normals
  };
}

onmessage = function(e) {
  var data = e.data,
      grid = data.grid,
      t = data.t,
      body = data.f,
      fn,
      memofn = (function() {
        var memo = {};
        return function(x, y) {
          var key = x + '|' + y;
          if (key in memo) return memo[key];
          return (memo[key] = fn(x, y));
        };
      })();

  try {
    fn = new Function('x, y', 'var t = ' + t + '; \n return (' + body + ');');
    //evaluate
    fn(0, 0);
  } catch(e) {
    fn = function() { return 0; };
  }

  postMessage(sampler(grid, fn));
};
