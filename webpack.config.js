const getWebpackConfig = require('ocular-dev-tools/config/webpack.config');

module.exports = (env = {}) => {
  const config = getWebpackConfig(env);
  switch (env.mode) {
    case 'perf':
      config.entry = {
        perf: './test/perf/index.js'
      };
      break;

    default:
  }
  return config;
};
