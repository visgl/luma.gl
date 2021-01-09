// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

// Initialize any global state
export {lumaStats} from './init';

// UTILS
export {requestAnimationFrame, cancelAnimationFrame} from './webgl-utils/request-animation-frame';

// WebGL Functions
export {cloneTextureFrom} from './webgl-utils/texture-utils';
export {getKeyValue, getKey} from './webgl-utils/constants-to-keys';
export {getContextInfo, getGLContextInfo, getContextLimits} from './features/limits';
export {FEATURES} from './features/webgl-features-table';
export {hasFeature, hasFeatures, getFeatures} from './features/features';
export {default as canCompileGLGSExtension} from './features/check-glsl-extension';

// WebGL Helper Classes
export {default as Accessor} from './classes/accessor';

// WebGL1 classes
export {default as Buffer} from './classes/buffer';
export {Shader, VertexShader, FragmentShader} from './classes/shader';
export {default as Program} from './classes/program';
export {default as Framebuffer} from './classes/framebuffer';
export {default as Renderbuffer} from './classes/renderbuffer';
export {default as Texture2D} from './classes/texture-2d';
export {default as TextureCube} from './classes/texture-cube';

export {clear, clearBuffer} from './classes/clear';

// Copy and Blit
export {
  readPixelsToArray,
  readPixelsToBuffer,
  copyToDataUrl,
  copyToImage,
  copyToTexture,
  blit
} from './classes/copy-and-blit';

// WebGL2 classes & Extensions
export {default as Query} from './classes/query';
export {default as Texture3D} from './classes/texture-3d';
export {default as TransformFeedback} from './classes/transform-feedback';
export {default as VertexArrayObject} from './classes/vertex-array-object';
export {default as VertexArray} from './classes/vertex-array';
export {default as UniformBufferLayout} from './classes/uniform-buffer-layout';

// experimental WebGL exports

export {setPathPrefix, loadFile, loadImage} from './utils/load-file';

// PARSE SHADER SOURCE
export {default as getShaderName} from './glsl-utils/get-shader-name';
export {default as getShaderVersion} from './glsl-utils/get-shader-version';

// UTILS
export {log} from '@luma.gl/gltools';
export {default as assert} from './utils/assert';
export {uid, isObjectEmpty} from './utils/utils';

// INTERNAL
export {parseUniformName, getUniformSetter} from './classes/uniforms';
export {getDebugTableForUniforms} from './debug/debug-uniforms';
export {getDebugTableForVertexArray} from './debug/debug-vertex-array';
export {getDebugTableForProgramConfiguration} from './debug/debug-program-configuration';

