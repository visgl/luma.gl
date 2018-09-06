#!/bin/sh
# Automated tests

set -e

BASEDIR=$(dirname "$0")

MODE=$1

run_lint() {
  npm run lint
  # markdownlint docs
}

run_full_test() {
  run_lint
  node test/start.js test
  node test/start.js test-browser
  # node test/start.js render
}

case $MODE in
  "")
    echo "test [ 'full' | fast' | 'bench' | 'ci' | 'cover' | 'examples' | 'lint' | size-es6' ]"
    echo "Running 'full' test by default"
    run_full_test;
    break;;

  "full")
    run_full_test;
    break;;

  "fast")
    node test/start.js fast
    break;;

  "bench")
    node test/start.js bench
    node test/start.js bench-browser
    break;;

  "ci")
    # run by Travis CI
    npm run build
    npm run cover
    npm run bench
    npm run collect-metrics
    break;;

  "cover")
    # Seems to need to be run from each package.json root...
    (cd $BASEDIR/../modules/core && NODE_ENV=test BABEL_ENV=cover npx nyc node $BASEDIR/../test/start.js cover)
    npx nyc report
    break;;

  "dist")
    npm run build
    node test/start.js test-dist
    break;;

  "examples")
    node test/node-examples.js
    break;;

  "lint")
    run_lint
    break;;

  "size-es6")
    npm run build
    NODE_ENV=production webpack --config test/webpack.config.js --env.import-nothing --env.es6
    break;;

  *)
    # default test
    node test/start.js $MODE
    break;;
  esac
