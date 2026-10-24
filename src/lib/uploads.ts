export const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
export type Upload = { path: string; buffer: Buffer; mime: string };

// Reconnaît le vrai type d'un fichier d'après son contenu (et non son nom).
export function sniff(b: Buffer): string | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (b.length > 5 && b.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

// Lit un fichier du formulaire. `basePath` : chemin sans extension (l'extension est déduite du contenu réel).
export async function readUpload(
  fd: FormData, key: string, basePath: string, allowPdf: boolean, maxBytes: number,
): Promise<{ ok: true; file: Upload | null } | { ok: false }> {
  const f = fd.get(key);
  if (!(f instanceof File) || f.size === 0) return { ok: true, file: null };
  if (f.size > maxBytes) return { ok: false };
  const buffer = Buffer.from(await f.arrayBuffer());
  const mime = sniff(buffer);
  if (!mime || (mime === "application/pdf" && !allowPdf)) return { ok: false };
  return { ok: true, file: { path: `${basePath}.${EXT[mime]}`, buffer, mime } };
}
