'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _extendableBuiltin5(cls) {
  function ExtendableBuiltin() {
    var instance = Reflect.construct(cls, Array.from(arguments));
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    return instance;
  }

  ExtendableBuiltin.prototype = Object.create(cls.prototype, {
    constructor: {
      value: cls,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ExtendableBuiltin, cls);
  } else {
    ExtendableBuiltin.__proto__ = cls;
  }

  return ExtendableBuiltin;
}

function _extendableBuiltin3(cls) {
  function ExtendableBuiltin() {
    var instance = Reflect.construct(cls, Array.from(arguments));
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    return instance;
  }

  ExtendableBuiltin.prototype = Object.create(cls.prototype, {
    constructor: {
      value: cls,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ExtendableBuiltin, cls);
  } else {
    ExtendableBuiltin.__proto__ = cls;
  }

  return ExtendableBuiltin;
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _extendableBuiltin(cls) {
  function ExtendableBuiltin() {
    var instance = Reflect.construct(cls, Array.from(arguments));
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    return instance;
  }

  ExtendableBuiltin.prototype = Object.create(cls.prototype, {
    constructor: {
      value: cls,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ExtendableBuiltin, cls);
  } else {
    ExtendableBuiltin.__proto__ = cls;
  }

  return ExtendableBuiltin;
}

// Vec3, Mat4 and Quat classes
// TODO - clean up linting and remove some of these exceptions
/* eslint-disable */
/* eslint-disable computed-property-spacing, brace-style, max-params, one-var */
/* eslint-disable indent, no-loop-func */

var sqrt = Math.sqrt;
var sin = Math.sin;
var cos = Math.cos;
var tan = Math.tan;
var pi = Math.PI;
var slice = Array.prototype.slice;

// Vec3 Class

var Vec3 = exports.Vec3 = function (_extendableBuiltin2) {
  _inherits(Vec3, _extendableBuiltin2);

  function Vec3() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    _classCallCheck(this, Vec3);

    var _this = _possibleConstructorReturn(this, (Vec3.__proto__ || Object.getPrototypeOf(Vec3)).call(this, 3));

    _this[0] = x;
    _this[1] = y;
    _this[2] = z;
    return _this;
  }

  // fast Vec3 create.


  _createClass(Vec3, [{
    key: 'x',
    get: function get() {
      return this[0];
    },
    set: function set(value) {
      return this[0] = value;
    }
  }, {
    key: 'y',
    get: function get() {
      return this[1];
    },
    set: function set(value) {
      return this[1] = value;
    }
  }, {
    key: 'z',
    get: function get() {
      return this[2];
    },
    set: function set(value) {
      return this[2] = value;
    }
  }], [{
    key: 'create',
    value: function create() {
      return new Vec3(3);
    }
  }]);

  return Vec3;
}(_extendableBuiltin(Array));

var generics = {
  setVec3: function setVec3(dest, vec) {
    dest[0] = vec[0];
    dest[1] = vec[1];
    dest[2] = vec[2];
    return dest;
  },
  set: function set(dest, x, y, z) {
    dest[0] = x;
    dest[1] = y;
    dest[2] = z;
    return dest;
  },
  add: function add(dest, vec) {
    return new Vec3(dest[0] + vec[0], dest[1] + vec[1], dest[2] + vec[2]);
  },
  $add: function $add(dest, vec) {
    dest[0] += vec[0];
    dest[1] += vec[1];
    dest[2] += vec[2];
    return dest;
  },
  add2: function add2(dest, a, b) {
    dest[0] = a[0] + b[0];
    dest[1] = a[1] + b[1];
    dest[2] = a[2] + b[2];
    return dest;
  },
  sub: function sub(dest, vec) {
    return new Vec3(dest[0] - vec[0], dest[1] - vec[1], dest[2] - vec[2]);
  },
  $sub: function $sub(dest, vec) {
    dest[0] -= vec[0];
    dest[1] -= vec[1];
    dest[2] -= vec[2];
    return dest;
  },
  sub2: function sub2(dest, a, b) {
    dest[0] = a[0] - b[0];
    dest[1] = a[1] - b[1];
    dest[2] = a[2] - b[2];
    return dest;
  },
  scale: function scale(dest, s) {
    return new Vec3(dest[0] * s, dest[1] * s, dest[2] * s);
  },
  $scale: function $scale(dest, s) {
    dest[0] *= s;
    dest[1] *= s;
    dest[2] *= s;
    return dest;
  },
  neg: function neg(dest) {
    return new Vec3(-dest[0], -dest[1], -dest[2]);
  },
  $neg: function $neg(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    return dest;
  },
  unit: function unit(dest) {
    var len = Vec3.norm(dest);

    if (len > 0) {
      return Vec3.scale(dest, 1 / len);
    }
    return Vec3.clone(dest);
  },
  $unit: function $unit(dest) {
    var len = Vec3.norm(dest);

    if (len > 0) {
      return Vec3.$scale(dest, 1 / len);
    }
    return dest;
  },
  cross: function cross(dest, vec) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2],
        vx = vec[0],
        vy = vec[1],
        vz = vec[2];

    return new Vec3(dy * vz - dz * vy, dz * vx - dx * vz, dx * vy - dy * vx);
  },
  $cross: function $cross(dest, vec) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2],
        vx = vec[0],
        vy = vec[1],
        vz = vec[2];

    dest[0] = dy * vz - dz * vy;
    dest[1] = dz * vx - dx * vz;
    dest[2] = dx * vy - dy * vx;
    return dest;
  },
  distTo: function distTo(dest, vec) {
    var dx = dest[0] - vec[0],
        dy = dest[1] - vec[1],
        dz = dest[2] - vec[2];

    return sqrt(dx * dx + dy * dy + dz * dz);
  },
  distToSq: function distToSq(dest, vec) {
    var dx = dest[0] - vec[0],
        dy = dest[1] - vec[1],
        dz = dest[2] - vec[2];

    return dx * dx + dy * dy + dz * dz;
  },
  norm: function norm(dest) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2];

    return sqrt(dx * dx + dy * dy + dz * dz);
  },
  normSq: function normSq(dest) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2];

    return dx * dx + dy * dy + dz * dz;
  },
  dot: function dot(dest, vec) {
    return dest[0] * vec[0] + dest[1] * vec[1] + dest[2] * vec[2];
  },
  clone: function clone(dest) {
    if (dest instanceof Vec3) {
      return new Vec3(dest[0], dest[1], dest[2]);
    }
    return Vec3.setVec3(new Float32Array(3), dest);
  },
  toFloat32Array: function toFloat32Array(dest) {
    var ans = dest.typedContainer;

    if (!ans) {
      return dest;
    }

    ans[0] = dest[0];
    ans[1] = dest[1];
    ans[2] = dest[2];

    return ans;
  }
};

// add generics and instance methods
var proto = Vec3.prototype;
for (var method in generics) {
  Vec3[method] = generics[method];
  proto[method] = function _(m) {
    return function () {
      var args = slice.call(arguments);
      args.unshift(this);
      return Vec3[m].apply(Vec3, args);
    };
  }(method);
}

// Mat4 Class

var Mat4 = exports.Mat4 = function (_extendableBuiltin4) {
  _inherits(Mat4, _extendableBuiltin4);

  function Mat4(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
    _classCallCheck(this, Mat4);

    var _this2 = _possibleConstructorReturn(this, (Mat4.__proto__ || Object.getPrototypeOf(Mat4)).call(this, 16));

    _this2.length = 16;

    if (typeof n11 === 'number') {

      _this2.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
    } else {
      _this2.id();
    }

    _this2.typedContainer = new Float32Array(16);
    return _this2;
  }

  _createClass(Mat4, [{
    key: 'n11',
    get: function get() {
      return this[0];
    },
    set: function set(val) {
      this[0] = val;
    }
  }, {
    key: 'n12',
    get: function get() {
      return this[4];
    },
    set: function set(val) {
      this[4] = val;
    }
  }, {
    key: 'n13',
    get: function get() {
      return this[8];
    },
    set: function set(val) {
      this[8] = val;
    }
  }, {
    key: 'n14',
    get: function get() {
      return this[12];
    },
    set: function set(val) {
      this[12] = val;
    }
  }, {
    key: 'n21',
    get: function get() {
      return this[1];
    },
    set: function set(val) {
      this[1] = val;
    }
  }, {
    key: 'n22',
    get: function get() {
      return this[5];
    },
    set: function set(val) {
      this[5] = val;
    }
  }, {
    key: 'n23',
    get: function get() {
      return this[9];
    },
    set: function set(val) {
      this[9] = val;
    }
  }, {
    key: 'n24',
    get: function get() {
      return this[13];
    },
    set: function set(val) {
      this[13] = val;
    }
  }, {
    key: 'n31',
    get: function get() {
      return this[2];
    },
    set: function set(val) {
      this[2] = val;
    }
  }, {
    key: 'n32',
    get: function get() {
      return this[6];
    },
    set: function set(val) {
      this[6] = val;
    }
  }, {
    key: 'n33',
    get: function get() {
      return this[10];
    },
    set: function set(val) {
      this[10] = val;
    }
  }, {
    key: 'n34',
    get: function get() {
      return this[14];
    },
    set: function set(val) {
      this[14] = val;
    }
  }, {
    key: 'n41',
    get: function get() {
      return this[3];
    },
    set: function set(val) {
      this[3] = val;
    }
  }, {
    key: 'n42',
    get: function get() {
      return this[7];
    },
    set: function set(val) {
      this[7] = val;
    }
  }, {
    key: 'n43',
    get: function get() {
      return this[11];
    },
    set: function set(val) {
      this[11] = val;
    }
  }, {
    key: 'n44',
    get: function get() {
      return this[15];
    },
    set: function set(val) {
      this[15] = val;
    }
  }], [{
    key: 'create',
    value: function create() {
      return new Array(16);
    }
  }]);

  return Mat4;
}(_extendableBuiltin3(Array));

