// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'luma.gl',
  tagline: 'Web GPU APIs',
  url: 'https://luma.gl',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  organizationName: 'visgl', // Usually your GitHub org/user name.
  projectName: 'luma.gl', // Usually your repo name.

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/visgl/luma.gl/tree/main/docs',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      './src/plugins/ocular-docusaurus-plugin',
      {alias: {
          '@luma.gl/api': `${__dirname}/../modules/api/src`,
          '@luma.gl/core': `${__dirname}/../modules/core/src`,
          '@luma.gl/debug': `${__dirname}/../modules/debug/src`,
          '@luma.gl/engine': `${__dirname}/../modules/engine/src`,
          '@luma.gl/experimental': `${__dirname}/../modules/experimental/src`,
          '@luma.gl/shadertools': `${__dirname}/../modules/shadertools/src`,
          '@luma.gl/test-utils': `${__dirname}/../modules/test-utils/src`,
          '@luma.gl/webgl': `${__dirname}/../modules/webgl/src`,
          '@luma.gl/webgpu': `${__dirname}/../modules/webgpu/src`,
          // deprecated modules
          '@luma.gl/constants': `${__dirname}/../modules/constants/src`,
          '@luma.gl/webgl-legacy': `${__dirname}/../modules/webgl-legacy/src`,
          // removed (empty) modules
          '@luma.gl/gltools': `${__dirname}/../modules/gltools/src`,
      }}
    ],
    // [
    //   '@docusaurus/plugin-client-redirects',
    //   {
    //     fromExtensions: ['md', 'htm'], // /myPage.html -> /myPage
    //     toExtensions: ['exe', 'zip'], // /myAsset -> /myAsset.zip (if latter exists)
    //     redirects: [
    //       // /docs/oldDoc -> /docs/newDoc
    //       {
    //         to: '/docs/api-reference/api/resources/texture',
    //         from: '/docs/texture-',
    //       },
    //       // Redirect from multiple old paths to the new path
    //       {
    //         to: '/docs/newDoc2',
    //         from: ['/docs/oldDocFrom2019', '/docs/legacyDocFrom2016'],
    //       },
    //     ],
    //     createRedirects(existingPath) {
    //       if (existingPath.includes('/community')) {
    //         // Redirect from /docs/team/X to /community/X and /docs/support/X to /community/X
    //         return [
    //           existingPath.replace('/community', '/docs/team'),
    //           existingPath.replace('/community', '/docs/support'),
    //         ];
    //       }
    //       return undefined; // Return a falsy value: no redirect created
    //     },
    //   },
    // ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'luma.gl',
        logo: {
          alt: 'vis.gl Logo',
          src: 'img/favicon.png',
        },
        items: [
          {
            to: '/docs',
            position: 'left',
            label: 'Docs',
          },
          {
            to: '/docs/getting-started',
            position: 'left',
            label: 'Tutorial',
          },
          {to: 'https://medium.com/vis-gl', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/visgl/luma.gl',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '../docs',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Slack workspace',
                href: 'https://join.slack.com/t/deckgl/shared_invite/zt-7oeoqie8-NQqzSp5SLTFMDeNSPxi7eg',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'vis.gl blog (Medium)',
                href: 'https://medium.com/vis-gl',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/visgl/luma.gl',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Urban Computing Foundation`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
