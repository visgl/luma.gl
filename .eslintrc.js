module.exports = {
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ['uber-es2015', 'prettier', 'plugin:import/errors'],
  plugins: ['tree-shaking', 'luma-gl-custom-rules', 'import'],
  rules: {
    'guard-for-in': 0,
    'no-inline-comments': 0,
    camelcase: 0,
    'max-statements': 0,
    'luma-gl-custom-rules/check-log-call': 1,
    'import/no-unresolved': ['error'],
    'import/no-extraneous-dependencies': [
      'error',
      {devDependencies: false, peerDependencies: true}
    ],
    // Turn on to help debug tree-shaking issues
    'tree-shaking/no-side-effects-in-initialization': 0
  },
  overrides: [
    // tests are run with aliases set up in node and webpack.
    // This means lint will not find the imported files and generate false warnings
    {
      files: ['**/test/**/*.js'],
      rules: {
        'import/no-unresolved': 0,
        'import/no-extraneous-dependencies': 0
      }
    },
    // scripts use devDependencies
    {
      files: ['**/scripts/**/*.js'],
      rules: {
        'import/no-unresolved': 0,
        'import/no-extraneous-dependencies': 0
      }
    }
  ]
};
