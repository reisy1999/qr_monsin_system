import QRCode from 'qrcode';

export async function generateQrFromEncrypted(
  encryptedData: Uint8Array,
  canvasEl: HTMLCanvasElement
) {
  const b64 = btoa(String.fromCharCode(...encryptedData));
  await QRCode.toCanvas(canvasEl, b64, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
  });
}
