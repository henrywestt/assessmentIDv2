import type { ReactNode } from "react";

// Parses only **bold** and *italic* into React elements; everything else is
// plain text passed through as JSX children, so it's escaped by React the
// normal way. No HTML parsing, no dangerouslySetInnerHTML, no contentEditable.
function parse(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={key++}>{m[1]}</strong>);
    else if (m[2] !== undefined) nodes.push(<em key={key++}>{m[2]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function Formatted({ text }: { text: string }) {
  return <>{parse(text)}</>;
}
