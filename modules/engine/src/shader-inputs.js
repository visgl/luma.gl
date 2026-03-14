// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { log } from '@luma.gl/core';
// import type {VariableShaderType, UniformValue, UniformFormat, UniformInfoDevice, Texture, Sampler} from '@luma.gl/core';
import { getShaderModuleDependencies } from '@luma.gl/shadertools';
import { splitUniformsAndBindings } from './model/split-uniforms-and-bindings';
/**
 * ShaderInputs holds uniform and binding values for one or more shader modules,
 * - It can generate binary data for any uniform buffer
 * - It can manage a uniform buffer for each block
 * - It can update managed uniform buffers with a single call
 * - It performs some book keeping on what has changed to minimize unnecessary writes to uniform buffers.
 */
export class ShaderInputs {
    options = {
        disableWarnings: false
    };
    /**
     * The map of modules
     * @todo should should this include the resolved dependencies?
     */
    // @ts-ignore Fix typings
    modules;
    /** Stores the uniform values for each module */
    moduleUniforms;
    /** Stores the uniform bindings for each module  */
    moduleBindings;
    /** Tracks if uniforms have changed */
    // moduleUniformsChanged: Record<keyof ShaderPropsT, false | string>;
    /**
     * Create a new UniformStore instance
     * @param modules
     */
    constructor(
    // @ts-ignore Fix typings
    modules, options) {
        Object.assign(this.options, options);
        // Extract modules with dependencies
        const resolvedModules = getShaderModuleDependencies(Object.values(modules).filter(module => module.dependencies));
        for (const resolvedModule of resolvedModules) {
            // @ts-ignore
            modules[resolvedModule.name] = resolvedModule;
        }
        log.log(1, 'Creating ShaderInputs with modules', Object.keys(modules))();
        // Store the module definitions and create storage for uniform values and binding values, per module
        // @ts-ignore Fix typings
        this.modules = modules;
        this.moduleUniforms = {};
        this.moduleBindings = {};
        // Initialize the modules
        for (const [name, module] of Object.entries(modules)) {
            this._addModule(module);
            if (module.name && name !== module.name && !this.options.disableWarnings) {
                log.warn(`Module name: ${name} vs ${module.name}`)();
            }
        }
    }
    /** Destroy */
    destroy() { }
    /**
     * Set module props
     */
    setProps(props) {
        for (const name of Object.keys(props)) {
            const moduleName = name;
            const moduleProps = props[moduleName] || {};
            const module = this.modules[moduleName];
            if (!module) {
                // Ignore props for unregistered modules
                if (!this.options.disableWarnings) {
                    log.warn(`Module ${name} not found`)();
                }
                continue; // eslint-disable-line no-continue
            }
            const oldUniforms = this.moduleUniforms[moduleName];
            const oldBindings = this.moduleBindings[moduleName];
            const uniformsAndBindings = module.getUniforms?.(moduleProps, oldUniforms) || moduleProps;
            const { uniforms, bindings } = splitUniformsAndBindings(uniformsAndBindings);
            this.moduleUniforms[moduleName] = { ...oldUniforms, ...uniforms };
            this.moduleBindings[moduleName] = { ...oldBindings, ...bindings };
            // this.moduleUniformsChanged ||= moduleName;
            // console.log(`setProps(${String(moduleName)}`, moduleName, this.moduleUniforms[moduleName])
        }
    }
    /**
     * Return the map of modules
     * @todo should should this include the resolved dependencies?
     */
    getModules() {
        return Object.values(this.modules);
    }
    /** Get all uniform values for all modules */
    getUniformValues() {
        return this.moduleUniforms;
    }
    /** Merges all bindings for the shader (from the various modules) */
    getBindingValues() {
        const bindings = {};
        for (const moduleBindings of Object.values(this.moduleBindings)) {
            Object.assign(bindings, moduleBindings);
        }
        return bindings;
    }
    // INTERNAL
    /** Return a debug table that can be used for console.table() or log.table() */
    getDebugTable() {
        const table = {};
        for (const [moduleName, module] of Object.entries(this.moduleUniforms)) {
            for (const [key, value] of Object.entries(module)) {
                table[`${moduleName}.${key}`] = {
                    type: this.modules[moduleName].uniformTypes?.[key],
                    value: String(value)
                };
            }
        }
        return table;
    }
    _addModule(module) {
        const moduleName = module.name;
        // Get default uniforms from module
        this.moduleUniforms[moduleName] = module.defaultUniforms || {};
        this.moduleBindings[moduleName] = {};
    }
}
