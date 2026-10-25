// Extrait l'identifiant (11 caractères) d'une adresse YouTube : watch?v=…, youtu.be/…, /embed/…, /shorts/…
const ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  try {
    const u = new URL(value);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    let candidate: string | null = null;
    if (host === "youtu.be") candidate = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") candidate = u.searchParams.get("v");
      else {
        const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
        candidate = m ? m[1] : null;
      }
    }
    return candidate && ID.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}
