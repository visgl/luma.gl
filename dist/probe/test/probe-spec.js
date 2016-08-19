'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /* eslint-disable max-statements */


var _probe = require('../src/probe');

var _probe2 = _interopRequireDefault(_probe);

var _tape = require('tape');

var _tape2 = _interopRequireDefault(_tape);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getInstance() {
  return new _probe2.default({
    isEnabled: true,
    isPrintEnabled: false,
    ignoreEnvironment: true
  });
}

(0, _tape2.default)('Probe#probe', function (assert) {
  var probe = getInstance();

  probe.probe('test');

  var log = probe.getLog();
  var row = log[0];

  assert.equals(log.length, 1, 'Expected row logged');
  assert.equal(row.name, 'test', 'Name logged');
  assert.equal(_typeof(row.total), 'number', 'Start is set');
  assert.equal(_typeof(row.delta), 'number', 'Delta is set');

  assert.end();
});

(0, _tape2.default)('Probe#probe - level methods', function (assert) {
  var probe = getInstance().setLevel(3);

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 4, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1, 2, 3], 'Levels match expected');
  assert.deepEqual(log.map(function (row) {
    return row.name;
  }), ['test0', 'test1', 'test2', 'test3'], 'Names match expected');

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = log[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var row = _step.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#probe - level methods, lower level set', function (assert) {
  var probe = getInstance().setLevel(1);

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 2, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1], 'Levels match expected');

  assert.end();
});

(0, _tape2.default)('Probe#probe - disabled', function (assert) {
  var probe = getInstance().disable();

  probe.probe('test0');
  probe.probe1('test1');
  probe.probe2('test2');
  probe.probe3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 0, 'No rows logged');

  assert.end();
});

