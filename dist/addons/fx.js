'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); //  Timer based animation
// TODO clean up linting
/* eslint-disable */
/* global setTimeout */


var _utils = require('../utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Queue = [];

var Fx = function () {
  function Fx() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Fx);

    this.opt = (0, _utils.merge)({
      delay: 0,
      duration: 1000,
      transition: function transition(x) {
        return x;
      },
      onCompute: _utils.noop,
      onComplete: _utils.noop
    }, options);
  }

  _createClass(Fx, [{
    key: 'start',
    value: function start(options) {
      this.opt = (0, _utils.merge)(this.opt, options || {});
      this.time = Date.now();
      this.animating = true;
      Queue.push(this);
    }

    // perform a step in the animation

  }, {
    key: 'step',
    value: function step() {
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
  }], [{
    key: 'compute',
    value: function compute(from, to, delta) {
      return from + (to - from) * delta;
    }
  }]);

  return Fx;
}();

exports.default = Fx;


Fx.Queue = Queue;

// Easing equations
Fx.Transition = {
  linear: function linear(p) {
    return p;
  }
};

var Trans = Fx.Transition;

Fx.prototype.time = null;

function makeTrans(transition, params) {
  params = (0, _utils.splat)(params);
  return Object.assign(transition, {
    easeIn: function easeIn(pos) {
      return transition(pos, params);
    },
    easeOut: function easeOut(pos) {
      return 1 - transition(1 - pos, params);
    },
    easeInOut: function easeInOut(pos) {
      return pos <= 0.5 ? transition(2 * pos, params) / 2 : (2 - transition(2 * (1 - pos), params)) / 2;
    }
  });
}

var transitions = {
  Pow: function Pow(p, x) {
    return Math.pow(p, x[0] || 6);
  },
  Expo: function Expo(p) {
    return Math.pow(2, 8 * (p - 1));
  },
  Circ: function Circ(p) {
    return 1 - Math.sin(Math.acos(p));
  },
  Sine: function Sine(p) {
    return 1 - Math.sin((1 - p) * Math.PI / 2);
  },
  Back: function Back(p, x) {
    x = x[0] || 1.618;
    return Math.pow(p, 2) * ((x + 1) * p - x);
  },
  Bounce: function Bounce(p) {
    var value;
    for (var a = 0, b = 1; 1; a += b, b /= 2) {
      if (p >= (7 - 4 * a) / 11) {
        value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
        break;
      }
    }
    return value;
  },
  Elastic: function Elastic(p, x) {
    return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
  }
};

for (var t in transitions) {
  Trans[t] = makeTrans(transitions[t]);
}

['Quad', 'Cubic', 'Quart', 'Quint'].forEach(function (elem, i) {
  Trans[elem] = makeTrans(function (p) {
    return Math.pow(p, [i + 2]);
  });
});

// animationTime - function branching

//  rye: TODO- refactor global definition when we define the two
//             (browserify/<script>) build paths.
var global;
try {
  global = window;
} catch (e) {
  global = null;
}

