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
      var x = undefined;
      var y = undefined;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ldmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztRQXFDZ0I7UUFLQTtRQUlBO1FBb0JBO1FBSUE7Ozs7OztBQTlEaEIsSUFBTSxPQUFPO0FBQ1gsV0FBUyxFQUFUO0FBQ0EsUUFBTSxFQUFOO0FBQ0EsVUFBUSxFQUFSO0FBQ0EsVUFBUSxFQUFSO0FBQ0EsV0FBUyxFQUFUO0FBQ0EsU0FBTyxFQUFQO0FBQ0EsV0FBUyxFQUFUO0FBQ0EsZUFBYSxDQUFiO0FBQ0EsU0FBTyxDQUFQO0FBQ0EsWUFBVSxFQUFWO0NBVkk7OztBQWNOLFNBQVMsS0FBVCxDQUFlLENBQWYsRUFBa0I7QUFDaEIsU0FBTyxNQUFNLElBQU4sR0FBYSxDQUFiLEdBQWlCLEtBQWpCLENBRFM7Q0FBbEI7OztBQUtBLFNBQVMsT0FBVCxDQUFpQixJQUFqQixFQUF1QjtBQUNyQixNQUFNLE9BQU8sS0FBSyxxQkFBTCxFQUFQLENBRGU7QUFFckIsU0FBTztBQUNMLE9BQUcsS0FBSyxJQUFMO0FBQ0gsT0FBRyxLQUFLLEdBQUw7QUFDSCxVQUFNLElBQU47R0FIRixDQUZxQjtDQUF2Qjs7O0FBVU8sU0FBUyxHQUFULENBQWEsQ0FBYixFQUFnQixHQUFoQixFQUFxQjtBQUMxQixRQUFNLE9BQU8sTUFBUCxDQURvQjtBQUUxQixTQUFPLEtBQUssSUFBSSxLQUFKLENBRmM7Q0FBckI7O0FBS0EsU0FBUyxRQUFULENBQWtCLENBQWxCLEVBQXFCO0FBQzFCLFNBQU8sRUFBRSxVQUFGLEdBQWUsRUFBRSxVQUFGLEdBQWUsR0FBZixHQUFxQixFQUFFLEVBQUUsTUFBRixJQUFZLENBQVosQ0FBRixHQUFtQixDQUFuQixDQURqQjtDQUFyQjs7QUFJQSxTQUFTLE1BQVQsQ0FBZ0IsQ0FBaEIsRUFBbUI7QUFDeEIsTUFBTSxPQUFPLEVBQUUsS0FBRixJQUFXLEVBQUUsT0FBRixDQURBO0FBRXhCLE1BQUksTUFBTSxNQUFNLElBQU4sQ0FBTjs7QUFGb0IsTUFJcEIsT0FBTyxPQUFPLEdBQVAsQ0FKYTtBQUt4QixNQUFJLE9BQU8sQ0FBUCxJQUFZLE9BQU8sRUFBUCxFQUFXO0FBQ3pCLFVBQU0sTUFBTSxJQUFOLENBRG1CO0dBQTNCO0FBR0EsUUFBTSxPQUFPLE9BQU8sWUFBUCxDQUFvQixJQUFwQixFQUEwQixXQUExQixFQUFQLENBUmtCOztBQVV4QixTQUFPO0FBQ0wsVUFBTSxJQUFOO0FBQ0EsU0FBSyxHQUFMO0FBQ0EsV0FBTyxFQUFFLFFBQUY7QUFDUCxhQUFTLEVBQUUsT0FBRjtBQUNULFNBQUssRUFBRSxNQUFGO0FBQ0wsVUFBTSxFQUFFLE9BQUY7R0FOUixDQVZ3QjtDQUFuQjs7QUFvQkEsU0FBUyxZQUFULENBQXNCLENBQXRCLEVBQXlCO0FBQzlCLFNBQU8sRUFBRSxLQUFGLEtBQVksQ0FBWixJQUFpQixFQUFFLE1BQUYsS0FBYSxDQUFiLENBRE07Q0FBekI7O0FBSUEsU0FBUyxNQUFULENBQWdCLENBQWhCLEVBQW1CLEdBQW5CLEVBQXdCOztBQUU3QixRQUFNLE9BQU8sTUFBUCxDQUZ1QjtBQUc3QixNQUFJLEtBQUssSUFBSSxLQUFKLENBSG9CO0FBSTdCLE1BQUksTUFBTSxJQUFJLFFBQUosQ0FKbUI7QUFLN0IsUUFBTSxJQUFJLGVBQUosSUFBdUIsSUFBSSxJQUFKOztBQUxBLE1BT3pCLEVBQUUsT0FBRixJQUFhLEVBQUUsT0FBRixDQUFVLE1BQVYsRUFBa0I7QUFDakMsUUFBTSxhQUFhLEVBQWIsQ0FEMkI7QUFFakMsU0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksRUFBRSxPQUFGLENBQVUsTUFBVixFQUFrQixHQUFqQyxFQUFzQyxJQUFJLENBQUosRUFBTyxFQUFFLENBQUYsRUFBSztBQUNyRCxZQUFNLEVBQUUsT0FBRixDQUFVLENBQVYsQ0FBTixDQURxRDtBQUVyRCxpQkFBVyxJQUFYLENBQWdCO0FBQ2QsV0FBRyxJQUFJLEtBQUosSUFBYyxJQUFJLE9BQUosR0FBYyxJQUFJLFVBQUo7QUFDL0IsV0FBRyxJQUFJLEtBQUosSUFBYyxJQUFJLE9BQUosR0FBYyxJQUFJLFNBQUo7T0FGakMsRUFGcUQ7S0FBdkQ7QUFPQSxXQUFPLFVBQVAsQ0FUaUM7R0FBbkM7QUFXQSxNQUFJLE9BQU87QUFDVCxPQUFHLEVBQUUsS0FBRixJQUFZLEVBQUUsT0FBRixHQUFZLElBQUksVUFBSjtBQUMzQixPQUFHLEVBQUUsS0FBRixJQUFZLEVBQUUsT0FBRixHQUFZLElBQUksU0FBSjtHQUZ6QixDQWxCeUI7QUFzQjdCLFNBQU8sQ0FBQyxJQUFELENBQVAsQ0F0QjZCO0NBQXhCOztBQXlCQSxTQUFTLEtBQVQsQ0FBYyxDQUFkLEVBQWlCO0FBQ3RCLE1BQUksRUFBRSxlQUFGLEVBQW1CO0FBQ3JCLE1BQUUsZUFBRixHQURxQjtHQUF2QjtBQUdBLElBQUUsWUFBRixHQUFpQixJQUFqQixDQUpzQjtBQUt0QixNQUFJLEVBQUUsY0FBRixFQUFrQjtBQUNwQixNQUFFLGNBQUYsR0FEb0I7R0FBdEIsTUFFTztBQUNMLE1BQUUsV0FBRixHQUFnQixLQUFoQixDQURLO0dBRlA7Q0FMSzs7OztJQVlNO0FBRVgsV0FGVyxXQUVYLENBQVksT0FBWixFQUFxQixHQUFyQixFQUEwQjswQkFGZixhQUVlOztBQUN4QixTQUFLLEtBQUwsR0FBYSxJQUFJLEtBQUosQ0FEVztBQUV4QixTQUFLLE9BQUwsR0FBZSxPQUFmLENBRndCO0FBR3hCLFNBQUssR0FBTCxHQUFXLFFBQVEsT0FBUixDQUFYLENBSHdCO0FBSXhCLFNBQUssR0FBTCxHQUFXLEtBQUssU0FBTCxHQUFpQixHQUFqQixDQUphOztBQU14QixTQUFLLElBQUwsR0FBWTtBQUNWLGFBQU8sUUFBUSxLQUFSLElBQWlCLFFBQVEsV0FBUjtBQUN4QixjQUFRLFFBQVEsTUFBUixJQUFrQixRQUFRLFlBQVI7S0FGNUIsQ0FOd0I7O0FBV3hCLFNBQUssWUFBTCxHQVh3QjtHQUExQjs7ZUFGVzs7bUNBZ0JJOzs7QUFDYixVQUFNLFVBQVUsS0FBSyxPQUFMLENBREg7QUFFYixVQUFNLE1BQU0sS0FBSyxHQUFMLENBRkM7O0FBSWIsVUFBSSxJQUFJLGtCQUFKLEVBQXdCO0FBQzFCLGdCQUFRLGFBQVIsR0FBd0I7aUJBQU07U0FBTixDQURFO09BQTVCOztBQUlBLFVBQUksSUFBSSxXQUFKLEVBQWlCO0FBQ25CLFNBQUMsU0FBRCxFQUFZLFdBQVosRUFBeUIsV0FBekIsRUFBc0MsV0FBdEMsRUFBbUQsVUFBbkQsRUFDQyxPQURELENBQ1Msa0JBQVU7QUFDakIsa0JBQVEsZ0JBQVIsQ0FBeUIsTUFBekIsRUFBaUMsVUFBQyxDQUFELEVBQUksR0FBSixFQUFZO0FBQzNDLGtCQUFLLE1BQUwsRUFBYSxNQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXVCLENBQXZCLEVBQTBCLEdBQTFCLENBQWIsRUFEMkM7V0FBWixFQUU5QixLQUZILEVBRGlCO1NBQVYsQ0FEVDs7O0FBRG1CLFlBU2YsT0FBTyxFQUFQLENBVGU7QUFVbkIsWUFBSSxDQUFDLFNBQVMsZUFBVCxJQUE0QixPQUFPLGVBQVAsS0FBMkIsSUFBM0IsRUFBaUM7QUFDaEUsaUJBQU8sWUFBUCxDQURnRTtTQUFsRSxNQUVPO0FBQ0wsaUJBQU8sZ0JBQVAsQ0FESztTQUZQO0FBS0EsZ0JBQVEsZ0JBQVIsQ0FBeUIsSUFBekIsRUFBK0IsVUFBQyxDQUFELEVBQUksR0FBSixFQUFZO0FBQ3pDLGdCQUFLLFlBQUwsRUFBbUIsTUFBSyxTQUFMLENBQWUsWUFBZixFQUE2QixDQUE3QixFQUFnQyxHQUFoQyxDQUFuQixFQUR5QztTQUFaLEVBRTVCLEtBRkgsRUFmbUI7T0FBckI7O0FBb0JBLFVBQUksSUFBSSxXQUFKLEVBQWlCO0FBQ25CLFNBQUMsWUFBRCxFQUFlLFdBQWYsRUFBNEIsVUFBNUIsRUFBd0MsT0FBeEMsQ0FBZ0Qsa0JBQVU7QUFDeEQsa0JBQVEsZ0JBQVIsQ0FBeUIsTUFBekIsRUFBaUMsVUFBQyxDQUFELEVBQUksR0FBSixFQUFZO0FBQzNDLGtCQUFLLE1BQUwsRUFBYSxNQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXVCLENBQXZCLEVBQTBCLEdBQTFCLENBQWIsRUFEMkM7V0FBWixFQUU5QixLQUZILEVBRHdEO1NBQVYsQ0FBaEQsQ0FEbUI7T0FBckI7O0FBUUEsVUFBSSxJQUFJLGNBQUosRUFBb0I7QUFDdEIsU0FBQyxTQUFELEVBQVksT0FBWixFQUFxQixPQUFyQixDQUE2QixrQkFBVTtBQUNyQyxtQkFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxVQUFDLENBQUQsRUFBSSxHQUFKLEVBQVk7QUFDNUMsa0JBQUssTUFBTCxFQUFhLE1BQUssU0FBTCxDQUFlLE1BQWYsRUFBdUIsQ0FBdkIsRUFBMEIsR0FBMUIsQ0FBYixFQUQ0QztXQUFaLEVBRS9CLEtBRkgsRUFEcUM7U0FBVixDQUE3QixDQURzQjtPQUF4Qjs7Ozs4QkFTUSxNQUFNLEdBQUcsS0FBSztBQUN0QixVQUFNLFVBQVUsS0FBSyxPQUFMLENBRE07QUFFdEIsVUFBTSxRQUFRLEtBQUssS0FBTCxDQUZRO0FBR3RCLFVBQU0sTUFBTSxLQUFLLEdBQUwsQ0FIVTtBQUl0QixVQUFNLE9BQU8sS0FBSyxPQUFMLEVBQVAsQ0FKZ0I7QUFLdEIsVUFBTSxXQUFXLElBQUksUUFBSixDQUxLO0FBTXRCLFVBQU0sZUFBZSxJQUFJLFlBQUosQ0FOQztBQU90QixVQUFNLE1BQU0sSUFBSSxhQUFKLElBQXFCLEtBQUssR0FBTCxJQUFZLFFBQVEsT0FBUixDQUFqQyxDQVBVO0FBUXRCLFVBQU0sS0FBSyxJQUFJLENBQUosRUFBTyxHQUFQLENBQUwsQ0FSZ0I7QUFTdEIsVUFBTSxPQUFPLE9BQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBUCxDQVRnQjtBQVV0QixVQUFNLFVBQVUsRUFBQyxHQUFHLEtBQUssQ0FBTCxFQUFRLENBQVIsRUFBVyxHQUFHLEtBQUssQ0FBTCxFQUFRLENBQVIsRUFBNUIsQ0FWZ0I7QUFXdEIsVUFBTSxNQUFNLEVBQU4sQ0FYZ0I7QUFZdEIsVUFBSSxhQUFKLENBWnNCO0FBYXRCLFVBQUksYUFBSjs7O0FBYnNCLFdBZ0JqQixJQUFJLElBQUksQ0FBSixFQUFPLElBQUksS0FBSyxNQUFMLEVBQWEsSUFBSSxDQUFKLEVBQU8sRUFBRSxDQUFGLEVBQUs7QUFDM0MsWUFBSSxLQUFLLENBQUwsRUFBUSxDQUFSLENBRHVDO0FBRTNDLFlBQUksS0FBSyxDQUFMLEVBQVEsQ0FBUixDQUZ1QztBQUczQyxZQUFJLFFBQUosRUFBYztBQUNaLGVBQUssSUFBSSxDQUFKLENBRE8sQ0FDQSxJQUFLLElBQUksQ0FBSixDQURMO0FBRVosY0FBSSxZQUFKLEVBQWtCO0FBQ2hCLGlCQUFLLEtBQUssS0FBTCxHQUFhLENBQWIsQ0FEVztBQUVoQixpQkFBSyxLQUFLLE1BQUwsR0FBYyxDQUFkOztBQUZXLGFBSWhCLElBQUssQ0FBQyxDQUFELENBSlc7V0FBbEI7U0FGRjtBQVNBLGFBQUssQ0FBTCxFQUFRLENBQVIsR0FBWSxDQUFaLENBWjJDO0FBYTNDLGFBQUssQ0FBTCxFQUFRLENBQVIsR0FBWSxDQUFaLENBYjJDO09BQTdDOztBQWdCQSxjQUFRLElBQVI7QUFDQSxhQUFLLFlBQUw7QUFDRSxjQUFJLEtBQUosR0FBWSxTQUFTLEVBQVQsQ0FBWixDQURGO0FBRUUsZ0JBRkY7QUFEQSxhQUlLLFNBQUwsQ0FKQTtBQUtBLGFBQUssT0FBTDtBQUNFLGlCQUFPLE1BQVAsQ0FBYyxHQUFkLEVBQW1CLE9BQU8sRUFBUCxDQUFuQixFQURGO0FBRUUsZ0JBRkY7QUFMQSxhQVFLLFNBQUw7QUFDRSxjQUFJLFlBQUosR0FBbUIsYUFBYSxFQUFiLENBQW5CLENBREY7QUFFRSxnQkFGRjtBQVJBO0FBWUUsZ0JBREY7QUFYQSxPQWhDc0I7O0FBK0N0QixVQUFJLFdBQUosQ0EvQ3NCOztBQWlEdEIsYUFBTyxNQUFQLENBQWMsR0FBZCxFQUFtQjtBQUNqQixXQUFHLEtBQUssQ0FBTCxFQUFRLENBQVI7QUFDSCxXQUFHLEtBQUssQ0FBTCxFQUFRLENBQVI7QUFDSCxrQkFBVSxJQUFWOztBQUVBLGVBQU8sS0FBUDs7QUFFQSw4QkFBTztBQUNMLGdCQUFLLEVBQUwsRUFESztTQVBVOzs7QUFXakIsd0NBQVk7QUFDVixjQUFJLFdBQUosRUFBaUI7QUFDZixtQkFBTyxXQUFQLENBRGU7V0FBakI7QUFHQSxpQkFBUSxjQUFjLElBQUksT0FBSixJQUNwQixNQUFNLElBQU4sQ0FBVyxRQUFRLENBQVIsR0FBWSxJQUFJLENBQUosRUFBTyxRQUFRLENBQVIsR0FBWSxJQUFJLENBQUosQ0FEdEIsSUFDZ0MsSUFEaEMsQ0FKWjtTQVhLO09BQW5COztBQWpEc0IsU0FxRXRCLENBQUksS0FBSixHQUFZLEVBQVosQ0FyRXNCOztBQXVFdEIsYUFBTyxHQUFQLENBdkVzQjs7Ozs4QkEwRWQ7QUFDUixVQUFJLEtBQUssU0FBTCxFQUFnQjtBQUNsQixlQUFPLEtBQUssSUFBTCxDQURXO09BQXBCO0FBR0EsVUFBSSxVQUFVLEtBQUssT0FBTCxDQUpOO0FBS1IsYUFBTztBQUNMLGVBQU8sUUFBUSxLQUFSLElBQWlCLFFBQVEsV0FBUjtBQUN4QixnQkFBUSxRQUFRLE1BQVIsSUFBa0IsUUFBUSxZQUFSO09BRjVCLENBTFE7Ozs7NEJBV0YsR0FBRztBQUNULFVBQUksQ0FBQyxLQUFLLEtBQUwsRUFBWTtBQUNmLFlBQUksRUFBRSxZQUFGLEVBQWdCO0FBQ2xCLGVBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEIsQ0FBNUIsRUFBK0IsS0FBSyxPQUFMLENBQS9CLENBRGtCO1NBQXBCLE1BRU87QUFDTCxlQUFLLFNBQUwsQ0FBZSxPQUFmLENBQXVCLENBQXZCLEVBQTBCLE1BQU0sS0FBSyxPQUFMLENBQWhDLEVBREs7U0FGUDtPQURGO0FBT0EsVUFBSSxLQUFLLE9BQUwsRUFBYztBQUNoQixZQUFJLEtBQUssS0FBTCxFQUFZO0FBQ2QsZUFBSyxTQUFMLENBQWUsU0FBZixDQUF5QixDQUF6QixFQUE0QixNQUFNLEtBQUssT0FBTCxDQUFsQyxFQURjO1NBQWhCLE1BRU87QUFDTCxlQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCLENBQTVCLEVBQStCLE1BQU0sS0FBSyxPQUFMLENBQXJDLEVBREs7U0FGUDtBQUtBLGFBQUssT0FBTCxHQUFlLEtBQUssS0FBTCxHQUFhLEtBQWIsQ0FOQztPQUFsQjs7Ozs2QkFVTyxHQUFHOztBQUVWLFVBQUksS0FBSyxFQUFFLGFBQUYsQ0FGQztBQUdWLFVBQU0sVUFBVSxLQUFLLE9BQUwsQ0FITjtBQUlWLGFBQU8sTUFBTSxHQUFHLFVBQUgsRUFBZTtBQUMxQixZQUFJLFlBQVksR0FBRyxVQUFILEVBQWU7QUFDN0IsaUJBRDZCO1NBQS9CO0FBR0EsYUFBSyxHQUFHLFVBQUgsQ0FKcUI7T0FBNUI7QUFNQSxVQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2hCLGFBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEIsQ0FBNUIsRUFBK0IsS0FBSyxPQUFMLENBQS9CLENBRGdCO0FBRWhCLGFBQUssT0FBTCxHQUFlLEtBQWYsQ0FGZ0I7T0FBbEI7QUFJQSxVQUFJLEtBQUssT0FBTCxJQUFnQixLQUFLLEtBQUwsRUFBWTtBQUM5QixhQUFLLFNBQUwsQ0FBZSxTQUFmLENBQXlCLENBQXpCLEVBRDhCO0FBRTlCLGFBQUssT0FBTCxHQUFlLEtBQUssS0FBTCxHQUFhLEtBQWIsQ0FGZTtPQUFoQzs7Ozs4QkFNUSxHQUFHOzs7OEJBR0gsR0FBRztBQUNYLFVBQUksS0FBSyxPQUFMLEVBQWM7QUFDaEIsYUFBSyxLQUFMLEdBQWEsSUFBYixDQURnQjtBQUVoQixhQUFLLFNBQUwsQ0FBZSxVQUFmLENBQTBCLENBQTFCLEVBQTZCLE1BQU0sS0FBSyxPQUFMLENBQW5DLEVBRmdCO0FBR2hCLGVBSGdCO09BQWxCO0FBS0EsVUFBSSxLQUFLLE9BQUwsRUFBYztBQUNoQixZQUFJLFNBQVMsTUFBTSxFQUFFLFNBQUYsRUFBTixDQUFULENBRFk7QUFFaEIsWUFBSSxDQUFDLE1BQUQsSUFBVyxPQUFPLElBQVAsS0FBZ0IsS0FBSyxJQUFMLEVBQVc7QUFDeEMsZUFBSyxTQUFMLENBQWUsWUFBZixDQUE0QixDQUE1QixFQUErQixLQUFLLE9BQUwsQ0FBL0IsQ0FEd0M7QUFFeEMsZUFBSyxPQUFMLEdBQWUsTUFBZixDQUZ3QztBQUd4QyxlQUFLLElBQUwsR0FBWSxNQUFaLENBSHdDO0FBSXhDLGNBQUksTUFBSixFQUFZO0FBQ1YsaUJBQUssSUFBTCxHQUFZLE9BQU8sSUFBUCxDQURGO0FBRVYsaUJBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEIsQ0FBNUIsRUFBK0IsS0FBSyxPQUFMLENBQS9CLENBRlU7V0FBWjtTQUpGLE1BUU87QUFDTCxlQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCLENBQTNCLEVBQThCLEtBQUssT0FBTCxDQUE5QixDQURLO1NBUlA7T0FGRixNQWFPO0FBQ0wsYUFBSyxPQUFMLEdBQWUsTUFBTSxFQUFFLFNBQUYsRUFBTixDQUFmLENBREs7QUFFTCxhQUFLLElBQUwsR0FBWSxLQUFLLE9BQUwsQ0FGUDtBQUdMLFlBQUksS0FBSyxPQUFMLEVBQWM7QUFDaEIsZUFBSyxJQUFMLEdBQVksS0FBSyxPQUFMLENBQWEsSUFBYixDQURJO0FBRWhCLGVBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEIsQ0FBNUIsRUFBK0IsS0FBSyxPQUFMLENBQS9CLENBRmdCO1NBQWxCO09BaEJGO0FBcUJBLFVBQUksQ0FBQyxLQUFLLEdBQUwsQ0FBUyxPQUFULEVBQWtCO0FBQ3JCLGFBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsQ0FBM0IsRUFEcUI7T0FBdkI7Ozs7K0JBS1MsR0FBRztBQUNaLFdBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEIsQ0FBNUIsRUFEWTs7Ozs4QkFJSixHQUFHO0FBQ1gsV0FBSyxPQUFMLEdBQWUsRUFBRSxTQUFGLEVBQWYsQ0FEVztBQUVYLFdBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsQ0FBM0IsRUFBOEIsTUFBTSxLQUFLLE9BQUwsQ0FBcEMsRUFGVzs7OzsrQkFLRixHQUFHO0FBQ1osV0FBSyxPQUFMLEdBQWUsRUFBRSxTQUFGLEVBQWYsQ0FEWTtBQUVaLFdBQUssbUJBQUwsR0FBMkIsRUFBQyxHQUFHLEVBQUUsQ0FBRixFQUFLLEdBQUcsRUFBRSxDQUFGLEVBQXZDLENBRlk7QUFHWixXQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCLENBQTVCLEVBQStCLE1BQU0sS0FBSyxPQUFMLENBQXJDLEVBSFk7Ozs7OEJBTUosR0FBRztBQUNYLFVBQUksS0FBSyxPQUFMLEVBQWM7QUFDaEIsYUFBSyxVQUFMLEdBQWtCLElBQWxCLENBRGdCO0FBRWhCLGFBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsQ0FBM0IsRUFBOEIsTUFBTSxLQUFLLE9BQUwsQ0FBcEMsRUFGZ0I7T0FBbEI7Ozs7NkJBTU8sR0FBRztBQUNWLFVBQUksS0FBSyxPQUFMLEVBQWM7QUFDaEIsWUFBSSxLQUFLLFVBQUwsRUFBaUI7QUFDbkIsZUFBSyxTQUFMLENBQWUsVUFBZixDQUEwQixDQUExQixFQUE2QixNQUFNLEtBQUssT0FBTCxDQUFuQyxFQURtQjtTQUFyQixNQUVPO0FBQ0wsWUFBRSxDQUFGLEdBQU0sTUFBTSxFQUFFLENBQUYsQ0FBTixHQUFhLEtBQUssbUJBQUwsQ0FBeUIsQ0FBekIsR0FBNkIsRUFBRSxDQUFGLENBRDNDO0FBRUwsWUFBRSxDQUFGLEdBQU0sTUFBTSxFQUFFLENBQUYsQ0FBTixHQUFhLEtBQUssbUJBQUwsQ0FBeUIsQ0FBekIsR0FBNkIsRUFBRSxDQUFGLENBRjNDO0FBR0wsZUFBSyxTQUFMLENBQWUsS0FBZixDQUFxQixDQUFyQixFQUF3QixNQUFNLEtBQUssT0FBTCxDQUE5QixFQUhLO0FBSUwsZUFBSyxTQUFMLENBQWUsYUFBZixDQUE2QixDQUE3QixFQUFnQyxNQUFNLEtBQUssT0FBTCxDQUF0QyxFQUpLO1NBRlA7QUFRQSxhQUFLLE9BQUwsR0FBZSxLQUFLLFVBQUwsR0FBa0IsS0FBbEIsQ0FUQztPQUFsQjs7Ozs0QkFhTSxHQUFHO0FBQ1QsV0FBSyxTQUFMLENBQWUsU0FBZixDQUF5QixDQUF6QixFQURTOzs7OzBCQUlMLEdBQUc7QUFDUCxXQUFLLFNBQUwsQ0FBZSxPQUFmLENBQXVCLENBQXZCLEVBRE87Ozs7U0FuUUU7OztBQXdRYixPQUFPLE1BQVAsQ0FBYyxZQUFZLFNBQVosRUFBdUI7QUFDbkMsV0FBUyxLQUFUO0FBQ0EsV0FBUyxLQUFUO0FBQ0EsV0FBUyxLQUFUO0FBQ0EsdUJBQXFCLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQTVCO0FBQ0EsY0FBWSxLQUFaO0FBQ0EsU0FBTyxLQUFQO0NBTkY7O0FBU08sSUFBTSwwQkFBUztBQUVwQiwwQkFBTyxJQUFjO1FBQVYsNERBQU0sa0JBQUk7OztBQUVuQjtBQUNFLHFCQUFlLElBQWY7QUFDQSxpQkFBVyxJQUFYO0FBQ0EsZ0JBQVUsSUFBVjtBQUNBLG9CQUFjLElBQWQ7QUFDQSwwQkFBb0IsSUFBcEI7QUFDQSxZQUFNLEtBQU47QUFDQSxlQUFTLEtBQVQ7O0FBRUEsbUJBQWEsSUFBYjtBQUNBLG1CQUFhLElBQWI7QUFDQSxzQkFBZ0IsSUFBaEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtPQUNHLElBOUJMLENBRm1COztBQW1DbkIsUUFBSSxPQUFPLElBQUksSUFBSixDQW5DUTtBQW9DbkIsUUFBSSxJQUFKLEVBQVU7QUFDUixXQUFLLElBQU0sSUFBTixJQUFjLEdBQW5CLEVBQXdCO0FBQ3RCLFlBQUksS0FBSyxLQUFMLENBQVcsa0JBQVgsQ0FBSixFQUFvQztBQUNsQyxXQUFDLFVBQUMsS0FBRCxFQUFRLEVBQVIsRUFBZTtBQUNkLGdCQUFJLEtBQUosSUFBYSxZQUFXO0FBQ3RCLGlCQUFHLEtBQUgsQ0FBUyxJQUFULEVBQWUsTUFBTSxTQUFOLENBQWdCLEtBQWhCLENBQXNCLElBQXRCLENBQTJCLFNBQTNCLENBQWYsRUFEc0I7YUFBWCxDQURDO1dBQWYsQ0FBRCxDQUlHLElBSkgsRUFJUyxJQUFJLElBQUosQ0FKVCxFQURrQztTQUFwQztPQURGO0tBREY7O0FBWUEsV0FBTyxJQUFJLFdBQUosQ0FBZ0IsRUFBaEIsRUFBb0IsR0FBcEIsQ0FBUCxDQWhEbUI7R0FGRDtDQUFUOztBQXVEYixPQUFPLElBQVAsR0FBYyxJQUFkOztBQUVBLFNBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUI7QUFDbkIsTUFBSSxTQUFTLE9BQU8sSUFBUCxDQURNO0FBRW5CLE9BQUssSUFBSSxJQUFKLElBQVksTUFBakIsRUFBeUI7QUFDdkIsUUFBSSxPQUFPLElBQVAsTUFBaUIsSUFBakIsRUFBdUI7QUFDekIsYUFBTyxJQUFQLENBRHlCO0tBQTNCO0dBREY7Q0FGRiIsImZpbGUiOiJldmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGV2ZW50LmpzXG4vLyBIYW5kbGUga2V5Ym9hcmQvbW91c2UvdG91Y2ggZXZlbnRzIGluIHRoZSBDYW52YXNcbi8vIFRPRE8gLSB0aGlzIHdpbGwgbm90IHdvcmsgdW5kZXIgbm9kZVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24sIG1heC1zdGF0ZW1lbnRzLCBuby1sb29wLWZ1bmMgKi9cbi8qIGdsb2JhbCB3aW5kb3csIGRvY3VtZW50ICovXG5pbXBvcnQge25vb3B9IGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBLRVlTID0ge1xuICAnZW50ZXInOiAxMyxcbiAgJ3VwJzogMzgsXG4gICdkb3duJzogNDAsXG4gICdsZWZ0JzogMzcsXG4gICdyaWdodCc6IDM5LFxuICAnZXNjJzogMjcsXG4gICdzcGFjZSc6IDMyLFxuICAnYmFja3NwYWNlJzogOCxcbiAgJ3RhYic6IDksXG4gICdkZWxldGUnOiA0NlxufTtcblxuLy8gcmV0dXJucyBhbiBPM0Qgb2JqZWN0IG9yIGZhbHNlIG90aGVyd2lzZS5cbmZ1bmN0aW9uIHRvTzNEKG4pIHtcbiAgcmV0dXJuIG4gIT09IHRydWUgPyBuIDogZmFsc2U7XG59XG5cbi8vIFJldHVybnMgYW4gZWxlbWVudCBwb3NpdGlvblxuZnVuY3Rpb24gX2dldFBvcyhlbGVtKSB7XG4gIGNvbnN0IGJib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4ge1xuICAgIHg6IGJib3gubGVmdCxcbiAgICB5OiBiYm94LnRvcCxcbiAgICBiYm94OiBiYm94XG4gIH07XG59XG5cbi8vIGV2ZW50IG9iamVjdCB3cmFwcGVyXG5leHBvcnQgZnVuY3Rpb24gZ2V0KGUsIHdpbikge1xuICB3aW4gPSB3aW4gfHwgd2luZG93O1xuICByZXR1cm4gZSB8fCB3aW4uZXZlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXaGVlbChlKSB7XG4gIHJldHVybiBlLndoZWVsRGVsdGEgPyBlLndoZWVsRGVsdGEgLyAxMjAgOiAtKGUuZGV0YWlsIHx8IDApIC8gMztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEtleShlKSB7XG4gIGNvbnN0IGNvZGUgPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgbGV0IGtleSA9IGtleU9mKGNvZGUpO1xuICAvLyBvbmtleWRvd25cbiAgdmFyIGZLZXkgPSBjb2RlIC0gMTExO1xuICBpZiAoZktleSA+IDAgJiYgZktleSA8IDEzKSB7XG4gICAga2V5ID0gJ2YnICsgZktleTtcbiAgfVxuICBrZXkgPSBrZXkgfHwgU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKS50b0xvd2VyQ2FzZSgpO1xuXG4gIHJldHVybiB7XG4gICAgY29kZTogY29kZSxcbiAgICBrZXk6IGtleSxcbiAgICBzaGlmdDogZS5zaGlmdEtleSxcbiAgICBjb250cm9sOiBlLmN0cmxLZXksXG4gICAgYWx0OiBlLmFsdEtleSxcbiAgICBtZXRhOiBlLm1ldGFLZXlcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmlnaHRDbGljayhlKSB7XG4gIHJldHVybiBlLndoaWNoID09PSAzIHx8IGUuYnV0dG9uID09PSAyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9zKGUsIHdpbikge1xuICAvLyBnZXQgbW91c2UgcG9zaXRpb25cbiAgd2luID0gd2luIHx8IHdpbmRvdztcbiAgZSA9IGUgfHwgd2luLmV2ZW50O1xuICBsZXQgZG9jID0gd2luLmRvY3VtZW50O1xuICBkb2MgPSBkb2MuZG9jdW1lbnRFbGVtZW50IHx8IGRvYy5ib2R5O1xuICAvLyBUT0RPKG5pY28pOiBtYWtlIHRvdWNoIGV2ZW50IGhhbmRsaW5nIGJldHRlclxuICBpZiAoZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGgpIHtcbiAgICBjb25zdCB0b3VjaGVzUG9zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlLnRvdWNoZXMubGVuZ3RoLCBldnQ7IGkgPCBsOyArK2kpIHtcbiAgICAgIGV2dCA9IGUudG91Y2hlc1tpXTtcbiAgICAgIHRvdWNoZXNQb3MucHVzaCh7XG4gICAgICAgIHg6IGV2dC5wYWdlWCB8fCAoZXZ0LmNsaWVudFggKyBkb2Muc2Nyb2xsTGVmdCksXG4gICAgICAgIHk6IGV2dC5wYWdlWSB8fCAoZXZ0LmNsaWVudFkgKyBkb2Muc2Nyb2xsVG9wKVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0b3VjaGVzUG9zO1xuICB9XG4gIHZhciBwYWdlID0ge1xuICAgIHg6IGUucGFnZVggfHwgKGUuY2xpZW50WCArIGRvYy5zY3JvbGxMZWZ0KSxcbiAgICB5OiBlLnBhZ2VZIHx8IChlLmNsaWVudFkgKyBkb2Muc2Nyb2xsVG9wKVxuICB9O1xuICByZXR1cm4gW3BhZ2VdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcChlKSB7XG4gIGlmIChlLnN0b3BQcm9wYWdhdGlvbikge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cbiAgZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICBpZiAoZS5wcmV2ZW50RGVmYXVsdCkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSBlbHNlIHtcbiAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEV2ZW50c1Byb3h5IHtcblxuICBjb25zdHJ1Y3Rvcihkb21FbGVtLCBvcHQpIHtcbiAgICB0aGlzLnNjZW5lID0gb3B0LnNjZW5lO1xuICAgIHRoaXMuZG9tRWxlbSA9IGRvbUVsZW07XG4gICAgdGhpcy5wb3MgPSBfZ2V0UG9zKGRvbUVsZW0pO1xuICAgIHRoaXMub3B0ID0gdGhpcy5jYWxsYmFja3MgPSBvcHQ7XG5cbiAgICB0aGlzLnNpemUgPSB7XG4gICAgICB3aWR0aDogZG9tRWxlbS53aWR0aCB8fCBkb21FbGVtLm9mZnNldFdpZHRoLFxuICAgICAgaGVpZ2h0OiBkb21FbGVtLmhlaWdodCB8fCBkb21FbGVtLm9mZnNldEhlaWdodFxuICAgIH07XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50cygpO1xuICB9XG5cbiAgYXR0YWNoRXZlbnRzKCkge1xuICAgIGNvbnN0IGRvbUVsZW0gPSB0aGlzLmRvbUVsZW07XG4gICAgY29uc3Qgb3B0ID0gdGhpcy5vcHQ7XG5cbiAgICBpZiAob3B0LmRpc2FibGVDb250ZXh0TWVudSkge1xuICAgICAgZG9tRWxlbS5vbmNvbnRleHRtZW51ID0gKCkgPT4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG9wdC5lbmFibGVNb3VzZSkge1xuICAgICAgWydtb3VzZXVwJywgJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2VvdmVyJywgJ21vdXNlb3V0J11cbiAgICAgIC5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgIGRvbUVsZW0uYWRkRXZlbnRMaXN0ZW5lcihhY3Rpb24sIChlLCB3aW4pID0+IHtcbiAgICAgICAgICB0aGlzW2FjdGlvbl0odGhpcy5ldmVudEluZm8oYWN0aW9uLCBlLCB3aW4pKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFwid2VsbCwgdGhpcyBpcyBlbWJhcnJhc3NpbmcuLi5cIlxuICAgICAgbGV0IHR5cGUgPSAnJztcbiAgICAgIGlmICghZG9jdW1lbnQuZ2V0Qm94T2JqZWN0Rm9yICYmIHdpbmRvdy5tb3pJbm5lclNjcmVlblggPT09IG51bGwpIHtcbiAgICAgICAgdHlwZSA9ICdtb3VzZXdoZWVsJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR5cGUgPSAnRE9NTW91c2VTY3JvbGwnO1xuICAgICAgfVxuICAgICAgZG9tRWxlbS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIChlLCB3aW4pID0+IHtcbiAgICAgICAgdGhpc1snbW91c2V3aGVlbCddKHRoaXMuZXZlbnRJbmZvKCdtb3VzZXdoZWVsJywgZSwgd2luKSk7XG4gICAgICB9LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdC5lbmFibGVUb3VjaCkge1xuICAgICAgWyd0b3VjaHN0YXJ0JywgJ3RvdWNobW92ZScsICd0b3VjaGVuZCddLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgICAgZG9tRWxlbS5hZGRFdmVudExpc3RlbmVyKGFjdGlvbiwgKGUsIHdpbikgPT4ge1xuICAgICAgICAgIHRoaXNbYWN0aW9uXSh0aGlzLmV2ZW50SW5mbyhhY3Rpb24sIGUsIHdpbikpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAob3B0LmVuYWJsZUtleWJvYXJkKSB7XG4gICAgICBbJ2tleWRvd24nLCAna2V5dXAnXS5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoYWN0aW9uLCAoZSwgd2luKSA9PiB7XG4gICAgICAgICAgdGhpc1thY3Rpb25dKHRoaXMuZXZlbnRJbmZvKGFjdGlvbiwgZSwgd2luKSk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGV2ZW50SW5mbyh0eXBlLCBlLCB3aW4pIHtcbiAgICBjb25zdCBkb21FbGVtID0gdGhpcy5kb21FbGVtO1xuICAgIGNvbnN0IHNjZW5lID0gdGhpcy5zY2VuZTtcbiAgICBjb25zdCBvcHQgPSB0aGlzLm9wdDtcbiAgICBjb25zdCBzaXplID0gdGhpcy5nZXRTaXplKCk7XG4gICAgY29uc3QgcmVsYXRpdmUgPSBvcHQucmVsYXRpdmU7XG4gICAgY29uc3QgY2VudGVyT3JpZ2luID0gb3B0LmNlbnRlck9yaWdpbjtcbiAgICBjb25zdCBwb3MgPSBvcHQuY2FjaGVQb3NpdGlvbiAmJiB0aGlzLnBvcyB8fCBfZ2V0UG9zKGRvbUVsZW0pO1xuICAgIGNvbnN0IGdlID0gZ2V0KGUsIHdpbik7XG4gICAgY29uc3QgZXBvcyA9IGdldFBvcyhlLCB3aW4pO1xuICAgIGNvbnN0IG9yaWdQb3MgPSB7eDogZXBvc1swXS54LCB5OiBlcG9zWzBdLnl9O1xuICAgIGNvbnN0IGV2dCA9IHt9O1xuICAgIGxldCB4O1xuICAgIGxldCB5O1xuXG4gICAgLy8gZ2V0IFBvc2l0aW9uXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBlcG9zLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgeCA9IGVwb3NbaV0ueDtcbiAgICAgIHkgPSBlcG9zW2ldLnk7XG4gICAgICBpZiAocmVsYXRpdmUpIHtcbiAgICAgICAgeCAtPSBwb3MueDsgeSAtPSBwb3MueTtcbiAgICAgICAgaWYgKGNlbnRlck9yaWdpbikge1xuICAgICAgICAgIHggLT0gc2l6ZS53aWR0aCAvIDI7XG4gICAgICAgICAgeSAtPSBzaXplLmhlaWdodCAvIDI7XG4gICAgICAgICAgLy8geSBheGlzIG5vdyBwb2ludHMgdG8gdGhlIHRvcCBvZiB0aGUgc2NyZWVuXG4gICAgICAgICAgeSAqPSAtMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZXBvc1tpXS54ID0geDtcbiAgICAgIGVwb3NbaV0ueSA9IHk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnbW91c2V3aGVlbCc6XG4gICAgICBldnQud2hlZWwgPSBnZXRXaGVlbChnZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdrZXlkb3duJzpcbiAgICBjYXNlICdrZXl1cCc6XG4gICAgICBPYmplY3QuYXNzaWduKGV2dCwgZ2V0S2V5KGdlKSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdtb3VzZXVwJzpcbiAgICAgIGV2dC5pc1JpZ2h0Q2xpY2sgPSBpc1JpZ2h0Q2xpY2soZ2UpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBjYWNoZVRhcmdldDtcblxuICAgIE9iamVjdC5hc3NpZ24oZXZ0LCB7XG4gICAgICB4OiBlcG9zWzBdLngsXG4gICAgICB5OiBlcG9zWzBdLnksXG4gICAgICBwb3NBcnJheTogZXBvcyxcblxuICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgLy8gc3RvcCBldmVudCBwcm9wYWdhdGlvblxuICAgICAgc3RvcCgpIHtcbiAgICAgICAgc3RvcChnZSk7XG4gICAgICB9LFxuICAgICAgLy8gZ2V0IHRoZSB0YXJnZXQgZWxlbWVudCBvZiB0aGUgZXZlbnRcbiAgICAgIGdldFRhcmdldCgpIHtcbiAgICAgICAgaWYgKGNhY2hlVGFyZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIGNhY2hlVGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoY2FjaGVUYXJnZXQgPSBvcHQucGlja2luZyAmJlxuICAgICAgICAgIHNjZW5lLnBpY2sob3JpZ1Bvcy54IC0gcG9zLngsIG9yaWdQb3MueSAtIHBvcy55KSB8fCB0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyB3cmFwIG5hdGl2ZSBldmVudFxuICAgIGV2dC5ldmVudCA9IGdlO1xuXG4gICAgcmV0dXJuIGV2dDtcbiAgfVxuXG4gIGdldFNpemUoKSB7XG4gICAgaWYgKHRoaXMuY2FjaGVTaXplKSB7XG4gICAgICByZXR1cm4gdGhpcy5zaXplO1xuICAgIH1cbiAgICB2YXIgZG9tRWxlbSA9IHRoaXMuZG9tRWxlbTtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IGRvbUVsZW0ud2lkdGggfHwgZG9tRWxlbS5vZmZzZXRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9tRWxlbS5oZWlnaHQgfHwgZG9tRWxlbS5vZmZzZXRIZWlnaHRcbiAgICB9O1xuICB9XG5cbiAgbW91c2V1cChlKSB7XG4gICAgaWYgKCF0aGlzLm1vdmVkKSB7XG4gICAgICBpZiAoZS5pc1JpZ2h0Q2xpY2spIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25SaWdodENsaWNrKGUsIHRoaXMuaG92ZXJlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkNsaWNrKGUsIHRvTzNEKHRoaXMucHJlc3NlZCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5wcmVzc2VkKSB7XG4gICAgICBpZiAodGhpcy5tb3ZlZCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdFbmQoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkRyYWdDYW5jZWwoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnByZXNzZWQgPSB0aGlzLm1vdmVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgbW91c2VvdXQoZSkge1xuICAgIC8vIG1vdXNlb3V0IGNhbnZhc1xuICAgIGxldCBydCA9IGUucmVsYXRlZFRhcmdldDtcbiAgICBjb25zdCBkb21FbGVtID0gdGhpcy5kb21FbGVtO1xuICAgIHdoaWxlIChydCAmJiBydC5wYXJlbnROb2RlKSB7XG4gICAgICBpZiAoZG9tRWxlbSA9PT0gcnQucGFyZW50Tm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBydCA9IHJ0LnBhcmVudE5vZGU7XG4gICAgfVxuICAgIGlmICh0aGlzLmhvdmVyZWQpIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uTW91c2VMZWF2ZShlLCB0aGlzLmhvdmVyZWQpO1xuICAgICAgdGhpcy5ob3ZlcmVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnByZXNzZWQgJiYgdGhpcy5tb3ZlZCkge1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnRW5kKGUpO1xuICAgICAgdGhpcy5wcmVzc2VkID0gdGhpcy5tb3ZlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG1vdXNlb3ZlcihlKSB7XG4gIH1cblxuICBtb3VzZW1vdmUoZSkge1xuICAgIGlmICh0aGlzLnByZXNzZWQpIHtcbiAgICAgIHRoaXMubW92ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25EcmFnTW92ZShlLCB0b08zRCh0aGlzLnByZXNzZWQpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuaG92ZXJlZCkge1xuICAgICAgdmFyIHRhcmdldCA9IHRvTzNEKGUuZ2V0VGFyZ2V0KCkpO1xuICAgICAgaWYgKCF0YXJnZXQgfHwgdGFyZ2V0Lmhhc2ggIT09IHRoaXMuaGFzaCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlTGVhdmUoZSwgdGhpcy5ob3ZlcmVkKTtcbiAgICAgICAgdGhpcy5ob3ZlcmVkID0gdGFyZ2V0O1xuICAgICAgICB0aGlzLmhhc2ggPSB0YXJnZXQ7XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICB0aGlzLmhhc2ggPSB0YXJnZXQuaGFzaDtcbiAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlRW50ZXIoZSwgdGhpcy5ob3ZlcmVkKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25Nb3VzZU1vdmUoZSwgdGhpcy5ob3ZlcmVkKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ob3ZlcmVkID0gdG9PM0QoZS5nZXRUYXJnZXQoKSk7XG4gICAgICB0aGlzLmhhc2ggPSB0aGlzLmhvdmVyZWQ7XG4gICAgICBpZiAodGhpcy5ob3ZlcmVkKSB7XG4gICAgICAgIHRoaXMuaGFzaCA9IHRoaXMuaG92ZXJlZC5oYXNoO1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlRW50ZXIoZSwgdGhpcy5ob3ZlcmVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF0aGlzLm9wdC5waWNraW5nKSB7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlTW92ZShlKTtcbiAgICB9XG4gIH1cblxuICBtb3VzZXdoZWVsKGUpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbk1vdXNlV2hlZWwoZSk7XG4gIH1cblxuICBtb3VzZWRvd24oZSkge1xuICAgIHRoaXMucHJlc3NlZCA9IGUuZ2V0VGFyZ2V0KCk7XG4gICAgdGhpcy5jYWxsYmFja3Mub25EcmFnU3RhcnQoZSwgdG9PM0QodGhpcy5wcmVzc2VkKSk7XG4gIH1cblxuICB0b3VjaHN0YXJ0KGUpIHtcbiAgICB0aGlzLnRvdWNoZWQgPSBlLmdldFRhcmdldCgpO1xuICAgIHRoaXMudG91Y2hlZExhc3RQb3NpdGlvbiA9IHt4OiBlLngsIHk6IGUueX07XG4gICAgdGhpcy5jYWxsYmFja3Mub25Ub3VjaFN0YXJ0KGUsIHRvTzNEKHRoaXMudG91Y2hlZCkpO1xuICB9XG5cbiAgdG91Y2htb3ZlKGUpIHtcbiAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICB0aGlzLnRvdWNoTW92ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25Ub3VjaE1vdmUoZSwgdG9PM0QodGhpcy50b3VjaGVkKSk7XG4gICAgfVxuICB9XG5cbiAgdG91Y2hlbmQoZSkge1xuICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgIGlmICh0aGlzLnRvdWNoTW92ZWQpIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25Ub3VjaEVuZChlLCB0b08zRCh0aGlzLnRvdWNoZWQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGUueCA9IGlzTmFOKGUueCkgPyB0aGlzLnRvdWNoZWRMYXN0UG9zaXRpb24ueCA6IGUueDtcbiAgICAgICAgZS55ID0gaXNOYU4oZS55KSA/IHRoaXMudG91Y2hlZExhc3RQb3NpdGlvbi55IDogZS55O1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5vblRhcChlLCB0b08zRCh0aGlzLnRvdWNoZWQpKTtcbiAgICAgICAgdGhpcy5jYWxsYmFja3Mub25Ub3VjaENhbmNlbChlLCB0b08zRCh0aGlzLnRvdWNoZWQpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudG91Y2hlZCA9IHRoaXMudG91Y2hNb3ZlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGtleWRvd24oZSkge1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uS2V5RG93bihlKTtcbiAgfVxuXG4gIGtleXVwKGUpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbktleVVwKGUpO1xuICB9XG59XG5cbk9iamVjdC5hc3NpZ24oRXZlbnRzUHJveHkucHJvdG90eXBlLCB7XG4gIGhvdmVyZWQ6IGZhbHNlLFxuICBwcmVzc2VkOiBmYWxzZSxcbiAgdG91Y2hlZDogZmFsc2UsXG4gIHRvdWNoZWRMYXN0UG9zaXRpb246IHt4OiAwLCB5OiAwfSxcbiAgdG91Y2hNb3ZlZDogZmFsc2UsXG4gIG1vdmVkOiBmYWxzZVxufSk7XG5cbmV4cG9ydCBjb25zdCBFdmVudHMgPSB7XG5cbiAgY3JlYXRlKGdsLCBvcHQgPSB7fSkge1xuXG4gICAgb3B0ID0ge1xuICAgICAgY2FjaGVQb3NpdGlvbjogdHJ1ZSxcbiAgICAgIGNhY2hlU2l6ZTogdHJ1ZSxcbiAgICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgICAgY2VudGVyT3JpZ2luOiB0cnVlLFxuICAgICAgZGlzYWJsZUNvbnRleHRNZW51OiB0cnVlLFxuICAgICAgYmluZDogZmFsc2UsXG4gICAgICBwaWNraW5nOiBmYWxzZSxcblxuICAgICAgZW5hYmxlVG91Y2g6IHRydWUsXG4gICAgICBlbmFibGVNb3VzZTogdHJ1ZSxcbiAgICAgIGVuYWJsZUtleWJvYXJkOiB0cnVlLFxuXG4gICAgICBvbkNsaWNrOiBub29wLFxuICAgICAgb25SaWdodENsaWNrOiBub29wLFxuICAgICAgb25EcmFnU3RhcnQ6IG5vb3AsXG4gICAgICBvbkRyYWdNb3ZlOiBub29wLFxuICAgICAgb25EcmFnRW5kOiBub29wLFxuICAgICAgb25EcmFnQ2FuY2VsOiBub29wLFxuICAgICAgb25Ub3VjaFN0YXJ0OiBub29wLFxuICAgICAgb25Ub3VjaE1vdmU6IG5vb3AsXG4gICAgICBvblRvdWNoRW5kOiBub29wLFxuICAgICAgb25Ub3VjaENhbmNlbDogbm9vcCxcbiAgICAgIG9uVGFwOiBub29wLFxuICAgICAgb25Nb3VzZU1vdmU6IG5vb3AsXG4gICAgICBvbk1vdXNlRW50ZXI6IG5vb3AsXG4gICAgICBvbk1vdXNlTGVhdmU6IG5vb3AsXG4gICAgICBvbk1vdXNlV2hlZWw6IG5vb3AsXG4gICAgICBvbktleURvd246IG5vb3AsXG4gICAgICBvbktleVVwOiBub29wLFxuICAgICAgLi4ub3B0XG4gICAgfTtcblxuICAgIHZhciBiaW5kID0gb3B0LmJpbmQ7XG4gICAgaWYgKGJpbmQpIHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBvcHQpIHtcbiAgICAgICAgaWYgKG5hbWUubWF0Y2goL15vblthLXpBLVowLTldKyQvKSkge1xuICAgICAgICAgICgoZm5hbWUsIGZuKSA9PiB7XG4gICAgICAgICAgICBvcHRbZm5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGZuLmFwcGx5KGJpbmQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KShuYW1lLCBvcHRbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBFdmVudHNQcm94eShnbCwgb3B0KTtcbiAgfVxuXG59O1xuXG5FdmVudHMuS2V5cyA9IEtFWVM7XG5cbmZ1bmN0aW9uIGtleU9mKGNvZGUpIHtcbiAgdmFyIGtleU1hcCA9IEV2ZW50cy5LZXlzO1xuICBmb3IgKHZhciBuYW1lIGluIGtleU1hcCkge1xuICAgIGlmIChrZXlNYXBbbmFtZV0gPT09IGNvZGUpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgfVxufVxuIl19