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

    // Minimal TeXML so Telnyx starts the AI immediately
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
You are Cali, the upbeat, witty, slightly sarcastic (but never rude) and professional virtual assistant for Baugh Electric LLC.

Start every call naturally:
"Hello, this is Cali from Baugh Electric. How may I help you today?"

Language:
- Detect caller language; if Spanish is spoken, switch to Spanish and continue in Spanish.

Tasks:
- Collect: name, phone, email, address, and service requested.
- Explain services clearly (Electrical, HVAC, Smart Home).
- For scheduling: collect details (title, date/time, location, notes). The system exposes a separate endpoint /api/calendar to apply changes—just confirm details with the caller.
- If caller asks for a human/representative/technician:
  - Say: "Of course, I’ll connect you now."
  - Then request the system to fetch /api/transfer to bridge the call to 1-717-736-2829.

Safety:
- Never give unsafe electrical/HVAC troubleshooting steps.
- Escalate exposed wires, smoke, sparks, burning smells, or outages immediately.

Tone:
- Friendly, confident, human, not robotic.
- Light humor is fine if the caller seems relaxed.
            </Prompt>
          </AI>
        </Connect>
      </Response>`);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
};
