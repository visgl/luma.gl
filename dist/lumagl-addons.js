(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":5}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
module.exports = function (uri) {
    var mime   = uri.split(',')[0].split(':')[1].split(';')[0];
    var bytes  = atob(uri.split(',')[1]);
    var len    = bytes.length;
    var buffer = new window.ArrayBuffer(len);
    var arr    = new window.Uint8Array(buffer);

    for (var i = 0; i < len; i++) {
        arr[i] = bytes.charCodeAt(i);
    }

    return new Blob([arr], { type: mime });
}

// IE >= 10, most modern browsers
// The Blob type can't be polyfilled, which is why there aren't any polyfills for TypedArrays for older IE's
module.exports.supported = (
    typeof window.HTMLCanvasElement !== 'undefined' &&
    typeof window.atob !== 'undefined' &&
    typeof window.Blob !== 'undefined' &&
    typeof window.ArrayBuffer !== 'undefined' &&
    typeof window.Uint8Array !== 'undefined'
);

module.exports.init = function () {
    if (!module.exports.supported) return;
    var CanvasPrototype = window.HTMLCanvasElement.prototype;
    
    if (!CanvasPrototype.toBlob && CanvasPrototype.toDataURL) {
        CanvasPrototype.toBlob = function (callback, type, quality) {
            callback(module.exports(this.toDataURL(type, quality)));
        }
    }
}

},{}],7:[function(require,module,exports){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.1.20150716
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
		// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
		// for the reasoning behind the timeout and revocation flow
		, arbitrary_revoke_timeout = 500 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			if (view.chrome) {
				revoker();
			} else {
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob(["\ufeff", blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && typeof safari !== "undefined") {
							//Apple do not allow window.open, see http://bit.ly/1kZffRI
							view.location.href = object_url
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				save_link.href = object_url;
				save_link.download = name;
				setTimeout(function() {
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			// Update: Google errantly closed 91158, I submitted it again:
			// https://code.google.com/p/chromium/issues/detail?id=389642
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
									revoke(file);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name, no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name || "download");
		};
	}

	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define([], function() {
    return saveAs;
  });
}

},{}],8:[function(require,module,exports){

var sprintf = require('sprintf-js').sprintf;
var glConstants = require('gl-constants/lookup');
var shaderName = require('glsl-shader-name');
var addLineNumbers = require('add-line-numbers');

module.exports = formatCompilerError;

function formatCompilerError(errLog, src, type) {
    "use strict";

    var name = shaderName(src) || 'of unknown name (see npm glsl-shader-name)';

    var typeName = 'unknown type';
    if (type !== undefined) {
        typeName = type === glConstants.FRAGMENT_SHADER ? 'fragment' : 'vertex'
    }

    var longForm = sprintf('Error compiling %s shader %s:\n', typeName, name);
    var shortForm = sprintf("%s%s", longForm, errLog);

    var errorStrings = errLog.split('\n');
    var errors = {};

    for (var i = 0; i < errorStrings.length; i++) {
        var errorString = errorStrings[i];
        if (errorString === '') continue;
        var lineNo = parseInt(errorString.split(':')[2]);
        if (isNaN(lineNo)) {
            throw new Error(sprintf('Could not parse error: %s', errorString));
        }
        errors[lineNo] = errorString;
    }

    var lines = addLineNumbers(src).split('\n');

    for (var i = 0; i < lines.length; i++) {
        if (!errors[i+3] && !errors[i+2] && !errors[i+1]) continue;
        var line = lines[i];
        longForm += line + '\n';
        if (errors[i+1]) {
            var e = errors[i+1];
            e = e.substr(e.split(':', 3).join(':').length + 1).trim();
            longForm += sprintf('^^^ %s\n\n', e);
        }
    }

    return {
        long: longForm.trim(),
        short: shortForm.trim()
    };
}


},{"add-line-numbers":9,"gl-constants/lookup":13,"glsl-shader-name":14,"sprintf-js":23}],9:[function(require,module,exports){
var padLeft = require('pad-left')

module.exports = addLineNumbers
function addLineNumbers (string, start, delim) {
  start = typeof start === 'number' ? start : 1
  delim = delim || ': '

  var lines = string.split(/\r?\n/)
  var totalDigits = String(lines.length + start - 1).length
  return lines.map(function (line, i) {
    var c = i + start
    var digits = String(c).length
    var prefix = padLeft(c, totalDigits - digits)
    return prefix + delim + line
  }).join('\n')
}

},{"pad-left":10}],10:[function(require,module,exports){
/*!
 * pad-left <https://github.com/jonschlinkert/pad-left>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

var repeat = require('repeat-string');

module.exports = function padLeft(str, num, ch) {
  ch = typeof ch !== 'undefined' ? (ch + '') : ' ';
  return repeat(ch, num) + str;
};
},{"repeat-string":11}],11:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Results cache
 */

var res = '';
var cache;

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('repeat-string expects a string.');
  }

  // cover common, quick use cases
  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  }

  while (max > res.length && num > 0) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    if (!num) break;
    str += str;
  }

  return res.substr(0, max);
}


},{}],12:[function(require,module,exports){
module.exports = {
  0: 'NONE',
  1: 'ONE',
  2: 'LINE_LOOP',
  3: 'LINE_STRIP',
  4: 'TRIANGLES',
  5: 'TRIANGLE_STRIP',
  6: 'TRIANGLE_FAN',
  256: 'DEPTH_BUFFER_BIT',
  512: 'NEVER',
  513: 'LESS',
  514: 'EQUAL',
  515: 'LEQUAL',
  516: 'GREATER',
  517: 'NOTEQUAL',
  518: 'GEQUAL',
  519: 'ALWAYS',
  768: 'SRC_COLOR',
  769: 'ONE_MINUS_SRC_COLOR',
  770: 'SRC_ALPHA',
  771: 'ONE_MINUS_SRC_ALPHA',
  772: 'DST_ALPHA',
  773: 'ONE_MINUS_DST_ALPHA',
  774: 'DST_COLOR',
  775: 'ONE_MINUS_DST_COLOR',
  776: 'SRC_ALPHA_SATURATE',
  1024: 'STENCIL_BUFFER_BIT',
  1028: 'FRONT',
  1029: 'BACK',
  1032: 'FRONT_AND_BACK',
  1280: 'INVALID_ENUM',
  1281: 'INVALID_VALUE',
  1282: 'INVALID_OPERATION',
  1285: 'OUT_OF_MEMORY',
  1286: 'INVALID_FRAMEBUFFER_OPERATION',
  2304: 'CW',
  2305: 'CCW',
  2849: 'LINE_WIDTH',
  2884: 'CULL_FACE',
  2885: 'CULL_FACE_MODE',
  2886: 'FRONT_FACE',
  2928: 'DEPTH_RANGE',
  2929: 'DEPTH_TEST',
  2930: 'DEPTH_WRITEMASK',
  2931: 'DEPTH_CLEAR_VALUE',
  2932: 'DEPTH_FUNC',
  2960: 'STENCIL_TEST',
  2961: 'STENCIL_CLEAR_VALUE',
  2962: 'STENCIL_FUNC',
  2963: 'STENCIL_VALUE_MASK',
  2964: 'STENCIL_FAIL',
  2965: 'STENCIL_PASS_DEPTH_FAIL',
  2966: 'STENCIL_PASS_DEPTH_PASS',
  2967: 'STENCIL_REF',
  2968: 'STENCIL_WRITEMASK',
  2978: 'VIEWPORT',
  3024: 'DITHER',
  3042: 'BLEND',
  3088: 'SCISSOR_BOX',
  3089: 'SCISSOR_TEST',
  3106: 'COLOR_CLEAR_VALUE',
  3107: 'COLOR_WRITEMASK',
  3317: 'UNPACK_ALIGNMENT',
  3333: 'PACK_ALIGNMENT',
  3379: 'MAX_TEXTURE_SIZE',
  3386: 'MAX_VIEWPORT_DIMS',
  3408: 'SUBPIXEL_BITS',
  3410: 'RED_BITS',
  3411: 'GREEN_BITS',
  3412: 'BLUE_BITS',
  3413: 'ALPHA_BITS',
  3414: 'DEPTH_BITS',
  3415: 'STENCIL_BITS',
  3553: 'TEXTURE_2D',
  4352: 'DONT_CARE',
  4353: 'FASTEST',
  4354: 'NICEST',
  5120: 'BYTE',
  5121: 'UNSIGNED_BYTE',
  5122: 'SHORT',
  5123: 'UNSIGNED_SHORT',
  5124: 'INT',
  5125: 'UNSIGNED_INT',
  5126: 'FLOAT',
  5386: 'INVERT',
  5890: 'TEXTURE',
  6401: 'STENCIL_INDEX',
  6402: 'DEPTH_COMPONENT',
  6406: 'ALPHA',
  6407: 'RGB',
  6408: 'RGBA',
  6409: 'LUMINANCE',
  6410: 'LUMINANCE_ALPHA',
  7680: 'KEEP',
  7681: 'REPLACE',
  7682: 'INCR',
  7683: 'DECR',
  7936: 'VENDOR',
  7937: 'RENDERER',
  7938: 'VERSION',
  9728: 'NEAREST',
  9729: 'LINEAR',
  9984: 'NEAREST_MIPMAP_NEAREST',
  9985: 'LINEAR_MIPMAP_NEAREST',
  9986: 'NEAREST_MIPMAP_LINEAR',
  9987: 'LINEAR_MIPMAP_LINEAR',
  10240: 'TEXTURE_MAG_FILTER',
  10241: 'TEXTURE_MIN_FILTER',
  10242: 'TEXTURE_WRAP_S',
  10243: 'TEXTURE_WRAP_T',
  10497: 'REPEAT',
  10752: 'POLYGON_OFFSET_UNITS',
  16384: 'COLOR_BUFFER_BIT',
  32769: 'CONSTANT_COLOR',
  32770: 'ONE_MINUS_CONSTANT_COLOR',
  32771: 'CONSTANT_ALPHA',
  32772: 'ONE_MINUS_CONSTANT_ALPHA',
  32773: 'BLEND_COLOR',
  32774: 'FUNC_ADD',
  32777: 'BLEND_EQUATION_RGB',
  32778: 'FUNC_SUBTRACT',
  32779: 'FUNC_REVERSE_SUBTRACT',
  32819: 'UNSIGNED_SHORT_4_4_4_4',
  32820: 'UNSIGNED_SHORT_5_5_5_1',
  32823: 'POLYGON_OFFSET_FILL',
  32824: 'POLYGON_OFFSET_FACTOR',
  32854: 'RGBA4',
  32855: 'RGB5_A1',
  32873: 'TEXTURE_BINDING_2D',
  32926: 'SAMPLE_ALPHA_TO_COVERAGE',
  32928: 'SAMPLE_COVERAGE',
  32936: 'SAMPLE_BUFFERS',
  32937: 'SAMPLES',
  32938: 'SAMPLE_COVERAGE_VALUE',
  32939: 'SAMPLE_COVERAGE_INVERT',
  32968: 'BLEND_DST_RGB',
  32969: 'BLEND_SRC_RGB',
  32970: 'BLEND_DST_ALPHA',
  32971: 'BLEND_SRC_ALPHA',
  33071: 'CLAMP_TO_EDGE',
  33170: 'GENERATE_MIPMAP_HINT',
  33189: 'DEPTH_COMPONENT16',
  33306: 'DEPTH_STENCIL_ATTACHMENT',
  33635: 'UNSIGNED_SHORT_5_6_5',
  33648: 'MIRRORED_REPEAT',
  33901: 'ALIASED_POINT_SIZE_RANGE',
  33902: 'ALIASED_LINE_WIDTH_RANGE',
  33984: 'TEXTURE0',
  33985: 'TEXTURE1',
  33986: 'TEXTURE2',
  33987: 'TEXTURE3',
  33988: 'TEXTURE4',
  33989: 'TEXTURE5',
  33990: 'TEXTURE6',
  33991: 'TEXTURE7',
  33992: 'TEXTURE8',
  33993: 'TEXTURE9',
  33994: 'TEXTURE10',
  33995: 'TEXTURE11',
  33996: 'TEXTURE12',
  33997: 'TEXTURE13',
  33998: 'TEXTURE14',
  33999: 'TEXTURE15',
  34000: 'TEXTURE16',
  34001: 'TEXTURE17',
  34002: 'TEXTURE18',
  34003: 'TEXTURE19',
  34004: 'TEXTURE20',
  34005: 'TEXTURE21',
  34006: 'TEXTURE22',
  34007: 'TEXTURE23',
  34008: 'TEXTURE24',
  34009: 'TEXTURE25',
  34010: 'TEXTURE26',
  34011: 'TEXTURE27',
  34012: 'TEXTURE28',
  34013: 'TEXTURE29',
  34014: 'TEXTURE30',
  34015: 'TEXTURE31',
  34016: 'ACTIVE_TEXTURE',
  34024: 'MAX_RENDERBUFFER_SIZE',
  34041: 'DEPTH_STENCIL',
  34055: 'INCR_WRAP',
  34056: 'DECR_WRAP',
  34067: 'TEXTURE_CUBE_MAP',
  34068: 'TEXTURE_BINDING_CUBE_MAP',
  34069: 'TEXTURE_CUBE_MAP_POSITIVE_X',
  34070: 'TEXTURE_CUBE_MAP_NEGATIVE_X',
  34071: 'TEXTURE_CUBE_MAP_POSITIVE_Y',
  34072: 'TEXTURE_CUBE_MAP_NEGATIVE_Y',
  34073: 'TEXTURE_CUBE_MAP_POSITIVE_Z',
  34074: 'TEXTURE_CUBE_MAP_NEGATIVE_Z',
  34076: 'MAX_CUBE_MAP_TEXTURE_SIZE',
  34338: 'VERTEX_ATTRIB_ARRAY_ENABLED',
  34339: 'VERTEX_ATTRIB_ARRAY_SIZE',
  34340: 'VERTEX_ATTRIB_ARRAY_STRIDE',
  34341: 'VERTEX_ATTRIB_ARRAY_TYPE',
  34342: 'CURRENT_VERTEX_ATTRIB',
  34373: 'VERTEX_ATTRIB_ARRAY_POINTER',
  34466: 'NUM_COMPRESSED_TEXTURE_FORMATS',
  34467: 'COMPRESSED_TEXTURE_FORMATS',
  34660: 'BUFFER_SIZE',
  34661: 'BUFFER_USAGE',
  34816: 'STENCIL_BACK_FUNC',
  34817: 'STENCIL_BACK_FAIL',
  34818: 'STENCIL_BACK_PASS_DEPTH_FAIL',
  34819: 'STENCIL_BACK_PASS_DEPTH_PASS',
  34877: 'BLEND_EQUATION_ALPHA',
  34921: 'MAX_VERTEX_ATTRIBS',
  34922: 'VERTEX_ATTRIB_ARRAY_NORMALIZED',
  34930: 'MAX_TEXTURE_IMAGE_UNITS',
  34962: 'ARRAY_BUFFER',
  34963: 'ELEMENT_ARRAY_BUFFER',
  34964: 'ARRAY_BUFFER_BINDING',
  34965: 'ELEMENT_ARRAY_BUFFER_BINDING',
  34975: 'VERTEX_ATTRIB_ARRAY_BUFFER_BINDING',
  35040: 'STREAM_DRAW',
  35044: 'STATIC_DRAW',
  35048: 'DYNAMIC_DRAW',
  35632: 'FRAGMENT_SHADER',
  35633: 'VERTEX_SHADER',
  35660: 'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
  35661: 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
  35663: 'SHADER_TYPE',
  35664: 'FLOAT_VEC2',
  35665: 'FLOAT_VEC3',
  35666: 'FLOAT_VEC4',
  35667: 'INT_VEC2',
  35668: 'INT_VEC3',
  35669: 'INT_VEC4',
  35670: 'BOOL',
  35671: 'BOOL_VEC2',
  35672: 'BOOL_VEC3',
  35673: 'BOOL_VEC4',
  35674: 'FLOAT_MAT2',
  35675: 'FLOAT_MAT3',
  35676: 'FLOAT_MAT4',
  35678: 'SAMPLER_2D',
  35680: 'SAMPLER_CUBE',
  35712: 'DELETE_STATUS',
  35713: 'COMPILE_STATUS',
  35714: 'LINK_STATUS',
  35715: 'VALIDATE_STATUS',
  35716: 'INFO_LOG_LENGTH',
  35717: 'ATTACHED_SHADERS',
  35718: 'ACTIVE_UNIFORMS',
  35719: 'ACTIVE_UNIFORM_MAX_LENGTH',
  35720: 'SHADER_SOURCE_LENGTH',
  35721: 'ACTIVE_ATTRIBUTES',
  35722: 'ACTIVE_ATTRIBUTE_MAX_LENGTH',
  35724: 'SHADING_LANGUAGE_VERSION',
  35725: 'CURRENT_PROGRAM',
  36003: 'STENCIL_BACK_REF',
  36004: 'STENCIL_BACK_VALUE_MASK',
  36005: 'STENCIL_BACK_WRITEMASK',
  36006: 'FRAMEBUFFER_BINDING',
  36007: 'RENDERBUFFER_BINDING',
  36048: 'FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE',
  36049: 'FRAMEBUFFER_ATTACHMENT_OBJECT_NAME',
  36050: 'FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL',
  36051: 'FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE',
  36053: 'FRAMEBUFFER_COMPLETE',
  36054: 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT',
  36055: 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT',
  36057: 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS',
  36061: 'FRAMEBUFFER_UNSUPPORTED',
  36064: 'COLOR_ATTACHMENT0',
  36096: 'DEPTH_ATTACHMENT',
  36128: 'STENCIL_ATTACHMENT',
  36160: 'FRAMEBUFFER',
  36161: 'RENDERBUFFER',
  36162: 'RENDERBUFFER_WIDTH',
  36163: 'RENDERBUFFER_HEIGHT',
  36164: 'RENDERBUFFER_INTERNAL_FORMAT',
  36168: 'STENCIL_INDEX8',
  36176: 'RENDERBUFFER_RED_SIZE',
  36177: 'RENDERBUFFER_GREEN_SIZE',
  36178: 'RENDERBUFFER_BLUE_SIZE',
  36179: 'RENDERBUFFER_ALPHA_SIZE',
  36180: 'RENDERBUFFER_DEPTH_SIZE',
  36181: 'RENDERBUFFER_STENCIL_SIZE',
  36194: 'RGB565',
  36336: 'LOW_FLOAT',
  36337: 'MEDIUM_FLOAT',
  36338: 'HIGH_FLOAT',
  36339: 'LOW_INT',
  36340: 'MEDIUM_INT',
  36341: 'HIGH_INT',
  36346: 'SHADER_COMPILER',
  36347: 'MAX_VERTEX_UNIFORM_VECTORS',
  36348: 'MAX_VARYING_VECTORS',
  36349: 'MAX_FRAGMENT_UNIFORM_VECTORS',
  37440: 'UNPACK_FLIP_Y_WEBGL',
  37441: 'UNPACK_PREMULTIPLY_ALPHA_WEBGL',
  37442: 'CONTEXT_LOST_WEBGL',
  37443: 'UNPACK_COLORSPACE_CONVERSION_WEBGL',
  37444: 'BROWSER_DEFAULT_WEBGL'
}

},{}],13:[function(require,module,exports){
var gl10 = require('./1.0/numbers')

module.exports = function lookupConstant (number) {
  return gl10[number]
}

},{"./1.0/numbers":12}],14:[function(require,module,exports){
var tokenize = require('glsl-tokenizer')
var atob     = require('atob-lite')

module.exports = getName

function getName(src) {
  var tokens = Array.isArray(src)
    ? src
    : tokenize(src)

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]
    if (token.type !== 'preprocessor') continue
    var match = token.data.match(/\#define\s+SHADER_NAME(_B64)?\s+(.+)$/)
    if (!match) continue
    if (!match[2]) continue

    var b64  = match[1]
    var name = match[2]

    return (b64 ? atob(name) : name).trim()
  }
}

},{"atob-lite":15,"glsl-tokenizer":22}],15:[function(require,module,exports){
module.exports = function _atob(str) {
  return atob(str)
}

},{}],16:[function(require,module,exports){
module.exports = tokenize

var literals100 = require('./lib/literals')
  , operators = require('./lib/operators')
  , builtins100 = require('./lib/builtins')
  , literals300es = require('./lib/literals-300es')
  , builtins300es = require('./lib/builtins-300es')

var NORMAL = 999          // <-- never emitted
  , TOKEN = 9999          // <-- never emitted
  , BLOCK_COMMENT = 0
  , LINE_COMMENT = 1
  , PREPROCESSOR = 2
  , OPERATOR = 3
  , INTEGER = 4
  , FLOAT = 5
  , IDENT = 6
  , BUILTIN = 7
  , KEYWORD = 8
  , WHITESPACE = 9
  , EOF = 10
  , HEX = 11

var map = [
    'block-comment'
  , 'line-comment'
  , 'preprocessor'
  , 'operator'
  , 'integer'
  , 'float'
  , 'ident'
  , 'builtin'
  , 'keyword'
  , 'whitespace'
  , 'eof'
  , 'integer'
]

function tokenize(opt) {
  var i = 0
    , total = 0
    , mode = NORMAL
    , c
    , last
    , content = []
    , tokens = []
    , token_idx = 0
    , token_offs = 0
    , line = 1
    , col = 0
    , start = 0
    , isnum = false
    , isoperator = false
    , input = ''
    , len

  opt = opt || {}
  var allBuiltins = builtins100
  var allLiterals = literals100
  if (opt.version === '300 es') {
    allBuiltins = builtins300es
    allLiterals = literals300es
  }

  return function(data) {
    tokens = []
    if (data !== null) return write(data)
    return end()
  }

  function token(data) {
    if (data.length) {
      tokens.push({
        type: map[mode]
      , data: data
      , position: start
      , line: line
      , column: col
      })
    }
  }

  function write(chunk) {
    i = 0
    input += chunk
    len = input.length

    var last

    while(c = input[i], i < len) {
      last = i

      switch(mode) {
        case BLOCK_COMMENT: i = block_comment(); break
        case LINE_COMMENT: i = line_comment(); break
        case PREPROCESSOR: i = preprocessor(); break
        case OPERATOR: i = operator(); break
        case INTEGER: i = integer(); break
        case HEX: i = hex(); break
        case FLOAT: i = decimal(); break
        case TOKEN: i = readtoken(); break
        case WHITESPACE: i = whitespace(); break
        case NORMAL: i = normal(); break
      }

      if(last !== i) {
        switch(input[last]) {
          case '\n': col = 0; ++line; break
          default: ++col; break
        }
      }
    }

    total += i
    input = input.slice(i)
    return tokens
  }

  function end(chunk) {
    if(content.length) {
      token(content.join(''))
    }

    mode = EOF
    token('(eof)')
    return tokens
  }

  function normal() {
    content = content.length ? [] : content

    if(last === '/' && c === '*') {
      start = total + i - 1
      mode = BLOCK_COMMENT
      last = c
      return i + 1
    }

    if(last === '/' && c === '/') {
      start = total + i - 1
      mode = LINE_COMMENT
      last = c
      return i + 1
    }

    if(c === '#') {
      mode = PREPROCESSOR
      start = total + i
      return i
    }

    if(/\s/.test(c)) {
      mode = WHITESPACE
      start = total + i
      return i
    }

    isnum = /\d/.test(c)
    isoperator = /[^\w_]/.test(c)

    start = total + i
    mode = isnum ? INTEGER : isoperator ? OPERATOR : TOKEN
    return i
  }

  function whitespace() {
    if(/[^\s]/g.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function preprocessor() {
    if(c === '\n' && last !== '\\') {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function line_comment() {
    return preprocessor()
  }

  function block_comment() {
    if(c === '/' && last === '*') {
      content.push(c)
      token(content.join(''))
      mode = NORMAL
      return i + 1
    }

    content.push(c)
    last = c
    return i + 1
  }

  function operator() {
    if(last === '.' && /\d/.test(c)) {
      mode = FLOAT
      return i
    }

    if(last === '/' && c === '*') {
      mode = BLOCK_COMMENT
      return i
    }

    if(last === '/' && c === '/') {
      mode = LINE_COMMENT
      return i
    }

    if(c === '.' && content.length) {
      while(determine_operator(content));

      mode = FLOAT
      return i
    }

    if(c === ';' || c === ')' || c === '(') {
      if(content.length) while(determine_operator(content));
      token(c)
      mode = NORMAL
      return i + 1
    }

    var is_composite_operator = content.length === 2 && c !== '='
    if(/[\w_\d\s]/.test(c) || is_composite_operator) {
      while(determine_operator(content));
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function determine_operator(buf) {
    var j = 0
      , idx
      , res

    do {
      idx = operators.indexOf(buf.slice(0, buf.length + j).join(''))
      res = operators[idx]

      if(idx === -1) {
        if(j-- + buf.length > 0) continue
        res = buf.slice(0, 1).join('')
      }

      token(res)

      start += res.length
      content = content.slice(res.length)
      return content.length
    } while(1)
  }

  function hex() {
    if(/[^a-fA-F0-9]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function integer() {
    if(c === '.') {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(c === 'x' && content.length === 1 && content[0] === '0') {
      mode = HEX
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function decimal() {
    if(c === 'f') {
      content.push(c)
      last = c
      i += 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      last = c
      return i + 1
    }

    if (c === '-' && /[eE]/.test(last)) {
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function readtoken() {
    if(/[^\d\w_]/.test(c)) {
      var contentstr = content.join('')
      if(allLiterals.indexOf(contentstr) > -1) {
        mode = KEYWORD
      } else if(allBuiltins.indexOf(contentstr) > -1) {
        mode = BUILTIN
      } else {
        mode = IDENT
      }
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }
}

},{"./lib/builtins":18,"./lib/builtins-300es":17,"./lib/literals":20,"./lib/literals-300es":19,"./lib/operators":21}],17:[function(require,module,exports){
// 300es builtins/reserved words that were previously valid in v100
var v100 = require('./builtins')

// The texture2D|Cube functions have been removed
// And the gl_ features are updated
v100 = v100.slice().filter(function (b) {
  return !/^(gl\_|texture)/.test(b)
})

module.exports = v100.concat([
  // the updated gl_ constants
    'gl_VertexID'
  , 'gl_InstanceID'
  , 'gl_Position'
  , 'gl_PointSize'
  , 'gl_FragCoord'
  , 'gl_FrontFacing'
  , 'gl_FragDepth'
  , 'gl_PointCoord'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexUniformVectors'
  , 'gl_MaxVertexOutputVectors'
  , 'gl_MaxFragmentInputVectors'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxFragmentUniformVectors'
  , 'gl_MaxDrawBuffers'
  , 'gl_MinProgramTexelOffset'
  , 'gl_MaxProgramTexelOffset'
  , 'gl_DepthRangeParameters'
  , 'gl_DepthRange'

  // other builtins
  , 'trunc'
  , 'round'
  , 'roundEven'
  , 'isnan'
  , 'isinf'
  , 'floatBitsToInt'
  , 'floatBitsToUint'
  , 'intBitsToFloat'
  , 'uintBitsToFloat'
  , 'packSnorm2x16'
  , 'unpackSnorm2x16'
  , 'packUnorm2x16'
  , 'unpackUnorm2x16'
  , 'packHalf2x16'
  , 'unpackHalf2x16'
  , 'outerProduct'
  , 'transpose'
  , 'determinant'
  , 'inverse'
  , 'texture'
  , 'textureSize'
  , 'textureProj'
  , 'textureLod'
  , 'textureOffset'
  , 'texelFetch'
  , 'texelFetchOffset'
  , 'textureProjOffset'
  , 'textureLodOffset'
  , 'textureProjLod'
  , 'textureProjLodOffset'
  , 'textureGrad'
  , 'textureGradOffset'
  , 'textureProjGrad'
  , 'textureProjGradOffset'
])

},{"./builtins":18}],18:[function(require,module,exports){
module.exports = [
  // Keep this list sorted
  'abs'
  , 'acos'
  , 'all'
  , 'any'
  , 'asin'
  , 'atan'
  , 'ceil'
  , 'clamp'
  , 'cos'
  , 'cross'
  , 'dFdx'
  , 'dFdy'
  , 'degrees'
  , 'distance'
  , 'dot'
  , 'equal'
  , 'exp'
  , 'exp2'
  , 'faceforward'
  , 'floor'
  , 'fract'
  , 'gl_BackColor'
  , 'gl_BackLightModelProduct'
  , 'gl_BackLightProduct'
  , 'gl_BackMaterial'
  , 'gl_BackSecondaryColor'
  , 'gl_ClipPlane'
  , 'gl_ClipVertex'
  , 'gl_Color'
  , 'gl_DepthRange'
  , 'gl_DepthRangeParameters'
  , 'gl_EyePlaneQ'
  , 'gl_EyePlaneR'
  , 'gl_EyePlaneS'
  , 'gl_EyePlaneT'
  , 'gl_Fog'
  , 'gl_FogCoord'
  , 'gl_FogFragCoord'
  , 'gl_FogParameters'
  , 'gl_FragColor'
  , 'gl_FragCoord'
  , 'gl_FragData'
  , 'gl_FragDepth'
  , 'gl_FragDepthEXT'
  , 'gl_FrontColor'
  , 'gl_FrontFacing'
  , 'gl_FrontLightModelProduct'
  , 'gl_FrontLightProduct'
  , 'gl_FrontMaterial'
  , 'gl_FrontSecondaryColor'
  , 'gl_LightModel'
  , 'gl_LightModelParameters'
  , 'gl_LightModelProducts'
  , 'gl_LightProducts'
  , 'gl_LightSource'
  , 'gl_LightSourceParameters'
  , 'gl_MaterialParameters'
  , 'gl_MaxClipPlanes'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxDrawBuffers'
  , 'gl_MaxFragmentUniformComponents'
  , 'gl_MaxLights'
  , 'gl_MaxTextureCoords'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxTextureUnits'
  , 'gl_MaxVaryingFloats'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxVertexUniformComponents'
  , 'gl_ModelViewMatrix'
  , 'gl_ModelViewMatrixInverse'
  , 'gl_ModelViewMatrixInverseTranspose'
  , 'gl_ModelViewMatrixTranspose'
  , 'gl_ModelViewProjectionMatrix'
  , 'gl_ModelViewProjectionMatrixInverse'
  , 'gl_ModelViewProjectionMatrixInverseTranspose'
  , 'gl_ModelViewProjectionMatrixTranspose'
  , 'gl_MultiTexCoord0'
  , 'gl_MultiTexCoord1'
  , 'gl_MultiTexCoord2'
  , 'gl_MultiTexCoord3'
  , 'gl_MultiTexCoord4'
  , 'gl_MultiTexCoord5'
  , 'gl_MultiTexCoord6'
  , 'gl_MultiTexCoord7'
  , 'gl_Normal'
  , 'gl_NormalMatrix'
  , 'gl_NormalScale'
  , 'gl_ObjectPlaneQ'
  , 'gl_ObjectPlaneR'
  , 'gl_ObjectPlaneS'
  , 'gl_ObjectPlaneT'
  , 'gl_Point'
  , 'gl_PointCoord'
  , 'gl_PointParameters'
  , 'gl_PointSize'
  , 'gl_Position'
  , 'gl_ProjectionMatrix'
  , 'gl_ProjectionMatrixInverse'
  , 'gl_ProjectionMatrixInverseTranspose'
  , 'gl_ProjectionMatrixTranspose'
  , 'gl_SecondaryColor'
  , 'gl_TexCoord'
  , 'gl_TextureEnvColor'
  , 'gl_TextureMatrix'
  , 'gl_TextureMatrixInverse'
  , 'gl_TextureMatrixInverseTranspose'
  , 'gl_TextureMatrixTranspose'
  , 'gl_Vertex'
  , 'greaterThan'
  , 'greaterThanEqual'
  , 'inversesqrt'
  , 'length'
  , 'lessThan'
  , 'lessThanEqual'
  , 'log'
  , 'log2'
  , 'matrixCompMult'
  , 'max'
  , 'min'
  , 'mix'
  , 'mod'
  , 'normalize'
  , 'not'
  , 'notEqual'
  , 'pow'
  , 'radians'
  , 'reflect'
  , 'refract'
  , 'sign'
  , 'sin'
  , 'smoothstep'
  , 'sqrt'
  , 'step'
  , 'tan'
  , 'texture2D'
  , 'texture2DLod'
  , 'texture2DProj'
  , 'texture2DProjLod'
  , 'textureCube'
  , 'textureCubeLod'
  , 'texture2DLodEXT'
  , 'texture2DProjLodEXT'
  , 'textureCubeLodEXT'
  , 'texture2DGradEXT'
  , 'texture2DProjGradEXT'
  , 'textureCubeGradEXT'
]

},{}],19:[function(require,module,exports){
var v100 = require('./literals')

module.exports = v100.slice().concat([
   'layout'
  , 'centroid'
  , 'smooth'
  , 'case'
  , 'mat2x2'
  , 'mat2x3'
  , 'mat2x4'
  , 'mat3x2'
  , 'mat3x3'
  , 'mat3x4'
  , 'mat4x2'
  , 'mat4x3'
  , 'mat4x4'
  , 'uint'
  , 'uvec2'
  , 'uvec3'
  , 'uvec4'
  , 'samplerCubeShadow'
  , 'sampler2DArray'
  , 'sampler2DArrayShadow'
  , 'isampler2D'
  , 'isampler3D'
  , 'isamplerCube'
  , 'isampler2DArray'
  , 'usampler2D'
  , 'usampler3D'
  , 'usamplerCube'
  , 'usampler2DArray'
  , 'coherent'
  , 'restrict'
  , 'readonly'
  , 'writeonly'
  , 'resource'
  , 'atomic_uint'
  , 'noperspective'
  , 'patch'
  , 'sample'
  , 'subroutine'
  , 'common'
  , 'partition'
  , 'active'
  , 'filter'
  , 'image1D'
  , 'image2D'
  , 'image3D'
  , 'imageCube'
  , 'iimage1D'
  , 'iimage2D'
  , 'iimage3D'
  , 'iimageCube'
  , 'uimage1D'
  , 'uimage2D'
  , 'uimage3D'
  , 'uimageCube'
  , 'image1DArray'
  , 'image2DArray'
  , 'iimage1DArray'
  , 'iimage2DArray'
  , 'uimage1DArray'
  , 'uimage2DArray'
  , 'image1DShadow'
  , 'image2DShadow'
  , 'image1DArrayShadow'
  , 'image2DArrayShadow'
  , 'imageBuffer'
  , 'iimageBuffer'
  , 'uimageBuffer'
  , 'sampler1DArray'
  , 'sampler1DArrayShadow'
  , 'isampler1D'
  , 'isampler1DArray'
  , 'usampler1D'
  , 'usampler1DArray'
  , 'isampler2DRect'
  , 'usampler2DRect'
  , 'samplerBuffer'
  , 'isamplerBuffer'
  , 'usamplerBuffer'
  , 'sampler2DMS'
  , 'isampler2DMS'
  , 'usampler2DMS'
  , 'sampler2DMSArray'
  , 'isampler2DMSArray'
  , 'usampler2DMSArray'
])

},{"./literals":20}],20:[function(require,module,exports){
module.exports = [
  // current
    'precision'
  , 'highp'
  , 'mediump'
  , 'lowp'
  , 'attribute'
  , 'const'
  , 'uniform'
  , 'varying'
  , 'break'
  , 'continue'
  , 'do'
  , 'for'
  , 'while'
  , 'if'
  , 'else'
  , 'in'
  , 'out'
  , 'inout'
  , 'float'
  , 'int'
  , 'void'
  , 'bool'
  , 'true'
  , 'false'
  , 'discard'
  , 'return'
  , 'mat2'
  , 'mat3'
  , 'mat4'
  , 'vec2'
  , 'vec3'
  , 'vec4'
  , 'ivec2'
  , 'ivec3'
  , 'ivec4'
  , 'bvec2'
  , 'bvec3'
  , 'bvec4'
  , 'sampler1D'
  , 'sampler2D'
  , 'sampler3D'
  , 'samplerCube'
  , 'sampler1DShadow'
  , 'sampler2DShadow'
  , 'struct'

  // future
  , 'asm'
  , 'class'
  , 'union'
  , 'enum'
  , 'typedef'
  , 'template'
  , 'this'
  , 'packed'
  , 'goto'
  , 'switch'
  , 'default'
  , 'inline'
  , 'noinline'
  , 'volatile'
  , 'public'
  , 'static'
  , 'extern'
  , 'external'
  , 'interface'
  , 'long'
  , 'short'
  , 'double'
  , 'half'
  , 'fixed'
  , 'unsigned'
  , 'input'
  , 'output'
  , 'hvec2'
  , 'hvec3'
  , 'hvec4'
  , 'dvec2'
  , 'dvec3'
  , 'dvec4'
  , 'fvec2'
  , 'fvec3'
  , 'fvec4'
  , 'sampler2DRect'
  , 'sampler3DRect'
  , 'sampler2DRectShadow'
  , 'sizeof'
  , 'cast'
  , 'namespace'
  , 'using'
]

},{}],21:[function(require,module,exports){
module.exports = [
    '<<='
  , '>>='
  , '++'
  , '--'
  , '<<'
  , '>>'
  , '<='
  , '>='
  , '=='
  , '!='
  , '&&'
  , '||'
  , '+='
  , '-='
  , '*='
  , '/='
  , '%='
  , '&='
  , '^^'
  , '^='
  , '|='
  , '('
  , ')'
  , '['
  , ']'
  , '.'
  , '!'
  , '~'
  , '*'
  , '/'
  , '%'
  , '+'
  , '-'
  , '<'
  , '>'
  , '&'
  , '^'
  , '|'
  , '?'
  , ':'
  , '='
  , ','
  , ';'
  , '{'
  , '}'
]

},{}],22:[function(require,module,exports){
var tokenize = require('./index')

module.exports = tokenizeString

function tokenizeString(str, opt) {
  var generator = tokenize(opt)
  var tokens = []

  tokens = tokens.concat(generator(str))
  tokens = tokens.concat(generator(null))

  return tokens
}

},{"./index":16}],23:[function(require,module,exports){
(function(window) {
    var re = {
        not_string: /[^s]/,
        number: /[diefg]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    }

    function sprintf() {
        var key = arguments[0], cache = sprintf.cache
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = sprintf.parse(key)
        }
        return sprintf.format.call(null, cache[key], arguments)
    }

    sprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i])
            if (node_type === "string") {
                output[output.length] = parse_tree[i]
            }
            else if (node_type === "array") {
                match = parse_tree[i] // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                        }
                        arg = arg[match[2][k]]
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (get_type(arg) == "function") {
                    arg = arg()
                }

                if (re.not_string.test(match[8]) && re.not_json.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0
                }

                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2)
                    break
                    case "c":
                        arg = String.fromCharCode(arg)
                    break
                    case "d":
                    case "i":
                        arg = parseInt(arg, 10)
                    break
                    case "j":
                        arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0)
                    break
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
                    break
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
                    break
                    case "g":
                        arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg)
                    break
                    case "o":
                        arg = arg.toString(8)
                    break
                    case "s":
                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
                    break
                    case "u":
                        arg = arg >>> 0
                    break
                    case "x":
                        arg = arg.toString(16)
                    break
                    case "X":
                        arg = arg.toString(16).toUpperCase()
                    break
                }
                if (re.json.test(match[8])) {
                    output[output.length] = arg
                }
                else {
                    if (re.number.test(match[8]) && (!is_positive || match[3])) {
                        sign = is_positive ? "+" : "-"
                        arg = arg.toString().replace(re.sign, "")
                    }
                    else {
                        sign = ""
                    }
                    pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
                    pad_length = match[6] - (sign + arg).length
                    pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
                    output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
                }
            }
        }
        return output.join("")
    }

    sprintf.cache = {}

    sprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0]
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = "%"
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1]
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else {
                                throw new SyntaxError("[sprintf] failed to parse named argument key")
                            }
                        }
                    }
                    else {
                        throw new SyntaxError("[sprintf] failed to parse named argument key")
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
                }
                parse_tree[parse_tree.length] = match
            }
            else {
                throw new SyntaxError("[sprintf] unexpected placeholder")
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return parse_tree
    }

    var vsprintf = function(fmt, argv, _argv) {
        _argv = (argv || []).slice(0)
        _argv.splice(0, 0, fmt)
        return sprintf.apply(null, _argv)
    }

    /**
     * helpers
     */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        return Array(multiplier + 1).join(input)
    }

    /**
     * export to either browser or node.js
     */
    if (typeof exports !== "undefined") {
        exports.sprintf = sprintf
        exports.vsprintf = vsprintf
    }
    else {
        window.sprintf = sprintf
        window.vsprintf = vsprintf

        if (typeof define === "function" && define.amd) {
            define(function() {
                return {
                    sprintf: sprintf,
                    vsprintf: vsprintf
                }
            })
        }
    }
})(typeof window === "undefined" ? this : window);

},{}],24:[function(require,module,exports){
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

},{"../utils":31}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeProgramFromShaderURIs = undefined;


// Load shaders using XHR
// @deprecated - Use glslify instead

var makeProgramFromShaderURIs = exports.makeProgramFromShaderURIs = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(gl, vs, fs, opts) {
    var vertexShaderURI, fragmentShaderURI, responses;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            opts = (0, _utils.merge)({
              path: '/',
              noCache: false
            }, opts);

            vertexShaderURI = opts.path + vs;
            fragmentShaderURI = opts.path + fs;
            _context.next = 5;
            return new _io.XHRGroup({
              urls: [vertexShaderURI, fragmentShaderURI],
              noCache: opts.noCache
            }).sendAsync();

          case 5:
            responses = _context.sent;
            return _context.abrupt('return', new _program2.default(gl, { vs: responses[0], fs: responses[1] }));

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function makeProgramFromShaderURIs(_x, _x2, _x3, _x4) {
    return ref.apply(this, arguments);
  };
}();

exports.makeProgramfromDefaultShaders = makeProgramfromDefaultShaders;
exports.makeProgramFromHTMLTemplates = makeProgramFromHTMLTemplates;

var _program = require('../webgl/program');

var _program2 = _interopRequireDefault(_program);

var _shaders = require('../shaders');

var _shaders2 = _interopRequireDefault(_shaders);

var _io = require('../io');

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/* global document */

// Alternate constructor
// Build program from default shaders (requires Shaders)
function makeProgramfromDefaultShaders(gl, id) {
  return new _program2.default(gl, {
    vs: _shaders2.default.Vertex.Default,
    fs: _shaders2.default.Fragment.Default,
    id: id
  });
}

// Create a program from vertex and fragment shader node ids
// @deprecated - Use glslify instead
function makeProgramFromHTMLTemplates(gl, vsId, fsId, id) {
  var vs = document.getElementById(vsId).innerHTML;
  var fs = document.getElementById(fsId).innerHTML;
  return new _program2.default(gl, { vs: vs, fs: fs, id: id });
}

},{"../io":29,"../shaders":30,"../utils":31,"../webgl/program":37}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WorkerGroup = exports.Fx = undefined;

