"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { btnGhost } from "@/lib/ui";

export default function CopyLinkButton() {
  const t = useTranslations("Profile");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className={btnGhost} onClick={copy}>
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
