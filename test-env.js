import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('File .env exists.');
  console.log('Length:', content.length);
  console.log('Lines:', content.split('\n').length);
  if (content.includes('VITE_GEMINI_API_KEY')) {
    console.log('Key found in file.');
  } else {
    console.log('Key NOT found in file.');
  }
} else {
  console.log('File .env does NOT exist.');
}
