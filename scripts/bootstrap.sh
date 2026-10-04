#!/usr/bin/env bash

set -euo pipefail

export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:${PATH:-}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
NVM_INSTALL_URL="https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL "$NVM_INSTALL_URL" | bash
fi

# shellcheck disable=SC1090
# Do not let nvm select its global default before the repository's .nvmrc is read.
. "$NVM_DIR/nvm.sh" --no-use

cd "$REPO_ROOT"

nvm install
nvm use --delete-prefix

corepack enable
corepack yarn install
npx ocular-bootstrap
