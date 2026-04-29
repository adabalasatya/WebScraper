export function extractAppId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.includes("play.google.com")) {
    try {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const id = url.searchParams.get("id");
      return id ? id.trim() : null;
    } catch {
      return null;
    }
  }

  // Treat as a raw appId. Reject obvious junk; appIds use reverse-DNS style
  // segments with letters, digits, underscores, separated by dots.
  if (/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
