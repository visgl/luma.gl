// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { RenderPipeline, ComputePipeline, log } from '@luma.gl/core';
import { uid } from '../utils/uid';
/**
 * Efficiently creates / caches pipelines
 */
export class PipelineFactory {
    static defaultProps = { ...RenderPipeline.defaultProps };
    /** Get the singleton default pipeline factory for the specified device */
    static getDefaultPipelineFactory(device) {
        const moduleData = device.getModuleData('@luma.gl/engine');
        moduleData.defaultPipelineFactory ||= new PipelineFactory(device);
        return moduleData.defaultPipelineFactory;
    }
    device;
    cachingEnabled;
    destroyPolicy;
    debug;
    _hashCounter = 0;
    _hashes = {};
    _renderPipelineCache = {};
    _computePipelineCache = {};
    get [Symbol.toStringTag]() {
        return 'PipelineFactory';
    }
    toString() {
        return `PipelineFactory(${this.device.id})`;
    }
    constructor(device) {
        this.device = device;
        this.cachingEnabled = device.props._cachePipelines;
        this.destroyPolicy = device.props._cacheDestroyPolicy;
        this.debug = device.props.debugFactories;
    }
    /** Return a RenderPipeline matching supplied props. Reuses an equivalent pipeline if already created. */
    createRenderPipeline(props) {
        if (!this.cachingEnabled) {
            return this.device.createRenderPipeline(props);
        }
        const allProps = { ...RenderPipeline.defaultProps, ...props };
        const cache = this._renderPipelineCache;
        const hash = this._hashRenderPipeline(allProps);
        let pipeline = cache[hash]?.pipeline;
        if (!pipeline) {
            pipeline = this.device.createRenderPipeline({
                ...allProps,
                id: allProps.id ? `${allProps.id}-cached` : uid('unnamed-cached')
            });
            pipeline.hash = hash;
            cache[hash] = { pipeline, useCount: 1 };
            if (this.debug) {
                log.log(3, `${this}: ${pipeline} created, count=${cache[hash].useCount}`)();
            }
        }
        else {
            cache[hash].useCount++;
            if (this.debug) {
                log.log(3, `${this}: ${cache[hash].pipeline} reused, count=${cache[hash].useCount}, (id=${props.id})`)();
            }
        }
        return pipeline;
    }
    /** Return a ComputePipeline matching supplied props. Reuses an equivalent pipeline if already created. */
    createComputePipeline(props) {
        if (!this.cachingEnabled) {
            return this.device.createComputePipeline(props);
        }
        const allProps = { ...ComputePipeline.defaultProps, ...props };
        const cache = this._computePipelineCache;
        const hash = this._hashComputePipeline(allProps);
        let pipeline = cache[hash]?.pipeline;
        if (!pipeline) {
            pipeline = this.device.createComputePipeline({
                ...allProps,
                id: allProps.id ? `${allProps.id}-cached` : undefined
            });
            pipeline.hash = hash;
            cache[hash] = { pipeline, useCount: 1 };
            if (this.debug) {
                log.log(3, `${this}: ${pipeline} created, count=${cache[hash].useCount}`)();
            }
        }
        else {
            cache[hash].useCount++;
            if (this.debug) {
                log.log(3, `${this}: ${cache[hash].pipeline} reused, count=${cache[hash].useCount}, (id=${props.id})`)();
            }
        }
        return pipeline;
    }
    release(pipeline) {
        if (!this.cachingEnabled) {
            pipeline.destroy();
            return;
        }
        const cache = this._getCache(pipeline);
        const hash = pipeline.hash;
        cache[hash].useCount--;
        if (cache[hash].useCount === 0) {
            this._destroyPipeline(pipeline);
            if (this.debug) {
                log.log(3, `${this}: ${pipeline} released and destroyed`)();
            }
        }
        else if (cache[hash].useCount < 0) {
            log.error(`${this}: ${pipeline} released, useCount < 0, resetting`)();
            cache[hash].useCount = 0;
        }
        else if (this.debug) {
            log.log(3, `${this}: ${pipeline} released, count=${cache[hash].useCount}`)();
        }
    }
    // PRIVATE
    /** Destroy a cached pipeline, removing it from the cache (depending on destroy policy) */
    _destroyPipeline(pipeline) {
        const cache = this._getCache(pipeline);
        switch (this.destroyPolicy) {
            case 'never':
                return false;
            case 'unused':
                delete cache[pipeline.hash];
                pipeline.destroy();
                return true;
        }
    }
    /** Get the appropriate cache for the type of pipeline */
    _getCache(pipeline) {
        let cache;
        if (pipeline instanceof ComputePipeline) {
            cache = this._computePipelineCache;
        }
        if (pipeline instanceof RenderPipeline) {
            cache = this._renderPipelineCache;
        }
        if (!cache) {
            throw new Error(`${this}`);
        }
        if (!cache[pipeline.hash]) {
            throw new Error(`${this}: ${pipeline} matched incorrect entry`);
        }
        return cache;
    }
    /** Calculate a hash based on all the inputs for a compute pipeline */
    _hashComputePipeline(props) {
        const { type } = this.device;
        const shaderHash = this._getHash(props.shader.source);
        return `${type}/C/${shaderHash}`;
    }
    /** Calculate a hash based on all the inputs for a render pipeline */
    _hashRenderPipeline(props) {
        const vsHash = props.vs ? this._getHash(props.vs.source) : 0;
        const fsHash = props.fs ? this._getHash(props.fs.source) : 0;
        // WebGL specific
        // const {varyings = [], bufferMode = {}} = props;
        // const varyingHashes = varyings.map((v) => this._getHash(v));
        const varyingHash = '-'; // `${varyingHashes.join('/')}B${bufferMode}`
        const bufferLayoutHash = this._getHash(JSON.stringify(props.bufferLayout));
        const { type } = this.device;
        switch (type) {
            case 'webgl':
                // WebGL is more dynamic
                return `${type}/R/${vsHash}/${fsHash}V${varyingHash}BL${bufferLayoutHash}`;
            case 'webgpu':
            default:
                // On WebGPU we need to rebuild the pipeline if topology, parameters or bufferLayout change
                const parameterHash = this._getHash(JSON.stringify(props.parameters));
                // TODO - Can json.stringify() generate different strings for equivalent objects if order of params is different?
                // create a deepHash() to deduplicate?
                return `${type}/R/${vsHash}/${fsHash}V${varyingHash}T${props.topology}P${parameterHash}BL${bufferLayoutHash}`;
        }
    }
    _getHash(key) {
        if (this._hashes[key] === undefined) {
            this._hashes[key] = this._hashCounter++;
        }
        return this._hashes[key];
    }
}