var _fx = require('./fx');

Object.defineProperty(exports, 'Fx', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_fx).default;
  }
});

var _workers = require('./workers');

Object.defineProperty(exports, 'WorkerGroup', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_workers).default;
  }
});

var _helpers = require('./helpers');

Object.keys(_helpers).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _helpers[key];
    }
  });
});

var _saveBitmap = require('./save-bitmap');

Object.keys(_saveBitmap).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _saveBitmap[key];
    }
  });
});

var _fx2 = _interopRequireDefault(_fx);

var _workers2 = _interopRequireDefault(_workers);

var helpers = _interopRequireWildcard(_helpers);

var saveBitmap = _interopRequireWildcard(_saveBitmap);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global window */
if (typeof window !== 'undefined' && window.LumaGL) {
  window.LumaGL.addons = {
    Fx: _fx2.default,
    WorkerGroup: _workers2.default
  };
  Object.assign(window.LumaGL.addons, helpers);
  Object.assign(window.LumaGL.addons, saveBitmap);
}

},{"./fx":24,"./helpers":25,"./save-bitmap":27,"./workers":28}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveBitmap = saveBitmap;

var _filesaver = require('filesaver.js');

var _canvasToBlob = require('canvas-to-blob');

var _canvasToBlob2 = _interopRequireDefault(_canvasToBlob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function saveBitmap(canvas, filename) {
  var blob = (0, _canvasToBlob2.default)(canvas.toDataURL());
  (0, _filesaver.saveAs)(blob, filename);
}

},{"canvas-to-blob":6,"filesaver.js":7}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadTextures = exports.XHRGroup = exports.XHR = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Provides loading of assets with XHR and JSONP methods.
/* eslint-disable guard-for-in, complexity */

/* global document, XMLHttpRequest, Image */


// Load multiple images async.
// rye: TODO this needs to implement functionality from the
//           original Images function.

var loadImages = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(srcs) {
    var imagePromises, results, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, imagePromise;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            imagePromises = srcs.map(function (src) {
              return loadImage(src);
            });
            results = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context2.prev = 5;
            _iterator = imagePromises[Symbol.iterator]();

          case 7:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context2.next = 17;
              break;
            }

            imagePromise = _step.value;
            _context2.t0 = results;
            _context2.next = 12;
            return imagePromise;

          case 12:
            _context2.t1 = _context2.sent;

            _context2.t0.push.call(_context2.t0, _context2.t1);

          case 14:
            _iteratorNormalCompletion = true;
            _context2.next = 7;
            break;

          case 17:
            _context2.next = 23;
            break;

          case 19:
            _context2.prev = 19;
            _context2.t2 = _context2['catch'](5);
            _didIteratorError = true;
            _iteratorError = _context2.t2;

          case 23:
            _context2.prev = 23;
            _context2.prev = 24;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 26:
            _context2.prev = 26;

            if (!_didIteratorError) {
              _context2.next = 29;
              break;
            }

            throw _iteratorError;

          case 29:
            return _context2.finish(26);

          case 30:
            return _context2.finish(23);

          case 31:
            return _context2.abrupt('return', results);

          case 32:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[5, 19, 23, 31], [24,, 26, 30]]);
  }));

  return function loadImages(_x3) {
    return ref.apply(this, arguments);
  };
}();

// // Load multiple Image assets async
// export function Images(opt) {
//   opt = merge({
//     src: [],
//     noCache: false,
//     onProgress: noop,
//     onComplete: noop
//   }, opt || {});
//
//   let count = 0;
//   let l = opt.src.length;
//
//   let images;
//   // Image onload handler
//   var load = () => {
//     opt.onProgress(Math.round(++count / l * 100));
//     if (count === l) {
//       opt.onComplete(images);
//     }
//   };
//   // Image error handler
//   var error = () => {
//     if (++count === l) {
//       opt.onComplete(images);
//     }
//   };
//
//   // uid for image sources
//   const noCache = opt.noCache;
//   const uid = uid();
//   function getSuffix(s) {
//     return (s.indexOf('?') >= 0 ? '&' : '?') + uid;
//   }
//
//   // Create image array
//   images = opt.src.map((src, i) => {
//     const img = new Image();
//     img.index = i;
//     img.onload = load;
//     img.onerror = error;
//     img.src = src + (noCache ? getSuffix(src) : '');
//     return img;
//   });
//
//   return images;
// }

// Load multiple textures from images
// rye: TODO this needs to implement functionality from
//           the original loadTextures function.


var loadTextures = exports.loadTextures = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(gl, opt) {
    var images, textures;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return loadImages(opt.src);

          case 2:
            images = _context3.sent;
            textures = [];

            images.forEach(function (img, i) {
              var params = Array.isArray(opt.parameters) ? opt.parameters[i] : opt.parameters;
              params = params === undefined ? {} : params;
              textures.push(new _webgl.Texture2D(gl, (0, _utils.merge)({
                data: img
              }, params)));
            });
            return _context3.abrupt('return', textures);

          case 6:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function loadTextures(_x4, _x5) {
    return ref.apply(this, arguments);
  };
}();

// // Load multiple textures from images
// export function loadTextures(opt = {}) {
//   opt = {
//     src: [],
//     noCache: false,
//     onComplete: noop,
//     ...opt
//   };
//
//   Images({
//     src: opt.src,
//     noCache: opt.noCache,
//     onComplete(images) {
//       var textures = {};
//       images.forEach((img, i) => {
//         textures[opt.id && opt.id[i] || opt.src && opt.src[i]] = merge({
//           data: {
//             value: img
//           }
//         }, opt);
//       });
//       app.setTextures(textures);
//       opt.onComplete();
//     }
//   });
// }


exports.JSONP = JSONP;

var _utils = require('./utils');

var _webgl = require('./webgl');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XHR = exports.XHR = function () {
  function XHR() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, XHR);

    opt = _extends({
      url: 'http:// philogljs.org/',
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false,
      onProgress: _utils.noop,
      onSuccess: _utils.noop,
      onError: _utils.noop,
      onAbort: _utils.noop,
      onComplete: _utils.noop
    }, opt);

    this.opt = opt;
    this.initXHR();
  }

  _createClass(XHR, [{
    key: 'initXHR',
    value: function initXHR() {
      var req = this.req = new XMLHttpRequest();
      var self = this;

      ['Progress', 'Error', 'Abort', 'Load'].forEach(function (event) {
        if (req.addEventListener) {
          req.addEventListener(event.toLowerCase(), function (e) {
            self['handle' + event](e);
          }, false);
        } else {
          req['on' + event.toLowerCase()] = function (e) {
            self['handle' + event](e);
          };
        }
      });
    }
  }, {
    key: 'sendAsync',
    value: function sendAsync(body) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var req = _this.req;
        var opt = _this.opt;
        var async = opt.async;


        if (opt.noCache) {
          opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + (0, _utils.uid)();
        }

        req.open(opt.method, opt.url, async);

        if (opt.responseType) {
          req.responseType = opt.responseType;
        }

        if (async) {
          req.onreadystatechange = function (e) {
            if (req.readyState === XHR.State.COMPLETED) {
              if (req.status === 200) {
                resolve(req.responseType ? req.response : req.responseText);
              } else {
                reject(new Error(req.status));
              }
            }
          };
        }

        if (opt.sendAsBinary) {
          req.sendAsBinary(body || opt.body || null);
        } else {
          req.send(body || opt.body || null);
        }

        if (!async) {
          if (req.status === 200) {
            resolve(req.responseType ? req.response : req.responseText);
          } else {
            reject(new Error(req.status));
          }
        }
      });
    }
  }, {
    key: 'send',
    value: function send(body) {
      var req = this.req;
      var opt = this.opt;

      var async = opt.async;

      if (opt.noCache) {
        opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + (0, _utils.uid)();
      }

      req.open(opt.method, opt.url, async);

      if (opt.responseType) {
        req.responseType = opt.responseType;
      }

      if (async) {
        req.onreadystatechange = function (e) {
          if (req.readyState === XHR.State.COMPLETED) {
            if (req.status === 200) {
              opt.onSuccess(req.responseType ? req.response : req.responseText);
            } else {
              opt.onError(req.status);
            }
          }
        };
      }

      if (opt.sendAsBinary) {
        req.sendAsBinary(body || opt.body || null);
      } else {
        req.send(body || opt.body || null);
      }

      if (!async) {
        if (req.status === 200) {
          opt.onSuccess(req.responseType ? req.response : req.responseText);
        } else {
          opt.onError(req.status);
        }
      }
    }
  }, {
    key: 'setRequestHeader',
    value: function setRequestHeader(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    }
  }, {
    key: 'handleProgress',
    value: function handleProgress(e) {
      if (e.lengthComputable) {
        this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        this.opt.onProgress(e, -1);
      }
    }
  }, {
    key: 'handleError',
    value: function handleError(e) {
      this.opt.onError(e);
    }
  }, {
    key: 'handleAbort',
    value: function handleAbort(e) {
      this.opt.onAbort(e);
    }
  }, {
    key: 'handleLoad',
    value: function handleLoad(e) {
      this.opt.onComplete(e);
    }
  }]);

  return XHR;
}();

XHR.State = {};
['UNINITIALIZED', 'LOADING', 'LOADED', 'INTERACTIVE', 'COMPLETED'].forEach(function (stateName, i) {
  XHR.State[stateName] = i;
});

// Make parallel requests and group the responses.

var XHRGroup = exports.XHRGroup = function () {
  function XHRGroup() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, XHRGroup);

    opt = _extends({
      urls: [],
      onSuccess: _utils.noop,
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false
    }, opt);

    var urls = (0, _utils.splat)(opt.urls);
    this.reqs = urls.map(function (url, i) {
      return new XHR({
        url: url,
        method: opt.method,
        async: opt.async,
        noCache: opt.noCache,
        sendAsBinary: opt.sendAsBinary,
        responseType: opt.responseType,
        body: opt.body
      });
    });
  }

  _createClass(XHRGroup, [{
    key: 'sendAsync',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Promise.all(this.reqs.map(function (req) {
                  return req.sendAsync();
                }));

              case 2:
                return _context.abrupt('return', _context.sent);

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function sendAsync() {
        return ref.apply(this, arguments);
      }

      return sendAsync;
    }()
  }]);

  return XHRGroup;
}();

function JSONP(opt) {
  opt = (0, _utils.merge)({
    url: 'http:// philogljs.org/',
    data: {},
    noCache: false,
    onComplete: _utils.noop,
    callbackKey: 'callback'
  }, opt || {});

  var index = JSONP.counter++;
  // create query string
  var data = [];
  for (var prop in opt.data) {
    data.push(prop + '=' + opt.data[prop]);
  }
  data = data.join('&');
  // append unique id for cache
  if (opt.noCache) {
    data += (data.indexOf('?') >= 0 ? '&' : '?') + (0, _utils.uid)();
  }
  // create source url
  var src = opt.url + (opt.url.indexOf('?') > -1 ? '&' : '?') + opt.callbackKey + '=PhiloGL IO.JSONP.requests.request_' + index + (data.length > 0 ? '&' + data : '');

  // create script
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;

  // create callback
  JSONP.requests['request_' + index] = function (json) {
    opt.onComplete(json);
    // remove script
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    if (script.clearAttributes) {
      script.clearAttributes();
    }
  };

  // inject script
  document.getElementsByTagName('head')[0].appendChild(script);
}

JSONP.counter = 0;
JSONP.requests = {};

// Creates an image-loading promise.
function loadImage(src) {
  return new Promise(function (resolve, reject) {
    var image = new Image();
    image.onload = function () {
      resolve(image);
    };
    image.onerror = function () {
      reject(new Error('Could not load image ' + src + '.'));
    };
    image.src = src;
  });
}

},{"./utils":31,"./webgl":36}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Default Shaders


// TODO - adopt glslify
var Shaders = {
  Vertex: {
    Default: "#define GLSLIFY 1\n#define LIGHT_MAX 4\n\n// object attributes\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec4 color;\nattribute vec4 pickingColor;\nattribute vec2 texCoord1;\n\n// camera and object matrices\nuniform mat4 viewMatrix;\nuniform mat4 viewInverseMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewProjectionMatrix;\n\n// objectMatrix * viewMatrix = worldMatrix\nuniform mat4 worldMatrix;\nuniform mat4 worldInverseMatrix;\nuniform mat4 worldInverseTransposeMatrix;\nuniform mat4 objectMatrix;\nuniform vec3 cameraPosition;\n\n// lighting configuration\nuniform bool enableLights;\nuniform vec3 ambientColor;\nuniform vec3 directionalColor;\nuniform vec3 lightingDirection;\n\n// point lights configuration\nuniform vec3 pointLocation[LIGHT_MAX];\nuniform vec3 pointColor[LIGHT_MAX];\nuniform int numberPoints;\n\n// reflection / refraction configuration\nuniform bool useReflection;\n\n// varyings\nvarying vec3 vReflection;\nvarying vec4 vColor;\nvarying vec4 vPickingColor;\nvarying vec2 vTexCoord;\nvarying vec4 vNormal;\nvarying vec3 lightWeighting;\n\nvoid main(void) {\n  vec4 mvPosition = worldMatrix * vec4(position, 1.0);\n  vec4 transformedNormal = worldInverseTransposeMatrix * vec4(normal, 1.0);\n\n  // lighting code\n  if(!enableLights) {\n    lightWeighting = vec3(1.0, 1.0, 1.0);\n  } else {\n    vec3 plightDirection;\n    vec3 pointWeight = vec3(0.0, 0.0, 0.0);\n    float directionalLightWeighting =\n      max(dot(transformedNormal.xyz, lightingDirection), 0.0);\n    for (int i = 0; i < LIGHT_MAX; i++) {\n      if (i < numberPoints) {\n        plightDirection = normalize(\n          (viewMatrix * vec4(pointLocation[i], 1.0)).xyz - mvPosition.xyz);\n         pointWeight += max(\n          dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor[i];\n       } else {\n         break;\n       }\n     }\n\n    lightWeighting = ambientColor +\n      (directionalColor * directionalLightWeighting) + pointWeight;\n  }\n\n  // refraction / reflection code\n  if (useReflection) {\n    vReflection =\n      (viewInverseMatrix[3] - (worldMatrix * vec4(position, 1.0))).xyz;\n  } else {\n    vReflection = vec3(1.0, 1.0, 1.0);\n  }\n\n  // pass results to varyings\n  vColor = color;\n  vPickingColor = pickingColor;\n  vTexCoord = texCoord1;\n  vNormal = transformedNormal;\n  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);\n}\n"
  },
  Fragment: {
    Default: "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\n\n// varyings\nvarying vec4 vColor;\nvarying vec4 vPickingColor;\nvarying vec2 vTexCoord;\nvarying vec3 lightWeighting;\nvarying vec3 vReflection;\nvarying vec4 vNormal;\n\n// texture configs\nuniform bool hasTexture1;\nuniform sampler2D sampler1;\nuniform bool hasTextureCube1;\nuniform samplerCube samplerCube1;\n\n// picking configs\nuniform bool enablePicking;\nuniform bool hasPickingColors;\nuniform vec3 pickColor;\n\n// reflection / refraction configs\nuniform float reflection;\nuniform float refraction;\n\n// fog configuration\nuniform bool hasFog;\nuniform vec3 fogColor;\nuniform float fogNear;\nuniform float fogFar;\n\nvoid main(){\n  // set color from texture\n  if (!hasTexture1) {\n    gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);\n  } else {\n    gl_FragColor =\n      vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb *\n      lightWeighting, 1.0);\n  }\n\n  // has cube texture then apply reflection\n  if (hasTextureCube1) {\n    vec3 nReflection = normalize(vReflection);\n    vec3 reflectionValue;\n    if (refraction > 0.0) {\n     reflectionValue = refract(nReflection, vNormal.xyz, refraction);\n    } else {\n     reflectionValue = -reflect(nReflection, vNormal.xyz);\n    }\n\n    // TODO(nico): check whether this is right.\n    vec4 cubeColor = textureCube(samplerCube1,\n        vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));\n    gl_FragColor = vec4(mix(gl_FragColor.xyz, cubeColor.xyz, reflection), 1.0);\n  }\n\n  // set picking\n  if (enablePicking) {\n    if (hasPickingColors) {\n      gl_FragColor = vPickingColor;\n    } else {\n      gl_FragColor = vec4(pickColor, 1.0);\n    }\n  }\n\n  // handle fog\n  if (hasFog) {\n    float depth = gl_FragCoord.z / gl_FragCoord.w;\n    float fogFactor = smoothstep(fogNear, fogFar, depth);\n    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);\n  }\n}\n"
  }
};

Shaders.vs = Shaders.Vertex.Default;
Shaders.fs = Shaders.Fragment.Default;

exports.default = Shaders;

},{}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splat = splat;
exports.noop = noop;
exports.uid = uid;
exports.merge = merge;
exports.isTypedArray = isTypedArray;
exports.makeTypedArray = makeTypedArray;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Wraps the argument in an array if it is not one.
 * @param {object} a - The object to wrap.
 * @return {Array} array
 **/
function splat(a) {
  return Array.isArray(a) && a || [a];
}

/**
* Provides a standard noop function.
**/
/* eslint-disable guard-for-in */
function noop() {}

var _uid = Date.now();

/**
 * Returns a UID.
 * @return {number} uid
 **/
function uid() {
  return _uid++;
}

/**
 * Merge multiple objects into one.
 * @param {...object} objects - The objects to merge.
 * @return {object} object
 **/
function merge(objects) {
  var mix = {};
  for (var i = 0, l = arguments.length; i < l; i++) {
    var object = arguments[i];
    if (object.constructor.name !== 'Object') {
      continue;
    }
    for (var key in object) {
      var op = object[key];
      var mp = mix[key];
      if (mp && op.constructor.name === 'Object' && mp.constructor.name === 'Object') {
        mix[key] = merge(mp, op);
      } else {
        mix[key] = detach(op);
      }
    }
  }
  return mix;
}

/**
 * Internal function for duplicating an object.
 * @param {object} elem - The object to recursively duplicate.
 * @return {object} object
 **/
function detach(elem) {
  var t = elem.constructor.name;
  var ans = void 0;
  if (t === 'Object') {
    ans = {};
    for (var p in elem) {
      ans[p] = detach(elem[p]);
    }
  } else if (t === 'Array') {
    ans = [];
    for (var i = 0, l = elem.length; i < l; i++) {
      ans[i] = detach(elem[i]);
    }
  } else {
    ans = elem;
  }

  return ans;
}

// TYPED ARRAYS

function isTypedArray(value) {
  return value.BYTES_PER_ELEMENT;
}

function makeTypedArray(ArrayType, sourceArray) {
  (0, _assert2.default)(Array.isArray(sourceArray));
  var array = new ArrayType(sourceArray.length);
  for (var i = 0; i < sourceArray.length; ++i) {
    array[i] = sourceArray[i];
  }
  return array;
}

},{"assert":1}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Encapsulates a WebGLBuffer object

var _context = require('./context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = function () {
  _createClass(Buffer, null, [{
    key: 'getDefaultOpts',
    value: function getDefaultOpts(gl) {
      return {
        bufferType: gl.ARRAY_BUFFER,
        size: 1,
        dataType: gl.FLOAT,
        stride: 0,
        offset: 0,
        drawMode: gl.STATIC_DRAW,
        instanced: 0
      };
    }

    /*
     * @classdesc
     * Set up a gl buffer once and repeatedly bind and unbind it.
     * Holds an attribute name as a convenience...
     *
     * @param{} opts.data - native array
     * @param{string} opts.attribute - name of attribute for matching
     * @param{} opts.bufferType - buffer type (called "target" in GL docs)
     */

  }]);

  function Buffer(gl, opts) {
    _classCallCheck(this, Buffer);

    (0, _assert2.default)(gl, 'Buffer needs WebGLRenderingContext');
    this.gl = gl;
    this.handle = gl.createBuffer();
    (0, _context.glCheckError)(gl);
    opts = Object.assign({}, Buffer.getDefaultOpts(gl), opts);
    this.update(opts);
  }

  _createClass(Buffer, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteBuffer(this.handle);
      this.handle = null;
      (0, _context.glCheckError)(gl);
      return this;
    }

    // todo - remove

  }, {
    key: 'destroy',
    value: function destroy() {
      this.delete();
    }

    /* Updates data in the buffer */

  }, {
    key: 'update',
    value: function update() {
      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      (0, _assert2.default)(opts.data, 'Buffer needs data argument');
      this.attribute = opts.attribute || this.attribute;
      this.bufferType = opts.bufferType || this.bufferType;
      this.size = opts.size || this.size;
      this.dataType = opts.dataType || this.dataType;
      this.stride = opts.stride || this.stride;
      this.offset = opts.offset || this.offset;
      this.drawMode = opts.drawMode || this.drawMode;
      this.instanced = opts.instanced || this.instanced;

      this.data = opts.data || this.data;
      if (this.data !== undefined) {
        this.bufferData(this.data);
      }
      return this;
    }

    /* Updates data in the buffer */

  }, {
    key: 'bufferData',
    value: function bufferData(data) {
      (0, _assert2.default)(data, 'Buffer.bufferData needs data');
      this.data = data;
      this.gl.bindBuffer(this.bufferType, this.handle);
      this.gl.bufferData(this.bufferType, this.data, this.drawMode);
      this.gl.bindBuffer(this.bufferType, null);
      return this;
    }
  }, {
    key: 'attachToLocation',
    value: function attachToLocation(location) {
      var gl = this.gl;
      // Bind the buffer so that we can operate on it

      gl.bindBuffer(this.bufferType, this.handle);
      if (location === undefined) {
        return this;
      }
      // Enable the attribute
      gl.enableVertexAttribArray(location);
      // Specify buffer format
      gl.vertexAttribPointer(location, this.size, this.dataType, false, this.stride, this.offset);
      if (this.instanced) {
        var extension = (0, _context.getExtension)(gl, 'ANGLE_instanced_arrays');
        // This makes it an instanced attribute
        extension.vertexAttribDivisorANGLE(location, 1);
      }
      return this;
    }
  }, {
    key: 'detachFromLocation',
    value: function detachFromLocation(location) {
      var gl = this.gl;

      if (this.instanced) {
        var extension = (0, _context.getExtension)(gl, 'ANGLE_instanced_arrays');
        // Clear instanced flag
        extension.vertexAttribDivisorANGLE(location, 0);
      }
      // Disable the attribute
      gl.disableVertexAttribArray(location);
      // Unbind the buffer per webgl recommendations
      gl.bindBuffer(this.bufferType, null);
      return this;
    }
  }, {
    key: 'bind',
    value: function bind() {
      var gl = this.gl;

      gl.bindBuffer(this.bufferType, this.handle);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var gl = this.gl;

      gl.bindBuffer(this.bufferType, null);
      return this;
    }
  }]);

  return Buffer;
}();

exports.default = Buffer;

},{"./context":33,"assert":1}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGLContext = createGLContext;
exports.hasWebGL = hasWebGL;
exports.hasExtension = hasExtension;
exports.getExtension = getExtension;
exports.glContextWithState = glContextWithState;
exports.glCheckError = glCheckError;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Checks if WebGL is enabled and creates a context for using WebGL.
function createGLContext(canvas) {
  var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  if (!isBrowserContext()) {
    throw new Error('Can\'t create a WebGL context outside a browser context.');
  }
  canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

  canvas.addEventListener('webglcontextcreationerror', function (e) {
    console.log(e.statusMessage || 'Unknown error');
  }, false);

  // Prefer webgl2 over webgl1, prefer conformant over experimental
  var gl = canvas.getContext('webgl2', opt);
  gl = gl || canvas.getContext('experimental-webgl2', opt);
  gl = gl || canvas.getContext('webgl', opt);
  gl = gl || canvas.getContext('experimental-webgl', opt);

  (0, _assert2.default)(gl, 'Failed to create WebGLRenderingContext');

  // Set as debug handler
  gl = opt.debug ? createDebugContext(gl) : gl;

  // Add a safe get method
  gl.get = function glGet(name) {
    var value = name;
    if (typeof name === 'string') {
      value = this[name];
      (0, _assert2.default)(value, 'Accessing gl.' + name);
    }
    return value;
  };

  return gl;
} // WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-console, no-loop-func */
/* global window, document, console */


