#!/bin/sh
# Example:
# update-release-branch.sh 6.3

set -e

BRANCH=`echo "$1-release"`
VERSION=`echo "$1.0"`
WEBSITE_EXAMPLES=website/src/react-luma/components/luma-example.tsx

echo "Updating branch to ${BRANCH}..."

# Replace source links in docs
find docs -iname "*.md" -type f -exec sed -i '' -E "s/luma.gl\/(tree|blob)\/master\/modules/luma.gl\/tree\/${BRANCH}\/modules/g" {} \;
find docs -iname "*.md" -type f -exec sed -i '' -E "s/luma.gl\/(tree|blob)\/master\/examples/luma.gl\/tree\/${BRANCH}\/examples/g" {} \;

# Replace source links in website (second one is for raw.githubusercontent)
sed -i '' -E "s/luma.gl\/tree\/(master|[1-9]*.[0-9]-release)/luma.gl\/tree\/${BRANCH}/g" "${WEBSITE_EXAMPLES}"
sed -i '' -E "s/luma.gl\/(master|[1-9]*.[0-9]-release)/luma.gl\/${BRANCH}/g" "${WEBSITE_EXAMPLES}"

# Bump dependencies in examples
update_dep() {
  FILE=$1
  VERSION=$2
  cat $FILE | jq ".dependencies |= . + \
  with_entries(select(.key | match(\"@?luma.gl\")) | .value |= \"^${VERSION}\")" > temp
  mv temp $FILE
}

# https://stackoverflow.com/questions/4321456/find-exec-a-shell-function-in-linux
export -f update_dep
find examples/*/*/package.json -exec bash -c 'update_dep "$0" $1' {} $VERSION \;
