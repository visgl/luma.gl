require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx']
});
require('./dev-modules');
require('./modules');
