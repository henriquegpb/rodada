/** Remove acentos e cedilha e passa para minúsculas: "Coração" → "coracao". */
export function normalize(word: string): string {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
