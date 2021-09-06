import formatGLSLError from '@luma.gl/webgl/glsl-utils/format-glsl-error';
import test from 'tape-promise/tape';

const SHADER_SOURCE = `
#define AMD_GPU

// Defines for shader portability
#if (__VERSION__ > 120)
# define attribute in
# define varying out
#endif // __VERSION

// FRAG_DEPTH => gl_FragDepth is available
#ifdef GL_EXT_frag_depth
#extension GL_EXT_frag_depth : enable
# define FRAG_DEPTH
# define gl_FragDepth gl_FragDepthEXT
#endif
#if (__VERSION__ > 120)
# define FRAG_DEPTH
#endif

// DERIVATIVES => dxdF, dxdY and fwidth are available
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
# define DERIVATIVES
#endif
#if (__VERSION__ > 120)
# define DERIVATIVES
#endif

// DRAW_BUFFERS => gl_FragData[] is available
#ifdef GL_EXT_draw_buffers
#extension GL_EXT_draw_buffers : require
#define DRAW_BUFFERS
#endif
#if (__VERSION__ > 120)
# define DRAW_BUFFERS
#endif

// TEXTURE_LOD => texture2DLod etc are available
#ifdef GL_EXT_shader_texture_lod
#extension GL_EXT_shader_texture_lod : enable
# define TEXTURE_LOD
#define texture2DLod texture2DLodEXT
#define texture2DProjLod texture2DProjLodEXT
#define texture2DProjLod texture2DProjLodEXT
#define textureCubeLod textureCubeLodEXT
#define texture2DGrad texture2DGradEXT
#define texture2DProjGrad texture2DProjGradEXT
#define texture2DProjGrad texture2DProjGradEXT
#define textureCubeGrad textureCubeGradEXT
#endif
#if (__VERSION__ > 120)
# define TEXTURE_LOD
#endif




#define MODULE_FP64
uniform float ONE;

const vec2 E_FP64 = vec2(2.7182817459106445e+00, 8.254840366817007e-08);
const vec2 LOG2_FP64 = vec2(0.6931471824645996e+00, -1.9046542121259336e-09);
const vec2 PI_FP64 = vec2(3.1415927410125732, -8.742278012618954e-8);
const vec2 TWO_PI_FP64 = vec2(6.2831854820251465, -1.7484556025237907e-7);
const vec2 PI_2_FP64 = vec2(1.5707963705062866, -4.371139006309477e-8);
const vec2 PI_4_FP64 = vec2(0.7853981852531433, -2.1855695031547384e-8);
const vec2 PI_16_FP64 = vec2(0.19634954631328583, -5.463923757886846e-9);
const vec2 PI_16_2_FP64 = vec2(0.39269909262657166, -1.0927847515773692e-8);
const vec2 PI_16_3_FP64 = vec2(0.5890486240386963, -1.4906100798128818e-9);
const vec2 PI_180_FP64 = vec2(0.01745329238474369, 1.3519960498364902e-10);

const vec2 SIN_TABLE_0_FP64 = vec2(0.19509032368659973, -1.6704714833615242e-9);
const vec2 SIN_TABLE_1_FP64 = vec2(0.3826834261417389, 6.22335089017767e-9);
const vec2 SIN_TABLE_2_FP64 = vec2(0.5555702447891235, -1.1769521357507529e-8);
const vec2 SIN_TABLE_3_FP64 = vec2(0.7071067690849304, 1.2101617041793133e-8);

const vec2 COS_TABLE_0_FP64 = vec2(0.9807852506637573, 2.9739473106360492e-8);
const vec2 COS_TABLE_1_FP64 = vec2(0.9238795042037964, 2.8307490351764386e-8);
const vec2 COS_TABLE_2_FP64 = vec2(0.8314695954322815, 1.6870263741530778e-8);
const vec2 COS_TABLE_3_FP64 = vec2(0.7071067690849304, 1.2101617152815436e-8);

const vec2 INVERSE_FACTORIAL_3_FP64 = vec2(1.666666716337204e-01, -4.967053879312289e-09); // 1/3!
const vec2 INVERSE_FACTORIAL_4_FP64 = vec2(4.16666679084301e-02, -1.2417634698280722e-09); // 1/4!
const vec2 INVERSE_FACTORIAL_5_FP64 = vec2(8.333333767950535e-03, -4.34617203337595e-10); // 1/5!
const vec2 INVERSE_FACTORIAL_6_FP64 = vec2(1.3888889225199819e-03, -3.3631094437103215e-11); // 1/6!
const vec2 INVERSE_FACTORIAL_7_FP64 = vec2(1.9841270113829523e-04,  -2.725596874933456e-12); // 1/7!
const vec2 INVERSE_FACTORIAL_8_FP64 = vec2(2.4801587642286904e-05, -3.406996025904184e-13); // 1/8!
const vec2 INVERSE_FACTORIAL_9_FP64 = vec2(2.75573188446287533e-06, 3.7935713937038186e-14); // 1/9!
const vec2 INVERSE_FACTORIAL_10_FP64 = vec2(2.755731998149713e-07, -7.575112367869873e-15); // 1/10!

float nint(float d) {
    if (d == floor(d)) return d;
    return floor(d + 0.5);
}

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
vec2 split(float a) {
  const float SPLIT = 4097.0;
  float t = a * SPLIT;
  float a_hi = t * ONE - (t - a);
  float a_lo = a * ONE - a_hi;
  return vec2(a_hi, a_lo);
}
#else
vec2 split(float a) {
  const float SPLIT = 4097.0;
  float t = a * SPLIT;
  float a_hi = t - (t - a);
  float a_lo = a - a_hi;
  return vec2(a_hi, a_lo);
}
#endif

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
vec2 quickTwoSum(float a, float b) {
  float sum = (a + b) * ONE;
  float err = b - (sum - a) * ONE;
  return vec2(sum, err);
}
#else
vec2 quickTwoSum(float a, float b) {
  float sum = a + b;
  float err = b - (sum - a);
  return vec2(sum, err);
}
#endif

vec2 nint_fp64(vec2 a) {
    float hi = nint(a.x);
    float lo;
    vec2 tmp;
    if (hi == a.x) {
        lo = nint(a.y);
        tmp = quickTwoSum(hi, lo);
    } else {
        lo = 0.0;
        if (abs(hi - a.x) == 0.5 && a.y < 0.0) {
            hi -= 1.0;
        }
        tmp = vec2(hi, lo);
    }
    return tmp;
}

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)

/* The purpose of this workaround is to prevent compilers from
optimizing away necessary arithmetic operations by swapping their sequences
or transform the equation to some 'equivalent' from.

The method is to multiply an artifical variable, ONE, which will be known to
the compiler to be one only at the runtime. The whole expression is then represented
as a polynomial with respective to ONE. In the coefficients of all terms, only one a
and one b should appear

err = (a + b) * ONE^6 - a * ONE^5 - (a + b) * ONE^4 + a * ONE^3 - b - (a + b) * ONE^2 + a * ONE
*/

vec2 twoSum(float a, float b) {
  float s = (a + b);
  float v = (s * ONE - a) * ONE;
  float err = (a - (s - v) * ONE) * ONE * ONE * ONE + (b - v);
  return vec2(s, err);
}
#else
vec2 twoSum(float a, float b) {
  float s = a + b;
  float v = s - a;
  float err = (a - (s - v)) + (b - v);
  return vec2(s, err);
}
#endif

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
/* Same thing as in twoSum() */
vec2 twoSub(float a, float b) {
  float s = (a - b);
  float v = (s * ONE - a) * ONE;
  float err = (a - (s - v) * ONE) * ONE * ONE * ONE - (b + v);
  return vec2(s, err);
}
#else
vec2 twoSub(float a, float b) {
  float s = a - b;
  float v = s - a;
  float err = (a - (s - v)) - (b + v);
  return vec2(s, err);
}
#endif

vec2 twoProd(float a, float b) {
  float prod = a * b;
  vec2 a_fp64 = split(a);
  vec2 b_fp64 = split(b);
  float err = ((a_fp64.x * b_fp64.x - prod) + a_fp64.x * b_fp64.y +
    a_fp64.y * b_fp64.x) + a_fp64.y * b_fp64.y;
  return vec2(prod, err);
}

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
vec2 twoSqr(float a) {
  float prod = a * a;
  vec2 a_fp64 = split(a);

  float err = ((a_fp64.x * a_fp64.x - prod) * ONE + 2.0 * a_fp64.x *
    a_fp64.y * ONE * ONE) + a_fp64.y * a_fp64.y * ONE * ONE * ONE;
  return vec2(prod, err);
}
#else
vec2 twoSqr(float a) {
  float prod = a * a;
  vec2 a_fp64 = split(a);

  float err = ((a_fp64.x * a_fp64.x - prod) + 2.0 * a_fp64.x * a_fp64.y) + a_fp64.y * a_fp64.y;
  return vec2(prod, err);
}
#endif

vec2 sum_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSum(a.x, b.x);
  t = twoSum(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 sub_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSub(a.x, b.x);
  t = twoSub(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 mul_fp64(vec2 a, vec2 b) {
  vec2 prod = twoProd(a.x, b.x);
  // y component is for the error
  prod.y += a.x * b.y;
  prod.y += a.y * b.x;
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

vec2 div_fp64(vec2 a, vec2 b) {
  float xn = 1.0 / b.x;
  vec2 yn = a * xn;
  float diff = (sub_fp64(a, mul_fp64(b, yn))).x;
  vec2 prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

vec2 sqrt_fp64(vec2 a) {

  if (a.x == 0.0 && a.y == 0.0) return vec2(0.0, 0.0);
  if (a.x < 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);

  float x = 1.0 / sqrt(a.x);
  float yn = a.x * x;
#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
  vec2 yn_sqr = twoSqr(yn) * ONE;
#else
  vec2 yn_sqr = twoSqr(yn);
#endif
  float diff = sub_fp64(a, yn_sqr).x;
  vec2 prod = twoProd(x * 0.5, diff);
  return sum_fp64(vec2(yn, 0.0), prod);
}

/* k_power controls how much range reduction we would like to have
Range reduction uses the following method:
assume a = k_power * r + m * log(2), k and m being integers.
Set k_power = 4 (we can choose other k to trade accuracy with performance.
we only need to calculate exp(r) and using exp(a) = 2^m * exp(r)^k_power;
*/

vec2 exp_fp64(vec2 a) {
  // We need to make sure these two numbers match
  // as bit-wise shift is not available in GLSL 1.0
  const int k_power = 4;
  const float k = 16.0;

  const float inv_k = 1.0 / k;

  if (a.x <= -88.0) return vec2(0.0, 0.0);
  if (a.x >= 88.0) return vec2(1.0 / 0.0, 1.0 / 0.0);
  if (a.x == 0.0 && a.y == 0.0) return vec2(1.0, 0.0);
  if (a.x == 1.0 && a.y == 0.0) return E_FP64;

  float m = floor(a.x / LOG2_FP64.x + 0.5);
  vec2 r = sub_fp64(a, mul_fp64(LOG2_FP64, vec2(m, 0.0))) * inv_k;
  vec2 s, t, p;

  p = mul_fp64(r, r);
  s = sum_fp64(r, p * 0.5);
  p = mul_fp64(p, r);
  t = mul_fp64(p, INVERSE_FACTORIAL_3_FP64);

  s = sum_fp64(s, t);
  p = mul_fp64(p, r);
  t = mul_fp64(p, INVERSE_FACTORIAL_4_FP64);

  s = sum_fp64(s, t);
  p = mul_fp64(p, r);
  t = mul_fp64(p, INVERSE_FACTORIAL_5_FP64);

  // s = sum_fp64(s, t);
  // p = mul_fp64(p, r);
  // t = mul_fp64(p, INVERSE_FACTORIAL_6_FP64);

  // s = sum_fp64(s, t);
  // p = mul_fp64(p, r);
  // t = mul_fp64(p, INVERSE_FACTORIAL_7_FP64);

  s = sum_fp64(s, t);


  // At this point, s = exp(r) - 1; but after following 4 recursions, we will get exp(r) ^ 512 - 1.
  for (int i = 0; i < k_power; i++) {
    s = sum_fp64(s * 2.0, mul_fp64(s, s));
  }

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
  s = sum_fp64(s, vec2(ONE, 0.0));
#else
  s = sum_fp64(s, vec2(1.0, 0.0));
#endif

  return s * pow(2.0, m);
//   return r;
}

vec2 log_fp64(vec2 a)
{
  if (a.x == 1.0 && a.y == 0.0) return vec2(0.0, 0.0);
  if (a.x <= 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);
  vec2 x = vec2(log(a.x), 0.0);
  vec2 s;
#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
  s = vec2(ONE, 0.0);
#else
  s = vec2(1.0, 0.0);
#endif

  x = sub_fp64(sum_fp64(x, mul_fp64(a, exp_fp64(-x))), s);
  return x;
}

vec2 sin_taylor_fp64(vec2 a) {
  vec2 r, s, t, x;

  if (a.x == 0.0 && a.y == 0.0) {
    return vec2(0.0, 0.0);
  }

  x = -mul_fp64(a, a);
  s = a;
  r = a;

  r = mul_fp64(r, x);
  t = mul_fp64(r, INVERSE_FACTORIAL_3_FP64);
  s = sum_fp64(s, t);

  r = mul_fp64(r, x);
  t = mul_fp64(r, INVERSE_FACTORIAL_5_FP64);
  s = sum_fp64(s, t);

  /* keep the following commented code in case we need them
  for extra accuracy from the Taylor expansion*/

  // r = mul_fp64(r, x);
  // t = mul_fp64(r, INVERSE_FACTORIAL_7_FP64);
  // s = sum_fp64(s, t);

  // r = mul_fp64(r, x);
  // t = mul_fp64(r, INVERSE_FACTORIAL_9_FP64);
  // s = sum_fp64(s, t);

  return s;
}

vec2 cos_taylor_fp64(vec2 a) {
  vec2 r, s, t, x;

  if (a.x == 0.0 && a.y == 0.0) {
    return vec2(1.0, 0.0);
  }

  x = -mul_fp64(a, a);
  r = x;
  s = sum_fp64(vec2(1.0, 0.0), r * 0.5);

  r = mul_fp64(r, x);
  t = mul_fp64(r, INVERSE_FACTORIAL_4_FP64);
  s = sum_fp64(s, t);

  r = mul_fp64(r, x);
  t = mul_fp64(r, INVERSE_FACTORIAL_6_FP64);
  s = sum_fp64(s, t);

  /* keep the following commented code in case we need them
  for extra accuracy from the Taylor expansion*/

  // r = mul_fp64(r, x);
  // t = mul_fp64(r, INVERSE_FACTORIAL_8_FP64);
  // s = sum_fp64(s, t);

  // r = mul_fp64(r, x);
  // t = mul_fp64(r, INVERSE_FACTORIAL_10_FP64);
  // s = sum_fp64(s, t);

  return s;
}

void sincos_taylor_fp64(vec2 a, out vec2 sin_t, out vec2 cos_t) {
  if (a.x == 0.0 && a.y == 0.0) {
    sin_t = vec2(0.0, 0.0);
    cos_t = vec2(1.0, 0.0);
  }

  sin_t = sin_taylor_fp64(a);
  cos_t = sqrt_fp64(sub_fp64(vec2(1.0, 0.0), mul_fp64(sin_t, sin_t)));
}

vec2 sin_fp64(vec2 a) {
    if (a.x == 0.0 && a.y == 0.0) {
        return vec2(0.0, 0.0);
    }

    // 2pi range reduction
    vec2 z = nint_fp64(div_fp64(a, TWO_PI_FP64));
    vec2 r = sub_fp64(a, mul_fp64(TWO_PI_FP64, z));

    vec2 t;
    float q = floor(r.x / PI_2_FP64.x + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return vec2(0.0 / 0.0, 0.0 / 0.0);
    }

    t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));

    q = floor(t.x / PI_16_FP64.x + 0.5);
    int k = int(q);

    if (k == 0) {
        if (j == 0) {
            return sin_taylor_fp64(t);
        } else if (j == 1) {
            return cos_taylor_fp64(t);
        } else if (j == -1) {
            return -cos_taylor_fp64(t);
        } else {
            return -sin_taylor_fp64(t);
        }
    }

    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return vec2(0.0 / 0.0, 0.0 / 0.0);
    } else {
        t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));
    }

    vec2 u = vec2(0.0, 0.0);
    vec2 v = vec2(0.0, 0.0);

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
    if (abs(float(abs_k) - 1.0) < 0.5) {
        u = COS_TABLE_0_FP64;
        v = SIN_TABLE_0_FP64;
    } else if (abs(float(abs_k) - 2.0) < 0.5) {
        u = COS_TABLE_1_FP64;
        v = SIN_TABLE_1_FP64;
    } else if (abs(float(abs_k) - 3.0) < 0.5) {
        u = COS_TABLE_2_FP64;
        v = SIN_TABLE_2_FP64;
    } else if (abs(float(abs_k) - 4.0) < 0.5) {
        u = COS_TABLE_3_FP64;
        v = SIN_TABLE_3_FP64;
    }
#else
    if (abs_k == 1) {
        u = COS_TABLE_0_FP64;
        v = SIN_TABLE_0_FP64;
    } else if (abs_k == 2) {
        u = COS_TABLE_1_FP64;
        v = SIN_TABLE_1_FP64;
    } else if (abs_k == 3) {
        u = COS_TABLE_2_FP64;
        v = SIN_TABLE_2_FP64;
    } else if (abs_k == 4) {
        u = COS_TABLE_3_FP64;
        v = SIN_TABLE_3_FP64;
    }
#endif

    vec2 sin_t, cos_t;
    sincos_taylor_fp64(t, sin_t, cos_t);



    vec2 result = vec2(0.0, 0.0);
    if (j == 0) {
        if (k > 0) {
            result = sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
        } else {
            result = sub_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
        }
    } else if (j == 1) {
        if (k > 0) {
            result = sub_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));
        } else {
            result = sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));
        }
    } else if (j == -1) {
        if (k > 0) {
            result = sub_fp64(mul_fp64(v, sin_t), mul_fp64(u, cos_t));
        } else {
            result = -sum_fp64(mul_fp64(v, sin_t), mul_fp64(u, cos_t));
        }
    } else {
        if (k > 0) {
            result = -sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
        } else {
            result = sub_fp64(mul_fp64(v, cos_t), mul_fp64(u, sin_t));
        }
    }

    return result;
}

vec2 cos_fp64(vec2 a) {
    if (a.x == 0.0 && a.y == 0.0) {
        return vec2(1.0, 0.0);
    }

    // 2pi range reduction
    vec2 z = nint_fp64(div_fp64(a, TWO_PI_FP64));
    vec2 r = sub_fp64(a, mul_fp64(TWO_PI_FP64, z));

    vec2 t;
    float q = floor(r.x / PI_2_FP64.x + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return vec2(0.0 / 0.0, 0.0 / 0.0);
    }

    t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));

    q = floor(t.x / PI_16_FP64.x + 0.5);
    int k = int(q);

    if (k == 0) {
        if (j == 0) {
            return cos_taylor_fp64(t);
        } else if (j == 1) {
            return -sin_taylor_fp64(t);
        } else if (j == -1) {
            return sin_taylor_fp64(t);
        } else {
            return -cos_taylor_fp64(t);
        }
    }

    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return vec2(0.0 / 0.0, 0.0 / 0.0);
    } else {
        t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));
    }

    vec2 u = vec2(0.0, 0.0);
    vec2 v = vec2(0.0, 0.0);

#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
    if (abs(float(abs_k) - 1.0) < 0.5) {
        u = COS_TABLE_0_FP64;
        v = SIN_TABLE_0_FP64;
    } else if (abs(float(abs_k) - 2.0) < 0.5) {
        u = COS_TABLE_1_FP64;
        v = SIN_TABLE_1_FP64;
    } else if (abs(float(abs_k) - 3.0) < 0.5) {
        u = COS_TABLE_2_FP64;
        v = SIN_TABLE_2_FP64;
    } else if (abs(float(abs_k) - 4.0) < 0.5) {
        u = COS_TABLE_3_FP64;
        v = SIN_TABLE_3_FP64;
    }
#else
    if (abs_k == 1) {
        u = COS_TABLE_0_FP64;
        v = SIN_TABLE_0_FP64;
    } else if (abs_k == 2) {
        u = COS_TABLE_1_FP64;
        v = SIN_TABLE_1_FP64;
    } else if (abs_k == 3) {
        u = COS_TABLE_2_FP64;
        v = SIN_TABLE_2_FP64;
    } else if (abs_k == 4) {
        u = COS_TABLE_3_FP64;
        v = SIN_TABLE_3_FP64;
    }
#endif

    vec2 sin_t, cos_t;
    sincos_taylor_fp64(t, sin_t, cos_t);

    vec2 result = vec2(0.0, 0.0);
    if (j == 0) {
        if (k > 0) {
            result = sub_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));
        } else {
            result = sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));
        }
    } else if (j == 1) {
        if (k > 0) {
            result = -sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
        } else {
            result = sub_fp64(mul_fp64(v, cos_t), mul_fp64(u, sin_t));
        }
    } else if (j == -1) {
        if (k > 0) {
            result = sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
        } else {
            result = sub_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
        }
    } else {
        if (k > 0) {
            result = sub_fp64(mul_fp64(v, sin_t), mul_fp64(u, cos_t));
        } else {
            result = -sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));
        }
    }

    return result;
}

vec2 tan_fp64(vec2 a) {
    vec2 sin_a;
    vec2 cos_a;

    if (a.x == 0.0 && a.y == 0.0) {
        return vec2(0.0, 0.0);
    }

    // 2pi range reduction
    vec2 z = nint_fp64(div_fp64(a, TWO_PI_FP64));
    vec2 r = sub_fp64(a, mul_fp64(TWO_PI_FP64, z));

    vec2 t;
    float q = floor(r.x / PI_2_FP64.x + 0.5);
    int j = int(q);


    if (j < -2 || j > 2) {
        return vec2(0.0 / 0.0, 0.0 / 0.0);
    }

    t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));

    q = floor(t.x / PI_16_FP64.x + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    // We just can't get PI/16 * 3.0 very accurately.
    // so let's just store it
    if (abs_k > 4) {
        return vec2(0.0 / 0.0, 0.0 / 0.0);
    } else {
        t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));
    }


    vec2 u = vec2(0.0, 0.0);
    vec2 v = vec2(0.0, 0.0);

    vec2 sin_t, cos_t;
    vec2 s, c;
    sincos_taylor_fp64(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0_FP64;
            v = SIN_TABLE_0_FP64;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1_FP64;
            v = SIN_TABLE_1_FP64;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2_FP64;
            v = SIN_TABLE_2_FP64;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3_FP64;
            v = SIN_TABLE_3_FP64;
        }
#else
        if (abs_k == 1) {
            u = COS_TABLE_0_FP64;
            v = SIN_TABLE_0_FP64;
        } else if (abs_k == 2) {
            u = COS_TABLE_1_FP64;
            v = SIN_TABLE_1_FP64;
        } else if (abs_k == 3) {
            u = COS_TABLE_2_FP64;
            v = SIN_TABLE_2_FP64;
        } else if (abs_k == 4) {
            u = COS_TABLE_3_FP64;
            v = SIN_TABLE_3_FP64;
        }
#endif
        if (k > 0) {
            s = sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
            c = sub_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));
        } else {
            s = sub_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));
            c = sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return div_fp64(sin_a, cos_a);
}

vec2 radians_fp64(vec2 degree) {
  return mul_fp64(degree, PI_180_FP64);
}

vec2 mix_fp64(vec2 a, vec2 b, float x) {
  vec2 range = sub_fp64(b, a);
  return sum_fp64(a, mul_fp64(range, vec2(x, 0.0)));
}

// Vector functions
// vec2 functions
void vec2_sum_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {
    out_val[0] = sum_fp64(a[0], b[0]);
    out_val[1] = sum_fp64(a[1], b[1]);
}

void vec2_sub_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {
    out_val[0] = sub_fp64(a[0], b[0]);
    out_val[1] = sub_fp64(a[1], b[1]);
}

void vec2_mul_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {
    out_val[0] = mul_fp64(a[0], b[0]);
    out_val[1] = mul_fp64(a[1], b[1]);
}

void vec2_div_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {
    out_val[0] = div_fp64(a[0], b[0]);
    out_val[1] = div_fp64(a[1], b[1]);
}

void vec2_mix_fp64(vec2 x[2], vec2 y[2], float a, out vec2 out_val[2]) {
  vec2 range[2];
  vec2_sub_fp64(y, x, range);
  vec2 portion[2];
  portion[0] = range[0] * a;
  portion[1] = range[1] * a;
  vec2_sum_fp64(x, portion, out_val);
}

vec2 vec2_length_fp64(vec2 x[2]) {
  return sqrt_fp64(sum_fp64(mul_fp64(x[0], x[0]), mul_fp64(x[1], x[1])));
}

void vec2_normalize_fp64(vec2 x[2], out vec2 out_val[2]) {
  vec2 length = vec2_length_fp64(x);
  vec2 length_vec2[2];
  length_vec2[0] = length;
  length_vec2[1] = length;

  vec2_div_fp64(x, length_vec2, out_val);
}

vec2 vec2_distance_fp64(vec2 x[2], vec2 y[2]) {
  vec2 diff[2];
  vec2_sub_fp64(x, y, diff);
  return vec2_length_fp64(diff);
}

vec2 vec2_dot_fp64(vec2 a[2], vec2 b[2]) {
  vec2 v[2];

  v[0] = mul_fp64(a[0], b[0]);
  v[1] = mul_fp64(a[1], b[1]);

  return sum_fp64(v[0], v[1]);
}

// vec3 functions
void vec3_sub_fp64(vec2 a[3], vec2 b[3], out vec2 out_val[3]) {
  for (int i = 0; i < 3; i++) {
    out_val[i] = sum_fp64(a[i], b[i]);
  }
}

void vec3_sum_fp64(vec2 a[3], vec2 b[3], out vec2 out_val[3]) {
  for (int i = 0; i < 3; i++) {
    out_val[i] = sum_fp64(a[i], b[i]);
  }
}

vec2 vec3_length_fp64(vec2 x[3]) {
  return sqrt_fp64(sum_fp64(sum_fp64(mul_fp64(x[0], x[0]), mul_fp64(x[1], x[1])),
    mul_fp64(x[2], x[2])));
}

vec2 vec3_distance_fp64(vec2 x[3], vec2 y[3]) {
  vec2 diff[3];
  vec3_sub_fp64(x, y, diff);
  return vec3_length_fp64(diff);
}

// vec4 functions
void vec4_fp64(vec4 a, out vec2 out_val[4]) {
  out_val[0].x = a[0];
  out_val[0].y = 0.0;

  out_val[1].x = a[1];
  out_val[1].y = 0.0;

  out_val[2].x = a[2];
  out_val[2].y = 0.0;

  out_val[3].x = a[3];
  out_val[3].y = 0.0;
}

void vec4_scalar_mul_fp64(vec2 a[4], vec2 b, out vec2 out_val[4]) {
  out_val[0] = mul_fp64(a[0], b);
  out_val[1] = mul_fp64(a[1], b);
  out_val[2] = mul_fp64(a[2], b);
  out_val[3] = mul_fp64(a[3], b);
}

void vec4_sum_fp64(vec2 a[4], vec2 b[4], out vec2 out_val[4]) {
  for (int i = 0; i < 4; i++) {
    out_val[i] = sum_fp64(a[i], b[i]);
  }
}

void vec4_dot_fp64(vec2 a[4], vec2 b[4], out vec2 out_val) {
  vec2 v[4];

  v[0] = mul_fp64(a[0], b[0]);
  v[1] = mul_fp64(a[1], b[1]);
  v[2] = mul_fp64(a[2], b[2]);
  v[3] = mul_fp64(a[3], b[3]);

  out_val = sum_fp64(sum_fp64(v[0], v[1]), sum_fp64(v[2], v[3]));
}

void mat4_vec4_mul_fp64(vec2 b[16], vec2 a[4], out vec2 out_val[4]) {
  vec2 tmp[4];

  for (int i = 0; i < 4; i++)
  {
    for (int j = 0; j < 4; j++)
    {
      tmp[j] = b[j + i * 4];
    }
    vec4_dot_fp64(a, tmp, out_val[i]);
  }
}
// END MODULE_fp64

#define MODULE_PROJECT64

const vec2 WORLD_SCALE_FP64 = vec2(81.4873275756836, 0.0000032873668232014097);

uniform vec2 projectionScaleFP64;
uniform vec2 projectionFP64[16];

// longitude: lnglat_fp64.xy; latitude: lnglat_fp64.zw
void mercatorProject_fp64(vec4 lnglat_fp64, out vec2 out_val[2]) {

#if defined(NVIDIA_FP64_WORKAROUND)
  out_val[0] = sum_fp64(radians_fp64(lnglat_fp64.xy), PI_FP64 * ONE);
#else
  out_val[0] = sum_fp64(radians_fp64(lnglat_fp64.xy), PI_FP64);
#endif
  out_val[1] = sub_fp64(PI_FP64,
    log_fp64(tan_fp64(sum_fp64(PI_4_FP64, radians_fp64(lnglat_fp64.zw) / 2.0))));
  return;
}

void project_position_fp64(vec4 position_fp64, out vec2 out_val[2]) {

  vec2 pos_fp64[2];
  mercatorProject_fp64(position_fp64, pos_fp64);
  vec2 x_fp64 = mul_fp64(pos_fp64[0], projectionScaleFP64);
  vec2 y_fp64 = mul_fp64(pos_fp64[1], projectionScaleFP64);
  out_val[0] = mul_fp64(x_fp64, WORLD_SCALE_FP64);
  out_val[1] = mul_fp64(y_fp64, WORLD_SCALE_FP64);

  return;
}

vec4 project_to_clipspace_fp64(vec2 vertex_pos_modelspace[4]) {
  vec2 vertex_pos_clipspace[4];
  mat4_vec4_mul_fp64(projectionFP64, vertex_pos_modelspace, vertex_pos_clipspace);
  return vec4(
    vertex_pos_clipspace[0].x,
    vertex_pos_clipspace[1].x,
    vertex_pos_clipspace[2].x,
    vertex_pos_clipspace[3].x
    );
}
// END MODULE_project64

#define SHADER_NAME scatterplot-layer-vertex-shader-64

attribute vec3 positions;

attribute vec3 instancePositions;
attribute vec2 instancePositions64xyLow;
attribute float instanceRadius;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;

// Only one-dimensional arrays may be declared in GLSL ES 1.0. specs p.24
uniform float opacity;
uniform float radiusScale;
uniform float radiusMinPixels;
uniform float radiusMaxPixels;
uniform float renderPickingBuffer;
uniform float outline;
uniform float strokeWidth;

varying vec4 vColor;
varying vec2 unitPosition;
varying float innerUnitRadius;

void main(void) {
  // Multiply out radius and clamp to limits
  float outerRadiusPixels = clamp(
    project_scale(radiusScale * instanceRadius),
    radiusMinPixels, radiusMaxPixels
  );

  // outline is centered at the radius
  // outer radius needs to offset by half stroke width
  outerRadiusPixels += outline * strokeWidth / 2.0;

  // position on the containing square in [-1, 1] space
  unitPosition = positions.xy;
  // 0 - solid circle, 1 - stroke with lineWidth=0
  innerUnitRadius = outline * (1.0 - strokeWidth / outerRadiusPixels);

  vec4 instancePositions64xy = vec4(
    instancePositions.x, instancePositions64xyLow.x,
    instancePositions.y, instancePositions64xyLow.y);

  vec2 projected_coord_xy[2];
  project_position_fp64(instancePositions64xy, projected_coord_xy);

  vec2 vertex_pos_localspace[4];
  vec4_fp64(vec4(positions * outerRadiusPixels, 0.0), vertex_pos_localspace);

  vec2 vertex_pos_modelspace[4];
  vertex_pos_modelspace[0] = sum_fp64(vertex_pos_localspace[0], projected_coord_xy[0]);
  vertex_pos_modelspace[1] = sum_fp64(vertex_pos_localspace[1], projected_coord_xy[1]);
  vertex_pos_modelspace[2] = sum_fp64(vertex_pos_localspace[2],
    vec2(project_scale(instancePositions.z), 0.0));
  vertex_pos_modelspace[3] = vec2(1.0, 0.0);

  gl_Position = project_to_clipspace_fp64(vertex_pos_modelspace);

  if (renderPickingBuffer > 0.5) {
    vColor = vec4(instancePickingColors / 255., 1.);
  } else {
    vColor = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;
  }
  // // Apply opacity to instance color, or return instance picking color
  // vec4 color = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;
  // vec4 pickingColor = vec4(instancePickingColors / 255., 1.);
  // vColor = mix(color, pickingColor, renderPickingBuffer);
}
`;

