// Timer based animation
// TODO clean up linting
/* eslint-disable */
/* global setTimeout */
import {merge, noop, splat} from '../utils';

var Queue = [];

export default class Fx {
  constructor(options = {}) {
    this.opt = merge({
      delay: 0,
      duration: 1000,
      transition: x => x,
      onCompute: noop,
      onComplete: noop
    }, options);
  }

  start(options) {
    this.opt = merge(this.opt, options || {});
    this.time = Date.now();
    this.animating = true;
    Queue.push(this);
  }

  // perform a step in the animation
  step() {
    // if not animating, then return
    if (!this.animating) {
      return;
    }
    var currentTime = Date.now(),
      time = this.time,
      opt = this.opt,
      delay = opt.delay,
      duration = opt.duration,
      delta = 0;
    // hold animation for the delay
    if (currentTime < time + delay) {
      opt.onCompute.call(this, delta);
      return;
    }
    // if in our time window, then execute animation
    if (currentTime < time + delay + duration) {
      delta = opt.transition((currentTime - time - delay) / duration);
      opt.onCompute.call(this, delta);
    } else {
      this.animating = false;
      opt.onCompute.call(this, 1);
      opt.onComplete.call(this);
    }
  }

  static compute(from, to, delta) {
    return from + (to - from) * delta;
  }
}

Fx.Queue = Queue;

// Easing equations
Fx.Transition = {
  linear(p) {
    return p;
  }
};

var Trans = Fx.Transition;

Fx.prototype.time = null;

function makeTrans(transition, params) {
  params = splat(params);
  return Object.assign(transition, {
    easeIn(pos) {
      return transition(pos, params);
    },
    easeOut(pos) {
      return 1 - transition(1 - pos, params);
    },
    easeInOut(pos) {
      return (pos <= 0.5) ? transition(2 * pos, params) / 2 :
        (2 - transition(2 * (1 - pos), params)) / 2;
    }
  });
}

var transitions = {

  Pow(p, x) {
    return Math.pow(p, x[0] || 6);
  },

  Expo(p) {
    return Math.pow(2, 8 * (p - 1));
  },

  Circ(p) {
    return 1 - Math.sin(Math.acos(p));
  },

  Sine(p) {
    return 1 - Math.sin((1 - p) * Math.PI / 2);
  },

  Back(p, x) {
    x = x[0] || 1.618;
    return Math.pow(p, 2) * ((x + 1) * p - x);
  },

  Bounce(p) {
    var value;
    for (let a = 0, b = 1; 1; a += b, b /= 2) {
      if (p >= (7 - 4 * a) / 11) {
        value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
        break;
      }
    }
    return value;
  },

  Elastic(p, x) {
    return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
  }

};

for (const t in transitions) {
  Trans[t] = makeTrans(transitions[t]);
}

['Quad', 'Cubic', 'Quart', 'Quint'].forEach(function(elem, i) {
  Trans[elem] = makeTrans(function(p) {
    return Math.pow(p, [
      i + 2
    ]);
  });
});

// animationTime - function branching

// rye: TODO- refactor global definition when we define the two
//           (browserify/<script>) build paths.
var global;
try {
  global = window;
} catch (e) {
  global = null;
}

var checkFxQueue = function() {
  var oldQueue = Queue;
  Queue = [];
  if (oldQueue.length) {
    for (var i = 0, l = oldQueue.length, fx; i < l; i++) {
      fx = oldQueue[i];
      fx.step();
      if (fx.animating) {
        Queue.push(fx);
      }
    }
    Fx.Queue = Queue;
  }
};

if (global) {
  var found = false;
  ['webkitAnimationTime', 'mozAnimationTime', 'animationTime',
   'webkitAnimationStartTime', 'mozAnimationStartTime', 'animationStartTime']
    .forEach(impl => {
      if (impl in global) {
        Fx.animationTime = function() {
          return global[impl];
        };
        found = true;
      }
    });
  if (!found) {
    Fx.animationTime = Date.now;
  }
  // requestAnimationFrame - function branching
  found = false;
  ['webkitRequestAnimationFrame', 'mozRequestAnimationFrame',
   'requestAnimationFrame']
    .forEach(function(impl) {
      if (impl in global) {
        Fx.requestAnimationFrame = function(callback) {
          global[impl](function() {
            checkFxQueue();
            callback();
          });
        };
        found = true;
      }
    });
  if (!found) {
    Fx.requestAnimationFrame = function(callback) {
      setTimeout(function() {
        checkFxQueue();
        callback();
      }, 1000 / 60);
    };
  }
}
