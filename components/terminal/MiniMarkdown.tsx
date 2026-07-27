import { Fragment, type ReactNode } from "react";

/** Tiny markdown renderer for analyst answers. Models naturally emit **bold**,
 *  ### headings and bullets; rendering them beats fighting it in the prompt.
 *  Deliberately minimal — no dependency, no raw HTML, so nothing can inject. */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // **bold** and `code`
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyBase}-b${i++}`} className="font-semibold text-fg">
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      out.push(
        <code
          key={`${keyBase}-c${i++}`}
          className="tabular rounded bg-panel-2 px-1 py-px text-[11px] text-lime"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flush = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key} className="my-1.5 space-y-1 pl-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-fg-muted">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-lime/70" />
            <span>{inline(b, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[*-]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flush(`ul-${idx}`);

    if (!line.trim()) return;

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push(
        <h4 key={idx} className="mt-3 text-[13px] font-bold text-fg first:mt-0">
          {inline(heading[2], `h-${idx}`)}
        </h4>
      );
      return;
    }

    blocks.push(
      <p key={idx} className="my-1.5 text-sm leading-relaxed text-fg first:mt-0">
        {inline(line, `p-${idx}`)}
      </p>
    );
  });
  flush("ul-end");

  return <Fragment>{blocks}</Fragment>;
}