function hasWebGL() {
  if (!isBrowserContext()) {
    return false;
  }
  // Feature test WebGL
  try {
    var canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (error) {
    return false;
  }
}

function hasExtension(name) {
  if (!hasWebGL()) {
    return false;
  }
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  // Should maybe be return !!context.getExtension(name);
  return context.getExtension(name);
}

// Returns the extension or throws an error
function getExtension(gl, extensionName) {
  var extension = gl.getExtension(extensionName);
  (0, _assert2.default)(extension, extensionName + ' not supported!');
  return extension;
}

function isBrowserContext() {
  return typeof window !== 'undefined';
}

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
function glContextWithState(gl, _ref, func) {
  var scissorTest = _ref.scissorTest;
  var frameBuffer = _ref.frameBuffer;

  var scissorTestWasEnabled = void 0;
  if (scissorTest) {
    scissorTestWasEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    var x = scissorTest.x;
    var y = scissorTest.y;
    var w = scissorTest.w;
    var h = scissorTest.h;

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
  }

  if (frameBuffer) {
    // TODO - was there any previously set frame buffer we need to remember?
    frameBuffer.bind();
  }

  try {
    func(gl);
  } finally {
    if (!scissorTestWasEnabled) {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (frameBuffer) {
      // TODO - was there any previously set frame buffer?
      // TODO - delegate "unbind" to Framebuffer object?
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
}

function glCheckError(gl) {
  // Ensure all errors are cleared
  var error = void 0;
  var glError = gl.getError();
  while (glError !== gl.NO_ERROR) {
    if (error) {
      console.error(error);
    } else {
      error = new Error(glGetErrorMessage(gl, glError));
    }
    glError = gl.getError();
  }
  if (error) {
    throw error;
  }
}

function glGetErrorMessage(gl, glError) {
  switch (glError) {
    case gl.CONTEXT_LOST_WEBGL:
      //  If the WebGL context is lost, this error is returned on the
      // first call to getError. Afterwards and until the context has been
      // restored, it returns gl.NO_ERROR.
      return 'WebGL context lost';

    case gl.INVALID_ENUM:
      // An unacceptable value has been specified for an enumerated argument.
      return 'WebGL invalid enumerated argument';

    case gl.INVALID_VALUE:
      // A numeric argument is out of range.
      return 'WebGL invalid value';

    case gl.INVALID_OPERATION:
      // The specified command is not allowed for the current state.
      return 'WebGL invalid operation';

    case gl.INVALID_FRAMEBUFFER_OPERATION:
      // The currently bound framebuffer is not framebuffer complete
      // when trying to render to or to read from it.
      return 'WebGL invalid framebuffer operation';

    case gl.OUT_OF_MEMORY:
      // Not enough memory is left to execute the command.
      return 'WebGL out of memory';

    default:
      // Not enough memory is left to execute the command.
      return 'WebGL unknown error';
  }
}

// TODO - document or remove
function createDebugContext(ctx) {
  var _arguments = arguments;

  var gl = {};
  for (var m in ctx) {
    var f = ctx[m];
    if (typeof f === 'function') {
      gl[m] = function (k, v) {
        return function () {
          console.log(k, Array.prototype.join.call(_arguments), Array.prototype.slice.call(_arguments));
          var ans = void 0;
          try {
            ans = v.apply(ctx, _arguments);
          } catch (e) {
            throw new Error(k + ' ' + e);
          }
          var errorStack = [];
          var error = void 0;
          while ((error = ctx.getError()) !== ctx.NO_ERROR) {
            errorStack.push(error);
          }
          if (errorStack.length) {
            throw errorStack.join();
          }
          return ans;
        };
      }(m, f);
    } else {
      gl[m] = f;
    }
  }

  return gl;
}

},{"assert":1}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;

var _context = require('./context');

var _types = require('./types');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// A good thing about webGL is that there are so many ways to draw things,
// depending on whether data is indexed and/or instanced.
// This function unifies those into a single call with simple parameters
// that have sane defaults.
function draw(gl, _ref) {
  var _ref$drawMode = _ref.drawMode;
  var drawMode = _ref$drawMode === undefined ? null : _ref$drawMode;
  var vertexCount = _ref.vertexCount;
  var _ref$offset = _ref.offset;
  var offset = _ref$offset === undefined ? 0 : _ref$offset;
  var indexed = _ref.indexed;
  var _ref$indexType = _ref.indexType;
  var indexType = _ref$indexType === undefined ? null : _ref$indexType;
  var _ref$instanced = _ref.instanced;
  var instanced = _ref$instanced === undefined ? false : _ref$instanced;
  var _ref$instanceCount = _ref.instanceCount;
  var instanceCount = _ref$instanceCount === undefined ? 0 : _ref$instanceCount;

  drawMode = drawMode ? gl.get(drawMode) : gl.TRIANGLES;
  indexType = indexType ? gl.get(indexType) : gl.UNSIGNED_SHORT;

  (0, _assert2.default)((0, _types.GL_DRAW_MODES)(gl).indexOf(drawMode) > -1, 'Invalid draw mode');
  (0, _assert2.default)((0, _types.GL_INDEX_TYPES)(gl).indexOf(indexType) > -1, 'Invalid index type');

  // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
  if (instanced) {
    var extension = gl.getExtension('ANGLE_instanced_arrays');
    if (indexed) {
      extension.drawElementsInstancedANGLE(drawMode, vertexCount, indexType, offset, instanceCount);
    } else {
      extension.drawArraysInstancedANGLE(drawMode, offset, vertexCount, instanceCount);
    }
  } else if (indexed) {
    gl.drawElements(drawMode, vertexCount, indexType, offset);
  } else {
    gl.drawArrays(drawMode, offset, vertexCount);
  }
} /* eslint-disable */
// TODO - generic draw call
// One of the good things about GL is that there are so many ways to draw things

},{"./context":33,"./types":40,"assert":1}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _texture = require('./texture');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Framebuffer = function () {
  function Framebuffer(gl) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Framebuffer);

    this.gl = gl;

    this.width = opts.width ? opts.width : 1;
    this.height = opts.height ? opts.height : 1;
    this.depth = opts.depth === undefined ? true : opts.depth;
    this.minFilter = opts.minFilter || gl.NEAREST;
    this.magFilter = opts.magFilter || gl.NEAREST;
    this.format = opts.format || gl.RGBA;
    this.type = opts.type || gl.UNSIGNED_BYTE;
    this.fbo = gl.createFramebuffer();
    this.bind();

    this.texture = new _texture.Texture2D(gl, {
      width: this.width,
      height: this.height,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      type: this.type,
      format: this.format
    });

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);

    if (this.depth) {
      this.depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);
    }

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer creation failed.');
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _createClass(Framebuffer, [{
    key: 'bind',
    value: function bind() {
      var gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    }
  }]);

  return Framebuffer;
}();

exports.default = Framebuffer;

},{"./texture":39}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _types = require('./types');

Object.keys(_types).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _types[key];
    }
  });
});

var _context = require('./context');

Object.keys(_context).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _context[key];
    }
  });
});

var _draw = require('./draw');

Object.keys(_draw).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _draw[key];
    }
  });
});

var _buffer = require('./buffer');

Object.defineProperty(exports, 'Buffer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_buffer).default;
  }
});

var _program = require('./program');

Object.defineProperty(exports, 'Program', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_program).default;
  }
});

var _fbo = require('./fbo');

Object.defineProperty(exports, 'Framebuffer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_fbo).default;
  }
});

var _texture = require('./texture');

Object.defineProperty(exports, 'Texture2D', {
  enumerable: true,
  get: function get() {
    return _texture.Texture2D;
  }
});
Object.defineProperty(exports, 'TextureCube', {
  enumerable: true,
  get: function get() {
    return _texture.TextureCube;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"./buffer":32,"./context":33,"./draw":34,"./fbo":35,"./program":37,"./texture":39,"./types":40}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* eslint-disable no-console, complexity */

/* global console */


var _context = require('./context');

var _utils = require('../utils');

var _shader = require('./shader');

var _shaders = require('../shaders');

var _shaders2 = _interopRequireDefault(_shaders);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Program = function () {

  /*
   * @classdesc
   * Handles creation of programs, mapping of attributes and uniforms
   *
   * @class
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Object} opts - options
   * @param {String} opts.vs - Vertex shader source
   * @param {String} opts.fs - Fragment shader source
   * @param {String} opts.id= - Id
   */

  function Program(gl, opts, fs, id) {
    _classCallCheck(this, Program);

    (0, _assert2.default)(gl, 'Program needs WebGLRenderingContext');

    var vs = void 0;
    if (typeof opts === 'string') {
      console.warn('DEPRECATED: New use: Program(gl, {vs, fs, id})');
      vs = opts;
    } else {
      vs = opts.vs;
      fs = opts.fs;
      id = opts.id;
    }

    vs = vs || _shaders2.default.Vertex.Default;
    fs = fs || _shaders2.default.Fragment.Default;

    var program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program');
    }

    gl.attachShader(program, new _shader.VertexShader(gl, vs).handle);
    gl.attachShader(program, new _shader.FragmentShader(gl, fs).handle);
    gl.linkProgram(program);
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      throw new Error('Error linking ' + gl.getProgramInfoLog(program));
    }

    this.gl = gl;
    this.id = id || (0, _utils.uid)();
    this.program = program;
    // determine attribute locations (i.e. indices)
    this.attributeLocations = getAttributeLocations(gl, program);
    // prepare uniform setters
    this.uniformSetters = getUniformSetters(gl, program);
    // no attributes enabled yet
    this.attributeEnabled = {};
  }

  _createClass(Program, [{
    key: 'use',
    value: function use() {
      this.gl.useProgram(this.program);
      return this;
    }
  }, {
    key: 'setTexture',
    value: function setTexture(texture, index) {
      texture.bind(index);
      return this;
    }
  }, {
    key: 'setUniform',
    value: function setUniform(name, value) {
      if (name in this.uniformSetters) {
        this.uniformSetters[name](value);
      }
      return this;
    }
  }, {
    key: 'setUniforms',
    value: function setUniforms(uniformMap) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(uniformMap)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var name = _step.value;

          if (name in this.uniformSetters) {
            this.uniformSetters[name](uniformMap[name]);
          }
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

      return this;
    }
  }, {
    key: 'setBuffer',
    value: function setBuffer(buffer) {
      var location = this.attributeLocations[buffer.attribute];
      buffer.attachToLocation(location);
      return this;
    }
  }, {
    key: 'setBuffers',
    value: function setBuffers(buffers) {
      (0, _assert2.default)(Array.isArray(buffers), 'Program.setBuffers expects array');
      buffers = buffers.length === 1 && Array.isArray(buffers[0]) ? buffers[0] : buffers;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = buffers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var buffer = _step2.value;

          this.setBuffer(buffer);
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

      return this;
    }
  }, {
    key: 'unsetBuffer',
    value: function unsetBuffer(buffer) {
      var location = this.attributeLocations[buffer.attribute];
      buffer.detachFromLocation(location);
      return this;
    }
  }, {
    key: 'unsetBuffers',
    value: function unsetBuffers(buffers) {
      (0, _assert2.default)(Array.isArray(buffers), 'Program.setBuffers expects array');
      buffers = buffers.length === 1 && Array.isArray(buffers[0]) ? buffers[0] : buffers;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = buffers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var buffer = _step3.value;

          this.unsetBuffer(buffer);
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

      return this;
    }
  }]);

  return Program;
}();

// TODO - use tables to reduce complexity of method below
// const glUniformSetter = {
//   FLOAT: {function: 'uniform1fv', type: Float32Array},
//   FLOAT_VEC3: {function: 'uniform3fv', type: Float32Array},
//   FLOAT_MAT4: {function: 'uniformMatrix4fv', type: Float32Array},
//   INT: {function: 'uniform1iv', type: Uint16Array},
//   BOOL: {function: 'uniform1iv', type: Uint16Array},
//   SAMPLER_2D: {function: 'uniform1iv', type: Uint16Array},
//   SAMPLER_CUBE: {function: 'uniform1iv', type: Uint16Array}
// };

// Returns a Magic Uniform Setter


exports.default = Program;
function getUniformSetter(gl, glProgram, info, isArray) {
  var name = info.name;
  var type = info.type;

  var loc = gl.getUniformLocation(glProgram, name);

  var matrix = false;
  var vector = true;
  var glFunction = void 0;
  var TypedArray = void 0;

  if (info.size > 1 && isArray) {
    switch (type) {

      case gl.FLOAT:
        glFunction = gl.uniform1fv;
        TypedArray = Float32Array;
        vector = false;
        break;

      case gl.FLOAT_VEC3:
        glFunction = gl.uniform3fv;
        TypedArray = Float32Array;
        vector = true;
        break;

      case gl.FLOAT_MAT4:
        glFunction = gl.uniformMatrix4fv;
        TypedArray = Float32Array;
        vector = true;
        break;

      case gl.INT:
      case gl.BOOL:
      case gl.SAMPLER_2D:
      case gl.SAMPLER_CUBE:
        glFunction = gl.uniform1iv;
        TypedArray = Uint16Array;
        vector = false;
        break;

      default:
        throw new Error('Uniform: Unknown GLSL type ' + type);

    }
  }

  if (vector) {
    switch (type) {
      case gl.FLOAT:
        glFunction = gl.uniform1f;
        break;
      case gl.FLOAT_VEC2:
        glFunction = gl.uniform2fv;
        TypedArray = isArray ? Float32Array : new Float32Array(2);
        break;
      case gl.FLOAT_VEC3:
        glFunction = gl.uniform3fv;
        TypedArray = isArray ? Float32Array : new Float32Array(3);
        break;
      case gl.FLOAT_VEC4:
        glFunction = gl.uniform4fv;
        TypedArray = isArray ? Float32Array : new Float32Array(4);
        break;
      case gl.INT:case gl.BOOL:case gl.SAMPLER_2D:case gl.SAMPLER_CUBE:
        glFunction = gl.uniform1i;
        break;
      case gl.INT_VEC2:case gl.BOOL_VEC2:
        glFunction = gl.uniform2iv;
        TypedArray = isArray ? Uint16Array : new Uint16Array(2);
        break;
      case gl.INT_VEC3:case gl.BOOL_VEC3:
        glFunction = gl.uniform3iv;
        TypedArray = isArray ? Uint16Array : new Uint16Array(3);
        break;
      case gl.INT_VEC4:case gl.BOOL_VEC4:
        glFunction = gl.uniform4iv;
        TypedArray = isArray ? Uint16Array : new Uint16Array(4);
        break;
      case gl.FLOAT_MAT2:
        matrix = true;
        glFunction = gl.uniformMatrix2fv;
        break;
      case gl.FLOAT_MAT3:
        matrix = true;
        glFunction = gl.uniformMatrix3fv;
        break;
      case gl.FLOAT_MAT4:
        matrix = true;
        glFunction = gl.uniformMatrix4fv;
        break;
      default:
        break;
    }
  }

  glFunction = glFunction.bind(gl);

  // Set a uniform array
  if (isArray && TypedArray) {

    return function (val) {
      glFunction(loc, new TypedArray(val));
      (0, _context.glCheckError)(gl);
    };
  } else if (matrix) {
    // Set a matrix uniform
    return function (val) {
      glFunction(loc, false, val.toFloat32Array());
      (0, _context.glCheckError)(gl);
    };
  } else if (TypedArray) {

    // Set a vector/typed array uniform
    return function (val) {
      TypedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, TypedArray);
      (0, _context.glCheckError)(gl);
    };
  }
  // Set a primitive-valued uniform
  return function (val) {
    glFunction(loc, val);
    (0, _context.glCheckError)(gl);
  };
}

// create uniform setters
// Map of uniform names to setter functions
function getUniformSetters(gl, glProgram) {
  var uniformSetters = {};
  var length = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < length; i++) {
    var info = gl.getActiveUniform(glProgram, i);
    var name = info.name;
    // if array name then clean the array brackets
    name = name[name.length - 1] === ']' ? name.substr(0, name.length - 3) : name;
    uniformSetters[name] = getUniformSetter(gl, glProgram, info, info.name !== name);
  }
  return uniformSetters;
}

// determine attribute locations (maps attribute name to index)
function getAttributeLocations(gl, glProgram) {
  var length = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES);
  var attributeLocations = {};
  for (var i = 0; i < length; i++) {
    var info = gl.getActiveAttrib(glProgram, i);
    var index = gl.getAttribLocation(glProgram, info.name);
    attributeLocations[info.name] = index;
  }
  return attributeLocations;
}

},{"../shaders":30,"../utils":31,"./context":33,"./shader":38,"assert":1}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FragmentShader = exports.VertexShader = exports.Shader = undefined;

var _glFormatCompilerError = require('gl-format-compiler-error');

var _glFormatCompilerError2 = _interopRequireDefault(_glFormatCompilerError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// For now this is an internal class

var Shader = exports.Shader = function Shader(gl, shaderSource, shaderType) {
  _classCallCheck(this, Shader);

  this.gl = gl;
  this.handle = gl.createShader(shaderType);
  if (this.handle === null) {
    throw new Error('Error creating shader with type ' + shaderType);
  }
  gl.shaderSource(this.handle, shaderSource);
  gl.compileShader(this.handle);
  var compiled = gl.getShaderParameter(this.handle, gl.COMPILE_STATUS);
  if (!compiled) {
    var info = gl.getShaderInfoLog(this.handle);
    gl.deleteShader(this.handle);
    /* eslint-disable no-try-catch */
    var formattedLog;
    try {
      formattedLog = (0, _glFormatCompilerError2.default)(info, shaderSource, shaderType);
    } catch (error) {
      /* eslint-disable no-console */
      /* global console */
      console.warn('Error formatting glsl compiler error:', error);
      /* eslint-enable no-console */
      throw new Error('Error while compiling the shader ' + info);
    }
    /* eslint-enable no-try-catch */
    throw new Error(formattedLog.long);
  }
};

var VertexShader = exports.VertexShader = function (_Shader) {
  _inherits(VertexShader, _Shader);

  function VertexShader(gl, shaderSource) {
    _classCallCheck(this, VertexShader);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(VertexShader).call(this, gl, shaderSource, gl.VERTEX_SHADER));
  }

  return VertexShader;
}(Shader);

var FragmentShader = exports.FragmentShader = function (_Shader2) {
  _inherits(FragmentShader, _Shader2);

  function FragmentShader(gl, shaderSource) {
    _classCallCheck(this, FragmentShader);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(FragmentShader).call(this, gl, shaderSource, gl.FRAGMENT_SHADER));
  }

  return FragmentShader;
}(Shader);

},{"gl-format-compiler-error":8}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextureCube = exports.Texture2D = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('../utils');

var _context = require('./context');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Texture = function () {
  function Texture(gl) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Texture);

    this.gl = gl;
    this.target = gl.TEXTURE_2D;

    opts = (0, _utils.merge)({
      flipY: true,
      alignment: 1,
      magFilter: gl.NEAREST,
      minFilter: gl.NEAREST,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
      generateMipmap: false
    }, opts);

    this.flipY = opts.flipY;
    this.alignment = opts.alignment;
    this.magFilter = opts.magFilter;
    this.minFilter = opts.minFilter;
    this.wrapS = opts.wrapS;
    this.wrapT = opts.wrapT;
    this.format = opts.format;
    this.type = opts.type;
    this.generateMipmap = opts.generateMipmap;

    if (this.type === gl.FLOAT) {
      this.floatExtension = gl.getExtension('OES_texture_float');
      if (!this.floatExtension) {
        throw new Error('OES_texture_float is not supported.');
      }
    }

    this.texture = gl.createTexture();
    if (!this.texture) {
      (0, _context.glCheckError)(gl);
    }

    this.userData = {};
  }

  _createClass(Texture, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteTexture(this.texture);
      this.texture = null;
      (0, _context.glCheckError)(gl);

      return this;
    }
  }]);

  return Texture;
}();

var Texture2D = exports.Texture2D = function (_Texture) {
  _inherits(Texture2D, _Texture);

  function Texture2D(gl, opts) {
    _classCallCheck(this, Texture2D);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Texture2D).call(this, gl, opts));

    opts.data = opts.data || null;

    _this.width = 0;
    _this.height = 0;
    _this.border = 0;
    _this.data = null;
    Object.seal(_this);

    _this.update(opts);
    return _this;
  }

  _createClass(Texture2D, [{
    key: 'bind',
    value: function bind(index) {
      var gl = this.gl;
      if (index !== undefined) {
        gl.activeTexture(gl.TEXTURE0 + index);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      (0, _context.glCheckError)(gl);
      if (index === undefined) {
        var result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
        (0, _context.glCheckError)(gl);
        return result;
      }
      return index;
    }

    /* eslint-disable max-statements */

  }, {
    key: 'update',
    value: function update(opts) {
      var gl = this.gl;
      this.width = opts.width;
      this.height = opts.height;
      this.border = opts.border || 0;
      this.data = opts.data;
      if (this.flipY) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        (0, _context.glCheckError)(gl);
      } else {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        (0, _context.glCheckError)(gl);
      }
      this.bind();
      if (this.width || this.height) {
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data);
        (0, _context.glCheckError)(gl);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, this.data);
        (0, _context.glCheckError)(gl);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
      (0, _context.glCheckError)(gl);
      if (this.generateMipmap) {
        gl.generateMipmap(gl.TEXTURE_2D);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_2D, null);
      (0, _context.glCheckError)(gl);
    }
  }]);

  return Texture2D;
}(Texture);

var TextureCube = exports.TextureCube = function (_Texture2) {
  _inherits(TextureCube, _Texture2);

  function TextureCube(gl, opts) {
    _classCallCheck(this, TextureCube);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(TextureCube).call(this, gl, opts));

    opts.data = opts.data || null;
    _this2.update(opts);
    return _this2;
  }

  _createClass(TextureCube, [{
    key: 'bind',
    value: function bind(index) {
      var gl = this.gl;
      if (index !== undefined) {
        gl.activeTexture(gl.TEXTURE0 + index);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
      (0, _context.glCheckError)(gl);
      if (index === undefined) {
        var result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
        (0, _context.glCheckError)(gl);
        return result;
      }
      return index;
    }

    /* eslint-disable max-statements, max-len */

  }, {
    key: 'update',
    value: function update(opts) {
      var gl = this.gl;
      this.width = opts.width;
      this.height = opts.height;
      this.border = opts.border || 0;
      this.data = opts.data;
      this.bind();
      if (this.width || this.height) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.z);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.z);
        (0, _context.glCheckError)(gl);
      } else {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.format, this.format, this.type, this.data.pos.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.format, this.format, this.type, this.data.pos.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.format, this.format, this.type, this.data.pos.z);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.format, this.format, this.type, this.data.neg.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.format, this.format, this.type, this.data.neg.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.format, this.format, this.type, this.data.neg.z);
        (0, _context.glCheckError)(gl);
      }
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, this.minFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, this.magFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, this.wrapS);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, this.wrapT);
      (0, _context.glCheckError)(gl);
      if (this.generateMipmap) {
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      (0, _context.glCheckError)(gl);
    }
  }]);

  return TextureCube;
}(Texture);

},{"../utils":31,"./context":33}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require('../utils');

Object.defineProperty(exports, 'isTypedArray', {
  enumerable: true,
  get: function get() {
    return _utils.isTypedArray;
  }
});
Object.defineProperty(exports, 'makeTypedArray', {
  enumerable: true,
  get: function get() {
    return _utils.makeTypedArray;
  }
});
exports.isIndexType = isIndexType;
exports.isGLIndexType = isGLIndexType;
exports.isDrawMode = isDrawMode;
exports.isGLDrawMode = isGLDrawMode;


// INDEX TYPES

// For drawElements, size of indices
var INDEX_TYPES = exports.INDEX_TYPES = ['UNSIGNED_BYTE', 'UNSIGNED_SHORT'];
var GL_INDEX_TYPES = exports.GL_INDEX_TYPES = function GL_INDEX_TYPES(gl) {
  return INDEX_TYPES.map(function (constant) {
    return gl[constant];
  });
};

function isIndexType(type) {
  return INDEX_TYPES.indexOf(type) !== -1;
}
function isGLIndexType(glType) {
  return GL_INDEX_TYPES.indexOf(glType) !== -1;
}

// DRAW MODES

var DRAW_MODES = exports.DRAW_MODES = ['POINTS', 'LINE_STRIP', 'LINE_LOOP', 'LINES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN', 'TRIANGLES'];
var GL_DRAW_MODES = exports.GL_DRAW_MODES = function GL_DRAW_MODES(gl) {
  return DRAW_MODES.map(function (constant) {
    return gl[constant];
  });
};

function isDrawMode(mode) {
  return DRAW_MODES.indexOf(mode) !== -1;
}
function isGLDrawMode(glMode) {
  return GL_DRAW_MODES.indexOf(glMode) !== -1;
}

// TARGET TYPES

var TARGETS = exports.TARGETS = ['ARRAY_BUFFER', // vertex attributes (e.g. vertex/texture coords or color)
'ELEMENT_ARRAY_BUFFER', // Buffer used for element indices.
// For WebGL 2 contexts
'COPY_READ_BUFFER', // Buffer for copying from one buffer object to another
'COPY_WRITE_BUFFER', // Buffer for copying from one buffer object to another
'TRANSFORM_FEEDBACK_BUFFER', // Buffer for transform feedback operations
'UNIFORM_BUFFER', // Buffer used for storing uniform blocks
'PIXEL_PACK_BUFFER', // Buffer used for pixel transfer operations
'PIXEL_UNPACK_BUFFER' // Buffer used for pixel transfer operations
];

var GL_TARGETS = exports.GL_TARGETS = function GL_TARGETS(gl) {
  return TARGETS.map(function (constant) {
    return gl[constant];
  }).filter(function (constant) {
    return constant;
  });
};

// USAGE TYPES

var BUFFER_USAGE = exports.BUFFER_USAGE = ['STATIC_DRAW', // Buffer used often and not change often. Contents are written to the buffer, but not read.
'DYNAMIC_DRAW', // Buffer used often and change often. Contents are written to the buffer, but not read.
'STREAM_DRAW', // Buffer not used often. Contents are written to the buffer, but not read.
// For WebGL 2 contexts
'STATIC_READ', // Buffer used often and not change often. Contents are read from the buffer, but not written.
'DYNAMIC_READ', // Buffer used often and change often. Contents are read from the buffer, but not written.
'STREAM_READ', // Contents of the buffer are likely to not be used often. Contents are read from the buffer, but not written.
'STATIC_COPY', // Buffer used often and not change often. Contents are neither written or read by the user.
'DYNAMIC_COPY', // Buffer used often and change often. Contents are neither written or read by the user.
'STREAM_COPY' // Buffer used often and not change often. Contents are neither written or read by the user.
];

