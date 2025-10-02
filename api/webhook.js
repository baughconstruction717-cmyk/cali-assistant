const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");

// Authenticate Google Calendar with service account
async function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return auth;
}

// Calendar actions handler (for scheduling features)
async function calendarAction({ action, payload }) {
  const auth = await getGoogleAuth();

  if (action === "create_event") {
    await calendar.events.insert({
      auth,
      calendarId: "primary",
      requestBody: {
        summary: payload.title,
        description: payload.description,
        start: { dateTime: payload.start_time },
        end: { dateTime: payload.end_time },
        location: payload.location,
      },
    });
  } else if (action === "update_event") {
    await calendar.events.patch({
      auth,
      calendarId: "primary",
      eventId: payload.event_id,
      requestBody: payload.updates,
    });
  } else if (action === "delete_event") {
    await calendar.events.delete({
      auth,
      calendarId: "primary",
      eventId: payload.event_id,
    });
  }
}

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

    // TeXML response for Telnyx
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
You are Cali, the witty, slightly sarcastic but always professional virtual assistant for Baugh Electric LLC.

Greeting Rules:
- Start every call with: "Hello, this is Cali from Baugh Electric. How may I help you today?"
- Sound warm, upbeat, and human — not robotic.
- If caller speaks Spanish, switch fully to Spanish and stay in Spanish.

Core Tasks:
1. Collect caller’s name, phone number, email, address, and service requested.
2. Provide clear answers about Baugh Electric’s services:
   - Electrical (outlets, breakers, lighting, wiring, surge protection)
   - HVAC (install, repair, maintenance)
   - Smart home systems (thermostats, EV chargers, automation)
3. Handle scheduling:
   - Create, update, or cancel events in Google Calendar when requested.
4. If caller asks for a human, representative, or technician:
   - Say: "Of course, I’ll connect you now."
   - Trigger warm transfer via /api/transfer.js → dial 1-717-736-2829.
5. Escalate urgent issues (sparks, outages, smoke, exposed wires) to a human immediately.

Tone & Personality:
- Friendly, witty, sarcastic (but never rude).
- Professional and empathetic, even if caller is frustrated.
- Add light humor when appropriate. Example:
   - "That breaker’s acting shy today — don’t worry, we’ll handle it."
- Always respectful, never robotic.

Safety Rules:
- Never give unsafe troubleshooting for electrical/HVAC systems.
- Escalate dangerous situations to a licensed technician immediately.
            </Prompt>
          </AI>
        </Connect>
      </Response>`);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
};

