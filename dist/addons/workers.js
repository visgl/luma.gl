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
      var fn = opt.reduceFn,
          workers = this.workers,
          configs = this.configs,
          l = workers.length,
          acum = opt.initialValue,
          message = function _(e) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvd29ya2Vycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFLcUI7QUFFbkIsV0FGbUIsV0FFbkIsQ0FBWSxRQUFaLEVBQXNCLENBQXRCLEVBQXlCOzBCQUZOLGFBRU07O0FBQ3ZCLFFBQUksVUFBVSxLQUFLLE9BQUwsR0FBZSxFQUFmLENBRFM7QUFFdkIsV0FBTyxHQUFQLEVBQVk7QUFDVixjQUFRLElBQVIsQ0FBYSxJQUFJLE1BQUosQ0FBVyxRQUFYLENBQWIsRUFEVTtLQUFaO0dBRkY7O2VBRm1COzt3QkFTZixNQUFNO0FBQ1IsVUFBSSxVQUFVLEtBQUssT0FBTCxDQUROO0FBRVIsVUFBSSxVQUFVLEtBQUssT0FBTCxHQUFlLEVBQWYsQ0FGTjs7QUFJUixXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxRQUFRLE1BQVIsRUFBZ0IsSUFBSSxDQUFKLEVBQU8sR0FBM0MsRUFBZ0Q7QUFDOUMsZ0JBQVEsSUFBUixDQUFhLFFBQVEsS0FBSyxDQUFMLENBQVIsQ0FBYixDQUQ4QztPQUFoRDs7QUFJQSxhQUFPLElBQVAsQ0FSUTs7OzsyQkFXSCxLQUFLO0FBQ1YsVUFBSSxLQUFLLElBQUksUUFBSjtVQUNMLFVBQVUsS0FBSyxPQUFMO1VBQ1YsVUFBVSxLQUFLLE9BQUw7VUFDVixJQUFJLFFBQVEsTUFBUjtVQUNKLE9BQU8sSUFBSSxZQUFKO1VBQ1AsVUFBVSxTQUFTLENBQVQsQ0FBVyxDQUFYLEVBQWM7QUFDdEIsWUFEc0I7QUFFdEIsWUFBSSxTQUFTLFNBQVQsRUFBb0I7QUFDdEIsaUJBQU8sRUFBRSxJQUFGLENBRGU7U0FBeEIsTUFFTztBQUNMLGlCQUFPLEdBQUcsSUFBSCxFQUFTLEVBQUUsSUFBRixDQUFoQixDQURLO1NBRlA7QUFLQSxZQUFJLE1BQU0sQ0FBTixFQUFTO0FBQ1gsY0FBSSxVQUFKLENBQWUsSUFBZixFQURXO1NBQWI7T0FQUSxDQU5KO0FBaUJWLFdBQUssSUFBSSxJQUFJLENBQUosRUFBTyxLQUFLLENBQUwsRUFBUSxJQUFJLEVBQUosRUFBUSxHQUFoQyxFQUFxQztBQUNuQyxZQUFJLElBQUksUUFBUSxDQUFSLENBQUosQ0FEK0I7QUFFbkMsVUFBRSxTQUFGLEdBQWMsT0FBZCxDQUZtQztBQUduQyxVQUFFLFdBQUYsQ0FBYyxRQUFRLENBQVIsQ0FBZCxFQUhtQztPQUFyQzs7QUFNQSxhQUFPLElBQVAsQ0F2QlU7Ozs7U0FwQk8iLCJmaWxlIjoid29ya2Vycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHdvcmtlcnMuanNcbi8vXG4vKiBnbG9iYWwgV29ya2VyICovXG4vKiBlc2xpbnQtZGlzYWJsZSBvbmUtdmFyLCBpbmRlbnQgKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV29ya2VyR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGZpbGVOYW1lLCBuKSB7XG4gICAgdmFyIHdvcmtlcnMgPSB0aGlzLndvcmtlcnMgPSBbXTtcbiAgICB3aGlsZSAobi0tKSB7XG4gICAgICB3b3JrZXJzLnB1c2gobmV3IFdvcmtlcihmaWxlTmFtZSkpO1xuICAgIH1cbiAgfVxuXG4gIG1hcChmdW5jKSB7XG4gICAgdmFyIHdvcmtlcnMgPSB0aGlzLndvcmtlcnM7XG4gICAgdmFyIGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3MgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gd29ya2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNvbmZpZ3MucHVzaChmdW5jICYmIGZ1bmMoaSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVkdWNlKG9wdCkge1xuICAgIHZhciBmbiA9IG9wdC5yZWR1Y2VGbixcbiAgICAgICAgd29ya2VycyA9IHRoaXMud29ya2VycyxcbiAgICAgICAgY29uZmlncyA9IHRoaXMuY29uZmlncyxcbiAgICAgICAgbCA9IHdvcmtlcnMubGVuZ3RoLFxuICAgICAgICBhY3VtID0gb3B0LmluaXRpYWxWYWx1ZSxcbiAgICAgICAgbWVzc2FnZSA9IGZ1bmN0aW9uIF8oZSkge1xuICAgICAgICAgIGwtLTtcbiAgICAgICAgICBpZiAoYWN1bSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBhY3VtID0gZS5kYXRhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY3VtID0gZm4oYWN1bSwgZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGwgPT09IDApIHtcbiAgICAgICAgICAgIG9wdC5vbkNvbXBsZXRlKGFjdW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBmb3IgKHZhciBpID0gMCwgbG4gPSBsOyBpIDwgbG47IGkrKykge1xuICAgICAgdmFyIHcgPSB3b3JrZXJzW2ldO1xuICAgICAgdy5vbm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgdy5wb3N0TWVzc2FnZShjb25maWdzW2ldKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iXX0=