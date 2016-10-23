'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FBO = exports.FramebufferObject = exports.TimerQuery = exports.VertexAttributes = exports.TextureCube = exports.Texture2D = exports.Texture = exports.Renderbuffer = exports.Framebuffer = exports.Program = exports.Shader = exports.Buffer = exports.GL = undefined;

var _webglConstants = require('./webgl-constants');

Object.defineProperty(exports, 'GL', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_webglConstants).default;
  }
});

var _webglTypes = require('./webgl-types');

Object.keys(_webglTypes).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _webglTypes[key];
    }
  });
});

var _webglChecks = require('./webgl-checks');

Object.keys(_webglChecks).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _webglChecks[key];
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

var _shader = require('./shader');

Object.defineProperty(exports, 'Shader', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_shader).default;
  }
});

var _program = require('./program');

Object.defineProperty(exports, 'Program', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_program).default;
  }
});

var _framebuffer = require('./framebuffer');

Object.defineProperty(exports, 'Framebuffer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_framebuffer).default;
  }
});

var _renderbuffer = require('./renderbuffer');

Object.defineProperty(exports, 'Renderbuffer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_renderbuffer).default;
  }
});

var _texture = require('./texture');

Object.defineProperty(exports, 'Texture', {
  enumerable: true,
  get: function get() {
    return _texture.Texture;
  }
});
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

var _timerQuery = require('./timer-query');

Object.defineProperty(exports, 'TimerQuery', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_timerQuery).default;
  }
});

var _context = require('./context');

Object.keys(_context).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _context[key];
    }
  });
});

var _draw = require('./draw');

Object.keys(_draw).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _draw[key];
    }
  });
});

var _uniforms = require('./uniforms');

Object.keys(_uniforms).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _uniforms[key];
    }
  });
});

var _fbo = require('./fbo');

Object.defineProperty(exports, 'FramebufferObject', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_fbo).default;
  }
});
Object.defineProperty(exports, 'FBO', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_fbo).default;
  }
});

var _vertexAttributes = require('./vertex-attributes');

var VertexAttributes = _interopRequireWildcard(_vertexAttributes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.VertexAttributes = VertexAttributes;

// Extensions


// Functions
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9pbmRleC5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0IiwiVGV4dHVyZSIsIlRleHR1cmUyRCIsIlRleHR1cmVDdWJlIiwiVmVydGV4QXR0cmlidXRlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O21EQUlRQSxPOzs7Ozs7QUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7Ozs7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7Ozs7Ozs7MkNBR1FBLE87Ozs7Ozs7OzsyQ0FDQUEsTzs7Ozs7Ozs7OzRDQUNBQSxPOzs7Ozs7Ozs7Z0RBQ0FBLE87Ozs7Ozs7OztpREFDQUEsTzs7Ozs7Ozs7O29CQUNBQyxPOzs7Ozs7b0JBQVNDLFM7Ozs7OztvQkFBV0MsVzs7Ozs7Ozs7OytDQU1wQkgsTzs7Ozs7O0FBR1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7O0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7O0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7Ozs7O3dDQUdRQSxPOzs7Ozs7d0NBQ0FBLE87Ozs7QUFiUjs7SUFBWUksZ0I7Ozs7OztRQUNKQSxnQixHQUFBQSxnQjs7QUFFUjs7O0FBR0EiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb250YWlucyBjbGFzcyBhbmQgZnVuY3Rpb24gd3JhcHBlcnMgYXJvdW5kIGxvdyBsZXZlbCB3ZWJnbCBvYmplY3RzXG4vLyBUaGVzZSBjbGFzc2VzIGFyZSBpbnRlbmRlZCB0byBzdGF5IGNsb3NlIHRvIHRoZSBXZWJHTCBBUEkgc2VtYW50aWNzXG4vLyBidXQgbWFrZSBpdCBlYXNpZXIgdG8gdXNlLlxuLy8gSGlnaGVyIGxldmVsIGFic3RyYWN0aW9ucyBjYW4gYmUgYnVpbHQgb24gdGhlc2UgY2xhc3Nlc1xuZXhwb3J0IHtkZWZhdWx0IGFzIEdMfSBmcm9tICcuL3dlYmdsLWNvbnN0YW50cyc7XG5leHBvcnQgKiBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmV4cG9ydCAqIGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcblxuLy8gTG93IGxldmVsIG9iamVjdHNcbmV4cG9ydCB7ZGVmYXVsdCBhcyBCdWZmZXJ9IGZyb20gJy4vYnVmZmVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBTaGFkZXJ9IGZyb20gJy4vc2hhZGVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBQcm9ncmFtfSBmcm9tICcuL3Byb2dyYW0nO1xuZXhwb3J0IHtkZWZhdWx0IGFzIEZyYW1lYnVmZmVyfSBmcm9tICcuL2ZyYW1lYnVmZmVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBSZW5kZXJidWZmZXJ9IGZyb20gJy4vcmVuZGVyYnVmZmVyJztcbmV4cG9ydCB7VGV4dHVyZSwgVGV4dHVyZTJELCBUZXh0dXJlQ3ViZX0gZnJvbSAnLi90ZXh0dXJlJztcblxuaW1wb3J0ICogYXMgVmVydGV4QXR0cmlidXRlcyBmcm9tICcuL3ZlcnRleC1hdHRyaWJ1dGVzJztcbmV4cG9ydCB7VmVydGV4QXR0cmlidXRlc307XG5cbi8vIEV4dGVuc2lvbnNcbmV4cG9ydCB7ZGVmYXVsdCBhcyBUaW1lclF1ZXJ5fSBmcm9tICcuL3RpbWVyLXF1ZXJ5JztcblxuLy8gRnVuY3Rpb25zXG5leHBvcnQgKiBmcm9tICcuL2NvbnRleHQnO1xuZXhwb3J0ICogZnJvbSAnLi9kcmF3JztcbmV4cG9ydCAqIGZyb20gJy4vdW5pZm9ybXMnO1xuXG4vLyBIaWdoZXIgbGV2ZWwgYWJzdHJhY3Rpb25zXG5leHBvcnQge2RlZmF1bHQgYXMgRnJhbWVidWZmZXJPYmplY3R9IGZyb20gJy4vZmJvJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBGQk99IGZyb20gJy4vZmJvJztcbiJdfQ==