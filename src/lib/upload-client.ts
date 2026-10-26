import { prepareFile } from "@/lib/image-client";

// Envoie une image vers l'espace public de HWENDOXI et retourne son chemin (« content/… »).
export async function uploadContentImage(file: File): Promise<string> {
  const prepared = await prepareFile(file);
  if (!prepared || prepared.type === "application/pdf") {
    throw new Error("Image refusée : utilisez un fichier JPG, PNG ou WebP.");
  }
  const fd = new FormData();
  fd.set("image", prepared, prepared.name);
  const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Envoi impossible. Reconnectez-vous ou réessayez.");
  return ((await res.json()) as { path: string }).path;
}
