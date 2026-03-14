// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Ensure extensions are only requested once */
export function getWebGLExtension(gl, name, extensions) {
    // @ts-ignore TODO
    if (extensions[name] === undefined) {
        // @ts-ignore TODO
        extensions[name] = gl.getExtension(name) || null;
    }
    // @ts-ignore TODO
    return extensions[name];
}