var checkFxQueue = function checkFxQueue() {
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
  ['webkitAnimationTime', 'mozAnimationTime', 'animationTime', 'webkitAnimationStartTime', 'mozAnimationStartTime', 'animationStartTime'].forEach(function (impl) {
    if (impl in global) {
      Fx.animationTime = function () {
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
  ['webkitRequestAnimationFrame', 'mozRequestAnimationFrame', 'requestAnimationFrame'].forEach(function (impl) {
    if (impl in global) {
      Fx.requestAnimationFrame = function (callback) {
        global[impl](function () {
          checkFxQueue();
          callback();
        });
      };
      found = true;
    }
  });
  if (!found) {
    Fx.requestAnimationFrame = function (callback) {
      setTimeout(function () {
        checkFxQueue();
        callback();
      }, 1000 / 60);
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvZnguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBSUE7Ozs7QUFFQSxJQUFJLFFBQVEsRUFBUjs7SUFFaUI7QUFDbkIsV0FEbUIsRUFDbkIsR0FBMEI7UUFBZCxnRUFBVSxrQkFBSTs7MEJBRFAsSUFDTzs7QUFDeEIsU0FBSyxHQUFMLEdBQVcsa0JBQU07QUFDZixhQUFPLENBQVA7QUFDQSxnQkFBVSxJQUFWO0FBQ0Esa0JBQVk7ZUFBSztPQUFMO0FBQ1osNEJBSmU7QUFLZiw2QkFMZTtLQUFOLEVBTVIsT0FOUSxDQUFYLENBRHdCO0dBQTFCOztlQURtQjs7MEJBV2IsU0FBUztBQUNiLFdBQUssR0FBTCxHQUFXLGtCQUFNLEtBQUssR0FBTCxFQUFVLFdBQVcsRUFBWCxDQUEzQixDQURhO0FBRWIsV0FBSyxJQUFMLEdBQVksS0FBSyxHQUFMLEVBQVosQ0FGYTtBQUdiLFdBQUssU0FBTCxHQUFpQixJQUFqQixDQUhhO0FBSWIsWUFBTSxJQUFOLENBQVcsSUFBWCxFQUphOzs7Ozs7OzJCQVFSOztBQUVMLFVBQUksQ0FBQyxLQUFLLFNBQUwsRUFBZ0I7QUFDbkIsZUFEbUI7T0FBckI7QUFHQSxVQUFJLGNBQWMsS0FBSyxHQUFMLEVBQWQ7VUFDRixPQUFPLEtBQUssSUFBTDtVQUNQLE1BQU0sS0FBSyxHQUFMO1VBQ04sUUFBUSxJQUFJLEtBQUo7VUFDUixXQUFXLElBQUksUUFBSjtVQUNYLFFBQVEsQ0FBUjs7QUFWRyxVQVlELGNBQWMsT0FBTyxLQUFQLEVBQWM7QUFDOUIsWUFBSSxTQUFKLENBQWMsSUFBZCxDQUFtQixJQUFuQixFQUF5QixLQUF6QixFQUQ4QjtBQUU5QixlQUY4QjtPQUFoQzs7QUFaSyxVQWlCRCxjQUFjLE9BQU8sS0FBUCxHQUFlLFFBQWYsRUFBeUI7QUFDekMsZ0JBQVEsSUFBSSxVQUFKLENBQWUsQ0FBQyxjQUFjLElBQWQsR0FBcUIsS0FBckIsQ0FBRCxHQUErQixRQUEvQixDQUF2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ZnguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyAgVGltZXIgYmFzZWQgYW5pbWF0aW9uXG4vLyBUT0RPIGNsZWFuIHVwIGxpbnRpbmdcbi8qIGVzbGludC1kaXNhYmxlICovXG4vKiBnbG9iYWwgc2V0VGltZW91dCAqL1xuaW1wb3J0IHttZXJnZSwgbm9vcCwgc3BsYXR9IGZyb20gJy4uL3V0aWxzJztcblxudmFyIFF1ZXVlID0gW107XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZ4IHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh7XG4gICAgICBkZWxheTogMCxcbiAgICAgIGR1cmF0aW9uOiAxMDAwLFxuICAgICAgdHJhbnNpdGlvbjogeCA9PiB4LFxuICAgICAgb25Db21wdXRlOiBub29wLFxuICAgICAgb25Db21wbGV0ZTogbm9vcFxuICAgIH0sIG9wdGlvbnMpO1xuICB9XG5cbiAgc3RhcnQob3B0aW9ucykge1xuICAgIHRoaXMub3B0ID0gbWVyZ2UodGhpcy5vcHQsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMudGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5hbmltYXRpbmcgPSB0cnVlO1xuICAgIFF1ZXVlLnB1c2godGhpcyk7XG4gIH1cblxuICAvLyBwZXJmb3JtIGEgc3RlcCBpbiB0aGUgYW5pbWF0aW9uXG4gIHN0ZXAoKSB7XG4gICAgLy8gaWYgbm90IGFuaW1hdGluZywgdGhlbiByZXR1cm5cbiAgICBpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VGltZSA9IERhdGUubm93KCksXG4gICAgICB0aW1lID0gdGhpcy50aW1lLFxuICAgICAgb3B0ID0gdGhpcy5vcHQsXG4gICAgICBkZWxheSA9IG9wdC5kZWxheSxcbiAgICAgIGR1cmF0aW9uID0gb3B0LmR1cmF0aW9uLFxuICAgICAgZGVsdGEgPSAwO1xuICAgIC8vIGhvbGQgYW5pbWF0aW9uIGZvciB0aGUgZGVsYXlcbiAgICBpZiAoY3VycmVudFRpbWUgPCB0aW1lICsgZGVsYXkpIHtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGlmIGluIG91ciB0aW1lIHdpbmRvdywgdGhlbiBleGVjdXRlIGFuaW1hdGlvblxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSArIGR1cmF0aW9uKSB7XG4gICAgICBkZWx0YSA9IG9wdC50cmFuc2l0aW9uKChjdXJyZW50VGltZSAtIHRpbWUgLSBkZWxheSkgLyBkdXJhdGlvbik7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIDEpO1xuICAgICAgb3B0Lm9uQ29tcGxldGUuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY29tcHV0ZShmcm9tLCB0bywgZGVsdGEpIHtcbiAgICByZXR1cm4gZnJvbSArICh0byAtIGZyb20pICogZGVsdGE7XG4gIH1cbn1cblxuRnguUXVldWUgPSBRdWV1ZTtcblxuLy8gRWFzaW5nIGVxdWF0aW9uc1xuRnguVHJhbnNpdGlvbiA9IHtcbiAgbGluZWFyKHApIHtcbiAgICByZXR1cm4gcDtcbiAgfVxufTtcblxudmFyIFRyYW5zID0gRnguVHJhbnNpdGlvbjtcblxuRngucHJvdG90eXBlLnRpbWUgPSBudWxsO1xuXG5mdW5jdGlvbiBtYWtlVHJhbnModHJhbnNpdGlvbiwgcGFyYW1zKSB7XG4gIHBhcmFtcyA9IHNwbGF0KHBhcmFtcyk7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKHRyYW5zaXRpb24sIHtcbiAgICBlYXNlSW4ocG9zKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbihwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlT3V0KHBvcykge1xuICAgICAgcmV0dXJuIDEgLSB0cmFuc2l0aW9uKDEgLSBwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlSW5PdXQocG9zKSB7XG4gICAgICByZXR1cm4gKHBvcyA8PSAwLjUpID8gdHJhbnNpdGlvbigyICogcG9zLCBwYXJhbXMpIC8gMiA6XG4gICAgICAgICgyIC0gdHJhbnNpdGlvbigyICogKDEgLSBwb3MpLCBwYXJhbXMpKSAvIDI7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIHRyYW5zaXRpb25zID0ge1xuXG4gIFBvdyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIHhbMF0gfHwgNik7XG4gIH0sXG5cbiAgRXhwbyhwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDggKiAocCAtIDEpKTtcbiAgfSxcblxuICBDaXJjKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKE1hdGguYWNvcyhwKSk7XG4gIH0sXG5cbiAgU2luZShwKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnNpbigoMSAtIHApICogTWF0aC5QSSAvIDIpO1xuICB9LFxuXG4gIEJhY2socCwgeCkge1xuICAgIHggPSB4WzBdIHx8IDEuNjE4O1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCAyKSAqICgoeCArIDEpICogcCAtIHgpO1xuICB9LFxuXG4gIEJvdW5jZShwKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGZvciAobGV0IGEgPSAwLCBiID0gMTsgMTsgYSArPSBiLCBiIC89IDIpIHtcbiAgICAgIGlmIChwID49ICg3IC0gNCAqIGEpIC8gMTEpIHtcbiAgICAgICAgdmFsdWUgPSBiICogYiAtIE1hdGgucG93KCgxMSAtIDYgKiBhIC0gMTEgKiBwKSAvIDQsIDIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuXG4gIEVsYXN0aWMocCwgeCkge1xuICAgIHJldHVybiBNYXRoLnBvdygyLCAxMCAqIC0tcCkgKiBNYXRoLmNvcygyMCAqIHAgKiBNYXRoLlBJICogKHhbMF0gfHwgMSkgLyAzKTtcbiAgfVxuXG59O1xuXG5mb3IgKGNvbnN0IHQgaW4gdHJhbnNpdGlvbnMpIHtcbiAgVHJhbnNbdF0gPSBtYWtlVHJhbnModHJhbnNpdGlvbnNbdF0pO1xufVxuXG5bJ1F1YWQnLCAnQ3ViaWMnLCAnUXVhcnQnLCAnUXVpbnQnXS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0sIGkpIHtcbiAgVHJhbnNbZWxlbV0gPSBtYWtlVHJhbnMoZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCBbXG4gICAgICBpICsgMlxuICAgIF0pO1xuICB9KTtcbn0pO1xuXG4vLyBhbmltYXRpb25UaW1lIC0gZnVuY3Rpb24gYnJhbmNoaW5nXG5cbi8vICByeWU6IFRPRE8tIHJlZmFjdG9yIGdsb2JhbCBkZWZpbml0aW9uIHdoZW4gd2UgZGVmaW5lIHRoZSB0d29cbi8vICAgICAgICAgICAgIChicm93c2VyaWZ5LzxzY3JpcHQ+KSBidWlsZCBwYXRocy5cbnZhciBnbG9iYWw7XG50cnkge1xuICBnbG9iYWwgPSB3aW5kb3c7XG59IGNhdGNoIChlKSB7XG4gIGdsb2JhbCA9IG51bGw7XG59XG5cbnZhciBjaGVja0Z4UXVldWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9sZFF1ZXVlID0gUXVldWU7XG4gIFF1ZXVlID0gW107XG4gIGlmIChvbGRRdWV1ZS5sZW5ndGgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9sZFF1ZXVlLmxlbmd0aCwgZng7IGkgPCBsOyBpKyspIHtcbiAgICAgIGZ4ID0gb2xkUXVldWVbaV07XG4gICAgICBmeC5zdGVwKCk7XG4gICAgICBpZiAoZnguYW5pbWF0aW5nKSB7XG4gICAgICAgIFF1ZXVlLnB1c2goZngpO1xuICAgICAgfVxuICAgIH1cbiAgICBGeC5RdWV1ZSA9IFF1ZXVlO1xuICB9XG59O1xuXG5pZiAoZ2xvYmFsKSB7XG4gIHZhciBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdEFuaW1hdGlvblRpbWUnLCAnbW96QW5pbWF0aW9uVGltZScsICdhbmltYXRpb25UaW1lJyxcbiAgICd3ZWJraXRBbmltYXRpb25TdGFydFRpbWUnLCAnbW96QW5pbWF0aW9uU3RhcnRUaW1lJywgJ2FuaW1hdGlvblN0YXJ0VGltZSddXG4gICAgLmZvckVhY2goaW1wbCA9PiB7XG4gICAgICBpZiAoaW1wbCBpbiBnbG9iYWwpIHtcbiAgICAgICAgRnguYW5pbWF0aW9uVGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBnbG9iYWxbaW1wbF07XG4gICAgICAgIH07XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgaWYgKCFmb3VuZCkge1xuICAgIEZ4LmFuaW1hdGlvblRpbWUgPSBEYXRlLm5vdztcbiAgfVxuICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcbiAgZm91bmQgPSBmYWxzZTtcbiAgWyd3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLCAnbW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lJyxcbiAgICdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGltcGwpIHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgIGdsb2JhbFtpbXBsXShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRngucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSwgMTAwMCAvIDYwKTtcbiAgICB9O1xuICB9XG59XG4iXX0=