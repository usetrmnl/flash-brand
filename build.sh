#!/usr/bin/env bash
set -e

emcc g5_wasm.c \
  -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s ENVIRONMENT=web \
  -s EXPORT_NAME=G5Wasm \
  -s EXPORTED_FUNCTIONS="['_g5_encode_rgba_wasm','_malloc','_free']" \
  -s EXPORTED_RUNTIME_METHODS="['cwrap', 'getValue', 'setValue', 'HEAPU8', 'HEAPU32']" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=16777216 \
  -s MAXIMUM_MEMORY=268435456 \
  -s TOTAL_STACK=8388608 \
  -s FORCE_FILESYSTEM=1 \
  -s ASSERTIONS=1 \
  -s NO_EXIT_RUNTIME=1 \
  -o web/g5_wasm.js