import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type {
  CvFormData, Experience, Education, Certification, Language,
} from '../../../types/cv-types.js'

const C = { text: '#111827', subtle: '#4b5563', muted: '#9ca3af', border: '#d1d5db' }

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, color: C.text, padding: '44pt 48pt' },
  topDivider:  { borderBottom: `2pt solid ${C.text}`, paddingBottom: 12, marginBottom: 12 },
  name:        { fontSize: 24, fontFamily: 'Helvetica-Bold', letterSpacing: 1, marginBottom: 4 },
  jobTitle:    { fontSize: 10, color: C.subtle, letterSpacing: 0.3 },
  contactRow:  { flexDirection: 'row', gap: 16, fontSize: 8, color: C.subtle, marginTop: 6, flexWrap: 'wrap' },
  sectionRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 16 },
  sectionLbl:  { width: 80, flexShrink: 0, fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.subtle, textTransform: 'uppercase' as const, letterSpacing: 0.6, paddingTop: 1 },
  sectionBody: { flex: 1, borderTop: `0.5pt solid ${C.border}`, paddingTop: 6 },
  expPos:      { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 },
  expMeta:     { fontSize: 8, color: C.subtle, marginBottom: 3 },
  expTask:     { fontSize: 8, lineHeight: 1.5 },
  eduPos:      { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 },
  eduInst:     { fontSize: 8, color: C.subtle },
  summary:     { fontSize: 8.5, lineHeight: 1.7 },
  langName:    { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  langLevel:   { color: C.muted, fontSize: 8 },
})

function period(sy: string, sm: string, ey: string, em: string): string {
  const s = [sm, sy].filter(Boolean).join(' ')
  const e = (!ey && !em) ? 'Presente' : [em, ey].filter(Boolean).join(' ')
  return s && e ? `${s} – ${e}` : s || e || ''
}

export function MinimalTemplate({ data }: { data: CvFormData }) {
  const allSkills = [...new Set(data.experience.flatMap((e: Experience) => e.skills))] as string[]
  const contacts = [
    data.contact.email, data.contact.phone,
    data.contact.city,  data.contact.linkedin,
  ].filter(Boolean) as string[]

  return (
    <Document>
      <Page size="A4" style={s.page}>

        <View style={s.topDivider}>
          <Text style={s.name}>{data.fullName.toUpperCase()}</Text>
          {data.jobTitle ? <Text style={s.jobTitle}>{data.jobTitle}</Text> : null}
          <View style={s.contactRow}>
            {contacts.map((v: string, i: number) => <Text key={i}>{v}</Text>)}
          </View>
        </View>

        {data.summary ? (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Perfil</Text>
            <View style={s.sectionBody}>
              <Text style={s.summary}>{data.summary}</Text>
            </View>
          </View>
        ) : null}

        {data.experience.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Experiencia</Text>
            <View style={s.sectionBody}>
              {data.experience.map((exp: Experience, i: number) => (
                <View key={exp.id} style={{ marginBottom: i < data.experience.length - 1 ? 10 : 0 }}>
                  <Text style={s.expPos}>{exp.position}</Text>
                  <Text style={s.expMeta}>
                    {[exp.company, period(exp.period.startYear, exp.period.startMonth, exp.period.endYear, exp.period.endMonth), exp.city].filter(Boolean).join(' · ')}
                  </Text>
                  {exp.tasks.split('\n').filter(Boolean).map((t: string, j: number) => (
                    <Text key={j} style={s.expTask}>{t}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {data.education.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Educación</Text>
            <View style={s.sectionBody}>
              {data.education.map((edu: Education) => (
                <View key={edu.id} style={{ marginBottom: 7 }}>
                  <Text style={s.eduPos}>{edu.degree}</Text>
                  <Text style={s.eduInst}>
                    {edu.institution} · {period(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.certifications.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Certs.</Text>
            <View style={s.sectionBody}>
              {data.certifications.map((cert: Certification) => (
                <View key={cert.id} style={{ marginBottom: 5 }}>
                  <Text style={s.eduPos}>{cert.title}</Text>
                  {cert.issuedBy ? (
                    <Text style={s.eduInst}>
                      {cert.issuedBy} · {period(cert.obtainedYear, cert.obtainedMonth, cert.expiresYear, cert.expiresMonth)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

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

        {data.languages.length > 0 && (
          <View style={s.sectionRow}>
            <Text style={s.sectionLbl}>Idiomas</Text>
            <View style={s.sectionBody}>
              {data.languages.map((l: Language) => (
                <View key={l.id} style={{ flexDirection: 'row', gap: 6, marginBottom: 3 }}>
                  <Text style={s.langName}>{l.name}</Text>
                  {l.level ? <Text style={s.langLevel}>— {l.level}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  )
}
