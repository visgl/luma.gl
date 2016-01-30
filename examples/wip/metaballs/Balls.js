Balls.offset = 1.5;
Balls.speed = 80;


function Balls(n, grid) {
  var ballsArray = this.ballsArray = [];
  this.grid = grid;
  var rand = Math.random,
      x = grid.x,
      xfrom = x.from,
      xto = x.to,
      y = grid.y,
      yfrom = y.from,
      yto = y.to,
      z = grid.z,
      zfrom = z.from,
      zto = z.to,
      offset = Balls.offset;
  

  for (var i = 0; i < n; i++) {
    ballsArray.push({
      pos: [
        (xfrom + rand() * (xto - xfrom)) / offset,
        (yfrom + rand() * (yto - yfrom)) / offset,
        (zfrom + rand() * (zto - zfrom)) / offset
      ],
      vec: [
        (2 * rand() -1) * (xto - xfrom) / Balls.speed,
        (2 * rand() -1) * (yto - yfrom) / Balls.speed,
        (2 * rand() -1) * (zto - zfrom) / Balls.speed
      ]
    });
  }
  ballsArray.push({
    pos: [0, 0, 0],
    vec: [0, 0, 0]
  });
}

Balls.prototype= {
  update: function() {
    var balls = this.ballsArray,
        grid = this.grid,
        coord = ['x', 'y', 'z'],
        offset = Balls.offset;

    for (var i = 0, l = balls.length; i < l; i++) {
      var ball = balls[i],
          pos = ball.pos,
          vec = ball.vec;
      for (var prop = 0; prop < 3; prop++) {
        var p = pos[prop],
            v = vec[prop],
            g = grid[coord[prop]];
        if (p + v < g.from / Balls.offset || p + v > g.to / Balls.offset) {
          vec[prop] *= -1;
          v *= -1;
        }
        pos[prop] = p + v;
      }
    }
  },
  
  each: function(callback) {
    var balls = this.ballsArray;
    for (var i = 0, l = balls.length; i < l; i++) {
      callback(balls[i], i);
    }
  }
};
