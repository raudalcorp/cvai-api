export type Modality = 'presencial' | 'hibrido' | 'remoto'
export type LanguageLevel = 'principiante' | 'intermedio' | 'profesional' | 'nativo'

export interface DateRange {
  startYear: string
  startMonth: string
  endYear: string
  endMonth: string
}

export interface Experience {
  id: string
  position: string
  company: string
  period: DateRange
  city: string
  country: string
  modality: Modality | ''
  tasks: string
  skills: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  startYear: string
  startMonth: string
  endYear: string
  endMonth: string
}

export interface Certification {
  id: string
  title: string
  issuedBy: string
  obtainedYear: string
  obtainedMonth: string
  expiresYear: string
  expiresMonth: string
}

export interface Language {
  id: string
  name: string
  level: LanguageLevel | ''
}

export interface ContactInfo {
  phone: string
  email: string
  city: string
  linkedin: string
  portfolio: string
}

export interface CvFormData {
  fullName: string
  jobTitle: string
  summary: string
  photoUrl: string | null
  contact: ContactInfo
  experience: Experience[]
  education: Education[]
  certifications: Certification[]
  languages: Language[]
}

// Extended response that includes detected email from CV
export interface ParsedCvResponse extends Partial<CvFormData> {
  emailFromCv?: string
}
