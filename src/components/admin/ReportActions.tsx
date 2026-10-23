"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost } from "@/lib/ui";

const NEXT: Record<string, { to: string; label: string }> = {
  received: { to: "in_review", label: "Mettre en examen" },
  in_review: { to: "closed", label: "Clore" },
  closed: { to: "in_review", label: "Rouvrir" },
};

export default function ReportActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const next = NEXT[status];
  if (!next) return null;

  async function advance() {
    setBusy(true);
    await fetch("/api/admin/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next.to }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <button type="button" className={`${btnGhost} !px-4 !py-1.5 text-sm`} disabled={busy} onClick={advance}>
      {next.label}
    </button>
  );
}
