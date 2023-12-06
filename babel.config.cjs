const {getBabelConfig} = require('ocular-dev-tools/configuration');

/**
 * NOTE: To debug our babel plugins, reference the local modules using
 * `./dev-modules/<plugin>/index.js`, instead of the npm package names.
 */
module.exports = getBabelConfig({
  overrides: {
    plugins: [
      // inject __VERSION__ from package.json
      // 'version-inline',
      // TODO(v9): Publish `babel-plugin-inline-webgl-constants` and re-enable.
      // 'babel-plugin-inline-webgl-constants',
      // [
      //   'babel-plugin-remove-glsl-comments',
      //   {
      //     patterns: ['**/shadertools/src/modules/**/*.js']
      //   }
      // ]
      // ['./dev-modules/babel-plugin-remove-glsl-comments', {
      //     patterns: ['**/shadertools/src/modules/**/*.js']
      //   }
      // ]
    ],
    ignore: [
      // babel can't process .d.ts
      /\.d\.ts$/
    ]
  },
  debug: false
});
