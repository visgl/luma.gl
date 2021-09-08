const resolve = require('path').resolve;
const {getOcularConfig} = require('ocular-dev-tools');
const DEPENDENCIES = require('./package.json').dependencies;

module.exports.onCreateWebpackConfig = function onCreateWebpackConfigOverride(opts) {
  const {
    stage, // build stage: ‘develop’, ‘develop-html’, ‘build-javascript’, or ‘build-html’
    // rules, // Object (map): set of preconfigured webpack config rules
    // plugins, // Object (map): A set of preconfigured webpack config plugins
    getConfig, // Function that returns the current webpack config
    // loaders, // Object (map): set of preconfigured webpack config loaders
    actions
  } = opts;

  console.log(`App rewriting gatsby webpack config ${stage}`); // eslint-disable-line

  const config = getConfig();
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};

  const ALIASES = getOcularConfig({root: resolve(__dirname, '..')}).aliases;

  // When duplicating example dependencies in website, autogenerate
  // aliases to ensure the website version is picked up
  // NOTE: module dependencies are automatically injected
  // TODO - should this be automatically done by ocular-gatsby?
  const dependencyAliases = {};
  for (const dependency in DEPENDENCIES) {
    dependencyAliases[dependency] = `${__dirname}/node_modules/${dependency}`;
  }

  // This looks strange but order matters...
  Object.assign(config.resolve.alias, ALIASES, dependencyAliases, ALIASES);

  // console.error(JSON.stringify(config.resolve.alias, null, 2));

  // Completely replace the webpack config for the current stage.
  // This can be dangerous and break Gatsby if certain configuration options are changed.
  // Generally only useful for cases where you need to handle config merging logic yourself,
  // in which case consider using webpack-merge.
  actions.replaceWebpackConfig(config);
};
