import { GoogleGenAI } from "@google/genai";
import type { Message, Source } from '../types';

function getAiInstance(apiKey: string) {
  if (!apiKey) {
    throw new Error("API_KEY not provided");
  }
  return new GoogleGenAI({ apiKey: apiKey });
}

function formatMessagesForGemini(messages: Message[]) {
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
}


export async function sendMessageToGemini(
    currentMessages: Message[], 
    newMessage: string,
    apiKey: string,
    onStream: (chunkText: string, isFirstChunk: boolean) => void,
    onComplete: (sources?: Source[]) => void
): Promise<void> {
  try {
    const ai = getAiInstance(apiKey);
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: formatMessagesForGemini(currentMessages),
      config: {
          systemInstruction: 'You are a helpful assistant in a retro 1980s computer terminal. Respond like you are from that era. Keep responses concise. You now have access to the "World Wide Web" via Google Search for up-to-date information. If a query requires recent information or the user uses the /search command, use this tool. The user can use commands like /help, /settings, /font, /sound, /clear, and /search, but you should not attempt to execute them; the system handles them. For code snippets, use Markdown fences (```) with the language name, e.g., ```javascript.',
          tools: [{googleSearch: {}}],
      },
    });
    
    const stream = await chat.sendMessageStream({ message: newMessage });
    
    let isFirst = true;
    const sources: Source[] = [];

    for await (const chunk of stream) {
        const chunkText = chunk.text;
        if(chunkText) {
            onStream(chunkText, isFirst);
            if (isFirst) isFirst = false;
        }

        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
            for (const groundingChunk of groundingMetadata.groundingChunks) {
                if (groundingChunk.web && !sources.some(s => s.uri === groundingChunk.web.uri)) {
                    sources.push({
                        title: groundingChunk.web.title || groundingChunk.web.uri,
                        uri: groundingChunk.web.uri,
                    });
                }
            }
        }
    }

    onComplete(sources.length > 0 ? sources : undefined);

  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    let errorMessage: string;
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('PERMISSION_DENIED'))) {
         errorMessage = "SYSTEM ERROR: Permission denied. Please ensure your API key is valid and has the correct permissions.";
    } else {
        errorMessage = "SYSTEM ERROR: Failed to get response. Please check console.";
    }
    // Stream the error message back to the UI
    onStream(errorMessage, true);
    onComplete();
  }
}