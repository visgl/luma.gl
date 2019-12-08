const ocularConfig = require('./ocular-config');

const GATSBY_CONFIG = {
  plugins: [
    {resolve: `gatsby-theme-ocular`, options: ocularConfig}
  ],
};

// NOTE: uncomment to debug config
// console.log(JSON.stringify(GATSBY_CONFIG, null, 2));

module.exports = GATSBY_CONFIG;