var GL_BUFFER_USAGE = exports.GL_BUFFER_USAGE = function GL_BUFFER_USAGE(gl) {
  return BUFFER_USAGE.map(function (constant) {
    return gl[constant];
  }).filter(function (constant) {
    return constant;
  });
};

},{"../utils":31}]},{},[26])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtdG8tYmxvYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9maWxlc2F2ZXIuanMvRmlsZVNhdmVyLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1mb3JtYXQtY29tcGlsZXItZXJyb3Ivbm9kZV9tb2R1bGVzL2FkZC1saW5lLW51bWJlcnMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL25vZGVfbW9kdWxlcy9hZGQtbGluZS1udW1iZXJzL25vZGVfbW9kdWxlcy9wYWQtbGVmdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1mb3JtYXQtY29tcGlsZXItZXJyb3Ivbm9kZV9tb2R1bGVzL2FkZC1saW5lLW51bWJlcnMvbm9kZV9tb2R1bGVzL3BhZC1sZWZ0L25vZGVfbW9kdWxlcy9yZXBlYXQtc3RyaW5nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9ub2RlX21vZHVsZXMvZ2wtY29uc3RhbnRzLzEuMC9udW1iZXJzLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9ub2RlX21vZHVsZXMvZ2wtY29uc3RhbnRzL2xvb2t1cC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1mb3JtYXQtY29tcGlsZXItZXJyb3Ivbm9kZV9tb2R1bGVzL2dsc2wtc2hhZGVyLW5hbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL25vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL25vZGVfbW9kdWxlcy9hdG9iLWxpdGUvYXRvYi1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9ub2RlX21vZHVsZXMvZ2xzbC1zaGFkZXItbmFtZS9ub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL25vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL25vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvYnVpbHRpbnMtMzAwZXMuanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL25vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL25vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvYnVpbHRpbnMuanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL25vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL25vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvbGl0ZXJhbHMtMzAwZXMuanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL25vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL25vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvbGl0ZXJhbHMuanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL25vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL25vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvb3BlcmF0b3JzLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9ub2RlX21vZHVsZXMvZ2xzbC1zaGFkZXItbmFtZS9ub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9ub2RlX21vZHVsZXMvc3ByaW50Zi1qcy9zcmMvc3ByaW50Zi5qcyIsInNyYy9hZGRvbnMvZnguanMiLCJzcmMvYWRkb25zL2hlbHBlcnMuanMiLCJzcmMvYWRkb25zL2luZGV4LmpzIiwic3JjL2FkZG9ucy9zYXZlLWJpdG1hcC5qcyIsInNyYy9hZGRvbnMvd29ya2Vycy5qcyIsInNyYy9pby5qcyIsInNyYy9zaGFkZXJzL2luZGV4LmpzIiwic3JjL3V0aWxzLmpzIiwic3JjL3dlYmdsL2J1ZmZlci5qcyIsInNyYy93ZWJnbC9jb250ZXh0LmpzIiwic3JjL3dlYmdsL2RyYXcuanMiLCJzcmMvd2ViZ2wvZmJvLmpzIiwic3JjL3dlYmdsL2luZGV4LmpzIiwic3JjL3dlYmdsL3Byb2dyYW0uanMiLCJzcmMvd2ViZ2wvc2hhZGVyLmpzIiwic3JjL3dlYmdsL3RleHR1cmUuanMiLCJzcmMvd2ViZ2wvdHlwZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QjtBQUcxQixhQUgwQjs7QUFLMUIsYUFMMEI7QUFNMUIsY0FOMEI7QUFPMUIsYUFQMEI7QUFRMUIsYUFSMEI7QUFTMUIsY0FUMEI7QUFVMUI7QUFWMEIsQ0FBZjs7QUFhTixJQUFNLDRDQUNYLFNBRFcsZUFDWDtTQUFNLGFBQWEsR0FBYixDQUFpQjtXQUFZLEdBQUcsUUFBSDtHQUFaLENBQWpCLENBQTJDLE1BQTNDLENBQWtEO1dBQVk7R0FBWjtDQUF4RCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAhaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKSB7XG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIH1cbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKSxcbiAgICAgIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh1cmkpIHtcbiAgICB2YXIgbWltZSAgID0gdXJpLnNwbGl0KCcsJylbMF0uc3BsaXQoJzonKVsxXS5zcGxpdCgnOycpWzBdO1xuICAgIHZhciBieXRlcyAgPSBhdG9iKHVyaS5zcGxpdCgnLCcpWzFdKTtcbiAgICB2YXIgbGVuICAgID0gYnl0ZXMubGVuZ3RoO1xuICAgIHZhciBidWZmZXIgPSBuZXcgd2luZG93LkFycmF5QnVmZmVyKGxlbik7XG4gICAgdmFyIGFyciAgICA9IG5ldyB3aW5kb3cuVWludDhBcnJheShidWZmZXIpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBhcnJbaV0gPSBieXRlcy5jaGFyQ29kZUF0KGkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQmxvYihbYXJyXSwgeyB0eXBlOiBtaW1lIH0pO1xufVxuXG4vLyBJRSA+PSAxMCwgbW9zdCBtb2Rlcm4gYnJvd3NlcnNcbi8vIFRoZSBCbG9iIHR5cGUgY2FuJ3QgYmUgcG9seWZpbGxlZCwgd2hpY2ggaXMgd2h5IHRoZXJlIGFyZW4ndCBhbnkgcG9seWZpbGxzIGZvciBUeXBlZEFycmF5cyBmb3Igb2xkZXIgSUUnc1xubW9kdWxlLmV4cG9ydHMuc3VwcG9ydGVkID0gKFxuICAgIHR5cGVvZiB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIHdpbmRvdy5hdG9iICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuQmxvYiAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2Ygd2luZG93LkFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCdcbik7XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFtb2R1bGUuZXhwb3J0cy5zdXBwb3J0ZWQpIHJldHVybjtcbiAgICB2YXIgQ2FudmFzUHJvdG90eXBlID0gd2luZG93LkhUTUxDYW52YXNFbGVtZW50LnByb3RvdHlwZTtcbiAgICBcbiAgICBpZiAoIUNhbnZhc1Byb3RvdHlwZS50b0Jsb2IgJiYgQ2FudmFzUHJvdG90eXBlLnRvRGF0YVVSTCkge1xuICAgICAgICBDYW52YXNQcm90b3R5cGUudG9CbG9iID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0eXBlLCBxdWFsaXR5KSB7XG4gICAgICAgICAgICBjYWxsYmFjayhtb2R1bGUuZXhwb3J0cyh0aGlzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLyogRmlsZVNhdmVyLmpzXG4gKiBBIHNhdmVBcygpIEZpbGVTYXZlciBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMS4yMDE1MDcxNlxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IFgxMS9NSVRcbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiAqL1xuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSwgaW5kZW50OiA0LCBsYXhicmVhazogdHJ1ZSwgbGF4Y29tbWE6IHRydWUsIHNtYXJ0dGFiczogdHJ1ZSwgcGx1c3BsdXM6IHRydWUgKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9GaWxlU2F2ZXIuanMgKi9cblxudmFyIHNhdmVBcyA9IHNhdmVBcyB8fCAoZnVuY3Rpb24odmlldykge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0Ly8gSUUgPDEwIGlzIGV4cGxpY2l0bHkgdW5zdXBwb3J0ZWRcblx0aWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgL01TSUUgWzEtOV1cXC4vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyXG5cdFx0ICBkb2MgPSB2aWV3LmRvY3VtZW50XG5cdFx0ICAvLyBvbmx5IGdldCBVUkwgd2hlbiBuZWNlc3NhcnkgaW4gY2FzZSBCbG9iLmpzIGhhc24ndCBvdmVycmlkZGVuIGl0IHlldFxuXHRcdCwgZ2V0X1VSTCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHZpZXcuVVJMIHx8IHZpZXcud2Via2l0VVJMIHx8IHZpZXc7XG5cdFx0fVxuXHRcdCwgc2F2ZV9saW5rID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpXG5cdFx0LCBjYW5fdXNlX3NhdmVfbGluayA9IFwiZG93bmxvYWRcIiBpbiBzYXZlX2xpbmtcblx0XHQsIGNsaWNrID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIGV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoXCJjbGlja1wiKTtcblx0XHRcdG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XG5cdFx0fVxuXHRcdCwgd2Via2l0X3JlcV9mcyA9IHZpZXcud2Via2l0UmVxdWVzdEZpbGVTeXN0ZW1cblx0XHQsIHJlcV9mcyA9IHZpZXcucmVxdWVzdEZpbGVTeXN0ZW0gfHwgd2Via2l0X3JlcV9mcyB8fCB2aWV3Lm1velJlcXVlc3RGaWxlU3lzdGVtXG5cdFx0LCB0aHJvd19vdXRzaWRlID0gZnVuY3Rpb24oZXgpIHtcblx0XHRcdCh2aWV3LnNldEltbWVkaWF0ZSB8fCB2aWV3LnNldFRpbWVvdXQpKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aHJvdyBleDtcblx0XHRcdH0sIDApO1xuXHRcdH1cblx0XHQsIGZvcmNlX3NhdmVhYmxlX3R5cGUgPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiXG5cdFx0LCBmc19taW5fc2l6ZSA9IDBcblx0XHQvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3NTI5NyNjNyBhbmRcblx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9GaWxlU2F2ZXIuanMvY29tbWl0LzQ4NTkzMGEjY29tbWl0Y29tbWVudC04NzY4MDQ3XG5cdFx0Ly8gZm9yIHRoZSByZWFzb25pbmcgYmVoaW5kIHRoZSB0aW1lb3V0IGFuZCByZXZvY2F0aW9uIGZsb3dcblx0XHQsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCA9IDUwMCAvLyBpbiBtc1xuXHRcdCwgcmV2b2tlID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0dmFyIHJldm9rZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBmaWxlID09PSBcInN0cmluZ1wiKSB7IC8vIGZpbGUgaXMgYW4gb2JqZWN0IFVSTFxuXHRcdFx0XHRcdGdldF9VUkwoKS5yZXZva2VPYmplY3RVUkwoZmlsZSk7XG5cdFx0XHRcdH0gZWxzZSB7IC8vIGZpbGUgaXMgYSBGaWxlXG5cdFx0XHRcdFx0ZmlsZS5yZW1vdmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdGlmICh2aWV3LmNocm9tZSkge1xuXHRcdFx0XHRyZXZva2VyKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZXRUaW1lb3V0KHJldm9rZXIsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCwgZGlzcGF0Y2ggPSBmdW5jdGlvbihmaWxlc2F2ZXIsIGV2ZW50X3R5cGVzLCBldmVudCkge1xuXHRcdFx0ZXZlbnRfdHlwZXMgPSBbXS5jb25jYXQoZXZlbnRfdHlwZXMpO1xuXHRcdFx0dmFyIGkgPSBldmVudF90eXBlcy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHZhciBsaXN0ZW5lciA9IGZpbGVzYXZlcltcIm9uXCIgKyBldmVudF90eXBlc1tpXV07XG5cdFx0XHRcdGlmICh0eXBlb2YgbGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsKGZpbGVzYXZlciwgZXZlbnQgfHwgZmlsZXNhdmVyKTtcblx0XHRcdFx0XHR9IGNhdGNoIChleCkge1xuXHRcdFx0XHRcdFx0dGhyb3dfb3V0c2lkZShleCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCwgYXV0b19ib20gPSBmdW5jdGlvbihibG9iKSB7XG5cdFx0XHQvLyBwcmVwZW5kIEJPTSBmb3IgVVRGLTggWE1MIGFuZCB0ZXh0LyogdHlwZXMgKGluY2x1ZGluZyBIVE1MKVxuXHRcdFx0aWYgKC9eXFxzKig/OnRleHRcXC9cXFMqfGFwcGxpY2F0aW9uXFwveG1sfFxcUypcXC9cXFMqXFwreG1sKVxccyo7LipjaGFyc2V0XFxzKj1cXHMqdXRmLTgvaS50ZXN0KGJsb2IudHlwZSkpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBCbG9iKFtcIlxcdWZlZmZcIiwgYmxvYl0sIHt0eXBlOiBibG9iLnR5cGV9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBibG9iO1xuXHRcdH1cblx0XHQsIEZpbGVTYXZlciA9IGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdC8vIEZpcnN0IHRyeSBhLmRvd25sb2FkLCB0aGVuIHdlYiBmaWxlc3lzdGVtLCB0aGVuIG9iamVjdCBVUkxzXG5cdFx0XHR2YXJcblx0XHRcdFx0ICBmaWxlc2F2ZXIgPSB0aGlzXG5cdFx0XHRcdCwgdHlwZSA9IGJsb2IudHlwZVxuXHRcdFx0XHQsIGJsb2JfY2hhbmdlZCA9IGZhbHNlXG5cdFx0XHRcdCwgb2JqZWN0X3VybFxuXHRcdFx0XHQsIHRhcmdldF92aWV3XG5cdFx0XHRcdCwgZGlzcGF0Y2hfYWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcIndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgd3JpdGVlbmRcIi5zcGxpdChcIiBcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIG9uIGFueSBmaWxlc3lzIGVycm9ycyByZXZlcnQgdG8gc2F2aW5nIHdpdGggb2JqZWN0IFVSTHNcblx0XHRcdFx0LCBmc19lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdC8vIGRvbid0IGNyZWF0ZSBtb3JlIG9iamVjdCBVUkxzIHRoYW4gbmVlZGVkXG5cdFx0XHRcdFx0aWYgKGJsb2JfY2hhbmdlZCB8fCAhb2JqZWN0X3VybCkge1xuXHRcdFx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh0YXJnZXRfdmlldykge1xuXHRcdFx0XHRcdFx0dGFyZ2V0X3ZpZXcubG9jYXRpb24uaHJlZiA9IG9iamVjdF91cmw7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHZhciBuZXdfdGFiID0gdmlldy5vcGVuKG9iamVjdF91cmwsIFwiX2JsYW5rXCIpO1xuXHRcdFx0XHRcdFx0aWYgKG5ld190YWIgPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBzYWZhcmkgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0XHRcdFx0Ly9BcHBsZSBkbyBub3QgYWxsb3cgd2luZG93Lm9wZW4sIHNlZSBodHRwOi8vYml0Lmx5LzFrWmZmUklcblx0XHRcdFx0XHRcdFx0dmlldy5sb2NhdGlvbi5ocmVmID0gb2JqZWN0X3VybFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQsIGFib3J0YWJsZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcblx0XHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAoZmlsZXNhdmVyLnJlYWR5U3RhdGUgIT09IGZpbGVzYXZlci5ET05FKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XHQsIGNyZWF0ZV9pZl9ub3RfZm91bmQgPSB7Y3JlYXRlOiB0cnVlLCBleGNsdXNpdmU6IGZhbHNlfVxuXHRcdFx0XHQsIHNsaWNlXG5cdFx0XHQ7XG5cdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5JTklUO1xuXHRcdFx0aWYgKCFuYW1lKSB7XG5cdFx0XHRcdG5hbWUgPSBcImRvd25sb2FkXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAoY2FuX3VzZV9zYXZlX2xpbmspIHtcblx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdHNhdmVfbGluay5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0c2F2ZV9saW5rLmRvd25sb2FkID0gbmFtZTtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRjbGljayhzYXZlX2xpbmspO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Ly8gT2JqZWN0IGFuZCB3ZWIgZmlsZXN5c3RlbSBVUkxzIGhhdmUgYSBwcm9ibGVtIHNhdmluZyBpbiBHb29nbGUgQ2hyb21lIHdoZW5cblx0XHRcdC8vIHZpZXdlZCBpbiBhIHRhYiwgc28gSSBmb3JjZSBzYXZlIHdpdGggYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXG5cdFx0XHQvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD05MTE1OFxuXHRcdFx0Ly8gVXBkYXRlOiBHb29nbGUgZXJyYW50bHkgY2xvc2VkIDkxMTU4LCBJIHN1Ym1pdHRlZCBpdCBhZ2Fpbjpcblx0XHRcdC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zODk2NDJcblx0XHRcdGlmICh2aWV3LmNocm9tZSAmJiB0eXBlICYmIHR5cGUgIT09IGZvcmNlX3NhdmVhYmxlX3R5cGUpIHtcblx0XHRcdFx0c2xpY2UgPSBibG9iLnNsaWNlIHx8IGJsb2Iud2Via2l0U2xpY2U7XG5cdFx0XHRcdGJsb2IgPSBzbGljZS5jYWxsKGJsb2IsIDAsIGJsb2Iuc2l6ZSwgZm9yY2Vfc2F2ZWFibGVfdHlwZSk7XG5cdFx0XHRcdGJsb2JfY2hhbmdlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHQvLyBTaW5jZSBJIGNhbid0IGJlIHN1cmUgdGhhdCB0aGUgZ3Vlc3NlZCBtZWRpYSB0eXBlIHdpbGwgdHJpZ2dlciBhIGRvd25sb2FkXG5cdFx0XHQvLyBpbiBXZWJLaXQsIEkgYXBwZW5kIC5kb3dubG9hZCB0byB0aGUgZmlsZW5hbWUuXG5cdFx0XHQvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjU0NDBcblx0XHRcdGlmICh3ZWJraXRfcmVxX2ZzICYmIG5hbWUgIT09IFwiZG93bmxvYWRcIikge1xuXHRcdFx0XHRuYW1lICs9IFwiLmRvd25sb2FkXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAodHlwZSA9PT0gZm9yY2Vfc2F2ZWFibGVfdHlwZSB8fCB3ZWJraXRfcmVxX2ZzKSB7XG5cdFx0XHRcdHRhcmdldF92aWV3ID0gdmlldztcblx0XHRcdH1cblx0XHRcdGlmICghcmVxX2ZzKSB7XG5cdFx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGZzX21pbl9zaXplICs9IGJsb2Iuc2l6ZTtcblx0XHRcdHJlcV9mcyh2aWV3LlRFTVBPUkFSWSwgZnNfbWluX3NpemUsIGFib3J0YWJsZShmdW5jdGlvbihmcykge1xuXHRcdFx0XHRmcy5yb290LmdldERpcmVjdG9yeShcInNhdmVkXCIsIGNyZWF0ZV9pZl9ub3RfZm91bmQsIGFib3J0YWJsZShmdW5jdGlvbihkaXIpIHtcblx0XHRcdFx0XHR2YXIgc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZGlyLmdldEZpbGUobmFtZSwgY3JlYXRlX2lmX25vdF9mb3VuZCwgYWJvcnRhYmxlKGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdFx0XHRcdFx0ZmlsZS5jcmVhdGVXcml0ZXIoYWJvcnRhYmxlKGZ1bmN0aW9uKHdyaXRlcikge1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRhcmdldF92aWV3LmxvY2F0aW9uLmhyZWYgPSBmaWxlLnRvVVJMKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcIndyaXRlZW5kXCIsIGV2ZW50KTtcblx0XHRcdFx0XHRcdFx0XHRcdHJldm9rZShmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgZXJyb3IgPSB3cml0ZXIuZXJyb3I7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoZXJyb3IuY29kZSAhPT0gZXJyb3IuQUJPUlRfRVJSKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcIndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgYWJvcnRcIi5zcGxpdChcIiBcIikuZm9yRWFjaChmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0d3JpdGVyW1wib25cIiArIGV2ZW50XSA9IGZpbGVzYXZlcltcIm9uXCIgKyBldmVudF07XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0d3JpdGVyLndyaXRlKGJsb2IpO1xuXHRcdFx0XHRcdFx0XHRcdGZpbGVzYXZlci5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0d3JpdGVyLmFib3J0KCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuV1JJVElORztcblx0XHRcdFx0XHRcdFx0fSksIGZzX2Vycm9yKTtcblx0XHRcdFx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRkaXIuZ2V0RmlsZShuYW1lLCB7Y3JlYXRlOiBmYWxzZX0sIGFib3J0YWJsZShmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdFx0XHQvLyBkZWxldGUgZmlsZSBpZiBpdCBhbHJlYWR5IGV4aXN0c1xuXHRcdFx0XHRcdFx0ZmlsZS5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdHNhdmUoKTtcblx0XHRcdFx0XHR9KSwgYWJvcnRhYmxlKGZ1bmN0aW9uKGV4KSB7XG5cdFx0XHRcdFx0XHRpZiAoZXguY29kZSA9PT0gZXguTk9UX0ZPVU5EX0VSUikge1xuXHRcdFx0XHRcdFx0XHRzYXZlKCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRmc19lcnJvcigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0fSksIGZzX2Vycm9yKTtcblx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0fVxuXHRcdCwgRlNfcHJvdG8gPSBGaWxlU2F2ZXIucHJvdG90eXBlXG5cdFx0LCBzYXZlQXMgPSBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBGaWxlU2F2ZXIoYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pO1xuXHRcdH1cblx0O1xuXHQvLyBJRSAxMCsgKG5hdGl2ZSBzYXZlQXMpXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmIG5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihibG9iLCBuYW1lIHx8IFwiZG93bmxvYWRcIik7XG5cdFx0fTtcblx0fVxuXG5cdEZTX3Byb3RvLmFib3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZpbGVzYXZlciA9IHRoaXM7XG5cdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRkaXNwYXRjaChmaWxlc2F2ZXIsIFwiYWJvcnRcIik7XG5cdH07XG5cdEZTX3Byb3RvLnJlYWR5U3RhdGUgPSBGU19wcm90by5JTklUID0gMDtcblx0RlNfcHJvdG8uV1JJVElORyA9IDE7XG5cdEZTX3Byb3RvLkRPTkUgPSAyO1xuXG5cdEZTX3Byb3RvLmVycm9yID1cblx0RlNfcHJvdG8ub253cml0ZXN0YXJ0ID1cblx0RlNfcHJvdG8ub25wcm9ncmVzcyA9XG5cdEZTX3Byb3RvLm9ud3JpdGUgPVxuXHRGU19wcm90by5vbmFib3J0ID1cblx0RlNfcHJvdG8ub25lcnJvciA9XG5cdEZTX3Byb3RvLm9ud3JpdGVlbmQgPVxuXHRcdG51bGw7XG5cblx0cmV0dXJuIHNhdmVBcztcbn0oXG5cdCAgIHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGZcblx0fHwgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3dcblx0fHwgdGhpcy5jb250ZW50XG4pKTtcbi8vIGBzZWxmYCBpcyB1bmRlZmluZWQgaW4gRmlyZWZveCBmb3IgQW5kcm9pZCBjb250ZW50IHNjcmlwdCBjb250ZXh0XG4vLyB3aGlsZSBgdGhpc2AgaXMgbnNJQ29udGVudEZyYW1lTWVzc2FnZU1hbmFnZXJcbi8vIHdpdGggYW4gYXR0cmlidXRlIGBjb250ZW50YCB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSB3aW5kb3dcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgbW9kdWxlLmV4cG9ydHMuc2F2ZUFzID0gc2F2ZUFzO1xufSBlbHNlIGlmICgodHlwZW9mIGRlZmluZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkZWZpbmUgIT09IG51bGwpICYmIChkZWZpbmUuYW1kICE9IG51bGwpKSB7XG4gIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNhdmVBcztcbiAgfSk7XG59XG4iLCJcbnZhciBzcHJpbnRmID0gcmVxdWlyZSgnc3ByaW50Zi1qcycpLnNwcmludGY7XG52YXIgZ2xDb25zdGFudHMgPSByZXF1aXJlKCdnbC1jb25zdGFudHMvbG9va3VwJyk7XG52YXIgc2hhZGVyTmFtZSA9IHJlcXVpcmUoJ2dsc2wtc2hhZGVyLW5hbWUnKTtcbnZhciBhZGRMaW5lTnVtYmVycyA9IHJlcXVpcmUoJ2FkZC1saW5lLW51bWJlcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmb3JtYXRDb21waWxlckVycm9yO1xuXG5mdW5jdGlvbiBmb3JtYXRDb21waWxlckVycm9yKGVyckxvZywgc3JjLCB0eXBlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbmFtZSA9IHNoYWRlck5hbWUoc3JjKSB8fCAnb2YgdW5rbm93biBuYW1lIChzZWUgbnBtIGdsc2wtc2hhZGVyLW5hbWUpJztcblxuICAgIHZhciB0eXBlTmFtZSA9ICd1bmtub3duIHR5cGUnO1xuICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHlwZU5hbWUgPSB0eXBlID09PSBnbENvbnN0YW50cy5GUkFHTUVOVF9TSEFERVIgPyAnZnJhZ21lbnQnIDogJ3ZlcnRleCdcbiAgICB9XG5cbiAgICB2YXIgbG9uZ0Zvcm0gPSBzcHJpbnRmKCdFcnJvciBjb21waWxpbmcgJXMgc2hhZGVyICVzOlxcbicsIHR5cGVOYW1lLCBuYW1lKTtcbiAgICB2YXIgc2hvcnRGb3JtID0gc3ByaW50ZihcIiVzJXNcIiwgbG9uZ0Zvcm0sIGVyckxvZyk7XG5cbiAgICB2YXIgZXJyb3JTdHJpbmdzID0gZXJyTG9nLnNwbGl0KCdcXG4nKTtcbiAgICB2YXIgZXJyb3JzID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVycm9yU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZXJyb3JTdHJpbmcgPSBlcnJvclN0cmluZ3NbaV07XG4gICAgICAgIGlmIChlcnJvclN0cmluZyA9PT0gJycpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgbGluZU5vID0gcGFyc2VJbnQoZXJyb3JTdHJpbmcuc3BsaXQoJzonKVsyXSk7XG4gICAgICAgIGlmIChpc05hTihsaW5lTm8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZignQ291bGQgbm90IHBhcnNlIGVycm9yOiAlcycsIGVycm9yU3RyaW5nKSk7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzW2xpbmVOb10gPSBlcnJvclN0cmluZztcbiAgICB9XG5cbiAgICB2YXIgbGluZXMgPSBhZGRMaW5lTnVtYmVycyhzcmMpLnNwbGl0KCdcXG4nKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFlcnJvcnNbaSszXSAmJiAhZXJyb3JzW2krMl0gJiYgIWVycm9yc1tpKzFdKSBjb250aW51ZTtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcbiAgICAgICAgbG9uZ0Zvcm0gKz0gbGluZSArICdcXG4nO1xuICAgICAgICBpZiAoZXJyb3JzW2krMV0pIHtcbiAgICAgICAgICAgIHZhciBlID0gZXJyb3JzW2krMV07XG4gICAgICAgICAgICBlID0gZS5zdWJzdHIoZS5zcGxpdCgnOicsIDMpLmpvaW4oJzonKS5sZW5ndGggKyAxKS50cmltKCk7XG4gICAgICAgICAgICBsb25nRm9ybSArPSBzcHJpbnRmKCdeXl4gJXNcXG5cXG4nLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvbmc6IGxvbmdGb3JtLnRyaW0oKSxcbiAgICAgICAgc2hvcnQ6IHNob3J0Rm9ybS50cmltKClcbiAgICB9O1xufVxuXG4iLCJ2YXIgcGFkTGVmdCA9IHJlcXVpcmUoJ3BhZC1sZWZ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBhZGRMaW5lTnVtYmVyc1xuZnVuY3Rpb24gYWRkTGluZU51bWJlcnMgKHN0cmluZywgc3RhcnQsIGRlbGltKSB7XG4gIHN0YXJ0ID0gdHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJyA/IHN0YXJ0IDogMVxuICBkZWxpbSA9IGRlbGltIHx8ICc6ICdcblxuICB2YXIgbGluZXMgPSBzdHJpbmcuc3BsaXQoL1xccj9cXG4vKVxuICB2YXIgdG90YWxEaWdpdHMgPSBTdHJpbmcobGluZXMubGVuZ3RoICsgc3RhcnQgLSAxKS5sZW5ndGhcbiAgcmV0dXJuIGxpbmVzLm1hcChmdW5jdGlvbiAobGluZSwgaSkge1xuICAgIHZhciBjID0gaSArIHN0YXJ0XG4gICAgdmFyIGRpZ2l0cyA9IFN0cmluZyhjKS5sZW5ndGhcbiAgICB2YXIgcHJlZml4ID0gcGFkTGVmdChjLCB0b3RhbERpZ2l0cyAtIGRpZ2l0cylcbiAgICByZXR1cm4gcHJlZml4ICsgZGVsaW0gKyBsaW5lXG4gIH0pLmpvaW4oJ1xcbicpXG59XG4iLCIvKiFcbiAqIHBhZC1sZWZ0IDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9wYWQtbGVmdD5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVwZWF0ID0gcmVxdWlyZSgncmVwZWF0LXN0cmluZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhZExlZnQoc3RyLCBudW0sIGNoKSB7XG4gIGNoID0gdHlwZW9mIGNoICE9PSAndW5kZWZpbmVkJyA/IChjaCArICcnKSA6ICcgJztcbiAgcmV0dXJuIHJlcGVhdChjaCwgbnVtKSArIHN0cjtcbn07IiwiLyohXG4gKiByZXBlYXQtc3RyaW5nIDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9yZXBlYXQtc3RyaW5nPlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBKb24gU2NobGlua2VydC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogUmVzdWx0cyBjYWNoZVxuICovXG5cbnZhciByZXMgPSAnJztcbnZhciBjYWNoZTtcblxuLyoqXG4gKiBFeHBvc2UgYHJlcGVhdGBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcGVhdDtcblxuLyoqXG4gKiBSZXBlYXQgdGhlIGdpdmVuIGBzdHJpbmdgIHRoZSBzcGVjaWZpZWQgYG51bWJlcmBcbiAqIG9mIHRpbWVzLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgcmVwZWF0ID0gcmVxdWlyZSgncmVwZWF0LXN0cmluZycpO1xuICogcmVwZWF0KCdBJywgNSk7XG4gKiAvLz0+IEFBQUFBXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYHN0cmluZ2AgVGhlIHN0cmluZyB0byByZXBlYXRcbiAqIEBwYXJhbSB7TnVtYmVyfSBgbnVtYmVyYCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFJlcGVhdGVkIHN0cmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiByZXBlYXQoc3RyLCBudW0pIHtcbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncmVwZWF0LXN0cmluZyBleHBlY3RzIGEgc3RyaW5nLicpO1xuICB9XG5cbiAgLy8gY292ZXIgY29tbW9uLCBxdWljayB1c2UgY2FzZXNcbiAgaWYgKG51bSA9PT0gMSkgcmV0dXJuIHN0cjtcbiAgaWYgKG51bSA9PT0gMikgcmV0dXJuIHN0ciArIHN0cjtcblxuICB2YXIgbWF4ID0gc3RyLmxlbmd0aCAqIG51bTtcbiAgaWYgKGNhY2hlICE9PSBzdHIgfHwgdHlwZW9mIGNhY2hlID09PSAndW5kZWZpbmVkJykge1xuICAgIGNhY2hlID0gc3RyO1xuICAgIHJlcyA9ICcnO1xuICB9XG5cbiAgd2hpbGUgKG1heCA+IHJlcy5sZW5ndGggJiYgbnVtID4gMCkge1xuICAgIGlmIChudW0gJiAxKSB7XG4gICAgICByZXMgKz0gc3RyO1xuICAgIH1cblxuICAgIG51bSA+Pj0gMTtcbiAgICBpZiAoIW51bSkgYnJlYWs7XG4gICAgc3RyICs9IHN0cjtcbiAgfVxuXG4gIHJldHVybiByZXMuc3Vic3RyKDAsIG1heCk7XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAwOiAnTk9ORScsXG4gIDE6ICdPTkUnLFxuICAyOiAnTElORV9MT09QJyxcbiAgMzogJ0xJTkVfU1RSSVAnLFxuICA0OiAnVFJJQU5HTEVTJyxcbiAgNTogJ1RSSUFOR0xFX1NUUklQJyxcbiAgNjogJ1RSSUFOR0xFX0ZBTicsXG4gIDI1NjogJ0RFUFRIX0JVRkZFUl9CSVQnLFxuICA1MTI6ICdORVZFUicsXG4gIDUxMzogJ0xFU1MnLFxuICA1MTQ6ICdFUVVBTCcsXG4gIDUxNTogJ0xFUVVBTCcsXG4gIDUxNjogJ0dSRUFURVInLFxuICA1MTc6ICdOT1RFUVVBTCcsXG4gIDUxODogJ0dFUVVBTCcsXG4gIDUxOTogJ0FMV0FZUycsXG4gIDc2ODogJ1NSQ19DT0xPUicsXG4gIDc2OTogJ09ORV9NSU5VU19TUkNfQ09MT1InLFxuICA3NzA6ICdTUkNfQUxQSEEnLFxuICA3NzE6ICdPTkVfTUlOVVNfU1JDX0FMUEhBJyxcbiAgNzcyOiAnRFNUX0FMUEhBJyxcbiAgNzczOiAnT05FX01JTlVTX0RTVF9BTFBIQScsXG4gIDc3NDogJ0RTVF9DT0xPUicsXG4gIDc3NTogJ09ORV9NSU5VU19EU1RfQ09MT1InLFxuICA3NzY6ICdTUkNfQUxQSEFfU0FUVVJBVEUnLFxuICAxMDI0OiAnU1RFTkNJTF9CVUZGRVJfQklUJyxcbiAgMTAyODogJ0ZST05UJyxcbiAgMTAyOTogJ0JBQ0snLFxuICAxMDMyOiAnRlJPTlRfQU5EX0JBQ0snLFxuICAxMjgwOiAnSU5WQUxJRF9FTlVNJyxcbiAgMTI4MTogJ0lOVkFMSURfVkFMVUUnLFxuICAxMjgyOiAnSU5WQUxJRF9PUEVSQVRJT04nLFxuICAxMjg1OiAnT1VUX09GX01FTU9SWScsXG4gIDEyODY6ICdJTlZBTElEX0ZSQU1FQlVGRkVSX09QRVJBVElPTicsXG4gIDIzMDQ6ICdDVycsXG4gIDIzMDU6ICdDQ1cnLFxuICAyODQ5OiAnTElORV9XSURUSCcsXG4gIDI4ODQ6ICdDVUxMX0ZBQ0UnLFxuICAyODg1OiAnQ1VMTF9GQUNFX01PREUnLFxuICAyODg2OiAnRlJPTlRfRkFDRScsXG4gIDI5Mjg6ICdERVBUSF9SQU5HRScsXG4gIDI5Mjk6ICdERVBUSF9URVNUJyxcbiAgMjkzMDogJ0RFUFRIX1dSSVRFTUFTSycsXG4gIDI5MzE6ICdERVBUSF9DTEVBUl9WQUxVRScsXG4gIDI5MzI6ICdERVBUSF9GVU5DJyxcbiAgMjk2MDogJ1NURU5DSUxfVEVTVCcsXG4gIDI5NjE6ICdTVEVOQ0lMX0NMRUFSX1ZBTFVFJyxcbiAgMjk2MjogJ1NURU5DSUxfRlVOQycsXG4gIDI5NjM6ICdTVEVOQ0lMX1ZBTFVFX01BU0snLFxuICAyOTY0OiAnU1RFTkNJTF9GQUlMJyxcbiAgMjk2NTogJ1NURU5DSUxfUEFTU19ERVBUSF9GQUlMJyxcbiAgMjk2NjogJ1NURU5DSUxfUEFTU19ERVBUSF9QQVNTJyxcbiAgMjk2NzogJ1NURU5DSUxfUkVGJyxcbiAgMjk2ODogJ1NURU5DSUxfV1JJVEVNQVNLJyxcbiAgMjk3ODogJ1ZJRVdQT1JUJyxcbiAgMzAyNDogJ0RJVEhFUicsXG4gIDMwNDI6ICdCTEVORCcsXG4gIDMwODg6ICdTQ0lTU09SX0JPWCcsXG4gIDMwODk6ICdTQ0lTU09SX1RFU1QnLFxuICAzMTA2OiAnQ09MT1JfQ0xFQVJfVkFMVUUnLFxuICAzMTA3OiAnQ09MT1JfV1JJVEVNQVNLJyxcbiAgMzMxNzogJ1VOUEFDS19BTElHTk1FTlQnLFxuICAzMzMzOiAnUEFDS19BTElHTk1FTlQnLFxuICAzMzc5OiAnTUFYX1RFWFRVUkVfU0laRScsXG4gIDMzODY6ICdNQVhfVklFV1BPUlRfRElNUycsXG4gIDM0MDg6ICdTVUJQSVhFTF9CSVRTJyxcbiAgMzQxMDogJ1JFRF9CSVRTJyxcbiAgMzQxMTogJ0dSRUVOX0JJVFMnLFxuICAzNDEyOiAnQkxVRV9CSVRTJyxcbiAgMzQxMzogJ0FMUEhBX0JJVFMnLFxuICAzNDE0OiAnREVQVEhfQklUUycsXG4gIDM0MTU6ICdTVEVOQ0lMX0JJVFMnLFxuICAzNTUzOiAnVEVYVFVSRV8yRCcsXG4gIDQzNTI6ICdET05UX0NBUkUnLFxuICA0MzUzOiAnRkFTVEVTVCcsXG4gIDQzNTQ6ICdOSUNFU1QnLFxuICA1MTIwOiAnQllURScsXG4gIDUxMjE6ICdVTlNJR05FRF9CWVRFJyxcbiAgNTEyMjogJ1NIT1JUJyxcbiAgNTEyMzogJ1VOU0lHTkVEX1NIT1JUJyxcbiAgNTEyNDogJ0lOVCcsXG4gIDUxMjU6ICdVTlNJR05FRF9JTlQnLFxuICA1MTI2OiAnRkxPQVQnLFxuICA1Mzg2OiAnSU5WRVJUJyxcbiAgNTg5MDogJ1RFWFRVUkUnLFxuICA2NDAxOiAnU1RFTkNJTF9JTkRFWCcsXG4gIDY0MDI6ICdERVBUSF9DT01QT05FTlQnLFxuICA2NDA2OiAnQUxQSEEnLFxuICA2NDA3OiAnUkdCJyxcbiAgNjQwODogJ1JHQkEnLFxuICA2NDA5OiAnTFVNSU5BTkNFJyxcbiAgNjQxMDogJ0xVTUlOQU5DRV9BTFBIQScsXG4gIDc2ODA6ICdLRUVQJyxcbiAgNzY4MTogJ1JFUExBQ0UnLFxuICA3NjgyOiAnSU5DUicsXG4gIDc2ODM6ICdERUNSJyxcbiAgNzkzNjogJ1ZFTkRPUicsXG4gIDc5Mzc6ICdSRU5ERVJFUicsXG4gIDc5Mzg6ICdWRVJTSU9OJyxcbiAgOTcyODogJ05FQVJFU1QnLFxuICA5NzI5OiAnTElORUFSJyxcbiAgOTk4NDogJ05FQVJFU1RfTUlQTUFQX05FQVJFU1QnLFxuICA5OTg1OiAnTElORUFSX01JUE1BUF9ORUFSRVNUJyxcbiAgOTk4NjogJ05FQVJFU1RfTUlQTUFQX0xJTkVBUicsXG4gIDk5ODc6ICdMSU5FQVJfTUlQTUFQX0xJTkVBUicsXG4gIDEwMjQwOiAnVEVYVFVSRV9NQUdfRklMVEVSJyxcbiAgMTAyNDE6ICdURVhUVVJFX01JTl9GSUxURVInLFxuICAxMDI0MjogJ1RFWFRVUkVfV1JBUF9TJyxcbiAgMTAyNDM6ICdURVhUVVJFX1dSQVBfVCcsXG4gIDEwNDk3OiAnUkVQRUFUJyxcbiAgMTA3NTI6ICdQT0xZR09OX09GRlNFVF9VTklUUycsXG4gIDE2Mzg0OiAnQ09MT1JfQlVGRkVSX0JJVCcsXG4gIDMyNzY5OiAnQ09OU1RBTlRfQ09MT1InLFxuICAzMjc3MDogJ09ORV9NSU5VU19DT05TVEFOVF9DT0xPUicsXG4gIDMyNzcxOiAnQ09OU1RBTlRfQUxQSEEnLFxuICAzMjc3MjogJ09ORV9NSU5VU19DT05TVEFOVF9BTFBIQScsXG4gIDMyNzczOiAnQkxFTkRfQ09MT1InLFxuICAzMjc3NDogJ0ZVTkNfQUREJyxcbiAgMzI3Nzc6ICdCTEVORF9FUVVBVElPTl9SR0InLFxuICAzMjc3ODogJ0ZVTkNfU1VCVFJBQ1QnLFxuICAzMjc3OTogJ0ZVTkNfUkVWRVJTRV9TVUJUUkFDVCcsXG4gIDMyODE5OiAnVU5TSUdORURfU0hPUlRfNF80XzRfNCcsXG4gIDMyODIwOiAnVU5TSUdORURfU0hPUlRfNV81XzVfMScsXG4gIDMyODIzOiAnUE9MWUdPTl9PRkZTRVRfRklMTCcsXG4gIDMyODI0OiAnUE9MWUdPTl9PRkZTRVRfRkFDVE9SJyxcbiAgMzI4NTQ6ICdSR0JBNCcsXG4gIDMyODU1OiAnUkdCNV9BMScsXG4gIDMyODczOiAnVEVYVFVSRV9CSU5ESU5HXzJEJyxcbiAgMzI5MjY6ICdTQU1QTEVfQUxQSEFfVE9fQ09WRVJBR0UnLFxuICAzMjkyODogJ1NBTVBMRV9DT1ZFUkFHRScsXG4gIDMyOTM2OiAnU0FNUExFX0JVRkZFUlMnLFxuICAzMjkzNzogJ1NBTVBMRVMnLFxuICAzMjkzODogJ1NBTVBMRV9DT1ZFUkFHRV9WQUxVRScsXG4gIDMyOTM5OiAnU0FNUExFX0NPVkVSQUdFX0lOVkVSVCcsXG4gIDMyOTY4OiAnQkxFTkRfRFNUX1JHQicsXG4gIDMyOTY5OiAnQkxFTkRfU1JDX1JHQicsXG4gIDMyOTcwOiAnQkxFTkRfRFNUX0FMUEhBJyxcbiAgMzI5NzE6ICdCTEVORF9TUkNfQUxQSEEnLFxuICAzMzA3MTogJ0NMQU1QX1RPX0VER0UnLFxuICAzMzE3MDogJ0dFTkVSQVRFX01JUE1BUF9ISU5UJyxcbiAgMzMxODk6ICdERVBUSF9DT01QT05FTlQxNicsXG4gIDMzMzA2OiAnREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5UJyxcbiAgMzM2MzU6ICdVTlNJR05FRF9TSE9SVF81XzZfNScsXG4gIDMzNjQ4OiAnTUlSUk9SRURfUkVQRUFUJyxcbiAgMzM5MDE6ICdBTElBU0VEX1BPSU5UX1NJWkVfUkFOR0UnLFxuICAzMzkwMjogJ0FMSUFTRURfTElORV9XSURUSF9SQU5HRScsXG4gIDMzOTg0OiAnVEVYVFVSRTAnLFxuICAzMzk4NTogJ1RFWFRVUkUxJyxcbiAgMzM5ODY6ICdURVhUVVJFMicsXG4gIDMzOTg3OiAnVEVYVFVSRTMnLFxuICAzMzk4ODogJ1RFWFRVUkU0JyxcbiAgMzM5ODk6ICdURVhUVVJFNScsXG4gIDMzOTkwOiAnVEVYVFVSRTYnLFxuICAzMzk5MTogJ1RFWFRVUkU3JyxcbiAgMzM5OTI6ICdURVhUVVJFOCcsXG4gIDMzOTkzOiAnVEVYVFVSRTknLFxuICAzMzk5NDogJ1RFWFRVUkUxMCcsXG4gIDMzOTk1OiAnVEVYVFVSRTExJyxcbiAgMzM5OTY6ICdURVhUVVJFMTInLFxuICAzMzk5NzogJ1RFWFRVUkUxMycsXG4gIDMzOTk4OiAnVEVYVFVSRTE0JyxcbiAgMzM5OTk6ICdURVhUVVJFMTUnLFxuICAzNDAwMDogJ1RFWFRVUkUxNicsXG4gIDM0MDAxOiAnVEVYVFVSRTE3JyxcbiAgMzQwMDI6ICdURVhUVVJFMTgnLFxuICAzNDAwMzogJ1RFWFRVUkUxOScsXG4gIDM0MDA0OiAnVEVYVFVSRTIwJyxcbiAgMzQwMDU6ICdURVhUVVJFMjEnLFxuICAzNDAwNjogJ1RFWFRVUkUyMicsXG4gIDM0MDA3OiAnVEVYVFVSRTIzJyxcbiAgMzQwMDg6ICdURVhUVVJFMjQnLFxuICAzNDAwOTogJ1RFWFRVUkUyNScsXG4gIDM0MDEwOiAnVEVYVFVSRTI2JyxcbiAgMzQwMTE6ICdURVhUVVJFMjcnLFxuICAzNDAxMjogJ1RFWFRVUkUyOCcsXG4gIDM0MDEzOiAnVEVYVFVSRTI5JyxcbiAgMzQwMTQ6ICdURVhUVVJFMzAnLFxuICAzNDAxNTogJ1RFWFRVUkUzMScsXG4gIDM0MDE2OiAnQUNUSVZFX1RFWFRVUkUnLFxuICAzNDAyNDogJ01BWF9SRU5ERVJCVUZGRVJfU0laRScsXG4gIDM0MDQxOiAnREVQVEhfU1RFTkNJTCcsXG4gIDM0MDU1OiAnSU5DUl9XUkFQJyxcbiAgMzQwNTY6ICdERUNSX1dSQVAnLFxuICAzNDA2NzogJ1RFWFRVUkVfQ1VCRV9NQVAnLFxuICAzNDA2ODogJ1RFWFRVUkVfQklORElOR19DVUJFX01BUCcsXG4gIDM0MDY5OiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YJyxcbiAgMzQwNzA6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gnLFxuICAzNDA3MTogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWScsXG4gIDM0MDcyOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZJyxcbiAgMzQwNzM6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1onLFxuICAzNDA3NDogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWicsXG4gIDM0MDc2OiAnTUFYX0NVQkVfTUFQX1RFWFRVUkVfU0laRScsXG4gIDM0MzM4OiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9FTkFCTEVEJyxcbiAgMzQzMzk6ICdWRVJURVhfQVRUUklCX0FSUkFZX1NJWkUnLFxuICAzNDM0MDogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfU1RSSURFJyxcbiAgMzQzNDE6ICdWRVJURVhfQVRUUklCX0FSUkFZX1RZUEUnLFxuICAzNDM0MjogJ0NVUlJFTlRfVkVSVEVYX0FUVFJJQicsXG4gIDM0MzczOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9QT0lOVEVSJyxcbiAgMzQ0NjY6ICdOVU1fQ09NUFJFU1NFRF9URVhUVVJFX0ZPUk1BVFMnLFxuICAzNDQ2NzogJ0NPTVBSRVNTRURfVEVYVFVSRV9GT1JNQVRTJyxcbiAgMzQ2NjA6ICdCVUZGRVJfU0laRScsXG4gIDM0NjYxOiAnQlVGRkVSX1VTQUdFJyxcbiAgMzQ4MTY6ICdTVEVOQ0lMX0JBQ0tfRlVOQycsXG4gIDM0ODE3OiAnU1RFTkNJTF9CQUNLX0ZBSUwnLFxuICAzNDgxODogJ1NURU5DSUxfQkFDS19QQVNTX0RFUFRIX0ZBSUwnLFxuICAzNDgxOTogJ1NURU5DSUxfQkFDS19QQVNTX0RFUFRIX1BBU1MnLFxuICAzNDg3NzogJ0JMRU5EX0VRVUFUSU9OX0FMUEhBJyxcbiAgMzQ5MjE6ICdNQVhfVkVSVEVYX0FUVFJJQlMnLFxuICAzNDkyMjogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfTk9STUFMSVpFRCcsXG4gIDM0OTMwOiAnTUFYX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNDk2MjogJ0FSUkFZX0JVRkZFUicsXG4gIDM0OTYzOiAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLFxuICAzNDk2NDogJ0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzQ5NjU6ICdFTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzQ5NzU6ICdWRVJURVhfQVRUUklCX0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzUwNDA6ICdTVFJFQU1fRFJBVycsXG4gIDM1MDQ0OiAnU1RBVElDX0RSQVcnLFxuICAzNTA0ODogJ0RZTkFNSUNfRFJBVycsXG4gIDM1NjMyOiAnRlJBR01FTlRfU0hBREVSJyxcbiAgMzU2MzM6ICdWRVJURVhfU0hBREVSJyxcbiAgMzU2NjA6ICdNQVhfVkVSVEVYX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNTY2MTogJ01BWF9DT01CSU5FRF9URVhUVVJFX0lNQUdFX1VOSVRTJyxcbiAgMzU2NjM6ICdTSEFERVJfVFlQRScsXG4gIDM1NjY0OiAnRkxPQVRfVkVDMicsXG4gIDM1NjY1OiAnRkxPQVRfVkVDMycsXG4gIDM1NjY2OiAnRkxPQVRfVkVDNCcsXG4gIDM1NjY3OiAnSU5UX1ZFQzInLFxuICAzNTY2ODogJ0lOVF9WRUMzJyxcbiAgMzU2Njk6ICdJTlRfVkVDNCcsXG4gIDM1NjcwOiAnQk9PTCcsXG4gIDM1NjcxOiAnQk9PTF9WRUMyJyxcbiAgMzU2NzI6ICdCT09MX1ZFQzMnLFxuICAzNTY3MzogJ0JPT0xfVkVDNCcsXG4gIDM1Njc0OiAnRkxPQVRfTUFUMicsXG4gIDM1Njc1OiAnRkxPQVRfTUFUMycsXG4gIDM1Njc2OiAnRkxPQVRfTUFUNCcsXG4gIDM1Njc4OiAnU0FNUExFUl8yRCcsXG4gIDM1NjgwOiAnU0FNUExFUl9DVUJFJyxcbiAgMzU3MTI6ICdERUxFVEVfU1RBVFVTJyxcbiAgMzU3MTM6ICdDT01QSUxFX1NUQVRVUycsXG4gIDM1NzE0OiAnTElOS19TVEFUVVMnLFxuICAzNTcxNTogJ1ZBTElEQVRFX1NUQVRVUycsXG4gIDM1NzE2OiAnSU5GT19MT0dfTEVOR1RIJyxcbiAgMzU3MTc6ICdBVFRBQ0hFRF9TSEFERVJTJyxcbiAgMzU3MTg6ICdBQ1RJVkVfVU5JRk9STVMnLFxuICAzNTcxOTogJ0FDVElWRV9VTklGT1JNX01BWF9MRU5HVEgnLFxuICAzNTcyMDogJ1NIQURFUl9TT1VSQ0VfTEVOR1RIJyxcbiAgMzU3MjE6ICdBQ1RJVkVfQVRUUklCVVRFUycsXG4gIDM1NzIyOiAnQUNUSVZFX0FUVFJJQlVURV9NQVhfTEVOR1RIJyxcbiAgMzU3MjQ6ICdTSEFESU5HX0xBTkdVQUdFX1ZFUlNJT04nLFxuICAzNTcyNTogJ0NVUlJFTlRfUFJPR1JBTScsXG4gIDM2MDAzOiAnU1RFTkNJTF9CQUNLX1JFRicsXG4gIDM2MDA0OiAnU1RFTkNJTF9CQUNLX1ZBTFVFX01BU0snLFxuICAzNjAwNTogJ1NURU5DSUxfQkFDS19XUklURU1BU0snLFxuICAzNjAwNjogJ0ZSQU1FQlVGRkVSX0JJTkRJTkcnLFxuICAzNjAwNzogJ1JFTkRFUkJVRkZFUl9CSU5ESU5HJyxcbiAgMzYwNDg6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9UWVBFJyxcbiAgMzYwNDk6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9OQU1FJyxcbiAgMzYwNTA6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEVWRUwnLFxuICAzNjA1MTogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9DVUJFX01BUF9GQUNFJyxcbiAgMzYwNTM6ICdGUkFNRUJVRkZFUl9DT01QTEVURScsXG4gIDM2MDU0OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9BVFRBQ0hNRU5UJyxcbiAgMzYwNTU6ICdGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01JU1NJTkdfQVRUQUNITUVOVCcsXG4gIDM2MDU3OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9ESU1FTlNJT05TJyxcbiAgMzYwNjE6ICdGUkFNRUJVRkZFUl9VTlNVUFBPUlRFRCcsXG4gIDM2MDY0OiAnQ09MT1JfQVRUQUNITUVOVDAnLFxuICAzNjA5NjogJ0RFUFRIX0FUVEFDSE1FTlQnLFxuICAzNjEyODogJ1NURU5DSUxfQVRUQUNITUVOVCcsXG4gIDM2MTYwOiAnRlJBTUVCVUZGRVInLFxuICAzNjE2MTogJ1JFTkRFUkJVRkZFUicsXG4gIDM2MTYyOiAnUkVOREVSQlVGRkVSX1dJRFRIJyxcbiAgMzYxNjM6ICdSRU5ERVJCVUZGRVJfSEVJR0hUJyxcbiAgMzYxNjQ6ICdSRU5ERVJCVUZGRVJfSU5URVJOQUxfRk9STUFUJyxcbiAgMzYxNjg6ICdTVEVOQ0lMX0lOREVYOCcsXG4gIDM2MTc2OiAnUkVOREVSQlVGRkVSX1JFRF9TSVpFJyxcbiAgMzYxNzc6ICdSRU5ERVJCVUZGRVJfR1JFRU5fU0laRScsXG4gIDM2MTc4OiAnUkVOREVSQlVGRkVSX0JMVUVfU0laRScsXG4gIDM2MTc5OiAnUkVOREVSQlVGRkVSX0FMUEhBX1NJWkUnLFxuICAzNjE4MDogJ1JFTkRFUkJVRkZFUl9ERVBUSF9TSVpFJyxcbiAgMzYxODE6ICdSRU5ERVJCVUZGRVJfU1RFTkNJTF9TSVpFJyxcbiAgMzYxOTQ6ICdSR0I1NjUnLFxuICAzNjMzNjogJ0xPV19GTE9BVCcsXG4gIDM2MzM3OiAnTUVESVVNX0ZMT0FUJyxcbiAgMzYzMzg6ICdISUdIX0ZMT0FUJyxcbiAgMzYzMzk6ICdMT1dfSU5UJyxcbiAgMzYzNDA6ICdNRURJVU1fSU5UJyxcbiAgMzYzNDE6ICdISUdIX0lOVCcsXG4gIDM2MzQ2OiAnU0hBREVSX0NPTVBJTEVSJyxcbiAgMzYzNDc6ICdNQVhfVkVSVEVYX1VOSUZPUk1fVkVDVE9SUycsXG4gIDM2MzQ4OiAnTUFYX1ZBUllJTkdfVkVDVE9SUycsXG4gIDM2MzQ5OiAnTUFYX0ZSQUdNRU5UX1VOSUZPUk1fVkVDVE9SUycsXG4gIDM3NDQwOiAnVU5QQUNLX0ZMSVBfWV9XRUJHTCcsXG4gIDM3NDQxOiAnVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMJyxcbiAgMzc0NDI6ICdDT05URVhUX0xPU1RfV0VCR0wnLFxuICAzNzQ0MzogJ1VOUEFDS19DT0xPUlNQQUNFX0NPTlZFUlNJT05fV0VCR0wnLFxuICAzNzQ0NDogJ0JST1dTRVJfREVGQVVMVF9XRUJHTCdcbn1cbiIsInZhciBnbDEwID0gcmVxdWlyZSgnLi8xLjAvbnVtYmVycycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbG9va3VwQ29uc3RhbnQgKG51bWJlcikge1xuICByZXR1cm4gZ2wxMFtudW1iZXJdXG59XG4iLCJ2YXIgdG9rZW5pemUgPSByZXF1aXJlKCdnbHNsLXRva2VuaXplcicpXG52YXIgYXRvYiAgICAgPSByZXF1aXJlKCdhdG9iLWxpdGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldE5hbWVcblxuZnVuY3Rpb24gZ2V0TmFtZShzcmMpIHtcbiAgdmFyIHRva2VucyA9IEFycmF5LmlzQXJyYXkoc3JjKVxuICAgID8gc3JjXG4gICAgOiB0b2tlbml6ZShzcmMpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBpZiAodG9rZW4udHlwZSAhPT0gJ3ByZXByb2Nlc3NvcicpIGNvbnRpbnVlXG4gICAgdmFyIG1hdGNoID0gdG9rZW4uZGF0YS5tYXRjaCgvXFwjZGVmaW5lXFxzK1NIQURFUl9OQU1FKF9CNjQpP1xccysoLispJC8pXG4gICAgaWYgKCFtYXRjaCkgY29udGludWVcbiAgICBpZiAoIW1hdGNoWzJdKSBjb250aW51ZVxuXG4gICAgdmFyIGI2NCAgPSBtYXRjaFsxXVxuICAgIHZhciBuYW1lID0gbWF0Y2hbMl1cblxuICAgIHJldHVybiAoYjY0ID8gYXRvYihuYW1lKSA6IG5hbWUpLnRyaW0oKVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9hdG9iKHN0cikge1xuICByZXR1cm4gYXRvYihzdHIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRva2VuaXplXG5cbnZhciBsaXRlcmFsczEwMCA9IHJlcXVpcmUoJy4vbGliL2xpdGVyYWxzJylcbiAgLCBvcGVyYXRvcnMgPSByZXF1aXJlKCcuL2xpYi9vcGVyYXRvcnMnKVxuICAsIGJ1aWx0aW5zMTAwID0gcmVxdWlyZSgnLi9saWIvYnVpbHRpbnMnKVxuICAsIGxpdGVyYWxzMzAwZXMgPSByZXF1aXJlKCcuL2xpYi9saXRlcmFscy0zMDBlcycpXG4gICwgYnVpbHRpbnMzMDBlcyA9IHJlcXVpcmUoJy4vbGliL2J1aWx0aW5zLTMwMGVzJylcblxudmFyIE5PUk1BTCA9IDk5OSAgICAgICAgICAvLyA8LS0gbmV2ZXIgZW1pdHRlZFxuICAsIFRPS0VOID0gOTk5OSAgICAgICAgICAvLyA8LS0gbmV2ZXIgZW1pdHRlZFxuICAsIEJMT0NLX0NPTU1FTlQgPSAwXG4gICwgTElORV9DT01NRU5UID0gMVxuICAsIFBSRVBST0NFU1NPUiA9IDJcbiAgLCBPUEVSQVRPUiA9IDNcbiAgLCBJTlRFR0VSID0gNFxuICAsIEZMT0FUID0gNVxuICAsIElERU5UID0gNlxuICAsIEJVSUxUSU4gPSA3XG4gICwgS0VZV09SRCA9IDhcbiAgLCBXSElURVNQQUNFID0gOVxuICAsIEVPRiA9IDEwXG4gICwgSEVYID0gMTFcblxudmFyIG1hcCA9IFtcbiAgICAnYmxvY2stY29tbWVudCdcbiAgLCAnbGluZS1jb21tZW50J1xuICAsICdwcmVwcm9jZXNzb3InXG4gICwgJ29wZXJhdG9yJ1xuICAsICdpbnRlZ2VyJ1xuICAsICdmbG9hdCdcbiAgLCAnaWRlbnQnXG4gICwgJ2J1aWx0aW4nXG4gICwgJ2tleXdvcmQnXG4gICwgJ3doaXRlc3BhY2UnXG4gICwgJ2VvZidcbiAgLCAnaW50ZWdlcidcbl1cblxuZnVuY3Rpb24gdG9rZW5pemUob3B0KSB7XG4gIHZhciBpID0gMFxuICAgICwgdG90YWwgPSAwXG4gICAgLCBtb2RlID0gTk9STUFMXG4gICAgLCBjXG4gICAgLCBsYXN0XG4gICAgLCBjb250ZW50ID0gW11cbiAgICAsIHRva2VucyA9IFtdXG4gICAgLCB0b2tlbl9pZHggPSAwXG4gICAgLCB0b2tlbl9vZmZzID0gMFxuICAgICwgbGluZSA9IDFcbiAgICAsIGNvbCA9IDBcbiAgICAsIHN0YXJ0ID0gMFxuICAgICwgaXNudW0gPSBmYWxzZVxuICAgICwgaXNvcGVyYXRvciA9IGZhbHNlXG4gICAgLCBpbnB1dCA9ICcnXG4gICAgLCBsZW5cblxuICBvcHQgPSBvcHQgfHwge31cbiAgdmFyIGFsbEJ1aWx0aW5zID0gYnVpbHRpbnMxMDBcbiAgdmFyIGFsbExpdGVyYWxzID0gbGl0ZXJhbHMxMDBcbiAgaWYgKG9wdC52ZXJzaW9uID09PSAnMzAwIGVzJykge1xuICAgIGFsbEJ1aWx0aW5zID0gYnVpbHRpbnMzMDBlc1xuICAgIGFsbExpdGVyYWxzID0gbGl0ZXJhbHMzMDBlc1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB0b2tlbnMgPSBbXVxuICAgIGlmIChkYXRhICE9PSBudWxsKSByZXR1cm4gd3JpdGUoZGF0YSlcbiAgICByZXR1cm4gZW5kKClcbiAgfVxuXG4gIGZ1bmN0aW9uIHRva2VuKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5sZW5ndGgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogbWFwW21vZGVdXG4gICAgICAsIGRhdGE6IGRhdGFcbiAgICAgICwgcG9zaXRpb246IHN0YXJ0XG4gICAgICAsIGxpbmU6IGxpbmVcbiAgICAgICwgY29sdW1uOiBjb2xcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUoY2h1bmspIHtcbiAgICBpID0gMFxuICAgIGlucHV0ICs9IGNodW5rXG4gICAgbGVuID0gaW5wdXQubGVuZ3RoXG5cbiAgICB2YXIgbGFzdFxuXG4gICAgd2hpbGUoYyA9IGlucHV0W2ldLCBpIDwgbGVuKSB7XG4gICAgICBsYXN0ID0gaVxuXG4gICAgICBzd2l0Y2gobW9kZSkge1xuICAgICAgICBjYXNlIEJMT0NLX0NPTU1FTlQ6IGkgPSBibG9ja19jb21tZW50KCk7IGJyZWFrXG4gICAgICAgIGNhc2UgTElORV9DT01NRU5UOiBpID0gbGluZV9jb21tZW50KCk7IGJyZWFrXG4gICAgICAgIGNhc2UgUFJFUFJPQ0VTU09SOiBpID0gcHJlcHJvY2Vzc29yKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgT1BFUkFUT1I6IGkgPSBvcGVyYXRvcigpOyBicmVha1xuICAgICAgICBjYXNlIElOVEVHRVI6IGkgPSBpbnRlZ2VyKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgSEVYOiBpID0gaGV4KCk7IGJyZWFrXG4gICAgICAgIGNhc2UgRkxPQVQ6IGkgPSBkZWNpbWFsKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgVE9LRU46IGkgPSByZWFkdG9rZW4oKTsgYnJlYWtcbiAgICAgICAgY2FzZSBXSElURVNQQUNFOiBpID0gd2hpdGVzcGFjZSgpOyBicmVha1xuICAgICAgICBjYXNlIE5PUk1BTDogaSA9IG5vcm1hbCgpOyBicmVha1xuICAgICAgfVxuXG4gICAgICBpZihsYXN0ICE9PSBpKSB7XG4gICAgICAgIHN3aXRjaChpbnB1dFtsYXN0XSkge1xuICAgICAgICAgIGNhc2UgJ1xcbic6IGNvbCA9IDA7ICsrbGluZTsgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OiArK2NvbDsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRvdGFsICs9IGlcbiAgICBpbnB1dCA9IGlucHV0LnNsaWNlKGkpXG4gICAgcmV0dXJuIHRva2Vuc1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kKGNodW5rKSB7XG4gICAgaWYoY29udGVudC5sZW5ndGgpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgfVxuXG4gICAgbW9kZSA9IEVPRlxuICAgIHRva2VuKCcoZW9mKScpXG4gICAgcmV0dXJuIHRva2Vuc1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsKCkge1xuICAgIGNvbnRlbnQgPSBjb250ZW50Lmxlbmd0aCA/IFtdIDogY29udGVudFxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcqJykge1xuICAgICAgc3RhcnQgPSB0b3RhbCArIGkgLSAxXG4gICAgICBtb2RlID0gQkxPQ0tfQ09NTUVOVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnLycpIHtcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpIC0gMVxuICAgICAgbW9kZSA9IExJTkVfQ09NTUVOVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKGMgPT09ICcjJykge1xuICAgICAgbW9kZSA9IFBSRVBST0NFU1NPUlxuICAgICAgc3RhcnQgPSB0b3RhbCArIGlcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoL1xccy8udGVzdChjKSkge1xuICAgICAgbW9kZSA9IFdISVRFU1BBQ0VcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlzbnVtID0gL1xcZC8udGVzdChjKVxuICAgIGlzb3BlcmF0b3IgPSAvW15cXHdfXS8udGVzdChjKVxuXG4gICAgc3RhcnQgPSB0b3RhbCArIGlcbiAgICBtb2RlID0gaXNudW0gPyBJTlRFR0VSIDogaXNvcGVyYXRvciA/IE9QRVJBVE9SIDogVE9LRU5cbiAgICByZXR1cm4gaVxuICB9XG5cbiAgZnVuY3Rpb24gd2hpdGVzcGFjZSgpIHtcbiAgICBpZigvW15cXHNdL2cudGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBwcmVwcm9jZXNzb3IoKSB7XG4gICAgaWYoYyA9PT0gJ1xcbicgJiYgbGFzdCAhPT0gJ1xcXFwnKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmVfY29tbWVudCgpIHtcbiAgICByZXR1cm4gcHJlcHJvY2Vzc29yKClcbiAgfVxuXG4gIGZ1bmN0aW9uIGJsb2NrX2NvbW1lbnQoKSB7XG4gICAgaWYoYyA9PT0gJy8nICYmIGxhc3QgPT09ICcqJykge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZXJhdG9yKCkge1xuICAgIGlmKGxhc3QgPT09ICcuJyAmJiAvXFxkLy50ZXN0KGMpKSB7XG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcqJykge1xuICAgICAgbW9kZSA9IEJMT0NLX0NPTU1FTlRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcvJykge1xuICAgICAgbW9kZSA9IExJTkVfQ09NTUVOVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihjID09PSAnLicgJiYgY29udGVudC5sZW5ndGgpIHtcbiAgICAgIHdoaWxlKGRldGVybWluZV9vcGVyYXRvcihjb250ZW50KSk7XG5cbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihjID09PSAnOycgfHwgYyA9PT0gJyknIHx8IGMgPT09ICcoJykge1xuICAgICAgaWYoY29udGVudC5sZW5ndGgpIHdoaWxlKGRldGVybWluZV9vcGVyYXRvcihjb250ZW50KSk7XG4gICAgICB0b2tlbihjKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgdmFyIGlzX2NvbXBvc2l0ZV9vcGVyYXRvciA9IGNvbnRlbnQubGVuZ3RoID09PSAyICYmIGMgIT09ICc9J1xuICAgIGlmKC9bXFx3X1xcZFxcc10vLnRlc3QoYykgfHwgaXNfY29tcG9zaXRlX29wZXJhdG9yKSB7XG4gICAgICB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gZGV0ZXJtaW5lX29wZXJhdG9yKGJ1Zikge1xuICAgIHZhciBqID0gMFxuICAgICAgLCBpZHhcbiAgICAgICwgcmVzXG5cbiAgICBkbyB7XG4gICAgICBpZHggPSBvcGVyYXRvcnMuaW5kZXhPZihidWYuc2xpY2UoMCwgYnVmLmxlbmd0aCArIGopLmpvaW4oJycpKVxuICAgICAgcmVzID0gb3BlcmF0b3JzW2lkeF1cblxuICAgICAgaWYoaWR4ID09PSAtMSkge1xuICAgICAgICBpZihqLS0gKyBidWYubGVuZ3RoID4gMCkgY29udGludWVcbiAgICAgICAgcmVzID0gYnVmLnNsaWNlKDAsIDEpLmpvaW4oJycpXG4gICAgICB9XG5cbiAgICAgIHRva2VuKHJlcylcblxuICAgICAgc3RhcnQgKz0gcmVzLmxlbmd0aFxuICAgICAgY29udGVudCA9IGNvbnRlbnQuc2xpY2UocmVzLmxlbmd0aClcbiAgICAgIHJldHVybiBjb250ZW50Lmxlbmd0aFxuICAgIH0gd2hpbGUoMSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGhleCgpIHtcbiAgICBpZigvW15hLWZBLUYwLTldLy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gaW50ZWdlcigpIHtcbiAgICBpZihjID09PSAnLicpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoL1tlRV0vLnRlc3QoYykpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJ3gnICYmIGNvbnRlbnQubGVuZ3RoID09PSAxICYmIGNvbnRlbnRbMF0gPT09ICcwJykge1xuICAgICAgbW9kZSA9IEhFWFxuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoL1teXFxkXS8udGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY2ltYWwoKSB7XG4gICAgaWYoYyA9PT0gJ2YnKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIGxhc3QgPSBjXG4gICAgICBpICs9IDFcbiAgICB9XG5cbiAgICBpZigvW2VFXS8udGVzdChjKSkge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYgKGMgPT09ICctJyAmJiAvW2VFXS8udGVzdChsYXN0KSkge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoL1teXFxkXS8udGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWR0b2tlbigpIHtcbiAgICBpZigvW15cXGRcXHdfXS8udGVzdChjKSkge1xuICAgICAgdmFyIGNvbnRlbnRzdHIgPSBjb250ZW50LmpvaW4oJycpXG4gICAgICBpZihhbGxMaXRlcmFscy5pbmRleE9mKGNvbnRlbnRzdHIpID4gLTEpIHtcbiAgICAgICAgbW9kZSA9IEtFWVdPUkRcbiAgICAgIH0gZWxzZSBpZihhbGxCdWlsdGlucy5pbmRleE9mKGNvbnRlbnRzdHIpID4gLTEpIHtcbiAgICAgICAgbW9kZSA9IEJVSUxUSU5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZGUgPSBJREVOVFxuICAgICAgfVxuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cbn1cbiIsIi8vIDMwMGVzIGJ1aWx0aW5zL3Jlc2VydmVkIHdvcmRzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHZhbGlkIGluIHYxMDBcbnZhciB2MTAwID0gcmVxdWlyZSgnLi9idWlsdGlucycpXG5cbi8vIFRoZSB0ZXh0dXJlMkR8Q3ViZSBmdW5jdGlvbnMgaGF2ZSBiZWVuIHJlbW92ZWRcbi8vIEFuZCB0aGUgZ2xfIGZlYXR1cmVzIGFyZSB1cGRhdGVkXG52MTAwID0gdjEwMC5zbGljZSgpLmZpbHRlcihmdW5jdGlvbiAoYikge1xuICByZXR1cm4gIS9eKGdsXFxffHRleHR1cmUpLy50ZXN0KGIpXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHYxMDAuY29uY2F0KFtcbiAgLy8gdGhlIHVwZGF0ZWQgZ2xfIGNvbnN0YW50c1xuICAgICdnbF9WZXJ0ZXhJRCdcbiAgLCAnZ2xfSW5zdGFuY2VJRCdcbiAgLCAnZ2xfUG9zaXRpb24nXG4gICwgJ2dsX1BvaW50U2l6ZSdcbiAgLCAnZ2xfRnJhZ0Nvb3JkJ1xuICAsICdnbF9Gcm9udEZhY2luZydcbiAgLCAnZ2xfRnJhZ0RlcHRoJ1xuICAsICdnbF9Qb2ludENvb3JkJ1xuICAsICdnbF9NYXhWZXJ0ZXhBdHRyaWJzJ1xuICAsICdnbF9NYXhWZXJ0ZXhVbmlmb3JtVmVjdG9ycydcbiAgLCAnZ2xfTWF4VmVydGV4T3V0cHV0VmVjdG9ycydcbiAgLCAnZ2xfTWF4RnJhZ21lbnRJbnB1dFZlY3RvcnMnXG4gICwgJ2dsX01heFZlcnRleFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhDb21iaW5lZFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4RnJhZ21lbnRVbmlmb3JtVmVjdG9ycydcbiAgLCAnZ2xfTWF4RHJhd0J1ZmZlcnMnXG4gICwgJ2dsX01pblByb2dyYW1UZXhlbE9mZnNldCdcbiAgLCAnZ2xfTWF4UHJvZ3JhbVRleGVsT2Zmc2V0J1xuICAsICdnbF9EZXB0aFJhbmdlUGFyYW1ldGVycydcbiAgLCAnZ2xfRGVwdGhSYW5nZSdcblxuICAvLyBvdGhlciBidWlsdGluc1xuICAsICd0cnVuYydcbiAgLCAncm91bmQnXG4gICwgJ3JvdW5kRXZlbidcbiAgLCAnaXNuYW4nXG4gICwgJ2lzaW5mJ1xuICAsICdmbG9hdEJpdHNUb0ludCdcbiAgLCAnZmxvYXRCaXRzVG9VaW50J1xuICAsICdpbnRCaXRzVG9GbG9hdCdcbiAgLCAndWludEJpdHNUb0Zsb2F0J1xuICAsICdwYWNrU25vcm0yeDE2J1xuICAsICd1bnBhY2tTbm9ybTJ4MTYnXG4gICwgJ3BhY2tVbm9ybTJ4MTYnXG4gICwgJ3VucGFja1Vub3JtMngxNidcbiAgLCAncGFja0hhbGYyeDE2J1xuICAsICd1bnBhY2tIYWxmMngxNidcbiAgLCAnb3V0ZXJQcm9kdWN0J1xuICAsICd0cmFuc3Bvc2UnXG4gICwgJ2RldGVybWluYW50J1xuICAsICdpbnZlcnNlJ1xuICAsICd0ZXh0dXJlJ1xuICAsICd0ZXh0dXJlU2l6ZSdcbiAgLCAndGV4dHVyZVByb2onXG4gICwgJ3RleHR1cmVMb2QnXG4gICwgJ3RleHR1cmVPZmZzZXQnXG4gICwgJ3RleGVsRmV0Y2gnXG4gICwgJ3RleGVsRmV0Y2hPZmZzZXQnXG4gICwgJ3RleHR1cmVQcm9qT2Zmc2V0J1xuICAsICd0ZXh0dXJlTG9kT2Zmc2V0J1xuICAsICd0ZXh0dXJlUHJvakxvZCdcbiAgLCAndGV4dHVyZVByb2pMb2RPZmZzZXQnXG4gICwgJ3RleHR1cmVHcmFkJ1xuICAsICd0ZXh0dXJlR3JhZE9mZnNldCdcbiAgLCAndGV4dHVyZVByb2pHcmFkJ1xuICAsICd0ZXh0dXJlUHJvakdyYWRPZmZzZXQnXG5dKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIC8vIEtlZXAgdGhpcyBsaXN0IHNvcnRlZFxuICAnYWJzJ1xuICAsICdhY29zJ1xuICAsICdhbGwnXG4gICwgJ2FueSdcbiAgLCAnYXNpbidcbiAgLCAnYXRhbidcbiAgLCAnY2VpbCdcbiAgLCAnY2xhbXAnXG4gICwgJ2NvcydcbiAgLCAnY3Jvc3MnXG4gICwgJ2RGZHgnXG4gICwgJ2RGZHknXG4gICwgJ2RlZ3JlZXMnXG4gICwgJ2Rpc3RhbmNlJ1xuICAsICdkb3QnXG4gICwgJ2VxdWFsJ1xuICAsICdleHAnXG4gICwgJ2V4cDInXG4gICwgJ2ZhY2Vmb3J3YXJkJ1xuICAsICdmbG9vcidcbiAgLCAnZnJhY3QnXG4gICwgJ2dsX0JhY2tDb2xvcidcbiAgLCAnZ2xfQmFja0xpZ2h0TW9kZWxQcm9kdWN0J1xuICAsICdnbF9CYWNrTGlnaHRQcm9kdWN0J1xuICAsICdnbF9CYWNrTWF0ZXJpYWwnXG4gICwgJ2dsX0JhY2tTZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfQ2xpcFBsYW5lJ1xuICAsICdnbF9DbGlwVmVydGV4J1xuICAsICdnbF9Db2xvcidcbiAgLCAnZ2xfRGVwdGhSYW5nZSdcbiAgLCAnZ2xfRGVwdGhSYW5nZVBhcmFtZXRlcnMnXG4gICwgJ2dsX0V5ZVBsYW5lUSdcbiAgLCAnZ2xfRXllUGxhbmVSJ1xuICAsICdnbF9FeWVQbGFuZVMnXG4gICwgJ2dsX0V5ZVBsYW5lVCdcbiAgLCAnZ2xfRm9nJ1xuICAsICdnbF9Gb2dDb29yZCdcbiAgLCAnZ2xfRm9nRnJhZ0Nvb3JkJ1xuICAsICdnbF9Gb2dQYXJhbWV0ZXJzJ1xuICAsICdnbF9GcmFnQ29sb3InXG4gICwgJ2dsX0ZyYWdDb29yZCdcbiAgLCAnZ2xfRnJhZ0RhdGEnXG4gICwgJ2dsX0ZyYWdEZXB0aCdcbiAgLCAnZ2xfRnJhZ0RlcHRoRVhUJ1xuICAsICdnbF9Gcm9udENvbG9yJ1xuICAsICdnbF9Gcm9udEZhY2luZydcbiAgLCAnZ2xfRnJvbnRMaWdodE1vZGVsUHJvZHVjdCdcbiAgLCAnZ2xfRnJvbnRMaWdodFByb2R1Y3QnXG4gICwgJ2dsX0Zyb250TWF0ZXJpYWwnXG4gICwgJ2dsX0Zyb250U2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX0xpZ2h0TW9kZWwnXG4gICwgJ2dsX0xpZ2h0TW9kZWxQYXJhbWV0ZXJzJ1xuICAsICdnbF9MaWdodE1vZGVsUHJvZHVjdHMnXG4gICwgJ2dsX0xpZ2h0UHJvZHVjdHMnXG4gICwgJ2dsX0xpZ2h0U291cmNlJ1xuICAsICdnbF9MaWdodFNvdXJjZVBhcmFtZXRlcnMnXG4gICwgJ2dsX01hdGVyaWFsUGFyYW1ldGVycydcbiAgLCAnZ2xfTWF4Q2xpcFBsYW5lcydcbiAgLCAnZ2xfTWF4Q29tYmluZWRUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4RHJhd0J1ZmZlcnMnXG4gICwgJ2dsX01heEZyYWdtZW50VW5pZm9ybUNvbXBvbmVudHMnXG4gICwgJ2dsX01heExpZ2h0cydcbiAgLCAnZ2xfTWF4VGV4dHVyZUNvb3JkcydcbiAgLCAnZ2xfTWF4VGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heFRleHR1cmVVbml0cydcbiAgLCAnZ2xfTWF4VmFyeWluZ0Zsb2F0cydcbiAgLCAnZ2xfTWF4VmVydGV4QXR0cmlicydcbiAgLCAnZ2xfTWF4VmVydGV4VGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heFZlcnRleFVuaWZvcm1Db21wb25lbnRzJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXgnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeEludmVyc2UnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeEludmVyc2UnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMCdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDEnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQyJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMydcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDQnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ1J1xuICAsICdnbF9NdWx0aVRleENvb3JkNidcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDcnXG4gICwgJ2dsX05vcm1hbCdcbiAgLCAnZ2xfTm9ybWFsTWF0cml4J1xuICAsICdnbF9Ob3JtYWxTY2FsZSdcbiAgLCAnZ2xfT2JqZWN0UGxhbmVRJ1xuICAsICdnbF9PYmplY3RQbGFuZVInXG4gICwgJ2dsX09iamVjdFBsYW5lUydcbiAgLCAnZ2xfT2JqZWN0UGxhbmVUJ1xuICAsICdnbF9Qb2ludCdcbiAgLCAnZ2xfUG9pbnRDb29yZCdcbiAgLCAnZ2xfUG9pbnRQYXJhbWV0ZXJzJ1xuICAsICdnbF9Qb2ludFNpemUnXG4gICwgJ2dsX1Bvc2l0aW9uJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4J1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX1NlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9UZXhDb29yZCdcbiAgLCAnZ2xfVGV4dHVyZUVudkNvbG9yJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4J1xuICAsICdnbF9UZXh0dXJlTWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX1ZlcnRleCdcbiAgLCAnZ3JlYXRlclRoYW4nXG4gICwgJ2dyZWF0ZXJUaGFuRXF1YWwnXG4gICwgJ2ludmVyc2VzcXJ0J1xuICAsICdsZW5ndGgnXG4gICwgJ2xlc3NUaGFuJ1xuICAsICdsZXNzVGhhbkVxdWFsJ1xuICAsICdsb2cnXG4gICwgJ2xvZzInXG4gICwgJ21hdHJpeENvbXBNdWx0J1xuICAsICdtYXgnXG4gICwgJ21pbidcbiAgLCAnbWl4J1xuICAsICdtb2QnXG4gICwgJ25vcm1hbGl6ZSdcbiAgLCAnbm90J1xuICAsICdub3RFcXVhbCdcbiAgLCAncG93J1xuICAsICdyYWRpYW5zJ1xuICAsICdyZWZsZWN0J1xuICAsICdyZWZyYWN0J1xuICAsICdzaWduJ1xuICAsICdzaW4nXG4gICwgJ3Ntb290aHN0ZXAnXG4gICwgJ3NxcnQnXG4gICwgJ3N0ZXAnXG4gICwgJ3RhbidcbiAgLCAndGV4dHVyZTJEJ1xuICAsICd0ZXh0dXJlMkRMb2QnXG4gICwgJ3RleHR1cmUyRFByb2onXG4gICwgJ3RleHR1cmUyRFByb2pMb2QnXG4gICwgJ3RleHR1cmVDdWJlJ1xuICAsICd0ZXh0dXJlQ3ViZUxvZCdcbiAgLCAndGV4dHVyZTJETG9kRVhUJ1xuICAsICd0ZXh0dXJlMkRQcm9qTG9kRVhUJ1xuICAsICd0ZXh0dXJlQ3ViZUxvZEVYVCdcbiAgLCAndGV4dHVyZTJER3JhZEVYVCdcbiAgLCAndGV4dHVyZTJEUHJvakdyYWRFWFQnXG4gICwgJ3RleHR1cmVDdWJlR3JhZEVYVCdcbl1cbiIsInZhciB2MTAwID0gcmVxdWlyZSgnLi9saXRlcmFscycpXG5cbm1vZHVsZS5leHBvcnRzID0gdjEwMC5zbGljZSgpLmNvbmNhdChbXG4gICAnbGF5b3V0J1xuICAsICdjZW50cm9pZCdcbiAgLCAnc21vb3RoJ1xuICAsICdjYXNlJ1xuICAsICdtYXQyeDInXG4gICwgJ21hdDJ4MydcbiAgLCAnbWF0Mng0J1xuICAsICdtYXQzeDInXG4gICwgJ21hdDN4MydcbiAgLCAnbWF0M3g0J1xuICAsICdtYXQ0eDInXG4gICwgJ21hdDR4MydcbiAgLCAnbWF0NHg0J1xuICAsICd1aW50J1xuICAsICd1dmVjMidcbiAgLCAndXZlYzMnXG4gICwgJ3V2ZWM0J1xuICAsICdzYW1wbGVyQ3ViZVNoYWRvdydcbiAgLCAnc2FtcGxlcjJEQXJyYXknXG4gICwgJ3NhbXBsZXIyREFycmF5U2hhZG93J1xuICAsICdpc2FtcGxlcjJEJ1xuICAsICdpc2FtcGxlcjNEJ1xuICAsICdpc2FtcGxlckN1YmUnXG4gICwgJ2lzYW1wbGVyMkRBcnJheSdcbiAgLCAndXNhbXBsZXIyRCdcbiAgLCAndXNhbXBsZXIzRCdcbiAgLCAndXNhbXBsZXJDdWJlJ1xuICAsICd1c2FtcGxlcjJEQXJyYXknXG4gICwgJ2NvaGVyZW50J1xuICAsICdyZXN0cmljdCdcbiAgLCAncmVhZG9ubHknXG4gICwgJ3dyaXRlb25seSdcbiAgLCAncmVzb3VyY2UnXG4gICwgJ2F0b21pY191aW50J1xuICAsICdub3BlcnNwZWN0aXZlJ1xuICAsICdwYXRjaCdcbiAgLCAnc2FtcGxlJ1xuICAsICdzdWJyb3V0aW5lJ1xuICAsICdjb21tb24nXG4gICwgJ3BhcnRpdGlvbidcbiAgLCAnYWN0aXZlJ1xuICAsICdmaWx0ZXInXG4gICwgJ2ltYWdlMUQnXG4gICwgJ2ltYWdlMkQnXG4gICwgJ2ltYWdlM0QnXG4gICwgJ2ltYWdlQ3ViZSdcbiAgLCAnaWltYWdlMUQnXG4gICwgJ2lpbWFnZTJEJ1xuICAsICdpaW1hZ2UzRCdcbiAgLCAnaWltYWdlQ3ViZSdcbiAgLCAndWltYWdlMUQnXG4gICwgJ3VpbWFnZTJEJ1xuICAsICd1aW1hZ2UzRCdcbiAgLCAndWltYWdlQ3ViZSdcbiAgLCAnaW1hZ2UxREFycmF5J1xuICAsICdpbWFnZTJEQXJyYXknXG4gICwgJ2lpbWFnZTFEQXJyYXknXG4gICwgJ2lpbWFnZTJEQXJyYXknXG4gICwgJ3VpbWFnZTFEQXJyYXknXG4gICwgJ3VpbWFnZTJEQXJyYXknXG4gICwgJ2ltYWdlMURTaGFkb3cnXG4gICwgJ2ltYWdlMkRTaGFkb3cnXG4gICwgJ2ltYWdlMURBcnJheVNoYWRvdydcbiAgLCAnaW1hZ2UyREFycmF5U2hhZG93J1xuICAsICdpbWFnZUJ1ZmZlcidcbiAgLCAnaWltYWdlQnVmZmVyJ1xuICAsICd1aW1hZ2VCdWZmZXInXG4gICwgJ3NhbXBsZXIxREFycmF5J1xuICAsICdzYW1wbGVyMURBcnJheVNoYWRvdydcbiAgLCAnaXNhbXBsZXIxRCdcbiAgLCAnaXNhbXBsZXIxREFycmF5J1xuICAsICd1c2FtcGxlcjFEJ1xuICAsICd1c2FtcGxlcjFEQXJyYXknXG4gICwgJ2lzYW1wbGVyMkRSZWN0J1xuICAsICd1c2FtcGxlcjJEUmVjdCdcbiAgLCAnc2FtcGxlckJ1ZmZlcidcbiAgLCAnaXNhbXBsZXJCdWZmZXInXG4gICwgJ3VzYW1wbGVyQnVmZmVyJ1xuICAsICdzYW1wbGVyMkRNUydcbiAgLCAnaXNhbXBsZXIyRE1TJ1xuICAsICd1c2FtcGxlcjJETVMnXG4gICwgJ3NhbXBsZXIyRE1TQXJyYXknXG4gICwgJ2lzYW1wbGVyMkRNU0FycmF5J1xuICAsICd1c2FtcGxlcjJETVNBcnJheSdcbl0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgLy8gY3VycmVudFxuICAgICdwcmVjaXNpb24nXG4gICwgJ2hpZ2hwJ1xuICAsICdtZWRpdW1wJ1xuICAsICdsb3dwJ1xuICAsICdhdHRyaWJ1dGUnXG4gICwgJ2NvbnN0J1xuICAsICd1bmlmb3JtJ1xuICAsICd2YXJ5aW5nJ1xuICAsICdicmVhaydcbiAgLCAnY29udGludWUnXG4gICwgJ2RvJ1xuICAsICdmb3InXG4gICwgJ3doaWxlJ1xuICAsICdpZidcbiAgLCAnZWxzZSdcbiAgLCAnaW4nXG4gICwgJ291dCdcbiAgLCAnaW5vdXQnXG4gICwgJ2Zsb2F0J1xuICAsICdpbnQnXG4gICwgJ3ZvaWQnXG4gICwgJ2Jvb2wnXG4gICwgJ3RydWUnXG4gICwgJ2ZhbHNlJ1xuICAsICdkaXNjYXJkJ1xuICAsICdyZXR1cm4nXG4gICwgJ21hdDInXG4gICwgJ21hdDMnXG4gICwgJ21hdDQnXG4gICwgJ3ZlYzInXG4gICwgJ3ZlYzMnXG4gICwgJ3ZlYzQnXG4gICwgJ2l2ZWMyJ1xuICAsICdpdmVjMydcbiAgLCAnaXZlYzQnXG4gICwgJ2J2ZWMyJ1xuICAsICdidmVjMydcbiAgLCAnYnZlYzQnXG4gICwgJ3NhbXBsZXIxRCdcbiAgLCAnc2FtcGxlcjJEJ1xuICAsICdzYW1wbGVyM0QnXG4gICwgJ3NhbXBsZXJDdWJlJ1xuICAsICdzYW1wbGVyMURTaGFkb3cnXG4gICwgJ3NhbXBsZXIyRFNoYWRvdydcbiAgLCAnc3RydWN0J1xuXG4gIC8vIGZ1dHVyZVxuICAsICdhc20nXG4gICwgJ2NsYXNzJ1xuICAsICd1bmlvbidcbiAgLCAnZW51bSdcbiAgLCAndHlwZWRlZidcbiAgLCAndGVtcGxhdGUnXG4gICwgJ3RoaXMnXG4gICwgJ3BhY2tlZCdcbiAgLCAnZ290bydcbiAgLCAnc3dpdGNoJ1xuICAsICdkZWZhdWx0J1xuICAsICdpbmxpbmUnXG4gICwgJ25vaW5saW5lJ1xuICAsICd2b2xhdGlsZSdcbiAgLCAncHVibGljJ1xuICAsICdzdGF0aWMnXG4gICwgJ2V4dGVybidcbiAgLCAnZXh0ZXJuYWwnXG4gICwgJ2ludGVyZmFjZSdcbiAgLCAnbG9uZydcbiAgLCAnc2hvcnQnXG4gICwgJ2RvdWJsZSdcbiAgLCAnaGFsZidcbiAgLCAnZml4ZWQnXG4gICwgJ3Vuc2lnbmVkJ1xuICAsICdpbnB1dCdcbiAgLCAnb3V0cHV0J1xuICAsICdodmVjMidcbiAgLCAnaHZlYzMnXG4gICwgJ2h2ZWM0J1xuICAsICdkdmVjMidcbiAgLCAnZHZlYzMnXG4gICwgJ2R2ZWM0J1xuICAsICdmdmVjMidcbiAgLCAnZnZlYzMnXG4gICwgJ2Z2ZWM0J1xuICAsICdzYW1wbGVyMkRSZWN0J1xuICAsICdzYW1wbGVyM0RSZWN0J1xuICAsICdzYW1wbGVyMkRSZWN0U2hhZG93J1xuICAsICdzaXplb2YnXG4gICwgJ2Nhc3QnXG4gICwgJ25hbWVzcGFjZSdcbiAgLCAndXNpbmcnXG5dXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICAnPDw9J1xuICAsICc+Pj0nXG4gICwgJysrJ1xuICAsICctLSdcbiAgLCAnPDwnXG4gICwgJz4+J1xuICAsICc8PSdcbiAgLCAnPj0nXG4gICwgJz09J1xuICAsICchPSdcbiAgLCAnJiYnXG4gICwgJ3x8J1xuICAsICcrPSdcbiAgLCAnLT0nXG4gICwgJyo9J1xuICAsICcvPSdcbiAgLCAnJT0nXG4gICwgJyY9J1xuICAsICdeXidcbiAgLCAnXj0nXG4gICwgJ3w9J1xuICAsICcoJ1xuICAsICcpJ1xuICAsICdbJ1xuICAsICddJ1xuICAsICcuJ1xuICAsICchJ1xuICAsICd+J1xuICAsICcqJ1xuICAsICcvJ1xuICAsICclJ1xuICAsICcrJ1xuICAsICctJ1xuICAsICc8J1xuICAsICc+J1xuICAsICcmJ1xuICAsICdeJ1xuICAsICd8J1xuICAsICc/J1xuICAsICc6J1xuICAsICc9J1xuICAsICcsJ1xuICAsICc7J1xuICAsICd7J1xuICAsICd9J1xuXVxuIiwidmFyIHRva2VuaXplID0gcmVxdWlyZSgnLi9pbmRleCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdG9rZW5pemVTdHJpbmdcblxuZnVuY3Rpb24gdG9rZW5pemVTdHJpbmcoc3RyLCBvcHQpIHtcbiAgdmFyIGdlbmVyYXRvciA9IHRva2VuaXplKG9wdClcbiAgdmFyIHRva2VucyA9IFtdXG5cbiAgdG9rZW5zID0gdG9rZW5zLmNvbmNhdChnZW5lcmF0b3Ioc3RyKSlcbiAgdG9rZW5zID0gdG9rZW5zLmNvbmNhdChnZW5lcmF0b3IobnVsbCkpXG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuIiwiKGZ1bmN0aW9uKHdpbmRvdykge1xuICAgIHZhciByZSA9IHtcbiAgICAgICAgbm90X3N0cmluZzogL1tec10vLFxuICAgICAgICBudW1iZXI6IC9bZGllZmddLyxcbiAgICAgICAganNvbjogL1tqXS8sXG4gICAgICAgIG5vdF9qc29uOiAvW15qXS8sXG4gICAgICAgIHRleHQ6IC9eW15cXHgyNV0rLyxcbiAgICAgICAgbW9kdWxvOiAvXlxceDI1ezJ9LyxcbiAgICAgICAgcGxhY2Vob2xkZXI6IC9eXFx4MjUoPzooWzEtOV1cXGQqKVxcJHxcXCgoW15cXCldKylcXCkpPyhcXCspPygwfCdbXiRdKT8oLSk/KFxcZCspPyg/OlxcLihcXGQrKSk/KFtiLWdpam9zdXhYXSkvLFxuICAgICAgICBrZXk6IC9eKFthLXpfXVthLXpfXFxkXSopL2ksXG4gICAgICAgIGtleV9hY2Nlc3M6IC9eXFwuKFthLXpfXVthLXpfXFxkXSopL2ksXG4gICAgICAgIGluZGV4X2FjY2VzczogL15cXFsoXFxkKylcXF0vLFxuICAgICAgICBzaWduOiAvXltcXCtcXC1dL1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNwcmludGYoKSB7XG4gICAgICAgIHZhciBrZXkgPSBhcmd1bWVudHNbMF0sIGNhY2hlID0gc3ByaW50Zi5jYWNoZVxuICAgICAgICBpZiAoIShjYWNoZVtrZXldICYmIGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpKSB7XG4gICAgICAgICAgICBjYWNoZVtrZXldID0gc3ByaW50Zi5wYXJzZShrZXkpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNwcmludGYuZm9ybWF0LmNhbGwobnVsbCwgY2FjaGVba2V5XSwgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIHNwcmludGYuZm9ybWF0ID0gZnVuY3Rpb24ocGFyc2VfdHJlZSwgYXJndikge1xuICAgICAgICB2YXIgY3Vyc29yID0gMSwgdHJlZV9sZW5ndGggPSBwYXJzZV90cmVlLmxlbmd0aCwgbm9kZV90eXBlID0gXCJcIiwgYXJnLCBvdXRwdXQgPSBbXSwgaSwgaywgbWF0Y2gsIHBhZCwgcGFkX2NoYXJhY3RlciwgcGFkX2xlbmd0aCwgaXNfcG9zaXRpdmUgPSB0cnVlLCBzaWduID0gXCJcIlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdHJlZV9sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZV90eXBlID0gZ2V0X3R5cGUocGFyc2VfdHJlZVtpXSlcbiAgICAgICAgICAgIGlmIChub2RlX3R5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBwYXJzZV90cmVlW2ldXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChub2RlX3R5cGUgPT09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgICAgIG1hdGNoID0gcGFyc2VfdHJlZVtpXSAvLyBjb252ZW5pZW5jZSBwdXJwb3NlcyBvbmx5XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoWzJdKSB7IC8vIGtleXdvcmQgYXJndW1lbnRcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3JdXG4gICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCBtYXRjaFsyXS5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhcmcuaGFzT3duUHJvcGVydHkobWF0Y2hbMl1ba10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNwcmludGYoXCJbc3ByaW50Zl0gcHJvcGVydHkgJyVzJyBkb2VzIG5vdCBleGlzdFwiLCBtYXRjaFsyXVtrXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmdbbWF0Y2hbMl1ba11dXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWF0Y2hbMV0pIHsgLy8gcG9zaXRpb25hbCBhcmd1bWVudCAoZXhwbGljaXQpXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbbWF0Y2hbMV1dXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChpbXBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3IrK11cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZ2V0X3R5cGUoYXJnKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubm90X3N0cmluZy50ZXN0KG1hdGNoWzhdKSAmJiByZS5ub3RfanNvbi50ZXN0KG1hdGNoWzhdKSAmJiAoZ2V0X3R5cGUoYXJnKSAhPSBcIm51bWJlclwiICYmIGlzTmFOKGFyZykpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc3ByaW50ZihcIltzcHJpbnRmXSBleHBlY3RpbmcgbnVtYmVyIGJ1dCBmb3VuZCAlc1wiLCBnZXRfdHlwZShhcmcpKSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubnVtYmVyLnRlc3QobWF0Y2hbOF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzX3Bvc2l0aXZlID0gYXJnID49IDBcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG1hdGNoWzhdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJiXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoMilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gcGFyc2VJbnQoYXJnLCAxMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IEpTT04uc3RyaW5naWZ5KGFyZywgbnVsbCwgbWF0Y2hbNl0gPyBwYXJzZUludChtYXRjaFs2XSkgOiAwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gbWF0Y2hbN10gPyBhcmcudG9FeHBvbmVudGlhbChtYXRjaFs3XSkgOiBhcmcudG9FeHBvbmVudGlhbCgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IHBhcnNlRmxvYXQoYXJnKS50b0ZpeGVkKG1hdGNoWzddKSA6IHBhcnNlRmxvYXQoYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZ1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gbWF0Y2hbN10gPyBwYXJzZUZsb2F0KGFyZykudG9QcmVjaXNpb24obWF0Y2hbN10pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoOClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9ICgoYXJnID0gU3RyaW5nKGFyZykpICYmIG1hdGNoWzddID8gYXJnLnN1YnN0cmluZygwLCBtYXRjaFs3XSkgOiBhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcgPj4+IDBcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygxNilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygxNikudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmUuanNvbi50ZXN0KG1hdGNoWzhdKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBhcmdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChtYXRjaFs4XSkgJiYgKCFpc19wb3NpdGl2ZSB8fCBtYXRjaFszXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ24gPSBpc19wb3NpdGl2ZSA/IFwiK1wiIDogXCItXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygpLnJlcGxhY2UocmUuc2lnbiwgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ24gPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFkX2NoYXJhY3RlciA9IG1hdGNoWzRdID8gbWF0Y2hbNF0gPT09IFwiMFwiID8gXCIwXCIgOiBtYXRjaFs0XS5jaGFyQXQoMSkgOiBcIiBcIlxuICAgICAgICAgICAgICAgICAgICBwYWRfbGVuZ3RoID0gbWF0Y2hbNl0gLSAoc2lnbiArIGFyZykubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHBhZCA9IG1hdGNoWzZdID8gKHBhZF9sZW5ndGggPiAwID8gc3RyX3JlcGVhdChwYWRfY2hhcmFjdGVyLCBwYWRfbGVuZ3RoKSA6IFwiXCIpIDogXCJcIlxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBtYXRjaFs1XSA/IHNpZ24gKyBhcmcgKyBwYWQgOiAocGFkX2NoYXJhY3RlciA9PT0gXCIwXCIgPyBzaWduICsgcGFkICsgYXJnIDogcGFkICsgc2lnbiArIGFyZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXCIpXG4gICAgfVxuXG4gICAgc3ByaW50Zi5jYWNoZSA9IHt9XG5cbiAgICBzcHJpbnRmLnBhcnNlID0gZnVuY3Rpb24oZm10KSB7XG4gICAgICAgIHZhciBfZm10ID0gZm10LCBtYXRjaCA9IFtdLCBwYXJzZV90cmVlID0gW10sIGFyZ19uYW1lcyA9IDBcbiAgICAgICAgd2hpbGUgKF9mbXQpIHtcbiAgICAgICAgICAgIGlmICgobWF0Y2ggPSByZS50ZXh0LmV4ZWMoX2ZtdCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBtYXRjaFswXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUubW9kdWxvLmV4ZWMoX2ZtdCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBcIiVcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUucGxhY2Vob2xkZXIuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDFcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkX2xpc3QgPSBbXSwgcmVwbGFjZW1lbnRfZmllbGQgPSBtYXRjaFsyXSwgZmllbGRfbWF0Y2ggPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5LmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdFtmaWVsZF9saXN0Lmxlbmd0aF0gPSBmaWVsZF9tYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChyZXBsYWNlbWVudF9maWVsZCA9IHJlcGxhY2VtZW50X2ZpZWxkLnN1YnN0cmluZyhmaWVsZF9tYXRjaFswXS5sZW5ndGgpKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZmllbGRfbWF0Y2ggPSByZS5rZXlfYWNjZXNzLmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKChmaWVsZF9tYXRjaCA9IHJlLmluZGV4X2FjY2Vzcy5leGVjKHJlcGxhY2VtZW50X2ZpZWxkKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdFtmaWVsZF9saXN0Lmxlbmd0aF0gPSBmaWVsZF9tYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXlcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJbc3ByaW50Zl0gZmFpbGVkIHRvIHBhcnNlIG5hbWVkIGFyZ3VtZW50IGtleVwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gZmllbGRfbGlzdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ19uYW1lcyA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJbc3ByaW50Zl0gbWl4aW5nIHBvc2l0aW9uYWwgYW5kIG5hbWVkIHBsYWNlaG9sZGVycyBpcyBub3QgKHlldCkgc3VwcG9ydGVkXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcnNlX3RyZWVbcGFyc2VfdHJlZS5sZW5ndGhdID0gbWF0Y2hcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIltzcHJpbnRmXSB1bmV4cGVjdGVkIHBsYWNlaG9sZGVyXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfZm10ID0gX2ZtdC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJzZV90cmVlXG4gICAgfVxuXG4gICAgdmFyIHZzcHJpbnRmID0gZnVuY3Rpb24oZm10LCBhcmd2LCBfYXJndikge1xuICAgICAgICBfYXJndiA9IChhcmd2IHx8IFtdKS5zbGljZSgwKVxuICAgICAgICBfYXJndi5zcGxpY2UoMCwgMCwgZm10KVxuICAgICAgICByZXR1cm4gc3ByaW50Zi5hcHBseShudWxsLCBfYXJndilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBoZWxwZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0X3R5cGUodmFyaWFibGUpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdHJfcmVwZWF0KGlucHV0LCBtdWx0aXBsaWVyKSB7XG4gICAgICAgIHJldHVybiBBcnJheShtdWx0aXBsaWVyICsgMSkuam9pbihpbnB1dClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBleHBvcnQgdG8gZWl0aGVyIGJyb3dzZXIgb3Igbm9kZS5qc1xuICAgICAqL1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBleHBvcnRzLnNwcmludGYgPSBzcHJpbnRmXG4gICAgICAgIGV4cG9ydHMudnNwcmludGYgPSB2c3ByaW50ZlxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgd2luZG93LnNwcmludGYgPSBzcHJpbnRmXG4gICAgICAgIHdpbmRvdy52c3ByaW50ZiA9IHZzcHJpbnRmXG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50Zjogc3ByaW50ZixcbiAgICAgICAgICAgICAgICAgICAgdnNwcmludGY6IHZzcHJpbnRmXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIgPyB0aGlzIDogd2luZG93KTtcbiIsIi8vICBUaW1lciBiYXNlZCBhbmltYXRpb25cbi8vIFRPRE8gY2xlYW4gdXAgbGludGluZ1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGdsb2JhbCBzZXRUaW1lb3V0ICovXG5pbXBvcnQge21lcmdlLCBub29wLCBzcGxhdH0gZnJvbSAnLi4vdXRpbHMnO1xuXG52YXIgUXVldWUgPSBbXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRngge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHtcbiAgICAgIGRlbGF5OiAwLFxuICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICB0cmFuc2l0aW9uOiB4ID0+IHgsXG4gICAgICBvbkNvbXB1dGU6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wXG4gICAgfSwgb3B0aW9ucyk7XG4gIH1cblxuICBzdGFydChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh0aGlzLm9wdCwgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy50aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmFuaW1hdGluZyA9IHRydWU7XG4gICAgUXVldWUucHVzaCh0aGlzKTtcbiAgfVxuXG4gIC8vIHBlcmZvcm0gYSBzdGVwIGluIHRoZSBhbmltYXRpb25cbiAgc3RlcCgpIHtcbiAgICAvLyBpZiBub3QgYW5pbWF0aW5nLCB0aGVuIHJldHVyblxuICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKSxcbiAgICAgIHRpbWUgPSB0aGlzLnRpbWUsXG4gICAgICBvcHQgPSB0aGlzLm9wdCxcbiAgICAgIGRlbGF5ID0gb3B0LmRlbGF5LFxuICAgICAgZHVyYXRpb24gPSBvcHQuZHVyYXRpb24sXG4gICAgICBkZWx0YSA9IDA7XG4gICAgLy8gaG9sZCBhbmltYXRpb24gZm9yIHRoZSBkZWxheVxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSkge1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaWYgaW4gb3VyIHRpbWUgd2luZG93LCB0aGVuIGV4ZWN1dGUgYW5pbWF0aW9uXG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5ICsgZHVyYXRpb24pIHtcbiAgICAgIGRlbHRhID0gb3B0LnRyYW5zaXRpb24oKGN1cnJlbnRUaW1lIC0gdGltZSAtIGRlbGF5KSAvIGR1cmF0aW9uKTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgMSk7XG4gICAgICBvcHQub25Db21wbGV0ZS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBjb21wdXRlKGZyb20sIHRvLCBkZWx0YSkge1xuICAgIHJldHVybiBmcm9tICsgKHRvIC0gZnJvbSkgKiBkZWx0YTtcbiAgfVxufVxuXG5GeC5RdWV1ZSA9IFF1ZXVlO1xuXG4vLyBFYXNpbmcgZXF1YXRpb25zXG5GeC5UcmFuc2l0aW9uID0ge1xuICBsaW5lYXIocCkge1xuICAgIHJldHVybiBwO1xuICB9XG59O1xuXG52YXIgVHJhbnMgPSBGeC5UcmFuc2l0aW9uO1xuXG5GeC5wcm90b3R5cGUudGltZSA9IG51bGw7XG5cbmZ1bmN0aW9uIG1ha2VUcmFucyh0cmFuc2l0aW9uLCBwYXJhbXMpIHtcbiAgcGFyYW1zID0gc3BsYXQocGFyYW1zKTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24odHJhbnNpdGlvbiwge1xuICAgIGVhc2VJbihwb3MpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uKHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VPdXQocG9zKSB7XG4gICAgICByZXR1cm4gMSAtIHRyYW5zaXRpb24oMSAtIHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VJbk91dChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zIDw9IDAuNSkgPyB0cmFuc2l0aW9uKDIgKiBwb3MsIHBhcmFtcykgLyAyIDpcbiAgICAgICAgKDIgLSB0cmFuc2l0aW9uKDIgKiAoMSAtIHBvcyksIHBhcmFtcykpIC8gMjtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgdHJhbnNpdGlvbnMgPSB7XG5cbiAgUG93KHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgeFswXSB8fCA2KTtcbiAgfSxcblxuICBFeHBvKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgOCAqIChwIC0gMSkpO1xuICB9LFxuXG4gIENpcmMocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oTWF0aC5hY29zKHApKTtcbiAgfSxcblxuICBTaW5lKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKCgxIC0gcCkgKiBNYXRoLlBJIC8gMik7XG4gIH0sXG5cbiAgQmFjayhwLCB4KSB7XG4gICAgeCA9IHhbMF0gfHwgMS42MTg7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIDIpICogKCh4ICsgMSkgKiBwIC0geCk7XG4gIH0sXG5cbiAgQm91bmNlKHApIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgZm9yIChsZXQgYSA9IDAsIGIgPSAxOyAxOyBhICs9IGIsIGIgLz0gMikge1xuICAgICAgaWYgKHAgPj0gKDcgLSA0ICogYSkgLyAxMSkge1xuICAgICAgICB2YWx1ZSA9IGIgKiBiIC0gTWF0aC5wb3coKDExIC0gNiAqIGEgLSAxMSAqIHApIC8gNCwgMik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG5cbiAgRWxhc3RpYyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDEwICogLS1wKSAqIE1hdGguY29zKDIwICogcCAqIE1hdGguUEkgKiAoeFswXSB8fCAxKSAvIDMpO1xuICB9XG5cbn07XG5cbmZvciAoY29uc3QgdCBpbiB0cmFuc2l0aW9ucykge1xuICBUcmFuc1t0XSA9IG1ha2VUcmFucyh0cmFuc2l0aW9uc1t0XSk7XG59XG5cblsnUXVhZCcsICdDdWJpYycsICdRdWFydCcsICdRdWludCddLmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaSkge1xuICBUcmFuc1tlbGVtXSA9IG1ha2VUcmFucyhmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIFtcbiAgICAgIGkgKyAyXG4gICAgXSk7XG4gIH0pO1xufSk7XG5cbi8vIGFuaW1hdGlvblRpbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcblxuLy8gIHJ5ZTogVE9ETy0gcmVmYWN0b3IgZ2xvYmFsIGRlZmluaXRpb24gd2hlbiB3ZSBkZWZpbmUgdGhlIHR3b1xuLy8gICAgICAgICAgICAgKGJyb3dzZXJpZnkvPHNjcmlwdD4pIGJ1aWxkIHBhdGhzLlxudmFyIGdsb2JhbDtcbnRyeSB7XG4gIGdsb2JhbCA9IHdpbmRvdztcbn0gY2F0Y2ggKGUpIHtcbiAgZ2xvYmFsID0gbnVsbDtcbn1cblxudmFyIGNoZWNrRnhRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2xkUXVldWUgPSBRdWV1ZTtcbiAgUXVldWUgPSBbXTtcbiAgaWYgKG9sZFF1ZXVlLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2xkUXVldWUubGVuZ3RoLCBmeDsgaSA8IGw7IGkrKykge1xuICAgICAgZnggPSBvbGRRdWV1ZVtpXTtcbiAgICAgIGZ4LnN0ZXAoKTtcbiAgICAgIGlmIChmeC5hbmltYXRpbmcpIHtcbiAgICAgICAgUXVldWUucHVzaChmeCk7XG4gICAgICB9XG4gICAgfVxuICAgIEZ4LlF1ZXVlID0gUXVldWU7XG4gIH1cbn07XG5cbmlmIChnbG9iYWwpIHtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0QW5pbWF0aW9uVGltZScsICdtb3pBbmltYXRpb25UaW1lJywgJ2FuaW1hdGlvblRpbWUnLFxuICAgJ3dlYmtpdEFuaW1hdGlvblN0YXJ0VGltZScsICdtb3pBbmltYXRpb25TdGFydFRpbWUnLCAnYW5pbWF0aW9uU3RhcnRUaW1lJ11cbiAgICAuZm9yRWFjaChpbXBsID0+IHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5hbmltYXRpb25UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGdsb2JhbFtpbXBsXTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRnguYW5pbWF0aW9uVGltZSA9IERhdGUubm93O1xuICB9XG4gIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuICBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZScsICdtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLFxuICAgJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddXG4gICAgLmZvckVhY2goZnVuY3Rpb24oaW1wbCkge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgZ2xvYmFsW2ltcGxdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9LCAxMDAwIC8gNjApO1xuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCBQcm9ncmFtIGZyb20gJy4uL3dlYmdsL3Byb2dyYW0nO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQge1hIUkdyb3VwfSBmcm9tICcuLi9pbyc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuLy8gQWx0ZXJuYXRlIGNvbnN0cnVjdG9yXG4vLyBCdWlsZCBwcm9ncmFtIGZyb20gZGVmYXVsdCBzaGFkZXJzIChyZXF1aXJlcyBTaGFkZXJzKVxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtZnJvbURlZmF1bHRTaGFkZXJzKGdsLCBpZCkge1xuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHtcbiAgICB2czogU2hhZGVycy5WZXJ0ZXguRGVmYXVsdCxcbiAgICBmczogU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0LFxuICAgIGlkXG4gIH0pO1xufVxuXG4vLyBDcmVhdGUgYSBwcm9ncmFtIGZyb20gdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgbm9kZSBpZHNcbi8vIEBkZXByZWNhdGVkIC0gVXNlIGdsc2xpZnkgaW5zdGVhZFxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtRnJvbUhUTUxUZW1wbGF0ZXMoZ2wsIHZzSWQsIGZzSWQsIGlkKSB7XG4gIGNvbnN0IHZzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodnNJZCkuaW5uZXJIVE1MO1xuICBjb25zdCBmcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZzSWQpLmlubmVySFRNTDtcbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7dnMsIGZzLCBpZH0pO1xufVxuXG4vLyBMb2FkIHNoYWRlcnMgdXNpbmcgWEhSXG4vLyBAZGVwcmVjYXRlZCAtIFVzZSBnbHNsaWZ5IGluc3RlYWRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlUHJvZ3JhbUZyb21TaGFkZXJVUklzKGdsLCB2cywgZnMsIG9wdHMpIHtcbiAgb3B0cyA9IG1lcmdlKHtcbiAgICBwYXRoOiAnLycsXG4gICAgbm9DYWNoZTogZmFsc2VcbiAgfSwgb3B0cyk7XG5cbiAgY29uc3QgdmVydGV4U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgdnM7XG4gIGNvbnN0IGZyYWdtZW50U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgZnM7XG5cbiAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgbmV3IFhIUkdyb3VwKHtcbiAgICB1cmxzOiBbdmVydGV4U2hhZGVyVVJJLCBmcmFnbWVudFNoYWRlclVSSV0sXG4gICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG4gIH0pLnNlbmRBc3luYygpO1xuXG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzOiByZXNwb25zZXNbMF0sIGZzOiByZXNwb25zZXNbMV19KTtcbn1cbiIsImltcG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgKiBhcyBzYXZlQml0bWFwIGZyb20gJy4vc2F2ZS1iaXRtYXAnO1xuXG5leHBvcnQge2RlZmF1bHQgYXMgRnh9IGZyb20gJy4vZngnO1xuZXhwb3J0IHtkZWZhdWx0IGFzIFdvcmtlckdyb3VwfSBmcm9tICcuL3dvcmtlcnMnO1xuZXhwb3J0ICogZnJvbSAnLi9oZWxwZXJzJztcbmV4cG9ydCAqIGZyb20gJy4vc2F2ZS1iaXRtYXAnO1xuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lkx1bWFHTCkge1xuICB3aW5kb3cuTHVtYUdMLmFkZG9ucyA9IHtcbiAgICBGeDogRngsXG4gICAgV29ya2VyR3JvdXA6IFdvcmtlckdyb3VwXG4gIH07XG4gIE9iamVjdC5hc3NpZ24od2luZG93Lkx1bWFHTC5hZGRvbnMsIGhlbHBlcnMpO1xuICBPYmplY3QuYXNzaWduKHdpbmRvdy5MdW1hR0wuYWRkb25zLCBzYXZlQml0bWFwKTtcbn1cbiIsImltcG9ydCB7c2F2ZUFzfSBmcm9tICdmaWxlc2F2ZXIuanMnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIHRvQmxvYn0gZnJvbSAnY2FudmFzLXRvLWJsb2InO1xuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZUJpdG1hcChjYW52YXMsIGZpbGVuYW1lKSB7XG4gIGNvbnN0IGJsb2IgPSB0b0Jsb2IoY2FudmFzLnRvRGF0YVVSTCgpKTtcbiAgc2F2ZUFzKGJsb2IsIGZpbGVuYW1lKTtcbn1cbiIsIi8vIHdvcmtlcnMuanNcbi8vXG4vKiBnbG9iYWwgV29ya2VyICovXG4vKiBlc2xpbnQtZGlzYWJsZSBvbmUtdmFyLCBpbmRlbnQgKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV29ya2VyR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGZpbGVOYW1lLCBuKSB7XG4gICAgdmFyIHdvcmtlcnMgPSB0aGlzLndvcmtlcnMgPSBbXTtcbiAgICB3aGlsZSAobi0tKSB7XG4gICAgICB3b3JrZXJzLnB1c2gobmV3IFdvcmtlcihmaWxlTmFtZSkpO1xuICAgIH1cbiAgfVxuXG4gIG1hcChmdW5jKSB7XG4gICAgdmFyIHdvcmtlcnMgPSB0aGlzLndvcmtlcnM7XG4gICAgdmFyIGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3MgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gd29ya2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNvbmZpZ3MucHVzaChmdW5jICYmIGZ1bmMoaSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVkdWNlKG9wdCkge1xuICAgIHZhciBmbiA9IG9wdC5yZWR1Y2VGbixcbiAgICAgICAgd29ya2VycyA9IHRoaXMud29ya2VycyxcbiAgICAgICAgY29uZmlncyA9IHRoaXMuY29uZmlncyxcbiAgICAgICAgbCA9IHdvcmtlcnMubGVuZ3RoLFxuICAgICAgICBhY3VtID0gb3B0LmluaXRpYWxWYWx1ZSxcbiAgICAgICAgbWVzc2FnZSA9IGZ1bmN0aW9uIF8oZSkge1xuICAgICAgICAgIGwtLTtcbiAgICAgICAgICBpZiAoYWN1bSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBhY3VtID0gZS5kYXRhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY3VtID0gZm4oYWN1bSwgZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGwgPT09IDApIHtcbiAgICAgICAgICAgIG9wdC5vbkNvbXBsZXRlKGFjdW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBmb3IgKHZhciBpID0gMCwgbG4gPSBsOyBpIDwgbG47IGkrKykge1xuICAgICAgdmFyIHcgPSB3b3JrZXJzW2ldO1xuICAgICAgdy5vbm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgdy5wb3N0TWVzc2FnZShjb25maWdzW2ldKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iLCIvLyBQcm92aWRlcyBsb2FkaW5nIG9mIGFzc2V0cyB3aXRoIFhIUiBhbmQgSlNPTlAgbWV0aG9kcy5cbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiwgY29tcGxleGl0eSAqL1xuXG4vKiBnbG9iYWwgZG9jdW1lbnQsIFhNTEh0dHBSZXF1ZXN0LCBJbWFnZSAqL1xuaW1wb3J0IHt1aWQsIHNwbGF0LCBtZXJnZSwgbm9vcH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge1RleHR1cmUyRH0gZnJvbSAnLi93ZWJnbCc7XG5cbmV4cG9ydCBjbGFzcyBYSFIge1xuXG4gIGNvbnN0cnVjdG9yKG9wdCA9IHt9KSB7XG4gICAgb3B0ID0ge1xuICAgICAgdXJsOiAnaHR0cDovLyBwaGlsb2dsanMub3JnLycsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgYXN5bmM6IHRydWUsXG4gICAgICBub0NhY2hlOiBmYWxzZSxcbiAgICAgIC8vIGJvZHk6IG51bGwsXG4gICAgICBzZW5kQXNCaW5hcnk6IGZhbHNlLFxuICAgICAgcmVzcG9uc2VUeXBlOiBmYWxzZSxcbiAgICAgIG9uUHJvZ3Jlc3M6IG5vb3AsXG4gICAgICBvblN1Y2Nlc3M6IG5vb3AsXG4gICAgICBvbkVycm9yOiBub29wLFxuICAgICAgb25BYm9ydDogbm9vcCxcbiAgICAgIG9uQ29tcGxldGU6IG5vb3AsXG4gICAgICAuLi5vcHRcbiAgICB9O1xuXG4gICAgdGhpcy5vcHQgPSBvcHQ7XG4gICAgdGhpcy5pbml0WEhSKCk7XG4gIH1cblxuICBpbml0WEhSKCkge1xuICAgIGNvbnN0IHJlcSA9IHRoaXMucmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBbJ1Byb2dyZXNzJywgJ0Vycm9yJywgJ0Fib3J0JywgJ0xvYWQnXS5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgIGlmIChyZXEuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICByZXEuYWRkRXZlbnRMaXN0ZW5lcihldmVudC50b0xvd2VyQ2FzZSgpLCBlID0+IHtcbiAgICAgICAgICBzZWxmWydoYW5kbGUnICsgZXZlbnRdKGUpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXFbJ29uJyArIGV2ZW50LnRvTG93ZXJDYXNlKCldID0gZSA9PiB7XG4gICAgICAgICAgc2VsZlsnaGFuZGxlJyArIGV2ZW50XShlKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNlbmRBc3luYyhib2R5KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHtyZXEsIG9wdH0gPSB0aGlzO1xuICAgICAgY29uc3Qge2FzeW5jfSA9IG9wdDtcblxuICAgICAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgICAgIG9wdC51cmwgKz0gKG9wdC51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gICAgICB9XG5cbiAgICAgIHJlcS5vcGVuKG9wdC5tZXRob2QsIG9wdC51cmwsIGFzeW5jKTtcblxuICAgICAgaWYgKG9wdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IG9wdC5yZXNwb25zZVR5cGU7XG4gICAgICB9XG5cbiAgICAgIGlmIChhc3luYykge1xuICAgICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFIuU3RhdGUuQ09NUExFVEVEKSB7XG4gICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0LnNlbmRBc0JpbmFyeSkge1xuICAgICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEuc2VuZChib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWFzeW5jKSB7XG4gICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2VuZChib2R5KSB7XG4gICAgY29uc3Qge3JlcSwgb3B0fSA9IHRoaXM7XG4gICAgY29uc3QgYXN5bmMgPSBvcHQuYXN5bmM7XG5cbiAgICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICAgIG9wdC51cmwgKz0gKG9wdC51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gICAgfVxuXG4gICAgcmVxLm9wZW4ob3B0Lm1ldGhvZCwgb3B0LnVybCwgYXN5bmMpO1xuXG4gICAgaWYgKG9wdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSBvcHQucmVzcG9uc2VUeXBlO1xuICAgIH1cblxuICAgIGlmIChhc3luYykge1xuICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IFhIUi5TdGF0ZS5DT01QTEVURUQpIHtcbiAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICBvcHQub25TdWNjZXNzKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0Lm9uRXJyb3IocmVxLnN0YXR1cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChvcHQuc2VuZEFzQmluYXJ5KSB7XG4gICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcS5zZW5kKGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCFhc3luYykge1xuICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICBvcHQub25TdWNjZXNzKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdC5vbkVycm9yKHJlcS5zdGF0dXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCB2YWx1ZSkge1xuICAgIHRoaXMucmVxLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBoYW5kbGVQcm9ncmVzcyhlKSB7XG4gICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgdGhpcy5vcHQub25Qcm9ncmVzcyhlLCBNYXRoLnJvdW5kKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wdC5vblByb2dyZXNzKGUsIC0xKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVFcnJvcihlKSB7XG4gICAgdGhpcy5vcHQub25FcnJvcihlKTtcbiAgfVxuXG4gIGhhbmRsZUFib3J0KGUpIHtcbiAgICB0aGlzLm9wdC5vbkFib3J0KGUpO1xuICB9XG5cbiAgaGFuZGxlTG9hZChlKSB7XG4gICAgdGhpcy5vcHQub25Db21wbGV0ZShlKTtcbiAgfVxufVxuXG5YSFIuU3RhdGUgPSB7fTtcblsnVU5JTklUSUFMSVpFRCcsICdMT0FESU5HJywgJ0xPQURFRCcsICdJTlRFUkFDVElWRScsICdDT01QTEVURUQnXVxuLmZvckVhY2goKHN0YXRlTmFtZSwgaSkgPT4ge1xuICBYSFIuU3RhdGVbc3RhdGVOYW1lXSA9IGk7XG59KTtcblxuLy8gTWFrZSBwYXJhbGxlbCByZXF1ZXN0cyBhbmQgZ3JvdXAgdGhlIHJlc3BvbnNlcy5cbmV4cG9ydCBjbGFzcyBYSFJHcm91cCB7XG5cbiAgY29uc3RydWN0b3Iob3B0ID0ge30pIHtcbiAgICBvcHQgPSB7XG4gICAgICB1cmxzOiBbXSxcbiAgICAgIG9uU3VjY2Vzczogbm9vcCxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBhc3luYzogdHJ1ZSxcbiAgICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgICAgLy8gYm9keTogbnVsbCxcbiAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2UsXG4gICAgICByZXNwb25zZVR5cGU6IGZhbHNlLFxuICAgICAgLi4ub3B0XG4gICAgfTtcblxuICAgIHZhciB1cmxzID0gc3BsYXQob3B0LnVybHMpO1xuICAgIHRoaXMucmVxcyA9IHVybHMubWFwKCh1cmwsIGkpID0+IG5ldyBYSFIoe1xuICAgICAgdXJsOiB1cmwsXG4gICAgICBtZXRob2Q6IG9wdC5tZXRob2QsXG4gICAgICBhc3luYzogb3B0LmFzeW5jLFxuICAgICAgbm9DYWNoZTogb3B0Lm5vQ2FjaGUsXG4gICAgICBzZW5kQXNCaW5hcnk6IG9wdC5zZW5kQXNCaW5hcnksXG4gICAgICByZXNwb25zZVR5cGU6IG9wdC5yZXNwb25zZVR5cGUsXG4gICAgICBib2R5OiBvcHQuYm9keVxuICAgIH0pKTtcbiAgfVxuXG4gIGFzeW5jIHNlbmRBc3luYygpIHtcbiAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5yZXFzLm1hcChyZXEgPT4gcmVxLnNlbmRBc3luYygpKSk7XG4gIH1cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gSlNPTlAob3B0KSB7XG4gIG9wdCA9IG1lcmdlKHtcbiAgICB1cmw6ICdodHRwOi8vIHBoaWxvZ2xqcy5vcmcvJyxcbiAgICBkYXRhOiB7fSxcbiAgICBub0NhY2hlOiBmYWxzZSxcbiAgICBvbkNvbXBsZXRlOiBub29wLFxuICAgIGNhbGxiYWNrS2V5OiAnY2FsbGJhY2snXG4gIH0sIG9wdCB8fCB7fSk7XG5cbiAgdmFyIGluZGV4ID0gSlNPTlAuY291bnRlcisrO1xuICAvLyBjcmVhdGUgcXVlcnkgc3RyaW5nXG4gIHZhciBkYXRhID0gW107XG4gIGZvciAodmFyIHByb3AgaW4gb3B0LmRhdGEpIHtcbiAgICBkYXRhLnB1c2gocHJvcCArICc9JyArIG9wdC5kYXRhW3Byb3BdKTtcbiAgfVxuICBkYXRhID0gZGF0YS5qb2luKCcmJyk7XG4gIC8vIGFwcGVuZCB1bmlxdWUgaWQgZm9yIGNhY2hlXG4gIGlmIChvcHQubm9DYWNoZSkge1xuICAgIGRhdGEgKz0gKGRhdGEuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gIH1cbiAgLy8gY3JlYXRlIHNvdXJjZSB1cmxcbiAgdmFyIHNyYyA9IG9wdC51cmwgK1xuICAgIChvcHQudXJsLmluZGV4T2YoJz8nKSA+IC0xID8gJyYnIDogJz8nKSArXG4gICAgb3B0LmNhbGxiYWNrS2V5ICsgJz1QaGlsb0dMIElPLkpTT05QLnJlcXVlc3RzLnJlcXVlc3RfJyArIGluZGV4ICtcbiAgICAoZGF0YS5sZW5ndGggPiAwID8gJyYnICsgZGF0YSA6ICcnKTtcblxuICAvLyBjcmVhdGUgc2NyaXB0XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgc2NyaXB0LnNyYyA9IHNyYztcblxuICAvLyBjcmVhdGUgY2FsbGJhY2tcbiAgSlNPTlAucmVxdWVzdHNbJ3JlcXVlc3RfJyArIGluZGV4XSA9IGZ1bmN0aW9uKGpzb24pIHtcbiAgICBvcHQub25Db21wbGV0ZShqc29uKTtcbiAgICAvLyByZW1vdmUgc2NyaXB0XG4gICAgaWYgKHNjcmlwdC5wYXJlbnROb2RlKSB7XG4gICAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgIH1cbiAgICBpZiAoc2NyaXB0LmNsZWFyQXR0cmlidXRlcykge1xuICAgICAgc2NyaXB0LmNsZWFyQXR0cmlidXRlcygpO1xuICAgIH1cbiAgfTtcblxuICAvLyBpbmplY3Qgc2NyaXB0XG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbn1cblxuSlNPTlAuY291bnRlciA9IDA7XG5KU09OUC5yZXF1ZXN0cyA9IHt9O1xuXG4vLyBDcmVhdGVzIGFuIGltYWdlLWxvYWRpbmcgcHJvbWlzZS5cbmZ1bmN0aW9uIGxvYWRJbWFnZShzcmMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVzb2x2ZShpbWFnZSk7XG4gICAgfTtcbiAgICBpbWFnZS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKGBDb3VsZCBub3QgbG9hZCBpbWFnZSAke3NyY30uYCkpO1xuICAgIH07XG4gICAgaW1hZ2Uuc3JjID0gc3JjO1xuICB9KTtcbn1cblxuLy8gTG9hZCBtdWx0aXBsZSBpbWFnZXMgYXN5bmMuXG4vLyByeWU6IFRPRE8gdGhpcyBuZWVkcyB0byBpbXBsZW1lbnQgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZVxuLy8gICAgICAgICAgIG9yaWdpbmFsIEltYWdlcyBmdW5jdGlvbi5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRJbWFnZXMoc3Jjcykge1xuICBsZXQgaW1hZ2VQcm9taXNlcyA9IHNyY3MubWFwKChzcmMpID0+IGxvYWRJbWFnZShzcmMpKTtcbiAgbGV0IHJlc3VsdHMgPSBbXTtcbiAgZm9yIChjb25zdCBpbWFnZVByb21pc2Ugb2YgaW1hZ2VQcm9taXNlcykge1xuICAgIHJlc3VsdHMucHVzaChhd2FpdCBpbWFnZVByb21pc2UpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyAvLyBMb2FkIG11bHRpcGxlIEltYWdlIGFzc2V0cyBhc3luY1xuLy8gZXhwb3J0IGZ1bmN0aW9uIEltYWdlcyhvcHQpIHtcbi8vICAgb3B0ID0gbWVyZ2Uoe1xuLy8gICAgIHNyYzogW10sXG4vLyAgICAgbm9DYWNoZTogZmFsc2UsXG4vLyAgICAgb25Qcm9ncmVzczogbm9vcCxcbi8vICAgICBvbkNvbXBsZXRlOiBub29wXG4vLyAgIH0sIG9wdCB8fCB7fSk7XG4vL1xuLy8gICBsZXQgY291bnQgPSAwO1xuLy8gICBsZXQgbCA9IG9wdC5zcmMubGVuZ3RoO1xuLy9cbi8vICAgbGV0IGltYWdlcztcbi8vICAgLy8gSW1hZ2Ugb25sb2FkIGhhbmRsZXJcbi8vICAgdmFyIGxvYWQgPSAoKSA9PiB7XG4vLyAgICAgb3B0Lm9uUHJvZ3Jlc3MoTWF0aC5yb3VuZCgrK2NvdW50IC8gbCAqIDEwMCkpO1xuLy8gICAgIGlmIChjb3VudCA9PT0gbCkge1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoaW1hZ2VzKTtcbi8vICAgICB9XG4vLyAgIH07XG4vLyAgIC8vIEltYWdlIGVycm9yIGhhbmRsZXJcbi8vICAgdmFyIGVycm9yID0gKCkgPT4ge1xuLy8gICAgIGlmICgrK2NvdW50ID09PSBsKSB7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZShpbWFnZXMpO1xuLy8gICAgIH1cbi8vICAgfTtcbi8vXG4vLyAgIC8vIHVpZCBmb3IgaW1hZ2Ugc291cmNlc1xuLy8gICBjb25zdCBub0NhY2hlID0gb3B0Lm5vQ2FjaGU7XG4vLyAgIGNvbnN0IHVpZCA9IHVpZCgpO1xuLy8gICBmdW5jdGlvbiBnZXRTdWZmaXgocykge1xuLy8gICAgIHJldHVybiAocy5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQ7XG4vLyAgIH1cbi8vXG4vLyAgIC8vIENyZWF0ZSBpbWFnZSBhcnJheVxuLy8gICBpbWFnZXMgPSBvcHQuc3JjLm1hcCgoc3JjLCBpKSA9PiB7XG4vLyAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICAgaW1nLmluZGV4ID0gaTtcbi8vICAgICBpbWcub25sb2FkID0gbG9hZDtcbi8vICAgICBpbWcub25lcnJvciA9IGVycm9yO1xuLy8gICAgIGltZy5zcmMgPSBzcmMgKyAobm9DYWNoZSA/IGdldFN1ZmZpeChzcmMpIDogJycpO1xuLy8gICAgIHJldHVybiBpbWc7XG4vLyAgIH0pO1xuLy9cbi8vICAgcmV0dXJuIGltYWdlcztcbi8vIH1cblxuLy8gTG9hZCBtdWx0aXBsZSB0ZXh0dXJlcyBmcm9tIGltYWdlc1xuLy8gcnllOiBUT0RPIHRoaXMgbmVlZHMgdG8gaW1wbGVtZW50IGZ1bmN0aW9uYWxpdHkgZnJvbVxuLy8gICAgICAgICAgIHRoZSBvcmlnaW5hbCBsb2FkVGV4dHVyZXMgZnVuY3Rpb24uXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFRleHR1cmVzKGdsLCBvcHQpIHtcbiAgdmFyIGltYWdlcyA9IGF3YWl0IGxvYWRJbWFnZXMob3B0LnNyYyk7XG4gIHZhciB0ZXh0dXJlcyA9IFtdO1xuICBpbWFnZXMuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4gICAgdmFyIHBhcmFtcyA9IEFycmF5LmlzQXJyYXkob3B0LnBhcmFtZXRlcnMpID9cbiAgICAgIG9wdC5wYXJhbWV0ZXJzW2ldIDogb3B0LnBhcmFtZXRlcnM7XG4gICAgcGFyYW1zID0gcGFyYW1zID09PSB1bmRlZmluZWQgPyB7fSA6IHBhcmFtcztcbiAgICB0ZXh0dXJlcy5wdXNoKG5ldyBUZXh0dXJlMkQoZ2wsIG1lcmdlKHtcbiAgICAgIGRhdGE6IGltZ1xuICAgIH0sIHBhcmFtcykpKTtcbiAgfSk7XG4gIHJldHVybiB0ZXh0dXJlcztcbn1cblxuLy8gLy8gTG9hZCBtdWx0aXBsZSB0ZXh0dXJlcyBmcm9tIGltYWdlc1xuLy8gZXhwb3J0IGZ1bmN0aW9uIGxvYWRUZXh0dXJlcyhvcHQgPSB7fSkge1xuLy8gICBvcHQgPSB7XG4vLyAgICAgc3JjOiBbXSxcbi8vICAgICBub0NhY2hlOiBmYWxzZSxcbi8vICAgICBvbkNvbXBsZXRlOiBub29wLFxuLy8gICAgIC4uLm9wdFxuLy8gICB9O1xuLy9cbi8vICAgSW1hZ2VzKHtcbi8vICAgICBzcmM6IG9wdC5zcmMsXG4vLyAgICAgbm9DYWNoZTogb3B0Lm5vQ2FjaGUsXG4vLyAgICAgb25Db21wbGV0ZShpbWFnZXMpIHtcbi8vICAgICAgIHZhciB0ZXh0dXJlcyA9IHt9O1xuLy8gICAgICAgaW1hZ2VzLmZvckVhY2goKGltZywgaSkgPT4ge1xuLy8gICAgICAgICB0ZXh0dXJlc1tvcHQuaWQgJiYgb3B0LmlkW2ldIHx8IG9wdC5zcmMgJiYgb3B0LnNyY1tpXV0gPSBtZXJnZSh7XG4vLyAgICAgICAgICAgZGF0YToge1xuLy8gICAgICAgICAgICAgdmFsdWU6IGltZ1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgfSwgb3B0KTtcbi8vICAgICAgIH0pO1xuLy8gICAgICAgYXBwLnNldFRleHR1cmVzKHRleHR1cmVzKTtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKCk7XG4vLyAgICAgfVxuLy8gICB9KTtcbi8vIH1cbiIsIi8vIERlZmF1bHQgU2hhZGVyc1xudmFyIGdsc2xpZnkgPSByZXF1aXJlKCdnbHNsaWZ5Jyk7XG5cbi8vIFRPRE8gLSBhZG9wdCBnbHNsaWZ5XG5jb25zdCBTaGFkZXJzID0ge1xuICBWZXJ0ZXg6IHtcbiAgICBEZWZhdWx0OiBnbHNsaWZ5KCcuL2RlZmF1bHQtdmVydGV4JylcbiAgfSxcbiAgRnJhZ21lbnQ6IHtcbiAgICBEZWZhdWx0OiBnbHNsaWZ5KCcuL2RlZmF1bHQtZnJhZ21lbnQnKVxuICB9XG59O1xuXG5TaGFkZXJzLnZzID0gU2hhZGVycy5WZXJ0ZXguRGVmYXVsdDtcblNoYWRlcnMuZnMgPSBTaGFkZXJzLkZyYWdtZW50LkRlZmF1bHQ7XG5cbmV4cG9ydCBkZWZhdWx0IFNoYWRlcnM7XG5cbiIsIi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vKipcbiAqIFdyYXBzIHRoZSBhcmd1bWVudCBpbiBhbiBhcnJheSBpZiBpdCBpcyBub3Qgb25lLlxuICogQHBhcmFtIHtvYmplY3R9IGEgLSBUaGUgb2JqZWN0IHRvIHdyYXAuXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxhdChhKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGEpICYmIGEgfHwgW2FdO1xufVxuXG4vKipcbiogUHJvdmlkZXMgYSBzdGFuZGFyZCBub29wIGZ1bmN0aW9uLlxuKiovXG5leHBvcnQgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBfdWlkID0gRGF0ZS5ub3coKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgVUlELlxuICogQHJldHVybiB7bnVtYmVyfSB1aWRcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiB1aWQoKSB7XG4gIHJldHVybiBfdWlkKys7XG59XG5cbi8qKlxuICogTWVyZ2UgbXVsdGlwbGUgb2JqZWN0cyBpbnRvIG9uZS5cbiAqIEBwYXJhbSB7Li4ub2JqZWN0fSBvYmplY3RzIC0gVGhlIG9iamVjdHMgdG8gbWVyZ2UuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKG9iamVjdHMpIHtcbiAgY29uc3QgbWl4ID0ge307XG4gIGZvciAobGV0IGkgPSAwLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IG9iamVjdCA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAob2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUgIT09ICdPYmplY3QnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgY29uc3Qgb3AgPSBvYmplY3Rba2V5XTtcbiAgICAgIGNvbnN0IG1wID0gbWl4W2tleV07XG4gICAgICBpZiAobXAgJiYgb3AuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcgJiZcbiAgICAgICAgbXAuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpIHtcbiAgICAgICAgbWl4W2tleV0gPSBtZXJnZShtcCwgb3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWl4W2tleV0gPSBkZXRhY2gob3ApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWl4O1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBkdXBsaWNhdGluZyBhbiBvYmplY3QuXG4gKiBAcGFyYW0ge29iamVjdH0gZWxlbSAtIFRoZSBvYmplY3QgdG8gcmVjdXJzaXZlbHkgZHVwbGljYXRlLlxuICogQHJldHVybiB7b2JqZWN0fSBvYmplY3RcbiAqKi9cbmZ1bmN0aW9uIGRldGFjaChlbGVtKSB7XG4gIGNvbnN0IHQgPSBlbGVtLmNvbnN0cnVjdG9yLm5hbWU7XG4gIGxldCBhbnM7XG4gIGlmICh0ID09PSAnT2JqZWN0Jykge1xuICAgIGFucyA9IHt9O1xuICAgIGZvciAodmFyIHAgaW4gZWxlbSkge1xuICAgICAgYW5zW3BdID0gZGV0YWNoKGVsZW1bcF0pO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0ID09PSAnQXJyYXknKSB7XG4gICAgYW5zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbGVtLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgYW5zW2ldID0gZGV0YWNoKGVsZW1baV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhbnMgPSBlbGVtO1xuICB9XG5cbiAgcmV0dXJuIGFucztcbn1cblxuLy8gVFlQRUQgQVJSQVlTXG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVkQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLkJZVEVTX1BFUl9FTEVNRU5UO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVR5cGVkQXJyYXkoQXJyYXlUeXBlLCBzb3VyY2VBcnJheSkge1xuICBhc3NlcnQoQXJyYXkuaXNBcnJheShzb3VyY2VBcnJheSkpO1xuICBjb25zdCBhcnJheSA9IG5ldyBBcnJheVR5cGUoc291cmNlQXJyYXkubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VBcnJheS5sZW5ndGg7ICsraSkge1xuICAgIGFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuIiwiLy8gRW5jYXBzdWxhdGVzIGEgV2ViR0xCdWZmZXIgb2JqZWN0XG5cbmltcG9ydCB7Z2V0RXh0ZW5zaW9uLCBnbENoZWNrRXJyb3J9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1ZmZlciB7XG5cbiAgc3RhdGljIGdldERlZmF1bHRPcHRzKGdsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1ZmZlclR5cGU6IGdsLkFSUkFZX0JVRkZFUixcbiAgICAgIHNpemU6IDEsXG4gICAgICBkYXRhVHlwZTogZ2wuRkxPQVQsXG4gICAgICBzdHJpZGU6IDAsXG4gICAgICBvZmZzZXQ6IDAsXG4gICAgICBkcmF3TW9kZTogZ2wuU1RBVElDX0RSQVcsXG4gICAgICBpbnN0YW5jZWQ6IDBcbiAgICB9O1xuICB9XG5cbiAgLypcbiAgICogQGNsYXNzZGVzY1xuICAgKiBTZXQgdXAgYSBnbCBidWZmZXIgb25jZSBhbmQgcmVwZWF0ZWRseSBiaW5kIGFuZCB1bmJpbmQgaXQuXG4gICAqIEhvbGRzIGFuIGF0dHJpYnV0ZSBuYW1lIGFzIGEgY29udmVuaWVuY2UuLi5cbiAgICpcbiAgICogQHBhcmFte30gb3B0cy5kYXRhIC0gbmF0aXZlIGFycmF5XG4gICAqIEBwYXJhbXtzdHJpbmd9IG9wdHMuYXR0cmlidXRlIC0gbmFtZSBvZiBhdHRyaWJ1dGUgZm9yIG1hdGNoaW5nXG4gICAqIEBwYXJhbXt9IG9wdHMuYnVmZmVyVHlwZSAtIGJ1ZmZlciB0eXBlIChjYWxsZWQgXCJ0YXJnZXRcIiBpbiBHTCBkb2NzKVxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBhc3NlcnQoZ2wsICdCdWZmZXIgbmVlZHMgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgQnVmZmVyLmdldERlZmF1bHRPcHRzKGdsKSwgb3B0cyk7XG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHRvZG8gLSByZW1vdmVcbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRlbGV0ZSgpO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgdXBkYXRlKG9wdHMgPSB7fSkge1xuICAgIGFzc2VydChvcHRzLmRhdGEsICdCdWZmZXIgbmVlZHMgZGF0YSBhcmd1bWVudCcpO1xuICAgIHRoaXMuYXR0cmlidXRlID0gb3B0cy5hdHRyaWJ1dGUgfHwgdGhpcy5hdHRyaWJ1dGU7XG4gICAgdGhpcy5idWZmZXJUeXBlID0gb3B0cy5idWZmZXJUeXBlIHx8IHRoaXMuYnVmZmVyVHlwZTtcbiAgICB0aGlzLnNpemUgPSBvcHRzLnNpemUgfHwgdGhpcy5zaXplO1xuICAgIHRoaXMuZGF0YVR5cGUgPSBvcHRzLmRhdGFUeXBlIHx8IHRoaXMuZGF0YVR5cGU7XG4gICAgdGhpcy5zdHJpZGUgPSBvcHRzLnN0cmlkZSB8fCB0aGlzLnN0cmlkZTtcbiAgICB0aGlzLm9mZnNldCA9IG9wdHMub2Zmc2V0IHx8IHRoaXMub2Zmc2V0O1xuICAgIHRoaXMuZHJhd01vZGUgPSBvcHRzLmRyYXdNb2RlIHx8IHRoaXMuZHJhd01vZGU7XG4gICAgdGhpcy5pbnN0YW5jZWQgPSBvcHRzLmluc3RhbmNlZCB8fCB0aGlzLmluc3RhbmNlZDtcblxuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YSB8fCB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmJ1ZmZlckRhdGEodGhpcy5kYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiBVcGRhdGVzIGRhdGEgaW4gdGhlIGJ1ZmZlciAqL1xuICBidWZmZXJEYXRhKGRhdGEpIHtcbiAgICBhc3NlcnQoZGF0YSwgJ0J1ZmZlci5idWZmZXJEYXRhIG5lZWRzIGRhdGEnKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5idWZmZXJUeXBlLCB0aGlzLmRhdGEsIHRoaXMuZHJhd01vZGUpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIC8vIEJpbmQgdGhlIGJ1ZmZlciBzbyB0aGF0IHdlIGNhbiBvcGVyYXRlIG9uIGl0XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIEVuYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFNwZWNpZnkgYnVmZmVyIGZvcm1hdFxuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoXG4gICAgICBsb2NhdGlvbixcbiAgICAgIHRoaXMuc2l6ZSwgdGhpcy5kYXRhVHlwZSwgZmFsc2UsIHRoaXMuc3RyaWRlLCB0aGlzLm9mZnNldFxuICAgICk7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2VkKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZ2wsICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgICAvLyBUaGlzIG1ha2VzIGl0IGFuIGluc3RhbmNlZCBhdHRyaWJ1dGVcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gQ2xlYXIgaW5zdGFuY2VkIGZsYWdcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDApO1xuICAgIH1cbiAgICAvLyBEaXNhYmxlIHRoZSBhdHRyaWJ1dGVcbiAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFVuYmluZCB0aGUgYnVmZmVyIHBlciB3ZWJnbCByZWNvbW1lbmRhdGlvbnNcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiIsIi8vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCByZWxhdGVkIG1ldGhvZHNcbi8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCwgbm8tY29uc29sZSwgbm8tbG9vcC1mdW5jICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgY29uc29sZSAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBDaGVja3MgaWYgV2ViR0wgaXMgZW5hYmxlZCBhbmQgY3JlYXRlcyBhIGNvbnRleHQgZm9yIHVzaW5nIFdlYkdMLlxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdMQ29udGV4dChjYW52YXMsIG9wdCA9IHt9KSB7XG4gIGlmICghaXNCcm93c2VyQ29udGV4dCgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBjcmVhdGUgYSBXZWJHTCBjb250ZXh0IG91dHNpZGUgYSBicm93c2VyIGNvbnRleHQuYCk7XG4gIH1cbiAgY2FudmFzID0gdHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycgP1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcykgOiBjYW52YXM7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmdsY29udGV4dGNyZWF0aW9uZXJyb3InLCBlID0+IHtcbiAgICBjb25zb2xlLmxvZyhlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgfSwgZmFsc2UpO1xuXG4gIC8vIFByZWZlciB3ZWJnbDIgb3ZlciB3ZWJnbDEsIHByZWZlciBjb25mb3JtYW50IG92ZXIgZXhwZXJpbWVudGFsXG4gIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbDInLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBvcHQpO1xuXG4gIGFzc2VydChnbCwgJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG5cbiAgLy8gU2V0IGFzIGRlYnVnIGhhbmRsZXJcbiAgZ2wgPSBvcHQuZGVidWcgPyBjcmVhdGVEZWJ1Z0NvbnRleHQoZ2wpIDogZ2w7XG5cbiAgLy8gQWRkIGEgc2FmZSBnZXQgbWV0aG9kXG4gIGdsLmdldCA9IGZ1bmN0aW9uIGdsR2V0KG5hbWUpIHtcbiAgICBsZXQgdmFsdWUgPSBuYW1lO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICAgIGFzc2VydCh2YWx1ZSwgYEFjY2Vzc2luZyBnbC4ke25hbWV9YCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICByZXR1cm4gZ2w7XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1dlYkdMKCkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBGZWF0dXJlIHRlc3QgV2ViR0xcbiAgdHJ5IHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICByZXR1cm4gQm9vbGVhbih3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0ICYmXG4gICAgICAoY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpKSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNFeHRlbnNpb24obmFtZSkge1xuICBpZiAoIWhhc1dlYkdMKCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fFxuICAgIGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcbiAgLy8gU2hvdWxkIG1heWJlIGJlIHJldHVybiAhIWNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuICByZXR1cm4gY29udGV4dC5nZXRFeHRlbnNpb24obmFtZSk7XG59XG5cbi8vIFJldHVybnMgdGhlIGV4dGVuc2lvbiBvciB0aHJvd3MgYW4gZXJyb3JcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpIHtcbiAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpO1xuICBhc3NlcnQoZXh0ZW5zaW9uLCBgJHtleHRlbnNpb25OYW1lfSBub3Qgc3VwcG9ydGVkIWApO1xuICByZXR1cm4gZXh0ZW5zaW9uO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJDb250ZXh0KCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lQnVmZmVyfSwgZnVuYykge1xuICBsZXQgc2Npc3NvclRlc3RXYXNFbmFibGVkO1xuICBpZiAoc2Npc3NvclRlc3QpIHtcbiAgICBzY2lzc29yVGVzdFdhc0VuYWJsZWQgPSBnbC5pc0VuYWJsZWQoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBjb25zdCB7eCwgeSwgdywgaH0gPSBzY2lzc29yVGVzdDtcbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIHksIHcsIGgpO1xuICB9XG5cbiAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyIHdlIG5lZWQgdG8gcmVtZW1iZXI/XG4gICAgZnJhbWVCdWZmZXIuYmluZCgpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBmdW5jKGdsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIXNjaXNzb3JUZXN0V2FzRW5hYmxlZCkge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlcj9cbiAgICAgIC8vIFRPRE8gLSBkZWxlZ2F0ZSBcInVuYmluZFwiIHRvIEZyYW1lYnVmZmVyIG9iamVjdD9cbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbENoZWNrRXJyb3IoZ2wpIHtcbiAgLy8gRW5zdXJlIGFsbCBlcnJvcnMgYXJlIGNsZWFyZWRcbiAgbGV0IGVycm9yO1xuICBsZXQgZ2xFcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIHdoaWxlIChnbEVycm9yICE9PSBnbC5OT19FUlJPUikge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSk7XG4gICAgfVxuICAgIGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB9XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSB7XG4gIHN3aXRjaCAoZ2xFcnJvcikge1xuICBjYXNlIGdsLkNPTlRFWFRfTE9TVF9XRUJHTDpcbiAgICAvLyAgSWYgdGhlIFdlYkdMIGNvbnRleHQgaXMgbG9zdCwgdGhpcyBlcnJvciBpcyByZXR1cm5lZCBvbiB0aGVcbiAgICAvLyBmaXJzdCBjYWxsIHRvIGdldEVycm9yLiBBZnRlcndhcmRzIGFuZCB1bnRpbCB0aGUgY29udGV4dCBoYXMgYmVlblxuICAgIC8vIHJlc3RvcmVkLCBpdCByZXR1cm5zIGdsLk5PX0VSUk9SLlxuICAgIHJldHVybiAnV2ViR0wgY29udGV4dCBsb3N0JztcblxuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50JztcblxuICBjYXNlIGdsLklOVkFMSURfVkFMVUU6XG4gICAgLy8gQSBudW1lcmljIGFyZ3VtZW50IGlzIG91dCBvZiByYW5nZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgdmFsdWUnO1xuXG4gIGNhc2UgZ2wuSU5WQUxJRF9PUEVSQVRJT046XG4gICAgLy8gVGhlIHNwZWNpZmllZCBjb21tYW5kIGlzIG5vdCBhbGxvd2VkIGZvciB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLk9VVF9PRl9NRU1PUlk6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgb3V0IG9mIG1lbW9yeSc7XG5cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgcmV0dXJuICdXZWJHTCB1bmtub3duIGVycm9yJztcbiAgfVxufVxuXG4vLyBUT0RPIC0gZG9jdW1lbnQgb3IgcmVtb3ZlXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z0NvbnRleHQoY3R4KSB7XG4gIGNvbnN0IGdsID0ge307XG4gIGZvciAodmFyIG0gaW4gY3R4KSB7XG4gICAgdmFyIGYgPSBjdHhbbV07XG4gICAgaWYgKHR5cGVvZiBmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBnbFttXSA9ICgoaywgdikgPT4ge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBhbnM7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFucyA9IHYuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtrfSAke2V9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgICAgd2hpbGUgKChlcnJvciA9IGN0eC5nZXRFcnJvcigpKSAhPT0gY3R4Lk5PX0VSUk9SKSB7XG4gICAgICAgICAgICBlcnJvclN0YWNrLnB1c2goZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXJyb3JTdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yU3RhY2suam9pbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICB9O1xuICAgICAgfSkobSwgZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsW21dID0gZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2w7XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETyAtIGdlbmVyaWMgZHJhdyBjYWxsXG4vLyBPbmUgb2YgdGhlIGdvb2QgdGhpbmdzIGFib3V0IEdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5nc1xuaW1wb3J0IHtnZXRFeHRlbnNpb259IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge0dMX0lOREVYX1RZUEVTLCBHTF9EUkFXX01PREVTfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQSBnb29kIHRoaW5nIGFib3V0IHdlYkdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5ncyxcbi8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIGRhdGEgaXMgaW5kZXhlZCBhbmQvb3IgaW5zdGFuY2VkLlxuLy8gVGhpcyBmdW5jdGlvbiB1bmlmaWVzIHRob3NlIGludG8gYSBzaW5nbGUgY2FsbCB3aXRoIHNpbXBsZSBwYXJhbWV0ZXJzXG4vLyB0aGF0IGhhdmUgc2FuZSBkZWZhdWx0cy5cbmV4cG9ydCBmdW5jdGlvbiBkcmF3KGdsLCB7XG4gIGRyYXdNb2RlID0gbnVsbCwgdmVydGV4Q291bnQsIG9mZnNldCA9IDAsXG4gIGluZGV4ZWQsIGluZGV4VHlwZSA9IG51bGwsXG4gIGluc3RhbmNlZCA9IGZhbHNlLCBpbnN0YW5jZUNvdW50ID0gMFxufSkge1xuICBkcmF3TW9kZSA9IGRyYXdNb2RlID8gZ2wuZ2V0KGRyYXdNb2RlKSA6IGdsLlRSSUFOR0xFUztcbiAgaW5kZXhUeXBlID0gaW5kZXhUeXBlID8gZ2wuZ2V0KGluZGV4VHlwZSkgOiBnbC5VTlNJR05FRF9TSE9SVDtcblxuICBhc3NlcnQoR0xfRFJBV19NT0RFUyhnbCkuaW5kZXhPZihkcmF3TW9kZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICAvLyBUT0RPIC0gVXNlIHBvbHlmaWxsZWQgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCBpbnN0ZWFkIG9mIEFOR0xFIGV4dGVuc2lvblxuICBpZiAoaW5zdGFuY2VkKSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3RWxlbWVudHNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGluZGV4ZWQpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCk7XG4gIH1cbn1cbiIsIlxuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vdGV4dHVyZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZyYW1lYnVmZmVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGggPyBvcHRzLndpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0ID8gb3B0cy5oZWlnaHQgOiAxO1xuICAgIHRoaXMuZGVwdGggPSBvcHRzLmRlcHRoID09PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0cy5kZXB0aDtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG9wdHMubWluRmlsdGVyIHx8IGdsLk5FQVJFU1Q7XG4gICAgdGhpcy5tYWdGaWx0ZXIgPSBvcHRzLm1hZ0ZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQgfHwgZ2wuUkdCQTtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGUgfHwgZ2wuVU5TSUdORURfQllURTtcbiAgICB0aGlzLmZibyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgdGhpcy5iaW5kKCk7XG5cbiAgICB0aGlzLnRleHR1cmUgPSBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBtaW5GaWx0ZXI6IHRoaXMubWluRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiB0aGlzLm1hZ0ZpbHRlcixcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXRcbiAgICB9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlLnRleHR1cmUsIDBcbiAgICApO1xuXG4gICAgaWYgKHRoaXMuZGVwdGgpIHtcbiAgICAgIHRoaXMuZGVwdGggPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoXG4gICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0XG4gICAgICApO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoXG4gICAgICAgIGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIHRoaXMuZGVwdGhcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuICAgIGlmIChzdGF0dXMgIT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZyYW1lYnVmZmVyIGNyZWF0aW9uIGZhaWxlZC4nKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZibyk7XG4gIH1cblxufVxuIiwiLy8gQ29udGFpbnMgY2xhc3MgYW5kIGZ1bmN0aW9uIHdyYXBwZXJzIGFyb3VuZCBsb3cgbGV2ZWwgd2ViZ2wgb2JqZWN0c1xuLy8gVGhlc2UgY2xhc3NlcyBhcmUgaW50ZW5kZWQgdG8gc3RheSBjbG9zZSB0byB0aGUgV2ViR0wgQVBJIHNlbWFudGljc1xuLy8gYnV0IG1ha2UgaXQgZWFzaWVyIHRvIHVzZS5cbi8vIEhpZ2hlciBsZXZlbCBhYnN0cmFjdGlvbnMgY2FuIGJlIGJ1aWx0IG9uIHRoZXNlIGNsYXNzZXNcbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9jb250ZXh0JztcbmV4cG9ydCAqIGZyb20gJy4vZHJhdyc7XG5leHBvcnQge2RlZmF1bHQgYXMgQnVmZmVyfSBmcm9tICcuL2J1ZmZlcic7XG5leHBvcnQge2RlZmF1bHQgYXMgUHJvZ3JhbX0gZnJvbSAnLi9wcm9ncmFtJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBGcmFtZWJ1ZmZlcn0gZnJvbSAnLi9mYm8nO1xuZXhwb3J0IHtUZXh0dXJlMkQsIFRleHR1cmVDdWJlfSBmcm9tICcuL3RleHR1cmUnO1xuIiwiLy8gQ3JlYXRlcyBwcm9ncmFtcyBvdXQgb2Ygc2hhZGVycyBhbmQgcHJvdmlkZXMgY29udmVuaWVudCBtZXRob2RzIGZvciBsb2FkaW5nXG4vLyBidWZmZXJzIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGNvbnNvbGUgKi9cbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7VmVydGV4U2hhZGVyLCBGcmFnbWVudFNoYWRlcn0gZnJvbSAnLi9zaGFkZXInO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyYW0ge1xuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogSGFuZGxlcyBjcmVhdGlvbiBvZiBwcm9ncmFtcywgbWFwcGluZyBvZiBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gZ2wgY29udGV4dFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudnMgLSBWZXJ0ZXggc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5mcyAtIEZyYWdtZW50IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuaWQ9IC0gSWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzLCBmcywgaWQpIHtcbiAgICBhc3NlcnQoZ2wsICdQcm9ncmFtIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuXG4gICAgbGV0IHZzO1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUud2FybignREVQUkVDQVRFRDogTmV3IHVzZTogUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KScpO1xuICAgICAgdnMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cyA9IG9wdHMudnM7XG4gICAgICBmcyA9IG9wdHMuZnM7XG4gICAgICBpZCA9IG9wdHMuaWQ7XG4gICAgfVxuXG4gICAgdnMgPSB2cyB8fCBTaGFkZXJzLlZlcnRleC5EZWZhdWx0O1xuICAgIGZzID0gZnMgfHwgU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBWZXJ0ZXhTaGFkZXIoZ2wsIHZzKS5oYW5kbGUpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgRnJhZ21lbnRTaGFkZXIoZ2wsIGZzKS5oYW5kbGUpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGNvbnN0IGxpbmtlZCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgIGlmICghbGlua2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGxpbmtpbmcgJHtnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gcHJlcGFyZSB1bmlmb3JtIHNldHRlcnNcbiAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzID0gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIG5vIGF0dHJpYnV0ZXMgZW5hYmxlZCB5ZXRcbiAgICB0aGlzLmF0dHJpYnV0ZUVuYWJsZWQgPSB7fTtcbiAgfVxuXG4gIHVzZSgpIHtcbiAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmUodGV4dHVyZSwgaW5kZXgpIHtcbiAgICB0ZXh0dXJlLmJpbmQoaW5kZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybShuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXModW5pZm9ybU1hcCkpIHtcbiAgICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh1bmlmb3JtTWFwW25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1tidWZmZXIuYXR0cmlidXRlXTtcbiAgICBidWZmZXIuYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlci5hdHRyaWJ1dGVdO1xuICAgIGJ1ZmZlci5kZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy51bnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbi8vIFRPRE8gLSB1c2UgdGFibGVzIHRvIHJlZHVjZSBjb21wbGV4aXR5IG9mIG1ldGhvZCBiZWxvd1xuLy8gY29uc3QgZ2xVbmlmb3JtU2V0dGVyID0ge1xuLy8gICBGTE9BVDoge2Z1bmN0aW9uOiAndW5pZm9ybTFmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX1ZFQzM6IHtmdW5jdGlvbjogJ3VuaWZvcm0zZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBGTE9BVF9NQVQ0OiB7ZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4NGZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgSU5UOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBCT09MOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSXzJEOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSX0NVQkU6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX1cbi8vIH07XG5cbi8vIFJldHVybnMgYSBNYWdpYyBVbmlmb3JtIFNldHRlclxuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcihnbCwgZ2xQcm9ncmFtLCBpbmZvLCBpc0FycmF5KSB7XG4gIGNvbnN0IHtuYW1lLCB0eXBlfSA9IGluZm87XG4gIGNvbnN0IGxvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihnbFByb2dyYW0sIG5hbWUpO1xuXG4gIGxldCBtYXRyaXggPSBmYWxzZTtcbiAgbGV0IHZlY3RvciA9IHRydWU7XG4gIGxldCBnbEZ1bmN0aW9uO1xuICBsZXQgVHlwZWRBcnJheTtcblxuICBpZiAoaW5mby5zaXplID4gMSAmJiBpc0FycmF5KSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG5cbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuSU5UOlxuICAgIGNhc2UgZ2wuQk9PTDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfMkQ6XG4gICAgY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBVaW50MTZBcnJheTtcbiAgICAgIHZlY3RvciA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmlmb3JtOiBVbmtub3duIEdMU0wgdHlwZSAnICsgdHlwZSk7XG5cbiAgICB9XG4gIH1cblxuICBpZiAodmVjdG9yKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBnbC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVDogY2FzZSBnbC5CT09MOiBjYXNlIGdsLlNBTVBMRVJfMkQ6IGNhc2UgZ2wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzI6IGNhc2UgZ2wuQk9PTF9WRUMyOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0yaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMzogY2FzZSBnbC5CT09MX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUM0OiBjYXNlIGdsLkJPT0xfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGl2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMjpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDJmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMzpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDNmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBnbEZ1bmN0aW9uID0gZ2xGdW5jdGlvbi5iaW5kKGdsKTtcblxuICAvLyBTZXQgYSB1bmlmb3JtIGFycmF5XG4gIGlmIChpc0FycmF5ICYmIFR5cGVkQXJyYXkpIHtcblxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIG5ldyBUeXBlZEFycmF5KHZhbCkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9O1xuICB9IGVsc2UgaWYgKG1hdHJpeCkge1xuICAgIC8vIFNldCBhIG1hdHJpeCB1bmlmb3JtXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgZmFsc2UsIHZhbC50b0Zsb2F0MzJBcnJheSgpKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfTtcblxuICB9IGVsc2UgaWYgKFR5cGVkQXJyYXkpIHtcblxuICAgIC8vIFNldCBhIHZlY3Rvci90eXBlZCBhcnJheSB1bmlmb3JtXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBUeXBlZEFycmF5LnNldCh2YWwudG9GbG9hdDMyQXJyYXkgPyB2YWwudG9GbG9hdDMyQXJyYXkoKSA6IHZhbCk7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgVHlwZWRBcnJheSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH07XG5cbiAgfVxuICAvLyBTZXQgYSBwcmltaXRpdmUtdmFsdWVkIHVuaWZvcm1cbiAgcmV0dXJuIHZhbCA9PiB7XG4gICAgZ2xGdW5jdGlvbihsb2MsIHZhbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgfTtcblxufVxuXG4vLyBjcmVhdGUgdW5pZm9ybSBzZXR0ZXJzXG4vLyBNYXAgb2YgdW5pZm9ybSBuYW1lcyB0byBzZXR0ZXIgZnVuY3Rpb25zXG5mdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVycyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IHVuaWZvcm1TZXR0ZXJzID0ge307XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZVVuaWZvcm0oZ2xQcm9ncmFtLCBpKTtcbiAgICBsZXQgbmFtZSA9IGluZm8ubmFtZTtcbiAgICAvLyBpZiBhcnJheSBuYW1lIHRoZW4gY2xlYW4gdGhlIGFycmF5IGJyYWNrZXRzXG4gICAgbmFtZSA9IG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nID9cbiAgICAgIG5hbWUuc3Vic3RyKDAsIG5hbWUubGVuZ3RoIC0gMykgOiBuYW1lO1xuICAgIHVuaWZvcm1TZXR0ZXJzW25hbWVdID1cbiAgICAgIGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGdsUHJvZ3JhbSwgaW5mbywgaW5mby5uYW1lICE9PSBuYW1lKTtcbiAgfVxuICByZXR1cm4gdW5pZm9ybVNldHRlcnM7XG59XG5cbi8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChtYXBzIGF0dHJpYnV0ZSBuYW1lIHRvIGluZGV4KVxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlTG9jYXRpb25zKGdsLCBnbFByb2dyYW0pIHtcbiAgY29uc3QgbGVuZ3RoID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihnbFByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKTtcbiAgY29uc3QgYXR0cmlidXRlTG9jYXRpb25zID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbmZvID0gZ2wuZ2V0QWN0aXZlQXR0cmliKGdsUHJvZ3JhbSwgaSk7XG4gICAgY29uc3QgaW5kZXggPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihnbFByb2dyYW0sIGluZm8ubmFtZSk7XG4gICAgYXR0cmlidXRlTG9jYXRpb25zW2luZm8ubmFtZV0gPSBpbmRleDtcbiAgfVxuICByZXR1cm4gYXR0cmlidXRlTG9jYXRpb25zO1xufVxuIiwiaW1wb3J0IGZvcm1hdENvbXBpbGVyRXJyb3IgZnJvbSAnZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yJztcblxuLy8gRm9yIG5vdyB0aGlzIGlzIGFuIGludGVybmFsIGNsYXNzXG5leHBvcnQgY2xhc3MgU2hhZGVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuICAgIGlmICh0aGlzLmhhbmRsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBjcmVhdGluZyBzaGFkZXIgd2l0aCB0eXBlICR7c2hhZGVyVHlwZX1gKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKHRoaXMuaGFuZGxlLCBzaGFkZXJTb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgIHZhciBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcih0aGlzLmhhbmRsZSwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgIHZhciBpbmZvID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyh0aGlzLmhhbmRsZSk7XG4gICAgICBnbC5kZWxldGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB2YXIgZm9ybWF0dGVkTG9nO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9ybWF0dGVkTG9nID0gZm9ybWF0Q29tcGlsZXJFcnJvcihpbmZvLCBzaGFkZXJTb3VyY2UsIHNoYWRlclR5cGUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLndhcm4oJ0Vycm9yIGZvcm1hdHRpbmcgZ2xzbCBjb21waWxlciBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgc2hhZGVyICR7aW5mb31gKTtcbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0dGVkTG9nLmxvbmcpO1xuICAgIH1cbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBWZXJ0ZXhTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNoYWRlclNvdXJjZSwgZ2wuVkVSVEVYX1NIQURFUik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZyYWdtZW50U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIH1cbn1cbiIsImltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuXG5jbGFzcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMudGFyZ2V0ID0gZ2wuVEVYVFVSRV8yRDtcblxuICAgIG9wdHMgPSBtZXJnZSh7XG4gICAgICBmbGlwWTogdHJ1ZSxcbiAgICAgIGFsaWdubWVudDogMSxcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIG1pbkZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIHdyYXBTOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgd3JhcFQ6IGdsLkNMQU1QX1RPX0VER0UsXG4gICAgICBmb3JtYXQ6IGdsLlJHQkEsXG4gICAgICB0eXBlOiBnbC5VTlNJR05FRF9CWVRFLFxuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlXG4gICAgfSwgb3B0cyk7XG5cbiAgICB0aGlzLmZsaXBZID0gb3B0cy5mbGlwWTtcbiAgICB0aGlzLmFsaWdubWVudCA9IG9wdHMuYWxpZ25tZW50O1xuICAgIHRoaXMubWFnRmlsdGVyID0gb3B0cy5tYWdGaWx0ZXI7XG4gICAgdGhpcy5taW5GaWx0ZXIgPSBvcHRzLm1pbkZpbHRlcjtcbiAgICB0aGlzLndyYXBTID0gb3B0cy53cmFwUztcbiAgICB0aGlzLndyYXBUID0gb3B0cy53cmFwVDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0O1xuICAgIHRoaXMudHlwZSA9IG9wdHMudHlwZTtcbiAgICB0aGlzLmdlbmVyYXRlTWlwbWFwID0gb3B0cy5nZW5lcmF0ZU1pcG1hcDtcblxuICAgIGlmICh0aGlzLnR5cGUgPT09IGdsLkZMT0FUKSB7XG4gICAgICB0aGlzLmZsb2F0RXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9mbG9hdCcpO1xuICAgICAgaWYgKCF0aGlzLmZsb2F0RXh0ZW5zaW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT0VTX3RleHR1cmVfZmxvYXQgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgaWYgKCF0aGlzLnRleHR1cmUpIHtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuXG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlKTtcbiAgICB0aGlzLnRleHR1cmUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlMkQgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSAwO1xuICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICB0aGlzLmJvcmRlciA9IDA7XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgYmluZChpbmRleCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKSAtIGdsLlRFWFRVUkUwO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHVwZGF0ZShvcHRzKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQ7XG4gICAgdGhpcy5ib3JkZXIgPSBvcHRzLmJvcmRlciB8fCAwO1xuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YTtcbiAgICBpZiAodGhpcy5mbGlwWSkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsXG4gICAgICAgIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSxcbiAgICAgICAgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLm1pbkZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5tYWdGaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgdGhpcy53cmFwUyk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLndyYXBUKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmICh0aGlzLmdlbmVyYXRlTWlwbWFwKSB7XG4gICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZUN1YmUgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbWF4LWxlbiAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3Mueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cbiIsIi8vIEhlbHBlciBkZWZpbml0aW9ucyBmb3IgdmFsaWRhdGlvbiBvZiB3ZWJnbCBwYXJhbWV0ZXJzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1pbmxpbmUtY29tbWVudHMsIG1heC1sZW4gKi9cblxuLy8gVE9ETyAtIHJlbW92ZVxuZXhwb3J0IHtpc1R5cGVkQXJyYXksIG1ha2VUeXBlZEFycmF5fSBmcm9tICcuLi91dGlscyc7XG5cbi8vIElOREVYIFRZUEVTXG5cbi8vIEZvciBkcmF3RWxlbWVudHMsIHNpemUgb2YgaW5kaWNlc1xuZXhwb3J0IGNvbnN0IElOREVYX1RZUEVTID0gWydVTlNJR05FRF9CWVRFJywgJ1VOU0lHTkVEX1NIT1JUJ107XG5leHBvcnQgY29uc3QgR0xfSU5ERVhfVFlQRVMgPSBnbCA9PiBJTkRFWF9UWVBFUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhUeXBlKHR5cGUpIHtcbiAgcmV0dXJuIElOREVYX1RZUEVTLmluZGV4T2YodHlwZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xJbmRleFR5cGUoZ2xUeXBlKSB7XG4gIHJldHVybiBHTF9JTkRFWF9UWVBFUy5pbmRleE9mKGdsVHlwZSkgIT09IC0xO1xufVxuXG4vLyBEUkFXIE1PREVTXG5cbmV4cG9ydCBjb25zdCBEUkFXX01PREVTID0gW1xuICAnUE9JTlRTJywgJ0xJTkVfU1RSSVAnLCAnTElORV9MT09QJywgJ0xJTkVTJyxcbiAgJ1RSSUFOR0xFX1NUUklQJywgJ1RSSUFOR0xFX0ZBTicsICdUUklBTkdMRVMnXG5dO1xuZXhwb3J0IGNvbnN0IEdMX0RSQVdfTU9ERVMgPSBnbCA9PiBEUkFXX01PREVTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNEcmF3TW9kZShtb2RlKSB7XG4gIHJldHVybiBEUkFXX01PREVTLmluZGV4T2YobW9kZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xEcmF3TW9kZShnbE1vZGUpIHtcbiAgcmV0dXJuIEdMX0RSQVdfTU9ERVMuaW5kZXhPZihnbE1vZGUpICE9PSAtMTtcbn1cblxuLy8gVEFSR0VUIFRZUEVTXG5cbmV4cG9ydCBjb25zdCBUQVJHRVRTID0gW1xuICAnQVJSQVlfQlVGRkVSJywgLy8gdmVydGV4IGF0dHJpYnV0ZXMgKGUuZy4gdmVydGV4L3RleHR1cmUgY29vcmRzIG9yIGNvbG9yKVxuICAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLCAvLyBCdWZmZXIgdXNlZCBmb3IgZWxlbWVudCBpbmRpY2VzLlxuICAvLyBGb3IgV2ViR0wgMiBjb250ZXh0c1xuICAnQ09QWV9SRUFEX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgY29weWluZyBmcm9tIG9uZSBidWZmZXIgb2JqZWN0IHRvIGFub3RoZXJcbiAgJ0NPUFlfV1JJVEVfQlVGRkVSJywgLy8gQnVmZmVyIGZvciBjb3B5aW5nIGZyb20gb25lIGJ1ZmZlciBvYmplY3QgdG8gYW5vdGhlclxuICAnVFJBTlNGT1JNX0ZFRURCQUNLX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgdHJhbnNmb3JtIGZlZWRiYWNrIG9wZXJhdGlvbnNcbiAgJ1VOSUZPUk1fQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHN0b3JpbmcgdW5pZm9ybSBibG9ja3NcbiAgJ1BJWEVMX1BBQ0tfQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHBpeGVsIHRyYW5zZmVyIG9wZXJhdGlvbnNcbiAgJ1BJWEVMX1VOUEFDS19CVUZGRVInIC8vIEJ1ZmZlciB1c2VkIGZvciBwaXhlbCB0cmFuc2ZlciBvcGVyYXRpb25zXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfVEFSR0VUUyA9XG4gIGdsID0+IFRBUkdFVFMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSkuZmlsdGVyKGNvbnN0YW50ID0+IGNvbnN0YW50KTtcblxuLy8gVVNBR0UgVFlQRVNcblxuZXhwb3J0IGNvbnN0IEJVRkZFUl9VU0FHRSA9IFtcbiAgJ1NUQVRJQ19EUkFXJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ0RZTkFNSUNfRFJBVycsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ1NUUkVBTV9EUkFXJywgLy8gQnVmZmVyIG5vdCB1c2VkIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gIC8vIEZvciBXZWJHTCAyIGNvbnRleHRzXG4gICdTVEFUSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ0RZTkFNSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RSRUFNX1JFQUQnLCAvLyBDb250ZW50cyBvZiB0aGUgYnVmZmVyIGFyZSBsaWtlbHkgdG8gbm90IGJlIHVzZWQgb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RBVElDX0NPUFknLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnRFlOQU1JQ19DT1BZJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnU1RSRUFNX0NPUFknIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgbmVpdGhlciB3cml0dGVuIG9yIHJlYWQgYnkgdGhlIHVzZXIuXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfQlVGRkVSX1VTQUdFID1cbiAgZ2wgPT4gQlVGRkVSX1VTQUdFLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pLmZpbHRlcihjb25zdGFudCA9PiBjb25zdGFudCk7XG4iXX0=
