
// Use gemini-3-flash-preview for optimized audio processing and summarization
import { GoogleGenAI, Type } from "@google/genai";
import { ProcessingResponse } from "./types";

const SYSTEM_INSTRUCTION = `
You are an expert executive assistant and professional note-taker. 
Your task is to listen to the provided audio (which could be a meeting, a lecture, a voice memo, or a conversation) and generate a highly structured set of notes.

You must output JSON matching this schema:
{
  "title": "A short, relevant title for the note",
  "summary": "A concise paragraph summarizing the main purpose and content.",
  "keyPoints": ["Array of strings, each being a key bullet point."],
  "actionItems": [
    { "task": "The specific task to be done", "assignee": "Name of person responsible, or 'Team'/'Unassigned'" }
  ],
  "transcript": "A clean, readable transcript of the audio.",
  "category": "One word category: Meeting, Idea, Lecture, Personal, or Other"
}

CRITICAL INSTRUCTION FOR ACTION ITEMS:
- Listen carefully for who is assigned to a task (e.g., "John will handle the report" -> assignee: "John").
- If 'I' or 'me' is used, infer the speaker if possible, or use "Speaker".
- If no specific person is mentioned, use "Unassigned".

Ensure the transcript is accurate but cleans up stuttering or filler words slightly for readability.
If no specific action items are found, return an empty array for that field.
`;

export const processAudioWithGemini = async (
  audioBase64: string,
  mimeType: string
): Promise<ProcessingResponse> => {
  try {
    // Create new GoogleGenAI instance before the call to ensure fresh API key context
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Updated to gemini-3-flash-preview for latest reasoning capabilities
    const modelId = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
          },
          {
            text: "Listen to this audio and generate structured notes.",
          },
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
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
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
    console.error("Gemini Processing Error:", error);
    throw error;
  }
};