const SHADER_TYPE = 35633;

const ERROR_LOG = `\
WARNING: 0:264: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:264: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:294: '/' : Divide by zero during constant folding
WARNING: 0:294: '/' : Divide by zero during constant folding
WARNING: 0:344: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:344: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:447: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:447: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:470: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:470: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:557: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:557: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:580: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:580: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:669: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:669: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:681: '/' : Zero divided by zero during constant folding generated NaN
WARNING: 0:681: '/' : Zero divided by zero during constant folding generated NaN
ERROR: 0:967: 'project_scale' : no matching overloaded function found
ERROR: 0:994: 'project_scale' : no matching overloaded function found
`;

const EXPECTED = `\
GLSL compilation error in vertex shader scatterplot-layer-vertex-shader-64

 965:     radiusMinPixels, radiusMaxPixels
 966:   );
 967: 
^^^ ERROR: 'project_scale' : no matching overloaded function found

 992:   vertex_pos_modelspace[3] = vec2(1.0, 0.0);
 993: 
 994:   gl_Position = project_to_clipspace_fp64(vertex_pos_modelspace);
^^^ ERROR: 'project_scale' : no matching overloaded function found


 262: 
 263:   float x = 1.0 / sqrt(a.x);
 264:   float yn = a.x * x;
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

 292:   if (a.x == 0.0 && a.y == 0.0) return vec2(1.0, 0.0);
 293:   if (a.x == 1.0 && a.y == 0.0) return E_FP64;
 294: 
^^^ WARNING: '/' : Divide by zero during constant folding

 342:   vec2 x = vec2(log(a.x), 0.0);
 343:   vec2 s;
 344: #if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

 445:     }
 446: 
 447:     t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

 468:     } else {
 469:         t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));
 470:     }
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

 555:     }
 556: 
 557:     t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

 578:     } else {
 579:         t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));
 580:     }
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

 667:     }
 668: 
 669:     t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

 679:     } else {
 680:         t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));
 681:     }
^^^ WARNING: '/' : Zero divided by zero during constant folding generated NaN

`;

test('WebGL#formatGLSLError', (t) => {
  const error = formatGLSLError(ERROR_LOG, SHADER_SOURCE, SHADER_TYPE);
  t.equal(error, EXPECTED, 'formatGLSLError generated correct error');
  t.end();
});
