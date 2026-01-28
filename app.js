const wasm = await G5Wasm();

if (!wasm.HEAPU8) {
  throw new Error("WASM not initialized correctly");
}

const encode = wasm.cwrap('g5_encode_rgba_wasm', 'number', ['number','number','number','number','number']);

// typedef struct theBrand {
//   char name[16];
//   char api_url[128];
//   uint8_t u8Images[3952];
// } Brand;

const NAME_SIZE = 16;
const URL_SIZE = 128;
const IMAGES_SIZE = 3952;
const TOTAL_SIZE = NAME_SIZE + URL_SIZE + IMAGES_SIZE;

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

export async function createBinary(logoFile, loaderFile) {
  const BRAND_NAME = "TRMNL";
  const API_URL = "https://trmnl.app";

  const logoBinary = await encodePNG(logoFile);
  const loaderBinary = await encodePNG(loaderFile);

  const totalLength = logoBinary.length + loaderBinary.length;
  if (totalLength > IMAGES_SIZE) {
    throw new Error(`Combined images (${totalLength} bytes) exceed maximum size (${IMAGES_SIZE} bytes)`);
  }

  const brandStruct = new Uint8Array(TOTAL_SIZE); // 4096 bytes (4 kilobyte)
  const nameBytes = new TextEncoder().encode(BRAND_NAME);
  brandStruct.set(nameBytes.slice(0, NAME_SIZE), 0);
  const urlBytes = new TextEncoder().encode(API_URL);
  brandStruct.set(urlBytes.slice(0, URL_SIZE), NAME_SIZE);

  brandStruct.set(logoBinary, NAME_SIZE + URL_SIZE);
  brandStruct.set(loaderBinary, NAME_SIZE + URL_SIZE + logoBinary.length);

  // downloadBinaryFile(brandStruct, 'brand.bin')

  return new Blob([brandStruct], { type: 'application/octet-stream' });
}