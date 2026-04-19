// Keeps: tab, LF, CR, printable ASCII, Latin Extended (covers Portuguese/Spanish/French accents).
// Strips: emojis, CJK, special Unicode, zero-width chars, control chars, etc.
export function sanitizeMarkdownInput(text: string, maxLength = 2000): string {
  return text
    .replace(/[^\t\n\r\x20-\x7E\u00A0-\u024F]/g, "")
    .slice(0, maxLength);
}
