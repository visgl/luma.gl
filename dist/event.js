'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Events = exports.EventsProxy = exports.stop = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // event.js
// Handle keyboard/mouse/touch events in the Canvas
// TODO - this will not work under node

/* eslint-disable dot-notation, max-statements, no-loop-func */
/* global window, document */


exports.get = get;
exports.getWheel = getWheel;
exports.getKey = getKey;
exports.isRightClick = isRightClick;
exports.getPos = getPos;

var _utils = require('./utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KEYS = {
  'enter': 13,
  'up': 38,
  'down': 40,
  'left': 37,
  'right': 39,
  'esc': 27,
  'space': 32,
  'backspace': 8,
  'tab': 9,
  'delete': 46
};

// returns an O3D object or false otherwise.
function toO3D(n) {
  return n !== true ? n : false;
}

// Returns an element position
function _getPos(elem) {
  var bbox = elem.getBoundingClientRect();
  return {
    x: bbox.left,
    y: bbox.top,
    bbox: bbox
  };
}

// event object wrapper
function get(e, win) {
  win = win || window;
  return e || win.event;
}

function getWheel(e) {
  return e.wheelDelta ? e.wheelDelta / 120 : -(e.detail || 0) / 3;
}

function getKey(e) {
  var code = e.which || e.keyCode;
  var key = keyOf(code);
  // onkeydown
  var fKey = code - 111;
  if (fKey > 0 && fKey < 13) {
    key = 'f' + fKey;
  }
  key = key || String.fromCharCode(code).toLowerCase();

  return {
    code: code,
    key: key,
    shift: e.shiftKey,
    control: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey
  };
}

function isRightClick(e) {
  return e.which === 3 || e.button === 2;
}

function getPos(e, win) {
  // get mouse position
  win = win || window;
  e = e || win.event;
  var doc = win.document;
  doc = doc.documentElement || doc.body;
  // TODO(nico): make touch event handling better
  if (e.touches && e.touches.length) {
    var touchesPos = [];
    for (var i = 0, l = e.touches.length, evt; i < l; ++i) {
      evt = e.touches[i];
      touchesPos.push({
        x: evt.pageX || evt.clientX + doc.scrollLeft,
        y: evt.pageY || evt.clientY + doc.scrollTop
      });
    }
    return touchesPos;
  }
  var page = {
    x: e.pageX || e.clientX + doc.scrollLeft,
    y: e.pageY || e.clientY + doc.scrollTop
  };
  return [page];
}

function _stop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  e.cancelBubble = true;
  if (e.preventDefault) {
    e.preventDefault();
  } else {
    e.returnValue = false;
  }
}

exports.stop = _stop;

var EventsProxy = exports.EventsProxy = function () {
  function EventsProxy(domElem, opt) {
    _classCallCheck(this, EventsProxy);

    this.scene = opt.scene;
    this.domElem = domElem;
    this.pos = _getPos(domElem);
    this.opt = this.callbacks = opt;

    this.size = {
      width: domElem.width || domElem.offsetWidth,
      height: domElem.height || domElem.offsetHeight
    };

    this.attachEvents();
  }

  _createClass(EventsProxy, [{
    key: 'attachEvents',
    value: function attachEvents() {
      var _this = this;

      var domElem = this.domElem;
      var opt = this.opt;

      if (opt.disableContextMenu) {
        domElem.oncontextmenu = function () {
          return false;
        };
      }

      if (opt.enableMouse) {
        ['mouseup', 'mousedown', 'mousemove', 'mouseover', 'mouseout'].forEach(function (action) {
          domElem.addEventListener(action, function (e, win) {
            _this[action](_this.eventInfo(action, e, win));
          }, false);
        });

        // "well, this is embarrassing..."
        var type = '';
        if (!document.getBoxObjectFor && window.mozInnerScreenX === null) {
          type = 'mousewheel';
        } else {
          type = 'DOMMouseScroll';
        }
        domElem.addEventListener(type, function (e, win) {
          _this['mousewheel'](_this.eventInfo('mousewheel', e, win));
        }, false);
      }

      if (opt.enableTouch) {
        ['touchstart', 'touchmove', 'touchend'].forEach(function (action) {
          domElem.addEventListener(action, function (e, win) {
            _this[action](_this.eventInfo(action, e, win));
          }, false);
        });
      }

      if (opt.enableKeyboard) {
        ['keydown', 'keyup'].forEach(function (action) {
          document.addEventListener(action, function (e, win) {
            _this[action](_this.eventInfo(action, e, win));
          }, false);
        });
      }
    }
  }, {
    key: 'eventInfo',
    value: function eventInfo(type, e, win) {
      var domElem = this.domElem;
      var scene = this.scene;
      var opt = this.opt;
      var size = this.getSize();
      var relative = opt.relative;
      var centerOrigin = opt.centerOrigin;
      var pos = opt.cachePosition && this.pos || _getPos(domElem);
      var ge = get(e, win);
      var epos = getPos(e, win);
      var origPos = { x: epos[0].x, y: epos[0].y };
      var evt = {};
      var x = void 0;
      var y = void 0;

      // get Position
      for (var i = 0, l = epos.length; i < l; ++i) {
        x = epos[i].x;
        y = epos[i].y;
        if (relative) {
          x -= pos.x;y -= pos.y;
          if (centerOrigin) {
            x -= size.width / 2;
            y -= size.height / 2;
            // y axis now points to the top of the screen
            y *= -1;
          }
        }
        epos[i].x = x;
        epos[i].y = y;
      }

      switch (type) {
        case 'mousewheel':
          evt.wheel = getWheel(ge);
          break;
        case 'keydown':
        case 'keyup':
          Object.assign(evt, getKey(ge));
          break;
        case 'mouseup':
          evt.isRightClick = isRightClick(ge);
          break;
        default:
          break;
      }

      var cacheTarget;

      Object.assign(evt, {
        x: epos[0].x,
        y: epos[0].y,
        posArray: epos,

        cache: false,
        // stop event propagation
        stop: function stop() {
          _stop(ge);
        },

        // get the target element of the event
        getTarget: function getTarget() {
          if (cacheTarget) {
            return cacheTarget;
          }
          return cacheTarget = opt.picking && scene.pick(origPos.x - pos.x, origPos.y - pos.y) || true;
        }
      });
      // wrap native event
      evt.event = ge;

      return evt;
    }
  }, {
    key: 'getSize',
    value: function getSize() {
      if (this.cacheSize) {
        return this.size;
      }
      var domElem = this.domElem;
      return {
        width: domElem.width || domElem.offsetWidth,
        height: domElem.height || domElem.offsetHeight
      };
    }
  }, {
    key: 'mouseup',
    value: function mouseup(e) {
      if (!this.moved) {
        if (e.isRightClick) {
          this.callbacks.onRightClick(e, this.hovered);
        } else {
          this.callbacks.onClick(e, toO3D(this.pressed));
        }
      }
      if (this.pressed) {
        if (this.moved) {
          this.callbacks.onDragEnd(e, toO3D(this.pressed));
        } else {
          this.callbacks.onDragCancel(e, toO3D(this.pressed));
        }
        this.pressed = this.moved = false;
      }
    }
  }, {
    key: 'mouseout',
    value: function mouseout(e) {
      // mouseout canvas
      var rt = e.relatedTarget;
      var domElem = this.domElem;
      while (rt && rt.parentNode) {
        if (domElem === rt.parentNode) {
          return;
        }
        rt = rt.parentNode;
      }
      if (this.hovered) {
        this.callbacks.onMouseLeave(e, this.hovered);
        this.hovered = false;
      }
      if (this.pressed && this.moved) {
        this.callbacks.onDragEnd(e);
        this.pressed = this.moved = false;
      }
    }
  }, {
    key: 'mouseover',
    value: function mouseover(e) {}
  }, {
    key: 'mousemove',
    value: function mousemove(e) {
      if (this.pressed) {
        this.moved = true;
        this.callbacks.onDragMove(e, toO3D(this.pressed));
        return;
      }
      if (this.hovered) {
        var target = toO3D(e.getTarget());
        if (!target || target.hash !== this.hash) {
          this.callbacks.onMouseLeave(e, this.hovered);
          this.hovered = target;
          this.hash = target;
          if (target) {
            this.hash = target.hash;
            this.callbacks.onMouseEnter(e, this.hovered);
          }
        } else {
          this.callbacks.onMouseMove(e, this.hovered);
        }
      } else {
        this.hovered = toO3D(e.getTarget());
        this.hash = this.hovered;
        if (this.hovered) {
          this.hash = this.hovered.hash;
          this.callbacks.onMouseEnter(e, this.hovered);
        }
      }
      if (!this.opt.picking) {
        this.callbacks.onMouseMove(e);
      }
    }
  }, {
    key: 'mousewheel',
    value: function mousewheel(e) {
      this.callbacks.onMouseWheel(e);
    }
  }, {
    key: 'mousedown',
    value: function mousedown(e) {
      this.pressed = e.getTarget();
      this.callbacks.onDragStart(e, toO3D(this.pressed));
    }
  }, {
    key: 'touchstart',
    value: function touchstart(e) {
      this.touched = e.getTarget();
      this.touchedLastPosition = { x: e.x, y: e.y };
      this.callbacks.onTouchStart(e, toO3D(this.touched));
    }
  }, {
    key: 'touchmove',
    value: function touchmove(e) {
      if (this.touched) {
        this.touchMoved = true;
        this.callbacks.onTouchMove(e, toO3D(this.touched));
      }
    }
  }, {
    key: 'touchend',
    value: function touchend(e) {
      if (this.touched) {
        if (this.touchMoved) {
          this.callbacks.onTouchEnd(e, toO3D(this.touched));
        } else {
          e.x = isNaN(e.x) ? this.touchedLastPosition.x : e.x;
          e.y = isNaN(e.y) ? this.touchedLastPosition.y : e.y;
          this.callbacks.onTap(e, toO3D(this.touched));
          this.callbacks.onTouchCancel(e, toO3D(this.touched));
        }
        this.touched = this.touchMoved = false;
      }
    }
  }, {
    key: 'keydown',
    value: function keydown(e) {
      this.callbacks.onKeyDown(e);
    }
  }, {
    key: 'keyup',
    value: function keyup(e) {
      this.callbacks.onKeyUp(e);
    }
  }]);

  return EventsProxy;
}();

