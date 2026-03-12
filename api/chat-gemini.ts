import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Kiểm tra phương thức
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, imageBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 2. Kiểm tra dữ liệu đầu vào
  if (!apiKey) {
    return res.status(500).json({ error: 'Config Error: Missing GEMINI_API_KEY' });
  }

  if (!prompt || !imageBase64) {
    return res.status(400).json({ error: 'Data Error: Missing prompt or imageBase64' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Cập nhật model lên Gemini 3 Flash Preview theo yêu cầu của bạn
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          // Làm sạch chuỗi Base64 trước khi gửi đi
          data: imageBase64.split(',').pop() || "", 
          mimeType: "image/png",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim();

    return res.status(200).json({ result: text });

  } catch (error: any) {
    console.error("Worker Execution Error:", error.message);
    
    // Trả về 503 để Bot (Orchestrator) tự động xoay sang Node khác (10-19)
    return res.status(503).json({ error: error.message });
  }
}
