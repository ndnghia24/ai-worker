// file: api/worker.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { prompt, imageBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!prompt || !imageBase64) return res.status(400).json({ error: 'Missing data' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Cập nhật model lên Gemini 3.1 Flash Preview
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-preview" });

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: "image/png" } },
    ]);

    const response = await result.response;
    res.status(200).json({ result: response.text().trim() });
  } catch (error) {
    // Trả về lỗi 503 nếu API bị limit để Orchestrator biết đường xoay worker
    res.status(503).json({ error: error.message });
  }
}
