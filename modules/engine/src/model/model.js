// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Buffer, Texture, TextureView, Sampler, RenderPipeline, UniformStore, log, getTypedArrayConstructor, getAttributeInfosFromLayouts } from '@luma.gl/core';
import { ShaderAssembler } from '@luma.gl/shadertools';
import { makeGPUGeometry } from '../geometry/gpu-geometry';
import { PipelineFactory } from '../factories/pipeline-factory';
import { ShaderFactory } from '../factories/shader-factory';
import { getDebugTableForShaderLayout } from '../debug/debug-shader-layout';
import { debugFramebuffer } from '../debug/debug-framebuffer';
import { deepEqual } from '../utils/deep-equal';
import { BufferLayoutHelper } from '../utils/buffer-layout-helper';
import { sortedBufferLayoutByShaderSourceLocations } from '../utils/buffer-layout-order';
import { uid } from '../utils/uid';
import { ShaderInputs } from '../shader-inputs';
import { DynamicTexture } from '../dynamic-texture/dynamic-texture';
const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;
/**
 * High level draw API for luma.gl.
 *
 * A `Model` encapsulates shaders, geometry attributes, bindings and render
 * pipeline state into a single object. It automatically reuses and rebuilds
 * pipelines as render parameters change and exposes convenient hooks for
 * updating uniforms and attributes.
 *
 * Features:
 * - Reuses and lazily recompiles {@link RenderPipeline | pipelines} as needed.
 * - Integrates with `@luma.gl/shadertools` to assemble GLSL or WGSL from shader modules.
 * - Manages geometry attributes and buffer bindings.
 * - Accepts textures, samplers and uniform buffers as bindings, including `AsyncTexture`.
 * - Provides detailed debug logging and optional shader source inspection.
 */
