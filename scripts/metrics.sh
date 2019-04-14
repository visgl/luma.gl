#/bin/sh

echo '# Minified Scripts'
find modules -name dist.min.js | while read file; do
    ls -S -lh "$file" | awk '{print $5, $9}'
done

echo '# Worker sizes'
find modules -name "*-loader.worker.js" | grep -v src | while read file; do
    ls -S -lh "$file" | awk '{print $5, $9}'
done
