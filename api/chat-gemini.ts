// api/chat-gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, imageBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !prompt || !imageBase64) {
    return res.status(400).json({ error: 'Missing Required Data' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Đổi sang bản 3.1 Flash Lite để lấy RPD 500
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(',').pop() || "", 
          mimeType: "image/jpeg", // Đã chuyển sang JPEG để nhẹ hơn
        },
      },
    ]);

    const response = await result.response;
    return res.status(200).json({ result: response.text().trim() });

  } catch (error: any) {
    // Nếu vẫn dính Rate Limit (429/503), trả về 503 để Bot Orchestrator biết đường Retry
    console.error("Worker Error:", error.message);
    return res.status(503).json({ error: error.message });
  }
}
