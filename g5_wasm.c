#include <stdint.h>
#include <emscripten/emscripten.h>
#include <stdio.h>
#include <string.h>
#include "g5_imageconvert/weblib/weblib.c"

EMSCRIPTEN_KEEPALIVE
int g5_encode_rgba_wasm(
    const uint8_t *rgba,
    int width,
    int height,
    uint8_t *out,
    int outSize
) {
   return g5_encode_rgba( rgba, width, height, out, outSize);
}