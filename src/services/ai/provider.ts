import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIMessage {
  role: "system" | "user";
  content: string;
}

export interface AIProvider {
  name: string;
  chat(messages: AIMessage[], maxTokens?: number): Promise<string>;
}

// ── Groq ──────────────────────────────────────────────────────
// Free. Uses OpenAI-compatible SDK. JSON mode nativo.
// Fastest option — critical for staying under Vercel 10s timeout.
class GroqProvider implements AIProvider {
  name = "Groq";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama3-8b-8192",
      messages,
      max_tokens: maxTokens,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    return res.choices[0]?.message?.content ?? "";
  }
}

// ── Google Gemini ─────────────────────────────────────────────
// Free tier. FIX: systemInstruction only works on apiVersion 'v1beta'.
// Using 'v1' caused the "Unknown name systemInstruction" 400 error.
class GeminiProvider implements AIProvider {
  name = "Google Gemini";
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async chat(messages: AIMessage[], maxTokens = 2500): Promise<string> {
    const systemContent = messages.find((m) => m.role === "system")?.content;
    const userContent = messages.find((m) => m.role === "user")?.content ?? "";

    // FIX: apiVersion must be 'v1beta' for systemInstruction support.
    // 'v1' does not recognize the field and returns 400 Bad Request.
    const model = this.genAI.getGenerativeModel(
      {
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        ...(systemContent ? { systemInstruction: systemContent } : {}),
      },
      { apiVersion: "v1beta" }, // ← was 'v1', that caused the 400 error
    );

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.1,
      },
    });

    return result.response.text();
  }
}

// ── Anthropic (Claude) ────────────────────────────────────────
class AnthropicProvider implements AIProvider {
  name = "Anthropic (Claude)";
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => ({ role: "user" as const, content: m.content }));

    const res = await this.client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system,
      messages: userMessages,
    });

    const block = res.content[0];
    if (!block) return "";
    return block.type === "text" ? block.text : "";
  }
}

// ── OpenAI direct ─────────────────────────────────────────────
class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
    });
    return res.choices[0]?.message?.content ?? "";
  }
}

// ── Azure OpenAI ──────────────────────────────────────────────
class AzureOpenAIProvider implements AIProvider {
  name = "Azure OpenAI";
  private client: OpenAI;
  private deployment: string;

  constructor() {
    this.deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";
    this.client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${this.deployment}`,
      defaultQuery: { "api-version": "2024-02-01" },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY! },
    });
  }

  async chat(messages: AIMessage[], maxTokens = 2000): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.deployment,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
    });
    return res.choices[0]?.message?.content ?? "";
  }
}

// ─────────────────────────────────────────────────────────────
// Build the provider chain based on configured env vars.
// Order is intentional: fastest/cheapest first.
// ─────────────────────────────────────────────────────────────
function buildChain(): AIProvider[] {
  const chain: AIProvider[] = [];

  if (process.env.GROQ_API_KEY) chain.push(new GroqProvider());
  if (process.env.GEMINI_API_KEY) chain.push(new GeminiProvider());
  if (process.env.ANTHROPIC_API_KEY) chain.push(new AnthropicProvider());
  if (process.env.OPENAI_API_KEY) chain.push(new OpenAIProvider());
  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY)
    chain.push(new AzureOpenAIProvider());

  return chain;
}

// ─────────────────────────────────────────────────────────────
// Proxy provider — wraps the chain and tries each in order.
// If a provider throws or returns empty, the next is tried.
// Logs each attempt so Railway logs are easy to read.
// ─────────────────────────────────────────────────────────────
class FallbackChainProvider implements AIProvider {
  name = "FallbackChain";
  private chain: AIProvider[];

  constructor(chain: AIProvider[]) {
    this.chain = chain;
    this.name = chain.map((p) => p.name).join(" → ");
  }

  async chat(messages: AIMessage[], maxTokens?: number): Promise<string> {
    const errors: string[] = [];

    for (const provider of this.chain) {
      try {
        console.log(`[AI] Trying ${provider.name}...`);
        const result = await provider.chat(messages, maxTokens);

        if (result && result.trim().length > 0) {
          console.log(`[AI] Success with ${provider.name}`);
          return result;
        }

        console.warn(
          `[AI] ${provider.name} returned empty response, trying next...`,
        );
        errors.push(`${provider.name}: empty response`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[AI] ${provider.name} failed: ${msg.slice(0, 120)}`);
        errors.push(`${provider.name}: ${msg.slice(0, 80)}`);
      }
    }

    throw new Error(
      `All AI providers failed.\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join("\n")}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton — built once per Railway process instance.
// ─────────────────────────────────────────────────────────────
let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  const chain = buildChain();

  if (chain.length === 0) {
    throw new Error(
      "[AI] No provider configured. Set at least one of: " +
        "GROQ_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT+KEY",
    );
  }

  console.log(`[AI] Provider chain: ${chain.map((p) => p.name).join(" → ")}`);
  _provider = new FallbackChainProvider(chain);
  return _provider;
}
