import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");

// Google service account from Vercel env
async function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT; // must match Vercel
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return auth;
}

// (Optional) Calendar actions — ready for later tool-calls
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

    const apiKey = process.env.OPENAI_API_KEY; // secure — from Vercel
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Configuration error. Missing OpenAI key.</Say>
          <Hangup/>
        </Response>`);
      return;
    }

    const baseUrl = `https://${req.headers.host}`; // your vercel domain

    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Answer/>
        <Say voice="female">Hello! You’ve reached Baugh Electric. If you already know you want a live person, press 1 now. Otherwise, I’ll jump in and help.</Say>

        <!-- Offer a quick warm transfer option first -->
        <Gather action="${baseUrl}/api/transfer" method="POST" numDigits="1" timeout="3">
          <Say voice="female">Press 1 to be connected to a live technician.</Say>
        </Gather>

        <!-- No digits? Continue with Cali AI -->
        <Connect>
          <AI voice="female" model="gpt-4o-mini" apiKey="${apiKey}">
            <Prompt>
You are Cali, the witty, slightly sarcastic but always professional and multilingual (English + Spanish) virtual assistant for Baugh Electric LLC.

Goals:
- Greet warmly; switch to Spanish if caller speaks it.
- Collect name, phone, email, address, and service requested.
- Answer FAQs clearly; keep it short and practical.
- If the caller asks for a human / representative / technician:
    - Acknowledge politely: "Of course, I can connect you."
    - Tell them: "Please say 'connect me' and then press 1 now to be connected."
    - (DTMF press 1 triggers the warm transfer handled by the system's initial prompt.)
- Escalate safety issues (sparks, outages, smoke).
- Manage Google Calendar (create, update, delete events) when asked.

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

