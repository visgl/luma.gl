const {getBabelConfig} = require('ocular-dev-tools/configuration');

// eslint-disable-next-line no-process-env
const pkg = require(process.env.npm_package_json);

/**
 * NOTE: To debug our babel plugins, reference the local modules using
 * `./dev-modules/<plugin>/index.js`, instead of the npm package names.
 */

const plugins = [
  // inject __VERSION__ from package.json
  // 'version-inline',
  // [
  //   // './dev-modules/babel-plugin-remove-glsl-comments/index.js'
  //   'babel-plugin-remove-glsl-comments',
  //   {patterns: ['**/shadertools/src/modules/**/*.js']}
  // ]
];

// Lerna builds `@luma.gl/constants` before building any packages that depend
// on it. This plugin uses LOCAL `@luma.gl/constants`, and will fail without
// it, so delay using the plugin until reaching a package depending on constants.
if (pkg.dependencies && '@luma.gl/constants' in pkg.dependencies) {
  // plugins.push('./dev-modules/babel-plugin-remove-glsl-comments/index.js');
  plugins.push('babel-plugin-inline-webgl-constants');
}

module.exports = getBabelConfig({
  overrides: {
    plugins,
    ignore: [
      // babel can't process .d.ts
      /\.d\.ts$/
    ]
  },
  debug: false
});
