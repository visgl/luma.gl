export default class ProgramManager {
	static getDefaultProgramManager(gl: WebGLRenderingContext): any;
	constructor(gl: WebGLRenderingContext);
	addDefaultModule(module: any): void;
	removeDefaultModule(module: any): void;
	addShaderHook(hook: any, opts: any): void;
	get(props?: {}): any;
	getUniforms(program: any): any;
	release(program: any): void;
}
