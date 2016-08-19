'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Keys = exports.EventsProxy = exports.stop = undefined;

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
exports.addEvents = addEvents;

var _utils = require('../utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KEYS = {
  enter: 13,
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  esc: 27,
  space: 32,
  backspace: 8,
  tab: 9,
  delete: 46
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
    var l = e.touches.length;
    var evt = void 0;
    for (var i = 0; i < l; ++i) {
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

      var cacheTarget = void 0;

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

function addEvents(domElement) {
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
          opt[fname] = function f() {
            fn.apply(bind, Array.prototype.slice.call(arguments));
          };
        })(name, opt[name]);
      }
    }
  }

  return new EventsProxy(domElement, opt);
}

var Keys = exports.Keys = KEYS;

function keyOf(code) {
  var keyMap = Keys;
  for (var name in keyMap) {
    if (keyMap[name] === code) {
      return name;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2V2ZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztxakJBQUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztRQWdDZ0IsRyxHQUFBLEc7UUFLQSxRLEdBQUEsUTtRQUlBLE0sR0FBQSxNO1FBb0JBLFksR0FBQSxZO1FBSUEsTSxHQUFBLE07UUF3VEEsUyxHQUFBLFM7O0FBeFhoQjs7OztBQUVBLElBQU0sT0FBTztBQUNYLFNBQU8sRUFESTtBQUVYLE1BQUksRUFGTztBQUdYLFFBQU0sRUFISztBQUlYLFFBQU0sRUFKSztBQUtYLFNBQU8sRUFMSTtBQU1YLE9BQUssRUFOTTtBQU9YLFNBQU8sRUFQSTtBQVFYLGFBQVcsQ0FSQTtBQVNYLE9BQUssQ0FUTTtBQVVYLFVBQVE7QUFWRyxDQUFiOztBQWFBO0FBQ0EsU0FBUyxLQUFULENBQWUsQ0FBZixFQUFrQjtBQUNoQixTQUFPLE1BQU0sSUFBTixHQUFhLENBQWIsR0FBaUIsS0FBeEI7QUFDRDs7QUFFRDtBQUNBLFNBQVMsT0FBVCxDQUFpQixJQUFqQixFQUF1QjtBQUNyQixNQUFNLE9BQU8sS0FBSyxxQkFBTCxFQUFiO0FBQ0EsU0FBTztBQUNMLE9BQUcsS0FBSyxJQURIO0FBRUwsT0FBRyxLQUFLLEdBRkg7QUFHTCxVQUFNO0FBSEQsR0FBUDtBQUtEOztBQUVEO0FBQ08sU0FBUyxHQUFULENBQWEsQ0FBYixFQUFnQixHQUFoQixFQUFxQjtBQUMxQixRQUFNLE9BQU8sTUFBYjtBQUNBLFNBQU8sS0FBSyxJQUFJLEtBQWhCO0FBQ0Q7O0FBRU0sU0FBUyxRQUFULENBQWtCLENBQWxCLEVBQXFCO0FBQzFCLFNBQU8sRUFBRSxVQUFGLEdBQWUsRUFBRSxVQUFGLEdBQWUsR0FBOUIsR0FBb0MsRUFBRSxFQUFFLE1BQUYsSUFBWSxDQUFkLElBQW1CLENBQTlEO0FBQ0Q7O0FBRU0sU0FBUyxNQUFULENBQWdCLENBQWhCLEVBQW1CO0FBQ3hCLE1BQU0sT0FBTyxFQUFFLEtB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O0FBNkJFO0FBN0JGLEtBOEJLLEdBOUJMOztBQWlDQSxNQUFNLE9BQU8sSUFBSSxJQUFqQjtBQUNBLE1BQUksSUFBSixFQUFVO0FBQ1IsU0FBSyxJQUFNLElBQVgsSUFBbUIsR0FBbkIsRUFBd0I7QUFDdEIsVUFBSSxLQUFLLEtBQUwsQ0FBVyxrQkFBWCxDQUFKLEVBQW9DO0FBQ2xDLFNBQUMsVUFBQyxLQUFELEVBQVEsRUFBUixFQUFlO0FBQ2QsY0FBSSxLQUFKLElBQWEsU0FBUyxDQUFULEdBQWE7QUFDeEIsZUFBRyxLQUFILENBQVMsSUFBVCxFQUFlLE1BQU0sU0FBTixDQUFnQixLQUFoQixDQUFzQixJQUF0QixDQUEyQixTQUEzQixDQUFmO0FBQ0QsV0FGRDtBQUdELFNBSkQsRUFJRyxJQUpILEVBSVMsSUFBSSxJQUFKLENBSlQ7QUFLRDtBQUNGO0FBQ0Y7O0FBRUQsU0FBTyxJQUFJLFdBQUosQ0FBZ0IsVUFBaEIsRUFBNEIsR0FBNUIsQ0FBUDtBQUNEOztBQUVNLElBQU0sc0JBQU8sSUFBYjs7QUFFUCxTQUFTLEtBQVQsQ0FBZSxJQUFmLEVBQXFCO0FBQ25CLE1BQU0sU0FBUyxJQUFmO0FBQ0EsT0FBSyxJQUFNLElBQVgsSUFBbUIsTUFBbkIsRUFBMkI7QUFDekIsUUFBSSxPQUFPLElBQVAsTUFBaUIsSUFBckIsRUFBMkI7QUFDekIsYUFBTyxJQUFQO0FBQ0Q7QUFDRjtBQUNGIiwiZmlsZSI6ImV2ZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZXZlbnQuanNcbi8vIEhhbmRsZSBrZXlib2FyZC9tb3VzZS90b3VjaCBldmVudHMgaW4gdGhlIENhbnZhc1xuLy8gVE9ETyAtIHRoaXMgd2lsbCBub3Qgd29yayB1bmRlciBub2RlXG5cbi8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiwgbWF4LXN0YXRlbWVudHMsIG5vLWxvb3AtZnVuYyAqL1xuLyogZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQgKi9cbmltcG9ydCB7bm9vcH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5jb25zdCBLRVlTID0ge1xuICBlbnRlcjogMTMsXG4gIHVwOiAzOCxcbiAgZG93bjogNDAsXG4gIGxlZnQ6IDM3LFxuICByaWdodDogMzksXG4gIGVzYzogMjcsXG4gIHNwYWNlOiAzMixcbiAgYmFja3NwYWNlOiA4LFxuICB0YWI6IDksXG4gIGRlbGV0ZTogNDZcbn07XG5cbi8vIHJldHVybnMgYW4gTzNEIG9iamVjdCBvciBmYWxzZSBvdGhlcndpc2UuXG5mdW5jdGlvbiB0b08zRChuKSB7XG4gIHJldHVybiBuICE9PSB0cnVlID8gbiA6IGZhbHNlO1xufVxuXG4vLyBSZXR1cm5zIGFuIGVsZW1lbnQgcG9zaXRpb25cbmZ1bmN0aW9uIF9nZXRQb3MoZWxlbSkge1xuICBjb25zdCBiYm94ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHtcbiAgICB4OiBiYm94LmxlZnQsXG4gICAgeTogYmJveC50b3AsXG4gICAgYmJveDogYmJveFxuICB9O1xufVxuXG4vLyBldmVudCBvYmplY3Qgd3JhcHBlclxuZXhwb3J0IGZ1bmN0aW9uIGdldChlLCB3aW4pIHtcbiAgd2luID0gd2luIHx8IHdpbmRvdztcbiAgcmV0dXJuIGUgfHwgd2luLmV2ZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2hlZWwoZSkge1xuICByZXR1cm4gZS53aGVlbERlbHRhID8gZS53aGVlbERlbHRhIC8gMTIwIDogLShlLmRldGFpbCB8fCAwKSAvIDM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRLZXkoZSkge1xuICBjb25zdCBjb2RlID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gIGxldCBrZXkgPSBrZXlPZihjb2RlKTtcbiAgLy8gb25rZXlkb3duXG4gIGNvbnN0IGZLZXkgPSBjb2RlIC0gMTExO1xuICBpZiAoZktleSA+IDAgJiYgZktleSA8IDEzKSB7XG4gICAga2V5ID0gJ2YnICsgZktleTtcbiAgfVxuICBrZXkgPSBrZXkgfHwgU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKS50b0xvd2VyQ2FzZSgpO1xuXG4gIHJldHVybiB7XG4gICAgY29kZTogY29kZSxcbiAgICBrZXk6IGtleSxcbiAgICBzaGlmdDogZS5zaGlmdEtleSxcbiAgICBjb250cm9sOiBlLmN0cmxLZXksXG4gICAgYWx0OiBlLmFsdEtleSxcbiAgICBtZXRhOiBlLm1ldGFLZXlcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmlnaHRDbGljayhlKSB7XG4gIHJldHVybiBlLndoaWNoID09PSAzIHx8IGUuYnV0dG9uID09PSAyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9zKGUsIHdpbikge1xuICAvLyBnZXQgbW91c2UgcG9zaXRpb25cbiAgd2luID0gd2luIHx8IHdpbmRvdztcbiAgZSA9IGUgfHwgd2luLmV2ZW50O1xuICBsZXQgZG9jID0gd2luLmRvY3VtZW50O1xuICBkb2MgPSBkb2MuZG9jdW1lbnRFbGVtZW50IHx8IGRvYy5ib2R5O1xuICAvLyBUT0RPKG5pY28pOiBtYWtlIHRvdWNoIGV2ZW50IGhhbmRsaW5nIGJldHRlclxuICBpZiAoZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGgpIHtcbiAgICBjb25zdCB0b3VjaGVzUG9zID0gW107XG4gICAgY29uc3QgbCA9IGUudG91Y2hlcy5sZW5ndGg7XG4gICAgbGV0IGV2dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgICAgZXZ0ID0gZS50b3VjaGVzW2ldO1xuICAgICAgdG91Y2hlc1Bvcy5wdXNoKHtcbiAgICAgICAgeDogZXZ0LnBhZ2VYIHx8IChldnQuY2xpZW50WCArIGRvYy5zY3JvbGxMZWZ0KSxcbiAgICAgICAgeTogZXZ0LnBhZ2VZIHx8IChldnQuY2xpZW50WSArIGRvYy5zY3JvbGxUb3ApXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRvdWNoZXNQb3M7XG4gIH1cbiAgY29uc3QgcGFnZSA9IHtcbiAgICB4OiBlLnBhZ2VYIHx8IChlLmNsaWVudFggKyBkb2Muc2Nyb2xsTGVmdCksXG4gICAgeTogZS5wYWdlWSB8fCAoZS5jbGllbnRZICsgZG9jLnNjcm9sbFRvcClcbiAgfTtcbiAgcmV0dXJuIFtwYWdlXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3AoZSkge1xuICBpZiAoZS5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG4gIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0gZWxzZSB7XG4gICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFdmVudHNQcm94eSB7XG5cbiAgY29uc3RydWN0b3IoZG9tRWxlbSwgb3B0KSB7XG4gICAgdGhpcy5zY2VuZSA9IG9wdC5zY2VuZTtcbiAgICB0aGlzLmRvbUVsZW0gPSBkb21FbGVtO1xuICAgIHRoaXMucG9zID0gX2dldFBvcyhkb21FbGVtKTtcbiAgICB0aGlzLm9wdCA9IHRoaXMuY2FsbGJhY2tzID0gb3B0O1xuXG4gICAgdGhpcy5zaXplID0ge1xuICAgICAgd2lkdGg6IGRvbUVsZW0ud2lkdGggfHwgZG9tRWxlbS5vZmZzZXRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9tRWxlbS5oZWlnaHQgfHwgZG9tRWxlbS5vZmZzZXRIZWlnaHRcbiAgICB9O1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudHMoKTtcbiAgfVxuXG4gIGF0dGFjaEV2ZW50cygpIHtcbiAgICBjb25zdCBkb21FbGVtID0gdGhpcy5kb21FbGVtO1xuICAgIGNvbnN0IG9wdCA9IHRoaXMub3B0O1xuXG4gICAgaWYgKG9wdC5kaXNhYmxlQ29udGV4dE1lbnUpIHtcbiAgICAgIGRvbUVsZW0ub25jb250ZXh0bWVudSA9ICgpID0+IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChvcHQuZW5hYmxlTW91c2UpIHtcbiAgICAgIFsnbW91c2V1cCcsICdtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3ZlcicsICdtb3VzZW91dCddXG4gICAgICAuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICBkb21FbGVtLmFkZEV2ZW50TGlzdGVuZXIoYWN0aW9uLCAoZSwgd2luKSA9PiB7XG4gICAgICAgICAgdGhpc1thY3Rpb25dKHRoaXMuZXZlbnRJbmZvKGFjdGlvbiwgZSwgd2luKSk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBcIndlbGwsIHRoaXMgaXMgZW1iYXJyYXNzaW5nLi4uXCJcbiAgICAgIGxldCB0eXBlID0gJyc7XG4gICAgICBpZiAoIWRvY3VtZW50LmdldEJveE9iamVjdEZvciAmJiB3aW5kb3cubW96SW5uZXJTY3JlZW5YID09PSBudWxsKSB7XG4gICAgICAgIHR5cGUgPSAnbW91c2V3aGVlbCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eXBlID0gJ0RPTU1vdXNlU2Nyb2xsJztcbiAgICAgIH1cbiAgICAgIGRvbUVsZW0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZSwgd2luKSA9PiB7XG4gICAgICAgIHRoaXNbJ21vdXNld2hlZWwnXSh0aGlzLmV2ZW50SW5mbygnbW91c2V3aGVlbCcsIGUsIHdpbikpO1xuICAgICAgfSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGlmIChvcHQuZW5hYmxlVG91Y2gpIHtcbiAgICAgIFsndG91Y2hzdGFydCcsICd0b3VjaG1vdmUnLCAndG91Y2hlbmQnXS5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgIGRvbUVsZW0uYWRkRXZlbnRMaXN0ZW5lcihhY3Rpb24sIChlLCB3aW4pID0+IHtcbiAgICAgICAgICB0aGlzW2FjdGlvbl0odGhpcy5ldmVudEluZm8oYWN0aW9uLCBlLCB3aW4pKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdC5lbmFibGVLZXlib2FyZCkge1xuICAgICAgWydrZXlkb3duJywgJ2tleXVwJ10uZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGFjdGlvbiwgKGUsIHdpbikgPT4ge1xuICAgICAgICAgIHRoaXNbYWN0aW9uXSh0aGlzLmV2ZW50SW5mbyhhY3Rpb24sIGUsIHdpbikpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBldmVudEluZm8odHlwZSwgZSwgd2luKSB7XG4gICAgY29uc3QgZG9tRWxlbSA9IHRoaXMuZG9tRWxlbTtcbiAgICBjb25zdCBzY2VuZSA9IHRoaXMuc2NlbmU7XG4gICAgY29uc3Qgb3B0ID0gdGhpcy5vcHQ7XG4gICAgY29uc3Qgc2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpO1xuICAgIGNvbnN0IHJlbGF0aXZlID0gb3B0LnJlbGF0aXZlO1xuICAgIGNvbnN0IGNlbnRlck9yaWdpbiA9IG9wdC5jZW50ZXJPcmlnaW47XG4gICAgY29uc3QgcG9zID0gb3B0LmNhY2hlUG9zaXRpb24gJiYgdGhpcy5wb3MgfHwgX2dldFBvcyhkb21FbGVtKTtcbiAgICBjb25zdCBnZSA9IGdldChlLCB3aW4pO1xuICAgIGNvbnN0IGVwb3MgPSBnZXRQb3MoZSwgd2luKTtcbiAgICBjb25zdCBvcmlnUG9zID0ge3g6IGVwb3NbMF0ueCwgeTogZXBvc1swXS55fTtcbiAgICBjb25zdCBldnQgPSB7fTtcbiAgICBsZXQgeDtcbiAgICBsZXQgeTtcblxuICAgIC8vIGdldCBQb3NpdGlvblxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gZXBvcy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgIHggPSBlcG9zW2ldLng7XG4gICAgICB5ID0gZXBvc1tpXS55O1xuICAgICAgaWYgKHJlbGF0aXZlKSB7XG4gICAgICAgIHggLT0gcG9zLng7IHkgLT0gcG9zLnk7XG4gICAgICAgIGlmIChjZW50ZXJPcmlnaW4pIHtcbiAgICAgICAgICB4IC09IHNpemUud2lkdGggLyAyO1xuICAgICAgICAgIHkgLT0gc2l6ZS5oZWlnaHQgLyAyO1xuICAgICAgICAgIC8vIHkgYXhpcyBub3cgcG9pbnRzIHRvIHRoZSB0b3Agb2YgdGhlIHNjcmVlblxuICAgICAgICAgIHkgKj0gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVwb3NbaV0ueCA9IHg7XG4gICAgICBlcG9zW2ldLnkgPSB5O1xuICAgIH1cblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ21vdXNld2hlZWwnOlxuICAgICAgZXZ0LndoZWVsID0gZ2V0V2hlZWwoZ2UpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAna2V5ZG93bic6XG4gICAgY2FzZSAna2V5dXAnOlxuICAgICAgT2JqZWN0LmFzc2lnbihldnQsIGdldEtleShnZSkpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbW91c2V1cCc6XG4gICAgICBldnQuaXNSaWdodENsaWNrID0gaXNSaWdodENsaWNrKGdlKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsZXQgY2FjaGVUYXJnZXQ7XG5cbiAgICBPYmplY3QuYXNzaWduKGV2dCwge1xuICAgICAgeDogZXBvc1swXS54LFxuICAgICAgeTogZXBvc1swXS55LFxuICAgICAgcG9zQXJyYXk6IGVwb3MsXG5cbiAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgIC8vIHN0b3AgZXZlbnQgcHJvcGFnYXRpb25cbiAgICAgIHN0b3AoKSB7XG4gICAgICAgIHN0b3AoZ2UpO1xuICAgICAgfSxcbiAgICAgIC8vIGdldCB0aGUgdGFyZ2V0IGVsZW1lbnQgb2YgdGhlIGV2ZW50XG4gICAgICBnZXRUYXJnZXQoKSB7XG4gICAgICAgIGlmIChjYWNoZVRhcmdldCkge1xuICAgICAgICAgIHJldHVybiBjYWNoZVRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGNhY2hlVGFyZ2V0ID0gb3B0LnBpY2tpbmcgJiZcbiAgICAgICAgICBzY2VuZS5waWNrKG9yaWdQb3MueCAtIHBvcy54LCBvcmlnUG9zLnkgLSBwb3MueSkgfHwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gd3JhcCBuYXRpdmUgZXZlbnRcbiAgICBldnQuZXZlbnQgPSBnZTtcblxuICAgIHJldHVybiBldnQ7XG4gIH1cblxuICBnZXRTaXplKCkge1xuICAgIGlmICh0aGlzLmNhY2hlU2l6ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICB9XG4gICAgY29uc3QgZG9tRWxlbSA9IHRoaXMuZG9tRWxlbTtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IGRvbUVsZW0ud2lkdGggfHwgZG9tRWxlbS5vZmZzZXRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9tRWxlbS5oZWlnaHQgfHwgZG9tRWxlbS5vZmZzZXRIZWlnaHRcbiAgICB9O1xuICB9XG5cbiAgbW91c2V1cChlKSB7XG4gICAgaWYgKCF0aGlzLm1vdmVkKSB7XG4gICAgICBpZiAoZS5pc1JpZ2h0Q2xpY2spIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25SaWdodENsaWNrKGUsIHRoaXMuaG92ZXJlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkNsaWNrKGUsIHRvTzNEKHRoaXMucHJlc3NlZCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5wcmVzc2VkKSB7XG4gICAgICBpZiAodGhpcy5tb3ZlZCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdFbmQoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdDYW5jZWwoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnByZXNzZWQgPSB0aGlzLm1vdmVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgbW91c2VvdXQoZSkge1xuICAgIC8vIG1vdXNlb3V0IGNhbnZhc1xuICAgIGxldCBydCA9IGUucmVsYXRlZFRhcmdldDtcbiAgICBjb25zdCBkb21FbGVtID0gdGhpcy5kb21FbGVtO1xuICAgIHdoaWxlIChydCAmJiBydC5wYXJlbnROb2RlKSB7XG4gICAgICBpZiAoZG9tRWxlbSA9PT0gcnQucGFyZW50Tm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBydCA9IHJ0LnBhcmVudE5vZGU7XG4gICAgfVxuICAgIGlmICh0aGlzLmhvdmVyZWQpIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VMZWF2ZShlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgdGhpcy5ob3ZlcmVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnByZXNzZWQgJiYgdGhpcy5tb3ZlZCkge1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnRW5kKGUpO1xuICAgICAgdGhpcy5wcmVzc2VkID0gdGhpcy5tb3ZlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG1vdXNlb3ZlcihlKSB7XG4gIH1cblxuICBtb3VzZW1vdmUoZSkge1xuICAgIGlmICh0aGlzLnByZXNzZWQpIHtcbiAgICAgIHRoaXMubW92ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnTW92ZShlLCB0b08zRCh0aGlzLnByZXNzZWQpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuaG92ZXJlZCkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdG9PM0QoZS5nZXRUYXJnZXQoKSk7XG4gICAgICBpZiAoIXRhcmdldCB8fCB0YXJnZXQuaGFzaCAhPT0gdGhpcy5oYXNoKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VMZWF2ZShlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgICB0aGlzLmhvdmVyZWQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMuaGFzaCA9IHRhcmdldDtcbiAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgIHRoaXMuaGFzaCA9IHRhcmdldC5oYXNoO1xuICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VFbnRlcihlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlTW92ZShlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhvdmVyZWQgPSB0b08zRChlLmdldFRhcmdldCgpKTtcbiAgICAgIHRoaXMuaGFzaCA9IHRoaXMuaG92ZXJlZDtcbiAgICAgIGlmICh0aGlzLmhvdmVyZWQpIHtcbiAgICAgICAgdGhpcy5oYXNoID0gdGhpcy5ob3ZlcmVkLmhhc2g7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VFbnRlcihlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0LnBpY2tpbmcpIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VNb3ZlKGUpO1xuICAgIH1cbiAgfVxuXG4gIG1vdXNld2hlZWwoZSkge1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VXaGVlbChlKTtcbiAgfVxuXG4gIG1vdXNlZG93bihlKSB7XG4gICAgdGhpcy5wcmVzc2VkID0gZS5nZXRUYXJnZXQoKTtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdTdGFydChlLCB0b08zRCh0aGlzLnByZXNzZWQpKTtcbiAgfVxuXG4gIHRvdWNoc3RhcnQoZSkge1xuICAgIHRoaXMudG91Y2hlZCA9IGUuZ2V0VGFyZ2V0KCk7XG4gICAgdGhpcy50b3VjaGVkTGFzdFBvc2l0aW9uID0ge3g6IGUueCwgeTogZS55fTtcbiAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoU3RhcnQoZSwgdG9PM0QodGhpcy50b3VjaGVkKSk7XG4gIH1cblxuICB0b3VjaG1vdmUoZSkge1xuICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgIHRoaXMudG91Y2hNb3ZlZCA9IHRydWU7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoTW92ZShlLCB0b08zRCh0aGlzLnRvdWNoZWQpKTtcbiAgICB9XG4gIH1cblxuICB0b3VjaGVuZChlKSB7XG4gICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgaWYgKHRoaXMudG91Y2hNb3ZlZCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoRW5kKGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZS54ID0gaXNOYU4oZS54KSA/IHRoaXMudG91Y2hlZExhc3RQb3NpdGlvbi54IDogZS54O1xuICAgICAgICBlLnkgPSBpc05hTihlLnkpID8gdGhpcy50b3VjaGVkTGFzdFBvc2l0aW9uLnkgOiBlLnk7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uVGFwKGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoQ2FuY2VsKGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICAgICAgfVxuICAgICAgdGhpcy50b3VjaGVkID0gdGhpcy50b3VjaE1vdmVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAga2V5ZG93bihlKSB7XG4gICAgdGhpcy5jYWxsYmFja3Mub25LZXlEb3duKGUpO1xuICB9XG5cbiAga2V5dXAoZSkge1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uS2V5VXAoZSk7XG4gIH1cbn1cblxuT2JqZWN0LmFzc2lnbihFdmVudHNQcm94eS5wcm90b3R5cGUsIHtcbiAgaG92ZXJlZDogZmFsc2UsXG4gIHByZXNzZWQ6IGZhbHNlLFxuICB0b3VjaGVkOiBmYWxzZSxcbiAgdG91Y2hlZExhc3RQb3NpdGlvbjoge3g6IDAsIHk6IDB9LFxuICB0b3VjaE1vdmVkOiBmYWxzZSxcbiAgbW92ZWQ6IGZhbHNlXG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEV2ZW50cyhkb21FbGVtZW50LCBvcHQgPSB7fSkge1xuICBvcHQgPSB7XG4gICAgY2FjaGVQb3NpdGlvbjogdHJ1ZSxcbiAgICBjYWNoZVNpemU6IHRydWUsXG4gICAgcmVsYXRpdmU6IHRydWUsXG4gICAgY2VudGVyT3JpZ2luOiB0cnVlLFxuICAgIGRpc2FibGVDb250ZXh0TWVudTogdHJ1ZSxcbiAgICBiaW5kOiBmYWxzZSxcbiAgICBwaWNraW5nOiBmYWxzZSxcblxuICAgIGVuYWJsZVRvdWNoOiB0cnVlLFxuICAgIGVuYWJsZU1vdXNlOiB0cnVlLFxuICAgIGVuYWJsZUtleWJvYXJkOiB0cnVlLFxuXG4gICAgb25DbGljazogbm9vcCxcbiAgICBvblJpZ2h0Q2xpY2s6IG5vb3AsXG4gICAgb25EcmFnU3RhcnQ6IG5vb3AsXG4gICAgb25EcmFnTW92ZTogbm9vcCxcbiAgICBvbkRyYWdFbmQ6IG5vb3AsXG4gICAgb25EcmFnQ2FuY2VsOiBub29wLFxuICAgIG9uVG91Y2hTdGFydDogbm9vcCxcbiAgICBvblRvdWNoTW92ZTogbm9vcCxcbiAgICBvblRvdWNoRW5kOiBub29wLFxuICAgIG9uVG91Y2hDYW5jZWw6IG5vb3AsXG4gICAgb25UYXA6IG5vb3AsXG4gICAgb25Nb3VzZU1vdmU6IG5vb3AsXG4gICAgb25Nb3VzZUVudGVyOiBub29wLFxuICAgIG9uTW91c2VMZWF2ZTogbm9vcCxcbiAgICBvbk1vdXNlV2hlZWw6IG5vb3AsXG4gICAgb25LZXlEb3duOiBub29wLFxuICAgIG9uS2V5VXA6IG5vb3AsXG4gICAgLi4ub3B0XG4gIH07XG5cbiAgY29uc3QgYmluZCA9IG9wdC5iaW5kO1xuICBpZiAoYmluZCkge1xuICAgIGZvciAoY29uc3QgbmFtZSBpbiBvcHQpIHtcbiAgICAgIGlmIChuYW1lLm1hdGNoKC9eb25bYS16QS1aMC05XSskLykpIHtcbiAgICAgICAgKChmbmFtZSwgZm4pID0+IHtcbiAgICAgICAgICBvcHRbZm5hbWVdID0gZnVuY3Rpb24gZigpIHtcbiAgICAgICAgICAgIGZuLmFwcGx5KGJpbmQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKG5hbWUsIG9wdFtuYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBFdmVudHNQcm94eShkb21FbGVtZW50LCBvcHQpO1xufVxuXG5leHBvcnQgY29uc3QgS2V5cyA9IEtFWVM7XG5cbmZ1bmN0aW9uIGtleU9mKGNvZGUpIHtcbiAgY29uc3Qga2V5TWFwID0gS2V5cztcbiAgZm9yIChjb25zdCBuYW1lIGluIGtleU1hcCkge1xuICAgIGlmIChrZXlNYXBbbmFtZV0gPT09IGNvZGUpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgfVxufVxuIl19