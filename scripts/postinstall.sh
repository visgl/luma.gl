# Fix webgl-debug syntax error that blocks browser test
sed -i.bak 's/^WebGLDebugUtils =/var WebGLDebugUtils =/' node_modules/webgl-debug/index.js