generics = {
  id: function id(dest) {

    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 1;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;

    return dest;
  },
  clone: function clone(dest) {
    if (dest instanceof Mat4) {
      return new Mat4(dest[0], dest[4], dest[8], dest[12], dest[1], dest[5], dest[9], dest[13], dest[2], dest[6], dest[10], dest[14], dest[3], dest[7], dest[11], dest[15]);
    }
    return new typedArray(dest);
  },
  set: function set(dest, n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {

    dest[0] = n11;
    dest[4] = n12;
    dest[8] = n13;
    dest[12] = n14;
    dest[1] = n21;
    dest[5] = n22;
    dest[9] = n23;
    dest[13] = n24;
    dest[2] = n31;
    dest[6] = n32;
    dest[10] = n33;
    dest[14] = n34;
    dest[3] = n41;
    dest[7] = n42;
    dest[11] = n43;
    dest[15] = n44;

    return dest;
  },
  mulVec3: function mulVec3(dest, vec) {
    var ans = Vec3.clone(vec);
    return Mat4.$mulVec3(dest, ans);
  },
  $mulVec3: function $mulVec3(dest, vec) {
    var vx = vec[0],
        vy = vec[1],
        vz = vec[2],
        d = 1 / (dest[3] * vx + dest[7] * vy + dest[11] * vz + dest[15]);

    vec[0] = (dest[0] * vx + dest[4] * vy + dest[8] * vz + dest[12]) * d;
    vec[1] = (dest[1] * vx + dest[5] * vy + dest[9] * vz + dest[13]) * d;
    vec[2] = (dest[2] * vx + dest[6] * vy + dest[10] * vz + dest[14]) * d;

    return vec;
  },
  mulMat42: function mulMat42(dest, a, b) {
    var a11 = a[0],
        a12 = a[1],
        a13 = a[2],
        a14 = a[3],
        a21 = a[4],
        a22 = a[5],
        a23 = a[6],
        a24 = a[7],
        a31 = a[8],
        a32 = a[9],
        a33 = a[10],
        a34 = a[11],
        a41 = a[12],
        a42 = a[13],
        a43 = a[14],
        a44 = a[15],
        b11 = b[0],
        b12 = b[1],
        b13 = b[2],
        b14 = b[3],
        b21 = b[4],
        b22 = b[5],
        b23 = b[6],
        b24 = b[7],
        b31 = b[8],
        b32 = b[9],
        b33 = b[10],
        b34 = b[11],
        b41 = b[12],
        b42 = b[13],
        b43 = b[14],
        b44 = b[15];

    dest[0] = b11 * a11 + b12 * a21 + b13 * a31 + b14 * a41;
    dest[1] = b11 * a12 + b12 * a22 + b13 * a32 + b14 * a42;
    dest[2] = b11 * a13 + b12 * a23 + b13 * a33 + b14 * a43;
    dest[3] = b11 * a14 + b12 * a24 + b13 * a34 + b14 * a44;

    dest[4] = b21 * a11 + b22 * a21 + b23 * a31 + b24 * a41;
    dest[5] = b21 * a12 + b22 * a22 + b23 * a32 + b24 * a42;
    dest[6] = b21 * a13 + b22 * a23 + b23 * a33 + b24 * a43;
    dest[7] = b21 * a14 + b22 * a24 + b23 * a34 + b24 * a44;

    dest[8] = b31 * a11 + b32 * a21 + b33 * a31 + b34 * a41;
    dest[9] = b31 * a12 + b32 * a22 + b33 * a32 + b34 * a42;
    dest[10] = b31 * a13 + b32 * a23 + b33 * a33 + b34 * a43;
    dest[11] = b31 * a14 + b32 * a24 + b33 * a34 + b34 * a44;

    dest[12] = b41 * a11 + b42 * a21 + b43 * a31 + b44 * a41;
    dest[13] = b41 * a12 + b42 * a22 + b43 * a32 + b44 * a42;
    dest[14] = b41 * a13 + b42 * a23 + b43 * a33 + b44 * a43;
    dest[15] = b41 * a14 + b42 * a24 + b43 * a34 + b44 * a44;
    return dest;
  },
  mulMat4: function mulMat4(a, b) {
    var m = Mat4.clone(a);
    return Mat4.mulMat42(m, a, b);
  },
  $mulMat4: function $mulMat4(a, b) {
    return Mat4.mulMat42(a, a, b);
  },
  add: function add(dest, m) {
    var copy = Mat4.clone(dest);
    return Mat4.$add(copy, m);
  },
  $add: function $add(dest, m) {
    dest[0] += m[0];
    dest[1] += m[1];
    dest[2] += m[2];
    dest[3] += m[3];
    dest[4] += m[4];
    dest[5] += m[5];
    dest[6] += m[6];
    dest[7] += m[7];
    dest[8] += m[8];
    dest[9] += m[9];
    dest[10] += m[10];
    dest[11] += m[11];
    dest[12] += m[12];
    dest[13] += m[13];
    dest[14] += m[14];
    dest[15] += m[15];

    return dest;
  },
  transpose: function transpose(dest) {
    var m = Mat4.clone(dest);
    return Mat4.$transpose(m);
  },
  $transpose: function $transpose(dest) {
    var n4 = dest[4],
        n8 = dest[8],
        n12 = dest[12],
        n1 = dest[1],
        n9 = dest[9],
        n13 = dest[13],
        n2 = dest[2],
        n6 = dest[6],
        n14 = dest[14],
        n3 = dest[3],
        n7 = dest[7],
        n11 = dest[11];

    dest[1] = n4;
    dest[2] = n8;
    dest[3] = n12;
    dest[4] = n1;
    dest[6] = n9;
    dest[7] = n13;
    dest[8] = n2;
    dest[9] = n6;
    dest[11] = n14;
    dest[12] = n3;
    dest[13] = n7;
    dest[14] = n11;

    return dest;
  },
  rotateAxis: function rotateAxis(dest, theta, vec) {
    var m = Mat4.clone(dest);
    return Mat4.$rotateAxis(m, theta, vec);
  },
  $rotateAxis: function $rotateAxis(dest, theta, vec) {
    var s = sin(theta),
        c = cos(theta),
        nc = 1 - c,
        vx = vec[0],
        vy = vec[1],
        vz = vec[2],
        m11 = vx * vx * nc + c,
        m12 = vx * vy * nc + vz * s,
        m13 = vx * vz * nc - vy * s,
        m21 = vy * vx * nc - vz * s,
        m22 = vy * vy * nc + c,
        m23 = vy * vz * nc + vx * s,
        m31 = vx * vz * nc + vy * s,
        m32 = vy * vz * nc - vx * s,
        m33 = vz * vz * nc + c,
        d11 = dest[0],
        d12 = dest[1],
        d13 = dest[2],
        d14 = dest[3],
        d21 = dest[4],
        d22 = dest[5],
        d23 = dest[6],
        d24 = dest[7],
        d31 = dest[8],
        d32 = dest[9],
        d33 = dest[10],
        d34 = dest[11],
        d41 = dest[12],
        d42 = dest[13],
        d43 = dest[14],
        d44 = dest[15];

    dest[0] = d11 * m11 + d21 * m12 + d31 * m13;
    dest[1] = d12 * m11 + d22 * m12 + d32 * m13;
    dest[2] = d13 * m11 + d23 * m12 + d33 * m13;
    dest[3] = d14 * m11 + d24 * m12 + d34 * m13;

    dest[4] = d11 * m21 + d21 * m22 + d31 * m23;
    dest[5] = d12 * m21 + d22 * m22 + d32 * m23;
    dest[6] = d13 * m21 + d23 * m22 + d33 * m23;
    dest[7] = d14 * m21 + d24 * m22 + d34 * m23;

    dest[8] = d11 * m31 + d21 * m32 + d31 * m33;
    dest[9] = d12 * m31 + d22 * m32 + d32 * m33;
    dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
    dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

    return dest;
  },
  rotateXYZ: function rotateXYZ(dest, rx, ry, rz) {
    var ans = Mat4.clone(dest);
    return Mat4.$rotateXYZ(ans, rx, ry, rz);
  },
  $rotateXYZ: function $rotateXYZ(dest, rx, ry, rz) {
    var d11 = dest[0],
        d12 = dest[1],
        d13 = dest[2],
        d14 = dest[3],
        d21 = dest[4],
        d22 = dest[5],
        d23 = dest[6],
        d24 = dest[7],
        d31 = dest[8],
        d32 = dest[9],
        d33 = dest[10],
        d34 = dest[11],
        crx = cos(rx),
        cry = cos(ry),
        crz = cos(rz),
        srx = sin(rx),
        sry = sin(ry),
        srz = sin(rz),
        m11 = cry * crz,
        m21 = -crx * srz + srx * sry * crz,
        m31 = srx * srz + crx * sry * crz,
        m12 = cry * srz,
        m22 = crx * crz + srx * sry * srz,
        m32 = -srx * crz + crx * sry * srz,
        m13 = -sry,
        m23 = srx * cry,
        m33 = crx * cry;

    dest[0] = d11 * m11 + d21 * m12 + d31 * m13;
    dest[1] = d12 * m11 + d22 * m12 + d32 * m13;
    dest[2] = d13 * m11 + d23 * m12 + d33 * m13;
    dest[3] = d14 * m11 + d24 * m12 + d34 * m13;

    dest[4] = d11 * m21 + d21 * m22 + d31 * m23;
    dest[5] = d12 * m21 + d22 * m22 + d32 * m23;
    dest[6] = d13 * m21 + d23 * m22 + d33 * m23;
    dest[7] = d14 * m21 + d24 * m22 + d34 * m23;

    dest[8] = d11 * m31 + d21 * m32 + d31 * m33;
    dest[9] = d12 * m31 + d22 * m32 + d32 * m33;
    dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
    dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

    return dest;
  },
  translate: function translate(dest, x, y, z) {
    var m = Mat4.clone(dest);
    return Mat4.$translate(m, x, y, z);
  },
  $translate: function $translate(dest, x, y, z) {
    dest[12] = dest[0] * x + dest[4] * y + dest[8] * z + dest[12];
    dest[13] = dest[1] * x + dest[5] * y + dest[9] * z + dest[13];
    dest[14] = dest[2] * x + dest[6] * y + dest[10] * z + dest[14];
    dest[15] = dest[3] * x + dest[7] * y + dest[11] * z + dest[15];

    return dest;
  },
  scale: function scale(dest, x, y, z) {
    var m = Mat4.clone(dest);
    return Mat4.$scale(m, x, y, z);
  },
  $scale: function $scale(dest, x, y, z) {
    dest[0] *= x;
    dest[1] *= x;
    dest[2] *= x;
    dest[3] *= x;
    dest[4] *= y;
    dest[5] *= y;
    dest[6] *= y;
    dest[7] *= y;
    dest[8] *= z;
    dest[9] *= z;
    dest[10] *= z;
    dest[11] *= z;

    return dest;
  },


  // Method based on PreGL https:// github.com/deanm/pregl/ (c) Dean McNamee.
  invert: function invert(dest) {
    var m = Mat4.clone(dest);
    return Mat4.$invert(m);
  },
  $invert: function $invert(dest) {
    var x0 = dest[0],
        x1 = dest[1],
        x2 = dest[2],
        x3 = dest[3],
        x4 = dest[4],
        x5 = dest[5],
        x6 = dest[6],
        x7 = dest[7],
        x8 = dest[8],
        x9 = dest[9],
        x10 = dest[10],
        x11 = dest[11],
        x12 = dest[12],
        x13 = dest[13],
        x14 = dest[14],
        x15 = dest[15];

    var a0 = x0 * x5 - x1 * x4,
        a1 = x0 * x6 - x2 * x4,
        a2 = x0 * x7 - x3 * x4,
        a3 = x1 * x6 - x2 * x5,
        a4 = x1 * x7 - x3 * x5,
        a5 = x2 * x7 - x3 * x6,
        b0 = x8 * x13 - x9 * x12,
        b1 = x8 * x14 - x10 * x12,
        b2 = x8 * x15 - x11 * x12,
        b3 = x9 * x14 - x10 * x13,
        b4 = x9 * x15 - x11 * x13,
        b5 = x10 * x15 - x11 * x14;

    var invdet = 1 / (a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0);

    dest[0] = (+x5 * b5 - x6 * b4 + x7 * b3) * invdet;
    dest[1] = (-x1 * b5 + x2 * b4 - x3 * b3) * invdet;
    dest[2] = (+x13 * a5 - x14 * a4 + x15 * a3) * invdet;
    dest[3] = (-x9 * a5 + x10 * a4 - x11 * a3) * invdet;
    dest[4] = (-x4 * b5 + x6 * b2 - x7 * b1) * invdet;
    dest[5] = (+x0 * b5 - x2 * b2 + x3 * b1) * invdet;
    dest[6] = (-x12 * a5 + x14 * a2 - x15 * a1) * invdet;
    dest[7] = (+x8 * a5 - x10 * a2 + x11 * a1) * invdet;
    dest[8] = (+x4 * b4 - x5 * b2 + x7 * b0) * invdet;
    dest[9] = (-x0 * b4 + x1 * b2 - x3 * b0) * invdet;
    dest[10] = (+x12 * a4 - x13 * a2 + x15 * a0) * invdet;
    dest[11] = (-x8 * a4 + x9 * a2 - x11 * a0) * invdet;
    dest[12] = (-x4 * b3 + x5 * b1 - x6 * b0) * invdet;
    dest[13] = (+x0 * b3 - x1 * b1 + x2 * b0) * invdet;
    dest[14] = (-x12 * a3 + x13 * a1 - x14 * a0) * invdet;
    dest[15] = (+x8 * a3 - x9 * a1 + x10 * a0) * invdet;

    return dest;
  },

  // TODO(nico) breaking convention here...
  // because I don't think it's useful to add
  // two methods for each of these.
  lookAt: function lookAt(dest, eye, center, up) {
    var z = Vec3.sub(eye, center);
    z.$unit();
    var x = Vec3.cross(up, z);
    x.$unit();
    var y = Vec3.cross(z, x);
    y.$unit();
    return Mat4.set(dest, x[0], x[1], x[2], -x.dot(eye), y[0], y[1], y[2], -y.dot(eye), z[0], z[1], z[2], -z.dot(eye), 0, 0, 0, 1);
  },
  frustum: function frustum(dest, left, right, bottom, top, near, far) {
    var rl = right - left,
        tb = top - bottom,
        fn = far - near;

    dest[0] = near * 2 / rl;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = near * 2 / tb;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = (right + left) / rl;
    dest[9] = (top + bottom) / tb;
    dest[10] = -(far + near) / fn;
    dest[11] = -1;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = -(far * near * 2) / fn;
    dest[15] = 0;

    return dest;
  },
  perspective: function perspective(dest, fov, aspect, near, far) {
    var ymax = near * tan(fov * pi / 360),
        ymin = -ymax,
        xmin = ymin * aspect,
        xmax = ymax * aspect;

    return Mat4.frustum(dest, xmin, xmax, ymin, ymax, near, far);
  },
  ortho: function ortho(dest, left, right, top, bottom, near, far) {
    var te = this.elements,
        w = right - left,
        h = top - bottom,
        p = far - near,
        x = (right + left) / w,
        y = (top + bottom) / h,
        z = (far + near) / p;

    dest[0] = 2 / w;dest[4] = 0;dest[8] = 0;dest[12] = -x;
    dest[1] = 0;dest[5] = 2 / h;dest[9] = 0;dest[13] = -y;
    dest[2] = 0;dest[6] = 0;dest[10] = -2 / p;dest[14] = -z;
    dest[3] = 0;dest[7] = 0;dest[11] = 0;dest[15] = 1;

    return dest;
  },
  toFloat32Array: function toFloat32Array(dest) {
    var ans = dest.typedContainer;

    if (!ans) {
      return dest;
    }

    ans[0] = dest[0];
    ans[1] = dest[1];
    ans[2] = dest[2];
    ans[3] = dest[3];
    ans[4] = dest[4];
    ans[5] = dest[5];
    ans[6] = dest[6];
    ans[7] = dest[7];
    ans[8] = dest[8];
    ans[9] = dest[9];
    ans[10] = dest[10];
    ans[11] = dest[11];
    ans[12] = dest[12];
    ans[13] = dest[13];
    ans[14] = dest[14];
    ans[15] = dest[15];

    return ans;
  }
};

// add generics and instance methods
proto = Mat4.prototype;
for (method in generics) {
  Mat4[method] = generics[method];
  proto[method] = function (m) {
    return function () {
      var args = slice.call(arguments);

      args.unshift(this);
      return Mat4[m].apply(Mat4, args);
    };
  }(method);
}

// Quaternion class

var Quat = exports.Quat = function (_extendableBuiltin6) {
  _inherits(Quat, _extendableBuiltin6);

  function Quat(x, y, z, w) {
    _classCallCheck(this, Quat);

    var _this3 = _possibleConstructorReturn(this, (Quat.__proto__ || Object.getPrototypeOf(Quat)).call(this, 4));

    _this3[0] = x || 0;
    _this3[1] = y || 0;
    _this3[2] = z || 0;
    _this3[3] = w || 0;

    _this3.typedContainer = new Float32Array(4);
    return _this3;
  }

  _createClass(Quat, null, [{
    key: 'create',
    value: function create() {
      return new Array(4);
    }
  }, {
    key: 'fromVec3',
    value: function fromVec3(v, r) {
      return new Quat(v[0], v[1], v[2], r || 0);
    }
  }, {
    key: 'fromMat4',
    value: function fromMat4(m) {
      var u;
      var v;
      var w;

      // Choose u, v, and w such that u is the index of the biggest diagonal entry
      // of m, and u v w is an even permutation of 0 1 and 2.
      if (m[0] > m[5] && m[0] > m[10]) {
        u = 0;
        v = 1;
        w = 2;
      } else if (m[5] > m[0] && m[5] > m[10]) {
        u = 1;
        v = 2;
        w = 0;
      } else {
        u = 2;
        v = 0;
        w = 1;
      }

      var r = sqrt(1 + m[u * 5] - m[v * 5] - m[w * 5]);
      var q = new Quat();

      q[u] = 0.5 * r;
      q[v] = 0.5 * (m['n' + v + '' + u] + m['n' + u + '' + v]) / r;
      q[w] = 0.5 * (m['n' + u + '' + w] + m['n' + w + '' + u]) / r;
      q[3] = 0.5 * (m['n' + v + '' + w] - m['n' + w + '' + v]) / r;

      return q;
    }
  }, {
    key: 'fromXRotation',
    value: function fromXRotation(angle) {
      return new Quat(sin(angle / 2), 0, 0, cos(angle / 2));
    }
  }, {
    key: 'fromYRotation',
    value: function fromYRotation(angle) {
      return new Quat(0, sin(angle / 2), 0, cos(angle / 2));
    }
  }, {
    key: 'fromZRotation',
    value: function fromZRotation(angle) {
      return new Quat(0, 0, sin(angle / 2), cos(angle / 2));
    }
  }, {
    key: 'fromAxisRotation',
    value: function fromAxisRotation(vec, angle) {
      var x = vec[0],
          y = vec[1],
          z = vec[2],
          d = 1 / sqrt(x * x + y * y + z * z),
          s = sin(angle / 2),
          c = cos(angle / 2);

      return new Quat(s * x * d, s * y * d, s * z * d, c);
    }
  }]);

  return Quat;
}(_extendableBuiltin5(Array));

generics = {
  setQuat: function setQuat(dest, q) {
    dest[0] = q[0];
    dest[1] = q[1];
    dest[2] = q[2];
    dest[3] = q[3];

    return dest;
  },
  set: function set(dest, x, y, z, w) {
    dest[0] = x || 0;
    dest[1] = y || 0;
    dest[2] = z || 0;
    dest[3] = w || 0;

    return dest;
  },
  clone: function clone(dest) {
    if (dest instanceof Quat) {
      return new Quat(dest[0], dest[1], dest[2], dest[3]);
    }
    return Quat.setQuat(new typedArray(4), dest);
  },
  neg: function neg(dest) {
    return new Quat(-dest[0], -dest[1], -dest[2], -dest[3]);
  },
  $neg: function $neg(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    dest[3] = -dest[3];

    return dest;
  },
  add: function add(dest, q) {
    return new Quat(dest[0] + q[0], dest[1] + q[1], dest[2] + q[2], dest[3] + q[3]);
  },
  $add: function $add(dest, q) {
    dest[0] += q[0];
    dest[1] += q[1];
    dest[2] += q[2];
    dest[3] += q[3];

    return dest;
  },
  sub: function sub(dest, q) {
    return new Quat(dest[0] - q[0], dest[1] - q[1], dest[2] - q[2], dest[3] - q[3]);
  },
  $sub: function $sub(dest, q) {
    dest[0] -= q[0];
    dest[1] -= q[1];
    dest[2] -= q[2];
    dest[3] -= q[3];

    return dest;
  },
  scale: function scale(dest, s) {
    return new Quat(dest[0] * s, dest[1] * s, dest[2] * s, dest[3] * s);
  },
  $scale: function $scale(dest, s) {
    dest[0] *= s;
    dest[1] *= s;
    dest[2] *= s;
    dest[3] *= s;

    return dest;
  },
  mulQuat: function mulQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    return new Quat(aW * bX + aX * bW + aY * bZ - aZ * bY, aW * bY + aY * bW + aZ * bX - aX * bZ, aW * bZ + aZ * bW + aX * bY - aY * bX, aW * bW - aX * bX - aY * bY - aZ * bZ);
  },
  $mulQuat: function $mulQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    dest[0] = aW * bX + aX * bW + aY * bZ - aZ * bY;
    dest[1] = aW * bY + aY * bW + aZ * bX - aX * bZ;
    dest[2] = aW * bZ + aZ * bW + aX * bY - aY * bX;
    dest[3] = aW * bW - aX * bX - aY * bY - aZ * bZ;

    return dest;
  },
  divQuat: function divQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);

    return new Quat((aX * bW - aW * bX - aY * bZ + aZ * bY) * d, (aX * bZ - aW * bY + aY * bW - aZ * bX) * d, (aY * bX + aZ * bW - aW * bZ - aX * bY) * d, (aW * bW + aX * bX + aY * bY + aZ * bZ) * d);
  },
  $divQuat: function $divQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);

    dest[0] = (aX * bW - aW * bX - aY * bZ + aZ * bY) * d;
    dest[1] = (aX * bZ - aW * bY + aY * bW - aZ * bX) * d;
    dest[2] = (aY * bX + aZ * bW - aW * bZ - aX * bY) * d;
    dest[3] = (aW * bW + aX * bX + aY * bY + aZ * bZ) * d;

    return dest;
  },
  invert: function invert(dest) {
    var q0 = dest[0],
        q1 = dest[1],
        q2 = dest[2],
        q3 = dest[3];

    var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

    return new Quat(-q0 * d, -q1 * d, -q2 * d, q3 * d);
  },
  $invert: function $invert(dest) {
    var q0 = dest[0],
        q1 = dest[1],
        q2 = dest[2],
        q3 = dest[3];

    var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

    dest[0] = -q0 * d;
    dest[1] = -q1 * d;
    dest[2] = -q2 * d;
    dest[3] = q3 * d;

    return dest;
  },
  norm: function norm(dest) {
    var a = dest[0],
        b = dest[1],
        c = dest[2],
        d = dest[3];

    return sqrt(a * a + b * b + c * c + d * d);
  },
  normSq: function normSq(dest) {
    var a = dest[0],
        b = dest[1],
        c = dest[2],
        d = dest[3];

    return a * a + b * b + c * c + d * d;
  },
  unit: function unit(dest) {
    return Quat.scale(dest, 1 / Quat.norm(dest));
  },
  $unit: function $unit(dest) {
    return Quat.$scale(dest, 1 / Quat.norm(dest));
  },
  conjugate: function conjugate(dest) {
    return new Quat(-dest[0], -dest[1], -dest[2], dest[3]);
  },
  $conjugate: function $conjugate(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    return dest;
  }
};

