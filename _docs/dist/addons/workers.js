"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// workers.js
//
/* global Worker */
/* eslint-disable one-var, indent */

var WorkerGroup = function () {
  function WorkerGroup(fileName, n) {
    _classCallCheck(this, WorkerGroup);

    var workers = this.workers = [];
    while (n--) {
      workers.push(new Worker(fileName));
    }
  }

  _createClass(WorkerGroup, [{
    key: "map",
    value: function map(func) {
      var workers = this.workers;
      var configs = this.configs = [];

      for (var i = 0, l = workers.length; i < l; i++) {
        configs.push(func && func(i));
      }

      return this;
    }
  }, {
    key: "reduce",
    value: function reduce(opt) {
      var fn = opt.reduceFn;
      var workers = this.workers;
      var configs = this.configs;
      var l = workers.length;
      var acum = opt.initialValue;
      var message = function message(e) {
        l--;
        if (acum === undefined) {
          acum = e.data;
        } else {
          acum = fn(acum, e.data);
        }
        if (l === 0) {
          opt.onComplete(acum);
        }
      };
      for (var i = 0, ln = l; i < ln; i++) {
        var w = workers[i];
        w.onmessage = message;
        w.postMessage(configs[i]);
      }

      return this;
    }
  }]);

  return WorkerGroup;
}();

exports.default = WorkerGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvd29ya2Vycy5qcyJdLCJuYW1lcyI6WyJXb3JrZXJHcm91cCIsImZpbGVOYW1lIiwibiIsIndvcmtlcnMiLCJwdXNoIiwiV29ya2VyIiwiZnVuYyIsImNvbmZpZ3MiLCJpIiwibCIsImxlbmd0aCIsIm9wdCIsImZuIiwicmVkdWNlRm4iLCJhY3VtIiwiaW5pdGlhbFZhbHVlIiwibWVzc2FnZSIsInVuZGVmaW5lZCIsImUiLCJkYXRhIiwib25Db21wbGV0ZSIsImxuIiwidyIsIm9ubWVzc2FnZSIsInBvc3RNZXNzYWdlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7O0lBRXFCQSxXO0FBRW5CLHVCQUFZQyxRQUFaLEVBQXNCQyxDQUF0QixFQUF5QjtBQUFBOztBQUN2QixRQUFNQyxVQUFVLEtBQUtBLE9BQUwsR0FBZSxFQUEvQjtBQUNBLFdBQU9ELEdBQVAsRUFBWTtBQUNWQyxjQUFRQyxJQUFSLENBQWEsSUFBSUMsTUFBSixDQUFXSixRQUFYLENBQWI7QUFDRDtBQUNGOzs7O3dCQUVHSyxJLEVBQU07QUFDUixVQUFNSCxVQUFVLEtBQUtBLE9BQXJCO0FBQ0EsVUFBTUksVUFBVSxLQUFLQSxPQUFMLEdBQWUsRUFBL0I7O0FBRUEsV0FBSyxJQUFJQyxJQUFJLENBQVIsRUFBV0MsSUFBSU4sUUFBUU8sTUFBNUIsRUFBb0NGLElBQUlDLENBQXhDLEVBQTJDRCxHQUEzQyxFQUFnRDtBQUM5Q0QsZ0JBQVFILElBQVIsQ0FBYUUsUUFBUUEsS0FBS0UsQ0FBTCxDQUFyQjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7MkJBRU1HLEcsRUFBSztBQUNWLFVBQU1DLEtBQUtELElBQUlFLFFBQWY7QUFDQSxVQUFNVixVQUFVLEtBQUtBLE9BQXJCO0FBQ0EsVUFBTUksVUFBVSxLQUFLQSxPQUFyQjtBQUNBLFVBQUlFLElBQUlOLFFBQVFPLE1BQWhCO0FBQ0EsVUFBSUksT0FBT0gsSUFBSUksWUFBZjtBQUNBLFVBQU1DLFVBQVUsU0FBVkEsT0FBVSxJQUFLO0FBQ25CUDtBQUNBLFlBQUlLLFNBQVNHLFNBQWIsRUFBd0I7QUFDdEJILGlCQUFPSSxFQUFFQyxJQUFUO0FBQ0QsU0FGRCxNQUVPO0FBQ0xMLGlCQUFPRixHQUFHRSxJQUFILEVBQVNJLEVBQUVDLElBQVgsQ0FBUDtBQUNEO0FBQ0QsWUFBSVYsTUFBTSxDQUFWLEVBQWE7QUFDWEUsY0FBSVMsVUFBSixDQUFlTixJQUFmO0FBQ0Q7QUFDRixPQVZEO0FBV0EsV0FBSyxJQUFJTixJQUFJLENBQVIsRUFBV2EsS0FBS1osQ0FBckIsRUFBd0JELElBQUlhLEVBQTVCLEVBQWdDYixHQUFoQyxFQUFxQztBQUNuQyxZQUFNYyxJQUFJbkIsUUFBUUssQ0FBUixDQUFWO0FBQ0FjLFVBQUVDLFNBQUYsR0FBY1AsT0FBZDtBQUNBTSxVQUFFRSxXQUFGLENBQWNqQixRQUFRQyxDQUFSLENBQWQ7QUFDRDs7QUFFRCxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQTVDa0JSLFciLCJmaWxlIjoid29ya2Vycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHdvcmtlcnMuanNcbi8vXG4vKiBnbG9iYWwgV29ya2VyICovXG4vKiBlc2xpbnQtZGlzYWJsZSBvbmUtdmFyLCBpbmRlbnQgKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV29ya2VyR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGZpbGVOYW1lLCBuKSB7XG4gICAgY29uc3Qgd29ya2VycyA9IHRoaXMud29ya2VycyA9IFtdO1xuICAgIHdoaWxlIChuLS0pIHtcbiAgICAgIHdvcmtlcnMucHVzaChuZXcgV29ya2VyKGZpbGVOYW1lKSk7XG4gICAgfVxuICB9XG5cbiAgbWFwKGZ1bmMpIHtcbiAgICBjb25zdCB3b3JrZXJzID0gdGhpcy53b3JrZXJzO1xuICAgIGNvbnN0IGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3MgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gd29ya2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNvbmZpZ3MucHVzaChmdW5jICYmIGZ1bmMoaSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVkdWNlKG9wdCkge1xuICAgIGNvbnN0IGZuID0gb3B0LnJlZHVjZUZuO1xuICAgIGNvbnN0IHdvcmtlcnMgPSB0aGlzLndvcmtlcnM7XG4gICAgY29uc3QgY29uZmlncyA9IHRoaXMuY29uZmlncztcbiAgICBsZXQgbCA9IHdvcmtlcnMubGVuZ3RoO1xuICAgIGxldCBhY3VtID0gb3B0LmluaXRpYWxWYWx1ZTtcbiAgICBjb25zdCBtZXNzYWdlID0gZSA9PiB7XG4gICAgICBsLS07XG4gICAgICBpZiAoYWN1bSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFjdW0gPSBlLmRhdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY3VtID0gZm4oYWN1bSwgZS5kYXRhKTtcbiAgICAgIH1cbiAgICAgIGlmIChsID09PSAwKSB7XG4gICAgICAgIG9wdC5vbkNvbXBsZXRlKGFjdW0pO1xuICAgICAgfVxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDAsIGxuID0gbDsgaSA8IGxuOyBpKyspIHtcbiAgICAgIGNvbnN0IHcgPSB3b3JrZXJzW2ldO1xuICAgICAgdy5vbm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgdy5wb3N0TWVzc2FnZShjb25maWdzW2ldKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iXX0=