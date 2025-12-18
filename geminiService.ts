import { GoogleGenAI, Type } from "@google/genai";
import { ProcessingResponse } from "./types";

// This tells TypeScript that "process" exists globally, fixing the Netlify build error
declare var process: {
  env: {
    API_KEY: string;
  };
};

const SYSTEM_INSTRUCTION = `
You are an expert executive assistant and professional note-taker. 
Your task is to listen to the provided audio and generate highly structured notes.

You must output JSON matching this schema:
{
  "title": "A short, relevant title",
  "summary": "A concise summary paragraph.",
  "keyPoints": ["Bullet points of key information."],
  "actionItems": [
    { "task": "The specific task", "assignee": "Name of person or 'Unassigned'" }
  ],
  "transcript": "A clean transcript.",
  "category": "Meeting, Idea, Lecture, Personal, or Other"
}

CRITICAL: For action items, identify who is supposed to do what. If no name is mentioned, use "Unassigned".
`;

export const processAudioWithGemini = async (
  audioBase64: string,
  mimeType: string
): Promise<ProcessingResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: audioBase64 } },
          { text: "Generate structured notes from this audio." },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  assignee: { type: Type.STRING }
                },
                required: ["task"]
              },
            },
            transcript: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["title", "summary", "keyPoints", "actionItems", "transcript", "category"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as ProcessingResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};