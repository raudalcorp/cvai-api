# CV.AI — API (Backend)

**Servicio Node.js que procesa CVs con IA, genera PDFs y agrega búsquedas de empleo.**

Deploy: Railway &nbsp;·&nbsp; Frontend: [cvai-frontend](https://github.com/raudalcorp/cvai-frontend)

---

## Responsabilidades

Este servicio es el único punto de procesamiento de lógica de negocio. El frontend (Next.js en Vercel) actúa solo como proxy — toda la inteligencia está aquí.

| Endpoint | Función |
|---|---|
| `POST /cv/parse` | Extrae texto de PDF/DOCX y estructura los datos con IA |
| `POST /cv/generate-pdf` | Renderiza el CV en una plantilla y devuelve un PDF binario |
| `POST /cv/translate` | Traduce un `CvFormData` completo entre ES↔EN con IA |
| `POST /jobs/search` | Agrega búsquedas en Adzuna + JSearch + Remotive con fallback |
| `GET /health` | Health check para Railway |

---

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 22 LTS |
| Framework | Express 4 + TypeScript 5 |
| PDF parsing | pdfjs-dist (legacy build) |
| DOCX parsing | mammoth |
| PDF generation | @react-pdf/renderer (3 plantillas) |
| Auth interna | Header `x-internal-key` compartido con Next.js |
| Deploy | Railway |

---

## Adaptador de IA multi-proveedor

Todos los endpoints de IA pasan por un adaptador que detecta automáticamente el provider disponible y hace fallback al siguiente si falla:

```
Groq (free, ~1-3s) → Gemini (free) → Anthropic → OpenAI → Azure OpenAI
```

El código no cambia al agregar o cambiar providers — solo se configuran las variables de entorno. Diseñado para migrar a **Azure OpenAI Service** como provider principal en Fase 2.

```typescript
// La lógica de negocio llama al adaptador, no al provider directamente
const ai = getAIProvider()
const result = await ai.chat(messages)
```

---

## Estructura

```
src/
├── server.ts              # Entry point Express
├── middleware/
│   └── auth.ts            # Valida x-internal-key (solo Next.js BFF puede llamar)
├── routes/
│   ├── cv.ts              # /cv/parse · /cv/generate-pdf · /cv/translate
│   └── jobs.ts            # /jobs/search
├── services/
│   ├── ai/
│   │   ├── provider.ts        # Adaptador multi-proveedor con fallback chain
│   │   ├── cv-structurer.ts   # Prompt de extracción estructurada de CV
│   │   ├── cv-translator.ts   # Prompt de traducción campo por campo
│   │   └── affinity.ts        # Score 0-100 de afinidad CV vs oferta
│   ├── parser/
│   │   ├── pdf.ts             # pdfjs-dist — extracción de texto PDF
│   │   └── docx.ts            # mammoth — extracción de texto DOCX
│   ├── pdf/
│   │   ├── generator.ts       # Factory de plantillas → Buffer PDF
│   │   └── templates/
│   │       ├── classic.tsx    # Una columna, ATS-friendly
│   │       ├── modern.tsx     # Sidebar de color, tech/creativo
│   │       └── minimal.tsx    # Sin color, ejecutivo/académico
│   └── jobs/
│       ├── search.ts          # Orquestador con fallback
│       └── providers/
│           ├── adzuna.ts      # 250 req/día gratis
│           ├── jsearch.ts     # 200 req/mes gratis (RapidAPI)
│           └── remotive.ts    # Ilimitado gratis (solo remoto)
└── types/
    └── cv-types.ts            # Tipos del dominio (espejo del frontend)
```

---

## Variables de entorno

```env
# Servidor
PORT=                        # Railway lo inyecta automáticamente
NEXTJS_ORIGIN=               # URL del frontend en Vercel
INTERNAL_API_KEY=            # Clave compartida con Next.js BFF

# AI — el sistema usa el primero disponible, fallback en orden
GROQ_API_KEY=                # console.groq.com — gratuito, recomendado
GROQ_MODEL=llama3-8b-8192
GEMINI_API_KEY=              # aistudio.google.com — gratuito
GEMINI_MODEL=gemini-2.0-flash
ANTHROPIC_API_KEY=           # console.anthropic.com
OPENAI_API_KEY=              # platform.openai.com
# Azure OpenAI (Fase 2)
# AZURE_OPENAI_ENDPOINT=
# AZURE_OPENAI_API_KEY=
# AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Búsqueda de empleos
ADZUNA_APP_ID=               # developer.adzuna.com
ADZUNA_APP_KEY=
JSEARCH_RAPIDAPI_KEY=        # rapidapi.com → JSearch (opcional)
# Remotive no requiere key
```

---

## Desarrollo local

```bash
npm install
cp .env.example .env
# Completar variables de entorno
npm run dev          # tsx watch src/server.ts
```

---

## Deploy en Railway

1. Conectar este repo en Railway → New Project → Deploy from GitHub
2. Agregar variables de entorno en la pestaña Variables
3. Railway detecta el `Procfile` y ejecuta `npm run build && npm start`
4. Verificar: `GET https://tu-api.railway.app/health`

---

## Seguridad

Todas las rutas de negocio requieren el header `x-internal-key`. Las peticiones directas al API desde el browser son rechazadas con 401. Solo el BFF de Next.js (autenticado con Supabase) puede llamar a este servicio.

---

## Roadmap Fase 2

- Migración a **Azure Container Apps**
- **Azure OpenAI Service** como provider principal
- **pgvector** + RAG pipeline para matching semántico de CVs
- **n8n** automation para notificaciones y flujos de empleo
- Python microservicio para NLP avanzado

---

## Autor

**Gerald Hurtado** — [LinkedIn](https://linkedin.com/in/gerald-hurtado) · [GitHub](https://github.com/raudalcorp)
