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
    var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
    var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    var z = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

    _classCallCheck(this, Vec3);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Vec3).call(this, 3));

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

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Mat4).call(this, 16));

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

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(Quat).call(this, 4));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRoL2FycmF5LWltcGwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU0sT0FBTyxLQUFLLElBQWxCO0FBQ0EsSUFBTSxNQUFNLEtBQUssR0FBakI7QUFDQSxJQUFNLE1BQU0sS0FBSyxHQUFqQjtBQUNBLElBQU0sTUFBTSxLQUFLLEdBQWpCO0FBQ0EsSUFBTSxLQUFLLEtBQUssRUFBaEI7QUFDQSxJQUFNLFFBQVEsTUFBTSxTQUFOLENBQWdCLEtBQTlCOztBQUVBOztJQUNhLEksV0FBQSxJOzs7QUFFWCxrQkFBaUM7QUFBQSxRQUFyQixDQUFxQix5REFBakIsQ0FBaUI7QUFBQSxRQUFkLENBQWMseURBQVYsQ0FBVTtBQUFBLFFBQVAsQ0FBTyx5REFBSCxDQUFHOztBQUFBOztBQUFBLHdGQUN6QixDQUR5Qjs7QUFFL0IsVUFBSyxDQUFMLElBQVUsQ0FBVjtBQUNBLFVBQUssQ0FBTCxJQUFVLENBQVY7QUFDQSxVQUFLLENBQUwsSUFBVSxDQUFWO0FBSitCO0FBS2hDOztBQUVEOzs7Ozt3QkFLUTtBQUNOLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFDRCxLO3NCQUVLLEssRUFBTztBQUNYLGFBQVEsS0FBSyxDQUFMLElBQVUsS0FBbEI7QUFDRDs7O3dCQUVPO0FBQ04sYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUNELEs7c0JBRUssSyxFQUFPO0FBQ1gsYUFBUSxLQUFLLENBQUwsSUFBVSxLQUFsQjtBQUNEOzs7d0JBRU87QUFDTixhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQ0QsSztzQkFFSyxLLEVBQU87QUFDWCxhQUFRLEtBQUssQ0FBTCxJQUFVLEtBQWxCO0FBQ0Q7Ozs2QkExQmU7QUFDZCxhQUFPLElBQUksSUFBSixDQUFTLENBQVQsQ0FBUDtBQUNEOzs7O3FCQVp1QixLOztBQXVDMUIsSUFBSSxXQUFXO0FBRWIsU0FGYSxtQkFFTCxJQUZLLEVBRUMsR0FGRCxFQUVNO0FBQ2pCLFNBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBVjtBQUNBLFdBQU8sSUFBUDtBQUNELEdBUFk7QUFTYixLQVRhLGVBU1QsSUFUUyxFQVNILENBVEcsRUFTQSxDQVRBLEVBU0csQ0FUSCxFQVNNO0FBQ2pCLFNBQUssQ0FBTCxJQUFVLENBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBVjtBQUNBLFdBQU8sSUFBUDtBQUNELEdBZFk7QUFnQmIsS0FoQmEsZUFnQlQsSUFoQlMsRUFnQkgsR0FoQkcsRUFnQkU7QUFDYixXQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUFuQixFQUNTLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQURuQixFQUVTLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUZuQixDQUFQO0FBR0QsR0FwQlk7QUFzQmIsTUF0QmEsZ0JBc0JSLElBdEJRLEVBc0JGLEdBdEJFLEVBc0JHO0FBQ2QsU0FBSyxDQUFMLEtBQVcsSUFBSSxDQUFKLENBQVg7QUFDQSxTQUFLLENBQUwsS0FBVyxJQUFJLENBQUosQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLElBQUksQ0FBSixDQUFYO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0EzQlk7QUE2QmIsTUE3QmEsZ0JBNkJSLElBN0JRLEVBNkJGLENBN0JFLEVBNkJDLENBN0JELEVBNkJJO0FBQ2YsU0FBSyxDQUFMLElBQVUsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQWpCO0FBQ0EsU0FBSyxDQUFMLElBQVUsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQWpCO0FBQ0EsU0FBSyxDQUFMLElBQVUsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQWpCO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FsQ1k7QUFvQ2IsS0FwQ2EsZUFvQ1QsSUFwQ1MsRUFvQ0gsR0FwQ0csRUFvQ0U7QUFDYixXQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUFuQixFQUNTLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQURuQixFQUVTLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUZuQixDQUFQO0FBR0QsR0F4Q1k7QUEwQ2IsTUExQ2EsZ0JBMENSLElBMUNRLEVBMENGLEdBMUNFLEVBMENHO0FBQ2QsU0FBSyxDQUFMLEtBQVcsSUFBSSxDQUFKLENBQVg7QUFDQSxTQUFLLENBQUwsS0FBVyxJQUFJLENBQUosQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLElBQUksQ0FBSixDQUFYO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0EvQ1k7QUFpRGIsTUFqRGEsZ0JBaURSLElBakRRLEVBaURGLENBakRFLEVBaURDLENBakRELEVBaURJO0FBQ2YsU0FBSyxDQUFMLElBQVUsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQWpCO0FBQ0EsU0FBSyxDQUFMLElBQVUsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQWpCO0FBQ0EsU0FBSyxDQUFMLElBQVUsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQWpCO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0F0RFk7QUF3RGIsT0F4RGEsaUJBd0RQLElBeERPLEVBd0RELENBeERDLEVBd0RFO0FBQ2IsV0FBTyxJQUFJLElBQUosQ0FBUyxLQUFLLENBQUwsSUFBVSxDQUFuQixFQUNTLEtBQUssQ0FBTCxJQUFVLENBRG5CLEVBRVMsS0FBSyxDQUFMLElBQVUsQ0FGbkIsQ0FBUDtBQUdELEdBNURZO0FBOERiLFFBOURhLGtCQThETixJQTlETSxFQThEQSxDQTlEQSxFQThERztBQUNkLFNBQUssQ0FBTCxLQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsS0FBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLEtBQVcsQ0FBWDtBQUNBLFdBQU8sSUFBUDtBQUNELEdBbkVZO0FBcUViLEtBckVhLGVBcUVULElBckVTLEVBcUVIO0FBQ1IsV0FBTyxJQUFJLElBQUosQ0FBUyxDQUFDLEtBQUssQ0FBTCxDQUFWLEVBQ1MsQ0FBQyxLQUFLLENBQUwsQ0FEVixFQUVTLENBQUMsS0FBSyxDQUFMLENBRlYsQ0FBUDtBQUdELEdBekVZO0FBMkViLE1BM0VhLGdCQTJFUixJQTNFUSxFQTJFRjtBQUNULFNBQUssQ0FBTCxJQUFVLENBQUMsS0FBSyxDQUFMLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFDLEtBQUssQ0FBTCxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLENBQUwsQ0FBWDtBQUNBLFdBQU8sSUFBUDtBQUNELEdBaEZZO0FBa0ZiLE1BbEZhLGdCQWtGUixJQWxGUSxFQWtGRjtBQUNULFFBQUksTUFBTSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQVY7O0FBRUEsUUFBSSxNQUFNLENBQVYsRUFBYTtBQUNYLGFBQU8sS0FBSyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFJLEdBQXJCLENBQVA7QUFDRDtBQUNELFdBQU8sS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFQO0FBQ0QsR0F6Rlk7QUEyRmIsT0EzRmEsaUJBMkZQLElBM0ZPLEVBMkZEO0FBQ1YsUUFBSSxNQUFNLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBVjs7QUFFQSxRQUFJLE1BQU0sQ0FBVixFQUFhO0FBQ1gsYUFBTyxLQUFLLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQUksR0FBdEIsQ0FBUDtBQUNEO0FBQ0QsV0FBTyxJQUFQO0FBQ0QsR0FsR1k7QUFvR2IsT0FwR2EsaUJBb0dQLElBcEdPLEVBb0dELEdBcEdDLEVBb0dJO0FBQ2YsUUFBSSxLQUFLLEtBQUssQ0FBTCxDQUFUO0FBQUEsUUFDRSxLQUFLLEtBQUssQ0FBTCxDQURQO0FBQUEsUUFFRSxLQUFLLEtBQUssQ0FBTCxDQUZQO0FBQUEsUUFHRSxLQUFLLElBQUksQ0FBSixDQUhQO0FBQUEsUUFJRSxLQUFLLElBQUksQ0FBSixDQUpQO0FBQUEsUUFLRSxLQUFLLElBQUksQ0FBSixDQUxQOztBQU9BLFdBQU8sSUFBSSxJQUFKLENBQVMsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUF4QixFQUNTLEtBQUssRUFBTCxHQUFVLEtBQUssRUFEeEIsRUFFUyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBRnhCLENBQVA7QUFHRCxHQS9HWTtBQWlIYixRQWpIYSxrQkFpSE4sSUFqSE0sRUFpSEEsR0FqSEEsRUFpSEs7QUFDaEIsUUFBSSxLQUFLLEtBQUssQ0FBTCxDQUFUO0FBQUEsUUFDSSxLQUFLLEtBQUssQ0FBTCxDQURUO0FBQUEsUUFFSSxLQUFLLEtBQUssQ0FBTCxDQUZUO0FBQUEsUUFHSSxLQUFLLElBQUksQ0FBSixDQUhUO0FBQUEsUUFJSSxLQUFLLElBQUksQ0FBSixDQUpUO0FBQUEsUUFLSSxLQUFLLElBQUksQ0FBSixDQUxUOztBQU9BLFNBQUssQ0FBTCxJQUFVLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBekI7QUFDQSxTQUFLLENBQUwsSUFBVSxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQXpCO0FBQ0EsU0FBSyxDQUFMLElBQVUsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUF6QjtBQUNBLFdBQU8sSUFBUDtBQUNELEdBN0hZO0FBK0hiLFFBL0hhLGtCQStITixJQS9ITSxFQStIQSxHQS9IQSxFQStISztBQUNoQixRQUFJLEtBQUssS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBQW5CO0FBQUEsUUFDSSxLQUFLLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQURuQjtBQUFBLFFBRUksS0FBSyxLQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FGbkI7O0FBSUEsV0FBTyxLQUFLLEtBQUssRUFBTCxHQUNBLEtBQUssRUFETCxHQUVBLEtBQUssRUFGVixDQUFQO0FBR0QsR0F2SVk7QUF5SWIsVUF6SWEsb0JBeUlKLElBeklJLEVBeUlFLEdBeklGLEVBeUlPO0FBQ2xCLFFBQUksS0FBSyxLQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBbkI7QUFBQSxRQUNJLEtBQUssS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBRG5CO0FBQUEsUUFFSSxLQUFLLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUZuQjs7QUFJQSxXQUFPLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBZixHQUFvQixLQUFLLEVBQWhDO0FBQ0QsR0EvSVk7QUFpSmIsTUFqSmEsZ0JBaUpSLElBakpRLEVBaUpGO0FBQ1QsUUFBSSxLQUFLLEtBQUssQ0FBTCxDQUFUO0FBQUEsUUFBa0IsS0FBSyxLQUFLLENBQUwsQ0FBdkI7QUFBQSxRQUFnQyxLQUFLLEtBQUssQ0FBTCxDQUFyQzs7QUFFQSxXQUFPLEtBQUssS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBOUIsQ0FBUDtBQUNELEdBckpZO0FBdUpiLFFBdkphLGtCQXVKTixJQXZKTSxFQXVKQTtBQUNYLFFBQUksS0FBSyxLQUFLLENBQUwsQ0FBVDtBQUFBLFFBQWtCLEtBQUssS0FBSyxDQUFMLENBQXZCO0FBQUEsUUFBZ0MsS0FBSyxLQUFLLENBQUwsQ0FBckM7O0FBRUEsV0FBTyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUFoQztBQUNELEdBM0pZO0FBNkpiLEtBN0phLGVBNkpULElBN0pTLEVBNkpILEdBN0pHLEVBNkpFO0FBQ2IsV0FBTyxLQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBVixHQUFtQixLQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBN0IsR0FBc0MsS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBQXZEO0FBQ0QsR0EvSlk7QUFpS2IsT0FqS2EsaUJBaUtQLElBaktPLEVBaUtEO0FBQ1YsUUFBSSxnQkFBZ0IsSUFBcEIsRUFBMEI7QUFDeEIsYUFBTyxJQUFJLElBQUosQ0FBUyxLQUFLLENBQUwsQ0FBVCxFQUFrQixLQUFLLENBQUwsQ0FBbEIsRUFBMkIsS0FBSyxDQUFMLENBQTNCLENBQVA7QUFDRDtBQUNELFdBQU8sS0FBSyxPQUFMLENBQWEsSUFBSSxZQUFKLENBQWlCLENBQWpCLENBQWIsRUFBa0MsSUFBbEMsQ0FBUDtBQUNELEdBdEtZO0FBd0tiLGdCQXhLYSwwQkF3S0UsSUF4S0YsRUF3S1E7QUFDbkIsUUFBSSxNQUFNLEtBQUssY0FBZjs7QUFFQSxRQUFJLENBQUMsR0FBTCxFQUFVO0FBQ1IsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQsUUFBSSxDQUFKLElBQVMsS0FBSyxDQUFMLENBQVQ7QUFDQSxRQUFJLENBQUosSUFBUyxLQUFLLENBQUwsQ0FBVDtBQUNBLFFBQUksQ0FBSixJQUFTLEtBQUssQ0FBTCxDQUFUOztBQUVBLFdBQU8sR0FBUDtBQUNEO0FBcExZLENBQWY7O0FBdUxBO0FBQ0EsSUFBSSxRQUFRLEtBQUssU0FBakI7QUFDQSxLQUFLLElBQUksTUFBVCxJQUFtQixRQUFuQixFQUE2QjtBQUMzQixPQUFLLE1BQUwsSUFBZSxTQUFTLE1BQVQsQ0FBZjtBQUNBLFFBQU0sTUFBTixJQUFpQixTQUFTLENBQVQsQ0FBVyxDQUFYLEVBQWM7QUFDN0IsV0FBTyxZQUFXO0FBQ2hCLFVBQUksT0FBTyxNQUFNLElBQU4sQ0FBVyxTQUFYLENBQVg7QUFDQSxXQUFLLE9BQUwsQ0FBYSxJQUFiO0FBQ0EsYUFBTyxLQUFLLENBQUwsRUFBUSxLQUFSLENBQWMsSUFBZCxFQUFvQixJQUFwQixDQUFQO0FBQ0QsS0FKRDtBQUtGLEdBTmlCLENBTWhCLE1BTmdCLENBQWpCO0FBT0Q7O0FBRUQ7O0lBQ2EsSSxXQUFBLEk7OztBQUVYLGdCQUFZLEdBQVosRUFBaUIsR0FBakIsRUFBc0IsR0FBdEIsRUFBMkIsR0FBM0IsRUFDWSxHQURaLEVBQ2lCLEdBRGpCLEVBQ3NCLEdBRHRCLEVBQzJCLEdBRDNCLEVBRVksR0FGWixFQUVpQixHQUZqQixFQUVzQixHQUZ0QixFQUUyQixHQUYzQixFQUdZLEdBSFosRUFHaUIsR0FIakIsRUFHc0IsR0FIdEIsRUFHMkIsR0FIM0IsRUFHZ0M7QUFBQTs7QUFBQSx5RkFFeEIsRUFGd0I7O0FBSTlCLFdBQUssTUFBTCxHQUFjLEVBQWQ7O0FBRUEsUUFBSSxPQUFPLEdBQVAsS0FBZSxRQUFuQixFQUE2Qjs7QUFFM0IsYUFBSyxHQUFMLENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0IsR0FBeEIsRUFDUyxHQURULEVBQ2MsR0FEZCxFQUNtQixHQURuQixFQUN3QixHQUR4QixFQUVTLEdBRlQsRUFFYyxHQUZkLEVBRW1CLEdBRm5CLEVBRXdCLEdBRnhCLEVBR1MsR0FIVCxFQUdjLEdBSGQsRUFHbUIsR0FIbkIsRUFHd0IsR0FIeEI7QUFLRCxLQVBELE1BT087QUFDTCxhQUFLLEVBQUw7QUFDRDs7QUFFRCxXQUFLLGNBQUwsR0FBc0IsSUFBSSxZQUFKLENBQWlCLEVBQWpCLENBQXRCO0FBakI4QjtBQWtCL0I7Ozs7d0JBTVM7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFBaUIsSztzQkFpQnJCLEcsRUFBSztBQUFFLFdBQUssQ0FBTCxJQUFVLEdBQVY7QUFBZ0I7Ozt3QkFoQnJCO0FBQUUsYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUFpQixLO3NCQWlCckIsRyxFQUFLO0FBQUUsV0FBSyxDQUFMLElBQVUsR0FBVjtBQUFnQjs7O3dCQWhCckI7QUFBRSxhQUFPLEtBQUssRUFBTCxDQUFQO0FBQWtCLEs7c0JBaUJ0QixHLEVBQUs7QUFBRSxXQUFLLEVBQUwsSUFBVyxHQUFYO0FBQWlCOzs7d0JBaEJ0QjtBQUFFLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFBaUIsSztzQkFpQnJCLEcsRUFBSztBQUFFLFdBQUssQ0FBTCxJQUFVLEdBQVY7QUFBZ0I7Ozt3QkFoQnJCO0FBQUUsYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUFpQixLO3NCQWlCckIsRyxFQUFLO0FBQUUsV0FBSyxDQUFMLElBQVUsR0FBVjtBQUFnQjs7O3dCQWhCckI7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxFQUFMLENBQVA7QUFBa0IsSztzQkFpQnRCLEcsRUFBSztBQUFFLFdBQUssRUFBTCxJQUFXLEdBQVg7QUFBaUI7Ozt3QkFoQnRCO0FBQUUsYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUFpQixLO3NCQWlCckIsRyxFQUFLO0FBQUUsV0FBSyxDQUFMLElBQVUsR0FBVjtBQUFnQjs7O3dCQWhCckI7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxFQUFMLENBQVA7QUFBa0IsSztzQkFpQnRCLEcsRUFBSztBQUFFLFdBQUssRUFBTCxJQUFXLEdBQVg7QUFBaUI7Ozt3QkFoQnRCO0FBQUUsYUFBTyxLQUFLLEVBQUwsQ0FBUDtBQUFrQixLO3NCQWlCdEIsRyxFQUFLO0FBQUUsV0FBSyxFQUFMLElBQVcsR0FBWDtBQUFpQjs7O3dCQWhCdEI7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFBaUIsSztzQkFpQnJCLEcsRUFBSztBQUFFLFdBQUssQ0FBTCxJQUFVLEdBQVY7QUFBZ0I7Ozt3QkFoQnJCO0FBQUUsYUFBTyxLQUFLLEVBQUwsQ0FBUDtBQUFrQixLO3NCQWlCdEIsRyxFQUFLO0FBQUUsV0FBSyxFQUFMLElBQVcsR0FBWDtBQUFpQjs7O3dCQWhCdEI7QUFBRSxhQUFPLEtBQUssRUFBTCxDQUFQO0FBQWtCLEs7c0JBaUJ0QixHLEVBQUs7QUFBRSxXQUFLLEVBQUwsSUFBVyxHQUFYO0FBQWlCOzs7NkJBcENoQjtBQUNkLGFBQU8sSUFBSSxLQUFKLENBQVUsRUFBVixDQUFQO0FBQ0Q7Ozs7c0JBM0J1QixLOztBQWlFMUIsV0FBVztBQUVULElBRlMsY0FFTixJQUZNLEVBRUE7O0FBRVAsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLENBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLENBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsQ0FBWDs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXRCUTtBQXdCVCxPQXhCUyxpQkF3QkgsSUF4QkcsRUF3Qkc7QUFDVixRQUFJLGdCQUFnQixJQUFwQixFQUEwQjtBQUN4QixhQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxDQUFULEVBQWtCLEtBQUssQ0FBTCxDQUFsQixFQUEyQixLQUFLLENBQUwsQ0FBM0IsRUFBb0MsS0FBSyxFQUFMLENBQXBDLEVBQ1MsS0FBSyxDQUFMLENBRFQsRUFDa0IsS0FBSyxDQUFMLENBRGxCLEVBQzJCLEtBQUssQ0FBTCxDQUQzQixFQUNvQyxLQUFLLEVBQUwsQ0FEcEMsRUFFUyxLQUFLLENBQUwsQ0FGVCxFQUVrQixLQUFLLENBQUwsQ0FGbEIsRUFFMkIsS0FBSyxFQUFMLENBRjNCLEVBRXFDLEtBQUssRUFBTCxDQUZyQyxFQUdTLEtBQUssQ0FBTCxDQUhULEVBR2tCLEtBQUssQ0FBTCxDQUhsQixFQUcyQixLQUFLLEVBQUwsQ0FIM0IsRUFHcUMsS0FBSyxFQUFMLENBSHJDLENBQVA7QUFJRDtBQUNELFdBQU8sSUFBSSxVQUFKLENBQWUsSUFBZixDQUFQO0FBQ0QsR0FoQ1E7QUFrQ1QsS0FsQ1MsZUFrQ0wsSUFsQ0ssRUFrQ0MsR0FsQ0QsRUFrQ00sR0FsQ04sRUFrQ1csR0FsQ1gsRUFrQ2dCLEdBbENoQixFQW1DQyxHQW5DRCxFQW1DTSxHQW5DTixFQW1DVyxHQW5DWCxFQW1DZ0IsR0FuQ2hCLEVBb0NDLEdBcENELEVBb0NNLEdBcENOLEVBb0NXLEdBcENYLEVBb0NnQixHQXBDaEIsRUFxQ0MsR0FyQ0QsRUFxQ00sR0FyQ04sRUFxQ1csR0FyQ1gsRUFxQ2dCLEdBckNoQixFQXFDcUI7O0FBRTVCLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLEdBQVg7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0F6RFE7QUEyRFQsU0EzRFMsbUJBMkRELElBM0RDLEVBMkRLLEdBM0RMLEVBMkRVO0FBQ2pCLFFBQUksTUFBTSxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQVY7QUFDQSxXQUFPLEtBQUssUUFBTCxDQUFjLElBQWQsRUFBb0IsR0FBcEIsQ0FBUDtBQUNELEdBOURRO0FBZ0VULFVBaEVTLG9CQWdFQSxJQWhFQSxFQWdFTSxHQWhFTixFQWdFVztBQUNsQixRQUFJLEtBQUssSUFBSSxDQUFKLENBQVQ7QUFBQSxRQUNJLEtBQUssSUFBSSxDQUFKLENBRFQ7QUFBQSxRQUVJLEtBQUssSUFBSSxDQUFKLENBRlQ7QUFBQSxRQUdJLElBQUksS0FBSyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxFQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQW5ELENBSFI7O0FBS0EsUUFBSSxDQUFKLElBQVMsQ0FBQyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxDQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQS9DLElBQTJELENBQXBFO0FBQ0EsUUFBSSxDQUFKLElBQVMsQ0FBQyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxDQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQS9DLElBQTJELENBQXBFO0FBQ0EsUUFBSSxDQUFKLElBQVMsQ0FBQyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxFQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQS9DLElBQTJELENBQXBFOztBQUVBLFdBQU8sR0FBUDtBQUNELEdBM0VRO0FBNkVULFVBN0VTLG9CQTZFQSxJQTdFQSxFQTZFTSxDQTdFTixFQTZFUyxDQTdFVCxFQTZFWTtBQUNuQixRQUFJLE1BQU0sRUFBRSxDQUFGLENBQVY7QUFBQSxRQUFpQixNQUFNLEVBQUUsQ0FBRixDQUF2QjtBQUFBLFFBQThCLE1BQU0sRUFBRSxDQUFGLENBQXBDO0FBQUEsUUFBMkMsTUFBTSxFQUFFLENBQUYsQ0FBakQ7QUFBQSxRQUNJLE1BQU0sRUFBRSxDQUFGLENBRFY7QUFBQSxRQUNpQixNQUFNLEVBQUUsQ0FBRixDQUR2QjtBQUFBLFFBQzhCLE1BQU0sRUFBRSxDQUFGLENBRHBDO0FBQUEsUUFDMkMsTUFBTSxFQUFFLENBQUYsQ0FEakQ7QUFBQSxRQUVJLE1BQU0sRUFBRSxDQUFGLENBRlY7QUFBQSxRQUVpQixNQUFNLEVBQUUsQ0FBRixDQUZ2QjtBQUFBLFFBRThCLE1BQU0sRUFBRSxFQUFGLENBRnBDO0FBQUEsUUFFMkMsTUFBTSxFQUFFLEVBQUYsQ0FGakQ7QUFBQSxRQUdJLE1BQU0sRUFBRSxFQUFGLENBSFY7QUFBQSxRQUdpQixNQUFNLEVBQUUsRUFBRixDQUh2QjtBQUFBLFFBRzhCLE1BQU0sRUFBRSxFQUFGLENBSHBDO0FBQUEsUUFHMkMsTUFBTSxFQUFFLEVBQUYsQ0FIakQ7QUFBQSxRQUlJLE1BQU0sRUFBRSxDQUFGLENBSlY7QUFBQSxRQUlpQixNQUFNLEVBQUUsQ0FBRixDQUp2QjtBQUFBLFFBSThCLE1BQU0sRUFBRSxDQUFGLENBSnBDO0FBQUEsUUFJMkMsTUFBTSxFQUFFLENBQUYsQ0FKakQ7QUFBQSxRQUtJLE1BQU0sRUFBRSxDQUFGLENBTFY7QUFBQSxRQUtpQixNQUFNLEVBQUUsQ0FBRixDQUx2QjtBQUFBLFFBSzhCLE1BQU0sRUFBRSxDQUFGLENBTHBDO0FBQUEsUUFLMkMsTUFBTSxFQUFFLENBQUYsQ0FMakQ7QUFBQSxRQU1JLE1BQU0sRUFBRSxDQUFGLENBTlY7QUFBQSxRQU1pQixNQUFNLEVBQUUsQ0FBRixDQU52QjtBQUFBLFFBTThCLE1BQU0sRUFBRSxFQUFGLENBTnBDO0FBQUEsUUFNMkMsTUFBTSxFQUFFLEVBQUYsQ0FOakQ7QUFBQSxRQU9JLE1BQU0sRUFBRSxFQUFGLENBUFY7QUFBQSxRQU9pQixNQUFNLEVBQUUsRUFBRixDQVB2QjtBQUFBLFFBTzhCLE1BQU0sRUFBRSxFQUFGLENBUHBDO0FBQUEsUUFPMkMsTUFBTSxFQUFFLEVBQUYsQ0FQakQ7O0FBU0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7O0FBRUEsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLEVBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxXQUFPLElBQVA7QUFDRCxHQTNHUTtBQTZHVCxTQTdHUyxtQkE2R0QsQ0E3R0MsRUE2R0UsQ0E3R0YsRUE2R0s7QUFDWixRQUFJLElBQUksS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFSO0FBQ0EsV0FBTyxLQUFLLFFBQUwsQ0FBYyxDQUFkLEVBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQVA7QUFDRCxHQWhIUTtBQWtIVCxVQWxIUyxvQkFrSEEsQ0FsSEEsRUFrSEcsQ0FsSEgsRUFrSE07QUFDYixXQUFPLEtBQUssUUFBTCxDQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBUDtBQUNELEdBcEhRO0FBc0hULEtBdEhTLGVBc0hMLElBdEhLLEVBc0hDLENBdEhELEVBc0hJO0FBQ1gsUUFBSSxPQUFPLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBWDtBQUNBLFdBQU8sS0FBSyxJQUFMLENBQVUsSUFBVixFQUFnQixDQUFoQixDQUFQO0FBQ0QsR0F6SFE7QUEySFQsTUEzSFMsZ0JBMkhKLElBM0hJLEVBMkhFLENBM0hGLEVBMkhLO0FBQ1osU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxFQUFFLENBQUYsQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLEVBQUUsQ0FBRixDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxFQUFFLENBQUYsQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLEVBQUUsQ0FBRixDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxFQUFFLENBQUYsQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLEVBQUUsQ0FBRixDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLEVBQUwsS0FBWSxFQUFFLEVBQUYsQ0FBWjtBQUNBLFNBQUssRUFBTCxLQUFZLEVBQUUsRUFBRixDQUFaO0FBQ0EsU0FBSyxFQUFMLEtBQVksRUFBRSxFQUFGLENBQVo7QUFDQSxTQUFLLEVBQUwsS0FBWSxFQUFFLEVBQUYsQ0FBWjtBQUNBLFNBQUssRUFBTCxLQUFZLEVBQUUsRUFBRixDQUFaO0FBQ0EsU0FBSyxFQUFMLEtBQVksRUFBRSxFQUFGLENBQVo7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0E5SVE7QUFnSlQsV0FoSlMscUJBZ0pDLElBaEpELEVBZ0pPO0FBQ2QsUUFBSSxJQUFJLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBUjtBQUNBLFdBQU8sS0FBSyxVQUFMLENBQWdCLENBQWhCLENBQVA7QUFDRCxHQW5KUTtBQXFKVCxZQXJKUyxzQkFxSkUsSUFySkYsRUFxSlE7QUFDZixRQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7QUFBQSxRQUFrQixLQUFLLEtBQUssQ0FBTCxDQUF2QjtBQUFBLFFBQWdDLE1BQU0sS0FBSyxFQUFMLENBQXRDO0FBQUEsUUFDSSxLQUFLLEtBQUssQ0FBTCxDQURUO0FBQUEsUUFDa0IsS0FBSyxLQUFLLENBQUwsQ0FEdkI7QUFBQSxRQUNnQyxNQUFNLEtBQUssRUFBTCxDQUR0QztBQUFBLFFBRUksS0FBSyxLQUFLLENBQUwsQ0FGVDtBQUFBLFFBRWtCLEtBQUssS0FBSyxDQUFMLENBRnZCO0FBQUEsUUFFZ0MsTUFBTSxLQUFLLEVBQUwsQ0FGdEM7QUFBQSxRQUdJLEtBQUssS0FBSyxDQUFMLENBSFQ7QUFBQSxRQUdrQixLQUFLLEtBQUssQ0FBTCxDQUh2QjtBQUFBLFFBR2dDLE1BQU0sS0FBSyxFQUFMLENBSHRDOztBQUtBLFNBQUssQ0FBTCxJQUFVLEVBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsR0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLEVBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsR0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLEVBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFWO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLEVBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxFQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXpLUTtBQTJLVCxZQTNLUyxzQkEyS0UsSUEzS0YsRUEyS1EsS0EzS1IsRUEyS2UsR0EzS2YsRUEyS29CO0FBQzNCLFFBQUksSUFBSSxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQVI7QUFDQSxXQUFPLEtBQUssV0FBTCxDQUFpQixDQUFqQixFQUFvQixLQUFwQixFQUEyQixHQUEzQixDQUFQO0FBQ0QsR0E5S1E7QUFnTFQsYUFoTFMsdUJBZ0xHLElBaExILEVBZ0xTLEtBaExULEVBZ0xnQixHQWhMaEIsRUFnTHFCO0FBQzVCLFFBQUksSUFBSSxJQUFJLEtBQUosQ0FBUjtBQUFBLFFBQ0ksSUFBSSxJQUFJLEtBQUosQ0FEUjtBQUFBLFFBRUksS0FBSyxJQUFJLENBRmI7QUFBQSxRQUdJLEtBQUssSUFBSSxDQUFKLENBSFQ7QUFBQSxRQUlJLEtBQUssSUFBSSxDQUFKLENBSlQ7QUFBQSxRQUtJLEtBQUssSUFBSSxDQUFKLENBTFQ7QUFBQSxRQU1JLE1BQU0sS0FBSyxFQUFMLEdBQVUsRUFBVixHQUFlLENBTnpCO0FBQUEsUUFPSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxLQUFLLENBUDlCO0FBQUEsUUFRSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxLQUFLLENBUjlCO0FBQUEsUUFTSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxLQUFLLENBVDlCO0FBQUEsUUFVSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxDQVZ6QjtBQUFBLFFBV0ksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsS0FBSyxDQVg5QjtBQUFBLFFBWUksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsS0FBSyxDQVo5QjtBQUFBLFFBYUksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsS0FBSyxDQWI5QjtBQUFBLFFBY0ksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsQ0FkekI7QUFBQSxRQWVJLE1BQU0sS0FBSyxDQUFMLENBZlY7QUFBQSxRQWdCSSxNQUFNLEtBQUssQ0FBTCxDQWhCVjtBQUFBLFFBaUJJLE1BQU0sS0FBSyxDQUFMLENBakJWO0FBQUEsUUFrQkksTUFBTSxLQUFLLENBQUwsQ0FsQlY7QUFBQSxRQW1CSSxNQUFNLEtBQUssQ0FBTCxDQW5CVjtBQUFBLFFBb0JJLE1BQU0sS0FBSyxDQUFMLENBcEJWO0FBQUEsUUFxQkksTUFBTSxLQUFLLENBQUwsQ0FyQlY7QUFBQSxRQXNCSSxNQUFNLEtBQUssQ0FBTCxDQXRCVjtBQUFBLFFBdUJJLE1BQU0sS0FBSyxDQUFMLENBdkJWO0FBQUEsUUF3QkksTUFBTSxLQUFLLENBQUwsQ0F4QlY7QUFBQSxRQXlCSSxNQUFNLEtBQUssRUFBTCxDQXpCVjtBQUFBLFFBMEJJLE1BQU0sS0FBSyxFQUFMLENBMUJWO0FBQUEsUUEyQkksTUFBTSxLQUFLLEVBQUwsQ0EzQlY7QUFBQSxRQTRCSSxNQUFNLEtBQUssRUFBTCxDQTVCVjtBQUFBLFFBNkJJLE1BQU0sS0FBSyxFQUFMLENBN0JWO0FBQUEsUUE4QkksTUFBTSxLQUFLLEVBQUwsQ0E5QlY7O0FBZ0NBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6Qzs7QUFFQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDOztBQUVBLFdBQU8sSUFBUDtBQUNELEdBak9RO0FBbU9ULFdBbk9TLHFCQW1PQyxJQW5PRCxFQW1PTyxFQW5PUCxFQW1PVyxFQW5PWCxFQW1PZSxFQW5PZixFQW1PbUI7QUFDMUIsUUFBSSxNQUFNLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBVjtBQUNBLFdBQU8sS0FBSyxVQUFMLENBQWdCLEdBQWhCLEVBQXFCLEVBQXJCLEVBQXlCLEVBQXpCLEVBQTZCLEVBQTdCLENBQVA7QUFDRCxHQXRPUTtBQXdPVCxZQXhPUyxzQkF3T0UsSUF4T0YsRUF3T1EsRUF4T1IsRUF3T1ksRUF4T1osRUF3T2dCLEVBeE9oQixFQXdPb0I7QUFDM0IsUUFBSSxNQUFNLEtBQUssQ0FBTCxDQUFWO0FBQUEsUUFDSSxNQUFNLEtBQUssQ0FBTCxDQURWO0FBQUEsUUFFSSxNQUFNLEtBQUssQ0FBTCxDQUZWO0FBQUEsUUFHSSxNQUFNLEtBQUssQ0FBTCxDQUhWO0FBQUEsUUFJSSxNQUFNLEtBQUssQ0FBTCxDQUpWO0FBQUEsUUFLSSxNQUFNLEtBQUssQ0FBTCxDQUxWO0FBQUEsUUFNSSxNQUFNLEtBQUssQ0FBTCxDQU5WO0FBQUEsUUFPSSxNQUFNLEtBQUssQ0FBTCxDQVBWO0FBQUEsUUFRSSxNQUFNLEtBQUssQ0FBTCxDQVJWO0FBQUEsUUFTSSxNQUFNLEtBQUssQ0FBTCxDQVRWO0FBQUEsUUFVSSxNQUFNLEtBQUssRUFBTCxDQVZWO0FBQUEsUUFXSSxNQUFNLEtBQUssRUFBTCxDQVhWO0FBQUEsUUFZSSxNQUFNLElBQUksRUFBSixDQVpWO0FBQUEsUUFhSSxNQUFNLElBQUksRUFBSixDQWJWO0FBQUEsUUFjSSxNQUFNLElBQUksRUFBSixDQWRWO0FBQUEsUUFlSSxNQUFNLElBQUksRUFBSixDQWZWO0FBQUEsUUFnQkksTUFBTSxJQUFJLEVBQUosQ0FoQlY7QUFBQSxRQWlCSSxNQUFNLElBQUksRUFBSixDQWpCVjtBQUFBLFFBa0JJLE1BQU8sTUFBTSxHQWxCakI7QUFBQSxRQW1CSSxNQUFNLENBQUMsR0FBRCxHQUFPLEdBQVAsR0FBYSxNQUFNLEdBQU4sR0FBWSxHQW5CbkM7QUFBQSxRQW9CSSxNQUFPLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBTixHQUFZLEdBcEJuQztBQUFBLFFBcUJJLE1BQU8sTUFBTSxHQXJCakI7QUFBQSxRQXNCSSxNQUFPLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBTixHQUFZLEdBdEJuQztBQUFBLFFBdUJJLE1BQU0sQ0FBQyxHQUFELEdBQU8sR0FBUCxHQUFhLE1BQU0sR0FBTixHQUFZLEdBdkJuQztBQUFBLFFBd0JJLE1BQU0sQ0FBQyxHQXhCWDtBQUFBLFFBeUJJLE1BQU8sTUFBTSxHQXpCakI7QUFBQSxRQTBCSSxNQUFPLE1BQU0sR0ExQmpCOztBQTRCQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDOztBQUVBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6Qzs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXJSUTtBQXVSVCxXQXZSUyxxQkF1UkMsSUF2UkQsRUF1Uk8sQ0F2UlAsRUF1UlUsQ0F2UlYsRUF1UmEsQ0F2UmIsRUF1UmdCO0FBQ3ZCLFFBQUksSUFBSSxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQVI7QUFDQSxXQUFPLEtBQUssVUFBTCxDQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixDQUFQO0FBQ0QsR0ExUlE7QUE0UlQsWUE1UlMsc0JBNFJFLElBNVJGLEVBNFJRLENBNVJSLEVBNFJXLENBNVJYLEVBNFJjLENBNVJkLEVBNFJpQjtBQUN4QixTQUFLLEVBQUwsSUFBVyxLQUFLLENBQUwsSUFBVyxDQUFYLEdBQWUsS0FBSyxDQUFMLElBQVcsQ0FBMUIsR0FBOEIsS0FBSyxDQUFMLElBQVcsQ0FBekMsR0FBNkMsS0FBSyxFQUFMLENBQXhEO0FBQ0EsU0FBSyxFQUFMLElBQVcsS0FBSyxDQUFMLElBQVcsQ0FBWCxHQUFlLEtBQUssQ0FBTCxJQUFXLENBQTFCLEdBQThCLEtBQUssQ0FBTCxJQUFXLENBQXpDLEdBQTZDLEtBQUssRUFBTCxDQUF4RDtBQUNBLFNBQUssRUFBTCxJQUFXLEtBQUssQ0FBTCxJQUFXLENBQVgsR0FBZSxLQUFLLENBQUwsSUFBVyxDQUExQixHQUE4QixLQUFLLEVBQUwsSUFBVyxDQUF6QyxHQUE2QyxLQUFLLEVBQUwsQ0FBeEQ7QUFDQSxTQUFLLEVBQUwsSUFBVyxLQUFLLENBQUwsSUFBVyxDQUFYLEdBQWUsS0FBSyxDQUFMLElBQVcsQ0FBMUIsR0FBOEIsS0FBSyxFQUFMLElBQVcsQ0FBekMsR0FBNkMsS0FBSyxFQUFMLENBQXhEOztBQUVBLFdBQU8sSUFBUDtBQUNELEdBblNRO0FBcVNULE9BclNTLGlCQXFTSCxJQXJTRyxFQXFTRyxDQXJTSCxFQXFTTSxDQXJTTixFQXFTUyxDQXJTVCxFQXFTWTtBQUNuQixRQUFJLElBQUksS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFSO0FBQ0EsV0FBTyxLQUFLLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixDQUFsQixFQUFxQixDQUFyQixDQUFQO0FBQ0QsR0F4U1E7QUEwU1QsUUExU1Msa0JBMFNGLElBMVNFLEVBMFNJLENBMVNKLEVBMFNPLENBMVNQLEVBMFNVLENBMVNWLEVBMFNhO0FBQ3BCLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLEVBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxFQUFMLEtBQVksQ0FBWjs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXpUUTs7O0FBMlRUO0FBQ0EsUUE1VFMsa0JBNFRGLElBNVRFLEVBNFRJO0FBQ1gsUUFBSSxJQUFJLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBUjtBQUNBLFdBQVEsS0FBSyxPQUFMLENBQWEsQ0FBYixDQUFSO0FBQ0QsR0EvVFE7QUFpVVQsU0FqVVMsbUJBaVVELElBalVDLEVBaVVLO0FBQ1osUUFBSSxLQUFLLEtBQUssQ0FBTCxDQUFUO0FBQUEsUUFBbUIsS0FBSyxLQUFLLENBQUwsQ0FBeEI7QUFBQSxRQUFrQyxLQUFLLEtBQUssQ0FBTCxDQUF2QztBQUFBLFFBQWlELEtBQUssS0FBSyxDQUFMLENBQXREO0FBQUEsUUFDSSxLQUFLLEtBQUssQ0FBTCxDQURUO0FBQUEsUUFDbUIsS0FBSyxLQUFLLENBQUwsQ0FEeEI7QUFBQSxRQUNrQyxLQUFLLEtBQUssQ0FBTCxDQUR2QztBQUFBLFFBQ2lELEtBQUssS0FBSyxDQUFMLENBRHREO0FBQUEsUUFFSSxLQUFLLEtBQUssQ0FBTCxDQUZUO0FBQUEsUUFFbUIsS0FBSyxLQUFLLENBQUwsQ0FGeEI7QUFBQSxRQUVpQyxNQUFNLEtBQUssRUFBTCxDQUZ2QztBQUFBLFFBRWlELE1BQU0sS0FBSyxFQUFMLENBRnZEO0FBQUEsUUFHSSxNQUFNLEtBQUssRUFBTCxDQUhWO0FBQUEsUUFHb0IsTUFBTSxLQUFLLEVBQUwsQ0FIMUI7QUFBQSxRQUdvQyxNQUFNLEtBQUssRUFBTCxDQUgxQztBQUFBLFFBR29ELE1BQU0sS0FBSyxFQUFMLENBSDFEOztBQUtBLFFBQUksS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQXhCO0FBQUEsUUFDSSxLQUFLLEtBQUssRUFBTCxHQUFVLEtBQUssRUFEeEI7QUFBQSxRQUVJLEtBQUssS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUZ4QjtBQUFBLFFBR0ksS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBSHhCO0FBQUEsUUFJSSxLQUFLLEtBQUssRUFBTCxHQUFVLEtBQUssRUFKeEI7QUFBQSxRQUtJLEtBQUssS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUx4QjtBQUFBLFFBTUksS0FBSyxLQUFLLEdBQUwsR0FBVyxLQUFLLEdBTnpCO0FBQUEsUUFPSSxLQUFLLEtBQUssR0FBTCxHQUFXLE1BQU0sR0FQMUI7QUFBQSxRQVFJLEtBQUssS0FBSyxHQUFMLEdBQVcsTUFBTSxHQVIxQjtBQUFBLFFBU0ksS0FBSyxLQUFLLEdBQUwsR0FBVyxNQUFNLEdBVDFCO0FBQUEsUUFVSSxLQUFLLEtBQUssR0FBTCxHQUFXLE1BQU0sR0FWMUI7QUFBQSxRQVdJLEtBQUssTUFBTSxHQUFOLEdBQVksTUFBTSxHQVgzQjs7QUFhQSxRQUFJLFNBQVMsS0FDVixLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQW5DLEdBQXdDLEtBQUssRUFBN0MsR0FBa0QsS0FBSyxFQUQ3QyxDQUFiOztBQUdBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxHQUFGLEdBQVEsRUFBUixHQUFhLE1BQU0sRUFBbkIsR0FBd0IsTUFBTSxFQUEvQixJQUFxQyxNQUFoRDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLE1BQU0sRUFBbEIsR0FBdUIsTUFBTSxFQUE5QixJQUFvQyxNQUEvQztBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxHQUFGLEdBQVEsRUFBUixHQUFhLE1BQU0sRUFBbkIsR0FBd0IsTUFBTSxFQUEvQixJQUFxQyxNQUFoRDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLE1BQU0sRUFBbEIsR0FBdUIsTUFBTSxFQUE5QixJQUFvQyxNQUEvQztBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssQ0FBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssRUFBTCxJQUFXLENBQUMsQ0FBRSxHQUFGLEdBQVEsRUFBUixHQUFhLE1BQU0sRUFBbkIsR0FBd0IsTUFBTSxFQUEvQixJQUFxQyxNQUFoRDtBQUNBLFNBQUssRUFBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsTUFBTSxFQUE3QixJQUFtQyxNQUE5QztBQUNBLFNBQUssRUFBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssRUFBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsS0FBSyxFQUE1QixJQUFrQyxNQUE3QztBQUNBLFNBQUssRUFBTCxJQUFXLENBQUMsQ0FBRSxHQUFGLEdBQVEsRUFBUixHQUFhLE1BQU0sRUFBbkIsR0FBd0IsTUFBTSxFQUEvQixJQUFxQyxNQUFoRDtBQUNBLFNBQUssRUFBTCxJQUFXLENBQUMsQ0FBRSxFQUFGLEdBQU8sRUFBUCxHQUFZLEtBQUssRUFBakIsR0FBc0IsTUFBTSxFQUE3QixJQUFtQyxNQUE5Qzs7QUFFQSxXQUFPLElBQVA7QUFFRCxHQTFXUTs7QUEyV1Q7QUFDQTtBQUNBO0FBQ0EsUUE5V1Msa0JBOFdGLElBOVdFLEVBOFdJLEdBOVdKLEVBOFdTLE1BOVdULEVBOFdpQixFQTlXakIsRUE4V3FCO0FBQzVCLFFBQUksSUFBSSxLQUFLLEdBQUwsQ0FBUyxHQUFULEVBQWMsTUFBZCxDQUFSO0FBQ0EsTUFBRSxLQUFGO0FBQ0EsUUFBSSxJQUFJLEtBQUssS0FBTCxDQUFXLEVBQVgsRUFBZSxDQUFmLENBQVI7QUFDQSxNQUFFLEtBQUY7QUFDQSxRQUFJLElBQUksS0FBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLENBQWQsQ0FBUjtBQUNBLE1BQUUsS0FBRjtBQUNBLFdBQU8sS0FBSyxHQUFMLENBQVMsSUFBVCxFQUFlLEVBQUUsQ0FBRixDQUFmLEVBQXFCLEVBQUUsQ0FBRixDQUFyQixFQUEyQixFQUFFLENBQUYsQ0FBM0IsRUFBaUMsQ0FBQyxFQUFFLEdBQUYsQ0FBTSxHQUFOLENBQWxDLEVBQ2UsRUFBRSxDQUFGLENBRGYsRUFDcUIsRUFBRSxDQUFGLENBRHJCLEVBQzJCLEVBQUUsQ0FBRixDQUQzQixFQUNpQyxDQUFDLEVBQUUsR0FBRixDQUFNLEdBQU4sQ0FEbEMsRUFFZSxFQUFFLENBQUYsQ0FGZixFQUVxQixFQUFFLENBQUYsQ0FGckIsRUFFMkIsRUFBRSxDQUFGLENBRjNCLEVBRWlDLENBQUMsRUFBRSxHQUFGLENBQU0sR0FBTixDQUZsQyxFQUdlLENBSGYsRUFHa0IsQ0FIbEIsRUFHcUIsQ0FIckIsRUFHd0IsQ0FIeEIsQ0FBUDtBQUlELEdBelhRO0FBMlhULFNBM1hTLG1CQTJYRCxJQTNYQyxFQTJYSyxJQTNYTCxFQTJYVyxLQTNYWCxFQTJYa0IsTUEzWGxCLEVBMlgwQixHQTNYMUIsRUEyWCtCLElBM1gvQixFQTJYcUMsR0EzWHJDLEVBMlgwQztBQUNqRCxRQUFJLEtBQUssUUFBUSxJQUFqQjtBQUFBLFFBQ0ksS0FBSyxNQUFNLE1BRGY7QUFBQSxRQUVJLEtBQUssTUFBTSxJQUZmOztBQUlBLFNBQUssQ0FBTCxJQUFXLE9BQU8sQ0FBUixHQUFhLEVBQXZCO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLENBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFXLE9BQU8sQ0FBUixHQUFhLEVBQXZCO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLENBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFDLFFBQVEsSUFBVCxJQUFpQixFQUEzQjtBQUNBLFNBQUssQ0FBTCxJQUFVLENBQUMsTUFBTSxNQUFQLElBQWlCLEVBQTNCO0FBQ0EsU0FBSyxFQUFMLElBQVcsRUFBRSxNQUFNLElBQVIsSUFBZ0IsRUFBM0I7QUFDQSxTQUFLLEVBQUwsSUFBVyxDQUFDLENBQVo7QUFDQSxTQUFLLEVBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLEVBQUUsTUFBTSxJQUFOLEdBQWEsQ0FBZixJQUFvQixFQUEvQjtBQUNBLFNBQUssRUFBTCxJQUFXLENBQVg7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0FsWlE7QUFvWlQsYUFwWlMsdUJBb1pHLElBcFpILEVBb1pTLEdBcFpULEVBb1pjLE1BcFpkLEVBb1pzQixJQXBadEIsRUFvWjRCLEdBcFo1QixFQW9aaUM7QUFDeEMsUUFBSSxPQUFPLE9BQU8sSUFBSSxNQUFNLEVBQU4sR0FBVyxHQUFmLENBQWxCO0FBQUEsUUFDSSxPQUFPLENBQUMsSUFEWjtBQUFBLFFBRUksT0FBTyxPQUFPLE1BRmxCO0FBQUEsUUFHSSxPQUFPLE9BQU8sTUFIbEI7O0FBS0EsV0FBTyxLQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDLElBQXJDLEVBQTJDLElBQTNDLEVBQWlELEdBQWpELENBQVA7QUFDRCxHQTNaUTtBQTZaVCxPQTdaUyxpQkE2WkgsSUE3WkcsRUE2WkcsSUE3WkgsRUE2WlMsS0E3WlQsRUE2WmdCLEdBN1poQixFQTZacUIsTUE3WnJCLEVBNlo2QixJQTdaN0IsRUE2Wm1DLEdBN1puQyxFQTZad0M7QUFDL0MsUUFBSSxLQUFLLEtBQUssUUFBZDtBQUFBLFFBQ0ksSUFBSSxRQUFRLElBRGhCO0FBQUEsUUFFSSxJQUFJLE1BQU0sTUFGZDtBQUFBLFFBR0ksSUFBSSxNQUFNLElBSGQ7QUFBQSxRQUlJLElBQUksQ0FBQyxRQUFRLElBQVQsSUFBaUIsQ0FKekI7QUFBQSxRQUtJLElBQUksQ0FBQyxNQUFNLE1BQVAsSUFBaUIsQ0FMekI7QUFBQSxRQU1JLElBQUksQ0FBQyxNQUFNLElBQVAsSUFBZSxDQU52Qjs7QUFRQSxTQUFLLENBQUwsSUFBVSxJQUFJLENBQWQsQ0FBaUIsS0FBSyxDQUFMLElBQVUsQ0FBVixDQUFhLEtBQUssQ0FBTCxJQUFVLENBQVYsQ0FBYSxLQUFLLEVBQUwsSUFBVyxDQUFDLENBQVo7QUFDM0MsU0FBSyxDQUFMLElBQVUsQ0FBVixDQUFhLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBZCxDQUFpQixLQUFLLENBQUwsSUFBVSxDQUFWLENBQWEsS0FBSyxFQUFMLElBQVcsQ0FBQyxDQUFaO0FBQzNDLFNBQUssQ0FBTCxJQUFVLENBQVYsQ0FBYSxLQUFLLENBQUwsSUFBVSxDQUFWLENBQWEsS0FBSyxFQUFMLElBQVcsQ0FBQyxDQUFELEdBQUssQ0FBaEIsQ0FBbUIsS0FBSyxFQUFMLElBQVcsQ0FBQyxDQUFaO0FBQzdDLFNBQUssQ0FBTCxJQUFVLENBQVYsQ0FBYSxLQUFLLENBQUwsSUFBVSxDQUFWLENBQWEsS0FBSyxFQUFMLElBQVcsQ0FBWCxDQUFjLEtBQUssRUFBTCxJQUFXLENBQVg7O0FBRXhDLFdBQU8sSUFBUDtBQUNGLEdBNWFTO0FBOGFULGdCQTlhUywwQkE4YU0sSUE5YU4sRUE4YVk7QUFDbkIsUUFBSSxNQUFNLEtBQUssY0FBZjs7QUFFQSxRQUFJLENBQUMsR0FBTCxFQUFVO0FBQ1IsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQsUUFBSSxDQUFKLElBQVMsS0FBSyxDQUFMLENBQVQ7QUFDQSxRQUFJLENBQUosSUFBUyxLQUFLLENBQUwsQ0FBVDtBQUNBLFFBQUksQ0FBSixJQUFTLEtBQUssQ0FBTCxDQUFUO0FBQ0EsUUFBSSxDQUFKLElBQVMsS0FBSyxDQUFMLENBQVQ7QUFDQSxRQUFJLENBQUosSUFBUyxLQUFLLENBQUwsQ0FBVDtBQUNBLFFBQUksQ0FBSixJQUFTLEtBQUssQ0FBTCxDQUFUO0FBQ0EsUUFBSSxDQUFKLElBQVMsS0FBSyxDQUFMLENBQVQ7QUFDQSxRQUFJLENBQUosSUFBUyxLQUFLLENBQUwsQ0FBVDtBQUNBLFFBQUksQ0FBSixJQUFTLEtBQUssQ0FBTCxDQUFUO0FBQ0EsUUFBSSxDQUFKLElBQVMsS0FBSyxDQUFMLENBQVQ7QUFDQSxRQUFJLEVBQUosSUFBVSxLQUFLLEVBQUwsQ0FBVjtBQUNBLFFBQUksRUFBSixJQUFVLEtBQUssRUFBTCxDQUFWO0FBQ0EsUUFBSSxFQUFKLElBQVUsS0FBSyxFQUFMLENBQVY7QUFDQSxRQUFJLEVBQUosSUFBVSxLQUFLLEVBQUwsQ0FBVjtBQUNBLFFBQUksRUFBSixJQUFVLEtBQUssRUFBTCxDQUFWO0FBQ0EsUUFBSSxFQUFKLElBQVUsS0FBSyxFQUFMLENBQVY7O0FBRUEsV0FBTyxHQUFQO0FBQ0Q7QUF2Y1EsQ0FBWDs7QUEyY0E7QUFDQSxRQUFRLEtBQUssU0FBYjtBQUNBLEtBQUssTUFBTCxJQUFlLFFBQWYsRUFBeUI7QUFDdkIsT0FBSyxNQUFMLElBQWUsU0FBUyxNQUFULENBQWY7QUFDQSxRQUFNLE1BQU4sSUFBaUIsVUFBVSxDQUFWLEVBQWE7QUFDNUIsV0FBTyxZQUFXO0FBQ2hCLFVBQUksT0FBTyxNQUFNLElBQU4sQ0FBVyxTQUFYLENBQVg7O0FBRUEsV0FBSyxPQUFMLENBQWEsSUFBYjtBQUNBLGFBQU8sS0FBSyxDQUFMLEVBQVEsS0FBUixDQUFjLElBQWQsRUFBb0IsSUFBcEIsQ0FBUDtBQUNELEtBTEQ7QUFNRixHQVBnQixDQU9kLE1BUGMsQ0FBaEI7QUFRRDs7QUFFRDs7SUFDYSxJLFdBQUEsSTs7O0FBQ1gsZ0JBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0I7QUFBQTs7QUFBQSx5RkFDaEIsQ0FEZ0I7O0FBRXRCLFdBQUssQ0FBTCxJQUFVLEtBQUssQ0FBZjtBQUNBLFdBQUssQ0FBTCxJQUFVLEtBQUssQ0FBZjtBQUNBLFdBQUssQ0FBTCxJQUFVLEtBQUssQ0FBZjtBQUNBLFdBQUssQ0FBTCxJQUFVLEtBQUssQ0FBZjs7QUFFQSxXQUFLLGNBQUwsR0FBc0IsSUFBSSxZQUFKLENBQWlCLENBQWpCLENBQXRCO0FBUHNCO0FBUXZCOzs7OzZCQUVlO0FBQ2QsYUFBTyxJQUFJLEtBQUosQ0FBVSxDQUFWLENBQVA7QUFDRDs7OzZCQUVlLEMsRUFBRyxDLEVBQUc7QUFDcEIsYUFBTyxJQUFJLElBQUosQ0FBUyxFQUFFLENBQUYsQ0FBVCxFQUFlLEVBQUUsQ0FBRixDQUFmLEVBQXFCLEVBQUUsQ0FBRixDQUFyQixFQUEyQixLQUFLLENBQWhDLENBQVA7QUFDRDs7OzZCQUVlLEMsRUFBRztBQUNqQixVQUFJLENBQUo7QUFDQSxVQUFJLENBQUo7QUFDQSxVQUFJLENBQUo7O0FBRUE7QUFDQTtBQUNBLFVBQUksRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQVAsSUFBZSxFQUFFLENBQUYsSUFBTyxFQUFFLEVBQUYsQ0FBMUIsRUFBaUM7QUFDL0IsWUFBSSxDQUFKO0FBQ0EsWUFBSSxDQUFKO0FBQ0EsWUFBSSxDQUFKO0FBQ0QsT0FKRCxNQUlPLElBQUksRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQVAsSUFBZSxFQUFFLENBQUYsSUFBTyxFQUFFLEVBQUYsQ0FBMUIsRUFBaUM7QUFDdEMsWUFBSSxDQUFKO0FBQ0EsWUFBSSxDQUFKO0FBQ0EsWUFBSSxDQUFKO0FBQ0QsT0FKTSxNQUlBO0FBQ0wsWUFBSSxDQUFKO0FBQ0EsWUFBSSxDQUFKO0FBQ0EsWUFBSSxDQUFKO0FBQ0Q7O0FBRUQsVUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLElBQUksQ0FBTixDQUFKLEdBQWUsRUFBRSxJQUFJLENBQU4sQ0FBZixHQUEwQixFQUFFLElBQUksQ0FBTixDQUEvQixDQUFSO0FBQ0EsVUFBSSxJQUFJLElBQUksSUFBSixFQUFSOztBQUVBLFFBQUUsQ0FBRixJQUFPLE1BQU0sQ0FBYjtBQUNBLFFBQUUsQ0FBRixJQUFPLE9BQU8sRUFBRSxNQUFNLENBQU4sR0FBVSxFQUFWLEdBQWUsQ0FBakIsSUFBc0IsRUFBRSxNQUFNLENBQU4sR0FBVSxFQUFWLEdBQWUsQ0FBakIsQ0FBN0IsSUFBb0QsQ0FBM0Q7QUFDQSxRQUFFLENBQUYsSUFBTyxPQUFPLEVBQUUsTUFBTSxDQUFOLEdBQVUsRUFBVixHQUFlLENBQWpCLElBQXNCLEVBQUUsTUFBTSxDQUFOLEdBQVUsRUFBVixHQUFlLENBQWpCLENBQTdCLElBQW9ELENBQTNEO0FBQ0EsUUFBRSxDQUFGLElBQU8sT0FBTyxFQUFFLE1BQU0sQ0FBTixHQUFVLEVBQVYsR0FBZSxDQUFqQixJQUFzQixFQUFFLE1BQU0sQ0FBTixHQUFVLEVBQVYsR0FBZSxDQUFqQixDQUE3QixJQUFvRCxDQUEzRDs7QUFFQSxhQUFPLENBQVA7QUFDRDs7O2tDQUVvQixLLEVBQU87QUFDMUIsYUFBTyxJQUFJLElBQUosQ0FBUyxJQUFJLFFBQVEsQ0FBWixDQUFULEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLEVBQStCLElBQUksUUFBUSxDQUFaLENBQS9CLENBQVA7QUFDRDs7O2tDQUVvQixLLEVBQU87QUFDMUIsYUFBTyxJQUFJLElBQUosQ0FBUyxDQUFULEVBQVksSUFBSSxRQUFRLENBQVosQ0FBWixFQUE0QixDQUE1QixFQUErQixJQUFJLFFBQVEsQ0FBWixDQUEvQixDQUFQO0FBQ0Q7OztrQ0FFb0IsSyxFQUFPO0FBQzFCLGFBQU8sSUFBSSxJQUFKLENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxJQUFJLFFBQVEsQ0FBWixDQUFmLEVBQStCLElBQUksUUFBUSxDQUFaLENBQS9CLENBQVA7QUFDRDs7O3FDQUV1QixHLEVBQUssSyxFQUFPO0FBQ2xDLFVBQUksSUFBSSxJQUFJLENBQUosQ0FBUjtBQUFBLFVBQ0ksSUFBSSxJQUFJLENBQUosQ0FEUjtBQUFBLFVBRUksSUFBSSxJQUFJLENBQUosQ0FGUjtBQUFBLFVBR0ksSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFaLEdBQWdCLElBQUksQ0FBekIsQ0FIWjtBQUFBLFVBSUksSUFBSSxJQUFJLFFBQVEsQ0FBWixDQUpSO0FBQUEsVUFLSSxJQUFJLElBQUksUUFBUSxDQUFaLENBTFI7O0FBT0EsYUFBTyxJQUFJLElBQUosQ0FBUyxJQUFJLENBQUosR0FBUSxDQUFqQixFQUFvQixJQUFJLENBQUosR0FBUSxDQUE1QixFQUErQixJQUFJLENBQUosR0FBUSxDQUF2QyxFQUEwQyxDQUExQyxDQUFQO0FBQ0Q7Ozs7c0JBeEV1QixLOztBQTRFMUIsV0FBVztBQUVULFNBRlMsbUJBRUQsSUFGQyxFQUVLLENBRkwsRUFFUTtBQUNmLFNBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsRUFBRSxDQUFGLENBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFFLENBQUYsQ0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUFWOztBQUVBLFdBQU8sSUFBUDtBQUNELEdBVFE7QUFXVCxLQVhTLGVBV0wsSUFYSyxFQVdDLENBWEQsRUFXSSxDQVhKLEVBV08sQ0FYUCxFQVdVLENBWFYsRUFXYTtBQUNwQixTQUFLLENBQUwsSUFBVSxLQUFLLENBQWY7QUFDQSxTQUFLLENBQUwsSUFBVSxLQUFLLENBQWY7QUFDQSxTQUFLLENBQUwsSUFBVSxLQUFLLENBQWY7QUFDQSxTQUFLLENBQUwsSUFBVSxLQUFLLENBQWY7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0FsQlE7QUFvQlQsT0FwQlMsaUJBb0JILElBcEJHLEVBb0JHO0FBQ1YsUUFBSSxnQkFBZ0IsSUFBcEIsRUFBMEI7QUFDeEIsYUFBTyxJQUFJLElBQUosQ0FBUyxLQUFLLENBQUwsQ0FBVCxFQUFrQixLQUFLLENBQUwsQ0FBbEIsRUFBMkIsS0FBSyxDQUFMLENBQTNCLEVBQW9DLEtBQUssQ0FBTCxDQUFwQyxDQUFQO0FBQ0Q7QUFDRCxXQUFPLEtBQUssT0FBTCxDQUFhLElBQUksVUFBSixDQUFlLENBQWYsQ0FBYixFQUFnQyxJQUFoQyxDQUFQO0FBQ0QsR0F6QlE7QUEyQlQsS0EzQlMsZUEyQkwsSUEzQkssRUEyQkM7QUFDUixXQUFPLElBQUksSUFBSixDQUFTLENBQUMsS0FBSyxDQUFMLENBQVYsRUFBbUIsQ0FBQyxLQUFLLENBQUwsQ0FBcEIsRUFBNkIsQ0FBQyxLQUFLLENBQUwsQ0FBOUIsRUFBdUMsQ0FBQyxLQUFLLENBQUwsQ0FBeEMsQ0FBUDtBQUNELEdBN0JRO0FBK0JULE1BL0JTLGdCQStCSixJQS9CSSxFQStCRTtBQUNULFNBQUssQ0FBTCxJQUFVLENBQUMsS0FBSyxDQUFMLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFDLEtBQUssQ0FBTCxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLENBQUwsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFVLENBQUMsS0FBSyxDQUFMLENBQVg7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0F0Q1E7QUF3Q1QsS0F4Q1MsZUF3Q0wsSUF4Q0ssRUF3Q0MsQ0F4Q0QsRUF3Q0k7QUFDWCxXQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUFuQixFQUNTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQURuQixFQUVTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUZuQixFQUdTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUhuQixDQUFQO0FBSUQsR0E3Q1E7QUErQ1QsTUEvQ1MsZ0JBK0NKLElBL0NJLEVBK0NFLENBL0NGLEVBK0NLO0FBQ1osU0FBSyxDQUFMLEtBQVcsRUFBRSxDQUFGLENBQVg7QUFDQSxTQUFLLENBQUwsS0FBVyxFQUFFLENBQUYsQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLEVBQUUsQ0FBRixDQUFYO0FBQ0EsU0FBSyxDQUFMLEtBQVcsRUFBRSxDQUFGLENBQVg7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0F0RFE7QUF3RFQsS0F4RFMsZUF3REwsSUF4REssRUF3REMsQ0F4REQsRUF3REk7QUFDWCxXQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUFuQixFQUNTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQURuQixFQUVTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUZuQixFQUdTLEtBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBRixDQUhuQixDQUFQO0FBSUQsR0E3RFE7QUErRFQsTUEvRFMsZ0JBK0RKLElBL0RJLEVBK0RFLENBL0RGLEVBK0RLO0FBQ1osU0FBSyxDQUFMLEtBQVcsRUFBRSxDQUFGLENBQVg7QUFDQSxTQUFLLENBQUwsS0FBVyxFQUFFLENBQUYsQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLEVBQUUsQ0FBRixDQUFYO0FBQ0EsU0FBSyxDQUFMLEtBQVcsRUFBRSxDQUFGLENBQVg7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0F0RVE7QUF3RVQsT0F4RVMsaUJBd0VILElBeEVHLEVBd0VHLENBeEVILEVBd0VNO0FBQ2IsV0FBTyxJQUFJLElBQUosQ0FBUyxLQUFLLENBQUwsSUFBVSxDQUFuQixFQUNTLEtBQUssQ0FBTCxJQUFVLENBRG5CLEVBRVMsS0FBSyxDQUFMLElBQVUsQ0FGbkIsRUFHUyxLQUFLLENBQUwsSUFBVSxDQUhuQixDQUFQO0FBSUQsR0E3RVE7QUErRVQsUUEvRVMsa0JBK0VGLElBL0VFLEVBK0VJLENBL0VKLEVBK0VPO0FBQ2QsU0FBSyxDQUFMLEtBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsS0FBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLEtBQVcsQ0FBWDs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXRGUTtBQXdGVCxTQXhGUyxtQkF3RkQsSUF4RkMsRUF3RkssQ0F4RkwsRUF3RlE7QUFDZixRQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7QUFBQSxRQUNJLEtBQUssS0FBSyxDQUFMLENBRFQ7QUFBQSxRQUVJLEtBQUssS0FBSyxDQUFMLENBRlQ7QUFBQSxRQUdJLEtBQUssS0FBSyxDQUFMLENBSFQ7QUFBQSxRQUlJLEtBQUssRUFBRSxDQUFGLENBSlQ7QUFBQSxRQUtJLEtBQUssRUFBRSxDQUFGLENBTFQ7QUFBQSxRQU1JLEtBQUssRUFBRSxDQUFGLENBTlQ7QUFBQSxRQU9JLEtBQUssRUFBRSxDQUFGLENBUFQ7O0FBU0EsV0FBTyxJQUFJLElBQUosQ0FBUyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQTVDLEVBQ1MsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBekIsR0FBOEIsS0FBSyxFQUQ1QyxFQUVTLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBZixHQUFvQixLQUFLLEVBQXpCLEdBQThCLEtBQUssRUFGNUMsRUFHUyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBSDVDLENBQVA7QUFJRCxHQXRHUTtBQXdHVCxVQXhHUyxvQkF3R0EsSUF4R0EsRUF3R00sQ0F4R04sRUF3R1M7QUFDaEIsUUFBSSxLQUFLLEtBQUssQ0FBTCxDQUFUO0FBQUEsUUFDSSxLQUFLLEtBQUssQ0FBTCxDQURUO0FBQUEsUUFFSSxLQUFLLEtBQUssQ0FBTCxDQUZUO0FBQUEsUUFHSSxLQUFLLEtBQUssQ0FBTCxDQUhUO0FBQUEsUUFJSSxLQUFLLEVBQUUsQ0FBRixDQUpUO0FBQUEsUUFLSSxLQUFLLEVBQUUsQ0FBRixDQUxUO0FBQUEsUUFNSSxLQUFLLEVBQUUsQ0FBRixDQU5UO0FBQUEsUUFPSSxLQUFLLEVBQUUsQ0FBRixDQVBUOztBQVNBLFNBQUssQ0FBTCxJQUFVLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBZixHQUFvQixLQUFLLEVBQXpCLEdBQThCLEtBQUssRUFBN0M7QUFDQSxTQUFLLENBQUwsSUFBVSxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQTdDO0FBQ0EsU0FBSyxDQUFMLElBQVUsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBekIsR0FBOEIsS0FBSyxFQUE3QztBQUNBLFNBQUssQ0FBTCxJQUFVLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBZixHQUFvQixLQUFLLEVBQXpCLEdBQThCLEtBQUssRUFBN0M7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0F4SFE7QUEwSFQsU0ExSFMsbUJBMEhELElBMUhDLEVBMEhLLENBMUhMLEVBMEhRO0FBQ2YsUUFBSSxLQUFLLEtBQUssQ0FBTCxDQUFUO0FBQUEsUUFDSSxLQUFLLEtBQUssQ0FBTCxDQURUO0FBQUEsUUFFSSxLQUFLLEtBQUssQ0FBTCxDQUZUO0FBQUEsUUFHSSxLQUFLLEtBQUssQ0FBTCxDQUhUO0FBQUEsUUFJSSxLQUFLLEVBQUUsQ0FBRixDQUpUO0FBQUEsUUFLSSxLQUFLLEVBQUUsQ0FBRixDQUxUO0FBQUEsUUFNSSxLQUFLLEVBQUUsQ0FBRixDQU5UO0FBQUEsUUFPSSxLQUFLLEVBQUUsQ0FBRixDQVBUOztBQVNBLFFBQUksSUFBSSxLQUFLLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBZixHQUFvQixLQUFLLEVBQXpCLEdBQThCLEtBQUssRUFBeEMsQ0FBUjs7QUFFQSxXQUFPLElBQUksSUFBSixDQUFTLENBQUMsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBekIsR0FBOEIsS0FBSyxFQUFwQyxJQUEwQyxDQUFuRCxFQUNTLENBQUMsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBekIsR0FBOEIsS0FBSyxFQUFwQyxJQUEwQyxDQURuRCxFQUVTLENBQUMsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBekIsR0FBOEIsS0FBSyxFQUFwQyxJQUEwQyxDQUZuRCxFQUdTLENBQUMsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBekIsR0FBOEIsS0FBSyxFQUFwQyxJQUEwQyxDQUhuRCxDQUFQO0FBSUQsR0ExSVE7QUE0SVQsVUE1SVMsb0JBNElBLElBNUlBLEVBNElNLENBNUlOLEVBNElTO0FBQ2hCLFFBQUksS0FBSyxLQUFLLENBQUwsQ0FBVDtBQUFBLFFBQ0ksS0FBSyxLQUFLLENBQUwsQ0FEVDtBQUFBLFFBRUksS0FBSyxLQUFLLENBQUwsQ0FGVDtBQUFBLFFBR0ksS0FBSyxLQUFLLENBQUwsQ0FIVDtBQUFBLFFBSUksS0FBSyxFQUFFLENBQUYsQ0FKVDtBQUFBLFFBS0ksS0FBSyxFQUFFLENBQUYsQ0FMVDtBQUFBLFFBTUksS0FBSyxFQUFFLENBQUYsQ0FOVDtBQUFBLFFBT0ksS0FBSyxFQUFFLENBQUYsQ0FQVDs7QUFTQSxRQUFJLElBQUksS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQXhDLENBQVI7O0FBRUEsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQXBDLElBQTBDLENBQXBEO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQXBDLElBQTBDLENBQXBEO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQXBDLElBQTBDLENBQXBEO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQXBDLElBQTBDLENBQXBEOztBQUVBLFdBQU8sSUFBUDtBQUNELEdBOUpRO0FBZ0tULFFBaEtTLGtCQWdLRixJQWhLRSxFQWdLSTtBQUNYLFFBQUksS0FBSyxLQUFLLENBQUwsQ0FBVDtBQUFBLFFBQ0ksS0FBSyxLQUFLLENBQUwsQ0FEVDtBQUFBLFFBRUksS0FBSyxLQUFLLENBQUwsQ0FGVDtBQUFBLFFBR0ksS0FBSyxLQUFLLENBQUwsQ0FIVDs7QUFLQSxRQUFJLElBQUksS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQXhDLENBQVI7O0FBRUEsV0FBTyxJQUFJLElBQUosQ0FBUyxDQUFDLEVBQUQsR0FBTSxDQUFmLEVBQWtCLENBQUMsRUFBRCxHQUFNLENBQXhCLEVBQTJCLENBQUMsRUFBRCxHQUFNLENBQWpDLEVBQW9DLEtBQUssQ0FBekMsQ0FBUDtBQUNELEdBektRO0FBMktULFNBM0tTLG1CQTJLRCxJQTNLQyxFQTJLSztBQUNaLFFBQUksS0FBSyxLQUFLLENBQUwsQ0FBVDtBQUFBLFFBQ0ksS0FBSyxLQUFLLENBQUwsQ0FEVDtBQUFBLFFBRUksS0FBSyxLQUFLLENBQUwsQ0FGVDtBQUFBLFFBR0ksS0FBSyxLQUFLLENBQUwsQ0FIVDs7QUFLQSxRQUFJLElBQUksS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUF6QixHQUE4QixLQUFLLEVBQXhDLENBQVI7O0FBRUEsU0FBSyxDQUFMLElBQVUsQ0FBQyxFQUFELEdBQU0sQ0FBaEI7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFDLEVBQUQsR0FBTSxDQUFoQjtBQUNBLFNBQUssQ0FBTCxJQUFVLENBQUMsRUFBRCxHQUFNLENBQWhCO0FBQ0EsU0FBSyxDQUFMLElBQVUsS0FBSyxDQUFmOztBQUVBLFdBQU8sSUFBUDtBQUNELEdBekxRO0FBMkxULE1BM0xTLGdCQTJMSixJQTNMSSxFQTJMRTtBQUNULFFBQUksSUFBSSxLQUFLLENBQUwsQ0FBUjtBQUFBLFFBQ0ksSUFBSSxLQUFLLENBQUwsQ0FEUjtBQUFBLFFBRUksSUFBSSxLQUFLLENBQUwsQ0FGUjtBQUFBLFFBR0ksSUFBSSxLQUFLLENBQUwsQ0FIUjs7QUFLQSxXQUFPLEtBQUssSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFaLEdBQWdCLElBQUksQ0FBcEIsR0FBd0IsSUFBSSxDQUFqQyxDQUFQO0FBQ0QsR0FsTVE7QUFvTVQsUUFwTVMsa0JBb01GLElBcE1FLEVBb01JO0FBQ1gsUUFBSSxJQUFJLEtBQUssQ0FBTCxDQUFSO0FBQUEsUUFDSSxJQUFJLEtBQUssQ0FBTCxDQURSO0FBQUEsUUFFSSxJQUFJLEtBQUssQ0FBTCxDQUZSO0FBQUEsUUFHSSxJQUFJLEtBQUssQ0FBTCxDQUhSOztBQUtBLFdBQU8sSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFaLEdBQWdCLElBQUksQ0FBcEIsR0FBd0IsSUFBSSxDQUFuQztBQUNELEdBM01RO0FBNk1ULE1BN01TLGdCQTZNSixJQTdNSSxFQTZNRTtBQUNULFdBQU8sS0FBSyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFJLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBckIsQ0FBUDtBQUNELEdBL01RO0FBaU5ULE9Bak5TLGlCQWlOSCxJQWpORyxFQWlORztBQUNWLFdBQU8sS0FBSyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFJLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBdEIsQ0FBUDtBQUNELEdBbk5RO0FBcU5ULFdBck5TLHFCQXFOQyxJQXJORCxFQXFOTztBQUNkLFdBQU8sSUFBSSxJQUFKLENBQVMsQ0FBQyxLQUFLLENBQUwsQ0FBVixFQUFtQixDQUFDLEtBQUssQ0FBTCxDQUFwQixFQUE2QixDQUFDLEtBQUssQ0FBTCxDQUE5QixFQUF1QyxLQUFLLENBQUwsQ0FBdkMsQ0FBUDtBQUNELEdBdk5RO0FBeU5ULFlBek5TLHNCQXlORSxJQXpORixFQXlOUTtBQUNmLFNBQUssQ0FBTCxJQUFVLENBQUMsS0FBSyxDQUFMLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFDLEtBQUssQ0FBTCxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLENBQUwsQ0FBWDtBQUNBLFdBQU8sSUFBUDtBQUNEO0FBOU5RLENBQVg7O0FBaU9BOztBQUVBLFFBQVEsS0FBSyxTQUFMLEdBQWlCLEVBQXpCOztBQUVBLEtBQUssTUFBTCxJQUFlLFFBQWYsRUFBeUI7QUFDdkIsT0FBSyxNQUFMLElBQWUsU0FBUyxNQUFULENBQWY7QUFDQSxRQUFNLE1BQU4sSUFBaUIsVUFBVSxDQUFWLEVBQWE7QUFDNUIsV0FBTyxZQUFXO0FBQ2hCLFVBQUksT0FBTyxNQUFNLElBQU4sQ0FBVyxTQUFYLENBQVg7O0FBRUEsV0FBSyxPQUFMLENBQWEsSUFBYjtBQUNBLGFBQU8sS0FBSyxDQUFMLEVBQVEsS0FBUixDQUFjLElBQWQsRUFBb0IsSUFBcEIsQ0FBUDtBQUNELEtBTEQ7QUFNRixHQVBnQixDQU9kLE1BUGMsQ0FBaEI7QUFRRDs7QUFFRDtBQUNBLEtBQUssUUFBTCxHQUFnQixVQUFTLENBQVQsRUFBWTtBQUMxQixTQUFPLElBQUksSUFBSixDQUFTLEVBQUUsQ0FBRixDQUFULEVBQWUsRUFBRSxDQUFGLENBQWYsRUFBcUIsRUFBRSxDQUFGLENBQXJCLENBQVA7QUFDRCxDQUZEOztBQUlBLEtBQUssUUFBTCxHQUFnQixVQUFTLENBQVQsRUFBWTtBQUMxQixNQUFJLElBQUksRUFBRSxDQUFGLENBQVI7QUFBQSxNQUNJLElBQUksRUFBRSxDQUFGLENBRFI7QUFBQSxNQUVJLElBQUksRUFBRSxDQUFGLENBRlI7QUFBQSxNQUdJLElBQUksRUFBRSxDQUFGLENBSFI7O0FBS0EsU0FBTyxJQUFJLElBQUosQ0FDTCxJQUFJLENBQUosR0FBUSxJQUFJLENBQVosR0FBZ0IsSUFBSSxDQUFwQixHQUF3QixJQUFJLENBRHZCLEVBRUwsSUFBSSxDQUFKLEdBQVEsQ0FBUixHQUFZLElBQUksQ0FBSixHQUFRLENBRmYsRUFHTCxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FIZixFQUlMLENBSkssRUFNTCxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FOZixFQU9MLElBQUksQ0FBSixHQUFRLElBQUksQ0FBWixHQUFnQixJQUFJLENBQXBCLEdBQXdCLElBQUksQ0FQdkIsRUFRTCxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FSZixFQVNMLENBVEssRUFXTCxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FYZixFQVlMLElBQUksQ0FBSixHQUFRLENBQVIsR0FBWSxJQUFJLENBQUosR0FBUSxDQVpmLEVBYUwsSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFaLEdBQWdCLElBQUksQ0FBcEIsR0FBd0IsSUFBSSxDQWJ2QixFQWNMLENBZEssRUFnQkwsQ0FoQkssRUFnQkYsQ0FoQkUsRUFnQkMsQ0FoQkQsRUFnQkksQ0FoQkosQ0FBUDtBQWlCRCxDQXZCRCIsImZpbGUiOiJhcnJheS1pbXBsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVmVjMywgTWF0NCBhbmQgUXVhdCBjbGFzc2VzXG4vLyBUT0RPIC0gY2xlYW4gdXAgbGludGluZyBhbmQgcmVtb3ZlIHNvbWUgb2YgdGhlc2UgZXhjZXB0aW9uc1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlIGNvbXB1dGVkLXByb3BlcnR5LXNwYWNpbmcsIGJyYWNlLXN0eWxlLCBtYXgtcGFyYW1zLCBvbmUtdmFyICovXG4vKiBlc2xpbnQtZGlzYWJsZSBpbmRlbnQsIG5vLWxvb3AtZnVuYyAqL1xuXG5jb25zdCBzcXJ0ID0gTWF0aC5zcXJ0O1xuY29uc3Qgc2luID0gTWF0aC5zaW47XG5jb25zdCBjb3MgPSBNYXRoLmNvcztcbmNvbnN0IHRhbiA9IE1hdGgudGFuO1xuY29uc3QgcGkgPSBNYXRoLlBJO1xuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbi8vIFZlYzMgQ2xhc3NcbmV4cG9ydCBjbGFzcyBWZWMzIGV4dGVuZHMgQXJyYXkge1xuXG4gIGNvbnN0cnVjdG9yKHggPSAwLCB5ID0gMCwgeiA9IDApIHtcbiAgICBzdXBlcigzKTtcbiAgICB0aGlzWzBdID0geDtcbiAgICB0aGlzWzFdID0geTtcbiAgICB0aGlzWzJdID0gejtcbiAgfVxuXG4gIC8vIGZhc3QgVmVjMyBjcmVhdGUuXG4gIHN0YXRpYyBjcmVhdGUoKSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKDMpO1xuICB9XG5cbiAgZ2V0IHgoKSB7XG4gICAgcmV0dXJuIHRoaXNbMF07XG4gIH1cblxuICBzZXQgeCh2YWx1ZSkge1xuICAgIHJldHVybiAodGhpc1swXSA9IHZhbHVlKTtcbiAgfVxuXG4gIGdldCB5KCkge1xuICAgIHJldHVybiB0aGlzWzFdO1xuICB9XG5cbiAgc2V0IHkodmFsdWUpIHtcbiAgICByZXR1cm4gKHRoaXNbMV0gPSB2YWx1ZSk7XG4gIH1cblxuICBnZXQgeigpIHtcbiAgICByZXR1cm4gdGhpc1syXTtcbiAgfVxuXG4gIHNldCB6KHZhbHVlKSB7XG4gICAgcmV0dXJuICh0aGlzWzJdID0gdmFsdWUpO1xuICB9XG59XG5cbnZhciBnZW5lcmljcyA9IHtcblxuICBzZXRWZWMzKGRlc3QsIHZlYykge1xuICAgIGRlc3RbMF0gPSB2ZWNbMF07XG4gICAgZGVzdFsxXSA9IHZlY1sxXTtcbiAgICBkZXN0WzJdID0gdmVjWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHNldChkZXN0LCB4LCB5LCB6KSB7XG4gICAgZGVzdFswXSA9IHg7XG4gICAgZGVzdFsxXSA9IHk7XG4gICAgZGVzdFsyXSA9IHo7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgYWRkKGRlc3QsIHZlYykge1xuICAgIHJldHVybiBuZXcgVmVjMyhkZXN0WzBdICsgdmVjWzBdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdICsgdmVjWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICsgdmVjWzJdKTtcbiAgfSxcblxuICAkYWRkKGRlc3QsIHZlYykge1xuICAgIGRlc3RbMF0gKz0gdmVjWzBdO1xuICAgIGRlc3RbMV0gKz0gdmVjWzFdO1xuICAgIGRlc3RbMl0gKz0gdmVjWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGFkZDIoZGVzdCwgYSwgYikge1xuICAgIGRlc3RbMF0gPSBhWzBdICsgYlswXTtcbiAgICBkZXN0WzFdID0gYVsxXSArIGJbMV07XG4gICAgZGVzdFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHN1YihkZXN0LCB2ZWMpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoZGVzdFswXSAtIHZlY1swXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsxXSAtIHZlY1sxXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAtIHZlY1syXSk7XG4gIH0sXG5cbiAgJHN1YihkZXN0LCB2ZWMpIHtcbiAgICBkZXN0WzBdIC09IHZlY1swXTtcbiAgICBkZXN0WzFdIC09IHZlY1sxXTtcbiAgICBkZXN0WzJdIC09IHZlY1syXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzdWIyKGRlc3QsIGEsIGIpIHtcbiAgICBkZXN0WzBdID0gYVswXSAtIGJbMF07XG4gICAgZGVzdFsxXSA9IGFbMV0gLSBiWzFdO1xuICAgIGRlc3RbMl0gPSBhWzJdIC0gYlsyXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzY2FsZShkZXN0LCBzKSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKGRlc3RbMF0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdICogcyxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAqIHMpO1xuICB9LFxuXG4gICRzY2FsZShkZXN0LCBzKSB7XG4gICAgZGVzdFswXSAqPSBzO1xuICAgIGRlc3RbMV0gKj0gcztcbiAgICBkZXN0WzJdICo9IHM7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgbmVnKGRlc3QpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoLWRlc3RbMF0sXG4gICAgICAgICAgICAgICAgICAgIC1kZXN0WzFdLFxuICAgICAgICAgICAgICAgICAgICAtZGVzdFsyXSk7XG4gIH0sXG5cbiAgJG5lZyhkZXN0KSB7XG4gICAgZGVzdFswXSA9IC1kZXN0WzBdO1xuICAgIGRlc3RbMV0gPSAtZGVzdFsxXTtcbiAgICBkZXN0WzJdID0gLWRlc3RbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgdW5pdChkZXN0KSB7XG4gICAgdmFyIGxlbiA9IFZlYzMubm9ybShkZXN0KTtcblxuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICByZXR1cm4gVmVjMy5zY2FsZShkZXN0LCAxIC8gbGVuKTtcbiAgICB9XG4gICAgcmV0dXJuIFZlYzMuY2xvbmUoZGVzdCk7XG4gIH0sXG5cbiAgJHVuaXQoZGVzdCkge1xuICAgIHZhciBsZW4gPSBWZWMzLm5vcm0oZGVzdCk7XG5cbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgcmV0dXJuIFZlYzMuJHNjYWxlKGRlc3QsIDEgLyBsZW4pO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBjcm9zcyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLFxuICAgICAgZHkgPSBkZXN0WzFdLFxuICAgICAgZHogPSBkZXN0WzJdLFxuICAgICAgdnggPSB2ZWNbMF0sXG4gICAgICB2eSA9IHZlY1sxXSxcbiAgICAgIHZ6ID0gdmVjWzJdO1xuXG4gICAgcmV0dXJuIG5ldyBWZWMzKGR5ICogdnogLSBkeiAqIHZ5LFxuICAgICAgICAgICAgICAgICAgICBkeiAqIHZ4IC0gZHggKiB2eixcbiAgICAgICAgICAgICAgICAgICAgZHggKiB2eSAtIGR5ICogdngpO1xuICB9LFxuXG4gICRjcm9zcyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLFxuICAgICAgICBkeSA9IGRlc3RbMV0sXG4gICAgICAgIGR6ID0gZGVzdFsyXSxcbiAgICAgICAgdnggPSB2ZWNbMF0sXG4gICAgICAgIHZ5ID0gdmVjWzFdLFxuICAgICAgICB2eiA9IHZlY1syXTtcblxuICAgIGRlc3RbMF0gPSBkeSAqIHZ6IC0gZHogKiB2eTtcbiAgICBkZXN0WzFdID0gZHogKiB2eCAtIGR4ICogdno7XG4gICAgZGVzdFsyXSA9IGR4ICogdnkgLSBkeSAqIHZ4O1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGRpc3RUbyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdIC0gdmVjWzBdLFxuICAgICAgICBkeSA9IGRlc3RbMV0gLSB2ZWNbMV0sXG4gICAgICAgIGR6ID0gZGVzdFsyXSAtIHZlY1syXTtcblxuICAgIHJldHVybiBzcXJ0KGR4ICogZHggK1xuICAgICAgICAgICAgICAgIGR5ICogZHkgK1xuICAgICAgICAgICAgICAgIGR6ICogZHopO1xuICB9LFxuXG4gIGRpc3RUb1NxKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0gLSB2ZWNbMF0sXG4gICAgICAgIGR5ID0gZGVzdFsxXSAtIHZlY1sxXSxcbiAgICAgICAgZHogPSBkZXN0WzJdIC0gdmVjWzJdO1xuXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcbiAgfSxcblxuICBub3JtKGRlc3QpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLCBkeSA9IGRlc3RbMV0sIGR6ID0gZGVzdFsyXTtcblxuICAgIHJldHVybiBzcXJ0KGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkeik7XG4gIH0sXG5cbiAgbm9ybVNxKGRlc3QpIHtcbiAgICB2YXIgZHggPSBkZXN0WzBdLCBkeSA9IGRlc3RbMV0sIGR6ID0gZGVzdFsyXTtcblxuICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHo7XG4gIH0sXG5cbiAgZG90KGRlc3QsIHZlYykge1xuICAgIHJldHVybiBkZXN0WzBdICogdmVjWzBdICsgZGVzdFsxXSAqIHZlY1sxXSArIGRlc3RbMl0gKiB2ZWNbMl07XG4gIH0sXG5cbiAgY2xvbmUoZGVzdCkge1xuICAgIGlmIChkZXN0IGluc3RhbmNlb2YgVmVjMykge1xuICAgICAgcmV0dXJuIG5ldyBWZWMzKGRlc3RbMF0sIGRlc3RbMV0sIGRlc3RbMl0pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjMy5zZXRWZWMzKG5ldyBGbG9hdDMyQXJyYXkoMyksIGRlc3QpO1xuICB9LFxuXG4gIHRvRmxvYXQzMkFycmF5KGRlc3QpIHtcbiAgICB2YXIgYW5zID0gZGVzdC50eXBlZENvbnRhaW5lcjtcblxuICAgIGlmICghYW5zKSB7XG4gICAgICByZXR1cm4gZGVzdDtcbiAgICB9XG5cbiAgICBhbnNbMF0gPSBkZXN0WzBdO1xuICAgIGFuc1sxXSA9IGRlc3RbMV07XG4gICAgYW5zWzJdID0gZGVzdFsyXTtcblxuICAgIHJldHVybiBhbnM7XG4gIH1cbn07XG5cbi8vIGFkZCBnZW5lcmljcyBhbmQgaW5zdGFuY2UgbWV0aG9kc1xudmFyIHByb3RvID0gVmVjMy5wcm90b3R5cGU7XG5mb3IgKHZhciBtZXRob2QgaW4gZ2VuZXJpY3MpIHtcbiAgVmVjM1ttZXRob2RdID0gZ2VuZXJpY3NbbWV0aG9kXTtcbiAgcHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiBfKG0pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICAgIHJldHVybiBWZWMzW21dLmFwcGx5KFZlYzMsIGFyZ3MpO1xuICAgIH07XG4gfShtZXRob2QpKTtcbn1cblxuLy8gTWF0NCBDbGFzc1xuZXhwb3J0IGNsYXNzIE1hdDQgZXh0ZW5kcyBBcnJheSB7XG5cbiAgY29uc3RydWN0b3IobjExLCBuMTIsIG4xMywgbjE0LFxuICAgICAgICAgICAgICBuMjEsIG4yMiwgbjIzLCBuMjQsXG4gICAgICAgICAgICAgIG4zMSwgbjMyLCBuMzMsIG4zNCxcbiAgICAgICAgICAgICAgbjQxLCBuNDIsIG40MywgbjQ0KSB7XG5cbiAgICBzdXBlcigxNik7XG5cbiAgICB0aGlzLmxlbmd0aCA9IDE2O1xuXG4gICAgaWYgKHR5cGVvZiBuMTEgPT09ICdudW1iZXInKSB7XG5cbiAgICAgIHRoaXMuc2V0KG4xMSwgbjEyLCBuMTMsIG4xNCxcbiAgICAgICAgICAgICAgIG4yMSwgbjIyLCBuMjMsIG4yNCxcbiAgICAgICAgICAgICAgIG4zMSwgbjMyLCBuMzMsIG4zNCxcbiAgICAgICAgICAgICAgIG40MSwgbjQyLCBuNDMsIG40NCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pZCgpO1xuICAgIH1cblxuICAgIHRoaXMudHlwZWRDb250YWluZXIgPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUoKSB7XG4gICAgcmV0dXJuIG5ldyBBcnJheSgxNik7XG4gIH1cblxuICBnZXQgbjExKCkgeyByZXR1cm4gdGhpc1swXTsgfVxuICBnZXQgbjEyKCkgeyByZXR1cm4gdGhpc1s0XTsgfVxuICBnZXQgbjEzKCkgeyByZXR1cm4gdGhpc1s4XTsgfVxuICBnZXQgbjE0KCkgeyByZXR1cm4gdGhpc1sxMl07IH1cbiAgZ2V0IG4yMSgpIHsgcmV0dXJuIHRoaXNbMV07IH1cbiAgZ2V0IG4yMigpIHsgcmV0dXJuIHRoaXNbNV07IH1cbiAgZ2V0IG4yMygpIHsgcmV0dXJuIHRoaXNbOV07IH1cbiAgZ2V0IG4yNCgpIHsgcmV0dXJuIHRoaXNbMTNdOyB9XG4gIGdldCBuMzEoKSB7IHJldHVybiB0aGlzWzJdOyB9XG4gIGdldCBuMzIoKSB7IHJldHVybiB0aGlzWzZdOyB9XG4gIGdldCBuMzMoKSB7IHJldHVybiB0aGlzWzEwXTsgfVxuICBnZXQgbjM0KCkgeyByZXR1cm4gdGhpc1sxNF07IH1cbiAgZ2V0IG40MSgpIHsgcmV0dXJuIHRoaXNbM107IH1cbiAgZ2V0IG40MigpIHsgcmV0dXJuIHRoaXNbN107IH1cbiAgZ2V0IG40MygpIHsgcmV0dXJuIHRoaXNbMTFdOyB9XG4gIGdldCBuNDQoKSB7IHJldHVybiB0aGlzWzE1XTsgfVxuXG4gIHNldCBuMTEodmFsKSB7IHRoaXNbMF0gPSB2YWw7IH1cbiAgc2V0IG4xMih2YWwpIHsgdGhpc1s0XSA9IHZhbDsgfVxuICBzZXQgbjEzKHZhbCkgeyB0aGlzWzhdID0gdmFsOyB9XG4gIHNldCBuMTQodmFsKSB7IHRoaXNbMTJdID0gdmFsOyB9XG4gIHNldCBuMjEodmFsKSB7IHRoaXNbMV0gPSB2YWw7IH1cbiAgc2V0IG4yMih2YWwpIHsgdGhpc1s1XSA9IHZhbDsgfVxuICBzZXQgbjIzKHZhbCkgeyB0aGlzWzldID0gdmFsOyB9XG4gIHNldCBuMjQodmFsKSB7IHRoaXNbMTNdID0gdmFsOyB9XG4gIHNldCBuMzEodmFsKSB7IHRoaXNbMl0gPSB2YWw7IH1cbiAgc2V0IG4zMih2YWwpIHsgdGhpc1s2XSA9IHZhbDsgfVxuICBzZXQgbjMzKHZhbCkgeyB0aGlzWzEwXSA9IHZhbDsgfVxuICBzZXQgbjM0KHZhbCkgeyB0aGlzWzE0XSA9IHZhbDsgfVxuICBzZXQgbjQxKHZhbCkgeyB0aGlzWzNdID0gdmFsOyB9XG4gIHNldCBuNDIodmFsKSB7IHRoaXNbN10gPSB2YWw7IH1cbiAgc2V0IG40Myh2YWwpIHsgdGhpc1sxMV0gPSB2YWw7IH1cbiAgc2V0IG40NCh2YWwpIHsgdGhpc1sxNV0gPSB2YWw7IH1cblxufVxuXG5nZW5lcmljcyA9IHtcblxuICBpZChkZXN0KSB7XG5cbiAgICBkZXN0WzAgXSA9IDE7XG4gICAgZGVzdFsxIF0gPSAwO1xuICAgIGRlc3RbMiBdID0gMDtcbiAgICBkZXN0WzMgXSA9IDA7XG4gICAgZGVzdFs0IF0gPSAwO1xuICAgIGRlc3RbNSBdID0gMTtcbiAgICBkZXN0WzYgXSA9IDA7XG4gICAgZGVzdFs3IF0gPSAwO1xuICAgIGRlc3RbOCBdID0gMDtcbiAgICBkZXN0WzkgXSA9IDA7XG4gICAgZGVzdFsxMF0gPSAxO1xuICAgIGRlc3RbMTFdID0gMDtcbiAgICBkZXN0WzEyXSA9IDA7XG4gICAgZGVzdFsxM10gPSAwO1xuICAgIGRlc3RbMTRdID0gMDtcbiAgICBkZXN0WzE1XSA9IDE7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBjbG9uZShkZXN0KSB7XG4gICAgaWYgKGRlc3QgaW5zdGFuY2VvZiBNYXQ0KSB7XG4gICAgICByZXR1cm4gbmV3IE1hdDQoZGVzdFswXSwgZGVzdFs0XSwgZGVzdFs4XSwgZGVzdFsxMl0sXG4gICAgICAgICAgICAgICAgICAgICAgZGVzdFsxXSwgZGVzdFs1XSwgZGVzdFs5XSwgZGVzdFsxM10sXG4gICAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSwgZGVzdFs2XSwgZGVzdFsxMF0sIGRlc3RbMTRdLFxuICAgICAgICAgICAgICAgICAgICAgIGRlc3RbM10sIGRlc3RbN10sIGRlc3RbMTFdLCBkZXN0WzE1XSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgdHlwZWRBcnJheShkZXN0KTtcbiAgfSxcblxuICBzZXQoZGVzdCwgbjExLCBuMTIsIG4xMywgbjE0LFxuICAgICAgICAgICAgbjIxLCBuMjIsIG4yMywgbjI0LFxuICAgICAgICAgICAgbjMxLCBuMzIsIG4zMywgbjM0LFxuICAgICAgICAgICAgbjQxLCBuNDIsIG40MywgbjQ0KSB7XG5cbiAgICBkZXN0WzAgXSA9IG4xMTtcbiAgICBkZXN0WzQgXSA9IG4xMjtcbiAgICBkZXN0WzggXSA9IG4xMztcbiAgICBkZXN0WzEyXSA9IG4xNDtcbiAgICBkZXN0WzEgXSA9IG4yMTtcbiAgICBkZXN0WzUgXSA9IG4yMjtcbiAgICBkZXN0WzkgXSA9IG4yMztcbiAgICBkZXN0WzEzXSA9IG4yNDtcbiAgICBkZXN0WzIgXSA9IG4zMTtcbiAgICBkZXN0WzYgXSA9IG4zMjtcbiAgICBkZXN0WzEwXSA9IG4zMztcbiAgICBkZXN0WzE0XSA9IG4zNDtcbiAgICBkZXN0WzMgXSA9IG40MTtcbiAgICBkZXN0WzcgXSA9IG40MjtcbiAgICBkZXN0WzExXSA9IG40MztcbiAgICBkZXN0WzE1XSA9IG40NDtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIG11bFZlYzMoZGVzdCwgdmVjKSB7XG4gICAgdmFyIGFucyA9IFZlYzMuY2xvbmUodmVjKTtcbiAgICByZXR1cm4gTWF0NC4kbXVsVmVjMyhkZXN0LCBhbnMpO1xuICB9LFxuXG4gICRtdWxWZWMzKGRlc3QsIHZlYykge1xuICAgIHZhciB2eCA9IHZlY1swXSxcbiAgICAgICAgdnkgPSB2ZWNbMV0sXG4gICAgICAgIHZ6ID0gdmVjWzJdLFxuICAgICAgICBkID0gMSAvIChkZXN0WzNdICogdnggKyBkZXN0WzddICogdnkgKyBkZXN0WzExXSAqIHZ6ICsgZGVzdFsxNV0pO1xuXG4gICAgdmVjWzBdID0gKGRlc3RbMF0gKiB2eCArIGRlc3RbNF0gKiB2eSArIGRlc3RbOCBdICogdnogKyBkZXN0WzEyXSkgKiBkO1xuICAgIHZlY1sxXSA9IChkZXN0WzFdICogdnggKyBkZXN0WzVdICogdnkgKyBkZXN0WzkgXSAqIHZ6ICsgZGVzdFsxM10pICogZDtcbiAgICB2ZWNbMl0gPSAoZGVzdFsyXSAqIHZ4ICsgZGVzdFs2XSAqIHZ5ICsgZGVzdFsxMF0gKiB2eiArIGRlc3RbMTRdKSAqIGQ7XG5cbiAgICByZXR1cm4gdmVjO1xuICB9LFxuXG4gIG11bE1hdDQyKGRlc3QsIGEsIGIpIHtcbiAgICB2YXIgYTExID0gYVswIF0sIGExMiA9IGFbMSBdLCBhMTMgPSBhWzIgXSwgYTE0ID0gYVszIF0sXG4gICAgICAgIGEyMSA9IGFbNCBdLCBhMjIgPSBhWzUgXSwgYTIzID0gYVs2IF0sIGEyNCA9IGFbNyBdLFxuICAgICAgICBhMzEgPSBhWzggXSwgYTMyID0gYVs5IF0sIGEzMyA9IGFbMTBdLCBhMzQgPSBhWzExXSxcbiAgICAgICAgYTQxID0gYVsxMl0sIGE0MiA9IGFbMTNdLCBhNDMgPSBhWzE0XSwgYTQ0ID0gYVsxNV0sXG4gICAgICAgIGIxMSA9IGJbMCBdLCBiMTIgPSBiWzEgXSwgYjEzID0gYlsyIF0sIGIxNCA9IGJbMyBdLFxuICAgICAgICBiMjEgPSBiWzQgXSwgYjIyID0gYls1IF0sIGIyMyA9IGJbNiBdLCBiMjQgPSBiWzcgXSxcbiAgICAgICAgYjMxID0gYls4IF0sIGIzMiA9IGJbOSBdLCBiMzMgPSBiWzEwXSwgYjM0ID0gYlsxMV0sXG4gICAgICAgIGI0MSA9IGJbMTJdLCBiNDIgPSBiWzEzXSwgYjQzID0gYlsxNF0sIGI0NCA9IGJbMTVdO1xuXG4gICAgZGVzdFswIF0gPSBiMTEgKiBhMTEgKyBiMTIgKiBhMjEgKyBiMTMgKiBhMzEgKyBiMTQgKiBhNDE7XG4gICAgZGVzdFsxIF0gPSBiMTEgKiBhMTIgKyBiMTIgKiBhMjIgKyBiMTMgKiBhMzIgKyBiMTQgKiBhNDI7XG4gICAgZGVzdFsyIF0gPSBiMTEgKiBhMTMgKyBiMTIgKiBhMjMgKyBiMTMgKiBhMzMgKyBiMTQgKiBhNDM7XG4gICAgZGVzdFszIF0gPSBiMTEgKiBhMTQgKyBiMTIgKiBhMjQgKyBiMTMgKiBhMzQgKyBiMTQgKiBhNDQ7XG5cbiAgICBkZXN0WzQgXSA9IGIyMSAqIGExMSArIGIyMiAqIGEyMSArIGIyMyAqIGEzMSArIGIyNCAqIGE0MTtcbiAgICBkZXN0WzUgXSA9IGIyMSAqIGExMiArIGIyMiAqIGEyMiArIGIyMyAqIGEzMiArIGIyNCAqIGE0MjtcbiAgICBkZXN0WzYgXSA9IGIyMSAqIGExMyArIGIyMiAqIGEyMyArIGIyMyAqIGEzMyArIGIyNCAqIGE0MztcbiAgICBkZXN0WzcgXSA9IGIyMSAqIGExNCArIGIyMiAqIGEyNCArIGIyMyAqIGEzNCArIGIyNCAqIGE0NDtcblxuICAgIGRlc3RbOCBdID0gYjMxICogYTExICsgYjMyICogYTIxICsgYjMzICogYTMxICsgYjM0ICogYTQxO1xuICAgIGRlc3RbOSBdID0gYjMxICogYTEyICsgYjMyICogYTIyICsgYjMzICogYTMyICsgYjM0ICogYTQyO1xuICAgIGRlc3RbMTBdID0gYjMxICogYTEzICsgYjMyICogYTIzICsgYjMzICogYTMzICsgYjM0ICogYTQzO1xuICAgIGRlc3RbMTFdID0gYjMxICogYTE0ICsgYjMyICogYTI0ICsgYjMzICogYTM0ICsgYjM0ICogYTQ0O1xuXG4gICAgZGVzdFsxMl0gPSBiNDEgKiBhMTEgKyBiNDIgKiBhMjEgKyBiNDMgKiBhMzEgKyBiNDQgKiBhNDE7XG4gICAgZGVzdFsxM10gPSBiNDEgKiBhMTIgKyBiNDIgKiBhMjIgKyBiNDMgKiBhMzIgKyBiNDQgKiBhNDI7XG4gICAgZGVzdFsxNF0gPSBiNDEgKiBhMTMgKyBiNDIgKiBhMjMgKyBiNDMgKiBhMzMgKyBiNDQgKiBhNDM7XG4gICAgZGVzdFsxNV0gPSBiNDEgKiBhMTQgKyBiNDIgKiBhMjQgKyBiNDMgKiBhMzQgKyBiNDQgKiBhNDQ7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgbXVsTWF0NChhLCBiKSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGEpO1xuICAgIHJldHVybiBNYXQ0Lm11bE1hdDQyKG0sIGEsIGIpO1xuICB9LFxuXG4gICRtdWxNYXQ0KGEsIGIpIHtcbiAgICByZXR1cm4gTWF0NC5tdWxNYXQ0MihhLCBhLCBiKTtcbiAgfSxcblxuICBhZGQoZGVzdCwgbSkge1xuICAgIHZhciBjb3B5ID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kYWRkKGNvcHksIG0pO1xuICB9LFxuXG4gICRhZGQoZGVzdCwgbSkge1xuICAgIGRlc3RbMCBdICs9IG1bMF07XG4gICAgZGVzdFsxIF0gKz0gbVsxXTtcbiAgICBkZXN0WzIgXSArPSBtWzJdO1xuICAgIGRlc3RbMyBdICs9IG1bM107XG4gICAgZGVzdFs0IF0gKz0gbVs0XTtcbiAgICBkZXN0WzUgXSArPSBtWzVdO1xuICAgIGRlc3RbNiBdICs9IG1bNl07XG4gICAgZGVzdFs3IF0gKz0gbVs3XTtcbiAgICBkZXN0WzggXSArPSBtWzhdO1xuICAgIGRlc3RbOSBdICs9IG1bOV07XG4gICAgZGVzdFsxMF0gKz0gbVsxMF07XG4gICAgZGVzdFsxMV0gKz0gbVsxMV07XG4gICAgZGVzdFsxMl0gKz0gbVsxMl07XG4gICAgZGVzdFsxM10gKz0gbVsxM107XG4gICAgZGVzdFsxNF0gKz0gbVsxNF07XG4gICAgZGVzdFsxNV0gKz0gbVsxNV07XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICB0cmFuc3Bvc2UoZGVzdCkge1xuICAgIHZhciBtID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kdHJhbnNwb3NlKG0pO1xuICB9LFxuXG4gICR0cmFuc3Bvc2UoZGVzdCkge1xuICAgIHZhciBuNCA9IGRlc3RbNF0sIG44ID0gZGVzdFs4XSwgbjEyID0gZGVzdFsxMl0sXG4gICAgICAgIG4xID0gZGVzdFsxXSwgbjkgPSBkZXN0WzldLCBuMTMgPSBkZXN0WzEzXSxcbiAgICAgICAgbjIgPSBkZXN0WzJdLCBuNiA9IGRlc3RbNl0sIG4xNCA9IGRlc3RbMTRdLFxuICAgICAgICBuMyA9IGRlc3RbM10sIG43ID0gZGVzdFs3XSwgbjExID0gZGVzdFsxMV07XG5cbiAgICBkZXN0WzFdID0gbjQ7XG4gICAgZGVzdFsyXSA9IG44O1xuICAgIGRlc3RbM10gPSBuMTI7XG4gICAgZGVzdFs0XSA9IG4xO1xuICAgIGRlc3RbNl0gPSBuOTtcbiAgICBkZXN0WzddID0gbjEzO1xuICAgIGRlc3RbOF0gPSBuMjtcbiAgICBkZXN0WzldID0gbjY7XG4gICAgZGVzdFsxMV0gPSBuMTQ7XG4gICAgZGVzdFsxMl0gPSBuMztcbiAgICBkZXN0WzEzXSA9IG43O1xuICAgIGRlc3RbMTRdID0gbjExO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgcm90YXRlQXhpcyhkZXN0LCB0aGV0YSwgdmVjKSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRyb3RhdGVBeGlzKG0sIHRoZXRhLCB2ZWMpO1xuICB9LFxuXG4gICRyb3RhdGVBeGlzKGRlc3QsIHRoZXRhLCB2ZWMpIHtcbiAgICB2YXIgcyA9IHNpbih0aGV0YSksXG4gICAgICAgIGMgPSBjb3ModGhldGEpLFxuICAgICAgICBuYyA9IDEgLSBjLFxuICAgICAgICB2eCA9IHZlY1swXSxcbiAgICAgICAgdnkgPSB2ZWNbMV0sXG4gICAgICAgIHZ6ID0gdmVjWzJdLFxuICAgICAgICBtMTEgPSB2eCAqIHZ4ICogbmMgKyBjLFxuICAgICAgICBtMTIgPSB2eCAqIHZ5ICogbmMgKyB2eiAqIHMsXG4gICAgICAgIG0xMyA9IHZ4ICogdnogKiBuYyAtIHZ5ICogcyxcbiAgICAgICAgbTIxID0gdnkgKiB2eCAqIG5jIC0gdnogKiBzLFxuICAgICAgICBtMjIgPSB2eSAqIHZ5ICogbmMgKyBjLFxuICAgICAgICBtMjMgPSB2eSAqIHZ6ICogbmMgKyB2eCAqIHMsXG4gICAgICAgIG0zMSA9IHZ4ICogdnogKiBuYyArIHZ5ICogcyxcbiAgICAgICAgbTMyID0gdnkgKiB2eiAqIG5jIC0gdnggKiBzLFxuICAgICAgICBtMzMgPSB2eiAqIHZ6ICogbmMgKyBjLFxuICAgICAgICBkMTEgPSBkZXN0WzBdLFxuICAgICAgICBkMTIgPSBkZXN0WzFdLFxuICAgICAgICBkMTMgPSBkZXN0WzJdLFxuICAgICAgICBkMTQgPSBkZXN0WzNdLFxuICAgICAgICBkMjEgPSBkZXN0WzRdLFxuICAgICAgICBkMjIgPSBkZXN0WzVdLFxuICAgICAgICBkMjMgPSBkZXN0WzZdLFxuICAgICAgICBkMjQgPSBkZXN0WzddLFxuICAgICAgICBkMzEgPSBkZXN0WzhdLFxuICAgICAgICBkMzIgPSBkZXN0WzldLFxuICAgICAgICBkMzMgPSBkZXN0WzEwXSxcbiAgICAgICAgZDM0ID0gZGVzdFsxMV0sXG4gICAgICAgIGQ0MSA9IGRlc3RbMTJdLFxuICAgICAgICBkNDIgPSBkZXN0WzEzXSxcbiAgICAgICAgZDQzID0gZGVzdFsxNF0sXG4gICAgICAgIGQ0NCA9IGRlc3RbMTVdO1xuXG4gICAgZGVzdFswIF0gPSBkMTEgKiBtMTEgKyBkMjEgKiBtMTIgKyBkMzEgKiBtMTM7XG4gICAgZGVzdFsxIF0gPSBkMTIgKiBtMTEgKyBkMjIgKiBtMTIgKyBkMzIgKiBtMTM7XG4gICAgZGVzdFsyIF0gPSBkMTMgKiBtMTEgKyBkMjMgKiBtMTIgKyBkMzMgKiBtMTM7XG4gICAgZGVzdFszIF0gPSBkMTQgKiBtMTEgKyBkMjQgKiBtMTIgKyBkMzQgKiBtMTM7XG5cbiAgICBkZXN0WzQgXSA9IGQxMSAqIG0yMSArIGQyMSAqIG0yMiArIGQzMSAqIG0yMztcbiAgICBkZXN0WzUgXSA9IGQxMiAqIG0yMSArIGQyMiAqIG0yMiArIGQzMiAqIG0yMztcbiAgICBkZXN0WzYgXSA9IGQxMyAqIG0yMSArIGQyMyAqIG0yMiArIGQzMyAqIG0yMztcbiAgICBkZXN0WzcgXSA9IGQxNCAqIG0yMSArIGQyNCAqIG0yMiArIGQzNCAqIG0yMztcblxuICAgIGRlc3RbOCBdID0gZDExICogbTMxICsgZDIxICogbTMyICsgZDMxICogbTMzO1xuICAgIGRlc3RbOSBdID0gZDEyICogbTMxICsgZDIyICogbTMyICsgZDMyICogbTMzO1xuICAgIGRlc3RbMTBdID0gZDEzICogbTMxICsgZDIzICogbTMyICsgZDMzICogbTMzO1xuICAgIGRlc3RbMTFdID0gZDE0ICogbTMxICsgZDI0ICogbTMyICsgZDM0ICogbTMzO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgcm90YXRlWFlaKGRlc3QsIHJ4LCByeSwgcnopIHtcbiAgICB2YXIgYW5zID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kcm90YXRlWFlaKGFucywgcngsIHJ5LCByeik7XG4gIH0sXG5cbiAgJHJvdGF0ZVhZWihkZXN0LCByeCwgcnksIHJ6KSB7XG4gICAgdmFyIGQxMSA9IGRlc3RbMCBdLFxuICAgICAgICBkMTIgPSBkZXN0WzEgXSxcbiAgICAgICAgZDEzID0gZGVzdFsyIF0sXG4gICAgICAgIGQxNCA9IGRlc3RbMyBdLFxuICAgICAgICBkMjEgPSBkZXN0WzQgXSxcbiAgICAgICAgZDIyID0gZGVzdFs1IF0sXG4gICAgICAgIGQyMyA9IGRlc3RbNiBdLFxuICAgICAgICBkMjQgPSBkZXN0WzcgXSxcbiAgICAgICAgZDMxID0gZGVzdFs4IF0sXG4gICAgICAgIGQzMiA9IGRlc3RbOSBdLFxuICAgICAgICBkMzMgPSBkZXN0WzEwXSxcbiAgICAgICAgZDM0ID0gZGVzdFsxMV0sXG4gICAgICAgIGNyeCA9IGNvcyhyeCksXG4gICAgICAgIGNyeSA9IGNvcyhyeSksXG4gICAgICAgIGNyeiA9IGNvcyhyeiksXG4gICAgICAgIHNyeCA9IHNpbihyeCksXG4gICAgICAgIHNyeSA9IHNpbihyeSksXG4gICAgICAgIHNyeiA9IHNpbihyeiksXG4gICAgICAgIG0xMSA9ICBjcnkgKiBjcnosXG4gICAgICAgIG0yMSA9IC1jcnggKiBzcnogKyBzcnggKiBzcnkgKiBjcnosXG4gICAgICAgIG0zMSA9ICBzcnggKiBzcnogKyBjcnggKiBzcnkgKiBjcnosXG4gICAgICAgIG0xMiA9ICBjcnkgKiBzcnosXG4gICAgICAgIG0yMiA9ICBjcnggKiBjcnogKyBzcnggKiBzcnkgKiBzcnosXG4gICAgICAgIG0zMiA9IC1zcnggKiBjcnogKyBjcnggKiBzcnkgKiBzcnosXG4gICAgICAgIG0xMyA9IC1zcnksXG4gICAgICAgIG0yMyA9ICBzcnggKiBjcnksXG4gICAgICAgIG0zMyA9ICBjcnggKiBjcnk7XG5cbiAgICBkZXN0WzAgXSA9IGQxMSAqIG0xMSArIGQyMSAqIG0xMiArIGQzMSAqIG0xMztcbiAgICBkZXN0WzEgXSA9IGQxMiAqIG0xMSArIGQyMiAqIG0xMiArIGQzMiAqIG0xMztcbiAgICBkZXN0WzIgXSA9IGQxMyAqIG0xMSArIGQyMyAqIG0xMiArIGQzMyAqIG0xMztcbiAgICBkZXN0WzMgXSA9IGQxNCAqIG0xMSArIGQyNCAqIG0xMiArIGQzNCAqIG0xMztcblxuICAgIGRlc3RbNCBdID0gZDExICogbTIxICsgZDIxICogbTIyICsgZDMxICogbTIzO1xuICAgIGRlc3RbNSBdID0gZDEyICogbTIxICsgZDIyICogbTIyICsgZDMyICogbTIzO1xuICAgIGRlc3RbNiBdID0gZDEzICogbTIxICsgZDIzICogbTIyICsgZDMzICogbTIzO1xuICAgIGRlc3RbNyBdID0gZDE0ICogbTIxICsgZDI0ICogbTIyICsgZDM0ICogbTIzO1xuXG4gICAgZGVzdFs4IF0gPSBkMTEgKiBtMzEgKyBkMjEgKiBtMzIgKyBkMzEgKiBtMzM7XG4gICAgZGVzdFs5IF0gPSBkMTIgKiBtMzEgKyBkMjIgKiBtMzIgKyBkMzIgKiBtMzM7XG4gICAgZGVzdFsxMF0gPSBkMTMgKiBtMzEgKyBkMjMgKiBtMzIgKyBkMzMgKiBtMzM7XG4gICAgZGVzdFsxMV0gPSBkMTQgKiBtMzEgKyBkMjQgKiBtMzIgKyBkMzQgKiBtMzM7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICB0cmFuc2xhdGUoZGVzdCwgeCwgeSwgeikge1xuICAgIHZhciBtID0gTWF0NC5jbG9uZShkZXN0KTtcbiAgICByZXR1cm4gTWF0NC4kdHJhbnNsYXRlKG0sIHgsIHksIHopO1xuICB9LFxuXG4gICR0cmFuc2xhdGUoZGVzdCwgeCwgeSwgeikge1xuICAgIGRlc3RbMTJdID0gZGVzdFswIF0gKiB4ICsgZGVzdFs0IF0gKiB5ICsgZGVzdFs4IF0gKiB6ICsgZGVzdFsxMl07XG4gICAgZGVzdFsxM10gPSBkZXN0WzEgXSAqIHggKyBkZXN0WzUgXSAqIHkgKyBkZXN0WzkgXSAqIHogKyBkZXN0WzEzXTtcbiAgICBkZXN0WzE0XSA9IGRlc3RbMiBdICogeCArIGRlc3RbNiBdICogeSArIGRlc3RbMTBdICogeiArIGRlc3RbMTRdO1xuICAgIGRlc3RbMTVdID0gZGVzdFszIF0gKiB4ICsgZGVzdFs3IF0gKiB5ICsgZGVzdFsxMV0gKiB6ICsgZGVzdFsxNV07XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzY2FsZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRzY2FsZShtLCB4LCB5LCB6KTtcbiAgfSxcblxuICAkc2NhbGUoZGVzdCwgeCwgeSwgeikge1xuICAgIGRlc3RbMCBdICo9IHg7XG4gICAgZGVzdFsxIF0gKj0geDtcbiAgICBkZXN0WzIgXSAqPSB4O1xuICAgIGRlc3RbMyBdICo9IHg7XG4gICAgZGVzdFs0IF0gKj0geTtcbiAgICBkZXN0WzUgXSAqPSB5O1xuICAgIGRlc3RbNiBdICo9IHk7XG4gICAgZGVzdFs3IF0gKj0geTtcbiAgICBkZXN0WzggXSAqPSB6O1xuICAgIGRlc3RbOSBdICo9IHo7XG4gICAgZGVzdFsxMF0gKj0gejtcbiAgICBkZXN0WzExXSAqPSB6O1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgLy8gTWV0aG9kIGJhc2VkIG9uIFByZUdMIGh0dHBzOi8vIGdpdGh1Yi5jb20vZGVhbm0vcHJlZ2wvIChjKSBEZWFuIE1jTmFtZWUuXG4gIGludmVydChkZXN0KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiAgTWF0NC4kaW52ZXJ0KG0pO1xuICB9LFxuXG4gICRpbnZlcnQoZGVzdCkge1xuICAgIHZhciB4MCA9IGRlc3RbMF0sICB4MSA9IGRlc3RbMV0sICB4MiA9IGRlc3RbMl0sICB4MyA9IGRlc3RbM10sXG4gICAgICAgIHg0ID0gZGVzdFs0XSwgIHg1ID0gZGVzdFs1XSwgIHg2ID0gZGVzdFs2XSwgIHg3ID0gZGVzdFs3XSxcbiAgICAgICAgeDggPSBkZXN0WzhdLCAgeDkgPSBkZXN0WzldLCB4MTAgPSBkZXN0WzEwXSwgeDExID0gZGVzdFsxMV0sXG4gICAgICAgIHgxMiA9IGRlc3RbMTJdLCB4MTMgPSBkZXN0WzEzXSwgeDE0ID0gZGVzdFsxNF0sIHgxNSA9IGRlc3RbMTVdO1xuXG4gICAgdmFyIGEwID0geDAgKiB4NSAtIHgxICogeDQsXG4gICAgICAgIGExID0geDAgKiB4NiAtIHgyICogeDQsXG4gICAgICAgIGEyID0geDAgKiB4NyAtIHgzICogeDQsXG4gICAgICAgIGEzID0geDEgKiB4NiAtIHgyICogeDUsXG4gICAgICAgIGE0ID0geDEgKiB4NyAtIHgzICogeDUsXG4gICAgICAgIGE1ID0geDIgKiB4NyAtIHgzICogeDYsXG4gICAgICAgIGIwID0geDggKiB4MTMgLSB4OSAqIHgxMixcbiAgICAgICAgYjEgPSB4OCAqIHgxNCAtIHgxMCAqIHgxMixcbiAgICAgICAgYjIgPSB4OCAqIHgxNSAtIHgxMSAqIHgxMixcbiAgICAgICAgYjMgPSB4OSAqIHgxNCAtIHgxMCAqIHgxMyxcbiAgICAgICAgYjQgPSB4OSAqIHgxNSAtIHgxMSAqIHgxMyxcbiAgICAgICAgYjUgPSB4MTAgKiB4MTUgLSB4MTEgKiB4MTQ7XG5cbiAgICB2YXIgaW52ZGV0ID0gMSAvXG4gICAgICAoYTAgKiBiNSAtIGExICogYjQgKyBhMiAqIGIzICsgYTMgKiBiMiAtIGE0ICogYjEgKyBhNSAqIGIwKTtcblxuICAgIGRlc3RbMCBdID0gKCsgeDUgKiBiNSAtIHg2ICogYjQgKyB4NyAqIGIzKSAqIGludmRldDtcbiAgICBkZXN0WzEgXSA9ICgtIHgxICogYjUgKyB4MiAqIGI0IC0geDMgKiBiMykgKiBpbnZkZXQ7XG4gICAgZGVzdFsyIF0gPSAoKyB4MTMgKiBhNSAtIHgxNCAqIGE0ICsgeDE1ICogYTMpICogaW52ZGV0O1xuICAgIGRlc3RbMyBdID0gKC0geDkgKiBhNSArIHgxMCAqIGE0IC0geDExICogYTMpICogaW52ZGV0O1xuICAgIGRlc3RbNCBdID0gKC0geDQgKiBiNSArIHg2ICogYjIgLSB4NyAqIGIxKSAqIGludmRldDtcbiAgICBkZXN0WzUgXSA9ICgrIHgwICogYjUgLSB4MiAqIGIyICsgeDMgKiBiMSkgKiBpbnZkZXQ7XG4gICAgZGVzdFs2IF0gPSAoLSB4MTIgKiBhNSArIHgxNCAqIGEyIC0geDE1ICogYTEpICogaW52ZGV0O1xuICAgIGRlc3RbNyBdID0gKCsgeDggKiBhNSAtIHgxMCAqIGEyICsgeDExICogYTEpICogaW52ZGV0O1xuICAgIGRlc3RbOCBdID0gKCsgeDQgKiBiNCAtIHg1ICogYjIgKyB4NyAqIGIwKSAqIGludmRldDtcbiAgICBkZXN0WzkgXSA9ICgtIHgwICogYjQgKyB4MSAqIGIyIC0geDMgKiBiMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxMF0gPSAoKyB4MTIgKiBhNCAtIHgxMyAqIGEyICsgeDE1ICogYTApICogaW52ZGV0O1xuICAgIGRlc3RbMTFdID0gKC0geDggKiBhNCArIHg5ICogYTIgLSB4MTEgKiBhMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxMl0gPSAoLSB4NCAqIGIzICsgeDUgKiBiMSAtIHg2ICogYjApICogaW52ZGV0O1xuICAgIGRlc3RbMTNdID0gKCsgeDAgKiBiMyAtIHgxICogYjEgKyB4MiAqIGIwKSAqIGludmRldDtcbiAgICBkZXN0WzE0XSA9ICgtIHgxMiAqIGEzICsgeDEzICogYTEgLSB4MTQgKiBhMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxNV0gPSAoKyB4OCAqIGEzIC0geDkgKiBhMSArIHgxMCAqIGEwKSAqIGludmRldDtcblxuICAgIHJldHVybiBkZXN0O1xuXG4gIH0sXG4gIC8vIFRPRE8obmljbykgYnJlYWtpbmcgY29udmVudGlvbiBoZXJlLi4uXG4gIC8vIGJlY2F1c2UgSSBkb24ndCB0aGluayBpdCdzIHVzZWZ1bCB0byBhZGRcbiAgLy8gdHdvIG1ldGhvZHMgZm9yIGVhY2ggb2YgdGhlc2UuXG4gIGxvb2tBdChkZXN0LCBleWUsIGNlbnRlciwgdXApIHtcbiAgICB2YXIgeiA9IFZlYzMuc3ViKGV5ZSwgY2VudGVyKTtcbiAgICB6LiR1bml0KCk7XG4gICAgdmFyIHggPSBWZWMzLmNyb3NzKHVwLCB6KTtcbiAgICB4LiR1bml0KCk7XG4gICAgdmFyIHkgPSBWZWMzLmNyb3NzKHosIHgpO1xuICAgIHkuJHVuaXQoKTtcbiAgICByZXR1cm4gTWF0NC5zZXQoZGVzdCwgeFswXSwgeFsxXSwgeFsyXSwgLXguZG90KGV5ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHlbMF0sIHlbMV0sIHlbMl0sIC15LmRvdChleWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB6WzBdLCB6WzFdLCB6WzJdLCAtei5kb3QoZXllKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgMCwgMCwgMSk7XG4gIH0sXG5cbiAgZnJ1c3R1bShkZXN0LCBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgIHZhciBybCA9IHJpZ2h0IC0gbGVmdCxcbiAgICAgICAgdGIgPSB0b3AgLSBib3R0b20sXG4gICAgICAgIGZuID0gZmFyIC0gbmVhcjtcblxuICAgIGRlc3RbMF0gPSAobmVhciAqIDIpIC8gcmw7XG4gICAgZGVzdFsxXSA9IDA7XG4gICAgZGVzdFsyXSA9IDA7XG4gICAgZGVzdFszXSA9IDA7XG4gICAgZGVzdFs0XSA9IDA7XG4gICAgZGVzdFs1XSA9IChuZWFyICogMikgLyB0YjtcbiAgICBkZXN0WzZdID0gMDtcbiAgICBkZXN0WzddID0gMDtcbiAgICBkZXN0WzhdID0gKHJpZ2h0ICsgbGVmdCkgLyBybDtcbiAgICBkZXN0WzldID0gKHRvcCArIGJvdHRvbSkgLyB0YjtcbiAgICBkZXN0WzEwXSA9IC0oZmFyICsgbmVhcikgLyBmbjtcbiAgICBkZXN0WzExXSA9IC0xO1xuICAgIGRlc3RbMTJdID0gMDtcbiAgICBkZXN0WzEzXSA9IDA7XG4gICAgZGVzdFsxNF0gPSAtKGZhciAqIG5lYXIgKiAyKSAvIGZuO1xuICAgIGRlc3RbMTVdID0gMDtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHBlcnNwZWN0aXZlKGRlc3QsIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgeW1heCA9IG5lYXIgKiB0YW4oZm92ICogcGkgLyAzNjApLFxuICAgICAgICB5bWluID0gLXltYXgsXG4gICAgICAgIHhtaW4gPSB5bWluICogYXNwZWN0LFxuICAgICAgICB4bWF4ID0geW1heCAqIGFzcGVjdDtcblxuICAgIHJldHVybiBNYXQ0LmZydXN0dW0oZGVzdCwgeG1pbiwgeG1heCwgeW1pbiwgeW1heCwgbmVhciwgZmFyKTtcbiAgfSxcblxuICBvcnRobyhkZXN0LCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b20sIG5lYXIsIGZhcikge1xuICAgIHZhciB0ZSA9IHRoaXMuZWxlbWVudHMsXG4gICAgICAgIHcgPSByaWdodCAtIGxlZnQsXG4gICAgICAgIGggPSB0b3AgLSBib3R0b20sXG4gICAgICAgIHAgPSBmYXIgLSBuZWFyLFxuICAgICAgICB4ID0gKHJpZ2h0ICsgbGVmdCkgLyB3LFxuICAgICAgICB5ID0gKHRvcCArIGJvdHRvbSkgLyBoLFxuICAgICAgICB6ID0gKGZhciArIG5lYXIpIC8gcDtcblxuICAgIGRlc3RbMF0gPSAyIC8gdztcdGRlc3RbNF0gPSAwO1x0ZGVzdFs4XSA9IDA7XHRkZXN0WzEyXSA9IC14O1xuICAgIGRlc3RbMV0gPSAwO1x0ZGVzdFs1XSA9IDIgLyBoO1x0ZGVzdFs5XSA9IDA7XHRkZXN0WzEzXSA9IC15O1xuICAgIGRlc3RbMl0gPSAwO1x0ZGVzdFs2XSA9IDA7XHRkZXN0WzEwXSA9IC0yIC8gcDtcdGRlc3RbMTRdID0gLXo7XG4gICAgZGVzdFszXSA9IDA7XHRkZXN0WzddID0gMDtcdGRlc3RbMTFdID0gMDtcdGRlc3RbMTVdID0gMTtcblxuICAgIHJldHVybiBkZXN0O1xuXHR9LFxuXG4gIHRvRmxvYXQzMkFycmF5KGRlc3QpIHtcbiAgICB2YXIgYW5zID0gZGVzdC50eXBlZENvbnRhaW5lcjtcblxuICAgIGlmICghYW5zKSB7XG4gICAgICByZXR1cm4gZGVzdDtcbiAgICB9XG5cbiAgICBhbnNbMF0gPSBkZXN0WzBdO1xuICAgIGFuc1sxXSA9IGRlc3RbMV07XG4gICAgYW5zWzJdID0gZGVzdFsyXTtcbiAgICBhbnNbM10gPSBkZXN0WzNdO1xuICAgIGFuc1s0XSA9IGRlc3RbNF07XG4gICAgYW5zWzVdID0gZGVzdFs1XTtcbiAgICBhbnNbNl0gPSBkZXN0WzZdO1xuICAgIGFuc1s3XSA9IGRlc3RbN107XG4gICAgYW5zWzhdID0gZGVzdFs4XTtcbiAgICBhbnNbOV0gPSBkZXN0WzldO1xuICAgIGFuc1sxMF0gPSBkZXN0WzEwXTtcbiAgICBhbnNbMTFdID0gZGVzdFsxMV07XG4gICAgYW5zWzEyXSA9IGRlc3RbMTJdO1xuICAgIGFuc1sxM10gPSBkZXN0WzEzXTtcbiAgICBhbnNbMTRdID0gZGVzdFsxNF07XG4gICAgYW5zWzE1XSA9IGRlc3RbMTVdO1xuXG4gICAgcmV0dXJuIGFucztcbiAgfVxuXG59O1xuXG4vLyBhZGQgZ2VuZXJpY3MgYW5kIGluc3RhbmNlIG1ldGhvZHNcbnByb3RvID0gTWF0NC5wcm90b3R5cGU7XG5mb3IgKG1ldGhvZCBpbiBnZW5lcmljcykge1xuICBNYXQ0W21ldGhvZF0gPSBnZW5lcmljc1ttZXRob2RdO1xuICBwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICAgIHJldHVybiBNYXQ0W21dLmFwcGx5KE1hdDQsIGFyZ3MpO1xuICAgIH07XG4gfSkobWV0aG9kKTtcbn1cblxuLy8gUXVhdGVybmlvbiBjbGFzc1xuZXhwb3J0IGNsYXNzIFF1YXQgZXh0ZW5kcyBBcnJheSB7XG4gIGNvbnN0cnVjdG9yKHgsIHksIHosIHcpIHtcbiAgICBzdXBlcig0KTtcbiAgICB0aGlzWzBdID0geCB8fCAwO1xuICAgIHRoaXNbMV0gPSB5IHx8IDA7XG4gICAgdGhpc1syXSA9IHogfHwgMDtcbiAgICB0aGlzWzNdID0gdyB8fCAwO1xuXG4gICAgdGhpcy50eXBlZENvbnRhaW5lciA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlKCkge1xuICAgIHJldHVybiBuZXcgQXJyYXkoNCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbVZlYzModiwgcikge1xuICAgIHJldHVybiBuZXcgUXVhdCh2WzBdLCB2WzFdLCB2WzJdLCByIHx8IDApO1xuICB9XG5cbiAgc3RhdGljIGZyb21NYXQ0KG0pIHtcbiAgICB2YXIgdTtcbiAgICB2YXIgdjtcbiAgICB2YXIgdztcblxuICAgIC8vIENob29zZSB1LCB2LCBhbmQgdyBzdWNoIHRoYXQgdSBpcyB0aGUgaW5kZXggb2YgdGhlIGJpZ2dlc3QgZGlhZ29uYWwgZW50cnlcbiAgICAvLyBvZiBtLCBhbmQgdSB2IHcgaXMgYW4gZXZlbiBwZXJtdXRhdGlvbiBvZiAwIDEgYW5kIDIuXG4gICAgaWYgKG1bMF0gPiBtWzVdICYmIG1bMF0gPiBtWzEwXSkge1xuICAgICAgdSA9IDA7XG4gICAgICB2ID0gMTtcbiAgICAgIHcgPSAyO1xuICAgIH0gZWxzZSBpZiAobVs1XSA+IG1bMF0gJiYgbVs1XSA+IG1bMTBdKSB7XG4gICAgICB1ID0gMTtcbiAgICAgIHYgPSAyO1xuICAgICAgdyA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHUgPSAyO1xuICAgICAgdiA9IDA7XG4gICAgICB3ID0gMTtcbiAgICB9XG5cbiAgICB2YXIgciA9IHNxcnQoMSArIG1bdSAqIDVdIC0gbVt2ICogNV0gLSBtW3cgKiA1XSk7XG4gICAgdmFyIHEgPSBuZXcgUXVhdDtcblxuICAgIHFbdV0gPSAwLjUgKiByO1xuICAgIHFbdl0gPSAwLjUgKiAobVsnbicgKyB2ICsgJycgKyB1XSArIG1bJ24nICsgdSArICcnICsgdl0pIC8gcjtcbiAgICBxW3ddID0gMC41ICogKG1bJ24nICsgdSArICcnICsgd10gKyBtWyduJyArIHcgKyAnJyArIHVdKSAvIHI7XG4gICAgcVszXSA9IDAuNSAqIChtWyduJyArIHYgKyAnJyArIHddIC0gbVsnbicgKyB3ICsgJycgKyB2XSkgLyByO1xuXG4gICAgcmV0dXJuIHE7XG4gIH1cblxuICBzdGF0aWMgZnJvbVhSb3RhdGlvbihhbmdsZSkge1xuICAgIHJldHVybiBuZXcgUXVhdChzaW4oYW5nbGUgLyAyKSwgMCwgMCwgY29zKGFuZ2xlIC8gMikpO1xuICB9XG5cbiAgc3RhdGljIGZyb21ZUm90YXRpb24oYW5nbGUpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoMCwgc2luKGFuZ2xlIC8gMiksIDAsIGNvcyhhbmdsZSAvIDIpKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tWlJvdGF0aW9uKGFuZ2xlKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KDAsIDAsIHNpbihhbmdsZSAvIDIpLCBjb3MoYW5nbGUgLyAyKSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUF4aXNSb3RhdGlvbih2ZWMsIGFuZ2xlKSB7XG4gICAgdmFyIHggPSB2ZWNbMF0sXG4gICAgICAgIHkgPSB2ZWNbMV0sXG4gICAgICAgIHogPSB2ZWNbMl0sXG4gICAgICAgIGQgPSAxIC8gc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopLFxuICAgICAgICBzID0gc2luKGFuZ2xlIC8gMiksXG4gICAgICAgIGMgPSBjb3MoYW5nbGUgLyAyKTtcblxuICAgIHJldHVybiBuZXcgUXVhdChzICogeCAqIGQsIHMgKiB5ICogZCwgcyAqIHogKiBkLCBjKTtcbiAgfVxuXG59XG5cbmdlbmVyaWNzID0ge1xuXG4gIHNldFF1YXQoZGVzdCwgcSkge1xuICAgIGRlc3RbMF0gPSBxWzBdO1xuICAgIGRlc3RbMV0gPSBxWzFdO1xuICAgIGRlc3RbMl0gPSBxWzJdO1xuICAgIGRlc3RbM10gPSBxWzNdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc2V0KGRlc3QsIHgsIHksIHosIHcpIHtcbiAgICBkZXN0WzBdID0geCB8fCAwO1xuICAgIGRlc3RbMV0gPSB5IHx8IDA7XG4gICAgZGVzdFsyXSA9IHogfHwgMDtcbiAgICBkZXN0WzNdID0gdyB8fCAwO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgY2xvbmUoZGVzdCkge1xuICAgIGlmIChkZXN0IGluc3RhbmNlb2YgUXVhdCkge1xuICAgICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0sIGRlc3RbMV0sIGRlc3RbMl0sIGRlc3RbM10pO1xuICAgIH1cbiAgICByZXR1cm4gUXVhdC5zZXRRdWF0KG5ldyB0eXBlZEFycmF5KDQpLCBkZXN0KTtcbiAgfSxcblxuICBuZWcoZGVzdCkge1xuICAgIHJldHVybiBuZXcgUXVhdCgtZGVzdFswXSwgLWRlc3RbMV0sIC1kZXN0WzJdLCAtZGVzdFszXSk7XG4gIH0sXG5cbiAgJG5lZyhkZXN0KSB7XG4gICAgZGVzdFswXSA9IC1kZXN0WzBdO1xuICAgIGRlc3RbMV0gPSAtZGVzdFsxXTtcbiAgICBkZXN0WzJdID0gLWRlc3RbMl07XG4gICAgZGVzdFszXSA9IC1kZXN0WzNdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgYWRkKGRlc3QsIHEpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoZGVzdFswXSArIHFbMF0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKyBxWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICsgcVsyXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFszXSArIHFbM10pO1xuICB9LFxuXG4gICRhZGQoZGVzdCwgcSkge1xuICAgIGRlc3RbMF0gKz0gcVswXTtcbiAgICBkZXN0WzFdICs9IHFbMV07XG4gICAgZGVzdFsyXSArPSBxWzJdO1xuICAgIGRlc3RbM10gKz0gcVszXTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHN1YihkZXN0LCBxKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0gLSBxWzBdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdIC0gcVsxXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAtIHFbMl0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbM10gLSBxWzNdKTtcbiAgfSxcblxuICAkc3ViKGRlc3QsIHEpIHtcbiAgICBkZXN0WzBdIC09IHFbMF07XG4gICAgZGVzdFsxXSAtPSBxWzFdO1xuICAgIGRlc3RbMl0gLT0gcVsyXTtcbiAgICBkZXN0WzNdIC09IHFbM107XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzY2FsZShkZXN0LCBzKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdICogcyxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAqIHMsXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbM10gKiBzKTtcbiAgfSxcblxuICAkc2NhbGUoZGVzdCwgcykge1xuICAgIGRlc3RbMF0gKj0gcztcbiAgICBkZXN0WzFdICo9IHM7XG4gICAgZGVzdFsyXSAqPSBzO1xuICAgIGRlc3RbM10gKj0gcztcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIG11bFF1YXQoZGVzdCwgcSkge1xuICAgIHZhciBhWCA9IGRlc3RbMF0sXG4gICAgICAgIGFZID0gZGVzdFsxXSxcbiAgICAgICAgYVogPSBkZXN0WzJdLFxuICAgICAgICBhVyA9IGRlc3RbM10sXG4gICAgICAgIGJYID0gcVswXSxcbiAgICAgICAgYlkgPSBxWzFdLFxuICAgICAgICBiWiA9IHFbMl0sXG4gICAgICAgIGJXID0gcVszXTtcblxuICAgIHJldHVybiBuZXcgUXVhdChhVyAqIGJYICsgYVggKiBiVyArIGFZICogYlogLSBhWiAqIGJZLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJZICsgYVkgKiBiVyArIGFaICogYlggLSBhWCAqIGJaLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJaICsgYVogKiBiVyArIGFYICogYlkgLSBhWSAqIGJYLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJXIC0gYVggKiBiWCAtIGFZICogYlkgLSBhWiAqIGJaKTtcbiAgfSxcblxuICAkbXVsUXVhdChkZXN0LCBxKSB7XG4gICAgdmFyIGFYID0gZGVzdFswXSxcbiAgICAgICAgYVkgPSBkZXN0WzFdLFxuICAgICAgICBhWiA9IGRlc3RbMl0sXG4gICAgICAgIGFXID0gZGVzdFszXSxcbiAgICAgICAgYlggPSBxWzBdLFxuICAgICAgICBiWSA9IHFbMV0sXG4gICAgICAgIGJaID0gcVsyXSxcbiAgICAgICAgYlcgPSBxWzNdO1xuXG4gICAgZGVzdFswXSA9IGFXICogYlggKyBhWCAqIGJXICsgYVkgKiBiWiAtIGFaICogYlk7XG4gICAgZGVzdFsxXSA9IGFXICogYlkgKyBhWSAqIGJXICsgYVogKiBiWCAtIGFYICogYlo7XG4gICAgZGVzdFsyXSA9IGFXICogYlogKyBhWiAqIGJXICsgYVggKiBiWSAtIGFZICogYlg7XG4gICAgZGVzdFszXSA9IGFXICogYlcgLSBhWCAqIGJYIC0gYVkgKiBiWSAtIGFaICogYlo7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBkaXZRdWF0KGRlc3QsIHEpIHtcbiAgICB2YXIgYVggPSBkZXN0WzBdLFxuICAgICAgICBhWSA9IGRlc3RbMV0sXG4gICAgICAgIGFaID0gZGVzdFsyXSxcbiAgICAgICAgYVcgPSBkZXN0WzNdLFxuICAgICAgICBiWCA9IHFbMF0sXG4gICAgICAgIGJZID0gcVsxXSxcbiAgICAgICAgYlogPSBxWzJdLFxuICAgICAgICBiVyA9IHFbM107XG5cbiAgICB2YXIgZCA9IDEgLyAoYlcgKiBiVyArIGJYICogYlggKyBiWSAqIGJZICsgYlogKiBiWik7XG5cbiAgICByZXR1cm4gbmV3IFF1YXQoKGFYICogYlcgLSBhVyAqIGJYIC0gYVkgKiBiWiArIGFaICogYlkpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFYICogYlogLSBhVyAqIGJZICsgYVkgKiBiVyAtIGFaICogYlgpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFZICogYlggKyBhWiAqIGJXIC0gYVcgKiBiWiAtIGFYICogYlkpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFXICogYlcgKyBhWCAqIGJYICsgYVkgKiBiWSArIGFaICogYlopICogZCk7XG4gIH0sXG5cbiAgJGRpdlF1YXQoZGVzdCwgcSkge1xuICAgIHZhciBhWCA9IGRlc3RbMF0sXG4gICAgICAgIGFZID0gZGVzdFsxXSxcbiAgICAgICAgYVogPSBkZXN0WzJdLFxuICAgICAgICBhVyA9IGRlc3RbM10sXG4gICAgICAgIGJYID0gcVswXSxcbiAgICAgICAgYlkgPSBxWzFdLFxuICAgICAgICBiWiA9IHFbMl0sXG4gICAgICAgIGJXID0gcVszXTtcblxuICAgIHZhciBkID0gMSAvIChiVyAqIGJXICsgYlggKiBiWCArIGJZICogYlkgKyBiWiAqIGJaKTtcblxuICAgIGRlc3RbMF0gPSAoYVggKiBiVyAtIGFXICogYlggLSBhWSAqIGJaICsgYVogKiBiWSkgKiBkO1xuICAgIGRlc3RbMV0gPSAoYVggKiBiWiAtIGFXICogYlkgKyBhWSAqIGJXIC0gYVogKiBiWCkgKiBkO1xuICAgIGRlc3RbMl0gPSAoYVkgKiBiWCArIGFaICogYlcgLSBhVyAqIGJaIC0gYVggKiBiWSkgKiBkO1xuICAgIGRlc3RbM10gPSAoYVcgKiBiVyArIGFYICogYlggKyBhWSAqIGJZICsgYVogKiBiWikgKiBkO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgaW52ZXJ0KGRlc3QpIHtcbiAgICB2YXIgcTAgPSBkZXN0WzBdLFxuICAgICAgICBxMSA9IGRlc3RbMV0sXG4gICAgICAgIHEyID0gZGVzdFsyXSxcbiAgICAgICAgcTMgPSBkZXN0WzNdO1xuXG4gICAgdmFyIGQgPSAxIC8gKHEwICogcTAgKyBxMSAqIHExICsgcTIgKiBxMiArIHEzICogcTMpO1xuXG4gICAgcmV0dXJuIG5ldyBRdWF0KC1xMCAqIGQsIC1xMSAqIGQsIC1xMiAqIGQsIHEzICogZCk7XG4gIH0sXG5cbiAgJGludmVydChkZXN0KSB7XG4gICAgdmFyIHEwID0gZGVzdFswXSxcbiAgICAgICAgcTEgPSBkZXN0WzFdLFxuICAgICAgICBxMiA9IGRlc3RbMl0sXG4gICAgICAgIHEzID0gZGVzdFszXTtcblxuICAgIHZhciBkID0gMSAvIChxMCAqIHEwICsgcTEgKiBxMSArIHEyICogcTIgKyBxMyAqIHEzKTtcblxuICAgIGRlc3RbMF0gPSAtcTAgKiBkO1xuICAgIGRlc3RbMV0gPSAtcTEgKiBkO1xuICAgIGRlc3RbMl0gPSAtcTIgKiBkO1xuICAgIGRlc3RbM10gPSBxMyAqIGQ7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBub3JtKGRlc3QpIHtcbiAgICB2YXIgYSA9IGRlc3RbMF0sXG4gICAgICAgIGIgPSBkZXN0WzFdLFxuICAgICAgICBjID0gZGVzdFsyXSxcbiAgICAgICAgZCA9IGRlc3RbM107XG5cbiAgICByZXR1cm4gc3FydChhICogYSArIGIgKiBiICsgYyAqIGMgKyBkICogZCk7XG4gIH0sXG5cbiAgbm9ybVNxKGRlc3QpIHtcbiAgICB2YXIgYSA9IGRlc3RbMF0sXG4gICAgICAgIGIgPSBkZXN0WzFdLFxuICAgICAgICBjID0gZGVzdFsyXSxcbiAgICAgICAgZCA9IGRlc3RbM107XG5cbiAgICByZXR1cm4gYSAqIGEgKyBiICogYiArIGMgKiBjICsgZCAqIGQ7XG4gIH0sXG5cbiAgdW5pdChkZXN0KSB7XG4gICAgcmV0dXJuIFF1YXQuc2NhbGUoZGVzdCwgMSAvIFF1YXQubm9ybShkZXN0KSk7XG4gIH0sXG5cbiAgJHVuaXQoZGVzdCkge1xuICAgIHJldHVybiBRdWF0LiRzY2FsZShkZXN0LCAxIC8gUXVhdC5ub3JtKGRlc3QpKTtcbiAgfSxcblxuICBjb25qdWdhdGUoZGVzdCkge1xuICAgIHJldHVybiBuZXcgUXVhdCgtZGVzdFswXSwgLWRlc3RbMV0sIC1kZXN0WzJdLCBkZXN0WzNdKTtcbiAgfSxcblxuICAkY29uanVnYXRlKGRlc3QpIHtcbiAgICBkZXN0WzBdID0gLWRlc3RbMF07XG4gICAgZGVzdFsxXSA9IC1kZXN0WzFdO1xuICAgIGRlc3RbMl0gPSAtZGVzdFsyXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfVxufTtcblxuLy8gYWRkIGdlbmVyaWNzIGFuZCBpbnN0YW5jZSBtZXRob2RzXG5cbnByb3RvID0gUXVhdC5wcm90b3R5cGUgPSB7fTtcblxuZm9yIChtZXRob2QgaW4gZ2VuZXJpY3MpIHtcbiAgUXVhdFttZXRob2RdID0gZ2VuZXJpY3NbbWV0aG9kXTtcbiAgcHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiAobSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgICByZXR1cm4gUXVhdFttXS5hcHBseShRdWF0LCBhcmdzKTtcbiAgICB9O1xuIH0pKG1ldGhvZCk7XG59XG5cbi8vIEFkZCBzdGF0aWMgbWV0aG9kc1xuVmVjMy5mcm9tUXVhdCA9IGZ1bmN0aW9uKHEpIHtcbiAgcmV0dXJuIG5ldyBWZWMzKHFbMF0sIHFbMV0sIHFbMl0pO1xufTtcblxuTWF0NC5mcm9tUXVhdCA9IGZ1bmN0aW9uKHEpIHtcbiAgdmFyIGEgPSBxWzNdLFxuICAgICAgYiA9IHFbMF0sXG4gICAgICBjID0gcVsxXSxcbiAgICAgIGQgPSBxWzJdO1xuXG4gIHJldHVybiBuZXcgTWF0NChcbiAgICBhICogYSArIGIgKiBiIC0gYyAqIGMgLSBkICogZCxcbiAgICAyICogYiAqIGMgLSAyICogYSAqIGQsXG4gICAgMiAqIGIgKiBkICsgMiAqIGEgKiBjLFxuICAgIDAsXG5cbiAgICAyICogYiAqIGMgKyAyICogYSAqIGQsXG4gICAgYSAqIGEgLSBiICogYiArIGMgKiBjIC0gZCAqIGQsXG4gICAgMiAqIGMgKiBkIC0gMiAqIGEgKiBiLFxuICAgIDAsXG5cbiAgICAyICogYiAqIGQgLSAyICogYSAqIGMsXG4gICAgMiAqIGMgKiBkICsgMiAqIGEgKiBiLFxuICAgIGEgKiBhIC0gYiAqIGIgLSBjICogYyArIGQgKiBkLFxuICAgIDAsXG5cbiAgICAwLCAwLCAwLCAxKTtcbn07XG4iXX0=