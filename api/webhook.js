import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");

// Authenticate Google Calendar with service account
async function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY env var");
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return auth;
}

// Calendar actions handler
async function calendarAction({ action, payload }) {
  const auth = await getGoogleAuth();
  if (action === "create_event") {
    await calendar.events.insert({
      auth,
      calendarId: "primary",
      resource: payload,
    });
  } else if (action === "update_event") {
    await calendar.events.update({
      auth,
      calendarId: "primary",
      eventId: payload.event_id,
      resource: payload.updates,
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
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  // Use env var for OpenAI API key (secure)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is missing");
  }

  // Telnyx call control XML response
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Answer/>
      <Connect>
        <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
          <Prompt>
You are Cali, the witty, slightly sarcastic but always professional and multilingual (English + Spanish) virtual assistant for Baugh Electric LLC.

Goals:
- Greet warmly, switch to Spanish if caller speaks it.
- Collect name, phone, email, address, and service requested.
- Answer FAQs clearly; be brief and practical.
- If caller asks for a human/representative/technician, confirm politely and warm-transfer to 1-717-736-2829.
- Escalate safety or urgent issues (sparks, outages, smoke).
- Manage Google Calendar (create, update, delete events).

Tone:
- Friendly, confident, witty, sometimes sarcastic — but always professional.
          </Prompt>
        </AI>
      </Connect>
    </Response>`);
}

