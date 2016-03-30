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

function glCheckError(gl) {
  // Ensure all errors are cleared
  var error = undefined;
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

    (0, _assert2.default)(gl, 'Program needs WebGLRenderingContext');

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWRkLWxpbmUtbnVtYmVycy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hZGQtbGluZS1udW1iZXJzL25vZGVfbW9kdWxlcy9wYWQtbGVmdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2F0b2ItbGl0ZS9hdG9iLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dsLWNvbnN0YW50cy8xLjAvbnVtYmVycy5qcyIsIm5vZGVfbW9kdWxlcy9nbC1jb25zdGFudHMvbG9va3VwLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9idWlsdGlucy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvbGl0ZXJhbHMuanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL29wZXJhdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZXBlYXQtc3RyaW5nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NwcmludGYtanMvc3JjL3NwcmludGYuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvYWRkb25zL2Z4LmpzIiwic3JjL2FkZG9ucy9oZWxwZXJzLmpzIiwic3JjL2FkZG9ucy9pbmRleC5qcyIsInNyYy9hZGRvbnMvd29ya2Vycy5qcyIsInNyYy9pby5qcyIsInNyYy9zaGFkZXJzL2luZGV4LmpzIiwic3JjL3V0aWxzLmpzIiwic3JjL3dlYmdsL2J1ZmZlci5qcyIsInNyYy93ZWJnbC9jb250ZXh0LmpzIiwic3JjL3dlYmdsL2RyYXcuanMiLCJzcmMvd2ViZ2wvZmJvLmpzIiwic3JjL3dlYmdsL2luZGV4LmpzIiwic3JjL3dlYmdsL3Byb2dyYW0uanMiLCJzcmMvd2ViZ2wvc2hhZGVyLmpzIiwic3JjL3dlYmdsL3RleHR1cmUuanMiLCJzcmMvd2ViZ2wvdHlwZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QS9CLE1BYU87QUFDTCxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFILEVBQWdDLENBQTlDLEVBQWlELEtBQUssTUFBTCxFQUFhLEtBQUssTUFBTCxFQUFhLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxDQUFkLENBQXRGLENBREs7QUFFTCxtQ0FBYSxFQUFiLEVBRks7QUFHTCxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFILEVBQWdDLENBQTlDLEVBQWlELEtBQUssTUFBTCxFQUFhLEtBQUssTUFBTCxFQUFhLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxDQUFkLENBQXRGLENBSEs7QUFJTCxtQ0FBYSxFQUFiLEVBSks7QUFLTCxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFILEVBQWdDLENBQTlDLEVBQWlELEtBQUssTUFBTCxFQUFhLEtBQUssTUFBTCxFQUFhLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxDQUFkLENBQXRGLENBTEs7QUFNTCxtQ0FBYSxFQUFiLEVBTks7QUFPTCxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFILEVBQWdDLENBQTlDLEVBQWlELEtBQUssTUFBTCxFQUFhLEtBQUssTUFBTCxFQUFhLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxDQUFkLENBQXRGLENBUEs7QUFRTCxtQ0FBYSxFQUFiLEVBUks7QUFTTCxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFILEVBQWdDLENBQTlDLEVBQWlELEtBQUssTUFBTCxFQUFhLEtBQUssTUFBTCxFQUFhLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxDQUFkLENBQXRGLENBVEs7QUFVTCxtQ0FBYSxFQUFiLEVBVks7QUFXTCxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFILEVBQWdDLENBQTlDLEVBQWlELEtBQUssTUFBTCxFQUFhLEtBQUssTUFBTCxFQUFhLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxDQUFVLEdB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QUFaLENBQWpCLENBQTJDLE1BQTNDLENBQWtEO1dBQVk7R0FBWjtDQUF4RCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcGFkTGVmdCA9IHJlcXVpcmUoJ3BhZC1sZWZ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBhZGRMaW5lTnVtYmVyc1xuZnVuY3Rpb24gYWRkTGluZU51bWJlcnMgKHN0cmluZywgc3RhcnQsIGRlbGltKSB7XG4gIHN0YXJ0ID0gdHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJyA/IHN0YXJ0IDogMVxuICBkZWxpbSA9IGRlbGltIHx8ICc6ICdcblxuICB2YXIgbGluZXMgPSBzdHJpbmcuc3BsaXQoL1xccj9cXG4vKVxuICB2YXIgdG90YWxEaWdpdHMgPSBTdHJpbmcobGluZXMubGVuZ3RoICsgc3RhcnQgLSAxKS5sZW5ndGhcbiAgcmV0dXJuIGxpbmVzLm1hcChmdW5jdGlvbiAobGluZSwgaSkge1xuICAgIHZhciBjID0gaSArIHN0YXJ0XG4gICAgdmFyIGRpZ2l0cyA9IFN0cmluZyhjKS5sZW5ndGhcbiAgICB2YXIgcHJlZml4ID0gcGFkTGVmdChjLCB0b3RhbERpZ2l0cyAtIGRpZ2l0cylcbiAgICByZXR1cm4gcHJlZml4ICsgZGVsaW0gKyBsaW5lXG4gIH0pLmpvaW4oJ1xcbicpXG59XG4iLCIvKiFcbiAqIHBhZC1sZWZ0IDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9wYWQtbGVmdD5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVwZWF0ID0gcmVxdWlyZSgncmVwZWF0LXN0cmluZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhZExlZnQoc3RyLCBudW0sIGNoKSB7XG4gIGNoID0gdHlwZW9mIGNoICE9PSAndW5kZWZpbmVkJyA/IChjaCArICcnKSA6ICcgJztcbiAgcmV0dXJuIHJlcGVhdChjaCwgbnVtKSArIHN0cjtcbn07IiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgIWlzRmluaXRlKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSkge1xuICAgIHJldHVybiBhID09PSBiO1xuICB9XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSksXG4gICAgICBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICBrYiA9IG9iamVjdEtleXMoYiksXG4gICAgICBrZXksIGk7XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2F0b2Ioc3RyKSB7XG4gIHJldHVybiBhdG9iKHN0cilcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIDA6ICdOT05FJyxcbiAgMTogJ09ORScsXG4gIDI6ICdMSU5FX0xPT1AnLFxuICAzOiAnTElORV9TVFJJUCcsXG4gIDQ6ICdUUklBTkdMRVMnLFxuICA1OiAnVFJJQU5HTEVfU1RSSVAnLFxuICA2OiAnVFJJQU5HTEVfRkFOJyxcbiAgMjU2OiAnREVQVEhfQlVGRkVSX0JJVCcsXG4gIDUxMjogJ05FVkVSJyxcbiAgNTEzOiAnTEVTUycsXG4gIDUxNDogJ0VRVUFMJyxcbiAgNTE1OiAnTEVRVUFMJyxcbiAgNTE2OiAnR1JFQVRFUicsXG4gIDUxNzogJ05PVEVRVUFMJyxcbiAgNTE4OiAnR0VRVUFMJyxcbiAgNTE5OiAnQUxXQVlTJyxcbiAgNzY4OiAnU1JDX0NPTE9SJyxcbiAgNzY5OiAnT05FX01JTlVTX1NSQ19DT0xPUicsXG4gIDc3MDogJ1NSQ19BTFBIQScsXG4gIDc3MTogJ09ORV9NSU5VU19TUkNfQUxQSEEnLFxuICA3NzI6ICdEU1RfQUxQSEEnLFxuICA3NzM6ICdPTkVfTUlOVVNfRFNUX0FMUEhBJyxcbiAgNzc0OiAnRFNUX0NPTE9SJyxcbiAgNzc1OiAnT05FX01JTlVTX0RTVF9DT0xPUicsXG4gIDc3NjogJ1NSQ19BTFBIQV9TQVRVUkFURScsXG4gIDEwMjQ6ICdTVEVOQ0lMX0JVRkZFUl9CSVQnLFxuICAxMDI4OiAnRlJPTlQnLFxuICAxMDI5OiAnQkFDSycsXG4gIDEwMzI6ICdGUk9OVF9BTkRfQkFDSycsXG4gIDEyODA6ICdJTlZBTElEX0VOVU0nLFxuICAxMjgxOiAnSU5WQUxJRF9WQUxVRScsXG4gIDEyODI6ICdJTlZBTElEX09QRVJBVElPTicsXG4gIDEyODU6ICdPVVRfT0ZfTUVNT1JZJyxcbiAgMTI4NjogJ0lOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OJyxcbiAgMjMwNDogJ0NXJyxcbiAgMjMwNTogJ0NDVycsXG4gIDI4NDk6ICdMSU5FX1dJRFRIJyxcbiAgMjg4NDogJ0NVTExfRkFDRScsXG4gIDI4ODU6ICdDVUxMX0ZBQ0VfTU9ERScsXG4gIDI4ODY6ICdGUk9OVF9GQUNFJyxcbiAgMjkyODogJ0RFUFRIX1JBTkdFJyxcbiAgMjkyOTogJ0RFUFRIX1RFU1QnLFxuICAyOTMwOiAnREVQVEhfV1JJVEVNQVNLJyxcbiAgMjkzMTogJ0RFUFRIX0NMRUFSX1ZBTFVFJyxcbiAgMjkzMjogJ0RFUFRIX0ZVTkMnLFxuICAyOTYwOiAnU1RFTkNJTF9URVNUJyxcbiAgMjk2MTogJ1NURU5DSUxfQ0xFQVJfVkFMVUUnLFxuICAyOTYyOiAnU1RFTkNJTF9GVU5DJyxcbiAgMjk2MzogJ1NURU5DSUxfVkFMVUVfTUFTSycsXG4gIDI5NjQ6ICdTVEVOQ0lMX0ZBSUwnLFxuICAyOTY1OiAnU1RFTkNJTF9QQVNTX0RFUFRIX0ZBSUwnLFxuICAyOTY2OiAnU1RFTkNJTF9QQVNTX0RFUFRIX1BBU1MnLFxuICAyOTY3OiAnU1RFTkNJTF9SRUYnLFxuICAyOTY4OiAnU1RFTkNJTF9XUklURU1BU0snLFxuICAyOTc4OiAnVklFV1BPUlQnLFxuICAzMDI0OiAnRElUSEVSJyxcbiAgMzA0MjogJ0JMRU5EJyxcbiAgMzA4ODogJ1NDSVNTT1JfQk9YJyxcbiAgMzA4OTogJ1NDSVNTT1JfVEVTVCcsXG4gIDMxMDY6ICdDT0xPUl9DTEVBUl9WQUxVRScsXG4gIDMxMDc6ICdDT0xPUl9XUklURU1BU0snLFxuICAzMzE3OiAnVU5QQUNLX0FMSUdOTUVOVCcsXG4gIDMzMzM6ICdQQUNLX0FMSUdOTUVOVCcsXG4gIDMzNzk6ICdNQVhfVEVYVFVSRV9TSVpFJyxcbiAgMzM4NjogJ01BWF9WSUVXUE9SVF9ESU1TJyxcbiAgMzQwODogJ1NVQlBJWEVMX0JJVFMnLFxuICAzNDEwOiAnUkVEX0JJVFMnLFxuICAzNDExOiAnR1JFRU5fQklUUycsXG4gIDM0MTI6ICdCTFVFX0JJVFMnLFxuICAzNDEzOiAnQUxQSEFfQklUUycsXG4gIDM0MTQ6ICdERVBUSF9CSVRTJyxcbiAgMzQxNTogJ1NURU5DSUxfQklUUycsXG4gIDM1NTM6ICdURVhUVVJFXzJEJyxcbiAgNDM1MjogJ0RPTlRfQ0FSRScsXG4gIDQzNTM6ICdGQVNURVNUJyxcbiAgNDM1NDogJ05JQ0VTVCcsXG4gIDUxMjA6ICdCWVRFJyxcbiAgNTEyMTogJ1VOU0lHTkVEX0JZVEUnLFxuICA1MTIyOiAnU0hPUlQnLFxuICA1MTIzOiAnVU5TSUdORURfU0hPUlQnLFxuICA1MTI0OiAnSU5UJyxcbiAgNTEyNTogJ1VOU0lHTkVEX0lOVCcsXG4gIDUxMjY6ICdGTE9BVCcsXG4gIDUzODY6ICdJTlZFUlQnLFxuICA1ODkwOiAnVEVYVFVSRScsXG4gIDY0MDE6ICdTVEVOQ0lMX0lOREVYJyxcbiAgNjQwMjogJ0RFUFRIX0NPTVBPTkVOVCcsXG4gIDY0MDY6ICdBTFBIQScsXG4gIDY0MDc6ICdSR0InLFxuICA2NDA4OiAnUkdCQScsXG4gIDY0MDk6ICdMVU1JTkFOQ0UnLFxuICA2NDEwOiAnTFVNSU5BTkNFX0FMUEhBJyxcbiAgNzY4MDogJ0tFRVAnLFxuICA3NjgxOiAnUkVQTEFDRScsXG4gIDc2ODI6ICdJTkNSJyxcbiAgNzY4MzogJ0RFQ1InLFxuICA3OTM2OiAnVkVORE9SJyxcbiAgNzkzNzogJ1JFTkRFUkVSJyxcbiAgNzkzODogJ1ZFUlNJT04nLFxuICA5NzI4OiAnTkVBUkVTVCcsXG4gIDk3Mjk6ICdMSU5FQVInLFxuICA5OTg0OiAnTkVBUkVTVF9NSVBNQVBfTkVBUkVTVCcsXG4gIDk5ODU6ICdMSU5FQVJfTUlQTUFQX05FQVJFU1QnLFxuICA5OTg2OiAnTkVBUkVTVF9NSVBNQVBfTElORUFSJyxcbiAgOTk4NzogJ0xJTkVBUl9NSVBNQVBfTElORUFSJyxcbiAgMTAyNDA6ICdURVhUVVJFX01BR19GSUxURVInLFxuICAxMDI0MTogJ1RFWFRVUkVfTUlOX0ZJTFRFUicsXG4gIDEwMjQyOiAnVEVYVFVSRV9XUkFQX1MnLFxuICAxMDI0MzogJ1RFWFRVUkVfV1JBUF9UJyxcbiAgMTA0OTc6ICdSRVBFQVQnLFxuICAxMDc1MjogJ1BPTFlHT05fT0ZGU0VUX1VOSVRTJyxcbiAgMTYzODQ6ICdDT0xPUl9CVUZGRVJfQklUJyxcbiAgMzI3Njk6ICdDT05TVEFOVF9DT0xPUicsXG4gIDMyNzcwOiAnT05FX01JTlVTX0NPTlNUQU5UX0NPTE9SJyxcbiAgMzI3NzE6ICdDT05TVEFOVF9BTFBIQScsXG4gIDMyNzcyOiAnT05FX01JTlVTX0NPTlNUQU5UX0FMUEhBJyxcbiAgMzI3NzM6ICdCTEVORF9DT0xPUicsXG4gIDMyNzc0OiAnRlVOQ19BREQnLFxuICAzMjc3NzogJ0JMRU5EX0VRVUFUSU9OX1JHQicsXG4gIDMyNzc4OiAnRlVOQ19TVUJUUkFDVCcsXG4gIDMyNzc5OiAnRlVOQ19SRVZFUlNFX1NVQlRSQUNUJyxcbiAgMzI4MTk6ICdVTlNJR05FRF9TSE9SVF80XzRfNF80JyxcbiAgMzI4MjA6ICdVTlNJR05FRF9TSE9SVF81XzVfNV8xJyxcbiAgMzI4MjM6ICdQT0xZR09OX09GRlNFVF9GSUxMJyxcbiAgMzI4MjQ6ICdQT0xZR09OX09GRlNFVF9GQUNUT1InLFxuICAzMjg1NDogJ1JHQkE0JyxcbiAgMzI4NTU6ICdSR0I1X0ExJyxcbiAgMzI4NzM6ICdURVhUVVJFX0JJTkRJTkdfMkQnLFxuICAzMjkyNjogJ1NBTVBMRV9BTFBIQV9UT19DT1ZFUkFHRScsXG4gIDMyOTI4OiAnU0FNUExFX0NPVkVSQUdFJyxcbiAgMzI5MzY6ICdTQU1QTEVfQlVGRkVSUycsXG4gIDMyOTM3OiAnU0FNUExFUycsXG4gIDMyOTM4OiAnU0FNUExFX0NPVkVSQUdFX1ZBTFVFJyxcbiAgMzI5Mzk6ICdTQU1QTEVfQ09WRVJBR0VfSU5WRVJUJyxcbiAgMzI5Njg6ICdCTEVORF9EU1RfUkdCJyxcbiAgMzI5Njk6ICdCTEVORF9TUkNfUkdCJyxcbiAgMzI5NzA6ICdCTEVORF9EU1RfQUxQSEEnLFxuICAzMjk3MTogJ0JMRU5EX1NSQ19BTFBIQScsXG4gIDMzMDcxOiAnQ0xBTVBfVE9fRURHRScsXG4gIDMzMTcwOiAnR0VORVJBVEVfTUlQTUFQX0hJTlQnLFxuICAzMzE4OTogJ0RFUFRIX0NPTVBPTkVOVDE2JyxcbiAgMzMzMDY6ICdERVBUSF9TVEVOQ0lMX0FUVEFDSE1FTlQnLFxuICAzMzYzNTogJ1VOU0lHTkVEX1NIT1JUXzVfNl81JyxcbiAgMzM2NDg6ICdNSVJST1JFRF9SRVBFQVQnLFxuICAzMzkwMTogJ0FMSUFTRURfUE9JTlRfU0laRV9SQU5HRScsXG4gIDMzOTAyOiAnQUxJQVNFRF9MSU5FX1dJRFRIX1JBTkdFJyxcbiAgMzM5ODQ6ICdURVhUVVJFMCcsXG4gIDMzOTg1OiAnVEVYVFVSRTEnLFxuICAzMzk4NjogJ1RFWFRVUkUyJyxcbiAgMzM5ODc6ICdURVhUVVJFMycsXG4gIDMzOTg4OiAnVEVYVFVSRTQnLFxuICAzMzk4OTogJ1RFWFRVUkU1JyxcbiAgMzM5OTA6ICdURVhUVVJFNicsXG4gIDMzOTkxOiAnVEVYVFVSRTcnLFxuICAzMzk5MjogJ1RFWFRVUkU4JyxcbiAgMzM5OTM6ICdURVhUVVJFOScsXG4gIDMzOTk0OiAnVEVYVFVSRTEwJyxcbiAgMzM5OTU6ICdURVhUVVJFMTEnLFxuICAzMzk5NjogJ1RFWFRVUkUxMicsXG4gIDMzOTk3OiAnVEVYVFVSRTEzJyxcbiAgMzM5OTg6ICdURVhUVVJFMTQnLFxuICAzMzk5OTogJ1RFWFRVUkUxNScsXG4gIDM0MDAwOiAnVEVYVFVSRTE2JyxcbiAgMzQwMDE6ICdURVhUVVJFMTcnLFxuICAzNDAwMjogJ1RFWFRVUkUxOCcsXG4gIDM0MDAzOiAnVEVYVFVSRTE5JyxcbiAgMzQwMDQ6ICdURVhUVVJFMjAnLFxuICAzNDAwNTogJ1RFWFRVUkUyMScsXG4gIDM0MDA2OiAnVEVYVFVSRTIyJyxcbiAgMzQwMDc6ICdURVhUVVJFMjMnLFxuICAzNDAwODogJ1RFWFRVUkUyNCcsXG4gIDM0MDA5OiAnVEVYVFVSRTI1JyxcbiAgMzQwMTA6ICdURVhUVVJFMjYnLFxuICAzNDAxMTogJ1RFWFRVUkUyNycsXG4gIDM0MDEyOiAnVEVYVFVSRTI4JyxcbiAgMzQwMTM6ICdURVhUVVJFMjknLFxuICAzNDAxNDogJ1RFWFRVUkUzMCcsXG4gIDM0MDE1OiAnVEVYVFVSRTMxJyxcbiAgMzQwMTY6ICdBQ1RJVkVfVEVYVFVSRScsXG4gIDM0MDI0OiAnTUFYX1JFTkRFUkJVRkZFUl9TSVpFJyxcbiAgMzQwNDE6ICdERVBUSF9TVEVOQ0lMJyxcbiAgMzQwNTU6ICdJTkNSX1dSQVAnLFxuICAzNDA1NjogJ0RFQ1JfV1JBUCcsXG4gIDM0MDY3OiAnVEVYVFVSRV9DVUJFX01BUCcsXG4gIDM0MDY4OiAnVEVYVFVSRV9CSU5ESU5HX0NVQkVfTUFQJyxcbiAgMzQwNjk6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gnLFxuICAzNDA3MDogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCcsXG4gIDM0MDcxOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZJyxcbiAgMzQwNzI6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1knLFxuICAzNDA3MzogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWicsXG4gIDM0MDc0OiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aJyxcbiAgMzQwNzY6ICdNQVhfQ1VCRV9NQVBfVEVYVFVSRV9TSVpFJyxcbiAgMzQzMzg6ICdWRVJURVhfQVRUUklCX0FSUkFZX0VOQUJMRUQnLFxuICAzNDMzOTogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfU0laRScsXG4gIDM0MzQwOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9TVFJJREUnLFxuICAzNDM0MTogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfVFlQRScsXG4gIDM0MzQyOiAnQ1VSUkVOVF9WRVJURVhfQVRUUklCJyxcbiAgMzQzNzM6ICdWRVJURVhfQVRUUklCX0FSUkFZX1BPSU5URVInLFxuICAzNDQ2NjogJ05VTV9DT01QUkVTU0VEX1RFWFRVUkVfRk9STUFUUycsXG4gIDM0NDY3OiAnQ09NUFJFU1NFRF9URVhUVVJFX0ZPUk1BVFMnLFxuICAzNDY2MDogJ0JVRkZFUl9TSVpFJyxcbiAgMzQ2NjE6ICdCVUZGRVJfVVNBR0UnLFxuICAzNDgxNjogJ1NURU5DSUxfQkFDS19GVU5DJyxcbiAgMzQ4MTc6ICdTVEVOQ0lMX0JBQ0tfRkFJTCcsXG4gIDM0ODE4OiAnU1RFTkNJTF9CQUNLX1BBU1NfREVQVEhfRkFJTCcsXG4gIDM0ODE5OiAnU1RFTkNJTF9CQUNLX1BBU1NfREVQVEhfUEFTUycsXG4gIDM0ODc3OiAnQkxFTkRfRVFVQVRJT05fQUxQSEEnLFxuICAzNDkyMTogJ01BWF9WRVJURVhfQVRUUklCUycsXG4gIDM0OTIyOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9OT1JNQUxJWkVEJyxcbiAgMzQ5MzA6ICdNQVhfVEVYVFVSRV9JTUFHRV9VTklUUycsXG4gIDM0OTYyOiAnQVJSQVlfQlVGRkVSJyxcbiAgMzQ5NjM6ICdFTEVNRU5UX0FSUkFZX0JVRkZFUicsXG4gIDM0OTY0OiAnQVJSQVlfQlVGRkVSX0JJTkRJTkcnLFxuICAzNDk2NTogJ0VMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcnLFxuICAzNDk3NTogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfQlVGRkVSX0JJTkRJTkcnLFxuICAzNTA0MDogJ1NUUkVBTV9EUkFXJyxcbiAgMzUwNDQ6ICdTVEFUSUNfRFJBVycsXG4gIDM1MDQ4OiAnRFlOQU1JQ19EUkFXJyxcbiAgMzU2MzI6ICdGUkFHTUVOVF9TSEFERVInLFxuICAzNTYzMzogJ1ZFUlRFWF9TSEFERVInLFxuICAzNTY2MDogJ01BWF9WRVJURVhfVEVYVFVSRV9JTUFHRV9VTklUUycsXG4gIDM1NjYxOiAnTUFYX0NPTUJJTkVEX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNTY2MzogJ1NIQURFUl9UWVBFJyxcbiAgMzU2NjQ6ICdGTE9BVF9WRUMyJyxcbiAgMzU2NjU6ICdGTE9BVF9WRUMzJyxcbiAgMzU2NjY6ICdGTE9BVF9WRUM0JyxcbiAgMzU2Njc6ICdJTlRfVkVDMicsXG4gIDM1NjY4OiAnSU5UX1ZFQzMnLFxuICAzNTY2OTogJ0lOVF9WRUM0JyxcbiAgMzU2NzA6ICdCT09MJyxcbiAgMzU2NzE6ICdCT09MX1ZFQzInLFxuICAzNTY3MjogJ0JPT0xfVkVDMycsXG4gIDM1NjczOiAnQk9PTF9WRUM0JyxcbiAgMzU2NzQ6ICdGTE9BVF9NQVQyJyxcbiAgMzU2NzU6ICdGTE9BVF9NQVQzJyxcbiAgMzU2NzY6ICdGTE9BVF9NQVQ0JyxcbiAgMzU2Nzg6ICdTQU1QTEVSXzJEJyxcbiAgMzU2ODA6ICdTQU1QTEVSX0NVQkUnLFxuICAzNTcxMjogJ0RFTEVURV9TVEFUVVMnLFxuICAzNTcxMzogJ0NPTVBJTEVfU1RBVFVTJyxcbiAgMzU3MTQ6ICdMSU5LX1NUQVRVUycsXG4gIDM1NzE1OiAnVkFMSURBVEVfU1RBVFVTJyxcbiAgMzU3MTY6ICdJTkZPX0xPR19MRU5HVEgnLFxuICAzNTcxNzogJ0FUVEFDSEVEX1NIQURFUlMnLFxuICAzNTcxODogJ0FDVElWRV9VTklGT1JNUycsXG4gIDM1NzE5OiAnQUNUSVZFX1VOSUZPUk1fTUFYX0xFTkdUSCcsXG4gIDM1NzIwOiAnU0hBREVSX1NPVVJDRV9MRU5HVEgnLFxuICAzNTcyMTogJ0FDVElWRV9BVFRSSUJVVEVTJyxcbiAgMzU3MjI6ICdBQ1RJVkVfQVRUUklCVVRFX01BWF9MRU5HVEgnLFxuICAzNTcyNDogJ1NIQURJTkdfTEFOR1VBR0VfVkVSU0lPTicsXG4gIDM1NzI1OiAnQ1VSUkVOVF9QUk9HUkFNJyxcbiAgMzYwMDM6ICdTVEVOQ0lMX0JBQ0tfUkVGJyxcbiAgMzYwMDQ6ICdTVEVOQ0lMX0JBQ0tfVkFMVUVfTUFTSycsXG4gIDM2MDA1OiAnU1RFTkNJTF9CQUNLX1dSSVRFTUFTSycsXG4gIDM2MDA2OiAnRlJBTUVCVUZGRVJfQklORElORycsXG4gIDM2MDA3OiAnUkVOREVSQlVGRkVSX0JJTkRJTkcnLFxuICAzNjA0ODogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX1RZUEUnLFxuICAzNjA0OTogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX05BTUUnLFxuICAzNjA1MDogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MRVZFTCcsXG4gIDM2MDUxOiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0NVQkVfTUFQX0ZBQ0UnLFxuICAzNjA1MzogJ0ZSQU1FQlVGRkVSX0NPTVBMRVRFJyxcbiAgMzYwNTQ6ICdGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlQnLFxuICAzNjA1NTogJ0ZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5UJyxcbiAgMzYwNTc6ICdGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlMnLFxuICAzNjA2MTogJ0ZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEJyxcbiAgMzYwNjQ6ICdDT0xPUl9BVFRBQ0hNRU5UMCcsXG4gIDM2MDk2OiAnREVQVEhfQVRUQUNITUVOVCcsXG4gIDM2MTI4OiAnU1RFTkNJTF9BVFRBQ0hNRU5UJyxcbiAgMzYxNjA6ICdGUkFNRUJVRkZFUicsXG4gIDM2MTYxOiAnUkVOREVSQlVGRkVSJyxcbiAgMzYxNjI6ICdSRU5ERVJCVUZGRVJfV0lEVEgnLFxuICAzNjE2MzogJ1JFTkRFUkJVRkZFUl9IRUlHSFQnLFxuICAzNjE2NDogJ1JFTkRFUkJVRkZFUl9JTlRFUk5BTF9GT1JNQVQnLFxuICAzNjE2ODogJ1NURU5DSUxfSU5ERVg4JyxcbiAgMzYxNzY6ICdSRU5ERVJCVUZGRVJfUkVEX1NJWkUnLFxuICAzNjE3NzogJ1JFTkRFUkJVRkZFUl9HUkVFTl9TSVpFJyxcbiAgMzYxNzg6ICdSRU5ERVJCVUZGRVJfQkxVRV9TSVpFJyxcbiAgMzYxNzk6ICdSRU5ERVJCVUZGRVJfQUxQSEFfU0laRScsXG4gIDM2MTgwOiAnUkVOREVSQlVGRkVSX0RFUFRIX1NJWkUnLFxuICAzNjE4MTogJ1JFTkRFUkJVRkZFUl9TVEVOQ0lMX1NJWkUnLFxuICAzNjE5NDogJ1JHQjU2NScsXG4gIDM2MzM2OiAnTE9XX0ZMT0FUJyxcbiAgMzYzMzc6ICdNRURJVU1fRkxPQVQnLFxuICAzNjMzODogJ0hJR0hfRkxPQVQnLFxuICAzNjMzOTogJ0xPV19JTlQnLFxuICAzNjM0MDogJ01FRElVTV9JTlQnLFxuICAzNjM0MTogJ0hJR0hfSU5UJyxcbiAgMzYzNDY6ICdTSEFERVJfQ09NUElMRVInLFxuICAzNjM0NzogJ01BWF9WRVJURVhfVU5JRk9STV9WRUNUT1JTJyxcbiAgMzYzNDg6ICdNQVhfVkFSWUlOR19WRUNUT1JTJyxcbiAgMzYzNDk6ICdNQVhfRlJBR01FTlRfVU5JRk9STV9WRUNUT1JTJyxcbiAgMzc0NDA6ICdVTlBBQ0tfRkxJUF9ZX1dFQkdMJyxcbiAgMzc0NDE6ICdVTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wnLFxuICAzNzQ0MjogJ0NPTlRFWFRfTE9TVF9XRUJHTCcsXG4gIDM3NDQzOiAnVU5QQUNLX0NPTE9SU1BBQ0VfQ09OVkVSU0lPTl9XRUJHTCcsXG4gIDM3NDQ0OiAnQlJPV1NFUl9ERUZBVUxUX1dFQkdMJ1xufVxuIiwidmFyIGdsMTAgPSByZXF1aXJlKCcuLzEuMC9udW1iZXJzJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsb29rdXBDb25zdGFudCAobnVtYmVyKSB7XG4gIHJldHVybiBnbDEwW251bWJlcl1cbn1cbiIsIlxudmFyIHNwcmludGYgPSByZXF1aXJlKCdzcHJpbnRmLWpzJykuc3ByaW50ZjtcbnZhciBnbENvbnN0YW50cyA9IHJlcXVpcmUoJ2dsLWNvbnN0YW50cy9sb29rdXAnKTtcbnZhciBzaGFkZXJOYW1lID0gcmVxdWlyZSgnZ2xzbC1zaGFkZXItbmFtZScpO1xudmFyIGFkZExpbmVOdW1iZXJzID0gcmVxdWlyZSgnYWRkLWxpbmUtbnVtYmVycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvcm1hdENvbXBpbGVyRXJyb3I7XG5cbmZ1bmN0aW9uIGZvcm1hdENvbXBpbGVyRXJyb3IoZXJyTG9nLCBzcmMsIHR5cGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBuYW1lID0gc2hhZGVyTmFtZShzcmMpIHx8ICdvZiB1bmtub3duIG5hbWUgKHNlZSBucG0gZ2xzbC1zaGFkZXItbmFtZSknO1xuXG4gICAgdmFyIHR5cGVOYW1lID0gJ3Vua25vd24gdHlwZSc7XG4gICAgaWYgKHR5cGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eXBlTmFtZSA9IHR5cGUgPT09IGdsQ29uc3RhbnRzLkZSQUdNRU5UX1NIQURFUiA/ICdmcmFnbWVudCcgOiAndmVydGV4J1xuICAgIH1cblxuICAgIHZhciBsb25nRm9ybSA9IHNwcmludGYoJ0Vycm9yIGNvbXBpbGluZyAlcyBzaGFkZXIgJXM6XFxuJywgdHlwZU5hbWUsIG5hbWUpO1xuICAgIHZhciBzaG9ydEZvcm0gPSBzcHJpbnRmKFwiJXMlc1wiLCBsb25nRm9ybSwgZXJyTG9nKTtcblxuICAgIHZhciBlcnJvclN0cmluZ3MgPSBlcnJMb2cuc3BsaXQoJ1xcbicpO1xuICAgIHZhciBlcnJvcnMgPSB7fTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXJyb3JTdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlcnJvclN0cmluZyA9IGVycm9yU3RyaW5nc1tpXTtcbiAgICAgICAgaWYgKGVycm9yU3RyaW5nID09PSAnJykgY29udGludWU7XG4gICAgICAgIHZhciBsaW5lTm8gPSBwYXJzZUludChlcnJvclN0cmluZy5zcGxpdCgnOicpWzJdKTtcbiAgICAgICAgaWYgKGlzTmFOKGxpbmVObykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzcHJpbnRmKCdDb3VsZCBub3QgcGFyc2UgZXJyb3I6ICVzJywgZXJyb3JTdHJpbmcpKTtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcnNbbGluZU5vXSA9IGVycm9yU3RyaW5nO1xuICAgIH1cblxuICAgIHZhciBsaW5lcyA9IGFkZExpbmVOdW1iZXJzKHNyYykuc3BsaXQoJ1xcbicpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWVycm9yc1tpKzNdICYmICFlcnJvcnNbaSsyXSAmJiAhZXJyb3JzW2krMV0pIGNvbnRpbnVlO1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuICAgICAgICBsb25nRm9ybSArPSBsaW5lICsgJ1xcbic7XG4gICAgICAgIGlmIChlcnJvcnNbaSsxXSkge1xuICAgICAgICAgICAgdmFyIGUgPSBlcnJvcnNbaSsxXTtcbiAgICAgICAgICAgIGUgPSBlLnN1YnN0cihlLnNwbGl0KCc6JywgMykuam9pbignOicpLmxlbmd0aCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIGxvbmdGb3JtICs9IHNwcmludGYoJ15eXiAlc1xcblxcbicsIGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9uZzogbG9uZ0Zvcm0udHJpbSgpLFxuICAgICAgICBzaG9ydDogc2hvcnRGb3JtLnRyaW0oKVxuICAgIH07XG59XG5cbiIsInZhciB0b2tlbml6ZSA9IHJlcXVpcmUoJ2dsc2wtdG9rZW5pemVyJylcbnZhciBhdG9iICAgICA9IHJlcXVpcmUoJ2F0b2ItbGl0ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TmFtZVxuXG5mdW5jdGlvbiBnZXROYW1lKHNyYykge1xuICB2YXIgdG9rZW5zID0gQXJyYXkuaXNBcnJheShzcmMpXG4gICAgPyBzcmNcbiAgICA6IHRva2VuaXplKHNyYylcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuICAgIGlmICh0b2tlbi50eXBlICE9PSAncHJlcHJvY2Vzc29yJykgY29udGludWVcbiAgICB2YXIgbWF0Y2ggPSB0b2tlbi5kYXRhLm1hdGNoKC9cXCNkZWZpbmVcXHMrU0hBREVSX05BTUUoX0I2NCk/XFxzKyguKykkLylcbiAgICBpZiAoIW1hdGNoKSBjb250aW51ZVxuICAgIGlmICghbWF0Y2hbMl0pIGNvbnRpbnVlXG5cbiAgICB2YXIgYjY0ICA9IG1hdGNoWzFdXG4gICAgdmFyIG5hbWUgPSBtYXRjaFsyXVxuXG4gICAgcmV0dXJuIChiNjQgPyBhdG9iKG5hbWUpIDogbmFtZSkudHJpbSgpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gdG9rZW5pemVcblxudmFyIGxpdGVyYWxzID0gcmVxdWlyZSgnLi9saWIvbGl0ZXJhbHMnKVxuICAsIG9wZXJhdG9ycyA9IHJlcXVpcmUoJy4vbGliL29wZXJhdG9ycycpXG4gICwgYnVpbHRpbnMgPSByZXF1aXJlKCcuL2xpYi9idWlsdGlucycpXG5cbnZhciBOT1JNQUwgPSA5OTkgICAgICAgICAgLy8gPC0tIG5ldmVyIGVtaXR0ZWRcbiAgLCBUT0tFTiA9IDk5OTkgICAgICAgICAgLy8gPC0tIG5ldmVyIGVtaXR0ZWRcbiAgLCBCTE9DS19DT01NRU5UID0gMFxuICAsIExJTkVfQ09NTUVOVCA9IDFcbiAgLCBQUkVQUk9DRVNTT1IgPSAyXG4gICwgT1BFUkFUT1IgPSAzXG4gICwgSU5URUdFUiA9IDRcbiAgLCBGTE9BVCA9IDVcbiAgLCBJREVOVCA9IDZcbiAgLCBCVUlMVElOID0gN1xuICAsIEtFWVdPUkQgPSA4XG4gICwgV0hJVEVTUEFDRSA9IDlcbiAgLCBFT0YgPSAxMFxuICAsIEhFWCA9IDExXG5cbnZhciBtYXAgPSBbXG4gICAgJ2Jsb2NrLWNvbW1lbnQnXG4gICwgJ2xpbmUtY29tbWVudCdcbiAgLCAncHJlcHJvY2Vzc29yJ1xuICAsICdvcGVyYXRvcidcbiAgLCAnaW50ZWdlcidcbiAgLCAnZmxvYXQnXG4gICwgJ2lkZW50J1xuICAsICdidWlsdGluJ1xuICAsICdrZXl3b3JkJ1xuICAsICd3aGl0ZXNwYWNlJ1xuICAsICdlb2YnXG4gICwgJ2ludGVnZXInXG5dXG5cbmZ1bmN0aW9uIHRva2VuaXplKCkge1xuICB2YXIgaSA9IDBcbiAgICAsIHRvdGFsID0gMFxuICAgICwgbW9kZSA9IE5PUk1BTFxuICAgICwgY1xuICAgICwgbGFzdFxuICAgICwgY29udGVudCA9IFtdXG4gICAgLCB0b2tlbnMgPSBbXVxuICAgICwgdG9rZW5faWR4ID0gMFxuICAgICwgdG9rZW5fb2ZmcyA9IDBcbiAgICAsIGxpbmUgPSAxXG4gICAgLCBjb2wgPSAwXG4gICAgLCBzdGFydCA9IDBcbiAgICAsIGlzbnVtID0gZmFsc2VcbiAgICAsIGlzb3BlcmF0b3IgPSBmYWxzZVxuICAgICwgaW5wdXQgPSAnJ1xuICAgICwgbGVuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB0b2tlbnMgPSBbXVxuICAgIGlmIChkYXRhICE9PSBudWxsKSByZXR1cm4gd3JpdGUoZGF0YSlcbiAgICByZXR1cm4gZW5kKClcbiAgfVxuXG4gIGZ1bmN0aW9uIHRva2VuKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5sZW5ndGgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogbWFwW21vZGVdXG4gICAgICAsIGRhdGE6IGRhdGFcbiAgICAgICwgcG9zaXRpb246IHN0YXJ0XG4gICAgICAsIGxpbmU6IGxpbmVcbiAgICAgICwgY29sdW1uOiBjb2xcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUoY2h1bmspIHtcbiAgICBpID0gMFxuICAgIGlucHV0ICs9IGNodW5rXG4gICAgbGVuID0gaW5wdXQubGVuZ3RoXG5cbiAgICB2YXIgbGFzdFxuXG4gICAgd2hpbGUoYyA9IGlucHV0W2ldLCBpIDwgbGVuKSB7XG4gICAgICBsYXN0ID0gaVxuXG4gICAgICBzd2l0Y2gobW9kZSkge1xuICAgICAgICBjYXNlIEJMT0NLX0NPTU1FTlQ6IGkgPSBibG9ja19jb21tZW50KCk7IGJyZWFrXG4gICAgICAgIGNhc2UgTElORV9DT01NRU5UOiBpID0gbGluZV9jb21tZW50KCk7IGJyZWFrXG4gICAgICAgIGNhc2UgUFJFUFJPQ0VTU09SOiBpID0gcHJlcHJvY2Vzc29yKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgT1BFUkFUT1I6IGkgPSBvcGVyYXRvcigpOyBicmVha1xuICAgICAgICBjYXNlIElOVEVHRVI6IGkgPSBpbnRlZ2VyKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgSEVYOiBpID0gaGV4KCk7IGJyZWFrXG4gICAgICAgIGNhc2UgRkxPQVQ6IGkgPSBkZWNpbWFsKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgVE9LRU46IGkgPSByZWFkdG9rZW4oKTsgYnJlYWtcbiAgICAgICAgY2FzZSBXSElURVNQQUNFOiBpID0gd2hpdGVzcGFjZSgpOyBicmVha1xuICAgICAgICBjYXNlIE5PUk1BTDogaSA9IG5vcm1hbCgpOyBicmVha1xuICAgICAgfVxuXG4gICAgICBpZihsYXN0ICE9PSBpKSB7XG4gICAgICAgIHN3aXRjaChpbnB1dFtsYXN0XSkge1xuICAgICAgICAgIGNhc2UgJ1xcbic6IGNvbCA9IDA7ICsrbGluZTsgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OiArK2NvbDsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRvdGFsICs9IGlcbiAgICBpbnB1dCA9IGlucHV0LnNsaWNlKGkpXG4gICAgcmV0dXJuIHRva2Vuc1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kKGNodW5rKSB7XG4gICAgaWYoY29udGVudC5sZW5ndGgpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgfVxuXG4gICAgbW9kZSA9IEVPRlxuICAgIHRva2VuKCcoZW9mKScpXG4gICAgcmV0dXJuIHRva2Vuc1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsKCkge1xuICAgIGNvbnRlbnQgPSBjb250ZW50Lmxlbmd0aCA/IFtdIDogY29udGVudFxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcqJykge1xuICAgICAgc3RhcnQgPSB0b3RhbCArIGkgLSAxXG4gICAgICBtb2RlID0gQkxPQ0tfQ09NTUVOVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnLycpIHtcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpIC0gMVxuICAgICAgbW9kZSA9IExJTkVfQ09NTUVOVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKGMgPT09ICcjJykge1xuICAgICAgbW9kZSA9IFBSRVBST0NFU1NPUlxuICAgICAgc3RhcnQgPSB0b3RhbCArIGlcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoL1xccy8udGVzdChjKSkge1xuICAgICAgbW9kZSA9IFdISVRFU1BBQ0VcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlzbnVtID0gL1xcZC8udGVzdChjKVxuICAgIGlzb3BlcmF0b3IgPSAvW15cXHdfXS8udGVzdChjKVxuXG4gICAgc3RhcnQgPSB0b3RhbCArIGlcbiAgICBtb2RlID0gaXNudW0gPyBJTlRFR0VSIDogaXNvcGVyYXRvciA/IE9QRVJBVE9SIDogVE9LRU5cbiAgICByZXR1cm4gaVxuICB9XG5cbiAgZnVuY3Rpb24gd2hpdGVzcGFjZSgpIHtcbiAgICBpZigvW15cXHNdL2cudGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBwcmVwcm9jZXNzb3IoKSB7XG4gICAgaWYoYyA9PT0gJ1xcbicgJiYgbGFzdCAhPT0gJ1xcXFwnKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmVfY29tbWVudCgpIHtcbiAgICByZXR1cm4gcHJlcHJvY2Vzc29yKClcbiAgfVxuXG4gIGZ1bmN0aW9uIGJsb2NrX2NvbW1lbnQoKSB7XG4gICAgaWYoYyA9PT0gJy8nICYmIGxhc3QgPT09ICcqJykge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZXJhdG9yKCkge1xuICAgIGlmKGxhc3QgPT09ICcuJyAmJiAvXFxkLy50ZXN0KGMpKSB7XG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcqJykge1xuICAgICAgbW9kZSA9IEJMT0NLX0NPTU1FTlRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcvJykge1xuICAgICAgbW9kZSA9IExJTkVfQ09NTUVOVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihjID09PSAnLicgJiYgY29udGVudC5sZW5ndGgpIHtcbiAgICAgIHdoaWxlKGRldGVybWluZV9vcGVyYXRvcihjb250ZW50KSk7XG5cbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihjID09PSAnOycgfHwgYyA9PT0gJyknIHx8IGMgPT09ICcoJykge1xuICAgICAgaWYoY29udGVudC5sZW5ndGgpIHdoaWxlKGRldGVybWluZV9vcGVyYXRvcihjb250ZW50KSk7XG4gICAgICB0b2tlbihjKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgdmFyIGlzX2NvbXBvc2l0ZV9vcGVyYXRvciA9IGNvbnRlbnQubGVuZ3RoID09PSAyICYmIGMgIT09ICc9J1xuICAgIGlmKC9bXFx3X1xcZFxcc10vLnRlc3QoYykgfHwgaXNfY29tcG9zaXRlX29wZXJhdG9yKSB7XG4gICAgICB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gZGV0ZXJtaW5lX29wZXJhdG9yKGJ1Zikge1xuICAgIHZhciBqID0gMFxuICAgICAgLCBpZHhcbiAgICAgICwgcmVzXG5cbiAgICBkbyB7XG4gICAgICBpZHggPSBvcGVyYXRvcnMuaW5kZXhPZihidWYuc2xpY2UoMCwgYnVmLmxlbmd0aCArIGopLmpvaW4oJycpKVxuICAgICAgcmVzID0gb3BlcmF0b3JzW2lkeF1cblxuICAgICAgaWYoaWR4ID09PSAtMSkge1xuICAgICAgICBpZihqLS0gKyBidWYubGVuZ3RoID4gMCkgY29udGludWVcbiAgICAgICAgcmVzID0gYnVmLnNsaWNlKDAsIDEpLmpvaW4oJycpXG4gICAgICB9XG5cbiAgICAgIHRva2VuKHJlcylcblxuICAgICAgc3RhcnQgKz0gcmVzLmxlbmd0aFxuICAgICAgY29udGVudCA9IGNvbnRlbnQuc2xpY2UocmVzLmxlbmd0aClcbiAgICAgIHJldHVybiBjb250ZW50Lmxlbmd0aFxuICAgIH0gd2hpbGUoMSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGhleCgpIHtcbiAgICBpZigvW15hLWZBLUYwLTldLy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gaW50ZWdlcigpIHtcbiAgICBpZihjID09PSAnLicpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoL1tlRV0vLnRlc3QoYykpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJ3gnICYmIGNvbnRlbnQubGVuZ3RoID09PSAxICYmIGNvbnRlbnRbMF0gPT09ICcwJykge1xuICAgICAgbW9kZSA9IEhFWFxuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoL1teXFxkXS8udGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY2ltYWwoKSB7XG4gICAgaWYoYyA9PT0gJ2YnKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIGxhc3QgPSBjXG4gICAgICBpICs9IDFcbiAgICB9XG5cbiAgICBpZigvW2VFXS8udGVzdChjKSkge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoL1teXFxkXS8udGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiByZWFkdG9rZW4oKSB7XG4gICAgaWYoL1teXFxkXFx3X10vLnRlc3QoYykpIHtcbiAgICAgIHZhciBjb250ZW50c3RyID0gY29udGVudC5qb2luKCcnKVxuICAgICAgaWYobGl0ZXJhbHMuaW5kZXhPZihjb250ZW50c3RyKSA+IC0xKSB7XG4gICAgICAgIG1vZGUgPSBLRVlXT1JEXG4gICAgICB9IGVsc2UgaWYoYnVpbHRpbnMuaW5kZXhPZihjb250ZW50c3RyKSA+IC0xKSB7XG4gICAgICAgIG1vZGUgPSBCVUlMVElOXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb2RlID0gSURFTlRcbiAgICAgIH1cbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICAnZ2xfUG9zaXRpb24nXG4gICwgJ2dsX1BvaW50U2l6ZSdcbiAgLCAnZ2xfQ2xpcFZlcnRleCdcbiAgLCAnZ2xfRnJhZ0Nvb3JkJ1xuICAsICdnbF9Gcm9udEZhY2luZydcbiAgLCAnZ2xfRnJhZ0NvbG9yJ1xuICAsICdnbF9GcmFnRGF0YSdcbiAgLCAnZ2xfRnJhZ0RlcHRoJ1xuICAsICdnbF9Db2xvcidcbiAgLCAnZ2xfU2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX05vcm1hbCdcbiAgLCAnZ2xfVmVydGV4J1xuICAsICdnbF9NdWx0aVRleENvb3JkMCdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDEnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQyJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMydcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDQnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ1J1xuICAsICdnbF9NdWx0aVRleENvb3JkNidcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDcnXG4gICwgJ2dsX0ZvZ0Nvb3JkJ1xuICAsICdnbF9NYXhMaWdodHMnXG4gICwgJ2dsX01heENsaXBQbGFuZXMnXG4gICwgJ2dsX01heFRleHR1cmVVbml0cydcbiAgLCAnZ2xfTWF4VGV4dHVyZUNvb3JkcydcbiAgLCAnZ2xfTWF4VmVydGV4QXR0cmlicydcbiAgLCAnZ2xfTWF4VmVydGV4VW5pZm9ybUNvbXBvbmVudHMnXG4gICwgJ2dsX01heFZhcnlpbmdGbG9hdHMnXG4gICwgJ2dsX01heFZlcnRleFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhDb21iaW5lZFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4RnJhZ21lbnRVbmlmb3JtQ29tcG9uZW50cydcbiAgLCAnZ2xfTWF4RHJhd0J1ZmZlcnMnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeCdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeCdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCdcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeCdcbiAgLCAnZ2xfTm9ybWFsTWF0cml4J1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeEludmVyc2UnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX05vcm1hbFNjYWxlJ1xuICAsICdnbF9EZXB0aFJhbmdlUGFyYW1ldGVycydcbiAgLCAnZ2xfRGVwdGhSYW5nZSdcbiAgLCAnZ2xfQ2xpcFBsYW5lJ1xuICAsICdnbF9Qb2ludFBhcmFtZXRlcnMnXG4gICwgJ2dsX1BvaW50J1xuICAsICdnbF9NYXRlcmlhbFBhcmFtZXRlcnMnXG4gICwgJ2dsX0Zyb250TWF0ZXJpYWwnXG4gICwgJ2dsX0JhY2tNYXRlcmlhbCdcbiAgLCAnZ2xfTGlnaHRTb3VyY2VQYXJhbWV0ZXJzJ1xuICAsICdnbF9MaWdodFNvdXJjZSdcbiAgLCAnZ2xfTGlnaHRNb2RlbFBhcmFtZXRlcnMnXG4gICwgJ2dsX0xpZ2h0TW9kZWwnXG4gICwgJ2dsX0xpZ2h0TW9kZWxQcm9kdWN0cydcbiAgLCAnZ2xfRnJvbnRMaWdodE1vZGVsUHJvZHVjdCdcbiAgLCAnZ2xfQmFja0xpZ2h0TW9kZWxQcm9kdWN0J1xuICAsICdnbF9MaWdodFByb2R1Y3RzJ1xuICAsICdnbF9Gcm9udExpZ2h0UHJvZHVjdCdcbiAgLCAnZ2xfQmFja0xpZ2h0UHJvZHVjdCdcbiAgLCAnZ2xfRm9nUGFyYW1ldGVycydcbiAgLCAnZ2xfRm9nJ1xuICAsICdnbF9UZXh0dXJlRW52Q29sb3InXG4gICwgJ2dsX0V5ZVBsYW5lUydcbiAgLCAnZ2xfRXllUGxhbmVUJ1xuICAsICdnbF9FeWVQbGFuZVInXG4gICwgJ2dsX0V5ZVBsYW5lUSdcbiAgLCAnZ2xfT2JqZWN0UGxhbmVTJ1xuICAsICdnbF9PYmplY3RQbGFuZVQnXG4gICwgJ2dsX09iamVjdFBsYW5lUidcbiAgLCAnZ2xfT2JqZWN0UGxhbmVRJ1xuICAsICdnbF9Gcm9udENvbG9yJ1xuICAsICdnbF9CYWNrQ29sb3InXG4gICwgJ2dsX0Zyb250U2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX0JhY2tTZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfVGV4Q29vcmQnXG4gICwgJ2dsX0ZvZ0ZyYWdDb29yZCdcbiAgLCAnZ2xfQ29sb3InXG4gICwgJ2dsX1NlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9UZXhDb29yZCdcbiAgLCAnZ2xfRm9nRnJhZ0Nvb3JkJ1xuICAsICdnbF9Qb2ludENvb3JkJ1xuICAsICdyYWRpYW5zJ1xuICAsICdkZWdyZWVzJ1xuICAsICdzaW4nXG4gICwgJ2NvcydcbiAgLCAndGFuJ1xuICAsICdhc2luJ1xuICAsICdhY29zJ1xuICAsICdhdGFuJ1xuICAsICdwb3cnXG4gICwgJ2V4cCdcbiAgLCAnbG9nJ1xuICAsICdleHAyJ1xuICAsICdsb2cyJ1xuICAsICdzcXJ0J1xuICAsICdpbnZlcnNlc3FydCdcbiAgLCAnYWJzJ1xuICAsICdzaWduJ1xuICAsICdmbG9vcidcbiAgLCAnY2VpbCdcbiAgLCAnZnJhY3QnXG4gICwgJ21vZCdcbiAgLCAnbWluJ1xuICAsICdtYXgnXG4gICwgJ2NsYW1wJ1xuICAsICdtaXgnXG4gICwgJ3N0ZXAnXG4gICwgJ3Ntb290aHN0ZXAnXG4gICwgJ2xlbmd0aCdcbiAgLCAnZGlzdGFuY2UnXG4gICwgJ2RvdCdcbiAgLCAnY3Jvc3MnXG4gICwgJ25vcm1hbGl6ZSdcbiAgLCAnZmFjZWZvcndhcmQnXG4gICwgJ3JlZmxlY3QnXG4gICwgJ3JlZnJhY3QnXG4gICwgJ21hdHJpeENvbXBNdWx0J1xuICAsICdsZXNzVGhhbidcbiAgLCAnbGVzc1RoYW5FcXVhbCdcbiAgLCAnZ3JlYXRlclRoYW4nXG4gICwgJ2dyZWF0ZXJUaGFuRXF1YWwnXG4gICwgJ2VxdWFsJ1xuICAsICdub3RFcXVhbCdcbiAgLCAnYW55J1xuICAsICdhbGwnXG4gICwgJ25vdCdcbiAgLCAndGV4dHVyZTJEJ1xuICAsICd0ZXh0dXJlMkRQcm9qJ1xuICAsICd0ZXh0dXJlMkRMb2QnXG4gICwgJ3RleHR1cmUyRFByb2pMb2QnXG4gICwgJ3RleHR1cmVDdWJlJ1xuICAsICd0ZXh0dXJlQ3ViZUxvZCdcbiAgLCAnZEZkeCdcbiAgLCAnZEZkeSdcbl1cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAvLyBjdXJyZW50XG4gICAgJ3ByZWNpc2lvbidcbiAgLCAnaGlnaHAnXG4gICwgJ21lZGl1bXAnXG4gICwgJ2xvd3AnXG4gICwgJ2F0dHJpYnV0ZSdcbiAgLCAnY29uc3QnXG4gICwgJ3VuaWZvcm0nXG4gICwgJ3ZhcnlpbmcnXG4gICwgJ2JyZWFrJ1xuICAsICdjb250aW51ZSdcbiAgLCAnZG8nXG4gICwgJ2ZvcidcbiAgLCAnd2hpbGUnXG4gICwgJ2lmJ1xuICAsICdlbHNlJ1xuICAsICdpbidcbiAgLCAnb3V0J1xuICAsICdpbm91dCdcbiAgLCAnZmxvYXQnXG4gICwgJ2ludCdcbiAgLCAndm9pZCdcbiAgLCAnYm9vbCdcbiAgLCAndHJ1ZSdcbiAgLCAnZmFsc2UnXG4gICwgJ2Rpc2NhcmQnXG4gICwgJ3JldHVybidcbiAgLCAnbWF0MidcbiAgLCAnbWF0MydcbiAgLCAnbWF0NCdcbiAgLCAndmVjMidcbiAgLCAndmVjMydcbiAgLCAndmVjNCdcbiAgLCAnaXZlYzInXG4gICwgJ2l2ZWMzJ1xuICAsICdpdmVjNCdcbiAgLCAnYnZlYzInXG4gICwgJ2J2ZWMzJ1xuICAsICdidmVjNCdcbiAgLCAnc2FtcGxlcjFEJ1xuICAsICdzYW1wbGVyMkQnXG4gICwgJ3NhbXBsZXIzRCdcbiAgLCAnc2FtcGxlckN1YmUnXG4gICwgJ3NhbXBsZXIxRFNoYWRvdydcbiAgLCAnc2FtcGxlcjJEU2hhZG93J1xuICAsICdzdHJ1Y3QnXG5cbiAgLy8gZnV0dXJlXG4gICwgJ2FzbSdcbiAgLCAnY2xhc3MnXG4gICwgJ3VuaW9uJ1xuICAsICdlbnVtJ1xuICAsICd0eXBlZGVmJ1xuICAsICd0ZW1wbGF0ZSdcbiAgLCAndGhpcydcbiAgLCAncGFja2VkJ1xuICAsICdnb3RvJ1xuICAsICdzd2l0Y2gnXG4gICwgJ2RlZmF1bHQnXG4gICwgJ2lubGluZSdcbiAgLCAnbm9pbmxpbmUnXG4gICwgJ3ZvbGF0aWxlJ1xuICAsICdwdWJsaWMnXG4gICwgJ3N0YXRpYydcbiAgLCAnZXh0ZXJuJ1xuICAsICdleHRlcm5hbCdcbiAgLCAnaW50ZXJmYWNlJ1xuICAsICdsb25nJ1xuICAsICdzaG9ydCdcbiAgLCAnZG91YmxlJ1xuICAsICdoYWxmJ1xuICAsICdmaXhlZCdcbiAgLCAndW5zaWduZWQnXG4gICwgJ2lucHV0J1xuICAsICdvdXRwdXQnXG4gICwgJ2h2ZWMyJ1xuICAsICdodmVjMydcbiAgLCAnaHZlYzQnXG4gICwgJ2R2ZWMyJ1xuICAsICdkdmVjMydcbiAgLCAnZHZlYzQnXG4gICwgJ2Z2ZWMyJ1xuICAsICdmdmVjMydcbiAgLCAnZnZlYzQnXG4gICwgJ3NhbXBsZXIyRFJlY3QnXG4gICwgJ3NhbXBsZXIzRFJlY3QnXG4gICwgJ3NhbXBsZXIyRFJlY3RTaGFkb3cnXG4gICwgJ3NpemVvZidcbiAgLCAnY2FzdCdcbiAgLCAnbmFtZXNwYWNlJ1xuICAsICd1c2luZydcbl1cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAgICc8PD0nXG4gICwgJz4+PSdcbiAgLCAnKysnXG4gICwgJy0tJ1xuICAsICc8PCdcbiAgLCAnPj4nXG4gICwgJzw9J1xuICAsICc+PSdcbiAgLCAnPT0nXG4gICwgJyE9J1xuICAsICcmJidcbiAgLCAnfHwnXG4gICwgJys9J1xuICAsICctPSdcbiAgLCAnKj0nXG4gICwgJy89J1xuICAsICclPSdcbiAgLCAnJj0nXG4gICwgJ15eJ1xuICAsICdePSdcbiAgLCAnfD0nXG4gICwgJygnXG4gICwgJyknXG4gICwgJ1snXG4gICwgJ10nXG4gICwgJy4nXG4gICwgJyEnXG4gICwgJ34nXG4gICwgJyonXG4gICwgJy8nXG4gICwgJyUnXG4gICwgJysnXG4gICwgJy0nXG4gICwgJzwnXG4gICwgJz4nXG4gICwgJyYnXG4gICwgJ14nXG4gICwgJ3wnXG4gICwgJz8nXG4gICwgJzonXG4gICwgJz0nXG4gICwgJywnXG4gICwgJzsnXG4gICwgJ3snXG4gICwgJ30nXG5dXG4iLCJ2YXIgdG9rZW5pemUgPSByZXF1aXJlKCcuL2luZGV4JylcblxubW9kdWxlLmV4cG9ydHMgPSB0b2tlbml6ZVN0cmluZ1xuXG5mdW5jdGlvbiB0b2tlbml6ZVN0cmluZyhzdHIpIHtcbiAgdmFyIGdlbmVyYXRvciA9IHRva2VuaXplKClcbiAgdmFyIHRva2VucyA9IFtdXG5cbiAgdG9rZW5zID0gdG9rZW5zLmNvbmNhdChnZW5lcmF0b3Ioc3RyKSlcbiAgdG9rZW5zID0gdG9rZW5zLmNvbmNhdChnZW5lcmF0b3IobnVsbCkpXG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvKiFcbiAqIHJlcGVhdC1zdHJpbmcgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L3JlcGVhdC1zdHJpbmc+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEpvbiBTY2hsaW5rZXJ0LlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBFeHBvc2UgYHJlcGVhdGBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcGVhdDtcblxuLyoqXG4gKiBSZXBlYXQgdGhlIGdpdmVuIGBzdHJpbmdgIHRoZSBzcGVjaWZpZWQgYG51bWJlcmBcbiAqIG9mIHRpbWVzLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgcmVwZWF0ID0gcmVxdWlyZSgncmVwZWF0LXN0cmluZycpO1xuICogcmVwZWF0KCdBJywgNSk7XG4gKiAvLz0+IEFBQUFBXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYHN0cmluZ2AgVGhlIHN0cmluZyB0byByZXBlYXRcbiAqIEBwYXJhbSB7TnVtYmVyfSBgbnVtYmVyYCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFJlcGVhdGVkIHN0cmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiByZXBlYXQoc3RyLCBudW0pIHtcbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncmVwZWF0LXN0cmluZyBleHBlY3RzIGEgc3RyaW5nLicpO1xuICB9XG5cbiAgaWYgKG51bSA9PT0gMSkgcmV0dXJuIHN0cjtcbiAgaWYgKG51bSA9PT0gMikgcmV0dXJuIHN0ciArIHN0cjtcblxuICB2YXIgbWF4ID0gc3RyLmxlbmd0aCAqIG51bTtcbiAgaWYgKGNhY2hlICE9PSBzdHIgfHwgdHlwZW9mIGNhY2hlID09PSAndW5kZWZpbmVkJykge1xuICAgIGNhY2hlID0gc3RyO1xuICAgIHJlcyA9ICcnO1xuICB9XG5cbiAgd2hpbGUgKG1heCA+IHJlcy5sZW5ndGggJiYgbnVtID4gMCkge1xuICAgIGlmIChudW0gJiAxKSB7XG4gICAgICByZXMgKz0gc3RyO1xuICAgIH1cblxuICAgIG51bSA+Pj0gMTtcbiAgICBpZiAoIW51bSkgYnJlYWs7XG4gICAgc3RyICs9IHN0cjtcbiAgfVxuXG4gIHJldHVybiByZXMuc3Vic3RyKDAsIG1heCk7XG59XG5cbi8qKlxuICogUmVzdWx0cyBjYWNoZVxuICovXG5cbnZhciByZXMgPSAnJztcbnZhciBjYWNoZTtcbiIsIihmdW5jdGlvbih3aW5kb3cpIHtcbiAgICB2YXIgcmUgPSB7XG4gICAgICAgIG5vdF9zdHJpbmc6IC9bXnNdLyxcbiAgICAgICAgbnVtYmVyOiAvW2RpZWZnXS8sXG4gICAgICAgIGpzb246IC9bal0vLFxuICAgICAgICBub3RfanNvbjogL1teal0vLFxuICAgICAgICB0ZXh0OiAvXlteXFx4MjVdKy8sXG4gICAgICAgIG1vZHVsbzogL15cXHgyNXsyfS8sXG4gICAgICAgIHBsYWNlaG9sZGVyOiAvXlxceDI1KD86KFsxLTldXFxkKilcXCR8XFwoKFteXFwpXSspXFwpKT8oXFwrKT8oMHwnW14kXSk/KC0pPyhcXGQrKT8oPzpcXC4oXFxkKykpPyhbYi1naWpvc3V4WF0pLyxcbiAgICAgICAga2V5OiAvXihbYS16X11bYS16X1xcZF0qKS9pLFxuICAgICAgICBrZXlfYWNjZXNzOiAvXlxcLihbYS16X11bYS16X1xcZF0qKS9pLFxuICAgICAgICBpbmRleF9hY2Nlc3M6IC9eXFxbKFxcZCspXFxdLyxcbiAgICAgICAgc2lnbjogL15bXFwrXFwtXS9cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzcHJpbnRmKCkge1xuICAgICAgICB2YXIga2V5ID0gYXJndW1lbnRzWzBdLCBjYWNoZSA9IHNwcmludGYuY2FjaGVcbiAgICAgICAgaWYgKCEoY2FjaGVba2V5XSAmJiBjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSkge1xuICAgICAgICAgICAgY2FjaGVba2V5XSA9IHNwcmludGYucGFyc2Uoa2V5KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzcHJpbnRmLmZvcm1hdC5jYWxsKG51bGwsIGNhY2hlW2tleV0sIGFyZ3VtZW50cylcbiAgICB9XG5cbiAgICBzcHJpbnRmLmZvcm1hdCA9IGZ1bmN0aW9uKHBhcnNlX3RyZWUsIGFyZ3YpIHtcbiAgICAgICAgdmFyIGN1cnNvciA9IDEsIHRyZWVfbGVuZ3RoID0gcGFyc2VfdHJlZS5sZW5ndGgsIG5vZGVfdHlwZSA9IFwiXCIsIGFyZywgb3V0cHV0ID0gW10sIGksIGssIG1hdGNoLCBwYWQsIHBhZF9jaGFyYWN0ZXIsIHBhZF9sZW5ndGgsIGlzX3Bvc2l0aXZlID0gdHJ1ZSwgc2lnbiA9IFwiXCJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRyZWVfbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGVfdHlwZSA9IGdldF90eXBlKHBhcnNlX3RyZWVbaV0pXG4gICAgICAgICAgICBpZiAobm9kZV90eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0W291dHB1dC5sZW5ndGhdID0gcGFyc2VfdHJlZVtpXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobm9kZV90eXBlID09PSBcImFycmF5XCIpIHtcbiAgICAgICAgICAgICAgICBtYXRjaCA9IHBhcnNlX3RyZWVbaV0gLy8gY29udmVuaWVuY2UgcHVycG9zZXMgb25seVxuICAgICAgICAgICAgICAgIGlmIChtYXRjaFsyXSkgeyAvLyBrZXl3b3JkIGFyZ3VtZW50XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbY3Vyc29yXVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgbWF0Y2hbMl0ubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYXJnLmhhc093blByb3BlcnR5KG1hdGNoWzJdW2tdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzcHJpbnRmKFwiW3NwcmludGZdIHByb3BlcnR5ICclcycgZG9lcyBub3QgZXhpc3RcIiwgbWF0Y2hbMl1ba10pKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnW21hdGNoWzJdW2tdXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1hdGNoWzFdKSB7IC8vIHBvc2l0aW9uYWwgYXJndW1lbnQgKGV4cGxpY2l0KVxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd2W21hdGNoWzFdXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHsgLy8gcG9zaXRpb25hbCBhcmd1bWVudCAoaW1wbGljaXQpXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbY3Vyc29yKytdXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGdldF90eXBlKGFyZykgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZygpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlLm5vdF9zdHJpbmcudGVzdChtYXRjaFs4XSkgJiYgcmUubm90X2pzb24udGVzdChtYXRjaFs4XSkgJiYgKGdldF90eXBlKGFyZykgIT0gXCJudW1iZXJcIiAmJiBpc05hTihhcmcpKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHNwcmludGYoXCJbc3ByaW50Zl0gZXhwZWN0aW5nIG51bWJlciBidXQgZm91bmQgJXNcIiwgZ2V0X3R5cGUoYXJnKSkpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlLm51bWJlci50ZXN0KG1hdGNoWzhdKSkge1xuICAgICAgICAgICAgICAgICAgICBpc19wb3NpdGl2ZSA9IGFyZyA+PSAwXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChtYXRjaFs4XSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDIpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IHBhcnNlSW50KGFyZywgMTApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJqXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBKU09OLnN0cmluZ2lmeShhcmcsIG51bGwsIG1hdGNoWzZdID8gcGFyc2VJbnQobWF0Y2hbNl0pIDogMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IG1hdGNoWzddID8gYXJnLnRvRXhwb25lbnRpYWwobWF0Y2hbN10pIDogYXJnLnRvRXhwb25lbnRpYWwoKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gbWF0Y2hbN10gPyBwYXJzZUZsb2F0KGFyZykudG9GaXhlZChtYXRjaFs3XSkgOiBwYXJzZUZsb2F0KGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImdcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IG1hdGNoWzddID8gcGFyc2VGbG9hdChhcmcpLnRvUHJlY2lzaW9uKG1hdGNoWzddKSA6IHBhcnNlRmxvYXQoYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwib1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAoKGFyZyA9IFN0cmluZyhhcmcpKSAmJiBtYXRjaFs3XSA/IGFyZy5zdWJzdHJpbmcoMCwgbWF0Y2hbN10pIDogYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnID4+PiAwXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ4XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoMTYpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJYXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlLmpzb24udGVzdChtYXRjaFs4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0W291dHB1dC5sZW5ndGhdID0gYXJnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmUubnVtYmVyLnRlc3QobWF0Y2hbOF0pICYmICghaXNfcG9zaXRpdmUgfHwgbWF0Y2hbM10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWduID0gaXNfcG9zaXRpdmUgPyBcIitcIiA6IFwiLVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoKS5yZXBsYWNlKHJlLnNpZ24sIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWduID0gXCJcIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhZF9jaGFyYWN0ZXIgPSBtYXRjaFs0XSA/IG1hdGNoWzRdID09PSBcIjBcIiA/IFwiMFwiIDogbWF0Y2hbNF0uY2hhckF0KDEpIDogXCIgXCJcbiAgICAgICAgICAgICAgICAgICAgcGFkX2xlbmd0aCA9IG1hdGNoWzZdIC0gKHNpZ24gKyBhcmcpLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBwYWQgPSBtYXRjaFs2XSA/IChwYWRfbGVuZ3RoID4gMCA/IHN0cl9yZXBlYXQocGFkX2NoYXJhY3RlciwgcGFkX2xlbmd0aCkgOiBcIlwiKSA6IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0W291dHB1dC5sZW5ndGhdID0gbWF0Y2hbNV0gPyBzaWduICsgYXJnICsgcGFkIDogKHBhZF9jaGFyYWN0ZXIgPT09IFwiMFwiID8gc2lnbiArIHBhZCArIGFyZyA6IHBhZCArIHNpZ24gKyBhcmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQuam9pbihcIlwiKVxuICAgIH1cblxuICAgIHNwcmludGYuY2FjaGUgPSB7fVxuXG4gICAgc3ByaW50Zi5wYXJzZSA9IGZ1bmN0aW9uKGZtdCkge1xuICAgICAgICB2YXIgX2ZtdCA9IGZtdCwgbWF0Y2ggPSBbXSwgcGFyc2VfdHJlZSA9IFtdLCBhcmdfbmFtZXMgPSAwXG4gICAgICAgIHdoaWxlIChfZm10KSB7XG4gICAgICAgICAgICBpZiAoKG1hdGNoID0gcmUudGV4dC5leGVjKF9mbXQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHBhcnNlX3RyZWVbcGFyc2VfdHJlZS5sZW5ndGhdID0gbWF0Y2hbMF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKChtYXRjaCA9IHJlLm1vZHVsby5leGVjKF9mbXQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHBhcnNlX3RyZWVbcGFyc2VfdHJlZS5sZW5ndGhdID0gXCIlXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKChtYXRjaCA9IHJlLnBsYWNlaG9sZGVyLmV4ZWMoX2ZtdCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoWzJdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ19uYW1lcyB8PSAxXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWVsZF9saXN0ID0gW10sIHJlcGxhY2VtZW50X2ZpZWxkID0gbWF0Y2hbMl0sIGZpZWxkX21hdGNoID0gW11cbiAgICAgICAgICAgICAgICAgICAgaWYgKChmaWVsZF9tYXRjaCA9IHJlLmtleS5leGVjKHJlcGxhY2VtZW50X2ZpZWxkKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkX2xpc3RbZmllbGRfbGlzdC5sZW5ndGhdID0gZmllbGRfbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICgocmVwbGFjZW1lbnRfZmllbGQgPSByZXBsYWNlbWVudF9maWVsZC5zdWJzdHJpbmcoZmllbGRfbWF0Y2hbMF0ubGVuZ3RoKSkgIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5X2FjY2Vzcy5leGVjKHJlcGxhY2VtZW50X2ZpZWxkKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdFtmaWVsZF9saXN0Lmxlbmd0aF0gPSBmaWVsZF9tYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgoZmllbGRfbWF0Y2ggPSByZS5pbmRleF9hY2Nlc3MuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkX2xpc3RbZmllbGRfbGlzdC5sZW5ndGhdID0gZmllbGRfbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIltzcHJpbnRmXSBmYWlsZWQgdG8gcGFyc2UgbmFtZWQgYXJndW1lbnQga2V5XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXlcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IGZpZWxkX2xpc3RcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ19uYW1lcyB8PSAyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhcmdfbmFtZXMgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiW3NwcmludGZdIG1peGluZyBwb3NpdGlvbmFsIGFuZCBuYW1lZCBwbGFjZWhvbGRlcnMgaXMgbm90ICh5ZXQpIHN1cHBvcnRlZFwiKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlW3BhcnNlX3RyZWUubGVuZ3RoXSA9IG1hdGNoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJbc3ByaW50Zl0gdW5leHBlY3RlZCBwbGFjZWhvbGRlclwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2ZtdCA9IF9mbXQuc3Vic3RyaW5nKG1hdGNoWzBdLmxlbmd0aClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFyc2VfdHJlZVxuICAgIH1cblxuICAgIHZhciB2c3ByaW50ZiA9IGZ1bmN0aW9uKGZtdCwgYXJndiwgX2FyZ3YpIHtcbiAgICAgICAgX2FyZ3YgPSAoYXJndiB8fCBbXSkuc2xpY2UoMClcbiAgICAgICAgX2FyZ3Yuc3BsaWNlKDAsIDAsIGZtdClcbiAgICAgICAgcmV0dXJuIHNwcmludGYuYXBwbHkobnVsbCwgX2FyZ3YpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGVscGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldF90eXBlKHZhcmlhYmxlKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyX3JlcGVhdChpbnB1dCwgbXVsdGlwbGllcikge1xuICAgICAgICByZXR1cm4gQXJyYXkobXVsdGlwbGllciArIDEpLmpvaW4oaW5wdXQpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZXhwb3J0IHRvIGVpdGhlciBicm93c2VyIG9yIG5vZGUuanNcbiAgICAgKi9cbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgZXhwb3J0cy5zcHJpbnRmID0gc3ByaW50ZlxuICAgICAgICBleHBvcnRzLnZzcHJpbnRmID0gdnNwcmludGZcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHdpbmRvdy5zcHJpbnRmID0gc3ByaW50ZlxuICAgICAgICB3aW5kb3cudnNwcmludGYgPSB2c3ByaW50ZlxuXG4gICAgICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHNwcmludGY6IHNwcmludGYsXG4gICAgICAgICAgICAgICAgICAgIHZzcHJpbnRmOiB2c3ByaW50ZlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59KSh0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiID8gdGhpcyA6IHdpbmRvdyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiLy8gIFRpbWVyIGJhc2VkIGFuaW1hdGlvblxuLy8gVE9ETyBjbGVhbiB1cCBsaW50aW5nXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyogZ2xvYmFsIHNldFRpbWVvdXQgKi9cbmltcG9ydCB7bWVyZ2UsIG5vb3AsIHNwbGF0fSBmcm9tICcuLi91dGlscyc7XG5cbnZhciBRdWV1ZSA9IFtdO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGeCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMub3B0ID0gbWVyZ2Uoe1xuICAgICAgZGVsYXk6IDAsXG4gICAgICBkdXJhdGlvbjogMTAwMCxcbiAgICAgIHRyYW5zaXRpb246IHggPT4geCxcbiAgICAgIG9uQ29tcHV0ZTogbm9vcCxcbiAgICAgIG9uQ29tcGxldGU6IG5vb3BcbiAgICB9LCBvcHRpb25zKTtcbiAgfVxuXG4gIHN0YXJ0KG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHRoaXMub3B0LCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICBRdWV1ZS5wdXNoKHRoaXMpO1xuICB9XG5cbiAgLy8gcGVyZm9ybSBhIHN0ZXAgaW4gdGhlIGFuaW1hdGlvblxuICBzdGVwKCkge1xuICAgIC8vIGlmIG5vdCBhbmltYXRpbmcsIHRoZW4gcmV0dXJuXG4gICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpLFxuICAgICAgdGltZSA9IHRoaXMudGltZSxcbiAgICAgIG9wdCA9IHRoaXMub3B0LFxuICAgICAgZGVsYXkgPSBvcHQuZGVsYXksXG4gICAgICBkdXJhdGlvbiA9IG9wdC5kdXJhdGlvbixcbiAgICAgIGRlbHRhID0gMDtcbiAgICAvLyBob2xkIGFuaW1hdGlvbiBmb3IgdGhlIGRlbGF5XG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5KSB7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBpZiBpbiBvdXIgdGltZSB3aW5kb3csIHRoZW4gZXhlY3V0ZSBhbmltYXRpb25cbiAgICBpZiAoY3VycmVudFRpbWUgPCB0aW1lICsgZGVsYXkgKyBkdXJhdGlvbikge1xuICAgICAgZGVsdGEgPSBvcHQudHJhbnNpdGlvbigoY3VycmVudFRpbWUgLSB0aW1lIC0gZGVsYXkpIC8gZHVyYXRpb24pO1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCAxKTtcbiAgICAgIG9wdC5vbkNvbXBsZXRlLmNhbGwodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGNvbXB1dGUoZnJvbSwgdG8sIGRlbHRhKSB7XG4gICAgcmV0dXJuIGZyb20gKyAodG8gLSBmcm9tKSAqIGRlbHRhO1xuICB9XG59XG5cbkZ4LlF1ZXVlID0gUXVldWU7XG5cbi8vIEVhc2luZyBlcXVhdGlvbnNcbkZ4LlRyYW5zaXRpb24gPSB7XG4gIGxpbmVhcihwKSB7XG4gICAgcmV0dXJuIHA7XG4gIH1cbn07XG5cbnZhciBUcmFucyA9IEZ4LlRyYW5zaXRpb247XG5cbkZ4LnByb3RvdHlwZS50aW1lID0gbnVsbDtcblxuZnVuY3Rpb24gbWFrZVRyYW5zKHRyYW5zaXRpb24sIHBhcmFtcykge1xuICBwYXJhbXMgPSBzcGxhdChwYXJhbXMpO1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbih0cmFuc2l0aW9uLCB7XG4gICAgZWFzZUluKHBvcykge1xuICAgICAgcmV0dXJuIHRyYW5zaXRpb24ocG9zLCBwYXJhbXMpO1xuICAgIH0sXG4gICAgZWFzZU91dChwb3MpIHtcbiAgICAgIHJldHVybiAxIC0gdHJhbnNpdGlvbigxIC0gcG9zLCBwYXJhbXMpO1xuICAgIH0sXG4gICAgZWFzZUluT3V0KHBvcykge1xuICAgICAgcmV0dXJuIChwb3MgPD0gMC41KSA/IHRyYW5zaXRpb24oMiAqIHBvcywgcGFyYW1zKSAvIDIgOlxuICAgICAgICAoMiAtIHRyYW5zaXRpb24oMiAqICgxIC0gcG9zKSwgcGFyYW1zKSkgLyAyO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciB0cmFuc2l0aW9ucyA9IHtcblxuICBQb3cocCwgeCkge1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCB4WzBdIHx8IDYpO1xuICB9LFxuXG4gIEV4cG8ocCkge1xuICAgIHJldHVybiBNYXRoLnBvdygyLCA4ICogKHAgLSAxKSk7XG4gIH0sXG5cbiAgQ2lyYyhwKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnNpbihNYXRoLmFjb3MocCkpO1xuICB9LFxuXG4gIFNpbmUocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oKDEgLSBwKSAqIE1hdGguUEkgLyAyKTtcbiAgfSxcblxuICBCYWNrKHAsIHgpIHtcbiAgICB4ID0geFswXSB8fCAxLjYxODtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgMikgKiAoKHggKyAxKSAqIHAgLSB4KTtcbiAgfSxcblxuICBCb3VuY2UocCkge1xuICAgIHZhciB2YWx1ZTtcbiAgICBmb3IgKGxldCBhID0gMCwgYiA9IDE7IDE7IGEgKz0gYiwgYiAvPSAyKSB7XG4gICAgICBpZiAocCA+PSAoNyAtIDQgKiBhKSAvIDExKSB7XG4gICAgICAgIHZhbHVlID0gYiAqIGIgLSBNYXRoLnBvdygoMTEgLSA2ICogYSAtIDExICogcCkgLyA0LCAyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfSxcblxuICBFbGFzdGljKHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgMTAgKiAtLXApICogTWF0aC5jb3MoMjAgKiBwICogTWF0aC5QSSAqICh4WzBdIHx8IDEpIC8gMyk7XG4gIH1cblxufTtcblxuZm9yIChjb25zdCB0IGluIHRyYW5zaXRpb25zKSB7XG4gIFRyYW5zW3RdID0gbWFrZVRyYW5zKHRyYW5zaXRpb25zW3RdKTtcbn1cblxuWydRdWFkJywgJ0N1YmljJywgJ1F1YXJ0JywgJ1F1aW50J10uZm9yRWFjaChmdW5jdGlvbihlbGVtLCBpKSB7XG4gIFRyYW5zW2VsZW1dID0gbWFrZVRyYW5zKGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgW1xuICAgICAgaSArIDJcbiAgICBdKTtcbiAgfSk7XG59KTtcblxuLy8gYW5pbWF0aW9uVGltZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuXG4vLyAgcnllOiBUT0RPLSByZWZhY3RvciBnbG9iYWwgZGVmaW5pdGlvbiB3aGVuIHdlIGRlZmluZSB0aGUgdHdvXG4vLyAgICAgICAgICAgICAoYnJvd3NlcmlmeS88c2NyaXB0PikgYnVpbGQgcGF0aHMuXG52YXIgZ2xvYmFsO1xudHJ5IHtcbiAgZ2xvYmFsID0gd2luZG93O1xufSBjYXRjaCAoZSkge1xuICBnbG9iYWwgPSBudWxsO1xufVxuXG52YXIgY2hlY2tGeFF1ZXVlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvbGRRdWV1ZSA9IFF1ZXVlO1xuICBRdWV1ZSA9IFtdO1xuICBpZiAob2xkUXVldWUubGVuZ3RoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvbGRRdWV1ZS5sZW5ndGgsIGZ4OyBpIDwgbDsgaSsrKSB7XG4gICAgICBmeCA9IG9sZFF1ZXVlW2ldO1xuICAgICAgZnguc3RlcCgpO1xuICAgICAgaWYgKGZ4LmFuaW1hdGluZykge1xuICAgICAgICBRdWV1ZS5wdXNoKGZ4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgRnguUXVldWUgPSBRdWV1ZTtcbiAgfVxufTtcblxuaWYgKGdsb2JhbCkge1xuICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgWyd3ZWJraXRBbmltYXRpb25UaW1lJywgJ21vekFuaW1hdGlvblRpbWUnLCAnYW5pbWF0aW9uVGltZScsXG4gICAnd2Via2l0QW5pbWF0aW9uU3RhcnRUaW1lJywgJ21vekFuaW1hdGlvblN0YXJ0VGltZScsICdhbmltYXRpb25TdGFydFRpbWUnXVxuICAgIC5mb3JFYWNoKGltcGwgPT4ge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LmFuaW1hdGlvblRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZ2xvYmFsW2ltcGxdO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5hbmltYXRpb25UaW1lID0gRGF0ZS5ub3c7XG4gIH1cbiAgLy8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIC0gZnVuY3Rpb24gYnJhbmNoaW5nXG4gIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lJywgJ21velJlcXVlc3RBbmltYXRpb25GcmFtZScsXG4gICAncmVxdWVzdEFuaW1hdGlvbkZyYW1lJ11cbiAgICAuZm9yRWFjaChmdW5jdGlvbihpbXBsKSB7XG4gICAgICBpZiAoaW1wbCBpbiBnbG9iYWwpIHtcbiAgICAgICAgRngucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICBnbG9iYWxbaW1wbF0oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjaGVja0Z4UXVldWUoKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgaWYgKCFmb3VuZCkge1xuICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBjaGVja0Z4UXVldWUoKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0sIDEwMDAgLyA2MCk7XG4gICAgfTtcbiAgfVxufVxuIiwiaW1wb3J0IFByb2dyYW0gZnJvbSAnLi4vd2ViZ2wvcHJvZ3JhbSc7XG5pbXBvcnQgU2hhZGVycyBmcm9tICcuLi9zaGFkZXJzJztcbmltcG9ydCB7WEhSR3JvdXB9IGZyb20gJy4uL2lvJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbi8qIGdsb2JhbCBkb2N1bWVudCAqL1xuXG4vLyBBbHRlcm5hdGUgY29uc3RydWN0b3Jcbi8vIEJ1aWxkIHByb2dyYW0gZnJvbSBkZWZhdWx0IHNoYWRlcnMgKHJlcXVpcmVzIFNoYWRlcnMpXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByb2dyYW1mcm9tRGVmYXVsdFNoYWRlcnMoZ2wsIGlkKSB7XG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge1xuICAgIHZzOiBTaGFkZXJzLlZlcnRleC5EZWZhdWx0LFxuICAgIGZzOiBTaGFkZXJzLkZyYWdtZW50LkRlZmF1bHQsXG4gICAgaWRcbiAgfSk7XG59XG5cbi8vIENyZWF0ZSBhIHByb2dyYW0gZnJvbSB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlciBub2RlIGlkc1xuLy8gQGRlcHJlY2F0ZWQgLSBVc2UgZ2xzbGlmeSBpbnN0ZWFkXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByb2dyYW1Gcm9tSFRNTFRlbXBsYXRlcyhnbCwgdnNJZCwgZnNJZCwgaWQpIHtcbiAgY29uc3QgdnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh2c0lkKS5pbm5lckhUTUw7XG4gIGNvbnN0IGZzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZnNJZCkuaW5uZXJIVE1MO1xuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHt2cywgZnMsIGlkfSk7XG59XG5cbi8vIExvYWQgc2hhZGVycyB1c2luZyBYSFJcbi8vIEBkZXByZWNhdGVkIC0gVXNlIGdsc2xpZnkgaW5zdGVhZFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1ha2VQcm9ncmFtRnJvbVNoYWRlclVSSXMoZ2wsIHZzLCBmcywgb3B0cykge1xuICBvcHRzID0gbWVyZ2Uoe1xuICAgIHBhdGg6ICcvJyxcbiAgICBub0NhY2hlOiBmYWxzZVxuICB9LCBvcHRzKTtcblxuICBjb25zdCB2ZXJ0ZXhTaGFkZXJVUkkgPSBvcHRzLnBhdGggKyB2cztcbiAgY29uc3QgZnJhZ21lbnRTaGFkZXJVUkkgPSBvcHRzLnBhdGggKyBmcztcblxuICBjb25zdCByZXNwb25zZXMgPSBhd2FpdCBuZXcgWEhSR3JvdXAoe1xuICAgIHVybHM6IFt2ZXJ0ZXhTaGFkZXJVUkksIGZyYWdtZW50U2hhZGVyVVJJXSxcbiAgICBub0NhY2hlOiBvcHRzLm5vQ2FjaGVcbiAgfSkuc2VuZEFzeW5jKCk7XG5cbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7dnM6IHJlc3BvbnNlc1swXSwgZnM6IHJlc3BvbnNlc1sxXX0pO1xufVxuIiwiaW1wb3J0IHtkZWZhdWx0IGFzIEZ4fSBmcm9tICcuL2Z4JztcbmltcG9ydCB7ZGVmYXVsdCBhcyBXb3JrZXJHcm91cH0gZnJvbSAnLi93b3JrZXJzJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi9oZWxwZXJzJztcblxuZXhwb3J0IHtkZWZhdWx0IGFzIEZ4fSBmcm9tICcuL2Z4JztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBXb3JrZXJHcm91cH0gZnJvbSAnLi93b3JrZXJzJztcbmV4cG9ydCAqIGZyb20gJy4vaGVscGVycyc7XG5cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuTHVtYUdMKSB7XG4gIHdpbmRvdy5MdW1hR0wuYWRkb25zID0ge1xuICAgIEZ4OiBGeCxcbiAgICBXb3JrZXJHcm91cDogV29ya2VyR3JvdXBcbiAgfTtcbiAgT2JqZWN0LmFzc2lnbih3aW5kb3cuTHVtYUdMLmFkZG9ucywgaGVscGVycyk7XG59XG4iLCIvLyB3b3JrZXJzLmpzXG4vL1xuLyogZ2xvYmFsIFdvcmtlciAqL1xuLyogZXNsaW50LWRpc2FibGUgb25lLXZhciwgaW5kZW50ICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdvcmtlckdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihmaWxlTmFtZSwgbikge1xuICAgIHZhciB3b3JrZXJzID0gdGhpcy53b3JrZXJzID0gW107XG4gICAgd2hpbGUgKG4tLSkge1xuICAgICAgd29ya2Vycy5wdXNoKG5ldyBXb3JrZXIoZmlsZU5hbWUpKTtcbiAgICB9XG4gIH1cblxuICBtYXAoZnVuYykge1xuICAgIHZhciB3b3JrZXJzID0gdGhpcy53b3JrZXJzO1xuICAgIHZhciBjb25maWdzID0gdGhpcy5jb25maWdzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHdvcmtlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBjb25maWdzLnB1c2goZnVuYyAmJiBmdW5jKGkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlZHVjZShvcHQpIHtcbiAgICB2YXIgZm4gPSBvcHQucmVkdWNlRm4sXG4gICAgICAgIHdvcmtlcnMgPSB0aGlzLndvcmtlcnMsXG4gICAgICAgIGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3MsXG4gICAgICAgIGwgPSB3b3JrZXJzLmxlbmd0aCxcbiAgICAgICAgYWN1bSA9IG9wdC5pbml0aWFsVmFsdWUsXG4gICAgICAgIG1lc3NhZ2UgPSBmdW5jdGlvbiBfKGUpIHtcbiAgICAgICAgICBsLS07XG4gICAgICAgICAgaWYgKGFjdW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYWN1bSA9IGUuZGF0YTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWN1bSA9IGZuKGFjdW0sIGUuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsID09PSAwKSB7XG4gICAgICAgICAgICBvcHQub25Db21wbGV0ZShhY3VtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgZm9yICh2YXIgaSA9IDAsIGxuID0gbDsgaSA8IGxuOyBpKyspIHtcbiAgICAgIHZhciB3ID0gd29ya2Vyc1tpXTtcbiAgICAgIHcub25tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgIHcucG9zdE1lc3NhZ2UoY29uZmlnc1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuIiwiLy8gUHJvdmlkZXMgbG9hZGluZyBvZiBhc3NldHMgd2l0aCBYSFIgYW5kIEpTT05QIG1ldGhvZHMuXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4sIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGRvY3VtZW50LCBYTUxIdHRwUmVxdWVzdCwgSW1hZ2UgKi9cbmltcG9ydCB7dWlkLCBzcGxhdCwgbWVyZ2UsIG5vb3B9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vd2ViZ2wnO1xuXG5leHBvcnQgY2xhc3MgWEhSIHtcblxuICBjb25zdHJ1Y3RvcihvcHQgPSB7fSkge1xuICAgIG9wdCA9IHtcbiAgICAgIHVybDogJ2h0dHA6Ly8gcGhpbG9nbGpzLm9yZy8nLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgbm9DYWNoZTogZmFsc2UsXG4gICAgICAvLyBib2R5OiBudWxsLFxuICAgICAgc2VuZEFzQmluYXJ5OiBmYWxzZSxcbiAgICAgIHJlc3BvbnNlVHlwZTogZmFsc2UsXG4gICAgICBvblByb2dyZXNzOiBub29wLFxuICAgICAgb25TdWNjZXNzOiBub29wLFxuICAgICAgb25FcnJvcjogbm9vcCxcbiAgICAgIG9uQWJvcnQ6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wLFxuICAgICAgLi4ub3B0XG4gICAgfTtcblxuICAgIHRoaXMub3B0ID0gb3B0O1xuICAgIHRoaXMuaW5pdFhIUigpO1xuICB9XG5cbiAgaW5pdFhIUigpIHtcbiAgICBjb25zdCByZXEgPSB0aGlzLnJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgWydQcm9ncmVzcycsICdFcnJvcicsICdBYm9ydCcsICdMb2FkJ10uZm9yRWFjaChldmVudCA9PiB7XG4gICAgICBpZiAocmVxLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgcmVxLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQudG9Mb3dlckNhc2UoKSwgZSA9PiB7XG4gICAgICAgICAgc2VsZlsnaGFuZGxlJyArIGV2ZW50XShlKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxWydvbicgKyBldmVudC50b0xvd2VyQ2FzZSgpXSA9IGUgPT4ge1xuICAgICAgICAgIHNlbGZbJ2hhbmRsZScgKyBldmVudF0oZSk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kQXN5bmMoYm9keSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB7cmVxLCBvcHR9ID0gdGhpcztcbiAgICAgIGNvbnN0IHthc3luY30gPSBvcHQ7XG5cbiAgICAgIGlmIChvcHQubm9DYWNoZSkge1xuICAgICAgICBvcHQudXJsICs9IChvcHQudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICAgICAgfVxuXG4gICAgICByZXEub3BlbihvcHQubWV0aG9kLCBvcHQudXJsLCBhc3luYyk7XG5cbiAgICAgIGlmIChvcHQucmVzcG9uc2VUeXBlKSB7XG4gICAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSBvcHQucmVzcG9uc2VUeXBlO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXN5bmMpIHtcbiAgICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWEhSLlN0YXRlLkNPTVBMRVRFRCkge1xuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1cykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdC5zZW5kQXNCaW5hcnkpIHtcbiAgICAgICAgcmVxLnNlbmRBc0JpbmFyeShib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxLnNlbmQoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFhc3luYykge1xuICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNlbmQoYm9keSkge1xuICAgIGNvbnN0IHtyZXEsIG9wdH0gPSB0aGlzO1xuICAgIGNvbnN0IGFzeW5jID0gb3B0LmFzeW5jO1xuXG4gICAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgICBvcHQudXJsICs9IChvcHQudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICAgIH1cblxuICAgIHJlcS5vcGVuKG9wdC5tZXRob2QsIG9wdC51cmwsIGFzeW5jKTtcblxuICAgIGlmIChvcHQucmVzcG9uc2VUeXBlKSB7XG4gICAgICByZXEucmVzcG9uc2VUeXBlID0gb3B0LnJlc3BvbnNlVHlwZTtcbiAgICB9XG5cbiAgICBpZiAoYXN5bmMpIHtcbiAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlID0+IHtcbiAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFIuU3RhdGUuQ09NUExFVEVEKSB7XG4gICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgb3B0Lm9uU3VjY2VzcyhyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdC5vbkVycm9yKHJlcS5zdGF0dXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAob3B0LnNlbmRBc0JpbmFyeSkge1xuICAgICAgcmVxLnNlbmRBc0JpbmFyeShib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXEuc2VuZChib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgIH1cblxuICAgIGlmICghYXN5bmMpIHtcbiAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgb3B0Lm9uU3VjY2VzcyhyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHQub25FcnJvcihyZXEuc3RhdHVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpIHtcbiAgICB0aGlzLnJlcS5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaGFuZGxlUHJvZ3Jlc3MoZSkge1xuICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgIHRoaXMub3B0Lm9uUHJvZ3Jlc3MoZSwgTWF0aC5yb3VuZChlLmxvYWRlZCAvIGUudG90YWwgKiAxMDApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcHQub25Qcm9ncmVzcyhlLCAtMSk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRXJyb3IoZSkge1xuICAgIHRoaXMub3B0Lm9uRXJyb3IoZSk7XG4gIH1cblxuICBoYW5kbGVBYm9ydChlKSB7XG4gICAgdGhpcy5vcHQub25BYm9ydChlKTtcbiAgfVxuXG4gIGhhbmRsZUxvYWQoZSkge1xuICAgIHRoaXMub3B0Lm9uQ29tcGxldGUoZSk7XG4gIH1cbn1cblxuWEhSLlN0YXRlID0ge307XG5bJ1VOSU5JVElBTElaRUQnLCAnTE9BRElORycsICdMT0FERUQnLCAnSU5URVJBQ1RJVkUnLCAnQ09NUExFVEVEJ11cbi5mb3JFYWNoKChzdGF0ZU5hbWUsIGkpID0+IHtcbiAgWEhSLlN0YXRlW3N0YXRlTmFtZV0gPSBpO1xufSk7XG5cbi8vIE1ha2UgcGFyYWxsZWwgcmVxdWVzdHMgYW5kIGdyb3VwIHRoZSByZXNwb25zZXMuXG5leHBvcnQgY2xhc3MgWEhSR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKG9wdCA9IHt9KSB7XG4gICAgb3B0ID0ge1xuICAgICAgdXJsczogW10sXG4gICAgICBvblN1Y2Nlc3M6IG5vb3AsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgYXN5bmM6IHRydWUsXG4gICAgICBub0NhY2hlOiBmYWxzZSxcbiAgICAgIC8vIGJvZHk6IG51bGwsXG4gICAgICBzZW5kQXNCaW5hcnk6IGZhbHNlLFxuICAgICAgcmVzcG9uc2VUeXBlOiBmYWxzZSxcbiAgICAgIC4uLm9wdFxuICAgIH07XG5cbiAgICB2YXIgdXJscyA9IHNwbGF0KG9wdC51cmxzKTtcbiAgICB0aGlzLnJlcXMgPSB1cmxzLm1hcCgodXJsLCBpKSA9PiBuZXcgWEhSKHtcbiAgICAgIHVybDogdXJsLFxuICAgICAgbWV0aG9kOiBvcHQubWV0aG9kLFxuICAgICAgYXN5bmM6IG9wdC5hc3luYyxcbiAgICAgIG5vQ2FjaGU6IG9wdC5ub0NhY2hlLFxuICAgICAgc2VuZEFzQmluYXJ5OiBvcHQuc2VuZEFzQmluYXJ5LFxuICAgICAgcmVzcG9uc2VUeXBlOiBvcHQucmVzcG9uc2VUeXBlLFxuICAgICAgYm9keTogb3B0LmJvZHlcbiAgICB9KSk7XG4gIH1cblxuICBhc3luYyBzZW5kQXN5bmMoKSB7XG4gICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHRoaXMucmVxcy5tYXAocmVxID0+IHJlcS5zZW5kQXN5bmMoKSkpO1xuICB9XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEpTT05QKG9wdCkge1xuICBvcHQgPSBtZXJnZSh7XG4gICAgdXJsOiAnaHR0cDovLyBwaGlsb2dsanMub3JnLycsXG4gICAgZGF0YToge30sXG4gICAgbm9DYWNoZTogZmFsc2UsXG4gICAgb25Db21wbGV0ZTogbm9vcCxcbiAgICBjYWxsYmFja0tleTogJ2NhbGxiYWNrJ1xuICB9LCBvcHQgfHwge30pO1xuXG4gIHZhciBpbmRleCA9IEpTT05QLmNvdW50ZXIrKztcbiAgLy8gY3JlYXRlIHF1ZXJ5IHN0cmluZ1xuICB2YXIgZGF0YSA9IFtdO1xuICBmb3IgKHZhciBwcm9wIGluIG9wdC5kYXRhKSB7XG4gICAgZGF0YS5wdXNoKHByb3AgKyAnPScgKyBvcHQuZGF0YVtwcm9wXSk7XG4gIH1cbiAgZGF0YSA9IGRhdGEuam9pbignJicpO1xuICAvLyBhcHBlbmQgdW5pcXVlIGlkIGZvciBjYWNoZVxuICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICBkYXRhICs9IChkYXRhLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICB9XG4gIC8vIGNyZWF0ZSBzb3VyY2UgdXJsXG4gIHZhciBzcmMgPSBvcHQudXJsICtcbiAgICAob3B0LnVybC5pbmRleE9mKCc/JykgPiAtMSA/ICcmJyA6ICc/JykgK1xuICAgIG9wdC5jYWxsYmFja0tleSArICc9UGhpbG9HTCBJTy5KU09OUC5yZXF1ZXN0cy5yZXF1ZXN0XycgKyBpbmRleCArXG4gICAgKGRhdGEubGVuZ3RoID4gMCA/ICcmJyArIGRhdGEgOiAnJyk7XG5cbiAgLy8gY3JlYXRlIHNjcmlwdFxuICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gIHNjcmlwdC5zcmMgPSBzcmM7XG5cbiAgLy8gY3JlYXRlIGNhbGxiYWNrXG4gIEpTT05QLnJlcXVlc3RzWydyZXF1ZXN0XycgKyBpbmRleF0gPSBmdW5jdGlvbihqc29uKSB7XG4gICAgb3B0Lm9uQ29tcGxldGUoanNvbik7XG4gICAgLy8gcmVtb3ZlIHNjcmlwdFxuICAgIGlmIChzY3JpcHQucGFyZW50Tm9kZSkge1xuICAgICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICB9XG4gICAgaWYgKHNjcmlwdC5jbGVhckF0dHJpYnV0ZXMpIHtcbiAgICAgIHNjcmlwdC5jbGVhckF0dHJpYnV0ZXMoKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gaW5qZWN0IHNjcmlwdFxuICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG59XG5cbkpTT05QLmNvdW50ZXIgPSAwO1xuSlNPTlAucmVxdWVzdHMgPSB7fTtcblxuLy8gQ3JlYXRlcyBhbiBpbWFnZS1sb2FkaW5nIHByb21pc2UuXG5mdW5jdGlvbiBsb2FkSW1hZ2Uoc3JjKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlc29sdmUoaW1hZ2UpO1xuICAgIH07XG4gICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihgQ291bGQgbm90IGxvYWQgaW1hZ2UgJHtzcmN9LmApKTtcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IHNyYztcbiAgfSk7XG59XG5cbi8vIExvYWQgbXVsdGlwbGUgaW1hZ2VzIGFzeW5jLlxuLy8gcnllOiBUT0RPIHRoaXMgbmVlZHMgdG8gaW1wbGVtZW50IGZ1bmN0aW9uYWxpdHkgZnJvbSB0aGVcbi8vICAgICAgICAgICBvcmlnaW5hbCBJbWFnZXMgZnVuY3Rpb24uXG5hc3luYyBmdW5jdGlvbiBsb2FkSW1hZ2VzKHNyY3MpIHtcbiAgbGV0IGltYWdlUHJvbWlzZXMgPSBzcmNzLm1hcCgoc3JjKSA9PiBsb2FkSW1hZ2Uoc3JjKSk7XG4gIGxldCByZXN1bHRzID0gW107XG4gIGZvciAoY29uc3QgaW1hZ2VQcm9taXNlIG9mIGltYWdlUHJvbWlzZXMpIHtcbiAgICByZXN1bHRzLnB1c2goYXdhaXQgaW1hZ2VQcm9taXNlKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gLy8gTG9hZCBtdWx0aXBsZSBJbWFnZSBhc3NldHMgYXN5bmNcbi8vIGV4cG9ydCBmdW5jdGlvbiBJbWFnZXMob3B0KSB7XG4vLyAgIG9wdCA9IG1lcmdlKHtcbi8vICAgICBzcmM6IFtdLFxuLy8gICAgIG5vQ2FjaGU6IGZhbHNlLFxuLy8gICAgIG9uUHJvZ3Jlc3M6IG5vb3AsXG4vLyAgICAgb25Db21wbGV0ZTogbm9vcFxuLy8gICB9LCBvcHQgfHwge30pO1xuLy9cbi8vICAgbGV0IGNvdW50ID0gMDtcbi8vICAgbGV0IGwgPSBvcHQuc3JjLmxlbmd0aDtcbi8vXG4vLyAgIGxldCBpbWFnZXM7XG4vLyAgIC8vIEltYWdlIG9ubG9hZCBoYW5kbGVyXG4vLyAgIHZhciBsb2FkID0gKCkgPT4ge1xuLy8gICAgIG9wdC5vblByb2dyZXNzKE1hdGgucm91bmQoKytjb3VudCAvIGwgKiAxMDApKTtcbi8vICAgICBpZiAoY291bnQgPT09IGwpIHtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKGltYWdlcyk7XG4vLyAgICAgfVxuLy8gICB9O1xuLy8gICAvLyBJbWFnZSBlcnJvciBoYW5kbGVyXG4vLyAgIHZhciBlcnJvciA9ICgpID0+IHtcbi8vICAgICBpZiAoKytjb3VudCA9PT0gbCkge1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoaW1hZ2VzKTtcbi8vICAgICB9XG4vLyAgIH07XG4vL1xuLy8gICAvLyB1aWQgZm9yIGltYWdlIHNvdXJjZXNcbi8vICAgY29uc3Qgbm9DYWNoZSA9IG9wdC5ub0NhY2hlO1xuLy8gICBjb25zdCB1aWQgPSB1aWQoKTtcbi8vICAgZnVuY3Rpb24gZ2V0U3VmZml4KHMpIHtcbi8vICAgICByZXR1cm4gKHMuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkO1xuLy8gICB9XG4vL1xuLy8gICAvLyBDcmVhdGUgaW1hZ2UgYXJyYXlcbi8vICAgaW1hZ2VzID0gb3B0LnNyYy5tYXAoKHNyYywgaSkgPT4ge1xuLy8gICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuLy8gICAgIGltZy5pbmRleCA9IGk7XG4vLyAgICAgaW1nLm9ubG9hZCA9IGxvYWQ7XG4vLyAgICAgaW1nLm9uZXJyb3IgPSBlcnJvcjtcbi8vICAgICBpbWcuc3JjID0gc3JjICsgKG5vQ2FjaGUgPyBnZXRTdWZmaXgoc3JjKSA6ICcnKTtcbi8vICAgICByZXR1cm4gaW1nO1xuLy8gICB9KTtcbi8vXG4vLyAgIHJldHVybiBpbWFnZXM7XG4vLyB9XG5cbi8vIExvYWQgbXVsdGlwbGUgdGV4dHVyZXMgZnJvbSBpbWFnZXNcbi8vIHJ5ZTogVE9ETyB0aGlzIG5lZWRzIHRvIGltcGxlbWVudCBmdW5jdGlvbmFsaXR5IGZyb21cbi8vICAgICAgICAgICB0aGUgb3JpZ2luYWwgbG9hZFRleHR1cmVzIGZ1bmN0aW9uLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRUZXh0dXJlcyhnbCwgb3B0KSB7XG4gIHZhciBpbWFnZXMgPSBhd2FpdCBsb2FkSW1hZ2VzKG9wdC5zcmMpO1xuICB2YXIgdGV4dHVyZXMgPSBbXTtcbiAgaW1hZ2VzLmZvckVhY2goKGltZywgaSkgPT4ge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5pc0FycmF5KG9wdC5wYXJhbWV0ZXJzKSA/XG4gICAgICBvcHQucGFyYW1ldGVyc1tpXSA6IG9wdC5wYXJhbWV0ZXJzO1xuICAgIHBhcmFtcyA9IHBhcmFtcyA9PT0gdW5kZWZpbmVkID8ge30gOiBwYXJhbXM7XG4gICAgdGV4dHVyZXMucHVzaChuZXcgVGV4dHVyZTJEKGdsLCBtZXJnZSh7XG4gICAgICBkYXRhOiBpbWdcbiAgICB9LCBwYXJhbXMpKSk7XG4gIH0pO1xuICByZXR1cm4gdGV4dHVyZXM7XG59XG5cbi8vIC8vIExvYWQgbXVsdGlwbGUgdGV4dHVyZXMgZnJvbSBpbWFnZXNcbi8vIGV4cG9ydCBmdW5jdGlvbiBsb2FkVGV4dHVyZXMob3B0ID0ge30pIHtcbi8vICAgb3B0ID0ge1xuLy8gICAgIHNyYzogW10sXG4vLyAgICAgbm9DYWNoZTogZmFsc2UsXG4vLyAgICAgb25Db21wbGV0ZTogbm9vcCxcbi8vICAgICAuLi5vcHRcbi8vICAgfTtcbi8vXG4vLyAgIEltYWdlcyh7XG4vLyAgICAgc3JjOiBvcHQuc3JjLFxuLy8gICAgIG5vQ2FjaGU6IG9wdC5ub0NhY2hlLFxuLy8gICAgIG9uQ29tcGxldGUoaW1hZ2VzKSB7XG4vLyAgICAgICB2YXIgdGV4dHVyZXMgPSB7fTtcbi8vICAgICAgIGltYWdlcy5mb3JFYWNoKChpbWcsIGkpID0+IHtcbi8vICAgICAgICAgdGV4dHVyZXNbb3B0LmlkICYmIG9wdC5pZFtpXSB8fCBvcHQuc3JjICYmIG9wdC5zcmNbaV1dID0gbWVyZ2Uoe1xuLy8gICAgICAgICAgIGRhdGE6IHtcbi8vICAgICAgICAgICAgIHZhbHVlOiBpbWdcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgIH0sIG9wdCk7XG4vLyAgICAgICB9KTtcbi8vICAgICAgIGFwcC5zZXRUZXh0dXJlcyh0ZXh0dXJlcyk7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZSgpO1xuLy8gICAgIH1cbi8vICAgfSk7XG4vLyB9XG4iLCIvLyBEZWZhdWx0IFNoYWRlcnNcbnZhciBnbHNsaWZ5ID0gcmVxdWlyZSgnZ2xzbGlmeScpO1xuXG4vLyBUT0RPIC0gYWRvcHQgZ2xzbGlmeVxuY29uc3QgU2hhZGVycyA9IHtcbiAgVmVydGV4OiB7XG4gICAgRGVmYXVsdDogZ2xzbGlmeSgnLi9kZWZhdWx0LXZlcnRleCcpXG4gIH0sXG4gIEZyYWdtZW50OiB7XG4gICAgRGVmYXVsdDogZ2xzbGlmeSgnLi9kZWZhdWx0LWZyYWdtZW50JylcbiAgfVxufTtcblxuU2hhZGVycy52cyA9IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQ7XG5TaGFkZXJzLmZzID0gU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG5leHBvcnQgZGVmYXVsdCBTaGFkZXJzO1xuXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4gKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLyoqXG4gKiBXcmFwcyB0aGUgYXJndW1lbnQgaW4gYW4gYXJyYXkgaWYgaXQgaXMgbm90IG9uZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhIC0gVGhlIG9iamVjdCB0byB3cmFwLlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5XG4gKiovXG5leHBvcnQgZnVuY3Rpb24gc3BsYXQoYSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhKSAmJiBhIHx8IFthXTtcbn1cblxuLyoqXG4qIFByb3ZpZGVzIGEgc3RhbmRhcmQgbm9vcCBmdW5jdGlvbi5cbioqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG52YXIgX3VpZCA9IERhdGUubm93KCk7XG5cbi8qKlxuICogUmV0dXJucyBhIFVJRC5cbiAqIEByZXR1cm4ge251bWJlcn0gdWlkXG4gKiovXG5leHBvcnQgZnVuY3Rpb24gdWlkKCkge1xuICByZXR1cm4gX3VpZCsrO1xufVxuXG4vKipcbiAqIE1lcmdlIG11bHRpcGxlIG9iamVjdHMgaW50byBvbmUuXG4gKiBAcGFyYW0gey4uLm9iamVjdH0gb2JqZWN0cyAtIFRoZSBvYmplY3RzIHRvIG1lcmdlLlxuICogQHJldHVybiB7b2JqZWN0fSBvYmplY3RcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZShvYmplY3RzKSB7XG4gIGNvbnN0IG1peCA9IHt9O1xuICBmb3IgKGxldCBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBvYmplY3QgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lICE9PSAnT2JqZWN0Jykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGNvbnN0IG9wID0gb2JqZWN0W2tleV07XG4gICAgICBjb25zdCBtcCA9IG1peFtrZXldO1xuICAgICAgaWYgKG1wICYmIG9wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnICYmXG4gICAgICAgIG1wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSB7XG4gICAgICAgIG1peFtrZXldID0gbWVyZ2UobXAsIG9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1peFtrZXldID0gZGV0YWNoKG9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1peDtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgZHVwbGljYXRpbmcgYW4gb2JqZWN0LlxuICogQHBhcmFtIHtvYmplY3R9IGVsZW0gLSBUaGUgb2JqZWN0IHRvIHJlY3Vyc2l2ZWx5IGR1cGxpY2F0ZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5mdW5jdGlvbiBkZXRhY2goZWxlbSkge1xuICBjb25zdCB0ID0gZWxlbS5jb25zdHJ1Y3Rvci5uYW1lO1xuICBsZXQgYW5zO1xuICBpZiAodCA9PT0gJ09iamVjdCcpIHtcbiAgICBhbnMgPSB7fTtcbiAgICBmb3IgKHZhciBwIGluIGVsZW0pIHtcbiAgICAgIGFuc1twXSA9IGRldGFjaChlbGVtW3BdKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodCA9PT0gJ0FycmF5Jykge1xuICAgIGFucyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZWxlbS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGFuc1tpXSA9IGRldGFjaChlbGVtW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYW5zID0gZWxlbTtcbiAgfVxuXG4gIHJldHVybiBhbnM7XG59XG5cbi8vIFRZUEVEIEFSUkFZU1xuXG5leHBvcnQgZnVuY3Rpb24gaXNUeXBlZEFycmF5KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5CWVRFU19QRVJfRUxFTUVOVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VUeXBlZEFycmF5KEFycmF5VHlwZSwgc291cmNlQXJyYXkpIHtcbiAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoc291cmNlQXJyYXkpKTtcbiAgY29uc3QgYXJyYXkgPSBuZXcgQXJyYXlUeXBlKHNvdXJjZUFycmF5Lmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlQXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICBhcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cbiIsIi8vIEVuY2Fwc3VsYXRlcyBhIFdlYkdMQnVmZmVyIG9iamVjdFxuXG5pbXBvcnQge2dldEV4dGVuc2lvbiwgZ2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCdWZmZXIge1xuXG4gIHN0YXRpYyBnZXREZWZhdWx0T3B0cyhnbCkge1xuICAgIHJldHVybiB7XG4gICAgICBidWZmZXJUeXBlOiBnbC5BUlJBWV9CVUZGRVIsXG4gICAgICBzaXplOiAxLFxuICAgICAgZGF0YVR5cGU6IGdsLkZMT0FULFxuICAgICAgc3RyaWRlOiAwLFxuICAgICAgb2Zmc2V0OiAwLFxuICAgICAgZHJhd01vZGU6IGdsLlNUQVRJQ19EUkFXLFxuICAgICAgaW5zdGFuY2VkOiAwXG4gICAgfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogU2V0IHVwIGEgZ2wgYnVmZmVyIG9uY2UgYW5kIHJlcGVhdGVkbHkgYmluZCBhbmQgdW5iaW5kIGl0LlxuICAgKiBIb2xkcyBhbiBhdHRyaWJ1dGUgbmFtZSBhcyBhIGNvbnZlbmllbmNlLi4uXG4gICAqXG4gICAqIEBwYXJhbXt9IG9wdHMuZGF0YSAtIG5hdGl2ZSBhcnJheVxuICAgKiBAcGFyYW17c3RyaW5nfSBvcHRzLmF0dHJpYnV0ZSAtIG5hbWUgb2YgYXR0cmlidXRlIGZvciBtYXRjaGluZ1xuICAgKiBAcGFyYW17fSBvcHRzLmJ1ZmZlclR5cGUgLSBidWZmZXIgdHlwZSAoY2FsbGVkIFwidGFyZ2V0XCIgaW4gR0wgZG9jcylcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgYXNzZXJ0KGdsLCAnQnVmZmVyIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIEJ1ZmZlci5nZXREZWZhdWx0T3B0cyhnbCksIG9wdHMpO1xuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyB0b2RvIC0gcmVtb3ZlXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZWxldGUoKTtcbiAgfVxuXG4gIC8qIFVwZGF0ZXMgZGF0YSBpbiB0aGUgYnVmZmVyICovXG4gIHVwZGF0ZShvcHRzID0ge30pIHtcbiAgICBhc3NlcnQob3B0cy5kYXRhLCAnQnVmZmVyIG5lZWRzIGRhdGEgYXJndW1lbnQnKTtcbiAgICB0aGlzLmF0dHJpYnV0ZSA9IG9wdHMuYXR0cmlidXRlIHx8IHRoaXMuYXR0cmlidXRlO1xuICAgIHRoaXMuYnVmZmVyVHlwZSA9IG9wdHMuYnVmZmVyVHlwZSB8fCB0aGlzLmJ1ZmZlclR5cGU7XG4gICAgdGhpcy5zaXplID0gb3B0cy5zaXplIHx8IHRoaXMuc2l6ZTtcbiAgICB0aGlzLmRhdGFUeXBlID0gb3B0cy5kYXRhVHlwZSB8fCB0aGlzLmRhdGFUeXBlO1xuICAgIHRoaXMuc3RyaWRlID0gb3B0cy5zdHJpZGUgfHwgdGhpcy5zdHJpZGU7XG4gICAgdGhpcy5vZmZzZXQgPSBvcHRzLm9mZnNldCB8fCB0aGlzLm9mZnNldDtcbiAgICB0aGlzLmRyYXdNb2RlID0gb3B0cy5kcmF3TW9kZSB8fCB0aGlzLmRyYXdNb2RlO1xuICAgIHRoaXMuaW5zdGFuY2VkID0gb3B0cy5pbnN0YW5jZWQgfHwgdGhpcy5pbnN0YW5jZWQ7XG5cbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGEgfHwgdGhpcy5kYXRhO1xuICAgIGlmICh0aGlzLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5idWZmZXJEYXRhKHRoaXMuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgYnVmZmVyRGF0YShkYXRhKSB7XG4gICAgYXNzZXJ0KGRhdGEsICdCdWZmZXIuYnVmZmVyRGF0YSBuZWVkcyBkYXRhJyk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5kYXRhLCB0aGlzLmRyYXdNb2RlKTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGF0dGFjaFRvTG9jYXRpb24obG9jYXRpb24pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICAvLyBCaW5kIHRoZSBidWZmZXIgc28gdGhhdCB3ZSBjYW4gb3BlcmF0ZSBvbiBpdFxuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvLyBFbmFibGUgdGhlIGF0dHJpYnV0ZVxuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAvLyBTcGVjaWZ5IGJ1ZmZlciBmb3JtYXRcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKFxuICAgICAgbG9jYXRpb24sXG4gICAgICB0aGlzLnNpemUsIHRoaXMuZGF0YVR5cGUsIGZhbHNlLCB0aGlzLnN0cmlkZSwgdGhpcy5vZmZzZXRcbiAgICApO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gVGhpcyBtYWtlcyBpdCBhbiBpbnN0YW5jZWQgYXR0cmlidXRlXG4gICAgICBleHRlbnNpb24udmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGxvY2F0aW9uLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAodGhpcy5pbnN0YW5jZWQpIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihnbCwgJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICAgIC8vIENsZWFyIGluc3RhbmNlZCBmbGFnXG4gICAgICBleHRlbnNpb24udmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGxvY2F0aW9uLCAwKTtcbiAgICB9XG4gICAgLy8gRGlzYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAvLyBVbmJpbmQgdGhlIGJ1ZmZlciBwZXIgd2ViZ2wgcmVjb21tZW5kYXRpb25zXG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iLCIvLyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgcmVsYXRlZCBtZXRob2RzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2gsIG5vLWNvbnNvbGUsIG5vLWxvb3AtZnVuYyAqL1xuLyogZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQsIGNvbnNvbGUgKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQ2hlY2tzIGlmIFdlYkdMIGlzIGVuYWJsZWQgYW5kIGNyZWF0ZXMgYSBjb250ZXh0IGZvciB1c2luZyBXZWJHTC5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHTENvbnRleHQoY2FudmFzLCBvcHQgPSB7fSkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2FuJ3QgY3JlYXRlIGEgV2ViR0wgY29udGV4dCBvdXRzaWRlIGEgYnJvd3NlciBjb250ZXh0LmApO1xuICB9XG4gIGNhbnZhcyA9IHR5cGVvZiBjYW52YXMgPT09ICdzdHJpbmcnID9cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpIDogY2FudmFzO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd3ZWJnbGNvbnRleHRjcmVhdGlvbmVycm9yJywgZSA9PiB7XG4gICAgY29uc29sZS5sb2coZS5zdGF0dXNNZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJyk7XG4gIH0sIGZhbHNlKTtcblxuICAvLyBQcmVmZXIgd2ViZ2wyIG92ZXIgd2ViZ2wxLCBwcmVmZXIgY29uZm9ybWFudCBvdmVyIGV4cGVyaW1lbnRhbFxuICBsZXQgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsMicsIG9wdCk7XG4gIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgb3B0KTtcblxuICBhc3NlcnQoZ2wsICdGYWlsZWQgdG8gY3JlYXRlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuXG4gIC8vIFNldCBhcyBkZWJ1ZyBoYW5kbGVyXG4gIGdsID0gb3B0LmRlYnVnID8gY3JlYXRlRGVidWdDb250ZXh0KGdsKSA6IGdsO1xuXG4gIC8vIEFkZCBhIHNhZmUgZ2V0IG1ldGhvZFxuICBnbC5nZXQgPSBmdW5jdGlvbiBnbEdldChuYW1lKSB7XG4gICAgbGV0IHZhbHVlID0gbmFtZTtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgICBhc3NlcnQodmFsdWUsIGBBY2Nlc3NpbmcgZ2wuJHtuYW1lfWApO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgcmV0dXJuIGdsO1xuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNXZWJHTCgpIHtcbiAgaWYgKCFpc0Jyb3dzZXJDb250ZXh0KCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gRmVhdHVyZSB0ZXN0IFdlYkdMXG4gIHRyeSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgcmV0dXJuIEJvb2xlYW4od2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCAmJlxuICAgICAgKGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKSkpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzRXh0ZW5zaW9uKG5hbWUpIHtcbiAgaWYgKCFoYXNXZWJHTCgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHxcbiAgICBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gIC8vIFNob3VsZCBtYXliZSBiZSByZXR1cm4gISFjb250ZXh0LmdldEV4dGVuc2lvbihuYW1lKTtcbiAgcmV0dXJuIGNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBleHRlbnNpb24gb3IgdGhyb3dzIGFuIGVycm9yXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGdsLCBleHRlbnNpb25OYW1lKSB7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb25OYW1lKTtcbiAgYXNzZXJ0KGV4dGVuc2lvbiwgYCR7ZXh0ZW5zaW9uTmFtZX0gbm90IHN1cHBvcnRlZCFgKTtcbiAgcmV0dXJuIGV4dGVuc2lvbjtcbn1cblxuZnVuY3Rpb24gaXNCcm93c2VyQ29udGV4dCgpIHtcbiAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vLyBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdpdGggZ2wgc3RhdGVzIHRlbXBvcmFyaWx5IHNldCwgZXhjZXB0aW9uIHNhZmVcbi8vIEN1cnJlbnRseSBzdXBwb3J0IHNjaXNzb3IgdGVzdCBhbmQgZnJhbWVidWZmZXIgYmluZGluZ1xuZXhwb3J0IGZ1bmN0aW9uIGdsQ29udGV4dFdpdGhTdGF0ZShnbCwge3NjaXNzb3JUZXN0LCBmcmFtZUJ1ZmZlcn0sIGZ1bmMpIHtcbiAgbGV0IHNjaXNzb3JUZXN0V2FzRW5hYmxlZDtcbiAgaWYgKHNjaXNzb3JUZXN0KSB7XG4gICAgc2Npc3NvclRlc3RXYXNFbmFibGVkID0gZ2wuaXNFbmFibGVkKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgY29uc3Qge3gsIHksIHcsIGh9ID0gc2Npc3NvclRlc3Q7XG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCB5LCB3LCBoKTtcbiAgfVxuXG4gIGlmIChmcmFtZUJ1ZmZlcikge1xuICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlciB3ZSBuZWVkIHRvIHJlbWVtYmVyP1xuICAgIGZyYW1lQnVmZmVyLmJpbmQoKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgZnVuYyhnbCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFzY2lzc29yVGVzdFdhc0VuYWJsZWQpIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICB9XG4gICAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgICAvLyBUT0RPIC0gd2FzIHRoZXJlIGFueSBwcmV2aW91c2x5IHNldCBmcmFtZSBidWZmZXI/XG4gICAgICAvLyBUT0RPIC0gZGVsZWdhdGUgXCJ1bmJpbmRcIiB0byBGcmFtZWJ1ZmZlciBvYmplY3Q/XG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2xDaGVja0Vycm9yKGdsKSB7XG4gIC8vIEVuc3VyZSBhbGwgZXJyb3JzIGFyZSBjbGVhcmVkXG4gIGxldCBlcnJvcjtcbiAgbGV0IGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB3aGlsZSAoZ2xFcnJvciAhPT0gZ2wuTk9fRVJST1IpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihnbEdldEVycm9yTWVzc2FnZShnbCwgZ2xFcnJvcikpO1xuICAgIH1cbiAgICBnbEVycm9yID0gZ2wuZ2V0RXJyb3IoKTtcbiAgfVxuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBnbEdldEVycm9yTWVzc2FnZShnbCwgZ2xFcnJvcikge1xuICBzd2l0Y2ggKGdsRXJyb3IpIHtcbiAgY2FzZSBnbC5DT05URVhUX0xPU1RfV0VCR0w6XG4gICAgLy8gIElmIHRoZSBXZWJHTCBjb250ZXh0IGlzIGxvc3QsIHRoaXMgZXJyb3IgaXMgcmV0dXJuZWQgb24gdGhlXG4gICAgLy8gZmlyc3QgY2FsbCB0byBnZXRFcnJvci4gQWZ0ZXJ3YXJkcyBhbmQgdW50aWwgdGhlIGNvbnRleHQgaGFzIGJlZW5cbiAgICAvLyByZXN0b3JlZCwgaXQgcmV0dXJucyBnbC5OT19FUlJPUi5cbiAgICByZXR1cm4gJ1dlYkdMIGNvbnRleHQgbG9zdCc7XG5cbiAgY2FzZSBnbC5JTlZBTElEX0VOVU06XG4gICAgLy8gQW4gdW5hY2NlcHRhYmxlIHZhbHVlIGhhcyBiZWVuIHNwZWNpZmllZCBmb3IgYW4gZW51bWVyYXRlZCBhcmd1bWVudC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZW51bWVyYXRlZCBhcmd1bWVudCc7XG5cbiAgY2FzZSBnbC5JTlZBTElEX1ZBTFVFOlxuICAgIC8vIEEgbnVtZXJpYyBhcmd1bWVudCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIHZhbHVlJztcblxuICBjYXNlIGdsLklOVkFMSURfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBzcGVjaWZpZWQgY29tbWFuZCBpcyBub3QgYWxsb3dlZCBmb3IgdGhlIGN1cnJlbnQgc3RhdGUuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIG9wZXJhdGlvbic7XG5cbiAgY2FzZSBnbC5JTlZBTElEX0ZSQU1FQlVGRkVSX09QRVJBVElPTjpcbiAgICAvLyBUaGUgY3VycmVudGx5IGJvdW5kIGZyYW1lYnVmZmVyIGlzIG5vdCBmcmFtZWJ1ZmZlciBjb21wbGV0ZVxuICAgIC8vIHdoZW4gdHJ5aW5nIHRvIHJlbmRlciB0byBvciB0byByZWFkIGZyb20gaXQuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIGZyYW1lYnVmZmVyIG9wZXJhdGlvbic7XG5cbiAgY2FzZSBnbC5PVVRfT0ZfTUVNT1JZOlxuICAgIC8vIE5vdCBlbm91Z2ggbWVtb3J5IGlzIGxlZnQgdG8gZXhlY3V0ZSB0aGUgY29tbWFuZC5cbiAgICByZXR1cm4gJ1dlYkdMIG91dCBvZiBtZW1vcnknO1xuXG4gIGRlZmF1bHQ6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgdW5rbm93biBlcnJvcic7XG4gIH1cbn1cblxuLy8gVE9ETyAtIGRvY3VtZW50IG9yIHJlbW92ZVxuZnVuY3Rpb24gY3JlYXRlRGVidWdDb250ZXh0KGN0eCkge1xuICBjb25zdCBnbCA9IHt9O1xuICBmb3IgKHZhciBtIGluIGN0eCkge1xuICAgIHZhciBmID0gY3R4W21dO1xuICAgIGlmICh0eXBlb2YgZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZ2xbbV0gPSAoKGssIHYpID0+IHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuam9pbi5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBsZXQgYW5zO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhbnMgPSB2LmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7a30gJHtlfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBlcnJvclN0YWNrID0gW107XG4gICAgICAgICAgbGV0IGVycm9yO1xuICAgICAgICAgIHdoaWxlICgoZXJyb3IgPSBjdHguZ2V0RXJyb3IoKSkgIT09IGN0eC5OT19FUlJPUikge1xuICAgICAgICAgICAgZXJyb3JTdGFjay5wdXNoKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVycm9yU3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvclN0YWNrLmpvaW4oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFucztcbiAgICAgICAgfTtcbiAgICAgIH0pKG0sIGYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbFttXSA9IGY7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGdsO1xufVxuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cbi8vIFRPRE8gLSBnZW5lcmljIGRyYXcgY2FsbFxuLy8gT25lIG9mIHRoZSBnb29kIHRoaW5ncyBhYm91dCBHTCBpcyB0aGF0IHRoZXJlIGFyZSBzbyBtYW55IHdheXMgdG8gZHJhdyB0aGluZ3NcbmltcG9ydCB7Z2V0RXh0ZW5zaW9ufSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHtHTF9JTkRFWF9UWVBFUywgR0xfRFJBV19NT0RFU30gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIEEgZ29vZCB0aGluZyBhYm91dCB3ZWJHTCBpcyB0aGF0IHRoZXJlIGFyZSBzbyBtYW55IHdheXMgdG8gZHJhdyB0aGluZ3MuLi5cbi8vIFRPRE8gLSBVc2UgcG9seWZpbGxlZCBXZWJHTDIgbWV0aG9kcyBpbnN0ZWFkIG9mIEFOR0xFIGV4dGVuc2lvblxuZXhwb3J0IGZ1bmN0aW9uIGRyYXcoZ2wsIHtcbiAgZHJhd01vZGUsIHZlcnRleENvdW50LCBvZmZzZXQgPSAwLFxuICBpbmRleGVkLCBpbmRleFR5cGUgPSBudWxsLFxuICBpbnN0YW5jZWQgPSBmYWxzZSwgaW5zdGFuY2VDb3VudCA9IDBcbn0pIHtcbiAgZHJhd01vZGUgPSBnbC5nZXQoZHJhd01vZGUpO1xuICBpbmRleFR5cGUgPSBnbC5nZXQoaW5kZXhUeXBlKSB8fCBnbC5VTlNJR05FRF9TSE9SVDtcblxuICBhc3NlcnQoR0xfRFJBV19NT0RFUyhnbCkuaW5kZXhPZihkcmF3TW9kZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICBpZiAoaW5zdGFuY2VkKSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3RWxlbWVudHNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGluZGV4ZWQpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCk7XG4gIH1cbn1cblxuLy8gQ2FsbCB0aGUgcHJvcGVyIGRyYXcgZnVuY3Rpb24gZm9yIHRoZSB1c2VkIHByb2dyYW0gYmFzZWQgb24gYXR0cmlidXRlcyBldGNcbmV4cG9ydCBmdW5jdGlvbiBkcmF3Mih7Z2wsIGRyYXdNb2RlLCBlbGVtZW50VHlwZSwgY291bnQsXG4gIGluZGljZXMsIHZlcnRpY2VzLCBpbnN0YW5jZWQsIG51bUluc3RhbmNlc30pIHtcbiAgY29uc3QgbnVtSW5kaWNlcyA9IGluZGljZXMgPyBpbmRpY2VzLnZhbHVlLmxlbmd0aCA6IDA7XG4gIGNvbnN0IG51bVZlcnRpY2VzID0gdmVydGljZXMgPyB2ZXJ0aWNlcy52YWx1ZS5sZW5ndGggLyAzIDogMDtcbiAgY291bnQgPSBjb3VudCB8fCBudW1JbmRpY2VzIHx8IG51bVZlcnRpY2VzO1xuICByZXR1cm4gZHJhdyh7Z2wsIGRyYXdNb2RlLCBlbGVtZW50VHlwZSwgY291bnQsIH0pO1xufVxuXG4vLyBDYWxsIHRoZSBwcm9wZXIgZHJhdyBmdW5jdGlvbiBmb3IgdGhlIHVzZWQgcHJvZ3JhbSBiYXNlZCBvbiBhdHRyaWJ1dGVzIGV0Y1xuZXhwb3J0IGZ1bmN0aW9uIGRyYXczKHtnbCwgZHJhd01vZGUsIGluZGV4VHlwZSwgbnVtUG9pbnRzLCBudW1JbnN0YW5jZXN9KSB7XG4gIGRyYXdNb2RlID0gZHJhd01vZGUgfHwgZ2wuUE9JTlRTO1xuXG4gIGFzc2VydChHTF9EUkFXX01PREVTKGdsKS5pbmRleE9mKGluZGV4VHlwZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICBpZiAobnVtSW5zdGFuY2VzKSB7XG4gICAgLy8gdGhpcyBpbnN0YW5jZWQgcHJpbWl0aXZlIGRvZXMgaGFzIGluZGljZXMsIHVzZSBkcmF3RWxlbWVudHMgZXh0ZW5zaW9uXG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgZXh0ZW5zaW9uLmRyYXdFbGVtZW50c0luc3RhbmNlZEFOR0xFKFxuICAgICAgZHJhd01vZGUsIG51bVBvaW50cywgaW5kZXhUeXBlLCAwLCBudW1JbnN0YW5jZXNcbiAgICApO1xuICB9IGVsc2UgaWYgKGluZGljZXMpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIG51bUluZGljZXMsIGluZGV4VHlwZSwgMCk7XG4gIH0gZWxzZSBpZiAobnVtSW5zdGFuY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyB0aGlzIGluc3RhbmNlZCBwcmltaXRpdmUgZG9lcyBub3QgaGF2ZSBpbmRpY2VzLCB1c2UgZHJhd0FycmF5cyBleHRcbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICBleHRlbnNpb24uZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKFxuICAgICAgZHJhd01vZGUsIDAsIG51bVBvaW50cywgbnVtSW5zdGFuY2VzXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBlbHNlIGlmIHRoaXMucHJpbWl0aXZlIGRvZXMgbm90IGhhdmUgaW5kaWNlc1xuICAgIGdsLmRyYXdBcnJheXMoZHJhd01vZGUsIDAsIG51bVBvaW50cyk7XG4gIH1cbn1cbiIsIlxuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vdGV4dHVyZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZyYW1lYnVmZmVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGggPyBvcHRzLndpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0ID8gb3B0cy5oZWlnaHQgOiAxO1xuICAgIHRoaXMuZGVwdGggPSBvcHRzLmRlcHRoID09PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0cy5kZXB0aDtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG9wdHMubWluRmlsdGVyIHx8IGdsLk5FQVJFU1Q7XG4gICAgdGhpcy5tYWdGaWx0ZXIgPSBvcHRzLm1hZ0ZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQgfHwgZ2wuUkdCQTtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGUgfHwgZ2wuVU5TSUdORURfQllURTtcbiAgICB0aGlzLmZibyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgdGhpcy5iaW5kKCk7XG5cbiAgICB0aGlzLnRleHR1cmUgPSBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBtaW5GaWx0ZXI6IHRoaXMubWluRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiB0aGlzLm1hZ0ZpbHRlcixcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXRcbiAgICB9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlLnRleHR1cmUsIDBcbiAgICApO1xuXG4gICAgaWYgKHRoaXMuZGVwdGgpIHtcbiAgICAgIHRoaXMuZGVwdGggPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoXG4gICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0XG4gICAgICApO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoXG4gICAgICAgIGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIHRoaXMuZGVwdGhcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuICAgIGlmIChzdGF0dXMgIT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZyYW1lYnVmZmVyIGNyZWF0aW9uIGZhaWxlZC4nKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZibyk7XG4gIH1cblxufVxuIiwiLy8gQ29udGFpbnMgY2xhc3MgYW5kIGZ1bmN0aW9uIHdyYXBwZXJzIGFyb3VuZCBsb3cgbGV2ZWwgd2ViZ2wgb2JqZWN0c1xuLy8gVGhlc2UgY2xhc3NlcyBhcmUgaW50ZW5kZWQgdG8gc3RheSBjbG9zZSB0byB0aGUgV2ViR0wgQVBJIHNlbWFudGljc1xuLy8gYnV0IG1ha2UgaXQgZWFzaWVyIHRvIHVzZS5cbi8vIEhpZ2hlciBsZXZlbCBhYnN0cmFjdGlvbnMgY2FuIGJlIGJ1aWx0IG9uIHRoZXNlIGNsYXNzZXNcbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9jb250ZXh0JztcbmV4cG9ydCAqIGZyb20gJy4vZHJhdyc7XG5leHBvcnQge2RlZmF1bHQgYXMgQnVmZmVyfSBmcm9tICcuL2J1ZmZlcic7XG5leHBvcnQge2RlZmF1bHQgYXMgUHJvZ3JhbX0gZnJvbSAnLi9wcm9ncmFtJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBGcmFtZWJ1ZmZlcn0gZnJvbSAnLi9mYm8nO1xuZXhwb3J0IHtUZXh0dXJlMkQsIFRleHR1cmVDdWJlfSBmcm9tICcuL3RleHR1cmUnO1xuIiwiLy8gQ3JlYXRlcyBwcm9ncmFtcyBvdXQgb2Ygc2hhZGVycyBhbmQgcHJvdmlkZXMgY29udmVuaWVudCBtZXRob2RzIGZvciBsb2FkaW5nXG4vLyBidWZmZXJzIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGNvbnNvbGUgKi9cbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7VmVydGV4U2hhZGVyLCBGcmFnbWVudFNoYWRlcn0gZnJvbSAnLi9zaGFkZXInO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyYW0ge1xuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogSGFuZGxlcyBjcmVhdGlvbiBvZiBwcm9ncmFtcywgbWFwcGluZyBvZiBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gZ2wgY29udGV4dFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudnMgLSBWZXJ0ZXggc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5mcyAtIEZyYWdtZW50IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuaWQ9IC0gSWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzLCBmcywgaWQpIHtcbiAgICBhc3NlcnQoZ2wsICdQcm9ncmFtIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuXG4gICAgbGV0IHZzO1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUud2FybignREVQUkVDQVRFRDogTmV3IHVzZTogUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KScpO1xuICAgICAgdnMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cyA9IG9wdHMudnM7XG4gICAgICBmcyA9IG9wdHMuZnM7XG4gICAgICBpZCA9IG9wdHMuaWQ7XG4gICAgfVxuXG4gICAgdnMgPSB2cyB8fCBTaGFkZXJzLlZlcnRleC5EZWZhdWx0O1xuICAgIGZzID0gZnMgfHwgU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBWZXJ0ZXhTaGFkZXIoZ2wsIHZzKS5oYW5kbGUpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgRnJhZ21lbnRTaGFkZXIoZ2wsIGZzKS5oYW5kbGUpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGNvbnN0IGxpbmtlZCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgIGlmICghbGlua2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGxpbmtpbmcgJHtnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gcHJlcGFyZSB1bmlmb3JtIHNldHRlcnNcbiAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzID0gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIG5vIGF0dHJpYnV0ZXMgZW5hYmxlZCB5ZXRcbiAgICB0aGlzLmF0dHJpYnV0ZUVuYWJsZWQgPSB7fTtcbiAgfVxuXG4gIHVzZSgpIHtcbiAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmUodGV4dHVyZSwgaW5kZXgpIHtcbiAgICB0ZXh0dXJlLmJpbmQoaW5kZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybShuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXModW5pZm9ybU1hcCkpIHtcbiAgICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh1bmlmb3JtTWFwW25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1tidWZmZXIuYXR0cmlidXRlXTtcbiAgICBidWZmZXIuYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlci5hdHRyaWJ1dGVdO1xuICAgIGJ1ZmZlci5kZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy51bnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbi8vIFRPRE8gLSB1c2UgdGFibGVzIHRvIHJlZHVjZSBjb21wbGV4aXR5IG9mIG1ldGhvZCBiZWxvd1xuLy8gY29uc3QgZ2xVbmlmb3JtU2V0dGVyID0ge1xuLy8gICBGTE9BVDoge2Z1bmN0aW9uOiAndW5pZm9ybTFmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX1ZFQzM6IHtmdW5jdGlvbjogJ3VuaWZvcm0zZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBGTE9BVF9NQVQ0OiB7ZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4NGZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgSU5UOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBCT09MOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSXzJEOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSX0NVQkU6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX1cbi8vIH07XG5cbi8vIFJldHVybnMgYSBNYWdpYyBVbmlmb3JtIFNldHRlclxuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcihnbCwgZ2xQcm9ncmFtLCBpbmZvLCBpc0FycmF5KSB7XG4gIGNvbnN0IHtuYW1lLCB0eXBlfSA9IGluZm87XG4gIGNvbnN0IGxvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihnbFByb2dyYW0sIG5hbWUpO1xuXG4gIGxldCBtYXRyaXggPSBmYWxzZTtcbiAgbGV0IHZlY3RvciA9IHRydWU7XG4gIGxldCBnbEZ1bmN0aW9uO1xuICBsZXQgVHlwZWRBcnJheTtcblxuICBpZiAoaW5mby5zaXplID4gMSAmJiBpc0FycmF5KSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG5cbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuSU5UOlxuICAgIGNhc2UgZ2wuQk9PTDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfMkQ6XG4gICAgY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBVaW50MTZBcnJheTtcbiAgICAgIHZlY3RvciA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmlmb3JtOiBVbmtub3duIEdMU0wgdHlwZSAnICsgdHlwZSk7XG5cbiAgICB9XG4gIH1cblxuICBpZiAodmVjdG9yKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBnbC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVDogY2FzZSBnbC5CT09MOiBjYXNlIGdsLlNBTVBMRVJfMkQ6IGNhc2UgZ2wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzI6IGNhc2UgZ2wuQk9PTF9WRUMyOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0yaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMzogY2FzZSBnbC5CT09MX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUM0OiBjYXNlIGdsLkJPT0xfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGl2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMjpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDJmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMzpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDNmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBnbEZ1bmN0aW9uID0gZ2xGdW5jdGlvbi5iaW5kKGdsKTtcblxuICAvLyBTZXQgYSB1bmlmb3JtIGFycmF5XG4gIGlmIChpc0FycmF5ICYmIFR5cGVkQXJyYXkpIHtcblxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIG5ldyBUeXBlZEFycmF5KHZhbCkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9O1xuICB9IGVsc2UgaWYgKG1hdHJpeCkge1xuICAgIC8vIFNldCBhIG1hdHJpeCB1bmlmb3JtXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgZmFsc2UsIHZhbC50b0Zsb2F0MzJBcnJheSgpKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfTtcblxuICB9IGVsc2UgaWYgKFR5cGVkQXJyYXkpIHtcblxuICAgIC8vIFNldCBhIHZlY3Rvci90eXBlZCBhcnJheSB1bmlmb3JtXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBUeXBlZEFycmF5LnNldCh2YWwudG9GbG9hdDMyQXJyYXkgPyB2YWwudG9GbG9hdDMyQXJyYXkoKSA6IHZhbCk7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgVHlwZWRBcnJheSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH07XG5cbiAgfVxuICAvLyBTZXQgYSBwcmltaXRpdmUtdmFsdWVkIHVuaWZvcm1cbiAgcmV0dXJuIHZhbCA9PiB7XG4gICAgZ2xGdW5jdGlvbihsb2MsIHZhbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgfTtcblxufVxuXG4vLyBjcmVhdGUgdW5pZm9ybSBzZXR0ZXJzXG4vLyBNYXAgb2YgdW5pZm9ybSBuYW1lcyB0byBzZXR0ZXIgZnVuY3Rpb25zXG5mdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVycyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IHVuaWZvcm1TZXR0ZXJzID0ge307XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZVVuaWZvcm0oZ2xQcm9ncmFtLCBpKTtcbiAgICBsZXQgbmFtZSA9IGluZm8ubmFtZTtcbiAgICAvLyBpZiBhcnJheSBuYW1lIHRoZW4gY2xlYW4gdGhlIGFycmF5IGJyYWNrZXRzXG4gICAgbmFtZSA9IG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nID9cbiAgICAgIG5hbWUuc3Vic3RyKDAsIG5hbWUubGVuZ3RoIC0gMykgOiBuYW1lO1xuICAgIHVuaWZvcm1TZXR0ZXJzW25hbWVdID1cbiAgICAgIGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGdsUHJvZ3JhbSwgaW5mbywgaW5mby5uYW1lICE9PSBuYW1lKTtcbiAgfVxuICByZXR1cm4gdW5pZm9ybVNldHRlcnM7XG59XG5cbi8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChtYXBzIGF0dHJpYnV0ZSBuYW1lIHRvIGluZGV4KVxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlTG9jYXRpb25zKGdsLCBnbFByb2dyYW0pIHtcbiAgY29uc3QgbGVuZ3RoID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihnbFByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKTtcbiAgY29uc3QgYXR0cmlidXRlTG9jYXRpb25zID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbmZvID0gZ2wuZ2V0QWN0aXZlQXR0cmliKGdsUHJvZ3JhbSwgaSk7XG4gICAgY29uc3QgaW5kZXggPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihnbFByb2dyYW0sIGluZm8ubmFtZSk7XG4gICAgYXR0cmlidXRlTG9jYXRpb25zW2luZm8ubmFtZV0gPSBpbmRleDtcbiAgfVxuICByZXR1cm4gYXR0cmlidXRlTG9jYXRpb25zO1xufVxuIiwiaW1wb3J0IGZvcm1hdENvbXBpbGVyRXJyb3IgZnJvbSAnZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yJztcblxuLy8gRm9yIG5vdyB0aGlzIGlzIGFuIGludGVybmFsIGNsYXNzXG5leHBvcnQgY2xhc3MgU2hhZGVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuICAgIGlmICh0aGlzLmhhbmRsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBjcmVhdGluZyBzaGFkZXIgd2l0aCB0eXBlICR7c2hhZGVyVHlwZX1gKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKHRoaXMuaGFuZGxlLCBzaGFkZXJTb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgIHZhciBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcih0aGlzLmhhbmRsZSwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgIHZhciBpbmZvID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyh0aGlzLmhhbmRsZSk7XG4gICAgICBnbC5kZWxldGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB2YXIgZm9ybWF0dGVkTG9nO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9ybWF0dGVkTG9nID0gZm9ybWF0Q29tcGlsZXJFcnJvcihpbmZvLCBzaGFkZXJTb3VyY2UsIHNoYWRlclR5cGUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLndhcm4oJ0Vycm9yIGZvcm1hdHRpbmcgZ2xzbCBjb21waWxlciBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgc2hhZGVyICR7aW5mb31gKTtcbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0dGVkTG9nLmxvbmcpO1xuICAgIH1cbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBWZXJ0ZXhTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNoYWRlclNvdXJjZSwgZ2wuVkVSVEVYX1NIQURFUik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZyYWdtZW50U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIH1cbn1cbiIsImltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuXG5jbGFzcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMudGFyZ2V0ID0gZ2wuVEVYVFVSRV8yRDtcblxuICAgIG9wdHMgPSBtZXJnZSh7XG4gICAgICBmbGlwWTogdHJ1ZSxcbiAgICAgIGFsaWdubWVudDogMSxcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIG1pbkZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIHdyYXBTOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgd3JhcFQ6IGdsLkNMQU1QX1RPX0VER0UsXG4gICAgICBmb3JtYXQ6IGdsLlJHQkEsXG4gICAgICB0eXBlOiBnbC5VTlNJR05FRF9CWVRFLFxuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlXG4gICAgfSwgb3B0cyk7XG5cbiAgICB0aGlzLmZsaXBZID0gb3B0cy5mbGlwWTtcbiAgICB0aGlzLmFsaWdubWVudCA9IG9wdHMuYWxpZ25tZW50O1xuICAgIHRoaXMubWFnRmlsdGVyID0gb3B0cy5tYWdGaWx0ZXI7XG4gICAgdGhpcy5taW5GaWx0ZXIgPSBvcHRzLm1pbkZpbHRlcjtcbiAgICB0aGlzLndyYXBTID0gb3B0cy53cmFwUztcbiAgICB0aGlzLndyYXBUID0gb3B0cy53cmFwVDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0O1xuICAgIHRoaXMudHlwZSA9IG9wdHMudHlwZTtcbiAgICB0aGlzLmdlbmVyYXRlTWlwbWFwID0gb3B0cy5nZW5lcmF0ZU1pcG1hcDtcblxuICAgIGlmICh0aGlzLnR5cGUgPT09IGdsLkZMT0FUKSB7XG4gICAgICB0aGlzLmZsb2F0RXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9mbG9hdCcpO1xuICAgICAgaWYgKCF0aGlzLmZsb2F0RXh0ZW5zaW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT0VTX3RleHR1cmVfZmxvYXQgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgaWYgKCF0aGlzLnRleHR1cmUpIHtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuXG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlKTtcbiAgICB0aGlzLnRleHR1cmUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlMkQgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSAwO1xuICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICB0aGlzLmJvcmRlciA9IDA7XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgYmluZChpbmRleCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKSAtIGdsLlRFWFRVUkUwO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHVwZGF0ZShvcHRzKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQ7XG4gICAgdGhpcy5ib3JkZXIgPSBvcHRzLmJvcmRlciB8fCAwO1xuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YTtcbiAgICBpZiAodGhpcy5mbGlwWSkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsXG4gICAgICAgIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSxcbiAgICAgICAgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLm1pbkZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5tYWdGaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgdGhpcy53cmFwUyk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLndyYXBUKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmICh0aGlzLmdlbmVyYXRlTWlwbWFwKSB7XG4gICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZUN1YmUgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbWF4LWxlbiAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3Mueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cbiIsIi8vIEhlbHBlciBkZWZpbml0aW9ucyBmb3IgdmFsaWRhdGlvbiBvZiB3ZWJnbCBwYXJhbWV0ZXJzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1pbmxpbmUtY29tbWVudHMsIG1heC1sZW4gKi9cblxuLy8gVE9ETyAtIHJlbW92ZVxuZXhwb3J0IHtpc1R5cGVkQXJyYXksIG1ha2VUeXBlZEFycmF5fSBmcm9tICcuLi91dGlscyc7XG5cbi8vIElOREVYIFRZUEVTXG5cbi8vIEZvciBkcmF3RWxlbWVudHMsIHNpemUgb2YgaW5kaWNlc1xuZXhwb3J0IGNvbnN0IElOREVYX1RZUEVTID0gWydVTlNJR05FRF9CWVRFJywgJ1VOU0lHTkVEX1NIT1JUJ107XG5leHBvcnQgY29uc3QgR0xfSU5ERVhfVFlQRVMgPSBnbCA9PiBJTkRFWF9UWVBFUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhUeXBlKHR5cGUpIHtcbiAgcmV0dXJuIElOREVYX1RZUEVTLmluZGV4T2YodHlwZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xJbmRleFR5cGUoZ2xUeXBlKSB7XG4gIHJldHVybiBHTF9JTkRFWF9UWVBFUy5pbmRleE9mKGdsVHlwZSkgIT09IC0xO1xufVxuXG4vLyBEUkFXIE1PREVTXG5cbmV4cG9ydCBjb25zdCBEUkFXX01PREVTID0gW1xuICAnUE9JTlRTJywgJ0xJTkVfU1RSSVAnLCAnTElORV9MT09QJywgJ0xJTkVTJyxcbiAgJ1RSSUFOR0xFX1NUUklQJywgJ1RSSUFOR0xFX0ZBTicsICdUUklBTkdMRVMnXG5dO1xuZXhwb3J0IGNvbnN0IEdMX0RSQVdfTU9ERVMgPSBnbCA9PiBEUkFXX01PREVTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNEcmF3TW9kZShtb2RlKSB7XG4gIHJldHVybiBEUkFXX01PREVTLmluZGV4T2YobW9kZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xEcmF3TW9kZShnbE1vZGUpIHtcbiAgcmV0dXJuIEdMX0RSQVdfTU9ERVMuaW5kZXhPZihnbE1vZGUpICE9PSAtMTtcbn1cblxuLy8gVEFSR0VUIFRZUEVTXG5cbmV4cG9ydCBjb25zdCBUQVJHRVRTID0gW1xuICAnQVJSQVlfQlVGRkVSJywgLy8gdmVydGV4IGF0dHJpYnV0ZXMgKGUuZy4gdmVydGV4L3RleHR1cmUgY29vcmRzIG9yIGNvbG9yKVxuICAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLCAvLyBCdWZmZXIgdXNlZCBmb3IgZWxlbWVudCBpbmRpY2VzLlxuICAvLyBGb3IgV2ViR0wgMiBjb250ZXh0c1xuICAnQ09QWV9SRUFEX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgY29weWluZyBmcm9tIG9uZSBidWZmZXIgb2JqZWN0IHRvIGFub3RoZXJcbiAgJ0NPUFlfV1JJVEVfQlVGRkVSJywgLy8gQnVmZmVyIGZvciBjb3B5aW5nIGZyb20gb25lIGJ1ZmZlciBvYmplY3QgdG8gYW5vdGhlclxuICAnVFJBTlNGT1JNX0ZFRURCQUNLX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgdHJhbnNmb3JtIGZlZWRiYWNrIG9wZXJhdGlvbnNcbiAgJ1VOSUZPUk1fQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHN0b3JpbmcgdW5pZm9ybSBibG9ja3NcbiAgJ1BJWEVMX1BBQ0tfQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHBpeGVsIHRyYW5zZmVyIG9wZXJhdGlvbnNcbiAgJ1BJWEVMX1VOUEFDS19CVUZGRVInIC8vIEJ1ZmZlciB1c2VkIGZvciBwaXhlbCB0cmFuc2ZlciBvcGVyYXRpb25zXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfVEFSR0VUUyA9XG4gIGdsID0+IFRBUkdFVFMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSkuZmlsdGVyKGNvbnN0YW50ID0+IGNvbnN0YW50KTtcblxuLy8gVVNBR0UgVFlQRVNcblxuZXhwb3J0IGNvbnN0IEJVRkZFUl9VU0FHRSA9IFtcbiAgJ1NUQVRJQ19EUkFXJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ0RZTkFNSUNfRFJBVycsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ1NUUkVBTV9EUkFXJywgLy8gQnVmZmVyIG5vdCB1c2VkIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gIC8vIEZvciBXZWJHTCAyIGNvbnRleHRzXG4gICdTVEFUSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ0RZTkFNSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RSRUFNX1JFQUQnLCAvLyBDb250ZW50cyBvZiB0aGUgYnVmZmVyIGFyZSBsaWtlbHkgdG8gbm90IGJlIHVzZWQgb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RBVElDX0NPUFknLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnRFlOQU1JQ19DT1BZJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnU1RSRUFNX0NPUFknIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgbmVpdGhlciB3cml0dGVuIG9yIHJlYWQgYnkgdGhlIHVzZXIuXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfQlVGRkVSX1VTQUdFID1cbiAgZ2wgPT4gQlVGRkVSX1VTQUdFLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pLmZpbHRlcihjb25zdGFudCA9PiBjb25zdGFudCk7XG4iXX0=
