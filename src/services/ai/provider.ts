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

// ── Google Gemini Provider (NUEVO) ───────────────────────────
class GeminiProvider implements AIProvider {
  name = 'Google Gemini'
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    // Usamos 1.5-flash por su velocidad y gratuidad
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const systemInstruction = messages.find(m => m.role === 'system')?.content
    const userMessage = messages.find(m => m.role === 'user')?.content ?? ''

    // Gemini maneja el System Prompt de forma separada en la configuración
    const modelWithSystem = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction 
    })

    const result = await modelWithSystem.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.1, // Baja temperatura para JSON consistente
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

// ── Factory — auto-selects based on env vars ─────────────────
let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  // Prioridad 1: Gemini (Gratis y robusto)
  if (process.env.GEMINI_API_KEY) {
    console.log("[AI] Using Google Gemini");
    _provider = new GeminiProvider();
  }
  // Prioridad 2: Azure
  else if (
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_OPENAI_API_KEY
  ) {
    console.log("[AI] Using Azure OpenAI");
    _provider = new AzureOpenAIProvider();
  }
  // Prioridad 3: Anthropic
  else if (process.env.ANTHROPIC_API_KEY) {
    console.log("[AI] Using Anthropic (Claude)");
    _provider = new AnthropicProvider();
  }
  // Prioridad 4: OpenAI Direct (El que te dio el error 429)
  else if (process.env.OPENAI_API_KEY) {
    console.log("[AI] Using OpenAI direct");
    _provider = new OpenAIProvider();
  } else {
    throw new Error("No AI provider API keys found in environment variables.");
  }

  return _provider;
}
