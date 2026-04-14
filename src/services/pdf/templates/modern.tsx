import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type {
  CvFormData, Experience, Education, Certification, Language,
} from '../../../types/cv-types'

const C = {
  accent: '#4f46e5', accentLt: '#e0e7ff', text: '#1e293b',
  subtle: '#475569', muted: '#94a3b8', sidebar: '#312e81', white: '#ffffff',
}

const s = StyleSheet.create({
  page:          { fontFamily: 'Helvetica', fontSize: 9, color: C.text, flexDirection: 'row' },
  sidebar:       { width: '34%', backgroundColor: C.sidebar, padding: '32pt 16pt', color: C.white },
  sName:         { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 3, lineHeight: 1.2 },
  sJobTitle:     { fontSize: 9, opacity: 0.8, marginBottom: 20, lineHeight: 1.4 },
  sSectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, textTransform: 'uppercase' as const, opacity: 0.65, marginBottom: 8, marginTop: 16 },
  sItem:         { fontSize: 8, opacity: 0.85, marginBottom: 5, lineHeight: 1.4 },
  sLangName:     { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  sLangLevel:    { fontSize: 7.5, opacity: 0.7 },
  sSkillChip:    { backgroundColor: 'rgba(255,255,255,0.12)', padding: '3pt 8pt', borderRadius: 8, fontSize: 7.5, marginBottom: 4, marginRight: 4 },
  sSkillsRow:    { flexDirection: 'row', flexWrap: 'wrap' },
  main:          { flex: 1, padding: '32pt 24pt' },
  secHdr:        { borderBottom: `1pt solid ${C.accentLt}`, paddingBottom: 3, marginBottom: 8, marginTop: 12 },
  secTitle:      { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.accent, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  expPos:        { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  expMeta:       { fontSize: 8, color: C.subtle, marginBottom: 3 },
  expTask:       { fontSize: 8, lineHeight: 1.5, marginBottom: 1 },
  eduPos:        { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 },
  eduInst:       { fontSize: 8, color: C.subtle },
  summary:       { fontSize: 8.5, lineHeight: 1.6 },
})

function period(sy: string, sm: string, ey: string, em: string): string {
  const s = [sm, sy].filter(Boolean).join(' ')
  const e = (!ey && !em) ? 'Presente' : [em, ey].filter(Boolean).join(' ')
  return s && e ? `${s} – ${e}` : s || e || ''
}

export function ModernTemplate({ data }: { data: CvFormData }) {
  const allSkills = [...new Set(data.experience.flatMap((e: Experience) => e.skills))].slice(0, 12) as string[]

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* SIDEBAR */}
        <View style={s.sidebar}>
          <Text style={s.sName}>{data.fullName}</Text>
          {data.jobTitle ? <Text style={s.sJobTitle}>{data.jobTitle}</Text> : null}

          <Text style={s.sSectionTitle}>Contacto</Text>
          {data.contact.email    && <Text style={s.sItem}>{data.contact.email}</Text>}
          {data.contact.phone    && <Text style={s.sItem}>{data.contact.phone}</Text>}
          {data.contact.city     && <Text style={s.sItem}>{data.contact.city}</Text>}
          {data.contact.linkedin && <Text style={s.sItem}>{data.contact.linkedin}</Text>}

          {allSkills.length > 0 && (
            <>
              <Text style={s.sSectionTitle}>Skills</Text>
              <View style={s.sSkillsRow}>
                {allSkills.map((sk: string) => (
                  <Text key={sk} style={s.sSkillChip}>{sk}</Text>
                ))}
              </View>
            </>
          )}

          {data.languages.length > 0 && (
            <>
              <Text style={s.sSectionTitle}>Idiomas</Text>
              {data.languages.map((l: Language) => (
                <View key={l.id} style={{ marginBottom: 5 }}>
                  <Text style={s.sLangName}>{l.name}</Text>
                  {l.level ? <Text style={s.sLangLevel}>{l.level}</Text> : null}
                </View>
              ))}
            </>
          )}
        </View>

        {/* MAIN */}
        <View style={s.main}>
          {data.summary ? (
            <>
              <View style={s.secHdr}><Text style={s.secTitle}>Perfil</Text></View>
              <Text style={s.summary}>{data.summary}</Text>
            </>
          ) : null}

          {data.experience.length > 0 && (
            <>
              <View style={s.secHdr}><Text style={s.secTitle}>Experiencia</Text></View>
              {data.experience.map((exp: Experience) => (
                <View key={exp.id} style={{ marginBottom: 10 }}>
                  <Text style={s.expPos}>{exp.position}</Text>
                  <Text style={s.expMeta}>
                    {[exp.company, exp.city, period(exp.period.startYear, exp.period.startMonth, exp.period.endYear, exp.period.endMonth)].filter(Boolean).join(' · ')}
                  </Text>
                  {exp.tasks.split('\n').filter(Boolean).map((t: string, i: number) => (
                    <Text key={i} style={s.expTask}>{t}</Text>
                  ))}
                </View>
              ))}
            </>
          )}

          {data.education.length > 0 && (
            <>
              <View style={s.secHdr}><Text style={s.secTitle}>Educación</Text></View>
              {data.education.map((edu: Education) => (
                <View key={edu.id} style={{ marginBottom: 7 }}>
                  <Text style={s.eduPos}>{edu.degree}</Text>
                  <Text style={s.eduInst}>
                    {edu.institution} · {period(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {data.certifications.length > 0 && (
            <>
              <View style={s.secHdr}><Text style={s.secTitle}>Certificaciones</Text></View>
              {data.certifications.map((cert: Certification) => (
                <View key={cert.id} style={{ marginBottom: 6 }}>
                  <Text style={s.eduPos}>{cert.title}</Text>
                  {cert.issuedBy ? (
                    <Text style={s.eduInst}>
                      {cert.issuedBy} · {period(cert.obtainedYear, cert.obtainedMonth, cert.expiresYear, cert.expiresMonth)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </>
          )}
        </View>

      </Page>
    </Document>
  )
}
