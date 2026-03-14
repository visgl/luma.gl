// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/**
 * Gets luma.gl specific state from a context
 * @returns context state
 */
export function getWebGLContextData(gl) {
    // @ts-expect-error
    const contextData = gl.luma || {
        _polyfilled: false,
        extensions: {},
        softwareRenderer: false
    };
    contextData._polyfilled ??= false;
    contextData.extensions ||= {};
    // @ts-expect-error
    gl.luma = contextData;
    return contextData;
}
