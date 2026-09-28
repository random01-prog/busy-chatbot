import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages are required" });
    }

    // Gemini uses "model" instead of "assistant"
    let contents = messages.map((message) => ({
      role: message.sender === "user" ? "user" : "model",
      parts: [{ text: message.text }],
    }));

    // Conversation must start with a user message (your chat starts with a bot greeting)
    while (contents.length && contents[0].role !== "user") {
      contents.shift();
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction:
          "You are Busy Chatbot, a friendly, helpful and professional AI assistant. Give clear and useful answers. Be warm but professional. You may use a few emojis naturally.",
      },
    });

    return res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);

    return res.status(500).json({
      error: "Unable to get a response from the AI.",
    });
  }
}