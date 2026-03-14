// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// NOTE: Modules other than `@luma.gl/webgl` should not import `GL` from
// `@luma.gl/constants`. Locally we use `GLEnum` instead of `GL` to avoid
// conflicts with the `babel-plugin-inline-webgl-constants` plugin.
// eslint-disable-next-line no-shadow
export var GLEnum;
(function (GLEnum) {
    GLEnum[GLEnum["POINTS"] = 0] = "POINTS";
    GLEnum[GLEnum["LINES"] = 1] = "LINES";
    GLEnum[GLEnum["LINE_LOOP"] = 2] = "LINE_LOOP";
    GLEnum[GLEnum["LINE_STRIP"] = 3] = "LINE_STRIP";
    GLEnum[GLEnum["TRIANGLES"] = 4] = "TRIANGLES";
    GLEnum[GLEnum["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
    GLEnum[GLEnum["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
})(GLEnum || (GLEnum = {}));
export function convertGLDrawModeToTopology(drawMode) {
    // prettier-ignore
    switch (drawMode) {
        case GLEnum.POINTS: return 'point-list';
        case GLEnum.LINES: return 'line-list';
        case GLEnum.LINE_STRIP: return 'line-strip';
        case GLEnum.TRIANGLES: return 'triangle-list';
        case GLEnum.TRIANGLE_STRIP: return 'triangle-strip';
        default: throw new Error(String(drawMode));
    }
}
