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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvZnguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQU1BLElBQUksUUFBUSxFQUFSOztJQUVpQjtBQUNuQixXQURtQixFQUNuQixHQUEwQjtRQUFkLGdFQUFVLGtCQUFJOzswQkFEUCxJQUNPOztBQUN4QixTQUFLLEdBQUwsR0FBVyxrQkFBTTtBQUNmLGFBQU8sQ0FBUDtBQUNBLGdCQUFVLElBQVY7QUFDQSxrQkFBWTtlQUFLO09BQUw7QUFDWiw0QkFKZTtBQUtmLDZCQUxlO0tBQU4sRUFNUixPQU5RLENBQVgsQ0FEd0I7R0FBMUI7O2VBRG1COzswQkFXYixTQUFTO0FBQ2IsV0FBSyxHQUFMLEdBQVcsa0JBQU0sS0FBSyxHQUFMLEVBQVUsV0FBVyxFQUFYLENBQTNCLENBRGE7QUFFYixXQUFLLElBQUwsR0FBWSxLQUFLLEdBQUwsRUFBWixDQUZhO0FBR2IsV0FBSyxTQUFMLEdBQWlCLElBQWpCLENBSGE7QUFJYixZQUFNLElBQU4sQ0FBVyxJQUFYLEVBSmE7Ozs7Ozs7MkJBUVI7O0FBRUwsVUFBSSxDQUFDLEtBQUssU0FBTCxFQUFnQjtBQUNuQixlQURtQjtPQUFyQjtBQUdBLFVBQUksY0FBYyxLQUFLLEdBQUwsRUFBZDtVQUNGLE9BQU8sS0FBSyxJQUFMO1VBQ1AsTUFBTSxLQUFLLEdBQUw7VUFDTixRQUFRLElBQUksS0FBSjtVQUNSLFdBQVcsSUFBSSxRQUFKO1VBQ1gsUUFBUSxDQUFSOztBQVZHLFVBWUQsY0FBYyxPQUFPLEtBQVAsRUFBYztBQUM5QixZQUFJLFNBQUosQ0FBYyxJQUFkLENBQW1CLElBQW5CLEVBQXlCLEtBQXpCLEVBRDhCO0FBRTlCLGVBRjhCO09BQWhDOztBQVpLLFVBaUJELGNBQWMsT0FBTyxLQUFQLEdBQWUsUUFBZixFQUF5QjtBQUN6QyxnQkFBUSxJQUFJLFVBQUosQ0FBZSxDQUFDLGNBQWMsSUFBZCxHQUFxQixLQUFyQixDQUFELEdBQStCLFFBQS9CLENBQXZCLENB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cyIsInNvdXJjZXNDb250ZW50IjpbIi8vICBUaW1lciBiYXNlZCBhbmltYXRpb25cbi8vIFRPRE8gY2xlYW4gdXAgbGludGluZ1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGdsb2JhbCBzZXRUaW1lb3V0ICovXG5pbXBvcnQge21lcmdlLCBub29wLCBzcGxhdH0gZnJvbSAnLi4vdXRpbHMnO1xuXG52YXIgUXVldWUgPSBbXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRngge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHtcbiAgICAgIGRlbGF5OiAwLFxuICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICB0cmFuc2l0aW9uOiB4ID0+IHgsXG4gICAgICBvbkNvbXB1dGU6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wXG4gICAgfSwgb3B0aW9ucyk7XG4gIH1cblxuICBzdGFydChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh0aGlzLm9wdCwgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy50aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmFuaW1hdGluZyA9IHRydWU7XG4gICAgUXVldWUucHVzaCh0aGlzKTtcbiAgfVxuXG4gIC8vIHBlcmZvcm0gYSBzdGVwIGluIHRoZSBhbmltYXRpb25cbiAgc3RlcCgpIHtcbiAgICAvLyBpZiBub3QgYW5pbWF0aW5nLCB0aGVuIHJldHVyblxuICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKSxcbiAgICAgIHRpbWUgPSB0aGlzLnRpbWUsXG4gICAgICBvcHQgPSB0aGlzLm9wdCxcbiAgICAgIGRlbGF5ID0gb3B0LmRlbGF5LFxuICAgICAgZHVyYXRpb24gPSBvcHQuZHVyYXRpb24sXG4gICAgICBkZWx0YSA9IDA7XG4gICAgLy8gaG9sZCBhbmltYXRpb24gZm9yIHRoZSBkZWxheVxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSkge1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaWYgaW4gb3VyIHRpbWUgd2luZG93LCB0aGVuIGV4ZWN1dGUgYW5pbWF0aW9uXG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5ICsgZHVyYXRpb24pIHtcbiAgICAgIGRlbHRhID0gb3B0LnRyYW5zaXRpb24oKGN1cnJlbnRUaW1lIC0gdGltZSAtIGRlbGF5KSAvIGR1cmF0aW9uKTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgMSk7XG4gICAgICBvcHQub25Db21wbGV0ZS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBjb21wdXRlKGZyb20sIHRvLCBkZWx0YSkge1xuICAgIHJldHVybiBmcm9tICsgKHRvIC0gZnJvbSkgKiBkZWx0YTtcbiAgfVxufVxuXG5GeC5RdWV1ZSA9IFF1ZXVlO1xuXG4vLyBFYXNpbmcgZXF1YXRpb25zXG5GeC5UcmFuc2l0aW9uID0ge1xuICBsaW5lYXIocCkge1xuICAgIHJldHVybiBwO1xuICB9XG59O1xuXG52YXIgVHJhbnMgPSBGeC5UcmFuc2l0aW9uO1xuXG5GeC5wcm90b3R5cGUudGltZSA9IG51bGw7XG5cbmZ1bmN0aW9uIG1ha2VUcmFucyh0cmFuc2l0aW9uLCBwYXJhbXMpIHtcbiAgcGFyYW1zID0gc3BsYXQocGFyYW1zKTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24odHJhbnNpdGlvbiwge1xuICAgIGVhc2VJbihwb3MpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uKHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VPdXQocG9zKSB7XG4gICAgICByZXR1cm4gMSAtIHRyYW5zaXRpb24oMSAtIHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VJbk91dChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zIDw9IDAuNSkgPyB0cmFuc2l0aW9uKDIgKiBwb3MsIHBhcmFtcykgLyAyIDpcbiAgICAgICAgKDIgLSB0cmFuc2l0aW9uKDIgKiAoMSAtIHBvcyksIHBhcmFtcykpIC8gMjtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgdHJhbnNpdGlvbnMgPSB7XG5cbiAgUG93KHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgeFswXSB8fCA2KTtcbiAgfSxcblxuICBFeHBvKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgOCAqIChwIC0gMSkpO1xuICB9LFxuXG4gIENpcmMocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oTWF0aC5hY29zKHApKTtcbiAgfSxcblxuICBTaW5lKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKCgxIC0gcCkgKiBNYXRoLlBJIC8gMik7XG4gIH0sXG5cbiAgQmFjayhwLCB4KSB7XG4gICAgeCA9IHhbMF0gfHwgMS42MTg7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIDIpICogKCh4ICsgMSkgKiBwIC0geCk7XG4gIH0sXG5cbiAgQm91bmNlKHApIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgZm9yIChsZXQgYSA9IDAsIGIgPSAxOyAxOyBhICs9IGIsIGIgLz0gMikge1xuICAgICAgaWYgKHAgPj0gKDcgLSA0ICogYSkgLyAxMSkge1xuICAgICAgICB2YWx1ZSA9IGIgKiBiIC0gTWF0aC5wb3coKDExIC0gNiAqIGEgLSAxMSAqIHApIC8gNCwgMik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG5cbiAgRWxhc3RpYyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDEwICogLS1wKSAqIE1hdGguY29zKDIwICogcCAqIE1hdGguUEkgKiAoeFswXSB8fCAxKSAvIDMpO1xuICB9XG5cbn07XG5cbmZvciAoY29uc3QgdCBpbiB0cmFuc2l0aW9ucykge1xuICBUcmFuc1t0XSA9IG1ha2VUcmFucyh0cmFuc2l0aW9uc1t0XSk7XG59XG5cblsnUXVhZCcsICdDdWJpYycsICdRdWFydCcsICdRdWludCddLmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaSkge1xuICBUcmFuc1tlbGVtXSA9IG1ha2VUcmFucyhmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIFtcbiAgICAgIGkgKyAyXG4gICAgXSk7XG4gIH0pO1xufSk7XG5cbi8vIGFuaW1hdGlvblRpbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcblxuLy8gIHJ5ZTogVE9ETy0gcmVmYWN0b3IgZ2xvYmFsIGRlZmluaXRpb24gd2hlbiB3ZSBkZWZpbmUgdGhlIHR3b1xuLy8gICAgICAgICAgICAgKGJyb3dzZXJpZnkvPHNjcmlwdD4pIGJ1aWxkIHBhdGhzLlxudmFyIGdsb2JhbDtcbnRyeSB7XG4gIGdsb2JhbCA9IHdpbmRvdztcbn0gY2F0Y2ggKGUpIHtcbiAgZ2xvYmFsID0gbnVsbDtcbn1cblxudmFyIGNoZWNrRnhRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2xkUXVldWUgPSBRdWV1ZTtcbiAgUXVldWUgPSBbXTtcbiAgaWYgKG9sZFF1ZXVlLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2xkUXVldWUubGVuZ3RoLCBmeDsgaSA8IGw7IGkrKykge1xuICAgICAgZnggPSBvbGRRdWV1ZVtpXTtcbiAgICAgIGZ4LnN0ZXAoKTtcbiAgICAgIGlmIChmeC5hbmltYXRpbmcpIHtcbiAgICAgICAgUXVldWUucHVzaChmeCk7XG4gICAgICB9XG4gICAgfVxuICAgIEZ4LlF1ZXVlID0gUXVldWU7XG4gIH1cbn07XG5cbmlmIChnbG9iYWwpIHtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0QW5pbWF0aW9uVGltZScsICdtb3pBbmltYXRpb25UaW1lJywgJ2FuaW1hdGlvblRpbWUnLFxuICAgJ3dlYmtpdEFuaW1hdGlvblN0YXJ0VGltZScsICdtb3pBbmltYXRpb25TdGFydFRpbWUnLCAnYW5pbWF0aW9uU3RhcnRUaW1lJ11cbiAgICAuZm9yRWFjaChpbXBsID0+IHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5hbmltYXRpb25UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGdsb2JhbFtpbXBsXTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRnguYW5pbWF0aW9uVGltZSA9IERhdGUubm93O1xuICB9XG4gIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuICBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZScsICdtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLFxuICAgJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddXG4gICAgLmZvckVhY2goZnVuY3Rpb24oaW1wbCkge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgZ2xvYmFsW2ltcGxdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9LCAxMDAwIC8gNjApO1xuICAgIH07XG4gIH1cbn1cbiJdfQ==