declare module "qrcode" {
  const QRCode: {
    toDataURL(text: string, options?: Record<string, unknown>): Promise<string>;
  };
  export default QRCode;
}

declare module "jsqr" {
  export type QRCode = { data: string };
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: Record<string, unknown>
  ): QRCode | null;
}
