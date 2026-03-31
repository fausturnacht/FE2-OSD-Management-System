import fs from 'fs';

async function checkModels() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
  if (!match) {
    console.error('API key not found in .env');
    return;
  }
  const key = match[1].trim();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (data.error) {
       console.error('API Error:', data.error);
       return;
    }
    const geminiModels = data.models
      .map(m => m.name)
      .filter(n => n.includes('gemini') || n.includes('flash') || n.includes('pro'));
    console.log('Available Models:', geminiModels);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkModels();