/*
declare module "@luma.gl/webgl/classes/texture-formats" {
	export const TEXTURE_FORMATS: {
		[x: number]:
		| {
			dataFormat: any;
			types: any[];
			gl2?: undefined;
		}
		| {
			dataFormat: any;
			types: any[];
			gl2: boolean;
		};
	};
	export const DATA_FORMAT_CHANNELS: {
		[x: number]: number;
	};
	export const TYPE_SIZES: {
		[x: number]: number;
	};
	export function isFormatSupported(gl: WebGLRenderingContext, format: any): any;
	export function isLinearFilteringSupported(gl: WebGLRenderingContext, format: any): any;
}
declare module "@luma.gl/webgl/utils/load-file" {
	export function setPathPrefix(prefix: any): void;
	export function loadFile(url: any, options?: {}): Promise<any>;
	export function loadImage(url: any, opts: any): Promise<unknown>;
}

declare module "@luma.gl/webgl/classes/renderbuffer-formats" {
	const _default: {
		[x: number]:
		| {
			bpp: number;
			gl2?: undefined;
		}
		| {
			gl2: boolean;
			bpp: number;
		}
		| {
			gl2: string;
			bpp: number;
		};
	};
	export default _default;
}
declare module "@luma.gl/webgl/classes/renderbuffer" {
	import Resource from "@luma.gl/webgl/classes/resource";
	export default class Renderbuffer extends Resource {
		static isSupported(
			gl: WebGLRenderingContext,
			{
				format,
			}?: {
				format: any;
			}
		): any;
		static getSamplesForFormat(
			gl: WebGLRenderingContext,
			{
				format,
			}: {
				format: any;
			}
		): any;
		constructor(gl: WebGLRenderingContext, opts?: {});
		initialize({
			format,
			width,
			height,
			samples,
		}: {
			format: any;
			width?: number;
			height?: number;
			samples?: number;
		}): this;
		resize({ width, height }: { width: any; height: any }): this;
		_createHandle(): any;
		_deleteHandle(): void;
		_bindHandle(handle: any): void;
		_syncHandle(handle: any): void;
		_getParameter(pname: any): any;
	}
}
declare module "@luma.gl/webgl/classes/clear" {
	export function clear(
		gl: WebGLRenderingContext,
		{
			framebuffer,
			color,
			depth,
			stencil,
		}?: {
			framebuffer?: any;
			color?: any;
			depth?: any;
			stencil?: any;
		}
	): void;
	export function clearBuffer(
		gl: WebGLRenderingContext,
		{
			framebuffer,
			buffer,
			drawBuffer,
			value,
		}?: {
			framebuffer?: any;
			buffer?: number;
			drawBuffer?: number;
			value?: number[];
		}
	): void;
}
declare module "@luma.gl/webgl/webgl-utils/format-utils" {
	export function glFormatToComponents(format: any): 1 | 0 | 2 | 4 | 3;
	export function glTypeToBytes(type: any): 1 | 0 | 2 | 4;
}
declare module "@luma.gl/webgl/classes/copy-and-blit" {
	export function readPixelsToArray(
		source: any,
		{
			sourceX,
			sourceY,
			sourceFormat,
			sourceAttachment, // TODO - support gl.readBuffer
			target,
			sourceWidth,
			sourceHeight,
			sourceType,
		}?: {
			sourceX?: number;
			sourceY?: number;
			sourceFormat?: any;
			sourceAttachment?: any;
			target?: any;
			sourceWidth: any;
			sourceHeight: any;
			sourceType: any;
		}
	): any;
	export function readPixelsToBuffer(
		source: any,
		{
			sourceX,
			sourceY,
			sourceFormat,
			target, // A new Buffer object is created when not provided.
			targetByteOffset, // byte offset in buffer object
			sourceWidth,
			sourceHeight,
			sourceType,
		}: {
			sourceX?: number;
			sourceY?: number;
			sourceFormat?: any;
			target?: any;
			targetByteOffset?: number;
			sourceWidth: any;
			sourceHeight: any;
			sourceType: any;
		}
	): any;
	export function copyToDataUrl(
		source: any,
		{
			sourceAttachment, // TODO - support gl.readBuffer
			targetMaxHeight,
		}?: {
			sourceAttachment?: any;
			targetMaxHeight?: number;
		}
	): string;
	export function copyToImage(
		source: any,
		{
			sourceAttachment, // TODO - support gl.readBuffer
			targetImage,
		}?: {
			sourceAttachment?: any;
			targetImage?: any;
		}
	): any;
	export function copyToTexture(
		source: any,
		target: any,
		{
			sourceX,
			sourceY,
			targetX,
			targetY,
			targetZ,
			targetMipmaplevel,
			targetInternalFormat,
			width, // defaults to target width
			height,
		}?: {
			sourceX?: number;
			sourceY?: number;
			targetX: any;
			targetY: any;
			targetZ: any;
			targetMipmaplevel?: number;
			targetInternalFormat?: any;
			width: any;
			height: any;
		}
	): any;
	export function blit(
		source: any,
		target: any,
		{
			sourceAttachment,
			sourceX0,
			sourceY0,
			sourceX1,
			sourceY1,
			targetX0,
			targetY0,
			targetX1,
			targetY1,
			color,
			depth,
			stencil,
			mask,
			filter,
		}?: {
			sourceAttachment?: any;
			sourceX0?: number;
			sourceY0?: number;
			sourceX1: any;
			sourceY1: any;
			targetX0?: number;
			targetY0?: number;
			targetX1: any;
			targetY1: any;
			color?: boolean;
			depth?: boolean;
			stencil?: boolean;
			mask?: number;
			filter?: any;
		}
	): any;
}
declare module "@luma.gl/webgl/features/webgl-limits-table" {
	const _default: {
		[x: number]:
		| {
			gl1: Float32Array;
			gl2?: undefined;
			negative?: undefined;
		}
		| {
			gl1: number;
			gl2: number;
			negative?: undefined;
		}
		| {
			gl1: number;
			gl2?: undefined;
			negative?: undefined;
		}
		| {
			gl1: Int32Array;
			gl2?: undefined;
			negative?: undefined;
		}
		| {
			gl1: number;
			gl2: number;
			negative: boolean;
		};
	};
	export default _default;
}
declare module "@luma.gl/webgl/features/limits" {
	export function getContextLimits(gl: WebGLRenderingContext): any;
	export function getGLContextInfo(gl: WebGLRenderingContext): any;
	export function getContextInfo(gl: WebGLRenderingContext): any;
}
declare module "@luma.gl/webgl/features/webgl-features-table" {
	export const FEATURES: {
		WEBGL2: string;
		VERTEX_ARRAY_OBJECT: string;
		TIMER_QUERY: string;
		INSTANCED_RENDERING: string;
		MULTIPLE_RENDER_TARGETS: string;
		ELEMENT_INDEX_UINT32: string;
		BLEND_EQUATION_MINMAX: string;
		FLOAT_BLEND: string;
		COLOR_ENCODING_SRGB: string;
		TEXTURE_DEPTH: string;
		TEXTURE_FLOAT: string;
		TEXTURE_HALF_FLOAT: string;
		TEXTURE_FILTER_LINEAR_FLOAT: string;
		TEXTURE_FILTER_LINEAR_HALF_FLOAT: string;
		TEXTURE_FILTER_ANISOTROPIC: string;
		COLOR_ATTACHMENT_RGBA32F: string;
		COLOR_ATTACHMENT_FLOAT: string;
		COLOR_ATTACHMENT_HALF_FLOAT: string;
		GLSL_FRAG_DATA: string;
		GLSL_FRAG_DEPTH: string;
		GLSL_DERIVATIVES: string;
		GLSL_TEXTURE_LOD: string;
	};
	function checkFloat32ColorAttachment(gl: WebGLRenderingContext): boolean;
	const _default: {
		[x: string]:
		| (string | boolean)[]
		| (string | typeof checkFloat32ColorAttachment)[];
	};
	export default _default;
}
declare module "@luma.gl/webgl/features/features" {
	export function hasFeature(gl: WebGLRenderingContext, feature: any): any;
	export function hasFeatures(gl: WebGLRenderingContext, features: any): any;
	export function getFeatures(gl: WebGLRenderingContext): any;
}
declare module "@luma.gl/webgl/features/check-old-ie" {
	export default function isOldIE(opts?: {}): boolean;
}
declare module "@luma.gl/webgl/features/check-glsl-extension" {
	export default function canCompileGLGSExtension(
		gl: WebGLRenderingContext,
		cap: any,
		options?: {}
	): any;
}
declare module "features" {
	export {
		getContextInfo,
		getGLContextInfo,
		getContextLimits,
	} from "@luma.gl/webgl/features/limits";
	export { FEATURES } from "@luma.gl/webgl/features/webgl-features-table";
	export {
		hasFeature,
		hasFeatures,
		getFeatures,
	} from "@luma.gl/webgl/features/features";
	export { default as canCompileGLGSExtension } from "@luma.gl/webgl/features/check-glsl-extension";
}

declare module "@luma.gl/webgl/webgl-utils/texture-utils" {
	import Framebuffer from "@luma.gl/webgl/classes/framebuffer";
	export function cloneTextureFrom(refTexture: any, overrides: any): any;
	export function toFramebuffer(texture: any, opts: any): Framebuffer;
}

export default function getShaderName(shader: any, defaultName?: string): any;
export default function getShaderTypeName(
	type: any
): "fragment" | "vertex" | "unknown type";
export default function getShaderVersion(source: any): number;

declare module "@luma.gl/webgl/classes/uniforms" {
	export function parseUniformName(
		name: any
	): {
		name: any;
		length: any;
		isArray: boolean;
	};
	export function getUniformSetter(gl: WebGLRenderingContext, location: any, info: any): any;
	export function checkUniformValues(
		uniforms: any,
		source: any,
		uniformMap: any
	): boolean;
	/**
	 * Creates a copy of the uniform
	 *
	export function copyUniform(uniforms: any, key: any, value: any): void;
}
declare module "@luma.gl/webgl/webgl-utils/attribute-utils" {
	export function getPrimitiveDrawMode(drawMode: any): 1 | 0 | 4;
	export function getPrimitiveCount({
		drawMode,
		vertexCount,
	}: {
		drawMode: any;
		vertexCount: any;
	}): any;
	export function getVertexCount({
		drawMode,
		vertexCount,
	}: {
		drawMode: any;
		vertexCount: any;
	}): any;
	export function decomposeCompositeGLType(
		compositeGLType: any
	): {
		type: any;
		components: any;
	};
	export function getCompositeGLType(
		type: any,
		components: any
	): {
		glType: string;
		name: any;
	};
}
declare module "@luma.gl/webgl/utils/array-utils-flat" {
	export function getScratchArrayBuffer(byteLength: any): any;
	export function getScratchArray(Type: any, length: any): any;
	export function fillArray({
		target,
		source,
		start,
		count,
	}: {
		target: any;
		source: any;
		start?: number;
		count?: number;
	}): any;
}
declare module "@luma.gl/webgl/classes/vertex-array-object" {
}
*/