Object.assign(EventsProxy.prototype, {
  hovered: false,
  pressed: false,
  touched: false,
  touchedLastPosition: { x: 0, y: 0 },
  touchMoved: false,
  moved: false
});

var Events = exports.Events = {
  create: function create(gl) {
    var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];


    opt = _extends({
      cachePosition: true,
      cacheSize: true,
      relative: true,
      centerOrigin: true,
      disableContextMenu: true,
      bind: false,
      picking: false,

      enableTouch: true,
      enableMouse: true,
      enableKeyboard: true,

      onClick: _utils.noop,
      onRightClick: _utils.noop,
      onDragStart: _utils.noop,
      onDragMove: _utils.noop,
      onDragEnd: _utils.noop,
      onDragCancel: _utils.noop,
      onTouchStart: _utils.noop,
      onTouchMove: _utils.noop,
      onTouchEnd: _utils.noop,
      onTouchCancel: _utils.noop,
      onTap: _utils.noop,
      onMouseMove: _utils.noop,
      onMouseEnter: _utils.noop,
      onMouseLeave: _utils.noop,
      onMouseWheel: _utils.noop,
      onKeyDown: _utils.noop,
      onKeyUp: _utils.noop
    }, opt);

    var bind = opt.bind;
    if (bind) {
      for (var name in opt) {
        if (name.match(/^on[a-zA-Z0-9]+$/)) {
          (function (fname, fn) {
            opt[fname] = function () {
              fn.apply(bind, Array.prototype.slice.call(arguments));
            };
          })(name, opt[name]);
        }
      }
    }

    return new EventsProxy(gl, opt);
  }
};

Events.Keys = KEYS;

