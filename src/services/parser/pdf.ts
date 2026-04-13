const pdfParse = require("pdf-parse") as unknown as (
  buffer: Buffer,
) => Promise<{ text: string; numpages: number }>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}
