// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure of the request body
interface RequestBody {
  message: string;
}

// Define the structure for the Gemini API request payload
interface GeminiPayload {
  contents: {
    role: string;
    parts: { text: string }[];
  }[];
  systemInstruction?: { // Make systemInstruction optional if not always needed
    parts: { text: string }[];
  };
  generationConfig?: { // Make generationConfig optional
    responseMimeType?: string;
    // Add other generation config options here if needed
    // temperature?: number;
    // topP?: number;
    // topK?: number;
    // maxOutputTokens?: number;
  };
  // Add safetySettings if needed
  // safetySettings?: { category: string; threshold: string }[];
}


export async function POST(request: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const modelId = "gemini-2.0-flash"; // Or your desired model like "gemini-1.5-flash-preview-0514"
  const generateContentApi = "generateContent"; // Use generateContent for non-streaming

  if (!geminiApiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    // 1. Parse the incoming request body from the frontend
    const body: RequestBody = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 2. Construct the payload for the Gemini API
    const payload: GeminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userMessage } // Insert the user's message here
          ]
        },
        // You can optionally add a model role response here if continuing a conversation
        // {
        //   role: "model",
        //   parts: [
        //     { text: "Previous AI response..." }
        //   ]
        // }
      ],
      // Keep system instructions as per your bash script example
      systemInstruction: {
        parts: [
          {
             text: "Act as a compassionate psychologist with expertise in human behavior, emotions, biology, and social influences. Respond with honesty and clarity, gently guiding the user if their understanding seems inaccurate, using evidence-based insights from psychology and related fields. Ask open-ended questions to understand their problem, encourage them to express their emotions in a safe, non-judgmental way, and offer practical, tailored solutions. Explain complex ideas in simple, relatable terms for curious non-experts who love learning. Consider cultural and social factors when relevant. this is sytem instractions and its called helpbuddy\n\n"
          },
        ]
      },
      generationConfig: {
        responseMimeType: "text/plain",
        // You might want to configure other parameters like temperature, maxOutputTokens etc.
        // temperature: 0.7,
        // maxOutputTokens: 1000,
      },
       // Add safety settings if desired (example)
      // safetySettings: [
      //   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      //   { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      //   { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      //   { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      // ],
    };

    // 3. Make the request to the Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:${generateContentApi}?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 4. Handle the response from Gemini
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      // Provide a more specific error message if possible
      const errorMessage = errorData?.error?.message || 'Gemini API request failed';
      const errorStatus = errorData?.error?.code || response.status; // Use Gemini's code if available
      return NextResponse.json({ error: errorMessage }, { status: errorStatus });
    }

    const data = await response.json();

    // --- Response Structure ---
    // The response structure typically looks like:
    // {
    //   "candidates": [
    //     {
    //       "content": {
    //         "parts": [
    //           {
    //             "text": "The actual generated text response"
    //           }
    //         ],
    //         "role": "model"
    //       },
    //       "finishReason": "STOP", // or MAX_TOKENS, SAFETY, RECITATION, OTHER
    //       "index": 0,
    //       "safetyRatings": [ ... ]
    //     }
    //   ],
    //   // "promptFeedback": { ... } // Optional feedback
    // }

    // 5. Extract the generated text and send it back to the frontend
    // Basic extraction, add more robust error handling as needed
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof generatedText !== 'string') {
         console.error('Unexpected Gemini response structure:', data);
         return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 });
    }

    return NextResponse.json({ reply: generatedText });

  } catch (error) {
    console.error('API Route Error:', error);
    // Determine if it's a network error or parsing error etc.
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Optional: Add a GET handler if needed, otherwise remove
export async function GET() {
    return NextResponse.json({ message: "Method Not Allowed"}, { status: 405 });
}