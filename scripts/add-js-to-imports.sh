#/bin/sh

echo '# Adding .js to import statements in dist folders'
find modules/*/dist -name "*.js" -exec sed -i '' "s/from '\.\(.*\)';/from '.\1.js';/" {} \;
find modules/*/dist -name "*.js" -exec sed -i '' "s/from '\.\(.*\)\.js\.js';/from '.\1';/" {} \;