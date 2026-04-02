import { db } from './db';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface WordAnalysis {
  definition: string;
  example: string;
  exampleTranslation: string;
  partOfSpeech: string;
  etymology: string;
  conjugation: string;
  related: string[];
  cefrLevel: string;
}

export async function analyzeWord(word: string, context: string): Promise<WordAnalysis> {
  const profile = await db.profile.toCollection().first();
  const apiKey = profile?.apiKey;
  if (!apiKey) throw new Error('API key not configured');

  const prompt = `Analyze the French word "${word}" found in this context: "${context}".

Return a JSON object with exactly these fields:
{
  "definition": "Clear English definition, 1-2 sentences",
  "example": "A natural French example sentence using this word",
  "exampleTranslation": "English translation of the example",
  "partOfSpeech": "noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection",
  "etymology": "Brief etymology showing word origin",
  "conjugation": "If verb: present tense (je/tu/il/nous/vous/ils). If not verb: empty string",
  "related": ["2-3 related French words"],
  "cefrLevel": "A1/A2/B1/B2/C1/C2"
}

Return ONLY valid JSON, no markdown.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
