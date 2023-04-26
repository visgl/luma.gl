const {getBabelConfig} = require('ocular-dev-tools/configuration');

module.exports = getBabelConfig({
  overrides: {
    plugins: [
      // inject __VERSION__ from package.json
      // 'version-inline',
      // NOTE: To debug our babel plugins, just reference the local modules
      // './dev-modules/babel-plugin-inline-gl-constants',
      // 'babel-plugin-inline-webgl-constants',
      // TODO - Restore. Some import issue....
      // 'babel-plugin-inline-webgl-constants',
      // [
      //   'babel-plugin-remove-glsl-comments',
      //   {
      //     patterns: ['**/shadertools/src/modules/**/*.js']
      //   }
      // ]
      // NOTE: To debug our babel plugins, just reference the local modules
      // './dev-modules/babel-plugin-inline-gl-constants',
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
