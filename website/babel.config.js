// Copied from '@docusaurus/core/lib/babel/preset' template
const ESM_TARGETS = ['>0.2% and supports async-functions', 'maintained node versions', 'not dead'];

"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
function getTransformOptions(isServer) {
    const absoluteRuntimePath = path_1.default.dirname(require.resolve(`@babel/runtime/package.json`));
    return {
        // All optional newlines and whitespace will be omitted when generating code
        // in compact mode
        compact: true,
        presets: [
            isServer
                ? [
                    require.resolve('@babel/preset-env'),
                    {
                        targets: {
                            node: 16,
                        },
                    },
                ]
                : [
                    require.resolve('@babel/preset-env'),
                    {
                        targets: ESM_TARGETS,
                        useBuiltIns: 'entry',
                        loose: true,
                        corejs: '3',
                        // Do not transform modules to CJS
                        modules: false,
                        // Exclude transforms that make all code slower
                        exclude: ['transform-typeof-symbol', 'transform-regenerator', 'transform-async-to-generator'],
                    },
                ],
            require.resolve('@babel/preset-react'),
            require.resolve('@babel/preset-typescript'),
        ],
        plugins: [
            // // Polyfills the runtime needed for async/await, generators, and friends
            // // https://babeljs.io/docs/en/babel-plugin-transform-runtime
            // [
            //     require.resolve('@babel/plugin-transform-runtime'),
            //     {
            //         corejs: false,
            //         helpers: false,
            //         // By default, it assumes @babel/runtime@7.0.0. Since we use >7.0.0,
            //         // better to explicitly specify the version so that it can reuse the
            //         // helper better. See https://github.com/babel/babel/issues/10261
            //         // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
            //         version: require('@babel/runtime/package.json')
            //             .version,
            //         regenerator: false,
            //         useESModules: true,
            //         // Undocumented option that lets us encapsulate our runtime, ensuring
            //         // the correct version is used
            //         // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-plugin-transform-runtime/src/index.js#L35-L42
            //         absoluteRuntime: absoluteRuntimePath,
            //     },
            // ],
            // Adds syntax support for import()
            isServer
                ? require.resolve('babel-plugin-dynamic-import-node')
                : require.resolve('@babel/plugin-syntax-dynamic-import'),
        ],
    };
}
function babelPresets(api) {
    const callerName = api.caller((caller) => caller?.name);
    return getTransformOptions(callerName === 'server');
}
exports.default = babelPresets;