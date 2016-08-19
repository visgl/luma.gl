'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Timer based animation
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvZnguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBSUE7Ozs7QUFFQSxJQUFJLFFBQVEsRUFBWjs7SUFFcUIsRTtBQUNuQixnQkFBMEI7QUFBQSxRQUFkLE9BQWMseURBQUosRUFBSTs7QUFBQTs7QUFDeEIsU0FBSyxHQUFMLEdBQVcsa0JBQU07QUFDZixhQUFPLENBRFE7QUFFZixnQkFBVSxJQUZLO0FBR2Ysa0JBQVk7QUFBQSxlQUFLLENBQUw7QUFBQSxPQUhHO0FBSWYsNEJBSmU7QUFLZjtBQUxlLEtBQU4sRUFNUixPQU5RLENBQVg7QUFPRDs7OzswQkFFSyxPLEVBQVM7QUFDYixXQUFLLEdBQUwsR0FBVyxrQkFBTSxLQUFLLEdBQVgsRUFBZ0IsV0FBVyxFQUEzQixDQUFYO0FBQ0EsV0FBSyxJQUFMLEdBQVksS0FBSyxHQUFMLEVBQVo7QUFDQSxXQUFLLFNBQUwsR0FBaUIsSUFBakI7QUFDQSxZQUFNLElBQU4sQ0FBVyxJQUFYO0FBQ0Q7Ozs7OzsyQkFHTTs7QUFFTCxVQUFJLENBQUMsS0FBSyxTQUFWLEVBQXFCO0FBQ25CO0FBQ0Q7QUFDRCxVQUFJLGNBQWMsS0FBSyxHQUFMLEVBQWxCO0FBQUEsVUFDRSxPQUFPLEtBQUssSUFEZDtBQUFBLFVBRUUsTUFBTSxLQUFLLEdBRmI7QUFBQSxVQUdFLFFBQVEsSUFBSSxLQUhkO0FBQUEsVUFJRSxXQUFXLElBQUksUUFKakI7QUFBQSxVQUtFLFFBQVEsQ0FMVjs7QUFPQSxVQUFJLGNBQWMsT0FBTyxLQUF6QixFQUFnQztBQUM5QixZQUFJLFNBQUosQ0FBYyxJQUFkLENBQW1CLElBQW5CLEVBQXlCLEtBQXpCO0FBQ0E7QUFDRDs7QUFFRCxVQUFJLGNBQWMsT0FBTyxLQUFQLEdBQWUsUUFBakMsRUFBMkM7QUFDekMsZ0JBQVEsSUFBSSxVQUFKLENBQWUsQ0FBQyxjQUFjLElBQWQsR0FBcUIsS0FBdEIsSUFBK0IsUUFBOUMsQ0FBUjtBQUNBLFlBQUksU0FB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LFVBQUksR0FBRyxTQUFQLEVBQWtCO0FBQ2hCLGNBQU0sSUFBTixDQUFXLEVBQVg7QUFDRDtBQUNGO0FBQ0QsT0FBRyxLQUFILEdBQVcsS0FBWDtBQUNEO0FBQ0YsQ0FiRDs7QUFlQSxJQUFJLE1BQUosRUFBWTtBQUNWLE1BQUksUUFBUSxLQUFaO0FBQ0EsR0FBQyxxQkFBRCxFQUF3QixrQkFBeEIsRUFBNEMsZUFBNUMsRUFDQywwQkFERCxFQUM2Qix1QkFEN0IsRUFDc0Qsb0JBRHRELEVBRUcsT0FGSCxDQUVXLGdCQUFRO0FBQ2YsUUFBSSxRQUFRLE1BQVosRUFBb0I7QUFDbEIsU0FBRyxhQUFILEdBQW1CLFlBQVc7QUFDNUIsZUFBTyxPQUFPLElBQVAsQ0FBUDtBQUNELE9BRkQ7QUFHQSxjQUFRLElBQVI7QUFDRDtBQUNGLEdBVEg7QUFVQSxNQUFJLENBQUMsS0FBTCxFQUFZO0FBQ1YsT0FBRyxhQUFILEdBQW1CLEtBQUssR0FBeEI7QUFDRDs7QUFFRCxVQUFRLEtBQVI7QUFDQSxHQUFDLDZCQUFELEVBQWdDLDBCQUFoQyxFQUNDLHVCQURELEVBRUcsT0FGSCxDQUVXLFVBQVMsSUFBVCxFQUFlO0FBQ3RCLFFBQUksUUFBUSxNQUFaLEVBQW9CO0FBQ2xCLFNBQUcscUJBQUgsR0FBMkIsVUFBUyxRQUFULEVBQW1CO0FBQzVDLGVBQU8sSUFBUCxFQUFhLFlBQVc7QUFDdEI7QUFDQTtBQUNELFNBSEQ7QUFJRCxPQUxEO0FBTUEsY0FBUSxJQUFSO0FBQ0Q7QUFDRixHQVpIO0FBYUEsTUFBSSxDQUFDLEtBQUwsRUFBWTtBQUNWLE9BQUcscUJBQUgsR0FBMkIsVUFBUyxRQUFULEVBQW1CO0FBQzVDLGlCQUFXLFlBQVc7QUFDcEI7QUFDQTtBQUNELE9BSEQsRUFHRyxPQUFPLEVBSFY7QUFJRCxLQUxEO0FBTUQ7QUFDRiIsImZpbGUiOiJmeC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRpbWVyIGJhc2VkIGFuaW1hdGlvblxuLy8gVE9ETyBjbGVhbiB1cCBsaW50aW5nXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyogZ2xvYmFsIHNldFRpbWVvdXQgKi9cbmltcG9ydCB7bWVyZ2UsIG5vb3AsIHNwbGF0fSBmcm9tICcuLi91dGlscyc7XG5cbnZhciBRdWV1ZSA9IFtdO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGeCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMub3B0ID0gbWVyZ2Uoe1xuICAgICAgZGVsYXk6IDAsXG4gICAgICBkdXJhdGlvbjogMTAwMCxcbiAgICAgIHRyYW5zaXRpb246IHggPT4geCxcbiAgICAgIG9uQ29tcHV0ZTogbm9vcCxcbiAgICAgIG9uQ29tcGxldGU6IG5vb3BcbiAgICB9LCBvcHRpb25zKTtcbiAgfVxuXG4gIHN0YXJ0KG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHRoaXMub3B0LCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICBRdWV1ZS5wdXNoKHRoaXMpO1xuICB9XG5cbiAgLy8gcGVyZm9ybSBhIHN0ZXAgaW4gdGhlIGFuaW1hdGlvblxuICBzdGVwKCkge1xuICAgIC8vIGlmIG5vdCBhbmltYXRpbmcsIHRoZW4gcmV0dXJuXG4gICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpLFxuICAgICAgdGltZSA9IHRoaXMudGltZSxcbiAgICAgIG9wdCA9IHRoaXMub3B0LFxuICAgICAgZGVsYXkgPSBvcHQuZGVsYXksXG4gICAgICBkdXJhdGlvbiA9IG9wdC5kdXJhdGlvbixcbiAgICAgIGRlbHRhID0gMDtcbiAgICAvLyBob2xkIGFuaW1hdGlvbiBmb3IgdGhlIGRlbGF5XG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5KSB7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBpZiBpbiBvdXIgdGltZSB3aW5kb3csIHRoZW4gZXhlY3V0ZSBhbmltYXRpb25cbiAgICBpZiAoY3VycmVudFRpbWUgPCB0aW1lICsgZGVsYXkgKyBkdXJhdGlvbikge1xuICAgICAgZGVsdGEgPSBvcHQudHJhbnNpdGlvbigoY3VycmVudFRpbWUgLSB0aW1lIC0gZGVsYXkpIC8gZHVyYXRpb24pO1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCAxKTtcbiAgICAgIG9wdC5vbkNvbXBsZXRlLmNhbGwodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGNvbXB1dGUoZnJvbSwgdG8sIGRlbHRhKSB7XG4gICAgcmV0dXJuIGZyb20gKyAodG8gLSBmcm9tKSAqIGRlbHRhO1xuICB9XG59XG5cbkZ4LlF1ZXVlID0gUXVldWU7XG5cbi8vIEVhc2luZyBlcXVhdGlvbnNcbkZ4LlRyYW5zaXRpb24gPSB7XG4gIGxpbmVhcihwKSB7XG4gICAgcmV0dXJuIHA7XG4gIH1cbn07XG5cbnZhciBUcmFucyA9IEZ4LlRyYW5zaXRpb247XG5cbkZ4LnByb3RvdHlwZS50aW1lID0gbnVsbDtcblxuZnVuY3Rpb24gbWFrZVRyYW5zKHRyYW5zaXRpb24sIHBhcmFtcykge1xuICBwYXJhbXMgPSBzcGxhdChwYXJhbXMpO1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbih0cmFuc2l0aW9uLCB7XG4gICAgZWFzZUluKHBvcykge1xuICAgICAgcmV0dXJuIHRyYW5zaXRpb24ocG9zLCBwYXJhbXMpO1xuICAgIH0sXG4gICAgZWFzZU91dChwb3MpIHtcbiAgICAgIHJldHVybiAxIC0gdHJhbnNpdGlvbigxIC0gcG9zLCBwYXJhbXMpO1xuICAgIH0sXG4gICAgZWFzZUluT3V0KHBvcykge1xuICAgICAgcmV0dXJuIChwb3MgPD0gMC41KSA/IHRyYW5zaXRpb24oMiAqIHBvcywgcGFyYW1zKSAvIDIgOlxuICAgICAgICAoMiAtIHRyYW5zaXRpb24oMiAqICgxIC0gcG9zKSwgcGFyYW1zKSkgLyAyO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciB0cmFuc2l0aW9ucyA9IHtcblxuICBQb3cocCwgeCkge1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCB4WzBdIHx8IDYpO1xuICB9LFxuXG4gIEV4cG8ocCkge1xuICAgIHJldHVybiBNYXRoLnBvdygyLCA4ICogKHAgLSAxKSk7XG4gIH0sXG5cbiAgQ2lyYyhwKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnNpbihNYXRoLmFjb3MocCkpO1xuICB9LFxuXG4gIFNpbmUocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oKDEgLSBwKSAqIE1hdGguUEkgLyAyKTtcbiAgfSxcblxuICBCYWNrKHAsIHgpIHtcbiAgICB4ID0geFswXSB8fCAxLjYxODtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgMikgKiAoKHggKyAxKSAqIHAgLSB4KTtcbiAgfSxcblxuICBCb3VuY2UocCkge1xuICAgIHZhciB2YWx1ZTtcbiAgICBmb3IgKGxldCBhID0gMCwgYiA9IDE7IDE7IGEgKz0gYiwgYiAvPSAyKSB7XG4gICAgICBpZiAocCA+PSAoNyAtIDQgKiBhKSAvIDExKSB7XG4gICAgICAgIHZhbHVlID0gYiAqIGIgLSBNYXRoLnBvdygoMTEgLSA2ICogYSAtIDExICogcCkgLyA0LCAyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfSxcblxuICBFbGFzdGljKHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgMTAgKiAtLXApICogTWF0aC5jb3MoMjAgKiBwICogTWF0aC5QSSAqICh4WzBdIHx8IDEpIC8gMyk7XG4gIH1cblxufTtcblxuZm9yIChjb25zdCB0IGluIHRyYW5zaXRpb25zKSB7XG4gIFRyYW5zW3RdID0gbWFrZVRyYW5zKHRyYW5zaXRpb25zW3RdKTtcbn1cblxuWydRdWFkJywgJ0N1YmljJywgJ1F1YXJ0JywgJ1F1aW50J10uZm9yRWFjaChmdW5jdGlvbihlbGVtLCBpKSB7XG4gIFRyYW5zW2VsZW1dID0gbWFrZVRyYW5zKGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgW1xuICAgICAgaSArIDJcbiAgICBdKTtcbiAgfSk7XG59KTtcblxuLy8gYW5pbWF0aW9uVGltZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuXG4vLyByeWU6IFRPRE8tIHJlZmFjdG9yIGdsb2JhbCBkZWZpbml0aW9uIHdoZW4gd2UgZGVmaW5lIHRoZSB0d29cbi8vICAgICAgICAgICAoYnJvd3NlcmlmeS88c2NyaXB0PikgYnVpbGQgcGF0aHMuXG52YXIgZ2xvYmFsO1xudHJ5IHtcbiAgZ2xvYmFsID0gd2luZG93O1xufSBjYXRjaCAoZSkge1xuICBnbG9iYWwgPSBudWxsO1xufVxuXG52YXIgY2hlY2tGeFF1ZXVlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvbGRRdWV1ZSA9IFF1ZXVlO1xuICBRdWV1ZSA9IFtdO1xuICBpZiAob2xkUXVldWUubGVuZ3RoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvbGRRdWV1ZS5sZW5ndGgsIGZ4OyBpIDwgbDsgaSsrKSB7XG4gICAgICBmeCA9IG9sZFF1ZXVlW2ldO1xuICAgICAgZnguc3RlcCgpO1xuICAgICAgaWYgKGZ4LmFuaW1hdGluZykge1xuICAgICAgICBRdWV1ZS5wdXNoKGZ4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgRnguUXVldWUgPSBRdWV1ZTtcbiAgfVxufTtcblxuaWYgKGdsb2JhbCkge1xuICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgWyd3ZWJraXRBbmltYXRpb25UaW1lJywgJ21vekFuaW1hdGlvblRpbWUnLCAnYW5pbWF0aW9uVGltZScsXG4gICAnd2Via2l0QW5pbWF0aW9uU3RhcnRUaW1lJywgJ21vekFuaW1hdGlvblN0YXJ0VGltZScsICdhbmltYXRpb25TdGFydFRpbWUnXVxuICAgIC5mb3JFYWNoKGltcGwgPT4ge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LmFuaW1hdGlvblRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZ2xvYmFsW2ltcGxdO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5hbmltYXRpb25UaW1lID0gRGF0ZS5ub3c7XG4gIH1cbiAgLy8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIC0gZnVuY3Rpb24gYnJhbmNoaW5nXG4gIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lJywgJ21velJlcXVlc3RBbmltYXRpb25GcmFtZScsXG4gICAncmVxdWVzdEFuaW1hdGlvbkZyYW1lJ11cbiAgICAuZm9yRWFjaChmdW5jdGlvbihpbXBsKSB7XG4gICAgICBpZiAoaW1wbCBpbiBnbG9iYWwpIHtcbiAgICAgICAgRngucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICBnbG9iYWxbaW1wbF0oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjaGVja0Z4UXVldWUoKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgaWYgKCFmb3VuZCkge1xuICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBjaGVja0Z4UXVldWUoKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0sIDEwMDAgLyA2MCk7XG4gICAgfTtcbiAgfVxufVxuIl19