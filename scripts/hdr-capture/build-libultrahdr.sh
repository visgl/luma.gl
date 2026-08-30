#!/usr/bin/env bash

set -euo pipefail

LIBULTRAHDR_VERSION="v1.5.1"
LIBULTRAHDR_COMMIT="a8166d65171aef43cb4bc211538ee6619a9af680"
LIBULTRAHDR_REPOSITORY="https://github.com/google/libultrahdr.git"

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIRECTORY}/../.." && pwd)"
CACHE_ROOT="${HDR_CAPTURE_CACHE_DIR:-${REPOSITORY_ROOT}/.cache/hdr-capture}"
INSTALL_DIRECTORY="${CACHE_ROOT}/libultrahdr-${LIBULTRAHDR_VERSION}"
SOURCE_DIRECTORY="${INSTALL_DIRECTORY}/source"
BUILD_DIRECTORY="${INSTALL_DIRECTORY}/build"

for required_command in git cmake; do
  if ! command -v "${required_command}" >/dev/null 2>&1; then
    printf 'Required command is not installed: %s\n' "${required_command}" >&2
    exit 1
  fi
done

mkdir -p "${INSTALL_DIRECTORY}"

if [[ ! -d "${SOURCE_DIRECTORY}/.git" ]]; then
  if [[ -e "${SOURCE_DIRECTORY}" ]]; then
    printf 'Refusing to replace non-git source path: %s\n' "${SOURCE_DIRECTORY}" >&2
    exit 1
  fi
  git clone --filter=blob:none --no-checkout "${LIBULTRAHDR_REPOSITORY}" "${SOURCE_DIRECTORY}"
  git -C "${SOURCE_DIRECTORY}" fetch --depth 1 origin "${LIBULTRAHDR_COMMIT}"
  git -C "${SOURCE_DIRECTORY}" checkout --detach "${LIBULTRAHDR_COMMIT}"
fi

ACTUAL_COMMIT="$(git -C "${SOURCE_DIRECTORY}" rev-parse HEAD)"
if [[ "${ACTUAL_COMMIT}" != "${LIBULTRAHDR_COMMIT}" ]]; then
  printf 'Pinned source mismatch in %s\n' "${SOURCE_DIRECTORY}" >&2
  printf 'Expected %s (%s), found %s\n' \
    "${LIBULTRAHDR_COMMIT}" "${LIBULTRAHDR_VERSION}" "${ACTUAL_COMMIT}" >&2
  exit 1
fi

cmake \
  -S "${SOURCE_DIRECTORY}" \
  -B "${BUILD_DIRECTORY}" \
  -DCMAKE_BUILD_TYPE=Release \
  -DUHDR_BUILD_DEPS=ON \
  -DUHDR_BUILD_EXAMPLES=ON \
  -DUHDR_BUILD_TESTS=OFF \
  -DUHDR_ENABLE_GLES=OFF \
  -DUHDR_WRITE_ISO=ON \
  -DUHDR_WRITE_XMP=ON

cmake --build "${BUILD_DIRECTORY}" --config Release --target ultrahdr_app

if [[ -x "${BUILD_DIRECTORY}/ultrahdr_app" ]]; then
  ULTRAHDR_APP_PATH="${BUILD_DIRECTORY}/ultrahdr_app"
elif [[ -x "${BUILD_DIRECTORY}/Release/ultrahdr_app.exe" ]]; then
  ULTRAHDR_APP_PATH="${BUILD_DIRECTORY}/Release/ultrahdr_app.exe"
elif [[ -x "${BUILD_DIRECTORY}/ultrahdr_app.exe" ]]; then
  ULTRAHDR_APP_PATH="${BUILD_DIRECTORY}/ultrahdr_app.exe"
else
  printf 'Build completed but ultrahdr_app was not found under %s\n' "${BUILD_DIRECTORY}" >&2
  exit 1
fi

printf 'Built libultrahdr %s with ISO and XMP metadata enabled.\n' "${LIBULTRAHDR_VERSION}"
printf 'ultrahdr_app: %s\n' "${ULTRAHDR_APP_PATH}"
