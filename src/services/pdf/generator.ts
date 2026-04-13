// src/services/pdf/generator.ts
// Renders the selected template to a PDF Buffer using @react-pdf/renderer.
// Called by the /cv/generate-pdf route handler.

import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { CvFormData } from '../../types/cv'
import { ClassicTemplate } from './templates/classic'
import { ModernTemplate }  from './templates/modern'
import { MinimalTemplate } from './templates/minimal'

export type TemplateId = 'classic' | 'modern' | 'minimal'

const TEMPLATES: Record<TemplateId, (data: CvFormData) => React.ReactElement> = {
  classic: (data) => React.createElement(ClassicTemplate, { data }),
  modern:  (data) => React.createElement(ModernTemplate,  { data }),
  minimal: (data) => React.createElement(MinimalTemplate, { data }),
}

export async function generateCvPdf(
  cvData: CvFormData,
  templateId: string
): Promise<Buffer> {
  const templateFn = TEMPLATES[templateId as TemplateId] ?? TEMPLATES.classic
  const element    = templateFn(cvData)
  const buffer     = await renderToBuffer(element)
  return Buffer.from(buffer)
}
