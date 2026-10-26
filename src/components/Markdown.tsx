import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import { publicMediaUrl } from "@/lib/media";

// Affichage d'un texte rédigé avec l'éditeur de HWENDOXI (format texte simple).
// Aucun HTML brut n'est interprété : le rendu est entièrement construit ici, donc sûr.
//   ## Titre    ### Sous-titre    **gras**    *italique*    [texte](https://adresse)
//   - liste    1. liste numérotée    > citation    ---    ![légende](content/image.jpg)

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/g;

function inline(text: string, base: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${base}-${i}`;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={key}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      return /^https?:\/\//i.test(link[2]) ? (
        <a key={key} href={link[2]} rel="noopener noreferrer" className="text-gold-dark underline">{link[1]}</a>
      ) : (
        <Fragment key={key}>{link[1]}</Fragment>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

const RE_HEADING = /^(#{1,3})\s+(.+)$/;
const RE_IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const RE_HR = /^-{3,}$/;
const RE_UL = /^[-*]\s+(.+)$/;
const RE_OL = /^\d+\.\s+(.+)$/;
const RE_QUOTE = /^>\s?(.*)$/;
const isSpecial = (t: string) => RE_HEADING.test(t) || RE_IMAGE.test(t) || RE_HR.test(t) || RE_UL.test(t) || RE_OL.test(t) || RE_QUOTE.test(t);

export default function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let n = 0;

  while (i < lines.length) {
    const t = lines[i].trim();
    const key = `b${n++}`;
    if (!t) {
      i++;
      continue;
    }

    const heading = t.match(RE_HEADING);
    if (heading) {
      const content = inline(heading[2], key);
      out.push(
        heading[1].length === 3
          ? <h3 key={key} className="mt-6 font-serif text-xl font-bold">{content}</h3>
          : <h2 key={key} className="mt-8 font-serif text-2xl font-bold">{content}</h2>,
      );
      i++;
      continue;
    }

    const image = t.match(RE_IMAGE);
    if (image) {
      const url = publicMediaUrl(image[2]);
      if (url) {
        out.push(
          <figure key={key} className="my-6">
            <Image src={url} alt={image[1]} width={1200} height={800} sizes="(min-width: 768px) 768px, 100vw" className="h-auto w-full rounded-xl border border-line" />
            {image[1] && <figcaption className="mt-2 text-center text-sm text-muted">{image[1]}</figcaption>}
          </figure>,
        );
      }
      i++;
      continue;
    }

    if (RE_HR.test(t)) {
      out.push(<hr key={key} className="my-8 border-line" />);
      i++;
      continue;
    }

    if (RE_UL.test(t) || RE_OL.test(t)) {
      const ordered = RE_OL.test(t);
      const re = ordered ? RE_OL : RE_UL;
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(re);
        if (!m) break;
        items.push(<li key={`${key}-${items.length}`}>{inline(m[1], `${key}-${items.length}`)}</li>);
        i++;
      }
      out.push(
        ordered
          ? <ol key={key} className="my-4 list-decimal space-y-1 pl-6">{items}</ol>
          : <ul key={key} className="my-4 list-disc space-y-1 pl-6">{items}</ul>,
      );
      continue;
    }

    if (RE_QUOTE.test(t)) {
      const quoted: string[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(RE_QUOTE);
        if (!m) break;
        quoted.push(m[1]);
        i++;
      }
      out.push(<blockquote key={key} className="my-6 border-l-4 border-gold pl-4 italic text-muted">{inline(quoted.join(" "), key)}</blockquote>);
      continue;
    }

    // Paragraphe : les lignes consécutives sont conservées avec leurs retours à la ligne
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l || (para.length > 0 && isSpecial(l))) break;
      para.push(l);
      i++;
    }
    out.push(
      <p key={key} className="my-4 leading-relaxed">
        {para.map((l, k) => (
          <Fragment key={`${key}-${k}`}>
            {k > 0 && <br />}
            {inline(l, `${key}-${k}`)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div>{out}</div>;
}
