import "server-only";
import QRCode from "qrcode";

/** A PNG data URL react-pdf's <Image> can consume directly. */
export async function buildListingQrCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 240,
    color: { dark: "#111b33", light: "#ffffffff" },
  });
}
