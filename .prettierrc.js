const {getPrettierConfig, deepMerge} = require('ocular-dev-tools');

const config = getPrettierConfig({react: '16.8.2'});

// Make any changes to default config here

// Uncomment to log the eslint config
// console.debug(config);

module.exports = config;
