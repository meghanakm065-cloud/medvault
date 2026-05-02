import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

const SYSTEM_PROMPT = `You are Healthu, a knowledgeable and compassionate medical AI assistant for the MedVault platform. 
Your goal is to help users understand medical terms, explain health reports in simple language, give healthy lifestyle tips, and encourage them to follow their prescriptions.

CONSTRAINTS:
1. You are NOT a doctor. You must NEVER give a definitive diagnosis.
2. ALWAYS include a disclaimer if the user asks for medical advice: "I am an AI assistant, not a doctor. Please consult with a healthcare professional for clinical diagnosis or treatment."
3. Be concise, clear, and supportive.
4. Use formatting (bullet points, bold text) to make information easy to read.
5. If the user mentions health records, explain that you can help them understand what the terms mean once they describe or paste the text from their reports. (Note: In this version, you mostly process text input).

Tone: Friendly, professional, and empathetic.`;

export async function chatWithHealthu(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Healthu Error:", error);
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error("Network error. Please check your connection or wait a moment.");
    }
    throw new Error("I'm having trouble connecting right now. Please try again later.");
  }
}
