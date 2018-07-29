#!/bin/sh
# Script to collect build size information

export PATH=$PATH:node_modules/.bin

# Get name from package.json
module=$(jq '.name' ./modules/core/package.json)
# Get version from packag.json and remove quotes
version=$(jq '.version' ./modules/core/package.json | awk '{ gsub(/"/,"",$1); printf "%-14s", $1 }')

# Helper functions

print_size_header() {
  echo "| Version        | Dist           | Bundle (Compr) | Bytes (Compressed)   |"
  echo "| ---            | ---            | ---            | ---                  |"
}

print_size() {
  DIST=$1
  BUILD=$2

  # Size it
  BYTES_UNCOMPRESSED=$(wc -c /tmp/bundle.js)

  # Zip and size it
  gzip -9f /tmp/bundle.js
  BYTES_COMPRESSED=$(wc -c /tmp/bundle.js.gz)
  rm /tmp/bundle.js.gz

  size=$(echo $BYTES_UNCOMPRESSED $BYTES_COMPRESSED | awk '{ print int($1 / 1024) "KB / " int($3/ 1024K) "KB" }')
  zipsize=$(echo $BYTES_UNCOMPRESSED $BYTES_COMPRESSED | awk '{ print $1 " / " $3 " bytes" }')  # Size it
  # Print version, size, compressed size with markdown

  echo "| $version | $DIST-$BUILD | $size   | $zipsize |"
}

build_bundle() {
  ENV=$1
  DEVELOPMENT=$2
  NODE_ENV=production webpack --config test/webpack.config.js --hide-modules --env.import-nothing --env.bundle --env.$ENV --env.$DEVELOPMENT> /dev/null

  print_size $ENV $DEVELOPMENT
}

# Main Script

echo
echo "\033[1mAutomatically collecting metrics for $module"
echo

print_size_header

build_bundle es6 production
build_bundle esm production
build_bundle es5 production

build_bundle es6 development
build_bundle esm development
build_bundle es5 development

# Disable bold terminal font
echo "\033[0m"
