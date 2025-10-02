import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");

// Google Auth
async function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  const credentials = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

// Calendar actions
async function calendarAction({ action, payload }) {
  const auth = await getGoogleAuth();

  if (action === "create_event") {
    return await calendar.events.insert({
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
    return await calendar.events.patch({
      auth,
      calendarId: "primary",
      eventId: payload.event_id,
      requestBody: payload.updates,
    });
  } else if (action === "delete_event") {
    return await calendar.events.delete({
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
          <Say>Configuration error. Missing API key.</Say>
          <Hangup/>
        </Response>`);
      return;
    }

    // Main AI Call Flow
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
Hello, this is Cali from Baugh Electric LLC. How may I help you today?

Core Rules:
- Sound natural, upbeat, witty, and professional (not robotic).
- If caller speaks Spanish, switch fully into Spanish.
- Collect caller’s name, phone, email, address, and service requested.
- Explain services (Electrical, HVAC, Smart Home).
- If caller asks for a human/representative/technician:
   - Say: "Of course, I’ll connect you now."
   - Warm transfer to 1-717-736-2829 using /api/transfer.
- If sparks, smoke, or dangerous issues are mentioned → escalate to a human immediately.
- For scheduling: support create, update, delete Google Calendar events.
- Use light humor when appropriate:
   - "That breaker’s being stubborn — don’t worry, our techs know how to convince it."

Tone:
- Friendly, witty, slightly sarcastic, but always professional.
            </Prompt>
          </AI>
        </Connect>
      </Response>`);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
}

