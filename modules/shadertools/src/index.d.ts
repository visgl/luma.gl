//typings for @luma.gl/shadertools v8.1.2
declare module "@luma.gl/shadertools/lib/constants" {
	export const VERTEX_SHADER = "vs";
	export const FRAGMENT_SHADER = "fs";
}
declare module "@luma.gl/shadertools/utils/assert" {
	export default function assert(condition: any, message: any): void;
}
declare module "utils" {
	//export { default as assert } from '@luma.gl/shadertools/utils/assert';
}
declare module "@luma.gl/shadertools/lib/filters/prop-types" {
	export function parsePropTypes(propDefs: any): {};
}
declare module "@luma.gl/shadertools/lib/shader-module" {
	export default class ShaderModule {
		constructor({
			name,
			vs,
			fs,
			dependencies,
			uniforms,
			getUniforms,
			deprecations,
			defines,
			inject,
			vertexShader,
			fragmentShader,
		}: {
			name: any;
			vs: any;
			fs: any;
			dependencies?: any[];
			uniforms: any;
			getUniforms: any;
			deprecations?: any[];
			defines?: {};
			inject?: {};
			vertexShader: any;
			fragmentShader: any;
		});
		getModuleSource(type: any): string;
		getUniforms(opts: any, uniforms: any): any;
		getDefines(): any;
		checkDeprecations(shaderSource: any, log: any): void;
		_parseDeprecationDefinitions(deprecations: any): any;
		_defaultGetUniforms(opts?: {}): {};
	}
	export function normalizeShaderModule(module: any): any;
}
declare module "@luma.gl/shadertools/lib/resolve-modules" {
	export function resolveModules(modules: any): any[];
	function getShaderDependencies(modules: any): any[];
	function getDependencyGraph({
		modules,
		level,
		moduleMap,
		moduleDepth,
	}: {
		modules: any;
		level: any;
		moduleMap: any;
		moduleDepth: any;
	}): void;
	export const TEST_EXPORTS: {
		getShaderDependencies: typeof getShaderDependencies;
		getDependencyGraph: typeof getDependencyGraph;
	};
	export { };
}
declare module "@luma.gl/shadertools/utils/is-old-ie" {
	export default function isOldIE(opts?: {}): boolean;
}
declare module "@luma.gl/shadertools/utils/webgl-info" {
	const FEATURES: {};
	export { FEATURES };
	export function getContextInfo(
		gl: WebGLRenderingContext
	): {
		gpuVendor: string;
		vendor: any;
		renderer: any;
		version: any;
		shadingLanguageVersion: any;
	};
	export function canCompileGLGSExtension(gl: WebGLRenderingContext, cap: any, opts?: {}): any;
	export function hasFeatures(gl: WebGLRenderingContext, features: any): any;
}
declare module "@luma.gl/shadertools/lib/platform-defines" {
	export function getPlatformShaderDefines(
		gl: WebGLRenderingContext
	):
		| "#define NVIDIA_GPU\n// Nvidia optimizes away the calculation necessary for emulated fp64\n#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1\n"
		| "#define INTEL_GPU\n// Intel optimizes away the calculation necessary for emulated fp64\n#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1\n// Intel's built-in 'tan' function doesn't have acceptable precision\n#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1\n// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow\n#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1\n"
		| "#define AMD_GPU\n"
		| "#define DEFAULT_GPU\n// Prevent driver from optimizing away the calculation necessary for emulated fp64\n#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1\n// Intel's built-in 'tan' function doesn't have acceptable precision\n#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1\n// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow\n#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1\n";
	export function getVersionDefines(
		gl: WebGLRenderingContext,
		glslVersion: any,
		isFragment: any
	): string;
}
declare module "@luma.gl/shadertools/modules/module-injectors" {
	export const MODULE_INJECTORS_VS =
		"#ifdef MODULE_LOGDEPTH\n  logdepth_adjustPosition(gl_Position);\n#endif\n";
	export const MODULE_INJECTORS_FS =
		"#ifdef MODULE_MATERIAL\n  gl_FragColor = material_filterColor(gl_FragColor);\n#endif\n\n#ifdef MODULE_LIGHTING\n  gl_FragColor = lighting_filterColor(gl_FragColor);\n#endif\n\n#ifdef MODULE_FOG\n  gl_FragColor = fog_filterColor(gl_FragColor);\n#endif\n\n#ifdef MODULE_PICKING\n  gl_FragColor = picking_filterHighlightColor(gl_FragColor);\n  gl_FragColor = picking_filterPickingColor(gl_FragColor);\n#endif\n\n#ifdef MODULE_LOGDEPTH\n  logdepth_setFragDepth();\n#endif\n";
}
declare module "@luma.gl/shadertools/lib/inject-shader" {
	export const DECLARATION_INJECT_MARKER = "__LUMA_INJECT_DECLARATIONS__";
	export default function injectShader(
		source: any,
		type: any,
		inject: any,
		injectStandardStubs: any
	): any;
	export function combineInjects(injects: any): {};
}
declare module "@luma.gl/shadertools/lib/transpile-shader" {
	export default function transpileShader(
		source: any,
		targetGLSLVersion: any,
		isVertex: any
	): any;
}
declare module "@luma.gl/shadertools/lib/assemble-shaders" {
	export function assembleShaders(
		gl: WebGLRenderingContext,
		opts: any
	): {
		gl: WebGLRenderingContext;
		vs: string;
		fs: string;
		getUniforms: (opts: any) => {};
	};
}
declare module "@luma.gl/shadertools/utils/shader-utils" {
	export function getQualifierDetails(
		line: any,
		qualifiers: any
	): {
		qualifier: any;
		type: any;
		name: any;
	};
	export function getPassthroughFS({
		version,
		input,
		inputType,
		output,
	}?: {
		version?: number;
		input: any;
		inputType: any;
		output: any;
	}): string;
	export function typeToChannelSuffix(type: any): "x" | "xy" | "xyz" | "xyzw";
	export function typeToChannelCount(type: any): 2 | 1 | 3 | 4;
	export function convertToVec4(variable: any, type: any): any;
}
declare module "@luma.gl/shadertools/modules/fp32/fp32" {
	const _default: {
		name: string;
		vs: string;
		fs: any;
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fp64/fp64-utils" {
	/**
	 * Calculate WebGL 64 bit float
	 * @param a {number} - the input float number
	 * @param out {array, optional} - the output array. If not supplied, a new array is created.
	 * @param startIndex {integer, optional} - the index in the output array to fill from. Default 0.
	 * @returns {array} - the fp64 representation of the input number
	 */
	export function fp64ify(a: any, out?: any[], startIndex?: number): any[];
	/**
	 * Calculate the low part of a WebGL 64 bit float
	 * @param a {number} - the input float number
	 * @returns {number} - the lower 32 bit of the number
	 */
	export function fp64LowPart(a: any): number;
	/**
	 * Calculate WebGL 64 bit matrix (transposed "Float64Array")
	 * @param matrix {Matrix4} - the input matrix
	 * @returns {array} - the fp64 representation of the input matrix
	 */
	export function fp64ifyMatrix4(matrix: any): Float32Array;
}
declare module "@luma.gl/shadertools/modules/fp64/fp64-arithmetic.glsl" {
	const _default: "uniform float ONE;\n\n/*\nAbout LUMA_FP64_CODE_ELIMINATION_WORKAROUND\n\nThe purpose of this workaround is to prevent shader compilers from\noptimizing away necessary arithmetic operations by swapping their sequences\nor transform the equation to some 'equivalent' from.\n\nThe method is to multiply an artifical variable, ONE, which will be known to\nthe compiler to be 1 only at runtime. The whole expression is then represented\nas a polynomial with respective to ONE. In the coefficients of all terms, only one a\nand one b should appear\n\nerr = (a + b) * ONE^6 - a * ONE^5 - (a + b) * ONE^4 + a * ONE^3 - b - (a + b) * ONE^2 + a * ONE\n*/\n\n// Divide float number to high and low floats to extend fraction bits\nvec2 split(float a) {\n  const float SPLIT = 4097.0;\n  float t = a * SPLIT;\n#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)\n  float a_hi = t * ONE - (t - a);\n  float a_lo = a * ONE - a_hi;\n#else\n  float a_hi = t - (t - a);\n  float a_lo = a - a_hi;\n#endif\n  return vec2(a_hi, a_lo);\n}\n\n// Divide float number again when high float uses too many fraction bits\nvec2 split2(vec2 a) {\n  vec2 b = split(a.x);\n  b.y += a.y;\n  return b;\n}\n\n// Special sum operation when a > b\nvec2 quickTwoSum(float a, float b) {\n#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)\n  float sum = (a + b) * ONE;\n  float err = b - (sum - a) * ONE;\n#else\n  float sum = a + b;\n  float err = b - (sum - a);\n#endif\n  return vec2(sum, err);\n}\n\n// General sum operation\nvec2 twoSum(float a, float b) {\n  float s = (a + b);\n#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)\n  float v = (s * ONE - a) * ONE;\n  float err = (a - (s - v) * ONE) * ONE * ONE * ONE + (b - v);\n#else\n  float v = s - a;\n  float err = (a - (s - v)) + (b - v);\n#endif\n  return vec2(s, err);\n}\n\nvec2 twoSub(float a, float b) {\n  float s = (a - b);\n#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)\n  float v = (s * ONE - a) * ONE;\n  float err = (a - (s - v) * ONE) * ONE * ONE * ONE - (b + v);\n#else\n  float v = s - a;\n  float err = (a - (s - v)) - (b + v);\n#endif\n  return vec2(s, err);\n}\n\nvec2 twoSqr(float a) {\n  float prod = a * a;\n  vec2 a_fp64 = split(a);\n#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)\n  float err = ((a_fp64.x * a_fp64.x - prod) * ONE + 2.0 * a_fp64.x *\n    a_fp64.y * ONE * ONE) + a_fp64.y * a_fp64.y * ONE * ONE * ONE;\n#else\n  float err = ((a_fp64.x * a_fp64.x - prod) + 2.0 * a_fp64.x * a_fp64.y) + a_fp64.y * a_fp64.y;\n#endif\n  return vec2(prod, err);\n}\n\nvec2 twoProd(float a, float b) {\n  float prod = a * b;\n  vec2 a_fp64 = split(a);\n  vec2 b_fp64 = split(b);\n  float err = ((a_fp64.x * b_fp64.x - prod) + a_fp64.x * b_fp64.y +\n    a_fp64.y * b_fp64.x) + a_fp64.y * b_fp64.y;\n  return vec2(prod, err);\n}\n\nvec2 sum_fp64(vec2 a, vec2 b) {\n  vec2 s, t;\n  s = twoSum(a.x, b.x);\n  t = twoSum(a.y, b.y);\n  s.y += t.x;\n  s = quickTwoSum(s.x, s.y);\n  s.y += t.y;\n  s = quickTwoSum(s.x, s.y);\n  return s;\n}\n\nvec2 sub_fp64(vec2 a, vec2 b) {\n  vec2 s, t;\n  s = twoSub(a.x, b.x);\n  t = twoSub(a.y, b.y);\n  s.y += t.x;\n  s = quickTwoSum(s.x, s.y);\n  s.y += t.y;\n  s = quickTwoSum(s.x, s.y);\n  return s;\n}\n\nvec2 mul_fp64(vec2 a, vec2 b) {\n  vec2 prod = twoProd(a.x, b.x);\n  // y component is for the error\n  prod.y += a.x * b.y;\n#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)\n  prod = split2(prod);\n#endif\n  prod = quickTwoSum(prod.x, prod.y);\n  prod.y += a.y * b.x;\n#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)\n  prod = split2(prod);\n#endif\n  prod = quickTwoSum(prod.x, prod.y);\n  return prod;\n}\n\nvec2 div_fp64(vec2 a, vec2 b) {\n  float xn = 1.0 / b.x;\n#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)\n  vec2 yn = mul_fp64(a, vec2(xn, 0));\n#else\n  vec2 yn = a * xn;\n#endif\n  float diff = (sub_fp64(a, mul_fp64(b, yn))).x;\n  vec2 prod = twoProd(xn, diff);\n  return sum_fp64(yn, prod);\n}\n\nvec2 sqrt_fp64(vec2 a) {\n  if (a.x == 0.0 && a.y == 0.0) return vec2(0.0, 0.0);\n  if (a.x < 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);\n\n  float x = 1.0 / sqrt(a.x);\n  float yn = a.x * x;\n#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)\n  vec2 yn_sqr = twoSqr(yn) * ONE;\n#else\n  vec2 yn_sqr = twoSqr(yn);\n#endif\n  float diff = sub_fp64(a, yn_sqr).x;\n  vec2 prod = twoProd(x * 0.5, diff);\n#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)\n  return sum_fp64(split(yn), prod);\n#else\n  return sum_fp64(vec2(yn, 0.0), prod);\n#endif\n}\n";
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fp64/fp64-functions.glsl" {
	const _default: "const vec2 E_FP64 = vec2(2.7182817459106445e+00, 8.254840366817007e-08);\nconst vec2 LOG2_FP64 = vec2(0.6931471824645996e+00, -1.9046542121259336e-09);\nconst vec2 PI_FP64 = vec2(3.1415927410125732, -8.742278012618954e-8);\nconst vec2 TWO_PI_FP64 = vec2(6.2831854820251465, -1.7484556025237907e-7);\nconst vec2 PI_2_FP64 = vec2(1.5707963705062866, -4.371139006309477e-8);\nconst vec2 PI_4_FP64 = vec2(0.7853981852531433, -2.1855695031547384e-8);\nconst vec2 PI_16_FP64 = vec2(0.19634954631328583, -5.463923757886846e-9);\nconst vec2 PI_16_2_FP64 = vec2(0.39269909262657166, -1.0927847515773692e-8);\nconst vec2 PI_16_3_FP64 = vec2(0.5890486240386963, -1.4906100798128818e-9);\nconst vec2 PI_180_FP64 = vec2(0.01745329238474369, 1.3519960498364902e-10);\n\nconst vec2 SIN_TABLE_0_FP64 = vec2(0.19509032368659973, -1.6704714833615242e-9);\nconst vec2 SIN_TABLE_1_FP64 = vec2(0.3826834261417389, 6.22335089017767e-9);\nconst vec2 SIN_TABLE_2_FP64 = vec2(0.5555702447891235, -1.1769521357507529e-8);\nconst vec2 SIN_TABLE_3_FP64 = vec2(0.7071067690849304, 1.2101617041793133e-8);\n\nconst vec2 COS_TABLE_0_FP64 = vec2(0.9807852506637573, 2.9739473106360492e-8);\nconst vec2 COS_TABLE_1_FP64 = vec2(0.9238795042037964, 2.8307490351764386e-8);\nconst vec2 COS_TABLE_2_FP64 = vec2(0.8314695954322815, 1.6870263741530778e-8);\nconst vec2 COS_TABLE_3_FP64 = vec2(0.7071067690849304, 1.2101617152815436e-8);\n\nconst vec2 INVERSE_FACTORIAL_3_FP64 = vec2(1.666666716337204e-01, -4.967053879312289e-09); // 1/3!\nconst vec2 INVERSE_FACTORIAL_4_FP64 = vec2(4.16666679084301e-02, -1.2417634698280722e-09); // 1/4!\nconst vec2 INVERSE_FACTORIAL_5_FP64 = vec2(8.333333767950535e-03, -4.34617203337595e-10); // 1/5!\nconst vec2 INVERSE_FACTORIAL_6_FP64 = vec2(1.3888889225199819e-03, -3.3631094437103215e-11); // 1/6!\nconst vec2 INVERSE_FACTORIAL_7_FP64 = vec2(1.9841270113829523e-04,  -2.725596874933456e-12); // 1/7!\nconst vec2 INVERSE_FACTORIAL_8_FP64 = vec2(2.4801587642286904e-05, -3.406996025904184e-13); // 1/8!\nconst vec2 INVERSE_FACTORIAL_9_FP64 = vec2(2.75573188446287533e-06, 3.7935713937038186e-14); // 1/9!\nconst vec2 INVERSE_FACTORIAL_10_FP64 = vec2(2.755731998149713e-07, -7.575112367869873e-15); // 1/10!\n\nfloat nint(float d) {\n    if (d == floor(d)) return d;\n    return floor(d + 0.5);\n}\n\nvec2 nint_fp64(vec2 a) {\n    float hi = nint(a.x);\n    float lo;\n    vec2 tmp;\n    if (hi == a.x) {\n        lo = nint(a.y);\n        tmp = quickTwoSum(hi, lo);\n    } else {\n        lo = 0.0;\n        if (abs(hi - a.x) == 0.5 && a.y < 0.0) {\n            hi -= 1.0;\n        }\n        tmp = vec2(hi, lo);\n    }\n    return tmp;\n}\n\n/* k_power controls how much range reduction we would like to have\nRange reduction uses the following method:\nassume a = k_power * r + m * log(2), k and m being integers.\nSet k_power = 4 (we can choose other k to trade accuracy with performance.\nwe only need to calculate exp(r) and using exp(a) = 2^m * exp(r)^k_power;\n*/\n\nvec2 exp_fp64(vec2 a) {\n  // We need to make sure these two numbers match\n  // as bit-wise shift is not available in GLSL 1.0\n  const int k_power = 4;\n  const float k = 16.0;\n\n  const float inv_k = 1.0 / k;\n\n  if (a.x <= -88.0) return vec2(0.0, 0.0);\n  if (a.x >= 88.0) return vec2(1.0 / 0.0, 1.0 / 0.0);\n  if (a.x == 0.0 && a.y == 0.0) return vec2(1.0, 0.0);\n  if (a.x == 1.0 && a.y == 0.0) return E_FP64;\n\n  float m = floor(a.x / LOG2_FP64.x + 0.5);\n  vec2 r = sub_fp64(a, mul_fp64(LOG2_FP64, vec2(m, 0.0))) * inv_k;\n  vec2 s, t, p;\n\n  p = mul_fp64(r, r);\n  s = sum_fp64(r, p * 0.5);\n  p = mul_fp64(p, r);\n  t = mul_fp64(p, INVERSE_FACTORIAL_3_FP64);\n\n  s = sum_fp64(s, t);\n  p = mul_fp64(p, r);\n  t = mul_fp64(p, INVERSE_FACTORIAL_4_FP64);\n\n  s = sum_fp64(s, t);\n  p = mul_fp64(p, r);\n  t = mul_fp64(p, INVERSE_FACTORIAL_5_FP64);\n\n  // s = sum_fp64(s, t);\n  // p = mul_fp64(p, r);\n  // t = mul_fp64(p, INVERSE_FACTORIAL_6_FP64);\n\n  // s = sum_fp64(s, t);\n  // p = mul_fp64(p, r);\n  // t = mul_fp64(p, INVERSE_FACTORIAL_7_FP64);\n\n  s = sum_fp64(s, t);\n\n\n  // At this point, s = exp(r) - 1; but after following 4 recursions, we will get exp(r) ^ 512 - 1.\n  for (int i = 0; i < k_power; i++) {\n    s = sum_fp64(s * 2.0, mul_fp64(s, s));\n  }\n\n#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)\n  s = sum_fp64(s, vec2(ONE, 0.0));\n#else\n  s = sum_fp64(s, vec2(1.0, 0.0));\n#endif\n\n  return s * pow(2.0, m);\n//   return r;\n}\n\nvec2 log_fp64(vec2 a)\n{\n  if (a.x == 1.0 && a.y == 0.0) return vec2(0.0, 0.0);\n  if (a.x <= 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);\n  vec2 x = vec2(log(a.x), 0.0);\n  vec2 s;\n#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)\n  s = vec2(ONE, 0.0);\n#else\n  s = vec2(1.0, 0.0);\n#endif\n\n  x = sub_fp64(sum_fp64(x, mul_fp64(a, exp_fp64(-x))), s);\n  return x;\n}\n\nvec2 sin_taylor_fp64(vec2 a) {\n  vec2 r, s, t, x;\n\n  if (a.x == 0.0 && a.y == 0.0) {\n    return vec2(0.0, 0.0);\n  }\n\n  x = -mul_fp64(a, a);\n  s = a;\n  r = a;\n\n  r = mul_fp64(r, x);\n  t = mul_fp64(r, INVERSE_FACTORIAL_3_FP64);\n  s = sum_fp64(s, t);\n\n  r = mul_fp64(r, x);\n  t = mul_fp64(r, INVERSE_FACTORIAL_5_FP64);\n  s = sum_fp64(s, t);\n\n  /* keep the following commented code in case we need them\n  for extra accuracy from the Taylor expansion*/\n\n  // r = mul_fp64(r, x);\n  // t = mul_fp64(r, INVERSE_FACTORIAL_7_FP64);\n  // s = sum_fp64(s, t);\n\n  // r = mul_fp64(r, x);\n  // t = mul_fp64(r, INVERSE_FACTORIAL_9_FP64);\n  // s = sum_fp64(s, t);\n\n  return s;\n}\n\nvec2 cos_taylor_fp64(vec2 a) {\n  vec2 r, s, t, x;\n\n  if (a.x == 0.0 && a.y == 0.0) {\n    return vec2(1.0, 0.0);\n  }\n\n  x = -mul_fp64(a, a);\n  r = x;\n  s = sum_fp64(vec2(1.0, 0.0), r * 0.5);\n\n  r = mul_fp64(r, x);\n  t = mul_fp64(r, INVERSE_FACTORIAL_4_FP64);\n  s = sum_fp64(s, t);\n\n  r = mul_fp64(r, x);\n  t = mul_fp64(r, INVERSE_FACTORIAL_6_FP64);\n  s = sum_fp64(s, t);\n\n  /* keep the following commented code in case we need them\n  for extra accuracy from the Taylor expansion*/\n\n  // r = mul_fp64(r, x);\n  // t = mul_fp64(r, INVERSE_FACTORIAL_8_FP64);\n  // s = sum_fp64(s, t);\n\n  // r = mul_fp64(r, x);\n  // t = mul_fp64(r, INVERSE_FACTORIAL_10_FP64);\n  // s = sum_fp64(s, t);\n\n  return s;\n}\n\nvoid sincos_taylor_fp64(vec2 a, out vec2 sin_t, out vec2 cos_t) {\n  if (a.x == 0.0 && a.y == 0.0) {\n    sin_t = vec2(0.0, 0.0);\n    cos_t = vec2(1.0, 0.0);\n  }\n\n  sin_t = sin_taylor_fp64(a);\n  cos_t = sqrt_fp64(sub_fp64(vec2(1.0, 0.0), mul_fp64(sin_t, sin_t)));\n}\n\nvec2 sin_fp64(vec2 a) {\n    if (a.x == 0.0 && a.y == 0.0) {\n        return vec2(0.0, 0.0);\n    }\n\n    // 2pi range reduction\n    vec2 z = nint_fp64(div_fp64(a, TWO_PI_FP64));\n    vec2 r = sub_fp64(a, mul_fp64(TWO_PI_FP64, z));\n\n    vec2 t;\n    float q = floor(r.x / PI_2_FP64.x + 0.5);\n    int j = int(q);\n\n    if (j < -2 || j > 2) {\n        return vec2(0.0 / 0.0, 0.0 / 0.0);\n    }\n\n    t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));\n\n    q = floor(t.x / PI_16_FP64.x + 0.5);\n    int k = int(q);\n\n    if (k == 0) {\n        if (j == 0) {\n            return sin_taylor_fp64(t);\n        } else if (j == 1) {\n            return cos_taylor_fp64(t);\n        } else if (j == -1) {\n            return -cos_taylor_fp64(t);\n        } else {\n            return -sin_taylor_fp64(t);\n        }\n    }\n\n    int abs_k = int(abs(float(k)));\n\n    if (abs_k > 4) {\n        return vec2(0.0 / 0.0, 0.0 / 0.0);\n    } else {\n        t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));\n    }\n\n    vec2 u = vec2(0.0, 0.0);\n    vec2 v = vec2(0.0, 0.0);\n\n#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)\n    if (abs(float(abs_k) - 1.0) < 0.5) {\n        u = COS_TABLE_0_FP64;\n        v = SIN_TABLE_0_FP64;\n    } else if (abs(float(abs_k) - 2.0) < 0.5) {\n        u = COS_TABLE_1_FP64;\n        v = SIN_TABLE_1_FP64;\n    } else if (abs(float(abs_k) - 3.0) < 0.5) {\n        u = COS_TABLE_2_FP64;\n        v = SIN_TABLE_2_FP64;\n    } else if (abs(float(abs_k) - 4.0) < 0.5) {\n        u = COS_TABLE_3_FP64;\n        v = SIN_TABLE_3_FP64;\n    }\n#else\n    if (abs_k == 1) {\n        u = COS_TABLE_0_FP64;\n        v = SIN_TABLE_0_FP64;\n    } else if (abs_k == 2) {\n        u = COS_TABLE_1_FP64;\n        v = SIN_TABLE_1_FP64;\n    } else if (abs_k == 3) {\n        u = COS_TABLE_2_FP64;\n        v = SIN_TABLE_2_FP64;\n    } else if (abs_k == 4) {\n        u = COS_TABLE_3_FP64;\n        v = SIN_TABLE_3_FP64;\n    }\n#endif\n\n    vec2 sin_t, cos_t;\n    sincos_taylor_fp64(t, sin_t, cos_t);\n\n\n\n    vec2 result = vec2(0.0, 0.0);\n    if (j == 0) {\n        if (k > 0) {\n            result = sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n        } else {\n            result = sub_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n        }\n    } else if (j == 1) {\n        if (k > 0) {\n            result = sub_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));\n        } else {\n            result = sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));\n        }\n    } else if (j == -1) {\n        if (k > 0) {\n            result = sub_fp64(mul_fp64(v, sin_t), mul_fp64(u, cos_t));\n        } else {\n            result = -sum_fp64(mul_fp64(v, sin_t), mul_fp64(u, cos_t));\n        }\n    } else {\n        if (k > 0) {\n            result = -sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n        } else {\n            result = sub_fp64(mul_fp64(v, cos_t), mul_fp64(u, sin_t));\n        }\n    }\n\n    return result;\n}\n\nvec2 cos_fp64(vec2 a) {\n    if (a.x == 0.0 && a.y == 0.0) {\n        return vec2(1.0, 0.0);\n    }\n\n    // 2pi range reduction\n    vec2 z = nint_fp64(div_fp64(a, TWO_PI_FP64));\n    vec2 r = sub_fp64(a, mul_fp64(TWO_PI_FP64, z));\n\n    vec2 t;\n    float q = floor(r.x / PI_2_FP64.x + 0.5);\n    int j = int(q);\n\n    if (j < -2 || j > 2) {\n        return vec2(0.0 / 0.0, 0.0 / 0.0);\n    }\n\n    t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));\n\n    q = floor(t.x / PI_16_FP64.x + 0.5);\n    int k = int(q);\n\n    if (k == 0) {\n        if (j == 0) {\n            return cos_taylor_fp64(t);\n        } else if (j == 1) {\n            return -sin_taylor_fp64(t);\n        } else if (j == -1) {\n            return sin_taylor_fp64(t);\n        } else {\n            return -cos_taylor_fp64(t);\n        }\n    }\n\n    int abs_k = int(abs(float(k)));\n\n    if (abs_k > 4) {\n        return vec2(0.0 / 0.0, 0.0 / 0.0);\n    } else {\n        t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));\n    }\n\n    vec2 u = vec2(0.0, 0.0);\n    vec2 v = vec2(0.0, 0.0);\n\n#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)\n    if (abs(float(abs_k) - 1.0) < 0.5) {\n        u = COS_TABLE_0_FP64;\n        v = SIN_TABLE_0_FP64;\n    } else if (abs(float(abs_k) - 2.0) < 0.5) {\n        u = COS_TABLE_1_FP64;\n        v = SIN_TABLE_1_FP64;\n    } else if (abs(float(abs_k) - 3.0) < 0.5) {\n        u = COS_TABLE_2_FP64;\n        v = SIN_TABLE_2_FP64;\n    } else if (abs(float(abs_k) - 4.0) < 0.5) {\n        u = COS_TABLE_3_FP64;\n        v = SIN_TABLE_3_FP64;\n    }\n#else\n    if (abs_k == 1) {\n        u = COS_TABLE_0_FP64;\n        v = SIN_TABLE_0_FP64;\n    } else if (abs_k == 2) {\n        u = COS_TABLE_1_FP64;\n        v = SIN_TABLE_1_FP64;\n    } else if (abs_k == 3) {\n        u = COS_TABLE_2_FP64;\n        v = SIN_TABLE_2_FP64;\n    } else if (abs_k == 4) {\n        u = COS_TABLE_3_FP64;\n        v = SIN_TABLE_3_FP64;\n    }\n#endif\n\n    vec2 sin_t, cos_t;\n    sincos_taylor_fp64(t, sin_t, cos_t);\n\n    vec2 result = vec2(0.0, 0.0);\n    if (j == 0) {\n        if (k > 0) {\n            result = sub_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));\n        } else {\n            result = sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));\n        }\n    } else if (j == 1) {\n        if (k > 0) {\n            result = -sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n        } else {\n            result = sub_fp64(mul_fp64(v, cos_t), mul_fp64(u, sin_t));\n        }\n    } else if (j == -1) {\n        if (k > 0) {\n            result = sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n        } else {\n            result = sub_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n        }\n    } else {\n        if (k > 0) {\n            result = sub_fp64(mul_fp64(v, sin_t), mul_fp64(u, cos_t));\n        } else {\n            result = -sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));\n        }\n    }\n\n    return result;\n}\n\nvec2 tan_fp64(vec2 a) {\n    vec2 sin_a;\n    vec2 cos_a;\n\n    if (a.x == 0.0 && a.y == 0.0) {\n        return vec2(0.0, 0.0);\n    }\n\n    // 2pi range reduction\n    vec2 z = nint_fp64(div_fp64(a, TWO_PI_FP64));\n    vec2 r = sub_fp64(a, mul_fp64(TWO_PI_FP64, z));\n\n    vec2 t;\n    float q = floor(r.x / PI_2_FP64.x + 0.5);\n    int j = int(q);\n\n\n    if (j < -2 || j > 2) {\n        return vec2(0.0 / 0.0, 0.0 / 0.0);\n    }\n\n    t = sub_fp64(r, mul_fp64(PI_2_FP64, vec2(q, 0.0)));\n\n    q = floor(t.x / PI_16_FP64.x + 0.5);\n    int k = int(q);\n    int abs_k = int(abs(float(k)));\n\n    // We just can't get PI/16 * 3.0 very accurately.\n    // so let's just store it\n    if (abs_k > 4) {\n        return vec2(0.0 / 0.0, 0.0 / 0.0);\n    } else {\n        t = sub_fp64(t, mul_fp64(PI_16_FP64, vec2(q, 0.0)));\n    }\n\n\n    vec2 u = vec2(0.0, 0.0);\n    vec2 v = vec2(0.0, 0.0);\n\n    vec2 sin_t, cos_t;\n    vec2 s, c;\n    sincos_taylor_fp64(t, sin_t, cos_t);\n\n    if (k == 0) {\n        s = sin_t;\n        c = cos_t;\n    } else {\n#if defined(NVIDIA_FP64_WORKAROUND) || defined(INTEL_FP64_WORKAROUND)\n        if (abs(float(abs_k) - 1.0) < 0.5) {\n            u = COS_TABLE_0_FP64;\n            v = SIN_TABLE_0_FP64;\n        } else if (abs(float(abs_k) - 2.0) < 0.5) {\n            u = COS_TABLE_1_FP64;\n            v = SIN_TABLE_1_FP64;\n        } else if (abs(float(abs_k) - 3.0) < 0.5) {\n            u = COS_TABLE_2_FP64;\n            v = SIN_TABLE_2_FP64;\n        } else if (abs(float(abs_k) - 4.0) < 0.5) {\n            u = COS_TABLE_3_FP64;\n            v = SIN_TABLE_3_FP64;\n        }\n#else\n        if (abs_k == 1) {\n            u = COS_TABLE_0_FP64;\n            v = SIN_TABLE_0_FP64;\n        } else if (abs_k == 2) {\n            u = COS_TABLE_1_FP64;\n            v = SIN_TABLE_1_FP64;\n        } else if (abs_k == 3) {\n            u = COS_TABLE_2_FP64;\n            v = SIN_TABLE_2_FP64;\n        } else if (abs_k == 4) {\n            u = COS_TABLE_3_FP64;\n            v = SIN_TABLE_3_FP64;\n        }\n#endif\n        if (k > 0) {\n            s = sum_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n            c = sub_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));\n        } else {\n            s = sub_fp64(mul_fp64(u, sin_t), mul_fp64(v, cos_t));\n            c = sum_fp64(mul_fp64(u, cos_t), mul_fp64(v, sin_t));\n        }\n    }\n\n    if (j == 0) {\n        sin_a = s;\n        cos_a = c;\n    } else if (j == 1) {\n        sin_a = c;\n        cos_a = -s;\n    } else if (j == -1) {\n        sin_a = -c;\n        cos_a = s;\n    } else {\n        sin_a = -s;\n        cos_a = -c;\n    }\n    return div_fp64(sin_a, cos_a);\n}\n\nvec2 radians_fp64(vec2 degree) {\n  return mul_fp64(degree, PI_180_FP64);\n}\n\nvec2 mix_fp64(vec2 a, vec2 b, float x) {\n  vec2 range = sub_fp64(b, a);\n  return sum_fp64(a, mul_fp64(range, vec2(x, 0.0)));\n}\n\n// Vector functions\n// vec2 functions\nvoid vec2_sum_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {\n    out_val[0] = sum_fp64(a[0], b[0]);\n    out_val[1] = sum_fp64(a[1], b[1]);\n}\n\nvoid vec2_sub_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {\n    out_val[0] = sub_fp64(a[0], b[0]);\n    out_val[1] = sub_fp64(a[1], b[1]);\n}\n\nvoid vec2_mul_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {\n    out_val[0] = mul_fp64(a[0], b[0]);\n    out_val[1] = mul_fp64(a[1], b[1]);\n}\n\nvoid vec2_div_fp64(vec2 a[2], vec2 b[2], out vec2 out_val[2]) {\n    out_val[0] = div_fp64(a[0], b[0]);\n    out_val[1] = div_fp64(a[1], b[1]);\n}\n\nvoid vec2_mix_fp64(vec2 x[2], vec2 y[2], float a, out vec2 out_val[2]) {\n  vec2 range[2];\n  vec2_sub_fp64(y, x, range);\n  vec2 portion[2];\n  portion[0] = range[0] * a;\n  portion[1] = range[1] * a;\n  vec2_sum_fp64(x, portion, out_val);\n}\n\nvec2 vec2_length_fp64(vec2 x[2]) {\n  return sqrt_fp64(sum_fp64(mul_fp64(x[0], x[0]), mul_fp64(x[1], x[1])));\n}\n\nvoid vec2_normalize_fp64(vec2 x[2], out vec2 out_val[2]) {\n  vec2 length = vec2_length_fp64(x);\n  vec2 length_vec2[2];\n  length_vec2[0] = length;\n  length_vec2[1] = length;\n\n  vec2_div_fp64(x, length_vec2, out_val);\n}\n\nvec2 vec2_distance_fp64(vec2 x[2], vec2 y[2]) {\n  vec2 diff[2];\n  vec2_sub_fp64(x, y, diff);\n  return vec2_length_fp64(diff);\n}\n\nvec2 vec2_dot_fp64(vec2 a[2], vec2 b[2]) {\n  vec2 v[2];\n\n  v[0] = mul_fp64(a[0], b[0]);\n  v[1] = mul_fp64(a[1], b[1]);\n\n  return sum_fp64(v[0], v[1]);\n}\n\n// vec3 functions\nvoid vec3_sub_fp64(vec2 a[3], vec2 b[3], out vec2 out_val[3]) {\n  for (int i = 0; i < 3; i++) {\n    out_val[i] = sum_fp64(a[i], b[i]);\n  }\n}\n\nvoid vec3_sum_fp64(vec2 a[3], vec2 b[3], out vec2 out_val[3]) {\n  for (int i = 0; i < 3; i++) {\n    out_val[i] = sum_fp64(a[i], b[i]);\n  }\n}\n\nvec2 vec3_length_fp64(vec2 x[3]) {\n  return sqrt_fp64(sum_fp64(sum_fp64(mul_fp64(x[0], x[0]), mul_fp64(x[1], x[1])),\n    mul_fp64(x[2], x[2])));\n}\n\nvec2 vec3_distance_fp64(vec2 x[3], vec2 y[3]) {\n  vec2 diff[3];\n  vec3_sub_fp64(x, y, diff);\n  return vec3_length_fp64(diff);\n}\n\n// vec4 functions\nvoid vec4_fp64(vec4 a, out vec2 out_val[4]) {\n  out_val[0].x = a[0];\n  out_val[0].y = 0.0;\n\n  out_val[1].x = a[1];\n  out_val[1].y = 0.0;\n\n  out_val[2].x = a[2];\n  out_val[2].y = 0.0;\n\n  out_val[3].x = a[3];\n  out_val[3].y = 0.0;\n}\n\nvoid vec4_scalar_mul_fp64(vec2 a[4], vec2 b, out vec2 out_val[4]) {\n  out_val[0] = mul_fp64(a[0], b);\n  out_val[1] = mul_fp64(a[1], b);\n  out_val[2] = mul_fp64(a[2], b);\n  out_val[3] = mul_fp64(a[3], b);\n}\n\nvoid vec4_sum_fp64(vec2 a[4], vec2 b[4], out vec2 out_val[4]) {\n  for (int i = 0; i < 4; i++) {\n    out_val[i] = sum_fp64(a[i], b[i]);\n  }\n}\n\nvoid vec4_dot_fp64(vec2 a[4], vec2 b[4], out vec2 out_val) {\n  vec2 v[4];\n\n  v[0] = mul_fp64(a[0], b[0]);\n  v[1] = mul_fp64(a[1], b[1]);\n  v[2] = mul_fp64(a[2], b[2]);\n  v[3] = mul_fp64(a[3], b[3]);\n\n  out_val = sum_fp64(sum_fp64(v[0], v[1]), sum_fp64(v[2], v[3]));\n}\n\nvoid mat4_vec4_mul_fp64(vec2 b[16], vec2 a[4], out vec2 out_val[4]) {\n  vec2 tmp[4];\n\n  for (int i = 0; i < 4; i++)\n  {\n    for (int j = 0; j < 4; j++)\n    {\n      tmp[j] = b[j + i * 4];\n    }\n    vec4_dot_fp64(a, tmp, out_val[i]);\n  }\n}\n";
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fp64/fp64" {
	import {
		fp64ify,
		fp64LowPart,
		fp64ifyMatrix4,
	} from "@luma.gl/shadertools/modules/fp64/fp64-utils";
	export { fp64ify, fp64LowPart, fp64ifyMatrix4 };
	function getUniforms(): {
		ONE: number;
	};
	export const fp64arithmetic: {
		name: string;
		vs: string;
		fs: any;
		getUniforms: typeof getUniforms;
		fp64ify: typeof fp64ify;
		fp64LowPart: typeof fp64LowPart;
	};
	const _default: {
		name: string;
		vs: string;
		fs: any;
		dependencies: {
			name: string;
			vs: string;
			fs: any;
			getUniforms: typeof getUniforms;
			fp64ify: typeof fp64ify;
			fp64LowPart: typeof fp64LowPart;
		}[];
		fp64ify: typeof fp64ify;
		fp64LowPart: typeof fp64LowPart;
		fp64ifyMatrix4: typeof fp64ifyMatrix4;
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/project/project" {
	function getUniforms(
		opts?: {
			modelMatrix: number[];
			viewMatrix: number[];
			projectionMatrix: number[];
			cameraPositionWorld: number[];
		},
		prevUniforms?: {}
	): {};
	const _default: {
		name: string;
		getUniforms: typeof getUniforms;
		vs: string;
		fs: string;
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/lights/lights.glsl" {
	const _default: "#if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))\n\nstruct AmbientLight {\n vec3 color;\n};\n\nstruct PointLight {\n vec3 color;\n vec3 position;\n\n // Constant-Linear-Exponential\n vec3 attenuation;\n};\n\nstruct DirectionalLight {\n  vec3 color;\n  vec3 direction;\n};\n\nuniform AmbientLight lighting_uAmbientLight;\nuniform PointLight lighting_uPointLight[MAX_LIGHTS];\nuniform DirectionalLight lighting_uDirectionalLight[MAX_LIGHTS];\nuniform int lighting_uPointLightCount;\nuniform int lighting_uDirectionalLightCount;\n\nuniform bool lighting_uEnabled;\n\nfloat getPointLightAttenuation(PointLight pointLight, float distance) {\n  return pointLight.attenuation.x\n       + pointLight.attenuation.y * distance\n       + pointLight.attenuation.z * distance * distance;\n}\n\n#endif\n";
	export default _default;
}
declare module "@luma.gl/shadertools/modules/lights/lights" {
	const _default: {
		name: string;
		vs: string;
		fs: string;
		getUniforms: typeof getUniforms;
		defines: {
			MAX_LIGHTS: number;
		};
	};
	export default _default;
	function getUniforms(opts?: {}): any;
}
declare module "@luma.gl/shadertools/modules/dirlight/dirlight" {
	function getUniforms(opts?: { lightDirection: Float32Array }): {};
	const _default: {
		name: string;
		vs: any;
		fs: string;
		getUniforms: typeof getUniforms;
		dependencies: {
			name: string;
			getUniforms: (
				opts?: {
					modelMatrix: number[];
					viewMatrix: number[];
					projectionMatrix: number[];
					cameraPositionWorld: number[];
				},
				prevUniforms?: {}
			) => {};
			vs: string;
			fs: string;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/picking/picking" {
	function getUniforms(opts?: {
		pickingSelectedColor: any;
		pickingHighlightColor: Uint8Array;
		pickingActive: boolean;
		pickingAttribute: boolean;
	}): {};
	const _default: {
		name: string;
		vs: string;
		fs: string;
		getUniforms: typeof getUniforms;
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/phong-lighting/phong-lighting.glsl" {
	const _default: "\nuniform float lighting_uAmbient;\nuniform float lighting_uDiffuse;\nuniform float lighting_uShininess;\nuniform vec3  lighting_uSpecularColor;\n\nvec3 lighting_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 view_direction, vec3 normal_worldspace, vec3 color) {\n    vec3 halfway_direction = normalize(light_direction + view_direction);\n    float lambertian = dot(light_direction, normal_worldspace);\n    float specular = 0.0;\n    if (lambertian > 0.0) {\n      float specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);\n      specular = pow(specular_angle, lighting_uShininess);\n    }\n    lambertian = max(lambertian, 0.0);\n    return (lambertian * lighting_uDiffuse * surfaceColor + specular * lighting_uSpecularColor) * color;\n}\n\nvec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {\n  vec3 lightColor = surfaceColor;\n\n  if (lighting_uEnabled) {\n    vec3 view_direction = normalize(cameraPosition - position_worldspace);\n    lightColor = lighting_uAmbient * surfaceColor * lighting_uAmbientLight.color;\n\n    for (int i = 0; i < MAX_LIGHTS; i++) {\n      if (i >= lighting_uPointLightCount) {\n        break;\n      }\n      PointLight pointLight = lighting_uPointLight[i];\n      vec3 light_position_worldspace = pointLight.position;\n      vec3 light_direction = normalize(light_position_worldspace - position_worldspace);\n      lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color);\n    }\n\n    for (int i = 0; i < MAX_LIGHTS; i++) {\n      if (i >= lighting_uDirectionalLightCount) {\n        break;\n      }\n      DirectionalLight directionalLight = lighting_uDirectionalLight[i];\n      lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);\n    }\n  }\n  return lightColor;\n}\n\nvec3 lighting_getSpecularLightColor(vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {\n  vec3 lightColor = vec3(0, 0, 0);\n  vec3 surfaceColor = vec3(0, 0, 0);\n\n  if (lighting_uEnabled) {\n    vec3 view_direction = normalize(cameraPosition - position_worldspace);\n\n    for (int i = 0; i < MAX_LIGHTS; i++) {\n      if (i >= lighting_uPointLightCount) {\n        break;\n      }\n      PointLight pointLight = lighting_uPointLight[i];\n      vec3 light_position_worldspace = pointLight.position;\n      vec3 light_direction = normalize(light_position_worldspace - position_worldspace);\n      lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color);\n    }\n\n    for (int i = 0; i < MAX_LIGHTS; i++) {\n      if (i >= lighting_uDirectionalLightCount) {\n        break;\n      }\n      DirectionalLight directionalLight = lighting_uDirectionalLight[i];\n      lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);\n    }\n  }\n  return lightColor;\n}\n";
	export default _default;
}
declare module "@luma.gl/shadertools/modules/phong-lighting/phong-lighting" {
	const gouraudLighting: {
		name: string;
		dependencies: {
			name: string;
			vs: string;
			fs: string;
			getUniforms: (opts?: {}) => any;
			defines: {
				MAX_LIGHTS: number;
			};
		}[];
		vs: string;
		defines: {
			LIGHTING_VERTEX: number;
		};
		getUniforms: typeof getUniforms;
	};
	const phongLighting: {
		name: string;
		dependencies: {
			name: string;
			vs: string;
			fs: string;
			getUniforms: (opts?: {}) => any;
			defines: {
				MAX_LIGHTS: number;
			};
		}[];
		fs: string;
		defines: {
			LIGHTING_FRAGMENT: number;
		};
		getUniforms: typeof getUniforms;
	};
	function getUniforms(opts?: {}):
		| {
			lighting_uAmbient: any;
			lighting_uDiffuse: any;
			lighting_uShininess: any;
			lighting_uSpecularColor: any;
		}
		| {
			lighting_uEnabled?: undefined;
		}
		| {
			lighting_uEnabled: boolean;
		};
	export { gouraudLighting, phongLighting };
}
declare module "@luma.gl/shadertools/modules/pbr/pbr-vertex.glsl" {
	const _default: "uniform mat4 u_MVPMatrix;\nuniform mat4 u_ModelMatrix;\nuniform mat4 u_NormalMatrix;\n\nvarying vec3 pbr_vPosition;\nvarying vec2 pbr_vUV;\n\n#ifdef HAS_NORMALS\n# ifdef HAS_TANGENTS\nvarying mat3 pbr_vTBN;\n# else\nvarying vec3 pbr_vNormal;\n# endif\n#endif\n\nvoid pbr_setPositionNormalTangentUV(vec4 position, vec4 normal, vec4 tangent, vec2 uv)\n{\n  vec4 pos = u_ModelMatrix * position;\n  pbr_vPosition = vec3(pos.xyz) / pos.w;\n\n#ifdef HAS_NORMALS\n#ifdef HAS_TANGENTS\n  vec3 normalW = normalize(vec3(u_NormalMatrix * vec4(normal.xyz, 0.0)));\n  vec3 tangentW = normalize(vec3(u_ModelMatrix * vec4(tangent.xyz, 0.0)));\n  vec3 bitangentW = cross(normalW, tangentW) * tangent.w;\n  pbr_vTBN = mat3(tangentW, bitangentW, normalW);\n#else // HAS_TANGENTS != 1\n  pbr_vNormal = normalize(vec3(u_ModelMatrix * vec4(normal.xyz, 0.0)));\n#endif\n#endif\n\n#ifdef HAS_UV\n  pbr_vUV = uv;\n#else\n  pbr_vUV = vec2(0.,0.);\n#endif\n}\n";
	export default _default;
}
declare module "@luma.gl/shadertools/modules/pbr/pbr-fragment.glsl" {
	const _default: "#if (__VERSION__ < 300)\n#extension GL_EXT_shader_texture_lod: enable\n#extension GL_OES_standard_derivatives : enable\n#endif\n\n// WebGL 1.0 does not support non-constant in for loops\n// This provides an easy way to handle these cases\n// and still take advantage of WebGL 2.0\n#if (__VERSION__ < 300)\n  #define SMART_FOR(INIT, WEBGL1COND, WEBGL2COND, INCR) for (INIT; WEBGL1COND; INCR)\n#else\n  #define SMART_FOR(INIT, WEBGL1COND, WEBGL2COND, INCR) for (INIT; WEBGL2COND; INCR)\n#endif\n\nprecision highp float;\n\n#ifdef USE_IBL\nuniform samplerCube u_DiffuseEnvSampler;\nuniform samplerCube u_SpecularEnvSampler;\nuniform sampler2D u_brdfLUT;\nuniform vec2 u_ScaleIBLAmbient;\n#endif\n\n#ifdef HAS_BASECOLORMAP\nuniform sampler2D u_BaseColorSampler;\n#endif\n#ifdef HAS_NORMALMAP\nuniform sampler2D u_NormalSampler;\nuniform float u_NormalScale;\n#endif\n#ifdef HAS_EMISSIVEMAP\nuniform sampler2D u_EmissiveSampler;\nuniform vec3 u_EmissiveFactor;\n#endif\n#ifdef HAS_METALROUGHNESSMAP\nuniform sampler2D u_MetallicRoughnessSampler;\n#endif\n#ifdef HAS_OCCLUSIONMAP\nuniform sampler2D u_OcclusionSampler;\nuniform float u_OcclusionStrength;\n#endif\n\n#ifdef ALPHA_CUTOFF\nuniform float u_AlphaCutoff;\n#endif\n\nuniform vec2 u_MetallicRoughnessValues;\nuniform vec4 u_BaseColorFactor;\n\nuniform vec3 u_Camera;\n\n// debugging flags used for shader output of intermediate PBR variables\n#ifdef PBR_DEBUG\nuniform vec4 u_ScaleDiffBaseMR;\nuniform vec4 u_ScaleFGDSpec;\n#endif\n\nvarying vec3 pbr_vPosition;\n\nvarying vec2 pbr_vUV;\n\n#ifdef HAS_NORMALS\n#ifdef HAS_TANGENTS\nvarying mat3 pbr_vTBN;\n#else\nvarying vec3 pbr_vNormal;\n#endif\n#endif\n\n// Encapsulate the various inputs used by the various functions in the shading equation\n// We store values in this struct to simplify the integration of alternative implementations\n// of the shading terms, outlined in the Readme.MD Appendix.\nstruct PBRInfo\n{\n  float NdotL;                  // cos angle between normal and light direction\n  float NdotV;                  // cos angle between normal and view direction\n  float NdotH;                  // cos angle between normal and half vector\n  float LdotH;                  // cos angle between light direction and half vector\n  float VdotH;                  // cos angle between view direction and half vector\n  float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)\n  float metalness;              // metallic value at the surface\n  vec3 reflectance0;            // full reflectance color (normal incidence angle)\n  vec3 reflectance90;           // reflectance color at grazing angle\n  float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])\n  vec3 diffuseColor;            // color contribution from diffuse lighting\n  vec3 specularColor;           // color contribution from specular lighting\n  vec3 n;                       // normal at surface point\n  vec3 v;                       // vector from surface point to camera\n};\n\nconst float M_PI = 3.141592653589793;\nconst float c_MinRoughness = 0.04;\n\nvec4 SRGBtoLINEAR(vec4 srgbIn)\n{\n#ifdef MANUAL_SRGB\n#ifdef SRGB_FAST_APPROXIMATION\n  vec3 linOut = pow(srgbIn.xyz,vec3(2.2));\n#else //SRGB_FAST_APPROXIMATION\n  vec3 bLess = step(vec3(0.04045),srgbIn.xyz);\n  vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );\n#endif //SRGB_FAST_APPROXIMATION\n  return vec4(linOut,srgbIn.w);;\n#else //MANUAL_SRGB\n  return srgbIn;\n#endif //MANUAL_SRGB\n}\n\n// Find the normal for this fragment, pulling either from a predefined normal map\n// or from the interpolated mesh normal and tangent attributes.\nvec3 getNormal()\n{\n  // Retrieve the tangent space matrix\n#ifndef HAS_TANGENTS\n  vec3 pos_dx = dFdx(pbr_vPosition);\n  vec3 pos_dy = dFdy(pbr_vPosition);\n  vec3 tex_dx = dFdx(vec3(pbr_vUV, 0.0));\n  vec3 tex_dy = dFdy(vec3(pbr_vUV, 0.0));\n  vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);\n\n#ifdef HAS_NORMALS\n  vec3 ng = normalize(pbr_vNormal);\n#else\n  vec3 ng = cross(pos_dx, pos_dy);\n#endif\n\n  t = normalize(t - ng * dot(ng, t));\n  vec3 b = normalize(cross(ng, t));\n  mat3 tbn = mat3(t, b, ng);\n#else // HAS_TANGENTS\n  mat3 tbn = pbr_vTBN;\n#endif\n\n#ifdef HAS_NORMALMAP\n  vec3 n = texture2D(u_NormalSampler, pbr_vUV).rgb;\n  n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalScale, u_NormalScale, 1.0)));\n#else\n  // The tbn matrix is linearly interpolated, so we need to re-normalize\n  vec3 n = normalize(tbn[2].xyz);\n#endif\n\n  return n;\n}\n\n// Calculation of the lighting contribution from an optional Image Based Light source.\n// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].\n// See our README.md on Environment Maps [3] for additional discussion.\n#ifdef USE_IBL\nvec3 getIBLContribution(PBRInfo pbrInputs, vec3 n, vec3 reflection)\n{\n  float mipCount = 9.0; // resolution of 512x512\n  float lod = (pbrInputs.perceptualRoughness * mipCount);\n  // retrieve a scale and bias to F0. See [1], Figure 3\n  vec3 brdf = SRGBtoLINEAR(texture2D(u_brdfLUT,\n    vec2(pbrInputs.NdotV, 1.0 - pbrInputs.perceptualRoughness))).rgb;\n  vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_DiffuseEnvSampler, n)).rgb;\n\n#ifdef USE_TEX_LOD\n  vec3 specularLight = SRGBtoLINEAR(textureCubeLodEXT(u_SpecularEnvSampler, reflection, lod)).rgb;\n#else\n  vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;\n#endif\n\n  vec3 diffuse = diffuseLight * pbrInputs.diffuseColor;\n  vec3 specular = specularLight * (pbrInputs.specularColor * brdf.x + brdf.y);\n\n  // For presentation, this allows us to disable IBL terms\n  diffuse *= u_ScaleIBLAmbient.x;\n  specular *= u_ScaleIBLAmbient.y;\n\n  return diffuse + specular;\n}\n#endif\n\n// Basic Lambertian diffuse\n// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog\n// See also [1], Equation 1\nvec3 diffuse(PBRInfo pbrInputs)\n{\n  return pbrInputs.diffuseColor / M_PI;\n}\n\n// The following equation models the Fresnel reflectance term of the spec equation (aka F())\n// Implementation of fresnel from [4], Equation 15\nvec3 specularReflection(PBRInfo pbrInputs)\n{\n  return pbrInputs.reflectance0 +\n    (pbrInputs.reflectance90 - pbrInputs.reflectance0) *\n    pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);\n}\n\n// This calculates the specular geometric attenuation (aka G()),\n// where rougher material will reflect less light back to the viewer.\n// This implementation is based on [1] Equation 4, and we adopt their modifications to\n// alphaRoughness as input as originally proposed in [2].\nfloat geometricOcclusion(PBRInfo pbrInputs)\n{\n  float NdotL = pbrInputs.NdotL;\n  float NdotV = pbrInputs.NdotV;\n  float r = pbrInputs.alphaRoughness;\n\n  float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));\n  float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));\n  return attenuationL * attenuationV;\n}\n\n// The following equation(s) model the distribution of microfacet normals across\n// the area being drawn (aka D())\n// Implementation from \"Average Irregularity Representation of a Roughened Surface\n// for Ray Reflection\" by T. S. Trowbridge, and K. P. Reitz\n// Follows the distribution function recommended in the SIGGRAPH 2013 course notes\n// from EPIC Games [1], Equation 3.\nfloat microfacetDistribution(PBRInfo pbrInputs)\n{\n  float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;\n  float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;\n  return roughnessSq / (M_PI * f * f);\n}\n\nvoid PBRInfo_setAmbientLight(inout PBRInfo pbrInputs) {\n  pbrInputs.NdotL = 1.0;\n  pbrInputs.NdotH = 0.0;\n  pbrInputs.LdotH = 0.0;\n  pbrInputs.VdotH = 1.0;\n}\n\nvoid PBRInfo_setDirectionalLight(inout PBRInfo pbrInputs, vec3 lightDirection) {\n  vec3 n = pbrInputs.n;\n  vec3 v = pbrInputs.v;\n  vec3 l = normalize(lightDirection);             // Vector from surface point to light\n  vec3 h = normalize(l+v);                        // Half vector between both l and v\n\n  pbrInputs.NdotL = clamp(dot(n, l), 0.001, 1.0);\n  pbrInputs.NdotH = clamp(dot(n, h), 0.0, 1.0);\n  pbrInputs.LdotH = clamp(dot(l, h), 0.0, 1.0);\n  pbrInputs.VdotH = clamp(dot(v, h), 0.0, 1.0);\n}\n\nvoid PBRInfo_setPointLight(inout PBRInfo pbrInputs, PointLight pointLight) {\n  vec3 light_direction = normalize(pointLight.position - pbr_vPosition);\n  PBRInfo_setDirectionalLight(pbrInputs, light_direction);\n}\n\nvec3 calculateFinalColor(PBRInfo pbrInputs, vec3 lightColor) {\n  // Calculate the shading terms for the microfacet specular shading model\n  vec3 F = specularReflection(pbrInputs);\n  float G = geometricOcclusion(pbrInputs);\n  float D = microfacetDistribution(pbrInputs);\n\n  // Calculation of analytical lighting contribution\n  vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInputs);\n  vec3 specContrib = F * G * D / (4.0 * pbrInputs.NdotL * pbrInputs.NdotV);\n  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)\n  return pbrInputs.NdotL * lightColor * (diffuseContrib + specContrib);\n}\n\nvec4 pbr_filterColor(vec4 colorUnused)\n{\n  // Metallic and Roughness material properties are packed together\n  // In glTF, these factors can be specified by fixed scalar values\n  // or from a metallic-roughness map\n  float perceptualRoughness = u_MetallicRoughnessValues.y;\n  float metallic = u_MetallicRoughnessValues.x;\n#ifdef HAS_METALROUGHNESSMAP\n  // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.\n  // This layout intentionally reserves the 'r' channel for (optional) occlusion map data\n  vec4 mrSample = texture2D(u_MetallicRoughnessSampler, pbr_vUV);\n  perceptualRoughness = mrSample.g * perceptualRoughness;\n  metallic = mrSample.b * metallic;\n#endif\n  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);\n  metallic = clamp(metallic, 0.0, 1.0);\n  // Roughness is authored as perceptual roughness; as is convention,\n  // convert to material roughness by squaring the perceptual roughness [2].\n  float alphaRoughness = perceptualRoughness * perceptualRoughness;\n\n  // The albedo may be defined from a base texture or a flat color\n#ifdef HAS_BASECOLORMAP\n  vec4 baseColor = SRGBtoLINEAR(texture2D(u_BaseColorSampler, pbr_vUV)) * u_BaseColorFactor;\n#else\n  vec4 baseColor = u_BaseColorFactor;\n#endif\n\n#ifdef ALPHA_CUTOFF\n  if (baseColor.a < u_AlphaCutoff) {\n    discard;\n  }\n#endif\n\n  vec3 f0 = vec3(0.04);\n  vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);\n  diffuseColor *= 1.0 - metallic;\n  vec3 specularColor = mix(f0, baseColor.rgb, metallic);\n\n  // Compute reflectance.\n  float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);\n\n  // For typical incident reflectance range (between 4% to 100%) set the grazing\n  // reflectance to 100% for typical fresnel effect.\n  // For very low reflectance range on highly diffuse objects (below 4%),\n  // incrementally reduce grazing reflecance to 0%.\n  float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);\n  vec3 specularEnvironmentR0 = specularColor.rgb;\n  vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;\n\n  vec3 n = getNormal();                          // normal at surface point\n  vec3 v = normalize(u_Camera - pbr_vPosition);  // Vector from surface point to camera\n\n  float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);\n  vec3 reflection = -normalize(reflect(v, n));\n\n  PBRInfo pbrInputs = PBRInfo(\n    0.0, // NdotL\n    NdotV,\n    0.0, // NdotH\n    0.0, // LdotH\n    0.0, // VdotH\n    perceptualRoughness,\n    metallic,\n    specularEnvironmentR0,\n    specularEnvironmentR90,\n    alphaRoughness,\n    diffuseColor,\n    specularColor,\n    n,\n    v\n  );\n\n  vec3 color = vec3(0, 0, 0);\n\n#ifdef USE_LIGHTS\n  // Apply ambient light\n  PBRInfo_setAmbientLight(pbrInputs);\n  color += calculateFinalColor(pbrInputs, lighting_uAmbientLight.color);\n\n  // Apply directional light\n  SMART_FOR(int i = 0, i < MAX_LIGHTS, i < lighting_uDirectionalLightCount, i++) {\n    if (i < lighting_uDirectionalLightCount) {\n      PBRInfo_setDirectionalLight(pbrInputs, lighting_uDirectionalLight[i].direction);\n      color += calculateFinalColor(pbrInputs, lighting_uDirectionalLight[i].color);\n    }\n  }\n\n  // Apply point light\n  SMART_FOR(int i = 0, i < MAX_LIGHTS, i < lighting_uPointLightCount, i++) {\n    if (i < lighting_uPointLightCount) {\n      PBRInfo_setPointLight(pbrInputs, lighting_uPointLight[i]);\n      float attenuation = getPointLightAttenuation(lighting_uPointLight[i], distance(lighting_uPointLight[i].position, pbr_vPosition));\n      color += calculateFinalColor(pbrInputs, lighting_uPointLight[i].color / attenuation);\n    }\n  }\n#endif\n\n  // Calculate lighting contribution from image based lighting source (IBL)\n#ifdef USE_IBL\n  color += getIBLContribution(pbrInputs, n, reflection);\n#endif\n\n  // Apply optional PBR terms for additional (optional) shading\n#ifdef HAS_OCCLUSIONMAP\n  float ao = texture2D(u_OcclusionSampler, pbr_vUV).r;\n  color = mix(color, color * ao, u_OcclusionStrength);\n#endif\n\n#ifdef HAS_EMISSIVEMAP\n  vec3 emissive = SRGBtoLINEAR(texture2D(u_EmissiveSampler, pbr_vUV)).rgb * u_EmissiveFactor;\n  color += emissive;\n#endif\n\n  // This section uses mix to override final color for reference app visualization\n  // of various parameters in the lighting equation.\n#ifdef PBR_DEBUG\n  // TODO: Figure out how to debug multiple lights\n\n  // color = mix(color, F, u_ScaleFGDSpec.x);\n  // color = mix(color, vec3(G), u_ScaleFGDSpec.y);\n  // color = mix(color, vec3(D), u_ScaleFGDSpec.z);\n  // color = mix(color, specContrib, u_ScaleFGDSpec.w);\n\n  // color = mix(color, diffuseContrib, u_ScaleDiffBaseMR.x);\n  color = mix(color, baseColor.rgb, u_ScaleDiffBaseMR.y);\n  color = mix(color, vec3(metallic), u_ScaleDiffBaseMR.z);\n  color = mix(color, vec3(perceptualRoughness), u_ScaleDiffBaseMR.w);\n#endif\n\n  return vec4(pow(color,vec3(1.0/2.2)), baseColor.a);\n}\n";
	export default _default;
}
declare module "@luma.gl/shadertools/modules/pbr/pbr" {
	const _default: {
		name: string;
		vs: string;
		fs: string;
		defines: {
			LIGHTING_FRAGMENT: number;
		};
		dependencies: {
			name: string;
			vs: string;
			fs: string;
			getUniforms: (opts?: {}) => any;
			defines: {
				MAX_LIGHTS: number;
			};
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/adjust-filters/brightnesscontrast" {
	const _default: {
		name: string;
		uniforms: {
			brightness: {
				value: number;
				min: number;
				max: number;
			};
			contrast: {
				value: number;
				min: number;
				max: number;
			};
		};
		fs: string;
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/adjust-filters/denoise" {
	const _default: {
		name: string;
		uniforms: {
			strength: {
				value: number;
				min: number;
				max: number;
				adjust: (strength: any) => number;
			};
		};
		fs: string;
		passes: {
			sampler: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/adjust-filters/huesaturation" {
	const _default: {
		name: string;
		uniforms: {
			hue: {
				value: number;
				min: number;
				max: number;
			};
			saturation: {
				value: number;
				min: number;
				max: number;
			};
		};
		fs: string;
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/adjust-filters/noise" {
	const _default: {
		name: string;
		uniforms: {
			amount: {
				value: number;
				min: number;
				max: number;
			};
		};
		fs: string;
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/adjust-filters/sepia" {
	const _default: {
		name: string;
		uniforms: {
			amount: {
				value: number;
				min: number;
				max: number;
			};
		};
		fs: string;
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/adjust-filters/vibrance" {
	const _default: {
		name: string;
		uniforms: {
			amount: {
				value: number;
				min: number;
				max: number;
			};
		};
		fs: string;
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/adjust-filters/vignette" {
	const _default: {
		name: string;
		fs: string;
		uniforms: {
			radius: {
				value: number;
				min: number;
				max: number;
			};
			amount: {
				value: number;
				min: number;
				max: number;
			};
		};
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/utils/random" {
	const _default: {
		name: string;
		fs: string;
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/blur-filters/tiltshift" {
	const _default: {
		name: string;
		uniforms: {
			blurRadius: {
				value: number;
				min: number;
				max: number;
			};
			gradientRadius: {
				value: number;
				min: number;
				max: number;
			};
			start: number[];
			end: number[];
			invert: {
				value: boolean;
				private: boolean;
			};
		};
		fs: string;
		dependencies: {
			name: string;
			fs: string;
		}[];
		passes: {
			sampler: boolean;
			uniforms: {
				invert: boolean;
			};
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/blur-filters/triangleblur" {
	const _default: {
		name: string;
		uniforms: {
			radius: {
				value: number;
				min: number;
				softMax: number;
			};
			delta: {
				value: number[];
				private: boolean;
			};
		};
		fs: string;
		dependencies: {
			name: string;
			fs: string;
		}[];
		passes: {
			sampler: boolean;
			uniforms: {
				delta: number[];
			};
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/blur-filters/zoomblur" {
	const _default: {
		name: string;
		uniforms: {
			center: number[];
			strength: {
				value: number;
				min: number;
				softMax: number;
			};
		};
		fs: string;
		dependencies: {
			name: string;
			fs: string;
		}[];
		passes: {
			sampler: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fun-filters/colorhalftone" {
	const _default: {
		name: string;
		uniforms: {
			center: number[];
			angle: {
				value: number;
				softMin: number;
				softMax: number;
			};
			size: {
				value: number;
				min: number;
				softMin: number;
				softMax: number;
			};
		};
		fs: string;
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fun-filters/dotscreen" {
	const _default: {
		name: string;
		uniforms: {
			center: number[];
			angle: {
				value: number;
				softMin: number;
				softMax: number;
			};
			size: {
				value: number;
				min: number;
				softMin: number;
				softMax: number;
			};
		};
		fs: string;
		passes: {
			filter: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fun-filters/edgework" {
	const _default: {
		name: string;
		uniforms: {
			radius: {
				value: number;
				min: number;
				softMax: number;
			};
			delta: {
				value: number[];
				private: boolean;
			};
		};
		fs: string;
		dependencies: {
			name: string;
			fs: string;
		}[];
		passes: {
			sampler: string;
			uniforms: {
				delta: number[];
			};
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fun-filters/hexagonalpixelate" {
	const _default: {
		name: string;
		uniforms: {
			center: {
				value: number[];
				hint: string;
			};
			scale: {
				value: number;
				min: number;
				softMin: number;
				softMax: number;
			};
		};
		fs: string;
		passes: {
			sampler: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fun-filters/ink" {
	const _default: {
		name: string;
		uniforms: {
			strength: {
				value: number;
				min: number;
				softMax: number;
			};
		};
		fs: string;
		passes: {
			sampler: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/warp-filters/warp" {
	const _default: {
		name: string;
		fs: string;
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/warp-filters/bulgepinch" {
	const _default: {
		name: string;
		fs: string;
		uniforms: {
			center: number[];
			radius: {
				value: number;
				min: number;
				softMax: number;
			};
			strength: {
				value: number;
				min: number;
				max: number;
			};
		};
		dependencies: {
			name: string;
			fs: string;
		}[];
		passes: {
			sampler: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/warp-filters/swirl" {
	const _default: {
		name: string;
		uniforms: {
			center: number[];
			radius: {
				value: number;
				min: number;
				softMax: number;
			};
			angle: {
				value: number;
				softMin: number;
				softMax: number;
			};
		};
		fs: string;
		dependencies: {
			name: string;
			fs: string;
		}[];
		passes: {
			sampler: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/fxaa/fxaa" {
	const _default: {
		name: string;
		uniforms: {};
		fs: string;
		passes: {
			sampler: boolean;
		}[];
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules/transform/transform" {
	const _default: {
		name: string;
		vs: string;
		fs: any;
	};
	export default _default;
}
declare module "@luma.gl/shadertools/modules" {
	export { default as fp32 } from "@luma.gl/shadertools/modules/fp32/fp32";
	export {
		default as fp64,
		fp64arithmetic,
	} from "@luma.gl/shadertools/modules/fp64/fp64";
	export { default as project } from "@luma.gl/shadertools/modules/project/project";
	export { default as lights } from "@luma.gl/shadertools/modules/lights/lights";
	export { default as dirlight } from "@luma.gl/shadertools/modules/dirlight/dirlight";
	export { default as picking } from "@luma.gl/shadertools/modules/picking/picking";
	export {
		gouraudLighting,
		phongLighting,
	} from "@luma.gl/shadertools/modules/phong-lighting/phong-lighting";
	export { default as pbr } from "@luma.gl/shadertools/modules/pbr/pbr";
	export { default as brightnessContrast } from "@luma.gl/shadertools/modules/adjust-filters/brightnesscontrast";
	export { default as denoise } from "@luma.gl/shadertools/modules/adjust-filters/denoise";
	export { default as hueSaturation } from "@luma.gl/shadertools/modules/adjust-filters/huesaturation";
	export { default as noise } from "@luma.gl/shadertools/modules/adjust-filters/noise";
	export { default as sepia } from "@luma.gl/shadertools/modules/adjust-filters/sepia";
	export { default as vibrance } from "@luma.gl/shadertools/modules/adjust-filters/vibrance";
	export { default as vignette } from "@luma.gl/shadertools/modules/adjust-filters/vignette";
	export { default as tiltShift } from "@luma.gl/shadertools/modules/blur-filters/tiltshift";
	export { default as triangleBlur } from "@luma.gl/shadertools/modules/blur-filters/triangleblur";
	export { default as zoomBlur } from "@luma.gl/shadertools/modules/blur-filters/zoomblur";
	export { default as colorHalftone } from "@luma.gl/shadertools/modules/fun-filters/colorhalftone";
	export { default as dotScreen } from "@luma.gl/shadertools/modules/fun-filters/dotscreen";
	export { default as edgeWork } from "@luma.gl/shadertools/modules/fun-filters/edgework";
	export { default as hexagonalPixelate } from "@luma.gl/shadertools/modules/fun-filters/hexagonalpixelate";
	export { default as ink } from "@luma.gl/shadertools/modules/fun-filters/ink";
	export { default as bulgePinch } from "@luma.gl/shadertools/modules/warp-filters/bulgepinch";
	export { default as swirl } from "@luma.gl/shadertools/modules/warp-filters/swirl";
	export { default as fxaa } from "@luma.gl/shadertools/modules/fxaa/fxaa";
	export { default as _transform } from "@luma.gl/shadertools/modules/transform/transform";
}
declare module "@luma.gl/shadertools" {
	export { assembleShaders } from "@luma.gl/shadertools/lib/assemble-shaders";
	export { combineInjects } from "@luma.gl/shadertools/lib/inject-shader";
	export { normalizeShaderModule } from "@luma.gl/shadertools/lib/shader-module";
	export {
		getQualifierDetails,
		getPassthroughFS,
		typeToChannelSuffix,
		typeToChannelCount,
		convertToVec4,
	} from "@luma.gl/shadertools/utils/shader-utils";
	export * from "@luma.gl/shadertools/modules";
}
declare module "@luma.gl/shadertools/modules/fp64/test/fp64-test-utils" {
	export function getRelativeError64(result: any, reference: any): number;
	export function getRelativeError(result: any, reference: any): number;
	export function testcase(
		gl: WebGLRenderingContext,
		{
			glslFunc,
			binary,
			op,
			limit,
			t,
		}: {
			glslFunc: any;
			binary: any;
			op: any;
			limit?: number;
			t: any;
		}
	): void;
	export const gl: WebGLRenderingContext;
}
declare module "@luma.gl/shadertools/modules/fp64/test/fp64-arithmetic.spec" {
	export { };
}
declare module "@luma.gl/shadertools/modules/geometry/geometry" {
	const _default: {
		name: string;
		vs: string;
		fs: string;
	};
	export default _default;
}