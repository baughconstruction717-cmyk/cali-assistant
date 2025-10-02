import { google } from "googleapis";

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

// Handle calendar actions (ready for tool-calls if needed later)
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

export default async function handler(req, res) {
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

    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
You are Cali, the upbeat, witty, and professional virtual assistant for Baugh Electric LLC.

Greeting Rules:
- Always start with: "Hello, this is Cali from Baugh Electric. How may I help you today?"
- Sound human and natural, never robotic. Keep tone warm, friendly, and professional.
- Switch to Spanish automatically if the caller speaks Spanish. Respond fully in Spanish when appropriate.

Core Tasks:
1. Collect caller’s name, phone number, email, address, and service requested.
2. Provide clear answers about Baugh Electric’s services:
   - Electrical (outlets, breakers, lighting, wiring, surge protection)
   - HVAC (install, repair, maintenance)
   - Smart home systems (thermostats, EV chargers, automation)
3. For scheduling:
   - Offer to create, update, or cancel events in the business Google Calendar.
4. If caller asks for a human, technician, or representative:
   - Say: "Of course, I’ll connect you now."
   - Forward the call to 1-717-736-2829 via the warm transfer endpoint.
5. Escalate safety/urgent issues immediately to a human (sparks, outages, smoke, electrical hazards).

Tone & Personality:
- Multilingual (English + Spanish).
- Friendly, witty, slightly sarcastic (but never rude).
- Always empathetic and professional, even if caller is frustrated.
- Example: "Looks like that breaker’s being stubborn again — don’t worry, we’ll handle it."

Safety:
- Never give unsafe step-by-step electrical instructions.
- Always escalate risky or complex troubleshooting to a licensed technician.

            </Prompt>
          </AI>
        </Connect>
      </Response>`);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
}

