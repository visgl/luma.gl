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
},{"repeat-string":18}],3:[function(require,module,exports){
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

},{"util/":21}],4:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
var gl10 = require('./1.0/numbers')

module.exports = function lookupConstant (number) {
  return gl10[number]
}

},{"./1.0/numbers":8}],10:[function(require,module,exports){

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


},{"add-line-numbers":1,"gl-constants/lookup":9,"glsl-shader-name":11,"sprintf-js":19}],11:[function(require,module,exports){
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

},{"atob-lite":4,"glsl-tokenizer":16}],12:[function(require,module,exports){
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

},{"./lib/builtins":13,"./lib/literals":14,"./lib/operators":15}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
var tokenize = require('./index')

module.exports = tokenizeString

function tokenizeString(str) {
  var generator = tokenize()
  var tokens = []

  tokens = tokens.concat(generator(str))
  tokens = tokens.concat(generator(null))

  return tokens
}

},{"./index":12}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],21:[function(require,module,exports){
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

},{"./support/isBuffer":20,"_process":5,"inherits":17}],22:[function(require,module,exports){
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

},{"../utils":29}],23:[function(require,module,exports){
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

},{"../io":27,"../shaders":28,"../utils":29,"../webgl/program":35}],24:[function(require,module,exports){
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

var _loop = function _loop(_key3) {
  if (_key3 === "default") return 'continue';
  Object.defineProperty(exports, _key3, {
    enumerable: true,
    get: function get() {
      return _helpers[_key3];
    }
  });
};

for (var _key3 in _helpers) {
  var _ret = _loop(_key3);

  if (_ret === 'continue') continue;
}

var _saveBitmap = require('./save-bitmap');

var _loop2 = function _loop2(_key4) {
  if (_key4 === "default") return 'continue';
  Object.defineProperty(exports, _key4, {
    enumerable: true,
    get: function get() {
      return _saveBitmap[_key4];
    }
  });
};

for (var _key4 in _saveBitmap) {
  var _ret2 = _loop2(_key4);

  if (_ret2 === 'continue') continue;
}

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

},{"./fx":22,"./helpers":23,"./save-bitmap":25,"./workers":26}],25:[function(require,module,exports){
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

},{"canvas-to-blob":6,"filesaver.js":7}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{"./utils":29,"./webgl":34}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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

},{"assert":3}],30:[function(require,module,exports){
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

},{"./context":31,"assert":3}],31:[function(require,module,exports){
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

},{"assert":3}],32:[function(require,module,exports){
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

},{"./context":31,"./types":38,"assert":3}],33:[function(require,module,exports){
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

},{"./texture":37}],34:[function(require,module,exports){
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

},{"./buffer":30,"./context":31,"./draw":32,"./fbo":33,"./program":35,"./texture":37,"./types":38}],35:[function(require,module,exports){
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

},{"../shaders":28,"../utils":29,"./context":31,"./shader":36,"assert":3}],36:[function(require,module,exports){
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

},{"gl-format-compiler-error":10}],37:[function(require,module,exports){
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

},{"../utils":29,"./context":31}],38:[function(require,module,exports){
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

},{"../utils":29}]},{},[24])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWRkLWxpbmUtbnVtYmVycy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hZGQtbGluZS1udW1iZXJzL25vZGVfbW9kdWxlcy9wYWQtbGVmdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2F0b2ItbGl0ZS9hdG9iLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy10by1ibG9iL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZpbGVzYXZlci5qcy9GaWxlU2F2ZXIuanMiLCJub2RlX21vZHVsZXMvZ2wtY29uc3RhbnRzLzEuMC9udW1iZXJzLmpzIiwibm9kZV9tb2R1bGVzL2dsLWNvbnN0YW50cy9sb29rdXAuanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtc2hhZGVyLW5hbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL2J1aWx0aW5zLmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9saXRlcmFscy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvb3BlcmF0b3JzLmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL3N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3JlcGVhdC1zdHJpbmcvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3ByaW50Zi1qcy9zcmMvc3ByaW50Zi5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9hZGRvbnMvZnguanMiLCJzcmMvYWRkb25zL2hlbHBlcnMuanMiLCJzcmMvYWRkb25zL2luZGV4LmpzIiwic3JjL2FkZG9ucy9zYXZlLWJpdG1hcC5qcyIsInNyYy9hZGRvbnMvd29ya2Vycy5qcyIsInNyYy9pby5qcyIsInNyYy9zaGFkZXJzL2luZGV4LmpzIiwic3JjL3V0aWxzLmpzIiwic3JjL3dlYmdsL2J1ZmZlci5qcyIsInNyYy93ZWJnbC9jb250ZXh0LmpzIiwic3JjL3dlYmdsL2RyYXcuanMiLCJzcmMvd2ViZ2wvZmJvLmpzIiwic3JjL3dlYmdsL2luZGV4LmpzIiwic3JjL3dlYmdsL3Byb2dyYW0uanMiLCJzcmMvd2ViZ2wvc2hhZGVyLmpzIiwic3JjL3dlYmdsL3RleHR1cmUuanMiLCJzcmMvd2ViZ2wvdHlwZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LE9BRGIsRUFFeEIsZ0JBRndCLEVBRU4sY0FGTSxFQUVVLFdBRlYsQ0FBYjtBQUlOLElBQU0sd0NBQWdCLFNBQWhCLGFBQWdCO1NBQU0sV0FBVyxHQUFYLENBQWU7V0FBWSxHQUFHLFFBQUg7R0FBWjtDQUFyQjs7QUFFdEIsU0FBUyxVQUFULENBQW9CLElBQXBCLEVBQTBCO0FBQy9CLFNBQU8sV0FBVyxPQUFYLENBQW1CLElBQW5CLE1BQTZCLENBQUMsQ0FBRCxDQURMO0NBQTFCO0FBR0EsU0FBUyxZQUFULENBQXNCLE1BQXRCLEVBQThCO0FBQ25DLFNBQU8sY0FBYyxPQUFkLENBQXNCLE1BQXRCLE1BQWtDLENBQUMsQ0FBRCxDQUROO0NBQTlCOzs7O0FBTUEsSUFBTSw0QkFBVSxDQUNyQixjQURxQjtBQUVyQixzQkFGcUI7O0FBSXJCLGtCQUpxQjtBQUtyQixtQkFMcUI7QUFNckIsMkJBTnFCO0FBT3JCLGdCQVBxQjtBQVFyQixtQkFScUI7QUFTckI7QUFUcUIsQ0FBVjs7QUFZTixJQUFNLGtDQUNYLFNBRFcsVUFDWDtTQUFNLFFBQVEsR0FBUixDQUFZO1dBQVksR0FBRyxRQUFIO0dBQVosQ0FBWixDQUFzQyxNQUF0QyxDQUE2QztXQUFZO0dBQVo7Q0FBbkQ7Ozs7QUFJSyxJQUFNLHNDQUFlLENBQzFCLGFBRDBCO0FBRTFCLGNBRjBCO0FBRzFCLGFBSDBCOztBQUsxQixhQUwwQjtBQU0xQixjQU4wQjtBQU8xQixhQVAwQjtBQVExQixhQVIwQjtBQVMxQixjQVQwQjtBQVUxQjtBQVYwQixDQUFmOztBQWFOLElBQU0sNENBQ1gsU0FEVyxlQUNYO1NBQU0sYUFBYSxHQUFiLENBQWlCO1dBQVksR0FBRyxRQUFIO0dBQVosQ0FBakIsQ0FBMkMsTUFBM0MsQ0FBa0Q7V0FBWTtHQUFaO0NBQXhEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwYWRMZWZ0ID0gcmVxdWlyZSgncGFkLWxlZnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZExpbmVOdW1iZXJzXG5mdW5jdGlvbiBhZGRMaW5lTnVtYmVycyAoc3RyaW5nLCBzdGFydCwgZGVsaW0pIHtcbiAgc3RhcnQgPSB0eXBlb2Ygc3RhcnQgPT09ICdudW1iZXInID8gc3RhcnQgOiAxXG4gIGRlbGltID0gZGVsaW0gfHwgJzogJ1xuXG4gIHZhciBsaW5lcyA9IHN0cmluZy5zcGxpdCgvXFxyP1xcbi8pXG4gIHZhciB0b3RhbERpZ2l0cyA9IFN0cmluZyhsaW5lcy5sZW5ndGggKyBzdGFydCAtIDEpLmxlbmd0aFxuICByZXR1cm4gbGluZXMubWFwKGZ1bmN0aW9uIChsaW5lLCBpKSB7XG4gICAgdmFyIGMgPSBpICsgc3RhcnRcbiAgICB2YXIgZGlnaXRzID0gU3RyaW5nKGMpLmxlbmd0aFxuICAgIHZhciBwcmVmaXggPSBwYWRMZWZ0KGMsIHRvdGFsRGlnaXRzIC0gZGlnaXRzKVxuICAgIHJldHVybiBwcmVmaXggKyBkZWxpbSArIGxpbmVcbiAgfSkuam9pbignXFxuJylcbn1cbiIsIi8qIVxuICogcGFkLWxlZnQgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L3BhZC1sZWZ0PlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBKb24gU2NobGlua2VydC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciByZXBlYXQgPSByZXF1aXJlKCdyZXBlYXQtc3RyaW5nJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFkTGVmdChzdHIsIG51bSwgY2gpIHtcbiAgY2ggPSB0eXBlb2YgY2ggIT09ICd1bmRlZmluZWQnID8gKGNoICsgJycpIDogJyAnO1xuICByZXR1cm4gcmVwZWF0KGNoLCBudW0pICsgc3RyO1xufTsiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAhaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKSB7XG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIH1cbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKSxcbiAgICAgIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfYXRvYihzdHIpIHtcbiAgcmV0dXJuIGF0b2Ioc3RyKVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh1cmkpIHtcbiAgICB2YXIgbWltZSAgID0gdXJpLnNwbGl0KCcsJylbMF0uc3BsaXQoJzonKVsxXS5zcGxpdCgnOycpWzBdO1xuICAgIHZhciBieXRlcyAgPSBhdG9iKHVyaS5zcGxpdCgnLCcpWzFdKTtcbiAgICB2YXIgbGVuICAgID0gYnl0ZXMubGVuZ3RoO1xuICAgIHZhciBidWZmZXIgPSBuZXcgd2luZG93LkFycmF5QnVmZmVyKGxlbik7XG4gICAgdmFyIGFyciAgICA9IG5ldyB3aW5kb3cuVWludDhBcnJheShidWZmZXIpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBhcnJbaV0gPSBieXRlcy5jaGFyQ29kZUF0KGkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQmxvYihbYXJyXSwgeyB0eXBlOiBtaW1lIH0pO1xufVxuXG4vLyBJRSA+PSAxMCwgbW9zdCBtb2Rlcm4gYnJvd3NlcnNcbi8vIFRoZSBCbG9iIHR5cGUgY2FuJ3QgYmUgcG9seWZpbGxlZCwgd2hpY2ggaXMgd2h5IHRoZXJlIGFyZW4ndCBhbnkgcG9seWZpbGxzIGZvciBUeXBlZEFycmF5cyBmb3Igb2xkZXIgSUUnc1xubW9kdWxlLmV4cG9ydHMuc3VwcG9ydGVkID0gKFxuICAgIHR5cGVvZiB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIHdpbmRvdy5hdG9iICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuQmxvYiAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2Ygd2luZG93LkFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCdcbik7XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFtb2R1bGUuZXhwb3J0cy5zdXBwb3J0ZWQpIHJldHVybjtcbiAgICB2YXIgQ2FudmFzUHJvdG90eXBlID0gd2luZG93LkhUTUxDYW52YXNFbGVtZW50LnByb3RvdHlwZTtcbiAgICBcbiAgICBpZiAoIUNhbnZhc1Byb3RvdHlwZS50b0Jsb2IgJiYgQ2FudmFzUHJvdG90eXBlLnRvRGF0YVVSTCkge1xuICAgICAgICBDYW52YXNQcm90b3R5cGUudG9CbG9iID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0eXBlLCBxdWFsaXR5KSB7XG4gICAgICAgICAgICBjYWxsYmFjayhtb2R1bGUuZXhwb3J0cyh0aGlzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLyogRmlsZVNhdmVyLmpzXG4gKiBBIHNhdmVBcygpIEZpbGVTYXZlciBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMS4yMDE1MDcxNlxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IFgxMS9NSVRcbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiAqL1xuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSwgaW5kZW50OiA0LCBsYXhicmVhazogdHJ1ZSwgbGF4Y29tbWE6IHRydWUsIHNtYXJ0dGFiczogdHJ1ZSwgcGx1c3BsdXM6IHRydWUgKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9GaWxlU2F2ZXIuanMgKi9cblxudmFyIHNhdmVBcyA9IHNhdmVBcyB8fCAoZnVuY3Rpb24odmlldykge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0Ly8gSUUgPDEwIGlzIGV4cGxpY2l0bHkgdW5zdXBwb3J0ZWRcblx0aWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgL01TSUUgWzEtOV1cXC4vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyXG5cdFx0ICBkb2MgPSB2aWV3LmRvY3VtZW50XG5cdFx0ICAvLyBvbmx5IGdldCBVUkwgd2hlbiBuZWNlc3NhcnkgaW4gY2FzZSBCbG9iLmpzIGhhc24ndCBvdmVycmlkZGVuIGl0IHlldFxuXHRcdCwgZ2V0X1VSTCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHZpZXcuVVJMIHx8IHZpZXcud2Via2l0VVJMIHx8IHZpZXc7XG5cdFx0fVxuXHRcdCwgc2F2ZV9saW5rID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpXG5cdFx0LCBjYW5fdXNlX3NhdmVfbGluayA9IFwiZG93bmxvYWRcIiBpbiBzYXZlX2xpbmtcblx0XHQsIGNsaWNrID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIGV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoXCJjbGlja1wiKTtcblx0XHRcdG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XG5cdFx0fVxuXHRcdCwgd2Via2l0X3JlcV9mcyA9IHZpZXcud2Via2l0UmVxdWVzdEZpbGVTeXN0ZW1cblx0XHQsIHJlcV9mcyA9IHZpZXcucmVxdWVzdEZpbGVTeXN0ZW0gfHwgd2Via2l0X3JlcV9mcyB8fCB2aWV3Lm1velJlcXVlc3RGaWxlU3lzdGVtXG5cdFx0LCB0aHJvd19vdXRzaWRlID0gZnVuY3Rpb24oZXgpIHtcblx0XHRcdCh2aWV3LnNldEltbWVkaWF0ZSB8fCB2aWV3LnNldFRpbWVvdXQpKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aHJvdyBleDtcblx0XHRcdH0sIDApO1xuXHRcdH1cblx0XHQsIGZvcmNlX3NhdmVhYmxlX3R5cGUgPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiXG5cdFx0LCBmc19taW5fc2l6ZSA9IDBcblx0XHQvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3NTI5NyNjNyBhbmRcblx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9GaWxlU2F2ZXIuanMvY29tbWl0LzQ4NTkzMGEjY29tbWl0Y29tbWVudC04NzY4MDQ3XG5cdFx0Ly8gZm9yIHRoZSByZWFzb25pbmcgYmVoaW5kIHRoZSB0aW1lb3V0IGFuZCByZXZvY2F0aW9uIGZsb3dcblx0XHQsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCA9IDUwMCAvLyBpbiBtc1xuXHRcdCwgcmV2b2tlID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0dmFyIHJldm9rZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBmaWxlID09PSBcInN0cmluZ1wiKSB7IC8vIGZpbGUgaXMgYW4gb2JqZWN0IFVSTFxuXHRcdFx0XHRcdGdldF9VUkwoKS5yZXZva2VPYmplY3RVUkwoZmlsZSk7XG5cdFx0XHRcdH0gZWxzZSB7IC8vIGZpbGUgaXMgYSBGaWxlXG5cdFx0XHRcdFx0ZmlsZS5yZW1vdmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdGlmICh2aWV3LmNocm9tZSkge1xuXHRcdFx0XHRyZXZva2VyKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZXRUaW1lb3V0KHJldm9rZXIsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCwgZGlzcGF0Y2ggPSBmdW5jdGlvbihmaWxlc2F2ZXIsIGV2ZW50X3R5cGVzLCBldmVudCkge1xuXHRcdFx0ZXZlbnRfdHlwZXMgPSBbXS5jb25jYXQoZXZlbnRfdHlwZXMpO1xuXHRcdFx0dmFyIGkgPSBldmVudF90eXBlcy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHZhciBsaXN0ZW5lciA9IGZpbGVzYXZlcltcIm9uXCIgKyBldmVudF90eXBlc1tpXV07XG5cdFx0XHRcdGlmICh0eXBlb2YgbGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsKGZpbGVzYXZlciwgZXZlbnQgfHwgZmlsZXNhdmVyKTtcblx0XHRcdFx0XHR9IGNhdGNoIChleCkge1xuXHRcdFx0XHRcdFx0dGhyb3dfb3V0c2lkZShleCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCwgYXV0b19ib20gPSBmdW5jdGlvbihibG9iKSB7XG5cdFx0XHQvLyBwcmVwZW5kIEJPTSBmb3IgVVRGLTggWE1MIGFuZCB0ZXh0LyogdHlwZXMgKGluY2x1ZGluZyBIVE1MKVxuXHRcdFx0aWYgKC9eXFxzKig/OnRleHRcXC9cXFMqfGFwcGxpY2F0aW9uXFwveG1sfFxcUypcXC9cXFMqXFwreG1sKVxccyo7LipjaGFyc2V0XFxzKj1cXHMqdXRmLTgvaS50ZXN0KGJsb2IudHlwZSkpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBCbG9iKFtcIlxcdWZlZmZcIiwgYmxvYl0sIHt0eXBlOiBibG9iLnR5cGV9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBibG9iO1xuXHRcdH1cblx0XHQsIEZpbGVTYXZlciA9IGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdC8vIEZpcnN0IHRyeSBhLmRvd25sb2FkLCB0aGVuIHdlYiBmaWxlc3lzdGVtLCB0aGVuIG9iamVjdCBVUkxzXG5cdFx0XHR2YXJcblx0XHRcdFx0ICBmaWxlc2F2ZXIgPSB0aGlzXG5cdFx0XHRcdCwgdHlwZSA9IGJsb2IudHlwZVxuXHRcdFx0XHQsIGJsb2JfY2hhbmdlZCA9IGZhbHNlXG5cdFx0XHRcdCwgb2JqZWN0X3VybFxuXHRcdFx0XHQsIHRhcmdldF92aWV3XG5cdFx0XHRcdCwgZGlzcGF0Y2hfYWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcIndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgd3JpdGVlbmRcIi5zcGxpdChcIiBcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIG9uIGFueSBmaWxlc3lzIGVycm9ycyByZXZlcnQgdG8gc2F2aW5nIHdpdGggb2JqZWN0IFVSTHNcblx0XHRcdFx0LCBmc19lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdC8vIGRvbid0IGNyZWF0ZSBtb3JlIG9iamVjdCBVUkxzIHRoYW4gbmVlZGVkXG5cdFx0XHRcdFx0aWYgKGJsb2JfY2hhbmdlZCB8fCAhb2JqZWN0X3VybCkge1xuXHRcdFx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh0YXJnZXRfdmlldykge1xuXHRcdFx0XHRcdFx0dGFyZ2V0X3ZpZXcubG9jYXRpb24uaHJlZiA9IG9iamVjdF91cmw7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHZhciBuZXdfdGFiID0gdmlldy5vcGVuKG9iamVjdF91cmwsIFwiX2JsYW5rXCIpO1xuXHRcdFx0XHRcdFx0aWYgKG5ld190YWIgPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBzYWZhcmkgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0XHRcdFx0Ly9BcHBsZSBkbyBub3QgYWxsb3cgd2luZG93Lm9wZW4sIHNlZSBodHRwOi8vYml0Lmx5LzFrWmZmUklcblx0XHRcdFx0XHRcdFx0dmlldy5sb2NhdGlvbi5ocmVmID0gb2JqZWN0X3VybFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQsIGFib3J0YWJsZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcblx0XHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAoZmlsZXNhdmVyLnJlYWR5U3RhdGUgIT09IGZpbGVzYXZlci5ET05FKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XHQsIGNyZWF0ZV9pZl9ub3RfZm91bmQgPSB7Y3JlYXRlOiB0cnVlLCBleGNsdXNpdmU6IGZhbHNlfVxuXHRcdFx0XHQsIHNsaWNlXG5cdFx0XHQ7XG5cdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5JTklUO1xuXHRcdFx0aWYgKCFuYW1lKSB7XG5cdFx0XHRcdG5hbWUgPSBcImRvd25sb2FkXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAoY2FuX3VzZV9zYXZlX2xpbmspIHtcblx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdHNhdmVfbGluay5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0c2F2ZV9saW5rLmRvd25sb2FkID0gbmFtZTtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRjbGljayhzYXZlX2xpbmspO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Ly8gT2JqZWN0IGFuZCB3ZWIgZmlsZXN5c3RlbSBVUkxzIGhhdmUgYSBwcm9ibGVtIHNhdmluZyBpbiBHb29nbGUgQ2hyb21lIHdoZW5cblx0XHRcdC8vIHZpZXdlZCBpbiBhIHRhYiwgc28gSSBmb3JjZSBzYXZlIHdpdGggYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXG5cdFx0XHQvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD05MTE1OFxuXHRcdFx0Ly8gVXBkYXRlOiBHb29nbGUgZXJyYW50bHkgY2xvc2VkIDkxMTU4LCBJIHN1Ym1pdHRlZCBpdCBhZ2Fpbjpcblx0XHRcdC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zODk2NDJcblx0XHRcdGlmICh2aWV3LmNocm9tZSAmJiB0eXBlICYmIHR5cGUgIT09IGZvcmNlX3NhdmVhYmxlX3R5cGUpIHtcblx0XHRcdFx0c2xpY2UgPSBibG9iLnNsaWNlIHx8IGJsb2Iud2Via2l0U2xpY2U7XG5cdFx0XHRcdGJsb2IgPSBzbGljZS5jYWxsKGJsb2IsIDAsIGJsb2Iuc2l6ZSwgZm9yY2Vfc2F2ZWFibGVfdHlwZSk7XG5cdFx0XHRcdGJsb2JfY2hhbmdlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHQvLyBTaW5jZSBJIGNhbid0IGJlIHN1cmUgdGhhdCB0aGUgZ3Vlc3NlZCBtZWRpYSB0eXBlIHdpbGwgdHJpZ2dlciBhIGRvd25sb2FkXG5cdFx0XHQvLyBpbiBXZWJLaXQsIEkgYXBwZW5kIC5kb3dubG9hZCB0byB0aGUgZmlsZW5hbWUuXG5cdFx0XHQvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjU0NDBcblx0XHRcdGlmICh3ZWJraXRfcmVxX2ZzICYmIG5hbWUgIT09IFwiZG93bmxvYWRcIikge1xuXHRcdFx0XHRuYW1lICs9IFwiLmRvd25sb2FkXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAodHlwZSA9PT0gZm9yY2Vfc2F2ZWFibGVfdHlwZSB8fCB3ZWJraXRfcmVxX2ZzKSB7XG5cdFx0XHRcdHRhcmdldF92aWV3ID0gdmlldztcblx0XHRcdH1cblx0XHRcdGlmICghcmVxX2ZzKSB7XG5cdFx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGZzX21pbl9zaXplICs9IGJsb2Iuc2l6ZTtcblx0XHRcdHJlcV9mcyh2aWV3LlRFTVBPUkFSWSwgZnNfbWluX3NpemUsIGFib3J0YWJsZShmdW5jdGlvbihmcykge1xuXHRcdFx0XHRmcy5yb290LmdldERpcmVjdG9yeShcInNhdmVkXCIsIGNyZWF0ZV9pZl9ub3RfZm91bmQsIGFib3J0YWJsZShmdW5jdGlvbihkaXIpIHtcblx0XHRcdFx0XHR2YXIgc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZGlyLmdldEZpbGUobmFtZSwgY3JlYXRlX2lmX25vdF9mb3VuZCwgYWJvcnRhYmxlKGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdFx0XHRcdFx0ZmlsZS5jcmVhdGVXcml0ZXIoYWJvcnRhYmxlKGZ1bmN0aW9uKHdyaXRlcikge1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRhcmdldF92aWV3LmxvY2F0aW9uLmhyZWYgPSBmaWxlLnRvVVJMKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcIndyaXRlZW5kXCIsIGV2ZW50KTtcblx0XHRcdFx0XHRcdFx0XHRcdHJldm9rZShmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgZXJyb3IgPSB3cml0ZXIuZXJyb3I7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoZXJyb3IuY29kZSAhPT0gZXJyb3IuQUJPUlRfRVJSKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcIndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgYWJvcnRcIi5zcGxpdChcIiBcIikuZm9yRWFjaChmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0d3JpdGVyW1wib25cIiArIGV2ZW50XSA9IGZpbGVzYXZlcltcIm9uXCIgKyBldmVudF07XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0d3JpdGVyLndyaXRlKGJsb2IpO1xuXHRcdFx0XHRcdFx0XHRcdGZpbGVzYXZlci5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0d3JpdGVyLmFib3J0KCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuV1JJVElORztcblx0XHRcdFx0XHRcdFx0fSksIGZzX2Vycm9yKTtcblx0XHRcdFx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRkaXIuZ2V0RmlsZShuYW1lLCB7Y3JlYXRlOiBmYWxzZX0sIGFib3J0YWJsZShmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdFx0XHQvLyBkZWxldGUgZmlsZSBpZiBpdCBhbHJlYWR5IGV4aXN0c1xuXHRcdFx0XHRcdFx0ZmlsZS5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdHNhdmUoKTtcblx0XHRcdFx0XHR9KSwgYWJvcnRhYmxlKGZ1bmN0aW9uKGV4KSB7XG5cdFx0XHRcdFx0XHRpZiAoZXguY29kZSA9PT0gZXguTk9UX0ZPVU5EX0VSUikge1xuXHRcdFx0XHRcdFx0XHRzYXZlKCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRmc19lcnJvcigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0fSksIGZzX2Vycm9yKTtcblx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0fVxuXHRcdCwgRlNfcHJvdG8gPSBGaWxlU2F2ZXIucHJvdG90eXBlXG5cdFx0LCBzYXZlQXMgPSBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBGaWxlU2F2ZXIoYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pO1xuXHRcdH1cblx0O1xuXHQvLyBJRSAxMCsgKG5hdGl2ZSBzYXZlQXMpXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmIG5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihibG9iLCBuYW1lIHx8IFwiZG93bmxvYWRcIik7XG5cdFx0fTtcblx0fVxuXG5cdEZTX3Byb3RvLmFib3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZpbGVzYXZlciA9IHRoaXM7XG5cdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRkaXNwYXRjaChmaWxlc2F2ZXIsIFwiYWJvcnRcIik7XG5cdH07XG5cdEZTX3Byb3RvLnJlYWR5U3RhdGUgPSBGU19wcm90by5JTklUID0gMDtcblx0RlNfcHJvdG8uV1JJVElORyA9IDE7XG5cdEZTX3Byb3RvLkRPTkUgPSAyO1xuXG5cdEZTX3Byb3RvLmVycm9yID1cblx0RlNfcHJvdG8ub253cml0ZXN0YXJ0ID1cblx0RlNfcHJvdG8ub25wcm9ncmVzcyA9XG5cdEZTX3Byb3RvLm9ud3JpdGUgPVxuXHRGU19wcm90by5vbmFib3J0ID1cblx0RlNfcHJvdG8ub25lcnJvciA9XG5cdEZTX3Byb3RvLm9ud3JpdGVlbmQgPVxuXHRcdG51bGw7XG5cblx0cmV0dXJuIHNhdmVBcztcbn0oXG5cdCAgIHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGZcblx0fHwgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3dcblx0fHwgdGhpcy5jb250ZW50XG4pKTtcbi8vIGBzZWxmYCBpcyB1bmRlZmluZWQgaW4gRmlyZWZveCBmb3IgQW5kcm9pZCBjb250ZW50IHNjcmlwdCBjb250ZXh0XG4vLyB3aGlsZSBgdGhpc2AgaXMgbnNJQ29udGVudEZyYW1lTWVzc2FnZU1hbmFnZXJcbi8vIHdpdGggYW4gYXR0cmlidXRlIGBjb250ZW50YCB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSB3aW5kb3dcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgbW9kdWxlLmV4cG9ydHMuc2F2ZUFzID0gc2F2ZUFzO1xufSBlbHNlIGlmICgodHlwZW9mIGRlZmluZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkZWZpbmUgIT09IG51bGwpICYmIChkZWZpbmUuYW1kICE9IG51bGwpKSB7XG4gIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNhdmVBcztcbiAgfSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgMDogJ05PTkUnLFxuICAxOiAnT05FJyxcbiAgMjogJ0xJTkVfTE9PUCcsXG4gIDM6ICdMSU5FX1NUUklQJyxcbiAgNDogJ1RSSUFOR0xFUycsXG4gIDU6ICdUUklBTkdMRV9TVFJJUCcsXG4gIDY6ICdUUklBTkdMRV9GQU4nLFxuICAyNTY6ICdERVBUSF9CVUZGRVJfQklUJyxcbiAgNTEyOiAnTkVWRVInLFxuICA1MTM6ICdMRVNTJyxcbiAgNTE0OiAnRVFVQUwnLFxuICA1MTU6ICdMRVFVQUwnLFxuICA1MTY6ICdHUkVBVEVSJyxcbiAgNTE3OiAnTk9URVFVQUwnLFxuICA1MTg6ICdHRVFVQUwnLFxuICA1MTk6ICdBTFdBWVMnLFxuICA3Njg6ICdTUkNfQ09MT1InLFxuICA3Njk6ICdPTkVfTUlOVVNfU1JDX0NPTE9SJyxcbiAgNzcwOiAnU1JDX0FMUEhBJyxcbiAgNzcxOiAnT05FX01JTlVTX1NSQ19BTFBIQScsXG4gIDc3MjogJ0RTVF9BTFBIQScsXG4gIDc3MzogJ09ORV9NSU5VU19EU1RfQUxQSEEnLFxuICA3NzQ6ICdEU1RfQ09MT1InLFxuICA3NzU6ICdPTkVfTUlOVVNfRFNUX0NPTE9SJyxcbiAgNzc2OiAnU1JDX0FMUEhBX1NBVFVSQVRFJyxcbiAgMTAyNDogJ1NURU5DSUxfQlVGRkVSX0JJVCcsXG4gIDEwMjg6ICdGUk9OVCcsXG4gIDEwMjk6ICdCQUNLJyxcbiAgMTAzMjogJ0ZST05UX0FORF9CQUNLJyxcbiAgMTI4MDogJ0lOVkFMSURfRU5VTScsXG4gIDEyODE6ICdJTlZBTElEX1ZBTFVFJyxcbiAgMTI4MjogJ0lOVkFMSURfT1BFUkFUSU9OJyxcbiAgMTI4NTogJ09VVF9PRl9NRU1PUlknLFxuICAxMjg2OiAnSU5WQUxJRF9GUkFNRUJVRkZFUl9PUEVSQVRJT04nLFxuICAyMzA0OiAnQ1cnLFxuICAyMzA1OiAnQ0NXJyxcbiAgMjg0OTogJ0xJTkVfV0lEVEgnLFxuICAyODg0OiAnQ1VMTF9GQUNFJyxcbiAgMjg4NTogJ0NVTExfRkFDRV9NT0RFJyxcbiAgMjg4NjogJ0ZST05UX0ZBQ0UnLFxuICAyOTI4OiAnREVQVEhfUkFOR0UnLFxuICAyOTI5OiAnREVQVEhfVEVTVCcsXG4gIDI5MzA6ICdERVBUSF9XUklURU1BU0snLFxuICAyOTMxOiAnREVQVEhfQ0xFQVJfVkFMVUUnLFxuICAyOTMyOiAnREVQVEhfRlVOQycsXG4gIDI5NjA6ICdTVEVOQ0lMX1RFU1QnLFxuICAyOTYxOiAnU1RFTkNJTF9DTEVBUl9WQUxVRScsXG4gIDI5NjI6ICdTVEVOQ0lMX0ZVTkMnLFxuICAyOTYzOiAnU1RFTkNJTF9WQUxVRV9NQVNLJyxcbiAgMjk2NDogJ1NURU5DSUxfRkFJTCcsXG4gIDI5NjU6ICdTVEVOQ0lMX1BBU1NfREVQVEhfRkFJTCcsXG4gIDI5NjY6ICdTVEVOQ0lMX1BBU1NfREVQVEhfUEFTUycsXG4gIDI5Njc6ICdTVEVOQ0lMX1JFRicsXG4gIDI5Njg6ICdTVEVOQ0lMX1dSSVRFTUFTSycsXG4gIDI5Nzg6ICdWSUVXUE9SVCcsXG4gIDMwMjQ6ICdESVRIRVInLFxuICAzMDQyOiAnQkxFTkQnLFxuICAzMDg4OiAnU0NJU1NPUl9CT1gnLFxuICAzMDg5OiAnU0NJU1NPUl9URVNUJyxcbiAgMzEwNjogJ0NPTE9SX0NMRUFSX1ZBTFVFJyxcbiAgMzEwNzogJ0NPTE9SX1dSSVRFTUFTSycsXG4gIDMzMTc6ICdVTlBBQ0tfQUxJR05NRU5UJyxcbiAgMzMzMzogJ1BBQ0tfQUxJR05NRU5UJyxcbiAgMzM3OTogJ01BWF9URVhUVVJFX1NJWkUnLFxuICAzMzg2OiAnTUFYX1ZJRVdQT1JUX0RJTVMnLFxuICAzNDA4OiAnU1VCUElYRUxfQklUUycsXG4gIDM0MTA6ICdSRURfQklUUycsXG4gIDM0MTE6ICdHUkVFTl9CSVRTJyxcbiAgMzQxMjogJ0JMVUVfQklUUycsXG4gIDM0MTM6ICdBTFBIQV9CSVRTJyxcbiAgMzQxNDogJ0RFUFRIX0JJVFMnLFxuICAzNDE1OiAnU1RFTkNJTF9CSVRTJyxcbiAgMzU1MzogJ1RFWFRVUkVfMkQnLFxuICA0MzUyOiAnRE9OVF9DQVJFJyxcbiAgNDM1MzogJ0ZBU1RFU1QnLFxuICA0MzU0OiAnTklDRVNUJyxcbiAgNTEyMDogJ0JZVEUnLFxuICA1MTIxOiAnVU5TSUdORURfQllURScsXG4gIDUxMjI6ICdTSE9SVCcsXG4gIDUxMjM6ICdVTlNJR05FRF9TSE9SVCcsXG4gIDUxMjQ6ICdJTlQnLFxuICA1MTI1OiAnVU5TSUdORURfSU5UJyxcbiAgNTEyNjogJ0ZMT0FUJyxcbiAgNTM4NjogJ0lOVkVSVCcsXG4gIDU4OTA6ICdURVhUVVJFJyxcbiAgNjQwMTogJ1NURU5DSUxfSU5ERVgnLFxuICA2NDAyOiAnREVQVEhfQ09NUE9ORU5UJyxcbiAgNjQwNjogJ0FMUEhBJyxcbiAgNjQwNzogJ1JHQicsXG4gIDY0MDg6ICdSR0JBJyxcbiAgNjQwOTogJ0xVTUlOQU5DRScsXG4gIDY0MTA6ICdMVU1JTkFOQ0VfQUxQSEEnLFxuICA3NjgwOiAnS0VFUCcsXG4gIDc2ODE6ICdSRVBMQUNFJyxcbiAgNzY4MjogJ0lOQ1InLFxuICA3NjgzOiAnREVDUicsXG4gIDc5MzY6ICdWRU5ET1InLFxuICA3OTM3OiAnUkVOREVSRVInLFxuICA3OTM4OiAnVkVSU0lPTicsXG4gIDk3Mjg6ICdORUFSRVNUJyxcbiAgOTcyOTogJ0xJTkVBUicsXG4gIDk5ODQ6ICdORUFSRVNUX01JUE1BUF9ORUFSRVNUJyxcbiAgOTk4NTogJ0xJTkVBUl9NSVBNQVBfTkVBUkVTVCcsXG4gIDk5ODY6ICdORUFSRVNUX01JUE1BUF9MSU5FQVInLFxuICA5OTg3OiAnTElORUFSX01JUE1BUF9MSU5FQVInLFxuICAxMDI0MDogJ1RFWFRVUkVfTUFHX0ZJTFRFUicsXG4gIDEwMjQxOiAnVEVYVFVSRV9NSU5fRklMVEVSJyxcbiAgMTAyNDI6ICdURVhUVVJFX1dSQVBfUycsXG4gIDEwMjQzOiAnVEVYVFVSRV9XUkFQX1QnLFxuICAxMDQ5NzogJ1JFUEVBVCcsXG4gIDEwNzUyOiAnUE9MWUdPTl9PRkZTRVRfVU5JVFMnLFxuICAxNjM4NDogJ0NPTE9SX0JVRkZFUl9CSVQnLFxuICAzMjc2OTogJ0NPTlNUQU5UX0NPTE9SJyxcbiAgMzI3NzA6ICdPTkVfTUlOVVNfQ09OU1RBTlRfQ09MT1InLFxuICAzMjc3MTogJ0NPTlNUQU5UX0FMUEhBJyxcbiAgMzI3NzI6ICdPTkVfTUlOVVNfQ09OU1RBTlRfQUxQSEEnLFxuICAzMjc3MzogJ0JMRU5EX0NPTE9SJyxcbiAgMzI3NzQ6ICdGVU5DX0FERCcsXG4gIDMyNzc3OiAnQkxFTkRfRVFVQVRJT05fUkdCJyxcbiAgMzI3Nzg6ICdGVU5DX1NVQlRSQUNUJyxcbiAgMzI3Nzk6ICdGVU5DX1JFVkVSU0VfU1VCVFJBQ1QnLFxuICAzMjgxOTogJ1VOU0lHTkVEX1NIT1JUXzRfNF80XzQnLFxuICAzMjgyMDogJ1VOU0lHTkVEX1NIT1JUXzVfNV81XzEnLFxuICAzMjgyMzogJ1BPTFlHT05fT0ZGU0VUX0ZJTEwnLFxuICAzMjgyNDogJ1BPTFlHT05fT0ZGU0VUX0ZBQ1RPUicsXG4gIDMyODU0OiAnUkdCQTQnLFxuICAzMjg1NTogJ1JHQjVfQTEnLFxuICAzMjg3MzogJ1RFWFRVUkVfQklORElOR18yRCcsXG4gIDMyOTI2OiAnU0FNUExFX0FMUEhBX1RPX0NPVkVSQUdFJyxcbiAgMzI5Mjg6ICdTQU1QTEVfQ09WRVJBR0UnLFxuICAzMjkzNjogJ1NBTVBMRV9CVUZGRVJTJyxcbiAgMzI5Mzc6ICdTQU1QTEVTJyxcbiAgMzI5Mzg6ICdTQU1QTEVfQ09WRVJBR0VfVkFMVUUnLFxuICAzMjkzOTogJ1NBTVBMRV9DT1ZFUkFHRV9JTlZFUlQnLFxuICAzMjk2ODogJ0JMRU5EX0RTVF9SR0InLFxuICAzMjk2OTogJ0JMRU5EX1NSQ19SR0InLFxuICAzMjk3MDogJ0JMRU5EX0RTVF9BTFBIQScsXG4gIDMyOTcxOiAnQkxFTkRfU1JDX0FMUEhBJyxcbiAgMzMwNzE6ICdDTEFNUF9UT19FREdFJyxcbiAgMzMxNzA6ICdHRU5FUkFURV9NSVBNQVBfSElOVCcsXG4gIDMzMTg5OiAnREVQVEhfQ09NUE9ORU5UMTYnLFxuICAzMzMwNjogJ0RFUFRIX1NURU5DSUxfQVRUQUNITUVOVCcsXG4gIDMzNjM1OiAnVU5TSUdORURfU0hPUlRfNV82XzUnLFxuICAzMzY0ODogJ01JUlJPUkVEX1JFUEVBVCcsXG4gIDMzOTAxOiAnQUxJQVNFRF9QT0lOVF9TSVpFX1JBTkdFJyxcbiAgMzM5MDI6ICdBTElBU0VEX0xJTkVfV0lEVEhfUkFOR0UnLFxuICAzMzk4NDogJ1RFWFRVUkUwJyxcbiAgMzM5ODU6ICdURVhUVVJFMScsXG4gIDMzOTg2OiAnVEVYVFVSRTInLFxuICAzMzk4NzogJ1RFWFRVUkUzJyxcbiAgMzM5ODg6ICdURVhUVVJFNCcsXG4gIDMzOTg5OiAnVEVYVFVSRTUnLFxuICAzMzk5MDogJ1RFWFRVUkU2JyxcbiAgMzM5OTE6ICdURVhUVVJFNycsXG4gIDMzOTkyOiAnVEVYVFVSRTgnLFxuICAzMzk5MzogJ1RFWFRVUkU5JyxcbiAgMzM5OTQ6ICdURVhUVVJFMTAnLFxuICAzMzk5NTogJ1RFWFRVUkUxMScsXG4gIDMzOTk2OiAnVEVYVFVSRTEyJyxcbiAgMzM5OTc6ICdURVhUVVJFMTMnLFxuICAzMzk5ODogJ1RFWFRVUkUxNCcsXG4gIDMzOTk5OiAnVEVYVFVSRTE1JyxcbiAgMzQwMDA6ICdURVhUVVJFMTYnLFxuICAzNDAwMTogJ1RFWFRVUkUxNycsXG4gIDM0MDAyOiAnVEVYVFVSRTE4JyxcbiAgMzQwMDM6ICdURVhUVVJFMTknLFxuICAzNDAwNDogJ1RFWFRVUkUyMCcsXG4gIDM0MDA1OiAnVEVYVFVSRTIxJyxcbiAgMzQwMDY6ICdURVhUVVJFMjInLFxuICAzNDAwNzogJ1RFWFRVUkUyMycsXG4gIDM0MDA4OiAnVEVYVFVSRTI0JyxcbiAgMzQwMDk6ICdURVhUVVJFMjUnLFxuICAzNDAxMDogJ1RFWFRVUkUyNicsXG4gIDM0MDExOiAnVEVYVFVSRTI3JyxcbiAgMzQwMTI6ICdURVhUVVJFMjgnLFxuICAzNDAxMzogJ1RFWFRVUkUyOScsXG4gIDM0MDE0OiAnVEVYVFVSRTMwJyxcbiAgMzQwMTU6ICdURVhUVVJFMzEnLFxuICAzNDAxNjogJ0FDVElWRV9URVhUVVJFJyxcbiAgMzQwMjQ6ICdNQVhfUkVOREVSQlVGRkVSX1NJWkUnLFxuICAzNDA0MTogJ0RFUFRIX1NURU5DSUwnLFxuICAzNDA1NTogJ0lOQ1JfV1JBUCcsXG4gIDM0MDU2OiAnREVDUl9XUkFQJyxcbiAgMzQwNjc6ICdURVhUVVJFX0NVQkVfTUFQJyxcbiAgMzQwNjg6ICdURVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVAnLFxuICAzNDA2OTogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCcsXG4gIDM0MDcwOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YJyxcbiAgMzQwNzE6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1knLFxuICAzNDA3MjogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWScsXG4gIDM0MDczOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aJyxcbiAgMzQwNzQ6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1onLFxuICAzNDA3NjogJ01BWF9DVUJFX01BUF9URVhUVVJFX1NJWkUnLFxuICAzNDMzODogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfRU5BQkxFRCcsXG4gIDM0MzM5OiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9TSVpFJyxcbiAgMzQzNDA6ICdWRVJURVhfQVRUUklCX0FSUkFZX1NUUklERScsXG4gIDM0MzQxOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9UWVBFJyxcbiAgMzQzNDI6ICdDVVJSRU5UX1ZFUlRFWF9BVFRSSUInLFxuICAzNDM3MzogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfUE9JTlRFUicsXG4gIDM0NDY2OiAnTlVNX0NPTVBSRVNTRURfVEVYVFVSRV9GT1JNQVRTJyxcbiAgMzQ0Njc6ICdDT01QUkVTU0VEX1RFWFRVUkVfRk9STUFUUycsXG4gIDM0NjYwOiAnQlVGRkVSX1NJWkUnLFxuICAzNDY2MTogJ0JVRkZFUl9VU0FHRScsXG4gIDM0ODE2OiAnU1RFTkNJTF9CQUNLX0ZVTkMnLFxuICAzNDgxNzogJ1NURU5DSUxfQkFDS19GQUlMJyxcbiAgMzQ4MTg6ICdTVEVOQ0lMX0JBQ0tfUEFTU19ERVBUSF9GQUlMJyxcbiAgMzQ4MTk6ICdTVEVOQ0lMX0JBQ0tfUEFTU19ERVBUSF9QQVNTJyxcbiAgMzQ4Nzc6ICdCTEVORF9FUVVBVElPTl9BTFBIQScsXG4gIDM0OTIxOiAnTUFYX1ZFUlRFWF9BVFRSSUJTJyxcbiAgMzQ5MjI6ICdWRVJURVhfQVRUUklCX0FSUkFZX05PUk1BTElaRUQnLFxuICAzNDkzMDogJ01BWF9URVhUVVJFX0lNQUdFX1VOSVRTJyxcbiAgMzQ5NjI6ICdBUlJBWV9CVUZGRVInLFxuICAzNDk2MzogJ0VMRU1FTlRfQVJSQVlfQlVGRkVSJyxcbiAgMzQ5NjQ6ICdBUlJBWV9CVUZGRVJfQklORElORycsXG4gIDM0OTY1OiAnRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORycsXG4gIDM0OTc1OiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9CVUZGRVJfQklORElORycsXG4gIDM1MDQwOiAnU1RSRUFNX0RSQVcnLFxuICAzNTA0NDogJ1NUQVRJQ19EUkFXJyxcbiAgMzUwNDg6ICdEWU5BTUlDX0RSQVcnLFxuICAzNTYzMjogJ0ZSQUdNRU5UX1NIQURFUicsXG4gIDM1NjMzOiAnVkVSVEVYX1NIQURFUicsXG4gIDM1NjYwOiAnTUFYX1ZFUlRFWF9URVhUVVJFX0lNQUdFX1VOSVRTJyxcbiAgMzU2NjE6ICdNQVhfQ09NQklORURfVEVYVFVSRV9JTUFHRV9VTklUUycsXG4gIDM1NjYzOiAnU0hBREVSX1RZUEUnLFxuICAzNTY2NDogJ0ZMT0FUX1ZFQzInLFxuICAzNTY2NTogJ0ZMT0FUX1ZFQzMnLFxuICAzNTY2NjogJ0ZMT0FUX1ZFQzQnLFxuICAzNTY2NzogJ0lOVF9WRUMyJyxcbiAgMzU2Njg6ICdJTlRfVkVDMycsXG4gIDM1NjY5OiAnSU5UX1ZFQzQnLFxuICAzNTY3MDogJ0JPT0wnLFxuICAzNTY3MTogJ0JPT0xfVkVDMicsXG4gIDM1NjcyOiAnQk9PTF9WRUMzJyxcbiAgMzU2NzM6ICdCT09MX1ZFQzQnLFxuICAzNTY3NDogJ0ZMT0FUX01BVDInLFxuICAzNTY3NTogJ0ZMT0FUX01BVDMnLFxuICAzNTY3NjogJ0ZMT0FUX01BVDQnLFxuICAzNTY3ODogJ1NBTVBMRVJfMkQnLFxuICAzNTY4MDogJ1NBTVBMRVJfQ1VCRScsXG4gIDM1NzEyOiAnREVMRVRFX1NUQVRVUycsXG4gIDM1NzEzOiAnQ09NUElMRV9TVEFUVVMnLFxuICAzNTcxNDogJ0xJTktfU1RBVFVTJyxcbiAgMzU3MTU6ICdWQUxJREFURV9TVEFUVVMnLFxuICAzNTcxNjogJ0lORk9fTE9HX0xFTkdUSCcsXG4gIDM1NzE3OiAnQVRUQUNIRURfU0hBREVSUycsXG4gIDM1NzE4OiAnQUNUSVZFX1VOSUZPUk1TJyxcbiAgMzU3MTk6ICdBQ1RJVkVfVU5JRk9STV9NQVhfTEVOR1RIJyxcbiAgMzU3MjA6ICdTSEFERVJfU09VUkNFX0xFTkdUSCcsXG4gIDM1NzIxOiAnQUNUSVZFX0FUVFJJQlVURVMnLFxuICAzNTcyMjogJ0FDVElWRV9BVFRSSUJVVEVfTUFYX0xFTkdUSCcsXG4gIDM1NzI0OiAnU0hBRElOR19MQU5HVUFHRV9WRVJTSU9OJyxcbiAgMzU3MjU6ICdDVVJSRU5UX1BST0dSQU0nLFxuICAzNjAwMzogJ1NURU5DSUxfQkFDS19SRUYnLFxuICAzNjAwNDogJ1NURU5DSUxfQkFDS19WQUxVRV9NQVNLJyxcbiAgMzYwMDU6ICdTVEVOQ0lMX0JBQ0tfV1JJVEVNQVNLJyxcbiAgMzYwMDY6ICdGUkFNRUJVRkZFUl9CSU5ESU5HJyxcbiAgMzYwMDc6ICdSRU5ERVJCVUZGRVJfQklORElORycsXG4gIDM2MDQ4OiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfVFlQRScsXG4gIDM2MDQ5OiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfTkFNRScsXG4gIDM2MDUwOiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0xFVkVMJyxcbiAgMzYwNTE6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfQ1VCRV9NQVBfRkFDRScsXG4gIDM2MDUzOiAnRlJBTUVCVUZGRVJfQ09NUExFVEUnLFxuICAzNjA1NDogJ0ZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVCcsXG4gIDM2MDU1OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlQnLFxuICAzNjA1NzogJ0ZSQU1FQlVGRkVSX0lOQ09NUExFVEVfRElNRU5TSU9OUycsXG4gIDM2MDYxOiAnRlJBTUVCVUZGRVJfVU5TVVBQT1JURUQnLFxuICAzNjA2NDogJ0NPTE9SX0FUVEFDSE1FTlQwJyxcbiAgMzYwOTY6ICdERVBUSF9BVFRBQ0hNRU5UJyxcbiAgMzYxMjg6ICdTVEVOQ0lMX0FUVEFDSE1FTlQnLFxuICAzNjE2MDogJ0ZSQU1FQlVGRkVSJyxcbiAgMzYxNjE6ICdSRU5ERVJCVUZGRVInLFxuICAzNjE2MjogJ1JFTkRFUkJVRkZFUl9XSURUSCcsXG4gIDM2MTYzOiAnUkVOREVSQlVGRkVSX0hFSUdIVCcsXG4gIDM2MTY0OiAnUkVOREVSQlVGRkVSX0lOVEVSTkFMX0ZPUk1BVCcsXG4gIDM2MTY4OiAnU1RFTkNJTF9JTkRFWDgnLFxuICAzNjE3NjogJ1JFTkRFUkJVRkZFUl9SRURfU0laRScsXG4gIDM2MTc3OiAnUkVOREVSQlVGRkVSX0dSRUVOX1NJWkUnLFxuICAzNjE3ODogJ1JFTkRFUkJVRkZFUl9CTFVFX1NJWkUnLFxuICAzNjE3OTogJ1JFTkRFUkJVRkZFUl9BTFBIQV9TSVpFJyxcbiAgMzYxODA6ICdSRU5ERVJCVUZGRVJfREVQVEhfU0laRScsXG4gIDM2MTgxOiAnUkVOREVSQlVGRkVSX1NURU5DSUxfU0laRScsXG4gIDM2MTk0OiAnUkdCNTY1JyxcbiAgMzYzMzY6ICdMT1dfRkxPQVQnLFxuICAzNjMzNzogJ01FRElVTV9GTE9BVCcsXG4gIDM2MzM4OiAnSElHSF9GTE9BVCcsXG4gIDM2MzM5OiAnTE9XX0lOVCcsXG4gIDM2MzQwOiAnTUVESVVNX0lOVCcsXG4gIDM2MzQxOiAnSElHSF9JTlQnLFxuICAzNjM0NjogJ1NIQURFUl9DT01QSUxFUicsXG4gIDM2MzQ3OiAnTUFYX1ZFUlRFWF9VTklGT1JNX1ZFQ1RPUlMnLFxuICAzNjM0ODogJ01BWF9WQVJZSU5HX1ZFQ1RPUlMnLFxuICAzNjM0OTogJ01BWF9GUkFHTUVOVF9VTklGT1JNX1ZFQ1RPUlMnLFxuICAzNzQ0MDogJ1VOUEFDS19GTElQX1lfV0VCR0wnLFxuICAzNzQ0MTogJ1VOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCcsXG4gIDM3NDQyOiAnQ09OVEVYVF9MT1NUX1dFQkdMJyxcbiAgMzc0NDM6ICdVTlBBQ0tfQ09MT1JTUEFDRV9DT05WRVJTSU9OX1dFQkdMJyxcbiAgMzc0NDQ6ICdCUk9XU0VSX0RFRkFVTFRfV0VCR0wnXG59XG4iLCJ2YXIgZ2wxMCA9IHJlcXVpcmUoJy4vMS4wL251bWJlcnMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxvb2t1cENvbnN0YW50IChudW1iZXIpIHtcbiAgcmV0dXJuIGdsMTBbbnVtYmVyXVxufVxuIiwiXG52YXIgc3ByaW50ZiA9IHJlcXVpcmUoJ3NwcmludGYtanMnKS5zcHJpbnRmO1xudmFyIGdsQ29uc3RhbnRzID0gcmVxdWlyZSgnZ2wtY29uc3RhbnRzL2xvb2t1cCcpO1xudmFyIHNoYWRlck5hbWUgPSByZXF1aXJlKCdnbHNsLXNoYWRlci1uYW1lJyk7XG52YXIgYWRkTGluZU51bWJlcnMgPSByZXF1aXJlKCdhZGQtbGluZS1udW1iZXJzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZm9ybWF0Q29tcGlsZXJFcnJvcjtcblxuZnVuY3Rpb24gZm9ybWF0Q29tcGlsZXJFcnJvcihlcnJMb2csIHNyYywgdHlwZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5hbWUgPSBzaGFkZXJOYW1lKHNyYykgfHwgJ29mIHVua25vd24gbmFtZSAoc2VlIG5wbSBnbHNsLXNoYWRlci1uYW1lKSc7XG5cbiAgICB2YXIgdHlwZU5hbWUgPSAndW5rbm93biB0eXBlJztcbiAgICBpZiAodHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR5cGVOYW1lID0gdHlwZSA9PT0gZ2xDb25zdGFudHMuRlJBR01FTlRfU0hBREVSID8gJ2ZyYWdtZW50JyA6ICd2ZXJ0ZXgnXG4gICAgfVxuXG4gICAgdmFyIGxvbmdGb3JtID0gc3ByaW50ZignRXJyb3IgY29tcGlsaW5nICVzIHNoYWRlciAlczpcXG4nLCB0eXBlTmFtZSwgbmFtZSk7XG4gICAgdmFyIHNob3J0Rm9ybSA9IHNwcmludGYoXCIlcyVzXCIsIGxvbmdGb3JtLCBlcnJMb2cpO1xuXG4gICAgdmFyIGVycm9yU3RyaW5ncyA9IGVyckxvZy5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIGVycm9ycyA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlcnJvclN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVycm9yU3RyaW5nID0gZXJyb3JTdHJpbmdzW2ldO1xuICAgICAgICBpZiAoZXJyb3JTdHJpbmcgPT09ICcnKSBjb250aW51ZTtcbiAgICAgICAgdmFyIGxpbmVObyA9IHBhcnNlSW50KGVycm9yU3RyaW5nLnNwbGl0KCc6JylbMl0pO1xuICAgICAgICBpZiAoaXNOYU4obGluZU5vKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNwcmludGYoJ0NvdWxkIG5vdCBwYXJzZSBlcnJvcjogJXMnLCBlcnJvclN0cmluZykpO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yc1tsaW5lTm9dID0gZXJyb3JTdHJpbmc7XG4gICAgfVxuXG4gICAgdmFyIGxpbmVzID0gYWRkTGluZU51bWJlcnMoc3JjKS5zcGxpdCgnXFxuJyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghZXJyb3JzW2krM10gJiYgIWVycm9yc1tpKzJdICYmICFlcnJvcnNbaSsxXSkgY29udGludWU7XG4gICAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG4gICAgICAgIGxvbmdGb3JtICs9IGxpbmUgKyAnXFxuJztcbiAgICAgICAgaWYgKGVycm9yc1tpKzFdKSB7XG4gICAgICAgICAgICB2YXIgZSA9IGVycm9yc1tpKzFdO1xuICAgICAgICAgICAgZSA9IGUuc3Vic3RyKGUuc3BsaXQoJzonLCAzKS5qb2luKCc6JykubGVuZ3RoICsgMSkudHJpbSgpO1xuICAgICAgICAgICAgbG9uZ0Zvcm0gKz0gc3ByaW50ZignXl5eICVzXFxuXFxuJywgZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb25nOiBsb25nRm9ybS50cmltKCksXG4gICAgICAgIHNob3J0OiBzaG9ydEZvcm0udHJpbSgpXG4gICAgfTtcbn1cblxuIiwidmFyIHRva2VuaXplID0gcmVxdWlyZSgnZ2xzbC10b2tlbml6ZXInKVxudmFyIGF0b2IgICAgID0gcmVxdWlyZSgnYXRvYi1saXRlJylcblxubW9kdWxlLmV4cG9ydHMgPSBnZXROYW1lXG5cbmZ1bmN0aW9uIGdldE5hbWUoc3JjKSB7XG4gIHZhciB0b2tlbnMgPSBBcnJheS5pc0FycmF5KHNyYylcbiAgICA/IHNyY1xuICAgIDogdG9rZW5pemUoc3JjKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG4gICAgaWYgKHRva2VuLnR5cGUgIT09ICdwcmVwcm9jZXNzb3InKSBjb250aW51ZVxuICAgIHZhciBtYXRjaCA9IHRva2VuLmRhdGEubWF0Y2goL1xcI2RlZmluZVxccytTSEFERVJfTkFNRShfQjY0KT9cXHMrKC4rKSQvKVxuICAgIGlmICghbWF0Y2gpIGNvbnRpbnVlXG4gICAgaWYgKCFtYXRjaFsyXSkgY29udGludWVcblxuICAgIHZhciBiNjQgID0gbWF0Y2hbMV1cbiAgICB2YXIgbmFtZSA9IG1hdGNoWzJdXG5cbiAgICByZXR1cm4gKGI2NCA/IGF0b2IobmFtZSkgOiBuYW1lKS50cmltKClcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB0b2tlbml6ZVxuXG52YXIgbGl0ZXJhbHMgPSByZXF1aXJlKCcuL2xpYi9saXRlcmFscycpXG4gICwgb3BlcmF0b3JzID0gcmVxdWlyZSgnLi9saWIvb3BlcmF0b3JzJylcbiAgLCBidWlsdGlucyA9IHJlcXVpcmUoJy4vbGliL2J1aWx0aW5zJylcblxudmFyIE5PUk1BTCA9IDk5OSAgICAgICAgICAvLyA8LS0gbmV2ZXIgZW1pdHRlZFxuICAsIFRPS0VOID0gOTk5OSAgICAgICAgICAvLyA8LS0gbmV2ZXIgZW1pdHRlZFxuICAsIEJMT0NLX0NPTU1FTlQgPSAwXG4gICwgTElORV9DT01NRU5UID0gMVxuICAsIFBSRVBST0NFU1NPUiA9IDJcbiAgLCBPUEVSQVRPUiA9IDNcbiAgLCBJTlRFR0VSID0gNFxuICAsIEZMT0FUID0gNVxuICAsIElERU5UID0gNlxuICAsIEJVSUxUSU4gPSA3XG4gICwgS0VZV09SRCA9IDhcbiAgLCBXSElURVNQQUNFID0gOVxuICAsIEVPRiA9IDEwXG4gICwgSEVYID0gMTFcblxudmFyIG1hcCA9IFtcbiAgICAnYmxvY2stY29tbWVudCdcbiAgLCAnbGluZS1jb21tZW50J1xuICAsICdwcmVwcm9jZXNzb3InXG4gICwgJ29wZXJhdG9yJ1xuICAsICdpbnRlZ2VyJ1xuICAsICdmbG9hdCdcbiAgLCAnaWRlbnQnXG4gICwgJ2J1aWx0aW4nXG4gICwgJ2tleXdvcmQnXG4gICwgJ3doaXRlc3BhY2UnXG4gICwgJ2VvZidcbiAgLCAnaW50ZWdlcidcbl1cblxuZnVuY3Rpb24gdG9rZW5pemUoKSB7XG4gIHZhciBpID0gMFxuICAgICwgdG90YWwgPSAwXG4gICAgLCBtb2RlID0gTk9STUFMXG4gICAgLCBjXG4gICAgLCBsYXN0XG4gICAgLCBjb250ZW50ID0gW11cbiAgICAsIHRva2VucyA9IFtdXG4gICAgLCB0b2tlbl9pZHggPSAwXG4gICAgLCB0b2tlbl9vZmZzID0gMFxuICAgICwgbGluZSA9IDFcbiAgICAsIGNvbCA9IDBcbiAgICAsIHN0YXJ0ID0gMFxuICAgICwgaXNudW0gPSBmYWxzZVxuICAgICwgaXNvcGVyYXRvciA9IGZhbHNlXG4gICAgLCBpbnB1dCA9ICcnXG4gICAgLCBsZW5cblxuICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgIHRva2VucyA9IFtdXG4gICAgaWYgKGRhdGEgIT09IG51bGwpIHJldHVybiB3cml0ZShkYXRhKVxuICAgIHJldHVybiBlbmQoKVxuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW4oZGF0YSkge1xuICAgIGlmIChkYXRhLmxlbmd0aCkge1xuICAgICAgdG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiBtYXBbbW9kZV1cbiAgICAgICwgZGF0YTogZGF0YVxuICAgICAgLCBwb3NpdGlvbjogc3RhcnRcbiAgICAgICwgbGluZTogbGluZVxuICAgICAgLCBjb2x1bW46IGNvbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZShjaHVuaykge1xuICAgIGkgPSAwXG4gICAgaW5wdXQgKz0gY2h1bmtcbiAgICBsZW4gPSBpbnB1dC5sZW5ndGhcblxuICAgIHZhciBsYXN0XG5cbiAgICB3aGlsZShjID0gaW5wdXRbaV0sIGkgPCBsZW4pIHtcbiAgICAgIGxhc3QgPSBpXG5cbiAgICAgIHN3aXRjaChtb2RlKSB7XG4gICAgICAgIGNhc2UgQkxPQ0tfQ09NTUVOVDogaSA9IGJsb2NrX2NvbW1lbnQoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBMSU5FX0NPTU1FTlQ6IGkgPSBsaW5lX2NvbW1lbnQoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBQUkVQUk9DRVNTT1I6IGkgPSBwcmVwcm9jZXNzb3IoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBPUEVSQVRPUjogaSA9IG9wZXJhdG9yKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgSU5URUdFUjogaSA9IGludGVnZXIoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBIRVg6IGkgPSBoZXgoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBGTE9BVDogaSA9IGRlY2ltYWwoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBUT0tFTjogaSA9IHJlYWR0b2tlbigpOyBicmVha1xuICAgICAgICBjYXNlIFdISVRFU1BBQ0U6IGkgPSB3aGl0ZXNwYWNlKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgTk9STUFMOiBpID0gbm9ybWFsKCk7IGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGlmKGxhc3QgIT09IGkpIHtcbiAgICAgICAgc3dpdGNoKGlucHV0W2xhc3RdKSB7XG4gICAgICAgICAgY2FzZSAnXFxuJzogY29sID0gMDsgKytsaW5lOyBicmVha1xuICAgICAgICAgIGRlZmF1bHQ6ICsrY29sOyBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdG90YWwgKz0gaVxuICAgIGlucHV0ID0gaW5wdXQuc2xpY2UoaSlcbiAgICByZXR1cm4gdG9rZW5zXG4gIH1cblxuICBmdW5jdGlvbiBlbmQoY2h1bmspIHtcbiAgICBpZihjb250ZW50Lmxlbmd0aCkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICB9XG5cbiAgICBtb2RlID0gRU9GXG4gICAgdG9rZW4oJyhlb2YpJylcbiAgICByZXR1cm4gdG9rZW5zXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWwoKSB7XG4gICAgY29udGVudCA9IGNvbnRlbnQubGVuZ3RoID8gW10gOiBjb250ZW50XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJyonKSB7XG4gICAgICBzdGFydCA9IHRvdGFsICsgaSAtIDFcbiAgICAgIG1vZGUgPSBCTE9DS19DT01NRU5UXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcvJykge1xuICAgICAgc3RhcnQgPSB0b3RhbCArIGkgLSAxXG4gICAgICBtb2RlID0gTElORV9DT01NRU5UXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJyMnKSB7XG4gICAgICBtb2RlID0gUFJFUFJPQ0VTU09SXG4gICAgICBzdGFydCA9IHRvdGFsICsgaVxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZigvXFxzLy50ZXN0KGMpKSB7XG4gICAgICBtb2RlID0gV0hJVEVTUEFDRVxuICAgICAgc3RhcnQgPSB0b3RhbCArIGlcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaXNudW0gPSAvXFxkLy50ZXN0KGMpXG4gICAgaXNvcGVyYXRvciA9IC9bXlxcd19dLy50ZXN0KGMpXG5cbiAgICBzdGFydCA9IHRvdGFsICsgaVxuICAgIG1vZGUgPSBpc251bSA/IElOVEVHRVIgOiBpc29wZXJhdG9yID8gT1BFUkFUT1IgOiBUT0tFTlxuICAgIHJldHVybiBpXG4gIH1cblxuICBmdW5jdGlvbiB3aGl0ZXNwYWNlKCkge1xuICAgIGlmKC9bXlxcc10vZy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIHByZXByb2Nlc3NvcigpIHtcbiAgICBpZihjID09PSAnXFxuJyAmJiBsYXN0ICE9PSAnXFxcXCcpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gbGluZV9jb21tZW50KCkge1xuICAgIHJldHVybiBwcmVwcm9jZXNzb3IoKVxuICB9XG5cbiAgZnVuY3Rpb24gYmxvY2tfY29tbWVudCgpIHtcbiAgICBpZihjID09PSAnLycgJiYgbGFzdCA9PT0gJyonKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlcmF0b3IoKSB7XG4gICAgaWYobGFzdCA9PT0gJy4nICYmIC9cXGQvLnRlc3QoYykpIHtcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJyonKSB7XG4gICAgICBtb2RlID0gQkxPQ0tfQ09NTUVOVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJy8nKSB7XG4gICAgICBtb2RlID0gTElORV9DT01NRU5UXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGMgPT09ICcuJyAmJiBjb250ZW50Lmxlbmd0aCkge1xuICAgICAgd2hpbGUoZGV0ZXJtaW5lX29wZXJhdG9yKGNvbnRlbnQpKTtcblxuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGMgPT09ICc7JyB8fCBjID09PSAnKScgfHwgYyA9PT0gJygnKSB7XG4gICAgICBpZihjb250ZW50Lmxlbmd0aCkgd2hpbGUoZGV0ZXJtaW5lX29wZXJhdG9yKGNvbnRlbnQpKTtcbiAgICAgIHRva2VuKGMpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICB2YXIgaXNfY29tcG9zaXRlX29wZXJhdG9yID0gY29udGVudC5sZW5ndGggPT09IDIgJiYgYyAhPT0gJz0nXG4gICAgaWYoL1tcXHdfXFxkXFxzXS8udGVzdChjKSB8fCBpc19jb21wb3NpdGVfb3BlcmF0b3IpIHtcbiAgICAgIHdoaWxlKGRldGVybWluZV9vcGVyYXRvcihjb250ZW50KSk7XG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBkZXRlcm1pbmVfb3BlcmF0b3IoYnVmKSB7XG4gICAgdmFyIGogPSAwXG4gICAgICAsIGlkeFxuICAgICAgLCByZXNcblxuICAgIGRvIHtcbiAgICAgIGlkeCA9IG9wZXJhdG9ycy5pbmRleE9mKGJ1Zi5zbGljZSgwLCBidWYubGVuZ3RoICsgaikuam9pbignJykpXG4gICAgICByZXMgPSBvcGVyYXRvcnNbaWR4XVxuXG4gICAgICBpZihpZHggPT09IC0xKSB7XG4gICAgICAgIGlmKGotLSArIGJ1Zi5sZW5ndGggPiAwKSBjb250aW51ZVxuICAgICAgICByZXMgPSBidWYuc2xpY2UoMCwgMSkuam9pbignJylcbiAgICAgIH1cblxuICAgICAgdG9rZW4ocmVzKVxuXG4gICAgICBzdGFydCArPSByZXMubGVuZ3RoXG4gICAgICBjb250ZW50ID0gY29udGVudC5zbGljZShyZXMubGVuZ3RoKVxuICAgICAgcmV0dXJuIGNvbnRlbnQubGVuZ3RoXG4gICAgfSB3aGlsZSgxKVxuICB9XG5cbiAgZnVuY3Rpb24gaGV4KCkge1xuICAgIGlmKC9bXmEtZkEtRjAtOV0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBpbnRlZ2VyKCkge1xuICAgIGlmKGMgPT09ICcuJykge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZigvW2VFXS8udGVzdChjKSkge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihjID09PSAneCcgJiYgY29udGVudC5sZW5ndGggPT09IDEgJiYgY29udGVudFswXSA9PT0gJzAnKSB7XG4gICAgICBtb2RlID0gSEVYXG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZigvW15cXGRdLy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjaW1hbCgpIHtcbiAgICBpZihjID09PSAnZicpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIGkgKz0gMVxuICAgIH1cblxuICAgIGlmKC9bZUVdLy50ZXN0KGMpKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZigvW15cXGRdLy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWR0b2tlbigpIHtcbiAgICBpZigvW15cXGRcXHdfXS8udGVzdChjKSkge1xuICAgICAgdmFyIGNvbnRlbnRzdHIgPSBjb250ZW50LmpvaW4oJycpXG4gICAgICBpZihsaXRlcmFscy5pbmRleE9mKGNvbnRlbnRzdHIpID4gLTEpIHtcbiAgICAgICAgbW9kZSA9IEtFWVdPUkRcbiAgICAgIH0gZWxzZSBpZihidWlsdGlucy5pbmRleE9mKGNvbnRlbnRzdHIpID4gLTEpIHtcbiAgICAgICAgbW9kZSA9IEJVSUxUSU5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZGUgPSBJREVOVFxuICAgICAgfVxuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAgICdnbF9Qb3NpdGlvbidcbiAgLCAnZ2xfUG9pbnRTaXplJ1xuICAsICdnbF9DbGlwVmVydGV4J1xuICAsICdnbF9GcmFnQ29vcmQnXG4gICwgJ2dsX0Zyb250RmFjaW5nJ1xuICAsICdnbF9GcmFnQ29sb3InXG4gICwgJ2dsX0ZyYWdEYXRhJ1xuICAsICdnbF9GcmFnRGVwdGgnXG4gICwgJ2dsX0NvbG9yJ1xuICAsICdnbF9TZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfTm9ybWFsJ1xuICAsICdnbF9WZXJ0ZXgnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQwJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMSdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDInXG4gICwgJ2dsX011bHRpVGV4Q29vcmQzJ1xuICAsICdnbF9NdWx0aVRleENvb3JkNCdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDUnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ2J1xuICAsICdnbF9NdWx0aVRleENvb3JkNydcbiAgLCAnZ2xfRm9nQ29vcmQnXG4gICwgJ2dsX01heExpZ2h0cydcbiAgLCAnZ2xfTWF4Q2xpcFBsYW5lcydcbiAgLCAnZ2xfTWF4VGV4dHVyZVVuaXRzJ1xuICAsICdnbF9NYXhUZXh0dXJlQ29vcmRzJ1xuICAsICdnbF9NYXhWZXJ0ZXhBdHRyaWJzJ1xuICAsICdnbF9NYXhWZXJ0ZXhVbmlmb3JtQ29tcG9uZW50cydcbiAgLCAnZ2xfTWF4VmFyeWluZ0Zsb2F0cydcbiAgLCAnZ2xfTWF4VmVydGV4VGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heENvbWJpbmVkVGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhGcmFnbWVudFVuaWZvcm1Db21wb25lbnRzJ1xuICAsICdnbF9NYXhEcmF3QnVmZmVycydcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4J1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4J1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4J1xuICAsICdnbF9UZXh0dXJlTWF0cml4J1xuICAsICdnbF9Ob3JtYWxNYXRyaXgnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeEludmVyc2UnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeEludmVyc2UnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfTm9ybWFsU2NhbGUnXG4gICwgJ2dsX0RlcHRoUmFuZ2VQYXJhbWV0ZXJzJ1xuICAsICdnbF9EZXB0aFJhbmdlJ1xuICAsICdnbF9DbGlwUGxhbmUnXG4gICwgJ2dsX1BvaW50UGFyYW1ldGVycydcbiAgLCAnZ2xfUG9pbnQnXG4gICwgJ2dsX01hdGVyaWFsUGFyYW1ldGVycydcbiAgLCAnZ2xfRnJvbnRNYXRlcmlhbCdcbiAgLCAnZ2xfQmFja01hdGVyaWFsJ1xuICAsICdnbF9MaWdodFNvdXJjZVBhcmFtZXRlcnMnXG4gICwgJ2dsX0xpZ2h0U291cmNlJ1xuICAsICdnbF9MaWdodE1vZGVsUGFyYW1ldGVycydcbiAgLCAnZ2xfTGlnaHRNb2RlbCdcbiAgLCAnZ2xfTGlnaHRNb2RlbFByb2R1Y3RzJ1xuICAsICdnbF9Gcm9udExpZ2h0TW9kZWxQcm9kdWN0J1xuICAsICdnbF9CYWNrTGlnaHRNb2RlbFByb2R1Y3QnXG4gICwgJ2dsX0xpZ2h0UHJvZHVjdHMnXG4gICwgJ2dsX0Zyb250TGlnaHRQcm9kdWN0J1xuICAsICdnbF9CYWNrTGlnaHRQcm9kdWN0J1xuICAsICdnbF9Gb2dQYXJhbWV0ZXJzJ1xuICAsICdnbF9Gb2cnXG4gICwgJ2dsX1RleHR1cmVFbnZDb2xvcidcbiAgLCAnZ2xfRXllUGxhbmVTJ1xuICAsICdnbF9FeWVQbGFuZVQnXG4gICwgJ2dsX0V5ZVBsYW5lUidcbiAgLCAnZ2xfRXllUGxhbmVRJ1xuICAsICdnbF9PYmplY3RQbGFuZVMnXG4gICwgJ2dsX09iamVjdFBsYW5lVCdcbiAgLCAnZ2xfT2JqZWN0UGxhbmVSJ1xuICAsICdnbF9PYmplY3RQbGFuZVEnXG4gICwgJ2dsX0Zyb250Q29sb3InXG4gICwgJ2dsX0JhY2tDb2xvcidcbiAgLCAnZ2xfRnJvbnRTZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfQmFja1NlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9UZXhDb29yZCdcbiAgLCAnZ2xfRm9nRnJhZ0Nvb3JkJ1xuICAsICdnbF9Db2xvcidcbiAgLCAnZ2xfU2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX1RleENvb3JkJ1xuICAsICdnbF9Gb2dGcmFnQ29vcmQnXG4gICwgJ2dsX1BvaW50Q29vcmQnXG4gICwgJ3JhZGlhbnMnXG4gICwgJ2RlZ3JlZXMnXG4gICwgJ3NpbidcbiAgLCAnY29zJ1xuICAsICd0YW4nXG4gICwgJ2FzaW4nXG4gICwgJ2Fjb3MnXG4gICwgJ2F0YW4nXG4gICwgJ3BvdydcbiAgLCAnZXhwJ1xuICAsICdsb2cnXG4gICwgJ2V4cDInXG4gICwgJ2xvZzInXG4gICwgJ3NxcnQnXG4gICwgJ2ludmVyc2VzcXJ0J1xuICAsICdhYnMnXG4gICwgJ3NpZ24nXG4gICwgJ2Zsb29yJ1xuICAsICdjZWlsJ1xuICAsICdmcmFjdCdcbiAgLCAnbW9kJ1xuICAsICdtaW4nXG4gICwgJ21heCdcbiAgLCAnY2xhbXAnXG4gICwgJ21peCdcbiAgLCAnc3RlcCdcbiAgLCAnc21vb3Roc3RlcCdcbiAgLCAnbGVuZ3RoJ1xuICAsICdkaXN0YW5jZSdcbiAgLCAnZG90J1xuICAsICdjcm9zcydcbiAgLCAnbm9ybWFsaXplJ1xuICAsICdmYWNlZm9yd2FyZCdcbiAgLCAncmVmbGVjdCdcbiAgLCAncmVmcmFjdCdcbiAgLCAnbWF0cml4Q29tcE11bHQnXG4gICwgJ2xlc3NUaGFuJ1xuICAsICdsZXNzVGhhbkVxdWFsJ1xuICAsICdncmVhdGVyVGhhbidcbiAgLCAnZ3JlYXRlclRoYW5FcXVhbCdcbiAgLCAnZXF1YWwnXG4gICwgJ25vdEVxdWFsJ1xuICAsICdhbnknXG4gICwgJ2FsbCdcbiAgLCAnbm90J1xuICAsICd0ZXh0dXJlMkQnXG4gICwgJ3RleHR1cmUyRFByb2onXG4gICwgJ3RleHR1cmUyRExvZCdcbiAgLCAndGV4dHVyZTJEUHJvakxvZCdcbiAgLCAndGV4dHVyZUN1YmUnXG4gICwgJ3RleHR1cmVDdWJlTG9kJ1xuICAsICdkRmR4J1xuICAsICdkRmR5J1xuXVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIC8vIGN1cnJlbnRcbiAgICAncHJlY2lzaW9uJ1xuICAsICdoaWdocCdcbiAgLCAnbWVkaXVtcCdcbiAgLCAnbG93cCdcbiAgLCAnYXR0cmlidXRlJ1xuICAsICdjb25zdCdcbiAgLCAndW5pZm9ybSdcbiAgLCAndmFyeWluZydcbiAgLCAnYnJlYWsnXG4gICwgJ2NvbnRpbnVlJ1xuICAsICdkbydcbiAgLCAnZm9yJ1xuICAsICd3aGlsZSdcbiAgLCAnaWYnXG4gICwgJ2Vsc2UnXG4gICwgJ2luJ1xuICAsICdvdXQnXG4gICwgJ2lub3V0J1xuICAsICdmbG9hdCdcbiAgLCAnaW50J1xuICAsICd2b2lkJ1xuICAsICdib29sJ1xuICAsICd0cnVlJ1xuICAsICdmYWxzZSdcbiAgLCAnZGlzY2FyZCdcbiAgLCAncmV0dXJuJ1xuICAsICdtYXQyJ1xuICAsICdtYXQzJ1xuICAsICdtYXQ0J1xuICAsICd2ZWMyJ1xuICAsICd2ZWMzJ1xuICAsICd2ZWM0J1xuICAsICdpdmVjMidcbiAgLCAnaXZlYzMnXG4gICwgJ2l2ZWM0J1xuICAsICdidmVjMidcbiAgLCAnYnZlYzMnXG4gICwgJ2J2ZWM0J1xuICAsICdzYW1wbGVyMUQnXG4gICwgJ3NhbXBsZXIyRCdcbiAgLCAnc2FtcGxlcjNEJ1xuICAsICdzYW1wbGVyQ3ViZSdcbiAgLCAnc2FtcGxlcjFEU2hhZG93J1xuICAsICdzYW1wbGVyMkRTaGFkb3cnXG4gICwgJ3N0cnVjdCdcblxuICAvLyBmdXR1cmVcbiAgLCAnYXNtJ1xuICAsICdjbGFzcydcbiAgLCAndW5pb24nXG4gICwgJ2VudW0nXG4gICwgJ3R5cGVkZWYnXG4gICwgJ3RlbXBsYXRlJ1xuICAsICd0aGlzJ1xuICAsICdwYWNrZWQnXG4gICwgJ2dvdG8nXG4gICwgJ3N3aXRjaCdcbiAgLCAnZGVmYXVsdCdcbiAgLCAnaW5saW5lJ1xuICAsICdub2lubGluZSdcbiAgLCAndm9sYXRpbGUnXG4gICwgJ3B1YmxpYydcbiAgLCAnc3RhdGljJ1xuICAsICdleHRlcm4nXG4gICwgJ2V4dGVybmFsJ1xuICAsICdpbnRlcmZhY2UnXG4gICwgJ2xvbmcnXG4gICwgJ3Nob3J0J1xuICAsICdkb3VibGUnXG4gICwgJ2hhbGYnXG4gICwgJ2ZpeGVkJ1xuICAsICd1bnNpZ25lZCdcbiAgLCAnaW5wdXQnXG4gICwgJ291dHB1dCdcbiAgLCAnaHZlYzInXG4gICwgJ2h2ZWMzJ1xuICAsICdodmVjNCdcbiAgLCAnZHZlYzInXG4gICwgJ2R2ZWMzJ1xuICAsICdkdmVjNCdcbiAgLCAnZnZlYzInXG4gICwgJ2Z2ZWMzJ1xuICAsICdmdmVjNCdcbiAgLCAnc2FtcGxlcjJEUmVjdCdcbiAgLCAnc2FtcGxlcjNEUmVjdCdcbiAgLCAnc2FtcGxlcjJEUmVjdFNoYWRvdydcbiAgLCAnc2l6ZW9mJ1xuICAsICdjYXN0J1xuICAsICduYW1lc3BhY2UnXG4gICwgJ3VzaW5nJ1xuXVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICAgJzw8PSdcbiAgLCAnPj49J1xuICAsICcrKydcbiAgLCAnLS0nXG4gICwgJzw8J1xuICAsICc+PidcbiAgLCAnPD0nXG4gICwgJz49J1xuICAsICc9PSdcbiAgLCAnIT0nXG4gICwgJyYmJ1xuICAsICd8fCdcbiAgLCAnKz0nXG4gICwgJy09J1xuICAsICcqPSdcbiAgLCAnLz0nXG4gICwgJyU9J1xuICAsICcmPSdcbiAgLCAnXl4nXG4gICwgJ149J1xuICAsICd8PSdcbiAgLCAnKCdcbiAgLCAnKSdcbiAgLCAnWydcbiAgLCAnXSdcbiAgLCAnLidcbiAgLCAnISdcbiAgLCAnfidcbiAgLCAnKidcbiAgLCAnLydcbiAgLCAnJSdcbiAgLCAnKydcbiAgLCAnLSdcbiAgLCAnPCdcbiAgLCAnPidcbiAgLCAnJidcbiAgLCAnXidcbiAgLCAnfCdcbiAgLCAnPydcbiAgLCAnOidcbiAgLCAnPSdcbiAgLCAnLCdcbiAgLCAnOydcbiAgLCAneydcbiAgLCAnfSdcbl1cbiIsInZhciB0b2tlbml6ZSA9IHJlcXVpcmUoJy4vaW5kZXgnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRva2VuaXplU3RyaW5nXG5cbmZ1bmN0aW9uIHRva2VuaXplU3RyaW5nKHN0cikge1xuICB2YXIgZ2VuZXJhdG9yID0gdG9rZW5pemUoKVxuICB2YXIgdG9rZW5zID0gW11cblxuICB0b2tlbnMgPSB0b2tlbnMuY29uY2F0KGdlbmVyYXRvcihzdHIpKVxuICB0b2tlbnMgPSB0b2tlbnMuY29uY2F0KGdlbmVyYXRvcihudWxsKSlcblxuICByZXR1cm4gdG9rZW5zXG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8qIVxuICogcmVwZWF0LXN0cmluZyA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvcmVwZWF0LXN0cmluZz5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEV4cG9zZSBgcmVwZWF0YFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gcmVwZWF0O1xuXG4vKipcbiAqIFJlcGVhdCB0aGUgZ2l2ZW4gYHN0cmluZ2AgdGhlIHNwZWNpZmllZCBgbnVtYmVyYFxuICogb2YgdGltZXMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKlxuICogYGBganNcbiAqIHZhciByZXBlYXQgPSByZXF1aXJlKCdyZXBlYXQtc3RyaW5nJyk7XG4gKiByZXBlYXQoJ0EnLCA1KTtcbiAqIC8vPT4gQUFBQUFcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBgc3RyaW5nYCBUaGUgc3RyaW5nIHRvIHJlcGVhdFxuICogQHBhcmFtIHtOdW1iZXJ9IGBudW1iZXJgIFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gUmVwZWF0ZWQgc3RyaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHJlcGVhdChzdHIsIG51bSkge1xuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdyZXBlYXQtc3RyaW5nIGV4cGVjdHMgYSBzdHJpbmcuJyk7XG4gIH1cblxuICBpZiAobnVtID09PSAxKSByZXR1cm4gc3RyO1xuICBpZiAobnVtID09PSAyKSByZXR1cm4gc3RyICsgc3RyO1xuXG4gIHZhciBtYXggPSBzdHIubGVuZ3RoICogbnVtO1xuICBpZiAoY2FjaGUgIT09IHN0ciB8fCB0eXBlb2YgY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY2FjaGUgPSBzdHI7XG4gICAgcmVzID0gJyc7XG4gIH1cblxuICB3aGlsZSAobWF4ID4gcmVzLmxlbmd0aCAmJiBudW0gPiAwKSB7XG4gICAgaWYgKG51bSAmIDEpIHtcbiAgICAgIHJlcyArPSBzdHI7XG4gICAgfVxuXG4gICAgbnVtID4+PSAxO1xuICAgIGlmICghbnVtKSBicmVhaztcbiAgICBzdHIgKz0gc3RyO1xuICB9XG5cbiAgcmV0dXJuIHJlcy5zdWJzdHIoMCwgbWF4KTtcbn1cblxuLyoqXG4gKiBSZXN1bHRzIGNhY2hlXG4gKi9cblxudmFyIHJlcyA9ICcnO1xudmFyIGNhY2hlO1xuIiwiKGZ1bmN0aW9uKHdpbmRvdykge1xuICAgIHZhciByZSA9IHtcbiAgICAgICAgbm90X3N0cmluZzogL1tec10vLFxuICAgICAgICBudW1iZXI6IC9bZGllZmddLyxcbiAgICAgICAganNvbjogL1tqXS8sXG4gICAgICAgIG5vdF9qc29uOiAvW15qXS8sXG4gICAgICAgIHRleHQ6IC9eW15cXHgyNV0rLyxcbiAgICAgICAgbW9kdWxvOiAvXlxceDI1ezJ9LyxcbiAgICAgICAgcGxhY2Vob2xkZXI6IC9eXFx4MjUoPzooWzEtOV1cXGQqKVxcJHxcXCgoW15cXCldKylcXCkpPyhcXCspPygwfCdbXiRdKT8oLSk/KFxcZCspPyg/OlxcLihcXGQrKSk/KFtiLWdpam9zdXhYXSkvLFxuICAgICAgICBrZXk6IC9eKFthLXpfXVthLXpfXFxkXSopL2ksXG4gICAgICAgIGtleV9hY2Nlc3M6IC9eXFwuKFthLXpfXVthLXpfXFxkXSopL2ksXG4gICAgICAgIGluZGV4X2FjY2VzczogL15cXFsoXFxkKylcXF0vLFxuICAgICAgICBzaWduOiAvXltcXCtcXC1dL1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNwcmludGYoKSB7XG4gICAgICAgIHZhciBrZXkgPSBhcmd1bWVudHNbMF0sIGNhY2hlID0gc3ByaW50Zi5jYWNoZVxuICAgICAgICBpZiAoIShjYWNoZVtrZXldICYmIGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpKSB7XG4gICAgICAgICAgICBjYWNoZVtrZXldID0gc3ByaW50Zi5wYXJzZShrZXkpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNwcmludGYuZm9ybWF0LmNhbGwobnVsbCwgY2FjaGVba2V5XSwgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIHNwcmludGYuZm9ybWF0ID0gZnVuY3Rpb24ocGFyc2VfdHJlZSwgYXJndikge1xuICAgICAgICB2YXIgY3Vyc29yID0gMSwgdHJlZV9sZW5ndGggPSBwYXJzZV90cmVlLmxlbmd0aCwgbm9kZV90eXBlID0gXCJcIiwgYXJnLCBvdXRwdXQgPSBbXSwgaSwgaywgbWF0Y2gsIHBhZCwgcGFkX2NoYXJhY3RlciwgcGFkX2xlbmd0aCwgaXNfcG9zaXRpdmUgPSB0cnVlLCBzaWduID0gXCJcIlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdHJlZV9sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZV90eXBlID0gZ2V0X3R5cGUocGFyc2VfdHJlZVtpXSlcbiAgICAgICAgICAgIGlmIChub2RlX3R5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBwYXJzZV90cmVlW2ldXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChub2RlX3R5cGUgPT09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgICAgIG1hdGNoID0gcGFyc2VfdHJlZVtpXSAvLyBjb252ZW5pZW5jZSBwdXJwb3NlcyBvbmx5XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoWzJdKSB7IC8vIGtleXdvcmQgYXJndW1lbnRcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3JdXG4gICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCBtYXRjaFsyXS5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhcmcuaGFzT3duUHJvcGVydHkobWF0Y2hbMl1ba10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNwcmludGYoXCJbc3ByaW50Zl0gcHJvcGVydHkgJyVzJyBkb2VzIG5vdCBleGlzdFwiLCBtYXRjaFsyXVtrXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmdbbWF0Y2hbMl1ba11dXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWF0Y2hbMV0pIHsgLy8gcG9zaXRpb25hbCBhcmd1bWVudCAoZXhwbGljaXQpXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbbWF0Y2hbMV1dXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChpbXBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3IrK11cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZ2V0X3R5cGUoYXJnKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubm90X3N0cmluZy50ZXN0KG1hdGNoWzhdKSAmJiByZS5ub3RfanNvbi50ZXN0KG1hdGNoWzhdKSAmJiAoZ2V0X3R5cGUoYXJnKSAhPSBcIm51bWJlclwiICYmIGlzTmFOKGFyZykpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc3ByaW50ZihcIltzcHJpbnRmXSBleHBlY3RpbmcgbnVtYmVyIGJ1dCBmb3VuZCAlc1wiLCBnZXRfdHlwZShhcmcpKSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubnVtYmVyLnRlc3QobWF0Y2hbOF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzX3Bvc2l0aXZlID0gYXJnID49IDBcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG1hdGNoWzhdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJiXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoMilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gcGFyc2VJbnQoYXJnLCAxMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IEpTT04uc3RyaW5naWZ5KGFyZywgbnVsbCwgbWF0Y2hbNl0gPyBwYXJzZUludChtYXRjaFs2XSkgOiAwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gbWF0Y2hbN10gPyBhcmcudG9FeHBvbmVudGlhbChtYXRjaFs3XSkgOiBhcmcudG9FeHBvbmVudGlhbCgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IHBhcnNlRmxvYXQoYXJnKS50b0ZpeGVkKG1hdGNoWzddKSA6IHBhcnNlRmxvYXQoYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZ1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gbWF0Y2hbN10gPyBwYXJzZUZsb2F0KGFyZykudG9QcmVjaXNpb24obWF0Y2hbN10pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoOClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9ICgoYXJnID0gU3RyaW5nKGFyZykpICYmIG1hdGNoWzddID8gYXJnLnN1YnN0cmluZygwLCBtYXRjaFs3XSkgOiBhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcgPj4+IDBcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygxNilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygxNikudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmUuanNvbi50ZXN0KG1hdGNoWzhdKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBhcmdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChtYXRjaFs4XSkgJiYgKCFpc19wb3NpdGl2ZSB8fCBtYXRjaFszXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ24gPSBpc19wb3NpdGl2ZSA/IFwiK1wiIDogXCItXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygpLnJlcGxhY2UocmUuc2lnbiwgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ24gPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFkX2NoYXJhY3RlciA9IG1hdGNoWzRdID8gbWF0Y2hbNF0gPT09IFwiMFwiID8gXCIwXCIgOiBtYXRjaFs0XS5jaGFyQXQoMSkgOiBcIiBcIlxuICAgICAgICAgICAgICAgICAgICBwYWRfbGVuZ3RoID0gbWF0Y2hbNl0gLSAoc2lnbiArIGFyZykubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHBhZCA9IG1hdGNoWzZdID8gKHBhZF9sZW5ndGggPiAwID8gc3RyX3JlcGVhdChwYWRfY2hhcmFjdGVyLCBwYWRfbGVuZ3RoKSA6IFwiXCIpIDogXCJcIlxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBtYXRjaFs1XSA/IHNpZ24gKyBhcmcgKyBwYWQgOiAocGFkX2NoYXJhY3RlciA9PT0gXCIwXCIgPyBzaWduICsgcGFkICsgYXJnIDogcGFkICsgc2lnbiArIGFyZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXCIpXG4gICAgfVxuXG4gICAgc3ByaW50Zi5jYWNoZSA9IHt9XG5cbiAgICBzcHJpbnRmLnBhcnNlID0gZnVuY3Rpb24oZm10KSB7XG4gICAgICAgIHZhciBfZm10ID0gZm10LCBtYXRjaCA9IFtdLCBwYXJzZV90cmVlID0gW10sIGFyZ19uYW1lcyA9IDBcbiAgICAgICAgd2hpbGUgKF9mbXQpIHtcbiAgICAgICAgICAgIGlmICgobWF0Y2ggPSByZS50ZXh0LmV4ZWMoX2ZtdCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBtYXRjaFswXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUubW9kdWxvLmV4ZWMoX2ZtdCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBcIiVcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUucGxhY2Vob2xkZXIuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDFcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkX2xpc3QgPSBbXSwgcmVwbGFjZW1lbnRfZmllbGQgPSBtYXRjaFsyXSwgZmllbGRfbWF0Y2ggPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5LmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdFtmaWVsZF9saXN0Lmxlbmd0aF0gPSBmaWVsZF9tYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChyZXBsYWNlbWVudF9maWVsZCA9IHJlcGxhY2VtZW50X2ZpZWxkLnN1YnN0cmluZyhmaWVsZF9tYXRjaFswXS5sZW5ndGgpKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZmllbGRfbWF0Y2ggPSByZS5rZXlfYWNjZXNzLmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKChmaWVsZF9tYXRjaCA9IHJlLmluZGV4X2FjY2Vzcy5leGVjKHJlcGxhY2VtZW50X2ZpZWxkKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdFtmaWVsZF9saXN0Lmxlbmd0aF0gPSBmaWVsZF9tYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXlcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJbc3ByaW50Zl0gZmFpbGVkIHRvIHBhcnNlIG5hbWVkIGFyZ3VtZW50IGtleVwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gZmllbGRfbGlzdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ19uYW1lcyA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJbc3ByaW50Zl0gbWl4aW5nIHBvc2l0aW9uYWwgYW5kIG5hbWVkIHBsYWNlaG9sZGVycyBpcyBub3QgKHlldCkgc3VwcG9ydGVkXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcnNlX3RyZWVbcGFyc2VfdHJlZS5sZW5ndGhdID0gbWF0Y2hcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIltzcHJpbnRmXSB1bmV4cGVjdGVkIHBsYWNlaG9sZGVyXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfZm10ID0gX2ZtdC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJzZV90cmVlXG4gICAgfVxuXG4gICAgdmFyIHZzcHJpbnRmID0gZnVuY3Rpb24oZm10LCBhcmd2LCBfYXJndikge1xuICAgICAgICBfYXJndiA9IChhcmd2IHx8IFtdKS5zbGljZSgwKVxuICAgICAgICBfYXJndi5zcGxpY2UoMCwgMCwgZm10KVxuICAgICAgICByZXR1cm4gc3ByaW50Zi5hcHBseShudWxsLCBfYXJndilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBoZWxwZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0X3R5cGUodmFyaWFibGUpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdHJfcmVwZWF0KGlucHV0LCBtdWx0aXBsaWVyKSB7XG4gICAgICAgIHJldHVybiBBcnJheShtdWx0aXBsaWVyICsgMSkuam9pbihpbnB1dClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBleHBvcnQgdG8gZWl0aGVyIGJyb3dzZXIgb3Igbm9kZS5qc1xuICAgICAqL1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBleHBvcnRzLnNwcmludGYgPSBzcHJpbnRmXG4gICAgICAgIGV4cG9ydHMudnNwcmludGYgPSB2c3ByaW50ZlxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgd2luZG93LnNwcmludGYgPSBzcHJpbnRmXG4gICAgICAgIHdpbmRvdy52c3ByaW50ZiA9IHZzcHJpbnRmXG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50Zjogc3ByaW50ZixcbiAgICAgICAgICAgICAgICAgICAgdnNwcmludGY6IHZzcHJpbnRmXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIgPyB0aGlzIDogd2luZG93KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvLyAgVGltZXIgYmFzZWQgYW5pbWF0aW9uXG4vLyBUT0RPIGNsZWFuIHVwIGxpbnRpbmdcbi8qIGVzbGludC1kaXNhYmxlICovXG4vKiBnbG9iYWwgc2V0VGltZW91dCAqL1xuaW1wb3J0IHttZXJnZSwgbm9vcCwgc3BsYXR9IGZyb20gJy4uL3V0aWxzJztcblxudmFyIFF1ZXVlID0gW107XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZ4IHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh7XG4gICAgICBkZWxheTogMCxcbiAgICAgIGR1cmF0aW9uOiAxMDAwLFxuICAgICAgdHJhbnNpdGlvbjogeCA9PiB4LFxuICAgICAgb25Db21wdXRlOiBub29wLFxuICAgICAgb25Db21wbGV0ZTogbm9vcFxuICAgIH0sIG9wdGlvbnMpO1xuICB9XG5cbiAgc3RhcnQob3B0aW9ucykge1xuICAgIHRoaXMub3B0ID0gbWVyZ2UodGhpcy5vcHQsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMudGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5hbmltYXRpbmcgPSB0cnVlO1xuICAgIFF1ZXVlLnB1c2godGhpcyk7XG4gIH1cblxuICAvLyBwZXJmb3JtIGEgc3RlcCBpbiB0aGUgYW5pbWF0aW9uXG4gIHN0ZXAoKSB7XG4gICAgLy8gaWYgbm90IGFuaW1hdGluZywgdGhlbiByZXR1cm5cbiAgICBpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VGltZSA9IERhdGUubm93KCksXG4gICAgICB0aW1lID0gdGhpcy50aW1lLFxuICAgICAgb3B0ID0gdGhpcy5vcHQsXG4gICAgICBkZWxheSA9IG9wdC5kZWxheSxcbiAgICAgIGR1cmF0aW9uID0gb3B0LmR1cmF0aW9uLFxuICAgICAgZGVsdGEgPSAwO1xuICAgIC8vIGhvbGQgYW5pbWF0aW9uIGZvciB0aGUgZGVsYXlcbiAgICBpZiAoY3VycmVudFRpbWUgPCB0aW1lICsgZGVsYXkpIHtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGlmIGluIG91ciB0aW1lIHdpbmRvdywgdGhlbiBleGVjdXRlIGFuaW1hdGlvblxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSArIGR1cmF0aW9uKSB7XG4gICAgICBkZWx0YSA9IG9wdC50cmFuc2l0aW9uKChjdXJyZW50VGltZSAtIHRpbWUgLSBkZWxheSkgLyBkdXJhdGlvbik7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIDEpO1xuICAgICAgb3B0Lm9uQ29tcGxldGUuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY29tcHV0ZShmcm9tLCB0bywgZGVsdGEpIHtcbiAgICByZXR1cm4gZnJvbSArICh0byAtIGZyb20pICogZGVsdGE7XG4gIH1cbn1cblxuRnguUXVldWUgPSBRdWV1ZTtcblxuLy8gRWFzaW5nIGVxdWF0aW9uc1xuRnguVHJhbnNpdGlvbiA9IHtcbiAgbGluZWFyKHApIHtcbiAgICByZXR1cm4gcDtcbiAgfVxufTtcblxudmFyIFRyYW5zID0gRnguVHJhbnNpdGlvbjtcblxuRngucHJvdG90eXBlLnRpbWUgPSBudWxsO1xuXG5mdW5jdGlvbiBtYWtlVHJhbnModHJhbnNpdGlvbiwgcGFyYW1zKSB7XG4gIHBhcmFtcyA9IHNwbGF0KHBhcmFtcyk7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKHRyYW5zaXRpb24sIHtcbiAgICBlYXNlSW4ocG9zKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbihwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlT3V0KHBvcykge1xuICAgICAgcmV0dXJuIDEgLSB0cmFuc2l0aW9uKDEgLSBwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlSW5PdXQocG9zKSB7XG4gICAgICByZXR1cm4gKHBvcyA8PSAwLjUpID8gdHJhbnNpdGlvbigyICogcG9zLCBwYXJhbXMpIC8gMiA6XG4gICAgICAgICgyIC0gdHJhbnNpdGlvbigyICogKDEgLSBwb3MpLCBwYXJhbXMpKSAvIDI7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIHRyYW5zaXRpb25zID0ge1xuXG4gIFBvdyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIHhbMF0gfHwgNik7XG4gIH0sXG5cbiAgRXhwbyhwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDggKiAocCAtIDEpKTtcbiAgfSxcblxuICBDaXJjKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKE1hdGguYWNvcyhwKSk7XG4gIH0sXG5cbiAgU2luZShwKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnNpbigoMSAtIHApICogTWF0aC5QSSAvIDIpO1xuICB9LFxuXG4gIEJhY2socCwgeCkge1xuICAgIHggPSB4WzBdIHx8IDEuNjE4O1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCAyKSAqICgoeCArIDEpICogcCAtIHgpO1xuICB9LFxuXG4gIEJvdW5jZShwKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGZvciAobGV0IGEgPSAwLCBiID0gMTsgMTsgYSArPSBiLCBiIC89IDIpIHtcbiAgICAgIGlmIChwID49ICg3IC0gNCAqIGEpIC8gMTEpIHtcbiAgICAgICAgdmFsdWUgPSBiICogYiAtIE1hdGgucG93KCgxMSAtIDYgKiBhIC0gMTEgKiBwKSAvIDQsIDIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuXG4gIEVsYXN0aWMocCwgeCkge1xuICAgIHJldHVybiBNYXRoLnBvdygyLCAxMCAqIC0tcCkgKiBNYXRoLmNvcygyMCAqIHAgKiBNYXRoLlBJICogKHhbMF0gfHwgMSkgLyAzKTtcbiAgfVxuXG59O1xuXG5mb3IgKGNvbnN0IHQgaW4gdHJhbnNpdGlvbnMpIHtcbiAgVHJhbnNbdF0gPSBtYWtlVHJhbnModHJhbnNpdGlvbnNbdF0pO1xufVxuXG5bJ1F1YWQnLCAnQ3ViaWMnLCAnUXVhcnQnLCAnUXVpbnQnXS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0sIGkpIHtcbiAgVHJhbnNbZWxlbV0gPSBtYWtlVHJhbnMoZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCBbXG4gICAgICBpICsgMlxuICAgIF0pO1xuICB9KTtcbn0pO1xuXG4vLyBhbmltYXRpb25UaW1lIC0gZnVuY3Rpb24gYnJhbmNoaW5nXG5cbi8vICByeWU6IFRPRE8tIHJlZmFjdG9yIGdsb2JhbCBkZWZpbml0aW9uIHdoZW4gd2UgZGVmaW5lIHRoZSB0d29cbi8vICAgICAgICAgICAgIChicm93c2VyaWZ5LzxzY3JpcHQ+KSBidWlsZCBwYXRocy5cbnZhciBnbG9iYWw7XG50cnkge1xuICBnbG9iYWwgPSB3aW5kb3c7XG59IGNhdGNoIChlKSB7XG4gIGdsb2JhbCA9IG51bGw7XG59XG5cbnZhciBjaGVja0Z4UXVldWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9sZFF1ZXVlID0gUXVldWU7XG4gIFF1ZXVlID0gW107XG4gIGlmIChvbGRRdWV1ZS5sZW5ndGgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9sZFF1ZXVlLmxlbmd0aCwgZng7IGkgPCBsOyBpKyspIHtcbiAgICAgIGZ4ID0gb2xkUXVldWVbaV07XG4gICAgICBmeC5zdGVwKCk7XG4gICAgICBpZiAoZnguYW5pbWF0aW5nKSB7XG4gICAgICAgIFF1ZXVlLnB1c2goZngpO1xuICAgICAgfVxuICAgIH1cbiAgICBGeC5RdWV1ZSA9IFF1ZXVlO1xuICB9XG59O1xuXG5pZiAoZ2xvYmFsKSB7XG4gIHZhciBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdEFuaW1hdGlvblRpbWUnLCAnbW96QW5pbWF0aW9uVGltZScsICdhbmltYXRpb25UaW1lJyxcbiAgICd3ZWJraXRBbmltYXRpb25TdGFydFRpbWUnLCAnbW96QW5pbWF0aW9uU3RhcnRUaW1lJywgJ2FuaW1hdGlvblN0YXJ0VGltZSddXG4gICAgLmZvckVhY2goaW1wbCA9PiB7XG4gICAgICBpZiAoaW1wbCBpbiBnbG9iYWwpIHtcbiAgICAgICAgRnguYW5pbWF0aW9uVGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBnbG9iYWxbaW1wbF07XG4gICAgICAgIH07XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgaWYgKCFmb3VuZCkge1xuICAgIEZ4LmFuaW1hdGlvblRpbWUgPSBEYXRlLm5vdztcbiAgfVxuICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcbiAgZm91bmQgPSBmYWxzZTtcbiAgWyd3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLCAnbW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lJyxcbiAgICdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGltcGwpIHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgIGdsb2JhbFtpbXBsXShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRngucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSwgMTAwMCAvIDYwKTtcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQgUHJvZ3JhbSBmcm9tICcuLi93ZWJnbC9wcm9ncmFtJztcbmltcG9ydCBTaGFkZXJzIGZyb20gJy4uL3NoYWRlcnMnO1xuaW1wb3J0IHtYSFJHcm91cH0gZnJvbSAnLi4vaW8nO1xuaW1wb3J0IHttZXJnZX0gZnJvbSAnLi4vdXRpbHMnO1xuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5cbi8vIEFsdGVybmF0ZSBjb25zdHJ1Y3RvclxuLy8gQnVpbGQgcHJvZ3JhbSBmcm9tIGRlZmF1bHQgc2hhZGVycyAocmVxdWlyZXMgU2hhZGVycylcbmV4cG9ydCBmdW5jdGlvbiBtYWtlUHJvZ3JhbWZyb21EZWZhdWx0U2hhZGVycyhnbCwgaWQpIHtcbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7XG4gICAgdnM6IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQsXG4gICAgZnM6IFNoYWRlcnMuRnJhZ21lbnQuRGVmYXVsdCxcbiAgICBpZFxuICB9KTtcbn1cblxuLy8gQ3JlYXRlIGEgcHJvZ3JhbSBmcm9tIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVyIG5vZGUgaWRzXG4vLyBAZGVwcmVjYXRlZCAtIFVzZSBnbHNsaWZ5IGluc3RlYWRcbmV4cG9ydCBmdW5jdGlvbiBtYWtlUHJvZ3JhbUZyb21IVE1MVGVtcGxhdGVzKGdsLCB2c0lkLCBmc0lkLCBpZCkge1xuICBjb25zdCB2cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZzSWQpLmlubmVySFRNTDtcbiAgY29uc3QgZnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmc0lkKS5pbm5lckhUTUw7XG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KTtcbn1cblxuLy8gTG9hZCBzaGFkZXJzIHVzaW5nIFhIUlxuLy8gQGRlcHJlY2F0ZWQgLSBVc2UgZ2xzbGlmeSBpbnN0ZWFkXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFrZVByb2dyYW1Gcm9tU2hhZGVyVVJJcyhnbCwgdnMsIGZzLCBvcHRzKSB7XG4gIG9wdHMgPSBtZXJnZSh7XG4gICAgcGF0aDogJy8nLFxuICAgIG5vQ2FjaGU6IGZhbHNlXG4gIH0sIG9wdHMpO1xuXG4gIGNvbnN0IHZlcnRleFNoYWRlclVSSSA9IG9wdHMucGF0aCArIHZzO1xuICBjb25zdCBmcmFnbWVudFNoYWRlclVSSSA9IG9wdHMucGF0aCArIGZzO1xuXG4gIGNvbnN0IHJlc3BvbnNlcyA9IGF3YWl0IG5ldyBYSFJHcm91cCh7XG4gICAgdXJsczogW3ZlcnRleFNoYWRlclVSSSwgZnJhZ21lbnRTaGFkZXJVUkldLFxuICAgIG5vQ2FjaGU6IG9wdHMubm9DYWNoZVxuICB9KS5zZW5kQXN5bmMoKTtcblxuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHt2czogcmVzcG9uc2VzWzBdLCBmczogcmVzcG9uc2VzWzFdfSk7XG59XG4iLCJpbXBvcnQge2RlZmF1bHQgYXMgRnh9IGZyb20gJy4vZngnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIFdvcmtlckdyb3VwfSBmcm9tICcuL3dvcmtlcnMnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0ICogYXMgc2F2ZUJpdG1hcCBmcm9tICcuL3NhdmUtYml0bWFwJztcblxuZXhwb3J0IHtkZWZhdWx0IGFzIEZ4fSBmcm9tICcuL2Z4JztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBXb3JrZXJHcm91cH0gZnJvbSAnLi93b3JrZXJzJztcbmV4cG9ydCAqIGZyb20gJy4vaGVscGVycyc7XG5leHBvcnQgKiBmcm9tICcuL3NhdmUtYml0bWFwJztcblxuLyogZ2xvYmFsIHdpbmRvdyAqL1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5MdW1hR0wpIHtcbiAgd2luZG93Lkx1bWFHTC5hZGRvbnMgPSB7XG4gICAgRng6IEZ4LFxuICAgIFdvcmtlckdyb3VwOiBXb3JrZXJHcm91cFxuICB9O1xuICBPYmplY3QuYXNzaWduKHdpbmRvdy5MdW1hR0wuYWRkb25zLCBoZWxwZXJzKTtcbiAgT2JqZWN0LmFzc2lnbih3aW5kb3cuTHVtYUdMLmFkZG9ucywgc2F2ZUJpdG1hcCk7XG59XG4iLCJpbXBvcnQge3NhdmVBc30gZnJvbSAnZmlsZXNhdmVyLmpzJztcbmltcG9ydCB7ZGVmYXVsdCBhcyB0b0Jsb2J9IGZyb20gJ2NhbnZhcy10by1ibG9iJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVCaXRtYXAoY2FudmFzLCBmaWxlbmFtZSkge1xuICBjb25zdCBibG9iID0gdG9CbG9iKGNhbnZhcy50b0RhdGFVUkwoKSk7XG4gIHNhdmVBcyhibG9iLCBmaWxlbmFtZSk7XG59XG4iLCIvLyB3b3JrZXJzLmpzXG4vL1xuLyogZ2xvYmFsIFdvcmtlciAqL1xuLyogZXNsaW50LWRpc2FibGUgb25lLXZhciwgaW5kZW50ICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdvcmtlckdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihmaWxlTmFtZSwgbikge1xuICAgIHZhciB3b3JrZXJzID0gdGhpcy53b3JrZXJzID0gW107XG4gICAgd2hpbGUgKG4tLSkge1xuICAgICAgd29ya2Vycy5wdXNoKG5ldyBXb3JrZXIoZmlsZU5hbWUpKTtcbiAgICB9XG4gIH1cblxuICBtYXAoZnVuYykge1xuICAgIHZhciB3b3JrZXJzID0gdGhpcy53b3JrZXJzO1xuICAgIHZhciBjb25maWdzID0gdGhpcy5jb25maWdzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHdvcmtlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBjb25maWdzLnB1c2goZnVuYyAmJiBmdW5jKGkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlZHVjZShvcHQpIHtcbiAgICB2YXIgZm4gPSBvcHQucmVkdWNlRm4sXG4gICAgICAgIHdvcmtlcnMgPSB0aGlzLndvcmtlcnMsXG4gICAgICAgIGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3MsXG4gICAgICAgIGwgPSB3b3JrZXJzLmxlbmd0aCxcbiAgICAgICAgYWN1bSA9IG9wdC5pbml0aWFsVmFsdWUsXG4gICAgICAgIG1lc3NhZ2UgPSBmdW5jdGlvbiBfKGUpIHtcbiAgICAgICAgICBsLS07XG4gICAgICAgICAgaWYgKGFjdW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYWN1bSA9IGUuZGF0YTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWN1bSA9IGZuKGFjdW0sIGUuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsID09PSAwKSB7XG4gICAgICAgICAgICBvcHQub25Db21wbGV0ZShhY3VtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgZm9yICh2YXIgaSA9IDAsIGxuID0gbDsgaSA8IGxuOyBpKyspIHtcbiAgICAgIHZhciB3ID0gd29ya2Vyc1tpXTtcbiAgICAgIHcub25tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgIHcucG9zdE1lc3NhZ2UoY29uZmlnc1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuIiwiLy8gUHJvdmlkZXMgbG9hZGluZyBvZiBhc3NldHMgd2l0aCBYSFIgYW5kIEpTT05QIG1ldGhvZHMuXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4sIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGRvY3VtZW50LCBYTUxIdHRwUmVxdWVzdCwgSW1hZ2UgKi9cbmltcG9ydCB7dWlkLCBzcGxhdCwgbWVyZ2UsIG5vb3B9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vd2ViZ2wnO1xuXG5leHBvcnQgY2xhc3MgWEhSIHtcblxuICBjb25zdHJ1Y3RvcihvcHQgPSB7fSkge1xuICAgIG9wdCA9IHtcbiAgICAgIHVybDogJ2h0dHA6Ly8gcGhpbG9nbGpzLm9yZy8nLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgbm9DYWNoZTogZmFsc2UsXG4gICAgICAvLyBib2R5OiBudWxsLFxuICAgICAgc2VuZEFzQmluYXJ5OiBmYWxzZSxcbiAgICAgIHJlc3BvbnNlVHlwZTogZmFsc2UsXG4gICAgICBvblByb2dyZXNzOiBub29wLFxuICAgICAgb25TdWNjZXNzOiBub29wLFxuICAgICAgb25FcnJvcjogbm9vcCxcbiAgICAgIG9uQWJvcnQ6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wLFxuICAgICAgLi4ub3B0XG4gICAgfTtcblxuICAgIHRoaXMub3B0ID0gb3B0O1xuICAgIHRoaXMuaW5pdFhIUigpO1xuICB9XG5cbiAgaW5pdFhIUigpIHtcbiAgICBjb25zdCByZXEgPSB0aGlzLnJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgWydQcm9ncmVzcycsICdFcnJvcicsICdBYm9ydCcsICdMb2FkJ10uZm9yRWFjaChldmVudCA9PiB7XG4gICAgICBpZiAocmVxLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgcmVxLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQudG9Mb3dlckNhc2UoKSwgZSA9PiB7XG4gICAgICAgICAgc2VsZlsnaGFuZGxlJyArIGV2ZW50XShlKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxWydvbicgKyBldmVudC50b0xvd2VyQ2FzZSgpXSA9IGUgPT4ge1xuICAgICAgICAgIHNlbGZbJ2hhbmRsZScgKyBldmVudF0oZSk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kQXN5bmMoYm9keSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB7cmVxLCBvcHR9ID0gdGhpcztcbiAgICAgIGNvbnN0IHthc3luY30gPSBvcHQ7XG5cbiAgICAgIGlmIChvcHQubm9DYWNoZSkge1xuICAgICAgICBvcHQudXJsICs9IChvcHQudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICAgICAgfVxuXG4gICAgICByZXEub3BlbihvcHQubWV0aG9kLCBvcHQudXJsLCBhc3luYyk7XG5cbiAgICAgIGlmIChvcHQucmVzcG9uc2VUeXBlKSB7XG4gICAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSBvcHQucmVzcG9uc2VUeXBlO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXN5bmMpIHtcbiAgICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWEhSLlN0YXRlLkNPTVBMRVRFRCkge1xuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1cykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdC5zZW5kQXNCaW5hcnkpIHtcbiAgICAgICAgcmVxLnNlbmRBc0JpbmFyeShib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxLnNlbmQoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFhc3luYykge1xuICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNlbmQoYm9keSkge1xuICAgIGNvbnN0IHtyZXEsIG9wdH0gPSB0aGlzO1xuICAgIGNvbnN0IGFzeW5jID0gb3B0LmFzeW5jO1xuXG4gICAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgICBvcHQudXJsICs9IChvcHQudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICAgIH1cblxuICAgIHJlcS5vcGVuKG9wdC5tZXRob2QsIG9wdC51cmwsIGFzeW5jKTtcblxuICAgIGlmIChvcHQucmVzcG9uc2VUeXBlKSB7XG4gICAgICByZXEucmVzcG9uc2VUeXBlID0gb3B0LnJlc3BvbnNlVHlwZTtcbiAgICB9XG5cbiAgICBpZiAoYXN5bmMpIHtcbiAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlID0+IHtcbiAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFIuU3RhdGUuQ09NUExFVEVEKSB7XG4gICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgb3B0Lm9uU3VjY2VzcyhyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdC5vbkVycm9yKHJlcS5zdGF0dXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAob3B0LnNlbmRBc0JpbmFyeSkge1xuICAgICAgcmVxLnNlbmRBc0JpbmFyeShib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXEuc2VuZChib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgIH1cblxuICAgIGlmICghYXN5bmMpIHtcbiAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgb3B0Lm9uU3VjY2VzcyhyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHQub25FcnJvcihyZXEuc3RhdHVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpIHtcbiAgICB0aGlzLnJlcS5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaGFuZGxlUHJvZ3Jlc3MoZSkge1xuICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgIHRoaXMub3B0Lm9uUHJvZ3Jlc3MoZSwgTWF0aC5yb3VuZChlLmxvYWRlZCAvIGUudG90YWwgKiAxMDApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcHQub25Qcm9ncmVzcyhlLCAtMSk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRXJyb3IoZSkge1xuICAgIHRoaXMub3B0Lm9uRXJyb3IoZSk7XG4gIH1cblxuICBoYW5kbGVBYm9ydChlKSB7XG4gICAgdGhpcy5vcHQub25BYm9ydChlKTtcbiAgfVxuXG4gIGhhbmRsZUxvYWQoZSkge1xuICAgIHRoaXMub3B0Lm9uQ29tcGxldGUoZSk7XG4gIH1cbn1cblxuWEhSLlN0YXRlID0ge307XG5bJ1VOSU5JVElBTElaRUQnLCAnTE9BRElORycsICdMT0FERUQnLCAnSU5URVJBQ1RJVkUnLCAnQ09NUExFVEVEJ11cbi5mb3JFYWNoKChzdGF0ZU5hbWUsIGkpID0+IHtcbiAgWEhSLlN0YXRlW3N0YXRlTmFtZV0gPSBpO1xufSk7XG5cbi8vIE1ha2UgcGFyYWxsZWwgcmVxdWVzdHMgYW5kIGdyb3VwIHRoZSByZXNwb25zZXMuXG5leHBvcnQgY2xhc3MgWEhSR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKG9wdCA9IHt9KSB7XG4gICAgb3B0ID0ge1xuICAgICAgdXJsczogW10sXG4gICAgICBvblN1Y2Nlc3M6IG5vb3AsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgYXN5bmM6IHRydWUsXG4gICAgICBub0NhY2hlOiBmYWxzZSxcbiAgICAgIC8vIGJvZHk6IG51bGwsXG4gICAgICBzZW5kQXNCaW5hcnk6IGZhbHNlLFxuICAgICAgcmVzcG9uc2VUeXBlOiBmYWxzZSxcbiAgICAgIC4uLm9wdFxuICAgIH07XG5cbiAgICB2YXIgdXJscyA9IHNwbGF0KG9wdC51cmxzKTtcbiAgICB0aGlzLnJlcXMgPSB1cmxzLm1hcCgodXJsLCBpKSA9PiBuZXcgWEhSKHtcbiAgICAgIHVybDogdXJsLFxuICAgICAgbWV0aG9kOiBvcHQubWV0aG9kLFxuICAgICAgYXN5bmM6IG9wdC5hc3luYyxcbiAgICAgIG5vQ2FjaGU6IG9wdC5ub0NhY2hlLFxuICAgICAgc2VuZEFzQmluYXJ5OiBvcHQuc2VuZEFzQmluYXJ5LFxuICAgICAgcmVzcG9uc2VUeXBlOiBvcHQucmVzcG9uc2VUeXBlLFxuICAgICAgYm9keTogb3B0LmJvZHlcbiAgICB9KSk7XG4gIH1cblxuICBhc3luYyBzZW5kQXN5bmMoKSB7XG4gICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHRoaXMucmVxcy5tYXAocmVxID0+IHJlcS5zZW5kQXN5bmMoKSkpO1xuICB9XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEpTT05QKG9wdCkge1xuICBvcHQgPSBtZXJnZSh7XG4gICAgdXJsOiAnaHR0cDovLyBwaGlsb2dsanMub3JnLycsXG4gICAgZGF0YToge30sXG4gICAgbm9DYWNoZTogZmFsc2UsXG4gICAgb25Db21wbGV0ZTogbm9vcCxcbiAgICBjYWxsYmFja0tleTogJ2NhbGxiYWNrJ1xuICB9LCBvcHQgfHwge30pO1xuXG4gIHZhciBpbmRleCA9IEpTT05QLmNvdW50ZXIrKztcbiAgLy8gY3JlYXRlIHF1ZXJ5IHN0cmluZ1xuICB2YXIgZGF0YSA9IFtdO1xuICBmb3IgKHZhciBwcm9wIGluIG9wdC5kYXRhKSB7XG4gICAgZGF0YS5wdXNoKHByb3AgKyAnPScgKyBvcHQuZGF0YVtwcm9wXSk7XG4gIH1cbiAgZGF0YSA9IGRhdGEuam9pbignJicpO1xuICAvLyBhcHBlbmQgdW5pcXVlIGlkIGZvciBjYWNoZVxuICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICBkYXRhICs9IChkYXRhLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICB9XG4gIC8vIGNyZWF0ZSBzb3VyY2UgdXJsXG4gIHZhciBzcmMgPSBvcHQudXJsICtcbiAgICAob3B0LnVybC5pbmRleE9mKCc/JykgPiAtMSA/ICcmJyA6ICc/JykgK1xuICAgIG9wdC5jYWxsYmFja0tleSArICc9UGhpbG9HTCBJTy5KU09OUC5yZXF1ZXN0cy5yZXF1ZXN0XycgKyBpbmRleCArXG4gICAgKGRhdGEubGVuZ3RoID4gMCA/ICcmJyArIGRhdGEgOiAnJyk7XG5cbiAgLy8gY3JlYXRlIHNjcmlwdFxuICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gIHNjcmlwdC5zcmMgPSBzcmM7XG5cbiAgLy8gY3JlYXRlIGNhbGxiYWNrXG4gIEpTT05QLnJlcXVlc3RzWydyZXF1ZXN0XycgKyBpbmRleF0gPSBmdW5jdGlvbihqc29uKSB7XG4gICAgb3B0Lm9uQ29tcGxldGUoanNvbik7XG4gICAgLy8gcmVtb3ZlIHNjcmlwdFxuICAgIGlmIChzY3JpcHQucGFyZW50Tm9kZSkge1xuICAgICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICB9XG4gICAgaWYgKHNjcmlwdC5jbGVhckF0dHJpYnV0ZXMpIHtcbiAgICAgIHNjcmlwdC5jbGVhckF0dHJpYnV0ZXMoKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gaW5qZWN0IHNjcmlwdFxuICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG59XG5cbkpTT05QLmNvdW50ZXIgPSAwO1xuSlNPTlAucmVxdWVzdHMgPSB7fTtcblxuLy8gQ3JlYXRlcyBhbiBpbWFnZS1sb2FkaW5nIHByb21pc2UuXG5mdW5jdGlvbiBsb2FkSW1hZ2Uoc3JjKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlc29sdmUoaW1hZ2UpO1xuICAgIH07XG4gICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihgQ291bGQgbm90IGxvYWQgaW1hZ2UgJHtzcmN9LmApKTtcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IHNyYztcbiAgfSk7XG59XG5cbi8vIExvYWQgbXVsdGlwbGUgaW1hZ2VzIGFzeW5jLlxuLy8gcnllOiBUT0RPIHRoaXMgbmVlZHMgdG8gaW1wbGVtZW50IGZ1bmN0aW9uYWxpdHkgZnJvbSB0aGVcbi8vICAgICAgICAgICBvcmlnaW5hbCBJbWFnZXMgZnVuY3Rpb24uXG5hc3luYyBmdW5jdGlvbiBsb2FkSW1hZ2VzKHNyY3MpIHtcbiAgbGV0IGltYWdlUHJvbWlzZXMgPSBzcmNzLm1hcCgoc3JjKSA9PiBsb2FkSW1hZ2Uoc3JjKSk7XG4gIGxldCByZXN1bHRzID0gW107XG4gIGZvciAoY29uc3QgaW1hZ2VQcm9taXNlIG9mIGltYWdlUHJvbWlzZXMpIHtcbiAgICByZXN1bHRzLnB1c2goYXdhaXQgaW1hZ2VQcm9taXNlKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gLy8gTG9hZCBtdWx0aXBsZSBJbWFnZSBhc3NldHMgYXN5bmNcbi8vIGV4cG9ydCBmdW5jdGlvbiBJbWFnZXMob3B0KSB7XG4vLyAgIG9wdCA9IG1lcmdlKHtcbi8vICAgICBzcmM6IFtdLFxuLy8gICAgIG5vQ2FjaGU6IGZhbHNlLFxuLy8gICAgIG9uUHJvZ3Jlc3M6IG5vb3AsXG4vLyAgICAgb25Db21wbGV0ZTogbm9vcFxuLy8gICB9LCBvcHQgfHwge30pO1xuLy9cbi8vICAgbGV0IGNvdW50ID0gMDtcbi8vICAgbGV0IGwgPSBvcHQuc3JjLmxlbmd0aDtcbi8vXG4vLyAgIGxldCBpbWFnZXM7XG4vLyAgIC8vIEltYWdlIG9ubG9hZCBoYW5kbGVyXG4vLyAgIHZhciBsb2FkID0gKCkgPT4ge1xuLy8gICAgIG9wdC5vblByb2dyZXNzKE1hdGgucm91bmQoKytjb3VudCAvIGwgKiAxMDApKTtcbi8vICAgICBpZiAoY291bnQgPT09IGwpIHtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKGltYWdlcyk7XG4vLyAgICAgfVxuLy8gICB9O1xuLy8gICAvLyBJbWFnZSBlcnJvciBoYW5kbGVyXG4vLyAgIHZhciBlcnJvciA9ICgpID0+IHtcbi8vICAgICBpZiAoKytjb3VudCA9PT0gbCkge1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoaW1hZ2VzKTtcbi8vICAgICB9XG4vLyAgIH07XG4vL1xuLy8gICAvLyB1aWQgZm9yIGltYWdlIHNvdXJjZXNcbi8vICAgY29uc3Qgbm9DYWNoZSA9IG9wdC5ub0NhY2hlO1xuLy8gICBjb25zdCB1aWQgPSB1aWQoKTtcbi8vICAgZnVuY3Rpb24gZ2V0U3VmZml4KHMpIHtcbi8vICAgICByZXR1cm4gKHMuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkO1xuLy8gICB9XG4vL1xuLy8gICAvLyBDcmVhdGUgaW1hZ2UgYXJyYXlcbi8vICAgaW1hZ2VzID0gb3B0LnNyYy5tYXAoKHNyYywgaSkgPT4ge1xuLy8gICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuLy8gICAgIGltZy5pbmRleCA9IGk7XG4vLyAgICAgaW1nLm9ubG9hZCA9IGxvYWQ7XG4vLyAgICAgaW1nLm9uZXJyb3IgPSBlcnJvcjtcbi8vICAgICBpbWcuc3JjID0gc3JjICsgKG5vQ2FjaGUgPyBnZXRTdWZmaXgoc3JjKSA6ICcnKTtcbi8vICAgICByZXR1cm4gaW1nO1xuLy8gICB9KTtcbi8vXG4vLyAgIHJldHVybiBpbWFnZXM7XG4vLyB9XG5cbi8vIExvYWQgbXVsdGlwbGUgdGV4dHVyZXMgZnJvbSBpbWFnZXNcbi8vIHJ5ZTogVE9ETyB0aGlzIG5lZWRzIHRvIGltcGxlbWVudCBmdW5jdGlvbmFsaXR5IGZyb21cbi8vICAgICAgICAgICB0aGUgb3JpZ2luYWwgbG9hZFRleHR1cmVzIGZ1bmN0aW9uLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRUZXh0dXJlcyhnbCwgb3B0KSB7XG4gIHZhciBpbWFnZXMgPSBhd2FpdCBsb2FkSW1hZ2VzKG9wdC5zcmMpO1xuICB2YXIgdGV4dHVyZXMgPSBbXTtcbiAgaW1hZ2VzLmZvckVhY2goKGltZywgaSkgPT4ge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5pc0FycmF5KG9wdC5wYXJhbWV0ZXJzKSA/XG4gICAgICBvcHQucGFyYW1ldGVyc1tpXSA6IG9wdC5wYXJhbWV0ZXJzO1xuICAgIHBhcmFtcyA9IHBhcmFtcyA9PT0gdW5kZWZpbmVkID8ge30gOiBwYXJhbXM7XG4gICAgdGV4dHVyZXMucHVzaChuZXcgVGV4dHVyZTJEKGdsLCBtZXJnZSh7XG4gICAgICBkYXRhOiBpbWdcbiAgICB9LCBwYXJhbXMpKSk7XG4gIH0pO1xuICByZXR1cm4gdGV4dHVyZXM7XG59XG5cbi8vIC8vIExvYWQgbXVsdGlwbGUgdGV4dHVyZXMgZnJvbSBpbWFnZXNcbi8vIGV4cG9ydCBmdW5jdGlvbiBsb2FkVGV4dHVyZXMob3B0ID0ge30pIHtcbi8vICAgb3B0ID0ge1xuLy8gICAgIHNyYzogW10sXG4vLyAgICAgbm9DYWNoZTogZmFsc2UsXG4vLyAgICAgb25Db21wbGV0ZTogbm9vcCxcbi8vICAgICAuLi5vcHRcbi8vICAgfTtcbi8vXG4vLyAgIEltYWdlcyh7XG4vLyAgICAgc3JjOiBvcHQuc3JjLFxuLy8gICAgIG5vQ2FjaGU6IG9wdC5ub0NhY2hlLFxuLy8gICAgIG9uQ29tcGxldGUoaW1hZ2VzKSB7XG4vLyAgICAgICB2YXIgdGV4dHVyZXMgPSB7fTtcbi8vICAgICAgIGltYWdlcy5mb3JFYWNoKChpbWcsIGkpID0+IHtcbi8vICAgICAgICAgdGV4dHVyZXNbb3B0LmlkICYmIG9wdC5pZFtpXSB8fCBvcHQuc3JjICYmIG9wdC5zcmNbaV1dID0gbWVyZ2Uoe1xuLy8gICAgICAgICAgIGRhdGE6IHtcbi8vICAgICAgICAgICAgIHZhbHVlOiBpbWdcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgIH0sIG9wdCk7XG4vLyAgICAgICB9KTtcbi8vICAgICAgIGFwcC5zZXRUZXh0dXJlcyh0ZXh0dXJlcyk7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZSgpO1xuLy8gICAgIH1cbi8vICAgfSk7XG4vLyB9XG4iLCIvLyBEZWZhdWx0IFNoYWRlcnNcbnZhciBnbHNsaWZ5ID0gcmVxdWlyZSgnZ2xzbGlmeScpO1xuXG4vLyBUT0RPIC0gYWRvcHQgZ2xzbGlmeVxuY29uc3QgU2hhZGVycyA9IHtcbiAgVmVydGV4OiB7XG4gICAgRGVmYXVsdDogZ2xzbGlmeSgnLi9kZWZhdWx0LXZlcnRleCcpXG4gIH0sXG4gIEZyYWdtZW50OiB7XG4gICAgRGVmYXVsdDogZ2xzbGlmeSgnLi9kZWZhdWx0LWZyYWdtZW50JylcbiAgfVxufTtcblxuU2hhZGVycy52cyA9IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQ7XG5TaGFkZXJzLmZzID0gU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG5leHBvcnQgZGVmYXVsdCBTaGFkZXJzO1xuXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4gKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLyoqXG4gKiBXcmFwcyB0aGUgYXJndW1lbnQgaW4gYW4gYXJyYXkgaWYgaXQgaXMgbm90IG9uZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhIC0gVGhlIG9iamVjdCB0byB3cmFwLlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5XG4gKiovXG5leHBvcnQgZnVuY3Rpb24gc3BsYXQoYSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhKSAmJiBhIHx8IFthXTtcbn1cblxuLyoqXG4qIFByb3ZpZGVzIGEgc3RhbmRhcmQgbm9vcCBmdW5jdGlvbi5cbioqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG52YXIgX3VpZCA9IERhdGUubm93KCk7XG5cbi8qKlxuICogUmV0dXJucyBhIFVJRC5cbiAqIEByZXR1cm4ge251bWJlcn0gdWlkXG4gKiovXG5leHBvcnQgZnVuY3Rpb24gdWlkKCkge1xuICByZXR1cm4gX3VpZCsrO1xufVxuXG4vKipcbiAqIE1lcmdlIG11bHRpcGxlIG9iamVjdHMgaW50byBvbmUuXG4gKiBAcGFyYW0gey4uLm9iamVjdH0gb2JqZWN0cyAtIFRoZSBvYmplY3RzIHRvIG1lcmdlLlxuICogQHJldHVybiB7b2JqZWN0fSBvYmplY3RcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZShvYmplY3RzKSB7XG4gIGNvbnN0IG1peCA9IHt9O1xuICBmb3IgKGxldCBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBvYmplY3QgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lICE9PSAnT2JqZWN0Jykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGNvbnN0IG9wID0gb2JqZWN0W2tleV07XG4gICAgICBjb25zdCBtcCA9IG1peFtrZXldO1xuICAgICAgaWYgKG1wICYmIG9wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnICYmXG4gICAgICAgIG1wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSB7XG4gICAgICAgIG1peFtrZXldID0gbWVyZ2UobXAsIG9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1peFtrZXldID0gZGV0YWNoKG9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1peDtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgZHVwbGljYXRpbmcgYW4gb2JqZWN0LlxuICogQHBhcmFtIHtvYmplY3R9IGVsZW0gLSBUaGUgb2JqZWN0IHRvIHJlY3Vyc2l2ZWx5IGR1cGxpY2F0ZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5mdW5jdGlvbiBkZXRhY2goZWxlbSkge1xuICBjb25zdCB0ID0gZWxlbS5jb25zdHJ1Y3Rvci5uYW1lO1xuICBsZXQgYW5zO1xuICBpZiAodCA9PT0gJ09iamVjdCcpIHtcbiAgICBhbnMgPSB7fTtcbiAgICBmb3IgKHZhciBwIGluIGVsZW0pIHtcbiAgICAgIGFuc1twXSA9IGRldGFjaChlbGVtW3BdKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodCA9PT0gJ0FycmF5Jykge1xuICAgIGFucyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZWxlbS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGFuc1tpXSA9IGRldGFjaChlbGVtW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYW5zID0gZWxlbTtcbiAgfVxuXG4gIHJldHVybiBhbnM7XG59XG5cbi8vIFRZUEVEIEFSUkFZU1xuXG5leHBvcnQgZnVuY3Rpb24gaXNUeXBlZEFycmF5KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5CWVRFU19QRVJfRUxFTUVOVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VUeXBlZEFycmF5KEFycmF5VHlwZSwgc291cmNlQXJyYXkpIHtcbiAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoc291cmNlQXJyYXkpKTtcbiAgY29uc3QgYXJyYXkgPSBuZXcgQXJyYXlUeXBlKHNvdXJjZUFycmF5Lmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlQXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICBhcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cbiIsIi8vIEVuY2Fwc3VsYXRlcyBhIFdlYkdMQnVmZmVyIG9iamVjdFxuXG5pbXBvcnQge2dldEV4dGVuc2lvbiwgZ2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCdWZmZXIge1xuXG4gIHN0YXRpYyBnZXREZWZhdWx0T3B0cyhnbCkge1xuICAgIHJldHVybiB7XG4gICAgICBidWZmZXJUeXBlOiBnbC5BUlJBWV9CVUZGRVIsXG4gICAgICBzaXplOiAxLFxuICAgICAgZGF0YVR5cGU6IGdsLkZMT0FULFxuICAgICAgc3RyaWRlOiAwLFxuICAgICAgb2Zmc2V0OiAwLFxuICAgICAgZHJhd01vZGU6IGdsLlNUQVRJQ19EUkFXLFxuICAgICAgaW5zdGFuY2VkOiAwXG4gICAgfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogU2V0IHVwIGEgZ2wgYnVmZmVyIG9uY2UgYW5kIHJlcGVhdGVkbHkgYmluZCBhbmQgdW5iaW5kIGl0LlxuICAgKiBIb2xkcyBhbiBhdHRyaWJ1dGUgbmFtZSBhcyBhIGNvbnZlbmllbmNlLi4uXG4gICAqXG4gICAqIEBwYXJhbXt9IG9wdHMuZGF0YSAtIG5hdGl2ZSBhcnJheVxuICAgKiBAcGFyYW17c3RyaW5nfSBvcHRzLmF0dHJpYnV0ZSAtIG5hbWUgb2YgYXR0cmlidXRlIGZvciBtYXRjaGluZ1xuICAgKiBAcGFyYW17fSBvcHRzLmJ1ZmZlclR5cGUgLSBidWZmZXIgdHlwZSAoY2FsbGVkIFwidGFyZ2V0XCIgaW4gR0wgZG9jcylcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgYXNzZXJ0KGdsLCAnQnVmZmVyIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIEJ1ZmZlci5nZXREZWZhdWx0T3B0cyhnbCksIG9wdHMpO1xuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyB0b2RvIC0gcmVtb3ZlXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZWxldGUoKTtcbiAgfVxuXG4gIC8qIFVwZGF0ZXMgZGF0YSBpbiB0aGUgYnVmZmVyICovXG4gIHVwZGF0ZShvcHRzID0ge30pIHtcbiAgICBhc3NlcnQob3B0cy5kYXRhLCAnQnVmZmVyIG5lZWRzIGRhdGEgYXJndW1lbnQnKTtcbiAgICB0aGlzLmF0dHJpYnV0ZSA9IG9wdHMuYXR0cmlidXRlIHx8IHRoaXMuYXR0cmlidXRlO1xuICAgIHRoaXMuYnVmZmVyVHlwZSA9IG9wdHMuYnVmZmVyVHlwZSB8fCB0aGlzLmJ1ZmZlclR5cGU7XG4gICAgdGhpcy5zaXplID0gb3B0cy5zaXplIHx8IHRoaXMuc2l6ZTtcbiAgICB0aGlzLmRhdGFUeXBlID0gb3B0cy5kYXRhVHlwZSB8fCB0aGlzLmRhdGFUeXBlO1xuICAgIHRoaXMuc3RyaWRlID0gb3B0cy5zdHJpZGUgfHwgdGhpcy5zdHJpZGU7XG4gICAgdGhpcy5vZmZzZXQgPSBvcHRzLm9mZnNldCB8fCB0aGlzLm9mZnNldDtcbiAgICB0aGlzLmRyYXdNb2RlID0gb3B0cy5kcmF3TW9kZSB8fCB0aGlzLmRyYXdNb2RlO1xuICAgIHRoaXMuaW5zdGFuY2VkID0gb3B0cy5pbnN0YW5jZWQgfHwgdGhpcy5pbnN0YW5jZWQ7XG5cbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGEgfHwgdGhpcy5kYXRhO1xuICAgIGlmICh0aGlzLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5idWZmZXJEYXRhKHRoaXMuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgYnVmZmVyRGF0YShkYXRhKSB7XG4gICAgYXNzZXJ0KGRhdGEsICdCdWZmZXIuYnVmZmVyRGF0YSBuZWVkcyBkYXRhJyk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5kYXRhLCB0aGlzLmRyYXdNb2RlKTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGF0dGFjaFRvTG9jYXRpb24obG9jYXRpb24pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICAvLyBCaW5kIHRoZSBidWZmZXIgc28gdGhhdCB3ZSBjYW4gb3BlcmF0ZSBvbiBpdFxuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvLyBFbmFibGUgdGhlIGF0dHJpYnV0ZVxuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAvLyBTcGVjaWZ5IGJ1ZmZlciBmb3JtYXRcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKFxuICAgICAgbG9jYXRpb24sXG4gICAgICB0aGlzLnNpemUsIHRoaXMuZGF0YVR5cGUsIGZhbHNlLCB0aGlzLnN0cmlkZSwgdGhpcy5vZmZzZXRcbiAgICApO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gVGhpcyBtYWtlcyBpdCBhbiBpbnN0YW5jZWQgYXR0cmlidXRlXG4gICAgICBleHRlbnNpb24udmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGxvY2F0aW9uLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAodGhpcy5pbnN0YW5jZWQpIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihnbCwgJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICAgIC8vIENsZWFyIGluc3RhbmNlZCBmbGFnXG4gICAgICBleHRlbnNpb24udmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGxvY2F0aW9uLCAwKTtcbiAgICB9XG4gICAgLy8gRGlzYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAvLyBVbmJpbmQgdGhlIGJ1ZmZlciBwZXIgd2ViZ2wgcmVjb21tZW5kYXRpb25zXG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iLCIvLyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgcmVsYXRlZCBtZXRob2RzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2gsIG5vLWNvbnNvbGUsIG5vLWxvb3AtZnVuYyAqL1xuLyogZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQsIGNvbnNvbGUgKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQ2hlY2tzIGlmIFdlYkdMIGlzIGVuYWJsZWQgYW5kIGNyZWF0ZXMgYSBjb250ZXh0IGZvciB1c2luZyBXZWJHTC5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHTENvbnRleHQoY2FudmFzLCBvcHQgPSB7fSkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2FuJ3QgY3JlYXRlIGEgV2ViR0wgY29udGV4dCBvdXRzaWRlIGEgYnJvd3NlciBjb250ZXh0LmApO1xuICB9XG4gIGNhbnZhcyA9IHR5cGVvZiBjYW52YXMgPT09ICdzdHJpbmcnID9cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpIDogY2FudmFzO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd3ZWJnbGNvbnRleHRjcmVhdGlvbmVycm9yJywgZSA9PiB7XG4gICAgY29uc29sZS5sb2coZS5zdGF0dXNNZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJyk7XG4gIH0sIGZhbHNlKTtcblxuICAvLyBQcmVmZXIgd2ViZ2wyIG92ZXIgd2ViZ2wxLCBwcmVmZXIgY29uZm9ybWFudCBvdmVyIGV4cGVyaW1lbnRhbFxuICBsZXQgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsMicsIG9wdCk7XG4gIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgb3B0KTtcblxuICBhc3NlcnQoZ2wsICdGYWlsZWQgdG8gY3JlYXRlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuXG4gIC8vIFNldCBhcyBkZWJ1ZyBoYW5kbGVyXG4gIGdsID0gb3B0LmRlYnVnID8gY3JlYXRlRGVidWdDb250ZXh0KGdsKSA6IGdsO1xuXG4gIC8vIEFkZCBhIHNhZmUgZ2V0IG1ldGhvZFxuICBnbC5nZXQgPSBmdW5jdGlvbiBnbEdldChuYW1lKSB7XG4gICAgbGV0IHZhbHVlID0gbmFtZTtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgICBhc3NlcnQodmFsdWUsIGBBY2Nlc3NpbmcgZ2wuJHtuYW1lfWApO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgcmV0dXJuIGdsO1xuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNXZWJHTCgpIHtcbiAgaWYgKCFpc0Jyb3dzZXJDb250ZXh0KCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gRmVhdHVyZSB0ZXN0IFdlYkdMXG4gIHRyeSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgcmV0dXJuIEJvb2xlYW4od2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCAmJlxuICAgICAgKGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKSkpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzRXh0ZW5zaW9uKG5hbWUpIHtcbiAgaWYgKCFoYXNXZWJHTCgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHxcbiAgICBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gIC8vIFNob3VsZCBtYXliZSBiZSByZXR1cm4gISFjb250ZXh0LmdldEV4dGVuc2lvbihuYW1lKTtcbiAgcmV0dXJuIGNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBleHRlbnNpb24gb3IgdGhyb3dzIGFuIGVycm9yXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGdsLCBleHRlbnNpb25OYW1lKSB7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb25OYW1lKTtcbiAgYXNzZXJ0KGV4dGVuc2lvbiwgYCR7ZXh0ZW5zaW9uTmFtZX0gbm90IHN1cHBvcnRlZCFgKTtcbiAgcmV0dXJuIGV4dGVuc2lvbjtcbn1cblxuZnVuY3Rpb24gaXNCcm93c2VyQ29udGV4dCgpIHtcbiAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vLyBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdpdGggZ2wgc3RhdGVzIHRlbXBvcmFyaWx5IHNldCwgZXhjZXB0aW9uIHNhZmVcbi8vIEN1cnJlbnRseSBzdXBwb3J0IHNjaXNzb3IgdGVzdCBhbmQgZnJhbWVidWZmZXIgYmluZGluZ1xuZXhwb3J0IGZ1bmN0aW9uIGdsQ29udGV4dFdpdGhTdGF0ZShnbCwge3NjaXNzb3JUZXN0LCBmcmFtZUJ1ZmZlcn0sIGZ1bmMpIHtcbiAgbGV0IHNjaXNzb3JUZXN0V2FzRW5hYmxlZDtcbiAgaWYgKHNjaXNzb3JUZXN0KSB7XG4gICAgc2Npc3NvclRlc3RXYXNFbmFibGVkID0gZ2wuaXNFbmFibGVkKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgY29uc3Qge3gsIHksIHcsIGh9ID0gc2Npc3NvclRlc3Q7XG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCB5LCB3LCBoKTtcbiAgfVxuXG4gIGlmIChmcmFtZUJ1ZmZlcikge1xuICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlciB3ZSBuZWVkIHRvIHJlbWVtYmVyP1xuICAgIGZyYW1lQnVmZmVyLmJpbmQoKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgZnVuYyhnbCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFzY2lzc29yVGVzdFdhc0VuYWJsZWQpIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICB9XG4gICAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgICAvLyBUT0RPIC0gd2FzIHRoZXJlIGFueSBwcmV2aW91c2x5IHNldCBmcmFtZSBidWZmZXI/XG4gICAgICAvLyBUT0RPIC0gZGVsZWdhdGUgXCJ1bmJpbmRcIiB0byBGcmFtZWJ1ZmZlciBvYmplY3Q/XG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2xDaGVja0Vycm9yKGdsKSB7XG4gIC8vIEVuc3VyZSBhbGwgZXJyb3JzIGFyZSBjbGVhcmVkXG4gIGxldCBlcnJvcjtcbiAgbGV0IGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB3aGlsZSAoZ2xFcnJvciAhPT0gZ2wuTk9fRVJST1IpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihnbEdldEVycm9yTWVzc2FnZShnbCwgZ2xFcnJvcikpO1xuICAgIH1cbiAgICBnbEVycm9yID0gZ2wuZ2V0RXJyb3IoKTtcbiAgfVxuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBnbEdldEVycm9yTWVzc2FnZShnbCwgZ2xFcnJvcikge1xuICBzd2l0Y2ggKGdsRXJyb3IpIHtcbiAgY2FzZSBnbC5DT05URVhUX0xPU1RfV0VCR0w6XG4gICAgLy8gIElmIHRoZSBXZWJHTCBjb250ZXh0IGlzIGxvc3QsIHRoaXMgZXJyb3IgaXMgcmV0dXJuZWQgb24gdGhlXG4gICAgLy8gZmlyc3QgY2FsbCB0byBnZXRFcnJvci4gQWZ0ZXJ3YXJkcyBhbmQgdW50aWwgdGhlIGNvbnRleHQgaGFzIGJlZW5cbiAgICAvLyByZXN0b3JlZCwgaXQgcmV0dXJucyBnbC5OT19FUlJPUi5cbiAgICByZXR1cm4gJ1dlYkdMIGNvbnRleHQgbG9zdCc7XG5cbiAgY2FzZSBnbC5JTlZBTElEX0VOVU06XG4gICAgLy8gQW4gdW5hY2NlcHRhYmxlIHZhbHVlIGhhcyBiZWVuIHNwZWNpZmllZCBmb3IgYW4gZW51bWVyYXRlZCBhcmd1bWVudC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZW51bWVyYXRlZCBhcmd1bWVudCc7XG5cbiAgY2FzZSBnbC5JTlZBTElEX1ZBTFVFOlxuICAgIC8vIEEgbnVtZXJpYyBhcmd1bWVudCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIHZhbHVlJztcblxuICBjYXNlIGdsLklOVkFMSURfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBzcGVjaWZpZWQgY29tbWFuZCBpcyBub3QgYWxsb3dlZCBmb3IgdGhlIGN1cnJlbnQgc3RhdGUuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIG9wZXJhdGlvbic7XG5cbiAgY2FzZSBnbC5JTlZBTElEX0ZSQU1FQlVGRkVSX09QRVJBVElPTjpcbiAgICAvLyBUaGUgY3VycmVudGx5IGJvdW5kIGZyYW1lYnVmZmVyIGlzIG5vdCBmcmFtZWJ1ZmZlciBjb21wbGV0ZVxuICAgIC8vIHdoZW4gdHJ5aW5nIHRvIHJlbmRlciB0byBvciB0byByZWFkIGZyb20gaXQuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIGZyYW1lYnVmZmVyIG9wZXJhdGlvbic7XG5cbiAgY2FzZSBnbC5PVVRfT0ZfTUVNT1JZOlxuICAgIC8vIE5vdCBlbm91Z2ggbWVtb3J5IGlzIGxlZnQgdG8gZXhlY3V0ZSB0aGUgY29tbWFuZC5cbiAgICByZXR1cm4gJ1dlYkdMIG91dCBvZiBtZW1vcnknO1xuXG4gIGRlZmF1bHQ6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgdW5rbm93biBlcnJvcic7XG4gIH1cbn1cblxuLy8gVE9ETyAtIGRvY3VtZW50IG9yIHJlbW92ZVxuZnVuY3Rpb24gY3JlYXRlRGVidWdDb250ZXh0KGN0eCkge1xuICBjb25zdCBnbCA9IHt9O1xuICBmb3IgKHZhciBtIGluIGN0eCkge1xuICAgIHZhciBmID0gY3R4W21dO1xuICAgIGlmICh0eXBlb2YgZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZ2xbbV0gPSAoKGssIHYpID0+IHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuam9pbi5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBsZXQgYW5zO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhbnMgPSB2LmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7a30gJHtlfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBlcnJvclN0YWNrID0gW107XG4gICAgICAgICAgbGV0IGVycm9yO1xuICAgICAgICAgIHdoaWxlICgoZXJyb3IgPSBjdHguZ2V0RXJyb3IoKSkgIT09IGN0eC5OT19FUlJPUikge1xuICAgICAgICAgICAgZXJyb3JTdGFjay5wdXNoKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVycm9yU3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvclN0YWNrLmpvaW4oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFucztcbiAgICAgICAgfTtcbiAgICAgIH0pKG0sIGYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbFttXSA9IGY7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGdsO1xufVxuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cbi8vIFRPRE8gLSBnZW5lcmljIGRyYXcgY2FsbFxuLy8gT25lIG9mIHRoZSBnb29kIHRoaW5ncyBhYm91dCBHTCBpcyB0aGF0IHRoZXJlIGFyZSBzbyBtYW55IHdheXMgdG8gZHJhdyB0aGluZ3NcbmltcG9ydCB7Z2V0RXh0ZW5zaW9ufSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHtHTF9JTkRFWF9UWVBFUywgR0xfRFJBV19NT0RFU30gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIEEgZ29vZCB0aGluZyBhYm91dCB3ZWJHTCBpcyB0aGF0IHRoZXJlIGFyZSBzbyBtYW55IHdheXMgdG8gZHJhdyB0aGluZ3MsXG4vLyBkZXBlbmRpbmcgb24gd2hldGhlciBkYXRhIGlzIGluZGV4ZWQgYW5kL29yIGluc3RhbmNlZC5cbi8vIFRoaXMgZnVuY3Rpb24gdW5pZmllcyB0aG9zZSBpbnRvIGEgc2luZ2xlIGNhbGwgd2l0aCBzaW1wbGUgcGFyYW1ldGVyc1xuLy8gdGhhdCBoYXZlIHNhbmUgZGVmYXVsdHMuXG5leHBvcnQgZnVuY3Rpb24gZHJhdyhnbCwge1xuICBkcmF3TW9kZSA9IG51bGwsIHZlcnRleENvdW50LCBvZmZzZXQgPSAwLFxuICBpbmRleGVkLCBpbmRleFR5cGUgPSBudWxsLFxuICBpbnN0YW5jZWQgPSBmYWxzZSwgaW5zdGFuY2VDb3VudCA9IDBcbn0pIHtcbiAgZHJhd01vZGUgPSBkcmF3TW9kZSA/IGdsLmdldChkcmF3TW9kZSkgOiBnbC5UUklBTkdMRVM7XG4gIGluZGV4VHlwZSA9IGluZGV4VHlwZSA/IGdsLmdldChpbmRleFR5cGUpIDogZ2wuVU5TSUdORURfU0hPUlQ7XG5cbiAgYXNzZXJ0KEdMX0RSQVdfTU9ERVMoZ2wpLmluZGV4T2YoZHJhd01vZGUpID4gLTEsICdJbnZhbGlkIGRyYXcgbW9kZScpO1xuICBhc3NlcnQoR0xfSU5ERVhfVFlQRVMoZ2wpLmluZGV4T2YoaW5kZXhUeXBlKSA+IC0xLCAnSW52YWxpZCBpbmRleCB0eXBlJyk7XG5cbiAgLy8gVE9ETyAtIFVzZSBwb2x5ZmlsbGVkIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgaW5zdGVhZCBvZiBBTkdMRSBleHRlbnNpb25cbiAgaWYgKGluc3RhbmNlZCkge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbignQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgIGlmIChpbmRleGVkKSB7XG4gICAgICBleHRlbnNpb24uZHJhd0VsZW1lbnRzSW5zdGFuY2VkQU5HTEUoXG4gICAgICAgIGRyYXdNb2RlLCB2ZXJ0ZXhDb3VudCwgaW5kZXhUeXBlLCBvZmZzZXQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3QXJyYXlzSW5zdGFuY2VkQU5HTEUoXG4gICAgICAgIGRyYXdNb2RlLCBvZmZzZXQsIHZlcnRleENvdW50LCBpbnN0YW5jZUNvdW50XG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpbmRleGVkKSB7XG4gICAgZ2wuZHJhd0VsZW1lbnRzKGRyYXdNb2RlLCB2ZXJ0ZXhDb3VudCwgaW5kZXhUeXBlLCBvZmZzZXQpO1xuICB9IGVsc2Uge1xuICAgIGdsLmRyYXdBcnJheXMoZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQpO1xuICB9XG59XG4iLCJcbmltcG9ydCB7VGV4dHVyZTJEfSBmcm9tICcuL3RleHR1cmUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGcmFtZWJ1ZmZlciB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcblxuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoID8gb3B0cy53aWR0aCA6IDE7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRzLmhlaWdodCA/IG9wdHMuaGVpZ2h0IDogMTtcbiAgICB0aGlzLmRlcHRoID0gb3B0cy5kZXB0aCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IG9wdHMuZGVwdGg7XG4gICAgdGhpcy5taW5GaWx0ZXIgPSBvcHRzLm1pbkZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMubWFnRmlsdGVyID0gb3B0cy5tYWdGaWx0ZXIgfHwgZ2wuTkVBUkVTVDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0IHx8IGdsLlJHQkE7XG4gICAgdGhpcy50eXBlID0gb3B0cy50eXBlIHx8IGdsLlVOU0lHTkVEX0JZVEU7XG4gICAgdGhpcy5mYm8gPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIHRoaXMuYmluZCgpO1xuXG4gICAgdGhpcy50ZXh0dXJlID0gbmV3IFRleHR1cmUyRChnbCwge1xuICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgbWluRmlsdGVyOiB0aGlzLm1pbkZpbHRlcixcbiAgICAgIG1hZ0ZpbHRlcjogdGhpcy5tYWdGaWx0ZXIsXG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBmb3JtYXQ6IHRoaXMuZm9ybWF0XG4gICAgfSk7XG5cbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChcbiAgICAgIGdsLkZSQU1FQlVGRkVSLFxuICAgICAgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZS50ZXh0dXJlLCAwXG4gICAgKTtcblxuICAgIGlmICh0aGlzLmRlcHRoKSB7XG4gICAgICB0aGlzLmRlcHRoID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgdGhpcy5kZXB0aCk7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKFxuICAgICAgICBnbC5SRU5ERVJCVUZGRVIsIGdsLkRFUFRIX0NPTVBPTkVOVDE2LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodFxuICAgICAgKTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKFxuICAgICAgICBnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCwgZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoXG4gICAgICApO1xuICAgIH1cblxuICAgIHZhciBzdGF0dXMgPSBnbC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKGdsLkZSQU1FQlVGRkVSKTtcbiAgICBpZiAoc3RhdHVzICE9PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGcmFtZWJ1ZmZlciBjcmVhdGlvbiBmYWlsZWQuJyk7XG4gICAgfVxuXG4gICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG5cbiAgfVxuXG4gIGJpbmQoKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgdGhpcy5mYm8pO1xuICB9XG5cbn1cbiIsIi8vIENvbnRhaW5zIGNsYXNzIGFuZCBmdW5jdGlvbiB3cmFwcGVycyBhcm91bmQgbG93IGxldmVsIHdlYmdsIG9iamVjdHNcbi8vIFRoZXNlIGNsYXNzZXMgYXJlIGludGVuZGVkIHRvIHN0YXkgY2xvc2UgdG8gdGhlIFdlYkdMIEFQSSBzZW1hbnRpY3Ncbi8vIGJ1dCBtYWtlIGl0IGVhc2llciB0byB1c2UuXG4vLyBIaWdoZXIgbGV2ZWwgYWJzdHJhY3Rpb25zIGNhbiBiZSBidWlsdCBvbiB0aGVzZSBjbGFzc2VzXG5leHBvcnQgKiBmcm9tICcuL3R5cGVzJztcbmV4cG9ydCAqIGZyb20gJy4vY29udGV4dCc7XG5leHBvcnQgKiBmcm9tICcuL2RyYXcnO1xuZXhwb3J0IHtkZWZhdWx0IGFzIEJ1ZmZlcn0gZnJvbSAnLi9idWZmZXInO1xuZXhwb3J0IHtkZWZhdWx0IGFzIFByb2dyYW19IGZyb20gJy4vcHJvZ3JhbSc7XG5leHBvcnQge2RlZmF1bHQgYXMgRnJhbWVidWZmZXJ9IGZyb20gJy4vZmJvJztcbmV4cG9ydCB7VGV4dHVyZTJELCBUZXh0dXJlQ3ViZX0gZnJvbSAnLi90ZXh0dXJlJztcbiIsIi8vIENyZWF0ZXMgcHJvZ3JhbXMgb3V0IG9mIHNoYWRlcnMgYW5kIHByb3ZpZGVzIGNvbnZlbmllbnQgbWV0aG9kcyBmb3IgbG9hZGluZ1xuLy8gYnVmZmVycyBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlLCBjb21wbGV4aXR5ICovXG5cbi8qIGdsb2JhbCBjb25zb2xlICovXG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge1ZlcnRleFNoYWRlciwgRnJhZ21lbnRTaGFkZXJ9IGZyb20gJy4vc2hhZGVyJztcbmltcG9ydCBTaGFkZXJzIGZyb20gJy4uL3NoYWRlcnMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9ncmFtIHtcblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIEhhbmRsZXMgY3JlYXRpb24gb2YgcHJvZ3JhbXMsIG1hcHBpbmcgb2YgYXR0cmlidXRlcyBhbmQgdW5pZm9ybXNcbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGdsIGNvbnRleHRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnZzIC0gVmVydGV4IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZnMgLSBGcmFnbWVudCBzaGFkZXIgc291cmNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmlkPSAtIElkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cywgZnMsIGlkKSB7XG4gICAgYXNzZXJ0KGdsLCAnUHJvZ3JhbSBuZWVkcyBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcblxuICAgIGxldCB2cztcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0RFUFJFQ0FURUQ6IE5ldyB1c2U6IFByb2dyYW0oZ2wsIHt2cywgZnMsIGlkfSknKTtcbiAgICAgIHZzID0gb3B0cztcbiAgICB9IGVsc2Uge1xuICAgICAgdnMgPSBvcHRzLnZzO1xuICAgICAgZnMgPSBvcHRzLmZzO1xuICAgICAgaWQgPSBvcHRzLmlkO1xuICAgIH1cblxuICAgIHZzID0gdnMgfHwgU2hhZGVycy5WZXJ0ZXguRGVmYXVsdDtcbiAgICBmcyA9IGZzIHx8IFNoYWRlcnMuRnJhZ21lbnQuRGVmYXVsdDtcblxuICAgIGNvbnN0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgaWYgKCFwcm9ncmFtKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgcHJvZ3JhbScpO1xuICAgIH1cblxuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgVmVydGV4U2hhZGVyKGdsLCB2cykuaGFuZGxlKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgbmV3IEZyYWdtZW50U2hhZGVyKGdsLCBmcykuaGFuZGxlKTtcbiAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcbiAgICBjb25zdCBsaW5rZWQgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKTtcbiAgICBpZiAoIWxpbmtlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBsaW5raW5nICR7Z2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSl9YCk7XG4gICAgfVxuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaWQgPSBpZCB8fCB1aWQoKTtcbiAgICB0aGlzLnByb2dyYW0gPSBwcm9ncmFtO1xuICAgIC8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChpLmUuIGluZGljZXMpXG4gICAgdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnMgPSBnZXRBdHRyaWJ1dGVMb2NhdGlvbnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIHByZXBhcmUgdW5pZm9ybSBzZXR0ZXJzXG4gICAgdGhpcy51bmlmb3JtU2V0dGVycyA9IGdldFVuaWZvcm1TZXR0ZXJzKGdsLCBwcm9ncmFtKTtcbiAgICAvLyBubyBhdHRyaWJ1dGVzIGVuYWJsZWQgeWV0XG4gICAgdGhpcy5hdHRyaWJ1dGVFbmFibGVkID0ge307XG4gIH1cblxuICB1c2UoKSB7XG4gICAgdGhpcy5nbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRUZXh0dXJlKHRleHR1cmUsIGluZGV4KSB7XG4gICAgdGV4dHVyZS5iaW5kKGluZGV4KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm0obmFtZSwgdmFsdWUpIHtcbiAgICBpZiAobmFtZSBpbiB0aGlzLnVuaWZvcm1TZXR0ZXJzKSB7XG4gICAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzW25hbWVdKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRVbmlmb3Jtcyh1bmlmb3JtTWFwKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKHVuaWZvcm1NYXApKSB7XG4gICAgICBpZiAobmFtZSBpbiB0aGlzLnVuaWZvcm1TZXR0ZXJzKSB7XG4gICAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odW5pZm9ybU1hcFtuYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0QnVmZmVyKGJ1ZmZlcikge1xuICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyLmF0dHJpYnV0ZV07XG4gICAgYnVmZmVyLmF0dGFjaFRvTG9jYXRpb24obG9jYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0QnVmZmVycyhidWZmZXJzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYnVmZmVycyksICdQcm9ncmFtLnNldEJ1ZmZlcnMgZXhwZWN0cyBhcnJheScpO1xuICAgIGJ1ZmZlcnMgPSBidWZmZXJzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGJ1ZmZlcnNbMF0pID9cbiAgICAgIGJ1ZmZlcnNbMF0gOiBidWZmZXJzO1xuICAgIGZvciAoY29uc3QgYnVmZmVyIG9mIGJ1ZmZlcnMpIHtcbiAgICAgIHRoaXMuc2V0QnVmZmVyKGJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1tidWZmZXIuYXR0cmlidXRlXTtcbiAgICBidWZmZXIuZGV0YWNoRnJvbUxvY2F0aW9uKGxvY2F0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0QnVmZmVycyhidWZmZXJzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYnVmZmVycyksICdQcm9ncmFtLnNldEJ1ZmZlcnMgZXhwZWN0cyBhcnJheScpO1xuICAgIGJ1ZmZlcnMgPSBidWZmZXJzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGJ1ZmZlcnNbMF0pID9cbiAgICAgIGJ1ZmZlcnNbMF0gOiBidWZmZXJzO1xuICAgIGZvciAoY29uc3QgYnVmZmVyIG9mIGJ1ZmZlcnMpIHtcbiAgICAgIHRoaXMudW5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG4vLyBUT0RPIC0gdXNlIHRhYmxlcyB0byByZWR1Y2UgY29tcGxleGl0eSBvZiBtZXRob2QgYmVsb3dcbi8vIGNvbnN0IGdsVW5pZm9ybVNldHRlciA9IHtcbi8vICAgRkxPQVQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBGTE9BVF9WRUMzOiB7ZnVuY3Rpb246ICd1bmlmb3JtM2Z2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgRkxPQVRfTUFUNDoge2Z1bmN0aW9uOiAndW5pZm9ybU1hdHJpeDRmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIElOVDoge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fSxcbi8vICAgQk9PTDoge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fSxcbi8vICAgU0FNUExFUl8yRDoge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fSxcbi8vICAgU0FNUExFUl9DVUJFOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9XG4vLyB9O1xuXG4vLyBSZXR1cm5zIGEgTWFnaWMgVW5pZm9ybSBTZXR0ZXJcbmZ1bmN0aW9uIGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGdsUHJvZ3JhbSwgaW5mbywgaXNBcnJheSkge1xuICBjb25zdCB7bmFtZSwgdHlwZX0gPSBpbmZvO1xuICBjb25zdCBsb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oZ2xQcm9ncmFtLCBuYW1lKTtcblxuICBsZXQgbWF0cml4ID0gZmFsc2U7XG4gIGxldCB2ZWN0b3IgPSB0cnVlO1xuICBsZXQgZ2xGdW5jdGlvbjtcbiAgbGV0IFR5cGVkQXJyYXk7XG5cbiAgaWYgKGluZm8uc2l6ZSA+IDEgJiYgaXNBcnJheSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuXG4gICAgY2FzZSBnbC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWZ2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBGbG9hdDMyQXJyYXk7XG4gICAgICB2ZWN0b3IgPSB0cnVlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIGdsLkZMT0FUX01BVDQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBGbG9hdDMyQXJyYXk7XG4gICAgICB2ZWN0b3IgPSB0cnVlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIGdsLklOVDpcbiAgICBjYXNlIGdsLkJPT0w6XG4gICAgY2FzZSBnbC5TQU1QTEVSXzJEOlxuICAgIGNhc2UgZ2wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaXY7XG4gICAgICBUeXBlZEFycmF5ID0gVWludDE2QXJyYXk7XG4gICAgICB2ZWN0b3IgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5pZm9ybTogVW5rbm93biBHTFNMIHR5cGUgJyArIHR5cGUpO1xuXG4gICAgfVxuICB9XG5cbiAgaWYgKHZlY3Rvcikge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgZ2wuRkxPQVQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFmO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUMyOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0yZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGZ2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlQ6IGNhc2UgZ2wuQk9PTDogY2FzZSBnbC5TQU1QTEVSXzJEOiBjYXNlIGdsLlNBTVBMRVJfQ1VCRTpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUMyOiBjYXNlIGdsLkJPT0xfVkVDMjpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMml2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzM6IGNhc2UgZ2wuQk9PTF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDNDogY2FzZSBnbC5CT09MX1ZFQzQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTRpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX01BVDI6XG4gICAgICBtYXRyaXggPSB0cnVlO1xuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXgyZnY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX01BVDM6XG4gICAgICBtYXRyaXggPSB0cnVlO1xuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXgzZnY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX01BVDQ6XG4gICAgICBtYXRyaXggPSB0cnVlO1xuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXg0ZnY7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZ2xGdW5jdGlvbiA9IGdsRnVuY3Rpb24uYmluZChnbCk7XG5cbiAgLy8gU2V0IGEgdW5pZm9ybSBhcnJheVxuICBpZiAoaXNBcnJheSAmJiBUeXBlZEFycmF5KSB7XG5cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBuZXcgVHlwZWRBcnJheSh2YWwpKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChtYXRyaXgpIHtcbiAgICAvLyBTZXQgYSBtYXRyaXggdW5pZm9ybVxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIGZhbHNlLCB2YWwudG9GbG9hdDMyQXJyYXkoKSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH07XG5cbiAgfSBlbHNlIGlmIChUeXBlZEFycmF5KSB7XG5cbiAgICAvLyBTZXQgYSB2ZWN0b3IvdHlwZWQgYXJyYXkgdW5pZm9ybVxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgVHlwZWRBcnJheS5zZXQodmFsLnRvRmxvYXQzMkFycmF5ID8gdmFsLnRvRmxvYXQzMkFycmF5KCkgOiB2YWwpO1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIFR5cGVkQXJyYXkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9O1xuXG4gIH1cbiAgLy8gU2V0IGEgcHJpbWl0aXZlLXZhbHVlZCB1bmlmb3JtXG4gIHJldHVybiB2YWwgPT4ge1xuICAgIGdsRnVuY3Rpb24obG9jLCB2YWwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH07XG5cbn1cblxuLy8gY3JlYXRlIHVuaWZvcm0gc2V0dGVyc1xuLy8gTWFwIG9mIHVuaWZvcm0gbmFtZXMgdG8gc2V0dGVyIGZ1bmN0aW9uc1xuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIGdsUHJvZ3JhbSkge1xuICBjb25zdCB1bmlmb3JtU2V0dGVycyA9IHt9O1xuICBjb25zdCBsZW5ndGggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKGdsUHJvZ3JhbSwgaSk7XG4gICAgbGV0IG5hbWUgPSBpbmZvLm5hbWU7XG4gICAgLy8gaWYgYXJyYXkgbmFtZSB0aGVuIGNsZWFuIHRoZSBhcnJheSBicmFja2V0c1xuICAgIG5hbWUgPSBuYW1lW25hbWUubGVuZ3RoIC0gMV0gPT09ICddJyA/XG4gICAgICBuYW1lLnN1YnN0cigwLCBuYW1lLmxlbmd0aCAtIDMpIDogbmFtZTtcbiAgICB1bmlmb3JtU2V0dGVyc1tuYW1lXSA9XG4gICAgICBnZXRVbmlmb3JtU2V0dGVyKGdsLCBnbFByb2dyYW0sIGluZm8sIGluZm8ubmFtZSAhPT0gbmFtZSk7XG4gIH1cbiAgcmV0dXJuIHVuaWZvcm1TZXR0ZXJzO1xufVxuXG4vLyBkZXRlcm1pbmUgYXR0cmlidXRlIGxvY2F0aW9ucyAobWFwcyBhdHRyaWJ1dGUgbmFtZSB0byBpbmRleClcbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyk7XG4gIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZUF0dHJpYihnbFByb2dyYW0sIGkpO1xuICAgIGNvbnN0IGluZGV4ID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oZ2xQcm9ncmFtLCBpbmZvLm5hbWUpO1xuICAgIGF0dHJpYnV0ZUxvY2F0aW9uc1tpbmZvLm5hbWVdID0gaW5kZXg7XG4gIH1cbiAgcmV0dXJuIGF0dHJpYnV0ZUxvY2F0aW9ucztcbn1cbiIsImltcG9ydCBmb3JtYXRDb21waWxlckVycm9yIGZyb20gJ2dsLWZvcm1hdC1jb21waWxlci1lcnJvcic7XG5cbi8vIEZvciBub3cgdGhpcyBpcyBhbiBpbnRlcm5hbCBjbGFzc1xuZXhwb3J0IGNsYXNzIFNoYWRlciB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSwgc2hhZGVyVHlwZSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVNoYWRlcihzaGFkZXJUeXBlKTtcbiAgICBpZiAodGhpcy5oYW5kbGUgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgY3JlYXRpbmcgc2hhZGVyIHdpdGggdHlwZSAke3NoYWRlclR5cGV9YCk7XG4gICAgfVxuICAgIGdsLnNoYWRlclNvdXJjZSh0aGlzLmhhbmRsZSwgc2hhZGVyU291cmNlKTtcbiAgICBnbC5jb21waWxlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICB2YXIgY29tcGlsZWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIodGhpcy5oYW5kbGUsIGdsLkNPTVBJTEVfU1RBVFVTKTtcbiAgICBpZiAoIWNvbXBpbGVkKSB7XG4gICAgICB2YXIgaW5mbyA9IGdsLmdldFNoYWRlckluZm9Mb2codGhpcy5oYW5kbGUpO1xuICAgICAgZ2wuZGVsZXRlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCAqL1xuICAgICAgdmFyIGZvcm1hdHRlZExvZztcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvcm1hdHRlZExvZyA9IGZvcm1hdENvbXBpbGVyRXJyb3IoaW5mbywgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgLyogZ2xvYmFsIGNvbnNvbGUgKi9cbiAgICAgICAgY29uc29sZS53YXJuKCdFcnJvciBmb3JtYXR0aW5nIGdsc2wgY29tcGlsZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciB3aGlsZSBjb21waWxpbmcgdGhlIHNoYWRlciAke2luZm99YCk7XG4gICAgICB9XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXRyeS1jYXRjaCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGZvcm1hdHRlZExvZy5sb25nKTtcbiAgICB9XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVmVydGV4U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLlZFUlRFWF9TSEFERVIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGcmFnbWVudFNoYWRlciBleHRlbmRzIFNoYWRlciB7XG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXJTb3VyY2UpIHtcbiAgICBzdXBlcihnbCwgc2hhZGVyU291cmNlLCBnbC5GUkFHTUVOVF9TSEFERVIpO1xuICB9XG59XG4iLCJpbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcblxuY2xhc3MgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnRhcmdldCA9IGdsLlRFWFRVUkVfMkQ7XG5cbiAgICBvcHRzID0gbWVyZ2Uoe1xuICAgICAgZmxpcFk6IHRydWUsXG4gICAgICBhbGlnbm1lbnQ6IDEsXG4gICAgICBtYWdGaWx0ZXI6IGdsLk5FQVJFU1QsXG4gICAgICBtaW5GaWx0ZXI6IGdsLk5FQVJFU1QsXG4gICAgICB3cmFwUzogZ2wuQ0xBTVBfVE9fRURHRSxcbiAgICAgIHdyYXBUOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgZm9ybWF0OiBnbC5SR0JBLFxuICAgICAgdHlwZTogZ2wuVU5TSUdORURfQllURSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwOiBmYWxzZVxuICAgIH0sIG9wdHMpO1xuXG4gICAgdGhpcy5mbGlwWSA9IG9wdHMuZmxpcFk7XG4gICAgdGhpcy5hbGlnbm1lbnQgPSBvcHRzLmFsaWdubWVudDtcbiAgICB0aGlzLm1hZ0ZpbHRlciA9IG9wdHMubWFnRmlsdGVyO1xuICAgIHRoaXMubWluRmlsdGVyID0gb3B0cy5taW5GaWx0ZXI7XG4gICAgdGhpcy53cmFwUyA9IG9wdHMud3JhcFM7XG4gICAgdGhpcy53cmFwVCA9IG9wdHMud3JhcFQ7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRzLmZvcm1hdDtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG4gICAgdGhpcy5nZW5lcmF0ZU1pcG1hcCA9IG9wdHMuZ2VuZXJhdGVNaXBtYXA7XG5cbiAgICBpZiAodGhpcy50eXBlID09PSBnbC5GTE9BVCkge1xuICAgICAgdGhpcy5mbG9hdEV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbignT0VTX3RleHR1cmVfZmxvYXQnKTtcbiAgICAgIGlmICghdGhpcy5mbG9hdEV4dGVuc2lvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09FU190ZXh0dXJlX2Zsb2F0IGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy50ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIGlmICghdGhpcy50ZXh0dXJlKSB7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cblxuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZSk7XG4gICAgdGhpcy50ZXh0dXJlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZTJEIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBzdXBlcihnbCwgb3B0cyk7XG4gICAgb3B0cy5kYXRhID0gb3B0cy5kYXRhIHx8IG51bGw7XG5cbiAgICB0aGlzLndpZHRoID0gMDtcbiAgICB0aGlzLmhlaWdodCA9IDA7XG4gICAgdGhpcy5ib3JkZXIgPSAwO1xuICAgIHRoaXMuZGF0YSA9IG51bGw7XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG5cbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgaWYgKHRoaXMuZmxpcFkpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgZmFsc2UpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LFxuICAgICAgICB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsXG4gICAgICAgIHRoaXMuZGF0YSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRleHR1cmVDdWJlIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBzdXBlcihnbCwgb3B0cyk7XG4gICAgb3B0cy5kYXRhID0gb3B0cy5kYXRhIHx8IG51bGw7XG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBiaW5kKGluZGV4KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGhpcy50ZXh0dXJlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpIC0gZ2wuVEVYVFVSRTA7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG1heC1sZW4gKi9cbiAgdXBkYXRlKG9wdHMpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRzLmhlaWdodDtcbiAgICB0aGlzLmJvcmRlciA9IG9wdHMuYm9yZGVyIHx8IDA7XG4gICAgdGhpcy5kYXRhID0gb3B0cy5kYXRhO1xuICAgIHRoaXMuYmluZCgpO1xuICAgIGlmICh0aGlzLndpZHRoIHx8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3MueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMubWluRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLm1hZ0ZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLndyYXBTKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMud3JhcFQpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKHRoaXMuZ2VuZXJhdGVNaXBtYXApIHtcbiAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfQ1VCRV9NQVApO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgfVxuXG59XG4iLCIvLyBIZWxwZXIgZGVmaW5pdGlvbnMgZm9yIHZhbGlkYXRpb24gb2Ygd2ViZ2wgcGFyYW1ldGVyc1xuLyogZXNsaW50LWRpc2FibGUgbm8taW5saW5lLWNvbW1lbnRzLCBtYXgtbGVuICovXG5cbi8vIFRPRE8gLSByZW1vdmVcbmV4cG9ydCB7aXNUeXBlZEFycmF5LCBtYWtlVHlwZWRBcnJheX0gZnJvbSAnLi4vdXRpbHMnO1xuXG4vLyBJTkRFWCBUWVBFU1xuXG4vLyBGb3IgZHJhd0VsZW1lbnRzLCBzaXplIG9mIGluZGljZXNcbmV4cG9ydCBjb25zdCBJTkRFWF9UWVBFUyA9IFsnVU5TSUdORURfQllURScsICdVTlNJR05FRF9TSE9SVCddO1xuZXhwb3J0IGNvbnN0IEdMX0lOREVYX1RZUEVTID0gZ2wgPT4gSU5ERVhfVFlQRVMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0luZGV4VHlwZSh0eXBlKSB7XG4gIHJldHVybiBJTkRFWF9UWVBFUy5pbmRleE9mKHR5cGUpICE9PSAtMTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0dMSW5kZXhUeXBlKGdsVHlwZSkge1xuICByZXR1cm4gR0xfSU5ERVhfVFlQRVMuaW5kZXhPZihnbFR5cGUpICE9PSAtMTtcbn1cblxuLy8gRFJBVyBNT0RFU1xuXG5leHBvcnQgY29uc3QgRFJBV19NT0RFUyA9IFtcbiAgJ1BPSU5UUycsICdMSU5FX1NUUklQJywgJ0xJTkVfTE9PUCcsICdMSU5FUycsXG4gICdUUklBTkdMRV9TVFJJUCcsICdUUklBTkdMRV9GQU4nLCAnVFJJQU5HTEVTJ1xuXTtcbmV4cG9ydCBjb25zdCBHTF9EUkFXX01PREVTID0gZ2wgPT4gRFJBV19NT0RFUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRHJhd01vZGUobW9kZSkge1xuICByZXR1cm4gRFJBV19NT0RFUy5pbmRleE9mKG1vZGUpICE9PSAtMTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0dMRHJhd01vZGUoZ2xNb2RlKSB7XG4gIHJldHVybiBHTF9EUkFXX01PREVTLmluZGV4T2YoZ2xNb2RlKSAhPT0gLTE7XG59XG5cbi8vIFRBUkdFVCBUWVBFU1xuXG5leHBvcnQgY29uc3QgVEFSR0VUUyA9IFtcbiAgJ0FSUkFZX0JVRkZFUicsIC8vIHZlcnRleCBhdHRyaWJ1dGVzIChlLmcuIHZlcnRleC90ZXh0dXJlIGNvb3JkcyBvciBjb2xvcilcbiAgJ0VMRU1FTlRfQVJSQVlfQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIGVsZW1lbnQgaW5kaWNlcy5cbiAgLy8gRm9yIFdlYkdMIDIgY29udGV4dHNcbiAgJ0NPUFlfUkVBRF9CVUZGRVInLCAvLyBCdWZmZXIgZm9yIGNvcHlpbmcgZnJvbSBvbmUgYnVmZmVyIG9iamVjdCB0byBhbm90aGVyXG4gICdDT1BZX1dSSVRFX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgY29weWluZyBmcm9tIG9uZSBidWZmZXIgb2JqZWN0IHRvIGFub3RoZXJcbiAgJ1RSQU5TRk9STV9GRUVEQkFDS19CVUZGRVInLCAvLyBCdWZmZXIgZm9yIHRyYW5zZm9ybSBmZWVkYmFjayBvcGVyYXRpb25zXG4gICdVTklGT1JNX0JVRkZFUicsIC8vIEJ1ZmZlciB1c2VkIGZvciBzdG9yaW5nIHVuaWZvcm0gYmxvY2tzXG4gICdQSVhFTF9QQUNLX0JVRkZFUicsIC8vIEJ1ZmZlciB1c2VkIGZvciBwaXhlbCB0cmFuc2ZlciBvcGVyYXRpb25zXG4gICdQSVhFTF9VTlBBQ0tfQlVGRkVSJyAvLyBCdWZmZXIgdXNlZCBmb3IgcGl4ZWwgdHJhbnNmZXIgb3BlcmF0aW9uc1xuXTtcblxuZXhwb3J0IGNvbnN0IEdMX1RBUkdFVFMgPVxuICBnbCA9PiBUQVJHRVRTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pLmZpbHRlcihjb25zdGFudCA9PiBjb25zdGFudCk7XG5cbi8vIFVTQUdFIFRZUEVTXG5cbmV4cG9ydCBjb25zdCBCVUZGRVJfVVNBR0UgPSBbXG4gICdTVEFUSUNfRFJBVycsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gICdEWU5BTUlDX0RSQVcnLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gICdTVFJFQU1fRFJBVycsIC8vIEJ1ZmZlciBub3QgdXNlZCBvZnRlbi4gQ29udGVudHMgYXJlIHdyaXR0ZW4gdG8gdGhlIGJ1ZmZlciwgYnV0IG5vdCByZWFkLlxuICAvLyBGb3IgV2ViR0wgMiBjb250ZXh0c1xuICAnU1RBVElDX1JFQUQnLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIHJlYWQgZnJvbSB0aGUgYnVmZmVyLCBidXQgbm90IHdyaXR0ZW4uXG4gICdEWU5BTUlDX1JFQUQnLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ1NUUkVBTV9SRUFEJywgLy8gQ29udGVudHMgb2YgdGhlIGJ1ZmZlciBhcmUgbGlrZWx5IHRvIG5vdCBiZSB1c2VkIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ1NUQVRJQ19DT1BZJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSBuZWl0aGVyIHdyaXR0ZW4gb3IgcmVhZCBieSB0aGUgdXNlci5cbiAgJ0RZTkFNSUNfQ09QWScsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSBuZWl0aGVyIHdyaXR0ZW4gb3IgcmVhZCBieSB0aGUgdXNlci5cbiAgJ1NUUkVBTV9DT1BZJyAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuXTtcblxuZXhwb3J0IGNvbnN0IEdMX0JVRkZFUl9VU0FHRSA9XG4gIGdsID0+IEJVRkZFUl9VU0FHRS5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKS5maWx0ZXIoY29uc3RhbnQgPT4gY29uc3RhbnQpO1xuIl19
