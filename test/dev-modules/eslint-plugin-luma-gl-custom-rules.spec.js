import test from 'tape-promise/tape';
import customRulesPlugin from 'dev-modules/eslint-plugin-luma-gl-custom-rules/index.js';
import {RuleTester} from 'eslint';

const ruleTester = new RuleTester();
const {rules} = customRulesPlugin;

// TODO - RESTORE
test.skip('EslintCustomRules#check-log-call', (t) => {
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
