import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    const conversation = messages.map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text,
    }));

    const response = await openai.responses.create({
      model: "gpt-5.6",

      instructions:
        "You are Busy Chatbot, a friendly, helpful and professional AI assistant. Give clear and useful answers. Be warm but professional. You may use a few emojis naturally.",

      input: conversation,
    });

    return res.status(200).json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("OpenAI Error:", error);

    return res.status(500).json({
      error: "Unable to get a response from OpenAI.",
    });
  }
}