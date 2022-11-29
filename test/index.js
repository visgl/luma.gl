require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx']
});
require('./setup');
require('./dev-modules');
require('./modules');
