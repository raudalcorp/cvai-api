import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type {
  CvFormData, Experience, Education, Certification, Language,
} from '../../../types/cv-types'

const C = {
  accent: '#1e40af', text: '#1e293b', subtle: '#475569',
  muted:  '#94a3b8', border: '#e2e8f0', white: '#ffffff',
}

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, color: C.text, padding: '36pt 40pt' },
  header:      { backgroundColor: C.accent, margin: '-36pt -40pt 20pt', padding: '28pt 40pt 20pt', color: C.white },
  name:        { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4, letterSpacing: 0.5 },
  jobTitle:    { fontSize: 11, opacity: 0.88, marginBottom: 8 },
  contactRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, fontSize: 8, opacity: 0.85 },
  section:     { marginBottom: 14 },
  sectionHdr:  { borderBottom: `1.5pt solid ${C.border}`, paddingBottom: 3, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  sectionTitle:{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  expHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  expPos:      { fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  expDate:     { fontSize: 8, color: C.subtle },
  expCompany:  { fontSize: 8.5, color: C.subtle, marginBottom: 4 },
  expTask:     { fontSize: 8.2, color: C.text, lineHeight: 1.5, marginBottom: 1 },
  skillsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  skillChip:   { backgroundColor: `${C.accent}22`, color: C.accent, fontSize: 7.5, padding: '3pt 8pt', borderRadius: 10 },
  eduPos:      { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 },
  eduInst:     { fontSize: 8.2, color: C.subtle, marginBottom: 1 },
  eduDate:     { fontSize: 8, color: C.muted },
  langRow:     { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  langItem:    { flexDirection: 'row', gap: 4, alignItems: 'center' },
  langName:    { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  langLevel:   { fontSize: 8, color: C.subtle },
  summary:     { fontSize: 8.5, lineHeight: 1.6 },
})

function period(sy: string, sm: string, ey: string, em: string): string {
  const start = [sm, sy].filter(Boolean).join(' ')
  const end   = (!ey && !em) ? 'Presente' : [em, ey].filter(Boolean).join(' ')
  return start && end ? `${start} – ${end}` : start || end || ''
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={s.sectionHdr}>
      <View style={s.sectionDot} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

export function ClassicTemplate({ data }: { data: CvFormData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        <View style={s.header}>
          <Text style={s.name}>{data.fullName}</Text>
          {data.jobTitle ? <Text style={s.jobTitle}>{data.jobTitle}</Text> : null}
          <View style={s.contactRow}>
            {data.contact.email     && <Text>{data.contact.email}</Text>}
            {data.contact.phone     && <Text>· {data.contact.phone}</Text>}
            {data.contact.city      && <Text>· {data.contact.city}</Text>}
            {data.contact.linkedin  && <Text>· {data.contact.linkedin}</Text>}
            {data.contact.portfolio && <Text>· {data.contact.portfolio}</Text>}
          </View>
        </View>

        {data.summary ? (
          <View style={s.section}>
            <SectionTitle title="Resumen Profesional" />
            <Text style={s.summary}>{data.summary}</Text>
          </View>
        ) : null}

        {data.experience.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Experiencia Laboral" />
            {data.experience.map((exp: Experience) => (
              <View key={exp.id} style={{ marginBottom: 10 }}>
                <View style={s.expHeader}>
                  <Text style={s.expPos}>{exp.position}</Text>
                  <Text style={s.expDate}>
                    {period(exp.period.startYear, exp.period.startMonth, exp.period.endYear, exp.period.endMonth)}
                  </Text>
                </View>
                <Text style={s.expCompany}>
                  {[exp.company, exp.city, exp.country, exp.modality].filter(Boolean).join(' · ')}
                </Text>
                {exp.tasks.split('\n').filter(Boolean).map((line: string, i: number) => (
                  <Text key={i} style={s.expTask}>{line}</Text>
                ))}
                {exp.skills.length > 0 && (
                  <View style={[s.skillsRow, { marginTop: 4 }]}>
                    {exp.skills.map((sk: string) => (
                      <Text key={sk} style={s.skillChip}>{sk}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {data.education.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Educación" />
            {data.education.map((edu: Education) => (
              <View key={edu.id} style={{ marginBottom: 7 }}>
                <Text style={s.eduPos}>{edu.degree}</Text>
                <Text style={s.eduInst}>{edu.institution}</Text>
                <Text style={s.eduDate}>
                  {period(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.certifications.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Certificaciones" />
            {data.certifications.map((cert: Certification) => (
              <View key={cert.id} style={{ marginBottom: 6 }}>
                <Text style={s.eduPos}>{cert.title}</Text>
                {cert.issuedBy ? <Text style={s.eduInst}>{cert.issuedBy}</Text> : null}
                <Text style={s.eduDate}>
                  {period(cert.obtainedYear, cert.obtainedMonth, cert.expiresYear, cert.expiresMonth)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.languages.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Idiomas" />
            <View style={s.langRow}>
              {data.languages.map((lang: Language) => (
                <View key={lang.id} style={s.langItem}>
                  <Text style={s.langName}>{lang.name}</Text>
                  {lang.level ? <Text style={s.langLevel}>— {lang.level}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  )
}
