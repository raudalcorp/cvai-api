import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIMessage {
  role: 'system' | 'user'
  content: string
}

export interface AIProvider {
  name: string
  chat(messages: AIMessage[], maxTokens?: number): Promise<string>
}

// ── Groq Provider (Prioridad Actual) ──────────────────────────
class GroqProvider implements AIProvider {
  name = 'Groq'
  private client: OpenAI
  private model: string

  constructor() {
    // Groq es compatible con el SDK de OpenAI
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com/openai/v1',
    })
    this.model = process.env.GROQ_MODEL ?? 'llama3-8b-8192'
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.1,
      response_format: { type: 'json_object' } // Groq soporta modo JSON nativo
    })
    return res.choices[0]?.message?.content ?? ''
  }
}

// ── Google Gemini Provider (Actualizado con IDs de tu lista) ──
class GeminiProvider implements AIProvider {
  name = 'Google Gemini'
  private genAI: GoogleGenerativeAI
  private modelName = 'gemini-2.0-flash' // Basado en tu diagnóstico exitoso

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  }

  async chat(messages: AIMessage[], maxTokens = 2500): Promise<string> {
    const systemInstruction = messages.find(m => m.role === 'system')?.content
    const userMessage = messages.find(m => m.role === 'user')?.content ?? ''

    const model = this.genAI.getGenerativeModel(
      { model: this.modelName, systemInstruction },
      { apiVersion: 'v1' }
    )

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.1,
      },
    })

    const response = await result.response
    return response.text()
  }
}
// ── Azure OpenAI ──────────────────────────────────────────────
class AzureOpenAIProvider implements AIProvider {
  name = 'Azure OpenAI'
  private client: OpenAI
  private deployment: string

  constructor() {
    this.deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o'
    this.client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${this.deployment}`,
      defaultQuery: { 'api-version': '2024-02-01' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY! },
    })
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.deployment,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2, // Low temperature = consistent structured output
    })
    return res.choices[0]?.message?.content ?? ''
  }
}

// ── OpenAI direct ─────────────────────────────────────────────
class OpenAIProvider implements AIProvider {
  name = 'OpenAI'
  private client: OpenAI
  private model: string

  constructor() {
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini' // cheapest capable model
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
    })
    return res.choices[0]?.message?.content ?? ''
  }
}

// ── Anthropic (Claude) ────────────────────────────────────────
class AnthropicProvider implements AIProvider {
  name = 'Anthropic (Claude)'
  private client: Anthropic
  private model: string

  constructor() {
    this.model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001'
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    // Anthropic separates system from user messages
    const system = messages.find((m) => m.role === 'system')?.content ?? ''
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => ({ role: 'user' as const, content: m.content }))

    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: userMessages,
    })

const block = res.content[0];
if (!block) {
  return "";
}
return block.type === "text" ? block.text : "";
  }
}

// ── Factory ───────────────────────────────────────────────────
let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  // 1. Prioridad: Groq (Gratuito y rápido para desarrollo)
  if (process.env.GROQ_API_KEY) {
    console.log('[AI] Using Groq')
    _provider = new GroqProvider()
  } 
  // 2. Gemini
  else if (process.env.GEMINI_API_KEY) {
    console.log('[AI] Using Google Gemini')
    _provider = new GeminiProvider()
  } 
  // 3. Anthropic
  else if (process.env.ANTHROPIC_API_KEY) {
    console.log('[AI] Using Anthropic (Claude)')
    _provider = new AnthropicProvider()
  } 
  // 4. OpenAI
  else if (process.env.OPENAI_API_KEY) {
    console.log('[AI] Using OpenAI direct')
    _provider = new OpenAIProvider()
  } 
  else {
    throw new Error('No AI provider API keys found in environment variables.')
  }

  return _provider
}