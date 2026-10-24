// Réduit les images (photos de téléphone) avant l'envoi ; refuse les fichiers trop lourds ou non pris en charge.
export async function prepareFile(file: File, maxImageBytes = 1_500_000): Promise<File | null> {
  if (file.type === "application/pdf") return file.size <= 2_500_000 ? file : null;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return null;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file.size <= maxImageBytes ? file : null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.8));
    return blob ? new File([blob], "image.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return file.size <= maxImageBytes ? file : null;
  }
}
