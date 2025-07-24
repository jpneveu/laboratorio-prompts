// api/gemini-proxy.js

// This is a Vercel Serverless Function.
// It acts as a secure proxy to the Gemini API.

export default async function handler(request, response) {
  // 1. Only allow POST requests for security
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Get the user's prompt from the request body
  const { prompt } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is missing.' });
  }

  // 3. Get the secret API key from Vercel's Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      return response.status(500).json({ error: 'API key not configured on the server.' });
  }

  // --- FIX: Updated model name from gemini-pro to gemini-1.0-pro ---
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`;

  try {
    // 4. Make the server-to-server call to the Gemini API
    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    // Handle potential errors from the Gemini API itself
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      return response.status(geminiResponse.status).json({ error: `Gemini API error: ${errorText}` });
    }

    const data = await geminiResponse.json();
    
    // 5. Send the successful response back to the frontend
    return response.status(200).json(data);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
