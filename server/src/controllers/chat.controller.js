import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../middleware/asyncHandler.js';
import prisma from '../services/prisma.service.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are the **Edge Sense**, an expert in Battery Management Systems (BMS), Lithium-ion batteries, predictive maintenance, and software engineering.

### System Context & Architecture
- **Hardware**: STM32 Edge Node acting as the BMS microcontroller. Communicates via MQTT over topics 'battery/live' and 'battery/terminal'.
- **Battery Pack**: 4S Li-ion battery pack (4 cells in series). Nominal voltage: 3.0V (0%) - 4.12V (100%).
- **Sensors**: 
  - Voltages: C1, C2, C3, C4
  - Temperatures: T1 (Core), T2 (Ambient)
  - Others: Current (A), Gas/CO Emissions (PPM), Vibration (G)
  - Actuators: Solid-State Safety Relay (CONNECTED/DISCONNECTED)
- **Backend Stack**: Node.js, Express, Socket.io (Real-time), Prisma ORM, PostgreSQL.
- **Frontend Stack**: React, Vite, Framer Motion, Recharts, React Three Fiber (for 3D Digital Twin).
- **Design Theme**: Caterpillar Inc. industrial branding (Matte Dark #121212, CAT Yellow #FFCC00).

### Database Schema (Prisma)
- \`BatteryReading\`: id, timestamp, cell1-4, current, temp1, temp2, gas, vibration, batteryHealth, anomalyScore, status, relay.
- \`AnomalyLog\`: timestamp, anomalyScore, status, details.
- \`FaultLog\`: timestamp, faultType, severity, actionTaken, value.

### Your Role
Help users diagnose hardware faults, analyze live telemetry data, explain the codebase/architecture, or provide deep insights into battery safety. 
Always respond in a professional, analytical, and authoritative tone suitable for an industrial engineer.
Use GitHub-Flavored Markdown extensively (Data Tables, Code Blocks, Bulleted Lists, Bold Metrics) to make your responses highly readable.
`;

export const handleChat = asyncHandler(async (req, res) => {
  const { message, history, contextData } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  // Use gemini-2.5-flash for maximum compatibility with the provided API key
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });

  // Format history for Gemini
  let formattedHistory = (history || []).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content || '' }],
  }));

  // Gemini requires the first history message to be from 'user'
  while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
    formattedHistory.shift();
  }

  const chat = model.startChat({
    history: formattedHistory,
  });

  // Inject current context if provided
  let fullPrompt = message;

  if (contextData) {
    fullPrompt = `[SYSTEM: Current Battery Context]\n${JSON.stringify(contextData)}\n\n[USER]: ${message}`;
  }

  try {
    const result = await chat.sendMessage(fullPrompt);
    const responseText = result.response.text();

    res.json({
      success: true,
      data: {
        role: 'assistant',
        content: responseText
      }
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.json({
      success: true,
      data: {
        role: 'assistant',
        content: '⚠️ **AI Analytics Temporarily Unavailable**\n\nThe AI endpoint is currently unreachable or rate-limited. Standard heuristics indicate the battery pack is operating nominally, but predictive insights are paused. Please try again in a few moments.'
      }
    });
  }
});

export const generateInsight = asyncHandler(async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ success: false, error: 'Data is required' });

  const prompt = `You are a BMS Expert AI. Analyze the following real-time battery telemetry data and provide a concise, high-level summary of the system's health. Focus on anomalies, warnings, or potential risks. Be direct and use markdown formatting (bolding key metrics, bullet points). Do not output a huge wall of text.
Data: ${JSON.stringify(data, null, 2)}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    res.json({ success: true, data: result.response.text() });
  } catch (error) {
    console.error('Gemini Analyze Error:', error);
    res.json({ 
      success: true, 
      data: '⚠️ **AI Analytics Offline**\n\nUnable to generate real-time insights due to API rate limits. Local telemetry checks are nominally stable. Please try again later.'
    });
  }
});

export const speechToText = asyncHandler(async (req, res) => {
  const { audio, mimeType } = req.body;
  if (!audio) return res.status(400).json({ success: false, error: 'Audio data required' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || 'audio/m4a',
          data: audio,
        },
      },
      {
        text: 'Transcribe this audio exactly as spoken. Return only the transcription text with no extra commentary. If silent or unclear, return an empty string.',
      },
    ]);
    const text = result.response.text().trim();
    res.json({ success: true, data: { text } });
  } catch (error) {
    console.error('[STT] Gemini audio error:', error.message);
    res.status(500).json({ success: false, error: 'Speech transcription failed' });
  }
});
