const DEMOS = require('./src/demos.json');

module.exports = {
  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../`,

  DEMOS,

  webpack: {
    resolve: {
      alias: {
        // Avoid picking up local node_modules in the examples
        'math.gl': `${__dirname}/../node_modules/math.gl`,
        'luma.gl': `${__dirname}/../node_modules/luma.gl`
      }
    }
  },

  // TODO/ib - from gatsby example, clean up
  siteTitle: "luma.gl", // Site title.
  siteTitleShort: "GA Starter", // Short site title for homescreen (PWA). Preferably should be under 12 characters to prevent truncation.
  siteTitleAlt: "luma.gl", // Alternative site title for SEO.
  siteLogo: "/logos/logo-1024.png", // Logo used for SEO and manifest.
  siteUrl: "https://vagr9k.github.io", // Domain of your website without pathPrefix.
  pathPrefix: "/luma", // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  siteDescription: "WebGL2 Components", // Website description used for RSS feeds/meta description tag.
  siteRss: "/rss.xml", // Path to the RSS file.
  siteFBAppID: "1825356251115265", // FB Application ID for using app insights
  googleAnalyticsID: "UA-47311644-5", // GA tracking ID.
  disqusShortname: "luma.gl",
  dateFromFormat: "YYYY-MM-DD", // Date format used in the frontmatter.
  dateFormat: "DD/MM/YYYY", // Date format for display.
  userName: "WebGL User", // Username to display in the author segment.
  userTwitter: "", // Optionally renders "Follow Me" in the UserInfo segment.
  userLocation: "San Francisco", // User location to display in the author segment.
  userAvatar: "https://api.adorable.io/avatars/150/test.png", // User avatar to display in the author segment.
  userDescription:
    "Performance and Advanced Rendering Techniques.", // User description to display in the author segment.
  // Links to social profiles/projects you want to display in the author segment/navigation bar.
  userLinks: [
    {
      label: "GitHub",
      url: "https://github.com/uber/luma.gl",
      iconClassName: "fa fa-github"
    }
  ],
  copyright: "Copyright © 2017 Uber. MIT Licensed", // Copyright string for the footer of the website and RSS feed.
  themeColor: "#c62828", // Used for setting manifest and progress theme colors.
  backgroundColor: "#e0e0e0", // Used for setting manifest background color.

  // TODO/ib - from ocular, deduplicate with above settings
  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'luma.gl',
  PROJECT_ORG: 'uber',
  PROJECT_URL: `https://github.com/uber/luma.gl`,
  PROJECT_DESC: 'JavaScript Components for WebGL 2',

  PROJECTS: {},

  HOME_HEADING:
    'High-performance WebGL2 components for GPU-powered data visualization and computation.',

  HOME_RIGHT: null,

  HOME_BULLETS: [{
    text: 'Advanced GPU Usage',
    desc: 'Simplifies advanced GPU techniques, e.g. Instanced Rendering and Transform Feedback',
    img: 'icons/icon-react.svg'
  }, {
    text: 'Shader Programming Power',
    desc: 'Modularized shader code, classes for controlling GPU inputs and outputs, and support for debugging and profiling of GLSL shaders.',
    img: 'icons/icon-layers.svg'
  }, {
    text: 'Performance Focus',
    desc: 'Enables visualization and GPU processing of very large data sets.',
    img: 'icons/icon-high-precision.svg'
  }],

  ADDITIONAL_LINKS: []
};
