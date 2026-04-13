// src/services/pdf/templates/classic.tsx
// Plantilla "Clásico" — una columna, header azul, ATS-friendly.
// Usa @react-pdf/renderer que corre 100% en Node.js server-side.

import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'
import type { CvFormData } from '../../../types/cv'

// ─── Styles ───────────────────────────────────────
const C = {
  accent:  '#1e40af',
  text:    '#1e293b',
  subtle:  '#475569',
  muted:   '#94a3b8',
  border:  '#e2e8f0',
  white:   '#ffffff',
}

const s = StyleSheet.create({
  page:       { fontFamily: 'Helvetica', fontSize: 9, color: C.text, padding: '36pt 40pt' },
  header:     { backgroundColor: C.accent, margin: '-36pt -40pt 20pt', padding: '28pt 40pt 20pt', color: C.white },
  name:       { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4, letterSpacing: 0.5 },
  jobTitle:   { fontSize: 11, opacity: 0.88, marginBottom: 8 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, fontSize: 8, opacity: 0.85 },
  contactItem:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  // Section
  section:    { marginBottom: 14 },
  sectionHdr: { borderBottom: `1.5pt solid ${C.border}`, paddingBottom: 3, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  sectionTitle:{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  // Experience
  expHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  expPos:     { fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  expDate:    { fontSize: 8, color: C.subtle },
  expCompany: { fontSize: 8.5, color: C.subtle, marginBottom: 4 },
  expTask:    { fontSize: 8.2, color: C.text, lineHeight: 1.5, marginBottom: 1 },
  // Skills
  skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  skillChip:  { backgroundColor: `${C.accent}15`, color: C.accent, fontSize: 7.5, padding: '3pt 8pt', borderRadius: 10 },
  // Education / cert
  eduPos:     { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 },
  eduInst:    { fontSize: 8.2, color: C.subtle, marginBottom: 1 },
  eduDate:    { fontSize: 8, color: C.muted },
  // Languages
  langRow:    { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  langItem:   { flexDirection: 'row', gap: 4, alignItems: 'center' },
  langName:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  langLevel:  { fontSize: 8, color: C.subtle },
  // Summary
  summary:    { fontSize: 8.5, lineHeight: 1.6, color: C.text },
})

// ─── Helpers ──────────────────────────────────────
function formatPeriod(startYear: string, startMonth: string, endYear: string, endMonth: string) {
  const start = [startMonth, startYear].filter(Boolean).join(' ')
  const end   = (!endYear && !endMonth) ? 'Presente' : [endMonth, endYear].filter(Boolean).join(' ')
  return start && end ? `${start} – ${end}` : start || end || ''
}

// ─── Document ─────────────────────────────────────
export function ClassicTemplate({ data }: { data: CvFormData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.name}>{data.fullName}</Text>
          {data.jobTitle ? <Text style={s.jobTitle}>{data.jobTitle}</Text> : null}
          <View style={s.contactRow}>
            {data.contact.email    && <Text style={s.contactItem}>{data.contact.email}</Text>}
            {data.contact.phone    && <Text style={s.contactItem}>· {data.contact.phone}</Text>}
            {data.contact.city     && <Text style={s.contactItem}>· {data.contact.city}</Text>}
            {data.contact.linkedin && <Text style={s.contactItem}>· {data.contact.linkedin}</Text>}
            {data.contact.portfolio && <Text style={s.contactItem}>· {data.contact.portfolio}</Text>}
          </View>
        </View>

        {/* SUMMARY */}
        {data.summary ? (
          <View style={s.section}>
            <SectionTitle title="Resumen Profesional" />
            <Text style={s.summary}>{data.summary}</Text>
          </View>
        ) : null}

        {/* EXPERIENCE */}
        {data.experience.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Experiencia Laboral" />
            {data.experience.map((exp) => (
              <View key={exp.id} style={{ marginBottom: 10 }}>
                <View style={s.expHeader}>
                  <Text style={s.expPos}>{exp.position}</Text>
                  <Text style={s.expDate}>
                    {formatPeriod(exp.period.startYear, exp.period.startMonth, exp.period.endYear, exp.period.endMonth)}
                  </Text>
                </View>
                <Text style={s.expCompany}>
                  {exp.company}{exp.city ? ` · ${exp.city}` : ''}{exp.country ? `, ${exp.country}` : ''}{exp.modality ? ` · ${exp.modality}` : ''}
                </Text>
                {exp.tasks.split('\n').filter(Boolean).map((line, i) => (
                  <Text key={i} style={s.expTask}>{line}</Text>
                ))}
                {exp.skills.length > 0 && (
                  <View style={[s.skillsRow, { marginTop: 4 }]}>
                    {exp.skills.map((sk) => (
                      <Text key={sk} style={s.skillChip}>{sk}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* EDUCATION */}
        {data.education.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Educación" />
            {data.education.map((edu) => (
              <View key={edu.id} style={{ marginBottom: 7 }}>
                <Text style={s.eduPos}>{edu.degree}</Text>
                <Text style={s.eduInst}>{edu.institution}</Text>
                <Text style={s.eduDate}>
                  {formatPeriod(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* CERTIFICATIONS */}
        {data.certifications.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Certificaciones" />
            {data.certifications.map((cert) => (
              <View key={cert.id} style={{ marginBottom: 6 }}>
                <Text style={s.eduPos}>{cert.title}</Text>
                {cert.issuedBy && <Text style={s.eduInst}>{cert.issuedBy}</Text>}
                <Text style={s.eduDate}>
                  {formatPeriod(cert.obtainedYear, cert.obtainedMonth, cert.expiresYear, cert.expiresMonth)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* LANGUAGES */}
        {data.languages.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Idiomas" />
            <View style={s.langRow}>
              {data.languages.map((lang) => (
                <View key={lang.id} style={s.langItem}>
                  <Text style={s.langName}>{lang.name}</Text>
                  {lang.level && <Text style={s.langLevel}>— {lang.level}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={s.sectionHdr}>
      <View style={s.sectionDot} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}
