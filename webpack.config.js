/* eslint-disable import/no-extraneous-dependencies */
const {getWebpackConfig} = require('ocular-dev-tools');

module.exports = (env = {}) => {
  let config = getWebpackConfig(env);

  config.devtool = 'source-map';

  config = addBabelSettings(config);

  switch (env.mode) {
    case 'perf':
      config.entry = {
        perf: './test/perf/index.js'
      };
      break;

    default:
  }

  // Log regex
  // eslint-disable-next-line
  Object.defineProperty(RegExp.prototype, 'toJSON', {
    value: RegExp.prototype.toString
  });

  // Uncomment to debug config
  // console.warn(JSON.stringify(config, null, 2));

  return [config];
};

function makeBabelRule() {
  return {
    // Compile source using babel
    test: /(\.js|\.ts|\.tsx)$/,
    loader: 'babel-loader',
    include: [/modules\/.*\/src/, /modules\/.*\/test/],
    exclude: [/node_modules/],
    options: {
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            exclude: [/transform-async-to-generator/, /transform-regenerator/]
          }
        ]
      ],
      plugins: ['@babel/plugin-proposal-class-properties']
    }
  };
}

function addBabelSettings(config) {
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules.filter((r) => r.loader !== 'babel-loader'),
        makeBabelRule(),
        // See https://github.com/apollographql/apollo-link-state/issues/302
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        }
      ]
    },
    resolve: {
      ...config.resolve,
      extensions: ['.ts', '.tsx', '.js', '.json']
    }
  };
}
