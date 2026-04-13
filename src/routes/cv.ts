import { generateCvPdf } from "../services/pdf/generator";
import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { extractTextFromPdf } from "../services/parser/pdf.ts";
import { extractTextFromDocx } from "../services/parser/docx.ts";
import { structureCvText } from "../services/ai/cv-structurer.ts";
import type { CvFormData } from "../types/cv-types"; 

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Solo PDF y DOCX."));
  },
});

// ── POST /cv/parse ────────────────────────────────────────────
router.post(
  "/parse",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    const type = req.body.type as "pdf" | "docx" | undefined;
    const userId = req.headers["x-user-id"] as string | undefined;

    if (!file) {
      res.status(400).json({ error: "No se recibió ningún archivo." });
      return;
    }
    if (!type || !["pdf", "docx"].includes(type)) {
      res.status(400).json({ error: '"type" debe ser "pdf" o "docx".' });
      return;
    }

    console.log(`[cv/parse] user=${userId} type=${type} size=${file.size}B`);

    try {
      const rawText =
        type === "pdf"
          ? await extractTextFromPdf(file.buffer)
          : await extractTextFromDocx(file.buffer);

      if (!rawText || rawText.length < 50) {
        res
          .status(422)
          .json({ error: "No se pudo extraer texto del archivo." });
        return;
      }

      const structured = await structureCvText(rawText);
      res.json(structured);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error interno.";
      console.error("[cv/parse] Error:", message);
      res.status(500).json({ error: message });
    }
  },
);

// ── POST /cv/generate-pdf ─────────────────────────────────────
router.post("/generate-pdf", async (req: Request, res: Response) => {
  const { cvData, templateId } = req.body as {
    cvData: CvFormData;
    templateId: string;
  };
  const userId = req.headers["x-user-id"] as string | undefined;

  if (!cvData || !templateId) {
    res.status(400).json({ error: "cvData y templateId son requeridos." });
    return;
  }

  console.log(`[cv/generate-pdf] user=${userId} template=${templateId}`);

  try {
    const pdfBuffer = await generateCvPdf(cvData, templateId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error generando el PDF.";
    console.error("[cv/generate-pdf] Error:", message);
    res.status(500).json({ error: message });
  }
});

// ── GET /cv/health ────────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