export class Model {
    static defaultProps = {
        ...RenderPipeline.defaultProps,
        source: undefined,
        vs: null,
        fs: null,
        id: 'unnamed',
        handle: undefined,
        userData: {},
        defines: {},
        modules: [],
        geometry: null,
        indexBuffer: null,
        attributes: {},
        constantAttributes: {},
        varyings: [],
        isInstanced: undefined,
        instanceCount: 0,
        vertexCount: 0,
        shaderInputs: undefined,
        pipelineFactory: undefined,
        shaderFactory: undefined,
        transformFeedback: undefined,
        shaderAssembler: ShaderAssembler.getDefaultShaderAssembler(),
        debugShaders: undefined,
        disableWarnings: undefined
    };
    /** Device that created this model */
    device;
    /** Application provided identifier */
    id;
    /** WGSL shader source when using unified shader */
    // @ts-expect-error assigned in function called from constructor
    source;
    /** GLSL vertex shader source */
    // @ts-expect-error assigned in function called from constructor
    vs;
    /** GLSL fragment shader source */
    // @ts-expect-error assigned in function called from constructor
    fs;
    /** Factory used to create render pipelines */
    pipelineFactory;
    /** Factory used to create shaders */
    shaderFactory;
    /** User-supplied per-model data */
    userData = {};
    // Fixed properties (change can trigger pipeline rebuild)
    /** The render pipeline GPU parameters, depth testing etc */
    parameters;
    /** The primitive topology */
    topology;
    /** Buffer layout */
    bufferLayout;
    // Dynamic properties
    /** Use instanced rendering */
    isInstanced = undefined;
    /** instance count. `undefined` means not instanced */
    instanceCount = 0;
    /** Vertex count */
    vertexCount;
    /** Index buffer */
    indexBuffer = null;
    /** Buffer-valued attributes */
    bufferAttributes = {};
    /** Constant-valued attributes */
    constantAttributes = {};
    /** Bindings (textures, samplers, uniform buffers) */
    bindings = {};
    /**
     * VertexArray
     * @note not implemented: if bufferLayout is updated, vertex array has to be rebuilt!
     * @todo - allow application to define multiple vertex arrays?
     * */
    vertexArray;
    /** TransformFeedback, WebGL 2 only. */
    transformFeedback = null;
    /** The underlying GPU "program". @note May be recreated if parameters change */
    pipeline;
    /** ShaderInputs instance */
    // @ts-expect-error Assigned in function called by constructor
    shaderInputs;
    // @ts-expect-error Assigned in function called by constructor
    _uniformStore;
    _attributeInfos = {};
    _gpuGeometry = null;
    props;
    _pipelineNeedsUpdate = 'newly created';
    _needsRedraw = 'initializing';
    _destroyed = false;
    /** "Time" of last draw. Monotonically increasing timestamp */
    _lastDrawTimestamp = -1;
    get [Symbol.toStringTag]() {
        return 'Model';
    }
    toString() {
        return `Model(${this.id})`;
    }
    constructor(device, props) {
        this.props = { ...Model.defaultProps, ...props };
        props = this.props;
        this.id = props.id || uid('model');
        this.device = device;
        Object.assign(this.userData, props.userData);
        // Setup shader module inputs
        const moduleMap = Object.fromEntries(this.props.modules?.map(module => [module.name, module]) || []);
        const shaderInputs = props.shaderInputs ||
            new ShaderInputs(moduleMap, { disableWarnings: this.props.disableWarnings });
        // @ts-ignore
        this.setShaderInputs(shaderInputs);
        // Setup shader assembler
        const platformInfo = getPlatformInfo(device);
        // Extract modules from shader inputs if not supplied
        const modules = 
        // @ts-ignore shaderInputs is assigned in setShaderInputs above.
        (this.props.modules?.length > 0 ? this.props.modules : this.shaderInputs?.getModules()) || [];
        const isWebGPU = this.device.type === 'webgpu';
        // WebGPU
        // TODO - hack to support unified WGSL shader
        // TODO - this is wrong, compile a single shader
        if (isWebGPU && this.props.source) {
            // WGSL
            const { source, getUniforms } = this.props.shaderAssembler.assembleWGSLShader({
                platformInfo,
                ...this.props,
                modules
            });
            this.source = source;
            // @ts-expect-error
            this._getModuleUniforms = getUniforms;
            // Extract shader layout after modules have been added to WGSL source, to include any bindings added by modules
            // @ts-expect-error Method on WebGPUDevice
            this.props.shaderLayout ||= device.getShaderLayout(this.source);
        }
        else {
            // GLSL
            const { vs, fs, getUniforms } = this.props.shaderAssembler.assembleGLSLShaderPair({
                platformInfo,
                ...this.props,
                modules
            });
            this.vs = vs;
            this.fs = fs;
            // @ts-expect-error
            this._getModuleUniforms = getUniforms;
        }
        this.vertexCount = this.props.vertexCount;
        this.instanceCount = this.props.instanceCount;
        this.topology = this.props.topology;
        this.bufferLayout = this.props.bufferLayout;
        this.parameters = this.props.parameters;
        // Geometry, if provided, sets topology and vertex cound
        if (props.geometry) {
            this.setGeometry(props.geometry);
        }
        this.pipelineFactory =
            props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);
        this.shaderFactory = props.shaderFactory || ShaderFactory.getDefaultShaderFactory(this.device);
        // Create the pipeline
        // @note order is important
        this.pipeline = this._updatePipeline();
        this.vertexArray = device.createVertexArray({
            shaderLayout: this.pipeline.shaderLayout,
            bufferLayout: this.pipeline.bufferLayout
        });
        // Now we can apply geometry attributes
        if (this._gpuGeometry) {
            this._setGeometryAttributes(this._gpuGeometry);
        }
        // Apply any dynamic settings that will not trigger pipeline change
        if ('isInstanced' in props) {
            this.isInstanced = props.isInstanced;
        }
        if (props.instanceCount) {
            this.setInstanceCount(props.instanceCount);
        }
        if (props.vertexCount) {
            this.setVertexCount(props.vertexCount);
        }
        if (props.indexBuffer) {
            this.setIndexBuffer(props.indexBuffer);
        }
        if (props.attributes) {
            this.setAttributes(props.attributes);
        }
        if (props.constantAttributes) {
            this.setConstantAttributes(props.constantAttributes);
        }
        if (props.bindings) {
            this.setBindings(props.bindings);
        }
        if (props.transformFeedback) {
            this.transformFeedback = props.transformFeedback;
        }
    }
    destroy() {
        if (!this._destroyed) {
            // Release pipeline before we destroy the shaders used by the pipeline
            this.pipelineFactory.release(this.pipeline);
            // Release the shaders
            this.shaderFactory.release(this.pipeline.vs);
            if (this.pipeline.fs) {
                this.shaderFactory.release(this.pipeline.fs);
            }
            this._uniformStore.destroy();
            // TODO - mark resource as managed and destroyIfManaged() ?
            this._gpuGeometry?.destroy();
            this._destroyed = true;
        }
    }
    // Draw call
    /** Query redraw status. Clears the status. */
    needsRedraw() {
        // Catch any writes to already bound resources
        if (this._getBindingsUpdateTimestamp() > this._lastDrawTimestamp) {
            this.setNeedsRedraw('contents of bound textures or buffers updated');
        }
        const needsRedraw = this._needsRedraw;
        this._needsRedraw = false;
        return needsRedraw;
    }
    /** Mark the model as needing a redraw */
    setNeedsRedraw(reason) {
        this._needsRedraw ||= reason;
    }
    /** Update uniforms and pipeline state prior to drawing. */
    predraw() {
        // Update uniform buffers if needed
        this.updateShaderInputs();
        // Check if the pipeline is invalidated
        this.pipeline = this._updatePipeline();
    }
    /**
     * Issue one draw call.
     * @param renderPass - render pass to draw into
     * @returns `true` if the draw call was executed, `false` if resources were not ready.
     */
    draw(renderPass) {
        const loadingBinding = this._areBindingsLoading();
        if (loadingBinding) {
            log.info(LOG_DRAW_PRIORITY, `>>> DRAWING ABORTED ${this.id}: ${loadingBinding} not loaded`)();
            return false;
        }
        try {
            renderPass.pushDebugGroup(`${this}.predraw(${renderPass})`);
            this.predraw();
        }
        finally {
            renderPass.popDebugGroup();
        }
        let drawSuccess;
        try {
            renderPass.pushDebugGroup(`${this}.draw(${renderPass})`);
            this._logDrawCallStart();
            // Update the pipeline if invalidated
            // TODO - inside RenderPass is likely the worst place to do this from performance perspective.
            // Application can call Model.predraw() to avoid this.
            this.pipeline = this._updatePipeline();
            // Set pipeline state, we may be sharing a pipeline so we need to set all state on every draw
            // Any caching needs to be done inside the pipeline functions
            // TODO this is a busy initialized check for all bindings every frame
            const syncBindings = this._getBindings();
            this.pipeline.setBindings(syncBindings, {
                disableWarnings: this.props.disableWarnings
            });
            const { indexBuffer } = this.vertexArray;
            const indexCount = indexBuffer
                ? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
                : undefined;
            drawSuccess = this.pipeline.draw({
                renderPass,
                vertexArray: this.vertexArray,
                isInstanced: this.isInstanced,
                vertexCount: this.vertexCount,
                instanceCount: this.instanceCount,
                indexCount,
                transformFeedback: this.transformFeedback || undefined,
                // WebGL shares underlying cached pipelines even for models that have different parameters and topology,
                // so we must provide our unique parameters to each draw
                // (In WebGPU most parameters are encoded in the pipeline and cannot be changed per draw call)
                parameters: this.parameters,
                topology: this.topology
            });
        }
        finally {
            renderPass.popDebugGroup();
            this._logDrawCallEnd();
        }
        this._logFramebuffer(renderPass);
        // Update needsRedraw flag
        if (drawSuccess) {
            this._lastDrawTimestamp = this.device.timestamp;
            this._needsRedraw = false;
        }
        else {
            this._needsRedraw = 'waiting for resource initialization';
        }
        return drawSuccess;
    }
    // Update fixed fields (can trigger pipeline rebuild)
    /**
     * Updates the optional geometry
     * Geometry, set topology and bufferLayout
     * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
     */
    setGeometry(geometry) {
        this._gpuGeometry?.destroy();
        const gpuGeometry = geometry && makeGPUGeometry(this.device, geometry);
        if (gpuGeometry) {
            this.setTopology(gpuGeometry.topology || 'triangle-list');
            const bufferLayoutHelper = new BufferLayoutHelper(this.bufferLayout);
            this.bufferLayout = bufferLayoutHelper.mergeBufferLayouts(gpuGeometry.bufferLayout, this.bufferLayout);
            if (this.vertexArray) {
                this._setGeometryAttributes(gpuGeometry);
            }
        }
        this._gpuGeometry = gpuGeometry;
    }
    /**
     * Updates the primitive topology ('triangle-list', 'triangle-strip' etc).
     * @note Triggers a pipeline rebuild / pipeline cache fetch on WebGPU
     */
    setTopology(topology) {
        if (topology !== this.topology) {
            this.topology = topology;
            this._setPipelineNeedsUpdate('topology');
        }
    }
    /**
     * Updates the buffer layout.
     * @note Triggers a pipeline rebuild / pipeline cache fetch
     */
    setBufferLayout(bufferLayout) {
        const bufferLayoutHelper = new BufferLayoutHelper(this.bufferLayout);
        this.bufferLayout = this._gpuGeometry
            ? bufferLayoutHelper.mergeBufferLayouts(bufferLayout, this._gpuGeometry.bufferLayout)
            : bufferLayout;
        this._setPipelineNeedsUpdate('bufferLayout');
        // Recreate the pipeline
        this.pipeline = this._updatePipeline();
        // vertex array needs to be updated if we update buffer layout,
        // but not if we update parameters
        this.vertexArray = this.device.createVertexArray({
            shaderLayout: this.pipeline.shaderLayout,
            bufferLayout: this.pipeline.bufferLayout
        });
        // Reapply geometry attributes to the new vertex array
        if (this._gpuGeometry) {
            this._setGeometryAttributes(this._gpuGeometry);
        }
    }
    /**
     * Set GPU parameters.
     * @note Can trigger a pipeline rebuild / pipeline cache fetch.
     * @param parameters
     */
    setParameters(parameters) {
        if (!deepEqual(parameters, this.parameters, 2)) {
            this.parameters = parameters;
            this._setPipelineNeedsUpdate('parameters');
        }
    }
    // Update dynamic fields
    /**
     * Updates the instance count (used in draw calls)
     * @note Any attributes with stepMode=instance need to be at least this big
     */
    setInstanceCount(instanceCount) {
        this.instanceCount = instanceCount;
        // luma.gl examples don't set props.isInstanced and rely on auto-detection
        // but deck.gl sets instanceCount even for models that are not instanced.
        if (this.isInstanced === undefined && instanceCount > 0) {
            this.isInstanced = true;
        }
        this.setNeedsRedraw('instanceCount');
    }
    /**
     * Updates the vertex count (used in draw calls)
     * @note Any attributes with stepMode=vertex need to be at least this big
     */
    setVertexCount(vertexCount) {
        this.vertexCount = vertexCount;
        this.setNeedsRedraw('vertexCount');
    }
    /** Set the shader inputs */
    setShaderInputs(shaderInputs) {
        this.shaderInputs = shaderInputs;
        this._uniformStore = new UniformStore(this.shaderInputs.modules);
        // Create uniform buffer bindings for all modules that actually have uniforms
        for (const [moduleName, module] of Object.entries(this.shaderInputs.modules)) {
            if (shaderModuleHasUniforms(module)) {
                const uniformBuffer = this._uniformStore.getManagedUniformBuffer(this.device, moduleName);
                this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
            }
        }
        this.setNeedsRedraw('shaderInputs');
    }
    /** Update uniform buffers from the model's shader inputs */
    updateShaderInputs() {
        this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
        this.setBindings(this.shaderInputs.getBindingValues());
        // TODO - this is already tracked through buffer/texture update times?
        this.setNeedsRedraw('shaderInputs');
    }
    /**
     * Sets bindings (textures, samplers, uniform buffers)
     */
    setBindings(bindings) {
        Object.assign(this.bindings, bindings);
        this.setNeedsRedraw('bindings');
    }
    /**
     * Updates optional transform feedback. WebGL only.
     */
    setTransformFeedback(transformFeedback) {
        this.transformFeedback = transformFeedback;
        this.setNeedsRedraw('transformFeedback');
    }
    /**
     * Sets the index buffer
     * @todo - how to unset it if we change geometry?
     */
    setIndexBuffer(indexBuffer) {
        this.vertexArray.setIndexBuffer(indexBuffer);
        this.setNeedsRedraw('indexBuffer');
    }
    /**
     * Sets attributes (buffers)
     * @note Overrides any attributes previously set with the same name
     */
    setAttributes(buffers, options) {
        const disableWarnings = options?.disableWarnings ?? this.props.disableWarnings;
        if (buffers['indices']) {
            log.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)();
        }
        // ensure bufferLayout order matches source layout so we bind
        // the correct buffers to the correct indices in webgpu.
        this.bufferLayout = sortedBufferLayoutByShaderSourceLocations(this.pipeline.shaderLayout, this.bufferLayout);
        const bufferLayoutHelper = new BufferLayoutHelper(this.bufferLayout);
        // Check if all buffers have a layout
        for (const [bufferName, buffer] of Object.entries(buffers)) {
            const bufferLayout = bufferLayoutHelper.getBufferLayout(bufferName);
            if (!bufferLayout) {
                if (!disableWarnings) {
                    log.warn(`Model(${this.id}): Missing layout for buffer "${bufferName}".`)();
                }
                continue; // eslint-disable-line no-continue
            }
            // In WebGL, for an interleaved attribute we may need to set multiple attributes
            // but in WebGPU, we set it according to the buffer's position in the vertexArray
            const attributeNames = bufferLayoutHelper.getAttributeNamesForBuffer(bufferLayout);
            let set = false;
            for (const attributeName of attributeNames) {
                const attributeInfo = this._attributeInfos[attributeName];
                if (attributeInfo) {
                    const location = this.device.type === 'webgpu'
                        ? bufferLayoutHelper.getBufferIndex(attributeInfo.bufferName)
                        : attributeInfo.location;
                    this.vertexArray.setBuffer(location, buffer);
                    set = true;
                }
            }
            if (!set && !disableWarnings) {
                log.warn(`Model(${this.id}): Ignoring buffer "${buffer.id}" for unknown attribute "${bufferName}"`)();
            }
        }
        this.setNeedsRedraw('attributes');
    }
    /**
     * Sets constant attributes
     * @note Overrides any attributes previously set with the same name
     * Constant attributes are only supported in WebGL, not in WebGPU
     * Any attribute that is disabled in the current vertex array object
     * is read from the context's global constant value for that attribute location.
     * @param constantAttributes
     */
    setConstantAttributes(attributes, options) {
        for (const [attributeName, value] of Object.entries(attributes)) {
            const attributeInfo = this._attributeInfos[attributeName];
            if (attributeInfo) {
                this.vertexArray.setConstantWebGL(attributeInfo.location, value);
            }
            else if (!(options?.disableWarnings ?? this.props.disableWarnings)) {
                log.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${attributeName}"`)();
            }
        }
        this.setNeedsRedraw('constants');
    }
    // INTERNAL METHODS
    /** Check that bindings are loaded. Returns id of first binding that is still loading. */
    _areBindingsLoading() {
        for (const binding of Object.values(this.bindings)) {
            if (binding instanceof DynamicTexture && !binding.isReady) {
                return binding.id;
            }
        }
        return false;
    }
    /** Extracts texture view from loaded async textures. Returns null if any textures have not yet been loaded. */
    _getBindings() {
        const validBindings = {};
        for (const [name, binding] of Object.entries(this.bindings)) {
            if (binding instanceof DynamicTexture) {
                // Check that async textures are loaded
                if (binding.isReady) {
                    validBindings[name] = binding.texture;
                }
            }
            else {
                validBindings[name] = binding;
            }
        }
        return validBindings;
    }
    /** Get the timestamp of the latest updated bound GPU memory resource (buffer/texture). */
    _getBindingsUpdateTimestamp() {
        let timestamp = 0;
        for (const binding of Object.values(this.bindings)) {
            if (binding instanceof TextureView) {
                timestamp = Math.max(timestamp, binding.texture.updateTimestamp);
            }
            else if (binding instanceof Buffer || binding instanceof Texture) {
                timestamp = Math.max(timestamp, binding.updateTimestamp);
            }
            else if (binding instanceof DynamicTexture) {
                timestamp = binding.texture
                    ? Math.max(timestamp, binding.texture.updateTimestamp)
                    : // The texture will become available in the future
                        Infinity;
            }
            else if (!(binding instanceof Sampler)) {
                timestamp = Math.max(timestamp, binding.buffer.updateTimestamp);
            }
        }
        return timestamp;
    }
    /**
     * Updates the optional geometry attributes
     * Geometry, sets several attributes, indexBuffer, and also vertex count
     * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
     */
    _setGeometryAttributes(gpuGeometry) {
        // Filter geometry attribute so that we don't issue warnings for unused attributes
        const attributes = { ...gpuGeometry.attributes };
        for (const [attributeName] of Object.entries(attributes)) {
            if (!this.pipeline.shaderLayout.attributes.find(layout => layout.name === attributeName) &&
                attributeName !== 'positions') {
                delete attributes[attributeName];
            }
        }
        // TODO - delete previous geometry?
        this.vertexCount = gpuGeometry.vertexCount;
        this.setIndexBuffer(gpuGeometry.indices || null);
        this.setAttributes(gpuGeometry.attributes, { disableWarnings: true });
        this.setAttributes(attributes, { disableWarnings: this.props.disableWarnings });
        this.setNeedsRedraw('geometry attributes');
    }
    /** Mark pipeline as needing update */
    _setPipelineNeedsUpdate(reason) {
        this._pipelineNeedsUpdate ||= reason;
        this.setNeedsRedraw(reason);
    }
    /** Update pipeline if needed */
    _updatePipeline() {
        if (this._pipelineNeedsUpdate) {
            let prevShaderVs = null;
            let prevShaderFs = null;
            if (this.pipeline) {
                log.log(1, `Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)();
                prevShaderVs = this.pipeline.vs;
                prevShaderFs = this.pipeline.fs;
            }
            this._pipelineNeedsUpdate = false;
            const vs = this.shaderFactory.createShader({
                id: `${this.id}-vertex`,
                stage: 'vertex',
                source: this.source || this.vs,
                debugShaders: this.props.debugShaders
            });
            let fs = null;
            if (this.source) {
                fs = vs;
            }
            else if (this.fs) {
                fs = this.shaderFactory.createShader({
                    id: `${this.id}-fragment`,
                    stage: 'fragment',
                    source: this.source || this.fs,
                    debugShaders: this.props.debugShaders
                });
            }
            this.pipeline = this.pipelineFactory.createRenderPipeline({
                ...this.props,
                bufferLayout: this.bufferLayout,
                topology: this.topology,
                parameters: this.parameters,
                // TODO - why set bindings here when we reset them every frame?
                // Should we expose a BindGroup abstraction?
                bindings: this._getBindings(),
                vs,
                fs
            });
            this._attributeInfos = getAttributeInfosFromLayouts(this.pipeline.shaderLayout, this.bufferLayout);
            if (prevShaderVs)
                this.shaderFactory.release(prevShaderVs);
            if (prevShaderFs)
                this.shaderFactory.release(prevShaderFs);
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
            const shaderLayoutTable = getDebugTableForShaderLayout(this.pipeline.shaderLayout, this.id);
            // log.table(logLevel, attributeTable)();
            // log.table(logLevel, uniformTable)();
            log.table(LOG_DRAW_PRIORITY, shaderLayoutTable)();
            const uniformTable = this.shaderInputs.getDebugTable();
            log.table(LOG_DRAW_PRIORITY, uniformTable)();
            const attributeTable = this._getAttributeDebugTable();
            log.table(LOG_DRAW_PRIORITY, this._attributeInfos)();
            log.table(LOG_DRAW_PRIORITY, attributeTable)();
            log.groupEnd(LOG_DRAW_PRIORITY)();
            this._logOpen = false;
        }
    }
    _drawCount = 0;
    _logFramebuffer(renderPass) {
        const debugFramebuffers = this.device.props.debugFramebuffers;
        this._drawCount++;
        // Update first 3 frames and then every 60 frames
        if (!debugFramebuffers) {
            // } || (this._drawCount++ > 3 && this._drawCount % 60)) {
            return;
        }
        // TODO - display framebuffer output in debug window
        const framebuffer = renderPass.props.framebuffer;
        if (framebuffer) {
            debugFramebuffer(framebuffer, { id: framebuffer.id, minimap: true });
            // log.image({logLevel: LOG_DRAW_PRIORITY, message: `${framebuffer.id} %c sup?`, image})();
        }
    }
    _getAttributeDebugTable() {
        const table = {};
        for (const [name, attributeInfo] of Object.entries(this._attributeInfos)) {
            const values = this.vertexArray.attributes[attributeInfo.location];
            table[attributeInfo.location] = {
                name,
                type: attributeInfo.shaderType,
                values: values
                    ? this._getBufferOrConstantValues(values, attributeInfo.bufferDataType)
                    : 'null'
            };
        }
        if (this.vertexArray.indexBuffer) {
            const { indexBuffer } = this.vertexArray;
            const values = indexBuffer.indexType === 'uint32'
                ? new Uint32Array(indexBuffer.debugData)
                : new Uint16Array(indexBuffer.debugData);
            table['indices'] = {
                name: 'indices',
                type: indexBuffer.indexType,
                values: values.toString()
            };
        }
        return table;
    }
    // TODO - fix typing of luma data types
    _getBufferOrConstantValues(attribute, dataType) {
        const TypedArrayConstructor = getTypedArrayConstructor(dataType);
        const typedArray = attribute instanceof Buffer ? new TypedArrayConstructor(attribute.debugData) : attribute;
        return typedArray.toString();
    }
}
function shaderModuleHasUniforms(module) {
    return Boolean(module.uniformTypes && !isObjectEmpty(module.uniformTypes));
}
// HELPERS
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
/** Returns true if given object is empty, false otherwise. */
function isObjectEmpty(obj) {
    // @ts-ignore key is unused
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const key in obj) {
        return false;
    }
    return true;
}
