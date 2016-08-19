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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRoL2FycmF5LWltcGwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxJQUFNLE9BQU8sS0FBSyxJQUFsQjtBQUNBLElBQU0sTUFBTSxLQUFLLEdBQWpCO0FBQ0EsSUFBTSxNQUFNLEtBQUssR0FBakI7QUFDQSxJQUFNLE1BQU0sS0FBSyxHQUFqQjtBQUNBLElBQU0sS0FBSyxLQUFLLEVBQWhCO0FBQ0EsSUFBTSxRQUFRLE1BQU0sU0FBTixDQUFnQixLQUE5Qjs7OztJQUdhLEksV0FBQSxJOzs7QUFFWCxrQkFBaUM7QUFBQSxRQUFyQixDQUFxQix5REFBakIsQ0FBaUI7QUFBQSxRQUFkLENBQWMseURBQVYsQ0FBVTtBQUFBLFFBQVAsQ0FBTyx5REFBSCxDQUFHOztBQUFBOztBQUFBLHdGQUN6QixDQUR5Qjs7QUFFL0IsVUFBSyxDQUFMLElBQVUsQ0FBVjtBQUNBLFVBQUssQ0FBTCxJQUFVLENBQVY7QUFDQSxVQUFLLENBQUwsSUFBVSxDQUFWO0FBSitCO0FBS2hDOzs7Ozs7O3dCQU9PO0FBQ04sYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUNELEs7c0JBRUssSyxFQUFPO0FBQ1gsYUFBUSxLQUFLLENBQUwsSUFBVSxLQUFsQjtBQUNEOzs7d0JBRU87QUFDTixhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQ0QsSztzQkFFSyxLLEVBQU87QUFDWCxhQUFRLEtBQUssQ0FBTCxJQUFVLEtBQWxCO0FBQ0Q7Ozt3QkFFTztBQUNOLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFDRCxLO3NCQUVLLEssRUFBTztBQUNYLGFBQVEsS0FBSyxDQUFMLElBQVUsS0FBbEI7QUFDRDs7OzZCQTFCZTtBQUNkLGFBQU8sSUFBSSxJQUFKLENBQVMsQ0FBVCxDQUFQO0FBQ0Q7Ozs7cUJBWnVCLEs7O0FBdUMxQixJQUFJLFdBQVc7QUFFYixTQUZhLG1CQUVMLElBRkssRUFFQyxHQUZELEVBRU07QUFDakIsU0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUFWO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FQWTtBQVNiLEtBVGEsZUFTVCxJQVRTLEVBU0gsQ0FURyxFQVNBLENBVEEsRUFTRyxDQVRILEVBU007QUFDakIsU0FBSyxDQUFMLElBQVUsQ0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLENBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFWO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FkWTtBQWdCYixLQWhCYSxlQWdCVCxJQWhCUyxFQWdCSCxHQWhCRyxFQWdCRTtBQUNiLFdBQU8sSUFBSSxJQUFKLENBQVMsS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBQW5CLEVBQ1MsS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBRG5CLEVBRVMsS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBRm5CLENBQVA7QUFHRCxHQXBCWTtBQXNCYixNQXRCYSxnQkFzQlIsSUF0QlEsRUFzQkYsR0F0QkUsRUFzQkc7QUFDZCxTQUFLLENBQUwsS0FBVyxJQUFJLENBQUosQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLElBQUksQ0FBSixDQUFYO0FBQ0EsU0FBSyxDQUFMLEtBQVcsSUFBSSxDQUFKLENBQVg7QUFDQSxXQUFPLElBQVA7QUFDRCxHQTNCWTtBQTZCYixNQTdCYSxnQkE2QlIsSUE3QlEsRUE2QkYsQ0E3QkUsRUE2QkMsQ0E3QkQsRUE2Qkk7QUFDZixTQUFLLENBQUwsSUFBVSxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBakI7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBakI7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBakI7QUFDQSxXQUFPLElBQVA7QUFDRCxHQWxDWTtBQW9DYixLQXBDYSxlQW9DVCxJQXBDUyxFQW9DSCxHQXBDRyxFQW9DRTtBQUNiLFdBQU8sSUFBSSxJQUFKLENBQVMsS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBQW5CLEVBQ1MsS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBRG5CLEVBRVMsS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBRm5CLENBQVA7QUFHRCxHQXhDWTtBQTBDYixNQTFDYSxnQkEwQ1IsSUExQ1EsRUEwQ0YsR0ExQ0UsRUEwQ0c7QUFDZCxTQUFLLENBQUwsS0FBVyxJQUFJLENBQUosQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLElBQUksQ0FBSixDQUFYO0FBQ0EsU0FBSyxDQUFMLEtBQVcsSUFBSSxDQUFKLENBQVg7QUFDQSxXQUFPLElBQVA7QUFDRCxHQS9DWTtBQWlEYixNQWpEYSxnQkFpRFIsSUFqRFEsRUFpREYsQ0FqREUsRUFpREMsQ0FqREQsRUFpREk7QUFDZixTQUFLLENBQUwsSUFBVSxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBakI7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBakI7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBakI7QUFDQSxXQUFPLElBQVA7QUFDRCxHQXREWTtBQXdEYixPQXhEYSxpQkF3RFAsSUF4RE8sRUF3REQsQ0F4REMsRUF3REU7QUFDYixXQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxJQUFVLENBQW5CLEVBQ1MsS0FBSyxDQUFMLElBQVUsQ0FEbkIsRUFFUyxLQUFLLENBQUwsSUFBVSxDQUZuQixDQUFQO0FBR0QsR0E1RFk7QUE4RGIsUUE5RGEsa0JBOEROLElBOURNLEVBOERBLENBOURBLEVBOERHO0FBQ2QsU0FBSyxDQUFMLEtBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxLQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsS0FBVyxDQUFYO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FuRVk7QUFxRWIsS0FyRWEsZUFxRVQsSUFyRVMsRUFxRUg7QUFDUixXQUFPLElBQUksSUFBSixDQUFTLENBQUMsS0FBSyxDQUFMLENBQVYsRUFDUyxDQUFDLEtBQUssQ0FBTCxDQURWLEVBRVMsQ0FBQyxLQUFLLENBQUwsQ0FGVixDQUFQO0FBR0QsR0F6RVk7QUEyRWIsTUEzRWEsZ0JBMkVSLElBM0VRLEVBMkVGO0FBQ1QsU0FBSyxDQUFMLElBQVUsQ0FBQyxLQUFLLENBQUwsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFVLENBQUMsS0FBSyxDQUFMLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVSxDQUFDLEtBQUssQ0FBTCxDQUFYO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FoRlk7QUFrRmIsTUFsRmEsZ0JBa0ZSLElBbEZRLEVBa0ZGO0FBQ1QsUUFBSSxNQUFNLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBVjs7QUFFQSxRQUFJLE1BQU0sQ0FBVixFQUFhO0FBQ1gsYUFBTyxLQUFLLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQUksR0FBckIsQ0FBUDtBQUNEO0FBQ0QsV0FBTyxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQVA7QUFDRCxHQXpGWTtBQTJGYixPQTNGYSxpQkEyRlAsSUEzRk8sRUEyRkQ7QUFDVixRQUFJLE1BQU0sS0FBSyxJQUFMLENBQVUsSUFBVixDQUFWOztBQUVBLFFBQUksTUFBTSxDQUFWLEVBQWE7QUFDWCxhQUFPLEtBQUssTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBSSxHQUF0QixDQUFQO0FBQ0Q7QUFDRCxXQUFPLElBQVA7QUFDRCxHQWxHWTtBQW9HYixPQXBHYSxpQkFvR1AsSUFwR08sRUFvR0QsR0FwR0MsRUFvR0k7QUFDZixRQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7QUFBQSxRQUNFLEtBQUssS0FBSyxDQUFMLENBRFA7QUFBQSxRQUVFLEtBQUssS0FBSyxDQUFMLENBRlA7QUFBQSxRQUdFLEtBQUssSUFBSSxDQUFKLENBSFA7QUFBQSxRQUlFLEtBQUssSUFBSSxDQUFKLENBSlA7QUFBQSxRQUtFLEtBQUssSUFBSSxDQUFKLENBTFA7O0FBT0EsV0FBTyxJQUFJLElBQUosQ0FBUyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQXhCLEVBQ1MsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUR4QixFQUVTLEtBQUssRUFBTCxHQUFVLEtBQUssRUFGeEIsQ0FBUDtBQUdELEdBL0dZO0FBaUhiLFFBakhhLGtCQWlITixJQWpITSxFQWlIQSxHQWpIQSxFQWlISztBQUNoQixRQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7QUFBQSxRQUNJLEtBQUssS0FBSyxDQUFMLENBRFQ7QUFBQSxRQUVJLEtBQUssS0FBSyxDQUFMLENBRlQ7QUFBQSxRQUdJLEtBQUssSUFBSSxDQUFKLENBSFQ7QUFBQSxRQUlJLEtBQUssSUFBSSxDQUFKLENBSlQ7QUFBQSxRQUtJLEtBQUssSUFBSSxDQUFKLENBTFQ7O0FBT0EsU0FBSyxDQUFMLElBQVUsS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUF6QjtBQUNBLFNBQUssQ0FBTCxJQUFVLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBekI7QUFDQSxTQUFLLENBQUwsSUFBVSxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQXpCO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0E3SFk7QUErSGIsUUEvSGEsa0JBK0hOLElBL0hNLEVBK0hBLEdBL0hBLEVBK0hLO0FBQ2hCLFFBQUksS0FBSyxLQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBbkI7QUFBQSxRQUNJLEtBQUssS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBRG5CO0FBQUEsUUFFSSxLQUFLLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUZuQjs7QUFJQSxXQUFPLEtBQUssS0FBSyxFQUFMLEdBQ0EsS0FBSyxFQURMLEdBRUEsS0FBSyxFQUZWLENBQVA7QUFHRCxHQXZJWTtBQXlJYixVQXpJYSxvQkF5SUosSUF6SUksRUF5SUUsR0F6SUYsRUF5SU87QUFDbEIsUUFBSSxLQUFLLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUFuQjtBQUFBLFFBQ0ksS0FBSyxLQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FEbkI7QUFBQSxRQUVJLEtBQUssS0FBSyxDQUFMLElBQVUsSUFBSSxDQUFKLENBRm5COztBQUlBLFdBQU8sS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmLEdBQW9CLEtBQUssRUFBaEM7QUFDRCxHQS9JWTtBQWlKYixNQWpKYSxnQkFpSlIsSUFqSlEsRUFpSkY7QUFDVCxRQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7QUFBQSxRQUFrQixLQUFLLEtBQUssQ0FBTCxDQUF2QjtBQUFBLFFBQWdDLEtBQUssS0FBSyxDQUFMLENBQXJDOztBQUVBLFdBQU8sS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBQWYsR0FBb0IsS0FBSyxFQUE5QixDQUFQO0FBQ0QsR0FySlk7QUF1SmIsUUF2SmEsa0JBdUpOLElBdkpNLEVBdUpBO0FBQ1gsUUFBSSxLQUFLLEtBQUssQ0FBTCxDQUFUO0FBQUEsUUFBa0IsS0FBSyxLQUFLLENBQUwsQ0FBdkI7QUFBQSxRQUFnQyxLQUFLLEtBQUssQ0FBTCxDQUFyQzs7QUFFQSxXQUFPLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBZixHQUFvQixLQUFLLEVBQWhDO0FBQ0QsR0EzSlk7QUE2SmIsS0E3SmEsZUE2SlQsSUE3SlMsRUE2SkgsR0E3SkcsRUE2SkU7QUFDYixXQUFPLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUFWLEdBQW1CLEtBQUssQ0FBTCxJQUFVLElBQUksQ0FBSixDQUE3QixHQUFzQyxLQUFLLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBdkQ7QUFDRCxHQS9KWTtBQWlLYixPQWpLYSxpQkFpS1AsSUFqS08sRUFpS0Q7QUFDVixRQUFJLGdCQUFnQixJQUFwQixFQUEwQjtBQUN4QixhQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxDQUFULEVBQWtCLEtBQUssQ0FBTCxDQUFsQixFQUEyQixLQUFLLENBQUwsQ0FBM0IsQ0FBUDtBQUNEO0FBQ0QsV0FBTyxLQUFLLE9BQUwsQ0FBYSxJQUFJLFlBQUosQ0FBaUIsQ0FBakIsQ0FBYixFQUFrQyxJQUFsQyxDQUFQO0FBQ0QsR0F0S1k7QUF3S2IsZ0JBeEthLDBCQXdLRSxJQXhLRixFQXdLUTtBQUNuQixRQUFJLE1BQU0sS0FBSyxjQUFmOztBQUVBLFFBQUksQ0FBQyxHQUFMLEVBQVU7QUFDUixhQUFPLElBQVA7QUFDRDs7QUFFRCxRQUFJLENBQUosSUFBUyxLQUFLLENBQUwsQ0FBVDtBQUNBLFFBQUksQ0FBSixJQUFTLEtBQUssQ0FBTCxDQUFUO0FBQ0EsUUFBSSxDQUFKLElBQVMsS0FBSyxDQUFMLENBQVQ7O0FBRUEsV0FBTyxHQUFQO0FBQ0Q7QUFwTFksQ0FBZjs7O0FBd0xBLElBQUksUUFBUSxLQUFLLFNBQWpCO0FBQ0EsS0FBSyxJQUFJLE1BQVQsSUFBbUIsUUFBbkIsRUFBNkI7QUFDM0IsT0FBSyxNQUFMLElBQWUsU0FBUyxNQUFULENBQWY7QUFDQSxRQUFNLE1BQU4sSUFBaUIsU0FBUyxDQUFULENBQVcsQ0FBWCxFQUFjO0FBQzdCLFdBQU8sWUFBVztBQUNoQixVQUFJLE9BQU8sTUFBTSxJQUFOLENBQVcsU0FBWCxDQUFYO0FBQ0EsV0FBSyxPQUFMLENBQWEsSUFBYjtBQUNBLGFBQU8sS0FBSyxDQUFMLEVBQVEsS0FBUixDQUFjLElBQWQsRUFBb0IsSUFBcEIsQ0FBUDtBQUNELEtBSkQ7QUFLRixHQU5pQixDQU1oQixNQU5nQixDQUFqQjtBQU9EOzs7O0lBR1ksSSxXQUFBLEk7OztBQUVYLGdCQUFZLEdBQVosRUFBaUIsR0FBakIsRUFBc0IsR0FBdEIsRUFBMkIsR0FBM0IsRUFDWSxHQURaLEVBQ2lCLEdBRGpCLEVBQ3NCLEdBRHRCLEVBQzJCLEdBRDNCLEVBRVksR0FGWixFQUVpQixHQUZqQixFQUVzQixHQUZ0QixFQUUyQixHQUYzQixFQUdZLEdBSFosRUFHaUIsR0FIakIsRUFHc0IsR0FIdEIsRUFHMkIsR0FIM0IsRUFHZ0M7QUFBQTs7QUFBQSx5RkFFeEIsRUFGd0I7O0FBSTlCLFdBQUssTUFBTCxHQUFjLEVBQWQ7O0FBRUEsUUFBSSxPQUFPLEdBQVAsS0FBZSxRQUFuQixFQUE2Qjs7QUFFM0IsYUFBSyxHQUFMLENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0IsR0FBeEIsRUFDUyxHQURULEVBQ2MsR0FEZCxFQUNtQixHQURuQixFQUN3QixHQUR4QixFQUVTLEdBRlQsRUFFYyxHQUZkLEVBRW1CLEdBRm5CLEVBRXdCLEdBRnhCLEVBR1MsR0FIVCxFQUdjLEdBSGQsRUFHbUIsR0FIbkIsRUFHd0IsR0FIeEI7QUFLRCxLQVBELE1BT087QUFDTCxhQUFLLEVBQUw7QUFDRDs7QUFFRCxXQUFLLGNBQUwsR0FBc0IsSUFBSSxZQUFKLENBQWlCLEVBQWpCLENBQXRCO0FBakI4QjtBQWtCL0I7Ozs7d0JBTVM7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFBaUIsSztzQkFpQnJCLEcsRUFBSztBQUFFLFdBQUssQ0FBTCxJQUFVLEdBQVY7QUFBZ0I7Ozt3QkFoQnJCO0FBQUUsYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUFpQixLO3NCQWlCckIsRyxFQUFLO0FBQUUsV0FBSyxDQUFMLElBQVUsR0FBVjtBQUFnQjs7O3dCQWhCckI7QUFBRSxhQUFPLEtBQUssRUFBTCxDQUFQO0FBQWtCLEs7c0JBaUJ0QixHLEVBQUs7QUFBRSxXQUFLLEVBQUwsSUFBVyxHQUFYO0FBQWlCOzs7d0JBaEJ0QjtBQUFFLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFBaUIsSztzQkFpQnJCLEcsRUFBSztBQUFFLFdBQUssQ0FBTCxJQUFVLEdBQVY7QUFBZ0I7Ozt3QkFoQnJCO0FBQUUsYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUFpQixLO3NCQWlCckIsRyxFQUFLO0FBQUUsV0FBSyxDQUFMLElBQVUsR0FBVjtBQUFnQjs7O3dCQWhCckI7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxFQUFMLENBQVA7QUFBa0IsSztzQkFpQnRCLEcsRUFBSztBQUFFLFdBQUssRUFBTCxJQUFXLEdBQVg7QUFBaUI7Ozt3QkFoQnRCO0FBQUUsYUFBTyxLQUFLLENBQUwsQ0FBUDtBQUFpQixLO3NCQWlCckIsRyxFQUFLO0FBQUUsV0FBSyxDQUFMLElBQVUsR0FBVjtBQUFnQjs7O3dCQWhCckI7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxFQUFMLENBQVA7QUFBa0IsSztzQkFpQnRCLEcsRUFBSztBQUFFLFdBQUssRUFBTCxJQUFXLEdBQVg7QUFBaUI7Ozt3QkFoQnRCO0FBQUUsYUFBTyxLQUFLLEVBQUwsQ0FBUDtBQUFrQixLO3NCQWlCdEIsRyxFQUFLO0FBQUUsV0FBSyxFQUFMLElBQVcsR0FBWDtBQUFpQjs7O3dCQWhCdEI7QUFBRSxhQUFPLEtBQUssQ0FBTCxDQUFQO0FBQWlCLEs7c0JBaUJyQixHLEVBQUs7QUFBRSxXQUFLLENBQUwsSUFBVSxHQUFWO0FBQWdCOzs7d0JBaEJyQjtBQUFFLGFBQU8sS0FBSyxDQUFMLENBQVA7QUFBaUIsSztzQkFpQnJCLEcsRUFBSztBQUFFLFdBQUssQ0FBTCxJQUFVLEdBQVY7QUFBZ0I7Ozt3QkFoQnJCO0FBQUUsYUFBTyxLQUFLLEVBQUwsQ0FBUDtBQUFrQixLO3NCQWlCdEIsRyxFQUFLO0FBQUUsV0FBSyxFQUFMLElBQVcsR0FBWDtBQUFpQjs7O3dCQWhCdEI7QUFBRSxhQUFPLEtBQUssRUFBTCxDQUFQO0FBQWtCLEs7c0JBaUJ0QixHLEVBQUs7QUFBRSxXQUFLLEVBQUwsSUFBVyxHQUFYO0FBQWlCOzs7NkJBcENoQjtBQUNkLGFBQU8sSUFBSSxLQUFKLENBQVUsRUFBVixDQUFQO0FBQ0Q7Ozs7c0JBM0J1QixLOztBQWlFMUIsV0FBVztBQUVULElBRlMsY0FFTixJQUZNLEVBRUE7O0FBRVAsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLENBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLENBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsQ0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLENBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxDQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsQ0FBWDs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXRCUTtBQXdCVCxPQXhCUyxpQkF3QkgsSUF4QkcsRUF3Qkc7QUFDVixRQUFJLGdCQUFnQixJQUFwQixFQUEwQjtBQUN4QixhQUFPLElBQUksSUFBSixDQUFTLEtBQUssQ0FBTCxDQUFULEVBQWtCLEtBQUssQ0FBTCxDQUFsQixFQUEyQixLQUFLLENBQUwsQ0FBM0IsRUFBb0MsS0FBSyxFQUFMLENBQXBDLEVBQ1MsS0FBSyxDQUFMLENBRFQsRUFDa0IsS0FBSyxDQUFMLENBRGxCLEVBQzJCLEtBQUssQ0FBTCxDQUQzQixFQUNvQyxLQUFLLEVBQUwsQ0FEcEMsRUFFUyxLQUFLLENBQUwsQ0FGVCxFQUVrQixLQUFLLENBQUwsQ0FGbEIsRUFFMkIsS0FBSyxFQUFMLENBRjNCLEVBRXFDLEtBQUssRUFBTCxDQUZyQyxFQUdTLEtBQUssQ0FBTCxDQUhULEVBR2tCLEtBQUssQ0FBTCxDQUhsQixFQUcyQixLQUFLLEVBQUwsQ0FIM0IsRUFHcUMsS0FBSyxFQUFMLENBSHJDLENBQVA7QUFJRDtBQUNELFdBQU8sSUFBSSxVQUFKLENBQWUsSUFBZixDQUFQO0FBQ0QsR0FoQ1E7QUFrQ1QsS0FsQ1MsZUFrQ0wsSUFsQ0ssRUFrQ0MsR0FsQ0QsRUFrQ00sR0FsQ04sRUFrQ1csR0FsQ1gsRUFrQ2dCLEdBbENoQixFQW1DQyxHQW5DRCxFQW1DTSxHQW5DTixFQW1DVyxHQW5DWCxFQW1DZ0IsR0FuQ2hCLEVBb0NDLEdBcENELEVBb0NNLEdBcENOLEVBb0NXLEdBcENYLEVBb0NnQixHQXBDaEIsRUFxQ0MsR0FyQ0QsRUFxQ00sR0FyQ04sRUFxQ1csR0FyQ1gsRUFxQ2dCLEdBckNoQixFQXFDcUI7O0FBRTVCLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxDQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssQ0FBTCxJQUFXLEdBQVg7QUFDQSxTQUFLLENBQUwsSUFBVyxHQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLEdBQVg7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0F6RFE7QUEyRFQsU0EzRFMsbUJBMkRELElBM0RDLEVBMkRLLEdBM0RMLEVBMkRVO0FBQ2pCLFFBQUksTUFBTSxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQVY7QUFDQSxXQUFPLEtBQUssUUFBTCxDQUFjLElBQWQsRUFBb0IsR0FBcEIsQ0FBUDtBQUNELEdBOURRO0FBZ0VULFVBaEVTLG9CQWdFQSxJQWhFQSxFQWdFTSxHQWhFTixFQWdFVztBQUNsQixRQUFJLEtBQUssSUFBSSxDQUFKLENBQVQ7QUFBQSxRQUNJLEtBQUssSUFBSSxDQUFKLENBRFQ7QUFBQSxRQUVJLEtBQUssSUFBSSxDQUFKLENBRlQ7QUFBQSxRQUdJLElBQUksS0FBSyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxFQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQW5ELENBSFI7O0FBS0EsUUFBSSxDQUFKLElBQVMsQ0FBQyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxDQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQS9DLElBQTJELENBQXBFO0FBQ0EsUUFBSSxDQUFKLElBQVMsQ0FBQyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxDQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQS9DLElBQTJELENBQXBFO0FBQ0EsUUFBSSxDQUFKLElBQVMsQ0FBQyxLQUFLLENBQUwsSUFBVSxFQUFWLEdBQWUsS0FBSyxDQUFMLElBQVUsRUFBekIsR0FBOEIsS0FBSyxFQUFMLElBQVcsRUFBekMsR0FBOEMsS0FBSyxFQUFMLENBQS9DLElBQTJELENBQXBFOztBQUVBLFdBQU8sR0FBUDtBQUNELEdBM0VRO0FBNkVULFVBN0VTLG9CQTZFQSxJQTdFQSxFQTZFTSxDQTdFTixFQTZFUyxDQTdFVCxFQTZFWTtBQUNuQixRQUFJLE1BQU0sRUFBRSxDQUFGLENBQVY7QUFBQSxRQUFpQixNQUFNLEVBQUUsQ0FBRixDQUF2QjtBQUFBLFFBQThCLE1BQU0sRUFBRSxDQUFGLENBQXBDO0FBQUEsUUFBMkMsTUFBTSxFQUFFLENBQUYsQ0FBakQ7QUFBQSxRQUNJLE1BQU0sRUFBRSxDQUFGLENBRFY7QUFBQSxRQUNpQixNQUFNLEVBQUUsQ0FBRixDQUR2QjtBQUFBLFFBQzhCLE1BQU0sRUFBRSxDQUFGLENBRHBDO0FBQUEsUUFDMkMsTUFBTSxFQUFFLENBQUYsQ0FEakQ7QUFBQSxRQUVJLE1BQU0sRUFBRSxDQUFGLENBRlY7QUFBQSxRQUVpQixNQUFNLEVBQUUsQ0FBRixDQUZ2QjtBQUFBLFFBRThCLE1BQU0sRUFBRSxFQUFGLENBRnBDO0FBQUEsUUFFMkMsTUFBTSxFQUFFLEVBQUYsQ0FGakQ7QUFBQSxRQUdJLE1BQU0sRUFBRSxFQUFGLENBSFY7QUFBQSxRQUdpQixNQUFNLEVBQUUsRUFBRixDQUh2QjtBQUFBLFFBRzhCLE1BQU0sRUFBRSxFQUFGLENBSHBDO0FBQUEsUUFHMkMsTUFBTSxFQUFFLEVBQUYsQ0FIakQ7QUFBQSxRQUlJLE1BQU0sRUFBRSxDQUFGLENBSlY7QUFBQSxRQUlpQixNQUFNLEVBQUUsQ0FBRixDQUp2QjtBQUFBLFFBSThCLE1BQU0sRUFBRSxDQUFGLENBSnBDO0FBQUEsUUFJMkMsTUFBTSxFQUFFLENBQUYsQ0FKakQ7QUFBQSxRQUtJLE1BQU0sRUFBRSxDQUFGLENBTFY7QUFBQSxRQUtpQixNQUFNLEVBQUUsQ0FBRixDQUx2QjtBQUFBLFFBSzhCLE1BQU0sRUFBRSxDQUFGLENBTHBDO0FBQUEsUUFLMkMsTUFBTSxFQUFFLENBQUYsQ0FMakQ7QUFBQSxRQU1JLE1BQU0sRUFBRSxDQUFGLENBTlY7QUFBQSxRQU1pQixNQUFNLEVBQUUsQ0FBRixDQU52QjtBQUFBLFFBTThCLE1BQU0sRUFBRSxFQUFGLENBTnBDO0FBQUEsUUFNMkMsTUFBTSxFQUFFLEVBQUYsQ0FOakQ7QUFBQSxRQU9JLE1BQU0sRUFBRSxFQUFGLENBUFY7QUFBQSxRQU9pQixNQUFNLEVBQUUsRUFBRixDQVB2QjtBQUFBLFFBTzhCLE1BQU0sRUFBRSxFQUFGLENBUHBDO0FBQUEsUUFPMkMsTUFBTSxFQUFFLEVBQUYsQ0FQakQ7O0FBU0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7O0FBRUEsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxTQUFLLEVBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBOUIsR0FBb0MsTUFBTSxHQUFyRDtBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUE5QixHQUFvQyxNQUFNLEdBQXJEO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQTlCLEdBQW9DLE1BQU0sR0FBckQ7QUFDQSxXQUFPLElBQVA7QUFDRCxHQTNHUTtBQTZHVCxTQTdHUyxtQkE2R0QsQ0E3R0MsRUE2R0UsQ0E3R0YsRUE2R0s7QUFDWixRQUFJLElBQUksS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFSO0FBQ0EsV0FBTyxLQUFLLFFBQUwsQ0FBYyxDQUFkLEVBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQVA7QUFDRCxHQWhIUTtBQWtIVCxVQWxIUyxvQkFrSEEsQ0FsSEEsRUFrSEcsQ0FsSEgsRUFrSE07QUFDYixXQUFPLEtBQUssUUFBTCxDQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBUDtBQUNELEdBcEhRO0FBc0hULEtBdEhTLGVBc0hMLElBdEhLLEVBc0hDLENBdEhELEVBc0hJO0FBQ1gsUUFBSSxPQUFPLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBWDtBQUNBLFdBQU8sS0FBSyxJQUFMLENBQVUsSUFBVixFQUFnQixDQUFoQixDQUFQO0FBQ0QsR0F6SFE7QUEySFQsTUEzSFMsZ0JBMkhKLElBM0hJLEVBMkhFLENBM0hGLEVBMkhLO0FBQ1osU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxFQUFFLENBQUYsQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLEVBQUUsQ0FBRixDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxFQUFFLENBQUYsQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLEVBQUUsQ0FBRixDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxFQUFFLENBQUYsQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLEVBQUUsQ0FBRixDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksRUFBRSxDQUFGLENBQVo7QUFDQSxTQUFLLEVBQUwsS0FBWSxFQUFFLEVBQUYsQ0FBWjtBQUNBLFNBQUssRUFBTCxLQUFZLEVBQUUsRUFBRixDQUFaO0FBQ0EsU0FBSyxFQUFMLEtBQVksRUFBRSxFQUFGLENBQVo7QUFDQSxTQUFLLEVBQUwsS0FBWSxFQUFFLEVBQUYsQ0FBWjtBQUNBLFNBQUssRUFBTCxLQUFZLEVBQUUsRUFBRixDQUFaO0FBQ0EsU0FBSyxFQUFMLEtBQVksRUFBRSxFQUFGLENBQVo7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0E5SVE7QUFnSlQsV0FoSlMscUJBZ0pDLElBaEpELEVBZ0pPO0FBQ2QsUUFBSSxJQUFJLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBUjtBQUNBLFdBQU8sS0FBSyxVQUFMLENBQWdCLENBQWhCLENBQVA7QUFDRCxHQW5KUTtBQXFKVCxZQXJKUyxzQkFxSkUsSUFySkYsRUFxSlE7QUFDZixRQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7QUFBQSxRQUFrQixLQUFLLEtBQUssQ0FBTCxDQUF2QjtBQUFBLFFBQWdDLE1BQU0sS0FBSyxFQUFMLENBQXRDO0FBQUEsUUFDSSxLQUFLLEtBQUssQ0FBTCxDQURUO0FBQUEsUUFDa0IsS0FBSyxLQUFLLENBQUwsQ0FEdkI7QUFBQSxRQUNnQyxNQUFNLEtBQUssRUFBTCxDQUR0QztBQUFBLFFBRUksS0FBSyxLQUFLLENBQUwsQ0FGVDtBQUFBLFFBRWtCLEtBQUssS0FBSyxDQUFMLENBRnZCO0FBQUEsUUFFZ0MsTUFBTSxLQUFLLEVBQUwsQ0FGdEM7QUFBQSxRQUdJLEtBQUssS0FBSyxDQUFMLENBSFQ7QUFBQSxRQUdrQixLQUFLLEtBQUssQ0FBTCxDQUh2QjtBQUFBLFFBR2dDLE1BQU0sS0FBSyxFQUFMLENBSHRDOztBQUtBLFNBQUssQ0FBTCxJQUFVLEVBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsR0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLEVBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFWO0FBQ0EsU0FBSyxDQUFMLElBQVUsR0FBVjtBQUNBLFNBQUssQ0FBTCxJQUFVLEVBQVY7QUFDQSxTQUFLLENBQUwsSUFBVSxFQUFWO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDtBQUNBLFNBQUssRUFBTCxJQUFXLEVBQVg7QUFDQSxTQUFLLEVBQUwsSUFBVyxFQUFYO0FBQ0EsU0FBSyxFQUFMLElBQVcsR0FBWDs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXpLUTtBQTJLVCxZQTNLUyxzQkEyS0UsSUEzS0YsRUEyS1EsS0EzS1IsRUEyS2UsR0EzS2YsRUEyS29CO0FBQzNCLFFBQUksSUFBSSxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQVI7QUFDQSxXQUFPLEtBQUssV0FBTCxDQUFpQixDQUFqQixFQUFvQixLQUFwQixFQUEyQixHQUEzQixDQUFQO0FBQ0QsR0E5S1E7QUFnTFQsYUFoTFMsdUJBZ0xHLElBaExILEVBZ0xTLEtBaExULEVBZ0xnQixHQWhMaEIsRUFnTHFCO0FBQzVCLFFBQUksSUFBSSxJQUFJLEtBQUosQ0FBUjtBQUFBLFFBQ0ksSUFBSSxJQUFJLEtBQUosQ0FEUjtBQUFBLFFBRUksS0FBSyxJQUFJLENBRmI7QUFBQSxRQUdJLEtBQUssSUFBSSxDQUFKLENBSFQ7QUFBQSxRQUlJLEtBQUssSUFBSSxDQUFKLENBSlQ7QUFBQSxRQUtJLEtBQUssSUFBSSxDQUFKLENBTFQ7QUFBQSxRQU1JLE1BQU0sS0FBSyxFQUFMLEdBQVUsRUFBVixHQUFlLENBTnpCO0FBQUEsUUFPSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxLQUFLLENBUDlCO0FBQUEsUUFRSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxLQUFLLENBUjlCO0FBQUEsUUFTSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxLQUFLLENBVDlCO0FBQUEsUUFVSSxNQUFNLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxDQVZ6QjtBQUFBLFFBV0ksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsS0FBSyxDQVg5QjtBQUFBLFFBWUksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsS0FBSyxDQVo5QjtBQUFBLFFBYUksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsS0FBSyxDQWI5QjtBQUFBLFFBY0ksTUFBTSxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsQ0FkekI7QUFBQSxRQWVJLE1BQU0sS0FBSyxDQUFMLENBZlY7QUFBQSxRQWdCSSxNQUFNLEtBQUssQ0FBTCxDQWhCVjtBQUFBLFFBaUJJLE1BQU0sS0FBSyxDQUFMLENBakJWO0FBQUEsUUFrQkksTUFBTSxLQUFLLENBQUwsQ0FsQlY7QUFBQSxRQW1CSSxNQUFNLEtBQUssQ0FBTCxDQW5CVjtBQUFBLFFBb0JJLE1BQU0sS0FBSyxDQUFMLENBcEJWO0FBQUEsUUFxQkksTUFBTSxLQUFLLENBQUwsQ0FyQlY7QUFBQSxRQXNCSSxNQUFNLEtBQUssQ0FBTCxDQXRCVjtBQUFBLFFBdUJJLE1BQU0sS0FBSyxDQUFMLENBdkJWO0FBQUEsUUF3QkksTUFBTSxLQUFLLENBQUwsQ0F4QlY7QUFBQSxRQXlCSSxNQUFNLEtBQUssRUFBTCxDQXpCVjtBQUFBLFFBMEJJLE1BQU0sS0FBSyxFQUFMLENBMUJWO0FBQUEsUUEyQkksTUFBTSxLQUFLLEVBQUwsQ0EzQlY7QUFBQSxRQTRCSSxNQUFNLEtBQUssRUFBTCxDQTVCVjtBQUFBLFFBNkJJLE1BQU0sS0FBSyxFQUFMLENBN0JWO0FBQUEsUUE4QkksTUFBTSxLQUFLLEVBQUwsQ0E5QlY7O0FBZ0NBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6Qzs7QUFFQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxFQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDOztBQUVBLFdBQU8sSUFBUDtBQUNELEdBak9RO0FBbU9ULFdBbk9TLHFCQW1PQyxJQW5PRCxFQW1PTyxFQW5PUCxFQW1PVyxFQW5PWCxFQW1PZSxFQW5PZixFQW1PbUI7QUFDMUIsUUFBSSxNQUFNLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBVjtBQUNBLFdBQU8sS0FBSyxVQUFMLENBQWdCLEdBQWhCLEVBQXFCLEVBQXJCLEVBQXlCLEVBQXpCLEVBQTZCLEVBQTdCLENBQVA7QUFDRCxHQXRPUTtBQXdPVCxZQXhPUyxzQkF3T0UsSUF4T0YsRUF3T1EsRUF4T1IsRUF3T1ksRUF4T1osRUF3T2dCLEVBeE9oQixFQXdPb0I7QUFDM0IsUUFBSSxNQUFNLEtBQUssQ0FBTCxDQUFWO0FBQUEsUUFDSSxNQUFNLEtBQUssQ0FBTCxDQURWO0FBQUEsUUFFSSxNQUFNLEtBQUssQ0FBTCxDQUZWO0FBQUEsUUFHSSxNQUFNLEtBQUssQ0FBTCxDQUhWO0FBQUEsUUFJSSxNQUFNLEtBQUssQ0FBTCxDQUpWO0FBQUEsUUFLSSxNQUFNLEtBQUssQ0FBTCxDQUxWO0FBQUEsUUFNSSxNQUFNLEtBQUssQ0FBTCxDQU5WO0FBQUEsUUFPSSxNQUFNLEtBQUssQ0FBTCxDQVBWO0FBQUEsUUFRSSxNQUFNLEtBQUssQ0FBTCxDQVJWO0FBQUEsUUFTSSxNQUFNLEtBQUssQ0FBTCxDQVRWO0FBQUEsUUFVSSxNQUFNLEtBQUssRUFBTCxDQVZWO0FBQUEsUUFXSSxNQUFNLEtBQUssRUFBTCxDQVhWO0FBQUEsUUFZSSxNQUFNLElBQUksRUFBSixDQVpWO0FBQUEsUUFhSSxNQUFNLElBQUksRUFBSixDQWJWO0FBQUEsUUFjSSxNQUFNLElBQUksRUFBSixDQWRWO0FBQUEsUUFlSSxNQUFNLElBQUksRUFBSixDQWZWO0FBQUEsUUFnQkksTUFBTSxJQUFJLEVBQUosQ0FoQlY7QUFBQSxRQWlCSSxNQUFNLElBQUksRUFBSixDQWpCVjtBQUFBLFFBa0JJLE1BQU8sTUFBTSxHQWxCakI7QUFBQSxRQW1CSSxNQUFNLENBQUMsR0FBRCxHQUFPLEdBQVAsR0FBYSxNQUFNLEdBQU4sR0FBWSxHQW5CbkM7QUFBQSxRQW9CSSxNQUFPLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBTixHQUFZLEdBcEJuQztBQUFBLFFBcUJJLE1BQU8sTUFBTSxHQXJCakI7QUFBQSxRQXNCSSxNQUFPLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBTixHQUFZLEdBdEJuQztBQUFBLFFBdUJJLE1BQU0sQ0FBQyxHQUFELEdBQU8sR0FBUCxHQUFhLE1BQU0sR0FBTixHQUFZLEdBdkJuQztBQUFBLFFBd0JJLE1BQU0sQ0FBQyxHQXhCWDtBQUFBLFFBeUJJLE1BQU8sTUFBTSxHQXpCakI7QUFBQSxRQTBCSSxNQUFPLE1BQU0sR0ExQmpCOztBQTRCQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7QUFDQSxTQUFLLENBQUwsSUFBVyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQWxCLEdBQXdCLE1BQU0sR0FBekM7O0FBRUEsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDO0FBQ0EsU0FBSyxDQUFMLElBQVcsTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFsQixHQUF3QixNQUFNLEdBQXpDOztBQUVBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssQ0FBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6QztBQUNBLFNBQUssRUFBTCxJQUFXLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBbEIsR0FBd0IsTUFBTSxHQUF6Qzs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXJSUTtBQXVSVCxXQXZSUyxxQkF1UkMsSUF2UkQsRUF1Uk8sQ0F2UlAsRUF1UlUsQ0F2UlYsRUF1UmEsQ0F2UmIsRUF1UmdCO0FBQ3ZCLFFBQUksSUFBSSxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQVI7QUFDQSxXQUFPLEtBQUssVUFBTCxDQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixDQUFQO0FBQ0QsR0ExUlE7QUE0UlQsWUE1UlMsc0JBNFJFLElBNVJGLEVBNFJRLENBNVJSLEVBNFJXLENBNVJYLEVBNFJjLENBNVJkLEVBNFJpQjtBQUN4QixTQUFLLEVBQUwsSUFBVyxLQUFLLENBQUwsSUFBVyxDQUFYLEdBQWUsS0FBSyxDQUFMLElBQVcsQ0FBMUIsR0FBOEIsS0FBSyxDQUFMLElBQVcsQ0FBekMsR0FBNkMsS0FBSyxFQUFMLENBQXhEO0FBQ0EsU0FBSyxFQUFMLElBQVcsS0FBSyxDQUFMLElBQVcsQ0FBWCxHQUFlLEtBQUssQ0FBTCxJQUFXLENBQTFCLEdBQThCLEtBQUssQ0FBTCxJQUFXLENBQXpDLEdBQTZDLEtBQUssRUFBTCxDQUF4RDtBQUNBLFNBQUssRUFBTCxJQUFXLEtBQUssQ0FBTCxJQUFXLENBQVgsR0FBZSxLQUFLLENBQUwsSUFBVyxDQUExQixHQUE4QixLQUFLLEVBQUwsSUFBVyxDQUF6QyxHQUE2QyxLQUFLLEVBQUwsQ0FBeEQ7QUFDQSxTQUFLLEVBQUwsSUFBVyxLQUFLLENBQUwsSUFBVyxDQUFYLEdBQWUsS0FBSyxDQUFMLElBQVcsQ0FBMUIsR0FBOEIsS0FBSyxFQUFMLElBQVcsQ0FBekMsR0FBNkMsS0FBSyxFQUFMLENBQXhEOztBQUVBLFdBQU8sSUFBUDtBQUNELEdBblNRO0FBcVNULE9BclNTLGlCQXFTSCxJQXJTRyxFQXFTRyxDQXJTSCxFQXFTTSxDQXJTTixFQXFTUyxDQXJTVCxFQXFTWTtBQUNuQixRQUFJLElBQUksS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFSO0FBQ0EsV0FBTyxLQUFLLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixDQUFsQixFQUFxQixDQUFyQixDQUFQO0FBQ0QsR0F4U1E7QUEwU1QsUUExU1Msa0JBMFNGLElBMVNFLEVBMFNJLENBMVNKLEVBMFNPLENBMVNQLEVBMFNVLENBMVNWLEVBMFNhO0FBQ3BCLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLENBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxDQUFMLEtBQVksQ0FBWjtBQUNBLFNBQUssQ0FBTCxLQUFZLENBQVo7QUFDQSxTQUFLLEVBQUwsS0FBWSxDQUFaO0FBQ0EsU0FBSyxFQUFMLEtBQVksQ0FBWjs7QUFFQSxXQUFPLElBQVA7QUFDRCxHQXpUUTs7OztBQTRUVCxRQTVUUyxrQkE0VEYsSUE1VEUsRUE0VEk7QUFDWCxRQUFJLElBQUksS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFSO0FBQ0EsV0FBUSxLQUFLLE9BQUwsQ0FBYSxDQUFiLENBQVI7QUFDRCxHQS9UUTtBQWlVVCxTQWpVUyxtQkFpVUQsSUFqVUMsRUFpVUs7QUFDWixRQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7QUFBQSxRQUFtQixLQUFLLEtBQUssQ0FBTCxDQUF4QjtBQUFBLFFBQWtDLEtBQUssS0FBSyxDQUFMLENBQXZDO0FBQUEsUUFBaUQsS0FBSyxLQUFLLENBQUwsQ0FBdEQ7QUFBQSxRQUNJLEtBQUssS0FBSyxDQUFMLENBRFQ7QUFBQSxRQUNtQixLQUFLLEtBQUssQ0FBTCxDQUR4QjtBQUFBLFFBQ2tDLEtBQUssS0FBSyxDQUFMLENBRHZDO0FBQUEsUUFDaUQsS0FBSyxLQUFLLENBQUwsQ0FEdEQ7QUFBQSxRQUVJLEtBQUssS0FBSyxDQUFMLENBRlQ7QUFBQSxRQUVtQixLQUFLLEtBQUssQ0FBTCxDQUZ4QjtBQUFBLFFBRWlDLE1BQU0sS0FBSyxFQUFMLENBRnZDO0FBQUEsUUFFaUQsTUFBTSxLQUFLLEVBQUwsQ0FGdkQ7QUFBQSxRQUdJLE1BQU0sS0FBSyxFQUFMLENBSFY7QUFBQSxRQUdvQixNQUFNLEtBQUssRUFBTCxDQUgxQjtBQUFBLFFBR29DLE1BQU0sS0FBSyxFQUFMLENBSDFDO0FBQUEsUUFHb0QsTUFBTSxLQUFLLEVBQUwsQ0FIMUQ7O0FBS0EsUUFBSSxLQUFLLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBeEI7QUFBQSxRQUNJLEtBQUssS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUR4QjtBQUFBLFFBRUksS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBRnhCO0FBQUEsUUFHSSxLQUFLLEtBQUssRUFBTCxHQUFVLEtBQUssRUFIeEI7QUFBQSxRQUlJLEtBQUssS0FBSyxFQUFMLEdBQVUsS0FBSyxFQUp4QjtBQUFBLFFBS0ksS0FBSyxLQUFLLEVBQUwsR0FBVSxLQUFLLEVBTHhCO0FBQUEsUUFNSSxLQUFLLEtBQUssR0FBTCxHQUFXLEtBQUssR0FOekI7QUFBQSxRQU9JLEtBQUssS0FBSyxHQUFMLEdBQVcsTUFBTSxHQVAxQjtBQUFBLFFBUUksS0FBSyxLQUFLLEdBQUwsR0FBVyxNQUFNLEdBUjFCO0FBQUEsUUFTSSxLQUFLLEtBQUssR0FBTCxHQUFXLE1BQU0sR0FUMUI7QUFBQSxRQVVJLEtBQUssS0FBSyxHQUFMLEdBQVcsTUFBTSxHQVYxQjtBQUFBLFFBV0ksS0FBSyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBWDNCOztBQWFBLFFBQUksU0FBUyxLQUNWLEtBQUssRUFBTCxHQUFVLEtBQUssRUFBZixHQUFvQixLQUFLLEVBQXpCLEdBQThCLEtBQUssRUFBbkMsR0FBd0MsS0FBSyxFQUE3QyxHQUFrRCxLQUFLLEVBRDdDLENBQWI7O0FBR0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksS0FBSyxFQUFqQixHQUFzQixLQUFLLEVBQTVCLElBQWtDLE1BQTdDO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksS0FBSyxFQUFqQixHQUFzQixLQUFLLEVBQTVCLElBQWtDLE1BQTdDO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEdBQUYsR0FBUSxFQUFSLEdBQWEsTUFBTSxFQUFuQixHQUF3QixNQUFNLEVBQS9CLElBQXFDLE1BQWhEO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksTUFBTSxFQUFsQixHQUF1QixNQUFNLEVBQTlCLElBQW9DLE1BQS9DO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksS0FBSyxFQUFqQixHQUFzQixLQUFLLEVBQTVCLElBQWtDLE1BQTdDO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksS0FBSyxFQUFqQixHQUFzQixLQUFLLEVBQTVCLElBQWtDLE1BQTdDO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEdBQUYsR0FBUSxFQUFSLEdBQWEsTUFBTSxFQUFuQixHQUF3QixNQUFNLEVBQS9CLElBQXFDLE1BQWhEO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksTUFBTSxFQUFsQixHQUF1QixNQUFNLEVBQTlCLElBQW9DLE1BQS9DO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksS0FBSyxFQUFqQixHQUFzQixLQUFLLEVBQTVCLElBQWtDLE1BQTdDO0FBQ0EsU0FBSyxDQUFMLElBQVcsQ0FBQyxDQUFFLEVBQUYsR0FBTyxFQUFQLEdBQVksS0FBSyxFQUFqQixHQUFzQixLQUFLLEVBQTVCLElBQWtDLE1BQTdDO0FBQ0EsU0FBSyxFQUFMLElBQVcsQ0FBQyxDQUFFLEdBQUYsR0FBUSxFQUFSLEdBQWEsTUFBTSxFQUFuQixHQUF3QixNQUFNLEVBQS9CLElBQXFD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Q0FBUDtBQUNELENBRkQ7O0FBSUEsS0FBSyxRQUFMLEdBQWdCLFVBQVMsQ0FBVCxFQUFZO0FBQzFCLE1BQUksSUFBSSxFQUFFLENBQUYsQ0FBUjtBQUFBLE1BQ0ksSUFBSSxFQUFFLENBQUYsQ0FEUjtBQUFBLE1BRUksSUFBSSxFQUFFLENBQUYsQ0FGUjtBQUFBLE1BR0ksSUFBSSxFQUFFLENBQUYsQ0FIUjs7QUFLQSxTQUFPLElBQUksSUFBSixDQUNMLElBQUksQ0FBSixHQUFRLElBQUksQ0FBWixHQUFnQixJQUFJLENBQXBCLEdBQXdCLElBQUksQ0FEdkIsRUFFTCxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FGZixFQUdMLElBQUksQ0FBSixHQUFRLENBQVIsR0FBWSxJQUFJLENBQUosR0FBUSxDQUhmLEVBSUwsQ0FKSyxFQU1MLElBQUksQ0FBSixHQUFRLENBQVIsR0FBWSxJQUFJLENBQUosR0FBUSxDQU5mLEVBT0wsSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFaLEdBQWdCLElBQUksQ0FBcEIsR0FBd0IsSUFBSSxDQVB2QixFQVFMLElBQUksQ0FBSixHQUFRLENBQVIsR0FBWSxJQUFJLENBQUosR0FBUSxDQVJmLEVBU0wsQ0FUSyxFQVdMLElBQUksQ0FBSixHQUFRLENBQVIsR0FBWSxJQUFJLENBQUosR0FBUSxDQVhmLEVBWUwsSUFBSSxDQUFKLEdBQVEsQ0FBUixHQUFZLElBQUksQ0FBSixHQUFRLENBWmYsRUFhTCxJQUFJLENBQUosR0FBUSxJQUFJLENBQVosR0FBZ0IsSUFBSSxDQUFwQixHQUF3QixJQUFJLENBYnZCLEVBY0wsQ0FkSyxFQWdCTCxDQWhCSyxFQWdCRixDQWhCRSxFQWdCQyxDQWhCRCxFQWdCSSxDQWhCSixDQUFQO0FBaUJELENBdkJEIiwiZmlsZSI6ImFycmF5LWltcGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBWZWMzLCBNYXQ0IGFuZCBRdWF0IGNsYXNzZXNcbi8vIFRPRE8gLSBjbGVhbiB1cCBsaW50aW5nIGFuZCByZW1vdmUgc29tZSBvZiB0aGVzZSBleGNlcHRpb25zXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgY29tcHV0ZWQtcHJvcGVydHktc3BhY2luZywgYnJhY2Utc3R5bGUsIG1heC1wYXJhbXMsIG9uZS12YXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIGluZGVudCwgbm8tbG9vcC1mdW5jICovXG5cbmNvbnN0IHNxcnQgPSBNYXRoLnNxcnQ7XG5jb25zdCBzaW4gPSBNYXRoLnNpbjtcbmNvbnN0IGNvcyA9IE1hdGguY29zO1xuY29uc3QgdGFuID0gTWF0aC50YW47XG5jb25zdCBwaSA9IE1hdGguUEk7XG5jb25zdCBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuLy8gVmVjMyBDbGFzc1xuZXhwb3J0IGNsYXNzIFZlYzMgZXh0ZW5kcyBBcnJheSB7XG5cbiAgY29uc3RydWN0b3IoeCA9IDAsIHkgPSAwLCB6ID0gMCkge1xuICAgIHN1cGVyKDMpO1xuICAgIHRoaXNbMF0gPSB4O1xuICAgIHRoaXNbMV0gPSB5O1xuICAgIHRoaXNbMl0gPSB6O1xuICB9XG5cbiAgLy8gZmFzdCBWZWMzIGNyZWF0ZS5cbiAgc3RhdGljIGNyZWF0ZSgpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoMyk7XG4gIH1cblxuICBnZXQgeCgpIHtcbiAgICByZXR1cm4gdGhpc1swXTtcbiAgfVxuXG4gIHNldCB4KHZhbHVlKSB7XG4gICAgcmV0dXJuICh0aGlzWzBdID0gdmFsdWUpO1xuICB9XG5cbiAgZ2V0IHkoKSB7XG4gICAgcmV0dXJuIHRoaXNbMV07XG4gIH1cblxuICBzZXQgeSh2YWx1ZSkge1xuICAgIHJldHVybiAodGhpc1sxXSA9IHZhbHVlKTtcbiAgfVxuXG4gIGdldCB6KCkge1xuICAgIHJldHVybiB0aGlzWzJdO1xuICB9XG5cbiAgc2V0IHoodmFsdWUpIHtcbiAgICByZXR1cm4gKHRoaXNbMl0gPSB2YWx1ZSk7XG4gIH1cbn1cblxudmFyIGdlbmVyaWNzID0ge1xuXG4gIHNldFZlYzMoZGVzdCwgdmVjKSB7XG4gICAgZGVzdFswXSA9IHZlY1swXTtcbiAgICBkZXN0WzFdID0gdmVjWzFdO1xuICAgIGRlc3RbMl0gPSB2ZWNbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc2V0KGRlc3QsIHgsIHksIHopIHtcbiAgICBkZXN0WzBdID0geDtcbiAgICBkZXN0WzFdID0geTtcbiAgICBkZXN0WzJdID0gejtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBhZGQoZGVzdCwgdmVjKSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKGRlc3RbMF0gKyB2ZWNbMF0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKyB2ZWNbMV0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMl0gKyB2ZWNbMl0pO1xuICB9LFxuXG4gICRhZGQoZGVzdCwgdmVjKSB7XG4gICAgZGVzdFswXSArPSB2ZWNbMF07XG4gICAgZGVzdFsxXSArPSB2ZWNbMV07XG4gICAgZGVzdFsyXSArPSB2ZWNbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgYWRkMihkZXN0LCBhLCBiKSB7XG4gICAgZGVzdFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIGRlc3RbMV0gPSBhWzFdICsgYlsxXTtcbiAgICBkZXN0WzJdID0gYVsyXSArIGJbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc3ViKGRlc3QsIHZlYykge1xuICAgIHJldHVybiBuZXcgVmVjMyhkZXN0WzBdIC0gdmVjWzBdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdIC0gdmVjWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdIC0gdmVjWzJdKTtcbiAgfSxcblxuICAkc3ViKGRlc3QsIHZlYykge1xuICAgIGRlc3RbMF0gLT0gdmVjWzBdO1xuICAgIGRlc3RbMV0gLT0gdmVjWzFdO1xuICAgIGRlc3RbMl0gLT0gdmVjWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHN1YjIoZGVzdCwgYSwgYikge1xuICAgIGRlc3RbMF0gPSBhWzBdIC0gYlswXTtcbiAgICBkZXN0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgZGVzdFsyXSA9IGFbMl0gLSBiWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHNjYWxlKGRlc3QsIHMpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoZGVzdFswXSAqIHMsXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICogcyk7XG4gIH0sXG5cbiAgJHNjYWxlKGRlc3QsIHMpIHtcbiAgICBkZXN0WzBdICo9IHM7XG4gICAgZGVzdFsxXSAqPSBzO1xuICAgIGRlc3RbMl0gKj0gcztcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBuZWcoZGVzdCkge1xuICAgIHJldHVybiBuZXcgVmVjMygtZGVzdFswXSxcbiAgICAgICAgICAgICAgICAgICAgLWRlc3RbMV0sXG4gICAgICAgICAgICAgICAgICAgIC1kZXN0WzJdKTtcbiAgfSxcblxuICAkbmVnKGRlc3QpIHtcbiAgICBkZXN0WzBdID0gLWRlc3RbMF07XG4gICAgZGVzdFsxXSA9IC1kZXN0WzFdO1xuICAgIGRlc3RbMl0gPSAtZGVzdFsyXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICB1bml0KGRlc3QpIHtcbiAgICB2YXIgbGVuID0gVmVjMy5ub3JtKGRlc3QpO1xuXG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgIHJldHVybiBWZWMzLnNjYWxlKGRlc3QsIDEgLyBsZW4pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjMy5jbG9uZShkZXN0KTtcbiAgfSxcblxuICAkdW5pdChkZXN0KSB7XG4gICAgdmFyIGxlbiA9IFZlYzMubm9ybShkZXN0KTtcblxuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICByZXR1cm4gVmVjMy4kc2NhbGUoZGVzdCwgMSAvIGxlbik7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGNyb3NzKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sXG4gICAgICBkeSA9IGRlc3RbMV0sXG4gICAgICBkeiA9IGRlc3RbMl0sXG4gICAgICB2eCA9IHZlY1swXSxcbiAgICAgIHZ5ID0gdmVjWzFdLFxuICAgICAgdnogPSB2ZWNbMl07XG5cbiAgICByZXR1cm4gbmV3IFZlYzMoZHkgKiB2eiAtIGR6ICogdnksXG4gICAgICAgICAgICAgICAgICAgIGR6ICogdnggLSBkeCAqIHZ6LFxuICAgICAgICAgICAgICAgICAgICBkeCAqIHZ5IC0gZHkgKiB2eCk7XG4gIH0sXG5cbiAgJGNyb3NzKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sXG4gICAgICAgIGR5ID0gZGVzdFsxXSxcbiAgICAgICAgZHogPSBkZXN0WzJdLFxuICAgICAgICB2eCA9IHZlY1swXSxcbiAgICAgICAgdnkgPSB2ZWNbMV0sXG4gICAgICAgIHZ6ID0gdmVjWzJdO1xuXG4gICAgZGVzdFswXSA9IGR5ICogdnogLSBkeiAqIHZ5O1xuICAgIGRlc3RbMV0gPSBkeiAqIHZ4IC0gZHggKiB2ejtcbiAgICBkZXN0WzJdID0gZHggKiB2eSAtIGR5ICogdng7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgZGlzdFRvKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0gLSB2ZWNbMF0sXG4gICAgICAgIGR5ID0gZGVzdFsxXSAtIHZlY1sxXSxcbiAgICAgICAgZHogPSBkZXN0WzJdIC0gdmVjWzJdO1xuXG4gICAgcmV0dXJuIHNxcnQoZHggKiBkeCArXG4gICAgICAgICAgICAgICAgZHkgKiBkeSArXG4gICAgICAgICAgICAgICAgZHogKiBkeik7XG4gIH0sXG5cbiAgZGlzdFRvU3EoZGVzdCwgdmVjKSB7XG4gICAgdmFyIGR4ID0gZGVzdFswXSAtIHZlY1swXSxcbiAgICAgICAgZHkgPSBkZXN0WzFdIC0gdmVjWzFdLFxuICAgICAgICBkeiA9IGRlc3RbMl0gLSB2ZWNbMl07XG5cbiAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6O1xuICB9LFxuXG4gIG5vcm0oZGVzdCkge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sIGR5ID0gZGVzdFsxXSwgZHogPSBkZXN0WzJdO1xuXG4gICAgcmV0dXJuIHNxcnQoZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6KTtcbiAgfSxcblxuICBub3JtU3EoZGVzdCkge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sIGR5ID0gZGVzdFsxXSwgZHogPSBkZXN0WzJdO1xuXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcbiAgfSxcblxuICBkb3QoZGVzdCwgdmVjKSB7XG4gICAgcmV0dXJuIGRlc3RbMF0gKiB2ZWNbMF0gKyBkZXN0WzFdICogdmVjWzFdICsgZGVzdFsyXSAqIHZlY1syXTtcbiAgfSxcblxuICBjbG9uZShkZXN0KSB7XG4gICAgaWYgKGRlc3QgaW5zdGFuY2VvZiBWZWMzKSB7XG4gICAgICByZXR1cm4gbmV3IFZlYzMoZGVzdFswXSwgZGVzdFsxXSwgZGVzdFsyXSk7XG4gICAgfVxuICAgIHJldHVybiBWZWMzLnNldFZlYzMobmV3IEZsb2F0MzJBcnJheSgzKSwgZGVzdCk7XG4gIH0sXG5cbiAgdG9GbG9hdDMyQXJyYXkoZGVzdCkge1xuICAgIHZhciBhbnMgPSBkZXN0LnR5cGVkQ29udGFpbmVyO1xuXG4gICAgaWYgKCFhbnMpIHtcbiAgICAgIHJldHVybiBkZXN0O1xuICAgIH1cblxuICAgIGFuc1swXSA9IGRlc3RbMF07XG4gICAgYW5zWzFdID0gZGVzdFsxXTtcbiAgICBhbnNbMl0gPSBkZXN0WzJdO1xuXG4gICAgcmV0dXJuIGFucztcbiAgfVxufTtcblxuLy8gYWRkIGdlbmVyaWNzIGFuZCBpbnN0YW5jZSBtZXRob2RzXG52YXIgcHJvdG8gPSBWZWMzLnByb3RvdHlwZTtcbmZvciAodmFyIG1ldGhvZCBpbiBnZW5lcmljcykge1xuICBWZWMzW21ldGhvZF0gPSBnZW5lcmljc1ttZXRob2RdO1xuICBwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIF8obSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgICAgcmV0dXJuIFZlYzNbbV0uYXBwbHkoVmVjMywgYXJncyk7XG4gICAgfTtcbiB9KG1ldGhvZCkpO1xufVxuXG4vLyBNYXQ0IENsYXNzXG5leHBvcnQgY2xhc3MgTWF0NCBleHRlbmRzIEFycmF5IHtcblxuICBjb25zdHJ1Y3RvcihuMTEsIG4xMiwgbjEzLCBuMTQsXG4gICAgICAgICAgICAgIG4yMSwgbjIyLCBuMjMsIG4yNCxcbiAgICAgICAgICAgICAgbjMxLCBuMzIsIG4zMywgbjM0LFxuICAgICAgICAgICAgICBuNDEsIG40MiwgbjQzLCBuNDQpIHtcblxuICAgIHN1cGVyKDE2KTtcblxuICAgIHRoaXMubGVuZ3RoID0gMTY7XG5cbiAgICBpZiAodHlwZW9mIG4xMSA9PT0gJ251bWJlcicpIHtcblxuICAgICAgdGhpcy5zZXQobjExLCBuMTIsIG4xMywgbjE0LFxuICAgICAgICAgICAgICAgbjIxLCBuMjIsIG4yMywgbjI0LFxuICAgICAgICAgICAgICAgbjMxLCBuMzIsIG4zMywgbjM0LFxuICAgICAgICAgICAgICAgbjQxLCBuNDIsIG40MywgbjQ0KTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlkKCk7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlZENvbnRhaW5lciA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZSgpIHtcbiAgICByZXR1cm4gbmV3IEFycmF5KDE2KTtcbiAgfVxuXG4gIGdldCBuMTEoKSB7IHJldHVybiB0aGlzWzBdOyB9XG4gIGdldCBuMTIoKSB7IHJldHVybiB0aGlzWzRdOyB9XG4gIGdldCBuMTMoKSB7IHJldHVybiB0aGlzWzhdOyB9XG4gIGdldCBuMTQoKSB7IHJldHVybiB0aGlzWzEyXTsgfVxuICBnZXQgbjIxKCkgeyByZXR1cm4gdGhpc1sxXTsgfVxuICBnZXQgbjIyKCkgeyByZXR1cm4gdGhpc1s1XTsgfVxuICBnZXQgbjIzKCkgeyByZXR1cm4gdGhpc1s5XTsgfVxuICBnZXQgbjI0KCkgeyByZXR1cm4gdGhpc1sxM107IH1cbiAgZ2V0IG4zMSgpIHsgcmV0dXJuIHRoaXNbMl07IH1cbiAgZ2V0IG4zMigpIHsgcmV0dXJuIHRoaXNbNl07IH1cbiAgZ2V0IG4zMygpIHsgcmV0dXJuIHRoaXNbMTBdOyB9XG4gIGdldCBuMzQoKSB7IHJldHVybiB0aGlzWzE0XTsgfVxuICBnZXQgbjQxKCkgeyByZXR1cm4gdGhpc1szXTsgfVxuICBnZXQgbjQyKCkgeyByZXR1cm4gdGhpc1s3XTsgfVxuICBnZXQgbjQzKCkgeyByZXR1cm4gdGhpc1sxMV07IH1cbiAgZ2V0IG40NCgpIHsgcmV0dXJuIHRoaXNbMTVdOyB9XG5cbiAgc2V0IG4xMSh2YWwpIHsgdGhpc1swXSA9IHZhbDsgfVxuICBzZXQgbjEyKHZhbCkgeyB0aGlzWzRdID0gdmFsOyB9XG4gIHNldCBuMTModmFsKSB7IHRoaXNbOF0gPSB2YWw7IH1cbiAgc2V0IG4xNCh2YWwpIHsgdGhpc1sxMl0gPSB2YWw7IH1cbiAgc2V0IG4yMSh2YWwpIHsgdGhpc1sxXSA9IHZhbDsgfVxuICBzZXQgbjIyKHZhbCkgeyB0aGlzWzVdID0gdmFsOyB9XG4gIHNldCBuMjModmFsKSB7IHRoaXNbOV0gPSB2YWw7IH1cbiAgc2V0IG4yNCh2YWwpIHsgdGhpc1sxM10gPSB2YWw7IH1cbiAgc2V0IG4zMSh2YWwpIHsgdGhpc1syXSA9IHZhbDsgfVxuICBzZXQgbjMyKHZhbCkgeyB0aGlzWzZdID0gdmFsOyB9XG4gIHNldCBuMzModmFsKSB7IHRoaXNbMTBdID0gdmFsOyB9XG4gIHNldCBuMzQodmFsKSB7IHRoaXNbMTRdID0gdmFsOyB9XG4gIHNldCBuNDEodmFsKSB7IHRoaXNbM10gPSB2YWw7IH1cbiAgc2V0IG40Mih2YWwpIHsgdGhpc1s3XSA9IHZhbDsgfVxuICBzZXQgbjQzKHZhbCkgeyB0aGlzWzExXSA9IHZhbDsgfVxuICBzZXQgbjQ0KHZhbCkgeyB0aGlzWzE1XSA9IHZhbDsgfVxuXG59XG5cbmdlbmVyaWNzID0ge1xuXG4gIGlkKGRlc3QpIHtcblxuICAgIGRlc3RbMCBdID0gMTtcbiAgICBkZXN0WzEgXSA9IDA7XG4gICAgZGVzdFsyIF0gPSAwO1xuICAgIGRlc3RbMyBdID0gMDtcbiAgICBkZXN0WzQgXSA9IDA7XG4gICAgZGVzdFs1IF0gPSAxO1xuICAgIGRlc3RbNiBdID0gMDtcbiAgICBkZXN0WzcgXSA9IDA7XG4gICAgZGVzdFs4IF0gPSAwO1xuICAgIGRlc3RbOSBdID0gMDtcbiAgICBkZXN0WzEwXSA9IDE7XG4gICAgZGVzdFsxMV0gPSAwO1xuICAgIGRlc3RbMTJdID0gMDtcbiAgICBkZXN0WzEzXSA9IDA7XG4gICAgZGVzdFsxNF0gPSAwO1xuICAgIGRlc3RbMTVdID0gMTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGNsb25lKGRlc3QpIHtcbiAgICBpZiAoZGVzdCBpbnN0YW5jZW9mIE1hdDQpIHtcbiAgICAgIHJldHVybiBuZXcgTWF0NChkZXN0WzBdLCBkZXN0WzRdLCBkZXN0WzhdLCBkZXN0WzEyXSxcbiAgICAgICAgICAgICAgICAgICAgICBkZXN0WzFdLCBkZXN0WzVdLCBkZXN0WzldLCBkZXN0WzEzXSxcbiAgICAgICAgICAgICAgICAgICAgICBkZXN0WzJdLCBkZXN0WzZdLCBkZXN0WzEwXSwgZGVzdFsxNF0sXG4gICAgICAgICAgICAgICAgICAgICAgZGVzdFszXSwgZGVzdFs3XSwgZGVzdFsxMV0sIGRlc3RbMTVdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyB0eXBlZEFycmF5KGRlc3QpO1xuICB9LFxuXG4gIHNldChkZXN0LCBuMTEsIG4xMiwgbjEzLCBuMTQsXG4gICAgICAgICAgICBuMjEsIG4yMiwgbjIzLCBuMjQsXG4gICAgICAgICAgICBuMzEsIG4zMiwgbjMzLCBuMzQsXG4gICAgICAgICAgICBuNDEsIG40MiwgbjQzLCBuNDQpIHtcblxuICAgIGRlc3RbMCBdID0gbjExO1xuICAgIGRlc3RbNCBdID0gbjEyO1xuICAgIGRlc3RbOCBdID0gbjEzO1xuICAgIGRlc3RbMTJdID0gbjE0O1xuICAgIGRlc3RbMSBdID0gbjIxO1xuICAgIGRlc3RbNSBdID0gbjIyO1xuICAgIGRlc3RbOSBdID0gbjIzO1xuICAgIGRlc3RbMTNdID0gbjI0O1xuICAgIGRlc3RbMiBdID0gbjMxO1xuICAgIGRlc3RbNiBdID0gbjMyO1xuICAgIGRlc3RbMTBdID0gbjMzO1xuICAgIGRlc3RbMTRdID0gbjM0O1xuICAgIGRlc3RbMyBdID0gbjQxO1xuICAgIGRlc3RbNyBdID0gbjQyO1xuICAgIGRlc3RbMTFdID0gbjQzO1xuICAgIGRlc3RbMTVdID0gbjQ0O1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgbXVsVmVjMyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgYW5zID0gVmVjMy5jbG9uZSh2ZWMpO1xuICAgIHJldHVybiBNYXQ0LiRtdWxWZWMzKGRlc3QsIGFucyk7XG4gIH0sXG5cbiAgJG11bFZlYzMoZGVzdCwgdmVjKSB7XG4gICAgdmFyIHZ4ID0gdmVjWzBdLFxuICAgICAgICB2eSA9IHZlY1sxXSxcbiAgICAgICAgdnogPSB2ZWNbMl0sXG4gICAgICAgIGQgPSAxIC8gKGRlc3RbM10gKiB2eCArIGRlc3RbN10gKiB2eSArIGRlc3RbMTFdICogdnogKyBkZXN0WzE1XSk7XG5cbiAgICB2ZWNbMF0gPSAoZGVzdFswXSAqIHZ4ICsgZGVzdFs0XSAqIHZ5ICsgZGVzdFs4IF0gKiB2eiArIGRlc3RbMTJdKSAqIGQ7XG4gICAgdmVjWzFdID0gKGRlc3RbMV0gKiB2eCArIGRlc3RbNV0gKiB2eSArIGRlc3RbOSBdICogdnogKyBkZXN0WzEzXSkgKiBkO1xuICAgIHZlY1syXSA9IChkZXN0WzJdICogdnggKyBkZXN0WzZdICogdnkgKyBkZXN0WzEwXSAqIHZ6ICsgZGVzdFsxNF0pICogZDtcblxuICAgIHJldHVybiB2ZWM7XG4gIH0sXG5cbiAgbXVsTWF0NDIoZGVzdCwgYSwgYikge1xuICAgIHZhciBhMTEgPSBhWzAgXSwgYTEyID0gYVsxIF0sIGExMyA9IGFbMiBdLCBhMTQgPSBhWzMgXSxcbiAgICAgICAgYTIxID0gYVs0IF0sIGEyMiA9IGFbNSBdLCBhMjMgPSBhWzYgXSwgYTI0ID0gYVs3IF0sXG4gICAgICAgIGEzMSA9IGFbOCBdLCBhMzIgPSBhWzkgXSwgYTMzID0gYVsxMF0sIGEzNCA9IGFbMTFdLFxuICAgICAgICBhNDEgPSBhWzEyXSwgYTQyID0gYVsxM10sIGE0MyA9IGFbMTRdLCBhNDQgPSBhWzE1XSxcbiAgICAgICAgYjExID0gYlswIF0sIGIxMiA9IGJbMSBdLCBiMTMgPSBiWzIgXSwgYjE0ID0gYlszIF0sXG4gICAgICAgIGIyMSA9IGJbNCBdLCBiMjIgPSBiWzUgXSwgYjIzID0gYls2IF0sIGIyNCA9IGJbNyBdLFxuICAgICAgICBiMzEgPSBiWzggXSwgYjMyID0gYls5IF0sIGIzMyA9IGJbMTBdLCBiMzQgPSBiWzExXSxcbiAgICAgICAgYjQxID0gYlsxMl0sIGI0MiA9IGJbMTNdLCBiNDMgPSBiWzE0XSwgYjQ0ID0gYlsxNV07XG5cbiAgICBkZXN0WzAgXSA9IGIxMSAqIGExMSArIGIxMiAqIGEyMSArIGIxMyAqIGEzMSArIGIxNCAqIGE0MTtcbiAgICBkZXN0WzEgXSA9IGIxMSAqIGExMiArIGIxMiAqIGEyMiArIGIxMyAqIGEzMiArIGIxNCAqIGE0MjtcbiAgICBkZXN0WzIgXSA9IGIxMSAqIGExMyArIGIxMiAqIGEyMyArIGIxMyAqIGEzMyArIGIxNCAqIGE0MztcbiAgICBkZXN0WzMgXSA9IGIxMSAqIGExNCArIGIxMiAqIGEyNCArIGIxMyAqIGEzNCArIGIxNCAqIGE0NDtcblxuICAgIGRlc3RbNCBdID0gYjIxICogYTExICsgYjIyICogYTIxICsgYjIzICogYTMxICsgYjI0ICogYTQxO1xuICAgIGRlc3RbNSBdID0gYjIxICogYTEyICsgYjIyICogYTIyICsgYjIzICogYTMyICsgYjI0ICogYTQyO1xuICAgIGRlc3RbNiBdID0gYjIxICogYTEzICsgYjIyICogYTIzICsgYjIzICogYTMzICsgYjI0ICogYTQzO1xuICAgIGRlc3RbNyBdID0gYjIxICogYTE0ICsgYjIyICogYTI0ICsgYjIzICogYTM0ICsgYjI0ICogYTQ0O1xuXG4gICAgZGVzdFs4IF0gPSBiMzEgKiBhMTEgKyBiMzIgKiBhMjEgKyBiMzMgKiBhMzEgKyBiMzQgKiBhNDE7XG4gICAgZGVzdFs5IF0gPSBiMzEgKiBhMTIgKyBiMzIgKiBhMjIgKyBiMzMgKiBhMzIgKyBiMzQgKiBhNDI7XG4gICAgZGVzdFsxMF0gPSBiMzEgKiBhMTMgKyBiMzIgKiBhMjMgKyBiMzMgKiBhMzMgKyBiMzQgKiBhNDM7XG4gICAgZGVzdFsxMV0gPSBiMzEgKiBhMTQgKyBiMzIgKiBhMjQgKyBiMzMgKiBhMzQgKyBiMzQgKiBhNDQ7XG5cbiAgICBkZXN0WzEyXSA9IGI0MSAqIGExMSArIGI0MiAqIGEyMSArIGI0MyAqIGEzMSArIGI0NCAqIGE0MTtcbiAgICBkZXN0WzEzXSA9IGI0MSAqIGExMiArIGI0MiAqIGEyMiArIGI0MyAqIGEzMiArIGI0NCAqIGE0MjtcbiAgICBkZXN0WzE0XSA9IGI0MSAqIGExMyArIGI0MiAqIGEyMyArIGI0MyAqIGEzMyArIGI0NCAqIGE0MztcbiAgICBkZXN0WzE1XSA9IGI0MSAqIGExNCArIGI0MiAqIGEyNCArIGI0MyAqIGEzNCArIGI0NCAqIGE0NDtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBtdWxNYXQ0KGEsIGIpIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoYSk7XG4gICAgcmV0dXJuIE1hdDQubXVsTWF0NDIobSwgYSwgYik7XG4gIH0sXG5cbiAgJG11bE1hdDQoYSwgYikge1xuICAgIHJldHVybiBNYXQ0Lm11bE1hdDQyKGEsIGEsIGIpO1xuICB9LFxuXG4gIGFkZChkZXN0LCBtKSB7XG4gICAgdmFyIGNvcHkgPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRhZGQoY29weSwgbSk7XG4gIH0sXG5cbiAgJGFkZChkZXN0LCBtKSB7XG4gICAgZGVzdFswIF0gKz0gbVswXTtcbiAgICBkZXN0WzEgXSArPSBtWzFdO1xuICAgIGRlc3RbMiBdICs9IG1bMl07XG4gICAgZGVzdFszIF0gKz0gbVszXTtcbiAgICBkZXN0WzQgXSArPSBtWzRdO1xuICAgIGRlc3RbNSBdICs9IG1bNV07XG4gICAgZGVzdFs2IF0gKz0gbVs2XTtcbiAgICBkZXN0WzcgXSArPSBtWzddO1xuICAgIGRlc3RbOCBdICs9IG1bOF07XG4gICAgZGVzdFs5IF0gKz0gbVs5XTtcbiAgICBkZXN0WzEwXSArPSBtWzEwXTtcbiAgICBkZXN0WzExXSArPSBtWzExXTtcbiAgICBkZXN0WzEyXSArPSBtWzEyXTtcbiAgICBkZXN0WzEzXSArPSBtWzEzXTtcbiAgICBkZXN0WzE0XSArPSBtWzE0XTtcbiAgICBkZXN0WzE1XSArPSBtWzE1XTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHRyYW5zcG9zZShkZXN0KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiR0cmFuc3Bvc2UobSk7XG4gIH0sXG5cbiAgJHRyYW5zcG9zZShkZXN0KSB7XG4gICAgdmFyIG40ID0gZGVzdFs0XSwgbjggPSBkZXN0WzhdLCBuMTIgPSBkZXN0WzEyXSxcbiAgICAgICAgbjEgPSBkZXN0WzFdLCBuOSA9IGRlc3RbOV0sIG4xMyA9IGRlc3RbMTNdLFxuICAgICAgICBuMiA9IGRlc3RbMl0sIG42ID0gZGVzdFs2XSwgbjE0ID0gZGVzdFsxNF0sXG4gICAgICAgIG4zID0gZGVzdFszXSwgbjcgPSBkZXN0WzddLCBuMTEgPSBkZXN0WzExXTtcblxuICAgIGRlc3RbMV0gPSBuNDtcbiAgICBkZXN0WzJdID0gbjg7XG4gICAgZGVzdFszXSA9IG4xMjtcbiAgICBkZXN0WzRdID0gbjE7XG4gICAgZGVzdFs2XSA9IG45O1xuICAgIGRlc3RbN10gPSBuMTM7XG4gICAgZGVzdFs4XSA9IG4yO1xuICAgIGRlc3RbOV0gPSBuNjtcbiAgICBkZXN0WzExXSA9IG4xNDtcbiAgICBkZXN0WzEyXSA9IG4zO1xuICAgIGRlc3RbMTNdID0gbjc7XG4gICAgZGVzdFsxNF0gPSBuMTE7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICByb3RhdGVBeGlzKGRlc3QsIHRoZXRhLCB2ZWMpIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoZGVzdCk7XG4gICAgcmV0dXJuIE1hdDQuJHJvdGF0ZUF4aXMobSwgdGhldGEsIHZlYyk7XG4gIH0sXG5cbiAgJHJvdGF0ZUF4aXMoZGVzdCwgdGhldGEsIHZlYykge1xuICAgIHZhciBzID0gc2luKHRoZXRhKSxcbiAgICAgICAgYyA9IGNvcyh0aGV0YSksXG4gICAgICAgIG5jID0gMSAtIGMsXG4gICAgICAgIHZ4ID0gdmVjWzBdLFxuICAgICAgICB2eSA9IHZlY1sxXSxcbiAgICAgICAgdnogPSB2ZWNbMl0sXG4gICAgICAgIG0xMSA9IHZ4ICogdnggKiBuYyArIGMsXG4gICAgICAgIG0xMiA9IHZ4ICogdnkgKiBuYyArIHZ6ICogcyxcbiAgICAgICAgbTEzID0gdnggKiB2eiAqIG5jIC0gdnkgKiBzLFxuICAgICAgICBtMjEgPSB2eSAqIHZ4ICogbmMgLSB2eiAqIHMsXG4gICAgICAgIG0yMiA9IHZ5ICogdnkgKiBuYyArIGMsXG4gICAgICAgIG0yMyA9IHZ5ICogdnogKiBuYyArIHZ4ICogcyxcbiAgICAgICAgbTMxID0gdnggKiB2eiAqIG5jICsgdnkgKiBzLFxuICAgICAgICBtMzIgPSB2eSAqIHZ6ICogbmMgLSB2eCAqIHMsXG4gICAgICAgIG0zMyA9IHZ6ICogdnogKiBuYyArIGMsXG4gICAgICAgIGQxMSA9IGRlc3RbMF0sXG4gICAgICAgIGQxMiA9IGRlc3RbMV0sXG4gICAgICAgIGQxMyA9IGRlc3RbMl0sXG4gICAgICAgIGQxNCA9IGRlc3RbM10sXG4gICAgICAgIGQyMSA9IGRlc3RbNF0sXG4gICAgICAgIGQyMiA9IGRlc3RbNV0sXG4gICAgICAgIGQyMyA9IGRlc3RbNl0sXG4gICAgICAgIGQyNCA9IGRlc3RbN10sXG4gICAgICAgIGQzMSA9IGRlc3RbOF0sXG4gICAgICAgIGQzMiA9IGRlc3RbOV0sXG4gICAgICAgIGQzMyA9IGRlc3RbMTBdLFxuICAgICAgICBkMzQgPSBkZXN0WzExXSxcbiAgICAgICAgZDQxID0gZGVzdFsxMl0sXG4gICAgICAgIGQ0MiA9IGRlc3RbMTNdLFxuICAgICAgICBkNDMgPSBkZXN0WzE0XSxcbiAgICAgICAgZDQ0ID0gZGVzdFsxNV07XG5cbiAgICBkZXN0WzAgXSA9IGQxMSAqIG0xMSArIGQyMSAqIG0xMiArIGQzMSAqIG0xMztcbiAgICBkZXN0WzEgXSA9IGQxMiAqIG0xMSArIGQyMiAqIG0xMiArIGQzMiAqIG0xMztcbiAgICBkZXN0WzIgXSA9IGQxMyAqIG0xMSArIGQyMyAqIG0xMiArIGQzMyAqIG0xMztcbiAgICBkZXN0WzMgXSA9IGQxNCAqIG0xMSArIGQyNCAqIG0xMiArIGQzNCAqIG0xMztcblxuICAgIGRlc3RbNCBdID0gZDExICogbTIxICsgZDIxICogbTIyICsgZDMxICogbTIzO1xuICAgIGRlc3RbNSBdID0gZDEyICogbTIxICsgZDIyICogbTIyICsgZDMyICogbTIzO1xuICAgIGRlc3RbNiBdID0gZDEzICogbTIxICsgZDIzICogbTIyICsgZDMzICogbTIzO1xuICAgIGRlc3RbNyBdID0gZDE0ICogbTIxICsgZDI0ICogbTIyICsgZDM0ICogbTIzO1xuXG4gICAgZGVzdFs4IF0gPSBkMTEgKiBtMzEgKyBkMjEgKiBtMzIgKyBkMzEgKiBtMzM7XG4gICAgZGVzdFs5IF0gPSBkMTIgKiBtMzEgKyBkMjIgKiBtMzIgKyBkMzIgKiBtMzM7XG4gICAgZGVzdFsxMF0gPSBkMTMgKiBtMzEgKyBkMjMgKiBtMzIgKyBkMzMgKiBtMzM7XG4gICAgZGVzdFsxMV0gPSBkMTQgKiBtMzEgKyBkMjQgKiBtMzIgKyBkMzQgKiBtMzM7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICByb3RhdGVYWVooZGVzdCwgcngsIHJ5LCByeikge1xuICAgIHZhciBhbnMgPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRyb3RhdGVYWVooYW5zLCByeCwgcnksIHJ6KTtcbiAgfSxcblxuICAkcm90YXRlWFlaKGRlc3QsIHJ4LCByeSwgcnopIHtcbiAgICB2YXIgZDExID0gZGVzdFswIF0sXG4gICAgICAgIGQxMiA9IGRlc3RbMSBdLFxuICAgICAgICBkMTMgPSBkZXN0WzIgXSxcbiAgICAgICAgZDE0ID0gZGVzdFszIF0sXG4gICAgICAgIGQyMSA9IGRlc3RbNCBdLFxuICAgICAgICBkMjIgPSBkZXN0WzUgXSxcbiAgICAgICAgZDIzID0gZGVzdFs2IF0sXG4gICAgICAgIGQyNCA9IGRlc3RbNyBdLFxuICAgICAgICBkMzEgPSBkZXN0WzggXSxcbiAgICAgICAgZDMyID0gZGVzdFs5IF0sXG4gICAgICAgIGQzMyA9IGRlc3RbMTBdLFxuICAgICAgICBkMzQgPSBkZXN0WzExXSxcbiAgICAgICAgY3J4ID0gY29zKHJ4KSxcbiAgICAgICAgY3J5ID0gY29zKHJ5KSxcbiAgICAgICAgY3J6ID0gY29zKHJ6KSxcbiAgICAgICAgc3J4ID0gc2luKHJ4KSxcbiAgICAgICAgc3J5ID0gc2luKHJ5KSxcbiAgICAgICAgc3J6ID0gc2luKHJ6KSxcbiAgICAgICAgbTExID0gIGNyeSAqIGNyeixcbiAgICAgICAgbTIxID0gLWNyeCAqIHNyeiArIHNyeCAqIHNyeSAqIGNyeixcbiAgICAgICAgbTMxID0gIHNyeCAqIHNyeiArIGNyeCAqIHNyeSAqIGNyeixcbiAgICAgICAgbTEyID0gIGNyeSAqIHNyeixcbiAgICAgICAgbTIyID0gIGNyeCAqIGNyeiArIHNyeCAqIHNyeSAqIHNyeixcbiAgICAgICAgbTMyID0gLXNyeCAqIGNyeiArIGNyeCAqIHNyeSAqIHNyeixcbiAgICAgICAgbTEzID0gLXNyeSxcbiAgICAgICAgbTIzID0gIHNyeCAqIGNyeSxcbiAgICAgICAgbTMzID0gIGNyeCAqIGNyeTtcblxuICAgIGRlc3RbMCBdID0gZDExICogbTExICsgZDIxICogbTEyICsgZDMxICogbTEzO1xuICAgIGRlc3RbMSBdID0gZDEyICogbTExICsgZDIyICogbTEyICsgZDMyICogbTEzO1xuICAgIGRlc3RbMiBdID0gZDEzICogbTExICsgZDIzICogbTEyICsgZDMzICogbTEzO1xuICAgIGRlc3RbMyBdID0gZDE0ICogbTExICsgZDI0ICogbTEyICsgZDM0ICogbTEzO1xuXG4gICAgZGVzdFs0IF0gPSBkMTEgKiBtMjEgKyBkMjEgKiBtMjIgKyBkMzEgKiBtMjM7XG4gICAgZGVzdFs1IF0gPSBkMTIgKiBtMjEgKyBkMjIgKiBtMjIgKyBkMzIgKiBtMjM7XG4gICAgZGVzdFs2IF0gPSBkMTMgKiBtMjEgKyBkMjMgKiBtMjIgKyBkMzMgKiBtMjM7XG4gICAgZGVzdFs3IF0gPSBkMTQgKiBtMjEgKyBkMjQgKiBtMjIgKyBkMzQgKiBtMjM7XG5cbiAgICBkZXN0WzggXSA9IGQxMSAqIG0zMSArIGQyMSAqIG0zMiArIGQzMSAqIG0zMztcbiAgICBkZXN0WzkgXSA9IGQxMiAqIG0zMSArIGQyMiAqIG0zMiArIGQzMiAqIG0zMztcbiAgICBkZXN0WzEwXSA9IGQxMyAqIG0zMSArIGQyMyAqIG0zMiArIGQzMyAqIG0zMztcbiAgICBkZXN0WzExXSA9IGQxNCAqIG0zMSArIGQyNCAqIG0zMiArIGQzNCAqIG0zMztcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHRyYW5zbGF0ZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiR0cmFuc2xhdGUobSwgeCwgeSwgeik7XG4gIH0sXG5cbiAgJHRyYW5zbGF0ZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgZGVzdFsxMl0gPSBkZXN0WzAgXSAqIHggKyBkZXN0WzQgXSAqIHkgKyBkZXN0WzggXSAqIHogKyBkZXN0WzEyXTtcbiAgICBkZXN0WzEzXSA9IGRlc3RbMSBdICogeCArIGRlc3RbNSBdICogeSArIGRlc3RbOSBdICogeiArIGRlc3RbMTNdO1xuICAgIGRlc3RbMTRdID0gZGVzdFsyIF0gKiB4ICsgZGVzdFs2IF0gKiB5ICsgZGVzdFsxMF0gKiB6ICsgZGVzdFsxNF07XG4gICAgZGVzdFsxNV0gPSBkZXN0WzMgXSAqIHggKyBkZXN0WzcgXSAqIHkgKyBkZXN0WzExXSAqIHogKyBkZXN0WzE1XTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHNjYWxlKGRlc3QsIHgsIHksIHopIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoZGVzdCk7XG4gICAgcmV0dXJuIE1hdDQuJHNjYWxlKG0sIHgsIHksIHopO1xuICB9LFxuXG4gICRzY2FsZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgZGVzdFswIF0gKj0geDtcbiAgICBkZXN0WzEgXSAqPSB4O1xuICAgIGRlc3RbMiBdICo9IHg7XG4gICAgZGVzdFszIF0gKj0geDtcbiAgICBkZXN0WzQgXSAqPSB5O1xuICAgIGRlc3RbNSBdICo9IHk7XG4gICAgZGVzdFs2IF0gKj0geTtcbiAgICBkZXN0WzcgXSAqPSB5O1xuICAgIGRlc3RbOCBdICo9IHo7XG4gICAgZGVzdFs5IF0gKj0gejtcbiAgICBkZXN0WzEwXSAqPSB6O1xuICAgIGRlc3RbMTFdICo9IHo7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICAvLyBNZXRob2QgYmFzZWQgb24gUHJlR0wgaHR0cHM6Ly8gZ2l0aHViLmNvbS9kZWFubS9wcmVnbC8gKGMpIERlYW4gTWNOYW1lZS5cbiAgaW52ZXJ0KGRlc3QpIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoZGVzdCk7XG4gICAgcmV0dXJuICBNYXQ0LiRpbnZlcnQobSk7XG4gIH0sXG5cbiAgJGludmVydChkZXN0KSB7XG4gICAgdmFyIHgwID0gZGVzdFswXSwgIHgxID0gZGVzdFsxXSwgIHgyID0gZGVzdFsyXSwgIHgzID0gZGVzdFszXSxcbiAgICAgICAgeDQgPSBkZXN0WzRdLCAgeDUgPSBkZXN0WzVdLCAgeDYgPSBkZXN0WzZdLCAgeDcgPSBkZXN0WzddLFxuICAgICAgICB4OCA9IGRlc3RbOF0sICB4OSA9IGRlc3RbOV0sIHgxMCA9IGRlc3RbMTBdLCB4MTEgPSBkZXN0WzExXSxcbiAgICAgICAgeDEyID0gZGVzdFsxMl0sIHgxMyA9IGRlc3RbMTNdLCB4MTQgPSBkZXN0WzE0XSwgeDE1ID0gZGVzdFsxNV07XG5cbiAgICB2YXIgYTAgPSB4MCAqIHg1IC0geDEgKiB4NCxcbiAgICAgICAgYTEgPSB4MCAqIHg2IC0geDIgKiB4NCxcbiAgICAgICAgYTIgPSB4MCAqIHg3IC0geDMgKiB4NCxcbiAgICAgICAgYTMgPSB4MSAqIHg2IC0geDIgKiB4NSxcbiAgICAgICAgYTQgPSB4MSAqIHg3IC0geDMgKiB4NSxcbiAgICAgICAgYTUgPSB4MiAqIHg3IC0geDMgKiB4NixcbiAgICAgICAgYjAgPSB4OCAqIHgxMyAtIHg5ICogeDEyLFxuICAgICAgICBiMSA9IHg4ICogeDE0IC0geDEwICogeDEyLFxuICAgICAgICBiMiA9IHg4ICogeDE1IC0geDExICogeDEyLFxuICAgICAgICBiMyA9IHg5ICogeDE0IC0geDEwICogeDEzLFxuICAgICAgICBiNCA9IHg5ICogeDE1IC0geDExICogeDEzLFxuICAgICAgICBiNSA9IHgxMCAqIHgxNSAtIHgxMSAqIHgxNDtcblxuICAgIHZhciBpbnZkZXQgPSAxIC9cbiAgICAgIChhMCAqIGI1IC0gYTEgKiBiNCArIGEyICogYjMgKyBhMyAqIGIyIC0gYTQgKiBiMSArIGE1ICogYjApO1xuXG4gICAgZGVzdFswIF0gPSAoKyB4NSAqIGI1IC0geDYgKiBiNCArIHg3ICogYjMpICogaW52ZGV0O1xuICAgIGRlc3RbMSBdID0gKC0geDEgKiBiNSArIHgyICogYjQgLSB4MyAqIGIzKSAqIGludmRldDtcbiAgICBkZXN0WzIgXSA9ICgrIHgxMyAqIGE1IC0geDE0ICogYTQgKyB4MTUgKiBhMykgKiBpbnZkZXQ7XG4gICAgZGVzdFszIF0gPSAoLSB4OSAqIGE1ICsgeDEwICogYTQgLSB4MTEgKiBhMykgKiBpbnZkZXQ7XG4gICAgZGVzdFs0IF0gPSAoLSB4NCAqIGI1ICsgeDYgKiBiMiAtIHg3ICogYjEpICogaW52ZGV0O1xuICAgIGRlc3RbNSBdID0gKCsgeDAgKiBiNSAtIHgyICogYjIgKyB4MyAqIGIxKSAqIGludmRldDtcbiAgICBkZXN0WzYgXSA9ICgtIHgxMiAqIGE1ICsgeDE0ICogYTIgLSB4MTUgKiBhMSkgKiBpbnZkZXQ7XG4gICAgZGVzdFs3IF0gPSAoKyB4OCAqIGE1IC0geDEwICogYTIgKyB4MTEgKiBhMSkgKiBpbnZkZXQ7XG4gICAgZGVzdFs4IF0gPSAoKyB4NCAqIGI0IC0geDUgKiBiMiArIHg3ICogYjApICogaW52ZGV0O1xuICAgIGRlc3RbOSBdID0gKC0geDAgKiBiNCArIHgxICogYjIgLSB4MyAqIGIwKSAqIGludmRldDtcbiAgICBkZXN0WzEwXSA9ICgrIHgxMiAqIGE0IC0geDEzICogYTIgKyB4MTUgKiBhMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxMV0gPSAoLSB4OCAqIGE0ICsgeDkgKiBhMiAtIHgxMSAqIGEwKSAqIGludmRldDtcbiAgICBkZXN0WzEyXSA9ICgtIHg0ICogYjMgKyB4NSAqIGIxIC0geDYgKiBiMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxM10gPSAoKyB4MCAqIGIzIC0geDEgKiBiMSArIHgyICogYjApICogaW52ZGV0O1xuICAgIGRlc3RbMTRdID0gKC0geDEyICogYTMgKyB4MTMgKiBhMSAtIHgxNCAqIGEwKSAqIGludmRldDtcbiAgICBkZXN0WzE1XSA9ICgrIHg4ICogYTMgLSB4OSAqIGExICsgeDEwICogYTApICogaW52ZGV0O1xuXG4gICAgcmV0dXJuIGRlc3Q7XG5cbiAgfSxcbiAgLy8gVE9ETyhuaWNvKSBicmVha2luZyBjb252ZW50aW9uIGhlcmUuLi5cbiAgLy8gYmVjYXVzZSBJIGRvbid0IHRoaW5rIGl0J3MgdXNlZnVsIHRvIGFkZFxuICAvLyB0d28gbWV0aG9kcyBmb3IgZWFjaCBvZiB0aGVzZS5cbiAgbG9va0F0KGRlc3QsIGV5ZSwgY2VudGVyLCB1cCkge1xuICAgIHZhciB6ID0gVmVjMy5zdWIoZXllLCBjZW50ZXIpO1xuICAgIHouJHVuaXQoKTtcbiAgICB2YXIgeCA9IFZlYzMuY3Jvc3ModXAsIHopO1xuICAgIHguJHVuaXQoKTtcbiAgICB2YXIgeSA9IFZlYzMuY3Jvc3MoeiwgeCk7XG4gICAgeS4kdW5pdCgpO1xuICAgIHJldHVybiBNYXQ0LnNldChkZXN0LCB4WzBdLCB4WzFdLCB4WzJdLCAteC5kb3QoZXllKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeVswXSwgeVsxXSwgeVsyXSwgLXkuZG90KGV5ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHpbMF0sIHpbMV0sIHpbMl0sIC16LmRvdChleWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAwLCAwLCAwLCAxKTtcbiAgfSxcblxuICBmcnVzdHVtKGRlc3QsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHJsID0gcmlnaHQgLSBsZWZ0LFxuICAgICAgICB0YiA9IHRvcCAtIGJvdHRvbSxcbiAgICAgICAgZm4gPSBmYXIgLSBuZWFyO1xuXG4gICAgZGVzdFswXSA9IChuZWFyICogMikgLyBybDtcbiAgICBkZXN0WzFdID0gMDtcbiAgICBkZXN0WzJdID0gMDtcbiAgICBkZXN0WzNdID0gMDtcbiAgICBkZXN0WzRdID0gMDtcbiAgICBkZXN0WzVdID0gKG5lYXIgKiAyKSAvIHRiO1xuICAgIGRlc3RbNl0gPSAwO1xuICAgIGRlc3RbN10gPSAwO1xuICAgIGRlc3RbOF0gPSAocmlnaHQgKyBsZWZ0KSAvIHJsO1xuICAgIGRlc3RbOV0gPSAodG9wICsgYm90dG9tKSAvIHRiO1xuICAgIGRlc3RbMTBdID0gLShmYXIgKyBuZWFyKSAvIGZuO1xuICAgIGRlc3RbMTFdID0gLTE7XG4gICAgZGVzdFsxMl0gPSAwO1xuICAgIGRlc3RbMTNdID0gMDtcbiAgICBkZXN0WzE0XSA9IC0oZmFyICogbmVhciAqIDIpIC8gZm47XG4gICAgZGVzdFsxNV0gPSAwO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgcGVyc3BlY3RpdmUoZGVzdCwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcikge1xuICAgIHZhciB5bWF4ID0gbmVhciAqIHRhbihmb3YgKiBwaSAvIDM2MCksXG4gICAgICAgIHltaW4gPSAteW1heCxcbiAgICAgICAgeG1pbiA9IHltaW4gKiBhc3BlY3QsXG4gICAgICAgIHhtYXggPSB5bWF4ICogYXNwZWN0O1xuXG4gICAgcmV0dXJuIE1hdDQuZnJ1c3R1bShkZXN0LCB4bWluLCB4bWF4LCB5bWluLCB5bWF4LCBuZWFyLCBmYXIpO1xuICB9LFxuXG4gIG9ydGhvKGRlc3QsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHRlID0gdGhpcy5lbGVtZW50cyxcbiAgICAgICAgdyA9IHJpZ2h0IC0gbGVmdCxcbiAgICAgICAgaCA9IHRvcCAtIGJvdHRvbSxcbiAgICAgICAgcCA9IGZhciAtIG5lYXIsXG4gICAgICAgIHggPSAocmlnaHQgKyBsZWZ0KSAvIHcsXG4gICAgICAgIHkgPSAodG9wICsgYm90dG9tKSAvIGgsXG4gICAgICAgIHogPSAoZmFyICsgbmVhcikgLyBwO1xuXG4gICAgZGVzdFswXSA9IDIgLyB3O1x0ZGVzdFs0XSA9IDA7XHRkZXN0WzhdID0gMDtcdGRlc3RbMTJdID0gLXg7XG4gICAgZGVzdFsxXSA9IDA7XHRkZXN0WzVdID0gMiAvIGg7XHRkZXN0WzldID0gMDtcdGRlc3RbMTNdID0gLXk7XG4gICAgZGVzdFsyXSA9IDA7XHRkZXN0WzZdID0gMDtcdGRlc3RbMTBdID0gLTIgLyBwO1x0ZGVzdFsxNF0gPSAtejtcbiAgICBkZXN0WzNdID0gMDtcdGRlc3RbN10gPSAwO1x0ZGVzdFsxMV0gPSAwO1x0ZGVzdFsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG5cdH0sXG5cbiAgdG9GbG9hdDMyQXJyYXkoZGVzdCkge1xuICAgIHZhciBhbnMgPSBkZXN0LnR5cGVkQ29udGFpbmVyO1xuXG4gICAgaWYgKCFhbnMpIHtcbiAgICAgIHJldHVybiBkZXN0O1xuICAgIH1cblxuICAgIGFuc1swXSA9IGRlc3RbMF07XG4gICAgYW5zWzFdID0gZGVzdFsxXTtcbiAgICBhbnNbMl0gPSBkZXN0WzJdO1xuICAgIGFuc1szXSA9IGRlc3RbM107XG4gICAgYW5zWzRdID0gZGVzdFs0XTtcbiAgICBhbnNbNV0gPSBkZXN0WzVdO1xuICAgIGFuc1s2XSA9IGRlc3RbNl07XG4gICAgYW5zWzddID0gZGVzdFs3XTtcbiAgICBhbnNbOF0gPSBkZXN0WzhdO1xuICAgIGFuc1s5XSA9IGRlc3RbOV07XG4gICAgYW5zWzEwXSA9IGRlc3RbMTBdO1xuICAgIGFuc1sxMV0gPSBkZXN0WzExXTtcbiAgICBhbnNbMTJdID0gZGVzdFsxMl07XG4gICAgYW5zWzEzXSA9IGRlc3RbMTNdO1xuICAgIGFuc1sxNF0gPSBkZXN0WzE0XTtcbiAgICBhbnNbMTVdID0gZGVzdFsxNV07XG5cbiAgICByZXR1cm4gYW5zO1xuICB9XG5cbn07XG5cbi8vIGFkZCBnZW5lcmljcyBhbmQgaW5zdGFuY2UgbWV0aG9kc1xucHJvdG8gPSBNYXQ0LnByb3RvdHlwZTtcbmZvciAobWV0aG9kIGluIGdlbmVyaWNzKSB7XG4gIE1hdDRbbWV0aG9kXSA9IGdlbmVyaWNzW21ldGhvZF07XG4gIHByb3RvW21ldGhvZF0gPSAoZnVuY3Rpb24gKG0pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblxuICAgICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgICAgcmV0dXJuIE1hdDRbbV0uYXBwbHkoTWF0NCwgYXJncyk7XG4gICAgfTtcbiB9KShtZXRob2QpO1xufVxuXG4vLyBRdWF0ZXJuaW9uIGNsYXNzXG5leHBvcnQgY2xhc3MgUXVhdCBleHRlbmRzIEFycmF5IHtcbiAgY29uc3RydWN0b3IoeCwgeSwgeiwgdykge1xuICAgIHN1cGVyKDQpO1xuICAgIHRoaXNbMF0gPSB4IHx8IDA7XG4gICAgdGhpc1sxXSA9IHkgfHwgMDtcbiAgICB0aGlzWzJdID0geiB8fCAwO1xuICAgIHRoaXNbM10gPSB3IHx8IDA7XG5cbiAgICB0aGlzLnR5cGVkQ29udGFpbmVyID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUoKSB7XG4gICAgcmV0dXJuIG5ldyBBcnJheSg0KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tVmVjMyh2LCByKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KHZbMF0sIHZbMV0sIHZbMl0sIHIgfHwgMCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbU1hdDQobSkge1xuICAgIHZhciB1O1xuICAgIHZhciB2O1xuICAgIHZhciB3O1xuXG4gICAgLy8gQ2hvb3NlIHUsIHYsIGFuZCB3IHN1Y2ggdGhhdCB1IGlzIHRoZSBpbmRleCBvZiB0aGUgYmlnZ2VzdCBkaWFnb25hbCBlbnRyeVxuICAgIC8vIG9mIG0sIGFuZCB1IHYgdyBpcyBhbiBldmVuIHBlcm11dGF0aW9uIG9mIDAgMSBhbmQgMi5cbiAgICBpZiAobVswXSA+IG1bNV0gJiYgbVswXSA+IG1bMTBdKSB7XG4gICAgICB1ID0gMDtcbiAgICAgIHYgPSAxO1xuICAgICAgdyA9IDI7XG4gICAgfSBlbHNlIGlmIChtWzVdID4gbVswXSAmJiBtWzVdID4gbVsxMF0pIHtcbiAgICAgIHUgPSAxO1xuICAgICAgdiA9IDI7XG4gICAgICB3ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgdSA9IDI7XG4gICAgICB2ID0gMDtcbiAgICAgIHcgPSAxO1xuICAgIH1cblxuICAgIHZhciByID0gc3FydCgxICsgbVt1ICogNV0gLSBtW3YgKiA1XSAtIG1bdyAqIDVdKTtcbiAgICB2YXIgcSA9IG5ldyBRdWF0O1xuXG4gICAgcVt1XSA9IDAuNSAqIHI7XG4gICAgcVt2XSA9IDAuNSAqIChtWyduJyArIHYgKyAnJyArIHVdICsgbVsnbicgKyB1ICsgJycgKyB2XSkgLyByO1xuICAgIHFbd10gPSAwLjUgKiAobVsnbicgKyB1ICsgJycgKyB3XSArIG1bJ24nICsgdyArICcnICsgdV0pIC8gcjtcbiAgICBxWzNdID0gMC41ICogKG1bJ24nICsgdiArICcnICsgd10gLSBtWyduJyArIHcgKyAnJyArIHZdKSAvIHI7XG5cbiAgICByZXR1cm4gcTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tWFJvdGF0aW9uKGFuZ2xlKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KHNpbihhbmdsZSAvIDIpLCAwLCAwLCBjb3MoYW5nbGUgLyAyKSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbVlSb3RhdGlvbihhbmdsZSkge1xuICAgIHJldHVybiBuZXcgUXVhdCgwLCBzaW4oYW5nbGUgLyAyKSwgMCwgY29zKGFuZ2xlIC8gMikpO1xuICB9XG5cbiAgc3RhdGljIGZyb21aUm90YXRpb24oYW5nbGUpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoMCwgMCwgc2luKGFuZ2xlIC8gMiksIGNvcyhhbmdsZSAvIDIpKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tQXhpc1JvdGF0aW9uKHZlYywgYW5nbGUpIHtcbiAgICB2YXIgeCA9IHZlY1swXSxcbiAgICAgICAgeSA9IHZlY1sxXSxcbiAgICAgICAgeiA9IHZlY1syXSxcbiAgICAgICAgZCA9IDEgLyBzcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeiksXG4gICAgICAgIHMgPSBzaW4oYW5nbGUgLyAyKSxcbiAgICAgICAgYyA9IGNvcyhhbmdsZSAvIDIpO1xuXG4gICAgcmV0dXJuIG5ldyBRdWF0KHMgKiB4ICogZCwgcyAqIHkgKiBkLCBzICogeiAqIGQsIGMpO1xuICB9XG5cbn1cblxuZ2VuZXJpY3MgPSB7XG5cbiAgc2V0UXVhdChkZXN0LCBxKSB7XG4gICAgZGVzdFswXSA9IHFbMF07XG4gICAgZGVzdFsxXSA9IHFbMV07XG4gICAgZGVzdFsyXSA9IHFbMl07XG4gICAgZGVzdFszXSA9IHFbM107XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzZXQoZGVzdCwgeCwgeSwgeiwgdykge1xuICAgIGRlc3RbMF0gPSB4IHx8IDA7XG4gICAgZGVzdFsxXSA9IHkgfHwgMDtcbiAgICBkZXN0WzJdID0geiB8fCAwO1xuICAgIGRlc3RbM10gPSB3IHx8IDA7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBjbG9uZShkZXN0KSB7XG4gICAgaWYgKGRlc3QgaW5zdGFuY2VvZiBRdWF0KSB7XG4gICAgICByZXR1cm4gbmV3IFF1YXQoZGVzdFswXSwgZGVzdFsxXSwgZGVzdFsyXSwgZGVzdFszXSk7XG4gICAgfVxuICAgIHJldHVybiBRdWF0LnNldFF1YXQobmV3IHR5cGVkQXJyYXkoNCksIGRlc3QpO1xuICB9LFxuXG4gIG5lZyhkZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KC1kZXN0WzBdLCAtZGVzdFsxXSwgLWRlc3RbMl0sIC1kZXN0WzNdKTtcbiAgfSxcblxuICAkbmVnKGRlc3QpIHtcbiAgICBkZXN0WzBdID0gLWRlc3RbMF07XG4gICAgZGVzdFsxXSA9IC1kZXN0WzFdO1xuICAgIGRlc3RbMl0gPSAtZGVzdFsyXTtcbiAgICBkZXN0WzNdID0gLWRlc3RbM107XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBhZGQoZGVzdCwgcSkge1xuICAgIHJldHVybiBuZXcgUXVhdChkZXN0WzBdICsgcVswXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsxXSArIHFbMV0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMl0gKyBxWzJdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzNdICsgcVszXSk7XG4gIH0sXG5cbiAgJGFkZChkZXN0LCBxKSB7XG4gICAgZGVzdFswXSArPSBxWzBdO1xuICAgIGRlc3RbMV0gKz0gcVsxXTtcbiAgICBkZXN0WzJdICs9IHFbMl07XG4gICAgZGVzdFszXSArPSBxWzNdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc3ViKGRlc3QsIHEpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoZGVzdFswXSAtIHFbMF0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gLSBxWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdIC0gcVsyXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFszXSAtIHFbM10pO1xuICB9LFxuXG4gICRzdWIoZGVzdCwgcSkge1xuICAgIGRlc3RbMF0gLT0gcVswXTtcbiAgICBkZXN0WzFdIC09IHFbMV07XG4gICAgZGVzdFsyXSAtPSBxWzJdO1xuICAgIGRlc3RbM10gLT0gcVszXTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHNjYWxlKGRlc3QsIHMpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoZGVzdFswXSAqIHMsXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICogcyxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFszXSAqIHMpO1xuICB9LFxuXG4gICRzY2FsZShkZXN0LCBzKSB7XG4gICAgZGVzdFswXSAqPSBzO1xuICAgIGRlc3RbMV0gKj0gcztcbiAgICBkZXN0WzJdICo9IHM7XG4gICAgZGVzdFszXSAqPSBzO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgbXVsUXVhdChkZXN0LCBxKSB7XG4gICAgdmFyIGFYID0gZGVzdFswXSxcbiAgICAgICAgYVkgPSBkZXN0WzFdLFxuICAgICAgICBhWiA9IGRlc3RbMl0sXG4gICAgICAgIGFXID0gZGVzdFszXSxcbiAgICAgICAgYlggPSBxWzBdLFxuICAgICAgICBiWSA9IHFbMV0sXG4gICAgICAgIGJaID0gcVsyXSxcbiAgICAgICAgYlcgPSBxWzNdO1xuXG4gICAgcmV0dXJuIG5ldyBRdWF0KGFXICogYlggKyBhWCAqIGJXICsgYVkgKiBiWiAtIGFaICogYlksXG4gICAgICAgICAgICAgICAgICAgIGFXICogYlkgKyBhWSAqIGJXICsgYVogKiBiWCAtIGFYICogYlosXG4gICAgICAgICAgICAgICAgICAgIGFXICogYlogKyBhWiAqIGJXICsgYVggKiBiWSAtIGFZICogYlgsXG4gICAgICAgICAgICAgICAgICAgIGFXICogYlcgLSBhWCAqIGJYIC0gYVkgKiBiWSAtIGFaICogYlopO1xuICB9LFxuXG4gICRtdWxRdWF0KGRlc3QsIHEpIHtcbiAgICB2YXIgYVggPSBkZXN0WzBdLFxuICAgICAgICBhWSA9IGRlc3RbMV0sXG4gICAgICAgIGFaID0gZGVzdFsyXSxcbiAgICAgICAgYVcgPSBkZXN0WzNdLFxuICAgICAgICBiWCA9IHFbMF0sXG4gICAgICAgIGJZID0gcVsxXSxcbiAgICAgICAgYlogPSBxWzJdLFxuICAgICAgICBiVyA9IHFbM107XG5cbiAgICBkZXN0WzBdID0gYVcgKiBiWCArIGFYICogYlcgKyBhWSAqIGJaIC0gYVogKiBiWTtcbiAgICBkZXN0WzFdID0gYVcgKiBiWSArIGFZICogYlcgKyBhWiAqIGJYIC0gYVggKiBiWjtcbiAgICBkZXN0WzJdID0gYVcgKiBiWiArIGFaICogYlcgKyBhWCAqIGJZIC0gYVkgKiBiWDtcbiAgICBkZXN0WzNdID0gYVcgKiBiVyAtIGFYICogYlggLSBhWSAqIGJZIC0gYVogKiBiWjtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGRpdlF1YXQoZGVzdCwgcSkge1xuICAgIHZhciBhWCA9IGRlc3RbMF0sXG4gICAgICAgIGFZID0gZGVzdFsxXSxcbiAgICAgICAgYVogPSBkZXN0WzJdLFxuICAgICAgICBhVyA9IGRlc3RbM10sXG4gICAgICAgIGJYID0gcVswXSxcbiAgICAgICAgYlkgPSBxWzFdLFxuICAgICAgICBiWiA9IHFbMl0sXG4gICAgICAgIGJXID0gcVszXTtcblxuICAgIHZhciBkID0gMSAvIChiVyAqIGJXICsgYlggKiBiWCArIGJZICogYlkgKyBiWiAqIGJaKTtcblxuICAgIHJldHVybiBuZXcgUXVhdCgoYVggKiBiVyAtIGFXICogYlggLSBhWSAqIGJaICsgYVogKiBiWSkgKiBkLFxuICAgICAgICAgICAgICAgICAgICAoYVggKiBiWiAtIGFXICogYlkgKyBhWSAqIGJXIC0gYVogKiBiWCkgKiBkLFxuICAgICAgICAgICAgICAgICAgICAoYVkgKiBiWCArIGFaICogYlcgLSBhVyAqIGJaIC0gYVggKiBiWSkgKiBkLFxuICAgICAgICAgICAgICAgICAgICAoYVcgKiBiVyArIGFYICogYlggKyBhWSAqIGJZICsgYVogKiBiWikgKiBkKTtcbiAgfSxcblxuICAkZGl2UXVhdChkZXN0LCBxKSB7XG4gICAgdmFyIGFYID0gZGVzdFswXSxcbiAgICAgICAgYVkgPSBkZXN0WzFdLFxuICAgICAgICBhWiA9IGRlc3RbMl0sXG4gICAgICAgIGFXID0gZGVzdFszXSxcbiAgICAgICAgYlggPSBxWzBdLFxuICAgICAgICBiWSA9IHFbMV0sXG4gICAgICAgIGJaID0gcVsyXSxcbiAgICAgICAgYlcgPSBxWzNdO1xuXG4gICAgdmFyIGQgPSAxIC8gKGJXICogYlcgKyBiWCAqIGJYICsgYlkgKiBiWSArIGJaICogYlopO1xuXG4gICAgZGVzdFswXSA9IChhWCAqIGJXIC0gYVcgKiBiWCAtIGFZICogYlogKyBhWiAqIGJZKSAqIGQ7XG4gICAgZGVzdFsxXSA9IChhWCAqIGJaIC0gYVcgKiBiWSArIGFZICogYlcgLSBhWiAqIGJYKSAqIGQ7XG4gICAgZGVzdFsyXSA9IChhWSAqIGJYICsgYVogKiBiVyAtIGFXICogYlogLSBhWCAqIGJZKSAqIGQ7XG4gICAgZGVzdFszXSA9IChhVyAqIGJXICsgYVggKiBiWCArIGFZICogYlkgKyBhWiAqIGJaKSAqIGQ7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBpbnZlcnQoZGVzdCkge1xuICAgIHZhciBxMCA9IGRlc3RbMF0sXG4gICAgICAgIHExID0gZGVzdFsxXSxcbiAgICAgICAgcTIgPSBkZXN0WzJdLFxuICAgICAgICBxMyA9IGRlc3RbM107XG5cbiAgICB2YXIgZCA9IDEgLyAocTAgKiBxMCArIHExICogcTEgKyBxMiAqIHEyICsgcTMgKiBxMyk7XG5cbiAgICByZXR1cm4gbmV3IFF1YXQoLXEwICogZCwgLXExICogZCwgLXEyICogZCwgcTMgKiBkKTtcbiAgfSxcblxuICAkaW52ZXJ0KGRlc3QpIHtcbiAgICB2YXIgcTAgPSBkZXN0WzBdLFxuICAgICAgICBxMSA9IGRlc3RbMV0sXG4gICAgICAgIHEyID0gZGVzdFsyXSxcbiAgICAgICAgcTMgPSBkZXN0WzNdO1xuXG4gICAgdmFyIGQgPSAxIC8gKHEwICogcTAgKyBxMSAqIHExICsgcTIgKiBxMiArIHEzICogcTMpO1xuXG4gICAgZGVzdFswXSA9IC1xMCAqIGQ7XG4gICAgZGVzdFsxXSA9IC1xMSAqIGQ7XG4gICAgZGVzdFsyXSA9IC1xMiAqIGQ7XG4gICAgZGVzdFszXSA9IHEzICogZDtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIG5vcm0oZGVzdCkge1xuICAgIHZhciBhID0gZGVzdFswXSxcbiAgICAgICAgYiA9IGRlc3RbMV0sXG4gICAgICAgIGMgPSBkZXN0WzJdLFxuICAgICAgICBkID0gZGVzdFszXTtcblxuICAgIHJldHVybiBzcXJ0KGEgKiBhICsgYiAqIGIgKyBjICogYyArIGQgKiBkKTtcbiAgfSxcblxuICBub3JtU3EoZGVzdCkge1xuICAgIHZhciBhID0gZGVzdFswXSxcbiAgICAgICAgYiA9IGRlc3RbMV0sXG4gICAgICAgIGMgPSBkZXN0WzJdLFxuICAgICAgICBkID0gZGVzdFszXTtcblxuICAgIHJldHVybiBhICogYSArIGIgKiBiICsgYyAqIGMgKyBkICogZDtcbiAgfSxcblxuICB1bml0KGRlc3QpIHtcbiAgICByZXR1cm4gUXVhdC5zY2FsZShkZXN0LCAxIC8gUXVhdC5ub3JtKGRlc3QpKTtcbiAgfSxcblxuICAkdW5pdChkZXN0KSB7XG4gICAgcmV0dXJuIFF1YXQuJHNjYWxlKGRlc3QsIDEgLyBRdWF0Lm5vcm0oZGVzdCkpO1xuICB9LFxuXG4gIGNvbmp1Z2F0ZShkZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KC1kZXN0WzBdLCAtZGVzdFsxXSwgLWRlc3RbMl0sIGRlc3RbM10pO1xuICB9LFxuXG4gICRjb25qdWdhdGUoZGVzdCkge1xuICAgIGRlc3RbMF0gPSAtZGVzdFswXTtcbiAgICBkZXN0WzFdID0gLWRlc3RbMV07XG4gICAgZGVzdFsyXSA9IC1kZXN0WzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9XG59O1xuXG4vLyBhZGQgZ2VuZXJpY3MgYW5kIGluc3RhbmNlIG1ldGhvZHNcblxucHJvdG8gPSBRdWF0LnByb3RvdHlwZSA9IHt9O1xuXG5mb3IgKG1ldGhvZCBpbiBnZW5lcmljcykge1xuICBRdWF0W21ldGhvZF0gPSBnZW5lcmljc1ttZXRob2RdO1xuICBwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICAgIHJldHVybiBRdWF0W21dLmFwcGx5KFF1YXQsIGFyZ3MpO1xuICAgIH07XG4gfSkobWV0aG9kKTtcbn1cblxuLy8gQWRkIHN0YXRpYyBtZXRob2RzXG5WZWMzLmZyb21RdWF0ID0gZnVuY3Rpb24ocSkge1xuICByZXR1cm4gbmV3IFZlYzMocVswXSwgcVsxXSwgcVsyXSk7XG59O1xuXG5NYXQ0LmZyb21RdWF0ID0gZnVuY3Rpb24ocSkge1xuICB2YXIgYSA9IHFbM10sXG4gICAgICBiID0gcVswXSxcbiAgICAgIGMgPSBxWzFdLFxuICAgICAgZCA9IHFbMl07XG5cbiAgcmV0dXJuIG5ldyBNYXQ0KFxuICAgIGEgKiBhICsgYiAqIGIgLSBjICogYyAtIGQgKiBkLFxuICAgIDIgKiBiICogYyAtIDIgKiBhICogZCxcbiAgICAyICogYiAqIGQgKyAyICogYSAqIGMsXG4gICAgMCxcblxuICAgIDIgKiBiICogYyArIDIgKiBhICogZCxcbiAgICBhICogYSAtIGIgKiBiICsgYyAqIGMgLSBkICogZCxcbiAgICAyICogYyAqIGQgLSAyICogYSAqIGIsXG4gICAgMCxcblxuICAgIDIgKiBiICogZCAtIDIgKiBhICogYyxcbiAgICAyICogYyAqIGQgKyAyICogYSAqIGIsXG4gICAgYSAqIGEgLSBiICogYiAtIGMgKiBjICsgZCAqIGQsXG4gICAgMCxcblxuICAgIDAsIDAsIDAsIDEpO1xufTtcbiJdfQ==