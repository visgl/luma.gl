// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Buffer, ComputePipeline, UniformStore, log, getTypedArrayConstructor } from '@luma.gl/core';
import { ShaderAssembler } from '@luma.gl/shadertools';
import { isNumericArray } from '@math.gl/types';
import { ShaderInputs } from '../shader-inputs';
import { PipelineFactory } from '../factories/pipeline-factory';
import { ShaderFactory } from '../factories/shader-factory';
import { uid } from '../utils/uid';
// import {getDebugTableForShaderLayout} from '../debug/debug-shader-layout';
const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;
/**
 * v9 Model API
 * A model
 * - automatically reuses pipelines (programs) when possible
 * - automatically rebuilds pipelines if necessary to accommodate changed settings
 * shadertools integration
 * - accepts modules and performs shader transpilation
 */
export class Computation {
    static defaultProps = {
        ...ComputePipeline.defaultProps,
        id: 'unnamed',
        handle: undefined,
        userData: {},
        source: '',
        modules: [],
        defines: {},
        bindings: undefined,
        shaderInputs: undefined,
        pipelineFactory: undefined,
        shaderFactory: undefined,
        shaderAssembler: ShaderAssembler.getDefaultShaderAssembler(),
        debugShaders: undefined
    };
    device;
    id;
    pipelineFactory;
    shaderFactory;
    userData = {};
    /** Bindings (textures, samplers, uniform buffers) */
    bindings = {};
    /** The underlying GPU pipeline. */
    pipeline;
    /** Assembled compute shader source */
    source;
    /** the underlying compiled compute shader */
    // @ts-ignore Set in function called from constructor
    shader;
    /** ShaderInputs instance */
    shaderInputs;
    // @ts-ignore Set in function called from constructor
    _uniformStore;
    _pipelineNeedsUpdate = 'newly created';
    _getModuleUniforms;
    props;
    _destroyed = false;
    constructor(device, props) {
        if (device.type !== 'webgpu') {
            throw new Error('Computation is only supported in WebGPU');
        }
        this.props = { ...Computation.defaultProps, ...props };
        props = this.props;
        this.id = props.id || uid('model');
        this.device = device;
        Object.assign(this.userData, props.userData);
        // Setup shader module inputs
        const moduleMap = Object.fromEntries(this.props.modules?.map(module => [module.name, module]) || []);
        // @ts-ignore TODO - fix up typing?
        this.shaderInputs = props.shaderInputs || new ShaderInputs(moduleMap);
        this.setShaderInputs(this.shaderInputs);
        // Support WGSL shader layout introspection
        // TODO - Don't modify props!!
        // @ts-expect-error method on WebGPUDevice
        this.props.shaderLayout ||= device.getShaderLayout(this.props.source);
        // Setup shader assembler
        const platformInfo = getPlatformInfo(device);
        // Extract modules from shader inputs if not supplied
        const modules = (this.props.modules?.length > 0 ? this.props.modules : this.shaderInputs?.getModules()) || [];
        this.pipelineFactory =
            props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);
        this.shaderFactory = props.shaderFactory || ShaderFactory.getDefaultShaderFactory(this.device);
        const { source, getUniforms } = this.props.shaderAssembler.assembleWGSLShader({
            platformInfo,
            ...this.props,
            modules
        });
        this.source = source;
        // @ts-ignore
        this._getModuleUniforms = getUniforms;
        // Create the pipeline
        // @note order is important
        this.pipeline = this._updatePipeline();
        // Apply any dynamic settings that will not trigger pipeline change
        if (props.bindings) {
            this.setBindings(props.bindings);
        }
        // Catch any access to non-standard props
        Object.seal(this);
    }
    destroy() {
        if (this._destroyed)
            return;
        this.pipelineFactory.release(this.pipeline);
        this.shaderFactory.release(this.shader);
        this._uniformStore.destroy();
        this._destroyed = true;
    }
    // Draw call
    predraw() {
        // Update uniform buffers if needed
        this.updateShaderInputs();
    }
    dispatch(computePass, x, y, z) {
        try {
            this._logDrawCallStart();
            // Check if the pipeline is invalidated
            // TODO - this is likely the worst place to do this from performance perspective. Perhaps add a predraw()?
            this.pipeline = this._updatePipeline();
            // Set pipeline state, we may be sharing a pipeline so we need to set all state on every draw
            // Any caching needs to be done inside the pipeline functions
            this.pipeline.setBindings(this.bindings);
            computePass.setPipeline(this.pipeline);
            // @ts-expect-error
            computePass.setBindings([]);
            computePass.dispatch(x, y, z);
        }
        finally {
            this._logDrawCallEnd();
        }
    }
    // Update fixed fields (can trigger pipeline rebuild)
    // Update dynamic fields
    /**
     * Updates the vertex count (used in draw calls)
     * @note Any attributes with stepMode=vertex need to be at least this big
     */
    setVertexCount(vertexCount) {
        // this.vertexCount = vertexCount;
    }
    /**
     * Updates the instance count (used in draw calls)
     * @note Any attributes with stepMode=instance need to be at least this big
     */
    setInstanceCount(instanceCount) {
        // this.instanceCount = instanceCount;
    }
    setShaderInputs(shaderInputs) {
        this.shaderInputs = shaderInputs;
        this._uniformStore = new UniformStore(this.shaderInputs.modules);
        // Create uniform buffer bindings for all modules
        for (const moduleName of Object.keys(this.shaderInputs.modules)) {
            const uniformBuffer = this._uniformStore.getManagedUniformBuffer(this.device, moduleName);
            this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
        }
    }
    /**
     * Updates shader module settings (which results in uniforms being set)
     */
    setShaderModuleProps(props) {
        const uniforms = this._getModuleUniforms(props);
        // Extract textures & framebuffers set by the modules
        // TODO better way to extract bindings
        const keys = Object.keys(uniforms).filter(k => {
            const uniform = uniforms[k];
            return (!isNumericArray(uniform) && typeof uniform !== 'number' && typeof uniform !== 'boolean');
        });
        const bindings = {};
        for (const k of keys) {
            bindings[k] = uniforms[k];
            delete uniforms[k];
        }
    }
    updateShaderInputs() {
        this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
    }
    /**
     * Sets bindings (textures, samplers, uniform buffers)
     */
    setBindings(bindings) {
        Object.assign(this.bindings, bindings);
    }
    _setPipelineNeedsUpdate(reason) {
        this._pipelineNeedsUpdate = this._pipelineNeedsUpdate || reason;
    }
    _updatePipeline() {
        if (this._pipelineNeedsUpdate) {
            let prevShader = null;
            if (this.pipeline) {
                log.log(1, `Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)();
                prevShader = this.shader;
            }
            this._pipelineNeedsUpdate = false;
            this.shader = this.shaderFactory.createShader({
                id: `${this.id}-fragment`,
                stage: 'compute',
                source: this.source,
                debugShaders: this.props.debugShaders
            });
            this.pipeline = this.pipelineFactory.createComputePipeline({
                ...this.props,
                shader: this.shader
            });
            if (prevShader) {
                this.shaderFactory.release(prevShader);
            }
        }
        return this.pipeline;
    }
    /** Throttle draw call logging */
    _lastLogTime = 0;
    _logOpen = false;
    _logDrawCallStart() {
        // IF level is 4 or higher, log every frame.
        const logDrawTimeout = log.level > 3 ? 0 : LOG_DRAW_TIMEOUT;
        if (log.level < 2 || Date.now() - this._lastLogTime < logDrawTimeout) {
            return;
        }
        this._lastLogTime = Date.now();
        this._logOpen = true;
        log.group(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`, { collapsed: log.level <= 2 })();
    }
    _logDrawCallEnd() {
        if (this._logOpen) {
            // const shaderLayoutTable = getDebugTableForShaderLayout(this.pipeline.props.shaderLayout, this.id);
            // log.table(logLevel, attributeTable)();
            // log.table(logLevel, uniformTable)();
            // log.table(LOG_DRAW_PRIORITY, shaderLayoutTable)();
            const uniformTable = this.shaderInputs.getDebugTable();
            log.table(LOG_DRAW_PRIORITY, uniformTable)();
            log.groupEnd(LOG_DRAW_PRIORITY)();
            this._logOpen = false;
        }
    }
    _drawCount = 0;
    // TODO - fix typing of luma data types
    _getBufferOrConstantValues(attribute, dataType) {
        const TypedArrayConstructor = getTypedArrayConstructor(dataType);
        const typedArray = attribute instanceof Buffer ? new TypedArrayConstructor(attribute.debugData) : attribute;
        return typedArray.toString();
    }
}
/** Create a shadertools platform info from the Device */
export function getPlatformInfo(device) {
    return {
        type: device.type,
        shaderLanguage: device.info.shadingLanguage,
        shaderLanguageVersion: device.info.shadingLanguageVersion,
        gpu: device.info.gpu,
        // HACK - we pretend that the DeviceFeatures is a Set, it has a similar API
        features: device.features
    };
}
