(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"pad-left":2}],2:[function(require,module,exports){
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
},{"repeat-string":16}],3:[function(require,module,exports){
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

},{"util/":19}],4:[function(require,module,exports){
module.exports = function _atob(str) {
  return atob(str)
}

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
var gl10 = require('./1.0/numbers')

module.exports = function lookupConstant (number) {
  return gl10[number]
}

},{"./1.0/numbers":6}],8:[function(require,module,exports){

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


},{"add-line-numbers":1,"gl-constants/lookup":7,"glsl-shader-name":9,"sprintf-js":17}],9:[function(require,module,exports){
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

},{"atob-lite":4,"glsl-tokenizer":14}],10:[function(require,module,exports){
module.exports = tokenize

var literals = require('./lib/literals')
  , operators = require('./lib/operators')
  , builtins = require('./lib/builtins')

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

function tokenize() {
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
      if(literals.indexOf(contentstr) > -1) {
        mode = KEYWORD
      } else if(builtins.indexOf(contentstr) > -1) {
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

},{"./lib/builtins":11,"./lib/literals":12,"./lib/operators":13}],11:[function(require,module,exports){
module.exports = [
    'gl_Position'
  , 'gl_PointSize'
  , 'gl_ClipVertex'
  , 'gl_FragCoord'
  , 'gl_FrontFacing'
  , 'gl_FragColor'
  , 'gl_FragData'
  , 'gl_FragDepth'
  , 'gl_Color'
  , 'gl_SecondaryColor'
  , 'gl_Normal'
  , 'gl_Vertex'
  , 'gl_MultiTexCoord0'
  , 'gl_MultiTexCoord1'
  , 'gl_MultiTexCoord2'
  , 'gl_MultiTexCoord3'
  , 'gl_MultiTexCoord4'
  , 'gl_MultiTexCoord5'
  , 'gl_MultiTexCoord6'
  , 'gl_MultiTexCoord7'
  , 'gl_FogCoord'
  , 'gl_MaxLights'
  , 'gl_MaxClipPlanes'
  , 'gl_MaxTextureUnits'
  , 'gl_MaxTextureCoords'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexUniformComponents'
  , 'gl_MaxVaryingFloats'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxFragmentUniformComponents'
  , 'gl_MaxDrawBuffers'
  , 'gl_ModelViewMatrix'
  , 'gl_ProjectionMatrix'
  , 'gl_ModelViewProjectionMatrix'
  , 'gl_TextureMatrix'
  , 'gl_NormalMatrix'
  , 'gl_ModelViewMatrixInverse'
  , 'gl_ProjectionMatrixInverse'
  , 'gl_ModelViewProjectionMatrixInverse'
  , 'gl_TextureMatrixInverse'
  , 'gl_ModelViewMatrixTranspose'
  , 'gl_ProjectionMatrixTranspose'
  , 'gl_ModelViewProjectionMatrixTranspose'
  , 'gl_TextureMatrixTranspose'
  , 'gl_ModelViewMatrixInverseTranspose'
  , 'gl_ProjectionMatrixInverseTranspose'
  , 'gl_ModelViewProjectionMatrixInverseTranspose'
  , 'gl_TextureMatrixInverseTranspose'
  , 'gl_NormalScale'
  , 'gl_DepthRangeParameters'
  , 'gl_DepthRange'
  , 'gl_ClipPlane'
  , 'gl_PointParameters'
  , 'gl_Point'
  , 'gl_MaterialParameters'
  , 'gl_FrontMaterial'
  , 'gl_BackMaterial'
  , 'gl_LightSourceParameters'
  , 'gl_LightSource'
  , 'gl_LightModelParameters'
  , 'gl_LightModel'
  , 'gl_LightModelProducts'
  , 'gl_FrontLightModelProduct'
  , 'gl_BackLightModelProduct'
  , 'gl_LightProducts'
  , 'gl_FrontLightProduct'
  , 'gl_BackLightProduct'
  , 'gl_FogParameters'
  , 'gl_Fog'
  , 'gl_TextureEnvColor'
  , 'gl_EyePlaneS'
  , 'gl_EyePlaneT'
  , 'gl_EyePlaneR'
  , 'gl_EyePlaneQ'
  , 'gl_ObjectPlaneS'
  , 'gl_ObjectPlaneT'
  , 'gl_ObjectPlaneR'
  , 'gl_ObjectPlaneQ'
  , 'gl_FrontColor'
  , 'gl_BackColor'
  , 'gl_FrontSecondaryColor'
  , 'gl_BackSecondaryColor'
  , 'gl_TexCoord'
  , 'gl_FogFragCoord'
  , 'gl_Color'
  , 'gl_SecondaryColor'
  , 'gl_TexCoord'
  , 'gl_FogFragCoord'
  , 'gl_PointCoord'
  , 'radians'
  , 'degrees'
  , 'sin'
  , 'cos'
  , 'tan'
  , 'asin'
  , 'acos'
  , 'atan'
  , 'pow'
  , 'exp'
  , 'log'
  , 'exp2'
  , 'log2'
  , 'sqrt'
  , 'inversesqrt'
  , 'abs'
  , 'sign'
  , 'floor'
  , 'ceil'
  , 'fract'
  , 'mod'
  , 'min'
  , 'max'
  , 'clamp'
  , 'mix'
  , 'step'
  , 'smoothstep'
  , 'length'
  , 'distance'
  , 'dot'
  , 'cross'
  , 'normalize'
  , 'faceforward'
  , 'reflect'
  , 'refract'
  , 'matrixCompMult'
  , 'lessThan'
  , 'lessThanEqual'
  , 'greaterThan'
  , 'greaterThanEqual'
  , 'equal'
  , 'notEqual'
  , 'any'
  , 'all'
  , 'not'
  , 'texture2D'
  , 'texture2DProj'
  , 'texture2DLod'
  , 'texture2DProjLod'
  , 'textureCube'
  , 'textureCubeLod'
  , 'dFdx'
  , 'dFdy'
]

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
var tokenize = require('./index')

module.exports = tokenizeString

function tokenizeString(str) {
  var generator = tokenize()
  var tokens = []

  tokens = tokens.concat(generator(str))
  tokens = tokens.concat(generator(null))

  return tokens
}

},{"./index":10}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

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

/**
 * Results cache
 */

var res = '';
var cache;

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],19:[function(require,module,exports){
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

},{"./support/isBuffer":18,"_process":5,"inherits":15}],20:[function(require,module,exports){
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

},{"../utils":26}],21:[function(require,module,exports){
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

},{"../io":24,"../shaders":25,"../utils":26,"../webgl/program":32}],22:[function(require,module,exports){
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

var _loop = function _loop(_key2) {
  if (_key2 === "default") return 'continue';
  Object.defineProperty(exports, _key2, {
    enumerable: true,
    get: function get() {
      return _helpers[_key2];
    }
  });
};

for (var _key2 in _helpers) {
  var _ret = _loop(_key2);

  if (_ret === 'continue') continue;
}

var _fx2 = _interopRequireDefault(_fx);

var _workers2 = _interopRequireDefault(_workers);

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global window */
if (typeof window !== 'undefined' && window.LumaGL) {
  window.LumaGL.addons = {
    Fx: _fx2.default,
    WorkerGroup: _workers2.default
  };
  Object.assign(window.LumaGL.addons, helpers);
}

},{"./fx":20,"./helpers":21,"./workers":23}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

      return function sendAsync() {
        return ref.apply(this, arguments);
      };
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

},{"./utils":26,"./webgl":31}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Default Shaders

// TODO - adopt glslify
var Shaders = {
  Vertex: {},
  Fragment: {}
};

Shaders.Vertex.Default = "\n#define LIGHT_MAX 4\n\n// object attributes\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec4 color;\nattribute vec4 pickingColor;\nattribute vec2 texCoord1;\n\n// camera and object matrices\nuniform mat4 viewMatrix;\nuniform mat4 viewInverseMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewProjectionMatrix;\n\n// objectMatrix * viewMatrix = worldMatrix\nuniform mat4 worldMatrix;\nuniform mat4 worldInverseMatrix;\nuniform mat4 worldInverseTransposeMatrix;\nuniform mat4 objectMatrix;\nuniform vec3 cameraPosition;\n\n// lighting configuration\nuniform bool enableLights;\nuniform vec3 ambientColor;\nuniform vec3 directionalColor;\nuniform vec3 lightingDirection;\n\n// point lights configuration\nuniform vec3 pointLocation[LIGHT_MAX];\nuniform vec3 pointColor[LIGHT_MAX];\nuniform int numberPoints;\n\n// reflection / refraction configuration\nuniform bool useReflection;\n\n// varyings\nvarying vec3 vReflection;\nvarying vec4 vColor;\nvarying vec4 vPickingColor;\nvarying vec2 vTexCoord;\nvarying vec4 vNormal;\nvarying vec3 lightWeighting;\n\nvoid main(void) {\n  vec4 mvPosition = worldMatrix * vec4(position, 1.0);\n  vec4 transformedNormal = worldInverseTransposeMatrix * vec4(normal, 1.0);\n\n  // lighting code\n  if(!enableLights) {\n    lightWeighting = vec3(1.0, 1.0, 1.0);\n  } else {\n    vec3 plightDirection;\n    vec3 pointWeight = vec3(0.0, 0.0, 0.0);\n    float directionalLightWeighting =\n      max(dot(transformedNormal.xyz, lightingDirection), 0.0);\n    for (int i = 0; i < LIGHT_MAX; i++) {\n      if (i < numberPoints) {\n        plightDirection = normalize(\n          (viewMatrix * vec4(pointLocation[i], 1.0)).xyz - mvPosition.xyz);\n         pointWeight += max(\n          dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor[i];\n       } else {\n         break;\n       }\n     }\n\n    lightWeighting = ambientColor +\n      (directionalColor * directionalLightWeighting) + pointWeight;\n  }\n\n  // refraction / reflection code\n  if (useReflection) {\n    vReflection =\n      (viewInverseMatrix[3] - (worldMatrix * vec4(position, 1.0))).xyz;\n  } else {\n    vReflection = vec3(1.0, 1.0, 1.0);\n  }\n\n  // pass results to varyings\n  vColor = color;\n  vPickingColor = pickingColor;\n  vTexCoord = texCoord1;\n  vNormal = transformedNormal;\n  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);\n}\n";

Shaders.Fragment.Default = "\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// varyings\nvarying vec4 vColor;\nvarying vec4 vPickingColor;\nvarying vec2 vTexCoord;\nvarying vec3 lightWeighting;\nvarying vec3 vReflection;\nvarying vec4 vNormal;\n\n// texture configs\nuniform bool hasTexture1;\nuniform sampler2D sampler1;\nuniform bool hasTextureCube1;\nuniform samplerCube samplerCube1;\n\n// picking configs\nuniform bool enablePicking;\nuniform bool hasPickingColors;\nuniform vec3 pickColor;\n\n// reflection / refraction configs\nuniform float reflection;\nuniform float refraction;\n\n// fog configuration\nuniform bool hasFog;\nuniform vec3 fogColor;\nuniform float fogNear;\nuniform float fogFar;\n\nvoid main(){\n  // set color from texture\n  if (!hasTexture1) {\n    gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);\n  } else {\n    gl_FragColor =\n      vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb *\n      lightWeighting, 1.0);\n  }\n\n  // has cube texture then apply reflection\n  if (hasTextureCube1) {\n    vec3 nReflection = normalize(vReflection);\n    vec3 reflectionValue;\n    if (refraction > 0.0) {\n     reflectionValue = refract(nReflection, vNormal.xyz, refraction);\n    } else {\n     reflectionValue = -reflect(nReflection, vNormal.xyz);\n    }\n\n    // TODO(nico): check whether this is right.\n    vec4 cubeColor = textureCube(samplerCube1,\n        vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));\n    gl_FragColor = vec4(mix(gl_FragColor.xyz, cubeColor.xyz, reflection), 1.0);\n  }\n\n  // set picking\n  if (enablePicking) {\n    if (hasPickingColors) {\n      gl_FragColor = vPickingColor;\n    } else {\n      gl_FragColor = vec4(pickColor, 1.0);\n    }\n  }\n\n  // handle fog\n  if (hasFog) {\n    float depth = gl_FragCoord.z / gl_FragCoord.w;\n    float fogFactor = smoothstep(fogNear, fogFar, depth);\n    gl_FragColor =\n      mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);\n   }\n }\n";

exports.default = Shaders;

},{}],26:[function(require,module,exports){
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
  var ans = undefined;
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

},{"assert":3}],27:[function(require,module,exports){
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

},{"./context":28,"assert":3}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGLContext = createGLContext;
exports.hasWebGL = hasWebGL;
exports.hasExtension = hasExtension;
exports.getExtension = getExtension;
exports.glContextWithState = glContextWithState;
exports.glCheckError2 = glCheckError2;
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

  var scissorTestWasEnabled = undefined;
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

function glCheckError2(gl) {
  glCheckError(gl);
}

function glCheckError(gl) {
  var error = gl.getError();
  switch (error) {
    case gl.NO_ERROR:
      //  No error has been recorded. The value of this constant is 0.
      return;

    case gl.CONTEXT_LOST_WEBGL:
      //  If the WebGL context is lost, this error is returned on the
      // first call to getError. Afterwards and until the context has been
      // restored, it returns gl.NO_ERROR.
      throw new Error('WebGL context lost');

    case gl.INVALID_ENUM:
      // An unacceptable value has been specified for an enumerated argument.
      throw new Error('WebGL invalid enumerated argument');

    case gl.INVALID_VALUE:
      // A numeric argument is out of range.
      throw new Error('WebGL invalid value');

    case gl.INVALID_OPERATION:
      // The specified command is not allowed for the current state.
      throw new Error('WebGL invalid operation');

    case gl.INVALID_FRAMEBUFFER_OPERATION:
      // The currently bound framebuffer is not framebuffer complete
      // when trying to render to or to read from it.
      throw new Error('WebGL invalid framebuffer operation');

    case gl.OUT_OF_MEMORY:
      // Not enough memory is left to execute the command.
      throw new Error('WebGL out of memory');

    default:
      // Not enough memory is left to execute the command.
      throw new Error('WebGL unknown error');
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
          var ans = undefined;
          try {
            ans = v.apply(ctx, _arguments);
          } catch (e) {
            throw new Error(k + ' ' + e);
          }
          var errorStack = [];
          var error = undefined;
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

},{"assert":3}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;
exports.draw2 = draw2;
exports.draw3 = draw3;

var _context = require('./context');

var _types = require('./types');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// A good thing about webGL is that there are so many ways to draw things...
// TODO - Use polyfilled WebGL2 methods instead of ANGLE extension
function draw(gl, _ref) {
  var drawMode = _ref.drawMode;
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

  drawMode = gl.get(drawMode);
  indexType = gl.get(indexType) || gl.UNSIGNED_SHORT;

  (0, _assert2.default)((0, _types.GL_DRAW_MODES)(gl).indexOf(drawMode) > -1, 'Invalid draw mode');
  (0, _assert2.default)((0, _types.GL_INDEX_TYPES)(gl).indexOf(indexType) > -1, 'Invalid index type');

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
}

// Call the proper draw function for the used program based on attributes etc
/* eslint-disable */
// TODO - generic draw call
// One of the good things about GL is that there are so many ways to draw things
function draw2(_ref2) {
  var gl = _ref2.gl;
  var drawMode = _ref2.drawMode;
  var elementType = _ref2.elementType;
  var count = _ref2.count;
  var indices = _ref2.indices;
  var vertices = _ref2.vertices;
  var instanced = _ref2.instanced;
  var numInstances = _ref2.numInstances;

  var numIndices = indices ? indices.value.length : 0;
  var numVertices = vertices ? vertices.value.length / 3 : 0;
  count = count || numIndices || numVertices;
  return draw({ gl: gl, drawMode: drawMode, elementType: elementType, count: count });
}

// Call the proper draw function for the used program based on attributes etc
function draw3(_ref3) {
  var gl = _ref3.gl;
  var drawMode = _ref3.drawMode;
  var indexType = _ref3.indexType;
  var numPoints = _ref3.numPoints;
  var numInstances = _ref3.numInstances;

  drawMode = drawMode || gl.POINTS;

  (0, _assert2.default)((0, _types.GL_DRAW_MODES)(gl).indexOf(indexType) > -1, 'Invalid draw mode');
  (0, _assert2.default)((0, _types.GL_INDEX_TYPES)(gl).indexOf(indexType) > -1, 'Invalid index type');

  if (numInstances) {
    // this instanced primitive does has indices, use drawElements extension
    var extension = (0, _context.getExtension)('ANGLE_instanced_arrays');
    extension.drawElementsInstancedANGLE(drawMode, numPoints, indexType, 0, numInstances);
  } else if (indices) {
    gl.drawElements(drawMode, numIndices, indexType, 0);
  } else if (numInstances !== undefined) {
    // this instanced primitive does not have indices, use drawArrays ext
    var extension = (0, _context.getExtension)('ANGLE_instanced_arrays');
    extension.drawArraysInstancedANGLE(drawMode, 0, numPoints, numInstances);
  } else {
    // else if this.primitive does not have indices
    gl.drawArrays(drawMode, 0, numPoints);
  }
}

},{"./context":28,"./types":35,"assert":3}],30:[function(require,module,exports){
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

},{"./texture":34}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _types = require('./types');

var _loop = function _loop(_key4) {
  if (_key4 === "default") return 'continue';
  Object.defineProperty(exports, _key4, {
    enumerable: true,
    get: function get() {
      return _types[_key4];
    }
  });
};

for (var _key4 in _types) {
  var _ret = _loop(_key4);

  if (_ret === 'continue') continue;
}

var _context = require('./context');

var _loop2 = function _loop2(_key5) {
  if (_key5 === "default") return 'continue';
  Object.defineProperty(exports, _key5, {
    enumerable: true,
    get: function get() {
      return _context[_key5];
    }
  });
};

for (var _key5 in _context) {
  var _ret2 = _loop2(_key5);

  if (_ret2 === 'continue') continue;
}

var _draw = require('./draw');

var _loop3 = function _loop3(_key6) {
  if (_key6 === "default") return 'continue';
  Object.defineProperty(exports, _key6, {
    enumerable: true,
    get: function get() {
      return _draw[_key6];
    }
  });
};

for (var _key6 in _draw) {
  var _ret3 = _loop3(_key6);

  if (_ret3 === 'continue') continue;
}

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

},{"./buffer":27,"./context":28,"./draw":29,"./fbo":30,"./program":32,"./texture":34,"./types":35}],32:[function(require,module,exports){
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

    var vs = undefined;
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
  var glFunction = undefined;
  var TypedArray = undefined;

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
      (0, _context.glCheckError2)(gl);
    };
  } else if (matrix) {
    // Set a matrix uniform
    return function (val) {
      glFunction(loc, false, val.toFloat32Array());
      (0, _context.glCheckError2)(gl);
    };
  } else if (TypedArray) {

    // Set a vector/typed array uniform
    return function (val) {
      TypedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, TypedArray);
      (0, _context.glCheckError2)(gl);
    };
  }
  // Set a primitive-valued uniform
  return function (val) {
    glFunction(loc, val);
    (0, _context.glCheckError2)(gl);
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

},{"../shaders":25,"../utils":26,"./context":28,"./shader":33,"assert":3}],33:[function(require,module,exports){
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

},{"gl-format-compiler-error":8}],34:[function(require,module,exports){
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

},{"../utils":26,"./context":28}],35:[function(require,module,exports){
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

},{"../utils":26}]},{},[22])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWRkLWxpbmUtbnVtYmVycy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hZGQtbGluZS1udW1iZXJzL25vZGVfbW9kdWxlcy9wYWQtbGVmdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2F0b2ItbGl0ZS9hdG9iLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dsLWNvbnN0YW50cy8xLjAvbnVtYmVycy5qcyIsIm5vZGVfbW9kdWxlcy9nbC1jb25zdGFudHMvbG9va3VwLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9idWlsdGlucy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvbGl0ZXJhbHMuanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL29wZXJhdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZXBlYXQtc3RyaW5nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NwcmludGYtanMvc3JjL3NwcmludGYuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvYWRkb25zL2Z4LmpzIiwic3JjL2FkZG9ucy9oZWxwZXJzLmpzIiwic3JjL2FkZG9ucy9pbmRleC5qcyIsInNyYy9hZGRvbnMvd29ya2Vycy5qcyIsInNyYy9pby5qcyIsInNyYy9zaGFkZXJzLmpzIiwic3JjL3V0aWxzLmpzIiwic3JjL3dlYmdsL2J1ZmZlci5qcyIsInNyYy93ZWJnbC9jb250ZXh0LmpzIiwic3JjL3dlYmdsL2RyYXcuanMiLCJzcmMvd2ViZ2wvZmJvLmpzIiwic3JjL3dlYmdsL2luZGV4LmpzIiwic3JjL3dlYmdsL3Byb2dyYW0uanMiLCJzcmMvd2ViZ2wvc2hhZGVyLmpzIiwic3JjL3dlYmdsL3RleHR1cmUuanMiLCJzcmMvd2ViZ2wvdHlwZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFaO0NBQXJCOztBQUV0QixTQUFTLFVBQVQsQ0FBb0IsSUFBcEIsRUFBMEI7QUFDL0IsU0FBTyxXQUFXLE9BQVgsQ0FBbUIsSUFBbkIsTUFBNkIsQ0FBQyxDQUFELENBREw7Q0FBMUI7QUFHQSxTQUFTLFlBQVQsQ0FBc0IsTUFBdEIsRUFBOEI7QUFDbkMsU0FBTyxjQUFjLE9BQWQsQ0FBc0IsTUFBdEIsTUFBa0MsQ0FBQyxDQUFELENBRE47Q0FBOUI7Ozs7QUFNQSxJQUFNLDRCQUFVLENBQ3JCLGNBRHFCO0FBRXJCLHNCQUZxQjs7QUFJckIsa0JBSnFCO0FBS3JCLG1CQUxxQjtBQU1yQiwyQkFOcUI7QUFPckIsZ0JBUHFCO0FBUXJCLG1CQVJxQjtBQVNyQjtBQVRxQixDQUFWOztBQVlOLElBQU0sa0NBQ1gsU0FEVyxVQUNYO1NBQU0sUUFBUSxHQUFSLENBQVk7V0FBWSxHQUFHLFFBQUg7R0FBWixDQUFaLENBQXNDLE1BQXRDLENBQTZDO1dBQVk7R0FBWjtDQUFuRDs7OztBQUlLLElBQU0sc0NBQWUsQ0FDMUIsYUFEMEI7QUFFMUIsY0FGMEI7QUFHMUIsYUFIMEI7O0FBSzFCLGFBTDBCO0FBTTFCLGNBTjBCO0FBTzFCLGFBUDBCO0FBUTFCLGFBUjBCO0FBUzFCLGNBVDBCO0FBVTFCO0FBVjBCLENBQWY7O0FBYU4sSUFBTSw0Q0FDWCxTQURXLGVBQ1g7U0FBTSxhQUFhLEdBQWIsQ0FBaUI7V0FBWSxHQUFHLFFBQUg7R0FBWixDQUFqQixDQUEyQyxNQUEzQyxDQUFrRDtXQUFZO0dBQVo7Q0FBeEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBhZExlZnQgPSByZXF1aXJlKCdwYWQtbGVmdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gYWRkTGluZU51bWJlcnNcbmZ1bmN0aW9uIGFkZExpbmVOdW1iZXJzIChzdHJpbmcsIHN0YXJ0LCBkZWxpbSkge1xuICBzdGFydCA9IHR5cGVvZiBzdGFydCA9PT0gJ251bWJlcicgPyBzdGFydCA6IDFcbiAgZGVsaW0gPSBkZWxpbSB8fCAnOiAnXG5cbiAgdmFyIGxpbmVzID0gc3RyaW5nLnNwbGl0KC9cXHI/XFxuLylcbiAgdmFyIHRvdGFsRGlnaXRzID0gU3RyaW5nKGxpbmVzLmxlbmd0aCArIHN0YXJ0IC0gMSkubGVuZ3RoXG4gIHJldHVybiBsaW5lcy5tYXAoZnVuY3Rpb24gKGxpbmUsIGkpIHtcbiAgICB2YXIgYyA9IGkgKyBzdGFydFxuICAgIHZhciBkaWdpdHMgPSBTdHJpbmcoYykubGVuZ3RoXG4gICAgdmFyIHByZWZpeCA9IHBhZExlZnQoYywgdG90YWxEaWdpdHMgLSBkaWdpdHMpXG4gICAgcmV0dXJuIHByZWZpeCArIGRlbGltICsgbGluZVxuICB9KS5qb2luKCdcXG4nKVxufVxuIiwiLyohXG4gKiBwYWQtbGVmdCA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvcGFkLWxlZnQ+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEpvbiBTY2hsaW5rZXJ0LlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHJlcGVhdCA9IHJlcXVpcmUoJ3JlcGVhdC1zdHJpbmcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYWRMZWZ0KHN0ciwgbnVtLCBjaCkge1xuICBjaCA9IHR5cGVvZiBjaCAhPT0gJ3VuZGVmaW5lZCcgPyAoY2ggKyAnJykgOiAnICc7XG4gIHJldHVybiByZXBlYXQoY2gsIG51bSkgKyBzdHI7XG59OyIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmICFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpLFxuICAgICAgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9hdG9iKHN0cikge1xuICByZXR1cm4gYXRvYihzdHIpXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAwOiAnTk9ORScsXG4gIDE6ICdPTkUnLFxuICAyOiAnTElORV9MT09QJyxcbiAgMzogJ0xJTkVfU1RSSVAnLFxuICA0OiAnVFJJQU5HTEVTJyxcbiAgNTogJ1RSSUFOR0xFX1NUUklQJyxcbiAgNjogJ1RSSUFOR0xFX0ZBTicsXG4gIDI1NjogJ0RFUFRIX0JVRkZFUl9CSVQnLFxuICA1MTI6ICdORVZFUicsXG4gIDUxMzogJ0xFU1MnLFxuICA1MTQ6ICdFUVVBTCcsXG4gIDUxNTogJ0xFUVVBTCcsXG4gIDUxNjogJ0dSRUFURVInLFxuICA1MTc6ICdOT1RFUVVBTCcsXG4gIDUxODogJ0dFUVVBTCcsXG4gIDUxOTogJ0FMV0FZUycsXG4gIDc2ODogJ1NSQ19DT0xPUicsXG4gIDc2OTogJ09ORV9NSU5VU19TUkNfQ09MT1InLFxuICA3NzA6ICdTUkNfQUxQSEEnLFxuICA3NzE6ICdPTkVfTUlOVVNfU1JDX0FMUEhBJyxcbiAgNzcyOiAnRFNUX0FMUEhBJyxcbiAgNzczOiAnT05FX01JTlVTX0RTVF9BTFBIQScsXG4gIDc3NDogJ0RTVF9DT0xPUicsXG4gIDc3NTogJ09ORV9NSU5VU19EU1RfQ09MT1InLFxuICA3NzY6ICdTUkNfQUxQSEFfU0FUVVJBVEUnLFxuICAxMDI0OiAnU1RFTkNJTF9CVUZGRVJfQklUJyxcbiAgMTAyODogJ0ZST05UJyxcbiAgMTAyOTogJ0JBQ0snLFxuICAxMDMyOiAnRlJPTlRfQU5EX0JBQ0snLFxuICAxMjgwOiAnSU5WQUxJRF9FTlVNJyxcbiAgMTI4MTogJ0lOVkFMSURfVkFMVUUnLFxuICAxMjgyOiAnSU5WQUxJRF9PUEVSQVRJT04nLFxuICAxMjg1OiAnT1VUX09GX01FTU9SWScsXG4gIDEyODY6ICdJTlZBTElEX0ZSQU1FQlVGRkVSX09QRVJBVElPTicsXG4gIDIzMDQ6ICdDVycsXG4gIDIzMDU6ICdDQ1cnLFxuICAyODQ5OiAnTElORV9XSURUSCcsXG4gIDI4ODQ6ICdDVUxMX0ZBQ0UnLFxuICAyODg1OiAnQ1VMTF9GQUNFX01PREUnLFxuICAyODg2OiAnRlJPTlRfRkFDRScsXG4gIDI5Mjg6ICdERVBUSF9SQU5HRScsXG4gIDI5Mjk6ICdERVBUSF9URVNUJyxcbiAgMjkzMDogJ0RFUFRIX1dSSVRFTUFTSycsXG4gIDI5MzE6ICdERVBUSF9DTEVBUl9WQUxVRScsXG4gIDI5MzI6ICdERVBUSF9GVU5DJyxcbiAgMjk2MDogJ1NURU5DSUxfVEVTVCcsXG4gIDI5NjE6ICdTVEVOQ0lMX0NMRUFSX1ZBTFVFJyxcbiAgMjk2MjogJ1NURU5DSUxfRlVOQycsXG4gIDI5NjM6ICdTVEVOQ0lMX1ZBTFVFX01BU0snLFxuICAyOTY0OiAnU1RFTkNJTF9GQUlMJyxcbiAgMjk2NTogJ1NURU5DSUxfUEFTU19ERVBUSF9GQUlMJyxcbiAgMjk2NjogJ1NURU5DSUxfUEFTU19ERVBUSF9QQVNTJyxcbiAgMjk2NzogJ1NURU5DSUxfUkVGJyxcbiAgMjk2ODogJ1NURU5DSUxfV1JJVEVNQVNLJyxcbiAgMjk3ODogJ1ZJRVdQT1JUJyxcbiAgMzAyNDogJ0RJVEhFUicsXG4gIDMwNDI6ICdCTEVORCcsXG4gIDMwODg6ICdTQ0lTU09SX0JPWCcsXG4gIDMwODk6ICdTQ0lTU09SX1RFU1QnLFxuICAzMTA2OiAnQ09MT1JfQ0xFQVJfVkFMVUUnLFxuICAzMTA3OiAnQ09MT1JfV1JJVEVNQVNLJyxcbiAgMzMxNzogJ1VOUEFDS19BTElHTk1FTlQnLFxuICAzMzMzOiAnUEFDS19BTElHTk1FTlQnLFxuICAzMzc5OiAnTUFYX1RFWFRVUkVfU0laRScsXG4gIDMzODY6ICdNQVhfVklFV1BPUlRfRElNUycsXG4gIDM0MDg6ICdTVUJQSVhFTF9CSVRTJyxcbiAgMzQxMDogJ1JFRF9CSVRTJyxcbiAgMzQxMTogJ0dSRUVOX0JJVFMnLFxuICAzNDEyOiAnQkxVRV9CSVRTJyxcbiAgMzQxMzogJ0FMUEhBX0JJVFMnLFxuICAzNDE0OiAnREVQVEhfQklUUycsXG4gIDM0MTU6ICdTVEVOQ0lMX0JJVFMnLFxuICAzNTUzOiAnVEVYVFVSRV8yRCcsXG4gIDQzNTI6ICdET05UX0NBUkUnLFxuICA0MzUzOiAnRkFTVEVTVCcsXG4gIDQzNTQ6ICdOSUNFU1QnLFxuICA1MTIwOiAnQllURScsXG4gIDUxMjE6ICdVTlNJR05FRF9CWVRFJyxcbiAgNTEyMjogJ1NIT1JUJyxcbiAgNTEyMzogJ1VOU0lHTkVEX1NIT1JUJyxcbiAgNTEyNDogJ0lOVCcsXG4gIDUxMjU6ICdVTlNJR05FRF9JTlQnLFxuICA1MTI2OiAnRkxPQVQnLFxuICA1Mzg2OiAnSU5WRVJUJyxcbiAgNTg5MDogJ1RFWFRVUkUnLFxuICA2NDAxOiAnU1RFTkNJTF9JTkRFWCcsXG4gIDY0MDI6ICdERVBUSF9DT01QT05FTlQnLFxuICA2NDA2OiAnQUxQSEEnLFxuICA2NDA3OiAnUkdCJyxcbiAgNjQwODogJ1JHQkEnLFxuICA2NDA5OiAnTFVNSU5BTkNFJyxcbiAgNjQxMDogJ0xVTUlOQU5DRV9BTFBIQScsXG4gIDc2ODA6ICdLRUVQJyxcbiAgNzY4MTogJ1JFUExBQ0UnLFxuICA3NjgyOiAnSU5DUicsXG4gIDc2ODM6ICdERUNSJyxcbiAgNzkzNjogJ1ZFTkRPUicsXG4gIDc5Mzc6ICdSRU5ERVJFUicsXG4gIDc5Mzg6ICdWRVJTSU9OJyxcbiAgOTcyODogJ05FQVJFU1QnLFxuICA5NzI5OiAnTElORUFSJyxcbiAgOTk4NDogJ05FQVJFU1RfTUlQTUFQX05FQVJFU1QnLFxuICA5OTg1OiAnTElORUFSX01JUE1BUF9ORUFSRVNUJyxcbiAgOTk4NjogJ05FQVJFU1RfTUlQTUFQX0xJTkVBUicsXG4gIDk5ODc6ICdMSU5FQVJfTUlQTUFQX0xJTkVBUicsXG4gIDEwMjQwOiAnVEVYVFVSRV9NQUdfRklMVEVSJyxcbiAgMTAyNDE6ICdURVhUVVJFX01JTl9GSUxURVInLFxuICAxMDI0MjogJ1RFWFRVUkVfV1JBUF9TJyxcbiAgMTAyNDM6ICdURVhUVVJFX1dSQVBfVCcsXG4gIDEwNDk3OiAnUkVQRUFUJyxcbiAgMTA3NTI6ICdQT0xZR09OX09GRlNFVF9VTklUUycsXG4gIDE2Mzg0OiAnQ09MT1JfQlVGRkVSX0JJVCcsXG4gIDMyNzY5OiAnQ09OU1RBTlRfQ09MT1InLFxuICAzMjc3MDogJ09ORV9NSU5VU19DT05TVEFOVF9DT0xPUicsXG4gIDMyNzcxOiAnQ09OU1RBTlRfQUxQSEEnLFxuICAzMjc3MjogJ09ORV9NSU5VU19DT05TVEFOVF9BTFBIQScsXG4gIDMyNzczOiAnQkxFTkRfQ09MT1InLFxuICAzMjc3NDogJ0ZVTkNfQUREJyxcbiAgMzI3Nzc6ICdCTEVORF9FUVVBVElPTl9SR0InLFxuICAzMjc3ODogJ0ZVTkNfU1VCVFJBQ1QnLFxuICAzMjc3OTogJ0ZVTkNfUkVWRVJTRV9TVUJUUkFDVCcsXG4gIDMyODE5OiAnVU5TSUdORURfU0hPUlRfNF80XzRfNCcsXG4gIDMyODIwOiAnVU5TSUdORURfU0hPUlRfNV81XzVfMScsXG4gIDMyODIzOiAnUE9MWUdPTl9PRkZTRVRfRklMTCcsXG4gIDMyODI0OiAnUE9MWUdPTl9PRkZTRVRfRkFDVE9SJyxcbiAgMzI4NTQ6ICdSR0JBNCcsXG4gIDMyODU1OiAnUkdCNV9BMScsXG4gIDMyODczOiAnVEVYVFVSRV9CSU5ESU5HXzJEJyxcbiAgMzI5MjY6ICdTQU1QTEVfQUxQSEFfVE9fQ09WRVJBR0UnLFxuICAzMjkyODogJ1NBTVBMRV9DT1ZFUkFHRScsXG4gIDMyOTM2OiAnU0FNUExFX0JVRkZFUlMnLFxuICAzMjkzNzogJ1NBTVBMRVMnLFxuICAzMjkzODogJ1NBTVBMRV9DT1ZFUkFHRV9WQUxVRScsXG4gIDMyOTM5OiAnU0FNUExFX0NPVkVSQUdFX0lOVkVSVCcsXG4gIDMyOTY4OiAnQkxFTkRfRFNUX1JHQicsXG4gIDMyOTY5OiAnQkxFTkRfU1JDX1JHQicsXG4gIDMyOTcwOiAnQkxFTkRfRFNUX0FMUEhBJyxcbiAgMzI5NzE6ICdCTEVORF9TUkNfQUxQSEEnLFxuICAzMzA3MTogJ0NMQU1QX1RPX0VER0UnLFxuICAzMzE3MDogJ0dFTkVSQVRFX01JUE1BUF9ISU5UJyxcbiAgMzMxODk6ICdERVBUSF9DT01QT05FTlQxNicsXG4gIDMzMzA2OiAnREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5UJyxcbiAgMzM2MzU6ICdVTlNJR05FRF9TSE9SVF81XzZfNScsXG4gIDMzNjQ4OiAnTUlSUk9SRURfUkVQRUFUJyxcbiAgMzM5MDE6ICdBTElBU0VEX1BPSU5UX1NJWkVfUkFOR0UnLFxuICAzMzkwMjogJ0FMSUFTRURfTElORV9XSURUSF9SQU5HRScsXG4gIDMzOTg0OiAnVEVYVFVSRTAnLFxuICAzMzk4NTogJ1RFWFRVUkUxJyxcbiAgMzM5ODY6ICdURVhUVVJFMicsXG4gIDMzOTg3OiAnVEVYVFVSRTMnLFxuICAzMzk4ODogJ1RFWFRVUkU0JyxcbiAgMzM5ODk6ICdURVhUVVJFNScsXG4gIDMzOTkwOiAnVEVYVFVSRTYnLFxuICAzMzk5MTogJ1RFWFRVUkU3JyxcbiAgMzM5OTI6ICdURVhUVVJFOCcsXG4gIDMzOTkzOiAnVEVYVFVSRTknLFxuICAzMzk5NDogJ1RFWFRVUkUxMCcsXG4gIDMzOTk1OiAnVEVYVFVSRTExJyxcbiAgMzM5OTY6ICdURVhUVVJFMTInLFxuICAzMzk5NzogJ1RFWFRVUkUxMycsXG4gIDMzOTk4OiAnVEVYVFVSRTE0JyxcbiAgMzM5OTk6ICdURVhUVVJFMTUnLFxuICAzNDAwMDogJ1RFWFRVUkUxNicsXG4gIDM0MDAxOiAnVEVYVFVSRTE3JyxcbiAgMzQwMDI6ICdURVhUVVJFMTgnLFxuICAzNDAwMzogJ1RFWFRVUkUxOScsXG4gIDM0MDA0OiAnVEVYVFVSRTIwJyxcbiAgMzQwMDU6ICdURVhUVVJFMjEnLFxuICAzNDAwNjogJ1RFWFRVUkUyMicsXG4gIDM0MDA3OiAnVEVYVFVSRTIzJyxcbiAgMzQwMDg6ICdURVhUVVJFMjQnLFxuICAzNDAwOTogJ1RFWFRVUkUyNScsXG4gIDM0MDEwOiAnVEVYVFVSRTI2JyxcbiAgMzQwMTE6ICdURVhUVVJFMjcnLFxuICAzNDAxMjogJ1RFWFRVUkUyOCcsXG4gIDM0MDEzOiAnVEVYVFVSRTI5JyxcbiAgMzQwMTQ6ICdURVhUVVJFMzAnLFxuICAzNDAxNTogJ1RFWFRVUkUzMScsXG4gIDM0MDE2OiAnQUNUSVZFX1RFWFRVUkUnLFxuICAzNDAyNDogJ01BWF9SRU5ERVJCVUZGRVJfU0laRScsXG4gIDM0MDQxOiAnREVQVEhfU1RFTkNJTCcsXG4gIDM0MDU1OiAnSU5DUl9XUkFQJyxcbiAgMzQwNTY6ICdERUNSX1dSQVAnLFxuICAzNDA2NzogJ1RFWFRVUkVfQ1VCRV9NQVAnLFxuICAzNDA2ODogJ1RFWFRVUkVfQklORElOR19DVUJFX01BUCcsXG4gIDM0MDY5OiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YJyxcbiAgMzQwNzA6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gnLFxuICAzNDA3MTogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWScsXG4gIDM0MDcyOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZJyxcbiAgMzQwNzM6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1onLFxuICAzNDA3NDogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWicsXG4gIDM0MDc2OiAnTUFYX0NVQkVfTUFQX1RFWFRVUkVfU0laRScsXG4gIDM0MzM4OiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9FTkFCTEVEJyxcbiAgMzQzMzk6ICdWRVJURVhfQVRUUklCX0FSUkFZX1NJWkUnLFxuICAzNDM0MDogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfU1RSSURFJyxcbiAgMzQzNDE6ICdWRVJURVhfQVRUUklCX0FSUkFZX1RZUEUnLFxuICAzNDM0MjogJ0NVUlJFTlRfVkVSVEVYX0FUVFJJQicsXG4gIDM0MzczOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9QT0lOVEVSJyxcbiAgMzQ0NjY6ICdOVU1fQ09NUFJFU1NFRF9URVhUVVJFX0ZPUk1BVFMnLFxuICAzNDQ2NzogJ0NPTVBSRVNTRURfVEVYVFVSRV9GT1JNQVRTJyxcbiAgMzQ2NjA6ICdCVUZGRVJfU0laRScsXG4gIDM0NjYxOiAnQlVGRkVSX1VTQUdFJyxcbiAgMzQ4MTY6ICdTVEVOQ0lMX0JBQ0tfRlVOQycsXG4gIDM0ODE3OiAnU1RFTkNJTF9CQUNLX0ZBSUwnLFxuICAzNDgxODogJ1NURU5DSUxfQkFDS19QQVNTX0RFUFRIX0ZBSUwnLFxuICAzNDgxOTogJ1NURU5DSUxfQkFDS19QQVNTX0RFUFRIX1BBU1MnLFxuICAzNDg3NzogJ0JMRU5EX0VRVUFUSU9OX0FMUEhBJyxcbiAgMzQ5MjE6ICdNQVhfVkVSVEVYX0FUVFJJQlMnLFxuICAzNDkyMjogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfTk9STUFMSVpFRCcsXG4gIDM0OTMwOiAnTUFYX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNDk2MjogJ0FSUkFZX0JVRkZFUicsXG4gIDM0OTYzOiAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLFxuICAzNDk2NDogJ0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzQ5NjU6ICdFTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzQ5NzU6ICdWRVJURVhfQVRUUklCX0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzUwNDA6ICdTVFJFQU1fRFJBVycsXG4gIDM1MDQ0OiAnU1RBVElDX0RSQVcnLFxuICAzNTA0ODogJ0RZTkFNSUNfRFJBVycsXG4gIDM1NjMyOiAnRlJBR01FTlRfU0hBREVSJyxcbiAgMzU2MzM6ICdWRVJURVhfU0hBREVSJyxcbiAgMzU2NjA6ICdNQVhfVkVSVEVYX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNTY2MTogJ01BWF9DT01CSU5FRF9URVhUVVJFX0lNQUdFX1VOSVRTJyxcbiAgMzU2NjM6ICdTSEFERVJfVFlQRScsXG4gIDM1NjY0OiAnRkxPQVRfVkVDMicsXG4gIDM1NjY1OiAnRkxPQVRfVkVDMycsXG4gIDM1NjY2OiAnRkxPQVRfVkVDNCcsXG4gIDM1NjY3OiAnSU5UX1ZFQzInLFxuICAzNTY2ODogJ0lOVF9WRUMzJyxcbiAgMzU2Njk6ICdJTlRfVkVDNCcsXG4gIDM1NjcwOiAnQk9PTCcsXG4gIDM1NjcxOiAnQk9PTF9WRUMyJyxcbiAgMzU2NzI6ICdCT09MX1ZFQzMnLFxuICAzNTY3MzogJ0JPT0xfVkVDNCcsXG4gIDM1Njc0OiAnRkxPQVRfTUFUMicsXG4gIDM1Njc1OiAnRkxPQVRfTUFUMycsXG4gIDM1Njc2OiAnRkxPQVRfTUFUNCcsXG4gIDM1Njc4OiAnU0FNUExFUl8yRCcsXG4gIDM1NjgwOiAnU0FNUExFUl9DVUJFJyxcbiAgMzU3MTI6ICdERUxFVEVfU1RBVFVTJyxcbiAgMzU3MTM6ICdDT01QSUxFX1NUQVRVUycsXG4gIDM1NzE0OiAnTElOS19TVEFUVVMnLFxuICAzNTcxNTogJ1ZBTElEQVRFX1NUQVRVUycsXG4gIDM1NzE2OiAnSU5GT19MT0dfTEVOR1RIJyxcbiAgMzU3MTc6ICdBVFRBQ0hFRF9TSEFERVJTJyxcbiAgMzU3MTg6ICdBQ1RJVkVfVU5JRk9STVMnLFxuICAzNTcxOTogJ0FDVElWRV9VTklGT1JNX01BWF9MRU5HVEgnLFxuICAzNTcyMDogJ1NIQURFUl9TT1VSQ0VfTEVOR1RIJyxcbiAgMzU3MjE6ICdBQ1RJVkVfQVRUUklCVVRFUycsXG4gIDM1NzIyOiAnQUNUSVZFX0FUVFJJQlVURV9NQVhfTEVOR1RIJyxcbiAgMzU3MjQ6ICdTSEFESU5HX0xBTkdVQUdFX1ZFUlNJT04nLFxuICAzNTcyNTogJ0NVUlJFTlRfUFJPR1JBTScsXG4gIDM2MDAzOiAnU1RFTkNJTF9CQUNLX1JFRicsXG4gIDM2MDA0OiAnU1RFTkNJTF9CQUNLX1ZBTFVFX01BU0snLFxuICAzNjAwNTogJ1NURU5DSUxfQkFDS19XUklURU1BU0snLFxuICAzNjAwNjogJ0ZSQU1FQlVGRkVSX0JJTkRJTkcnLFxuICAzNjAwNzogJ1JFTkRFUkJVRkZFUl9CSU5ESU5HJyxcbiAgMzYwNDg6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9UWVBFJyxcbiAgMzYwNDk6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9OQU1FJyxcbiAgMzYwNTA6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEVWRUwnLFxuICAzNjA1MTogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9DVUJFX01BUF9GQUNFJyxcbiAgMzYwNTM6ICdGUkFNRUJVRkZFUl9DT01QTEVURScsXG4gIDM2MDU0OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9BVFRBQ0hNRU5UJyxcbiAgMzYwNTU6ICdGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01JU1NJTkdfQVRUQUNITUVOVCcsXG4gIDM2MDU3OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9ESU1FTlNJT05TJyxcbiAgMzYwNjE6ICdGUkFNRUJVRkZFUl9VTlNVUFBPUlRFRCcsXG4gIDM2MDY0OiAnQ09MT1JfQVRUQUNITUVOVDAnLFxuICAzNjA5NjogJ0RFUFRIX0FUVEFDSE1FTlQnLFxuICAzNjEyODogJ1NURU5DSUxfQVRUQUNITUVOVCcsXG4gIDM2MTYwOiAnRlJBTUVCVUZGRVInLFxuICAzNjE2MTogJ1JFTkRFUkJVRkZFUicsXG4gIDM2MTYyOiAnUkVOREVSQlVGRkVSX1dJRFRIJyxcbiAgMzYxNjM6ICdSRU5ERVJCVUZGRVJfSEVJR0hUJyxcbiAgMzYxNjQ6ICdSRU5ERVJCVUZGRVJfSU5URVJOQUxfRk9STUFUJyxcbiAgMzYxNjg6ICdTVEVOQ0lMX0lOREVYOCcsXG4gIDM2MTc2OiAnUkVOREVSQlVGRkVSX1JFRF9TSVpFJyxcbiAgMzYxNzc6ICdSRU5ERVJCVUZGRVJfR1JFRU5fU0laRScsXG4gIDM2MTc4OiAnUkVOREVSQlVGRkVSX0JMVUVfU0laRScsXG4gIDM2MTc5OiAnUkVOREVSQlVGRkVSX0FMUEhBX1NJWkUnLFxuICAzNjE4MDogJ1JFTkRFUkJVRkZFUl9ERVBUSF9TSVpFJyxcbiAgMzYxODE6ICdSRU5ERVJCVUZGRVJfU1RFTkNJTF9TSVpFJyxcbiAgMzYxOTQ6ICdSR0I1NjUnLFxuICAzNjMzNjogJ0xPV19GTE9BVCcsXG4gIDM2MzM3OiAnTUVESVVNX0ZMT0FUJyxcbiAgMzYzMzg6ICdISUdIX0ZMT0FUJyxcbiAgMzYzMzk6ICdMT1dfSU5UJyxcbiAgMzYzNDA6ICdNRURJVU1fSU5UJyxcbiAgMzYzNDE6ICdISUdIX0lOVCcsXG4gIDM2MzQ2OiAnU0hBREVSX0NPTVBJTEVSJyxcbiAgMzYzNDc6ICdNQVhfVkVSVEVYX1VOSUZPUk1fVkVDVE9SUycsXG4gIDM2MzQ4OiAnTUFYX1ZBUllJTkdfVkVDVE9SUycsXG4gIDM2MzQ5OiAnTUFYX0ZSQUdNRU5UX1VOSUZPUk1fVkVDVE9SUycsXG4gIDM3NDQwOiAnVU5QQUNLX0ZMSVBfWV9XRUJHTCcsXG4gIDM3NDQxOiAnVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMJyxcbiAgMzc0NDI6ICdDT05URVhUX0xPU1RfV0VCR0wnLFxuICAzNzQ0MzogJ1VOUEFDS19DT0xPUlNQQUNFX0NPTlZFUlNJT05fV0VCR0wnLFxuICAzNzQ0NDogJ0JST1dTRVJfREVGQVVMVF9XRUJHTCdcbn1cbiIsInZhciBnbDEwID0gcmVxdWlyZSgnLi8xLjAvbnVtYmVycycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbG9va3VwQ29uc3RhbnQgKG51bWJlcikge1xuICByZXR1cm4gZ2wxMFtudW1iZXJdXG59XG4iLCJcbnZhciBzcHJpbnRmID0gcmVxdWlyZSgnc3ByaW50Zi1qcycpLnNwcmludGY7XG52YXIgZ2xDb25zdGFudHMgPSByZXF1aXJlKCdnbC1jb25zdGFudHMvbG9va3VwJyk7XG52YXIgc2hhZGVyTmFtZSA9IHJlcXVpcmUoJ2dsc2wtc2hhZGVyLW5hbWUnKTtcbnZhciBhZGRMaW5lTnVtYmVycyA9IHJlcXVpcmUoJ2FkZC1saW5lLW51bWJlcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmb3JtYXRDb21waWxlckVycm9yO1xuXG5mdW5jdGlvbiBmb3JtYXRDb21waWxlckVycm9yKGVyckxvZywgc3JjLCB0eXBlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbmFtZSA9IHNoYWRlck5hbWUoc3JjKSB8fCAnb2YgdW5rbm93biBuYW1lIChzZWUgbnBtIGdsc2wtc2hhZGVyLW5hbWUpJztcblxuICAgIHZhciB0eXBlTmFtZSA9ICd1bmtub3duIHR5cGUnO1xuICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHlwZU5hbWUgPSB0eXBlID09PSBnbENvbnN0YW50cy5GUkFHTUVOVF9TSEFERVIgPyAnZnJhZ21lbnQnIDogJ3ZlcnRleCdcbiAgICB9XG5cbiAgICB2YXIgbG9uZ0Zvcm0gPSBzcHJpbnRmKCdFcnJvciBjb21waWxpbmcgJXMgc2hhZGVyICVzOlxcbicsIHR5cGVOYW1lLCBuYW1lKTtcbiAgICB2YXIgc2hvcnRGb3JtID0gc3ByaW50ZihcIiVzJXNcIiwgbG9uZ0Zvcm0sIGVyckxvZyk7XG5cbiAgICB2YXIgZXJyb3JTdHJpbmdzID0gZXJyTG9nLnNwbGl0KCdcXG4nKTtcbiAgICB2YXIgZXJyb3JzID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVycm9yU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZXJyb3JTdHJpbmcgPSBlcnJvclN0cmluZ3NbaV07XG4gICAgICAgIGlmIChlcnJvclN0cmluZyA9PT0gJycpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgbGluZU5vID0gcGFyc2VJbnQoZXJyb3JTdHJpbmcuc3BsaXQoJzonKVsyXSk7XG4gICAgICAgIGlmIChpc05hTihsaW5lTm8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZignQ291bGQgbm90IHBhcnNlIGVycm9yOiAlcycsIGVycm9yU3RyaW5nKSk7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzW2xpbmVOb10gPSBlcnJvclN0cmluZztcbiAgICB9XG5cbiAgICB2YXIgbGluZXMgPSBhZGRMaW5lTnVtYmVycyhzcmMpLnNwbGl0KCdcXG4nKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFlcnJvcnNbaSszXSAmJiAhZXJyb3JzW2krMl0gJiYgIWVycm9yc1tpKzFdKSBjb250aW51ZTtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcbiAgICAgICAgbG9uZ0Zvcm0gKz0gbGluZSArICdcXG4nO1xuICAgICAgICBpZiAoZXJyb3JzW2krMV0pIHtcbiAgICAgICAgICAgIHZhciBlID0gZXJyb3JzW2krMV07XG4gICAgICAgICAgICBlID0gZS5zdWJzdHIoZS5zcGxpdCgnOicsIDMpLmpvaW4oJzonKS5sZW5ndGggKyAxKS50cmltKCk7XG4gICAgICAgICAgICBsb25nRm9ybSArPSBzcHJpbnRmKCdeXl4gJXNcXG5cXG4nLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvbmc6IGxvbmdGb3JtLnRyaW0oKSxcbiAgICAgICAgc2hvcnQ6IHNob3J0Rm9ybS50cmltKClcbiAgICB9O1xufVxuXG4iLCJ2YXIgdG9rZW5pemUgPSByZXF1aXJlKCdnbHNsLXRva2VuaXplcicpXG52YXIgYXRvYiAgICAgPSByZXF1aXJlKCdhdG9iLWxpdGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldE5hbWVcblxuZnVuY3Rpb24gZ2V0TmFtZShzcmMpIHtcbiAgdmFyIHRva2VucyA9IEFycmF5LmlzQXJyYXkoc3JjKVxuICAgID8gc3JjXG4gICAgOiB0b2tlbml6ZShzcmMpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBpZiAodG9rZW4udHlwZSAhPT0gJ3ByZXByb2Nlc3NvcicpIGNvbnRpbnVlXG4gICAgdmFyIG1hdGNoID0gdG9rZW4uZGF0YS5tYXRjaCgvXFwjZGVmaW5lXFxzK1NIQURFUl9OQU1FKF9CNjQpP1xccysoLispJC8pXG4gICAgaWYgKCFtYXRjaCkgY29udGludWVcbiAgICBpZiAoIW1hdGNoWzJdKSBjb250aW51ZVxuXG4gICAgdmFyIGI2NCAgPSBtYXRjaFsxXVxuICAgIHZhciBuYW1lID0gbWF0Y2hbMl1cblxuICAgIHJldHVybiAoYjY0ID8gYXRvYihuYW1lKSA6IG5hbWUpLnRyaW0oKVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRva2VuaXplXG5cbnZhciBsaXRlcmFscyA9IHJlcXVpcmUoJy4vbGliL2xpdGVyYWxzJylcbiAgLCBvcGVyYXRvcnMgPSByZXF1aXJlKCcuL2xpYi9vcGVyYXRvcnMnKVxuICAsIGJ1aWx0aW5zID0gcmVxdWlyZSgnLi9saWIvYnVpbHRpbnMnKVxuXG52YXIgTk9STUFMID0gOTk5ICAgICAgICAgIC8vIDwtLSBuZXZlciBlbWl0dGVkXG4gICwgVE9LRU4gPSA5OTk5ICAgICAgICAgIC8vIDwtLSBuZXZlciBlbWl0dGVkXG4gICwgQkxPQ0tfQ09NTUVOVCA9IDBcbiAgLCBMSU5FX0NPTU1FTlQgPSAxXG4gICwgUFJFUFJPQ0VTU09SID0gMlxuICAsIE9QRVJBVE9SID0gM1xuICAsIElOVEVHRVIgPSA0XG4gICwgRkxPQVQgPSA1XG4gICwgSURFTlQgPSA2XG4gICwgQlVJTFRJTiA9IDdcbiAgLCBLRVlXT1JEID0gOFxuICAsIFdISVRFU1BBQ0UgPSA5XG4gICwgRU9GID0gMTBcbiAgLCBIRVggPSAxMVxuXG52YXIgbWFwID0gW1xuICAgICdibG9jay1jb21tZW50J1xuICAsICdsaW5lLWNvbW1lbnQnXG4gICwgJ3ByZXByb2Nlc3NvcidcbiAgLCAnb3BlcmF0b3InXG4gICwgJ2ludGVnZXInXG4gICwgJ2Zsb2F0J1xuICAsICdpZGVudCdcbiAgLCAnYnVpbHRpbidcbiAgLCAna2V5d29yZCdcbiAgLCAnd2hpdGVzcGFjZSdcbiAgLCAnZW9mJ1xuICAsICdpbnRlZ2VyJ1xuXVxuXG5mdW5jdGlvbiB0b2tlbml6ZSgpIHtcbiAgdmFyIGkgPSAwXG4gICAgLCB0b3RhbCA9IDBcbiAgICAsIG1vZGUgPSBOT1JNQUxcbiAgICAsIGNcbiAgICAsIGxhc3RcbiAgICAsIGNvbnRlbnQgPSBbXVxuICAgICwgdG9rZW5zID0gW11cbiAgICAsIHRva2VuX2lkeCA9IDBcbiAgICAsIHRva2VuX29mZnMgPSAwXG4gICAgLCBsaW5lID0gMVxuICAgICwgY29sID0gMFxuICAgICwgc3RhcnQgPSAwXG4gICAgLCBpc251bSA9IGZhbHNlXG4gICAgLCBpc29wZXJhdG9yID0gZmFsc2VcbiAgICAsIGlucHV0ID0gJydcbiAgICAsIGxlblxuXG4gIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgdG9rZW5zID0gW11cbiAgICBpZiAoZGF0YSAhPT0gbnVsbCkgcmV0dXJuIHdyaXRlKGRhdGEpXG4gICAgcmV0dXJuIGVuZCgpXG4gIH1cblxuICBmdW5jdGlvbiB0b2tlbihkYXRhKSB7XG4gICAgaWYgKGRhdGEubGVuZ3RoKSB7XG4gICAgICB0b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6IG1hcFttb2RlXVxuICAgICAgLCBkYXRhOiBkYXRhXG4gICAgICAsIHBvc2l0aW9uOiBzdGFydFxuICAgICAgLCBsaW5lOiBsaW5lXG4gICAgICAsIGNvbHVtbjogY29sXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlKGNodW5rKSB7XG4gICAgaSA9IDBcbiAgICBpbnB1dCArPSBjaHVua1xuICAgIGxlbiA9IGlucHV0Lmxlbmd0aFxuXG4gICAgdmFyIGxhc3RcblxuICAgIHdoaWxlKGMgPSBpbnB1dFtpXSwgaSA8IGxlbikge1xuICAgICAgbGFzdCA9IGlcblxuICAgICAgc3dpdGNoKG1vZGUpIHtcbiAgICAgICAgY2FzZSBCTE9DS19DT01NRU5UOiBpID0gYmxvY2tfY29tbWVudCgpOyBicmVha1xuICAgICAgICBjYXNlIExJTkVfQ09NTUVOVDogaSA9IGxpbmVfY29tbWVudCgpOyBicmVha1xuICAgICAgICBjYXNlIFBSRVBST0NFU1NPUjogaSA9IHByZXByb2Nlc3NvcigpOyBicmVha1xuICAgICAgICBjYXNlIE9QRVJBVE9SOiBpID0gb3BlcmF0b3IoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBJTlRFR0VSOiBpID0gaW50ZWdlcigpOyBicmVha1xuICAgICAgICBjYXNlIEhFWDogaSA9IGhleCgpOyBicmVha1xuICAgICAgICBjYXNlIEZMT0FUOiBpID0gZGVjaW1hbCgpOyBicmVha1xuICAgICAgICBjYXNlIFRPS0VOOiBpID0gcmVhZHRva2VuKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgV0hJVEVTUEFDRTogaSA9IHdoaXRlc3BhY2UoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBOT1JNQUw6IGkgPSBub3JtYWwoKTsgYnJlYWtcbiAgICAgIH1cblxuICAgICAgaWYobGFzdCAhPT0gaSkge1xuICAgICAgICBzd2l0Y2goaW5wdXRbbGFzdF0pIHtcbiAgICAgICAgICBjYXNlICdcXG4nOiBjb2wgPSAwOyArK2xpbmU7IGJyZWFrXG4gICAgICAgICAgZGVmYXVsdDogKytjb2w7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b3RhbCArPSBpXG4gICAgaW5wdXQgPSBpbnB1dC5zbGljZShpKVxuICAgIHJldHVybiB0b2tlbnNcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZChjaHVuaykge1xuICAgIGlmKGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgIH1cblxuICAgIG1vZGUgPSBFT0ZcbiAgICB0b2tlbignKGVvZiknKVxuICAgIHJldHVybiB0b2tlbnNcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbCgpIHtcbiAgICBjb250ZW50ID0gY29udGVudC5sZW5ndGggPyBbXSA6IGNvbnRlbnRcblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnKicpIHtcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpIC0gMVxuICAgICAgbW9kZSA9IEJMT0NLX0NPTU1FTlRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJy8nKSB7XG4gICAgICBzdGFydCA9IHRvdGFsICsgaSAtIDFcbiAgICAgIG1vZGUgPSBMSU5FX0NPTU1FTlRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihjID09PSAnIycpIHtcbiAgICAgIG1vZGUgPSBQUkVQUk9DRVNTT1JcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKC9cXHMvLnRlc3QoYykpIHtcbiAgICAgIG1vZGUgPSBXSElURVNQQUNFXG4gICAgICBzdGFydCA9IHRvdGFsICsgaVxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpc251bSA9IC9cXGQvLnRlc3QoYylcbiAgICBpc29wZXJhdG9yID0gL1teXFx3X10vLnRlc3QoYylcblxuICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgbW9kZSA9IGlzbnVtID8gSU5URUdFUiA6IGlzb3BlcmF0b3IgPyBPUEVSQVRPUiA6IFRPS0VOXG4gICAgcmV0dXJuIGlcbiAgfVxuXG4gIGZ1bmN0aW9uIHdoaXRlc3BhY2UoKSB7XG4gICAgaWYoL1teXFxzXS9nLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gcHJlcHJvY2Vzc29yKCkge1xuICAgIGlmKGMgPT09ICdcXG4nICYmIGxhc3QgIT09ICdcXFxcJykge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBsaW5lX2NvbW1lbnQoKSB7XG4gICAgcmV0dXJuIHByZXByb2Nlc3NvcigpXG4gIH1cblxuICBmdW5jdGlvbiBibG9ja19jb21tZW50KCkge1xuICAgIGlmKGMgPT09ICcvJyAmJiBsYXN0ID09PSAnKicpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBvcGVyYXRvcigpIHtcbiAgICBpZihsYXN0ID09PSAnLicgJiYgL1xcZC8udGVzdChjKSkge1xuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnKicpIHtcbiAgICAgIG1vZGUgPSBCTE9DS19DT01NRU5UXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnLycpIHtcbiAgICAgIG1vZGUgPSBMSU5FX0NPTU1FTlRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJy4nICYmIGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuXG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJzsnIHx8IGMgPT09ICcpJyB8fCBjID09PSAnKCcpIHtcbiAgICAgIGlmKGNvbnRlbnQubGVuZ3RoKSB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuICAgICAgdG9rZW4oYylcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIHZhciBpc19jb21wb3NpdGVfb3BlcmF0b3IgPSBjb250ZW50Lmxlbmd0aCA9PT0gMiAmJiBjICE9PSAnPSdcbiAgICBpZigvW1xcd19cXGRcXHNdLy50ZXN0KGMpIHx8IGlzX2NvbXBvc2l0ZV9vcGVyYXRvcikge1xuICAgICAgd2hpbGUoZGV0ZXJtaW5lX29wZXJhdG9yKGNvbnRlbnQpKTtcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGRldGVybWluZV9vcGVyYXRvcihidWYpIHtcbiAgICB2YXIgaiA9IDBcbiAgICAgICwgaWR4XG4gICAgICAsIHJlc1xuXG4gICAgZG8ge1xuICAgICAgaWR4ID0gb3BlcmF0b3JzLmluZGV4T2YoYnVmLnNsaWNlKDAsIGJ1Zi5sZW5ndGggKyBqKS5qb2luKCcnKSlcbiAgICAgIHJlcyA9IG9wZXJhdG9yc1tpZHhdXG5cbiAgICAgIGlmKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgaWYoai0tICsgYnVmLmxlbmd0aCA+IDApIGNvbnRpbnVlXG4gICAgICAgIHJlcyA9IGJ1Zi5zbGljZSgwLCAxKS5qb2luKCcnKVxuICAgICAgfVxuXG4gICAgICB0b2tlbihyZXMpXG5cbiAgICAgIHN0YXJ0ICs9IHJlcy5sZW5ndGhcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKHJlcy5sZW5ndGgpXG4gICAgICByZXR1cm4gY29udGVudC5sZW5ndGhcbiAgICB9IHdoaWxlKDEpXG4gIH1cblxuICBmdW5jdGlvbiBoZXgoKSB7XG4gICAgaWYoL1teYS1mQS1GMC05XS8udGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGludGVnZXIoKSB7XG4gICAgaWYoYyA9PT0gJy4nKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bZUVdLy50ZXN0KGMpKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKGMgPT09ICd4JyAmJiBjb250ZW50Lmxlbmd0aCA9PT0gMSAmJiBjb250ZW50WzBdID09PSAnMCcpIHtcbiAgICAgIG1vZGUgPSBIRVhcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bXlxcZF0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBkZWNpbWFsKCkge1xuICAgIGlmKGMgPT09ICdmJykge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgaSArPSAxXG4gICAgfVxuXG4gICAgaWYoL1tlRV0vLnRlc3QoYykpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bXlxcZF0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZHRva2VuKCkge1xuICAgIGlmKC9bXlxcZFxcd19dLy50ZXN0KGMpKSB7XG4gICAgICB2YXIgY29udGVudHN0ciA9IGNvbnRlbnQuam9pbignJylcbiAgICAgIGlmKGxpdGVyYWxzLmluZGV4T2YoY29udGVudHN0cikgPiAtMSkge1xuICAgICAgICBtb2RlID0gS0VZV09SRFxuICAgICAgfSBlbHNlIGlmKGJ1aWx0aW5zLmluZGV4T2YoY29udGVudHN0cikgPiAtMSkge1xuICAgICAgICBtb2RlID0gQlVJTFRJTlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kZSA9IElERU5UXG4gICAgICB9XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICAgJ2dsX1Bvc2l0aW9uJ1xuICAsICdnbF9Qb2ludFNpemUnXG4gICwgJ2dsX0NsaXBWZXJ0ZXgnXG4gICwgJ2dsX0ZyYWdDb29yZCdcbiAgLCAnZ2xfRnJvbnRGYWNpbmcnXG4gICwgJ2dsX0ZyYWdDb2xvcidcbiAgLCAnZ2xfRnJhZ0RhdGEnXG4gICwgJ2dsX0ZyYWdEZXB0aCdcbiAgLCAnZ2xfQ29sb3InXG4gICwgJ2dsX1NlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9Ob3JtYWwnXG4gICwgJ2dsX1ZlcnRleCdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDAnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQxJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMidcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDMnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ0J1xuICAsICdnbF9NdWx0aVRleENvb3JkNSdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDYnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ3J1xuICAsICdnbF9Gb2dDb29yZCdcbiAgLCAnZ2xfTWF4TGlnaHRzJ1xuICAsICdnbF9NYXhDbGlwUGxhbmVzJ1xuICAsICdnbF9NYXhUZXh0dXJlVW5pdHMnXG4gICwgJ2dsX01heFRleHR1cmVDb29yZHMnXG4gICwgJ2dsX01heFZlcnRleEF0dHJpYnMnXG4gICwgJ2dsX01heFZlcnRleFVuaWZvcm1Db21wb25lbnRzJ1xuICAsICdnbF9NYXhWYXJ5aW5nRmxvYXRzJ1xuICAsICdnbF9NYXhWZXJ0ZXhUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4Q29tYmluZWRUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4VGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heEZyYWdtZW50VW5pZm9ybUNvbXBvbmVudHMnXG4gICwgJ2dsX01heERyYXdCdWZmZXJzJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXgnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXgnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXgnXG4gICwgJ2dsX05vcm1hbE1hdHJpeCdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeEludmVyc2UnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Ob3JtYWxTY2FsZSdcbiAgLCAnZ2xfRGVwdGhSYW5nZVBhcmFtZXRlcnMnXG4gICwgJ2dsX0RlcHRoUmFuZ2UnXG4gICwgJ2dsX0NsaXBQbGFuZSdcbiAgLCAnZ2xfUG9pbnRQYXJhbWV0ZXJzJ1xuICAsICdnbF9Qb2ludCdcbiAgLCAnZ2xfTWF0ZXJpYWxQYXJhbWV0ZXJzJ1xuICAsICdnbF9Gcm9udE1hdGVyaWFsJ1xuICAsICdnbF9CYWNrTWF0ZXJpYWwnXG4gICwgJ2dsX0xpZ2h0U291cmNlUGFyYW1ldGVycydcbiAgLCAnZ2xfTGlnaHRTb3VyY2UnXG4gICwgJ2dsX0xpZ2h0TW9kZWxQYXJhbWV0ZXJzJ1xuICAsICdnbF9MaWdodE1vZGVsJ1xuICAsICdnbF9MaWdodE1vZGVsUHJvZHVjdHMnXG4gICwgJ2dsX0Zyb250TGlnaHRNb2RlbFByb2R1Y3QnXG4gICwgJ2dsX0JhY2tMaWdodE1vZGVsUHJvZHVjdCdcbiAgLCAnZ2xfTGlnaHRQcm9kdWN0cydcbiAgLCAnZ2xfRnJvbnRMaWdodFByb2R1Y3QnXG4gICwgJ2dsX0JhY2tMaWdodFByb2R1Y3QnXG4gICwgJ2dsX0ZvZ1BhcmFtZXRlcnMnXG4gICwgJ2dsX0ZvZydcbiAgLCAnZ2xfVGV4dHVyZUVudkNvbG9yJ1xuICAsICdnbF9FeWVQbGFuZVMnXG4gICwgJ2dsX0V5ZVBsYW5lVCdcbiAgLCAnZ2xfRXllUGxhbmVSJ1xuICAsICdnbF9FeWVQbGFuZVEnXG4gICwgJ2dsX09iamVjdFBsYW5lUydcbiAgLCAnZ2xfT2JqZWN0UGxhbmVUJ1xuICAsICdnbF9PYmplY3RQbGFuZVInXG4gICwgJ2dsX09iamVjdFBsYW5lUSdcbiAgLCAnZ2xfRnJvbnRDb2xvcidcbiAgLCAnZ2xfQmFja0NvbG9yJ1xuICAsICdnbF9Gcm9udFNlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9CYWNrU2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX1RleENvb3JkJ1xuICAsICdnbF9Gb2dGcmFnQ29vcmQnXG4gICwgJ2dsX0NvbG9yJ1xuICAsICdnbF9TZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfVGV4Q29vcmQnXG4gICwgJ2dsX0ZvZ0ZyYWdDb29yZCdcbiAgLCAnZ2xfUG9pbnRDb29yZCdcbiAgLCAncmFkaWFucydcbiAgLCAnZGVncmVlcydcbiAgLCAnc2luJ1xuICAsICdjb3MnXG4gICwgJ3RhbidcbiAgLCAnYXNpbidcbiAgLCAnYWNvcydcbiAgLCAnYXRhbidcbiAgLCAncG93J1xuICAsICdleHAnXG4gICwgJ2xvZydcbiAgLCAnZXhwMidcbiAgLCAnbG9nMidcbiAgLCAnc3FydCdcbiAgLCAnaW52ZXJzZXNxcnQnXG4gICwgJ2FicydcbiAgLCAnc2lnbidcbiAgLCAnZmxvb3InXG4gICwgJ2NlaWwnXG4gICwgJ2ZyYWN0J1xuICAsICdtb2QnXG4gICwgJ21pbidcbiAgLCAnbWF4J1xuICAsICdjbGFtcCdcbiAgLCAnbWl4J1xuICAsICdzdGVwJ1xuICAsICdzbW9vdGhzdGVwJ1xuICAsICdsZW5ndGgnXG4gICwgJ2Rpc3RhbmNlJ1xuICAsICdkb3QnXG4gICwgJ2Nyb3NzJ1xuICAsICdub3JtYWxpemUnXG4gICwgJ2ZhY2Vmb3J3YXJkJ1xuICAsICdyZWZsZWN0J1xuICAsICdyZWZyYWN0J1xuICAsICdtYXRyaXhDb21wTXVsdCdcbiAgLCAnbGVzc1RoYW4nXG4gICwgJ2xlc3NUaGFuRXF1YWwnXG4gICwgJ2dyZWF0ZXJUaGFuJ1xuICAsICdncmVhdGVyVGhhbkVxdWFsJ1xuICAsICdlcXVhbCdcbiAgLCAnbm90RXF1YWwnXG4gICwgJ2FueSdcbiAgLCAnYWxsJ1xuICAsICdub3QnXG4gICwgJ3RleHR1cmUyRCdcbiAgLCAndGV4dHVyZTJEUHJvaidcbiAgLCAndGV4dHVyZTJETG9kJ1xuICAsICd0ZXh0dXJlMkRQcm9qTG9kJ1xuICAsICd0ZXh0dXJlQ3ViZSdcbiAgLCAndGV4dHVyZUN1YmVMb2QnXG4gICwgJ2RGZHgnXG4gICwgJ2RGZHknXG5dXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgLy8gY3VycmVudFxuICAgICdwcmVjaXNpb24nXG4gICwgJ2hpZ2hwJ1xuICAsICdtZWRpdW1wJ1xuICAsICdsb3dwJ1xuICAsICdhdHRyaWJ1dGUnXG4gICwgJ2NvbnN0J1xuICAsICd1bmlmb3JtJ1xuICAsICd2YXJ5aW5nJ1xuICAsICdicmVhaydcbiAgLCAnY29udGludWUnXG4gICwgJ2RvJ1xuICAsICdmb3InXG4gICwgJ3doaWxlJ1xuICAsICdpZidcbiAgLCAnZWxzZSdcbiAgLCAnaW4nXG4gICwgJ291dCdcbiAgLCAnaW5vdXQnXG4gICwgJ2Zsb2F0J1xuICAsICdpbnQnXG4gICwgJ3ZvaWQnXG4gICwgJ2Jvb2wnXG4gICwgJ3RydWUnXG4gICwgJ2ZhbHNlJ1xuICAsICdkaXNjYXJkJ1xuICAsICdyZXR1cm4nXG4gICwgJ21hdDInXG4gICwgJ21hdDMnXG4gICwgJ21hdDQnXG4gICwgJ3ZlYzInXG4gICwgJ3ZlYzMnXG4gICwgJ3ZlYzQnXG4gICwgJ2l2ZWMyJ1xuICAsICdpdmVjMydcbiAgLCAnaXZlYzQnXG4gICwgJ2J2ZWMyJ1xuICAsICdidmVjMydcbiAgLCAnYnZlYzQnXG4gICwgJ3NhbXBsZXIxRCdcbiAgLCAnc2FtcGxlcjJEJ1xuICAsICdzYW1wbGVyM0QnXG4gICwgJ3NhbXBsZXJDdWJlJ1xuICAsICdzYW1wbGVyMURTaGFkb3cnXG4gICwgJ3NhbXBsZXIyRFNoYWRvdydcbiAgLCAnc3RydWN0J1xuXG4gIC8vIGZ1dHVyZVxuICAsICdhc20nXG4gICwgJ2NsYXNzJ1xuICAsICd1bmlvbidcbiAgLCAnZW51bSdcbiAgLCAndHlwZWRlZidcbiAgLCAndGVtcGxhdGUnXG4gICwgJ3RoaXMnXG4gICwgJ3BhY2tlZCdcbiAgLCAnZ290bydcbiAgLCAnc3dpdGNoJ1xuICAsICdkZWZhdWx0J1xuICAsICdpbmxpbmUnXG4gICwgJ25vaW5saW5lJ1xuICAsICd2b2xhdGlsZSdcbiAgLCAncHVibGljJ1xuICAsICdzdGF0aWMnXG4gICwgJ2V4dGVybidcbiAgLCAnZXh0ZXJuYWwnXG4gICwgJ2ludGVyZmFjZSdcbiAgLCAnbG9uZydcbiAgLCAnc2hvcnQnXG4gICwgJ2RvdWJsZSdcbiAgLCAnaGFsZidcbiAgLCAnZml4ZWQnXG4gICwgJ3Vuc2lnbmVkJ1xuICAsICdpbnB1dCdcbiAgLCAnb3V0cHV0J1xuICAsICdodmVjMidcbiAgLCAnaHZlYzMnXG4gICwgJ2h2ZWM0J1xuICAsICdkdmVjMidcbiAgLCAnZHZlYzMnXG4gICwgJ2R2ZWM0J1xuICAsICdmdmVjMidcbiAgLCAnZnZlYzMnXG4gICwgJ2Z2ZWM0J1xuICAsICdzYW1wbGVyMkRSZWN0J1xuICAsICdzYW1wbGVyM0RSZWN0J1xuICAsICdzYW1wbGVyMkRSZWN0U2hhZG93J1xuICAsICdzaXplb2YnXG4gICwgJ2Nhc3QnXG4gICwgJ25hbWVzcGFjZSdcbiAgLCAndXNpbmcnXG5dXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICAnPDw9J1xuICAsICc+Pj0nXG4gICwgJysrJ1xuICAsICctLSdcbiAgLCAnPDwnXG4gICwgJz4+J1xuICAsICc8PSdcbiAgLCAnPj0nXG4gICwgJz09J1xuICAsICchPSdcbiAgLCAnJiYnXG4gICwgJ3x8J1xuICAsICcrPSdcbiAgLCAnLT0nXG4gICwgJyo9J1xuICAsICcvPSdcbiAgLCAnJT0nXG4gICwgJyY9J1xuICAsICdeXidcbiAgLCAnXj0nXG4gICwgJ3w9J1xuICAsICcoJ1xuICAsICcpJ1xuICAsICdbJ1xuICAsICddJ1xuICAsICcuJ1xuICAsICchJ1xuICAsICd+J1xuICAsICcqJ1xuICAsICcvJ1xuICAsICclJ1xuICAsICcrJ1xuICAsICctJ1xuICAsICc8J1xuICAsICc+J1xuICAsICcmJ1xuICAsICdeJ1xuICAsICd8J1xuICAsICc/J1xuICAsICc6J1xuICAsICc9J1xuICAsICcsJ1xuICAsICc7J1xuICAsICd7J1xuICAsICd9J1xuXVxuIiwidmFyIHRva2VuaXplID0gcmVxdWlyZSgnLi9pbmRleCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdG9rZW5pemVTdHJpbmdcblxuZnVuY3Rpb24gdG9rZW5pemVTdHJpbmcoc3RyKSB7XG4gIHZhciBnZW5lcmF0b3IgPSB0b2tlbml6ZSgpXG4gIHZhciB0b2tlbnMgPSBbXVxuXG4gIHRva2VucyA9IHRva2Vucy5jb25jYXQoZ2VuZXJhdG9yKHN0cikpXG4gIHRva2VucyA9IHRva2Vucy5jb25jYXQoZ2VuZXJhdG9yKG51bGwpKVxuXG4gIHJldHVybiB0b2tlbnNcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLyohXG4gKiByZXBlYXQtc3RyaW5nIDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9yZXBlYXQtc3RyaW5nPlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBKb24gU2NobGlua2VydC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXhwb3NlIGByZXBlYXRgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSByZXBlYXQ7XG5cbi8qKlxuICogUmVwZWF0IHRoZSBnaXZlbiBgc3RyaW5nYCB0aGUgc3BlY2lmaWVkIGBudW1iZXJgXG4gKiBvZiB0aW1lcy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqXG4gKiBgYGBqc1xuICogdmFyIHJlcGVhdCA9IHJlcXVpcmUoJ3JlcGVhdC1zdHJpbmcnKTtcbiAqIHJlcGVhdCgnQScsIDUpO1xuICogLy89PiBBQUFBQVxuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGBzdHJpbmdgIFRoZSBzdHJpbmcgdG8gcmVwZWF0XG4gKiBAcGFyYW0ge051bWJlcn0gYG51bWJlcmAgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSBSZXBlYXRlZCBzdHJpbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gcmVwZWF0KHN0ciwgbnVtKSB7XG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3JlcGVhdC1zdHJpbmcgZXhwZWN0cyBhIHN0cmluZy4nKTtcbiAgfVxuXG4gIGlmIChudW0gPT09IDEpIHJldHVybiBzdHI7XG4gIGlmIChudW0gPT09IDIpIHJldHVybiBzdHIgKyBzdHI7XG5cbiAgdmFyIG1heCA9IHN0ci5sZW5ndGggKiBudW07XG4gIGlmIChjYWNoZSAhPT0gc3RyIHx8IHR5cGVvZiBjYWNoZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjYWNoZSA9IHN0cjtcbiAgICByZXMgPSAnJztcbiAgfVxuXG4gIHdoaWxlIChtYXggPiByZXMubGVuZ3RoICYmIG51bSA+IDApIHtcbiAgICBpZiAobnVtICYgMSkge1xuICAgICAgcmVzICs9IHN0cjtcbiAgICB9XG5cbiAgICBudW0gPj49IDE7XG4gICAgaWYgKCFudW0pIGJyZWFrO1xuICAgIHN0ciArPSBzdHI7XG4gIH1cblxuICByZXR1cm4gcmVzLnN1YnN0cigwLCBtYXgpO1xufVxuXG4vKipcbiAqIFJlc3VsdHMgY2FjaGVcbiAqL1xuXG52YXIgcmVzID0gJyc7XG52YXIgY2FjaGU7XG4iLCIoZnVuY3Rpb24od2luZG93KSB7XG4gICAgdmFyIHJlID0ge1xuICAgICAgICBub3Rfc3RyaW5nOiAvW15zXS8sXG4gICAgICAgIG51bWJlcjogL1tkaWVmZ10vLFxuICAgICAgICBqc29uOiAvW2pdLyxcbiAgICAgICAgbm90X2pzb246IC9bXmpdLyxcbiAgICAgICAgdGV4dDogL15bXlxceDI1XSsvLFxuICAgICAgICBtb2R1bG86IC9eXFx4MjV7Mn0vLFxuICAgICAgICBwbGFjZWhvbGRlcjogL15cXHgyNSg/OihbMS05XVxcZCopXFwkfFxcKChbXlxcKV0rKVxcKSk/KFxcKyk/KDB8J1teJF0pPygtKT8oXFxkKyk/KD86XFwuKFxcZCspKT8oW2ItZ2lqb3N1eFhdKS8sXG4gICAgICAgIGtleTogL14oW2Etel9dW2Etel9cXGRdKikvaSxcbiAgICAgICAga2V5X2FjY2VzczogL15cXC4oW2Etel9dW2Etel9cXGRdKikvaSxcbiAgICAgICAgaW5kZXhfYWNjZXNzOiAvXlxcWyhcXGQrKVxcXS8sXG4gICAgICAgIHNpZ246IC9eW1xcK1xcLV0vXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3ByaW50ZigpIHtcbiAgICAgICAgdmFyIGtleSA9IGFyZ3VtZW50c1swXSwgY2FjaGUgPSBzcHJpbnRmLmNhY2hlXG4gICAgICAgIGlmICghKGNhY2hlW2tleV0gJiYgY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkpIHtcbiAgICAgICAgICAgIGNhY2hlW2tleV0gPSBzcHJpbnRmLnBhcnNlKGtleSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3ByaW50Zi5mb3JtYXQuY2FsbChudWxsLCBjYWNoZVtrZXldLCBhcmd1bWVudHMpXG4gICAgfVxuXG4gICAgc3ByaW50Zi5mb3JtYXQgPSBmdW5jdGlvbihwYXJzZV90cmVlLCBhcmd2KSB7XG4gICAgICAgIHZhciBjdXJzb3IgPSAxLCB0cmVlX2xlbmd0aCA9IHBhcnNlX3RyZWUubGVuZ3RoLCBub2RlX3R5cGUgPSBcIlwiLCBhcmcsIG91dHB1dCA9IFtdLCBpLCBrLCBtYXRjaCwgcGFkLCBwYWRfY2hhcmFjdGVyLCBwYWRfbGVuZ3RoLCBpc19wb3NpdGl2ZSA9IHRydWUsIHNpZ24gPSBcIlwiXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0cmVlX2xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlX3R5cGUgPSBnZXRfdHlwZShwYXJzZV90cmVlW2ldKVxuICAgICAgICAgICAgaWYgKG5vZGVfdHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IHBhcnNlX3RyZWVbaV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5vZGVfdHlwZSA9PT0gXCJhcnJheVwiKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSBwYXJzZV90cmVlW2ldIC8vIGNvbnZlbmllbmNlIHB1cnBvc2VzIG9ubHlcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHsgLy8ga2V5d29yZCBhcmd1bWVudFxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd2W2N1cnNvcl1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IG1hdGNoWzJdLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFyZy5oYXNPd25Qcm9wZXJ0eShtYXRjaFsyXVtrXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZihcIltzcHJpbnRmXSBwcm9wZXJ0eSAnJXMnIGRvZXMgbm90IGV4aXN0XCIsIG1hdGNoWzJdW2tdKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ1ttYXRjaFsyXVtrXV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtYXRjaFsxXSkgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChleHBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndlttYXRjaFsxXV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7IC8vIHBvc2l0aW9uYWwgYXJndW1lbnQgKGltcGxpY2l0KVxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd2W2N1cnNvcisrXVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChnZXRfdHlwZShhcmcpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcoKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5ub3Rfc3RyaW5nLnRlc3QobWF0Y2hbOF0pICYmIHJlLm5vdF9qc29uLnRlc3QobWF0Y2hbOF0pICYmIChnZXRfdHlwZShhcmcpICE9IFwibnVtYmVyXCIgJiYgaXNOYU4oYXJnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzcHJpbnRmKFwiW3NwcmludGZdIGV4cGVjdGluZyBudW1iZXIgYnV0IGZvdW5kICVzXCIsIGdldF90eXBlKGFyZykpKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChtYXRjaFs4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNfcG9zaXRpdmUgPSBhcmcgPj0gMFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN3aXRjaCAobWF0Y2hbOF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygyKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gU3RyaW5nLmZyb21DaGFyQ29kZShhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBwYXJzZUludChhcmcsIDEwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwialwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gSlNPTi5zdHJpbmdpZnkoYXJnLCBudWxsLCBtYXRjaFs2XSA/IHBhcnNlSW50KG1hdGNoWzZdKSA6IDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IGFyZy50b0V4cG9uZW50aWFsKG1hdGNoWzddKSA6IGFyZy50b0V4cG9uZW50aWFsKClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IG1hdGNoWzddID8gcGFyc2VGbG9hdChhcmcpLnRvRml4ZWQobWF0Y2hbN10pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJnXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IHBhcnNlRmxvYXQoYXJnKS50b1ByZWNpc2lvbihtYXRjaFs3XSkgOiBwYXJzZUZsb2F0KGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZyg4KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKChhcmcgPSBTdHJpbmcoYXJnKSkgJiYgbWF0Y2hbN10gPyBhcmcuc3Vic3RyaW5nKDAsIG1hdGNoWzddKSA6IGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZyA+Pj4gMFxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwieFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDE2KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiWFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZS5qc29uLnRlc3QobWF0Y2hbOF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IGFyZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlLm51bWJlci50ZXN0KG1hdGNoWzhdKSAmJiAoIWlzX3Bvc2l0aXZlIHx8IG1hdGNoWzNdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IGlzX3Bvc2l0aXZlID8gXCIrXCIgOiBcIi1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKCkucmVwbGFjZShyZS5zaWduLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwYWRfY2hhcmFjdGVyID0gbWF0Y2hbNF0gPyBtYXRjaFs0XSA9PT0gXCIwXCIgPyBcIjBcIiA6IG1hdGNoWzRdLmNoYXJBdCgxKSA6IFwiIFwiXG4gICAgICAgICAgICAgICAgICAgIHBhZF9sZW5ndGggPSBtYXRjaFs2XSAtIChzaWduICsgYXJnKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcGFkID0gbWF0Y2hbNl0gPyAocGFkX2xlbmd0aCA+IDAgPyBzdHJfcmVwZWF0KHBhZF9jaGFyYWN0ZXIsIHBhZF9sZW5ndGgpIDogXCJcIikgOiBcIlwiXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IG1hdGNoWzVdID8gc2lnbiArIGFyZyArIHBhZCA6IChwYWRfY2hhcmFjdGVyID09PSBcIjBcIiA/IHNpZ24gKyBwYWQgKyBhcmcgOiBwYWQgKyBzaWduICsgYXJnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0LmpvaW4oXCJcIilcbiAgICB9XG5cbiAgICBzcHJpbnRmLmNhY2hlID0ge31cblxuICAgIHNwcmludGYucGFyc2UgPSBmdW5jdGlvbihmbXQpIHtcbiAgICAgICAgdmFyIF9mbXQgPSBmbXQsIG1hdGNoID0gW10sIHBhcnNlX3RyZWUgPSBbXSwgYXJnX25hbWVzID0gMFxuICAgICAgICB3aGlsZSAoX2ZtdCkge1xuICAgICAgICAgICAgaWYgKChtYXRjaCA9IHJlLnRleHQuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlW3BhcnNlX3RyZWUubGVuZ3RoXSA9IG1hdGNoWzBdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5tb2R1bG8uZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlW3BhcnNlX3RyZWUubGVuZ3RoXSA9IFwiJVwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5wbGFjZWhvbGRlci5leGVjKF9mbXQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdfbmFtZXMgfD0gMVxuICAgICAgICAgICAgICAgICAgICB2YXIgZmllbGRfbGlzdCA9IFtdLCByZXBsYWNlbWVudF9maWVsZCA9IG1hdGNoWzJdLCBmaWVsZF9tYXRjaCA9IFtdXG4gICAgICAgICAgICAgICAgICAgIGlmICgoZmllbGRfbWF0Y2ggPSByZS5rZXkuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKHJlcGxhY2VtZW50X2ZpZWxkID0gcmVwbGFjZW1lbnRfZmllbGQuc3Vic3RyaW5nKGZpZWxkX21hdGNoWzBdLmxlbmd0aCkpICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChmaWVsZF9tYXRjaCA9IHJlLmtleV9hY2Nlc3MuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkX2xpc3RbZmllbGRfbGlzdC5sZW5ndGhdID0gZmllbGRfbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoKGZpZWxkX21hdGNoID0gcmUuaW5kZXhfYWNjZXNzLmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJbc3ByaW50Zl0gZmFpbGVkIHRvIHBhcnNlIG5hbWVkIGFyZ3VtZW50IGtleVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIltzcHJpbnRmXSBmYWlsZWQgdG8gcGFyc2UgbmFtZWQgYXJndW1lbnQga2V5XCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBmaWVsZF9saXN0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhcmdfbmFtZXMgfD0gMlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXJnX25hbWVzID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIltzcHJpbnRmXSBtaXhpbmcgcG9zaXRpb25hbCBhbmQgbmFtZWQgcGxhY2Vob2xkZXJzIGlzIG5vdCAoeWV0KSBzdXBwb3J0ZWRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBtYXRjaFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW3NwcmludGZdIHVuZXhwZWN0ZWQgcGxhY2Vob2xkZXJcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9mbXQgPSBfZm10LnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcnNlX3RyZWVcbiAgICB9XG5cbiAgICB2YXIgdnNwcmludGYgPSBmdW5jdGlvbihmbXQsIGFyZ3YsIF9hcmd2KSB7XG4gICAgICAgIF9hcmd2ID0gKGFyZ3YgfHwgW10pLnNsaWNlKDApXG4gICAgICAgIF9hcmd2LnNwbGljZSgwLCAwLCBmbXQpXG4gICAgICAgIHJldHVybiBzcHJpbnRmLmFwcGx5KG51bGwsIF9hcmd2KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGhlbHBlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRfdHlwZSh2YXJpYWJsZSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0cl9yZXBlYXQoaW5wdXQsIG11bHRpcGxpZXIpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5KG11bHRpcGxpZXIgKyAxKS5qb2luKGlucHV0KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGV4cG9ydCB0byBlaXRoZXIgYnJvd3NlciBvciBub2RlLmpzXG4gICAgICovXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGV4cG9ydHMuc3ByaW50ZiA9IHNwcmludGZcbiAgICAgICAgZXhwb3J0cy52c3ByaW50ZiA9IHZzcHJpbnRmXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB3aW5kb3cuc3ByaW50ZiA9IHNwcmludGZcbiAgICAgICAgd2luZG93LnZzcHJpbnRmID0gdnNwcmludGZcblxuICAgICAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmOiBzcHJpbnRmLFxuICAgICAgICAgICAgICAgICAgICB2c3ByaW50ZjogdnNwcmludGZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufSkodHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIiA/IHRoaXMgOiB3aW5kb3cpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIi8vICBUaW1lciBiYXNlZCBhbmltYXRpb25cbi8vIFRPRE8gY2xlYW4gdXAgbGludGluZ1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGdsb2JhbCBzZXRUaW1lb3V0ICovXG5pbXBvcnQge21lcmdlLCBub29wLCBzcGxhdH0gZnJvbSAnLi4vdXRpbHMnO1xuXG52YXIgUXVldWUgPSBbXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRngge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHtcbiAgICAgIGRlbGF5OiAwLFxuICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICB0cmFuc2l0aW9uOiB4ID0+IHgsXG4gICAgICBvbkNvbXB1dGU6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wXG4gICAgfSwgb3B0aW9ucyk7XG4gIH1cblxuICBzdGFydChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh0aGlzLm9wdCwgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy50aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmFuaW1hdGluZyA9IHRydWU7XG4gICAgUXVldWUucHVzaCh0aGlzKTtcbiAgfVxuXG4gIC8vIHBlcmZvcm0gYSBzdGVwIGluIHRoZSBhbmltYXRpb25cbiAgc3RlcCgpIHtcbiAgICAvLyBpZiBub3QgYW5pbWF0aW5nLCB0aGVuIHJldHVyblxuICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKSxcbiAgICAgIHRpbWUgPSB0aGlzLnRpbWUsXG4gICAgICBvcHQgPSB0aGlzLm9wdCxcbiAgICAgIGRlbGF5ID0gb3B0LmRlbGF5LFxuICAgICAgZHVyYXRpb24gPSBvcHQuZHVyYXRpb24sXG4gICAgICBkZWx0YSA9IDA7XG4gICAgLy8gaG9sZCBhbmltYXRpb24gZm9yIHRoZSBkZWxheVxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSkge1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaWYgaW4gb3VyIHRpbWUgd2luZG93LCB0aGVuIGV4ZWN1dGUgYW5pbWF0aW9uXG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5ICsgZHVyYXRpb24pIHtcbiAgICAgIGRlbHRhID0gb3B0LnRyYW5zaXRpb24oKGN1cnJlbnRUaW1lIC0gdGltZSAtIGRlbGF5KSAvIGR1cmF0aW9uKTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgMSk7XG4gICAgICBvcHQub25Db21wbGV0ZS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBjb21wdXRlKGZyb20sIHRvLCBkZWx0YSkge1xuICAgIHJldHVybiBmcm9tICsgKHRvIC0gZnJvbSkgKiBkZWx0YTtcbiAgfVxufVxuXG5GeC5RdWV1ZSA9IFF1ZXVlO1xuXG4vLyBFYXNpbmcgZXF1YXRpb25zXG5GeC5UcmFuc2l0aW9uID0ge1xuICBsaW5lYXIocCkge1xuICAgIHJldHVybiBwO1xuICB9XG59O1xuXG52YXIgVHJhbnMgPSBGeC5UcmFuc2l0aW9uO1xuXG5GeC5wcm90b3R5cGUudGltZSA9IG51bGw7XG5cbmZ1bmN0aW9uIG1ha2VUcmFucyh0cmFuc2l0aW9uLCBwYXJhbXMpIHtcbiAgcGFyYW1zID0gc3BsYXQocGFyYW1zKTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24odHJhbnNpdGlvbiwge1xuICAgIGVhc2VJbihwb3MpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uKHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VPdXQocG9zKSB7XG4gICAgICByZXR1cm4gMSAtIHRyYW5zaXRpb24oMSAtIHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VJbk91dChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zIDw9IDAuNSkgPyB0cmFuc2l0aW9uKDIgKiBwb3MsIHBhcmFtcykgLyAyIDpcbiAgICAgICAgKDIgLSB0cmFuc2l0aW9uKDIgKiAoMSAtIHBvcyksIHBhcmFtcykpIC8gMjtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgdHJhbnNpdGlvbnMgPSB7XG5cbiAgUG93KHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgeFswXSB8fCA2KTtcbiAgfSxcblxuICBFeHBvKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgOCAqIChwIC0gMSkpO1xuICB9LFxuXG4gIENpcmMocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oTWF0aC5hY29zKHApKTtcbiAgfSxcblxuICBTaW5lKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKCgxIC0gcCkgKiBNYXRoLlBJIC8gMik7XG4gIH0sXG5cbiAgQmFjayhwLCB4KSB7XG4gICAgeCA9IHhbMF0gfHwgMS42MTg7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIDIpICogKCh4ICsgMSkgKiBwIC0geCk7XG4gIH0sXG5cbiAgQm91bmNlKHApIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgZm9yIChsZXQgYSA9IDAsIGIgPSAxOyAxOyBhICs9IGIsIGIgLz0gMikge1xuICAgICAgaWYgKHAgPj0gKDcgLSA0ICogYSkgLyAxMSkge1xuICAgICAgICB2YWx1ZSA9IGIgKiBiIC0gTWF0aC5wb3coKDExIC0gNiAqIGEgLSAxMSAqIHApIC8gNCwgMik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG5cbiAgRWxhc3RpYyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDEwICogLS1wKSAqIE1hdGguY29zKDIwICogcCAqIE1hdGguUEkgKiAoeFswXSB8fCAxKSAvIDMpO1xuICB9XG5cbn07XG5cbmZvciAoY29uc3QgdCBpbiB0cmFuc2l0aW9ucykge1xuICBUcmFuc1t0XSA9IG1ha2VUcmFucyh0cmFuc2l0aW9uc1t0XSk7XG59XG5cblsnUXVhZCcsICdDdWJpYycsICdRdWFydCcsICdRdWludCddLmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaSkge1xuICBUcmFuc1tlbGVtXSA9IG1ha2VUcmFucyhmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIFtcbiAgICAgIGkgKyAyXG4gICAgXSk7XG4gIH0pO1xufSk7XG5cbi8vIGFuaW1hdGlvblRpbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcblxuLy8gIHJ5ZTogVE9ETy0gcmVmYWN0b3IgZ2xvYmFsIGRlZmluaXRpb24gd2hlbiB3ZSBkZWZpbmUgdGhlIHR3b1xuLy8gICAgICAgICAgICAgKGJyb3dzZXJpZnkvPHNjcmlwdD4pIGJ1aWxkIHBhdGhzLlxudmFyIGdsb2JhbDtcbnRyeSB7XG4gIGdsb2JhbCA9IHdpbmRvdztcbn0gY2F0Y2ggKGUpIHtcbiAgZ2xvYmFsID0gbnVsbDtcbn1cblxudmFyIGNoZWNrRnhRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2xkUXVldWUgPSBRdWV1ZTtcbiAgUXVldWUgPSBbXTtcbiAgaWYgKG9sZFF1ZXVlLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2xkUXVldWUubGVuZ3RoLCBmeDsgaSA8IGw7IGkrKykge1xuICAgICAgZnggPSBvbGRRdWV1ZVtpXTtcbiAgICAgIGZ4LnN0ZXAoKTtcbiAgICAgIGlmIChmeC5hbmltYXRpbmcpIHtcbiAgICAgICAgUXVldWUucHVzaChmeCk7XG4gICAgICB9XG4gICAgfVxuICAgIEZ4LlF1ZXVlID0gUXVldWU7XG4gIH1cbn07XG5cbmlmIChnbG9iYWwpIHtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0QW5pbWF0aW9uVGltZScsICdtb3pBbmltYXRpb25UaW1lJywgJ2FuaW1hdGlvblRpbWUnLFxuICAgJ3dlYmtpdEFuaW1hdGlvblN0YXJ0VGltZScsICdtb3pBbmltYXRpb25TdGFydFRpbWUnLCAnYW5pbWF0aW9uU3RhcnRUaW1lJ11cbiAgICAuZm9yRWFjaChpbXBsID0+IHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5hbmltYXRpb25UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGdsb2JhbFtpbXBsXTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRnguYW5pbWF0aW9uVGltZSA9IERhdGUubm93O1xuICB9XG4gIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuICBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZScsICdtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLFxuICAgJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddXG4gICAgLmZvckVhY2goZnVuY3Rpb24oaW1wbCkge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgZ2xvYmFsW2ltcGxdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9LCAxMDAwIC8gNjApO1xuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCBQcm9ncmFtIGZyb20gJy4uL3dlYmdsL3Byb2dyYW0nO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQge1hIUkdyb3VwfSBmcm9tICcuLi9pbyc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuLy8gQWx0ZXJuYXRlIGNvbnN0cnVjdG9yXG4vLyBCdWlsZCBwcm9ncmFtIGZyb20gZGVmYXVsdCBzaGFkZXJzIChyZXF1aXJlcyBTaGFkZXJzKVxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtZnJvbURlZmF1bHRTaGFkZXJzKGdsLCBpZCkge1xuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHtcbiAgICB2czogU2hhZGVycy5WZXJ0ZXguRGVmYXVsdCxcbiAgICBmczogU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0LFxuICAgIGlkXG4gIH0pO1xufVxuXG4vLyBDcmVhdGUgYSBwcm9ncmFtIGZyb20gdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgbm9kZSBpZHNcbi8vIEBkZXByZWNhdGVkIC0gVXNlIGdsc2xpZnkgaW5zdGVhZFxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtRnJvbUhUTUxUZW1wbGF0ZXMoZ2wsIHZzSWQsIGZzSWQsIGlkKSB7XG4gIGNvbnN0IHZzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodnNJZCkuaW5uZXJIVE1MO1xuICBjb25zdCBmcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZzSWQpLmlubmVySFRNTDtcbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7dnMsIGZzLCBpZH0pO1xufVxuXG4vLyBMb2FkIHNoYWRlcnMgdXNpbmcgWEhSXG4vLyBAZGVwcmVjYXRlZCAtIFVzZSBnbHNsaWZ5IGluc3RlYWRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlUHJvZ3JhbUZyb21TaGFkZXJVUklzKGdsLCB2cywgZnMsIG9wdHMpIHtcbiAgb3B0cyA9IG1lcmdlKHtcbiAgICBwYXRoOiAnLycsXG4gICAgbm9DYWNoZTogZmFsc2VcbiAgfSwgb3B0cyk7XG5cbiAgY29uc3QgdmVydGV4U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgdnM7XG4gIGNvbnN0IGZyYWdtZW50U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgZnM7XG5cbiAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgbmV3IFhIUkdyb3VwKHtcbiAgICB1cmxzOiBbdmVydGV4U2hhZGVyVVJJLCBmcmFnbWVudFNoYWRlclVSSV0sXG4gICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG4gIH0pLnNlbmRBc3luYygpO1xuXG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzOiByZXNwb25zZXNbMF0sIGZzOiByZXNwb25zZXNbMV19KTtcbn1cbiIsImltcG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vaGVscGVycyc7XG5cbmV4cG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5leHBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5leHBvcnQgKiBmcm9tICcuL2hlbHBlcnMnO1xuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lkx1bWFHTCkge1xuICB3aW5kb3cuTHVtYUdMLmFkZG9ucyA9IHtcbiAgICBGeDogRngsXG4gICAgV29ya2VyR3JvdXA6IFdvcmtlckdyb3VwXG4gIH07XG4gIE9iamVjdC5hc3NpZ24od2luZG93Lkx1bWFHTC5hZGRvbnMsIGhlbHBlcnMpO1xufVxuIiwiLy8gd29ya2Vycy5qc1xuLy9cbi8qIGdsb2JhbCBXb3JrZXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIG9uZS12YXIsIGluZGVudCAqL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXb3JrZXJHcm91cCB7XG5cbiAgY29uc3RydWN0b3IoZmlsZU5hbWUsIG4pIHtcbiAgICB2YXIgd29ya2VycyA9IHRoaXMud29ya2VycyA9IFtdO1xuICAgIHdoaWxlIChuLS0pIHtcbiAgICAgIHdvcmtlcnMucHVzaChuZXcgV29ya2VyKGZpbGVOYW1lKSk7XG4gICAgfVxuICB9XG5cbiAgbWFwKGZ1bmMpIHtcbiAgICB2YXIgd29ya2VycyA9IHRoaXMud29ya2VycztcbiAgICB2YXIgY29uZmlncyA9IHRoaXMuY29uZmlncyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB3b3JrZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgY29uZmlncy5wdXNoKGZ1bmMgJiYgZnVuYyhpKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZWR1Y2Uob3B0KSB7XG4gICAgdmFyIGZuID0gb3B0LnJlZHVjZUZuLFxuICAgICAgICB3b3JrZXJzID0gdGhpcy53b3JrZXJzLFxuICAgICAgICBjb25maWdzID0gdGhpcy5jb25maWdzLFxuICAgICAgICBsID0gd29ya2Vycy5sZW5ndGgsXG4gICAgICAgIGFjdW0gPSBvcHQuaW5pdGlhbFZhbHVlLFxuICAgICAgICBtZXNzYWdlID0gZnVuY3Rpb24gXyhlKSB7XG4gICAgICAgICAgbC0tO1xuICAgICAgICAgIGlmIChhY3VtID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGFjdW0gPSBlLmRhdGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFjdW0gPSBmbihhY3VtLCBlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobCA9PT0gMCkge1xuICAgICAgICAgICAgb3B0Lm9uQ29tcGxldGUoYWN1bSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsbiA9IGw7IGkgPCBsbjsgaSsrKSB7XG4gICAgICB2YXIgdyA9IHdvcmtlcnNbaV07XG4gICAgICB3Lm9ubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB3LnBvc3RNZXNzYWdlKGNvbmZpZ3NbaV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiIsIi8vIFByb3ZpZGVzIGxvYWRpbmcgb2YgYXNzZXRzIHdpdGggWEhSIGFuZCBKU09OUCBtZXRob2RzLlxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5ICovXG5cbi8qIGdsb2JhbCBkb2N1bWVudCwgWE1MSHR0cFJlcXVlc3QsIEltYWdlICovXG5pbXBvcnQge3VpZCwgc3BsYXQsIG1lcmdlLCBub29wfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7VGV4dHVyZTJEfSBmcm9tICcuL3dlYmdsJztcblxuZXhwb3J0IGNsYXNzIFhIUiB7XG5cbiAgY29uc3RydWN0b3Iob3B0ID0ge30pIHtcbiAgICBvcHQgPSB7XG4gICAgICB1cmw6ICdodHRwOi8vIHBoaWxvZ2xqcy5vcmcvJyxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBhc3luYzogdHJ1ZSxcbiAgICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgICAgLy8gYm9keTogbnVsbCxcbiAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2UsXG4gICAgICByZXNwb25zZVR5cGU6IGZhbHNlLFxuICAgICAgb25Qcm9ncmVzczogbm9vcCxcbiAgICAgIG9uU3VjY2Vzczogbm9vcCxcbiAgICAgIG9uRXJyb3I6IG5vb3AsXG4gICAgICBvbkFib3J0OiBub29wLFxuICAgICAgb25Db21wbGV0ZTogbm9vcCxcbiAgICAgIC4uLm9wdFxuICAgIH07XG5cbiAgICB0aGlzLm9wdCA9IG9wdDtcbiAgICB0aGlzLmluaXRYSFIoKTtcbiAgfVxuXG4gIGluaXRYSFIoKSB7XG4gICAgY29uc3QgcmVxID0gdGhpcy5yZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIFsnUHJvZ3Jlc3MnLCAnRXJyb3InLCAnQWJvcnQnLCAnTG9hZCddLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgaWYgKHJlcS5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIHJlcS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LnRvTG93ZXJDYXNlKCksIGUgPT4ge1xuICAgICAgICAgIHNlbGZbJ2hhbmRsZScgKyBldmVudF0oZSk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcVsnb24nICsgZXZlbnQudG9Mb3dlckNhc2UoKV0gPSBlID0+IHtcbiAgICAgICAgICBzZWxmWydoYW5kbGUnICsgZXZlbnRdKGUpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2VuZEFzeW5jKGJvZHkpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qge3JlcSwgb3B0fSA9IHRoaXM7XG4gICAgICBjb25zdCB7YXN5bmN9ID0gb3B0O1xuXG4gICAgICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICAgICAgb3B0LnVybCArPSAob3B0LnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgICAgIH1cblxuICAgICAgcmVxLm9wZW4ob3B0Lm1ldGhvZCwgb3B0LnVybCwgYXN5bmMpO1xuXG4gICAgICBpZiAob3B0LnJlc3BvbnNlVHlwZSkge1xuICAgICAgICByZXEucmVzcG9uc2VUeXBlID0gb3B0LnJlc3BvbnNlVHlwZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFzeW5jKSB7XG4gICAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlID0+IHtcbiAgICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IFhIUi5TdGF0ZS5DT01QTEVURUQpIHtcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHQuc2VuZEFzQmluYXJ5KSB7XG4gICAgICAgIHJlcS5zZW5kQXNCaW5hcnkoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcS5zZW5kKGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghYXN5bmMpIHtcbiAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1cykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kKGJvZHkpIHtcbiAgICBjb25zdCB7cmVxLCBvcHR9ID0gdGhpcztcbiAgICBjb25zdCBhc3luYyA9IG9wdC5hc3luYztcblxuICAgIGlmIChvcHQubm9DYWNoZSkge1xuICAgICAgb3B0LnVybCArPSAob3B0LnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgICB9XG5cbiAgICByZXEub3BlbihvcHQubWV0aG9kLCBvcHQudXJsLCBhc3luYyk7XG5cbiAgICBpZiAob3B0LnJlc3BvbnNlVHlwZSkge1xuICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IG9wdC5yZXNwb25zZVR5cGU7XG4gICAgfVxuXG4gICAgaWYgKGFzeW5jKSB7XG4gICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWEhSLlN0YXRlLkNPTVBMRVRFRCkge1xuICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIG9wdC5vblN1Y2Nlc3MocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHQub25FcnJvcihyZXEuc3RhdHVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG9wdC5zZW5kQXNCaW5hcnkpIHtcbiAgICAgIHJlcS5zZW5kQXNCaW5hcnkoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxLnNlbmQoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICB9XG5cbiAgICBpZiAoIWFzeW5jKSB7XG4gICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgIG9wdC5vblN1Y2Nlc3MocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0Lm9uRXJyb3IocmVxLnN0YXR1cyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5yZXEuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGhhbmRsZVByb2dyZXNzKGUpIHtcbiAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICB0aGlzLm9wdC5vblByb2dyZXNzKGUsIE1hdGgucm91bmQoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3B0Lm9uUHJvZ3Jlc3MoZSwgLTEpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUVycm9yKGUpIHtcbiAgICB0aGlzLm9wdC5vbkVycm9yKGUpO1xuICB9XG5cbiAgaGFuZGxlQWJvcnQoZSkge1xuICAgIHRoaXMub3B0Lm9uQWJvcnQoZSk7XG4gIH1cblxuICBoYW5kbGVMb2FkKGUpIHtcbiAgICB0aGlzLm9wdC5vbkNvbXBsZXRlKGUpO1xuICB9XG59XG5cblhIUi5TdGF0ZSA9IHt9O1xuWydVTklOSVRJQUxJWkVEJywgJ0xPQURJTkcnLCAnTE9BREVEJywgJ0lOVEVSQUNUSVZFJywgJ0NPTVBMRVRFRCddXG4uZm9yRWFjaCgoc3RhdGVOYW1lLCBpKSA9PiB7XG4gIFhIUi5TdGF0ZVtzdGF0ZU5hbWVdID0gaTtcbn0pO1xuXG4vLyBNYWtlIHBhcmFsbGVsIHJlcXVlc3RzIGFuZCBncm91cCB0aGUgcmVzcG9uc2VzLlxuZXhwb3J0IGNsYXNzIFhIUkdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihvcHQgPSB7fSkge1xuICAgIG9wdCA9IHtcbiAgICAgIHVybHM6IFtdLFxuICAgICAgb25TdWNjZXNzOiBub29wLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgbm9DYWNoZTogZmFsc2UsXG4gICAgICAvLyBib2R5OiBudWxsLFxuICAgICAgc2VuZEFzQmluYXJ5OiBmYWxzZSxcbiAgICAgIHJlc3BvbnNlVHlwZTogZmFsc2UsXG4gICAgICAuLi5vcHRcbiAgICB9O1xuXG4gICAgdmFyIHVybHMgPSBzcGxhdChvcHQudXJscyk7XG4gICAgdGhpcy5yZXFzID0gdXJscy5tYXAoKHVybCwgaSkgPT4gbmV3IFhIUih7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogb3B0Lm1ldGhvZCxcbiAgICAgIGFzeW5jOiBvcHQuYXN5bmMsXG4gICAgICBub0NhY2hlOiBvcHQubm9DYWNoZSxcbiAgICAgIHNlbmRBc0JpbmFyeTogb3B0LnNlbmRBc0JpbmFyeSxcbiAgICAgIHJlc3BvbnNlVHlwZTogb3B0LnJlc3BvbnNlVHlwZSxcbiAgICAgIGJvZHk6IG9wdC5ib2R5XG4gICAgfSkpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEFzeW5jKCkge1xuICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnJlcXMubWFwKHJlcSA9PiByZXEuc2VuZEFzeW5jKCkpKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBKU09OUChvcHQpIHtcbiAgb3B0ID0gbWVyZ2Uoe1xuICAgIHVybDogJ2h0dHA6Ly8gcGhpbG9nbGpzLm9yZy8nLFxuICAgIGRhdGE6IHt9LFxuICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgIG9uQ29tcGxldGU6IG5vb3AsXG4gICAgY2FsbGJhY2tLZXk6ICdjYWxsYmFjaydcbiAgfSwgb3B0IHx8IHt9KTtcblxuICB2YXIgaW5kZXggPSBKU09OUC5jb3VudGVyKys7XG4gIC8vIGNyZWF0ZSBxdWVyeSBzdHJpbmdcbiAgdmFyIGRhdGEgPSBbXTtcbiAgZm9yICh2YXIgcHJvcCBpbiBvcHQuZGF0YSkge1xuICAgIGRhdGEucHVzaChwcm9wICsgJz0nICsgb3B0LmRhdGFbcHJvcF0pO1xuICB9XG4gIGRhdGEgPSBkYXRhLmpvaW4oJyYnKTtcbiAgLy8gYXBwZW5kIHVuaXF1ZSBpZCBmb3IgY2FjaGVcbiAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgZGF0YSArPSAoZGF0YS5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgfVxuICAvLyBjcmVhdGUgc291cmNlIHVybFxuICB2YXIgc3JjID0gb3B0LnVybCArXG4gICAgKG9wdC51cmwuaW5kZXhPZignPycpID4gLTEgPyAnJicgOiAnPycpICtcbiAgICBvcHQuY2FsbGJhY2tLZXkgKyAnPVBoaWxvR0wgSU8uSlNPTlAucmVxdWVzdHMucmVxdWVzdF8nICsgaW5kZXggK1xuICAgIChkYXRhLmxlbmd0aCA+IDAgPyAnJicgKyBkYXRhIDogJycpO1xuXG4gIC8vIGNyZWF0ZSBzY3JpcHRcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICBzY3JpcHQuc3JjID0gc3JjO1xuXG4gIC8vIGNyZWF0ZSBjYWxsYmFja1xuICBKU09OUC5yZXF1ZXN0c1sncmVxdWVzdF8nICsgaW5kZXhdID0gZnVuY3Rpb24oanNvbikge1xuICAgIG9wdC5vbkNvbXBsZXRlKGpzb24pO1xuICAgIC8vIHJlbW92ZSBzY3JpcHRcbiAgICBpZiAoc2NyaXB0LnBhcmVudE5vZGUpIHtcbiAgICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgfVxuICAgIGlmIChzY3JpcHQuY2xlYXJBdHRyaWJ1dGVzKSB7XG4gICAgICBzY3JpcHQuY2xlYXJBdHRyaWJ1dGVzKCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIGluamVjdCBzY3JpcHRcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xufVxuXG5KU09OUC5jb3VudGVyID0gMDtcbkpTT05QLnJlcXVlc3RzID0ge307XG5cbi8vIENyZWF0ZXMgYW4gaW1hZ2UtbG9hZGluZyBwcm9taXNlLlxuZnVuY3Rpb24gbG9hZEltYWdlKHNyYykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXNvbHZlKGltYWdlKTtcbiAgICB9O1xuICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGltYWdlICR7c3JjfS5gKSk7XG4gICAgfTtcbiAgICBpbWFnZS5zcmMgPSBzcmM7XG4gIH0pO1xufVxuXG4vLyBMb2FkIG11bHRpcGxlIGltYWdlcyBhc3luYy5cbi8vIHJ5ZTogVE9ETyB0aGlzIG5lZWRzIHRvIGltcGxlbWVudCBmdW5jdGlvbmFsaXR5IGZyb20gdGhlXG4vLyAgICAgICAgICAgb3JpZ2luYWwgSW1hZ2VzIGZ1bmN0aW9uLlxuYXN5bmMgZnVuY3Rpb24gbG9hZEltYWdlcyhzcmNzKSB7XG4gIGxldCBpbWFnZVByb21pc2VzID0gc3Jjcy5tYXAoKHNyYykgPT4gbG9hZEltYWdlKHNyYykpO1xuICBsZXQgcmVzdWx0cyA9IFtdO1xuICBmb3IgKGNvbnN0IGltYWdlUHJvbWlzZSBvZiBpbWFnZVByb21pc2VzKSB7XG4gICAgcmVzdWx0cy5wdXNoKGF3YWl0IGltYWdlUHJvbWlzZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIC8vIExvYWQgbXVsdGlwbGUgSW1hZ2UgYXNzZXRzIGFzeW5jXG4vLyBleHBvcnQgZnVuY3Rpb24gSW1hZ2VzKG9wdCkge1xuLy8gICBvcHQgPSBtZXJnZSh7XG4vLyAgICAgc3JjOiBbXSxcbi8vICAgICBub0NhY2hlOiBmYWxzZSxcbi8vICAgICBvblByb2dyZXNzOiBub29wLFxuLy8gICAgIG9uQ29tcGxldGU6IG5vb3Bcbi8vICAgfSwgb3B0IHx8IHt9KTtcbi8vXG4vLyAgIGxldCBjb3VudCA9IDA7XG4vLyAgIGxldCBsID0gb3B0LnNyYy5sZW5ndGg7XG4vL1xuLy8gICBsZXQgaW1hZ2VzO1xuLy8gICAvLyBJbWFnZSBvbmxvYWQgaGFuZGxlclxuLy8gICB2YXIgbG9hZCA9ICgpID0+IHtcbi8vICAgICBvcHQub25Qcm9ncmVzcyhNYXRoLnJvdW5kKCsrY291bnQgLyBsICogMTAwKSk7XG4vLyAgICAgaWYgKGNvdW50ID09PSBsKSB7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZShpbWFnZXMpO1xuLy8gICAgIH1cbi8vICAgfTtcbi8vICAgLy8gSW1hZ2UgZXJyb3IgaGFuZGxlclxuLy8gICB2YXIgZXJyb3IgPSAoKSA9PiB7XG4vLyAgICAgaWYgKCsrY291bnQgPT09IGwpIHtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKGltYWdlcyk7XG4vLyAgICAgfVxuLy8gICB9O1xuLy9cbi8vICAgLy8gdWlkIGZvciBpbWFnZSBzb3VyY2VzXG4vLyAgIGNvbnN0IG5vQ2FjaGUgPSBvcHQubm9DYWNoZTtcbi8vICAgY29uc3QgdWlkID0gdWlkKCk7XG4vLyAgIGZ1bmN0aW9uIGdldFN1ZmZpeChzKSB7XG4vLyAgICAgcmV0dXJuIChzLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZDtcbi8vICAgfVxuLy9cbi8vICAgLy8gQ3JlYXRlIGltYWdlIGFycmF5XG4vLyAgIGltYWdlcyA9IG9wdC5zcmMubWFwKChzcmMsIGkpID0+IHtcbi8vICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbi8vICAgICBpbWcuaW5kZXggPSBpO1xuLy8gICAgIGltZy5vbmxvYWQgPSBsb2FkO1xuLy8gICAgIGltZy5vbmVycm9yID0gZXJyb3I7XG4vLyAgICAgaW1nLnNyYyA9IHNyYyArIChub0NhY2hlID8gZ2V0U3VmZml4KHNyYykgOiAnJyk7XG4vLyAgICAgcmV0dXJuIGltZztcbi8vICAgfSk7XG4vL1xuLy8gICByZXR1cm4gaW1hZ2VzO1xuLy8gfVxuXG4vLyBMb2FkIG11bHRpcGxlIHRleHR1cmVzIGZyb20gaW1hZ2VzXG4vLyByeWU6IFRPRE8gdGhpcyBuZWVkcyB0byBpbXBsZW1lbnQgZnVuY3Rpb25hbGl0eSBmcm9tXG4vLyAgICAgICAgICAgdGhlIG9yaWdpbmFsIGxvYWRUZXh0dXJlcyBmdW5jdGlvbi5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkVGV4dHVyZXMoZ2wsIG9wdCkge1xuICB2YXIgaW1hZ2VzID0gYXdhaXQgbG9hZEltYWdlcyhvcHQuc3JjKTtcbiAgdmFyIHRleHR1cmVzID0gW107XG4gIGltYWdlcy5mb3JFYWNoKChpbWcsIGkpID0+IHtcbiAgICB2YXIgcGFyYW1zID0gQXJyYXkuaXNBcnJheShvcHQucGFyYW1ldGVycykgP1xuICAgICAgb3B0LnBhcmFtZXRlcnNbaV0gOiBvcHQucGFyYW1ldGVycztcbiAgICBwYXJhbXMgPSBwYXJhbXMgPT09IHVuZGVmaW5lZCA/IHt9IDogcGFyYW1zO1xuICAgIHRleHR1cmVzLnB1c2gobmV3IFRleHR1cmUyRChnbCwgbWVyZ2Uoe1xuICAgICAgZGF0YTogaW1nXG4gICAgfSwgcGFyYW1zKSkpO1xuICB9KTtcbiAgcmV0dXJuIHRleHR1cmVzO1xufVxuXG4vLyAvLyBMb2FkIG11bHRpcGxlIHRleHR1cmVzIGZyb20gaW1hZ2VzXG4vLyBleHBvcnQgZnVuY3Rpb24gbG9hZFRleHR1cmVzKG9wdCA9IHt9KSB7XG4vLyAgIG9wdCA9IHtcbi8vICAgICBzcmM6IFtdLFxuLy8gICAgIG5vQ2FjaGU6IGZhbHNlLFxuLy8gICAgIG9uQ29tcGxldGU6IG5vb3AsXG4vLyAgICAgLi4ub3B0XG4vLyAgIH07XG4vL1xuLy8gICBJbWFnZXMoe1xuLy8gICAgIHNyYzogb3B0LnNyYyxcbi8vICAgICBub0NhY2hlOiBvcHQubm9DYWNoZSxcbi8vICAgICBvbkNvbXBsZXRlKGltYWdlcykge1xuLy8gICAgICAgdmFyIHRleHR1cmVzID0ge307XG4vLyAgICAgICBpbWFnZXMuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4vLyAgICAgICAgIHRleHR1cmVzW29wdC5pZCAmJiBvcHQuaWRbaV0gfHwgb3B0LnNyYyAmJiBvcHQuc3JjW2ldXSA9IG1lcmdlKHtcbi8vICAgICAgICAgICBkYXRhOiB7XG4vLyAgICAgICAgICAgICB2YWx1ZTogaW1nXG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICB9LCBvcHQpO1xuLy8gICAgICAgfSk7XG4vLyAgICAgICBhcHAuc2V0VGV4dHVyZXModGV4dHVyZXMpO1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoKTtcbi8vICAgICB9XG4vLyAgIH0pO1xuLy8gfVxuIiwiLy8gRGVmYXVsdCBTaGFkZXJzXG5cbi8vIFRPRE8gLSBhZG9wdCBnbHNsaWZ5XG5jb25zdCBTaGFkZXJzID0ge1xuICBWZXJ0ZXg6IHt9LFxuICBGcmFnbWVudDoge31cbn07XG5cblNoYWRlcnMuVmVydGV4LkRlZmF1bHQgPSBgXG4jZGVmaW5lIExJR0hUX01BWCA0XG5cbi8vIG9iamVjdCBhdHRyaWJ1dGVzXG5hdHRyaWJ1dGUgdmVjMyBwb3NpdGlvbjtcbmF0dHJpYnV0ZSB2ZWMzIG5vcm1hbDtcbmF0dHJpYnV0ZSB2ZWM0IGNvbG9yO1xuYXR0cmlidXRlIHZlYzQgcGlja2luZ0NvbG9yO1xuYXR0cmlidXRlIHZlYzIgdGV4Q29vcmQxO1xuXG4vLyBjYW1lcmEgYW5kIG9iamVjdCBtYXRyaWNlc1xudW5pZm9ybSBtYXQ0IHZpZXdNYXRyaXg7XG51bmlmb3JtIG1hdDQgdmlld0ludmVyc2VNYXRyaXg7XG51bmlmb3JtIG1hdDQgcHJvamVjdGlvbk1hdHJpeDtcbnVuaWZvcm0gbWF0NCB2aWV3UHJvamVjdGlvbk1hdHJpeDtcblxuLy8gb2JqZWN0TWF0cml4ICogdmlld01hdHJpeCA9IHdvcmxkTWF0cml4XG51bmlmb3JtIG1hdDQgd29ybGRNYXRyaXg7XG51bmlmb3JtIG1hdDQgd29ybGRJbnZlcnNlTWF0cml4O1xudW5pZm9ybSBtYXQ0IHdvcmxkSW52ZXJzZVRyYW5zcG9zZU1hdHJpeDtcbnVuaWZvcm0gbWF0NCBvYmplY3RNYXRyaXg7XG51bmlmb3JtIHZlYzMgY2FtZXJhUG9zaXRpb247XG5cbi8vIGxpZ2h0aW5nIGNvbmZpZ3VyYXRpb25cbnVuaWZvcm0gYm9vbCBlbmFibGVMaWdodHM7XG51bmlmb3JtIHZlYzMgYW1iaWVudENvbG9yO1xudW5pZm9ybSB2ZWMzIGRpcmVjdGlvbmFsQ29sb3I7XG51bmlmb3JtIHZlYzMgbGlnaHRpbmdEaXJlY3Rpb247XG5cbi8vIHBvaW50IGxpZ2h0cyBjb25maWd1cmF0aW9uXG51bmlmb3JtIHZlYzMgcG9pbnRMb2NhdGlvbltMSUdIVF9NQVhdO1xudW5pZm9ybSB2ZWMzIHBvaW50Q29sb3JbTElHSFRfTUFYXTtcbnVuaWZvcm0gaW50IG51bWJlclBvaW50cztcblxuLy8gcmVmbGVjdGlvbiAvIHJlZnJhY3Rpb24gY29uZmlndXJhdGlvblxudW5pZm9ybSBib29sIHVzZVJlZmxlY3Rpb247XG5cbi8vIHZhcnlpbmdzXG52YXJ5aW5nIHZlYzMgdlJlZmxlY3Rpb247XG52YXJ5aW5nIHZlYzQgdkNvbG9yO1xudmFyeWluZyB2ZWM0IHZQaWNraW5nQ29sb3I7XG52YXJ5aW5nIHZlYzIgdlRleENvb3JkO1xudmFyeWluZyB2ZWM0IHZOb3JtYWw7XG52YXJ5aW5nIHZlYzMgbGlnaHRXZWlnaHRpbmc7XG5cbnZvaWQgbWFpbih2b2lkKSB7XG4gIHZlYzQgbXZQb3NpdGlvbiA9IHdvcmxkTWF0cml4ICogdmVjNChwb3NpdGlvbiwgMS4wKTtcbiAgdmVjNCB0cmFuc2Zvcm1lZE5vcm1hbCA9IHdvcmxkSW52ZXJzZVRyYW5zcG9zZU1hdHJpeCAqIHZlYzQobm9ybWFsLCAxLjApO1xuXG4gIC8vIGxpZ2h0aW5nIGNvZGVcbiAgaWYoIWVuYWJsZUxpZ2h0cykge1xuICAgIGxpZ2h0V2VpZ2h0aW5nID0gdmVjMygxLjAsIDEuMCwgMS4wKTtcbiAgfSBlbHNlIHtcbiAgICB2ZWMzIHBsaWdodERpcmVjdGlvbjtcbiAgICB2ZWMzIHBvaW50V2VpZ2h0ID0gdmVjMygwLjAsIDAuMCwgMC4wKTtcbiAgICBmbG9hdCBkaXJlY3Rpb25hbExpZ2h0V2VpZ2h0aW5nID1cbiAgICAgIG1heChkb3QodHJhbnNmb3JtZWROb3JtYWwueHl6LCBsaWdodGluZ0RpcmVjdGlvbiksIDAuMCk7XG4gICAgZm9yIChpbnQgaSA9IDA7IGkgPCBMSUdIVF9NQVg7IGkrKykge1xuICAgICAgaWYgKGkgPCBudW1iZXJQb2ludHMpIHtcbiAgICAgICAgcGxpZ2h0RGlyZWN0aW9uID0gbm9ybWFsaXplKFxuICAgICAgICAgICh2aWV3TWF0cml4ICogdmVjNChwb2ludExvY2F0aW9uW2ldLCAxLjApKS54eXogLSBtdlBvc2l0aW9uLnh5eik7XG4gICAgICAgICBwb2ludFdlaWdodCArPSBtYXgoXG4gICAgICAgICAgZG90KHRyYW5zZm9ybWVkTm9ybWFsLnh5eiwgcGxpZ2h0RGlyZWN0aW9uKSwgMC4wKSAqIHBvaW50Q29sb3JbaV07XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGJyZWFrO1xuICAgICAgIH1cbiAgICAgfVxuXG4gICAgbGlnaHRXZWlnaHRpbmcgPSBhbWJpZW50Q29sb3IgK1xuICAgICAgKGRpcmVjdGlvbmFsQ29sb3IgKiBkaXJlY3Rpb25hbExpZ2h0V2VpZ2h0aW5nKSArIHBvaW50V2VpZ2h0O1xuICB9XG5cbiAgLy8gcmVmcmFjdGlvbiAvIHJlZmxlY3Rpb24gY29kZVxuICBpZiAodXNlUmVmbGVjdGlvbikge1xuICAgIHZSZWZsZWN0aW9uID1cbiAgICAgICh2aWV3SW52ZXJzZU1hdHJpeFszXSAtICh3b3JsZE1hdHJpeCAqIHZlYzQocG9zaXRpb24sIDEuMCkpKS54eXo7XG4gIH0gZWxzZSB7XG4gICAgdlJlZmxlY3Rpb24gPSB2ZWMzKDEuMCwgMS4wLCAxLjApO1xuICB9XG5cbiAgLy8gcGFzcyByZXN1bHRzIHRvIHZhcnlpbmdzXG4gIHZDb2xvciA9IGNvbG9yO1xuICB2UGlja2luZ0NvbG9yID0gcGlja2luZ0NvbG9yO1xuICB2VGV4Q29vcmQgPSB0ZXhDb29yZDE7XG4gIHZOb3JtYWwgPSB0cmFuc2Zvcm1lZE5vcm1hbDtcbiAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uTWF0cml4ICogd29ybGRNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjApO1xufVxuYDtcblxuU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0ID0gYFxuXG4jaWZkZWYgR0xfRVNcbnByZWNpc2lvbiBoaWdocCBmbG9hdDtcbiNlbmRpZlxuXG4vLyB2YXJ5aW5nc1xudmFyeWluZyB2ZWM0IHZDb2xvcjtcbnZhcnlpbmcgdmVjNCB2UGlja2luZ0NvbG9yO1xudmFyeWluZyB2ZWMyIHZUZXhDb29yZDtcbnZhcnlpbmcgdmVjMyBsaWdodFdlaWdodGluZztcbnZhcnlpbmcgdmVjMyB2UmVmbGVjdGlvbjtcbnZhcnlpbmcgdmVjNCB2Tm9ybWFsO1xuXG4vLyB0ZXh0dXJlIGNvbmZpZ3NcbnVuaWZvcm0gYm9vbCBoYXNUZXh0dXJlMTtcbnVuaWZvcm0gc2FtcGxlcjJEIHNhbXBsZXIxO1xudW5pZm9ybSBib29sIGhhc1RleHR1cmVDdWJlMTtcbnVuaWZvcm0gc2FtcGxlckN1YmUgc2FtcGxlckN1YmUxO1xuXG4vLyBwaWNraW5nIGNvbmZpZ3NcbnVuaWZvcm0gYm9vbCBlbmFibGVQaWNraW5nO1xudW5pZm9ybSBib29sIGhhc1BpY2tpbmdDb2xvcnM7XG51bmlmb3JtIHZlYzMgcGlja0NvbG9yO1xuXG4vLyByZWZsZWN0aW9uIC8gcmVmcmFjdGlvbiBjb25maWdzXG51bmlmb3JtIGZsb2F0IHJlZmxlY3Rpb247XG51bmlmb3JtIGZsb2F0IHJlZnJhY3Rpb247XG5cbi8vIGZvZyBjb25maWd1cmF0aW9uXG51bmlmb3JtIGJvb2wgaGFzRm9nO1xudW5pZm9ybSB2ZWMzIGZvZ0NvbG9yO1xudW5pZm9ybSBmbG9hdCBmb2dOZWFyO1xudW5pZm9ybSBmbG9hdCBmb2dGYXI7XG5cbnZvaWQgbWFpbigpe1xuICAvLyBzZXQgY29sb3IgZnJvbSB0ZXh0dXJlXG4gIGlmICghaGFzVGV4dHVyZTEpIHtcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHZDb2xvci5yZ2IgKiBsaWdodFdlaWdodGluZywgdkNvbG9yLmEpO1xuICB9IGVsc2Uge1xuICAgIGdsX0ZyYWdDb2xvciA9XG4gICAgICB2ZWM0KHRleHR1cmUyRChzYW1wbGVyMSwgdmVjMih2VGV4Q29vcmQucywgdlRleENvb3JkLnQpKS5yZ2IgKlxuICAgICAgbGlnaHRXZWlnaHRpbmcsIDEuMCk7XG4gIH1cblxuICAvLyBoYXMgY3ViZSB0ZXh0dXJlIHRoZW4gYXBwbHkgcmVmbGVjdGlvblxuICBpZiAoaGFzVGV4dHVyZUN1YmUxKSB7XG4gICAgdmVjMyBuUmVmbGVjdGlvbiA9IG5vcm1hbGl6ZSh2UmVmbGVjdGlvbik7XG4gICAgdmVjMyByZWZsZWN0aW9uVmFsdWU7XG4gICAgaWYgKHJlZnJhY3Rpb24gPiAwLjApIHtcbiAgICAgcmVmbGVjdGlvblZhbHVlID0gcmVmcmFjdChuUmVmbGVjdGlvbiwgdk5vcm1hbC54eXosIHJlZnJhY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgIHJlZmxlY3Rpb25WYWx1ZSA9IC1yZWZsZWN0KG5SZWZsZWN0aW9uLCB2Tm9ybWFsLnh5eik7XG4gICAgfVxuXG4gICAgLy8gVE9ETyhuaWNvKTogY2hlY2sgd2hldGhlciB0aGlzIGlzIHJpZ2h0LlxuICAgIHZlYzQgY3ViZUNvbG9yID0gdGV4dHVyZUN1YmUoc2FtcGxlckN1YmUxLFxuICAgICAgICB2ZWMzKC1yZWZsZWN0aW9uVmFsdWUueCwgLXJlZmxlY3Rpb25WYWx1ZS55LCByZWZsZWN0aW9uVmFsdWUueikpO1xuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQobWl4KGdsX0ZyYWdDb2xvci54eXosIGN1YmVDb2xvci54eXosIHJlZmxlY3Rpb24pLCAxLjApO1xuICB9XG5cbiAgLy8gc2V0IHBpY2tpbmdcbiAgaWYgKGVuYWJsZVBpY2tpbmcpIHtcbiAgICBpZiAoaGFzUGlja2luZ0NvbG9ycykge1xuICAgICAgZ2xfRnJhZ0NvbG9yID0gdlBpY2tpbmdDb2xvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNChwaWNrQ29sb3IsIDEuMCk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIGZvZ1xuICBpZiAoaGFzRm9nKSB7XG4gICAgZmxvYXQgZGVwdGggPSBnbF9GcmFnQ29vcmQueiAvIGdsX0ZyYWdDb29yZC53O1xuICAgIGZsb2F0IGZvZ0ZhY3RvciA9IHNtb290aHN0ZXAoZm9nTmVhciwgZm9nRmFyLCBkZXB0aCk7XG4gICAgZ2xfRnJhZ0NvbG9yID1cbiAgICAgIG1peChnbF9GcmFnQ29sb3IsIHZlYzQoZm9nQ29sb3IsIGdsX0ZyYWdDb2xvci53KSwgZm9nRmFjdG9yKTtcbiAgIH1cbiB9XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBTaGFkZXJzO1xuIiwiLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8qKlxuICogV3JhcHMgdGhlIGFyZ3VtZW50IGluIGFuIGFycmF5IGlmIGl0IGlzIG5vdCBvbmUuXG4gKiBAcGFyYW0ge29iamVjdH0gYSAtIFRoZSBvYmplY3QgdG8gd3JhcC5cbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwbGF0KGEpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSkgJiYgYSB8fCBbYV07XG59XG5cbi8qKlxuKiBQcm92aWRlcyBhIHN0YW5kYXJkIG5vb3AgZnVuY3Rpb24uXG4qKi9cbmV4cG9ydCBmdW5jdGlvbiBub29wKCkge31cblxudmFyIF91aWQgPSBEYXRlLm5vdygpO1xuXG4vKipcbiAqIFJldHVybnMgYSBVSUQuXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHVpZFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHVpZCgpIHtcbiAgcmV0dXJuIF91aWQrKztcbn1cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBvYmplY3RzIGludG8gb25lLlxuICogQHBhcmFtIHsuLi5vYmplY3R9IG9iamVjdHMgLSBUaGUgb2JqZWN0cyB0byBtZXJnZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2Uob2JqZWN0cykge1xuICBjb25zdCBtaXggPSB7fTtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gYXJndW1lbnRzW2ldO1xuICAgIGlmIChvYmplY3QuY29uc3RydWN0b3IubmFtZSAhPT0gJ09iamVjdCcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBjb25zdCBvcCA9IG9iamVjdFtrZXldO1xuICAgICAgY29uc3QgbXAgPSBtaXhba2V5XTtcbiAgICAgIGlmIChtcCAmJiBvcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JyAmJlxuICAgICAgICBtcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0Jykge1xuICAgICAgICBtaXhba2V5XSA9IG1lcmdlKG1wLCBvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtaXhba2V5XSA9IGRldGFjaChvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtaXg7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGR1cGxpY2F0aW5nIGFuIG9iamVjdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtIC0gVGhlIG9iamVjdCB0byByZWN1cnNpdmVseSBkdXBsaWNhdGUuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZnVuY3Rpb24gZGV0YWNoKGVsZW0pIHtcbiAgY29uc3QgdCA9IGVsZW0uY29uc3RydWN0b3IubmFtZTtcbiAgbGV0IGFucztcbiAgaWYgKHQgPT09ICdPYmplY3QnKSB7XG4gICAgYW5zID0ge307XG4gICAgZm9yICh2YXIgcCBpbiBlbGVtKSB7XG4gICAgICBhbnNbcF0gPSBkZXRhY2goZWxlbVtwXSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHQgPT09ICdBcnJheScpIHtcbiAgICBhbnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVsZW0ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBhbnNbaV0gPSBkZXRhY2goZWxlbVtpXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGFucyA9IGVsZW07XG4gIH1cblxuICByZXR1cm4gYW5zO1xufVxuXG4vLyBUWVBFRCBBUlJBWVNcblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZWRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuQllURVNfUEVSX0VMRU1FTlQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlVHlwZWRBcnJheShBcnJheVR5cGUsIHNvdXJjZUFycmF5KSB7XG4gIGFzc2VydChBcnJheS5pc0FycmF5KHNvdXJjZUFycmF5KSk7XG4gIGNvbnN0IGFycmF5ID0gbmV3IEFycmF5VHlwZShzb3VyY2VBcnJheS5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZUFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgYXJyYXlbaV0gPSBzb3VyY2VBcnJheVtpXTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG4iLCIvLyBFbmNhcHN1bGF0ZXMgYSBXZWJHTEJ1ZmZlciBvYmplY3RcblxuaW1wb3J0IHtnZXRFeHRlbnNpb24sIGdsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnVmZmVyIHtcblxuICBzdGF0aWMgZ2V0RGVmYXVsdE9wdHMoZ2wpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnVmZmVyVHlwZTogZ2wuQVJSQVlfQlVGRkVSLFxuICAgICAgc2l6ZTogMSxcbiAgICAgIGRhdGFUeXBlOiBnbC5GTE9BVCxcbiAgICAgIHN0cmlkZTogMCxcbiAgICAgIG9mZnNldDogMCxcbiAgICAgIGRyYXdNb2RlOiBnbC5TVEFUSUNfRFJBVyxcbiAgICAgIGluc3RhbmNlZDogMFxuICAgIH07XG4gIH1cblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIFNldCB1cCBhIGdsIGJ1ZmZlciBvbmNlIGFuZCByZXBlYXRlZGx5IGJpbmQgYW5kIHVuYmluZCBpdC5cbiAgICogSG9sZHMgYW4gYXR0cmlidXRlIG5hbWUgYXMgYSBjb252ZW5pZW5jZS4uLlxuICAgKlxuICAgKiBAcGFyYW17fSBvcHRzLmRhdGEgLSBuYXRpdmUgYXJyYXlcbiAgICogQHBhcmFte3N0cmluZ30gb3B0cy5hdHRyaWJ1dGUgLSBuYW1lIG9mIGF0dHJpYnV0ZSBmb3IgbWF0Y2hpbmdcbiAgICogQHBhcmFte30gb3B0cy5idWZmZXJUeXBlIC0gYnVmZmVyIHR5cGUgKGNhbGxlZCBcInRhcmdldFwiIGluIEdMIGRvY3MpXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIGFzc2VydChnbCwgJ0J1ZmZlciBuZWVkcyBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBCdWZmZXIuZ2V0RGVmYXVsdE9wdHMoZ2wpLCBvcHRzKTtcbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVCdWZmZXIodGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gdG9kbyAtIHJlbW92ZVxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuZGVsZXRlKCk7XG4gIH1cblxuICAvKiBVcGRhdGVzIGRhdGEgaW4gdGhlIGJ1ZmZlciAqL1xuICB1cGRhdGUob3B0cyA9IHt9KSB7XG4gICAgdGhpcy5hdHRyaWJ1dGUgPSBvcHRzLmF0dHJpYnV0ZSB8fCB0aGlzLmF0dHJpYnV0ZTtcbiAgICB0aGlzLmJ1ZmZlclR5cGUgPSBvcHRzLmJ1ZmZlclR5cGUgfHwgdGhpcy5idWZmZXJUeXBlO1xuICAgIHRoaXMuc2l6ZSA9IG9wdHMuc2l6ZSB8fCB0aGlzLnNpemU7XG4gICAgdGhpcy5kYXRhVHlwZSA9IG9wdHMuZGF0YVR5cGUgfHwgdGhpcy5kYXRhVHlwZTtcbiAgICB0aGlzLnN0cmlkZSA9IG9wdHMuc3RyaWRlIHx8IHRoaXMuc3RyaWRlO1xuICAgIHRoaXMub2Zmc2V0ID0gb3B0cy5vZmZzZXQgfHwgdGhpcy5vZmZzZXQ7XG4gICAgdGhpcy5kcmF3TW9kZSA9IG9wdHMuZHJhd01vZGUgfHwgdGhpcy5kcmF3TW9kZTtcbiAgICB0aGlzLmluc3RhbmNlZCA9IG9wdHMuaW5zdGFuY2VkIHx8IHRoaXMuaW5zdGFuY2VkO1xuXG4gICAgdGhpcy5kYXRhID0gb3B0cy5kYXRhIHx8IHRoaXMuZGF0YTtcbiAgICBpZiAodGhpcy5kYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuYnVmZmVyRGF0YSh0aGlzLmRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qIFVwZGF0ZXMgZGF0YSBpbiB0aGUgYnVmZmVyICovXG4gIGJ1ZmZlckRhdGEoZGF0YSkge1xuICAgIGFzc2VydChkYXRhLCAnQnVmZmVyLmJ1ZmZlckRhdGEgbmVlZHMgZGF0YScpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuZGF0YSwgdGhpcy5kcmF3TW9kZSk7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhdHRhY2hUb0xvY2F0aW9uKGxvY2F0aW9uKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgLy8gQmluZCB0aGUgYnVmZmVyIHNvIHRoYXQgd2UgY2FuIG9wZXJhdGUgb24gaXRcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5oYW5kbGUpO1xuICAgIGlmIChsb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLy8gRW5hYmxlIHRoZSBhdHRyaWJ1dGVcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2NhdGlvbik7XG4gICAgLy8gU3BlY2lmeSBidWZmZXIgZm9ybWF0XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihcbiAgICAgIGxvY2F0aW9uLFxuICAgICAgdGhpcy5zaXplLCB0aGlzLmRhdGFUeXBlLCBmYWxzZSwgdGhpcy5zdHJpZGUsIHRoaXMub2Zmc2V0XG4gICAgKTtcbiAgICBpZiAodGhpcy5pbnN0YW5jZWQpIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihnbCwgJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICAgIC8vIFRoaXMgbWFrZXMgaXQgYW4gaW5zdGFuY2VkIGF0dHJpYnV0ZVxuICAgICAgZXh0ZW5zaW9uLnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShsb2NhdGlvbiwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGV0YWNoRnJvbUxvY2F0aW9uKGxvY2F0aW9uKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2VkKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZ2wsICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgICAvLyBDbGVhciBpbnN0YW5jZWQgZmxhZ1xuICAgICAgZXh0ZW5zaW9uLnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShsb2NhdGlvbiwgMCk7XG4gICAgfVxuICAgIC8vIERpc2FibGUgdGhlIGF0dHJpYnV0ZVxuICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2NhdGlvbik7XG4gICAgLy8gVW5iaW5kIHRoZSBidWZmZXIgcGVyIHdlYmdsIHJlY29tbWVuZGF0aW9uc1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuIiwiLy8gV2ViR0xSZW5kZXJpbmdDb250ZXh0IHJlbGF0ZWQgbWV0aG9kc1xuLyogZXNsaW50LWRpc2FibGUgbm8tdHJ5LWNhdGNoLCBuby1jb25zb2xlLCBuby1sb29wLWZ1bmMgKi9cbi8qIGdsb2JhbCB3aW5kb3csIGRvY3VtZW50LCBjb25zb2xlICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIENoZWNrcyBpZiBXZWJHTCBpcyBlbmFibGVkIGFuZCBjcmVhdGVzIGEgY29udGV4dCBmb3IgdXNpbmcgV2ViR0wuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlR0xDb250ZXh0KGNhbnZhcywgb3B0ID0ge30pIHtcbiAgaWYgKCFpc0Jyb3dzZXJDb250ZXh0KCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbid0IGNyZWF0ZSBhIFdlYkdMIGNvbnRleHQgb3V0c2lkZSBhIGJyb3dzZXIgY29udGV4dC5gKTtcbiAgfVxuICBjYW52YXMgPSB0eXBlb2YgY2FudmFzID09PSAnc3RyaW5nJyA/XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzKSA6IGNhbnZhcztcblxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2ViZ2xjb250ZXh0Y3JlYXRpb25lcnJvcicsIGUgPT4ge1xuICAgIGNvbnNvbGUubG9nKGUuc3RhdHVzTWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcicpO1xuICB9LCBmYWxzZSk7XG5cbiAgLy8gUHJlZmVyIHdlYmdsMiBvdmVyIHdlYmdsMSwgcHJlZmVyIGNvbmZvcm1hbnQgb3ZlciBleHBlcmltZW50YWxcbiAgbGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsMicsIG9wdCk7XG4gIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbDInLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcsIG9wdCk7XG4gIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIG9wdCk7XG5cbiAgYXNzZXJ0KGdsLCAnRmFpbGVkIHRvIGNyZWF0ZSBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcblxuICAvLyBTZXQgYXMgZGVidWcgaGFuZGxlclxuICBnbCA9IG9wdC5kZWJ1ZyA/IGNyZWF0ZURlYnVnQ29udGV4dChnbCkgOiBnbDtcblxuICAvLyBBZGQgYSBzYWZlIGdldCBtZXRob2RcbiAgZ2wuZ2V0ID0gZnVuY3Rpb24gZ2xHZXQobmFtZSkge1xuICAgIGxldCB2YWx1ZSA9IG5hbWU7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdO1xuICAgICAgYXNzZXJ0KHZhbHVlLCBgQWNjZXNzaW5nIGdsLiR7bmFtZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIHJldHVybiBnbDtcblxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzV2ViR0woKSB7XG4gIGlmICghaXNCcm93c2VyQ29udGV4dCgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIEZlYXR1cmUgdGVzdCBXZWJHTFxuICB0cnkge1xuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHJldHVybiBCb29sZWFuKHdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQgJiZcbiAgICAgIChjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJykpKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0V4dGVuc2lvbihuYW1lKSB7XG4gIGlmICghaGFzV2ViR0woKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpIHx8XG4gICAgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpO1xuICAvLyBTaG91bGQgbWF5YmUgYmUgcmV0dXJuICEhY29udGV4dC5nZXRFeHRlbnNpb24obmFtZSk7XG4gIHJldHVybiBjb250ZXh0LmdldEV4dGVuc2lvbihuYW1lKTtcbn1cblxuLy8gUmV0dXJucyB0aGUgZXh0ZW5zaW9uIG9yIHRocm93cyBhbiBlcnJvclxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dGVuc2lvbihnbCwgZXh0ZW5zaW9uTmFtZSkge1xuICBjb25zdCBleHRlbnNpb24gPSBnbC5nZXRFeHRlbnNpb24oZXh0ZW5zaW9uTmFtZSk7XG4gIGFzc2VydChleHRlbnNpb24sIGAke2V4dGVuc2lvbk5hbWV9IG5vdCBzdXBwb3J0ZWQhYCk7XG4gIHJldHVybiBleHRlbnNpb247XG59XG5cbmZ1bmN0aW9uIGlzQnJvd3NlckNvbnRleHQoKSB7XG4gIHJldHVybiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbn1cblxuLy8gRXhlY3V0ZXMgYSBmdW5jdGlvbiB3aXRoIGdsIHN0YXRlcyB0ZW1wb3JhcmlseSBzZXQsIGV4Y2VwdGlvbiBzYWZlXG4vLyBDdXJyZW50bHkgc3VwcG9ydCBzY2lzc29yIHRlc3QgYW5kIGZyYW1lYnVmZmVyIGJpbmRpbmdcbmV4cG9ydCBmdW5jdGlvbiBnbENvbnRleHRXaXRoU3RhdGUoZ2wsIHtzY2lzc29yVGVzdCwgZnJhbWVCdWZmZXJ9LCBmdW5jKSB7XG4gIGxldCBzY2lzc29yVGVzdFdhc0VuYWJsZWQ7XG4gIGlmIChzY2lzc29yVGVzdCkge1xuICAgIHNjaXNzb3JUZXN0V2FzRW5hYmxlZCA9IGdsLmlzRW5hYmxlZChnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGNvbnN0IHt4LCB5LCB3LCBofSA9IHNjaXNzb3JUZXN0O1xuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgeSwgdywgaCk7XG4gIH1cblxuICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAvLyBUT0RPIC0gd2FzIHRoZXJlIGFueSBwcmV2aW91c2x5IHNldCBmcmFtZSBidWZmZXIgd2UgbmVlZCB0byByZW1lbWJlcj9cbiAgICBmcmFtZUJ1ZmZlci5iaW5kKCk7XG4gIH1cblxuICB0cnkge1xuICAgIGZ1bmMoZ2wpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2Npc3NvclRlc3RXYXNFbmFibGVkKSB7XG4gICAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgfVxuICAgIGlmIChmcmFtZUJ1ZmZlcikge1xuICAgICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyP1xuICAgICAgLy8gVE9ETyAtIGRlbGVnYXRlIFwidW5iaW5kXCIgdG8gRnJhbWVidWZmZXIgb2JqZWN0P1xuICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdsQ2hlY2tFcnJvcjIoZ2wpIHtcbiAgZ2xDaGVja0Vycm9yKGdsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdsQ2hlY2tFcnJvcihnbCkge1xuICBjb25zdCBlcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIHN3aXRjaCAoZXJyb3IpIHtcbiAgY2FzZSBnbC5OT19FUlJPUjpcbiAgICAvLyAgTm8gZXJyb3IgaGFzIGJlZW4gcmVjb3JkZWQuIFRoZSB2YWx1ZSBvZiB0aGlzIGNvbnN0YW50IGlzIDAuXG4gICAgcmV0dXJuO1xuXG4gIGNhc2UgZ2wuQ09OVEVYVF9MT1NUX1dFQkdMOlxuICAgIC8vICBJZiB0aGUgV2ViR0wgY29udGV4dCBpcyBsb3N0LCB0aGlzIGVycm9yIGlzIHJldHVybmVkIG9uIHRoZVxuICAgIC8vIGZpcnN0IGNhbGwgdG8gZ2V0RXJyb3IuIEFmdGVyd2FyZHMgYW5kIHVudGlsIHRoZSBjb250ZXh0IGhhcyBiZWVuXG4gICAgLy8gcmVzdG9yZWQsIGl0IHJldHVybnMgZ2wuTk9fRVJST1IuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdXZWJHTCBjb250ZXh0IGxvc3QnKTtcblxuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHRocm93IG5ldyBFcnJvcignV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50Jyk7XG5cbiAgY2FzZSBnbC5JTlZBTElEX1ZBTFVFOlxuICAgIC8vIEEgbnVtZXJpYyBhcmd1bWVudCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdXZWJHTCBpbnZhbGlkIHZhbHVlJyk7XG5cbiAgY2FzZSBnbC5JTlZBTElEX09QRVJBVElPTjpcbiAgICAvLyBUaGUgc3BlY2lmaWVkIGNvbW1hbmQgaXMgbm90IGFsbG93ZWQgZm9yIHRoZSBjdXJyZW50IHN0YXRlLlxuICAgIHRocm93IG5ldyBFcnJvcignV2ViR0wgaW52YWxpZCBvcGVyYXRpb24nKTtcblxuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJyk7XG5cbiAgY2FzZSBnbC5PVVRfT0ZfTUVNT1JZOlxuICAgIC8vIE5vdCBlbm91Z2ggbWVtb3J5IGlzIGxlZnQgdG8gZXhlY3V0ZSB0aGUgY29tbWFuZC5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYkdMIG91dCBvZiBtZW1vcnknKTtcblxuICBkZWZhdWx0OlxuICAgIC8vIE5vdCBlbm91Z2ggbWVtb3J5IGlzIGxlZnQgdG8gZXhlY3V0ZSB0aGUgY29tbWFuZC5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYkdMIHVua25vd24gZXJyb3InKTtcbiAgfVxufVxuXG4vLyBUT0RPIC0gZG9jdW1lbnQgb3IgcmVtb3ZlXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z0NvbnRleHQoY3R4KSB7XG4gIGNvbnN0IGdsID0ge307XG4gIGZvciAodmFyIG0gaW4gY3R4KSB7XG4gICAgdmFyIGYgPSBjdHhbbV07XG4gICAgaWYgKHR5cGVvZiBmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBnbFttXSA9ICgoaywgdikgPT4ge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBhbnM7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFucyA9IHYuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtrfSAke2V9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgICAgd2hpbGUgKChlcnJvciA9IGN0eC5nZXRFcnJvcigpKSAhPT0gY3R4Lk5PX0VSUk9SKSB7XG4gICAgICAgICAgICBlcnJvclN0YWNrLnB1c2goZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXJyb3JTdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yU3RhY2suam9pbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICB9O1xuICAgICAgfSkobSwgZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsW21dID0gZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2w7XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETyAtIGdlbmVyaWMgZHJhdyBjYWxsXG4vLyBPbmUgb2YgdGhlIGdvb2QgdGhpbmdzIGFib3V0IEdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5nc1xuaW1wb3J0IHtnZXRFeHRlbnNpb259IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge0dMX0lOREVYX1RZUEVTLCBHTF9EUkFXX01PREVTfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQSBnb29kIHRoaW5nIGFib3V0IHdlYkdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5ncy4uLlxuLy8gVE9ETyAtIFVzZSBwb2x5ZmlsbGVkIFdlYkdMMiBtZXRob2RzIGluc3RlYWQgb2YgQU5HTEUgZXh0ZW5zaW9uXG5leHBvcnQgZnVuY3Rpb24gZHJhdyhnbCwge1xuICBkcmF3TW9kZSwgdmVydGV4Q291bnQsIG9mZnNldCA9IDAsXG4gIGluZGV4ZWQsIGluZGV4VHlwZSA9IG51bGwsXG4gIGluc3RhbmNlZCA9IGZhbHNlLCBpbnN0YW5jZUNvdW50ID0gMFxufSkge1xuICBkcmF3TW9kZSA9IGdsLmdldChkcmF3TW9kZSk7XG4gIGluZGV4VHlwZSA9IGdsLmdldChpbmRleFR5cGUpIHx8IGdsLlVOU0lHTkVEX1NIT1JUO1xuXG4gIGFzc2VydChHTF9EUkFXX01PREVTKGdsKS5pbmRleE9mKGRyYXdNb2RlKSA+IC0xLCAnSW52YWxpZCBkcmF3IG1vZGUnKTtcbiAgYXNzZXJ0KEdMX0lOREVYX1RZUEVTKGdsKS5pbmRleE9mKGluZGV4VHlwZSkgPiAtMSwgJ0ludmFsaWQgaW5kZXggdHlwZScpO1xuXG4gIGlmIChpbnN0YW5jZWQpIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBnbC5nZXRFeHRlbnNpb24oJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICBpZiAoaW5kZXhlZCkge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdFbGVtZW50c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0LCBpbnN0YW5jZUNvdW50XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHRlbnNpb24uZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5kZXhlZCkge1xuICAgIGdsLmRyYXdFbGVtZW50cyhkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0KTtcbiAgfSBlbHNlIHtcbiAgICBnbC5kcmF3QXJyYXlzKGRyYXdNb2RlLCBvZmZzZXQsIHZlcnRleENvdW50KTtcbiAgfVxufVxuXG4vLyBDYWxsIHRoZSBwcm9wZXIgZHJhdyBmdW5jdGlvbiBmb3IgdGhlIHVzZWQgcHJvZ3JhbSBiYXNlZCBvbiBhdHRyaWJ1dGVzIGV0Y1xuZXhwb3J0IGZ1bmN0aW9uIGRyYXcyKHtnbCwgZHJhd01vZGUsIGVsZW1lbnRUeXBlLCBjb3VudCxcbiAgaW5kaWNlcywgdmVydGljZXMsIGluc3RhbmNlZCwgbnVtSW5zdGFuY2VzfSkge1xuICBjb25zdCBudW1JbmRpY2VzID0gaW5kaWNlcyA/IGluZGljZXMudmFsdWUubGVuZ3RoIDogMDtcbiAgY29uc3QgbnVtVmVydGljZXMgPSB2ZXJ0aWNlcyA/IHZlcnRpY2VzLnZhbHVlLmxlbmd0aCAvIDMgOiAwO1xuICBjb3VudCA9IGNvdW50IHx8IG51bUluZGljZXMgfHwgbnVtVmVydGljZXM7XG4gIHJldHVybiBkcmF3KHtnbCwgZHJhd01vZGUsIGVsZW1lbnRUeXBlLCBjb3VudCwgfSk7XG59XG5cbi8vIENhbGwgdGhlIHByb3BlciBkcmF3IGZ1bmN0aW9uIGZvciB0aGUgdXNlZCBwcm9ncmFtIGJhc2VkIG9uIGF0dHJpYnV0ZXMgZXRjXG5leHBvcnQgZnVuY3Rpb24gZHJhdzMoe2dsLCBkcmF3TW9kZSwgaW5kZXhUeXBlLCBudW1Qb2ludHMsIG51bUluc3RhbmNlc30pIHtcbiAgZHJhd01vZGUgPSBkcmF3TW9kZSB8fCBnbC5QT0lOVFM7XG5cbiAgYXNzZXJ0KEdMX0RSQVdfTU9ERVMoZ2wpLmluZGV4T2YoaW5kZXhUeXBlKSA+IC0xLCAnSW52YWxpZCBkcmF3IG1vZGUnKTtcbiAgYXNzZXJ0KEdMX0lOREVYX1RZUEVTKGdsKS5pbmRleE9mKGluZGV4VHlwZSkgPiAtMSwgJ0ludmFsaWQgaW5kZXggdHlwZScpO1xuXG4gIGlmIChudW1JbnN0YW5jZXMpIHtcbiAgICAvLyB0aGlzIGluc3RhbmNlZCBwcmltaXRpdmUgZG9lcyBoYXMgaW5kaWNlcywgdXNlIGRyYXdFbGVtZW50cyBleHRlbnNpb25cbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICBleHRlbnNpb24uZHJhd0VsZW1lbnRzSW5zdGFuY2VkQU5HTEUoXG4gICAgICBkcmF3TW9kZSwgbnVtUG9pbnRzLCBpbmRleFR5cGUsIDAsIG51bUluc3RhbmNlc1xuICAgICk7XG4gIH0gZWxzZSBpZiAoaW5kaWNlcykge1xuICAgIGdsLmRyYXdFbGVtZW50cyhkcmF3TW9kZSwgbnVtSW5kaWNlcywgaW5kZXhUeXBlLCAwKTtcbiAgfSBlbHNlIGlmIChudW1JbnN0YW5jZXMgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIHRoaXMgaW5zdGFuY2VkIHByaW1pdGl2ZSBkb2VzIG5vdCBoYXZlIGluZGljZXMsIHVzZSBkcmF3QXJyYXlzIGV4dFxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbignQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgIGV4dGVuc2lvbi5kcmF3QXJyYXlzSW5zdGFuY2VkQU5HTEUoXG4gICAgICBkcmF3TW9kZSwgMCwgbnVtUG9pbnRzLCBudW1JbnN0YW5jZXNcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGVsc2UgaWYgdGhpcy5wcmltaXRpdmUgZG9lcyBub3QgaGF2ZSBpbmRpY2VzXG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgMCwgbnVtUG9pbnRzKTtcbiAgfVxufVxuIiwiXG5pbXBvcnQge1RleHR1cmUyRH0gZnJvbSAnLi90ZXh0dXJlJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnJhbWVidWZmZXIge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzID0ge30pIHtcbiAgICB0aGlzLmdsID0gZ2w7XG5cbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aCA/IG9wdHMud2lkdGggOiAxO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQgPyBvcHRzLmhlaWdodCA6IDE7XG4gICAgdGhpcy5kZXB0aCA9IG9wdHMuZGVwdGggPT09IHVuZGVmaW5lZCA/IHRydWUgOiBvcHRzLmRlcHRoO1xuICAgIHRoaXMubWluRmlsdGVyID0gb3B0cy5taW5GaWx0ZXIgfHwgZ2wuTkVBUkVTVDtcbiAgICB0aGlzLm1hZ0ZpbHRlciA9IG9wdHMubWFnRmlsdGVyIHx8IGdsLk5FQVJFU1Q7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRzLmZvcm1hdCB8fCBnbC5SR0JBO1xuICAgIHRoaXMudHlwZSA9IG9wdHMudHlwZSB8fCBnbC5VTlNJR05FRF9CWVRFO1xuICAgIHRoaXMuZmJvID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICB0aGlzLmJpbmQoKTtcblxuICAgIHRoaXMudGV4dHVyZSA9IG5ldyBUZXh0dXJlMkQoZ2wsIHtcbiAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgIG1pbkZpbHRlcjogdGhpcy5taW5GaWx0ZXIsXG4gICAgICBtYWdGaWx0ZXI6IHRoaXMubWFnRmlsdGVyLFxuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgZm9ybWF0OiB0aGlzLmZvcm1hdFxuICAgIH0pO1xuXG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoXG4gICAgICBnbC5GUkFNRUJVRkZFUixcbiAgICAgIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUudGV4dHVyZSwgMFxuICAgICk7XG5cbiAgICBpZiAodGhpcy5kZXB0aCkge1xuICAgICAgdGhpcy5kZXB0aCA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIHRoaXMuZGVwdGgpO1xuICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShcbiAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9DT01QT05FTlQxNiwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHRcbiAgICAgICk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihcbiAgICAgICAgZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX0FUVEFDSE1FTlQsIGdsLlJFTkRFUkJVRkZFUiwgdGhpcy5kZXB0aFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgc3RhdHVzID0gZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUik7XG4gICAgaWYgKHN0YXR1cyAhPT0gZ2wuRlJBTUVCVUZGRVJfQ09NUExFVEUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRnJhbWVidWZmZXIgY3JlYXRpb24gZmFpbGVkLicpO1xuICAgIH1cblxuICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuXG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZmJvKTtcbiAgfVxuXG59XG4iLCIvLyBDb250YWlucyBjbGFzcyBhbmQgZnVuY3Rpb24gd3JhcHBlcnMgYXJvdW5kIGxvdyBsZXZlbCB3ZWJnbCBvYmplY3RzXG4vLyBUaGVzZSBjbGFzc2VzIGFyZSBpbnRlbmRlZCB0byBzdGF5IGNsb3NlIHRvIHRoZSBXZWJHTCBBUEkgc2VtYW50aWNzXG4vLyBidXQgbWFrZSBpdCBlYXNpZXIgdG8gdXNlLlxuLy8gSGlnaGVyIGxldmVsIGFic3RyYWN0aW9ucyBjYW4gYmUgYnVpbHQgb24gdGhlc2UgY2xhc3Nlc1xuZXhwb3J0ICogZnJvbSAnLi90eXBlcyc7XG5leHBvcnQgKiBmcm9tICcuL2NvbnRleHQnO1xuZXhwb3J0ICogZnJvbSAnLi9kcmF3JztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBCdWZmZXJ9IGZyb20gJy4vYnVmZmVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBQcm9ncmFtfSBmcm9tICcuL3Byb2dyYW0nO1xuZXhwb3J0IHtkZWZhdWx0IGFzIEZyYW1lYnVmZmVyfSBmcm9tICcuL2Zibyc7XG5leHBvcnQge1RleHR1cmUyRCwgVGV4dHVyZUN1YmV9IGZyb20gJy4vdGV4dHVyZSc7XG4iLCIvLyBDcmVhdGVzIHByb2dyYW1zIG91dCBvZiBzaGFkZXJzIGFuZCBwcm92aWRlcyBjb252ZW5pZW50IG1ldGhvZHMgZm9yIGxvYWRpbmdcbi8vIGJ1ZmZlcnMgYXR0cmlidXRlcyBhbmQgdW5pZm9ybXNcblxuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSwgY29tcGxleGl0eSAqL1xuXG4vKiBnbG9iYWwgY29uc29sZSAqL1xuaW1wb3J0IHtnbENoZWNrRXJyb3IyfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7VmVydGV4U2hhZGVyLCBGcmFnbWVudFNoYWRlcn0gZnJvbSAnLi9zaGFkZXInO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyYW0ge1xuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogSGFuZGxlcyBjcmVhdGlvbiBvZiBwcm9ncmFtcywgbWFwcGluZyBvZiBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gZ2wgY29udGV4dFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudnMgLSBWZXJ0ZXggc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5mcyAtIEZyYWdtZW50IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuaWQ9IC0gSWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzLCBmcywgaWQpIHtcbiAgICBsZXQgdnM7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS53YXJuKCdERVBSRUNBVEVEOiBOZXcgdXNlOiBQcm9ncmFtKGdsLCB7dnMsIGZzLCBpZH0pJyk7XG4gICAgICB2cyA9IG9wdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZzID0gb3B0cy52cztcbiAgICAgIGZzID0gb3B0cy5mcztcbiAgICAgIGlkID0gb3B0cy5pZDtcbiAgICB9XG5cbiAgICB2cyA9IHZzIHx8IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQ7XG4gICAgZnMgPSBmcyB8fCBTaGFkZXJzLkZyYWdtZW50LkRlZmF1bHQ7XG5cbiAgICBjb25zdCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIGlmICghcHJvZ3JhbSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHByb2dyYW0nKTtcbiAgICB9XG5cbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgbmV3IFZlcnRleFNoYWRlcihnbCwgdnMpLmhhbmRsZSk7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBGcmFnbWVudFNoYWRlcihnbCwgZnMpLmhhbmRsZSk7XG4gICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG4gICAgY29uc3QgbGlua2VkID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUyk7XG4gICAgaWYgKCFsaW5rZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgbGlua2luZyAke2dsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pfWApO1xuICAgIH1cblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmlkID0gaWQgfHwgdWlkKCk7XG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAvLyBkZXRlcm1pbmUgYXR0cmlidXRlIGxvY2F0aW9ucyAoaS5lLiBpbmRpY2VzKVxuICAgIHRoaXMuYXR0cmlidXRlTG9jYXRpb25zID0gZ2V0QXR0cmlidXRlTG9jYXRpb25zKGdsLCBwcm9ncmFtKTtcbiAgICAvLyBwcmVwYXJlIHVuaWZvcm0gc2V0dGVyc1xuICAgIHRoaXMudW5pZm9ybVNldHRlcnMgPSBnZXRVbmlmb3JtU2V0dGVycyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gbm8gYXR0cmlidXRlcyBlbmFibGVkIHlldFxuICAgIHRoaXMuYXR0cmlidXRlRW5hYmxlZCA9IHt9O1xuICB9XG5cbiAgdXNlKCkge1xuICAgIHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VGV4dHVyZSh0ZXh0dXJlLCBpbmRleCkge1xuICAgIHRleHR1cmUuYmluZChpbmRleCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRVbmlmb3JtKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKG5hbWUgaW4gdGhpcy51bmlmb3JtU2V0dGVycykge1xuICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybXModW5pZm9ybU1hcCkge1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyh1bmlmb3JtTWFwKSkge1xuICAgICAgaWYgKG5hbWUgaW4gdGhpcy51bmlmb3JtU2V0dGVycykge1xuICAgICAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzW25hbWVdKHVuaWZvcm1NYXBbbmFtZV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlci5hdHRyaWJ1dGVdO1xuICAgIGJ1ZmZlci5hdHRhY2hUb0xvY2F0aW9uKGxvY2F0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEJ1ZmZlcnMoYnVmZmVycykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpLCAnUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgYXJyYXknKTtcbiAgICBidWZmZXJzID0gYnVmZmVycy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShidWZmZXJzWzBdKSA/XG4gICAgICBidWZmZXJzWzBdIDogYnVmZmVycztcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBidWZmZXJzKSB7XG4gICAgICB0aGlzLnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0QnVmZmVyKGJ1ZmZlcikge1xuICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyLmF0dHJpYnV0ZV07XG4gICAgYnVmZmVyLmRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcnMoYnVmZmVycykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpLCAnUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgYXJyYXknKTtcbiAgICBidWZmZXJzID0gYnVmZmVycy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShidWZmZXJzWzBdKSA/XG4gICAgICBidWZmZXJzWzBdIDogYnVmZmVycztcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBidWZmZXJzKSB7XG4gICAgICB0aGlzLnVuc2V0QnVmZmVyKGJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuLy8gVE9ETyAtIHVzZSB0YWJsZXMgdG8gcmVkdWNlIGNvbXBsZXhpdHkgb2YgbWV0aG9kIGJlbG93XG4vLyBjb25zdCBnbFVuaWZvcm1TZXR0ZXIgPSB7XG4vLyAgIEZMT0FUOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgRkxPQVRfVkVDMzoge2Z1bmN0aW9uOiAndW5pZm9ybTNmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX01BVDQ6IHtmdW5jdGlvbjogJ3VuaWZvcm1NYXRyaXg0ZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBJTlQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIEJPT0w6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIFNBTVBMRVJfMkQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIFNBTVBMRVJfQ1VCRToge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fVxuLy8gfTtcblxuLy8gUmV0dXJucyBhIE1hZ2ljIFVuaWZvcm0gU2V0dGVyXG5mdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVyKGdsLCBnbFByb2dyYW0sIGluZm8sIGlzQXJyYXkpIHtcbiAgY29uc3Qge25hbWUsIHR5cGV9ID0gaW5mbztcbiAgY29uc3QgbG9jID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKGdsUHJvZ3JhbSwgbmFtZSk7XG5cbiAgbGV0IG1hdHJpeCA9IGZhbHNlO1xuICBsZXQgdmVjdG9yID0gdHJ1ZTtcbiAgbGV0IGdsRnVuY3Rpb247XG4gIGxldCBUeXBlZEFycmF5O1xuXG4gIGlmIChpbmZvLnNpemUgPiAxICYmIGlzQXJyYXkpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcblxuICAgIGNhc2UgZ2wuRkxPQVQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBGbG9hdDMyQXJyYXk7XG4gICAgICB2ZWN0b3IgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5GTE9BVF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5GTE9BVF9NQVQ0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXg0ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5JTlQ6XG4gICAgY2FzZSBnbC5CT09MOlxuICAgIGNhc2UgZ2wuU0FNUExFUl8yRDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfQ1VCRTpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWl2O1xuICAgICAgVHlwZWRBcnJheSA9IFVpbnQxNkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuaWZvcm06IFVua25vd24gR0xTTCB0eXBlICcgKyB0eXBlKTtcblxuICAgIH1cbiAgfVxuXG4gIGlmICh2ZWN0b3IpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMjpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMmZ2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTRmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UOiBjYXNlIGdsLkJPT0w6IGNhc2UgZ2wuU0FNUExFUl8yRDogY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMjogY2FzZSBnbC5CT09MX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUMzOiBjYXNlIGdsLkJPT0xfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2l2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSgzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzQ6IGNhc2UgZ2wuQk9PTF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00aXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDQpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQyOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4MmZ2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQzOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4M2Z2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQ0OlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGdsRnVuY3Rpb24gPSBnbEZ1bmN0aW9uLmJpbmQoZ2wpO1xuXG4gIC8vIFNldCBhIHVuaWZvcm0gYXJyYXlcbiAgaWYgKGlzQXJyYXkgJiYgVHlwZWRBcnJheSkge1xuXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgbmV3IFR5cGVkQXJyYXkodmFsKSk7XG4gICAgICBnbENoZWNrRXJyb3IyKGdsKTtcbiAgICB9O1xuICB9IGVsc2UgaWYgKG1hdHJpeCkge1xuICAgIC8vIFNldCBhIG1hdHJpeCB1bmlmb3JtXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgZmFsc2UsIHZhbC50b0Zsb2F0MzJBcnJheSgpKTtcbiAgICAgIGdsQ2hlY2tFcnJvcjIoZ2wpO1xuICAgIH07XG5cbiAgfSBlbHNlIGlmIChUeXBlZEFycmF5KSB7XG5cbiAgICAvLyBTZXQgYSB2ZWN0b3IvdHlwZWQgYXJyYXkgdW5pZm9ybVxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgVHlwZWRBcnJheS5zZXQodmFsLnRvRmxvYXQzMkFycmF5ID8gdmFsLnRvRmxvYXQzMkFycmF5KCkgOiB2YWwpO1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIFR5cGVkQXJyYXkpO1xuICAgICAgZ2xDaGVja0Vycm9yMihnbCk7XG4gICAgfTtcblxuICB9XG4gIC8vIFNldCBhIHByaW1pdGl2ZS12YWx1ZWQgdW5pZm9ybVxuICByZXR1cm4gdmFsID0+IHtcbiAgICBnbEZ1bmN0aW9uKGxvYywgdmFsKTtcbiAgICBnbENoZWNrRXJyb3IyKGdsKTtcbiAgfTtcblxufVxuXG4vLyBjcmVhdGUgdW5pZm9ybSBzZXR0ZXJzXG4vLyBNYXAgb2YgdW5pZm9ybSBuYW1lcyB0byBzZXR0ZXIgZnVuY3Rpb25zXG5mdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVycyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IHVuaWZvcm1TZXR0ZXJzID0ge307XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZVVuaWZvcm0oZ2xQcm9ncmFtLCBpKTtcbiAgICBsZXQgbmFtZSA9IGluZm8ubmFtZTtcbiAgICAvLyBpZiBhcnJheSBuYW1lIHRoZW4gY2xlYW4gdGhlIGFycmF5IGJyYWNrZXRzXG4gICAgbmFtZSA9IG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nID9cbiAgICAgIG5hbWUuc3Vic3RyKDAsIG5hbWUubGVuZ3RoIC0gMykgOiBuYW1lO1xuICAgIHVuaWZvcm1TZXR0ZXJzW25hbWVdID1cbiAgICAgIGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGdsUHJvZ3JhbSwgaW5mbywgaW5mby5uYW1lICE9PSBuYW1lKTtcbiAgfVxuICByZXR1cm4gdW5pZm9ybVNldHRlcnM7XG59XG5cbi8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChtYXBzIGF0dHJpYnV0ZSBuYW1lIHRvIGluZGV4KVxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlTG9jYXRpb25zKGdsLCBnbFByb2dyYW0pIHtcbiAgY29uc3QgbGVuZ3RoID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihnbFByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKTtcbiAgY29uc3QgYXR0cmlidXRlTG9jYXRpb25zID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbmZvID0gZ2wuZ2V0QWN0aXZlQXR0cmliKGdsUHJvZ3JhbSwgaSk7XG4gICAgY29uc3QgaW5kZXggPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihnbFByb2dyYW0sIGluZm8ubmFtZSk7XG4gICAgYXR0cmlidXRlTG9jYXRpb25zW2luZm8ubmFtZV0gPSBpbmRleDtcbiAgfVxuICByZXR1cm4gYXR0cmlidXRlTG9jYXRpb25zO1xufVxuIiwiaW1wb3J0IGZvcm1hdENvbXBpbGVyRXJyb3IgZnJvbSAnZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yJztcblxuLy8gRm9yIG5vdyB0aGlzIGlzIGFuIGludGVybmFsIGNsYXNzXG5leHBvcnQgY2xhc3MgU2hhZGVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuICAgIGlmICh0aGlzLmhhbmRsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBjcmVhdGluZyBzaGFkZXIgd2l0aCB0eXBlICR7c2hhZGVyVHlwZX1gKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKHRoaXMuaGFuZGxlLCBzaGFkZXJTb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgIHZhciBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcih0aGlzLmhhbmRsZSwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgIHZhciBpbmZvID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyh0aGlzLmhhbmRsZSk7XG4gICAgICBnbC5kZWxldGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB2YXIgZm9ybWF0dGVkTG9nO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9ybWF0dGVkTG9nID0gZm9ybWF0Q29tcGlsZXJFcnJvcihpbmZvLCBzaGFkZXJTb3VyY2UsIHNoYWRlclR5cGUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLndhcm4oJ0Vycm9yIGZvcm1hdHRpbmcgZ2xzbCBjb21waWxlciBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgc2hhZGVyICR7aW5mb31gKTtcbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0dGVkTG9nLmxvbmcpO1xuICAgIH1cbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBWZXJ0ZXhTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNoYWRlclNvdXJjZSwgZ2wuVkVSVEVYX1NIQURFUik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZyYWdtZW50U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIH1cbn1cbiIsImltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuXG5jbGFzcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMudGFyZ2V0ID0gZ2wuVEVYVFVSRV8yRDtcblxuICAgIG9wdHMgPSBtZXJnZSh7XG4gICAgICBmbGlwWTogdHJ1ZSxcbiAgICAgIGFsaWdubWVudDogMSxcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIG1pbkZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIHdyYXBTOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgd3JhcFQ6IGdsLkNMQU1QX1RPX0VER0UsXG4gICAgICBmb3JtYXQ6IGdsLlJHQkEsXG4gICAgICB0eXBlOiBnbC5VTlNJR05FRF9CWVRFLFxuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlXG4gICAgfSwgb3B0cyk7XG5cbiAgICB0aGlzLmZsaXBZID0gb3B0cy5mbGlwWTtcbiAgICB0aGlzLmFsaWdubWVudCA9IG9wdHMuYWxpZ25tZW50O1xuICAgIHRoaXMubWFnRmlsdGVyID0gb3B0cy5tYWdGaWx0ZXI7XG4gICAgdGhpcy5taW5GaWx0ZXIgPSBvcHRzLm1pbkZpbHRlcjtcbiAgICB0aGlzLndyYXBTID0gb3B0cy53cmFwUztcbiAgICB0aGlzLndyYXBUID0gb3B0cy53cmFwVDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0O1xuICAgIHRoaXMudHlwZSA9IG9wdHMudHlwZTtcbiAgICB0aGlzLmdlbmVyYXRlTWlwbWFwID0gb3B0cy5nZW5lcmF0ZU1pcG1hcDtcblxuICAgIGlmICh0aGlzLnR5cGUgPT09IGdsLkZMT0FUKSB7XG4gICAgICB0aGlzLmZsb2F0RXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9mbG9hdCcpO1xuICAgICAgaWYgKCF0aGlzLmZsb2F0RXh0ZW5zaW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT0VTX3RleHR1cmVfZmxvYXQgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgaWYgKCF0aGlzLnRleHR1cmUpIHtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuXG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlKTtcbiAgICB0aGlzLnRleHR1cmUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlMkQgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSAwO1xuICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICB0aGlzLmJvcmRlciA9IDA7XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgYmluZChpbmRleCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKSAtIGdsLlRFWFRVUkUwO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHVwZGF0ZShvcHRzKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQ7XG4gICAgdGhpcy5ib3JkZXIgPSBvcHRzLmJvcmRlciB8fCAwO1xuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YTtcbiAgICBpZiAodGhpcy5mbGlwWSkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsXG4gICAgICAgIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSxcbiAgICAgICAgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLm1pbkZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5tYWdGaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgdGhpcy53cmFwUyk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLndyYXBUKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmICh0aGlzLmdlbmVyYXRlTWlwbWFwKSB7XG4gICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZUN1YmUgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbWF4LWxlbiAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3Mueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cbiIsIi8vIEhlbHBlciBkZWZpbml0aW9ucyBmb3IgdmFsaWRhdGlvbiBvZiB3ZWJnbCBwYXJhbWV0ZXJzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1pbmxpbmUtY29tbWVudHMsIG1heC1sZW4gKi9cblxuLy8gVE9ETyAtIHJlbW92ZVxuZXhwb3J0IHtpc1R5cGVkQXJyYXksIG1ha2VUeXBlZEFycmF5fSBmcm9tICcuLi91dGlscyc7XG5cbi8vIElOREVYIFRZUEVTXG5cbi8vIEZvciBkcmF3RWxlbWVudHMsIHNpemUgb2YgaW5kaWNlc1xuZXhwb3J0IGNvbnN0IElOREVYX1RZUEVTID0gWydVTlNJR05FRF9CWVRFJywgJ1VOU0lHTkVEX1NIT1JUJ107XG5leHBvcnQgY29uc3QgR0xfSU5ERVhfVFlQRVMgPSBnbCA9PiBJTkRFWF9UWVBFUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhUeXBlKHR5cGUpIHtcbiAgcmV0dXJuIElOREVYX1RZUEVTLmluZGV4T2YodHlwZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xJbmRleFR5cGUoZ2xUeXBlKSB7XG4gIHJldHVybiBHTF9JTkRFWF9UWVBFUy5pbmRleE9mKGdsVHlwZSkgIT09IC0xO1xufVxuXG4vLyBEUkFXIE1PREVTXG5cbmV4cG9ydCBjb25zdCBEUkFXX01PREVTID0gW1xuICAnUE9JTlRTJywgJ0xJTkVfU1RSSVAnLCAnTElORV9MT09QJywgJ0xJTkVTJyxcbiAgJ1RSSUFOR0xFX1NUUklQJywgJ1RSSUFOR0xFX0ZBTicsICdUUklBTkdMRVMnXG5dO1xuZXhwb3J0IGNvbnN0IEdMX0RSQVdfTU9ERVMgPSBnbCA9PiBEUkFXX01PREVTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNEcmF3TW9kZShtb2RlKSB7XG4gIHJldHVybiBEUkFXX01PREVTLmluZGV4T2YobW9kZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xEcmF3TW9kZShnbE1vZGUpIHtcbiAgcmV0dXJuIEdMX0RSQVdfTU9ERVMuaW5kZXhPZihnbE1vZGUpICE9PSAtMTtcbn1cblxuLy8gVEFSR0VUIFRZUEVTXG5cbmV4cG9ydCBjb25zdCBUQVJHRVRTID0gW1xuICAnQVJSQVlfQlVGRkVSJywgLy8gdmVydGV4IGF0dHJpYnV0ZXMgKGUuZy4gdmVydGV4L3RleHR1cmUgY29vcmRzIG9yIGNvbG9yKVxuICAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLCAvLyBCdWZmZXIgdXNlZCBmb3IgZWxlbWVudCBpbmRpY2VzLlxuICAvLyBGb3IgV2ViR0wgMiBjb250ZXh0c1xuICAnQ09QWV9SRUFEX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgY29weWluZyBmcm9tIG9uZSBidWZmZXIgb2JqZWN0IHRvIGFub3RoZXJcbiAgJ0NPUFlfV1JJVEVfQlVGRkVSJywgLy8gQnVmZmVyIGZvciBjb3B5aW5nIGZyb20gb25lIGJ1ZmZlciBvYmplY3QgdG8gYW5vdGhlclxuICAnVFJBTlNGT1JNX0ZFRURCQUNLX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgdHJhbnNmb3JtIGZlZWRiYWNrIG9wZXJhdGlvbnNcbiAgJ1VOSUZPUk1fQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHN0b3JpbmcgdW5pZm9ybSBibG9ja3NcbiAgJ1BJWEVMX1BBQ0tfQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHBpeGVsIHRyYW5zZmVyIG9wZXJhdGlvbnNcbiAgJ1BJWEVMX1VOUEFDS19CVUZGRVInIC8vIEJ1ZmZlciB1c2VkIGZvciBwaXhlbCB0cmFuc2ZlciBvcGVyYXRpb25zXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfVEFSR0VUUyA9XG4gIGdsID0+IFRBUkdFVFMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSkuZmlsdGVyKGNvbnN0YW50ID0+IGNvbnN0YW50KTtcblxuLy8gVVNBR0UgVFlQRVNcblxuZXhwb3J0IGNvbnN0IEJVRkZFUl9VU0FHRSA9IFtcbiAgJ1NUQVRJQ19EUkFXJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ0RZTkFNSUNfRFJBVycsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ1NUUkVBTV9EUkFXJywgLy8gQnVmZmVyIG5vdCB1c2VkIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gIC8vIEZvciBXZWJHTCAyIGNvbnRleHRzXG4gICdTVEFUSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ0RZTkFNSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RSRUFNX1JFQUQnLCAvLyBDb250ZW50cyBvZiB0aGUgYnVmZmVyIGFyZSBsaWtlbHkgdG8gbm90IGJlIHVzZWQgb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RBVElDX0NPUFknLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnRFlOQU1JQ19DT1BZJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnU1RSRUFNX0NPUFknIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgbmVpdGhlciB3cml0dGVuIG9yIHJlYWQgYnkgdGhlIHVzZXIuXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfQlVGRkVSX1VTQUdFID1cbiAgZ2wgPT4gQlVGRkVSX1VTQUdFLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pLmZpbHRlcihjb25zdGFudCA9PiBjb25zdGFudCk7XG4iXX0=
