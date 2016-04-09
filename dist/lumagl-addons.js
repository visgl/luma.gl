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

},{"pad-left":19}],2:[function(require,module,exports){
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

},{"util/":23}],3:[function(require,module,exports){
module.exports = function _atob(str) {
  return atob(str)
}

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
var gl10 = require('./1.0/numbers')

module.exports = function lookupConstant (number) {
  return gl10[number]
}

},{"./1.0/numbers":7}],9:[function(require,module,exports){

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


},{"add-line-numbers":1,"gl-constants/lookup":8,"glsl-shader-name":10,"sprintf-js":21}],10:[function(require,module,exports){
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

},{"atob-lite":3,"glsl-tokenizer":17}],11:[function(require,module,exports){
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

},{"./lib/builtins":13,"./lib/builtins-300es":12,"./lib/literals":15,"./lib/literals-300es":14,"./lib/operators":16}],12:[function(require,module,exports){
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

},{"./builtins":13}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./literals":15}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
var tokenize = require('./index')

module.exports = tokenizeString

function tokenizeString(str, opt) {
  var generator = tokenize(opt)
  var tokens = []

  tokens = tokens.concat(generator(str))
  tokens = tokens.concat(generator(null))

  return tokens
}

},{"./index":11}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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
},{"repeat-string":20}],20:[function(require,module,exports){
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


},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],23:[function(require,module,exports){
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

},{"./support/isBuffer":22,"_process":4,"inherits":18}],24:[function(require,module,exports){
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

},{"canvas-to-blob":5,"filesaver.js":6}],28:[function(require,module,exports){
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

},{"assert":2}],32:[function(require,module,exports){
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

},{"./context":33,"assert":2}],33:[function(require,module,exports){
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

},{"assert":2}],34:[function(require,module,exports){
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

},{"./context":33,"./types":40,"assert":2}],35:[function(require,module,exports){
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
      if (location === undefined) {
        if (buffer.attribute === 'vertices') {
          location = this.attributeLocations.position;
        } else if (buffer.attribute === 'colors') {
          location = this.attributeLocations.color;
        } else if (buffer.attribute === 'normals') {
          location = this.attributeLocations.normal;
        } else if (buffer.attribute === 'texCoords') {
          location = this.attributeLocations.texCoord1;
        }
      }
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

},{"../shaders":30,"../utils":31,"./context":33,"./shader":38,"assert":2}],38:[function(require,module,exports){
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

},{"gl-format-compiler-error":9}],39:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWRkLWxpbmUtbnVtYmVycy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2F0b2ItbGl0ZS9hdG9iLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy10by1ibG9iL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZpbGVzYXZlci5qcy9GaWxlU2F2ZXIuanMiLCJub2RlX21vZHVsZXMvZ2wtY29uc3RhbnRzLzEuMC9udW1iZXJzLmpzIiwibm9kZV9tb2R1bGVzL2dsLWNvbnN0YW50cy9sb29rdXAuanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtc2hhZGVyLW5hbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL2J1aWx0aW5zLTMwMGVzLmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9idWlsdGlucy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvbGl0ZXJhbHMtMzAwZXMuanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL2xpdGVyYWxzLmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9vcGVyYXRvcnMuanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcGFkLWxlZnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVwZWF0LXN0cmluZy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zcHJpbnRmLWpzL3NyYy9zcHJpbnRmLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwic3JjL2FkZG9ucy9meC5qcyIsInNyYy9hZGRvbnMvaGVscGVycy5qcyIsInNyYy9hZGRvbnMvaW5kZXguanMiLCJzcmMvYWRkb25zL3NhdmUtYml0bWFwLmpzIiwic3JjL2FkZG9ucy93b3JrZXJzLmpzIiwic3JjL2lvLmpzIiwic3JjL3NoYWRlcnMvaW5kZXguanMiLCJzcmMvdXRpbHMuanMiLCJzcmMvd2ViZ2wvYnVmZmVyLmpzIiwic3JjL3dlYmdsL2NvbnRleHQuanMiLCJzcmMvd2ViZ2wvZHJhdy5qcyIsInNyYy93ZWJnbC9mYm8uanMiLCJzcmMvd2ViZ2wvaW5kZXguanMiLCJzcmMvd2ViZ2wvcHJvZ3JhbS5qcyIsInNyYy93ZWJnbC9zaGFkZXIuanMiLCJzcmMvd2ViZ2wvdGV4dHVyZS5qcyIsInNyYy93ZWJnbC90eXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2V0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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NEJBQVUsQ0FDckIsY0FEcUI7QUFFckIsc0JBRnFCOztBQUlyQixrQkFKcUI7QUFLckIsbUJBTHFCO0FBTXJCLDJCQU5xQjtBQU9yQixnQkFQcUI7QUFRckIsbUJBUnFCO0FBU3JCO0FBVHFCLENBQVY7O0FBWU4sSUFBTSxrQ0FDWCxTQURXLFVBQ1g7U0FBTSxRQUFRLEdBQVIsQ0FBWTtXQUFZLEdBQUcsUUFBSDtHQUFaLENBQVosQ0FBc0MsTUFBdEMsQ0FBNkM7V0FBWTtHQUFaO0NBQW5EOzs7O0FBSUssSUFBTSxzQ0FBZSxDQUMxQixhQUQwQjtBQUUxQixjQUYwQjtBQUcxQixhQUgwQjs7QUFLMUIsYUFMMEI7QUFNMUIsY0FOMEI7QUFPMUIsYUFQMEI7QUFRMUIsYUFSMEI7QUFTMUIsY0FUMEI7QUFVMUI7QUFWMEIsQ0FBZjs7QUFhTixJQUFNLDRDQUNYLFNBRFcsZUFDWDtTQUFNLGFBQWEsR0FBYixDQUFpQjtXQUFZLEdBQUcsUUFBSDtHQUFaLENBQWpCLENBQTJDLE1BQTNDLENBQWtEO1dBQVk7R0FBWjtDQUF4RCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcGFkTGVmdCA9IHJlcXVpcmUoJ3BhZC1sZWZ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBhZGRMaW5lTnVtYmVyc1xuZnVuY3Rpb24gYWRkTGluZU51bWJlcnMgKHN0cmluZywgc3RhcnQsIGRlbGltKSB7XG4gIHN0YXJ0ID0gdHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJyA/IHN0YXJ0IDogMVxuICBkZWxpbSA9IGRlbGltIHx8ICc6ICdcblxuICB2YXIgbGluZXMgPSBzdHJpbmcuc3BsaXQoL1xccj9cXG4vKVxuICB2YXIgdG90YWxEaWdpdHMgPSBTdHJpbmcobGluZXMubGVuZ3RoICsgc3RhcnQgLSAxKS5sZW5ndGhcbiAgcmV0dXJuIGxpbmVzLm1hcChmdW5jdGlvbiAobGluZSwgaSkge1xuICAgIHZhciBjID0gaSArIHN0YXJ0XG4gICAgdmFyIGRpZ2l0cyA9IFN0cmluZyhjKS5sZW5ndGhcbiAgICB2YXIgcHJlZml4ID0gcGFkTGVmdChjLCB0b3RhbERpZ2l0cyAtIGRpZ2l0cylcbiAgICByZXR1cm4gcHJlZml4ICsgZGVsaW0gKyBsaW5lXG4gIH0pLmpvaW4oJ1xcbicpXG59XG4iLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAhaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKSB7XG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIH1cbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKSxcbiAgICAgIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfYXRvYihzdHIpIHtcbiAgcmV0dXJuIGF0b2Ioc3RyKVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh1cmkpIHtcbiAgICB2YXIgbWltZSAgID0gdXJpLnNwbGl0KCcsJylbMF0uc3BsaXQoJzonKVsxXS5zcGxpdCgnOycpWzBdO1xuICAgIHZhciBieXRlcyAgPSBhdG9iKHVyaS5zcGxpdCgnLCcpWzFdKTtcbiAgICB2YXIgbGVuICAgID0gYnl0ZXMubGVuZ3RoO1xuICAgIHZhciBidWZmZXIgPSBuZXcgd2luZG93LkFycmF5QnVmZmVyKGxlbik7XG4gICAgdmFyIGFyciAgICA9IG5ldyB3aW5kb3cuVWludDhBcnJheShidWZmZXIpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBhcnJbaV0gPSBieXRlcy5jaGFyQ29kZUF0KGkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQmxvYihbYXJyXSwgeyB0eXBlOiBtaW1lIH0pO1xufVxuXG4vLyBJRSA+PSAxMCwgbW9zdCBtb2Rlcm4gYnJvd3NlcnNcbi8vIFRoZSBCbG9iIHR5cGUgY2FuJ3QgYmUgcG9seWZpbGxlZCwgd2hpY2ggaXMgd2h5IHRoZXJlIGFyZW4ndCBhbnkgcG9seWZpbGxzIGZvciBUeXBlZEFycmF5cyBmb3Igb2xkZXIgSUUnc1xubW9kdWxlLmV4cG9ydHMuc3VwcG9ydGVkID0gKFxuICAgIHR5cGVvZiB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIHdpbmRvdy5hdG9iICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuQmxvYiAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2Ygd2luZG93LkFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCdcbik7XG5cbm1vZHVsZS5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFtb2R1bGUuZXhwb3J0cy5zdXBwb3J0ZWQpIHJldHVybjtcbiAgICB2YXIgQ2FudmFzUHJvdG90eXBlID0gd2luZG93LkhUTUxDYW52YXNFbGVtZW50LnByb3RvdHlwZTtcbiAgICBcbiAgICBpZiAoIUNhbnZhc1Byb3RvdHlwZS50b0Jsb2IgJiYgQ2FudmFzUHJvdG90eXBlLnRvRGF0YVVSTCkge1xuICAgICAgICBDYW52YXNQcm90b3R5cGUudG9CbG9iID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0eXBlLCBxdWFsaXR5KSB7XG4gICAgICAgICAgICBjYWxsYmFjayhtb2R1bGUuZXhwb3J0cyh0aGlzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLyogRmlsZVNhdmVyLmpzXG4gKiBBIHNhdmVBcygpIEZpbGVTYXZlciBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMS4yMDE1MDcxNlxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IFgxMS9NSVRcbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiAqL1xuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSwgaW5kZW50OiA0LCBsYXhicmVhazogdHJ1ZSwgbGF4Y29tbWE6IHRydWUsIHNtYXJ0dGFiczogdHJ1ZSwgcGx1c3BsdXM6IHRydWUgKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9GaWxlU2F2ZXIuanMgKi9cblxudmFyIHNhdmVBcyA9IHNhdmVBcyB8fCAoZnVuY3Rpb24odmlldykge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0Ly8gSUUgPDEwIGlzIGV4cGxpY2l0bHkgdW5zdXBwb3J0ZWRcblx0aWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgL01TSUUgWzEtOV1cXC4vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyXG5cdFx0ICBkb2MgPSB2aWV3LmRvY3VtZW50XG5cdFx0ICAvLyBvbmx5IGdldCBVUkwgd2hlbiBuZWNlc3NhcnkgaW4gY2FzZSBCbG9iLmpzIGhhc24ndCBvdmVycmlkZGVuIGl0IHlldFxuXHRcdCwgZ2V0X1VSTCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHZpZXcuVVJMIHx8IHZpZXcud2Via2l0VVJMIHx8IHZpZXc7XG5cdFx0fVxuXHRcdCwgc2F2ZV9saW5rID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpXG5cdFx0LCBjYW5fdXNlX3NhdmVfbGluayA9IFwiZG93bmxvYWRcIiBpbiBzYXZlX2xpbmtcblx0XHQsIGNsaWNrID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIGV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoXCJjbGlja1wiKTtcblx0XHRcdG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XG5cdFx0fVxuXHRcdCwgd2Via2l0X3JlcV9mcyA9IHZpZXcud2Via2l0UmVxdWVzdEZpbGVTeXN0ZW1cblx0XHQsIHJlcV9mcyA9IHZpZXcucmVxdWVzdEZpbGVTeXN0ZW0gfHwgd2Via2l0X3JlcV9mcyB8fCB2aWV3Lm1velJlcXVlc3RGaWxlU3lzdGVtXG5cdFx0LCB0aHJvd19vdXRzaWRlID0gZnVuY3Rpb24oZXgpIHtcblx0XHRcdCh2aWV3LnNldEltbWVkaWF0ZSB8fCB2aWV3LnNldFRpbWVvdXQpKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aHJvdyBleDtcblx0XHRcdH0sIDApO1xuXHRcdH1cblx0XHQsIGZvcmNlX3NhdmVhYmxlX3R5cGUgPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiXG5cdFx0LCBmc19taW5fc2l6ZSA9IDBcblx0XHQvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3NTI5NyNjNyBhbmRcblx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9GaWxlU2F2ZXIuanMvY29tbWl0LzQ4NTkzMGEjY29tbWl0Y29tbWVudC04NzY4MDQ3XG5cdFx0Ly8gZm9yIHRoZSByZWFzb25pbmcgYmVoaW5kIHRoZSB0aW1lb3V0IGFuZCByZXZvY2F0aW9uIGZsb3dcblx0XHQsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCA9IDUwMCAvLyBpbiBtc1xuXHRcdCwgcmV2b2tlID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0dmFyIHJldm9rZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBmaWxlID09PSBcInN0cmluZ1wiKSB7IC8vIGZpbGUgaXMgYW4gb2JqZWN0IFVSTFxuXHRcdFx0XHRcdGdldF9VUkwoKS5yZXZva2VPYmplY3RVUkwoZmlsZSk7XG5cdFx0XHRcdH0gZWxzZSB7IC8vIGZpbGUgaXMgYSBGaWxlXG5cdFx0XHRcdFx0ZmlsZS5yZW1vdmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdGlmICh2aWV3LmNocm9tZSkge1xuXHRcdFx0XHRyZXZva2VyKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZXRUaW1lb3V0KHJldm9rZXIsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCwgZGlzcGF0Y2ggPSBmdW5jdGlvbihmaWxlc2F2ZXIsIGV2ZW50X3R5cGVzLCBldmVudCkge1xuXHRcdFx0ZXZlbnRfdHlwZXMgPSBbXS5jb25jYXQoZXZlbnRfdHlwZXMpO1xuXHRcdFx0dmFyIGkgPSBldmVudF90eXBlcy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHZhciBsaXN0ZW5lciA9IGZpbGVzYXZlcltcIm9uXCIgKyBldmVudF90eXBlc1tpXV07XG5cdFx0XHRcdGlmICh0eXBlb2YgbGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsKGZpbGVzYXZlciwgZXZlbnQgfHwgZmlsZXNhdmVyKTtcblx0XHRcdFx0XHR9IGNhdGNoIChleCkge1xuXHRcdFx0XHRcdFx0dGhyb3dfb3V0c2lkZShleCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCwgYXV0b19ib20gPSBmdW5jdGlvbihibG9iKSB7XG5cdFx0XHQvLyBwcmVwZW5kIEJPTSBmb3IgVVRGLTggWE1MIGFuZCB0ZXh0LyogdHlwZXMgKGluY2x1ZGluZyBIVE1MKVxuXHRcdFx0aWYgKC9eXFxzKig/OnRleHRcXC9cXFMqfGFwcGxpY2F0aW9uXFwveG1sfFxcUypcXC9cXFMqXFwreG1sKVxccyo7LipjaGFyc2V0XFxzKj1cXHMqdXRmLTgvaS50ZXN0KGJsb2IudHlwZSkpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBCbG9iKFtcIlxcdWZlZmZcIiwgYmxvYl0sIHt0eXBlOiBibG9iLnR5cGV9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBibG9iO1xuXHRcdH1cblx0XHQsIEZpbGVTYXZlciA9IGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdC8vIEZpcnN0IHRyeSBhLmRvd25sb2FkLCB0aGVuIHdlYiBmaWxlc3lzdGVtLCB0aGVuIG9iamVjdCBVUkxzXG5cdFx0XHR2YXJcblx0XHRcdFx0ICBmaWxlc2F2ZXIgPSB0aGlzXG5cdFx0XHRcdCwgdHlwZSA9IGJsb2IudHlwZVxuXHRcdFx0XHQsIGJsb2JfY2hhbmdlZCA9IGZhbHNlXG5cdFx0XHRcdCwgb2JqZWN0X3VybFxuXHRcdFx0XHQsIHRhcmdldF92aWV3XG5cdFx0XHRcdCwgZGlzcGF0Y2hfYWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcIndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgd3JpdGVlbmRcIi5zcGxpdChcIiBcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIG9uIGFueSBmaWxlc3lzIGVycm9ycyByZXZlcnQgdG8gc2F2aW5nIHdpdGggb2JqZWN0IFVSTHNcblx0XHRcdFx0LCBmc19lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdC8vIGRvbid0IGNyZWF0ZSBtb3JlIG9iamVjdCBVUkxzIHRoYW4gbmVlZGVkXG5cdFx0XHRcdFx0aWYgKGJsb2JfY2hhbmdlZCB8fCAhb2JqZWN0X3VybCkge1xuXHRcdFx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh0YXJnZXRfdmlldykge1xuXHRcdFx0XHRcdFx0dGFyZ2V0X3ZpZXcubG9jYXRpb24uaHJlZiA9IG9iamVjdF91cmw7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHZhciBuZXdfdGFiID0gdmlldy5vcGVuKG9iamVjdF91cmwsIFwiX2JsYW5rXCIpO1xuXHRcdFx0XHRcdFx0aWYgKG5ld190YWIgPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBzYWZhcmkgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0XHRcdFx0Ly9BcHBsZSBkbyBub3QgYWxsb3cgd2luZG93Lm9wZW4sIHNlZSBodHRwOi8vYml0Lmx5LzFrWmZmUklcblx0XHRcdFx0XHRcdFx0dmlldy5sb2NhdGlvbi5ocmVmID0gb2JqZWN0X3VybFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQsIGFib3J0YWJsZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcblx0XHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAoZmlsZXNhdmVyLnJlYWR5U3RhdGUgIT09IGZpbGVzYXZlci5ET05FKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XHQsIGNyZWF0ZV9pZl9ub3RfZm91bmQgPSB7Y3JlYXRlOiB0cnVlLCBleGNsdXNpdmU6IGZhbHNlfVxuXHRcdFx0XHQsIHNsaWNlXG5cdFx0XHQ7XG5cdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5JTklUO1xuXHRcdFx0aWYgKCFuYW1lKSB7XG5cdFx0XHRcdG5hbWUgPSBcImRvd25sb2FkXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAoY2FuX3VzZV9zYXZlX2xpbmspIHtcblx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdHNhdmVfbGluay5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0c2F2ZV9saW5rLmRvd25sb2FkID0gbmFtZTtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRjbGljayhzYXZlX2xpbmspO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Ly8gT2JqZWN0IGFuZCB3ZWIgZmlsZXN5c3RlbSBVUkxzIGhhdmUgYSBwcm9ibGVtIHNhdmluZyBpbiBHb29nbGUgQ2hyb21lIHdoZW5cblx0XHRcdC8vIHZpZXdlZCBpbiBhIHRhYiwgc28gSSBmb3JjZSBzYXZlIHdpdGggYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXG5cdFx0XHQvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD05MTE1OFxuXHRcdFx0Ly8gVXBkYXRlOiBHb29nbGUgZXJyYW50bHkgY2xvc2VkIDkxMTU4LCBJIHN1Ym1pdHRlZCBpdCBhZ2Fpbjpcblx0XHRcdC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zODk2NDJcblx0XHRcdGlmICh2aWV3LmNocm9tZSAmJiB0eXBlICYmIHR5cGUgIT09IGZvcmNlX3NhdmVhYmxlX3R5cGUpIHtcblx0XHRcdFx0c2xpY2UgPSBibG9iLnNsaWNlIHx8IGJsb2Iud2Via2l0U2xpY2U7XG5cdFx0XHRcdGJsb2IgPSBzbGljZS5jYWxsKGJsb2IsIDAsIGJsb2Iuc2l6ZSwgZm9yY2Vfc2F2ZWFibGVfdHlwZSk7XG5cdFx0XHRcdGJsb2JfY2hhbmdlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHQvLyBTaW5jZSBJIGNhbid0IGJlIHN1cmUgdGhhdCB0aGUgZ3Vlc3NlZCBtZWRpYSB0eXBlIHdpbGwgdHJpZ2dlciBhIGRvd25sb2FkXG5cdFx0XHQvLyBpbiBXZWJLaXQsIEkgYXBwZW5kIC5kb3dubG9hZCB0byB0aGUgZmlsZW5hbWUuXG5cdFx0XHQvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjU0NDBcblx0XHRcdGlmICh3ZWJraXRfcmVxX2ZzICYmIG5hbWUgIT09IFwiZG93bmxvYWRcIikge1xuXHRcdFx0XHRuYW1lICs9IFwiLmRvd25sb2FkXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAodHlwZSA9PT0gZm9yY2Vfc2F2ZWFibGVfdHlwZSB8fCB3ZWJraXRfcmVxX2ZzKSB7XG5cdFx0XHRcdHRhcmdldF92aWV3ID0gdmlldztcblx0XHRcdH1cblx0XHRcdGlmICghcmVxX2ZzKSB7XG5cdFx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGZzX21pbl9zaXplICs9IGJsb2Iuc2l6ZTtcblx0XHRcdHJlcV9mcyh2aWV3LlRFTVBPUkFSWSwgZnNfbWluX3NpemUsIGFib3J0YWJsZShmdW5jdGlvbihmcykge1xuXHRcdFx0XHRmcy5yb290LmdldERpcmVjdG9yeShcInNhdmVkXCIsIGNyZWF0ZV9pZl9ub3RfZm91bmQsIGFib3J0YWJsZShmdW5jdGlvbihkaXIpIHtcblx0XHRcdFx0XHR2YXIgc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZGlyLmdldEZpbGUobmFtZSwgY3JlYXRlX2lmX25vdF9mb3VuZCwgYWJvcnRhYmxlKGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdFx0XHRcdFx0ZmlsZS5jcmVhdGVXcml0ZXIoYWJvcnRhYmxlKGZ1bmN0aW9uKHdyaXRlcikge1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRhcmdldF92aWV3LmxvY2F0aW9uLmhyZWYgPSBmaWxlLnRvVVJMKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcIndyaXRlZW5kXCIsIGV2ZW50KTtcblx0XHRcdFx0XHRcdFx0XHRcdHJldm9rZShmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgZXJyb3IgPSB3cml0ZXIuZXJyb3I7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoZXJyb3IuY29kZSAhPT0gZXJyb3IuQUJPUlRfRVJSKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcIndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgYWJvcnRcIi5zcGxpdChcIiBcIikuZm9yRWFjaChmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0d3JpdGVyW1wib25cIiArIGV2ZW50XSA9IGZpbGVzYXZlcltcIm9uXCIgKyBldmVudF07XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0d3JpdGVyLndyaXRlKGJsb2IpO1xuXHRcdFx0XHRcdFx0XHRcdGZpbGVzYXZlci5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0d3JpdGVyLmFib3J0KCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuV1JJVElORztcblx0XHRcdFx0XHRcdFx0fSksIGZzX2Vycm9yKTtcblx0XHRcdFx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRkaXIuZ2V0RmlsZShuYW1lLCB7Y3JlYXRlOiBmYWxzZX0sIGFib3J0YWJsZShmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdFx0XHQvLyBkZWxldGUgZmlsZSBpZiBpdCBhbHJlYWR5IGV4aXN0c1xuXHRcdFx0XHRcdFx0ZmlsZS5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdHNhdmUoKTtcblx0XHRcdFx0XHR9KSwgYWJvcnRhYmxlKGZ1bmN0aW9uKGV4KSB7XG5cdFx0XHRcdFx0XHRpZiAoZXguY29kZSA9PT0gZXguTk9UX0ZPVU5EX0VSUikge1xuXHRcdFx0XHRcdFx0XHRzYXZlKCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRmc19lcnJvcigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0fSksIGZzX2Vycm9yKTtcblx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0fVxuXHRcdCwgRlNfcHJvdG8gPSBGaWxlU2F2ZXIucHJvdG90eXBlXG5cdFx0LCBzYXZlQXMgPSBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBGaWxlU2F2ZXIoYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pO1xuXHRcdH1cblx0O1xuXHQvLyBJRSAxMCsgKG5hdGl2ZSBzYXZlQXMpXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmIG5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihibG9iLCBuYW1lIHx8IFwiZG93bmxvYWRcIik7XG5cdFx0fTtcblx0fVxuXG5cdEZTX3Byb3RvLmFib3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZpbGVzYXZlciA9IHRoaXM7XG5cdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRkaXNwYXRjaChmaWxlc2F2ZXIsIFwiYWJvcnRcIik7XG5cdH07XG5cdEZTX3Byb3RvLnJlYWR5U3RhdGUgPSBGU19wcm90by5JTklUID0gMDtcblx0RlNfcHJvdG8uV1JJVElORyA9IDE7XG5cdEZTX3Byb3RvLkRPTkUgPSAyO1xuXG5cdEZTX3Byb3RvLmVycm9yID1cblx0RlNfcHJvdG8ub253cml0ZXN0YXJ0ID1cblx0RlNfcHJvdG8ub25wcm9ncmVzcyA9XG5cdEZTX3Byb3RvLm9ud3JpdGUgPVxuXHRGU19wcm90by5vbmFib3J0ID1cblx0RlNfcHJvdG8ub25lcnJvciA9XG5cdEZTX3Byb3RvLm9ud3JpdGVlbmQgPVxuXHRcdG51bGw7XG5cblx0cmV0dXJuIHNhdmVBcztcbn0oXG5cdCAgIHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGZcblx0fHwgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3dcblx0fHwgdGhpcy5jb250ZW50XG4pKTtcbi8vIGBzZWxmYCBpcyB1bmRlZmluZWQgaW4gRmlyZWZveCBmb3IgQW5kcm9pZCBjb250ZW50IHNjcmlwdCBjb250ZXh0XG4vLyB3aGlsZSBgdGhpc2AgaXMgbnNJQ29udGVudEZyYW1lTWVzc2FnZU1hbmFnZXJcbi8vIHdpdGggYW4gYXR0cmlidXRlIGBjb250ZW50YCB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSB3aW5kb3dcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgbW9kdWxlLmV4cG9ydHMuc2F2ZUFzID0gc2F2ZUFzO1xufSBlbHNlIGlmICgodHlwZW9mIGRlZmluZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkZWZpbmUgIT09IG51bGwpICYmIChkZWZpbmUuYW1kICE9IG51bGwpKSB7XG4gIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNhdmVBcztcbiAgfSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgMDogJ05PTkUnLFxuICAxOiAnT05FJyxcbiAgMjogJ0xJTkVfTE9PUCcsXG4gIDM6ICdMSU5FX1NUUklQJyxcbiAgNDogJ1RSSUFOR0xFUycsXG4gIDU6ICdUUklBTkdMRV9TVFJJUCcsXG4gIDY6ICdUUklBTkdMRV9GQU4nLFxuICAyNTY6ICdERVBUSF9CVUZGRVJfQklUJyxcbiAgNTEyOiAnTkVWRVInLFxuICA1MTM6ICdMRVNTJyxcbiAgNTE0OiAnRVFVQUwnLFxuICA1MTU6ICdMRVFVQUwnLFxuICA1MTY6ICdHUkVBVEVSJyxcbiAgNTE3OiAnTk9URVFVQUwnLFxuICA1MTg6ICdHRVFVQUwnLFxuICA1MTk6ICdBTFdBWVMnLFxuICA3Njg6ICdTUkNfQ09MT1InLFxuICA3Njk6ICdPTkVfTUlOVVNfU1JDX0NPTE9SJyxcbiAgNzcwOiAnU1JDX0FMUEhBJyxcbiAgNzcxOiAnT05FX01JTlVTX1NSQ19BTFBIQScsXG4gIDc3MjogJ0RTVF9BTFBIQScsXG4gIDc3MzogJ09ORV9NSU5VU19EU1RfQUxQSEEnLFxuICA3NzQ6ICdEU1RfQ09MT1InLFxuICA3NzU6ICdPTkVfTUlOVVNfRFNUX0NPTE9SJyxcbiAgNzc2OiAnU1JDX0FMUEhBX1NBVFVSQVRFJyxcbiAgMTAyNDogJ1NURU5DSUxfQlVGRkVSX0JJVCcsXG4gIDEwMjg6ICdGUk9OVCcsXG4gIDEwMjk6ICdCQUNLJyxcbiAgMTAzMjogJ0ZST05UX0FORF9CQUNLJyxcbiAgMTI4MDogJ0lOVkFMSURfRU5VTScsXG4gIDEyODE6ICdJTlZBTElEX1ZBTFVFJyxcbiAgMTI4MjogJ0lOVkFMSURfT1BFUkFUSU9OJyxcbiAgMTI4NTogJ09VVF9PRl9NRU1PUlknLFxuICAxMjg2OiAnSU5WQUxJRF9GUkFNRUJVRkZFUl9PUEVSQVRJT04nLFxuICAyMzA0OiAnQ1cnLFxuICAyMzA1OiAnQ0NXJyxcbiAgMjg0OTogJ0xJTkVfV0lEVEgnLFxuICAyODg0OiAnQ1VMTF9GQUNFJyxcbiAgMjg4NTogJ0NVTExfRkFDRV9NT0RFJyxcbiAgMjg4NjogJ0ZST05UX0ZBQ0UnLFxuICAyOTI4OiAnREVQVEhfUkFOR0UnLFxuICAyOTI5OiAnREVQVEhfVEVTVCcsXG4gIDI5MzA6ICdERVBUSF9XUklURU1BU0snLFxuICAyOTMxOiAnREVQVEhfQ0xFQVJfVkFMVUUnLFxuICAyOTMyOiAnREVQVEhfRlVOQycsXG4gIDI5NjA6ICdTVEVOQ0lMX1RFU1QnLFxuICAyOTYxOiAnU1RFTkNJTF9DTEVBUl9WQUxVRScsXG4gIDI5NjI6ICdTVEVOQ0lMX0ZVTkMnLFxuICAyOTYzOiAnU1RFTkNJTF9WQUxVRV9NQVNLJyxcbiAgMjk2NDogJ1NURU5DSUxfRkFJTCcsXG4gIDI5NjU6ICdTVEVOQ0lMX1BBU1NfREVQVEhfRkFJTCcsXG4gIDI5NjY6ICdTVEVOQ0lMX1BBU1NfREVQVEhfUEFTUycsXG4gIDI5Njc6ICdTVEVOQ0lMX1JFRicsXG4gIDI5Njg6ICdTVEVOQ0lMX1dSSVRFTUFTSycsXG4gIDI5Nzg6ICdWSUVXUE9SVCcsXG4gIDMwMjQ6ICdESVRIRVInLFxuICAzMDQyOiAnQkxFTkQnLFxuICAzMDg4OiAnU0NJU1NPUl9CT1gnLFxuICAzMDg5OiAnU0NJU1NPUl9URVNUJyxcbiAgMzEwNjogJ0NPTE9SX0NMRUFSX1ZBTFVFJyxcbiAgMzEwNzogJ0NPTE9SX1dSSVRFTUFTSycsXG4gIDMzMTc6ICdVTlBBQ0tfQUxJR05NRU5UJyxcbiAgMzMzMzogJ1BBQ0tfQUxJR05NRU5UJyxcbiAgMzM3OTogJ01BWF9URVhUVVJFX1NJWkUnLFxuICAzMzg2OiAnTUFYX1ZJRVdQT1JUX0RJTVMnLFxuICAzNDA4OiAnU1VCUElYRUxfQklUUycsXG4gIDM0MTA6ICdSRURfQklUUycsXG4gIDM0MTE6ICdHUkVFTl9CSVRTJyxcbiAgMzQxMjogJ0JMVUVfQklUUycsXG4gIDM0MTM6ICdBTFBIQV9CSVRTJyxcbiAgMzQxNDogJ0RFUFRIX0JJVFMnLFxuICAzNDE1OiAnU1RFTkNJTF9CSVRTJyxcbiAgMzU1MzogJ1RFWFRVUkVfMkQnLFxuICA0MzUyOiAnRE9OVF9DQVJFJyxcbiAgNDM1MzogJ0ZBU1RFU1QnLFxuICA0MzU0OiAnTklDRVNUJyxcbiAgNTEyMDogJ0JZVEUnLFxuICA1MTIxOiAnVU5TSUdORURfQllURScsXG4gIDUxMjI6ICdTSE9SVCcsXG4gIDUxMjM6ICdVTlNJR05FRF9TSE9SVCcsXG4gIDUxMjQ6ICdJTlQnLFxuICA1MTI1OiAnVU5TSUdORURfSU5UJyxcbiAgNTEyNjogJ0ZMT0FUJyxcbiAgNTM4NjogJ0lOVkVSVCcsXG4gIDU4OTA6ICdURVhUVVJFJyxcbiAgNjQwMTogJ1NURU5DSUxfSU5ERVgnLFxuICA2NDAyOiAnREVQVEhfQ09NUE9ORU5UJyxcbiAgNjQwNjogJ0FMUEhBJyxcbiAgNjQwNzogJ1JHQicsXG4gIDY0MDg6ICdSR0JBJyxcbiAgNjQwOTogJ0xVTUlOQU5DRScsXG4gIDY0MTA6ICdMVU1JTkFOQ0VfQUxQSEEnLFxuICA3NjgwOiAnS0VFUCcsXG4gIDc2ODE6ICdSRVBMQUNFJyxcbiAgNzY4MjogJ0lOQ1InLFxuICA3NjgzOiAnREVDUicsXG4gIDc5MzY6ICdWRU5ET1InLFxuICA3OTM3OiAnUkVOREVSRVInLFxuICA3OTM4OiAnVkVSU0lPTicsXG4gIDk3Mjg6ICdORUFSRVNUJyxcbiAgOTcyOTogJ0xJTkVBUicsXG4gIDk5ODQ6ICdORUFSRVNUX01JUE1BUF9ORUFSRVNUJyxcbiAgOTk4NTogJ0xJTkVBUl9NSVBNQVBfTkVBUkVTVCcsXG4gIDk5ODY6ICdORUFSRVNUX01JUE1BUF9MSU5FQVInLFxuICA5OTg3OiAnTElORUFSX01JUE1BUF9MSU5FQVInLFxuICAxMDI0MDogJ1RFWFRVUkVfTUFHX0ZJTFRFUicsXG4gIDEwMjQxOiAnVEVYVFVSRV9NSU5fRklMVEVSJyxcbiAgMTAyNDI6ICdURVhUVVJFX1dSQVBfUycsXG4gIDEwMjQzOiAnVEVYVFVSRV9XUkFQX1QnLFxuICAxMDQ5NzogJ1JFUEVBVCcsXG4gIDEwNzUyOiAnUE9MWUdPTl9PRkZTRVRfVU5JVFMnLFxuICAxNjM4NDogJ0NPTE9SX0JVRkZFUl9CSVQnLFxuICAzMjc2OTogJ0NPTlNUQU5UX0NPTE9SJyxcbiAgMzI3NzA6ICdPTkVfTUlOVVNfQ09OU1RBTlRfQ09MT1InLFxuICAzMjc3MTogJ0NPTlNUQU5UX0FMUEhBJyxcbiAgMzI3NzI6ICdPTkVfTUlOVVNfQ09OU1RBTlRfQUxQSEEnLFxuICAzMjc3MzogJ0JMRU5EX0NPTE9SJyxcbiAgMzI3NzQ6ICdGVU5DX0FERCcsXG4gIDMyNzc3OiAnQkxFTkRfRVFVQVRJT05fUkdCJyxcbiAgMzI3Nzg6ICdGVU5DX1NVQlRSQUNUJyxcbiAgMzI3Nzk6ICdGVU5DX1JFVkVSU0VfU1VCVFJBQ1QnLFxuICAzMjgxOTogJ1VOU0lHTkVEX1NIT1JUXzRfNF80XzQnLFxuICAzMjgyMDogJ1VOU0lHTkVEX1NIT1JUXzVfNV81XzEnLFxuICAzMjgyMzogJ1BPTFlHT05fT0ZGU0VUX0ZJTEwnLFxuICAzMjgyNDogJ1BPTFlHT05fT0ZGU0VUX0ZBQ1RPUicsXG4gIDMyODU0OiAnUkdCQTQnLFxuICAzMjg1NTogJ1JHQjVfQTEnLFxuICAzMjg3MzogJ1RFWFRVUkVfQklORElOR18yRCcsXG4gIDMyOTI2OiAnU0FNUExFX0FMUEhBX1RPX0NPVkVSQUdFJyxcbiAgMzI5Mjg6ICdTQU1QTEVfQ09WRVJBR0UnLFxuICAzMjkzNjogJ1NBTVBMRV9CVUZGRVJTJyxcbiAgMzI5Mzc6ICdTQU1QTEVTJyxcbiAgMzI5Mzg6ICdTQU1QTEVfQ09WRVJBR0VfVkFMVUUnLFxuICAzMjkzOTogJ1NBTVBMRV9DT1ZFUkFHRV9JTlZFUlQnLFxuICAzMjk2ODogJ0JMRU5EX0RTVF9SR0InLFxuICAzMjk2OTogJ0JMRU5EX1NSQ19SR0InLFxuICAzMjk3MDogJ0JMRU5EX0RTVF9BTFBIQScsXG4gIDMyOTcxOiAnQkxFTkRfU1JDX0FMUEhBJyxcbiAgMzMwNzE6ICdDTEFNUF9UT19FREdFJyxcbiAgMzMxNzA6ICdHRU5FUkFURV9NSVBNQVBfSElOVCcsXG4gIDMzMTg5OiAnREVQVEhfQ09NUE9ORU5UMTYnLFxuICAzMzMwNjogJ0RFUFRIX1NURU5DSUxfQVRUQUNITUVOVCcsXG4gIDMzNjM1OiAnVU5TSUdORURfU0hPUlRfNV82XzUnLFxuICAzMzY0ODogJ01JUlJPUkVEX1JFUEVBVCcsXG4gIDMzOTAxOiAnQUxJQVNFRF9QT0lOVF9TSVpFX1JBTkdFJyxcbiAgMzM5MDI6ICdBTElBU0VEX0xJTkVfV0lEVEhfUkFOR0UnLFxuICAzMzk4NDogJ1RFWFRVUkUwJyxcbiAgMzM5ODU6ICdURVhUVVJFMScsXG4gIDMzOTg2OiAnVEVYVFVSRTInLFxuICAzMzk4NzogJ1RFWFRVUkUzJyxcbiAgMzM5ODg6ICdURVhUVVJFNCcsXG4gIDMzOTg5OiAnVEVYVFVSRTUnLFxuICAzMzk5MDogJ1RFWFRVUkU2JyxcbiAgMzM5OTE6ICdURVhUVVJFNycsXG4gIDMzOTkyOiAnVEVYVFVSRTgnLFxuICAzMzk5MzogJ1RFWFRVUkU5JyxcbiAgMzM5OTQ6ICdURVhUVVJFMTAnLFxuICAzMzk5NTogJ1RFWFRVUkUxMScsXG4gIDMzOTk2OiAnVEVYVFVSRTEyJyxcbiAgMzM5OTc6ICdURVhUVVJFMTMnLFxuICAzMzk5ODogJ1RFWFRVUkUxNCcsXG4gIDMzOTk5OiAnVEVYVFVSRTE1JyxcbiAgMzQwMDA6ICdURVhUVVJFMTYnLFxuICAzNDAwMTogJ1RFWFRVUkUxNycsXG4gIDM0MDAyOiAnVEVYVFVSRTE4JyxcbiAgMzQwMDM6ICdURVhUVVJFMTknLFxuICAzNDAwNDogJ1RFWFRVUkUyMCcsXG4gIDM0MDA1OiAnVEVYVFVSRTIxJyxcbiAgMzQwMDY6ICdURVhUVVJFMjInLFxuICAzNDAwNzogJ1RFWFRVUkUyMycsXG4gIDM0MDA4OiAnVEVYVFVSRTI0JyxcbiAgMzQwMDk6ICdURVhUVVJFMjUnLFxuICAzNDAxMDogJ1RFWFRVUkUyNicsXG4gIDM0MDExOiAnVEVYVFVSRTI3JyxcbiAgMzQwMTI6ICdURVhUVVJFMjgnLFxuICAzNDAxMzogJ1RFWFRVUkUyOScsXG4gIDM0MDE0OiAnVEVYVFVSRTMwJyxcbiAgMzQwMTU6ICdURVhUVVJFMzEnLFxuICAzNDAxNjogJ0FDVElWRV9URVhUVVJFJyxcbiAgMzQwMjQ6ICdNQVhfUkVOREVSQlVGRkVSX1NJWkUnLFxuICAzNDA0MTogJ0RFUFRIX1NURU5DSUwnLFxuICAzNDA1NTogJ0lOQ1JfV1JBUCcsXG4gIDM0MDU2OiAnREVDUl9XUkFQJyxcbiAgMzQwNjc6ICdURVhUVVJFX0NVQkVfTUFQJyxcbiAgMzQwNjg6ICdURVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVAnLFxuICAzNDA2OTogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCcsXG4gIDM0MDcwOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YJyxcbiAgMzQwNzE6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1knLFxuICAzNDA3MjogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWScsXG4gIDM0MDczOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aJyxcbiAgMzQwNzQ6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1onLFxuICAzNDA3NjogJ01BWF9DVUJFX01BUF9URVhUVVJFX1NJWkUnLFxuICAzNDMzODogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfRU5BQkxFRCcsXG4gIDM0MzM5OiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9TSVpFJyxcbiAgMzQzNDA6ICdWRVJURVhfQVRUUklCX0FSUkFZX1NUUklERScsXG4gIDM0MzQxOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9UWVBFJyxcbiAgMzQzNDI6ICdDVVJSRU5UX1ZFUlRFWF9BVFRSSUInLFxuICAzNDM3MzogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfUE9JTlRFUicsXG4gIDM0NDY2OiAnTlVNX0NPTVBSRVNTRURfVEVYVFVSRV9GT1JNQVRTJyxcbiAgMzQ0Njc6ICdDT01QUkVTU0VEX1RFWFRVUkVfRk9STUFUUycsXG4gIDM0NjYwOiAnQlVGRkVSX1NJWkUnLFxuICAzNDY2MTogJ0JVRkZFUl9VU0FHRScsXG4gIDM0ODE2OiAnU1RFTkNJTF9CQUNLX0ZVTkMnLFxuICAzNDgxNzogJ1NURU5DSUxfQkFDS19GQUlMJyxcbiAgMzQ4MTg6ICdTVEVOQ0lMX0JBQ0tfUEFTU19ERVBUSF9GQUlMJyxcbiAgMzQ4MTk6ICdTVEVOQ0lMX0JBQ0tfUEFTU19ERVBUSF9QQVNTJyxcbiAgMzQ4Nzc6ICdCTEVORF9FUVVBVElPTl9BTFBIQScsXG4gIDM0OTIxOiAnTUFYX1ZFUlRFWF9BVFRSSUJTJyxcbiAgMzQ5MjI6ICdWRVJURVhfQVRUUklCX0FSUkFZX05PUk1BTElaRUQnLFxuICAzNDkzMDogJ01BWF9URVhUVVJFX0lNQUdFX1VOSVRTJyxcbiAgMzQ5NjI6ICdBUlJBWV9CVUZGRVInLFxuICAzNDk2MzogJ0VMRU1FTlRfQVJSQVlfQlVGRkVSJyxcbiAgMzQ5NjQ6ICdBUlJBWV9CVUZGRVJfQklORElORycsXG4gIDM0OTY1OiAnRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORycsXG4gIDM0OTc1OiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9CVUZGRVJfQklORElORycsXG4gIDM1MDQwOiAnU1RSRUFNX0RSQVcnLFxuICAzNTA0NDogJ1NUQVRJQ19EUkFXJyxcbiAgMzUwNDg6ICdEWU5BTUlDX0RSQVcnLFxuICAzNTYzMjogJ0ZSQUdNRU5UX1NIQURFUicsXG4gIDM1NjMzOiAnVkVSVEVYX1NIQURFUicsXG4gIDM1NjYwOiAnTUFYX1ZFUlRFWF9URVhUVVJFX0lNQUdFX1VOSVRTJyxcbiAgMzU2NjE6ICdNQVhfQ09NQklORURfVEVYVFVSRV9JTUFHRV9VTklUUycsXG4gIDM1NjYzOiAnU0hBREVSX1RZUEUnLFxuICAzNTY2NDogJ0ZMT0FUX1ZFQzInLFxuICAzNTY2NTogJ0ZMT0FUX1ZFQzMnLFxuICAzNTY2NjogJ0ZMT0FUX1ZFQzQnLFxuICAzNTY2NzogJ0lOVF9WRUMyJyxcbiAgMzU2Njg6ICdJTlRfVkVDMycsXG4gIDM1NjY5OiAnSU5UX1ZFQzQnLFxuICAzNTY3MDogJ0JPT0wnLFxuICAzNTY3MTogJ0JPT0xfVkVDMicsXG4gIDM1NjcyOiAnQk9PTF9WRUMzJyxcbiAgMzU2NzM6ICdCT09MX1ZFQzQnLFxuICAzNTY3NDogJ0ZMT0FUX01BVDInLFxuICAzNTY3NTogJ0ZMT0FUX01BVDMnLFxuICAzNTY3NjogJ0ZMT0FUX01BVDQnLFxuICAzNTY3ODogJ1NBTVBMRVJfMkQnLFxuICAzNTY4MDogJ1NBTVBMRVJfQ1VCRScsXG4gIDM1NzEyOiAnREVMRVRFX1NUQVRVUycsXG4gIDM1NzEzOiAnQ09NUElMRV9TVEFUVVMnLFxuICAzNTcxNDogJ0xJTktfU1RBVFVTJyxcbiAgMzU3MTU6ICdWQUxJREFURV9TVEFUVVMnLFxuICAzNTcxNjogJ0lORk9fTE9HX0xFTkdUSCcsXG4gIDM1NzE3OiAnQVRUQUNIRURfU0hBREVSUycsXG4gIDM1NzE4OiAnQUNUSVZFX1VOSUZPUk1TJyxcbiAgMzU3MTk6ICdBQ1RJVkVfVU5JRk9STV9NQVhfTEVOR1RIJyxcbiAgMzU3MjA6ICdTSEFERVJfU09VUkNFX0xFTkdUSCcsXG4gIDM1NzIxOiAnQUNUSVZFX0FUVFJJQlVURVMnLFxuICAzNTcyMjogJ0FDVElWRV9BVFRSSUJVVEVfTUFYX0xFTkdUSCcsXG4gIDM1NzI0OiAnU0hBRElOR19MQU5HVUFHRV9WRVJTSU9OJyxcbiAgMzU3MjU6ICdDVVJSRU5UX1BST0dSQU0nLFxuICAzNjAwMzogJ1NURU5DSUxfQkFDS19SRUYnLFxuICAzNjAwNDogJ1NURU5DSUxfQkFDS19WQUxVRV9NQVNLJyxcbiAgMzYwMDU6ICdTVEVOQ0lMX0JBQ0tfV1JJVEVNQVNLJyxcbiAgMzYwMDY6ICdGUkFNRUJVRkZFUl9CSU5ESU5HJyxcbiAgMzYwMDc6ICdSRU5ERVJCVUZGRVJfQklORElORycsXG4gIDM2MDQ4OiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfVFlQRScsXG4gIDM2MDQ5OiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfTkFNRScsXG4gIDM2MDUwOiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0xFVkVMJyxcbiAgMzYwNTE6ICdGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfQ1VCRV9NQVBfRkFDRScsXG4gIDM2MDUzOiAnRlJBTUVCVUZGRVJfQ09NUExFVEUnLFxuICAzNjA1NDogJ0ZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVCcsXG4gIDM2MDU1OiAnRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlQnLFxuICAzNjA1NzogJ0ZSQU1FQlVGRkVSX0lOQ09NUExFVEVfRElNRU5TSU9OUycsXG4gIDM2MDYxOiAnRlJBTUVCVUZGRVJfVU5TVVBQT1JURUQnLFxuICAzNjA2NDogJ0NPTE9SX0FUVEFDSE1FTlQwJyxcbiAgMzYwOTY6ICdERVBUSF9BVFRBQ0hNRU5UJyxcbiAgMzYxMjg6ICdTVEVOQ0lMX0FUVEFDSE1FTlQnLFxuICAzNjE2MDogJ0ZSQU1FQlVGRkVSJyxcbiAgMzYxNjE6ICdSRU5ERVJCVUZGRVInLFxuICAzNjE2MjogJ1JFTkRFUkJVRkZFUl9XSURUSCcsXG4gIDM2MTYzOiAnUkVOREVSQlVGRkVSX0hFSUdIVCcsXG4gIDM2MTY0OiAnUkVOREVSQlVGRkVSX0lOVEVSTkFMX0ZPUk1BVCcsXG4gIDM2MTY4OiAnU1RFTkNJTF9JTkRFWDgnLFxuICAzNjE3NjogJ1JFTkRFUkJVRkZFUl9SRURfU0laRScsXG4gIDM2MTc3OiAnUkVOREVSQlVGRkVSX0dSRUVOX1NJWkUnLFxuICAzNjE3ODogJ1JFTkRFUkJVRkZFUl9CTFVFX1NJWkUnLFxuICAzNjE3OTogJ1JFTkRFUkJVRkZFUl9BTFBIQV9TSVpFJyxcbiAgMzYxODA6ICdSRU5ERVJCVUZGRVJfREVQVEhfU0laRScsXG4gIDM2MTgxOiAnUkVOREVSQlVGRkVSX1NURU5DSUxfU0laRScsXG4gIDM2MTk0OiAnUkdCNTY1JyxcbiAgMzYzMzY6ICdMT1dfRkxPQVQnLFxuICAzNjMzNzogJ01FRElVTV9GTE9BVCcsXG4gIDM2MzM4OiAnSElHSF9GTE9BVCcsXG4gIDM2MzM5OiAnTE9XX0lOVCcsXG4gIDM2MzQwOiAnTUVESVVNX0lOVCcsXG4gIDM2MzQxOiAnSElHSF9JTlQnLFxuICAzNjM0NjogJ1NIQURFUl9DT01QSUxFUicsXG4gIDM2MzQ3OiAnTUFYX1ZFUlRFWF9VTklGT1JNX1ZFQ1RPUlMnLFxuICAzNjM0ODogJ01BWF9WQVJZSU5HX1ZFQ1RPUlMnLFxuICAzNjM0OTogJ01BWF9GUkFHTUVOVF9VTklGT1JNX1ZFQ1RPUlMnLFxuICAzNzQ0MDogJ1VOUEFDS19GTElQX1lfV0VCR0wnLFxuICAzNzQ0MTogJ1VOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCcsXG4gIDM3NDQyOiAnQ09OVEVYVF9MT1NUX1dFQkdMJyxcbiAgMzc0NDM6ICdVTlBBQ0tfQ09MT1JTUEFDRV9DT05WRVJTSU9OX1dFQkdMJyxcbiAgMzc0NDQ6ICdCUk9XU0VSX0RFRkFVTFRfV0VCR0wnXG59XG4iLCJ2YXIgZ2wxMCA9IHJlcXVpcmUoJy4vMS4wL251bWJlcnMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxvb2t1cENvbnN0YW50IChudW1iZXIpIHtcbiAgcmV0dXJuIGdsMTBbbnVtYmVyXVxufVxuIiwiXG52YXIgc3ByaW50ZiA9IHJlcXVpcmUoJ3NwcmludGYtanMnKS5zcHJpbnRmO1xudmFyIGdsQ29uc3RhbnRzID0gcmVxdWlyZSgnZ2wtY29uc3RhbnRzL2xvb2t1cCcpO1xudmFyIHNoYWRlck5hbWUgPSByZXF1aXJlKCdnbHNsLXNoYWRlci1uYW1lJyk7XG52YXIgYWRkTGluZU51bWJlcnMgPSByZXF1aXJlKCdhZGQtbGluZS1udW1iZXJzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZm9ybWF0Q29tcGlsZXJFcnJvcjtcblxuZnVuY3Rpb24gZm9ybWF0Q29tcGlsZXJFcnJvcihlcnJMb2csIHNyYywgdHlwZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5hbWUgPSBzaGFkZXJOYW1lKHNyYykgfHwgJ29mIHVua25vd24gbmFtZSAoc2VlIG5wbSBnbHNsLXNoYWRlci1uYW1lKSc7XG5cbiAgICB2YXIgdHlwZU5hbWUgPSAndW5rbm93biB0eXBlJztcbiAgICBpZiAodHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR5cGVOYW1lID0gdHlwZSA9PT0gZ2xDb25zdGFudHMuRlJBR01FTlRfU0hBREVSID8gJ2ZyYWdtZW50JyA6ICd2ZXJ0ZXgnXG4gICAgfVxuXG4gICAgdmFyIGxvbmdGb3JtID0gc3ByaW50ZignRXJyb3IgY29tcGlsaW5nICVzIHNoYWRlciAlczpcXG4nLCB0eXBlTmFtZSwgbmFtZSk7XG4gICAgdmFyIHNob3J0Rm9ybSA9IHNwcmludGYoXCIlcyVzXCIsIGxvbmdGb3JtLCBlcnJMb2cpO1xuXG4gICAgdmFyIGVycm9yU3RyaW5ncyA9IGVyckxvZy5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIGVycm9ycyA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlcnJvclN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVycm9yU3RyaW5nID0gZXJyb3JTdHJpbmdzW2ldO1xuICAgICAgICBpZiAoZXJyb3JTdHJpbmcgPT09ICcnKSBjb250aW51ZTtcbiAgICAgICAgdmFyIGxpbmVObyA9IHBhcnNlSW50KGVycm9yU3RyaW5nLnNwbGl0KCc6JylbMl0pO1xuICAgICAgICBpZiAoaXNOYU4obGluZU5vKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNwcmludGYoJ0NvdWxkIG5vdCBwYXJzZSBlcnJvcjogJXMnLCBlcnJvclN0cmluZykpO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yc1tsaW5lTm9dID0gZXJyb3JTdHJpbmc7XG4gICAgfVxuXG4gICAgdmFyIGxpbmVzID0gYWRkTGluZU51bWJlcnMoc3JjKS5zcGxpdCgnXFxuJyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghZXJyb3JzW2krM10gJiYgIWVycm9yc1tpKzJdICYmICFlcnJvcnNbaSsxXSkgY29udGludWU7XG4gICAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG4gICAgICAgIGxvbmdGb3JtICs9IGxpbmUgKyAnXFxuJztcbiAgICAgICAgaWYgKGVycm9yc1tpKzFdKSB7XG4gICAgICAgICAgICB2YXIgZSA9IGVycm9yc1tpKzFdO1xuICAgICAgICAgICAgZSA9IGUuc3Vic3RyKGUuc3BsaXQoJzonLCAzKS5qb2luKCc6JykubGVuZ3RoICsgMSkudHJpbSgpO1xuICAgICAgICAgICAgbG9uZ0Zvcm0gKz0gc3ByaW50ZignXl5eICVzXFxuXFxuJywgZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb25nOiBsb25nRm9ybS50cmltKCksXG4gICAgICAgIHNob3J0OiBzaG9ydEZvcm0udHJpbSgpXG4gICAgfTtcbn1cblxuIiwidmFyIHRva2VuaXplID0gcmVxdWlyZSgnZ2xzbC10b2tlbml6ZXInKVxudmFyIGF0b2IgICAgID0gcmVxdWlyZSgnYXRvYi1saXRlJylcblxubW9kdWxlLmV4cG9ydHMgPSBnZXROYW1lXG5cbmZ1bmN0aW9uIGdldE5hbWUoc3JjKSB7XG4gIHZhciB0b2tlbnMgPSBBcnJheS5pc0FycmF5KHNyYylcbiAgICA/IHNyY1xuICAgIDogdG9rZW5pemUoc3JjKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG4gICAgaWYgKHRva2VuLnR5cGUgIT09ICdwcmVwcm9jZXNzb3InKSBjb250aW51ZVxuICAgIHZhciBtYXRjaCA9IHRva2VuLmRhdGEubWF0Y2goL1xcI2RlZmluZVxccytTSEFERVJfTkFNRShfQjY0KT9cXHMrKC4rKSQvKVxuICAgIGlmICghbWF0Y2gpIGNvbnRpbnVlXG4gICAgaWYgKCFtYXRjaFsyXSkgY29udGludWVcblxuICAgIHZhciBiNjQgID0gbWF0Y2hbMV1cbiAgICB2YXIgbmFtZSA9IG1hdGNoWzJdXG5cbiAgICByZXR1cm4gKGI2NCA/IGF0b2IobmFtZSkgOiBuYW1lKS50cmltKClcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB0b2tlbml6ZVxuXG52YXIgbGl0ZXJhbHMxMDAgPSByZXF1aXJlKCcuL2xpYi9saXRlcmFscycpXG4gICwgb3BlcmF0b3JzID0gcmVxdWlyZSgnLi9saWIvb3BlcmF0b3JzJylcbiAgLCBidWlsdGluczEwMCA9IHJlcXVpcmUoJy4vbGliL2J1aWx0aW5zJylcbiAgLCBsaXRlcmFsczMwMGVzID0gcmVxdWlyZSgnLi9saWIvbGl0ZXJhbHMtMzAwZXMnKVxuICAsIGJ1aWx0aW5zMzAwZXMgPSByZXF1aXJlKCcuL2xpYi9idWlsdGlucy0zMDBlcycpXG5cbnZhciBOT1JNQUwgPSA5OTkgICAgICAgICAgLy8gPC0tIG5ldmVyIGVtaXR0ZWRcbiAgLCBUT0tFTiA9IDk5OTkgICAgICAgICAgLy8gPC0tIG5ldmVyIGVtaXR0ZWRcbiAgLCBCTE9DS19DT01NRU5UID0gMFxuICAsIExJTkVfQ09NTUVOVCA9IDFcbiAgLCBQUkVQUk9DRVNTT1IgPSAyXG4gICwgT1BFUkFUT1IgPSAzXG4gICwgSU5URUdFUiA9IDRcbiAgLCBGTE9BVCA9IDVcbiAgLCBJREVOVCA9IDZcbiAgLCBCVUlMVElOID0gN1xuICAsIEtFWVdPUkQgPSA4XG4gICwgV0hJVEVTUEFDRSA9IDlcbiAgLCBFT0YgPSAxMFxuICAsIEhFWCA9IDExXG5cbnZhciBtYXAgPSBbXG4gICAgJ2Jsb2NrLWNvbW1lbnQnXG4gICwgJ2xpbmUtY29tbWVudCdcbiAgLCAncHJlcHJvY2Vzc29yJ1xuICAsICdvcGVyYXRvcidcbiAgLCAnaW50ZWdlcidcbiAgLCAnZmxvYXQnXG4gICwgJ2lkZW50J1xuICAsICdidWlsdGluJ1xuICAsICdrZXl3b3JkJ1xuICAsICd3aGl0ZXNwYWNlJ1xuICAsICdlb2YnXG4gICwgJ2ludGVnZXInXG5dXG5cbmZ1bmN0aW9uIHRva2VuaXplKG9wdCkge1xuICB2YXIgaSA9IDBcbiAgICAsIHRvdGFsID0gMFxuICAgICwgbW9kZSA9IE5PUk1BTFxuICAgICwgY1xuICAgICwgbGFzdFxuICAgICwgY29udGVudCA9IFtdXG4gICAgLCB0b2tlbnMgPSBbXVxuICAgICwgdG9rZW5faWR4ID0gMFxuICAgICwgdG9rZW5fb2ZmcyA9IDBcbiAgICAsIGxpbmUgPSAxXG4gICAgLCBjb2wgPSAwXG4gICAgLCBzdGFydCA9IDBcbiAgICAsIGlzbnVtID0gZmFsc2VcbiAgICAsIGlzb3BlcmF0b3IgPSBmYWxzZVxuICAgICwgaW5wdXQgPSAnJ1xuICAgICwgbGVuXG5cbiAgb3B0ID0gb3B0IHx8IHt9XG4gIHZhciBhbGxCdWlsdGlucyA9IGJ1aWx0aW5zMTAwXG4gIHZhciBhbGxMaXRlcmFscyA9IGxpdGVyYWxzMTAwXG4gIGlmIChvcHQudmVyc2lvbiA9PT0gJzMwMCBlcycpIHtcbiAgICBhbGxCdWlsdGlucyA9IGJ1aWx0aW5zMzAwZXNcbiAgICBhbGxMaXRlcmFscyA9IGxpdGVyYWxzMzAwZXNcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgdG9rZW5zID0gW11cbiAgICBpZiAoZGF0YSAhPT0gbnVsbCkgcmV0dXJuIHdyaXRlKGRhdGEpXG4gICAgcmV0dXJuIGVuZCgpXG4gIH1cblxuICBmdW5jdGlvbiB0b2tlbihkYXRhKSB7XG4gICAgaWYgKGRhdGEubGVuZ3RoKSB7XG4gICAgICB0b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6IG1hcFttb2RlXVxuICAgICAgLCBkYXRhOiBkYXRhXG4gICAgICAsIHBvc2l0aW9uOiBzdGFydFxuICAgICAgLCBsaW5lOiBsaW5lXG4gICAgICAsIGNvbHVtbjogY29sXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlKGNodW5rKSB7XG4gICAgaSA9IDBcbiAgICBpbnB1dCArPSBjaHVua1xuICAgIGxlbiA9IGlucHV0Lmxlbmd0aFxuXG4gICAgdmFyIGxhc3RcblxuICAgIHdoaWxlKGMgPSBpbnB1dFtpXSwgaSA8IGxlbikge1xuICAgICAgbGFzdCA9IGlcblxuICAgICAgc3dpdGNoKG1vZGUpIHtcbiAgICAgICAgY2FzZSBCTE9DS19DT01NRU5UOiBpID0gYmxvY2tfY29tbWVudCgpOyBicmVha1xuICAgICAgICBjYXNlIExJTkVfQ09NTUVOVDogaSA9IGxpbmVfY29tbWVudCgpOyBicmVha1xuICAgICAgICBjYXNlIFBSRVBST0NFU1NPUjogaSA9IHByZXByb2Nlc3NvcigpOyBicmVha1xuICAgICAgICBjYXNlIE9QRVJBVE9SOiBpID0gb3BlcmF0b3IoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBJTlRFR0VSOiBpID0gaW50ZWdlcigpOyBicmVha1xuICAgICAgICBjYXNlIEhFWDogaSA9IGhleCgpOyBicmVha1xuICAgICAgICBjYXNlIEZMT0FUOiBpID0gZGVjaW1hbCgpOyBicmVha1xuICAgICAgICBjYXNlIFRPS0VOOiBpID0gcmVhZHRva2VuKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgV0hJVEVTUEFDRTogaSA9IHdoaXRlc3BhY2UoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBOT1JNQUw6IGkgPSBub3JtYWwoKTsgYnJlYWtcbiAgICAgIH1cblxuICAgICAgaWYobGFzdCAhPT0gaSkge1xuICAgICAgICBzd2l0Y2goaW5wdXRbbGFzdF0pIHtcbiAgICAgICAgICBjYXNlICdcXG4nOiBjb2wgPSAwOyArK2xpbmU7IGJyZWFrXG4gICAgICAgICAgZGVmYXVsdDogKytjb2w7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b3RhbCArPSBpXG4gICAgaW5wdXQgPSBpbnB1dC5zbGljZShpKVxuICAgIHJldHVybiB0b2tlbnNcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZChjaHVuaykge1xuICAgIGlmKGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgIH1cblxuICAgIG1vZGUgPSBFT0ZcbiAgICB0b2tlbignKGVvZiknKVxuICAgIHJldHVybiB0b2tlbnNcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbCgpIHtcbiAgICBjb250ZW50ID0gY29udGVudC5sZW5ndGggPyBbXSA6IGNvbnRlbnRcblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnKicpIHtcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpIC0gMVxuICAgICAgbW9kZSA9IEJMT0NLX0NPTU1FTlRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJy8nKSB7XG4gICAgICBzdGFydCA9IHRvdGFsICsgaSAtIDFcbiAgICAgIG1vZGUgPSBMSU5FX0NPTU1FTlRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihjID09PSAnIycpIHtcbiAgICAgIG1vZGUgPSBQUkVQUk9DRVNTT1JcbiAgICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKC9cXHMvLnRlc3QoYykpIHtcbiAgICAgIG1vZGUgPSBXSElURVNQQUNFXG4gICAgICBzdGFydCA9IHRvdGFsICsgaVxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpc251bSA9IC9cXGQvLnRlc3QoYylcbiAgICBpc29wZXJhdG9yID0gL1teXFx3X10vLnRlc3QoYylcblxuICAgIHN0YXJ0ID0gdG90YWwgKyBpXG4gICAgbW9kZSA9IGlzbnVtID8gSU5URUdFUiA6IGlzb3BlcmF0b3IgPyBPUEVSQVRPUiA6IFRPS0VOXG4gICAgcmV0dXJuIGlcbiAgfVxuXG4gIGZ1bmN0aW9uIHdoaXRlc3BhY2UoKSB7XG4gICAgaWYoL1teXFxzXS9nLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gcHJlcHJvY2Vzc29yKCkge1xuICAgIGlmKGMgPT09ICdcXG4nICYmIGxhc3QgIT09ICdcXFxcJykge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBsaW5lX2NvbW1lbnQoKSB7XG4gICAgcmV0dXJuIHByZXByb2Nlc3NvcigpXG4gIH1cblxuICBmdW5jdGlvbiBibG9ja19jb21tZW50KCkge1xuICAgIGlmKGMgPT09ICcvJyAmJiBsYXN0ID09PSAnKicpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBvcGVyYXRvcigpIHtcbiAgICBpZihsYXN0ID09PSAnLicgJiYgL1xcZC8udGVzdChjKSkge1xuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnKicpIHtcbiAgICAgIG1vZGUgPSBCTE9DS19DT01NRU5UXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGxhc3QgPT09ICcvJyAmJiBjID09PSAnLycpIHtcbiAgICAgIG1vZGUgPSBMSU5FX0NPTU1FTlRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJy4nICYmIGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuXG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJzsnIHx8IGMgPT09ICcpJyB8fCBjID09PSAnKCcpIHtcbiAgICAgIGlmKGNvbnRlbnQubGVuZ3RoKSB3aGlsZShkZXRlcm1pbmVfb3BlcmF0b3IoY29udGVudCkpO1xuICAgICAgdG9rZW4oYylcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIHZhciBpc19jb21wb3NpdGVfb3BlcmF0b3IgPSBjb250ZW50Lmxlbmd0aCA9PT0gMiAmJiBjICE9PSAnPSdcbiAgICBpZigvW1xcd19cXGRcXHNdLy50ZXN0KGMpIHx8IGlzX2NvbXBvc2l0ZV9vcGVyYXRvcikge1xuICAgICAgd2hpbGUoZGV0ZXJtaW5lX29wZXJhdG9yKGNvbnRlbnQpKTtcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGRldGVybWluZV9vcGVyYXRvcihidWYpIHtcbiAgICB2YXIgaiA9IDBcbiAgICAgICwgaWR4XG4gICAgICAsIHJlc1xuXG4gICAgZG8ge1xuICAgICAgaWR4ID0gb3BlcmF0b3JzLmluZGV4T2YoYnVmLnNsaWNlKDAsIGJ1Zi5sZW5ndGggKyBqKS5qb2luKCcnKSlcbiAgICAgIHJlcyA9IG9wZXJhdG9yc1tpZHhdXG5cbiAgICAgIGlmKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgaWYoai0tICsgYnVmLmxlbmd0aCA+IDApIGNvbnRpbnVlXG4gICAgICAgIHJlcyA9IGJ1Zi5zbGljZSgwLCAxKS5qb2luKCcnKVxuICAgICAgfVxuXG4gICAgICB0b2tlbihyZXMpXG5cbiAgICAgIHN0YXJ0ICs9IHJlcy5sZW5ndGhcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKHJlcy5sZW5ndGgpXG4gICAgICByZXR1cm4gY29udGVudC5sZW5ndGhcbiAgICB9IHdoaWxlKDEpXG4gIH1cblxuICBmdW5jdGlvbiBoZXgoKSB7XG4gICAgaWYoL1teYS1mQS1GMC05XS8udGVzdChjKSkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICAgIG1vZGUgPSBOT1JNQUxcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIGludGVnZXIoKSB7XG4gICAgaWYoYyA9PT0gJy4nKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bZUVdLy50ZXN0KGMpKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKGMgPT09ICd4JyAmJiBjb250ZW50Lmxlbmd0aCA9PT0gMSAmJiBjb250ZW50WzBdID09PSAnMCcpIHtcbiAgICAgIG1vZGUgPSBIRVhcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bXlxcZF0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBkZWNpbWFsKCkge1xuICAgIGlmKGMgPT09ICdmJykge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBsYXN0ID0gY1xuICAgICAgaSArPSAxXG4gICAgfVxuXG4gICAgaWYoL1tlRV0vLnRlc3QoYykpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmIChjID09PSAnLScgJiYgL1tlRV0vLnRlc3QobGFzdCkpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIHJldHVybiBpICsgMVxuICAgIH1cblxuICAgIGlmKC9bXlxcZF0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiByZWFkdG9rZW4oKSB7XG4gICAgaWYoL1teXFxkXFx3X10vLnRlc3QoYykpIHtcbiAgICAgIHZhciBjb250ZW50c3RyID0gY29udGVudC5qb2luKCcnKVxuICAgICAgaWYoYWxsTGl0ZXJhbHMuaW5kZXhPZihjb250ZW50c3RyKSA+IC0xKSB7XG4gICAgICAgIG1vZGUgPSBLRVlXT1JEXG4gICAgICB9IGVsc2UgaWYoYWxsQnVpbHRpbnMuaW5kZXhPZihjb250ZW50c3RyKSA+IC0xKSB7XG4gICAgICAgIG1vZGUgPSBCVUlMVElOXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb2RlID0gSURFTlRcbiAgICAgIH1cbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG59XG4iLCIvLyAzMDBlcyBidWlsdGlucy9yZXNlcnZlZCB3b3JkcyB0aGF0IHdlcmUgcHJldmlvdXNseSB2YWxpZCBpbiB2MTAwXG52YXIgdjEwMCA9IHJlcXVpcmUoJy4vYnVpbHRpbnMnKVxuXG4vLyBUaGUgdGV4dHVyZTJEfEN1YmUgZnVuY3Rpb25zIGhhdmUgYmVlbiByZW1vdmVkXG4vLyBBbmQgdGhlIGdsXyBmZWF0dXJlcyBhcmUgdXBkYXRlZFxudjEwMCA9IHYxMDAuc2xpY2UoKS5maWx0ZXIoZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEvXihnbFxcX3x0ZXh0dXJlKS8udGVzdChiKVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSB2MTAwLmNvbmNhdChbXG4gIC8vIHRoZSB1cGRhdGVkIGdsXyBjb25zdGFudHNcbiAgICAnZ2xfVmVydGV4SUQnXG4gICwgJ2dsX0luc3RhbmNlSUQnXG4gICwgJ2dsX1Bvc2l0aW9uJ1xuICAsICdnbF9Qb2ludFNpemUnXG4gICwgJ2dsX0ZyYWdDb29yZCdcbiAgLCAnZ2xfRnJvbnRGYWNpbmcnXG4gICwgJ2dsX0ZyYWdEZXB0aCdcbiAgLCAnZ2xfUG9pbnRDb29yZCdcbiAgLCAnZ2xfTWF4VmVydGV4QXR0cmlicydcbiAgLCAnZ2xfTWF4VmVydGV4VW5pZm9ybVZlY3RvcnMnXG4gICwgJ2dsX01heFZlcnRleE91dHB1dFZlY3RvcnMnXG4gICwgJ2dsX01heEZyYWdtZW50SW5wdXRWZWN0b3JzJ1xuICAsICdnbF9NYXhWZXJ0ZXhUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4Q29tYmluZWRUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4VGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heEZyYWdtZW50VW5pZm9ybVZlY3RvcnMnXG4gICwgJ2dsX01heERyYXdCdWZmZXJzJ1xuICAsICdnbF9NaW5Qcm9ncmFtVGV4ZWxPZmZzZXQnXG4gICwgJ2dsX01heFByb2dyYW1UZXhlbE9mZnNldCdcbiAgLCAnZ2xfRGVwdGhSYW5nZVBhcmFtZXRlcnMnXG4gICwgJ2dsX0RlcHRoUmFuZ2UnXG5cbiAgLy8gb3RoZXIgYnVpbHRpbnNcbiAgLCAndHJ1bmMnXG4gICwgJ3JvdW5kJ1xuICAsICdyb3VuZEV2ZW4nXG4gICwgJ2lzbmFuJ1xuICAsICdpc2luZidcbiAgLCAnZmxvYXRCaXRzVG9JbnQnXG4gICwgJ2Zsb2F0Qml0c1RvVWludCdcbiAgLCAnaW50Qml0c1RvRmxvYXQnXG4gICwgJ3VpbnRCaXRzVG9GbG9hdCdcbiAgLCAncGFja1Nub3JtMngxNidcbiAgLCAndW5wYWNrU25vcm0yeDE2J1xuICAsICdwYWNrVW5vcm0yeDE2J1xuICAsICd1bnBhY2tVbm9ybTJ4MTYnXG4gICwgJ3BhY2tIYWxmMngxNidcbiAgLCAndW5wYWNrSGFsZjJ4MTYnXG4gICwgJ291dGVyUHJvZHVjdCdcbiAgLCAndHJhbnNwb3NlJ1xuICAsICdkZXRlcm1pbmFudCdcbiAgLCAnaW52ZXJzZSdcbiAgLCAndGV4dHVyZSdcbiAgLCAndGV4dHVyZVNpemUnXG4gICwgJ3RleHR1cmVQcm9qJ1xuICAsICd0ZXh0dXJlTG9kJ1xuICAsICd0ZXh0dXJlT2Zmc2V0J1xuICAsICd0ZXhlbEZldGNoJ1xuICAsICd0ZXhlbEZldGNoT2Zmc2V0J1xuICAsICd0ZXh0dXJlUHJvak9mZnNldCdcbiAgLCAndGV4dHVyZUxvZE9mZnNldCdcbiAgLCAndGV4dHVyZVByb2pMb2QnXG4gICwgJ3RleHR1cmVQcm9qTG9kT2Zmc2V0J1xuICAsICd0ZXh0dXJlR3JhZCdcbiAgLCAndGV4dHVyZUdyYWRPZmZzZXQnXG4gICwgJ3RleHR1cmVQcm9qR3JhZCdcbiAgLCAndGV4dHVyZVByb2pHcmFkT2Zmc2V0J1xuXSlcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAvLyBLZWVwIHRoaXMgbGlzdCBzb3J0ZWRcbiAgJ2FicydcbiAgLCAnYWNvcydcbiAgLCAnYWxsJ1xuICAsICdhbnknXG4gICwgJ2FzaW4nXG4gICwgJ2F0YW4nXG4gICwgJ2NlaWwnXG4gICwgJ2NsYW1wJ1xuICAsICdjb3MnXG4gICwgJ2Nyb3NzJ1xuICAsICdkRmR4J1xuICAsICdkRmR5J1xuICAsICdkZWdyZWVzJ1xuICAsICdkaXN0YW5jZSdcbiAgLCAnZG90J1xuICAsICdlcXVhbCdcbiAgLCAnZXhwJ1xuICAsICdleHAyJ1xuICAsICdmYWNlZm9yd2FyZCdcbiAgLCAnZmxvb3InXG4gICwgJ2ZyYWN0J1xuICAsICdnbF9CYWNrQ29sb3InXG4gICwgJ2dsX0JhY2tMaWdodE1vZGVsUHJvZHVjdCdcbiAgLCAnZ2xfQmFja0xpZ2h0UHJvZHVjdCdcbiAgLCAnZ2xfQmFja01hdGVyaWFsJ1xuICAsICdnbF9CYWNrU2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX0NsaXBQbGFuZSdcbiAgLCAnZ2xfQ2xpcFZlcnRleCdcbiAgLCAnZ2xfQ29sb3InXG4gICwgJ2dsX0RlcHRoUmFuZ2UnXG4gICwgJ2dsX0RlcHRoUmFuZ2VQYXJhbWV0ZXJzJ1xuICAsICdnbF9FeWVQbGFuZVEnXG4gICwgJ2dsX0V5ZVBsYW5lUidcbiAgLCAnZ2xfRXllUGxhbmVTJ1xuICAsICdnbF9FeWVQbGFuZVQnXG4gICwgJ2dsX0ZvZydcbiAgLCAnZ2xfRm9nQ29vcmQnXG4gICwgJ2dsX0ZvZ0ZyYWdDb29yZCdcbiAgLCAnZ2xfRm9nUGFyYW1ldGVycydcbiAgLCAnZ2xfRnJhZ0NvbG9yJ1xuICAsICdnbF9GcmFnQ29vcmQnXG4gICwgJ2dsX0ZyYWdEYXRhJ1xuICAsICdnbF9GcmFnRGVwdGgnXG4gICwgJ2dsX0ZyYWdEZXB0aEVYVCdcbiAgLCAnZ2xfRnJvbnRDb2xvcidcbiAgLCAnZ2xfRnJvbnRGYWNpbmcnXG4gICwgJ2dsX0Zyb250TGlnaHRNb2RlbFByb2R1Y3QnXG4gICwgJ2dsX0Zyb250TGlnaHRQcm9kdWN0J1xuICAsICdnbF9Gcm9udE1hdGVyaWFsJ1xuICAsICdnbF9Gcm9udFNlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9MaWdodE1vZGVsJ1xuICAsICdnbF9MaWdodE1vZGVsUGFyYW1ldGVycydcbiAgLCAnZ2xfTGlnaHRNb2RlbFByb2R1Y3RzJ1xuICAsICdnbF9MaWdodFByb2R1Y3RzJ1xuICAsICdnbF9MaWdodFNvdXJjZSdcbiAgLCAnZ2xfTGlnaHRTb3VyY2VQYXJhbWV0ZXJzJ1xuICAsICdnbF9NYXRlcmlhbFBhcmFtZXRlcnMnXG4gICwgJ2dsX01heENsaXBQbGFuZXMnXG4gICwgJ2dsX01heENvbWJpbmVkVGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heERyYXdCdWZmZXJzJ1xuICAsICdnbF9NYXhGcmFnbWVudFVuaWZvcm1Db21wb25lbnRzJ1xuICAsICdnbF9NYXhMaWdodHMnXG4gICwgJ2dsX01heFRleHR1cmVDb29yZHMnXG4gICwgJ2dsX01heFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhUZXh0dXJlVW5pdHMnXG4gICwgJ2dsX01heFZhcnlpbmdGbG9hdHMnXG4gICwgJ2dsX01heFZlcnRleEF0dHJpYnMnXG4gICwgJ2dsX01heFZlcnRleFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhWZXJ0ZXhVbmlmb3JtQ29tcG9uZW50cydcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4J1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdNYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDAnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQxJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMidcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDMnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ0J1xuICAsICdnbF9NdWx0aVRleENvb3JkNSdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDYnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ3J1xuICAsICdnbF9Ob3JtYWwnXG4gICwgJ2dsX05vcm1hbE1hdHJpeCdcbiAgLCAnZ2xfTm9ybWFsU2NhbGUnXG4gICwgJ2dsX09iamVjdFBsYW5lUSdcbiAgLCAnZ2xfT2JqZWN0UGxhbmVSJ1xuICAsICdnbF9PYmplY3RQbGFuZVMnXG4gICwgJ2dsX09iamVjdFBsYW5lVCdcbiAgLCAnZ2xfUG9pbnQnXG4gICwgJ2dsX1BvaW50Q29vcmQnXG4gICwgJ2dsX1BvaW50UGFyYW1ldGVycydcbiAgLCAnZ2xfUG9pbnRTaXplJ1xuICAsICdnbF9Qb3NpdGlvbidcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeCdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeEludmVyc2UnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9TZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfVGV4Q29vcmQnXG4gICwgJ2dsX1RleHR1cmVFbnZDb2xvcidcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeCdcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeEludmVyc2UnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXhJbnZlcnNlVHJhbnNwb3NlJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9WZXJ0ZXgnXG4gICwgJ2dyZWF0ZXJUaGFuJ1xuICAsICdncmVhdGVyVGhhbkVxdWFsJ1xuICAsICdpbnZlcnNlc3FydCdcbiAgLCAnbGVuZ3RoJ1xuICAsICdsZXNzVGhhbidcbiAgLCAnbGVzc1RoYW5FcXVhbCdcbiAgLCAnbG9nJ1xuICAsICdsb2cyJ1xuICAsICdtYXRyaXhDb21wTXVsdCdcbiAgLCAnbWF4J1xuICAsICdtaW4nXG4gICwgJ21peCdcbiAgLCAnbW9kJ1xuICAsICdub3JtYWxpemUnXG4gICwgJ25vdCdcbiAgLCAnbm90RXF1YWwnXG4gICwgJ3BvdydcbiAgLCAncmFkaWFucydcbiAgLCAncmVmbGVjdCdcbiAgLCAncmVmcmFjdCdcbiAgLCAnc2lnbidcbiAgLCAnc2luJ1xuICAsICdzbW9vdGhzdGVwJ1xuICAsICdzcXJ0J1xuICAsICdzdGVwJ1xuICAsICd0YW4nXG4gICwgJ3RleHR1cmUyRCdcbiAgLCAndGV4dHVyZTJETG9kJ1xuICAsICd0ZXh0dXJlMkRQcm9qJ1xuICAsICd0ZXh0dXJlMkRQcm9qTG9kJ1xuICAsICd0ZXh0dXJlQ3ViZSdcbiAgLCAndGV4dHVyZUN1YmVMb2QnXG4gICwgJ3RleHR1cmUyRExvZEVYVCdcbiAgLCAndGV4dHVyZTJEUHJvakxvZEVYVCdcbiAgLCAndGV4dHVyZUN1YmVMb2RFWFQnXG4gICwgJ3RleHR1cmUyREdyYWRFWFQnXG4gICwgJ3RleHR1cmUyRFByb2pHcmFkRVhUJ1xuICAsICd0ZXh0dXJlQ3ViZUdyYWRFWFQnXG5dXG4iLCJ2YXIgdjEwMCA9IHJlcXVpcmUoJy4vbGl0ZXJhbHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHYxMDAuc2xpY2UoKS5jb25jYXQoW1xuICAgJ2xheW91dCdcbiAgLCAnY2VudHJvaWQnXG4gICwgJ3Ntb290aCdcbiAgLCAnY2FzZSdcbiAgLCAnbWF0MngyJ1xuICAsICdtYXQyeDMnXG4gICwgJ21hdDJ4NCdcbiAgLCAnbWF0M3gyJ1xuICAsICdtYXQzeDMnXG4gICwgJ21hdDN4NCdcbiAgLCAnbWF0NHgyJ1xuICAsICdtYXQ0eDMnXG4gICwgJ21hdDR4NCdcbiAgLCAndWludCdcbiAgLCAndXZlYzInXG4gICwgJ3V2ZWMzJ1xuICAsICd1dmVjNCdcbiAgLCAnc2FtcGxlckN1YmVTaGFkb3cnXG4gICwgJ3NhbXBsZXIyREFycmF5J1xuICAsICdzYW1wbGVyMkRBcnJheVNoYWRvdydcbiAgLCAnaXNhbXBsZXIyRCdcbiAgLCAnaXNhbXBsZXIzRCdcbiAgLCAnaXNhbXBsZXJDdWJlJ1xuICAsICdpc2FtcGxlcjJEQXJyYXknXG4gICwgJ3VzYW1wbGVyMkQnXG4gICwgJ3VzYW1wbGVyM0QnXG4gICwgJ3VzYW1wbGVyQ3ViZSdcbiAgLCAndXNhbXBsZXIyREFycmF5J1xuICAsICdjb2hlcmVudCdcbiAgLCAncmVzdHJpY3QnXG4gICwgJ3JlYWRvbmx5J1xuICAsICd3cml0ZW9ubHknXG4gICwgJ3Jlc291cmNlJ1xuICAsICdhdG9taWNfdWludCdcbiAgLCAnbm9wZXJzcGVjdGl2ZSdcbiAgLCAncGF0Y2gnXG4gICwgJ3NhbXBsZSdcbiAgLCAnc3Vicm91dGluZSdcbiAgLCAnY29tbW9uJ1xuICAsICdwYXJ0aXRpb24nXG4gICwgJ2FjdGl2ZSdcbiAgLCAnZmlsdGVyJ1xuICAsICdpbWFnZTFEJ1xuICAsICdpbWFnZTJEJ1xuICAsICdpbWFnZTNEJ1xuICAsICdpbWFnZUN1YmUnXG4gICwgJ2lpbWFnZTFEJ1xuICAsICdpaW1hZ2UyRCdcbiAgLCAnaWltYWdlM0QnXG4gICwgJ2lpbWFnZUN1YmUnXG4gICwgJ3VpbWFnZTFEJ1xuICAsICd1aW1hZ2UyRCdcbiAgLCAndWltYWdlM0QnXG4gICwgJ3VpbWFnZUN1YmUnXG4gICwgJ2ltYWdlMURBcnJheSdcbiAgLCAnaW1hZ2UyREFycmF5J1xuICAsICdpaW1hZ2UxREFycmF5J1xuICAsICdpaW1hZ2UyREFycmF5J1xuICAsICd1aW1hZ2UxREFycmF5J1xuICAsICd1aW1hZ2UyREFycmF5J1xuICAsICdpbWFnZTFEU2hhZG93J1xuICAsICdpbWFnZTJEU2hhZG93J1xuICAsICdpbWFnZTFEQXJyYXlTaGFkb3cnXG4gICwgJ2ltYWdlMkRBcnJheVNoYWRvdydcbiAgLCAnaW1hZ2VCdWZmZXInXG4gICwgJ2lpbWFnZUJ1ZmZlcidcbiAgLCAndWltYWdlQnVmZmVyJ1xuICAsICdzYW1wbGVyMURBcnJheSdcbiAgLCAnc2FtcGxlcjFEQXJyYXlTaGFkb3cnXG4gICwgJ2lzYW1wbGVyMUQnXG4gICwgJ2lzYW1wbGVyMURBcnJheSdcbiAgLCAndXNhbXBsZXIxRCdcbiAgLCAndXNhbXBsZXIxREFycmF5J1xuICAsICdpc2FtcGxlcjJEUmVjdCdcbiAgLCAndXNhbXBsZXIyRFJlY3QnXG4gICwgJ3NhbXBsZXJCdWZmZXInXG4gICwgJ2lzYW1wbGVyQnVmZmVyJ1xuICAsICd1c2FtcGxlckJ1ZmZlcidcbiAgLCAnc2FtcGxlcjJETVMnXG4gICwgJ2lzYW1wbGVyMkRNUydcbiAgLCAndXNhbXBsZXIyRE1TJ1xuICAsICdzYW1wbGVyMkRNU0FycmF5J1xuICAsICdpc2FtcGxlcjJETVNBcnJheSdcbiAgLCAndXNhbXBsZXIyRE1TQXJyYXknXG5dKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIC8vIGN1cnJlbnRcbiAgICAncHJlY2lzaW9uJ1xuICAsICdoaWdocCdcbiAgLCAnbWVkaXVtcCdcbiAgLCAnbG93cCdcbiAgLCAnYXR0cmlidXRlJ1xuICAsICdjb25zdCdcbiAgLCAndW5pZm9ybSdcbiAgLCAndmFyeWluZydcbiAgLCAnYnJlYWsnXG4gICwgJ2NvbnRpbnVlJ1xuICAsICdkbydcbiAgLCAnZm9yJ1xuICAsICd3aGlsZSdcbiAgLCAnaWYnXG4gICwgJ2Vsc2UnXG4gICwgJ2luJ1xuICAsICdvdXQnXG4gICwgJ2lub3V0J1xuICAsICdmbG9hdCdcbiAgLCAnaW50J1xuICAsICd2b2lkJ1xuICAsICdib29sJ1xuICAsICd0cnVlJ1xuICAsICdmYWxzZSdcbiAgLCAnZGlzY2FyZCdcbiAgLCAncmV0dXJuJ1xuICAsICdtYXQyJ1xuICAsICdtYXQzJ1xuICAsICdtYXQ0J1xuICAsICd2ZWMyJ1xuICAsICd2ZWMzJ1xuICAsICd2ZWM0J1xuICAsICdpdmVjMidcbiAgLCAnaXZlYzMnXG4gICwgJ2l2ZWM0J1xuICAsICdidmVjMidcbiAgLCAnYnZlYzMnXG4gICwgJ2J2ZWM0J1xuICAsICdzYW1wbGVyMUQnXG4gICwgJ3NhbXBsZXIyRCdcbiAgLCAnc2FtcGxlcjNEJ1xuICAsICdzYW1wbGVyQ3ViZSdcbiAgLCAnc2FtcGxlcjFEU2hhZG93J1xuICAsICdzYW1wbGVyMkRTaGFkb3cnXG4gICwgJ3N0cnVjdCdcblxuICAvLyBmdXR1cmVcbiAgLCAnYXNtJ1xuICAsICdjbGFzcydcbiAgLCAndW5pb24nXG4gICwgJ2VudW0nXG4gICwgJ3R5cGVkZWYnXG4gICwgJ3RlbXBsYXRlJ1xuICAsICd0aGlzJ1xuICAsICdwYWNrZWQnXG4gICwgJ2dvdG8nXG4gICwgJ3N3aXRjaCdcbiAgLCAnZGVmYXVsdCdcbiAgLCAnaW5saW5lJ1xuICAsICdub2lubGluZSdcbiAgLCAndm9sYXRpbGUnXG4gICwgJ3B1YmxpYydcbiAgLCAnc3RhdGljJ1xuICAsICdleHRlcm4nXG4gICwgJ2V4dGVybmFsJ1xuICAsICdpbnRlcmZhY2UnXG4gICwgJ2xvbmcnXG4gICwgJ3Nob3J0J1xuICAsICdkb3VibGUnXG4gICwgJ2hhbGYnXG4gICwgJ2ZpeGVkJ1xuICAsICd1bnNpZ25lZCdcbiAgLCAnaW5wdXQnXG4gICwgJ291dHB1dCdcbiAgLCAnaHZlYzInXG4gICwgJ2h2ZWMzJ1xuICAsICdodmVjNCdcbiAgLCAnZHZlYzInXG4gICwgJ2R2ZWMzJ1xuICAsICdkdmVjNCdcbiAgLCAnZnZlYzInXG4gICwgJ2Z2ZWMzJ1xuICAsICdmdmVjNCdcbiAgLCAnc2FtcGxlcjJEUmVjdCdcbiAgLCAnc2FtcGxlcjNEUmVjdCdcbiAgLCAnc2FtcGxlcjJEUmVjdFNoYWRvdydcbiAgLCAnc2l6ZW9mJ1xuICAsICdjYXN0J1xuICAsICduYW1lc3BhY2UnXG4gICwgJ3VzaW5nJ1xuXVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICAgJzw8PSdcbiAgLCAnPj49J1xuICAsICcrKydcbiAgLCAnLS0nXG4gICwgJzw8J1xuICAsICc+PidcbiAgLCAnPD0nXG4gICwgJz49J1xuICAsICc9PSdcbiAgLCAnIT0nXG4gICwgJyYmJ1xuICAsICd8fCdcbiAgLCAnKz0nXG4gICwgJy09J1xuICAsICcqPSdcbiAgLCAnLz0nXG4gICwgJyU9J1xuICAsICcmPSdcbiAgLCAnXl4nXG4gICwgJ149J1xuICAsICd8PSdcbiAgLCAnKCdcbiAgLCAnKSdcbiAgLCAnWydcbiAgLCAnXSdcbiAgLCAnLidcbiAgLCAnISdcbiAgLCAnfidcbiAgLCAnKidcbiAgLCAnLydcbiAgLCAnJSdcbiAgLCAnKydcbiAgLCAnLSdcbiAgLCAnPCdcbiAgLCAnPidcbiAgLCAnJidcbiAgLCAnXidcbiAgLCAnfCdcbiAgLCAnPydcbiAgLCAnOidcbiAgLCAnPSdcbiAgLCAnLCdcbiAgLCAnOydcbiAgLCAneydcbiAgLCAnfSdcbl1cbiIsInZhciB0b2tlbml6ZSA9IHJlcXVpcmUoJy4vaW5kZXgnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRva2VuaXplU3RyaW5nXG5cbmZ1bmN0aW9uIHRva2VuaXplU3RyaW5nKHN0ciwgb3B0KSB7XG4gIHZhciBnZW5lcmF0b3IgPSB0b2tlbml6ZShvcHQpXG4gIHZhciB0b2tlbnMgPSBbXVxuXG4gIHRva2VucyA9IHRva2Vucy5jb25jYXQoZ2VuZXJhdG9yKHN0cikpXG4gIHRva2VucyA9IHRva2Vucy5jb25jYXQoZ2VuZXJhdG9yKG51bGwpKVxuXG4gIHJldHVybiB0b2tlbnNcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLyohXG4gKiBwYWQtbGVmdCA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvcGFkLWxlZnQ+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEpvbiBTY2hsaW5rZXJ0LlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHJlcGVhdCA9IHJlcXVpcmUoJ3JlcGVhdC1zdHJpbmcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYWRMZWZ0KHN0ciwgbnVtLCBjaCkge1xuICBjaCA9IHR5cGVvZiBjaCAhPT0gJ3VuZGVmaW5lZCcgPyAoY2ggKyAnJykgOiAnICc7XG4gIHJldHVybiByZXBlYXQoY2gsIG51bSkgKyBzdHI7XG59OyIsIi8qIVxuICogcmVwZWF0LXN0cmluZyA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvcmVwZWF0LXN0cmluZz5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFJlc3VsdHMgY2FjaGVcbiAqL1xuXG52YXIgcmVzID0gJyc7XG52YXIgY2FjaGU7XG5cbi8qKlxuICogRXhwb3NlIGByZXBlYXRgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSByZXBlYXQ7XG5cbi8qKlxuICogUmVwZWF0IHRoZSBnaXZlbiBgc3RyaW5nYCB0aGUgc3BlY2lmaWVkIGBudW1iZXJgXG4gKiBvZiB0aW1lcy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqXG4gKiBgYGBqc1xuICogdmFyIHJlcGVhdCA9IHJlcXVpcmUoJ3JlcGVhdC1zdHJpbmcnKTtcbiAqIHJlcGVhdCgnQScsIDUpO1xuICogLy89PiBBQUFBQVxuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGBzdHJpbmdgIFRoZSBzdHJpbmcgdG8gcmVwZWF0XG4gKiBAcGFyYW0ge051bWJlcn0gYG51bWJlcmAgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSBSZXBlYXRlZCBzdHJpbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gcmVwZWF0KHN0ciwgbnVtKSB7XG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3JlcGVhdC1zdHJpbmcgZXhwZWN0cyBhIHN0cmluZy4nKTtcbiAgfVxuXG4gIC8vIGNvdmVyIGNvbW1vbiwgcXVpY2sgdXNlIGNhc2VzXG4gIGlmIChudW0gPT09IDEpIHJldHVybiBzdHI7XG4gIGlmIChudW0gPT09IDIpIHJldHVybiBzdHIgKyBzdHI7XG5cbiAgdmFyIG1heCA9IHN0ci5sZW5ndGggKiBudW07XG4gIGlmIChjYWNoZSAhPT0gc3RyIHx8IHR5cGVvZiBjYWNoZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjYWNoZSA9IHN0cjtcbiAgICByZXMgPSAnJztcbiAgfVxuXG4gIHdoaWxlIChtYXggPiByZXMubGVuZ3RoICYmIG51bSA+IDApIHtcbiAgICBpZiAobnVtICYgMSkge1xuICAgICAgcmVzICs9IHN0cjtcbiAgICB9XG5cbiAgICBudW0gPj49IDE7XG4gICAgaWYgKCFudW0pIGJyZWFrO1xuICAgIHN0ciArPSBzdHI7XG4gIH1cblxuICByZXR1cm4gcmVzLnN1YnN0cigwLCBtYXgpO1xufVxuXG4iLCIoZnVuY3Rpb24od2luZG93KSB7XG4gICAgdmFyIHJlID0ge1xuICAgICAgICBub3Rfc3RyaW5nOiAvW15zXS8sXG4gICAgICAgIG51bWJlcjogL1tkaWVmZ10vLFxuICAgICAgICBqc29uOiAvW2pdLyxcbiAgICAgICAgbm90X2pzb246IC9bXmpdLyxcbiAgICAgICAgdGV4dDogL15bXlxceDI1XSsvLFxuICAgICAgICBtb2R1bG86IC9eXFx4MjV7Mn0vLFxuICAgICAgICBwbGFjZWhvbGRlcjogL15cXHgyNSg/OihbMS05XVxcZCopXFwkfFxcKChbXlxcKV0rKVxcKSk/KFxcKyk/KDB8J1teJF0pPygtKT8oXFxkKyk/KD86XFwuKFxcZCspKT8oW2ItZ2lqb3N1eFhdKS8sXG4gICAgICAgIGtleTogL14oW2Etel9dW2Etel9cXGRdKikvaSxcbiAgICAgICAga2V5X2FjY2VzczogL15cXC4oW2Etel9dW2Etel9cXGRdKikvaSxcbiAgICAgICAgaW5kZXhfYWNjZXNzOiAvXlxcWyhcXGQrKVxcXS8sXG4gICAgICAgIHNpZ246IC9eW1xcK1xcLV0vXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3ByaW50ZigpIHtcbiAgICAgICAgdmFyIGtleSA9IGFyZ3VtZW50c1swXSwgY2FjaGUgPSBzcHJpbnRmLmNhY2hlXG4gICAgICAgIGlmICghKGNhY2hlW2tleV0gJiYgY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkpIHtcbiAgICAgICAgICAgIGNhY2hlW2tleV0gPSBzcHJpbnRmLnBhcnNlKGtleSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3ByaW50Zi5mb3JtYXQuY2FsbChudWxsLCBjYWNoZVtrZXldLCBhcmd1bWVudHMpXG4gICAgfVxuXG4gICAgc3ByaW50Zi5mb3JtYXQgPSBmdW5jdGlvbihwYXJzZV90cmVlLCBhcmd2KSB7XG4gICAgICAgIHZhciBjdXJzb3IgPSAxLCB0cmVlX2xlbmd0aCA9IHBhcnNlX3RyZWUubGVuZ3RoLCBub2RlX3R5cGUgPSBcIlwiLCBhcmcsIG91dHB1dCA9IFtdLCBpLCBrLCBtYXRjaCwgcGFkLCBwYWRfY2hhcmFjdGVyLCBwYWRfbGVuZ3RoLCBpc19wb3NpdGl2ZSA9IHRydWUsIHNpZ24gPSBcIlwiXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0cmVlX2xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlX3R5cGUgPSBnZXRfdHlwZShwYXJzZV90cmVlW2ldKVxuICAgICAgICAgICAgaWYgKG5vZGVfdHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IHBhcnNlX3RyZWVbaV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5vZGVfdHlwZSA9PT0gXCJhcnJheVwiKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSBwYXJzZV90cmVlW2ldIC8vIGNvbnZlbmllbmNlIHB1cnBvc2VzIG9ubHlcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHsgLy8ga2V5d29yZCBhcmd1bWVudFxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd2W2N1cnNvcl1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IG1hdGNoWzJdLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFyZy5oYXNPd25Qcm9wZXJ0eShtYXRjaFsyXVtrXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZihcIltzcHJpbnRmXSBwcm9wZXJ0eSAnJXMnIGRvZXMgbm90IGV4aXN0XCIsIG1hdGNoWzJdW2tdKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ1ttYXRjaFsyXVtrXV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtYXRjaFsxXSkgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChleHBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndlttYXRjaFsxXV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7IC8vIHBvc2l0aW9uYWwgYXJndW1lbnQgKGltcGxpY2l0KVxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd2W2N1cnNvcisrXVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChnZXRfdHlwZShhcmcpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcoKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5ub3Rfc3RyaW5nLnRlc3QobWF0Y2hbOF0pICYmIHJlLm5vdF9qc29uLnRlc3QobWF0Y2hbOF0pICYmIChnZXRfdHlwZShhcmcpICE9IFwibnVtYmVyXCIgJiYgaXNOYU4oYXJnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzcHJpbnRmKFwiW3NwcmludGZdIGV4cGVjdGluZyBudW1iZXIgYnV0IGZvdW5kICVzXCIsIGdldF90eXBlKGFyZykpKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChtYXRjaFs4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNfcG9zaXRpdmUgPSBhcmcgPj0gMFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN3aXRjaCAobWF0Y2hbOF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygyKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gU3RyaW5nLmZyb21DaGFyQ29kZShhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBwYXJzZUludChhcmcsIDEwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwialwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gSlNPTi5zdHJpbmdpZnkoYXJnLCBudWxsLCBtYXRjaFs2XSA/IHBhcnNlSW50KG1hdGNoWzZdKSA6IDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IGFyZy50b0V4cG9uZW50aWFsKG1hdGNoWzddKSA6IGFyZy50b0V4cG9uZW50aWFsKClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IG1hdGNoWzddID8gcGFyc2VGbG9hdChhcmcpLnRvRml4ZWQobWF0Y2hbN10pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJnXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IHBhcnNlRmxvYXQoYXJnKS50b1ByZWNpc2lvbihtYXRjaFs3XSkgOiBwYXJzZUZsb2F0KGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZyg4KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKChhcmcgPSBTdHJpbmcoYXJnKSkgJiYgbWF0Y2hbN10gPyBhcmcuc3Vic3RyaW5nKDAsIG1hdGNoWzddKSA6IGFyZylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZyA+Pj4gMFxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwieFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDE2KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiWFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZS5qc29uLnRlc3QobWF0Y2hbOF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IGFyZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlLm51bWJlci50ZXN0KG1hdGNoWzhdKSAmJiAoIWlzX3Bvc2l0aXZlIHx8IG1hdGNoWzNdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IGlzX3Bvc2l0aXZlID8gXCIrXCIgOiBcIi1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnRvU3RyaW5nKCkucmVwbGFjZShyZS5zaWduLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwYWRfY2hhcmFjdGVyID0gbWF0Y2hbNF0gPyBtYXRjaFs0XSA9PT0gXCIwXCIgPyBcIjBcIiA6IG1hdGNoWzRdLmNoYXJBdCgxKSA6IFwiIFwiXG4gICAgICAgICAgICAgICAgICAgIHBhZF9sZW5ndGggPSBtYXRjaFs2XSAtIChzaWduICsgYXJnKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcGFkID0gbWF0Y2hbNl0gPyAocGFkX2xlbmd0aCA+IDAgPyBzdHJfcmVwZWF0KHBhZF9jaGFyYWN0ZXIsIHBhZF9sZW5ndGgpIDogXCJcIikgOiBcIlwiXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtvdXRwdXQubGVuZ3RoXSA9IG1hdGNoWzVdID8gc2lnbiArIGFyZyArIHBhZCA6IChwYWRfY2hhcmFjdGVyID09PSBcIjBcIiA/IHNpZ24gKyBwYWQgKyBhcmcgOiBwYWQgKyBzaWduICsgYXJnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0LmpvaW4oXCJcIilcbiAgICB9XG5cbiAgICBzcHJpbnRmLmNhY2hlID0ge31cblxuICAgIHNwcmludGYucGFyc2UgPSBmdW5jdGlvbihmbXQpIHtcbiAgICAgICAgdmFyIF9mbXQgPSBmbXQsIG1hdGNoID0gW10sIHBhcnNlX3RyZWUgPSBbXSwgYXJnX25hbWVzID0gMFxuICAgICAgICB3aGlsZSAoX2ZtdCkge1xuICAgICAgICAgICAgaWYgKChtYXRjaCA9IHJlLnRleHQuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlW3BhcnNlX3RyZWUubGVuZ3RoXSA9IG1hdGNoWzBdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5tb2R1bG8uZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlW3BhcnNlX3RyZWUubGVuZ3RoXSA9IFwiJVwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5wbGFjZWhvbGRlci5leGVjKF9mbXQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdfbmFtZXMgfD0gMVxuICAgICAgICAgICAgICAgICAgICB2YXIgZmllbGRfbGlzdCA9IFtdLCByZXBsYWNlbWVudF9maWVsZCA9IG1hdGNoWzJdLCBmaWVsZF9tYXRjaCA9IFtdXG4gICAgICAgICAgICAgICAgICAgIGlmICgoZmllbGRfbWF0Y2ggPSByZS5rZXkuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKHJlcGxhY2VtZW50X2ZpZWxkID0gcmVwbGFjZW1lbnRfZmllbGQuc3Vic3RyaW5nKGZpZWxkX21hdGNoWzBdLmxlbmd0aCkpICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChmaWVsZF9tYXRjaCA9IHJlLmtleV9hY2Nlc3MuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkX2xpc3RbZmllbGRfbGlzdC5sZW5ndGhdID0gZmllbGRfbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoKGZpZWxkX21hdGNoID0gcmUuaW5kZXhfYWNjZXNzLmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJbc3ByaW50Zl0gZmFpbGVkIHRvIHBhcnNlIG5hbWVkIGFyZ3VtZW50IGtleVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIltzcHJpbnRmXSBmYWlsZWQgdG8gcGFyc2UgbmFtZWQgYXJndW1lbnQga2V5XCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBmaWVsZF9saXN0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhcmdfbmFtZXMgfD0gMlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXJnX25hbWVzID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIltzcHJpbnRmXSBtaXhpbmcgcG9zaXRpb25hbCBhbmQgbmFtZWQgcGxhY2Vob2xkZXJzIGlzIG5vdCAoeWV0KSBzdXBwb3J0ZWRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBtYXRjaFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW3NwcmludGZdIHVuZXhwZWN0ZWQgcGxhY2Vob2xkZXJcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9mbXQgPSBfZm10LnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcnNlX3RyZWVcbiAgICB9XG5cbiAgICB2YXIgdnNwcmludGYgPSBmdW5jdGlvbihmbXQsIGFyZ3YsIF9hcmd2KSB7XG4gICAgICAgIF9hcmd2ID0gKGFyZ3YgfHwgW10pLnNsaWNlKDApXG4gICAgICAgIF9hcmd2LnNwbGljZSgwLCAwLCBmbXQpXG4gICAgICAgIHJldHVybiBzcHJpbnRmLmFwcGx5KG51bGwsIF9hcmd2KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGhlbHBlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRfdHlwZSh2YXJpYWJsZSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0cl9yZXBlYXQoaW5wdXQsIG11bHRpcGxpZXIpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5KG11bHRpcGxpZXIgKyAxKS5qb2luKGlucHV0KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGV4cG9ydCB0byBlaXRoZXIgYnJvd3NlciBvciBub2RlLmpzXG4gICAgICovXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGV4cG9ydHMuc3ByaW50ZiA9IHNwcmludGZcbiAgICAgICAgZXhwb3J0cy52c3ByaW50ZiA9IHZzcHJpbnRmXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB3aW5kb3cuc3ByaW50ZiA9IHNwcmludGZcbiAgICAgICAgd2luZG93LnZzcHJpbnRmID0gdnNwcmludGZcblxuICAgICAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzcHJpbnRmOiBzcHJpbnRmLFxuICAgICAgICAgICAgICAgICAgICB2c3ByaW50ZjogdnNwcmludGZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufSkodHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIiA/IHRoaXMgOiB3aW5kb3cpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIi8vICBUaW1lciBiYXNlZCBhbmltYXRpb25cbi8vIFRPRE8gY2xlYW4gdXAgbGludGluZ1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGdsb2JhbCBzZXRUaW1lb3V0ICovXG5pbXBvcnQge21lcmdlLCBub29wLCBzcGxhdH0gZnJvbSAnLi4vdXRpbHMnO1xuXG52YXIgUXVldWUgPSBbXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRngge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdCA9IG1lcmdlKHtcbiAgICAgIGRlbGF5OiAwLFxuICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICB0cmFuc2l0aW9uOiB4ID0+IHgsXG4gICAgICBvbkNvbXB1dGU6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wXG4gICAgfSwgb3B0aW9ucyk7XG4gIH1cblxuICBzdGFydChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh0aGlzLm9wdCwgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy50aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmFuaW1hdGluZyA9IHRydWU7XG4gICAgUXVldWUucHVzaCh0aGlzKTtcbiAgfVxuXG4gIC8vIHBlcmZvcm0gYSBzdGVwIGluIHRoZSBhbmltYXRpb25cbiAgc3RlcCgpIHtcbiAgICAvLyBpZiBub3QgYW5pbWF0aW5nLCB0aGVuIHJldHVyblxuICAgIGlmICghdGhpcy5hbmltYXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKSxcbiAgICAgIHRpbWUgPSB0aGlzLnRpbWUsXG4gICAgICBvcHQgPSB0aGlzLm9wdCxcbiAgICAgIGRlbGF5ID0gb3B0LmRlbGF5LFxuICAgICAgZHVyYXRpb24gPSBvcHQuZHVyYXRpb24sXG4gICAgICBkZWx0YSA9IDA7XG4gICAgLy8gaG9sZCBhbmltYXRpb24gZm9yIHRoZSBkZWxheVxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSkge1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaWYgaW4gb3VyIHRpbWUgd2luZG93LCB0aGVuIGV4ZWN1dGUgYW5pbWF0aW9uXG4gICAgaWYgKGN1cnJlbnRUaW1lIDwgdGltZSArIGRlbGF5ICsgZHVyYXRpb24pIHtcbiAgICAgIGRlbHRhID0gb3B0LnRyYW5zaXRpb24oKGN1cnJlbnRUaW1lIC0gdGltZSAtIGRlbGF5KSAvIGR1cmF0aW9uKTtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgMSk7XG4gICAgICBvcHQub25Db21wbGV0ZS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBjb21wdXRlKGZyb20sIHRvLCBkZWx0YSkge1xuICAgIHJldHVybiBmcm9tICsgKHRvIC0gZnJvbSkgKiBkZWx0YTtcbiAgfVxufVxuXG5GeC5RdWV1ZSA9IFF1ZXVlO1xuXG4vLyBFYXNpbmcgZXF1YXRpb25zXG5GeC5UcmFuc2l0aW9uID0ge1xuICBsaW5lYXIocCkge1xuICAgIHJldHVybiBwO1xuICB9XG59O1xuXG52YXIgVHJhbnMgPSBGeC5UcmFuc2l0aW9uO1xuXG5GeC5wcm90b3R5cGUudGltZSA9IG51bGw7XG5cbmZ1bmN0aW9uIG1ha2VUcmFucyh0cmFuc2l0aW9uLCBwYXJhbXMpIHtcbiAgcGFyYW1zID0gc3BsYXQocGFyYW1zKTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24odHJhbnNpdGlvbiwge1xuICAgIGVhc2VJbihwb3MpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uKHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VPdXQocG9zKSB7XG4gICAgICByZXR1cm4gMSAtIHRyYW5zaXRpb24oMSAtIHBvcywgcGFyYW1zKTtcbiAgICB9LFxuICAgIGVhc2VJbk91dChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zIDw9IDAuNSkgPyB0cmFuc2l0aW9uKDIgKiBwb3MsIHBhcmFtcykgLyAyIDpcbiAgICAgICAgKDIgLSB0cmFuc2l0aW9uKDIgKiAoMSAtIHBvcyksIHBhcmFtcykpIC8gMjtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgdHJhbnNpdGlvbnMgPSB7XG5cbiAgUG93KHAsIHgpIHtcbiAgICByZXR1cm4gTWF0aC5wb3cocCwgeFswXSB8fCA2KTtcbiAgfSxcblxuICBFeHBvKHApIHtcbiAgICByZXR1cm4gTWF0aC5wb3coMiwgOCAqIChwIC0gMSkpO1xuICB9LFxuXG4gIENpcmMocCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oTWF0aC5hY29zKHApKTtcbiAgfSxcblxuICBTaW5lKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKCgxIC0gcCkgKiBNYXRoLlBJIC8gMik7XG4gIH0sXG5cbiAgQmFjayhwLCB4KSB7XG4gICAgeCA9IHhbMF0gfHwgMS42MTg7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIDIpICogKCh4ICsgMSkgKiBwIC0geCk7XG4gIH0sXG5cbiAgQm91bmNlKHApIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgZm9yIChsZXQgYSA9IDAsIGIgPSAxOyAxOyBhICs9IGIsIGIgLz0gMikge1xuICAgICAgaWYgKHAgPj0gKDcgLSA0ICogYSkgLyAxMSkge1xuICAgICAgICB2YWx1ZSA9IGIgKiBiIC0gTWF0aC5wb3coKDExIC0gNiAqIGEgLSAxMSAqIHApIC8gNCwgMik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG5cbiAgRWxhc3RpYyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDEwICogLS1wKSAqIE1hdGguY29zKDIwICogcCAqIE1hdGguUEkgKiAoeFswXSB8fCAxKSAvIDMpO1xuICB9XG5cbn07XG5cbmZvciAoY29uc3QgdCBpbiB0cmFuc2l0aW9ucykge1xuICBUcmFuc1t0XSA9IG1ha2VUcmFucyh0cmFuc2l0aW9uc1t0XSk7XG59XG5cblsnUXVhZCcsICdDdWJpYycsICdRdWFydCcsICdRdWludCddLmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaSkge1xuICBUcmFuc1tlbGVtXSA9IG1ha2VUcmFucyhmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIFtcbiAgICAgIGkgKyAyXG4gICAgXSk7XG4gIH0pO1xufSk7XG5cbi8vIGFuaW1hdGlvblRpbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcblxuLy8gIHJ5ZTogVE9ETy0gcmVmYWN0b3IgZ2xvYmFsIGRlZmluaXRpb24gd2hlbiB3ZSBkZWZpbmUgdGhlIHR3b1xuLy8gICAgICAgICAgICAgKGJyb3dzZXJpZnkvPHNjcmlwdD4pIGJ1aWxkIHBhdGhzLlxudmFyIGdsb2JhbDtcbnRyeSB7XG4gIGdsb2JhbCA9IHdpbmRvdztcbn0gY2F0Y2ggKGUpIHtcbiAgZ2xvYmFsID0gbnVsbDtcbn1cblxudmFyIGNoZWNrRnhRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2xkUXVldWUgPSBRdWV1ZTtcbiAgUXVldWUgPSBbXTtcbiAgaWYgKG9sZFF1ZXVlLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2xkUXVldWUubGVuZ3RoLCBmeDsgaSA8IGw7IGkrKykge1xuICAgICAgZnggPSBvbGRRdWV1ZVtpXTtcbiAgICAgIGZ4LnN0ZXAoKTtcbiAgICAgIGlmIChmeC5hbmltYXRpbmcpIHtcbiAgICAgICAgUXVldWUucHVzaChmeCk7XG4gICAgICB9XG4gICAgfVxuICAgIEZ4LlF1ZXVlID0gUXVldWU7XG4gIH1cbn07XG5cbmlmIChnbG9iYWwpIHtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG4gIFsnd2Via2l0QW5pbWF0aW9uVGltZScsICdtb3pBbmltYXRpb25UaW1lJywgJ2FuaW1hdGlvblRpbWUnLFxuICAgJ3dlYmtpdEFuaW1hdGlvblN0YXJ0VGltZScsICdtb3pBbmltYXRpb25TdGFydFRpbWUnLCAnYW5pbWF0aW9uU3RhcnRUaW1lJ11cbiAgICAuZm9yRWFjaChpbXBsID0+IHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5hbmltYXRpb25UaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGdsb2JhbFtpbXBsXTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRnguYW5pbWF0aW9uVGltZSA9IERhdGUubm93O1xuICB9XG4gIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSAtIGZ1bmN0aW9uIGJyYW5jaGluZ1xuICBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZScsICdtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLFxuICAgJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddXG4gICAgLmZvckVhY2goZnVuY3Rpb24oaW1wbCkge1xuICAgICAgaWYgKGltcGwgaW4gZ2xvYmFsKSB7XG4gICAgICAgIEZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgZ2xvYmFsW2ltcGxdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIGlmICghZm91bmQpIHtcbiAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2hlY2tGeFF1ZXVlKCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9LCAxMDAwIC8gNjApO1xuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCBQcm9ncmFtIGZyb20gJy4uL3dlYmdsL3Byb2dyYW0nO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQge1hIUkdyb3VwfSBmcm9tICcuLi9pbyc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuLy8gQWx0ZXJuYXRlIGNvbnN0cnVjdG9yXG4vLyBCdWlsZCBwcm9ncmFtIGZyb20gZGVmYXVsdCBzaGFkZXJzIChyZXF1aXJlcyBTaGFkZXJzKVxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtZnJvbURlZmF1bHRTaGFkZXJzKGdsLCBpZCkge1xuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHtcbiAgICB2czogU2hhZGVycy5WZXJ0ZXguRGVmYXVsdCxcbiAgICBmczogU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0LFxuICAgIGlkXG4gIH0pO1xufVxuXG4vLyBDcmVhdGUgYSBwcm9ncmFtIGZyb20gdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgbm9kZSBpZHNcbi8vIEBkZXByZWNhdGVkIC0gVXNlIGdsc2xpZnkgaW5zdGVhZFxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtRnJvbUhUTUxUZW1wbGF0ZXMoZ2wsIHZzSWQsIGZzSWQsIGlkKSB7XG4gIGNvbnN0IHZzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodnNJZCkuaW5uZXJIVE1MO1xuICBjb25zdCBmcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZzSWQpLmlubmVySFRNTDtcbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7dnMsIGZzLCBpZH0pO1xufVxuXG4vLyBMb2FkIHNoYWRlcnMgdXNpbmcgWEhSXG4vLyBAZGVwcmVjYXRlZCAtIFVzZSBnbHNsaWZ5IGluc3RlYWRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlUHJvZ3JhbUZyb21TaGFkZXJVUklzKGdsLCB2cywgZnMsIG9wdHMpIHtcbiAgb3B0cyA9IG1lcmdlKHtcbiAgICBwYXRoOiAnLycsXG4gICAgbm9DYWNoZTogZmFsc2VcbiAgfSwgb3B0cyk7XG5cbiAgY29uc3QgdmVydGV4U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgdnM7XG4gIGNvbnN0IGZyYWdtZW50U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgZnM7XG5cbiAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgbmV3IFhIUkdyb3VwKHtcbiAgICB1cmxzOiBbdmVydGV4U2hhZGVyVVJJLCBmcmFnbWVudFNoYWRlclVSSV0sXG4gICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG4gIH0pLnNlbmRBc3luYygpO1xuXG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzOiByZXNwb25zZXNbMF0sIGZzOiByZXNwb25zZXNbMV19KTtcbn1cbiIsImltcG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgKiBhcyBzYXZlQml0bWFwIGZyb20gJy4vc2F2ZS1iaXRtYXAnO1xuXG5leHBvcnQge2RlZmF1bHQgYXMgRnh9IGZyb20gJy4vZngnO1xuZXhwb3J0IHtkZWZhdWx0IGFzIFdvcmtlckdyb3VwfSBmcm9tICcuL3dvcmtlcnMnO1xuZXhwb3J0ICogZnJvbSAnLi9oZWxwZXJzJztcbmV4cG9ydCAqIGZyb20gJy4vc2F2ZS1iaXRtYXAnO1xuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lkx1bWFHTCkge1xuICB3aW5kb3cuTHVtYUdMLmFkZG9ucyA9IHtcbiAgICBGeDogRngsXG4gICAgV29ya2VyR3JvdXA6IFdvcmtlckdyb3VwXG4gIH07XG4gIE9iamVjdC5hc3NpZ24od2luZG93Lkx1bWFHTC5hZGRvbnMsIGhlbHBlcnMpO1xuICBPYmplY3QuYXNzaWduKHdpbmRvdy5MdW1hR0wuYWRkb25zLCBzYXZlQml0bWFwKTtcbn1cbiIsImltcG9ydCB7c2F2ZUFzfSBmcm9tICdmaWxlc2F2ZXIuanMnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIHRvQmxvYn0gZnJvbSAnY2FudmFzLXRvLWJsb2InO1xuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZUJpdG1hcChjYW52YXMsIGZpbGVuYW1lKSB7XG4gIGNvbnN0IGJsb2IgPSB0b0Jsb2IoY2FudmFzLnRvRGF0YVVSTCgpKTtcbiAgc2F2ZUFzKGJsb2IsIGZpbGVuYW1lKTtcbn1cbiIsIi8vIHdvcmtlcnMuanNcbi8vXG4vKiBnbG9iYWwgV29ya2VyICovXG4vKiBlc2xpbnQtZGlzYWJsZSBvbmUtdmFyLCBpbmRlbnQgKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV29ya2VyR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGZpbGVOYW1lLCBuKSB7XG4gICAgdmFyIHdvcmtlcnMgPSB0aGlzLndvcmtlcnMgPSBbXTtcbiAgICB3aGlsZSAobi0tKSB7XG4gICAgICB3b3JrZXJzLnB1c2gobmV3IFdvcmtlcihmaWxlTmFtZSkpO1xuICAgIH1cbiAgfVxuXG4gIG1hcChmdW5jKSB7XG4gICAgdmFyIHdvcmtlcnMgPSB0aGlzLndvcmtlcnM7XG4gICAgdmFyIGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3MgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gd29ya2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNvbmZpZ3MucHVzaChmdW5jICYmIGZ1bmMoaSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVkdWNlKG9wdCkge1xuICAgIHZhciBmbiA9IG9wdC5yZWR1Y2VGbixcbiAgICAgICAgd29ya2VycyA9IHRoaXMud29ya2VycyxcbiAgICAgICAgY29uZmlncyA9IHRoaXMuY29uZmlncyxcbiAgICAgICAgbCA9IHdvcmtlcnMubGVuZ3RoLFxuICAgICAgICBhY3VtID0gb3B0LmluaXRpYWxWYWx1ZSxcbiAgICAgICAgbWVzc2FnZSA9IGZ1bmN0aW9uIF8oZSkge1xuICAgICAgICAgIGwtLTtcbiAgICAgICAgICBpZiAoYWN1bSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBhY3VtID0gZS5kYXRhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY3VtID0gZm4oYWN1bSwgZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGwgPT09IDApIHtcbiAgICAgICAgICAgIG9wdC5vbkNvbXBsZXRlKGFjdW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBmb3IgKHZhciBpID0gMCwgbG4gPSBsOyBpIDwgbG47IGkrKykge1xuICAgICAgdmFyIHcgPSB3b3JrZXJzW2ldO1xuICAgICAgdy5vbm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgdy5wb3N0TWVzc2FnZShjb25maWdzW2ldKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iLCIvLyBQcm92aWRlcyBsb2FkaW5nIG9mIGFzc2V0cyB3aXRoIFhIUiBhbmQgSlNPTlAgbWV0aG9kcy5cbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiwgY29tcGxleGl0eSAqL1xuXG4vKiBnbG9iYWwgZG9jdW1lbnQsIFhNTEh0dHBSZXF1ZXN0LCBJbWFnZSAqL1xuaW1wb3J0IHt1aWQsIHNwbGF0LCBtZXJnZSwgbm9vcH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge1RleHR1cmUyRH0gZnJvbSAnLi93ZWJnbCc7XG5cbmV4cG9ydCBjbGFzcyBYSFIge1xuXG4gIGNvbnN0cnVjdG9yKG9wdCA9IHt9KSB7XG4gICAgb3B0ID0ge1xuICAgICAgdXJsOiAnaHR0cDovLyBwaGlsb2dsanMub3JnLycsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgYXN5bmM6IHRydWUsXG4gICAgICBub0NhY2hlOiBmYWxzZSxcbiAgICAgIC8vIGJvZHk6IG51bGwsXG4gICAgICBzZW5kQXNCaW5hcnk6IGZhbHNlLFxuICAgICAgcmVzcG9uc2VUeXBlOiBmYWxzZSxcbiAgICAgIG9uUHJvZ3Jlc3M6IG5vb3AsXG4gICAgICBvblN1Y2Nlc3M6IG5vb3AsXG4gICAgICBvbkVycm9yOiBub29wLFxuICAgICAgb25BYm9ydDogbm9vcCxcbiAgICAgIG9uQ29tcGxldGU6IG5vb3AsXG4gICAgICAuLi5vcHRcbiAgICB9O1xuXG4gICAgdGhpcy5vcHQgPSBvcHQ7XG4gICAgdGhpcy5pbml0WEhSKCk7XG4gIH1cblxuICBpbml0WEhSKCkge1xuICAgIGNvbnN0IHJlcSA9IHRoaXMucmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBbJ1Byb2dyZXNzJywgJ0Vycm9yJywgJ0Fib3J0JywgJ0xvYWQnXS5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgIGlmIChyZXEuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICByZXEuYWRkRXZlbnRMaXN0ZW5lcihldmVudC50b0xvd2VyQ2FzZSgpLCBlID0+IHtcbiAgICAgICAgICBzZWxmWydoYW5kbGUnICsgZXZlbnRdKGUpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXFbJ29uJyArIGV2ZW50LnRvTG93ZXJDYXNlKCldID0gZSA9PiB7XG4gICAgICAgICAgc2VsZlsnaGFuZGxlJyArIGV2ZW50XShlKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNlbmRBc3luYyhib2R5KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHtyZXEsIG9wdH0gPSB0aGlzO1xuICAgICAgY29uc3Qge2FzeW5jfSA9IG9wdDtcblxuICAgICAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgICAgIG9wdC51cmwgKz0gKG9wdC51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gICAgICB9XG5cbiAgICAgIHJlcS5vcGVuKG9wdC5tZXRob2QsIG9wdC51cmwsIGFzeW5jKTtcblxuICAgICAgaWYgKG9wdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IG9wdC5yZXNwb25zZVR5cGU7XG4gICAgICB9XG5cbiAgICAgIGlmIChhc3luYykge1xuICAgICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFIuU3RhdGUuQ09NUExFVEVEKSB7XG4gICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0LnNlbmRBc0JpbmFyeSkge1xuICAgICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEuc2VuZChib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWFzeW5jKSB7XG4gICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2VuZChib2R5KSB7XG4gICAgY29uc3Qge3JlcSwgb3B0fSA9IHRoaXM7XG4gICAgY29uc3QgYXN5bmMgPSBvcHQuYXN5bmM7XG5cbiAgICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICAgIG9wdC51cmwgKz0gKG9wdC51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gICAgfVxuXG4gICAgcmVxLm9wZW4ob3B0Lm1ldGhvZCwgb3B0LnVybCwgYXN5bmMpO1xuXG4gICAgaWYgKG9wdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSBvcHQucmVzcG9uc2VUeXBlO1xuICAgIH1cblxuICAgIGlmIChhc3luYykge1xuICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IFhIUi5TdGF0ZS5DT01QTEVURUQpIHtcbiAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICBvcHQub25TdWNjZXNzKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0Lm9uRXJyb3IocmVxLnN0YXR1cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChvcHQuc2VuZEFzQmluYXJ5KSB7XG4gICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcS5zZW5kKGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCFhc3luYykge1xuICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICBvcHQub25TdWNjZXNzKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdC5vbkVycm9yKHJlcS5zdGF0dXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCB2YWx1ZSkge1xuICAgIHRoaXMucmVxLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBoYW5kbGVQcm9ncmVzcyhlKSB7XG4gICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgdGhpcy5vcHQub25Qcm9ncmVzcyhlLCBNYXRoLnJvdW5kKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wdC5vblByb2dyZXNzKGUsIC0xKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVFcnJvcihlKSB7XG4gICAgdGhpcy5vcHQub25FcnJvcihlKTtcbiAgfVxuXG4gIGhhbmRsZUFib3J0KGUpIHtcbiAgICB0aGlzLm9wdC5vbkFib3J0KGUpO1xuICB9XG5cbiAgaGFuZGxlTG9hZChlKSB7XG4gICAgdGhpcy5vcHQub25Db21wbGV0ZShlKTtcbiAgfVxufVxuXG5YSFIuU3RhdGUgPSB7fTtcblsnVU5JTklUSUFMSVpFRCcsICdMT0FESU5HJywgJ0xPQURFRCcsICdJTlRFUkFDVElWRScsICdDT01QTEVURUQnXVxuLmZvckVhY2goKHN0YXRlTmFtZSwgaSkgPT4ge1xuICBYSFIuU3RhdGVbc3RhdGVOYW1lXSA9IGk7XG59KTtcblxuLy8gTWFrZSBwYXJhbGxlbCByZXF1ZXN0cyBhbmQgZ3JvdXAgdGhlIHJlc3BvbnNlcy5cbmV4cG9ydCBjbGFzcyBYSFJHcm91cCB7XG5cbiAgY29uc3RydWN0b3Iob3B0ID0ge30pIHtcbiAgICBvcHQgPSB7XG4gICAgICB1cmxzOiBbXSxcbiAgICAgIG9uU3VjY2Vzczogbm9vcCxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBhc3luYzogdHJ1ZSxcbiAgICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgICAgLy8gYm9keTogbnVsbCxcbiAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2UsXG4gICAgICByZXNwb25zZVR5cGU6IGZhbHNlLFxuICAgICAgLi4ub3B0XG4gICAgfTtcblxuICAgIHZhciB1cmxzID0gc3BsYXQob3B0LnVybHMpO1xuICAgIHRoaXMucmVxcyA9IHVybHMubWFwKCh1cmwsIGkpID0+IG5ldyBYSFIoe1xuICAgICAgdXJsOiB1cmwsXG4gICAgICBtZXRob2Q6IG9wdC5tZXRob2QsXG4gICAgICBhc3luYzogb3B0LmFzeW5jLFxuICAgICAgbm9DYWNoZTogb3B0Lm5vQ2FjaGUsXG4gICAgICBzZW5kQXNCaW5hcnk6IG9wdC5zZW5kQXNCaW5hcnksXG4gICAgICByZXNwb25zZVR5cGU6IG9wdC5yZXNwb25zZVR5cGUsXG4gICAgICBib2R5OiBvcHQuYm9keVxuICAgIH0pKTtcbiAgfVxuXG4gIGFzeW5jIHNlbmRBc3luYygpIHtcbiAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5yZXFzLm1hcChyZXEgPT4gcmVxLnNlbmRBc3luYygpKSk7XG4gIH1cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gSlNPTlAob3B0KSB7XG4gIG9wdCA9IG1lcmdlKHtcbiAgICB1cmw6ICdodHRwOi8vIHBoaWxvZ2xqcy5vcmcvJyxcbiAgICBkYXRhOiB7fSxcbiAgICBub0NhY2hlOiBmYWxzZSxcbiAgICBvbkNvbXBsZXRlOiBub29wLFxuICAgIGNhbGxiYWNrS2V5OiAnY2FsbGJhY2snXG4gIH0sIG9wdCB8fCB7fSk7XG5cbiAgdmFyIGluZGV4ID0gSlNPTlAuY291bnRlcisrO1xuICAvLyBjcmVhdGUgcXVlcnkgc3RyaW5nXG4gIHZhciBkYXRhID0gW107XG4gIGZvciAodmFyIHByb3AgaW4gb3B0LmRhdGEpIHtcbiAgICBkYXRhLnB1c2gocHJvcCArICc9JyArIG9wdC5kYXRhW3Byb3BdKTtcbiAgfVxuICBkYXRhID0gZGF0YS5qb2luKCcmJyk7XG4gIC8vIGFwcGVuZCB1bmlxdWUgaWQgZm9yIGNhY2hlXG4gIGlmIChvcHQubm9DYWNoZSkge1xuICAgIGRhdGEgKz0gKGRhdGEuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gIH1cbiAgLy8gY3JlYXRlIHNvdXJjZSB1cmxcbiAgdmFyIHNyYyA9IG9wdC51cmwgK1xuICAgIChvcHQudXJsLmluZGV4T2YoJz8nKSA+IC0xID8gJyYnIDogJz8nKSArXG4gICAgb3B0LmNhbGxiYWNrS2V5ICsgJz1QaGlsb0dMIElPLkpTT05QLnJlcXVlc3RzLnJlcXVlc3RfJyArIGluZGV4ICtcbiAgICAoZGF0YS5sZW5ndGggPiAwID8gJyYnICsgZGF0YSA6ICcnKTtcblxuICAvLyBjcmVhdGUgc2NyaXB0XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgc2NyaXB0LnNyYyA9IHNyYztcblxuICAvLyBjcmVhdGUgY2FsbGJhY2tcbiAgSlNPTlAucmVxdWVzdHNbJ3JlcXVlc3RfJyArIGluZGV4XSA9IGZ1bmN0aW9uKGpzb24pIHtcbiAgICBvcHQub25Db21wbGV0ZShqc29uKTtcbiAgICAvLyByZW1vdmUgc2NyaXB0XG4gICAgaWYgKHNjcmlwdC5wYXJlbnROb2RlKSB7XG4gICAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgIH1cbiAgICBpZiAoc2NyaXB0LmNsZWFyQXR0cmlidXRlcykge1xuICAgICAgc2NyaXB0LmNsZWFyQXR0cmlidXRlcygpO1xuICAgIH1cbiAgfTtcblxuICAvLyBpbmplY3Qgc2NyaXB0XG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbn1cblxuSlNPTlAuY291bnRlciA9IDA7XG5KU09OUC5yZXF1ZXN0cyA9IHt9O1xuXG4vLyBDcmVhdGVzIGFuIGltYWdlLWxvYWRpbmcgcHJvbWlzZS5cbmZ1bmN0aW9uIGxvYWRJbWFnZShzcmMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVzb2x2ZShpbWFnZSk7XG4gICAgfTtcbiAgICBpbWFnZS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKGBDb3VsZCBub3QgbG9hZCBpbWFnZSAke3NyY30uYCkpO1xuICAgIH07XG4gICAgaW1hZ2Uuc3JjID0gc3JjO1xuICB9KTtcbn1cblxuLy8gTG9hZCBtdWx0aXBsZSBpbWFnZXMgYXN5bmMuXG4vLyByeWU6IFRPRE8gdGhpcyBuZWVkcyB0byBpbXBsZW1lbnQgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZVxuLy8gICAgICAgICAgIG9yaWdpbmFsIEltYWdlcyBmdW5jdGlvbi5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRJbWFnZXMoc3Jjcykge1xuICBsZXQgaW1hZ2VQcm9taXNlcyA9IHNyY3MubWFwKChzcmMpID0+IGxvYWRJbWFnZShzcmMpKTtcbiAgbGV0IHJlc3VsdHMgPSBbXTtcbiAgZm9yIChjb25zdCBpbWFnZVByb21pc2Ugb2YgaW1hZ2VQcm9taXNlcykge1xuICAgIHJlc3VsdHMucHVzaChhd2FpdCBpbWFnZVByb21pc2UpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyAvLyBMb2FkIG11bHRpcGxlIEltYWdlIGFzc2V0cyBhc3luY1xuLy8gZXhwb3J0IGZ1bmN0aW9uIEltYWdlcyhvcHQpIHtcbi8vICAgb3B0ID0gbWVyZ2Uoe1xuLy8gICAgIHNyYzogW10sXG4vLyAgICAgbm9DYWNoZTogZmFsc2UsXG4vLyAgICAgb25Qcm9ncmVzczogbm9vcCxcbi8vICAgICBvbkNvbXBsZXRlOiBub29wXG4vLyAgIH0sIG9wdCB8fCB7fSk7XG4vL1xuLy8gICBsZXQgY291bnQgPSAwO1xuLy8gICBsZXQgbCA9IG9wdC5zcmMubGVuZ3RoO1xuLy9cbi8vICAgbGV0IGltYWdlcztcbi8vICAgLy8gSW1hZ2Ugb25sb2FkIGhhbmRsZXJcbi8vICAgdmFyIGxvYWQgPSAoKSA9PiB7XG4vLyAgICAgb3B0Lm9uUHJvZ3Jlc3MoTWF0aC5yb3VuZCgrK2NvdW50IC8gbCAqIDEwMCkpO1xuLy8gICAgIGlmIChjb3VudCA9PT0gbCkge1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoaW1hZ2VzKTtcbi8vICAgICB9XG4vLyAgIH07XG4vLyAgIC8vIEltYWdlIGVycm9yIGhhbmRsZXJcbi8vICAgdmFyIGVycm9yID0gKCkgPT4ge1xuLy8gICAgIGlmICgrK2NvdW50ID09PSBsKSB7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZShpbWFnZXMpO1xuLy8gICAgIH1cbi8vICAgfTtcbi8vXG4vLyAgIC8vIHVpZCBmb3IgaW1hZ2Ugc291cmNlc1xuLy8gICBjb25zdCBub0NhY2hlID0gb3B0Lm5vQ2FjaGU7XG4vLyAgIGNvbnN0IHVpZCA9IHVpZCgpO1xuLy8gICBmdW5jdGlvbiBnZXRTdWZmaXgocykge1xuLy8gICAgIHJldHVybiAocy5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQ7XG4vLyAgIH1cbi8vXG4vLyAgIC8vIENyZWF0ZSBpbWFnZSBhcnJheVxuLy8gICBpbWFnZXMgPSBvcHQuc3JjLm1hcCgoc3JjLCBpKSA9PiB7XG4vLyAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICAgaW1nLmluZGV4ID0gaTtcbi8vICAgICBpbWcub25sb2FkID0gbG9hZDtcbi8vICAgICBpbWcub25lcnJvciA9IGVycm9yO1xuLy8gICAgIGltZy5zcmMgPSBzcmMgKyAobm9DYWNoZSA/IGdldFN1ZmZpeChzcmMpIDogJycpO1xuLy8gICAgIHJldHVybiBpbWc7XG4vLyAgIH0pO1xuLy9cbi8vICAgcmV0dXJuIGltYWdlcztcbi8vIH1cblxuLy8gTG9hZCBtdWx0aXBsZSB0ZXh0dXJlcyBmcm9tIGltYWdlc1xuLy8gcnllOiBUT0RPIHRoaXMgbmVlZHMgdG8gaW1wbGVtZW50IGZ1bmN0aW9uYWxpdHkgZnJvbVxuLy8gICAgICAgICAgIHRoZSBvcmlnaW5hbCBsb2FkVGV4dHVyZXMgZnVuY3Rpb24uXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFRleHR1cmVzKGdsLCBvcHQpIHtcbiAgdmFyIGltYWdlcyA9IGF3YWl0IGxvYWRJbWFnZXMob3B0LnNyYyk7XG4gIHZhciB0ZXh0dXJlcyA9IFtdO1xuICBpbWFnZXMuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4gICAgdmFyIHBhcmFtcyA9IEFycmF5LmlzQXJyYXkob3B0LnBhcmFtZXRlcnMpID9cbiAgICAgIG9wdC5wYXJhbWV0ZXJzW2ldIDogb3B0LnBhcmFtZXRlcnM7XG4gICAgcGFyYW1zID0gcGFyYW1zID09PSB1bmRlZmluZWQgPyB7fSA6IHBhcmFtcztcbiAgICB0ZXh0dXJlcy5wdXNoKG5ldyBUZXh0dXJlMkQoZ2wsIG1lcmdlKHtcbiAgICAgIGRhdGE6IGltZ1xuICAgIH0sIHBhcmFtcykpKTtcbiAgfSk7XG4gIHJldHVybiB0ZXh0dXJlcztcbn1cblxuLy8gLy8gTG9hZCBtdWx0aXBsZSB0ZXh0dXJlcyBmcm9tIGltYWdlc1xuLy8gZXhwb3J0IGZ1bmN0aW9uIGxvYWRUZXh0dXJlcyhvcHQgPSB7fSkge1xuLy8gICBvcHQgPSB7XG4vLyAgICAgc3JjOiBbXSxcbi8vICAgICBub0NhY2hlOiBmYWxzZSxcbi8vICAgICBvbkNvbXBsZXRlOiBub29wLFxuLy8gICAgIC4uLm9wdFxuLy8gICB9O1xuLy9cbi8vICAgSW1hZ2VzKHtcbi8vICAgICBzcmM6IG9wdC5zcmMsXG4vLyAgICAgbm9DYWNoZTogb3B0Lm5vQ2FjaGUsXG4vLyAgICAgb25Db21wbGV0ZShpbWFnZXMpIHtcbi8vICAgICAgIHZhciB0ZXh0dXJlcyA9IHt9O1xuLy8gICAgICAgaW1hZ2VzLmZvckVhY2goKGltZywgaSkgPT4ge1xuLy8gICAgICAgICB0ZXh0dXJlc1tvcHQuaWQgJiYgb3B0LmlkW2ldIHx8IG9wdC5zcmMgJiYgb3B0LnNyY1tpXV0gPSBtZXJnZSh7XG4vLyAgICAgICAgICAgZGF0YToge1xuLy8gICAgICAgICAgICAgdmFsdWU6IGltZ1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgfSwgb3B0KTtcbi8vICAgICAgIH0pO1xuLy8gICAgICAgYXBwLnNldFRleHR1cmVzKHRleHR1cmVzKTtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKCk7XG4vLyAgICAgfVxuLy8gICB9KTtcbi8vIH1cbiIsIi8vIERlZmF1bHQgU2hhZGVyc1xudmFyIGdsc2xpZnkgPSByZXF1aXJlKCdnbHNsaWZ5Jyk7XG5cbi8vIFRPRE8gLSBhZG9wdCBnbHNsaWZ5XG5jb25zdCBTaGFkZXJzID0ge1xuICBWZXJ0ZXg6IHtcbiAgICBEZWZhdWx0OiBnbHNsaWZ5KCcuL2RlZmF1bHQtdmVydGV4JylcbiAgfSxcbiAgRnJhZ21lbnQ6IHtcbiAgICBEZWZhdWx0OiBnbHNsaWZ5KCcuL2RlZmF1bHQtZnJhZ21lbnQnKVxuICB9XG59O1xuXG5TaGFkZXJzLnZzID0gU2hhZGVycy5WZXJ0ZXguRGVmYXVsdDtcblNoYWRlcnMuZnMgPSBTaGFkZXJzLkZyYWdtZW50LkRlZmF1bHQ7XG5cbmV4cG9ydCBkZWZhdWx0IFNoYWRlcnM7XG5cbiIsIi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vKipcbiAqIFdyYXBzIHRoZSBhcmd1bWVudCBpbiBhbiBhcnJheSBpZiBpdCBpcyBub3Qgb25lLlxuICogQHBhcmFtIHtvYmplY3R9IGEgLSBUaGUgb2JqZWN0IHRvIHdyYXAuXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxhdChhKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGEpICYmIGEgfHwgW2FdO1xufVxuXG4vKipcbiogUHJvdmlkZXMgYSBzdGFuZGFyZCBub29wIGZ1bmN0aW9uLlxuKiovXG5leHBvcnQgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBfdWlkID0gRGF0ZS5ub3coKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgVUlELlxuICogQHJldHVybiB7bnVtYmVyfSB1aWRcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiB1aWQoKSB7XG4gIHJldHVybiBfdWlkKys7XG59XG5cbi8qKlxuICogTWVyZ2UgbXVsdGlwbGUgb2JqZWN0cyBpbnRvIG9uZS5cbiAqIEBwYXJhbSB7Li4ub2JqZWN0fSBvYmplY3RzIC0gVGhlIG9iamVjdHMgdG8gbWVyZ2UuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKG9iamVjdHMpIHtcbiAgY29uc3QgbWl4ID0ge307XG4gIGZvciAobGV0IGkgPSAwLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IG9iamVjdCA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAob2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUgIT09ICdPYmplY3QnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgY29uc3Qgb3AgPSBvYmplY3Rba2V5XTtcbiAgICAgIGNvbnN0IG1wID0gbWl4W2tleV07XG4gICAgICBpZiAobXAgJiYgb3AuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcgJiZcbiAgICAgICAgbXAuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpIHtcbiAgICAgICAgbWl4W2tleV0gPSBtZXJnZShtcCwgb3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWl4W2tleV0gPSBkZXRhY2gob3ApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWl4O1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBkdXBsaWNhdGluZyBhbiBvYmplY3QuXG4gKiBAcGFyYW0ge29iamVjdH0gZWxlbSAtIFRoZSBvYmplY3QgdG8gcmVjdXJzaXZlbHkgZHVwbGljYXRlLlxuICogQHJldHVybiB7b2JqZWN0fSBvYmplY3RcbiAqKi9cbmZ1bmN0aW9uIGRldGFjaChlbGVtKSB7XG4gIGNvbnN0IHQgPSBlbGVtLmNvbnN0cnVjdG9yLm5hbWU7XG4gIGxldCBhbnM7XG4gIGlmICh0ID09PSAnT2JqZWN0Jykge1xuICAgIGFucyA9IHt9O1xuICAgIGZvciAodmFyIHAgaW4gZWxlbSkge1xuICAgICAgYW5zW3BdID0gZGV0YWNoKGVsZW1bcF0pO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0ID09PSAnQXJyYXknKSB7XG4gICAgYW5zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbGVtLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgYW5zW2ldID0gZGV0YWNoKGVsZW1baV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhbnMgPSBlbGVtO1xuICB9XG5cbiAgcmV0dXJuIGFucztcbn1cblxuLy8gVFlQRUQgQVJSQVlTXG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVkQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLkJZVEVTX1BFUl9FTEVNRU5UO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVR5cGVkQXJyYXkoQXJyYXlUeXBlLCBzb3VyY2VBcnJheSkge1xuICBhc3NlcnQoQXJyYXkuaXNBcnJheShzb3VyY2VBcnJheSkpO1xuICBjb25zdCBhcnJheSA9IG5ldyBBcnJheVR5cGUoc291cmNlQXJyYXkubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VBcnJheS5sZW5ndGg7ICsraSkge1xuICAgIGFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuIiwiLy8gRW5jYXBzdWxhdGVzIGEgV2ViR0xCdWZmZXIgb2JqZWN0XG5cbmltcG9ydCB7Z2V0RXh0ZW5zaW9uLCBnbENoZWNrRXJyb3J9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1ZmZlciB7XG5cbiAgc3RhdGljIGdldERlZmF1bHRPcHRzKGdsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1ZmZlclR5cGU6IGdsLkFSUkFZX0JVRkZFUixcbiAgICAgIHNpemU6IDEsXG4gICAgICBkYXRhVHlwZTogZ2wuRkxPQVQsXG4gICAgICBzdHJpZGU6IDAsXG4gICAgICBvZmZzZXQ6IDAsXG4gICAgICBkcmF3TW9kZTogZ2wuU1RBVElDX0RSQVcsXG4gICAgICBpbnN0YW5jZWQ6IDBcbiAgICB9O1xuICB9XG5cbiAgLypcbiAgICogQGNsYXNzZGVzY1xuICAgKiBTZXQgdXAgYSBnbCBidWZmZXIgb25jZSBhbmQgcmVwZWF0ZWRseSBiaW5kIGFuZCB1bmJpbmQgaXQuXG4gICAqIEhvbGRzIGFuIGF0dHJpYnV0ZSBuYW1lIGFzIGEgY29udmVuaWVuY2UuLi5cbiAgICpcbiAgICogQHBhcmFte30gb3B0cy5kYXRhIC0gbmF0aXZlIGFycmF5XG4gICAqIEBwYXJhbXtzdHJpbmd9IG9wdHMuYXR0cmlidXRlIC0gbmFtZSBvZiBhdHRyaWJ1dGUgZm9yIG1hdGNoaW5nXG4gICAqIEBwYXJhbXt9IG9wdHMuYnVmZmVyVHlwZSAtIGJ1ZmZlciB0eXBlIChjYWxsZWQgXCJ0YXJnZXRcIiBpbiBHTCBkb2NzKVxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBhc3NlcnQoZ2wsICdCdWZmZXIgbmVlZHMgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgQnVmZmVyLmdldERlZmF1bHRPcHRzKGdsKSwgb3B0cyk7XG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHRvZG8gLSByZW1vdmVcbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRlbGV0ZSgpO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgdXBkYXRlKG9wdHMgPSB7fSkge1xuICAgIGFzc2VydChvcHRzLmRhdGEsICdCdWZmZXIgbmVlZHMgZGF0YSBhcmd1bWVudCcpO1xuICAgIHRoaXMuYXR0cmlidXRlID0gb3B0cy5hdHRyaWJ1dGUgfHwgdGhpcy5hdHRyaWJ1dGU7XG4gICAgdGhpcy5idWZmZXJUeXBlID0gb3B0cy5idWZmZXJUeXBlIHx8IHRoaXMuYnVmZmVyVHlwZTtcbiAgICB0aGlzLnNpemUgPSBvcHRzLnNpemUgfHwgdGhpcy5zaXplO1xuICAgIHRoaXMuZGF0YVR5cGUgPSBvcHRzLmRhdGFUeXBlIHx8IHRoaXMuZGF0YVR5cGU7XG4gICAgdGhpcy5zdHJpZGUgPSBvcHRzLnN0cmlkZSB8fCB0aGlzLnN0cmlkZTtcbiAgICB0aGlzLm9mZnNldCA9IG9wdHMub2Zmc2V0IHx8IHRoaXMub2Zmc2V0O1xuICAgIHRoaXMuZHJhd01vZGUgPSBvcHRzLmRyYXdNb2RlIHx8IHRoaXMuZHJhd01vZGU7XG4gICAgdGhpcy5pbnN0YW5jZWQgPSBvcHRzLmluc3RhbmNlZCB8fCB0aGlzLmluc3RhbmNlZDtcblxuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YSB8fCB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmJ1ZmZlckRhdGEodGhpcy5kYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiBVcGRhdGVzIGRhdGEgaW4gdGhlIGJ1ZmZlciAqL1xuICBidWZmZXJEYXRhKGRhdGEpIHtcbiAgICBhc3NlcnQoZGF0YSwgJ0J1ZmZlci5idWZmZXJEYXRhIG5lZWRzIGRhdGEnKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5idWZmZXJUeXBlLCB0aGlzLmRhdGEsIHRoaXMuZHJhd01vZGUpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIC8vIEJpbmQgdGhlIGJ1ZmZlciBzbyB0aGF0IHdlIGNhbiBvcGVyYXRlIG9uIGl0XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIEVuYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFNwZWNpZnkgYnVmZmVyIGZvcm1hdFxuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoXG4gICAgICBsb2NhdGlvbixcbiAgICAgIHRoaXMuc2l6ZSwgdGhpcy5kYXRhVHlwZSwgZmFsc2UsIHRoaXMuc3RyaWRlLCB0aGlzLm9mZnNldFxuICAgICk7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2VkKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZ2wsICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgICAvLyBUaGlzIG1ha2VzIGl0IGFuIGluc3RhbmNlZCBhdHRyaWJ1dGVcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gQ2xlYXIgaW5zdGFuY2VkIGZsYWdcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDApO1xuICAgIH1cbiAgICAvLyBEaXNhYmxlIHRoZSBhdHRyaWJ1dGVcbiAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFVuYmluZCB0aGUgYnVmZmVyIHBlciB3ZWJnbCByZWNvbW1lbmRhdGlvbnNcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiIsIi8vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCByZWxhdGVkIG1ldGhvZHNcbi8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCwgbm8tY29uc29sZSwgbm8tbG9vcC1mdW5jICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgY29uc29sZSAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBDaGVja3MgaWYgV2ViR0wgaXMgZW5hYmxlZCBhbmQgY3JlYXRlcyBhIGNvbnRleHQgZm9yIHVzaW5nIFdlYkdMLlxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdMQ29udGV4dChjYW52YXMsIG9wdCA9IHt9KSB7XG4gIGlmICghaXNCcm93c2VyQ29udGV4dCgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBjcmVhdGUgYSBXZWJHTCBjb250ZXh0IG91dHNpZGUgYSBicm93c2VyIGNvbnRleHQuYCk7XG4gIH1cbiAgY2FudmFzID0gdHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycgP1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcykgOiBjYW52YXM7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmdsY29udGV4dGNyZWF0aW9uZXJyb3InLCBlID0+IHtcbiAgICBjb25zb2xlLmxvZyhlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgfSwgZmFsc2UpO1xuXG4gIC8vIFByZWZlciB3ZWJnbDIgb3ZlciB3ZWJnbDEsIHByZWZlciBjb25mb3JtYW50IG92ZXIgZXhwZXJpbWVudGFsXG4gIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbDInLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBvcHQpO1xuXG4gIGFzc2VydChnbCwgJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG5cbiAgLy8gU2V0IGFzIGRlYnVnIGhhbmRsZXJcbiAgZ2wgPSBvcHQuZGVidWcgPyBjcmVhdGVEZWJ1Z0NvbnRleHQoZ2wpIDogZ2w7XG5cbiAgLy8gQWRkIGEgc2FmZSBnZXQgbWV0aG9kXG4gIGdsLmdldCA9IGZ1bmN0aW9uIGdsR2V0KG5hbWUpIHtcbiAgICBsZXQgdmFsdWUgPSBuYW1lO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICAgIGFzc2VydCh2YWx1ZSwgYEFjY2Vzc2luZyBnbC4ke25hbWV9YCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICByZXR1cm4gZ2w7XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1dlYkdMKCkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBGZWF0dXJlIHRlc3QgV2ViR0xcbiAgdHJ5IHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICByZXR1cm4gQm9vbGVhbih3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0ICYmXG4gICAgICAoY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpKSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNFeHRlbnNpb24obmFtZSkge1xuICBpZiAoIWhhc1dlYkdMKCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fFxuICAgIGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcbiAgLy8gU2hvdWxkIG1heWJlIGJlIHJldHVybiAhIWNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuICByZXR1cm4gY29udGV4dC5nZXRFeHRlbnNpb24obmFtZSk7XG59XG5cbi8vIFJldHVybnMgdGhlIGV4dGVuc2lvbiBvciB0aHJvd3MgYW4gZXJyb3JcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpIHtcbiAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpO1xuICBhc3NlcnQoZXh0ZW5zaW9uLCBgJHtleHRlbnNpb25OYW1lfSBub3Qgc3VwcG9ydGVkIWApO1xuICByZXR1cm4gZXh0ZW5zaW9uO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJDb250ZXh0KCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lQnVmZmVyfSwgZnVuYykge1xuICBsZXQgc2Npc3NvclRlc3RXYXNFbmFibGVkO1xuICBpZiAoc2Npc3NvclRlc3QpIHtcbiAgICBzY2lzc29yVGVzdFdhc0VuYWJsZWQgPSBnbC5pc0VuYWJsZWQoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBjb25zdCB7eCwgeSwgdywgaH0gPSBzY2lzc29yVGVzdDtcbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIHksIHcsIGgpO1xuICB9XG5cbiAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyIHdlIG5lZWQgdG8gcmVtZW1iZXI/XG4gICAgZnJhbWVCdWZmZXIuYmluZCgpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBmdW5jKGdsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIXNjaXNzb3JUZXN0V2FzRW5hYmxlZCkge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlcj9cbiAgICAgIC8vIFRPRE8gLSBkZWxlZ2F0ZSBcInVuYmluZFwiIHRvIEZyYW1lYnVmZmVyIG9iamVjdD9cbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbENoZWNrRXJyb3IoZ2wpIHtcbiAgLy8gRW5zdXJlIGFsbCBlcnJvcnMgYXJlIGNsZWFyZWRcbiAgbGV0IGVycm9yO1xuICBsZXQgZ2xFcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIHdoaWxlIChnbEVycm9yICE9PSBnbC5OT19FUlJPUikge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSk7XG4gICAgfVxuICAgIGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB9XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSB7XG4gIHN3aXRjaCAoZ2xFcnJvcikge1xuICBjYXNlIGdsLkNPTlRFWFRfTE9TVF9XRUJHTDpcbiAgICAvLyAgSWYgdGhlIFdlYkdMIGNvbnRleHQgaXMgbG9zdCwgdGhpcyBlcnJvciBpcyByZXR1cm5lZCBvbiB0aGVcbiAgICAvLyBmaXJzdCBjYWxsIHRvIGdldEVycm9yLiBBZnRlcndhcmRzIGFuZCB1bnRpbCB0aGUgY29udGV4dCBoYXMgYmVlblxuICAgIC8vIHJlc3RvcmVkLCBpdCByZXR1cm5zIGdsLk5PX0VSUk9SLlxuICAgIHJldHVybiAnV2ViR0wgY29udGV4dCBsb3N0JztcblxuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50JztcblxuICBjYXNlIGdsLklOVkFMSURfVkFMVUU6XG4gICAgLy8gQSBudW1lcmljIGFyZ3VtZW50IGlzIG91dCBvZiByYW5nZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgdmFsdWUnO1xuXG4gIGNhc2UgZ2wuSU5WQUxJRF9PUEVSQVRJT046XG4gICAgLy8gVGhlIHNwZWNpZmllZCBjb21tYW5kIGlzIG5vdCBhbGxvd2VkIGZvciB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLk9VVF9PRl9NRU1PUlk6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgb3V0IG9mIG1lbW9yeSc7XG5cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgcmV0dXJuICdXZWJHTCB1bmtub3duIGVycm9yJztcbiAgfVxufVxuXG4vLyBUT0RPIC0gZG9jdW1lbnQgb3IgcmVtb3ZlXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z0NvbnRleHQoY3R4KSB7XG4gIGNvbnN0IGdsID0ge307XG4gIGZvciAodmFyIG0gaW4gY3R4KSB7XG4gICAgdmFyIGYgPSBjdHhbbV07XG4gICAgaWYgKHR5cGVvZiBmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBnbFttXSA9ICgoaywgdikgPT4ge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBhbnM7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFucyA9IHYuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtrfSAke2V9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgICAgd2hpbGUgKChlcnJvciA9IGN0eC5nZXRFcnJvcigpKSAhPT0gY3R4Lk5PX0VSUk9SKSB7XG4gICAgICAgICAgICBlcnJvclN0YWNrLnB1c2goZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXJyb3JTdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yU3RhY2suam9pbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICB9O1xuICAgICAgfSkobSwgZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsW21dID0gZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2w7XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETyAtIGdlbmVyaWMgZHJhdyBjYWxsXG4vLyBPbmUgb2YgdGhlIGdvb2QgdGhpbmdzIGFib3V0IEdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5nc1xuaW1wb3J0IHtnZXRFeHRlbnNpb259IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge0dMX0lOREVYX1RZUEVTLCBHTF9EUkFXX01PREVTfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQSBnb29kIHRoaW5nIGFib3V0IHdlYkdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5ncyxcbi8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIGRhdGEgaXMgaW5kZXhlZCBhbmQvb3IgaW5zdGFuY2VkLlxuLy8gVGhpcyBmdW5jdGlvbiB1bmlmaWVzIHRob3NlIGludG8gYSBzaW5nbGUgY2FsbCB3aXRoIHNpbXBsZSBwYXJhbWV0ZXJzXG4vLyB0aGF0IGhhdmUgc2FuZSBkZWZhdWx0cy5cbmV4cG9ydCBmdW5jdGlvbiBkcmF3KGdsLCB7XG4gIGRyYXdNb2RlID0gbnVsbCwgdmVydGV4Q291bnQsIG9mZnNldCA9IDAsXG4gIGluZGV4ZWQsIGluZGV4VHlwZSA9IG51bGwsXG4gIGluc3RhbmNlZCA9IGZhbHNlLCBpbnN0YW5jZUNvdW50ID0gMFxufSkge1xuICBkcmF3TW9kZSA9IGRyYXdNb2RlID8gZ2wuZ2V0KGRyYXdNb2RlKSA6IGdsLlRSSUFOR0xFUztcbiAgaW5kZXhUeXBlID0gaW5kZXhUeXBlID8gZ2wuZ2V0KGluZGV4VHlwZSkgOiBnbC5VTlNJR05FRF9TSE9SVDtcblxuICBhc3NlcnQoR0xfRFJBV19NT0RFUyhnbCkuaW5kZXhPZihkcmF3TW9kZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICAvLyBUT0RPIC0gVXNlIHBvbHlmaWxsZWQgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCBpbnN0ZWFkIG9mIEFOR0xFIGV4dGVuc2lvblxuICBpZiAoaW5zdGFuY2VkKSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3RWxlbWVudHNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGluZGV4ZWQpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCk7XG4gIH1cbn1cbiIsIlxuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vdGV4dHVyZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZyYW1lYnVmZmVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGggPyBvcHRzLndpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0ID8gb3B0cy5oZWlnaHQgOiAxO1xuICAgIHRoaXMuZGVwdGggPSBvcHRzLmRlcHRoID09PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0cy5kZXB0aDtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG9wdHMubWluRmlsdGVyIHx8IGdsLk5FQVJFU1Q7XG4gICAgdGhpcy5tYWdGaWx0ZXIgPSBvcHRzLm1hZ0ZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQgfHwgZ2wuUkdCQTtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGUgfHwgZ2wuVU5TSUdORURfQllURTtcbiAgICB0aGlzLmZibyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgdGhpcy5iaW5kKCk7XG5cbiAgICB0aGlzLnRleHR1cmUgPSBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBtaW5GaWx0ZXI6IHRoaXMubWluRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiB0aGlzLm1hZ0ZpbHRlcixcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXRcbiAgICB9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlLnRleHR1cmUsIDBcbiAgICApO1xuXG4gICAgaWYgKHRoaXMuZGVwdGgpIHtcbiAgICAgIHRoaXMuZGVwdGggPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoXG4gICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0XG4gICAgICApO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoXG4gICAgICAgIGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIHRoaXMuZGVwdGhcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuICAgIGlmIChzdGF0dXMgIT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZyYW1lYnVmZmVyIGNyZWF0aW9uIGZhaWxlZC4nKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZibyk7XG4gIH1cblxufVxuIiwiLy8gQ29udGFpbnMgY2xhc3MgYW5kIGZ1bmN0aW9uIHdyYXBwZXJzIGFyb3VuZCBsb3cgbGV2ZWwgd2ViZ2wgb2JqZWN0c1xuLy8gVGhlc2UgY2xhc3NlcyBhcmUgaW50ZW5kZWQgdG8gc3RheSBjbG9zZSB0byB0aGUgV2ViR0wgQVBJIHNlbWFudGljc1xuLy8gYnV0IG1ha2UgaXQgZWFzaWVyIHRvIHVzZS5cbi8vIEhpZ2hlciBsZXZlbCBhYnN0cmFjdGlvbnMgY2FuIGJlIGJ1aWx0IG9uIHRoZXNlIGNsYXNzZXNcbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9jb250ZXh0JztcbmV4cG9ydCAqIGZyb20gJy4vZHJhdyc7XG5leHBvcnQge2RlZmF1bHQgYXMgQnVmZmVyfSBmcm9tICcuL2J1ZmZlcic7XG5leHBvcnQge2RlZmF1bHQgYXMgUHJvZ3JhbX0gZnJvbSAnLi9wcm9ncmFtJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBGcmFtZWJ1ZmZlcn0gZnJvbSAnLi9mYm8nO1xuZXhwb3J0IHtUZXh0dXJlMkQsIFRleHR1cmVDdWJlfSBmcm9tICcuL3RleHR1cmUnO1xuIiwiLy8gQ3JlYXRlcyBwcm9ncmFtcyBvdXQgb2Ygc2hhZGVycyBhbmQgcHJvdmlkZXMgY29udmVuaWVudCBtZXRob2RzIGZvciBsb2FkaW5nXG4vLyBidWZmZXJzIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGNvbnNvbGUgKi9cbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7VmVydGV4U2hhZGVyLCBGcmFnbWVudFNoYWRlcn0gZnJvbSAnLi9zaGFkZXInO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyYW0ge1xuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogSGFuZGxlcyBjcmVhdGlvbiBvZiBwcm9ncmFtcywgbWFwcGluZyBvZiBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gZ2wgY29udGV4dFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudnMgLSBWZXJ0ZXggc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5mcyAtIEZyYWdtZW50IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuaWQ9IC0gSWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzLCBmcywgaWQpIHtcbiAgICBhc3NlcnQoZ2wsICdQcm9ncmFtIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuXG4gICAgbGV0IHZzO1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUud2FybignREVQUkVDQVRFRDogTmV3IHVzZTogUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KScpO1xuICAgICAgdnMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cyA9IG9wdHMudnM7XG4gICAgICBmcyA9IG9wdHMuZnM7XG4gICAgICBpZCA9IG9wdHMuaWQ7XG4gICAgfVxuXG4gICAgdnMgPSB2cyB8fCBTaGFkZXJzLlZlcnRleC5EZWZhdWx0O1xuICAgIGZzID0gZnMgfHwgU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBWZXJ0ZXhTaGFkZXIoZ2wsIHZzKS5oYW5kbGUpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgRnJhZ21lbnRTaGFkZXIoZ2wsIGZzKS5oYW5kbGUpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGNvbnN0IGxpbmtlZCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgIGlmICghbGlua2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGxpbmtpbmcgJHtnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gcHJlcGFyZSB1bmlmb3JtIHNldHRlcnNcbiAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzID0gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIG5vIGF0dHJpYnV0ZXMgZW5hYmxlZCB5ZXRcbiAgICB0aGlzLmF0dHJpYnV0ZUVuYWJsZWQgPSB7fTtcbiAgfVxuXG4gIHVzZSgpIHtcbiAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmUodGV4dHVyZSwgaW5kZXgpIHtcbiAgICB0ZXh0dXJlLmJpbmQoaW5kZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybShuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXModW5pZm9ybU1hcCkpIHtcbiAgICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh1bmlmb3JtTWFwW25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyLmF0dHJpYnV0ZV07XG4gICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChidWZmZXIuYXR0cmlidXRlID09PSAndmVydGljZXMnKSB7XG4gICAgICAgIGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnMucG9zaXRpb247XG4gICAgICB9IGVsc2UgaWYgKGJ1ZmZlci5hdHRyaWJ1dGUgPT09ICdjb2xvcnMnKSB7XG4gICAgICAgIGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnMuY29sb3I7XG4gICAgICB9IGVsc2UgaWYgKGJ1ZmZlci5hdHRyaWJ1dGUgPT09ICdub3JtYWxzJykge1xuICAgICAgICBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zLm5vcm1hbDtcbiAgICAgIH0gZWxzZSBpZiAoYnVmZmVyLmF0dHJpYnV0ZSA9PT0gJ3RleENvb3JkcycpIHtcbiAgICAgICAgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucy50ZXhDb29yZDE7XG4gICAgICB9XG4gICAgfVxuICAgIGJ1ZmZlci5hdHRhY2hUb0xvY2F0aW9uKGxvY2F0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEJ1ZmZlcnMoYnVmZmVycykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpLCAnUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgYXJyYXknKTtcbiAgICBidWZmZXJzID0gYnVmZmVycy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShidWZmZXJzWzBdKSA/XG4gICAgICBidWZmZXJzWzBdIDogYnVmZmVycztcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBidWZmZXJzKSB7XG4gICAgICB0aGlzLnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0QnVmZmVyKGJ1ZmZlcikge1xuICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyLmF0dHJpYnV0ZV07XG4gICAgYnVmZmVyLmRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcnMoYnVmZmVycykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpLCAnUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgYXJyYXknKTtcbiAgICBidWZmZXJzID0gYnVmZmVycy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShidWZmZXJzWzBdKSA/XG4gICAgICBidWZmZXJzWzBdIDogYnVmZmVycztcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBidWZmZXJzKSB7XG4gICAgICB0aGlzLnVuc2V0QnVmZmVyKGJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuLy8gVE9ETyAtIHVzZSB0YWJsZXMgdG8gcmVkdWNlIGNvbXBsZXhpdHkgb2YgbWV0aG9kIGJlbG93XG4vLyBjb25zdCBnbFVuaWZvcm1TZXR0ZXIgPSB7XG4vLyAgIEZMT0FUOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgRkxPQVRfVkVDMzoge2Z1bmN0aW9uOiAndW5pZm9ybTNmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX01BVDQ6IHtmdW5jdGlvbjogJ3VuaWZvcm1NYXRyaXg0ZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBJTlQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIEJPT0w6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIFNBTVBMRVJfMkQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIFNBTVBMRVJfQ1VCRToge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fVxuLy8gfTtcblxuLy8gUmV0dXJucyBhIE1hZ2ljIFVuaWZvcm0gU2V0dGVyXG5mdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVyKGdsLCBnbFByb2dyYW0sIGluZm8sIGlzQXJyYXkpIHtcbiAgY29uc3Qge25hbWUsIHR5cGV9ID0gaW5mbztcbiAgY29uc3QgbG9jID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKGdsUHJvZ3JhbSwgbmFtZSk7XG5cbiAgbGV0IG1hdHJpeCA9IGZhbHNlO1xuICBsZXQgdmVjdG9yID0gdHJ1ZTtcbiAgbGV0IGdsRnVuY3Rpb247XG4gIGxldCBUeXBlZEFycmF5O1xuXG4gIGlmIChpbmZvLnNpemUgPiAxICYmIGlzQXJyYXkpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcblxuICAgIGNhc2UgZ2wuRkxPQVQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBGbG9hdDMyQXJyYXk7XG4gICAgICB2ZWN0b3IgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5GTE9BVF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5GTE9BVF9NQVQ0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXg0ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5JTlQ6XG4gICAgY2FzZSBnbC5CT09MOlxuICAgIGNhc2UgZ2wuU0FNUExFUl8yRDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfQ1VCRTpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWl2O1xuICAgICAgVHlwZWRBcnJheSA9IFVpbnQxNkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuaWZvcm06IFVua25vd24gR0xTTCB0eXBlICcgKyB0eXBlKTtcblxuICAgIH1cbiAgfVxuXG4gIGlmICh2ZWN0b3IpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMjpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMmZ2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTRmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UOiBjYXNlIGdsLkJPT0w6IGNhc2UgZ2wuU0FNUExFUl8yRDogY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMjogY2FzZSBnbC5CT09MX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUMzOiBjYXNlIGdsLkJPT0xfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2l2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSgzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzQ6IGNhc2UgZ2wuQk9PTF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00aXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDQpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQyOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4MmZ2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQzOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4M2Z2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQ0OlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGdsRnVuY3Rpb24gPSBnbEZ1bmN0aW9uLmJpbmQoZ2wpO1xuXG4gIC8vIFNldCBhIHVuaWZvcm0gYXJyYXlcbiAgaWYgKGlzQXJyYXkgJiYgVHlwZWRBcnJheSkge1xuXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgbmV3IFR5cGVkQXJyYXkodmFsKSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAobWF0cml4KSB7XG4gICAgLy8gU2V0IGEgbWF0cml4IHVuaWZvcm1cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBmYWxzZSwgdmFsLnRvRmxvYXQzMkFycmF5KCkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoVHlwZWRBcnJheSkge1xuXG4gICAgLy8gU2V0IGEgdmVjdG9yL3R5cGVkIGFycmF5IHVuaWZvcm1cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIFR5cGVkQXJyYXkuc2V0KHZhbC50b0Zsb2F0MzJBcnJheSA/IHZhbC50b0Zsb2F0MzJBcnJheSgpIDogdmFsKTtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBUeXBlZEFycmF5KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfTtcblxuICB9XG4gIC8vIFNldCBhIHByaW1pdGl2ZS12YWx1ZWQgdW5pZm9ybVxuICByZXR1cm4gdmFsID0+IHtcbiAgICBnbEZ1bmN0aW9uKGxvYywgdmFsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9O1xuXG59XG5cbi8vIGNyZWF0ZSB1bmlmb3JtIHNldHRlcnNcbi8vIE1hcCBvZiB1bmlmb3JtIG5hbWVzIHRvIHNldHRlciBmdW5jdGlvbnNcbmZ1bmN0aW9uIGdldFVuaWZvcm1TZXR0ZXJzKGdsLCBnbFByb2dyYW0pIHtcbiAgY29uc3QgdW5pZm9ybVNldHRlcnMgPSB7fTtcbiAgY29uc3QgbGVuZ3RoID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihnbFByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbmZvID0gZ2wuZ2V0QWN0aXZlVW5pZm9ybShnbFByb2dyYW0sIGkpO1xuICAgIGxldCBuYW1lID0gaW5mby5uYW1lO1xuICAgIC8vIGlmIGFycmF5IG5hbWUgdGhlbiBjbGVhbiB0aGUgYXJyYXkgYnJhY2tldHNcbiAgICBuYW1lID0gbmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnXScgP1xuICAgICAgbmFtZS5zdWJzdHIoMCwgbmFtZS5sZW5ndGggLSAzKSA6IG5hbWU7XG4gICAgdW5pZm9ybVNldHRlcnNbbmFtZV0gPVxuICAgICAgZ2V0VW5pZm9ybVNldHRlcihnbCwgZ2xQcm9ncmFtLCBpbmZvLCBpbmZvLm5hbWUgIT09IG5hbWUpO1xuICB9XG4gIHJldHVybiB1bmlmb3JtU2V0dGVycztcbn1cblxuLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKG1hcHMgYXR0cmlidXRlIG5hbWUgdG8gaW5kZXgpXG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGVMb2NhdGlvbnMoZ2wsIGdsUHJvZ3JhbSkge1xuICBjb25zdCBsZW5ndGggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpO1xuICBjb25zdCBhdHRyaWJ1dGVMb2NhdGlvbnMgPSB7fTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluZm8gPSBnbC5nZXRBY3RpdmVBdHRyaWIoZ2xQcm9ncmFtLCBpKTtcbiAgICBjb25zdCBpbmRleCA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKGdsUHJvZ3JhbSwgaW5mby5uYW1lKTtcbiAgICBhdHRyaWJ1dGVMb2NhdGlvbnNbaW5mby5uYW1lXSA9IGluZGV4O1xuICB9XG4gIHJldHVybiBhdHRyaWJ1dGVMb2NhdGlvbnM7XG59XG4iLCJpbXBvcnQgZm9ybWF0Q29tcGlsZXJFcnJvciBmcm9tICdnbC1mb3JtYXQtY29tcGlsZXItZXJyb3InO1xuXG4vLyBGb3Igbm93IHRoaXMgaXMgYW4gaW50ZXJuYWwgY2xhc3NcbmV4cG9ydCBjbGFzcyBTaGFkZXIge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXJTb3VyY2UsIHNoYWRlclR5cGUpIHtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSk7XG4gICAgaWYgKHRoaXMuaGFuZGxlID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGNyZWF0aW5nIHNoYWRlciB3aXRoIHR5cGUgJHtzaGFkZXJUeXBlfWApO1xuICAgIH1cbiAgICBnbC5zaGFkZXJTb3VyY2UodGhpcy5oYW5kbGUsIHNoYWRlclNvdXJjZSk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcih0aGlzLmhhbmRsZSk7XG4gICAgdmFyIGNvbXBpbGVkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBnbC5DT01QSUxFX1NUQVRVUyk7XG4gICAgaWYgKCFjb21waWxlZCkge1xuICAgICAgdmFyIGluZm8gPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHRoaXMuaGFuZGxlKTtcbiAgICAgIGdsLmRlbGV0ZVNoYWRlcih0aGlzLmhhbmRsZSk7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2ggKi9cbiAgICAgIHZhciBmb3JtYXR0ZWRMb2c7XG4gICAgICB0cnkge1xuICAgICAgICBmb3JtYXR0ZWRMb2cgPSBmb3JtYXRDb21waWxlckVycm9yKGluZm8sIHNoYWRlclNvdXJjZSwgc2hhZGVyVHlwZSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgICAgIC8qIGdsb2JhbCBjb25zb2xlICovXG4gICAgICAgIGNvbnNvbGUud2FybignRXJyb3IgZm9ybWF0dGluZyBnbHNsIGNvbXBpbGVyIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3Igd2hpbGUgY29tcGlsaW5nIHRoZSBzaGFkZXIgJHtpbmZvfWApO1xuICAgICAgfVxuICAgICAgLyogZXNsaW50LWVuYWJsZSBuby10cnktY2F0Y2ggKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihmb3JtYXR0ZWRMb2cubG9uZyk7XG4gICAgfVxuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFZlcnRleFNoYWRlciBleHRlbmRzIFNoYWRlciB7XG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXJTb3VyY2UpIHtcbiAgICBzdXBlcihnbCwgc2hhZGVyU291cmNlLCBnbC5WRVJURVhfU0hBREVSKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRnJhZ21lbnRTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNoYWRlclNvdXJjZSwgZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgfVxufVxuIiwiaW1wb3J0IHttZXJnZX0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4vY29udGV4dCc7XG5cbmNsYXNzIFRleHR1cmUge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzID0ge30pIHtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy50YXJnZXQgPSBnbC5URVhUVVJFXzJEO1xuXG4gICAgb3B0cyA9IG1lcmdlKHtcbiAgICAgIGZsaXBZOiB0cnVlLFxuICAgICAgYWxpZ25tZW50OiAxLFxuICAgICAgbWFnRmlsdGVyOiBnbC5ORUFSRVNULFxuICAgICAgbWluRmlsdGVyOiBnbC5ORUFSRVNULFxuICAgICAgd3JhcFM6IGdsLkNMQU1QX1RPX0VER0UsXG4gICAgICB3cmFwVDogZ2wuQ0xBTVBfVE9fRURHRSxcbiAgICAgIGZvcm1hdDogZ2wuUkdCQSxcbiAgICAgIHR5cGU6IGdsLlVOU0lHTkVEX0JZVEUsXG4gICAgICBnZW5lcmF0ZU1pcG1hcDogZmFsc2VcbiAgICB9LCBvcHRzKTtcblxuICAgIHRoaXMuZmxpcFkgPSBvcHRzLmZsaXBZO1xuICAgIHRoaXMuYWxpZ25tZW50ID0gb3B0cy5hbGlnbm1lbnQ7XG4gICAgdGhpcy5tYWdGaWx0ZXIgPSBvcHRzLm1hZ0ZpbHRlcjtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG9wdHMubWluRmlsdGVyO1xuICAgIHRoaXMud3JhcFMgPSBvcHRzLndyYXBTO1xuICAgIHRoaXMud3JhcFQgPSBvcHRzLndyYXBUO1xuICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQ7XG4gICAgdGhpcy50eXBlID0gb3B0cy50eXBlO1xuICAgIHRoaXMuZ2VuZXJhdGVNaXBtYXAgPSBvcHRzLmdlbmVyYXRlTWlwbWFwO1xuXG4gICAgaWYgKHRoaXMudHlwZSA9PT0gZ2wuRkxPQVQpIHtcbiAgICAgIHRoaXMuZmxvYXRFeHRlbnNpb24gPSBnbC5nZXRFeHRlbnNpb24oJ09FU190ZXh0dXJlX2Zsb2F0Jyk7XG4gICAgICBpZiAoIXRoaXMuZmxvYXRFeHRlbnNpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPRVNfdGV4dHVyZV9mbG9hdCBpcyBub3Qgc3VwcG9ydGVkLicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICBpZiAoIXRoaXMudGV4dHVyZSkge1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG5cbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnRleHR1cmUpO1xuICAgIHRoaXMudGV4dHVyZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRleHR1cmUyRCBleHRlbmRzIFRleHR1cmUge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgc3VwZXIoZ2wsIG9wdHMpO1xuICAgIG9wdHMuZGF0YSA9IG9wdHMuZGF0YSB8fCBudWxsO1xuXG4gICAgdGhpcy53aWR0aCA9IDA7XG4gICAgdGhpcy5oZWlnaHQgPSAwO1xuICAgIHRoaXMuYm9yZGVyID0gMDtcbiAgICB0aGlzLmRhdGEgPSBudWxsO1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBiaW5kKGluZGV4KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpIC0gZ2wuVEVYVFVSRTA7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgdXBkYXRlKG9wdHMpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRzLmhlaWdodDtcbiAgICB0aGlzLmJvcmRlciA9IG9wdHMuYm9yZGVyIHx8IDA7XG4gICAgdGhpcy5kYXRhID0gb3B0cy5kYXRhO1xuICAgIGlmICh0aGlzLmZsaXBZKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIGZhbHNlKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIHRoaXMuYmluZCgpO1xuICAgIGlmICh0aGlzLndpZHRoIHx8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCxcbiAgICAgICAgdGhpcy5ib3JkZXIsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLFxuICAgICAgICB0aGlzLmRhdGEpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMubWluRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLm1hZ0ZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLndyYXBTKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMud3JhcFQpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKHRoaXMuZ2VuZXJhdGVNaXBtYXApIHtcbiAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlQ3ViZSBleHRlbmRzIFRleHR1cmUge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgc3VwZXIoZ2wsIG9wdHMpO1xuICAgIG9wdHMuZGF0YSA9IG9wdHMuZGF0YSB8fCBudWxsO1xuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgYmluZChpbmRleCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIHRoaXMudGV4dHVyZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKSAtIGdsLlRFWFRVUkUwO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBtYXgtbGVuICovXG4gIHVwZGF0ZShvcHRzKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQ7XG4gICAgdGhpcy5ib3JkZXIgPSBvcHRzLmJvcmRlciB8fCAwO1xuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YTtcbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5ib3JkZXIsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3MueCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksIDAsIHRoaXMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5ib3JkZXIsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3MueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5ib3JkZXIsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3Mueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5ib3JkZXIsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1ksIDAsIHRoaXMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5ib3JkZXIsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5ib3JkZXIsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3MueCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1ksIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLm1pbkZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5tYWdGaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX1dSQVBfUywgdGhpcy53cmFwUyk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLndyYXBUKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmICh0aGlzLmdlbmVyYXRlTWlwbWFwKSB7XG4gICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFX0NVQkVfTUFQKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH1cblxufVxuIiwiLy8gSGVscGVyIGRlZmluaXRpb25zIGZvciB2YWxpZGF0aW9uIG9mIHdlYmdsIHBhcmFtZXRlcnNcbi8qIGVzbGludC1kaXNhYmxlIG5vLWlubGluZS1jb21tZW50cywgbWF4LWxlbiAqL1xuXG4vLyBUT0RPIC0gcmVtb3ZlXG5leHBvcnQge2lzVHlwZWRBcnJheSwgbWFrZVR5cGVkQXJyYXl9IGZyb20gJy4uL3V0aWxzJztcblxuLy8gSU5ERVggVFlQRVNcblxuLy8gRm9yIGRyYXdFbGVtZW50cywgc2l6ZSBvZiBpbmRpY2VzXG5leHBvcnQgY29uc3QgSU5ERVhfVFlQRVMgPSBbJ1VOU0lHTkVEX0JZVEUnLCAnVU5TSUdORURfU0hPUlQnXTtcbmV4cG9ydCBjb25zdCBHTF9JTkRFWF9UWVBFUyA9IGdsID0+IElOREVYX1RZUEVTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNJbmRleFR5cGUodHlwZSkge1xuICByZXR1cm4gSU5ERVhfVFlQRVMuaW5kZXhPZih0eXBlKSAhPT0gLTE7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNHTEluZGV4VHlwZShnbFR5cGUpIHtcbiAgcmV0dXJuIEdMX0lOREVYX1RZUEVTLmluZGV4T2YoZ2xUeXBlKSAhPT0gLTE7XG59XG5cbi8vIERSQVcgTU9ERVNcblxuZXhwb3J0IGNvbnN0IERSQVdfTU9ERVMgPSBbXG4gICdQT0lOVFMnLCAnTElORV9TVFJJUCcsICdMSU5FX0xPT1AnLCAnTElORVMnLFxuICAnVFJJQU5HTEVfU1RSSVAnLCAnVFJJQU5HTEVfRkFOJywgJ1RSSUFOR0xFUydcbl07XG5leHBvcnQgY29uc3QgR0xfRFJBV19NT0RFUyA9IGdsID0+IERSQVdfTU9ERVMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RyYXdNb2RlKG1vZGUpIHtcbiAgcmV0dXJuIERSQVdfTU9ERVMuaW5kZXhPZihtb2RlKSAhPT0gLTE7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNHTERyYXdNb2RlKGdsTW9kZSkge1xuICByZXR1cm4gR0xfRFJBV19NT0RFUy5pbmRleE9mKGdsTW9kZSkgIT09IC0xO1xufVxuXG4vLyBUQVJHRVQgVFlQRVNcblxuZXhwb3J0IGNvbnN0IFRBUkdFVFMgPSBbXG4gICdBUlJBWV9CVUZGRVInLCAvLyB2ZXJ0ZXggYXR0cmlidXRlcyAoZS5nLiB2ZXJ0ZXgvdGV4dHVyZSBjb29yZHMgb3IgY29sb3IpXG4gICdFTEVNRU5UX0FSUkFZX0JVRkZFUicsIC8vIEJ1ZmZlciB1c2VkIGZvciBlbGVtZW50IGluZGljZXMuXG4gIC8vIEZvciBXZWJHTCAyIGNvbnRleHRzXG4gICdDT1BZX1JFQURfQlVGRkVSJywgLy8gQnVmZmVyIGZvciBjb3B5aW5nIGZyb20gb25lIGJ1ZmZlciBvYmplY3QgdG8gYW5vdGhlclxuICAnQ09QWV9XUklURV9CVUZGRVInLCAvLyBCdWZmZXIgZm9yIGNvcHlpbmcgZnJvbSBvbmUgYnVmZmVyIG9iamVjdCB0byBhbm90aGVyXG4gICdUUkFOU0ZPUk1fRkVFREJBQ0tfQlVGRkVSJywgLy8gQnVmZmVyIGZvciB0cmFuc2Zvcm0gZmVlZGJhY2sgb3BlcmF0aW9uc1xuICAnVU5JRk9STV9CVUZGRVInLCAvLyBCdWZmZXIgdXNlZCBmb3Igc3RvcmluZyB1bmlmb3JtIGJsb2Nrc1xuICAnUElYRUxfUEFDS19CVUZGRVInLCAvLyBCdWZmZXIgdXNlZCBmb3IgcGl4ZWwgdHJhbnNmZXIgb3BlcmF0aW9uc1xuICAnUElYRUxfVU5QQUNLX0JVRkZFUicgLy8gQnVmZmVyIHVzZWQgZm9yIHBpeGVsIHRyYW5zZmVyIG9wZXJhdGlvbnNcbl07XG5cbmV4cG9ydCBjb25zdCBHTF9UQVJHRVRTID1cbiAgZ2wgPT4gVEFSR0VUUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKS5maWx0ZXIoY29uc3RhbnQgPT4gY29uc3RhbnQpO1xuXG4vLyBVU0FHRSBUWVBFU1xuXG5leHBvcnQgY29uc3QgQlVGRkVSX1VTQUdFID0gW1xuICAnU1RBVElDX0RSQVcnLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIHdyaXR0ZW4gdG8gdGhlIGJ1ZmZlciwgYnV0IG5vdCByZWFkLlxuICAnRFlOQU1JQ19EUkFXJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIHdyaXR0ZW4gdG8gdGhlIGJ1ZmZlciwgYnV0IG5vdCByZWFkLlxuICAnU1RSRUFNX0RSQVcnLCAvLyBCdWZmZXIgbm90IHVzZWQgb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgLy8gRm9yIFdlYkdMIDIgY29udGV4dHNcbiAgJ1NUQVRJQ19SRUFEJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnRFlOQU1JQ19SRUFEJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIHJlYWQgZnJvbSB0aGUgYnVmZmVyLCBidXQgbm90IHdyaXR0ZW4uXG4gICdTVFJFQU1fUkVBRCcsIC8vIENvbnRlbnRzIG9mIHRoZSBidWZmZXIgYXJlIGxpa2VseSB0byBub3QgYmUgdXNlZCBvZnRlbi4gQ29udGVudHMgYXJlIHJlYWQgZnJvbSB0aGUgYnVmZmVyLCBidXQgbm90IHdyaXR0ZW4uXG4gICdTVEFUSUNfQ09QWScsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgbmVpdGhlciB3cml0dGVuIG9yIHJlYWQgYnkgdGhlIHVzZXIuXG4gICdEWU5BTUlDX0NPUFknLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgbmVpdGhlciB3cml0dGVuIG9yIHJlYWQgYnkgdGhlIHVzZXIuXG4gICdTVFJFQU1fQ09QWScgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSBuZWl0aGVyIHdyaXR0ZW4gb3IgcmVhZCBieSB0aGUgdXNlci5cbl07XG5cbmV4cG9ydCBjb25zdCBHTF9CVUZGRVJfVVNBR0UgPVxuICBnbCA9PiBCVUZGRVJfVVNBR0UubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSkuZmlsdGVyKGNvbnN0YW50ID0+IGNvbnN0YW50KTtcbiJdfQ==
