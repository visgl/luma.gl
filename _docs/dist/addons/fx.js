'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Timer based animation
// TODO clean up linting
/* eslint-disable */
/* global setTimeout */


var _utils = require('../utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Queue = [];

var Fx = function () {
  function Fx() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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

// rye: TODO- refactor global definition when we define the two
//           (browserify/<script>) build paths.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvZnguanMiXSwibmFtZXMiOlsiUXVldWUiLCJGeCIsIm9wdGlvbnMiLCJvcHQiLCJkZWxheSIsImR1cmF0aW9uIiwidHJhbnNpdGlvbiIsIngiLCJvbkNvbXB1dGUiLCJvbkNvbXBsZXRlIiwidGltZSIsIkRhdGUiLCJub3ciLCJhbmltYXRpbmciLCJwdXNoIiwiY3VycmVudFRpbWUiLCJkZWx0YSIsImNhbGwiLCJmcm9tIiwidG8iLCJUcmFuc2l0aW9uIiwibGluZWFyIiwicCIsIlRyYW5zIiwicHJvdG90eXBlIiwibWFrZVRyYW5zIiwicGFyYW1zIiwiT2JqZWN0IiwiYXNzaWduIiwiZWFzZUluIiwicG9zIiwiZWFzZU91dCIsImVhc2VJbk91dCIsInRyYW5zaXRpb25zIiwiUG93IiwiTWF0aCIsInBvdyIsIkV4cG8iLCJDaXJjIiwic2luIiwiYWNvcyIsIlNpbmUiLCJQSSIsIkJhY2siLCJCb3VuY2UiLCJ2YWx1ZSIsImEiLCJiIiwiRWxhc3RpYyIsImNvcyIsInQiLCJmb3JFYWNoIiwiZWxlbSIsImkiLCJnbG9iYWwiLCJ3aW5kb3ciLCJlIiwiY2hlY2tGeFF1ZXVlIiwib2xkUXVldWUiLCJsZW5ndGgiLCJsIiwiZngiLCJzdGVwIiwiZm91bmQiLCJpbXBsIiwiYW5pbWF0aW9uVGltZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImNhbGxiYWNrIiwic2V0VGltZW91dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7QUFDQTtBQUNBO0FBQ0E7OztBQUNBOzs7O0FBRUEsSUFBSUEsUUFBUSxFQUFaOztJQUVxQkMsRTtBQUNuQixnQkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3hCLFNBQUtDLEdBQUwsR0FBVyxrQkFBTTtBQUNmQyxhQUFPLENBRFE7QUFFZkMsZ0JBQVUsSUFGSztBQUdmQyxrQkFBWTtBQUFBLGVBQUtDLENBQUw7QUFBQSxPQUhHO0FBSWZDLDRCQUplO0FBS2ZDO0FBTGUs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OlsiLy8gVGltZXIgYmFzZWQgYW5pbWF0aW9uXG4vLyBUT0RPIGNsZWFuIHVwIGxpbnRpbmdcbi8qIGVzbGludC1kaXNhYmxlICovXG4vKiBnbG9iYWwgc2V0VGltZW91dCAqL1xuaW1wb3J0IHttZXJnZSwgbm9vcCwgc3BsYXR9IGZyb20gJy4uL3V0aWxzJztcblxudmFyIFF1ZXVlID0gW107XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZ4IHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh7XG4gICAgICBkZWxheTogMCxcbiAgICAgIGR1cmF0aW9uOiAxMDAwLFxuICAgICAgdHJhbnNpdGlvbjogeCA9PiB4LFxuICAgICAgb25Db21wdXRlOiBub29wLFxuICAgICAgb25Db21wbGV0ZTogbm9vcFxuICAgIH0sIG9wdGlvbnMpO1xuICB9XG5cbiAgc3RhcnQob3B0aW9ucykge1xuICAgIHRoaXMub3B0ID0gbWVyZ2UodGhpcy5vcHQsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMudGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5hbmltYXRpbmcgPSB0cnVlO1xuICAgIFF1ZXVlLnB1c2godGhpcyk7XG4gIH1cblxuICAvLyBwZXJmb3JtIGEgc3RlcCBpbiB0aGUgYW5pbWF0aW9uXG4gIHN0ZXAoKSB7XG4gICAgLy8gaWYgbm90IGFuaW1hdGluZywgdGhlbiByZXR1cm5cbiAgICBpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VGltZSA9IERhdGUubm93KCksXG4gICAgICB0aW1lID0gdGhpcy50aW1lLFxuICAgICAgb3B0ID0gdGhpcy5vcHQsXG4gICAgICBkZWxheSA9IG9wdC5kZWxheSxcbiAgICAgIGR1cmF0aW9uID0gb3B0LmR1cmF0aW9uLFxuICAgICAgZGVsdGEgPSAwO1xuICAgIC8vIGhvbGQgYW5pbWF0aW9uIGZvciB0aGUgZGVsYXlcbiAgICBpZiAoY3VycmVudFRpbWUgPCB0aW1lICsgZGVsYXkpIHtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGlmIGluIG91ciB0aW1lIHdpbmRvdywgdGhlbiBleGVjdXRlIGFuaW1hdGlvblxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSArIGR1cmF0aW9uKSB7XG4gICAgICBkZWx0YSA9IG9wdC50cmFuc2l0aW9uKChjdXJyZW50VGltZSAtIHRpbWUgLSBkZWxheSkgLyBkdXJhdGlvbik7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIDEpO1xuICAgICAgb3B0Lm9uQ29tcGxldGUuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY29tcHV0ZShmcm9tLCB0bywgZGVsdGEpIHtcbiAgICByZXR1cm4gZnJvbSArICh0byAtIGZyb20pICogZGVsdGE7XG4gIH1cbn1cblxuRnguUXVldWUgPSBRdWV1ZTtcblxuLy8gRWFzaW5nIGVxdWF0aW9uc1xuRnguVHJhbnNpdGlvbiA9IHtcbiAgbGluZWFyKHApIHtcbiAgICByZXR1cm4gcDtcbiAgfVxufTtcblxudmFyIFRyYW5zID0gRnguVHJhbnNpdGlvbjtcblxuRngucHJvdG90eXBlLnRpbWUgPSBudWxsO1xuXG5mdW5jdGlvbiBtYWtlVHJhbnModHJhbnNpdGlvbiwgcGFyYW1zKSB7XG4gIHBhcmFtcyA9IHNwbGF0KHBhcmFtcyk7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKHRyYW5zaXRpb24sIHtcbiAgICBlYXNlSW4ocG9zKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbihwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlT3V0KHBvcykge1xuICAgICAgcmV0dXJuIDEgLSB0cmFuc2l0aW9uKDEgLSBwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlSW5PdXQocG9zKSB7XG4gICAgICByZXR1cm4gKHBvcyA8PSAwLjUpID8gdHJhbnNpdGlvbigyICogcG9zLCBwYXJhbXMpIC8gMiA6XG4gICAgICAgICgyIC0gdHJhbnNpdGlvbigyICogKDEgLSBwb3MpLCBwYXJhbXMpKSAvIDI7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIHRyYW5zaXRpb25zID0ge1xuXG4gIFBvdyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIHhbMF0gfHwgNik7XG4gIH0sXG5cbiAgRXhwbyhwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDggKiAocCAtIDEpKTtcbiAgfSxcblxuICBDaXJjKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKE1hdGguYWNvcyhwKSk7XG4gIH0sXG5cbiAgU2luZShwKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnNpbigoMSAtIHApICogTWF0aC5QSSAvIDIpO1xuICB9LFxuXG4gIEJhY2socCwgeCkge1xuICAgIHggPSB4WzBdIHx8IDEuNjE4O1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCAyKSAqICgoeCArIDEpICogcCAtIHgpO1xuICB9LFxuXG4gIEJvdW5jZShwKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGZvciAobGV0IGEgPSAwLCBiID0gMTsgMTsgYSArPSBiLCBiIC89IDIpIHtcbiAgICAgIGlmIChwID49ICg3IC0gNCAqIGEpIC8gMTEpIHtcbiAgICAgICAgdmFsdWUgPSBiICogYiAtIE1hdGgucG93KCgxMSAtIDYgKiBhIC0gMTEgKiBwKSAvIDQsIDIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuXG4gIEVsYXN0aWMocCwgeCkge1xuICAgIHJldHVybiBNYXRoLnBvdygyLCAxMCAqIC0tcCkgKiBNYXRoLmNvcygyMCAqIHAgKiBNYXRoLlBJICogKHhbMF0gfHwgMSkgLyAzKTtcbiAgfVxuXG59O1xuXG5mb3IgKGNvbnN0IHQgaW4gdHJhbnNpdGlvbnMpIHtcbiAgVHJhbnNbdF0gPSBtYWtlVHJhbnModHJhbnNpdGlvbnNbdF0pO1xufVxuXG5bJ1F1YWQnLCAnQ3ViaWMnLCAnUXVhcnQnLCAnUXVpbnQnXS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0sIGkpIHtcbiAgVHJhbnNbZWxlbV0gPSBtYWtlVHJhbnMoZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCBbXG4gICAgICBpICsgMlxuICAgIF0pO1xuICB9KTtcbn0pO1xuXG4vLyBhbmltYXRpb25UaW1lIC0gZnVuY3Rpb24gYnJhbmNoaW5nXG5cbi8vIHJ5ZTogVE9ETy0gcmVmYWN0b3IgZ2xvYmFsIGRlZmluaXRpb24gd2hlbiB3ZSBkZWZpbmUgdGhlIHR3b1xuLy8gICAgICAgICAgIChicm93c2VyaWZ5LzxzY3JpcHQ+KSBidWlsZCBwYXRocy5cbnZhciBnbG9iYWw7XG50cnkge1xuICBnbG9iYWwgPSB3aW5kb3c7XG59IGNhdGNoIChlKSB7XG4gIGdsb2JhbCA9IG51bGw7XG59XG5cbnZhciBjaGVja0Z4UXVldWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9sZFF1ZXVlID0gUXVldWU7XG4gIFF1ZXVlID0gW107XG4gIGlmIChvbGRRdWV1ZS5sZW5ndGgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9sZFF1ZXVlLmxlbmd0aCwgZng7IGkgPCBsOyBpKyspIHtcbiAgICAgIGZ4ID0gb2xkUXVldWVbaV07XG4gICAgICBmeC5zdGVwKCk7XG4gICAgICBpZiAoZnguYW5pbWF0aW5nKSB7XG4gICAgICAgIFF1ZXVlLnB1c2goZngpO1xuICAgICAgfVxuICAgIH1cbiAgICBGeC5RdWV1ZSA9IFF1ZXVlO1xuICB9XG59O1xuXG5pZiAoZ2xvYmFsKSB7XG4gIHZhciBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdEFuaW1hdGlvblRpbWUnLCAnbW96QW5pbWF0aW9uVGltZScsICdhbmltYXRpb25UaW1lJyxcbiAgICd3ZWJraXRBbmltYXRpb25TdGFydFRpbWUnLCAnbW96QW5pbWF0aW9uU3RhcnRUaW1lJywgJ2FuaW1hdGlvblN0YXJ0VGltZSddXG4gICAgLmZvckVhY2goaW1wbCA9PiB7XG4gICAgICBpZiAoaW1wbCBpbiBnbG9iYWwpIHtcbiAgICAgICAgRnguYW5pbWF0aW9uVGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBnbG9iYWxbaW1wbF07XG4gICAgICAgIH07XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgaWYgKCFmb3VuZCkge1xuICAgIEZ4LmFuaW1hdGlvblRpbWUgPSBEYXRlLm5vdztcbiAgfVxuICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcbiAgZm91bmQgPSBmYWxzZTtcbiAgWyd3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLCAnbW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lJyxcbiAgICdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGltcGwpIHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgIGdsb2JhbFtpbXBsXShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRngucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSwgMTAwMCAvIDYwKTtcbiAgICB9O1xuICB9XG59XG4iXX0=