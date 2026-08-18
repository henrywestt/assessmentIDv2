export function makeSlug(clientName: string) {
  const base = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "client";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function makePassword() {
  const words = ["harbour","cobalt","ember","atlas","meridian","quartz",
                 "lantern","summit","drift","vellum","onyx","cadence"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${pick()}-${Math.floor(Math.random() * 90 + 10)}`;
}
