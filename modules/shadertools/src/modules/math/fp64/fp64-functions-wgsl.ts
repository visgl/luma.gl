// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** WGSL double-single functions used by geographic projection. */
export const fp64functionsWGSL = /* wgsl */ `\
const E_FP64 = vec2f(2.7182817459106445, 8.254840366817007e-8);
const LOG2_FP64 = vec2f(0.6931471824645996, -1.9046542121259336e-9);
const PI_FP64 = vec2f(3.1415927410125732, -8.742278012618954e-8);
const TWO_PI_FP64 = vec2f(6.2831854820251465, -1.7484556025237907e-7);
const PI_2_FP64 = vec2f(1.5707963705062866, -4.371139006309477e-8);
const PI_4_FP64 = vec2f(0.7853981852531433, -2.1855695031547384e-8);
const PI_180_FP64 = vec2f(0.01745329238474369, 1.3519960498364902e-10);

const FP64_EXP_COEFFICIENTS = array<vec2f, 17>(
  vec2f(1.0, 0.0),
  vec2f(1.0, 0.0),
  vec2f(0.5, 0.0),
  vec2f(0.1666666716337204, -4.967053879312289e-09),
  vec2f(0.0416666679084301, -1.2417634698280722e-09),
  vec2f(0.008333333767950535, -4.34617203337595e-10),
  vec2f(0.0013888889225199819, -3.3631094437103215e-11),
  vec2f(0.00019841270113829523, -2.725596874933456e-12),
  vec2f(2.4801587642286904e-05, -3.40699609366682e-13),
  vec2f(2.7557318844628753e-06, 3.793571224297229e-14),
  vec2f(2.755731998149713e-07, -7.575112209051195e-15),
  vec2f(2.5052107943679403e-08, 4.4176230446483665e-16),
  vec2f(2.0876755879584152e-09, 1.1082839809204342e-16),
  vec2f(1.6059044372074283e-10, -5.352526511562726e-18),
  vec2f(1.147074536050896e-11, 2.372207689231238e-19),
  vec2f(7.647163609812713e-13, 1.2200710471178288e-20),
  vec2f(4.7794772561329454e-14, 7.62544404448643e-22)
);
const FP64_SIN_COEFFICIENTS = array<vec2f, 9>(
  vec2f(1.0, 0.0),
  vec2f(0.1666666716337204, -4.967053879312289e-09),
  vec2f(0.008333333767950535, -4.34617203337595e-10),
  vec2f(0.00019841270113829523, -2.725596874933456e-12),
  vec2f(2.7557318844628753e-06, 3.793571224297229e-14),
  vec2f(2.5052107943679403e-08, 4.4176230446483665e-16),
  vec2f(1.6059044372074283e-10, -5.352526511562726e-18),
  vec2f(7.647163609812713e-13, 1.2200710471178288e-20),
  vec2f(2.8114573589663704e-15, -1.0462084739763658e-22)
);
const FP64_COS_COEFFICIENTS = array<vec2f, 9>(
  vec2f(1.0, 0.0),
  vec2f(0.5, 0.0),
  vec2f(0.0416666679084301, -1.2417634698280722e-09),
  vec2f(0.0013888889225199819, -3.3631094437103215e-11),
  vec2f(2.4801587642286904e-05, -3.40699609366682e-13),
  vec2f(2.755731998149713e-07, -7.575112209051195e-15),
  vec2f(2.0876755879584152e-09, 1.1082839809204342e-16),
  vec2f(1.147074536050896e-11, 2.372207689231238e-19),
  vec2f(4.7794772561329454e-14, 7.62544404448643e-22)
);

// Reduce by log(2) before evaluating the exponential. Horner evaluation uses split
// coefficients to retain low terms without repeatedly expanding double-single division.
fn exp_fp64(value: vec2f) -> vec2f {
  let a = normalize_fp64(value);
  if (is_nan_fp64(a)) { return a; }
  if (a.x > 88.72283905206835) { return vec2f(bitcast<f32>(0x7f800000u | (bitcast<u32>(a.x) & 0x80000000u)), 0.0); }
  if (a.x < -103.9720770839918) { return vec2f(0.0); }
  let exponent = min(127.0, floor(a.x / LOG2_FP64.x + 0.5));
  let remainder = sub_fp64(a, mul_fp64(LOG2_FP64, vec2f(exponent, 0.0)));
  var result = FP64_EXP_COEFFICIENTS[16];
  for (var i = 15; i >= 0; i--) {
    result = sum_fp64(FP64_EXP_COEFFICIENTS[i], mul_fp64(remainder, result));
  }
  return fp64_scale_fp64(result, i32(exponent));
}

fn log_fp64(value: vec2f) -> vec2f {
  let a = normalize_fp64(value);
  if (is_nan_fp64(a)) { return a; }
  // Match the GLSL helper's domain: zero and negative inputs return NaN.
  if (sign_fp64(a) <= 0) { return vec2f(fp64_nan(a.x), 0.0); }
  if (!is_finite_fp64(a)) { return a; }
  // Normalize the magnitude before Newton refinement so exp(estimate) cannot overflow
  // for large inputs or underflow for tiny inputs. Bit extraction also handles subnormals.
  let exponent = max(-126, i32((bitcast<u32>(a.x) >> 23u) & 255u) - 127);
  let mantissa = fp64_scale_fp64(a, -exponent);
  var result = vec2f(log(mantissa.x), 0.0);
  // Newton correction, written as (a - exp(x)) / exp(x), preserves tiny log(1 + low).
  // Two iterations remove the error in the native f32 starting estimate.
  for (var i = 0; i < 2; i++) {
    let estimate = exp_fp64(result);
    result = sum_fp64(result, div_fp64(sub_fp64(mantissa, estimate), estimate));
  }
  return sum_fp64(result, mul_fp64(LOG2_FP64, vec2f(f32(exponent), 0.0)));
}

struct Fp64SinCos {
  sine: vec2f,
  cosine: vec2f,
};

fn fp64_sincos(value: vec2f) -> Fp64SinCos {
  let a = normalize_fp64(value);
  // The projection use case stays within one turn. Bound conversion to an integer quadrant;
  // this is not a large-argument Payne-Hanek trigonometric range reducer.
  if (!is_finite_fp64(a) || abs(a.x) > 1000000.0) {
    return Fp64SinCos(vec2f(fp64_nan(a.x), 0.0), vec2f(fp64_nan(a.x), 0.0));
  }
  let quadrant = i32(floor(a.x / PI_2_FP64.x + 0.5));
  let remainder = sub_fp64(a, mul_fp64(PI_2_FP64, vec2f(f32(quadrant), 0.0)));
  let negativeSquare = -mul_fp64(remainder, remainder);
  var sinePolynomial = FP64_SIN_COEFFICIENTS[8];
  var cosine = FP64_COS_COEFFICIENTS[8];
  for (var i = 7; i >= 0; i--) {
    sinePolynomial = sum_fp64(FP64_SIN_COEFFICIENTS[i], mul_fp64(negativeSquare, sinePolynomial));
    cosine = sum_fp64(FP64_COS_COEFFICIENTS[i], mul_fp64(negativeSquare, cosine));
  }
  let sine = mul_fp64(remainder, sinePolynomial);
  switch ((quadrant % 4 + 4) % 4) {
    case 0: { return Fp64SinCos(sine, cosine); }
    case 1: { return Fp64SinCos(cosine, -sine); }
    case 2: { return Fp64SinCos(-sine, -cosine); }
    default: { return Fp64SinCos(-cosine, sine); }
  }
}

fn sin_fp64(a: vec2f) -> vec2f { return fp64_sincos(a).sine; }
fn cos_fp64(a: vec2f) -> vec2f { return fp64_sincos(a).cosine; }
fn tan_fp64(a: vec2f) -> vec2f {
  let result = fp64_sincos(a);
  return div_fp64(result.sine, result.cosine);
}

fn radians_fp64(degree: vec2f) -> vec2f { return mul_fp64(degree, PI_180_FP64); }
fn mix_fp64(a: vec2f, b: vec2f, x: f32) -> vec2f {
  return sum_fp64(a, mul_fp64(sub_fp64(b, a), vec2f(x, 0.0)));
}

// WGSL returns arrays in place of GLSL out parameters. Each vec2f stores [high, low].
fn vec4_fp64(a: vec4f) -> array<vec2f, 4> {
  return array<vec2f, 4>(vec2f(a.x, 0.0), vec2f(a.y, 0.0), vec2f(a.z, 0.0), vec2f(a.w, 0.0));
}

fn vec4_dot_fp64(a: array<vec2f, 4>, b: array<vec2f, 4>) -> vec2f {
  return sum_fp64(
    sum_fp64(mul_fp64(a[0], b[0]), mul_fp64(a[1], b[1])),
    sum_fp64(mul_fp64(a[2], b[2]), mul_fp64(a[3], b[3])));
}

// Same row-major pair ordering as the GLSL helper: result[i] = dot(matrix[i * 4..], a).
fn mat4_vec4_mul_fp64(matrix: array<vec2f, 16>, a: array<vec2f, 4>) -> array<vec2f, 4> {
  var result: array<vec2f, 4>;
  for (var i = 0; i < 4; i++) {
    let row = array<vec2f, 4>(matrix[i * 4], matrix[i * 4 + 1], matrix[i * 4 + 2], matrix[i * 4 + 3]);
    result[i] = vec4_dot_fp64(a, row);
  }
  return result;
}
`;
