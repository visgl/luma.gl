// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { GL_PARAMETER_DEFAULTS, GL_PARAMETER_SETTERS, GL_COMPOSITE_PARAMETER_SETTERS, GL_PARAMETER_GETTERS } from './webgl-parameter-tables';
/**
 * Sets any GL parameter regardless of function (gl.blendMode, ...)
 *
 * @note requires a `cache` object to be set on the context (lumaState.cache)
 * This object is used to fill in any missing values for composite setter functions
 */
export function setGLParameters(gl, parameters) {
    if (isObjectEmpty(parameters)) {
        return;
    }
    const compositeSetters = {};
    // HANDLE PRIMITIVE SETTERS (and make note of any composite setters)
    for (const key in parameters) {
        const glConstant = Number(key);
        // @ts-ignore TODO
        const setter = GL_PARAMETER_SETTERS[key];
        if (setter) {
            // Composite setters should only be called once, so save them
            if (typeof setter === 'string') {
                // @ts-ignore TODO
                compositeSetters[setter] = true;
            }
            else {
                // if (gl[glConstant] !== undefined) {
                // TODO - added above check since this is being called on WebGL2 parameters in WebGL1...
                // TODO - deep equal on values? only call setter if value has changed?
                // NOTE - the setter will automatically update this.state
                // @ts-ignore TODO
                setter(gl, parameters[key], glConstant);
            }
        }
    }
    // HANDLE COMPOSITE SETTERS
    // NOTE: any non-provided values needed by composite setters are filled in from state cache
    // The cache parameter is automatically retrieved from the context
    // This depends on `trackContextState`, which is technically a "circular" dependency.
    // But it is too inconvenient to always require a cache parameter here.
    // This is the ONLY external dependency in this module/
    // @ts-expect-error
    const cache = gl.lumaState?.cache;
    if (cache) {
        for (const key in compositeSetters) {
            // TODO - avoid calling composite setters if values have not changed.
            // @ts-ignore TODO
            const compositeSetter = GL_COMPOSITE_PARAMETER_SETTERS[key];
            // Note - if `trackContextState` has been called,
            // the setter will automatically update this.state.cache
            compositeSetter(gl, parameters, cache);
        }
    }
    // Add a log for the else case?
}
/**
 * Reads the entire WebGL state from a context

  // default to querying all parameters

  * @returns - a newly created map, with values keyed by GL parameters
 *
 * @note Copies the state from a context (gl.getParameter should not be overriden)
 * Reads the entire WebGL state from a context
 *
 * @note This can generates a huge amount of synchronous driver roundtrips and should be
 * considered a very slow operation, to be used only if/when a context already manipulated
 * by external code needs to be synchronized for the first time
 */
export function getGLParameters(gl, parameters = GL_PARAMETER_DEFAULTS) {
    // support both arrays of parameters and objects (keys represent parameters)
    if (typeof parameters === 'number') {
        // single GL enum
        const key = parameters;
        // @ts-ignore TODO
        const getter = GL_PARAMETER_GETTERS[key];
        return getter ? getter(gl, key) : gl.getParameter(key);
    }
    const parameterKeys = Array.isArray(parameters) ? parameters : Object.keys(parameters);
    const state = {};
    for (const key of parameterKeys) {
        // @ts-ignore TODO
        const getter = GL_PARAMETER_GETTERS[key];
        // @ts-ignore TODO
        state[key] = getter ? getter(gl, Number(key)) : gl.getParameter(Number(key));
    }
    return state;
}
/**
 * Reset all parameters to a (almost) pure context state
 * @note viewport and scissor will be set to the values in GL_PARAMETER_DEFAULTS,
 * NOT the canvas size dimensions, so they will have to be properly set after
 * calling this function.
 */
export function resetGLParameters(gl) {
    setGLParameters(gl, GL_PARAMETER_DEFAULTS);
}
// Helpers
// Returns true if given object is empty, false otherwise.
function isObjectEmpty(object) {
    // @ts-ignore dummy key variable
    for (const key in object) {
        return false;
    }
    return true;
}
