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
  var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

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
  return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2V2ZW50LmpzIl0sIm5hbWVzIjpbImdldCIsImdldFdoZWVsIiwiZ2V0S2V5IiwiaXNSaWdodENsaWNrIiwiZ2V0UG9zIiwiYWRkRXZlbnRzIiwiS0VZUyIsImVudGVyIiwidXAiLCJkb3duIiwibGVmdCIsInJpZ2h0IiwiZXNjIiwic3BhY2UiLCJiYWNrc3BhY2UiLCJ0YWIiLCJkZWxldGUiLCJ0b08zRCIsIm4iLCJfZ2V0UG9zIiwiZWxlbSIsImJib3giLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ4IiwieSIsInRvcCIsImUiLCJ3aW4iLCJ3aW5kb3ciLCJldmVudCIsIndoZWVsRGVsdGEiLCJkZXRhaWwiLCJjb2RlIiwid2hpY2giLCJrZXlDb2RlIiwia2V5Iiwia2V5T2YiLCJmS2V5IiwiU3RyaW5nIiwiZnJvbUNoYXJDb2RlIiwidG9Mb3dlckNhc2UiLCJzaGlmdCIsInNoaWZ0S2V5IiwiY29udHJvbCIsImN0cmxLZXkiLCJhbHQiLCJhbHRLZXkiLCJtZXRhIiwibWV0YUtleSIsImJ1dHRvbiIsImRvYyIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50IiwiYm9keSIsInRvdWNoZXMiLCJsZW5ndGgiLCJ0b3VjaGVzUG9zIiwibCIsImV2dCIsImkiLCJwdXNoIiwicGFnZVgiLCJjbGllbnRYIiwic2Nyb2xsTGVmdCIsInBhZ2VZIiwiY2xpZW50WSIsInNjcm9sbFRvcCIsInBhZ2UiLCJzdG9wIiwic3RvcFByb3BhZ2F0aW9uIiwiY2FuY2VsQnViYmxlIiwicHJldmVudERlZmF1bHQiLCJyZXR1cm5WYWx1ZSIsIkV2ZW50c1Byb3h5IiwiZG9tRWxlbSIsIm9wdCIsInNjZW5lIiwicG9zIiwiY2FsbGJhY2tzIiwic2l6ZSIsIndpZHRoIiwib2Zmc2V0V2lkdGgiLCJoZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJhdHRhY2hFdmVudHMiLCJkaXNhYmxlQ29udGV4dE1lbnUiLCJvbmNvbnRleHRtZW51IiwiZW5hYmxlTW91c2UiLCJmb3JFYWNoIiwiYWRkRXZlbnRMaXN0ZW5lciIsImFjdGlvbiIsImV2ZW50SW5mbyIsInR5cGUiLCJnZXRCb3hPYmplY3RGb3IiLCJtb3pJbm5lclNjcmVlblgiLCJlbmFibGVUb3VjaCIsImVuYWJsZUtleWJvYXJkIiwiZ2V0U2l6ZSIsInJlbGF0aXZlIiwiY2VudGVyT3JpZ2luIiwiY2FjaGVQb3NpdGlvbiIsImdlIiwiZXBvcyIsIm9yaWdQb3MiLCJ3aGVlbCIsIk9iamVjdCIsImFzc2lnbiIsImNhY2hlVGFyZ2V0IiwicG9zQXJyYXkiLCJjYWNoZSIsImdldFRhcmdldCIsInBpY2tpbmciLCJwaWNrIiwiY2FjaGVTaXplIiwibW92ZWQiLCJvblJpZ2h0Q2xpY2siLCJob3ZlcmVkIiwib25DbGljayIsInByZXNzZWQiLCJvbkRyYWdFbmQiLCJvbkRyYWdDYW5jZWwiLCJydCIsInJlbGF0ZWRUYXJnZXQiLCJwYXJlbnROb2RlIiwib25Nb3VzZUxlYXZlIiwib25EcmFnTW92ZSIsInRhcmdldCIsImhhc2giLCJvbk1vdXNlRW50ZXIiLCJvbk1vdXNlTW92ZSIsIm9uTW91c2VXaGVlbCIsIm9uRHJhZ1N0YXJ0IiwidG91Y2hlZCIsInRvdWNoZWRMYXN0UG9zaXRpb24iLCJvblRvdWNoU3RhcnQiLCJ0b3VjaE1vdmVkIiwib25Ub3VjaE1vdmUiLCJvblRvdWNoRW5kIiwiaXNOYU4iLCJvblRhcCIsIm9uVG91Y2hDYW5jZWwiLCJvbktleURvd24iLCJvbktleVVwIiwicHJvdG90eXBlIiwiZG9tRWxlbWVudCIsImJpbmQiLCJuYW1lIiwibWF0Y2giLCJmbmFtZSIsImZuIiwiZiIsImFwcGx5IiwiQXJyYXkiLCJzbGljZSIsImNhbGwiLCJhcmd1bWVudHMiLCJLZXlzIiwia2V5TWFwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7cWpCQUFBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7UUFnQ2dCQSxHLEdBQUFBLEc7UUFLQUMsUSxHQUFBQSxRO1FBSUFDLE0sR0FBQUEsTTtRQW9CQUMsWSxHQUFBQSxZO1FB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LEtBQUtDLEtBQUwsQ0FBVyxrQkFBWCxDQUFKLEVBQW9DO0FBQ2xDLFNBQUMsVUFBQ0MsS0FBRCxFQUFRQyxFQUFSLEVBQWU7QUFDZDFFLGNBQUl5RSxLQUFKLElBQWEsU0FBU0UsQ0FBVCxHQUFhO0FBQ3hCRCxlQUFHRSxLQUFILENBQVNOLElBQVQsRUFBZU8sTUFBTVQsU0FBTixDQUFnQlUsS0FBaEIsQ0FBc0JDLElBQXRCLENBQTJCQyxTQUEzQixDQUFmO0FBQ0QsV0FGRDtBQUdELFNBSkQsRUFJR1QsSUFKSCxFQUlTdkUsSUFBSXVFLElBQUosQ0FKVDtBQUtEO0FBQ0Y7QUFDRjs7QUFFRCxTQUFPLElBQUl6RSxXQUFKLENBQWdCdUUsVUFBaEIsRUFBNEJyRSxHQUE1QixDQUFQO0FBQ0Q7O0FBRU0sSUFBTWlGLHNCQUFPdEosSUFBYjs7QUFFUCxTQUFTOEIsS0FBVCxDQUFlSixJQUFmLEVBQXFCO0FBQ25CLE1BQU02SCxTQUFTRCxJQUFmO0FBQ0EsT0FBSyxJQUFNVixJQUFYLElBQW1CVyxNQUFuQixFQUEyQjtBQUN6QixRQUFJQSxPQUFPWCxJQUFQLE1BQWlCbEgsSUFBckIsRUFBMkI7QUFDekIsYUFBT2tILElBQVA7QUFDRDtBQUNGO0FBQ0QsU0FBTyxJQUFQO0FBQ0QiLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBldmVudC5qc1xuLy8gSGFuZGxlIGtleWJvYXJkL21vdXNlL3RvdWNoIGV2ZW50cyBpbiB0aGUgQ2FudmFzXG4vLyBUT0RPIC0gdGhpcyB3aWxsIG5vdCB3b3JrIHVuZGVyIG5vZGVcblxuLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uLCBtYXgtc3RhdGVtZW50cywgbm8tbG9vcC1mdW5jICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCAqL1xuaW1wb3J0IHtub29wfSBmcm9tICcuLi91dGlscyc7XG5cbmNvbnN0IEtFWVMgPSB7XG4gIGVudGVyOiAxMyxcbiAgdXA6IDM4LFxuICBkb3duOiA0MCxcbiAgbGVmdDogMzcsXG4gIHJpZ2h0OiAzOSxcbiAgZXNjOiAyNyxcbiAgc3BhY2U6IDMyLFxuICBiYWNrc3BhY2U6IDgsXG4gIHRhYjogOSxcbiAgZGVsZXRlOiA0NlxufTtcblxuLy8gcmV0dXJucyBhbiBPM0Qgb2JqZWN0IG9yIGZhbHNlIG90aGVyd2lzZS5cbmZ1bmN0aW9uIHRvTzNEKG4pIHtcbiAgcmV0dXJuIG4gIT09IHRydWUgPyBuIDogZmFsc2U7XG59XG5cbi8vIFJldHVybnMgYW4gZWxlbWVudCBwb3NpdGlvblxuZnVuY3Rpb24gX2dldFBvcyhlbGVtKSB7XG4gIGNvbnN0IGJib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4ge1xuICAgIHg6IGJib3gubGVmdCxcbiAgICB5OiBiYm94LnRvcCxcbiAgICBiYm94XG4gIH07XG59XG5cbi8vIGV2ZW50IG9iamVjdCB3cmFwcGVyXG5leHBvcnQgZnVuY3Rpb24gZ2V0KGUsIHdpbikge1xuICB3aW4gPSB3aW4gfHwgd2luZG93O1xuICByZXR1cm4gZSB8fCB3aW4uZXZlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXaGVlbChlKSB7XG4gIHJldHVybiBlLndoZWVsRGVsdGEgPyBlLndoZWVsRGVsdGEgLyAxMjAgOiAtKGUuZGV0YWlsIHx8IDApIC8gMztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEtleShlKSB7XG4gIGNvbnN0IGNvZGUgPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgbGV0IGtleSA9IGtleU9mKGNvZGUpO1xuICAvLyBvbmtleWRvd25cbiAgY29uc3QgZktleSA9IGNvZGUgLSAxMTE7XG4gIGlmIChmS2V5ID4gMCAmJiBmS2V5IDwgMTMpIHtcbiAgICBrZXkgPSBgZiR7ZktleX1gO1xuICB9XG4gIGtleSA9IGtleSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpLnRvTG93ZXJDYXNlKCk7XG5cbiAgcmV0dXJuIHtcbiAgICBjb2RlLFxuICAgIGtleSxcbiAgICBzaGlmdDogZS5zaGlmdEtleSxcbiAgICBjb250cm9sOiBlLmN0cmxLZXksXG4gICAgYWx0OiBlLmFsdEtleSxcbiAgICBtZXRhOiBlLm1ldGFLZXlcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmlnaHRDbGljayhlKSB7XG4gIHJldHVybiBlLndoaWNoID09PSAzIHx8IGUuYnV0dG9uID09PSAyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9zKGUsIHdpbikge1xuICAvLyBnZXQgbW91c2UgcG9zaXRpb25cbiAgd2luID0gd2luIHx8IHdpbmRvdztcbiAgZSA9IGUgfHwgd2luLmV2ZW50O1xuICBsZXQgZG9jID0gd2luLmRvY3VtZW50O1xuICBkb2MgPSBkb2MuZG9jdW1lbnRFbGVtZW50IHx8IGRvYy5ib2R5O1xuICAvLyBUT0RPKG5pY28pOiBtYWtlIHRvdWNoIGV2ZW50IGhhbmRsaW5nIGJldHRlclxuICBpZiAoZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGgpIHtcbiAgICBjb25zdCB0b3VjaGVzUG9zID0gW107XG4gICAgY29uc3QgbCA9IGUudG91Y2hlcy5sZW5ndGg7XG4gICAgbGV0IGV2dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgICAgZXZ0ID0gZS50b3VjaGVzW2ldO1xuICAgICAgdG91Y2hlc1Bvcy5wdXNoKHtcbiAgICAgICAgeDogZXZ0LnBhZ2VYIHx8IChldnQuY2xpZW50WCArIGRvYy5zY3JvbGxMZWZ0KSxcbiAgICAgICAgeTogZXZ0LnBhZ2VZIHx8IChldnQuY2xpZW50WSArIGRvYy5zY3JvbGxUb3ApXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRvdWNoZXNQb3M7XG4gIH1cbiAgY29uc3QgcGFnZSA9IHtcbiAgICB4OiBlLnBhZ2VYIHx8IChlLmNsaWVudFggKyBkb2Muc2Nyb2xsTGVmdCksXG4gICAgeTogZS5wYWdlWSB8fCAoZS5jbGllbnRZICsgZG9jLnNjcm9sbFRvcClcbiAgfTtcbiAgcmV0dXJuIFtwYWdlXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3AoZSkge1xuICBpZiAoZS5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG4gIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0gZWxzZSB7XG4gICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFdmVudHNQcm94eSB7XG5cbiAgY29uc3RydWN0b3IoZG9tRWxlbSwgb3B0KSB7XG4gICAgdGhpcy5zY2VuZSA9IG9wdC5zY2VuZTtcbiAgICB0aGlzLmRvbUVsZW0gPSBkb21FbGVtO1xuICAgIHRoaXMucG9zID0gX2dldFBvcyhkb21FbGVtKTtcbiAgICB0aGlzLm9wdCA9IHRoaXMuY2FsbGJhY2tzID0gb3B0O1xuXG4gICAgdGhpcy5zaXplID0ge1xuICAgICAgd2lkdGg6IGRvbUVsZW0ud2lkdGggfHwgZG9tRWxlbS5vZmZzZXRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9tRWxlbS5oZWlnaHQgfHwgZG9tRWxlbS5vZmZzZXRIZWlnaHRcbiAgICB9O1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudHMoKTtcbiAgfVxuXG4gIGF0dGFjaEV2ZW50cygpIHtcbiAgICBjb25zdCBkb21FbGVtID0gdGhpcy5kb21FbGVtO1xuICAgIGNvbnN0IG9wdCA9IHRoaXMub3B0O1xuXG4gICAgaWYgKG9wdC5kaXNhYmxlQ29udGV4dE1lbnUpIHtcbiAgICAgIGRvbUVsZW0ub25jb250ZXh0bWVudSA9ICgpID0+IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChvcHQuZW5hYmxlTW91c2UpIHtcbiAgICAgIFsnbW91c2V1cCcsICdtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3ZlcicsICdtb3VzZW91dCddXG4gICAgICAuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICBkb21FbGVtLmFkZEV2ZW50TGlzdGVuZXIoYWN0aW9uLCAoZSwgd2luKSA9PiB7XG4gICAgICAgICAgdGhpc1thY3Rpb25dKHRoaXMuZXZlbnRJbmZvKGFjdGlvbiwgZSwgd2luKSk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBcIndlbGwsIHRoaXMgaXMgZW1iYXJyYXNzaW5nLi4uXCJcbiAgICAgIGxldCB0eXBlID0gJyc7XG4gICAgICBpZiAoIWRvY3VtZW50LmdldEJveE9iamVjdEZvciAmJiB3aW5kb3cubW96SW5uZXJTY3JlZW5YID09PSBudWxsKSB7XG4gICAgICAgIHR5cGUgPSAnbW91c2V3aGVlbCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eXBlID0gJ0RPTU1vdXNlU2Nyb2xsJztcbiAgICAgIH1cbiAgICAgIGRvbUVsZW0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZSwgd2luKSA9PiB7XG4gICAgICAgIHRoaXNbJ21vdXNld2hlZWwnXSh0aGlzLmV2ZW50SW5mbygnbW91c2V3aGVlbCcsIGUsIHdpbikpO1xuICAgICAgfSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGlmIChvcHQuZW5hYmxlVG91Y2gpIHtcbiAgICAgIFsndG91Y2hzdGFydCcsICd0b3VjaG1vdmUnLCAndG91Y2hlbmQnXS5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgIGRvbUVsZW0uYWRkRXZlbnRMaXN0ZW5lcihhY3Rpb24sIChlLCB3aW4pID0+IHtcbiAgICAgICAgICB0aGlzW2FjdGlvbl0odGhpcy5ldmVudEluZm8oYWN0aW9uLCBlLCB3aW4pKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdC5lbmFibGVLZXlib2FyZCkge1xuICAgICAgWydrZXlkb3duJywgJ2tleXVwJ10uZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGFjdGlvbiwgKGUsIHdpbikgPT4ge1xuICAgICAgICAgIHRoaXNbYWN0aW9uXSh0aGlzLmV2ZW50SW5mbyhhY3Rpb24sIGUsIHdpbikpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBldmVudEluZm8odHlwZSwgZSwgd2luKSB7XG4gICAgY29uc3QgZG9tRWxlbSA9IHRoaXMuZG9tRWxlbTtcbiAgICBjb25zdCBzY2VuZSA9IHRoaXMuc2NlbmU7XG4gICAgY29uc3Qgb3B0ID0gdGhpcy5vcHQ7XG4gICAgY29uc3Qgc2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpO1xuICAgIGNvbnN0IHJlbGF0aXZlID0gb3B0LnJlbGF0aXZlO1xuICAgIGNvbnN0IGNlbnRlck9yaWdpbiA9IG9wdC5jZW50ZXJPcmlnaW47XG4gICAgY29uc3QgcG9zID0gb3B0LmNhY2hlUG9zaXRpb24gJiYgdGhpcy5wb3MgfHwgX2dldFBvcyhkb21FbGVtKTtcbiAgICBjb25zdCBnZSA9IGdldChlLCB3aW4pO1xuICAgIGNvbnN0IGVwb3MgPSBnZXRQb3MoZSwgd2luKTtcbiAgICBjb25zdCBvcmlnUG9zID0ge3g6IGVwb3NbMF0ueCwgeTogZXBvc1swXS55fTtcbiAgICBjb25zdCBldnQgPSB7fTtcbiAgICBsZXQgeDtcbiAgICBsZXQgeTtcblxuICAgIC8vIGdldCBQb3NpdGlvblxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gZXBvcy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgIHggPSBlcG9zW2ldLng7XG4gICAgICB5ID0gZXBvc1tpXS55O1xuICAgICAgaWYgKHJlbGF0aXZlKSB7XG4gICAgICAgIHggLT0gcG9zLng7IHkgLT0gcG9zLnk7XG4gICAgICAgIGlmIChjZW50ZXJPcmlnaW4pIHtcbiAgICAgICAgICB4IC09IHNpemUud2lkdGggLyAyO1xuICAgICAgICAgIHkgLT0gc2l6ZS5oZWlnaHQgLyAyO1xuICAgICAgICAgIC8vIHkgYXhpcyBub3cgcG9pbnRzIHRvIHRoZSB0b3Agb2YgdGhlIHNjcmVlblxuICAgICAgICAgIHkgKj0gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVwb3NbaV0ueCA9IHg7XG4gICAgICBlcG9zW2ldLnkgPSB5O1xuICAgIH1cblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ21vdXNld2hlZWwnOlxuICAgICAgZXZ0LndoZWVsID0gZ2V0V2hlZWwoZ2UpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAna2V5ZG93bic6XG4gICAgY2FzZSAna2V5dXAnOlxuICAgICAgT2JqZWN0LmFzc2lnbihldnQsIGdldEtleShnZSkpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbW91c2V1cCc6XG4gICAgICBldnQuaXNSaWdodENsaWNrID0gaXNSaWdodENsaWNrKGdlKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsZXQgY2FjaGVUYXJnZXQ7XG5cbiAgICBPYmplY3QuYXNzaWduKGV2dCwge1xuICAgICAgeDogZXBvc1swXS54LFxuICAgICAgeTogZXBvc1swXS55LFxuICAgICAgcG9zQXJyYXk6IGVwb3MsXG5cbiAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgIC8vIHN0b3AgZXZlbnQgcHJvcGFnYXRpb25cbiAgICAgIHN0b3AoKSB7XG4gICAgICAgIHN0b3AoZ2UpO1xuICAgICAgfSxcbiAgICAgIC8vIGdldCB0aGUgdGFyZ2V0IGVsZW1lbnQgb2YgdGhlIGV2ZW50XG4gICAgICBnZXRUYXJnZXQoKSB7XG4gICAgICAgIGlmIChjYWNoZVRhcmdldCkge1xuICAgICAgICAgIHJldHVybiBjYWNoZVRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGNhY2hlVGFyZ2V0ID0gb3B0LnBpY2tpbmcgJiZcbiAgICAgICAgICBzY2VuZS5waWNrKG9yaWdQb3MueCAtIHBvcy54LCBvcmlnUG9zLnkgLSBwb3MueSkgfHwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gd3JhcCBuYXRpdmUgZXZlbnRcbiAgICBldnQuZXZlbnQgPSBnZTtcblxuICAgIHJldHVybiBldnQ7XG4gIH1cblxuICBnZXRTaXplKCkge1xuICAgIGlmICh0aGlzLmNhY2hlU2l6ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICB9XG4gICAgY29uc3QgZG9tRWxlbSA9IHRoaXMuZG9tRWxlbTtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IGRvbUVsZW0ud2lkdGggfHwgZG9tRWxlbS5vZmZzZXRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9tRWxlbS5oZWlnaHQgfHwgZG9tRWxlbS5vZmZzZXRIZWlnaHRcbiAgICB9O1xuICB9XG5cbiAgbW91c2V1cChlKSB7XG4gICAgaWYgKCF0aGlzLm1vdmVkKSB7XG4gICAgICBpZiAoZS5pc1JpZ2h0Q2xpY2spIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25SaWdodENsaWNrKGUsIHRoaXMuaG92ZXJlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkNsaWNrKGUsIHRvTzNEKHRoaXMucHJlc3NlZCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5wcmVzc2VkKSB7XG4gICAgICBpZiAodGhpcy5tb3ZlZCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdFbmQoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdDYW5jZWwoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnByZXNzZWQgPSB0aGlzLm1vdmVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgbW91c2VvdXQoZSkge1xuICAgIC8vIG1vdXNlb3V0IGNhbnZhc1xuICAgIGxldCBydCA9IGUucmVsYXRlZFRhcmdldDtcbiAgICBjb25zdCBkb21FbGVtID0gdGhpcy5kb21FbGVtO1xuICAgIHdoaWxlIChydCAmJiBydC5wYXJlbnROb2RlKSB7XG4gICAgICBpZiAoZG9tRWxlbSA9PT0gcnQucGFyZW50Tm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBydCA9IHJ0LnBhcmVudE5vZGU7XG4gICAgfVxuICAgIGlmICh0aGlzLmhvdmVyZWQpIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VMZWF2ZShlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgdGhpcy5ob3ZlcmVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnByZXNzZWQgJiYgdGhpcy5tb3ZlZCkge1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnRW5kKGUpO1xuICAgICAgdGhpcy5wcmVzc2VkID0gdGhpcy5tb3ZlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG1vdXNlb3ZlcihlKSB7XG4gIH1cblxuICBtb3VzZW1vdmUoZSkge1xuICAgIGlmICh0aGlzLnByZXNzZWQpIHtcbiAgICAgIHRoaXMubW92ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnTW92ZShlLCB0b08zRCh0aGlzLnByZXNzZWQpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuaG92ZXJlZCkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdG9PM0QoZS5nZXRUYXJnZXQoKSk7XG4gICAgICBpZiAoIXRhcmdldCB8fCB0YXJnZXQuaGFzaCAhPT0gdGhpcy5oYXNoKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VMZWF2ZShlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgICB0aGlzLmhvdmVyZWQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMuaGFzaCA9IHRhcmdldDtcbiAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgIHRoaXMuaGFzaCA9IHRhcmdldC5oYXNoO1xuICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VFbnRlcihlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlTW92ZShlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhvdmVyZWQgPSB0b08zRChlLmdldFRhcmdldCgpKTtcbiAgICAgIHRoaXMuaGFzaCA9IHRoaXMuaG92ZXJlZDtcbiAgICAgIGlmICh0aGlzLmhvdmVyZWQpIHtcbiAgICAgICAgdGhpcy5oYXNoID0gdGhpcy5ob3ZlcmVkLmhhc2g7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VFbnRlcihlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0LnBpY2tpbmcpIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VNb3ZlKGUpO1xuICAgIH1cbiAgfVxuXG4gIG1vdXNld2hlZWwoZSkge1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VXaGVlbChlKTtcbiAgfVxuXG4gIG1vdXNlZG93bihlKSB7XG4gICAgdGhpcy5wcmVzc2VkID0gZS5nZXRUYXJnZXQoKTtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdTdGFydChlLCB0b08zRCh0aGlzLnByZXNzZWQpKTtcbiAgfVxuXG4gIHRvdWNoc3RhcnQoZSkge1xuICAgIHRoaXMudG91Y2hlZCA9IGUuZ2V0VGFyZ2V0KCk7XG4gICAgdGhpcy50b3VjaGVkTGFzdFBvc2l0aW9uID0ge3g6IGUueCwgeTogZS55fTtcbiAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoU3RhcnQoZSwgdG9PM0QodGhpcy50b3VjaGVkKSk7XG4gIH1cblxuICB0b3VjaG1vdmUoZSkge1xuICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgIHRoaXMudG91Y2hNb3ZlZCA9IHRydWU7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoTW92ZShlLCB0b08zRCh0aGlzLnRvdWNoZWQpKTtcbiAgICB9XG4gIH1cblxuICB0b3VjaGVuZChlKSB7XG4gICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgaWYgKHRoaXMudG91Y2hNb3ZlZCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoRW5kKGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZS54ID0gaXNOYU4oZS54KSA/IHRoaXMudG91Y2hlZExhc3RQb3NpdGlvbi54IDogZS54O1xuICAgICAgICBlLnkgPSBpc05hTihlLnkpID8gdGhpcy50b3VjaGVkTGFzdFBvc2l0aW9uLnkgOiBlLnk7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uVGFwKGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vblRvdWNoQ2FuY2VsKGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICAgICAgfVxuICAgICAgdGhpcy50b3VjaGVkID0gdGhpcy50b3VjaE1vdmVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAga2V5ZG93bihlKSB7XG4gICAgdGhpcy5jYWxsYmFja3Mub25LZXlEb3duKGUpO1xuICB9XG5cbiAga2V5dXAoZSkge1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uS2V5VXAoZSk7XG4gIH1cbn1cblxuT2JqZWN0LmFzc2lnbihFdmVudHNQcm94eS5wcm90b3R5cGUsIHtcbiAgaG92ZXJlZDogZmFsc2UsXG4gIHByZXNzZWQ6IGZhbHNlLFxuICB0b3VjaGVkOiBmYWxzZSxcbiAgdG91Y2hlZExhc3RQb3NpdGlvbjoge3g6IDAsIHk6IDB9LFxuICB0b3VjaE1vdmVkOiBmYWxzZSxcbiAgbW92ZWQ6IGZhbHNlXG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEV2ZW50cyhkb21FbGVtZW50LCBvcHQgPSB7fSkge1xuICBvcHQgPSB7XG4gICAgY2FjaGVQb3NpdGlvbjogdHJ1ZSxcbiAgICBjYWNoZVNpemU6IHRydWUsXG4gICAgcmVsYXRpdmU6IHRydWUsXG4gICAgY2VudGVyT3JpZ2luOiB0cnVlLFxuICAgIGRpc2FibGVDb250ZXh0TWVudTogdHJ1ZSxcbiAgICBiaW5kOiBmYWxzZSxcbiAgICBwaWNraW5nOiBmYWxzZSxcblxuICAgIGVuYWJsZVRvdWNoOiB0cnVlLFxuICAgIGVuYWJsZU1vdXNlOiB0cnVlLFxuICAgIGVuYWJsZUtleWJvYXJkOiB0cnVlLFxuXG4gICAgb25DbGljazogbm9vcCxcbiAgICBvblJpZ2h0Q2xpY2s6IG5vb3AsXG4gICAgb25EcmFnU3RhcnQ6IG5vb3AsXG4gICAgb25EcmFnTW92ZTogbm9vcCxcbiAgICBvbkRyYWdFbmQ6IG5vb3AsXG4gICAgb25EcmFnQ2FuY2VsOiBub29wLFxuICAgIG9uVG91Y2hTdGFydDogbm9vcCxcbiAgICBvblRvdWNoTW92ZTogbm9vcCxcbiAgICBvblRvdWNoRW5kOiBub29wLFxuICAgIG9uVG91Y2hDYW5jZWw6IG5vb3AsXG4gICAgb25UYXA6IG5vb3AsXG4gICAgb25Nb3VzZU1vdmU6IG5vb3AsXG4gICAgb25Nb3VzZUVudGVyOiBub29wLFxuICAgIG9uTW91c2VMZWF2ZTogbm9vcCxcbiAgICBvbk1vdXNlV2hlZWw6IG5vb3AsXG4gICAgb25LZXlEb3duOiBub29wLFxuICAgIG9uS2V5VXA6IG5vb3AsXG4gICAgLi4ub3B0XG4gIH07XG5cbiAgY29uc3QgYmluZCA9IG9wdC5iaW5kO1xuICBpZiAoYmluZCkge1xuICAgIGZvciAoY29uc3QgbmFtZSBpbiBvcHQpIHtcbiAgICAgIGlmIChuYW1lLm1hdGNoKC9eb25bYS16QS1aMC05XSskLykpIHtcbiAgICAgICAgKChmbmFtZSwgZm4pID0+IHtcbiAgICAgICAgICBvcHRbZm5hbWVdID0gZnVuY3Rpb24gZigpIHtcbiAgICAgICAgICAgIGZuLmFwcGx5KGJpbmQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKG5hbWUsIG9wdFtuYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBFdmVudHNQcm94eShkb21FbGVtZW50LCBvcHQpO1xufVxuXG5leHBvcnQgY29uc3QgS2V5cyA9IEtFWVM7XG5cbmZ1bmN0aW9uIGtleU9mKGNvZGUpIHtcbiAgY29uc3Qga2V5TWFwID0gS2V5cztcbiAgZm9yIChjb25zdCBuYW1lIGluIGtleU1hcCkge1xuICAgIGlmIChrZXlNYXBbbmFtZV0gPT09IGNvZGUpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==