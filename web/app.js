const wasm = await G5Wasm();

if (!wasm.HEAPU8) {
  throw new Error("WASM not initialized correctly");
}

const encode = wasm.cwrap('g5_encode_rgba_wasm', 'number', ['number','number','number','number','number']);

window.encodePNG = async function (file) {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const data = new Uint8Array(imageData.data.buffer);
  const inPtr = wasm._malloc(data.length);
  if (!inPtr) {
    throw new Error(`Failed to allocate ${data.length} bytes for input`);
  }

  wasm.HEAPU8.set(data, inPtr);

  const firstByte = wasm.HEAPU8[inPtr];

  const outMax = Math.max(1024 * 1024, img.width * img.height); // Conservative estimate
  const outPtr = wasm._malloc(outMax);
  const size = encode(inPtr, img.width, img.height, outPtr, outMax);
  const result = wasm.HEAPU8.slice(outPtr, outPtr + size);

  wasm._free(inPtr);
  wasm._free(outPtr);

  return result;
};

function downloadBinaryFile(data, filename) {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function combineLogoAndLoader() {
  const logo = document.getElementById('logo-input');
  const loader = document.getElementById('loader-input');
  const logoBinary = await encodePNG(logo.files[0]);
  downloadBinaryFile(logoBinary, 'logo.g')
  const loaderBinary = await encodePNG(loader.files[0]);
  downloadBinaryFile(loaderBinary, 'loader.g')

  const totalLength = logoBinary.length + loaderBinary.length;
  const combined = new Uint8Array(totalLength);
  combined.set(logoBinary, 0);
  combined.set(loaderBinary, logoBinary.length);
  downloadBinaryFile(combined, 'browser.bin')
  return new Blob([combined], { type: 'application/octet-stream' });
}