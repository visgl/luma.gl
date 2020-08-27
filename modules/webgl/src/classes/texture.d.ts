import Resource from "@luma.gl/webgl/classes/resource";

export default class Texture extends Resource {
	readonly width: number;
	readonly height: number;
	readonly depth: number;
	readonly target: any;

	static isSupported(gl: WebGLRenderingContext, options?: {
		format: any;
		linearFiltering: any;
	}): boolean;

	constructor(gl: WebGLRenderingContext, props: any);
	toString(): string;
	initialize(props?: {}): this | void;
	resize(options: {
		height: any;
		width: any;
		mipmaps?: boolean;
	}): this;
	generateMipmap(params?: {}): this;
	setImageData(options: any): this;

	/**
	 * Redefines an area of an existing texture
	 * Note: does not allocate storage
	 */
	setSubImageData(options: {
		target?: any;
		pixels?: any;
		data?: any;
		x?: number;
		y?: number;
		width?: any;
		height?: any;
		level?: number;
		format?: any;
		type?: any;
		dataFormat?: any;
		compressed?: boolean;
		offset?: number;
		border?: any;
		parameters?: {};
	}): void;

	/**
	 * Defines a two-dimensional texture image or cube-map texture image with
	 * pixels from the current framebuffer (rather than from client memory).
	 * (gl.copyTexImage2D wrapper)
	 *
	 * Note that binding a texture into a Framebuffer's color buffer and
	 * rendering can be faster.
	 */
	copyFramebuffer(opts?: {}): any;
	getActiveUnit(): number;
	bind(textureUnit?: any): any;
	unbind(textureUnit?: any): any;
}
