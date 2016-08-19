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
//# sourceMappingURL=data:application/json;base64,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bmltYXRpb25cbi8vIFRPRE8gY2xlYW4gdXAgbGludGluZ1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGdsb2JhbCBzZXRUaW1lb3V0ICovXG5pbXBvcnQge21lcmdlLCBub29wLCBzcGxhdH0gZnJvbSAnLi4vdXRpbHMnO1xuXG52YXIgUXVldWUgPSBbXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRngge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHtcbiAgICAgIGRlbGF5OiAwLFxuICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICB0cmFuc2l0aW9uOiB4ID0+IHgsXG4gICAgICBvbkNvbXB1dGU6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wXG4gICAgfSwgb3B0aW9ucyk7XG4gIH1cblxuICBzdGFydChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh0aGlzLm9wdCwgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy50aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmFuaW1hdGluZyA9IHRydWU7XG4gICAgUXVldWUucHVzaCh0aGlzKTtcbiAgfVxuXG4gIC8vIHBlcmZvcm0gYSBzdGVwIGluIHRoZSBhbmltYXRpb25cbiAgc3RlcCgpIHtcbiAgICAvLyBpZiBub3QgYW5pbWF0aW5nLCB0aGVuIHJldHVyblxuICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKSxcbiAgICAgIHRpbWUgPSB0aGlzLnRpbWUsXG4gICAgICBvcHQgPSB0aGlzLm9wdCxcbiAgICAgIGRlbGF5ID0gb3B0LmRlbGF5LFxuICAgICAgZHVyYXRpb24gPSBvcHQuZHVyYXRpb24sXG4gICAgICBkZWx0YSA9IDA7XG4gICAgLy8gaG9sZCBhbmltYXRpb24gZm9yIHRoZSBkZWxheVxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSkge1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaWYgaW4gb3VyIHRpbWUgd2luZG93LCB0aGVuIGV4ZWN1dGUgYW5pbWF0aW9uXG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5ICsgZHVyYXRpb24pIHtcbiAgICAgIGRlbHRhID0gb3B0LnRyYW5zaXRpb24oKGN1cnJlbnRUaW1lIC0gdGltZSAtIGRlbGF5KSAvIGR1cmF0aW9uKTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgMSk7XG4gICAgICBvcHQub25Db21wbGV0ZS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBjb21wdXRlKGZyb20sIHRvLCBkZWx0YSkge1xuICAgIHJldHVybiBmcm9tICsgKHRvIC0gZnJvbSkgKiBkZWx0YTtcbiAgfVxufVxuXG5GeC5RdWV1ZSA9IFF1ZXVlO1xuXG4vLyBFYXNpbmcgZXF1YXRpb25zXG5GeC5UcmFuc2l0aW9uID0ge1xuICBsaW5lYXIocCkge1xuICAgIHJldHVybiBwO1xuICB9XG59O1xuXG52YXIgVHJhbnMgPSBGeC5UcmFuc2l0aW9uO1xuXG5GeC5wcm90b3R5cGUudGltZSA9IG51bGw7XG5cbmZ1bmN0aW9uIG1ha2VUcmFucyh0cmFuc2l0aW9uLCBwYXJhbXMpIHtcbiAgcGFyYW1zID0gc3BsYXQocGFyYW1zKTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24odHJhbnNpdGlvbiwge1xuICAgIGVhc2VJbihwb3MpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uKHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VPdXQocG9zKSB7XG4gICAgICByZXR1cm4gMSAtIHRyYW5zaXRpb24oMSAtIHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VJbk91dChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zIDw9IDAuNSkgPyB0cmFuc2l0aW9uKDIgKiBwb3MsIHBhcmFtcykgLyAyIDpcbiAgICAgICAgKDIgLSB0cmFuc2l0aW9uKDIgKiAoMSAtIHBvcyksIHBhcmFtcykpIC8gMjtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgdHJhbnNpdGlvbnMgPSB7XG5cbiAgUG93KHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgeFswXSB8fCA2KTtcbiAgfSxcblxuICBFeHBvKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgOCAqIChwIC0gMSkpO1xuICB9LFxuXG4gIENpcmMocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oTWF0aC5hY29zKHApKTtcbiAgfSxcblxuICBTaW5lKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKCgxIC0gcCkgKiBNYXRoLlBJIC8gMik7XG4gIH0sXG5cbiAgQmFjayhwLCB4KSB7XG4gICAgeCA9IHhbMF0gfHwgMS42MTg7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIDIpICogKCh4ICsgMSkgKiBwIC0geCk7XG4gIH0sXG5cbiAgQm91bmNlKHApIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgZm9yIChsZXQgYSA9IDAsIGIgPSAxOyAxOyBhICs9IGIsIGIgLz0gMikge1xuICAgICAgaWYgKHAgPj0gKDcgLSA0ICogYSkgLyAxMSkge1xuICAgICAgICB2YWx1ZSA9IGIgKiBiIC0gTWF0aC5wb3coKDExIC0gNiAqIGEgLSAxMSAqIHApIC8gNCwgMik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG5cbiAgRWxhc3RpYyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDEwICogLS1wKSAqIE1hdGguY29zKDIwICogcCAqIE1hdGguUEkgKiAoeFswXSB8fCAxKSAvIDMpO1xuICB9XG5cbn07XG5cbmZvciAoY29uc3QgdCBpbiB0cmFuc2l0aW9ucykge1xuICBUcmFuc1t0XSA9IG1ha2VUcmFucyh0cmFuc2l0aW9uc1t0XSk7XG59XG5cblsnUXVhZCcsICdDdWJpYycsICdRdWFydCcsICdRdWludCddLmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaSkge1xuICBUcmFuc1tlbGVtXSA9IG1ha2VUcmFucyhmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIFtcbiAgICAgIGkgKyAyXG4gICAgXSk7XG4gIH0pO1xufSk7XG5cbi8vIGFuaW1hdGlvblRpbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcblxuLy8gcnllOiBUT0RPLSByZWZhY3RvciBnbG9iYWwgZGVmaW5pdGlvbiB3aGVuIHdlIGRlZmluZSB0aGUgdHdvXG4vLyAgICAgICAgICAgKGJyb3dzZXJpZnkvPHNjcmlwdD4pIGJ1aWxkIHBhdGhzLlxudmFyIGdsb2JhbDtcbnRyeSB7XG4gIGdsb2JhbCA9IHdpbmRvdztcbn0gY2F0Y2ggKGUpIHtcbiAgZ2xvYmFsID0gbnVsbDtcbn1cblxudmFyIGNoZWNrRnhRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2xkUXVldWUgPSBRdWV1ZTtcbiAgUXVldWUgPSBbXTtcbiAgaWYgKG9sZFF1ZXVlLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2xkUXVldWUubGVuZ3RoLCBmeDsgaSA8IGw7IGkrKykge1xuICAgICAgZnggPSBvbGRRdWV1ZVtpXTtcbiAgICAgIGZ4LnN0ZXAoKTtcbiAgICAgIGlmIChmeC5hbmltYXRpbmcpIHtcbiAgICAgICAgUXVldWUucHVzaChmeCk7XG4gICAgICB9XG4gICAgfVxuICAgIEZ4LlF1ZXVlID0gUXVldWU7XG4gIH1cbn07XG5cbmlmIChnbG9iYWwpIHtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0QW5pbWF0aW9uVGltZScsICdtb3pBbmltYXRpb25UaW1lJywgJ2FuaW1hdGlvblRpbWUnLFxuICAgJ3dlYmtpdEFuaW1hdGlvblN0YXJ0VGltZScsICdtb3pBbmltYXRpb25TdGFydFRpbWUnLCAnYW5pbWF0aW9uU3RhcnRUaW1lJ11cbiAgICAuZm9yRWFjaChpbXBsID0+IHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5hbmltYXRpb25UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGdsb2JhbFtpbXBsXTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRnguYW5pbWF0aW9uVGltZSA9IERhdGUubm93O1xuICB9XG4gIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuICBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZScsICdtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLFxuICAgJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddXG4gICAgLmZvckVhY2goZnVuY3Rpb24oaW1wbCkge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgZ2xvYmFsW2ltcGxdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9LCAxMDAwIC8gNjApO1xuICAgIH07XG4gIH1cbn1cbiJdfQ==