function keyOf(code) {
  var keyMap = Events.Keys;
  for (var name in keyMap) {
    if (keyMap[name] === code) {
      return name;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ldmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztRQXFDZ0I7UUFLQTtRQUlBO1FBb0JBO1FBSUE7O0FBaEVoQjs7OztBQUVBLElBQU0sT0FBTztBQUNYLFdBQVMsRUFBVDtBQUNBLFFBQU0sRUFBTjtBQUNBLFVBQVEsRUFBUjtBQUNBLFVBQVEsRUFBUjtBQUNBLFdBQVMsRUFBVDtBQUNBLFNBQU8sRUFBUDtBQUNBLFdBQVMsRUFBVDtBQUNBLGVBQWEsQ0FBYjtBQUNBLFNBQU8sQ0FBUDtBQUNBLFlBQVUsRUFBVjtDQVZJOzs7QUFjTixTQUFTLEtBQVQsQ0FBZSxDQUFmLEVBQWtCO0FBQ2hCLFNBQU8sTUFBTSxJQUFOLEdBQWEsQ0FBYixHQUFpQixLQUFqQixDQURTO0NBQWxCOzs7QUFLQSxTQUFTLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUI7QUFDckIsTUFBTSxPQUFPLEtBQUsscUJBQUwsRUFBUCxDQURlO0FBRXJCLFNBQU87QUFDTCxPQUFHLEtBQUssSUFBTDtBQUNILE9BQUcsS0FBSyxHQUFMO0FBQ0gsVUFBTSxJQUFOO0dBSEYsQ0FGcUI7Q0FBdkI7OztBQVVPLFNBQVMsR0FBVCxDQUFhLENBQWIsRUFBZ0IsR0FBaEIsRUFBcUI7QUFDMUIsUUFBTSxPQUFPLE1BQVAsQ0FEb0I7QUFFMUIsU0FBTyxLQUFLLElBQUksS0FBSixDQUZjO0NBQXJCOztBQUtBLFNBQVMsUUFBVCxDQUFrQixDQUFsQixFQUFxQjtBQUMxQixTQUFPLEVBQUUsVUFBRixHQUFlLEVBQUUsVUFBRixHQUFlLEdBQWYsR0FBcUIsRUFBRSxFQUFFLE1BQUYsSUFBWSxDQUFaLENBQUYsR0FBbUIsQ0FBbkIsQ0FEakI7Q0FBckI7O0FBSUEsU0FBUyxNQUFULENBQWdCLENBQWhCLEVBQW1CO0FBQ3hCLE1BQU0sT0FBTyxFQUFFLEtBQUYsSUFBVyxFQUFFLE9BQUYsQ0FEQTtBQUV4QixNQUFJLE1BQU0sTUFBTSxJQUFOLENBQU47O0FBRm9CLE1BSXBCLE9BQU8sT0FBTyxHQUFQLENBSmE7QUFLeEIsTUFBSSxPQUFPLENBQVAsSUFBWSxPQUFPLEVBQVAsRUFBVztBQUN6QixVQUFNLE1BQU0sSUFBTixDQURtQjtHQUEzQjtBQUdBLFFBQU0sT0FBTyxPQUFPLFlBQVAsQ0FBb0IsSUFBcEIsRUFBMEIsV0FBMUIsRUFBUCxDQVJrQjs7QUFVeEIsU0FBTztBQUNMLFVBQU0sSUFBTjtBQUNBLFNBQUssR0FBTDtBQUNBLFdBQU8sRUFBRSxRQUFGO0FBQ1AsYUFBUyxFQUFFLE9BQUY7QUFDVCxTQUFLLEVBQUUsTUFBRjtBQUNMLFVBQU0sRUFBRSxPQUFGO0dBTlIsQ0FWd0I7Q0FBbkI7O0FBb0JBLFNBQVMsWUFBVCxDQUFzQixDQUF0QixFQUF5QjtBQUM5QixTQUFPLEVBQUUsS0FBRixLQUFZLENBQVosSUFBaUIsRUFBRSxNQUFGLEtBQWEsQ0FBYixDQURNO0NBQXpCOztBQUlBLFNBQVMsTUFBVCxDQUFnQixDQUFoQixFQUFtQixHQUFuQixFQUF3Qjs7QUFFN0IsUUFBTSxPQUFPLE1BQVAsQ0FGdUI7QUFHN0IsTUFBSSxLQUFLLElBQUksS0FBSixDQUhvQjtBQUk3QixNQUFJLE1BQU0sSUFBSSxRQUFKLENBSm1CO0FBSzdCLFFBQU0sSUFBSSxlQUFKLElBQXVCLElBQUksSUFBSjs7QUFMQSxNQU96QixFQUFFLE9BQUYsSUFBYSxFQUFFLE9BQUYsQ0FBVSxNQUFWLEVBQWtCO0FBQ2pDLFFBQU0sYUFBYSxFQUFiLENBRDJCO0FBRWpDLFNBQUssSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLEVBQUUsT0FBRixDQUFVLE1BQVYsRUFBa0IsR0FBakMsRUFBc0MsSUFBSSxDQUFKLEVBQU8sRUFBRSxDQUFGLEVBQUs7QUFDckQsWUFBTSxFQUFFLE9BQUYsQ0FBVSxDQUFWLENBQU4sQ0FEcUQ7QUFFckQsaUJBQVcsSUFBWCxDQUFnQjtBQUNkLFdBQUcsSUFBSSxLQUFKLElBQWMsSUFBSSxPQUFKLEdBQWMsSUFBSSxVQUFKO0FBQy9CLFdBQUcsSUFBSSxLQUFKLElBQWMsSUFBSSxPQUFKLEdBQWMsSUFBSSxTQUFKO09BRmpDLEVBRnFEO0tBQXZEO0FBT0EsV0FBTyxVQUFQLENBVGlDO0dBQW5DO0FBV0EsTUFBSSxPQUFPO0FBQ1QsT0FBRyxFQUFFLEtBQUYsSUFBWSxFQUFFLE9BQUYsR0FBWSxJQUFJLFVBQUo7QUFDM0IsT0FBRyxFQUFFLEtBQUYsSUFBWSxFQUFFLE9BQUYsR0FBWSxJQUFJLFNBQUo7R0FGekIsQ0FsQnlCO0FBc0I3QixTQUFPLENBQUMsSUFBRCxDQUFQLENBdEI2QjtDQUF4Qjs7QUF5QkEsU0FBUyxLQUFULENBQWMsQ0FBZCxFQUFpQjtBQUN0QixNQUFJLEVBQUUsZUFBRixFQUFtQjtBQUNyQixNQUFFLGVBQUYsR0FEcUI7R0FBdkI7QUFHQSxJQUFFLFlBQUYsR0FBaUIsSUFBakIsQ0FKc0I7QUFLdEIsTUFBSSxFQUFFLGNBQUYsRUFBa0I7QUFDcEIsTUFBRSxjQUFGLEdBRG9CO0dBQXRCLE1BRU87QUFDTCxNQUFFLFdBQUYsR0FBZ0IsS0FBaEIsQ0FESztHQUZQO0NBTEs7Ozs7SUFZTTtBQUVYLFdBRlcsV0FFWCxDQUFZLE9BQVosRUFBcUIsR0FBckIsRUFBMEI7MEJBRmYsYUFFZTs7QUFDeEIsU0FBSyxLQUFMLEdBQWEsSUFBSSxLQUFKLENBRFc7QUFFeEIsU0FBSyxPQUFMLEdBQWUsT0FBZixDQUZ3QjtBQUd4QixTQUFLLEdBQUwsR0FBVyxRQUFRLE9BQVIsQ0FBWCxDQUh3QjtBQUl4QixTQUFLLEdBQUwsR0FBVyxLQUFLLFNBQUwsR0FBaUIsR0FBakIsQ0FKYTs7QUFNeEIsU0FBSyxJQUFMLEdBQVk7QUFDVixhQUFPLFFBQVEsS0FBUixJQUFpQixRQUFRLFdBQVI7QUFDeEIsY0FBUSxRQUFRLE1BQVIsSUFBa0IsUUFBUSxZQUFSO0tBRjVCLENBTndCOztBQVd4QixTQUFLLFlBQUwsR0FYd0I7R0FBMUI7O2VBRlc7O21DQWdCSTs7O0FBQ2IsVUFBTSxVQUFVLEtBQUssT0FBTCxDQURIO0FBRWIsVUFBTSxNQUFNLEtBQUssR0FBTCxDQUZDOztBQUliLFVBQUksSUFBSSxrQkFBSixFQUF3QjtBQUMxQixnQkFBUSxhQUFSLEdBQXdCO2lCQUFNO1NBQU4sQ0FERTtPQUE1Qjs7QUFJQSxVQUFJLElBQUksV0FBSixFQUFpQjtBQUNuQixTQUFDLFNBQUQsRUFBWSxXQUFaLEVBQXlCLFdBQXpCLEVBQXNDLFdBQXRDLEVBQW1ELFVBQW5ELEVBQ0MsT0FERCxDQUNTLGtCQUFVO0FBQ2pCLGtCQUFRLGdCQUFSLENBQXlCLE1BQXpCLEVBQWlDLFVBQUMsQ0FBRCxFQUFJLEdBQUosRUFBWTtBQUMzQyxrQkFBSyxNQUFMLEVBQWEsTUFBSyxTQUFMLENBQWUsTUFBZixFQUF1QixDQUF2QixFQUEwQixHQUExQixDQUFiLEVBRDJDO1dBQVosRUFFOUIsS0FGSCxFQURpQjtTQUFWLENBRFQ7OztBQURtQixZQVNmLE9BQU8sRUFBUCxDQVRlO0FBVW5CLFlBQUksQ0FBQyxTQUFTLGVBQVQsSUFBNEIsT0FBTyxlQUFQLEtBQTJCLElBQTNCLEVBQWlDO0FBQ2hFLGlCQUFPLFlBQVAsQ0FEZ0U7U0FBbEUsTUFFTztBQUNMLGlCQUFPLGdCQUFQLENBREs7U0FGUDtBQUtBLGdCQUFRLGdCQUFSLENBQXlCLElBQXpCLEVBQStCLFVBQUMsQ0FBRCxFQUFJLEdBQUosRUFBWTtBQUN6QyxnQkFBSyxZQUFMLEVBQW1CLE1BQUssU0FBTCxDQUFlLFlBQWYsRUFBNkIsQ0FBN0IsRUFBZ0MsR0FBaEMsQ0FBbkIsRUFEeUM7U0FBWixFQUU1QixLQUZILEVBZm1CO09BQXJCOztBQW9CQSxVQUFJLElBQUksV0FBSixFQUFpQjtBQUNuQixTQUFDLFlBQUQsRUFBZSxXQUFmLEVBQTRCLFVBQTVCLEVBQXdDLE9BQXhDLENBQWdELGtCQUFVO0FBQ3hELGtCQUFRLGdCQUFSLENBQXlCLE1BQXpCLEVBQWlDLFVBQUMsQ0FBRCxFQUFJLEdBQUosRUFBWTtBQUMzQyxrQkFBSyxNQUFMLEVBQWEsTUFBSyxTQUFMLENBQWUsTUFBZixFQUF1QixDQUF2QixFQUEwQixHQUExQixDQUFiLEVBRDJDO1dBQVosRUFFOUIsS0FGSCxFQUR3RDtTQUFWLENBQWhELENBRG1CO09BQXJCOztBQVFBLFVBQUksSUFBSSxjQUFKLEVBQW9CO0FBQ3RCLFNBQUMsU0FBRCxFQUFZLE9BQVosRUFBcUIsT0FBckIsQ0FBNkIsa0JBQVU7QUFDckMsbUJBQVMsZ0JBQVQsQ0FBMEIsTUFBMUIsRUFBa0MsVUFBQyxDQUFELEVBQUksR0FBSixFQUFZO0FBQzVDLGtCQUFLLE1BQUwsRUFBYSxNQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXVCLENBQXZCLEVBQTBCLEdBQTFCLENBQWIsRUFENEM7V0FBWixFQUUvQixLQUZILEVBRHFDO1NBQVYsQ0FBN0IsQ0FEc0I7T0FBeEI7Ozs7OEJBU1EsTUFBTSxHQUFHLEtBQUs7QUFDdEIsVUFBTSxVQUFVLEtBQUssT0FBTCxDQURNO0FBRXRCLFVBQU0sUUFBUSxLQUFLLEtBQUwsQ0FGUTtBQUd0QixVQUFNLE1BQU0sS0FBSyxHQUFMLENBSFU7QUFJdEIsVUFBTSxPQUFPLEtBQUssT0FBTCxFQUFQLENBSmdCO0FBS3RCLFVBQU0sV0FBVyxJQUFJLFFBQUosQ0FMSztBQU10QixVQUFNLGVBQWUsSUFBSSxZQUFKLENBTkM7QUFPdEIsVUFBTSxNQUFNLElBQUksYUFBSixJQUFxQixLQUFLLEdBQUwsSUFBWSxRQUFRLE9BQVIsQ0FBakMsQ0FQVTtBQVF0QixVQUFNLEtBQUssSUFBSSxDQUFKLEVBQU8sR0FBUCxDQUFMLENBUmdCO0FBU3RCLFVBQU0sT0FBTyxPQUFPLENBQVAsRUFBVSxHQUFWLENBQVAsQ0FUZ0I7QUFVdEIsVUFBTSxVQUFVLEVBQUMsR0FBRyxLQUFLLENBQUwsRUFBUSxDQUFSLEVBQVcsR0FBRyxLQUFLLENBQUwsRUFBUSxDQUFSLEVBQTVCLENBVmdCO0FBV3RCLFVBQU0sTUFBTSxFQUFOLENBWGdCO0FBWXRCLFVBQUksVUFBSixDQVpzQjtBQWF0QixVQUFJLFVBQUo7OztBQWJzQixXQWdCakIsSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLEtBQUssTUFBTCxFQUFhLElBQUksQ0FBSixFQUFPLEVBQUUsQ0FBRixFQUFLO0FBQzNDLFlBQUksS0FBSyxDQUFMLEVBQVEsQ0FBUixDQUR1QztBQUUzQyxZQUFJLEtBQUssQ0FBTCxFQUFRLENBQVIsQ0FGdUM7QUFHM0MsWUFBSSxRQUFKLEVBQWM7QUFDWixlQUFLLElBQUksQ0FBSixDQURPLENBQ0EsSUFBSyxJQUFJLENBQUosQ0FETDtBQUVaLGNBQUksWUFBSixFQUFrQjtBQUNoQixpQkFBSyxLQUFLLEtBQUwsR0FBYSxDQUFiLENBRFc7QUFFaEIsaUJBQUssS0FBSyxNQUFMLEdBQWMsQ0FBZDs7QUFGVyxhQUloQixJQUFLLENBQUMsQ0FBRCxDQUpXO1dBQWxCO1NBRkY7QUFTQSxhQUFLLENBQUwsRUFBUSxDQUFSLEdBQVksQ0FBWixDQVoyQztBQWEzQyxhQUFLLENBQUwsRUFBUSxDQUFSLEdBQVksQ0FBWixDQWIyQztPQUE3Qzs7QUFnQkEsY0FBUSxJQUFSO0FBQ0EsYUFBSyxZQUFMO0FBQ0UsY0FBSSxLQUFKLEdBQVksU0FBUyxFQUFULENBQVosQ0FERjtBQUVFLGdCQUZGO0FBREEsYUFJSyxTQUFMLENBSkE7QUFLQSxhQUFLLE9BQUw7QUFDRSxpQkFBTyxNQUFQLENBQWMsR0FBZCxFQUFtQixPQUFPLEVBQVAsQ0FBbkIsRUFERjtBQUVFLGdCQUZGO0FBTEEsYUFRSyxTQUFMO0FBQ0UsY0FBSSxZQUFKLEdBQW1CLGFBQWEsRUFBYixDQUFuQixDQURGO0FBRUUsZ0JBRkY7QUFSQTtBQVlFLGdCQURGO0FBWEEsT0FoQ3NCOztBQStDdEIsVUFBSSxXQUFKLENBL0NzQjs7QUFpRHRCLGFBQU8sTUFBUCxDQUFjLEdBQWQsRUFBbUI7QUFDakIsV0FBRyxLQUFLLENBQUwsRUFBUSxDQUFSO0FBQ0gsV0FBRyxLQUFLLENBQUwsRUFBUSxDQUFSO0FBQ0gsa0JBQVUsSUFBVjs7QUFFQSxlQUFPLEtBQVA7O0FBRUEsOEJBQU87QUFDTCxnQkFBSyxFQUFMLEVBREs7U0FQVTs7O0FBV2pCLHdDQUFZO0FBQ1YsY0FBSSxXQUFKLEVBQWlCO0FBQ2YsbUJBQU8sV0FBUCxDQURlO1dBQWpCO0FBR0EsaUJBQVEsY0FBYyxJQUFJLE9BQUosSUFDcEIsTUFBTSxJQUFOLENBQVcsUUFBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEVBQU8sUUFBUSxDQUFSLEdBQVksSUFBSSxDQUFKLENBRHRCLElBQ2dDLElBRGhDLENBSlo7U0FYSztPQUFuQjs7QUFqRHNCLFNBcUV0QixDQUFJLEtBQUosR0FBWSxFQUFaLENBckVzQjs7QUF1RXRCLGFBQU8sR0FBUCxDQXZFc0I7Ozs7OEJBMEVkO0FBQ1IsVUFBSSxLQUFLLFNBQUwsRUFBZ0I7QUFDbEIsZUFBTyxLQUFLLElBQUwsQ0FEVztPQUFwQjtBQUdBLFVBQUksVUFBVSxLQUFLLE9BQUwsQ0FKTjtBQUtSLGFBQU87QUFDTCxlQUFPLFFBQVEsS0FBUixJQUFpQixRQUFRLFdBQVI7QUFDeEIsZ0JBQVEsUUFBUSxNQUFSLElBQWtCLFFBQVEsWUFBUjtPQUY1QixDQUxROzs7OzRCQVdGLEdBQUc7QUFDVCxVQUFJLENBQUMsS0FBSyxLQUFMLEVBQVk7QUFDZixZQUFJLEVBQUUsWUFBRixFQUFnQjtBQUNsQixlQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCLENBQTVCLEVBQStCLEtBQUssT0FBTCxDQUEvQixDQURrQjtTQUFwQixNQUVPO0FBQ0wsZUFBSyxTQUFMLENBQWUsT0FBZixDQUF1QixDQUF2QixFQUEwQixNQUFNLEtBQUssT0FBTCxDQUFoQyxFQURLO1NBRlA7T0FERjtBQU9BLFVBQUksS0FBSyxPQUFMLEVBQWM7QUFDaEIsWUFBSSxLQUFLLEtBQUwsRUFBWTtBQUNkLGVBQUssU0FBTCxDQUFlLFNBQWYsQ0FBeUIsQ0FBekIsRUFBNEIsTUFBTSxLQUFLLE9BQUwsQ0FBbEMsRUFEYztTQUFoQixNQUVPO0FBQ0wsZUFBSyxTQUFMLENBQWUsWUFBZixDQUE0QixDQUE1QixFQUErQixNQUFNLEtBQUssT0FBTCxDQUFyQyxFQURLO1NBRlA7QUFLQSxhQUFLLE9BQUwsR0FBZSxLQUFLLEtBQUwsR0FBYSxLQUFiLENBTkM7T0FBbEI7Ozs7NkJBVU8sR0FBRzs7QUFFVixVQUFJLEtBQUssRUFBRSxhQUFGLENBRkM7QUFHVixVQUFNLFVBQVUsS0FBSyxPQUFMLENBSE47QUFJVixhQUFPLE1BQU0sR0FBRyxVQUFILEVBQWU7QUFDMUIsWUFBSSxZQUFZLEdBQUcsVUFBSCxFQUFlO0FBQzdCLGlCQUQ2QjtTQUEvQjtBQUdBLGFBQUssR0FBRyxVQUFILENBSnFCO09BQTVCO0FBTUEsVUFBSSxLQUFLLE9BQUwsRUFBYztBQUNoQixhQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCLENBQTVCLEVBQStCLEtBQUssT0FBTCxDQUEvQixDQURnQjtBQUVoQixhQUFLLE9BQUwsR0FBZSxLQUFmLENBRmdCO09BQWxCO0FBSUEsVUFBSSxLQUFLLE9BQUwsSUFBZ0IsS0FBSyxLQUFMLEVBQVk7QUFDOUIsYUFBSyxTQUFMLENBQWUsU0FBZixDQUF5QixDQUF6QixFQUQ4QjtBQUU5QixhQUFLLE9BQUwsR0FBZSxLQUFLLEtBQUwsR0FBYSxLQUFiLENBRmU7T0FBaEM7Ozs7OEJBTVEsR0FBRzs7OzhCQUdILEdBQUc7QUFDWCxVQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2hCLGFBQUssS0FBTCxHQUFhLElBQWIsQ0FEZ0I7QUFFaEIsYUFBSyxTQUFMLENBQWUsVUFBZixDQUEwQixDQUExQixFQUE2QixNQUFNLEtBQUssT0FBTCxDQUFuQyxFQUZnQjtBQUdoQixlQUhnQjtPQUFsQjtBQUtBLFVBQUksS0FBSyxPQUFMLEVBQWM7QUFDaEIsWUFBSSxTQUFTLE1BQU0sRUFBRSxTQUFGLEVBQU4sQ0FBVCxDQURZO0FBRWhCLFlBQUksQ0FBQyxNQUFELElBQVcsT0FBTyxJQUFQLEtBQWdCLEtBQUssSUFBTCxFQUFXO0FBQ3hDLGVBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEIsQ0FBNUIsRUFBK0IsS0FBSyxPQUFMLENBQS9CLENBRHdDO0FBRXhDLGVBQUssT0FBTCxHQUFlLE1BQWYsQ0FGd0M7QUFHeEMsZUFBSyxJQUFMLEdBQVksTUFBWixDQUh3QztBQUl4QyxjQUFJLE1BQUosRUFBWTtBQUNWLGlCQUFLLElBQUwsR0FBWSxPQUFPLElBQVAsQ0FERjtBQUVWLGlCQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCLENBQTVCLEVBQStCLEtBQUssT0FBTCxDQUEvQixDQUZVO1dBQVo7U0FKRixNQVFPO0FBQ0wsZUFBSyxTQUFMLENBQWUsV0FBZixDQUEyQixDQUEzQixFQUE4QixLQUFLLE9BQUwsQ0FBOUIsQ0FESztTQVJQO09BRkYsTUFhTztBQUNMLGFBQUssT0FBTCxHQUFlLE1BQU0sRUFBRSxTQUFGLEVBQU4sQ0FBZixDQURLO0FBRUwsYUFBSyxJQUFMLEdBQVksS0FBSyxPQUFMLENBRlA7QUFHTCxZQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2hCLGVBQUssSUFBTCxHQUFZLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FESTtBQUVoQixlQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCLENBQTVCLEVBQStCLEtBQUssT0FBTCxDQUEvQixDQUZnQjtTQUFsQjtPQWhCRjtBQXFCQSxVQUFJLENBQUMsS0FBSyxHQUFMLENBQVMsT0FBVCxFQUFrQjtBQUNyQixhQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCLENBQTNCLEVBRHFCO09BQXZCOzs7OytCQUtTLEdBQUc7QUFDWixXQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCLENBQTVCLEVBRFk7Ozs7OEJBSUosR0FBRztBQUNYLFdBQUssT0FBTCxHQUFlLEVBQUUsU0FBRixFQUFmLENBRFc7QUFFWCxXQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCLENBQTNCLEVBQThCLE1BQU0sS0FBSyxPQUFMLENBQXBDLEVBRlc7Ozs7K0JBS0YsR0FBRztBQUNaLFdBQUssT0FBTCxHQUFlLEVBQUUsU0FBRixFQUFmLENBRFk7QUFFWixXQUFLLG1CQUFMLEdBQTJCLEVBQUMsR0FBRyxFQUFFLENBQUYsRUFBSyxHQUFHLEVBQUUsQ0FBRixFQUF2QyxDQUZZO0FBR1osV0FBSyxTQUFMLENBQWUsWUFBZixDQUE0QixDQUE1QixFQUErQixNQUFNLEtBQUssT0FBTCxDQUFyQyxFQUhZOzs7OzhCQU1KLEdBQUc7QUFDWCxVQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2hCLGFBQUssVUFBTCxHQUFrQixJQUFsQixDQURnQjtBQUVoQixhQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCLENBQTNCLEVBQThCLE1BQU0sS0FBSyxPQUFMLENBQXBDLEVBRmdCO09BQWxCOzs7OzZCQU1PLEdBQUc7QUFDVixVQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2hCLFlBQUksS0FBSyxVQUFMLEVBQWlCO0FBQ25CLGVBQUssU0FBTCxDQUFlLFVBQWYsQ0FBMEIsQ0FBMUIsRUFBNkIsTUFBTSxLQUFLLE9BQUwsQ0FBbkMsRUFEbUI7U0FBckIsTUFFTztBQUNMLFlBQUUsQ0FBRixHQUFNLE1BQU0sRUFBRSxDQUFGLENBQU4sR0FBYSxLQUFLLG1CQUFMLENBQXlCLENBQXpCLEdBQTZCLEVBQUUsQ0FBRixDQUQzQztBQUVMLFlBQUUsQ0FBRixHQUFNLE1BQU0sRUFBRSxDQUFGLENBQU4sR0FBYSxLQUFLLG1CQUFMLENBQXlCLENBQXpCLEdBQTZCLEVBQUUsQ0FBRixDQUYzQztBQUdMLGVBQUssU0FBTCxDQUFlLEtBQWYsQ0FBcUIsQ0FBckIsRUFBd0IsTUFBTSxLQUFLLE9BQUwsQ0FBOUIsRUFISztBQUlMLGVBQUssU0FBTCxDQUFlLGFBQWYsQ0FBNkIsQ0FBN0IsRUFBZ0MsTUFBTSxLQUFLLE9BQUwsQ0FBdEMsRUFKSztTQUZQO0FBUUEsYUFBSyxPQUFMLEdBQWUsS0FBSyxVQUFMLEdBQWtCLEtBQWxCLENBVEM7T0FBbEI7Ozs7NEJBYU0sR0FBRztBQUNULFdBQUssU0FBTCxDQUFlLFNBQWYsQ0FBeUIsQ0FBekIsRUFEUzs7OzswQkFJTCxHQUFHO0FBQ1AsV0FBSyxTQUFMLENBQWUsT0FBZixDQUF1QixDQUF2QixFQURPOzs7O1NBblFFOzs7QUF3UWIsT0FBTyxNQUFQLENBQWMsWUFBWSxTQUFaLEVBQXVCO0FBQ25DLFdBQVMsS0FBVDtBQUNBLFdBQVMsS0FBVDtBQUNBLFdBQVMsS0FBVDtBQUNBLHVCQUFxQixFQUFDLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUE1QjtBQUNBLGNBQVksS0FBWjtBQUNBLFNBQU8sS0FBUDtDQU5GOztBQVNPLElBQU0sMEJBQVM7QUFFcEIsMEJBQU8sSUFBYztRQUFWLDREQUFNLGtCQUFJOzs7QUFFbkI7QUFDRSxxQkFBZSxJQUFmO0FBQ0EsaUJBQVcsSUFBWDtBQUNBLGdCQUFVLElBQVY7QUFDQSxvQkFBYyxJQUFkO0FBQ0EsMEJBQW9CLElBQXBCO0FBQ0EsWUFBTSxLQUFOO0FBQ0EsZUFBUyxLQUFUOztBQUVBLG1CQUFhLElBQWI7QUFDQSxtQkFBYSxJQUFiO0FBQ0Esc0JBQWdCLElBQWhCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7T0FDRyxJQTlCTCxDQUZtQjs7QUFtQ25CLFFBQUksT0FBTyxJQUFJLElBQUosQ0FuQ1E7QUFvQ25CLFFBQUksSUFBSixFQUFVO0FBQ1IsV0FBSyxJQUFNLElBQU4sSUFBYyxHQUFuQixFQUF3QjtBQUN0QixZQUFJLEtBQUssS0FBTCxDQUFXLGtCQUFYLENBQUosRUFBb0M7QUFDbEMsV0FBQyxVQUFDLEtBQUQsRUFBUSxFQUFSLEVBQWU7QUFDZCxnQkFBSSxLQUFKLElBQWEsWUFBVztBQUN0QixpQkFBRyxLQUFILENBQVMsSUFBVCxFQUFlLE1BQU0sU0FBTixDQUFnQixLQUFoQixDQUFzQixJQUF0QixDQUEyQixTQUEzQixDQUFmLEVBRHNCO2FBQVgsQ0FEQztXQUFmLENBQUQsQ0FJRyxJQUpILEVBSVMsSUFBSSxJQUFKLENBSlQsRUFEa0M7U0FBcEM7T0FERjtLQURGOztBQVlBLFdBQU8sSUFBSSxXQUFKLENBQWdCLEVBQWhCLEVBQW9CLEdBQXBCLENBQVAsQ0FoRG1CO0dBRkQ7Q0FBVDs7QUF1RGIsT0FBTyxJQUFQLEdBQWMsSUFBZDs7QUFFQSxTQUFTLEtBQVQsQ0FBZSxJQUFmLEVBQXFCO0FBQ25CLE1BQUksU0FBUyxPQUFPLElBQVAsQ0FETTtBQUVuQixPQUFLLElBQUksSUFBSixJQUFZLE1BQWpCLEVBQXlCO0FBQ3ZCLFFBQUksT0FBTyxJQUFQLE1BQWlCLElBQWpCLEVBQXVCO0FBQ3pCLGFBQU8sSUFBUCxDQUR5QjtLQUEzQjtHQURGO0NBRkYiLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBldmVudC5qc1xuLy8gSGFuZGxlIGtleWJvYXJkL21vdXNlL3RvdWNoIGV2ZW50cyBpbiB0aGUgQ2FudmFzXG4vLyBUT0RPIC0gdGhpcyB3aWxsIG5vdCB3b3JrIHVuZGVyIG5vZGVcblxuLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uLCBtYXgtc3RhdGVtZW50cywgbm8tbG9vcC1mdW5jICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCAqL1xuaW1wb3J0IHtub29wfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgS0VZUyA9IHtcbiAgJ2VudGVyJzogMTMsXG4gICd1cCc6IDM4LFxuICAnZG93bic6IDQwLFxuICAnbGVmdCc6IDM3LFxuICAncmlnaHQnOiAzOSxcbiAgJ2VzYyc6IDI3LFxuICAnc3BhY2UnOiAzMixcbiAgJ2JhY2tzcGFjZSc6IDgsXG4gICd0YWInOiA5LFxuICAnZGVsZXRlJzogNDZcbn07XG5cbi8vIHJldHVybnMgYW4gTzNEIG9iamVjdCBvciBmYWxzZSBvdGhlcndpc2UuXG5mdW5jdGlvbiB0b08zRChuKSB7XG4gIHJldHVybiBuICE9PSB0cnVlID8gbiA6IGZhbHNlO1xufVxuXG4vLyBSZXR1cm5zIGFuIGVsZW1lbnQgcG9zaXRpb25cbmZ1bmN0aW9uIF9nZXRQb3MoZWxlbSkge1xuICBjb25zdCBiYm94ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHtcbiAgICB4OiBiYm94LmxlZnQsXG4gICAgeTogYmJveC50b3AsXG4gICAgYmJveDogYmJveFxuICB9O1xufVxuXG4vLyBldmVudCBvYmplY3Qgd3JhcHBlclxuZXhwb3J0IGZ1bmN0aW9uIGdldChlLCB3aW4pIHtcbiAgd2luID0gd2luIHx8IHdpbmRvdztcbiAgcmV0dXJuIGUgfHwgd2luLmV2ZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2hlZWwoZSkge1xuICByZXR1cm4gZS53aGVlbERlbHRhID8gZS53aGVlbERlbHRhIC8gMTIwIDogLShlLmRldGFpbCB8fCAwKSAvIDM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRLZXkoZSkge1xuICBjb25zdCBjb2RlID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gIGxldCBrZXkgPSBrZXlPZihjb2RlKTtcbiAgLy8gb25rZXlkb3duXG4gIHZhciBmS2V5ID0gY29kZSAtIDExMTtcbiAgaWYgKGZLZXkgPiAwICYmIGZLZXkgPCAxMykge1xuICAgIGtleSA9ICdmJyArIGZLZXk7XG4gIH1cbiAga2V5ID0ga2V5IHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkudG9Mb3dlckNhc2UoKTtcblxuICByZXR1cm4ge1xuICAgIGNvZGU6IGNvZGUsXG4gICAga2V5OiBrZXksXG4gICAgc2hpZnQ6IGUuc2hpZnRLZXksXG4gICAgY29udHJvbDogZS5jdHJsS2V5LFxuICAgIGFsdDogZS5hbHRLZXksXG4gICAgbWV0YTogZS5tZXRhS2V5XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1JpZ2h0Q2xpY2soZSkge1xuICByZXR1cm4gZS53aGljaCA9PT0gMyB8fCBlLmJ1dHRvbiA9PT0gMjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcyhlLCB3aW4pIHtcbiAgLy8gZ2V0IG1vdXNlIHBvc2l0aW9uXG4gIHdpbiA9IHdpbiB8fCB3aW5kb3c7XG4gIGUgPSBlIHx8IHdpbi5ldmVudDtcbiAgbGV0IGRvYyA9IHdpbi5kb2N1bWVudDtcbiAgZG9jID0gZG9jLmRvY3VtZW50RWxlbWVudCB8fCBkb2MuYm9keTtcbiAgLy8gVE9ETyhuaWNvKTogbWFrZSB0b3VjaCBldmVudCBoYW5kbGluZyBiZXR0ZXJcbiAgaWYgKGUudG91Y2hlcyAmJiBlLnRvdWNoZXMubGVuZ3RoKSB7XG4gICAgY29uc3QgdG91Y2hlc1BvcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZS50b3VjaGVzLmxlbmd0aCwgZXZ0OyBpIDwgbDsgKytpKSB7XG4gICAgICBldnQgPSBlLnRvdWNoZXNbaV07XG4gICAgICB0b3VjaGVzUG9zLnB1c2goe1xuICAgICAgICB4OiBldnQucGFnZVggfHwgKGV2dC5jbGllbnRYICsgZG9jLnNjcm9sbExlZnQpLFxuICAgICAgICB5OiBldnQucGFnZVkgfHwgKGV2dC5jbGllbnRZICsgZG9jLnNjcm9sbFRvcClcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdG91Y2hlc1BvcztcbiAgfVxuICB2YXIgcGFnZSA9IHtcbiAgICB4OiBlLnBhZ2VYIHx8IChlLmNsaWVudFggKyBkb2Muc2Nyb2xsTGVmdCksXG4gICAgeTogZS5wYWdlWSB8fCAoZS5jbGllbnRZICsgZG9jLnNjcm9sbFRvcClcbiAgfTtcbiAgcmV0dXJuIFtwYWdlXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3AoZSkge1xuICBpZiAoZS5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG4gIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0gZWxzZSB7XG4gICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFdmVudHNQcm94eSB7XG5cbiAgY29uc3RydWN0b3IoZG9tRWxlbSwgb3B0KSB7XG4gICAgdGhpcy5zY2VuZSA9IG9wdC5zY2VuZTtcbiAgICB0aGlzLmRvbUVsZW0gPSBkb21FbGVtO1xuICAgIHRoaXMucG9zID0gX2dldFBvcyhkb21FbGVtKTtcbiAgICB0aGlzLm9wdCA9IHRoaXMuY2FsbGJhY2tzID0gb3B0O1xuXG4gICAgdGhpcy5zaXplID0ge1xuICAgICAgd2lkdGg6IGRvbUVsZW0ud2lkdGggfHwgZG9tRWxlbS5vZmZzZXRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9tRWxlbS5oZWlnaHQgfHwgZG9tRWxlbS5vZmZzZXRIZWlnaHRcbiAgICB9O1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudHMoKTtcbiAgfVxuXG4gIGF0dGFjaEV2ZW50cygpIHtcbiAgICBjb25zdCBkb21FbGVtID0gdGhpcy5kb21FbGVtO1xuICAgIGNvbnN0IG9wdCA9IHRoaXMub3B0O1xuXG4gICAgaWYgKG9wdC5kaXNhYmxlQ29udGV4dE1lbnUpIHtcbiAgICAgIGRvbUVsZW0ub25jb250ZXh0bWVudSA9ICgpID0+IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChvcHQuZW5hYmxlTW91c2UpIHtcbiAgICAgIFsnbW91c2V1cCcsICdtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3ZlcicsICdtb3VzZW91dCddXG4gICAgICAuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICBkb21FbGVtLmFkZEV2ZW50TGlzdGVuZXIoYWN0aW9uLCAoZSwgd2luKSA9PiB7XG4gICAgICAgICAgdGhpc1thY3Rpb25dKHRoaXMuZXZlbnRJbmZvKGFjdGlvbiwgZSwgd2luKSk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBcIndlbGwsIHRoaXMgaXMgZW1iYXJyYXNzaW5nLi4uXCJcbiAgICAgIGxldCB0eXBlID0gJyc7XG4gICAgICBpZiAoIWRvY3VtZW50LmdldEJveE9iamVjdEZvciAmJiB3aW5kb3cubW96SW5uZXJTY3JlZW5YID09PSBudWxsKSB7XG4gICAgICAgIHR5cGUgPSAnbW91c2V3aGVlbCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eXBlID0gJ0RPTU1vdXNlU2Nyb2xsJztcbiAgICAgIH1cbiAgICAgIGRvbUVsZW0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZSwgd2luKSA9PiB7XG4gICAgICAgIHRoaXNbJ21vdXNld2hlZWwnXSh0aGlzLmV2ZW50SW5mbygnbW91c2V3aGVlbCcsIGUsIHdpbikpO1xuICAgICAgfSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGlmIChvcHQuZW5hYmxlVG91Y2gpIHtcbiAgICAgIFsndG91Y2hzdGFydCcsICd0b3VjaG1vdmUnLCAndG91Y2hlbmQnXS5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgIGRvbUVsZW0uYWRkRXZlbnRMaXN0ZW5lcihhY3Rpb24sIChlLCB3aW4pID0+IHtcbiAgICAgICAgICB0aGlzW2FjdGlvbl0odGhpcy5ldmVudEluZm8oYWN0aW9uLCBlLCB3aW4pKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdC5lbmFibGVLZXlib2FyZCkge1xuICAgICAgWydrZXlkb3duJywgJ2tleXVwJ10uZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGFjdGlvbiwgKGUsIHdpbikgPT4ge1xuICAgICAgICAgIHRoaXNbYWN0aW9uXSh0aGlzLmV2ZW50SW5mbyhhY3Rpb24sIGUsIHdpbikpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBldmVudEluZm8odHlwZSwgZSwgd2luKSB7XG4gICAgY29uc3QgZG9tRWxlbSA9IHRoaXMuZG9tRWxlbTtcbiAgICBjb25zdCBzY2VuZSA9IHRoaXMuc2NlbmU7XG4gICAgY29uc3Qgb3B0ID0gdGhpcy5vcHQ7XG4gICAgY29uc3Qgc2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpO1xuICAgIGNvbnN0IHJlbGF0aXZlID0gb3B0LnJlbGF0aXZlO1xuICAgIGNvbnN0IGNlbnRlck9yaWdpbiA9IG9wdC5jZW50ZXJPcmlnaW47XG4gICAgY29uc3QgcG9zID0gb3B0LmNhY2hlUG9zaXRpb24gJiYgdGhpcy5wb3MgfHwgX2dldFBvcyhkb21FbGVtKTtcbiAgICBjb25zdCBnZSA9IGdldChlLCB3aW4pO1xuICAgIGNvbnN0IGVwb3MgPSBnZXRQb3MoZSwgd2luKTtcbiAgICBjb25zdCBvcmlnUG9zID0ge3g6IGVwb3NbMF0ueCwgeTogZXBvc1swXS55fTtcbiAgICBjb25zdCBldnQgPSB7fTtcbiAgICBsZXQgeDtcbiAgICBsZXQgeTtcblxuICAgIC8vIGdldCBQb3NpdGlvblxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gZXBvcy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgIHggPSBlcG9zW2ldLng7XG4gICAgICB5ID0gZXBvc1tpXS55O1xuICAgICAgaWYgKHJlbGF0aXZlKSB7XG4gICAgICAgIHggLT0gcG9zLng7IHkgLT0gcG9zLnk7XG4gICAgICAgIGlmIChjZW50ZXJPcmlnaW4pIHtcbiAgICAgICAgICB4IC09IHNpemUud2lkdGggLyAyO1xuICAgICAgICAgIHkgLT0gc2l6ZS5oZWlnaHQgLyAyO1xuICAgICAgICAgIC8vIHkgYXhpcyBub3cgcG9pbnRzIHRvIHRoZSB0b3Agb2YgdGhlIHNjcmVlblxuICAgICAgICAgIHkgKj0gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVwb3NbaV0ueCA9IHg7XG4gICAgICBlcG9zW2ldLnkgPSB5O1xuICAgIH1cblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ21vdXNld2hlZWwnOlxuICAgICAgZXZ0LndoZWVsID0gZ2V0V2hlZWwoZ2UpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAna2V5ZG93bic6XG4gICAgY2FzZSAna2V5dXAnOlxuICAgICAgT2JqZWN0LmFzc2lnbihldnQsIGdldEtleShnZSkpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbW91c2V1cCc6XG4gICAgICBldnQuaXNSaWdodENsaWNrID0gaXNSaWdodENsaWNrKGdlKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgY2FjaGVUYXJnZXQ7XG5cbiAgICBPYmplY3QuYXNzaWduKGV2dCwge1xuICAgICAgeDogZXBvc1swXS54LFxuICAgICAgeTogZXBvc1swXS55LFxuICAgICAgcG9zQXJyYXk6IGVwb3MsXG5cbiAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgIC8vIHN0b3AgZXZlbnQgcHJvcGFnYXRpb25cbiAgICAgIHN0b3AoKSB7XG4gICAgICAgIHN0b3AoZ2UpO1xuICAgICAgfSxcbiAgICAgIC8vIGdldCB0aGUgdGFyZ2V0IGVsZW1lbnQgb2YgdGhlIGV2ZW50XG4gICAgICBnZXRUYXJnZXQoKSB7XG4gICAgICAgIGlmIChjYWNoZVRhcmdldCkge1xuICAgICAgICAgIHJldHVybiBjYWNoZVRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGNhY2hlVGFyZ2V0ID0gb3B0LnBpY2tpbmcgJiZcbiAgICAgICAgICBzY2VuZS5waWNrKG9yaWdQb3MueCAtIHBvcy54LCBvcmlnUG9zLnkgLSBwb3MueSkgfHwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gd3JhcCBuYXRpdmUgZXZlbnRcbiAgICBldnQuZXZlbnQgPSBnZTtcblxuICAgIHJldHVybiBldnQ7XG4gIH1cblxuICBnZXRTaXplKCkge1xuICAgIGlmICh0aGlzLmNhY2hlU2l6ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICB9XG4gICAgdmFyIGRvbUVsZW0gPSB0aGlzLmRvbUVsZW07XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiBkb21FbGVtLndpZHRoIHx8IGRvbUVsZW0ub2Zmc2V0V2lkdGgsXG4gICAgICBoZWlnaHQ6IGRvbUVsZW0uaGVpZ2h0IHx8IGRvbUVsZW0ub2Zmc2V0SGVpZ2h0XG4gICAgfTtcbiAgfVxuXG4gIG1vdXNldXAoZSkge1xuICAgIGlmICghdGhpcy5tb3ZlZCkge1xuICAgICAgaWYgKGUuaXNSaWdodENsaWNrKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uUmlnaHRDbGljayhlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25DbGljayhlLCB0b08zRCh0aGlzLnByZXNzZWQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMucHJlc3NlZCkge1xuICAgICAgaWYgKHRoaXMubW92ZWQpIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnRW5kKGUsIHRvTzNEKHRoaXMucHJlc3NlZCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnQ2FuY2VsKGUsIHRvTzNEKHRoaXMucHJlc3NlZCkpO1xuICAgICAgfVxuICAgICAgdGhpcy5wcmVzc2VkID0gdGhpcy5tb3ZlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG1vdXNlb3V0KGUpIHtcbiAgICAvLyBtb3VzZW91dCBjYW52YXNcbiAgICBsZXQgcnQgPSBlLnJlbGF0ZWRUYXJnZXQ7XG4gICAgY29uc3QgZG9tRWxlbSA9IHRoaXMuZG9tRWxlbTtcbiAgICB3aGlsZSAocnQgJiYgcnQucGFyZW50Tm9kZSkge1xuICAgICAgaWYgKGRvbUVsZW0gPT09IHJ0LnBhcmVudE5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcnQgPSBydC5wYXJlbnROb2RlO1xuICAgIH1cbiAgICBpZiAodGhpcy5ob3ZlcmVkKSB7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlTGVhdmUoZSwgdGhpcy5ob3ZlcmVkKTtcbiAgICAgIHRoaXMuaG92ZXJlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcmVzc2VkICYmIHRoaXMubW92ZWQpIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uRHJhZ0VuZChlKTtcbiAgICAgIHRoaXMucHJlc3NlZCA9IHRoaXMubW92ZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBtb3VzZW92ZXIoZSkge1xuICB9XG5cbiAgbW91c2Vtb3ZlKGUpIHtcbiAgICBpZiAodGhpcy5wcmVzc2VkKSB7XG4gICAgICB0aGlzLm1vdmVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uRHJhZ01vdmUoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmhvdmVyZWQpIHtcbiAgICAgIHZhciB0YXJnZXQgPSB0b08zRChlLmdldFRhcmdldCgpKTtcbiAgICAgIGlmICghdGFyZ2V0IHx8IHRhcmdldC5oYXNoICE9PSB0aGlzLmhhc2gpIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25Nb3VzZUxlYXZlKGUsIHRoaXMuaG92ZXJlZCk7XG4gICAgICAgIHRoaXMuaG92ZXJlZCA9IHRhcmdldDtcbiAgICAgICAgdGhpcy5oYXNoID0gdGFyZ2V0O1xuICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgdGhpcy5oYXNoID0gdGFyZ2V0Lmhhc2g7XG4gICAgICAgICAgdGhpcy5jYWxsYmFja3Mub25Nb3VzZUVudGVyKGUsIHRoaXMuaG92ZXJlZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VNb3ZlKGUsIHRoaXMuaG92ZXJlZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaG92ZXJlZCA9IHRvTzNEKGUuZ2V0VGFyZ2V0KCkpO1xuICAgICAgdGhpcy5oYXNoID0gdGhpcy5ob3ZlcmVkO1xuICAgICAgaWYgKHRoaXMuaG92ZXJlZCkge1xuICAgICAgICB0aGlzLmhhc2ggPSB0aGlzLmhvdmVyZWQuaGFzaDtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25Nb3VzZUVudGVyKGUsIHRoaXMuaG92ZXJlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHQucGlja2luZykge1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25Nb3VzZU1vdmUoZSk7XG4gICAgfVxuICB9XG5cbiAgbW91c2V3aGVlbChlKSB7XG4gICAgdGhpcy5jYWxsYmFja3Mub25Nb3VzZVdoZWVsKGUpO1xuICB9XG5cbiAgbW91c2Vkb3duKGUpIHtcbiAgICB0aGlzLnByZXNzZWQgPSBlLmdldFRhcmdldCgpO1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uRHJhZ1N0YXJ0KGUsIHRvTzNEKHRoaXMucHJlc3NlZCkpO1xuICB9XG5cbiAgdG91Y2hzdGFydChlKSB7XG4gICAgdGhpcy50b3VjaGVkID0gZS5nZXRUYXJnZXQoKTtcbiAgICB0aGlzLnRvdWNoZWRMYXN0UG9zaXRpb24gPSB7eDogZS54LCB5OiBlLnl9O1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uVG91Y2hTdGFydChlLCB0b08zRCh0aGlzLnRvdWNoZWQpKTtcbiAgfVxuXG4gIHRvdWNobW92ZShlKSB7XG4gICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgdGhpcy50b3VjaE1vdmVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uVG91Y2hNb3ZlKGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICAgIH1cbiAgfVxuXG4gIHRvdWNoZW5kKGUpIHtcbiAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICBpZiAodGhpcy50b3VjaE1vdmVkKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uVG91Y2hFbmQoZSwgdG9PM0QodGhpcy50b3VjaGVkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlLnggPSBpc05hTihlLngpID8gdGhpcy50b3VjaGVkTGFzdFBvc2l0aW9uLnggOiBlLng7XG4gICAgICAgIGUueSA9IGlzTmFOKGUueSkgPyB0aGlzLnRvdWNoZWRMYXN0UG9zaXRpb24ueSA6IGUueTtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25UYXAoZSwgdG9PM0QodGhpcy50b3VjaGVkKSk7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uVG91Y2hDYW5jZWwoZSwgdG9PM0QodGhpcy50b3VjaGVkKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnRvdWNoZWQgPSB0aGlzLnRvdWNoTW92ZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBrZXlkb3duKGUpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbktleURvd24oZSk7XG4gIH1cblxuICBrZXl1cChlKSB7XG4gICAgdGhpcy5jYWxsYmFja3Mub25LZXlVcChlKTtcbiAgfVxufVxuXG5PYmplY3QuYXNzaWduKEV2ZW50c1Byb3h5LnByb3RvdHlwZSwge1xuICBob3ZlcmVkOiBmYWxzZSxcbiAgcHJlc3NlZDogZmFsc2UsXG4gIHRvdWNoZWQ6IGZhbHNlLFxuICB0b3VjaGVkTGFzdFBvc2l0aW9uOiB7eDogMCwgeTogMH0sXG4gIHRvdWNoTW92ZWQ6IGZhbHNlLFxuICBtb3ZlZDogZmFsc2Vcbn0pO1xuXG5leHBvcnQgY29uc3QgRXZlbnRzID0ge1xuXG4gIGNyZWF0ZShnbCwgb3B0ID0ge30pIHtcblxuICAgIG9wdCA9IHtcbiAgICAgIGNhY2hlUG9zaXRpb246IHRydWUsXG4gICAgICBjYWNoZVNpemU6IHRydWUsXG4gICAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICAgIGNlbnRlck9yaWdpbjogdHJ1ZSxcbiAgICAgIGRpc2FibGVDb250ZXh0TWVudTogdHJ1ZSxcbiAgICAgIGJpbmQ6IGZhbHNlLFxuICAgICAgcGlja2luZzogZmFsc2UsXG5cbiAgICAgIGVuYWJsZVRvdWNoOiB0cnVlLFxuICAgICAgZW5hYmxlTW91c2U6IHRydWUsXG4gICAgICBlbmFibGVLZXlib2FyZDogdHJ1ZSxcblxuICAgICAgb25DbGljazogbm9vcCxcbiAgICAgIG9uUmlnaHRDbGljazogbm9vcCxcbiAgICAgIG9uRHJhZ1N0YXJ0OiBub29wLFxuICAgICAgb25EcmFnTW92ZTogbm9vcCxcbiAgICAgIG9uRHJhZ0VuZDogbm9vcCxcbiAgICAgIG9uRHJhZ0NhbmNlbDogbm9vcCxcbiAgICAgIG9uVG91Y2hTdGFydDogbm9vcCxcbiAgICAgIG9uVG91Y2hNb3ZlOiBub29wLFxuICAgICAgb25Ub3VjaEVuZDogbm9vcCxcbiAgICAgIG9uVG91Y2hDYW5jZWw6IG5vb3AsXG4gICAgICBvblRhcDogbm9vcCxcbiAgICAgIG9uTW91c2VNb3ZlOiBub29wLFxuICAgICAgb25Nb3VzZUVudGVyOiBub29wLFxuICAgICAgb25Nb3VzZUxlYXZlOiBub29wLFxuICAgICAgb25Nb3VzZVdoZWVsOiBub29wLFxuICAgICAgb25LZXlEb3duOiBub29wLFxuICAgICAgb25LZXlVcDogbm9vcCxcbiAgICAgIC4uLm9wdFxuICAgIH07XG5cbiAgICB2YXIgYmluZCA9IG9wdC5iaW5kO1xuICAgIGlmIChiaW5kKSB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gb3B0KSB7XG4gICAgICAgIGlmIChuYW1lLm1hdGNoKC9eb25bYS16QS1aMC05XSskLykpIHtcbiAgICAgICAgICAoKGZuYW1lLCBmbikgPT4ge1xuICAgICAgICAgICAgb3B0W2ZuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBmbi5hcHBseShiaW5kLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSkobmFtZSwgb3B0W25hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgRXZlbnRzUHJveHkoZ2wsIG9wdCk7XG4gIH1cblxufTtcblxuRXZlbnRzLktleXMgPSBLRVlTO1xuXG5mdW5jdGlvbiBrZXlPZihjb2RlKSB7XG4gIHZhciBrZXlNYXAgPSBFdmVudHMuS2V5cztcbiAgZm9yICh2YXIgbmFtZSBpbiBrZXlNYXApIHtcbiAgICBpZiAoa2V5TWFwW25hbWVdID09PSBjb2RlKSB7XG4gICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==