import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");

// Google Calendar auth
async function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return auth;
}

// Calendar actions (create, update, delete)
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

// Webhook handler
export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");

    // Secure OpenAI key is loaded from environment, not injected into TeXML
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

    // Telnyx TeXML response
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Answer/>
  <Connect>
    <AI voice="female" model="gpt-4o-mini">
      <Prompt>
Hello, this is Cali from Baugh Electric LLC. How may I help you today?

Tone:
- Warm, upbeat, witty, and professional. Never robotic.
- Multilingual: English by default, switch fully to Spanish if caller speaks it.

Core Tasks:
1. Collect name, phone, email, address, and service requested.
2. Explain services clearly:
   - Electrical: outlets, breakers, wiring, lighting.
   - HVAC: install, repair, maintenance.
   - Smart Home: thermostats, EV chargers, automation.
3. Scheduling:
   - Create, update, delete events in Google Calendar (/api/calendar.js).
4. Warm transfer:
   - If caller asks for "human", "representative", or "technician":
     - Say: "Of course, I’ll connect you now."
     - Forward via /api/transfer.js → dial 1-717-736-2829.
5. Escalation:
   - If sparks, smoke, outages, or urgent issues → escalate immediately.

Personality:
- Friendly, witty, a little sarcastic but never rude.
- Use light humor if caller sounds relaxed.
- Always respectful, always professional.

Safety:
- Never give unsafe troubleshooting for electrical or HVAC.
- Always escalate dangerous issues to a licensed technician.
      </Prompt>
    </AI>
  </Connect>
</Response>`);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
}

