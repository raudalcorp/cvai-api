import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listAllAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return console.error("Falta la API KEY");

  console.log("--- Consultando Modelos Disponibles ---");

  try {
    // Usamos fetch directo para saltarnos cualquier restricción del SDK
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error de la API:", data.error.message);
      return;
    }

    console.log("✅ Modelos encontrados en tu cuenta:");
    data.models.forEach((m) => {
      // Solo mostramos los que soportan "generateContent" (que son los que nos sirven)
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(
          `- ID: ${m.name.replace("models/", "")} (${m.displayName})`,
        );
      }
    });
  } catch (error) {
    console.error("❌ Error de red:", error.message);
  }
}

listAllAvailableModels();
