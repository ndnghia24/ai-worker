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
    
    // SỬ DỤNG MODEL GEMINI 3.1 FLASH IMAGE PREVIEW MỚI NHẤT
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3.1-flash-image-preview" 
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(',').pop() || "", 
          mimeType: "image/jpeg", 
        },
      },
    ]);

    const response = await result.response;
    return res.status(200).json({ result: response.text().trim() });

  } catch (error: any) {
    console.error("Worker Error:", error.message);
    // Trả về 503 để bot chủ chủ động retry sang worker khác
    return res.status(503).json({ error: error.message });
  }
}
