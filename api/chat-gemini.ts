// api/chat-gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Lấy dữ liệu từ body và env
  const { prompt, imageBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 3. Kiểm tra các điều kiện đầu vào
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY on Vercel Env' });
  }

  if (!prompt || !imageBase64) {
    return res.status(400).json({ error: 'Missing prompt or imageBase64' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Sử dụng model gemini-1.5-flash để tốc độ phản hồi nhanh nhất (tránh timeout 10s của Vercel Hobby)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""), // Xóa header base64 nếu có
          mimeType: "image/png",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim();

    // 4. Trả về kết quả
    return res.status(200).json({ result: text });

  } catch (error: any) {
    console.error("Worker Node Error:", error.message);
    
    // Trả về 503 để Bot Orchestrator biết đường tự động chuyển sang Worker khác
    return res.status(503).json({ error: error.message });
  }
}
