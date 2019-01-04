// TODO/ib - site config is not always set inside React components
// Evaluate whether we should completely drop in favor of graphgl siteMetadata queries
let siteConfig = {};

module.exports.setSiteConfig = function setSiteConfig(config) {
  siteConfig = config;
}

module.exports.getSiteConfig = function getSiteConfig() {
  return siteConfig;
}
