//typings for @luma.gl/engine v8.1.2
declare module "@luma.gl/engine/lib/animation-loop" {
	export default class AnimationLoop {
		constructor(props?: {});
		delete(): void;
		setNeedsRedraw(reason: any): this;
		setProps(props: any): this;
		start(opts?: {}): this;
		redraw(): this;
		stop(): this;
		attachTimeline(timeline: any): any;
		detachTimeline(): void;
		waitForRender(): any;
		toDataURL(): Promise<any>;
		onCreateContext(...args: any[]): any;
		onInitialize(...args: any[]): any;
		onRender(...args: any[]): any;
		onFinalize(...args: any[]): any;
		getHTMLControlValue(id: any, defaultValue?: number): number;
		setViewParameters(): this;
		_startLoop(): void;
		_getPageLoadPromise(): any;
		_setDisplay(display: any): void;
		_requestAnimationFrame(renderFrameCallback: any): void;
		_renderFrame(...args: any[]): void;
		_clearNeedsRedraw(): void;
		_setupFrame(): void;
		_initializeCallbackData(): void;
		_updateCallbackData(): void;
		_finalizeCallbackData(): void;
		_addCallbackData(appContext: any): void;
		_createWebGLContext(opts: any): void;
		_createInfoDiv(): void;
		_getSizeAndAspect(): {
			width: any;
			height: any;
			aspect: number;
		};
		_resizeViewport(): void;
		_resizeCanvasDrawingBuffer(): void;
		_createFramebuffer(): void;
		_resizeFramebuffer(): void;
		_beginTimers(): void;
		_endTimers(): void;
		_startEventHandling(): void;
		_onMousemove(e: any): void;
		_onMouseleave(e: any): void;
	}
}
declare module "@luma.gl/engine/lib/program-manager" {
	export default class ProgramManager {
		static getDefaultProgramManager(gl: WebGLRenderingContext): any;
		constructor(gl: WebGLRenderingContext);
		addDefaultModule(module: any): void;
		removeDefaultModule(module: any): void;
		addShaderHook(hook: any, opts: any): void;
		get(props?: {}): any;
		getUniforms(program: any): any;
		release(program: any): void;
		_getHash(key: any): any;
		_getModuleList(appModules?: any[]): any[];
	}
}
declare module "@luma.gl/engine/lib/model-utils" {
	export function getBuffersFromGeometry(
		gl: WebGLRenderingContext,
		geometry: any,
		options: any
	): {};
	export function inferAttributeAccessor(
		attributeName: any,
		attribute: any
	): void;
}
declare module "@luma.gl/engine/lib/model" {
	export default class Model {
		constructor(gl: WebGLRenderingContext, props?: {});
		initialize(props: any): void;
		setProps(props: any): void;
		delete(): void;
		getDrawMode(): any;
		getVertexCount(): any;
		getInstanceCount(): any;
		getAttributes(): any;
		getProgram(): any;
		setProgram(props: any): void;
		getUniforms(): any;
		setDrawMode(drawMode: any): this;
		setVertexCount(vertexCount: any): this;
		setInstanceCount(instanceCount: any): this;
		setGeometry(geometry: any): this;
		setAttributes(attributes?: {}): this;
		setUniforms(uniforms?: {}): this;
		getModuleUniforms(opts: any): any;
		updateModuleSettings(opts: any): this;
		clear(opts: any): this;
		draw(opts?: {}): any;
		transform(opts?: {}): this;
		render(uniforms?: {}): any;
		_setModelProps(props: any): void;
		_checkProgram(shaderCache?: any): void;
		_deleteGeometryBuffers(): void;
		_setAnimationProps(animationProps: any): void;
		_setFeedbackBuffers(feedbackBuffers?: {}): this;
		_logDrawCallStart(logLevel: any): any;
		_logDrawCallEnd(
			logLevel: any,
			vertexArray: any,
			uniforms: any,
			framebuffer: any
		): void;
	}
}
declare module "@luma.gl/engine/transform/buffer-transform" {
	export default class BufferTransform {
		constructor(gl: WebGLRenderingContext, props?: {});
		setupResources(opts: any): void;
		updateModelProps(props?: {}): {};
		getDrawOptions(opts?: {}): {
			attributes: any;
			transformFeedback: any;
		};
		swap(): boolean;
		update(opts?: {}): void;
		getBuffer(varyingName: any): any;
		getData({ varyingName }?: { varyingName: any }): any;
		delete(): void;
		_initialize(props?: {}): void;
		_getFeedbackBuffers(props: any): {};
		_setupBuffers(props?: {}): void;
		_setupTransformFeedback(
			binding: any,
			{
				model,
			}: {
				model: any;
			}
		): void;
		_updateBindings(opts: any): void;
		_updateBinding(binding: any, opts: any): any;
		_swapBuffers(
			opts: any
		): {
			sourceBuffers: any;
			feedbackBuffers: any;
		};
		_createNewBuffer(name: any, opts: any): any;
		_getNextIndex(): number;
	}
}
declare module "@luma.gl/engine/transform/transform-shader-utils" {
	export function updateForTextures({
		vs,
		sourceTextureMap,
		targetTextureVarying,
		targetTexture,
	}: {
		vs: any;
		sourceTextureMap: any;
		targetTextureVarying: any;
		targetTexture: any;
	}): {
		vs: any;
		targetTextureType: any;
		inject: {};
		samplerTextureMap: {};
	};
	export function getSizeUniforms({
		sourceTextureMap,
		targetTextureVarying,
		targetTexture,
	}: {
		sourceTextureMap: any;
		targetTextureVarying: any;
		targetTexture: any;
	}): {};
	export function getVaryingType(line: any, varying: any): any;
	export function processAttributeDefinition(
		line: any,
		textureMap: any
	): {
		updatedLine: string;
		inject: {
			"vs:#decl": string;
			"vs:#main-start": string;
		};
		samplerTextureMap: {};
	};
}
declare module "@luma.gl/engine/transform/texture-transform" {
	export default class TextureTransform {
		constructor(gl: WebGLRenderingContext, props?: {});
		updateModelProps(props?: {}): {
			vs: any;
			fs: any;
			modules: any;
			uniforms: any;
			inject: any;
		};
		getDrawOptions(opts?: {}): {
			attributes: any;
			framebuffer: any;
			uniforms: any;
			discard: any;
			parameters: any;
		};
		swap(): boolean;
		update(opts?: {}): void;
		getTargetTexture(): any;
		getData({ packed }?: { packed?: boolean }): any;
		getFramebuffer(): any;
		delete(): void;
		_initialize(props?: {}): void;
		_createTargetTexture(props: any): any;
		_setupTextures(props?: {}): void;
		_updateElementIDBuffer(elementCount: any): void;
		_updateBindings(opts: any): void;
		_updateBinding(binding: any, opts: any): any;
		_setSourceTextureParameters(): void;
		_swapTextures(
			opts: any
		): {
			sourceTextures: any;
			targetTexture: any;
		};
		_createNewTexture(refTexture: any): any;
		_getNextIndex(): number;
		_processVertexShader(props?: {}): {
			vs: any;
			fs: any;
			modules: any;
			uniforms: any;
			inject: any;
		};
	}
}
declare module "@luma.gl/engine/transform/transform" {
	export default class Transform {
		static isSupported(gl: WebGLRenderingContext): any;
		constructor(gl: WebGLRenderingContext, props?: {});
		delete(): void;
		run(opts?: {}): void;
		swap(): void;
		getBuffer(varyingName?: any): any;
		getData(opts?: {}): any;
		getFramebuffer(): any;
		update(opts?: {}): void;
		_initialize(props?: {}): void;
		_updateModelProps(props: any): any;
		_buildResourceTransforms(gl: WebGLRenderingContext, props: any): void;
		_updateDrawOptions(opts: any): any;
	}
}
declare module "@luma.gl/engine/geometry/geometry" {
	export const DRAW_MODE: {
		POINTS: number;
		LINES: number;
		LINE_LOOP: number;
		LINE_STRIP: number;
		TRIANGLES: number;
		TRIANGLE_STRIP: number;
		TRIANGLE_FAN: number;
	};
	export default class Geometry {
		static get DRAW_MODE(): {
			POINTS: number;
			LINES: number;
			LINE_LOOP: number;
			LINE_STRIP: number;
			TRIANGLES: number;
			TRIANGLE_STRIP: number;
			TRIANGLE_FAN: number;
		};
		constructor(props?: {});
		get mode(): any;
		getVertexCount(): any;
		getAttributes(): any;
		_print(attributeName: any): string;
		_setAttributes(attributes: any, indices: any): this;
		_calculateVertexCount(attributes: any, indices: any): any;
	}
}
declare module "@luma.gl/engine/geometries/truncated-cone-geometry" {
	import Geometry from "@luma.gl/engine/geometry/geometry";
	export default class TruncatedConeGeometry extends Geometry {
		constructor(props?: {});
	}
}
declare module "@luma.gl/engine/geometries/cone-geometry" {
	import TruncatedConeGeometry from "@luma.gl/engine/geometries/truncated-cone-geometry";
	export default class ConeGeometry extends TruncatedConeGeometry {
		constructor(props?: {});
	}
}
declare module "@luma.gl/engine/geometries/cube-geometry" {
	import Geometry from "@luma.gl/engine/geometry/geometry";
	export default class CubeGeometry extends Geometry {
		constructor(props?: {});
	}
}
declare module "@luma.gl/engine/geometries/cylinder-geometry" {
	import TruncatedConeGeometry from "@luma.gl/engine/geometries/truncated-cone-geometry";
	export default class CylinderGeometry extends TruncatedConeGeometry {
		constructor(props?: {});
	}
}
declare module "@luma.gl/engine/geometries/ico-sphere-geometry" {
	import Geometry from "@luma.gl/engine/geometry/geometry";
	export default class IcoSphereGeometry extends Geometry {
		constructor(props?: {});
	}
}
declare module "@luma.gl/engine/geometry/geometry-utils" {
	export function unpackIndexedGeometry(geometry: any): any;
}
declare module "@luma.gl/engine/geometries/plane-geometry" {
	import Geometry from "@luma.gl/engine/geometry/geometry";
	export default class PlaneGeometry extends Geometry {
		constructor(props?: {});
	}
}
declare module "@luma.gl/engine/geometries/sphere-geometry" {
	import Geometry from "@luma.gl/engine/geometry/geometry";
	export default class SphereGeometry extends Geometry {
		constructor(props?: {});
	}
}
declare module "@luma.gl/engine/animation/timeline" {
	export class Timeline {
		constructor();
		addChannel(props: any): number;
		removeChannel(handle: any): void;
		isFinished(handle: any): boolean;
		getTime(handle: any): any;
		setTime(time: any): void;
		play(): void;
		pause(): void;
		reset(): void;
		attachAnimation(animation: any, channelHandle: any): number;
		detachAnimation(handle: any): void;
		update(engineTime: any): void;
		_setChannelTime(channel: any, time: any): void;
	}
}
declare module "@luma.gl/engine/animation/key-frames" {
	export class KeyFrames {
		constructor(keyFrames: any);
		setKeyFrames(keyFrames: any): void;
		setTime(time: any): void;
		getStartTime(): any;
		getEndTime(): any;
		getStartData(): any;
		getEndData(): any;
		_calculateKeys(time: any): void;
	}
}
declare module "@luma.gl/engine/utils/clip-space" {
	import Model from "@luma.gl/engine/lib/model";
	export default class ClipSpace extends Model {
		constructor(gl: WebGLRenderingContext, opts: any);
	}
}
declare module "@luma.gl/engine" {
	export { default as AnimationLoop } from "@luma.gl/engine/lib/animation-loop";
	export { default as Model } from "@luma.gl/engine/lib/model";
	export { default as ProgramManager } from "@luma.gl/engine/lib/program-manager";
	export { default as Transform } from "@luma.gl/engine/transform/transform";
	export { default as Geometry } from "@luma.gl/engine/geometry/geometry";
	export { default as ConeGeometry } from "@luma.gl/engine/geometries/cone-geometry";
	export { default as CubeGeometry } from "@luma.gl/engine/geometries/cube-geometry";
	export { default as CylinderGeometry } from "@luma.gl/engine/geometries/cylinder-geometry";
	export { default as IcoSphereGeometry } from "@luma.gl/engine/geometries/ico-sphere-geometry";
	export { default as PlaneGeometry } from "@luma.gl/engine/geometries/plane-geometry";
	export { default as SphereGeometry } from "@luma.gl/engine/geometries/sphere-geometry";
	export { default as TruncatedConeGeometry } from "@luma.gl/engine/geometries/truncated-cone-geometry";
	export { Timeline } from "@luma.gl/engine/animation/timeline";
	export { KeyFrames } from "@luma.gl/engine/animation/key-frames";
	export { default as ClipSpace } from "@luma.gl/engine/utils/clip-space";
}
declare module "geometries" {
	export { default as ConeGeometry } from "@luma.gl/engine/geometries/cone-geometry";
	export { default as CubeGeometry } from "@luma.gl/engine/geometries/cube-geometry";
	export { default as CylinderGeometry } from "@luma.gl/engine/geometries/cylinder-geometry";
	export { default as IcoSphereGeometry } from "@luma.gl/engine/geometries/ico-sphere-geometry";
	export { default as PlaneGeometry } from "@luma.gl/engine/geometries/plane-geometry";
	export { default as SphereGeometry } from "@luma.gl/engine/geometries/sphere-geometry";
	export { default as TruncatedConeGeometry } from "@luma.gl/engine/geometries/truncated-cone-geometry";
}