- The code is divided into modules in the modules/ directory that each have a src and test folder.
- modules/core/src contains the general API and tests should be written in modules/core/tests.
- The webgl and webgpu folders contain implementations of the general API, that will actually run during the tests,
but the tests do not need to be aware of that.
- The documentation is in markdown in the docs folder, with each modules reference docs in docs/api-reference/<module-name>