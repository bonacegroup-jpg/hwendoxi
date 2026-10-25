import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Identifiant anonymisé du visiteur (adresse IP hachée : l'adresse elle-même n'est jamais enregistrée).
function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`hwendoxi:${ip}`).digest("hex").slice(0, 32);
}

// Retourne true si l'action est autorisée, false si le visiteur a dépassé le nombre d'essais permis
// (max essais par fenêtre de windowSeconds secondes). En cas de panne du dispositif, on laisse passer.
export async function rateLimit(request: NextRequest, action: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_check", {
      p_action: action,
      p_key: clientKey(request),
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("Limitation d'essais :", error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.error("Limitation d'essais :", e);
    return true;
  }
}
