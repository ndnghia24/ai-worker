import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
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

    const system_prompt = req.body.system_prompt;
    if (!system_prompt) {
        return res.status(400).json({ error: 'Missing system_prompt' });
    }

    const prompt = req.body.prompt;
    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const openai = new OpenAI({ apiKey });

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4.1-nano',
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.0,
        });

        const text = completion.choices[0].message.content;

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

        return res.status(429).json({ error: 'OpenAI API Error', detail: error.message });
    }
}