// add generics and instance methods

proto = Quat.prototype = {};

for (method in generics) {
  Quat[method] = generics[method];
  proto[method] = function (m) {
    return function () {
      var args = slice.call(arguments);

      args.unshift(this);
      return Quat[m].apply(Quat, args);
    };
  }(method);
}

// Add static methods
Vec3.fromQuat = function (q) {
  return new Vec3(q[0], q[1], q[2]);
};

Mat4.fromQuat = function (q) {
  var a = q[3],
      b = q[0],
      c = q[1],
      d = q[2];

  return new Mat4(a * a + b * b - c * c - d * d, 2 * b * c - 2 * a * d, 2 * b * d + 2 * a * c, 0, 2 * b * c + 2 * a * d, a * a - b * b + c * c - d * d, 2 * c * d - 2 * a * b, 0, 2 * b * d - 2 * a * c, 2 * c * d + 2 * a * b, a * a - b * b - c * c + d * d, 0, 0, 0, 0, 1);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRoL2FycmF5LWltcGwuanMiXSwibmFtZXMiOlsic3FydCIsIk1hdGgiLCJzaW4iLCJjb3MiLCJ0YW4iLCJwaSIsIlBJIiwic2xpY2UiLCJBcnJheSIsInByb3RvdHlwZSIsIlZlYzMiLCJ4IiwieSIsInoiLCJ2YWx1ZSIsImdlbmVyaWNzIiwic2V0VmVjMyIsImRlc3QiLCJ2ZWMiLCJzZXQiLCJhZGQiLCIkYWRkIiwiYWRkMiIsImEiLCJiIiwic3ViIiwiJHN1YiIsInN1YjIiLCJzY2FsZSIsInMiLCIkc2NhbGUiLCJuZWciLCIkbmVnIiwidW5pdCIsImxlbiIsIm5vcm0iLCJjbG9uZSIsIiR1bml0IiwiY3Jvc3MiLCJkeCIsImR5IiwiZHoiLCJ2eCIsInZ5IiwidnoiLCIkY3Jvc3MiLCJkaXN0VG8iLCJkaXN0VG9TcSIsIm5vcm1TcSIsImRvdCIsIkZsb2F0MzJBcnJheSIsInRvRmxvYXQzMkFycmF5IiwiYW5zIiwidHlwZWRDb250YWluZXIiLCJwcm90byIsIm1ldGhvZCIsIl8iLCJtIiwiYXJncyIsImNhbGwiLCJhcmd1bWVudHMiLCJ1bnNoaWZ0IiwiYXBwbHkiLCJNYXQ0IiwibjExIiwibjEyIiwibjEzIiwibjE0IiwibjIxIiwibjIyIiwibjIzIiwibjI0IiwibjMxIiwibjMyIiwibjMzIiwibjM0IiwibjQxIiwibjQyIiwibjQzIiwibjQ0IiwibGVuZ3RoIiwiaWQiLCJ2YWwiLCJ0eXBlZEFycmF5IiwibXVsVmVjMyIsIiRtdWxWZWMzIiwiZCIsIm11bE1hdDQyIiwiYTExIiwiYTEyIiwiYTEzIiwiYTE0IiwiYTIxIiwiYTIyIiwiYTIzIiwiYTI0IiwiYTMxIiwiYTMyIiwiYTMzIiwiYTM0IiwiYTQxIiwiYTQyIiwiYTQzIiwiYTQ0IiwiYjExIiwiYjEyIiwiYjEzIiwiYjE0IiwiYjIxIiwiYjIyIiwiYjIzIiwiYjI0IiwiYjMxIiwiYjMyIiwiYjMzIiwiYjM0IiwiYjQxIiwiYjQyIiwiYjQzIiwiYjQ0IiwibXVsTWF0NCIsIiRtdWxNYXQ0IiwiY29weSIsInRyYW5zcG9zZSIsIiR0cmFuc3Bvc2UiLCJuNCIsIm44IiwibjEiLCJuOSIsIm4yIiwibjYiLCJuMyIsIm43Iiwicm90YXRlQXhpcyIsInRoZXRhIiwiJHJvdGF0ZUF4aXMiLCJjIiwibmMiLCJtMTEiLCJtMTIiLCJtMTMiLCJtMjEiLCJtMjIiLCJtMjMiLCJtMzEiLCJtMzIiLCJtMzMiLCJkMTEiLCJkMTIiLCJkMTMiLCJkMTQiLCJkMjEiLCJkMjIiLCJkMjMiLCJkMjQiLCJkMzEiLCJkMzIiLCJkMzMiLCJkMzQiLCJkNDEiLCJkNDIiLCJkNDMiLCJkNDQiLCJyb3RhdGVYWVoiLCJyeCIsInJ5IiwicnoiLCIkcm90YXRlWFlaIiwiY3J4IiwiY3J5IiwiY3J6Iiwic3J4Iiwic3J5Iiwic3J6IiwidHJhbnNsYXRlIiwiJHRyYW5zbGF0ZSIsImludmVydCIsIiRpbnZlcnQiLCJ4MCIsIngxIiwieDIiLCJ4MyIsIng0IiwieDUiLCJ4NiIsIng3IiwieDgiLCJ4OSIsIngxMCIsIngxMSIsIngxMiIsIngxMyIsIngxNCIsIngxNSIsImEwIiwiYTEiLCJhMiIsImEzIiwiYTQiLCJhNSIsImIwIiwiYjEiLCJiMiIsImIzIiwiYjQiLCJiNSIsImludmRldCIsImxvb2tBdCIsImV5ZSIsImNlbnRlciIsInVwIiwiZnJ1c3R1bSIsImxlZnQiLCJyaWdodCIsImJvdHRvbSIsInRvcCIsIm5lYXIiLCJmYXIiLCJybCIsInRiIiwiZm4iLCJwZXJzcGVjdGl2ZSIsImZvdiIsImFzcGVjdCIsInltYXgiLCJ5bWluIiwieG1pbiIsInhtYXgiLCJvcnRobyIsInRlIiwiZWxlbWVudHMiLCJ3IiwiaCIsInAiLCJRdWF0IiwidiIsInIiLCJ1IiwicSIsImFuZ2xlIiwic2V0UXVhdCIsIm11bFF1YXQiLCJhWCIsImFZIiwiYVoiLCJhVyIsImJYIiwiYlkiLCJiWiIsImJXIiwiJG11bFF1YXQiLCJkaXZRdWF0IiwiJGRpdlF1YXQiLCJxMCIsInExIiwicTIiLCJxMyIsImNvbmp1Z2F0ZSIsIiRj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RCxDQUFKLEdBQVFDLENBUmYsRUFTTCxDQVRLLEVBV0wsSUFBSUEsQ0FBSixHQUFROEQsQ0FBUixHQUFZLElBQUkvRCxDQUFKLEdBQVFpSCxDQVhmLEVBWUwsSUFBSUEsQ0FBSixHQUFRbEQsQ0FBUixHQUFZLElBQUkvRCxDQUFKLEdBQVFDLENBWmYsRUFhTEQsSUFBSUEsQ0FBSixHQUFRQyxJQUFJQSxDQUFaLEdBQWdCZ0gsSUFBSUEsQ0FBcEIsR0FBd0JsRCxJQUFJQSxDQWJ2QixFQWNMLENBZEssRUFnQkwsQ0FoQkssRUFnQkYsQ0FoQkUsRUFnQkMsQ0FoQkQsRUFnQkksQ0FoQkosQ0FBUDtBQWlCRCxDQXZCRCIsImZpbGUiOiJhcnJheS1pbXBsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVmVjMywgTWF0NCBhbmQgUXVhdCBjbGFzc2VzXG4vLyBUT0RPIC0gY2xlYW4gdXAgbGludGluZyBhbmQgcmVtb3ZlIHNvbWUgb2YgdGhlc2UgZXhjZXB0aW9uc1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlIGNvbXB1dGVkLXByb3BlcnR5LXNwYWNpbmcsIGJyYWNlLXN0eWxlLCBtYXgtcGFyYW1zLCBvbmUtdmFyICovXG4vKiBlc2xpbnQtZGlzYWJsZSBpbmRlbnQsIG5vLWxvb3AtZnVuYyAqL1xuXG5jb25zdCBzcXJ0ID0gTWF0aC5zcXJ0O1xuY29uc3Qgc2luID0gTWF0aC5zaW47XG5jb25zdCBjb3MgPSBNYXRoLmNvcztcbmNvbnN0IHRhbiA9IE1hdGgudGFuO1xuY29uc3QgcGkgPSBNYXRoLlBJO1xuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbi8vIFZlYzMgQ2xhc3NcbmV4cG9ydCBjbGFzcyBWZWMzIGV4dGVuZHMgQXJyYXkge1xuXG4gIGNvbnN0cnVjdG9yKHggPSAwLCB5ID0gMCwgeiA9IDApIHtcbiAgICBzdXBlcigzKTtcbiAgICB0aGlzWzBdID0geDtcbiAgICB0aGlzWzFdID0geTtcbiAgICB0aGlzWzJdID0gejtcbiAgfVxuXG4gIC8vIGZhc3QgVmVjMyBjcmVhdGUuXG4gIHN0YXRpYyBjcmVhdGUoKSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKDMpO1xuICB9XG5cbiAgZ2V0IHgoKSB7XG4gICAgcmV0dXJuIHRoaXNbMF07XG4gIH1cblxuICBzZXQgeCh2YWx1ZSkge1xuICAgIHJldHVybiAodGhpc1swXSA9IHZhbHVlKTtcbiAgfVxuXG4gIGdldCB5KCkge1xuICAgIHJldHVybiB0aGlzWzFdO1xuICB9XG5cbiAgc2V0IHkodmFsdWUpIHtcbiAgICByZXR1cm4gKHRoaXNbMV0gPSB2YWx1ZSk7XG4gIH1cblxuICBnZXQgeigpIHtcbiAgICByZXR1cm4gdGhpc1syXTtcbiAgfVxuXG4gIHNldCB6KHZhbHVlKSB7XG4gICAgcmV0dXJuICh0aGlzWzJdID0gdmFsdWUpO1xuICB9XG59XG5cbnZhciBnZW5lcmljcyA9IHtcblxuICBzZXRWZWMzKGRlc3QsIHZlYykge1xuICAgIGRlc3RbMF0gPSB2ZWNbMF07XG4gICAgZGVzdFsxXSA9IHZlY1sxXTtcbiAgICBkZXN0WzJdID0gdmVjWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHNldChkZXN0LCB4LCB5LCB6KSB7XG4gICAgZGVzdFswXSA9IHg7XG4gICAgZGVzdFsxXSA9IHk7XG4gICAgZGVzdFsyXSA9IHo7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgYWRkKGRlc3QsIHZlYykge1xuICAgIHJldHVybiBuZXcgVmVjMyhkZXN0WzBdICsgdmVjWzBdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdICsgdmVjWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICsgdmVjWzJdKTtcbiAgfSxcblxuICAkYWRkKGRlc3QsIHZlYykge1xuICAgIGRlc3RbMF0gKz0gdmVjWzBdO1xuICAgIGRlc3RbMV0gKz0gdmVjWzFdO1xuICAgIGRlc3RbMl0gKz0gdmVjWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGFkZDIoZGVzdCwgYSwgYikge1xuICAgIGRlc3RbMF0gPSBhWzBdICsgYlswXTtcbiAgICBkZXN0WzFdID0gYVsxXSArIGJbMV07XG4gICAgZGVzdFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHN1YihkZXN0LCB2ZWMpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoZGVzdFswXSAtIHZlY1swXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsxXSAtIHZlY1sxXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAtIHZlY1syXSk7XG4gIH0sXG5cbiAgJHN1YihkZXN0LCB2ZWMpIHtcbiAgICBkZXN0WzBdIC09IHZlY1swXTtcbiAgICBkZXN0WzFdIC09IHZlY1sxXTtcbiAgICBkZXN0WzJdIC09IHZlY1syXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzdWIyKGRlc3QsIGEsIGIpIHtcbiAgICBkZXN0WzBdID0gYVswXSAtIGJbMF07XG4gICAgZGVzdFsxXSA9IGFbMV0gLSBiWzFdO1xuICAgIGRlc3RbMl0gPSBhWzJdIC0gYlsyXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzY2FsZShkZXN0LCBzKSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKGRlc3RbMF0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdICogcyxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAqIHMpO1xuICB9LFxuXG4gICRzY2FsZShkZXN0LCBzKSB7XG4gICAgZGVzdFswXSAqPSBzO1xuICAgIGRlc3RbMV0gKj0gcztcbiAgICBkZXN0WzJdICo9IHM7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgbmVnKGRlc3QpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoLWRlc3RbMF0sXG4gICAgICAgICAgICAgICAgICAgIC1kZXN0WzFdLFxuICAgICAgICAgICAgICAgICAgICAtZGVzdFsyXSk7XG4gIH0sXG5cbiAgJG5lZyhkZXN0KSB7XG4gICAgZGVzdFswXSA9IC1kZXN0WzBdO1xuICAgIGRlc3RbMV0gPSAtZGVzdFsxXTtcbiAgICBkZXN0WzJdID0gLWRlc3RbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgdW5pdChkZXN0KSB7XG4gICAgdmFyIGxlbiA9IFZlYzMubm9ybShkZXN0KTtcblxuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICByZXR1cm4gVmVjMy5zY2FsZShkZXN0LCAxIC8gbGVuKTtcbiAgICB9XG4gICAgcmV0dXJuIFZlYzMuY2xvbmUoZGVzdCk7XG4gIH0sXG5cbiAgJHVuaXQoZGVzdCkge1xuICAgIHZhciBsZW4gPSBWZWMzLm5vcm0oZGVzdCk7XG5cbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgcmV0dXJuIFZlYzMuJHNjYWxlKGRlc3QsIDEgLyBsZW4pO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBjcm9zcyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLFxuICAgICAgZHkgPSBkZXN0WzFdLFxuICAgICAgZHogPSBkZXN0WzJdLFxuICAgICAgdnggPSB2ZWNbMF0sXG4gICAgICB2eSA9IHZlY1sxXSxcbiAgICAgIHZ6ID0gdmVjWzJdO1xuXG4gICAgcmV0dXJuIG5ldyBWZWMzKGR5ICogdnogLSBkeiAqIHZ5LFxuICAgICAgICAgICAgICAgICAgICBkeiAqIHZ4IC0gZHggKiB2eixcbiAgICAgICAgICAgICAgICAgICAgZHggKiB2eSAtIGR5ICogdngpO1xuICB9LFxuXG4gICRjcm9zcyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLFxuICAgICAgICBkeSA9IGRlc3RbMV0sXG4gICAgICAgIGR6ID0gZGVzdFsyXSxcbiAgICAgICAgdnggPSB2ZWNbMF0sXG4gICAgICAgIHZ5ID0gdmVjWzFdLFxuICAgICAgICB2eiA9IHZlY1syXTtcblxuICAgIGRlc3RbMF0gPSBkeSAqIHZ6IC0gZHogKiB2eTtcbiAgICBkZXN0WzFdID0gZHogKiB2eCAtIGR4ICogdno7XG4gICAgZGVzdFsyXSA9IGR4ICogdnkgLSBkeSAqIHZ4O1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGRpc3RUbyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdIC0gdmVjWzBdLFxuICAgICAgICBkeSA9IGRlc3RbMV0gLSB2ZWNbMV0sXG4gICAgICAgIGR6ID0gZGVzdFsyXSAtIHZlY1syXTtcblxuICAgIHJldHVybiBzcXJ0KGR4ICogZHggK1xuICAgICAgICAgICAgICAgIGR5ICogZHkgK1xuICAgICAgICAgICAgICAgIGR6ICogZHopO1xuICB9LFxuXG4gIGRpc3RUb1NxKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0gLSB2ZWNbMF0sXG4gICAgICAgIGR5ID0gZGVzdFsxXSAtIHZlY1sxXSxcbiAgICAgICAgZHogPSBkZXN0WzJdIC0gdmVjWzJdO1xuXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcbiAgfSxcblxuICBub3JtKGRlc3QpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLCBkeSA9IGRlc3RbMV0sIGR6ID0gZGVzdFsyXTtcblxuICAgIHJldHVybiBzcXJ0KGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkeik7XG4gIH0sXG5cbiAgbm9ybVNxKGRlc3QpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLCBkeSA9IGRlc3RbMV0sIGR6ID0gZGVzdFsyXTtcblxuICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHo7XG4gIH0sXG5cbiAgZG90KGRlc3QsIHZlYykge1xuICAgIHJldHVybiBkZXN0WzBdICogdmVjWzBdICsgZGVzdFsxXSAqIHZlY1sxXSArIGRlc3RbMl0gKiB2ZWNbMl07XG4gIH0sXG5cbiAgY2xvbmUoZGVzdCkge1xuICAgIGlmIChkZXN0IGluc3RhbmNlb2YgVmVjMykge1xuICAgICAgcmV0dXJuIG5ldyBWZWMzKGRlc3RbMF0sIGRlc3RbMV0sIGRlc3RbMl0pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjMy5zZXRWZWMzKG5ldyBGbG9hdDMyQXJyYXkoMyksIGRlc3QpO1xuICB9LFxuXG4gIHRvRmxvYXQzMkFycmF5KGRlc3QpIHtcbiAgICB2YXIgYW5zID0gZGVzdC50eXBlZENvbnRhaW5lcjtcblxuICAgIGlmICghYW5zKSB7XG4gICAgICByZXR1cm4gZGVzdDtcbiAgICB9XG5cbiAgICBhbnNbMF0gPSBkZXN0WzBdO1xuICAgIGFuc1sxXSA9IGRlc3RbMV07XG4gICAgYW5zWzJdID0gZGVzdFsyXTtcblxuICAgIHJldHVybiBhbnM7XG4gIH1cbn07XG5cbi8vIGFkZCBnZW5lcmljcyBhbmQgaW5zdGFuY2UgbWV0aG9kc1xudmFyIHByb3RvID0gVmVjMy5wcm90b3R5cGU7XG5mb3IgKHZhciBtZXRob2QgaW4gZ2VuZXJpY3MpIHtcbiAgVmVjM1ttZXRob2RdID0gZ2VuZXJpY3NbbWV0aG9kXTtcbiAgcHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiBfKG0pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICAgIHJldHVybiBWZWMzW21dLmFwcGx5KFZlYzMsIGFyZ3MpO1xuICAgIH07XG4gfShtZXRob2QpKTtcbn1cblxuLy8gTWF0NCBDbGFzc1xuZXhwb3J0IGNsYXNzIE1hdDQgZXh0ZW5kcyBBcnJheSB7XG5cbiAgY29uc3RydWN0b3IobjExLCBuMTIsIG4xMywgbjE0LFxuICAgICAgICAgICAgICBuMjEsIG4yMiwgbjIzLCBuMjQsXG4gICAgICAgICAgICAgIG4zMSwgbjMyLCBuMzMsIG4zNCxcbiAgICAgICAgICAgICAgbjQxLCBuNDIsIG40MywgbjQ0KSB7XG5cbiAgICBzdXBlcigxNik7XG5cbiAgICB0aGlzLmxlbmd0aCA9IDE2O1xuXG4gICAgaWYgKHR5cGVvZiBuMTEgPT09ICdudW1iZXInKSB7XG5cbiAgICAgIHRoaXMuc2V0KG4xMSwgbjEyLCBuMTMsIG4xNCxcbiAgICAgICAgICAgICAgIG4yMSwgbjIyLCBuMjMsIG4yNCxcbiAgICAgICAgICAgICAgIG4zMSwgbjMyLCBuMzMsIG4zNCxcbiAgICAgICAgICAgICAgIG40MSwgbjQyLCBuNDMsIG40NCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pZCgpO1xuICAgIH1cblxuICAgIHRoaXMudHlwZWRDb250YWluZXIgPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUoKSB7XG4gICAgcmV0dXJuIG5ldyBBcnJheSgxNik7XG4gIH1cblxuICBnZXQgbjExKCkgeyByZXR1cm4gdGhpc1swXTsgfVxuICBnZXQgbjEyKCkgeyByZXR1cm4gdGhpc1s0XTsgfVxuICBnZXQgbjEzKCkgeyByZXR1cm4gdGhpc1s4XTsgfVxuICBnZXQgbjE0KCkgeyByZXR1cm4gdGhpc1sxMl07IH1cbiAgZ2V0IG4yMSgpIHsgcmV0dXJuIHRoaXNbMV07IH1cbiAgZ2V0IG4yMigpIHsgcmV0dXJuIHRoaXNbNV07IH1cbiAgZ2V0IG4yMygpIHsgcmV0dXJuIHRoaXNbOV07IH1cbiAgZ2V0IG4yNCgpIHsgcmV0dXJuIHRoaXNbMTNdOyB9XG4gIGdldCBuMzEoKSB7IHJldHVybiB0aGlzWzJdOyB9XG4gIGdldCBuMzIoKSB7IHJldHVybiB0aGlzWzZdOyB9XG4gIGdldCBuMzMoKSB7IHJldHVybiB0aGlzWzEwXTsgfVxuICBnZXQgbjM0KCkgeyByZXR1cm4gdGhpc1sxNF07IH1cbiAgZ2V0IG40MSgpIHsgcmV0dXJuIHRoaXNbM107IH1cbiAgZ2V0IG40MigpIHsgcmV0dXJuIHRoaXNbN107IH1cbiAgZ2V0IG40MygpIHsgcmV0dXJuIHRoaXNbMTFdOyB9XG4gIGdldCBuNDQoKSB7IHJldHVybiB0aGlzWzE1XTsgfVxuXG4gIHNldCBuMTEodmFsKSB7IHRoaXNbMF0gPSB2YWw7IH1cbiAgc2V0IG4xMih2YWwpIHsgdGhpc1s0XSA9IHZhbDsgfVxuICBzZXQgbjEzKHZhbCkgeyB0aGlzWzhdID0gdmFsOyB9XG4gIHNldCBuMTQodmFsKSB7IHRoaXNbMTJdID0gdmFsOyB9XG4gIHNldCBuMjEodmFsKSB7IHRoaXNbMV0gPSB2YWw7IH1cbiAgc2V0IG4yMih2YWwpIHsgdGhpc1s1XSA9IHZhbDsgfVxuICBzZXQgbjIzKHZhbCkgeyB0aGlzWzldID0gdmFsOyB9XG4gIHNldCBuMjQodmFsKSB7IHRoaXNbMTNdID0gdmFsOyB9XG4gIHNldCBuMzEodmFsKSB7IHRoaXNbMl0gPSB2YWw7IH1cbiAgc2V0IG4zMih2YWwpIHsgdGhpc1s2XSA9IHZhbDsgfVxuICBzZXQgbjMzKHZhbCkgeyB0aGlzWzEwXSA9IHZhbDsgfVxuICBzZXQgbjM0KHZhbCkgeyB0aGlzWzE0XSA9IHZhbDsgfVxuICBzZXQgbjQxKHZhbCkgeyB0aGlzWzNdID0gdmFsOyB9XG4gIHNldCBuNDIodmFsKSB7IHRoaXNbN10gPSB2YWw7IH1cbiAgc2V0IG40Myh2YWwpIHsgdGhpc1sxMV0gPSB2YWw7IH1cbiAgc2V0IG40NCh2YWwpIHsgdGhpc1sxNV0gPSB2YWw7IH1cblxufVxuXG5nZW5lcmljcyA9IHtcblxuICBpZChkZXN0KSB7XG5cbiAgICBkZXN0WzAgXSA9IDE7XG4gICAgZGVzdFsxIF0gPSAwO1xuICAgIGRlc3RbMiBdID0gMDtcbiAgICBkZXN0WzMgXSA9IDA7XG4gICAgZGVzdFs0IF0gPSAwO1xuICAgIGRlc3RbNSBdID0gMTtcbiAgICBkZXN0WzYgXSA9IDA7XG4gICAgZGVzdFs3IF0gPSAwO1xuICAgIGRlc3RbOCBdID0gMDtcbiAgICBkZXN0WzkgXSA9IDA7XG4gICAgZGVzdFsxMF0gPSAxO1xuICAgIGRlc3RbMTFdID0gMDtcbiAgICBkZXN0WzEyXSA9IDA7XG4gICAgZGVzdFsxM10gPSAwO1xuICAgIGRlc3RbMTRdID0gMDtcbiAgICBkZXN0WzE1XSA9IDE7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBjbG9uZShkZXN0KSB7XG4gICAgaWYgKGRlc3QgaW5zdGFuY2VvZiBNYXQ0KSB7XG4gICAgICByZXR1cm4gbmV3IE1hdDQoZGVzdFswXSwgZGVzdFs0XSwgZGVzdFs4XSwgZGVzdFsxMl0sXG4gICAgICAgICAgICAgICAgICAgICAgZGVzdFsxXSwgZGVzdFs1XSwgZGVzdFs5XSwgZGVzdFsxM10sXG4gICAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSwgZGVzdFs2XSwgZGVzdFsxMF0sIGRlc3RbMTRdLFxuICAgICAgICAgICAgICAgICAgICAgIGRlc3RbM10sIGRlc3RbN10sIGRlc3RbMTFdLCBkZXN0WzE1XSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgdHlwZWRBcnJheShkZXN0KTtcbiAgfSxcblxuICBzZXQoZGVzdCwgbjExLCBuMTIsIG4xMywgbjE0LFxuICAgICAgICAgICAgbjIxLCBuMjIsIG4yMywgbjI0LFxuICAgICAgICAgICAgbjMxLCBuMzIsIG4zMywgbjM0LFxuICAgICAgICAgICAgbjQxLCBuNDIsIG40MywgbjQ0KSB7XG5cbiAgICBkZXN0WzAgXSA9IG4xMTtcbiAgICBkZXN0WzQgXSA9IG4xMjtcbiAgICBkZXN0WzggXSA9IG4xMztcbiAgICBkZXN0WzEyXSA9IG4xNDtcbiAgICBkZXN0WzEgXSA9IG4yMTtcbiAgICBkZXN0WzUgXSA9IG4yMjtcbiAgICBkZXN0WzkgXSA9IG4yMztcbiAgICBkZXN0WzEzXSA9IG4yNDtcbiAgICBkZXN0WzIgXSA9IG4zMTtcbiAgICBkZXN0WzYgXSA9IG4zMjtcbiAgICBkZXN0WzEwXSA9IG4zMztcbiAgICBkZXN0WzE0XSA9IG4zNDtcbiAgICBkZXN0WzMgXSA9IG40MTtcbiAgICBkZXN0WzcgXSA9IG40MjtcbiAgICBkZXN0WzExXSA9IG40MztcbiAgICBkZXN0WzE1XSA9IG40NDtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIG11bFZlYzMoZGVzdCwgdmVjKSB7XG4gICAgdmFyIGFucyA9IFZlYzMuY2xvbmUodmVjKTtcbiAgICByZXR1cm4gTWF0NC4kbXVsVmVjMyhkZXN0LCBhbnMpO1xuICB9LFxuXG4gICRtdWxWZWMzKGRlc3QsIHZlYykge1xuICAgIHZhciB2eCA9IHZlY1swXSxcbiAgICAgICAgdnkgPSB2ZWNbMV0sXG4gICAgICAgIHZ6ID0gdmVjWzJdLFxuICAgICAgICBkID0gMSAvIChkZXN0WzNdICogdnggKyBkZXN0WzddICogdnkgKyBkZXN0WzExXSAqIHZ6ICsgZGVzdFsxNV0pO1xuXG4gICAgdmVjWzBdID0gKGRlc3RbMF0gKiB2eCArIGRlc3RbNF0gKiB2eSArIGRlc3RbOCBdICogdnogKyBkZXN0WzEyXSkgKiBkO1xuICAgIHZlY1sxXSA9IChkZXN0WzFdICogdnggKyBkZXN0WzVdICogdnkgKyBkZXN0WzkgXSAqIHZ6ICsgZGVzdFsxM10pICogZDtcbiAgICB2ZWNbMl0gPSAoZGVzdFsyXSAqIHZ4ICsgZGVzdFs2XSAqIHZ5ICsgZGVzdFsxMF0gKiB2eiArIGRlc3RbMTRdKSAqIGQ7XG5cbiAgICByZXR1cm4gdmVjO1xuICB9LFxuXG4gIG11bE1hdDQyKGRlc3QsIGEsIGIpIHtcbiAgICB2YXIgYTExID0gYVswIF0sIGExMiA9IGFbMSBdLCBhMTMgPSBhWzIgXSwgYTE0ID0gYVszIF0sXG4gICAgICAgIGEyMSA9IGFbNCBdLCBhMjIgPSBhWzUgXSwgYTIzID0gYVs2IF0sIGEyNCA9IGFbNyBdLFxuICAgICAgICBhMzEgPSBhWzggXSwgYTMyID0gYVs5IF0sIGEzMyA9IGFbMTBdLCBhMzQgPSBhWzExXSxcbiAgICAgICAgYTQxID0gYVsxMl0sIGE0MiA9IGFbMTNdLCBhNDMgPSBhWzE0XSwgYTQ0ID0gYVsxNV0sXG4gICAgICAgIGIxMSA9IGJbMCBdLCBiMTIgPSBiWzEgXSwgYjEzID0gYlsyIF0sIGIxNCA9IGJbMyBdLFxuICAgICAgICBiMjEgPSBiWzQgXSwgYjIyID0gYls1IF0sIGIyMyA9IGJbNiBdLCBiMjQgPSBiWzcgXSxcbiAgICAgICAgYjMxID0gYls4IF0sIGIzMiA9IGJbOSBdLCBiMzMgPSBiWzEwXSwgYjM0ID0gYlsxMV0sXG4gICAgICAgIGI0MSA9IGJbMTJdLCBiNDIgPSBiWzEzXSwgYjQzID0gYlsxNF0sIGI0NCA9IGJbMTVdO1xuXG4gICAgZGVzdFswIF0gPSBiMTEgKiBhMTEgKyBiMTIgKiBhMjEgKyBiMTMgKiBhMzEgKyBiMTQgKiBhNDE7XG4gICAgZGVzdFsxIF0gPSBiMTEgKiBhMTIgKyBiMTIgKiBhMjIgKyBiMTMgKiBhMzIgKyBiMTQgKiBhNDI7XG4gICAgZGVzdFsyIF0gPSBiMTEgKiBhMTMgKyBiMTIgKiBhMjMgKyBiMTMgKiBhMzMgKyBiMTQgKiBhNDM7XG4gICAgZGVzdFszIF0gPSBiMTEgKiBhMTQgKyBiMTIgKiBhMjQgKyBiMTMgKiBhMzQgKyBiMTQgKiBhNDQ7XG5cbiAgICBkZXN0WzQgXSA9IGIyMSAqIGExMSArIGIyMiAqIGEyMSArIGIyMyAqIGEzMSArIGIyNCAqIGE0MTtcbiAgICBkZXN0WzUgXSA9IGIyMSAqIGExMiArIGIyMiAqIGEyMiArIGIyMyAqIGEzMiArIGIyNCAqIGE0MjtcbiAgICBkZXN0WzYgXSA9IGIyMSAqIGExMyArIGIyMiAqIGEyMyArIGIyMyAqIGEzMyArIGIyNCAqIGE0MztcbiAgICBkZXN0WzcgXSA9IGIyMSAqIGExNCArIGIyMiAqIGEyNCArIGIyMyAqIGEzNCArIGIyNCAqIGE0NDtcblxuICAgIGRlc3RbOCBdID0gYjMxICogYTExICsgYjMyICogYTIxICsgYjMzICogYTMxICsgYjM0ICogYTQxO1xuICAgIGRlc3RbOSBdID0gYjMxICogYTEyICsgYjMyICogYTIyICsgYjMzICogYTMyICsgYjM0ICogYTQyO1xuICAgIGRlc3RbMTBdID0gYjMxICogYTEzICsgYjMyICogYTIzICsgYjMzICogYTMzICsgYjM0ICogYTQzO1xuICAgIGRlc3RbMTFdID0gYjMxICogYTE0ICsgYjMyICogYTI0ICsgYjMzICogYTM0ICsgYjM0ICogYTQ0O1xuXG4gICAgZGVzdFsxMl0gPSBiNDEgKiBhMTEgKyBiNDIgKiBhMjEgKyBiNDMgKiBhMzEgKyBiNDQgKiBhNDE7XG4gICAgZGVzdFsxM10gPSBiNDEgKiBhMTIgKyBiNDIgKiBhMjIgKyBiNDMgKiBhMzIgKyBiNDQgKiBhNDI7XG4gICAgZGVzdFsxNF0gPSBiNDEgKiBhMTMgKyBiNDIgKiBhMjMgKyBiNDMgKiBhMzMgKyBiNDQgKiBhNDM7XG4gICAgZGVzdFsxNV0gPSBiNDEgKiBhMTQgKyBiNDIgKiBhMjQgKyBiNDMgKiBhMzQgKyBiNDQgKiBhNDQ7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgbXVsTWF0NChhLCBiKSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGEpO1xuICAgIHJldHVybiBNYXQ0Lm11bE1hdDQyKG0sIGEsIGIpO1xuICB9LFxuXG4gICRtdWxNYXQ0KGEsIGIpIHtcbiAgICByZXR1cm4gTWF0NC5tdWxNYXQ0MihhLCBhLCBiKTtcbiAgfSxcblxuICBhZGQoZGVzdCwgbSkge1xuICAgIHZhciBjb3B5ID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kYWRkKGNvcHksIG0pO1xuICB9LFxuXG4gICRhZGQoZGVzdCwgbSkge1xuICAgIGRlc3RbMCBdICs9IG1bMF07XG4gICAgZGVzdFsxIF0gKz0gbVsxXTtcbiAgICBkZXN0WzIgXSArPSBtWzJdO1xuICAgIGRlc3RbMyBdICs9IG1bM107XG4gICAgZGVzdFs0IF0gKz0gbVs0XTtcbiAgICBkZXN0WzUgXSArPSBtWzVdO1xuICAgIGRlc3RbNiBdICs9IG1bNl07XG4gICAgZGVzdFs3IF0gKz0gbVs3XTtcbiAgICBkZXN0WzggXSArPSBtWzhdO1xuICAgIGRlc3RbOSBdICs9IG1bOV07XG4gICAgZGVzdFsxMF0gKz0gbVsxMF07XG4gICAgZGVzdFsxMV0gKz0gbVsxMV07XG4gICAgZGVzdFsxMl0gKz0gbVsxMl07XG4gICAgZGVzdFsxM10gKz0gbVsxM107XG4gICAgZGVzdFsxNF0gKz0gbVsxNF07XG4gICAgZGVzdFsxNV0gKz0gbVsxNV07XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICB0cmFuc3Bvc2UoZGVzdCkge1xuICAgIHZhciBtID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kdHJhbnNwb3NlKG0pO1xuICB9LFxuXG4gICR0cmFuc3Bvc2UoZGVzdCkge1xuICAgIHZhciBuNCA9IGRlc3RbNF0sIG44ID0gZGVzdFs4XSwgbjEyID0gZGVzdFsxMl0sXG4gICAgICAgIG4xID0gZGVzdFsxXSwgbjkgPSBkZXN0WzldLCBuMTMgPSBkZXN0WzEzXSxcbiAgICAgICAgbjIgPSBkZXN0WzJdLCBuNiA9IGRlc3RbNl0sIG4xNCA9IGRlc3RbMTRdLFxuICAgICAgICBuMyA9IGRlc3RbM10sIG43ID0gZGVzdFs3XSwgbjExID0gZGVzdFsxMV07XG5cbiAgICBkZXN0WzFdID0gbjQ7XG4gICAgZGVzdFsyXSA9IG44O1xuICAgIGRlc3RbM10gPSBuMTI7XG4gICAgZGVzdFs0XSA9IG4xO1xuICAgIGRlc3RbNl0gPSBuOTtcbiAgICBkZXN0WzddID0gbjEzO1xuICAgIGRlc3RbOF0gPSBuMjtcbiAgICBkZXN0WzldID0gbjY7XG4gICAgZGVzdFsxMV0gPSBuMTQ7XG4gICAgZGVzdFsxMl0gPSBuMztcbiAgICBkZXN0WzEzXSA9IG43O1xuICAgIGRlc3RbMTRdID0gbjExO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgcm90YXRlQXhpcyhkZXN0LCB0aGV0YSwgdmVjKSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRyb3RhdGVBeGlzKG0sIHRoZXRhLCB2ZWMpO1xuICB9LFxuXG4gICRyb3RhdGVBeGlzKGRlc3QsIHRoZXRhLCB2ZWMpIHtcbiAgICB2YXIgcyA9IHNpbih0aGV0YSksXG4gICAgICAgIGMgPSBjb3ModGhldGEpLFxuICAgICAgICBuYyA9IDEgLSBjLFxuICAgICAgICB2eCA9IHZlY1swXSxcbiAgICAgICAgdnkgPSB2ZWNbMV0sXG4gICAgICAgIHZ6ID0gdmVjWzJdLFxuICAgICAgICBtMTEgPSB2eCAqIHZ4ICogbmMgKyBjLFxuICAgICAgICBtMTIgPSB2eCAqIHZ5ICogbmMgKyB2eiAqIHMsXG4gICAgICAgIG0xMyA9IHZ4ICogdnogKiBuYyAtIHZ5ICogcyxcbiAgICAgICAgbTIxID0gdnkgKiB2eCAqIG5jIC0gdnogKiBzLFxuICAgICAgICBtMjIgPSB2eSAqIHZ5ICogbmMgKyBjLFxuICAgICAgICBtMjMgPSB2eSAqIHZ6ICogbmMgKyB2eCAqIHMsXG4gICAgICAgIG0zMSA9IHZ4ICogdnogKiBuYyArIHZ5ICogcyxcbiAgICAgICAgbTMyID0gdnkgKiB2eiAqIG5jIC0gdnggKiBzLFxuICAgICAgICBtMzMgPSB2eiAqIHZ6ICogbmMgKyBjLFxuICAgICAgICBkMTEgPSBkZXN0WzBdLFxuICAgICAgICBkMTIgPSBkZXN0WzFdLFxuICAgICAgICBkMTMgPSBkZXN0WzJdLFxuICAgICAgICBkMTQgPSBkZXN0WzNdLFxuICAgICAgICBkMjEgPSBkZXN0WzRdLFxuICAgICAgICBkMjIgPSBkZXN0WzVdLFxuICAgICAgICBkMjMgPSBkZXN0WzZdLFxuICAgICAgICBkMjQgPSBkZXN0WzddLFxuICAgICAgICBkMzEgPSBkZXN0WzhdLFxuICAgICAgICBkMzIgPSBkZXN0WzldLFxuICAgICAgICBkMzMgPSBkZXN0WzEwXSxcbiAgICAgICAgZDM0ID0gZGVzdFsxMV0sXG4gICAgICAgIGQ0MSA9IGRlc3RbMTJdLFxuICAgICAgICBkNDIgPSBkZXN0WzEzXSxcbiAgICAgICAgZDQzID0gZGVzdFsxNF0sXG4gICAgICAgIGQ0NCA9IGRlc3RbMTVdO1xuXG4gICAgZGVzdFswIF0gPSBkMTEgKiBtMTEgKyBkMjEgKiBtMTIgKyBkMzEgKiBtMTM7XG4gICAgZGVzdFsxIF0gPSBkMTIgKiBtMTEgKyBkMjIgKiBtMTIgKyBkMzIgKiBtMTM7XG4gICAgZGVzdFsyIF0gPSBkMTMgKiBtMTEgKyBkMjMgKiBtMTIgKyBkMzMgKiBtMTM7XG4gICAgZGVzdFszIF0gPSBkMTQgKiBtMTEgKyBkMjQgKiBtMTIgKyBkMzQgKiBtMTM7XG5cbiAgICBkZXN0WzQgXSA9IGQxMSAqIG0yMSArIGQyMSAqIG0yMiArIGQzMSAqIG0yMztcbiAgICBkZXN0WzUgXSA9IGQxMiAqIG0yMSArIGQyMiAqIG0yMiArIGQzMiAqIG0yMztcbiAgICBkZXN0WzYgXSA9IGQxMyAqIG0yMSArIGQyMyAqIG0yMiArIGQzMyAqIG0yMztcbiAgICBkZXN0WzcgXSA9IGQxNCAqIG0yMSArIGQyNCAqIG0yMiArIGQzNCAqIG0yMztcblxuICAgIGRlc3RbOCBdID0gZDExICogbTMxICsgZDIxICogbTMyICsgZDMxICogbTMzO1xuICAgIGRlc3RbOSBdID0gZDEyICogbTMxICsgZDIyICogbTMyICsgZDMyICogbTMzO1xuICAgIGRlc3RbMTBdID0gZDEzICogbTMxICsgZDIzICogbTMyICsgZDMzICogbTMzO1xuICAgIGRlc3RbMTFdID0gZDE0ICogbTMxICsgZDI0ICogbTMyICsgZDM0ICogbTMzO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgcm90YXRlWFlaKGRlc3QsIHJ4LCByeSwgcnopIHtcbiAgICB2YXIgYW5zID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kcm90YXRlWFlaKGFucywgcngsIHJ5LCByeik7XG4gIH0sXG5cbiAgJHJvdGF0ZVhZWihkZXN0LCByeCwgcnksIHJ6KSB7XG4gICAgdmFyIGQxMSA9IGRlc3RbMCBdLFxuICAgICAgICBkMTIgPSBkZXN0WzEgXSxcbiAgICAgICAgZDEzID0gZGVzdFsyIF0sXG4gICAgICAgIGQxNCA9IGRlc3RbMyBdLFxuICAgICAgICBkMjEgPSBkZXN0WzQgXSxcbiAgICAgICAgZDIyID0gZGVzdFs1IF0sXG4gICAgICAgIGQyMyA9IGRlc3RbNiBdLFxuICAgICAgICBkMjQgPSBkZXN0WzcgXSxcbiAgICAgICAgZDMxID0gZGVzdFs4IF0sXG4gICAgICAgIGQzMiA9IGRlc3RbOSBdLFxuICAgICAgICBkMzMgPSBkZXN0WzEwXSxcbiAgICAgICAgZDM0ID0gZGVzdFsxMV0sXG4gICAgICAgIGNyeCA9IGNvcyhyeCksXG4gICAgICAgIGNyeSA9IGNvcyhyeSksXG4gICAgICAgIGNyeiA9IGNvcyhyeiksXG4gICAgICAgIHNyeCA9IHNpbihyeCksXG4gICAgICAgIHNyeSA9IHNpbihyeSksXG4gICAgICAgIHNyeiA9IHNpbihyeiksXG4gICAgICAgIG0xMSA9ICBjcnkgKiBjcnosXG4gICAgICAgIG0yMSA9IC1jcnggKiBzcnogKyBzcnggKiBzcnkgKiBjcnosXG4gICAgICAgIG0zMSA9ICBzcnggKiBzcnogKyBjcnggKiBzcnkgKiBjcnosXG4gICAgICAgIG0xMiA9ICBjcnkgKiBzcnosXG4gICAgICAgIG0yMiA9ICBjcnggKiBjcnogKyBzcnggKiBzcnkgKiBzcnosXG4gICAgICAgIG0zMiA9IC1zcnggKiBjcnogKyBjcnggKiBzcnkgKiBzcnosXG4gICAgICAgIG0xMyA9IC1zcnksXG4gICAgICAgIG0yMyA9ICBzcnggKiBjcnksXG4gICAgICAgIG0zMyA9ICBjcnggKiBjcnk7XG5cbiAgICBkZXN0WzAgXSA9IGQxMSAqIG0xMSArIGQyMSAqIG0xMiArIGQzMSAqIG0xMztcbiAgICBkZXN0WzEgXSA9IGQxMiAqIG0xMSArIGQyMiAqIG0xMiArIGQzMiAqIG0xMztcbiAgICBkZXN0WzIgXSA9IGQxMyAqIG0xMSArIGQyMyAqIG0xMiArIGQzMyAqIG0xMztcbiAgICBkZXN0WzMgXSA9IGQxNCAqIG0xMSArIGQyNCAqIG0xMiArIGQzNCAqIG0xMztcblxuICAgIGRlc3RbNCBdID0gZDExICogbTIxICsgZDIxICogbTIyICsgZDMxICogbTIzO1xuICAgIGRlc3RbNSBdID0gZDEyICogbTIxICsgZDIyICogbTIyICsgZDMyICogbTIzO1xuICAgIGRlc3RbNiBdID0gZDEzICogbTIxICsgZDIzICogbTIyICsgZDMzICogbTIzO1xuICAgIGRlc3RbNyBdID0gZDE0ICogbTIxICsgZDI0ICogbTIyICsgZDM0ICogbTIzO1xuXG4gICAgZGVzdFs4IF0gPSBkMTEgKiBtMzEgKyBkMjEgKiBtMzIgKyBkMzEgKiBtMzM7XG4gICAgZGVzdFs5IF0gPSBkMTIgKiBtMzEgKyBkMjIgKiBtMzIgKyBkMzIgKiBtMzM7XG4gICAgZGVzdFsxMF0gPSBkMTMgKiBtMzEgKyBkMjMgKiBtMzIgKyBkMzMgKiBtMzM7XG4gICAgZGVzdFsxMV0gPSBkMTQgKiBtMzEgKyBkMjQgKiBtMzIgKyBkMzQgKiBtMzM7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICB0cmFuc2xhdGUoZGVzdCwgeCwgeSwgeikge1xuICAgIHZhciBtID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kdHJhbnNsYXRlKG0sIHgsIHksIHopO1xuICB9LFxuXG4gICR0cmFuc2xhdGUoZGVzdCwgeCwgeSwgeikge1xuICAgIGRlc3RbMTJdID0gZGVzdFswIF0gKiB4ICsgZGVzdFs0IF0gKiB5ICsgZGVzdFs4IF0gKiB6ICsgZGVzdFsxMl07XG4gICAgZGVzdFsxM10gPSBkZXN0WzEgXSAqIHggKyBkZXN0WzUgXSAqIHkgKyBkZXN0WzkgXSAqIHogKyBkZXN0WzEzXTtcbiAgICBkZXN0WzE0XSA9IGRlc3RbMiBdICogeCArIGRlc3RbNiBdICogeSArIGRlc3RbMTBdICogeiArIGRlc3RbMTRdO1xuICAgIGRlc3RbMTVdID0gZGVzdFszIF0gKiB4ICsgZGVzdFs3IF0gKiB5ICsgZGVzdFsxMV0gKiB6ICsgZGVzdFsxNV07XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzY2FsZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRzY2FsZShtLCB4LCB5LCB6KTtcbiAgfSxcblxuICAkc2NhbGUoZGVzdCwgeCwgeSwgeikge1xuICAgIGRlc3RbMCBdICo9IHg7XG4gICAgZGVzdFsxIF0gKj0geDtcbiAgICBkZXN0WzIgXSAqPSB4O1xuICAgIGRlc3RbMyBdICo9IHg7XG4gICAgZGVzdFs0IF0gKj0geTtcbiAgICBkZXN0WzUgXSAqPSB5O1xuICAgIGRlc3RbNiBdICo9IHk7XG4gICAgZGVzdFs3IF0gKj0geTtcbiAgICBkZXN0WzggXSAqPSB6O1xuICAgIGRlc3RbOSBdICo9IHo7XG4gICAgZGVzdFsxMF0gKj0gejtcbiAgICBkZXN0WzExXSAqPSB6O1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgLy8gTWV0aG9kIGJhc2VkIG9uIFByZUdMIGh0dHBzOi8vIGdpdGh1Yi5jb20vZGVhbm0vcHJlZ2wvIChjKSBEZWFuIE1jTmFtZWUuXG4gIGludmVydChkZXN0KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiAgTWF0NC4kaW52ZXJ0KG0pO1xuICB9LFxuXG4gICRpbnZlcnQoZGVzdCkge1xuICAgIHZhciB4MCA9IGRlc3RbMF0sICB4MSA9IGRlc3RbMV0sICB4MiA9IGRlc3RbMl0sICB4MyA9IGRlc3RbM10sXG4gICAgICAgIHg0ID0gZGVzdFs0XSwgIHg1ID0gZGVzdFs1XSwgIHg2ID0gZGVzdFs2XSwgIHg3ID0gZGVzdFs3XSxcbiAgICAgICAgeDggPSBkZXN0WzhdLCAgeDkgPSBkZXN0WzldLCB4MTAgPSBkZXN0WzEwXSwgeDExID0gZGVzdFsxMV0sXG4gICAgICAgIHgxMiA9IGRlc3RbMTJdLCB4MTMgPSBkZXN0WzEzXSwgeDE0ID0gZGVzdFsxNF0sIHgxNSA9IGRlc3RbMTVdO1xuXG4gICAgdmFyIGEwID0geDAgKiB4NSAtIHgxICogeDQsXG4gICAgICAgIGExID0geDAgKiB4NiAtIHgyICogeDQsXG4gICAgICAgIGEyID0geDAgKiB4NyAtIHgzICogeDQsXG4gICAgICAgIGEzID0geDEgKiB4NiAtIHgyICogeDUsXG4gICAgICAgIGE0ID0geDEgKiB4NyAtIHgzICogeDUsXG4gICAgICAgIGE1ID0geDIgKiB4NyAtIHgzICogeDYsXG4gICAgICAgIGIwID0geDggKiB4MTMgLSB4OSAqIHgxMixcbiAgICAgICAgYjEgPSB4OCAqIHgxNCAtIHgxMCAqIHgxMixcbiAgICAgICAgYjIgPSB4OCAqIHgxNSAtIHgxMSAqIHgxMixcbiAgICAgICAgYjMgPSB4OSAqIHgxNCAtIHgxMCAqIHgxMyxcbiAgICAgICAgYjQgPSB4OSAqIHgxNSAtIHgxMSAqIHgxMyxcbiAgICAgICAgYjUgPSB4MTAgKiB4MTUgLSB4MTEgKiB4MTQ7XG5cbiAgICB2YXIgaW52ZGV0ID0gMSAvXG4gICAgICAoYTAgKiBiNSAtIGExICogYjQgKyBhMiAqIGIzICsgYTMgKiBiMiAtIGE0ICogYjEgKyBhNSAqIGIwKTtcblxuICAgIGRlc3RbMCBdID0gKCsgeDUgKiBiNSAtIHg2ICogYjQgKyB4NyAqIGIzKSAqIGludmRldDtcbiAgICBkZXN0WzEgXSA9ICgtIHgxICogYjUgKyB4MiAqIGI0IC0geDMgKiBiMykgKiBpbnZkZXQ7XG4gICAgZGVzdFsyIF0gPSAoKyB4MTMgKiBhNSAtIHgxNCAqIGE0ICsgeDE1ICogYTMpICogaW52ZGV0O1xuICAgIGRlc3RbMyBdID0gKC0geDkgKiBhNSArIHgxMCAqIGE0IC0geDExICogYTMpICogaW52ZGV0O1xuICAgIGRlc3RbNCBdID0gKC0geDQgKiBiNSArIHg2ICogYjIgLSB4NyAqIGIxKSAqIGludmRldDtcbiAgICBkZXN0WzUgXSA9ICgrIHgwICogYjUgLSB4MiAqIGIyICsgeDMgKiBiMSkgKiBpbnZkZXQ7XG4gICAgZGVzdFs2IF0gPSAoLSB4MTIgKiBhNSArIHgxNCAqIGEyIC0geDE1ICogYTEpICogaW52ZGV0O1xuICAgIGRlc3RbNyBdID0gKCsgeDggKiBhNSAtIHgxMCAqIGEyICsgeDExICogYTEpICogaW52ZGV0O1xuICAgIGRlc3RbOCBdID0gKCsgeDQgKiBiNCAtIHg1ICogYjIgKyB4NyAqIGIwKSAqIGludmRldDtcbiAgICBkZXN0WzkgXSA9ICgtIHgwICogYjQgKyB4MSAqIGIyIC0geDMgKiBiMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxMF0gPSAoKyB4MTIgKiBhNCAtIHgxMyAqIGEyICsgeDE1ICogYTApICogaW52ZGV0O1xuICAgIGRlc3RbMTFdID0gKC0geDggKiBhNCArIHg5ICogYTIgLSB4MTEgKiBhMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxMl0gPSAoLSB4NCAqIGIzICsgeDUgKiBiMSAtIHg2ICogYjApICogaW52ZGV0O1xuICAgIGRlc3RbMTNdID0gKCsgeDAgKiBiMyAtIHgxICogYjEgKyB4MiAqIGIwKSAqIGludmRldDtcbiAgICBkZXN0WzE0XSA9ICgtIHgxMiAqIGEzICsgeDEzICogYTEgLSB4MTQgKiBhMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxNV0gPSAoKyB4OCAqIGEzIC0geDkgKiBhMSArIHgxMCAqIGEwKSAqIGludmRldDtcblxuICAgIHJldHVybiBkZXN0O1xuXG4gIH0sXG4gIC8vIFRPRE8obmljbykgYnJlYWtpbmcgY29udmVudGlvbiBoZXJlLi4uXG4gIC8vIGJlY2F1c2UgSSBkb24ndCB0aGluayBpdCdzIHVzZWZ1bCB0byBhZGRcbiAgLy8gdHdvIG1ldGhvZHMgZm9yIGVhY2ggb2YgdGhlc2UuXG4gIGxvb2tBdChkZXN0LCBleWUsIGNlbnRlciwgdXApIHtcbiAgICB2YXIgeiA9IFZlYzMuc3ViKGV5ZSwgY2VudGVyKTtcbiAgICB6LiR1bml0KCk7XG4gICAgdmFyIHggPSBWZWMzLmNyb3NzKHVwLCB6KTtcbiAgICB4LiR1bml0KCk7XG4gICAgdmFyIHkgPSBWZWMzLmNyb3NzKHosIHgpO1xuICAgIHkuJHVuaXQoKTtcbiAgICByZXR1cm4gTWF0NC5zZXQoZGVzdCwgeFswXSwgeFsxXSwgeFsyXSwgLXguZG90KGV5ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHlbMF0sIHlbMV0sIHlbMl0sIC15LmRvdChleWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB6WzBdLCB6WzFdLCB6WzJdLCAtei5kb3QoZXllKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgMCwgMCwgMSk7XG4gIH0sXG5cbiAgZnJ1c3R1bShkZXN0LCBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgIHZhciBybCA9IHJpZ2h0IC0gbGVmdCxcbiAgICAgICAgdGIgPSB0b3AgLSBib3R0b20sXG4gICAgICAgIGZuID0gZmFyIC0gbmVhcjtcblxuICAgIGRlc3RbMF0gPSAobmVhciAqIDIpIC8gcmw7XG4gICAgZGVzdFsxXSA9IDA7XG4gICAgZGVzdFsyXSA9IDA7XG4gICAgZGVzdFszXSA9IDA7XG4gICAgZGVzdFs0XSA9IDA7XG4gICAgZGVzdFs1XSA9IChuZWFyICogMikgLyB0YjtcbiAgICBkZXN0WzZdID0gMDtcbiAgICBkZXN0WzddID0gMDtcbiAgICBkZXN0WzhdID0gKHJpZ2h0ICsgbGVmdCkgLyBybDtcbiAgICBkZXN0WzldID0gKHRvcCArIGJvdHRvbSkgLyB0YjtcbiAgICBkZXN0WzEwXSA9IC0oZmFyICsgbmVhcikgLyBmbjtcbiAgICBkZXN0WzExXSA9IC0xO1xuICAgIGRlc3RbMTJdID0gMDtcbiAgICBkZXN0WzEzXSA9IDA7XG4gICAgZGVzdFsxNF0gPSAtKGZhciAqIG5lYXIgKiAyKSAvIGZuO1xuICAgIGRlc3RbMTVdID0gMDtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHBlcnNwZWN0aXZlKGRlc3QsIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgeW1heCA9IG5lYXIgKiB0YW4oZm92ICogcGkgLyAzNjApLFxuICAgICAgICB5bWluID0gLXltYXgsXG4gICAgICAgIHhtaW4gPSB5bWluICogYXNwZWN0LFxuICAgICAgICB4bWF4ID0geW1heCAqIGFzcGVjdDtcblxuICAgIHJldHVybiBNYXQ0LmZydXN0dW0oZGVzdCwgeG1pbiwgeG1heCwgeW1pbiwgeW1heCwgbmVhciwgZmFyKTtcbiAgfSxcblxuICBvcnRobyhkZXN0LCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b20sIG5lYXIsIGZhcikge1xuICAgIHZhciB0ZSA9IHRoaXMuZWxlbWVudHMsXG4gICAgICAgIHcgPSByaWdodCAtIGxlZnQsXG4gICAgICAgIGggPSB0b3AgLSBib3R0b20sXG4gICAgICAgIHAgPSBmYXIgLSBuZWFyLFxuICAgICAgICB4ID0gKHJpZ2h0ICsgbGVmdCkgLyB3LFxuICAgICAgICB5ID0gKHRvcCArIGJvdHRvbSkgLyBoLFxuICAgICAgICB6ID0gKGZhciArIG5lYXIpIC8gcDtcblxuICAgIGRlc3RbMF0gPSAyIC8gdztcdGRlc3RbNF0gPSAwO1x0ZGVzdFs4XSA9IDA7XHRkZXN0WzEyXSA9IC14O1xuICAgIGRlc3RbMV0gPSAwO1x0ZGVzdFs1XSA9IDIgLyBoO1x0ZGVzdFs5XSA9IDA7XHRkZXN0WzEzXSA9IC15O1xuICAgIGRlc3RbMl0gPSAwO1x0ZGVzdFs2XSA9IDA7XHRkZXN0WzEwXSA9IC0yIC8gcDtcdGRlc3RbMTRdID0gLXo7XG4gICAgZGVzdFszXSA9IDA7XHRkZXN0WzddID0gMDtcdGRlc3RbMTFdID0gMDtcdGRlc3RbMTVdID0gMTtcblxuICAgIHJldHVybiBkZXN0O1xuXHR9LFxuXG4gIHRvRmxvYXQzMkFycmF5KGRlc3QpIHtcbiAgICB2YXIgYW5zID0gZGVzdC50eXBlZENvbnRhaW5lcjtcblxuICAgIGlmICghYW5zKSB7XG4gICAgICByZXR1cm4gZGVzdDtcbiAgICB9XG5cbiAgICBhbnNbMF0gPSBkZXN0WzBdO1xuICAgIGFuc1sxXSA9IGRlc3RbMV07XG4gICAgYW5zWzJdID0gZGVzdFsyXTtcbiAgICBhbnNbM10gPSBkZXN0WzNdO1xuICAgIGFuc1s0XSA9IGRlc3RbNF07XG4gICAgYW5zWzVdID0gZGVzdFs1XTtcbiAgICBhbnNbNl0gPSBkZXN0WzZdO1xuICAgIGFuc1s3XSA9IGRlc3RbN107XG4gICAgYW5zWzhdID0gZGVzdFs4XTtcbiAgICBhbnNbOV0gPSBkZXN0WzldO1xuICAgIGFuc1sxMF0gPSBkZXN0WzEwXTtcbiAgICBhbnNbMTFdID0gZGVzdFsxMV07XG4gICAgYW5zWzEyXSA9IGRlc3RbMTJdO1xuICAgIGFuc1sxM10gPSBkZXN0WzEzXTtcbiAgICBhbnNbMTRdID0gZGVzdFsxNF07XG4gICAgYW5zWzE1XSA9IGRlc3RbMTVdO1xuXG4gICAgcmV0dXJuIGFucztcbiAgfVxuXG59O1xuXG4vLyBhZGQgZ2VuZXJpY3MgYW5kIGluc3RhbmNlIG1ldGhvZHNcbnByb3RvID0gTWF0NC5wcm90b3R5cGU7XG5mb3IgKG1ldGhvZCBpbiBnZW5lcmljcykge1xuICBNYXQ0W21ldGhvZF0gPSBnZW5lcmljc1ttZXRob2RdO1xuICBwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICAgIHJldHVybiBNYXQ0W21dLmFwcGx5KE1hdDQsIGFyZ3MpO1xuICAgIH07XG4gfSkobWV0aG9kKTtcbn1cblxuLy8gUXVhdGVybmlvbiBjbGFzc1xuZXhwb3J0IGNsYXNzIFF1YXQgZXh0ZW5kcyBBcnJheSB7XG4gIGNvbnN0cnVjdG9yKHgsIHksIHosIHcpIHtcbiAgICBzdXBlcig0KTtcbiAgICB0aGlzWzBdID0geCB8fCAwO1xuICAgIHRoaXNbMV0gPSB5IHx8IDA7XG4gICAgdGhpc1syXSA9IHogfHwgMDtcbiAgICB0aGlzWzNdID0gdyB8fCAwO1xuXG4gICAgdGhpcy50eXBlZENvbnRhaW5lciA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlKCkge1xuICAgIHJldHVybiBuZXcgQXJyYXkoNCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbVZlYzModiwgcikge1xuICAgIHJldHVybiBuZXcgUXVhdCh2WzBdLCB2WzFdLCB2WzJdLCByIHx8IDApO1xuICB9XG5cbiAgc3RhdGljIGZyb21NYXQ0KG0pIHtcbiAgICB2YXIgdTtcbiAgICB2YXIgdjtcbiAgICB2YXIgdztcblxuICAgIC8vIENob29zZSB1LCB2LCBhbmQgdyBzdWNoIHRoYXQgdSBpcyB0aGUgaW5kZXggb2YgdGhlIGJpZ2dlc3QgZGlhZ29uYWwgZW50cnlcbiAgICAvLyBvZiBtLCBhbmQgdSB2IHcgaXMgYW4gZXZlbiBwZXJtdXRhdGlvbiBvZiAwIDEgYW5kIDIuXG4gICAgaWYgKG1bMF0gPiBtWzVdICYmIG1bMF0gPiBtWzEwXSkge1xuICAgICAgdSA9IDA7XG4gICAgICB2ID0gMTtcbiAgICAgIHcgPSAyO1xuICAgIH0gZWxzZSBpZiAobVs1XSA+IG1bMF0gJiYgbVs1XSA+IG1bMTBdKSB7XG4gICAgICB1ID0gMTtcbiAgICAgIHYgPSAyO1xuICAgICAgdyA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHUgPSAyO1xuICAgICAgdiA9IDA7XG4gICAgICB3ID0gMTtcbiAgICB9XG5cbiAgICB2YXIgciA9IHNxcnQoMSArIG1bdSAqIDVdIC0gbVt2ICogNV0gLSBtW3cgKiA1XSk7XG4gICAgdmFyIHEgPSBuZXcgUXVhdDtcblxuICAgIHFbdV0gPSAwLjUgKiByO1xuICAgIHFbdl0gPSAwLjUgKiAobVsnbicgKyB2ICsgJycgKyB1XSArIG1bJ24nICsgdSArICcnICsgdl0pIC8gcjtcbiAgICBxW3ddID0gMC41ICogKG1bJ24nICsgdSArICcnICsgd10gKyBtWyduJyArIHcgKyAnJyArIHVdKSAvIHI7XG4gICAgcVszXSA9IDAuNSAqIChtWyduJyArIHYgKyAnJyArIHddIC0gbVsnbicgKyB3ICsgJycgKyB2XSkgLyByO1xuXG4gICAgcmV0dXJuIHE7XG4gIH1cblxuICBzdGF0aWMgZnJvbVhSb3RhdGlvbihhbmdsZSkge1xuICAgIHJldHVybiBuZXcgUXVhdChzaW4oYW5nbGUgLyAyKSwgMCwgMCwgY29zKGFuZ2xlIC8gMikpO1xuICB9XG5cbiAgc3RhdGljIGZyb21ZUm90YXRpb24oYW5nbGUpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoMCwgc2luKGFuZ2xlIC8gMiksIDAsIGNvcyhhbmdsZSAvIDIpKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tWlJvdGF0aW9uKGFuZ2xlKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KDAsIDAsIHNpbihhbmdsZSAvIDIpLCBjb3MoYW5nbGUgLyAyKSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUF4aXNSb3RhdGlvbih2ZWMsIGFuZ2xlKSB7XG4gICAgdmFyIHggPSB2ZWNbMF0sXG4gICAgICAgIHkgPSB2ZWNbMV0sXG4gICAgICAgIHogPSB2ZWNbMl0sXG4gICAgICAgIGQgPSAxIC8gc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopLFxuICAgICAgICBzID0gc2luKGFuZ2xlIC8gMiksXG4gICAgICAgIGMgPSBjb3MoYW5nbGUgLyAyKTtcblxuICAgIHJldHVybiBuZXcgUXVhdChzICogeCAqIGQsIHMgKiB5ICogZCwgcyAqIHogKiBkLCBjKTtcbiAgfVxuXG59XG5cbmdlbmVyaWNzID0ge1xuXG4gIHNldFF1YXQoZGVzdCwgcSkge1xuICAgIGRlc3RbMF0gPSBxWzBdO1xuICAgIGRlc3RbMV0gPSBxWzFdO1xuICAgIGRlc3RbMl0gPSBxWzJdO1xuICAgIGRlc3RbM10gPSBxWzNdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc2V0KGRlc3QsIHgsIHksIHosIHcpIHtcbiAgICBkZXN0WzBdID0geCB8fCAwO1xuICAgIGRlc3RbMV0gPSB5IHx8IDA7XG4gICAgZGVzdFsyXSA9IHogfHwgMDtcbiAgICBkZXN0WzNdID0gdyB8fCAwO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgY2xvbmUoZGVzdCkge1xuICAgIGlmIChkZXN0IGluc3RhbmNlb2YgUXVhdCkge1xuICAgICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0sIGRlc3RbMV0sIGRlc3RbMl0sIGRlc3RbM10pO1xuICAgIH1cbiAgICByZXR1cm4gUXVhdC5zZXRRdWF0KG5ldyB0eXBlZEFycmF5KDQpLCBkZXN0KTtcbiAgfSxcblxuICBuZWcoZGVzdCkge1xuICAgIHJldHVybiBuZXcgUXVhdCgtZGVzdFswXSwgLWRlc3RbMV0sIC1kZXN0WzJdLCAtZGVzdFszXSk7XG4gIH0sXG5cbiAgJG5lZyhkZXN0KSB7XG4gICAgZGVzdFswXSA9IC1kZXN0WzBdO1xuICAgIGRlc3RbMV0gPSAtZGVzdFsxXTtcbiAgICBkZXN0WzJdID0gLWRlc3RbMl07XG4gICAgZGVzdFszXSA9IC1kZXN0WzNdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgYWRkKGRlc3QsIHEpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoZGVzdFswXSArIHFbMF0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKyBxWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICsgcVsyXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFszXSArIHFbM10pO1xuICB9LFxuXG4gICRhZGQoZGVzdCwgcSkge1xuICAgIGRlc3RbMF0gKz0gcVswXTtcbiAgICBkZXN0WzFdICs9IHFbMV07XG4gICAgZGVzdFsyXSArPSBxWzJdO1xuICAgIGRlc3RbM10gKz0gcVszXTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHN1YihkZXN0LCBxKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0gLSBxWzBdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdIC0gcVsxXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAtIHFbMl0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbM10gLSBxWzNdKTtcbiAgfSxcblxuICAkc3ViKGRlc3QsIHEpIHtcbiAgICBkZXN0WzBdIC09IHFbMF07XG4gICAgZGVzdFsxXSAtPSBxWzFdO1xuICAgIGRlc3RbMl0gLT0gcVsyXTtcbiAgICBkZXN0WzNdIC09IHFbM107XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzY2FsZShkZXN0LCBzKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdICogcyxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAqIHMsXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbM10gKiBzKTtcbiAgfSxcblxuICAkc2NhbGUoZGVzdCwgcykge1xuICAgIGRlc3RbMF0gKj0gcztcbiAgICBkZXN0WzFdICo9IHM7XG4gICAgZGVzdFsyXSAqPSBzO1xuICAgIGRlc3RbM10gKj0gcztcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIG11bFF1YXQoZGVzdCwgcSkge1xuICAgIHZhciBhWCA9IGRlc3RbMF0sXG4gICAgICAgIGFZID0gZGVzdFsxXSxcbiAgICAgICAgYVogPSBkZXN0WzJdLFxuICAgICAgICBhVyA9IGRlc3RbM10sXG4gICAgICAgIGJYID0gcVswXSxcbiAgICAgICAgYlkgPSBxWzFdLFxuICAgICAgICBiWiA9IHFbMl0sXG4gICAgICAgIGJXID0gcVszXTtcblxuICAgIHJldHVybiBuZXcgUXVhdChhVyAqIGJYICsgYVggKiBiVyArIGFZICogYlogLSBhWiAqIGJZLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJZICsgYVkgKiBiVyArIGFaICogYlggLSBhWCAqIGJaLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJaICsgYVogKiBiVyArIGFYICogYlkgLSBhWSAqIGJYLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJXIC0gYVggKiBiWCAtIGFZICogYlkgLSBhWiAqIGJaKTtcbiAgfSxcblxuICAkbXVsUXVhdChkZXN0LCBxKSB7XG4gICAgdmFyIGFYID0gZGVzdFswXSxcbiAgICAgICAgYVkgPSBkZXN0WzFdLFxuICAgICAgICBhWiA9IGRlc3RbMl0sXG4gICAgICAgIGFXID0gZGVzdFszXSxcbiAgICAgICAgYlggPSBxWzBdLFxuICAgICAgICBiWSA9IHFbMV0sXG4gICAgICAgIGJaID0gcVsyXSxcbiAgICAgICAgYlcgPSBxWzNdO1xuXG4gICAgZGVzdFswXSA9IGFXICogYlggKyBhWCAqIGJXICsgYVkgKiBiWiAtIGFaICogYlk7XG4gICAgZGVzdFsxXSA9IGFXICogYlkgKyBhWSAqIGJXICsgYVogKiBiWCAtIGFYICogYlo7XG4gICAgZGVzdFsyXSA9IGFXICogYlogKyBhWiAqIGJXICsgYVggKiBiWSAtIGFZICogYlg7XG4gICAgZGVzdFszXSA9IGFXICogYlcgLSBhWCAqIGJYIC0gYVkgKiBiWSAtIGFaICogYlo7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBkaXZRdWF0KGRlc3QsIHEpIHtcbiAgICB2YXIgYVggPSBkZXN0WzBdLFxuICAgICAgICBhWSA9IGRlc3RbMV0sXG4gICAgICAgIGFaID0gZGVzdFsyXSxcbiAgICAgICAgYVcgPSBkZXN0WzNdLFxuICAgICAgICBiWCA9IHFbMF0sXG4gICAgICAgIGJZID0gcVsxXSxcbiAgICAgICAgYlogPSBxWzJdLFxuICAgICAgICBiVyA9IHFbM107XG5cbiAgICB2YXIgZCA9IDEgLyAoYlcgKiBiVyArIGJYICogYlggKyBiWSAqIGJZICsgYlogKiBiWik7XG5cbiAgICByZXR1cm4gbmV3IFF1YXQoKGFYICogYlcgLSBhVyAqIGJYIC0gYVkgKiBiWiArIGFaICogYlkpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFYICogYlogLSBhVyAqIGJZICsgYVkgKiBiVyAtIGFaICogYlgpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFZICogYlggKyBhWiAqIGJXIC0gYVcgKiBiWiAtIGFYICogYlkpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFXICogYlcgKyBhWCAqIGJYICsgYVkgKiBiWSArIGFaICogYlopICogZCk7XG4gIH0sXG5cbiAgJGRpdlF1YXQoZGVzdCwgcSkge1xuICAgIHZhciBhWCA9IGRlc3RbMF0sXG4gICAgICAgIGFZID0gZGVzdFsxXSxcbiAgICAgICAgYVogPSBkZXN0WzJdLFxuICAgICAgICBhVyA9IGRlc3RbM10sXG4gICAgICAgIGJYID0gcVswXSxcbiAgICAgICAgYlkgPSBxWzFdLFxuICAgICAgICBiWiA9IHFbMl0sXG4gICAgICAgIGJXID0gcVszXTtcblxuICAgIHZhciBkID0gMSAvIChiVyAqIGJXICsgYlggKiBiWCArIGJZICogYlkgKyBiWiAqIGJaKTtcblxuICAgIGRlc3RbMF0gPSAoYVggKiBiVyAtIGFXICogYlggLSBhWSAqIGJaICsgYVogKiBiWSkgKiBkO1xuICAgIGRlc3RbMV0gPSAoYVggKiBiWiAtIGFXICogYlkgKyBhWSAqIGJXIC0gYVogKiBiWCkgKiBkO1xuICAgIGRlc3RbMl0gPSAoYVkgKiBiWCArIGFaICogYlcgLSBhVyAqIGJaIC0gYVggKiBiWSkgKiBkO1xuICAgIGRlc3RbM10gPSAoYVcgKiBiVyArIGFYICogYlggKyBhWSAqIGJZICsgYVogKiBiWikgKiBkO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgaW52ZXJ0KGRlc3QpIHtcbiAgICB2YXIgcTAgPSBkZXN0WzBdLFxuICAgICAgICBxMSA9IGRlc3RbMV0sXG4gICAgICAgIHEyID0gZGVzdFsyXSxcbiAgICAgICAgcTMgPSBkZXN0WzNdO1xuXG4gICAgdmFyIGQgPSAxIC8gKHEwICogcTAgKyBxMSAqIHExICsgcTIgKiBxMiArIHEzICogcTMpO1xuXG4gICAgcmV0dXJuIG5ldyBRdWF0KC1xMCAqIGQsIC1xMSAqIGQsIC1xMiAqIGQsIHEzICogZCk7XG4gIH0sXG5cbiAgJGludmVydChkZXN0KSB7XG4gICAgdmFyIHEwID0gZGVzdFswXSxcbiAgICAgICAgcTEgPSBkZXN0WzFdLFxuICAgICAgICBxMiA9IGRlc3RbMl0sXG4gICAgICAgIHEzID0gZGVzdFszXTtcblxuICAgIHZhciBkID0gMSAvIChxMCAqIHEwICsgcTEgKiBxMSArIHEyICogcTIgKyBxMyAqIHEzKTtcblxuICAgIGRlc3RbMF0gPSAtcTAgKiBkO1xuICAgIGRlc3RbMV0gPSAtcTEgKiBkO1xuICAgIGRlc3RbMl0gPSAtcTIgKiBkO1xuICAgIGRlc3RbM10gPSBxMyAqIGQ7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBub3JtKGRlc3QpIHtcbiAgICB2YXIgYSA9IGRlc3RbMF0sXG4gICAgICAgIGIgPSBkZXN0WzFdLFxuICAgICAgICBjID0gZGVzdFsyXSxcbiAgICAgICAgZCA9IGRlc3RbM107XG5cbiAgICByZXR1cm4gc3FydChhICogYSArIGIgKiBiICsgYyAqIGMgKyBkICogZCk7XG4gIH0sXG5cbiAgbm9ybVNxKGRlc3QpIHtcbiAgICB2YXIgYSA9IGRlc3RbMF0sXG4gICAgICAgIGIgPSBkZXN0WzFdLFxuICAgICAgICBjID0gZGVzdFsyXSxcbiAgICAgICAgZCA9IGRlc3RbM107XG5cbiAgICByZXR1cm4gYSAqIGEgKyBiICogYiArIGMgKiBjICsgZCAqIGQ7XG4gIH0sXG5cbiAgdW5pdChkZXN0KSB7XG4gICAgcmV0dXJuIFF1YXQuc2NhbGUoZGVzdCwgMSAvIFF1YXQubm9ybShkZXN0KSk7XG4gIH0sXG5cbiAgJHVuaXQoZGVzdCkge1xuICAgIHJldHVybiBRdWF0LiRzY2FsZShkZXN0LCAxIC8gUXVhdC5ub3JtKGRlc3QpKTtcbiAgfSxcblxuICBjb25qdWdhdGUoZGVzdCkge1xuICAgIHJldHVybiBuZXcgUXVhdCgtZGVzdFswXSwgLWRlc3RbMV0sIC1kZXN0WzJdLCBkZXN0WzNdKTtcbiAgfSxcblxuICAkY29uanVnYXRlKGRlc3QpIHtcbiAgICBkZXN0WzBdID0gLWRlc3RbMF07XG4gICAgZGVzdFsxXSA9IC1kZXN0WzFdO1xuICAgIGRlc3RbMl0gPSAtZGVzdFsyXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfVxufTtcblxuLy8gYWRkIGdlbmVyaWNzIGFuZCBpbnN0YW5jZSBtZXRob2RzXG5cbnByb3RvID0gUXVhdC5wcm90b3R5cGUgPSB7fTtcblxuZm9yIChtZXRob2QgaW4gZ2VuZXJpY3MpIHtcbiAgUXVhdFttZXRob2RdID0gZ2VuZXJpY3NbbWV0aG9kXTtcbiAgcHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiAobSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgICByZXR1cm4gUXVhdFttXS5hcHBseShRdWF0LCBhcmdzKTtcbiAgICB9O1xuIH0pKG1ldGhvZCk7XG59XG5cbi8vIEFkZCBzdGF0aWMgbWV0aG9kc1xuVmVjMy5mcm9tUXVhdCA9IGZ1bmN0aW9uKHEpIHtcbiAgcmV0dXJuIG5ldyBWZWMzKHFbMF0sIHFbMV0sIHFbMl0pO1xufTtcblxuTWF0NC5mcm9tUXVhdCA9IGZ1bmN0aW9uKHEpIHtcbiAgdmFyIGEgPSBxWzNdLFxuICAgICAgYiA9IHFbMF0sXG4gICAgICBjID0gcVsxXSxcbiAgICAgIGQgPSBxWzJdO1xuXG4gIHJldHVybiBuZXcgTWF0NChcbiAgICBhICogYSArIGIgKiBiIC0gYyAqIGMgLSBkICogZCxcbiAgICAyICogYiAqIGMgLSAyICogYSAqIGQsXG4gICAgMiAqIGIgKiBkICsgMiAqIGEgKiBjLFxuICAgIDAsXG5cbiAgICAyICogYiAqIGMgKyAyICogYSAqIGQsXG4gICAgYSAqIGEgLSBiICogYiArIGMgKiBjIC0gZCAqIGQsXG4gICAgMiAqIGMgKiBkIC0gMiAqIGEgKiBiLFxuICAgIDAsXG5cbiAgICAyICogYiAqIGQgLSAyICogYSAqIGMsXG4gICAgMiAqIGMgKiBkICsgMiAqIGEgKiBiLFxuICAgIGEgKiBhIC0gYiAqIGIgLSBjICogYyArIGQgKiBkLFxuICAgIDAsXG5cbiAgICAwLCAwLCAwLCAxKTtcbn07XG4iXX0=