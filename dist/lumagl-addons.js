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
/* eslint-disable guard-for-in */

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

},{}],27:[function(require,module,exports){
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
exports.GL_BUFFER_USAGE = exports.BUFFER_USAGE = exports.GL_TARGETS = exports.TARGETS = exports.GL_DRAW_MODES = exports.DRAW_MODES = exports.GL_INDEX_TYPES = exports.INDEX_TYPES = exports.WebGLBuffer = exports.WebGLRenderingContext = undefined;
exports.isIndexType = isIndexType;
exports.isGLIndexType = isGLIndexType;
exports.isDrawMode = isDrawMode;
exports.isGLDrawMode = isGLDrawMode;
exports.isTypedArray = isTypedArray;
exports.makeTypedArray = makeTypedArray;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// WEBGL BUILT-IN TYPES
// Convenience: enable app to "import" built-in WebGL types unknown to eslint
/* global WebGLRenderingContext, WebGLBuffer */
exports.WebGLRenderingContext = WebGLRenderingContext;
exports.WebGLBuffer = WebGLBuffer;

// INDEX TYPESxx

// For drawElements, size of indices
// Helper definitions for validation of webgl parameters
/* eslint-disable no-inline-comments, max-len */

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

},{"assert":3}]},{},[22])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWRkLWxpbmUtbnVtYmVycy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hZGQtbGluZS1udW1iZXJzL25vZGVfbW9kdWxlcy9wYWQtbGVmdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2F0b2ItbGl0ZS9hdG9iLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2dsLWNvbnN0YW50cy8xLjAvbnVtYmVycy5qcyIsIm5vZGVfbW9kdWxlcy9nbC1jb25zdGFudHMvbG9va3VwLmpzIiwibm9kZV9tb2R1bGVzL2dsLWZvcm1hdC1jb21waWxlci1lcnJvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXNoYWRlci1uYW1lL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9idWlsdGlucy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvbGl0ZXJhbHMuanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL29wZXJhdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZXBlYXQtc3RyaW5nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NwcmludGYtanMvc3JjL3NwcmludGYuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvYWRkb25zL2Z4LmpzIiwic3JjL2FkZG9ucy9oZWxwZXJzLmpzIiwic3JjL2FkZG9ucy9pbmRleC5qcyIsInNyYy9hZGRvbnMvd29ya2Vycy5qcyIsInNyYy9pby5qcyIsInNyYy9zaGFkZXJzLmpzIiwic3JjL3V0aWxzLmpzIiwic3JjL3dlYmdsL2J1ZmZlci5qcyIsInNyYy93ZWJnbC9jb250ZXh0LmpzIiwic3JjL3dlYmdsL2RyYXcuanMiLCJzcmMvd2ViZ2wvZmJvLmpzIiwic3JjL3dlYmdsL2luZGV4LmpzIiwic3JjL3dlYmdsL3Byb2dyYW0uanMiLCJzcmMvd2ViZ2wvc2hhZGVyLmpzIiwic3JjL3dlYmdsL3RleHR1cmUuanMiLCJzcmMvd2ViZ2wvdHlwZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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USxHQUFSLENBQVk7V0FBWSxHQUFHLFFBQUg7R0FBWixDQUFaLENBQXNDLE1BQXRDLENBQTZDO1dBQVk7R0FBWjtDQUFuRDs7OztBQUlLLElBQU0sc0NBQWUsQ0FDMUIsYUFEMEI7QUFFMUIsY0FGMEI7QUFHMUIsYUFIMEI7O0FBSzFCLGFBTDBCO0FBTTFCLGNBTjBCO0FBTzFCLGFBUDBCO0FBUTFCLGFBUjBCO0FBUzFCLGNBVDBCO0FBVTFCO0FBVjBCLENBQWY7O0FBYU4sSUFBTSw0Q0FDWCxTQURXLGVBQ1g7U0FBTSxhQUFhLEdBQWIsQ0FBaUI7V0FBWSxHQUFHLFFBQUg7R0FBWixDQUFqQixDQUEyQyxNQUEzQyxDQUFrRDtXQUFZO0dBQVo7Q0FBeEQ7Ozs7QUFJSyxTQUFTLFlBQVQsQ0FBc0IsS0FBdEIsRUFBNkI7QUFDbEMsU0FBTyxNQUFNLGlCQUFOLENBRDJCO0NBQTdCOztBQUlBLFNBQVMsY0FBVCxDQUF3QixTQUF4QixFQUFtQyxXQUFuQyxFQUFnRDtBQUNyRCx3QkFBTyxNQUFNLE9BQU4sQ0FBYyxXQUFkLENBQVAsRUFEcUQ7QUFFckQsTUFBTSxRQUFRLElBQUksU0FBSixDQUFjLFlBQVksTUFBWixDQUF0QixDQUYrQztBQUdyRCxPQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxZQUFZLE1BQVosRUFBb0IsRUFBRSxDQUFGLEVBQUs7QUFDM0MsVUFBTSxDQUFOLElBQVcsWUFBWSxDQUFaLENBQVgsQ0FEMkM7R0FBN0M7QUFHQSxTQUFPLEtBQVAsQ0FOcUQ7Q0FBaEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBhZExlZnQgPSByZXF1aXJlKCdwYWQtbGVmdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gYWRkTGluZU51bWJlcnNcbmZ1bmN0aW9uIGFkZExpbmVOdW1iZXJzIChzdHJpbmcsIHN0YXJ0LCBkZWxpbSkge1xuICBzdGFydCA9IHR5cGVvZiBzdGFydCA9PT0gJ251bWJlcicgPyBzdGFydCA6IDFcbiAgZGVsaW0gPSBkZWxpbSB8fCAnOiAnXG5cbiAgdmFyIGxpbmVzID0gc3RyaW5nLnNwbGl0KC9cXHI/XFxuLylcbiAgdmFyIHRvdGFsRGlnaXRzID0gU3RyaW5nKGxpbmVzLmxlbmd0aCArIHN0YXJ0IC0gMSkubGVuZ3RoXG4gIHJldHVybiBsaW5lcy5tYXAoZnVuY3Rpb24gKGxpbmUsIGkpIHtcbiAgICB2YXIgYyA9IGkgKyBzdGFydFxuICAgIHZhciBkaWdpdHMgPSBTdHJpbmcoYykubGVuZ3RoXG4gICAgdmFyIHByZWZpeCA9IHBhZExlZnQoYywgdG90YWxEaWdpdHMgLSBkaWdpdHMpXG4gICAgcmV0dXJuIHByZWZpeCArIGRlbGltICsgbGluZVxuICB9KS5qb2luKCdcXG4nKVxufVxuIiwiLyohXG4gKiBwYWQtbGVmdCA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvcGFkLWxlZnQ+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEpvbiBTY2hsaW5rZXJ0LlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHJlcGVhdCA9IHJlcXVpcmUoJ3JlcGVhdC1zdHJpbmcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYWRMZWZ0KHN0ciwgbnVtLCBjaCkge1xuICBjaCA9IHR5cGVvZiBjaCAhPT0gJ3VuZGVmaW5lZCcgPyAoY2ggKyAnJykgOiAnICc7XG4gIHJldHVybiByZXBlYXQoY2gsIG51bSkgKyBzdHI7XG59OyIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmICFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpLFxuICAgICAgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9hdG9iKHN0cikge1xuICByZXR1cm4gYXRvYihzdHIpXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAwOiAnTk9ORScsXG4gIDE6ICdPTkUnLFxuICAyOiAnTElORV9MT09QJyxcbiAgMzogJ0xJTkVfU1RSSVAnLFxuICA0OiAnVFJJQU5HTEVTJyxcbiAgNTogJ1RSSUFOR0xFX1NUUklQJyxcbiAgNjogJ1RSSUFOR0xFX0ZBTicsXG4gIDI1NjogJ0RFUFRIX0JVRkZFUl9CSVQnLFxuICA1MTI6ICdORVZFUicsXG4gIDUxMzogJ0xFU1MnLFxuICA1MTQ6ICdFUVVBTCcsXG4gIDUxNTogJ0xFUVVBTCcsXG4gIDUxNjogJ0dSRUFURVInLFxuICA1MTc6ICdOT1RFUVVBTCcsXG4gIDUxODogJ0dFUVVBTCcsXG4gIDUxOTogJ0FMV0FZUycsXG4gIDc2ODogJ1NSQ19DT0xPUicsXG4gIDc2OTogJ09ORV9NSU5VU19TUkNfQ09MT1InLFxuICA3NzA6ICdTUkNfQUxQSEEnLFxuICA3NzE6ICdPTkVfTUlOVVNfU1JDX0FMUEhBJyxcbiAgNzcyOiAnRFNUX0FMUEhBJyxcbiAgNzczOiAnT05FX01JTlVTX0RTVF9BTFBIQScsXG4gIDc3NDogJ0RTVF9DT0xPUicsXG4gIDc3NTogJ09ORV9NSU5VU19EU1RfQ09MT1InLFxuICA3NzY6ICdTUkNfQUxQSEFfU0FUVVJBVEUnLFxuICAxMDI0OiAnU1RFTkNJTF9CVUZGRVJfQklUJyxcbiAgMTAyODogJ0ZST05UJyxcbiAgMTAyOTogJ0JBQ0snLFxuICAxMDMyOiAnRlJPTlRfQU5EX0JBQ0snLFxuICAxMjgwOiAnSU5WQUxJRF9FTlVNJyxcbiAgMTI4MTogJ0lOVkFMSURfVkFMVUUnLFxuICAxMjgyOiAnSU5WQUxJRF9PUEVSQVRJT04nLFxuICAxMjg1OiAnT1VUX09GX01FTU9SWScsXG4gIDEyODY6ICdJTlZBTElEX0ZSQU1FQlVGRkVSX09QRVJBVElPTicsXG4gIDIzMDQ6ICdDVycsXG4gIDIzMDU6ICdDQ1cnLFxuICAyODQ5OiAnTElORV9XSURUSCcsXG4gIDI4ODQ6ICdDVUxMX0ZBQ0UnLFxuICAyODg1OiAnQ1VMTF9GQUNFX01PREUnLFxuICAyODg2OiAnRlJPTlRfRkFDRScsXG4gIDI5Mjg6ICdERVBUSF9SQU5HRScsXG4gIDI5Mjk6ICdERVBUSF9URVNUJyxcbiAgMjkzMDogJ0RFUFRIX1dSSVRFTUFTSycsXG4gIDI5MzE6ICdERVBUSF9DTEVBUl9WQUxVRScsXG4gIDI5MzI6ICdERVBUSF9GVU5DJyxcbiAgMjk2MDogJ1NURU5DSUxfVEVTVCcsXG4gIDI5NjE6ICdTVEVOQ0lMX0NMRUFSX1ZBTFVFJyxcbiAgMjk2MjogJ1NURU5DSUxfRlVOQycsXG4gIDI5NjM6ICdTVEVOQ0lMX1ZBTFVFX01BU0snLFxuICAyOTY0OiAnU1RFTkNJTF9GQUlMJyxcbiAgMjk2NTogJ1NURU5DSUxfUEFTU19ERVBUSF9GQUlMJyxcbiAgMjk2NjogJ1NURU5DSUxfUEFTU19ERVBUSF9QQVNTJyxcbiAgMjk2NzogJ1NURU5DSUxfUkVGJyxcbiAgMjk2ODogJ1NURU5DSUxfV1JJVEVNQVNLJyxcbiAgMjk3ODogJ1ZJRVdQT1JUJyxcbiAgMzAyNDogJ0RJVEhFUicsXG4gIDMwNDI6ICdCTEVORCcsXG4gIDMwODg6ICdTQ0lTU09SX0JPWCcsXG4gIDMwODk6ICdTQ0lTU09SX1RFU1QnLFxuICAzMTA2OiAnQ09MT1JfQ0xFQVJfVkFMVUUnLFxuICAzMTA3OiAnQ09MT1JfV1JJVEVNQVNLJyxcbiAgMzMxNzogJ1VOUEFDS19BTElHTk1FTlQnLFxuICAzMzMzOiAnUEFDS19BTElHTk1FTlQnLFxuICAzMzc5OiAnTUFYX1RFWFRVUkVfU0laRScsXG4gIDMzODY6ICdNQVhfVklFV1BPUlRfRElNUycsXG4gIDM0MDg6ICdTVUJQSVhFTF9CSVRTJyxcbiAgMzQxMDogJ1JFRF9CSVRTJyxcbiAgMzQxMTogJ0dSRUVOX0JJVFMnLFxuICAzNDEyOiAnQkxVRV9CSVRTJyxcbiAgMzQxMzogJ0FMUEhBX0JJVFMnLFxuICAzNDE0OiAnREVQVEhfQklUUycsXG4gIDM0MTU6ICdTVEVOQ0lMX0JJVFMnLFxuICAzNTUzOiAnVEVYVFVSRV8yRCcsXG4gIDQzNTI6ICdET05UX0NBUkUnLFxuICA0MzUzOiAnRkFTVEVTVCcsXG4gIDQzNTQ6ICdOSUNFU1QnLFxuICA1MTIwOiAnQllURScsXG4gIDUxMjE6ICdVTlNJR05FRF9CWVRFJyxcbiAgNTEyMjogJ1NIT1JUJyxcbiAgNTEyMzogJ1VOU0lHTkVEX1NIT1JUJyxcbiAgNTEyNDogJ0lOVCcsXG4gIDUxMjU6ICdVTlNJR05FRF9JTlQnLFxuICA1MTI2OiAnRkxPQVQnLFxuICA1Mzg2OiAnSU5WRVJUJyxcbiAgNTg5MDogJ1RFWFRVUkUnLFxuICA2NDAxOiAnU1RFTkNJTF9JTkRFWCcsXG4gIDY0MDI6ICdERVBUSF9DT01QT05FTlQnLFxuICA2NDA2OiAnQUxQSEEnLFxuICA2NDA3OiAnUkdCJyxcbiAgNjQwODogJ1JHQkEnLFxuICA2NDA5OiAnTFVNSU5BTkNFJyxcbiAgNjQxMDogJ0xVTUlOQU5DRV9BTFBIQScsXG4gIDc2ODA6ICdLRUVQJyxcbiAgNzY4MTogJ1JFUExBQ0UnLFxuICA3NjgyOiAnSU5DUicsXG4gIDc2ODM6ICdERUNSJyxcbiAgNzkzNjogJ1ZFTkRPUicsXG4gIDc5Mzc6ICdSRU5ERVJFUicsXG4gIDc5Mzg6ICdWRVJTSU9OJyxcbiAgOTcyODogJ05FQVJFU1QnLFxuICA5NzI5OiAnTElORUFSJyxcbiAgOTk4NDogJ05FQVJFU1RfTUlQTUFQX05FQVJFU1QnLFxuICA5OTg1OiAnTElORUFSX01JUE1BUF9ORUFSRVNUJyxcbiAgOTk4NjogJ05FQVJFU1RfTUlQTUFQX0xJTkVBUicsXG4gIDk5ODc6ICdMSU5FQVJfTUlQTUFQX0xJTkVBUicsXG4gIDEwMjQwOiAnVEVYVFVSRV9NQUdfRklMVEVSJyxcbiAgMTAyNDE6ICdURVhUVVJFX01JTl9GSUxURVInLFxuICAxMDI0MjogJ1RFWFRVUkVfV1JBUF9TJyxcbiAgMTAyNDM6ICdURVhUVVJFX1dSQVBfVCcsXG4gIDEwNDk3OiAnUkVQRUFUJyxcbiAgMTA3NTI6ICdQT0xZR09OX09GRlNFVF9VTklUUycsXG4gIDE2Mzg0OiAnQ09MT1JfQlVGRkVSX0JJVCcsXG4gIDMyNzY5OiAnQ09OU1RBTlRfQ09MT1InLFxuICAzMjc3MDogJ09ORV9NSU5VU19DT05TVEFOVF9DT0xPUicsXG4gIDMyNzcxOiAnQ09OU1RBTlRfQUxQSEEnLFxuICAzMjc3MjogJ09ORV9NSU5VU19DT05TVEFOVF9BTFBIQScsXG4gIDMyNzczOiAnQkxFTkRfQ09MT1InLFxuICAzMjc3NDogJ0ZVTkNfQUREJyxcbiAgMzI3Nzc6ICdCTEVORF9FUVVBVElPTl9SR0InLFxuICAzMjc3ODogJ0ZVTkNfU1VCVFJBQ1QnLFxuICAzMjc3OTogJ0ZVTkNfUkVWRVJTRV9TVUJUUkFDVCcsXG4gIDMyODE5OiAnVU5TSUdORURfU0hPUlRfNF80XzRfNCcsXG4gIDMyODIwOiAnVU5TSUdORURfU0hPUlRfNV81XzVfMScsXG4gIDMyODIzOiAnUE9MWUdPTl9PRkZTRVRfRklMTCcsXG4gIDMyODI0OiAnUE9MWUdPTl9PRkZTRVRfRkFDVE9SJyxcbiAgMzI4NTQ6ICdSR0JBNCcsXG4gIDMyODU1OiAnUkdCNV9BMScsXG4gIDMyODczOiAnVEVYVFVSRV9CSU5ESU5HXzJEJyxcbiAgMzI5MjY6ICdTQU1QTEVfQUxQSEFfVE9fQ09WRVJBR0UnLFxuICAzMjkyODogJ1NBTVBMRV9DT1ZFUkFHRScsXG4gIDMyOTM2OiAnU0FNUExFX0JVRkZFUlMnLFxuICAzMjkzNzogJ1NBTVBMRVMnLFxuICAzMjkzODogJ1NBTVBMRV9DT1ZFUkFHRV9WQUxVRScsXG4gIDMyOTM5OiAnU0FNUExFX0NPVkVSQUdFX0lOVkVSVCcsXG4gIDMyOTY4OiAnQkxFTkRfRFNUX1JHQicsXG4gIDMyOTY5OiAnQkxFTkRfU1JDX1JHQicsXG4gIDMyOTcwOiAnQkxFTkRfRFNUX0FMUEhBJyxcbiAgMzI5NzE6ICdCTEVORF9TUkNfQUxQSEEnLFxuICAzMzA3MTogJ0NMQU1QX1RPX0VER0UnLFxuICAzMzE3MDogJ0dFTkVSQVRFX01JUE1BUF9ISU5UJyxcbiAgMzMxODk6ICdERVBUSF9DT01QT05FTlQxNicsXG4gIDMzMzA2OiAnREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5UJyxcbiAgMzM2MzU6ICdVTlNJR05FRF9TSE9SVF81XzZfNScsXG4gIDMzNjQ4OiAnTUlSUk9SRURfUkVQRUFUJyxcbiAgMzM5MDE6ICdBTElBU0VEX1BPSU5UX1NJWkVfUkFOR0UnLFxuICAzMzkwMjogJ0FMSUFTRURfTElORV9XSURUSF9SQU5HRScsXG4gIDMzOTg0OiAnVEVYVFVSRTAnLFxuICAzMzk4NTogJ1RFWFRVUkUxJyxcbiAgMzM5ODY6ICdURVhUVVJFMicsXG4gIDMzOTg3OiAnVEVYVFVSRTMnLFxuICAzMzk4ODogJ1RFWFRVUkU0JyxcbiAgMzM5ODk6ICdURVhUVVJFNScsXG4gIDMzOTkwOiAnVEVYVFVSRTYnLFxuICAzMzk5MTogJ1RFWFRVUkU3JyxcbiAgMzM5OTI6ICdURVhUVVJFOCcsXG4gIDMzOTkzOiAnVEVYVFVSRTknLFxuICAzMzk5NDogJ1RFWFRVUkUxMCcsXG4gIDMzOTk1OiAnVEVYVFVSRTExJyxcbiAgMzM5OTY6ICdURVhUVVJFMTInLFxuICAzMzk5NzogJ1RFWFRVUkUxMycsXG4gIDMzOTk4OiAnVEVYVFVSRTE0JyxcbiAgMzM5OTk6ICdURVhUVVJFMTUnLFxuICAzNDAwMDogJ1RFWFRVUkUxNicsXG4gIDM0MDAxOiAnVEVYVFVSRTE3JyxcbiAgMzQwMDI6ICdURVhUVVJFMTgnLFxuICAzNDAwMzogJ1RFWFRVUkUxOScsXG4gIDM0MDA0OiAnVEVYVFVSRTIwJyxcbiAgMzQwMDU6ICdURVhUVVJFMjEnLFxuICAzNDAwNjogJ1RFWFRVUkUyMicsXG4gIDM0MDA3OiAnVEVYVFVSRTIzJyxcbiAgMzQwMDg6ICdURVhUVVJFMjQnLFxuICAzNDAwOTogJ1RFWFRVUkUyNScsXG4gIDM0MDEwOiAnVEVYVFVSRTI2JyxcbiAgMzQwMTE6ICdURVhUVVJFMjcnLFxuICAzNDAxMjogJ1RFWFRVUkUyOCcsXG4gIDM0MDEzOiAnVEVYVFVSRTI5JyxcbiAgMzQwMTQ6ICdURVhUVVJFMzAnLFxuICAzNDAxNTogJ1RFWFRVUkUzMScsXG4gIDM0MDE2OiAnQUNUSVZFX1RFWFRVUkUnLFxuICAzNDAyNDogJ01BWF9SRU5ERVJCVUZGRVJfU0laRScsXG4gIDM0MDQxOiAnREVQVEhfU1RFTkNJTCcsXG4gIDM0MDU1OiAnSU5DUl9XUkFQJyxcbiAgMzQwNTY6ICdERUNSX1dSQVAnLFxuICAzNDA2NzogJ1RFWFRVUkVfQ1VCRV9NQVAnLFxuICAzNDA2ODogJ1RFWFRVUkVfQklORElOR19DVUJFX01BUCcsXG4gIDM0MDY5OiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YJyxcbiAgMzQwNzA6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gnLFxuICAzNDA3MTogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWScsXG4gIDM0MDcyOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZJyxcbiAgMzQwNzM6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1onLFxuICAzNDA3NDogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWicsXG4gIDM0MDc2OiAnTUFYX0NVQkVfTUFQX1RFWFRVUkVfU0laRScsXG4gIDM0MzM4OiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9FTkFCTEVEJyxcbiAgMzQzMzk6ICdWRVJURVhfQVRUUklCX0FSUkFZX1NJWkUnLFxuICAzNDM0MDogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfU1RSSURFJyxcbiAgMzQzNDE6ICdWRVJURVhfQVRUUklCX0FSUkFZX1RZUEUnLFxuICAzNDM0MjogJ0NVUlJFTlRfVkVSVEVYX0FUVFJJQicsXG4gIDM0MzczOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9QT0lOVEVSJyxcbiAgMzQ0NjY6ICdOVU1fQ09NUFJFU1NFRF9URVhUVVJFX0ZPUk1BVFMnLFxuICAzNDQ2NzogJ0NPTVBSRVNTRURfVEVYVFVSRV9GT1JNQVRTJyxcbiAgMzQ2NjA6ICdCVUZGRVJfU0laRScsXG4gIDM0NjYxOiAnQlVGRkVSX1VTQUdFJyxcbiAgMzQ4MTY6ICdTVEVOQ0lMX0JBQ0tfRlVOQycsXG4gIDM0ODE3OiAnU1RFTkNJTF9CQUNLX0ZBSUwnLFxuICAzNDgxODogJ1NURU5DSUxfQkFDS19QQVNTX0RFUFRIX0ZBSUwnLFxuICAzNDgxOTogJ1NURU5DSUxfQkFDS19QQVNTX0RFUFRIX1BBU1MnLFxuICAzNDg3NzogJ0JMRU5EX0VRVUFUSU9OX0FMUEhBJyxcbiAgMzQ5MjE6ICdNQVhfVkVSVEVYX0FUVFJJQlMnLFxuICAzNDkyMjogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfTk9STUFMSVpFRCcsXG4gIDM0OTMwOiAnTUFYX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNDk2MjogJ0FSUkFZX0JVRkZFUicsXG4gIDM0OTYzOiAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLFxuICAzNDk2NDogJ0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzQ5NjU6ICdFTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzQ5NzU6ICdWRVJURVhfQVRUUklCX0FSUkFZX0JVRkZFUl9CSU5ESU5HJyxcbiAgMzUwNDA6ICdTVFJFQU1fRFJBVycsXG4gIDM1MDQ0OiAnU1RBVElDX0RSQVcnLFxuICAzNTA0ODogJ0RZTkFNSUNfRFJBVycsXG4gIDM1NjMyOiAnRlJBR01FTlRfU0hBREVSJyxcbiAgMzU2MzM6ICdWRVJURVhfU0hBREVSJyxcbiAgMzU2NjA6ICdNQVhfVkVSVEVYX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNTY2MTogJ01BWF9DT01CSU5FRF9URVhUVVJFX0lNQUdFX1VOSVRTJyxcbiAgMzU2NjM6ICdTSEFERVJfVFlQRScsXG4gIDM1NjY0OiAnRkxPQVRfVkVDMicsXG4gIDM1NjY1OiAnRkxPQVRfVkVDMycsXG4gIDM1NjY2OiAnRkxPQVRfVkVDNCcsXG4gIDM1NjY3OiAnSU5UX1ZFQzInLFxuICAzNTY2ODogJ0lOVF9WRUMzJyxcbiAgMzU2Njk6ICdJTlRfVkVDNCcsXG4gIDM1NjcwOiAnQk9PTCcsXG4gIDM1NjcxOiAnQk9PTF9WRUMyJyxcbiAgMzU2NzI6ICdCT09MX1ZFQzMnLFxuICAzNTY3MzogJ0JPT0xfVkVDNCcsXG4gIDM1Njc0OiAnRkxPQVRfTUFUMicsXG4gIDM1Njc1OiAnRkxPQVRfTUFUMycsXG4gIDM1Njc2OiAnRkxPQVRfTUFUNCcsXG4gIDM1Njc4OiAnU0FNUExFUl8yRCcsXG4gIDM1NjgwOiAnU0FNUExFUl9DVUJFJyxcbiAgMzU3MTI6ICdERUxFVEVfU1RBVFVTJyxcbiAgMzU3MTM6ICdDT01QSUxFX1NUQVRVUycsXG4gIDM1NzE0OiAnTElOS19TVEFUVVMnLFxuICAzNTcxNTogJ1ZBTElEQVRFX1NUQVRVUycsXG4gIDM1NzE2OiAnSU5GT19MT0dfTEVOR1RIJyxcbiAgMzU3MTc6ICdBVFRBQ0hFRF9TSEFERVJTJyxcbiAgMzU3MTg6ICdBQ1RJVkVfVU5JRk9STVMnLFxuICAzNTcxOTogJ0FDVElWRV9VTklGT1JNX01BWF9MRU5HVEgnLFxuICAzNTcyMDogJ1NIQURFUl9TT1VSQ0VfTEVOR1RIJyxcbiAgMzU3MjE6ICdBQ1RJVkVfQVRUUklCVVRFUycsXG4gIDM1NzIyOiAnQUNUSVZFX0FUVFJJQlVURV9NQVhfTEVOR1RIJyxcbiAgMzU3MjQ6ICdTSEFESU5HX0xBTkdVQUdFX1ZFUlNJT04nLFxuICAzNTcyNTogJ0NVUlJFTlRfUFJPR1JBTScsXG4gIDM2MDAzOiAnU1RFTkNJTF9CQUNLX1JFRicsXG4gIDM2MDA0OiAnU1RFTkNJTF9CQUNLX1ZBTFVFX01BU0snLFxuICAzNjAwNTogJ1NURU5DSUxfQkFDS19XUklURU1BU0snLFxuICAzNjAwNjogJ0ZSQU1FQlVGRkVSX0JJTkRJTkcnLFxuICAzNjAwNzogJ1JFTkRFUkJVRkZFUl9CSU5ESU5HJyxcbiAgMzYwNDg6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9UWVBFJyxcbiAgMzYwNDk6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9OQU1FJyxcbiAgMzYwNTA6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEVWRUwnLFxuICAzNjA1MTogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9DVUJFX01BUF9GQUNFJyxcbiAgMzYwNTM6ICdGUkFNRUJVRkZFUl9DT01QTEVURScsXG4gIDM2MDU0OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9BVFRBQ0hNRU5UJyxcbiAgMzYwNTU6ICdGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01JU1NJTkdfQVRUQUNITUVOVCcsXG4gIDM2MDU3OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9ESU1FTlNJT05TJyxcbiAgMzYwNjE6ICdGUkFNRUJVRkZFUl9VTlNVUFBPUlRFRCcsXG4gIDM2MDY0OiAnQ09MT1JfQVRUQUNITUVOVDAnLFxuICAzNjA5NjogJ0RFUFRIX0FUVEFDSE1FTlQnLFxuICAzNjEyODogJ1NURU5DSUxfQVRUQUNITUVOVCcsXG4gIDM2MTYwOiAnRlJBTUVCVUZGRVInLFxuICAzNjE2MTogJ1JFTkRFUkJVRkZFUicsXG4gIDM2MTYyOiAnUkVOREVSQlVGRkVSX1dJRFRIJyxcbiAgMzYxNjM6ICdSRU5ERVJCVUZGRVJfSEVJR0hUJyxcbiAgMzYxNjQ6ICdSRU5ERVJCVUZGRVJfSU5URVJOQUxfRk9STUFUJyxcbiAgMzYxNjg6ICdTVEVOQ0lMX0lOREVYOCcsXG4gIDM2MTc2OiAnUkVOREVSQlVGRkVSX1JFRF9TSVpFJyxcbiAgMzYxNzc6ICdSRU5ERVJCVUZGRVJfR1JFRU5fU0laRScsXG4gIDM2MTc4OiAnUkVOREVSQlVGRkVSX0JMVUVfU0laRScsXG4gIDM2MTc5OiAnUkVOREVSQlVGRkVSX0FMUEhBX1NJWkUnLFxuICAzNjE4MDogJ1JFTkRFUkJVRkZFUl9ERVBUSF9TSVpFJyxcbiAgMzYxODE6ICdSRU5ERVJCVUZGRVJfU1RFTkNJTF9TSVpFJyxcbiAgMzYxOTQ6ICdSR0I1NjUnLFxuICAzNjMzNjogJ0xPV19GTE9BVCcsXG4gIDM2MzM3OiAnTUVESVVNX0ZMT0FUJyxcbiAgMzYzMzg6ICdISUdIX0ZMT0FUJyxcbiAgMzYzMzk6ICdMT1dfSU5UJyxcbiAgMzYzNDA6ICdNRURJVU1fSU5UJyxcbiAgMzYzNDE6ICdISUdIX0lOVCcsXG4gIDM2MzQ2OiAnU0hBREVSX0NPTVBJTEVSJyxcbiAgMzYzNDc6ICdNQVhfVkVSVEVYX1VOSUZPUk1fVkVDVE9SUycsXG4gIDM2MzQ4OiAnTUFYX1ZBUllJTkdfVkVDVE9SUycsXG4gIDM2MzQ5OiAnTUFYX0ZSQUdNRU5UX1VOSUZPUk1fVkVDVE9SUycsXG4gIDM3NDQwOiAnVU5QQUNLX0ZMSVBfWV9XRUJHTCcsXG4gIDM3NDQxOiAnVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMJyxcbiAgMzc0NDI6ICdDT05URVhUX0xPU1RfV0VCR0wnLFxuICAzNzQ0MzogJ1VOUEFDS19DT0xPUlNQQUNFX0NPTlZFUlNJT05fV0VCR0wnLFxuICAzNzQ0NDogJ0JST1dTRVJfREVGQVVMVF9XRUJHTCdcbn1cbiIsInZhciBnbDEwID0gcmVxdWlyZSgnLi8xLjAvbnVtYmVycycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbG9va3VwQ29uc3RhbnQgKG51bWJlcikge1xuICByZXR1cm4gZ2wxMFtudW1iZXJdXG59XG4iLCJcbnZhciBzcHJpbnRmID0gcmVxdWlyZSgnc3ByaW50Zi1qcycpLnNwcmludGY7XG52YXIgZ2xDb25zdGFudHMgPSByZXF1aXJlKCdnbC1jb25zdGFudHMvbG9va3VwJyk7XG52YXIgc2hhZGVyTmFtZSA9IHJlcXVpcmUoJ2dsc2wtc2hhZGVyLW5hbWUnKTtcbnZhciBhZGRMaW5lTnVtYmVycyA9IHJlcXVpcmUoJ2FkZC1saW5lLW51bWJlcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmb3JtYXRDb21waWxlckVycm9yO1xuXG5mdW5jdGlvbiBmb3JtYXRDb21waWxlckVycm9yKGVyckxvZywgc3JjLCB0eXBlKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbmFtZSA9IHNoYWRlck5hbWUoc3JjKSB8fCAnb2YgdW5rbm93biBuYW1lIChzZWUgbnBtIGdsc2wtc2hhZGVyLW5hbWUpJztcblxuICAgIHZhciB0eXBlTmFtZSA9ICd1bmtub3duIHR5cGUnO1xuICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHlwZU5hbWUgPSB0eXBlID09PSBnbENvbnN0YW50cy5GUkFHTUVOVF9TSEFERVIgPyAnZnJhZ21lbnQnIDogJ3ZlcnRleCdcbiAgICB9XG5cbiAgICB2YXIgbG9uZ0Zvcm0gPSBzcHJpbnRmKCdFcnJvciBjb21waWxpbmcgJXMgc2hhZGVyICVzOlxcbicsIHR5cGVOYW1lLCBuYW1lKTtcbiAgICB2YXIgc2hvcnRGb3JtID0gc3ByaW50ZihcIiVzJXNcIiwgbG9uZ0Zvcm0sIGVyckxvZyk7XG5cbiAgICB2YXIgZXJyb3JTdHJpbmdzID0gZXJyTG9nLnNwbGl0KCdcXG4nKTtcbiAgICB2YXIgZXJyb3JzID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVycm9yU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZXJyb3JTdHJpbmcgPSBlcnJvclN0cmluZ3NbaV07XG4gICAgICAgIGlmIChlcnJvclN0cmluZyA9PT0gJycpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgbGluZU5vID0gcGFyc2VJbnQoZXJyb3JTdHJpbmcuc3BsaXQoJzonKVsyXSk7XG4gICAgICAgIGlmIChpc05hTihsaW5lTm8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZignQ291bGQgbm90IHBhcnNlIGVycm9yOiAlcycsIGVycm9yU3RyaW5nKSk7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzW2xpbmVOb10gPSBlcnJvclN0cmluZztcbiAgICB9XG5cbiAgICB2YXIgbGluZXMgPSBhZGRMaW5lTnVtYmVycyhzcmMpLnNwbGl0KCdcXG4nKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFlcnJvcnNbaSszXSAmJiAhZXJyb3JzW2krMl0gJiYgIWVycm9yc1tpKzFdKSBjb250aW51ZTtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcbiAgICAgICAgbG9uZ0Zvcm0gKz0gbGluZSArICdcXG4nO1xuICAgICAgICBpZiAoZXJyb3JzW2krMV0pIHtcbiAgICAgICAgICAgIHZhciBlID0gZXJyb3JzW2krMV07XG4gICAgICAgICAgICBlID0gZS5zdWJzdHIoZS5zcGxpdCgnOicsIDMpLmpvaW4oJzonKS5sZW5ndGggKyAxKS50cmltKCk7XG4gICAgICAgICAgICBsb25nRm9ybSArPSBzcHJpbnRmKCdeXl4gJXNcXG5cXG4nLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvbmc6IGxvbmdGb3JtLnRyaW0oKSxcbiAgICAgICAgc2hvcnQ6IHNob3J0Rm9ybS50cmltKClcbiAgICB9O1xufVxuXG4iLCJ2YXIgdG9rZW5pemUgPSByZXF1aXJlKCdnbHNsLXRva2VuaXplcicpXG52YXIgYXRvYiAgICAgPSByZXF1aXJlKCdhdG9iLWxpdGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldE5hbWVcblxuZnVuY3Rpb24gZ2V0TmFtZShzcmMpIHtcbiAgdmFyIHRva2VucyA9IEFycmF5LmlzQXJyYXkoc3JjKVxuICAgID8gc3JjXG4gICAgOiB0b2tlbml6ZShzcmMpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBpZiAodG9rZW4udHlwZSAhPT0gJ3ByZXByb2Nlc3NvcicpIGNvbnRpbnVlXG4gICAgdmFyIG1hdGNoID0gdG9rZW4uZGF0YS5tYXRjaCgvXFwjZGVmaW5lXFxzK1NIQURFUl9OQU1FKF9CNjQpP1xccysoLispJC8pXG4gICAgaWYgKCFtYXRjaCkgY29udGludWVcbiAgICBpZiAoIW1hdGNoWzJdKSBjb250aW51ZVxuXG4gICAgdmFyIGI2NCAgPSBtYXRjaFsxXVxuICAgIHZhciBuYW1lID0gbWF0Y2hbMl1cblxuICAgIHJldHVybiAoYjY0ID8gYXRvYihuYW1lKSA6IG5hbWUpLnRyaW0oKVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRva2VuaXplXG5cbnZhciBsaXRlcmFscyA9IHJlcXVpcmUoJy4vbGliL2xpdGVyYWxzJylcbiAgLCBvcGVyYXRvcnMgPSByZXF1aXJlKCcuL2xpYi9vcGVyYXRvcnMnKVxuICAsIGJ1aWx0aW5zID0gcmVxdWlyZSgnLi9saWIvYnVpbHRpbnMnKVxuXG52YXIgTk9STUFMID0gOTk5ICAgICAgICAgIC8vIDwtLSBuZXZlciBlbWl0dGVkXG4gICwgVE9LRU4gPSA5OTk5ICAgICAgICAgIC8vIDwtLSBuZXZlciBlbWl0dGVkXG4gICwgQkxPQ0tfQ09NTUVOVCA9IDBcbiAgLCBMSU5FX0NPTU1FTlQgPSAxXG4gICwgUFJFUFJPQ0VTU09SID0gMlxuICAsIE9QRVJBVE9SID0gM1xuICAsIElOVEVHRVIgPSA0XG4gICwgRkxPQVQgPSA1XG4gICwgSURFTlQgPSA2XG4gICwgQlVJTFRJTiA9IDdcbiAgLCBLRVlXT1JEID0gOFxuICAsIFdISVRFU1BBQ0UgPSA5XG4gICwgRU9GID0gMTBcbiAgLCBIRVggPSAxMVxuXG52YXIgbWFwID0gW1xuICAgICdibG9jay1jb21tZW50J1xuICAsICdsaW5lLWNvbW1lbnQnXG4gICwgJ3ByZXByb2Nlc3NvcidcbiAgLCAnb3BlcmF0b3InXG4gICwgJ2ludGVnZXInXG4gICwgJ2Zsb2F0J1xuICAsICdpZGVudCdcbiAgLCAnYnVpbHRpbidcbiAgLCAna2V5d29yZCdcbiAgLCAnd2hpdGVzcGFjZSdcbiAgLCAnZW9mJ1xuICAsICdpbnRlZ2VyJ1xuXVxuXG5mdW5jdGlvbiB0b2tlbml6ZSgpIHtcbiAgdmFyIGkgPSAwXG4gICAgLCB0b3RhbCA9IDBcbiAgICAsIG1vZGUgPSBOT1JNQUxcbiAgICAsIGNcbiAgICAsIGxhc3RcbiAgICAsIGNvbnRlbnQgPSBbXVxuICAgICwgdG9rZW5zID0gW11cbiAgICAsIHRva2VuX2lkeCA9IDBcbiAgICAsIHRva2VuX29mZnMgPSAwXG4gICAgLCBsaW5lID0gMVxuICAgICwgY29sID0gMFxuICAgICwgc3RhcnQgPSAwXG4gICAgLCBpc251bSA9IGZhbHNlXG4gICAgLCBpc29wZXJhdG9yID0gZmFsc2VcbiAgICAsIGlucHV0ID0gJydcbiAgICAsIGxlblxuXG4gIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgdG9rZW5zID0gW11cbiAgICBpZiAoZGF0YSAhPT0gbnVsbCkgcmV0dXJuIHdyaXRlKGRhdGEpXG4gICAgcmV0dXJuIGVuZCgpXG4gIH1cblxuICBmdW5jdGlvbiB0b2tlbihkYXRhKSB7XG4gICAgaWYgKGRhdGEubGVuZ3RoKSB7XG4gICAgICB0b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6IG1hcFttb2RlXVxuICAgICAgLCBkYXRhOiBkYXRhXG4gICAgICAsIHBvc2l0aW9uOiBzdGFydFxuICAgICAgLCBsaW5lOiBsaW5lXG4gICAgICAsIGNvbHVtbjogY29sXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlKGNodW5rKSB7XG4gICAgaSA9IDBcbiAgICBpbnB1dCArPSBjaHVua1xuICAgIGxlbiA9IGlucHV0Lmxlbmd0aFxuXG4gICAgdmFyIGxhc3RcblxuICAgIHdoaWxlKGMgPSBpbnB1dFtpXSwgaSA8IGxlbikge1xuICAgICAgbGFzdCA9IGlcblxuICAgICAgc3dpdGNoKG1vZGUpIHtcbiAgICAgICAgY2FzZSBCTE9DS19DT01NRU5UOiBpID0gYmxvY2tfY29tbWVudCgpOyBicmVha1xuICAgICAgICBjYXNlIExJTkVfQ09NTUVOVDogaSA9IGxpbmVfY29tbWVudCgpOyBicmVha1xuICAgICAgICBjYXNlIFBSRVBST0NFU1NPUjogaSA9IHByZXByb2Nlc3NvcigpOyBicmVha1xuICAgICAgICBjYXNlIE9QRVJBVE9SOiBpID0gb3BlcmF0b3IoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBJTlRFR0VSOiBpID0gaW50ZWdlcigpOyBicmVha1xuICAgICAgICBjYXNlIEhFWDogaSA9IGhleCgpOyBicmVha1xuICAgICAgICBjYXNlIEZMT0FUOiBpID0gZGVjaW1hbCgpOyBicmVha1xuICAgICAgICBjYXNlIFRPS0VOOiBpID0gcmVhZHRva2VuKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgV0hJVEVTUEFDRTogaSA9IHdoaXRlc3BhY2UoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBOT1JNQUw6IGkgPSBub3JtYWwoKTsgYnJlYWtcbiAgICAgIH1cblxuICAgICAgaWYobGFzdCAhPT0gaSkge1xuICAgICAgICBzd2l0Y2goaW5wdXRbbGFzdF0pIHtcbiAgICAgICAgICBjYXNlICdcXG4nOiBjb2wgPSAwOyArK2xpbmU7IGJyZWFrXG4gICAgICAgICAgZGVmYXVsdDogKytjb2w7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b3RhbCArPSBpXG4gICAgaW5wdXQgPSBpbnB1dC5zbGljZShpKVxuICAgIHJldHVybiB0b2tlbnNcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZChjaHVuaykge1xuICAgIGlmKGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgIH1cblxuICAgIG1vZGUgPSBFT0ZcbiAgICB0b2tlbignKGVvZiknKVxuICAgIHJldHVybiB0b2tlbnNcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbCgpIHtcbiAgICBjb250ZW50ID0gY29udGVudC5sZW5ndGggPyBbXSA6IGNvbnRlbnRcblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnKicpIHtcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpIC0gMVxuICAgICAgbW9kZSA9IEJMT0NLX0NPTU1FTlRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJy8nKSB7XG4gICAgICBzdGFydCA9IHRvdGFsICsgaSAtIDFcbiAgICAgIG1vZGUgPSBMSU5FX0NPTU1FTlRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihjID09PSAnIycpIHtcbiAgICAgIG1vZGUgPSBQUkVQUk9DRVNTT1JcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKC9cXHMvLnRlc3QoYykpIHtcbiAgICAgIG1vZGUgPSBXSElURVNQQUNFXG4gICAgICBzdGFydCA9IHRvdGFsICsgaVxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpc251bSA9IC9cXGQvLnRlc3QoYylcbiAgICBpc29wZXJhdG9yID0gL1teXFx3X10vLnRlc3QoYylcblxuICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgbW9kZSA9IGlzbnVtID8gSU5URUdFUiA6IGlzb3BlcmF0b3IgPyBPUEVSQVRPUiA6IFRPS0VOXG4gICAgcmV0dXJuIGlcbiAgfVxuXG4gIGZ1bmN0aW9uIHdoaXRlc3BhY2UoKSB7XG4gICAgaWYoL1teXFxzXS9nLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gcHJlcHJvY2Vzc29yKCkge1xuICAgIGlmKGMgPT09ICdcXG4nICYmIGxhc3QgIT09ICdcXFxcJykge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBsaW5lX2NvbW1lbnQoKSB7XG4gICAgcmV0dXJuIHByZXByb2Nlc3NvcigpXG4gIH1cblxuICBmdW5jdGlvbiBibG9ja19jb21tZW50KCkge1xuICAgIGlmKGMgPT09ICcvJyAmJiBsYXN0ID09PSAnKicpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBvcGVyYXRvcigpIHtcbiAgICBpZihsYXN0ID09PSAnLicgJiYgL1xcZC8udGVzdChjKSkge1xuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnKicpIHtcbiAgICAgIG1vZGUgPSBCTE9DS19DT01NRU5UXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnLycpIHtcbiAgICAgIG1vZGUgPSBMSU5FX0NPTU1FTlRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJy4nICYmIGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuXG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJzsnIHx8IGMgPT09ICcpJyB8fCBjID09PSAnKCcpIHtcbiAgICAgIGlmKGNvbnRlbnQubGVuZ3RoKSB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuICAgICAgdG9rZW4oYylcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIHZhciBpc19jb21wb3NpdGVfb3BlcmF0b3IgPSBjb250ZW50Lmxlbmd0aCA9PT0gMiAmJiBjICE9PSAnPSdcbiAgICBpZigvW1xcd19cXGRcXHNdLy50ZXN0KGMpIHx8IGlzX2NvbXBvc2l0ZV9vcGVyYXRvcikge1xuICAgICAgd2hpbGUoZGV0ZXJtaW5lX29wZXJhdG9yKGNvbnRlbnQpKTtcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGRldGVybWluZV9vcGVyYXRvcihidWYpIHtcbiAgICB2YXIgaiA9IDBcbiAgICAgICwgaWR4XG4gICAgICAsIHJlc1xuXG4gICAgZG8ge1xuICAgICAgaWR4ID0gb3BlcmF0b3JzLmluZGV4T2YoYnVmLnNsaWNlKDAsIGJ1Zi5sZW5ndGggKyBqKS5qb2luKCcnKSlcbiAgICAgIHJlcyA9IG9wZXJhdG9yc1tpZHhdXG5cbiAgICAgIGlmKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgaWYoai0tICsgYnVmLmxlbmd0aCA+IDApIGNvbnRpbnVlXG4gICAgICAgIHJlcyA9IGJ1Zi5zbGljZSgwLCAxKS5qb2luKCcnKVxuICAgICAgfVxuXG4gICAgICB0b2tlbihyZXMpXG5cbiAgICAgIHN0YXJ0ICs9IHJlcy5sZW5ndGhcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKHJlcy5sZW5ndGgpXG4gICAgICByZXR1cm4gY29udGVudC5sZW5ndGhcbiAgICB9IHdoaWxlKDEpXG4gIH1cblxuICBmdW5jdGlvbiBoZXgoKSB7XG4gICAgaWYoL1teYS1mQS1GMC05XS8udGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGludGVnZXIoKSB7XG4gICAgaWYoYyA9PT0gJy4nKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bZUVdLy50ZXN0KGMpKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKGMgPT09ICd4JyAmJiBjb250ZW50Lmxlbmd0aCA9PT0gMSAmJiBjb250ZW50WzBdID09PSAnMCcpIHtcbiAgICAgIG1vZGUgPSBIRVhcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bXlxcZF0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBkZWNpbWFsKCkge1xuICAgIGlmKGMgPT09ICdmJykge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgaSArPSAxXG4gICAgfVxuXG4gICAgaWYoL1tlRV0vLnRlc3QoYykpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bXlxcZF0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZHRva2VuKCkge1xuICAgIGlmKC9bXlxcZFxcd19dLy50ZXN0KGMpKSB7XG4gICAgICB2YXIgY29udGVudHN0ciA9IGNvbnRlbnQuam9pbignJylcbiAgICAgIGlmKGxpdGVyYWxzLmluZGV4T2YoY29udGVudHN0cikgPiAtMSkge1xuICAgICAgICBtb2RlID0gS0VZV09SRFxuICAgICAgfSBlbHNlIGlmKGJ1aWx0aW5zLmluZGV4T2YoY29udGVudHN0cikgPiAtMSkge1xuICAgICAgICBtb2RlID0gQlVJTFRJTlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kZSA9IElERU5UXG4gICAgICB9XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICAgJ2dsX1Bvc2l0aW9uJ1xuICAsICdnbF9Qb2ludFNpemUnXG4gICwgJ2dsX0NsaXBWZXJ0ZXgnXG4gICwgJ2dsX0ZyYWdDb29yZCdcbiAgLCAnZ2xfRnJvbnRGYWNpbmcnXG4gICwgJ2dsX0ZyYWdDb2xvcidcbiAgLCAnZ2xfRnJhZ0RhdGEnXG4gICwgJ2dsX0ZyYWdEZXB0aCdcbiAgLCAnZ2xfQ29sb3InXG4gICwgJ2dsX1NlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9Ob3JtYWwnXG4gICwgJ2dsX1ZlcnRleCdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDAnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQxJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMidcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDMnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ0J1xuICAsICdnbF9NdWx0aVRleENvb3JkNSdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDYnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ3J1xuICAsICdnbF9Gb2dDb29yZCdcbiAgLCAnZ2xfTWF4TGlnaHRzJ1xuICAsICdnbF9NYXhDbGlwUGxhbmVzJ1xuICAsICdnbF9NYXhUZXh0dXJlVW5pdHMnXG4gICwgJ2dsX01heFRleHR1cmVDb29yZHMnXG4gICwgJ2dsX01heFZlcnRleEF0dHJpYnMnXG4gICwgJ2dsX01heFZlcnRleFVuaWZvcm1Db21wb25lbnRzJ1xuICAsICdnbF9NYXhWYXJ5aW5nRmxvYXRzJ1xuICAsICdnbF9NYXhWZXJ0ZXhUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4Q29tYmluZWRUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4VGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heEZyYWdtZW50VW5pZm9ybUNvbXBvbmVudHMnXG4gICwgJ2dsX01heERyYXdCdWZmZXJzJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXgnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXgnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXgnXG4gICwgJ2dsX05vcm1hbE1hdHJpeCdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeEludmVyc2UnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Ob3JtYWxTY2FsZSdcbiAgLCAnZ2xfRGVwdGhSYW5nZVBhcmFtZXRlcnMnXG4gICwgJ2dsX0RlcHRoUmFuZ2UnXG4gICwgJ2dsX0NsaXBQbGFuZSdcbiAgLCAnZ2xfUG9pbnRQYXJhbWV0ZXJzJ1xuICAsICdnbF9Qb2ludCdcbiAgLCAnZ2xfTWF0ZXJpYWxQYXJhbWV0ZXJzJ1xuICAsICdnbF9Gcm9udE1hdGVyaWFsJ1xuICAsICdnbF9CYWNrTWF0ZXJpYWwnXG4gICwgJ2dsX0xpZ2h0U291cmNlUGFyYW1ldGVycydcbiAgLCAnZ2xfTGlnaHRTb3VyY2UnXG4gICwgJ2dsX0xpZ2h0TW9kZWxQYXJhbWV0ZXJzJ1xuICAsICdnbF9MaWdodE1vZGVsJ1xuICAsICdnbF9MaWdodE1vZGVsUHJvZHVjdHMnXG4gICwgJ2dsX0Zyb250TGlnaHRNb2RlbFByb2R1Y3QnXG4gICwgJ2dsX0JhY2tMaWdodE1vZGVsUHJvZHVjdCdcbiAgLCAnZ2xfTGlnaHRQcm9kdWN0cydcbiAgLCAnZ2xfRnJvbnRMaWdodFByb2R1Y3QnXG4gICwgJ2dsX0JhY2tMaWdodFByb2R1Y3QnXG4gICwgJ2dsX0ZvZ1BhcmFtZXRlcnMnXG4gICwgJ2dsX0ZvZydcbiAgLCAnZ2xfVGV4dHVyZUVudkNvbG9yJ1xuICAsICdnbF9FeWVQbGFuZVMnXG4gICwgJ2dsX0V5ZVBsYW5lVCdcbiAgLCAnZ2xfRXllUGxhbmVSJ1xuICAsICdnbF9FeWVQbGFuZVEnXG4gICwgJ2dsX09iamVjdFBsYW5lUydcbiAgLCAnZ2xfT2JqZWN0UGxhbmVUJ1xuICAsICdnbF9PYmplY3RQbGFuZVInXG4gICwgJ2dsX09iamVjdFBsYW5lUSdcbiAgLCAnZ2xfRnJvbnRDb2xvcidcbiAgLCAnZ2xfQmFja0NvbG9yJ1xuICAsICdnbF9Gcm9udFNlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9CYWNrU2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX1RleENvb3JkJ1xuICAsICdnbF9Gb2dGcmFnQ29vcmQnXG4gICwgJ2dsX0NvbG9yJ1xuICAsICdnbF9TZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfVGV4Q29vcmQnXG4gICwgJ2dsX0ZvZ0ZyYWdDb29yZCdcbiAgLCAnZ2xfUG9pbnRDb29yZCdcbiAgLCAncmFkaWFucydcbiAgLCAnZGVncmVlcydcbiAgLCAnc2luJ1xuICAsICdjb3MnXG4gICwgJ3RhbidcbiAgLCAnYXNpbidcbiAgLCAnYWNvcydcbiAgLCAnYXRhbidcbiAgLCAncG93J1xuICAsICdleHAnXG4gICwgJ2xvZydcbiAgLCAnZXhwMidcbiAgLCAnbG9nMidcbiAgLCAnc3FydCdcbiAgLCAnaW52ZXJzZXNxcnQnXG4gICwgJ2FicydcbiAgLCAnc2lnbidcbiAgLCAnZmxvb3InXG4gICwgJ2NlaWwnXG4gICwgJ2ZyYWN0J1xuICAsICdtb2QnXG4gICwgJ21pbidcbiAgLCAnbWF4J1xuICAsICdjbGFtcCdcbiAgLCAnbWl4J1xuICAsICdzdGVwJ1xuICAsICdzbW9vdGhzdGVwJ1xuICAsICdsZW5ndGgnXG4gICwgJ2Rpc3RhbmNlJ1xuICAsICdkb3QnXG4gICwgJ2Nyb3NzJ1xuICAsICdub3JtYWxpemUnXG4gICwgJ2ZhY2Vmb3J3YXJkJ1xuICAsICdyZWZsZWN0J1xuICAsICdyZWZyYWN0J1xuICAsICdtYXRyaXhDb21wTXVsdCdcbiAgLCAnbGVzc1RoYW4nXG4gICwgJ2xlc3NUaGFuRXF1YWwnXG4gICwgJ2dyZWF0ZXJUaGFuJ1xuICAsICdncmVhdGVyVGhhbkVxdWFsJ1xuICAsICdlcXVhbCdcbiAgLCAnbm90RXF1YWwnXG4gICwgJ2FueSdcbiAgLCAnYWxsJ1xuICAsICdub3QnXG4gICwgJ3RleHR1cmUyRCdcbiAgLCAndGV4dHVyZTJEUHJvaidcbiAgLCAndGV4dHVyZTJETG9kJ1xuICAsICd0ZXh0dXJlMkRQcm9qTG9kJ1xuICAsICd0ZXh0dXJlQ3ViZSdcbiAgLCAndGV4dHVyZUN1YmVMb2QnXG4gICwgJ2RGZHgnXG4gICwgJ2RGZHknXG5dXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgLy8gY3VycmVudFxuICAgICdwcmVjaXNpb24nXG4gICwgJ2hpZ2hwJ1xuICAsICdtZWRpdW1wJ1xuICAsICdsb3dwJ1xuICAsICdhdHRyaWJ1dGUnXG4gICwgJ2NvbnN0J1xuICAsICd1bmlmb3JtJ1xuICAsICd2YXJ5aW5nJ1xuICAsICdicmVhaydcbiAgLCAnY29udGludWUnXG4gICwgJ2RvJ1xuICAsICdmb3InXG4gICwgJ3doaWxlJ1xuICAsICdpZidcbiAgLCAnZWxzZSdcbiAgLCAnaW4nXG4gICwgJ291dCdcbiAgLCAnaW5vdXQnXG4gICwgJ2Zsb2F0J1xuICAsICdpbnQnXG4gICwgJ3ZvaWQnXG4gICwgJ2Jvb2wnXG4gICwgJ3RydWUnXG4gICwgJ2ZhbHNlJ1xuICAsICdkaXNjYXJkJ1xuICAsICdyZXR1cm4nXG4gICwgJ21hdDInXG4gICwgJ21hdDMnXG4gICwgJ21hdDQnXG4gICwgJ3ZlYzInXG4gICwgJ3ZlYzMnXG4gICwgJ3ZlYzQnXG4gICwgJ2l2ZWMyJ1xuICAsICdpdmVjMydcbiAgLCAnaXZlYzQnXG4gICwgJ2J2ZWMyJ1xuICAsICdidmVjMydcbiAgLCAnYnZlYzQnXG4gICwgJ3NhbXBsZXIxRCdcbiAgLCAnc2FtcGxlcjJEJ1xuICAsICdzYW1wbGVyM0QnXG4gICwgJ3NhbXBsZXJDdWJlJ1xuICAsICdzYW1wbGVyMURTaGFkb3cnXG4gICwgJ3NhbXBsZXIyRFNoYWRvdydcbiAgLCAnc3RydWN0J1xuXG4gIC8vIGZ1dHVyZVxuICAsICdhc20nXG4gICwgJ2NsYXNzJ1xuICAsICd1bmlvbidcbiAgLCAnZW51bSdcbiAgLCAndHlwZWRlZidcbiAgLCAndGVtcGxhdGUnXG4gICwgJ3RoaXMnXG4gICwgJ3BhY2tlZCdcbiAgLCAnZ290bydcbiAgLCAnc3dpdGNoJ1xuICAsICdkZWZhdWx0J1xuICAsICdpbmxpbmUnXG4gICwgJ25vaW5saW5lJ1xuICAsICd2b2xhdGlsZSdcbiAgLCAncHVibGljJ1xuICAsICdzdGF0aWMnXG4gICwgJ2V4dGVybidcbiAgLCAnZXh0ZXJuYWwnXG4gICwgJ2ludGVyZmFjZSdcbiAgLCAnbG9uZydcbiAgLCAnc2hvcnQnXG4gICwgJ2RvdWJsZSdcbiAgLCAnaGFsZidcbiAgLCAnZml4ZWQnXG4gICwgJ3Vuc2lnbmVkJ1xuICAsICdpbnB1dCdcbiAgLCAnb3V0cHV0J1xuICAsICdodmVjMidcbiAgLCAnaHZlYzMnXG4gICwgJ2h2ZWM0J1xuICAsICdkdmVjMidcbiAgLCAnZHZlYzMnXG4gICwgJ2R2ZWM0J1xuICAsICdmdmVjMidcbiAgLCAnZnZlYzMnXG4gICwgJ2Z2ZWM0J1xuICAsICdzYW1wbGVyMkRSZWN0J1xuICAsICdzYW1wbGVyM0RSZWN0J1xuICAsICdzYW1wbGVyMkRSZWN0U2hhZG93J1xuICAsICdzaXplb2YnXG4gICwgJ2Nhc3QnXG4gICwgJ25hbWVzcGFjZSdcbiAgLCAndXNpbmcnXG5dXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICAnPDw9J1xuICAsICc+Pj0nXG4gICwgJysrJ1xuICAsICctLSdcbiAgLCAnPDwnXG4gICwgJz4+J1xuICAsICc8PSdcbiAgLCAnPj0nXG4gICwgJz09J1xuICAsICchPSdcbiAgLCAnJiYnXG4gICwgJ3x8J1xuICAsICcrPSdcbiAgLCAnLT0nXG4gICwgJyo9J1xuICAsICcvPSdcbiAgLCAnJT0nXG4gICwgJyY9J1xuICAsICdeXidcbiAgLCAnXj0nXG4gICwgJ3w9J1xuICAsICcoJ1xuICAsICcpJ1xuICAsICdbJ1xuICAsICddJ1xuICAsICcuJ1xuICAsICchJ1xuICAsICd+J1xuICAsICcqJ1xuICAsICcvJ1xuICAsICclJ1xuICAsICcrJ1xuICAsICctJ1xuICAsICc8J1xuICAsICc+J1xuICAsICcmJ1xuICAsICdeJ1xuICAsICd8J1xuICAsICc/J1xuICAsICc6J1xuICAsICc9J1xuICAsICcsJ1xuICAsICc7J1xuICAsICd7J1xuICAsICd9J1xuXVxuIiwidmFyIHRva2VuaXplID0gcmVxdWlyZSgnLi9pbmRleCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdG9rZW5pemVTdHJpbmdcblxuZnVuY3Rpb24gdG9rZW5pemVTdHJpbmcoc3RyKSB7XG4gIHZhciBnZW5lcmF0b3IgPSB0b2tlbml6ZSgpXG4gIHZhciB0b2tlbnMgPSBbXVxuXG4gIHRva2VucyA9IHRva2Vucy5jb25jYXQoZ2VuZXJhdG9yKHN0cikpXG4gIHRva2VucyA9IHRva2Vucy5jb25jYXQoZ2VuZXJhdG9yKG51bGwpKVxuXG4gIHJldHVybiB0b2tlbnNcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLyohXG4gKiByZXBlYXQtc3RyaW5nIDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9yZXBlYXQtc3RyaW5nPlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBKb24gU2NobGlua2VydC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXhwb3NlIGByZXBlYXRgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSByZXBlYXQ7XG5cbi8qKlxuICogUmVwZWF0IHRoZSBnaXZlbiBgc3RyaW5nYCB0aGUgc3BlY2lmaWVkIGBudW1iZXJgXG4gKiBvZiB0aW1lcy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqXG4gKiBgYGBqc1xuICogdmFyIHJlcGVhdCA9IHJlcXVpcmUoJ3JlcGVhdC1zdHJpbmcnKTtcbiAqIHJlcGVhdCgnQScsIDUpO1xuICogLy89PiBBQUFBQVxuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGBzdHJpbmdgIFRoZSBzdHJpbmcgdG8gcmVwZWF0XG4gKiBAcGFyYW0ge051bWJlcn0gYG51bWJlcmAgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSBSZXBlYXRlZCBzdHJpbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gcmVwZWF0KHN0ciwgbnVtKSB7XG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3JlcGVhdC1zdHJpbmcgZXhwZWN0cyBhIHN0cmluZy4nKTtcbiAgfVxuXG4gIGlmIChudW0gPT09IDEpIHJldHVybiBzdHI7XG4gIGlmIChudW0gPT09IDIpIHJldHVybiBzdHIgKyBzdHI7XG5cbiAgdmFyIG1heCA9IHN0ci5sZW5ndGggKiBudW07XG4gIGlmIChjYWNoZSAhPT0gc3RyIHx8IHR5cGVvZiBjYWNoZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjYWNoZSA9IHN0cjtcbiAgICByZXMgPSAnJztcbiAgfVxuXG4gIHdoaWxlIChtYXggPiByZXMubGVuZ3RoICYmIG51bSA+IDApIHtcbiAgICBpZiAobnVtICYgMSkge1xuICAgICAgcmVzICs9IHN0cjtcbiAgICB9XG5cbiAgICBudW0gPj49IDE7XG4gICAgaWYgKCFudW0pIGJyZWFrO1xuICAgIHN0ciArPSBzdHI7XG4gIH1cblxuICByZXR1cm4gcmVzLnN1YnN0cigwLCBtYXgpO1xufVxuXG4vKipcbiAqIFJlc3VsdHMgY2FjaGVcbiAqL1xuXG52YXIgcmVzID0gJyc7XG52YXIgY2FjaGU7XG4iLCIoZnVuY3Rpb24od2luZG93KSB7XG4gICAgdmFyIHJlID0ge1xuICAgICAgICBub3Rfc3RyaW5nOiAvW15zXS8sXG4gICAgICAgIG51bWJlcjogL1tkaWVmZ10vLFxuICAgICAgICBqc29uOiAvW2pdLyxcbiAgICAgICAgbm90X2pzb246IC9bXmpdLyxcbiAgICAgICAgdGV4dDogL15bXlxceDI1XSsvLFxuICAgICAgICBtb2R1bG86IC9eXFx4MjV7Mn0vLFxuICAgICAgICBwbGFjZWhvbGRlcjogL15cXHgyNSg/OihbMS05XVxcZCopXFwkfFxcKChbXlxcKV0rKVxcKSk/KFxcKyk/KDB8J1teJF0pPygtKT8oXFxkKyk/KD86XFwuKFxcZCspKT8oW2ItZ2lqb3N1eFhdKS8sXG4gICAgICAgIGtleTogL14oW2Etel9dW2Etel9cXGRdKikvaSxcbiAgICAgICAga2V5X2FjY2VzczogL15cXC4oW2Etel9dW2Etel9cXGRdKikvaSxcbiAgICAgICAgaW5kZXhfYWNjZXNzOiAvXlxcWyhcXGQrKVxcXS8sXG4gICAgICAgIHNpZ246IC9eW1xcK1xcLV0vXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3ByaW50ZigpIHtcbiAgICAgICAgdmFyIGtleSA9IGFyZ3VtZW50c1swXSwgY2FjaGUgPSBzcHJpbnRmLmNhY2hlXG4gICAgICAgIGlmICghKGNhY2hlW2tleV0gJiYgY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkpIHtcbiAgICAgICAgICAgIGNhY2hlW2tleV0gPSBzcHJpbnRmLnBhcnNlKGtleSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3ByaW50Zi5mb3JtYXQuY2FsbChudWxsLCBjYWNoZVtrZXldLCBhcmd1bWVudHMpXG4gICAgfVxuXG4gICAgc3ByaW50Zi5mb3JtYXQgPSBmdW5jdGlvbihwYXJzZV90cmVlLCBhcmd2KSB7XG4gICAgICAgIHZhciBjdXJzb3IgPSAxLCB0cmVlX2xlbmd0aCA9IHBhcnNlX3RyZWUubGVuZ3RoLCBub2RlX3R5cGUgPSBcIlwiLCBhcmcsIG91dHB1dCA9IFtdLCBpLCBrLCBtYXRjaCwgcGFkLCBwYWRfY2hhcmFjdGVyLCBwYWRfbGVuZ3RoLCBpc19wb3NpdGl2ZSA9IHRydWUsIHNpZ24gPSBcIlwiXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0cmVlX2xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlX3R5cGUgPSBnZXRfdHlwZShwYXJzZV90cmVlW2ldKVxuICAgICAgICAgICAgaWYgKG5vZGVfdHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IHBhcnNlX3RyZWVbaV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5vZGVfdHlwZSA9PT0gXCJhcnJheVwiKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSBwYXJzZV90cmVlW2ldIC8vIGNvbnZlbmllbmNlIHB1cnBvc2VzIG9ubHlcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHsgLy8ga2V5d29yZCBhcmd1bWVudFxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd2W2N1cnNvcl1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IG1hdGNoWzJdLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFyZy5oYXNPd25Qcm9wZXJ0eShtYXRjaFsyXVtrXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZihcIltzcHJpbnRmXSBwcm9wZXJ0eSAnJXMnIGRvZXMgbm90IGV4aXN0XCIsIG1hdGNoWzJdW2tdKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ1ttYXRjaFsyXVtrXV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtYXRjaFsxXSkgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChleHBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndlttYXRjaFsxXV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7IC8vIHBvc2l0aW9uYWwgYXJndW1lbnQgKGltcGxpY2l0KVxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd2W2N1cnNvcisrXVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChnZXRfdHlwZShhcmcpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcoKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5ub3Rfc3RyaW5nLnRlc3QobWF0Y2hbOF0pICYmIHJlLm5vdF9qc29uLnRlc3QobWF0Y2hbOF0pICYmIChnZXRfdHlwZShhcmcpICE9IFwibnVtYmVyXCIgJiYgaXNOYU4oYXJnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzcHJpbnRmKFwiW3NwcmludGZdIGV4cGVjdGluZyBudW1iZXIgYnV0IGZvdW5kICVzXCIsIGdldF90eXBlKGFyZykpKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChtYXRjaFs4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNfcG9zaXRpdmUgPSBhcmcgPj0gMFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN3aXRjaCAobWF0Y2hbOF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygyKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gU3RyaW5nLmZyb21DaGFyQ29kZShhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBwYXJzZUludChhcmcsIDEwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwialwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gSlNPTi5zdHJpbmdpZnkoYXJnLCBudWxsLCBtYXRjaFs2XSA/IHBhcnNlSW50KG1hdGNoWzZdKSA6IDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IGFyZy50b0V4cG9uZW50aWFsKG1hdGNoWzddKSA6IGFyZy50b0V4cG9uZW50aWFsKClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IG1hdGNoWzddID8gcGFyc2VGbG9hdChhcmcpLnRvRml4ZWQobWF0Y2hbN10pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJnXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IHBhcnNlRmxvYXQoYXJnKS50b1ByZWNpc2lvbihtYXRjaFs3XSkgOiBwYXJzZUZsb2F0KGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZyg4KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKChhcmcgPSBTdHJpbmcoYXJnKSkgJiYgbWF0Y2hbN10gPyBhcmcuc3Vic3RyaW5nKDAsIG1hdGNoWzddKSA6IGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZyA+Pj4gMFxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwieFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDE2KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiWFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZS5qc29uLnRlc3QobWF0Y2hbOF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IGFyZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlLm51bWJlci50ZXN0KG1hdGNoWzhdKSAmJiAoIWlzX3Bvc2l0aXZlIHx8IG1hdGNoWzNdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IGlzX3Bvc2l0aXZlID8gXCIrXCIgOiBcIi1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKCkucmVwbGFjZShyZS5zaWduLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwYWRfY2hhcmFjdGVyID0gbWF0Y2hbNF0gPyBtYXRjaFs0XSA9PT0gXCIwXCIgPyBcIjBcIiA6IG1hdGNoWzRdLmNoYXJBdCgxKSA6IFwiIFwiXG4gICAgICAgICAgICAgICAgICAgIHBhZF9sZW5ndGggPSBtYXRjaFs2XSAtIChzaWduICsgYXJnKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcGFkID0gbWF0Y2hbNl0gPyAocGFkX2xlbmd0aCA+IDAgPyBzdHJfcmVwZWF0KHBhZF9jaGFyYWN0ZXIsIHBhZF9sZW5ndGgpIDogXCJcIikgOiBcIlwiXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IG1hdGNoWzVdID8gc2lnbiArIGFyZyArIHBhZCA6IChwYWRfY2hhcmFjdGVyID09PSBcIjBcIiA/IHNpZ24gKyBwYWQgKyBhcmcgOiBwYWQgKyBzaWduICsgYXJnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0LmpvaW4oXCJcIilcbiAgICB9XG5cbiAgICBzcHJpbnRmLmNhY2hlID0ge31cblxuICAgIHNwcmludGYucGFyc2UgPSBmdW5jdGlvbihmbXQpIHtcbiAgICAgICAgdmFyIF9mbXQgPSBmbXQsIG1hdGNoID0gW10sIHBhcnNlX3RyZWUgPSBbXSwgYXJnX25hbWVzID0gMFxuICAgICAgICB3aGlsZSAoX2ZtdCkge1xuICAgICAgICAgICAgaWYgKChtYXRjaCA9IHJlLnRleHQuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlW3BhcnNlX3RyZWUubGVuZ3RoXSA9IG1hdGNoWzBdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5tb2R1bG8uZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlW3BhcnNlX3RyZWUubGVuZ3RoXSA9IFwiJVwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5wbGFjZWhvbGRlci5leGVjKF9mbXQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdfbmFtZXMgfD0gMVxuICAgICAgICAgICAgICAgICAgICB2YXIgZmllbGRfbGlzdCA9IFtdLCByZXBsYWNlbWVudF9maWVsZCA9IG1hdGNoWzJdLCBmaWVsZF9tYXRjaCA9IFtdXG4gICAgICAgICAgICAgICAgICAgIGlmICgoZmllbGRfbWF0Y2ggPSByZS5rZXkuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKHJlcGxhY2VtZW50X2ZpZWxkID0gcmVwbGFjZW1lbnRfZmllbGQuc3Vic3RyaW5nKGZpZWxkX21hdGNoWzBdLmxlbmd0aCkpICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChmaWVsZF9tYXRjaCA9IHJlLmtleV9hY2Nlc3MuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkX2xpc3RbZmllbGRfbGlzdC5sZW5ndGhdID0gZmllbGRfbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoKGZpZWxkX21hdGNoID0gcmUuaW5kZXhfYWNjZXNzLmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJbc3ByaW50Zl0gZmFpbGVkIHRvIHBhcnNlIG5hbWVkIGFyZ3VtZW50IGtleVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIltzcHJpbnRmXSBmYWlsZWQgdG8gcGFyc2UgbmFtZWQgYXJndW1lbnQga2V5XCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBmaWVsZF9saXN0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhcmdfbmFtZXMgfD0gMlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXJnX25hbWVzID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIltzcHJpbnRmXSBtaXhpbmcgcG9zaXRpb25hbCBhbmQgbmFtZWQgcGxhY2Vob2xkZXJzIGlzIG5vdCAoeWV0KSBzdXBwb3J0ZWRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBtYXRjaFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW3NwcmludGZdIHVuZXhwZWN0ZWQgcGxhY2Vob2xkZXJcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9mbXQgPSBfZm10LnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcnNlX3RyZWVcbiAgICB9XG5cbiAgICB2YXIgdnNwcmludGYgPSBmdW5jdGlvbihmbXQsIGFyZ3YsIF9hcmd2KSB7XG4gICAgICAgIF9hcmd2ID0gKGFyZ3YgfHwgW10pLnNsaWNlKDApXG4gICAgICAgIF9hcmd2LnNwbGljZSgwLCAwLCBmbXQpXG4gICAgICAgIHJldHVybiBzcHJpbnRmLmFwcGx5KG51bGwsIF9hcmd2KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGhlbHBlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRfdHlwZSh2YXJpYWJsZSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0cl9yZXBlYXQoaW5wdXQsIG11bHRpcGxpZXIpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5KG11bHRpcGxpZXIgKyAxKS5qb2luKGlucHV0KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGV4cG9ydCB0byBlaXRoZXIgYnJvd3NlciBvciBub2RlLmpzXG4gICAgICovXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGV4cG9ydHMuc3ByaW50ZiA9IHNwcmludGZcbiAgICAgICAgZXhwb3J0cy52c3ByaW50ZiA9IHZzcHJpbnRmXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB3aW5kb3cuc3ByaW50ZiA9IHNwcmludGZcbiAgICAgICAgd2luZG93LnZzcHJpbnRmID0gdnNwcmludGZcblxuICAgICAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmOiBzcHJpbnRmLFxuICAgICAgICAgICAgICAgICAgICB2c3ByaW50ZjogdnNwcmludGZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufSkodHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIiA/IHRoaXMgOiB3aW5kb3cpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIi8vICBUaW1lciBiYXNlZCBhbmltYXRpb25cbi8vIFRPRE8gY2xlYW4gdXAgbGludGluZ1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGdsb2JhbCBzZXRUaW1lb3V0ICovXG5pbXBvcnQge21lcmdlLCBub29wLCBzcGxhdH0gZnJvbSAnLi4vdXRpbHMnO1xuXG52YXIgUXVldWUgPSBbXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRngge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHtcbiAgICAgIGRlbGF5OiAwLFxuICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICB0cmFuc2l0aW9uOiB4ID0+IHgsXG4gICAgICBvbkNvbXB1dGU6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wXG4gICAgfSwgb3B0aW9ucyk7XG4gIH1cblxuICBzdGFydChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh0aGlzLm9wdCwgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy50aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmFuaW1hdGluZyA9IHRydWU7XG4gICAgUXVldWUucHVzaCh0aGlzKTtcbiAgfVxuXG4gIC8vIHBlcmZvcm0gYSBzdGVwIGluIHRoZSBhbmltYXRpb25cbiAgc3RlcCgpIHtcbiAgICAvLyBpZiBub3QgYW5pbWF0aW5nLCB0aGVuIHJldHVyblxuICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKSxcbiAgICAgIHRpbWUgPSB0aGlzLnRpbWUsXG4gICAgICBvcHQgPSB0aGlzLm9wdCxcbiAgICAgIGRlbGF5ID0gb3B0LmRlbGF5LFxuICAgICAgZHVyYXRpb24gPSBvcHQuZHVyYXRpb24sXG4gICAgICBkZWx0YSA9IDA7XG4gICAgLy8gaG9sZCBhbmltYXRpb24gZm9yIHRoZSBkZWxheVxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSkge1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaWYgaW4gb3VyIHRpbWUgd2luZG93LCB0aGVuIGV4ZWN1dGUgYW5pbWF0aW9uXG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5ICsgZHVyYXRpb24pIHtcbiAgICAgIGRlbHRhID0gb3B0LnRyYW5zaXRpb24oKGN1cnJlbnRUaW1lIC0gdGltZSAtIGRlbGF5KSAvIGR1cmF0aW9uKTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgMSk7XG4gICAgICBvcHQub25Db21wbGV0ZS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBjb21wdXRlKGZyb20sIHRvLCBkZWx0YSkge1xuICAgIHJldHVybiBmcm9tICsgKHRvIC0gZnJvbSkgKiBkZWx0YTtcbiAgfVxufVxuXG5GeC5RdWV1ZSA9IFF1ZXVlO1xuXG4vLyBFYXNpbmcgZXF1YXRpb25zXG5GeC5UcmFuc2l0aW9uID0ge1xuICBsaW5lYXIocCkge1xuICAgIHJldHVybiBwO1xuICB9XG59O1xuXG52YXIgVHJhbnMgPSBGeC5UcmFuc2l0aW9uO1xuXG5GeC5wcm90b3R5cGUudGltZSA9IG51bGw7XG5cbmZ1bmN0aW9uIG1ha2VUcmFucyh0cmFuc2l0aW9uLCBwYXJhbXMpIHtcbiAgcGFyYW1zID0gc3BsYXQocGFyYW1zKTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24odHJhbnNpdGlvbiwge1xuICAgIGVhc2VJbihwb3MpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uKHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VPdXQocG9zKSB7XG4gICAgICByZXR1cm4gMSAtIHRyYW5zaXRpb24oMSAtIHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VJbk91dChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zIDw9IDAuNSkgPyB0cmFuc2l0aW9uKDIgKiBwb3MsIHBhcmFtcykgLyAyIDpcbiAgICAgICAgKDIgLSB0cmFuc2l0aW9uKDIgKiAoMSAtIHBvcyksIHBhcmFtcykpIC8gMjtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgdHJhbnNpdGlvbnMgPSB7XG5cbiAgUG93KHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgeFswXSB8fCA2KTtcbiAgfSxcblxuICBFeHBvKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgOCAqIChwIC0gMSkpO1xuICB9LFxuXG4gIENpcmMocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oTWF0aC5hY29zKHApKTtcbiAgfSxcblxuICBTaW5lKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKCgxIC0gcCkgKiBNYXRoLlBJIC8gMik7XG4gIH0sXG5cbiAgQmFjayhwLCB4KSB7XG4gICAgeCA9IHhbMF0gfHwgMS42MTg7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIDIpICogKCh4ICsgMSkgKiBwIC0geCk7XG4gIH0sXG5cbiAgQm91bmNlKHApIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgZm9yIChsZXQgYSA9IDAsIGIgPSAxOyAxOyBhICs9IGIsIGIgLz0gMikge1xuICAgICAgaWYgKHAgPj0gKDcgLSA0ICogYSkgLyAxMSkge1xuICAgICAgICB2YWx1ZSA9IGIgKiBiIC0gTWF0aC5wb3coKDExIC0gNiAqIGEgLSAxMSAqIHApIC8gNCwgMik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG5cbiAgRWxhc3RpYyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDEwICogLS1wKSAqIE1hdGguY29zKDIwICogcCAqIE1hdGguUEkgKiAoeFswXSB8fCAxKSAvIDMpO1xuICB9XG5cbn07XG5cbmZvciAoY29uc3QgdCBpbiB0cmFuc2l0aW9ucykge1xuICBUcmFuc1t0XSA9IG1ha2VUcmFucyh0cmFuc2l0aW9uc1t0XSk7XG59XG5cblsnUXVhZCcsICdDdWJpYycsICdRdWFydCcsICdRdWludCddLmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaSkge1xuICBUcmFuc1tlbGVtXSA9IG1ha2VUcmFucyhmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIFtcbiAgICAgIGkgKyAyXG4gICAgXSk7XG4gIH0pO1xufSk7XG5cbi8vIGFuaW1hdGlvblRpbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcblxuLy8gIHJ5ZTogVE9ETy0gcmVmYWN0b3IgZ2xvYmFsIGRlZmluaXRpb24gd2hlbiB3ZSBkZWZpbmUgdGhlIHR3b1xuLy8gICAgICAgICAgICAgKGJyb3dzZXJpZnkvPHNjcmlwdD4pIGJ1aWxkIHBhdGhzLlxudmFyIGdsb2JhbDtcbnRyeSB7XG4gIGdsb2JhbCA9IHdpbmRvdztcbn0gY2F0Y2ggKGUpIHtcbiAgZ2xvYmFsID0gbnVsbDtcbn1cblxudmFyIGNoZWNrRnhRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2xkUXVldWUgPSBRdWV1ZTtcbiAgUXVldWUgPSBbXTtcbiAgaWYgKG9sZFF1ZXVlLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2xkUXVldWUubGVuZ3RoLCBmeDsgaSA8IGw7IGkrKykge1xuICAgICAgZnggPSBvbGRRdWV1ZVtpXTtcbiAgICAgIGZ4LnN0ZXAoKTtcbiAgICAgIGlmIChmeC5hbmltYXRpbmcpIHtcbiAgICAgICAgUXVldWUucHVzaChmeCk7XG4gICAgICB9XG4gICAgfVxuICAgIEZ4LlF1ZXVlID0gUXVldWU7XG4gIH1cbn07XG5cbmlmIChnbG9iYWwpIHtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0QW5pbWF0aW9uVGltZScsICdtb3pBbmltYXRpb25UaW1lJywgJ2FuaW1hdGlvblRpbWUnLFxuICAgJ3dlYmtpdEFuaW1hdGlvblN0YXJ0VGltZScsICdtb3pBbmltYXRpb25TdGFydFRpbWUnLCAnYW5pbWF0aW9uU3RhcnRUaW1lJ11cbiAgICAuZm9yRWFjaChpbXBsID0+IHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5hbmltYXRpb25UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGdsb2JhbFtpbXBsXTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRnguYW5pbWF0aW9uVGltZSA9IERhdGUubm93O1xuICB9XG4gIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuICBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZScsICdtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLFxuICAgJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddXG4gICAgLmZvckVhY2goZnVuY3Rpb24oaW1wbCkge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgZ2xvYmFsW2ltcGxdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9LCAxMDAwIC8gNjApO1xuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCBQcm9ncmFtIGZyb20gJy4uL3dlYmdsL3Byb2dyYW0nO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQge1hIUkdyb3VwfSBmcm9tICcuLi9pbyc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuLy8gQWx0ZXJuYXRlIGNvbnN0cnVjdG9yXG4vLyBCdWlsZCBwcm9ncmFtIGZyb20gZGVmYXVsdCBzaGFkZXJzIChyZXF1aXJlcyBTaGFkZXJzKVxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtZnJvbURlZmF1bHRTaGFkZXJzKGdsLCBpZCkge1xuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHtcbiAgICB2czogU2hhZGVycy5WZXJ0ZXguRGVmYXVsdCxcbiAgICBmczogU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0LFxuICAgIGlkXG4gIH0pO1xufVxuXG4vLyBDcmVhdGUgYSBwcm9ncmFtIGZyb20gdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgbm9kZSBpZHNcbi8vIEBkZXByZWNhdGVkIC0gVXNlIGdsc2xpZnkgaW5zdGVhZFxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtRnJvbUhUTUxUZW1wbGF0ZXMoZ2wsIHZzSWQsIGZzSWQsIGlkKSB7XG4gIGNvbnN0IHZzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodnNJZCkuaW5uZXJIVE1MO1xuICBjb25zdCBmcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZzSWQpLmlubmVySFRNTDtcbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7dnMsIGZzLCBpZH0pO1xufVxuXG4vLyBMb2FkIHNoYWRlcnMgdXNpbmcgWEhSXG4vLyBAZGVwcmVjYXRlZCAtIFVzZSBnbHNsaWZ5IGluc3RlYWRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlUHJvZ3JhbUZyb21TaGFkZXJVUklzKGdsLCB2cywgZnMsIG9wdHMpIHtcbiAgb3B0cyA9IG1lcmdlKHtcbiAgICBwYXRoOiAnLycsXG4gICAgbm9DYWNoZTogZmFsc2VcbiAgfSwgb3B0cyk7XG5cbiAgY29uc3QgdmVydGV4U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgdnM7XG4gIGNvbnN0IGZyYWdtZW50U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgZnM7XG5cbiAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgbmV3IFhIUkdyb3VwKHtcbiAgICB1cmxzOiBbdmVydGV4U2hhZGVyVVJJLCBmcmFnbWVudFNoYWRlclVSSV0sXG4gICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG4gIH0pLnNlbmRBc3luYygpO1xuXG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzOiByZXNwb25zZXNbMF0sIGZzOiByZXNwb25zZXNbMV19KTtcbn1cbiIsImltcG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vaGVscGVycyc7XG5cbmV4cG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5leHBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5leHBvcnQgKiBmcm9tICcuL2hlbHBlcnMnO1xuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lkx1bWFHTCkge1xuICB3aW5kb3cuTHVtYUdMLmFkZG9ucyA9IHtcbiAgICBGeDogRngsXG4gICAgV29ya2VyR3JvdXA6IFdvcmtlckdyb3VwXG4gIH07XG4gIE9iamVjdC5hc3NpZ24od2luZG93Lkx1bWFHTC5hZGRvbnMsIGhlbHBlcnMpO1xufVxuIiwiLy8gd29ya2Vycy5qc1xuLy9cbi8qIGdsb2JhbCBXb3JrZXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIG9uZS12YXIsIGluZGVudCAqL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXb3JrZXJHcm91cCB7XG5cbiAgY29uc3RydWN0b3IoZmlsZU5hbWUsIG4pIHtcbiAgICB2YXIgd29ya2VycyA9IHRoaXMud29ya2VycyA9IFtdO1xuICAgIHdoaWxlIChuLS0pIHtcbiAgICAgIHdvcmtlcnMucHVzaChuZXcgV29ya2VyKGZpbGVOYW1lKSk7XG4gICAgfVxuICB9XG5cbiAgbWFwKGZ1bmMpIHtcbiAgICB2YXIgd29ya2VycyA9IHRoaXMud29ya2VycztcbiAgICB2YXIgY29uZmlncyA9IHRoaXMuY29uZmlncyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB3b3JrZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgY29uZmlncy5wdXNoKGZ1bmMgJiYgZnVuYyhpKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZWR1Y2Uob3B0KSB7XG4gICAgdmFyIGZuID0gb3B0LnJlZHVjZUZuLFxuICAgICAgICB3b3JrZXJzID0gdGhpcy53b3JrZXJzLFxuICAgICAgICBjb25maWdzID0gdGhpcy5jb25maWdzLFxuICAgICAgICBsID0gd29ya2Vycy5sZW5ndGgsXG4gICAgICAgIGFjdW0gPSBvcHQuaW5pdGlhbFZhbHVlLFxuICAgICAgICBtZXNzYWdlID0gZnVuY3Rpb24gXyhlKSB7XG4gICAgICAgICAgbC0tO1xuICAgICAgICAgIGlmIChhY3VtID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGFjdW0gPSBlLmRhdGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFjdW0gPSBmbihhY3VtLCBlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobCA9PT0gMCkge1xuICAgICAgICAgICAgb3B0Lm9uQ29tcGxldGUoYWN1bSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsbiA9IGw7IGkgPCBsbjsgaSsrKSB7XG4gICAgICB2YXIgdyA9IHdvcmtlcnNbaV07XG4gICAgICB3Lm9ubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB3LnBvc3RNZXNzYWdlKGNvbmZpZ3NbaV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiIsIi8vIFByb3ZpZGVzIGxvYWRpbmcgb2YgYXNzZXRzIHdpdGggWEhSIGFuZCBKU09OUCBtZXRob2RzLlxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5ICovXG5cbi8qIGdsb2JhbCBkb2N1bWVudCwgWE1MSHR0cFJlcXVlc3QsIEltYWdlICovXG5pbXBvcnQge3VpZCwgc3BsYXQsIG1lcmdlLCBub29wfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7VGV4dHVyZTJEfSBmcm9tICcuL3dlYmdsJztcblxuZXhwb3J0IGNsYXNzIFhIUiB7XG5cbiAgY29uc3RydWN0b3Iob3B0ID0ge30pIHtcbiAgICBvcHQgPSB7XG4gICAgICB1cmw6ICdodHRwOi8vIHBoaWxvZ2xqcy5vcmcvJyxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBhc3luYzogdHJ1ZSxcbiAgICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgICAgLy8gYm9keTogbnVsbCxcbiAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2UsXG4gICAgICByZXNwb25zZVR5cGU6IGZhbHNlLFxuICAgICAgb25Qcm9ncmVzczogbm9vcCxcbiAgICAgIG9uU3VjY2Vzczogbm9vcCxcbiAgICAgIG9uRXJyb3I6IG5vb3AsXG4gICAgICBvbkFib3J0OiBub29wLFxuICAgICAgb25Db21wbGV0ZTogbm9vcCxcbiAgICAgIC4uLm9wdFxuICAgIH07XG5cbiAgICB0aGlzLm9wdCA9IG9wdDtcbiAgICB0aGlzLmluaXRYSFIoKTtcbiAgfVxuXG4gIGluaXRYSFIoKSB7XG4gICAgY29uc3QgcmVxID0gdGhpcy5yZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIFsnUHJvZ3Jlc3MnLCAnRXJyb3InLCAnQWJvcnQnLCAnTG9hZCddLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgaWYgKHJlcS5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIHJlcS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LnRvTG93ZXJDYXNlKCksIGUgPT4ge1xuICAgICAgICAgIHNlbGZbJ2hhbmRsZScgKyBldmVudF0oZSk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcVsnb24nICsgZXZlbnQudG9Mb3dlckNhc2UoKV0gPSBlID0+IHtcbiAgICAgICAgICBzZWxmWydoYW5kbGUnICsgZXZlbnRdKGUpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2VuZEFzeW5jKGJvZHkpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qge3JlcSwgb3B0fSA9IHRoaXM7XG4gICAgICBjb25zdCB7YXN5bmN9ID0gb3B0O1xuXG4gICAgICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICAgICAgb3B0LnVybCArPSAob3B0LnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgICAgIH1cblxuICAgICAgcmVxLm9wZW4ob3B0Lm1ldGhvZCwgb3B0LnVybCwgYXN5bmMpO1xuXG4gICAgICBpZiAob3B0LnJlc3BvbnNlVHlwZSkge1xuICAgICAgICByZXEucmVzcG9uc2VUeXBlID0gb3B0LnJlc3BvbnNlVHlwZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFzeW5jKSB7XG4gICAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlID0+IHtcbiAgICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IFhIUi5TdGF0ZS5DT01QTEVURUQpIHtcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHQuc2VuZEFzQmluYXJ5KSB7XG4gICAgICAgIHJlcS5zZW5kQXNCaW5hcnkoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcS5zZW5kKGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghYXN5bmMpIHtcbiAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1cykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kKGJvZHkpIHtcbiAgICBjb25zdCB7cmVxLCBvcHR9ID0gdGhpcztcbiAgICBjb25zdCBhc3luYyA9IG9wdC5hc3luYztcblxuICAgIGlmIChvcHQubm9DYWNoZSkge1xuICAgICAgb3B0LnVybCArPSAob3B0LnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgICB9XG5cbiAgICByZXEub3BlbihvcHQubWV0aG9kLCBvcHQudXJsLCBhc3luYyk7XG5cbiAgICBpZiAob3B0LnJlc3BvbnNlVHlwZSkge1xuICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IG9wdC5yZXNwb25zZVR5cGU7XG4gICAgfVxuXG4gICAgaWYgKGFzeW5jKSB7XG4gICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWEhSLlN0YXRlLkNPTVBMRVRFRCkge1xuICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIG9wdC5vblN1Y2Nlc3MocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHQub25FcnJvcihyZXEuc3RhdHVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG9wdC5zZW5kQXNCaW5hcnkpIHtcbiAgICAgIHJlcS5zZW5kQXNCaW5hcnkoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxLnNlbmQoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICB9XG5cbiAgICBpZiAoIWFzeW5jKSB7XG4gICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgIG9wdC5vblN1Y2Nlc3MocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0Lm9uRXJyb3IocmVxLnN0YXR1cyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5yZXEuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGhhbmRsZVByb2dyZXNzKGUpIHtcbiAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICB0aGlzLm9wdC5vblByb2dyZXNzKGUsIE1hdGgucm91bmQoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3B0Lm9uUHJvZ3Jlc3MoZSwgLTEpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUVycm9yKGUpIHtcbiAgICB0aGlzLm9wdC5vbkVycm9yKGUpO1xuICB9XG5cbiAgaGFuZGxlQWJvcnQoZSkge1xuICAgIHRoaXMub3B0Lm9uQWJvcnQoZSk7XG4gIH1cblxuICBoYW5kbGVMb2FkKGUpIHtcbiAgICB0aGlzLm9wdC5vbkNvbXBsZXRlKGUpO1xuICB9XG59XG5cblhIUi5TdGF0ZSA9IHt9O1xuWydVTklOSVRJQUxJWkVEJywgJ0xPQURJTkcnLCAnTE9BREVEJywgJ0lOVEVSQUNUSVZFJywgJ0NPTVBMRVRFRCddXG4uZm9yRWFjaCgoc3RhdGVOYW1lLCBpKSA9PiB7XG4gIFhIUi5TdGF0ZVtzdGF0ZU5hbWVdID0gaTtcbn0pO1xuXG4vLyBNYWtlIHBhcmFsbGVsIHJlcXVlc3RzIGFuZCBncm91cCB0aGUgcmVzcG9uc2VzLlxuZXhwb3J0IGNsYXNzIFhIUkdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihvcHQgPSB7fSkge1xuICAgIG9wdCA9IHtcbiAgICAgIHVybHM6IFtdLFxuICAgICAgb25TdWNjZXNzOiBub29wLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgbm9DYWNoZTogZmFsc2UsXG4gICAgICAvLyBib2R5OiBudWxsLFxuICAgICAgc2VuZEFzQmluYXJ5OiBmYWxzZSxcbiAgICAgIHJlc3BvbnNlVHlwZTogZmFsc2UsXG4gICAgICAuLi5vcHRcbiAgICB9O1xuXG4gICAgdmFyIHVybHMgPSBzcGxhdChvcHQudXJscyk7XG4gICAgdGhpcy5yZXFzID0gdXJscy5tYXAoKHVybCwgaSkgPT4gbmV3IFhIUih7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogb3B0Lm1ldGhvZCxcbiAgICAgIGFzeW5jOiBvcHQuYXN5bmMsXG4gICAgICBub0NhY2hlOiBvcHQubm9DYWNoZSxcbiAgICAgIHNlbmRBc0JpbmFyeTogb3B0LnNlbmRBc0JpbmFyeSxcbiAgICAgIHJlc3BvbnNlVHlwZTogb3B0LnJlc3BvbnNlVHlwZSxcbiAgICAgIGJvZHk6IG9wdC5ib2R5XG4gICAgfSkpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEFzeW5jKCkge1xuICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnJlcXMubWFwKHJlcSA9PiByZXEuc2VuZEFzeW5jKCkpKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBKU09OUChvcHQpIHtcbiAgb3B0ID0gbWVyZ2Uoe1xuICAgIHVybDogJ2h0dHA6Ly8gcGhpbG9nbGpzLm9yZy8nLFxuICAgIGRhdGE6IHt9LFxuICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgIG9uQ29tcGxldGU6IG5vb3AsXG4gICAgY2FsbGJhY2tLZXk6ICdjYWxsYmFjaydcbiAgfSwgb3B0IHx8IHt9KTtcblxuICB2YXIgaW5kZXggPSBKU09OUC5jb3VudGVyKys7XG4gIC8vIGNyZWF0ZSBxdWVyeSBzdHJpbmdcbiAgdmFyIGRhdGEgPSBbXTtcbiAgZm9yICh2YXIgcHJvcCBpbiBvcHQuZGF0YSkge1xuICAgIGRhdGEucHVzaChwcm9wICsgJz0nICsgb3B0LmRhdGFbcHJvcF0pO1xuICB9XG4gIGRhdGEgPSBkYXRhLmpvaW4oJyYnKTtcbiAgLy8gYXBwZW5kIHVuaXF1ZSBpZCBmb3IgY2FjaGVcbiAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgZGF0YSArPSAoZGF0YS5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgfVxuICAvLyBjcmVhdGUgc291cmNlIHVybFxuICB2YXIgc3JjID0gb3B0LnVybCArXG4gICAgKG9wdC51cmwuaW5kZXhPZignPycpID4gLTEgPyAnJicgOiAnPycpICtcbiAgICBvcHQuY2FsbGJhY2tLZXkgKyAnPVBoaWxvR0wgSU8uSlNPTlAucmVxdWVzdHMucmVxdWVzdF8nICsgaW5kZXggK1xuICAgIChkYXRhLmxlbmd0aCA+IDAgPyAnJicgKyBkYXRhIDogJycpO1xuXG4gIC8vIGNyZWF0ZSBzY3JpcHRcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICBzY3JpcHQuc3JjID0gc3JjO1xuXG4gIC8vIGNyZWF0ZSBjYWxsYmFja1xuICBKU09OUC5yZXF1ZXN0c1sncmVxdWVzdF8nICsgaW5kZXhdID0gZnVuY3Rpb24oanNvbikge1xuICAgIG9wdC5vbkNvbXBsZXRlKGpzb24pO1xuICAgIC8vIHJlbW92ZSBzY3JpcHRcbiAgICBpZiAoc2NyaXB0LnBhcmVudE5vZGUpIHtcbiAgICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgfVxuICAgIGlmIChzY3JpcHQuY2xlYXJBdHRyaWJ1dGVzKSB7XG4gICAgICBzY3JpcHQuY2xlYXJBdHRyaWJ1dGVzKCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIGluamVjdCBzY3JpcHRcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xufVxuXG5KU09OUC5jb3VudGVyID0gMDtcbkpTT05QLnJlcXVlc3RzID0ge307XG5cbi8vIENyZWF0ZXMgYW4gaW1hZ2UtbG9hZGluZyBwcm9taXNlLlxuZnVuY3Rpb24gbG9hZEltYWdlKHNyYykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXNvbHZlKGltYWdlKTtcbiAgICB9O1xuICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGltYWdlICR7c3JjfS5gKSk7XG4gICAgfTtcbiAgICBpbWFnZS5zcmMgPSBzcmM7XG4gIH0pO1xufVxuXG4vLyBMb2FkIG11bHRpcGxlIGltYWdlcyBhc3luYy5cbi8vIHJ5ZTogVE9ETyB0aGlzIG5lZWRzIHRvIGltcGxlbWVudCBmdW5jdGlvbmFsaXR5IGZyb20gdGhlXG4vLyAgICAgICAgICAgb3JpZ2luYWwgSW1hZ2VzIGZ1bmN0aW9uLlxuYXN5bmMgZnVuY3Rpb24gbG9hZEltYWdlcyhzcmNzKSB7XG4gIGxldCBpbWFnZVByb21pc2VzID0gc3Jjcy5tYXAoKHNyYykgPT4gbG9hZEltYWdlKHNyYykpO1xuICBsZXQgcmVzdWx0cyA9IFtdO1xuICBmb3IgKGNvbnN0IGltYWdlUHJvbWlzZSBvZiBpbWFnZVByb21pc2VzKSB7XG4gICAgcmVzdWx0cy5wdXNoKGF3YWl0IGltYWdlUHJvbWlzZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIC8vIExvYWQgbXVsdGlwbGUgSW1hZ2UgYXNzZXRzIGFzeW5jXG4vLyBleHBvcnQgZnVuY3Rpb24gSW1hZ2VzKG9wdCkge1xuLy8gICBvcHQgPSBtZXJnZSh7XG4vLyAgICAgc3JjOiBbXSxcbi8vICAgICBub0NhY2hlOiBmYWxzZSxcbi8vICAgICBvblByb2dyZXNzOiBub29wLFxuLy8gICAgIG9uQ29tcGxldGU6IG5vb3Bcbi8vICAgfSwgb3B0IHx8IHt9KTtcbi8vXG4vLyAgIGxldCBjb3VudCA9IDA7XG4vLyAgIGxldCBsID0gb3B0LnNyYy5sZW5ndGg7XG4vL1xuLy8gICBsZXQgaW1hZ2VzO1xuLy8gICAvLyBJbWFnZSBvbmxvYWQgaGFuZGxlclxuLy8gICB2YXIgbG9hZCA9ICgpID0+IHtcbi8vICAgICBvcHQub25Qcm9ncmVzcyhNYXRoLnJvdW5kKCsrY291bnQgLyBsICogMTAwKSk7XG4vLyAgICAgaWYgKGNvdW50ID09PSBsKSB7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZShpbWFnZXMpO1xuLy8gICAgIH1cbi8vICAgfTtcbi8vICAgLy8gSW1hZ2UgZXJyb3IgaGFuZGxlclxuLy8gICB2YXIgZXJyb3IgPSAoKSA9PiB7XG4vLyAgICAgaWYgKCsrY291bnQgPT09IGwpIHtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKGltYWdlcyk7XG4vLyAgICAgfVxuLy8gICB9O1xuLy9cbi8vICAgLy8gdWlkIGZvciBpbWFnZSBzb3VyY2VzXG4vLyAgIGNvbnN0IG5vQ2FjaGUgPSBvcHQubm9DYWNoZTtcbi8vICAgY29uc3QgdWlkID0gdWlkKCk7XG4vLyAgIGZ1bmN0aW9uIGdldFN1ZmZpeChzKSB7XG4vLyAgICAgcmV0dXJuIChzLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZDtcbi8vICAgfVxuLy9cbi8vICAgLy8gQ3JlYXRlIGltYWdlIGFycmF5XG4vLyAgIGltYWdlcyA9IG9wdC5zcmMubWFwKChzcmMsIGkpID0+IHtcbi8vICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbi8vICAgICBpbWcuaW5kZXggPSBpO1xuLy8gICAgIGltZy5vbmxvYWQgPSBsb2FkO1xuLy8gICAgIGltZy5vbmVycm9yID0gZXJyb3I7XG4vLyAgICAgaW1nLnNyYyA9IHNyYyArIChub0NhY2hlID8gZ2V0U3VmZml4KHNyYykgOiAnJyk7XG4vLyAgICAgcmV0dXJuIGltZztcbi8vICAgfSk7XG4vL1xuLy8gICByZXR1cm4gaW1hZ2VzO1xuLy8gfVxuXG4vLyBMb2FkIG11bHRpcGxlIHRleHR1cmVzIGZyb20gaW1hZ2VzXG4vLyByeWU6IFRPRE8gdGhpcyBuZWVkcyB0byBpbXBsZW1lbnQgZnVuY3Rpb25hbGl0eSBmcm9tXG4vLyAgICAgICAgICAgdGhlIG9yaWdpbmFsIGxvYWRUZXh0dXJlcyBmdW5jdGlvbi5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkVGV4dHVyZXMoZ2wsIG9wdCkge1xuICB2YXIgaW1hZ2VzID0gYXdhaXQgbG9hZEltYWdlcyhvcHQuc3JjKTtcbiAgdmFyIHRleHR1cmVzID0gW107XG4gIGltYWdlcy5mb3JFYWNoKChpbWcsIGkpID0+IHtcbiAgICB2YXIgcGFyYW1zID0gQXJyYXkuaXNBcnJheShvcHQucGFyYW1ldGVycykgP1xuICAgICAgb3B0LnBhcmFtZXRlcnNbaV0gOiBvcHQucGFyYW1ldGVycztcbiAgICBwYXJhbXMgPSBwYXJhbXMgPT09IHVuZGVmaW5lZCA/IHt9IDogcGFyYW1zO1xuICAgIHRleHR1cmVzLnB1c2gobmV3IFRleHR1cmUyRChnbCwgbWVyZ2Uoe1xuICAgICAgZGF0YTogaW1nXG4gICAgfSwgcGFyYW1zKSkpO1xuICB9KTtcbiAgcmV0dXJuIHRleHR1cmVzO1xufVxuXG4vLyAvLyBMb2FkIG11bHRpcGxlIHRleHR1cmVzIGZyb20gaW1hZ2VzXG4vLyBleHBvcnQgZnVuY3Rpb24gbG9hZFRleHR1cmVzKG9wdCA9IHt9KSB7XG4vLyAgIG9wdCA9IHtcbi8vICAgICBzcmM6IFtdLFxuLy8gICAgIG5vQ2FjaGU6IGZhbHNlLFxuLy8gICAgIG9uQ29tcGxldGU6IG5vb3AsXG4vLyAgICAgLi4ub3B0XG4vLyAgIH07XG4vL1xuLy8gICBJbWFnZXMoe1xuLy8gICAgIHNyYzogb3B0LnNyYyxcbi8vICAgICBub0NhY2hlOiBvcHQubm9DYWNoZSxcbi8vICAgICBvbkNvbXBsZXRlKGltYWdlcykge1xuLy8gICAgICAgdmFyIHRleHR1cmVzID0ge307XG4vLyAgICAgICBpbWFnZXMuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4vLyAgICAgICAgIHRleHR1cmVzW29wdC5pZCAmJiBvcHQuaWRbaV0gfHwgb3B0LnNyYyAmJiBvcHQuc3JjW2ldXSA9IG1lcmdlKHtcbi8vICAgICAgICAgICBkYXRhOiB7XG4vLyAgICAgICAgICAgICB2YWx1ZTogaW1nXG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICB9LCBvcHQpO1xuLy8gICAgICAgfSk7XG4vLyAgICAgICBhcHAuc2V0VGV4dHVyZXModGV4dHVyZXMpO1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoKTtcbi8vICAgICB9XG4vLyAgIH0pO1xuLy8gfVxuIiwiLy8gRGVmYXVsdCBTaGFkZXJzXG5cbi8vIFRPRE8gLSBhZG9wdCBnbHNsaWZ5XG5jb25zdCBTaGFkZXJzID0ge1xuICBWZXJ0ZXg6IHt9LFxuICBGcmFnbWVudDoge31cbn07XG5cblNoYWRlcnMuVmVydGV4LkRlZmF1bHQgPSBgXG4jZGVmaW5lIExJR0hUX01BWCA0XG5cbi8vIG9iamVjdCBhdHRyaWJ1dGVzXG5hdHRyaWJ1dGUgdmVjMyBwb3NpdGlvbjtcbmF0dHJpYnV0ZSB2ZWMzIG5vcm1hbDtcbmF0dHJpYnV0ZSB2ZWM0IGNvbG9yO1xuYXR0cmlidXRlIHZlYzQgcGlja2luZ0NvbG9yO1xuYXR0cmlidXRlIHZlYzIgdGV4Q29vcmQxO1xuXG4vLyBjYW1lcmEgYW5kIG9iamVjdCBtYXRyaWNlc1xudW5pZm9ybSBtYXQ0IHZpZXdNYXRyaXg7XG51bmlmb3JtIG1hdDQgdmlld0ludmVyc2VNYXRyaXg7XG51bmlmb3JtIG1hdDQgcHJvamVjdGlvbk1hdHJpeDtcbnVuaWZvcm0gbWF0NCB2aWV3UHJvamVjdGlvbk1hdHJpeDtcblxuLy8gb2JqZWN0TWF0cml4ICogdmlld01hdHJpeCA9IHdvcmxkTWF0cml4XG51bmlmb3JtIG1hdDQgd29ybGRNYXRyaXg7XG51bmlmb3JtIG1hdDQgd29ybGRJbnZlcnNlTWF0cml4O1xudW5pZm9ybSBtYXQ0IHdvcmxkSW52ZXJzZVRyYW5zcG9zZU1hdHJpeDtcbnVuaWZvcm0gbWF0NCBvYmplY3RNYXRyaXg7XG51bmlmb3JtIHZlYzMgY2FtZXJhUG9zaXRpb247XG5cbi8vIGxpZ2h0aW5nIGNvbmZpZ3VyYXRpb25cbnVuaWZvcm0gYm9vbCBlbmFibGVMaWdodHM7XG51bmlmb3JtIHZlYzMgYW1iaWVudENvbG9yO1xudW5pZm9ybSB2ZWMzIGRpcmVjdGlvbmFsQ29sb3I7XG51bmlmb3JtIHZlYzMgbGlnaHRpbmdEaXJlY3Rpb247XG5cbi8vIHBvaW50IGxpZ2h0cyBjb25maWd1cmF0aW9uXG51bmlmb3JtIHZlYzMgcG9pbnRMb2NhdGlvbltMSUdIVF9NQVhdO1xudW5pZm9ybSB2ZWMzIHBvaW50Q29sb3JbTElHSFRfTUFYXTtcbnVuaWZvcm0gaW50IG51bWJlclBvaW50cztcblxuLy8gcmVmbGVjdGlvbiAvIHJlZnJhY3Rpb24gY29uZmlndXJhdGlvblxudW5pZm9ybSBib29sIHVzZVJlZmxlY3Rpb247XG5cbi8vIHZhcnlpbmdzXG52YXJ5aW5nIHZlYzMgdlJlZmxlY3Rpb247XG52YXJ5aW5nIHZlYzQgdkNvbG9yO1xudmFyeWluZyB2ZWM0IHZQaWNraW5nQ29sb3I7XG52YXJ5aW5nIHZlYzIgdlRleENvb3JkO1xudmFyeWluZyB2ZWM0IHZOb3JtYWw7XG52YXJ5aW5nIHZlYzMgbGlnaHRXZWlnaHRpbmc7XG5cbnZvaWQgbWFpbih2b2lkKSB7XG4gIHZlYzQgbXZQb3NpdGlvbiA9IHdvcmxkTWF0cml4ICogdmVjNChwb3NpdGlvbiwgMS4wKTtcbiAgdmVjNCB0cmFuc2Zvcm1lZE5vcm1hbCA9IHdvcmxkSW52ZXJzZVRyYW5zcG9zZU1hdHJpeCAqIHZlYzQobm9ybWFsLCAxLjApO1xuXG4gIC8vIGxpZ2h0aW5nIGNvZGVcbiAgaWYoIWVuYWJsZUxpZ2h0cykge1xuICAgIGxpZ2h0V2VpZ2h0aW5nID0gdmVjMygxLjAsIDEuMCwgMS4wKTtcbiAgfSBlbHNlIHtcbiAgICB2ZWMzIHBsaWdodERpcmVjdGlvbjtcbiAgICB2ZWMzIHBvaW50V2VpZ2h0ID0gdmVjMygwLjAsIDAuMCwgMC4wKTtcbiAgICBmbG9hdCBkaXJlY3Rpb25hbExpZ2h0V2VpZ2h0aW5nID1cbiAgICAgIG1heChkb3QodHJhbnNmb3JtZWROb3JtYWwueHl6LCBsaWdodGluZ0RpcmVjdGlvbiksIDAuMCk7XG4gICAgZm9yIChpbnQgaSA9IDA7IGkgPCBMSUdIVF9NQVg7IGkrKykge1xuICAgICAgaWYgKGkgPCBudW1iZXJQb2ludHMpIHtcbiAgICAgICAgcGxpZ2h0RGlyZWN0aW9uID0gbm9ybWFsaXplKFxuICAgICAgICAgICh2aWV3TWF0cml4ICogdmVjNChwb2ludExvY2F0aW9uW2ldLCAxLjApKS54eXogLSBtdlBvc2l0aW9uLnh5eik7XG4gICAgICAgICBwb2ludFdlaWdodCArPSBtYXgoXG4gICAgICAgICAgZG90KHRyYW5zZm9ybWVkTm9ybWFsLnh5eiwgcGxpZ2h0RGlyZWN0aW9uKSwgMC4wKSAqIHBvaW50Q29sb3JbaV07XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGJyZWFrO1xuICAgICAgIH1cbiAgICAgfVxuXG4gICAgbGlnaHRXZWlnaHRpbmcgPSBhbWJpZW50Q29sb3IgK1xuICAgICAgKGRpcmVjdGlvbmFsQ29sb3IgKiBkaXJlY3Rpb25hbExpZ2h0V2VpZ2h0aW5nKSArIHBvaW50V2VpZ2h0O1xuICB9XG5cbiAgLy8gcmVmcmFjdGlvbiAvIHJlZmxlY3Rpb24gY29kZVxuICBpZiAodXNlUmVmbGVjdGlvbikge1xuICAgIHZSZWZsZWN0aW9uID1cbiAgICAgICh2aWV3SW52ZXJzZU1hdHJpeFszXSAtICh3b3JsZE1hdHJpeCAqIHZlYzQocG9zaXRpb24sIDEuMCkpKS54eXo7XG4gIH0gZWxzZSB7XG4gICAgdlJlZmxlY3Rpb24gPSB2ZWMzKDEuMCwgMS4wLCAxLjApO1xuICB9XG5cbiAgLy8gcGFzcyByZXN1bHRzIHRvIHZhcnlpbmdzXG4gIHZDb2xvciA9IGNvbG9yO1xuICB2UGlja2luZ0NvbG9yID0gcGlja2luZ0NvbG9yO1xuICB2VGV4Q29vcmQgPSB0ZXhDb29yZDE7XG4gIHZOb3JtYWwgPSB0cmFuc2Zvcm1lZE5vcm1hbDtcbiAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uTWF0cml4ICogd29ybGRNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjApO1xufVxuYDtcblxuU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0ID0gYFxuXG4jaWZkZWYgR0xfRVNcbnByZWNpc2lvbiBoaWdocCBmbG9hdDtcbiNlbmRpZlxuXG4vLyB2YXJ5aW5nc1xudmFyeWluZyB2ZWM0IHZDb2xvcjtcbnZhcnlpbmcgdmVjNCB2UGlja2luZ0NvbG9yO1xudmFyeWluZyB2ZWMyIHZUZXhDb29yZDtcbnZhcnlpbmcgdmVjMyBsaWdodFdlaWdodGluZztcbnZhcnlpbmcgdmVjMyB2UmVmbGVjdGlvbjtcbnZhcnlpbmcgdmVjNCB2Tm9ybWFsO1xuXG4vLyB0ZXh0dXJlIGNvbmZpZ3NcbnVuaWZvcm0gYm9vbCBoYXNUZXh0dXJlMTtcbnVuaWZvcm0gc2FtcGxlcjJEIHNhbXBsZXIxO1xudW5pZm9ybSBib29sIGhhc1RleHR1cmVDdWJlMTtcbnVuaWZvcm0gc2FtcGxlckN1YmUgc2FtcGxlckN1YmUxO1xuXG4vLyBwaWNraW5nIGNvbmZpZ3NcbnVuaWZvcm0gYm9vbCBlbmFibGVQaWNraW5nO1xudW5pZm9ybSBib29sIGhhc1BpY2tpbmdDb2xvcnM7XG51bmlmb3JtIHZlYzMgcGlja0NvbG9yO1xuXG4vLyByZWZsZWN0aW9uIC8gcmVmcmFjdGlvbiBjb25maWdzXG51bmlmb3JtIGZsb2F0IHJlZmxlY3Rpb247XG51bmlmb3JtIGZsb2F0IHJlZnJhY3Rpb247XG5cbi8vIGZvZyBjb25maWd1cmF0aW9uXG51bmlmb3JtIGJvb2wgaGFzRm9nO1xudW5pZm9ybSB2ZWMzIGZvZ0NvbG9yO1xudW5pZm9ybSBmbG9hdCBmb2dOZWFyO1xudW5pZm9ybSBmbG9hdCBmb2dGYXI7XG5cbnZvaWQgbWFpbigpe1xuICAvLyBzZXQgY29sb3IgZnJvbSB0ZXh0dXJlXG4gIGlmICghaGFzVGV4dHVyZTEpIHtcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHZDb2xvci5yZ2IgKiBsaWdodFdlaWdodGluZywgdkNvbG9yLmEpO1xuICB9IGVsc2Uge1xuICAgIGdsX0ZyYWdDb2xvciA9XG4gICAgICB2ZWM0KHRleHR1cmUyRChzYW1wbGVyMSwgdmVjMih2VGV4Q29vcmQucywgdlRleENvb3JkLnQpKS5yZ2IgKlxuICAgICAgbGlnaHRXZWlnaHRpbmcsIDEuMCk7XG4gIH1cblxuICAvLyBoYXMgY3ViZSB0ZXh0dXJlIHRoZW4gYXBwbHkgcmVmbGVjdGlvblxuICBpZiAoaGFzVGV4dHVyZUN1YmUxKSB7XG4gICAgdmVjMyBuUmVmbGVjdGlvbiA9IG5vcm1hbGl6ZSh2UmVmbGVjdGlvbik7XG4gICAgdmVjMyByZWZsZWN0aW9uVmFsdWU7XG4gICAgaWYgKHJlZnJhY3Rpb24gPiAwLjApIHtcbiAgICAgcmVmbGVjdGlvblZhbHVlID0gcmVmcmFjdChuUmVmbGVjdGlvbiwgdk5vcm1hbC54eXosIHJlZnJhY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgIHJlZmxlY3Rpb25WYWx1ZSA9IC1yZWZsZWN0KG5SZWZsZWN0aW9uLCB2Tm9ybWFsLnh5eik7XG4gICAgfVxuXG4gICAgLy8gVE9ETyhuaWNvKTogY2hlY2sgd2hldGhlciB0aGlzIGlzIHJpZ2h0LlxuICAgIHZlYzQgY3ViZUNvbG9yID0gdGV4dHVyZUN1YmUoc2FtcGxlckN1YmUxLFxuICAgICAgICB2ZWMzKC1yZWZsZWN0aW9uVmFsdWUueCwgLXJlZmxlY3Rpb25WYWx1ZS55LCByZWZsZWN0aW9uVmFsdWUueikpO1xuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQobWl4KGdsX0ZyYWdDb2xvci54eXosIGN1YmVDb2xvci54eXosIHJlZmxlY3Rpb24pLCAxLjApO1xuICB9XG5cbiAgLy8gc2V0IHBpY2tpbmdcbiAgaWYgKGVuYWJsZVBpY2tpbmcpIHtcbiAgICBpZiAoaGFzUGlja2luZ0NvbG9ycykge1xuICAgICAgZ2xfRnJhZ0NvbG9yID0gdlBpY2tpbmdDb2xvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNChwaWNrQ29sb3IsIDEuMCk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIGZvZ1xuICBpZiAoaGFzRm9nKSB7XG4gICAgZmxvYXQgZGVwdGggPSBnbF9GcmFnQ29vcmQueiAvIGdsX0ZyYWdDb29yZC53O1xuICAgIGZsb2F0IGZvZ0ZhY3RvciA9IHNtb290aHN0ZXAoZm9nTmVhciwgZm9nRmFyLCBkZXB0aCk7XG4gICAgZ2xfRnJhZ0NvbG9yID1cbiAgICAgIG1peChnbF9GcmFnQ29sb3IsIHZlYzQoZm9nQ29sb3IsIGdsX0ZyYWdDb2xvci53KSwgZm9nRmFjdG9yKTtcbiAgIH1cbiB9XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBTaGFkZXJzO1xuIiwiLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5cbi8qKlxuICogV3JhcHMgdGhlIGFyZ3VtZW50IGluIGFuIGFycmF5IGlmIGl0IGlzIG5vdCBvbmUuXG4gKiBAcGFyYW0ge29iamVjdH0gYSAtIFRoZSBvYmplY3QgdG8gd3JhcC5cbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwbGF0KGEpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSkgJiYgYSB8fCBbYV07XG59XG5cbi8qKlxuKiBQcm92aWRlcyBhIHN0YW5kYXJkIG5vb3AgZnVuY3Rpb24uXG4qKi9cbmV4cG9ydCBmdW5jdGlvbiBub29wKCkge31cblxudmFyIF91aWQgPSBEYXRlLm5vdygpO1xuXG4vKipcbiAqIFJldHVybnMgYSBVSUQuXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHVpZFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHVpZCgpIHtcbiAgcmV0dXJuIF91aWQrKztcbn1cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBvYmplY3RzIGludG8gb25lLlxuICogQHBhcmFtIHsuLi5vYmplY3R9IG9iamVjdHMgLSBUaGUgb2JqZWN0cyB0byBtZXJnZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2Uob2JqZWN0cykge1xuICBjb25zdCBtaXggPSB7fTtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gYXJndW1lbnRzW2ldO1xuICAgIGlmIChvYmplY3QuY29uc3RydWN0b3IubmFtZSAhPT0gJ09iamVjdCcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBjb25zdCBvcCA9IG9iamVjdFtrZXldO1xuICAgICAgY29uc3QgbXAgPSBtaXhba2V5XTtcbiAgICAgIGlmIChtcCAmJiBvcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JyAmJlxuICAgICAgICBtcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0Jykge1xuICAgICAgICBtaXhba2V5XSA9IG1lcmdlKG1wLCBvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtaXhba2V5XSA9IGRldGFjaChvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtaXg7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGR1cGxpY2F0aW5nIGFuIG9iamVjdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtIC0gVGhlIG9iamVjdCB0byByZWN1cnNpdmVseSBkdXBsaWNhdGUuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZnVuY3Rpb24gZGV0YWNoKGVsZW0pIHtcbiAgY29uc3QgdCA9IGVsZW0uY29uc3RydWN0b3IubmFtZTtcbiAgbGV0IGFucztcbiAgaWYgKHQgPT09ICdPYmplY3QnKSB7XG4gICAgYW5zID0ge307XG4gICAgZm9yICh2YXIgcCBpbiBlbGVtKSB7XG4gICAgICBhbnNbcF0gPSBkZXRhY2goZWxlbVtwXSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHQgPT09ICdBcnJheScpIHtcbiAgICBhbnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVsZW0ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBhbnNbaV0gPSBkZXRhY2goZWxlbVtpXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGFucyA9IGVsZW07XG4gIH1cblxuICByZXR1cm4gYW5zO1xufVxuIiwiLy8gRW5jYXBzdWxhdGVzIGEgV2ViR0xCdWZmZXIgb2JqZWN0XG5cbmltcG9ydCB7Z2V0RXh0ZW5zaW9uLCBnbENoZWNrRXJyb3J9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1ZmZlciB7XG5cbiAgc3RhdGljIGdldERlZmF1bHRPcHRzKGdsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1ZmZlclR5cGU6IGdsLkFSUkFZX0JVRkZFUixcbiAgICAgIHNpemU6IDEsXG4gICAgICBkYXRhVHlwZTogZ2wuRkxPQVQsXG4gICAgICBzdHJpZGU6IDAsXG4gICAgICBvZmZzZXQ6IDAsXG4gICAgICBkcmF3TW9kZTogZ2wuU1RBVElDX0RSQVcsXG4gICAgICBpbnN0YW5jZWQ6IDBcbiAgICB9O1xuICB9XG5cbiAgLypcbiAgICogQGNsYXNzZGVzY1xuICAgKiBTZXQgdXAgYSBnbCBidWZmZXIgb25jZSBhbmQgcmVwZWF0ZWRseSBiaW5kIGFuZCB1bmJpbmQgaXQuXG4gICAqIEhvbGRzIGFuIGF0dHJpYnV0ZSBuYW1lIGFzIGEgY29udmVuaWVuY2UuLi5cbiAgICpcbiAgICogQHBhcmFte30gb3B0cy5kYXRhIC0gbmF0aXZlIGFycmF5XG4gICAqIEBwYXJhbXtzdHJpbmd9IG9wdHMuYXR0cmlidXRlIC0gbmFtZSBvZiBhdHRyaWJ1dGUgZm9yIG1hdGNoaW5nXG4gICAqIEBwYXJhbXt9IG9wdHMuYnVmZmVyVHlwZSAtIGJ1ZmZlciB0eXBlIChjYWxsZWQgXCJ0YXJnZXRcIiBpbiBHTCBkb2NzKVxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBhc3NlcnQoZ2wsICdCdWZmZXIgbmVlZHMgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgQnVmZmVyLmdldERlZmF1bHRPcHRzKGdsKSwgb3B0cyk7XG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHRvZG8gLSByZW1vdmVcbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRlbGV0ZSgpO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgdXBkYXRlKG9wdHMgPSB7fSkge1xuICAgIHRoaXMuYXR0cmlidXRlID0gb3B0cy5hdHRyaWJ1dGUgfHwgdGhpcy5hdHRyaWJ1dGU7XG4gICAgdGhpcy5idWZmZXJUeXBlID0gb3B0cy5idWZmZXJUeXBlIHx8IHRoaXMuYnVmZmVyVHlwZTtcbiAgICB0aGlzLnNpemUgPSBvcHRzLnNpemUgfHwgdGhpcy5zaXplO1xuICAgIHRoaXMuZGF0YVR5cGUgPSBvcHRzLmRhdGFUeXBlIHx8IHRoaXMuZGF0YVR5cGU7XG4gICAgdGhpcy5zdHJpZGUgPSBvcHRzLnN0cmlkZSB8fCB0aGlzLnN0cmlkZTtcbiAgICB0aGlzLm9mZnNldCA9IG9wdHMub2Zmc2V0IHx8IHRoaXMub2Zmc2V0O1xuICAgIHRoaXMuZHJhd01vZGUgPSBvcHRzLmRyYXdNb2RlIHx8IHRoaXMuZHJhd01vZGU7XG4gICAgdGhpcy5pbnN0YW5jZWQgPSBvcHRzLmluc3RhbmNlZCB8fCB0aGlzLmluc3RhbmNlZDtcblxuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YSB8fCB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmJ1ZmZlckRhdGEodGhpcy5kYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiBVcGRhdGVzIGRhdGEgaW4gdGhlIGJ1ZmZlciAqL1xuICBidWZmZXJEYXRhKGRhdGEpIHtcbiAgICBhc3NlcnQoZGF0YSwgJ0J1ZmZlci5idWZmZXJEYXRhIG5lZWRzIGRhdGEnKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5idWZmZXJUeXBlLCB0aGlzLmRhdGEsIHRoaXMuZHJhd01vZGUpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIC8vIEJpbmQgdGhlIGJ1ZmZlciBzbyB0aGF0IHdlIGNhbiBvcGVyYXRlIG9uIGl0XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIEVuYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFNwZWNpZnkgYnVmZmVyIGZvcm1hdFxuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoXG4gICAgICBsb2NhdGlvbixcbiAgICAgIHRoaXMuc2l6ZSwgdGhpcy5kYXRhVHlwZSwgZmFsc2UsIHRoaXMuc3RyaWRlLCB0aGlzLm9mZnNldFxuICAgICk7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2VkKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZ2wsICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgICAvLyBUaGlzIG1ha2VzIGl0IGFuIGluc3RhbmNlZCBhdHRyaWJ1dGVcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gQ2xlYXIgaW5zdGFuY2VkIGZsYWdcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDApO1xuICAgIH1cbiAgICAvLyBEaXNhYmxlIHRoZSBhdHRyaWJ1dGVcbiAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFVuYmluZCB0aGUgYnVmZmVyIHBlciB3ZWJnbCByZWNvbW1lbmRhdGlvbnNcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiIsIi8vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCByZWxhdGVkIG1ldGhvZHNcbi8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCwgbm8tY29uc29sZSwgbm8tbG9vcC1mdW5jICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgY29uc29sZSAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBDaGVja3MgaWYgV2ViR0wgaXMgZW5hYmxlZCBhbmQgY3JlYXRlcyBhIGNvbnRleHQgZm9yIHVzaW5nIFdlYkdMLlxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdMQ29udGV4dChjYW52YXMsIG9wdCA9IHt9KSB7XG4gIGlmICghaXNCcm93c2VyQ29udGV4dCgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBjcmVhdGUgYSBXZWJHTCBjb250ZXh0IG91dHNpZGUgYSBicm93c2VyIGNvbnRleHQuYCk7XG4gIH1cbiAgY2FudmFzID0gdHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycgP1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcykgOiBjYW52YXM7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmdsY29udGV4dGNyZWF0aW9uZXJyb3InLCBlID0+IHtcbiAgICBjb25zb2xlLmxvZyhlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgfSwgZmFsc2UpO1xuXG4gIC8vIFByZWZlciB3ZWJnbDIgb3ZlciB3ZWJnbDEsIHByZWZlciBjb25mb3JtYW50IG92ZXIgZXhwZXJpbWVudGFsXG4gIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbDInLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBvcHQpO1xuXG4gIGFzc2VydChnbCwgJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG5cbiAgLy8gU2V0IGFzIGRlYnVnIGhhbmRsZXJcbiAgZ2wgPSBvcHQuZGVidWcgPyBjcmVhdGVEZWJ1Z0NvbnRleHQoZ2wpIDogZ2w7XG5cbiAgLy8gQWRkIGEgc2FmZSBnZXQgbWV0aG9kXG4gIGdsLmdldCA9IGZ1bmN0aW9uIGdsR2V0KG5hbWUpIHtcbiAgICBsZXQgdmFsdWUgPSBuYW1lO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICAgIGFzc2VydCh2YWx1ZSwgYEFjY2Vzc2luZyBnbC4ke25hbWV9YCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICByZXR1cm4gZ2w7XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1dlYkdMKCkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBGZWF0dXJlIHRlc3QgV2ViR0xcbiAgdHJ5IHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICByZXR1cm4gQm9vbGVhbih3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0ICYmXG4gICAgICAoY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpKSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNFeHRlbnNpb24obmFtZSkge1xuICBpZiAoIWhhc1dlYkdMKCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fFxuICAgIGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcbiAgLy8gU2hvdWxkIG1heWJlIGJlIHJldHVybiAhIWNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuICByZXR1cm4gY29udGV4dC5nZXRFeHRlbnNpb24obmFtZSk7XG59XG5cbi8vIFJldHVybnMgdGhlIGV4dGVuc2lvbiBvciB0aHJvd3MgYW4gZXJyb3JcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpIHtcbiAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpO1xuICBhc3NlcnQoZXh0ZW5zaW9uLCBgJHtleHRlbnNpb25OYW1lfSBub3Qgc3VwcG9ydGVkIWApO1xuICByZXR1cm4gZXh0ZW5zaW9uO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJDb250ZXh0KCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lQnVmZmVyfSwgZnVuYykge1xuICBsZXQgc2Npc3NvclRlc3RXYXNFbmFibGVkO1xuICBpZiAoc2Npc3NvclRlc3QpIHtcbiAgICBzY2lzc29yVGVzdFdhc0VuYWJsZWQgPSBnbC5pc0VuYWJsZWQoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBjb25zdCB7eCwgeSwgdywgaH0gPSBzY2lzc29yVGVzdDtcbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIHksIHcsIGgpO1xuICB9XG5cbiAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyIHdlIG5lZWQgdG8gcmVtZW1iZXI/XG4gICAgZnJhbWVCdWZmZXIuYmluZCgpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBmdW5jKGdsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIXNjaXNzb3JUZXN0V2FzRW5hYmxlZCkge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlcj9cbiAgICAgIC8vIFRPRE8gLSBkZWxlZ2F0ZSBcInVuYmluZFwiIHRvIEZyYW1lYnVmZmVyIG9iamVjdD9cbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbENoZWNrRXJyb3IyKGdsKSB7XG4gIGdsQ2hlY2tFcnJvcihnbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbENoZWNrRXJyb3IoZ2wpIHtcbiAgY29uc3QgZXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICBzd2l0Y2ggKGVycm9yKSB7XG4gIGNhc2UgZ2wuTk9fRVJST1I6XG4gICAgLy8gIE5vIGVycm9yIGhhcyBiZWVuIHJlY29yZGVkLiBUaGUgdmFsdWUgb2YgdGhpcyBjb25zdGFudCBpcyAwLlxuICAgIHJldHVybjtcblxuICBjYXNlIGdsLkNPTlRFWFRfTE9TVF9XRUJHTDpcbiAgICAvLyAgSWYgdGhlIFdlYkdMIGNvbnRleHQgaXMgbG9zdCwgdGhpcyBlcnJvciBpcyByZXR1cm5lZCBvbiB0aGVcbiAgICAvLyBmaXJzdCBjYWxsIHRvIGdldEVycm9yLiBBZnRlcndhcmRzIGFuZCB1bnRpbCB0aGUgY29udGV4dCBoYXMgYmVlblxuICAgIC8vIHJlc3RvcmVkLCBpdCByZXR1cm5zIGdsLk5PX0VSUk9SLlxuICAgIHRocm93IG5ldyBFcnJvcignV2ViR0wgY29udGV4dCBsb3N0Jyk7XG5cbiAgY2FzZSBnbC5JTlZBTElEX0VOVU06XG4gICAgLy8gQW4gdW5hY2NlcHRhYmxlIHZhbHVlIGhhcyBiZWVuIHNwZWNpZmllZCBmb3IgYW4gZW51bWVyYXRlZCBhcmd1bWVudC5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYkdMIGludmFsaWQgZW51bWVyYXRlZCBhcmd1bWVudCcpO1xuXG4gIGNhc2UgZ2wuSU5WQUxJRF9WQUxVRTpcbiAgICAvLyBBIG51bWVyaWMgYXJndW1lbnQgaXMgb3V0IG9mIHJhbmdlLlxuICAgIHRocm93IG5ldyBFcnJvcignV2ViR0wgaW52YWxpZCB2YWx1ZScpO1xuXG4gIGNhc2UgZ2wuSU5WQUxJRF9PUEVSQVRJT046XG4gICAgLy8gVGhlIHNwZWNpZmllZCBjb21tYW5kIGlzIG5vdCBhbGxvd2VkIGZvciB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYkdMIGludmFsaWQgb3BlcmF0aW9uJyk7XG5cbiAgY2FzZSBnbC5JTlZBTElEX0ZSQU1FQlVGRkVSX09QRVJBVElPTjpcbiAgICAvLyBUaGUgY3VycmVudGx5IGJvdW5kIGZyYW1lYnVmZmVyIGlzIG5vdCBmcmFtZWJ1ZmZlciBjb21wbGV0ZVxuICAgIC8vIHdoZW4gdHJ5aW5nIHRvIHJlbmRlciB0byBvciB0byByZWFkIGZyb20gaXQuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdXZWJHTCBpbnZhbGlkIGZyYW1lYnVmZmVyIG9wZXJhdGlvbicpO1xuXG4gIGNhc2UgZ2wuT1VUX09GX01FTU9SWTpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdXZWJHTCBvdXQgb2YgbWVtb3J5Jyk7XG5cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdXZWJHTCB1bmtub3duIGVycm9yJyk7XG4gIH1cbn1cblxuLy8gVE9ETyAtIGRvY3VtZW50IG9yIHJlbW92ZVxuZnVuY3Rpb24gY3JlYXRlRGVidWdDb250ZXh0KGN0eCkge1xuICBjb25zdCBnbCA9IHt9O1xuICBmb3IgKHZhciBtIGluIGN0eCkge1xuICAgIHZhciBmID0gY3R4W21dO1xuICAgIGlmICh0eXBlb2YgZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZ2xbbV0gPSAoKGssIHYpID0+IHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuam9pbi5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBsZXQgYW5zO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhbnMgPSB2LmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7a30gJHtlfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBlcnJvclN0YWNrID0gW107XG4gICAgICAgICAgbGV0IGVycm9yO1xuICAgICAgICAgIHdoaWxlICgoZXJyb3IgPSBjdHguZ2V0RXJyb3IoKSkgIT09IGN0eC5OT19FUlJPUikge1xuICAgICAgICAgICAgZXJyb3JTdGFjay5wdXNoKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVycm9yU3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvclN0YWNrLmpvaW4oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFucztcbiAgICAgICAgfTtcbiAgICAgIH0pKG0sIGYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbFttXSA9IGY7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGdsO1xufVxuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cbi8vIFRPRE8gLSBnZW5lcmljIGRyYXcgY2FsbFxuLy8gT25lIG9mIHRoZSBnb29kIHRoaW5ncyBhYm91dCBHTCBpcyB0aGF0IHRoZXJlIGFyZSBzbyBtYW55IHdheXMgdG8gZHJhdyB0aGluZ3NcbmltcG9ydCB7Z2V0RXh0ZW5zaW9ufSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHtHTF9JTkRFWF9UWVBFUywgR0xfRFJBV19NT0RFU30gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIEEgZ29vZCB0aGluZyBhYm91dCB3ZWJHTCBpcyB0aGF0IHRoZXJlIGFyZSBzbyBtYW55IHdheXMgdG8gZHJhdyB0aGluZ3MuLi5cbi8vIFRPRE8gLSBVc2UgcG9seWZpbGxlZCBXZWJHTDIgbWV0aG9kcyBpbnN0ZWFkIG9mIEFOR0xFIGV4dGVuc2lvblxuZXhwb3J0IGZ1bmN0aW9uIGRyYXcoZ2wsIHtcbiAgZHJhd01vZGUsIHZlcnRleENvdW50LCBvZmZzZXQgPSAwLFxuICBpbmRleGVkLCBpbmRleFR5cGUgPSBudWxsLFxuICBpbnN0YW5jZWQgPSBmYWxzZSwgaW5zdGFuY2VDb3VudCA9IDBcbn0pIHtcbiAgZHJhd01vZGUgPSBnbC5nZXQoZHJhd01vZGUpO1xuICBpbmRleFR5cGUgPSBnbC5nZXQoaW5kZXhUeXBlKSB8fCBnbC5VTlNJR05FRF9TSE9SVDtcblxuICBhc3NlcnQoR0xfRFJBV19NT0RFUyhnbCkuaW5kZXhPZihkcmF3TW9kZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICBpZiAoaW5zdGFuY2VkKSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3RWxlbWVudHNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGluZGV4ZWQpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCk7XG4gIH1cbn1cblxuLy8gQ2FsbCB0aGUgcHJvcGVyIGRyYXcgZnVuY3Rpb24gZm9yIHRoZSB1c2VkIHByb2dyYW0gYmFzZWQgb24gYXR0cmlidXRlcyBldGNcbmV4cG9ydCBmdW5jdGlvbiBkcmF3Mih7Z2wsIGRyYXdNb2RlLCBlbGVtZW50VHlwZSwgY291bnQsXG4gIGluZGljZXMsIHZlcnRpY2VzLCBpbnN0YW5jZWQsIG51bUluc3RhbmNlc30pIHtcbiAgY29uc3QgbnVtSW5kaWNlcyA9IGluZGljZXMgPyBpbmRpY2VzLnZhbHVlLmxlbmd0aCA6IDA7XG4gIGNvbnN0IG51bVZlcnRpY2VzID0gdmVydGljZXMgPyB2ZXJ0aWNlcy52YWx1ZS5sZW5ndGggLyAzIDogMDtcbiAgY291bnQgPSBjb3VudCB8fCBudW1JbmRpY2VzIHx8IG51bVZlcnRpY2VzO1xuICByZXR1cm4gZHJhdyh7Z2wsIGRyYXdNb2RlLCBlbGVtZW50VHlwZSwgY291bnQsIH0pO1xufVxuXG4vLyBDYWxsIHRoZSBwcm9wZXIgZHJhdyBmdW5jdGlvbiBmb3IgdGhlIHVzZWQgcHJvZ3JhbSBiYXNlZCBvbiBhdHRyaWJ1dGVzIGV0Y1xuZXhwb3J0IGZ1bmN0aW9uIGRyYXczKHtnbCwgZHJhd01vZGUsIGluZGV4VHlwZSwgbnVtUG9pbnRzLCBudW1JbnN0YW5jZXN9KSB7XG4gIGRyYXdNb2RlID0gZHJhd01vZGUgfHwgZ2wuUE9JTlRTO1xuXG4gIGFzc2VydChHTF9EUkFXX01PREVTKGdsKS5pbmRleE9mKGluZGV4VHlwZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICBpZiAobnVtSW5zdGFuY2VzKSB7XG4gICAgLy8gdGhpcyBpbnN0YW5jZWQgcHJpbWl0aXZlIGRvZXMgaGFzIGluZGljZXMsIHVzZSBkcmF3RWxlbWVudHMgZXh0ZW5zaW9uXG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgZXh0ZW5zaW9uLmRyYXdFbGVtZW50c0luc3RhbmNlZEFOR0xFKFxuICAgICAgZHJhd01vZGUsIG51bVBvaW50cywgaW5kZXhUeXBlLCAwLCBudW1JbnN0YW5jZXNcbiAgICApO1xuICB9IGVsc2UgaWYgKGluZGljZXMpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIG51bUluZGljZXMsIGluZGV4VHlwZSwgMCk7XG4gIH0gZWxzZSBpZiAobnVtSW5zdGFuY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyB0aGlzIGluc3RhbmNlZCBwcmltaXRpdmUgZG9lcyBub3QgaGF2ZSBpbmRpY2VzLCB1c2UgZHJhd0FycmF5cyBleHRcbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICBleHRlbnNpb24uZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKFxuICAgICAgZHJhd01vZGUsIDAsIG51bVBvaW50cywgbnVtSW5zdGFuY2VzXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBlbHNlIGlmIHRoaXMucHJpbWl0aXZlIGRvZXMgbm90IGhhdmUgaW5kaWNlc1xuICAgIGdsLmRyYXdBcnJheXMoZHJhd01vZGUsIDAsIG51bVBvaW50cyk7XG4gIH1cbn1cbiIsIlxuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vdGV4dHVyZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZyYW1lYnVmZmVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGggPyBvcHRzLndpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0ID8gb3B0cy5oZWlnaHQgOiAxO1xuICAgIHRoaXMuZGVwdGggPSBvcHRzLmRlcHRoID09PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0cy5kZXB0aDtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG9wdHMubWluRmlsdGVyIHx8IGdsLk5FQVJFU1Q7XG4gICAgdGhpcy5tYWdGaWx0ZXIgPSBvcHRzLm1hZ0ZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQgfHwgZ2wuUkdCQTtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGUgfHwgZ2wuVU5TSUdORURfQllURTtcbiAgICB0aGlzLmZibyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgdGhpcy5iaW5kKCk7XG5cbiAgICB0aGlzLnRleHR1cmUgPSBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBtaW5GaWx0ZXI6IHRoaXMubWluRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiB0aGlzLm1hZ0ZpbHRlcixcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXRcbiAgICB9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlLnRleHR1cmUsIDBcbiAgICApO1xuXG4gICAgaWYgKHRoaXMuZGVwdGgpIHtcbiAgICAgIHRoaXMuZGVwdGggPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoXG4gICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0XG4gICAgICApO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoXG4gICAgICAgIGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIHRoaXMuZGVwdGhcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuICAgIGlmIChzdGF0dXMgIT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZyYW1lYnVmZmVyIGNyZWF0aW9uIGZhaWxlZC4nKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZibyk7XG4gIH1cblxufVxuIiwiLy8gQ29udGFpbnMgY2xhc3MgYW5kIGZ1bmN0aW9uIHdyYXBwZXJzIGFyb3VuZCBsb3cgbGV2ZWwgd2ViZ2wgb2JqZWN0c1xuLy8gVGhlc2UgY2xhc3NlcyBhcmUgaW50ZW5kZWQgdG8gc3RheSBjbG9zZSB0byB0aGUgV2ViR0wgQVBJIHNlbWFudGljc1xuLy8gYnV0IG1ha2UgaXQgZWFzaWVyIHRvIHVzZS5cbi8vIEhpZ2hlciBsZXZlbCBhYnN0cmFjdGlvbnMgY2FuIGJlIGJ1aWx0IG9uIHRoZXNlIGNsYXNzZXNcbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9jb250ZXh0JztcbmV4cG9ydCAqIGZyb20gJy4vZHJhdyc7XG5leHBvcnQge2RlZmF1bHQgYXMgQnVmZmVyfSBmcm9tICcuL2J1ZmZlcic7XG5leHBvcnQge2RlZmF1bHQgYXMgUHJvZ3JhbX0gZnJvbSAnLi9wcm9ncmFtJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBGcmFtZWJ1ZmZlcn0gZnJvbSAnLi9mYm8nO1xuZXhwb3J0IHtUZXh0dXJlMkQsIFRleHR1cmVDdWJlfSBmcm9tICcuL3RleHR1cmUnO1xuIiwiLy8gQ3JlYXRlcyBwcm9ncmFtcyBvdXQgb2Ygc2hhZGVycyBhbmQgcHJvdmlkZXMgY29udmVuaWVudCBtZXRob2RzIGZvciBsb2FkaW5nXG4vLyBidWZmZXJzIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGNvbnNvbGUgKi9cbmltcG9ydCB7Z2xDaGVja0Vycm9yMn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge1ZlcnRleFNoYWRlciwgRnJhZ21lbnRTaGFkZXJ9IGZyb20gJy4vc2hhZGVyJztcbmltcG9ydCBTaGFkZXJzIGZyb20gJy4uL3NoYWRlcnMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9ncmFtIHtcblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIEhhbmRsZXMgY3JlYXRpb24gb2YgcHJvZ3JhbXMsIG1hcHBpbmcgb2YgYXR0cmlidXRlcyBhbmQgdW5pZm9ybXNcbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGdsIGNvbnRleHRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnZzIC0gVmVydGV4IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZnMgLSBGcmFnbWVudCBzaGFkZXIgc291cmNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmlkPSAtIElkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cywgZnMsIGlkKSB7XG4gICAgbGV0IHZzO1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUud2FybignREVQUkVDQVRFRDogTmV3IHVzZTogUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KScpO1xuICAgICAgdnMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cyA9IG9wdHMudnM7XG4gICAgICBmcyA9IG9wdHMuZnM7XG4gICAgICBpZCA9IG9wdHMuaWQ7XG4gICAgfVxuXG4gICAgdnMgPSB2cyB8fCBTaGFkZXJzLlZlcnRleC5EZWZhdWx0O1xuICAgIGZzID0gZnMgfHwgU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBWZXJ0ZXhTaGFkZXIoZ2wsIHZzKS5oYW5kbGUpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgRnJhZ21lbnRTaGFkZXIoZ2wsIGZzKS5oYW5kbGUpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGNvbnN0IGxpbmtlZCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgIGlmICghbGlua2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGxpbmtpbmcgJHtnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gcHJlcGFyZSB1bmlmb3JtIHNldHRlcnNcbiAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzID0gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIG5vIGF0dHJpYnV0ZXMgZW5hYmxlZCB5ZXRcbiAgICB0aGlzLmF0dHJpYnV0ZUVuYWJsZWQgPSB7fTtcbiAgfVxuXG4gIHVzZSgpIHtcbiAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmUodGV4dHVyZSwgaW5kZXgpIHtcbiAgICB0ZXh0dXJlLmJpbmQoaW5kZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybShuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXModW5pZm9ybU1hcCkpIHtcbiAgICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh1bmlmb3JtTWFwW25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1tidWZmZXIuYXR0cmlidXRlXTtcbiAgICBidWZmZXIuYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlci5hdHRyaWJ1dGVdO1xuICAgIGJ1ZmZlci5kZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy51bnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbi8vIFRPRE8gLSB1c2UgdGFibGVzIHRvIHJlZHVjZSBjb21wbGV4aXR5IG9mIG1ldGhvZCBiZWxvd1xuLy8gY29uc3QgZ2xVbmlmb3JtU2V0dGVyID0ge1xuLy8gICBGTE9BVDoge2Z1bmN0aW9uOiAndW5pZm9ybTFmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX1ZFQzM6IHtmdW5jdGlvbjogJ3VuaWZvcm0zZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBGTE9BVF9NQVQ0OiB7ZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4NGZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgSU5UOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBCT09MOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSXzJEOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSX0NVQkU6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX1cbi8vIH07XG5cbi8vIFJldHVybnMgYSBNYWdpYyBVbmlmb3JtIFNldHRlclxuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcihnbCwgZ2xQcm9ncmFtLCBpbmZvLCBpc0FycmF5KSB7XG4gIGNvbnN0IHtuYW1lLCB0eXBlfSA9IGluZm87XG4gIGNvbnN0IGxvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihnbFByb2dyYW0sIG5hbWUpO1xuXG4gIGxldCBtYXRyaXggPSBmYWxzZTtcbiAgbGV0IHZlY3RvciA9IHRydWU7XG4gIGxldCBnbEZ1bmN0aW9uO1xuICBsZXQgVHlwZWRBcnJheTtcblxuICBpZiAoaW5mby5zaXplID4gMSAmJiBpc0FycmF5KSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG5cbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuSU5UOlxuICAgIGNhc2UgZ2wuQk9PTDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfMkQ6XG4gICAgY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBVaW50MTZBcnJheTtcbiAgICAgIHZlY3RvciA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmlmb3JtOiBVbmtub3duIEdMU0wgdHlwZSAnICsgdHlwZSk7XG5cbiAgICB9XG4gIH1cblxuICBpZiAodmVjdG9yKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBnbC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVDogY2FzZSBnbC5CT09MOiBjYXNlIGdsLlNBTVBMRVJfMkQ6IGNhc2UgZ2wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzI6IGNhc2UgZ2wuQk9PTF9WRUMyOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0yaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMzogY2FzZSBnbC5CT09MX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUM0OiBjYXNlIGdsLkJPT0xfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGl2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMjpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDJmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMzpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDNmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBnbEZ1bmN0aW9uID0gZ2xGdW5jdGlvbi5iaW5kKGdsKTtcblxuICAvLyBTZXQgYSB1bmlmb3JtIGFycmF5XG4gIGlmIChpc0FycmF5ICYmIFR5cGVkQXJyYXkpIHtcblxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIG5ldyBUeXBlZEFycmF5KHZhbCkpO1xuICAgICAgZ2xDaGVja0Vycm9yMihnbCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChtYXRyaXgpIHtcbiAgICAvLyBTZXQgYSBtYXRyaXggdW5pZm9ybVxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIGZhbHNlLCB2YWwudG9GbG9hdDMyQXJyYXkoKSk7XG4gICAgICBnbENoZWNrRXJyb3IyKGdsKTtcbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoVHlwZWRBcnJheSkge1xuXG4gICAgLy8gU2V0IGEgdmVjdG9yL3R5cGVkIGFycmF5IHVuaWZvcm1cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIFR5cGVkQXJyYXkuc2V0KHZhbC50b0Zsb2F0MzJBcnJheSA/IHZhbC50b0Zsb2F0MzJBcnJheSgpIDogdmFsKTtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBUeXBlZEFycmF5KTtcbiAgICAgIGdsQ2hlY2tFcnJvcjIoZ2wpO1xuICAgIH07XG5cbiAgfVxuICAvLyBTZXQgYSBwcmltaXRpdmUtdmFsdWVkIHVuaWZvcm1cbiAgcmV0dXJuIHZhbCA9PiB7XG4gICAgZ2xGdW5jdGlvbihsb2MsIHZhbCk7XG4gICAgZ2xDaGVja0Vycm9yMihnbCk7XG4gIH07XG5cbn1cblxuLy8gY3JlYXRlIHVuaWZvcm0gc2V0dGVyc1xuLy8gTWFwIG9mIHVuaWZvcm0gbmFtZXMgdG8gc2V0dGVyIGZ1bmN0aW9uc1xuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIGdsUHJvZ3JhbSkge1xuICBjb25zdCB1bmlmb3JtU2V0dGVycyA9IHt9O1xuICBjb25zdCBsZW5ndGggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKGdsUHJvZ3JhbSwgaSk7XG4gICAgbGV0IG5hbWUgPSBpbmZvLm5hbWU7XG4gICAgLy8gaWYgYXJyYXkgbmFtZSB0aGVuIGNsZWFuIHRoZSBhcnJheSBicmFja2V0c1xuICAgIG5hbWUgPSBuYW1lW25hbWUubGVuZ3RoIC0gMV0gPT09ICddJyA/XG4gICAgICBuYW1lLnN1YnN0cigwLCBuYW1lLmxlbmd0aCAtIDMpIDogbmFtZTtcbiAgICB1bmlmb3JtU2V0dGVyc1tuYW1lXSA9XG4gICAgICBnZXRVbmlmb3JtU2V0dGVyKGdsLCBnbFByb2dyYW0sIGluZm8sIGluZm8ubmFtZSAhPT0gbmFtZSk7XG4gIH1cbiAgcmV0dXJuIHVuaWZvcm1TZXR0ZXJzO1xufVxuXG4vLyBkZXRlcm1pbmUgYXR0cmlidXRlIGxvY2F0aW9ucyAobWFwcyBhdHRyaWJ1dGUgbmFtZSB0byBpbmRleClcbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyk7XG4gIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZUF0dHJpYihnbFByb2dyYW0sIGkpO1xuICAgIGNvbnN0IGluZGV4ID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oZ2xQcm9ncmFtLCBpbmZvLm5hbWUpO1xuICAgIGF0dHJpYnV0ZUxvY2F0aW9uc1tpbmZvLm5hbWVdID0gaW5kZXg7XG4gIH1cbiAgcmV0dXJuIGF0dHJpYnV0ZUxvY2F0aW9ucztcbn1cbiIsImltcG9ydCBmb3JtYXRDb21waWxlckVycm9yIGZyb20gJ2dsLWZvcm1hdC1jb21waWxlci1lcnJvcic7XG5cbi8vIEZvciBub3cgdGhpcyBpcyBhbiBpbnRlcm5hbCBjbGFzc1xuZXhwb3J0IGNsYXNzIFNoYWRlciB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSwgc2hhZGVyVHlwZSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVNoYWRlcihzaGFkZXJUeXBlKTtcbiAgICBpZiAodGhpcy5oYW5kbGUgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgY3JlYXRpbmcgc2hhZGVyIHdpdGggdHlwZSAke3NoYWRlclR5cGV9YCk7XG4gICAgfVxuICAgIGdsLnNoYWRlclNvdXJjZSh0aGlzLmhhbmRsZSwgc2hhZGVyU291cmNlKTtcbiAgICBnbC5jb21waWxlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICB2YXIgY29tcGlsZWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIodGhpcy5oYW5kbGUsIGdsLkNPTVBJTEVfU1RBVFVTKTtcbiAgICBpZiAoIWNvbXBpbGVkKSB7XG4gICAgICB2YXIgaW5mbyA9IGdsLmdldFNoYWRlckluZm9Mb2codGhpcy5oYW5kbGUpO1xuICAgICAgZ2wuZGVsZXRlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCAqL1xuICAgICAgdmFyIGZvcm1hdHRlZExvZztcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvcm1hdHRlZExvZyA9IGZvcm1hdENvbXBpbGVyRXJyb3IoaW5mbywgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgLyogZ2xvYmFsIGNvbnNvbGUgKi9cbiAgICAgICAgY29uc29sZS53YXJuKCdFcnJvciBmb3JtYXR0aW5nIGdsc2wgY29tcGlsZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciB3aGlsZSBjb21waWxpbmcgdGhlIHNoYWRlciAke2luZm99YCk7XG4gICAgICB9XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXRyeS1jYXRjaCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGZvcm1hdHRlZExvZy5sb25nKTtcbiAgICB9XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVmVydGV4U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLlZFUlRFWF9TSEFERVIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGcmFnbWVudFNoYWRlciBleHRlbmRzIFNoYWRlciB7XG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXJTb3VyY2UpIHtcbiAgICBzdXBlcihnbCwgc2hhZGVyU291cmNlLCBnbC5GUkFHTUVOVF9TSEFERVIpO1xuICB9XG59XG4iLCJpbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcblxuY2xhc3MgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnRhcmdldCA9IGdsLlRFWFRVUkVfMkQ7XG5cbiAgICBvcHRzID0gbWVyZ2Uoe1xuICAgICAgZmxpcFk6IHRydWUsXG4gICAgICBhbGlnbm1lbnQ6IDEsXG4gICAgICBtYWdGaWx0ZXI6IGdsLk5FQVJFU1QsXG4gICAgICBtaW5GaWx0ZXI6IGdsLk5FQVJFU1QsXG4gICAgICB3cmFwUzogZ2wuQ0xBTVBfVE9fRURHRSxcbiAgICAgIHdyYXBUOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgZm9ybWF0OiBnbC5SR0JBLFxuICAgICAgdHlwZTogZ2wuVU5TSUdORURfQllURSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwOiBmYWxzZVxuICAgIH0sIG9wdHMpO1xuXG4gICAgdGhpcy5mbGlwWSA9IG9wdHMuZmxpcFk7XG4gICAgdGhpcy5hbGlnbm1lbnQgPSBvcHRzLmFsaWdubWVudDtcbiAgICB0aGlzLm1hZ0ZpbHRlciA9IG9wdHMubWFnRmlsdGVyO1xuICAgIHRoaXMubWluRmlsdGVyID0gb3B0cy5taW5GaWx0ZXI7XG4gICAgdGhpcy53cmFwUyA9IG9wdHMud3JhcFM7XG4gICAgdGhpcy53cmFwVCA9IG9wdHMud3JhcFQ7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRzLmZvcm1hdDtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG4gICAgdGhpcy5nZW5lcmF0ZU1pcG1hcCA9IG9wdHMuZ2VuZXJhdGVNaXBtYXA7XG5cbiAgICBpZiAodGhpcy50eXBlID09PSBnbC5GTE9BVCkge1xuICAgICAgdGhpcy5mbG9hdEV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbignT0VTX3RleHR1cmVfZmxvYXQnKTtcbiAgICAgIGlmICghdGhpcy5mbG9hdEV4dGVuc2lvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09FU190ZXh0dXJlX2Zsb2F0IGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy50ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIGlmICghdGhpcy50ZXh0dXJlKSB7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cblxuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZSk7XG4gICAgdGhpcy50ZXh0dXJlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZTJEIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBzdXBlcihnbCwgb3B0cyk7XG4gICAgb3B0cy5kYXRhID0gb3B0cy5kYXRhIHx8IG51bGw7XG5cbiAgICB0aGlzLndpZHRoID0gMDtcbiAgICB0aGlzLmhlaWdodCA9IDA7XG4gICAgdGhpcy5ib3JkZXIgPSAwO1xuICAgIHRoaXMuZGF0YSA9IG51bGw7XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG5cbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgaWYgKHRoaXMuZmxpcFkpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgZmFsc2UpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LFxuICAgICAgICB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsXG4gICAgICAgIHRoaXMuZGF0YSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRleHR1cmVDdWJlIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBzdXBlcihnbCwgb3B0cyk7XG4gICAgb3B0cy5kYXRhID0gb3B0cy5kYXRhIHx8IG51bGw7XG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBiaW5kKGluZGV4KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGhpcy50ZXh0dXJlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpIC0gZ2wuVEVYVFVSRTA7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG1heC1sZW4gKi9cbiAgdXBkYXRlKG9wdHMpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRzLmhlaWdodDtcbiAgICB0aGlzLmJvcmRlciA9IG9wdHMuYm9yZGVyIHx8IDA7XG4gICAgdGhpcy5kYXRhID0gb3B0cy5kYXRhO1xuICAgIHRoaXMuYmluZCgpO1xuICAgIGlmICh0aGlzLndpZHRoIHx8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3MueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMubWluRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLm1hZ0ZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLndyYXBTKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMud3JhcFQpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKHRoaXMuZ2VuZXJhdGVNaXBtYXApIHtcbiAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfQ1VCRV9NQVApO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgfVxuXG59XG4iLCIvLyBIZWxwZXIgZGVmaW5pdGlvbnMgZm9yIHZhbGlkYXRpb24gb2Ygd2ViZ2wgcGFyYW1ldGVyc1xuLyogZXNsaW50LWRpc2FibGUgbm8taW5saW5lLWNvbW1lbnRzLCBtYXgtbGVuICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIFdFQkdMIEJVSUxULUlOIFRZUEVTXG4vLyBDb252ZW5pZW5jZTogZW5hYmxlIGFwcCB0byBcImltcG9ydFwiIGJ1aWx0LWluIFdlYkdMIHR5cGVzIHVua25vd24gdG8gZXNsaW50XG4vKiBnbG9iYWwgV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBXZWJHTEJ1ZmZlciAqL1xuZXhwb3J0IHtXZWJHTFJlbmRlcmluZ0NvbnRleHQsIFdlYkdMQnVmZmVyfTtcblxuLy8gSU5ERVggVFlQRVN4eFxuXG4vLyBGb3IgZHJhd0VsZW1lbnRzLCBzaXplIG9mIGluZGljZXNcbmV4cG9ydCBjb25zdCBJTkRFWF9UWVBFUyA9IFsnVU5TSUdORURfQllURScsICdVTlNJR05FRF9TSE9SVCddO1xuZXhwb3J0IGNvbnN0IEdMX0lOREVYX1RZUEVTID0gZ2wgPT4gSU5ERVhfVFlQRVMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0luZGV4VHlwZSh0eXBlKSB7XG4gIHJldHVybiBJTkRFWF9UWVBFUy5pbmRleE9mKHR5cGUpICE9PSAtMTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0dMSW5kZXhUeXBlKGdsVHlwZSkge1xuICByZXR1cm4gR0xfSU5ERVhfVFlQRVMuaW5kZXhPZihnbFR5cGUpICE9PSAtMTtcbn1cblxuLy8gRFJBVyBNT0RFU1xuXG5leHBvcnQgY29uc3QgRFJBV19NT0RFUyA9IFtcbiAgJ1BPSU5UUycsICdMSU5FX1NUUklQJywgJ0xJTkVfTE9PUCcsICdMSU5FUycsXG4gICdUUklBTkdMRV9TVFJJUCcsICdUUklBTkdMRV9GQU4nLCAnVFJJQU5HTEVTJ1xuXTtcbmV4cG9ydCBjb25zdCBHTF9EUkFXX01PREVTID0gZ2wgPT4gRFJBV19NT0RFUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRHJhd01vZGUobW9kZSkge1xuICByZXR1cm4gRFJBV19NT0RFUy5pbmRleE9mKG1vZGUpICE9PSAtMTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0dMRHJhd01vZGUoZ2xNb2RlKSB7XG4gIHJldHVybiBHTF9EUkFXX01PREVTLmluZGV4T2YoZ2xNb2RlKSAhPT0gLTE7XG59XG5cbi8vIFRBUkdFVCBUWVBFU1xuXG5leHBvcnQgY29uc3QgVEFSR0VUUyA9IFtcbiAgJ0FSUkFZX0JVRkZFUicsIC8vIHZlcnRleCBhdHRyaWJ1dGVzIChlLmcuIHZlcnRleC90ZXh0dXJlIGNvb3JkcyBvciBjb2xvcilcbiAgJ0VMRU1FTlRfQVJSQVlfQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIGVsZW1lbnQgaW5kaWNlcy5cbiAgLy8gRm9yIFdlYkdMIDIgY29udGV4dHNcbiAgJ0NPUFlfUkVBRF9CVUZGRVInLCAvLyBCdWZmZXIgZm9yIGNvcHlpbmcgZnJvbSBvbmUgYnVmZmVyIG9iamVjdCB0byBhbm90aGVyXG4gICdDT1BZX1dSSVRFX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgY29weWluZyBmcm9tIG9uZSBidWZmZXIgb2JqZWN0IHRvIGFub3RoZXJcbiAgJ1RSQU5TRk9STV9GRUVEQkFDS19CVUZGRVInLCAvLyBCdWZmZXIgZm9yIHRyYW5zZm9ybSBmZWVkYmFjayBvcGVyYXRpb25zXG4gICdVTklGT1JNX0JVRkZFUicsIC8vIEJ1ZmZlciB1c2VkIGZvciBzdG9yaW5nIHVuaWZvcm0gYmxvY2tzXG4gICdQSVhFTF9QQUNLX0JVRkZFUicsIC8vIEJ1ZmZlciB1c2VkIGZvciBwaXhlbCB0cmFuc2ZlciBvcGVyYXRpb25zXG4gICdQSVhFTF9VTlBBQ0tfQlVGRkVSJyAvLyBCdWZmZXIgdXNlZCBmb3IgcGl4ZWwgdHJhbnNmZXIgb3BlcmF0aW9uc1xuXTtcblxuZXhwb3J0IGNvbnN0IEdMX1RBUkdFVFMgPVxuICBnbCA9PiBUQVJHRVRTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pLmZpbHRlcihjb25zdGFudCA9PiBjb25zdGFudCk7XG5cbi8vIFVTQUdFIFRZUEVTXG5cbmV4cG9ydCBjb25zdCBCVUZGRVJfVVNBR0UgPSBbXG4gICdTVEFUSUNfRFJBVycsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gICdEWU5BTUlDX0RSQVcnLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gICdTVFJFQU1fRFJBVycsIC8vIEJ1ZmZlciBub3QgdXNlZCBvZnRlbi4gQ29udGVudHMgYXJlIHdyaXR0ZW4gdG8gdGhlIGJ1ZmZlciwgYnV0IG5vdCByZWFkLlxuICAvLyBGb3IgV2ViR0wgMiBjb250ZXh0c1xuICAnU1RBVElDX1JFQUQnLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIHJlYWQgZnJvbSB0aGUgYnVmZmVyLCBidXQgbm90IHdyaXR0ZW4uXG4gICdEWU5BTUlDX1JFQUQnLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ1NUUkVBTV9SRUFEJywgLy8gQ29udGVudHMgb2YgdGhlIGJ1ZmZlciBhcmUgbGlrZWx5IHRvIG5vdCBiZSB1c2VkIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ1NUQVRJQ19DT1BZJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSBuZWl0aGVyIHdyaXR0ZW4gb3IgcmVhZCBieSB0aGUgdXNlci5cbiAgJ0RZTkFNSUNfQ09QWScsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSBuZWl0aGVyIHdyaXR0ZW4gb3IgcmVhZCBieSB0aGUgdXNlci5cbiAgJ1NUUkVBTV9DT1BZJyAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuXTtcblxuZXhwb3J0IGNvbnN0IEdMX0JVRkZFUl9VU0FHRSA9XG4gIGdsID0+IEJVRkZFUl9VU0FHRS5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKS5maWx0ZXIoY29uc3RhbnQgPT4gY29uc3RhbnQpO1xuXG4vLyBUWVBFRCBBUlJBWVNcblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZWRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuQllURVNfUEVSX0VMRU1FTlQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlVHlwZWRBcnJheShBcnJheVR5cGUsIHNvdXJjZUFycmF5KSB7XG4gIGFzc2VydChBcnJheS5pc0FycmF5KHNvdXJjZUFycmF5KSk7XG4gIGNvbnN0IGFycmF5ID0gbmV3IEFycmF5VHlwZShzb3VyY2VBcnJheS5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZUFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgYXJyYXlbaV0gPSBzb3VyY2VBcnJheVtpXTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG4iXX0=
