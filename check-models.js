import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
config();

async function listModels() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('API Key missing in .env');
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Note: listModels is not a direct method on genAI in some versions, 
    // it's usually part of the server-side SDK or requires a different approach.
    // However, we can try to find the models by trial and error or checking the latest.
    console.log('Trying to list models...');
    // In @google/generative-ai, there isn't a simple listModels() for client-side keys usually.
    // Let's try some common ones.
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision'];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent('test');
        console.log(`Model ${m} is AVAILABLE`);
      } catch (e) {
        console.log(`Model ${m} is NOT available: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

listModels();
