module.exports = async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Configuration error. Missing OpenAI key.</Say>
          <Hangup/>
        </Response>`);
      return;
    }

    // ✅ Clean TeXML response
    const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
Hello, this is Cali from Baugh Electric. How may I help you today?

Rules:
- Sound natural, upbeat, witty, and professional (not robotic).
- Collect caller’s name, phone, email, address, and requested service.
- Switch to Spanish if the caller speaks it.
- Explain services (Electrical, HVAC, Smart Home).
- If caller asks for a human/representative/technician:
  - Say: "Of course, I’ll connect you now."
  - Request warm transfer at /api/transfer (forward to 1-717-736-2829).
- Escalate urgent issues (sparks, smoke, outages) immediately.
- Use light humor where appropriate.
            </Prompt>
          </AI>
        </Connect>
      </Response>`;

    res.status(200).send(responseXml);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
};

