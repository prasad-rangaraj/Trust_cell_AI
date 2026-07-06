import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import 'dotenv/config';

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  // Just send a very short dummy base64 string to see if it complains about mimeType
  // This is a tiny valid 1x1 pixel gif base64, but we'll pretend it's audio to test the mime type validator
  // Actually, Gemini will probably complain it's not valid audio. 
  // Let's just create an empty file or dummy audio if needed, or just see the error.
  const dummyBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // tiny valid RIFF WAV header just in case, but let's test mimeType 'audio/m4a'
  
  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/m4a',
          data: dummyBase64,
        },
      },
      { text: 'Transcribe this' },
    ]);
    console.log(result.response.text());
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