(0, _tape2.default)('Probe#sample - level methods', function (assert) {
  var probe = getInstance().setLevel(3);

  probe.sample('test0');
  probe.sample1('test1');
  probe.sample2('test2');
  probe.sample3('test3');

  var log = probe.getLog();

  assert.equals(log.length, 4, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1, 2, 3], 'Levels match expected');
  assert.deepEqual(log.map(function (row) {
    return row.name;
  }), ['test0', 'test1', 'test2', 'test3'], 'Names match expected');

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = log[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var row = _step2.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
      assert.equal(_typeof(row.averageTime), 'number', 'Avg time is set');
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#fps - level methods', function (assert) {
  var probe = getInstance().setLevel(3);
  var count = 3;

  for (var i = 0; i < count; i++) {
    probe.fps('test0', { count: count });
    probe.fps1('test1', { count: count });
    probe.fps2('test2', { count: count });
    probe.fps3('test3', { count: count });
  }

  var log = probe.getLog();

  assert.equals(log.length, 4, 'Expected rows logged');
  assert.deepEqual(log.map(function (row) {
    return row.level;
  }), [1, 1, 2, 3], 'Levels match expected');
  assert.deepEqual(log.map(function (row) {
    return row.name;
  }), ['test0', 'test1', 'test2', 'test3'], 'Names match expected');

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = log[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var row = _step3.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
      assert.equal(_typeof(row.fps), 'number', 'FPS is set');
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#fps - log once per count', function (assert) {
  var probe = getInstance().setLevel(3);
  var count = 3;
  var cycles = 4;

  for (var i = 0; i < count * cycles; i++) {
    probe.fps('test', { count: count });
  }

  var log = probe.getLog();

  assert.equals(log.length, cycles, 'Expected rows logged');

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = log[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var row = _step4.value;

      assert.equal(_typeof(row.total), 'number', 'Start is set');
      assert.equal(_typeof(row.delta), 'number', 'Delta is set');
      assert.equal(_typeof(row.fps), 'number', 'FPS is set');
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  assert.end();
});

(0, _tape2.default)('Probe#disable / Probe#enable', function (assert) {
  var probe = getInstance();

  assert.strictEqual(probe.isEnabled(), true, 'isEnabled matches expected');

  probe.disable();
  probe.probe('test_disabled');

  assert.strictEqual(probe.isEnabled(), false, 'isEnabled matches expected');
  assert.strictEqual(probe.getLog().length, 0, 'No row logged');

  probe.enable();
  probe.probe('test_enabled');

  assert.strictEqual(probe.isEnabled(), true, 'isEnabled matches expected');
  assert.strictEqual(probe.getLog().length, 1, 'Row logged');
  assert.strictEqual(probe.getLog()[0].name, 'test_enabled', 'Row name matches expected');

  assert.end();
});

(0, _tape2.default)('Probe#configure', function (assert) {
  var probe = getInstance().configure({
    level: 2,
    foo: 'bar'
  });

  assert.strictEqual(probe.getOption('level'), 2, 'Set known option');
  assert.strictEqual(probe.getOption('foo'), 'bar', 'Set unknown option');

  assert.end();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS90ZXN0L3Byb2JlLXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxTQUFTLFdBQVQsR0FBdUI7QUFDckIsU0FBTyxvQkFBVTtBQUNmLGVBQVcsSUFESTtBQUVmLG9CQUFnQixLQUZEO0FBR2YsdUJBQW1CO0FBSEosR0FBVixDQUFQO0FBS0Q7O0FBRUQsb0JBQUssYUFBTCxFQUFvQixrQkFBVTtBQUM1QixNQUFNLFFBQVEsYUFBZDs7QUFFQSxRQUFNLEtBQU4sQ0FBWSxNQUFaOztBQUVBLE1BQU0sTUFBTSxNQUFNLE1BQU4sRUFBWjtBQUNBLE1BQU0sTUFBTSxJQUFJLENBQUosQ0FBWjs7QUFFQSxTQUFPLE1BQVAsQ0FBYyxJQUFJLE1BQWxCLEVBQTBCLENBQTFCLEVBQ0UscUJBREY7QUFFQSxTQUFPLEtBQVAsQ0FBYSxJQUFJLElBQWpCLEVBQXVCLE1BQXZCLEVBQ0UsYUFERjtBQUVBLFNBQU8sS0FBUCxTQUFvQixJQUFJLEtBQXhCLEdBQStCLFFBQS9CLEVBQXlDLGNBQXpDO0FBQ0EsU0FBTyxLQUFQLFNBQW9CLElBQUksS0FBeEIsR0FBK0IsUUFBL0IsRUFBeUMsY0FBekM7O0FBRUEsU0FBTyxHQUFQO0FBQ0QsQ0FoQkQ7O0FBa0JBLG9CQUFLLDZCQUFMLEVBQW9DLGtCQUFVO0FBQzVDLE1BQU0sUUFBUSxjQUFjLFFBQWQsQ0FBdUIsQ0FBdkIsQ0FBZDs7QUFFQSxRQUFNLEtBQU4sQ0FBWSxPQUFaO0FBQ0EsUUFBTSxNQUFOLENBQWEsT0FBYjtBQUNBLFFBQU0sTUFBTixDQUFhLE9BQWI7QUFDQSxRQUFNLE1BQU4sQ0FBYSxPQUFiOztBQUVBLE1BQU0sTUFBTSxNQUFNLE1BQU4sRUFBWjs7QUFFQSxTQUFPLE1BQVAsQ0FBYyxJQUFJLE1BQWxCLEVBQTBCLENBQTFCLEVBQ0Usc0JBREY7QUFFQSxTQUFPLFNBQVAsQ0FDRSxJQUFJLEdBQUosQ0FBUTtBQUFBLFdB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TUFBTSxTQUFOLENBQWdCLEtBQWhCLENBQW5CLEVBQTJDLEtBQTNDLEVBQ0Usb0JBREY7O0FBR0EsU0FBTyxHQUFQO0FBQ0QsQ0FiRCIsImZpbGUiOiJwcm9iZS1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbmltcG9ydCBQcm9iZSBmcm9tICcuLi9zcmMvcHJvYmUnO1xuaW1wb3J0IHRlc3QgZnJvbSAndGFwZSc7XG5cbmZ1bmN0aW9uIGdldEluc3RhbmNlKCkge1xuICByZXR1cm4gbmV3IFByb2JlKHtcbiAgICBpc0VuYWJsZWQ6IHRydWUsXG4gICAgaXNQcmludEVuYWJsZWQ6IGZhbHNlLFxuICAgIGlnbm9yZUVudmlyb25tZW50OiB0cnVlXG4gIH0pO1xufVxuXG50ZXN0KCdQcm9iZSNwcm9iZScsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKTtcblxuICBwcm9iZS5wcm9iZSgndGVzdCcpO1xuXG4gIGNvbnN0IGxvZyA9IHByb2JlLmdldExvZygpO1xuICBjb25zdCByb3cgPSBsb2dbMF07XG5cbiAgYXNzZXJ0LmVxdWFscyhsb2cubGVuZ3RoLCAxLFxuICAgICdFeHBlY3RlZCByb3cgbG9nZ2VkJyk7XG4gIGFzc2VydC5lcXVhbChyb3cubmFtZSwgJ3Rlc3QnLFxuICAgICdOYW1lIGxvZ2dlZCcpO1xuICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy50b3RhbCwgJ251bWJlcicsICdTdGFydCBpcyBzZXQnKTtcbiAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuZGVsdGEsICdudW1iZXInLCAnRGVsdGEgaXMgc2V0Jyk7XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI3Byb2JlIC0gbGV2ZWwgbWV0aG9kcycsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKS5zZXRMZXZlbCgzKTtcblxuICBwcm9iZS5wcm9iZSgndGVzdDAnKTtcbiAgcHJvYmUucHJvYmUxKCd0ZXN0MScpO1xuICBwcm9iZS5wcm9iZTIoJ3Rlc3QyJyk7XG4gIHByb2JlLnByb2JlMygndGVzdDMnKTtcblxuICBjb25zdCBsb2cgPSBwcm9iZS5nZXRMb2coKTtcblxuICBhc3NlcnQuZXF1YWxzKGxvZy5sZW5ndGgsIDQsXG4gICAgJ0V4cGVjdGVkIHJvd3MgbG9nZ2VkJyk7XG4gIGFzc2VydC5kZWVwRXF1YWwoXG4gICAgbG9nLm1hcChyb3cgPT4gcm93LmxldmVsKSxcbiAgICBbMSwgMSwgMiwgM10sXG4gICAgJ0xldmVscyBtYXRjaCBleHBlY3RlZCcpO1xuICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgIGxvZy5tYXAocm93ID0+IHJvdy5uYW1lKSxcbiAgICBbJ3Rlc3QwJywgJ3Rlc3QxJywgJ3Rlc3QyJywgJ3Rlc3QzJ10sXG4gICAgJ05hbWVzIG1hdGNoIGV4cGVjdGVkJyk7XG5cbiAgZm9yIChjb25zdCByb3cgb2YgbG9nKSB7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cudG90YWwsICdudW1iZXInLCAnU3RhcnQgaXMgc2V0Jyk7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuZGVsdGEsICdudW1iZXInLCAnRGVsdGEgaXMgc2V0Jyk7XG4gIH1cblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjcHJvYmUgLSBsZXZlbCBtZXRob2RzLCBsb3dlciBsZXZlbCBzZXQnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCkuc2V0TGV2ZWwoMSk7XG5cbiAgcHJvYmUucHJvYmUoJ3Rlc3QwJyk7XG4gIHByb2JlLnByb2JlMSgndGVzdDEnKTtcbiAgcHJvYmUucHJvYmUyKCd0ZXN0MicpO1xuICBwcm9iZS5wcm9iZTMoJ3Rlc3QzJyk7XG5cbiAgY29uc3QgbG9nID0gcHJvYmUuZ2V0TG9nKCk7XG5cbiAgYXNzZXJ0LmVxdWFscyhsb2cubGVuZ3RoLCAyLFxuICAgICdFeHBlY3RlZCByb3dzIGxvZ2dlZCcpO1xuICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgIGxvZy5tYXAocm93ID0+IHJvdy5sZXZlbCksXG4gICAgWzEsIDFdLFxuICAgICdMZXZlbHMgbWF0Y2ggZXhwZWN0ZWQnKTtcblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjcHJvYmUgLSBkaXNhYmxlZCcsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKS5kaXNhYmxlKCk7XG5cbiAgcHJvYmUucHJvYmUoJ3Rlc3QwJyk7XG4gIHByb2JlLnByb2JlMSgndGVzdDEnKTtcbiAgcHJvYmUucHJvYmUyKCd0ZXN0MicpO1xuICBwcm9iZS5wcm9iZTMoJ3Rlc3QzJyk7XG5cbiAgY29uc3QgbG9nID0gcHJvYmUuZ2V0TG9nKCk7XG5cbiAgYXNzZXJ0LmVxdWFscyhsb2cubGVuZ3RoLCAwLFxuICAgICdObyByb3dzIGxvZ2dlZCcpO1xuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNzYW1wbGUgLSBsZXZlbCBtZXRob2RzJywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpLnNldExldmVsKDMpO1xuXG4gIHByb2JlLnNhbXBsZSgndGVzdDAnKTtcbiAgcHJvYmUuc2FtcGxlMSgndGVzdDEnKTtcbiAgcHJvYmUuc2FtcGxlMigndGVzdDInKTtcbiAgcHJvYmUuc2FtcGxlMygndGVzdDMnKTtcblxuICBjb25zdCBsb2cgPSBwcm9iZS5nZXRMb2coKTtcblxuICBhc3NlcnQuZXF1YWxzKGxvZy5sZW5ndGgsIDQsXG4gICAgJ0V4cGVjdGVkIHJvd3MgbG9nZ2VkJyk7XG4gIGFzc2VydC5kZWVwRXF1YWwoXG4gICAgbG9nLm1hcChyb3cgPT4gcm93LmxldmVsKSxcbiAgICBbMSwgMSwgMiwgM10sXG4gICAgJ0xldmVscyBtYXRjaCBleHBlY3RlZCcpO1xuICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgIGxvZy5tYXAocm93ID0+IHJvdy5uYW1lKSxcbiAgICBbJ3Rlc3QwJywgJ3Rlc3QxJywgJ3Rlc3QyJywgJ3Rlc3QzJ10sXG4gICAgJ05hbWVzIG1hdGNoIGV4cGVjdGVkJyk7XG5cbiAgZm9yIChjb25zdCByb3cgb2YgbG9nKSB7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cudG90YWwsICdudW1iZXInLCAnU3RhcnQgaXMgc2V0Jyk7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuZGVsdGEsICdudW1iZXInLCAnRGVsdGEgaXMgc2V0Jyk7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuYXZlcmFnZVRpbWUsICdudW1iZXInLCAnQXZnIHRpbWUgaXMgc2V0Jyk7XG4gIH1cblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjZnBzIC0gbGV2ZWwgbWV0aG9kcycsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKS5zZXRMZXZlbCgzKTtcbiAgY29uc3QgY291bnQgPSAzO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIHByb2JlLmZwcygndGVzdDAnLCB7Y291bnR9KTtcbiAgICBwcm9iZS5mcHMxKCd0ZXN0MScsIHtjb3VudH0pO1xuICAgIHByb2JlLmZwczIoJ3Rlc3QyJywge2NvdW50fSk7XG4gICAgcHJvYmUuZnBzMygndGVzdDMnLCB7Y291bnR9KTtcbiAgfVxuXG4gIGNvbnN0IGxvZyA9IHByb2JlLmdldExvZygpO1xuXG4gIGFzc2VydC5lcXVhbHMobG9nLmxlbmd0aCwgNCxcbiAgICAnRXhwZWN0ZWQgcm93cyBsb2dnZWQnKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChcbiAgICBsb2cubWFwKHJvdyA9PiByb3cubGV2ZWwpLFxuICAgIFsxLCAxLCAyLCAzXSxcbiAgICAnTGV2ZWxzIG1hdGNoIGV4cGVjdGVkJyk7XG4gIGFzc2VydC5kZWVwRXF1YWwoXG4gICAgbG9nLm1hcChyb3cgPT4gcm93Lm5hbWUpLFxuICAgIFsndGVzdDAnLCAndGVzdDEnLCAndGVzdDInLCAndGVzdDMnXSxcbiAgICAnTmFtZXMgbWF0Y2ggZXhwZWN0ZWQnKTtcblxuICBmb3IgKGNvbnN0IHJvdyBvZiBsb2cpIHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy50b3RhbCwgJ251bWJlcicsICdTdGFydCBpcyBzZXQnKTtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5kZWx0YSwgJ251bWJlcicsICdEZWx0YSBpcyBzZXQnKTtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5mcHMsICdudW1iZXInLCAnRlBTIGlzIHNldCcpO1xuICB9XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI2ZwcyAtIGxvZyBvbmNlIHBlciBjb3VudCcsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKS5zZXRMZXZlbCgzKTtcbiAgY29uc3QgY291bnQgPSAzO1xuICBjb25zdCBjeWNsZXMgPSA0O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQgKiBjeWNsZXM7IGkrKykge1xuICAgIHByb2JlLmZwcygndGVzdCcsIHtjb3VudH0pO1xuICB9XG5cbiAgY29uc3QgbG9nID0gcHJvYmUuZ2V0TG9nKCk7XG5cbiAgYXNzZXJ0LmVxdWFscyhsb2cubGVuZ3RoLCBjeWNsZXMsXG4gICAgJ0V4cGVjdGVkIHJvd3MgbG9nZ2VkJyk7XG5cbiAgZm9yIChjb25zdCByb3cgb2YgbG9nKSB7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cudG90YWwsICdudW1iZXInLCAnU3RhcnQgaXMgc2V0Jyk7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuZGVsdGEsICdudW1iZXInLCAnRGVsdGEgaXMgc2V0Jyk7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByb3cuZnBzLCAnbnVtYmVyJywgJ0ZQUyBpcyBzZXQnKTtcbiAgfVxuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNkaXNhYmxlIC8gUHJvYmUjZW5hYmxlJywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpO1xuXG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5pc0VuYWJsZWQoKSwgdHJ1ZSxcbiAgICAnaXNFbmFibGVkIG1hdGNoZXMgZXhwZWN0ZWQnKTtcblxuICBwcm9iZS5kaXNhYmxlKCk7XG4gIHByb2JlLnByb2JlKCd0ZXN0X2Rpc2FibGVkJyk7XG5cbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmlzRW5hYmxlZCgpLCBmYWxzZSxcbiAgICAnaXNFbmFibGVkIG1hdGNoZXMgZXhwZWN0ZWQnKTtcbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmdldExvZygpLmxlbmd0aCwgMCxcbiAgICAnTm8gcm93IGxvZ2dlZCcpO1xuXG4gIHByb2JlLmVuYWJsZSgpO1xuICBwcm9iZS5wcm9iZSgndGVzdF9lbmFibGVkJyk7XG5cbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmlzRW5hYmxlZCgpLCB0cnVlLFxuICAgICdpc0VuYWJsZWQgbWF0Y2hlcyBleHBlY3RlZCcpO1xuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuZ2V0TG9nKCkubGVuZ3RoLCAxLFxuICAgICdSb3cgbG9nZ2VkJyk7XG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5nZXRMb2coKVswXS5uYW1lLCAndGVzdF9lbmFibGVkJyxcbiAgICAnUm93IG5hbWUgbWF0Y2hlcyBleHBlY3RlZCcpO1xuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNjb25maWd1cmUnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKClcbiAgICAuY29uZmlndXJlKHtcbiAgICAgIGxldmVsOiAyLFxuICAgICAgZm9vOiAnYmFyJ1xuICAgIH0pO1xuXG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5nZXRPcHRpb24oJ2xldmVsJyksIDIsXG4gICAgJ1NldCBrbm93biBvcHRpb24nKTtcbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmdldE9wdGlvbignZm9vJyksICdiYXInLFxuICAgICdTZXQgdW5rbm93biBvcHRpb24nKTtcblxuICBhc3NlcnQuZW5kKCk7XG59KTtcbiJdfQ==