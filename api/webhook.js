import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");

async function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY env var");
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return auth;
}

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
        location: payload.location
      }
    });
  } else if (action === "update_event") {
    await calendar.events.patch({
      auth,
      calendarId: "primary",
      eventId: payload.event_id,
      requestBody: payload.updates
    });
  } else if (action === "delete_event") {
    await calendar.events.delete({
      auth,
      calendarId: "primary",
      eventId: payload.event_id
    });
  }
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Configuration error. Missing OpenAI API key.</Say>
        <Hangup/>
      </Response>`);
    return;
  }

  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Answer/>
      <Connect>
        <AI voice="female" model="gpt-4o-mini" apiKey="${openaiKey}">
          <Prompt>
You are Cali, the witty, slightly sarcastic but always professional and multilingual (English + Spanish) virtual assistant for Baugh Electric LLC.
Goals:
- Greet warmly, speak English or Spanish based on caller.
- Collect name, phone, email, address, and service requested.
- Answer FAQs clearly; be brief and practical.
- If caller requests a human/representative/technician, say you're connecting them and warm-transfer to 1-717-736-2829.
- If safety/urgent issues arise (sparks, smoke, outages), escalate to a human.
- You can create, update, and delete calendar events when asked.
Tone:
- Friendly, confident, witty, sometimes sarcastic, but always professional.
          </Prompt>
        </AI>
      </Connect>
    </Response>`);
}

