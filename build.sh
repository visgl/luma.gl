cd build/
rm LumaGL.zip
node build.js > LumaGL.js
java -jar compiler.jar --js LumaGL.js --js_output_file LumaGL.cls.js
cd ../
git archive --format zip --output ./build/LumaGL.zip master 

