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
  console.log(array);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWRkLWxpbmUtbnVtYmVycy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2F0b2ItbGl0ZS9hdG9iLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy10by1ibG9iL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZpbGVzYXZlci5qcy9GaWxlU2F2ZXIuanMiLCJub2RlX21vZHVsZXMvZ2wtY29uc3RhbnRzLzEuMC9udW1iZXJzLmpzIiwibm9kZV9tb2R1bGVzL2dsLWNvbnN0YW50cy9sb29rdXAuanMiLCJub2RlX21vZHVsZXMvZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtc2hhZGVyLW5hbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL2J1aWx0aW5zLTMwMGVzLmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9idWlsdGlucy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsLXRva2VuaXplci9saWIvbGl0ZXJhbHMtMzAwZXMuanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvbGliL2xpdGVyYWxzLmpzIiwibm9kZV9tb2R1bGVzL2dsc2wtdG9rZW5pemVyL2xpYi9vcGVyYXRvcnMuanMiLCJub2RlX21vZHVsZXMvZ2xzbC10b2tlbml6ZXIvc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcGFkLWxlZnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVwZWF0LXN0cmluZy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zcHJpbnRmLWpzL3NyYy9zcHJpbnRmLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwic3JjL2FkZG9ucy9meC5qcyIsInNyYy9hZGRvbnMvaGVscGVycy5qcyIsInNyYy9hZGRvbnMvaW5kZXguanMiLCJzcmMvYWRkb25zL3NhdmUtYml0bWFwLmpzIiwic3JjL2FkZG9ucy93b3JrZXJzLmpzIiwic3JjL2lvLmpzIiwic3JjL3NoYWRlcnMvaW5kZXguanMiLCJzcmMvdXRpbHMuanMiLCJzcmMvd2ViZ2wvYnVmZmVyLmpzIiwic3JjL3dlYmdsL2NvbnRleHQuanMiLCJzcmMvd2ViZ2wvZHJhdy5qcyIsInNyYy93ZWJnbC9mYm8uanMiLCJzcmMvd2ViZ2wvaW5kZXguanMiLCJzcmMvd2ViZ2wvcHJvZ3JhbS5qcyIsInNyYy93ZWJnbC9zaGFkZXIuanMiLCJzcmMvd2ViZ2wvdGV4dHVyZS5qcyIsInNyYy93ZWJnbC90eXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2V0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBVjBCLENBQWY7O0FBYU4sSUFBTSw0Q0FDWCxTQURXLGVBQ1g7U0FBTSxhQUFhLEdBQWIsQ0FBaUI7V0FBWSxHQUFHLFFBQUg7R0FBWixDQUFqQixDQUEyQyxNQUEzQyxDQUFrRDtXQUFZO0dBQVo7Q0FBeEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBhZExlZnQgPSByZXF1aXJlKCdwYWQtbGVmdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gYWRkTGluZU51bWJlcnNcbmZ1bmN0aW9uIGFkZExpbmVOdW1iZXJzIChzdHJpbmcsIHN0YXJ0LCBkZWxpbSkge1xuICBzdGFydCA9IHR5cGVvZiBzdGFydCA9PT0gJ251bWJlcicgPyBzdGFydCA6IDFcbiAgZGVsaW0gPSBkZWxpbSB8fCAnOiAnXG5cbiAgdmFyIGxpbmVzID0gc3RyaW5nLnNwbGl0KC9cXHI/XFxuLylcbiAgdmFyIHRvdGFsRGlnaXRzID0gU3RyaW5nKGxpbmVzLmxlbmd0aCArIHN0YXJ0IC0gMSkubGVuZ3RoXG4gIHJldHVybiBsaW5lcy5tYXAoZnVuY3Rpb24gKGxpbmUsIGkpIHtcbiAgICB2YXIgYyA9IGkgKyBzdGFydFxuICAgIHZhciBkaWdpdHMgPSBTdHJpbmcoYykubGVuZ3RoXG4gICAgdmFyIHByZWZpeCA9IHBhZExlZnQoYywgdG90YWxEaWdpdHMgLSBkaWdpdHMpXG4gICAgcmV0dXJuIHByZWZpeCArIGRlbGltICsgbGluZVxuICB9KS5qb2luKCdcXG4nKVxufVxuIiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgIWlzRmluaXRlKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSkge1xuICAgIHJldHVybiBhID09PSBiO1xuICB9XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSksXG4gICAgICBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICBrYiA9IG9iamVjdEtleXMoYiksXG4gICAgICBrZXksIGk7XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2F0b2Ioc3RyKSB7XG4gIHJldHVybiBhdG9iKHN0cilcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodXJpKSB7XG4gICAgdmFyIG1pbWUgICA9IHVyaS5zcGxpdCgnLCcpWzBdLnNwbGl0KCc6JylbMV0uc3BsaXQoJzsnKVswXTtcbiAgICB2YXIgYnl0ZXMgID0gYXRvYih1cmkuc3BsaXQoJywnKVsxXSk7XG4gICAgdmFyIGxlbiAgICA9IGJ5dGVzLmxlbmd0aDtcbiAgICB2YXIgYnVmZmVyID0gbmV3IHdpbmRvdy5BcnJheUJ1ZmZlcihsZW4pO1xuICAgIHZhciBhcnIgICAgPSBuZXcgd2luZG93LlVpbnQ4QXJyYXkoYnVmZmVyKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgYXJyW2ldID0gYnl0ZXMuY2hhckNvZGVBdChpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEJsb2IoW2Fycl0sIHsgdHlwZTogbWltZSB9KTtcbn1cblxuLy8gSUUgPj0gMTAsIG1vc3QgbW9kZXJuIGJyb3dzZXJzXG4vLyBUaGUgQmxvYiB0eXBlIGNhbid0IGJlIHBvbHlmaWxsZWQsIHdoaWNoIGlzIHdoeSB0aGVyZSBhcmVuJ3QgYW55IHBvbHlmaWxscyBmb3IgVHlwZWRBcnJheXMgZm9yIG9sZGVyIElFJ3Ncbm1vZHVsZS5leHBvcnRzLnN1cHBvcnRlZCA9IChcbiAgICB0eXBlb2Ygd2luZG93LkhUTUxDYW52YXNFbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuYXRvYiAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2Ygd2luZG93LkJsb2IgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIHdpbmRvdy5BcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2Ygd2luZG93LlVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnXG4pO1xuXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghbW9kdWxlLmV4cG9ydHMuc3VwcG9ydGVkKSByZXR1cm47XG4gICAgdmFyIENhbnZhc1Byb3RvdHlwZSA9IHdpbmRvdy5IVE1MQ2FudmFzRWxlbWVudC5wcm90b3R5cGU7XG4gICAgXG4gICAgaWYgKCFDYW52YXNQcm90b3R5cGUudG9CbG9iICYmIENhbnZhc1Byb3RvdHlwZS50b0RhdGFVUkwpIHtcbiAgICAgICAgQ2FudmFzUHJvdG90eXBlLnRvQmxvYiA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdHlwZSwgcXVhbGl0eSkge1xuICAgICAgICAgICAgY2FsbGJhY2sobW9kdWxlLmV4cG9ydHModGhpcy50b0RhdGFVUkwodHlwZSwgcXVhbGl0eSkpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8qIEZpbGVTYXZlci5qc1xuICogQSBzYXZlQXMoKSBGaWxlU2F2ZXIgaW1wbGVtZW50YXRpb24uXG4gKiAxLjEuMjAxNTA3MTZcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBYMTEvTUlUXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9GaWxlU2F2ZXIuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYgKi9cbi8qanNsaW50IGJpdHdpc2U6IHRydWUsIGluZGVudDogNCwgbGF4YnJlYWs6IHRydWUsIGxheGNvbW1hOiB0cnVlLCBzbWFydHRhYnM6IHRydWUsIHBsdXNwbHVzOiB0cnVlICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9GaWxlU2F2ZXIuanMvYmxvYi9tYXN0ZXIvRmlsZVNhdmVyLmpzICovXG5cbnZhciBzYXZlQXMgPSBzYXZlQXMgfHwgKGZ1bmN0aW9uKHZpZXcpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cdC8vIElFIDwxMCBpcyBleHBsaWNpdGx5IHVuc3VwcG9ydGVkXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmIC9NU0lFIFsxLTldXFwuLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhclxuXHRcdCAgZG9jID0gdmlldy5kb2N1bWVudFxuXHRcdCAgLy8gb25seSBnZXQgVVJMIHdoZW4gbmVjZXNzYXJ5IGluIGNhc2UgQmxvYi5qcyBoYXNuJ3Qgb3ZlcnJpZGRlbiBpdCB5ZXRcblx0XHQsIGdldF9VUkwgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB2aWV3LlVSTCB8fCB2aWV3LndlYmtpdFVSTCB8fCB2aWV3O1xuXHRcdH1cblx0XHQsIHNhdmVfbGluayA9IGRvYy5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCIsIFwiYVwiKVxuXHRcdCwgY2FuX3VzZV9zYXZlX2xpbmsgPSBcImRvd25sb2FkXCIgaW4gc2F2ZV9saW5rXG5cdFx0LCBjbGljayA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHZhciBldmVudCA9IG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIik7XG5cdFx0XHRub2RlLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuXHRcdH1cblx0XHQsIHdlYmtpdF9yZXFfZnMgPSB2aWV3LndlYmtpdFJlcXVlc3RGaWxlU3lzdGVtXG5cdFx0LCByZXFfZnMgPSB2aWV3LnJlcXVlc3RGaWxlU3lzdGVtIHx8IHdlYmtpdF9yZXFfZnMgfHwgdmlldy5tb3pSZXF1ZXN0RmlsZVN5c3RlbVxuXHRcdCwgdGhyb3dfb3V0c2lkZSA9IGZ1bmN0aW9uKGV4KSB7XG5cdFx0XHQodmlldy5zZXRJbW1lZGlhdGUgfHwgdmlldy5zZXRUaW1lb3V0KShmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhyb3cgZXg7XG5cdFx0XHR9LCAwKTtcblx0XHR9XG5cdFx0LCBmb3JjZV9zYXZlYWJsZV90eXBlID0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIlxuXHRcdCwgZnNfbWluX3NpemUgPSAwXG5cdFx0Ly8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNzUyOTcjYzcgYW5kXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvRmlsZVNhdmVyLmpzL2NvbW1pdC80ODU5MzBhI2NvbW1pdGNvbW1lbnQtODc2ODA0N1xuXHRcdC8vIGZvciB0aGUgcmVhc29uaW5nIGJlaGluZCB0aGUgdGltZW91dCBhbmQgcmV2b2NhdGlvbiBmbG93XG5cdFx0LCBhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQgPSA1MDAgLy8gaW4gbXNcblx0XHQsIHJldm9rZSA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHZhciByZXZva2VyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsZSA9PT0gXCJzdHJpbmdcIikgeyAvLyBmaWxlIGlzIGFuIG9iamVjdCBVUkxcblx0XHRcdFx0XHRnZXRfVVJMKCkucmV2b2tlT2JqZWN0VVJMKGZpbGUpO1xuXHRcdFx0XHR9IGVsc2UgeyAvLyBmaWxlIGlzIGEgRmlsZVxuXHRcdFx0XHRcdGZpbGUucmVtb3ZlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRpZiAodmlldy5jaHJvbWUpIHtcblx0XHRcdFx0cmV2b2tlcigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2V0VGltZW91dChyZXZva2VyLCBhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQsIGRpc3BhdGNoID0gZnVuY3Rpb24oZmlsZXNhdmVyLCBldmVudF90eXBlcywgZXZlbnQpIHtcblx0XHRcdGV2ZW50X3R5cGVzID0gW10uY29uY2F0KGV2ZW50X3R5cGVzKTtcblx0XHRcdHZhciBpID0gZXZlbnRfdHlwZXMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHR2YXIgbGlzdGVuZXIgPSBmaWxlc2F2ZXJbXCJvblwiICsgZXZlbnRfdHlwZXNbaV1dO1xuXHRcdFx0XHRpZiAodHlwZW9mIGxpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0bGlzdGVuZXIuY2FsbChmaWxlc2F2ZXIsIGV2ZW50IHx8IGZpbGVzYXZlcik7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXgpIHtcblx0XHRcdFx0XHRcdHRocm93X291dHNpZGUoZXgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHQsIGF1dG9fYm9tID0gZnVuY3Rpb24oYmxvYikge1xuXHRcdFx0Ly8gcHJlcGVuZCBCT00gZm9yIFVURi04IFhNTCBhbmQgdGV4dC8qIHR5cGVzIChpbmNsdWRpbmcgSFRNTClcblx0XHRcdGlmICgvXlxccyooPzp0ZXh0XFwvXFxTKnxhcHBsaWNhdGlvblxcL3htbHxcXFMqXFwvXFxTKlxcK3htbClcXHMqOy4qY2hhcnNldFxccyo9XFxzKnV0Zi04L2kudGVzdChibG9iLnR5cGUpKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgQmxvYihbXCJcXHVmZWZmXCIsIGJsb2JdLCB7dHlwZTogYmxvYi50eXBlfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYmxvYjtcblx0XHR9XG5cdFx0LCBGaWxlU2F2ZXIgPSBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0aWYgKCFub19hdXRvX2JvbSkge1xuXHRcdFx0XHRibG9iID0gYXV0b19ib20oYmxvYik7XG5cdFx0XHR9XG5cdFx0XHQvLyBGaXJzdCB0cnkgYS5kb3dubG9hZCwgdGhlbiB3ZWIgZmlsZXN5c3RlbSwgdGhlbiBvYmplY3QgVVJMc1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgZmlsZXNhdmVyID0gdGhpc1xuXHRcdFx0XHQsIHR5cGUgPSBibG9iLnR5cGVcblx0XHRcdFx0LCBibG9iX2NoYW5nZWQgPSBmYWxzZVxuXHRcdFx0XHQsIG9iamVjdF91cmxcblx0XHRcdFx0LCB0YXJnZXRfdmlld1xuXHRcdFx0XHQsIGRpc3BhdGNoX2FsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGRpc3BhdGNoKGZpbGVzYXZlciwgXCJ3cml0ZXN0YXJ0IHByb2dyZXNzIHdyaXRlIHdyaXRlZW5kXCIuc3BsaXQoXCIgXCIpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBvbiBhbnkgZmlsZXN5cyBlcnJvcnMgcmV2ZXJ0IHRvIHNhdmluZyB3aXRoIG9iamVjdCBVUkxzXG5cdFx0XHRcdCwgZnNfZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvLyBkb24ndCBjcmVhdGUgbW9yZSBvYmplY3QgVVJMcyB0aGFuIG5lZWRlZFxuXHRcdFx0XHRcdGlmIChibG9iX2NoYW5nZWQgfHwgIW9iamVjdF91cmwpIHtcblx0XHRcdFx0XHRcdG9iamVjdF91cmwgPSBnZXRfVVJMKCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodGFyZ2V0X3ZpZXcpIHtcblx0XHRcdFx0XHRcdHRhcmdldF92aWV3LmxvY2F0aW9uLmhyZWYgPSBvYmplY3RfdXJsO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgbmV3X3RhYiA9IHZpZXcub3BlbihvYmplY3RfdXJsLCBcIl9ibGFua1wiKTtcblx0XHRcdFx0XHRcdGlmIChuZXdfdGFiID09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygc2FmYXJpICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRcdFx0XHRcdC8vQXBwbGUgZG8gbm90IGFsbG93IHdpbmRvdy5vcGVuLCBzZWUgaHR0cDovL2JpdC5seS8xa1pmZlJJXG5cdFx0XHRcdFx0XHRcdHZpZXcubG9jYXRpb24uaHJlZiA9IG9iamVjdF91cmxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0XHRkaXNwYXRjaF9hbGwoKTtcblx0XHRcdFx0XHRyZXZva2Uob2JqZWN0X3VybCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0LCBhYm9ydGFibGUgPSBmdW5jdGlvbihmdW5jKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0aWYgKGZpbGVzYXZlci5yZWFkeVN0YXRlICE9PSBmaWxlc2F2ZXIuRE9ORSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdFx0LCBjcmVhdGVfaWZfbm90X2ZvdW5kID0ge2NyZWF0ZTogdHJ1ZSwgZXhjbHVzaXZlOiBmYWxzZX1cblx0XHRcdFx0LCBzbGljZVxuXHRcdFx0O1xuXHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuSU5JVDtcblx0XHRcdGlmICghbmFtZSkge1xuXHRcdFx0XHRuYW1lID0gXCJkb3dubG9hZFwiO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGNhbl91c2Vfc2F2ZV9saW5rKSB7XG5cdFx0XHRcdG9iamVjdF91cmwgPSBnZXRfVVJMKCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHRcdFx0XHRzYXZlX2xpbmsuaHJlZiA9IG9iamVjdF91cmw7XG5cdFx0XHRcdHNhdmVfbGluay5kb3dubG9hZCA9IG5hbWU7XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Y2xpY2soc2F2ZV9saW5rKTtcblx0XHRcdFx0XHRkaXNwYXRjaF9hbGwoKTtcblx0XHRcdFx0XHRyZXZva2Uob2JqZWN0X3VybCk7XG5cdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdC8vIE9iamVjdCBhbmQgd2ViIGZpbGVzeXN0ZW0gVVJMcyBoYXZlIGEgcHJvYmxlbSBzYXZpbmcgaW4gR29vZ2xlIENocm9tZSB3aGVuXG5cdFx0XHQvLyB2aWV3ZWQgaW4gYSB0YWIsIHNvIEkgZm9yY2Ugc2F2ZSB3aXRoIGFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVxuXHRcdFx0Ly8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9OTExNThcblx0XHRcdC8vIFVwZGF0ZTogR29vZ2xlIGVycmFudGx5IGNsb3NlZCA5MTE1OCwgSSBzdWJtaXR0ZWQgaXQgYWdhaW46XG5cdFx0XHQvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9Mzg5NjQyXG5cdFx0XHRpZiAodmlldy5jaHJvbWUgJiYgdHlwZSAmJiB0eXBlICE9PSBmb3JjZV9zYXZlYWJsZV90eXBlKSB7XG5cdFx0XHRcdHNsaWNlID0gYmxvYi5zbGljZSB8fCBibG9iLndlYmtpdFNsaWNlO1xuXHRcdFx0XHRibG9iID0gc2xpY2UuY2FsbChibG9iLCAwLCBibG9iLnNpemUsIGZvcmNlX3NhdmVhYmxlX3R5cGUpO1xuXHRcdFx0XHRibG9iX2NoYW5nZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0Ly8gU2luY2UgSSBjYW4ndCBiZSBzdXJlIHRoYXQgdGhlIGd1ZXNzZWQgbWVkaWEgdHlwZSB3aWxsIHRyaWdnZXIgYSBkb3dubG9hZFxuXHRcdFx0Ly8gaW4gV2ViS2l0LCBJIGFwcGVuZCAuZG93bmxvYWQgdG8gdGhlIGZpbGVuYW1lLlxuXHRcdFx0Ly8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTY1NDQwXG5cdFx0XHRpZiAod2Via2l0X3JlcV9mcyAmJiBuYW1lICE9PSBcImRvd25sb2FkXCIpIHtcblx0XHRcdFx0bmFtZSArPSBcIi5kb3dubG9hZFwiO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHR5cGUgPT09IGZvcmNlX3NhdmVhYmxlX3R5cGUgfHwgd2Via2l0X3JlcV9mcykge1xuXHRcdFx0XHR0YXJnZXRfdmlldyA9IHZpZXc7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXJlcV9mcykge1xuXHRcdFx0XHRmc19lcnJvcigpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRmc19taW5fc2l6ZSArPSBibG9iLnNpemU7XG5cdFx0XHRyZXFfZnModmlldy5URU1QT1JBUlksIGZzX21pbl9zaXplLCBhYm9ydGFibGUoZnVuY3Rpb24oZnMpIHtcblx0XHRcdFx0ZnMucm9vdC5nZXREaXJlY3RvcnkoXCJzYXZlZFwiLCBjcmVhdGVfaWZfbm90X2ZvdW5kLCBhYm9ydGFibGUoZnVuY3Rpb24oZGlyKSB7XG5cdFx0XHRcdFx0dmFyIHNhdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGRpci5nZXRGaWxlKG5hbWUsIGNyZWF0ZV9pZl9ub3RfZm91bmQsIGFib3J0YWJsZShmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdFx0XHRcdGZpbGUuY3JlYXRlV3JpdGVyKGFib3J0YWJsZShmdW5jdGlvbih3cml0ZXIpIHtcblx0XHRcdFx0XHRcdFx0XHR3cml0ZXIub253cml0ZWVuZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0YXJnZXRfdmlldy5sb2NhdGlvbi5ocmVmID0gZmlsZS50b1VSTCgpO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0XHRcdFx0XHRcdGRpc3BhdGNoKGZpbGVzYXZlciwgXCJ3cml0ZWVuZFwiLCBldmVudCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXZva2UoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHR3cml0ZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIGVycm9yID0gd3JpdGVyLmVycm9yO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGVycm9yLmNvZGUgIT09IGVycm9yLkFCT1JUX0VSUikge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRmc19lcnJvcigpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XCJ3cml0ZXN0YXJ0IHByb2dyZXNzIHdyaXRlIGFib3J0XCIuc3BsaXQoXCIgXCIpLmZvckVhY2goZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHdyaXRlcltcIm9uXCIgKyBldmVudF0gPSBmaWxlc2F2ZXJbXCJvblwiICsgZXZlbnRdO1xuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlci53cml0ZShibG9iKTtcblx0XHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIuYWJvcnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHdyaXRlci5hYm9ydCgpO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLldSSVRJTkc7XG5cdFx0XHRcdFx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0XHRcdFx0XHR9KSwgZnNfZXJyb3IpO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0ZGlyLmdldEZpbGUobmFtZSwge2NyZWF0ZTogZmFsc2V9LCBhYm9ydGFibGUoZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0XHRcdFx0Ly8gZGVsZXRlIGZpbGUgaWYgaXQgYWxyZWFkeSBleGlzdHNcblx0XHRcdFx0XHRcdGZpbGUucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHRzYXZlKCk7XG5cdFx0XHRcdFx0fSksIGFib3J0YWJsZShmdW5jdGlvbihleCkge1xuXHRcdFx0XHRcdFx0aWYgKGV4LmNvZGUgPT09IGV4Lk5PVF9GT1VORF9FUlIpIHtcblx0XHRcdFx0XHRcdFx0c2F2ZSgpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZnNfZXJyb3IoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0pLCBmc19lcnJvcik7XG5cdFx0XHR9KSwgZnNfZXJyb3IpO1xuXHRcdH1cblx0XHQsIEZTX3Byb3RvID0gRmlsZVNhdmVyLnByb3RvdHlwZVxuXHRcdCwgc2F2ZUFzID0gZnVuY3Rpb24oYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pIHtcblx0XHRcdHJldHVybiBuZXcgRmlsZVNhdmVyKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKTtcblx0XHR9XG5cdDtcblx0Ly8gSUUgMTArIChuYXRpdmUgc2F2ZUFzKVxuXHRpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIiAmJiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYikge1xuXHRcdHJldHVybiBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0aWYgKCFub19hdXRvX2JvbSkge1xuXHRcdFx0XHRibG9iID0gYXV0b19ib20oYmxvYik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IoYmxvYiwgbmFtZSB8fCBcImRvd25sb2FkXCIpO1xuXHRcdH07XG5cdH1cblxuXHRGU19wcm90by5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmaWxlc2F2ZXIgPSB0aGlzO1xuXHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLkRPTkU7XG5cdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcImFib3J0XCIpO1xuXHR9O1xuXHRGU19wcm90by5yZWFkeVN0YXRlID0gRlNfcHJvdG8uSU5JVCA9IDA7XG5cdEZTX3Byb3RvLldSSVRJTkcgPSAxO1xuXHRGU19wcm90by5ET05FID0gMjtcblxuXHRGU19wcm90by5lcnJvciA9XG5cdEZTX3Byb3RvLm9ud3JpdGVzdGFydCA9XG5cdEZTX3Byb3RvLm9ucHJvZ3Jlc3MgPVxuXHRGU19wcm90by5vbndyaXRlID1cblx0RlNfcHJvdG8ub25hYm9ydCA9XG5cdEZTX3Byb3RvLm9uZXJyb3IgPVxuXHRGU19wcm90by5vbndyaXRlZW5kID1cblx0XHRudWxsO1xuXG5cdHJldHVybiBzYXZlQXM7XG59KFxuXHQgICB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzZWxmXG5cdHx8IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93XG5cdHx8IHRoaXMuY29udGVudFxuKSk7XG4vLyBgc2VsZmAgaXMgdW5kZWZpbmVkIGluIEZpcmVmb3ggZm9yIEFuZHJvaWQgY29udGVudCBzY3JpcHQgY29udGV4dFxuLy8gd2hpbGUgYHRoaXNgIGlzIG5zSUNvbnRlbnRGcmFtZU1lc3NhZ2VNYW5hZ2VyXG4vLyB3aXRoIGFuIGF0dHJpYnV0ZSBgY29udGVudGAgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgd2luZG93XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gIG1vZHVsZS5leHBvcnRzLnNhdmVBcyA9IHNhdmVBcztcbn0gZWxzZSBpZiAoKHR5cGVvZiBkZWZpbmUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lICE9PSBudWxsKSAmJiAoZGVmaW5lLmFtZCAhPSBudWxsKSkge1xuICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzYXZlQXM7XG4gIH0pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIDA6ICdOT05FJyxcbiAgMTogJ09ORScsXG4gIDI6ICdMSU5FX0xPT1AnLFxuICAzOiAnTElORV9TVFJJUCcsXG4gIDQ6ICdUUklBTkdMRVMnLFxuICA1OiAnVFJJQU5HTEVfU1RSSVAnLFxuICA2OiAnVFJJQU5HTEVfRkFOJyxcbiAgMjU2OiAnREVQVEhfQlVGRkVSX0JJVCcsXG4gIDUxMjogJ05FVkVSJyxcbiAgNTEzOiAnTEVTUycsXG4gIDUxNDogJ0VRVUFMJyxcbiAgNTE1OiAnTEVRVUFMJyxcbiAgNTE2OiAnR1JFQVRFUicsXG4gIDUxNzogJ05PVEVRVUFMJyxcbiAgNTE4OiAnR0VRVUFMJyxcbiAgNTE5OiAnQUxXQVlTJyxcbiAgNzY4OiAnU1JDX0NPTE9SJyxcbiAgNzY5OiAnT05FX01JTlVTX1NSQ19DT0xPUicsXG4gIDc3MDogJ1NSQ19BTFBIQScsXG4gIDc3MTogJ09ORV9NSU5VU19TUkNfQUxQSEEnLFxuICA3NzI6ICdEU1RfQUxQSEEnLFxuICA3NzM6ICdPTkVfTUlOVVNfRFNUX0FMUEhBJyxcbiAgNzc0OiAnRFNUX0NPTE9SJyxcbiAgNzc1OiAnT05FX01JTlVTX0RTVF9DT0xPUicsXG4gIDc3NjogJ1NSQ19BTFBIQV9TQVRVUkFURScsXG4gIDEwMjQ6ICdTVEVOQ0lMX0JVRkZFUl9CSVQnLFxuICAxMDI4OiAnRlJPTlQnLFxuICAxMDI5OiAnQkFDSycsXG4gIDEwMzI6ICdGUk9OVF9BTkRfQkFDSycsXG4gIDEyODA6ICdJTlZBTElEX0VOVU0nLFxuICAxMjgxOiAnSU5WQUxJRF9WQUxVRScsXG4gIDEyODI6ICdJTlZBTElEX09QRVJBVElPTicsXG4gIDEyODU6ICdPVVRfT0ZfTUVNT1JZJyxcbiAgMTI4NjogJ0lOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OJyxcbiAgMjMwNDogJ0NXJyxcbiAgMjMwNTogJ0NDVycsXG4gIDI4NDk6ICdMSU5FX1dJRFRIJyxcbiAgMjg4NDogJ0NVTExfRkFDRScsXG4gIDI4ODU6ICdDVUxMX0ZBQ0VfTU9ERScsXG4gIDI4ODY6ICdGUk9OVF9GQUNFJyxcbiAgMjkyODogJ0RFUFRIX1JBTkdFJyxcbiAgMjkyOTogJ0RFUFRIX1RFU1QnLFxuICAyOTMwOiAnREVQVEhfV1JJVEVNQVNLJyxcbiAgMjkzMTogJ0RFUFRIX0NMRUFSX1ZBTFVFJyxcbiAgMjkzMjogJ0RFUFRIX0ZVTkMnLFxuICAyOTYwOiAnU1RFTkNJTF9URVNUJyxcbiAgMjk2MTogJ1NURU5DSUxfQ0xFQVJfVkFMVUUnLFxuICAyOTYyOiAnU1RFTkNJTF9GVU5DJyxcbiAgMjk2MzogJ1NURU5DSUxfVkFMVUVfTUFTSycsXG4gIDI5NjQ6ICdTVEVOQ0lMX0ZBSUwnLFxuICAyOTY1OiAnU1RFTkNJTF9QQVNTX0RFUFRIX0ZBSUwnLFxuICAyOTY2OiAnU1RFTkNJTF9QQVNTX0RFUFRIX1BBU1MnLFxuICAyOTY3OiAnU1RFTkNJTF9SRUYnLFxuICAyOTY4OiAnU1RFTkNJTF9XUklURU1BU0snLFxuICAyOTc4OiAnVklFV1BPUlQnLFxuICAzMDI0OiAnRElUSEVSJyxcbiAgMzA0MjogJ0JMRU5EJyxcbiAgMzA4ODogJ1NDSVNTT1JfQk9YJyxcbiAgMzA4OTogJ1NDSVNTT1JfVEVTVCcsXG4gIDMxMDY6ICdDT0xPUl9DTEVBUl9WQUxVRScsXG4gIDMxMDc6ICdDT0xPUl9XUklURU1BU0snLFxuICAzMzE3OiAnVU5QQUNLX0FMSUdOTUVOVCcsXG4gIDMzMzM6ICdQQUNLX0FMSUdOTUVOVCcsXG4gIDMzNzk6ICdNQVhfVEVYVFVSRV9TSVpFJyxcbiAgMzM4NjogJ01BWF9WSUVXUE9SVF9ESU1TJyxcbiAgMzQwODogJ1NVQlBJWEVMX0JJVFMnLFxuICAzNDEwOiAnUkVEX0JJVFMnLFxuICAzNDExOiAnR1JFRU5fQklUUycsXG4gIDM0MTI6ICdCTFVFX0JJVFMnLFxuICAzNDEzOiAnQUxQSEFfQklUUycsXG4gIDM0MTQ6ICdERVBUSF9CSVRTJyxcbiAgMzQxNTogJ1NURU5DSUxfQklUUycsXG4gIDM1NTM6ICdURVhUVVJFXzJEJyxcbiAgNDM1MjogJ0RPTlRfQ0FSRScsXG4gIDQzNTM6ICdGQVNURVNUJyxcbiAgNDM1NDogJ05JQ0VTVCcsXG4gIDUxMjA6ICdCWVRFJyxcbiAgNTEyMTogJ1VOU0lHTkVEX0JZVEUnLFxuICA1MTIyOiAnU0hPUlQnLFxuICA1MTIzOiAnVU5TSUdORURfU0hPUlQnLFxuICA1MTI0OiAnSU5UJyxcbiAgNTEyNTogJ1VOU0lHTkVEX0lOVCcsXG4gIDUxMjY6ICdGTE9BVCcsXG4gIDUzODY6ICdJTlZFUlQnLFxuICA1ODkwOiAnVEVYVFVSRScsXG4gIDY0MDE6ICdTVEVOQ0lMX0lOREVYJyxcbiAgNjQwMjogJ0RFUFRIX0NPTVBPTkVOVCcsXG4gIDY0MDY6ICdBTFBIQScsXG4gIDY0MDc6ICdSR0InLFxuICA2NDA4OiAnUkdCQScsXG4gIDY0MDk6ICdMVU1JTkFOQ0UnLFxuICA2NDEwOiAnTFVNSU5BTkNFX0FMUEhBJyxcbiAgNzY4MDogJ0tFRVAnLFxuICA3NjgxOiAnUkVQTEFDRScsXG4gIDc2ODI6ICdJTkNSJyxcbiAgNzY4MzogJ0RFQ1InLFxuICA3OTM2OiAnVkVORE9SJyxcbiAgNzkzNzogJ1JFTkRFUkVSJyxcbiAgNzkzODogJ1ZFUlNJT04nLFxuICA5NzI4OiAnTkVBUkVTVCcsXG4gIDk3Mjk6ICdMSU5FQVInLFxuICA5OTg0OiAnTkVBUkVTVF9NSVBNQVBfTkVBUkVTVCcsXG4gIDk5ODU6ICdMSU5FQVJfTUlQTUFQX05FQVJFU1QnLFxuICA5OTg2OiAnTkVBUkVTVF9NSVBNQVBfTElORUFSJyxcbiAgOTk4NzogJ0xJTkVBUl9NSVBNQVBfTElORUFSJyxcbiAgMTAyNDA6ICdURVhUVVJFX01BR19GSUxURVInLFxuICAxMDI0MTogJ1RFWFRVUkVfTUlOX0ZJTFRFUicsXG4gIDEwMjQyOiAnVEVYVFVSRV9XUkFQX1MnLFxuICAxMDI0MzogJ1RFWFRVUkVfV1JBUF9UJyxcbiAgMTA0OTc6ICdSRVBFQVQnLFxuICAxMDc1MjogJ1BPTFlHT05fT0ZGU0VUX1VOSVRTJyxcbiAgMTYzODQ6ICdDT0xPUl9CVUZGRVJfQklUJyxcbiAgMzI3Njk6ICdDT05TVEFOVF9DT0xPUicsXG4gIDMyNzcwOiAnT05FX01JTlVTX0NPTlNUQU5UX0NPTE9SJyxcbiAgMzI3NzE6ICdDT05TVEFOVF9BTFBIQScsXG4gIDMyNzcyOiAnT05FX01JTlVTX0NPTlNUQU5UX0FMUEhBJyxcbiAgMzI3NzM6ICdCTEVORF9DT0xPUicsXG4gIDMyNzc0OiAnRlVOQ19BREQnLFxuICAzMjc3NzogJ0JMRU5EX0VRVUFUSU9OX1JHQicsXG4gIDMyNzc4OiAnRlVOQ19TVUJUUkFDVCcsXG4gIDMyNzc5OiAnRlVOQ19SRVZFUlNFX1NVQlRSQUNUJyxcbiAgMzI4MTk6ICdVTlNJR05FRF9TSE9SVF80XzRfNF80JyxcbiAgMzI4MjA6ICdVTlNJR05FRF9TSE9SVF81XzVfNV8xJyxcbiAgMzI4MjM6ICdQT0xZR09OX09GRlNFVF9GSUxMJyxcbiAgMzI4MjQ6ICdQT0xZR09OX09GRlNFVF9GQUNUT1InLFxuICAzMjg1NDogJ1JHQkE0JyxcbiAgMzI4NTU6ICdSR0I1X0ExJyxcbiAgMzI4NzM6ICdURVhUVVJFX0JJTkRJTkdfMkQnLFxuICAzMjkyNjogJ1NBTVBMRV9BTFBIQV9UT19DT1ZFUkFHRScsXG4gIDMyOTI4OiAnU0FNUExFX0NPVkVSQUdFJyxcbiAgMzI5MzY6ICdTQU1QTEVfQlVGRkVSUycsXG4gIDMyOTM3OiAnU0FNUExFUycsXG4gIDMyOTM4OiAnU0FNUExFX0NPVkVSQUdFX1ZBTFVFJyxcbiAgMzI5Mzk6ICdTQU1QTEVfQ09WRVJBR0VfSU5WRVJUJyxcbiAgMzI5Njg6ICdCTEVORF9EU1RfUkdCJyxcbiAgMzI5Njk6ICdCTEVORF9TUkNfUkdCJyxcbiAgMzI5NzA6ICdCTEVORF9EU1RfQUxQSEEnLFxuICAzMjk3MTogJ0JMRU5EX1NSQ19BTFBIQScsXG4gIDMzMDcxOiAnQ0xBTVBfVE9fRURHRScsXG4gIDMzMTcwOiAnR0VORVJBVEVfTUlQTUFQX0hJTlQnLFxuICAzMzE4OTogJ0RFUFRIX0NPTVBPTkVOVDE2JyxcbiAgMzMzMDY6ICdERVBUSF9TVEVOQ0lMX0FUVEFDSE1FTlQnLFxuICAzMzYzNTogJ1VOU0lHTkVEX1NIT1JUXzVfNl81JyxcbiAgMzM2NDg6ICdNSVJST1JFRF9SRVBFQVQnLFxuICAzMzkwMTogJ0FMSUFTRURfUE9JTlRfU0laRV9SQU5HRScsXG4gIDMzOTAyOiAnQUxJQVNFRF9MSU5FX1dJRFRIX1JBTkdFJyxcbiAgMzM5ODQ6ICdURVhUVVJFMCcsXG4gIDMzOTg1OiAnVEVYVFVSRTEnLFxuICAzMzk4NjogJ1RFWFRVUkUyJyxcbiAgMzM5ODc6ICdURVhUVVJFMycsXG4gIDMzOTg4OiAnVEVYVFVSRTQnLFxuICAzMzk4OTogJ1RFWFRVUkU1JyxcbiAgMzM5OTA6ICdURVhUVVJFNicsXG4gIDMzOTkxOiAnVEVYVFVSRTcnLFxuICAzMzk5MjogJ1RFWFRVUkU4JyxcbiAgMzM5OTM6ICdURVhUVVJFOScsXG4gIDMzOTk0OiAnVEVYVFVSRTEwJyxcbiAgMzM5OTU6ICdURVhUVVJFMTEnLFxuICAzMzk5NjogJ1RFWFRVUkUxMicsXG4gIDMzOTk3OiAnVEVYVFVSRTEzJyxcbiAgMzM5OTg6ICdURVhUVVJFMTQnLFxuICAzMzk5OTogJ1RFWFRVUkUxNScsXG4gIDM0MDAwOiAnVEVYVFVSRTE2JyxcbiAgMzQwMDE6ICdURVhUVVJFMTcnLFxuICAzNDAwMjogJ1RFWFRVUkUxOCcsXG4gIDM0MDAzOiAnVEVYVFVSRTE5JyxcbiAgMzQwMDQ6ICdURVhUVVJFMjAnLFxuICAzNDAwNTogJ1RFWFRVUkUyMScsXG4gIDM0MDA2OiAnVEVYVFVSRTIyJyxcbiAgMzQwMDc6ICdURVhUVVJFMjMnLFxuICAzNDAwODogJ1RFWFRVUkUyNCcsXG4gIDM0MDA5OiAnVEVYVFVSRTI1JyxcbiAgMzQwMTA6ICdURVhUVVJFMjYnLFxuICAzNDAxMTogJ1RFWFRVUkUyNycsXG4gIDM0MDEyOiAnVEVYVFVSRTI4JyxcbiAgMzQwMTM6ICdURVhUVVJFMjknLFxuICAzNDAxNDogJ1RFWFRVUkUzMCcsXG4gIDM0MDE1OiAnVEVYVFVSRTMxJyxcbiAgMzQwMTY6ICdBQ1RJVkVfVEVYVFVSRScsXG4gIDM0MDI0OiAnTUFYX1JFTkRFUkJVRkZFUl9TSVpFJyxcbiAgMzQwNDE6ICdERVBUSF9TVEVOQ0lMJyxcbiAgMzQwNTU6ICdJTkNSX1dSQVAnLFxuICAzNDA1NjogJ0RFQ1JfV1JBUCcsXG4gIDM0MDY3OiAnVEVYVFVSRV9DVUJFX01BUCcsXG4gIDM0MDY4OiAnVEVYVFVSRV9CSU5ESU5HX0NVQkVfTUFQJyxcbiAgMzQwNjk6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gnLFxuICAzNDA3MDogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCcsXG4gIDM0MDcxOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZJyxcbiAgMzQwNzI6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1knLFxuICAzNDA3MzogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWicsXG4gIDM0MDc0OiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aJyxcbiAgMzQwNzY6ICdNQVhfQ1VCRV9NQVBfVEVYVFVSRV9TSVpFJyxcbiAgMzQzMzg6ICdWRVJURVhfQVRUUklCX0FSUkFZX0VOQUJMRUQnLFxuICAzNDMzOTogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfU0laRScsXG4gIDM0MzQwOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9TVFJJREUnLFxuICAzNDM0MTogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfVFlQRScsXG4gIDM0MzQyOiAnQ1VSUkVOVF9WRVJURVhfQVRUUklCJyxcbiAgMzQzNzM6ICdWRVJURVhfQVRUUklCX0FSUkFZX1BPSU5URVInLFxuICAzNDQ2NjogJ05VTV9DT01QUkVTU0VEX1RFWFRVUkVfRk9STUFUUycsXG4gIDM0NDY3OiAnQ09NUFJFU1NFRF9URVhUVVJFX0ZPUk1BVFMnLFxuICAzNDY2MDogJ0JVRkZFUl9TSVpFJyxcbiAgMzQ2NjE6ICdCVUZGRVJfVVNBR0UnLFxuICAzNDgxNjogJ1NURU5DSUxfQkFDS19GVU5DJyxcbiAgMzQ4MTc6ICdTVEVOQ0lMX0JBQ0tfRkFJTCcsXG4gIDM0ODE4OiAnU1RFTkNJTF9CQUNLX1BBU1NfREVQVEhfRkFJTCcsXG4gIDM0ODE5OiAnU1RFTkNJTF9CQUNLX1BBU1NfREVQVEhfUEFTUycsXG4gIDM0ODc3OiAnQkxFTkRfRVFVQVRJT05fQUxQSEEnLFxuICAzNDkyMTogJ01BWF9WRVJURVhfQVRUUklCUycsXG4gIDM0OTIyOiAnVkVSVEVYX0FUVFJJQl9BUlJBWV9OT1JNQUxJWkVEJyxcbiAgMzQ5MzA6ICdNQVhfVEVYVFVSRV9JTUFHRV9VTklUUycsXG4gIDM0OTYyOiAnQVJSQVlfQlVGRkVSJyxcbiAgMzQ5NjM6ICdFTEVNRU5UX0FSUkFZX0JVRkZFUicsXG4gIDM0OTY0OiAnQVJSQVlfQlVGRkVSX0JJTkRJTkcnLFxuICAzNDk2NTogJ0VMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcnLFxuICAzNDk3NTogJ1ZFUlRFWF9BVFRSSUJfQVJSQVlfQlVGRkVSX0JJTkRJTkcnLFxuICAzNTA0MDogJ1NUUkVBTV9EUkFXJyxcbiAgMzUwNDQ6ICdTVEFUSUNfRFJBVycsXG4gIDM1MDQ4OiAnRFlOQU1JQ19EUkFXJyxcbiAgMzU2MzI6ICdGUkFHTUVOVF9TSEFERVInLFxuICAzNTYzMzogJ1ZFUlRFWF9TSEFERVInLFxuICAzNTY2MDogJ01BWF9WRVJURVhfVEVYVFVSRV9JTUFHRV9VTklUUycsXG4gIDM1NjYxOiAnTUFYX0NPTUJJTkVEX1RFWFRVUkVfSU1BR0VfVU5JVFMnLFxuICAzNTY2MzogJ1NIQURFUl9UWVBFJyxcbiAgMzU2NjQ6ICdGTE9BVF9WRUMyJyxcbiAgMzU2NjU6ICdGTE9BVF9WRUMzJyxcbiAgMzU2NjY6ICdGTE9BVF9WRUM0JyxcbiAgMzU2Njc6ICdJTlRfVkVDMicsXG4gIDM1NjY4OiAnSU5UX1ZFQzMnLFxuICAzNTY2OTogJ0lOVF9WRUM0JyxcbiAgMzU2NzA6ICdCT09MJyxcbiAgMzU2NzE6ICdCT09MX1ZFQzInLFxuICAzNTY3MjogJ0JPT0xfVkVDMycsXG4gIDM1NjczOiAnQk9PTF9WRUM0JyxcbiAgMzU2NzQ6ICdGTE9BVF9NQVQyJyxcbiAgMzU2NzU6ICdGTE9BVF9NQVQzJyxcbiAgMzU2NzY6ICdGTE9BVF9NQVQ0JyxcbiAgMzU2Nzg6ICdTQU1QTEVSXzJEJyxcbiAgMzU2ODA6ICdTQU1QTEVSX0NVQkUnLFxuICAzNTcxMjogJ0RFTEVURV9TVEFUVVMnLFxuICAzNTcxMzogJ0NPTVBJTEVfU1RBVFVTJyxcbiAgMzU3MTQ6ICdMSU5LX1NUQVRVUycsXG4gIDM1NzE1OiAnVkFMSURBVEVfU1RBVFVTJyxcbiAgMzU3MTY6ICdJTkZPX0xPR19MRU5HVEgnLFxuICAzNTcxNzogJ0FUVEFDSEVEX1NIQURFUlMnLFxuICAzNTcxODogJ0FDVElWRV9VTklGT1JNUycsXG4gIDM1NzE5OiAnQUNUSVZFX1VOSUZPUk1fTUFYX0xFTkdUSCcsXG4gIDM1NzIwOiAnU0hBREVSX1NPVVJDRV9MRU5HVEgnLFxuICAzNTcyMTogJ0FDVElWRV9BVFRSSUJVVEVTJyxcbiAgMzU3MjI6ICdBQ1RJVkVfQVRUUklCVVRFX01BWF9MRU5HVEgnLFxuICAzNTcyNDogJ1NIQURJTkdfTEFOR1VBR0VfVkVSU0lPTicsXG4gIDM1NzI1OiAnQ1VSUkVOVF9QUk9HUkFNJyxcbiAgMzYwMDM6ICdTVEVOQ0lMX0JBQ0tfUkVGJyxcbiAgMzYwMDQ6ICdTVEVOQ0lMX0JBQ0tfVkFMVUVfTUFTSycsXG4gIDM2MDA1OiAnU1RFTkNJTF9CQUNLX1dSSVRFTUFTSycsXG4gIDM2MDA2OiAnRlJBTUVCVUZGRVJfQklORElORycsXG4gIDM2MDA3OiAnUkVOREVSQlVGRkVSX0JJTkRJTkcnLFxuICAzNjA0ODogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX1RZUEUnLFxuICAzNjA0OTogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX05BTUUnLFxuICAzNjA1MDogJ0ZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MRVZFTCcsXG4gIDM2MDUxOiAnRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0NVQkVfTUFQX0ZBQ0UnLFxuICAzNjA1MzogJ0ZSQU1FQlVGRkVSX0NPTVBMRVRFJyxcbiAgMzYwNTQ6ICdGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlQnLFxuICAzNjA1NTogJ0ZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5UJyxcbiAgMzYwNTc6ICdGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlMnLFxuICAzNjA2MTogJ0ZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEJyxcbiAgMzYwNjQ6ICdDT0xPUl9BVFRBQ0hNRU5UMCcsXG4gIDM2MDk2OiAnREVQVEhfQVRUQUNITUVOVCcsXG4gIDM2MTI4OiAnU1RFTkNJTF9BVFRBQ0hNRU5UJyxcbiAgMzYxNjA6ICdGUkFNRUJVRkZFUicsXG4gIDM2MTYxOiAnUkVOREVSQlVGRkVSJyxcbiAgMzYxNjI6ICdSRU5ERVJCVUZGRVJfV0lEVEgnLFxuICAzNjE2MzogJ1JFTkRFUkJVRkZFUl9IRUlHSFQnLFxuICAzNjE2NDogJ1JFTkRFUkJVRkZFUl9JTlRFUk5BTF9GT1JNQVQnLFxuICAzNjE2ODogJ1NURU5DSUxfSU5ERVg4JyxcbiAgMzYxNzY6ICdSRU5ERVJCVUZGRVJfUkVEX1NJWkUnLFxuICAzNjE3NzogJ1JFTkRFUkJVRkZFUl9HUkVFTl9TSVpFJyxcbiAgMzYxNzg6ICdSRU5ERVJCVUZGRVJfQkxVRV9TSVpFJyxcbiAgMzYxNzk6ICdSRU5ERVJCVUZGRVJfQUxQSEFfU0laRScsXG4gIDM2MTgwOiAnUkVOREVSQlVGRkVSX0RFUFRIX1NJWkUnLFxuICAzNjE4MTogJ1JFTkRFUkJVRkZFUl9TVEVOQ0lMX1NJWkUnLFxuICAzNjE5NDogJ1JHQjU2NScsXG4gIDM2MzM2OiAnTE9XX0ZMT0FUJyxcbiAgMzYzMzc6ICdNRURJVU1fRkxPQVQnLFxuICAzNjMzODogJ0hJR0hfRkxPQVQnLFxuICAzNjMzOTogJ0xPV19JTlQnLFxuICAzNjM0MDogJ01FRElVTV9JTlQnLFxuICAzNjM0MTogJ0hJR0hfSU5UJyxcbiAgMzYzNDY6ICdTSEFERVJfQ09NUElMRVInLFxuICAzNjM0NzogJ01BWF9WRVJURVhfVU5JRk9STV9WRUNUT1JTJyxcbiAgMzYzNDg6ICdNQVhfVkFSWUlOR19WRUNUT1JTJyxcbiAgMzYzNDk6ICdNQVhfRlJBR01FTlRfVU5JRk9STV9WRUNUT1JTJyxcbiAgMzc0NDA6ICdVTlBBQ0tfRkxJUF9ZX1dFQkdMJyxcbiAgMzc0NDE6ICdVTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wnLFxuICAzNzQ0MjogJ0NPTlRFWFRfTE9TVF9XRUJHTCcsXG4gIDM3NDQzOiAnVU5QQUNLX0NPTE9SU1BBQ0VfQ09OVkVSU0lPTl9XRUJHTCcsXG4gIDM3NDQ0OiAnQlJPV1NFUl9ERUZBVUxUX1dFQkdMJ1xufVxuIiwidmFyIGdsMTAgPSByZXF1aXJlKCcuLzEuMC9udW1iZXJzJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsb29rdXBDb25zdGFudCAobnVtYmVyKSB7XG4gIHJldHVybiBnbDEwW251bWJlcl1cbn1cbiIsIlxudmFyIHNwcmludGYgPSByZXF1aXJlKCdzcHJpbnRmLWpzJykuc3ByaW50ZjtcbnZhciBnbENvbnN0YW50cyA9IHJlcXVpcmUoJ2dsLWNvbnN0YW50cy9sb29rdXAnKTtcbnZhciBzaGFkZXJOYW1lID0gcmVxdWlyZSgnZ2xzbC1zaGFkZXItbmFtZScpO1xudmFyIGFkZExpbmVOdW1iZXJzID0gcmVxdWlyZSgnYWRkLWxpbmUtbnVtYmVycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvcm1hdENvbXBpbGVyRXJyb3I7XG5cbmZ1bmN0aW9uIGZvcm1hdENvbXBpbGVyRXJyb3IoZXJyTG9nLCBzcmMsIHR5cGUpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBuYW1lID0gc2hhZGVyTmFtZShzcmMpIHx8ICdvZiB1bmtub3duIG5hbWUgKHNlZSBucG0gZ2xzbC1zaGFkZXItbmFtZSknO1xuXG4gICAgdmFyIHR5cGVOYW1lID0gJ3Vua25vd24gdHlwZSc7XG4gICAgaWYgKHR5cGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eXBlTmFtZSA9IHR5cGUgPT09IGdsQ29uc3RhbnRzLkZSQUdNRU5UX1NIQURFUiA/ICdmcmFnbWVudCcgOiAndmVydGV4J1xuICAgIH1cblxuICAgIHZhciBsb25nRm9ybSA9IHNwcmludGYoJ0Vycm9yIGNvbXBpbGluZyAlcyBzaGFkZXIgJXM6XFxuJywgdHlwZU5hbWUsIG5hbWUpO1xuICAgIHZhciBzaG9ydEZvcm0gPSBzcHJpbnRmKFwiJXMlc1wiLCBsb25nRm9ybSwgZXJyTG9nKTtcblxuICAgIHZhciBlcnJvclN0cmluZ3MgPSBlcnJMb2cuc3BsaXQoJ1xcbicpO1xuICAgIHZhciBlcnJvcnMgPSB7fTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXJyb3JTdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlcnJvclN0cmluZyA9IGVycm9yU3RyaW5nc1tpXTtcbiAgICAgICAgaWYgKGVycm9yU3RyaW5nID09PSAnJykgY29udGludWU7XG4gICAgICAgIHZhciBsaW5lTm8gPSBwYXJzZUludChlcnJvclN0cmluZy5zcGxpdCgnOicpWzJdKTtcbiAgICAgICAgaWYgKGlzTmFOKGxpbmVObykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzcHJpbnRmKCdDb3VsZCBub3QgcGFyc2UgZXJyb3I6ICVzJywgZXJyb3JTdHJpbmcpKTtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcnNbbGluZU5vXSA9IGVycm9yU3RyaW5nO1xuICAgIH1cblxuICAgIHZhciBsaW5lcyA9IGFkZExpbmVOdW1iZXJzKHNyYykuc3BsaXQoJ1xcbicpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWVycm9yc1tpKzNdICYmICFlcnJvcnNbaSsyXSAmJiAhZXJyb3JzW2krMV0pIGNvbnRpbnVlO1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuICAgICAgICBsb25nRm9ybSArPSBsaW5lICsgJ1xcbic7XG4gICAgICAgIGlmIChlcnJvcnNbaSsxXSkge1xuICAgICAgICAgICAgdmFyIGUgPSBlcnJvcnNbaSsxXTtcbiAgICAgICAgICAgIGUgPSBlLnN1YnN0cihlLnNwbGl0KCc6JywgMykuam9pbignOicpLmxlbmd0aCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIGxvbmdGb3JtICs9IHNwcmludGYoJ15eXiAlc1xcblxcbicsIGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9uZzogbG9uZ0Zvcm0udHJpbSgpLFxuICAgICAgICBzaG9ydDogc2hvcnRGb3JtLnRyaW0oKVxuICAgIH07XG59XG5cbiIsInZhciB0b2tlbml6ZSA9IHJlcXVpcmUoJ2dsc2wtdG9rZW5pemVyJylcbnZhciBhdG9iICAgICA9IHJlcXVpcmUoJ2F0b2ItbGl0ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TmFtZVxuXG5mdW5jdGlvbiBnZXROYW1lKHNyYykge1xuICB2YXIgdG9rZW5zID0gQXJyYXkuaXNBcnJheShzcmMpXG4gICAgPyBzcmNcbiAgICA6IHRva2VuaXplKHNyYylcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuICAgIGlmICh0b2tlbi50eXBlICE9PSAncHJlcHJvY2Vzc29yJykgY29udGludWVcbiAgICB2YXIgbWF0Y2ggPSB0b2tlbi5kYXRhLm1hdGNoKC9cXCNkZWZpbmVcXHMrU0hBREVSX05BTUUoX0I2NCk/XFxzKyguKykkLylcbiAgICBpZiAoIW1hdGNoKSBjb250aW51ZVxuICAgIGlmICghbWF0Y2hbMl0pIGNvbnRpbnVlXG5cbiAgICB2YXIgYjY0ICA9IG1hdGNoWzFdXG4gICAgdmFyIG5hbWUgPSBtYXRjaFsyXVxuXG4gICAgcmV0dXJuIChiNjQgPyBhdG9iKG5hbWUpIDogbmFtZSkudHJpbSgpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gdG9rZW5pemVcblxudmFyIGxpdGVyYWxzMTAwID0gcmVxdWlyZSgnLi9saWIvbGl0ZXJhbHMnKVxuICAsIG9wZXJhdG9ycyA9IHJlcXVpcmUoJy4vbGliL29wZXJhdG9ycycpXG4gICwgYnVpbHRpbnMxMDAgPSByZXF1aXJlKCcuL2xpYi9idWlsdGlucycpXG4gICwgbGl0ZXJhbHMzMDBlcyA9IHJlcXVpcmUoJy4vbGliL2xpdGVyYWxzLTMwMGVzJylcbiAgLCBidWlsdGluczMwMGVzID0gcmVxdWlyZSgnLi9saWIvYnVpbHRpbnMtMzAwZXMnKVxuXG52YXIgTk9STUFMID0gOTk5ICAgICAgICAgIC8vIDwtLSBuZXZlciBlbWl0dGVkXG4gICwgVE9LRU4gPSA5OTk5ICAgICAgICAgIC8vIDwtLSBuZXZlciBlbWl0dGVkXG4gICwgQkxPQ0tfQ09NTUVOVCA9IDBcbiAgLCBMSU5FX0NPTU1FTlQgPSAxXG4gICwgUFJFUFJPQ0VTU09SID0gMlxuICAsIE9QRVJBVE9SID0gM1xuICAsIElOVEVHRVIgPSA0XG4gICwgRkxPQVQgPSA1XG4gICwgSURFTlQgPSA2XG4gICwgQlVJTFRJTiA9IDdcbiAgLCBLRVlXT1JEID0gOFxuICAsIFdISVRFU1BBQ0UgPSA5XG4gICwgRU9GID0gMTBcbiAgLCBIRVggPSAxMVxuXG52YXIgbWFwID0gW1xuICAgICdibG9jay1jb21tZW50J1xuICAsICdsaW5lLWNvbW1lbnQnXG4gICwgJ3ByZXByb2Nlc3NvcidcbiAgLCAnb3BlcmF0b3InXG4gICwgJ2ludGVnZXInXG4gICwgJ2Zsb2F0J1xuICAsICdpZGVudCdcbiAgLCAnYnVpbHRpbidcbiAgLCAna2V5d29yZCdcbiAgLCAnd2hpdGVzcGFjZSdcbiAgLCAnZW9mJ1xuICAsICdpbnRlZ2VyJ1xuXVxuXG5mdW5jdGlvbiB0b2tlbml6ZShvcHQpIHtcbiAgdmFyIGkgPSAwXG4gICAgLCB0b3RhbCA9IDBcbiAgICAsIG1vZGUgPSBOT1JNQUxcbiAgICAsIGNcbiAgICAsIGxhc3RcbiAgICAsIGNvbnRlbnQgPSBbXVxuICAgICwgdG9rZW5zID0gW11cbiAgICAsIHRva2VuX2lkeCA9IDBcbiAgICAsIHRva2VuX29mZnMgPSAwXG4gICAgLCBsaW5lID0gMVxuICAgICwgY29sID0gMFxuICAgICwgc3RhcnQgPSAwXG4gICAgLCBpc251bSA9IGZhbHNlXG4gICAgLCBpc29wZXJhdG9yID0gZmFsc2VcbiAgICAsIGlucHV0ID0gJydcbiAgICAsIGxlblxuXG4gIG9wdCA9IG9wdCB8fCB7fVxuICB2YXIgYWxsQnVpbHRpbnMgPSBidWlsdGluczEwMFxuICB2YXIgYWxsTGl0ZXJhbHMgPSBsaXRlcmFsczEwMFxuICBpZiAob3B0LnZlcnNpb24gPT09ICczMDAgZXMnKSB7XG4gICAgYWxsQnVpbHRpbnMgPSBidWlsdGluczMwMGVzXG4gICAgYWxsTGl0ZXJhbHMgPSBsaXRlcmFsczMwMGVzXG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgIHRva2VucyA9IFtdXG4gICAgaWYgKGRhdGEgIT09IG51bGwpIHJldHVybiB3cml0ZShkYXRhKVxuICAgIHJldHVybiBlbmQoKVxuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW4oZGF0YSkge1xuICAgIGlmIChkYXRhLmxlbmd0aCkge1xuICAgICAgdG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiBtYXBbbW9kZV1cbiAgICAgICwgZGF0YTogZGF0YVxuICAgICAgLCBwb3NpdGlvbjogc3RhcnRcbiAgICAgICwgbGluZTogbGluZVxuICAgICAgLCBjb2x1bW46IGNvbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZShjaHVuaykge1xuICAgIGkgPSAwXG4gICAgaW5wdXQgKz0gY2h1bmtcbiAgICBsZW4gPSBpbnB1dC5sZW5ndGhcblxuICAgIHZhciBsYXN0XG5cbiAgICB3aGlsZShjID0gaW5wdXRbaV0sIGkgPCBsZW4pIHtcbiAgICAgIGxhc3QgPSBpXG5cbiAgICAgIHN3aXRjaChtb2RlKSB7XG4gICAgICAgIGNhc2UgQkxPQ0tfQ09NTUVOVDogaSA9IGJsb2NrX2NvbW1lbnQoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBMSU5FX0NPTU1FTlQ6IGkgPSBsaW5lX2NvbW1lbnQoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBQUkVQUk9DRVNTT1I6IGkgPSBwcmVwcm9jZXNzb3IoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBPUEVSQVRPUjogaSA9IG9wZXJhdG9yKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgSU5URUdFUjogaSA9IGludGVnZXIoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBIRVg6IGkgPSBoZXgoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBGTE9BVDogaSA9IGRlY2ltYWwoKTsgYnJlYWtcbiAgICAgICAgY2FzZSBUT0tFTjogaSA9IHJlYWR0b2tlbigpOyBicmVha1xuICAgICAgICBjYXNlIFdISVRFU1BBQ0U6IGkgPSB3aGl0ZXNwYWNlKCk7IGJyZWFrXG4gICAgICAgIGNhc2UgTk9STUFMOiBpID0gbm9ybWFsKCk7IGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGlmKGxhc3QgIT09IGkpIHtcbiAgICAgICAgc3dpdGNoKGlucHV0W2xhc3RdKSB7XG4gICAgICAgICAgY2FzZSAnXFxuJzogY29sID0gMDsgKytsaW5lOyBicmVha1xuICAgICAgICAgIGRlZmF1bHQ6ICsrY29sOyBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdG90YWwgKz0gaVxuICAgIGlucHV0ID0gaW5wdXQuc2xpY2UoaSlcbiAgICByZXR1cm4gdG9rZW5zXG4gIH1cblxuICBmdW5jdGlvbiBlbmQoY2h1bmspIHtcbiAgICBpZihjb250ZW50Lmxlbmd0aCkge1xuICAgICAgdG9rZW4oY29udGVudC5qb2luKCcnKSlcbiAgICB9XG5cbiAgICBtb2RlID0gRU9GXG4gICAgdG9rZW4oJyhlb2YpJylcbiAgICByZXR1cm4gdG9rZW5zXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWwoKSB7XG4gICAgY29udGVudCA9IGNvbnRlbnQubGVuZ3RoID8gW10gOiBjb250ZW50XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJyonKSB7XG4gICAgICBzdGFydCA9IHRvdGFsICsgaSAtIDFcbiAgICAgIG1vZGUgPSBCTE9DS19DT01NRU5UXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYobGFzdCA9PT0gJy8nICYmIGMgPT09ICcvJykge1xuICAgICAgc3RhcnQgPSB0b3RhbCArIGkgLSAxXG4gICAgICBtb2RlID0gTElORV9DT01NRU5UXG4gICAgICBsYXN0ID0gY1xuICAgICAgcmV0dXJuIGkgKyAxXG4gICAgfVxuXG4gICAgaWYoYyA9PT0gJyMnKSB7XG4gICAgICBtb2RlID0gUFJFUFJPQ0VTU09SXG4gICAgICBzdGFydCA9IHRvdGFsICsgaVxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZigvXFxzLy50ZXN0KGMpKSB7XG4gICAgICBtb2RlID0gV0hJVEVTUEFDRVxuICAgICAgc3RhcnQgPSB0b3RhbCArIGlcbiAgICAgIHJldHVybiBpXG4gICAgfVxuXG4gICAgaXNudW0gPSAvXFxkLy50ZXN0KGMpXG4gICAgaXNvcGVyYXRvciA9IC9bXlxcd19dLy50ZXN0KGMpXG5cbiAgICBzdGFydCA9IHRvdGFsICsgaVxuICAgIG1vZGUgPSBpc251bSA/IElOVEVHRVIgOiBpc29wZXJhdG9yID8gT1BFUkFUT1IgOiBUT0tFTlxuICAgIHJldHVybiBpXG4gIH1cblxuICBmdW5jdGlvbiB3aGl0ZXNwYWNlKCkge1xuICAgIGlmKC9bXlxcc10vZy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIHByZXByb2Nlc3NvcigpIHtcbiAgICBpZihjID09PSAnXFxuJyAmJiBsYXN0ICE9PSAnXFxcXCcpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gbGluZV9jb21tZW50KCkge1xuICAgIHJldHVybiBwcmVwcm9jZXNzb3IoKVxuICB9XG5cbiAgZnVuY3Rpb24gYmxvY2tfY29tbWVudCgpIHtcbiAgICBpZihjID09PSAnLycgJiYgbGFzdCA9PT0gJyonKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlcmF0b3IoKSB7XG4gICAgaWYobGFzdCA9PT0gJy4nICYmIC9cXGQvLnRlc3QoYykpIHtcbiAgICAgIG1vZGUgPSBGTE9BVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJyonKSB7XG4gICAgICBtb2RlID0gQkxPQ0tfQ09NTUVOVFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBpZihsYXN0ID09PSAnLycgJiYgYyA9PT0gJy8nKSB7XG4gICAgICBtb2RlID0gTElORV9DT01NRU5UXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGMgPT09ICcuJyAmJiBjb250ZW50Lmxlbmd0aCkge1xuICAgICAgd2hpbGUoZGV0ZXJtaW5lX29wZXJhdG9yKGNvbnRlbnQpKTtcblxuICAgICAgbW9kZSA9IEZMT0FUXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGlmKGMgPT09ICc7JyB8fCBjID09PSAnKScgfHwgYyA9PT0gJygnKSB7XG4gICAgICBpZihjb250ZW50Lmxlbmd0aCkgd2hpbGUoZGV0ZXJtaW5lX29wZXJhdG9yKGNvbnRlbnQpKTtcbiAgICAgIHRva2VuKGMpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICB2YXIgaXNfY29tcG9zaXRlX29wZXJhdG9yID0gY29udGVudC5sZW5ndGggPT09IDIgJiYgYyAhPT0gJz0nXG4gICAgaWYoL1tcXHdfXFxkXFxzXS8udGVzdChjKSB8fCBpc19jb21wb3NpdGVfb3BlcmF0b3IpIHtcbiAgICAgIHdoaWxlKGRldGVybWluZV9vcGVyYXRvcihjb250ZW50KSk7XG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBkZXRlcm1pbmVfb3BlcmF0b3IoYnVmKSB7XG4gICAgdmFyIGogPSAwXG4gICAgICAsIGlkeFxuICAgICAgLCByZXNcblxuICAgIGRvIHtcbiAgICAgIGlkeCA9IG9wZXJhdG9ycy5pbmRleE9mKGJ1Zi5zbGljZSgwLCBidWYubGVuZ3RoICsgaikuam9pbignJykpXG4gICAgICByZXMgPSBvcGVyYXRvcnNbaWR4XVxuXG4gICAgICBpZihpZHggPT09IC0xKSB7XG4gICAgICAgIGlmKGotLSArIGJ1Zi5sZW5ndGggPiAwKSBjb250aW51ZVxuICAgICAgICByZXMgPSBidWYuc2xpY2UoMCwgMSkuam9pbignJylcbiAgICAgIH1cblxuICAgICAgdG9rZW4ocmVzKVxuXG4gICAgICBzdGFydCArPSByZXMubGVuZ3RoXG4gICAgICBjb250ZW50ID0gY29udGVudC5zbGljZShyZXMubGVuZ3RoKVxuICAgICAgcmV0dXJuIGNvbnRlbnQubGVuZ3RoXG4gICAgfSB3aGlsZSgxKVxuICB9XG5cbiAgZnVuY3Rpb24gaGV4KCkge1xuICAgIGlmKC9bXmEtZkEtRjAtOV0vLnRlc3QoYykpIHtcbiAgICAgIHRva2VuKGNvbnRlbnQuam9pbignJykpXG4gICAgICBtb2RlID0gTk9STUFMXG4gICAgICByZXR1cm4gaVxuICAgIH1cblxuICAgIGNvbnRlbnQucHVzaChjKVxuICAgIGxhc3QgPSBjXG4gICAgcmV0dXJuIGkgKyAxXG4gIH1cblxuICBmdW5jdGlvbiBpbnRlZ2VyKCkge1xuICAgIGlmKGMgPT09ICcuJykge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZigvW2VFXS8udGVzdChjKSkge1xuICAgICAgY29udGVudC5wdXNoKGMpXG4gICAgICBtb2RlID0gRkxPQVRcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZihjID09PSAneCcgJiYgY29udGVudC5sZW5ndGggPT09IDEgJiYgY29udGVudFswXSA9PT0gJzAnKSB7XG4gICAgICBtb2RlID0gSEVYXG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZigvW15cXGRdLy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjaW1hbCgpIHtcbiAgICBpZihjID09PSAnZicpIHtcbiAgICAgIGNvbnRlbnQucHVzaChjKVxuICAgICAgbGFzdCA9IGNcbiAgICAgIGkgKz0gMVxuICAgIH1cblxuICAgIGlmKC9bZUVdLy50ZXN0KGMpKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZiAoYyA9PT0gJy0nICYmIC9bZUVdLy50ZXN0KGxhc3QpKSB7XG4gICAgICBjb250ZW50LnB1c2goYylcbiAgICAgIGxhc3QgPSBjXG4gICAgICByZXR1cm4gaSArIDFcbiAgICB9XG5cbiAgICBpZigvW15cXGRdLy50ZXN0KGMpKSB7XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG5cbiAgICBjb250ZW50LnB1c2goYylcbiAgICBsYXN0ID0gY1xuICAgIHJldHVybiBpICsgMVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZHRva2VuKCkge1xuICAgIGlmKC9bXlxcZFxcd19dLy50ZXN0KGMpKSB7XG4gICAgICB2YXIgY29udGVudHN0ciA9IGNvbnRlbnQuam9pbignJylcbiAgICAgIGlmKGFsbExpdGVyYWxzLmluZGV4T2YoY29udGVudHN0cikgPiAtMSkge1xuICAgICAgICBtb2RlID0gS0VZV09SRFxuICAgICAgfSBlbHNlIGlmKGFsbEJ1aWx0aW5zLmluZGV4T2YoY29udGVudHN0cikgPiAtMSkge1xuICAgICAgICBtb2RlID0gQlVJTFRJTlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kZSA9IElERU5UXG4gICAgICB9XG4gICAgICB0b2tlbihjb250ZW50LmpvaW4oJycpKVxuICAgICAgbW9kZSA9IE5PUk1BTFxuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gICAgY29udGVudC5wdXNoKGMpXG4gICAgbGFzdCA9IGNcbiAgICByZXR1cm4gaSArIDFcbiAgfVxufVxuIiwiLy8gMzAwZXMgYnVpbHRpbnMvcmVzZXJ2ZWQgd29yZHMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgdmFsaWQgaW4gdjEwMFxudmFyIHYxMDAgPSByZXF1aXJlKCcuL2J1aWx0aW5zJylcblxuLy8gVGhlIHRleHR1cmUyRHxDdWJlIGZ1bmN0aW9ucyBoYXZlIGJlZW4gcmVtb3ZlZFxuLy8gQW5kIHRoZSBnbF8gZmVhdHVyZXMgYXJlIHVwZGF0ZWRcbnYxMDAgPSB2MTAwLnNsaWNlKCkuZmlsdGVyKGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhL14oZ2xcXF98dGV4dHVyZSkvLnRlc3QoYilcbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gdjEwMC5jb25jYXQoW1xuICAvLyB0aGUgdXBkYXRlZCBnbF8gY29uc3RhbnRzXG4gICAgJ2dsX1ZlcnRleElEJ1xuICAsICdnbF9JbnN0YW5jZUlEJ1xuICAsICdnbF9Qb3NpdGlvbidcbiAgLCAnZ2xfUG9pbnRTaXplJ1xuICAsICdnbF9GcmFnQ29vcmQnXG4gICwgJ2dsX0Zyb250RmFjaW5nJ1xuICAsICdnbF9GcmFnRGVwdGgnXG4gICwgJ2dsX1BvaW50Q29vcmQnXG4gICwgJ2dsX01heFZlcnRleEF0dHJpYnMnXG4gICwgJ2dsX01heFZlcnRleFVuaWZvcm1WZWN0b3JzJ1xuICAsICdnbF9NYXhWZXJ0ZXhPdXRwdXRWZWN0b3JzJ1xuICAsICdnbF9NYXhGcmFnbWVudElucHV0VmVjdG9ycydcbiAgLCAnZ2xfTWF4VmVydGV4VGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heENvbWJpbmVkVGV4dHVyZUltYWdlVW5pdHMnXG4gICwgJ2dsX01heFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhGcmFnbWVudFVuaWZvcm1WZWN0b3JzJ1xuICAsICdnbF9NYXhEcmF3QnVmZmVycydcbiAgLCAnZ2xfTWluUHJvZ3JhbVRleGVsT2Zmc2V0J1xuICAsICdnbF9NYXhQcm9ncmFtVGV4ZWxPZmZzZXQnXG4gICwgJ2dsX0RlcHRoUmFuZ2VQYXJhbWV0ZXJzJ1xuICAsICdnbF9EZXB0aFJhbmdlJ1xuXG4gIC8vIG90aGVyIGJ1aWx0aW5zXG4gICwgJ3RydW5jJ1xuICAsICdyb3VuZCdcbiAgLCAncm91bmRFdmVuJ1xuICAsICdpc25hbidcbiAgLCAnaXNpbmYnXG4gICwgJ2Zsb2F0Qml0c1RvSW50J1xuICAsICdmbG9hdEJpdHNUb1VpbnQnXG4gICwgJ2ludEJpdHNUb0Zsb2F0J1xuICAsICd1aW50Qml0c1RvRmxvYXQnXG4gICwgJ3BhY2tTbm9ybTJ4MTYnXG4gICwgJ3VucGFja1Nub3JtMngxNidcbiAgLCAncGFja1Vub3JtMngxNidcbiAgLCAndW5wYWNrVW5vcm0yeDE2J1xuICAsICdwYWNrSGFsZjJ4MTYnXG4gICwgJ3VucGFja0hhbGYyeDE2J1xuICAsICdvdXRlclByb2R1Y3QnXG4gICwgJ3RyYW5zcG9zZSdcbiAgLCAnZGV0ZXJtaW5hbnQnXG4gICwgJ2ludmVyc2UnXG4gICwgJ3RleHR1cmUnXG4gICwgJ3RleHR1cmVTaXplJ1xuICAsICd0ZXh0dXJlUHJvaidcbiAgLCAndGV4dHVyZUxvZCdcbiAgLCAndGV4dHVyZU9mZnNldCdcbiAgLCAndGV4ZWxGZXRjaCdcbiAgLCAndGV4ZWxGZXRjaE9mZnNldCdcbiAgLCAndGV4dHVyZVByb2pPZmZzZXQnXG4gICwgJ3RleHR1cmVMb2RPZmZzZXQnXG4gICwgJ3RleHR1cmVQcm9qTG9kJ1xuICAsICd0ZXh0dXJlUHJvakxvZE9mZnNldCdcbiAgLCAndGV4dHVyZUdyYWQnXG4gICwgJ3RleHR1cmVHcmFkT2Zmc2V0J1xuICAsICd0ZXh0dXJlUHJvakdyYWQnXG4gICwgJ3RleHR1cmVQcm9qR3JhZE9mZnNldCdcbl0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgLy8gS2VlcCB0aGlzIGxpc3Qgc29ydGVkXG4gICdhYnMnXG4gICwgJ2Fjb3MnXG4gICwgJ2FsbCdcbiAgLCAnYW55J1xuICAsICdhc2luJ1xuICAsICdhdGFuJ1xuICAsICdjZWlsJ1xuICAsICdjbGFtcCdcbiAgLCAnY29zJ1xuICAsICdjcm9zcydcbiAgLCAnZEZkeCdcbiAgLCAnZEZkeSdcbiAgLCAnZGVncmVlcydcbiAgLCAnZGlzdGFuY2UnXG4gICwgJ2RvdCdcbiAgLCAnZXF1YWwnXG4gICwgJ2V4cCdcbiAgLCAnZXhwMidcbiAgLCAnZmFjZWZvcndhcmQnXG4gICwgJ2Zsb29yJ1xuICAsICdmcmFjdCdcbiAgLCAnZ2xfQmFja0NvbG9yJ1xuICAsICdnbF9CYWNrTGlnaHRNb2RlbFByb2R1Y3QnXG4gICwgJ2dsX0JhY2tMaWdodFByb2R1Y3QnXG4gICwgJ2dsX0JhY2tNYXRlcmlhbCdcbiAgLCAnZ2xfQmFja1NlY29uZGFyeUNvbG9yJ1xuICAsICdnbF9DbGlwUGxhbmUnXG4gICwgJ2dsX0NsaXBWZXJ0ZXgnXG4gICwgJ2dsX0NvbG9yJ1xuICAsICdnbF9EZXB0aFJhbmdlJ1xuICAsICdnbF9EZXB0aFJhbmdlUGFyYW1ldGVycydcbiAgLCAnZ2xfRXllUGxhbmVRJ1xuICAsICdnbF9FeWVQbGFuZVInXG4gICwgJ2dsX0V5ZVBsYW5lUydcbiAgLCAnZ2xfRXllUGxhbmVUJ1xuICAsICdnbF9Gb2cnXG4gICwgJ2dsX0ZvZ0Nvb3JkJ1xuICAsICdnbF9Gb2dGcmFnQ29vcmQnXG4gICwgJ2dsX0ZvZ1BhcmFtZXRlcnMnXG4gICwgJ2dsX0ZyYWdDb2xvcidcbiAgLCAnZ2xfRnJhZ0Nvb3JkJ1xuICAsICdnbF9GcmFnRGF0YSdcbiAgLCAnZ2xfRnJhZ0RlcHRoJ1xuICAsICdnbF9GcmFnRGVwdGhFWFQnXG4gICwgJ2dsX0Zyb250Q29sb3InXG4gICwgJ2dsX0Zyb250RmFjaW5nJ1xuICAsICdnbF9Gcm9udExpZ2h0TW9kZWxQcm9kdWN0J1xuICAsICdnbF9Gcm9udExpZ2h0UHJvZHVjdCdcbiAgLCAnZ2xfRnJvbnRNYXRlcmlhbCdcbiAgLCAnZ2xfRnJvbnRTZWNvbmRhcnlDb2xvcidcbiAgLCAnZ2xfTGlnaHRNb2RlbCdcbiAgLCAnZ2xfTGlnaHRNb2RlbFBhcmFtZXRlcnMnXG4gICwgJ2dsX0xpZ2h0TW9kZWxQcm9kdWN0cydcbiAgLCAnZ2xfTGlnaHRQcm9kdWN0cydcbiAgLCAnZ2xfTGlnaHRTb3VyY2UnXG4gICwgJ2dsX0xpZ2h0U291cmNlUGFyYW1ldGVycydcbiAgLCAnZ2xfTWF0ZXJpYWxQYXJhbWV0ZXJzJ1xuICAsICdnbF9NYXhDbGlwUGxhbmVzJ1xuICAsICdnbF9NYXhDb21iaW5lZFRleHR1cmVJbWFnZVVuaXRzJ1xuICAsICdnbF9NYXhEcmF3QnVmZmVycydcbiAgLCAnZ2xfTWF4RnJhZ21lbnRVbmlmb3JtQ29tcG9uZW50cydcbiAgLCAnZ2xfTWF4TGlnaHRzJ1xuICAsICdnbF9NYXhUZXh0dXJlQ29vcmRzJ1xuICAsICdnbF9NYXhUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4VGV4dHVyZVVuaXRzJ1xuICAsICdnbF9NYXhWYXJ5aW5nRmxvYXRzJ1xuICAsICdnbF9NYXhWZXJ0ZXhBdHRyaWJzJ1xuICAsICdnbF9NYXhWZXJ0ZXhUZXh0dXJlSW1hZ2VVbml0cydcbiAgLCAnZ2xfTWF4VmVydGV4VW5pZm9ybUNvbXBvbmVudHMnXG4gICwgJ2dsX01vZGVsVmlld01hdHJpeCdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfTW9kZWxWaWV3TWF0cml4VHJhbnNwb3NlJ1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4J1xuICAsICdnbF9Nb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4SW52ZXJzZSdcbiAgLCAnZ2xfTW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeEludmVyc2VUcmFuc3Bvc2UnXG4gICwgJ2dsX01vZGVsVmlld1Byb2plY3Rpb25NYXRyaXhUcmFuc3Bvc2UnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQwJ1xuICAsICdnbF9NdWx0aVRleENvb3JkMSdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDInXG4gICwgJ2dsX011bHRpVGV4Q29vcmQzJ1xuICAsICdnbF9NdWx0aVRleENvb3JkNCdcbiAgLCAnZ2xfTXVsdGlUZXhDb29yZDUnXG4gICwgJ2dsX011bHRpVGV4Q29vcmQ2J1xuICAsICdnbF9NdWx0aVRleENvb3JkNydcbiAgLCAnZ2xfTm9ybWFsJ1xuICAsICdnbF9Ob3JtYWxNYXRyaXgnXG4gICwgJ2dsX05vcm1hbFNjYWxlJ1xuICAsICdnbF9PYmplY3RQbGFuZVEnXG4gICwgJ2dsX09iamVjdFBsYW5lUidcbiAgLCAnZ2xfT2JqZWN0UGxhbmVTJ1xuICAsICdnbF9PYmplY3RQbGFuZVQnXG4gICwgJ2dsX1BvaW50J1xuICAsICdnbF9Qb2ludENvb3JkJ1xuICAsICdnbF9Qb2ludFBhcmFtZXRlcnMnXG4gICwgJ2dsX1BvaW50U2l6ZSdcbiAgLCAnZ2xfUG9zaXRpb24nXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXgnXG4gICwgJ2dsX1Byb2plY3Rpb25NYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9Qcm9qZWN0aW9uTWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfUHJvamVjdGlvbk1hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfU2Vjb25kYXJ5Q29sb3InXG4gICwgJ2dsX1RleENvb3JkJ1xuICAsICdnbF9UZXh0dXJlRW52Q29sb3InXG4gICwgJ2dsX1RleHR1cmVNYXRyaXgnXG4gICwgJ2dsX1RleHR1cmVNYXRyaXhJbnZlcnNlJ1xuICAsICdnbF9UZXh0dXJlTWF0cml4SW52ZXJzZVRyYW5zcG9zZSdcbiAgLCAnZ2xfVGV4dHVyZU1hdHJpeFRyYW5zcG9zZSdcbiAgLCAnZ2xfVmVydGV4J1xuICAsICdncmVhdGVyVGhhbidcbiAgLCAnZ3JlYXRlclRoYW5FcXVhbCdcbiAgLCAnaW52ZXJzZXNxcnQnXG4gICwgJ2xlbmd0aCdcbiAgLCAnbGVzc1RoYW4nXG4gICwgJ2xlc3NUaGFuRXF1YWwnXG4gICwgJ2xvZydcbiAgLCAnbG9nMidcbiAgLCAnbWF0cml4Q29tcE11bHQnXG4gICwgJ21heCdcbiAgLCAnbWluJ1xuICAsICdtaXgnXG4gICwgJ21vZCdcbiAgLCAnbm9ybWFsaXplJ1xuICAsICdub3QnXG4gICwgJ25vdEVxdWFsJ1xuICAsICdwb3cnXG4gICwgJ3JhZGlhbnMnXG4gICwgJ3JlZmxlY3QnXG4gICwgJ3JlZnJhY3QnXG4gICwgJ3NpZ24nXG4gICwgJ3NpbidcbiAgLCAnc21vb3Roc3RlcCdcbiAgLCAnc3FydCdcbiAgLCAnc3RlcCdcbiAgLCAndGFuJ1xuICAsICd0ZXh0dXJlMkQnXG4gICwgJ3RleHR1cmUyRExvZCdcbiAgLCAndGV4dHVyZTJEUHJvaidcbiAgLCAndGV4dHVyZTJEUHJvakxvZCdcbiAgLCAndGV4dHVyZUN1YmUnXG4gICwgJ3RleHR1cmVDdWJlTG9kJ1xuICAsICd0ZXh0dXJlMkRMb2RFWFQnXG4gICwgJ3RleHR1cmUyRFByb2pMb2RFWFQnXG4gICwgJ3RleHR1cmVDdWJlTG9kRVhUJ1xuICAsICd0ZXh0dXJlMkRHcmFkRVhUJ1xuICAsICd0ZXh0dXJlMkRQcm9qR3JhZEVYVCdcbiAgLCAndGV4dHVyZUN1YmVHcmFkRVhUJ1xuXVxuIiwidmFyIHYxMDAgPSByZXF1aXJlKCcuL2xpdGVyYWxzJylcblxubW9kdWxlLmV4cG9ydHMgPSB2MTAwLnNsaWNlKCkuY29uY2F0KFtcbiAgICdsYXlvdXQnXG4gICwgJ2NlbnRyb2lkJ1xuICAsICdzbW9vdGgnXG4gICwgJ2Nhc2UnXG4gICwgJ21hdDJ4MidcbiAgLCAnbWF0MngzJ1xuICAsICdtYXQyeDQnXG4gICwgJ21hdDN4MidcbiAgLCAnbWF0M3gzJ1xuICAsICdtYXQzeDQnXG4gICwgJ21hdDR4MidcbiAgLCAnbWF0NHgzJ1xuICAsICdtYXQ0eDQnXG4gICwgJ3VpbnQnXG4gICwgJ3V2ZWMyJ1xuICAsICd1dmVjMydcbiAgLCAndXZlYzQnXG4gICwgJ3NhbXBsZXJDdWJlU2hhZG93J1xuICAsICdzYW1wbGVyMkRBcnJheSdcbiAgLCAnc2FtcGxlcjJEQXJyYXlTaGFkb3cnXG4gICwgJ2lzYW1wbGVyMkQnXG4gICwgJ2lzYW1wbGVyM0QnXG4gICwgJ2lzYW1wbGVyQ3ViZSdcbiAgLCAnaXNhbXBsZXIyREFycmF5J1xuICAsICd1c2FtcGxlcjJEJ1xuICAsICd1c2FtcGxlcjNEJ1xuICAsICd1c2FtcGxlckN1YmUnXG4gICwgJ3VzYW1wbGVyMkRBcnJheSdcbiAgLCAnY29oZXJlbnQnXG4gICwgJ3Jlc3RyaWN0J1xuICAsICdyZWFkb25seSdcbiAgLCAnd3JpdGVvbmx5J1xuICAsICdyZXNvdXJjZSdcbiAgLCAnYXRvbWljX3VpbnQnXG4gICwgJ25vcGVyc3BlY3RpdmUnXG4gICwgJ3BhdGNoJ1xuICAsICdzYW1wbGUnXG4gICwgJ3N1YnJvdXRpbmUnXG4gICwgJ2NvbW1vbidcbiAgLCAncGFydGl0aW9uJ1xuICAsICdhY3RpdmUnXG4gICwgJ2ZpbHRlcidcbiAgLCAnaW1hZ2UxRCdcbiAgLCAnaW1hZ2UyRCdcbiAgLCAnaW1hZ2UzRCdcbiAgLCAnaW1hZ2VDdWJlJ1xuICAsICdpaW1hZ2UxRCdcbiAgLCAnaWltYWdlMkQnXG4gICwgJ2lpbWFnZTNEJ1xuICAsICdpaW1hZ2VDdWJlJ1xuICAsICd1aW1hZ2UxRCdcbiAgLCAndWltYWdlMkQnXG4gICwgJ3VpbWFnZTNEJ1xuICAsICd1aW1hZ2VDdWJlJ1xuICAsICdpbWFnZTFEQXJyYXknXG4gICwgJ2ltYWdlMkRBcnJheSdcbiAgLCAnaWltYWdlMURBcnJheSdcbiAgLCAnaWltYWdlMkRBcnJheSdcbiAgLCAndWltYWdlMURBcnJheSdcbiAgLCAndWltYWdlMkRBcnJheSdcbiAgLCAnaW1hZ2UxRFNoYWRvdydcbiAgLCAnaW1hZ2UyRFNoYWRvdydcbiAgLCAnaW1hZ2UxREFycmF5U2hhZG93J1xuICAsICdpbWFnZTJEQXJyYXlTaGFkb3cnXG4gICwgJ2ltYWdlQnVmZmVyJ1xuICAsICdpaW1hZ2VCdWZmZXInXG4gICwgJ3VpbWFnZUJ1ZmZlcidcbiAgLCAnc2FtcGxlcjFEQXJyYXknXG4gICwgJ3NhbXBsZXIxREFycmF5U2hhZG93J1xuICAsICdpc2FtcGxlcjFEJ1xuICAsICdpc2FtcGxlcjFEQXJyYXknXG4gICwgJ3VzYW1wbGVyMUQnXG4gICwgJ3VzYW1wbGVyMURBcnJheSdcbiAgLCAnaXNhbXBsZXIyRFJlY3QnXG4gICwgJ3VzYW1wbGVyMkRSZWN0J1xuICAsICdzYW1wbGVyQnVmZmVyJ1xuICAsICdpc2FtcGxlckJ1ZmZlcidcbiAgLCAndXNhbXBsZXJCdWZmZXInXG4gICwgJ3NhbXBsZXIyRE1TJ1xuICAsICdpc2FtcGxlcjJETVMnXG4gICwgJ3VzYW1wbGVyMkRNUydcbiAgLCAnc2FtcGxlcjJETVNBcnJheSdcbiAgLCAnaXNhbXBsZXIyRE1TQXJyYXknXG4gICwgJ3VzYW1wbGVyMkRNU0FycmF5J1xuXSlcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAvLyBjdXJyZW50XG4gICAgJ3ByZWNpc2lvbidcbiAgLCAnaGlnaHAnXG4gICwgJ21lZGl1bXAnXG4gICwgJ2xvd3AnXG4gICwgJ2F0dHJpYnV0ZSdcbiAgLCAnY29uc3QnXG4gICwgJ3VuaWZvcm0nXG4gICwgJ3ZhcnlpbmcnXG4gICwgJ2JyZWFrJ1xuICAsICdjb250aW51ZSdcbiAgLCAnZG8nXG4gICwgJ2ZvcidcbiAgLCAnd2hpbGUnXG4gICwgJ2lmJ1xuICAsICdlbHNlJ1xuICAsICdpbidcbiAgLCAnb3V0J1xuICAsICdpbm91dCdcbiAgLCAnZmxvYXQnXG4gICwgJ2ludCdcbiAgLCAndm9pZCdcbiAgLCAnYm9vbCdcbiAgLCAndHJ1ZSdcbiAgLCAnZmFsc2UnXG4gICwgJ2Rpc2NhcmQnXG4gICwgJ3JldHVybidcbiAgLCAnbWF0MidcbiAgLCAnbWF0MydcbiAgLCAnbWF0NCdcbiAgLCAndmVjMidcbiAgLCAndmVjMydcbiAgLCAndmVjNCdcbiAgLCAnaXZlYzInXG4gICwgJ2l2ZWMzJ1xuICAsICdpdmVjNCdcbiAgLCAnYnZlYzInXG4gICwgJ2J2ZWMzJ1xuICAsICdidmVjNCdcbiAgLCAnc2FtcGxlcjFEJ1xuICAsICdzYW1wbGVyMkQnXG4gICwgJ3NhbXBsZXIzRCdcbiAgLCAnc2FtcGxlckN1YmUnXG4gICwgJ3NhbXBsZXIxRFNoYWRvdydcbiAgLCAnc2FtcGxlcjJEU2hhZG93J1xuICAsICdzdHJ1Y3QnXG5cbiAgLy8gZnV0dXJlXG4gICwgJ2FzbSdcbiAgLCAnY2xhc3MnXG4gICwgJ3VuaW9uJ1xuICAsICdlbnVtJ1xuICAsICd0eXBlZGVmJ1xuICAsICd0ZW1wbGF0ZSdcbiAgLCAndGhpcydcbiAgLCAncGFja2VkJ1xuICAsICdnb3RvJ1xuICAsICdzd2l0Y2gnXG4gICwgJ2RlZmF1bHQnXG4gICwgJ2lubGluZSdcbiAgLCAnbm9pbmxpbmUnXG4gICwgJ3ZvbGF0aWxlJ1xuICAsICdwdWJsaWMnXG4gICwgJ3N0YXRpYydcbiAgLCAnZXh0ZXJuJ1xuICAsICdleHRlcm5hbCdcbiAgLCAnaW50ZXJmYWNlJ1xuICAsICdsb25nJ1xuICAsICdzaG9ydCdcbiAgLCAnZG91YmxlJ1xuICAsICdoYWxmJ1xuICAsICdmaXhlZCdcbiAgLCAndW5zaWduZWQnXG4gICwgJ2lucHV0J1xuICAsICdvdXRwdXQnXG4gICwgJ2h2ZWMyJ1xuICAsICdodmVjMydcbiAgLCAnaHZlYzQnXG4gICwgJ2R2ZWMyJ1xuICAsICdkdmVjMydcbiAgLCAnZHZlYzQnXG4gICwgJ2Z2ZWMyJ1xuICAsICdmdmVjMydcbiAgLCAnZnZlYzQnXG4gICwgJ3NhbXBsZXIyRFJlY3QnXG4gICwgJ3NhbXBsZXIzRFJlY3QnXG4gICwgJ3NhbXBsZXIyRFJlY3RTaGFkb3cnXG4gICwgJ3NpemVvZidcbiAgLCAnY2FzdCdcbiAgLCAnbmFtZXNwYWNlJ1xuICAsICd1c2luZydcbl1cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAgICc8PD0nXG4gICwgJz4+PSdcbiAgLCAnKysnXG4gICwgJy0tJ1xuICAsICc8PCdcbiAgLCAnPj4nXG4gICwgJzw9J1xuICAsICc+PSdcbiAgLCAnPT0nXG4gICwgJyE9J1xuICAsICcmJidcbiAgLCAnfHwnXG4gICwgJys9J1xuICAsICctPSdcbiAgLCAnKj0nXG4gICwgJy89J1xuICAsICclPSdcbiAgLCAnJj0nXG4gICwgJ15eJ1xuICAsICdePSdcbiAgLCAnfD0nXG4gICwgJygnXG4gICwgJyknXG4gICwgJ1snXG4gICwgJ10nXG4gICwgJy4nXG4gICwgJyEnXG4gICwgJ34nXG4gICwgJyonXG4gICwgJy8nXG4gICwgJyUnXG4gICwgJysnXG4gICwgJy0nXG4gICwgJzwnXG4gICwgJz4nXG4gICwgJyYnXG4gICwgJ14nXG4gICwgJ3wnXG4gICwgJz8nXG4gICwgJzonXG4gICwgJz0nXG4gICwgJywnXG4gICwgJzsnXG4gICwgJ3snXG4gICwgJ30nXG5dXG4iLCJ2YXIgdG9rZW5pemUgPSByZXF1aXJlKCcuL2luZGV4JylcblxubW9kdWxlLmV4cG9ydHMgPSB0b2tlbml6ZVN0cmluZ1xuXG5mdW5jdGlvbiB0b2tlbml6ZVN0cmluZyhzdHIsIG9wdCkge1xuICB2YXIgZ2VuZXJhdG9yID0gdG9rZW5pemUob3B0KVxuICB2YXIgdG9rZW5zID0gW11cblxuICB0b2tlbnMgPSB0b2tlbnMuY29uY2F0KGdlbmVyYXRvcihzdHIpKVxuICB0b2tlbnMgPSB0b2tlbnMuY29uY2F0KGdlbmVyYXRvcihudWxsKSlcblxuICByZXR1cm4gdG9rZW5zXG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8qIVxuICogcGFkLWxlZnQgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L3BhZC1sZWZ0PlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBKb24gU2NobGlua2VydC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciByZXBlYXQgPSByZXF1aXJlKCdyZXBlYXQtc3RyaW5nJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFkTGVmdChzdHIsIG51bSwgY2gpIHtcbiAgY2ggPSB0eXBlb2YgY2ggIT09ICd1bmRlZmluZWQnID8gKGNoICsgJycpIDogJyAnO1xuICByZXR1cm4gcmVwZWF0KGNoLCBudW0pICsgc3RyO1xufTsiLCIvKiFcbiAqIHJlcGVhdC1zdHJpbmcgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L3JlcGVhdC1zdHJpbmc+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEpvbiBTY2hsaW5rZXJ0LlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBSZXN1bHRzIGNhY2hlXG4gKi9cblxudmFyIHJlcyA9ICcnO1xudmFyIGNhY2hlO1xuXG4vKipcbiAqIEV4cG9zZSBgcmVwZWF0YFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gcmVwZWF0O1xuXG4vKipcbiAqIFJlcGVhdCB0aGUgZ2l2ZW4gYHN0cmluZ2AgdGhlIHNwZWNpZmllZCBgbnVtYmVyYFxuICogb2YgdGltZXMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKlxuICogYGBganNcbiAqIHZhciByZXBlYXQgPSByZXF1aXJlKCdyZXBlYXQtc3RyaW5nJyk7XG4gKiByZXBlYXQoJ0EnLCA1KTtcbiAqIC8vPT4gQUFBQUFcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBgc3RyaW5nYCBUaGUgc3RyaW5nIHRvIHJlcGVhdFxuICogQHBhcmFtIHtOdW1iZXJ9IGBudW1iZXJgIFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gUmVwZWF0ZWQgc3RyaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHJlcGVhdChzdHIsIG51bSkge1xuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdyZXBlYXQtc3RyaW5nIGV4cGVjdHMgYSBzdHJpbmcuJyk7XG4gIH1cblxuICAvLyBjb3ZlciBjb21tb24sIHF1aWNrIHVzZSBjYXNlc1xuICBpZiAobnVtID09PSAxKSByZXR1cm4gc3RyO1xuICBpZiAobnVtID09PSAyKSByZXR1cm4gc3RyICsgc3RyO1xuXG4gIHZhciBtYXggPSBzdHIubGVuZ3RoICogbnVtO1xuICBpZiAoY2FjaGUgIT09IHN0ciB8fCB0eXBlb2YgY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY2FjaGUgPSBzdHI7XG4gICAgcmVzID0gJyc7XG4gIH1cblxuICB3aGlsZSAobWF4ID4gcmVzLmxlbmd0aCAmJiBudW0gPiAwKSB7XG4gICAgaWYgKG51bSAmIDEpIHtcbiAgICAgIHJlcyArPSBzdHI7XG4gICAgfVxuXG4gICAgbnVtID4+PSAxO1xuICAgIGlmICghbnVtKSBicmVhaztcbiAgICBzdHIgKz0gc3RyO1xuICB9XG5cbiAgcmV0dXJuIHJlcy5zdWJzdHIoMCwgbWF4KTtcbn1cblxuIiwiKGZ1bmN0aW9uKHdpbmRvdykge1xuICAgIHZhciByZSA9IHtcbiAgICAgICAgbm90X3N0cmluZzogL1tec10vLFxuICAgICAgICBudW1iZXI6IC9bZGllZmddLyxcbiAgICAgICAganNvbjogL1tqXS8sXG4gICAgICAgIG5vdF9qc29uOiAvW15qXS8sXG4gICAgICAgIHRleHQ6IC9eW15cXHgyNV0rLyxcbiAgICAgICAgbW9kdWxvOiAvXlxceDI1ezJ9LyxcbiAgICAgICAgcGxhY2Vob2xkZXI6IC9eXFx4MjUoPzooWzEtOV1cXGQqKVxcJHxcXCgoW15cXCldKylcXCkpPyhcXCspPygwfCdbXiRdKT8oLSk/KFxcZCspPyg/OlxcLihcXGQrKSk/KFtiLWdpam9zdXhYXSkvLFxuICAgICAgICBrZXk6IC9eKFthLXpfXVthLXpfXFxkXSopL2ksXG4gICAgICAgIGtleV9hY2Nlc3M6IC9eXFwuKFthLXpfXVthLXpfXFxkXSopL2ksXG4gICAgICAgIGluZGV4X2FjY2VzczogL15cXFsoXFxkKylcXF0vLFxuICAgICAgICBzaWduOiAvXltcXCtcXC1dL1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNwcmludGYoKSB7XG4gICAgICAgIHZhciBrZXkgPSBhcmd1bWVudHNbMF0sIGNhY2hlID0gc3ByaW50Zi5jYWNoZVxuICAgICAgICBpZiAoIShjYWNoZVtrZXldICYmIGNhY2hlLmhhc093blByb3BlcnR5KGtleSkpKSB7XG4gICAgICAgICAgICBjYWNoZVtrZXldID0gc3ByaW50Zi5wYXJzZShrZXkpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNwcmludGYuZm9ybWF0LmNhbGwobnVsbCwgY2FjaGVba2V5XSwgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIHNwcmludGYuZm9ybWF0ID0gZnVuY3Rpb24ocGFyc2VfdHJlZSwgYXJndikge1xuICAgICAgICB2YXIgY3Vyc29yID0gMSwgdHJlZV9sZW5ndGggPSBwYXJzZV90cmVlLmxlbmd0aCwgbm9kZV90eXBlID0gXCJcIiwgYXJnLCBvdXRwdXQgPSBbXSwgaSwgaywgbWF0Y2gsIHBhZCwgcGFkX2NoYXJhY3RlciwgcGFkX2xlbmd0aCwgaXNfcG9zaXRpdmUgPSB0cnVlLCBzaWduID0gXCJcIlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdHJlZV9sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZV90eXBlID0gZ2V0X3R5cGUocGFyc2VfdHJlZVtpXSlcbiAgICAgICAgICAgIGlmIChub2RlX3R5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBwYXJzZV90cmVlW2ldXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChub2RlX3R5cGUgPT09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgICAgIG1hdGNoID0gcGFyc2VfdHJlZVtpXSAvLyBjb252ZW5pZW5jZSBwdXJwb3NlcyBvbmx5XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoWzJdKSB7IC8vIGtleXdvcmQgYXJndW1lbnRcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3JdXG4gICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCBtYXRjaFsyXS5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhcmcuaGFzT3duUHJvcGVydHkobWF0Y2hbMl1ba10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNwcmludGYoXCJbc3ByaW50Zl0gcHJvcGVydHkgJyVzJyBkb2VzIG5vdCBleGlzdFwiLCBtYXRjaFsyXVtrXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmdbbWF0Y2hbMl1ba11dXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWF0Y2hbMV0pIHsgLy8gcG9zaXRpb25hbCBhcmd1bWVudCAoZXhwbGljaXQpXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbbWF0Y2hbMV1dXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChpbXBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3IrK11cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZ2V0X3R5cGUoYXJnKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubm90X3N0cmluZy50ZXN0KG1hdGNoWzhdKSAmJiByZS5ub3RfanNvbi50ZXN0KG1hdGNoWzhdKSAmJiAoZ2V0X3R5cGUoYXJnKSAhPSBcIm51bWJlclwiICYmIGlzTmFOKGFyZykpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc3ByaW50ZihcIltzcHJpbnRmXSBleHBlY3RpbmcgbnVtYmVyIGJ1dCBmb3VuZCAlc1wiLCBnZXRfdHlwZShhcmcpKSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubnVtYmVyLnRlc3QobWF0Y2hbOF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzX3Bvc2l0aXZlID0gYXJnID49IDBcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG1hdGNoWzhdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJiXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoMilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gcGFyc2VJbnQoYXJnLCAxMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IEpTT04uc3RyaW5naWZ5KGFyZywgbnVsbCwgbWF0Y2hbNl0gPyBwYXJzZUludChtYXRjaFs2XSkgOiAwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gbWF0Y2hbN10gPyBhcmcudG9FeHBvbmVudGlhbChtYXRjaFs3XSkgOiBhcmcudG9FeHBvbmVudGlhbCgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBtYXRjaFs3XSA/IHBhcnNlRmxvYXQoYXJnKS50b0ZpeGVkKG1hdGNoWzddKSA6IHBhcnNlRmxvYXQoYXJnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZ1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gbWF0Y2hbN10gPyBwYXJzZUZsb2F0KGFyZykudG9QcmVjaXNpb24obWF0Y2hbN10pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoOClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9ICgoYXJnID0gU3RyaW5nKGFyZykpICYmIG1hdGNoWzddID8gYXJnLnN1YnN0cmluZygwLCBtYXRjaFs3XSkgOiBhcmcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcgPj4+IDBcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygxNilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygxNikudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmUuanNvbi50ZXN0KG1hdGNoWzhdKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBhcmdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChtYXRjaFs4XSkgJiYgKCFpc19wb3NpdGl2ZSB8fCBtYXRjaFszXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ24gPSBpc19wb3NpdGl2ZSA/IFwiK1wiIDogXCItXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy50b1N0cmluZygpLnJlcGxhY2UocmUuc2lnbiwgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ24gPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFkX2NoYXJhY3RlciA9IG1hdGNoWzRdID8gbWF0Y2hbNF0gPT09IFwiMFwiID8gXCIwXCIgOiBtYXRjaFs0XS5jaGFyQXQoMSkgOiBcIiBcIlxuICAgICAgICAgICAgICAgICAgICBwYWRfbGVuZ3RoID0gbWF0Y2hbNl0gLSAoc2lnbiArIGFyZykubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHBhZCA9IG1hdGNoWzZdID8gKHBhZF9sZW5ndGggPiAwID8gc3RyX3JlcGVhdChwYWRfY2hhcmFjdGVyLCBwYWRfbGVuZ3RoKSA6IFwiXCIpIDogXCJcIlxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbb3V0cHV0Lmxlbmd0aF0gPSBtYXRjaFs1XSA/IHNpZ24gKyBhcmcgKyBwYWQgOiAocGFkX2NoYXJhY3RlciA9PT0gXCIwXCIgPyBzaWduICsgcGFkICsgYXJnIDogcGFkICsgc2lnbiArIGFyZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXCIpXG4gICAgfVxuXG4gICAgc3ByaW50Zi5jYWNoZSA9IHt9XG5cbiAgICBzcHJpbnRmLnBhcnNlID0gZnVuY3Rpb24oZm10KSB7XG4gICAgICAgIHZhciBfZm10ID0gZm10LCBtYXRjaCA9IFtdLCBwYXJzZV90cmVlID0gW10sIGFyZ19uYW1lcyA9IDBcbiAgICAgICAgd2hpbGUgKF9mbXQpIHtcbiAgICAgICAgICAgIGlmICgobWF0Y2ggPSByZS50ZXh0LmV4ZWMoX2ZtdCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBtYXRjaFswXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUubW9kdWxvLmV4ZWMoX2ZtdCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VfdHJlZVtwYXJzZV90cmVlLmxlbmd0aF0gPSBcIiVcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUucGxhY2Vob2xkZXIuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDFcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkX2xpc3QgPSBbXSwgcmVwbGFjZW1lbnRfZmllbGQgPSBtYXRjaFsyXSwgZmllbGRfbWF0Y2ggPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5LmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdFtmaWVsZF9saXN0Lmxlbmd0aF0gPSBmaWVsZF9tYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChyZXBsYWNlbWVudF9maWVsZCA9IHJlcGxhY2VtZW50X2ZpZWxkLnN1YnN0cmluZyhmaWVsZF9tYXRjaFswXS5sZW5ndGgpKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZmllbGRfbWF0Y2ggPSByZS5rZXlfYWNjZXNzLmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZF9saXN0W2ZpZWxkX2xpc3QubGVuZ3RoXSA9IGZpZWxkX21hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKChmaWVsZF9tYXRjaCA9IHJlLmluZGV4X2FjY2Vzcy5leGVjKHJlcGxhY2VtZW50X2ZpZWxkKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdFtmaWVsZF9saXN0Lmxlbmd0aF0gPSBmaWVsZF9tYXRjaFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXlcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJbc3ByaW50Zl0gZmFpbGVkIHRvIHBhcnNlIG5hbWVkIGFyZ3VtZW50IGtleVwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gZmllbGRfbGlzdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ19uYW1lcyA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJbc3ByaW50Zl0gbWl4aW5nIHBvc2l0aW9uYWwgYW5kIG5hbWVkIHBsYWNlaG9sZGVycyBpcyBub3QgKHlldCkgc3VwcG9ydGVkXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcnNlX3RyZWVbcGFyc2VfdHJlZS5sZW5ndGhdID0gbWF0Y2hcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIltzcHJpbnRmXSB1bmV4cGVjdGVkIHBsYWNlaG9sZGVyXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfZm10ID0gX2ZtdC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJzZV90cmVlXG4gICAgfVxuXG4gICAgdmFyIHZzcHJpbnRmID0gZnVuY3Rpb24oZm10LCBhcmd2LCBfYXJndikge1xuICAgICAgICBfYXJndiA9IChhcmd2IHx8IFtdKS5zbGljZSgwKVxuICAgICAgICBfYXJndi5zcGxpY2UoMCwgMCwgZm10KVxuICAgICAgICByZXR1cm4gc3ByaW50Zi5hcHBseShudWxsLCBfYXJndilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBoZWxwZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0X3R5cGUodmFyaWFibGUpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdHJfcmVwZWF0KGlucHV0LCBtdWx0aXBsaWVyKSB7XG4gICAgICAgIHJldHVybiBBcnJheShtdWx0aXBsaWVyICsgMSkuam9pbihpbnB1dClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBleHBvcnQgdG8gZWl0aGVyIGJyb3dzZXIgb3Igbm9kZS5qc1xuICAgICAqL1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBleHBvcnRzLnNwcmludGYgPSBzcHJpbnRmXG4gICAgICAgIGV4cG9ydHMudnNwcmludGYgPSB2c3ByaW50ZlxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgd2luZG93LnNwcmludGYgPSBzcHJpbnRmXG4gICAgICAgIHdpbmRvdy52c3ByaW50ZiA9IHZzcHJpbnRmXG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3ByaW50Zjogc3ByaW50ZixcbiAgICAgICAgICAgICAgICAgICAgdnNwcmludGY6IHZzcHJpbnRmXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIgPyB0aGlzIDogd2luZG93KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvLyAgVGltZXIgYmFzZWQgYW5pbWF0aW9uXG4vLyBUT0RPIGNsZWFuIHVwIGxpbnRpbmdcbi8qIGVzbGludC1kaXNhYmxlICovXG4vKiBnbG9iYWwgc2V0VGltZW91dCAqL1xuaW1wb3J0IHttZXJnZSwgbm9vcCwgc3BsYXR9IGZyb20gJy4uL3V0aWxzJztcblxudmFyIFF1ZXVlID0gW107XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZ4IHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5vcHQgPSBtZXJnZSh7XG4gICAgICBkZWxheTogMCxcbiAgICAgIGR1cmF0aW9uOiAxMDAwLFxuICAgICAgdHJhbnNpdGlvbjogeCA9PiB4LFxuICAgICAgb25Db21wdXRlOiBub29wLFxuICAgICAgb25Db21wbGV0ZTogbm9vcFxuICAgIH0sIG9wdGlvbnMpO1xuICB9XG5cbiAgc3RhcnQob3B0aW9ucykge1xuICAgIHRoaXMub3B0ID0gbWVyZ2UodGhpcy5vcHQsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMudGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5hbmltYXRpbmcgPSB0cnVlO1xuICAgIFF1ZXVlLnB1c2godGhpcyk7XG4gIH1cblxuICAvLyBwZXJmb3JtIGEgc3RlcCBpbiB0aGUgYW5pbWF0aW9uXG4gIHN0ZXAoKSB7XG4gICAgLy8gaWYgbm90IGFuaW1hdGluZywgdGhlbiByZXR1cm5cbiAgICBpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VGltZSA9IERhdGUubm93KCksXG4gICAgICB0aW1lID0gdGhpcy50aW1lLFxuICAgICAgb3B0ID0gdGhpcy5vcHQsXG4gICAgICBkZWxheSA9IG9wdC5kZWxheSxcbiAgICAgIGR1cmF0aW9uID0gb3B0LmR1cmF0aW9uLFxuICAgICAgZGVsdGEgPSAwO1xuICAgIC8vIGhvbGQgYW5pbWF0aW9uIGZvciB0aGUgZGVsYXlcbiAgICBpZiAoY3VycmVudFRpbWUgPCB0aW1lICsgZGVsYXkpIHtcbiAgICAgIG9wdC5vbkNvbXB1dGUuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGlmIGluIG91ciB0aW1lIHdpbmRvdywgdGhlbiBleGVjdXRlIGFuaW1hdGlvblxuICAgIGlmIChjdXJyZW50VGltZSA8IHRpbWUgKyBkZWxheSArIGR1cmF0aW9uKSB7XG4gICAgICBkZWx0YSA9IG9wdC50cmFuc2l0aW9uKChjdXJyZW50VGltZSAtIHRpbWUgLSBkZWxheSkgLyBkdXJhdGlvbik7XG4gICAgICBvcHQub25Db21wdXRlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgb3B0Lm9uQ29tcHV0ZS5jYWxsKHRoaXMsIDEpO1xuICAgICAgb3B0Lm9uQ29tcGxldGUuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY29tcHV0ZShmcm9tLCB0bywgZGVsdGEpIHtcbiAgICByZXR1cm4gZnJvbSArICh0byAtIGZyb20pICogZGVsdGE7XG4gIH1cbn1cblxuRnguUXVldWUgPSBRdWV1ZTtcblxuLy8gRWFzaW5nIGVxdWF0aW9uc1xuRnguVHJhbnNpdGlvbiA9IHtcbiAgbGluZWFyKHApIHtcbiAgICByZXR1cm4gcDtcbiAgfVxufTtcblxudmFyIFRyYW5zID0gRnguVHJhbnNpdGlvbjtcblxuRngucHJvdG90eXBlLnRpbWUgPSBudWxsO1xuXG5mdW5jdGlvbiBtYWtlVHJhbnModHJhbnNpdGlvbiwgcGFyYW1zKSB7XG4gIHBhcmFtcyA9IHNwbGF0KHBhcmFtcyk7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKHRyYW5zaXRpb24sIHtcbiAgICBlYXNlSW4ocG9zKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbihwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlT3V0KHBvcykge1xuICAgICAgcmV0dXJuIDEgLSB0cmFuc2l0aW9uKDEgLSBwb3MsIHBhcmFtcyk7XG4gICAgfSxcbiAgICBlYXNlSW5PdXQocG9zKSB7XG4gICAgICByZXR1cm4gKHBvcyA8PSAwLjUpID8gdHJhbnNpdGlvbigyICogcG9zLCBwYXJhbXMpIC8gMiA6XG4gICAgICAgICgyIC0gdHJhbnNpdGlvbigyICogKDEgLSBwb3MpLCBwYXJhbXMpKSAvIDI7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIHRyYW5zaXRpb25zID0ge1xuXG4gIFBvdyhwLCB4KSB7XG4gICAgcmV0dXJuIE1hdGgucG93KHAsIHhbMF0gfHwgNik7XG4gIH0sXG5cbiAgRXhwbyhwKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KDIsIDggKiAocCAtIDEpKTtcbiAgfSxcblxuICBDaXJjKHApIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc2luKE1hdGguYWNvcyhwKSk7XG4gIH0sXG5cbiAgU2luZShwKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnNpbigoMSAtIHApICogTWF0aC5QSSAvIDIpO1xuICB9LFxuXG4gIEJhY2socCwgeCkge1xuICAgIHggPSB4WzBdIHx8IDEuNjE4O1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCAyKSAqICgoeCArIDEpICogcCAtIHgpO1xuICB9LFxuXG4gIEJvdW5jZShwKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGZvciAobGV0IGEgPSAwLCBiID0gMTsgMTsgYSArPSBiLCBiIC89IDIpIHtcbiAgICAgIGlmIChwID49ICg3IC0gNCAqIGEpIC8gMTEpIHtcbiAgICAgICAgdmFsdWUgPSBiICogYiAtIE1hdGgucG93KCgxMSAtIDYgKiBhIC0gMTEgKiBwKSAvIDQsIDIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuXG4gIEVsYXN0aWMocCwgeCkge1xuICAgIHJldHVybiBNYXRoLnBvdygyLCAxMCAqIC0tcCkgKiBNYXRoLmNvcygyMCAqIHAgKiBNYXRoLlBJICogKHhbMF0gfHwgMSkgLyAzKTtcbiAgfVxuXG59O1xuXG5mb3IgKGNvbnN0IHQgaW4gdHJhbnNpdGlvbnMpIHtcbiAgVHJhbnNbdF0gPSBtYWtlVHJhbnModHJhbnNpdGlvbnNbdF0pO1xufVxuXG5bJ1F1YWQnLCAnQ3ViaWMnLCAnUXVhcnQnLCAnUXVpbnQnXS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0sIGkpIHtcbiAgVHJhbnNbZWxlbV0gPSBtYWtlVHJhbnMoZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiBNYXRoLnBvdyhwLCBbXG4gICAgICBpICsgMlxuICAgIF0pO1xuICB9KTtcbn0pO1xuXG4vLyBhbmltYXRpb25UaW1lIC0gZnVuY3Rpb24gYnJhbmNoaW5nXG5cbi8vICByeWU6IFRPRE8tIHJlZmFjdG9yIGdsb2JhbCBkZWZpbml0aW9uIHdoZW4gd2UgZGVmaW5lIHRoZSB0d29cbi8vICAgICAgICAgICAgIChicm93c2VyaWZ5LzxzY3JpcHQ+KSBidWlsZCBwYXRocy5cbnZhciBnbG9iYWw7XG50cnkge1xuICBnbG9iYWwgPSB3aW5kb3c7XG59IGNhdGNoIChlKSB7XG4gIGdsb2JhbCA9IG51bGw7XG59XG5cbnZhciBjaGVja0Z4UXVldWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9sZFF1ZXVlID0gUXVldWU7XG4gIFF1ZXVlID0gW107XG4gIGlmIChvbGRRdWV1ZS5sZW5ndGgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9sZFF1ZXVlLmxlbmd0aCwgZng7IGkgPCBsOyBpKyspIHtcbiAgICAgIGZ4ID0gb2xkUXVldWVbaV07XG4gICAgICBmeC5zdGVwKCk7XG4gICAgICBpZiAoZnguYW5pbWF0aW5nKSB7XG4gICAgICAgIFF1ZXVlLnB1c2goZngpO1xuICAgICAgfVxuICAgIH1cbiAgICBGeC5RdWV1ZSA9IFF1ZXVlO1xuICB9XG59O1xuXG5pZiAoZ2xvYmFsKSB7XG4gIHZhciBmb3VuZCA9IGZhbHNlO1xuICBbJ3dlYmtpdEFuaW1hdGlvblRpbWUnLCAnbW96QW5pbWF0aW9uVGltZScsICdhbmltYXRpb25UaW1lJyxcbiAgICd3ZWJraXRBbmltYXRpb25TdGFydFRpbWUnLCAnbW96QW5pbWF0aW9uU3RhcnRUaW1lJywgJ2FuaW1hdGlvblN0YXJ0VGltZSddXG4gICAgLmZvckVhY2goaW1wbCA9PiB7XG4gICAgICBpZiAoaW1wbCBpbiBnbG9iYWwpIHtcbiAgICAgICAgRnguYW5pbWF0aW9uVGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBnbG9iYWxbaW1wbF07XG4gICAgICAgIH07XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgaWYgKCFmb3VuZCkge1xuICAgIEZ4LmFuaW1hdGlvblRpbWUgPSBEYXRlLm5vdztcbiAgfVxuICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgLSBmdW5jdGlvbiBicmFuY2hpbmdcbiAgZm91bmQgPSBmYWxzZTtcbiAgWyd3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLCAnbW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lJyxcbiAgICdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGltcGwpIHtcbiAgICAgIGlmIChpbXBsIGluIGdsb2JhbCkge1xuICAgICAgICBGeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgIGdsb2JhbFtpbXBsXShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgRngucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNoZWNrRnhRdWV1ZSgpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSwgMTAwMCAvIDYwKTtcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQgUHJvZ3JhbSBmcm9tICcuLi93ZWJnbC9wcm9ncmFtJztcbmltcG9ydCBTaGFkZXJzIGZyb20gJy4uL3NoYWRlcnMnO1xuaW1wb3J0IHtYSFJHcm91cH0gZnJvbSAnLi4vaW8nO1xuaW1wb3J0IHttZXJnZX0gZnJvbSAnLi4vdXRpbHMnO1xuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5cbi8vIEFsdGVybmF0ZSBjb25zdHJ1Y3RvclxuLy8gQnVpbGQgcHJvZ3JhbSBmcm9tIGRlZmF1bHQgc2hhZGVycyAocmVxdWlyZXMgU2hhZGVycylcbmV4cG9ydCBmdW5jdGlvbiBtYWtlUHJvZ3JhbWZyb21EZWZhdWx0U2hhZGVycyhnbCwgaWQpIHtcbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7XG4gICAgdnM6IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQsXG4gICAgZnM6IFNoYWRlcnMuRnJhZ21lbnQuRGVmYXVsdCxcbiAgICBpZFxuICB9KTtcbn1cblxuLy8gQ3JlYXRlIGEgcHJvZ3JhbSBmcm9tIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVyIG5vZGUgaWRzXG4vLyBAZGVwcmVjYXRlZCAtIFVzZSBnbHNsaWZ5IGluc3RlYWRcbmV4cG9ydCBmdW5jdGlvbiBtYWtlUHJvZ3JhbUZyb21IVE1MVGVtcGxhdGVzKGdsLCB2c0lkLCBmc0lkLCBpZCkge1xuICBjb25zdCB2cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZzSWQpLmlubmVySFRNTDtcbiAgY29uc3QgZnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmc0lkKS5pbm5lckhUTUw7XG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KTtcbn1cblxuLy8gTG9hZCBzaGFkZXJzIHVzaW5nIFhIUlxuLy8gQGRlcHJlY2F0ZWQgLSBVc2UgZ2xzbGlmeSBpbnN0ZWFkXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFrZVByb2dyYW1Gcm9tU2hhZGVyVVJJcyhnbCwgdnMsIGZzLCBvcHRzKSB7XG4gIG9wdHMgPSBtZXJnZSh7XG4gICAgcGF0aDogJy8nLFxuICAgIG5vQ2FjaGU6IGZhbHNlXG4gIH0sIG9wdHMpO1xuXG4gIGNvbnN0IHZlcnRleFNoYWRlclVSSSA9IG9wdHMucGF0aCArIHZzO1xuICBjb25zdCBmcmFnbWVudFNoYWRlclVSSSA9IG9wdHMucGF0aCArIGZzO1xuXG4gIGNvbnN0IHJlc3BvbnNlcyA9IGF3YWl0IG5ldyBYSFJHcm91cCh7XG4gICAgdXJsczogW3ZlcnRleFNoYWRlclVSSSwgZnJhZ21lbnRTaGFkZXJVUkldLFxuICAgIG5vQ2FjaGU6IG9wdHMubm9DYWNoZVxuICB9KS5zZW5kQXN5bmMoKTtcblxuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHt2czogcmVzcG9uc2VzWzBdLCBmczogcmVzcG9uc2VzWzFdfSk7XG59XG4iLCJpbXBvcnQge2RlZmF1bHQgYXMgRnh9IGZyb20gJy4vZngnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIFdvcmtlckdyb3VwfSBmcm9tICcuL3dvcmtlcnMnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0ICogYXMgc2F2ZUJpdG1hcCBmcm9tICcuL3NhdmUtYml0bWFwJztcblxuZXhwb3J0IHtkZWZhdWx0IGFzIEZ4fSBmcm9tICcuL2Z4JztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBXb3JrZXJHcm91cH0gZnJvbSAnLi93b3JrZXJzJztcbmV4cG9ydCAqIGZyb20gJy4vaGVscGVycyc7XG5leHBvcnQgKiBmcm9tICcuL3NhdmUtYml0bWFwJztcblxuLyogZ2xvYmFsIHdpbmRvdyAqL1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5MdW1hR0wpIHtcbiAgd2luZG93Lkx1bWFHTC5hZGRvbnMgPSB7XG4gICAgRng6IEZ4LFxuICAgIFdvcmtlckdyb3VwOiBXb3JrZXJHcm91cFxuICB9O1xuICBPYmplY3QuYXNzaWduKHdpbmRvdy5MdW1hR0wuYWRkb25zLCBoZWxwZXJzKTtcbiAgT2JqZWN0LmFzc2lnbih3aW5kb3cuTHVtYUdMLmFkZG9ucywgc2F2ZUJpdG1hcCk7XG59XG4iLCJpbXBvcnQge3NhdmVBc30gZnJvbSAnZmlsZXNhdmVyLmpzJztcbmltcG9ydCB7ZGVmYXVsdCBhcyB0b0Jsb2J9IGZyb20gJ2NhbnZhcy10by1ibG9iJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVCaXRtYXAoY2FudmFzLCBmaWxlbmFtZSkge1xuICBjb25zdCBibG9iID0gdG9CbG9iKGNhbnZhcy50b0RhdGFVUkwoKSk7XG4gIHNhdmVBcyhibG9iLCBmaWxlbmFtZSk7XG59XG4iLCIvLyB3b3JrZXJzLmpzXG4vL1xuLyogZ2xvYmFsIFdvcmtlciAqL1xuLyogZXNsaW50LWRpc2FibGUgb25lLXZhciwgaW5kZW50ICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdvcmtlckdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihmaWxlTmFtZSwgbikge1xuICAgIHZhciB3b3JrZXJzID0gdGhpcy53b3JrZXJzID0gW107XG4gICAgd2hpbGUgKG4tLSkge1xuICAgICAgd29ya2Vycy5wdXNoKG5ldyBXb3JrZXIoZmlsZU5hbWUpKTtcbiAgICB9XG4gIH1cblxuICBtYXAoZnVuYykge1xuICAgIHZhciB3b3JrZXJzID0gdGhpcy53b3JrZXJzO1xuICAgIHZhciBjb25maWdzID0gdGhpcy5jb25maWdzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHdvcmtlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBjb25maWdzLnB1c2goZnVuYyAmJiBmdW5jKGkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlZHVjZShvcHQpIHtcbiAgICB2YXIgZm4gPSBvcHQucmVkdWNlRm4sXG4gICAgICAgIHdvcmtlcnMgPSB0aGlzLndvcmtlcnMsXG4gICAgICAgIGNvbmZpZ3MgPSB0aGlzLmNvbmZpZ3MsXG4gICAgICAgIGwgPSB3b3JrZXJzLmxlbmd0aCxcbiAgICAgICAgYWN1bSA9IG9wdC5pbml0aWFsVmFsdWUsXG4gICAgICAgIG1lc3NhZ2UgPSBmdW5jdGlvbiBfKGUpIHtcbiAgICAgICAgICBsLS07XG4gICAgICAgICAgaWYgKGFjdW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYWN1bSA9IGUuZGF0YTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWN1bSA9IGZuKGFjdW0sIGUuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsID09PSAwKSB7XG4gICAgICAgICAgICBvcHQub25Db21wbGV0ZShhY3VtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgZm9yICh2YXIgaSA9IDAsIGxuID0gbDsgaSA8IGxuOyBpKyspIHtcbiAgICAgIHZhciB3ID0gd29ya2Vyc1tpXTtcbiAgICAgIHcub25tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgIHcucG9zdE1lc3NhZ2UoY29uZmlnc1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuIiwiLy8gUHJvdmlkZXMgbG9hZGluZyBvZiBhc3NldHMgd2l0aCBYSFIgYW5kIEpTT05QIG1ldGhvZHMuXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4sIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGRvY3VtZW50LCBYTUxIdHRwUmVxdWVzdCwgSW1hZ2UgKi9cbmltcG9ydCB7dWlkLCBzcGxhdCwgbWVyZ2UsIG5vb3B9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vd2ViZ2wnO1xuXG5leHBvcnQgY2xhc3MgWEhSIHtcblxuICBjb25zdHJ1Y3RvcihvcHQgPSB7fSkge1xuICAgIG9wdCA9IHtcbiAgICAgIHVybDogJ2h0dHA6Ly8gcGhpbG9nbGpzLm9yZy8nLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgbm9DYWNoZTogZmFsc2UsXG4gICAgICAvLyBib2R5OiBudWxsLFxuICAgICAgc2VuZEFzQmluYXJ5OiBmYWxzZSxcbiAgICAgIHJlc3BvbnNlVHlwZTogZmFsc2UsXG4gICAgICBvblByb2dyZXNzOiBub29wLFxuICAgICAgb25TdWNjZXNzOiBub29wLFxuICAgICAgb25FcnJvcjogbm9vcCxcbiAgICAgIG9uQWJvcnQ6IG5vb3AsXG4gICAgICBvbkNvbXBsZXRlOiBub29wLFxuICAgICAgLi4ub3B0XG4gICAgfTtcblxuICAgIHRoaXMub3B0ID0gb3B0O1xuICAgIHRoaXMuaW5pdFhIUigpO1xuICB9XG5cbiAgaW5pdFhIUigpIHtcbiAgICBjb25zdCByZXEgPSB0aGlzLnJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgWydQcm9ncmVzcycsICdFcnJvcicsICdBYm9ydCcsICdMb2FkJ10uZm9yRWFjaChldmVudCA9PiB7XG4gICAgICBpZiAocmVxLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgcmVxLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQudG9Mb3dlckNhc2UoKSwgZSA9PiB7XG4gICAgICAgICAgc2VsZlsnaGFuZGxlJyArIGV2ZW50XShlKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxWydvbicgKyBldmVudC50b0xvd2VyQ2FzZSgpXSA9IGUgPT4ge1xuICAgICAgICAgIHNlbGZbJ2hhbmRsZScgKyBldmVudF0oZSk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kQXN5bmMoYm9keSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB7cmVxLCBvcHR9ID0gdGhpcztcbiAgICAgIGNvbnN0IHthc3luY30gPSBvcHQ7XG5cbiAgICAgIGlmIChvcHQubm9DYWNoZSkge1xuICAgICAgICBvcHQudXJsICs9IChvcHQudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICAgICAgfVxuXG4gICAgICByZXEub3BlbihvcHQubWV0aG9kLCBvcHQudXJsLCBhc3luYyk7XG5cbiAgICAgIGlmIChvcHQucmVzcG9uc2VUeXBlKSB7XG4gICAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSBvcHQucmVzcG9uc2VUeXBlO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXN5bmMpIHtcbiAgICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWEhSLlN0YXRlLkNPTVBMRVRFRCkge1xuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1cykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdC5zZW5kQXNCaW5hcnkpIHtcbiAgICAgICAgcmVxLnNlbmRBc0JpbmFyeShib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxLnNlbmQoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFhc3luYykge1xuICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNlbmQoYm9keSkge1xuICAgIGNvbnN0IHtyZXEsIG9wdH0gPSB0aGlzO1xuICAgIGNvbnN0IGFzeW5jID0gb3B0LmFzeW5jO1xuXG4gICAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgICBvcHQudXJsICs9IChvcHQudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICAgIH1cblxuICAgIHJlcS5vcGVuKG9wdC5tZXRob2QsIG9wdC51cmwsIGFzeW5jKTtcblxuICAgIGlmIChvcHQucmVzcG9uc2VUeXBlKSB7XG4gICAgICByZXEucmVzcG9uc2VUeXBlID0gb3B0LnJlc3BvbnNlVHlwZTtcbiAgICB9XG5cbiAgICBpZiAoYXN5bmMpIHtcbiAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlID0+IHtcbiAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFIuU3RhdGUuQ09NUExFVEVEKSB7XG4gICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgb3B0Lm9uU3VjY2VzcyhyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdC5vbkVycm9yKHJlcS5zdGF0dXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAob3B0LnNlbmRBc0JpbmFyeSkge1xuICAgICAgcmVxLnNlbmRBc0JpbmFyeShib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXEuc2VuZChib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgIH1cblxuICAgIGlmICghYXN5bmMpIHtcbiAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgb3B0Lm9uU3VjY2VzcyhyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHQub25FcnJvcihyZXEuc3RhdHVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpIHtcbiAgICB0aGlzLnJlcS5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaGFuZGxlUHJvZ3Jlc3MoZSkge1xuICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgIHRoaXMub3B0Lm9uUHJvZ3Jlc3MoZSwgTWF0aC5yb3VuZChlLmxvYWRlZCAvIGUudG90YWwgKiAxMDApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcHQub25Qcm9ncmVzcyhlLCAtMSk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRXJyb3IoZSkge1xuICAgIHRoaXMub3B0Lm9uRXJyb3IoZSk7XG4gIH1cblxuICBoYW5kbGVBYm9ydChlKSB7XG4gICAgdGhpcy5vcHQub25BYm9ydChlKTtcbiAgfVxuXG4gIGhhbmRsZUxvYWQoZSkge1xuICAgIHRoaXMub3B0Lm9uQ29tcGxldGUoZSk7XG4gIH1cbn1cblxuWEhSLlN0YXRlID0ge307XG5bJ1VOSU5JVElBTElaRUQnLCAnTE9BRElORycsICdMT0FERUQnLCAnSU5URVJBQ1RJVkUnLCAnQ09NUExFVEVEJ11cbi5mb3JFYWNoKChzdGF0ZU5hbWUsIGkpID0+IHtcbiAgWEhSLlN0YXRlW3N0YXRlTmFtZV0gPSBpO1xufSk7XG5cbi8vIE1ha2UgcGFyYWxsZWwgcmVxdWVzdHMgYW5kIGdyb3VwIHRoZSByZXNwb25zZXMuXG5leHBvcnQgY2xhc3MgWEhSR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKG9wdCA9IHt9KSB7XG4gICAgb3B0ID0ge1xuICAgICAgdXJsczogW10sXG4gICAgICBvblN1Y2Nlc3M6IG5vb3AsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgYXN5bmM6IHRydWUsXG4gICAgICBub0NhY2hlOiBmYWxzZSxcbiAgICAgIC8vIGJvZHk6IG51bGwsXG4gICAgICBzZW5kQXNCaW5hcnk6IGZhbHNlLFxuICAgICAgcmVzcG9uc2VUeXBlOiBmYWxzZSxcbiAgICAgIC4uLm9wdFxuICAgIH07XG5cbiAgICB2YXIgdXJscyA9IHNwbGF0KG9wdC51cmxzKTtcbiAgICB0aGlzLnJlcXMgPSB1cmxzLm1hcCgodXJsLCBpKSA9PiBuZXcgWEhSKHtcbiAgICAgIHVybDogdXJsLFxuICAgICAgbWV0aG9kOiBvcHQubWV0aG9kLFxuICAgICAgYXN5bmM6IG9wdC5hc3luYyxcbiAgICAgIG5vQ2FjaGU6IG9wdC5ub0NhY2hlLFxuICAgICAgc2VuZEFzQmluYXJ5OiBvcHQuc2VuZEFzQmluYXJ5LFxuICAgICAgcmVzcG9uc2VUeXBlOiBvcHQucmVzcG9uc2VUeXBlLFxuICAgICAgYm9keTogb3B0LmJvZHlcbiAgICB9KSk7XG4gIH1cblxuICBhc3luYyBzZW5kQXN5bmMoKSB7XG4gICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHRoaXMucmVxcy5tYXAocmVxID0+IHJlcS5zZW5kQXN5bmMoKSkpO1xuICB9XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEpTT05QKG9wdCkge1xuICBvcHQgPSBtZXJnZSh7XG4gICAgdXJsOiAnaHR0cDovLyBwaGlsb2dsanMub3JnLycsXG4gICAgZGF0YToge30sXG4gICAgbm9DYWNoZTogZmFsc2UsXG4gICAgb25Db21wbGV0ZTogbm9vcCxcbiAgICBjYWxsYmFja0tleTogJ2NhbGxiYWNrJ1xuICB9LCBvcHQgfHwge30pO1xuXG4gIHZhciBpbmRleCA9IEpTT05QLmNvdW50ZXIrKztcbiAgLy8gY3JlYXRlIHF1ZXJ5IHN0cmluZ1xuICB2YXIgZGF0YSA9IFtdO1xuICBmb3IgKHZhciBwcm9wIGluIG9wdC5kYXRhKSB7XG4gICAgZGF0YS5wdXNoKHByb3AgKyAnPScgKyBvcHQuZGF0YVtwcm9wXSk7XG4gIH1cbiAgZGF0YSA9IGRhdGEuam9pbignJicpO1xuICAvLyBhcHBlbmQgdW5pcXVlIGlkIGZvciBjYWNoZVxuICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICBkYXRhICs9IChkYXRhLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZCgpO1xuICB9XG4gIC8vIGNyZWF0ZSBzb3VyY2UgdXJsXG4gIHZhciBzcmMgPSBvcHQudXJsICtcbiAgICAob3B0LnVybC5pbmRleE9mKCc/JykgPiAtMSA/ICcmJyA6ICc/JykgK1xuICAgIG9wdC5jYWxsYmFja0tleSArICc9UGhpbG9HTCBJTy5KU09OUC5yZXF1ZXN0cy5yZXF1ZXN0XycgKyBpbmRleCArXG4gICAgKGRhdGEubGVuZ3RoID4gMCA/ICcmJyArIGRhdGEgOiAnJyk7XG5cbiAgLy8gY3JlYXRlIHNjcmlwdFxuICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gIHNjcmlwdC5zcmMgPSBzcmM7XG5cbiAgLy8gY3JlYXRlIGNhbGxiYWNrXG4gIEpTT05QLnJlcXVlc3RzWydyZXF1ZXN0XycgKyBpbmRleF0gPSBmdW5jdGlvbihqc29uKSB7XG4gICAgb3B0Lm9uQ29tcGxldGUoanNvbik7XG4gICAgLy8gcmVtb3ZlIHNjcmlwdFxuICAgIGlmIChzY3JpcHQucGFyZW50Tm9kZSkge1xuICAgICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICB9XG4gICAgaWYgKHNjcmlwdC5jbGVhckF0dHJpYnV0ZXMpIHtcbiAgICAgIHNjcmlwdC5jbGVhckF0dHJpYnV0ZXMoKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gaW5qZWN0IHNjcmlwdFxuICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG59XG5cbkpTT05QLmNvdW50ZXIgPSAwO1xuSlNPTlAucmVxdWVzdHMgPSB7fTtcblxuLy8gQ3JlYXRlcyBhbiBpbWFnZS1sb2FkaW5nIHByb21pc2UuXG5mdW5jdGlvbiBsb2FkSW1hZ2Uoc3JjKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlc29sdmUoaW1hZ2UpO1xuICAgIH07XG4gICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihgQ291bGQgbm90IGxvYWQgaW1hZ2UgJHtzcmN9LmApKTtcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IHNyYztcbiAgfSk7XG59XG5cbi8vIExvYWQgbXVsdGlwbGUgaW1hZ2VzIGFzeW5jLlxuLy8gcnllOiBUT0RPIHRoaXMgbmVlZHMgdG8gaW1wbGVtZW50IGZ1bmN0aW9uYWxpdHkgZnJvbSB0aGVcbi8vICAgICAgICAgICBvcmlnaW5hbCBJbWFnZXMgZnVuY3Rpb24uXG5hc3luYyBmdW5jdGlvbiBsb2FkSW1hZ2VzKHNyY3MpIHtcbiAgbGV0IGltYWdlUHJvbWlzZXMgPSBzcmNzLm1hcCgoc3JjKSA9PiBsb2FkSW1hZ2Uoc3JjKSk7XG4gIGxldCByZXN1bHRzID0gW107XG4gIGZvciAoY29uc3QgaW1hZ2VQcm9taXNlIG9mIGltYWdlUHJvbWlzZXMpIHtcbiAgICByZXN1bHRzLnB1c2goYXdhaXQgaW1hZ2VQcm9taXNlKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gLy8gTG9hZCBtdWx0aXBsZSBJbWFnZSBhc3NldHMgYXN5bmNcbi8vIGV4cG9ydCBmdW5jdGlvbiBJbWFnZXMob3B0KSB7XG4vLyAgIG9wdCA9IG1lcmdlKHtcbi8vICAgICBzcmM6IFtdLFxuLy8gICAgIG5vQ2FjaGU6IGZhbHNlLFxuLy8gICAgIG9uUHJvZ3Jlc3M6IG5vb3AsXG4vLyAgICAgb25Db21wbGV0ZTogbm9vcFxuLy8gICB9LCBvcHQgfHwge30pO1xuLy9cbi8vICAgbGV0IGNvdW50ID0gMDtcbi8vICAgbGV0IGwgPSBvcHQuc3JjLmxlbmd0aDtcbi8vXG4vLyAgIGxldCBpbWFnZXM7XG4vLyAgIC8vIEltYWdlIG9ubG9hZCBoYW5kbGVyXG4vLyAgIHZhciBsb2FkID0gKCkgPT4ge1xuLy8gICAgIG9wdC5vblByb2dyZXNzKE1hdGgucm91bmQoKytjb3VudCAvIGwgKiAxMDApKTtcbi8vICAgICBpZiAoY291bnQgPT09IGwpIHtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKGltYWdlcyk7XG4vLyAgICAgfVxuLy8gICB9O1xuLy8gICAvLyBJbWFnZSBlcnJvciBoYW5kbGVyXG4vLyAgIHZhciBlcnJvciA9ICgpID0+IHtcbi8vICAgICBpZiAoKytjb3VudCA9PT0gbCkge1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoaW1hZ2VzKTtcbi8vICAgICB9XG4vLyAgIH07XG4vL1xuLy8gICAvLyB1aWQgZm9yIGltYWdlIHNvdXJjZXNcbi8vICAgY29uc3Qgbm9DYWNoZSA9IG9wdC5ub0NhY2hlO1xuLy8gICBjb25zdCB1aWQgPSB1aWQoKTtcbi8vICAgZnVuY3Rpb24gZ2V0U3VmZml4KHMpIHtcbi8vICAgICByZXR1cm4gKHMuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkO1xuLy8gICB9XG4vL1xuLy8gICAvLyBDcmVhdGUgaW1hZ2UgYXJyYXlcbi8vICAgaW1hZ2VzID0gb3B0LnNyYy5tYXAoKHNyYywgaSkgPT4ge1xuLy8gICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuLy8gICAgIGltZy5pbmRleCA9IGk7XG4vLyAgICAgaW1nLm9ubG9hZCA9IGxvYWQ7XG4vLyAgICAgaW1nLm9uZXJyb3IgPSBlcnJvcjtcbi8vICAgICBpbWcuc3JjID0gc3JjICsgKG5vQ2FjaGUgPyBnZXRTdWZmaXgoc3JjKSA6ICcnKTtcbi8vICAgICByZXR1cm4gaW1nO1xuLy8gICB9KTtcbi8vXG4vLyAgIHJldHVybiBpbWFnZXM7XG4vLyB9XG5cbi8vIExvYWQgbXVsdGlwbGUgdGV4dHVyZXMgZnJvbSBpbWFnZXNcbi8vIHJ5ZTogVE9ETyB0aGlzIG5lZWRzIHRvIGltcGxlbWVudCBmdW5jdGlvbmFsaXR5IGZyb21cbi8vICAgICAgICAgICB0aGUgb3JpZ2luYWwgbG9hZFRleHR1cmVzIGZ1bmN0aW9uLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRUZXh0dXJlcyhnbCwgb3B0KSB7XG4gIHZhciBpbWFnZXMgPSBhd2FpdCBsb2FkSW1hZ2VzKG9wdC5zcmMpO1xuICB2YXIgdGV4dHVyZXMgPSBbXTtcbiAgaW1hZ2VzLmZvckVhY2goKGltZywgaSkgPT4ge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5pc0FycmF5KG9wdC5wYXJhbWV0ZXJzKSA/XG4gICAgICBvcHQucGFyYW1ldGVyc1tpXSA6IG9wdC5wYXJhbWV0ZXJzO1xuICAgIHBhcmFtcyA9IHBhcmFtcyA9PT0gdW5kZWZpbmVkID8ge30gOiBwYXJhbXM7XG4gICAgdGV4dHVyZXMucHVzaChuZXcgVGV4dHVyZTJEKGdsLCBtZXJnZSh7XG4gICAgICBkYXRhOiBpbWdcbiAgICB9LCBwYXJhbXMpKSk7XG4gIH0pO1xuICByZXR1cm4gdGV4dHVyZXM7XG59XG5cbi8vIC8vIExvYWQgbXVsdGlwbGUgdGV4dHVyZXMgZnJvbSBpbWFnZXNcbi8vIGV4cG9ydCBmdW5jdGlvbiBsb2FkVGV4dHVyZXMob3B0ID0ge30pIHtcbi8vICAgb3B0ID0ge1xuLy8gICAgIHNyYzogW10sXG4vLyAgICAgbm9DYWNoZTogZmFsc2UsXG4vLyAgICAgb25Db21wbGV0ZTogbm9vcCxcbi8vICAgICAuLi5vcHRcbi8vICAgfTtcbi8vXG4vLyAgIEltYWdlcyh7XG4vLyAgICAgc3JjOiBvcHQuc3JjLFxuLy8gICAgIG5vQ2FjaGU6IG9wdC5ub0NhY2hlLFxuLy8gICAgIG9uQ29tcGxldGUoaW1hZ2VzKSB7XG4vLyAgICAgICB2YXIgdGV4dHVyZXMgPSB7fTtcbi8vICAgICAgIGltYWdlcy5mb3JFYWNoKChpbWcsIGkpID0+IHtcbi8vICAgICAgICAgdGV4dHVyZXNbb3B0LmlkICYmIG9wdC5pZFtpXSB8fCBvcHQuc3JjICYmIG9wdC5zcmNbaV1dID0gbWVyZ2Uoe1xuLy8gICAgICAgICAgIGRhdGE6IHtcbi8vICAgICAgICAgICAgIHZhbHVlOiBpbWdcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgIH0sIG9wdCk7XG4vLyAgICAgICB9KTtcbi8vICAgICAgIGFwcC5zZXRUZXh0dXJlcyh0ZXh0dXJlcyk7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZSgpO1xuLy8gICAgIH1cbi8vICAgfSk7XG4vLyB9XG4iLCIvLyBEZWZhdWx0IFNoYWRlcnNcbnZhciBnbHNsaWZ5ID0gcmVxdWlyZSgnZ2xzbGlmeScpO1xuXG4vLyBUT0RPIC0gYWRvcHQgZ2xzbGlmeVxuY29uc3QgU2hhZGVycyA9IHtcbiAgVmVydGV4OiB7XG4gICAgRGVmYXVsdDogZ2xzbGlmeSgnLi9kZWZhdWx0LXZlcnRleCcpXG4gIH0sXG4gIEZyYWdtZW50OiB7XG4gICAgRGVmYXVsdDogZ2xzbGlmeSgnLi9kZWZhdWx0LWZyYWdtZW50JylcbiAgfVxufTtcblxuU2hhZGVycy52cyA9IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQ7XG5TaGFkZXJzLmZzID0gU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG5leHBvcnQgZGVmYXVsdCBTaGFkZXJzO1xuXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4gKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLyoqXG4gKiBXcmFwcyB0aGUgYXJndW1lbnQgaW4gYW4gYXJyYXkgaWYgaXQgaXMgbm90IG9uZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhIC0gVGhlIG9iamVjdCB0byB3cmFwLlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5XG4gKiovXG5leHBvcnQgZnVuY3Rpb24gc3BsYXQoYSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhKSAmJiBhIHx8IFthXTtcbn1cblxuLyoqXG4qIFByb3ZpZGVzIGEgc3RhbmRhcmQgbm9vcCBmdW5jdGlvbi5cbioqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG52YXIgX3VpZCA9IERhdGUubm93KCk7XG5cbi8qKlxuICogUmV0dXJucyBhIFVJRC5cbiAqIEByZXR1cm4ge251bWJlcn0gdWlkXG4gKiovXG5leHBvcnQgZnVuY3Rpb24gdWlkKCkge1xuICByZXR1cm4gX3VpZCsrO1xufVxuXG4vKipcbiAqIE1lcmdlIG11bHRpcGxlIG9iamVjdHMgaW50byBvbmUuXG4gKiBAcGFyYW0gey4uLm9iamVjdH0gb2JqZWN0cyAtIFRoZSBvYmplY3RzIHRvIG1lcmdlLlxuICogQHJldHVybiB7b2JqZWN0fSBvYmplY3RcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZShvYmplY3RzKSB7XG4gIGNvbnN0IG1peCA9IHt9O1xuICBmb3IgKGxldCBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBvYmplY3QgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lICE9PSAnT2JqZWN0Jykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGNvbnN0IG9wID0gb2JqZWN0W2tleV07XG4gICAgICBjb25zdCBtcCA9IG1peFtrZXldO1xuICAgICAgaWYgKG1wICYmIG9wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnICYmXG4gICAgICAgIG1wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSB7XG4gICAgICAgIG1peFtrZXldID0gbWVyZ2UobXAsIG9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1peFtrZXldID0gZGV0YWNoKG9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1peDtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgZHVwbGljYXRpbmcgYW4gb2JqZWN0LlxuICogQHBhcmFtIHtvYmplY3R9IGVsZW0gLSBUaGUgb2JqZWN0IHRvIHJlY3Vyc2l2ZWx5IGR1cGxpY2F0ZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5mdW5jdGlvbiBkZXRhY2goZWxlbSkge1xuICBjb25zdCB0ID0gZWxlbS5jb25zdHJ1Y3Rvci5uYW1lO1xuICBsZXQgYW5zO1xuICBpZiAodCA9PT0gJ09iamVjdCcpIHtcbiAgICBhbnMgPSB7fTtcbiAgICBmb3IgKHZhciBwIGluIGVsZW0pIHtcbiAgICAgIGFuc1twXSA9IGRldGFjaChlbGVtW3BdKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodCA9PT0gJ0FycmF5Jykge1xuICAgIGFucyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZWxlbS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGFuc1tpXSA9IGRldGFjaChlbGVtW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYW5zID0gZWxlbTtcbiAgfVxuXG4gIHJldHVybiBhbnM7XG59XG5cbi8vIFRZUEVEIEFSUkFZU1xuXG5leHBvcnQgZnVuY3Rpb24gaXNUeXBlZEFycmF5KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5CWVRFU19QRVJfRUxFTUVOVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VUeXBlZEFycmF5KEFycmF5VHlwZSwgc291cmNlQXJyYXkpIHtcbiAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoc291cmNlQXJyYXkpKTtcbiAgY29uc3QgYXJyYXkgPSBuZXcgQXJyYXlUeXBlKHNvdXJjZUFycmF5Lmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlQXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICBhcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xuICB9XG4gIGNvbnNvbGUubG9nKGFycmF5KTtcbiAgcmV0dXJuIGFycmF5O1xufVxuIiwiLy8gRW5jYXBzdWxhdGVzIGEgV2ViR0xCdWZmZXIgb2JqZWN0XG5cbmltcG9ydCB7Z2V0RXh0ZW5zaW9uLCBnbENoZWNrRXJyb3J9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1ZmZlciB7XG5cbiAgc3RhdGljIGdldERlZmF1bHRPcHRzKGdsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1ZmZlclR5cGU6IGdsLkFSUkFZX0JVRkZFUixcbiAgICAgIHNpemU6IDEsXG4gICAgICBkYXRhVHlwZTogZ2wuRkxPQVQsXG4gICAgICBzdHJpZGU6IDAsXG4gICAgICBvZmZzZXQ6IDAsXG4gICAgICBkcmF3TW9kZTogZ2wuU1RBVElDX0RSQVcsXG4gICAgICBpbnN0YW5jZWQ6IDBcbiAgICB9O1xuICB9XG5cbiAgLypcbiAgICogQGNsYXNzZGVzY1xuICAgKiBTZXQgdXAgYSBnbCBidWZmZXIgb25jZSBhbmQgcmVwZWF0ZWRseSBiaW5kIGFuZCB1bmJpbmQgaXQuXG4gICAqIEhvbGRzIGFuIGF0dHJpYnV0ZSBuYW1lIGFzIGEgY29udmVuaWVuY2UuLi5cbiAgICpcbiAgICogQHBhcmFte30gb3B0cy5kYXRhIC0gbmF0aXZlIGFycmF5XG4gICAqIEBwYXJhbXtzdHJpbmd9IG9wdHMuYXR0cmlidXRlIC0gbmFtZSBvZiBhdHRyaWJ1dGUgZm9yIG1hdGNoaW5nXG4gICAqIEBwYXJhbXt9IG9wdHMuYnVmZmVyVHlwZSAtIGJ1ZmZlciB0eXBlIChjYWxsZWQgXCJ0YXJnZXRcIiBpbiBHTCBkb2NzKVxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBhc3NlcnQoZ2wsICdCdWZmZXIgbmVlZHMgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgQnVmZmVyLmdldERlZmF1bHRPcHRzKGdsKSwgb3B0cyk7XG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHRvZG8gLSByZW1vdmVcbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRlbGV0ZSgpO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgdXBkYXRlKG9wdHMgPSB7fSkge1xuICAgIGFzc2VydChvcHRzLmRhdGEsICdCdWZmZXIgbmVlZHMgZGF0YSBhcmd1bWVudCcpO1xuICAgIHRoaXMuYXR0cmlidXRlID0gb3B0cy5hdHRyaWJ1dGUgfHwgdGhpcy5hdHRyaWJ1dGU7XG4gICAgdGhpcy5idWZmZXJUeXBlID0gb3B0cy5idWZmZXJUeXBlIHx8IHRoaXMuYnVmZmVyVHlwZTtcbiAgICB0aGlzLnNpemUgPSBvcHRzLnNpemUgfHwgdGhpcy5zaXplO1xuICAgIHRoaXMuZGF0YVR5cGUgPSBvcHRzLmRhdGFUeXBlIHx8IHRoaXMuZGF0YVR5cGU7XG4gICAgdGhpcy5zdHJpZGUgPSBvcHRzLnN0cmlkZSB8fCB0aGlzLnN0cmlkZTtcbiAgICB0aGlzLm9mZnNldCA9IG9wdHMub2Zmc2V0IHx8IHRoaXMub2Zmc2V0O1xuICAgIHRoaXMuZHJhd01vZGUgPSBvcHRzLmRyYXdNb2RlIHx8IHRoaXMuZHJhd01vZGU7XG4gICAgdGhpcy5pbnN0YW5jZWQgPSBvcHRzLmluc3RhbmNlZCB8fCB0aGlzLmluc3RhbmNlZDtcblxuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YSB8fCB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmJ1ZmZlckRhdGEodGhpcy5kYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiBVcGRhdGVzIGRhdGEgaW4gdGhlIGJ1ZmZlciAqL1xuICBidWZmZXJEYXRhKGRhdGEpIHtcbiAgICBhc3NlcnQoZGF0YSwgJ0J1ZmZlci5idWZmZXJEYXRhIG5lZWRzIGRhdGEnKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5idWZmZXJUeXBlLCB0aGlzLmRhdGEsIHRoaXMuZHJhd01vZGUpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIC8vIEJpbmQgdGhlIGJ1ZmZlciBzbyB0aGF0IHdlIGNhbiBvcGVyYXRlIG9uIGl0XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIEVuYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFNwZWNpZnkgYnVmZmVyIGZvcm1hdFxuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoXG4gICAgICBsb2NhdGlvbixcbiAgICAgIHRoaXMuc2l6ZSwgdGhpcy5kYXRhVHlwZSwgZmFsc2UsIHRoaXMuc3RyaWRlLCB0aGlzLm9mZnNldFxuICAgICk7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2VkKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZ2wsICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgICAvLyBUaGlzIG1ha2VzIGl0IGFuIGluc3RhbmNlZCBhdHRyaWJ1dGVcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gQ2xlYXIgaW5zdGFuY2VkIGZsYWdcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDApO1xuICAgIH1cbiAgICAvLyBEaXNhYmxlIHRoZSBhdHRyaWJ1dGVcbiAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFVuYmluZCB0aGUgYnVmZmVyIHBlciB3ZWJnbCByZWNvbW1lbmRhdGlvbnNcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiIsIi8vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCByZWxhdGVkIG1ldGhvZHNcbi8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCwgbm8tY29uc29sZSwgbm8tbG9vcC1mdW5jICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgY29uc29sZSAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBDaGVja3MgaWYgV2ViR0wgaXMgZW5hYmxlZCBhbmQgY3JlYXRlcyBhIGNvbnRleHQgZm9yIHVzaW5nIFdlYkdMLlxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdMQ29udGV4dChjYW52YXMsIG9wdCA9IHt9KSB7XG4gIGlmICghaXNCcm93c2VyQ29udGV4dCgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBjcmVhdGUgYSBXZWJHTCBjb250ZXh0IG91dHNpZGUgYSBicm93c2VyIGNvbnRleHQuYCk7XG4gIH1cbiAgY2FudmFzID0gdHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycgP1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcykgOiBjYW52YXM7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmdsY29udGV4dGNyZWF0aW9uZXJyb3InLCBlID0+IHtcbiAgICBjb25zb2xlLmxvZyhlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgfSwgZmFsc2UpO1xuXG4gIC8vIFByZWZlciB3ZWJnbDIgb3ZlciB3ZWJnbDEsIHByZWZlciBjb25mb3JtYW50IG92ZXIgZXhwZXJpbWVudGFsXG4gIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbDInLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBvcHQpO1xuXG4gIGFzc2VydChnbCwgJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG5cbiAgLy8gU2V0IGFzIGRlYnVnIGhhbmRsZXJcbiAgZ2wgPSBvcHQuZGVidWcgPyBjcmVhdGVEZWJ1Z0NvbnRleHQoZ2wpIDogZ2w7XG5cbiAgLy8gQWRkIGEgc2FmZSBnZXQgbWV0aG9kXG4gIGdsLmdldCA9IGZ1bmN0aW9uIGdsR2V0KG5hbWUpIHtcbiAgICBsZXQgdmFsdWUgPSBuYW1lO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICAgIGFzc2VydCh2YWx1ZSwgYEFjY2Vzc2luZyBnbC4ke25hbWV9YCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICByZXR1cm4gZ2w7XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1dlYkdMKCkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBGZWF0dXJlIHRlc3QgV2ViR0xcbiAgdHJ5IHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICByZXR1cm4gQm9vbGVhbih3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0ICYmXG4gICAgICAoY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpKSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNFeHRlbnNpb24obmFtZSkge1xuICBpZiAoIWhhc1dlYkdMKCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fFxuICAgIGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcbiAgLy8gU2hvdWxkIG1heWJlIGJlIHJldHVybiAhIWNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuICByZXR1cm4gY29udGV4dC5nZXRFeHRlbnNpb24obmFtZSk7XG59XG5cbi8vIFJldHVybnMgdGhlIGV4dGVuc2lvbiBvciB0aHJvd3MgYW4gZXJyb3JcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpIHtcbiAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpO1xuICBhc3NlcnQoZXh0ZW5zaW9uLCBgJHtleHRlbnNpb25OYW1lfSBub3Qgc3VwcG9ydGVkIWApO1xuICByZXR1cm4gZXh0ZW5zaW9uO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJDb250ZXh0KCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lQnVmZmVyfSwgZnVuYykge1xuICBsZXQgc2Npc3NvclRlc3RXYXNFbmFibGVkO1xuICBpZiAoc2Npc3NvclRlc3QpIHtcbiAgICBzY2lzc29yVGVzdFdhc0VuYWJsZWQgPSBnbC5pc0VuYWJsZWQoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBjb25zdCB7eCwgeSwgdywgaH0gPSBzY2lzc29yVGVzdDtcbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIHksIHcsIGgpO1xuICB9XG5cbiAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyIHdlIG5lZWQgdG8gcmVtZW1iZXI/XG4gICAgZnJhbWVCdWZmZXIuYmluZCgpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBmdW5jKGdsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIXNjaXNzb3JUZXN0V2FzRW5hYmxlZCkge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlcj9cbiAgICAgIC8vIFRPRE8gLSBkZWxlZ2F0ZSBcInVuYmluZFwiIHRvIEZyYW1lYnVmZmVyIG9iamVjdD9cbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbENoZWNrRXJyb3IoZ2wpIHtcbiAgLy8gRW5zdXJlIGFsbCBlcnJvcnMgYXJlIGNsZWFyZWRcbiAgbGV0IGVycm9yO1xuICBsZXQgZ2xFcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIHdoaWxlIChnbEVycm9yICE9PSBnbC5OT19FUlJPUikge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSk7XG4gICAgfVxuICAgIGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB9XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSB7XG4gIHN3aXRjaCAoZ2xFcnJvcikge1xuICBjYXNlIGdsLkNPTlRFWFRfTE9TVF9XRUJHTDpcbiAgICAvLyAgSWYgdGhlIFdlYkdMIGNvbnRleHQgaXMgbG9zdCwgdGhpcyBlcnJvciBpcyByZXR1cm5lZCBvbiB0aGVcbiAgICAvLyBmaXJzdCBjYWxsIHRvIGdldEVycm9yLiBBZnRlcndhcmRzIGFuZCB1bnRpbCB0aGUgY29udGV4dCBoYXMgYmVlblxuICAgIC8vIHJlc3RvcmVkLCBpdCByZXR1cm5zIGdsLk5PX0VSUk9SLlxuICAgIHJldHVybiAnV2ViR0wgY29udGV4dCBsb3N0JztcblxuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50JztcblxuICBjYXNlIGdsLklOVkFMSURfVkFMVUU6XG4gICAgLy8gQSBudW1lcmljIGFyZ3VtZW50IGlzIG91dCBvZiByYW5nZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgdmFsdWUnO1xuXG4gIGNhc2UgZ2wuSU5WQUxJRF9PUEVSQVRJT046XG4gICAgLy8gVGhlIHNwZWNpZmllZCBjb21tYW5kIGlzIG5vdCBhbGxvd2VkIGZvciB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLk9VVF9PRl9NRU1PUlk6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgb3V0IG9mIG1lbW9yeSc7XG5cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgcmV0dXJuICdXZWJHTCB1bmtub3duIGVycm9yJztcbiAgfVxufVxuXG4vLyBUT0RPIC0gZG9jdW1lbnQgb3IgcmVtb3ZlXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z0NvbnRleHQoY3R4KSB7XG4gIGNvbnN0IGdsID0ge307XG4gIGZvciAodmFyIG0gaW4gY3R4KSB7XG4gICAgdmFyIGYgPSBjdHhbbV07XG4gICAgaWYgKHR5cGVvZiBmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBnbFttXSA9ICgoaywgdikgPT4ge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBhbnM7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFucyA9IHYuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtrfSAke2V9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgICAgd2hpbGUgKChlcnJvciA9IGN0eC5nZXRFcnJvcigpKSAhPT0gY3R4Lk5PX0VSUk9SKSB7XG4gICAgICAgICAgICBlcnJvclN0YWNrLnB1c2goZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXJyb3JTdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yU3RhY2suam9pbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICB9O1xuICAgICAgfSkobSwgZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsW21dID0gZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2w7XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETyAtIGdlbmVyaWMgZHJhdyBjYWxsXG4vLyBPbmUgb2YgdGhlIGdvb2QgdGhpbmdzIGFib3V0IEdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5nc1xuaW1wb3J0IHtnZXRFeHRlbnNpb259IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge0dMX0lOREVYX1RZUEVTLCBHTF9EUkFXX01PREVTfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQSBnb29kIHRoaW5nIGFib3V0IHdlYkdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5ncyxcbi8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIGRhdGEgaXMgaW5kZXhlZCBhbmQvb3IgaW5zdGFuY2VkLlxuLy8gVGhpcyBmdW5jdGlvbiB1bmlmaWVzIHRob3NlIGludG8gYSBzaW5nbGUgY2FsbCB3aXRoIHNpbXBsZSBwYXJhbWV0ZXJzXG4vLyB0aGF0IGhhdmUgc2FuZSBkZWZhdWx0cy5cbmV4cG9ydCBmdW5jdGlvbiBkcmF3KGdsLCB7XG4gIGRyYXdNb2RlID0gbnVsbCwgdmVydGV4Q291bnQsIG9mZnNldCA9IDAsXG4gIGluZGV4ZWQsIGluZGV4VHlwZSA9IG51bGwsXG4gIGluc3RhbmNlZCA9IGZhbHNlLCBpbnN0YW5jZUNvdW50ID0gMFxufSkge1xuICBkcmF3TW9kZSA9IGRyYXdNb2RlID8gZ2wuZ2V0KGRyYXdNb2RlKSA6IGdsLlRSSUFOR0xFUztcbiAgaW5kZXhUeXBlID0gaW5kZXhUeXBlID8gZ2wuZ2V0KGluZGV4VHlwZSkgOiBnbC5VTlNJR05FRF9TSE9SVDtcblxuICBhc3NlcnQoR0xfRFJBV19NT0RFUyhnbCkuaW5kZXhPZihkcmF3TW9kZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICAvLyBUT0RPIC0gVXNlIHBvbHlmaWxsZWQgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCBpbnN0ZWFkIG9mIEFOR0xFIGV4dGVuc2lvblxuICBpZiAoaW5zdGFuY2VkKSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3RWxlbWVudHNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGluZGV4ZWQpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCk7XG4gIH1cbn1cbiIsIlxuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vdGV4dHVyZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZyYW1lYnVmZmVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGggPyBvcHRzLndpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0ID8gb3B0cy5oZWlnaHQgOiAxO1xuICAgIHRoaXMuZGVwdGggPSBvcHRzLmRlcHRoID09PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0cy5kZXB0aDtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG9wdHMubWluRmlsdGVyIHx8IGdsLk5FQVJFU1Q7XG4gICAgdGhpcy5tYWdGaWx0ZXIgPSBvcHRzLm1hZ0ZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQgfHwgZ2wuUkdCQTtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGUgfHwgZ2wuVU5TSUdORURfQllURTtcbiAgICB0aGlzLmZibyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgdGhpcy5iaW5kKCk7XG5cbiAgICB0aGlzLnRleHR1cmUgPSBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBtaW5GaWx0ZXI6IHRoaXMubWluRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiB0aGlzLm1hZ0ZpbHRlcixcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXRcbiAgICB9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlLnRleHR1cmUsIDBcbiAgICApO1xuXG4gICAgaWYgKHRoaXMuZGVwdGgpIHtcbiAgICAgIHRoaXMuZGVwdGggPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoXG4gICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0XG4gICAgICApO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoXG4gICAgICAgIGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIHRoaXMuZGVwdGhcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuICAgIGlmIChzdGF0dXMgIT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZyYW1lYnVmZmVyIGNyZWF0aW9uIGZhaWxlZC4nKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZibyk7XG4gIH1cblxufVxuIiwiLy8gQ29udGFpbnMgY2xhc3MgYW5kIGZ1bmN0aW9uIHdyYXBwZXJzIGFyb3VuZCBsb3cgbGV2ZWwgd2ViZ2wgb2JqZWN0c1xuLy8gVGhlc2UgY2xhc3NlcyBhcmUgaW50ZW5kZWQgdG8gc3RheSBjbG9zZSB0byB0aGUgV2ViR0wgQVBJIHNlbWFudGljc1xuLy8gYnV0IG1ha2UgaXQgZWFzaWVyIHRvIHVzZS5cbi8vIEhpZ2hlciBsZXZlbCBhYnN0cmFjdGlvbnMgY2FuIGJlIGJ1aWx0IG9uIHRoZXNlIGNsYXNzZXNcbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9jb250ZXh0JztcbmV4cG9ydCAqIGZyb20gJy4vZHJhdyc7XG5leHBvcnQge2RlZmF1bHQgYXMgQnVmZmVyfSBmcm9tICcuL2J1ZmZlcic7XG5leHBvcnQge2RlZmF1bHQgYXMgUHJvZ3JhbX0gZnJvbSAnLi9wcm9ncmFtJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBGcmFtZWJ1ZmZlcn0gZnJvbSAnLi9mYm8nO1xuZXhwb3J0IHtUZXh0dXJlMkQsIFRleHR1cmVDdWJlfSBmcm9tICcuL3RleHR1cmUnO1xuIiwiLy8gQ3JlYXRlcyBwcm9ncmFtcyBvdXQgb2Ygc2hhZGVycyBhbmQgcHJvdmlkZXMgY29udmVuaWVudCBtZXRob2RzIGZvciBsb2FkaW5nXG4vLyBidWZmZXJzIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGNvbnNvbGUgKi9cbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7VmVydGV4U2hhZGVyLCBGcmFnbWVudFNoYWRlcn0gZnJvbSAnLi9zaGFkZXInO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyYW0ge1xuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogSGFuZGxlcyBjcmVhdGlvbiBvZiBwcm9ncmFtcywgbWFwcGluZyBvZiBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gZ2wgY29udGV4dFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudnMgLSBWZXJ0ZXggc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5mcyAtIEZyYWdtZW50IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuaWQ9IC0gSWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzLCBmcywgaWQpIHtcbiAgICBhc3NlcnQoZ2wsICdQcm9ncmFtIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuXG4gICAgbGV0IHZzO1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUud2FybignREVQUkVDQVRFRDogTmV3IHVzZTogUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KScpO1xuICAgICAgdnMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cyA9IG9wdHMudnM7XG4gICAgICBmcyA9IG9wdHMuZnM7XG4gICAgICBpZCA9IG9wdHMuaWQ7XG4gICAgfVxuXG4gICAgdnMgPSB2cyB8fCBTaGFkZXJzLlZlcnRleC5EZWZhdWx0O1xuICAgIGZzID0gZnMgfHwgU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBWZXJ0ZXhTaGFkZXIoZ2wsIHZzKS5oYW5kbGUpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgRnJhZ21lbnRTaGFkZXIoZ2wsIGZzKS5oYW5kbGUpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGNvbnN0IGxpbmtlZCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgIGlmICghbGlua2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGxpbmtpbmcgJHtnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gcHJlcGFyZSB1bmlmb3JtIHNldHRlcnNcbiAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzID0gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIG5vIGF0dHJpYnV0ZXMgZW5hYmxlZCB5ZXRcbiAgICB0aGlzLmF0dHJpYnV0ZUVuYWJsZWQgPSB7fTtcbiAgfVxuXG4gIHVzZSgpIHtcbiAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmUodGV4dHVyZSwgaW5kZXgpIHtcbiAgICB0ZXh0dXJlLmJpbmQoaW5kZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybShuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXModW5pZm9ybU1hcCkpIHtcbiAgICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh1bmlmb3JtTWFwW25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1tidWZmZXIuYXR0cmlidXRlXTtcbiAgICBidWZmZXIuYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlci5hdHRyaWJ1dGVdO1xuICAgIGJ1ZmZlci5kZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy51bnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbi8vIFRPRE8gLSB1c2UgdGFibGVzIHRvIHJlZHVjZSBjb21wbGV4aXR5IG9mIG1ldGhvZCBiZWxvd1xuLy8gY29uc3QgZ2xVbmlmb3JtU2V0dGVyID0ge1xuLy8gICBGTE9BVDoge2Z1bmN0aW9uOiAndW5pZm9ybTFmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX1ZFQzM6IHtmdW5jdGlvbjogJ3VuaWZvcm0zZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBGTE9BVF9NQVQ0OiB7ZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4NGZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgSU5UOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBCT09MOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSXzJEOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSX0NVQkU6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX1cbi8vIH07XG5cbi8vIFJldHVybnMgYSBNYWdpYyBVbmlmb3JtIFNldHRlclxuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcihnbCwgZ2xQcm9ncmFtLCBpbmZvLCBpc0FycmF5KSB7XG4gIGNvbnN0IHtuYW1lLCB0eXBlfSA9IGluZm87XG4gIGNvbnN0IGxvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihnbFByb2dyYW0sIG5hbWUpO1xuXG4gIGxldCBtYXRyaXggPSBmYWxzZTtcbiAgbGV0IHZlY3RvciA9IHRydWU7XG4gIGxldCBnbEZ1bmN0aW9uO1xuICBsZXQgVHlwZWRBcnJheTtcblxuICBpZiAoaW5mby5zaXplID4gMSAmJiBpc0FycmF5KSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG5cbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuSU5UOlxuICAgIGNhc2UgZ2wuQk9PTDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfMkQ6XG4gICAgY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBVaW50MTZBcnJheTtcbiAgICAgIHZlY3RvciA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmlmb3JtOiBVbmtub3duIEdMU0wgdHlwZSAnICsgdHlwZSk7XG5cbiAgICB9XG4gIH1cblxuICBpZiAodmVjdG9yKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBnbC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVDogY2FzZSBnbC5CT09MOiBjYXNlIGdsLlNBTVBMRVJfMkQ6IGNhc2UgZ2wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzI6IGNhc2UgZ2wuQk9PTF9WRUMyOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0yaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMzogY2FzZSBnbC5CT09MX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUM0OiBjYXNlIGdsLkJPT0xfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGl2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMjpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDJmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMzpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDNmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBnbEZ1bmN0aW9uID0gZ2xGdW5jdGlvbi5iaW5kKGdsKTtcblxuICAvLyBTZXQgYSB1bmlmb3JtIGFycmF5XG4gIGlmIChpc0FycmF5ICYmIFR5cGVkQXJyYXkpIHtcblxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIG5ldyBUeXBlZEFycmF5KHZhbCkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9O1xuICB9IGVsc2UgaWYgKG1hdHJpeCkge1xuICAgIC8vIFNldCBhIG1hdHJpeCB1bmlmb3JtXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgZmFsc2UsIHZhbC50b0Zsb2F0MzJBcnJheSgpKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfTtcblxuICB9IGVsc2UgaWYgKFR5cGVkQXJyYXkpIHtcblxuICAgIC8vIFNldCBhIHZlY3Rvci90eXBlZCBhcnJheSB1bmlmb3JtXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBUeXBlZEFycmF5LnNldCh2YWwudG9GbG9hdDMyQXJyYXkgPyB2YWwudG9GbG9hdDMyQXJyYXkoKSA6IHZhbCk7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgVHlwZWRBcnJheSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH07XG5cbiAgfVxuICAvLyBTZXQgYSBwcmltaXRpdmUtdmFsdWVkIHVuaWZvcm1cbiAgcmV0dXJuIHZhbCA9PiB7XG4gICAgZ2xGdW5jdGlvbihsb2MsIHZhbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgfTtcblxufVxuXG4vLyBjcmVhdGUgdW5pZm9ybSBzZXR0ZXJzXG4vLyBNYXAgb2YgdW5pZm9ybSBuYW1lcyB0byBzZXR0ZXIgZnVuY3Rpb25zXG5mdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVycyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IHVuaWZvcm1TZXR0ZXJzID0ge307XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZVVuaWZvcm0oZ2xQcm9ncmFtLCBpKTtcbiAgICBsZXQgbmFtZSA9IGluZm8ubmFtZTtcbiAgICAvLyBpZiBhcnJheSBuYW1lIHRoZW4gY2xlYW4gdGhlIGFycmF5IGJyYWNrZXRzXG4gICAgbmFtZSA9IG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nID9cbiAgICAgIG5hbWUuc3Vic3RyKDAsIG5hbWUubGVuZ3RoIC0gMykgOiBuYW1lO1xuICAgIHVuaWZvcm1TZXR0ZXJzW25hbWVdID1cbiAgICAgIGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGdsUHJvZ3JhbSwgaW5mbywgaW5mby5uYW1lICE9PSBuYW1lKTtcbiAgfVxuICByZXR1cm4gdW5pZm9ybVNldHRlcnM7XG59XG5cbi8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChtYXBzIGF0dHJpYnV0ZSBuYW1lIHRvIGluZGV4KVxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlTG9jYXRpb25zKGdsLCBnbFByb2dyYW0pIHtcbiAgY29uc3QgbGVuZ3RoID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihnbFByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKTtcbiAgY29uc3QgYXR0cmlidXRlTG9jYXRpb25zID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbmZvID0gZ2wuZ2V0QWN0aXZlQXR0cmliKGdsUHJvZ3JhbSwgaSk7XG4gICAgY29uc3QgaW5kZXggPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihnbFByb2dyYW0sIGluZm8ubmFtZSk7XG4gICAgYXR0cmlidXRlTG9jYXRpb25zW2luZm8ubmFtZV0gPSBpbmRleDtcbiAgfVxuICByZXR1cm4gYXR0cmlidXRlTG9jYXRpb25zO1xufVxuIiwiaW1wb3J0IGZvcm1hdENvbXBpbGVyRXJyb3IgZnJvbSAnZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yJztcblxuLy8gRm9yIG5vdyB0aGlzIGlzIGFuIGludGVybmFsIGNsYXNzXG5leHBvcnQgY2xhc3MgU2hhZGVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuICAgIGlmICh0aGlzLmhhbmRsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBjcmVhdGluZyBzaGFkZXIgd2l0aCB0eXBlICR7c2hhZGVyVHlwZX1gKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKHRoaXMuaGFuZGxlLCBzaGFkZXJTb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgIHZhciBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcih0aGlzLmhhbmRsZSwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgIHZhciBpbmZvID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyh0aGlzLmhhbmRsZSk7XG4gICAgICBnbC5kZWxldGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB2YXIgZm9ybWF0dGVkTG9nO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9ybWF0dGVkTG9nID0gZm9ybWF0Q29tcGlsZXJFcnJvcihpbmZvLCBzaGFkZXJTb3VyY2UsIHNoYWRlclR5cGUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLndhcm4oJ0Vycm9yIGZvcm1hdHRpbmcgZ2xzbCBjb21waWxlciBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgc2hhZGVyICR7aW5mb31gKTtcbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0dGVkTG9nLmxvbmcpO1xuICAgIH1cbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBWZXJ0ZXhTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNoYWRlclNvdXJjZSwgZ2wuVkVSVEVYX1NIQURFUik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZyYWdtZW50U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIH1cbn1cbiIsImltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuXG5jbGFzcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMudGFyZ2V0ID0gZ2wuVEVYVFVSRV8yRDtcblxuICAgIG9wdHMgPSBtZXJnZSh7XG4gICAgICBmbGlwWTogdHJ1ZSxcbiAgICAgIGFsaWdubWVudDogMSxcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIG1pbkZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIHdyYXBTOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgd3JhcFQ6IGdsLkNMQU1QX1RPX0VER0UsXG4gICAgICBmb3JtYXQ6IGdsLlJHQkEsXG4gICAgICB0eXBlOiBnbC5VTlNJR05FRF9CWVRFLFxuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlXG4gICAgfSwgb3B0cyk7XG5cbiAgICB0aGlzLmZsaXBZID0gb3B0cy5mbGlwWTtcbiAgICB0aGlzLmFsaWdubWVudCA9IG9wdHMuYWxpZ25tZW50O1xuICAgIHRoaXMubWFnRmlsdGVyID0gb3B0cy5tYWdGaWx0ZXI7XG4gICAgdGhpcy5taW5GaWx0ZXIgPSBvcHRzLm1pbkZpbHRlcjtcbiAgICB0aGlzLndyYXBTID0gb3B0cy53cmFwUztcbiAgICB0aGlzLndyYXBUID0gb3B0cy53cmFwVDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0O1xuICAgIHRoaXMudHlwZSA9IG9wdHMudHlwZTtcbiAgICB0aGlzLmdlbmVyYXRlTWlwbWFwID0gb3B0cy5nZW5lcmF0ZU1pcG1hcDtcblxuICAgIGlmICh0aGlzLnR5cGUgPT09IGdsLkZMT0FUKSB7XG4gICAgICB0aGlzLmZsb2F0RXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9mbG9hdCcpO1xuICAgICAgaWYgKCF0aGlzLmZsb2F0RXh0ZW5zaW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT0VTX3RleHR1cmVfZmxvYXQgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgaWYgKCF0aGlzLnRleHR1cmUpIHtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuXG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlKTtcbiAgICB0aGlzLnRleHR1cmUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlMkQgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSAwO1xuICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICB0aGlzLmJvcmRlciA9IDA7XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgYmluZChpbmRleCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKSAtIGdsLlRFWFRVUkUwO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHVwZGF0ZShvcHRzKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQ7XG4gICAgdGhpcy5ib3JkZXIgPSBvcHRzLmJvcmRlciB8fCAwO1xuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YTtcbiAgICBpZiAodGhpcy5mbGlwWSkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsXG4gICAgICAgIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSxcbiAgICAgICAgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLm1pbkZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5tYWdGaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgdGhpcy53cmFwUyk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLndyYXBUKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmICh0aGlzLmdlbmVyYXRlTWlwbWFwKSB7XG4gICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZUN1YmUgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbWF4LWxlbiAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3Mueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cbiIsIi8vIEhlbHBlciBkZWZpbml0aW9ucyBmb3IgdmFsaWRhdGlvbiBvZiB3ZWJnbCBwYXJhbWV0ZXJzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1pbmxpbmUtY29tbWVudHMsIG1heC1sZW4gKi9cblxuLy8gVE9ETyAtIHJlbW92ZVxuZXhwb3J0IHtpc1R5cGVkQXJyYXksIG1ha2VUeXBlZEFycmF5fSBmcm9tICcuLi91dGlscyc7XG5cbi8vIElOREVYIFRZUEVTXG5cbi8vIEZvciBkcmF3RWxlbWVudHMsIHNpemUgb2YgaW5kaWNlc1xuZXhwb3J0IGNvbnN0IElOREVYX1RZUEVTID0gWydVTlNJR05FRF9CWVRFJywgJ1VOU0lHTkVEX1NIT1JUJ107XG5leHBvcnQgY29uc3QgR0xfSU5ERVhfVFlQRVMgPSBnbCA9PiBJTkRFWF9UWVBFUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhUeXBlKHR5cGUpIHtcbiAgcmV0dXJuIElOREVYX1RZUEVTLmluZGV4T2YodHlwZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xJbmRleFR5cGUoZ2xUeXBlKSB7XG4gIHJldHVybiBHTF9JTkRFWF9UWVBFUy5pbmRleE9mKGdsVHlwZSkgIT09IC0xO1xufVxuXG4vLyBEUkFXIE1PREVTXG5cbmV4cG9ydCBjb25zdCBEUkFXX01PREVTID0gW1xuICAnUE9JTlRTJywgJ0xJTkVfU1RSSVAnLCAnTElORV9MT09QJywgJ0xJTkVTJyxcbiAgJ1RSSUFOR0xFX1NUUklQJywgJ1RSSUFOR0xFX0ZBTicsICdUUklBTkdMRVMnXG5dO1xuZXhwb3J0IGNvbnN0IEdMX0RSQVdfTU9ERVMgPSBnbCA9PiBEUkFXX01PREVTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNEcmF3TW9kZShtb2RlKSB7XG4gIHJldHVybiBEUkFXX01PREVTLmluZGV4T2YobW9kZSkgIT09IC0xO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzR0xEcmF3TW9kZShnbE1vZGUpIHtcbiAgcmV0dXJuIEdMX0RSQVdfTU9ERVMuaW5kZXhPZihnbE1vZGUpICE9PSAtMTtcbn1cblxuLy8gVEFSR0VUIFRZUEVTXG5cbmV4cG9ydCBjb25zdCBUQVJHRVRTID0gW1xuICAnQVJSQVlfQlVGRkVSJywgLy8gdmVydGV4IGF0dHJpYnV0ZXMgKGUuZy4gdmVydGV4L3RleHR1cmUgY29vcmRzIG9yIGNvbG9yKVxuICAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLCAvLyBCdWZmZXIgdXNlZCBmb3IgZWxlbWVudCBpbmRpY2VzLlxuICAvLyBGb3IgV2ViR0wgMiBjb250ZXh0c1xuICAnQ09QWV9SRUFEX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgY29weWluZyBmcm9tIG9uZSBidWZmZXIgb2JqZWN0IHRvIGFub3RoZXJcbiAgJ0NPUFlfV1JJVEVfQlVGRkVSJywgLy8gQnVmZmVyIGZvciBjb3B5aW5nIGZyb20gb25lIGJ1ZmZlciBvYmplY3QgdG8gYW5vdGhlclxuICAnVFJBTlNGT1JNX0ZFRURCQUNLX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgdHJhbnNmb3JtIGZlZWRiYWNrIG9wZXJhdGlvbnNcbiAgJ1VOSUZPUk1fQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHN0b3JpbmcgdW5pZm9ybSBibG9ja3NcbiAgJ1BJWEVMX1BBQ0tfQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHBpeGVsIHRyYW5zZmVyIG9wZXJhdGlvbnNcbiAgJ1BJWEVMX1VOUEFDS19CVUZGRVInIC8vIEJ1ZmZlciB1c2VkIGZvciBwaXhlbCB0cmFuc2ZlciBvcGVyYXRpb25zXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfVEFSR0VUUyA9XG4gIGdsID0+IFRBUkdFVFMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSkuZmlsdGVyKGNvbnN0YW50ID0+IGNvbnN0YW50KTtcblxuLy8gVVNBR0UgVFlQRVNcblxuZXhwb3J0IGNvbnN0IEJVRkZFUl9VU0FHRSA9IFtcbiAgJ1NUQVRJQ19EUkFXJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ0RZTkFNSUNfRFJBVycsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ1NUUkVBTV9EUkFXJywgLy8gQnVmZmVyIG5vdCB1c2VkIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gIC8vIEZvciBXZWJHTCAyIGNvbnRleHRzXG4gICdTVEFUSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ0RZTkFNSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RSRUFNX1JFQUQnLCAvLyBDb250ZW50cyBvZiB0aGUgYnVmZmVyIGFyZSBsaWtlbHkgdG8gbm90IGJlIHVzZWQgb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RBVElDX0NPUFknLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnRFlOQU1JQ19DT1BZJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnU1RSRUFNX0NPUFknIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgbmVpdGhlciB3cml0dGVuIG9yIHJlYWQgYnkgdGhlIHVzZXIuXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfQlVGRkVSX1VTQUdFID1cbiAgZ2wgPT4gQlVGRkVSX1VTQUdFLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pLmZpbHRlcihjb25zdGFudCA9PiBjb25zdGFudCk7XG4iXX0=
