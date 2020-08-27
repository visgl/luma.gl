//typings for @luma.gl/experimental v8.1.2
declare module "@luma.gl/experimental/webvr/display" {
	export default class Display {
		getViews(
			options: any
		): {
			params: {
				viewport: any[];
				scissor: any[];
				scissorTest: boolean;
			};
		}[];
		submitFrame(): boolean;
		requestAnimationFrame(renderFrame: any): boolean;
		delete(): void;
		_renderFrame(options: any): boolean;
	}
}
declare module "@luma.gl/experimental/webvr/vr-button" {
	export function createEnterVRButton({
		canvas,
		title,
	}: {
		canvas: any;
		title: any;
	}): HTMLButtonElement;
}
declare module "@luma.gl/experimental/webvr/vr-display" {
	import Display from "@luma.gl/experimental/webvr/display";
	export default class VRDisplay extends Display {
		static isSupported(): boolean;
		constructor(props: any);
		delete(): void;
		getViews(
			options: any
		):
			| {
				params: {
					viewport: any[];
					scissor: any[];
					scissorTest: boolean;
				};
			}[]
			| {
				displayEye: string;
				projectionMatrix: any;
				viewMatrix: any;
				params: {
					viewport: any[];
					scissor: any[];
					scissorTest: boolean;
				};
			}[];
		submitFrame(): boolean;
		requestAnimationFrame(renderFrame: any): boolean;
		_addVRButton(): Promise<void>;
		_getCanvas(): any;
		_removeVRButton(): void;
		_startDisplay(): void;
		_vrDisplayPresentChange(): void;
	}
}
declare module "@luma.gl/experimental/gltf/gltf-environment" {
	export default class GLTFEnvironment {
		constructor(
			gl: WebGLRenderingContext,
			{
				brdfLutUrl,
				getTexUrl,
				specularMipLevels,
			}: {
				brdfLutUrl: any;
				getTexUrl: any;
				specularMipLevels?: number;
			}
		);
		makeCube({
			id,
			getTextureForFace,
			parameters,
		}: {
			id: any;
			getTextureForFace: any;
			parameters: any;
		}): any;
		getDiffuseEnvSampler(): any;
		getSpecularEnvSampler(): any;
		getBrdfTexture(): any;
		delete(): void;
	}
}
declare module "@luma.gl/experimental/scenegraph/nodes/scenegraph-node" {
	export default class ScenegraphNode {
		constructor(props?: {});
		delete(): void;
		setProps(props: any): this;
		toString(): string;
		setPosition(position: any): this;
		setRotation(rotation: any): this;
		setScale(scale: any): this;
		setMatrix(matrix: any, copyMatrix?: boolean): void;
		setMatrixComponents({
			position,
			rotation,
			scale,
			update,
		}: {
			position: any;
			rotation: any;
			scale: any;
			update?: boolean;
		}): this;
		updateMatrix(): this;
		update({
			position,
			rotation,
			scale,
		}?: {
			position: any;
			rotation: any;
			scale: any;
		}): this;
		getCoordinateUniforms(
			viewMatrix: any,
			modelMatrix: any
		): {
			viewMatrix: any;
			modelMatrix: any;
			objectMatrix: any;
			worldMatrix: any;
			worldInverseMatrix: any;
			worldInverseTransposeMatrix: any;
		};
		_setScenegraphNodeProps(props: any): void;
	}
}
declare module "@luma.gl/experimental/scenegraph/nodes/group-node" {
	import ScenegraphNode from "@luma.gl/experimental/scenegraph/nodes/scenegraph-node";
	export default class GroupNode extends ScenegraphNode {
		constructor(props?: {});
		add(...children: any[]): this;
		remove(child: any): this;
		removeAll(): this;
		delete(): void;
		traverse(
			visitor: any,
			{
				worldMatrix,
			}?: {
				worldMatrix?: any;
			}
		): void;
	}
}
declare module "@luma.gl/experimental/scenegraph/nodes/model-node" {
	import ScenegraphNode from "@luma.gl/experimental/scenegraph/nodes/scenegraph-node";
	export default class ModelNode extends ScenegraphNode {
		constructor(gl: WebGLRenderingContext, props?: {});
		setProps(props: any): this;
		delete(): void;
		draw(...args: any[]): any;
		setUniforms(...args: any[]): this;
		setAttributes(...args: any[]): this;
		updateModuleSettings(...args: any[]): this;
		_setModelNodeProps(props: any): void;
	}
}
declare module "@luma.gl/experimental/scenegraph" {
	export { default as ScenegraphNode } from "@luma.gl/experimental/scenegraph/nodes/scenegraph-node";
	export { default as GroupNode } from "@luma.gl/experimental/scenegraph/nodes/group-node";
	export { default as ModelNode } from "@luma.gl/experimental/scenegraph/nodes/model-node";
}
declare module "@luma.gl/experimental/gltf/gltf-animator" {
	export const ATTRIBUTE_TYPE_TO_COMPONENTS: {
		SCALAR: number;
		VEC2: number;
		VEC3: number;
		VEC4: number;
		MAT2: number;
		MAT3: number;
		MAT4: number;
	};
	export const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY: {
		5120: Int8ArrayConstructor;
		5121: Uint8ArrayConstructor;
		5122: Int16ArrayConstructor;
		5123: Uint16ArrayConstructor;
		5125: Uint32ArrayConstructor;
		5126: Float32ArrayConstructor;
	};
	export default class GLTFAnimator {
		constructor(gltf: any);
		animate(time: any): void;
		setTime(time: any): void;
		getAnimations(): any;
	}
}
declare module "@luma.gl/experimental/gltf/gltf-material-parser" {
	export default class GLTFMaterialParser {
		constructor(
			gl: WebGLRenderingContext,
			{
				attributes,
				material,
				pbrDebug,
				imageBasedLightingEnvironment,
				lights,
				useTangents,
			}: {
				attributes: any;
				material: any;
				pbrDebug: any;
				imageBasedLightingEnvironment: any;
				lights: any;
				useTangents: any;
			}
		);
		defineIfPresent(value: any, name: any): void;
		parseTexture(gltfTexture: any, name: any, define?: any): void;
		parsePbrMetallicRoughness(pbrMetallicRoughness: any): void;
		parseMaterial(material: any): void;
	}
}
declare module "@luma.gl/experimental/gltf/create-gltf-model" {
	import { ModelNode } from "@luma.gl/experimental/scenegraph";
	export default function createGLTFModel(gl: WebGLRenderingContext, options: any): ModelNode;
}
declare module "@luma.gl/experimental/gltf/gltf-instantiator" {
	import GroupNode from "@luma.gl/experimental/scenegraph/nodes/group-node";
	import GLTFAnimator from "@luma.gl/experimental/gltf/gltf-animator";
	import { ModelNode } from "@luma.gl/experimental/scenegraph";
	export default class GLTFInstantiator {
		constructor(gl: WebGLRenderingContext, options?: {});
		instantiate(gltf: any): any;
		createAnimator(): GLTFAnimator;
		createScene(gltfScene: any): GroupNode;
		createNode(gltfNode: any): any;
		createMesh(gltfMesh: any): any;
		getVertexCount(attributes: any): void;
		createPrimitive(gltfPrimitive: any, i: any, gltfMesh: any): ModelNode;
		createAttributes(attributes: any, indices: any): {};
		createBuffer(attribute: any, target: any): any;
		createAccessor(accessor: any, buffer: any): any;
		createSampler(gltfSampler: any): any;
		needsPOT(): boolean;
	}
}
declare module "@luma.gl/experimental/gltf/create-gltf-objects" {
	import GLTFAnimator from "@luma.gl/experimental/gltf/gltf-animator";
	export default function createGLTFObjects(
		gl: WebGLRenderingContext,
		gltf: any,
		options: any
	): {
		scenes: any;
		animator: GLTFAnimator;
	};
}
declare module "@luma.gl/experimental/gpgpu/histopyramid/histopyramid-shaders" {
	export const HISTOPYRAMID_BUILD_VS_UTILS =
		"// Get current pixel indices for a given size\nvec2 histoPyramid_getPixelIndices(vec2 size) {\n  vec2 pixelOffset = transform_getPixelSizeHalf(size);\n  vec2 pixelIndices = transform_getPixelIndices(size, pixelOffset);\n  return pixelIndices;\n}\n\n// returns the top left texture coordiante corresponding to 2X2 block in higher level texture.\n// size: lower level texture size\n// scale: usually (2, 2)\n// offset: offset with-in 2X2 block of higher level texture\nvec2 histoPyramid_getTexCoord(vec2 size, vec2 scale, vec2 offset) {\n  // use actual (scaled) texture size to calcualte offset (multiplied by scale)\n  vec2 scaledSize = size * scale;\n\n  // use minified texture size to find corresponding pixel index in out texture\n  vec2 pixelIndices = histoPyramid_getPixelIndices(size);\n\n  // now scale the indices to point to correct 2X2 block\n  pixelIndices = pixelIndices * scale;\n\n  // generate tex coordinate using actual size\n  vec2 texCoord = pixelIndices / scaledSize;\n  vec2 inPixelOffset = transform_getPixelSizeHalf(scaledSize);\n\n  return texCoord + (offset / scaledSize) + inPixelOffset;\n}\n\n// returns pixel value from higher level texture based on scale and offset\n// texSampler: higher level texture sampler\n// size: lower level texture size\n// scale: usually (2, 2)\n// offset: offset with-in 2X2 block of higher level texture\nvec4 histoPyramid_getInput(sampler2D texSampler, vec2 size, vec2 scale, vec2 offset) {\n  vec2 texCoord = histoPyramid_getTexCoord(size, scale, offset);\n  vec4 textureColor = texture2D(texSampler, texCoord);\n  return textureColor;\n}\n";
	export const HISTOPYRAMID_BUILD_VS =
		"attribute vec4 inTexture;\nvarying vec4 outTexture;\n\nvoid main()\n{\n  vec2 size = transform_uSize_outTexture;\n  vec2 scale = vec2(2., 2.);\n  vec4 pixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 0));\n  vec4 rightPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 0));\n  vec4 bottomPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 1));\n  vec4 rightBottomPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 1));\n  // outTexture = pixel + rightPixel + bottomPixel + rightBottomPixel;\n  outTexture = vec4(\n    pixel.r + pixel.g + pixel.b + pixel.a,\n    rightPixel.r + rightPixel.g + rightPixel.b + rightPixel.a,\n    bottomPixel.r + bottomPixel.g + bottomPixel.b + bottomPixel.a,\n    rightBottomPixel.r + rightBottomPixel.g + rightBottomPixel.b + rightBottomPixel.a\n  );\n}\n";
	export const HISTOPYRAMID_BASE_BUILD_VS =
		"attribute vec4 inTexture;\nvarying vec4 outTexture;\nuniform int channel;\nuniform vec4 padingPixelValue;\n\nvoid main()\n{\n  vec2 size = transform_uSize_outTexture;\n  // vec2 scale = vec2(2., 2.);\n  vec2 scale = transform_uSize_inTexture / transform_uSize_outTexture;\n\n  // Verify if reference to a input texture pixel is out of bounds, if so treat the pixel as (0, 0)\n  vec2 pixelIndices = histoPyramid_getPixelIndices(size);\n  // now scale the indices padded size to point to correct 2X2 block\n  pixelIndices = pixelIndices * vec2(2, 2);\n\n  vec2 baseLevelSize = transform_uSize_inTexture;\n\n  // For all pixels outside of original texture size, return paddingPixelValue\n  bool xInside = pixelIndices.x < baseLevelSize.x;\n  bool yInside = pixelIndices.y < baseLevelSize.y;\n  bool xPlusOneInside = pixelIndices.x + 1. < baseLevelSize.x;\n  bool yPlusOneInside = pixelIndices.y + 1. < baseLevelSize.y;\n\n  vec4 pixel = (xInside && yInside)\n    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 0))\n    : padingPixelValue;\n\n  vec4 rightPixel = (xPlusOneInside && yInside)\n    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 0))\n    : padingPixelValue;\n\n  vec4 topPixel = (xInside && yPlusOneInside)\n    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 1))\n    : padingPixelValue;\n\n  vec4 rightTopPixel = (xPlusOneInside && yPlusOneInside)\n    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 1))\n    : padingPixelValue;\n\n  if (channel == 0) {\n    outTexture = vec4(pixel.r, rightPixel.r, topPixel.r, rightTopPixel.r);\n  }\n  if (channel == 1) {\n    outTexture = vec4(pixel.g, rightPixel.g, topPixel.g, rightTopPixel.g);\n  }\n  if (channel == 2) {\n    outTexture = vec4(pixel.b, rightPixel.b, topPixel.b, rightTopPixel.b);\n  }\n  if (channel == 3) {\n    outTexture = vec4(pixel.a, rightPixel.a, topPixel.a, rightTopPixel.a);\n  }\n}\n";
	export const HISTOPYRAMID_TRAVERSAL_UTILS =
		"// Check 2X2 texture block to find relative index the given key index falls into\n// 2X2 block is represented by a single RGBA weight\nint histopyramid_traversal_findRangeIndex(float currentKey, vec4 weights, out float lowerBound) {\n  lowerBound = 0.;\n  float higherBound = 0.;\n  int relativeIndex = 0;\n  for (int i = 0; i < 4; i++) {\n    higherBound = lowerBound + weights[i];\n    relativeIndex = i;\n    if (currentKey >= lowerBound && currentKey < higherBound) {\n      break;\n    }\n    lowerBound = higherBound;\n  }\n  return relativeIndex;\n}\n\n// Maps index in 2X2 block to texture coordiante\n// Assumes the traversal order of lower-left -> lower->right -> upper-left -> upper->right\nvec2 histopyramid_traversal_mapIndexToCoord(int index) {\n  // relativeIndex ->  relativeCoordiante\n  // 0 -> (0, 0)\n  // 1 -> (1, 0)\n  // 2 -> (0, 1)\n  // 3 -> (1, 1)\n  float relativeX = mod(float(index), 2.);\n  float relativeY = (index > 1) ? 1. : 0.;\n  return vec2(relativeX, relativeY);\n}\n\n// Reads weight value from flat histopyramid\nvec4 histopyramid_traversal_getWeight(sampler2D flatPyramid, vec2 size, int level, int numLevels, vec2 offset) {\n  // horizontal offset in flat pyramid for current level\n  float xOffset = pow(2., float(numLevels)) - pow(2., float(numLevels - level));\n  vec2 lowerLeft = vec2(xOffset, 0.);\n  vec2 pixelIndices = lowerLeft + offset;\n\n  vec2 pixelSizeHalf = transform_getPixelSizeHalf(size);\n  vec2 coord = pixelIndices / size + pixelSizeHalf;\n\n  return texture2D(flatPyramid, coord);\n}\n";
	export const HISTOPYRAMID_TRAVERSAL_VS =
		"attribute float keyIndex;\nattribute vec4 flatPyramidTexture;\nvarying vec4 locationAndIndex;\nconst int MAX_LEVELS = 12; // assuming max texture size of 4K\n\nuniform int numLevels;\n\nvoid main()\n{\n  vec2 p = vec2(0., 0.);\n  float currentKey = keyIndex;\n  // for(int level = numLevels - 1; level <= 0; level--) {\n  for(int i = 1; i <= MAX_LEVELS; i++) {\n    int level = numLevels - i;\n    // #1. Get the current pixel values based on current level and current p\n    vec4 weights = histopyramid_traversal_getWeight(transform_uSampler_flatPyramidTexture, transform_uSize_flatPyramidTexture, level, numLevels, p);\n\n    // #2. Check the all weights in current 2X2 (4 values in RGBA channels) and determine the relative coordinate\n    float lowerBound = 0.;\n    int relativeIndex = histopyramid_traversal_findRangeIndex(currentKey, weights, lowerBound);\n    vec2 relativeCoord = histopyramid_traversal_mapIndexToCoord(relativeIndex);\n\n    //#3. Update P and key-index\n    p = 2.0 * p + relativeCoord;\n    currentKey -= lowerBound;\n    if (level == 0) { break; } // Work around for const expression restriction on for loops\n  }\n  locationAndIndex = vec4(p, currentKey, keyIndex);\n}\n";
}
declare module "@luma.gl/experimental/gpgpu/histopyramid/histopyramid" {
	export function buildHistopyramidBaseLevel(
		gl: WebGLRenderingContext,
		opts: any
	): {
		textureData: any;
		baseTexture: any;
		flatPyramidTexture: any;
	};
	export function getHistoPyramid(
		gl: WebGLRenderingContext,
		opts: any
	): {
		pyramidTextures: any[];
		flatPyramidTexture: any;
		levelCount: number;
		topLevelData: any;
	};
	export function histoPyramidGenerateIndices(
		gl: WebGLRenderingContext,
		opts: any
	): {
		locationAndIndexBuffer: any;
	};
}
declare module "@luma.gl/experimental/gpgpu/point-in-polygon/texture-filter" {
	function getUniforms(opts?: {}): {};
	const _default: {
		name: string;
		vs: string;
		getUniforms: typeof getUniforms;
	};
	export default _default;
}
declare module "@luma.gl/experimental/gpgpu/point-in-polygon/shaders" {
	export const POLY_TEX_VS =
		"uniform vec4 boundingBoxOriginSize; //[xMin, yMin, xSize, ySize]\nattribute vec2 a_position;\nattribute float a_polygonID;\nvarying vec4 v_polygonColor;\nvoid main()\n{\n    // translate from bbox to NDC\n    vec2 pos = a_position - boundingBoxOriginSize.xy;\n    pos = pos / boundingBoxOriginSize.zw;\n    pos = pos * 2.0 - vec2(1.0);\n    gl_Position = vec4(pos, 0.0, 1.0);\n    v_polygonColor = vec4(a_polygonID, 1.0, 1.0, 1.0);\n}\n";
	export const FILTER_VS =
		"#version 300 es\nin vec2 a_position;\nout vec2 filterValueIndex; //[x: 0 (outside polygon)/1 (inside), y: position index]\nvoid main()\n{\n  filterValueIndex = textureFilter_filter(a_position);\n}\n";
}
declare module "@luma.gl/experimental/gpgpu/point-in-polygon/polygon" {
	/**
	 * Counts the number of vertices in any polygon representation.
	 * @param {Array|Object} polygon
	 * @param {Number} positionSize - size of a position, 2 (xy) or 3 (xyz)
	 * @returns {Number} vertex count
	 */
	export function getVertexCount(
		polygon: any,
		positionSize: any,
		normalization?: boolean
	): any;
	/**
	 * Normalize any polygon representation into the "complex flat" format
	 * @param {Array|Object} polygon
	 * @param {Number} positionSize - size of a position, 2 (xy) or 3 (xyz)
	 * @param {Number} [vertexCount] - pre-computed vertex count in the polygon.
	 *   If provided, will skip counting.
	 * @return {Object} - {positions: <Float64Array>, holeIndices: <Array|null>}
	 */
	export function normalize(
		polygon: any,
		positionSize: any,
		vertexCount: any
	):
		| Float64Array
		| {
			positions: Float64Array;
			holeIndices: any[];
		};
	export function getSurfaceIndices(
		normalizedPolygon: any,
		positionSize: any,
		preproject: any
	): any;
}
declare module "@luma.gl/experimental/gpgpu/point-in-polygon/gpu-point-in-polygon" {
	export default class GPUPointInPolygon {
		constructor(gl: WebGLRenderingContext, opts?: {});
		update({
			polygons,
			textureSize,
		}?: {
			polygons: any;
			textureSize: any;
		}): void;
		filter({
			positionBuffer,
			filterValueIndexBuffer,
			count,
		}: {
			positionBuffer: any;
			filterValueIndexBuffer: any;
			count: any;
		}): void;
		_setupResources(): void;
		_updateResources(
			vertices: any,
			indices: any,
			ids: any,
			vertexCount: any
		): void;
	}
}
declare module "@luma.gl/experimental" {
	export { default as Display } from "@luma.gl/experimental/webvr/display";
	export { default as VRDisplay } from "@luma.gl/experimental/webvr/vr-display";
	export { default as GLTFEnvironment } from "@luma.gl/experimental/gltf/gltf-environment";
	export { default as createGLTFObjects } from "@luma.gl/experimental/gltf/create-gltf-objects";
	export { default as ScenegraphNode } from "@luma.gl/experimental/scenegraph/nodes/scenegraph-node";
	export { default as GroupNode } from "@luma.gl/experimental/scenegraph/nodes/group-node";
	export { default as ModelNode } from "@luma.gl/experimental/scenegraph/nodes/model-node";
	export {
		buildHistopyramidBaseLevel,
		getHistoPyramid,
		histoPyramidGenerateIndices,
	} from "@luma.gl/experimental/gpgpu/histopyramid/histopyramid";
	export { default as GPUPointInPolygon } from "@luma.gl/experimental/gpgpu/point-in-polygon/gpu-point-in-polygon";
}