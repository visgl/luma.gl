// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Generate hook source code */
export function getShaderHooks(hookFunctions, hookInjections) {
    let result = '';
    for (const hookName in hookFunctions) {
        const hookFunction = hookFunctions[hookName];
        result += `void ${hookFunction.signature} {\n`;
        if (hookFunction.header) {
            result += `  ${hookFunction.header}`;
        }
        if (hookInjections[hookName]) {
            const injections = hookInjections[hookName];
            injections.sort((a, b) => a.order - b.order);
            for (const injection of injections) {
                result += `  ${injection.injection}\n`;
            }
        }
        if (hookFunction.footer) {
            result += `  ${hookFunction.footer}`;
        }
        result += '}\n';
    }
    return result;
}
/**
 * Parse string based hook functions
 * And split per shader
 */
export function normalizeShaderHooks(hookFunctions) {
    const result = { vertex: {}, fragment: {} };
    for (const hookFunction of hookFunctions) {
        let opts;
        let hook;
        if (typeof hookFunction !== 'string') {
            opts = hookFunction;
            hook = opts.hook;
        }
        else {
            opts = {};
            hook = hookFunction;
        }
        hook = hook.trim();
        const [shaderStage, signature] = hook.split(':');
        const name = hook.replace(/\(.+/, '');
        const normalizedHook = Object.assign(opts, { signature });
        switch (shaderStage) {
            case 'vs':
                result.vertex[name] = normalizedHook;
                break;
            case 'fs':
                result.fragment[name] = normalizedHook;
                break;
            default:
                throw new Error(shaderStage);
        }
    }
    return result;
}
