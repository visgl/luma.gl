// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const {resolve} = require('path');

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
    // Examples
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          sidebarPath: require.resolve('./content/sidebars.js'),
          // lastVersion: '9.0',
          // versions: {
          //   '9.0': {banner: 'none'}
          // },
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
      '@docusaurus/plugin-content-docs',
      {
        id: 'examples',
        path: './content/examples',
        routeBasePath: 'examples',
        sidebarPath: resolve('./content/sidebar-examples.js'),
        breadcrumbs: false,
        docItemComponent: resolve('./src/examples/components/doc-item-component.tsx')
      }
    ],
    [
      './src/ocular-docusaurus/ocular-docusaurus-plugin',
      {alias: {
          '@luma.gl/core': `${__dirname}/../modules/api/src`,
          '@luma.gl/core': `${__dirname}/../modules/core/src`,
          '@luma.gl/engine': `${__dirname}/../modules/engine/src`,
          '@luma.gl/experimental': `${__dirname}/../modules/experimental/src`,
          '@luma.gl/shadertools': `${__dirname}/../modules/shadertools/src`,
          '@luma.gl/test-utils': `${__dirname}/../modules/test-utils/src`,
          '@luma.gl/webgl': `${__dirname}/../modules/webgl/src`,
          '@luma.gl/webgpu': `${__dirname}/../modules/webgpu/src`,
          // deprecated modules
          '@luma.gl/constants': `${__dirname}/../modules/constants/src`
      }}
    ],
    [
      require.resolve('@cmfcmf/docusaurus-search-local'),
      {
        // Options here
      }
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          // docs/getting-started/*/api-reference <= /docs/tutorials
          if (existingPath.includes('/docs/getting-started/')) {
            return [
              existingPath
                .replace('/docs/getting-started/', '/docs/tutorials/')
            ];
          }
            
            // docs/modules/*/api-reference <= modules/*/docs/api-reference
          if (existingPath.includes('/docs/modules/')) {
            return [
              existingPath
                .replace('/docs/modules/', '/modules/')
                // Replaces api-reference if present
                .replace('/api-reference/', '/docs/api-reference/')
            ];
          }
          return undefined; // Return a falsy value: no redirect created
        }
      }
    ]
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
            to: '/examples',
            position: 'left',
            label: 'Examples',
          },
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
        copyright: `Copyright © ${new Date().getFullYear()} OpenJS Foundation`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
