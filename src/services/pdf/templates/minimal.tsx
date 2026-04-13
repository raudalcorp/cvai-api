// src/services/pdf/templates/minimal.tsx
// Plantilla "Minimalista" — tipografía limpia, sin color, ejecutivo/académico.

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CvFormData } from '../../../types/cv'

const C = { text: '#111827', subtle: '#4b5563', muted: '#9ca3af', border: '#d1d5db' }

const s = StyleSheet.create({
  page:       { fontFamily: 'Helvetica', fontSize: 9, color: C.text, padding: '44pt 48pt' },
  topDivider: { borderBottom: `2pt solid ${C.text}`, paddingBottom: 12, marginBottom: 12 },
  name:       { fontSize: 24, fontFamily: 'Helvetica-Bold', letterSpacing: 1, marginBottom: 4 },
  jobTitle:   { fontSize: 10, color: C.subtle, letterSpacing: 0.3 },
  contactRow: { flexDirection: 'row', gap: 16, fontSize: 8, color: C.subtle, marginTop: 6, flexWrap: 'wrap' },
  // Sections
  section:    { marginBottom: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 16 },
  sectionLbl: { width: 80, flexShrink: 0, fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.subtle, textTransform: 'uppercase' as const, letterSpacing: 0.6, paddingTop: 1 },
  sectionBody:{ flex: 1, borderTop: `0.5pt solid ${C.border}`, paddingTop: 6 },
  // Content
  expPos:     { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 },
  expMeta:    { fontSize: 8, color: C.subtle, marginBottom: 3 },
  expTask:    { fontSize: 8, lineHeight: 1.5 },
  skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillItem:  { fontSize: 8, color: C.subtle },
  langItem:   { fontSize: 8.5 },
  langLevel:  { color: C.muted, fontSize: 8 },
  summary:    { fontSize: 8.5, lineHeight: 1.7, color: C.text },
  eduPos:     { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 },
  eduInst:    { fontSize: 8, color: C.subtle },
})

function formatPeriod(sy: string, sm: string, ey: string, em: string) {
  const s = [sm, sy].filter(Boolean).join(' ')
  const e = (!ey && !em) ? 'Presente' : [em, ey].filter(Boolean).join(' ')
  return s && e ? `${s} – ${e}` : s || e || ''
}

export function MinimalTemplate({ data }: { data: CvFormData }) {
  const allSkills = [...new Set(data.experience.flatMap((e) => e.skills))]

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.topDivider}>
          <Text style={s.name}>{data.fullName.toUpperCase()}</Text>
          {data.jobTitle && <Text style={s.jobTitle}>{data.jobTitle}</Text>}
          <View style={s.contactRow}>
            {[data.contact.email, data.contact.phone, data.contact.city, data.contact.linkedin]
              .filter(Boolean)
              .map((v, i) => <Text key={i}>{v}</Text>)}
          </View>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Perfil</Text>
            <View style={s.sectionBody}>
              <Text style={s.summary}>{data.summary}</Text>
            </View>
          </View>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Experiencia</Text>
            <View style={s.sectionBody}>
              {data.experience.map((exp, i) => (
                <View key={exp.id} style={{ marginBottom: i < data.experience.length - 1 ? 10 : 0 }}>
                  <Text style={s.expPos}>{exp.position}</Text>
                  <Text style={s.expMeta}>
                    {exp.company} · {formatPeriod(exp.period.startYear, exp.period.startMonth, exp.period.endYear, exp.period.endMonth)}
                    {exp.city ? ` · ${exp.city}` : ''}
                  </Text>
                  {exp.tasks.split('\n').filter(Boolean).map((t, j) => (
                    <Text key={j} style={s.expTask}>{t}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Educación</Text>
            <View style={s.sectionBody}>
              {data.education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 7 }}>
                  <Text style={s.eduPos}>{edu.degree}</Text>
                  <Text style={s.eduInst}>{edu.institution} · {formatPeriod(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Certificaciones</Text>
            <View style={s.sectionBody}>
              {data.certifications.map((cert) => (
                <View key={cert.id} style={{ marginBottom: 5 }}>
                  <Text style={s.eduPos}>{cert.title}</Text>
                  {cert.issuedBy && <Text style={s.eduInst}>{cert.issuedBy} · {formatPeriod(cert.obtainedYear, cert.obtainedMonth, cert.expiresYear, cert.expiresMonth)}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Skills */}
        {allSkills.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Skills</Text>
            <View style={s.sectionBody}>
              <Text style={{ fontSize: 8.5, color: C.subtle, lineHeight: 1.6 }}>
                {allSkills.join(' · ')}
              </Text>
            </View>
          </View>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Idiomas</Text>
            <View style={s.sectionBody}>
              {data.languages.map((l) => (
                <Text key={l.id} style={s.langItem}>
                  {l.name}{l.level ? <Text style={s.langLevel}> — {l.level}</Text> : null}
                </Text>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  )
}
