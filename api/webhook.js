import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");

// Authenticate Google Calendar with service account (from Vercel env var)
async function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT; // <- matches Vercel
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return auth;
}

// Calendar actions handler (you can call this from your AI tool-calls later)
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

    // Use env var for OpenAI key (kept out of your code/repo)
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

    // Return TeXML for Telnyx
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
You are Cali, the witty, slightly sarcastic but always professional and multilingual (English + Spanish) virtual assistant for Baugh Electric LLC.

Goals:
- Greet warmly; switch to Spanish if caller speaks it.
- Collect name, phone, email, address, and service requested.
- Answer FAQs clearly; be brief and practical.
- If caller asks for a human/representative/technician, confirm politely and warm-transfer to 1-717-736-2829.
- Escalate safety or urgent issues (sparks, outages, smoke).
- Manage Google Calendar (create, update, delete events).

Tone:
- Friendly, confident, witty—never at the caller’s expense; always professional.
            </Prompt>
          </AI>
        </Connect>
      </Response>`);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
}

