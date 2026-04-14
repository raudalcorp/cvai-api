// src/services/pdf/generator.ts
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { CvFormData } from "../../types/cv-types";
import { ClassicTemplate } from "./templates/classic";
import { ModernTemplate } from "./templates/modern";
import { MinimalTemplate } from "./templates/minimal";

export type TemplateId = "classic" | "modern" | "minimal";

const TEMPLATES: Record<TemplateId, (data: CvFormData) => React.ReactElement> =
  {
    classic: (data) => React.createElement(ClassicTemplate, { data }),
    modern: (data) => React.createElement(ModernTemplate, { data }),
    minimal: (data) => React.createElement(MinimalTemplate, { data }),
  };

export async function generateCvPdf(
  cvData: CvFormData,
  templateId: string,
): Promise<Buffer> {
  const templateFn = TEMPLATES[templateId as TemplateId] ?? TEMPLATES.classic;
  const element = templateFn(cvData);

  // Cast needed: @react-pdf/renderer's typings for renderToBuffer are stricter
  // than what React.createElement returns generically. The call is valid at runtime.
  const buffer = await renderToBuffer(element as React.ReactElement<any>);
  return Buffer.from(buffer);
}
