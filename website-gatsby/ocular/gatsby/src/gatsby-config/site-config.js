// TODO/ib - site config is not always set inside React components
// Evaluate whether we should completely drop in favor of graphgl siteMetadata queries
let siteConfig = {};

export function setSiteConfig(config) {
  siteConfig = config;
}

export function getSiteConfig() {
  return siteConfig;
}
