import mammoth from 'mammoth'

/**
 * Extracts raw text from a DOCX buffer.
 * Uses mammoth (open source, no external API needed).
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}
