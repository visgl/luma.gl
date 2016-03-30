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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRoL2FycmF5LWltcGwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxJQUFNLE9BQU8sS0FBSyxJQUFMO0FBQ2IsSUFBTSxNQUFNLEtBQUssR0FBTDtBQUNaLElBQU0sTUFBTSxLQUFLLEdBQUw7QUFDWixJQUFNLE1BQU0sS0FBSyxHQUFMO0FBQ1osSUFBTSxLQUFLLEtBQUssRUFBTDtBQUNYLElBQU0sUUFBUSxNQUFNLFNBQU4sQ0FBZ0IsS0FBaEI7Ozs7SUFHRDs7O0FBRVgsV0FGVyxJQUVYLEdBQWlDO1FBQXJCLDBEQUFJLGlCQUFpQjtRQUFkLDBEQUFJLGlCQUFVO1FBQVAsMERBQUksaUJBQUc7OzBCQUZ0QixNQUVzQjs7dUVBRnRCLGlCQUdILElBRHlCOztBQUUvQixVQUFLLENBQUwsSUFBVSxDQUFWLENBRitCO0FBRy9CLFVBQUssQ0FBTCxJQUFVLENBQVYsQ0FIK0I7QUFJL0IsVUFBSyxDQUFMLElBQVUsQ0FBVixDQUorQjs7R0FBakM7Ozs7O2VBRlc7O3dCQWNIO0FBQ04sYUFBTyxLQUFLLENBQUwsQ0FBUCxDQURNOztzQkFJRixPQUFPO0FBQ1gsYUFBUSxLQUFLLENBQUwsSUFBVSxLQUFWLENBREc7Ozs7d0JBSUw7QUFDTixhQUFPLEtBQUssQ0FBTCxDQUFQLENBRE07O3NCQUlGLE9BQU87QUFDWCxhQUFRLEtBQUssQ0FBTCxJQUFVLEtBQVYsQ0FERzs7Ozt3QkFJTDtBQUNOLGFBQU8sS0FBSyxDQUFMLENBQVAsQ0FETTs7c0JBSUYsT0FBTztBQUNYLGFBQVEsS0FBSyxDQUFMLElBQVUsS0FBVixDQURHOzs7OzZCQXhCRztBQUNkLGFBQU8sSUFBSSxJQUFKLENBQVMsQ0FBVCxDQUFQLENBRGM7Ozs7U0FWTDtxQkFBYTs7QUF1QzFCLElBQUks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QUUsQ0FBRixDQUFULEVBQWUsRUFBRSxDQUFGLENBQWYsRUFBcUIsRUFBRSxDQUFGLENBQXJCLENBQVAsQ0FEMEI7Q0FBWjs7QUFJaEIsS0FBSyxRQUFMLEdBQWdCLFVBQVMsQ0FBVCxFQUFZO0FBQzFCLE1BQUksSUFBSSxFQUFFLENBQUYsQ0FBSjtNQUNBLElBQUksRUFBRSxDQUFGLENBQUo7TUFDQSxJQUFJLEVBQUUsQ0FBRixDQUFKO01BQ0EsSUFBSSxFQUFFLENBQUYsQ0FBSixDQUpzQjs7QUFNMUIsU0FBTyxJQUFJLElBQUosQ0FDTCxJQUFJLENBQUosR0FBUSxJQUFJLENBQUosR0FBUSxJQUFJLENBQUosR0FBUSxJQUFJLENBQUosRUFDeEIsSUFBSSxDQUFKLEdBQVEsQ0FBUixHQUFZLElBQUksQ0FBSixHQUFRLENBQVIsRUFDWixJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FBUixFQUNaLENBSkssRUFNTCxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FBUixFQUNaLElBQUksQ0FBSixHQUFRLElBQUksQ0FBSixHQUFRLElBQUksQ0FBSixHQUFRLElBQUksQ0FBSixFQUN4QixJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FBUixFQUNaLENBVEssRUFXTCxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksSUFBSSxDQUFKLEdBQVEsQ0FBUixFQUNaLElBQUksQ0FBSixHQUFRLENBQVIsR0FBWSxJQUFJLENBQUosR0FBUSxDQUFSLEVBQ1osSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFKLEdBQVEsSUFBSSxDQUFKLEVBQ3hCLENBZEssRUFnQkwsQ0FoQkssRUFnQkYsQ0FoQkUsRUFnQkMsQ0FoQkQsRUFnQkksQ0FoQkosQ0FBUCxDQU4wQjtDQUFaIiwiZmlsZSI6ImFycmF5LWltcGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBWZWMzLCBNYXQ0IGFuZCBRdWF0IGNsYXNzZXNcbi8vIFRPRE8gLSBjbGVhbiB1cCBsaW50aW5nIGFuZCByZW1vdmUgc29tZSBvZiB0aGVzZSBleGNlcHRpb25zXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgY29tcHV0ZWQtcHJvcGVydHktc3BhY2luZywgYnJhY2Utc3R5bGUsIG1heC1wYXJhbXMsIG9uZS12YXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIGluZGVudCwgbm8tbG9vcC1mdW5jICovXG5cbmNvbnN0IHNxcnQgPSBNYXRoLnNxcnQ7XG5jb25zdCBzaW4gPSBNYXRoLnNpbjtcbmNvbnN0IGNvcyA9IE1hdGguY29zO1xuY29uc3QgdGFuID0gTWF0aC50YW47XG5jb25zdCBwaSA9IE1hdGguUEk7XG5jb25zdCBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuLy8gVmVjMyBDbGFzc1xuZXhwb3J0IGNsYXNzIFZlYzMgZXh0ZW5kcyBBcnJheSB7XG5cbiAgY29uc3RydWN0b3IoeCA9IDAsIHkgPSAwLCB6ID0gMCkge1xuICAgIHN1cGVyKDMpO1xuICAgIHRoaXNbMF0gPSB4O1xuICAgIHRoaXNbMV0gPSB5O1xuICAgIHRoaXNbMl0gPSB6O1xuICB9XG5cbiAgLy8gZmFzdCBWZWMzIGNyZWF0ZS5cbiAgc3RhdGljIGNyZWF0ZSgpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoMyk7XG4gIH1cblxuICBnZXQgeCgpIHtcbiAgICByZXR1cm4gdGhpc1swXTtcbiAgfVxuXG4gIHNldCB4KHZhbHVlKSB7XG4gICAgcmV0dXJuICh0aGlzWzBdID0gdmFsdWUpO1xuICB9XG5cbiAgZ2V0IHkoKSB7XG4gICAgcmV0dXJuIHRoaXNbMV07XG4gIH1cblxuICBzZXQgeSh2YWx1ZSkge1xuICAgIHJldHVybiAodGhpc1sxXSA9IHZhbHVlKTtcbiAgfVxuXG4gIGdldCB6KCkge1xuICAgIHJldHVybiB0aGlzWzJdO1xuICB9XG5cbiAgc2V0IHoodmFsdWUpIHtcbiAgICByZXR1cm4gKHRoaXNbMl0gPSB2YWx1ZSk7XG4gIH1cbn1cblxudmFyIGdlbmVyaWNzID0ge1xuXG4gIHNldFZlYzMoZGVzdCwgdmVjKSB7XG4gICAgZGVzdFswXSA9IHZlY1swXTtcbiAgICBkZXN0WzFdID0gdmVjWzFdO1xuICAgIGRlc3RbMl0gPSB2ZWNbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc2V0KGRlc3QsIHgsIHksIHopIHtcbiAgICBkZXN0WzBdID0geDtcbiAgICBkZXN0WzFdID0geTtcbiAgICBkZXN0WzJdID0gejtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBhZGQoZGVzdCwgdmVjKSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKGRlc3RbMF0gKyB2ZWNbMF0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKyB2ZWNbMV0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMl0gKyB2ZWNbMl0pO1xuICB9LFxuXG4gICRhZGQoZGVzdCwgdmVjKSB7XG4gICAgZGVzdFswXSArPSB2ZWNbMF07XG4gICAgZGVzdFsxXSArPSB2ZWNbMV07XG4gICAgZGVzdFsyXSArPSB2ZWNbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgYWRkMihkZXN0LCBhLCBiKSB7XG4gICAgZGVzdFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIGRlc3RbMV0gPSBhWzFdICsgYlsxXTtcbiAgICBkZXN0WzJdID0gYVsyXSArIGJbMl07XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc3ViKGRlc3QsIHZlYykge1xuICAgIHJldHVybiBuZXcgVmVjMyhkZXN0WzBdIC0gdmVjWzBdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdIC0gdmVjWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdIC0gdmVjWzJdKTtcbiAgfSxcblxuICAkc3ViKGRlc3QsIHZlYykge1xuICAgIGRlc3RbMF0gLT0gdmVjWzBdO1xuICAgIGRlc3RbMV0gLT0gdmVjWzFdO1xuICAgIGRlc3RbMl0gLT0gdmVjWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHN1YjIoZGVzdCwgYSwgYikge1xuICAgIGRlc3RbMF0gPSBhWzBdIC0gYlswXTtcbiAgICBkZXN0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgZGVzdFsyXSA9IGFbMl0gLSBiWzJdO1xuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHNjYWxlKGRlc3QsIHMpIHtcbiAgICByZXR1cm4gbmV3IFZlYzMoZGVzdFswXSAqIHMsXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICogcyk7XG4gIH0sXG5cbiAgJHNjYWxlKGRlc3QsIHMpIHtcbiAgICBkZXN0WzBdICo9IHM7XG4gICAgZGVzdFsxXSAqPSBzO1xuICAgIGRlc3RbMl0gKj0gcztcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBuZWcoZGVzdCkge1xuICAgIHJldHVybiBuZXcgVmVjMygtZGVzdFswXSxcbiAgICAgICAgICAgICAgICAgICAgLWRlc3RbMV0sXG4gICAgICAgICAgICAgICAgICAgIC1kZXN0WzJdKTtcbiAgfSxcblxuICAkbmVnKGRlc3QpIHtcbiAgICBkZXN0WzBdID0gLWRlc3RbMF07XG4gICAgZGVzdFsxXSA9IC1kZXN0WzFdO1xuICAgIGRlc3RbMl0gPSAtZGVzdFsyXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICB1bml0KGRlc3QpIHtcbiAgICB2YXIgbGVuID0gVmVjMy5ub3JtKGRlc3QpO1xuXG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgIHJldHVybiBWZWMzLnNjYWxlKGRlc3QsIDEgLyBsZW4pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjMy5jbG9uZShkZXN0KTtcbiAgfSxcblxuICAkdW5pdChkZXN0KSB7XG4gICAgdmFyIGxlbiA9IFZlYzMubm9ybShkZXN0KTtcblxuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICByZXR1cm4gVmVjMy4kc2NhbGUoZGVzdCwgMSAvIGxlbik7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGNyb3NzKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sXG4gICAgICBkeSA9IGRlc3RbMV0sXG4gICAgICBkeiA9IGRlc3RbMl0sXG4gICAgICB2eCA9IHZlY1swXSxcbiAgICAgIHZ5ID0gdmVjWzFdLFxuICAgICAgdnogPSB2ZWNbMl07XG5cbiAgICByZXR1cm4gbmV3IFZlYzMoZHkgKiB2eiAtIGR6ICogdnksXG4gICAgICAgICAgICAgICAgICAgIGR6ICogdnggLSBkeCAqIHZ6LFxuICAgICAgICAgICAgICAgICAgICBkeCAqIHZ5IC0gZHkgKiB2eCk7XG4gIH0sXG5cbiAgJGNyb3NzKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sXG4gICAgICAgIGR5ID0gZGVzdFsxXSxcbiAgICAgICAgZHogPSBkZXN0WzJdLFxuICAgICAgICB2eCA9IHZlY1swXSxcbiAgICAgICAgdnkgPSB2ZWNbMV0sXG4gICAgICAgIHZ6ID0gdmVjWzJdO1xuXG4gICAgZGVzdFswXSA9IGR5ICogdnogLSBkeiAqIHZ5O1xuICAgIGRlc3RbMV0gPSBkeiAqIHZ4IC0gZHggKiB2ejtcbiAgICBkZXN0WzJdID0gZHggKiB2eSAtIGR5ICogdng7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgZGlzdFRvKGRlc3QsIHZlYykge1xuICAgIHZhciBkeCA9IGRlc3RbMF0gLSB2ZWNbMF0sXG4gICAgICAgIGR5ID0gZGVzdFsxXSAtIHZlY1sxXSxcbiAgICAgICAgZHogPSBkZXN0WzJdIC0gdmVjWzJdO1xuXG4gICAgcmV0dXJuIHNxcnQoZHggKiBkeCArXG4gICAgICAgICAgICAgICAgZHkgKiBkeSArXG4gICAgICAgICAgICAgICAgZHogKiBkeik7XG4gIH0sXG5cbiAgZGlzdFRvU3EoZGVzdCwgdmVjKSB7XG4gICAgdmFyIGR4ID0gZGVzdFswXSAtIHZlY1swXSxcbiAgICAgICAgZHkgPSBkZXN0WzFdIC0gdmVjWzFdLFxuICAgICAgICBkeiA9IGRlc3RbMl0gLSB2ZWNbMl07XG5cbiAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6O1xuICB9LFxuXG4gIG5vcm0oZGVzdCkge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sIGR5ID0gZGVzdFsxXSwgZHogPSBkZXN0WzJdO1xuXG4gICAgcmV0dXJuIHNxcnQoZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6KTtcbiAgfSxcblxuICBub3JtU3EoZGVzdCkge1xuICAgIHZhciBkeCA9IGRlc3RbMF0sIGR5ID0gZGVzdFsxXSwgZHogPSBkZXN0WzJdO1xuXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcbiAgfSxcblxuICBkb3QoZGVzdCwgdmVjKSB7XG4gICAgcmV0dXJuIGRlc3RbMF0gKiB2ZWNbMF0gKyBkZXN0WzFdICogdmVjWzFdICsgZGVzdFsyXSAqIHZlY1syXTtcbiAgfSxcblxuICBjbG9uZShkZXN0KSB7XG4gICAgaWYgKGRlc3QgaW5zdGFuY2VvZiBWZWMzKSB7XG4gICAgICByZXR1cm4gbmV3IFZlYzMoZGVzdFswXSwgZGVzdFsxXSwgZGVzdFsyXSk7XG4gICAgfVxuICAgIHJldHVybiBWZWMzLnNldFZlYzMobmV3IEZsb2F0MzJBcnJheSgzKSwgZGVzdCk7XG4gIH0sXG5cbiAgdG9GbG9hdDMyQXJyYXkoZGVzdCkge1xuICAgIHZhciBhbnMgPSBkZXN0LnR5cGVkQ29udGFpbmVyO1xuXG4gICAgaWYgKCFhbnMpIHtcbiAgICAgIHJldHVybiBkZXN0O1xuICAgIH1cblxuICAgIGFuc1swXSA9IGRlc3RbMF07XG4gICAgYW5zWzFdID0gZGVzdFsxXTtcbiAgICBhbnNbMl0gPSBkZXN0WzJdO1xuXG4gICAgcmV0dXJuIGFucztcbiAgfVxufTtcblxuLy8gYWRkIGdlbmVyaWNzIGFuZCBpbnN0YW5jZSBtZXRob2RzXG52YXIgcHJvdG8gPSBWZWMzLnByb3RvdHlwZTtcbmZvciAodmFyIG1ldGhvZCBpbiBnZW5lcmljcykge1xuICBWZWMzW21ldGhvZF0gPSBnZW5lcmljc1ttZXRob2RdO1xuICBwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIF8obSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgICAgcmV0dXJuIFZlYzNbbV0uYXBwbHkoVmVjMywgYXJncyk7XG4gICAgfTtcbiB9KG1ldGhvZCkpO1xufVxuXG4vLyBNYXQ0IENsYXNzXG5leHBvcnQgY2xhc3MgTWF0NCBleHRlbmRzIEFycmF5IHtcblxuICBjb25zdHJ1Y3RvcihuMTEsIG4xMiwgbjEzLCBuMTQsXG4gICAgICAgICAgICAgIG4yMSwgbjIyLCBuMjMsIG4yNCxcbiAgICAgICAgICAgICAgbjMxLCBuMzIsIG4zMywgbjM0LFxuICAgICAgICAgICAgICBuNDEsIG40MiwgbjQzLCBuNDQpIHtcblxuICAgIHN1cGVyKDE2KTtcblxuICAgIHRoaXMubGVuZ3RoID0gMTY7XG5cbiAgICBpZiAodHlwZW9mIG4xMSA9PT0gJ251bWJlcicpIHtcblxuICAgICAgdGhpcy5zZXQobjExLCBuMTIsIG4xMywgbjE0LFxuICAgICAgICAgICAgICAgbjIxLCBuMjIsIG4yMywgbjI0LFxuICAgICAgICAgICAgICAgbjMxLCBuMzIsIG4zMywgbjM0LFxuICAgICAgICAgICAgICAgbjQxLCBuNDIsIG40MywgbjQ0KTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlkKCk7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlZENvbnRhaW5lciA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZSgpIHtcbiAgICByZXR1cm4gbmV3IEFycmF5KDE2KTtcbiAgfVxuXG4gIGdldCBuMTEoKSB7IHJldHVybiB0aGlzWzBdOyB9XG4gIGdldCBuMTIoKSB7IHJldHVybiB0aGlzWzRdOyB9XG4gIGdldCBuMTMoKSB7IHJldHVybiB0aGlzWzhdOyB9XG4gIGdldCBuMTQoKSB7IHJldHVybiB0aGlzWzEyXTsgfVxuICBnZXQgbjIxKCkgeyByZXR1cm4gdGhpc1sxXTsgfVxuICBnZXQgbjIyKCkgeyByZXR1cm4gdGhpc1s1XTsgfVxuICBnZXQgbjIzKCkgeyByZXR1cm4gdGhpc1s5XTsgfVxuICBnZXQgbjI0KCkgeyByZXR1cm4gdGhpc1sxM107IH1cbiAgZ2V0IG4zMSgpIHsgcmV0dXJuIHRoaXNbMl07IH1cbiAgZ2V0IG4zMigpIHsgcmV0dXJuIHRoaXNbNl07IH1cbiAgZ2V0IG4zMygpIHsgcmV0dXJuIHRoaXNbMTBdOyB9XG4gIGdldCBuMzQoKSB7IHJldHVybiB0aGlzWzE0XTsgfVxuICBnZXQgbjQxKCkgeyByZXR1cm4gdGhpc1szXTsgfVxuICBnZXQgbjQyKCkgeyByZXR1cm4gdGhpc1s3XTsgfVxuICBnZXQgbjQzKCkgeyByZXR1cm4gdGhpc1sxMV07IH1cbiAgZ2V0IG40NCgpIHsgcmV0dXJuIHRoaXNbMTVdOyB9XG5cbiAgc2V0IG4xMSh2YWwpIHsgdGhpc1swXSA9IHZhbDsgfVxuICBzZXQgbjEyKHZhbCkgeyB0aGlzWzRdID0gdmFsOyB9XG4gIHNldCBuMTModmFsKSB7IHRoaXNbOF0gPSB2YWw7IH1cbiAgc2V0IG4xNCh2YWwpIHsgdGhpc1sxMl0gPSB2YWw7IH1cbiAgc2V0IG4yMSh2YWwpIHsgdGhpc1sxXSA9IHZhbDsgfVxuICBzZXQgbjIyKHZhbCkgeyB0aGlzWzVdID0gdmFsOyB9XG4gIHNldCBuMjModmFsKSB7IHRoaXNbOV0gPSB2YWw7IH1cbiAgc2V0IG4yNCh2YWwpIHsgdGhpc1sxM10gPSB2YWw7IH1cbiAgc2V0IG4zMSh2YWwpIHsgdGhpc1syXSA9IHZhbDsgfVxuICBzZXQgbjMyKHZhbCkgeyB0aGlzWzZdID0gdmFsOyB9XG4gIHNldCBuMzModmFsKSB7IHRoaXNbMTBdID0gdmFsOyB9XG4gIHNldCBuMzQodmFsKSB7IHRoaXNbMTRdID0gdmFsOyB9XG4gIHNldCBuNDEodmFsKSB7IHRoaXNbM10gPSB2YWw7IH1cbiAgc2V0IG40Mih2YWwpIHsgdGhpc1s3XSA9IHZhbDsgfVxuICBzZXQgbjQzKHZhbCkgeyB0aGlzWzExXSA9IHZhbDsgfVxuICBzZXQgbjQ0KHZhbCkgeyB0aGlzWzE1XSA9IHZhbDsgfVxuXG59XG5cbmdlbmVyaWNzID0ge1xuXG4gIGlkKGRlc3QpIHtcblxuICAgIGRlc3RbMCBdID0gMTtcbiAgICBkZXN0WzEgXSA9IDA7XG4gICAgZGVzdFsyIF0gPSAwO1xuICAgIGRlc3RbMyBdID0gMDtcbiAgICBkZXN0WzQgXSA9IDA7XG4gICAgZGVzdFs1IF0gPSAxO1xuICAgIGRlc3RbNiBdID0gMDtcbiAgICBkZXN0WzcgXSA9IDA7XG4gICAgZGVzdFs4IF0gPSAwO1xuICAgIGRlc3RbOSBdID0gMDtcbiAgICBkZXN0WzEwXSA9IDE7XG4gICAgZGVzdFsxMV0gPSAwO1xuICAgIGRlc3RbMTJdID0gMDtcbiAgICBkZXN0WzEzXSA9IDA7XG4gICAgZGVzdFsxNF0gPSAwO1xuICAgIGRlc3RbMTVdID0gMTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIGNsb25lKGRlc3QpIHtcbiAgICBpZiAoZGVzdCBpbnN0YW5jZW9mIE1hdDQpIHtcbiAgICAgIHJldHVybiBuZXcgTWF0NChkZXN0WzBdLCBkZXN0WzRdLCBkZXN0WzhdLCBkZXN0WzEyXSxcbiAgICAgICAgICAgICAgICAgICAgICBkZXN0WzFdLCBkZXN0WzVdLCBkZXN0WzldLCBkZXN0WzEzXSxcbiAgICAgICAgICAgICAgICAgICAgICBkZXN0WzJdLCBkZXN0WzZdLCBkZXN0WzEwXSwgZGVzdFsxNF0sXG4gICAgICAgICAgICAgICAgICAgICAgZGVzdFszXSwgZGVzdFs3XSwgZGVzdFsxMV0sIGRlc3RbMTVdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyB0eXBlZEFycmF5KGRlc3QpO1xuICB9LFxuXG4gIHNldChkZXN0LCBuMTEsIG4xMiwgbjEzLCBuMTQsXG4gICAgICAgICAgICBuMjEsIG4yMiwgbjIzLCBuMjQsXG4gICAgICAgICAgICBuMzEsIG4zMiwgbjMzLCBuMzQsXG4gICAgICAgICAgICBuNDEsIG40MiwgbjQzLCBuNDQpIHtcblxuICAgIGRlc3RbMCBdID0gbjExO1xuICAgIGRlc3RbNCBdID0gbjEyO1xuICAgIGRlc3RbOCBdID0gbjEzO1xuICAgIGRlc3RbMTJdID0gbjE0O1xuICAgIGRlc3RbMSBdID0gbjIxO1xuICAgIGRlc3RbNSBdID0gbjIyO1xuICAgIGRlc3RbOSBdID0gbjIzO1xuICAgIGRlc3RbMTNdID0gbjI0O1xuICAgIGRlc3RbMiBdID0gbjMxO1xuICAgIGRlc3RbNiBdID0gbjMyO1xuICAgIGRlc3RbMTBdID0gbjMzO1xuICAgIGRlc3RbMTRdID0gbjM0O1xuICAgIGRlc3RbMyBdID0gbjQxO1xuICAgIGRlc3RbNyBdID0gbjQyO1xuICAgIGRlc3RbMTFdID0gbjQzO1xuICAgIGRlc3RbMTVdID0gbjQ0O1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgbXVsVmVjMyhkZXN0LCB2ZWMpIHtcbiAgICB2YXIgYW5zID0gVmVjMy5jbG9uZSh2ZWMpO1xuICAgIHJldHVybiBNYXQ0LiRtdWxWZWMzKGRlc3QsIGFucyk7XG4gIH0sXG5cbiAgJG11bFZlYzMoZGVzdCwgdmVjKSB7XG4gICAgdmFyIHZ4ID0gdmVjWzBdLFxuICAgICAgICB2eSA9IHZlY1sxXSxcbiAgICAgICAgdnogPSB2ZWNbMl0sXG4gICAgICAgIGQgPSAxIC8gKGRlc3RbM10gKiB2eCArIGRlc3RbN10gKiB2eSArIGRlc3RbMTFdICogdnogKyBkZXN0WzE1XSk7XG5cbiAgICB2ZWNbMF0gPSAoZGVzdFswXSAqIHZ4ICsgZGVzdFs0XSAqIHZ5ICsgZGVzdFs4IF0gKiB2eiArIGRlc3RbMTJdKSAqIGQ7XG4gICAgdmVjWzFdID0gKGRlc3RbMV0gKiB2eCArIGRlc3RbNV0gKiB2eSArIGRlc3RbOSBdICogdnogKyBkZXN0WzEzXSkgKiBkO1xuICAgIHZlY1syXSA9IChkZXN0WzJdICogdnggKyBkZXN0WzZdICogdnkgKyBkZXN0WzEwXSAqIHZ6ICsgZGVzdFsxNF0pICogZDtcblxuICAgIHJldHVybiB2ZWM7XG4gIH0sXG5cbiAgbXVsTWF0NDIoZGVzdCwgYSwgYikge1xuICAgIHZhciBhMTEgPSBhWzAgXSwgYTEyID0gYVsxIF0sIGExMyA9IGFbMiBdLCBhMTQgPSBhWzMgXSxcbiAgICAgICAgYTIxID0gYVs0IF0sIGEyMiA9IGFbNSBdLCBhMjMgPSBhWzYgXSwgYTI0ID0gYVs3IF0sXG4gICAgICAgIGEzMSA9IGFbOCBdLCBhMzIgPSBhWzkgXSwgYTMzID0gYVsxMF0sIGEzNCA9IGFbMTFdLFxuICAgICAgICBhNDEgPSBhWzEyXSwgYTQyID0gYVsxM10sIGE0MyA9IGFbMTRdLCBhNDQgPSBhWzE1XSxcbiAgICAgICAgYjExID0gYlswIF0sIGIxMiA9IGJbMSBdLCBiMTMgPSBiWzIgXSwgYjE0ID0gYlszIF0sXG4gICAgICAgIGIyMSA9IGJbNCBdLCBiMjIgPSBiWzUgXSwgYjIzID0gYls2IF0sIGIyNCA9IGJbNyBdLFxuICAgICAgICBiMzEgPSBiWzggXSwgYjMyID0gYls5IF0sIGIzMyA9IGJbMTBdLCBiMzQgPSBiWzExXSxcbiAgICAgICAgYjQxID0gYlsxMl0sIGI0MiA9IGJbMTNdLCBiNDMgPSBiWzE0XSwgYjQ0ID0gYlsxNV07XG5cbiAgICBkZXN0WzAgXSA9IGIxMSAqIGExMSArIGIxMiAqIGEyMSArIGIxMyAqIGEzMSArIGIxNCAqIGE0MTtcbiAgICBkZXN0WzEgXSA9IGIxMSAqIGExMiArIGIxMiAqIGEyMiArIGIxMyAqIGEzMiArIGIxNCAqIGE0MjtcbiAgICBkZXN0WzIgXSA9IGIxMSAqIGExMyArIGIxMiAqIGEyMyArIGIxMyAqIGEzMyArIGIxNCAqIGE0MztcbiAgICBkZXN0WzMgXSA9IGIxMSAqIGExNCArIGIxMiAqIGEyNCArIGIxMyAqIGEzNCArIGIxNCAqIGE0NDtcblxuICAgIGRlc3RbNCBdID0gYjIxICogYTExICsgYjIyICogYTIxICsgYjIzICogYTMxICsgYjI0ICogYTQxO1xuICAgIGRlc3RbNSBdID0gYjIxICogYTEyICsgYjIyICogYTIyICsgYjIzICogYTMyICsgYjI0ICogYTQyO1xuICAgIGRlc3RbNiBdID0gYjIxICogYTEzICsgYjIyICogYTIzICsgYjIzICogYTMzICsgYjI0ICogYTQzO1xuICAgIGRlc3RbNyBdID0gYjIxICogYTE0ICsgYjIyICogYTI0ICsgYjIzICogYTM0ICsgYjI0ICogYTQ0O1xuXG4gICAgZGVzdFs4IF0gPSBiMzEgKiBhMTEgKyBiMzIgKiBhMjEgKyBiMzMgKiBhMzEgKyBiMzQgKiBhNDE7XG4gICAgZGVzdFs5IF0gPSBiMzEgKiBhMTIgKyBiMzIgKiBhMjIgKyBiMzMgKiBhMzIgKyBiMzQgKiBhNDI7XG4gICAgZGVzdFsxMF0gPSBiMzEgKiBhMTMgKyBiMzIgKiBhMjMgKyBiMzMgKiBhMzMgKyBiMzQgKiBhNDM7XG4gICAgZGVzdFsxMV0gPSBiMzEgKiBhMTQgKyBiMzIgKiBhMjQgKyBiMzMgKiBhMzQgKyBiMzQgKiBhNDQ7XG5cbiAgICBkZXN0WzEyXSA9IGI0MSAqIGExMSArIGI0MiAqIGEyMSArIGI0MyAqIGEzMSArIGI0NCAqIGE0MTtcbiAgICBkZXN0WzEzXSA9IGI0MSAqIGExMiArIGI0MiAqIGEyMiArIGI0MyAqIGEzMiArIGI0NCAqIGE0MjtcbiAgICBkZXN0WzE0XSA9IGI0MSAqIGExMyArIGI0MiAqIGEyMyArIGI0MyAqIGEzMyArIGI0NCAqIGE0MztcbiAgICBkZXN0WzE1XSA9IGI0MSAqIGExNCArIGI0MiAqIGEyNCArIGI0MyAqIGEzNCArIGI0NCAqIGE0NDtcbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBtdWxNYXQ0KGEsIGIpIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoYSk7XG4gICAgcmV0dXJuIE1hdDQubXVsTWF0NDIobSwgYSwgYik7XG4gIH0sXG5cbiAgJG11bE1hdDQoYSwgYikge1xuICAgIHJldHVybiBNYXQ0Lm11bE1hdDQyKGEsIGEsIGIpO1xuICB9LFxuXG4gIGFkZChkZXN0LCBtKSB7XG4gICAgdmFyIGNvcHkgPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRhZGQoY29weSwgbSk7XG4gIH0sXG5cbiAgJGFkZChkZXN0LCBtKSB7XG4gICAgZGVzdFswIF0gKz0gbVswXTtcbiAgICBkZXN0WzEgXSArPSBtWzFdO1xuICAgIGRlc3RbMiBdICs9IG1bMl07XG4gICAgZGVzdFszIF0gKz0gbVszXTtcbiAgICBkZXN0WzQgXSArPSBtWzRdO1xuICAgIGRlc3RbNSBdICs9IG1bNV07XG4gICAgZGVzdFs2IF0gKz0gbVs2XTtcbiAgICBkZXN0WzcgXSArPSBtWzddO1xuICAgIGRlc3RbOCBdICs9IG1bOF07XG4gICAgZGVzdFs5IF0gKz0gbVs5XTtcbiAgICBkZXN0WzEwXSArPSBtWzEwXTtcbiAgICBkZXN0WzExXSArPSBtWzExXTtcbiAgICBkZXN0WzEyXSArPSBtWzEyXTtcbiAgICBkZXN0WzEzXSArPSBtWzEzXTtcbiAgICBkZXN0WzE0XSArPSBtWzE0XTtcbiAgICBkZXN0WzE1XSArPSBtWzE1XTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHRyYW5zcG9zZShkZXN0KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiR0cmFuc3Bvc2UobSk7XG4gIH0sXG5cbiAgJHRyYW5zcG9zZShkZXN0KSB7XG4gICAgdmFyIG40ID0gZGVzdFs0XSwgbjggPSBkZXN0WzhdLCBuMTIgPSBkZXN0WzEyXSxcbiAgICAgICAgbjEgPSBkZXN0WzFdLCBuOSA9IGRlc3RbOV0sIG4xMyA9IGRlc3RbMTNdLFxuICAgICAgICBuMiA9IGRlc3RbMl0sIG42ID0gZGVzdFs2XSwgbjE0ID0gZGVzdFsxNF0sXG4gICAgICAgIG4zID0gZGVzdFszXSwgbjcgPSBkZXN0WzddLCBuMTEgPSBkZXN0WzExXTtcblxuICAgIGRlc3RbMV0gPSBuNDtcbiAgICBkZXN0WzJdID0gbjg7XG4gICAgZGVzdFszXSA9IG4xMjtcbiAgICBkZXN0WzRdID0gbjE7XG4gICAgZGVzdFs2XSA9IG45O1xuICAgIGRlc3RbN10gPSBuMTM7XG4gICAgZGVzdFs4XSA9IG4yO1xuICAgIGRlc3RbOV0gPSBuNjtcbiAgICBkZXN0WzExXSA9IG4xNDtcbiAgICBkZXN0WzEyXSA9IG4zO1xuICAgIGRlc3RbMTNdID0gbjc7XG4gICAgZGVzdFsxNF0gPSBuMTE7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICByb3RhdGVBeGlzKGRlc3QsIHRoZXRhLCB2ZWMpIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoZGVzdCk7XG4gICAgcmV0dXJuIE1hdDQuJHJvdGF0ZUF4aXMobSwgdGhldGEsIHZlYyk7XG4gIH0sXG5cbiAgJHJvdGF0ZUF4aXMoZGVzdCwgdGhldGEsIHZlYykge1xuICAgIHZhciBzID0gc2luKHRoZXRhKSxcbiAgICAgICAgYyA9IGNvcyh0aGV0YSksXG4gICAgICAgIG5jID0gMSAtIGMsXG4gICAgICAgIHZ4ID0gdmVjWzBdLFxuICAgICAgICB2eSA9IHZlY1sxXSxcbiAgICAgICAgdnogPSB2ZWNbMl0sXG4gICAgICAgIG0xMSA9IHZ4ICogdnggKiBuYyArIGMsXG4gICAgICAgIG0xMiA9IHZ4ICogdnkgKiBuYyArIHZ6ICogcyxcbiAgICAgICAgbTEzID0gdnggKiB2eiAqIG5jIC0gdnkgKiBzLFxuICAgICAgICBtMjEgPSB2eSAqIHZ4ICogbmMgLSB2eiAqIHMsXG4gICAgICAgIG0yMiA9IHZ5ICogdnkgKiBuYyArIGMsXG4gICAgICAgIG0yMyA9IHZ5ICogdnogKiBuYyArIHZ4ICogcyxcbiAgICAgICAgbTMxID0gdnggKiB2eiAqIG5jICsgdnkgKiBzLFxuICAgICAgICBtMzIgPSB2eSAqIHZ6ICogbmMgLSB2eCAqIHMsXG4gICAgICAgIG0zMyA9IHZ6ICogdnogKiBuYyArIGMsXG4gICAgICAgIGQxMSA9IGRlc3RbMF0sXG4gICAgICAgIGQxMiA9IGRlc3RbMV0sXG4gICAgICAgIGQxMyA9IGRlc3RbMl0sXG4gICAgICAgIGQxNCA9IGRlc3RbM10sXG4gICAgICAgIGQyMSA9IGRlc3RbNF0sXG4gICAgICAgIGQyMiA9IGRlc3RbNV0sXG4gICAgICAgIGQyMyA9IGRlc3RbNl0sXG4gICAgICAgIGQyNCA9IGRlc3RbN10sXG4gICAgICAgIGQzMSA9IGRlc3RbOF0sXG4gICAgICAgIGQzMiA9IGRlc3RbOV0sXG4gICAgICAgIGQzMyA9IGRlc3RbMTBdLFxuICAgICAgICBkMzQgPSBkZXN0WzExXSxcbiAgICAgICAgZDQxID0gZGVzdFsxMl0sXG4gICAgICAgIGQ0MiA9IGRlc3RbMTNdLFxuICAgICAgICBkNDMgPSBkZXN0WzE0XSxcbiAgICAgICAgZDQ0ID0gZGVzdFsxNV07XG5cbiAgICBkZXN0WzAgXSA9IGQxMSAqIG0xMSArIGQyMSAqIG0xMiArIGQzMSAqIG0xMztcbiAgICBkZXN0WzEgXSA9IGQxMiAqIG0xMSArIGQyMiAqIG0xMiArIGQzMiAqIG0xMztcbiAgICBkZXN0WzIgXSA9IGQxMyAqIG0xMSArIGQyMyAqIG0xMiArIGQzMyAqIG0xMztcbiAgICBkZXN0WzMgXSA9IGQxNCAqIG0xMSArIGQyNCAqIG0xMiArIGQzNCAqIG0xMztcblxuICAgIGRlc3RbNCBdID0gZDExICogbTIxICsgZDIxICogbTIyICsgZDMxICogbTIzO1xuICAgIGRlc3RbNSBdID0gZDEyICogbTIxICsgZDIyICogbTIyICsgZDMyICogbTIzO1xuICAgIGRlc3RbNiBdID0gZDEzICogbTIxICsgZDIzICogbTIyICsgZDMzICogbTIzO1xuICAgIGRlc3RbNyBdID0gZDE0ICogbTIxICsgZDI0ICogbTIyICsgZDM0ICogbTIzO1xuXG4gICAgZGVzdFs4IF0gPSBkMTEgKiBtMzEgKyBkMjEgKiBtMzIgKyBkMzEgKiBtMzM7XG4gICAgZGVzdFs5IF0gPSBkMTIgKiBtMzEgKyBkMjIgKiBtMzIgKyBkMzIgKiBtMzM7XG4gICAgZGVzdFsxMF0gPSBkMTMgKiBtMzEgKyBkMjMgKiBtMzIgKyBkMzMgKiBtMzM7XG4gICAgZGVzdFsxMV0gPSBkMTQgKiBtMzEgKyBkMjQgKiBtMzIgKyBkMzQgKiBtMzM7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICByb3RhdGVYWVooZGVzdCwgcngsIHJ5LCByeikge1xuICAgIHZhciBhbnMgPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiRyb3RhdGVYWVooYW5zLCByeCwgcnksIHJ6KTtcbiAgfSxcblxuICAkcm90YXRlWFlaKGRlc3QsIHJ4LCByeSwgcnopIHtcbiAgICB2YXIgZDExID0gZGVzdFswIF0sXG4gICAgICAgIGQxMiA9IGRlc3RbMSBdLFxuICAgICAgICBkMTMgPSBkZXN0WzIgXSxcbiAgICAgICAgZDE0ID0gZGVzdFszIF0sXG4gICAgICAgIGQyMSA9IGRlc3RbNCBdLFxuICAgICAgICBkMjIgPSBkZXN0WzUgXSxcbiAgICAgICAgZDIzID0gZGVzdFs2IF0sXG4gICAgICAgIGQyNCA9IGRlc3RbNyBdLFxuICAgICAgICBkMzEgPSBkZXN0WzggXSxcbiAgICAgICAgZDMyID0gZGVzdFs5IF0sXG4gICAgICAgIGQzMyA9IGRlc3RbMTBdLFxuICAgICAgICBkMzQgPSBkZXN0WzExXSxcbiAgICAgICAgY3J4ID0gY29zKHJ4KSxcbiAgICAgICAgY3J5ID0gY29zKHJ5KSxcbiAgICAgICAgY3J6ID0gY29zKHJ6KSxcbiAgICAgICAgc3J4ID0gc2luKHJ4KSxcbiAgICAgICAgc3J5ID0gc2luKHJ5KSxcbiAgICAgICAgc3J6ID0gc2luKHJ6KSxcbiAgICAgICAgbTExID0gIGNyeSAqIGNyeixcbiAgICAgICAgbTIxID0gLWNyeCAqIHNyeiArIHNyeCAqIHNyeSAqIGNyeixcbiAgICAgICAgbTMxID0gIHNyeCAqIHNyeiArIGNyeCAqIHNyeSAqIGNyeixcbiAgICAgICAgbTEyID0gIGNyeSAqIHNyeixcbiAgICAgICAgbTIyID0gIGNyeCAqIGNyeiArIHNyeCAqIHNyeSAqIHNyeixcbiAgICAgICAgbTMyID0gLXNyeCAqIGNyeiArIGNyeCAqIHNyeSAqIHNyeixcbiAgICAgICAgbTEzID0gLXNyeSxcbiAgICAgICAgbTIzID0gIHNyeCAqIGNyeSxcbiAgICAgICAgbTMzID0gIGNyeCAqIGNyeTtcblxuICAgIGRlc3RbMCBdID0gZDExICogbTExICsgZDIxICogbTEyICsgZDMxICogbTEzO1xuICAgIGRlc3RbMSBdID0gZDEyICogbTExICsgZDIyICogbTEyICsgZDMyICogbTEzO1xuICAgIGRlc3RbMiBdID0gZDEzICogbTExICsgZDIzICogbTEyICsgZDMzICogbTEzO1xuICAgIGRlc3RbMyBdID0gZDE0ICogbTExICsgZDI0ICogbTEyICsgZDM0ICogbTEzO1xuXG4gICAgZGVzdFs0IF0gPSBkMTEgKiBtMjEgKyBkMjEgKiBtMjIgKyBkMzEgKiBtMjM7XG4gICAgZGVzdFs1IF0gPSBkMTIgKiBtMjEgKyBkMjIgKiBtMjIgKyBkMzIgKiBtMjM7XG4gICAgZGVzdFs2IF0gPSBkMTMgKiBtMjEgKyBkMjMgKiBtMjIgKyBkMzMgKiBtMjM7XG4gICAgZGVzdFs3IF0gPSBkMTQgKiBtMjEgKyBkMjQgKiBtMjIgKyBkMzQgKiBtMjM7XG5cbiAgICBkZXN0WzggXSA9IGQxMSAqIG0zMSArIGQyMSAqIG0zMiArIGQzMSAqIG0zMztcbiAgICBkZXN0WzkgXSA9IGQxMiAqIG0zMSArIGQyMiAqIG0zMiArIGQzMiAqIG0zMztcbiAgICBkZXN0WzEwXSA9IGQxMyAqIG0zMSArIGQyMyAqIG0zMiArIGQzMyAqIG0zMztcbiAgICBkZXN0WzExXSA9IGQxNCAqIG0zMSArIGQyNCAqIG0zMiArIGQzNCAqIG0zMztcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHRyYW5zbGF0ZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgdmFyIG0gPSBNYXQ0LmNsb25lKGRlc3QpO1xuICAgIHJldHVybiBNYXQ0LiR0cmFuc2xhdGUobSwgeCwgeSwgeik7XG4gIH0sXG5cbiAgJHRyYW5zbGF0ZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgZGVzdFsxMl0gPSBkZXN0WzAgXSAqIHggKyBkZXN0WzQgXSAqIHkgKyBkZXN0WzggXSAqIHogKyBkZXN0WzEyXTtcbiAgICBkZXN0WzEzXSA9IGRlc3RbMSBdICogeCArIGRlc3RbNSBdICogeSArIGRlc3RbOSBdICogeiArIGRlc3RbMTNdO1xuICAgIGRlc3RbMTRdID0gZGVzdFsyIF0gKiB4ICsgZGVzdFs2IF0gKiB5ICsgZGVzdFsxMF0gKiB6ICsgZGVzdFsxNF07XG4gICAgZGVzdFsxNV0gPSBkZXN0WzMgXSAqIHggKyBkZXN0WzcgXSAqIHkgKyBkZXN0WzExXSAqIHogKyBkZXN0WzE1XTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHNjYWxlKGRlc3QsIHgsIHksIHopIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoZGVzdCk7XG4gICAgcmV0dXJuIE1hdDQuJHNjYWxlKG0sIHgsIHksIHopO1xuICB9LFxuXG4gICRzY2FsZShkZXN0LCB4LCB5LCB6KSB7XG4gICAgZGVzdFswIF0gKj0geDtcbiAgICBkZXN0WzEgXSAqPSB4O1xuICAgIGRlc3RbMiBdICo9IHg7XG4gICAgZGVzdFszIF0gKj0geDtcbiAgICBkZXN0WzQgXSAqPSB5O1xuICAgIGRlc3RbNSBdICo9IHk7XG4gICAgZGVzdFs2IF0gKj0geTtcbiAgICBkZXN0WzcgXSAqPSB5O1xuICAgIGRlc3RbOCBdICo9IHo7XG4gICAgZGVzdFs5IF0gKj0gejtcbiAgICBkZXN0WzEwXSAqPSB6O1xuICAgIGRlc3RbMTFdICo9IHo7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICAvLyBNZXRob2QgYmFzZWQgb24gUHJlR0wgaHR0cHM6Ly8gZ2l0aHViLmNvbS9kZWFubS9wcmVnbC8gKGMpIERlYW4gTWNOYW1lZS5cbiAgaW52ZXJ0KGRlc3QpIHtcbiAgICB2YXIgbSA9IE1hdDQuY2xvbmUoZGVzdCk7XG4gICAgcmV0dXJuICBNYXQ0LiRpbnZlcnQobSk7XG4gIH0sXG5cbiAgJGludmVydChkZXN0KSB7XG4gICAgdmFyIHgwID0gZGVzdFswXSwgIHgxID0gZGVzdFsxXSwgIHgyID0gZGVzdFsyXSwgIHgzID0gZGVzdFszXSxcbiAgICAgICAgeDQgPSBkZXN0WzRdLCAgeDUgPSBkZXN0WzVdLCAgeDYgPSBkZXN0WzZdLCAgeDcgPSBkZXN0WzddLFxuICAgICAgICB4OCA9IGRlc3RbOF0sICB4OSA9IGRlc3RbOV0sIHgxMCA9IGRlc3RbMTBdLCB4MTEgPSBkZXN0WzExXSxcbiAgICAgICAgeDEyID0gZGVzdFsxMl0sIHgxMyA9IGRlc3RbMTNdLCB4MTQgPSBkZXN0WzE0XSwgeDE1ID0gZGVzdFsxNV07XG5cbiAgICB2YXIgYTAgPSB4MCAqIHg1IC0geDEgKiB4NCxcbiAgICAgICAgYTEgPSB4MCAqIHg2IC0geDIgKiB4NCxcbiAgICAgICAgYTIgPSB4MCAqIHg3IC0geDMgKiB4NCxcbiAgICAgICAgYTMgPSB4MSAqIHg2IC0geDIgKiB4NSxcbiAgICAgICAgYTQgPSB4MSAqIHg3IC0geDMgKiB4NSxcbiAgICAgICAgYTUgPSB4MiAqIHg3IC0geDMgKiB4NixcbiAgICAgICAgYjAgPSB4OCAqIHgxMyAtIHg5ICogeDEyLFxuICAgICAgICBiMSA9IHg4ICogeDE0IC0geDEwICogeDEyLFxuICAgICAgICBiMiA9IHg4ICogeDE1IC0geDExICogeDEyLFxuICAgICAgICBiMyA9IHg5ICogeDE0IC0geDEwICogeDEzLFxuICAgICAgICBiNCA9IHg5ICogeDE1IC0geDExICogeDEzLFxuICAgICAgICBiNSA9IHgxMCAqIHgxNSAtIHgxMSAqIHgxNDtcblxuICAgIHZhciBpbnZkZXQgPSAxIC9cbiAgICAgIChhMCAqIGI1IC0gYTEgKiBiNCArIGEyICogYjMgKyBhMyAqIGIyIC0gYTQgKiBiMSArIGE1ICogYjApO1xuXG4gICAgZGVzdFswIF0gPSAoKyB4NSAqIGI1IC0geDYgKiBiNCArIHg3ICogYjMpICogaW52ZGV0O1xuICAgIGRlc3RbMSBdID0gKC0geDEgKiBiNSArIHgyICogYjQgLSB4MyAqIGIzKSAqIGludmRldDtcbiAgICBkZXN0WzIgXSA9ICgrIHgxMyAqIGE1IC0geDE0ICogYTQgKyB4MTUgKiBhMykgKiBpbnZkZXQ7XG4gICAgZGVzdFszIF0gPSAoLSB4OSAqIGE1ICsgeDEwICogYTQgLSB4MTEgKiBhMykgKiBpbnZkZXQ7XG4gICAgZGVzdFs0IF0gPSAoLSB4NCAqIGI1ICsgeDYgKiBiMiAtIHg3ICogYjEpICogaW52ZGV0O1xuICAgIGRlc3RbNSBdID0gKCsgeDAgKiBiNSAtIHgyICogYjIgKyB4MyAqIGIxKSAqIGludmRldDtcbiAgICBkZXN0WzYgXSA9ICgtIHgxMiAqIGE1ICsgeDE0ICogYTIgLSB4MTUgKiBhMSkgKiBpbnZkZXQ7XG4gICAgZGVzdFs3IF0gPSAoKyB4OCAqIGE1IC0geDEwICogYTIgKyB4MTEgKiBhMSkgKiBpbnZkZXQ7XG4gICAgZGVzdFs4IF0gPSAoKyB4NCAqIGI0IC0geDUgKiBiMiArIHg3ICogYjApICogaW52ZGV0O1xuICAgIGRlc3RbOSBdID0gKC0geDAgKiBiNCArIHgxICogYjIgLSB4MyAqIGIwKSAqIGludmRldDtcbiAgICBkZXN0WzEwXSA9ICgrIHgxMiAqIGE0IC0geDEzICogYTIgKyB4MTUgKiBhMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxMV0gPSAoLSB4OCAqIGE0ICsgeDkgKiBhMiAtIHgxMSAqIGEwKSAqIGludmRldDtcbiAgICBkZXN0WzEyXSA9ICgtIHg0ICogYjMgKyB4NSAqIGIxIC0geDYgKiBiMCkgKiBpbnZkZXQ7XG4gICAgZGVzdFsxM10gPSAoKyB4MCAqIGIzIC0geDEgKiBiMSArIHgyICogYjApICogaW52ZGV0O1xuICAgIGRlc3RbMTRdID0gKC0geDEyICogYTMgKyB4MTMgKiBhMSAtIHgxNCAqIGEwKSAqIGludmRldDtcbiAgICBkZXN0WzE1XSA9ICgrIHg4ICogYTMgLSB4OSAqIGExICsgeDEwICogYTApICogaW52ZGV0O1xuXG4gICAgcmV0dXJuIGRlc3Q7XG5cbiAgfSxcbiAgLy8gVE9ETyhuaWNvKSBicmVha2luZyBjb252ZW50aW9uIGhlcmUuLi5cbiAgLy8gYmVjYXVzZSBJIGRvbid0IHRoaW5rIGl0J3MgdXNlZnVsIHRvIGFkZFxuICAvLyB0d28gbWV0aG9kcyBmb3IgZWFjaCBvZiB0aGVzZS5cbiAgbG9va0F0KGRlc3QsIGV5ZSwgY2VudGVyLCB1cCkge1xuICAgIHZhciB6ID0gVmVjMy5zdWIoZXllLCBjZW50ZXIpO1xuICAgIHouJHVuaXQoKTtcbiAgICB2YXIgeCA9IFZlYzMuY3Jvc3ModXAsIHopO1xuICAgIHguJHVuaXQoKTtcbiAgICB2YXIgeSA9IFZlYzMuY3Jvc3MoeiwgeCk7XG4gICAgeS4kdW5pdCgpO1xuICAgIHJldHVybiBNYXQ0LnNldChkZXN0LCB4WzBdLCB4WzFdLCB4WzJdLCAteC5kb3QoZXllKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeVswXSwgeVsxXSwgeVsyXSwgLXkuZG90KGV5ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHpbMF0sIHpbMV0sIHpbMl0sIC16LmRvdChleWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAwLCAwLCAwLCAxKTtcbiAgfSxcblxuICBmcnVzdHVtKGRlc3QsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHJsID0gcmlnaHQgLSBsZWZ0LFxuICAgICAgICB0YiA9IHRvcCAtIGJvdHRvbSxcbiAgICAgICAgZm4gPSBmYXIgLSBuZWFyO1xuXG4gICAgZGVzdFswXSA9IChuZWFyICogMikgLyBybDtcbiAgICBkZXN0WzFdID0gMDtcbiAgICBkZXN0WzJdID0gMDtcbiAgICBkZXN0WzNdID0gMDtcbiAgICBkZXN0WzRdID0gMDtcbiAgICBkZXN0WzVdID0gKG5lYXIgKiAyKSAvIHRiO1xuICAgIGRlc3RbNl0gPSAwO1xuICAgIGRlc3RbN10gPSAwO1xuICAgIGRlc3RbOF0gPSAocmlnaHQgKyBsZWZ0KSAvIHJsO1xuICAgIGRlc3RbOV0gPSAodG9wICsgYm90dG9tKSAvIHRiO1xuICAgIGRlc3RbMTBdID0gLShmYXIgKyBuZWFyKSAvIGZuO1xuICAgIGRlc3RbMTFdID0gLTE7XG4gICAgZGVzdFsxMl0gPSAwO1xuICAgIGRlc3RbMTNdID0gMDtcbiAgICBkZXN0WzE0XSA9IC0oZmFyICogbmVhciAqIDIpIC8gZm47XG4gICAgZGVzdFsxNV0gPSAwO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgcGVyc3BlY3RpdmUoZGVzdCwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcikge1xuICAgIHZhciB5bWF4ID0gbmVhciAqIHRhbihmb3YgKiBwaSAvIDM2MCksXG4gICAgICAgIHltaW4gPSAteW1heCxcbiAgICAgICAgeG1pbiA9IHltaW4gKiBhc3BlY3QsXG4gICAgICAgIHhtYXggPSB5bWF4ICogYXNwZWN0O1xuXG4gICAgcmV0dXJuIE1hdDQuZnJ1c3R1bShkZXN0LCB4bWluLCB4bWF4LCB5bWluLCB5bWF4LCBuZWFyLCBmYXIpO1xuICB9LFxuXG4gIG9ydGhvKGRlc3QsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHRlID0gdGhpcy5lbGVtZW50cyxcbiAgICAgICAgdyA9IHJpZ2h0IC0gbGVmdCxcbiAgICAgICAgaCA9IHRvcCAtIGJvdHRvbSxcbiAgICAgICAgcCA9IGZhciAtIG5lYXIsXG4gICAgICAgIHggPSAocmlnaHQgKyBsZWZ0KSAvIHcsXG4gICAgICAgIHkgPSAodG9wICsgYm90dG9tKSAvIGgsXG4gICAgICAgIHogPSAoZmFyICsgbmVhcikgLyBwO1xuXG4gICAgZGVzdFswXSA9IDIgLyB3O1x0ZGVzdFs0XSA9IDA7XHRkZXN0WzhdID0gMDtcdGRlc3RbMTJdID0gLXg7XG4gICAgZGVzdFsxXSA9IDA7XHRkZXN0WzVdID0gMiAvIGg7XHRkZXN0WzldID0gMDtcdGRlc3RbMTNdID0gLXk7XG4gICAgZGVzdFsyXSA9IDA7XHRkZXN0WzZdID0gMDtcdGRlc3RbMTBdID0gLTIgLyBwO1x0ZGVzdFsxNF0gPSAtejtcbiAgICBkZXN0WzNdID0gMDtcdGRlc3RbN10gPSAwO1x0ZGVzdFsxMV0gPSAwO1x0ZGVzdFsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG5cdH0sXG5cbiAgdG9GbG9hdDMyQXJyYXkoZGVzdCkge1xuICAgIHZhciBhbnMgPSBkZXN0LnR5cGVkQ29udGFpbmVyO1xuXG4gICAgaWYgKCFhbnMpIHtcbiAgICAgIHJldHVybiBkZXN0O1xuICAgIH1cblxuICAgIGFuc1swXSA9IGRlc3RbMF07XG4gICAgYW5zWzFdID0gZGVzdFsxXTtcbiAgICBhbnNbMl0gPSBkZXN0WzJdO1xuICAgIGFuc1szXSA9IGRlc3RbM107XG4gICAgYW5zWzRdID0gZGVzdFs0XTtcbiAgICBhbnNbNV0gPSBkZXN0WzVdO1xuICAgIGFuc1s2XSA9IGRlc3RbNl07XG4gICAgYW5zWzddID0gZGVzdFs3XTtcbiAgICBhbnNbOF0gPSBkZXN0WzhdO1xuICAgIGFuc1s5XSA9IGRlc3RbOV07XG4gICAgYW5zWzEwXSA9IGRlc3RbMTBdO1xuICAgIGFuc1sxMV0gPSBkZXN0WzExXTtcbiAgICBhbnNbMTJdID0gZGVzdFsxMl07XG4gICAgYW5zWzEzXSA9IGRlc3RbMTNdO1xuICAgIGFuc1sxNF0gPSBkZXN0WzE0XTtcbiAgICBhbnNbMTVdID0gZGVzdFsxNV07XG5cbiAgICByZXR1cm4gYW5zO1xuICB9XG59O1xuXG4vLyBhZGQgZ2VuZXJpY3MgYW5kIGluc3RhbmNlIG1ldGhvZHNcbnByb3RvID0gTWF0NC5wcm90b3R5cGU7XG5mb3IgKG1ldGhvZCBpbiBnZW5lcmljcykge1xuICBNYXQ0W21ldGhvZF0gPSBnZW5lcmljc1ttZXRob2RdO1xuICBwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICAgIHJldHVybiBNYXQ0W21dLmFwcGx5KE1hdDQsIGFyZ3MpO1xuICAgIH07XG4gfSkobWV0aG9kKTtcbn1cblxuLy8gUXVhdGVybmlvbiBjbGFzc1xuZXhwb3J0IGNsYXNzIFF1YXQgZXh0ZW5kcyBBcnJheSB7XG4gIGNvbnN0cnVjdG9yKHgsIHksIHosIHcpIHtcbiAgICBzdXBlcig0KTtcbiAgICB0aGlzWzBdID0geCB8fCAwO1xuICAgIHRoaXNbMV0gPSB5IHx8IDA7XG4gICAgdGhpc1syXSA9IHogfHwgMDtcbiAgICB0aGlzWzNdID0gdyB8fCAwO1xuXG4gICAgdGhpcy50eXBlZENvbnRhaW5lciA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlKCkge1xuICAgIHJldHVybiBuZXcgQXJyYXkoNCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbVZlYzModiwgcikge1xuICAgIHJldHVybiBuZXcgUXVhdCh2WzBdLCB2WzFdLCB2WzJdLCByIHx8IDApO1xuICB9XG5cbiAgc3RhdGljIGZyb21NYXQ0KG0pIHtcbiAgICB2YXIgdTtcbiAgICB2YXIgdjtcbiAgICB2YXIgdztcblxuICAgIC8vIENob29zZSB1LCB2LCBhbmQgdyBzdWNoIHRoYXQgdSBpcyB0aGUgaW5kZXggb2YgdGhlIGJpZ2dlc3QgZGlhZ29uYWwgZW50cnlcbiAgICAvLyBvZiBtLCBhbmQgdSB2IHcgaXMgYW4gZXZlbiBwZXJtdXRhdGlvbiBvZiAwIDEgYW5kIDIuXG4gICAgaWYgKG1bMF0gPiBtWzVdICYmIG1bMF0gPiBtWzEwXSkge1xuICAgICAgdSA9IDA7XG4gICAgICB2ID0gMTtcbiAgICAgIHcgPSAyO1xuICAgIH0gZWxzZSBpZiAobVs1XSA+IG1bMF0gJiYgbVs1XSA+IG1bMTBdKSB7XG4gICAgICB1ID0gMTtcbiAgICAgIHYgPSAyO1xuICAgICAgdyA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHUgPSAyO1xuICAgICAgdiA9IDA7XG4gICAgICB3ID0gMTtcbiAgICB9XG5cbiAgICB2YXIgciA9IHNxcnQoMSArIG1bdSAqIDVdIC0gbVt2ICogNV0gLSBtW3cgKiA1XSk7XG4gICAgdmFyIHEgPSBuZXcgUXVhdDtcblxuICAgIHFbdV0gPSAwLjUgKiByO1xuICAgIHFbdl0gPSAwLjUgKiAobVsnbicgKyB2ICsgJycgKyB1XSArIG1bJ24nICsgdSArICcnICsgdl0pIC8gcjtcbiAgICBxW3ddID0gMC41ICogKG1bJ24nICsgdSArICcnICsgd10gKyBtWyduJyArIHcgKyAnJyArIHVdKSAvIHI7XG4gICAgcVszXSA9IDAuNSAqIChtWyduJyArIHYgKyAnJyArIHddIC0gbVsnbicgKyB3ICsgJycgKyB2XSkgLyByO1xuXG4gICAgcmV0dXJuIHE7XG4gIH1cblxuICBzdGF0aWMgZnJvbVhSb3RhdGlvbihhbmdsZSkge1xuICAgIHJldHVybiBuZXcgUXVhdChzaW4oYW5nbGUgLyAyKSwgMCwgMCwgY29zKGFuZ2xlIC8gMikpO1xuICB9XG5cbiAgc3RhdGljIGZyb21ZUm90YXRpb24oYW5nbGUpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoMCwgc2luKGFuZ2xlIC8gMiksIDAsIGNvcyhhbmdsZSAvIDIpKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tWlJvdGF0aW9uKGFuZ2xlKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KDAsIDAsIHNpbihhbmdsZSAvIDIpLCBjb3MoYW5nbGUgLyAyKSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUF4aXNSb3RhdGlvbih2ZWMsIGFuZ2xlKSB7XG4gICAgdmFyIHggPSB2ZWNbMF0sXG4gICAgICAgIHkgPSB2ZWNbMV0sXG4gICAgICAgIHogPSB2ZWNbMl0sXG4gICAgICAgIGQgPSAxIC8gc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopLFxuICAgICAgICBzID0gc2luKGFuZ2xlIC8gMiksXG4gICAgICAgIGMgPSBjb3MoYW5nbGUgLyAyKTtcblxuICAgIHJldHVybiBuZXcgUXVhdChzICogeCAqIGQsIHMgKiB5ICogZCwgcyAqIHogKiBkLCBjKTtcbiAgfVxuXG59XG5cbmdlbmVyaWNzID0ge1xuXG4gIHNldFF1YXQoZGVzdCwgcSkge1xuICAgIGRlc3RbMF0gPSBxWzBdO1xuICAgIGRlc3RbMV0gPSBxWzFdO1xuICAgIGRlc3RbMl0gPSBxWzJdO1xuICAgIGRlc3RbM10gPSBxWzNdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgc2V0KGRlc3QsIHgsIHksIHosIHcpIHtcbiAgICBkZXN0WzBdID0geCB8fCAwO1xuICAgIGRlc3RbMV0gPSB5IHx8IDA7XG4gICAgZGVzdFsyXSA9IHogfHwgMDtcbiAgICBkZXN0WzNdID0gdyB8fCAwO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgY2xvbmUoZGVzdCkge1xuICAgIGlmIChkZXN0IGluc3RhbmNlb2YgUXVhdCkge1xuICAgICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0sIGRlc3RbMV0sIGRlc3RbMl0sIGRlc3RbM10pO1xuICAgIH1cbiAgICByZXR1cm4gUXVhdC5zZXRRdWF0KG5ldyB0eXBlZEFycmF5KDQpLCBkZXN0KTtcbiAgfSxcblxuICBuZWcoZGVzdCkge1xuICAgIHJldHVybiBuZXcgUXVhdCgtZGVzdFswXSwgLWRlc3RbMV0sIC1kZXN0WzJdLCAtZGVzdFszXSk7XG4gIH0sXG5cbiAgJG5lZyhkZXN0KSB7XG4gICAgZGVzdFswXSA9IC1kZXN0WzBdO1xuICAgIGRlc3RbMV0gPSAtZGVzdFsxXTtcbiAgICBkZXN0WzJdID0gLWRlc3RbMl07XG4gICAgZGVzdFszXSA9IC1kZXN0WzNdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgYWRkKGRlc3QsIHEpIHtcbiAgICByZXR1cm4gbmV3IFF1YXQoZGVzdFswXSArIHFbMF0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbMV0gKyBxWzFdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzJdICsgcVsyXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFszXSArIHFbM10pO1xuICB9LFxuXG4gICRhZGQoZGVzdCwgcSkge1xuICAgIGRlc3RbMF0gKz0gcVswXTtcbiAgICBkZXN0WzFdICs9IHFbMV07XG4gICAgZGVzdFsyXSArPSBxWzJdO1xuICAgIGRlc3RbM10gKz0gcVszXTtcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIHN1YihkZXN0LCBxKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0gLSBxWzBdLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdIC0gcVsxXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAtIHFbMl0sXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbM10gLSBxWzNdKTtcbiAgfSxcblxuICAkc3ViKGRlc3QsIHEpIHtcbiAgICBkZXN0WzBdIC09IHFbMF07XG4gICAgZGVzdFsxXSAtPSBxWzFdO1xuICAgIGRlc3RbMl0gLT0gcVsyXTtcbiAgICBkZXN0WzNdIC09IHFbM107XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBzY2FsZShkZXN0LCBzKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0KGRlc3RbMF0gKiBzLFxuICAgICAgICAgICAgICAgICAgICBkZXN0WzFdICogcyxcbiAgICAgICAgICAgICAgICAgICAgZGVzdFsyXSAqIHMsXG4gICAgICAgICAgICAgICAgICAgIGRlc3RbM10gKiBzKTtcbiAgfSxcblxuICAkc2NhbGUoZGVzdCwgcykge1xuICAgIGRlc3RbMF0gKj0gcztcbiAgICBkZXN0WzFdICo9IHM7XG4gICAgZGVzdFsyXSAqPSBzO1xuICAgIGRlc3RbM10gKj0gcztcblxuICAgIHJldHVybiBkZXN0O1xuICB9LFxuXG4gIG11bFF1YXQoZGVzdCwgcSkge1xuICAgIHZhciBhWCA9IGRlc3RbMF0sXG4gICAgICAgIGFZID0gZGVzdFsxXSxcbiAgICAgICAgYVogPSBkZXN0WzJdLFxuICAgICAgICBhVyA9IGRlc3RbM10sXG4gICAgICAgIGJYID0gcVswXSxcbiAgICAgICAgYlkgPSBxWzFdLFxuICAgICAgICBiWiA9IHFbMl0sXG4gICAgICAgIGJXID0gcVszXTtcblxuICAgIHJldHVybiBuZXcgUXVhdChhVyAqIGJYICsgYVggKiBiVyArIGFZICogYlogLSBhWiAqIGJZLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJZICsgYVkgKiBiVyArIGFaICogYlggLSBhWCAqIGJaLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJaICsgYVogKiBiVyArIGFYICogYlkgLSBhWSAqIGJYLFxuICAgICAgICAgICAgICAgICAgICBhVyAqIGJXIC0gYVggKiBiWCAtIGFZICogYlkgLSBhWiAqIGJaKTtcbiAgfSxcblxuICAkbXVsUXVhdChkZXN0LCBxKSB7XG4gICAgdmFyIGFYID0gZGVzdFswXSxcbiAgICAgICAgYVkgPSBkZXN0WzFdLFxuICAgICAgICBhWiA9IGRlc3RbMl0sXG4gICAgICAgIGFXID0gZGVzdFszXSxcbiAgICAgICAgYlggPSBxWzBdLFxuICAgICAgICBiWSA9IHFbMV0sXG4gICAgICAgIGJaID0gcVsyXSxcbiAgICAgICAgYlcgPSBxWzNdO1xuXG4gICAgZGVzdFswXSA9IGFXICogYlggKyBhWCAqIGJXICsgYVkgKiBiWiAtIGFaICogYlk7XG4gICAgZGVzdFsxXSA9IGFXICogYlkgKyBhWSAqIGJXICsgYVogKiBiWCAtIGFYICogYlo7XG4gICAgZGVzdFsyXSA9IGFXICogYlogKyBhWiAqIGJXICsgYVggKiBiWSAtIGFZICogYlg7XG4gICAgZGVzdFszXSA9IGFXICogYlcgLSBhWCAqIGJYIC0gYVkgKiBiWSAtIGFaICogYlo7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBkaXZRdWF0KGRlc3QsIHEpIHtcbiAgICB2YXIgYVggPSBkZXN0WzBdLFxuICAgICAgICBhWSA9IGRlc3RbMV0sXG4gICAgICAgIGFaID0gZGVzdFsyXSxcbiAgICAgICAgYVcgPSBkZXN0WzNdLFxuICAgICAgICBiWCA9IHFbMF0sXG4gICAgICAgIGJZID0gcVsxXSxcbiAgICAgICAgYlogPSBxWzJdLFxuICAgICAgICBiVyA9IHFbM107XG5cbiAgICB2YXIgZCA9IDEgLyAoYlcgKiBiVyArIGJYICogYlggKyBiWSAqIGJZICsgYlogKiBiWik7XG5cbiAgICByZXR1cm4gbmV3IFF1YXQoKGFYICogYlcgLSBhVyAqIGJYIC0gYVkgKiBiWiArIGFaICogYlkpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFYICogYlogLSBhVyAqIGJZICsgYVkgKiBiVyAtIGFaICogYlgpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFZICogYlggKyBhWiAqIGJXIC0gYVcgKiBiWiAtIGFYICogYlkpICogZCxcbiAgICAgICAgICAgICAgICAgICAgKGFXICogYlcgKyBhWCAqIGJYICsgYVkgKiBiWSArIGFaICogYlopICogZCk7XG4gIH0sXG5cbiAgJGRpdlF1YXQoZGVzdCwgcSkge1xuICAgIHZhciBhWCA9IGRlc3RbMF0sXG4gICAgICAgIGFZID0gZGVzdFsxXSxcbiAgICAgICAgYVogPSBkZXN0WzJdLFxuICAgICAgICBhVyA9IGRlc3RbM10sXG4gICAgICAgIGJYID0gcVswXSxcbiAgICAgICAgYlkgPSBxWzFdLFxuICAgICAgICBiWiA9IHFbMl0sXG4gICAgICAgIGJXID0gcVszXTtcblxuICAgIHZhciBkID0gMSAvIChiVyAqIGJXICsgYlggKiBiWCArIGJZICogYlkgKyBiWiAqIGJaKTtcblxuICAgIGRlc3RbMF0gPSAoYVggKiBiVyAtIGFXICogYlggLSBhWSAqIGJaICsgYVogKiBiWSkgKiBkO1xuICAgIGRlc3RbMV0gPSAoYVggKiBiWiAtIGFXICogYlkgKyBhWSAqIGJXIC0gYVogKiBiWCkgKiBkO1xuICAgIGRlc3RbMl0gPSAoYVkgKiBiWCArIGFaICogYlcgLSBhVyAqIGJaIC0gYVggKiBiWSkgKiBkO1xuICAgIGRlc3RbM10gPSAoYVcgKiBiVyArIGFYICogYlggKyBhWSAqIGJZICsgYVogKiBiWikgKiBkO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG5cbiAgaW52ZXJ0KGRlc3QpIHtcbiAgICB2YXIgcTAgPSBkZXN0WzBdLFxuICAgICAgICBxMSA9IGRlc3RbMV0sXG4gICAgICAgIHEyID0gZGVzdFsyXSxcbiAgICAgICAgcTMgPSBkZXN0WzNdO1xuXG4gICAgdmFyIGQgPSAxIC8gKHEwICogcTAgKyBxMSAqIHExICsgcTIgKiBxMiArIHEzICogcTMpO1xuXG4gICAgcmV0dXJuIG5ldyBRdWF0KC1xMCAqIGQsIC1xMSAqIGQsIC1xMiAqIGQsIHEzICogZCk7XG4gIH0sXG5cbiAgJGludmVydChkZXN0KSB7XG4gICAgdmFyIHEwID0gZGVzdFswXSxcbiAgICAgICAgcTEgPSBkZXN0WzFdLFxuICAgICAgICBxMiA9IGRlc3RbMl0sXG4gICAgICAgIHEzID0gZGVzdFszXTtcblxuICAgIHZhciBkID0gMSAvIChxMCAqIHEwICsgcTEgKiBxMSArIHEyICogcTIgKyBxMyAqIHEzKTtcblxuICAgIGRlc3RbMF0gPSAtcTAgKiBkO1xuICAgIGRlc3RbMV0gPSAtcTEgKiBkO1xuICAgIGRlc3RbMl0gPSAtcTIgKiBkO1xuICAgIGRlc3RbM10gPSBxMyAqIGQ7XG5cbiAgICByZXR1cm4gZGVzdDtcbiAgfSxcblxuICBub3JtKGRlc3QpIHtcbiAgICB2YXIgYSA9IGRlc3RbMF0sXG4gICAgICAgIGIgPSBkZXN0WzFdLFxuICAgICAgICBjID0gZGVzdFsyXSxcbiAgICAgICAgZCA9IGRlc3RbM107XG5cbiAgICByZXR1cm4gc3FydChhICogYSArIGIgKiBiICsgYyAqIGMgKyBkICogZCk7XG4gIH0sXG5cbiAgbm9ybVNxKGRlc3QpIHtcbiAgICB2YXIgYSA9IGRlc3RbMF0sXG4gICAgICAgIGIgPSBkZXN0WzFdLFxuICAgICAgICBjID0gZGVzdFsyXSxcbiAgICAgICAgZCA9IGRlc3RbM107XG5cbiAgICByZXR1cm4gYSAqIGEgKyBiICogYiArIGMgKiBjICsgZCAqIGQ7XG4gIH0sXG5cbiAgdW5pdChkZXN0KSB7XG4gICAgcmV0dXJuIFF1YXQuc2NhbGUoZGVzdCwgMSAvIFF1YXQubm9ybShkZXN0KSk7XG4gIH0sXG5cbiAgJHVuaXQoZGVzdCkge1xuICAgIHJldHVybiBRdWF0LiRzY2FsZShkZXN0LCAxIC8gUXVhdC5ub3JtKGRlc3QpKTtcbiAgfSxcblxuICBjb25qdWdhdGUoZGVzdCkge1xuICAgIHJldHVybiBuZXcgUXVhdCgtZGVzdFswXSwgLWRlc3RbMV0sIC1kZXN0WzJdLCBkZXN0WzNdKTtcbiAgfSxcblxuICAkY29uanVnYXRlKGRlc3QpIHtcbiAgICBkZXN0WzBdID0gLWRlc3RbMF07XG4gICAgZGVzdFsxXSA9IC1kZXN0WzFdO1xuICAgIGRlc3RbMl0gPSAtZGVzdFsyXTtcbiAgICByZXR1cm4gZGVzdDtcbiAgfVxufTtcblxuLy8gYWRkIGdlbmVyaWNzIGFuZCBpbnN0YW5jZSBtZXRob2RzXG5cbnByb3RvID0gUXVhdC5wcm90b3R5cGUgPSB7fTtcblxuZm9yIChtZXRob2QgaW4gZ2VuZXJpY3MpIHtcbiAgUXVhdFttZXRob2RdID0gZ2VuZXJpY3NbbWV0aG9kXTtcbiAgcHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiAobSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgICByZXR1cm4gUXVhdFttXS5hcHBseShRdWF0LCBhcmdzKTtcbiAgICB9O1xuIH0pKG1ldGhvZCk7XG59XG5cbi8vIEFkZCBzdGF0aWMgbWV0aG9kc1xuVmVjMy5mcm9tUXVhdCA9IGZ1bmN0aW9uKHEpIHtcbiAgcmV0dXJuIG5ldyBWZWMzKHFbMF0sIHFbMV0sIHFbMl0pO1xufTtcblxuTWF0NC5mcm9tUXVhdCA9IGZ1bmN0aW9uKHEpIHtcbiAgdmFyIGEgPSBxWzNdLFxuICAgICAgYiA9IHFbMF0sXG4gICAgICBjID0gcVsxXSxcbiAgICAgIGQgPSBxWzJdO1xuXG4gIHJldHVybiBuZXcgTWF0NChcbiAgICBhICogYSArIGIgKiBiIC0gYyAqIGMgLSBkICogZCxcbiAgICAyICogYiAqIGMgLSAyICogYSAqIGQsXG4gICAgMiAqIGIgKiBkICsgMiAqIGEgKiBjLFxuICAgIDAsXG5cbiAgICAyICogYiAqIGMgKyAyICogYSAqIGQsXG4gICAgYSAqIGEgLSBiICogYiArIGMgKiBjIC0gZCAqIGQsXG4gICAgMiAqIGMgKiBkIC0gMiAqIGEgKiBiLFxuICAgIDAsXG5cbiAgICAyICogYiAqIGQgLSAyICogYSAqIGMsXG4gICAgMiAqIGMgKiBkICsgMiAqIGEgKiBiLFxuICAgIGEgKiBhIC0gYiAqIGIgLSBjICogYyArIGQgKiBkLFxuICAgIDAsXG5cbiAgICAwLCAwLCAwLCAxKTtcbn07XG4iXX0=