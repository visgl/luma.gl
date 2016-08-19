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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS90ZXN0L3Byb2JlLXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7a1BBQUE7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVMsV0FBVCxHQUF1QjtBQUNyQixTQUFPLG9CQUFVO0FBQ2YsZUFBVyxJQURJO0FBRWYsb0JBQWdCLEtBRkQ7QUFHZix1QkFBbUI7QUFISixHQUFWLENBQVA7QUFLRDs7QUFFRCxvQkFBSyxhQUFMLEVBQW9CLGtCQUFVO0FBQzVCLE1BQU0sUUFBUSxhQUFkOztBQUVBLFFBQU0sS0FBTixDQUFZLE1BQVo7O0FBRUEsTUFBTSxNQUFNLE1BQU0sTUFBTixFQUFaO0FBQ0EsTUFBTSxNQUFNLElBQUksQ0FBSixDQUFaOztBQUVBLFNBQU8sTUFBUCxDQUFjLElBQUksTUFBbEIsRUFBMEIsQ0FBMUIsRUFDRSxxQkFERjtBQUVBLFNBQU8sS0FBUCxDQUFhLElBQUksSUFBakIsRUFBdUIsTUFBdkIsRUFDRSxhQURGO0FBRUEsU0FBTyxLQUFQLFNBQW9CLElBQUksS0FBeEIsR0FBK0IsUUFBL0IsRUFBeUMsY0FBekM7QUFDQSxTQUFPLEtBQVAsU0FBb0IsSUFBSSxLQUF4QixHQUErQixRQUEvQixFQUF5QyxjQUF6Qzs7QUFFQSxTQUFPLEdBQVA7QUFDRCxDQWhCRDs7QUFrQkEsb0JBQUssNkJBQUwsRUFBb0Msa0JBQVU7QUFDNUMsTUFBTSxRQUFRLGNBQWMsUUFBZCxDQUF1QixDQUF2QixDQUFkOztBQUVBLFFBQU0sS0FBTixDQUFZLE9BQVo7QUFDQSxRQUFNLE1BQU4sQ0FBYSxPQUFiO0FBQ0EsUUFBTSxNQUFOLENBQWEsT0FBYjtBQUNBLFFBQU0sTUFBTixDQUFhLE9BQWI7O0FBRUEsTUFBTSxNQUFNLE1BQU0sTUFBTixFQUFaOztBQUVBLFNBQU8sTUFBUCxDQUFjLElBQUksTUFBbEIsRUFBMEIsQ0FBMUIsRUFDRSxzQkFERjtBQUVBLFNBQU8sU0FBUCxDQUNFLElBQUksR0FBSixDQUFRO0FB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QUFtQixNQUFNLFNBQU4sQ0FBZ0IsS0FBaEIsQ0FBbkIsRUFBMkMsS0FBM0MsRUFDRSxvQkFERjs7QUFHQSxTQUFPLEdBQVA7QUFDRCxDQWJEIiwiZmlsZSI6InByb2JlLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuaW1wb3J0IFByb2JlIGZyb20gJy4uL3NyYy9wcm9iZSc7XG5pbXBvcnQgdGVzdCBmcm9tICd0YXBlJztcblxuZnVuY3Rpb24gZ2V0SW5zdGFuY2UoKSB7XG4gIHJldHVybiBuZXcgUHJvYmUoe1xuICAgIGlzRW5hYmxlZDogdHJ1ZSxcbiAgICBpc1ByaW50RW5hYmxlZDogZmFsc2UsXG4gICAgaWdub3JlRW52aXJvbm1lbnQ6IHRydWVcbiAgfSk7XG59XG5cbnRlc3QoJ1Byb2JlI3Byb2JlJywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpO1xuXG4gIHByb2JlLnByb2JlKCd0ZXN0Jyk7XG5cbiAgY29uc3QgbG9nID0gcHJvYmUuZ2V0TG9nKCk7XG4gIGNvbnN0IHJvdyA9IGxvZ1swXTtcblxuICBhc3NlcnQuZXF1YWxzKGxvZy5sZW5ndGgsIDEsXG4gICAgJ0V4cGVjdGVkIHJvdyBsb2dnZWQnKTtcbiAgYXNzZXJ0LmVxdWFsKHJvdy5uYW1lLCAndGVzdCcsXG4gICAgJ05hbWUgbG9nZ2VkJyk7XG4gIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LnRvdGFsLCAnbnVtYmVyJywgJ1N0YXJ0IGlzIHNldCcpO1xuICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5kZWx0YSwgJ251bWJlcicsICdEZWx0YSBpcyBzZXQnKTtcblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjcHJvYmUgLSBsZXZlbCBtZXRob2RzJywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpLnNldExldmVsKDMpO1xuXG4gIHByb2JlLnByb2JlKCd0ZXN0MCcpO1xuICBwcm9iZS5wcm9iZTEoJ3Rlc3QxJyk7XG4gIHByb2JlLnByb2JlMigndGVzdDInKTtcbiAgcHJvYmUucHJvYmUzKCd0ZXN0MycpO1xuXG4gIGNvbnN0IGxvZyA9IHByb2JlLmdldExvZygpO1xuXG4gIGFzc2VydC5lcXVhbHMobG9nLmxlbmd0aCwgNCxcbiAgICAnRXhwZWN0ZWQgcm93cyBsb2dnZWQnKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChcbiAgICBsb2cubWFwKHJvdyA9PiByb3cubGV2ZWwpLFxuICAgIFsxLCAxLCAyLCAzXSxcbiAgICAnTGV2ZWxzIG1hdGNoIGV4cGVjdGVkJyk7XG4gIGFzc2VydC5kZWVwRXF1YWwoXG4gICAgbG9nLm1hcChyb3cgPT4gcm93Lm5hbWUpLFxuICAgIFsndGVzdDAnLCAndGVzdDEnLCAndGVzdDInLCAndGVzdDMnXSxcbiAgICAnTmFtZXMgbWF0Y2ggZXhwZWN0ZWQnKTtcblxuICBmb3IgKGNvbnN0IHJvdyBvZiBsb2cpIHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy50b3RhbCwgJ251bWJlcicsICdTdGFydCBpcyBzZXQnKTtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5kZWx0YSwgJ251bWJlcicsICdEZWx0YSBpcyBzZXQnKTtcbiAgfVxuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNwcm9iZSAtIGxldmVsIG1ldGhvZHMsIGxvd2VyIGxldmVsIHNldCcsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKS5zZXRMZXZlbCgxKTtcblxuICBwcm9iZS5wcm9iZSgndGVzdDAnKTtcbiAgcHJvYmUucHJvYmUxKCd0ZXN0MScpO1xuICBwcm9iZS5wcm9iZTIoJ3Rlc3QyJyk7XG4gIHByb2JlLnByb2JlMygndGVzdDMnKTtcblxuICBjb25zdCBsb2cgPSBwcm9iZS5nZXRMb2coKTtcblxuICBhc3NlcnQuZXF1YWxzKGxvZy5sZW5ndGgsIDIsXG4gICAgJ0V4cGVjdGVkIHJvd3MgbG9nZ2VkJyk7XG4gIGFzc2VydC5kZWVwRXF1YWwoXG4gICAgbG9nLm1hcChyb3cgPT4gcm93LmxldmVsKSxcbiAgICBbMSwgMV0sXG4gICAgJ0xldmVscyBtYXRjaCBleHBlY3RlZCcpO1xuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNwcm9iZSAtIGRpc2FibGVkJywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpLmRpc2FibGUoKTtcblxuICBwcm9iZS5wcm9iZSgndGVzdDAnKTtcbiAgcHJvYmUucHJvYmUxKCd0ZXN0MScpO1xuICBwcm9iZS5wcm9iZTIoJ3Rlc3QyJyk7XG4gIHByb2JlLnByb2JlMygndGVzdDMnKTtcblxuICBjb25zdCBsb2cgPSBwcm9iZS5nZXRMb2coKTtcblxuICBhc3NlcnQuZXF1YWxzKGxvZy5sZW5ndGgsIDAsXG4gICAgJ05vIHJvd3MgbG9nZ2VkJyk7XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI3NhbXBsZSAtIGxldmVsIG1ldGhvZHMnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCkuc2V0TGV2ZWwoMyk7XG5cbiAgcHJvYmUuc2FtcGxlKCd0ZXN0MCcpO1xuICBwcm9iZS5zYW1wbGUxKCd0ZXN0MScpO1xuICBwcm9iZS5zYW1wbGUyKCd0ZXN0MicpO1xuICBwcm9iZS5zYW1wbGUzKCd0ZXN0MycpO1xuXG4gIGNvbnN0IGxvZyA9IHByb2JlLmdldExvZygpO1xuXG4gIGFzc2VydC5lcXVhbHMobG9nLmxlbmd0aCwgNCxcbiAgICAnRXhwZWN0ZWQgcm93cyBsb2dnZWQnKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChcbiAgICBsb2cubWFwKHJvdyA9PiByb3cubGV2ZWwpLFxuICAgIFsxLCAxLCAyLCAzXSxcbiAgICAnTGV2ZWxzIG1hdGNoIGV4cGVjdGVkJyk7XG4gIGFzc2VydC5kZWVwRXF1YWwoXG4gICAgbG9nLm1hcChyb3cgPT4gcm93Lm5hbWUpLFxuICAgIFsndGVzdDAnLCAndGVzdDEnLCAndGVzdDInLCAndGVzdDMnXSxcbiAgICAnTmFtZXMgbWF0Y2ggZXhwZWN0ZWQnKTtcblxuICBmb3IgKGNvbnN0IHJvdyBvZiBsb2cpIHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy50b3RhbCwgJ251bWJlcicsICdTdGFydCBpcyBzZXQnKTtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5kZWx0YSwgJ251bWJlcicsICdEZWx0YSBpcyBzZXQnKTtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5hdmVyYWdlVGltZSwgJ251bWJlcicsICdBdmcgdGltZSBpcyBzZXQnKTtcbiAgfVxuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuXG50ZXN0KCdQcm9iZSNmcHMgLSBsZXZlbCBtZXRob2RzJywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpLnNldExldmVsKDMpO1xuICBjb25zdCBjb3VudCA9IDM7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgcHJvYmUuZnBzKCd0ZXN0MCcsIHtjb3VudH0pO1xuICAgIHByb2JlLmZwczEoJ3Rlc3QxJywge2NvdW50fSk7XG4gICAgcHJvYmUuZnBzMigndGVzdDInLCB7Y291bnR9KTtcbiAgICBwcm9iZS5mcHMzKCd0ZXN0MycsIHtjb3VudH0pO1xuICB9XG5cbiAgY29uc3QgbG9nID0gcHJvYmUuZ2V0TG9nKCk7XG5cbiAgYXNzZXJ0LmVxdWFscyhsb2cubGVuZ3RoLCA0LFxuICAgICdFeHBlY3RlZCByb3dzIGxvZ2dlZCcpO1xuICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgIGxvZy5tYXAocm93ID0+IHJvdy5sZXZlbCksXG4gICAgWzEsIDEsIDIsIDNdLFxuICAgICdMZXZlbHMgbWF0Y2ggZXhwZWN0ZWQnKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChcbiAgICBsb2cubWFwKHJvdyA9PiByb3cubmFtZSksXG4gICAgWyd0ZXN0MCcsICd0ZXN0MScsICd0ZXN0MicsICd0ZXN0MyddLFxuICAgICdOYW1lcyBtYXRjaCBleHBlY3RlZCcpO1xuXG4gIGZvciAoY29uc3Qgcm93IG9mIGxvZykge1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LnRvdGFsLCAnbnVtYmVyJywgJ1N0YXJ0IGlzIHNldCcpO1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmRlbHRhLCAnbnVtYmVyJywgJ0RlbHRhIGlzIHNldCcpO1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2Ygcm93LmZwcywgJ251bWJlcicsICdGUFMgaXMgc2V0Jyk7XG4gIH1cblxuICBhc3NlcnQuZW5kKCk7XG59KTtcblxudGVzdCgnUHJvYmUjZnBzIC0gbG9nIG9uY2UgcGVyIGNvdW50JywgYXNzZXJ0ID0+IHtcbiAgY29uc3QgcHJvYmUgPSBnZXRJbnN0YW5jZSgpLnNldExldmVsKDMpO1xuICBjb25zdCBjb3VudCA9IDM7XG4gIGNvbnN0IGN5Y2xlcyA9IDQ7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudCAqIGN5Y2xlczsgaSsrKSB7XG4gICAgcHJvYmUuZnBzKCd0ZXN0Jywge2NvdW50fSk7XG4gIH1cblxuICBjb25zdCBsb2cgPSBwcm9iZS5nZXRMb2coKTtcblxuICBhc3NlcnQuZXF1YWxzKGxvZy5sZW5ndGgsIGN5Y2xlcyxcbiAgICAnRXhwZWN0ZWQgcm93cyBsb2dnZWQnKTtcblxuICBmb3IgKGNvbnN0IHJvdyBvZiBsb2cpIHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy50b3RhbCwgJ251bWJlcicsICdTdGFydCBpcyBzZXQnKTtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5kZWx0YSwgJ251bWJlcicsICdEZWx0YSBpcyBzZXQnKTtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHJvdy5mcHMsICdudW1iZXInLCAnRlBTIGlzIHNldCcpO1xuICB9XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI2Rpc2FibGUgLyBQcm9iZSNlbmFibGUnLCBhc3NlcnQgPT4ge1xuICBjb25zdCBwcm9iZSA9IGdldEluc3RhbmNlKCk7XG5cbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmlzRW5hYmxlZCgpLCB0cnVlLFxuICAgICdpc0VuYWJsZWQgbWF0Y2hlcyBleHBlY3RlZCcpO1xuXG4gIHByb2JlLmRpc2FibGUoKTtcbiAgcHJvYmUucHJvYmUoJ3Rlc3RfZGlzYWJsZWQnKTtcblxuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuaXNFbmFibGVkKCksIGZhbHNlLFxuICAgICdpc0VuYWJsZWQgbWF0Y2hlcyBleHBlY3RlZCcpO1xuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuZ2V0TG9nKCkubGVuZ3RoLCAwLFxuICAgICdObyByb3cgbG9nZ2VkJyk7XG5cbiAgcHJvYmUuZW5hYmxlKCk7XG4gIHByb2JlLnByb2JlKCd0ZXN0X2VuYWJsZWQnKTtcblxuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuaXNFbmFibGVkKCksIHRydWUsXG4gICAgJ2lzRW5hYmxlZCBtYXRjaGVzIGV4cGVjdGVkJyk7XG4gIGFzc2VydC5zdHJpY3RFcXVhbChwcm9iZS5nZXRMb2coKS5sZW5ndGgsIDEsXG4gICAgJ1JvdyBsb2dnZWQnKTtcbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmdldExvZygpWzBdLm5hbWUsICd0ZXN0X2VuYWJsZWQnLFxuICAgICdSb3cgbmFtZSBtYXRjaGVzIGV4cGVjdGVkJyk7XG5cbiAgYXNzZXJ0LmVuZCgpO1xufSk7XG5cbnRlc3QoJ1Byb2JlI2NvbmZpZ3VyZScsIGFzc2VydCA9PiB7XG4gIGNvbnN0IHByb2JlID0gZ2V0SW5zdGFuY2UoKVxuICAgIC5jb25maWd1cmUoe1xuICAgICAgbGV2ZWw6IDIsXG4gICAgICBmb286ICdiYXInXG4gICAgfSk7XG5cbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHByb2JlLmdldE9wdGlvbignbGV2ZWwnKSwgMixcbiAgICAnU2V0IGtub3duIG9wdGlvbicpO1xuICBhc3NlcnQuc3RyaWN0RXF1YWwocHJvYmUuZ2V0T3B0aW9uKCdmb28nKSwgJ2JhcicsXG4gICAgJ1NldCB1bmtub3duIG9wdGlvbicpO1xuXG4gIGFzc2VydC5lbmQoKTtcbn0pO1xuIl19