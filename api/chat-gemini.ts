import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './logglyClient.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const requestTime = new Date().toISOString();

    logger.info('API request received', {
        time: requestTime,
        method: req.method,
        path: req.url,
        body: req.body,
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests allowed' });
    }

    const prompt = req.body.prompt;
    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }

    const system_prompt = req.body.system_prompt;
    if (!system_prompt) {
        return res.status(400).json({ error: 'Missing system_prompt' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        systemInstruction: system_prompt,
    });

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        logger.info('API response sent', {
            time: new Date().toISOString(),
            method: req.method,
            path: req.url,
            response: {
                status: 200,
                text,
            }
        });

        return res.status(200).json({ text });
    } catch (error: any) {
        logger.error('Error occurred while processing API request', {
            time: new Date().toISOString(),
            method: req.method,
            path: req.url,
            error: {
                message: error.message,
                stack: error.stack,
            }
        });

        return res.status(429).json({ error: 'Gemini API Error', detail: error.message });
    }
}
