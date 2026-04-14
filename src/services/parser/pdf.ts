import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pagesText: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const lines = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean);

    if (lines.length > 0) {
      pagesText.push(lines.join(" "));
    }
  }

  return normalizeText(pagesText.join("\n"));
}
