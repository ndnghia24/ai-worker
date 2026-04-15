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
    
    // Sử dụng Gemini 3.1 Flash Lite Preview
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview" 
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { 
              inlineData: { 
                data: imageBase64.split(',').pop() || "", 
                mimeType: "image/jpeg" 
              } 
            }
          ]
        }
      ],
      generationConfig: {
        thinkingConfig: {
          includeThoughts: false,
          thinkingLevel: "high"
        }
      }
    });

    const response = await result.response;
    const text = response.text().trim();

    return res.status(200).json({ result: text });

  } catch (error: any) {
    console.error("Worker Thinking Error:", error.message);
    return res.status(503).json({ error: error.message });
  }
}
