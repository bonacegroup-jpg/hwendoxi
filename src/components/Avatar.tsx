import Image from "next/image";

// Photo de profil (si publiée) ou initiales du nom affiché.
export default function Avatar({ name, photoUrl, size = 48 }: { name: string; photoUrl: string | null; size?: number }) {
  const box = { width: size, height: size };
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={size * 2}
        height={size * 2}
        style={box}
        className="shrink-0 rounded-full border-2 border-gold object-cover"
      />
    );
  }
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{ ...box, fontSize: Math.round(size / 3) }}
      className="grid shrink-0 place-items-center rounded-full border-2 border-gold bg-sand font-serif font-bold text-gold-dark"
    >
      {initials}
    </div>
  );
}
