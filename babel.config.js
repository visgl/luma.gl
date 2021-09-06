const {getBabelConfig, deepMerge} = require('ocular-dev-tools');

module.exports = (api) => {
  const defaultConfig = getBabelConfig(api, {react: true});

  const config = deepMerge(defaultConfig, {
    plugins: [
      // inject __VERSION__ from package.json
      // 'version-inline',
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
  });

  // console.debug(config);
  return config;
};
