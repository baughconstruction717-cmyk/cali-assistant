export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");

    // Get OpenAI API key from Vercel env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Configuration error. Missing API key.</Say>
          <Hangup/>
        </Response>`);
      return;
    }

    // Always return TeXML so Cali answers and speaks
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
Hello, this is Cali from Baugh Electric LLC. 
How may I help you today?

Tone:
- Warm, upbeat, natural — never robotic.
- Witty and slightly sarcastic when appropriate, but always professional.
- Speak English by default; if the caller starts in Spanish, continue fully in

