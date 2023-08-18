// @ts-check

  /** @returns {import('@docusaurus/types').Plugin} */
  function OcularDocusaurusPlugin(context, opts = {alias: {}}) {
  return {
    name: 'ocular-docusaurus-plugin',
    configureWebpack(_config, isServer, utils) {
      // console.log(JSON.stringify(opts));
      // console.log(JSON.stringify(_config.resolve.alias).slice(0, 300));
      Object.assign(_config.resolve.alias, opts.alias);
      const {getStyleLoaders} = utils;
      return {
        module: {
          rules: [
            {
              test: /\.pcss$/,
              use: getStyleLoaders(isServer, {importLoaders: 1, modules: true})
            }
          ],
        },
      };
    },
  };
}

module.exports = OcularDocusaurusPlugin;
