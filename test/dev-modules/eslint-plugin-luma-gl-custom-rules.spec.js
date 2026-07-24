import test from '@luma.gl/devtools-extensions/tape-test-utils';

// TODO - RESTORE
test.skip('EslintCustomRules#check-log-call', async t => {
  const [{default: customRulesPlugin}, {RuleTester}] = await Promise.all([
    import('../../dev-modules/eslint-plugin-luma-gl-custom-rules/index.cjs'),
    import('eslint')
  ]);
  const ruleTester = new RuleTester();
  const {rules} = customRulesPlugin;
  ruleTester.run('check-log-call', rules['check-log-call'], {
    valid: ['log.log(1, "initialized")();', 'log.assert(gl, "error");', 'someObject.method();'],
    invalid: [
      {
        code: 'log.error("error");',
        errors: [
          {
            line: 1
          }
        ],
        output: 'log.error("error")();'
      }
    ]
  });

  t.end();
});
