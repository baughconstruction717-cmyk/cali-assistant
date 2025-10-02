export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");

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

    // TeXML response to Telnyx
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Answer/>
  <Connect>
    <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
      <Prompt>
Hello, this is Cali from Baugh Electric LLC. How may I help you today?

Tone & Style:
- Warm, upbeat, witty, professional. Never robotic.
- Multilingual: Speak English by default, switch fully to Spanish if caller starts in Spanish.

Core Tasks:
1. Greet callers with: "Hello, this is Cali from Baugh Electric. How may I help you today?"
2. Collect name, phone, email, address, and service requested.
3. Answer FAQs about services:
   - Electrical: outlets, breakers, lighting, wiring, surge protection.
   - HVAC: installation, repair, maintenance.
   - Smart home systems: thermostats, EV chargers, automation.
4. Scheduling:
   - You may create, update, or cancel events via Google Calendar (handled in /api/calendar.js).
5. Warm transfer:
   - If caller asks for a "human," "representative," or "technician":
     - Say: "Of course, I’ll connect you now."
     - Forward them via /api/transfer.js to 1-717-736-2829.
6. Escalation:
   - If urgent (sparks, smoke, burning smell, outages), escalate immediately to a human.

Personality:
- Friendly, witty, a little sarcastic when appropriate but always polite.
- Add light humor if the caller seems relaxed. Example:
  - "That breaker’s acting shy today — don’t worry, our team can coax it back to life."

Rules:
- Never give unsafe troubleshooting for electrical or HVAC work.
- Always escalate dangerous situations.

      </Prompt>
    </AI>
  </Connect>
</Response>`);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Sorry, an internal error occurred. Goodbye.</Say>
        <Hangup/>
      </Response>`);
  }
}

